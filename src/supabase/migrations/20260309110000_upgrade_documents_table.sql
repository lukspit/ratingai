-- Migração para transformar tributario_documents em um repositório de arquivos
ALTER TABLE tributario_documents 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Atualizar política RLS para tributario_documents
DROP POLICY IF EXISTS "Users can read own documents" ON tributario_documents;

CREATE POLICY "Users can manage own documents"
    ON tributario_documents FOR ALL
    USING (auth.uid() = user_id);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_tributario_documents_user_id ON tributario_documents(user_id);
