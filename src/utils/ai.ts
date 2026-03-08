import OpenAI from 'openai';

if (!process.env.OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY is not defined. AI functionality will fail.");
}

export const aiClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

export const DEFAULT_MODEL = "deepseek/deepseek-v3.2"; // DeepSeek V3.2: GPT-5 class, melhor extração JSON ($0.25/$0.40 por 1M tokens)

/**
 * Função utilitária para chamar a IA com tratamento padronizado.
 */
export async function callAI(messages: any[], isJson = false, model = DEFAULT_MODEL) {
    try {
        const response = await aiClient.chat.completions.create({
            model: model,
            messages: messages,
            response_format: isJson ? { type: "json_object" } : { type: "text" },
            temperature: 0.1, // Baixa temperatura para cálculos mais precisos
        });

        let content = response.choices[0]?.message?.content || "";

        if (isJson) {
            try {
                // Remove markdown code blocks se o modelo retornar envelopado
                content = content.trim();
                if (content.startsWith('```json')) {
                    content = content.replace(/^```json/, '');
                }
                if (content.startsWith('```')) {
                    content = content.replace(/^```/, '');
                }
                if (content.endsWith('```')) {
                    content = content.replace(/```$/, '');
                }
                content = content.trim();

                return JSON.parse(content);
            } catch (e) {
                console.error("Failed to parse JSON from AI response:", content);
                return null;
            }
        }

        return content;
    } catch (error) {
        console.error("Error calling OpenRouter:", error);
        throw error;
    }
}
