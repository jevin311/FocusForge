import { create } from 'zustand'
import { SessionConfig } from '@/types/session'
import { persist } from 'zustand/middleware'
import type { SessionResult } from '@/hooks/useSession'

interface SessionStore {
  isActive: boolean
  config: SessionConfig | null
  startedAt: Date | null
  pendingResult: SessionResult | null
  unlockAudioFn: (() => void) | null
  startSession: (config: SessionConfig) => void
  endSession: () => void
  setPendingResult: (result: SessionResult | null) => void
  setUnlockAudioFn: (fn: () => void) => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      isActive: false,
      config: null,
      startedAt: null,
      pendingResult: null,
      unlockAudioFn: null,

      startSession: (config) => set({
        isActive: true,
        config,
        startedAt: new Date(),
        pendingResult: null,
      }),

      endSession: () => set({
        isActive: false,
        config: null,
        startedAt: null,
        pendingResult: null,
      }),

      setPendingResult: (result) => set({ pendingResult: result }),
      setUnlockAudioFn: (fn) => set({ unlockAudioFn: fn }),
    }),
    {
      name: 'focusforge-session',
      // Don't persist pendingResult since it should not survive a page refresh, else will have alot of errors and get stuck on tht page
      partialize: (state) => ({
        isActive: state.isActive,
        config: state.config,
        startedAt: state.startedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.startedAt) {
          state.startedAt = new Date(state.startedAt)
        }
      },
    }
  )
)