/**
 * <PaperBackground> : le fond clair du website. Papier chaud #F4F2F0,
 * vignette discrète, une lumière douce qui glisse lentement, grain léger.
 * C'est le fond PAR DÉFAUT des vidéos.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { Grain } from './Grain'
import { loopAngle, withAlpha } from './loop'

export interface PaperBackgroundProps {
  /** Couleur du papier. */
  color?: string
  /** Force de la vignette (0 = aucune, 1 = marquée). */
  vignette?: number
  /** Lumière douce qui dérive (0 = aucune). */
  light?: number
  /** Opacité du grain (0 = aucun). */
  grain?: number
  /** Teinte de marque très légère dans un coin (0 = aucune). Rappelle le halo du site. */
  tint?: number
  loopFrames?: number
  children?: ReactNode
  style?: CSSProperties
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  color = BRAND.paper,
  vignette = 0.5,
  light = 0.7,
  grain = 0.045,
  tint = 0,
  loopFrames = 600,
  children,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const a = loopAngle(frame, loopFrames)
  const lx = 38 + Math.cos(a) * 12
  const ly = 28 + Math.sin(a) * 8

  return (
    <AbsoluteFill style={{ background: color, overflow: 'hidden', ...style }}>
      {light > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${width * 0.7}px ${height * 0.7}px at ${lx}% ${ly}%, ${withAlpha('#FFFFFF', 0.75 * light)} 0%, ${withAlpha('#FFFFFF', 0)} 100%)`,
          }}
        />
      )}
      {tint > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${width * 0.55}px ${height * 0.55}px at ${100 - lx * 0.5}% ${100 - ly * 0.4}%, ${withAlpha(BRAND.violet, 0.07 * tint)} 0%, ${withAlpha(BRAND.rose, 0.03 * tint)} 45%, transparent 100%)`,
          }}
        />
      )}
      {vignette > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 75% 75% at 50% 48%, transparent 55%, ${withAlpha(BRAND.text, 0.09 * vignette)} 100%)`,
          }}
        />
      )}
      {grain > 0 && <Grain opacity={grain} blendMode="multiply" seed="paper-grain" frequency={0.9} />}
      {children}
    </AbsoluteFill>
  )
}
