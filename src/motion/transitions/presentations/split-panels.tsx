import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../../physics/springs'
import { DirectionalBlur } from '../motion-blur'
import type { SpringDrivenProps } from '../timing'

export interface SplitPanelsProps extends SpringDrivenProps {
  /** Nombre de panneaux. */
  panels?: number
  /** 'columns' = bandes verticales qui glissent en Y ; 'rows' = bandes horizontales en X. */
  orientation?: 'columns' | 'rows'
  /** Alterne le sens d'arrivée un panneau sur deux. */
  alternate?: boolean
  /** Décalage entre panneaux (frames). */
  stagger?: number
  /** Preset du ressort de chaque panneau. */
  panelPreset?: SpringPresetName
  /** Intensité du flou de mouvement (0 = aucun). */
  motionBlur?: number
}

const SplitPanels: React.FC<TransitionPresentationComponentProps<SplitPanelsProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  presentationDurationInFrames: D,
  passedProps,
}) => {
  // Côté entrant, la frame de la séquence = frame de la transition.
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { panels = 5, orientation = 'columns', alternate = true, stagger = 3, panelPreset = 'snappy', motionBlur = 1 } = passedProps

  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * p})`, filter: `brightness(${1 - 0.45 * p})` }}>{children}</AbsoluteFill>
    )
  }
  if (p >= 0.99 && frame >= D - 1) return <AbsoluteFill>{children}</AbsoluteFill>

  const cols = orientation === 'columns'
  const along = cols ? width : height
  const travel = cols ? height : width
  const span = Math.max(4, D - 1 - stagger * (panels - 1))

  return (
    <AbsoluteFill>
      {Array.from({ length: panels }, (_, i) => {
        const a0 = Math.round((along * i) / panels)
        const a1 = Math.round((along * (i + 1)) / panels) + 1
        const order = i
        const sp = (f: number) => springPreset({ frame: f, fps, preset: panelPreset, delay: order * stagger, durationInFrames: span })
        const k = sp(frame)
        const vel = Math.abs(k - sp(frame - 1))
        const sign = alternate && i % 2 === 1 ? -1 : 1
        const off = (1 - k) * travel * sign
        const blur = Math.min(40, vel * travel * 0.06 * motionBlur)
        const box = cols ? { left: a0, width: a1 - a0, top: 0, height } : { top: a0, height: a1 - a0, left: 0, width }
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...box,
              overflow: 'hidden',
              transform: cols ? `translateY(${off}px)` : `translateX(${off}px)`,
              boxShadow: k < 0.999 ? '0 0 60px rgba(7,6,15,0.35)' : undefined,
            }}
          >
            <div style={{ position: 'absolute', left: cols ? -a0 : 0, top: cols ? 0 : -a0, width, height }}>
              <DirectionalBlur x={cols ? 0 : blur} y={cols ? blur : 0}>
                {children}
              </DirectionalBlur>
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/** Panneaux : l'écran se découpe en N bandes qui arrivent en cascade, sens alternés, flou de vitesse. */
export const splitPanels = (props: SplitPanelsProps = {}): TransitionPresentation<SplitPanelsProps> => ({
  component: SplitPanels,
  props,
})
