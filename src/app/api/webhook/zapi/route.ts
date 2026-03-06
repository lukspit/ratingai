import { NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "fs";
import { google } from "googleapis";

export const maxDuration = 60; // Timeout de 60s para Vercel


// Cliente Supabase com permissões básicas (Anon Key)
// O RPC 'get_webhook_context' foi criado como SECURITY DEFINER no banco para contornar o RLS de forma isolada e segura.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Conexão com a inteligência usando OpenRouter para garantir flexibilidade de modelos
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Cliente OpenAI direto para Whisper (transcrição de áudio)
// OpenRouter não suporta o endpoint /audio/transcriptions
// Inicialização lazy: só falha se de fato receber áudio sem a key configurada
function getOpenAIDirectClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Necessária para transcrição de áudio.",
    );
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

import { chunkMessage } from "@/lib/string-utils";
import {
  getBrazilianGreeting,
  buildSystemPromptV2,
  transcribeAudio,
  describeImage,
  summarizeOlderMessages,
  type CalendarInfo,
} from "@/lib/ai-helpers";
import { checkAvailability, bookAppointment } from "@/lib/calendar";

/**
 * Parse seguro do google_calendar_id.
 * Aceita tanto o formato legado (string simples) quanto o novo (JSON array).
 */
function parseCalendarsFromContext(raw: string | null): CalendarInfo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Formato legado: string simples
    return [{ id: raw, summary: 'Agenda Principal', description: '' }];
  }
  return [];
}

// =============================================================================
// TIPOS
// =============================================================================
type ContextData = {
  instance_uuid: string;
  zapi_token: string;
  client_token: string | null;
  clinic_name: string;
  clinic_rules: string;
  clinic_specialties: string;
  consultation_fee: number;
  assistant_name: string;
  clinic_id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_calendar_id: string | null;
  notification_phone: string | null;
};

// =============================================================================
// BUFFER DE MENSAGENS — DEBOUNCE DE 20 SEGUNDOS
// Agrupa mensagens enviadas em sequência rápida antes de acionar a IA.
// =============================================================================
const BUFFER_WINDOW_MS = 8_000; // 8 segundos — tempo ideal para agrupar mensagens picadas no WhatsApp

/**
 * Cria ou atualiza o buffer de mensagens para um paciente.
 * Estende o `process_after` toda vez que uma nova mensagem chega (debounce real).
 * Retorna o `updated_at` do registro no momento desta operação.
 */
async function upsertMessageBuffer(
  phone: string,
  instanceUuid: string,
  zapiInstanceId: string,
  patientId: string | null,
  newMsg: { content: string; mediaType: string; mediaUrl: string | null },
): Promise<{ bufferId: string; updatedAt: string }> {
  const processAfter = new Date(Date.now() + BUFFER_WINDOW_MS).toISOString();

  // Verifica se já existe um buffer ativo para este paciente
  const { data: existing } = await supabase
    .from("message_buffer")
    .select("id, messages, updated_at")
    .eq("phone_number", phone)
    .eq("instance_id", instanceUuid)
    .eq("is_processed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Apenda a nova mensagem ao array existente e extende o timer
    const updatedMessages = [...(existing.messages || []), newMsg];
    const now = new Date().toISOString();
    await supabase
      .from("message_buffer")
      .update({
        messages: updatedMessages,
        process_after: processAfter,
        updated_at: now,
      })
      .eq("id", existing.id);

    console.log(
      `[BUFFER] Mensagem apendada ao buffer ${existing.id}. Total: ${updatedMessages.length} msgs. Process after: ${processAfter}`,
    );
    return { bufferId: existing.id, updatedAt: now };
  } else {
    // Cria novo buffer
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
      .from("message_buffer")
      .insert({
        patient_id: patientId,
        instance_id: instanceUuid,
        phone_number: phone,
        zapi_instance_id: zapiInstanceId,
        messages: [newMsg],
        process_after: processAfter,
        updated_at: now,
      })
      .select("id")
      .single();

    if (error || !created) throw new Error("Falha ao criar buffer: " + error?.message);

    console.log(
      `[BUFFER] Novo buffer criado: ${created.id}. Process after: ${processAfter}`,
    );
    return { bufferId: created.id, updatedAt: now };
  }
}

