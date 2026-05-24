import ForgePanel from '@/components/ForgePanel'
import TaskList from '@/components/TaskList'

export default function DashboardPage() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 2fr 3fr',
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* Sidebar */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '24px',
        gap: '6px',
      }}>
        {[
          { icon: '⚒', label: 'Forge', active: true },
          { icon: '📅', label: 'Calendar', active: false },
          { icon: '📊', label: 'Stats', active: false },
        ].map(btn => (
          <div
            key={btn.label}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              background: btn.active ? 'rgba(249,115,22,0.12)' : 'transparent',
              border: btn.active
                ? '1px solid rgba(249,115,22,0.25)'
                : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{btn.icon}</span>
            <span style={{
              fontSize: '9px',
              color: btn.active ? '#f97316' : 'rgba(255,255,255,0.3)',
              letterSpacing: '.04em',
            }}>
              {btn.label}
            </span>
          </div>
        ))}

        {/* The profile at bottom */}
        <div style={{ marginTop: 'auto', paddingBottom: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: '22px', lineHeight: 1 }}>👤</span>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '.04em' }}>
              Profile
            </span>
          </div>
        </div>
      </div>

      {/* Forge panel */}
      <ForgePanel />

      {/* Task panel */}
      <div style={{
        padding: '28px', overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: `
          radial-gradient(ellipse 500px 350px at 70% 80%, rgba(160,55,8,0.08) 0%, transparent 60%),
          #0e0c0c
        `,
      }}>
        <TaskList />
      </div>

    </div>
  )
}