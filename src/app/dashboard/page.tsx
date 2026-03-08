import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { FileText, BarChart2, Activity, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
    const supabase = await createClient()
    /*
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Não autenticado.</div>
    }
    */
    const user = { id: 'mock-user-id', user_metadata: { full_name: 'Usuário Homologação' } }


    // Puxar perfil do usuário (advogado)
    const { data: profile } = await supabase
        .from('tributario_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Buscar todas as análises do usuário para calcular métricas
    const { data: allAnalyses } = await supabase
        .from('tributario_analyses')
        .select('*')
        .eq('user_id', user.id)

    // Saudação baseada no horário
    const hour = new Date().getHours()
    let greeting = 'Boa noite'
    if (hour >= 5 && hour < 12) greeting = 'Bom dia'
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde'

    // Métricas reais
    const completedAnalysesList = allAnalyses?.filter(a => a.status === 'completed') || []
    const totalAnalyses = allAnalyses?.length || 0
    const completedAnalyses = completedAnalysesList.length

    // Agregação de valores monetários a partir do calc_json
    const metrics = completedAnalysesList.reduce((acc, curr) => {
        const calc = curr.calc_json || {}
        return {
            passivo: acc.passivo + (Number(calc.passivo_total) || 0),
            economia: acc.economia + (Number(calc.economia_estimada) || 0)
        }
    }, { passivo: 0, economia: 0 })

    // Lista de Análises Recentes (últimas 5)
    const recentAnalyses = allAnalyses
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || []

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Painel de Controle</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    {greeting}, {profile?.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || 'Doutor(a)'} 👋🏻
                </h1>
                <p className="text-muted-foreground text-lg mt-2 font-medium">
                    Bem-vindo ao <span className="text-primary font-bold">Rating.ai</span>. Acompanhe a revisão de capacidade de pagamento e redução de passivo tributário dos seus ativos.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border-border/50 border-l-4 border-l-primary shadow-sm hover:shadow-lg transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">Passivo Analisado</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold tracking-tighter">{formatCurrency(metrics.passivo)}</div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            Dívida total nos processos revisados
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border-border/50 border-l-4 border-l-secondary shadow-sm hover:shadow-lg transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 group-hover:bg-secondary/10 transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">Economia Potencial</CardTitle>
                        <div className="p-2 bg-secondary/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-secondary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold tracking-tighter text-secondary">{formatCurrency(metrics.economia)}</div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-secondary" />
                            Redução estimada via Transação/Capag
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border-border/50 border-l-4 border-l-accent shadow-sm hover:shadow-lg transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">Revisões Geradas</CardTitle>
                        <div className="p-2 bg-accent/10 rounded-lg">
                            <FileText className="h-4 w-4 text-accent" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold tracking-tighter text-accent">{completedAnalyses}</div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <Activity className="h-3 w-3 text-accent" />
                            Laudos e análises CAPAG-e concluídos
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
                {/* Atividade Recente */}
                <Card className="lg:col-span-8 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg flex flex-col">
                    <CardHeader className="pb-3 text-sm">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart2 className="h-4 w-4 text-primary" />
                            Análises Recentes
                        </CardTitle>
                        <CardDescription>Acompanhe o status das últimas revisões enviadas.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {recentAnalyses.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-12">
                                <FileText className="h-8 w-8 mb-2" />
                                <p className="text-sm">Nenhuma análise encontrada.</p>
                                <Link href="/dashboard/analyses/new" className="mt-4">
                                    <Button variant="outline" size="sm">Nova Análise</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentAnalyses.map((analysis) => (
                                    <Link key={analysis.id} href={`/dashboard/analyses/${analysis.id}`}>
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-accent/5 hover:border-primary/30 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/5 rounded-md group-hover:bg-primary/10 transition-colors">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{analysis.company_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                                                        {analysis.status === 'completed' ? ' · Concluído' : ' · ' + analysis.status}
                                                    </p>
                                                </div>
                                            </div>
                                            {analysis.original_rating && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                                                        Rating {analysis.original_rating}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <Card className="lg:col-span-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-primary" />
                            Ações Rápidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2 flex-1">
                        <Link href="/dashboard/analyses" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <BarChart2 className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">Minhas Análises</span>
                            </Button>
                        </Link>

                        <Link href="/dashboard/documents" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">
                                <FileText className="mr-3 h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">Meus Documentos</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
