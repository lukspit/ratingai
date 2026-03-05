import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Buscar a assinatura para obter o customer_id do Stripe
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('customer_email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let customerId = subscription?.stripe_customer_id

        // Se não encontrar no banco, tenta buscar no Stripe pelo e-mail
        if (!customerId) {
            const customers = await stripe.customers.list({
                email: user.email!,
                limit: 1
            })

            if (customers.data.length > 0) {
                customerId = customers.data[0].id
            }
        }

        if (!customerId) {
            return NextResponse.json({ error: 'Cliente Stripe não encontrado' }, { status: 404 })
        }

        // Criar sessão do portal
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${new URL(req.url).origin}/dashboard/account`,
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('Erro ao criar sessão do portal:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
