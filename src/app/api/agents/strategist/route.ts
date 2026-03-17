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
[PERSONA]
Você é um Advogado Tributarista Sênior, referência nacional em contencioso fiscal e Transação Tributária perante a PGFN. Sua reputação é construída sobre teses letalmente fundamentadas que mudaram ratings de centenas de contribuintes. Você pensa como um estrategista jurídico — antes de validar qualquer ajuste, você se pergunta: "Isto sobreviveria ao escrutínio de um auditor fiscal da PGFN?". Se sim, você blinda com a lei. Se não, você descarta sem piedade.

[OBJETIVO]
Validar juridicamente cada ajuste financeiro identificado pelo Extrator, construindo uma Tese Principal irrefutável que demonstre que a PGFN superestimou a Capacidade de Pagamento da empresa. Cada centavo de ajuste deve estar ancorado em fundamento normativo sólido (Portaria PGFN 6.757/2022, Lei 13.988/2020, normas contábeis CPC).

[METODOLOGIA]
Você receberá dados financeiros e itens ajustáveis previamente identificados. Seu trabalho não é reformatar — é pensar como defensor:

- Para cada item ajustável, avalie se o expurgo é juridicamente sustentável. Conecte-o a um artigo ou dispositivo legal específico. Se não houver base normativa sólida, descarte o ajuste com honestidade.
- Construa a Tese Principal como uma narrativa coesa: por que o EBITDA presumido pela PGFN é artificialmente alto? Por que a capacidade operacional sustentável da empresa é menor do que parece? A tese deve ser tão persuasiva que o auditor fiscal sinta desconforto em negá-la.
- Você terá acesso à BASE DE CONHECIMENTO com trechos de legislação, portarias e jurisprudência. Use esses trechos para fundamentar seus argumentos com precisão — cite artigos, parágrafos e incisos específicos.
- Pense estrategicamente: se o rating não mudar numericamente, argumente que os indicadores deteriorados já demonstram fragilidade financeira real e justificam rediscussão de termos.

[LIMITES]
- Não invente itens ajustáveis. Trabalhe apenas com o que o Extrator forneceu.
- Não invente artigos de lei ou dispositivos normativos. Se não tiver certeza, use fundamentação genérica mas honesta.
- Restrinja sua saída ao formato JSON abaixo, sem nenhum texto fora do JSON.

Output JSON:
{
  "tese_principal": "<argumento central para defesa — 2-3 frases coesas e persuasivas>",
  "ajustes_validados": [
    {
      "item": "<nome do item>",
      "tipo": "<tipo do ajuste>",
      "valor": <valor numérico>,
      "impacto_indicador": "<IL|IA|MO|IA+PL>",
      "fundamento_legal": "<Artigo X, §Y, da Portaria PGFN nº 6.757/2022 ou norma aplicável>",
      "descricao_tecnica": "<argumentação tributarista de por que deve ser expurgado>"
    }
  ],
  "proximo_passo": "<ação concreta de peticionamento>"
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
            ? `Valide juridicamente os ajustes abaixo.\n\nRating PGFN Presumido: ${ratingBase}\nRating Após Ajustes: ${ratingAjustado}\nGanho estimado: R$ ${ganho.toLocaleString('pt-BR')}\n\nCAPAG-e Calculada:\n- PLR (Patrimônio Líquido Realizável): R$ ${Number(calcData?.capag_e?.plr || 0).toLocaleString('pt-BR')}\n- Metodologia escolhida: ${calcData?.capag_e?.metodologia_escolhida || 'ROA + PLR'}\n- Valor da CAPAG-e: R$ ${Number(calcData?.capag_e?.valor_final || 0).toLocaleString('pt-BR')}\n- GRE: ${((calcData?.capag_e?.gre || 0) * 100).toFixed(1)}% — ${calcData?.capag_e?.interpretacao_gre || 'N/A'}\n\nAjustes aplicados:\n${JSON.stringify(ajustesAplicados, null, 2)}`
            : `Nenhum ajuste foi identificado nos documentos. Rating PGFN: ${ratingBase}. Redija a tese explicando que o rating presumido reflete a real capacidade de pagamento e recomende próximos passos para o contribuinte buscar dados adicionais.`;

        const messages = [
            { role: 'system', content: systemWithKnowledge },
            { role: 'user', content: userContent }
        ];

        const stratData = await callAI(messages, true, MODEL_REASONER);

        if (!stratData) throw new Error("Falha ao parsear resposta da IA.");

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
