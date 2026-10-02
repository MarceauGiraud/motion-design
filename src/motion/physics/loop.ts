/**
 * Boucles parfaitement raccordées : loop(frame + period) === loop(frame).
 * Linéaires par nature (oscillations d'idle), donc pas de ressort ici.
 */
import { noise3D } from '@remotion/noise'

export type LoopShape = 'sine' | 'triangle' | 'bounce' | 'breathe'

export interface LoopOptions {
  /** Période en frames. */
  period?: number
  /** Amplitude (la sortie va de -amplitude à +amplitude ; 'bounce' de 0 à amplitude). */
  amplitude?: number
  /** Déphasage en fraction de période (0..1). */
  phase?: number
  shape?: LoopShape
}

/** Oscillation périodique pure. */
export function loop(frame: number, { period = 90, amplitude = 1, phase = 0, shape = 'sine' }: LoopOptions = {}): number {
  const t = (((frame / period + phase) % 1) + 1) % 1
  switch (shape) {
    case 'sine':
      return Math.sin(t * Math.PI * 2) * amplitude
    case 'triangle':
      // Même phase que sine : 0 -> +1 -> 0 -> -1.
      return (1 - 4 * Math.abs(((t + 0.25) % 1) - 0.5)) * amplitude
    case 'bounce':
      // Rebond de balle : |sin|, contact dur en bas, apex arrondi.
      return Math.abs(Math.sin(t * Math.PI)) * amplitude
    case 'breathe':
      // Inspiration plus longue que l'expiration, raccord C1.
      return (Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5 + 0.12 * Math.sin(t * Math.PI * 4)) * 2 * amplitude - amplitude
  }
}

export interface LoopNoiseOptions {
  period?: number
  amplitude?: number
  seed?: string | number
  /** Rugosité : rayon du cercle parcouru dans l'espace de bruit (0.5 doux, 2 nerveux). */
  roughness?: number
}

/**
 * Bruit organique qui boucle : on parcourt un cercle dans l'espace de bruit 3D.
 * Sortie dans ~[-amplitude, amplitude].
 */
export function loopNoise(frame: number, { period = 150, amplitude = 1, seed = 'loop', roughness = 0.8 }: LoopNoiseOptions = {}): number {
  const a = (frame / period) * Math.PI * 2
  return noise3D(seed, Math.cos(a) * roughness, Math.sin(a) * roughness, 0) * amplitude
}
