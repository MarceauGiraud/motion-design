/**
 * <LightRays> : rayons volumétriques qui tombent d'une source (god rays).
 * Chaque rayon respire (largeur, intensité, angle) sur du bruit bouclé.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { loopNoise, withAlpha, type BackgroundTheme } from './loop'

export interface LightRaysProps {
  theme?: BackgroundTheme
  /** Source des rayons, en fraction de l'écran (peut sortir du cadre). */
  origin?: { x: number; y: number }
  /** Nombre de rayons. */
  count?: number
  /** Ouverture totale de l'éventail, en degrés. */
  spread?: number
  /** Couleur des rayons. Défaut : blanc chaud (sombre) / violet de marque (clair). */
  color?: string
  /** Seconde couleur, alternée (null = une seule couleur). */
  accent?: string | null
  /** Intensité (0–1). */
  intensity?: number
  loopFrames?: number
  /** Fond (null = transparent, à poser sur un autre fond). */
  base?: string | null
  seed?: string
  children?: ReactNode
  style?: CSSProperties
}

export const LightRays: React.FC<LightRaysProps> = ({
  theme = 'dark',
  origin = { x: 0.5, y: -0.12 },
  count = 11,
  spread = 70,
  color,
  accent,
  intensity = 1,
  loopFrames = 450,
  base,
  seed = 'rays',
  children,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const unit = Math.min(width, height) / 1080
  const bg = base === undefined ? (theme === 'light' ? BRAND.paper : BRAND.night) : base
  const c1 = color ?? (theme === 'light' ? BRAND.violet : '#E9E6FF')
  const c2 = accent === undefined ? (theme === 'light' ? BRAND.rose : BRAND.blue) : accent
  const ox = origin.x * width
  const oy = origin.y * height
  const length = Math.hypot(width, height) * 1.2
  const peak = (theme === 'light' ? 0.16 : 0.2) * intensity

  return (
    <AbsoluteFill style={{ background: bg ?? undefined, overflow: 'hidden', ...style }}>
      <AbsoluteFill style={{ filter: `blur(${14 * unit}px)`, mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}>
        {Array.from({ length: count }, (_, i) => {
          const k = count === 1 ? 0.5 : i / (count - 1)
          const jitter = (random(`${seed}-j-${i}`) - 0.5) * (spread / count)
          const sway = loopNoise(`${seed}-sway`, i * 1.9, 0, frame, loopFrames, 0.5) * 4
          const angle = -spread / 2 + k * spread + jitter + sway
          const breath = 0.5 + 0.5 * loopNoise(`${seed}-b`, i * 1.9, 4, frame, loopFrames, 0.9)
          const w = (40 + random(`${seed}-w-${i}`) * 140) * unit * (0.7 + breath * 0.6)
          const col = c2 && i % 3 === 1 ? c2 : c1
          const a = peak * (0.35 + breath * 0.9) * (0.5 + random(`${seed}-a-${i}`) * 0.5)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: ox - w / 2,
                top: oy,
                width: w,
                height: length,
                transformOrigin: '50% 0%',
                transform: `rotate(${angle}deg)`,
                background: `linear-gradient(to bottom, ${withAlpha(col, a * 1.6)} 0%, ${withAlpha(col, a)} 30%, ${withAlpha(col, 0)} 85%)`,
                clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)',
              }}
            />
          )
        })}
      </AbsoluteFill>
      {/* Source : un halo au point d'origine. */}
      <div
        style={{
          position: 'absolute',
          left: ox - width * 0.35,
          top: oy - height * 0.3,
          width: width * 0.7,
          height: height * 0.6,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 50%, ${withAlpha(c1, (theme === 'light' ? 0.18 : 0.35) * intensity)} 0%, transparent 65%)`,
          mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
        }}
      />
      {children}
    </AbsoluteFill>
  )
}
