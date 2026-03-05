'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { CalendarSelector } from './CalendarSelector'
export function GoogleConnectButton({ isConnected, savedCalendarsRaw }: { isConnected: boolean, savedCalendarsRaw: string | null }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const supabase = createClient()

    const handleConnect = async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                },
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            console.error('Erro ao conectar com Google', error)
            setIsLoading(false)
        }
    }

    const handleDisconnect = async () => {
        setIsDisconnecting(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase.from('clinics').update({
                google_access_token: null,
                google_refresh_token: null,
                google_calendar_id: null
            }).eq('owner_id', user.id)

            // Recarrega a página para refletir no back-end
            window.location.reload()
        }
        setIsDisconnecting(false)
    }

    if (isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-6 border border-border bg-card shadow-sm rounded-xl space-y-3">
                <CheckCircle2 className="w-12 h-12 text-primary" />
                <div className="text-center">
                    <h3 className="font-semibold text-foreground">Google Calendar Conectado!</h3>
                    <p className="text-sm text-muted-foreground mb-6">A IA já tem permissão para gerenciar sua agenda.</p>
                </div>
                <div className="w-full max-w-2xl border-t border-border pt-4">
                    <CalendarSelector savedCalendarsRaw={savedCalendarsRaw} />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                >
                    {isDisconnecting ? 'Desconectando...' : 'Desconectar Conta Google'}
                </Button>
            </div>
        )
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#4285F4] hover:bg-[#3367D6] text-white flex gap-2 items-center"
        >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
            Autorizar Acesso ao Google Calendar
        </Button>
    )
}
