'use client'
import { useEffect, useState, useMemo } from 'react'
import { getForgeTier } from '@/lib/forgeTier'
import ForgeFlameBackdrop from './ForgeFlameBackdrop'

interface Session {
  id: string
  mode: string
  task_title: string | null
  duration_ms: number
  focus_score: number
  commitment_met: boolean
  created_at: string
}
 
interface DayHeat {
  avgFocusScore: number
  sessionCount: number
  totalFocusMinutes: number
}
 
interface Props {
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

//helper
const MODE_COLOUR: Record<string, string> = {
  'deep-focus': '#a5b4fc',
  'research': '#6ee7b7',
  'practice': '#fcd34d',
}
 
const MODE_LABEL: Record<string, string> = {
  'deep-focus': 'Deep Focus',
  'research': 'Research',
  'practice': 'Practice',
}

//glowing heat color
function getHeatStyle(score: number, isSelected: boolean, isToday: boolean) {
  const todayRing = isToday && !isSelected
    ? { outline: '2px solid rgba(249,115,22,0.6)', outlineOffset: '-2px' }
    : {}
 
  if (score === 0) {
    return {
      background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
      border: isSelected ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid transparent',
      ...todayRing,
    }
  }
 
  // Score-to-colour: matches ForgePanel flame palette for visual cohesion
  let rgb = ''
  if (score >= 85) rgb = '249, 115, 22'       // blazing orange
  else if (score >= 65) rgb = '194, 65, 12'   // strong amber
  else if (score >= 45) rgb = '154, 52, 18'   // warm ember
  else rgb = '120, 40, 10'                    // low heat
 
  return {
    background: `radial-gradient(circle at center, rgba(${rgb}, 0.55) 0%, rgba(${rgb}, 0.06) 80%)`,
    border: isSelected
      ? `1.5px solid rgba(${rgb}, 1)`
      : `1px solid rgba(${rgb}, 0.25)`,
    boxShadow: isSelected ? `0 0 20px rgba(${rgb}, 0.35)` : undefined,
    ...todayRing,
  }
}
 
function formatMins(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
 
function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getMonthContainerStyle(tierLabel: string) {
  if (tierLabel === 'Blazing') {
    return {
      border: '1px solid rgba(249,115,22,0.5)',
      background: 'radial-gradient(ellipse 500px 200px at 50% -10%, rgba(249,115,22,0.12) 0%, transparent 70%)',
      boxShadow: '0 0 50px rgba(249,115,22,0.08)',
    }
  }
  if (tierLabel === 'Kindled') {
    return {
      border: '1px solid rgba(194,65,12,0.35)',
      background: 'radial-gradient(ellipse 500px 200px at 50% -10%, rgba(194,65,12,0.07) 0%, transparent 70%)',
      boxShadow: 'none',
    }
  }
  // Smoldering / no data yet — same understated look the calendar has today
  return {
    border: '1px solid var(--border-subtle)',
    background: 'transparent',
    boxShadow: 'none',
  }
}

function getMonthCaption(tierLabel: string, activeDays: number, daysElapsed: number, hasData: boolean): string {
  if (!hasData) return 'No sessions yet this month — start one to light the forge.'
  const dayPart = `${activeDays}/${daysElapsed} days active`
  if (tierLabel === 'Blazing') return `🔥 Blazing month — ${dayPart}`
  if (tierLabel === 'Kindled') return `Kindled — ${dayPart}, keep it up`
  return `Smoldering — ${dayPart}`
}


export default function AnalyticsCalendar({ selectedDate, onSelectDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  // heatmap keyed by YYYY-MM-DD from daily_records
  const [heatmap, setHeatmap] = useState<Record<string, DayHeat>>({})
  // all sessions loaded once, filtered client-side per selected day
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [loadingHeat, setLoadingHeat] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
 
  const todayStr = localDateStr(new Date())
 
 
  // Load all sessions once for the detail panel
  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then((data: Session[]) => {
        if (!Array.isArray(data)) return
        
        setAllSessions(data)

        // Dynamically build the heatmap using local timezone strings
        const localHeatmap: Record<string, DayHeat> = {}
        
        // Group sessions by local date
        const sessionsByDate: Record<string, Session[]> = {}
        data.forEach(s => {
          const localDate = localDateStr(new Date(s.created_at))
          if (!sessionsByDate[localDate]) {
            sessionsByDate[localDate] = []
          }
          sessionsByDate[localDate].push(s)
        })

        // Calculate averages per day
        Object.entries(sessionsByDate).forEach(([dateStr, daySessions]) => {
          const totalFocusMinutes = Math.round(
            daySessions.reduce((sum, s) => sum + s.duration_ms, 0) / 60000
          )
          const avgFocusScore = Math.round(
            daySessions.reduce((sum, s) => sum + s.focus_score, 0) / daySessions.length
          )

          localHeatmap[dateStr] = {
            avgFocusScore,
            sessionCount: daySessions.length,
            totalFocusMinutes
          }
        })

        setHeatmap(localHeatmap)
        setLoadingHeat(false)
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [])
 
  // Calendar grid for current month view
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()      // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  
  const monthStats = useMemo(() => {
    const today = new Date()
    const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    const daysElapsed = isFutureMonth ? 0 : isCurrentMonth ? today.getDate() : daysInMonth

    let activeDays = 0
    let totalWeightedScore = 0
    let totalSessionCount = 0

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const heat = heatmap[dateStr]
      if (heat && heat.sessionCount > 0) {
        activeDays++
        totalWeightedScore += heat.avgFocusScore * heat.sessionCount
        totalSessionCount += heat.sessionCount
      }
    }

    const avgScore = totalSessionCount > 0 ? Math.round(totalWeightedScore / totalSessionCount) : 0
    const activityRatio = daysElapsed > 0 ? Math.min(1, activeDays / daysElapsed) : 0
    const monthHeat = daysElapsed > 0 ? Math.round(avgScore * 0.5 + activityRatio * 100 * 0.5) : 0
    const hasData = daysElapsed > 0 && activeDays > 0

    return { activeDays, daysElapsed, avgScore, monthHeat, hasData }
  }, [heatmap, year, month, daysInMonth])

  // streak passed as 0 — the aura-ring concept belongs to "today's ongoing
  // streak", which doesn't mean anything for an arbitrary past/future month
  const monthTier = getForgeTier(monthStats.monthHeat, 0)
  const containerStyle = getMonthContainerStyle(monthTier.label)
  const monthCaption = getMonthCaption(monthTier.label, monthStats.activeDays, monthStats.daysElapsed, monthStats.hasData)

  const days: Array<{ day: number; date: string } | null> = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({ day: i, date: localDateStr(date) })
  }
 
  // Sessions for the selected day
  const daySessionsRaw = selectedDate
  ? allSessions.filter(s => localDateStr(new Date(s.created_at)) === selectedDate)
  : []
 
  // Aggregate for the selected day 
  const dayHeat = selectedDate ? heatmap[selectedDate] : null
  const dayTotalMins = dayHeat?.totalFocusMinutes
    ?? Math.round(daySessionsRaw.reduce((s, x) => s + x.duration_ms, 0) / 60000)
  const dayAvgScore = dayHeat?.avgFocusScore
    ?? (daySessionsRaw.length
      ? Math.round(daySessionsRaw.reduce((s, x) => s + x.focus_score, 0) / daySessionsRaw.length)
      : 0)
  const daySessionCount = dayHeat?.sessionCount ?? daySessionsRaw.length
 
  const selectedDateFormatted = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-SG', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null
 
  return (
    <div>

      <style>{`
        @keyframes monthGlowPulse {
          0%, 100% { opacity: 0.5; transform: scaleY(1); }
          50% { opacity: 0.85; transform: scaleY(1.20); }
        }
      `}</style>

      {/* Themed container — border/background/glow shift with the month's
          activity + score tier, same 3-stage scale as ForgePanel */}
      <div style={{
        borderRadius: '18px',
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.6s ease',
        ...containerStyle,
      }}>

        {monthTier.label === 'Blazing' && (
          <div style={{
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '150px', 
            background: `linear-gradient(to bottom, ${monthTier.glow}55 0%, transparent 70%)`,
            animation: 'monthGlowPulse 3s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
        )}

        {monthTier.label === 'Blazing' && <ForgeFlameBackdrop />}
 
      {/* Calendar header  */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', position: 'relative', zIndex: 1,
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
            {monthName}
          </h2>
          <div style={{
              fontSize: '11px', fontWeight: 600, color: monthTier.glow,
              marginTop: '5px',
            }}>
              {monthCaption}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              Click a day to see details
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', width: '30px', height: '30px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                }}
              >‹</button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', width: '30px', height: '30px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                }}
              >›</button>
            </div>
          </div>
        </div>
 
        {/*Day-of-week labels*/}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '10px', marginBottom: '8px', textAlign: 'center',
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600 }}>
              {d}
            </div>
          ))}
        </div>
 
        {/*Calendar grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '10px', gridAutoRows: '64px', position: 'relative', zIndex: 1,
        }}>
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />
  
            const isSelected = d.date === selectedDate
            const isToday = d.date === todayStr
            const heat = heatmap[d.date]
            const score = heat?.avgFocusScore ?? 0
            const hStyle = getHeatStyle(score, isSelected, isToday)
 
            return (
              <div
                key={d.date}
                onClick={() => onSelectDate(d.date)}
                style={{
                  ...hStyle,
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: '15px', fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#f97316' : '#fff',
                }}>
                  {d.day}
                </span>
                {score > 0 && (
                  <span style={{
                    fontSize: '9px',
                    color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                    marginTop: '2px',
                  }}>
                    {score}°
                  </span>
                )}
                {heat && heat.sessionCount > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '5px',
                    display: 'flex', gap: '2px',
                  }}>
                    {Array.from({ length: Math.min(heat.sessionCount, 4) }).map((_, j) => (
                      <div key={j} style={{
                        width: '3px', height: '3px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.4)',
                      }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
 
      {/* Selected-day detail*/}
      {selectedDate && (
        <div style={{ marginTop: '32px' }}>
 
          {/* Day heading */}
          <div style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)',
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '14px',
          }}>
            {selectedDateFormatted}
          </div>
 
          {loadingSessions ? (
            <div style={{ color: 'var(--text-faint)', fontSize: '12px', padding: '16px 0' }}>
              Loading...
            </div>
          ) : daySessionsRaw.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '24px', textAlign: 'center',
              color: 'var(--text-faint)', fontSize: '13px',
            }}>
              No sessions recorded on this day.
            </div>
          ) : (
            <>
              {/* Summary row — 3 stat cards */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px', marginBottom: '16px',
              }}>
                {[
                  { label: 'Sessions', value: String(daySessionCount) },
                  { label: 'Focus time', value: formatMins(dayTotalMins) },
                  { label: 'Avg score', value: `${dayAvgScore}` },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', padding: '14px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '9px', color: 'var(--text-faint)',
                      textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '3px',
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
 
              {/* Session list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {daySessionsRaw.map((session, idx) => {
                  const colour = MODE_COLOUR[session.mode] ?? '#f97316'
                  const durationMins = Math.round(session.duration_ms / 60000)
                  const time = new Date(session.created_at).toLocaleTimeString('en-SG', {
                    hour: '2-digit', minute: '2-digit',
                  })
 
                  return (
                    <div key={session.id} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      {/* Session number */}
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: `rgba(${colour === '#a5b4fc' ? '165,180,252' : colour === '#6ee7b7' ? '110,231,183' : '252,211,77'}, 0.12)`,
                        border: `1px solid ${colour}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 700, color: colour, flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
 
                      {/* Task title + mode */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: 500,
                          color: 'rgba(255,255,255,0.85)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginBottom: '3px',
                        }}>
                          {session.task_title ?? 'Untitled session'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', color: colour }}>
                            {MODE_LABEL[session.mode] ?? session.mode}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                            {time} · {durationMins > 0 ? `${durationMins}m` : '< 1m'}
                          </span>
                        </div>
                      </div>
 
                      {/* Score + commitment */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: '18px', fontWeight: 700,
                          color: session.focus_score >= 75 ? '#f97316'
                            : session.focus_score >= 50 ? 'rgba(255,255,255,0.7)'
                            : 'rgba(255,255,255,0.4)',
                          letterSpacing: '-0.5px',
                        }}>
                          {session.focus_score}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {session.commitment_met ? '✓ goal met' : '✗ goal missed'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}