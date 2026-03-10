-- Migration: Fix tributario_documents schema
-- Problema: tabela foi criada com schema antigo (extracted_data JSONB)
-- O código novo tenta inserir: user_id, file_name, file_path, file_type, file_size
-- Solução: recriar a tabela com o schema correto

-- 1. Remover tabela antiga (e dependências em cascade)
DROP TABLE IF EXISTS tributario_documents CASCADE;

-- 2. Recriar com o schema correto
CREATE TABLE tributario_documents (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id  UUID        REFERENCES tributario_analyses(id) ON DELETE SET NULL,
    user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT       NOT NULL DEFAULT 'UPLOADED_PDF',
    file_name    TEXT        NOT NULL,
    file_path    TEXT        NOT NULL,
    file_type    TEXT,
    file_size    BIGINT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX idx_tributario_documents_user_id     ON tributario_documents(user_id);
CREATE INDEX idx_tributario_documents_analysis_id ON tributario_documents(analysis_id);

-- 4. Habilitar RLS
ALTER TABLE tributario_documents ENABLE ROW LEVEL SECURITY;

-- 5. Policy: o usuário vê e gerencia apenas seus próprios documentos
--    (funciona tanto para uploads avulsos quanto para documentos de análises)
CREATE POLICY "Users can manage own documents"
    ON tributario_documents FOR ALL
    USING (auth.uid() = user_id);
