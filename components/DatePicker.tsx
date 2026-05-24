'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (date: string) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  const triggerLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '📅 Due date (optional)'

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    setOpen(false)
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth)
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  return (
    <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>

      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: open ? '1px solid rgba(249,115,22,0.45)' : '1px solid var(--border-subtle)',
          borderRadius: '9px', padding: '8px 10px',
          cursor: 'pointer', userSelect: 'none', transition: 'border-color 0.15s',
        }}
      >
        <span style={{ fontSize: '12px', color: value ? '#e8eaf0' : 'var(--text-faint)' }}>
          {triggerLabel}
        </span>
        {value ? (
          <span onClick={clearDate} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}>×</span>
        ) : (
          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>▾</span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#1a1410', border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '12px', padding: '14px', width: '260px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-faint)', padding: '2px 0', textTransform: 'uppercase', letterSpacing: '.05em' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = day === todayDay && viewMonth === todayMonth && viewYear === todayYear
              const isPast = new Date(viewYear, viewMonth, day) < new Date(todayYear, todayMonth, todayDay)
              const isSelected = selectedDate !== null && day === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear()
              return (
                <div
                  key={day}
                  onClick={() => !isPast && selectDay(day)}
                  style={{
                    textAlign: 'center', padding: '5px 0', borderRadius: '6px',
                    fontSize: '12px', cursor: isPast ? 'not-allowed' : 'pointer', userSelect: 'none',
                    background: isSelected ? '#f97316' : isToday ? 'rgba(249,115,22,0.15)' : 'transparent',
                    color: isSelected ? '#fff' : isPast ? 'rgba(255,255,255,0.15)' : isToday ? '#f97316' : 'rgba(255,255,255,0.75)',
                    border: isToday && !isSelected ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent',
                    transition: 'background 0.1s',
                  }}
                >{day}</div>
              )
            })}
          </div>

          {/* Shortcuts */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            {[
              { label: 'Today', days: 0 }, { label: 'Tomorrow', days: 1 },
              { label: '+3 days', days: 3 }, { label: '+1 week', days: 7 },
            ].map(s => {
              const d = new Date()
              d.setDate(d.getDate() + s.days)
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              return (
                <button key={s.label} onClick={() => { onChange(dateStr); setOpen(false) }} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '9px', padding: '4px 2px', cursor: 'pointer', textAlign: 'center' }}>
                  {s.label}
                </button>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}