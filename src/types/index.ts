// ============================================================
// IADI - Tipos TypeScript centrais
// ============================================================

// Arrays as const — fonte única da verdade para enums usados no Zod e na UI
export const USER_ROLES = ['admin', 'secretario', 'lideranca_plena', 'pastor', 'presbitero', 'diacono_obreiro', 'midia'] as const
export type UserRole = typeof USER_ROLES[number]

export const MEMBER_STATUSES = ['ativo', 'inativo', 'transferido', 'falecido', 'excluido', 'em_experiencia'] as const
export type MemberStatus = typeof MEMBER_STATUSES[number]

export const MARITAL_STATUSES = ['solteiro', 'casado', 'divorciado', 'viuvo', 'separado'] as const
export type MaritalStatus = typeof MARITAL_STATUSES[number]

export const EVENT_TYPES = ['culto', 'reuniao', 'conferencia', 'retiro', 'aniversario_congregacao', 'outro'] as const
export type EventType = typeof EVENT_TYPES[number]

export const LETTER_TYPES = ['recomendacao', 'transferencia'] as const
export type LetterType = typeof LETTER_TYPES[number]

export const SELF_REGISTRATION_STATUSES = ['pendente', 'aprovado', 'rejeitado'] as const
export type SelfRegistrationStatus = typeof SELF_REGISTRATION_STATUSES[number]

// ---- Congregation ----
export interface Congregation {
  id: string
  name: string
  address: string | null
  city: string | null
  neighborhood: string | null
  phone: string | null
  dirigente_id: string | null
  is_headquarters: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ---- Member ----
export interface Member {
  id: string
  full_name: string
  birth_date: string | null          // ISO date string
  baptism_date: string | null
  holy_spirit_date: string | null
  father_name: string | null
  mother_name: string | null
  cpf: string | null
  rg: string | null
  phone: string | null
  phone_secondary: string | null
  email: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  marital_status: MaritalStatus | null
  spouse_name: string | null
  occupation: string | null
  congregation_id: string
  status: MemberStatus
  church_role: string | null
  ministry: string | null
  ministries: string[]
  is_congregation_leader: boolean
  photo_url: string | null
  notes: string | null
  member_number: number | null
  joined_at: string | null
  self_registered: boolean
  approved_at: string | null
  approved_by: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Campos adicionais
  escolaridade: string | null
  titulo_eleitor: string | null
  zona_eleitoral: string | null
  secao_eleitoral: string | null
  batismo_pastor: string | null
  batismo_local: string | null
  recebeu_carta_transferencia: boolean
  data_carta_transferencia: string | null
  denominacao_origem: string | null
  naturalidade: string | null
  naturalidade_uf: string | null
}

// ---- Member with congregation joined ----
export interface MemberWithCongregation extends Member {
  congregation: Pick<Congregation, 'id' | 'name' | 'is_headquarters'> | null
}

// ---- Event ----
export interface ChurchEvent {
  id: string
  title: string
  description: string | null
  event_date: string           // ISO date string
  event_time: string | null    // "HH:MM"
  end_date: string | null
  end_time: string | null
  location: string | null
  congregation_id: string | null  // null = all congregations
  event_type: EventType
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ---- Letter ----
export interface Letter {
  id: string
  letter_type: LetterType
  member_id: string
  destination: string | null
  destination_city: string | null
  issued_by: string | null
  issued_at: string
  letter_number: string
  notes: string | null
  created_at: string
  updated_at: string
}

// ---- Badge (Crachá) ----
export interface Badge {
  id: string
  member_id: string
  issued_by: string | null
  issued_at: string
  badge_number: string
  created_at: string
  updated_at: string
}

// ---- Self Registration ----
export interface SelfRegistration {
  id: string
  token: string
  full_name: string
  birth_date: string | null
  phone: string | null
  email: string | null
  cpf: string | null
  rg: string | null
  father_name: string | null
  mother_name: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  marital_status: MaritalStatus | null
  spouse_name: string | null
  occupation: string | null
  church_role: string | null
  ministry: string | null
  ministries: string[]
  is_congregation_leader: boolean
  congregation_id: string | null
  photo_url: string | null
  status: SelfRegistrationStatus
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  updated_at: string
  // Campos adicionais
  escolaridade: string | null
  titulo_eleitor: string | null
  zona_eleitoral: string | null
  secao_eleitoral: string | null
  baptism_date: string | null
  holy_spirit_date: string | null
  batismo_pastor: string | null
  batismo_local: string | null
  naturalidade: string | null
  naturalidade_uf: string | null
}

// ---- App User ----
export interface AppUser {
  id: string
  full_name: string
  role: UserRole
  member_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---- Auth Session ----
export interface AuthSession {
  user: {
    id: string
    email: string | null
  }
  appUser: AppUser | null
}

// ---- Sync Queue (local IndexedDB only) ----
export interface SyncQueueItem {
  id?: number
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: string
  created_at: string
  retry_count: number
}
