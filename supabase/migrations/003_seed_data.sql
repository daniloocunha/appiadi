-- ============================================================
-- IADI - Dados iniciais (seed)
-- Aplicar APÓS 002_rls_policies.sql
-- ============================================================

-- Inserir a sede principal (IADI)
-- Este registro é criado sem dirigente pois o Pastor Presidente
-- será cadastrado depois como membro.
INSERT INTO congregations (id, name, address, city, neighborhood, is_headquarters)
VALUES (
  gen_random_uuid(),
  'IADI - Sede Iaçu',
  'Endereço da sede (preencher)',
  'Iaçu',
  'Centro',
  TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CRIAR O PRIMEIRO USUÁRIO ADMINISTRADOR
-- ============================================================
-- Opção A (recomendada): Via painel Supabase
--   1. Acesse: Authentication → Users → Invite user
--   2. Preencha com o e-mail do administrador
--   3. O usuário receberá um e-mail para definir a senha
--   4. Após confirmar o e-mail, execute:
--
--   INSERT INTO app_users (id, full_name, role)
--   VALUES ('COLE-AQUI-O-UUID-DO-USUARIO', 'Danilo Administrador', 'admin');
--
-- Opção B: Via SQL (senha temporária)
--
--   SELECT supabase_admin.create_user(
--     email := 'admin@iadi.com',
--     password := 'SenhaTemporaria@123',
--     data := '{"full_name": "Danilo Administrador"}'::jsonb
--   );
--   -- Depois insira em app_users com o UUID retornado

-- ============================================================
-- BUCKETS DE STORAGE (executar no SQL Editor do Supabase)
-- ============================================================

-- Bucket para fotos de membros (privado — apenas autenticados)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-photos',
  'member-photos',
  FALSE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos do formulário público (público — qualquer um)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registration-photos',
  'registration-photos',
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POLÍTICAS DE STORAGE
-- ============================================================

-- member-photos: SELECT para autenticados
CREATE POLICY "member_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);

-- member-photos: INSERT para presbitero+
CREATE POLICY "member_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'member-photos'
    AND auth.uid() IS NOT NULL
    AND (
      SELECT role FROM app_users WHERE id = auth.uid() AND is_active = TRUE LIMIT 1
    ) IN ('admin', 'secretario', 'lideranca_plena', 'presbitero')
  );

-- member-photos: UPDATE para presbitero+
CREATE POLICY "member_photos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'member-photos'
    AND auth.uid() IS NOT NULL
    AND (
      SELECT role FROM app_users WHERE id = auth.uid() AND is_active = TRUE LIMIT 1
    ) IN ('admin', 'secretario', 'lideranca_plena', 'presbitero')
  );

-- registration-photos: INSERT público (sem login)
CREATE POLICY "reg_photos_insert_public"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'registration-photos');

-- registration-photos: SELECT público
CREATE POLICY "reg_photos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'registration-photos');
