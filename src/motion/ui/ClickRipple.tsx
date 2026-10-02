/**
 * Onde de clic : disque plein qui s'efface + anneau qui s'étend, en ressort.
 */
import type { CSSProperties } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset } from '../physics/springs'
import { BRAND } from '../tokens'

export interface ClickRippleProps {
  /** Frame du clic. */
  at: number
  /** Centre (px, repère du conteneur). */
  x: number
  y: number
  /** Couleur. Défaut BRAND.blue. */
  color?: string
  /** Rayon final de l'anneau (px). Defaut 34. */
  size?: number
  style?: CSSProperties
}

/** Onde de clic ponctuelle, invisible hors de sa fenêtre de ~24 frames. */
export function ClickRipple({ at, x, y, color = BRAND.blue, size = 34, style }: ClickRippleProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - at
  if (local < 0 || local > 40) return null
  const ring = springPreset({ frame, fps, preset: 'smooth', delay: at, durationInFrames: 26 })
  const disc = springPreset({ frame, fps, preset: 'snappy', delay: at })
  const ringOpacity = interpolate(ring, [0, 0.15, 1], [0, 0.9, 0], { extrapolateRight: 'clamp' })
  const discOpacity = interpolate(local, [0, 3, 16], [0, 0.28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const r = size * (0.25 + 0.75 * ring)
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none', zIndex: 999, ...style }}>
      <div
        style={{
          position: 'absolute',
          left: -size * 0.55 * disc,
          top: -size * 0.55 * disc,
          width: size * 1.1 * disc,
          height: size * 1.1 * disc,
          borderRadius: '50%',
          background: color,
          opacity: discOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -r,
          top: -r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `${2.5 * (1 - ring * 0.5)}px solid ${color}`,
          opacity: ringOpacity,
        }}
      />
    </div>
  )
}
