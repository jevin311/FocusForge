'use client'
import { useState, useRef, useEffect } from 'react'
import { ReactNode } from 'react'

const MODES = [
  {
    value: 'Deep Focus',
    colour: '#a5b4fc',
    bg: 'rgba(129,140,248,0.1)',
    border: 'rgba(129,140,248,0.2)',
  },
  {
    value: 'Research',
    colour: '#6ee7b7',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    value: 'Practice',
    colour: '#fcd34d',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)',
  },
]

interface Props {
  value: string
  onChange: (value: string) => void
  children?: ReactNode
}

export default function ModeSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selected = MODES.find(m => m.value === value) ?? MODES[0]

  // Close dropdown when user click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>

      {/* Trigger button */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: open
            ? '1px solid rgba(249,115,22,0.45)'
            : '1px solid var(--border-subtle)',
          borderRadius: '9px',
          padding: '8px 10px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{
          fontSize: '12px',
          padding: '1px 8px',
          borderRadius: '20px',
          background: selected.bg,
          color: selected.colour,
          border: `1px solid ${selected.border}`,
        }}>
          {selected.value}
        </span>

        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>▾</span>
      </div>

      {/* The dropdown list */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 50,
          background: '#1a1410',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '10px',
          padding: '6px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {MODES.map(mode => (
            <div
              key={mode.value}
              onClick={() => { onChange(mode.value); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '7px',
                cursor: 'pointer',
                background: value === mode.value
                  ? 'rgba(255,255,255,0.06)'
                  : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background =
                  value === mode.value ? 'rgba(255,255,255,0.06)' : 'transparent'
              }}
            >
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: mode.bg,
                color: mode.colour,
                border: `1px solid ${mode.border}`,
              }}>
                {mode.value}
              </span>

              {/* Checkmark on selected */}
              {value === mode.value && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '10px',
                  color: 'var(--text-faint)',
                }}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}