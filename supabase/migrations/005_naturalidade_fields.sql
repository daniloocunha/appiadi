-- Adiciona campos de naturalidade (cidade e UF de nascimento) nas tabelas de membros
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS naturalidade TEXT,
  ADD COLUMN IF NOT EXISTS naturalidade_uf TEXT;

ALTER TABLE self_registrations
  ADD COLUMN IF NOT EXISTS naturalidade TEXT,
  ADD COLUMN IF NOT EXISTS naturalidade_uf TEXT;
