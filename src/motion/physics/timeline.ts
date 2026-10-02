/**
 * springTimeline : enchaîne des étapes de ressort clés sur des frames.
 *
 *   springTimeline(frame, fps, [{ at: 0, to: 1 }, { at: 40, to: 0 }])
 *
 * Superposition additive : chaque étape ajoute (to - toPrécédent) · spring(frame - at).
 * Une étape qui démarre avant que la précédente soit posée l'INTERROMPT sans
 * saut ni cassure de vitesse (comme un vrai objet qu'on relance en vol).
 */
import type { SpringConfig } from 'remotion'
import { springPreset, type SpringPresetName } from './springs'
import type { SpringState } from './simulate'

export interface TimelineStep {
  /** Frame où l'étape démarre. */
  at: number
  /** Valeur visée par l'étape. */
  to: number
  /** Preset propre à l'étape (sinon celui de la timeline). */
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** Force la durée de ce ressort (frames). */
  durationInFrames?: number
}

export interface SpringTimelineOptions {
  /** Valeur avant la première étape. */
  initial?: number
  /** Preset par défaut des étapes. */
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
}

/** Valeur d'une timeline de ressorts à `frame`. */
export function springTimeline(
  frame: number,
  fps: number,
  steps: readonly TimelineStep[],
  { initial = 0, preset = 'smooth', config }: SpringTimelineOptions = {},
): number {
  let value = initial
  let prev = initial
  const sorted = [...steps].sort((a, b) => a.at - b.at)
  for (const s of sorted) {
    const delta = s.to - prev
    prev = s.to
    if (frame < s.at || delta === 0) continue
    const p = springPreset({
      frame,
      fps,
      delay: s.at,
      preset: s.preset ?? preset,
      config: { ...config, ...s.config },
      durationInFrames: s.durationInFrames,
    })
    value += delta * p
  }
  return value
}

/** Valeur + vitesse (par frame) d'une timeline. */
export function springTimelineMotion(
  frame: number,
  fps: number,
  steps: readonly TimelineStep[],
  opts?: SpringTimelineOptions,
): SpringState {
  const value = springTimeline(frame, fps, steps, opts)
  return { value, velocity: value - springTimeline(frame - 1, fps, steps, opts) }
}
