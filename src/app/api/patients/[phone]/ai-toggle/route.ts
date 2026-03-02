import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { paused } = await request.json()
    const { phone } = await params

    if (typeof paused !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo "paused" (boolean) é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a clínica do usuário logado
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!clinic) {
      return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
    }

    // Atualizar o flag ai_paused do paciente
    const { data, error } = await supabase
      .from('patients')
      .update({ ai_paused: paused })
      .eq('clinic_id', clinic.id)
      .eq('phone_number', phone)
      .select('id, phone_number, ai_paused')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Paciente não encontrado para este número' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      aiPaused: data.ai_paused
    })
  } catch (error: any) {
    console.error('Erro ao alternar pausa da IA:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
