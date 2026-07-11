import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PostSessionCard from '@/components/session/PostSessionCard'
import { useSessionStore } from '@/lib/session-store'
import type { SessionConfig } from '@/types/session'
import type { SessionResult } from '@/hooks/useSession'

const mockConfig: SessionConfig = {
  taskId: 'task-123',
  taskTitle: 'Finish Chapter 4',
  mode: 'deep-focus',
  timerType: 'timed',
  durationMins: 25,
  tabMode: 'single-tab',
  commitment: 'Complete all practice problems',
}

const mockResult: SessionResult = {
  durationMs: 25 * 60 * 1000,
  idleTimeMs: 60 * 1000,
  tabSwitchCount: 2,
  checkIns: [
    { triggeredAt: 1000, respondedAt: 1500, missed: false },
    { triggeredAt: 2000, respondedAt: null, missed: true },
  ],
  missedCheckInCount: 1,
}

describe('PostSessionCard', () => {
  beforeEach(() => {
    useSessionStore.setState({ config: mockConfig })
    global.fetch = vi.fn()
  })

  it('renders nothing when there is no active config', () => {
    useSessionStore.setState({ config: null })
    const { container } = render(
      <PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows the task title and formatted duration', () => {
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.getAllByText('Finish Chapter 4')[0]).toBeInTheDocument()
    expect(screen.getByText('25m 0s')).toBeInTheDocument()
  })

  it('shows the check-in response ratio', () => {
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('shows tab switch count for single-tab sessions', () => {
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('dashes out tab switches and idle time for multi-tab sessions', () => {
    useSessionStore.setState({ config: { ...mockConfig, tabMode: 'multi-tab' } })
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('disables Save Session until a rating and commitment answer are given', () => {
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.getByText('Save Session')).toBeDisabled()

    fireEvent.click(screen.getAllByText('⭐')[3]) // 4th star = rating 4
    expect(screen.getByText('Save Session')).toBeDisabled()

    fireEvent.click(screen.getByText('✓ Yes'))
    expect(screen.getByText('Save Session')).not.toBeDisabled()
  })

  it('shows the mark-task-complete toggle only when the session has a task', () => {
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.getByText('Mark task as completed')).toBeInTheDocument()
  })

  it('hides the mark-task-complete toggle when there is no task', () => {
    useSessionStore.setState({ config: { ...mockConfig, taskId: null, taskTitle: null } as unknown as SessionConfig,})
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.queryByText('Mark task as completed')).not.toBeInTheDocument()
  })

  it('shows a live focus score preview once rating and commitment are set', () => {
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    expect(screen.queryByText('Focus Score')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByText('⭐')[4])
    fireEvent.click(screen.getByText('✓ Yes'))
    expect(screen.getByText('Focus Score')).toBeInTheDocument()
  })

  it('calls onResume when "Return to timer" is clicked', () => {
    const onResume = vi.fn()
    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={onResume} />)
    fireEvent.click(screen.getByText(/return to timer/i))
    expect(onResume).toHaveBeenCalledOnce()
  })

  it('submits the session and shows the saved state on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    fireEvent.click(screen.getAllByText('⭐')[4])
    fireEvent.click(screen.getByText('✓ Yes'))
    fireEvent.click(screen.getByText('Save Session'))

    await waitFor(() => {
      expect(screen.getByText('Session saved!')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ method: 'POST' }))
  })

  it('sends the expected payload shape to the sessions API', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    fireEvent.click(screen.getAllByText('⭐')[3]) // rating 4
    fireEvent.click(screen.getByText('✗ No'))
    fireEvent.click(screen.getByText('Save Session'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(call[1].body)

    expect(body.selfReportRating).toBe(4)
    expect(body.commitmentMet).toBe(false)
    expect(body.mode).toBe('deep-focus')
    expect(body.tabMode).toBe('single-tab')
    expect(body.durationMs).toBe(mockResult.durationMs)
    expect(body.taskId).toBe('task-123')
  })

  it('shows the API error message and stays on the form on failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to save session' }),
    })

    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    fireEvent.click(screen.getAllByText('⭐')[4])
    fireEvent.click(screen.getByText('✓ Yes'))
    fireEvent.click(screen.getByText('Save Session'))

    await waitFor(() => {
      expect(screen.getByText(/failed to save session/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('Session saved!')).not.toBeInTheDocument()
  })

  it('shows the error message on a network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network down'))

    render(<PostSessionCard result={mockResult} onDone={() => {}} onResume={() => {}} />)
    fireEvent.click(screen.getAllByText('⭐')[4])
    fireEvent.click(screen.getByText('✓ Yes'))
    fireEvent.click(screen.getByText('Save Session'))

    await waitFor(() => {
      expect(screen.getByText(/network down/i)).toBeInTheDocument()
    })
  })

  it('calls onDone when "Back to Dashboard" is clicked after saving', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const onDone = vi.fn()

    render(<PostSessionCard result={mockResult} onDone={onDone} onResume={() => {}} />)
    fireEvent.click(screen.getAllByText('⭐')[4])
    fireEvent.click(screen.getByText('✓ Yes'))
    fireEvent.click(screen.getByText('Save Session'))

    await waitFor(() => screen.getByText('Back to Dashboard'))
    fireEvent.click(screen.getByText('Back to Dashboard'))
    expect(onDone).toHaveBeenCalledOnce()
  })
})