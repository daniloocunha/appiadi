import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { syncWrite } from '@/lib/sync'
import type { ChurchEvent, EventType } from '@/types'
import { EVENT_TYPES } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { logger } from '@/utils/logger'

export const eventSchema = z.object({
  title:          z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description:    z.string().nullable().optional(),
  event_date:     z.string().min(1, 'Data obrigatória'),
  event_time:     z.string().nullable().optional(),
  end_date:       z.string().nullable().optional(),
  end_time:       z.string().nullable().optional(),
  location:       z.string().nullable().optional(),
  congregation_id:z.string().nullable().optional(),
  event_type:     z.enum(EVENT_TYPES),
})

export type EventFormData = z.infer<typeof eventSchema>

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  culto: 'Culto',
  reuniao: 'Reunião',
  conferencia: 'Conferência',
  retiro: 'Retiro',
  aniversario_congregacao: 'Aniversário da Congregação',
  outro: 'Outro',
}

export function useEvents(month?: number, year?: number) {
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFromLocal()
  }, [month, year])

  async function loadFromLocal() {
    try {
      let all = await db.events
        .filter((e) => !e.deleted_at)
        .toArray()

      if (month !== undefined && year !== undefined) {
        const pad = (n: number) => String(n).padStart(2, '0')
        const prefix = `${year}-${pad(month)}`
        all = all.filter((e) => e.event_date.startsWith(prefix))
      }

      all.sort((a, b) => a.event_date.localeCompare(b.event_date))
      setEvents(all as ChurchEvent[])
    } catch (e) {
      logger.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveEvent(
    data: EventFormData,
    existingId?: string
  ): Promise<{ id: string; error: string | null }> {
    const now = new Date().toISOString()
    const id = existingId ?? uuidv4()

    let created_at = now
    if (existingId) {
      const existing = await db.events.get(existingId)
      if (existing) created_at = existing.created_at
    }

    const record: ChurchEvent = {
      id,
      title: data.title,
      description: data.description ?? null,
      event_date: data.event_date,
      event_time: data.event_time ?? null,
      end_date: data.end_date ?? null,
      end_time: data.end_time ?? null,
      location: data.location ?? null,
      congregation_id: data.congregation_id ?? null,
      event_type: data.event_type,
      created_by: null,
      created_at,
      updated_at: now,
      deleted_at: null,
    }

    try {
      await syncWrite('events', record, existingId ? 'UPDATE' : 'INSERT')
      await loadFromLocal()
      return { id, error: null }
    } catch (e) {
      return { id, error: String(e) }
    }
  }

  async function deleteEvent(id: string): Promise<{ error: string | null }> {
    const now = new Date().toISOString()
    const existing = await db.events.get(id)
    if (!existing) return { error: 'Evento não encontrado' }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _synced, ...rest } = existing
    const record: ChurchEvent = { ...rest, deleted_at: now, updated_at: now }

    try {
      await syncWrite('events', record, 'DELETE')
      await loadFromLocal()
      return { error: null }
    } catch (e) {
      return { error: String(e) }
    }
  }

  return { events, isLoading, reload: loadFromLocal, saveEvent, deleteEvent }
}

/** Busca aniversariantes de um mês específico */
export async function getBirthdaysInMonth(month: number): Promise<Array<{
  id: string
  full_name: string
  birth_date: string
  church_role: string | null
  congregation_id: string
  photo_url: string | null
}>> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const monthStr = `-${pad(month)}-`

  const members = await db.members
    .filter((m) => !m.deleted_at && m.status === 'ativo' && !!m.birth_date && m.birth_date.includes(monthStr))
    .toArray()

  return members
    .map((m) => ({
      id: m.id,
      full_name: m.full_name,
      birth_date: m.birth_date!,
      church_role: m.church_role ?? null,
      congregation_id: m.congregation_id,
      photo_url: m.photo_url ?? null,
    }))
    .sort((a, b) => {
      // Ordenar pelo dia do mês
      const dayA = parseInt(a.birth_date.split('-')[2])
      const dayB = parseInt(b.birth_date.split('-')[2])
      return dayA - dayB
    })
}
