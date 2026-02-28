import { supabase } from './supabase'
import {
  db,
  getLastPullAt,
  setLastPullAt,
  markDbInitialized,
  isDbInitialized,
} from './db'
import { useSyncStore } from '@/store/syncStore'

// ============================================================
// Motor de sincronização offline-first
// ============================================================

const SYNCABLE_TABLES = [
  'congregations',
  'members',
  'events',
  'letters',
  'badges',
  'self_registrations',
] as const

type SyncableTable = (typeof SYNCABLE_TABLES)[number]

// ---- PULL (Supabase → IndexedDB) ----

async function pullTable(tableName: SyncableTable, since: string): Promise<number> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })

  if (error) {
    console.error(`[sync] Erro ao baixar ${tableName}:`, error)
    return 0
  }

  if (!data || data.length === 0) return 0

  // Tipo seguro: cast para qualquer pois cada tabela tem campos diferentes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (db as any)[tableName]
  await table.bulkPut(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.map((record: any) => ({ ...record, _synced: true }))
  )

  return data.length
}

/** Pull completo (primeiro acesso) ou delta (atualizações desde last_pull_at) */
export async function pullFromSupabase(): Promise<void> {
  const since = isDbInitialized() ? getLastPullAt() : '1970-01-01T00:00:00.000Z'
  const now = new Date().toISOString()

  let totalPulled = 0

  for (const table of SYNCABLE_TABLES) {
    const count = await pullTable(table, since)
    totalPulled += count
  }

  setLastPullAt(now)
  if (!isDbInitialized()) markDbInitialized()

  if (totalPulled > 0) {
    console.log(`[sync] Pull concluído: ${totalPulled} registros atualizados`)
  }
}

// ---- PUSH (IndexedDB → Supabase) ----

// Erros permanentes (4xx) que não devem bloquear a fila — descarta o item após MAX_RETRIES
const MAX_RETRIES = 5
// Limite absoluto de tentativas — descarta após HARD_LIMIT independente do tipo de erro
const HARD_RETRY_LIMIT = 20

/** Verifica se o erro do Supabase é permanente (não vai resolver com retry) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPermanentError(error: any): boolean {
  // Erros 4xx do PostgreSQL/PostgREST são permanentes (schema, RLS, constraint, etc.)
  const permanentCodes = [
    '23502', // not_null_violation
    '23503', // foreign_key_violation
    '23505', // unique_violation
    '23514', // check_violation
    '42501', // insufficient_privilege (RLS)
    '42703', // undefined_column
    'PGRST301', // row not found
  ]
  // Nota: no Supabase JS v2, o objeto de erro NÃO tem .status diretamente.
  // O HTTP status precisa ser extraído do response e anexado como .httpStatus.
  return (
    permanentCodes.includes(error?.code) ||
    error?.httpStatus === 400 ||
    error?.httpStatus === 403
  )
}

/** Remove campos gerados pelo banco antes de enviar (evita conflitos com colunas SERIAL/DEFAULT) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizePayload(tableName: string, payload: any): any {
  const cleaned = { ...payload }
  // Remove campos locais do IndexedDB
  delete cleaned._synced
  // member_number é SERIAL no banco — não enviar null, deixar o banco gerar
  if (tableName === 'members' && (cleaned.member_number === null || cleaned.member_number === undefined)) {
    delete cleaned.member_number
  }
  return cleaned
}

/** Processa a fila de sincronização pendente */
export async function pushToSupabase(): Promise<void> {
  const queue = await db.sync_queue.orderBy('created_at').toArray()

  if (queue.length === 0) return

  useSyncStore.getState().setPending(queue.length)

  let processedCount = 0
  let skippedCount = 0
  let lastError: string | null = null

  for (const item of queue) {
    try {
      const rawPayload = JSON.parse(item.payload)
      const payload = sanitizePayload(item.table_name, rawPayload)

      if (item.operation === 'DELETE') {
        const { error, status } = await supabase
          .from(item.table_name)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', item.record_id)

        if (error) throw { ...error, httpStatus: status }
      } else {
        // INSERT e UPDATE usam upsert — seguro e idempotente
        const { error, status } = await supabase
          .from(item.table_name)
          .upsert(payload, { onConflict: 'id' })

        if (error) throw { ...error, httpStatus: status }
      }

      // Remove da fila após sucesso
      await db.sync_queue.delete(item.id!)
      processedCount++

      // Marca o registro local como sincronizado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (db as any)[item.table_name]
      if (table) {
        await table.update(item.record_id, { _synced: true })
      }
    } catch (error) {
      const newRetryCount = item.retry_count + 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any
      lastError = err?.message ?? `HTTP ${err?.httpStatus ?? 'unknown'}`
      console.error(
        `[sync] Erro ao sincronizar ${item.table_name}/${item.record_id} (tentativa ${newRetryCount}):`,
        error
      )

      // Limite absoluto: descarta independente do tipo de erro
      if (newRetryCount >= HARD_RETRY_LIMIT) {
        console.warn(`[sync] Descartando item após ${HARD_RETRY_LIMIT} tentativas: ${item.table_name}/${item.record_id}`, error)
        await db.sync_queue.delete(item.id!)
        skippedCount++
        continue
      }

      if (isPermanentError(error) && newRetryCount >= MAX_RETRIES) {
        // Erro permanente após várias tentativas — descarta o item para não bloquear a fila
        console.warn(`[sync] Descartando item permanentemente inválido: ${item.table_name}/${item.record_id}`)
        await db.sync_queue.delete(item.id!)
        skippedCount++
        // Continua para o próximo item (não quebra o loop)
        continue
      }

      await db.sync_queue.update(item.id!, {
        retry_count: newRetryCount,
      })

      if (isPermanentError(error)) {
        // Erro permanente mas ainda tem tentativas — pula este item e tenta o próximo
        continue
      }

      // Erro transiente (rede, timeout) — para aqui e tenta de novo na próxima sync
      break
    }
  }

  const remaining = await db.sync_queue.count()
  useSyncStore.getState().setPending(remaining)

  // Reporta erro ao store se houve falhas
  if (lastError && remaining > 0) {
    useSyncStore.getState().setLastSyncError(lastError)
  } else if (remaining === 0) {
    useSyncStore.getState().setLastSyncError(null)
  }

  if (processedCount > 0) {
    console.log(`[sync] Push concluído: ${processedCount} registros enviados`)
  }
  if (skippedCount > 0) {
    console.warn(`[sync] ${skippedCount} registros descartados por erro permanente`)
  }
}

