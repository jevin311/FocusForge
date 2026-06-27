'use client'

import { useState } from 'react'
import { SessionConfig, SessionMode, TimerType, TabMode } from '@/types/session'
import { useSessionStore } from '@/lib/session-store'

interface Task {
  id: string
  title: string
  mode: string
}

interface Props {
  task: Task
  onClose: () => void
}

const MODES: { value: SessionMode; colour: string; bg: string; border: string; desc: string }[] = [
  {
    value: 'deep-focus',
    colour: '#a5b4fc', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)',
    desc: 'Single task, no interruptions',
  },
  {
    value: 'research',
    colour: '#6ee7b7', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)',
    desc: 'Reading, exploring, gathering',
  },
  {
    value: 'practice',
    colour: '#fcd34d', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)',
    desc: 'Problem sets, drills, coding',
  },
]

const DURATIONS = [25, 45, 90]

export default function SessionLauncherModal({ task, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<SessionMode | null>(null)
  const [timerType, setTimerType] = useState<TimerType | null>(null)
  const [durationMins, setDurationMins] = useState<number | null>(null)
  const [tabMode, setTabMode] = useState<TabMode | null>(null)
  const [commitment, setCommitment] = useState('')

  const { startSession, unlockAudioFn } = useSessionStore()

  function handleStart() {
    if (!mode || !timerType || !tabMode || !commitment.trim()) return

    // Unlock AudioContext from this user gesture so that our chime works later
    unlockAudioFn?.()

    const config: SessionConfig = {
      taskId: task.id,
      taskTitle: task.title,
      mode,
      timerType,
      durationMins: timerType === 'timed' ? durationMins : null,
      tabMode,
      commitment,
    }

    sessionStorage.setItem('ff_status', JSON.stringify('active'))
    startSession(config)
    onClose()
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, backdropFilter: 'blur(4px)',
      }}
    >

      {/* Modal — stop click propagating to backdrop */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#13100e',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '18px', padding: '28px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
            Starting session for
          </p>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
            {task.title}
          </h2>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              height: '3px', flex: 1, borderRadius: '2px',
              background: s <= step ? '#f97316' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* Step 1 — Mode */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Choose your focus mode
            </p>
            {MODES.map(m => (
              <div
                key={m.value}
                onClick={() => { setMode(m.value); setStep(2) }}
                style={{
                  padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                  border: `1px solid ${mode === m.value ? m.border : 'var(--border-subtle)'}`,
                  background: mode === m.value ? m.bg : 'var(--bg-card)',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: m.colour }}>{m.value}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '3px 0 0' }}>{m.desc}</p>
                </div>
                {mode === m.value && <span style={{ color: m.colour, fontSize: '12px' }}>✓</span>}
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — Timer type */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              How do you want to time this?
            </p>
            {/* Stopwatch option */}
            <div
              onClick={() => { setTimerType('stopwatch'); setDurationMins(null); setStep(3) }}
              style={{
                padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `1px solid ${timerType === 'stopwatch' ? 'rgba(249,115,22,0.4)' : 'var(--border-subtle)'}`,
                background: timerType === 'stopwatch' ? 'rgba(249,115,22,0.08)' : 'var(--bg-card)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>⏱ Open session</span>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '3px 0 0' }}>Stopwatch — go until you're done</p>
            </div>

            {/* Timed option */}
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              border: `1px solid ${timerType === 'timed' ? 'rgba(249,115,22,0.4)' : 'var(--border-subtle)'}`,
              background: timerType === 'timed' ? 'rgba(249,115,22,0.08)' : 'var(--bg-card)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>⏳ Timed session</span>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '3px 0 6px' }}>Countdown timer — pick a duration</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={(e) => { e.stopPropagation(); setTimerType('timed'); setDurationMins(d); setStep(3) }}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      background: durationMins === d ? '#f97316' : 'rgba(255,255,255,0.06)',
                      border: durationMins === d ? 'none' : '1px solid var(--border-subtle)',
                      color: durationMins === d ? '#fff' : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: 600,
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Tab mode */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Tab setup
            </p>
            {[
              {
                value: 'single-tab' as TabMode,
                label: 'Single tab',
                desc: 'Everything I need is here — track my focus',
                note: 'Tab switches will affect your focus score',
              },
              {
                value: 'multi-tab' as TabMode,
                label: 'Multi tab',
                desc: 'I have notes or resources in other tabs',
                note: 'Tab tracking disabled — score based on check-ins',
              },
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => { setTabMode(opt.value); setStep(4) }}
                style={{
                  padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                  border: `1px solid ${tabMode === opt.value ? 'rgba(249,115,22,0.4)' : 'var(--border-subtle)'}`,
                  background: tabMode === opt.value ? 'rgba(249,115,22,0.08)' : 'var(--bg-card)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{opt.label}</span>
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '3px 0 2px' }}>{opt.desc}</p>
                <p style={{ fontSize: '10px', color: 'rgba(249,115,22,0.6)', margin: 0 }}>{opt.note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Step 4 — Commitment */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              What will you finish this session?
            </p>
            <input
              autoFocus
              value={commitment}
              onChange={e => setCommitment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitment.trim() && handleStart()}
              placeholder="e.g. Finish Chapter 4 summary notes"
              maxLength={120}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: '10px', padding: '12px 14px',
                color: '#e8eaf0', fontSize: '13px',
                outline: 'none', fontFamily: 'inherit', width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleStart}
              disabled={!commitment.trim()}
              style={{
                width: '100%', padding: '14px',
                background: commitment.trim()
                  ? 'linear-gradient(135deg, #c2410c, #ea580c, #f97316)'
                  : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '12px',
                color: commitment.trim() ? '#fff' : 'var(--text-faint)',
                fontSize: '14px', fontWeight: 700, cursor: commitment.trim() ? 'pointer' : 'not-allowed',
                boxShadow: commitment.trim() ? '0 4px 20px rgba(194,65,12,0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              ⚒ Start Session
            </button>
          </div>
        )}

        {/* Back + cancel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontSize: '12px',
                cursor: 'pointer', padding: 0,
              }}
            >
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-faint)', fontSize: '12px',
              cursor: 'pointer', padding: 0,
            }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}