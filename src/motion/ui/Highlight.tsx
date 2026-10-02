/**
 * Mise en valeur de zones : <Spotlight> (voile + trou plume qui se déplace),
 * <FocusRing> (anneau dégradé de marque), <Callout> (annotation + trait).
 */
import { useId, type CSSProperties, type ReactNode } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP_STOPS } from '../tokens'
import type { Point, Rect } from '../camera/geometry'
import { AnnotationCard, LeaderAnnotation } from './AnnotationTree'

// ---------------------------------------------------------------------------
// Rectangle qui morphe entre étapes
// ---------------------------------------------------------------------------

export interface RectStep {
  /** Frame où le morph vers ce rectangle démarre. */
  at: number
  rect: Rect
  /** Rayon des coins (px). Hérite de l'étape précédente. */
  radius?: number
}

/** Rectangle + rayon courant, ressort `preset` entre chaque étape (overshoot conservé). */
export function useMorphRect(steps: RectStep[], preset: SpringPresetName = 'morph', defaultRadius = 14): Rect & { radius: number } {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = [...steps].sort((a, b) => a.at - b.at)
  if (s.length === 0) return { x: 0, y: 0, w: 0, h: 0, radius: defaultRadius }
  let radius = s[0].radius ?? defaultRadius
  const out = { ...s[0].rect, radius }
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1].rect
    const b = s[i].rect
    const ra = radius
    const rb = s[i].radius ?? ra
    const p = springPreset({ frame, fps, preset, delay: s[i].at })
    out.x += (b.x - a.x) * p
    out.y += (b.y - a.y) * p
    out.w += (b.w - a.w) * p
    out.h += (b.h - a.h) * p
    out.radius += (rb - ra) * p
    radius = rb
  }
  return out
}

// ---------------------------------------------------------------------------
// Spotlight
// ---------------------------------------------------------------------------

export interface SpotlightProps {
  /** Rectangles successifs (repère du conteneur). Le premier `at` = apparition du voile. */
  steps: RectStep[]
  /** Frame de disparition du voile. */
  until?: number
  /** Opacité du voile. Défaut 0.62. */
  dim?: number
  /** Couleur du voile. Défaut BRAND.night. */
  color?: string
  /** Adoucissement du bord (px). Défaut 18. */
  feather?: number
  /** Marge ajoutée autour de chaque rectangle (px). Défaut 10. */
  padding?: number
  /** Preset du morph. Défaut 'morph'. */
  preset?: SpringPresetName
  /** Liseré lumineux autour du trou. Défaut true. */
  outline?: boolean
  /** Taille du calque. Défaut : composition. */
  width?: number
  height?: number
  style?: CSSProperties
}

