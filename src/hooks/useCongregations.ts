import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { syncWrite } from '@/lib/sync'
import type { Congregation } from '@/types'
import type { CongregationFormData } from '@/schemas/congregation.schema'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/utils/logger'

// ============================================================
// Hook: useCongregations
// Lê do IndexedDB (offline-first), sincroniza com Supabase
// ============================================================

export function useCongregations() {
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFromLocal()
  }, [])

  async function loadFromLocal() {
    try {
      const local = await db.congregations
        .filter((c) => !c.deleted_at)
        .sortBy('name')
      setCongregations(local as Congregation[])
    } catch (e) {
      setError('Erro ao carregar congregações locais')
      logger.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveCongregation(
    data: CongregationFormData,
    existingId?: string
  ): Promise<{ id: string; error: string | null }> {
    const now = new Date().toISOString()
    const id = existingId ?? uuidv4()

    let created_at = now
    if (existingId) {
      const existing = await db.congregations.get(existingId)
      if (existing) created_at = existing.created_at
    }

    const record: Congregation = {
      id,
      name: data.name,
      address: data.address ?? null,
      city: data.city ?? null,
      neighborhood: data.neighborhood ?? null,
      phone: data.phone ?? null,
      dirigente_id: data.dirigente_id ?? null,
      is_headquarters: data.is_headquarters,
      created_at,
      updated_at: now,
      deleted_at: null,
    }

    try {
      await syncWrite('congregations', record, existingId ? 'UPDATE' : 'INSERT')
      await loadFromLocal()
      return { id, error: null }
    } catch (e) {
      return { id, error: String(e) }
    }
  }

  async function deleteCongregation(id: string): Promise<{ error: string | null }> {
    const now = new Date().toISOString()
    const existing = await db.congregations.get(id)
    if (!existing) return { error: 'Congregação não encontrada' }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _synced, ...rest } = existing
    const record: Congregation = {
      ...rest,
      deleted_at: now,
      updated_at: now,
    }

    try {
      await syncWrite('congregations', record, 'DELETE')
      await loadFromLocal()
      return { error: null }
    } catch (e) {
      return { error: String(e) }
    }
  }

  return {
    congregations,
    isLoading,
    error,
    reload: loadFromLocal,
    saveCongregation,
    deleteCongregation,
  }
}

/** Busca nome de um membro para exibir como dirigente */
export async function fetchMemberName(memberId: string): Promise<string> {
  const local = await db.members.get(memberId)
  if (local) return local.full_name

  const { data } = await supabase
    .from('members')
    .select('full_name')
    .eq('id', memberId)
    .single()

  return data?.full_name ?? 'Desconhecido'
}
