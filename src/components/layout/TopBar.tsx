import { Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-white border-b border-slate-200 gap-3 lg:px-6">
      {/* Menu button — só no mobile */}
      <button
        className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        onClick={toggleSidebar}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <img src="/logo.png" alt="IADI" className="w-7 h-7 rounded-full" />
        <span className="text-sm font-bold text-amber-900">{title ?? 'IADI'}</span>
      </div>

      {/* Título desktop */}
      {title && (
        <h1 className="hidden lg:block text-base font-semibold text-slate-800">{title}</h1>
      )}

      <div className="ml-auto">
        <SyncStatusIndicator />
      </div>
    </header>
  )
}
