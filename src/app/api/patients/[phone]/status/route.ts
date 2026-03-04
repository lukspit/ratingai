import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const VALID_STATUSES = ['NOVO', 'EM_ATENDIMENTO', 'INTERESSE', 'AGENDADO', 'CONCLUIDO', 'PERDIDO']

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { phone } = await params
        const { status } = await req.json()

        if (!status || !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Status inválido. Válidos: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            )
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

        // Atualizar lead_status do paciente
        const { error: updateError } = await supabase
            .from('patients')
            .update({ lead_status: status })
            .eq('clinic_id', clinic.id)
            .eq('phone_number', phone)

        if (updateError) {
            console.error('[STATUS] Erro ao atualizar:', updateError)
            return NextResponse.json(
                { error: 'Erro ao atualizar status' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, status })
    } catch (err) {
        console.error('[STATUS] Erro interno:', err)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
