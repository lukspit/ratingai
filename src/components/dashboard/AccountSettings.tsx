'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, CreditCard, LifeBuoy, LogOut, ExternalLink, Mail, Building, Calendar, Globe, MessageCircle, Briefcase } from 'lucide-react'

interface AccountSettingsProps {
    user: {
        email?: string
    }
    profile: {
        full_name?: string
        oab?: string
        onboarding_completed?: boolean
    } | null
    subscription: {
        status: string
        current_period_end?: string
        price_id?: string
    } | null
}

export function AccountSettings({ user, profile, subscription }: AccountSettingsProps) {
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
                                <User className="w-3.5 h-3.5" />
                                <span>Nome Completo</span>
                            </div>
                            <p className="font-medium text-foreground truncate">{profile?.full_name || 'Não informado'}</p>
                        </div>
                        <div className="p-4 bg-secondary/20 rounded-2xl border border-border/40 transition-colors hover:bg-secondary/30">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>OAB</span>
                            </div>
                            <p className="font-medium text-foreground truncate">{profile?.oab || 'Não informado'}</p>
                        </div>
                        <div className="p-4 bg-secondary/20 rounded-2xl border border-border/40 transition-colors hover:bg-secondary/30 md:col-span-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                <span>E-mail de Acesso</span>
                            </div>
                            <p className="font-medium text-foreground truncate">{user.email || 'Não informado'}</p>
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
                                <span className="font-bold text-xl">Plano TributaReview</span>
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
