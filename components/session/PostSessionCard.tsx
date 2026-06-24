'use client'
import { useState } from 'react'
import { useSessionStore } from '@/lib/session-store'
import { calculateFocusScore } from '@/lib/scoring/calculateFocusScore'
import type { SessionResult } from '@/hooks/useSession'

interface Props {
  result: SessionResult
  onDone: () => void
  onResume: () => void
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function PostSessionCard({ result, onDone, onResume }: Props) {
  const config = useSessionStore((s) => s.config)
  const [selfRating, setSelfRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [commitmentMet, setCommitmentMet] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [markTaskComplete, setMarkTaskComplete] = useState(true)

  const canSubmit = selfRating > 0 && commitmentMet !== null

  async function handleSubmit() {
    if (!canSubmit || !config) return
    setSaving(true)
    setSaveError(null)
    
    //local time-stamp
    const endedAtDate = new Date()
    const startedAtDate = new Date(endedAtDate.getTime() - result.durationMs)
    
    //format yyyy-mm-dd
    const localDate = new Date(endedAtDate.getTime() - endedAtDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0]

    const payload = {
      mode: config.mode,
      taskId: config.taskId ?? null,
      taskTitle: config.taskTitle ?? null,
      startedAt: startedAtDate.toISOString(),
      endedAt: endedAtDate.toISOString(),
      durationMs: result.durationMs,
      idleTimeMs: result.idleTimeMs,
      tabSwitchCount: result.tabSwitchCount,
      checkIns: result.checkIns,
      missedCheckInCount: result.missedCheckInCount,
      selfReportRating: selfRating,
      commitmentMet: commitmentMet!,
      localDate,
      markTaskComplete: markTaskComplete && !!config.taskId,
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`)
      }
 
      setSubmitted(true)
    } catch (error) {
      console.error('Submission error:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!config) return null

  const scoreBreakdown = selfRating > 0 && commitmentMet !== null
    ? calculateFocusScore({
        durationMs: result.durationMs,
        idleTimeMs: result.idleTimeMs,
        tabSwitchCount: result.tabSwitchCount,
        checkIns: result.checkIns,
        missedCheckInCount: result.missedCheckInCount,
        selfReportRating: selfRating,
        commitmentMet: commitmentMet!,
        mode: config.mode,
      })
    : null

  const modeColour: Record<string, string> = {
    'deep-focus': '#a5b4fc',
    'research': '#6ee7b7',
    'practice': '#fcd34d',
  }
  const colour = modeColour[config.mode] ?? '#f97316'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#13100e', border: '1px solid rgba(249,115,22,0.25)',
        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {submitted ? '🎉' : '⚒'}
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
            {submitted ? 'Session saved!' : 'Session complete'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {config.taskTitle}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {[
            { label: 'Duration', value: formatDuration(result.durationMs) },
            { label: 'Check-ins', value: `${result.checkIns.length - result.missedCheckInCount}/${result.checkIns.length}` },
            { label: 'Tab switches', value: config.tabMode === 'single-tab' ? String(result.tabSwitchCount) : '—' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Commitment reminder */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
          padding: '10px 14px', marginBottom: '20px',
          fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic',
        }}>
          &ldquo;{config.commitment}&rdquo;
        </div>

        {!submitted ? (
          <>
            {/* Self rating */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                How focused were you?
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setSelfRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    style={{
                      background: 'transparent', border: 'none',
                      fontSize: '28px', cursor: 'pointer', padding: '4px',
                      filter: star <= (hoveredStar || selfRating)
                        ? 'none'
                        : 'grayscale(1) opacity(0.3)',
                      transform: star <= (hoveredStar || selfRating) ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.1s',
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Commitment met */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Did you complete your goal?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: '✓ Yes', value: true },
                  { label: '✗ No', value: false },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setCommitmentMet(opt.value)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      background: commitmentMet === opt.value
                        ? opt.value ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.12)'
                        : 'var(--bg-card)',
                      border: commitmentMet === opt.value
                        ? opt.value ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(239,68,68,0.3)'
                        : '1px solid var(--border-subtle)',
                      color: commitmentMet === opt.value
                        ? opt.value ? '#6ee7b7' : '#fca5a5'
                        : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Mark task complete toggle ── */}
            {config.taskId && (
              <div
                onClick={() => setMarkTaskComplete(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  background: markTaskComplete ? 'rgba(129,140,248,0.08)' : 'var(--bg-card)',
                  border: markTaskComplete ? '1px solid rgba(129,140,248,0.25)' : '1px solid var(--border-subtle)',
                  marginBottom: '16px', transition: 'all 0.15s', userSelect: 'none',
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                  background: markTaskComplete ? 'rgba(129,140,248,0.35)' : 'transparent',
                  border: markTaskComplete ? '1.5px solid rgba(129,140,248,0.6)' : '1.5px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#c4b5fd',
                }}>
                  {markTaskComplete && '✓'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Mark task as completed
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '1px' }}>
                    {config.taskTitle}
                  </div>
                </div>
              </div>
            )}

            {/* Live score preview */}
            {scoreBreakdown && (
              <div style={{
                background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
                borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: colour, letterSpacing: '-1px' }}>
                  {scoreBreakdown.finalScore}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Focus Score
                </div>
                {/* Breakdown */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Check-ins', val: scoreBreakdown.checkInScore },
                    { label: 'Self report', val: scoreBreakdown.selfReportScore },
                    { label: 'Commitment', val: scoreBreakdown.commitmentScore },
                  ].map(b => (
                    <div key={b.label} style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                      {b.label}: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{b.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Error message ── */}
            {saveError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '12px',
                fontSize: '12px', color: '#fca5a5', textAlign: 'center',
              }}>
                ⚠ {saveError}
              </div>
            )}

             {/* ── Save button ── */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              style={{
                width: '100%', padding: '13px', marginBottom: '8px',
                background: canSubmit
                  ? 'linear-gradient(135deg, #c2410c, #ea580c, #f97316)'
                  : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '12px',
                color: canSubmit ? '#fff' : 'var(--text-faint)',
                fontSize: '14px', fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 4px 20px rgba(194,65,12,0.35)' : 'none',
              }}
            >
              {saving ? 'Saving...' : 'Save Session'}
            </button>
 
            {/* ── Return to timer ── */}
            <button
              onClick={onResume}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                color: 'var(--text-muted)', fontSize: '12px',
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              ← Return to timer
            </button>
          </>
        ) : (
          <button
            onClick={onDone}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #c2410c, #ea580c, #f97316)',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(194,65,12,0.35)',
            }}
          >
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  )
}