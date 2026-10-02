/**
 * <MorphBlob> : blob organique vivant (bruit 3D de @remotion/noise sur le
 * rayon polaire) qui peut morpher entre des formes de la bibliothèque.
 * La forme de base est échantillonnée en rayon par angle ; le bruit ondule
 * par-dessus. Idéal en fond, derrière un logo, ou comme "goutte" de marque.
 */
import { useId, type CSSProperties } from 'react'
import { noise3D } from '@remotion/noise'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND_RAMP_STOPS } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { flattenPath, resample, signedArea, toPathD, type Pt } from './path-engine'
import { resolveShape, type ShapeInput } from './shapes'
import { safeId } from './core'

const BINS = 180
const polarCache = new Map<string, number[]>()

/** Rayon (boîte 0..100, centre 50,50) de la forme pour BINS angles. */
function polarProfile(d: string): number[] {
  const hit = polarCache.get(d)
  if (hit) return hit
  const outer = flattenPath(d)
    .filter((p) => p.closed)
    .sort((a, b) => Math.abs(signedArea(b.pts)) - Math.abs(signedArea(a.pts)))[0]
  const r = new Array<number>(BINS).fill(-1)
  if (outer) {
    for (const [x, y] of resample(outer, 1440)) {
      const a = Math.atan2(y - 50, x - 50)
      const b = ((Math.round((a / (Math.PI * 2)) * BINS) % BINS) + BINS) % BINS
      r[b] = Math.max(r[b], Math.hypot(x - 50, y - 50))
    }
  }
  // Bouche les trous par interpolation circulaire.
  for (let i = 0; i < BINS; i++) {
    if (r[i] >= 0) continue
    let lo = i
    let hi = i
    while (r[(lo + BINS) % BINS] < 0 && i - lo < BINS) lo--
    while (r[hi % BINS] < 0 && hi - i < BINS) hi++
    const a = r[(lo + BINS) % BINS]
    const b = r[hi % BINS]
    r[i] = a < 0 || b < 0 ? 46 : a + ((b - a) * (i - lo)) / Math.max(1, hi - lo)
  }
  // Lissage circulaire : gomme les marches du binning sur les arêtes quasi radiales.
  const sm = r.map((_, i) => {
    let s = 0
    for (let k = -3; k <= 3; k++) s += r[(i + k + BINS) % BINS]
    return s / 7
  })
  polarCache.set(d, sm)
  return sm
}

export interface MorphBlobProps {
  /** Côté du carré de rendu (px). Défaut 520. */
  size?: number
  /** Graine du bruit (déterministe). */
  seed?: string
  /** Amplitude de l'ondulation (fraction du rayon). Défaut 0.1. */
  amplitude?: number
  /** Fréquence spatiale du bruit (bosses autour du contour). Défaut 1.3. */
  frequency?: number
  /** Vitesse d'évolution du bruit (unités / frame). Défaut 0.012. */
  speed?: number
  /** Formes successives (étoilées depuis le centre). Défaut ['circle']. */
  shapes?: ShapeInput[]
  /** Frames des transitions : at[i] -> vers shapes[i+1]. Défaut toutes les 45 frames depuis 30. */
  at?: number[]
  /** Preset des transitions de forme. Défaut 'jelly' (gélatine). */
  preset?: SpringPresetName
  /** Couleur unie ou stops de dégradé. Défaut : rampe de marque. */
  fill?: string | readonly string[]
  /** Rotation continue (deg / frame). Défaut 0.15. */
  rotateSpeed?: number
  /** Lueur floue autour. Défaut true. */
  glow?: boolean
  /** Nombre de points du contour. Défaut 144. */
  points?: number
  style?: CSSProperties
}

export function MorphBlob({
  size = 520,
  seed = 'blob',
  amplitude = 0.1,
  frequency = 1.3,
  speed = 0.012,
  shapes = ['circle'],
  at,
  preset = 'jelly',
  fill = BRAND_RAMP_STOPS,
  rotateSpeed = 0.15,
  glow = true,
  points = 144,
  style,
}: MorphBlobProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const id = safeId(useId())
  const profiles = shapes.map((s) => polarProfile(resolveShape(s)))
  const progress = shapes.map((_, i) =>
    i === 0 ? 0 : springPreset({ frame, fps, preset, delay: at?.[i - 1] ?? 30 + (i - 1) * 45 })
  )

  const t = frame * speed
  const pts: Pt[] = []
  for (let k = 0; k < points; k++) {
    const theta = (k / points) * Math.PI * 2
    const fb = (k / points) * BINS
    const at0 = (p: number[]) => {
      const i0 = Math.floor(fb) % BINS
      const u = fb - Math.floor(fb)
      return p[i0] * (1 - u) + p[(i0 + 1) % BINS] * u
    }
    let r = at0(profiles[0])
    for (let i = 1; i < profiles.length; i++) r += (at0(profiles[i]) - at0(profiles[i - 1])) * progress[i]
    const n = noise3D(seed, Math.cos(theta) * frequency, Math.sin(theta) * frequency, t)
    r *= 1 + amplitude * n
    pts.push([50 + Math.cos(theta) * r, 50 + Math.sin(theta) * r])
  }
  const d = toPathD(pts, true, true)
  const stops = typeof fill === 'string' ? null : fill
  const paint = stops ? `url(#${id}-g)` : (fill as string)
  const rot = frame * rotateSpeed
  const gA = ((35 + frame * 0.6) * Math.PI) / 180

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', ...style }}>
      <defs>
        {stops && (
          <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={50 - Math.cos(gA) * 50} y1={50 - Math.sin(gA) * 50} x2={50 + Math.cos(gA) * 50} y2={50 + Math.sin(gA) * 50}>
            {stops.map((c, i) => (
              <stop key={i} offset={stops.length === 1 ? 0 : i / (stops.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
        )}
        {glow && (
          <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        )}
      </defs>
      <g transform={`rotate(${rot.toFixed(3)} 50 50)`}>
        {glow && <path d={d} fill={paint} opacity={0.5} filter={`url(#${id}-glow)`} />}
        <path d={d} fill={paint} />
      </g>
    </svg>
  )
}
