/**
 * <GradientText> : texte peint au dégradé du logo, qui coule en boucle
 * (rose -> violet -> encre -> violet -> rose, raccord invisible).
 * Options : révélation (le dégradé balaie le texte encre sur un ressort,
 * bord doux) et reflet (un éclat lumineux traverse les lettres).
 */
import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP_STOPS, FONT_DISPLAY } from '../tokens'
import { gradientFill } from './shared'

export interface GradientTextProps {
  text?: string
  /** Cycles de dégradé par seconde (0 = figé). */
  speed?: number
  /** Angle du dégradé (deg). */
  angle?: number
  /** Couleurs du cycle (défaut : rampe du logo). */
  stops?: readonly string[]
  /** Frame de révélation : le texte part en `baseColor` et le dégradé le balaie. Absent = dégradé d'emblée. */
  revealAt?: number
  revealPreset?: SpringPresetName
  /** Couleur de départ avant révélation. */
  baseColor?: string
  /** Frame du reflet lumineux. Absent = pas de reflet. */
  shineAt?: number
  /** Entrée : le mot monte en flou sur un ressort, à partir de cette frame. */
  enterAt?: number
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  letterSpacing?: string
  lineHeight?: number
  style?: CSSProperties
}

export const GradientText: React.FC<GradientTextProps> = ({
  text = 'Acme',
  speed = 0.22,
  angle = 100,
  stops = BRAND_RAMP_STOPS,
  revealAt,
  revealPreset = 'heavy',
  baseColor = BRAND.text,
  shineAt,
  enterAt,
  fontSize = 220,
  fontWeight = 500,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.045em',
  lineHeight = 1.1,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Cycle sans couture : motif symétrique de période 200 %, déphasé linéairement.
  const cycle = [...stops, ...[...stops].reverse().slice(1)]
  const period = 200
  const phase = -(((frame / fps) * speed * period) % period)
  const ramp = `repeating-linear-gradient(${angle}deg, ${cycle
    .map((c, i) => `${c} ${(phase + (i / (cycle.length - 1)) * period).toFixed(3)}%`)
    .join(', ')})`

  const reveal = revealAt === undefined ? 1 : springPreset({ frame, fps, preset: revealPreset, delay: revealAt })
  const edge = reveal * 130 - 15
  const mask = revealAt === undefined ? undefined : `linear-gradient(90deg, #000 ${edge - 15}%, transparent ${edge + 15}%)`

  const shine = shineAt === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: shineAt, durationInFrames: 36 })
  const enter = enterAt === undefined ? 1 : springPreset({ frame, fps, preset: 'snappy', delay: enterAt })

  const layer: CSSProperties = { gridArea: '1 / 1', padding: '0.08em 0.06em 0.14em', whiteSpace: 'pre' }

  return (
    <div
      style={{
        display: 'inline-grid',
        fontFamily,
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight,
        margin: '-0.08em -0.06em -0.14em',
        opacity: Math.min(1, enter * 1.8),
        transform: `translateY(${(1 - enter) * 0.3}em) scale(${0.92 + 0.08 * enter})`,
        filter: enter < 0.97 ? `blur(${(1 - enter) * 18}px)` : undefined,
        ...style,
      }}
    >
      {revealAt !== undefined ? <span style={{ ...layer, color: baseColor }}>{text}</span> : null}
      <span style={{ ...layer, ...gradientFill(ramp), maskImage: mask, WebkitMaskImage: mask }}>{text}</span>
      {shineAt !== undefined && shine > 0.001 && shine < 0.999 ? (
        <span
          style={{
            ...layer,
            ...gradientFill('linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)'),
            backgroundSize: '250% 100%',
            backgroundPosition: `${(1 - shine) * 100}% 0`,
            mixBlendMode: 'screen',
          }}
        >
          {text}
        </span>
      ) : null}
    </div>
  )
}
