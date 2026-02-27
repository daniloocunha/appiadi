import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useSyncStore } from '@/store/syncStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { syncAll } from '@/lib/sync'

export function SyncStatusIndicator() {
  const isOnline = useOnlineStatus()
  const { isSyncing, pendingCount, lastSyncError } = useSyncStore()

  const handleSync = () => { if (isOnline) syncAll() }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
        <CloudOff size={13} />
        <span>Sem conexão</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
        <RefreshCw size={13} className="animate-spin" />
        <span>Sincronizando…</span>
      </div>
    )
  }

  if (pendingCount > 0 && lastSyncError) {
    return (
      <button
        onClick={handleSync}
        className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full hover:bg-red-100 transition-colors"
        title={`Erro ao sincronizar: ${lastSyncError}\nClique para tentar novamente`}
      >
        <AlertTriangle size={13} />
        <span>Erro ao sincronizar — tentar novamente</span>
      </button>
    )
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={handleSync}
        className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full hover:bg-orange-100 transition-colors"
        title="Clique para sincronizar agora"
      >
        <Cloud size={13} />
        <span>{pendingCount} {pendingCount === 1 ? 'alteração' : 'alterações'} pendente{pendingCount === 1 ? '' : 's'}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
      <CheckCircle2 size={13} />
      <span>Sincronizado</span>
    </div>
  )
}
