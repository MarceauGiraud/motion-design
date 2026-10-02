/**
 * Gélatine : <Magnet> (attiré puis collé sur une cible, étiré par la vitesse)
 * et <Wobble> (tremblement élastique déclenché à des frames d'impact).
 */
import type { CSSProperties, ReactNode } from 'react'
import type { SpringConfig } from 'remotion'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { joinFilters, motionBlurFilter, stretchTransform } from '../physics/deform'
import { simulateSpring } from '../physics/simulate'
import { springPreset, type SpringPresetName } from '../physics/springs'

// ---------------------------------------------------------------------------
// Magnet
// ---------------------------------------------------------------------------

export interface MagnetSnap {
  /** Frame où l'aimant "prend". */
  at: number
  /** Position visée (px, relative à la position de repos). */
  x: number
  y: number
}

export interface MagnetProps {
  children?: ReactNode
  /** Frame du snap (si `snaps` absent). Défaut 20. */
  at?: number
  /** Cible du snap (si `snaps` absent). Défaut { x: 0, y: 0 }. */
  to?: { x: number; y: number }
  /** Position de départ. Défaut { x: -360, y: 0 }. */
  from?: { x: number; y: number }
  /** Plusieurs snaps successifs (remplace at/to). */
  snaps?: MagnetSnap[]
  /** Frames de "tension" avant chaque snap : l'objet glisse doucement vers la cible. Défaut 10. */
  tension?: number
  /** Part de la distance parcourue pendant la tension (0.06 = 6 %). Défaut 0.07. */
  creep?: number
  /** Preset du snap. Défaut 'whip'. */
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** Étirement dans l'axe du mouvement. Défaut true. */
  squash?: boolean
  /** Flou de mouvement. Défaut true. */
  motionBlur?: boolean | number
  /** Inclinaison (deg par px/frame de vitesse horizontale). Défaut 0.12. */
  tilt?: number
  display?: CSSProperties['display']
  style?: CSSProperties
  className?: string
}

/** Cible brute d'un aimant : repos, tension (glissement), puis saut. */
function magnetTarget(snaps: MagnetSnap[], origin: { x: number; y: number }, tension: number, creep: number, axis: 'x' | 'y') {
  const sorted = [...snaps].sort((a, b) => a.at - b.at)
  return (f: number) => {
    let pos = origin[axis]
    for (const s of sorted) {
      if (f >= s.at) {
        pos = s[axis]
        continue
      }
      const t0 = s.at - tension
      if (f > t0 && tension > 0) {
        const u = (f - t0) / tension
        pos += (s[axis] - pos) * creep * u * u
      }
      break
    }
    return pos
  }
}

export function Magnet({
  children,
  at = 20,
  to = { x: 0, y: 0 },
  from = { x: -360, y: 0 },
  snaps,
  tension = 10,
  creep = 0.07,
  preset = 'whip',
  config,
  squash = true,
  motionBlur = true,
  tilt = 0.12,
  display = 'inline-block',
  style,
  className,
}: MagnetProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const list = snaps ?? [{ at, x: to.x, y: to.y }]
  const start = Math.min(0, ...list.map((s) => s.at - tension - 1))
  const sx = simulateSpring({ frame, fps, preset, config, startFrame: start, target: magnetTarget(list, from, tension, creep, 'x') })
  const sy = simulateSpring({ frame, fps, preset, config, startFrame: start, target: magnetTarget(list, from, tension, creep, 'y') })
  const factor = motionBlur === true ? 1 : motionBlur || 0
  // Flou plafonné bas : un objet aimanté doit rester lisible en vol.
  const mb = factor ? motionBlurFilter(Math.hypot(sx.velocity, sy.velocity) * factor, { max: 5 }) : undefined
  return (
    <div
      className={className}
      style={{
        display,
        ...style,
        transform: `translate(${sx.value}px, ${sy.value}px) ${squash ? stretchTransform(sx.velocity, sy.velocity, { intensity: 0.006, max: 0.28 }) : ''} rotate(${sx.velocity * tilt}deg)`,
        filter: joinFilters(style?.filter as string | undefined, mb),
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wobble
// ---------------------------------------------------------------------------

/**
 * Réponse impulsionnelle normalisée d'un preset : 0 à l'impact, pic à ~1,
 * puis oscillation amortie vers 0 (dérivée du ressort, normalisée).
 */
export function impulse(frame: number, fps: number, preset: SpringPresetName = 'jelly', config?: Partial<SpringConfig>): number {
  if (frame <= 0) return 0
  const v = (f: number) => springPreset({ frame: f, fps, preset, config }) - springPreset({ frame: f - 1, fps, preset, config })
  let peak = 0
  for (let f = 1; f <= 12; f++) peak = Math.max(peak, Math.abs(v(f)))
  return peak > 0 ? v(frame) / peak : 0
}

export interface WobbleProps {
  children?: ReactNode
  /** Frames d'impact (relatives à la Sequence). Défaut [10]. */
  hits?: number[]
  /** Amplitude de la déformation (0.16 = ±16 %). Défaut 0.16. */
  intensity?: number
  /** Preset de l'oscillation. Défaut 'jelly'. */
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** 'squash' = écrase/étire (volume constant), 'skew' = cisaillement, 'rotate' = balancement. */
  mode?: 'squash' | 'skew' | 'rotate'
  transformOrigin?: CSSProperties['transformOrigin']
  display?: CSSProperties['display']
  style?: CSSProperties
  className?: string
}

export function Wobble({
  children,
  hits = [10],
  intensity = 0.16,
  preset = 'jelly',
  config,
  mode = 'squash',
  transformOrigin = '50% 100%',
  display = 'inline-block',
  style,
  className,
}: WobbleProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const w = hits.reduce((acc, h) => acc + impulse(frame - h, fps, preset, config), 0) * intensity
  const transform =
    mode === 'squash'
      ? `scale(${1 + w}, ${1 / (1 + w)})`
      : mode === 'skew'
        ? `skewX(${w * 40}deg)`
        : `rotate(${w * 40}deg)`
  return (
    <div className={className} style={{ display, transformOrigin, ...style, transform: `${transform} ${style?.transform ?? ''}` }}>
      {children}
    </div>
  )
}
