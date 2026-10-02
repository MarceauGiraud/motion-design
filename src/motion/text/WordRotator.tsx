/**
 * <WordRotator> : "Le CRM pour [les fondateurs ↕]." Le mot-clé tourne comme un
 * tambour de machine à sous (rotateX + flou de vitesse) et la largeur de la
 * fente suit le même ressort : le reste de la phrase est poussé physiquement.
 */
import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'

import { type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP, FONT_DISPLAY } from '../tokens'
import { gradientFill, motionBlur, springV, useTextLayouts } from './shared'

export interface WordRotatorProps {
  /** Texte avant le mot-clé. */
  before?: string
  /** Mots-clés qui défilent. */
  words?: string[]
  /** Texte après le mot-clé. */
  after?: string
  /** Frame d'entrée de la phrase (montée + flou). null = déjà en place. */
  enterAt?: number | null
  /** Frame du premier changement. */
  startAt?: number
  /** Frames entre deux changements. */
  interval?: number
  /** Nombre max de changements (défaut : illimité, boucle sur la liste). */
  steps?: number
  /** Ressort du tambour et de la largeur (snappy = léger dépassement). */
  preset?: SpringPresetName
  /** Couleur ou dégradé du mot-clé (true = BRAND_RAMP). */
  keywordGradient?: boolean | string
  keywordColor?: string
  /** Inclinaison 3D du tambour (deg par cran). */
  drumAngle?: number
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  style?: CSSProperties
}

export const WordRotator: React.FC<WordRotatorProps> = ({
  before = 'Le CRM des',
  words = ['fondateurs', 'agences', 'équipes sales', 'freelances'],
  after = '',
  enterAt = 0,
  startAt = 30,
  interval = 42,
  steps,
  preset = 'snappy',
  keywordGradient = true,
  keywordColor = BRAND.violet,
  drumAngle = 62,
  fontSize = 110,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.04em',
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const lh = 1.25
  const { layouts, measurer } = useTextLayouts(words, { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight: lh })
  const n = words.length
  const widths = layouts?.map((l) => l.width) ?? words.map(() => 0)

  // Index continu = somme des ressorts de chaque cran ; largeur idem.
  const done = frame < startAt ? 0 : Math.floor((frame - startAt) / interval) + 1
  const count = Math.min(done, steps ?? Infinity)
  let index = 0
  let vel = 0
  let width = widths[0]
  for (let s = 0; s < count; s++) {
    const { value, velocity } = springV({ frame, fps, preset, delay: startAt + s * interval })
    index += value
    vel += velocity
    width += (widths[(s + 1) % n] - widths[s % n]) * value
  }

  const H = fontSize * lh
  const e = enterAt === null ? 1 : springV({ frame, fps, preset: 'morph', delay: enterAt }).value
  const fill: CSSProperties = keywordGradient
    ? gradientFill(typeof keywordGradient === 'string' ? keywordGradient : BRAND_RAMP)
    : { color: keywordColor }
  // Rayon du tambour : deux crans voisins sont séparés d'exactement une hauteur de ligne.
  const radius = H / 2 / Math.tan((drumAngle * Math.PI) / 360)
  const blurV = motionBlur(vel * H, 0.12, 9)
  const base = Math.floor(index)

  const items: React.ReactNode[] = []
  for (let j = base - 1; j <= base + 2; j++) {
    if (j < 0) continue
    const d = j - index
    if (Math.abs(d) > 1.4) continue
    const w = words[((j % n) + n) % n]
    items.push(
      <div
        key={j}
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          height: H,
          whiteSpace: 'pre',
          transform: `translateX(-50%) rotateX(${-d * drumAngle}deg)`,
          transformOrigin: `50% 50% ${-radius}px`,
          opacity: Math.max(0, 1 - Math.abs(d) * 1.1),
          filter: blurV + Math.abs(d) * 6 > 0.15 ? `blur(${blurV + Math.abs(d) * 6}px)` : undefined,
          backfaceVisibility: 'hidden',
        }}
      >
        <span style={{ ...fill, padding: '0 0.06em 0.12em', margin: '0 -0.06em -0.12em', display: 'inline-block' }}>{w}</span>
      </div>,
    )
  }

  return (
    <div style={{ fontFamily, fontSize, fontWeight, color, letterSpacing, lineHeight: lh, display: 'inline-flex', alignItems: 'center', whiteSpace: 'pre',
        opacity: Math.min(1, e * 1.6),
        transform: `translateY(${(1 - e) * 0.35}em)`,
        filter: e < 0.97 ? `blur(${(1 - e) * 12}px)` : undefined,
        ...style }}>
      {measurer}
      {before ? <span>{before} </span> : null}
      <span style={{ position: 'relative', display: 'inline-block', width: Math.max(0, width), height: H }}>
        <span
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: -fontSize * 2,
            right: -fontSize * 2,
            perspective: H * 6,
            overflow: 'hidden',
            maskImage: 'linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
          }}
        >
          {items}
        </span>
      </span>
      {after ? <span>{after.match(/^[.,!?…:;]/) ? after : ` ${after}`}</span> : null}
    </div>
  )
}
