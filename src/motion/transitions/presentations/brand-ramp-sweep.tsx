import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP } from '../../tokens'
import { useProgressVelocity, type SpringDrivenProps } from '../timing'

export interface BrandRampSweepProps extends SpringDrivenProps {
  /** Sens de passage de la bande. */
  direction?: 'right' | 'left'
  /** Inclinaison de la bande (degrés). */
  angle?: number
  /** Largeur de la bande au repos (px). */
  bandWidth?: number
  /** Étirement de la bande avec la vitesse (0 = rigide). */
  stretch?: number
  /** Dégradé de la bande (par défaut la rampe du logo). */
  gradient?: string
  /** Filets de vitesse devant la bande. */
  speedLines?: boolean
}

const BrandRampSweep: React.FC<TransitionPresentationComponentProps<BrandRampSweepProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig()
  const { direction = 'right', angle = 14, bandWidth = 260, stretch = 1.3, gradient = BRAND_RAMP, speedLines = true, preset } = passedProps
  const v = useProgressVelocity(p, presentationDurationInFrames, preset)
  const speed = Math.min(1.5, v * presentationDurationInFrames * 0.4)
  const mirror = direction === 'left'
  const X = (x: number) => (mirror ? W - x : x)

  if (presentationDirection === 'exiting') {
    const shift = (mirror ? 1 : -1) * -0.05 * W * p
    return (
      <AbsoluteFill style={{ transform: `translateX(${-shift}px) scale(${1 + 0.03 * p})` }}>{children}</AbsoluteFill>
    )
  }
  if (p >= 0.999) return <AbsoluteFill>{children}</AbsoluteFill>

  const s = (H * Math.tan((angle * Math.PI) / 180)) / 2
  const bw = bandWidth * (1 + stretch * speed)
  const lead = -s + p * (W + 2 * s + bandWidth) * 1.04
  const trail = lead - bw
  const poly = (a: number, b: number) =>
    `polygon(${X(a + s)}px -10px, ${X(b + s)}px -10px, ${X(b - s)}px ${H + 10}px, ${X(a - s)}px ${H + 10}px)`
  const bandStyle: React.CSSProperties = {
    backgroundImage: mirror ? gradient.replace('100deg', '260deg') : gradient,
    clipPath: poly(trail - 2, lead),
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: poly(-W - 4 * s, trail) }}>
        <AbsoluteFill style={{ transform: `translateX(${(mirror ? 1 : -1) * 0.05 * W * (1 - p)}px)` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      {/* Halo de la bande */}
      <AbsoluteFill style={{ ...bandStyle, filter: 'blur(40px)', opacity: 0.55 }} />
      <AbsoluteFill style={bandStyle} />
      {speedLines ? (
        <>
          <AbsoluteFill style={{ backgroundColor: BRAND.rose, clipPath: poly(lead + 26 + 40 * speed, lead + 34 + 40 * speed), opacity: 0.85 }} />
          <AbsoluteFill style={{ backgroundColor: BRAND.violet, clipPath: poly(lead + 64 + 90 * speed, lead + 68 + 90 * speed), opacity: 0.6 }} />
          <AbsoluteFill style={{ backgroundColor: BRAND.ink, clipPath: poly(lead + 96 + 150 * speed, lead + 98 + 150 * speed), opacity: 0.4 }} />
        </>
      ) : null}
    </AbsoluteFill>
  )
}

/** Bande au dégradé de marque qui traverse l'écran en biais ; la coupe se fait derrière elle. */
export const brandRampSweep = (props: BrandRampSweepProps = {}): TransitionPresentation<BrandRampSweepProps> => ({
  component: BrandRampSweep,
  props,
})
