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
        return redirect(`/register?session_id=${sessionId}&error=Preencha todos os campos`)
    }

    if (!sessionId) {
        return redirect(`/pricing?error=Sessão de pagamento inválida.`)
    }

    // 1. Verificar e garantir assinatura no banco (sem depender do webhook)
    //    Busca a sessão do Stripe diretamente pelo session_id que veio da URL.
    let stripeCustomerEmail = email
    let stripeCustomerId = ''
    let stripeSubscriptionId = ''
    let subscriptionStatus = 'active'
    let priceId = ''
    let currentPeriodEnd = new Date()

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'customer'],
        })

        const sub = session.subscription as any
        const customer = session.customer as any

        stripeCustomerEmail = session.customer_details?.email || email
        stripeCustomerId = customer?.id || ''
        stripeSubscriptionId = sub?.id || ''
        subscriptionStatus = sub?.status || 'active'
        priceId = sub?.items?.data?.[0]?.price?.id || ''
        currentPeriodEnd = sub?.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : new Date()

        // Upsert no banco: cria a subscription se não existir (caso webhook tenha falhado)
        if (stripeSubscriptionId) {
            const { error: upsertError } = await supabaseAdmin
                .from('subscriptions')
                .upsert(
                    {
                        customer_email: stripeCustomerEmail,
                        stripe_customer_id: stripeCustomerId,
                        stripe_subscription_id: stripeSubscriptionId,
                        status: subscriptionStatus,
                        price_id: priceId,
                        current_period_end: currentPeriodEnd.toISOString(),
                    },
                    { onConflict: 'stripe_subscription_id' }
                )

            if (upsertError) {
                console.error('Subscription upsert error:', upsertError)
            }
        }
    } catch (stripeError: any) {
        console.error('Stripe session fetch error:', stripeError.message)
        // Continua o fluxo mesmo se houver erro ao buscar sessão Stripe,
        // pois o webhook pode ter já inserido a subscription antes.
    }

    // 2. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError || !authData.user) {
        console.error('Auth Error:', authError)
        let friendlyMsg = 'Erro ao criar conta. Tente novamente.'
        if (authError?.message?.toLowerCase().includes('rate limit')) {
            friendlyMsg = 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente com um email diferente.'
        } else if (authError?.message) {
            friendlyMsg = authError.message
        }
        return redirect(`/register?session_id=${sessionId}&error=${encodeURIComponent(friendlyMsg)}`)
    }

    const userId = authData.user.id

    // 3. Criar a clínica (Admin Client para bypass de RLS)
    const { data: clinicData, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert({
            name: clinicName,
            owner_id: userId,
            assistant_name: 'Liz',
        })
        .select()
        .single()

    if (clinicError || !clinicData) {
        console.error('Clinic Error:', JSON.stringify(clinicError))
        const errorMsg = clinicError?.message || 'Erro ao criar clínica'
        return redirect(`/register?session_id=${sessionId}&error=${encodeURIComponent(errorMsg)}`)
    }

    // 4. Vincular a assinatura à clínica (pelo email usado no checkout)
    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({ clinic_id: clinicData.id })
        .eq('customer_email', stripeCustomerEmail)
        .is('clinic_id', null)

    if (subError) {
        console.error('Subscription Linking Error:', subError)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
