import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, CalendarDays,
  FileText, ClipboardList, Settings, LogOut, X,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { usePermission } from '@/hooks/usePermission'
import { signOut } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { usePendingRegistrationsCount } from '@/hooks/usePendingRegistrationsCount'

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const { appUser } = useAuthStore()
  const { canManageUsers, canReviewRegistrations } = usePermission()
  const pendingRegistrationsCount = usePendingRegistrationsCount()
  const navigate = useNavigate()

  const close = () => setSidebarOpen(false)

  const navItems = [
    { to: '/dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { to: '/members', label: 'Membros', icon: <Users size={20} /> },
    { to: '/congregations', label: 'Congregações', icon: <Building2 size={20} /> },
    { to: '/calendar', label: 'Calendário', icon: <CalendarDays size={20} /> },
    { to: '/letters', label: 'Documentos', icon: <FileText size={20} /> },
    ...(canReviewRegistrations
      ? [{ to: '/registrations', label: 'Cadastros Pendentes', icon: <ClipboardList size={20} />, badge: pendingRegistrationsCount }]
      : []),
    ...(canManageUsers
      ? [{ to: '/settings', label: 'Configurações', icon: <Settings size={20} /> }]
      : []),
  ]

  if (!sidebarOpen) return null

  const handleLogout = async () => {
    close()
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={close} />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white flex flex-col lg:hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="IADI" className="w-9 h-9 rounded-full bg-white object-cover" />
            <div>
              <p className="text-sm font-bold leading-tight">Igreja Assembleia de Deus em Iaçu</p>
              <p className="text-xs text-blue-300">Gestão de Membros</p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={close}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-400 text-blue-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-blue-800">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar name={appUser?.full_name} size="sm" className="bg-blue-700 text-white" />
            <p className="text-xs font-medium text-white truncate">{appUser?.full_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 text-sm text-blue-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut size={15} />
            Sair do sistema
          </button>
        </div>
      </aside>
    </>
  )
}
