import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { notification_phone } = await request.json()

        // Atualiza o telefone de notificação da clínica
        const { error } = await supabase
            .from('clinics')
            .update({ notification_phone })
            .eq('owner_id', user.id)

        if (error) {
            console.error('[WHATSAPP NOTIFICATION] Erro ao atualizar:', error)
            return NextResponse.json({ error: 'Erro ao atualizar número' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[WHATSAPP NOTIFICATION] Erro Interno:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
