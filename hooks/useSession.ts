'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useIdleDetection } from './useIdleDetection'
import { useCheckInAlert } from './useCheckInAlert'

type SessionStatus = 'idle' | 'active' | 'paused' | 'ended'

interface CheckIn {
  triggeredAt: number
  respondedAt: number | null
  missed: boolean
}

export interface SessionResult {
  durationMs: number
  idleTimeMs: number
  tabSwitchCount: number
  checkIns: CheckIn[]
  missedCheckInCount: number
}

interface UseSessionOptions {
  mode: string
  checkInIntervalMs?: number
  checkInResponseWindowMs?: number
}

const DEFAULT_CHECKIN_INTERVAL = 25 * 60 * 1000
const DEFAULT_CHECKIN_WINDOW = 15 * 1000

const getStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  const saved = sessionStorage.getItem(`ff_${key}`)
  try { return saved ? JSON.parse(saved) : fallback }
  catch { return fallback }
}

export function useSession({
  mode,
  checkInIntervalMs = DEFAULT_CHECKIN_INTERVAL,
  checkInResponseWindowMs = DEFAULT_CHECKIN_WINDOW,
}: UseSessionOptions) {
  const [status, setStatus] = useState<SessionStatus>(() => getStorage('status', 'idle'))
  const [elapsedMs, setElapsedMs] = useState<number>(() => getStorage('elapsed', 0))
  const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => getStorage('checkIns', []))

  useEffect(() => { sessionStorage.setItem('ff_status', JSON.stringify(status)) }, [status])
  useEffect(() => { sessionStorage.setItem('ff_elapsed', JSON.stringify(elapsedMs)) }, [elapsedMs])
  useEffect(() => { sessionStorage.setItem('ff_checkIns', JSON.stringify(checkIns)) }, [checkIns])

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const checkInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkInWindowRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTickRef = useRef<number | null>(null)

  // Tracks elapsed time within the current check-in interval so pause/resume does not reset teimr
  const checkInStartedAtRef = useRef<number | null>(null)
  const checkInElapsedMsRef = useRef<number>(0)
  const checkInFiredAtRef = useRef<number | null>(null)

  // Need this else after a miss, will not have any more checkins
  const didMissRef = useRef(false)

  const checkInIntervalMsRef = useRef(checkInIntervalMs)
  const checkInResponseWindowMsRef = useRef(checkInResponseWindowMs)
  useEffect(() => { checkInIntervalMsRef.current = checkInIntervalMs }, [checkInIntervalMs])
  useEffect(() => { checkInResponseWindowMsRef.current = checkInResponseWindowMs }, [checkInResponseWindowMs])

  const {
    tabSwitchCount,
    totalIdleTime,
    resetIdleTracking,
  } = useIdleDetection(mode === 'single-tab' && status === 'active')

  const {
    unlockAudio,
    requestNotificationPermission,
    triggerCheckInAlert,
    clearCheckInAlert,
  } = useCheckInAlert()

  const triggerCheckInAlertRef = useRef(triggerCheckInAlert)
  const clearCheckInAlertRef = useRef(clearCheckInAlert)
  useEffect(() => { triggerCheckInAlertRef.current = triggerCheckInAlert }, [triggerCheckInAlert])
  useEffect(() => { clearCheckInAlertRef.current = clearCheckInAlert }, [clearCheckInAlert])

  // Timer tick
  useEffect(() => {
    if (status !== 'active') {
      lastTickRef.current = null
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }

    lastTickRef.current = Date.now()
    tickRef.current = setInterval(() => {
      const now = Date.now()
      const delta = now - (lastTickRef.current ?? now)
      lastTickRef.current = now
      setElapsedMs((prev) => prev + delta)
    }, 1000)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [status])

  // Check-in scheduling
  // scheduleCheckIn has no deps — uses refs for everything so it never recreates,
  // so tht the scheduling useEffect won't accidentally reset the timer
  const scheduleCheckIn = useCallback((remainingMs?: number) => {
    if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current)

    const delay = remainingMs ?? checkInIntervalMsRef.current
    checkInStartedAtRef.current = Date.now()

    checkInTimerRef.current = setTimeout(() => {
      checkInStartedAtRef.current = null
      checkInElapsedMsRef.current = 0
      checkInFiredAtRef.current = Date.now() // record when prompt appeared
      didMissRef.current = false // reset before the response window starts

      const checkIn: CheckIn = {
        triggeredAt: Date.now(),
        respondedAt: null,
        missed: false,
      }
      setActiveCheckIn(checkIn)
      triggerCheckInAlertRef.current()

      checkInWindowRef.current = setTimeout(() => {
        console.log('[checkin] window expired, checking if missed...')
        setActiveCheckIn((current) => {
          if (!current || current.respondedAt !== null) return current
          const missedCheckIn: CheckIn = { ...current, missed: true }
          setCheckIns((prev) => [...prev, missedCheckIn])
          clearCheckInAlertRef.current()
          // Schedule next check-in from when the prompt fired, not when the window expired,
          // so missed check-ins don't push the interval forward by the response window duration, ensure they are in our scheduled timimg
          setTimeout(() => {
            checkInElapsedMsRef.current = 0
            checkInFiredAtRef.current = null
            const nextDelay = Math.max(0, checkInIntervalMsRef.current - checkInResponseWindowMsRef.current)
            scheduleCheckIn(nextDelay)
          }, 0)
          return null
        })
      }, checkInResponseWindowMsRef.current)
    }, delay)
  }, [])

  useEffect(() => {
    if (status === 'active') {
      // Resume: subtract however much of the interval already elapsed before the pause,
      // so that the timing is not off due to the users' reaction timing
      const remaining = checkInIntervalMsRef.current - checkInElapsedMsRef.current
      scheduleCheckIn(remaining > 0 ? remaining : checkInIntervalMsRef.current)
    } else {
      // Pause and end, save how much of the interval has elapsed so far
      if (checkInStartedAtRef.current !== null) {
        checkInElapsedMsRef.current += Date.now() - checkInStartedAtRef.current
        checkInStartedAtRef.current = null
      }
      if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current)
      if (checkInWindowRef.current) clearTimeout(checkInWindowRef.current)
      clearCheckInAlertRef.current()
    }

    return () => {
      if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current)
      if (checkInWindowRef.current) clearTimeout(checkInWindowRef.current)
    }
  }, [status, scheduleCheckIn])

  // User responds to check-in
  const respondToCheckIn = useCallback(() => {
    if (!activeCheckIn) return

    if (checkInWindowRef.current) clearTimeout(checkInWindowRef.current)
    clearCheckInAlertRef.current()

    const respondedCheckIn: CheckIn = { ...activeCheckIn, respondedAt: Date.now() }
    setCheckIns((prev) => [...prev, respondedCheckIn])
    setActiveCheckIn(null)

    // Subtract how long the prompt was visible before the user clicked,
    // so the next interval starts from when the check-in fired, not when they respond
    const reactionTimeMs = checkInFiredAtRef.current
      ? Date.now() - checkInFiredAtRef.current
      : 0
    checkInFiredAtRef.current = null
    checkInElapsedMsRef.current = 0
    scheduleCheckIn(Math.max(0, checkInIntervalMsRef.current - reactionTimeMs))
  }, [activeCheckIn, scheduleCheckIn])

  // Controls
  const start = useCallback(() => {
    const savedElapsed = getStorage('elapsed', 0)
    const savedStatus = getStorage<SessionStatus>('status', 'idle')

    // Only reset data when genuinely starting fresh (not when user resume a paused/active session)
    if (savedElapsed === 0 && savedStatus === 'idle') {
      setElapsedMs(0)
      setCheckIns([])
      resetIdleTracking()
    }

    unlockAudio()
    requestNotificationPermission()
    setStatus('active')
  }, [resetIdleTracking, unlockAudio, requestNotificationPermission])

  const pause = useCallback(() => {
    if (status !== 'active') return
    setStatus('paused')
  }, [status])

  const resume = useCallback(() => {
    if (status !== 'paused') return
    setStatus('active')
  }, [status])

  const end = useCallback((): SessionResult => {
    setStatus('ended')
    clearCheckInAlertRef.current()
    checkInElapsedMsRef.current = 0
    checkInStartedAtRef.current = null

    const missedCheckInCount = checkIns.filter((c) => c.missed).length

    const result: SessionResult = {
      durationMs: elapsedMs,
      idleTimeMs: totalIdleTime,
      tabSwitchCount,
      checkIns,
      missedCheckInCount,
    }

    // sessionStorage is only cleared when the user confirms Done in PostSessionCard, else our tiemr will reset when
    // we use "back"
    sessionStorage.setItem('ff_status', JSON.stringify('paused'))

    return result
  }, [elapsedMs, totalIdleTime, tabSwitchCount, checkIns])

  return {
    status,
    elapsedMs,
    activeCheckIn,
    checkIns,
    tabSwitchCount,
    totalIdleTime,
    start,
    pause,
    resume,
    end,
    respondToCheckIn,
    unlockAudio,
  }
}