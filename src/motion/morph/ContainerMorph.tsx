/**
 * <ContainerMorph> : un conteneur qui morphe entre N mises en page keyées
 * (position, taille, rayon, fond, bordure, élévation) avec le ressort `morph`.
 * Le contenu de chaque keyframe est dessiné à SA taille native puis mis à
 * l'échelle (FLIP, jamais déformé) et cross-fadé avec un flou.
 *
 * <MagicMove> et <SharedElement> sont deux raccourcis construits dessus.
 */
import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { SpringPresetName } from '../physics/springs'
import {
  anchorOffset,
  elevationShadow,
  evalMorph,
  fitScale,
  morphSpeed,
  motionBlurFromSpeed,
  type ContentAnchor,
  type ContentFit,
  type MorphKeyframe,
  type MorphState,
  type MorphStyle,
  type Rect,
} from './core'

export interface ContainerKeyframe extends MorphKeyframe {
  /** Contenu propre à cet état, cross-fadé (flou) avec les autres. */
  content?: ReactNode
  /** Taille native du contenu (défaut : rect de la keyframe). */
  contentSize?: { width: number; height: number }
  contentFit?: ContentFit
  contentAnchor?: ContentAnchor
}

export interface ContainerMorphProps {
  /** Au moins une keyframe. La 1re est l'état initial (son `at` est ignoré). */
  keyframes: ContainerKeyframe[]
  /** Contenu persistant (visible dans tous les états), mis à l'échelle FLIP. */
  children?: ReactNode
  /** Taille native du contenu persistant. Défaut : rect de la dernière keyframe. */
  childrenSize?: { width: number; height: number }
  /** Ajustement par défaut des contenus. Défaut 'contain'. */
  fit?: ContentFit
  /** Ancrage par défaut des contenus. Défaut 'center'. */
  anchor?: ContentAnchor
  /** Preset par défaut des transitions. Défaut 'morph'. */
  preset?: SpringPresetName
  /** Intensité du flou de mouvement (0 = aucun). Défaut 1. */
  motionBlur?: number
  /** Flou max (px) du contenu pendant le cross-fade. Défaut 14. */
  contentBlur?: number
  /** Couche libre dessinée au-dessus du fond, sous le contenu (reçoit l'état). */
  underlay?: (state: MorphState) => ReactNode
  /** Couche libre dessinée derrière le conteneur (halo, lueur…), hors du clip. */
  backdrop?: (state: MorphState) => ReactNode
  style?: CSSProperties
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)

/** Hook : état du morph à la frame courante + à la frame précédente (vitesse). */
export function useMorphState(keyframes: MorphKeyframe[], preset: SpringPresetName = 'morph') {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const state = evalMorph(keyframes, frame, fps, preset)
  const prev = evalMorph(keyframes, frame - 1, fps, preset)
  return { state, speed: morphSpeed(state, prev) }
}

function ScaledLayer({
  native,
  box,
  fit,
  anchor,
  opacity,
  blur,
  lift,
  children,
}: {
  native: { width: number; height: number }
  box: { width: number; height: number }
  fit: ContentFit
  anchor: ContentAnchor
  opacity: number
  blur: number
  lift: number
  children: ReactNode
}) {
  if (opacity <= 0.001) return null
  const s = fitScale(fit, native, box) * lift
  const scaled = { width: native.width * s, height: native.height * s }
  const { left, top } = anchorOffset(anchor, scaled, box)
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: native.width,
        height: native.height,
        transform: `scale(${s})`,
        transformOrigin: 'top left',
        opacity,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {children}
    </div>
  )
}

