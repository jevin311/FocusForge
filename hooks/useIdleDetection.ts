// hooks/useIdleDetection.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface IdleDetectionResult {
  isTabActive: boolean
  tabSwitchCount: number
  totalIdleTime: number
  resetIdleTracking: () => void
}

export function useIdleDetection(enabled: boolean): IdleDetectionResult {
  const [isTabActive, setIsTabActive] = useState(true)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [totalIdleTime, setTotalIdleTime] = useState(0)

  const hiddenAtRef = useRef<number | null>(null)

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return

    if (document.hidden) {
      // User switched tab so start tracking idle time
      hiddenAtRef.current = Date.now()
      setIsTabActive(false)
      setTabSwitchCount((prev) => prev + 1)
    } else {
      // User went back to the tab so add the additional idle duration
      if (hiddenAtRef.current !== null) {
        const idleDuration = Date.now() - hiddenAtRef.current
        setTotalIdleTime((prev) => prev + idleDuration)
        hiddenAtRef.current = null
      }
      setIsTabActive(true)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, handleVisibilityChange])

  const resetIdleTracking = useCallback(() => {
    setIsTabActive(true)
    setTabSwitchCount(0)
    setTotalIdleTime(0)
    hiddenAtRef.current = null
  }, [])

  return {
    isTabActive,
    tabSwitchCount,
    totalIdleTime,
    resetIdleTracking,
  }
}