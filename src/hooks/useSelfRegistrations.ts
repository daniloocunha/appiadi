import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { syncWrite } from '@/lib/sync'
import { v4 as uuidv4 } from 'uuid'
import type { SelfRegistration, Member } from '@/types'

// ============================================================
// Hook: useSelfRegistrations
// Gerencia auto-cadastros pendentes de aprovação
// ============================================================

export function useSelfRegistrations() {
  const [registrations, setRegistrations] = useState<SelfRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  // Busca direto do Supabase (fonte de verdade) e atualiza o IndexedDB local
  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Tenta buscar pendentes direto do Supabase
      const { data, error: sbError } = await supabase
        .from('self_registrations')
        .select('*')
        .eq('status', 'pendente')
        .order('submitted_at', { ascending: false })

      if (!sbError && data && data.length > 0) {
        // Salva no IndexedDB para acesso offline
        await db.self_registrations.bulkPut(
          data.map((r) => ({ ...r, _synced: true }))
        )
        setRegistrations(data as SelfRegistration[])
        return
      }

      // 2. Fallback: lê do IndexedDB se Supabase falhou ou não há dados online
      const local = await db.self_registrations
        .filter((r) => r.status === 'pendente')
        .toArray()
      local.sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )
      setRegistrations(local as SelfRegistration[])
    } catch (e) {
      setError('Erro ao carregar cadastros pendentes')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Mantém loadFromLocal como alias para compatibilidade
  const loadFromLocal = load

  /** Aprova um auto-cadastro: cria o membro e marca o registro como aprovado */
  async function approveRegistration(
    registration: SelfRegistration,
    congregationId: string,
    approverId: string
  ): Promise<{ error: string | null }> {
    const now = new Date().toISOString()
    const memberId = uuidv4()

    // Monta o registro de membro a partir dos dados do auto-cadastro
    const member: Member = {
      id: memberId,
      full_name: registration.full_name,
      birth_date: registration.birth_date,
      baptism_date: registration.baptism_date ?? null,
      holy_spirit_date: registration.holy_spirit_date ?? null,
      father_name: registration.father_name,
      mother_name: registration.mother_name,
      cpf: registration.cpf,
      rg: registration.rg,
      phone: registration.phone,
      phone_secondary: null,
      email: registration.email,
      address_street: registration.address_street,
      address_number: registration.address_number,
      address_complement: registration.address_complement,
      address_neighborhood: registration.address_neighborhood,
      address_city: registration.address_city,
      address_state: registration.address_state,
      address_zip: registration.address_zip,
      marital_status: registration.marital_status,
      spouse_name: registration.spouse_name,
      occupation: registration.occupation,
      congregation_id: congregationId,
      status: 'em_experiencia',
      church_role: registration.church_role,
      ministry: registration.ministry,
      photo_url: registration.photo_url,
      notes: null,
      member_number: null,
      joined_at: now.split('T')[0],
      self_registered: true,
      approved_at: now,
      approved_by: approverId,
      created_by: approverId,
      updated_by: approverId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      // Campos adicionais do auto-cadastro
      escolaridade: registration.escolaridade ?? null,
      titulo_eleitor: registration.titulo_eleitor ?? null,
      zona_eleitoral: registration.zona_eleitoral ?? null,
      secao_eleitoral: registration.secao_eleitoral ?? null,
      batismo_pastor: registration.batismo_pastor ?? null,
      batismo_local: registration.batismo_local ?? null,
      recebeu_carta_transferencia: false,
      data_carta_transferencia: null,
      denominacao_origem: null,
    }

    // Registro de auto-cadastro atualizado como aprovado
    const updatedReg: SelfRegistration = {
      ...registration,
      status: 'aprovado',
      reviewed_at: now,
      reviewed_by: approverId,
      updated_at: now,
    }

    try {
      await syncWrite('members', member, 'INSERT')
      await syncWrite('self_registrations', updatedReg, 'UPDATE')
      await loadFromLocal()
      return { error: null }
    } catch (e) {
      return { error: String(e) }
    }
  }

  /** Rejeita um auto-cadastro */
  async function rejectRegistration(
    registration: SelfRegistration,
    approverId: string
  ): Promise<{ error: string | null }> {
    const now = new Date().toISOString()
    const updatedReg: SelfRegistration = {
      ...registration,
      status: 'rejeitado',
      reviewed_at: now,
      reviewed_by: approverId,
      updated_at: now,
    }

    try {
      await syncWrite('self_registrations', updatedReg, 'UPDATE')
      await loadFromLocal()
      return { error: null }
    } catch (e) {
      return { error: String(e) }
    }
  }

  return {
    registrations,
    isLoading,
    error,
    reload: loadFromLocal,
    approveRegistration,
    rejectRegistration,
  }
}

// ============================================================
// Geração de token e link de auto-cadastro
// ============================================================

/** Gera um novo token UUID para link de auto-cadastro */
export function generateRegistrationToken(): string {
  return uuidv4()
}

/** Constrói o link de auto-cadastro a partir do token */
export function buildRegistrationLink(token: string): string {
  const base = window.location.origin
  return `${base}/cadastro?token=${token}`
}

// ============================================================
// Submissão pública (sem autenticação)
// ============================================================

export interface PublicRegistrationData {
  token: string
  full_name: string
  birth_date?: string | null
  phone?: string | null
  email?: string | null
  cpf?: string | null
  rg?: string | null
  father_name?: string | null
  mother_name?: string | null
  address_street?: string | null
  address_number?: string | null
  address_complement?: string | null
  address_neighborhood?: string | null
  address_city?: string | null
  address_state?: string | null
  address_zip?: string | null
  marital_status?: string | null
  spouse_name?: string | null
  occupation?: string | null
  church_role?: string | null
  ministry?: string | null
  congregation_id?: string | null
  photo_url?: string | null
  // Campos adicionais
  escolaridade?: string | null
  titulo_eleitor?: string | null
  zona_eleitoral?: string | null
  secao_eleitoral?: string | null
  baptism_date?: string | null
  holy_spirit_date?: string | null
  batismo_pastor?: string | null
  batismo_local?: string | null
}

/** Envia auto-cadastro diretamente ao Supabase (sem passar pelo IndexedDB — formulário público) */
export async function submitPublicRegistration(
  data: PublicRegistrationData
): Promise<{ id: string | null; error: string | null }> {
  const now = new Date().toISOString()
  const id = uuidv4()

  const record = {
    id,
    token: data.token,
    full_name: data.full_name,
    birth_date: data.birth_date ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    cpf: data.cpf ?? null,
    rg: data.rg ?? null,
    father_name: data.father_name ?? null,
    mother_name: data.mother_name ?? null,
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
    church_role: data.church_role ?? null,
    ministry: data.ministry ?? null,
    congregation_id: data.congregation_id ?? null,
    photo_url: data.photo_url ?? null,
    escolaridade: data.escolaridade ?? null,
    titulo_eleitor: data.titulo_eleitor ?? null,
    zona_eleitoral: data.zona_eleitoral ?? null,
    secao_eleitoral: data.secao_eleitoral ?? null,
    baptism_date: data.baptism_date ?? null,
    holy_spirit_date: data.holy_spirit_date ?? null,
    batismo_pastor: data.batismo_pastor ?? null,
    batismo_local: data.batismo_local ?? null,
    status: 'pendente',
    submitted_at: now,
    reviewed_at: null,
    reviewed_by: null,
    updated_at: now,
  }

  const { error } = await supabase.from('self_registrations').insert(record)

  if (error) return { id: null, error: error.message }
  return { id, error: null }
}
