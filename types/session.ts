export type SessionMode = 'deep-focus' | 'research' | 'practice'
export type TimerType = 'stopwatch' | 'timed'
export type TabMode = 'single-tab' | 'multi-tab'

export interface SessionConfig {
  taskId: string
  taskTitle: string
  mode: SessionMode
  timerType: TimerType
  durationMins: number | null   // null if stopwatch
  tabMode: TabMode
  commitment: string
}

export interface SessionResult {
  config: SessionConfig
  startedAt: string
  endedAt: string
  durationMins: number
  tabSwitches: number
  timeAwayMs: number
  checkinsTotal: number
  checkinsMissed: number
  selfReportedFocus: number
  commitmentMet: boolean
  focusScore: number
}