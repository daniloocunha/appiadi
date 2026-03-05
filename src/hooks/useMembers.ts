import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { syncWrite } from '@/lib/sync'
import { useSyncStore } from '@/store/syncStore'
import type { Member } from '@/types'
import type { MemberFormData } from '@/schemas/member.schema'
import { v4 as uuidv4 } from 'uuid'
import { uploadMemberPhoto } from '@/utils/photoUpload'
import { logger } from '@/utils/logger'
import { useDebounce } from '@/hooks/useDebounce'

// ============================================================
// Hook: useMembers
// Lê do IndexedDB (offline-first), sincroniza com Supabase
// ============================================================

export interface MemberFilters {
  search?: string
  congregation_id?: string
  status?: string
  church_role?: string
}

export function useMembers(filters?: MemberFilters) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Recarrega sempre que o sync remoto atualizar o IndexedDB
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)

  // Debounce na busca textual para não filtrar a cada keystroke
  const debouncedSearch = useDebounce(filters?.search, 300)

  const loadFromLocal = useCallback(async () => {
    try {
      let query = db.members.filter((m) => !m.deleted_at)

      const all = await query.toArray()

      let filtered = all as Member[]

      // Filtros em memória (IndexedDB não suporta queries complexas facilmente)
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        filtered = filtered.filter(
          (m) =>
            m.full_name.toLowerCase().includes(q) ||
            m.phone?.includes(q) ||
            m.cpf?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
            m.email?.toLowerCase().includes(q)
        )
      }

      if (filters?.congregation_id) {
        filtered = filtered.filter((m) => m.congregation_id === filters.congregation_id)
      }

      if (filters?.status) {
        filtered = filtered.filter((m) => m.status === filters.status)
      }

      if (filters?.church_role) {
        filtered = filtered.filter((m) => m.church_role === filters.church_role)
      }

      // Ordenar por nome
      filtered.sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))

      setMembers(filtered)
    } catch (e) {
      setError('Erro ao carregar membros locais')
      logger.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, filters?.congregation_id, filters?.status, filters?.church_role, lastSyncAt])

  useEffect(() => {
    loadFromLocal()
  }, [loadFromLocal])

  async function saveMember(
    data: MemberFormData,
    photoFile: File | null,
    existingId?: string
  ): Promise<{ id: string; error: string | null }> {
    const now = new Date().toISOString()
    const id = existingId ?? uuidv4()

    let created_at = now
    let photo_url: string | null = null

    if (existingId) {
      const existing = await db.members.get(existingId)
      if (existing) {
        created_at = existing.created_at
        photo_url = existing.photo_url ?? null
      }
    }

    // Upload de foto se fornecida
    if (photoFile) {
      try {
        const result = await uploadMemberPhoto(photoFile, id)
        if (result.url) photo_url = result.url
        else logger.warn('Falha ao fazer upload da foto:', result.error)
      } catch (e) {
        logger.warn('Falha ao fazer upload da foto:', e)
        // Não bloqueia o salvamento
      }
    }

    const record: Member = {
      id,
      full_name: data.full_name,
      birth_date: data.birth_date ?? null,
      baptism_date: data.baptism_date ?? null,
      holy_spirit_date: data.holy_spirit_date ?? null,
      father_name: data.father_name ?? null,
      mother_name: data.mother_name ?? null,
      cpf: data.cpf ?? null,
      rg: data.rg ?? null,
      phone: data.phone ?? null,
      phone_secondary: data.phone_secondary ?? null,
      email: data.email || null,
      address_street: data.address_street ?? null,
      address_number: data.address_number ?? null,
      address_complement: data.address_complement ?? null,
      address_neighborhood: data.address_neighborhood ?? null,
      address_city: data.address_city ?? null,
      address_state: data.address_state ?? null,
      address_zip: data.address_zip ?? null,
      marital_status: data.marital_status ?? null,
      spouse_name: data.spouse_name ?? null,
      occupation: data.occupation ?? null,
      congregation_id: data.congregation_id,
      status: data.status,
      church_role: data.church_role ?? null,
      ministry: data.ministry ?? null,
      photo_url,
      notes: data.notes ?? null,
      member_number: null, // gerado pelo banco
      joined_at: data.joined_at ?? null,
      self_registered: false,
      approved_at: null,
      approved_by: null,
      created_by: null,
      updated_by: null,
      created_at,
      updated_at: now,
      deleted_at: null,
      // Campos adicionais
      escolaridade: data.escolaridade ?? null,
      titulo_eleitor: data.titulo_eleitor ?? null,
      zona_eleitoral: data.zona_eleitoral ?? null,
      secao_eleitoral: data.secao_eleitoral ?? null,
      batismo_pastor: data.batismo_pastor ?? null,
      batismo_local: data.batismo_local ?? null,
      recebeu_carta_transferencia: data.recebeu_carta_transferencia ?? false,
      data_carta_transferencia: data.data_carta_transferencia ?? null,
      denominacao_origem: data.denominacao_origem ?? null,
      naturalidade: data.naturalidade ?? null,
      naturalidade_uf: data.naturalidade_uf ?? null,
    }

    try {
      await syncWrite('members', record, existingId ? 'UPDATE' : 'INSERT')
      await loadFromLocal()
      return { id, error: null }
    } catch (e) {
      return { id, error: String(e) }
    }
  }

  async function deleteMember(id: string): Promise<{ error: string | null }> {
    const now = new Date().toISOString()
    const existing = await db.members.get(id)
    if (!existing) return { error: 'Membro não encontrado' }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _synced, ...rest } = existing
    const record: Member = {
      ...rest,
      deleted_at: now,
      updated_at: now,
    }

    try {
      await syncWrite('members', record, 'DELETE')
      await loadFromLocal()
      return { error: null }
    } catch (e) {
      return { error: String(e) }
    }
  }

  return {
    members,
    isLoading,
    error,
    reload: loadFromLocal,
    saveMember,
    deleteMember,
  }
}

/** Busca um membro pelo ID (local primeiro, depois Supabase) */
export async function fetchMemberById(id: string): Promise<Member | null> {
  const local = await db.members.get(id)
  if (local && !local.deleted_at) return local as Member

  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  return data ?? null
}
