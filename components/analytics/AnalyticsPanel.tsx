'use client'
import { useEffect, useState } from 'react'

interface Session {
  created_at: string
  duration_ms: number
  focus_score: number
  mode: string
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
}

function calculateStreak(sessions: Session[]): number {
  const dates = [...new Set(sessions.map(s => s.created_at.slice(0, 10)))].sort().reverse()
  if (dates.length === 0) return 0
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  const cursor = new Date(today)
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    if (!dates.includes(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function AnalyticsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then((sessions: Session[]) => {
        if (!Array.isArray(sessions)) { setLoading(false); return }

        const today = new Date()
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)

        const totalMins = Math.round(sessions.reduce((s, x) => s + x.duration_ms, 0) / 60000)
        const daysStudied = new Set(sessions.map(s => s.created_at.slice(0, 10))).size
        const avgFocusScore = sessions.length
          ? Math.round(sessions.reduce((s, x) => s + x.focus_score, 0) / sessions.length)
          : 0
        const weekMins = Math.round(
          sessions
            .filter(s => new Date(s.created_at) >= weekAgo)
            .reduce((s, x) => s + x.duration_ms, 0) / 60000
        )

        // Best day
        const byDay: Record<string, number> = {}
        sessions.forEach(s => {
          const d = s.created_at.slice(0, 10)
          byDay[d] = (byDay[d] ?? 0) + s.duration_ms / 60000
        })
        const bestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]

        // Mode breakdown
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
        })
        setLoading(false)
      })
  }, [])

  const statItems = [
    { label: 'Total time studied', value: loading ? '--' : `${Math.floor((stats?.totalMins ?? 0) / 60)}h ${(stats?.totalMins ?? 0) % 60}m` },
    { label: 'Days studied', value: loading ? '--' : String(stats?.daysStudied ?? 0) },
    { label: 'Current streak', value: loading ? '--' : `${stats?.streak ?? 0} 🔥` },
    { label: 'Avg focus score', value: loading ? '--' : `${stats?.avgFocusScore ?? 0}` },
    { label: 'Sessions total', value: loading ? '--' : String(stats?.totalSessions ?? 0) },
    { label: 'This week', value: loading ? '--' : `${stats?.weekMins ?? 0}m` },
    {
      label: 'Best day',
      value: loading ? '--' : stats?.bestDay
        ? `${new Date(stats.bestDay + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })} · ${stats.bestDayMins}m`
        : 'No data yet',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {statItems.map(item => (
        <div key={item.label} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.value}</span>
        </div>
      ))}

      {/* Mode breakdown */}
      {!loading && stats?.modeBreakdown && Object.keys(stats.modeBreakdown).length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
            Sessions by mode
          </div>
          {Object.entries(stats.modeBreakdown).map(([mode, count]) => {
            const colour = mode === 'deep-focus' ? '#a5b4fc' : mode === 'research' ? '#6ee7b7' : '#fcd34d'
            const total = stats.totalSessions
            const pct = Math.round((count / total) * 100)
            return (
              <div key={mode} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '10px', color: colour }}>
                    {mode.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{count} sessions</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: colour, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}