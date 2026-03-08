import OpenAI from "openai";

export function getBrazilianGreeting(): { greeting: string; datetime: string } {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const datetime = formatter.format(now);

    // Extrair a hora em Brasília para determinar saudação
    const hourFormatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "numeric",
        hour12: false,
    });
    const brasiliaHour = parseInt(hourFormatter.format(now), 10);

    let greeting: string;
    if (brasiliaHour >= 5 && brasiliaHour < 12) {
        greeting = "Bom dia";
    } else if (brasiliaHour >= 12 && brasiliaHour < 18) {
        greeting = "Boa tarde";
    } else {
        greeting = "Boa noite";
    }

    return { greeting, datetime };
}

export async function transcribeAudio(audioUrl: string, directClient: OpenAI): Promise<string> {
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioFile = new File([audioBuffer], "audio.ogg", { type: "audio/ogg" });

    const transcription = await directClient.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "pt",
    });

    return transcription.text;
}

export async function summarizeConversation(
    messages: Array<{ role: string; content: string }>,
    openaiClient: OpenAI,
): Promise<string> {
    const transcript = messages
        .map(
            (m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`,
        )
        .join("\n");

    const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "Resuma esta conversa de suporte técnico. Seja conciso (3-5 frases). Responda em português.",
            },
            { role: "user", content: transcript },
        ],
        temperature: 0.3,
        max_tokens: 400,
    });

    return response.choices[0].message.content || "";
}
