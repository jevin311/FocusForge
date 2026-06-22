'use client'
import { useEffect, useState, useRef } from 'react'
import { useSessionStore } from '@/lib/session-store'
import FlameIndicator from './FlameIndicator'

interface Props {
  onEndSession: () => void   // called when user clicks End — parent handles showing PostSessionCard
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FloatingTimer({ onEndSession }: Props) {
  const { config, startedAt } = useSessionStore()

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [isMinimised, setIsMinimised] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!startedAt) return
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startedAt])

  // Tab visibility — dims flame when user leaves
  useEffect(() => {
    function handleVisibilityChange() {
      setIsTabVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  if (!config || !startedAt) return null

  const totalSeconds = config.timerType === 'timed' && config.durationMins
    ? config.durationMins * 60
    : null

  // For countdown: remaining = total - elapsed
  const remainingSeconds = totalSeconds !== null
    ? Math.max(0, totalSeconds - elapsedSeconds)
    : null

  const displaySeconds = config.timerType === 'timed'
    ? remainingSeconds!
    : elapsedSeconds

  const isCountdownFinished = config.timerType === 'timed' && remainingSeconds === 0

  // Progress for timed sessions (0 to 1)
  const progress = totalSeconds ? Math.min(elapsedSeconds / totalSeconds, 1) : null

  const modeColour: Record<string, string> = {
    'Deep Focus': '#a5b4fc',
    'Research': '#6ee7b7',
    'Practice': '#fcd34d',
  }
  const colour = modeColour[config.mode] ?? '#f97316'

  // Minimised pill view
  if (isMinimised) {
    return (
      <div
        onClick={() => setIsMinimised(false)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 200,
          background: '#13100e',
          border: '1px solid rgba(249,115,22,0.4)',
          borderRadius: '30px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <FlameIndicator dimmed={!isTabVisible} />
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(displaySeconds)}
        </span>
      </div>
    )
  }

  // Full view
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 200,
      background: '#13100e',
      border: `1px solid ${isCountdownFinished ? '#f97316' : 'rgba(249,115,22,0.25)'}`,
      borderRadius: '20px',
      padding: '24px',
      width: '280px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 4px' }}>
            {config.mode}
          </p>
          <p style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.7)',
            margin: 0, maxWidth: '160px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {config.taskTitle}
          </p>
        </div>
        {/* Minimise button */}
        <button
          onClick={() => setIsMinimised(true)}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-faint)', fontSize: '16px',
            cursor: 'pointer', lineHeight: 1, padding: '0',
          }}
        >
          −
        </button>
      </div>

      {/* Flame + Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
        <FlameIndicator dimmed={!isTabVisible} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '42px', fontWeight: 800, color: isCountdownFinished ? '#f97316' : '#fff',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px',
            textShadow: isCountdownFinished ? '0 0 20px rgba(249,115,22,0.6)' : 'none',
          }}>
            {formatTime(displaySeconds)}
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '4px 0 0' }}>
            {config.timerType === 'timed' ? 'remaining' : 'elapsed'}
          </p>
        </div>
      </div>

      {/* Progress bar — timed sessions only */}
      {progress !== null && (
        <div style={{
          height: '3px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px', marginBottom: '16px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            width: `${progress * 100}%`,
            background: isCountdownFinished ? '#f97316' : colour,
            transition: 'width 1s linear',
          }} />
        </div>
      )}

      {/* Tab visibility warning */}
      {!isTabVisible && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '8px', padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '11px', color: '#fca5a5', textAlign: 'center',
        }}>
          ⚠ Tab inactive — focus score affected
        </div>
      )}

      {/* Countdown finished banner */}
      {isCountdownFinished && (
        <div style={{
          background: 'rgba(249,115,22,0.12)',
          border: '1px solid rgba(249,115,22,0.4)',
          borderRadius: '8px', padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '11px', color: '#f97316', textAlign: 'center',
          fontWeight: 600,
        }}>
          ⚒ Time&apos;s up — great work!
        </div>
      )}

      {/* Commitment reminder */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px', padding: '8px 12px',
        marginBottom: '16px',
        fontSize: '11px', color: 'var(--text-muted)',
        fontStyle: 'italic',
      }}>
        &ldquo;{config.commitment}&rdquo;
      </div>

      {/* End session button */}
      <button
        onClick={onEndSession}
        style={{
          width: '100%', padding: '11px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          color: '#fca5a5', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'
        }}
      >
        End Session
      </button>

    </div>
  )
}