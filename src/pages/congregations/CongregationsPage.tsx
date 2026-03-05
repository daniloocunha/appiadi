import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useCongregations } from '@/hooks/useCongregations'
import { usePermission } from '@/hooks/usePermission'
import { CongregationForm } from '@/components/congregations/CongregationForm'
import type { Congregation } from '@/types'
import {
  Building2, Plus, Pencil, Trash2, Phone, MapPin, Star, User, Info
} from 'lucide-react'

export function CongregationsPage() {
  const { congregations, isLoading, saveCongregation, deleteCongregation, reload } = useCongregations()
  const { canManageCongregations } = usePermission()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Congregation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Congregation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (c: Congregation) => { setEditing(c); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditing(null) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteCongregation(deleteTarget.id)
    setDeleteTarget(null)
    setIsDeleting(false)
  }

  const headquarters = congregations.filter((c) => c.is_headquarters)
  const subordinates = congregations.filter((c) => !c.is_headquarters)

  return (
    <AppShell title="Congregações">
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Congregações</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {congregations.length} {congregations.length === 1 ? 'congregação' : 'congregações'} cadastrada{congregations.length === 1 ? '' : 's'}
            </p>
          </div>
          {canManageCongregations ? (
            <Button size="sm" leftIcon={<Plus size={15} />} onClick={openNew}>
              Nova Congregação
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Info size={13} className="shrink-0" />
              <span>Somente administradores podem gerenciar congregações</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse h-28" />
            ))}
          </div>
        ) : congregations.length === 0 ? (
          <EmptyState
            icon={<Building2 size={48} />}
            title="Nenhuma congregação cadastrada"
            description="Crie a sede e as congregações subordinadas para começar a cadastrar membros."
            action={canManageCongregations ? (
              <Button leftIcon={<Plus size={15} />} onClick={openNew}>
                Criar primeira congregação
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-5">
            {/* Sede */}
            {headquarters.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Sede
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {headquarters.map((c) => (
                    <CongregationCard
                      key={c.id}
                      congregation={c}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      canManage={canManageCongregations}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Subordinadas */}
            {subordinates.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Congregações Subordinadas
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subordinates.map((c) => (
                    <CongregationCard
                      key={c.id}
                      congregation={c}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      canManage={canManageCongregations}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Modal: formulário de criação/edição */}
      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? 'Editar Congregação' : 'Nova Congregação'}
        size="md"
      >
        <CongregationForm
          initialData={editing ?? undefined}
          onSave={async (data) => {
            await saveCongregation(data, editing?.id)
            await reload()
            closeForm()
          }}
          onCancel={closeForm}
        />
      </Modal>

      {/* Modal: confirmação de exclusão */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Congregação"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDelete}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Tem certeza que deseja excluir{' '}
          <strong className="text-slate-800">{deleteTarget?.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        {deleteTarget?.is_headquarters && (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg p-2">
            ⚠️ Esta é a sede da IADI. A exclusão pode causar inconsistências nos membros cadastrados.
          </p>
        )}
      </Modal>
    </AppShell>
  )
}

// ---- Card de congregação ----
function CongregationCard({
  congregation,
  onEdit,
  onDelete,
  canManage,
}: {
  congregation: Congregation
  onEdit: (c: Congregation) => void
  onDelete: (c: Congregation) => void
  canManage: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={[
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            congregation.is_headquarters ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
          ].join(' ')}>
            {congregation.is_headquarters ? <Star size={18} /> : <Building2 size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{congregation.name}</p>
            {congregation.is_headquarters && (
              <Badge variant="info" className="text-xs mt-0.5">Sede</Badge>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(congregation)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            {!congregation.is_headquarters && (
              <button
                onClick={() => onDelete(congregation)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {congregation.neighborhood && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {congregation.neighborhood}{congregation.city ? ` — ${congregation.city}` : ''}
            </span>
          </div>
        )}
        {congregation.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone size={12} className="shrink-0" />
            <span>{congregation.phone}</span>
          </div>
        )}
        {congregation.dirigente_id && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <User size={12} className="shrink-0" />
            <span className="text-amber-600">Dirigente atribuído</span>
          </div>
        )}
      </div>
    </div>
  )
}
