import { useState, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/authStore'
import { useAppUsers, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ORDER } from '@/hooks/useAppUsers'
import { useMembers } from '@/hooks/useMembers'
import type { UserRole } from '@/types'
import {
  UserPlus,
  Shield,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Info,
  UserCircle,
  X,
} from 'lucide-react'

// ============================================================
// SettingsPage — Gestão de Usuários (admin + secretário)
// ============================================================

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  secretario: 'bg-purple-100 text-purple-700',
  lideranca_plena: 'bg-blue-100 text-blue-700',
  pastor: 'bg-indigo-100 text-indigo-700',
  presbitero: 'bg-green-100 text-green-700',
  diacono_obreiro: 'bg-slate-100 text-slate-600',
  midia: 'bg-teal-100 text-teal-700',
}

// ---- Modal de convite ----
function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void
  onInvite: (email: string, name: string, role: UserRole) => Promise<{ error: string | null }>
}) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('diacono_obreiro')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !fullName.trim()) {
      setError('Preencha o nome e o e-mail.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const result = await onInvite(email.trim(), fullName.trim(), role)
      if (result.error) {
        const msg = String(result.error)
        if (msg.includes('already been registered') || msg.includes('already exists')) {
          setError('Este e-mail já está cadastrado no sistema.')
        } else {
          setError(msg)
        }
      } else {
        setSuccess(true)
        setTimeout(onClose, 2500)
      }
    } catch {
      setError('Erro inesperado ao enviar o convite. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-blue-700" />
            <h2 className="font-semibold text-slate-800">Convidar Usuário</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={40} className="text-green-500" />
            <p className="font-semibold text-slate-800">Convite enviado!</p>
            <p className="text-sm text-slate-500">
              O usuário receberá um e-mail com instruções para definir a senha e acessar o sistema.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <Input
              label="Nome completo"
              placeholder="Ex: João Silva"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="joao@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Seleção de papel */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Papel no sistema</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">{ROLE_DESCRIPTIONS[role]}</p>
            </div>

            {/* Container sempre presente evita erro de insertBefore no React */}
            <div className={error ? 'flex items-start gap-2 bg-red-50 rounded-lg p-3' : 'hidden'} aria-live="polite">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" isLoading={isLoading}>
                Enviar convite
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ---- Card de usuário ----
function UserCard({
  user,
  currentUserId,
  canManage,
  members,
  onChangeRole,
  onToggleActive,
  onLinkMember,
}: {
  user: { id: string; full_name: string; role: UserRole; is_active: boolean; member_id: string | null }
  currentUserId: string | undefined
  canManage: boolean
  members: { id: string; full_name: string }[]
  onChangeRole: (userId: string, role: UserRole) => Promise<void>
  onToggleActive: (userId: string, active: boolean) => Promise<void>
  onLinkMember: (userId: string, memberId: string | null) => Promise<void>
}) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [showMemberSearch, setShowMemberSearch] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const isSelf = user.id === currentUserId

  const linkedMember = members.find((m) => m.id === user.member_id) ?? null

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    if (q.length < 2) return []
    return members.filter((m) => m.full_name.toLowerCase().includes(q)).slice(0, 8)
  }, [members, memberQuery])

  const handleLinkMember = async (memberId: string | null) => {
    setIsUpdating(true)
    await onLinkMember(user.id, memberId)
    setIsUpdating(false)
    setShowMemberSearch(false)
    setMemberQuery('')
  }

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === user.role) { setShowRoleDropdown(false); return }
    setIsUpdating(true)
    await onChangeRole(user.id, newRole)
    setIsUpdating(false)
    setShowRoleDropdown(false)
  }

  const handleToggle = async () => {
    setIsUpdating(true)
    await onToggleActive(user.id, !user.is_active)
    setIsUpdating(false)
  }

  return (
    <div className={[
      'bg-white rounded-xl border p-4 flex items-start gap-3 transition-opacity',
      !user.is_active ? 'opacity-60' : '',
    ].join(' ')}>
      <Avatar name={user.full_name} size="md" className="bg-blue-100 text-blue-700 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-medium text-sm text-slate-800 leading-tight">
              {user.full_name}
              {isSelf && (
                <span className="ml-1.5 text-xs text-slate-400">(você)</span>
              )}
            </p>
            {!user.is_active && (
              <span className="text-xs text-red-500 font-medium">Desativado</span>
            )}
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
        </div>

        {/* Membro vinculado */}
        {canManage && !isSelf && (
          <div className="mt-2">
            {showMemberSearch ? (
              <div className="relative">
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Buscar membro pelo nome…"
                    className="flex-1 h-7 text-xs border border-amber-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    onClick={() => { setShowMemberSearch(false); setMemberQuery('') }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                </div>
                {filteredMembers.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-full max-h-44 overflow-y-auto">
                    {filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleLinkMember(m.id)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 text-slate-700"
                      >
                        {m.full_name}
                      </button>
                    ))}
                  </div>
                )}
                {memberQuery.length >= 2 && filteredMembers.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">Nenhum membro encontrado.</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <UserCircle size={12} className={linkedMember ? 'text-amber-500' : 'text-slate-300'} />
                <span className="text-xs text-slate-500">
                  {linkedMember ? linkedMember.full_name : 'Sem membro vinculado'}
                </span>
                <button
                  onClick={() => setShowMemberSearch(true)}
                  disabled={isUpdating}
                  className="text-xs text-amber-600 hover:text-amber-800 underline-offset-2 hover:underline disabled:opacity-40"
                >
                  {linkedMember ? 'Alterar' : 'Vincular'}
                </button>
                {linkedMember && (
                  <button
                    onClick={() => handleLinkMember(null)}
                    disabled={isUpdating}
                    className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-40"
                  >
                    Desvincular
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {canManage && !isSelf && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Alterar papel */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown((v) => !v)}
                disabled={isUpdating}
                className="flex items-center gap-1 text-xs text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
              >
                <Shield size={12} />
                Alterar papel
                <ChevronDown size={11} />
              </button>

              {showRoleDropdown && (
                <>
                  {/* Overlay para fechar */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-52">
                    {ROLE_ORDER.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={[
                          'w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col transition-colors',
                          r === user.role ? 'bg-blue-50 text-blue-700' : '',
                        ].join(' ')}
                      >
                        <span className="font-medium">{ROLE_LABELS[r]}</span>
                        <span className="text-slate-400 text-xs leading-tight mt-0.5">{ROLE_DESCRIPTIONS[r]}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Ativar/Desativar */}
            <button
              onClick={handleToggle}
              disabled={isUpdating}
              className={[
                'flex items-center gap-1 text-xs border rounded-md px-2 py-1 transition-colors disabled:opacity-50',
                user.is_active
                  ? 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100'
                  : 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100',
              ].join(' ')}
            >
              {user.is_active
                ? <><ToggleLeft size={13} className="shrink-0" /> Desativar</>
                : <><ToggleRight size={13} className="shrink-0" /> Ativar</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Tabela de referência de permissões ----
function PermissionsReference() {
  const [open, setOpen] = useState(false)

  const perms = [
    { label: 'Ver todos os membros',   roles: ['admin', 'secretario', 'lideranca_plena', 'pastor', 'presbitero', 'diacono_obreiro', 'midia'] },
    { label: 'Criar / editar membro',  roles: ['admin', 'secretario', 'lideranca_plena', 'pastor', 'presbitero'] },
    { label: 'Excluir membro',         roles: ['admin', 'secretario', 'lideranca_plena', 'pastor'] },
    { label: 'Gerar cartas PDF',       roles: ['admin', 'secretario', 'lideranca_plena', 'pastor'] },
    { label: 'Gerar crachá PDF',       roles: ['admin', 'secretario', 'lideranca_plena', 'pastor', 'presbitero'] },
    { label: 'Criar / editar eventos', roles: ['admin', 'secretario', 'lideranca_plena', 'pastor', 'presbitero', 'diacono_obreiro', 'midia'] },
    { label: 'Gerenciar congregações', roles: ['admin', 'secretario', 'lideranca_plena', 'pastor'] },
    { label: 'Aprovar auto-cadastros', roles: ['admin', 'secretario', 'lideranca_plena', 'pastor'] },
    { label: 'Gerenciar usuários',     roles: ['admin', 'secretario'] },
  ]

  const allRoles: UserRole[] = ['admin', 'secretario', 'lideranca_plena', 'pastor', 'presbitero', 'diacono_obreiro', 'midia']

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={16} className="text-blue-600" />
          Tabela de permissões por papel
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2 font-medium text-slate-600 w-52">Funcionalidade</th>
                {allRoles.map((r) => (
                  <th key={r} className="px-3 py-2 font-medium text-slate-600 text-center min-w-24">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${ROLE_COLORS[r]}`}>
                      {ROLE_LABELS[r]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((perm, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2 text-slate-700">{perm.label}</td>
                  {allRoles.map((r) => (
                    <td key={r} className="px-3 py-2 text-center">
                      {perm.roles.includes(r) ? (
                        <span className="text-green-500 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Page principal
// ============================================================

export function SettingsPage() {
  const { canManageUsers } = usePermission()
  const { user: currentUser } = useAuthStore()
  const { users, isLoading, error, inviteUser, changeRole, toggleActive, linkMember } = useAppUsers()
  const { members: allMembers } = useMembers()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const memberOptions = useMemo(
    () => allMembers.map((m) => ({ id: m.id, full_name: m.full_name })),
    [allMembers]
  )

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleChangeRole = async (userId: string, role: UserRole) => {
    const { error: err } = await changeRole(userId, role)
    if (err) showFeedback('error', 'Erro ao alterar papel: ' + err)
    else showFeedback('success', 'Papel atualizado com sucesso.')
  }

  const handleToggleActive = async (userId: string, active: boolean) => {
    const { error: err } = await toggleActive(userId, active)
    if (err) showFeedback('error', 'Erro ao alterar status: ' + err)
    else showFeedback('success', active ? 'Usuário ativado.' : 'Usuário desativado.')
  }

  const handleLinkMember = async (userId: string, memberId: string | null) => {
    const { error: err } = await linkMember(userId, memberId)
    if (err) showFeedback('error', 'Erro ao vincular membro: ' + err)
    else showFeedback('success', memberId ? 'Membro vinculado.' : 'Vínculo removido.')
  }

  if (!canManageUsers) {
    return (
      <AppShell title="Configurações">
        <div className="p-4 lg:p-6 flex items-center justify-center min-h-64">
          <div className="text-center">
            <Shield size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              Você não tem permissão para acessar as configurações do sistema.
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  const activeUsers = users.filter((u) => u.is_active)
  const inactiveUsers = users.filter((u) => !u.is_active)

  return (
    <AppShell title="Configurações">
      <div className="p-4 lg:p-6 max-w-3xl mx-auto flex flex-col gap-6">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Gestão de Usuários</h2>
            <p className="text-sm text-slate-500">
              {activeUsers.length} usuário{activeUsers.length !== 1 ? 's' : ''} ativo{activeUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={16} />
            Convidar usuário
          </Button>
        </div>

        {/* Feedback inline */}
        {feedback && (
          <div className={[
            'flex items-center gap-2 rounded-lg px-4 py-3 text-sm border',
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200',
          ].join(' ')}>
            {feedback.type === 'success'
              ? <CheckCircle size={16} className="shrink-0" />
              : <AlertTriangle size={16} className="shrink-0" />
            }
            {feedback.msg}
          </div>
        )}

        {/* Erro de carregamento */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 rounded-lg px-4 py-3 text-sm text-red-700 border border-red-200">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Skeleton */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-40 mb-2" />
                    <div className="h-2.5 bg-slate-100 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Usuários ativos */}
            <div className="flex flex-col gap-3">
              {activeUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={{ ...u, member_id: u.member_id ?? null }}
                  currentUserId={currentUser?.id}
                  canManage={canManageUsers}
                  members={memberOptions}
                  onChangeRole={handleChangeRole}
                  onToggleActive={handleToggleActive}
                  onLinkMember={handleLinkMember}
                />
              ))}
            </div>

            {/* Usuários desativados */}
            {inactiveUsers.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Desativados ({inactiveUsers.length})
                </p>
                {inactiveUsers.map((u) => (
                  <UserCard
                    key={u.id}
                    user={{ ...u, member_id: u.member_id ?? null }}
                    currentUserId={currentUser?.id}
                    canManage={canManageUsers}
                    members={memberOptions}
                    onChangeRole={handleChangeRole}
                    onToggleActive={handleToggleActive}
                    onLinkMember={handleLinkMember}
                  />
                ))}
              </div>
            )}

            {users.length === 0 && !isLoading && (
              <div className="text-center py-12 text-slate-400">
                <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum usuário cadastrado ainda.</p>
                <p className="text-xs">Use "Convidar usuário" para adicionar o primeiro acesso.</p>
              </div>
            )}
          </>
        )}

        {/* Referência de permissões */}
        <PermissionsReference />

        {/* Dica sobre convite */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-2.5">
          <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Como funciona o convite?</p>
            <p>
              O usuário convidado recebe um e-mail com link para definir sua senha. O papel pode
              ser alterado a qualquer momento. Desativar um usuário impede o acesso sem excluir
              o histórico de ações.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de convite */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={inviteUser}
        />
      )}
    </AppShell>
  )
}
