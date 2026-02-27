import { useState, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberForm } from '@/components/members/MemberForm'
import { useMembers } from '@/hooks/useMembers'
import { useCongregations } from '@/hooks/useCongregations'
import { usePermission } from '@/hooks/usePermission'
import type { MemberStatus } from '@/types'
import { Users, Plus, Search, X, Filter } from 'lucide-react'

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

  const [rawSearch, setRawSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('')
  const [congregationFilter, setCongregationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const search = useDeferredValue(rawSearch)

  const { members, isLoading, saveMember, reload } = useMembers({
    search,
    status: statusFilter || undefined,
    congregation_id: congregationFilter || undefined,
  })

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
              {statusFilter === '' && ` · ${activeCount} ativo${activeCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canEditMembers && (
            <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setFormOpen(true)}>
              Novo Membro
            </Button>
          )}
        </div>

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

          {/* Painel de Filtros */}
          {showFilters && (
            <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
              {/* Status chips */}
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

              {/* Congregação */}
              {congregations.length > 1 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Congregação</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCongregationFilter('')}
                      className={[
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        !congregationFilter
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
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
                          congregationFilter === c.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
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
            await saveMember(data, photoFile)
            await reload()
            setFormOpen(false)
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </AppShell>
  )
}
