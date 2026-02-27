import { create } from 'zustand'
import type { AppUser, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  appUser: AppUser | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setAppUser: (appUser: AppUser | null) => void
  setLoading: (v: boolean) => void
  role: UserRole | null
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  appUser: null,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAppUser: (appUser) => set({ appUser, role: appUser?.role ?? null }),
  setLoading: (v) => set({ isLoading: v }),

  get role() { return get().appUser?.role ?? null },
  get isAuthenticated() { return !!get().user },
}))