// ---- Escrita offline-aware ----

type TableName = SyncableTable
type Operation = 'INSERT' | 'UPDATE' | 'DELETE'

/** Grava um registro localmente e tenta sincronizar com o Supabase */
export async function syncWrite<T extends { id: string; updated_at: string }>(
  tableName: TableName,
  record: T,
  operation: Operation = 'UPDATE'
): Promise<void> {
  // 1. Grava no IndexedDB imediatamente (offline-safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (db as any)[tableName]
  await table.put({ ...record, _synced: false })

  const queueItem = {
    table_name: tableName,
    record_id: record.id,
    operation,
    payload: JSON.stringify(record),
    created_at: new Date().toISOString(),
    retry_count: 0,
  }

  if (navigator.onLine) {
    try {
      // 2. Tenta gravar direto no Supabase
      if (operation === 'DELETE') {
        const { error } = await supabase
          .from(tableName)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', record.id)
        if (error) throw error
      } else {
        const cleanRecord = sanitizePayload(tableName, record)
        const { error } = await supabase
          .from(tableName)
          .upsert(cleanRecord, { onConflict: 'id' })
        if (error) throw error
      }
      // 3. Marca como sincronizado
      await table.update(record.id, { _synced: true })
    } catch {
      // 4. Se falhar, adiciona à fila
      await db.sync_queue.add(queueItem)
    }
  } else {
    // 5. Offline: adiciona à fila
    await db.sync_queue.add(queueItem)
  }

  // Atualiza contagem de pendentes
  const pending = await db.sync_queue.count()
  useSyncStore.getState().setPending(pending)
}

/** Executa pull + push (chamado na reconexão e periodicamente) */
export async function syncAll(): Promise<void> {
  if (!navigator.onLine) return
  useSyncStore.getState().setSyncing(true)
  try {
    await pushToSupabase()
    await pullFromSupabase()
    useSyncStore.getState().setLastSyncAt(new Date().toISOString())
  } catch (error) {
    console.error('[sync] Erro na sincronização:', error)
  } finally {
    useSyncStore.getState().setSyncing(false)
  }
}
