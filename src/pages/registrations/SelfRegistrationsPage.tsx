import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay'
import { useSelfRegistrations, generateRegistrationToken, buildRegistrationLink } from '@/hooks/useSelfRegistrations'
import { useCongregations } from '@/hooks/useCongregations'
import { useAuthStore } from '@/store/authStore'
import { usePermission } from '@/hooks/usePermission'
import { formatDate, formatPhone } from '@/utils/formatters'
import type { SelfRegistration } from '@/types'
import {
  ClipboardList, QrCode, Copy, Check, CheckCircle,
  XCircle, User, Phone, Calendar
} from 'lucide-react'

export function SelfRegistrationsPage() {
  const { registrations, isLoading, approveRegistration, rejectRegistration, reload } = useSelfRegistrations()
  const { congregations } = useCongregations()
  const { appUser } = useAuthStore()
  const { canReviewRegistrations } = usePermission()

  const [qrOpen, setQrOpen] = useState(false)
  const [token] = useState(() => {
    // Token persistido no localStorage para reutilização
    const stored = localStorage.getItem('iadi_reg_token')
    if (stored) return stored
    const newToken = generateRegistrationToken()
    localStorage.setItem('iadi_reg_token', newToken)
    return newToken
  })
  const registrationLink = buildRegistrationLink(token)

  const [copied, setCopied] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<SelfRegistration | null>(null)
  const [selectedCongregation, setSelectedCongregation] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<SelfRegistration | null>(null)

  function copyLink() {
    navigator.clipboard.writeText(registrationLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleApprove() {
    if (!reviewTarget || !selectedCongregation || !appUser) return
    setIsProcessing(true)
    await approveRegistration(reviewTarget, selectedCongregation, appUser.id)
    setIsProcessing(false)
    setReviewTarget(null)
    setSelectedCongregation('')
    await reload()
  }

  async function handleReject() {
    if (!rejectTarget || !appUser) return
    setIsProcessing(true)
    await rejectRegistration(rejectTarget, appUser.id)
    setIsProcessing(false)
    setRejectTarget(null)
    await reload()
  }

  return (
    <AppShell title="Cadastros Pendentes">
      <div className="p-4 lg:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Auto-Cadastros</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {registrations.length === 0
                ? 'Nenhum cadastro pendente'
                : `${registrations.length} pendente${registrations.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<QrCode size={15} />}
            onClick={() => setQrOpen(true)}
          >
            Link / QR Code
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title="Nenhum cadastro pendente"
            description="Quando membros preencherem o formulário de auto-cadastro, aparecerão aqui para aprovação."
            action={
              <Button
                variant="outline"
                leftIcon={<QrCode size={15} />}
                onClick={() => setQrOpen(true)}
              >
                Compartilhar link de cadastro
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {registrations.map((reg) => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                onApprove={() => {
                  setReviewTarget(reg)
                  setSelectedCongregation(reg.congregation_id ?? congregations[0]?.id ?? '')
                }}
                onReject={() => setRejectTarget(reg)}
                canReview={canReviewRegistrations}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: QR Code / Link */}
      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Link de Auto-Cadastro"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-slate-500 text-center">
            Compartilhe este link ou QR Code para que membros possam se cadastrar sem precisar de login.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <QRCodeDisplay value={registrationLink} size={200} />
          </div>

          <div className="w-full bg-slate-50 rounded-lg p-2.5 flex items-center gap-2 border border-slate-200">
            <span className="flex-1 text-xs text-slate-600 truncate font-mono">{registrationLink}</span>
            <button
              onClick={copyLink}
              className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
              title="Copiar link"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              const text = `Olá! Para se cadastrar na Igreja Assembleia de Deus de Iaçu, acesse: ${registrationLink}`
              if (navigator.share) {
                navigator.share({ title: 'Cadastro IADI', text, url: registrationLink })
              } else {
                navigator.clipboard.writeText(text)
              }
            }}
          >
            Compartilhar via WhatsApp
          </Button>
        </div>
      </Modal>

      {/* Modal: Aprovar */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Aprovar Cadastro"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setReviewTarget(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              isLoading={isProcessing}
              disabled={!selectedCongregation}
              onClick={handleApprove}
            >
              Aprovar e criar membro
            </Button>
          </>
        }
      >
        {reviewTarget && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={reviewTarget.photo_url ?? undefined} name={reviewTarget.full_name} size="lg" />
              <div>
                <p className="font-semibold text-slate-800">{reviewTarget.full_name}</p>
                <p className="text-xs text-slate-500">
                  Enviado em {formatDate(reviewTarget.submitted_at, 'short')}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
              {reviewTarget.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={12} /> {formatPhone(reviewTarget.phone)}
                </p>
              )}
              {reviewTarget.birth_date && (
                <p className="flex items-center gap-1.5">
                  <Calendar size={12} /> {formatDate(reviewTarget.birth_date, 'long')}
                </p>
              )}
              {reviewTarget.church_role && (
                <p className="flex items-center gap-1.5">
                  <User size={12} /> {reviewTarget.church_role}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Atribuir à Congregação <span className="text-red-500">*</span>
              </label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCongregation}
                onChange={(e) => setSelectedCongregation(e.target.value)}
              >
                <option value="">Selecione...</option>
                {congregations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.is_headquarters ? ' (Sede)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
              O membro será criado com status "Em Experiência". Você poderá editar seus dados depois.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal: Rejeitar */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Rejeitar Cadastro"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" isLoading={isProcessing} onClick={handleReject}>
              Rejeitar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Deseja rejeitar o cadastro de{' '}
          <strong className="text-slate-800">{rejectTarget?.full_name}</strong>?
          O registro ficará arquivado mas o membro não será criado.
        </p>
      </Modal>
    </AppShell>
  )
}

// ---- Card de registro pendente ----
function RegistrationCard({
  registration,
  onApprove,
  onReject,
  canReview,
}: {
  registration: SelfRegistration
  onApprove: () => void
  onReject: () => void
  canReview: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar
          src={registration.photo_url ?? undefined}
          name={registration.full_name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{registration.full_name}</p>
          <p className="text-xs text-slate-500">
            {registration.church_role ?? 'Cargo não informado'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Enviado em {formatDate(registration.submitted_at, 'short')}
          </p>
        </div>
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full shrink-0">
          Pendente
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        {registration.phone && (
          <span className="flex items-center gap-1">
            <Phone size={11} />
            {formatPhone(registration.phone)}
          </span>
        )}
        {registration.birth_date && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(registration.birth_date, 'short')}
          </span>
        )}
      </div>

      {canReview && (
        <div className="flex gap-2 pt-1 border-t border-slate-50">
          <button
            onClick={onReject}
            className="flex-1 h-8 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
          >
            <XCircle size={13} />
            Rejeitar
          </button>
          <button
            onClick={onApprove}
            className="flex-1 h-8 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle size={13} />
            Aprovar
          </button>
        </div>
      )}
    </div>
  )
}
