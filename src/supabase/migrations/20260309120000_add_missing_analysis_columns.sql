-- Migração para adicionar colunas de resultado à tabela de análises
ALTER TABLE tributario_analyses 
  ADD COLUMN IF NOT EXISTS calc_json JSONB,
  ADD COLUMN IF NOT EXISTS report_markdown TEXT;

COMMENT ON COLUMN tributario_analyses.calc_json IS 'Dados brutos do cenário base e ajustado calculados pelo agente Calculator';
COMMENT ON COLUMN tributario_analyses.report_markdown IS 'Laudo técnico final em Markdown gerado pelo agente Builder';
