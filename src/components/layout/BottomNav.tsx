import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Menu,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useSyncStore } from '@/store/syncStore'

// Bottom navigation — apenas mobile (lg:hidden)
// Os 4 itens mais usados + botão de menu para o restante

export function BottomNav() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  const items = [
    { to: '/dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { to: '/members', label: 'Membros', icon: <Users size={20} /> },
    { to: '/calendar', label: 'Calendário', icon: <CalendarDays size={20} /> },
    { to: '/letters', label: 'Documentos', icon: <FileText size={20} /> },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex safe-bottom">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              'flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 transition-colors min-w-0',
              isActive
                ? 'text-blue-900 font-semibold'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')
          }
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}

      {/* Botão de menu para acesso às outras seções */}
      <button
        onClick={toggleSidebar}
        className="flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 text-slate-500 hover:text-slate-700 transition-colors relative"
      >
        <span className="relative">
          <Menu size={20} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
          )}
        </span>
        <span>Menu</span>
      </button>
    </nav>
  )
}
