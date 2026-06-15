'use client'

import { useSession } from '@/hooks/useSession'

export default function TestSessionPage() {
  const {
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
  } = useSession({
    mode: 'single-tab',
    checkInIntervalMs: 8000,
    checkInResponseWindowMs: 4000,
  })

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>Session Debug Panel</h1>

      <p>Status: <strong>{status}</strong></p>
      <p>Elapsed: {(elapsedMs / 1000).toFixed(1)}s</p>
      <p>Tab switches: {tabSwitchCount}</p>
      <p>Idle time: {(totalIdleTime / 1000).toFixed(1)}s</p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button onClick={start} disabled={status !== 'idle'}>Start</button>
        <button onClick={pause} disabled={status !== 'active'}>Pause</button>
        <button onClick={resume} disabled={status !== 'paused'}>Resume</button>
        <button onClick={() => console.log(end())} disabled={status === 'idle' || status === 'ended'}>
          End (logs result)
        </button>
      </div>

      {activeCheckIn && (
        <div style={{ border: '2px solid orange', padding: 12, marginBottom: 16 }}>
          <p>⏰ Check-in! Are you still focused?</p>
          <button onClick={respondToCheckIn}>Yes, I&apos;m here</button>
        </div>
      )}

      <h3>Check-in history</h3>
      <ul>
        {checkIns.map((c, i) => (
          <li key={i}>
            {new Date(c.triggeredAt).toLocaleTimeString()} — {c.missed ? '❌ missed' : '✅ responded'}
          </li>
        ))}
      </ul>
    </div>
  )
}