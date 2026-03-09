/**
 * POST /api/admin/seed-knowledge
 *
 * Endpoint para ingestão única da base de conhecimento jurídico-contábil.
 * Lê os ebooks de referência, chunka o texto, gera embeddings e salva no Supabase.
 *
 * Chamada via: fetch('/api/admin/seed-knowledge', { method: 'POST', body: JSON.stringify({ secret: '...' }) })
 * Protegido por SEED_SECRET (definir no .env.local).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { embedText } from '@/utils/knowledge';
import * as fs from 'fs';
import * as path from 'path';

const CHUNK_SIZE = 1800;  // chars (~450 tokens)
const CHUNK_OVERLAP = 300; // chars

function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + size, text.length);
        const chunk = text.slice(start, end).trim();
        if (chunk.length > 100) chunks.push(chunk);
        start += size - overlap;
    }
    return chunks;
}

const KNOWLEDGE_SOURCES = [
    {
        source: 'ebook_capag',
        title: 'Desvendando a Caixa-Preta do CAPAG',
        file: 'desvendando-a-caixa-preta-da-capag.pdf.txt',
    },
    {
        source: 'ebook_transacao',
        title: 'Ebook — Transação Tributária',
        file: 'Ebook - Transação Tributária.pdf.txt',
    },
];

export async function POST(req: Request) {
    try {
        const { secret } = await req.json().catch(() => ({ secret: '' }));

        if (secret !== process.env.SEED_SECRET) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const supabase = await createClient();
        const projectRoot = process.cwd();
        const results: Record<string, number> = {};

        for (const source of KNOWLEDGE_SOURCES) {
            const filePath = path.join(projectRoot, source.file);

            if (!fs.existsSync(filePath)) {
                console.warn(`[SEED] Arquivo não encontrado: ${filePath}`);
                results[source.source] = 0;
                continue;
            }

            const text = fs.readFileSync(filePath, 'utf-8');
            const chunks = chunkText(text);
            console.log(`[SEED] ${source.source}: ${chunks.length} chunks`);

            // Limpa chunks antigos da mesma source antes de reinserir
            await supabase.from('knowledge_chunks').delete().eq('source', source.source);

            let inserted = 0;
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                try {
                    const embedding = await embedText(chunk);
                    await supabase.from('knowledge_chunks').insert({
                        source: source.source,
                        title: `${source.title} — parte ${i + 1}`,
                        content: chunk,
                        embedding,
                    });
                    inserted++;

                    // Log a cada 10 chunks
                    if (inserted % 10 === 0) {
                        console.log(`[SEED] ${source.source}: ${inserted}/${chunks.length} inseridos`);
                    }
                } catch (err) {
                    console.error(`[SEED] Erro no chunk ${i} de ${source.source}:`, err);
                }
            }

            results[source.source] = inserted;
        }

        const total = Object.values(results).reduce((a, b) => a + b, 0);
        console.log(`[SEED] Concluído. Total: ${total} chunks`);

        return NextResponse.json({ success: true, results, total });

    } catch (error: any) {
        console.error('[SEED] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
