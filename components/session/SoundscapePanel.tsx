'use client'

import { useState } from 'react'
import { useSoundscape, SOUNDSCAPE_OPTIONS, SoundscapeId } from '@/hooks/useSoundscape'

type SessionStatus = 'idle' | 'active' | 'paused' | 'ended'

interface Props {
  status: SessionStatus
}

export default function SoundscapePanel({ status }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { currentSound, volume, selectSound, changeVolume } = useSoundscape(status)

  return (
    <div style={{ marginTop: '8px' }}>

      {/* Toggle row */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          padding: '6px 0',
          cursor: 'pointer',
          color: currentSound ? '#f97316' : 'var(--text-faint)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {currentSound
            ? `♪ ${SOUNDSCAPE_OPTIONS.find((o) => o.id === currentSound)?.label ?? 'Sound'}`
            : '♪ Sounds'}
        </span>
        <span style={{ fontSize: '12px', opacity: 0.5 }}>
          {isOpen ? '∧' : '∨'}
        </span>
      </button>

      {/* Collapsible panel */}
      {isOpen && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '10px',
          marginTop: '4px',
        }}>

          {/* Single row of 5 sounds */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            {SOUNDSCAPE_OPTIONS.map((option) => (
              <SoundButton
                key={option.id}
                option={option}
                isActive={currentSound === option.id}
                onClick={() => selectSound(option.id as SoundscapeId)}
              />
            ))}
          </div>

          {/* Volume slider — only show if a sound is selected */}
          {currentSound && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-faint)', minWidth: '10px' }}>
                🔈
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  height: '3px',
                  accentColor: '#f97316',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-faint)', minWidth: '26px', textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SoundButtonProps {
  option: { id: string; label: string; icon: string }
  isActive: boolean
  onClick: () => void
}

function SoundButton({ option, isActive, onClick }: SoundButtonProps) {
  return (
    <button
      onClick={onClick}
      title={option.label}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        padding: '6px 4px',
        background: isActive ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
        border: isActive
          ? '1px solid rgba(249,115,22,0.6)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1 }}>{option.icon}</span>
      <span style={{
        fontSize: '9px',
        color: isActive ? '#f97316' : 'var(--text-faint)',
        fontWeight: isActive ? 600 : 400,
        letterSpacing: '.03em',
      }}>
        {option.label}
      </span>
    </button>
  )
}