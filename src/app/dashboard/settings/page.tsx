import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Building2 } from 'lucide-react'
import { SettingsContent } from '@/components/dashboard/settings-content'

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

        // Payment Methods
        let paymentMethodsStr = ''
        const pm = []
        if (formData.payment_methods.pix) pm.push('PIX')
        if (formData.payment_methods.credit) pm.push('Cartão de Crédito')
        if (formData.payment_methods.debit) pm.push('Cartão de Débito')
        if (formData.payment_methods.cash) pm.push('Dinheiro')
        if (pm.length > 0) paymentMethodsStr = pm.join(', ')

        // Service Modes
        let serviceModesStr = ''
        const sm = []
        if (formData.service_modes.presencial) sm.push('Presencial')
        if (formData.service_modes.online) sm.push('Telemedicina (Online)')
        if (sm.length > 0) serviceModesStr = sm.join(' e ')

        // Accessibility
        let accessibilityStr = ''
        const acc = []
        if (formData.accessibility.ramp) acc.push('Rampa/Elevador')
        if (formData.accessibility.bathroom) acc.push('Banheiro Adaptado')
        if (acc.length > 0) accessibilityStr = acc.join(', ')

        // Documents Required
        let docsStr = ''
        const docs = []
        if (formData.documents_required.id) docs.push('RG/CPF/CNH com foto')
        if (formData.documents_required.insurance_card) docs.push('Carteira do Convênio/Plano')
        if (formData.documents_required.past_exams) docs.push('Exames Anteriores Recentes')
        if (formData.documents_required.prescriptions) docs.push('Receitas e Medicações em Uso')
        if (docs.length > 0) docsStr = docs.join(', ')

        let linksStr = '- Links da clínica: Não fomos autorizados a divulgar no WhatsApp automático ainda.'
        if (formData.can_mention_links) {
            linksStr = `[ATENÇÃO IA - MÍDIAS DIGITAIS]: A clínica autorizou que você envie estes links naturalmente se o paciente pedir para ver o trabalho, quiser conhecer mais, ou ver depoimentos. Não envie do nada, envie no contexto certo!
- Link do Instagram: ${formData.instagram || 'Nenhum'}
- Link do Site: ${formData.website || 'Nenhum'}
- Link de Avaliações (Google/Doctoralia): ${formData.google_my_business || formData.doctoralia_url || 'Nenhum'}`
        }

        const compiledRulesMarkdown = `
### IDENTIDADE E TOM DE VOZ
- Clínica/Profissional: ${formData.name}
- Nome do Doutor(a): ${formData.professional_name} (Resumo Bio: ${formData.professional_bio})
- Tom de Voz Escolhido pela Clínica: ${formData.tone.toUpperCase()}
- Diretriz de Tom: O tom ${formData.tone} afeta diretamente sua escolha de palavras. Adote esse estilo imediatamente para conversar com o paciente.

### LOCALIZAÇÃO E ACESSO
- Endereço Completo: ${formData.address || 'Não informado'}
- Ponto de Referência: ${formData.reference_point || 'Nenhum'}
- Transporte Público Mais Próximo: ${formData.public_transport || 'Nenhum'}
- Estacionamento: ${formData.parking === 'gratis' ? 'Temos estacionamento próprio e gratuito.' : formData.parking === 'pago' ? 'Temos estacionamento vallet/pago.' : formData.parking === 'convenio' ? 'Temos convênio com estacionamento próximo.' : 'Não temos estacionamento próprio, o ideal é estacionar na rua ou em garagens pagas perto.'}
- Acessibilidade Física para Cadeirantes/Mobilidade Reduzida: ${accessibilityStr || 'Não especificado, avisar que pode haver escadas ou degraus.'}

### OPERAÇÃO GERAL DA CLÍNICA
- Modalidades de Atendimento: ${serviceModesStr}
- Horários de Funcionamento: ${formData.hours}
- Tempo Médio de Duração da Consulta: ${formData.consultation_duration}
- Exigência de Encaminhamento Médico Pévio: ${formData.referral_needed === 'nao' ? 'Não exigimos.' : formData.referral_needed === 'sim_convenio' ? 'Exigimos apenas para pacientes de convênio.' : 'Sempre exigimos encaminhamento de outro médico.'}

### PREPARO E DOCUMENTOS PARA A CONSULTA
- Preparo Prévio (MUITO IMPORTANTE AVISAR AO PACIENTE SE ELE AGENDAR): ${formData.pre_consultation_prep || 'Nenhum preparo especial obrigatório.'}
- Documentos que o paciente DEVE trazer no dia: ${docsStr || 'Documento pessoal básico com foto.'}

### PROCEDIMENTOS E PREÇOS (SERVIÇOS)
- Principais Serviços/Procedimentos Realizados por nós: ${formData.common_procedures}
- Valor da Consulta Particular Inicial: R$ ${formData.consultation_fee}
- Formas de Pagamento (Particular): ${paymentMethodsStr || 'Consulte'}
- Condições de Parcelamento (Se aplicável): ${formData.installments === 'nao_parcela' ? 'Não parcelamos, apenas a vista.' : 'Parcelamos em até ' + formData.installments.replace('ate_', '').replace('x', ' vezes')}
- Oferecemos desconto no Pix ou Dinheiro vivo? ${formData.discount_pix || 'Não oferecemos descontos.'}

### POLÍTICA DE CONVÊNIOS MÉDICOS
- Convênios Aceitos: ${formData.insurance || 'Não atendemos convênios (apenas consultas particulares).'}
- Resposta Padrão sobre Convênios NÃO LISTADOS acima: ${formData.insurance_policy}

### POLÍTICA COMERCIAL, RETORNOS E LINKS
- Política de Retorno de Consulta: ${formData.return_policy || 'Não informado (verificar internamente)'}
- Política de Cancelamento / Reagendamento (avisar se perguntarem): ${formData.cancellation_policy}
- Promoções Atuais Ativas: ${formData.promotions || 'Nenhuma no momento.'}
${linksStr}

### DIFERENCIAIS DA CLÍNICA (VENDER O VALOR)
- Caso o paciente demonstre objeção em relação ao preço/valor cobrado, destaque com educação os nossos REAIS diferenciais para ele enxergar o valor: ${formData.differentials}

### ANTI-ALUCINAÇÃO LIMITADOR: O QUE A CLÍNICA ABSOLUTAMENTE \`NÃO FAZ\`
- IMPORTANTE: NÃO FAZEMOS os seguintes procedimentos: ${formData.restrictions}
- ATENÇÃO: Se o paciente pedir isso ou perguntar, negue educadamente e NÃO faça falsas promessas, jamais crie falsas esperanças em serviços de saúde.

### DIRETRIZES DE URGÊNCIA MÉDICA
- Protocolo para casos de extrema emergência médica / sintomas críticos: ${formData.emergency_rules}

### OUTRAS REGRAS RESTRITAS DA GERÊNCIA
- ${formData.other_instructions || 'Sem regras adicionais'}
`.trim()

        const dbData = {
            name: formData.name as string,
            specialties: formData.specialties as string,
            consultation_fee: parseFloat(formData.consultation_fee) || 0,
            rules: compiledRulesMarkdown, // Salvando o Big Markdown
            wizard_settings: formData, // Salva o estado bruto do Wizard
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

            <SettingsContent initialData={clinic?.wizard_settings || clinic} hasCompleted={!!clinic?.rules} onSave={saveClinicData} />

        </div>
    )
}
