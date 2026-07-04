'use client'

import { create } from 'zustand'
import { SessionConfig } from '@/types/session'
import { persist } from 'zustand/middleware'
import type { SessionResult } from '@/hooks/useSession'
import type { SoundscapeId } from '@/hooks/useSoundscape'

interface SessionStore {
  isActive: boolean
  config: SessionConfig | null
  startedAt: Date | null
  pendingResult: SessionResult | null
  unlockAudioFn: (() => void) | null

  // Soundscape preferences persisted so they survive page refresh and carry across sessions
  soundscapeId: SoundscapeId | null
  soundscapeVolume: number  // we default 0.6

  startSession: (config: SessionConfig) => void
  endSession: () => void
  setPendingResult: (result: SessionResult | null) => void
  setUnlockAudioFn: (fn: () => void) => void
  setSoundscape: (id: SoundscapeId | null) => void
  setSoundscapeVolume: (volume: number) => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      isActive: false,
      config: null,
      startedAt: null,
      pendingResult: null,
      unlockAudioFn: null,
      soundscapeId: null,
      soundscapeVolume: 0.6,

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
      setSoundscape: (id) => set({ soundscapeId: id }),
      setSoundscapeVolume: (volume) => set({ soundscapeVolume: volume }),
    }),
    {
      name: 'focusforge-session',
      partialize: (state) => ({
        isActive: state.isActive,
        config: state.config,
        startedAt: state.startedAt,
        // Persist soundscape preferences across sessions since they shouldn't re-select every time
        soundscapeId: state.soundscapeId,
        soundscapeVolume: state.soundscapeVolume,
        // Don't persist pendingResult since it should not survive a page refresh, else will have alot of errors and get 
        // stuck on tht page
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.startedAt) {
          state.startedAt = new Date(state.startedAt)
        }
      },
    }
  )
)