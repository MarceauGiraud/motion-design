/**
 * <Watermark> : logo discret dans un coin, pour toute la durée d'une vidéo.
 * Entrée douce (ressort 'gentle'), opacité basse.
 */
import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset } from '../physics/springs'
import { Logo, LogoSymbol, type LogoTheme } from './Logo'

export interface WatermarkProps {
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** 'symbol' = boucle seule ; 'horizontal' = boucle + Acme. */
  lockup?: 'symbol' | 'horizontal'
  /** Hauteur en px (à 1080p). */
  size?: number
  /** Opacité finale. */
  opacity?: number
  theme?: LogoTheme
  /** Symbole en couleur unie (ex. '#FFFFFF') au lieu du dégradé. */
  mono?: string
  /** Marge au bord en px (à 1080p). */
  margin?: number
  delay?: number
  style?: CSSProperties
}

export const Watermark: React.FC<WatermarkProps> = ({
  corner = 'bottom-right',
  lockup = 'horizontal',
  size = 40,
  opacity = 0.8,
  theme = 'light',
  mono,
  margin = 56,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const u = Math.min(width, height) / 1080
  const p = springPreset({ frame, fps, preset: 'gentle', delay })
  const m = margin * u
  const pos: CSSProperties = {
    ...(corner.startsWith('top') ? { top: m } : { bottom: m }),
    ...(corner.endsWith('left') ? { left: m } : { right: m }),
  }
  return (
    <div style={{ position: 'absolute', ...pos, opacity: opacity * p, transform: `translateY(${(1 - p) * 10 * u}px)`, ...style }}>
      {lockup === 'horizontal' ? <Logo height={size * u} theme={theme} mono={mono} /> : <LogoSymbol height={size * u} mono={mono} />}
    </div>
  )
}
