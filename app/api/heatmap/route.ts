import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { supabase, user }
}

export interface HeatmapDay {
  date: string
  avgFocusScore: number
  bestFocusScore: number
  totalFocusMinutes: number
  sessionCount: number
}

const HEATMAP_DAYS = 84 // i just put for 12 weeks first arh

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { supabase, user } = auth
  const { searchParams } = new URL(req.url)
  const endDateParam = searchParams.get('date')

  const endDate = endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam)
    ? endDateParam
    : new Date().toISOString().split('T')[0]

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - HEATMAP_DAYS + 1)
  const startDateStr = startDate.toISOString().split('T')[0] // Just getting the date part of the javascript date

  const { data, error } = await supabase
    .from('daily_records')
    .select('record_date, avg_focus_score, best_focus_score, total_focus_minutes, session_count')
    .eq('user_id', user.id)
    .gte('record_date', startDateStr)
    .lte('record_date', endDate)
    .order('record_date', { ascending: true })

  if (error) {
    console.error('Heatmap fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 })
  }

  // Full 84-day grid, will just put 0 for days without data so no need null check etc
  const recordsByDate = new Map(
    (data ?? []).map((row) => [row.record_date, row]) // So that we can get the whole row by finding the date easily
  )

  const grid: HeatmapDay[] = []
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = d.toISOString().split('T')[0] // to get our string version of date
    const row = recordsByDate.get(dateStr)

    grid.push({
      date: dateStr,
      avgFocusScore: row ? Number(row.avg_focus_score) : 0,
      bestFocusScore: row?.best_focus_score ?? 0,
      totalFocusMinutes: row?.total_focus_minutes ?? 0,
      sessionCount: row?.session_count ?? 0,
    })
  }

  return NextResponse.json({ grid, startDate: startDateStr, endDate })
}