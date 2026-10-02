/**
 * Intégrateur de ressort déterministe : un ressort amorti qui POURSUIT une
 * cible arbitraire (fonction de la frame). Remotion `spring()` ne sait aller
 * que d'un point A à un point B ; ici la cible peut bouger, sauter, osciller.
 *
 * Pur : la valeur à la frame N est recalculée depuis `startFrame` à chaque
 * rendu (O(N · substeps), négligeable pour quelques milliers de frames).
 */
import type { SpringConfig } from 'remotion'
import { SPRINGS, type SpringPresetName } from './springs'

export interface SpringState {
  /** Position à la frame demandée. */
  value: number
  /** Vitesse en unités PAR FRAME (même unité que value(f) - value(f-1)). */
  velocity: number
}

export interface SimulateSpringOptions {
  frame: number
  fps: number
  /** Cible suivie, échantillonnée à des frames (éventuellement fractionnaires). */
  target: (frame: number) => number
  preset?: SpringPresetName
  /** Petite surcharge du preset (ex. { mass: 1.2 }). */
  config?: Partial<SpringConfig>
  /** Position initiale. Défaut : target(startFrame). */
  from?: number
  /** Vitesse initiale (unités par frame). */
  initialVelocity?: number
  /** Frame où la simulation démarre. */
  startFrame?: number
  /** Sous-pas d'intégration par frame (stabilité). */
  substeps?: number
}

/** Simule un ressort amorti qui suit `target`. Retourne position + vitesse. */
export function simulateSpring({
  frame,
  fps,
  target,
  preset = 'smooth',
  config,
  from,
  initialVelocity = 0,
  startFrame = 0,
  substeps = 4,
}: SimulateSpringOptions): SpringState {
  const { mass, damping, stiffness } = { ...SPRINGS[preset], ...config }
  let x = from ?? target(startFrame)
  let v = initialVelocity * fps // unités / seconde
  if (frame <= startFrame) return { value: x, velocity: initialVelocity }

  const dt = 1 / (fps * substeps)
  const whole = Math.floor(frame - startFrame)
  const rest = frame - startFrame - whole
  const step = (t: number) => {
    // Euler semi-implicite : stable et symplectique.
    const a = (-stiffness * (x - target(t)) - damping * v) / mass
    v += a * dt
    x += v * dt
  }
  for (let f = 0; f < whole; f++) {
    for (let s = 0; s < substeps; s++) step(startFrame + f + s / substeps)
  }
  // Frame fractionnaire (motion blur Remotion, time remapping).
  const extra = Math.round(rest * substeps)
  for (let s = 0; s < extra; s++) step(startFrame + whole + s / substeps)

  return { value: x, velocity: v / fps }
}
