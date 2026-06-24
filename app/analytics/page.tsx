'use client'
import { Suspense, useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel'
import AnalyticsCalendar from '@/components/analytics/AnalyticsCalendar'
import { createClient } from '@/lib/supabase/client'

interface HeatDay {
  date: string
  avgFocusScore: number
  sessionCount: number
}
 
function StreakHeatmap() {
  const [grid, setGrid] = useState<HeatDay[]>([])
 
  useEffect(() => {
    fetch('/api/sessions/heatmap')
      .then(r => r.json())
      .then(data => { if (data?.grid) setGrid(data.grid) })
      .catch(() => {})
  }, [])

   const weeks: HeatDay[][] = []
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7))
  }
 
  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
 
  function cellColour(score: number): string {
    if (score === 0) return 'rgba(255,255,255,0.04)'
    if (score >= 85) return 'rgba(249,115,22,0.85)'
    if (score >= 65) return 'rgba(194,65,12,0.75)'
    if (score >= 45) return 'rgba(154,52,18,0.65)'
    return 'rgba(100,35,10,0.55)'
  }
 
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: '14px', padding: '16px 20px',
    }}>
      <div style={{
        fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)',
        textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px',
      }}>
        12-week activity
      </div>
      <div style={{ display: 'flex', gap: '3px' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day) => (
              <div
                key={day.date}
                title={day.sessionCount > 0
                  ? `${day.date}: ${day.sessionCount} session${day.sessionCount !== 1 ? 's' : ''} · ${day.avgFocusScore}° avg`
                  : day.date}
                style={{
                  width: '12px', height: '12px', borderRadius: '3px',
                  background: cellColour(day.avgFocusScore),
                  border: day.date === todayStr ? '1px solid rgba(249,115,22,0.8)' : '1px solid transparent',
                  transition: 'background 0.2s',
                  cursor: day.sessionCount > 0 ? 'default' : 'default',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        marginTop: '10px', justifyContent: 'flex-end',
      }}>
        <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>Less</span>
        {[0, 30, 50, 70, 90].map(score => (
          <div key={score} style={{
            width: '10px', height: '10px', borderRadius: '2px',
            background: cellColour(score),
          }} />
        ))}
        <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>More</span>
      </div>
    </div>
  )
}

function AnalyticsContent() {
  const [userName, setUserName] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
 
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name =
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.user_metadata?.name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        null
      setUserName(name)
    })
  }, [])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 260px 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: '#0e0c0c',
    }}>
 
      {/* Sidebar */}
      <Sidebar userName={userName} />
 
      {/*Left panel — stat cards + heatmap strip */}
      <div style={{
        borderRight: '1px solid var(--border-subtle)',
        overflowY: 'auto',
        padding: '28px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'radial-gradient(ellipse 280px 200px at 50% 0%, rgba(160,55,8,0.1) 0%, transparent 60%)',
      }}>
 
        {/* Panel heading */}
        <div style={{
          fontSize: '16px', fontWeight: 700, color: '#fff',
          marginBottom: '4px',
        }}>
          Your Stats
        </div>
 
        {/* 12-week heatmap strip */}
        <StreakHeatmap />
 
        {/* Stat cards */}
        <AnalyticsPanel />
      </div>
 
      {/* Right panel — calendar + day detail */}
      <div style={{
        overflowY: 'auto',
        padding: '28px 36px',
        background: `
          radial-gradient(ellipse 500px 350px at 70% 90%, rgba(160,55,8,0.07) 0%, transparent 60%),
          #0e0c0c
        `,
      }}>
 
        {/* Calendar heading */}
        <div style={{
          fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '20px',
        }}>
          Session History
        </div>
 
        <AnalyticsCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
 
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}