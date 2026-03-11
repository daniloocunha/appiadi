-- ============================================================
-- 005_username_login.sql
-- Adiciona coluna de login (nome de usuário) à tabela app_users
-- e cria função RPC para buscar o e-mail Supabase pelo login.
--
-- Executar no Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- Coluna de login (único, case-insensitive)
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS login TEXT;

-- Índice único em lower(login) — garante que dois usuários não
-- possam ter o mesmo nome de usuário (ignorando maiúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_login
  ON app_users (lower(login))
  WHERE login IS NOT NULL;

-- ============================================================
-- Função RPC: retorna o e-mail Supabase Auth a partir de um login
--
-- Usada pela tela de login para traduzir "admin" → "admin@email.com"
-- antes de chamar signInWithPassword.
--
-- SECURITY DEFINER: executa com privilégio do dono da função
-- (necessário para ler auth.users, que não é acessível por anon).
-- ============================================================
CREATE OR REPLACE FUNCTION get_email_by_login(p_login text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT au.email INTO v_email
  FROM public.app_users  ap
  JOIN auth.users        au ON au.id = ap.id
  WHERE lower(ap.login) = lower(p_login)
    AND ap.is_active = true;

  RETURN v_email;   -- retorna NULL se não encontrar
END;
$$;

-- Permite que usuários não autenticados (anon) chamem essa função
-- (necessário pois é chamada antes do login)
GRANT EXECUTE ON FUNCTION get_email_by_login(text) TO anon;
GRANT EXECUTE ON FUNCTION get_email_by_login(text) TO authenticated;
