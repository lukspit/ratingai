import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { WhatsAppManager } from './components/WhatsAppManager'
import { Smartphone } from 'lucide-react'

export default async function WhatsAppConnectionPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Buscar a clínica vinculada
    const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    // Buscar possível instância dessa clínica
    let isConnected = false
    let isProvisioning = true // default para quem não tem DB atualizado, na prática a rules action cadastra em branco 
    let instanceInfo = undefined

    if (clinic) {
        const { data: instance } = await supabase
            .from('instances')
            .select('id, zapi_instance_id, zapi_token, status')
            .eq('clinic_id', clinic.id)
            .single()

        if (instance) {
            if (!instance.zapi_instance_id || !instance.zapi_token) {
                isProvisioning = true
            } else {
                isProvisioning = false
                // isConnected can only be precisely known by the client making an API status call.
                // However, we initially assume it is false to force the UI check.
                isConnected = instance.status === 'CONNECTED'
                instanceInfo = {
                    id: instance.id,
                    zapi_instance_id: instance.zapi_instance_id
                }
            }
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Smartphone className="w-8 h-8 text-primary" />
                    Conexão WhatsApp
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Vincule seu número para que a inteligência artificial comece a operar.
                </p>
            </div>

            <WhatsAppManager initialIsProvisioning={isProvisioning} initialIsConnected={isConnected} instanceInfo={instanceInfo} />
        </div>
    )
}
