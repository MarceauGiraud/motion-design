import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'
import { remap, type SpringDrivenProps } from '../timing'

export interface BlurDissolveProps extends SpringDrivenProps {
  /** Flou max (px) au cœur du fondu. */
  maxBlur?: number
  /** Légère respiration d'échelle de l'entrante (1 = aucune). */
  enterScale?: number
  /** Surexposition au milieu du fondu (0 = aucune). */
  bloom?: number
}

const BlurDissolve: React.FC<TransitionPresentationComponentProps<BlurDissolveProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { maxBlur = 28, enterScale = 1.05, bloom = 0.12 } = passedProps
  const mid = Math.sin(Math.PI * Math.min(1, Math.max(0, p)))

  if (presentationDirection === 'exiting') {
    const blur = maxBlur * remap(p, [0, 0.6])
    return (
      <AbsoluteFill style={{ filter: `blur(${blur}px) brightness(${1 + bloom * mid})`, transform: `scale(${1 + 0.03 * p})` }}>
        {children}
      </AbsoluteFill>
    )
  }

  const blur = maxBlur * (1 - remap(p, [0.3, 1]))
  const opacity = remap(p, [0.05, 0.65])
  const s = enterScale + (1 - enterScale) * p
  return (
    <AbsoluteFill
      style={{ opacity, transform: `scale(${s})`, filter: blur > 0.05 ? `blur(${blur}px) brightness(${1 + bloom * mid})` : undefined }}
    >
      {children}
    </AbsoluteFill>
  )
}

/** Fondu enchaîné par le flou : la sortante se dissout, l'entrante fait la mise au point. */
export const blurDissolve = (props: BlurDissolveProps = {}): TransitionPresentation<BlurDissolveProps> => ({
  component: BlurDissolve,
  props,
})
