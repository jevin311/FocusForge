'use client'

import { useState } from 'react'

export default function TestApiPage() {
  const [sessionResult, setSessionResult] = useState<string>('')
  const [heatmapResult, setHeatmapResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function testPostSession() {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'deep-focus',
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          endedAt: new Date().toISOString(),
          durationMs: 1800000,
          idleTimeMs: 120000,
          tabSwitchCount: 3,
          checkIns: [
            { triggeredAt: Date.now() - 1500000, respondedAt: Date.now() - 1499000, missed: false },
            { triggeredAt: Date.now() - 100000, respondedAt: null, missed: true },
          ],
          missedCheckInCount: 1,
          selfReportRating: 4,
          commitmentMet: true,
          localDate: new Date().toLocaleDateString('en-CA'),
        }),
      })
      const data = await res.json()
      setSessionResult(JSON.stringify(data, null, 2))
    } catch (e) {
      setSessionResult(`Error: ${e}`)
    }
    setLoading(false)
  }

  async function testGetHeatmap() {
    setLoading(true)
    try {
      const res = await fetch('/api/heatmap')
      const data = await res.json()
      // Just show the days that have actual sessions, not all 84 if not very messy
      const activeDays = data.grid?.filter((d: { sessionCount: number }) => d.sessionCount > 0)
      setHeatmapResult(JSON.stringify({ activeDays, total: data.grid?.length }, null, 2))
    } catch (e) {
      setHeatmapResult(`Error: ${e}`)
    }
    setLoading(false)
  }

  // Just random design, dont care hahaha
  const box: React.CSSProperties = {
    background: '#1a0f0a',
    border: '1px solid rgba(249,115,22,0.15)',
    borderRadius: 8,
    padding: 16,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#fff',
    whiteSpace: 'pre-wrap',
    minHeight: 80,
    marginTop: 8,
  }

  return (
    <div style={{ padding: 24, maxWidth: 700, fontFamily: 'monospace' }}>
      <h1 style={{ color: '#f97316', marginBottom: 24 }}>API Test Panel</h1>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}>POST /api/sessions</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
          Saves a fake 30-min deep-focus session with 1 missed check-in
        </p>
        <button
          onClick={testPostSession}
          disabled={loading}
          style={{
            background: '#f97316', color: '#000', border: 'none',
            padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
          }}
        >
          {loading ? 'Loading...' : 'Run POST'}
        </button>
        {sessionResult && <div style={box}>{sessionResult}</div>}
      </div>

      <div>
        <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}>GET /api/heatmap</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
          Returns the 12-week grid — shows only days with sessions for readability
        </p>
        <button
          onClick={testGetHeatmap}
          disabled={loading}
          style={{
            background: '#f97316', color: '#000', border: 'none',
            padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
          }}
        >
          {loading ? 'Loading...' : 'Run GET'}
        </button>
        {heatmapResult && <div style={box}>{heatmapResult}</div>}
      </div>
    </div>
  )
}