'use client'
import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel'
import AnalyticsCalendar from '@/components/analytics/AnalyticsCalendar'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function AnalyticsContent() {
  const supabase = createClient()
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      setUserName(user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? null)
      setUserAvatar(user.user_metadata?.avatar_url ?? null)
    }
    init()
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 2fr', height: '100vh', overflow: 'hidden' }}>
      <Sidebar userName={userName} userAvatar={userAvatar} />

      {/* Left — stats panel */}
      <div style={{
        borderRight: '1px solid var(--border-subtle)',
        overflowY: 'auto', padding: '28px 20px',
        background: 'radial-gradient(ellipse 300px 260px at 50% 80%, rgba(160,55,8,0.08) 0%, transparent 60%), #0e0c0c',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '20px' }}>
          📊 Your Stats
        </div>
        <AnalyticsPanel />
      </div>

      {/* Right — calendar + day detail */}
      <div style={{ overflowY: 'auto', padding: '28px', background: '#0e0c0c' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '20px' }}>
          🔥 Forge History
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