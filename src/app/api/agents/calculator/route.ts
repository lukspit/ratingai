import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '@/utils/ai';

// ── Funções de rating por indicador (Portaria PGFN 6.757/2022) ───────────────
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

function calcularCenario(ac: number, pc: number, pcnc: number, pl: number, ebitda: number, rb: number) {
    const il = pc > 0 ? ac / pc : 0;
    const passivo_total = pc + pcnc;
    const ia = pl > 0 ? passivo_total / pl : 9999;
    const mo = rb > 0 ? ebitda / rb : 0;

    const rIL = ratingIL(il);
    const rIA = ratingIA(ia);
    const rMO = ratingMO(mo);
    const rating = worstRating([rIL, rIA, rMO]);
    const desconto = DESCONTO[rating];

    return { il, ia, mo, rIL, rIA, rMO, rating, desconto, passivo_total };
}

const JUSTIFICATIVA_PROMPT = (base: any, ajustado: any, ganho: number) => `
Você é um perito contábil tributário. Escreva em 3-4 frases uma justificativa técnica para o Laudo de CAPAG-e.

Cenário PGFN Presumido (sem ajustes):
- IL=${base.il.toFixed(2)} (Rating ${base.rIL}), IA=${base.ia.toFixed(2)} (Rating ${base.rIA}), MO=${(base.mo*100).toFixed(1)}% (Rating ${base.rMO})
- Rating Final: ${base.rating} — Desconto: ${base.desconto}%

Cenário Laudo (com ajustes contábeis legais):
- IL=${ajustado.il.toFixed(2)} (Rating ${ajustado.rIL}), IA=${ajustado.ia.toFixed(2)} (Rating ${ajustado.rIA}), MO=${(ajustado.mo*100).toFixed(1)}% (Rating ${ajustado.rMO})
- Rating Final: ${ajustado.rating} — Desconto: ${ajustado.desconto}%

Ganho estimado do laudo: R$ ${ganho.toLocaleString('pt-BR')}

Explique por que o laudo contesta a classificação presumida e qual é o embasamento legal (Portaria PGFN 6.757/2022).
Responda apenas com o texto, sem introdução.
`;

