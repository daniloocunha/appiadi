import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { db } from '@/lib/db'
import { getBirthdaysInMonth } from '@/hooks/useEvents'
import { useCongregations } from '@/hooks/useCongregations'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/formatters'
import type { ChurchEvent } from '@/types'
import {
  Users, Building2, CalendarDays, ClipboardList, ChevronRight
} from 'lucide-react'
import { logger } from '@/utils/logger'

interface Stats {
  totalMembers: number
  activeMembers: number
  totalCongregations: number
  pendingRegistrations: number
  upcomingEvents: ChurchEvent[]
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { appUser } = useAuthStore()
  const { congregations } = useCongregations()
  const today = new Date()

  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    totalCongregations: 0,
    pendingRegistrations: 0,
    upcomingEvents: [],
  })

  const [birthdays, setBirthdays] = useState<Awaited<ReturnType<typeof getBirthdaysInMonth>>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [members, events, pending] = await Promise.all([
          db.members.filter((m) => !m.deleted_at).toArray(),
          db.events.filter((e) => !e.deleted_at).toArray(),
          db.self_registrations.filter((r) => r.status === 'pendente').count(),
        ])

        const todayStr = today.toISOString().split('T')[0]
        const upcoming = (events as ChurchEvent[])
          .filter((e) => e.event_date >= todayStr)
          .sort((a, b) => a.event_date.localeCompare(b.event_date))
          .slice(0, 3)

        setStats({
          totalMembers: members.length,
          activeMembers: members.filter((m) => m.status === 'ativo').length,
          totalCongregations: congregations.length,
          pendingRegistrations: pending,
          upcomingEvents: upcoming,
        })

        // Aniversariantes da semana (próximos 7 dias)
        const monthBirthdays = await getBirthdaysInMonth(today.getMonth() + 1)
        const todayDay = today.getDate()
        const weekBirthdays = monthBirthdays.filter((b) => {
          const day = parseInt(b.birth_date.split('-')[2])
          return day >= todayDay && day <= todayDay + 7
        })
        setBirthdays(weekBirthdays)
      } catch (e) {
        logger.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [congregations.length])

  const congregationMap = Object.fromEntries(congregations.map((c) => [c.id, c]))

  const greeting = () => {
    const h = today.getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <AppShell title="Início">
      <div className="p-4 lg:p-6 flex flex-col gap-4">
        {/* Boas-vindas */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-blue-200 text-xs mb-0.5">{greeting()},</p>
          <h2 className="text-base font-bold">
            {appUser?.full_name ?? 'Bem-vindo!'}
          </h2>
          <p className="text-xs text-blue-300 mt-1">
            {formatDate(today, 'long')}
          </p>
        </div>

        {/* Cards de estatísticas */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Users size={18} />}
              label="Membros Ativos"
              value={stats.activeMembers}
              sub={`de ${stats.totalMembers} total`}
              color="blue"
              onClick={() => navigate('/members')}
            />
            <StatCard
              icon={<Building2 size={18} />}
              label="Congregações"
              value={stats.totalCongregations}
              color="purple"
              onClick={() => navigate('/congregations')}
            />
            <StatCard
              icon={<CalendarDays size={18} />}
              label="Próximos Eventos"
              value={stats.upcomingEvents.length}
              color="green"
              onClick={() => navigate('/calendar')}
            />
            <StatCard
              icon={<ClipboardList size={18} />}
              label="Cadastros Pend."
              value={stats.pendingRegistrations}
              color={stats.pendingRegistrations > 0 ? 'amber' : 'slate'}
              onClick={() => navigate('/registrations')}
            />
          </div>
        )}

        {/* Aniversariantes da semana */}
        {birthdays.length > 0 && (
          <Section
            title="🎂 Aniversariantes desta semana"
            action={<button onClick={() => navigate('/calendar')} className="text-xs text-blue-600">Ver todos</button>}
          >
            <div className="flex flex-col gap-2">
              {birthdays.map((b) => {
                const day = parseInt(b.birth_date.split('-')[2])
                const isToday = day === today.getDate()
                return (
                  <div key={b.id} className={[
                    'flex items-center gap-3 p-3 rounded-xl border',
                    isToday ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100',
                  ].join(' ')}>
                    <div className={[
                      'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                      isToday ? 'bg-amber-400 text-white' : 'bg-blue-50 text-blue-700',
                    ].join(' ')}>
                      {day}
                    </div>
                    <Avatar src={b.photo_url ?? undefined} name={b.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {b.full_name}
                        {isToday && ' 🎉'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.church_role ?? 'Membro'}
                        {congregationMap[b.congregation_id]
                          ? ` · ${congregationMap[b.congregation_id].name}`
                          : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Próximos eventos */}
        {stats.upcomingEvents.length > 0 && (
          <Section
            title="📅 Próximos eventos"
            action={<button onClick={() => navigate('/calendar')} className="text-xs text-blue-600">Ver calendário</button>}
          >
            <div className="flex flex-col gap-2">
              {stats.upcomingEvents.map((event) => {
                const parts = event.event_date.split('-')
                const day = parts[2]
                const monthNum = parseInt(parts[1])
                return (
                  <div key={event.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-blue-700 leading-none">{day}</span>
                      <span className="text-xs text-blue-400">
                        {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][monthNum - 1]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                      {event.event_time && (
                        <p className="text-xs text-slate-500">{event.event_time}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Alertas */}
        {stats.pendingRegistrations > 0 && (
          <button
            onClick={() => navigate('/registrations')}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 hover:bg-amber-100 transition-colors text-left"
          >
            <ClipboardList size={20} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {stats.pendingRegistrations} cadastro{stats.pendingRegistrations !== 1 ? 's' : ''} pendente{stats.pendingRegistrations !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600">Toque para revisar e aprovar</p>
            </div>
            <ChevronRight size={16} className="text-amber-400 shrink-0" />
          </button>
        )}
      </div>
    </AppShell>
  )
}

// ---- StatCard ----
function StatCard({
  icon, label, value, sub, color, onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  color: 'blue' | 'purple' | 'green' | 'amber' | 'slate'
  onClick?: () => void
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   num: 'text-blue-800' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', num: 'text-purple-800' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  num: 'text-green-800' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  num: 'text-amber-800' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-500',  num: 'text-slate-700' },
  }
  const c = colors[color]

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md hover:border-slate-200 transition-all"
    >
      <div className={`w-8 h-8 ${c.bg} ${c.text} rounded-lg flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${c.num}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </button>
  )
}

// ---- Section ----
function Section({
  title, action, children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}
