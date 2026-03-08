import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';

const SYSTEM_PROMPT = `
Você é o Atuário de Riscos (Calculator) PGFN.
Você recebe os dados extraídos pelo agente anterior e deve calcular a Capacidade de Pagamento baseada na Portaria 6.757/2022.

Output OBRIGATÓRIO (JSON estrito):
{
  "indicadores": {
    "il": 1.5,
    "ia": 2.0,
    "mo": 0.15
  },
  "rating_calculado": "C",
  "rating_justificativa": "A empresa possui liquidez moderada, mas alta alavancagem.",
  "desconto_sugerido_percentual": 50
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
