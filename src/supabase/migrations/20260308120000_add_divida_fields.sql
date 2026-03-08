-- Adiciona campos necessários para o cálculo do impacto financeiro real
ALTER TABLE tributario_analyses
  ADD COLUMN IF NOT EXISTS valor_divida_tributaria NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS modalidade_transacao TEXT;

-- Comentários para documentação
COMMENT ON COLUMN tributario_analyses.valor_divida_tributaria IS 'Valor total da dívida tributária a ser negociada com a PGFN (obrigatório para cálculo de economia em R$)';
COMMENT ON COLUMN tributario_analyses.modalidade_transacao IS 'Modalidade da transação tributária: adesao | pequeno_valor | simplificada | individual';
