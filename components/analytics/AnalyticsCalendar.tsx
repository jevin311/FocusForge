'use client'
import { useEffect, useState } from 'react'

interface DayData {
  date: string
  totalMins: number
  avgFocusScore: number
  sessionCount: number
}

interface DaySession {
  id: string
  created_at: string
  duration_ms: number
  focus_score: number
  mode: string
  commitment: string
  commitment_met: boolean
  checkins_total: number
  checkins_missed: number
  tab_switch_count: number
  tab_mode: string
}

interface Props {
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

function getScoreColour(score: number): string {
  if (score === 0) return 'rgba(255,255,255,0.06)'
  if (score >= 80) return '#f97316'
  if (score >= 60) return '#fb923c'
  if (score >= 40) return '#c2410c'
  return '#7c2d12'
}

function getLast12Weeks(): string[] {
  const days: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - 83)
  start.setDate(start.getDate() - start.getDay())
  const cursor = new Date(start)
  while (cursor <= today) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const CELL = 14
const GAP = 3

export default function AnalyticsCalendar({ selectedDate, onSelectDate }: Props) {
  const [heatmap, setHeatmap] = useState<DayData[]>([])
  const [daySessions, setDaySessions] = useState<DaySession[]>([])
  const [loadingDay, setLoadingDay] = useState(false)

  useEffect(() => {
    fetch('/api/sessions/heatmap')
      .then(r => r.json())
      .then(data => setHeatmap(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    setLoadingDay(true)
    fetch(`/api/sessions?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        setDaySessions(Array.isArray(data) ? data : [])
        setLoadingDay(false)
      })
  }, [selectedDate])

  const days = getLast12Weeks()
  const dataByDate = Object.fromEntries(heatmap.map(d => [d.date, d]))
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const today = new Date().toISOString().slice(0, 10)

  // Month labels
  const monthLabels: { label: string; colIndex: number }[] = []
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0] + 'T00:00:00')
    if (firstDay.getDate() <= 7) {
      monthLabels.push({
        label: firstDay.toLocaleDateString('en-SG', { month: 'short' }),
        colIndex: wi,
      })
    }
  })

  function formatMins(ms: number): string {
    const m = Math.round(ms / 60000)
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`
    return `${m}m`
  }

  const modeColour: Record<string, string> = {
    'deep-focus': '#a5b4fc',
    'research': '#6ee7b7',
    'practice': '#fcd34d',
  }

  return (
    <div>
      {/* Month labels row */}
      <div style={{ display: 'flex', marginLeft: '22px', marginBottom: '4px' }}>
        {weeks.map((_, wi) => {
          const label = monthLabels.find(m => m.colIndex === wi)
          return (
            <div key={wi} style={{ width: CELL + GAP, flexShrink: 0, fontSize: '9px', color: 'var(--text-faint)' }}>
              {label?.label ?? ''}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: '4px' }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{
              height: CELL, width: '18px', fontSize: '8px',
              color: i % 2 === 1 ? 'var(--text-faint)' : 'transparent',
              display: 'flex', alignItems: 'center',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map(date => {
                const data = dataByDate[date]
                const score = data?.avgFocusScore ?? 0
                const isFuture = date > today
                const isToday = date === today
                const isSelected = date === selectedDate

                return (
                  <div
                    key={date}
                    onClick={() => !isFuture && data && onSelectDate(date)}
                    style={{
                      width: CELL, height: CELL, borderRadius: '3px',
                      background: isFuture ? 'transparent' : getScoreColour(score),
                      border: isSelected
                        ? '1.5px solid #fff'
                        : isToday
                          ? '1.5px solid #f97316'
                          : '1px solid transparent',
                      cursor: data && !isFuture ? 'pointer' : 'default',
                      transition: 'transform 0.1s',
                      flexShrink: 0,
                    }}
                    onMouseOver={e => {
                      if (data) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)'
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', marginLeft: '22px' }}>
        <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>Less</span>
        {[0, 30, 50, 70, 90].map(s => (
          <div key={s} style={{ width: CELL, height: CELL, borderRadius: '3px', background: getScoreColour(s) }} />
        ))}
        <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>More</span>
      </div>

      {/* Day detail */}
      {selectedDate && (
        <div style={{ marginTop: '28px' }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '14px',
          }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-SG', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>

          {loadingDay ? (
            <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Loading...</p>
          ) : daySessions.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>No sessions on this day.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {daySessions.map(session => (
                <div key={session.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: '14px', padding: '16px',
                }}>
                  {/* Session header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                        color: modeColour[session.mode] ?? '#f97316',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${modeColour[session.mode] ?? '#f97316'}40`,
                      }}>
                        {session.mode.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '22px', fontWeight: 800, color: '#f97316',
                      letterSpacing: '-1px',
                    }}>
                      {session.focus_score}
                    </div>
                  </div>

                  {/* Commitment */}
                  <p style={{
                    fontSize: '12px', color: 'rgba(255,255,255,0.7)',
                    fontStyle: 'italic', margin: '0 0 12px',
                  }}>
                    &ldquo;{session.commitment}&rdquo;
                    <span style={{ marginLeft: '8px', fontStyle: 'normal' }}>
                      {session.commitment_met ? '✅' : '❌'}
                    </span>
                  </p>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { label: 'Duration', value: formatMins(session.duration_ms) },
                      {
                        label: 'Check-ins',
                        value: `${session.checkins_total - session.checkins_missed}/${session.checkins_total}`,
                      },
                      {
                        label: 'Tab switches',
                        value: session.tab_mode === 'single-tab' ? String(session.tab_switch_count) : '—',
                      },
                      { label: 'Focus score', value: String(session.focus_score) },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '8px', padding: '8px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '2px' }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}