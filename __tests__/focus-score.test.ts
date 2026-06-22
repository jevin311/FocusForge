import { describe, it, expect } from 'vitest'
import {
  calculateFocusScore,
  MODE_SCORE_PROFILES,
} from '@/lib/scoring/calculateFocusScore'
import type { FocusScoreInput, CheckInRecord } from '@/lib/scoring/calculateFocusScore'

const HOUR_MS = 60 * 60 * 1000

// Helper to generate checkin records
function makeCheckIns(total: number, missedCount: number): CheckInRecord[] {
  return Array.from({ length: total }, (_, i) => {
    const missed = i >= total - missedCount
    return {
      triggeredAt: 1000 + i * 1000,
      respondedAt: missed ? null : 1000 + i * 1000 + 500,
      missed,
    }
  })
}

// Base input for reuse across tests
const baseInput: FocusScoreInput = {
  durationMs: HOUR_MS,
  idleTimeMs: 0,
  tabSwitchCount: 0,
  checkIns: makeCheckIns(3, 0),
  missedCheckInCount: 0,
  selfReportRating: 5,
  commitmentMet: true,
  mode: 'deep-focus',
}

//score boundary
describe('score bounds', () => {
  it('score is never below 0 even on worst possible input', () => {
    const result = calculateFocusScore({
      durationMs: HOUR_MS,
      idleTimeMs: HOUR_MS,
      tabSwitchCount: 999,
      checkIns: makeCheckIns(5, 5),
      missedCheckInCount: 5,
      selfReportRating: 1,
      commitmentMet: false,
      mode: 'deep-focus',
    })
    expect(result.finalScore).toBeGreaterThanOrEqual(0)
  })

  it('score is never above 100 even on best possible input', () => {
    const result = calculateFocusScore(baseInput)
    expect(result.finalScore).toBeLessThanOrEqual(100)
  })
})

//deep focus
describe('deep-focus mode', () => {
  it('perfect session scores 100', () => {
    const result = calculateFocusScore(baseInput)
    expect(result.finalScore).toBe(100)
  })

  it('tab switches reduce the score', () => {
    const clean = calculateFocusScore({ ...baseInput, tabSwitchCount: 0 })
    const switchy = calculateFocusScore({ ...baseInput, tabSwitchCount: 5 })
    expect(clean.finalScore).toBeGreaterThan(switchy.finalScore)
  })

  it('tab switch penalty is capped at maxTabSwitchPenalty', () => {
    const manySwitch = calculateFocusScore({ ...baseInput, tabSwitchCount: 999 })
    expect(manySwitch.tabSwitchPenalty).toBe(
      MODE_SCORE_PROFILES['deep-focus'].maxTabSwitchPenalty
    )
  })

  it('idle time reduces the score', () => {
    const focused = calculateFocusScore({ ...baseInput, idleTimeMs: 0 })
    const idle = calculateFocusScore({ ...baseInput, idleTimeMs: HOUR_MS * 0.5 })
    expect(focused.finalScore).toBeGreaterThan(idle.finalScore)
  })

  it('idle penalty scales with idle ratio', () => {
    const lowIdle = calculateFocusScore({ ...baseInput, idleTimeMs: HOUR_MS * 0.1 })
    const highIdle = calculateFocusScore({ ...baseInput, idleTimeMs: HOUR_MS * 0.8 })
    expect(lowIdle.idlePenalty).toBeLessThan(highIdle.idlePenalty)
  })

  it('commitment not met reduces score', () => {
    const met = calculateFocusScore({ ...baseInput, commitmentMet: true })
    const notMet = calculateFocusScore({ ...baseInput, commitmentMet: false })
    expect(met.finalScore).toBeGreaterThan(notMet.finalScore)
  })

  it('lower self report reduces score', () => {
    const high = calculateFocusScore({ ...baseInput, selfReportRating: 5 })
    const low = calculateFocusScore({ ...baseInput, selfReportRating: 1 })
    expect(high.finalScore).toBeGreaterThan(low.finalScore)
  })
})

//research mode
describe('research mode', () => {
  const researchBase: FocusScoreInput = { ...baseInput, mode: 'research' }

  it('tab switches do not apply any penalty', () => {
    const result = calculateFocusScore({ ...researchBase, tabSwitchCount: 50 })
    expect(result.tabSwitchPenalty).toBe(0)
  })

  it('idle time does not apply any penalty', () => {
    const result = calculateFocusScore({
      ...researchBase,
      idleTimeMs: HOUR_MS * 0.9,
    })
    expect(result.idlePenalty).toBe(0)
  })

  it('self report carries the highest weight', () => {
    const highSelf = calculateFocusScore({
      ...researchBase,
      selfReportRating: 5,
      commitmentMet: false,
      checkIns: makeCheckIns(3, 3),
      missedCheckInCount: 3,
    })
    const lowSelf = calculateFocusScore({
      ...researchBase,
      selfReportRating: 1,
      commitmentMet: false,
      checkIns: makeCheckIns(3, 3),
      missedCheckInCount: 3,
    })
    expect(highSelf.finalScore).toBeGreaterThan(lowSelf.finalScore)
  })

  it('perfect research session scores 100', () => {
    const result = calculateFocusScore(researchBase)
    expect(result.finalScore).toBe(100)
  })
})

