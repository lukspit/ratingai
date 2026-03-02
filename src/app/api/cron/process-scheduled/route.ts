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
                const { data: history } = await supabase
                    .from("messages")
                    .select("role, content")
                    .eq("patient_id", msg.patient_id)
                    .order("created_at", { ascending: false })
                    .limit(10);

                const historyContext = (history || [])
                    .reverse()
                    .map(m => `${m.role === 'user' ? 'Paciente' : 'Assistente'}: ${m.content}`)
                    .join('\n');

                // 3. Define o "Objetivo" da IA baseado no tipo de mensagem
                let promptGoal = "";
                if (msg.type === 'FOLLOW_UP') {
                    promptGoal = "O paciente parou de responder há algum tempo. Mande uma mensagem curta, amigável e humana (não robótica) para tentar retomar o contato, baseando-se no que foi falado por último.";
                } else if (msg.type === 'REMINDER_24H') {
                    promptGoal = "Este é um lembrete amigável de que a consulta é AMANHÃ. Confirme se ele recebeu a informação.";
                } else if (msg.type === 'CONFIRMATION_2H') {
                    promptGoal = "A consulta é em 2 horas. Peça uma confirmação final de presença de forma educada.";
                }

                // 4. Gera o texto com a IA
                const completion = await openai.chat.completions.create({
                    model: "openai/gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `Você é ${msg.clinics.assistant_name}, assistente da clínica ${msg.clinics.name}.
              Directrizes da clínica: ${msg.clinics.rules}
              
              CONTEXTO DA CONVERSA ATÉ AGORA:
              ${historyContext}
              
              OBJETIVO AGORA: ${promptGoal}
              
              REGRAS:
              1. Resposta curta (máximo 2-3 frases).
              2. Tom humano, empático e profissional.
              3. Não use placeholders como [Nome]. Se não souber o nome, não use.`
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
