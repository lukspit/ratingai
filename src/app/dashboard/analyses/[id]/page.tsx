import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft, Building2, TrendingDown, BarChart3,
    FileText, Gavel, CheckCircle2, AlertCircle, Clock, ArrowRight, Scale, Banknote, TrendingUp
} from 'lucide-react'
import { PrintButton } from './PrintButton'
import ReactMarkdown from 'react-markdown'

// ───────────────────────────────────────────────
const RATINGS: Record<string, { bg: string; ring: string; text: string; label: string; desc: string }> = {
    A: { bg: 'from-emerald-500/20 to-green-500/10', ring: 'ring-emerald-500/40', text: 'text-emerald-400', label: 'Excelente', desc: '0% de desconto' },
    B: { bg: 'from-blue-500/20 to-sky-500/10', ring: 'ring-blue-500/40', text: 'text-blue-400', label: 'Bom', desc: '30% de desconto' },
    C: { bg: 'from-amber-500/20 to-yellow-500/10', ring: 'ring-amber-500/40', text: 'text-amber-400', label: 'Regular', desc: '50% de desconto' },
    D: { bg: 'from-red-500/20 to-rose-500/10', ring: 'ring-red-500/40', text: 'text-red-400', label: 'Crítico', desc: '70% de desconto' },
}

