import { useEffect, useState } from 'react'
import { syncAll } from '@/lib/sync'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      // Ao reconectar: push (enviar pendentes) → pull (buscar atualizações)
      await syncAll()
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
