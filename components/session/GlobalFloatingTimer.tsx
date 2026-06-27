'use client'
import { useEffect } from 'react'
import { useSessionStore } from '@/lib/session-store'
import FloatingTimer from './FloatingTimer'

export default function GlobalFloatingTimer() {
  const { isActive, config, pendingResult, endSession } = useSessionStore()

  // On mount, if store says active but sessionStorage is empty, it's a stale reload — clear it
  useEffect(() => {
    if (isActive && !sessionStorage.getItem('ff_status')) {
      endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isActive || !config || pendingResult) return null

  return <FloatingTimer />
}