'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, CreditCard, LifeBuoy, LogOut, ExternalLink, Mail, Building, Calendar, Globe, MessageCircle } from 'lucide-react'

interface AccountSettingsProps {
    user: {
        email?: string
    }
    clinic: {
        name?: string
    }
    subscription: {
        status: string
        current_period_end?: string
        price_id?: string
    } | null
}

export function AccountSettings({ user, clinic, subscription }: AccountSettingsProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleManageSubscription = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/stripe/portal', { method: 'POST' })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Erro ao abrir portal do Stripe:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativa</Badge>
            case 'trialing':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Trial</Badge>
            case 'past_due':
                return <Badge className="bg-orange-500 hover:bg-orange-600">Atrasada</Badge>
            case 'canceled':
                return <Badge variant="destructive">Cancelada</Badge>
            default:
                return <Badge variant="secondary">{status || 'Inativa'}</Badge>
        }
    }

    return (
        <div className="grid gap-6">
            {/* Perfil e Dados Básicos */}
            <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <div className="h-1.5 bg-primary/30" />
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Dados do Perfil</CardTitle>
                            <CardDescription>Informações básicas da sua conta.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="p-4 bg-secondary/20 rounded-2xl border border-border/40 transition-colors hover:bg-secondary/30">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                <span>E-mail de Acesso</span>
                            </div>
                            <p className="font-medium text-foreground truncate">{user.email || 'Não informado'}</p>
                        </div>
                        <div className="p-4 bg-secondary/20 rounded-2xl border border-border/40 transition-colors hover:bg-secondary/30">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1.5">
                                <Building className="w-3.5 h-3.5" />
                                <span>Clínica</span>
                            </div>
                            <p className="font-medium text-foreground truncate">{clinic.name || 'Não configurada'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assinatura e Billing */}
            <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <div className="h-1.5 bg-blue-500/30" />
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Assinatura</CardTitle>
                            <CardDescription>Plano e faturamento.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-5 md:p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xl">Plano Nexus SaaS</span>
                                {getStatusBadge(subscription?.status || 'inactive')}
                            </div>
                            {subscription?.current_period_end && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4 text-blue-500/70" />
                                    <span>Renovação: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(subscription.current_period_end))}</span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 md:h-11 shadow-lg shadow-blue-500/20 px-6 font-semibold"
                            onClick={handleManageSubscription}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Carregando...' : (
                                <>
                                    Gerenciar Pagamento
                                    <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground bg-blue-500/5 p-4 rounded-2xl flex items-start gap-3 border border-blue-500/5">
                        <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Globe className="w-3 h-3 text-blue-500" />
                        </div>
                        <p className="leading-relaxed">
                            O gerenciamento do cartão, cancelamento e histórico de faturas é feito de forma segura através do <span className="font-semibold text-blue-600 dark:text-blue-400">Portal do Cliente Stripe</span>.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Suporte e Ajuda */}
            <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <div className="h-1.5 bg-emerald-500/30" />
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <LifeBuoy className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Suporte</CardTitle>
                            <CardDescription>Precisa de auxílio?</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href="https://wa.me/5511999999999"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 transition-all group shadow-sm active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">WhatsApp</p>
                                    <p className="text-xs text-muted-foreground">Seg a Sex, 09h às 18h</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </a>

                        <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl border border-border/40 opacity-50 grayscale">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Central de Ajuda</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-50">Em breve</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logout (Mobile focus) */}
            <div className="md:hidden pt-4 pb-6">
                <form action="/auth/signout" method="post">
                    <Button variant="ghost" className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 border border-red-500/10 font-bold transition-all active:scale-[0.98]">
                        <LogOut className="w-5 h-5" />
                        Finalizar Sessão
                    </Button>
                </form>
            </div>
        </div>
    )
}

function ArrowUpRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
        </svg>
    )
}
