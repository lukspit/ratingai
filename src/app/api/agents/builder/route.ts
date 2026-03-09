import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';
import { searchKnowledge } from '@/utils/knowledge';

const SYSTEM_PROMPT = `
Você é um Perito Contábil Tributário com registro ativo no CRC, especialista em Transação Tributária com a PGFN.
Elabore um LAUDO TÉCNICO DE CAPACIDADE DE PAGAMENTO ESPECÍFICA (CAPAG-e) completo em Markdown formal, com estética de documento oficial de alto nível.

REGRAS CRÍTICAS DE ESTILO E ESTRUTURA:
- NUNCA use traços horizontais (---) para separar seções. Use espaçamento e hierarquia de títulos (H1 e H2).
- Use EXCLUSIVAMENTE os valores fornecidos nos dados. NUNCA invente valores.
- Linguagem jurídico-contábil formal brasileira — este documento será submetido à PGFN.
- Seja PERSUASIVO e TÉCNICO nas justificativas de cada ajuste.
- Cite artigos específicos da Portaria PGFN nº 6.757/2022.

ESTRUTURA OBRIGATORIA DO LAUDO (Markdown):

# LAUDO TÉCNICO DE CAPACIDADE DE PAGAMENTO ESPECÍFICA (CAPAG-e)
**Transação Tributária com a PGFN — Portaria PGFN nº 6.757/2022**

## I. IDENTIFICAÇÃO E QUALIFICAÇÃO
Apresente os dados abaixo de forma limpa:
- **Empresa:** [razão social]
- **CNPJ:** [cnpj]
- **Período-base:** Exercício Social [ano]
- **Dívida em Negociação:** R$ [valor]
- **Modalidade:** [modalidade]
- **Data de Elaboração:** [data atual]
- **Responsável Técnico:** Rating.ai — Sistema Especialista em CAPAG-e

## II. OBJETO E FINALIDADE
O presente documento técnico fundamenta-se no Art. 19 da Portaria PGFN nº 6.757/2022. O objetivo é a revisão da Capacidade de Pagamento Presumida (CAPAG-P) para a modalidade Específica (CAPAG-e), demonstrando que a classificação automática não reflete a realidade financeira da requerente devido a distorções por receitas não operacionais e não recorrentes.

## III. DOCUMENTAÇÃO ANALISADA
Liste os documentos suporte (DRE [ano], BP [data], etc.).

## IV. METODOLOGIA E FUNDAMENTAÇÃO
Explique brevemente o cálculo dos indicadores (IL, IA, MO) conforme a Portaria.
Mencione a Tabela de Descontos (Art. 4º): A (0%), B (30%), C (50%), D (70%).

## V. ANÁLISE DO CENÁRIO PRESUMIDO (CAPAG-P)
Apresente uma tabela simples com os indicadores atuais sem ajustes:
| Indicador | Cálculo | Valor | Rating |
| :--- | :--- | :--- | :--- |
| IL | [AC] / [PC] | [valor] | [rating] |
| IA | [PT] / [PL] | [valor] | [rating] |
| MO | [EBITDA] / [RB] | [valor]% | [rating] |
**Rating Final Presumido: [PIOR]** | **Desconto Equivalente: [X]%**

## VI. MEMORIAL DE AJUSTES TÉCNICOS
Para cada item identificado:
### VI.[N] [Título do Ajuste]
- **Natureza:** [tipo] | **Valor:** R$ [valor]
- **Fundamento Legal:** [artigo específico da Portaria 6.757/2022]
- **Justificativa Pericial:** [Texto técnico detalhado em 2-3 frases explicando por que este item deve ser excluído conforme as normas da PGFN.]

## VII. DIAGNÓSTICO DA CAPAG-e (Cenário Ajustado)
Apresente a tabela final com os dados retificados:
| Indicador | Cálculo | Valor | Rating |
| :--- | :--- | :--- | :--- |
| IL | [AC] / [PC] | [valor] | [rating] |
| IA | [PT] / [PL] | [valor] | [rating] |
| MO | [EBITDA_aj] / [RB] | [valor]% | [rating] |
**Rating Contestado: [PIOR_AJ]** | **Desconto Pleiteado: [Y]%**

## VIII. CONCLUSÃO E PARECER TÉCNICO
Sintetize o ganho financeiro (R$ [ganho]) e a fundamentação para a reclassificação. 
Finalize com os passos recomendados protocolares.

## IX. RESSALVAS
Mencione que a decisão final cabe à PGFN e que o laudo baseia-se em dados fornecidos.
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

        // Busca chunks da base de conhecimento para fundamentação legal precisa
        const knowledgeChunks = await searchKnowledge(
            'laudo técnico CAPAG-e formato estrutura documento pericial PGFN Portaria 6757 artigos ajuste receita não recorrente',
            6
        );

        const systemWithKnowledge = knowledgeChunks
            ? `${SYSTEM_PROMPT}\n\n## BASE DE CONHECIMENTO (use para citar artigos corretos)\n\n${knowledgeChunks}`
            : SYSTEM_PROMPT;

        const contexto = `
Empresa: ${extractedData?.company_name || 'Empresa em análise'}
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

Validação Jurídica (Strategist): ${JSON.stringify(stratData)}

RESUMO DO IMPACTO:
Rating PGFN Presumido: ${ratingBase} (${descontoBase}% desconto)
Rating Laudo(CAPAG - e): ${ratingAj} (${descontoAj}% desconto)
Economia estimada: R$ ${ganho.toLocaleString('pt-BR')}
`;

        const messages = [
            { role: 'system', content: systemWithKnowledge },
            { role: 'user', content: `Gere o Laudo Técnico de CAPAG-e completo em Markdown formal.\n\n${contexto}` }
        ];

        const markdownReport = await callAI(messages, false);

        if (!markdownReport) throw new Error("Falha ao gerar o laudo.");

        const { error: updateError } = await supabase
            .from('tributario_analyses')
            .update({
                status: 'completed',
                report_markdown: markdownReport
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
