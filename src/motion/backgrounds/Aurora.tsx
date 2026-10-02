/**
 * <Aurora> : voiles d'aurore dans le dégradé de marque (rose -> violet -> encre).
 * Des bandes larges, floutées, qui ondulent lentement (bruit bouclé).
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP_STOPS } from '../tokens'
import { Grain } from './Grain'
import { loopNoise, withAlpha, type BackgroundTheme } from './loop'

export interface AuroraProps {
  theme?: BackgroundTheme
  /** Couleurs de la rampe des bandes. Défaut : BRAND_RAMP_STOPS. */
  colors?: readonly string[]
  /** Nombre de bandes. */
  bands?: number
  /** Opacité des bandes. Défaut : 0.5 clair, 0.85 sombre. */
  intensity?: number
  /** Hauteur verticale du centre des bandes (0 haut – 1 bas). */
  center?: number
  /** Durée d'une boucle parfaite. */
  loopFrames?: number
  /** Flou en px (à 1080p). */
  blur?: number
  base?: string
  /** Opacité du grain intégré. */
  grain?: number
  seed?: string
  children?: ReactNode
  style?: CSSProperties
}

export const Aurora: React.FC<AuroraProps> = ({
  theme = 'dark',
  colors = BRAND_RAMP_STOPS,
  bands = 4,
  intensity,
  center = 0.4,
  loopFrames = 600,
  blur = 60,
  base,
  grain = 0.05,
  seed = 'aurora',
  children,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const unit = Math.min(width, height) / 1080
  const bg = base ?? (theme === 'light' ? BRAND.paper : BRAND.night)
  const alpha = intensity ?? (theme === 'light' ? 0.5 : 0.85)
  const ramp = (a: number) => {
    const stops = colors.map((c, i) => `${withAlpha(c, a)} ${interpolate(i, [0, colors.length - 1], [18, 82])}%`)
    return `linear-gradient(100deg, transparent 0%, ${stops.join(', ')}, transparent 100%)`
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden', ...style }}>
      <AbsoluteFill style={{ filter: `blur(${blur * unit}px)` }}>
        {Array.from({ length: bands }, (_, i) => {
          const k = i / Math.max(1, bands - 1)
          const n1 = loopNoise(`${seed}-y`, i * 2.3, 0, frame, loopFrames, 0.8)
          const n2 = loopNoise(`${seed}-r`, i * 2.3, 5, frame, loopFrames, 0.6)
          const n3 = loopNoise(`${seed}-x`, i * 2.3, 9, frame, loopFrames, 0.6)
          const n4 = loopNoise(`${seed}-h`, i * 2.3, 13, frame, loopFrames, 0.9)
          const y = (center + (k - 0.5) * 0.34 + n1 * 0.08) * height
          const h = height * (0.14 + random(`${seed}-h-${i}`) * 0.12) * (1 + n4 * 0.35)
          const rot = -14 + random(`${seed}-rot-${i}`) * 20 + n2 * 9
          const skew = n3 * 18
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: -width * 0.3 + n3 * width * 0.08,
                width: width * 1.6,
                top: y - h / 2,
                height: h,
                borderRadius: '50%',
                background: ramp(alpha * (0.55 + 0.45 * random(`${seed}-a-${i}`))),
                transform: `rotate(${rot}deg) skewX(${skew}deg)`,
                mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
              }}
            />
          )
        })}
      </AbsoluteFill>
      {/* Rideaux verticaux très doux : la texture "aurore". */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${theme === 'light' ? 'rgba(255,255,255,0.05)' : 'rgba(7,6,15,0.08)'} 0px, transparent ${18 * unit}px, transparent ${46 * unit}px)`,
          transform: `translateX(${loopNoise(`${seed}-c`, 0, 0, frame, loopFrames, 0.5) * 40 * unit}px)`,
          filter: `blur(${12 * unit}px)`,
          mixBlendMode: 'soft-light',
        }}
      />
      {grain > 0 && <Grain opacity={grain} blendMode={theme === 'light' ? 'multiply' : 'overlay'} seed={`${seed}-grain`} />}
      {children}
    </AbsoluteFill>
  )
}
