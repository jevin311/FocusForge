import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FloatingTimer from '@/components/session/FloatingTimer'
import { useSessionStore } from '@/lib/session-store'
import { useSession } from '@/hooks/useSession'
import type { SessionConfig } from '@/types/session'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(),
}))

const mockedUseSession = vi.mocked(useSession)

interface MockSessionHookReturn {
  status: 'idle' | 'active' | 'paused' | 'ended'
  elapsedMs: number
  activeCheckIn: { triggeredAt: number; respondedAt: number | null; missed: boolean } | null
  checkIns: unknown[]
  tabSwitchCount: number
  totalIdleTime: number
  start: () => void
  pause: () => void
  resume: () => void
  end: () => { durationMs: number; idleTimeMs: number; tabSwitchCount: number; checkIns: unknown[]; missedCheckInCount: number }
  respondToCheckIn: () => void
  unlockAudio: () => void
}

function mockSessionHook(overrides: Partial<MockSessionHookReturn> = {}) {
  mockedUseSession.mockReturnValue({
    status: 'active',
    elapsedMs: 0,
    activeCheckIn: null,
    checkIns: [],
    tabSwitchCount: 0,
    totalIdleTime: 0,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    end: vi.fn(() => ({
      durationMs: 0, idleTimeMs: 0, tabSwitchCount: 0, checkIns: [], missedCheckInCount: 0,
    })),
    respondToCheckIn: vi.fn(),
    unlockAudio: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useSession>)
}

const baseConfig: SessionConfig = {
  taskId: 'task-123',
  taskTitle: 'Finish Chapter 4',
  mode: 'deep-focus',
  timerType: 'stopwatch',
  durationMins: null,
  tabMode: 'single-tab',
  commitment: 'Complete all practice problems',
}

describe('FloatingTimer', () => {
  beforeEach(() => {
    mockPush.mockClear()
    useSessionStore.setState({
      config: baseConfig,
      isActive: true,
      startedAt: new Date(),
      pendingResult: null,
      unlockAudioFn: null,
    })
    mockSessionHook()
    document.title = 'FocusForge'
  })

  it('renders nothing when there is no active config', () => {
    useSessionStore.setState({ config: null })
    const { container } = render(<FloatingTimer />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the task title and mode when a session is active', () => {
    render(<FloatingTimer />)
    expect(screen.getByText('Finish Chapter 4')).toBeInTheDocument()
    expect(screen.getByText('deep focus')).toBeInTheDocument()
  })

  it('shows the commitment text', () => {
    render(<FloatingTimer />)
    expect(screen.getByText('“Complete all practice problems”')).toBeInTheDocument()
  })

  it('counts UP and labels "elapsed" for a stopwatch (open) session', () => {
    mockSessionHook({ status: 'active', elapsedMs: 65_000 })
    render(<FloatingTimer />)
    expect(screen.getByText('01:05')).toBeInTheDocument()
    expect(screen.getByText('elapsed')).toBeInTheDocument()
  })

  it('counts DOWN and labels "remaining" for a timed session', () => {
    useSessionStore.setState({
      config: { ...baseConfig, timerType: 'timed', durationMins: 25 },
    })
    mockSessionHook({ status: 'active', elapsedMs: 60_000 })
    render(<FloatingTimer />)
    // 25:00 total - 1:00 elapsed = 24:00 remaining
    expect(screen.getByText('24:00')).toBeInTheDocument()
    expect(screen.getByText('remaining')).toBeInTheDocument()
  })

  it('sets a counting-up tab title for a stopwatch session', async () => {
    mockSessionHook({ status: 'active', elapsedMs: 5_000 })
    render(<FloatingTimer />)
    await waitFor(() => {
      expect(document.title).toBe('⏱ 00:05 — FocusForge')
    })
  })

  it('sets a counting-down tab title for a timed session (not a stopwatch)', async () => {
    useSessionStore.setState({
      config: { ...baseConfig, timerType: 'timed', durationMins: 5 },
    })
    mockSessionHook({ status: 'active', elapsedMs: 60_000 })
    render(<FloatingTimer />)
    await waitFor(() => {
      expect(document.title).toBe('⏳ 04:00 — FocusForge')
    })
  })

  it('shows a paused tab title when the session is paused', async () => {
    mockSessionHook({ status: 'paused', elapsedMs: 10_000 })
    render(<FloatingTimer />)
    await waitFor(() => {
      expect(document.title).toBe('⏸ Paused — FocusForge')
    })
  })

  it('calls pause() when the Pause button is clicked while active', () => {
    const pause = vi.fn()
    mockSessionHook({ status: 'active', pause })
    render(<FloatingTimer />)
    fireEvent.click(screen.getByText(/pause/i))
    expect(pause).toHaveBeenCalledOnce()
  })

  it('calls resume() when the Resume button is clicked while paused', () => {
    const resume = vi.fn()
    mockSessionHook({ status: 'paused', resume })
    render(<FloatingTimer />)
    fireEvent.click(screen.getByText(/resume/i))
    expect(resume).toHaveBeenCalledOnce()
  })

  it('ends the session, stores the result, and navigates to the dashboard', () => {
    const end = vi.fn(() => ({
      durationMs: 120_000, idleTimeMs: 0, tabSwitchCount: 1, checkIns: [], missedCheckInCount: 0,
    }))
    mockSessionHook({ end })
    render(<FloatingTimer />)
    fireEvent.click(screen.getByText('End Session'))

    expect(end).toHaveBeenCalledOnce()
    expect(useSessionStore.getState().pendingResult).toEqual({
      durationMs: 120_000, idleTimeMs: 0, tabSwitchCount: 1, checkIns: [], missedCheckInCount: 0,
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows the check-in prompt and responds to it', () => {
    const respondToCheckIn = vi.fn()
    mockSessionHook({
      activeCheckIn: { triggeredAt: Date.now(), respondedAt: null, missed: false },
      respondToCheckIn,
    })
    render(<FloatingTimer />)
    expect(screen.getByText(/still focusing/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/yes, i'm here/i))
    expect(respondToCheckIn).toHaveBeenCalledOnce()
  })

  it('warns when the tab is inactive', () => {
    render(<FloatingTimer />)
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.getByText(/tab inactive/i)).toBeInTheDocument()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  it('minimises to a compact pill and restores on click', () => {
    mockSessionHook({ status: 'active', elapsedMs: 5_000 })
    render(<FloatingTimer />)

    // Minimise button is the first button rendered in the full view
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(screen.getByText('00:05')).toBeInTheDocument()
    expect(screen.queryByText('“Complete all practice problems”')).not.toBeInTheDocument()

    // Clicking the minimised pill restores the full card
    fireEvent.click(screen.getByText('00:05'))
    expect(screen.getByText('“Complete all practice problems”')).toBeInTheDocument()
  })
})