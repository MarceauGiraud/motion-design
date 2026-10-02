/**
 * <Float> : flottement d'idle, bouclé sans couture sur `period` frames.
 * Somme de deux harmoniques à phases graines : jamais deux objets synchrones.
 *
 *   <Float amplitude={14} seed="icon-3"><Icon /></Float>
 */
import type { CSSProperties, ReactNode } from 'react'
import { random, useCurrentFrame } from 'remotion'

export interface FloatProps {
  children?: ReactNode
  /** Amplitude verticale (px). Défaut 12. */
  amplitude?: number
  /** Amplitude horizontale (px). Défaut amplitude · 0.45. */
  drift?: number
  /** Amplitude de rotation (deg). Défaut 1.6. */
  rotate?: number
  /** Respiration d'échelle (0.02 = ±2 %). Défaut 0. */
  breathe?: number
  /** Période de boucle (frames). La vidéo boucle si sa durée en est un multiple. Défaut 150. */
  period?: number
  /** Graine des phases (deux Float de même graine bougent ensemble). */
  seed?: string | number
  /** Ombre portée qui s'adoucit quand l'objet monte (px de flou de base, 0 = aucune). */
  shadow?: number
  display?: CSSProperties['display']
  style?: CSSProperties
  className?: string
}

/** Offset {x, y, rotate, scale} d'un flottement bouclé, fonction pure. */
export function floatOffset(
  frame: number,
  { amplitude = 12, drift, rotate = 1.6, breathe = 0, period = 150, seed = 'float' }: Omit<FloatProps, 'children' | 'style' | 'className' | 'display' | 'shadow'> = {},
): { x: number; y: number; rotate: number; scale: number } {
  const t = (frame / period) * Math.PI * 2
  const ph = (k: string) => random(`${seed}-${k}`) * Math.PI * 2
  const dx = drift ?? amplitude * 0.45
  // Harmoniques entières (1 et 2) : la boucle raccorde exactement.
  const y = Math.sin(t + ph('y')) * amplitude * 0.8 + Math.sin(2 * t + ph('y2')) * amplitude * 0.2
  const x = Math.cos(t + ph('x')) * dx
  const r = Math.sin(t + ph('r')) * rotate
  const s = 1 + Math.sin(t + ph('s')) * breathe
  return { x, y, rotate: r, scale: s }
}

export function Float({ children, shadow = 0, display = 'inline-block', style, className, ...opts }: FloatProps) {
  const frame = useCurrentFrame()
  const o = floatOffset(frame, opts)
  const amp = opts.amplitude ?? 12
  const lift = amp > 0 ? (-o.y / amp + 1) / 2 : 0.5 // 0 bas, 1 haut
  return (
    <div
      className={className}
      style={{
        display,
        transform: `translate(${o.x}px, ${o.y}px) rotate(${o.rotate}deg) scale(${o.scale})`,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow * (0.5 + lift * 0.6)}px ${shadow * (1 + lift)}px rgba(16,15,14,${0.16 - lift * 0.06}))` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
