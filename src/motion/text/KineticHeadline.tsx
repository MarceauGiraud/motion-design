/**
 * <KineticHeadline> : titre qui entre mot par mot (ou lettre par lettre).
 * Chaque unité monte sur un ressort (y + rotateX + flou), le flou suit la
 * vitesse du ressort. Option masque (les mots sortent de sous la ligne) et
 * mots surlignés au dégradé du logo.
 */
import type { CSSProperties } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP, FONT_DISPLAY } from '../tokens'
import { clamp, gradientFill, graphemes, motionBlur, springV } from './shared'

export interface KineticHeadlineProps {
  /** Texte. `\n` force un retour à la ligne. */
  text?: string
  /** Unité d'animation. */
  splitBy?: 'word' | 'char'
  /** Frame de départ. */
  delay?: number
  /** Frames entre deux unités (défaut : 3.5 mot, 1.2 lettre). */
  stagger?: number
  /** Preset du ressort d'entrée. */
  preset?: SpringPresetName
  /** Les mots sortent de derrière un masque (pas de flou, pure montée). */
  mask?: boolean
  /** Mots peints au dégradé BRAND_RAMP (comparaison sans ponctuation, insensible à la casse). */
  highlight?: string[]
  /** Dégradé des mots surlignés. */
  highlightGradient?: string
  /** Frame de sortie (les unités s'envolent en flou). Absent = pas de sortie. */
  exitAt?: number
  /** Décalage de départ : y (em), rotateX (deg), flou (px), échelle. */
  from?: { y?: number; rotateX?: number; blur?: number; scale?: number }
  fontSize?: number
  fontWeight?: number
  color?: string
  lineHeight?: number
  letterSpacing?: string
  align?: 'left' | 'center' | 'right'
  /** Largeur max du bloc (px). */
  maxWidth?: number
  fontFamily?: string
  style?: CSSProperties
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

export const KineticHeadline: React.FC<KineticHeadlineProps> = ({
  text = 'Votre CRM,\nenfin fluide.',
  splitBy = 'word',
  delay = 0,
  stagger,
  preset = 'snappy',
  mask = false,
  highlight = [],
  highlightGradient = BRAND_RAMP,
  exitAt,
  from,
  fontSize = 128,
  fontWeight = 500,
  color = BRAND.text,
  lineHeight = 1.04,
  letterSpacing = '-0.04em',
  align = 'center',
  maxWidth,
  fontFamily = FONT_DISPLAY,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const step = stagger ?? (splitBy === 'word' ? 3.5 : 1.2)
  const fy = from?.y ?? (mask ? 1.05 : 0.55)
  const fRot = from?.rotateX ?? (mask ? 0 : -55)
  const fBlur = from?.blur ?? (mask ? 0 : 14)
  const fScale = from?.scale ?? (mask ? 1 : 0.94)
  const highlightSet = new Set(highlight.map(norm))

  const lines = text.split('\n').map((l) => l.split(' ').filter(Boolean))
  let unit = 0

  const animate = (index: number): CSSProperties => {
    const { value: p, velocity } = springV({ frame, fps, preset, delay: delay + index * step })
    const vPx = velocity * fy * fontSize
    let y = (1 - p) * fy
    let blur = (1 - p) * fBlur + (mask ? 0 : motionBlur(vPx, 0.12, 6))
    let opacity = mask ? 1 : interpolate(p, [0, 0.55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const rot = (1 - p) * fRot
    const scale = fScale + (1 - fScale) * p
    if (exitAt !== undefined) {
      const e = springPreset({ frame, fps, preset: 'smooth', delay: exitAt + index * step * 0.6, durationInFrames: 22 })
      y -= e * (mask ? 1.1 : 0.4)
      blur += mask ? 0 : e * 12
      opacity *= mask ? 1 : 1 - clamp(e * 1.2)
    }
    return {
      display: 'inline-block',
      transform: `translateY(${y}em) rotateX(${rot}deg) scale(${scale})`,
      transformOrigin: '50% 100%',
      filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      opacity,
      willChange: 'transform',
    }
  }

  const maskStyle: CSSProperties = mask
    ? { overflow: 'hidden', padding: '0.06em 0.04em 0.16em', margin: '-0.06em -0.04em -0.16em', verticalAlign: 'top' }
    : {}

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        lineHeight,
        letterSpacing,
        textAlign: align,
        maxWidth,
        perspective: fontSize * 9,
        fontKerning: 'normal',
        ...style,
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={{ whiteSpace: maxWidth ? 'normal' : 'nowrap' }}>
          {words.map((word, wi) => {
            const hl = highlightSet.has(norm(word))
            const fill = hl ? gradientFill(highlightGradient) : undefined
            const space = wi < words.length - 1 ? ' ' : ''
            if (splitBy === 'word') {
              const s = animate(unit++)
              return (
                <span key={wi}>
                  <span style={{ display: 'inline-block', ...maskStyle }}>
                    <span style={{ ...s, ...fill, ...(hl ? { padding: '0.1em 0.02em', margin: '-0.1em -0.02em' } : {}) }}>{word}</span>
                  </span>
                  {space}
                </span>
              )
            }
            const chars = graphemes(word)
            return (
              <span key={wi}>
                <span style={{ display: 'inline-block', whiteSpace: 'nowrap', ...maskStyle }}>
                  {chars.map((c, ci) => {
                    const s = animate(unit++)
                    const charFill: CSSProperties | undefined = hl
                      ? {
                          ...fill,
                          backgroundSize: `${chars.length * 100}% 100%`,
                          backgroundPosition: `${chars.length > 1 ? (ci / (chars.length - 1)) * 100 : 0}% 0`,
                          padding: '0.1em 0', margin: '-0.1em 0',
                        }
                      : undefined
                    return (
                      <span key={ci} style={{ ...s, ...charFill }}>
                        {c}
                      </span>
                    )
                  })}
                </span>
                {space}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
