'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { registerWithSubscription } from './actions'

interface RegisterFormProps {
    email: string
    sessionId: string
    error?: string
}

export function RegisterForm({ email, sessionId, error }: RegisterFormProps) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
        let newPassword = ''
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setPassword(newPassword)
        setShowPassword(true)
    }

    return (
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
                    className="bg-white border-slate-200 focus:border-primary focus:ring-primary/20 transition-all font-sans"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-slate-700 font-medium">Crie uma Senha</Label>
                    <button
                        type="button"
                        onClick={generatePassword}
                        className="text-xs text-primary flex items-center gap-1 hover:underline transition-all"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Gerar Senha Aleatória
                    </button>
                </div>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="bg-white border-slate-200 focus:border-primary focus:ring-primary/20 transition-all pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                    >
                        {showPassword ? (
                            <span className="text-xs font-semibold">Ocultar</span>
                        ) : (
                            <span className="text-xs font-semibold">Mostrar</span>
                        )}
                    </button>
                </div>
                {password && (
                    <p className="text-[10px] text-primary/80 font-medium">
                        {showPassword ? 'Guarde esta senha em um local seguro!' : ''}
                    </p>
                )}
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium space-y-2">
                    <p>{error}</p>
                </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
                <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                    Ativar meu Acesso
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Fazer login
                    </Link>
                </p>
            </div>
        </form>
    )
}
