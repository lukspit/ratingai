# Política de Privacidade do Nexus SaaS

*Última atualização: Março de 2026*

O **Nexus SaaS** ("nós", "nosso") leva a privacidade a sério. Esta política explica como coletamos, usamos e protegemos os seus dados (Clínica) e os dados dos seus usuários (Pacientes), em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).

## 1. Nossos Papéis na LGPD
- **Controlador dos Dados:** A Clínica (nosso cliente) é a Controladora dos dados dos seus pacientes. É a Clínica quem decide o porquê e como os dados dos pacientes são tratados.
- **Operador dos Dados:** O Nexus atua estritamente como Operador dos dados dos pacientes. Nós processamos as informações puramente seguindo as regras da plataforma para fornecer o serviço de automação para a Clínica. Somos Controladores apenas dos dados de cadastro e faturamento dos nossos clientes (as clínicas).

## 2. Dados que Coletamos
### Dados das Clínicas (Nossos Clientes):
- **Dados de Cadastro:** Nome do responsável, e-mail, nome da clínica.
- **Dados de Faturamento:** Processados de forma segura pelo nosso parceiro de pagamentos (Stripe). Não armazenamos números completos de cartão de crédito nos nossos bancos de dados.
- **Configurações e Logs:** Regras de negócio da clínica, prompts customizados e histórico de ações no painel.

### Dados dos Pacientes (Processados em nome das Clínicas):
Para que a Inteligência Artificial e o bot funcionem, processamos temporariamente e armazenamos:
- Números de telefone (WhatsApp) em contato com a clínica.
- O histórico e conteúdo das mensagens trocadas com o bot.
- Nomes ou outros dados fornecidos livremente pelo paciente durante a conversa para agendamento.

## 3. Como Usamos os Dados
- **Prestar o Serviço:** O conteúdo das mensagens do paciente é enviado à API da **OpenAI** para interpretação e formulação da resposta baseada no contexto da clínica, e para a **Z-API** para realizar o envio ao WhatsApp do paciente.
- **Melhorias e Suporte:** Logs do sistema e erros para identificar falhas no envio (ex: QR code desconectado).
- **Faturamento:** Para cobrar e gerenciar sua assinatura.

## 4. Compartilhamento de Dados com Terceiros
Não vendemos, alugamos ou comercializamos listas de pacientes ou dados das clínicas. Compartilhamos dados apenas de forma estritamente necessária com provedores essenciais da nossa infraestrutura técnica:
1. **Supabase / AWS:** Para hospedagem dos nossos bancos de dados e autenticação, com servidores seguros na nuvem.
2. **OpenAI:** As mensagens dos pacientes (sem necessariamente expor sua identidade direta além do que ele fala na conversa) são enviadas para a OpenAI gerar as respostas (GPT-4 via API). A política enterprise de API da OpenAI [não permite usar os dados para treinar seus modelos de IA gerais].
3. **Z-API:** Plataforma por onde a mensagem transita do nosso servidor até a rede do WhatsApp.
4. **Stripe:** Para gerenciamento do pagamento das clínicas.

## 5. Segurança da Informação
Utilizamos banco de dados modernos (Supabase) com controle a nível de linha (RLS - Row Level Security), garantindo que uma clínica jamais possa acessar os dados, agendamentos ou mensagens de outra clínica. Utilizamos criptografia em trânsito (HTTPS).

## 6. Retenção e Exclusão de Dados
Manteremos os dados da Clínica ativos enquanto a assinatura durar. 
Se a Clínica desejar encerrar o contrato, poderá solicitar a exclusão total da sua conta, bem como as configurações e históricos das mensagens processadas, diretamente pelo painel ou enviando um e-mail para o suporte do Nexus.
Dados de faturamento que precisem ser retidos para fins de cumprimento de obrigações fiscais e legais serão mantidos pelo tempo exigido por lei.

## 7. Direitos dos Titulares dos Dados
Os pacientes devem exercer seus direitos (como confirmação, acesso, anonimização, bloqueio ou eliminação de dados) entrando em contato diretamente com a **Clínica**. Como Operadores, caso o Nexus receba uma requisição direita de um paciente, nós a encaminharemos para a Clínica responsável.
Os nossos clientes (Clínicas) possuem acesso fácil e direto a edição, exportação ou deleção dos seus dados na nossa plataforma de autogestão.

## 8. Contato
Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato através dos nossos canais oficiais de suporte na plataforma.
