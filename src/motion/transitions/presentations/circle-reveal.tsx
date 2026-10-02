import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP } from '../../tokens'
import { remap, type SpringDrivenProps } from '../timing'

export interface CircleRevealProps extends SpringDrivenProps {
  /** Point d'origine de l'iris, en fraction de l'écran (0..1). */
  origin?: { x: number; y: number }
  /** Largeur du bord adouci en px. */
  feather?: number
  /** Anneau lumineux (dégradé de marque) sur le bord de l'iris. */
  ring?: boolean
  /** Recul de la scène sortante (échelle finale). */
  exitScale?: number
  /** Fond visible derrière la sortante quand elle recule. */
  backdrop?: string
}

const CircleReveal: React.FC<TransitionPresentationComponentProps<CircleRevealProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { width, height } = useVideoConfig()
  const { origin = { x: 0.5, y: 0.5 }, feather = 3, ring = true, exitScale = 0.94, backdrop = BRAND.night } = passedProps
  const ox = origin.x * width
  const oy = origin.y * height
  // Rayon qui couvre le coin le plus éloigné.
  const maxR = Math.max(Math.hypot(ox, oy), Math.hypot(width - ox, oy), Math.hypot(ox, height - oy), Math.hypot(width - ox, height - oy))

  if (presentationDirection === 'exiting') {
    const s = 1 + (exitScale - 1) * p
    return (
      <AbsoluteFill style={{ backgroundColor: p > 0.001 ? backdrop : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: `${ox}px ${oy}px` }}>
          {children}
          <AbsoluteFill style={{ backgroundColor: BRAND.night, opacity: 0.35 * p }} />
        </AbsoluteFill>
      </AbsoluteFill>
    )
  }

  const r = Math.max(0, p) * (maxR * 1.04 + feather * 2)
  const done = p >= 0.999
  const mask = `radial-gradient(circle at ${ox}px ${oy}px, #000 ${Math.max(0, r - feather)}px, transparent ${r}px)`
  const innerScale = 1.08 - 0.08 * Math.min(1, p)
  const ringWidth = 10 * remap(p, [0, 0.15]) * (1 - remap(p, [0.6, 1]))

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={done ? undefined : { WebkitMaskImage: mask, maskImage: mask }}
      >
        <AbsoluteFill style={{ transform: `scale(${innerScale})`, transformOrigin: `${ox}px ${oy}px` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      {ring && !done && ringWidth > 0.2 ? (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: ox - r,
              top: oy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              padding: ringWidth * 1.4,
              backgroundImage: BRAND_RAMP,
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'blur(2px)',
              opacity: 0.9,
            }}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  )
}

/** Iris : la scène entrante s'ouvre en cercle depuis un point, bord cerclé du dégradé de marque. */
export const circleReveal = (props: CircleRevealProps = {}): TransitionPresentation<CircleRevealProps> => ({
  component: CircleReveal,
  props,
})
