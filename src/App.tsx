import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Auth
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

// Sync
import { syncAll } from '@/lib/sync'

// Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { MembersPage } from '@/pages/members/MembersPage'
import { MemberDetailPage } from '@/pages/members/MemberDetailPage'
import { CongregationsPage } from '@/pages/congregations/CongregationsPage'
import { CalendarPage } from '@/pages/calendar/CalendarPage'
import { LettersPage } from '@/pages/letters/LettersPage'
import { SelfRegistrationsPage } from '@/pages/registrations/SelfRegistrationsPage'
import { PublicRegistrationPage } from '@/pages/registrations/PublicRegistrationPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutos
      retry: 1,
    },
  },
})

// ---- Proteção de rotas ----
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="IADI" className="w-16 h-16 rounded-full animate-pulse" />
          <p className="text-white text-sm">Carregando…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}


// ---- App root ----
function AppContent() {
  useAuthInit()

  const { user } = useAuthStore()

  // Sincronização periódica a cada 5 minutos
  useEffect(() => {
    if (!user) return
    syncAll()
    const interval = setInterval(() => syncAll(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/forgot-password" element={<RedirectIfAuth><ForgotPasswordPage /></RedirectIfAuth>} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/cadastro" element={<PublicRegistrationPage />} />

      {/* Rotas autenticadas */}
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/members" element={<RequireAuth><MembersPage /></RequireAuth>} />
      <Route path="/members/:id" element={<RequireAuth><MemberDetailPage /></RequireAuth>} />
      <Route path="/congregations/*" element={<RequireAuth><CongregationsPage /></RequireAuth>} />
      <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
      <Route path="/letters" element={<RequireAuth><LettersPage /></RequireAuth>} />
      <Route path="/registrations" element={<RequireAuth><SelfRegistrationsPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

      {/* Redirect padrão */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
