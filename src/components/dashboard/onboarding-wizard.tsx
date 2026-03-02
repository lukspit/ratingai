'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, Stethoscope, Calculator, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

// Steps Definition
const STEPS = [
    { title: 'Identidade', icon: Heart, description: 'Básico e Tom de Voz da IA.' },
    { title: 'Operação', icon: Stethoscope, description: 'Dias, Horários e Preços.' },
    { title: 'Regras', icon: Calculator, description: 'Pagamentos e Convênios.' },
    { title: 'Anti-Alucinação', icon: ShieldAlert, description: 'Restrições e Urgências.' }
]

const TONES = [
    { id: 'acolhedor', label: 'Acolhedor e Empático 💛', desc: 'Usa emojis leves, foca no bem-estar e soa muito humano.' },
    { id: 'profissional', label: 'Direto e Profissional 👔', desc: 'Respostas curtas, objetivas, sem enrolação.' },
    { id: 'premium', label: 'Boutique Premium ✨', desc: 'Vocabulário refinado, focado em experiência de alto padrão.' },
    { id: 'desenrolado', label: 'Descontraído e Moderno ✌️', desc: 'Usa gírias leves, muitos emojis divertidos.' }
]

export function OnboardingWizard({ initialData, hasCompleted, onSave }: { initialData: any, hasCompleted?: boolean, onSave: (data: any) => void }) {
    const [step, setStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(!hasCompleted)
    const [isSuccess, setIsSuccess] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        // Etapa 1
        name: initialData?.name || '',
        assistant_name: initialData?.assistant_name || 'Liz',
        specialties: initialData?.specialties || '',
        tone: initialData?.tone || 'acolhedor', // Default

        // Etapa 2
        consultation_fee: initialData?.consultation_fee || '',
        hours: initialData?.hours || '',
        service_modes: initialData?.service_modes || { presencial: false, online: false },

        // Etapa 3
        payment_methods: initialData?.payment_methods || { pix: false, credit: false, debit: false, cash: false },
        insurance: initialData?.insurance || '',
        insurance_policy: initialData?.insurance_policy || 'Aceitamos os convênios acima e o restante apenas particular.',
        return_policy: initialData?.return_policy || '',

        // Etapa 4
        differentials: initialData?.differentials || '',
        restrictions: initialData?.restrictions || '',
        emergency_rules: initialData?.emergency_rules || 'Se o paciente relatar dor intensa, sangramento ou falta de ar, orientar ir ao pronto-socorro mais próximo.'
    })

    const bgColors = ['bg-rose-50 dark:bg-rose-950/20', 'bg-blue-50 dark:bg-blue-950/20', 'bg-emerald-50 dark:bg-emerald-950/20', 'bg-amber-50 dark:bg-amber-950/20']

    const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
    const handlePrev = () => setStep(s => Math.max(s - 1, 0))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step !== STEPS.length - 1) {
            handleNext()
            return
        }

        setIsLoading(true)
        await onSave(formData)
        setIsLoading(false)
        setIsSuccess(true)
    }

    const CurrentIcon = STEPS[step].icon

    if (isSuccess) {
        return (
            <Card className="border-none shadow-xl bg-emerald-50 dark:bg-emerald-950/20 text-center py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Configurações Salvas!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        O cérebro da sua IA foi atualizado com sucesso. As novas regras, preços e restrições já estão em vigor para os próximos atendimentos.
                    </p>
                    <Button className="mt-6 shadow-md" onClick={() => {
                        setIsSuccess(false)
                        setIsEditing(false)
                        setStep(0)
                    }}>
                        Voltar ao Painel
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!isEditing) {
        return (
            <Card className="border-none shadow-xl bg-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Inteligência Configurada</CardTitle>
                            <CardDescription className="text-base">Sua clínica já possui diretrizes personalizadas ativas na IA.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-background rounded-xl border border-border/50">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Assistente</p>
                            <p className="font-semibold">{formData.assistant_name} ({TONES.find(t => t.id === formData.tone)?.label || formData.tone})</p>
                        </div>
                        <div className="p-4 bg-background rounded-xl border border-border/50">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Valor Particular</p>
                            <p className="font-semibold">R$ {formData.consultation_fee}</p>
                        </div>
                        <div className="p-4 bg-background rounded-xl border border-border/50 col-span-1 md:col-span-2">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Restrições Padrão (Anti-Alucinação)</p>
                            <p className="font-semibold text-rose-600 dark:text-rose-400">{formData.restrictions || 'Nenhuma restrição informada'}</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setIsEditing(true)} className="shadow-md">
                            Editar Configurações da IA
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full -z-10"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 rounded-full -z-10" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}></div>

                {STEPS.map((s, i) => {
                    const isActive = i <= step
                    const Icon = s.icon
                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : 'bg-background border-muted text-muted-foreground'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{s.title}</span>
                        </div >
                    )
                })}
            </div >

            <Card className={`border-none shadow-xl transition-colors duration-500 ${bgColors[step]}`}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-background rounded-xl shadow-sm">
                            <CurrentIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">{STEPS[step].title}</CardTitle>
                            <CardDescription className="text-base">{STEPS[step].description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* ETAPA 1: Identidade */}
                        {step === 0 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome da Clínica ou Doutor *</Label>
                                        <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Clínica Nexus" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="assistant_name">Nome da Assistente IA *</Label>
                                        <Input id="assistant_name" required value={formData.assistant_name} onChange={e => setFormData({ ...formData, assistant_name: e.target.value })} placeholder="Ex: Liz" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="specialties">Especialidade Principal *</Label>
                                        <Input id="specialties" required value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })} placeholder="Ex: Dermatologia e Estética Avançada" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <Label>Qual o Tom de Voz da sua Inteligência Artificial?</Label>
                                    <RadioGroup value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {TONES.map(t => (
                                            <div key={t.id}>
                                                <RadioGroupItem value={t.id} id={t.id} className="peer sr-only" />
                                                <Label htmlFor={t.id} className="flex flex-col gap-1 p-4 rounded-xl border-2 border-muted bg-background hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                                                    <span className="font-semibold text-base">{t.label}</span>
                                                    <span className="text-sm text-muted-foreground font-normal">{t.desc}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        )}

                        {/* ETAPA 2: Operação */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Valor da Consulta Particular (R$) *</Label>
                                        <Input id="fee" type="number" required value={formData.consultation_fee} onChange={e => setFormData({ ...formData, consultation_fee: e.target.value })} placeholder="Ex: 350.00" className="bg-background/80 backdrop-blur-sm text-lg font-medium" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Modos de Atendimento</Label>
                                    <div className="flex gap-6 p-4 bg-background/50 rounded-xl border border-border/50">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="presencial" checked={formData.service_modes.presencial} onCheckedChange={(c) => setFormData({ ...formData, service_modes: { ...formData.service_modes, presencial: !!c } })} />
                                            <Label htmlFor="presencial" className="cursor-pointer">Presencial</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="online" checked={formData.service_modes.online} onCheckedChange={(c) => setFormData({ ...formData, service_modes: { ...formData.service_modes, online: !!c } })} />
                                            <Label htmlFor="online" className="cursor-pointer">Telemedicina (Online)</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hours">Horários de Funcionamento *</Label>
                                    <Textarea id="hours" required rows={3} value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} placeholder="Ex: Segunda a Sexta das 08:00 às 18:00. Não abrimos de Sábado." className="bg-background/80 backdrop-blur-sm resize-none" />
                                </div>
                            </div>
                        )}

                        {/* ETAPA 3: Regras */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="space-y-2 border-b border-border/50 pb-6">
                                    <Label>Quais Convênios a clínica aceita?</Label>
                                    <Textarea value={formData.insurance} onChange={e => setFormData({ ...formData, insurance: e.target.value })} placeholder="Ex: Unimed, Bradesco Saúde, SulAmérica. Deixe em branco se for apenas particular." className="bg-background/80 backdrop-blur-sm resize-none" rows={2} />
                                    <div className="mt-2 space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Como a IA deve responder sobre outros planos?</Label>
                                        <Input value={formData.insurance_policy} onChange={e => setFormData({ ...formData, insurance_policy: e.target.value })} className="bg-background/80 h-8 text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Formas de Pagamento (Particular)</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                                        {[
                                            { id: 'pix', label: 'PIX' },
                                            { id: 'credit', label: 'Cartão Crédito' },
                                            { id: 'debit', label: 'Cartão Débito' },
                                            { id: 'cash', label: 'Dinheiro' }
                                        ].map(method => (
                                            <div key={method.id} className="flex items-center space-x-2">
                                                <Checkbox id={method.id} checked={(formData.payment_methods as any)[method.id]} onCheckedChange={(c) => setFormData({ ...formData, payment_methods: { ...formData.payment_methods, [method.id]: !!c } })} />
                                                <Label htmlFor={method.id} className="cursor-pointer text-sm">{method.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="return_policy">Política de Retorno de Consulta</Label>
                                    <Input id="return_policy" value={formData.return_policy} onChange={e => setFormData({ ...formData, return_policy: e.target.value })} placeholder="Ex: Retorno gratuito em até 15 dias após a consulta." className="bg-background/80 backdrop-blur-sm" />
                                </div>
                            </div>
                        )}

                        {/* ETAPA 4: Anti-Alucinação */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <Label htmlFor="differentials" className="text-current font-semibold text-base">Os Diferenciais da Clínica</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">O que a IA deve destacar caso o paciente ache caro? (Ex: Tratamento humanizado, equipamento de ponta, estacionamento grátis).</p>
                                    <Textarea id="differentials" rows={3} value={formData.differentials} onChange={e => setFormData({ ...formData, differentials: e.target.value })} placeholder="Ex: Utilizamos o Laser Fotona 4D, único na região. Ambiente spa-like com café especial..." className="bg-background/80 focus-visible:ring-emerald-500" />
                                </div>

                                <div className="space-y-2 border-t border-border/50 pt-6">
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                        <ShieldAlert className="w-5 h-5" />
                                        <Label htmlFor="restrictions" className="text-current font-semibold text-base">O que a clínica NÃO FAZ (Anti-Alucinação) *</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Liste procedimentos ou serviços que vocês <strong>nunca</strong> realizam, para a IA negar educadamente e não prometer coisas erradas.</p>
                                    <Textarea id="restrictions" required rows={3} value={formData.restrictions} onChange={e => setFormData({ ...formData, restrictions: e.target.value })} placeholder="Ex: Não fazemos cirurgia plástica, apenas procedimentos estéticos não-invasivos. Não atendemos pediatria." className="bg-background/80 focus-visible:ring-rose-500" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold text-rose-600 dark:text-rose-400">Diretriz de Urgência / Emergência Médica</Label>
                                    <Input value={formData.emergency_rules} onChange={e => setFormData({ ...formData, emergency_rules: e.target.value })} className="bg-background/80 focus-visible:ring-rose-500 font-medium" />
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-border/50">
                            <Button type="button" variant="outline" onClick={handlePrev} disabled={step === 0} className="w-28 bg-background/80 backdrop-blur-sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>

                            <Button type="submit" disabled={isLoading} className="w-40 shadow-lg">
                                {isLoading ? 'Salvando...' : step === STEPS.length - 1 ? (
                                    <>Concluir <CheckCircle2 className="w-4 h-4 ml-2" /></>
                                ) : (
                                    <>Avançar <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
} 
