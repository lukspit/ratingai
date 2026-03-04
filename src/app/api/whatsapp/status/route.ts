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
      return NextResponse.json({ connected: false, error: 'Clínica não encontrada' })
    }

    // Buscar instância com tokens
    const { data: instance } = await supabase
      .from('instances')
      .select('zapi_instance_id, zapi_token, client_token')
      .eq('clinic_id', clinic.id)
      .single()

    if (!instance) {
      return NextResponse.json({ connected: false, provisioning: true, smartphoneConnected: false, error: 'Nenhuma instância criada ainda' })
    }

    if (!instance.zapi_instance_id || !instance.zapi_token) {
      return NextResponse.json({ connected: false, provisioning: true, smartphoneConnected: false, error: null })
    }

    // Chamar endpoint real da Z-API pra checar status
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (instance.client_token) {
      headers['Client-Token'] = instance.client_token
    }

    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${instance.zapi_instance_id}/token/${instance.zapi_token}/status`,
      { method: 'GET', headers, next: { revalidate: 0 } }
    )

    if (!zapiRes.ok) {
      console.error('[Z-API STATUS] Erro na resposta:', zapiRes.status)
      return NextResponse.json({ connected: false, smartphoneConnected: false, error: 'Falha ao consultar Z-API' })
    }

    const zapiStatus = await zapiRes.json()

    // Atualizar status no banco pra manter consistência
    const newStatus = zapiStatus.connected ? 'CONNECTED' : 'DISCONNECTED'
    await supabase
      .from('instances')
      .update({ status: newStatus })
      .eq('clinic_id', clinic.id)

    return NextResponse.json({
      connected: zapiStatus.connected ?? false,
      smartphoneConnected: zapiStatus.smartphoneConnected ?? false,
      error: zapiStatus.error || null
    })
  } catch (error: any) {
    console.error('[Z-API STATUS] Erro:', error)
    return NextResponse.json({ connected: false, smartphoneConnected: false, error: 'Erro interno' }, { status: 500 })
  }
}
