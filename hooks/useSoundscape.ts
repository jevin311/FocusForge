'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '@/lib/session-store'

export const SOUNDSCAPE_OPTIONS = [
  { id: 'lofi', label: 'Lofi', icon: '🎵', file: '/sounds/lofi.mp3' },
  { id: 'rain', label: 'Rain', icon: '🌧', file: '/sounds/rain.mp3' },
  { id: 'white', label: 'River', icon: '🌊', file: '/sounds/river.mp3' },
  { id: 'forest', label: 'Forest', icon: '🌿', file: '/sounds/forest.mp3' },
  { id: 'piano', label: 'Piano', icon: '🎹', file: '/sounds/piano.mp3' },
] as const

export type SoundscapeId = typeof SOUNDSCAPE_OPTIONS[number]['id']

type SessionStatus = 'idle' | 'active' | 'paused' | 'ended'

export function useSoundscape(status: SessionStatus) {
  const { soundscapeId, soundscapeVolume, setSoundscape, setSoundscapeVolume } = useSessionStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Track the last sound we loaded so we don't recreate the Audio object unnecessarily
  const loadedIdRef = useRef<string | null>(null)

  // Create or swap the Audio element when the selected sound changes
  useEffect(() => {
    if (!soundscapeId) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
        loadedIdRef.current = null
      }
      return
    }

    if (loadedIdRef.current === soundscapeId) return // same file, no need to reload

    // Fade out the old audio before swapping
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    const option = SOUNDSCAPE_OPTIONS.find((o) => o.id === soundscapeId)
    if (!option) return

    const audio = new Audio(option.file)
    audio.loop = true
    audio.volume = soundscapeVolume
    audioRef.current = audio
    loadedIdRef.current = soundscapeId

    // Only play if session is currently active
    if (status === 'active') {
      audio.play().catch(() => {
        // Autoplay blocked as user must interact first
      })
    }
  }, [soundscapeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to session status changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !soundscapeId) return

    if (status === 'active') {
      // Resume playback when session resumes
      audio.play().catch(() => { })
    } else if (status === 'paused') {
      // Pause audio with the session
      audio.pause()
    } else if (status === 'ended' || status === 'idle') {
      // Stop completely and reset
      audio.pause()
      audio.currentTime = 0
    }
  }, [status, soundscapeId])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = soundscapeVolume
    }
  }, [soundscapeVolume])

  // Clean up everything on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  const selectSound = useCallback((id: SoundscapeId) => {
    // clicking the active sound will turn it off
    if (id === soundscapeId) {
      setSoundscape(null)
    } else {
      setSoundscape(id)
    }
  }, [soundscapeId, setSoundscape])

  const changeVolume = useCallback((volume: number) => {
    setSoundscapeVolume(volume)
  }, [setSoundscapeVolume])

  return {
    currentSound: soundscapeId,
    volume: soundscapeVolume,
    selectSound,
    changeVolume,
  }
}