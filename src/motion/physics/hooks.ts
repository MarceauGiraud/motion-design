/**
 * Sucre React : les helpers physiques branchés sur useCurrentFrame()/useVideoConfig().
 * Tous relatifs à la <Sequence> englobante.
 */
import type { SpringConfig } from 'remotion'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { chase, followThrough, type ChaseKey } from './chase'
import { loop, loopNoise, type LoopNoiseOptions, type LoopOptions } from './loop'
import type { SpringState } from './simulate'
import { springPreset, type SpringPresetName } from './springs'
import { springTimeline, type SpringTimelineOptions, type TimelineStep } from './timeline'

export interface UseSpringValueOptions {
  /** Frame de départ (relative à la Sequence). */
  delay?: number
  from?: number
  to?: number
  config?: Partial<SpringConfig>
  durationInFrames?: number
  reverse?: boolean
}

/** Valeur d'un ressort preset à la frame courante. `useSpringValue('snappy', { delay: 10 })`. */
export function useSpringValue(preset: SpringPresetName = 'smooth', opts: UseSpringValueOptions = {}): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return springPreset({ frame, fps, preset, ...opts })
}

/** Valeur + vitesse (par frame) d'un ressort preset. */
export function useSpringMotion(preset: SpringPresetName = 'smooth', opts: UseSpringValueOptions = {}): SpringState {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const value = springPreset({ frame, fps, preset, ...opts })
  return { value, velocity: value - springPreset({ frame: frame - 1, fps, preset, ...opts }) }
}

/** Timeline de ressorts : `useSpringTimeline([{ at: 0, to: 1 }, { at: 60, to: 0 }])`. */
export function useSpringTimeline(steps: readonly TimelineStep[], opts?: SpringTimelineOptions): SpringState {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const value = springTimeline(frame, fps, steps, opts)
  return { value, velocity: value - springTimeline(frame - 1, fps, steps, opts) }
}

/** Poursuite physique de keyframes (critique par défaut). */
export function useChase(keys: readonly ChaseKey[], opts: { preset?: SpringPresetName; config?: Partial<SpringConfig>; glide?: boolean } = {}): SpringState {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return chase({ frame, fps, keys, ...opts })
}

/** Mouvement secondaire suivant une courbe primaire. */
export function useFollowThrough(
  driver: (frame: number) => number,
  opts: { lag?: number; preset?: SpringPresetName; config?: Partial<SpringConfig> } = {},
): SpringState {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return followThrough({ frame, fps, driver, ...opts })
}

/** Oscillation bouclée parfaite à la frame courante. */
export function useLoop(opts: LoopOptions = {}): number {
  return loop(useCurrentFrame(), opts)
}

/** Bruit organique bouclé à la frame courante. */
export function useLoopNoise(opts: LoopNoiseOptions = {}): number {
  return loopNoise(useCurrentFrame(), opts)
}
