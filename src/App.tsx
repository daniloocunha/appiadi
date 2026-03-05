import { useEffect, Component, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Auth
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

// Sync
import { syncAll } from '@/lib/sync'

// Logger
import { logger } from '@/utils/logger'

// Pages (lazy — code splitting para reduzir o bundle inicial)
const LoginPage             = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const ForgotPasswordPage    = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage     = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const DashboardPage         = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MembersPage           = lazy(() => import('@/pages/members/MembersPage').then(m => ({ default: m.MembersPage })))
const MemberDetailPage      = lazy(() => import('@/pages/members/MemberDetailPage').then(m => ({ default: m.MemberDetailPage })))
const CongregationsPage     = lazy(() => import('@/pages/congregations/CongregationsPage').then(m => ({ default: m.CongregationsPage })))
const CalendarPage          = lazy(() => import('@/pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const LettersPage           = lazy(() => import('@/pages/letters/LettersPage').then(m => ({ default: m.LettersPage })))
const SelfRegistrationsPage = lazy(() => import('@/pages/registrations/SelfRegistrationsPage').then(m => ({ default: m.SelfRegistrationsPage })))
const PublicRegistrationPage= lazy(() => import('@/pages/registrations/PublicRegistrationPage').then(m => ({ default: m.PublicRegistrationPage })))
const SettingsPage          = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))

// ---- Fallback de carregamento (lazy pages) ----
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ---- Error Boundary por rota ----
class RouteErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('[RouteErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
          <p className="text-slate-700 font-medium">Algo deu errado nesta página.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-amber-700 text-white text-sm rounded-lg hover:bg-amber-800"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Error Boundary global (captura erros fora das rotas) ----
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-sm">
            <p className="text-slate-700 font-medium mb-2">Algo deu errado.</p>
            <p className="text-slate-500 text-sm mb-4">
              Recarregue a página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-700 text-white text-sm rounded-lg hover:bg-amber-800"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Combina RouteErrorBoundary + Suspense em um único wrapper reutilizável
function PageBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  )
}

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
      <div className="min-h-screen flex items-center justify-center bg-amber-900">
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
      <Route path="/login" element={<PageBoundary><RedirectIfAuth><LoginPage /></RedirectIfAuth></PageBoundary>} />
      <Route path="/forgot-password" element={<PageBoundary><RedirectIfAuth><ForgotPasswordPage /></RedirectIfAuth></PageBoundary>} />
      <Route path="/auth/reset-password" element={<PageBoundary><ResetPasswordPage /></PageBoundary>} />
      <Route path="/cadastro" element={<PageBoundary><PublicRegistrationPage /></PageBoundary>} />

      {/* Rotas autenticadas */}
      <Route path="/dashboard" element={<PageBoundary><RequireAuth><DashboardPage /></RequireAuth></PageBoundary>} />
      <Route path="/members" element={<PageBoundary><RequireAuth><MembersPage /></RequireAuth></PageBoundary>} />
      <Route path="/members/:id" element={<PageBoundary><RequireAuth><MemberDetailPage /></RequireAuth></PageBoundary>} />
      <Route path="/congregations/*" element={<PageBoundary><RequireAuth><CongregationsPage /></RequireAuth></PageBoundary>} />
      <Route path="/calendar" element={<PageBoundary><RequireAuth><CalendarPage /></RequireAuth></PageBoundary>} />
      <Route path="/letters" element={<PageBoundary><RequireAuth><LettersPage /></RequireAuth></PageBoundary>} />
      <Route path="/registrations" element={<PageBoundary><RequireAuth><SelfRegistrationsPage /></RequireAuth></PageBoundary>} />
      <Route path="/settings" element={<PageBoundary><RequireAuth><SettingsPage /></RequireAuth></PageBoundary>} />

      {/* Redirect padrão */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
