import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'
import { BRAND } from '../../tokens'
import { remap, useProgressVelocity, type SpringDrivenProps } from '../timing'

export interface ZoomThroughProps extends SpringDrivenProps {
  /** Échelle finale de la scène sortante (on la traverse). */
  exitScale?: number
  /** Échelle de départ de la scène entrante (elle arrive du fond). */
  enterScale?: number
  /** Flou max (px) ajouté par la vitesse du ressort. */
  maxBlur?: number
  /** Point focal de la traversée, en fraction de l'écran. */
  origin?: { x: number; y: number }
  /** Arrondi de la carte entrante pendant son vol (px, 0 = aucun). */
  cardRadius?: number
}

const ZoomThrough: React.FC<TransitionPresentationComponentProps<ZoomThroughProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { exitScale = 2.2, enterScale = 0.6, maxBlur = 18, origin = { x: 0.5, y: 0.5 }, cardRadius = 48, preset } = passedProps
  const v = useProgressVelocity(p, presentationDurationInFrames, preset)
  // Vitesse normalisée : la pente moyenne d'une transition vaut 1/durée.
  const speed = Math.min(1, v * presentationDurationInFrames * 0.35)
  const blur = maxBlur * speed
  const to = `${origin.x * 100}% ${origin.y * 100}%`

  if (presentationDirection === 'exiting') {
    // On traverse l'ancienne scène : elle grossit, floute et s'éteint derrière la nouvelle.
    const s = 1 + (exitScale - 1) * p
    return (
      <AbsoluteFill style={{ backgroundColor: p > 0.001 ? BRAND.night : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: to, filter: `blur(${blur + 10 * p}px) brightness(${1 - 0.5 * p})`, opacity: 1 - remap(p, [0.55, 1]) }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    )
  }

  // La nouvelle arrive du fond comme une carte, puis s'ouvre plein cadre.
  const s = enterScale + (1 - enterScale) * p
  const opacity = remap(p, [0, 0.3])
  const radius = cardRadius * (1 - remap(p, [0.6, 1]))
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${s})`,
        transformOrigin: to,
        filter: blur > 0.05 ? `blur(${blur * 0.6}px)` : undefined,
        opacity,
        borderRadius: radius / Math.max(0.3, s),
        overflow: 'hidden',
        boxShadow: radius > 0.5 ? `0 40px 120px rgba(0,0,0,${0.5 * (radius / cardRadius)})` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

/** Traversée en profondeur : la sortante grossit et floute, l'entrante arrive du fond. */
export const zoomThrough = (props: ZoomThroughProps = {}): TransitionPresentation<ZoomThroughProps> => ({
  component: ZoomThrough,
  props,
})
