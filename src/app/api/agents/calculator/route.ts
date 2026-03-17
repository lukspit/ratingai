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

const DESCONTO: Record<string, number> = { A: 0, B: 0, C: 65, D: 70 };

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
[PERSONA]
Você é um Engenheiro Financeiro Tributário — especialista na matemática fria da Portaria PGFN 6.757/2022. Você traduz números em narrativas que convencem auditores fiscais.

[OBJETIVO]
Escrever em 3-5 frases a fundamentação matemática do impacto do Laudo de CAPAG-e, criando a narrativa "antes vs. depois" dos indicadores.

[METODOLOGIA]
Demonstre que os indicadores reais da empresa (MO, IL, IA) são piores do que a PGFN presumiu. Argumente que receitas extraordinárias inflavam o EBITDA e que, após o expurgo conforme a Portaria PGFN 6.757/2022, a capacidade operacional sustentável revela uma empresa mais frágil. Se os ratings não mudarem, argumente que a deterioração dos indicadores já é evidência relevante.

[LIMITES]
Responda apenas com o texto puro, sem formatação Markdown, sem introdução e sem preâmbulo.

Cenário PGFN Presumido (EBITDA inflado):
- IL=${base.il.toFixed(2)} (Rating ${base.rIL}), IA=${base.ia.toFixed(2)} (Rating ${base.rIA}), MO=${(base.mo * 100).toFixed(1)}% (Rating ${base.rMO})
- Rating Final: ${base.rating} — Desconto: ${base.desconto}%

Cenário Laudo Contestado (EBITDA ajustado):
- IL=${ajustado.il.toFixed(2)} (Rating ${ajustado.rIL}), IA=${ajustado.ia.toFixed(2)} (Rating ${ajustado.rIA}), MO=${(ajustado.mo * 100).toFixed(1)}% (Rating ${ajustado.rMO})
- Rating Final: ${ajustado.rating} — Desconto: ${ajustado.desconto}%
- Ganho Estimado da Revisão: R$ ${ganho.toLocaleString('pt-BR')}

