import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Building2 } from 'lucide-react'
import { OnboardingWizard } from '@/components/dashboard/onboarding-wizard'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch existing clinic data
    const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

    async function saveClinicData(formData: any) {
        'use server'
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Compiler - Juntar todas as etaps em um markdown perfeito para a IA

        let paymentMethodsStr = ''
        const pm = []
        if (formData.payment_methods.pix) pm.push('PIX')
        if (formData.payment_methods.credit) pm.push('Cartão de Crédito')
        if (formData.payment_methods.debit) pm.push('Cartão de Débito')
        if (formData.payment_methods.cash) pm.push('Dinheiro')
        if (pm.length > 0) paymentMethodsStr = pm.join(', ')

        let serviceModesStr = ''
        const sm = []
        if (formData.service_modes.presencial) sm.push('Atendimento Presencial')
        if (formData.service_modes.online) sm.push('Telemedicina (Online)')
        if (sm.length > 0) serviceModesStr = sm.join(' e ')

        const compiledRulesMarkdown = `
### IDENTIDADE E TOM DE VOZ
- Tom de Voz Escolhido pela Clínica: ${formData.tone.toUpperCase()}
- Diretriz: O tom ${formData.tone} afeta diretamente sua escolha de palavras e emojis.

### OPERAÇÃO GERAL DA CLÍNICA
- Modalidades de Atendimento: ${serviceModesStr}
- Horários de Funcionamento: ${formData.hours}

### POLÍTICA FINANCEIRA E CONVÊNIOS
- Formas de Pagamento Aceitas (Atendimentos Particulares): ${paymentMethodsStr || 'Consulte'}
- Convênios Médicos Aceitos: ${formData.insurance || 'Não atende convênios (apenas particular)'}
- Diretriz sobre outros Convênios (Como responder a pacientes que perguntem sobre planos não listados): ${formData.insurance_policy}
- Política de Retorno de Consulta: ${formData.return_policy || 'Não informado (verificar internamente)'}

### DIFERENCIAIS DA CLÍNICA (Vender o Valor)
- Caso o paciente demonstre objeção de preço, destaque nossos diferenciais: ${formData.differentials}

### PROCEDIMENTOS NÃO REALIZADOS (ANTI-ALUCINAÇÃO)
- IMPORTANTE: NÃO FAZEMOS os seguintes procedimentos: ${formData.restrictions}
- Se o paciente pedir isso ou perguntar, negue educadamente e NÃO faça falsas promessas.

### DIRETRIZES DE URGÊNCIA MÉDICA
- Protocolo para sintomas graves/emergenciais: ${formData.emergency_rules}
`.trim()

        const dbData = {
            name: formData.name as string,
            specialties: formData.specialties as string,
            consultation_fee: parseFloat(formData.consultation_fee) || 0,
            rules: compiledRulesMarkdown, // Salvando o Big Markdown
            assistant_name: formData.assistant_name as string,
            owner_id: user.id
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('clinics')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (existing) {
            await supabase.from('clinics').update(dbData).eq('id', existing.id)
        } else {
            await supabase.from('clinics').insert(dbData)
        }

        revalidatePath('/dashboard/settings')
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-primary" />
                    Setup da Inteligência
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Preencha o contexto da sua clínica para blindar nossa IA contra erros e alucinações.
                </p>
            </div>

            <OnboardingWizard initialData={clinic} onSave={saveClinicData} />

        </div>
    )
}
