import { stripe } from '@/utils/stripe'
import { registerWithSubscription } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { redirect } from 'next/navigation'

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
                    <form action={registerWithSubscription} className="space-y-5">
                        <input type="hidden" name="sessionId" value={sessionId} />

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-medium">E-mail da Assinatura</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                readOnly
                                defaultValue={email}
                                className="bg-slate-50 border-slate-200 cursor-not-allowed font-medium text-slate-600"
                            />
                            <p className="text-[10px] text-muted-foreground italic">* Este é o e-mail utilizado no pagamento.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clinicName" className="text-slate-700 font-medium">Nome da sua Clínica / Consultório</Label>
                            <Input
                                id="clinicName"
                                name="clinicName"
                                type="text"
                                required
                                placeholder="Ex: Clínica Santa Luzia"
                                className="bg-white border-slate-200 focus:border-primary focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 font-medium">Crie uma Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                                className="bg-white border-slate-200 focus:border-primary focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {params.error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                                {params.error}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                                Ativar meu Acesso
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="absolute bottom-6 left-0 right-0 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground/60 z-10 italic">
                <span>Segurança garantida por tecnologia Supabase & Stripe</span>
            </div>
        </div>
    )
}
