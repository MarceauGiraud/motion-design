/**
 * Registre des transitions : un nom -> (presentation, preset & durée par défaut).
 *
 *   <TransitionSeries.Transition {...brandTransition('liquidWipe', { direction: 'up' })} />
 *
 * `brandTransition` renvoie { timing, presentation } avec le MÊME preset des deux
 * côtés, pour que le flou de mouvement suive la vraie vitesse du ressort.
 */
import type { TransitionPresentation, TransitionTiming } from '@remotion/transitions'
import type { SpringPresetName } from '../physics/springs'
import { springTransition } from './timing'
import { blurDissolve, type BlurDissolveProps } from './presentations/blur-dissolve'
import { brandRampSweep, type BrandRampSweepProps } from './presentations/brand-ramp-sweep'
import { circleReveal, type CircleRevealProps } from './presentations/circle-reveal'
import { cubeRotate, type CubeRotateProps } from './presentations/cube-rotate'
import { flip3D, type Flip3DProps } from './presentations/flip-3d'
import { gooeyMorph, type GooeyMorphProps } from './presentations/gooey-morph'
import { gridTiles, type GridTilesProps } from './presentations/grid-tiles'
import { liquidWipe, type LiquidWipeProps } from './presentations/liquid-wipe'
import { shapeMorphMask, type ShapeMorphMaskProps } from './presentations/shape-morph-mask'
import { slidePush, type SlidePushProps } from './presentations/slide-push'
import { splitPanels, type SplitPanelsProps } from './presentations/split-panels'
import { zoomThrough, type ZoomThroughProps } from './presentations/zoom-through'

export interface TransitionPropsMap {
  circleReveal: CircleRevealProps
  zoomThrough: ZoomThroughProps
  blurDissolve: BlurDissolveProps
  liquidWipe: LiquidWipeProps
  gooeyMorph: GooeyMorphProps
  splitPanels: SplitPanelsProps
  flip3D: Flip3DProps
  cubeRotate: CubeRotateProps
  slidePush: SlidePushProps
  shapeMorphMask: ShapeMorphMaskProps
  gridTiles: GridTilesProps
  brandRampSweep: BrandRampSweepProps
}

export type TransitionName = keyof TransitionPropsMap

interface Entry<K extends TransitionName> {
  make: (props: TransitionPropsMap[K]) => TransitionPresentation<TransitionPropsMap[K]>
  preset: SpringPresetName
  durationInFrames: number
  /** Une phrase, pour le catalogue. */
  label: string
}

export const TRANSITIONS: { [K in TransitionName]: Entry<K> } = {
  circleReveal: { make: circleReveal, preset: 'heavy', durationInFrames: 34, label: 'Iris from a point, brand-ramp rim' },
  zoomThrough: { make: zoomThrough, preset: 'heavy', durationInFrames: 30, label: 'Fly through, next scene arrives from depth' },
  blurDissolve: { make: blurDissolve, preset: 'smooth', durationInFrames: 28, label: 'Focus-pull dissolve' },
  liquidWipe: { make: liquidWipe, preset: 'heavy', durationInFrames: 36, label: 'Organic wavy front led by a brand wave' },
  gooeyMorph: { make: gooeyMorph, preset: 'heavy', durationInFrames: 40, label: 'Metaball blob grows and swallows droplets' },
  splitPanels: { make: splitPanels, preset: 'morph', durationInFrames: 34, label: 'Staggered panels with speed blur' },
  flip3D: { make: flip3D, preset: 'morph', durationInFrames: 36, label: 'Card flip in perspective' },
  cubeRotate: { make: cubeRotate, preset: 'heavy', durationInFrames: 36, label: 'Cube rotation with camera pull-back' },
  slidePush: { make: slidePush, preset: 'morph', durationInFrames: 26, label: 'Parallax push with directional blur' },
  shapeMorphMask: { make: shapeMorphMask, preset: 'heavy', durationInFrames: 40, label: 'Circle to card to full-screen mask' },
  gridTiles: { make: gridTiles, preset: 'morph', durationInFrames: 38, label: 'Tiles flip in as a wave' },
  brandRampSweep: { make: brandRampSweep, preset: 'heavy', durationInFrames: 30, label: 'Brand gradient band sweeps across' },
}

export const TRANSITION_NAMES = Object.keys(TRANSITIONS) as TransitionName[]

export type BrandTransitionOptions<K extends TransitionName> = TransitionPropsMap[K] & {
  /** Preset du ressort (défaut : celui du registre). */
  preset?: SpringPresetName
  /** Durée en frames (défaut : celle du registre). */
  durationInFrames?: number
}

/**
 * { timing, presentation } prêts à étaler dans <TransitionSeries.Transition />.
 * Preset et durée synchronisés entre timing et presentation.
 */
export function brandTransition<K extends TransitionName>(
  name: K,
  options: BrandTransitionOptions<K> = {} as BrandTransitionOptions<K>,
): { timing: TransitionTiming; presentation: TransitionPresentation<TransitionPropsMap[K]> } {
  const entry = TRANSITIONS[name] as Entry<K>
  const { durationInFrames, ...rest } = options
  const preset = options.preset ?? entry.preset
  const props = { ...rest, preset } as TransitionPropsMap[K]
  return {
    timing: springTransition(preset, durationInFrames ?? entry.durationInFrames),
    presentation: entry.make(props),
  }
}

/** Durée (frames) qu'aura la transition, pour calculer la longueur d'une composition. */
export function transitionDuration<K extends TransitionName>(name: K, options?: { durationInFrames?: number }): number {
  return options?.durationInFrames ?? TRANSITIONS[name].durationInFrames
}
