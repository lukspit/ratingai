'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe'

export async function registerWithSubscription(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const clinicName = formData.get('clinicName') as string
    const sessionId = formData.get('sessionId') as string

    if (!email || !password || !clinicName) {
        return redirect(`/register?session_id=${sessionId}&error=Missing fields`)
    }

    // 1. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError || !authData.user) {
        console.error('Auth Error:', authError)
        return redirect(`/register?session_id=${sessionId}&error=${encodeURIComponent(authError?.message || 'Erro ao criar conta')}`)
    }

    const userId = authData.user.id

    // 2. Criar a clínica (Usamos o Admin Client para pular RLS no Onboarding)
    const { data: clinicData, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert({
            name: clinicName,
            owner_id: userId,
            assistant_name: 'Liz' // Valor padrão por segurança
        })
        .select()
        .single()

    if (clinicError || !clinicData) {
        console.error('Clinic Error:', clinicError)
        return redirect(`/register?session_id=${sessionId}&error=Erro ao criar clínica`)
    }

    // 3. Vincular a assinatura existente a esta clínica (Admin Client para garantir o vínculo)
    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({ clinic_id: clinicData.id })
        .eq('customer_email', email)
        .is('clinic_id', null)

    if (subError) {
        console.error('Subscription Linking Error:', subError)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
