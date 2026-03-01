import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background relative overflow-hidden">
            <Card className="w-full max-w-md border-border/50 bg-card shadow-lg z-10">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/></svg>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">
                            Nexus <span className="text-primary font-medium">Clínicas</span>
                        </span>
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
                            <Button formAction={signup} variant="outline" className="w-full sm:hover:scale-[1.02] transition-transform">
                                Criar Conta
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="absolute bottom-4 left-0 right-0 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground z-10">
                <span>Powered by</span>
                <span className="font-semibold text-foreground">lucaspit.ai</span>
            </div>
        </div>
    )
}
