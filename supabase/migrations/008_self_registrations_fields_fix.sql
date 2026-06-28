-- ============================================================
-- IADI - Correção: garante que self_registrations tenha TODOS os
-- campos enviados pelo formulário público de auto-cadastro.
--
-- Motivo: o formulário público falhava com
--   "Could not find the 'naturalidade' column of
--    'self_registrations' in the schema cache"
-- porque as colunas das migrations 004 e 005 não chegaram a ser
-- aplicadas à tabela self_registrations no banco de produção.
--
-- Este script é IDEMPOTENTE (ADD COLUMN IF NOT EXISTS) — pode ser
-- executado com segurança mesmo que algumas colunas já existam.
--
-- Aplicar no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ---- Tabela: self_registrations (origem do erro reportado) ----
ALTER TABLE self_registrations
  ADD COLUMN IF NOT EXISTS escolaridade     TEXT,
  ADD COLUMN IF NOT EXISTS titulo_eleitor   TEXT,
  ADD COLUMN IF NOT EXISTS zona_eleitoral   TEXT,
  ADD COLUMN IF NOT EXISTS secao_eleitoral  TEXT,
  ADD COLUMN IF NOT EXISTS baptism_date     DATE,
  ADD COLUMN IF NOT EXISTS holy_spirit_date DATE,
  ADD COLUMN IF NOT EXISTS batismo_pastor   TEXT,
  ADD COLUMN IF NOT EXISTS batismo_local    TEXT,
  ADD COLUMN IF NOT EXISTS naturalidade     TEXT,
  ADD COLUMN IF NOT EXISTS naturalidade_uf  TEXT;

-- ---- Tabela: members (usada ao aprovar um auto-cadastro) ----
-- Reaplica por segurança — evita o mesmo erro na hora da aprovação.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS escolaridade                TEXT,
  ADD COLUMN IF NOT EXISTS titulo_eleitor              TEXT,
  ADD COLUMN IF NOT EXISTS zona_eleitoral              TEXT,
  ADD COLUMN IF NOT EXISTS secao_eleitoral             TEXT,
  ADD COLUMN IF NOT EXISTS batismo_pastor              TEXT,
  ADD COLUMN IF NOT EXISTS batismo_local               TEXT,
  ADD COLUMN IF NOT EXISTS naturalidade                TEXT,
  ADD COLUMN IF NOT EXISTS naturalidade_uf             TEXT,
  ADD COLUMN IF NOT EXISTS recebeu_carta_transferencia BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_carta_transferencia    DATE,
  ADD COLUMN IF NOT EXISTS denominacao_origem          TEXT;

-- Força o PostgREST a recarregar o cache de schema. Sem isso, o erro
-- "schema cache" pode persistir por alguns minutos mesmo após criar as colunas.
NOTIFY pgrst, 'reload schema';
