import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { MobileSidebar } from './MobileSidebar'
import { useSyncStore } from '@/store/syncStore'
import { usePendingRegistrationsCount } from '@/hooks/usePendingRegistrationsCount'

interface AppShellProps {
  children: ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const pendingCount = useSyncStore((s) => s.pendingCount)
  const pendingRegistrationsCount = usePendingRegistrationsCount()

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <Sidebar pendingRegistrationsCount={pendingRegistrationsCount} />

      {/* Sidebar mobile (drawer) */}
      <MobileSidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <BottomNav />
    </div>
  )
}
