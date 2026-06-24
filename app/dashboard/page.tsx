'use client'

import { Suspense } from 'react'
import ForgePanel from '@/components/ForgePanel'
import TaskList from '@/components/TaskList'
import Sidebar from '@/components/Sidebar'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import FloatingTimer from '@/components/session/FloatingTimer'
import { useSessionStore } from '@/lib/session-store'
import { SessionResult } from '@/hooks/useSession'
import PostSessionCard from '@/components/session/PostSessionCard'

function DashboardContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const toastShown = useRef(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  const { isActive, config } = useSessionStore()
  const [timerVisible, setTimerVisible] = useState(false)
  const [showPostSession, setShowPostSession] = useState(false)
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const endSession = useSessionStore((s) => s.endSession)

  // Only show timer if store says active AND we have a config
  // This prevents the timer from showing on refresh with stale state
  useEffect(() => {
    if (isActive && config) {
      setTimerVisible(true)
    }
  }, [isActive, config])

  useEffect(() => {
    async function init() {
      // Always get user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Needed for TaskList
      setUserId(user.id)
      //for profile drop down menu
      setUserName(
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.user_metadata?.name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        null
      )


      // Welcome toast
      const loginType = searchParams.get('login')

      if (!loginType || toastShown.current) return

      toastShown.current = true

      const name =
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.user_metadata?.name?.split(' ')[0]

      toast.success(name ? `Time to forge, ${name}!` : `Time to forge!`)

      // Remove query param so refresh doesn't retrigger toast
      router.replace('/dashboard')
    }

    init()
  }, [])

  //post session summary card

  function handleEndSession(result: SessionResult) {
    setTimerVisible(false) // 1. Hide the timer
    setSessionResult(result) // 3. Show post session card
    setShowPostSession(true)
  }

  function handleResume() {
    setShowPostSession(false)
    setSessionResult(null)
    setTimerVisible(true)
  }

  function handleDone() {
    endSession()
    setShowPostSession(false)
    setSessionResult(null)
  }


  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr 3fr',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      
      {/* extracted sidebar as component */}
      <Sidebar userName={userName}/>
      
      {/* Forge panel */}
      <ForgePanel />

      {/* Task panel */}
      <div
        style={{
          padding: '28px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: `
            radial-gradient(ellipse 500px 350px at 70% 80%, rgba(160,55,8,0.08) 0%, transparent 60%),
            #0e0c0c
          `,
        }}
      >
        <TaskList userId={userId} />
      </div>

      {/* Timer — only when timerVisible, never on page load */}
      {timerVisible && (
        <FloatingTimer onEndSession={handleEndSession} />
      )}

      {showPostSession && sessionResult && (
      <PostSessionCard result={sessionResult} onDone={handleDone} onResume={handleResume} />
    )}


    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}