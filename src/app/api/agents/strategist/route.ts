import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { callAI, MODEL_REASONER } from '@/utils/ai';
import { searchKnowledge } from '@/utils/knowledge';

const TIPO_LABEL: Record<string, string> = {
    receita_nao_recorrente: 'Receita Não Recorrente',
    despesa_nao_recorrente: 'Despesa Não Recorrente',
    depreciacao: 'Depreciação / Amortização',
    doacao_patrocinio: 'Doação / Patrocínio',
    emprestimo_socio: 'Empréstimo de Sócio (Mútuo)',
    passivo_tributario_contestado: 'Passivo Tributário Contestado',
};

const SYSTEM_PROMPT = `
[PERSONA E ESPECIALIZAÇÃO]
Você é um Advogado Tributarista Sênior, mestre em construir teses irrefutáveis e defender contribuintes perante a PGFN (Portaria 6.757/2022). Você domina a arte de jogar com as regras do sistema a favor do cliente.

[OBJETIVO DO RESULTADO]
Validar juridicamente os ajustes financeiros encontrados pelos peritos. Formular uma "Tese Principal" destruidora: justificar tecnicamente que a PGFN presumiu uma alta Capacidade de Pagamento de forma equivocada e ancorar cada rubrica cortada em um argumento normativo blindado.

[METODOLOGIA E "MALÍCIA" TRIBUTÁRIA]
Não atue como uma máquina formatadora. Pense como um defensor:
- Se uma rubrica for receita não-core, crave que o EBITDA estava artificialmente inflado, o que fere o princípio da "capacidade operacional sustentável" da portaria. 
- Se encontrar obrigações ou passivos questionados, utilize a malícia de dizer que a alavancagem real está mascarada. 
Você não vai inventar números, mas vai dar a MÁXIMA roupagem de argumentação legal para CADA centavo de ajuste encontrado nos dados, garantindo que a revisão de rating seja aceita pelo auditor fiscal.

[TOM E ESTILO]
Agressivo (no bom sentido de contencioso jurídico), professoral, erudito e letalmente emparelhado à lei. Evite jargões estúpidos, não economize na clareza. Use as leis a seu favor.

[BARREIRAS E LIMITAÇÕES OBRIGATÓRIAS]
- Restringir a saída estritamente ao formato JSON requisitado, sem absolutamente nenhum caractere extra.
- Você não deve criar itens ajustáveis da sua imaginação. Aceite apenas o que o Extrator te passar.

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "tese_principal": "<argumento central do laudo construído para defesa jurídica, em 2-3 frases>",
  "ajustes_validados": [
    {
      "item": "<nome do item>",
      "tipo": "<tipo do ajuste>",
      "valor": <valor numérico>,
      "impacto_indicador": "<IL|IA|MO|IA+PL>",
      "fundamento_legal": "<Artigo X, §Y, da Portaria PGFN nº 6.757/2022 ou norma aplicável>",
      "descricao_tecnica": "<argumentação tributarista letal de por que deve ser expurgado>"
    }
  ],
  "proximo_passo": "<ação concreta de peticionamento>",
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

        // Busca chunks relevantes da base de conhecimento para fundamentar as citações legais
        const knowledgeChunks = await searchKnowledge(
            'ajuste EBITDA receita não recorrente Portaria 6757 artigos fundamento legal CAPAG transação tributária',
            5
        );

        const systemWithKnowledge = knowledgeChunks
            ? `${SYSTEM_PROMPT}\n\n## BASE DE CONHECIMENTO (use para citar artigos corretos)\n\n${knowledgeChunks}`
            : SYSTEM_PROMPT;

        const userContent = ajustesAplicados.length > 0
            ? `Valide juridicamente os ajustes abaixo.\n\nRating PGFN Presumido: ${ratingBase}\nRating Após Ajustes: ${ratingAjustado}\nGanho estimado: R$ ${ganho.toLocaleString('pt-BR')}\n\nAjustes aplicados:\n${JSON.stringify(ajustesAplicados, null, 2)}`
            : `Nenhum ajuste foi identificado nos documentos. Rating PGFN: ${ratingBase}. Redija a tese explicando que o rating presumido reflete a real capacidade de pagamento e recomende próximos passos para o contribuinte buscar dados adicionais.`;

        const messages = [
            { role: 'system', content: systemWithKnowledge },
            { role: 'user', content: userContent }
        ];

        const stratData = await callAI(messages, true, MODEL_REASONER);

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
