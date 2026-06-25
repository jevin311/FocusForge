'use client'
import { useEffect, useState } from 'react'

interface Session {
  id: string
  mode: string
  task_title: string | null
  duration_ms: number
  focus_score: number
  commitment_met: boolean
  created_at: string
}

interface Stats {
  totalMins: number
  daysStudied: number
  streak: number
  avgFocusScore: number
  totalSessions: number
  weekMins: number
  bestDay: string | null
  bestDayMins: number
  modeBreakdown: Record<string, number>
  commitmentRate: number
}

function calculateStreak(sessions: Session[]): number {
  const uniqueDates = new Set(
    sessions.map(s => {
      const d = new Date(s.created_at)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
  )
 
  if (uniqueDates.size === 0) return 0
 
  // Use local date to avoid timezone shifting streak by a day
  const todayLocal = new Date()
  const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`
 
  let streak = 0
  const cursor = new Date(todayStr + 'T00:00:00')
 
  while (true) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    if (uniqueDates.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (dateStr === todayStr) {
      // No session today yet — still check yesterday
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
 
  return streak
}

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
 
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>{sub}</div>
      )}
    </div>
  )
}
 
export default function AnalyticsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then((sessions: Session[]) => {
        if (!Array.isArray(sessions) || sessions.length === 0) {
          setLoading(false)
          return
        }
 
        const today = new Date()
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
 
        const totalMins = Math.round(sessions.reduce((s, x) => s + x.duration_ms, 0) / 60000)
        const daysStudied = new Set(sessions.map(s => s.created_at.slice(0, 10))).size
        const avgFocusScore = Math.round(
          sessions.reduce((s, x) => s + x.focus_score, 0) / sessions.length
        )
        const weekMins = Math.round(
          sessions
            .filter(s => new Date(s.created_at) >= weekAgo)
            .reduce((s, x) => s + x.duration_ms, 0) / 60000
        )
        const commitmentRate = Math.round(
          (sessions.filter(s => s.commitment_met).length / sessions.length) * 100
        )
 
        // Best day by total focus minutes
        const byDay: Record<string, number> = {}
        sessions.forEach(s => {
          const d = s.created_at.slice(0, 10)
          byDay[d] = (byDay[d] ?? 0) + s.duration_ms / 60000
        })
        const bestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
 
        // Mode breakdown by session count
        const modeBreakdown: Record<string, number> = {}
        sessions.forEach(s => {
          modeBreakdown[s.mode] = (modeBreakdown[s.mode] ?? 0) + 1
        })
 
        setStats({
          totalMins, daysStudied, avgFocusScore, totalSessions: sessions.length,
          weekMins, streak: calculateStreak(sessions),
          bestDay: bestDayEntry?.[0] ?? null,
          bestDayMins: Math.round(bestDayEntry?.[1] ?? 0),
          modeBreakdown,
          commitmentRate,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])
 
  const totalHours = Math.floor((stats?.totalMins ?? 0) / 60)
  const totalMinsRem = (stats?.totalMins ?? 0) % 60
  const weekHours = Math.floor((stats?.weekMins ?? 0) / 60)
  const weekMinsRem = (stats?.weekMins ?? 0) % 60
 
  const bestDayFormatted = stats?.bestDay
    ? new Date(stats.bestDay + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
    : null
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
 
      {/* Section label */}
      <div style={{
        fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)',
        textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '4px',
      }}>
        All Time
      </div>
 
      {loading ? (
        <div style={{ color: 'var(--text-faint)', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>
          Loading stats...
        </div>
      ) : !stats ? (
        <div style={{
          color: 'var(--text-faint)', fontSize: '12px', padding: '32px 16px',
          textAlign: 'center', lineHeight: 1.6,
        }}>
          No sessions yet. Complete a session to see your stats.
        </div>
      ) : (
        <>
          <StatCard
            label="Total focus time"
            value={totalHours > 0 ? `${totalHours}h ${totalMinsRem}m` : `${totalMinsRem}m`}
            sub={`${stats.totalSessions} session${stats.totalSessions !== 1 ? 's' : ''} · ${stats.daysStudied} day${stats.daysStudied !== 1 ? 's' : ''}`}
          />
 
          <StatCard
            label="This week"
            value={weekHours > 0 ? `${weekHours}h ${weekMinsRem}m` : `${weekMinsRem}m`}
          />
 
          <StatCard
            label="Current streak"
            value={stats.streak > 0 ? `${stats.streak} day${stats.streak !== 1 ? 's' : ''} 🔥` : 'None yet'}
          />
 
          <StatCard
            label="Avg focus score"
            value={`${stats.avgFocusScore}`}
            sub="out of 100"
          />
 
          <StatCard
            label="Goal completion"
            value={`${stats.commitmentRate}%`}
            sub="sessions where commitment was met"
          />
 
          {bestDayFormatted && (
            <StatCard
              label="Best day"
              value={bestDayFormatted}
              sub={`${stats.bestDayMins}m of focus`}
            />
          )}
 
          {/* Mode breakdown */}
          {Object.keys(stats.modeBreakdown).length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)',
                textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px',
              }}>
                Sessions by mode
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(stats.modeBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mode, count]) => {
                    const colour = MODE_COLOUR[mode] ?? '#f97316'
                    const pct = Math.round((count / stats.totalSessions) * 100)
                    return (
                      <div key={mode}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: colour }}>
                            {MODE_LABEL[mode] ?? mode}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: colour, borderRadius: '2px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}