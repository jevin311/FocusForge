// Calculation of scores for our 3 modes

export type StudyMode = 'deep-focus' | 'research' | 'practice'
export type TabMode = 'single-tab' | 'multi-tab'

export interface CheckInRecord {
  triggeredAt: number
  respondedAt: number | null
  missed: boolean
}

export interface FocusScoreInput {
  durationMs: number
  idleTimeMs: number
  tabSwitchCount: number
  checkIns: CheckInRecord[]
  missedCheckInCount: number
  selfReportRating: number // We let them choose 1-5
  commitmentMet: boolean
  mode: StudyMode
  tabMode: TabMode
}

export interface FocusScoreBreakdown {
  checkInScore: number
  selfReportScore: number
  commitmentScore: number
  tabSwitchPenalty: number
  idlePenalty: number
  weightedBaseScore: number
  finalScore: number
}

interface ModeProfile {
  weights: {
    checkIn: number
    selfReport: number
    commitment: number
  }
}

// Mode only affects score weights now, then tab penalties are driven by tabMode
export const MODE_SCORE_PROFILES: Record<StudyMode, ModeProfile> = {
  'deep-focus': {
    weights: { checkIn: 0.4, selfReport: 0.3, commitment: 0.3 },
  },
  practice: {
    weights: { checkIn: 0.35, selfReport: 0.35, commitment: 0.3 },
  },
  research: {
    weights: { checkIn: 0.3, selfReport: 0.5, commitment: 0.2 },
  },
}

// Tab switch and idle penalties only apply when user chose "single-tab'
const TAB_SWITCH_PENALTY_PER_SWITCH = 5
const MAX_TAB_SWITCH_PENALTY = 30
const MAX_IDLE_PENALTY = 30

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function calculateCheckInScore(checkIns: CheckInRecord[], missedCheckInCount: number): number {
  const totalCheckIns = checkIns.length

  // If there were no check-in prompts at all
  if (totalCheckIns === 0) return 100

  const respondedCount = totalCheckIns - missedCheckInCount
  return (respondedCount / totalCheckIns) * 100
}

function calculateSelfReportScore(selfReportRating: number): number {
  const clampedRating = clamp(selfReportRating, 1, 5)
  return (clampedRating / 5) * 100
}

function calculateCommitmentScore(commitmentMet: boolean): number {
  return commitmentMet ? 100 : 0
}

function calculateTabSwitchPenalty(tabSwitchCount: number, tabMode: TabMode): number {
  // Multi-tab users declared they'd be switching — no penalty
  if (tabMode === 'multi-tab') return 0

  const rawPenalty = tabSwitchCount * TAB_SWITCH_PENALTY_PER_SWITCH
  return Math.min(rawPenalty, MAX_TAB_SWITCH_PENALTY)
}

function calculateIdlePenalty(idleTimeMs: number, durationMs: number, tabMode: TabMode): number {
  // Multi-tab users may be reading notes in other tabs so no idle penalty
  if (tabMode === 'multi-tab') return 0
  if (durationMs <= 0) return 0

  const idleRatio = clamp(idleTimeMs / durationMs, 0, 1)
  return idleRatio * MAX_IDLE_PENALTY
}

export function calculateFocusScore(input: FocusScoreInput): FocusScoreBreakdown {
  const profile = MODE_SCORE_PROFILES[input.mode]

  const checkInScore = calculateCheckInScore(input.checkIns, input.missedCheckInCount)
  const selfReportScore = calculateSelfReportScore(input.selfReportRating)
  const commitmentScore = calculateCommitmentScore(input.commitmentMet)

  const weightedBaseScore =
    checkInScore * profile.weights.checkIn +
    selfReportScore * profile.weights.selfReport +
    commitmentScore * profile.weights.commitment

  const tabSwitchPenalty = calculateTabSwitchPenalty(input.tabSwitchCount, input.tabMode)
  const idlePenalty = calculateIdlePenalty(input.idleTimeMs, input.durationMs, input.tabMode)

  const finalScore = clamp(
    Math.round(weightedBaseScore - tabSwitchPenalty - idlePenalty),
    0,
    100
  )

  return {
    checkInScore: Math.round(checkInScore),
    selfReportScore: Math.round(selfReportScore),
    commitmentScore,
    tabSwitchPenalty: Math.round(tabSwitchPenalty),
    idlePenalty: Math.round(idlePenalty),
    weightedBaseScore: Math.round(weightedBaseScore),
    finalScore,
  }
}