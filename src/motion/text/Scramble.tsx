/**
 * <Scramble> : effet "décodage". Chaque caractère apparaît en glyphes
 * aléatoires (seedés) puis se fige sur le bon, avec un flash d'accent qui
 * retombe sur un ressort. La largeur finale est réservée : aucune secousse.
 */
import type { CSSProperties } from 'react'
import { interpolate, interpolateColors, random, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset } from '../physics/springs'
import { BRAND, FONT_DISPLAY } from '../tokens'
import { graphemes } from './shared'

export interface ScrambleProps {
  text?: string
  /** Frame de départ. */
  startAt?: number
  /** Frames entre la résolution de deux caractères. */
  stagger?: number
  /** Durée (frames) pendant laquelle un caractère brouille avant de se figer. */
  scrambleFrames?: number
  /** Le glyphe brouillé change toutes les N frames. */
  rate?: number
  /** Alphabet des glyphes brouillés. */
  charset?: string
  seed?: string
  /** Couleur des glyphes brouillés / du flash de résolution. */
  accentColor?: string
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  /** Chiffres tabulaires / monospace-like. */
  tabular?: boolean
  style?: CSSProperties
}

export const Scramble: React.FC<ScrambleProps> = ({
  text = 'Pipeline synchronisé',
  startAt = 6,
  stagger = 1.8,
  scrambleFrames = 16,
  rate = 2,
  charset = 'ABCDEFGHIJKLNOPRSTUVXYZ0123456789#$*+=/<>',
  seed = 'scramble',
  accentColor = BRAND.rose,
  fontSize = 110,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.02em',
  tabular = true,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const chars = graphemes(text)
  const pool = graphemes(charset)

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        lineHeight: 1.15,
        whiteSpace: 'pre',
        fontVariantNumeric: tabular ? 'tabular-nums' : undefined,
        ...style,
      }}
    >
      {chars.map((c, i) => {
        if (c === ' ') return <span key={i}> </span>
        const resolveAt = startAt + scrambleFrames + i * stagger + random(`${seed}-j-${i}`) * 3
        const appearAt = resolveAt - scrambleFrames
        const appear = springPreset({ frame, fps, preset: 'snappy', delay: appearAt })
        const resolved = frame >= resolveAt
        const settle = springPreset({ frame, fps, preset: 'bouncy', delay: resolveAt })
        const tick = Math.floor(frame / rate)
        const r = random(`${seed}-${i}-${tick}`)
        const g = pool[Math.floor(r * pool.length)] ?? c
        const glyph = resolved ? c : c === c.toLowerCase() && c !== c.toUpperCase() ? g.toLowerCase() : g
        const tint = resolved ? interpolateColors(settle, [0, 1], [accentColor, color]) : accentColor
        const o = resolved ? 1 : interpolate(appear, [0, 1], [0, 0.55], { extrapolateRight: 'clamp' })
        const y = resolved ? (1 - settle) * -0.06 : (1 - appear) * 0.2
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ visibility: 'hidden' }}>{c}</span>
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: `translateX(-50%) translateY(${y}em)`,
                color: tint,
                opacity: frame < appearAt ? 0 : o,
                filter: !resolved && appear < 0.9 ? `blur(${(1 - appear) * 6}px)` : undefined,
              }}
            >
              {glyph}
            </span>
          </span>
        )
      })}
    </div>
  )
}
