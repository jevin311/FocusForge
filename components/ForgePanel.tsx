'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSessionStore } from '@/lib/session-store'
import { getForgeTier } from '@/lib/forgeTier'
// This is our left side design

interface HeatmapDay {
  date: string
  avgFocusScore: number
  sessionCount: number      
  totalFocusMinutes: number
}

interface ForgePanelStats {
  streak: number
  weeklyFocusMinutes: number
  avgFocusScore: number
  sessionCount: number
  forgeHeat: number
}


export default function ForgePanel() {
  const [stats, setStats] = useState<ForgePanelStats>({
    streak: 0,
    weeklyFocusMinutes: 0,
    avgFocusScore: 0,
    sessionCount: 0,
    forgeHeat: 0,
  })
  const [loading, setLoading] = useState(true)

  const pendingResult = useSessionStore((s) => s.pendingResult)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const res = await fetch(`/api/heatmap?date=${todayStr}`)
      if (!res.ok) throw new Error('Heatmap fetch failed')
      const data = await res.json()

      const records: HeatmapDay[] = (data?.grid ?? []).filter(
        (d: HeatmapDay) => d.sessionCount > 0
      )

      if (records.length === 0) {
        setStats({ streak: 0, weeklyFocusMinutes: 0, avgFocusScore: 0, sessionCount: 0, forgeHeat: 0 })
        return
      }

      const recordsMap = new Map(records.map(r => [r.date, r]))
      

      let streak = 0
      const cursor = new Date(todayStr + 'T00:00:00')
      while (true) {
        const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
        const record = recordsMap.get(dateStr)
        if (record && record.sessionCount > 0) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        } else if (dateStr === todayStr) {
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }

      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`

      const weekRecords = records.filter(r => r.date >= sevenDaysAgoStr)

      let weeklyFocusMinutes = 0
      let sessionCount = 0
      let totalWeightedScore = 0

      weekRecords.forEach(r => {
        weeklyFocusMinutes += r.totalFocusMinutes
        sessionCount += r.sessionCount
        totalWeightedScore += r.avgFocusScore * r.sessionCount
      })

      const avgFocusScore = sessionCount > 0 ? Math.round(totalWeightedScore / sessionCount) : 0
      const timeFactor = Math.min(1, weeklyFocusMinutes / 600)
      const forgeHeat = Math.round((avgFocusScore * 0.5) + (timeFactor * 50))

      setStats({ streak, weeklyFocusMinutes, avgFocusScore, sessionCount, forgeHeat })
    } catch (err) {
      console.error('ForgePanel fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!pendingResult) fetchStats()
  }, [pendingResult, fetchStats])

  const { streak, weeklyFocusMinutes, avgFocusScore, sessionCount, forgeHeat } = stats
  const tier = getForgeTier(forgeHeat, streak)

  const hours = Math.floor(weeklyFocusMinutes / 60)
  const minutes = weeklyFocusMinutes % 60
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
      borderRight: '1px solid var(--border-subtle)',
      position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 300px 260px at 50% 38%, rgba(160,55,8,0.18) 0%, transparent 65%)',
    }}>

      <style>{`
        @keyframes forgeAuraPulse {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>

      <div style={{ position: 'relative', width: '200px', paddingTop: '55px', margin: '0 auto 14px' }}>

        {/* Aura ring — only appears once the streak crosses the threshold,
            regardless of current heat, so a long streak still reads as an
            achievement even on a lower-heat day */}
        {tier.hasAura && !loading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '220px', height: '220px', borderRadius: '50%',
            background: `radial-gradient(circle, ${tier.glow}33 0%, transparent 70%)`,
            animation: 'forgeAuraPulse 2.8s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
        )}

        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '95%', height: '100%', borderRadius: '100px 100px 0 0',
          background: '#0a0604', border: '1.5px solid rgba(180,80,10,0.28)', borderBottom: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          width: '74%', height: '92%', borderRadius: '100px 100px 0 0',
          background: '#060402', border: '1px solid rgba(200,90,10,0.15)', borderBottom: 'none',
        }} />
        <div style={{ width: '100px', height: '148px', position: 'relative', zIndex: 2, margin: '0 auto' }}>
          <div style={{
            position: 'absolute', bottom: 20, left: '13px', width: '74px', height: '118px',
            borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
            background: `linear-gradient(180deg, ${tier.flameOuter}, #220800)`,
            transformOrigin: 'bottom center', transition: 'background 1s ease',
          }} />
          <div style={{
            position: 'absolute', bottom: 20, left: '25px', width: '50px', height: '86px',
            borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
            background: `linear-gradient(180deg, ${tier.flameMid}, ${tier.flameOuter})`,
            transformOrigin: 'bottom center', transition: 'background 1s ease',
          }} />
          <div style={{
            position: 'absolute', bottom: 25, left: '36px', width: '28px', height: '54px',
            borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
            background: `linear-gradient(180deg, ${tier.flameTop}, ${tier.flameMid})`,
            transformOrigin: 'bottom center', transition: 'background 1s ease',
          }} />
          <div style={{
            position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
            width: '86px', height: '18px', background: '#d45010', borderRadius: '50%',
            opacity: forgeHeat > 0 ? 0.7 : 0.15, filter: 'blur(8px)',
            transition: 'opacity 1s ease',
          }} />
        </div>
      </div>

      <div style={{
        fontSize: '42px', fontWeight: 800,
        color: forgeHeat > 0 ? '#fff' : 'var(--text-faint)',
        letterSpacing: '-2px', position: 'relative', zIndex: 2,
        textShadow: forgeHeat > 0 ? '0 0 30px rgba(220,100,20,0.4)' : 'none',
        transition: 'all 0.5s',
      }}>
        {loading ? '--°' : `${forgeHeat}°`}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px', position: 'relative', zIndex: 2 }}>
        7-day forge heat
      </div>
      {!loading && forgeHeat > 0 && (
        <div style={{
          fontSize: '10px', fontWeight: 600, color: tier.glow,
          marginTop: '4px', position: 'relative', zIndex: 2,
        }}>
          {tier.hasAura ? '✨ ' : ''}{tier.label}
        </div>
      )}

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 14px', borderRadius: '20px',
        background: 'rgba(180,60,10,0.2)', border: '1px solid rgba(220,80,10,0.35)',
        color: '#fb923c', fontSize: '11px', fontWeight: 600,
        marginTop: '8px', marginBottom: '20px', position: 'relative', zIndex: 2,
      }}>
        {loading ? '⚒ Loading...' : streak > 0 ? `🔥 ${streak} day streak` : '⚒ No streak yet'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '14px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(180,80,10,0.25), transparent)' }} />
        <div style={{ fontSize: '8px', color: 'rgba(180,80,10,0.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Stats</div>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(180,80,10,0.25), transparent)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
        {[
          { val: loading ? '--' : formattedTime, label: 'This week', orange: false },
          { val: loading ? '--' : `${streak} 🔥`, label: 'Streak', orange: true },
          { val: loading ? '--' : `${avgFocusScore}%`, label: 'Avg focus', orange: false },
          { val: loading ? '--' : String(sessionCount), label: 'Weekly sessions', orange: false },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '10px', padding: '10px 11px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: stat.orange ? '#fb923c' : '#fff' }}>
              {stat.val}
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '3px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}