export function ContainerMorph({
  keyframes,
  children,
  childrenSize,
  fit = 'contain',
  anchor = 'center',
  preset = 'morph',
  motionBlur = 1,
  contentBlur = 14,
  underlay,
  backdrop,
  style,
}: ContainerMorphProps) {
  const { state, speed } = useMorphState(keyframes, preset)
  const { rect } = state
  const blur = motionBlurFromSpeed(speed, motionBlur)
  const box = { width: rect.width, height: rect.height }
  const border = `inset 0 0 0 1px ${state.borderColor}`
  const shadow = elevationShadow(state.elevation)

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: state.opacity,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {backdrop?.(state)}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: state.radius,
          background: state.background,
          boxShadow: shadow === 'none' ? border : `${shadow}, ${border}`,
          overflow: 'hidden',
          // Clip des coins fiable même avec des enfants transformés.
          isolation: 'isolate',
        }}
      >
        {underlay?.(state)}
        {keyframes.map((k, i) =>
          k.content === undefined ? null : (
            <ScaledLayer
              key={i}
              native={k.contentSize ?? { width: k.rect.width, height: k.rect.height }}
              box={box}
              fit={k.contentFit ?? fit}
              anchor={k.contentAnchor ?? anchor}
              opacity={smooth(clamp01((state.weights[i] - 0.42) / 0.58))}
              blur={(1 - state.weights[i]) ** 2 * contentBlur}
              lift={0.94 + 0.06 * state.weights[i]}
            >
              {k.content}
            </ScaledLayer>
          )
        )}
        {children !== undefined && (
          <ScaledLayer
            native={childrenSize ?? { width: keyframes[keyframes.length - 1].rect.width, height: keyframes[keyframes.length - 1].rect.height }}
            box={box}
            fit={fit}
            anchor={anchor}
            opacity={1}
            blur={0}
            lift={1}
          >
            {children}
          </ScaledLayer>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MagicMove : deux états, deux contenus.
// ---------------------------------------------------------------------------

export interface MagicMoveProps extends Omit<ContainerMorphProps, 'keyframes'> {
  /** État de départ. */
  from: MorphStyle
  /** État d'arrivée. */
  to: MorphStyle
  /** Frame où le morph démarre. Défaut 20. */
  at?: number
  /** Contenu de l'état de départ (dessiné à la taille de `from.rect`). */
  fromContent?: ReactNode
  /** Contenu de l'état d'arrivée (dessiné à la taille de `to.rect`). */
  toContent?: ReactNode
  /** Frame de retour vers `from` (aller-retour). Optionnel. */
  returnAt?: number
}

export function MagicMove({ from, to, at = 20, fromContent, toContent, returnAt, ...rest }: MagicMoveProps) {
  const keyframes: ContainerKeyframe[] = [
    { ...from, at: 0, content: fromContent },
    { ...to, at, content: toContent },
  ]
  if (returnAt !== undefined) keyframes.push({ ...from, at: returnAt, content: fromContent })
  return <ContainerMorph keyframes={keyframes} {...rest} />
}

// ---------------------------------------------------------------------------
// SharedElement : un même élément voyage d'un rect à l'autre.
// ---------------------------------------------------------------------------

export interface SharedElementProps extends Omit<ContainerMorphProps, 'keyframes' | 'children'> {
  /** Rect + style de départ. */
  from: MorphStyle
  /** Rect + style d'arrivée. */
  to: MorphStyle
  /** Frame de départ du voyage. Défaut 20. */
  at?: number
  /** Étapes supplémentaires (au-delà de `to`). */
  then?: MorphKeyframe[]
  /** L'élément partagé, dessiné à `contentSize` (défaut : taille de `to.rect`). */
  children: ReactNode
  contentSize?: { width: number; height: number }
}

/** L'élément garde son identité (pas de cross-fade) : seul son cadre morphe, son contenu est contre-mis à l'échelle. */
export function SharedElement({ from, to, at = 20, then = [], children, contentSize, fit = 'contain', ...rest }: SharedElementProps) {
  return (
    <ContainerMorph keyframes={[{ ...from, at: 0 }, { ...to, at }, ...then]} childrenSize={contentSize ?? { width: to.rect.width, height: to.rect.height }} fit={fit} {...rest}>
      {children}
    </ContainerMorph>
  )
}

export type { Rect }
