import { useState, useEffect } from 'react'
import { db } from '@/lib/db'

/** Contagem de auto-cadastros aguardando aprovação (status = 'pendente') */
export function usePendingRegistrationsCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    db.self_registrations
      .filter((r) => r.status === 'pendente')
      .count()
      .then(setCount)
  }, [])

  return count
}
