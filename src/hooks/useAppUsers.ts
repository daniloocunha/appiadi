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

  /** Convida novo usuário por e-mail via Edge Function (requer service role key no servidor) */
  async function inviteUser(email: string, fullName: string, role: UserRole): Promise<{ error: string | null }> {
    const { data: { session } } = await supabase.auth.getSession()

    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, fullName, role },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    })

    if (error) {
      return { error: error.message }
    }

    if (data?.error) {
      return { error: data.error }
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

  /** Vincula (ou desvincula) um membro ao usuário do sistema */
  async function linkMember(userId: string, memberId: string | null): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('app_users')
      .update({ member_id: memberId, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (err) return { error: err.message }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, member_id: memberId } : u))
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
    linkMember,
    reload: loadUsers,
  }
}

// ---- Labels legíveis para os papéis ----
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  secretario: 'Secretário',
  lideranca_plena: 'Liderança Plena',
  pastor: 'Pastor',
  presbitero: 'Presbítero',
  diacono_obreiro: 'Diácono / Obreiro',
  midia: 'Mídia',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total ao sistema, incluindo gestão de usuários',
  secretario: 'Acesso total, incluindo convidar usuários e alterar papéis',
  lideranca_plena: 'Gerencia membros, congregações, eventos e documentos',
  pastor: 'Acesso completo à gestão da igreja (membros, eventos, cartas, congregações)',
  presbitero: 'Visualiza e edita membros; cria e edita eventos',
  diacono_obreiro: 'Visualiza membros; cria e edita eventos',
  midia: 'Visualiza membros; cria e edita eventos — sem edição de cadastros',
}

export const ROLE_ORDER: UserRole[] = [
  'admin',
  'secretario',
  'lideranca_plena',
  'pastor',
  'presbitero',
  'diacono_obreiro',
  'midia',
]
