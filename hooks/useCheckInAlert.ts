'use client'

import { useRef, useCallback, useEffect } from 'react'

const ORIGINAL_TITLE = typeof document !== 'undefined' ? document.title : ''

export function useCheckInAlert() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationRef = useRef<Notification | null>(null)

  // So that we will be able to play sounds, after the user does something i.e. "Start session", and to ensure that we resume if the context is suspended, else only have the first chime
  const unlockAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      return
    }
    audioCtxRef.current = new AudioContext()
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current

    if (!ctx) {
      return
    }

    // Play a single beep at a given time offset
    const playBeep = (delay: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.value = 1046 // C6

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay)

      // Sound increases nicely, not too sudden
      gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + delay + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.3)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(ctx.currentTime + delay)
      oscillator.stop(ctx.currentTime + delay + 0.3)
    }

    // Play 3 beeps in sequence so the alert cuts through background music
    const play = () => {
      playBeep(0)
      playBeep(0.4)
      playBeep(0.8)
    }

    // Need this cos browsers suspend the AudioContext when the tab goes to the background, need to resume first
    if (ctx.state === 'suspended') {
      ctx.resume().then(play)
    } else {
      play()
    }
  }, [])

  const flashTitle = useCallback((message: string) => {
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current)

    let showAlert = true
    titleIntervalRef.current = setInterval(() => {
      document.title = showAlert ? message : ORIGINAL_TITLE
      showAlert = !showAlert
    }, 1000)
  }, [])

  const stopFlashingTitle = useCallback(() => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current)
      titleIntervalRef.current = null
    }
    document.title = ORIGINAL_TITLE
  }, [])

  const showNotification = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!document.hidden) {
      return // If user is already on our app page, don't need to have this notif
    }
    notificationRef.current = new Notification('FocusForge check-in', {
      body: 'Are you still focused? Switch back to respond.',
      tag: 'focusforge-checkin',
    })
  }, [])

  const closeNotification = useCallback(() => {
    notificationRef.current?.close()
    notificationRef.current = null
  }, [])

  const triggerCheckInAlert = useCallback(() => {
    playChime()
    showNotification()
    flashTitle('⏰ Check in! — FocusForge')
  }, [playChime, showNotification, flashTitle])

  const clearCheckInAlert = useCallback(() => {
    stopFlashingTitle()
    closeNotification()
  }, [stopFlashingTitle, closeNotification])

  useEffect(() => {
    return () => {
      stopFlashingTitle()
      closeNotification()
    }
  }, [stopFlashingTitle, closeNotification])

  return {
    unlockAudio,
    requestNotificationPermission,
    triggerCheckInAlert,
    clearCheckInAlert,
  }
}