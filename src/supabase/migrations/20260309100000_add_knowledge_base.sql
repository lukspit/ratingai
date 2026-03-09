-- Habilita a extensão pgvector para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de chunks da base de conhecimento jurídico-contábil
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source      TEXT NOT NULL,  -- 'ebook_capag' | 'ebook_transacao' | 'portaria_6757'
    title       TEXT,
    content     TEXT NOT NULL,
    embedding   vector(1536),   -- dimensão do text-embedding-3-small
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índice ivfflat para busca por similaridade cosseno (performance em milhares de chunks)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
    ON knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Função para busca semântica: retorna os k chunks mais similares à query embedding
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding vector(1536),
    match_count     INT DEFAULT 5
)
RETURNS TABLE (
    id      UUID,
    source  TEXT,
    title   TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE sql
AS $$
    SELECT
        kc.id,
        kc.source,
        kc.title,
        kc.content,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM knowledge_chunks kc
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
$$;
