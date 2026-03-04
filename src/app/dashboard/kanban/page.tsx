import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SquareKanban } from 'lucide-react'
import { KanbanBoard } from './KanbanBoard'

export default async function KanbanPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Buscar clínica do usuário
    const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!clinic) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <SquareKanban className="w-8 h-8 text-primary" />
                        Kanban de Leads
                    </h1>
                    <p className="text-muted-foreground mt-2">Configure sua clínica primeiro para visualizar os leads.</p>
                </div>
            </div>
        )
    }

    // Buscar pacientes da clínica
    const { data: patients } = await supabase
        .from('patients')
        .select('id, phone_number, name, lead_status, created_at, ai_paused')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })

    // Buscar instâncias para pegar últimas mensagens
    const { data: instances } = await supabase
        .from('instances')
        .select('id')
        .eq('clinic_id', clinic.id)

    const instanceIds = (instances || []).map(i => i.id)
    const phoneNumbers = (patients || []).map(p => p.phone_number)

    let lastMessages: Record<string, { content: string; created_at: string }> = {}

    if (instanceIds.length > 0 && phoneNumbers.length > 0) {
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

    // Montar dados enriquecidos
    const leads = (patients || []).map(p => ({
        id: p.id,
        phoneNumber: p.phone_number,
        name: p.name || null,
        leadStatus: p.lead_status || 'NOVO',
        createdAt: p.created_at,
        aiPaused: p.ai_paused ?? false,
        lastMessage: lastMessages[p.phone_number]?.content || null,
        lastMessageAt: lastMessages[p.phone_number]?.created_at || null,
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <SquareKanban className="w-8 h-8 text-primary" />
                    Kanban de Leads
                </h1>
                <p className="text-muted-foreground mt-2">
                    Visualize e gerencie o pipeline de atendimento da sua clínica. Arraste os cards entre as colunas.
                </p>
            </div>

            <KanbanBoard leads={leads} />
        </div>
    )
}
