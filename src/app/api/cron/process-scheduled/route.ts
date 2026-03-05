import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function GET(req: Request) {
    try {
        // 1. Busca mensagens pendentes que já passaram do horário
        const { data: pendingMessages, error: fetchError } = await supabase
            .from("scheduled_messages")
            .select(`
        *,
        clinics:clinic_id (name, rules, assistant_name),
        instances:instance_id (zapi_token, zapi_instance_id)
      `)
            .eq("status", "PENDING")
            .lte("scheduled_for", new Date().toISOString())
            .limit(10); // Processamos 10 por vez para não estourar timeout da cron

        if (fetchError) throw fetchError;
        if (!pendingMessages || pendingMessages.length === 0) {
            return NextResponse.json({ status: "no_messages_to_process" });
        }

        console.log(`[CRON] Processando ${pendingMessages.length} mensagens...`);

        for (const msg of pendingMessages) {
            try {
                // 2. Busca o histórico recente para dar contexto ao Follow-up/Lembrete
                // NOTA: a tabela `messages` usa `phone_number` + `instance_id`, não `patient_id`
                const { data: history } = await supabase
                    .from("messages")
                    .select("role, content")
                    .eq("phone_number", msg.phone_number)
                    .eq("instance_id", msg.instance_id)
                    .order("created_at", { ascending: false })
                    .limit(10);

                const historyContext = (history || [])
                    .reverse()
                    .map(m => `${m.role === 'user' ? 'Paciente' : 'Assistente'}: ${m.content}`)
                    .join('\n');

                // 3. Define o "Objetivo" da IA baseado no tipo de mensagem
                let promptGoal = "";
                if (msg.type === 'FOLLOW_UP_2H') {
                    promptGoal = "1. O paciente parou de responder a nossa última mensagem há cerca de 2 horas.\n2. Seja prestativo, curto e amigável. Diga que está passando só pra ver se restou alguma dúvida ou se pode ajudar a encontrar um horário.";
                } else if (msg.type === 'FOLLOW_UP_24H') {
                    promptGoal = "1. O paciente não respondeu nossa mensagem de ontem.\n2. Crie um gatilho muito sutil de esgotamento de agenda (diga que a agenda do médico para essa semana/mês está enchendo rápido).\n3. Pergunte de forma super amigável se ele ainda tem interesse na consulta.";
                } else if (msg.type === 'REMINDER_24H') {
                    promptGoal = "1. O paciente tem uma consulta agendada para AMANHÃ.\n2. Peça uma confirmação explícita (um 'sim' ou 'não').\n3. Diga de forma natural que, caso ocorra algum imprevisto, ele pode avisar para reagendarmos.";
                } else if (msg.type === 'CONFIRMATION_2H') {
                    promptGoal = "1. A consulta do paciente é em exatas 2 HORAS.\n2. Seja muuuito prático. Passe (ou lembre se necessário) as informações de chegada/link e diga que a clínica já o aguarda.";
                } else if (msg.type === 'FOLLOW_UP') { // Fallback para lógicas antigas que já foram agendadas
                    promptGoal = "O paciente parou de responder. Mande uma mensagem curta e amigável para tentar retomar o contato, baseando-se no que foi falado por último.";
                }

                // 4. Gera o texto com a IA
                const completion = await openai.chat.completions.create({
                    model: "openai/gpt-4o-mini", // Alterado para um modelo mais estável e rápido para crons
                    messages: [
                        {
                            role: "system",
                            content: `Você é ${msg.clinics.assistant_name}, assistente da clínica ${msg.clinics.name}.
              Directrizes da clínica: ${msg.clinics.rules}
              
              CONTEXTO DA CONVERSA ATÉ AGORA:
              ${historyContext}
              
              === OBJETIVO ESTRATÉGICO DESTA MENSAGEM AGORA ===
              ${promptGoal}
              =================================================
              
              REGRAS DE OURO:
              1. Resposta SUPER curta e direta. Vá direto ao ponto.
              2. Tom humano, empático e natural como o WhatsApp exige. Nada muito robótico ou formal demais.
              3. NUNCA use placeholders como [Nome do Paciente] ou [Assunto]. Você JÁ tem o contexto acima. Se não tiver o nome da pessoa na conversa, apenas não chame pelo nome.`
                        }
                    ],
                    temperature: 0.7,
                });

                const aiText = completion.choices[0].message.content;

                if (aiText) {
                    // 5. Envia via Z-API
                    const zapiUrl = `https://api.z-api.io/instances/${msg.instances.zapi_instance_id}/token/${msg.instances.zapi_token}/send-text`;
                    const response = await fetch(zapiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            phone: msg.phone_number,
                            message: aiText
                        }),
                    });

                    if (response.ok) {
                        // 6. Atualiza status no banco e salva a mensagem no histórico
                        await supabase.from("scheduled_messages").update({ status: "SENT" }).eq("id", msg.id);
                        await supabase.from("messages").insert({
                            instance_id: msg.instance_id,
                            patient_id: msg.patient_id,
                            phone_number: msg.phone_number,
                            role: "assistant",
                            content: `[AUTO-${msg.type}] ${aiText}`
                        });
                        console.log(`[CRON] Mensagem ${msg.type} enviada para ${msg.phone_number}`);
                    } else {
                        console.error(`[CRON] Erro Z-API ao enviar ${msg.id}:`, await response.text());
                        await supabase.from("scheduled_messages").update({ status: "FAILED" }).eq("id", msg.id);
                    }
                }
            } catch (innerError) {
                console.error(`[CRON] Erro ao processar mensagem ${msg.id}:`, innerError);
            }
        }

        return NextResponse.json({ success: true, processed: pendingMessages.length });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
