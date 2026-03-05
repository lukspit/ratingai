import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { Activity, Users, MessageCircle, Settings, QrCode, Calendar as CalendarIcon, ArrowRight, TrendingUp, Rocket, AlertTriangle, Sparkles, Brain, CalendarDays, KanbanSquare, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ZapiStatusCard } from './ZapiStatusCard'
import { DashboardCharts } from './components/DashboardCharts'

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

    // Saudação baseada no horário
    const hour = new Date().getHours()
    let greeting = 'Boa noite'
    if (hour >= 5 && hour < 12) greeting = 'Bom dia'
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde'

    let status = 'Desconectada'
    let isConnected = false
    let hasInstance = false
    let newPatients7Days = 0
    let appointments7Days = 0
    let upcomingAppointments: any[] = []
    let recentMessages: any[] = []
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
            { data: appointments },
            { data: messages }
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
                .limit(5),

            // Mensagens recentes (IA em Ação)
            supabase
                .from('messages')
                .select('content, role, created_at, phone_number')
                .eq('clinic_id', clinic.id)
                .order('created_at', { ascending: false })
                .limit(4)
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
        recentMessages = messages || []

        // 7. Preparar dados para os gráficos
        // Gráfico de Leads (últimos 7 dias)
        const days = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            days.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }))
        }

        // Simulação de distribuição diária (em um cenário real, faríamos group by no DB)
        // Como temos o count total e os objetos, podemos agrupar aqui
        const { data: allPatients7Days } = await supabase
            .from('patients')
            .select('created_at')
            .eq('clinic_id', clinic.id)
            .gte('created_at', last7Days.toISOString())

        const leadsByDay = days.map(dayName => {
            const count = allPatients7Days?.filter(p => {
                const pDate = new Date(p.created_at).toLocaleDateString('pt-BR', { weekday: 'short' })
                return pDate === dayName
            }).length || 0
            return { day: dayName, count }
        })

        const leadsChartData = leadsByDay

        const appointmentsChartData = [
            { name: 'Leads', value: newPatients7Days, color: '#3b82f6' },
            { name: 'Agendados', value: appointments7Days, color: '#10b981' }
        ]

        return (
            <DashboardContent
                clinic={clinic}
                user={user}
                greeting={greeting}
                hasCompletedOnboarding={hasCompletedOnboarding}
                newPatients7Days={newPatients7Days}
                appointments7Days={appointments7Days}
                estimatedConversion={estimatedConversion}
                status={status}
                isConnected={isConnected}
                hasInstance={hasInstance}
                recentMessages={recentMessages}
                upcomingAppointments={upcomingAppointments}
                leadsChartData={leadsChartData}
                appointmentsChartData={appointmentsChartData}
            />
        )
    }

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <Rocket className="h-12 w-12 text-primary mb-4 opacity-20" />
            <h2 className="text-xl font-bold">Nenhuma clínica encontrada</h2>
            <p className="text-muted-foreground">Parece que você ainda não configurou sua clínica.</p>
            <Link href="/dashboard/settings" className="mt-4">
                <Button>Começar Onboarding</Button>
            </Link>
        </div>
    )
}

