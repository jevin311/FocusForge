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

export function useSoundscape() {
  const {
      soundscapeId,
      soundscapeVolume,
      soundscapePlaying,
      setSoundscape,
      setSoundscapeVolume,
      setSoundscapePlaying,
    } = useSessionStore()  

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

    if (soundscapePlaying) {
      audio.play().catch(() => setSoundscapePlaying(false))
    }
  }, [soundscapeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to session status changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !soundscapeId) return

    if (soundscapePlaying) {
      audio.play().catch(() => setSoundscapePlaying(false))
    } else {
      audio.pause()
    }
  }, [soundscapePlaying, soundscapeId]) // eslint-disable-next-line react-hooks/exhaustive-deps

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
    if (id === soundscapeId) return // already selected — use play/pause instead
    setSoundscape(id)
    setSoundscapePlaying(true)
  }, [soundscapeId, setSoundscape, setSoundscapePlaying])

  const togglePlay = useCallback(() => {
    if (!soundscapeId) return
    setSoundscapePlaying(!soundscapePlaying)
  }, [soundscapeId, soundscapePlaying, setSoundscapePlaying])

  const stop = useCallback(() => {
    setSoundscapePlaying(false)
    setSoundscape(null)
  }, [setSoundscape, setSoundscapePlaying])

  const changeVolume = useCallback((volume: number) => {
    setSoundscapeVolume(volume)
  }, [setSoundscapeVolume])

  return {
    currentSound: soundscapeId,
    isPlaying: soundscapePlaying,
    volume: soundscapeVolume,
    selectSound,
    togglePlay,
    stop,
    changeVolume,
  }
}