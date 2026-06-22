import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '@/lib/session-store'
import type { SessionConfig } from '@/types/session'

const mockConfig: SessionConfig = {
  taskId: 'task-123',
  taskTitle: 'Finish Chapter 4',
  mode: 'deep-focus',
  timerType: 'timed',
  durationMins: 45,
  tabMode: 'single-tab',
  commitment: 'Complete all practice problems',
}

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ isActive: false, config: null, startedAt: null })
  })

  it('starts with no active session', () => {
    const { isActive, config, startedAt } = useSessionStore.getState()
    expect(isActive).toBe(false)
    expect(config).toBeNull()
    expect(startedAt).toBeNull()
  })

  it('startSession sets isActive true and stores config', () => {
    useSessionStore.getState().startSession(mockConfig)
    const state = useSessionStore.getState()
    expect(state.isActive).toBe(true)
    expect(state.config).toEqual(mockConfig)
  })

  it('startSession records a startedAt timestamp', () => {
    const before = new Date()
    useSessionStore.getState().startSession(mockConfig)
    const after = new Date()
    const { startedAt } = useSessionStore.getState()
    expect(startedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(startedAt!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('endSession clears all state', () => {
    useSessionStore.getState().startSession(mockConfig)
    useSessionStore.getState().endSession()
    const { isActive, config, startedAt } = useSessionStore.getState()
    expect(isActive).toBe(false)
    expect(config).toBeNull()
    expect(startedAt).toBeNull()
  })

  it('endSession without starting does not throw', () => {
    expect(() => useSessionStore.getState().endSession()).not.toThrow()
  })

  it('starting a new session overwrites the previous one', () => {
    useSessionStore.getState().startSession(mockConfig)
    const newConfig = { ...mockConfig, taskId: 'task-456' }
    useSessionStore.getState().startSession(newConfig)
    expect(useSessionStore.getState().config?.taskId).toBe('task-456')
  })
})