import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, interpolate, useVideoConfig } from 'remotion'
import { BRAND } from '../../tokens'
import { remap, type SpringDrivenProps } from '../timing'

export interface ShapeMorphMaskProps extends SpringDrivenProps {
  /** Centre du cercle initial, en fraction de l'écran. */
  origin?: { x: number; y: number }
  /** Diamètre du cercle intermédiaire, en fraction de la hauteur. */
  circle?: number
  /** Taille de la carte intermédiaire, en fraction de l'écran. */
  card?: number
  /** Arrondi de la carte intermédiaire (px). */
  cardRadius?: number
  /** Contre-zoom du contenu à l'intérieur du masque. */
  innerZoom?: number
  /** Fond visible derrière la sortante quand elle recule. */
  backdrop?: string
}

const ShapeMorphMask: React.FC<TransitionPresentationComponentProps<ShapeMorphMaskProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig()
  const { origin = { x: 0.5, y: 0.5 }, circle = 0.3, card = 0.64, cardRadius = 44, innerZoom = 1.18, backdrop = BRAND.night } = passedProps

  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ backgroundColor: p > 0.001 ? backdrop : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${1 - 0.1 * p})`, filter: `blur(${6 * remap(p, [0.3, 1])}px)` }}>
          {children}
          <AbsoluteFill style={{ backgroundColor: BRAND.night, opacity: 0.4 * p }} />
        </AbsoluteFill>
      </AbsoluteFill>
    )
  }
  if (p >= 0.999) return <AbsoluteFill>{children}</AbsoluteFill>

  const opt = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
  const k = [0, 0.32, 0.68, 1]
  const d = circle * H
  // cercle -> carte arrondie -> plein écran
  const w = interpolate(p, k, [0, d, card * W, W + 2], opt)
  const h = interpolate(p, k, [0, d, card * H, H + 2], opt)
  const r = interpolate(p, k, [0, d / 2, cardRadius, 0], opt)
  const toCenter = remap(p, [0.32, 1])
  const cx = origin.x * W + (W / 2 - origin.x * W) * toCenter
  const cy = origin.y * H + (H / 2 - origin.y * H) * toCenter
  const top = cy - h / 2
  const left = cx - w / 2
  const clip = `inset(${top}px ${W - left - w}px ${H - top - h}px ${left}px round ${Math.min(r, w / 2, h / 2)}px)`
  const zoom = innerZoom + (1 - innerZoom) * Math.min(1, p)
  const glow = 1 - remap(p, [0.7, 1])

  return (
    <AbsoluteFill style={{ filter: glow > 0.01 ? `drop-shadow(0 30px 60px rgba(0,0,0,${0.5 * glow}))` : undefined }}>
      <AbsoluteFill style={{ clipPath: clip }}>
        <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${cx}px ${cy}px` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Masque qui se métamorphose : point -> cercle -> carte arrondie -> plein écran. */
export const shapeMorphMask = (props: ShapeMorphMaskProps = {}): TransitionPresentation<ShapeMorphMaskProps> => ({
  component: ShapeMorphMask,
  props,
})
