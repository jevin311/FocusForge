import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionLauncherModal from '@/components/session/SessionLauncherModal'
import { useSessionStore } from '@/lib/session-store'

const mockTask = { id: 'task-123', title: 'Finish Chapter 4', mode: 'deep-focus' }

describe('SessionLauncherModal', () => {
  beforeEach(() => {
    useSessionStore.setState({ isActive: false, config: null, startedAt: null })
  })

  it('renders the task title', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    expect(screen.getByText('Finish Chapter 4')).toBeInTheDocument()
  })

  it('shows mode options on step 1', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    expect(screen.getByText('deep-focus')).toBeInTheDocument()
    expect(screen.getByText('research')).toBeInTheDocument()
    expect(screen.getByText('practice')).toBeInTheDocument()
  })

  it('advances to step 2 on mode select', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    fireEvent.click(screen.getByText('deep-focus'))
    expect(screen.getByText(/open session/i)).toBeInTheDocument()
  })

  it('advances to step 3 on timer select', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    fireEvent.click(screen.getByText('deep-focus'))
    fireEvent.click(screen.getByText(/open session/i))
    expect(screen.getByText('Single tab')).toBeInTheDocument()
  })

  it('advances to step 4 on tab mode select', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    fireEvent.click(screen.getByText('deep-focus'))
    fireEvent.click(screen.getByText(/open session/i))
    fireEvent.click(screen.getByText('Single tab'))
    expect(screen.getByPlaceholderText(/finish/i)).toBeInTheDocument()
  })

  it('back button returns to previous step', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    fireEvent.click(screen.getByText('deep-focus'))
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('research')).toBeInTheDocument()
  })

  it('start button disabled when commitment empty', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    fireEvent.click(screen.getByText('deep-focus'))
    fireEvent.click(screen.getByText(/open session/i))
    fireEvent.click(screen.getByText('Single tab'))
    expect(screen.getByText(/start session/i)).toBeDisabled()
  })

  it('full flow calls startSession with correct config', () => {
    render(<SessionLauncherModal task={mockTask} onClose={() => {}} />)
    fireEvent.click(screen.getByText('deep-focus'))
    fireEvent.click(screen.getByText(/open session/i))
    fireEvent.click(screen.getByText('Single tab'))
    fireEvent.change(screen.getByPlaceholderText(/finish/i), {
      target: { value: 'Complete all problems' },
    })
    fireEvent.click(screen.getByText(/start session/i))
    const state = useSessionStore.getState()
    expect(state.isActive).toBe(true)
    expect(state.config?.commitment).toBe('Complete all problems')
    expect(state.config?.mode).toBe('deep-focus')
    expect(state.config?.tabMode).toBe('single-tab')
  })

  it('cancel calls onClose', () => {
    const onClose = vi.fn()
    render(<SessionLauncherModal task={mockTask} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})