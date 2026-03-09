import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';
import { searchKnowledge } from '@/utils/knowledge';

const SYSTEM_PROMPT = `
Você é um Perito Contábil Tributário trabalhando para advogados tributaristas.
O advogado não quer textos longos ou "fluff" generalista. Ele precisa de um resumo executivo técnico, direto e enumerado de 1 a 9, focado nas provas materiais e nos números reais, para anexar diretamente na petição de revisão de CAPAG-e.

REGRAS CRÍTICAS DE ESTILO:
- O laudo DEVE ser APENAS uma lista numerada principal de 1 a 9 (ex: 1. TÍTULO, 2. TÍTULO...).
- Dentro de cada tópico, você DEVE escrever EXCLUSIVAMENTE em formato de BULLET POINTS (use o hífen -). Jamais escreva parágrafos soltos.
- NUNCA use tabelas Markdown. NUNCA. Apresente dados tabulares em texto lado a lado nos bullet points.
- A linguagem deve ser pericial, extremamente técnica, matemática e cirúrgica. Sem introduções clichês.
- Use exclusivamente os dados fornecidos no contexto.

ESTRUTURA OBRIGATÓRIA (Siga rigidamente os 9 tópicos principais):

1. IDENTIFICAÇÃO DO CONTRIBUINTE
- (Insira os dados da empresa, CNPJ, período-base e dívida)

2. OBJETIVO PERICIAL
- (Resuma o intento de revisão da Capacidade de Pagamento - CAPAG com amparo na Portaria PGFN 6.757/2022)

3. ACERVO DOCUMENTAL
- (Liste os DREs e Balanços Patrimoniais lidos no escopo da base de dados)

4. DIAGNÓSTICO DO CENÁRIO PGFN (PRESUMIDO)
- (Cite o Rating original, seu % de desconto vinculado, e os valores presumidos de Passivo e Receita)

5. DECOMPOSIÇÃO DOS INDICADORES PRESUMIDOS
- (Liste um bullet point para o Índice de Liquidez, outro para Alavancagem e outro para Margem Operacional, colando seus valores originais e notas parciais)

6. ACHADOS PERICIAIS E EXPURGOS APLICÁVEIS
- (Liste as rubricas identificadas, como receitas não recorrentes, seus valores exatos e qual artigo/fundamento da portaria embasa a retificação contábil)

7. QUADRO DEMONSTRATIVO REVISADO (CAPAG-e)
- (Exiba o novo Rating pleiteado e o novo teto de desconto, contrastando com o original. Caso não mude, registre ateste de neutralidade da base original)

8. COMPOSIÇÃO DE CALIBRAÇÃO DOS NOVOS INDICADORES
- (Liste novamente o IL, IA e MO agora ajustados matematicamente pelos expurgos aprovados na etapa 6)

9. PARECER CONCLUSIVO E IMPACTO TRIBUTÁRIO
- (Sintetize objetivamente a alteração, o ganho estipulado da operação (Economia) e as providências processuais recomendadas à defesa do contribuinte)
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
