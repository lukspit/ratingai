import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI, MODEL_REASONER } from '@/utils/ai';

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
[PERSONA E ESPECIALIZAÇÃO]
Você é um Engenheiro Financeiro Tributário, especialista na matemática da Portaria PGFN 6.757/2022.

[OBJETIVO DO RESULTADO]
Escreva em 3 a 5 frases a fundamentação matemática do Laudo de CAPAG-e, criando a narrativa de "antes x depois".

[METODOLOGIA E "MALÍCIA" TRIBUTÁRIA]
A estratégia é DEMONSTRAR que os indicadores reais da empresa (principalmente Margem Operacional e Lucratividade/EBITDA) são piores do que a PGFN presumiu.
Você usará a remoção de receitas extraordinárias ou ajuste de passivos para argumentar que a capacidade operacional sustentável da empresa é FRÁGIL e que o rating PGFN estava mascarado por eventos que não se repetirão. Se o rating não mudar, use a malícia para dizer que ainda assim a empresa demonstrou saúde financeira piorada.

[TOM E ESTILO]
Frio, puramente numérico, incontestável e altamente persuasivo. Mostre que o cálculo revela a "verdade".

[BARREIRAS E LIMITAÇÕES OBRIGATÓRIAS]
- Sem formatação Markdown e sem blá-blá-blá.

Cenário PGFN Presumido (EBITDA inflado):
- IL=${base.il.toFixed(2)} (Rating ${base.rIL}), IA=${base.ia.toFixed(2)} (Rating ${base.rIA}), MO=${(base.mo * 100).toFixed(1)}% (Rating ${base.rMO})
- Rating Final: ${base.rating} — Desconto: ${base.desconto}%

Cenário Laudo Contestado (EBITDA ajustado):
- IL=${ajustado.il.toFixed(2)} (Rating ${ajustado.rIL}), IA=${ajustado.ia.toFixed(2)} (Rating ${ajustado.rIA}), MO=${(ajustado.mo * 100).toFixed(1)}% (Rating ${ajustado.rMO})
- Rating Final: ${ajustado.rating} — Desconto: ${ajustado.desconto}%
- Ganho Estimado da Revisão: R$ ${ganho.toLocaleString('pt-BR')}

