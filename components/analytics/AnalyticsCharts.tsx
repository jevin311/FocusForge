'use client'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from 'recharts'

interface Session {
  id: string
  mode: string
  duration_ms: number
  focus_score: number
  created_at: string
}

interface TrendPoint { date: string; label: string; avgScore: number }
interface HourPoint { hour: number; label: string; minutes: number }

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TREND_DAYS = 30

interface TooltipPayloadItem {
  dataKey: string
  name: string
  value: number
  color?: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: '#1a1410', border: '1px solid rgba(249,115,22,0.3)',
      borderRadius: '8px', padding: '8px 12px', fontSize: '11px',
    }}>
      <div style={{ color: 'var(--text-faint)', marginBottom: '2px' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color || '#f97316', fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsCharts() {
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [hourly, setHourly] = useState<HourPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSessions, setHasSessions] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then((sessions: Session[]) => {
        if (!Array.isArray(sessions) || sessions.length === 0) {
          setHasSessions(false)
          setLoading(false)
          return
        }

        // Focus score trend — last 30 calendar days, 0 for days with no sessions
        const today = new Date()
        const byDate: Record<string, { total: number; count: number }> = {}
        sessions.forEach(s => {
          const d = localDateStr(new Date(s.created_at))
          if (!byDate[d]) byDate[d] = { total: 0, count: 0 }
          byDate[d].total += s.focus_score
          byDate[d].count += 1
        })

        const trendPoints: TrendPoint[] = []
        for (let i = TREND_DAYS - 1; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          const dateStr = localDateStr(d)
          const entry = byDate[dateStr]
          trendPoints.push({
            date: dateStr,
            label: d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
            avgScore: entry ? Math.round(entry.total / entry.count) : 0,
          })
        }
        setTrend(trendPoints)

        // Minutes by hour of day, all-time, in the user's local time
        const byHour: Record<number, number> = {}
        sessions.forEach(s => {
          const hour = new Date(s.created_at).getHours()
          byHour[hour] = (byHour[hour] ?? 0) + s.duration_ms / 60000
        })

        const hourPoints: HourPoint[] = Array.from({ length: 24 }, (_, h) => ({
          hour: h,
          label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
          minutes: Math.round(byHour[h] ?? 0),
        }))
        setHourly(hourPoints)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ color: 'var(--text-faint)', fontSize: '12px', padding: '32px 0', textAlign: 'center' }}>
        Loading trends...
      </div>
    )
  }

  if (!hasSessions) {
    return (
      <div style={{
        color: 'var(--text-faint)', fontSize: '12px', padding: '32px 16px',
        textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
      }}>
        Trends will appear here once you've logged a few sessions.
      </div>
    )
  }

  const activeHours = hourly.filter(h => h.minutes > 0)
  const bestHour = activeHours.length
    ? activeHours.reduce((a, b) => (b.minutes > a.minutes ? b : a))
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: '14px', padding: '20px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '16px' }}>
          Focus score — last 30 days
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              interval={4}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(249,115,22,0.3)' }} />
            <Line
              type="monotone"
              dataKey="avgScore"
              name="Avg score"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: '14px', padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Focus minutes by time of day
          </div>
          {bestHour && (
            <div style={{ fontSize: '10px', color: '#fb923c' }}>
              Peak: {bestHour.label}
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hourly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
              interval={2}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.06)' }} />
            <Bar dataKey="minutes" name="Minutes" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}