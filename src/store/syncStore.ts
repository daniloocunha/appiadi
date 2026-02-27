import { create } from 'zustand'
import { db } from '@/lib/db'

interface SyncState {
  isSyncing: boolean
  pendingCount: number
  lastSyncAt: string | null
  lastSyncError: string | null
  setSyncing: (v: boolean) => void
  setPending: (count: number) => void
  setLastSyncAt: (ts: string) => void
  setLastSyncError: (err: string | null) => void
  refresh: () => Promise<void>
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  lastSyncError: null,

  setSyncing: (v) => set({ isSyncing: v }),
  setPending: (count) => set({ pendingCount: count }),
  setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
  setLastSyncError: (err) => set({ lastSyncError: err }),

  refresh: async () => {
    const count = await db.sync_queue.count()
    set({ pendingCount: count })
  },
}))
