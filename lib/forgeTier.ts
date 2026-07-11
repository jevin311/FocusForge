// Shared "visual progress" tiers — same thresholds drive the flame colours on

export interface ForgeTier {
  label: string
  flameTop: string
  flameMid: string
  flameOuter: string
  glow: string
  hasAura: boolean
}

const AURA_STREAK_THRESHOLD = 7

export function getForgeTier(heatOrScore: number, streak: number): ForgeTier {
  const hasAura = streak >= AURA_STREAK_THRESHOLD

  if (heatOrScore > 70) {
    return {
      label: hasAura ? 'Blazing · Unstoppable' : 'Blazing',
      flameTop: '#FFFAAA', flameMid: '#FFD040', flameOuter: '#FF6010',
      glow: '#fb923c', hasAura,
    }
  }
  if (heatOrScore > 40) {
    return {
      label: hasAura ? 'Kindled · On a roll' : 'Kindled',
      flameTop: '#FF6010', flameMid: '#EF6010', flameOuter: '#C03008',
      glow: '#f97316', hasAura,
    }
  }
  return {
    label: hasAura ? 'Smoldering · Building momentum' : 'Smoldering',
    flameTop: '#884400', flameMid: '#552200', flameOuter: '#331100',
    glow: 'rgba(255,255,255,0.4)', hasAura,
  }
}