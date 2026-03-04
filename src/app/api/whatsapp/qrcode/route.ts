import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Buscar clínica do usuário
        const { data: clinic } = await supabase
            .from('clinics')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!clinic) {
            return NextResponse.json({ connected: false, error: 'Clínica não encontrada' }, { status: 404 })
        }

        // Buscar instância
        const { data: instance } = await supabase
            .from('instances')
            .select('zapi_instance_id, zapi_token, client_token')
            .eq('clinic_id', clinic.id)
            .single()

        if (!instance || !instance.zapi_instance_id || !instance.zapi_token) {
            return NextResponse.json({ error: 'Instância em provisionamento ou não configurada' }, { status: 400 })
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (instance.client_token) {
            headers['Client-Token'] = instance.client_token
        }

        const zapiRes = await fetch(
            `https://api.z-api.io/instances/${instance.zapi_instance_id}/token/${instance.zapi_token}/qr-code/image`,
            { method: 'GET', headers, next: { revalidate: 0 } }
        )

        if (!zapiRes.ok) {
            // Pode falhar caso já esteja conectada, por exemplo.
            console.error('[Z-API QRCODE] Erro na resposta:', zapiRes.status)
            return NextResponse.json({ error: 'Falha ao buscar QR Code da Z-API' }, { status: zapiRes.status })
        }

        const qrCodeData = await zapiRes.json()

        return NextResponse.json(qrCodeData)
    } catch (error: any) {
        console.error('[Z-API QRCODE] Erro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
