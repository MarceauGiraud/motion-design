/** Physique du studio : presets de ressorts + helpers purs + hooks. */
export { SPRINGS, springPreset, type SpringOptions, type SpringPresetName } from './springs'
export { simulateSpring, type SimulateSpringOptions, type SpringState } from './simulate'
export { springMotion, springVelocity, velocityOf } from './velocity'
export { springTimeline, springTimelineMotion, type SpringTimelineOptions, type TimelineStep } from './timeline'
export { stagger, staggerRank, type StaggerFrom, type StaggerOptions } from './stagger'
export { chase, followChain, followThrough, keyTarget, type ChaseKey, type ChaseOptions, type FollowThroughOptions } from './chase'
export { loop, loopNoise, type LoopNoiseOptions, type LoopOptions, type LoopShape } from './loop'
export {
  impactSquash,
  joinFilters,
  motionBlur,
  motionBlurFilter,
  squashStretch,
  stretchTransform,
  type MotionBlurOptions,
  type SquashOptions,
} from './deform'
export {
  useChase,
  useFollowThrough,
  useLoop,
  useLoopNoise,
  useSpringMotion,
  useSpringTimeline,
  useSpringValue,
  type UseSpringValueOptions,
} from './hooks'
