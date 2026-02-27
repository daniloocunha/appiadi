import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { MemberForm } from '@/components/members/MemberForm'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { useMembers, fetchMemberById } from '@/hooks/useMembers'
import { useCongregations } from '@/hooks/useCongregations'
import { usePermission } from '@/hooks/usePermission'
import { formatDate, formatPhone, formatCPF } from '@/utils/formatters'
import type { Member } from '@/types'
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin,
  Calendar, User, Building2, BookOpen, Heart
} from 'lucide-react'

// ---- Linha de info ----
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 break-words">{value}</p>
      </div>
    </div>
  )
}

// ---- Seção de detalhe ----
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canEditMembers, canDeleteMembers } = usePermission()

  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { congregations } = useCongregations()
  const { saveMember, deleteMember, reload } = useMembers()

  const congregation = congregations.find((c) => c.id === member?.congregation_id)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    fetchMemberById(id).then((m) => {
      setMember(m)
      setIsLoading(false)
    })
  }, [id])

  const MARITAL_LABELS: Record<string, string> = {
    solteiro: 'Solteiro(a)',
    casado: 'Casado(a)',
    divorciado: 'Divorciado(a)',
    viuvo: 'Viúvo(a)',
    separado: 'Separado(a)',
  }

  async function handleDelete() {
    if (!id) return
    setIsDeleting(true)
    await deleteMember(id)
    setIsDeleting(false)
    setDeleteOpen(false)
    navigate('/members')
  }

  if (isLoading) {
    return (
      <AppShell title="Membro">
        <div className="p-4 lg:p-6 flex flex-col gap-3">
          <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (!member) {
    return (
      <AppShell title="Membro">
        <div className="p-4 lg:p-6">
          <button
            onClick={() => navigate('/members')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <p className="text-slate-500">Membro não encontrado.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={member.full_name}>
      <div className="p-4 lg:p-6 flex flex-col gap-4">
        {/* Voltar */}
        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 self-start"
        >
          <ArrowLeft size={16} />
          Voltar à lista
        </button>

        {/* Card principal */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-4">
          <Avatar
            src={member.photo_url ?? undefined}
            name={member.full_name}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-800">{member.full_name}</h2>
                <p className="text-sm text-slate-500">
                  {member.church_role ?? 'Membro'}
                  {congregation ? ` · ${congregation.name}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <MemberStatusBadge status={member.status} />
                  {member.member_number && (
                    <span className="text-xs text-slate-400 font-mono">
                      #{String(member.member_number).padStart(4, '0')}
                    </span>
                  )}
                </div>
              </div>
              {canEditMembers && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  {canDeleteMembers && (
                    <button
                      onClick={() => setDeleteOpen(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <DetailSection title="Dados Pessoais">
          <InfoRow
            icon={<Calendar size={15} />}
            label="Data de Nascimento"
            value={member.birth_date ? formatDate(member.birth_date, 'long') : null}
          />
          <InfoRow
            icon={<Heart size={15} />}
            label="Estado Civil"
            value={member.marital_status ? MARITAL_LABELS[member.marital_status] : null}
          />
          {member.marital_status === 'casado' && (
            <InfoRow
              icon={<User size={15} />}
              label="Cônjuge"
              value={member.spouse_name}
            />
          )}
          <InfoRow icon={<User size={15} />} label="Nome do Pai" value={member.father_name} />
          <InfoRow icon={<User size={15} />} label="Nome da Mãe" value={member.mother_name} />
          <InfoRow icon={<BookOpen size={15} />} label="Profissão" value={member.occupation} />
        </DetailSection>

        {/* Documentos */}
        {(member.cpf || member.rg) && (
          <DetailSection title="Documentos">
            <InfoRow icon={<BookOpen size={15} />} label="CPF" value={member.cpf ? formatCPF(member.cpf) : null} />
            <InfoRow icon={<BookOpen size={15} />} label="RG" value={member.rg} />
          </DetailSection>
        )}

        {/* Contato */}
        {(member.phone || member.phone_secondary || member.email) && (
          <DetailSection title="Contato">
            <InfoRow
              icon={<Phone size={15} />}
              label="Telefone / WhatsApp"
              value={member.phone ? formatPhone(member.phone) : null}
            />
            <InfoRow
              icon={<Phone size={15} />}
              label="Telefone Secundário"
              value={member.phone_secondary ? formatPhone(member.phone_secondary) : null}
            />
            <InfoRow icon={<Mail size={15} />} label="E-mail" value={member.email} />
          </DetailSection>
        )}

        {/* Endereço */}
        {member.address_street && (
          <DetailSection title="Endereço">
            <InfoRow
              icon={<MapPin size={15} />}
              label="Endereço"
              value={[
                member.address_street,
                member.address_number,
                member.address_complement,
              ].filter(Boolean).join(', ')}
            />
            <InfoRow
              icon={<MapPin size={15} />}
              label="Bairro / Cidade"
              value={[
                member.address_neighborhood,
                member.address_city,
                member.address_state,
              ].filter(Boolean).join(' · ')}
            />
            <InfoRow icon={<MapPin size={15} />} label="CEP" value={member.address_zip} />
          </DetailSection>
        )}

        {/* Igreja */}
        <DetailSection title="Dados na Igreja">
          <InfoRow
            icon={<Building2 size={15} />}
            label="Congregação"
            value={congregation?.name ?? 'Não informada'}
          />
          <InfoRow icon={<User size={15} />} label="Cargo" value={member.church_role} />
          <InfoRow icon={<BookOpen size={15} />} label="Ministério" value={member.ministry} />
          <InfoRow
            icon={<Calendar size={15} />}
            label="Data de Batismo em Águas"
            value={member.baptism_date ? formatDate(member.baptism_date, 'long') : null}
          />
          <InfoRow
            icon={<Calendar size={15} />}
            label="Batismo no Espírito Santo"
            value={member.holy_spirit_date ? formatDate(member.holy_spirit_date, 'long') : null}
          />
          <InfoRow
            icon={<Calendar size={15} />}
            label="Data de Ingresso"
            value={member.joined_at ? formatDate(member.joined_at, 'long') : null}
          />
        </DetailSection>

        {/* Notas */}
        {member.notes && (
          <DetailSection title="Observações">
            <p className="text-sm text-slate-700 whitespace-pre-line">{member.notes}</p>
          </DetailSection>
        )}
      </div>

      {/* Modal: edição */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar Membro"
        size="lg"
      >
        <MemberForm
          initialData={member}
          congregations={congregations}
          onSave={async (data, photoFile) => {
            await saveMember(data, photoFile, member.id)
            await reload()
            const updated = await fetchMemberById(member.id)
            if (updated) setMember(updated)
            setEditOpen(false)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Modal: exclusão */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir Membro"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
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
          <strong className="text-slate-800">{member.full_name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </AppShell>
  )
}
