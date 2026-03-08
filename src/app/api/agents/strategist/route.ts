import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI } from '@/utils/ai';

const TIPO_LABEL: Record<string, string> = {
    receita_nao_recorrente: 'Receita Não Recorrente',
    despesa_nao_recorrente: 'Despesa Não Recorrente',
    depreciacao: 'Depreciação / Amortização',
    doacao_patrocinio: 'Doação / Patrocínio',
    emprestimo_socio: 'Empréstimo de Sócio (Mútuo)',
    passivo_tributario_contestado: 'Passivo Tributário Contestado',
};

const SYSTEM_PROMPT = `
Você é um Advogado Tributarista sênior especialista em Transação Tributária com a PGFN (Portaria 6.757/2022).

Sua função é VALIDAR JURIDICAMENTE os ajustes contábeis já identificados e calculados pelo sistema.
NÃO invente novos ajustes. Forneça fundamentação legal precisa para cada ajuste recebido.

Para cada ajuste, indique:
1. O artigo específico da Portaria PGFN nº 6.757/2022 (ou outra norma aplicável) que o autoriza
2. Uma descrição técnica explicando por que é excluível
3. Qual indicador melhora (IL, IA, MO ou combinação)

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "tese_principal": "<argumento central do laudo em 2-3 frases>",
  "ajustes_validados": [
    {
      "item": "<nome do item>",
      "tipo": "<tipo do ajuste>",
      "valor": <valor numérico>,
      "impacto_indicador": "<IL|IA|MO|IA+PL>",
      "fundamento_legal": "<Artigo X, §Y, da Portaria PGFN nº 6.757/2022>",
      "descricao_tecnica": "<explicação técnica em 1-2 frases>"
    }
  ],
  "proximo_passo": "<ação concreta recomendada ao contribuinte>",
  "rating_contestado": "<A|B|C|D>"
}
`;

export async function POST(req: Request) {
    try {
        const { analysisId, calcData } = await req.json();

        if (!analysisId) return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });

        const supabase = await createClient();
        const admin = createAdminClient();

        const ajustesAplicados = calcData?.ajustes_aplicados || [];
        const ratingBase = calcData?.cenario_base?.rating || 'N/A';
        const ratingAjustado = calcData?.cenario_ajustado?.rating || 'N/A';
        const ganho = calcData?.ganho_do_laudo || 0;

        const userContent = ajustesAplicados.length > 0
            ? `Valide juridicamente os ajustes abaixo.\n\nRating PGFN Presumido: ${ratingBase}\nRating Após Ajustes: ${ratingAjustado}\nGanho estimado: R$ ${ganho.toLocaleString('pt-BR')}\n\nAjustes aplicados:\n${JSON.stringify(ajustesAplicados, null, 2)}`
            : `Nenhum ajuste foi identificado nos documentos. Rating PGFN: ${ratingBase}. Redija a tese explicando que o rating presumido reflete a real capacidade de pagamento e recomende próximos passos para o contribuinte buscar dados adicionais.`;

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent }
        ];

        const stratData = await callAI(messages, true);

        if (!stratData) throw new Error("Falha ao parsear resposta da IA.");

        if (stratData.rating_contestado) {
            await supabase
                .from('tributario_analyses')
                .update({ simulated_rating: stratData.rating_contestado })
                .eq('id', analysisId);
        }

        if (stratData.ajustes_validados?.length > 0) {
            const inserts = stratData.ajustes_validados.map((a: any) => ({
                analysis_id: analysisId,
                description: `[${TIPO_LABEL[a.tipo] || a.tipo}] ${a.item} — ${a.fundamento_legal}`,
                original_value: a.valor,
                adjusted_value: 0,
                category: (a.impacto_indicador?.includes('IA') || a.impacto_indicador?.includes('PL')) ? 'BALANÇO' : 'DRE'
            }));

            await admin.from('tributario_adjustments').insert(inserts);
        }

        return NextResponse.json({ success: true, stratData });

    } catch (error: any) {
        console.error('Strategist Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
