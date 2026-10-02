/**
 * <SplitReveal> : un titre entre, un trait au dégradé du logo le traverse,
 * les deux moitiés se serrent (anticipation) puis s'écartent sur un ressort
 * et révèlent un second message (ou n'importe quel contenu) dans la fente.
 */
import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP, FONT_DISPLAY } from '../tokens'
import { motionBlur, springV } from './shared'

export interface SplitRevealProps {
  /** Titre qui se fend. */
  text?: string
  /** Message révélé dans la fente (ignoré si `children`). */
  revealText?: string
  /** Contenu libre révélé dans la fente. */
  children?: ReactNode
  /** Frame d'entrée du titre. */
  enterAt?: number
  /** Frame où la fente s'ouvre. */
  splitAt?: number
  /** Ouverture de la fente (px). Défaut : 1.1 × fontSize. */
  gap?: number
  /** Ressort de l'ouverture. */
  preset?: SpringPresetName
  /** Trait lumineux le long de la coupe. */
  showLine?: boolean
  /** Opacité des moitiés une fois ouvertes (le message révélé devient le héros). */
  halvesOpacity?: number
  /** Position de la coupe dans la hauteur de ligne (0..1). */
  cutAt?: number
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  /** Style du message révélé. */
  revealStyle?: CSSProperties
  style?: CSSProperties
}

export const SplitReveal: React.FC<SplitRevealProps> = ({
  text = 'Tout votre business.',
  revealText = 'Un seul endroit.',
  children,
  enterAt = 0,
  splitAt = 40,
  gap,
  preset = 'snappy',
  showLine = true,
  halvesOpacity = 0.28,
  cutAt = 0.56,
  fontSize = 150,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.035em',
  revealStyle,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const lh = 1.15
  const H = fontSize * lh
  const G = gap ?? fontSize * 1.5

  // Entrée du titre.
  const e = springPreset({ frame, fps, preset: 'morph', delay: enterAt })
  // Anticipation : les moitiés se serrent juste avant de s'ouvrir.
  const pre = springPreset({ frame, fps, preset: 'snappy', delay: splitAt - 9 })
  const { value: open, velocity } = springV({ frame, fps, preset, delay: splitAt })
  const squeeze = pre * (1 - Math.min(1, open * 1.4)) * fontSize * 0.035
  const half = (open * G) / 2 - squeeze
  const blur = motionBlur(velocity * G, 0.1, 5)
  // Tant que rien ne bouge, un seul titre (pas de couture d'anti-aliasing).
  const whole = Math.abs(half) < 0.05
  const dim = 1 - (1 - halvesOpacity) * interpolate(open, [0.3, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Trait : se dessine pendant l'anticipation, s'efface quand la fente s'ouvre.
  const lineDraw = springPreset({ frame, fps, preset: 'smooth', delay: splitAt - 14, durationInFrames: 16 })
  const lineFade = 1 - interpolate(open, [0.2, 0.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Contenu révélé.
  const r = springPreset({ frame, fps, preset: 'morph', delay: splitAt + 5 })

  const cutPct = cutAt * 100
  const headline: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -H / 2,
    height: H,
    lineHeight: lh,
    textAlign: 'center',
    whiteSpace: 'pre',
    filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
  }

  return (
    <div
      style={{
        position: 'relative',
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        height: H + G,
        width: '100%',
        ...style,
      }}
    >
      {/* Révélé, dans la fente */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: G,
          marginTop: -G / 2 + H * (cutAt - 0.5),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          clipPath: `inset(${50 - Math.max(0, open) * 50}% -20% ${50 - Math.max(0, open) * 50}% -20%)`,
        }}
      >
        <div
          style={{
            opacity: interpolate(r, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `scale(${0.86 + 0.14 * r})`,
            filter: r < 0.97 ? `blur(${(1 - r) * 14}px)` : undefined,
          }}
        >
          {children ?? (
            <div
              style={{
                fontSize: fontSize * 0.6,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                whiteSpace: 'pre',
                backgroundImage: BRAND_RAMP,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                padding: '0.05em 0.05em 0.12em',
                ...revealStyle,
              }}
            >
              {revealText}
            </div>
          )}
        </div>
      </div>

      {/* Titre : deux moitiés */}
      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, e * 1.6), transform: `translateY(${(1 - e) * 0.25}em)` }}>
        {whole ? (
          <div style={headline}>{text}</div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, opacity: dim }}>
            <div style={{ ...headline, clipPath: `inset(-20% -5% ${100 - cutPct}% -5%)`, transform: `translateY(${-half}px)` }}>{text}</div>
            <div style={{ ...headline, clipPath: `inset(${cutPct}% -5% -20% -5%)`, transform: `translateY(${half}px)` }}>{text}</div>
          </div>
        )}
        {showLine ? (
          <div
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '50%',
              marginTop: -H / 2 + H * cutAt - 1.5,
              height: 3,
              borderRadius: 3,
              background: BRAND_RAMP,
              transform: `scaleX(${lineDraw})`,
              opacity: lineFade * Math.min(1, lineDraw * 3),
              boxShadow: `0 0 18px ${BRAND.violet}`,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
