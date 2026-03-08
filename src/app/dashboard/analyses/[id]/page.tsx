import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft, Building2, TrendingDown, BarChart3,
    FileText, Gavel, CheckCircle2, AlertCircle, Clock, ArrowRight, Scale
} from 'lucide-react'
import { PrintButton } from './PrintButton'
import ReactMarkdown from 'react-markdown'

// ───────────────────────────────────────────────
const RATINGS: Record<string, { bg: string; ring: string; text: string; glow: string; label: string; desc: string }> = {
    A: { bg: 'from-emerald-500/20 to-green-500/10', ring: 'ring-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', label: 'Excelente', desc: 'Capacidade máxima' },
    B: { bg: 'from-blue-500/20 to-sky-500/10', ring: 'ring-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/20', label: 'Bom', desc: 'Boa capacidade' },
    C: { bg: 'from-amber-500/20 to-yellow-500/10', ring: 'ring-amber-500/40', text: 'text-amber-400', glow: 'shadow-amber-500/20', label: 'Regular', desc: 'Capacidade limitada' },
    D: { bg: 'from-red-500/20 to-rose-500/10', ring: 'ring-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20', label: 'Crítico', desc: 'Sem capacidade' },
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

function IndicatorBar({ label, value, max, unit = '', description }: {
    label: string; value: number; max: number; unit?: string; description: string
}) {
    const pct = Math.min(100, (value / max) * 100)
    const color = pct > 66 ? 'bg-emerald-500' : pct > 33 ? 'bg-amber-500' : 'bg-red-500'
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-lg font-bold text-foreground">{value.toFixed(2)}{unit}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
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

// ───────────────────────────────────────────────
export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const supabase = await createClient()

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    // Busca análise + ajustes em paralelo — tudo via supabase regular (RLS garante acesso próprio)
    const [analysisRes, adjRes] = await Promise.all([
        supabase.from('tributario_analyses').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('tributario_adjustments').select('*').eq('analysis_id', id),
    ])

    if (!analysisRes.data) notFound()

    const analysis = analysisRes.data
    const adjustments = adjRes.data || []

    // Dados agora salvos diretamente em tributario_analyses
    const calcData = analysis.calc_json || null
    const reportMarkdown: string = analysis.report_markdown || ''

    const ind = calcData?.indicadores || {}
    const hasData = calcData || reportMarkdown
    const ratingChanged = analysis.original_rating && analysis.simulated_rating &&
        analysis.original_rating !== analysis.simulated_rating

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
                <PrintButton />
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

            {/* Hero: Rating Comparison */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-xl p-8">
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold uppercase tracking-widest text-primary/70">Resultado CAPAG-e</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 flex-wrap">
                        {analysis.original_rating && (
                            <RatingCard rating={analysis.original_rating} sublabel="Rating Original" />
                        )}
                        {ratingChanged && (
                            <div className="flex flex-col items-center gap-1 text-emerald-500">
                                <ArrowRight className="w-8 h-8" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider">ajustado</span>
                            </div>
                        )}
                        {analysis.simulated_rating && ratingChanged && (
                            <RatingCard rating={analysis.simulated_rating} sublabel="Rating Simulado" />
                        )}
                        {analysis.potential_discount_percentage > 0 && (
                            <div className="sm:ml-auto flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/5 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10 px-8 py-7 min-w-[140px]">
                                <TrendingDown className="w-6 h-6 text-emerald-400 mb-1" />
                                <span className="text-5xl font-black text-emerald-400 leading-none">
                                    {analysis.potential_discount_percentage}%
                                </span>
                                <span className="text-xs font-bold text-emerald-400 mt-2">Desconto Potencial</span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">na dívida tributária</span>
                            </div>
                        )}
                    </div>
                    {calcData?.rating_justificativa && (
                        <div className="mt-6 flex gap-3 bg-background/50 rounded-xl p-4 border border-border/50">
                            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{calcData.rating_justificativa}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Indicadores Financeiros */}
            {(ind.il != null || ind.ia != null || ind.mo != null) && (
                <div className="rounded-2xl bg-card border border-border/50 shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-base">Indicadores Financeiros</h2>
                        <span className="ml-auto text-xs text-muted-foreground">Portaria PGFN 6.757/2022</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <IndicatorBar
                            label="IL — Liquidez"
                            value={Number(ind.il ?? 0)}
                            max={3}
                            description="Ativo Circulante / Passivo Circulante"
                        />
                        <IndicatorBar
                            label="IA — Alavancagem"
                            value={Number(ind.ia ?? 0)}
                            max={5}
                            description="Dívida Total / Patrimônio Líquido"
                        />
                        <IndicatorBar
                            label="MO — Margem Op."
                            value={Number(ind.mo ?? 0) * 100}
                            max={30}
                            unit="%"
                            description="Lucro Operacional / Receita Bruta"
                        />
                    </div>
                </div>
            )}

            {/* Ajustes Contábeis */}
            {adjustments.length > 0 && (
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
                                <tr className="border-b border-border/50">
                                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</th>
                                    <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</th>
                                    <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ajustado</th>
                                    <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Impacto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adjustments.map((adj: any) => {
                                    const impact = adj.adjusted_value - adj.original_value
                                    const isReduction = impact <= 0
                                    return (
                                        <tr key={adj.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                            <td className="py-3 px-3 font-medium">{adj.description}</td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 font-medium">
                                                    {adj.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right text-muted-foreground font-mono text-xs">
                                                {Number(adj.original_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono text-xs font-semibold">
                                                {Number(adj.adjusted_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className={`py-3 px-3 text-right font-mono text-xs font-bold ${isReduction ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {isReduction ? '↓' : '↑'} {Math.abs(impact).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Laudo Técnico */}
            {reportMarkdown && (
                <div className="rounded-2xl bg-card border border-border/50 shadow-lg p-6 md:p-8 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-base">Laudo Técnico Completo</h2>
                        <span className="ml-auto text-xs text-muted-foreground">Gerado por IA · Rating.ai</span>
                    </div>
                    <div className="
                        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-foreground [&_h1]:border-b [&_h1]:border-border/50 [&_h1]:pb-2
                        [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-foreground
                        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-foreground
                        [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-3
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:mb-3
                        [&_li]:text-sm [&_li]:text-muted-foreground
                        [&_strong]:text-foreground [&_strong]:font-semibold
                        [&_hr]:border-border/50 [&_hr]:my-6
                        [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/5 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote]:mb-3
                        [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                        [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:mb-4
                        [&_th]:border [&_th]:border-border/50 [&_th]:p-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:font-semibold [&_th]:text-xs
                        [&_td]:border [&_td]:border-border/50 [&_td]:p-2 [&_td]:text-muted-foreground [&_td]:text-xs
                    ">
                        <ReactMarkdown>{reportMarkdown}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Sem laudo ainda */}
            {!hasData && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 py-16 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground/40 mb-4" />
                    <p className="font-semibold text-muted-foreground">Laudo não disponível</p>
                    <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
                        Os documentos desta análise não foram salvos. Verifique se <code className="bg-muted px-1 rounded text-xs">SUPABASE_SERVICE_ROLE_KEY</code> está no .env.local e reinicie o servidor.
                    </p>
                </div>
            )}
        </div>
    )
}
