'use client'

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Calculator,
    Scale,
    FileCheck,
    Loader2,
    CheckCircle2,
    AlertCircle,
    type LucideIcon
} from "lucide-react"

interface AgentStep {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
}

const stepsData: AgentStep[] = [
    {
        id: 'extractor',
        name: 'O Auditor (Extractor)',
        description: 'Extraindo dados contábeis e identificando ajustes...',
        icon: Search
    },
    {
        id: 'calculator',
        name: 'O Atuário (Calculator)',
        description: 'Calculando índices e Rating matemático...',
        icon: Calculator
    },
    {
        id: 'strategist',
        name: 'O Advogado (Strategist)',
        description: 'Construindo tese jurídica e tática de desconto...',
        icon: Scale
    },
    {
        id: 'builder',
        name: 'O Perito (Report Builder)',
        description: 'Gerando laudo técnico CAPAG-e final...',
        icon: FileCheck
    }
]

interface AgentStatusMonitorProps {
    currentStep: number; // 0 to 4 (4 means all completed)
    isError?: boolean;
}

export function AgentStatusMonitor({ currentStep, isError }: AgentStatusMonitorProps) {
    const [displayProgress, setDisplayProgress] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Se já concluiu tudo, vai direto pra 100
        if (currentStep >= stepsData.length) {
            setDisplayProgress(100)
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        // Se deu erro, para de subir
        if (isError) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        // Sempre que o step muda, a gente garante que o progresso base é pelo menos o início do step
        const baseProgress = (currentStep / stepsData.length) * 100
        setDisplayProgress(prev => Math.max(prev, baseProgress))

        // Limpa timer anterior
        if (timerRef.current) clearInterval(timerRef.current)

        // Lógica de manipulação da cabeça (Perceived Performance)
        timerRef.current = setInterval(() => {
            setDisplayProgress(prev => {
                const stepSize = 100 / stepsData.length
                const stepStart = currentStep * stepSize
                const stepEnd = (currentStep + 1) * stepSize
                const stepThreshold = stepStart + (stepSize * 0.85) // O ponto de 85% do step atual

                if (prev < stepThreshold) {
                    // Corre rápido (soma um valor maior)
                    return Math.min(prev + 0.8, stepThreshold)
                } else if (prev < stepEnd - 1) {
                    // Vai bem devagar (soma um valor minúsculo)
                    return prev + 0.05
                }
                return prev
            })
        }, 50)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [currentStep, isError])

    const progressValue = displayProgress;

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Processamento de Inteligência</CardTitle>
                        <p className="text-sm text-muted-foreground">Analisando documentos via DeepSeek-v3</p>
                    </div>
                    {currentStep < stepsData.length && !isError ? (
                        <Badge variant="outline" className="animate-pulse">Em Execução</Badge>
                    ) : isError ? (
                        <Badge variant="destructive">Erro no Processamento</Badge>
                    ) : (
                        <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Progresso Geral</span>
                        <span>{Math.round(progressValue)}%</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>

                <div className="grid gap-4">
                    {stepsData.map((step, index) => {
                        let status: 'pending' | 'processing' | 'completed' | 'error' = 'pending';
                        if (index < currentStep) status = 'completed';
                        else if (index === currentStep && isError) status = 'error';
                        else if (index === currentStep) status = 'processing';

                        return (
                            <div
                                key={step.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${status === 'processing' ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-background'
                                    }`}
                            >
                                <div className={`mt-1 p-2 rounded-md ${status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                    status === 'processing' ? 'bg-primary/10 text-primary' :
                                        status === 'error' ? 'bg-red-500/10 text-red-500' :
                                            'bg-muted text-muted-foreground'
                                    }`}>
                                    {status === 'processing' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : status === 'completed' ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : status === 'error' ? (
                                        <AlertCircle className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">{step.name}</h4>
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                                            Agent {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
