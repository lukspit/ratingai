import { stripe } from '@/utils/stripe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { RegisterForm } from './register-form'
import Link from 'next/link'

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
                <CardHeader className="space-y-4 pb-4">
                    <div className="flex justify-center items-center h-48 relative -mt-8 -mb-4">
                        <Image
                            src="/logos/logo_vertical_cropped.png"
                            alt="Rating.ai Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-center text-2xl font-bold text-slate-800">
                        Finalize seu Cadastro
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Pagamento confirmado! Agora, crie seu acesso para começar a usar a inteligência tributária.
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

            <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground/60 z-10">
                <span className="italic">Segurança garantida por tecnologia Supabase & Stripe</span>
                <div className="flex items-center gap-4 text-xs not-italic">
                    <Link href="/termos" className="hover:text-primary transition-colors hover:underline">Termos de Uso</Link>
                    <Link href="/privacidade" className="hover:text-primary transition-colors hover:underline">Política de Privacidade</Link>
                </div>
            </div>
        </div>
    )
}
