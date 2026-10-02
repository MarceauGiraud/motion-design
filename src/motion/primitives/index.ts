/** Primitives de mouvement : apparitions, vagues, flottement, présence, parallaxe, gélatine. */
export { Presence, Reveal, usePresence, type PresenceProps, type PresenceState, type RevealProps, type UsePresenceOptions } from './Presence'
export { Stagger, type StaggerProps } from './Stagger'
export { Float, floatOffset, type FloatProps } from './Float'
export { SpringBox, springBoxState, type BoxState, type SpringBoxProps, type SpringBoxStep } from './SpringBox'
export {
  Parallax,
  ParallaxLayer,
  useParallaxCamera,
  type CameraPose,
  type ParallaxCamera,
  type ParallaxLayerProps,
  type ParallaxProps,
} from './Parallax'
export { Magnet, Wobble, impulse, type MagnetProps, type MagnetSnap, type WobbleProps } from './Jelly'
export {
  mergeStyle,
  revealStyle,
  REVEAL_VARIANTS,
  VARIANT_DISTANCE,
  VARIANT_PRESET,
  type RevealStyleOptions,
  type RevealStyles,
  type RevealVariant,
} from './variants'
