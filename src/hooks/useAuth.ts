import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { AppUser } from '@/types'

export function useAuthInit() {
  const { setUser, setAppUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Helper para detectar links de convite/reset no hash da URL
    function isAuthRedirectLink() {
      const params = new URLSearchParams(window.location.hash.substring(1))
      const t = params.get('type')
      return t === 'invite' || t === 'recovery'
    }

    // ---- 1. Sessão inicial ----
    // Libera o loading assim que souber se há sessão — não espera o appUser
    // para evitar loading infinito caso o Supabase demore ou a RLS bloqueie
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isAuthRedirectLink()) {
        setUser(session?.user ?? null)
        // Carrega appUser em background, sem bloquear a UI
        if (session?.user) {
          loadAppUser(session.user.id, setAppUser)
        }
      }
      setLoading(false)   // sempre desbloqueia, mesmo em caso de erro
    }).catch(() => {
      setLoading(false)   // garante desbloqueio mesmo se getSession jogar exceção
    })

    // ---- 2. Mudanças de sessão em tempo real ----
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Links de convite/reset são gerenciados pela ResetPasswordPage
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
          if (isAuthRedirectLink()) return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          loadAppUser(session.user.id, setAppUser)
        } else {
          setAppUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setAppUser, setLoading])
}

async function loadAppUser(
  userId: string,
  setAppUser: (u: AppUser | null) => void
) {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error('[auth] Falha ao carregar perfil do usuário:', error)
    setAppUser(null)
    return
  }

  setAppUser(data as AppUser)
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  return { error }
}
