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
    {
    { type: 'ebook_capag', file: 'E-BOOK-CAPAG-25-05.txt', chunkSize: 1500, overlap: 200 },
    { type: 'ebook_transacao', file: 'E-BOOK-MANUAL-DAS-TRANSAÇÕES-TRIBUTÁRIAS.txt', chunkSize: 1500, overlap: 200 },
    { type: 'portaria_6757', file: 'portaria-pgfn-6757-2022.txt', chunkSize: 1500, overlap: 200 },
    { type: 'metodologia_capag', file: 'metodologia-capag-e.txt', chunkSize: 1500, overlap: 200 },
    { type: 'normas_cpc_jurisprudencia', file: 'normas-cpc-jurisprudencia.txt', chunkSize: 1500, overlap: 200 },
    { type: 'estrategias_defesa', file: 'estrategias-defesa-tributarista.txt', chunkSize: 1500, overlap: 200 },
    { type: 'editais_pgdau', file: 'editais-pgdau-2024-2025.txt', chunkSize: 1500, overlap: 200 },
    { type: 'nbc_tp_01', file: 'nbc-tp-01-laudos-periciais.txt', chunkSize: 1500, overlap: 200 },
    { type: 'ebitda_ajustado', file: 'ebitda-ajustado-vs-reportado.txt', chunkSize: 1500, overlap: 200 },
    { type: 'analise_dfc', file: 'analise-dfc-fco-capag.txt', chunkSize: 1500, overlap: 200 }
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
