/**
 * Static vector logo (inlined paths). Placeholder "ACME": swap logo-paths.ts for your own.
 *  <LogoSymbol height={200} />                 the symbol in the brand gradient
 *  <LogoWordmark height={60} color="#fff" />   the wordmark
 *  <Logo height={80} />                    the full horizontal logo
 */
import { useId, type CSSProperties } from 'react'
import { BRAND } from '../tokens'
import { HORIZ_VIEWBOX, SYMBOL_PATH, SYMBOL_VIEWBOX, WORDMARK_BOX, WORDMARK_LETTERS } from './logo-paths'

export type LogoTheme = 'light' | 'dark'

/** Couleur du lettrage selon le thème du fond. */
export const wordmarkColor = (theme: LogoTheme) => (theme === 'light' ? BRAND.text : '#FFFFFF')

export function safeId(raw: string, prefix: string) {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/**
 * Dégradé du symbole, fidèle au fichier : rose en bas, violet au centre, encre en haut.
 * userSpaceOnUse dans le repère 68 x 104 du symbole.
 */
export const SymbolGradient: React.FC<{ id: string; mono?: string }> = ({ id, mono }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="22" y1="104" x2="46" y2="0">
    <stop offset="0" stopColor={mono ?? BRAND.rose} />
    <stop offset="0.48" stopColor={mono ?? BRAND.violet} />
    <stop offset="0.86" stopColor={mono ?? BRAND.ink} />
  </linearGradient>
)

export interface LogoSymbolProps {
  /** Hauteur en px (largeur déduite : ratio 68/104). */
  height?: number
  /** Couleur unie à la place du dégradé. */
  mono?: string
  style?: CSSProperties
}

export const LogoSymbol: React.FC<LogoSymbolProps> = ({ height = 160, mono, style }) => {
  const gid = safeId(useId(), 'ksym')
  return (
    <svg width={(height * SYMBOL_VIEWBOX.width) / SYMBOL_VIEWBOX.height} height={height} viewBox={`0 0 ${SYMBOL_VIEWBOX.width} ${SYMBOL_VIEWBOX.height}`} style={{ overflow: 'visible', ...style }}>
      <defs>
        <SymbolGradient id={gid} mono={mono} />
      </defs>
      <path d={SYMBOL_PATH} fill={`url(#${gid})`} fillRule="evenodd" />
    </svg>
  )
}

export interface LogoWordmarkProps {
  /** Hauteur des lettres en px (hauteur du "K"). */
  height?: number
  color?: string
  style?: CSSProperties
}

export const LogoWordmark: React.FC<LogoWordmarkProps> = ({ height = 64, color = BRAND.text, style }) => {
  const { x, y, width: w, height: h } = WORDMARK_BOX
  return (
    <svg width={(height * w) / h} height={height} viewBox={`${x} ${y} ${w} ${h}`} style={{ overflow: 'visible', ...style }}>
      <g transform="translate(0 -4)">
        {WORDMARK_LETTERS.map((d, i) => (
          <path key={i} d={d} fill={color} fillRule="evenodd" />
        ))}
      </g>
    </svg>
  )
}

export interface LogoProps {
  /** Hauteur totale en px (hauteur du symbole). */
  height?: number
  theme?: LogoTheme
  /** Couleur du lettrage (défaut selon le thème). */
  color?: string
  /** Couleur unie du symbole (défaut : dégradé). */
  mono?: string
  style?: CSSProperties
}

export const Logo: React.FC<LogoProps> = ({ height = 80, theme = 'light', color, mono, style }) => {
  const gid = safeId(useId(), 'klogo')
  return (
    <svg width={(height * HORIZ_VIEWBOX.width) / HORIZ_VIEWBOX.height} height={height} viewBox={`0 0 ${HORIZ_VIEWBOX.width} ${HORIZ_VIEWBOX.height}`} style={{ overflow: 'visible', ...style }}>
      <defs>
        <SymbolGradient id={gid} mono={mono} />
      </defs>
      <path d={SYMBOL_PATH} fill={`url(#${gid})`} fillRule="evenodd" />
      <g transform="translate(0 -4)">
        {WORDMARK_LETTERS.map((d, i) => (
          <path key={i} d={d} fill={color ?? wordmarkColor(theme)} fillRule="evenodd" />
        ))}
      </g>
    </svg>
  )
}
