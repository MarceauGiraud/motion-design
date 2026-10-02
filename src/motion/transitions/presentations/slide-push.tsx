import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { DirectionalBlur } from '../motion-blur'
import { useProgressVelocity, type SpringDrivenProps } from '../timing'

export interface SlidePushProps extends SpringDrivenProps {
  /** Côté d'où arrive la nouvelle scène. */
  from?: 'right' | 'left' | 'bottom' | 'top'
  /** Part de la course parcourue par la sortante (parallaxe, 0..1). */
  parallax?: number
  /** Intensité du flou de mouvement directionnel (0 = aucun). */
  motionBlur?: number
  /** Assombrissement max de la sortante. */
  dim?: number
}

const SlidePush: React.FC<TransitionPresentationComponentProps<SlidePushProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width, height } = useVideoConfig()
  const { from = 'right', parallax = 0.32, motionBlur = 1, dim = 0.45, preset } = passedProps
  const v = useProgressVelocity(p, presentationDurationInFrames, preset)
  const horizontal = from === 'right' || from === 'left'
  const travel = horizontal ? width : height
  const sign = from === 'right' || from === 'bottom' ? 1 : -1
  const blur = Math.min(60, v * travel * 0.045 * motionBlur)
  const t = (d: number) => (horizontal ? `translateX(${d}px)` : `translateY(${d}px)`)

  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ transform: `${t(-sign * travel * parallax * p)} scale(${1 - 0.04 * p})` }}>
        <DirectionalBlur x={horizontal ? blur * parallax : 0} y={horizontal ? 0 : blur * parallax}>
          {children}
        </DirectionalBlur>
        <AbsoluteFill style={{ backgroundColor: '#000', opacity: dim * p }} />
      </AbsoluteFill>
    )
  }

  const shadowDir = horizontal ? `${-sign * 40}px 0` : `0 ${-sign * 40}px`
  return (
    <AbsoluteFill style={{ transform: t(sign * travel * (1 - p)), boxShadow: p < 0.999 ? `${shadowDir} 120px rgba(0,0,0,0.45)` : undefined }}>
      <DirectionalBlur x={horizontal ? blur : 0} y={horizontal ? 0 : blur}>
        {children}
      </DirectionalBlur>
    </AbsoluteFill>
  )
}

/** Poussée latérale : la nouvelle scène pousse l'ancienne (parallaxe), flou directionnel lié à la vitesse. */
export const slidePush = (props: SlidePushProps = {}): TransitionPresentation<SlidePushProps> => ({
  component: SlidePush,
  props,
})
