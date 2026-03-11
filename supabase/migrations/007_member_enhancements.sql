-- ============================================================
-- 007 — Member Enhancements
-- Adiciona: vinculação usuário↔membro, novos papéis (pastor, mídia),
--           múltiplos ministérios, flag de dirigente de congregação
-- ============================================================

-- 1. Vinculação usuário ↔ membro
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES members(id) ON DELETE SET NULL;

-- 2. Novos papéis: pastor e mídia
--    Manter lideranca_plena para não afetar usuários existentes
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('admin','secretario','lideranca_plena','pastor','presbitero','diacono_obreiro','midia'));

-- 3. Múltiplos ministérios
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS ministries text[] NOT NULL DEFAULT '{}';

-- Migra dados existentes do campo ministry para o array
UPDATE members
  SET ministries = ARRAY[ministry]
  WHERE ministry IS NOT NULL AND ministry <> '' AND ministries = '{}';

ALTER TABLE self_registrations
  ADD COLUMN IF NOT EXISTS ministries text[] NOT NULL DEFAULT '{}';

UPDATE self_registrations
  SET ministries = ARRAY[ministry]
  WHERE ministry IS NOT NULL AND ministry <> '' AND ministries = '{}';

-- 4. Flag de dirigente de congregação
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS is_congregation_leader boolean NOT NULL DEFAULT false;

ALTER TABLE self_registrations
  ADD COLUMN IF NOT EXISTS is_congregation_leader boolean NOT NULL DEFAULT false;
