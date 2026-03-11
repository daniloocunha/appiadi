import { useState, useDeferredValue, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberForm } from '@/components/members/MemberForm'
import { Avatar } from '@/components/ui/Avatar'
import { useMembers } from '@/hooks/useMembers'
import { useCongregations } from '@/hooks/useCongregations'
import { usePermission } from '@/hooks/usePermission'
import type { Member, MemberStatus } from '@/types'
import { Users, Plus, Search, X, Filter, AlertTriangle, ChevronRight } from 'lucide-react'

type PageTab = 'lista' | 'incompletos'

// Campos importantes que devem estar preenchidos na ficha do membro
const REQUIRED_FIELDS: Array<{ key: keyof Member; label: string }> = [
  { key: 'phone',        label: 'Telefone' },
  { key: 'birth_date',   label: 'Data de nascimento' },
  { key: 'cpf',          label: 'CPF' },
  { key: 'baptism_date', label: 'Data de batismo' },
  { key: 'photo_url',    label: 'Foto' },
  { key: 'address_city', label: 'Cidade' },
]

function getMissingFields(member: Member): string[] {
  return REQUIRED_FIELDS
    .filter((f) => !member[f.key])
    .map((f) => f.label)
}

const STATUS_FILTERS: { value: MemberStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
  { value: 'em_experiencia', label: 'Em Experiência' },
  { value: 'transferido', label: 'Transferidos' },
  { value: 'falecido', label: 'Falecidos' },
  { value: 'excluido', label: 'Excluídos' },
]

export function MembersPage() {
  const navigate = useNavigate()
  const { canEditMembers } = usePermission()

  const [tab, setTab] = useState<PageTab>('lista')
  const [rawSearch, setRawSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('')
  const [congregationFilter, setCongregationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const search = useDeferredValue(rawSearch)

  // Aba lista — aplica filtros normais
  const { members, isLoading, saveMember, reload } = useMembers({
    search,
    status: statusFilter || undefined,
    congregation_id: congregationFilter || undefined,
  })

  // Aba incompletos — busca todos os ativos sem filtros adicionais
  const { members: allActiveMembers, isLoading: isLoadingAll } = useMembers({ status: 'ativo' })

  const incompleteMembers = useMemo(() => {
    return allActiveMembers
      .map((m) => ({ member: m, missing: getMissingFields(m) }))
      .filter((x) => x.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length) // mais incompletos primeiro
  }, [allActiveMembers])

  const { congregations } = useCongregations()
  const congregationMap = Object.fromEntries(congregations.map((c) => [c.id, c]))
  const activeCount = members.filter((m) => m.status === 'ativo').length

  return (
    <AppShell title="Membros">
      <div className="p-4 lg:p-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Membros</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
              {statusFilter === '' && tab === 'lista' && ` · ${activeCount} ativo${activeCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canEditMembers && (
            <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setFormOpen(true)}>
              Novo Membro
            </Button>
          )}
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('lista')}
            className={[
              'flex-1 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
              tab === 'lista' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            <Users size={14} />
            Lista ({members.length})
          </button>
          <button
            onClick={() => setTab('incompletos')}
            className={[
              'flex-1 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
              tab === 'incompletos' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            <AlertTriangle size={14} className={incompleteMembers.length > 0 ? 'text-amber-500' : ''} />
            Incompletos {incompleteMembers.length > 0 ? `(${incompleteMembers.length})` : ''}
          </button>
        </div>

        {/* ── Aba Lista ── */}
        {tab === 'lista' && (
          <>
            {/* Busca + Filtros */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar por nome, telefone, CPF..."
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {rawSearch && (
                    <button
                      onClick={() => setRawSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={[
                    'h-9 px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-colors',
                    showFilters || statusFilter || congregationFilter
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  <Filter size={14} />
                  Filtros
                  {(statusFilter || congregationFilter) && (
                    <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {(statusFilter ? 1 : 0) + (congregationFilter ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_FILTERS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setStatusFilter(f.value as MemberStatus | '')}
                          className={[
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                            statusFilter === f.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          ].join(' ')}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {congregations.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1.5">Congregação</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setCongregationFilter('')}
                          className={[
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                            !congregationFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          ].join(' ')}
                        >
                          Todas
                        </button>
                        {congregations.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setCongregationFilter(c.id)}
                            className={[
                              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                              congregationFilter === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                            ].join(' ')}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(statusFilter || congregationFilter) && (
                    <button
                      onClick={() => { setStatusFilter(''); setCongregationFilter('') }}
                      className="text-xs text-red-500 hover:text-red-600 self-start"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Lista */}
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-3.5 h-16 animate-pulse" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <EmptyState
                icon={<Users size={48} />}
                title={rawSearch || statusFilter || congregationFilter ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
                description={
                  rawSearch || statusFilter || congregationFilter
                    ? 'Tente ajustar os filtros ou a busca.'
                    : 'Cadastre o primeiro membro clicando no botão acima.'
                }
                action={
                  !rawSearch && !statusFilter && !congregationFilter && canEditMembers ? (
                    <Button leftIcon={<Plus size={15} />} onClick={() => setFormOpen(true)}>
                      Cadastrar primeiro membro
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    congregation={congregationMap[m.congregation_id]}
                    onClick={() => navigate(`/members/${m.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Aba Incompletos ── */}
        {tab === 'incompletos' && (
          isLoadingAll ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-3.5 h-16 animate-pulse" />
              ))}
            </div>
          ) : incompleteMembers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
              <Users size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Todas as fichas estão completas!</p>
              <p className="text-xs text-slate-400 mt-1">Nenhum membro ativo com informações faltando.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 px-0.5">
                {incompleteMembers.length} membro{incompleteMembers.length !== 1 ? 's' : ''} com informações pendentes
              </p>
              {incompleteMembers.map(({ member, missing }) => (
                <button
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="bg-white rounded-xl border border-amber-200 p-3.5 flex items-center gap-3 text-left hover:shadow-sm hover:border-amber-300 transition-all"
                >
                  <Avatar src={member.photo_url ?? undefined} name={member.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{member.full_name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {missing.map((field) => (
                        <span key={field} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal: cadastro */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Novo Membro"
        size="lg"
      >
        <MemberForm
          congregations={congregations}
          onSave={async (data, photoFile) => {
            const result = await saveMember(data, photoFile)
            await reload()
            setFormOpen(false)
            if (result.photoError) alert(result.photoError)
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </AppShell>
  )
}
