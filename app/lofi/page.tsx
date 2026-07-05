'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { useSoundscape, SOUNDSCAPE_OPTIONS, SoundscapeId } from '@/hooks/useSoundscape'

export default function LofiPage() {
  const [userName, setUserName] = useState<string | null>(null)
  const { currentSound, isPlaying, volume, selectSound, togglePlay, stop, changeVolume } = useSoundscape()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserName(
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.user_metadata?.name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        null
      )
    })
  }, [])

  const activeOption = SOUNDSCAPE_OPTIONS.find(o => o.id === currentSound)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: '#0e0c0c',
    }}>
      <Sidebar userName={userName} />

      <div style={{
        overflowY: 'auto',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: `
          radial-gradient(ellipse 600px 400px at 50% 0%, rgba(160,55,8,0.12) 0%, transparent 60%),
          #0e0c0c
        `,
      }}>

        <style>{`
          @keyframes lofiPulse {
            0%, 100% { transform: scale(1); opacity: 0.55; }
            50% { transform: scale(1.15); opacity: 0.9; }
          }
          @keyframes lofiSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div style={{ maxWidth: '520px', width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              🎵 Lofi &amp; Ambient
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: 0, lineHeight: 1.6 }}>
              Background sound that keeps playing while you work — switch pages,
              start a focus session, it stays on until you pause it.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              {activeOption && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)',
                  animation: isPlaying ? 'lofiPulse 2.4s ease-in-out infinite' : 'none',
                  opacity: isPlaying ? undefined : 0.25,
                }} />
              )}
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: activeOption ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
                border: activeOption ? '1px solid rgba(249,115,22,0.4)' : '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '38px', position: 'relative', zIndex: 2,
                animation: activeOption && isPlaying ? 'lofiSpin 8s linear infinite' : 'none',
              }}>
                {activeOption ? activeOption.icon : '🎧'}
              </div>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: activeOption ? '#fff' : 'var(--text-faint)' }}>
              {activeOption ? activeOption.label : 'Nothing playing'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>
              {activeOption ? (isPlaying ? 'Playing' : 'Paused') : 'Pick a sound below to get started'}
            </div>
          </div>

          {activeOption && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
              <button
                onClick={togglePlay}
                style={{
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #c2410c, #ea580c, #f97316)',
                  color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(194,65,12,0.35)',
                }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={stop}
                style={{
                  padding: '10px 20px', borderRadius: '10px',
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Stop
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '28px' }}>
            {SOUNDSCAPE_OPTIONS.map(option => {
              const isActive = currentSound === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => selectSound(option.id as SoundscapeId)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '14px 6px', borderRadius: '12px', cursor: 'pointer',
                    background: isActive ? 'rgba(249,115,22,0.15)' : 'var(--bg-card)',
                    border: isActive ? '1px solid rgba(249,115,22,0.6)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{option.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, color: isActive ? '#f97316' : 'var(--text-faint)' }}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>

          {activeOption && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '14px 18px',
            }}>
              <span style={{ fontSize: '13px' }}>🔈</span>
              <input
                type="range" min={0} max={1} step={0.01}
                value={volume}
                onChange={e => changeVolume(parseFloat(e.target.value))}
                style={{ flex: 1, height: '4px', accentColor: '#f97316', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', minWidth: '32px', textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}