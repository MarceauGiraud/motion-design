/**
 * Déformations dérivées de la vitesse : squash & stretch, motion blur.
 * Toutes les vitesses sont en px PAR FRAME (value(f) - value(f-1)).
 */

export interface SquashOptions {
  /** Étirement par px/frame. */
  intensity?: number
  /** Étirement maximal (0.35 = +35 % dans l'axe). */
  max?: number
}

/**
 * Squash & stretch à volume constant sur un axe : étire dans le sens du
 * mouvement, compresse en travers (scaleX · scaleY = 1).
 */
export function squashStretch(velocity: number, { intensity = 0.012, max = 0.35 }: SquashOptions = {}): { along: number; across: number } {
  const s = Math.min(max, Math.abs(velocity) * intensity)
  const along = 1 + s
  return { along, across: 1 / along }
}

/**
 * Transform CSS de squash & stretch 2D orienté selon (vx, vy).
 * À concaténer APRÈS la translation : `translate(...) ${stretchTransform(vx, vy)}`.
 */
export function stretchTransform(vx: number, vy: number, opts?: SquashOptions): string {
  const speed = Math.hypot(vx, vy)
  if (speed < 1e-3) return ''
  const { along, across } = squashStretch(speed, opts)
  const angle = (Math.atan2(vy, vx) * 180) / Math.PI
  return `rotate(${angle}deg) scale(${along}, ${across}) rotate(${-angle}deg)`
}

/**
 * Squash d'impact : écrase à l'arrivée quand la vitesse s'inverse. `impact`
 * est typiquement la vitesse juste avant contact ; retourne scaleX/scaleY.
 */
export function impactSquash(impact: number, { intensity = 0.02, max = 0.3 }: SquashOptions = {}): { scaleX: number; scaleY: number } {
  const s = Math.min(max, Math.abs(impact) * intensity)
  return { scaleX: 1 + s, scaleY: 1 / (1 + s) }
}

export interface MotionBlurOptions {
  /** px de flou par px/frame de vitesse. */
  factor?: number
  /** Flou maximal (px). */
  max?: number
  /** En dessous (px/frame), aucun flou (évite le flou résiduel en fin de ressort). */
  threshold?: number
}

/** Rayon de flou (px) proportionnel à la vitesse. */
export function motionBlur(velocity: number, { factor = 0.09, max = 10, threshold = 2 }: MotionBlurOptions = {}): number {
  const v = Math.abs(velocity)
  if (v <= threshold) return 0
  return Math.min(max, (v - threshold) * factor)
}

/** `blur(Npx)` ou undefined si immobile (à mettre dans style.filter). */
export function motionBlurFilter(velocity: number, opts?: MotionBlurOptions): string | undefined {
  const px = motionBlur(velocity, opts)
  return px > 0.05 ? `blur(${px.toFixed(2)}px)` : undefined
}

/** Joint des filtres CSS en ignorant les vides. */
export function joinFilters(...filters: Array<string | undefined | false | null>): string | undefined {
  const f = filters.filter(Boolean).join(' ')
  return f.length ? f : undefined
}
