// Calculation of scores for our 3 modes

export type StudyMode = 'deep-focus' | 'research' | 'practice'

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
  tabSwitchPenaltyPerSwitch: number
  maxTabSwitchPenalty: number
  idlePenaltyMultiplier: number // To control our penalry 
}

export const MODE_SCORE_PROFILES: Record<StudyMode, ModeProfile> = {
  'deep-focus': {
    weights: { checkIn: 0.4, selfReport: 0.3, commitment: 0.3 },
    tabSwitchPenaltyPerSwitch: 5,
    maxTabSwitchPenalty: 30,
    idlePenaltyMultiplier: 1.0,
  },
  practice: {
    weights: { checkIn: 0.35, selfReport: 0.35, commitment: 0.3 },
    tabSwitchPenaltyPerSwitch: 2,
    maxTabSwitchPenalty: 30,
    idlePenaltyMultiplier: 1.0,
  },
  research: {
    weights: { checkIn: 0.3, selfReport: 0.5, commitment: 0.2 },
    tabSwitchPenaltyPerSwitch: 0, // tracked, but will not penalise them
    maxTabSwitchPenalty: 0,
    idlePenaltyMultiplier: 0, // cos they might be reading notes etc on another tab, so its okay, no need to penalise them
  },
}

const MAX_IDLE_PENALTY = 30

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function calculateCheckInScore(checkIns: CheckInRecord[], missedCheckInCount: number): number {
  const totalCheckIns = checkIns.length

  // If there was no checkin prompts at all
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

function calculateTabSwitchPenalty(tabSwitchCount: number, profile: ModeProfile): number {
  const rawPenalty = tabSwitchCount * profile.tabSwitchPenaltyPerSwitch
  return Math.min(rawPenalty, profile.maxTabSwitchPenalty)
}

function calculateIdlePenalty(idleTimeMs: number, durationMs: number, profile: ModeProfile): number {
  if (durationMs <= 0) return 0

  const idleRatio = clamp(idleTimeMs / durationMs, 0, 1)
  return idleRatio * MAX_IDLE_PENALTY * profile.idlePenaltyMultiplier
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

  const tabSwitchPenalty = calculateTabSwitchPenalty(input.tabSwitchCount, profile)
  const idlePenalty = calculateIdlePenalty(input.idleTimeMs, input.durationMs, profile)

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