Explique que receitas não recorrentes inflavam o EBITDA, que o Laudo as exclui conforme
Portaria PGFN 6.757/2022, e qual o impacto na Margem Operacional real.
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
        const ac = Number(extractedData.ativo_circulante) || 0;
        const pc = Number(extractedData.passivo_circulante) || 0;
        const pcnc = Number(extractedData.passivo_nao_circulante) || 0;
        const pl = Number(extractedData.patrimonio_liquido) || 0;
        const ebitda = Number(extractedData.ebitda) || 0;
        const rb = Number(extractedData.receita_bruta) || 0;
        const divida = Number(valorDivida) || 0;

        // ── CENÁRIO 1: Rating PGFN Presumido (EBITDA com tudo incluído) ──────
        const base = calcularCenario(ac, pc, pcnc, pl, ebitda, rb);
        console.log(`[CALCULATOR] BASE: IL = ${base.il.toFixed(4)} (${base.rIL}) IA = ${base.ia.toFixed(4)} (${base.rIA}) MO = ${(base.mo * 100).toFixed(2)}% (${base.rMO}) → Rating ${base.rating} `);

        // ── CENÁRIO 2: Rating Laudo (EBITDA real, sem receitas não recorrentes)
        //
        // REGRA FUNDAMENTAL: o objetivo do laudo é mostrar que o EBITDA real
        // é MENOR que o presumido, porque está inflado por receitas não recorrentes.
        // Rating mais baixo = mais desconto = cliente paga menos.
        //
        // O que PIORA os indicadores (o que queremos):
        //   receita_nao_recorrente → REMOVER do EBITDA → MO cai → rating piora → mais desconto ✓
        //
        // O que NÃO deve ser ajustado (já está refletido nos dados e já piora os indicadores):
        //   despesa_nao_recorrente  → já reduz o EBITDA (mantém MO baixo) ✓
        //   depreciacao             → já reduz o EBITDA (mantém MO baixo) ✓
        //   doacao_patrocinio       → já reduz o EBITDA (mantém MO baixo) ✓
        //   emprestimo_socio        → já está no Passivo (mantém IA alto) ✓
        //   passivo_tributario      → já está no Passivo (mantém IA alto) ✓
        // ─────────────────────────────────────────────────────────────────────

        const itens: any[] = extractedData.itens_ajustaveis || [];

        let ebitda_aj = ebitda;

        const ajustesAplicados: Array<{ item: string; tipo: string; valor: number; impacto: string }> = [];
        const itensIdentificados: Array<{ item: string; tipo: string; valor: number; nota: string }> = [];

        for (const item of itens) {
            const val = Number(item.valor) || 0;
            if (!val) continue;

            switch (item.tipo) {
                case 'receita_nao_recorrente':
                    // ÚNICO ajuste que piora os indicadores: retira receita não recorrente do EBITDA
                    // (Outras Receitas como venda de imóvel não entram na Receita Bruta operacional)
                    ebitda_aj -= val;
                    ajustesAplicados.push({
                        item: item.item,
                        tipo: item.tipo,
                        valor: val,
                        impacto: `EBITDA reduzido em R$ ${val.toLocaleString('pt-BR')} → Margem Operacional real cai`
                    });
                    break;

                case 'despesa_nao_recorrente':
                    // Já está deduzida do EBITDA — manter. Documentar como evidência de fragilidade.
                    itensIdentificados.push({
                        item: item.item, tipo: item.tipo, valor: val,
                        nota: 'Despesa extraordinária já deduzida do EBITDA — contribui para manter a Margem Operacional baixa'
                    });
                    break;

                case 'depreciacao':
                    itensIdentificados.push({
                        item: item.item, tipo: item.tipo, valor: val,
                        nota: 'D&A já deduzida do EBITDA — evidencia intensidade de capital e compromissos futuros de reposição'
                    });
                    break;

                case 'doacao_patrocinio':
                    itensIdentificados.push({
                        item: item.item, tipo: item.tipo, valor: val,
                        nota: 'Despesa não essencial já deduzida — demonstra comprometimento de resultado com gastos não operacionais'
                    });
                    break;

                case 'emprestimo_socio':
                    itensIdentificados.push({
                        item: item.item, tipo: item.tipo, valor: val,
                        nota: 'Já incluso no Passivo — eleva o Índice de Alavancagem (IA), evidenciando dependência de capital de sócios'
                    });
                    break;

                case 'passivo_tributario_contestado':
                    itensIdentificados.push({
                        item: item.item, tipo: item.tipo, valor: val,
                        nota: 'Já incluso no Passivo — demonstra obrigações tributárias adicionais que elevam a alavancagem real da empresa'
                    });
                    break;
            }
        }

        // EBITDA ajustado não pode ser negativo para cálculo
        ebitda_aj = Math.max(ebitda_aj, 0);

        // IL e IA usam os dados do BP sem modificação (já refletem a situação real)
        const ajustado = calcularCenario(ac, pc, pcnc, pl, ebitda_aj, rb);
        console.log(`[CALCULATOR] AJUSTADO: IL = ${ajustado.il.toFixed(4)} (${ajustado.rIL}) IA = ${ajustado.ia.toFixed(4)} (${ajustado.rIA}) MO = ${(ajustado.mo * 100).toFixed(2)}% (${ajustado.rMO}) → Rating ${ajustado.rating} `);

        // ── Impacto financeiro ───────────────────────────────────────────────
        const economia_base = divida * (base.desconto / 100);
        const economia_ajustada = divida * (ajustado.desconto / 100);
        const ganho_do_laudo = economia_ajustada - economia_base;

        // ── Justificativa (IA para texto) ────────────────────────────────────
        const messages = [
            { role: 'user', content: JUSTIFICATIVA_PROMPT(base, ajustado, ganho_do_laudo) }
        ];
        const justificativa = await callAI(messages, false, MODEL_REASONER)
            || `EBITDA real de R$ ${ebitda_aj.toLocaleString('pt-BR')} vs R$ ${ebitda.toLocaleString('pt-BR')} presumido.Rating contestado: ${ajustado.rating} (${ajustado.desconto}% desconto).`;

        const calcData = {
            cenario_base: {
                indicadores: { il: base.il, ia: base.ia, mo: base.mo },
                ratings: { il: base.rIL, ia: base.rIA, mo: base.rMO },
                rating: base.rating,
                desconto: base.desconto,
                economia_estimada: economia_base,
                passivo_total: base.passivo_total,
                ebitda_original: ebitda
            },
            cenario_ajustado: {
                indicadores: { il: ajustado.il, ia: ajustado.ia, mo: ajustado.mo },
                ratings: { il: ajustado.rIL, ia: ajustado.rIA, mo: ajustado.rMO },
                rating: ajustado.rating,
                desconto: ajustado.desconto,
                economia_estimada: economia_ajustada,
                passivo_total: ajustado.passivo_total,
                ebitda_ajustado: ebitda_aj
            },
            ajustes_aplicados: ajustesAplicados,
            itens_identificados: itensIdentificados,
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
