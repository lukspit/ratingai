'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe'

export async function registerWithSubscription(formData: FormData) {
    const supabase = await createClient()

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

    // 2. Criar a clínica
    const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .insert({
            name: clinicName,
            owner_id: userId,
        })
        .select()
        .single()

    if (clinicError || !clinicData) {
        console.error('Clinic Error:', clinicError)
        return redirect(`/register?session_id=${sessionId}&error=Erro ao criar clínica`)
    }

    // 3. Vincular a assinatura existente a esta clínica
    // Procuramos na tabela subscriptions pelo email que veio do Stripe
    const { error: subError } = await supabase
        .from('subscriptions')
        .update({ clinic_id: clinicData.id })
        .eq('customer_email', email)
        .is('clinic_id', null) // Apenas se ainda não estiver vinculado

    if (subError) {
        console.error('Subscription Linking Error:', subError)
        // Mesmo se falhar o vínculo, o usuário foi criado. 
        // Podemos tentar de novo ou logar para depurar.
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