function DashboardContent({
    clinic,
    user,
    greeting,
    hasCompletedOnboarding,
    newPatients7Days,
    appointments7Days,
    estimatedConversion,
    status,
    isConnected,
    hasInstance,
    recentMessages,
    upcomingAppointments,
    leadsChartData,
    appointmentsChartData
}: any) {
    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">

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
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Dashboard Operacional</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    {greeting}, {user.user_metadata?.full_name?.split(' ')[0] || 'Doutor(a)'} 👋🏻
                </h1>
                <p className="text-muted-foreground text-lg mt-2 font-medium">
                    Veja como sua assistente cuidou dos seus pacientes hoje.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">Novos Leads</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold">{newPatients7Days}</div>
                            <span className="text-[10px] font-bold text-blue-500/80 bg-blue-500/5 px-1.5 py-0.5 rounded italic">7 dias</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            Potenciais pacientes captados
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">Agendamentos</CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CalendarDays className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold">{appointments7Days}</div>
                            <span className="text-[10px] font-bold text-emerald-500/80 bg-emerald-500/5 px-1.5 py-0.5 rounded italic">7 dias</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Consultas marcadas pela IA
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">Conversão</CardTitle>
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold">{estimatedConversion}</div>
                            <span className="text-[10px] font-bold text-indigo-500/80 bg-indigo-500/5 px-1.5 py-0.5 rounded italic">Taxa</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            Eficiência da sua assistente
                        </p>
                    </CardContent>
                </Card>

                <ZapiStatusCard
                    initialStatus={status}
                    initialIsConnected={isConnected}
                    hasInstance={hasInstance}
                />
            </div>

            {/* ─── SEÇÃO DE GRÁFICOS ─── */}
            <DashboardCharts
                leadsData={leadsChartData}
                appointmentsData={appointmentsChartData}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
                {/* Atividade Recente - IA em Ação */}
                <Card className="lg:col-span-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg flex flex-col">
                    <CardHeader className="pb-3 text-sm">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                Inteligência em Ação
                            </CardTitle>
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Live</span>
                        </div>
                        <CardDescription>Últimas interações da sua assistente.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {recentMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-8">
                                <MessageCircle className="h-8 w-8 mb-2" />
                                <p className="text-sm">Aguardando mensagens...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentMessages.map((msg: any, i: number) => (
                                    <div key={i} className={`flex flex-col gap-1 p-3 rounded-xl border ${msg.role === 'assistant' ? 'bg-primary/5 border-primary/10 mr-4' : 'bg-muted/30 border-border/50 ml-4'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                                {msg.role === 'assistant' ? 'Assistente IA' : `Paciente (${msg.phone_number?.slice(-4)})`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground italic">
                                                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs line-clamp-2 leading-relaxed">
                                            {msg.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-4 pt-0">
                        <Link href="/dashboard/conversations">
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary py-0">
                                Ver todas as conversas
                                <ArrowRight className="h-3 w-3 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </Card>

                {/* Próximos Agendamentos */}
                <Card className="lg:col-span-5 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-emerald-500" />
                            Escala de Atendimento
                        </CardTitle>
                        <CardDescription>
                            Próximos pacientes agendados pela IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                        {upcomingAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-80 py-4">
                                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                                    <CalendarIcon className="h-6 w-6 text-muted-foreground/30" />
                                </div>
                                <p className="text-sm text-center px-4 italic">Sua agenda está livre por enquanto.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAppointments.map((apt: any) => {
                                    const aptDate = new Date(apt.scheduled_at)
                                    const dateFormatted = aptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                    const timeFormatted = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                                    return (
                                        <div key={apt.id} className="group flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase">
                                                    {apt.patients?.name?.charAt(0) || 'P'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm group-hover:text-emerald-400 transition-colors">{apt.patients?.name || 'Paciente sem nome'}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Consulta</span>
                                                        <div className="h-1 w-1 bg-muted-foreground rounded-full opacity-30" />
                                                        <span className="text-[10px] text-emerald-500 font-bold italic tracking-tighter ">Confirmado IA</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-sm text-foreground">{timeFormatted}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{dateFormatted}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <Card className="lg:col-span-3 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Rocket className="h-4 w-4 text-primary" />
                            Ações Rápidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2 flex-1">
                        <Link href="/dashboard/kanban" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">
                                <KanbanSquare className="mr-3 h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">CRM / Kanban</span>
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/whatsapp" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <QrCode className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">QR Code WhatsApp</span>
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/integrations" legacyBehavior passHref>
                            <Button variant="outline" className="w-full justify-start h-12 relative group overflow-hidden border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
                                <CalendarDays className="mr-3 h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">Google Agenda</span>
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Button>
                        </Link>

                        <Link href="/dashboard/settings" legacyBehavior passHref>
                            <Button
                                variant="outline"
                                className={`w-full justify-start h-12 relative group overflow-hidden transition-all ${!hasCompletedOnboarding
                                    ? 'border-orange-500/40 bg-orange-500/5 hover:border-orange-500'
                                    : 'border-border/50 hover:border-primary/50 hover:bg-primary/5 uppercase'
                                    }`}
                            >
                                <Settings className={`mr-3 h-4 w-4 group-hover:scale-110 transition-transform ${!hasCompletedOnboarding ? 'text-orange-400' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                                <span className="text-xs font-semibold tracking-tighter">
                                    {!hasCompletedOnboarding ? 'Completar Setup ⚡' : 'Configurações'}
                                </span>
                                <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
