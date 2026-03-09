/**
 * POST /api/admin/add-knowledge
 *
 * Recebe itens de conhecimento já pesquisados, gera embeddings e salva no Supabase.
 * Usado por agentes de pesquisa externos para enriquecer a base de conhecimento.
 *
 * Body:
 * {
 *   secret: string,
 *   items: Array<{
 *     source: string,   // ex: 'portaria_6757' | 'jurisprudencia' | 'doutrina'
 *     title: string,    // ex: 'Art. 19 — Direito de Impugnação do CAPAG'
 *     content: string   // texto completo do trecho (máx ~2000 chars por item)
 *   }>
 * }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { embedText } from '@/utils/knowledge';

export async function POST(req: Request) {
    try {
        const { secret, items } = await req.json();

        if (secret !== process.env.SEED_SECRET) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'items deve ser um array não vazio.' }, { status: 400 });
        }

        const supabase = await createClient();
        let inserted = 0;
        const errors: string[] = [];

        for (const item of items) {
            if (!item.content || !item.source) {
                errors.push(`Item inválido: ${JSON.stringify(item).slice(0, 80)}`);
                continue;
            }

            try {
                const embedding = await embedText(item.content);
                await supabase.from('knowledge_chunks').insert({
                    source: item.source,
                    title: item.title || item.source,
                    content: item.content,
                    embedding,
                });
                inserted++;
                console.log(`[ADD-KNOWLEDGE] Inserido: ${item.title || item.source}`);
            } catch (err: any) {
                errors.push(`Erro em "${item.title}": ${err.message}`);
                console.error('[ADD-KNOWLEDGE] Erro:', err);
            }
        }

        return NextResponse.json({
            success: true,
            inserted,
            errors: errors.length > 0 ? errors : undefined,
            total_received: items.length,
        });

    } catch (error: any) {
        console.error('[ADD-KNOWLEDGE] Erro geral:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
