import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { Activity, Users, MessageCircle, Settings, QrCode, Calendar as CalendarIcon, ArrowRight, TrendingUp, Rocket, AlertTriangle, Sparkles, Brain, CalendarDays, KanbanSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ZapiStatusCard } from './ZapiStatusCard'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Não autenticado.</div>
    }

    // 1. Puxar clínica associada ao usuário
    const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name, rules')
        .eq('owner_id', user.id)
        .single()

    const hasCompletedOnboarding = !!(clinic?.rules)

    let status = 'Desconectada'
    let isConnected = false
    let hasInstance = false
    let newPatients7Days = 0
    let appointments7Days = 0
    let upcomingAppointments: any[] = []
    let estimatedConversion = '0%'

    if (clinic) {
        const last7Days = new Date()
        last7Days.setDate(last7Days.getDate() - 7)
        last7Days.setHours(0, 0, 0, 0)

        const now = new Date()

        // 2-6. Queries em paralelo
        const [
            { data: instance },
            { count: newPatientsCount },
            { count: appointments7DaysCount },
            { data: appointments }
        ] = await Promise.all([
            // Instância (Z-API)
            supabase
                .from('instances')
                .select('status')
                .eq('clinic_id', clinic.id)
                .single(),

            // Pacientes novos nos últimos 7 dias
            supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinic.id)
                .gte('created_at', last7Days.toISOString()),

            // Agendamentos nos últimos 7 dias (criados)
            supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinic.id)
                .gte('created_at', last7Days.toISOString()),

            // Próximos agendamentos
            supabase
                .from('appointments')
                .select('id, scheduled_at, status, patients(name)')
                .eq('clinic_id', clinic.id)
                .gte('scheduled_at', now.toISOString())
                .order('scheduled_at', { ascending: true })
                .limit(5)
        ])

        if (instance) {
            hasInstance = true
            if (instance.status === 'CONNECTED') {
                status = 'Online'
                isConnected = true
            }
        }

        newPatients7Days = newPatientsCount || 0
        appointments7Days = appointments7DaysCount || 0

        if (newPatients7Days > 0) {
            const conversionRate = Math.round((appointments7Days / newPatients7Days) * 100)
            estimatedConversion = `${conversionRate}%`
        }

        upcomingAppointments = appointments || []
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">

            {/* ─── BANNER DE ONBOARDING PENDENTE ─── */}
            {!hasCompletedOnboarding && (
                <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/60 via-orange-900/40 to-amber-900/30 p-6 shadow-lg">
                    {/* Glow de fundo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 pointer-events-none" />
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center gap-5">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-orange-400" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                                    Ação necessária
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">
                                Sua IA ainda não conhece a sua clínica
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                                Sem o setup, a IA não tem como responder corretamente sobre preços, horários, convênios ou localização.
                                Configure agora — leva menos de 10 minutos e é o que transforma o sistema numa máquina que agenda por você.
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            <Link href="/dashboard/settings">
                                <Button className="bg-orange-500 hover:bg-orange-400 text-white font-semibold h-11 px-5 transition-all shadow-lg shadow-orange-500/20 group">
                                    <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                    Configurar IA
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Activity className="w-8 h-8 text-primary" />
                    Bem-vindo(a){clinic?.name ? `, ${clinic.name}` : ''}
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Visão geral da sua inteligência artificial.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Novos Leads (7 dias)</CardTitle>
                        <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{newPatients7Days}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pessoas que chamaram no WhatsApp
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Agendamentos (7 dias)</CardTitle>
                        <CalendarDays className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{appointments7Days}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Consultas marcadas pela IA
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Taxa Conversão (7 dias)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{estimatedConversion}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Agendamentos / Novos Leads
                        </p>
                    </CardContent>
                </Card>

                <ZapiStatusCard
                    initialStatus={status}
                    initialIsConnected={isConnected}
                    hasInstance={hasInstance}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Próximos Agendamentos
                        </CardTitle>
                        <CardDescription>
                            Os últimos compromissos marcados pela IA na sua agenda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-56 overflow-y-auto pr-2">
                        {upcomingAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-80 mt-4 pb-4">
                                <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm">Nenhum agendamento futuro no momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAppointments.map((apt: any) => {
                                    const aptDate = new Date(apt.scheduled_at)
                                    const dateFormatted = aptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                    const timeFormatted = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                                    return (
                                        <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-muted/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{apt.patients?.name || 'Paciente sem nome'}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{apt.status === 'PENDING' ? 'Pendente' : apt.status}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-primary">{timeFormatted}</span>
                                                <span className="text-xs text-muted-foreground">{dateFormatted}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden flex flex-col">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-primary/10"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            Ações Rápidas
                        </CardTitle>
                        <CardDescription>Atalhos úteis para o dia a dia.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 auto-rows-min">
                        <Link href="/dashboard/kanban" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-14 relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <KanbanSquare className="mr-3 h-5 w-5 text-indigo-500" />
                                <div className="flex flex-col items-start relative z-10">
                                    <span className="font-medium tracking-wide">Gestão de Leads</span>
                                    <span className="text-xs text-muted-foreground font-normal">Ver Kanban</span>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500 relative z-10" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/conversations" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-14 relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <MessageCircle className="mr-3 h-5 w-5 text-blue-500" />
                                <div className="flex flex-col items-start relative z-10">
                                    <span className="font-medium tracking-wide">Conversas</span>
                                    <span className="text-xs text-muted-foreground font-normal">Acessar Chat</span>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500 relative z-10" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/integrations" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-14 relative group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <CalendarDays className="mr-3 h-5 w-5 text-emerald-500" />
                                <div className="flex flex-col items-start relative z-10">
                                    <span className="font-medium tracking-wide">Integração Agenda</span>
                                    <span className="text-xs text-muted-foreground font-normal">Google Calendar</span>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 relative z-10" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/settings" legacyBehavior passHref>
                            <Button
                                variant="outline"
                                className={`w-full justify-start h-14 relative group overflow-hidden transition-all ${!hasCompletedOnboarding
                                    ? 'border-orange-500/40 hover:border-orange-400/60 bg-orange-500/5'
                                    : 'border-border/50 hover:border-primary/50'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-primary/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <Settings className={`mr-3 h-5 w-5 ${!hasCompletedOnboarding ? 'text-orange-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                <div className="flex flex-col items-start relative z-10">
                                    <span className="font-medium tracking-wide">
                                        {!hasCompletedOnboarding ? 'Configurar IA ⚡' : 'Configurações'}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {!hasCompletedOnboarding ? 'Ação Necessária' : 'Ajustar Regras'}
                                    </span>
                                </div>
                                <ArrowRight className={`ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all relative z-10 ${!hasCompletedOnboarding ? 'text-orange-400' : 'text-gray-500'}`} />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
