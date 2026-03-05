'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, Stethoscope, Calculator, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2, MapPin, Building, Globe, Activity } from 'lucide-react'
import { SPECIALTY_CATEGORIES, getSpecialtyTemplate } from '@/lib/specialty-templates'

// Steps Definition (7 steps)
const STEPS = [
    { title: 'Especialidade', icon: Activity, description: 'Selecione a sua área de atuação.' },
    { title: 'Identidade', icon: Heart, description: 'Quem é você e a Inteligência Artificial.' },
    { title: 'Localização', icon: MapPin, description: 'Como e onde os pacientes chegam.' },
    { title: 'Operação', icon: Building, description: 'Regras, funcionamento e preparo.' },
    { title: 'Serviços & Preços', icon: Calculator, description: 'Valores, planos e pagamentos.' },
    { title: 'Links & Comercial', icon: Globe, description: 'Redes sociais e políticas.' },
    { title: 'Anti-Alucinação', icon: ShieldAlert, description: 'Restrições e Proteções Táticas.' }
]

const TONES = [
    { id: 'acolhedor', label: 'Acolhedor e Empático 💛', desc: 'Usa emojis leves, foca no bem-estar e soa muito humano.' },
    { id: 'profissional', label: 'Direto e Profissional 👔', desc: 'Respostas curtas, sem enrolação.' },
    { id: 'premium', label: 'Boutique Premium ✨', desc: 'Vocabulário refinado, alto padrão.' },
    { id: 'desenrolado', label: 'Descontraído ✌️', desc: 'Usa gírias leves, divertido.' }
]

