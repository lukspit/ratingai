import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FileText, Plus, Search, TrendingDown, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const RATING_COLORS: Record<string, string> = {
    A: 'bg-green-500/10 text-green-500 border-green-500/30',
    B: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    C: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    D: 'bg-red-500/10 text-red-500 border-red-500/30',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    processing: <Clock className="w-4 h-4 text-yellow-500 animate-spin" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    pending: <Clock className="w-4 h-4 text-muted-foreground" />,
}

export default async function AnalysesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: analyses } = user
        ? await supabase
            .from('tributario_analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        : { data: [] }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Histórico</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Meus Relatórios</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as simulações e laudos CAPAG-e gerados.
                    </p>
                </div>
                <Link href="/dashboard/analyses/new">
                    <Button className="flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /> Nova Simulação
                    </Button>
                </Link>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader className="pb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome da empresa ou CNPJ..."
                            className="pl-9 bg-background/50 border-border/50"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {!analyses || analyses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/50 rounded-lg bg-background/30">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                Você ainda não realizou nenhuma simulação de Capacidade de Pagamento. Inicie agora mesmo para identificar oportunidades.
                            </p>
                            <Link href="/dashboard/analyses/new">
                                <Button>Iniciar Primeira Simulação</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {analyses.map((analysis: any) => (
                                <Link key={analysis.id} href={`/dashboard/analyses/${analysis.id}`}>
                                    <div className="group flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {STATUS_ICON[analysis.status] || STATUS_ICON.pending}
                                                    <p className="font-semibold text-sm">{analysis.company_name}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {analysis.cnpj_target && <span className="mr-3">{analysis.cnpj_target}</span>}
                                                    {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {analysis.original_rating && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${RATING_COLORS[analysis.original_rating] || ''}`}>
                                                        {analysis.original_rating}
                                                    </span>
                                                    {analysis.simulated_rating && analysis.simulated_rating !== analysis.original_rating && (
                                                        <>
                                                            <TrendingDown className="w-4 h-4 text-green-500" />
                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${RATING_COLORS[analysis.simulated_rating] || ''}`}>
                                                                {analysis.simulated_rating}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {analysis.potential_discount_percentage > 0 && (
                                                <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {analysis.potential_discount_percentage}% desconto
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