// =============================================================================
// PIPELINE DE IA — Núcleo de processamento LLM
// Recebe a mensagem final (já concatenada se vier do buffer) e retorna a resposta.
// =============================================================================
async function runAIPipeline(
  phone: string,
  instanceId: string, // zapi instance ID
  userMessage: string,
  patientId: string | null,
  contextData: ContextData,
  fetchHeaders: Record<string, string>,
  messageId?: string | null, // ID da mensagem original (para react_to_message)
): Promise<void> {
  // Busca o histórico de mensagens do paciente
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("instance_id", contextData.instance_uuid)
    .eq("phone_number", phone)
    .order("created_at", { ascending: false })
    .limit(30);

  const allMessages = (history || []).reverse().map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  // Sumariza mensagens antigas se necessário
  let conversationSummary: string | null = null;
  let recentMessages = allMessages;
  if (allMessages.length > 20) {
    const olderMessages = allMessages.slice(0, allMessages.length - 20);
    recentMessages = allMessages.slice(allMessages.length - 20);
    try {
      conversationSummary = await summarizeOlderMessages(olderMessages, openai);
      console.log(`[SUMÁRIO] ${olderMessages.length} mensagens antigas sumarizadas`);
    } catch (err) {
      console.error("[SUMÁRIO] Falha ao sumarizar:", err);
    }
  }

  // Constrói o System Prompt
  const { greeting, datetime } = getBrazilianGreeting();
  const isReturning = allMessages.length > 0;

  // Parse das agendas configuradas (compatível com formato antigo e novo)
  const calendars = parseCalendarsFromContext(contextData.google_calendar_id);
  const hasCalendarTools = !!(
    contextData.google_access_token && calendars.length > 0
  );

  const systemPrompt = buildSystemPromptV2({
    assistant_name: contextData.assistant_name || "Liz",
    clinic_name: contextData.clinic_name,
    clinic_specialties: contextData.clinic_specialties,
    consultation_fee: contextData.consultation_fee,
    clinic_rules: contextData.clinic_rules,
    currentDatetime: datetime,
    greeting: greeting,
    isReturningPatient: isReturning,
    hasCalendarTools: hasCalendarTools,
    calendars: calendars,
  });

  // Monta mensagens para o LLM
  const messagesForLLM: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_calls?: any;
    tool_call_id?: string;
  }> = [{ role: "system", content: systemPrompt }];

  if (conversationSummary) {
    messagesForLLM.push({
      role: "system",
      content: `=== RESUMO DAS MENSAGENS ANTERIORES ===\n${conversationSummary}`,
    });
  }

  messagesForLLM.push(...recentMessages);
  messagesForLLM.push({ role: "user", content: userMessage });

  // Define as ferramentas disponíveis
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "react_to_message",
        description:
          'Reage à mensagem atual do usuário com um emoji. Útil para humanizar a conversa ou dar um simples "visto/ok" sem texto.',
        parameters: {
          type: "object",
          properties: {
            emoji: {
              type: "string",
              description:
                "O emoji para reagir (um único caractere, ex: 👍, ❤️, 😂)",
            },
          },
          required: ["emoji"],
        },
      },
    },
  ];
  if (hasCalendarTools) {
    tools.push({
      type: "function",
      function: {
        name: "check_availability",
        description:
          "Verifica horários ocupados na agenda do Google Calendar da clínica para a data especificada.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "A data alvo (YYYY-MM-DD)" },
            calendar_id: { type: "string", description: "O ID da agenda a ser consultada (da lista de agendas disponíveis)" },
          },
          required: ["date", "calendar_id"],
        },
      },
    });
    tools.push({
      type: "function",
      function: {
        name: "book_appointment",
        description:
          "Marca uma consulta médica preenchendo o slot no Google Calendar e nossa base.",
        parameters: {
          type: "object",
          properties: {
            patient_name: {
              type: "string",
              description: "Nome completo do paciente",
            },
            start_time: {
              type: "string",
              description: "Hora de início exata no formato ISO 8601 COM timezone (ex: 2024-05-20T14:00:00-03:00)",
            },
            end_time: {
              type: "string",
              description: "Hora de término exata no formato ISO 8601 COM timezone (normalmente 1 hora de duração, ex: 2024-05-20T15:00:00-03:00)",
            },
            calendar_id: {
              type: "string",
              description: "O ID da agenda onde marcar (da lista de agendas disponíveis)",
            },
          },
          required: ["patient_name", "start_time", "end_time", "calendar_id"],
        },
      },
    });
  }

  // Chamada ao LLM
  const payload: any = {
    model: "openai/gpt-4o-mini",
    messages: messagesForLLM,
    temperature: 0.7,
    max_tokens: 1024,
  };
  if (tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = "auto";
    payload.parallel_tool_calls = false;
  }

  let aiResponse = "";
  let completion = await openai.chat.completions.create(payload);
  let aiMessage = completion.choices[0].message;

  // CORREÇÃO CRÍTICA: Alguns modelos (ex: DeepSeek) podem retornar content + tool_calls
  // simultaneamente na primeira resposta (ex: "Vou verificar a agenda...").
  // Quando há tool_calls, DESCARTAMOS o content da primeira resposta — ele nunca
  // deve ser enviado ao paciente. A resposta final virá da 2ª chamada LLM.
  if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
    aiMessage.content = null;
  }

  // Processa chamadas de ferramentas
  if (aiMessage.tool_calls) {
    messagesForLLM.push(aiMessage as any);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    if (hasCalendarTools && contextData.google_access_token) {
      oauth2Client.setCredentials({
        access_token: contextData.google_access_token,
        refresh_token: contextData.google_refresh_token,
      });
    }
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    for (const toolCall of aiMessage.tool_calls) {
      const funcName = (toolCall as any).function.name;
      const funcArgs = (toolCall as any).function.arguments;

      console.log(`[TOOLS] IA chamou "${funcName}" com argumentos:`, funcArgs);

      if (funcName === "check_availability") {
        const args = JSON.parse(funcArgs);
        // === TRANSIÇÃO AUTOMÁTICA: INTERESSE ===
        if (patientId) {
          await supabase
            .from("patients")
            .update({ lead_status: "INTERESSE" })
            .eq("id", patientId)
            .in("lead_status", ["NOVO", "EM_ATENDIMENTO"]);
          console.log(`[LEAD STATUS] ${phone} → INTERESSE (check_availability chamado)`);
        }
        try {
          // Usa o calendar_id escolhido pela IA, com fallback para a primeira agenda
          const targetCalendarId = args.calendar_id || calendars[0]?.id || '';
          const busySlots = await checkAvailability(
            {
              accessToken: contextData.google_access_token as string,
              refreshToken: contextData.google_refresh_token as string,
              clinicId: contextData.clinic_id,
            },
            targetCalendarId,
            args.date,
          );
          console.log(`[CALENDAR] Encontrados ${busySlots.length} slots ocupados na agenda ${targetCalendarId}.`);
          messagesForLLM.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ occupied_slots: busySlots }),
          });
        } catch (e: any) {
          console.error("[CALENDAR ERROR] Falha no check_availability:", e.message);
          messagesForLLM.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: e.message }),
          });
        }
      } else if (funcName === "book_appointment") {
        const args = JSON.parse(funcArgs);
        try {
          // Usa o calendar_id escolhido pela IA, com fallback para a primeira agenda
          const bookCalendarId = args.calendar_id || calendars[0]?.id || '';
          const result = await bookAppointment(
            {
              accessToken: contextData.google_access_token as string,
              refreshToken: contextData.google_refresh_token as string,
              clinicId: contextData.clinic_id,
            },
            bookCalendarId,
            args.patient_name,
            phone,
            args.start_time,
            args.end_time,
          );
          const { isoStart, isoEnd } = result;
          console.log(`[CALENDAR] Sucesso ao agendar para: ${args.patient_name} às ${isoStart}`);

          if (patientId) {
            const { error: apptError } = await supabase.rpc("insert_appointment", {
              p_clinic_id: contextData.clinic_id,
              p_patient_id: patientId,
              p_scheduled_at: isoStart,
              p_status: "CONFIRMED",
            });
            if (apptError) console.error("[RPC ERROR] Falha ao inserir agendamento:", apptError);
            else console.log(`[SUPABASE] Agendamento salvo para patient_id: ${patientId}`);

            // === TRANSIÇÃO AUTOMÁTICA: AGENDADO ===
            await supabase
              .from("patients")
              .update({ lead_status: "AGENDADO" })
              .eq("id", patientId);
            console.log(`[LEAD STATUS] ${phone} → AGENDADO (book_appointment concluído)`);

            const { error: updError } = await supabase.rpc("update_patient_info", {
              p_patient_id: patientId,
              p_name: args.patient_name,
              p_status: "AGENDADO",
            });
            if (updError) console.error("[RPC ERROR] Falha ao atualizar paciente:", updError);

            // === DISPARO DE NOTIFICAÇÃO PARA O DONO ===
            if (contextData.notification_phone) {
              try {
                const notifUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-text`;
                const d = new Date(isoStart);
                const dataFormatada = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
                const horaFormatada = d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

                const avisoText = `🚨 *NOVO AGENDAMENTO PELA IA* 🚨\n\n*Paciente:* ${args.patient_name}\n*Telefone:* ${phone}\n*Data:* ${dataFormatada}\n*Horário:* ${horaFormatada}\n\n_O paciente já foi avisado e a agenda está bloqueada._`;

                await fetch(notifUrl, {
                  method: "POST",
                  headers: fetchHeaders,
                  body: JSON.stringify({
                    phone: contextData.notification_phone,
                    message: avisoText,
                    delayMessage: 0,
                    delayTyping: 0,
                  }),
                });
                console.log(`[NOTIFICAÇÃO] Aviso de agendamento enviado com sucesso para ${contextData.notification_phone}`);
              } catch (notifErr) {
                console.error("[NOTIFICAÇÃO] Falha ao enviar aviso para o dono da clínica:", notifErr);
              }
            }

            // Lembretes automáticos
            const reminder24h = new Date(new Date(isoStart).getTime() - 24 * 60 * 60 * 1000);
            const reminder2h = new Date(new Date(isoStart).getTime() - 2 * 60 * 60 * 1000);
            const now = new Date();
            if (reminder24h > now) {
              await supabase.from("scheduled_messages").insert({
                clinic_id: contextData.clinic_id,
                patient_id: patientId,
                instance_id: contextData.instance_uuid,
                phone_number: phone,
                type: "REMINDER_24H",
                scheduled_for: reminder24h.toISOString(),
              });
            }
            if (reminder2h > now) {
              await supabase.from("scheduled_messages").insert({
                clinic_id: contextData.clinic_id,
                patient_id: patientId,
                instance_id: contextData.instance_uuid,
                phone_number: phone,
                type: "CONFIRMATION_2H",
                scheduled_for: reminder2h.toISOString(),
              });
            }
          } else {
            console.error(`[APPT ERRO CRÍTICO] Google Calendar agendou mas patientId é null! Agendamento de ${args.patient_name} às ${isoStart} NÃO foi salvo no Supabase.`);
          }

          messagesForLLM.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: true,
              message: "A consulta foi agendada com sucesso no Google Calendar e registrada em nosso sistema.",
            }),
          });
        } catch (e: any) {
          console.error("[CALENDAR ERROR] Falha no book_appointment:", e.message);
          messagesForLLM.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: e.message }),
          });
        }
      } else if (funcName === "react_to_message") {
        const args = JSON.parse(funcArgs);
        try {
          if (messageId) {
            const reactUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-reaction`;
            await fetch(reactUrl, {
              method: "POST",
              headers: fetchHeaders,
              body: JSON.stringify({
                phone: phone,
                messageId: messageId,
                reaction: args.emoji,
              }),
            });
            console.log(`[REAÇÃO] IA reagiu com ${args.emoji} à mensagem ${messageId}`);
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: `Reagiu com sucesso com o emoji ${args.emoji}`,
              }),
            });
          } else {
            // No contexto de buffer, não temos messageId — ignoramos silenciosamente
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                info: "Reação não aplicada (mensagem agrupada pelo buffer, messageId indisponível).",
              }),
            });
          }
        } catch (e: any) {
          console.error("[REAÇÃO] Erro ao enviar a reação:", e);
          messagesForLLM.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Falha ao reagir: ${e.message}` }),
          });
        }
      }
    } // fim do for (toolCalls)

    // Segunda chamada — resposta final após tools executarem
    completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: messagesForLLM as any,
      temperature: 0.7,
      max_tokens: 1024,
    });
    let finalMessage = completion.choices[0].message;

    let memoryString = `[MEMÓRIA DE SISTEMA: Usei ferramentas nesta rodada. ${aiMessage.tool_calls!.map((t: any) => t.function.name).join(", ")}]`;
    const toolResults = messagesForLLM.filter((m) => m.role === "tool");
    if (toolResults.length > 0) {
      memoryString += `\nResultados obtidos da agenda: ${toolResults.map((t) => t.content).join(" | ")}`;
    }

    const finalContent = finalMessage.content || "...";
    const textToSave = `${memoryString}\n\n${finalContent}`;

    await supabase.from("messages").insert({
      instance_id: contextData.instance_uuid,
      phone_number: phone,
      role: "assistant",
      content: textToSave,
    });

    aiResponse = finalContent;
  } else {
    aiResponse = aiMessage.content || "...";
    if (aiResponse !== "...") {
      await supabase.from("messages").insert({
        instance_id: contextData.instance_uuid,
        phone_number: phone,
        role: "assistant",
        content: aiResponse,
      });
    }
  }

  // Agendamento de follow-ups (2h e 24h)
  if (patientId && aiResponse && aiResponse !== "...") {
    const followUpTime2h = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const followUpTime24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.rpc("upsert_follow_up", {
      p_clinic_id: contextData.clinic_id,
      p_patient_id: patientId,
      p_instance_id: contextData.instance_uuid,
      p_phone_number: phone,
      p_scheduled_for_2h: followUpTime2h,
      p_scheduled_for_24h: followUpTime24h,
    });
    console.log(`[FOLLOW-UP] Agendados para ${followUpTime2h} (2h) e ${followUpTime24h} (24h)`);
  }

  // Envio da resposta via Z-API sequencial com delay
  const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-text`;
  const chunks = chunkMessage(aiResponse);
  let accumulatedDelayMessage = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const typingDelay = Math.max(2, Math.min(15, Math.ceil(chunk.length / 15)));

    const zapiPayload = {
      phone: phone,
      message: chunk,
      delayMessage: accumulatedDelayMessage,
      delayTyping: typingDelay,
    };

    accumulatedDelayMessage += typingDelay + 1;

    try {
      await fetch(zapiUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(zapiPayload),
      });
      console.log(`[Z-API] Parte ${i + 1}/${chunks.length} enviada.`);
    } catch (e) {
      console.error(`[Z-API] Erro ao enviar a parte ${i + 1}/${chunks.length}:`, e);
    }

    // Delay de segurança entre a requisição de cada chunk se houver mais partes a seguir
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}

