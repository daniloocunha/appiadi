-- ============================================================
-- 006_performance_indexes.sql
-- Índices parciais para melhorar performance de queries
-- que filtram por deleted_at IS NULL (soft delete pattern).
--
-- Executar no Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- members: busca de membros ativos (a query mais frequente)
CREATE INDEX IF NOT EXISTS idx_members_not_deleted
  ON members (full_name, updated_at DESC)
  WHERE deleted_at IS NULL;

-- members: filtro por congregation_id (lista de membros por congregação)
CREATE INDEX IF NOT EXISTS idx_members_congregation_active
  ON members (congregation_id, status)
  WHERE deleted_at IS NULL;

-- congregations: listagem de congregações ativas
CREATE INDEX IF NOT EXISTS idx_congregations_not_deleted
  ON congregations (name)
  WHERE deleted_at IS NULL;

-- Pull incremental: updated_at é usado em todas as tabelas para delta sync
-- Esses índices aceleram o .gt('updated_at', since) do pullFromSupabase()
CREATE INDEX IF NOT EXISTS idx_members_updated_at
  ON members (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_congregations_updated_at
  ON congregations (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_updated_at
  ON events (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_self_registrations_updated_at
  ON self_registrations (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_letters_updated_at
  ON letters (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_badges_updated_at
  ON badges (updated_at DESC);
