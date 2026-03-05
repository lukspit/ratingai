'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, CreditCard, LifeBuoy, LogOut, ExternalLink, Mail, Building, Calendar, Globe } from 'lucide-react'

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
            // Aqui chamaremos uma API para criar o link do Customer Portal do Stripe
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
            <Card className="border-none shadow-md overflow-hidden">
                <div className="h-2 bg-primary/20" />
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Dados do Perfil</CardTitle>
                            <CardDescription>Informações básicas da sua conta no Nexus.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Mail className="w-4 h-4" />
                                <span>E-mail de Acesso</span>
                            </div>
                            <p className="font-medium text-foreground">{user.email || 'Não informado'}</p>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Building className="w-4 h-4" />
                                <span>Clínica</span>
                            </div>
                            <p className="font-medium text-foreground">{clinic.name || 'Não configurada'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assinatura e Billing */}
            <Card className="border-none shadow-md overflow-hidden">
                <div className="h-2 bg-blue-500/20" />
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle>Assinatura e Faturamento</CardTitle>
                            <CardDescription>Gerencie seu plano, pagamentos e renovações.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">Plano Nexus SaaS</span>
                                {getStatusBadge(subscription?.status || 'inactive')}
                            </div>
                            {subscription?.current_period_end && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>Renova em: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(subscription.current_period_end))}</span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            className="bg-background border-blue-200 hover:bg-blue-50 text-blue-700 hover:text-blue-800"
                            onClick={handleManageSubscription}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Carregando...' : (
                                <>
                                    Gerenciar Assinatura
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-lg flex items-start gap-2 italic">
                        <span className="text-blue-500 font-bold">INFO:</span>
                        O gerenciamento do cartão, cancelamento e histórico de faturas é feito de forma segura através do Portal do Cliente Stripe.
                    </div>
                </CardContent>
            </Card>

            {/* Suporte e Ajuda */}
            <Card className="border-none shadow-md overflow-hidden">
                <div className="h-2 bg-emerald-500/20" />
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <LifeBuoy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle>Suporte e Ajuda</CardTitle>
                            <CardDescription>Precisa de auxílio técnico ou tem alguma dúvida?</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href="https://wa.me/5511999999999" // TODO: Confirmar número de suporte
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600">
                                    <MessageCircleIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground group-hover:text-emerald-700 transition-colors">Suporte via WhatsApp</p>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">Seg a Sex, 09h às 18h</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </a>

                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50 opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Central de Ajuda</p>
                                    <p className="text-xs text-muted-foreground">Em breve</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logout (Mobile focus) */}
            <div className="md:hidden pt-4">
                <form action="/auth/signout" method="post">
                    <Button variant="destructive" className="w-full h-12 rounded-xl flex items-center gap-3">
                        <LogOut className="w-5 h-5" />
                        Sair da Conta
                    </Button>
                </form>
            </div>
        </div>
    )
}

function MessageCircleIcon(props: any) {
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
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
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
