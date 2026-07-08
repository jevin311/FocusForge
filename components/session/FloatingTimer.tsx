'use client'
import { useEffect, useState, useRef } from 'react'
import { useSessionStore } from '@/lib/session-store'
import { useSession } from '@/hooks/useSession'
import { useRouter } from 'next/navigation'
import FlameIndicator from './FlameIndicator'

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FloatingTimer() {
  const { config, setPendingResult, setUnlockAudioFn } = useSessionStore()
  const router = useRouter()
  const [isMinimised, setIsMinimised] = useState(false)

  const {
    status,
    elapsedMs,
    activeCheckIn,
    start,
    end,
    pause,
    resume,
    respondToCheckIn,
    unlockAudio,
  } = useSession({
    mode: config?.tabMode ?? 'single-tab',
    // Set only for e2e runs (playwright.config.ts webServer.env). Unset for
    // real users, so useSession.ts's real 25min/15s defaults apply.
    checkInIntervalMs: Number(process.env.NEXT_PUBLIC_CHECKIN_INTERVAL_MS) || undefined,
    checkInResponseWindowMs: Number(process.env.NEXT_PUBLIC_CHECKIN_RESPONSE_WINDOW_MS) || undefined,
    checkInsEnabled: !(config?.mode === 'practice' && config?.timerType === 'timed'),
  })

  const hasStarted = useRef(false)
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    // Only call start() when the session is truly idle (fresh launch).
    // If status is already 'active' or 'paused' (restored from sessionStorage),
    // do NOT call start() — it would reset elapsed time.
    // If paused, we leave it paused. If active, the tick effect restarts automatically.
    const savedStatus = sessionStorage.getItem('ff_status')
    const parsed = savedStatus ? JSON.parse(savedStatus) : 'idle'
    // 'active' written by SessionLauncherModal means fresh start, not a restore
    // 'paused' means restoring a paused session — don't restart
    if (parsed === 'idle' || parsed === 'active') {
      start()
    }
  }, [])

  // Register unlockAudio into the store so that our SessionLauncherModal can call it
  // from a user gesture (required by browser autoplay policy, else will not have sound)
  useEffect(() => {
    setUnlockAudioFn(unlockAudio)
  }, [unlockAudio, setUnlockAudioFn])

  // Tab visibility for flame
  const [isTabVisible, setIsTabVisible] = useState(true)
  useEffect(() => {
    function handleVisibility() {
      setIsTabVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const totalSeconds = config?.timerType === 'timed' && config.durationMins
    ? config.durationMins * 60
    : null
  const displaySeconds = totalSeconds !== null
    ? Math.max(0, totalSeconds - elapsedSeconds)
    : elapsedSeconds
  const isCountdownFinished = totalSeconds !== null && displaySeconds === 0

  // Tab title timer — skip update while check-in alert is flashing so the two don't fight
  // counts DOWN for timed sessions, counts UP for open/stopwatch sessions
  useEffect(() => {
    if (activeCheckIn) return // let useCheckInAlert own the title during a check-in
    if (status === 'active') {
      if (totalSeconds !== null) {
        document.title = isCountdownFinished
          ? `✅ Time's up! — FocusForge`
          : `⏳ ${formatTime(displaySeconds)} — FocusForge`
      } else {
        document.title = `⏱ ${formatTime(displaySeconds)} — FocusForge`
      }
    } else if (status === 'paused') {
      document.title = '⏸ Paused — FocusForge'
    }
    return () => { document.title = 'FocusForge' }
  }, [displaySeconds, status, activeCheckIn, totalSeconds, isCountdownFinished])

  if (!config) return null

  const progress = totalSeconds ? Math.min(elapsedSeconds / totalSeconds, 1) : null

  function handleEndSession() {
    const result = end()           // end() from useSession — stops hook, returns SessionResult
    document.title = 'FocusForge' // restore title
    const safeResult: import('@/hooks/useSession').SessionResult = {
      durationMs: result?.durationMs ?? 0,
      idleTimeMs: result?.idleTimeMs ?? 0,
      tabSwitchCount: result?.tabSwitchCount ?? 0,
      checkIns: result?.checkIns ?? [],
      missedCheckInCount: result?.missedCheckInCount ?? 0,
    }
    // Store result in Zustand so dashboard can show PostSessionCard
    setPendingResult(safeResult)
    router.push('/dashboard')
  }

  const modeColour: Record<string, string> = {
    'deep-focus': '#a5b4fc',
    'research': '#6ee7b7',
    'practice': '#fcd34d',
  }
  const colour = modeColour[config.mode] ?? '#f97316'

  if (isMinimised) {
    return (
      <div
        onClick={() => setIsMinimised(false)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          background: '#13100e', border: '1px solid rgba(249,115,22,0.4)',
          borderRadius: '30px', padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <FlameIndicator dimmed={!isTabVisible} />
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(displaySeconds)}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
      background: '#13100e',
      border: `1px solid ${isCountdownFinished ? '#f97316' : 'rgba(249,115,22,0.25)'}`,
      borderRadius: '20px', padding: '24px', width: '280px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 4px' }}>
            {config.mode.replace('-', ' ')}
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.taskTitle}
          </p>
        </div>
        <button onClick={() => setIsMinimised(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: '16px', cursor: 'pointer' }}>−</button>
      </div>

      {/* Flame + Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
        <FlameIndicator dimmed={!isTabVisible} />
        <div style={{ textAlign: 'center' }}>
          <div
            data-testid="timer-display"
            style={{
              fontSize: '42px', fontWeight: 800, color: isCountdownFinished ? '#f97316' : '#fff',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px',
            }}
          >
            {formatTime(displaySeconds)}
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '4px 0 0' }}>
            {config.timerType === 'timed' ? 'remaining' : 'elapsed'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '2px', width: `${progress * 100}%`, background: colour, transition: 'width 1s linear' }} />
        </div>
      )}

      {/* Check-in prompt */}
      {activeCheckIn && (
        <div style={{
          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)',
          borderRadius: '10px', padding: '12px', marginBottom: '12px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: '#f97316', fontWeight: 600, margin: '0 0 8px' }}>⏰ Still focusing?</p>
          <button
            onClick={respondToCheckIn}
            style={{
              background: '#f97316', border: 'none', borderRadius: '8px',
              padding: '8px 20px', color: '#fff', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Yes, I&apos;m here ✓
          </button>
        </div>
      )}

      {/* Tab warning */}
      {!isTabVisible && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
          fontSize: '11px', color: '#fca5a5', textAlign: 'center',
        }}>
          ⚠ Tab inactive — focus score affected
        </div>
      )}

      {/* Commitment */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
        padding: '8px 12px', marginBottom: '16px',
        fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic',
      }}>
        &ldquo;{config.commitment}&rdquo;
      </div>

      {/* Pause / Resume */}
      <button
        onClick={() => { unlockAudio(); status === 'active' ? pause() : resume() }}
        style={{
          width: '100%', padding: '11px', marginBottom: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          color: 'var(--text-muted)', fontSize: '12px',
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        {status === 'active' ? '⏸ Pause' : '▶ Resume'}
      </button>

      {/* End session */}
      <button
        onClick={handleEndSession}
        style={{
          width: '100%', padding: '11px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', color: '#fca5a5', fontSize: '12px',
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        End Session
      </button>

      {/* Soundscape player shortcut */}
      <button
        onClick={() => router.push('/lofi')}
        style={{
          width: '100%', padding: '8px', marginTop: '8px',
          background: 'transparent', border: 'none',
          color: 'var(--text-faint)', fontSize: '11px',
          cursor: 'pointer', textAlign: 'center',
        }}
      >
        🎵 Ambient sounds
      </button>
    </div>
  )
}