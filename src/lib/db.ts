import Dexie, { type EntityTable } from 'dexie'
import type {
  Congregation,
  Member,
  ChurchEvent,
  Letter,
  Badge,
  SelfRegistration,
  SyncQueueItem,
} from '@/types'

// ============================================================
// Tipos locais — estendem os tipos remotos com campos de sync
// ============================================================

export interface LocalCongregation extends Congregation {
  _synced: boolean
}

export interface LocalMember extends Member {
  _synced: boolean
}

export interface LocalEvent extends ChurchEvent {
  _synced: boolean
}

export interface LocalLetter extends Letter {
  _synced: boolean
}

export interface LocalBadge extends Badge {
  _synced: boolean
}

export interface LocalSelfRegistration extends SelfRegistration {
  _synced: boolean
}

// ============================================================
// Banco de dados local (IndexedDB via Dexie)
// ============================================================

class AppDatabase extends Dexie {
  congregations!: EntityTable<LocalCongregation, 'id'>
  members!: EntityTable<LocalMember, 'id'>
  events!: EntityTable<LocalEvent, 'id'>
  letters!: EntityTable<LocalLetter, 'id'>
  badges!: EntityTable<LocalBadge, 'id'>
  self_registrations!: EntityTable<LocalSelfRegistration, 'id'>
  sync_queue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('iadi-db')

    this.version(1).stores({
      congregations: 'id, name, is_headquarters, _synced',
      members: 'id, congregation_id, status, birth_date, full_name, church_role, _synced',
      events: 'id, event_date, congregation_id, event_type, _synced',
      letters: 'id, member_id, letter_type, letter_number, issued_at, updated_at, _synced',
      badges: 'id, member_id, badge_number, issued_at, updated_at, _synced',
      self_registrations: 'id, token, status, submitted_at, _synced',
      sync_queue: '++id, table_name, record_id, created_at',
    })
  }
}

export const db = new AppDatabase()

// ============================================================
// Utilitários de acesso ao banco local
// ============================================================

/** Retorna o timestamp da última sincronização */
export function getLastPullAt(): string {
  return localStorage.getItem('iadi_last_pull_at') ?? '1970-01-01T00:00:00.000Z'
}

/** Atualiza o timestamp da última sincronização */
export function setLastPullAt(ts: string): void {
  localStorage.setItem('iadi_last_pull_at', ts)
}

/** Retorna true se o banco local já foi inicializado (primeira carga de dados) */
export function isDbInitialized(): boolean {
  return localStorage.getItem('iadi_db_initialized') === 'true'
}

/** Marca o banco local como inicializado */
export function markDbInitialized(): void {
  localStorage.setItem('iadi_db_initialized', 'true')
}
