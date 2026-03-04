import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
            return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
        }

        // Buscar todos os pacientes (leads) da clínica
        const { data: patients, error } = await supabase
            .from('patients')
            .select('id, phone_number, name, lead_status, created_at, ai_paused')
            .eq('clinic_id', clinic.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[KANBAN] Erro ao buscar pacientes:', error)
            return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
        }

        // Buscar a última mensagem de cada paciente para exibir no card
        const phoneNumbers = (patients || []).map(p => p.phone_number)

        // Buscar instâncias da clínica
        const { data: instances } = await supabase
            .from('instances')
            .select('id')
            .eq('clinic_id', clinic.id)

        const instanceIds = (instances || []).map(i => i.id)

        let lastMessages: Record<string, { content: string; created_at: string }> = {}

        if (instanceIds.length > 0 && phoneNumbers.length > 0) {
            // Buscar última mensagem de cada phone_number
            const { data: messages } = await supabase
                .from('messages')
                .select('phone_number, content, created_at')
                .in('instance_id', instanceIds)
                .in('phone_number', phoneNumbers)
                .order('created_at', { ascending: false })
                .limit(500)

            if (messages) {
                for (const msg of messages) {
                    if (!lastMessages[msg.phone_number]) {
                        lastMessages[msg.phone_number] = {
                            content: msg.content,
                            created_at: msg.created_at
                        }
                    }
                }
            }
        }

        // Montar resposta enriquecida
        const enrichedPatients = (patients || []).map(p => ({
            id: p.id,
            phone_number: p.phone_number,
            name: p.name || null,
            lead_status: p.lead_status || 'NOVO',
            created_at: p.created_at,
            ai_paused: p.ai_paused ?? false,
            last_message: lastMessages[p.phone_number]?.content || null,
            last_message_at: lastMessages[p.phone_number]?.created_at || null,
        }))

        return NextResponse.json({ patients: enrichedPatients })
    } catch (err) {
        console.error('[KANBAN] Erro interno:', err)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
