import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <Card className="w-full max-w-md border-border bg-white shadow-sm z-10">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center items-center h-14 relative mb-2">
                        <Image src="/logos/nexus_logo_equalized.png" alt="Nexus Clínicas Logo" fill className="object-contain" priority />
                    </div>
                    <CardDescription className="text-center text-muted-foreground">
                        Acesse o painel de gestão da sua clínica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="dr@clinica.com"
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="flex flex-col gap-2 pt-4">
                            <Button formAction={login} className="w-full sm:hover:scale-[1.02] transition-transform">
                                Entrar
                            </Button>
                            <Button asChild variant="outline" className="w-full sm:hover:scale-[1.02] transition-transform">
                                <Link href="/pricing">
                                    Criar Conta
                                </Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="absolute bottom-4 left-0 right-0 text-center flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground z-10">
                <div className="flex items-center gap-2">
                    <span>Powered by</span>
                    <span className="font-semibold text-foreground">lucaspit.ai</span>
                </div>
                <div className="flex gap-4 text-xs mt-1">
                    <Link href="/termos" className="hover:text-primary transition-colors hover:underline">Termos de Uso</Link>
                    <Link href="/privacidade" className="hover:text-primary transition-colors hover:underline">Política de Privacidade</Link>
                </div>
            </div>
        </div>
    )
}