export async function POST(req: Request) {
    try {
        const { analysisId, extractedData, valorDivida } = await req.json();

        if (!analysisId || !extractedData) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = await createClient();

        // ── Dados base ───────────────────────────────────────────────────────
        const ac     = Number(extractedData.ativo_circulante)       || 0;
        const pc     = Number(extractedData.passivo_circulante)     || 0;
        const pcnc   = Number(extractedData.passivo_nao_circulante) || 0;
        const pl     = Number(extractedData.patrimonio_liquido)     || 0;
        const ebitda = Number(extractedData.ebitda)                 || 0;
        const rb     = Number(extractedData.receita_bruta)          || 0;
        const divida = Number(valorDivida) || 0;

        // ── CENÁRIO 1: Rating PGFN Presumido ────────────────────────────────
        const base = calcularCenario(ac, pc, pcnc, pl, ebitda, rb);
        console.log(`[CALCULATOR] BASE: IL=${base.il.toFixed(4)}(${base.rIL}) IA=${base.ia.toFixed(4)}(${base.rIA}) MO=${(base.mo*100).toFixed(2)}%(${base.rMO}) → Rating ${base.rating}`);

        // ── CENÁRIO 2: Rating Laudo (com ajustes legais) ─────────────────────
        const itens: any[] = extractedData.itens_ajustaveis || [];

        let rb_aj    = rb;
        let ebitda_aj = ebitda;
        let pc_aj    = pc;
        let pcnc_aj  = pcnc;
        let pl_aj    = pl;

        const ajustesAplicados: Array<{item: string; tipo: string; valor: number; impacto: string}> = [];

        for (const item of itens) {
            const val = Number(item.valor) || 0;
            if (!val) continue;

            switch (item.tipo) {
                case 'receita_nao_recorrente':
                    rb_aj    -= val;
                    ebitda_aj -= val;
                    ajustesAplicados.push({ item: item.item, tipo: item.tipo, valor: val, impacto: 'Redução em Receita Bruta e EBITDA' });
                    break;

                case 'despesa_nao_recorrente':
                    ebitda_aj += val;
                    ajustesAplicados.push({ item: item.item, tipo: item.tipo, valor: val, impacto: 'Exclusão de despesa atípica — EBITDA ajustado positivamente' });
                    break;

                case 'depreciacao':
                    ebitda_aj += val;
                    ajustesAplicados.push({ item: item.item, tipo: item.tipo, valor: val, impacto: 'Exclusão de D&A (despesa não-caixa)' });
                    break;

                case 'doacao_patrocinio':
                    ebitda_aj += val;
                    ajustesAplicados.push({ item: item.item, tipo: item.tipo, valor: val, impacto: 'Exclusão de despesa não essencial' });
                    break;

                case 'emprestimo_socio':
                    if (val <= pc_aj) { pc_aj -= val; } else { pcnc_aj -= val; }
                    pl_aj += val;
                    ajustesAplicados.push({ item: item.item, tipo: item.tipo, valor: val, impacto: 'Capitalização: reduz Passivo e aumenta PL' });
                    break;

                case 'passivo_tributario_contestado':
                    if (val <= pcnc_aj) { pcnc_aj -= val; } else { pc_aj -= val; }
                    ajustesAplicados.push({ item: item.item, tipo: item.tipo, valor: val, impacto: 'Exclusão de passivo tributário contestado' });
                    break;
            }
        }

        // Garante que valores não fiquem negativos
        rb_aj   = Math.max(rb_aj, 1);
        pc_aj   = Math.max(pc_aj, 0);
        pcnc_aj = Math.max(pcnc_aj, 0);
        pl_aj   = Math.max(pl_aj, 1);

        const ajustado = calcularCenario(ac, pc_aj, pcnc_aj, pl_aj, ebitda_aj, rb_aj);
        console.log(`[CALCULATOR] AJUSTADO: IL=${ajustado.il.toFixed(4)}(${ajustado.rIL}) IA=${ajustado.ia.toFixed(4)}(${ajustado.rIA}) MO=${(ajustado.mo*100).toFixed(2)}%(${ajustado.rMO}) → Rating ${ajustado.rating}`);

        // ── Impacto financeiro ───────────────────────────────────────────────
        const economia_base     = divida * (base.desconto / 100);
        const economia_ajustada = divida * (ajustado.desconto / 100);
        const ganho_do_laudo    = economia_ajustada - economia_base;

        // ── Justificativa (IA apenas para texto) ─────────────────────────────
        const messages = [
            { role: 'user', content: JUSTIFICATIVA_PROMPT(base, ajustado, ganho_do_laudo) }
        ];
        const justificativa = await callAI(messages, false)
            || `Rating contestado ${ajustado.rating} (${ajustado.desconto}%) vs Rating PGFN ${base.rating} (${base.desconto}%).`;

        const calcData = {
            cenario_base: {
                indicadores: { il: base.il, ia: base.ia, mo: base.mo },
                ratings: { il: base.rIL, ia: base.rIA, mo: base.rMO },
                rating: base.rating,
                desconto: base.desconto,
                economia_estimada: economia_base,
                passivo_total: base.passivo_total
            },
            cenario_ajustado: {
                indicadores: { il: ajustado.il, ia: ajustado.ia, mo: ajustado.mo },
                ratings: { il: ajustado.rIL, ia: ajustado.rIA, mo: ajustado.rMO },
                rating: ajustado.rating,
                desconto: ajustado.desconto,
                economia_estimada: economia_ajustada,
                passivo_total: ajustado.passivo_total
            },
            ajustes_aplicados: ajustesAplicados,
            ganho_do_laudo,
            valor_divida: divida,
            justificativa
        };

        await supabase
            .from('tributario_analyses')
            .update({
                original_rating: base.rating,
                simulated_rating: ajustado.rating,
                potential_discount_percentage: ajustado.desconto,
                calc_json: calcData
            })
            .eq('id', analysisId);

        return NextResponse.json({ success: true, calcData });

    } catch (error: any) {
        console.error('Calculator Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
