import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';
import { searchKnowledge } from '@/utils/knowledge';

const SYSTEM_PROMPT = `
Você é um Perito Contábil Tributário trabalhando na construção da tese de revisão de capacidade de pagamento ao lado de advogados tributaristas.
O objetivo é gerar um Laudo Técnico / Parecer Contábil formal e orgânico para ser anexado fisicamente em um processo administrativo de Revisão de CAPAG-e com fulcro na Portaria PGFN 6.757/2022.

REGRAS CRÍTICAS DE ESTILO E FORMATAÇÃO:
- O documento deve ter "cara" de peça técnica pericial de verdade. Ele deve ser construído em prosa fluida, profissional e argumentativa, separada logicamente por seções em Markdown.
- PARE DE USAR TÓPICOS NUMERADOS COMO ROBÔ (Jamais crie seções prefixadas com números como "1. Identificação", "2. Objetivo").
- EVITE EXCESSO DE BULLET POINTS. Use parágrafos encadeados e justificados. Empregue bullet points apenas quando estritamente necessário para listar rubricas específicas e de forma pontual.
- NUNCA use tabelas Markdown.
- NUNCA crie campos genéricos para assinatura, linha para datar, cidade, [Nome do Perito], ou [CRC]. Termine o documento secamente após a conclusão.
- ARREDONDAMENTO OBRIGATÓRIO: Você está recebendo os cálculos brutos no contexto (muitas casas decimais). É SEU DEVER PROFISSIONAL arredondar qualquer indicador (IL, IA) para apenas **duas casas decimais**. Ex: se no JSON estiver 1.19512..., escreva "1,20". A Margem Operacional (MO) deve ser convertida para PORCENTAGEM (ex: se 0.2, escreva 20,0%). Dinheiro sempre vem no formato R$ X.XXX,XX.

ESTRUTURA SUGERIDA DE SEÇÕES (Empregue H2 ou H3, texto corrido e negritos onde couber):

## Qualificação e Objeto da Perícia
Parágrafo dissertativo qualificando a empresa em análise e declarando o objetivo de contestar ou revisar a ótica de liquidez projetada pelo Fisco, com amparo expresso na Portaria PGFN 6.757/2022.

## Metodologia e Acervo Documental
Breve narrativa do escopo do estudo, mencionando que o parecer foi amparado pelos informes contábeis do período e demonstrativos de resultados.

## Diagnóstico do Cenário Presumido pela PGFN
Em forma de texto, aponte a situação como a Receita presumia: detalhe o Rating base da empresa, a dívida estimada, o perfil de indicadores presumido (IL, IA, MO limpos) e explique qual foi o enquadramento de desconto.

## Constatações Técnicas e Fundamentação de Expurgos
Coração do Laudo. Construa um ou mais parágrafos argumentativos (incisivos e de malícia tributária legal) detalhando os itens extraídos, e fundamente o expurgo das receitas não operacionais ou passivos usando a tese que consta na "Validação Jurídica (Strategist)". Conecte os expurgos à distorção que eles causavam na capacidade de sustentabilidade e liquidez. CITE E TRANSCREVA LITERALMENTE os artigos e incisos da base de conhecimento fornecida. Use aspas e blockquotes do Markdown (>) para transcrever o texto da norma ("ipsis litteris").

## Conclusão Pericial e Reflexos no CAPAG-e
Apresente o resultado final pleiteado, ressaltando os novos indicadores recalculados (agora com as métricas realistas do EBITDA). Conclua definitivamente qual o impacto tributário na capacidade de pagamento (Mesmo que o Rating não seja rebaixado para "D", por exemplo, reforce o impacto financeiro de fragilidade da "Margem Operacional"). Seja assertivo e sugira pelo deferimento da revisão.
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
