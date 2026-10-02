/**
 * <RevealWords> : texte qui monte mot par mot depuis un masque, avec flou de
 * mouvement vertical proportionnel à la vitesse du ressort. Utilisé par les
 * cartes de marque (EndCard, TitleCard, LowerThird).
 */
import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'

export interface RevealWordsProps {
  text: string
  /** Frame de départ du premier mot. */
  delay?: number
  /** Frames entre deux mots. */
  stagger?: number
  preset?: SpringPresetName
  /** Mots (sans ponctuation, insensible à la casse) peints avec `highlightStyle`. */
  highlight?: string[]
  highlightStyle?: CSSProperties
  /** Frame (absolue) de sortie : les mots redescendent. */
  exitAt?: number
  style?: CSSProperties
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

export const RevealWords: React.FC<RevealWordsProps> = ({ text, delay = 0, stagger = 3, preset = 'morph', highlight = [], highlightStyle, exitAt, style }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.split(' ')
  const hl = new Set(highlight.map(norm))
  return (
    <span style={{ display: 'inline', ...style }}>
      {words.map((w, i) => {
        const at = delay + i * stagger
        const p = springPreset({ frame, fps, preset, delay: at })
        const pPrev = springPreset({ frame: frame - 1, fps, preset, delay: at })
        const out = exitAt === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: exitAt + i * 1.5, durationInFrames: 18 })
        const y = (1 - p) * 105 - out * 105
        const blur = Math.min(10, Math.abs(p - pPrev) * 60)
        const isHl = hl.has(norm(w))
        return (
          <span key={i}>
            <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.08em 0.04em 0.16em', margin: '-0.08em -0.04em -0.16em' }}>
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateY(${y}%)`,
                  filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
                  ...(isHl ? highlightStyle : null),
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </span>
        )
      })}
    </span>
  )
}
