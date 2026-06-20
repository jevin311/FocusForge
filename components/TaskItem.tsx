'use client'
import { useState } from 'react'
import DatePicker from './DatePicker'

interface Task {
  id: string
  title: string
  completed: boolean
  mode: string
  due_date: string | null
}

interface Props {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onEdit: (id: string, title: string) => void
  onLaunch: (task: Task) => void
  onEditDate: (id: string, date: string | null) => void
}

function getDueDateInfo(due_date: string | null): {
  label: string
  colour: string
} {

  if (!due_date) return { label: 'No due date', colour: 'rgba(255,255,255,0.2)' }

  const due = new Date(due_date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const label = 'Due ' + due.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
  })

  let colour = 'rgba(255,255,255,0.3)'
  if (due < today) colour = '#ef4444'
  else if (due <= tomorrow) colour = '#fbbf24'

  return { label, colour }
}

export default function TaskItem({ task, onToggle, onDelete, onEdit, onLaunch, onEditDate }: Props) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editingDate, setEditingDate] = useState(false)

  const modeStyle: Record<string, React.CSSProperties> = {
    'Deep Focus': {
      background: 'rgba(129,140,248,0.1)',
      color: '#a5b4fc',
      border: '1px solid rgba(129,140,248,0.2)',
    },
    'Research': {
      background: 'rgba(52,211,153,0.08)',
      color: '#6ee7b7',
      border: '1px solid rgba(52,211,153,0.2)',
    },
    'Practice': {
      background: 'rgba(251,191,36,0.08)',
      color: '#fcd34d',
      border: '1px solid rgba(251,191,36,0.2)',
    },
  }

  const { label: dueDateLabel, colour: dueDateColour } = getDueDateInfo(task.due_date)

  function handleEditSave() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed)
    } else {
      setEditTitle(task.title) // if empty. revert
    }
    setEditing(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--bg-card)',
      border: task.completed
        ? '1px solid var(--border-subtle)'
        : '1px solid rgba(249,115,22,0.2)',
      borderRadius: '11px',
      padding: '12px 14px',
      opacity: task.completed ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>

      {/* Checkbox */}
      <div
        onClick={() => onToggle(task.id, task.completed)}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          border: task.completed
            ? '1.5px solid rgba(129,140,248,0.5)'
            : '1.5px solid rgba(255,255,255,0.2)',
          background: task.completed ? 'rgba(129,140,248,0.25)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          fontSize: '10px',
          color: '#c4b5fd',
        }}
      >
        {task.completed && '✓'}
      </div>

      {/* Title + mode row + due date row */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        justifyContent: 'center',
      }}>

        {/* Title - double click to edit */}
        {editing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleEditSave()
              if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false) }
            }}
            onBlur={handleEditSave}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(249,115,22,0.4)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '13px', fontWeight: 500,
              outline: 'none', width: '100%', fontFamily: 'inherit',
              padding: '0 0 2px 0',
            }}
          />
        ) : (
        <div 
          onDoubleClick={() => !task.completed && setEditing(true)}
          title={task.completed ? '' : 'Double-click to edit'}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: task.completed ? 'var(--text-faint)' : 'rgba(255,255,255,0.85)',
            textDecoration: task.completed ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1,
            cursor: task.completed ? 'default' : 'text',
          }}
        >
          {task.title}
        </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}>

          {/* Due date — always shown, even if "No due date" */}
          {editingDate ? (
            <div style={{ position: 'relative' }}>
              <DatePicker
                value={task.due_date ?? ''}
                onChange={(date) => {
                  onEditDate(task.id, date || null)
                  setEditingDate(false)
                }}
              />
            </div>
          ) : (
            <span
              onClick={() => !task.completed && setEditingDate(true)}
              title={task.completed ? '' : 'Click to edit date'}
              style={{
                fontSize: '9px', color: dueDateColour, lineHeight: 1.4,
                display: 'flex', alignItems: 'center', gap: '3px',
                cursor: task.completed ? 'default' : 'pointer',
              }}
            >
              {task.due_date ? (dueDateColour === '#ef4444' ? '⚠ ' : '📅 ') : '○ '}
              {dueDateLabel}
            </span>
          )}

        </div>
      </div>

      {/* Play button */}
      <button 
        onClick={() => !task.completed && onLaunch(task)}
        disabled={task.completed}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #c2410c)',
          border: 'none',
          color: '#fff',
          fontSize: '10px',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(249,115,22,0.3)',
        }}
      >▶</button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(task.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '18px',
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >×</button>

    </div>
  )
}