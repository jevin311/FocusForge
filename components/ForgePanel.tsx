'use client'

// This is our left side design, remember to update the heat ratings etc i just use random values first

export default function ForgePanel() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      borderRight: '1px solid var(--border-subtle)',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 300px 260px at 50% 38%, rgba(160,55,8,0.18) 0%, transparent 65%)',
    }}>

      {/* Single wrapper — arch and flame live together */}
      {/* paddingTop defines how much cave space sits above the flame */}
      {/* Arch height is driven by the wrapper, not fixed pixel positions */}
      <div style={{
        position: 'relative',
        width: '200px',
        paddingTop: '55px',
        margin: '0 auto 14px',
      }}>

        {/* Outer arch — spans full wrapper height */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '95%',
          height: '100%',
          borderRadius: '100px 100px 0 0',
          background: '#0a0604',
          border: '1.5px solid rgba(180,80,10,0.28)',
          borderBottom: 'none',
        }} />

        {/* Inner arch — inset slightly from outer */}
        <div style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '74%',
          height: '92%',
          borderRadius: '100px 100px 0 0',
          background: '#060402',
          border: '1px solid rgba(200,90,10,0.15)',
          borderBottom: 'none',
        }} />

        {/* Flame — sits inside the arch, on top via zIndex */}
        <div style={{
          width: '100px',
          height: '148px',
          position: 'relative',
          zIndex: 2,
          margin: '0 auto',
        }}>
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: '13px',
            width: '74px',
            height: '118px',
            borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
            background: 'linear-gradient(180deg, #FF6010, #C03008)',
            transformOrigin: 'bottom center',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: '25px',
            width: '50px',
            height: '86px',
            borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
            background: 'linear-gradient(180deg, #FFB030, #EF6010)',
            transformOrigin: 'bottom center',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 25,
            left: '36px',
            width: '28px',
            height: '54px',
            borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
            background: 'linear-gradient(180deg, #FFFAAA, #FFD040)',
            transformOrigin: 'bottom center',
          }} />

          {/* The glowing thing at the bottom */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '86px',
            height: '18px',
            background: '#d45010',
            borderRadius: '50%',
            opacity: 0.7,
            filter: 'blur(8px)',
          }} />
        </div>
      </div>

      {/* Heat number  */}
      {/* NEED TO REPLACE THISSSS */}
      <div style={{
        fontSize: '42px', fontWeight: 800, color: '#fff',
        letterSpacing: '-2px', position: 'relative', zIndex: 2,
        textShadow: '0 0 30px rgba(220,100,20,0.4)', // orange glow on text
      }}>
        --°
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px', position: 'relative', zIndex: 2 }}>
        7-day forge heat
      </div>

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 14px', borderRadius: '20px',
        background: 'rgba(180,60,10,0.2)',
        border: '1px solid rgba(220,80,10,0.35)',
        color: '#fb923c', fontSize: '11px', fontWeight: 600,
        marginTop: '8px', marginBottom: '20px',
        position: 'relative', zIndex: 2,
      }}>
        ⚒ No sessions yet
      </div>

      {/* Just the divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '14px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(180,80,10,0.25), transparent)' }} />
        <div style={{ fontSize: '8px', color: 'rgba(180,80,10,0.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Stats</div>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(180,80,10,0.25), transparent)' }} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginBottom: '20px' }}>

        {[
          { val: '--', label: 'This week', orange: false },
          { val: '0 🔥', label: 'Streak', orange: true },
          { val: '--%', label: 'Avg focus', orange: false },
          { val: '0', label: 'Sessions', orange: false },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px', padding: '10px 11px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: stat.orange ? '#fb923c' : '#fff' }}>
              {stat.val}
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '3px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}