import { createClient } from '@/utils/supabase/server'
import { AccountSettings } from '@/components/dashboard/AccountSettings'
import { Settings as SettingsIcon } from 'lucide-react'

export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Buscar dados da clínica
    const { data: clinic } = await supabase
        .from('clinics')
        .select('name')
        .eq('owner_id', user.id)
        .single()

    // Buscar dados da assinatura
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
            <div className="px-1 md:px-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    Configurações
                </h1>
                <p className="text-muted-foreground text-base md:text-lg mt-1 md:mt-2">
                    Gerencie seus dados de acesso, plano e suporte.
                </p>
            </div>

            <AccountSettings
                user={{ email: user.email }}
                clinic={{ name: clinic?.name }}
                subscription={subscription ? {
                    status: subscription.status,
                    current_period_end: subscription.current_period_end,
                    price_id: subscription.price_id
                } : null}
            />
        </div>
    )
}
