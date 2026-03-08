import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é um Perito Contábil Tributário especialista em Transação Tributária com a PGFN.
Gere um Laudo Técnico de CAPAG-e COMPLETO em Markdown, com base EXCLUSIVAMENTE nos dados fornecidos.

REGRAS CRÍTICAS:
- Use APENAS os valores dos dados fornecidos. NUNCA invente valores.
- O laudo deve ter DOIS cenários: PGFN Presumido e Laudo (com ajustes).
- Mostre a tabela comparativa com destaque para a economia em R$.
- Cada ajuste deve ter seu fundamento legal explícito.
- Seja técnico e preciso. Este laudo será usado em negociação real com a PGFN.

ESTRUTURA OBRIGATÓRIA:

# Laudo Técnico de CAPAG-e

## 1. Resumo Executivo
(Síntese do impacto: rating antes/depois, desconto antes/depois, economia total em R$)
Exemplo de formato:
> A análise identificou [N] ajustes contábeis legítimos que alteram a classificação de **Rating [X]** (presumido pela PGFN) para **Rating [Y]** (laudo), elevando o desconto de [A]% para [B]% e gerando uma **economia estimada de R$ [valor]**.

## 2. Comparativo de Cenários

| Indicador | PGFN Presumido | Laudo (Ajustado) | Variação |
|-----------|:---:|:---:|:---:|
| IL (Liquidez) | [valor] — Rating [X] | [valor] — Rating [X] | [→ ou ↑ ou ↓] |
| IA (Alavancagem) | [valor] — Rating [X] | [valor] — Rating [X] | [→ ou ↑ ou ↓] |
| MO (Margem Op.) | [valor]% — Rating [X] | [valor]% — Rating [X] | [→ ou ↑ ou ↓] |
| **Rating Final** | **[X]** | **[Y]** | [mudança] |
| Desconto | [A]% | **[B]%** | +[diff]pp |
| **Economia (R$)** | R$ [valor] | **R$ [valor]** | **+R$ [ganho]** |

## 3. Dados Financeiros Base

(tabela com ativo circulante, passivo circulante, PL, receita bruta, EBITDA — valores originais)

## 4. Ajustes Contábeis Aplicados

(Para cada ajuste identificado, uma subseção com:)
### 4.X [Nome do Item]
- **Tipo:** [tipo do ajuste]
- **Valor:** R$ [valor]
- **Impacto:** [qual indicador melhora]
- **Fundamento Legal:** [artigo da Portaria 6.757/2022]
- **Justificativa Técnica:** [explicação]

## 5. Cálculo dos Indicadores (Base vs Ajustado)

### 5.1 Índice de Liquidez (IL)
- Base: [AC] / [PC] = [resultado] → Rating [X]
- Ajustado: [AC] / [PC_aj] = [resultado] → Rating [X]

### 5.2 Índice de Alavancagem (IA)
- Base: [PT] / [PL] = [resultado] → Rating [X]
- Ajustado: [PT_aj] / [PL_aj] = [resultado] → Rating [X]

### 5.3 Margem Operacional (MO)
- Base: [EBITDA] / [RB] = [resultado]% → Rating [X]
- Ajustado: [EBITDA_aj] / [RB_aj] = [resultado]% → Rating [X]

## 6. Fundamentação Jurídica

(Citar os artigos da Portaria PGFN nº 6.757/2022 que embasam os ajustes)
(Mencionar Art. 19 — direito à impugnação do CAPAG presumido)

## 7. Conclusão e Recomendação

Rating Contestado: **[letra]**
Desconto Recomendado: **[percentual]%**
Economia Estimada: **R$ [valor]**

(Próximos passos concretos para o contribuinte)
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

        const contexto = `
Dados Extraídos: ${JSON.stringify(extractedData)}

Cálculos:
- Cenário Base (PGFN): ${JSON.stringify(calcData?.cenario_base)}
- Cenário Ajustado (Laudo): ${JSON.stringify(calcData?.cenario_ajustado)}
- Ajustes aplicados: ${JSON.stringify(calcData?.ajustes_aplicados)}
- Ganho do laudo: R$ ${ganho.toLocaleString('pt-BR')}
- Valor da dívida: R$ ${Number(valorDivida).toLocaleString('pt-BR')}
- Modalidade: ${modalidade}

Estratégia Jurídica: ${JSON.stringify(stratData)}

Resumo do impacto: Rating PGFN ${ratingBase} (${descontoBase}% desconto) → Rating Laudo ${ratingAj} (${descontoAj}% desconto) → Economia R$ ${ganho.toLocaleString('pt-BR')}
`;

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Gere o Laudo Técnico de CAPAG-e completo em Markdown.\n\n${contexto}` }
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