Explique o impacto.
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

        // Novos campos para CAPAG-e
        const disponibilidades = Number(extractedData.disponibilidades) || 0;
        const contas_a_receber = Number(extractedData.contas_a_receber) || 0;
        const estoques = Number(extractedData.estoques) || 0;
        const aplicacoes_financeiras = Number(extractedData.aplicacoes_financeiras) || 0;
        const resultado_operacional = Number(extractedData.resultado_operacional) || ebitda;
        const fco_operacional = Number(extractedData.fco_operacional) || 0;

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
        let resultado_operacional_aj = resultado_operacional;

        const ajustesAplicados: Array<{ item: string; tipo: string; valor: number; impacto: string }> = [];
        const itensIdentificados: Array<{ item: string; tipo: string; valor: number; nota: string }> = [];

        for (const item of itens) {
            const val = Number(item.valor) || 0;
            if (!val) continue;

            switch (item.tipo) {
                case 'receita_nao_recorrente':
                    ebitda_aj -= val;
                    resultado_operacional_aj -= val;
                    ajustesAplicados.push({
                        item: item.item,
                        tipo: item.tipo,
                        valor: val,
                        impacto: `EBITDA reduzido em R$ ${val.toLocaleString('pt-BR')} → Margem Operacional real cai`
                    });
                    break;

                case 'despesa_nao_recorrente':
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
                        nota: 'Mútuo de Sócios já incluso no Passivo Circulante, agravando drasticamente a dependência de caixa.'
                    });
                    ajustesAplicados.push({
                        item: item.item,
                        tipo: item.tipo,
                        valor: val,
                        impacto: `Passivo agravado por Mútuo Emergencial de R$ ${(val / 1000000).toFixed(1)}M, indicando socorro dos sócios por falta de liquidez própria.`
                    });
                    break;

                case 'impairment':
                    itensIdentificados.push({
                        item: item.item, tipo: item.tipo, valor: val,
                        nota: 'Perda por Impairment reconhecida — deterioração patrimonial irretratável.'
                    });
                    ajustesAplicados.push({
                        item: item.item,
                        tipo: item.tipo,
                        valor: val,
                        impacto: `Impairment de R$ ${(val / 1000000).toFixed(1)}M comprova perda severa de capacidade e desvalorização do patrimônio.`
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

        // EBITDA e ROA ajustados não podem ser negativos para cálculo de rating
        ebitda_aj = Math.max(ebitda_aj, 0);

        // IL e IA usam os dados do BP sem modificação (já refletem a situação real)
        const ajustado = calcularCenario(ac, pc, pcnc, pl, ebitda_aj, rb);
        console.log(`[CALCULATOR] AJUSTADO: IL = ${ajustado.il.toFixed(4)} (${ajustado.rIL}) IA = ${ajustado.ia.toFixed(4)} (${ajustado.rIA}) MO = ${(ajustado.mo * 100).toFixed(2)}% (${ajustado.rMO}) → Rating ${ajustado.rating} `);

        // ── CAPAG-e: Cálculo real em R$ (Portaria PGFN 6.757/2022) ───────────
        //
        // PLR = Patrimônio Líquido Realizável (ativos circulantes de fácil conversão)
        const plr = disponibilidades + contas_a_receber + estoques + aplicacoes_financeiras;

        // Metodologia 1: ROA (Resultado Operacional Ajustado) + PLR
        // ROA = resultado operacional ajustado (sem receitas não recorrentes)
        const roa_aj = Math.max(resultado_operacional_aj, 0);
        const capag_m1_valor = roa_aj + plr;

        // Metodologia 2: FCO (Fluxo de Caixa Operacional) + PLR
        // Se FCO for negativo, considerar como zero
        const fco_aj = Math.max(fco_operacional, 0);
        const capag_m2_valor = fco_aj + plr;

        // Escolher a menor CAPAG-e (mais vantajosa para o contribuinte)
        const tem_fco = fco_operacional !== 0;
        let metodologia_escolhida: string;
        let capag_final: number;

        if (tem_fco && capag_m2_valor < capag_m1_valor) {
            metodologia_escolhida = 'FCO + PLR';
            capag_final = capag_m2_valor;
        } else {
            metodologia_escolhida = 'ROA + PLR';
            capag_final = capag_m1_valor;
        }

        // GRE = Grau de Recuperação Esperada
        const gre = divida > 0 ? capag_final / divida : 0;
        const interpretacao_gre = gre >= 1
            ? 'Dívida potencialmente recuperável (GRE ≥ 100%)'
            : gre >= 0.5
                ? `Dívida parcialmente recuperável (GRE = ${(gre * 100).toFixed(1)}%)`
                : `Dívida irrecuperável (GRE = ${(gre * 100).toFixed(1)}%)`;

        console.log(`[CALCULATOR] CAPAG-e: PLR=R$${plr.toLocaleString('pt-BR')} | M1(ROA+PLR)=R$${capag_m1_valor.toLocaleString('pt-BR')} | M2(FCO+PLR)=R$${capag_m2_valor.toLocaleString('pt-BR')} | Escolhida: ${metodologia_escolhida} = R$${capag_final.toLocaleString('pt-BR')} | GRE=${(gre * 100).toFixed(1)}%`);

        // ── Impacto financeiro ───────────────────────────────────────────────
        const economia_base = divida * (base.desconto / 100);
        const economia_ajustada = divida * (ajustado.desconto / 100);
        const ganho_do_laudo = economia_ajustada - economia_base;

        // ── Justificativa (IA para texto) ────────────────────────────────────
        const messages = [
            { role: 'user', content: JUSTIFICATIVA_PROMPT(base, ajustado, ganho_do_laudo) }
        ];
        const justificativa = await callAI(messages, false, MODEL_REASONER)
            || `EBITDA real de R$ ${ebitda_aj.toLocaleString('pt-BR')} vs R$ ${ebitda.toLocaleString('pt-BR')} presumido. Rating contestado: ${ajustado.rating} (${ajustado.desconto}% desconto).`;

        const calcData = {
            capag_e: {
                plr,
                metodologia_1: {
                    nome: 'ROA + PLR',
                    roa: roa_aj,
                    plr,
                    valor: capag_m1_valor
                },
                metodologia_2: {
                    nome: 'FCO + PLR',
                    fco: fco_aj,
                    plr,
                    valor: capag_m2_valor,
                    disponivel: tem_fco
                },
                metodologia_escolhida,
                valor_final: capag_final,
                gre,
                interpretacao_gre
            },
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