//practice mode
describe('practice mode', () => {
  const practiceBase: FocusScoreInput = { ...baseInput, mode: 'practice' }

  it('perfect practice session scores 100', () => {
    const result = calculateFocusScore(practiceBase)
    expect(result.finalScore).toBe(100)
  })

  it('tab switch penalty is lower than deep-focus for same switch count', () => {
    const deepFocus = calculateFocusScore({
      ...baseInput,
      mode: 'deep-focus',
      tabSwitchCount: 5,
    })
    const practice = calculateFocusScore({
      ...practiceBase,
      tabSwitchCount: 5,
    })
    expect(practice.tabSwitchPenalty).toBeLessThan(deepFocus.tabSwitchPenalty)
  })

  it('idle time still penalises in practice mode', () => {
    const focused = calculateFocusScore({ ...practiceBase, idleTimeMs: 0 })
    const idle = calculateFocusScore({ ...practiceBase, idleTimeMs: HOUR_MS * 0.5 })
    expect(focused.finalScore).toBeGreaterThan(idle.finalScore)
  })
})


//checkin scoring
describe('check-in scoring', () => {
  it('no check-ins scheduled gives full check-in score of 100', () => {
    const result = calculateFocusScore({
      ...baseInput,
      checkIns: [],
      missedCheckInCount: 0,
    })
    expect(result.checkInScore).toBe(100)
  })

  it('missing all check-ins gives check-in score of 0', () => {
    const result = calculateFocusScore({
      ...baseInput,
      checkIns: makeCheckIns(4, 4),
      missedCheckInCount: 4,
    })
    expect(result.checkInScore).toBe(0)
  })

  it('responding to half the check-ins gives score of 50', () => {
    const result = calculateFocusScore({
      ...baseInput,
      checkIns: makeCheckIns(4, 2),
      missedCheckInCount: 2,
    })
    expect(result.checkInScore).toBe(50)
  })

  it('responding to all check-ins gives score of 100', () => {
    const result = calculateFocusScore({
      ...baseInput,
      checkIns: makeCheckIns(3, 0),
      missedCheckInCount: 0,
    })
    expect(result.checkInScore).toBe(100)
  })

  it('more missed check-ins means lower final score', () => {
    const noneMissed = calculateFocusScore({
      ...baseInput,
      checkIns: makeCheckIns(4, 0),
      missedCheckInCount: 0,
    })
    const allMissed = calculateFocusScore({
      ...baseInput,
      checkIns: makeCheckIns(4, 4),
      missedCheckInCount: 4,
    })
    expect(noneMissed.finalScore).toBeGreaterThan(allMissed.finalScore)
  })
})

//self report scoring
describe('self report scoring', () => {
  it('rating 5 gives self report score of 100', () => {
    const result = calculateFocusScore({ ...baseInput, selfReportRating: 5 })
    expect(result.selfReportScore).toBe(100)
  })

  it('rating 1 gives self report score of 20', () => {
    const result = calculateFocusScore({ ...baseInput, selfReportRating: 1 })
    expect(result.selfReportScore).toBe(20)
  })

  it('rating 3 gives self report score of 60', () => {
    const result = calculateFocusScore({ ...baseInput, selfReportRating: 3 })
    expect(result.selfReportScore).toBe(60)
  })

  it('rating below 1 is clamped to 1', () => {
    const clamped = calculateFocusScore({ ...baseInput, selfReportRating: -5 })
    const min = calculateFocusScore({ ...baseInput, selfReportRating: 1 })
    expect(clamped.selfReportScore).toBe(min.selfReportScore)
  })

  it('rating above 5 is clamped to 5', () => {
    const clamped = calculateFocusScore({ ...baseInput, selfReportRating: 99 })
    const max = calculateFocusScore({ ...baseInput, selfReportRating: 5 })
    expect(clamped.selfReportScore).toBe(max.selfReportScore)
  })
})

//commitment scoring
describe('commitment scoring', () => {
  it('commitment met returns 100', () => {
    const result = calculateFocusScore({ ...baseInput, commitmentMet: true })
    expect(result.commitmentScore).toBe(100)
  })

  it('commitment not met returns 0', () => {
    const result = calculateFocusScore({ ...baseInput, commitmentMet: false })
    expect(result.commitmentScore).toBe(0)
  })
})

//breakdown fields
describe('breakdown fields', () => {
  it('returns all expected fields', () => {
    const result = calculateFocusScore(baseInput)
    expect(result).toHaveProperty('checkInScore')
    expect(result).toHaveProperty('selfReportScore')
    expect(result).toHaveProperty('commitmentScore')
    expect(result).toHaveProperty('tabSwitchPenalty')
    expect(result).toHaveProperty('idlePenalty')
    expect(result).toHaveProperty('weightedBaseScore')
    expect(result).toHaveProperty('finalScore')
  })

  it('weightedBaseScore is always >= finalScore when penalties exist', () => {
    const result = calculateFocusScore({
      ...baseInput,
      tabSwitchCount: 5,
      idleTimeMs: HOUR_MS * 0.2,
    })
    expect(result.weightedBaseScore).toBeGreaterThanOrEqual(result.finalScore)
  })

  it('all returned values are integers', () => {
    const result = calculateFocusScore(baseInput)
    Object.values(result).forEach(val => {
      expect(Number.isInteger(val)).toBe(true)
    })
  })
})
