import { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { useMembers } from '@/hooks/useMembers'
import { useCongregations } from '@/hooks/useCongregations'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/db'
import { syncWrite } from '@/lib/sync'
import { generateLetterNumber, generateBadgeNumber } from '@/utils/letterNumber'
import { RecommendationLetterPDF } from '@/lib/pdf/RecommendationLetter'
import { TransferLetterPDF } from '@/lib/pdf/TransferLetter'
import { MemberBadgePDF } from '@/lib/pdf/MemberBadge'
import type { Member, Letter, Badge } from '@/types'
import { formatDate } from '@/utils/formatters'
import { v4 as uuidv4 } from 'uuid'
import {
  FileText, Award, Search, X, Download, FileCheck,
  ChevronDown, ChevronUp, History
} from 'lucide-react'

type DocumentType = 'recomendacao' | 'transferencia' | 'cracha'

export function LettersPage() {
  const { canGenerateLetters, canGenerateBadges } = usePermission()
  const { appUser } = useAuthStore()

  const [searchRaw, setSearchRaw] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [docType, setDocType] = useState<DocumentType>('recomendacao')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [destination, setDestination] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [pastorName, setPastorName] = useState('')

  const [history, setHistory] = useState<Array<Letter | (Badge & { updated_at?: string })>>([])
  const [showHistory, setShowHistory] = useState(false)

  const { members, isLoading } = useMembers({ search: searchRaw })
  const { congregations } = useCongregations()
  const congregationMap = Object.fromEntries(congregations.map((c) => [c.id, c]))

  useEffect(() => {
    async function load() {
      const [letters, badges] = await Promise.all([
        db.letters.orderBy('issued_at').reverse().limit(20).toArray(),
        db.badges.orderBy('issued_at').reverse().limit(10).toArray(),
      ])
      const all = [...(letters as Letter[]), ...(badges as Badge[])].sort(
        (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
      )
      setHistory(all.slice(0, 20))
    }
    load()
  }, [generateOpen])

  async function handleGenerate() {
    if (!selectedMember) return
    if (!pastorName.trim()) { alert('Informe o nome do Pastor Presidente'); return }

    setIsGenerating(true)
    const now = new Date().toISOString()
    const congregation = congregationMap[selectedMember.congregation_id] ?? null

    try {
      if (docType === 'recomendacao') {
        const letterNumber = await generateLetterNumber('recomendacao')
        const doc = (
          <RecommendationLetterPDF
            member={selectedMember}
            congregation={congregation}
            letterNumber={letterNumber}
            pastorName={pastorName}
            issuedAt={now}
          />
        )
        const blob = await pdf(doc).toBlob()
        downloadBlob(blob, `${letterNumber}.pdf`)

        const record = {
          id: uuidv4(), letter_type: 'recomendacao' as const,
          member_id: selectedMember.id, destination: null, destination_city: null,
          issued_by: appUser?.id ?? null, issued_at: now, letter_number: letterNumber,
          notes: null, created_at: now, updated_at: now,
        }
        await syncWrite('letters', record, 'INSERT')

      } else if (docType === 'transferencia') {
        if (!destination.trim()) { alert('Informe a igreja de destino'); return }
        if (!destinationCity.trim()) { alert('Informe a cidade de destino'); return }

        const letterNumber = await generateLetterNumber('transferencia')
        const doc = (
          <TransferLetterPDF
            member={selectedMember}
            congregation={congregation}
            letterNumber={letterNumber}
            pastorName={pastorName}
            issuedAt={now}
            destination={destination}
            destinationCity={destinationCity}
          />
        )
        const blob = await pdf(doc).toBlob()
        downloadBlob(blob, `${letterNumber}.pdf`)

        const record = {
          id: uuidv4(), letter_type: 'transferencia' as const,
          member_id: selectedMember.id, destination, destination_city: destinationCity,
          issued_by: appUser?.id ?? null, issued_at: now, letter_number: letterNumber,
          notes: null, created_at: now, updated_at: now,
        }
        await syncWrite('letters', record, 'INSERT')

      } else if (docType === 'cracha') {
        const badgeNumber = await generateBadgeNumber()
        const doc = (
          <MemberBadgePDF
            member={selectedMember}
            congregation={congregation}
            badgeNumber={badgeNumber}
            pastorName={pastorName}
          />
        )
        const blob = await pdf(doc).toBlob()
        downloadBlob(blob, `${badgeNumber}.pdf`)

        const record = {
          id: uuidv4(), member_id: selectedMember.id,
          issued_by: appUser?.id ?? null, issued_at: now,
          badge_number: badgeNumber, created_at: now, updated_at: now,
        }
        await syncWrite('badges', record, 'INSERT')
      }

      setGenerateOpen(false)
      setSelectedMember(null)
      setDestination('')
      setDestinationCity('')
    } catch (e) {
      console.error('Erro ao gerar PDF:', e)
      alert('Erro ao gerar o documento. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const canGenerate = docType === 'cracha' ? canGenerateBadges : canGenerateLetters

  return (
    <AppShell title="Documentos">
      <div className="p-4 lg:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Documentos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cartas e crachás</p>
          </div>
          <Button size="sm" leftIcon={<FileText size={15} />} onClick={() => setGenerateOpen(true)}>
            Emitir documento
          </Button>
        </div>

        {/* Tipo cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DocTypeCard
            icon={<FileCheck size={20} />}
            title="Carta de Recomendação"
            description="Para membros apresentados a outra congregação"
            color="blue"
            onClick={() => { setDocType('recomendacao'); setGenerateOpen(true) }}
            disabled={!canGenerateLetters}
          />
          <DocTypeCard
            icon={<FileText size={20} />}
            title="Carta de Transferência"
            description="Para membros que se transferem para outra igreja"
            color="purple"
            onClick={() => { setDocType('transferencia'); setGenerateOpen(true) }}
            disabled={!canGenerateLetters}
          />
          <DocTypeCard
            icon={<Award size={20} />}
            title="Crachá"
            description="Frente e verso para impressão e plastificação"
            color="amber"
            onClick={() => { setDocType('cracha'); setGenerateOpen(true) }}
            disabled={!canGenerateBadges}
          />
        </div>

        {/* Histórico */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700"
            >
              <span className="flex items-center gap-2">
                <History size={15} className="text-slate-400" />
                Documentos emitidos ({history.length})
              </span>
              {showHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showHistory && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {history.map((item) => {
                  const isLetter = 'letter_type' in item
                  const number = isLetter
                    ? (item as Letter).letter_number
                    : (item as Badge).badge_number
                  const type = isLetter
                    ? (item as Letter).letter_type === 'recomendacao'
                      ? 'Recomendação' : 'Transferência'
                    : 'Crachá'
                  const colorClass = isLetter
                    ? (item as Letter).letter_type === 'recomendacao'
                      ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    : 'bg-amber-100 text-amber-700'

                  return (
                    <div key={item.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
                        {type}
                      </span>
                      <span className="text-sm text-slate-700 font-mono flex-1">{number}</span>
                      <span className="text-xs text-slate-400">
                        {formatDate(item.issued_at, 'short')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: gerar */}
      <Modal
        isOpen={generateOpen}
        onClose={() => { setGenerateOpen(false); setSelectedMember(null) }}
        title="Emitir Documento"
        size="md"
      >
        <div className="flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Tipo de documento</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'recomendacao' as const, label: 'Recomendação', ok: canGenerateLetters },
                { value: 'transferencia' as const, label: 'Transferência', ok: canGenerateLetters },
                { value: 'cracha' as const, label: 'Crachá', ok: canGenerateBadges },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => opt.ok && setDocType(opt.value)}
                  disabled={!opt.ok}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    !opt.ok ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400' :
                    docType === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Busca membro */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600">
              Membro <span className="text-red-500">*</span>
            </label>
            {selectedMember ? (
              <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <Avatar src={selectedMember.photo_url ?? undefined} name={selectedMember.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{selectedMember.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedMember.church_role ?? 'Membro'} · {congregationMap[selectedMember.congregation_id]?.name}
                  </p>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar membro..."
                    value={searchRaw}
                    onChange={(e) => setSearchRaw(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                {searchRaw && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {isLoading ? (
                      <p className="text-xs text-slate-400 p-3 text-center">Buscando...</p>
                    ) : members.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 text-center">Nenhum membro encontrado</p>
                    ) : (
                      members.slice(0, 10).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMember(m); setSearchRaw('') }}
                          className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                        >
                          <Avatar src={m.photo_url ?? undefined} name={m.full_name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{m.full_name}</p>
                            <p className="text-xs text-slate-500">{m.church_role ?? 'Membro'}</p>
                          </div>
                          <MemberStatusBadge status={m.status} />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Transferência extras */}
          {docType === 'transferencia' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Igreja de destino <span className="text-red-500">*</span>
                </label>
                <input
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Assembleia de Deus Central"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Cidade de destino <span className="text-red-500">*</span>
                </label>
                <input
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Salvador — BA"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Pastor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Nome do Pastor Presidente <span className="text-red-500">*</span>
            </label>
            <input
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Pastor João da Silva"
              value={pastorName}
              onChange={(e) => setPastorName(e.target.value)}
            />
          </div>

          {!canGenerate && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
              Você não tem permissão para gerar este tipo de documento.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => { setGenerateOpen(false); setSelectedMember(null) }}>
              Cancelar
            </Button>
            <Button
              size="sm"
              leftIcon={<Download size={14} />}
              isLoading={isGenerating}
              disabled={!selectedMember || !canGenerate}
              onClick={handleGenerate}
            >
              Gerar PDF
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}

function DocTypeCard({
  icon, title, description, color, onClick, disabled,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: 'blue' | 'purple' | 'amber'
  onClick: () => void
  disabled?: boolean
}) {
  const c = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'hover:border-blue-300' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'hover:border-purple-300' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'hover:border-amber-300' },
  }[color]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'bg-white rounded-xl border border-slate-100 p-4 text-left flex flex-col gap-2 transition-all',
        disabled ? 'opacity-50 cursor-not-allowed' : `hover:shadow-md ${c.border}`,
      ].join(' ')}
    >
      <div className={`w-9 h-9 ${c.bg} ${c.icon} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  )
}
