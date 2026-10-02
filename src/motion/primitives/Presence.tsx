/**
 * <Presence> : entrée ET sortie à ressort. <Reveal> : entrée seule (sucre).
 *
 *   <Reveal variant="fadeUp" delay={10}>Titre</Reveal>
 *   <Presence enterAt={0} exitAt={90} enter="pop" exit="blur">Toast</Presence>
 *
 * La sortie rejoue la variante d'entrée à l'envers (exit="fadeDown" = part vers le haut).
 * Entrée et sortie sont deux ressorts superposés (p = pIn - pOut) : une sortie
 * lancée avant la fin de l'entrée repart en douceur, sans saut.
 */
import type { CSSProperties, ReactNode } from 'react'
import type { SpringConfig } from 'remotion'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { mergeStyle, revealStyle, VARIANT_PRESET, type RevealVariant } from './variants'

export interface PresenceState {
  /** Progression combinée entrée - sortie (0 = absent, 1 = posé). */
  progress: number
  /** Vitesse de progress (par frame). */
  velocity: number
  /** true quand la sortie est finie (le composant peut se démonter). */
  gone: boolean
  /** true après exitAt. */
  exiting: boolean
}

export interface UsePresenceOptions {
  enterAt?: number
  exitAt?: number
  preset?: SpringPresetName
  exitPreset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** Force la durée du ressort d'entrée (frames). */
  enterDuration?: number
  /** Force la durée du ressort de sortie (frames). */
  exitDuration?: number
}

/** Progression entrée/sortie d'un élément (hook). */
export function usePresence({
  enterAt = 0,
  exitAt,
  preset = 'smooth',
  exitPreset,
  config,
  enterDuration,
  exitDuration,
}: UsePresenceOptions = {}): PresenceState {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const at = (f: number) => {
    const pin = f < enterAt ? 0 : springPreset({ frame: f, fps, preset, config, delay: enterAt, durationInFrames: enterDuration })
    const pout =
      exitAt === undefined || f < exitAt
        ? 0
        : springPreset({ frame: f, fps, preset: exitPreset ?? preset, config, delay: exitAt, durationInFrames: exitDuration })
    return { pin, pout }
  }
  const now = at(frame)
  const before = at(frame - 1)
  const progress = now.pin - now.pout
  return {
    progress,
    velocity: progress - (before.pin - before.pout),
    gone: exitAt !== undefined && frame >= exitAt && now.pout > 0.995 && Math.abs(progress) < 0.005,
    exiting: exitAt !== undefined && frame >= exitAt,
  }
}

export interface PresenceProps {
  children?: ReactNode
  /** Frame d'entrée (relative à la Sequence). */
  enterAt?: number
  /** Frame de sortie. Absent = reste. */
  exitAt?: number
  /** Variante d'entrée. */
  enter?: RevealVariant
  /** Variante de sortie (jouée à l'envers). Défaut = enter. */
  exit?: RevealVariant
  /** Preset d'entrée. Défaut : preset naturel de la variante. */
  preset?: SpringPresetName
  /** Preset de sortie. Défaut : 'smooth' (les sorties rebondissantes font cheap). */
  exitPreset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** Distance (px) des variantes qui se déplacent. */
  distance?: number
  /** Flou de mouvement lié à la vitesse (true ou facteur). */
  motionBlur?: number | boolean
  enterDuration?: number
  exitDuration?: number
  /** Garde l'élément monté (invisible) après la sortie : préserve le layout. */
  keepMounted?: boolean
  /** display du conteneur. Défaut 'block'. */
  display?: CSSProperties['display']
  style?: CSSProperties
  /** Style du conteneur externe (position absolue, etc.). */
  containerStyle?: CSSProperties
  className?: string
}

export function Presence({
  children,
  enterAt = 0,
  exitAt,
  enter = 'fadeUp',
  exit,
  preset,
  exitPreset = 'smooth',
  config,
  distance,
  motionBlur = false,
  enterDuration,
  exitDuration,
  keepMounted = false,
  display = 'block',
  style,
  containerStyle,
  className,
}: PresenceProps) {
  const state = usePresence({
    enterAt,
    exitAt,
    preset: preset ?? VARIANT_PRESET[enter],
    exitPreset,
    config,
    enterDuration,
    exitDuration,
  })
  if (state.gone && !keepMounted) return null
  const variant = state.exiting ? (exit ?? enter) : enter
  const { outer, inner } = revealStyle(variant, state.progress, { distance, velocity: state.velocity, motionBlur })
  return (
    <div className={className} style={{ display, ...outer, ...containerStyle }}>
      <div style={mergeStyle({ display: display === 'inline-block' || display === 'inline' ? 'inline-block' : undefined, ...style }, inner)}>
        {children}
      </div>
    </div>
  )
}

export interface RevealProps extends Omit<PresenceProps, 'enterAt' | 'enter'> {
  /** Variante d'apparition. Défaut 'fadeUp'. */
  variant?: RevealVariant
  /** Frame d'apparition (relative à la Sequence). */
  delay?: number
}

/** Apparition à ressort (entrée seule, exitAt optionnel). */
export function Reveal({ variant = 'fadeUp', delay = 0, ...rest }: RevealProps) {
  return <Presence enter={variant} enterAt={delay} {...rest} />
}
