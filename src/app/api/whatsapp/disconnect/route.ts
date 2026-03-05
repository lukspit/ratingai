import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
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
            return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
        }

        // Buscar instância
        const { data: instance } = await supabase
            .from('instances')
            .select('zapi_instance_id, zapi_token, client_token')
            .eq('clinic_id', clinic.id)
            .single()

        if (!instance || !instance.zapi_instance_id || !instance.zapi_token) {
            return NextResponse.json({ error: 'Nenhuma instância configurada' }, { status: 404 })
        }

        // Chamar API da Z-API para desconectar
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (instance.client_token) {
            headers['Client-Token'] = instance.client_token
        }

        const zapiRes = await fetch(
            `https://api.z-api.io/instances/${instance.zapi_instance_id}/token/${instance.zapi_token}/disconnect`,
            { method: 'GET', headers }
        )

        if (!zapiRes.ok) {
            console.error('[Z-API DISCONNECT] Erro na resposta:', zapiRes.status)
            return NextResponse.json({ error: 'Falha ao desconectar na Z-API' }, { status: 500 })
        }

        // Atualizar status no banco pra manter consistência
        await supabase
            .from('instances')
            .update({ status: 'DISCONNECTED' })
            .eq('clinic_id', clinic.id)

        return NextResponse.json({ success: true, message: 'Instância desconectada com sucesso' })
    } catch (error: any) {
        console.error('[Z-API DISCONNECT] Erro:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
