import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  calculateFocusScore,
  type StudyMode,
  type CheckInRecord,
} from '@/lib/scoring/calculateFocusScore'

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { supabase, user }
}

// Used by AnalyticsPanel and AnalyticsCalendar.
export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { supabase, user } = auth
 
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, mode, task_id, task_title, started_at, ended_at, duration_ms, focus_score, commitment_met, self_report_rating, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
 
  if (error) {
    console.error('Sessions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
 
  return NextResponse.json(data ?? [])
}

interface PostSessionBody {
  mode: StudyMode
  taskId: string | null
  taskTitle: string | null
  startedAt: string
  endedAt: string
  durationMs: number
  idleTimeMs: number
  tabSwitchCount: number
  checkIns: CheckInRecord[]
  missedCheckInCount: number
  selfReportRating: number
  commitmentMet: boolean
  localDate: string
}

function isValidMode(mode: unknown): mode is StudyMode {
  return mode === 'deep-focus' || mode === 'research' || mode === 'practice'
}

function isValidCheckIns(checkIns: unknown): checkIns is CheckInRecord[] {
  if (!Array.isArray(checkIns)) return false
  return checkIns.every(
    (c) =>
      typeof c.triggeredAt === 'number' &&
      (c.respondedAt === null || typeof c.respondedAt === 'number') &&
      typeof c.missed === 'boolean'
  )
}

function validateBody(body: unknown): body is PostSessionBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>

  return (
    isValidMode(b.mode) &&
    typeof b.startedAt === 'string' &&
    typeof b.endedAt === 'string' &&
    typeof b.durationMs === 'number' && b.durationMs > 0 &&
    typeof b.idleTimeMs === 'number' && b.idleTimeMs >= 0 &&
    typeof b.tabSwitchCount === 'number' && b.tabSwitchCount >= 0 &&
    isValidCheckIns(b.checkIns) &&
    typeof b.missedCheckInCount === 'number' && b.missedCheckInCount >= 0 &&
    typeof b.selfReportRating === 'number' &&
    b.selfReportRating >= 1 && b.selfReportRating <= 5 &&
    typeof b.commitmentMet === 'boolean' &&
    typeof b.localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.localDate) // This is just the date format, making sure they are all like 2026-06-26
  )
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { supabase, user } = auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!validateBody(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 422 })
  }

  const scoreBreakdown = calculateFocusScore({
    durationMs: body.durationMs,
    idleTimeMs: body.idleTimeMs,
    tabSwitchCount: body.tabSwitchCount,
    checkIns: body.checkIns,
    missedCheckInCount: body.missedCheckInCount,
    selfReportRating: body.selfReportRating,
    commitmentMet: body.commitmentMet,
    mode: body.mode,
  })

  // Insert the session row
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      mode: body.mode,
      task_id: body.taskId ?? null,
      task_title: body.taskTitle ?? null,
      started_at: body.startedAt,
      ended_at: body.endedAt,
      duration_ms: body.durationMs,
      idle_time_ms: body.idleTimeMs,
      tab_switch_count: body.tabSwitchCount,
      check_ins: body.checkIns,
      missed_check_in_count: body.missedCheckInCount,
      self_report_rating: body.selfReportRating,
      commitment_met: body.commitmentMet,
      focus_score: scoreBreakdown.finalScore,
      score_breakdown: scoreBreakdown,
    })
    .select('id, focus_score')
    .single()

  if (sessionError || !session?.id) {
    console.error('Session insert error:', sessionError)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }

  // Upsert daily_records for this calendar day.
  // We fetch the current row first so we can recompute accurate aggregates
  // (avg_focus_score in particular requires knowing all prior scores for the day).
  const { data: existingRecord } = await supabase
    .from('daily_records')
    .select('session_count, total_duration_ms, avg_focus_score, best_focus_score')
    .eq('user_id', user.id)
    .eq('record_date', body.localDate)
    .maybeSingle()

  const prevCount = existingRecord?.session_count ?? 0
  const prevTotalMs = existingRecord?.total_duration_ms ?? 0
  const prevAvg = Number(existingRecord?.avg_focus_score ?? 0) // In case it is stored as string
  const prevBest = existingRecord?.best_focus_score ?? 0

  const newCount = prevCount + 1
  const newTotalMs = prevTotalMs + body.durationMs
  const newAvgScore = (prevAvg * prevCount + scoreBreakdown.finalScore) / newCount
  const newBestScore = Math.max(prevBest, scoreBreakdown.finalScore)
  const newTotalFocusMinutes = Math.floor(newTotalMs / 60000)

  const { error: dailyError } = await supabase
    .from('daily_records')
    .upsert(
      {
        user_id: user.id,
        record_date: body.localDate,
        session_count: newCount,
        total_duration_ms: newTotalMs,
        total_focus_minutes: newTotalFocusMinutes,
        avg_focus_score: newAvgScore,
        best_focus_score: newBestScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,record_date' } // So that there will only be one row per user+date, by updating instead of inserting
    )

  if (dailyError) {
    // This error is not fatal since the session is logged/saved already
    console.error('daily_records upsert error:', dailyError)
  }

  return NextResponse.json({
    sessionId: session.id,
    focusScore: scoreBreakdown.finalScore,
    scoreBreakdown,
  })
}