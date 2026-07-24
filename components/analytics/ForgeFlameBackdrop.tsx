'use client'

// Ambient flame silhouettes shown only behind a "Blazing" month.

const FLAME_PATH = 'M12 2C12 2 5 8 5 14C5 17.866 8.134 21 12 21C15.866 21 19 17.866 19 14C19 12 18 10.5 17 9.5C17 11 16 12.5 15 13C15.5 11 15 8.5 13 6.5C13.5 8 12.5 9 11 9.5C11.5 7.5 11 5 12 2Z'

interface FlameSpec {
  left: string
  bottom: string
  width: number
  opacity: number
  delay: string
  duration: string
  hue: 'core' | 'mid' | 'outer'
}

const FLAMES: FlameSpec[] = [
  { left: '2%',  bottom: '-7%', width: 130, opacity: 0.22, delay: '0s',   duration: '4.2s', hue: 'outer' },
  { left: '18%', bottom: '-9%', width: 92,  opacity: 0.28, delay: '0.6s', duration: '3.6s', hue: 'mid' },
  { left: '36%', bottom: '-6%', width: 150, opacity: 0.18, delay: '1.1s', duration: '4.8s', hue: 'outer' },
  { left: '55%', bottom: '-10%',width: 100, opacity: 0.26, delay: '0.3s', duration: '3.9s', hue: 'mid' },
  { left: '73%', bottom: '-7%', width: 142, opacity: 0.20, delay: '0.9s', duration: '4.4s', hue: 'outer' },
  { left: '90%', bottom: '-8%', width: 86,  opacity: 0.24, delay: '1.4s', duration: '3.4s', hue: 'core' },
]

const HUE_GRADIENTS: Record<FlameSpec['hue'], [string, string]> = {
  core:  ['#FFD040', '#F97316'],
  mid:   ['#FF6010', '#C03008'],
  outer: ['#C03008', '#3a0d00'],
}

export default function ForgeFlameBackdrop() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 0,
    }}>
      <style>{`
        @keyframes forgeFlameFlicker {
          0%   { transform: translateY(0) scaleY(1) skewX(0deg); }
          25%  { transform: translateY(-3px) scaleY(1.05) skewX(-1.5deg); }
          50%  { transform: translateY(0) scaleY(0.97) skewX(1.5deg); }
          75%  { transform: translateY(-2px) scaleY(1.03) skewX(-1deg); }
          100% { transform: translateY(0) scaleY(1) skewX(0deg); }
        }
      `}</style>

      {/* Shared gradient defs, referenced by id from each flame below */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {(['core', 'mid', 'outer'] as const).map(hue => (
            <linearGradient key={hue} id={`forgeFlameGrad-${hue}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={HUE_GRADIENTS[hue][1]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={HUE_GRADIENTS[hue][0]} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {FLAMES.map((f, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={f.width}
          height={f.width}
          style={{
            position: 'absolute',
            left: f.left,
            bottom: f.bottom,
            opacity: f.opacity,
            filter: 'blur(6px)',
            transformOrigin: 'bottom center',
            animation: `forgeFlameFlicker ${f.duration} ease-in-out infinite`,
            animationDelay: f.delay,
          }}
        >
          <path d={FLAME_PATH} fill={`url(#forgeFlameGrad-${f.hue})`} />
        </svg>
      ))}
    </div>
  )
}