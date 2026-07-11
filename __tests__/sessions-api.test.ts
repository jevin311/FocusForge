import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// We use a mocked the Supabase server client so the test runs without a live database, so we can avoid needing actual credentials and be fast

const mockUser = { id: 'test-user-id' }

let authUser: typeof mockUser | null = mockUser

const inserted: Record<string, any[]> = {}
const upserted: Record<string, any[]> = {}
const updated: Record<string, any[]> = {}

let existingDailyRecord: {
  session_count: number
  total_duration_ms: number
  avg_focus_score: number
  best_focus_score: number
} | null = null

function makeThenable(resolved: { data: any; error: any }) {
  return {
    single: async () => resolved,
    maybeSingle: async () => resolved,
    then: (resolveFn: any, rejectFn: any) => Promise.resolve(resolved).then(resolveFn, rejectFn),
  }
}

function fromSessions() {
  return {
    insert: (row: any) => {
      inserted.sessions.push(row)
      return {
        select: () => makeThenable({ data: { id: 'session-1', ...row }, error: null }),
      }
    },
  }
}

function fromDailyRecords() {
  return {
    select: () => ({
      eq: () => ({
        eq: () => makeThenable({ data: existingDailyRecord, error: null }),
      }),
    }),
    upsert: (row: any, opts: { onConflict?: string }) => {
      upserted.daily_records.push({ ...row, __onConflict: opts?.onConflict })
      return makeThenable({ data: row, error: null })
    },
  }
}

function fromTasks() {
  return {
    update: (row: any) => ({
      eq: () => ({
        eq: () => {
          updated.tasks.push(row)
          return makeThenable({ data: row, error: null })
        },
      }),
    }),
  }
}

const mockSupabase = {
  auth: {
    getUser: async () => ({
      data: { user: authUser },
      error: authUser ? null : { message: 'not authenticated' },
    }),
  },
  from: vi.fn((table: string) => {
    if (table === 'sessions') return fromSessions()
    if (table === 'daily_records') return fromDailyRecords()
    if (table === 'tasks') return fromTasks()
    throw new Error(`Unmocked table: ${table}`)
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => mockSupabase,
}))

import { POST } from '@/app/api/sessions/route'

function makeBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    mode: 'deep-focus',
    tabMode: 'single-tab',
    taskId: null,
    taskTitle: null,
    startedAt: '2026-07-06T10:00:00.000Z',
    endedAt: '2026-07-06T10:25:00.000Z',
    durationMs: 25 * 60 * 1000,
    idleTimeMs: 60_000,
    tabSwitchCount: 2,
    checkIns: [{ triggeredAt: 1_500_000, respondedAt: 1_500_500, missed: false }],
    missedCheckInCount: 0,
    selfReportRating: 4,
    commitmentMet: true,
    localDate: '2026-07-06',
    markTaskComplete: false,
    ...overrides,
  }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/sessions', () => {
  beforeEach(() => {
    authUser = mockUser
    existingDailyRecord = null
    inserted.sessions = []
    upserted.daily_records = []
    updated.tasks = []
    vi.clearAllMocks()
  })

  it('inserts a sessions row scoped to the authenticated user, not the request body', async () => {
    const body = makeBody()
    const res = await POST(makeRequest(body))
    const json = await res.json()

    expect(res.status).toBe(200)
    const row = inserted.sessions[0]
    expect(row.user_id).toBe(mockUser.id)
    expect(row.duration_ms).toBe(body.durationMs)
    expect(row.mode).toBe(body.mode)
    expect(json.sessionId).toBe('session-1')
    expect(typeof json.focusScore).toBe('number')
  })

  it('creates a new daily_records row for the first session of the day', async () => {
    existingDailyRecord = null
    const body = makeBody({ localDate: '2026-07-06' })
    await POST(makeRequest(body))

    const row = upserted.daily_records[0]
    expect(row.user_id).toBe(mockUser.id)
    expect(row.record_date).toBe('2026-07-06')
    expect(row.session_count).toBe(1)
    expect(row.total_duration_ms).toBe(body.durationMs)
    expect(row.__onConflict).toBe('user_id,record_date')
  })

  it('accumulates daily_records aggregates when a record already exists for the day', async () => {
    existingDailyRecord = {
      session_count: 2,
      total_duration_ms: 1_000_000,
      avg_focus_score: 70,
      best_focus_score: 80,
    }
    const body = makeBody({ localDate: '2026-07-06' })
    await POST(makeRequest(body))

    const row = upserted.daily_records[0]
    expect(row.session_count).toBe(3)
    expect(row.total_duration_ms).toBe(1_000_000 + body.durationMs)
    expect(row.best_focus_score).toBeGreaterThanOrEqual(80)
  })

  it('rejects the request when there is no authenticated user', async () => {
    authUser = null
    const res = await POST(makeRequest(makeBody()))
    expect(res.status).toBe(401)
    expect(inserted.sessions.length).toBe(0)
  })

  it('rejects a malformed body with 422 before touching the database', async () => {
    const res = await POST(makeRequest({ mode: 'not-a-real-mode' }))
    expect(res.status).toBe(422)
    expect(inserted.sessions.length).toBe(0)
  })

  it('marks the linked task complete only when markTaskComplete is true, scoped to the user', async () => {
    const body = makeBody({ taskId: 'task-42', markTaskComplete: true })
    await POST(makeRequest(body))
    expect(updated.tasks.length).toBe(1)
    expect(updated.tasks[0]).toEqual({ completed: true })
  })
})
