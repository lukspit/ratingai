'use client'

import { useState } from 'react'
import { Brain, CheckCircle2, Zap, Shield, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingIntroProps {
    onStart: () => void
}

const benefits = [
    {
        icon: Zap,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
        title: 'IA que sabe de tudo',
        description: 'Preços, horários, convênios, localização, preparo para consulta. Sem setup, ela chuta e erra.',
    },
    {
        icon: Shield,
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        title: 'Zero alucinações',
        description: 'Você define exatamente o que a IA pode e não pode prometer — a gente blinda o agente contra erros graves.',
    },
    {
        icon: Clock,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
        title: 'Agendamentos no piloto automático',
        description: 'Pacientes entram pelo WhatsApp e saem com consulta marcada — sem você precisar responder nada.',
    },
]

export function OnboardingIntro({ onStart }: OnboardingIntroProps) {
    const [isStarting, setIsStarting] = useState(false)

    function handleStart() {
        setIsStarting(true)
        setTimeout(() => onStart(), 300)
    }

    return (
        <div className={`transition-all duration-300 ${isStarting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {/* Hero da intro */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 mb-8 text-center">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-primary/25 mb-6 mx-auto">
                        <Brain className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                        Vamos criar a mente da sua clínica
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                        Este setup de <span className="text-foreground font-semibold">~10 minutos</span> é o que faz o Nexus funcionar de verdade.
                        Sem ele, a IA não tem como representar a sua clínica com segurança.
                    </p>
                </div>
            </div>

            {/* Cards de benefícios */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                {benefits.map((b) => (
                    <div
                        key={b.title}
                        className={`rounded-xl border ${b.border} ${b.bg} p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform`}
                    >
                        <div className={`w-10 h-10 rounded-lg ${b.bg} border ${b.border} flex items-center justify-center`}>
                            <b.icon className={`w-5 h-5 ${b.color}`} />
                        </div>
                        <h3 className="font-semibold text-foreground">{b.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                    </div>
                ))}
            </div>

            {/* O que vamos cobrir */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-6 mb-8">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    O que vamos configurar
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                    {[
                        'Especialidade e identidade visual da comunicação',
                        'Endereço, acesso e como chegar',
                        'Horários de atendimento e modalidades',
                        'Preços, convênios e formas de pagamento',
                        'Documentos e preparo para a consulta',
                        'Links de Instagram, site e avaliações',
                        'Regras anti-alucinação (o que a IA não pode falar)',
                        'Protocolo de emergência e instruções especiais',
                    ].map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
                <Button
                    onClick={handleStart}
                    size="lg"
                    className="h-14 px-10 text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 group"
                >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Entendido, vamos começar!
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
                Você pode editar as informações a qualquer momento depois que salvar.
            </p>
        </div>
    )
}
