'use client'

interface task {
    id: string
    title: string
    completed: boolean
    mode: string
    due: Date
}

interface Props {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export default function TaskItem(props: Props) {
  const { task, onToggle, onDelete } = props
  
  // Styling for the different modes
  const modeStyle: Record<string, React.CSSProperties> = {
    'Deep Focus': {
      background: 'rgba(129,140,248,0.1)',
      color: '#a5b4fc',
      border: '1px solid rgba(129,140,248,0.2)'
    },
    'Research': {
      background: 'rgba(52,211,153,0.08)',
      color: '#6ee7b7',
      border: '1px solid rgba(52,211,153,0.2)'
    },
    'Practice': {
      background: 'rgba(251,191,36,0.08)',
      color: '#fcd34d',
      border: '1px solid rgba(251,191,36,0.2)'
    },
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

      {/* For our checkbox */}
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

      {/* Our task and mode taggings */}
      <div style={{ flex: 1, minWidth: 0 }}>

        <div style={{
          fontSize: '13px',
          color: task.completed ? 'var(--text-faint)' : 'rgba(255,255,255,0.8)',
          textDecoration: task.completed ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {task.title}
        </div>

        {/* The mode tag */}
        <div style={{ marginTop: '4px' }}>
          <span style={{
            fontSize: '9px',
            padding: '2px 8px',
            borderRadius: '20px',
            ...(modeStyle[task.mode] ?? modeStyle['Deep Focus']),
          }}>
            {task.mode}
          </span>
        </div>
      </div>

      {/* For launching our session for the task */}
      {/* onClick will eventually launch a session — wired up later */}
      <button style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%', // makes it a circle
        background: 'linear-gradient(135deg, #f97316, #c2410c)',
        border: 'none',
        color: '#fff',
        fontSize: '10px',
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: '0 0 12px rgba(249,115,22,0.3)',
      }}>
        ▶
      </button>

      {/* For deleting tasks */}
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
      >
        ×
      </button>

    </div>
  )
}