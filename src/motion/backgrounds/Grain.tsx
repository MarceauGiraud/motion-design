/**
 * <Grain> : grain argentique en surimpression (feTurbulence SVG).
 * La graine change toutes les `refreshEvery` frames : le grain "vit" sans
 * scintiller. Déterministe : la graine est une fonction de la frame.
 */
import { useId, type CSSProperties } from 'react'
import { AbsoluteFill, random, useCurrentFrame } from 'remotion'
import { svgId } from './loop'

export interface GrainProps {
  /** Opacité du grain. 0.04–0.08 = subtil, 0.12+ = marqué. */
  opacity?: number
  /** Finesse du grain (baseFrequency de feTurbulence). Plus grand = plus fin. */
  frequency?: number
  /** Le grain change toutes les N frames (2 = 15 fps de grain, très cinéma). */
  refreshEvery?: number
  /** Mode de fusion. 'overlay' sur fonds moyens, 'multiply' sur papier clair, 'screen' sur nuit. */
  blendMode?: CSSProperties['mixBlendMode']
  /** Graine de base (deux Grain superposés doivent avoir des graines différentes). */
  seed?: string
  style?: CSSProperties
}

export const Grain: React.FC<GrainProps> = ({
  opacity = 0.07,
  frequency = 0.85,
  refreshEvery = 2,
  blendMode = 'overlay',
  seed = 'grain',
  style,
}) => {
  const frame = useCurrentFrame()
  const id = svgId(useId(), 'grain')
  const step = Math.floor(frame / Math.max(1, refreshEvery))
  const turbulenceSeed = Math.floor(random(`${seed}-${step}`) * 1000)
  // Léger décalage de la tuile pour casser toute répétition visible.
  const dx = Math.round(random(`${seed}-dx-${step}`) * 40) - 20
  const dy = Math.round(random(`${seed}-dy-${step}`) * 40) - 20

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: blendMode, opacity, overflow: 'hidden', ...style }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)', transform: `translate(${dx}px, ${dy}px)` }}>
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={3} seed={turbulenceSeed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="1" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  )
}
