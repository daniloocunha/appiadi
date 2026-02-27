import type { MemberStatus } from '@/types'

const STATUS_CONFIG: Record<
  MemberStatus,
  { label: string; className: string }
> = {
  ativo:         { label: 'Ativo',         className: 'bg-green-100 text-green-700' },
  inativo:       { label: 'Inativo',       className: 'bg-slate-100 text-slate-600' },
  transferido:   { label: 'Transferido',   className: 'bg-blue-100 text-blue-700' },
  falecido:      { label: 'Falecido',      className: 'bg-gray-200 text-gray-600' },
  excluido:      { label: 'Excluído',      className: 'bg-red-100 text-red-700' },
  em_experiencia:{ label: 'Em Experiência',className: 'bg-amber-100 text-amber-700' },
}

interface MemberStatusBadgeProps {
  status: MemberStatus
  className?: string
}

export function MemberStatusBadge({ status, className = '' }: MemberStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inativo
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className,
      ].join(' ')}
    >
      {config.label}
    </span>
  )
}
