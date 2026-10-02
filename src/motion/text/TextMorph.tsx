/**
 * <TextMorph> : morph entre mots / phrases, façon keynote.
 * Les lettres communes (plus longue sous-séquence) glissent vers leur nouvelle
 * place sur un ressort ; les autres se dissolvent en flou et les nouvelles
 * arrivent en cascade. Positions mesurées au pixel près (DOM), donc le
 * dégradé optionnel reste continu d'un mot à l'autre.
 */
import { useMemo, type CSSProperties } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP, FONT_DISPLAY } from '../tokens'
import { clamp, graphemes, lcsPairs, mix, motionBlur, springV, useTextLayouts, type TextLayout } from './shared'

export interface TextMorphProps {
  /** Mots / phrases successifs. */
  words?: string[]
  /** Frame d'entrée du premier mot. */
  startAt?: number
  /** Tenue de chaque mot (frames) avant le morph suivant. */
  hold?: number
  /** Durée d'un morph (frames). */
  morphFrames?: number
  /** Preset des lettres qui glissent. */
  preset?: SpringPresetName
  /** Après le dernier mot, revient au premier (cycle infini). */
  loop?: boolean
  /** Joue une entrée du premier mot (lettres en cascade). */
  enter?: boolean
  /** Lettres peintes au dégradé BRAND_RAMP (continu sur toute la largeur). */
  gradient?: boolean | string
  align?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  style?: CSSProperties
}

export const TextMorph: React.FC<TextMorphProps> = ({
  words = ['Prospects', 'Pipeline', 'Clients', 'Acme'],
  startAt = 0,
  hold = 40,
  morphFrames = 28,
  preset = 'morph',
  loop = false,
  enter = true,
  gradient = false,
  align = 'center',
  fontSize = 150,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.04em',
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const lineHeight = 1.2
  const { layouts, measurer } = useTextLayouts(words, { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight })
  const split = useMemo(() => words.map(graphemes), [words])

  const maxW = layouts ? Math.max(...layouts.map((l) => l.width)) : 0
  const offset = (l: TextLayout) => (align === 'center' ? (maxW - l.width) / 2 : align === 'right' ? maxW - l.width : 0)

  // Quelle transition est en cours ?
  const cycle = hold + morphFrames
  const n = words.length
  const t0 = frame - startAt - hold
  const rawK = Math.floor(t0 / cycle)
  const maxK = loop ? Infinity : n - 2
  const k = Math.min(rawK, maxK)
  const local = t0 - k * cycle

  const fill = gradient
    ? { backgroundImage: typeof gradient === 'string' ? gradient : BRAND_RAMP, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' as const }
    : null

  const glyphStyle = (x: number, extra: CSSProperties): CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    whiteSpace: 'pre',
    ...(fill ? { ...fill, backgroundSize: `${maxW}px 100%`, backgroundPosition: `${-x}px 0` } : {}),
    ...extra,
    transform: `translateX(${x}px) ${extra.transform ?? ''}`,
  })

  let glyphs: React.ReactNode[] = []
  if (layouts) {
    if (k < 0 || n < 2) {
      // Entrée du premier mot.
      const L = layouts[0]
      const off = offset(L)
      glyphs = L.glyphs.map((g, i) => {
        const s = enter ? springPreset({ frame, fps, preset: 'snappy', delay: startAt + i * 1.6 }) : 1
        const o = interpolate(s, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })
        return (
          <span key={`e${i}`} style={glyphStyle(off + g.x, { opacity: o, transform: `translateY(${(1 - s) * 0.35}em) scale(${0.8 + 0.2 * s})`, filter: s < 0.97 ? `blur(${(1 - s) * 16}px)` : undefined })}>
            {g.char}
          </span>
        )
      })
    } else {
      const ia = k % n
      const ib = (k + 1) % n
      const A = layouts[ia]
      const B = layouts[ib]
      const offA = offset(A)
      const offB = offset(B)
      const pairs = lcsPairs(split[ia], split[ib])
      const matchedA = new Map(pairs.map(([a, b]) => [a, b]))
      const matchedB = new Set(pairs.map(([, b]) => b))
      const { value: p, velocity } = springV({ frame: local, fps, preset, durationInFrames: morphFrames })

      A.glyphs.forEach((g, i) => {
        const bi = matchedA.get(i)
        const xa = offA + g.x
        if (bi !== undefined) {
          const xb = offB + B.glyphs[bi].x
          const blur = motionBlur(velocity * (xb - xa), 0.25, 6)
          glyphs.push(
            <span key={`m${i}`} style={glyphStyle(mix(xa, xb, p), { filter: blur > 0.1 ? `blur(${blur}px)` : undefined })}>
              {g.char}
            </span>,
          )
        } else {
          // Sortie : dissolution rapide, dérive avec le mot.
          const q = clamp(interpolate(local, [0, morphFrames * 0.55], [0, 1]))
          const qs = q * q * (3 - 2 * q)
          glyphs.push(
            <span
              key={`o${i}`}
              style={glyphStyle(xa + (offB - offA) * p * 0.5, {
                opacity: 1 - qs,
                transform: `translateY(${-0.22 * qs}em) scale(${1 - 0.25 * qs})`,
                filter: `blur(${qs * 18}px)`,
              })}
            >
              {g.char}
            </span>,
          )
        }
      })
      let j = 0
      B.glyphs.forEach((g, i) => {
        if (matchedB.has(i)) return
        const s = springPreset({ frame: local, fps, preset: 'snappy', delay: morphFrames * 0.3 + j++ * 1.4 })
        const o = interpolate(s, [0, 0.55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        glyphs.push(
          <span
            key={`i${i}`}
            style={glyphStyle(offB + g.x, {
              opacity: o,
              transform: `translateY(${(1 - s) * 0.3}em) scale(${0.75 + 0.25 * s})`,
              filter: s < 0.97 ? `blur(${(1 - s) * 16}px)` : undefined,
            })}
          >
            {g.char}
          </span>,
        )
      })
    }
  }

  return (
    <div style={{ position: 'relative', fontFamily, fontSize, fontWeight, color, letterSpacing, lineHeight, width: maxW, height: fontSize * lineHeight, ...style }}>
      {measurer}
      {glyphs}
    </div>
  )
}

/** Durée totale (frames) pour jouer tous les mots une fois. */
export const textMorphDuration = (count: number, hold = 40, morphFrames = 28, startAt = 0) => startAt + count * hold + (count - 1) * morphFrames
