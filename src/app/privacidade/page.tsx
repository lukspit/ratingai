import Link from 'next/link'
import Image from 'next/image'

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-center mb-8 relative h-12">
                    <Image src="/logos/nexus_logo_equalized.png" alt="Nexus Clínicas Logo" fill className="object-contain" priority />
                </div>

                <div className="prose prose-slate max-w-none">
                    <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Política de Privacidade do Nexus SaaS</h1>
                    <p className="text-center text-slate-500 mb-8 italic">Última atualização: Março de 2026</p>

                    <p>O <strong>Nexus SaaS</strong> ("nós", "nosso") leva a privacidade a sério. Esta política explica como coletamos, usamos e protegemos os seus dados (Clínica) e os dados dos seus usuários (Pacientes), em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Nossos Papéis na LGPD</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Controlador dos Dados:</strong> A Clínica (nosso cliente) é a Controladora dos dados dos seus pacientes. É a Clínica quem decide o porquê e como os dados dos pacientes são tratados.</li>
                        <li><strong>Operador dos Dados:</strong> O Nexus atua estritamente como Operador dos dados dos pacientes. Nós processamos as informações puramente seguindo as regras da plataforma para fornecer o serviço de automação para a Clínica. Somos Controladores apenas dos dados de cadastro e faturamento dos nossos clientes (as clínicas).</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Dados que Coletamos</h2>
                    <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">Dados das Clínicas (Nossos Clientes):</h3>
                    <ul className="list-disc pl-5 space-y-2 mb-4">
                        <li><strong>Dados de Cadastro:</strong> Nome do responsável, e-mail, nome da clínica.</li>
                        <li><strong>Dados de Faturamento:</strong> Processados de forma segura pelo nosso parceiro de pagamentos (Stripe). Não armazenamos números completos de cartão de crédito nos nossos bancos de dados.</li>
                        <li><strong>Configurações e Logs:</strong> Regras de negócio da clínica, prompts customizados e histórico de ações no painel.</li>
                    </ul>

                    <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">Dados dos Pacientes (Processados em nome das Clínicas):</h3>
                    <p>Para que a Inteligência Artificial e o bot funcionem, processamos temporariamente e armazenamos:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Números de telefone (WhatsApp) em contato com a clínica.</li>
                        <li>O histórico e conteúdo das mensagens trocadas com o bot.</li>
                        <li>Nomes ou outros dados fornecidos livremente pelo paciente durante a conversa para agendamento.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Como Usamos os Dados</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Prestar o Serviço:</strong> O conteúdo das mensagens do paciente é enviado à API da <strong>OpenAI</strong> para interpretação e formulação da resposta baseada no contexto da clínica, e para a <strong>Z-API</strong> para realizar o envio ao WhatsApp do paciente.</li>
                        <li><strong>Melhorias e Suporte:</strong> Logs do sistema e erros para identificar falhas no envio (ex: QR code desconectado).</li>
                        <li><strong>Faturamento:</strong> Para cobrar e gerenciar sua assinatura.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Compartilhamento de Dados com Terceiros</h2>
                    <p>Não vendemos, alugamos ou comercializamos listas de pacientes ou dados das clínicas. Compartilhamos dados apenas de forma estritamente necessária com provedores essenciais da nossa infraestrutura técnica:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Supabase / AWS:</strong> Para hospedagem dos nossos bancos de dados e autenticação, com servidores seguros na nuvem.</li>
                        <li><strong>OpenAI:</strong> As mensagens dos pacientes (sem necessariamente expor sua identidade direta além do que ele fala na conversa) são enviadas para a OpenAI gerar as respostas (GPT-4 via API). A política enterprise da OpenAI não permite usar os dados fornecidos via API para treinar seus modelos públicos.</li>
                        <li><strong>Z-API:</strong> Plataforma por onde a mensagem transita do nosso servidor até a rede do WhatsApp.</li>
                        <li><strong>Stripe:</strong> Para gerenciamento do pagamento das clínicas.</li>
                    </ol>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Segurança da Informação</h2>
                    <p>Utilizamos banco de dados modernos (Supabase) com controle a nível de linha (RLS - Row Level Security), garantindo que uma clínica jamais possa acessar os dados, agendamentos ou mensagens de outra clínica. Utilizamos criptografia em trânsito (HTTPS).</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">6. Retenção e Exclusão de Dados</h2>
                    <p>Manteremos os dados da Clínica ativos enquanto a assinatura durar.</p>
                    <p>Se a Clínica desejar encerrar o contrato, poderá solicitar a exclusão total da sua conta, bem como as configurações e históricos das mensagens processadas, diretamente pelo painel ou enviando um e-mail para o suporte do Nexus.</p>
                    <p>Dados de faturamento que precisem ser retidos para fins de cumprimento de obrigações fiscais e legais serão mantidos pelo tempo exigido por lei.</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">7. Direitos dos Titulares dos Dados</h2>
                    <p>Os pacientes devem exercer seus direitos (como confirmação, acesso, anonimização, bloqueio ou eliminação de dados) entrando em contato diretamente com a <strong>Clínica</strong>. Como Operadores, caso o Nexus receba uma requisição direta de um paciente, nós a encaminharemos para a Clínica responsável.</p>
                    <p>Os nossos clientes (Clínicas) possuem acesso fácil e direto a edição, exportação ou deleção dos seus dados na nossa plataforma de autogestão.</p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">8. Contato</h2>
                    <p>Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato através dos nossos canais oficiais de suporte na plataforma.</p>
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
