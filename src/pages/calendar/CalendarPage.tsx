import { useState, useEffect, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { useEvents, getBirthdaysInMonth, EVENT_TYPE_LABELS, eventSchema } from '@/hooks/useEvents'
import { useCongregations } from '@/hooks/useCongregations'
import { usePermission } from '@/hooks/usePermission'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { EventFormData } from '@/hooks/useEvents'
import type { ChurchEvent } from '@/types'
import { getMonthName } from '@/utils/formatters'
import {
  ChevronLeft, ChevronRight, Plus, Cake, CalendarDays,
  MapPin, Clock, Trash2, Pencil, Building2, X
} from 'lucide-react'

type Tab = 'eventos' | 'aniversariantes'

// Cores por tipo de evento
const EVENT_TYPE_DOT: Record<string, string> = {
  culto:                   'bg-blue-500',
  reuniao:                 'bg-purple-500',
  conferencia:             'bg-green-500',
  retiro:                  'bg-amber-500',
  aniversario_congregacao: 'bg-pink-500',
  outro:                   'bg-slate-400',
}

const EVENT_TYPE_BADGE: Record<string, string> = {
  culto:                   'bg-blue-100 text-blue-700',
  reuniao:                 'bg-purple-100 text-purple-700',
  conferencia:             'bg-green-100 text-green-700',
  retiro:                  'bg-amber-100 text-amber-700',
  aniversario_congregacao: 'bg-pink-100 text-pink-700',
  outro:                   'bg-slate-100 text-slate-600',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ---- Grade mensal ----
function MonthGrid({
  month, year, events, birthdays, selectedDay, onSelectDay,
}: {
  month: number
  year: number
  events: ChurchEvent[]
  birthdays: Array<{ birth_date: string }>
  selectedDay: number | null
  onSelectDay: (day: number | null) => void
}) {
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Dom
  const daysInMonth = new Date(year, month, 0).getDate()

  const eventsByDay = useMemo(() => {
    const map: Record<number, ChurchEvent[]> = {}
    for (const ev of events) {
      const day = parseInt(ev.event_date.split('-')[2])
      if (!map[day]) map[day] = []
      map[day].push(ev)
    }
    return map
  }, [events])

  const birthdayDays = useMemo(() => {
    const set = new Set<number>()
    for (const b of birthdays) {
      const day = parseInt(b.birth_date.split('-')[2])
      set.add(day)
    }
    return set
  }, [birthdays])

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Completa última linha com células vazias para o grid ficar uniforme
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`e${idx}`}
                className="h-14 border-b border-r border-slate-50 bg-slate-50/40 last:border-r-0"
              />
            )
          }
          const isToday = isCurrentMonth && day === today.getDate()
          const isSelected = day === selectedDay
          const dayEvents = eventsByDay[day] ?? []
          const hasBirthday = birthdayDays.has(day)
          const isLastRow = idx >= cells.length - 7
          const isLastCol = (idx + 1) % 7 === 0

          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={[
                'h-14 flex flex-col items-center pt-1.5 gap-0.5 transition-colors',
                !isLastRow ? 'border-b' : '',
                !isLastCol ? 'border-r' : '',
                'border-slate-100',
                isSelected ? 'bg-blue-50' : 'hover:bg-slate-50',
              ].join(' ')}
            >
              <span className={[
                'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium leading-none',
                isToday
                  ? 'bg-blue-600 text-white'
                  : isSelected
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-700',
              ].join(' ')}>
                {day}
              </span>
              <div className="flex items-center gap-0.5 flex-wrap justify-center px-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${EVENT_TYPE_DOT[ev.event_type] ?? 'bg-slate-400'}`}
                  />
                ))}
                {hasBirthday && <Cake size={8} className="text-amber-500 shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [tab, setTab] = useState<Tab>('eventos')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChurchEvent | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { events, isLoading, saveEvent, deleteEvent, reload } = useEvents(month, year)
  const { congregations } = useCongregations()
  const { canManageEvents } = usePermission()

  const [birthdays, setBirthdays] = useState<Awaited<ReturnType<typeof getBirthdaysInMonth>>>([])
  useEffect(() => {
    getBirthdaysInMonth(month).then(setBirthdays)
  }, [month])

  useEffect(() => { setSelectedDay(null) }, [month, year])

  const congregationMap = Object.fromEntries(congregations.map((c) => [c.id, c]))

  const filteredEvents = useMemo(() => {
    if (!selectedDay) return events
    const pad = String(selectedDay).padStart(2, '0')
    const prefix = `${year}-${String(month).padStart(2, '0')}-${pad}`
    return events.filter((e) => e.event_date === prefix)
  }, [events, selectedDay, month, year])

  const filteredBirthdays = useMemo(() => {
    if (!selectedDay) return birthdays
    return birthdays.filter((b) => parseInt(b.birth_date.split('-')[2]) === selectedDay)
  }, [birthdays, selectedDay])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <AppShell title="Calendário">
      <div className="p-4 lg:p-6 flex flex-col gap-4">

        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-slate-800 min-w-[140px] text-center capitalize">
              {getMonthName(month)} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
              <ChevronRight size={18} />
            </button>
          </div>
          {canManageEvents && (
            <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => { setEditingEvent(null); setFormOpen(true) }}>
              Novo Evento
            </Button>
          )}
        </div>

        {/* Grade visual */}
        <MonthGrid
          month={month} year={year}
          events={events} birthdays={birthdays}
          selectedDay={selectedDay} onSelectDay={setSelectedDay}
        />

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-0.5">
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${EVENT_TYPE_DOT[key]}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Cake size={10} className="text-amber-500" />
            Aniversário
          </span>
        </div>

        {/* Chip do dia selecionado */}
        {selectedDay && (
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
            <CalendarDays size={14} className="text-blue-600" />
            <span className="text-sm text-blue-700 font-medium flex-1">
              {selectedDay} de {getMonthName(month)} — filtrando
            </span>
            <button onClick={() => setSelectedDay(null)} className="text-blue-400 hover:text-blue-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tabs eventos / aniversariantes */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['eventos', 'aniversariantes'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {t === 'eventos' ? <CalendarDays size={14} /> : <Cake size={14} />}
              {t === 'eventos'
                ? `Eventos (${filteredEvents.length})`
                : `Aniversariantes (${filteredBirthdays.length})`}
            </button>
          ))}
        </div>

        {/* Lista de Eventos */}
        {tab === 'eventos' && (
          isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-slate-100 h-20 animate-pulse" />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <CalendarDays size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {selectedDay
                  ? `Nenhum evento em ${selectedDay} de ${getMonthName(month)}`
                  : `Nenhum evento em ${getMonthName(month)}`}
              </p>
              {canManageEvents && !selectedDay && (
                <button
                  onClick={() => { setEditingEvent(null); setFormOpen(true) }}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Criar primeiro evento do mês
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex gap-3">
                  <div className="w-12 shrink-0 flex flex-col items-center justify-center bg-blue-50 rounded-lg py-2">
                    <span className="text-xl font-bold text-blue-700 leading-none">
                      {event.event_date.split('-')[2]}
                    </span>
                    <span className="text-xs text-blue-500 capitalize">
                      {getMonthName(parseInt(event.event_date.split('-')[1])).slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${EVENT_TYPE_BADGE[event.event_type] ?? EVENT_TYPE_BADGE.outro}`}>
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </span>
                        <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                      </div>
                      {canManageEvents && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingEvent(event); setFormOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(event)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {event.event_time && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} />
                          {event.event_time}{event.end_time && ` — ${event.end_time}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={11} />{event.location}
                        </span>
                      )}
                      {event.congregation_id && congregationMap[event.congregation_id] && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Building2 size={11} />{congregationMap[event.congregation_id].name}
                        </span>
                      )}
                    </div>
                    {event.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Aniversariantes */}
        {tab === 'aniversariantes' && (
          filteredBirthdays.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <Cake size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {selectedDay
                  ? `Nenhum aniversariante em ${selectedDay} de ${getMonthName(month)}`
                  : `Nenhum aniversariante em ${getMonthName(month)}`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredBirthdays.map((b) => {
                const day = parseInt(b.birth_date.split('-')[2])
                const isToday = day === today.getDate() && month === today.getMonth() + 1
                return (
                  <div key={b.id} className={`bg-white rounded-xl border p-3.5 flex items-center gap-3 ${isToday ? 'border-amber-300 bg-amber-50' : 'border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${isToday ? 'bg-amber-400 text-white' : 'bg-blue-50 text-blue-700'}`}>
                      {day}
                    </div>
                    <Avatar src={b.photo_url ?? undefined} name={b.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5">
                        {b.full_name}
                        {isToday && <Cake size={13} className="text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.church_role ?? 'Membro'}
                        {congregationMap[b.congregation_id] ? ` · ${congregationMap[b.congregation_id].name}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Modal: evento */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingEvent ? 'Editar Evento' : 'Novo Evento'} size="md">
        <EventForm
          initialData={editingEvent ?? undefined}
          congregations={congregations}
          defaultDate={
            selectedDay
              ? `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
              : undefined
          }
          onSave={async (data) => {
            await saveEvent(data, editingEvent?.id)
            await reload()
            setFormOpen(false)
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Modal: excluir */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Evento"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={async () => {
              if (!deleteTarget) return
              setIsDeleting(true)
              await deleteEvent(deleteTarget.id)
              setDeleteTarget(null)
              setIsDeleting(false)
            }}>Excluir</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Excluir o evento <strong className="text-slate-800">{deleteTarget?.title}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </AppShell>
  )
}

// ---- Formulário de evento ----
function EventForm({
  initialData, congregations, defaultDate, onSave, onCancel,
}: {
  initialData?: ChurchEvent
  congregations: import('@/types').Congregation[]
  defaultDate?: string
  onSave: (data: EventFormData) => Promise<void>
  onCancel: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      event_date: initialData?.event_date ?? defaultDate ?? '',
      event_time: initialData?.event_time ?? '',
      end_date: initialData?.end_date ?? '',
      end_time: initialData?.end_time ?? '',
      location: initialData?.location ?? '',
      congregation_id: initialData?.congregation_id ?? '',
      event_type: initialData?.event_type ?? 'culto',
    },
  })

  const inputClass = 'h-9 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Título <span className="text-red-500">*</span></label>
        <input className={inputClass} placeholder="Ex: Culto de Domingo" {...register('title')} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Tipo <span className="text-red-500">*</span></label>
          <select className={inputClass} {...register('event_type')}>
            <option value="culto">Culto</option>
            <option value="reuniao">Reunião</option>
            <option value="conferencia">Conferência</option>
            <option value="retiro">Retiro</option>
            <option value="aniversario_congregacao">Aniversário da Congregação</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Congregação</label>
          <select className={inputClass} {...register('congregation_id')}>
            <option value="">Todas</option>
            {congregations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Data <span className="text-red-500">*</span></label>
          <input type="date" className={inputClass} {...register('event_date')} />
          {errors.event_date && <p className="text-xs text-red-500">{errors.event_date.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Horário</label>
          <input type="time" className={inputClass} {...register('event_time')} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Local</label>
        <input className={inputClass} placeholder="Ex: Templo Central" {...register('location')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Descrição</label>
        <textarea rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalhes do evento..." {...register('description')} />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" isLoading={isSubmitting}>{initialData ? 'Salvar' : 'Criar evento'}</Button>
      </div>
    </form>
  )
}
