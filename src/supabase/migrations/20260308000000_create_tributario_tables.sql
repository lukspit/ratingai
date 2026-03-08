-- Migração: Tabelas do sistema Rating.ai (Tributário)
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Perfis dos usuários
CREATE TABLE IF NOT EXISTS tributario_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Análises de CAPAG
CREATE TABLE IF NOT EXISTS tributario_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL DEFAULT 'Empresa Em Análise',
    cnpj_target TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | error
    original_rating TEXT,         -- A, B, C ou D
    simulated_rating TEXT,        -- rating após ajustes estratégicos
    potential_discount_percentage NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Documentos e dados extraídos pelos agentes
CREATE TABLE IF NOT EXISTS tributario_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES tributario_analyses(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- TEXT_COMBINED | REPORT_MARKDOWN
    extracted_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ajustes contábeis sugeridos pelo agente Strategist
CREATE TABLE IF NOT EXISTS tributario_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES tributario_analyses(id) ON DELETE CASCADE,
    description TEXT,
    original_value NUMERIC(15, 2) DEFAULT 0,
    adjusted_value NUMERIC(15, 2) DEFAULT 0,
    category TEXT DEFAULT 'GERAL', -- DRE | BALANÇO | GERAL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tributario_analyses_user_id ON tributario_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_tributario_documents_analysis_id ON tributario_documents(analysis_id);
CREATE INDEX IF NOT EXISTS idx_tributario_adjustments_analysis_id ON tributario_adjustments(analysis_id);

-- RLS: habilitar Row Level Security
ALTER TABLE tributario_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tributario_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tributario_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tributario_adjustments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuário só vê seus próprios dados
CREATE POLICY "Users can manage own profile"
    ON tributario_profiles FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users can manage own analyses"
    ON tributario_analyses FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can read own documents"
    ON tributario_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tributario_analyses
            WHERE tributario_analyses.id = tributario_documents.analysis_id
            AND tributario_analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read own adjustments"
    ON tributario_adjustments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tributario_analyses
            WHERE tributario_analyses.id = tributario_adjustments.analysis_id
            AND tributario_analyses.user_id = auth.uid()
        )
    );

-- Trigger: atualiza updated_at automaticamente nas analyses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tributario_analyses_updated_at
    BEFORE UPDATE ON tributario_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
