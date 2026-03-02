import { stripe } from '@/utils/stripe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { RegisterForm } from './register-form'

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string; error?: string }>
}) {
    const params = await searchParams
    const sessionId = params.session_id

    if (!sessionId) {
        redirect('/pricing')
    }

    // Buscar o email direto do Stripe para garantir que é o que pagou
    let email = ''
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        email = session.customer_details?.email || ''
    } catch (e) {
        console.error('Stripe Session Retrieval Error:', e)
        redirect('/pricing?error=invalid_session')
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans">
            {/* Efeito de fundo sutil */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            <Card className="w-full max-w-md border-border bg-white shadow-xl z-10">
                <CardHeader className="space-y-4 pb-8">
                    <div className="flex justify-center items-center h-14 relative mb-2">
                        <Image src="/logos/nexus_logo_equalized.png" alt="Nexus Clínicas Logo" fill className="object-contain" priority />
                    </div>
                    <CardTitle className="text-center text-2xl font-bold text-slate-800">
                        Finalize seu Cadastro
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Pagamento confirmado! Agora, crie seu acesso para começar a usar a IA na sua clínica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm
                        email={email}
                        sessionId={sessionId}
                        error={params.error}
                    />
                </CardContent>
            </Card>

            <div className="absolute bottom-6 left-0 right-0 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground/60 z-10 italic">
                <span>Segurança garantida por tecnologia Supabase & Stripe</span>
            </div>
        </div>
    )
}
