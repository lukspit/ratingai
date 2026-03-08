import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';

// Funções de rating por indicador (Portaria PGFN 6.757/2022)
function ratingIL(il: number): string {
    if (il > 1.5) return 'A';
    if (il >= 1.0) return 'B';
    if (il >= 0.5) return 'C';
    return 'D';
}

function ratingIA(ia: number): string {
    if (ia < 1.0) return 'A';
    if (ia < 2.0) return 'B';
    if (ia < 4.0) return 'C';
    return 'D';
}

function ratingMO(mo: number): string {
    if (mo > 0.15) return 'A';
    if (mo >= 0.05) return 'B';
    if (mo >= 0) return 'C';
    return 'D';
}

function worstRating(ratings: string[]): string {
    const order = ['A', 'B', 'C', 'D'];
    return ratings.reduce((worst, r) => order.indexOf(r) > order.indexOf(worst) ? r : worst, 'A');
}

const DESCONTO: Record<string, number> = { A: 0, B: 30, C: 50, D: 70 };

const JUSTIFICATIVA_PROMPT = (il: number, ia: number, mo: number, rIL: string, rIA: string, rMO: string, rFinal: string) => `
Você é um perito contábil tributário. Escreva em 2-3 frases uma justificativa técnica para o rating CAPAG-e calculado.

Dados calculados:
- IL (Índice de Liquidez) = ${il.toFixed(4)} → Rating ${rIL}
- IA (Índice de Alavancagem) = ${ia.toFixed(4)} → Rating ${rIA}
- MO (Margem Operacional) = ${(mo * 100).toFixed(2)}% → Rating ${rMO}
- Rating Final: ${rFinal} (pior entre os três indicadores)

Responda apenas com o texto da justificativa, sem introdução.
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData } = await req.json();

        if (!analysisId || !extractedData) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = await createClient();

        // ── CÁLCULOS EM CÓDIGO (não em IA) ──────────────────────────────
        const ac = Number(extractedData.ativo_circulante) || 0;
        const pc = Number(extractedData.passivo_circulante) || 0;
        const pcnc = Number(extractedData.passivo_nao_circulante) || 0;
        const pl = Number(extractedData.patrimonio_liquido) || 0;
        const ebitda = Number(extractedData.ebitda) || 0;
        const rb = Number(extractedData.receita_bruta) || 0;

        const il = pc > 0 ? ac / pc : 0;
        const passivo_total = pc + pcnc;
        const ia = pl > 0 ? passivo_total / pl : 9999;
        const mo = rb > 0 ? ebitda / rb : 0;

        const rIL = ratingIL(il);
        const rIA = ratingIA(ia);
        const rMO = ratingMO(mo);
        const rFinal = worstRating([rIL, rIA, rMO]);
        const desconto = DESCONTO[rFinal];

        console.log(`[CALCULATOR] IL=${il.toFixed(4)}(${rIL}) IA=${ia.toFixed(4)}(${rIA}) MO=${(mo*100).toFixed(2)}%(${rMO}) → Rating ${rFinal}`);

        // ── IA apenas para gerar texto de justificativa ──────────────────
        const messages = [
            { role: 'user', content: JUSTIFICATIVA_PROMPT(il, ia, mo, rIL, rIA, rMO, rFinal) }
        ];
        const justificativa = await callAI(messages, false) || `Rating ${rFinal}: IL=${il.toFixed(2)}, IA=${ia.toFixed(2)}, MO=${(mo*100).toFixed(1)}%.`;

        const calcData = {
            indicadores: { il, ia, mo, rating_il: rIL, rating_ia: rIA, rating_mo: rMO },
            rating_calculado: rFinal,
            rating_justificativa: justificativa,
            desconto_sugerido_percentual: desconto
        };

        // Salvar resultado
        const { error: updateError } = await supabase
            .from('tributario_analyses')
            .update({
                original_rating: rFinal,
                simulated_rating: rFinal,
                potential_discount_percentage: desconto,
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
