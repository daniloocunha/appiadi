-- ============================================================
-- IADI - Novos campos em members e self_registrations
-- Aplicar no Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ---- Tabela: members ----

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS escolaridade               TEXT,
  ADD COLUMN IF NOT EXISTS titulo_eleitor             TEXT,
  ADD COLUMN IF NOT EXISTS zona_eleitoral             TEXT,
  ADD COLUMN IF NOT EXISTS secao_eleitoral            TEXT,
  ADD COLUMN IF NOT EXISTS batismo_pastor             TEXT,
  ADD COLUMN IF NOT EXISTS batismo_local              TEXT,
  ADD COLUMN IF NOT EXISTS recebeu_carta_transferencia BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_carta_transferencia   DATE,
  ADD COLUMN IF NOT EXISTS denominacao_origem         TEXT;

-- ---- Tabela: self_registrations ----

ALTER TABLE self_registrations
  ADD COLUMN IF NOT EXISTS escolaridade    TEXT,
  ADD COLUMN IF NOT EXISTS titulo_eleitor  TEXT,
  ADD COLUMN IF NOT EXISTS zona_eleitoral  TEXT,
  ADD COLUMN IF NOT EXISTS secao_eleitoral TEXT,
  ADD COLUMN IF NOT EXISTS baptism_date    DATE,
  ADD COLUMN IF NOT EXISTS holy_spirit_date DATE,
  ADD COLUMN IF NOT EXISTS batismo_pastor  TEXT,
  ADD COLUMN IF NOT EXISTS batismo_local   TEXT;
