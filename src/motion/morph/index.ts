/** Module "morph" : transitions de forme et magic-move. */
export { ContainerMorph, MagicMove, SharedElement, useMorphState } from './ContainerMorph'
export type { ContainerKeyframe, ContainerMorphProps, MagicMoveProps, SharedElementProps } from './ContainerMorph'
export { CardToWindow, FeatureCard } from './CardToWindow'
export type { CardToWindowProps, FeatureCardProps } from './CardToWindow'
export { ShapeMorph } from './ShapeMorph'
export type { ShapeMorphProps } from './ShapeMorph'
export { MorphBlob } from './MorphBlob'
export type { MorphBlobProps } from './MorphBlob'
export { IconMorph } from './IconMorph'
export type { IconMorphProps } from './IconMorph'
export { LiquidButton } from './LiquidButton'
export type { LiquidButtonProps } from './LiquidButton'

export { centeredRect, evalMorph, elevationShadow, fitScale } from './core'
export type { Rect, MorphStyle, MorphKeyframe, MorphState, ContentFit, ContentAnchor } from './core'
export { buildTrack, evalSlot, evalPresence, morphPath, toPathD, flattenPath, resample } from './path-engine'
export type { MorphTrack, MorphSlot, Pt, Poly } from './path-engine'
export {
  shapePath,
  resolveShape,
  fitPath,
  starPath,
  circlePath,
  roundedRectPath,
  squirclePath,
  blobPath,
  sparklePath,
  LOGO_MARK_PATH,
  SHAPE_NAMES,
} from './shapes'
export type { ShapeName, ShapeInput } from './shapes'
export { ICONS, ICON_NAMES, iconNodeToPaths, resolveIcon } from './icons'
export type { IconName, IconNode, IconInput, IconElement } from './icons'