// =============================================================================
// WEBHOOK HANDLER PRINCIPAL
// =============================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const logContent = `\n[${new Date().toISOString()}] WEBHOOK RECEBIDO:\n${JSON.stringify(body, null, 2)}\n`;
    fs.appendFileSync("/tmp/nexus_zapi_debug.log", logContent);

    console.log(
      "\n\n[DEBUG] WEBHOOK BATEU NO NEXT! Payload Z-API:",
      JSON.stringify(body, null, 2),
    );

    // Regra: Ignorar mensagens enviadas por nós mesmos ou mensagens de grupos
    if (body.fromMe || body.isGroup) {
      console.log("Ignorando (Mensagem enviada por mim ou grupo)");
      return NextResponse.json({ status: "ignored" });
    }

    const instanceId = body.instanceId;
    const phone = body.phone;

    if (!instanceId || !phone) {
      return NextResponse.json(
        { error: "Missing instanceId or phone" },
        { status: 400 },
      );
    }

    // === DETECÇÃO DO TIPO DE MÍDIA ===
    let detectedType: "text" | "audio" | "image" | "document" | null = null;
    if (body.text?.message) detectedType = "text";
    else if (body.audio?.audioUrl) detectedType = "audio";
    else if (body.image?.imageUrl) detectedType = "image";
    else if (body.document?.documentUrl) detectedType = "document";

    if (!detectedType) {
      console.log("Tipo de mensagem não suportado, ignorando:", Object.keys(body));
      return NextResponse.json({ status: "unsupported_message_type" });
    }

    // 1. Busca o Contexto da Clínica e Tokens cruzando Z-API ID com nosso Banco
    const { data: contextData, error: contextError } = (await supabase
      .rpc("get_webhook_context", { p_zapi_instance_id: instanceId })
      .single()) as {
        data: ContextData | null;
        error: any;
      };

    if (contextError || !contextData) {
      console.error("Error fetching context:", contextError);
      return NextResponse.json(
        { error: "Instance or Clinic not found in our Database" },
        { status: 404 },
      );
    }

    // --- AUTO-CADASTRO DE PACIENTE (LEAD) ---
    const { data: patientId, error: patientRpcError } = await supabase
      .rpc("get_or_create_patient", {
        p_clinic_id: contextData.clinic_id,
        p_phone_number: phone,
      });

    if (patientRpcError) {
      console.error("[RPC ERROR] Falha ao criar/buscar paciente:", patientRpcError);
    }

    // ==========================================
    // DEDUPLICAÇÃO DE MENSAGENS (RETRY DA Z-API)
    // ==========================================
    let userMessageText = "";
    if (detectedType === "text") {
      userMessageText = body.text.message;
      const timeAgo = new Date(Date.now() - 15000).toISOString();
      const { data: dupes } = await supabase
        .from("messages")
        .select("id")
        .eq("instance_id", contextData.instance_uuid)
        .eq("phone_number", phone)
        .eq("role", "user")
        .ilike("content", `%${userMessageText.trim()}%`)
        .gte("created_at", timeAgo)
        .limit(1);

      if (dupes && dupes.length > 0) {
        console.log(
          `[DEDUPLICAÇÃO] Ignorando webhook repetido da Z-API para: ${userMessageText.substring(0, 30)}...`,
        );
        return NextResponse.json({ status: "ignored_duplicate" });
      }
    }

    // === CANCELAMENTO AUTOMÁTICO DE FOLLOW-UPS ===
    if (patientId) {
      await supabase.rpc("cancel_pending_follow_ups", { p_patient_id: patientId });
      console.log(`[FOLLOW-UP] Pendentes cancelados para ${phone} pois o paciente respondeu.`);
    }

    const fetchHeaders: any = { "Content-Type": "application/json" };
    if (contextData.client_token) {
      fetchHeaders["Client-Token"] = contextData.client_token;
    }

    // ==========================================
    // HUMANIZAÇÃO — PAUSA + VISTO AZUL
    // ==========================================
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (body.messageId) {
      try {
        const readUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/read-message`;
        await fetch(readUrl, {
          method: "POST",
          headers: fetchHeaders,
          body: JSON.stringify({ phone: phone, messageId: body.messageId }),
        });
      } catch (e) {
        console.error("Falha ao tentar dar os Blue Ticks na Z-API:", e);
      }
    }

    // === PROCESSAMENTO DE MÍDIA ===
    let userMessage: string;
    let mediaType: "text" | "audio" | "image" | "document" = detectedType;
    let mediaUrl: string | null = null;

    switch (detectedType) {
      case "text":
        userMessage = body.text.message;
        break;

      case "audio":
        mediaUrl = body.audio.audioUrl;
        try {
          userMessage = await transcribeAudio(body.audio.audioUrl, getOpenAIDirectClient());
          console.log(`[AUDIO] Transcrito (${body.audio.seconds}s): "${userMessage}"`);
        } catch (err) {
          console.error("[AUDIO] Falha na transcrição:", err);
          userMessage = "[Paciente enviou um áudio que não pôde ser transcrito]";
        }
        break;

      case "image":
        mediaUrl = body.image.imageUrl;
        try {
          const imageDescription = await describeImage(
            body.image.imageUrl,
            openai,
            body.image.caption,
          );
          userMessage = body.image.caption
            ? `[Imagem enviada pelo paciente: ${imageDescription}. Legenda: "${body.image.caption}"]`
            : `[Imagem enviada pelo paciente: ${imageDescription}]`;
          console.log(`[IMAGEM] Descrita: "${userMessage}"`);
        } catch (err) {
          console.error("[IMAGEM] Falha na descrição:", err);
          userMessage = body.image.caption
            ? `[Paciente enviou uma imagem com legenda: "${body.image.caption}"]`
            : "[Paciente enviou uma imagem]";
        }
        break;

      case "document":
        mediaUrl = body.document.documentUrl;
        const fileName = body.document.fileName || "documento";
        userMessage = `[Paciente enviou um documento: "${fileName}"]`;
        console.log(`[DOCUMENTO] Recebido: ${fileName}`);
        break;

      default:
        return NextResponse.json({ status: "unsupported" });
    }

    // Salva a mensagem do usuário no histórico
    await supabase.from("messages").insert({
      instance_id: contextData.instance_uuid,
      phone_number: phone,
      role: "user",
      content: userMessage,
      media_type: mediaType,
      media_url: mediaUrl,
    });

    // === GATE: IA PAUSADA? (Secretária assumiu o controle) ===
    if (patientId) {
      const { data: aiPaused } = await supabase.rpc("check_ai_paused", {
        p_patient_id: patientId,
      });
      if (aiPaused === true) {
        console.log(`[IA PAUSADA] Secretária no controle para ${phone}. Mensagem salva, IA não responde.`);
        return NextResponse.json({ status: "ai_paused" });
      }
    }

    // ==========================================
    // BUFFER DE MENSAGENS (DEBOUNCE)
    // ==========================================
    // Áudio, imagem e documento: resposta IMEDIATA, sem buffer.
    // São mensagens completas por natureza — a pessoa não vai complementar em seguida.
    if (detectedType !== "text") {
      console.log(`[BUFFER] Mídia (${detectedType}) de ${phone}. Processando imediatamente, sem buffer.`);
      after(async () => {
        try {
          await runAIPipeline(
            phone,
            instanceId,
            userMessage,
            patientId,
            contextData,
            fetchHeaders,
            body.messageId ?? null,
          );
        } catch (err) {
          console.error("[PIPELINE] Erro ao processar mídia:", err);
        }
      });
      return NextResponse.json({ status: "processing_immediate_media" });
    }

    // Texto: verifica se é paciente recorrente (tem histórico de mensagens)
    const { count: messageCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", contextData.instance_uuid)
      .eq("phone_number", phone)
      .eq("role", "user");

    const isReturningPatient = (messageCount ?? 0) > 1; // > 1 pois já salvamos a mensagem atual

    // === TRANSIÇÃO AUTOMÁTICA: EM_ATENDIMENTO ===
    if (isReturningPatient && patientId) {
      // Só promove para EM_ATENDIMENTO se ainda estiver como NOVO
      await supabase
        .from("patients")
        .update({ lead_status: "EM_ATENDIMENTO" })
        .eq("id", patientId)
        .eq("lead_status", "NOVO");
      console.log(`[LEAD STATUS] ${phone} → EM_ATENDIMENTO (paciente recorrente)`);
    }

    if (!isReturningPatient) {
      // PRIMEIRO CONTATO: responde imediatamente, sem buffer
      console.log(`[BUFFER] Primeiro contato de ${phone}. Processando imediatamente.`);
      after(async () => {
        try {
          await runAIPipeline(
            phone,
            instanceId,
            userMessage,
            patientId,
            contextData,
            fetchHeaders,
            body.messageId ?? null,
          );
        } catch (err) {
          console.error("[PIPELINE] Erro no primeiro contato:", err);
        }
      });

      return NextResponse.json({ status: "processing_immediate" });
    }

    // PACIENTE RECORRENTE: aplica o buffer de 20 segundos
    console.log(`[BUFFER] Paciente recorrente ${phone}. Aplicando buffer de ${BUFFER_WINDOW_MS / 1000}s.`);

    const { bufferId, updatedAt: myUpdatedAt } = await upsertMessageBuffer(
      phone,
      contextData.instance_uuid,
      instanceId,
      patientId,
      { content: userMessage, mediaType, mediaUrl },
    );

    // Retorna 200 imediatamente para a Z-API
    // e agenda o processamento em background após o buffer expirar
    after(async () => {
      try {
        // Aguarda o tempo do buffer
        await new Promise((resolve) => setTimeout(resolve, BUFFER_WINDOW_MS));

        // Verifica se este ainda é o "processador válido":
        // Se updated_at mudou, significa que uma nova mensagem chegou depois de nós
        // e o timer daquela mensagem será o responsável pelo processamento.
        const { data: bufferRecord } = await supabase
          .from("message_buffer")
          .select("messages, updated_at, is_processed")
          .eq("id", bufferId)
          .single();

        if (!bufferRecord) {
          console.log(`[BUFFER] Buffer ${bufferId} não encontrado. Abandonando.`);
          return;
        }
        if (bufferRecord.is_processed) {
          console.log(`[BUFFER] Buffer ${bufferId} já processado. Abandonando.`);
          return;
        }
        const dbTime = new Date(bufferRecord.updated_at).getTime();
        const myTime = new Date(myUpdatedAt).getTime();
        if (dbTime !== myTime) {
          console.log(
            `[BUFFER] Buffer ${bufferId} foi atualizado por mensagem mais recente (db=${bufferRecord.updated_at} [${dbTime}] != my=${myUpdatedAt} [${myTime}]). Abandonando — outro timer processará.`,
          );
          return;
        }

        // Somos o último timer válido! Processa.
        console.log(
          `[BUFFER] Buffer ${bufferId} pronto. Processando ${bufferRecord.messages.length} mensagem(s) agrupada(s).`,
        );

        // Marca como processado ANTES de chamar a IA (evita duplo processamento)
        await supabase
          .from("message_buffer")
          .update({ is_processed: true })
          .eq("id", bufferId);

        // Concatena todas as mensagens do buffer em uma única string
        const bufferedMessages: Array<{ content: string; mediaType: string }> =
          bufferRecord.messages;

        const combinedMessage =
          bufferedMessages.length === 1
            ? bufferedMessages[0].content
            : bufferedMessages
              .map((m, i) => `[Mensagem ${i + 1}]: ${m.content}`)
              .join("\n");

        console.log(`[BUFFER] Mensagem combinada: "${combinedMessage}"`);

        await runAIPipeline(
          phone,
          instanceId,
          combinedMessage,
          patientId,
          contextData,
          fetchHeaders,
        );
      } catch (err) {
        console.error(`[BUFFER] Erro ao processar buffer ${bufferId}:`, err);
      }
    });

    return NextResponse.json({
      status: "buffered",
      buffer_id: bufferId,
      process_after_ms: BUFFER_WINDOW_MS,
    });
  } catch (error) {
    console.error("Webhook Mestre - Falha Crítica:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
