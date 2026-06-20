import { create } from 'zustand'
import { SessionConfig } from '@/types/session'

interface SessionStore {
    isActive: boolean
    config: SessionConfig | null
    startedAt: Date | null
    startSession: (config: SessionConfig) => void
    endSession: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
    isActive: false,
    config: null,
    startedAt: null,

    startSession: (config) => set({
        isActive: true,
        config,
        startedAt: new Date(),
    }),

    endSession: () => set({
        isActive: false,
        config: null,
        startedAt: null,
    }),
}))
