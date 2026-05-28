'use client'
import { useState, useEffect } from 'react'
import TaskItem from './TaskItem'
import DatePicker from './DatePicker'
import ModeSelect from './ModeSelect'

interface Task {
  id: string
  title: string
  completed: boolean
  mode: string
  due_date: string | null
}

interface Props {
  userId: string | null
}

export default function TaskList({ userId }: Props) {

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [mode, setMode] = useState('Deep Focus')
  const [adding, setAdding] = useState(false)
  const [dueDate, setDueDate] = useState('')


  useEffect(() => {
    if (!userId) return  // wait until userId is available
    fetchTasks(userId)
  }, [userId]) // re-runs when userId changes from null to the real id

  async function fetchTasks(uid: string) {
    setLoading(true)
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim() || adding || !userId) return // So that we don't add empty or twice accidentally
    setAdding(true)

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        mode: mode,
        due_date: dueDate || null,
      }),
    })

    const newTask = await res.json()
    // If the response has no id, the API failed — don't add broken object to array
    if (!newTask.id) {
      console.error('Failed to add task:', newTask)
      setAdding(false)
      return
    }
    setTasks(prev => [newTask, ...prev]) // So that the newest one is at the top of the list

    // Just resetting everything
    setNewTitle('')
    setDueDate('')
    setAdding(false)
  }

  async function toggleTask(id: string, currentCompleted: boolean) {
    // We update the frontend first, then update backend so that everything feels faster
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: !currentCompleted } : t
      )
    )
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !currentCompleted }),
    })
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
  }

  const pending = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      <div style={{
        fontSize: '11px', fontWeight: 600,
        color: 'var(--text-faint)',
        textTransform: 'uppercase', letterSpacing: '.08em',
      }}>
        ⚔ Today&apos;s Tasks
      </div>

      {/* Row 1: title + add button */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="What will you forge today?"
          style={{
            flex: 1, background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px', padding: '9px 13px',
            color: '#e8eaf0', fontSize: '13px',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={addTask}
          disabled={adding || !newTitle.trim()}
          style={{
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.35)',
            borderRadius: '9px', padding: '9px 16px',
            color: 'var(--accent-orange)', fontSize: '16px',
            fontWeight: 700, cursor: 'pointer',
          }}
        >+</button>
      </div>

      {/* Row 2: mode dropdown + due date picker */}
      <div style={{ display: 'flex', gap: '8px' }}>

        {/* Mode dropdown */}
        <ModeSelect value={mode} onChange={setMode} />

        {/* Custom date picker */}
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
        />

      </div>

      {loading && (
        <p style={{ color: 'var(--text-faint)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          Loading tasks...
        </p>
      )}

      {!loading && tasks.length === 0 && (
        <p style={{ color: 'var(--text-faint)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          No tasks yet — add one above to get started.
        </p>
      )}

      {pending.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            In progress
          </div>
          {pending.map(task => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
        </>
      )}

      {completed.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '4px' }}>
            Completed
          </div>
          {completed.map(task => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
        </>
      )}

    </div>
  )
}