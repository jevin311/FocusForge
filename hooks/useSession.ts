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

export function useSession({
  mode,
  checkInIntervalMs = DEFAULT_CHECKIN_INTERVAL,
  checkInResponseWindowMs = DEFAULT_CHECKIN_WINDOW,
}: UseSessionOptions) {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const checkInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkInWindowRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTickRef = useRef<number | null>(null)

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

  // --- Timer tick ---
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

  // --- Check-in scheduling ---
  const scheduleCheckIn = useCallback(() => {
    if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current)

    checkInTimerRef.current = setTimeout(() => {
      const checkIn: CheckIn = {
        triggeredAt: Date.now(),
        respondedAt: null,
        missed: false,
      }
      setActiveCheckIn(checkIn)
      triggerCheckInAlert()

      checkInWindowRef.current = setTimeout(() => {
        setActiveCheckIn((current) => {
          if (!current || current.respondedAt !== null) return current
          const missedCheckIn: CheckIn = { ...current, missed: true }
          setCheckIns((prev) => [...prev, missedCheckIn])
          clearCheckInAlert()
          return null
        })
      }, checkInResponseWindowMs)
    }, checkInIntervalMs)
  }, [checkInIntervalMs, checkInResponseWindowMs, triggerCheckInAlert, clearCheckInAlert])

  useEffect(() => {
    if (status === 'active') {
      scheduleCheckIn()
    } else {
      if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current)
      if (checkInWindowRef.current) clearTimeout(checkInWindowRef.current)
      clearCheckInAlert()
    }

    return () => {
      if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current)
      if (checkInWindowRef.current) clearTimeout(checkInWindowRef.current)
    }
  }, [status, scheduleCheckIn, clearCheckInAlert])

  // --- User responds to check-in ---
  const respondToCheckIn = useCallback(() => {
    if (!activeCheckIn) return

    if (checkInWindowRef.current) clearTimeout(checkInWindowRef.current)
    clearCheckInAlert()

    const respondedCheckIn: CheckIn = { ...activeCheckIn, respondedAt: Date.now() }
    setCheckIns((prev) => [...prev, respondedCheckIn])
    setActiveCheckIn(null)

    scheduleCheckIn()
  }, [activeCheckIn, clearCheckInAlert, scheduleCheckIn])

  // --- Controls ---
  const start = useCallback(() => {
    if (status !== 'idle') return
    setElapsedMs(0)
    setCheckIns([])
    setActiveCheckIn(null)
    resetIdleTracking()
    unlockAudio()
    requestNotificationPermission()
    setStatus('active')
  }, [status, resetIdleTracking, unlockAudio, requestNotificationPermission])

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
    clearCheckInAlert()

    const missedCheckInCount = checkIns.filter((c) => c.missed).length

    const result: SessionResult = {
      durationMs: elapsedMs,
      idleTimeMs: totalIdleTime,
      tabSwitchCount,
      checkIns,
      missedCheckInCount,
    }

    return result
  }, [elapsedMs, totalIdleTime, tabSwitchCount, checkIns, clearCheckInAlert])

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
  }
}