function RatingCard({ rating, sublabel }: { rating: string; sublabel: string }) {
    const r = RATINGS[rating] || RATINGS['C']
    return (
        <div className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${r.bg} ring-2 ${r.ring} shadow-xl px-8 py-7 min-w-[140px]`}>
            <span className={`text-6xl font-black ${r.text} leading-none`}>{rating}</span>
            <span className={`text-xs font-bold mt-2 ${r.text}`}>{r.label}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</span>
            <span className="text-[10px] font-semibold text-muted-foreground/60 mt-3 uppercase tracking-wider">{sublabel}</span>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'completed') return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
        </span>
    )
    if (status === 'processing') return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Processando
        </span>
    )
    return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Erro
        </span>
    )
}

function formatBRL(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ───────────────────────────────────────────────
export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    const [analysisRes, adjRes] = await Promise.all([
        supabase.from('tributario_analyses').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('tributario_adjustments').select('*').eq('analysis_id', id),
    ])

    if (!analysisRes.data) notFound()

    const analysis = analysisRes.data
    const adjustments = adjRes.data || []
    const calcData = analysis.calc_json || null
    const reportMarkdown: string = analysis.report_markdown || ''

    // Suporta estrutura nova (dual-cenário) e antiga (indicadores únicos)
    const isDualScenario = !!calcData?.cenario_base
    const cenarioBase = calcData?.cenario_base || null
    const cenarioAj = calcData?.cenario_ajustado || null
    const ganhoDoLaudo = calcData?.ganho_do_laudo || 0
    const valorDivida = calcData?.valor_divida || 0

    // Fallback para estrutura antiga
    const indBase = cenarioBase?.indicadores || calcData?.indicadores || {}
    const ratingBase = cenarioBase?.rating || analysis.original_rating || '?'
    const ratingAj = cenarioAj?.rating || analysis.simulated_rating || '?'
    const descontoAj = cenarioAj?.desconto || analysis.potential_discount_percentage || 0

    const ratingChanged = ratingBase !== ratingAj
    const hasData = calcData || reportMarkdown

    return (
        <div className="space-y-8 pb-16 max-w-5xl mx-auto animate-in fade-in zoom-in duration-500">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/analyses">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{analysis.company_name}</h1>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {analysis.cnpj_target && <span className="text-xs text-muted-foreground">{analysis.cnpj_target}</span>}
                            <span className="text-muted-foreground/40">·</span>
                            <StatusBadge status={analysis.status} />
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(analysis.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print header */}
            <div className="hidden print:flex flex-col border-b pb-6 mb-2">
                <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-5 h-5" />
                    <span className="font-black tracking-tight">Rating.ai</span>
                </div>
                <h1 className="text-2xl font-bold mt-2">{analysis.company_name}</h1>
                <p className="text-sm text-muted-foreground">
                    CNPJ: {analysis.cnpj_target || '—'} · {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                </p>
            </div>

            {/* ── MONEY SHOT: Economia Estimada ─────────────────────────────── */}
            {isDualScenario && ganhoDoLaudo > 0 && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-emerald-800/60 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 p-8 print:border print:border-emerald-600">
                    <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <Banknote className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-bold uppercase tracking-widest text-emerald-400/80">Potencial de Economia com o Laudo</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                            <div>
                                <div className="text-5xl sm:text-6xl font-black text-emerald-300 leading-none tracking-tight">
                                    {formatBRL(ganhoDoLaudo)}
                                </div>
                                <p className="text-emerald-400/70 text-sm mt-2">
                                    economia estimada na Transação Tributária com a PGFN
                                </p>
                            </div>
                            <div className="sm:ml-auto flex flex-col gap-2 text-sm">
                                {valorDivida > 0 && (
                                    <div className="flex items-center gap-2 text-emerald-300/70">
                                        <span className="text-emerald-400/50 text-xs uppercase tracking-wider">Dívida negociada:</span>
                                        <span className="font-bold">{formatBRL(valorDivida)}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-emerald-300/70">
                                    <span className="text-emerald-400/50 text-xs uppercase tracking-wider">Desconto obtido:</span>
                                    <span className="font-bold text-emerald-300">{descontoAj}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Comparativo de Ratings ────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-xl p-8">
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold uppercase tracking-widest text-primary/70">
                            {isDualScenario ? 'Comparativo de Cenários' : 'Resultado CAPAG-e'}
                        </span>
                    </div>

                    {isDualScenario ? (
                        /* Dual scenario layout */
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6 flex-wrap">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">PGFN Presumido</p>
                                    <RatingCard rating={ratingBase} sublabel={`${cenarioBase?.desconto ?? 0}% desconto`} />
                                </div>
                                <div className="flex flex-col items-center gap-1 text-primary">
                                    <ArrowRight className="w-8 h-8" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">laudo prova</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-emerald-400 mb-2 uppercase tracking-wider font-semibold">Rating Contestado</p>
                                    <RatingCard rating={ratingAj} sublabel={`${descontoAj}% desconto`} />
                                </div>

                                {/* Tabela comparativa de indicadores */}
                                <div className="sm:ml-auto w-full sm:w-auto overflow-x-auto">
                                    <table className="text-sm border-collapse min-w-[280px]">
                                        <thead>
                                            <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                                                <th className="text-left py-1.5 pr-4 font-semibold">Indicador</th>
                                                <th className="text-center py-1.5 px-3 font-semibold">PGFN</th>
                                                <th className="text-center py-1.5 px-3 font-semibold text-emerald-400">Laudo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            <tr>
                                                <td className="py-2 pr-4 text-muted-foreground">IL (Liquidez)</td>
                                                <td className="py-2 px-3 text-center font-mono font-semibold">{(cenarioBase?.indicadores?.il ?? 0).toFixed(2)} <span className="text-xs text-muted-foreground">({cenarioBase?.ratings?.il})</span></td>
                                                <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-400">{(cenarioAj?.indicadores?.il ?? 0).toFixed(2)} <span className="text-xs text-emerald-400/60">({cenarioAj?.ratings?.il})</span></td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 pr-4 text-muted-foreground">IA (Alavancagem)</td>
                                                <td className="py-2 px-3 text-center font-mono font-semibold">{(cenarioBase?.indicadores?.ia ?? 0).toFixed(2)} <span className="text-xs text-muted-foreground">({cenarioBase?.ratings?.ia})</span></td>
                                                <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-400">{(cenarioAj?.indicadores?.ia ?? 0).toFixed(2)} <span className="text-xs text-emerald-400/60">({cenarioAj?.ratings?.ia})</span></td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 pr-4 text-muted-foreground">MO (Margem Op.)</td>
                                                <td className="py-2 px-3 text-center font-mono font-semibold">{((cenarioBase?.indicadores?.mo ?? 0) * 100).toFixed(1)}% <span className="text-xs text-muted-foreground">({cenarioBase?.ratings?.mo})</span></td>
                                                <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-400">{((cenarioAj?.indicadores?.mo ?? 0) * 100).toFixed(1)}% <span className="text-xs text-emerald-400/60">({cenarioAj?.ratings?.mo})</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {calcData?.justificativa && (
                                <div className="flex gap-3 bg-background/50 rounded-xl p-4 border border-border/50">
                                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-sm text-muted-foreground leading-relaxed">{calcData.justificativa}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Fallback: layout original */
                        <div className="flex flex-col sm:flex-row items-center gap-6 flex-wrap">
                            {analysis.original_rating && <RatingCard rating={analysis.original_rating} sublabel="Rating Original" />}
                            {ratingChanged && (
                                <>
                                    <div className="flex flex-col items-center gap-1 text-emerald-500">
                                        <ArrowRight className="w-8 h-8" />
                                        <span className="text-[10px] font-semibold uppercase tracking-wider">ajustado</span>
                                    </div>
                                    <RatingCard rating={analysis.simulated_rating} sublabel="Rating Simulado" />
                                </>
                            )}
                            {descontoAj > 0 && (
                                <div className="sm:ml-auto flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/5 ring-2 ring-emerald-500/30 shadow-xl px-8 py-7 min-w-[140px]">
                                    <TrendingDown className="w-6 h-6 text-emerald-400 mb-1" />
                                    <span className="text-5xl font-black text-emerald-400 leading-none">{descontoAj}%</span>
                                    <span className="text-xs font-bold text-emerald-400 mt-2">Desconto Potencial</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Ajustes identificados (novo formato) ─────────────────────── */}
            {isDualScenario && calcData?.ajustes_aplicados?.length > 0 && (
                <div className="rounded-2xl bg-card border border-border/50 shadow-lg p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-base">Ajustes Contábeis Legais Identificados</h2>
                        <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                            {calcData.ajustes_aplicados.length} ajuste{calcData.ajustes_aplicados.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wide">
                                    <th className="text-left py-2 px-3 font-semibold">Item</th>
                                    <th className="text-left py-2 px-3 font-semibold">Tipo</th>
                                    <th className="text-right py-2 px-3 font-semibold">Valor</th>
                                    <th className="text-left py-2 px-3 font-semibold">Impacto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calcData.ajustes_aplicados.map((adj: any, i: number) => (
                                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-3 font-medium">{adj.item}</td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 font-medium whitespace-nowrap">
                                                {adj.tipo?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-emerald-400">
                                            {formatBRL(Number(adj.valor))}
                                        </td>
                                        <td className="py-3 px-3 text-xs text-muted-foreground">{adj.impacto}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Ajustes (formato antigo — fallback) ──────────────────────── */}
            {!isDualScenario && adjustments.length > 0 && (
                <div className="rounded-2xl bg-card border border-border/50 shadow-lg p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-base">Ajustes Contábeis Propostos</h2>
                        <span className="ml-auto text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                            {adjustments.length} ajuste{adjustments.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wide">
                                    <th className="text-left py-2 px-3 font-semibold">Descrição</th>
                                    <th className="text-left py-2 px-3 font-semibold">Categoria</th>
                                    <th className="text-right py-2 px-3 font-semibold">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adjustments.map((adj: any) => (
                                    <tr key={adj.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-3 font-medium">{adj.description}</td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 font-medium">
                                                {adj.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono text-xs font-semibold">
                                            {formatBRL(Number(adj.original_value))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Laudo Técnico Formal ──────────────────────────────────────── */}
            {reportMarkdown && (
                <div className="space-y-4">
                    {/* Header externo com botão de exportar */}
                    <div className="flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-base">Laudo Pericial Formal</h2>
                        </div>
                        <PrintButton />
                    </div>

                    {/* Documento formal */}
                    <div className="rounded-2xl border border-border/60 shadow-xl overflow-hidden">
                        {/* Topo do documento — header oficial */}
                        <div className="bg-slate-900 border-b border-slate-700 px-8 py-5 flex items-center justify-between print:bg-white print:border-slate-300">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <Scale className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Rating.ai</p>
                                    <p className="text-[10px] text-muted-foreground">Sistema Especialista em CAPAG-e</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Portaria PGFN nº 6.757/2022</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {new Date(analysis.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Corpo do documento */}
                        <div className="bg-white text-slate-800 px-8 md:px-12 py-10 print:px-8 print:py-6">
                            <div className="
                                [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mt-8 [&_h1]:mb-6 [&_h1]:text-slate-900 [&_h1]:tracking-tight [&_h1]:text-center
                                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-slate-800 [&_h2]:uppercase [&_h2]:tracking-wider
                                [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-slate-700
                                [&_p]:text-sm [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:mb-4
                                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-6
                                [&_ol>li]:text-sm [&_ol>li]:text-slate-600 [&_ol>li]:leading-relaxed
                                [&_ol>li::marker]:text-slate-400 [&_ol>li::marker]:font-semibold
                                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-6
                                [&_ul>li]:text-sm [&_ul>li]:text-slate-600 [&_ul>li]:leading-relaxed
                                [&_ul>li::marker]:text-slate-400
                                [&_strong]:text-slate-900 [&_strong]:font-bold
                                [&_em]:text-slate-500 [&_em]:italic
                                [&_hr]:border-slate-200 [&_hr]:my-10
                                [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:bg-primary/5 [&_blockquote]:py-4 [&_blockquote]:px-6 [&_blockquote]:rounded-r-xl [&_blockquote]:mb-6
                            ">
                                <ReactMarkdown>{reportMarkdown}</ReactMarkdown>
                            </div>

                            {/* Rodapé do documento */}
                            <div className="mt-12 pt-6 border-t-2 border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                                <span>Gerado por Rating.ai — Sistema Especialista em CAPAG-e</span>
                                <span>Portaria PGFN nº 6.757/2022 · {new Date(analysis.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sem laudo */}
            {!hasData && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 py-16 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground/40 mb-4" />
                    <p className="font-semibold text-muted-foreground">Laudo não disponível</p>
                    <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
                        Os documentos desta análise não foram salvos. Verifique se <code className="bg-muted px-1 rounded text-xs">SUPABASE_SERVICE_ROLE_KEY</code> está no .env.local.
                    </p>
                </div>
            )}
        </div>
    )
}
