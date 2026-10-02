/**
 * <Spotlight> : un projecteur qui suit une trajectoire de points clés.
 * Chaque saut entre deux points est un ressort (preset) : le spot accélère,
 * dépasse légèrement, se pose. Il s'étire dans le sens de sa vitesse (flou de
 * mouvement physique).
 *  - mode 'glow' : ajoute de la lumière (à poser au-dessus d'un fond).
 *  - mode 'dim'  : assombrit tout SAUF le spot (à poser au-dessus d'un contenu, ex. la plateforme).
 */
import { useId, type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { svgId, withAlpha } from './loop'

export interface SpotlightStop {
  /** Position en fraction de l'écran (0–1). */
  x: number
  y: number
  /** Frame à laquelle le spot part vers ce point (ignorée pour le premier). */
  at: number
  /** Rayon à ce point, en px à 1080p (défaut : `radius` du composant). */
  radius?: number
}

export interface SpotlightProps {
  /** Trajectoire. Un seul point = spot fixe. */
  path?: SpotlightStop[]
  mode?: 'glow' | 'dim'
  /** Rayon du spot en px (à 1080p). */
  radius?: number
  /** Couleur de la lumière (glow). */
  color?: string
  /** Opacité du voile hors du spot (dim) ou de la lumière (glow). */
  intensity?: number
  /** Couleur du voile (dim). */
  dimColor?: string
  /** Preset de ressort des déplacements. */
  preset?: SpringPresetName
  /** Étirement dû à la vitesse (0 = aucun). */
  stretch?: number
  style?: CSSProperties
}

const DEFAULT_PATH: SpotlightStop[] = [
  { x: 0.28, y: 0.38, at: 0 },
  { x: 0.7, y: 0.32, at: 30, radius: 260 },
  { x: 0.62, y: 0.7, at: 75 },
  { x: 0.34, y: 0.62, at: 115, radius: 300 },
]

function sample(path: SpotlightStop[], frame: number, fps: number, preset: SpringPresetName, baseRadius: number) {
  let x = path[0].x
  let y = path[0].y
  let r = path[0].radius ?? baseRadius
  for (let i = 1; i < path.length; i++) {
    const p = springPreset({ frame, fps, preset, delay: path[i].at })
    x += (path[i].x - path[i - 1].x) * p
    y += (path[i].y - path[i - 1].y) * p
    r += ((path[i].radius ?? baseRadius) - (path[i - 1].radius ?? baseRadius)) * p
  }
  return { x, y, r }
}

export const Spotlight: React.FC<SpotlightProps> = ({
  path = DEFAULT_PATH,
  mode = 'glow',
  radius = 220,
  color = BRAND.violet,
  intensity,
  dimColor = BRAND.night,
  preset = 'heavy',
  stretch = 1,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const uid = svgId(useId(), "spot")
  const unit = Math.min(width, height) / 1080
  const now = sample(path, frame, fps, preset, radius)
  const prev = sample(path, frame - 1, fps, preset, radius)
  const vx = (now.x - prev.x) * width
  const vy = (now.y - prev.y) * height
  const speed = Math.hypot(vx, vy)
  const angle = (Math.atan2(vy, vx) * 180) / Math.PI
  const k = 1 + Math.min(0.9, (speed / (40 * unit)) * 0.5) * stretch
  const cx = now.x * width
  const cy = now.y * height
  const r = now.r * unit

  if (mode === 'dim') {
    const a = intensity ?? 0.62
    return (
      <AbsoluteFill style={{ pointerEvents: 'none', ...style }}>
        {/* Voile avec un trou elliptique étiré par la vitesse. */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <filter id={`${uid}-f`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={r * 0.3} />
            </filter>
            <mask id={`${uid}-m`}>
              <rect width={width} height={height} fill="white" />
              <ellipse cx={cx} cy={cy} rx={r * k} ry={r / Math.sqrt(k)} fill="black" transform={`rotate(${angle} ${cx} ${cy})`} filter={`url(#${uid}-f)`} />
            </mask>
          </defs>
          <rect width={width} height={height} fill={withAlpha(dimColor, a)} mask={`url(#${uid}-m)`} />
        </svg>
        {/* Anneau de lumière très doux autour du spot. */}
        <div
          style={{
            position: 'absolute',
            left: cx - r * 1.3,
            top: cy - r * 1.3,
            width: r * 2.6,
            height: r * 2.6,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${withAlpha('#FFFFFF', 0.08)} 0%, transparent 60%)`,
            transform: `rotate(${angle}deg) scale(${k}, ${1 / Math.sqrt(k)})`,
            mixBlendMode: 'screen',
          }}
        />
      </AbsoluteFill>
    )
  }

  const a = intensity ?? 0.55
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', ...style }}>
      <div
        style={{
          position: 'absolute',
          left: cx - r * 2,
          top: cy - r * 2,
          width: r * 4,
          height: r * 4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withAlpha(color, a)} 0%, ${withAlpha(color, a * 0.35)} 28%, transparent 62%)`,
          transform: `rotate(${angle}deg) scale(${k}, ${1 / Math.sqrt(k)})`,
          filter: `blur(${10 * unit}px)`,
        }}
      />
      {/* Cœur blanc, plus serré : donne l'impression d'une vraie source. */}
      <div
        style={{
          position: 'absolute',
          left: cx - r * 0.6,
          top: cy - r * 0.6,
          width: r * 1.2,
          height: r * 1.2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withAlpha('#FFFFFF', a * 0.55)} 0%, transparent 70%)`,
          transform: `rotate(${angle}deg) scale(${k}, ${1 / Math.sqrt(k)})`,
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  )
}
