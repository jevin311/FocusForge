'use client'
import { useState } from 'react'
import { useSessionStore } from '@/lib/session-store'
import { calculateFocusScore } from '@/lib/scoring/calculateFocusScore'
import type { SessionResult } from '@/hooks/useSession'

interface Props {
  result: SessionResult
  onDone: () => void
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

export default function PostSessionCard({ result, onDone }: Props) {
  const config = useSessionStore((s) => s.config)
  const [selfRating, setSelfRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [commitmentMet, setCommitmentMet] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const canSubmit = selfRating > 0 && commitmentMet !== null

  async function handleSubmit() {
    if (!canSubmit || !config) return
    setSaving(true)

    const scoreBreakdown = calculateFocusScore({
      durationMs: result.durationMs,
      idleTimeMs: result.idleTimeMs,
      tabSwitchCount: result.tabSwitchCount,
      checkIns: result.checkIns,
      missedCheckInCount: result.missedCheckInCount,
      selfReportRating: selfRating,
      commitmentMet: commitmentMet!,
      mode: config.mode,
    })

    const payload = {
      task_id: config.taskId,
      mode: config.mode,
      timer_type: config.timerType,
      tab_mode: config.tabMode,
      commitment: config.commitment,
      commitment_met: commitmentMet,
      duration_ms: result.durationMs,
      idle_time_ms: result.idleTimeMs,
      tab_switch_count: result.tabSwitchCount,
      checkins_total: result.checkIns.length,
      checkins_missed: result.missedCheckInCount,
      self_report_rating: selfRating,
      focus_score: scoreBreakdown.finalScore,
    }

    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSubmitted(true)
    setSaving(false)
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

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              style={{
                width: '100%', padding: '14px',
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
          </>
        ) : (
          /* Done state */
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