export function OnboardingWizard({ initialData, hasCompleted, onSave }: { initialData: any, hasCompleted?: boolean, onSave: (data: any) => void }) {
    const [step, setStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(!hasCompleted)
    const [isSuccess, setIsSuccess] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        // Etapa 0
        specialty_category: initialData?.specialty_category || '',

        // Etapa 1
        name: initialData?.name || '',
        assistant_name: initialData?.assistant_name || 'Liz',
        specialties: initialData?.specialties || '',
        professional_name: initialData?.professional_name || '',
        professional_gender: initialData?.professional_gender || 'masculino',
        professional_bio: initialData?.professional_bio || '',
        tone: initialData?.tone || 'acolhedor',

        // Etapa 2 (Localização)
        address: initialData?.address || '',
        reference_point: initialData?.reference_point || '',
        public_transport: initialData?.public_transport || '',
        parking: initialData?.parking || 'sem_estacionamento',
        accessibility: initialData?.accessibility || { ramp: false, elevator: false, bathroom: false },
        service_modes: initialData?.service_modes || { presencial: true, online: false },

        // Etapa 3 (Operação)
        hours: initialData?.hours || '',
        consultation_duration: initialData?.consultation_duration || '',
        referral_needed: initialData?.referral_needed || 'nao',
        pre_consultation_prep: initialData?.pre_consultation_prep || '',
        documents_required: initialData?.documents_required || { id: true, insurance_card: false, past_exams: false, prescriptions: false },

        // Etapa 4 (Serviços e Preços)
        consultation_fee: initialData?.consultation_fee || '',
        installments: initialData?.installments || 'nao_parcela',
        discount_pix: initialData?.discount_pix || '',
        payment_methods: initialData?.payment_methods || { pix: true, credit: true, debit: true, cash: false },
        insurance: initialData?.insurance || '',
        insurance_policy: initialData?.insurance_policy || 'Aceitamos os convênios acima e o restante apenas particular.',
        return_policy: initialData?.return_policy || '',
        common_procedures: initialData?.common_procedures || '',

        // Etapa 5 (Comercial)
        cancellation_policy: initialData?.cancellation_policy || 'Cancelamentos com menos de 24h podem inviabilizar o atendimento organizado.',
        promotions: initialData?.promotions || '',
        instagram: initialData?.instagram || '',
        website: initialData?.website || '',
        doctoralia_url: initialData?.doctoralia_url || '',
        google_my_business: initialData?.google_my_business || '',

        // Etapa 6 (Anti-Alucinação)
        differentials: initialData?.differentials || '',
        restrictions: initialData?.restrictions || '',
        emergency_rules: initialData?.emergency_rules || 'Se o paciente relatar dor intensa, sangramento ou falta de ar, orientar ir ao pronto-socorro mais próximo.',
        can_mention_links: initialData?.can_mention_links ?? true,
        other_instructions: initialData?.other_instructions || ''
    })

    const bgColors = ['bg-violet-50 dark:bg-violet-950/20', 'bg-rose-50 dark:bg-rose-950/20', 'bg-blue-50 dark:bg-blue-950/20', 'bg-indigo-50 dark:bg-indigo-950/20', 'bg-emerald-50 dark:bg-emerald-950/20', 'bg-amber-50 dark:bg-amber-950/20', 'bg-red-50 dark:bg-red-950/20']

    const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
    const handlePrev = () => setStep(s => Math.max(s - 1, 0))

    const handleSpecialtySelect = (id: string) => {
        const template = getSpecialtyTemplate(id)
        const category = SPECIALTY_CATEGORIES.find(c => c.id === id)

        setFormData({
            ...formData,
            specialty_category: id,
            specialties: category ? category.label : formData.specialties,
            restrictions: template.restrictions,
            differentials: template.differentials,
            emergency_rules: template.emergency_rules,
            return_policy: template.return_policy,
            insurance_policy: template.insurance_policy,
            common_procedures: template.common_procedures,
            consultation_duration: template.consultation_duration,
            pre_consultation_prep: template.pre_consultation_prep
        })
        handleNext()
    }

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
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header de Status */}
                <Card className="border-none shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background border-l-4 border-l-primary overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <CardHeader className="py-6 relative z-10">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                                    <Activity className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold tracking-tight">Operação IA Ativa</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                                        <CardDescription className="text-base font-medium text-foreground/70">
                                            Cérebro da <span className="text-primary font-bold">{formData.name}</span> está online
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-semibold h-11 px-6 border-primary/20 bg-background/50 backdrop-blur-sm">
                                <Activity className="w-4 h-4 mr-2" />
                                Ajustar Cérebro da IA
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Grid de Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Card 1: Identidade */}
                    <Card className="border-none shadow-md bg-background/60 backdrop-blur-md hover:shadow-lg transition-all duration-300 group ring-1 ring-border/50">
                        <CardHeader className="pb-3 pt-5">
                            <div className="flex items-center gap-2 text-primary">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <Heart className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-lg">Identidade</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Assistente</p>
                                <p className="font-bold text-foreground">{formData.assistant_name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Tom de Voz</p>
                                <Badge variant="secondary" className="font-bold bg-primary/10 text-primary border-none">
                                    {TONES.find(t => t.id === formData.tone)?.label || formData.tone}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Profissional</p>
                                <p className="font-bold text-foreground line-clamp-1">{formData.professional_name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Localização & Atendimento */}
                    <Card className="border-none shadow-md bg-background/60 backdrop-blur-md hover:shadow-lg transition-all duration-300 ring-1 ring-border/50">
                        <CardHeader className="pb-3 pt-5">
                            <div className="flex items-center gap-2 text-blue-500">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-lg">Atendimento</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Endereço</p>
                                <p className="font-bold text-foreground line-clamp-2 text-sm leading-relaxed">{formData.address}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Modalidades</p>
                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                    {formData.service_modes.presencial && <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-bold">Presencial</Badge>}
                                    {formData.service_modes.online && <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 font-bold">Telemedicina</Badge>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Operação */}
                    <Card className="border-none shadow-md bg-background/60 backdrop-blur-md hover:shadow-lg transition-all duration-300 ring-1 ring-border/50">
                        <CardHeader className="pb-3 pt-5">
                            <div className="flex items-center gap-2 text-amber-500">
                                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                    <Building className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-lg">Operação</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Horários</p>
                                <p className="font-bold text-foreground text-sm line-clamp-2 leading-relaxed">{formData.hours}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Duração Média</p>
                                <p className="font-bold text-foreground">{formData.consultation_duration}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Financeiro */}
                    <Card className="border-none shadow-md bg-background/60 backdrop-blur-md hover:shadow-lg transition-all duration-300 ring-1 ring-border/50">
                        <CardHeader className="pb-3 pt-5">
                            <div className="flex items-center gap-2 text-emerald-500">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                    <Calculator className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-lg">Financeiro</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Consulta</p>
                                    <p className="text-xl font-black text-foreground">R$ {formData.consultation_fee}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Parcelas</p>
                                    <p className="font-bold text-foreground">{formData.installments === 'nao_parcela' ? 'Não' : formData.installments.replace('ate_', '').replace('x', 'x')}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Convênios</p>
                                <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight">{formData.insurance || 'Apenas Particular'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 5: Regras de Ouro (Anti-Alucinação) */}
                    <Card className="border-none shadow-lg bg-rose-50/70 dark:bg-rose-950/20 md:col-span-2 lg:col-span-2 border-l-4 border-l-rose-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                            <ShieldAlert className="w-24 h-24" />
                        </div>
                        <CardHeader className="pb-3 pt-5 relative z-10">
                            <div className="flex items-center gap-2 text-rose-600">
                                <div className="p-1.5 bg-rose-600/10 rounded-lg">
                                    <ShieldAlert className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-lg tracking-tight">Regras de Segurança (Anti-Alucinação)</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-2">
                                <p className="text-[10px] text-rose-600 uppercase tracking-widest font-black mb-1">Bloqueios Críticos</p>
                                <p className="text-sm font-bold text-rose-900 dark:text-rose-100 leading-relaxed italic pr-4 border-l-2 border-rose-200 pl-3">"{formData.restrictions}"</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] text-rose-600 uppercase tracking-widest font-black mb-1">Urgência & Emergência</p>
                                <p className="text-sm font-bold text-rose-900 dark:text-rose-100 leading-relaxed italic pr-4 border-l-2 border-rose-200 pl-3">"{formData.emergency_rules}"</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Seção de Links e Mídias */}
                {(formData.instagram || formData.website || formData.google_my_business || formData.doctoralia_url) && (
                    <Card className="border-none shadow-md bg-background/40 backdrop-blur-sm ring-1 ring-border/50">
                        <CardHeader className="py-4 border-b border-border/50">
                            <div className="flex items-center gap-2 text-foreground/70">
                                <Globe className="w-5 h-5" />
                                <h3 className="font-bold text-sm uppercase tracking-widest">Canais Digitais Autorizados</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4 py-4">
                            {formData.instagram && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-background/80 rounded-xl border border-border shadow-sm text-sm font-bold transition-all hover:border-primary/30">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500" />
                                    <span className="text-rose-600">Instagram:</span> {formData.instagram}
                                </div>
                            )}
                            {formData.website && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-background/80 rounded-xl border border-border shadow-sm text-sm font-bold transition-all hover:border-blue-500/30">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-blue-600">Site:</span> {formData.website}
                                </div>
                            )}
                            {formData.google_my_business && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-background/80 rounded-xl border border-border shadow-sm text-sm font-bold transition-all hover:border-amber-500/30">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="text-amber-600">Google:</span> Link Ativo
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        )
    }


    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="flex flex-wrap items-center justify-between mb-8 relative gap-y-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full -z-10 hidden sm:block"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 rounded-full -z-10 hidden sm:block" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}></div>

                {STEPS.map((s, i) => {
                    const isActive = i <= step
                    const Icon = s.icon
                    return (
                        <div key={i} className="flex flex-col items-center gap-2 z-10 mx-auto sm:mx-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : 'bg-background border-muted text-muted-foreground'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] uppercase font-bold hidden md:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{s.title}</span>
                        </div>
                    )
                })}
            </div>

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

                        {/* ETAPA 0: Especialidade */}
                        {step === 0 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <Label className="text-lg">Qual é a especialidade do profissional ou da clínica?</Label>
                                <p className="text-sm text-muted-foreground mb-4">A sua escolha de especialidade vai pré-configurar o cérebro da Inteligência Artificial de forma customizada com o conhecimento de mercado validado por nós.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {SPECIALTY_CATEGORIES.map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleSpecialtySelect(cat.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${formData.specialty_category === cat.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-background hover:bg-accent/50'} text-center flex flex-col items-center justify-center gap-2`}
                                        >
                                            <span className="text-3xl">{cat.icon}</span>
                                            <span className="text-sm font-semibold text-foreground/90">{cat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ETAPA 1: Identidade */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome da Clínica ou Mídia *</Label>
                                        <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Clínica Nexus ou Consultório Dr. João" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="assistant_name">Nome da Assistente IA *</Label>
                                        <Input id="assistant_name" required value={formData.assistant_name} onChange={e => setFormData({ ...formData, assistant_name: e.target.value })} placeholder="Ex: Liz" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="professional_name">Nome do Doutor/Profissional *</Label>
                                        <Input id="professional_name" required value={formData.professional_name} onChange={e => setFormData({ ...formData, professional_name: e.target.value })} placeholder="Ex: Dr. João Ferreira" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gênero do Profissional (para pronomes da IA) *</Label>
                                        <RadioGroup value={formData.professional_gender} onValueChange={(v) => setFormData({ ...formData, professional_gender: v })} className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="masculino" id="masc" />
                                                <Label htmlFor="masc">Masculino</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="feminino" id="fem" />
                                                <Label htmlFor="fem">Feminino</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="specialties">Especialidade (título de apresentação) *</Label>
                                        <Input id="specialties" required value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })} placeholder="Ex: Dermatologia e Estética Avançada Médica" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="professional_bio">Resumo do Curriculo (Mini Bio) *</Label>
                                        <Textarea id="professional_bio" required value={formData.professional_bio} onChange={e => setFormData({ ...formData, professional_bio: e.target.value })} placeholder="Ex: Formado pela USP, com mais de 15 anos de experiência clínica. CRM 123456-SP." className="bg-background/80 backdrop-blur-sm resize-none" rows={3} />
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

                        {/* ETAPA 2: Localização */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Endereço Completo Presencial *</Label>
                                        <Input id="address" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Rua Vergueiro, 123, Sala 4 - São Paulo/SP" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reference_point">Ponto de Referência</Label>
                                        <Input id="reference_point" value={formData.reference_point} onChange={e => setFormData({ ...formData, reference_point: e.target.value })} placeholder="Em frente ao Hospital das Clínicas" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="public_transport">Transporte Público (Metrô/Ônibus)</Label>
                                        <Input id="public_transport" value={formData.public_transport} onChange={e => setFormData({ ...formData, public_transport: e.target.value })} placeholder="A 2 min do Metrô Paraíso (Linha Verde)" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <Label>Sobre Estacionamento *</Label>
                                    <RadioGroup value={formData.parking} onValueChange={(v) => setFormData({ ...formData, parking: v })} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2 bg-background p-3 rounded-lg border border-border">
                                            <RadioGroupItem value="gratis" id="park_free" />
                                            <Label htmlFor="park_free">Próprio e Gratuito</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-background p-3 rounded-lg border border-border">
                                            <RadioGroupItem value="pago" id="park_paid" />
                                            <Label htmlFor="park_paid">Valet/Próprio (Pago)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-background p-3 rounded-lg border border-border">
                                            <RadioGroupItem value="convenio" id="park_conv" />
                                            <Label htmlFor="park_conv">Convênio na Região</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-background p-3 rounded-lg border border-border">
                                            <RadioGroupItem value="sem_estacionamento" id="park_none" />
                                            <Label htmlFor="park_none">Não tem (Estacionar na rua)</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border/50">
                                    <Label>Acessibilidade (Marque se tiver)</Label>
                                    <div className="flex gap-6 p-4 bg-background/50 rounded-xl border border-border/50">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="acc_ramp" checked={formData.accessibility.ramp} onCheckedChange={(c) => setFormData({ ...formData, accessibility: { ...formData.accessibility, ramp: !!c } })} />
                                            <Label htmlFor="acc_ramp" className="cursor-pointer text-sm">Rampa/Elevador</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="acc_bath" checked={formData.accessibility.bathroom} onCheckedChange={(c) => setFormData({ ...formData, accessibility: { ...formData.accessibility, bathroom: !!c } })} />
                                            <Label htmlFor="acc_bath" className="cursor-pointer text-sm">Banheiro Adaptado</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Modos de Atendimento</Label>
                                    <div className="flex gap-6 p-4 bg-background/50 rounded-xl border border-border/50">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="presencial" checked={formData.service_modes.presencial} onCheckedChange={(c) => setFormData({ ...formData, service_modes: { ...formData.service_modes, presencial: !!c } })} />
                                            <Label htmlFor="presencial" className="cursor-pointer">Local (Presencial)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="online" checked={formData.service_modes.online} onCheckedChange={(c) => setFormData({ ...formData, service_modes: { ...formData.service_modes, online: !!c } })} />
                                            <Label htmlFor="online" className="cursor-pointer text-emerald-600 font-semibold">Telemedicina (Online)</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ETAPA 3: Operação */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="hours">Horários de Funcionamento da Clínica *</Label>
                                        <Textarea id="hours" required rows={2} value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} placeholder="Ex: De segunda a sexta, das 08h às 18h. Fechado no sábado." className="bg-background/80 backdrop-blur-sm resize-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="consultation_duration">Tempo Médio de Consulta (Duração) *</Label>
                                        <Input id="consultation_duration" required value={formData.consultation_duration} onChange={e => setFormData({ ...formData, consultation_duration: e.target.value })} placeholder="Ex: 40 minutos a 1 hora" className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Precisa de Encaminhamento Médico?</Label>
                                        <RadioGroup value={formData.referral_needed} onValueChange={(v) => setFormData({ ...formData, referral_needed: v })} className="flex flex-wrap gap-4 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nao" id="ref_no" />
                                                <Label htmlFor="ref_no">Não precisa</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="sim_convenio" id="ref_ins" />
                                                <Label htmlFor="ref_ins">Só pra Convênio</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="sim_sempre" id="ref_yes" />
                                                <Label htmlFor="ref_yes">Sim sempre</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border/50">
                                    <Label htmlFor="pre_consultation_prep">Instruções de Preparo para Consulta</Label>
                                    <p className="text-xs text-muted-foreground -mt-1">A IA lembrará o paciente caso ele pergunte o que fazer antes. O template já preencheu com uma sugestão base.</p>
                                    <Textarea id="pre_consultation_prep" rows={2} value={formData.pre_consultation_prep} onChange={e => setFormData({ ...formData, pre_consultation_prep: e.target.value })} placeholder="Ex: Estar em jejum, vir sem maquiagem..." className="bg-background/80 backdrop-blur-sm resize-none" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Documentos a trazer na consulta (Obrigatórios)</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="doc_id" checked={formData.documents_required.id} onCheckedChange={(c) => setFormData({ ...formData, documents_required: { ...formData.documents_required, id: !!c } })} />
                                            <Label htmlFor="doc_id" className="text-sm cursor-pointer">RG/CPF/CNH</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="doc_ins" checked={formData.documents_required.insurance_card} onCheckedChange={(c) => setFormData({ ...formData, documents_required: { ...formData.documents_required, insurance_card: !!c } })} />
                                            <Label htmlFor="doc_ins" className="text-sm cursor-pointer">Caretira Plano</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="doc_exam" checked={formData.documents_required.past_exams} onCheckedChange={(c) => setFormData({ ...formData, documents_required: { ...formData.documents_required, past_exams: !!c } })} />
                                            <Label htmlFor="doc_exam" className="text-sm cursor-pointer">Exames Antigos</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="doc_presc" checked={formData.documents_required.prescriptions} onCheckedChange={(c) => setFormData({ ...formData, documents_required: { ...formData.documents_required, prescriptions: !!c } })} />
                                            <Label htmlFor="doc_presc" className="text-sm cursor-pointer">Receitas em uso</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ETAPA 4: Serviços e Preços */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

                                <div className="space-y-2">
                                    <Label htmlFor="common_procedures">Principais Procedimentos Oferecidos *</Label>
                                    <p className="text-xs text-muted-foreground -mt-1">Template forneceu estes dados para a IA citar quando perguntarem se vocês fazem "X", edite ou mantenha.</p>
                                    <Textarea id="common_procedures" required rows={3} value={formData.common_procedures} onChange={e => setFormData({ ...formData, common_procedures: e.target.value })} placeholder="Ex: Botox, Peeling..." className="bg-background/80 backdrop-blur-sm" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Valor da Consulta Particular (R$) *</Label>
                                        <Input id="fee" type="number" required value={formData.consultation_fee} onChange={e => setFormData({ ...formData, consultation_fee: e.target.value })} placeholder="Ex: 350.00" className="bg-background/80 backdrop-blur-sm text-xl font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Opções de Parcelamento (Para tratamentos)</Label>
                                        <RadioGroup value={formData.installments} onValueChange={(v) => setFormData({ ...formData, installments: v })} className="flex flex-wrap gap-4 pt-2">
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="nao_parcela" id="inst_no" /><Label htmlFor="inst_no">Não</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="ate_3x" id="inst_3" /><Label htmlFor="inst_3">3x</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="ate_6x" id="inst_6" /><Label htmlFor="inst_6">6x</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="ate_12x" id="inst_12" /><Label htmlFor="inst_12">12x</Label></div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Formas de Pagamento Aceitas</Label>
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                                            {[
                                                { id: 'pix', label: 'PIX (A Vista)' }, { id: 'cash', label: 'Dinheiro' },
                                                { id: 'credit', label: 'Cartão Crédito' }, { id: 'debit', label: 'Cartão Débito' }
                                            ].map(method => (
                                                <div key={method.id} className="flex items-center space-x-2">
                                                    <Checkbox id={method.id} checked={(formData.payment_methods as any)[method.id]} onCheckedChange={(c) => setFormData({ ...formData, payment_methods: { ...formData.payment_methods, [method.id]: !!c } })} />
                                                    <Label htmlFor={method.id} className="cursor-pointer text-sm">{method.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount_pix">Oferece desconto no PIX/Dinheiro? (Se sim, qual?)</Label>
                                        <Input id="discount_pix" value={formData.discount_pix} onChange={e => setFormData({ ...formData, discount_pix: e.target.value })} placeholder="Ex: Sim, 10% de desconto no PIX." className="bg-background/80 backdrop-blur-sm" />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border/50">
                                    <Label>Convênios Médicos / Plano de Saúde Aceitos</Label>
                                    <Textarea value={formData.insurance} onChange={e => setFormData({ ...formData, insurance: e.target.value })} placeholder="Ex: Unimed, Bradesco, SulAmérica. Deixe em branco se for apenas atendimento particular." className="bg-background/80 backdrop-blur-sm resize-none" rows={2} />
                                    <div className="mt-2 space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Se o paciente possuir um plano NÃO LISTADO acima, a IA responde:</Label>
                                        <Input value={formData.insurance_policy} onChange={e => setFormData({ ...formData, insurance_policy: e.target.value })} className="bg-background/80 h-8 text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="return_policy">Política de Retorno de Consulta *</Label>
                                    <Input id="return_policy" required value={formData.return_policy} onChange={e => setFormData({ ...formData, return_policy: e.target.value })} placeholder="Ex: Retorno em até 15 dias para exibir exames." className="bg-background/80 backdrop-blur-sm" />
                                </div>
                            </div>
                        )}

                        {/* ETAPA 5: Links & Comercial */}
                        {step === 5 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="cancellation_policy">Política de Cancelamento e Reagendamento *</Label>
                                        <Textarea id="cancellation_policy" required value={formData.cancellation_policy} onChange={e => setFormData({ ...formData, cancellation_policy: e.target.value })} placeholder="Ex: Pedimos que cancele com no mínimo 24h de antecedência..." className="bg-background/80 backdrop-blur-sm" rows={2} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="promotions">Existem Promoções ativas no mês agora?</Label>
                                        <Textarea id="promotions" value={formData.promotions} onChange={e => setFormData({ ...formData, promotions: e.target.value })} placeholder="Ex: Promoção mês da Mulher com 20% OFF em tratamentos a laser facial. (As IAs adoram dar esses mimos)." className="bg-background/80 backdrop-blur-sm" rows={2} />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <Label className="text-lg">Links Digitais <span className="text-xs text-muted-foreground font-normal">(Serão enviados pela IA se solicitado)</span></Label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="instagram">Instagram da Clínica (URL ou @)</Label>
                                            <Input id="instagram" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} placeholder="@doutorajoana" className="bg-background/80" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Site Oficial URL</Label>
                                            <Input id="website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://www.clinica.com.br" className="bg-background/80" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="google_my_business">Link Avaliação Google Maps (GMN)</Label>
                                            <Input id="google_my_business" value={formData.google_my_business} onChange={e => setFormData({ ...formData, google_my_business: e.target.value })} placeholder="https://g.page/r/AABBCCDD" className="bg-background/80" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="doctoralia_url">Link do Perfil Doctoralia / BoaConsulta</Label>
                                            <Input id="doctoralia_url" value={formData.doctoralia_url} onChange={e => setFormData({ ...formData, doctoralia_url: e.target.value })} placeholder="https://www.doctoralia.com.br/joana" className="bg-background/80" />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="can_mention_links" checked={formData.can_mention_links} onCheckedChange={(c) => setFormData({ ...formData, can_mention_links: !!c })} />
                                        <Label htmlFor="can_mention_links" className="cursor-pointer font-bold">Autorizo a IA à enviar ativamente essas mídias nos momentos que ela julgar adequados e valiosos durante a conversa natural.</Label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ETAPA 6: Anti-Alucinação */}
                        {step === 6 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                        <ShieldAlert className="w-5 h-5" />
                                        <Label htmlFor="restrictions" className="text-current font-semibold text-base">O que a sua clínica NÃO FAZ sob hipótese alguma? *</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Listamos procedimentos proibidos/indesejados pelo template base. Edite se precisar de mais proteções absolutas.</p>
                                    <Textarea id="restrictions" required rows={3} value={formData.restrictions} onChange={e => setFormData({ ...formData, restrictions: e.target.value })} placeholder="Ex: Cirurgia de risco." className="bg-background/80 focus-visible:ring-rose-500 font-medium" />
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <Label htmlFor="differentials" className="text-current font-semibold text-base">Os Melhores Diferenciais da Clínica *</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">O que a IA usa como argumento "matador" se o paciente reclamar que a clínica/consulta está muito cara?</p>
                                    <Textarea id="differentials" required rows={2} value={formData.differentials} onChange={e => setFormData({ ...formData, differentials: e.target.value })} placeholder="Ex: Utilizamos o Laser XYZ, único da região. Atendimento hiper personalizado..." className="bg-background/80 focus-visible:ring-emerald-500" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold text-rose-600 dark:text-rose-400">Diretriz Padrão de Urgência Médica / Emergência Imediata *</Label>
                                    <Input required value={formData.emergency_rules} onChange={e => setFormData({ ...formData, emergency_rules: e.target.value })} className="bg-background/80 focus-visible:ring-rose-500 font-bold" />
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border/50">
                                    <Label htmlFor="other_instructions">Você tem alguma regra muito específica ou secreta sua para o Agente?</Label>
                                    <p className="text-xs text-muted-foreground -mt-1">Pode escrever em linguagem coloquial, Exemplo: "Se te perguntarem sobre dor nas costas, exija que venham com ressonância magnética e não tente enrolar, agende logo".</p>
                                    <Textarea id="other_instructions" rows={2} value={formData.other_instructions} onChange={e => setFormData({ ...formData, other_instructions: e.target.value })} placeholder="" className="bg-background/80 resize-none" />
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-border/50">
                            <Button type="button" variant="outline" onClick={handlePrev} disabled={step === 0} className="w-28 bg-background/80 backdrop-blur-sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>

                            <Button type="submit" disabled={isLoading || (step === 0 && !formData.specialty_category)} className="w-40 shadow-lg">
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
