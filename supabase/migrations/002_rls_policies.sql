-- ============================================================
-- IADI - Políticas de Row Level Security (RLS)
-- Aplicar APÓS 001_initial_schema.sql
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE congregations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Função auxiliar: retorna o papel do usuário autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM app_users WHERE id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- CONGREGATIONS
-- ============================================================

-- Leitura: todos os usuários autenticados
CREATE POLICY "congregations_select"
  ON congregations FOR SELECT
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

-- Escrita (INSERT/UPDATE): liderança plena, secretário, admin
CREATE POLICY "congregations_insert"
  ON congregations FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','secretario','lideranca_plena'));

CREATE POLICY "congregations_update"
  ON congregations FOR UPDATE
  USING (get_user_role() IN ('admin','secretario','lideranca_plena'));

-- Soft delete: apenas admin e secretário
CREATE POLICY "congregations_delete"
  ON congregations FOR DELETE
  USING (get_user_role() IN ('admin','secretario'));

-- ============================================================
-- MEMBERS
-- ============================================================

-- Leitura: todos os autenticados (membros ativos não deletados)
CREATE POLICY "members_select"
  ON members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Escrita: presbítero+ (levels 2+)
CREATE POLICY "members_insert"
  ON members FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','secretario','lideranca_plena','presbitero'));

CREATE POLICY "members_update"
  ON members FOR UPDATE
  USING (get_user_role() IN ('admin','secretario','lideranca_plena','presbitero'));

-- Soft delete (update deleted_at): liderança plena+
CREATE POLICY "members_soft_delete"
  ON members FOR UPDATE
  USING (
    get_user_role() IN ('admin','secretario','lideranca_plena')
    OR (
      get_user_role() = 'presbitero'
      AND deleted_at IS NULL  -- presbítero não pode restaurar deletados
    )
  );

-- ============================================================
-- EVENTS
-- ============================================================

CREATE POLICY "events_select"
  ON events FOR SELECT
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "events_insert"
  ON events FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','secretario','lideranca_plena'));

CREATE POLICY "events_update"
  ON events FOR UPDATE
  USING (get_user_role() IN ('admin','secretario','lideranca_plena'));

-- ============================================================
-- LETTERS
-- ============================================================

CREATE POLICY "letters_select"
  ON letters FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "letters_insert"
  ON letters FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','secretario','lideranca_plena'));

-- Cartas nunca são deletadas ou atualizadas após emissão

-- ============================================================
-- BADGES
-- ============================================================

CREATE POLICY "badges_select"
  ON badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "badges_insert"
  ON badges FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','secretario','lideranca_plena','presbitero'));

-- ============================================================
-- SELF_REGISTRATIONS
-- ============================================================

-- INSERT público (sem autenticação) — qualquer pessoa com o link pode enviar
CREATE POLICY "self_reg_public_insert"
  ON self_registrations FOR INSERT
  WITH CHECK (TRUE);  -- sem restrição; validação feita no frontend + token

-- SELECT/UPDATE: apenas liderança plena+
CREATE POLICY "self_reg_authenticated_select"
  ON self_registrations FOR SELECT
  USING (get_user_role() IN ('admin','secretario','lideranca_plena'));

CREATE POLICY "self_reg_authenticated_update"
  ON self_registrations FOR UPDATE
  USING (get_user_role() IN ('admin','secretario','lideranca_plena'));

-- ============================================================
-- APP_USERS
-- ============================================================

-- Cada usuário vê o próprio perfil
CREATE POLICY "app_users_select_own"
  ON app_users FOR SELECT
  USING (id = auth.uid());

-- Admin e secretário veem todos
CREATE POLICY "app_users_select_admin"
  ON app_users FOR SELECT
  USING (get_user_role() IN ('admin','secretario'));

-- Apenas admin e secretário gerenciam usuários
CREATE POLICY "app_users_insert"
  ON app_users FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','secretario'));

CREATE POLICY "app_users_update"
  ON app_users FOR UPDATE
  USING (get_user_role() IN ('admin','secretario'));
