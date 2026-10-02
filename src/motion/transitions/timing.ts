/**
 * Timings à ressort + utilitaires partagés par toutes les présentations.
 *
 * Une présentation ne reçoit que `presentationProgress` (0→1). Pour lier le flou
 * de mouvement à la VITESSE du ressort, on rééchantillonne la même courbe
 * (preset + durée) et on retrouve la vitesse au point courant.
 */
import { useMemo } from 'react'
import { interpolate, useVideoConfig } from 'remotion'
import { springTiming, type TransitionTiming } from '@remotion/transitions'
import { SPRINGS, springPreset, type SpringPresetName } from '../physics/springs'
import type { SpringConfig } from 'remotion'

/** Preset par défaut des transitions : précis, sans flottement final. */
export const DEFAULT_TRANSITION_PRESET: SpringPresetName = 'morph'
/** Durée par défaut d'une transition (frames @30fps). */
export const DEFAULT_TRANSITION_DURATION = 30

/**
 * Timing à ressort pour <TransitionSeries.Transition timing={…} />.
 * @param preset nom du preset de src/motion/physics/springs.ts
 * @param durationInFrames durée exacte (le ressort est étiré pour tenir dedans)
 * @param config petit override optionnel du preset
 */
export function springTransition(
  preset: SpringPresetName = DEFAULT_TRANSITION_PRESET,
  durationInFrames: number = DEFAULT_TRANSITION_DURATION,
  config?: Partial<SpringConfig>,
): TransitionTiming {
  return {
    getDurationInFrames: () => durationInFrames,
    getProgress: ({ frame, fps }) => transitionProgressAt(frame, fps, preset, durationInFrames, config),
  }
}

/**
 * Progression du ressort normalisée pour valoir EXACTEMENT 1 à la dernière
 * frame de la transition (un springTiming brut s'arrête vers 0.995, ce qui
 * provoque un petit saut quand la présentation se démonte).
 */
export function transitionProgressAt(
  frame: number,
  fps: number,
  preset: SpringPresetName,
  durationInFrames: number,
  config?: Partial<SpringConfig>,
): number {
  const last = Math.max(1, durationInFrames - 1)
  if (frame >= last) return 1
  if (frame <= 0) return 0
  const at = (f: number) => springPreset({ frame: f, fps, preset, config, durationInFrames: last })
  return at(frame) / at(last)
}

/** Le springTiming brut de @remotion/transitions, si on préfère son comportement. */
export const rawSpringTiming = (preset: SpringPresetName, durationInFrames: number) =>
  springTiming({ config: SPRINGS[preset], durationInFrames })

/** Props communes à toutes les présentations du kit. */
export interface SpringDrivenProps extends Record<string, unknown> {
  /** Preset du timing associé : sert à retrouver la vitesse pour le flou de mouvement. */
  preset?: SpringPresetName
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Remappe la progression (du ressort) d'une plage vers une autre, clampée. */
export const remap = (p: number, input: [number, number], output: [number, number] = [0, 1]) =>
  interpolate(p, input, output, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

/**
 * Vitesse (unités de progression / frame) du ressort au point `progress`.
 * Retrouve la frame par première traversée de la courbe échantillonnée.
 */
export function useProgressVelocity(
  progress: number,
  durationInFrames: number,
  preset: SpringPresetName = DEFAULT_TRANSITION_PRESET,
): number {
  const { fps } = useVideoConfig()
  const curve = useMemo(() => {
    const out: number[] = []
    for (let t = 0; t <= durationInFrames + 1; t++) {
      out.push(transitionProgressAt(t, fps, preset, durationInFrames))
    }
    return out
  }, [durationInFrames, fps, preset])

  if (progress <= 0 || progress >= 1) return 0
  for (let t = 0; t < curve.length - 1; t++) {
    if (curve[t + 1] >= progress) {
      return Math.max(0, curve[t + 1] - curve[t])
    }
  }
  return 0
}

/** Identifiant DOM sûr pour url(#…) (useId de React contient des ':'). */
export const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')
