import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é o Perito Contábil (Report Builder).
Gere um Laudo Técnico de CAPAG-e em Markdown com base EXCLUSIVAMENTE nos dados fornecidos no contexto.

REGRAS CRÍTICAS:
- Use APENAS os valores de extractedData, calcData e stratData fornecidos. NUNCA invente valores.
- Os indicadores IL, IA e MO já foram calculados em calcData.indicadores — use esses valores, não recalcule.
- O rating final já está em calcData.rating_calculado e stratData.novo_rating_sugerido — use-os.
- Se stratData tiver ajustes, mencione-os na seção de estratégia.

ESTRUTURA OBRIGATÓRIA:
# Laudo Técnico de CAPAG-e

## 1. Resumo Executivo
(síntese do resultado: rating, desconto sugerido e situação geral)

## 2. Dados Financeiros Extraídos
(tabela com os valores de extractedData: ativo circulante, passivo circulante, PL, receita bruta, EBITDA)

## 3. Cálculo dos Indicadores
### 3.1 Índice de Liquidez (IL)
Fórmula: Ativo Circulante / Passivo Circulante = [valor] / [valor] = [resultado]
Rating IL: [A/B/C/D]

### 3.2 Índice de Alavancagem (IA)
Fórmula: Passivo Total / Patrimônio Líquido = [valor] / [valor] = [resultado]
Rating IA: [A/B/C/D]

### 3.3 Margem Operacional (MO)
Fórmula: EBITDA / Receita Bruta = [valor] / [valor] = [resultado]
Rating MO: [A/B/C/D]

## 4. Estratégia de Ajustes
(descreva os ajustes de stratData, ou informe que não há ajustes aplicáveis)

## 5. Conclusão
Rating Final: [letra]
Desconto sugerido: [percentual]%
(justificativa baseada nos indicadores calculados)
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData, calcData, stratData } = await req.json();

        if (!analysisId) return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });

        const supabase = await createClient();

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Contexto do Cliente:\nExtrato: ${JSON.stringify(extractedData)}\nCálculo: ${JSON.stringify(calcData)}\nEstratégia: ${JSON.stringify(stratData)}` }
        ];

        const markdownReport = await callAI(messages, false);

        if (!markdownReport) throw new Error("Failed to generate report.");

        // Salva laudo markdown + status diretamente em tributario_analyses (sem depender de tabela separada)
        const { error: updateError } = await supabase
            .from('tributario_analyses')
            .update({
                status: 'completed',
                report_markdown: markdownReport
            })
            .eq('id', analysisId);

        if (updateError) {
            console.error('Builder: failed to save report', updateError);
            throw new Error(`Erro ao salvar laudo: ${updateError.message}`);
        }

        return NextResponse.json({ success: true, markdownReport });

    } catch (error: any) {
        console.error('Builder Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
