import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { BRAND_RAMP } from '../../tokens'
import { remap, useProgressVelocity, type SpringDrivenProps } from '../timing'

export type WipeDirection = 'right' | 'left' | 'up' | 'down'

export interface LiquidWipeProps extends SpringDrivenProps {
  /** Sens de déplacement du front liquide. */
  direction?: WipeDirection
  /** Amplitude max des vagues (px). */
  amplitude?: number
  /** Nombre de vagues sur la largeur du front. */
  waves?: number
  /** Bande de couleur qui précède le front (null = aucune). */
  leadColor?: string | null
  /** Épaisseur max de la bande de tête (px). */
  leadWidth?: number
}

type Mapper = (a: number, c: number) => [number, number]

function frontPath(edge: (c: number) => number, cross: number, map: Mapper): string {
  const steps = 64
  const pts: string[] = []
  const push = (a: number, c: number) => {
    const [x, y] = map(a, c)
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  push(-20, -20)
  for (let i = 0; i <= steps; i++) {
    const c = -20 + ((cross + 40) * i) / steps
    push(edge(c), c)
  }
  push(-20, cross + 20)
  return `path('M ${pts.join(' L ')} Z')`
}

const LiquidWipe: React.FC<TransitionPresentationComponentProps<LiquidWipeProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width, height } = useVideoConfig()
  const { direction = 'right', amplitude = 70, waves = 1.6, leadColor = BRAND_RAMP, leadWidth = 110, preset } = passedProps
  const v = useProgressVelocity(p, presentationDurationInFrames, preset)
  const speed = Math.min(1.4, v * presentationDurationInFrames * 0.45)

  const horizontal = direction === 'right' || direction === 'left'
  const along = horizontal ? width : height
  const cross = horizontal ? height : width
  const map: Mapper =
    direction === 'right'
      ? (a, c) => [a, c]
      : direction === 'left'
        ? (a, c) => [width - a, c]
        : direction === 'down'
          ? (a, c) => [c, a]
          : (a, c) => [c, height - a]

  if (presentationDirection === 'exiting') {
    // La sortante recule doucement dans le sens du flot.
    const shift = 0.08 * along * p
    const [tx, ty] = horizontal ? [direction === 'right' ? shift : -shift, 0] : [0, direction === 'down' ? shift : -shift]
    return (
      <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px)` }}>
        {children}
        <AbsoluteFill style={{ backgroundColor: 'rgba(7,6,15,1)', opacity: 0.3 * p }} />
      </AbsoluteFill>
    )
  }

  if (p >= 0.999) return <AbsoluteFill>{children}</AbsoluteFill>

  const env = Math.sin(Math.PI * Math.min(1, Math.max(0, p)))
  const amp = amplitude * env * (0.7 + 0.3 * speed)
  const lead = leadColor ? leadWidth * env * (0.5 + 0.5 * speed) : 0
  const phase = p * Math.PI * 2.4
  const k = (Math.PI * 2 * waves) / cross
  const front = p * (along + amplitude * 2 + leadWidth) * 1.03 - amplitude
  const wave = (c: number, ph: number) => amp * (0.62 * Math.sin(c * k + ph) + 0.38 * Math.sin(c * k * 2.3 - ph * 1.4))
  const sceneClip = frontPath((c) => front + wave(c, phase), cross, map)
  const leadClip = frontPath((c) => front + lead + wave(c, phase + 0.9) * 1.15, cross, map)
  const innerShift = (1 - remap(p, [0, 1])) * 0.06 * along
  const [ix, iy] = horizontal ? [direction === 'right' ? -innerShift : innerShift, 0] : [0, direction === 'down' ? -innerShift : innerShift]

  return (
    <AbsoluteFill>
      {lead > 0.5 ? <AbsoluteFill style={{ backgroundImage: leadColor ?? undefined, clipPath: leadClip }} /> : null}
      <AbsoluteFill style={{ clipPath: sceneClip }}>
        <AbsoluteFill style={{ transform: `translate(${ix}px, ${iy}px)` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Balayage liquide : front ondulé organique, précédé d'une vague au dégradé de marque. */
export const liquidWipe = (props: LiquidWipeProps = {}): TransitionPresentation<LiquidWipeProps> => ({
  component: LiquidWipe,
  props,
})
