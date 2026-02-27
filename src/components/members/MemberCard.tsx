import { Avatar } from '@/components/ui/Avatar'
import { MemberStatusBadge } from './MemberStatusBadge'
import type { Member, Congregation } from '@/types'
import { Phone, MapPin, ChevronRight } from 'lucide-react'

interface MemberCardProps {
  member: Member
  congregation?: Congregation
  onClick: () => void
}

export function MemberCard({ member, congregation, onClick }: MemberCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 flex items-center gap-3 hover:border-blue-200 hover:shadow-md transition-all text-left"
    >
      <Avatar
        src={member.photo_url ?? undefined}
        name={member.full_name}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {member.full_name}
          </p>
          <MemberStatusBadge status={member.status} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {member.church_role ?? 'Membro'}
          {congregation ? ` · ${congregation.name}` : ''}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {member.phone && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Phone size={10} />
              {member.phone}
            </span>
          )}
          {member.address_neighborhood && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={10} />
              {member.address_neighborhood}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 shrink-0" />
    </button>
  )
}
