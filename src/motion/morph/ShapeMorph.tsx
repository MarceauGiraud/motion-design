/**
 * <ShapeMorph> : morph de chemins SVG entre N formes (cercle -> étoile -> logo…).
 * Formes rééchantillonnées à nombre de points égal (path-engine), transitions
 * au ressort `morph` superposées : le dépassement du ressort déforme
 * légèrement la forme au-delà de sa cible, puis elle se pose.
 */
import { useId, type CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND_RAMP_STOPS } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { buildTrack, evalPresence, evalSlot, toPathD } from './path-engine'
import { resolveShape, type ShapeInput } from './shapes'
import { safeId } from './core'

export interface ShapeMorphProps {
  /** Suite de formes (noms de la bibliothèque ou `{ d }`). Défaut circle -> star -> logo. */
  shapes?: ShapeInput[]
  /**
   * Frame de départ de chaque transition. `at[i]` = transition vers `shapes[i+1]`.
   * Défaut : une toutes les 40 frames à partir de 20.
   */
  at?: number[]
  /** Côté du carré de rendu (px). Défaut 520. */
  size?: number
  /** Couleur unie, ou liste de stops pour un dégradé linéaire. Défaut : rampe de marque. */
  fill?: string | readonly string[]
  /** Angle du dégradé (deg). Défaut 35 (rose en haut à gauche -> encre en bas à droite). */
  gradientAngle?: number
  /** Le dégradé tourbillonne de `gradientSpin` degrés pendant chaque transition, puis revient. Défaut 50. */
  gradientSpin?: number
  /** Contour optionnel. */
  stroke?: string
  strokeWidth?: number
  /** Rotation (deg) ajoutée à chaque transition, portée par le ressort. Défaut 0. */
  spin?: number
  /** Gonflement liquide à mi-morph (0 = aucun). Défaut 0.06. */
  swell?: number
  /** Lueur colorée sous la forme. Défaut true. */
  glow?: boolean
  /** Preset des transitions. Défaut 'morph'. */
  preset?: SpringPresetName
  /** Points par contour. Défaut 200. */
  samples?: number
  style?: CSSProperties
}

/** Évalue les progressions des transitions (index 0 = 0). */
function useTransitionProgress(count: number, at: number[] | undefined, preset: SpringPresetName, offset = 0) {
  const frame = useCurrentFrame() - offset
  const { fps } = useVideoConfig()
  const times = Array.from({ length: count }, (_, i) => (i === 0 ? 0 : at?.[i - 1] ?? 20 + (i - 1) * 40))
  return times.map((t, i) => (i === 0 ? 0 : springPreset({ frame, fps, preset, delay: t })))
}

export function ShapeMorph({
  shapes = ['circle', 'star', 'logo'],
  at,
  size = 520,
  fill = BRAND_RAMP_STOPS,
  gradientAngle = 35,
  gradientSpin = 50,
  stroke,
  strokeWidth = 1,
  spin = 0,
  swell = 0.06,
  glow = true,
  preset = 'morph',
  samples = 200,
  style,
}: ShapeMorphProps) {
  const id = safeId(useId())
  const ds = shapes.map(resolveShape)
  const track = buildTrack(
    ds.map((d) => [d]),
    { samples }
  )
  const w = useTransitionProgress(shapes.length, at, preset)
  const wPrev = useTransitionProgress(shapes.length, at, preset, 1)

  const d = track.slots
    .filter((s) => evalPresence(s, w) > 0.001 || s.frames.length === 1)
    .map((s) => toPathD(evalSlot(s, w), s.closed))
    .join(' ')

  const speed = w.reduce((a, v, i) => a + Math.abs(v - wPrev[i]), 0)
  const mid = w.reduce((a, v) => a + Math.sin(Math.PI * Math.min(1, Math.max(0, v))), 0)
  const scale = 1 + swell * mid
  const rot = spin * w.reduce((a, v) => a + v, 0)
  const angle = gradientAngle + gradientSpin * mid
  const rad = (angle * Math.PI) / 180
  const gx = Math.cos(rad) * 50
  const gy = Math.sin(rad) * 50
  const stops = typeof fill === 'string' ? null : fill
  const paint = stops ? `url(#${id}-g)` : (fill as string)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ overflow: 'visible', transform: `rotate(${rot}deg) scale(${scale})`, filter: speed > 0.02 ? `blur(${Math.min(3, speed * 18).toFixed(2)}px)` : undefined, ...style }}
    >
      <defs>
        {stops && (
          <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={50 - gx} y1={50 - gy} x2={50 + gx} y2={50 + gy}>
            {stops.map((c, i) => (
              <stop key={i} offset={stops.length === 1 ? 0 : i / (stops.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
        )}
        {glow && (
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        )}
      </defs>
      {glow && <path d={d} fill={paint} fillRule="evenodd" opacity={0.45} filter={`url(#${id}-glow)`} transform="translate(0 4)" />}
      <path d={d} fill={paint} fillRule="evenodd" stroke={stroke} strokeWidth={stroke ? strokeWidth : undefined} strokeLinejoin="round" />
    </svg>
  )
}
