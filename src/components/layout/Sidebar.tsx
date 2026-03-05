import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { signOut } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { usePermission } from '@/hooks/usePermission'
import { Avatar } from '@/components/ui/Avatar'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
}

export function Sidebar({ pendingRegistrationsCount = 0 }: { pendingRegistrationsCount?: number }) {
  const navigate = useNavigate()
  const { appUser } = useAuthStore()
  const { canManageUsers, canReviewRegistrations } = usePermission()

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Início', icon: <LayoutDashboard size={18} /> },
    { to: '/members', label: 'Membros', icon: <Users size={18} /> },
    { to: '/congregations', label: 'Congregações', icon: <Building2 size={18} /> },
    { to: '/calendar', label: 'Calendário', icon: <CalendarDays size={18} /> },
    { to: '/letters', label: 'Documentos', icon: <FileText size={18} /> },
    ...(canReviewRegistrations
      ? [{ to: '/registrations', label: 'Cadastros', icon: <ClipboardList size={18} />, badge: pendingRegistrationsCount > 0 ? pendingRegistrationsCount : undefined }]
      : []),
    ...(canManageUsers
      ? [{ to: '/settings', label: 'Configurações', icon: <Settings size={18} /> }]
      : []),
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-amber-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-amber-800">
        <img src="/logo.png" alt="IADI" className="w-9 h-9 rounded-full object-cover bg-white" />
        <div className="leading-tight">
          <p className="text-xs font-bold tracking-wide">IADI</p>
          <p className="text-xs text-amber-300 leading-tight">Gestão de Membros</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-amber-200 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            <ChevronRight size={14} className="text-amber-400 opacity-0 group-hover:opacity-100" />
          </NavLink>
        ))}
      </nav>

      {/* Usuário */}
      <div className="px-3 py-3 border-t border-amber-800">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar name={appUser?.full_name} size="sm" className="bg-amber-700 text-white" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{appUser?.full_name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-amber-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <LogOut size={13} />
          Sair
        </button>
      </div>
    </aside>
  )
}
