import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

// ============================================================
// Banner de atualização do PWA
// Aparece quando uma nova versão do app está disponível
// ============================================================

export function PWAUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      // Verifica atualizações a cada 60 segundos
      if (r) {
        setInterval(() => r.update(), 60_000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-max max-w-xs">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3">
        <RefreshCw size={16} className="text-amber-400 shrink-0" />
        <span className="text-sm">Nova versão disponível!</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
