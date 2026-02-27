-- ============================================================
-- IADI - Schema Inicial do Banco de Dados
-- Aplicar no Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: congregations
-- Sede (is_headquarters = true) e congregações subordinadas
-- ============================================================
CREATE TABLE congregations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  neighborhood    TEXT,
  phone           TEXT,
  dirigente_id    UUID,                          -- FK para members (adicionada depois)
  is_headquarters BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ                    -- soft delete
);

-- ============================================================
-- TABELA: members
-- Membros da sede e de todas as congregações
-- ============================================================
CREATE TABLE members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             TEXT NOT NULL,
  birth_date            DATE,
  baptism_date          DATE,
  holy_spirit_date      DATE,
  father_name           TEXT,
  mother_name           TEXT,
  cpf                   TEXT,
  rg                    TEXT,
  phone                 TEXT,
  phone_secondary       TEXT,
  email                 TEXT,
  address_street        TEXT,
  address_number        TEXT,
  address_complement    TEXT,
  address_neighborhood  TEXT,
  address_city          TEXT DEFAULT 'Iaçu',
  address_state         TEXT DEFAULT 'BA',
  address_zip           TEXT,
  marital_status        TEXT CHECK (marital_status IN ('solteiro','casado','divorciado','viuvo','separado')),
  spouse_name           TEXT,
  occupation            TEXT,
  congregation_id       UUID NOT NULL REFERENCES congregations(id),
  status                TEXT NOT NULL DEFAULT 'ativo'
                        CHECK (status IN ('ativo','inativo','transferido','falecido','excluido','em_experiencia')),
  church_role           TEXT,     -- Pastor Presidente, Vice-Presidente, Presbítero, Diácono, Obreiro, etc.
  ministry              TEXT,     -- Louvor, Escola Dominical, Jovens, etc.
  photo_url             TEXT,
  notes                 TEXT,
  member_number         SERIAL,   -- ID sequencial único (aparece no crachá)
  joined_at             DATE,
  self_registered       BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at           TIMESTAMPTZ,
  approved_by           UUID REFERENCES auth.users(id),
  created_by            UUID REFERENCES auth.users(id),
  updated_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

-- Agora que members existe, adiciona FK de congregations → members
ALTER TABLE congregations
  ADD CONSTRAINT fk_congregations_dirigente
  FOREIGN KEY (dirigente_id) REFERENCES members(id)
  DEFERRABLE INITIALLY DEFERRED;

-- Índices para consultas frequentes
CREATE INDEX idx_members_congregation ON members(congregation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_members_status       ON members(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_members_birth_date   ON members(birth_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_members_full_name    ON members USING gin(to_tsvector('portuguese', full_name));

-- ============================================================
-- TABELA: events
-- Eventos e cultos no calendário
-- ============================================================
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      DATE NOT NULL,
  event_time      TIME,
  end_date        DATE,
  end_time        TIME,
  location        TEXT,
  congregation_id UUID REFERENCES congregations(id), -- NULL = todos
  event_type      TEXT NOT NULL DEFAULT 'culto'
                  CHECK (event_type IN ('culto','reuniao','conferencia','retiro','aniversario_congregacao','outro')),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_events_date ON events(event_date) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: letters
-- Histórico de cartas emitidas (nunca deletar)
-- ============================================================
CREATE TABLE letters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_type      TEXT NOT NULL CHECK (letter_type IN ('recomendacao','transferencia')),
  member_id        UUID NOT NULL REFERENCES members(id),
  destination      TEXT,       -- nome da igreja receptora (transferência)
  destination_city TEXT,
  issued_by        UUID REFERENCES auth.users(id),
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  letter_number    TEXT NOT NULL UNIQUE,  -- ex: "REC-2025-001"
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- sem deleted_at: cartas são registros permanentes
);

-- ============================================================
-- TABELA: badges
-- Histórico de crachás emitidos (nunca deletar)
-- ============================================================
CREATE TABLE badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES members(id),
  issued_by    UUID REFERENCES auth.users(id),
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  badge_number TEXT NOT NULL UNIQUE,  -- ex: "CRA-2025-001"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: self_registrations
-- Auto-cadastros enviados pelo formulário público (sem login)
-- ============================================================
CREATE TABLE self_registrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token                 UUID NOT NULL DEFAULT gen_random_uuid(), -- token do link público
  full_name             TEXT NOT NULL,
  birth_date            DATE,
  phone                 TEXT,
  email                 TEXT,
  cpf                   TEXT,
  rg                    TEXT,
  father_name           TEXT,
  mother_name           TEXT,
  address_street        TEXT,
  address_number        TEXT,
  address_complement    TEXT,
  address_neighborhood  TEXT,
  address_city          TEXT,
  address_state         TEXT DEFAULT 'BA',
  address_zip           TEXT,
  marital_status        TEXT CHECK (marital_status IN ('solteiro','casado','divorciado','viuvo','separado')),
  spouse_name           TEXT,
  occupation            TEXT,
  church_role           TEXT,
  ministry              TEXT,
  congregation_id       UUID REFERENCES congregations(id),
  photo_url             TEXT,
  status                TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','aprovado','rejeitado')),
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES auth.users(id),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_self_reg_status ON self_registrations(status);
CREATE INDEX idx_self_reg_token  ON self_registrations(token);

-- ============================================================
-- TABELA: app_users
-- Perfis de usuário do sistema (estende auth.users do Supabase)
-- ============================================================
CREATE TABLE app_users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'diacono_obreiro'
                  CHECK (role IN ('admin','secretario','lideranca_plena','presbitero','diacono_obreiro')),
  member_id       UUID REFERENCES members(id),   -- vínculo com registro de membro
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNÇÃO: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trg_congregations_updated BEFORE UPDATE ON congregations      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_members_updated       BEFORE UPDATE ON members            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated        BEFORE UPDATE ON events             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_letters_updated       BEFORE UPDATE ON letters            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_badges_updated        BEFORE UPDATE ON badges             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_self_reg_updated      BEFORE UPDATE ON self_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_app_users_updated     BEFORE UPDATE ON app_users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
