'use client'

interface Props {
  dimmed: boolean
}

export default function FlameIndicator({ dimmed }: Props) {
  return (

    <div style={{
      width: '60px',
      height: '90px',
      position: 'relative',
      opacity: dimmed ? 0.25 : 1,
      transition: 'opacity 0.6s ease',
      filter: dimmed ? 'grayscale(0.8)' : 'none',
    }}>

      {/* Outer flame */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '8px',
        width: '44px',
        height: '70px',
        borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
        background: dimmed
          ? 'linear-gradient(180deg, #555, #333)'
          : 'linear-gradient(180deg, #FF6010, #C03008)',
        transformOrigin: 'bottom center',
        transition: 'background 0.6s ease',
      }} />

      {/* Mid flame */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '15px',
        width: '30px',
        height: '52px',
        borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
        background: dimmed
          ? 'linear-gradient(180deg, #666, #444)'
          : 'linear-gradient(180deg, #FFB030, #EF6010)',
        transformOrigin: 'bottom center',
        transition: 'background 0.6s ease',
      }} />

      {/* Inner flame */}
      <div style={{
        position: 'absolute',
        bottom: 15,
        left: '22px',
        width: '16px',
        height: '32px',
        borderRadius: '50% 50% 25% 25%/65% 65% 35% 35%',
        background: dimmed
          ? 'linear-gradient(180deg, #777, #555)'
          : 'linear-gradient(180deg, #FFFAAA, #FFD040)',
        transformOrigin: 'bottom center',
        transition: 'background 0.6s ease',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50px',
        height: '10px',
        background: dimmed ? '#333' : '#d45010',
        borderRadius: '50%',
        opacity: dimmed ? 0.2 : 0.7,
        filter: 'blur(6px)',
        transition: 'all 0.6s ease',
      }} />
    </div>
  )
}