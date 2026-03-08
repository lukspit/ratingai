import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é o Atuário de Riscos (Calculator) PGFN.
Calcule os indicadores de CAPAG-e com base nos dados fornecidos, usando EXATAMENTE os valores recebidos.

FÓRMULAS OBRIGATÓRIAS:
1. IL (Índice de Liquidez) = ativo_circulante / passivo_circulante
2. IA (Índice de Alavancagem) = passivo_total / patrimonio_liquido
   - passivo_total = passivo_circulante + passivo_nao_circulante
   - Se patrimonio_liquido for 0 ou null, use 9999 (alavancagem máxima)
3. MO (Margem Operacional) = ebitda / receita_bruta
   - Se receita_bruta for 0 ou null, use 0

TABELA DE RATING POR INDICADOR:
- IL: A(>1.5) | B(1.0-1.5) | C(0.5-1.0) | D(<0.5)
- IA: A(<1.0) | B(1.0-2.0) | C(2.0-4.0) | D(>4.0)
- MO: A(>0.15) | B(0.05-0.15) | C(0-0.05) | D(<0)

RATING FINAL = o pior rating individual entre IL, IA e MO.

DESCONTOS SUGERIDOS (Portaria 6.757/2022):
- A: 0% | B: 30% | C: 50% | D: 70%

Output OBRIGATÓRIO (JSON estrito, sem texto fora do JSON):
{
  "indicadores": {
    "il": <valor calculado, 4 casas decimais>,
    "ia": <valor calculado, 4 casas decimais>,
    "mo": <valor calculado, 4 casas decimais>,
    "rating_il": "<A|B|C|D>",
    "rating_ia": "<A|B|C|D>",
    "rating_mo": "<A|B|C|D>"
  },
  "rating_calculado": "<A|B|C|D>",
  "rating_justificativa": "<explicação dos indicadores e por que o rating final é esse>",
  "desconto_sugerido_percentual": <número inteiro>
}
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData } = await req.json();

        if (!analysisId || !extractedData) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = await createClient();

        // Call AI 2: Calculator
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Dados extraídos:\n${JSON.stringify(extractedData, null, 2)}` }
        ];

        const calcData = await callAI(messages, true);

        if (!calcData || !calcData.rating_calculado) {
            throw new Error("Failed to parse AI 2 response.");
        }

        // Salvar rating + calcData completo diretamente na tabela de análises
        const { error: updateError } = await supabase
            .from('tributario_analyses')
            .update({
                original_rating: calcData.rating_calculado,
                simulated_rating: calcData.rating_calculado,
                potential_discount_percentage: calcData.desconto_sugerido_percentual || 0,
                calc_json: calcData
            })
            .eq('id', analysisId);

        if (updateError) {
            console.error('Calculator: failed to update analysis', updateError);
        }

        return NextResponse.json({ success: true, calcData });

    } catch (error: any) {
        console.error('Calculator Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
