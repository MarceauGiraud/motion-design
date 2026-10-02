import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'
import { BRAND } from '../../tokens'
import type { SpringDrivenProps } from '../timing'

export interface Flip3DProps extends SpringDrivenProps {
  /** Axe de rotation de la carte. */
  axis?: 'y' | 'x'
  /** Perspective CSS (px) : plus petit = plus dramatique. */
  perspective?: number
  /** Recul de la carte à mi-parcours (0..1). */
  lift?: number
  /** Fond visible derrière la carte. */
  backdrop?: string
  /** Arrondi max de la carte pendant le retournement (px). */
  radius?: number
}

const Flip3D: React.FC<TransitionPresentationComponentProps<Flip3DProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { axis = 'y', perspective = 2200, lift = 0.22, backdrop = BRAND.night, radius = 36 } = passedProps
  const mid = Math.sin(Math.PI * Math.min(1, Math.max(0, p)))
  const scale = 1 - lift * mid
  const exiting = presentationDirection === 'exiting'
  const angle = exiting ? p * 180 : p * 180 - 180
  const rot = axis === 'y' ? `rotateY(${angle}deg)` : `rotateX(${-angle}deg)`
  // Ombrage : la face s'assombrit quand elle se présente de biais.
  const shade = Math.min(0.55, Math.abs(Math.sin((angle * Math.PI) / 180)) * 0.55)

  return (
    <AbsoluteFill style={{ perspective, backgroundColor: exiting && p > 0.001 ? backdrop : undefined }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) ${rot}`,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: radius * mid,
          overflow: 'hidden',
          boxShadow: mid > 0.01 ? `0 ${40 * mid}px ${120 * mid}px rgba(0,0,0,${0.45 * mid})` : undefined,
        }}
      >
        {children}
        <AbsoluteFill style={{ backgroundColor: '#000', opacity: shade, pointerEvents: 'none' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Carte retournée en 3D : la scène sortante est le recto, l'entrante le verso. */
export const flip3D = (props: Flip3DProps = {}): TransitionPresentation<Flip3DProps> => ({
  component: Flip3D,
  props,
})
