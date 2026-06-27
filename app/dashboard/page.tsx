'use client'

import { Suspense } from 'react'
import ForgePanel from '@/components/ForgePanel'
import TaskList from '@/components/TaskList'
import Sidebar from '@/components/Sidebar'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSessionStore } from '@/lib/session-store'
import PostSessionCard from '@/components/session/PostSessionCard'

function DashboardContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const toastShown = useRef(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  const { pendingResult, setPendingResult, endSession } = useSessionStore()

  useEffect(() => {
    async function init() {
      // Always get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Needed for TaskList
      setUserId(user.id)
      // For profile drop down menu
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

  // Post session summary card handlers

  function handleResume() {
    // Restore session as active in sessionStorage so FloatingTimer resumes
    // from where it left off — elapsed time is preserved
    sessionStorage.setItem('ff_status', JSON.stringify('active'))
    setPendingResult(null)
  }

  function handleDone() {
    // Clear session storage only when user confirms done — not on end() itself
    // so that "Return to timer" can still restore elapsed time
    sessionStorage.removeItem('ff_status')
    sessionStorage.removeItem('ff_elapsed')
    sessionStorage.removeItem('ff_checkIns')
    endSession()
    setPendingResult(null)
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
      {/* Extracted sidebar as component */}
      <Sidebar userName={userName} />

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

      {/* Post session card — shown when user ends session from any page */}
      {pendingResult && (
        <PostSessionCard
          result={pendingResult}
          onDone={handleDone}
          onResume={handleResume}
        />
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