/** Voile sombre plein cadre, sauf un trou arrondi et plumé qui glisse d'une zone à l'autre. */
export function Spotlight({
  steps,
  until,
  dim = 0.62,
  color = BRAND.night,
  feather = 18,
  padding = 10,
  preset = 'morph',
  outline = true,
  width: w,
  height: h,
  style,
}: SpotlightProps) {
  const frame = useCurrentFrame()
  const { fps, width: cw, height: ch } = useVideoConfig()
  const id = useId().replace(/:/g, '')
  const width = w ?? cw
  const height = h ?? ch
  const r = useMorphRect(steps, preset)
  if (steps.length === 0) return null
  const start = Math.min(...steps.map((s) => s.at))
  const inP = springPreset({ frame, fps, preset: 'smooth', delay: start, durationInFrames: 20 })
  const outP = until === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: until, durationInFrames: 20 })
  const k = Math.max(0, inP - outP)
  if (k <= 0.001) return null
  // Le trou part un peu plus grand et se resserre à l'apparition.
  const grow = (1 - inP) * 60
  const x = r.x - padding - grow
  const y = r.y - padding - grow
  const rw = r.w + (padding + grow) * 2
  const rh = r.h + (padding + grow) * 2
  const rad = Math.min(r.radius + padding, rw / 2, rh / 2)
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', ...style }}>
      <defs>
        <filter id={`f${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={feather / 2} />
        </filter>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
          <rect x={0} y={0} width={width} height={height} fill="white" />
          <rect x={x} y={y} width={rw} height={rh} rx={rad} ry={rad} fill="black" filter={`url(#f${id})`} />
        </mask>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill={color} opacity={dim * k} mask={`url(#m${id})`} />
      {outline && (
        <rect x={x} y={y} width={rw} height={rh} rx={rad} ry={rad} fill="none" stroke="white" strokeOpacity={0.35 * k} strokeWidth={1.5} />
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// FocusRing
// ---------------------------------------------------------------------------

export interface FocusRingProps {
  /** Zone entourée (repère du conteneur). Ignoré si `steps` est fourni. */
  rect?: Rect
  /** Variante multi-zones : l'anneau morphe d'un rectangle à l'autre. */
  steps?: RectStep[]
  /** Frame d'apparition (tracé du contour). Défaut 0 ou 1er step. */
  at?: number
  /** Frame de disparition. */
  until?: number
  /** Distance entre la zone et l'anneau (px). Défaut 6. */
  gap?: number
  /** Épaisseur (px). Défaut 3. */
  thickness?: number
  /** Rayon des coins de la zone (px). Défaut 12. */
  radius?: number
  /** Halo flou sous l'anneau. Défaut true. */
  glow?: boolean
  /** Tours/seconde de la rotation du dégradé. Défaut 0.35. */
  spin?: number
  /** Couleur unie de l'anneau (ex. BRAND.blue). Défaut : dégradé de marque. */
  color?: string
  style?: CSSProperties
}

/** Anneau au dégradé de marque qui se trace, se resserre en ressort et scintille. */
export function FocusRing({ rect, steps, at, until, gap = 6, thickness = 3, radius = 12, glow = true, spin = 0.35, color, style }: FocusRingProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const id = useId().replace(/:/g, '')
  const list: RectStep[] = steps ?? (rect ? [{ at: at ?? 0, rect, radius }] : [])
  const r = useMorphRect(list, 'morph', radius)
  if (list.length === 0) return null
  const start = at ?? Math.min(...list.map((s) => s.at))
  const draw = springPreset({ frame, fps, preset: 'smooth', delay: start, durationInFrames: 24 })
  const settle = springPreset({ frame, fps, preset: 'snappy', delay: start })
  const out = until === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: until, durationInFrames: 16 })
  if (frame < start || out >= 0.999) return null
  const pad = gap + (1 - settle) * 14 + out * 10
  const x = r.x - pad
  const y = r.y - pad
  const w = r.w + pad * 2
  const h = r.h + pad * 2
  const rad = r.radius + pad
  const m = 30 // marge du SVG pour le halo
  const angle = ((frame - start) / fps) * spin * 360
  const opacity = (1 - out) * interpolate(draw, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' })
  const shape = (
    <rect x={m} y={m} width={w} height={h} rx={rad} ry={rad} fill="none" stroke={`url(#g${id})`} strokeWidth={thickness} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" />
  )
  return (
    <svg
      width={w + m * 2}
      height={h + m * 2}
      style={{ position: 'absolute', left: x - m, top: y - m, overflow: 'visible', pointerEvents: 'none', opacity, ...style }}
    >
      <defs>
        <linearGradient id={`g${id}`} gradientUnits="objectBoundingBox" gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={color ?? BRAND_RAMP_STOPS[0]} />
          <stop offset="45%" stopColor={color ?? BRAND_RAMP_STOPS[1]} />
          <stop offset="100%" stopColor={color ?? BRAND_RAMP_STOPS[2]} />
        </linearGradient>
        <filter id={`b${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      {glow && <g filter={`url(#b${id})`} opacity={0.55}>{shape}</g>}
      {shape}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

export interface CalloutProps {
  /** Point désigné (repère du conteneur). */
  target: Point
  /** Position du bout du trait, relative à la cible. Défaut { x: 140, y: -90 }. */
  offset?: Point
  /** Frame de départ (point, puis trait, puis bulle). */
  at: number
  until?: number
  title: ReactNode
  body?: ReactNode
  /** Pastille à gauche du titre : numéro, texte ou icône lucide (composant ou élément). */
  badge?: ReactNode
  /** 'light' (carte blanche), 'dark' (verre sombre) ou 'brand' (dégradé). Défaut 'light'. */
  theme?: 'light' | 'dark' | 'brand'
  /** Largeur max de la bulle. Défaut 400. */
  maxWidth?: number
  /** Couleur de la tige et de l'ancre. Défaut BRAND.blue. */
  lineColor?: string
  /** Échelle globale (typo, trait, point). Défaut 1. */
  scale?: number
  style?: CSSProperties
}

/**
 * Annotation simple, même langage que <AnnotationTree> : ancre bleue pulsante,
 * tige en L aux coudes arrondis (BRAND.blue), carte travaillée qui se pose au bout.
 */
export function Callout({
  target,
  offset = { x: 140, y: -90 },
  at,
  until,
  title,
  body,
  badge,
  theme = 'light',
  maxWidth = 400,
  lineColor,
  scale = 1,
  style,
}: CalloutProps) {
  const end = { x: target.x + offset.x, y: target.y + offset.y }
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', ...style }}>
      <LeaderAnnotation
        target={target}
        end={end}
        at={at}
        until={until}
        side={offset.x >= 0 ? 'right' : 'left'}
        theme={theme}
        color={lineColor ?? BRAND.blue}
        scale={scale}
        card={<AnnotationCard title={title} caption={body} icon={badge} theme={theme} scale={scale} titleSize={24} captionSize={18} maxWidth={maxWidth} />}
      />
    </div>
  )
}
