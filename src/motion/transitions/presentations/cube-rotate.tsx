import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { BRAND } from '../../tokens'
import type { SpringDrivenProps } from '../timing'

export interface CubeRotateProps extends SpringDrivenProps {
  /** Côté par où la nouvelle face arrive. */
  direction?: 'left' | 'right' | 'up' | 'down'
  /** Perspective CSS (px). */
  perspective?: number
  /** Recul de caméra à mi-rotation (px en Z). */
  pullBack?: number
  /** Fond visible autour du cube. */
  backdrop?: string
}

const CubeRotate: React.FC<TransitionPresentationComponentProps<CubeRotateProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { width, height } = useVideoConfig()
  const { direction = 'left', perspective = 2400, pullBack = 520, backdrop = BRAND.night } = passedProps
  const exiting = presentationDirection === 'exiting'
  const horizontal = direction === 'left' || direction === 'right'
  const half = (horizontal ? width : height) / 2
  // 'left' : la nouvelle face vient de la droite, le cube tourne vers la gauche.
  const sign = direction === 'left' || direction === 'up' ? 1 : -1
  const angle = exiting ? -90 * p * sign : 90 * (1 - p) * sign
  const rot = horizontal ? `rotateY(${angle}deg)` : `rotateX(${-angle}deg)`
  const mid = Math.sin(Math.PI * Math.min(1, Math.max(0, p)))
  const shade = Math.min(0.7, (Math.abs(angle) / 90) * 0.7)

  return (
    <AbsoluteFill style={{ perspective, backgroundColor: exiting && p > 0.001 ? backdrop : undefined }}>
      <AbsoluteFill
        style={{
          transform: `translateZ(${-pullBack * mid}px) translateZ(${-half}px) ${rot} translateZ(${half}px)`,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          overflow: 'hidden',
        }}
      >
        {children}
        <AbsoluteFill style={{ backgroundColor: '#000', opacity: shade, pointerEvents: 'none' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Cube : les deux scènes sont deux faces adjacentes d'un cube qui pivote, caméra qui recule. */
export const cubeRotate = (props: CubeRotateProps = {}): TransitionPresentation<CubeRotateProps> => ({
  component: CubeRotate,
  props,
})
