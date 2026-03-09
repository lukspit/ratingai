import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';
import { searchKnowledge } from '@/utils/knowledge';

const SYSTEM_PROMPT = `
Você é um Perito Contábil Tributário com registro ativo no CRC, especialista em Transação Tributária com a PGFN.
Elabore um LAUDO TÉCNICO DE CAPACIDADE DE PAGAMENTO ESPECÍFICA (CAPAG-e) completo em Markdown formal.

REGRAS CRÍTICAS:
- Use EXCLUSIVAMENTE os valores fornecidos nos dados. NUNCA invente valores.
- Linguagem jurídico-contábil formal brasileira — este documento será submetido à PGFN.
- Cite artigos específicos da Portaria PGFN nº 6.757/2022 para cada ajuste.
- Se a BASE DE CONHECIMENTO estiver disponível, use-a para citar os artigos corretos.

ESTRUTURA OBRIGATÓRIA DO LAUDO:

---

# LAUDO TÉCNICO DE CAPACIDADE DE PAGAMENTO ESPECÍFICA (CAPAG-e)
**Transação Tributária com a PGFN — Portaria PGFN nº 6.757/2022**

---

## I. IDENTIFICAÇÃO E QUALIFICAÇÃO

| Campo | Informação |
|-------|-----------|
| **Empresa** | [razão social] |
| **CNPJ** | [cnpj] |
| **Período-base** | Exercício Social [ano] |
| **Dívida em Negociação** | R$ [valor] |
| **Modalidade** | [modalidade] |
| **Data de Elaboração** | [data atual] |
| **Elaborado por** | Rating.ai — Sistema Especialista em CAPAG-e |

---

## II. OBJETO E FINALIDADE

O presente laudo tem por objeto a determinação da Capacidade de Pagamento Específica (CAPAG-e) da empresa identificada, nos termos do Art. 19 da Portaria PGFN nº 6.757/2022, que assegura ao contribuinte o direito de contestar a classificação presumida (CAPAG-P) mediante apresentação de documentação técnica.

A finalidade é demonstrar que a classificação presumida pelo sistema da PGFN não reflete a real capacidade econômico-financeira da empresa, em razão da presença de receitas não recorrentes que inflam artificialmente o resultado operacional.

---

## III. DOCUMENTAÇÃO ANALISADA

- Demonstração do Resultado do Exercício (DRE) — Exercício [ano]
- Balanço Patrimonial (BP) — Data-base [data]
- Documentos complementares de suporte aos ajustes identificados

---

## IV. METODOLOGIA ADOTADA

A análise segue a metodologia de indicadores estabelecida pela Portaria PGFN nº 6.757/2022:

| Indicador | Fórmula | Finalidade |
|-----------|---------|-----------|
| **IL** — Índice de Liquidez | Ativo Circulante / Passivo Circulante | Capacidade de honrar obrigações de CP |
| **IA** — Índice de Alavancagem | Passivo Total / Patrimônio Líquido | Grau de endividamento relativo ao PL |
| **MO** — Margem Operacional | EBITDA / Receita Bruta | Eficiência operacional recorrente |

**Rating Final:** determinado pelo pior indicador (critério conservador).

**Tabela de Descontos (Art. 4º, Portaria 6.757/2022):**
| Rating | Desconto |
|--------|---------|
| A | 0% |
| B | 30% |
| C | 50% |
| D | 70% |

---

## V. CENÁRIO PGFN PRESUMIDO (CAPAG-P)

Análise com os dados financeiros conforme registrados nas demonstrações contábeis, sem qualquer ajuste:

| Indicador | Cálculo | Valor | Rating |
|-----------|---------|-------|--------|
| IL | [AC] / [PC] | [valor] | [rating] |
| IA | [PT] / [PL] | [valor] | [rating] |
| MO | [EBITDA] / [RB] | [valor]% | [rating] |
| **Rating Final** | — | — | **[PIOR]** |
| **Desconto PGFN** | — | — | **[X]%** |
| **Economia na base** | — | — | **R$ [valor]** |

---

## VI. AJUSTES TÉCNICOS E FUNDAMENTAÇÃO LEGAL

(Para cada ajuste identificado, uma subseção:)

### VI.[N] [Nome do Item]

- **Tipo:** [tipo]
- **Valor:** R$ [valor]
- **Origem:** [DRE/BP]
- **Impacto:** [qual indicador e direção]
- **Fundamento Legal:** [artigo específico da Portaria 6.757/2022]
- **Justificativa Técnica:** [explicação técnica em 2-3 frases — por que é excluível]

---

## VII. CENÁRIO LAUDO — CAPAG-e (Após Ajustes)

Análise com os dados financeiros ajustados, excluindo receitas não recorrentes que distorcem o resultado operacional:

| Indicador | Cálculo | Valor | Rating |
|-----------|---------|-------|--------|
| IL | [AC] / [PC] | [valor] | [rating] |
| IA | [PT] / [PL] | [valor] | [rating] |
| MO | [EBITDA_aj] / [RB] | [valor]% | [rating] |
| **Rating Contestado** | — | — | **[PIOR_AJ]** |
| **Desconto Pleiteado** | — | — | **[Y]%** |
| **Economia com Laudo** | — | — | **R$ [valor]** |

---

## VIII. COMPARATIVO E IMPACTO FINANCEIRO

| Métrica | PGFN Presumido | Laudo (CAPAG-e) | Variação |
|---------|:--------------:|:---------------:|:--------:|
| IL | [valor] — [rating] | [valor] — [rating] | → |
| IA | [valor] — [rating] | [valor] — [rating] | → |
| MO | [valor]% — [rating] | [valor]% — [rating] | ↓ |
| **Rating Final** | **[X]** | **[Y]** | ↓ |
| Desconto | [A]% | **[B]%** | +[diff]pp |
| Economia | R$ [base] | **R$ [ajustado]** | — |
| **Ganho do Laudo** | — | — | **+R$ [ganho]** |

---

## IX. CONCLUSÃO E RECOMENDAÇÃO TÉCNICA

Com base na análise realizada, conclui-se que:

1. O CAPAG-P presumido pela PGFN (**Rating [X]**, [A]% de desconto) está distorcido pela inclusão de receitas não recorrentes no EBITDA.
2. Excluídos os itens não recorrentes (conforme autorizado pela Portaria 6.757/2022), a Margem Operacional real da empresa é de [valor]%, revelando Rating [Y].
3. O desconto juridicamente cabível é de **[B]%**, gerando uma **economia estimada de R$ [ganho]** na transação.

**Próximos passos recomendados:**
[listar 3-4 ações concretas: documentar os itens, protocolar a impugnação, etc.]

---

## X. RESSALVAS TÉCNICAS

- Os valores utilizados neste laudo baseiam-se nas demonstrações contábeis fornecidas.
- A aprovação final do CAPAG-e está sujeita à análise da PGFN conforme procedimentos da Portaria 6.757/2022.
- Este laudo não substitui assessoria jurídico-tributária especializada para o caso concreto.
- Os descontos indicados são estimativas baseados na tabela vigente — valores finais dependem de negociação.

---
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
Período-base: ${extractedData?.period || 'Exercício 2023'}
Valor da dívida: R$ ${Number(valorDivida).toLocaleString('pt-BR')}
Modalidade: ${modalidade || 'N/A'}

Dados Financeiros Extraídos:
${JSON.stringify(extractedData, null, 2)}

Cálculos:
- Cenário Base (PGFN Presumido): ${JSON.stringify(calcData?.cenario_base)}
- Cenário Ajustado (Laudo): ${JSON.stringify(calcData?.cenario_ajustado)}
- Ajustes aplicados (receitas não recorrentes excluídas): ${JSON.stringify(calcData?.ajustes_aplicados)}
- Itens identificados (já refletidos no balanço): ${JSON.stringify(calcData?.itens_identificados)}
- Ganho do laudo: R$ ${ganho.toLocaleString('pt-BR')}

Validação Jurídica (Strategist): ${JSON.stringify(stratData)}

RESUMO DO IMPACTO:
Rating PGFN Presumido: ${ratingBase} (${descontoBase}% desconto)
Rating Laudo (CAPAG-e): ${ratingAj} (${descontoAj}% desconto)
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
