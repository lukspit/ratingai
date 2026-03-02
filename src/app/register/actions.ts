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

    // 1. Verificar/garantir subscription no banco (sem depender do webhook)
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

        if (stripeSubscriptionId) {
            await supabaseAdmin
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
        }
    } catch (stripeError: any) {
        console.error('Stripe session fetch error:', stripeError.message)
    }

    // 2. Criar usuário OU atualizar senha se já existir
    let userId = ''

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (createError) {
        // Se o erro for "already registered", recupera o usuário existente e atualiza a senha
        const isAlreadyRegistered =
            createError.message?.toLowerCase().includes('already registered') ||
            createError.message?.toLowerCase().includes('already been registered') ||
            createError.code === 'email_exists'

        if (isAlreadyRegistered) {
            // Busca o usuário existente pelo email via SQL com service role
            const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

            if (listError || !existingUsers) {
                return redirect(`/register?session_id=${sessionId}&error=Erro ao recuperar conta existente.`)
            }

            const existingUser = existingUsers.users.find(u => u.email === email)

            if (!existingUser) {
                return redirect(`/login?error=${encodeURIComponent('Conta já existe. Faça login com sua senha.')}`)
            }

            userId = existingUser.id

            // Atualiza a senha do usuário existente
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })

            if (updateError) {
                console.error('Password update error:', updateError)
                return redirect(`/login?error=${encodeURIComponent('Conta já existe. Faça login com sua senha.')}`)
            }
        } else {
            return redirect(`/register?session_id=${sessionId}&error=${encodeURIComponent(createError.message || 'Erro ao criar conta')}`)
        }
    } else {
        userId = newUser.user.id
    }

    // 3. Login automático com as credenciais
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
        console.error('Auto sign-in error:', signInError)
        return redirect(`/login?error=${encodeURIComponent('Conta criada! Faça login para continuar.')}`)
    }

    // 4. Verificar se já existe uma clínica para esse usuário
    const { data: existingClinic } = await supabaseAdmin
        .from('clinics')
        .select('id')
        .eq('owner_id', userId)
        .single()

    let clinicId = existingClinic?.id

    // Se não tem clínica, cria uma nova
    if (!clinicId) {
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

        clinicId = clinicData.id
    }

    // 5. Vincular a subscription à clínica (pelo email do Stripe)
    await supabaseAdmin
        .from('subscriptions')
        .update({ clinic_id: clinicId })
        .eq('customer_email', stripeCustomerEmail)
        .is('clinic_id', null)

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
