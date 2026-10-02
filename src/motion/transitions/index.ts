/** API publique du module transitions. */
export {
  springTransition,
  useProgressVelocity,
  remap,
  DEFAULT_TRANSITION_PRESET,
  DEFAULT_TRANSITION_DURATION,
  type SpringDrivenProps,
} from './timing'
export { DirectionalBlur, type DirectionalBlurProps } from './motion-blur'
export {
  brandTransition,
  transitionDuration,
  TRANSITIONS,
  TRANSITION_NAMES,
  type TransitionName,
  type TransitionPropsMap,
  type BrandTransitionOptions,
} from './registry'
export { circleReveal, type CircleRevealProps } from './presentations/circle-reveal'
export { zoomThrough, type ZoomThroughProps } from './presentations/zoom-through'
export { blurDissolve, type BlurDissolveProps } from './presentations/blur-dissolve'
export { liquidWipe, type LiquidWipeProps, type WipeDirection } from './presentations/liquid-wipe'
export { gooeyMorph, type GooeyMorphProps } from './presentations/gooey-morph'
export { splitPanels, type SplitPanelsProps } from './presentations/split-panels'
export { flip3D, type Flip3DProps } from './presentations/flip-3d'
export { cubeRotate, type CubeRotateProps } from './presentations/cube-rotate'
export { slidePush, type SlidePushProps } from './presentations/slide-push'
export { shapeMorphMask, type ShapeMorphMaskProps } from './presentations/shape-morph-mask'
export { gridTiles, type GridTilesProps } from './presentations/grid-tiles'
export { brandRampSweep, type BrandRampSweepProps } from './presentations/brand-ramp-sweep'
export { NightTitleScene, PlatformDemoScene, RampScene, StatScene, PeopleScene, TransitionLabel } from './DemoScenes'
