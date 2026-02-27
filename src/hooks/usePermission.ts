import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

// ============================================================
// Hook central de permissões — baseado na hierarquia da IADI
// ============================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  secretario: 4,
  lideranca_plena: 3,
  presbitero: 2,
  diacono_obreiro: 1,
}

function hasRole(userRole: UserRole | null, requiredLevel: number): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= requiredLevel
}

export function usePermission() {
  const role = useAuthStore((s) => s.appUser?.role ?? null)

  return {
    role,

    // Visualização
    canViewMembers: hasRole(role, 1),      // todos
    canViewDashboard: hasRole(role, 1),    // todos

    // Edição de membros
    canEditMembers: hasRole(role, 2),      // presbítero+
    canDeleteMembers: hasRole(role, 3),    // liderança plena+

    // Congregações e eventos
    canManageCongregations: hasRole(role, 3),
    canManageEvents: hasRole(role, 3),

    // Documentos
    canGenerateLetters: hasRole(role, 3),  // liderança plena+
    canGenerateBadges: hasRole(role, 2),   // presbítero+

    // Auto-cadastros
    canReviewRegistrations: hasRole(role, 3),

    // Usuários do sistema
    canManageUsers: hasRole(role, 4),      // secretário + admin

    // Admin
    isAdmin: role === 'admin',
    isSecretario: role === 'secretario',
    isLiderancaPlena: role === 'lideranca_plena',
    isPresbitero: role === 'presbitero',
    isDiaconoObreiro: role === 'diacono_obreiro',
  }
}
