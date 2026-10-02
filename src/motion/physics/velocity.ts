/**
 * Vitesse d'un ressort Remotion : dérivée discrète value(f) - value(f-1).
 * Unité : unités de la valeur PAR FRAME. Sert au motion blur, au squash.
 */
import { springPreset, type SpringOptions } from './springs'
import type { SpringState } from './simulate'

/** Dérivée discrète de n'importe quelle courbe pure de la frame. */
export function velocityOf(fn: (frame: number) => number, frame: number): number {
  return fn(frame) - fn(frame - 1)
}

/** Vitesse (par frame) d'un springPreset() aux mêmes options. */
export function springVelocity(opts: SpringOptions): number {
  return springPreset(opts) - springPreset({ ...opts, frame: opts.frame - 1 })
}

/** Valeur + vitesse d'un springPreset() en un seul appel. */
export function springMotion(opts: SpringOptions): SpringState {
  const value = springPreset(opts)
  return { value, velocity: value - springPreset({ ...opts, frame: opts.frame - 1 }) }
}
