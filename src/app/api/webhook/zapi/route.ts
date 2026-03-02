import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "fs";
import { google } from "googleapis";

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
} from "@/lib/ai-helpers";
import { checkAvailability, bookAppointment } from "@/lib/calendar";

// -------------------------------------------------------------

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
      console.log(
        "Tipo de mensagem não suportado, ignorando:",
        Object.keys(body),
      );
      return NextResponse.json({ status: "unsupported_message_type" });
    }

    // 1. Busca o Contexto da Clínica e Tokens cruzando Z-API ID com nosso Banco
    const { data: contextData, error: contextError } = (await supabase
      .rpc("get_webhook_context", { p_zapi_instance_id: instanceId })
      .single()) as {
        data: {
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
        } | null;
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
    // Chama o RPC (Security Definer) para bypassar o RLS usando a Anon Key
    const { data: patientId, error: patientRpcError } = await supabase
      .rpc('get_or_create_patient', {
        p_clinic_id: contextData.clinic_id,
        p_phone_number: phone
      });

    if (patientRpcError) {
      console.error("[RPC ERROR] Falha ao criar/buscar paciente:", patientRpcError);
    }
    // ----------------------------------------


    // ==========================================
    // DEDUPLICAÇÃO DE MENSAGENS (RETRY DA Z-API)
    // O timeout curto da Z-API causa reenvios se LLM atrasar.
    // Movido ANTES de processar Media e Buscar Paciente.
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
    // Se o paciente mandou QUALQUER coisa, cancelamos o follow-up pendente pois a conversa fluiu.
    if (patientId) {
      await supabase.rpc('cancel_pending_follow_ups', { p_patient_id: patientId });
      console.log(`[FOLLOW-UP] Pendentes cancelados para ${phone} pois o paciente respondeu.`);
    }
    // ==========================================

    const fetchHeaders: any = { "Content-Type": "application/json" };
    if (contextData.client_token) {
      fetchHeaders["Client-Token"] = contextData.client_token;
    }

    // ==========================================
    // HUMANIZAÇÃO - ESTÁGIO 1 & 2 (Pausa e Visto Azul)
    // ==========================================
    // Delay proposital de 1.5s simulando humano "abrindo o Whatsapp"
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (body.messageId) {
      try {
        const readUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/read-message`;
        await fetch(readUrl, {
          method: "POST",
          headers: fetchHeaders,
          body: JSON.stringify({
            phone: phone,
            messageId: body.messageId,
          }),
        });
      } catch (e) {
        console.error("Falha ao tentar dar os Blue Ticks na Z-API:", e);
      }
    }
    // ==========================================

    // === PROCESSAMENTO DE MÍDIA (após blue ticks, durante "tempo de pensamento") ===
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
          console.log(
            `[AUDIO] Transcrito (${body.audio.seconds}s): "${userMessage}"`,
          );
        } catch (err) {
          console.error("[AUDIO] Falha na transcrição:", err);
          userMessage =
            "[Paciente enviou um áudio que não pôde ser transcrito]";
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

    // 2. Resgata a Memória (Histórico) das últimas 30 mensagens desse paciente
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

    // Se tiver mais de 20 mensagens, sumariza as mais antigas e mantém as 20 recentes
    let conversationSummary: string | null = null;
    let recentMessages = allMessages;

    if (allMessages.length > 20) {
      const olderMessages = allMessages.slice(0, allMessages.length - 20);
      recentMessages = allMessages.slice(allMessages.length - 20);
      try {
        conversationSummary = await summarizeOlderMessages(olderMessages, openai);
        console.log(
          `[SUMÁRIO] ${olderMessages.length} mensagens antigas sumarizadas`,
        );
      } catch (err) {
        console.error("[SUMÁRIO] Falha ao sumarizar:", err);
      }
    }

    // 3. Salva a nova mensagem recebida no banco para histórico
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
      const { data: aiPaused } = await supabase.rpc('check_ai_paused', { p_patient_id: patientId });
      if (aiPaused === true) {
        console.log(`[IA PAUSADA] Secretária no controle para ${phone}. Mensagem salva, IA não responde.`);
        return NextResponse.json({ status: "ai_paused" });
      }
    }

    // 4. Constrói o Cérebro V2 (System Prompt) injetando o contexto dinâmico da clínica
    const { greeting, datetime } = getBrazilianGreeting();
    const isReturning = allMessages.length > 0;

    const hasCalendarTools = !!(
      contextData.google_access_token && contextData.google_calendar_id
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
    });

    // 5. Monta o array de mensagens para o LLM
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
            },
            required: ["date"],
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
            },
            required: ["patient_name", "start_time", "end_time"],
          },
        },
      });
    }

    // 6. Chamada de Inferência (LLM via OpenRouter)
    const payload: any = {
      model: "google/gemini-2.5-flash",
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

    // Process function calls
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

        console.log(
          `[TOOLS] IA chamou "${funcName}" com argumentos:`,
          funcArgs,
        );

        if (funcName === "check_availability") {
          const args = JSON.parse(funcArgs);
          try {
            const busySlots = await checkAvailability(
              {
                accessToken: contextData.google_access_token as string,
                refreshToken: contextData.google_refresh_token as string,
                clinicId: contextData.clinic_id
              },
              contextData.google_calendar_id as string,
              args.date
            );

            console.log(
              `[CALENDAR] Encontrados ${busySlots.length} slots ocupados.`,
            );
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ occupied_slots: busySlots }),
            });
          } catch (e: any) {
            console.error(
              "[CALENDAR ERROR] Falha no check_availability:",
              e.message,
            );
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: e.message }),
            });
          }
        } else if (funcName === "book_appointment") {
          const args = JSON.parse(funcArgs);
          try {
            const result = await bookAppointment(
              {
                accessToken: contextData.google_access_token as string,
                refreshToken: contextData.google_refresh_token as string,
                clinicId: contextData.clinic_id
              },
              contextData.google_calendar_id as string,
              args.patient_name,
              phone,
              args.start_time,
              args.end_time
            );
            const { isoStart, isoEnd } = result;

            console.log(
              `[CALENDAR] Sucesso ao agendar para: ${args.patient_name} às ${isoStart}`,
            );

            // Atualiza no banco chamando RPCs para bypassar RLS
            if (patientId) {
              const { error: apptError } = await supabase.rpc('insert_appointment', {
                p_clinic_id: contextData.clinic_id,
                p_patient_id: patientId,
                p_scheduled_at: isoStart,
                p_status: "CONFIRMED"
              });

              if (apptError) {
                console.error("[RPC ERROR] Falha ao inserir agendamento:", apptError);
              } else {
                console.log(`[SUPABASE] Agendamento salvo com sucesso para patient_id: ${patientId}`);
              }

              const { error: updError } = await supabase.rpc('update_patient_info', {
                p_patient_id: patientId,
                p_name: args.patient_name,
                p_status: "AGENDADO"
              });

              if (updError) console.error("[RPC ERROR] Falha ao atualizar paciente:", updError);

              // === AGENDAMENTO DE LEMBRETES (24H e 2H) ===
              const reminder24h = new Date(new Date(isoStart).getTime() - 24 * 60 * 60 * 1000);
              const reminder2h = new Date(new Date(isoStart).getTime() - 2 * 60 * 60 * 1000);
              const now = new Date();
              if (reminder24h > now) {
                await supabase.from("scheduled_messages").insert({
                  clinic_id: contextData.clinic_id,
                  patient_id: patientId,
                  instance_id: contextData.instance_uuid,
                  phone_number: phone,
                  type: 'REMINDER_24H',
                  scheduled_for: reminder24h.toISOString(),
                });
              }
              if (reminder2h > now) {
                await supabase.from("scheduled_messages").insert({
                  clinic_id: contextData.clinic_id,
                  patient_id: patientId,
                  instance_id: contextData.instance_uuid,
                  phone_number: phone,
                  type: 'CONFIRMATION_2H',
                  scheduled_for: reminder2h.toISOString(),
                });
              }
            } else {
              console.error(`[APPT ERRO CRÍTICO] Google Calendar agendou com sucesso mas patientId é null! Agendamento de ${args.patient_name} às ${isoStart} NÃO foi salvo no Supabase.`);
            }

            // SEMPRE retornar resultado para o LLM (protocolo de tool calling exige resposta para toda tool chamada)
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: true,
                message: "A consulta foi agendada com sucesso no Google Calendar e registrada em nosso sistema.",
              }),
            });
          } catch (e: any) {
            console.error(
              "[CALENDAR ERROR] Falha no book_appointment:",
              e.message,
            );
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: e.message }),
            });
          }
        } else if (funcName === "react_to_message") {
          const args = JSON.parse(funcArgs);
          try {
            if (body.messageId) {
              const reactUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-reaction`;
              await fetch(reactUrl, {
                method: "POST",
                headers: fetchHeaders,
                body: JSON.stringify({
                  phone: phone,
                  messageId: body.messageId,
                  reaction: args.emoji,
                }),
              });
              console.log(
                `[REAÇÃO] IA reagiu com ${args.emoji} à mensagem ${body.messageId}`,
              );
              messagesForLLM.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  success: `Reagiu com sucesso com o emoji ${args.emoji}`,
                }),
              });
            } else {
              messagesForLLM.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  error: "Nenhum messageId disponível para reagir.",
                }),
              });
            }
          } catch (e: any) {
            console.error("[REAÇÃO] Erro ao enviar a reação:", e);
            messagesForLLM.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: `Falha ao reagir: ${e.message}`,
              }),
            });
          }
        }
      }

      // Segunda chamada para gerar a resposta final ao usuário
      completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: messagesForLLM as any,
        temperature: 0.7,
        max_tokens: 1024,
      });
      let finalMessage = completion.choices[0].message;

      // Build pseudo-memory of tools called to persist
      let memoryString = `[MEMÓRIA DE SISTEMA: Usei ferramentas nesta rodada. ${aiMessage.tool_calls.map((t: any) => t.function.name).join(", ")}]`;
      const toolResults = messagesForLLM.filter((m) => m.role === "tool");
      if (toolResults.length > 0) {
        memoryString += `\nResultados obtidos da agenda: ${toolResults.map((t) => t.content).join(" | ")}`;
      }

      aiMessage.content = finalMessage.content || "...";
      const textToSave = `${memoryString}\n\n${aiMessage.content}`;

      await supabase.from("messages").insert({
        instance_id: contextData.instance_uuid,
        phone_number: phone,
        role: "assistant",
        content: textToSave,
      });

      aiResponse = aiMessage.content;
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

    // === AGENDAMENTO DE NOVO FOLLOW-UP ===
    if (patientId && aiResponse && aiResponse !== "...") {
      const followUpTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await supabase.rpc('upsert_follow_up', {
        p_clinic_id: contextData.clinic_id,
        p_patient_id: patientId,
        p_instance_id: contextData.instance_uuid,
        p_phone_number: phone,
        p_scheduled_for: followUpTime
      });
      console.log(`[FOLLOW-UP] Agendado para ${followUpTime} (daqui a 2h)`);
    }

    // 8. Envia a Resposta Final
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${contextData.zapi_token}/send-text`;
    const chunks = chunkMessage(aiResponse);
    let accumulatedDelayMessage = 0;

    const dispatchPromises = chunks.map((chunk, index) => {
      const typingDelay = Math.max(2, Math.min(15, Math.ceil(chunk.length / 15)));
      const payload = {
        phone: phone,
        message: chunk,
        delayMessage: accumulatedDelayMessage,
        delayTyping: typingDelay,
      };
      accumulatedDelayMessage += typingDelay + 1;

      return fetch(zapiUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(payload),
      });
    });

    await Promise.all(dispatchPromises);

    return NextResponse.json({ success: true, ai_response_length: aiResponse.length });

  } catch (error) {
    console.error("Webhook Mestre - Falha Crítica:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
