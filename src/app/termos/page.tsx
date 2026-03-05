import Link from 'next/link'
import Image from 'next/image'

export default function TermosPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-center mb-8 relative h-12">
                    <Image src="/logos/nexus_logo_equalized.png" alt="Nexus Clínicas Logo" fill className="object-contain" priority />
                </div>

                <div className="prose prose-slate max-w-none">
                    <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Termos de Serviço e Uso do Nexus SaaS</h1>
                    <p className="text-center text-slate-500 mb-8 italic">Última atualização: Março de 2026</p>

                    <p>Bem-vindo ao <strong>Nexus SaaS</strong>. Ao assinar e utilizar nossos serviços, você (doravante "Clínica" ou "Contratante") concorda com os seguintes termos e condições. Leia-os atentamente.</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Descrição do Serviço</h2>
                    <p>O Nexus SaaS é uma plataforma de automação e inteligência artificial voltada para clínicas médicas. Fornecemos um sistema que automatiza o atendimento via WhatsApp utilizando as APIs da OpenAI (para processamento de linguagem natural) e da Z-API (para integração com o WhatsApp).</p>
                    <p>Nós somos fornecedores de tecnologia ("Operadores"). Não prestamos serviços médicos, não validamos informações de saúde e não somos responsáveis por agendamentos, diagnósticos ou qualquer interação final com os pacientes.</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Uso Aceitável e Responsabilidades da Clínica</h2>
                    <p>Ao conectar seu número de WhatsApp ao Nexus SaaS, você concorda que:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Autorização dos Pacientes:</strong> A Clínica é a única responsável por garantir que possui o consentimento adequado dos seus pacientes (opt-in) para enviar e receber mensagens via WhatsApp.</li>
                        <li><strong>Uso Legal:</strong> O sistema não será utilizado para envio de spam, correntes, mensagens automatizadas em massa não solicitadas ou qualquer prática que viole as políticas do WhatsApp (Meta) e a legislação brasileira.</li>
                        <li><strong>Configuração da IA:</strong> A Clínica é responsável por fornecer as diretrizes, regras e contexto corretos para a Inteligência Artificial através do painel do Nexus. O Nexus não se responsabiliza por respostas geradas pela IA motivadas por configurações incorretas, informações médicas imprecisas fornecidas pela clínica ou "alucinações" inerentes à tecnologia de IA generativa.</li>
                        <li><strong>Decisões Médicas:</strong> O bot não deve ser configurado para dar diagnósticos médicos ou orientações de tratamentos críticos. A responsabilidade por qualquer informação de saúde transmitida é inteiramente da Clínica.</li>
                    </ol>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Integrações de Terceiros e Riscos</h2>
                    <p>Nós dependemos de serviços de terceiros para o funcionamento da plataforma:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Z-API / WhatsApp:</strong> O WhatsApp pode, a seu critério, alterar políticas, bloquear ou banir números de telefone que detectem comportamento automatizado suspeito ou violação de termos. O Nexus não se responsabiliza por bloqueios de números do cliente por parte da Meta/WhatsApp.</li>
                        <li><strong>OpenAI:</strong> As mensagens são processadas pela infraestrutura da OpenAI. Embora a OpenAI mantenha políticas rigorosas de privacidade para usuários de API, interrupções no serviço deles podem afetar o Nexus.</li>
                        <li>Nós nos comprometemos a fazer o melhor esforço (SLA de 99% de disponibilidade técnica de nossa parte), mas não podemos garantir uptime de serviços de terceiros.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Pagamentos, Assinaturas e Cancelamento</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>O Nexus funciona através de assinatura recorrente processada via Stripe.</li>
                        <li>A renovação é automática. Caso o pagamento falhe após as tentativas de cobrança do Stripe, o serviço (e o bot) poderão ser suspensos até a regularização.</li>
                        <li>É sua a responsabilidade cancelar a assinatura, o que pode ser feito de forma "self-service" a qualquer momento pelo painel do cliente.</li>
                        <li>Não oferecemos reembolso por períodos já faturados e parcialmente utilizados, salvo determinação legal. O cancelamento interromperá as cobranças futuras.</li>
                    </ol>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Propriedade Intelectual</h2>
                    <p>Todo o código, design, fluxos e propriedade intelectual da plataforma Nexus pertencem à nossa empresa. A Clínica recebe uma licença de uso revogável, não-exclusiva e intransferível durante a vigência da assinatura. Não é permitido copiar, revender ou tentar fazer engenharia reversa do software.</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">6. Limitação de Responsabilidade</h2>
                    <p>Em nenhuma hipótese o Nexus será responsável por danos indiretos, lucros cessantes, perda de dados ou danos à reputação decorrentes de interrupções do sistema, bloqueios de WhatsApp, erros da Inteligência Artificial ou vazamentos de dados causados por negligência na guarda de senhas por parte da Clínica.</p>
                    <p>A responsabilidade máxima do Nexus em qualquer pleito será limitada ao valor pago pela Clínica nos últimos 3 (três) meses de assinatura.</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">7. Foro e Alterações</h2>
                    <p>Podemos atualizar estes Termos periodicamente. Modificações maiores serão avisadas por e-mail ou no painel. O uso contínuo do serviço após as alterações constitui aceitação.</p>
                    <p>As partes elegem o foro da sede da empresa do Nexus para dirimir eventuais dúvidas.</p>
                </div>

                <div className="mt-12 flex justify-center">
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Voltar para o Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
