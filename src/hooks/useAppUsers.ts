import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AppUser, UserRole } from '@/types'

// ============================================================
// Hook para gestão de usuários do sistema (app_users)
// Requer papel admin ou secretario
// ============================================================

export interface AppUserWithEmail extends AppUser {
  email?: string
}

export function useAppUsers() {
  const [users, setUsers] = useState<AppUserWithEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('app_users')
      .select('*')
      .order('full_name')

    if (err) {
      setError('Erro ao carregar usuários.')
      setIsLoading(false)
      return
    }

    setUsers((data ?? []) as AppUserWithEmail[])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  /** Convida novo usuário por e-mail (envia e-mail de convite via Supabase) */
  async function inviteUser(email: string, fullName: string, role: UserRole): Promise<{ error: string | null }> {
    // 1. Envia convite via Supabase Admin
    // redirectTo garante que o link do e-mail aponte para /auth/reset-password
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (inviteError) {
      return { error: inviteError.message }
    }

    const userId = inviteData.user?.id
    if (!userId) return { error: 'Falha ao obter ID do usuário convidado.' }

    // 2. Cria o registro em app_users
    const { error: insertError } = await supabase
      .from('app_users')
      .insert({
        id: userId,
        full_name: fullName,
        role,
        is_active: true,
      })

    if (insertError) {
      return { error: insertError.message }
    }

    await loadUsers()
    return { error: null }
  }

  /** Altera o papel de um usuário */
  async function changeRole(userId: string, newRole: UserRole): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('app_users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (err) return { error: err.message }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    return { error: null }
  }

  /** Ativa ou desativa um usuário */
  async function toggleActive(userId: string, isActive: boolean): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('app_users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (err) return { error: err.message }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u))
    )
    return { error: null }
  }

  return {
    users,
    isLoading,
    error,
    inviteUser,
    changeRole,
    toggleActive,
    reload: loadUsers,
  }
}

// ---- Labels legíveis para os papéis ----
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  secretario: 'Secretário',
  lideranca_plena: 'Liderança Plena',
  presbitero: 'Presbítero',
  diacono_obreiro: 'Diácono / Obreiro',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total ao sistema, incluindo gestão de usuários',
  secretario: 'Acesso total exceto gestão de usuários do sistema',
  lideranca_plena: 'Gerencia membros, congregações, eventos e documentos',
  presbitero: 'Visualiza e edita membros; acesso de leitura nas demais áreas',
  diacono_obreiro: 'Somente visualização — sem edição ou geração de documentos',
}

export const ROLE_ORDER: UserRole[] = [
  'admin',
  'secretario',
  'lideranca_plena',
  'presbitero',
  'diacono_obreiro',
]
