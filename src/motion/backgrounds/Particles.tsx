/**
 * <Particles> : poussière de points qui dérive, graine fixe.
 * Chaque particule a une profondeur (taille, opacité, vitesse, flou).
 * Vitesses en nombre ENTIER d'écrans par boucle : boucle parfaite.
 * Option `links` : constellation (traits entre voisins proches).
 */
import { useId, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { loopAngle, svgId, withAlpha, type BackgroundTheme } from './loop'

export interface ParticlesProps {
  theme?: BackgroundTheme
  /** Nombre de particules. */
  count?: number
  /** Couleurs (cyclées au hasard). */
  colors?: string[]
  /** Sens de dérive. 'none' = flottement sur place. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Rayon min/max en px (à 1080p). */
  size?: [number, number]
  /** Durée d'une boucle parfaite (une particule lente traverse l'écran une fois). */
  loopFrames?: number
  /** Opacité max. */
  opacity?: number
  /** Relie les particules proches (distance en px à 1080p, 0 = off). */
  links?: number
  /** Dessine un fond (sinon transparent, à poser sur un autre fond). */
  base?: string | null
  seed?: string
  children?: ReactNode
  style?: CSSProperties
}

const DEFAULT_COLORS: Record<BackgroundTheme, string[]> = {
  light: [BRAND.violet, BRAND.ink, BRAND.rose, BRAND.blue, BRAND.textMuted],
  dark: ['#FFFFFF', BRAND.blueSoft, BRAND.rose, BRAND.blue, '#FFFFFF'],
}

export const Particles: React.FC<ParticlesProps> = ({
  theme = 'light',
  count = 90,
  colors,
  direction = 'up',
  size = [2, 6.5],
  loopFrames = 900,
  opacity = 0.85,
  links = 0,
  base = null,
  seed = 'particles',
  children,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const unit = Math.min(width, height) / 1080
  const blurId = svgId(useId(), 'pblur')
  const palette = colors ?? DEFAULT_COLORS[theme]
  const t = (((frame % loopFrames) + loopFrames) % loopFrames) / loopFrames
  const a = loopAngle(frame, loopFrames)
  const margin = 20 * unit

  const pts = Array.from({ length: count }, (_, i) => {
    const r = (k: string) => random(`${seed}-${k}-${i}`)
    const z = r('z') // profondeur : 0 loin, 1 près
    const laps = 1 + Math.floor(z * 2.999) // 1..3 écrans par boucle
    const wob = 1 + Math.floor(r('wf') * 3) // fréquence entière du flottement
    const amp = (6 + r('wa') * 22) * unit * (0.5 + z)
    const ph = r('ph') * Math.PI * 2
    let x = r('x') * (width + margin * 2) - margin
    let y = r('y') * (height + margin * 2) - margin
    const W = width + margin * 2
    const H = height + margin * 2
    const wrap = (v: number, m: number) => ((((v + margin) % m) + m) % m) - margin
    if (direction === 'up') y = wrap(y - t * laps * H, H)
    if (direction === 'down') y = wrap(y + t * laps * H, H)
    if (direction === 'left') x = wrap(x - t * laps * W, W)
    if (direction === 'right') x = wrap(x + t * laps * W, W)
    x += Math.sin(a * wob + ph) * amp
    y += Math.cos(a * wob + ph * 1.3) * amp * 0.6
    const radius = (size[0] + (size[1] - size[0]) * z * z) * unit
    const twinkle = 0.55 + 0.45 * Math.sin(a * (2 + Math.floor(r('tw') * 4)) + ph)
    return {
      x,
      y,
      radius,
      z,
      color: palette[Math.floor(r('c') * palette.length)],
      alpha: Math.min(1, opacity * (0.35 + 0.65 * z) * twinkle),
    }
  })

  const linkDist = links * unit
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number; o: number }> = []
  if (linkDist > 0) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x
        const dy = pts[i].y - pts[j].y
        const d = Math.hypot(dx, dy)
        if (d < linkDist) segs.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y, o: (1 - d / linkDist) * Math.min(pts[i].alpha, pts[j].alpha) * 0.7 })
      }
    }
  }
  const linkColor = theme === 'light' ? BRAND.violet : '#FFFFFF'

  return (
    <AbsoluteFill style={{ background: base ?? undefined, ...style }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id={blurId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={2.2 * unit} />
          </filter>
        </defs>
        {segs.map((s, i) => (
          <line key={`l${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={withAlpha(linkColor, s.o)} strokeWidth={unit} />
        ))}
        {/* Plan lointain flouté (profondeur de champ), puis plan net. */}
        <g filter={`url(#${blurId})`}>
          {pts.filter((p) => p.z < 0.35).map((p, i) => (
            <circle key={`f${i}`} cx={p.x} cy={p.y} r={p.radius * 1.4} fill={withAlpha(p.color, p.alpha)} />
          ))}
        </g>
        {pts.filter((p) => p.z >= 0.35).map((p, i) => (
          <circle key={`n${i}`} cx={p.x} cy={p.y} r={p.radius} fill={withAlpha(p.color, p.alpha)} />
        ))}
      </svg>
      {children}
    </AbsoluteFill>
  )
}
