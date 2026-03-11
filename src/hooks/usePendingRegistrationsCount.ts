import { useState, useEffect } from 'react'
import { liveQuery } from 'dexie'
import { db } from '@/lib/db'

/** Contagem reativa de auto-cadastros aguardando aprovação (status = 'pendente').
 *  Usa liveQuery do Dexie — atualiza automaticamente sempre que o IndexedDB muda. */
export function usePendingRegistrationsCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const subscription = liveQuery(() =>
      db.self_registrations.filter((r) => r.status === 'pendente').count()
    ).subscribe({
      next: setCount,
      error: (e) => console.error('[usePendingRegistrationsCount]', e),
    })

    return () => subscription.unsubscribe()
  }, [])

  return count
}
