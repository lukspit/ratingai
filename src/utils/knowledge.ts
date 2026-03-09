import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

const embeddingClient = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

/**
 * Gera embedding de um texto usando text-embedding-3-small via OpenRouter.
 */
export async function embedText(text: string): Promise<number[]> {
    const response = await embeddingClient.embeddings.create({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000), // limite de segurança
    });
    return response.data[0].embedding;
}

/**
 * Busca os chunks mais relevantes da base de conhecimento para uma dada query.
 * Retorna os chunks concatenados como string, prontos para injetar no prompt.
 */
export async function searchKnowledge(query: string, k = 5): Promise<string> {
    try {
        const queryEmbedding = await embedText(query);
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('search_knowledge', {
            query_embedding: queryEmbedding,
            match_count: k,
        });

        if (error) {
            console.error('[RAG] Erro na busca:', error.message);
            return '';
        }

        if (!data || data.length === 0) {
            return '';
        }

        return (data as Array<{ source: string; title: string; content: string; similarity: number }>)
            .map((chunk) => `[${chunk.source}${chunk.title ? ` — ${chunk.title}` : ''}]\n${chunk.content}`)
            .join('\n\n---\n\n');
    } catch (err) {
        console.error('[RAG] Falha ao buscar conhecimento:', err);
        return '';
    }
}
