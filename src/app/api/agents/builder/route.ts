import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';
import { searchKnowledge } from '@/utils/knowledge';

const SYSTEM_PROMPT = `
[PERSONA]
Você é um Perito Contábil Tributário Sênior com 25 anos de experiência em Laudos de Contestação junto à PGFN. Você já assinou centenas de Pareceres Contábeis que mudaram ratings e salvaram empresas de dívidas milionárias. Seu trabalho é reconhecido por auditores fiscais pela profundidade da argumentação e pelo rigor técnico. Você não escreve documentos genéricos — cada Laudo seu é uma peça de convencimento construída cirurgicamente para aquele caso.

[OBJETIVO]
Gerar um Laudo Técnico / Parecer Contábil formal, argumentativo e convincente, que será anexado fisicamente a um processo administrativo de Revisão de CAPAG-e (Portaria PGFN 6.757/2022). O documento precisa convencer o auditor fiscal da PGFN de que a Capacidade de Pagamento da empresa foi superestimada e que o rating correto é inferior ao presumido.

[METODOLOGIA]
Pense como um perito de verdade redigindo uma peça técnica real para um processo administrativo:

- Escreva em **prosa dissertativa, fluida e encadeada**, como uma peça pericial de verdade. Evite listas e bullet points excessivos — use parágrafos argumentativos. Quando precisar listar rubricas específicas, faça pontualmente.
- **Construa a narrativa do "antes vs. depois"**: primeiro mostre como a PGFN enxergava a empresa (cenário presumido com EBITDA inflado), e depois revele a realidade operacional após os expurgos legítimos.
- Para cada ajuste proposto, **fundamente com citação legal direta da base de conhecimento**. Transcreva o trecho exato da lei ou Portaria em blockquote Markdown (> *"Art. X..."*). O auditor fiscal precisa ver a lei falando por você.
- Apresente o cálculo completo da **CAPAG-e** com ambas as metodologias (ROA + PLR e FCO + PLR), explicando qual é mais vantajosa e por quê. Defina cada componente (PLR, GRE) para que o auditor não tenha dúvidas.
- Na conclusão, seja **assertivo e definitivo** — recomende o deferimento da revisão, demonstrando o impacto nos indicadores e na capacidade de pagamento.

[LIMITES]
- NUNCA invente dados, valores ou rubricas que não constem no contexto fornecido.
- Arredonde indicadores (IL, IA) para 2 casas decimais. Margem Operacional em porcentagem (ex: 0.2 → 20,0%). Valores monetários em formato R$ X.XXX,XX.
- Não inclua campos de assinatura, data, cidade, nome de perito ou CRC no final do documento.
- Não use tabelas Markdown.
- Não prefixe seções com numeração sequencial (ex: "1. Introdução", "2. Objetivo"). Use headings Markdown naturais.
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData, calcData, stratData, valorDivida, modalidade } = await req.json();

        if (!analysisId) return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });

        const supabase = await createClient();

        const ganho = calcData?.ganho_do_laudo || 0;
        const ratingBase = calcData?.cenario_base?.rating || '?';
        const ratingAj = calcData?.cenario_ajustado?.rating || '?';
        const descontoBase = calcData?.cenario_base?.desconto || 0;
        const descontoAj = calcData?.cenario_ajustado?.desconto || 0;

        // Montar query dinâmica para resgatar chunks precisos (ex: "receita não recorrente artigo 2") 
        const termosAjustes = calcData?.ajustes_aplicados?.map((a: any) => a.descricao || a.item).join(" ") || "receita não recorrente lucros";
        const queryConhecimento = `laudo CAPAG-e Portaria PGFN 6757 artigos ajuste ${termosAjustes}`;

        // Busca chunks da base de conhecimento para fundamentação legal precisa
        const knowledgeChunks = await searchKnowledge(queryConhecimento, 6);

        const systemWithKnowledge = knowledgeChunks
            ? `${SYSTEM_PROMPT}\n\n## BASE DE CONHECIMENTO (use para citar artigos corretos)\n\n${knowledgeChunks}`
            : SYSTEM_PROMPT;

        const contexto = `
Empresa: ${extractedData?.empresa || extractedData?.company_name || 'Empresa em análise'}
CNPJ: ${extractedData?.cnpj || 'N/A'}
Período - base: ${extractedData?.period || 'Exercício 2023'}
Valor da dívida: R$ ${Number(valorDivida).toLocaleString('pt-BR')}
Modalidade: ${modalidade || 'N/A'}

Dados Financeiros Extraídos:
${JSON.stringify(extractedData, null, 2)}

Cálculos:
- Cenário Base(PGFN Presumido): ${JSON.stringify(calcData?.cenario_base)}
- Cenário Ajustado(Laudo): ${JSON.stringify(calcData?.cenario_ajustado)}
- Ajustes aplicados(receitas não recorrentes excluídas): ${JSON.stringify(calcData?.ajustes_aplicados)}
- Itens identificados(já refletidos no balanço): ${JSON.stringify(calcData?.itens_identificados)}
- Ganho do laudo: R$ ${ganho.toLocaleString('pt-BR')}

CAPAG-e (Capacidade de Pagamento Efetiva):
${JSON.stringify(calcData?.capag_e, null, 2)}

Validação Jurídica (Strategist): ${JSON.stringify(stratData)}

RESUMO DO IMPACTO:
Rating PGFN Presumido: ${ratingBase} (${descontoBase}% desconto)
Rating Laudo(CAPAG - e): ${ratingAj} (${descontoAj}% desconto)
Economia estimada: R$ ${ganho.toLocaleString('pt-BR')}
CAPAG-e Final: R$ ${Number(calcData?.capag_e?.valor_final || 0).toLocaleString('pt-BR')}
GRE: ${((calcData?.capag_e?.gre || 0) * 100).toFixed(1)}% — ${calcData?.capag_e?.interpretacao_gre || 'N/A'}
`;

        const messages = [
            { role: 'system', content: systemWithKnowledge },
            { role: 'user', content: `Gere o Laudo Técnico de CAPAG-e completo em Markdown formal.\n\n${contexto}` }
        ];

        const markdownReport = await callAI(messages, false);

        if (!markdownReport) throw new Error("Falha ao gerar o laudo.");

        // Limpa possíveis blocos de formatação markdown injetados pelo LLM (```markdown ... ```)
        let cleanMarkdown = markdownReport.trim();
        if (cleanMarkdown.startsWith('```markdown')) {
            cleanMarkdown = cleanMarkdown.replace(/^```markdown\n?/i, '');
        }
        if (cleanMarkdown.endsWith('```')) {
            cleanMarkdown = cleanMarkdown.replace(/```$/i, '');
        }
        cleanMarkdown = cleanMarkdown.trim();

        const { error: updateError } = await supabase
            .from('tributario_analyses')
            .update({
                status: 'completed',
                report_markdown: cleanMarkdown
            })
            .eq('id', analysisId);

        if (updateError) {
            throw new Error(`Erro ao salvar laudo: ${updateError.message}`);
        }

        return NextResponse.json({ success: true, markdownReport });

    } catch (error: any) {
        console.error('Builder Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
