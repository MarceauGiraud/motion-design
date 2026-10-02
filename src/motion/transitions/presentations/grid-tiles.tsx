import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../../physics/springs'
import type { SpringDrivenProps } from '../timing'

export interface GridTilesProps extends SpringDrivenProps {
  /** Colonnes de la grille. */
  cols?: number
  /** Lignes de la grille. */
  rows?: number
  /** Point d'où part la vague de retournement (fraction de l'écran). */
  origin?: { x: number; y: number }
  /** Part de la durée consacrée à la cascade (0..0.8). */
  spread?: number
  /** Axe de retournement des tuiles. */
  axis?: 'y' | 'x'
  /** Preset du ressort de chaque tuile. */
  tilePreset?: SpringPresetName
}

const GridTiles: React.FC<TransitionPresentationComponentProps<GridTilesProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  presentationDurationInFrames: D,
  passedProps,
}) => {
  // Côté entrant, la frame de la séquence = frame de la transition.
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { cols = 8, rows = 5, origin = { x: 0, y: 0 }, spread = 0.5, axis = 'y', tilePreset = 'snappy' } = passedProps

  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ filter: `brightness(${1 - 0.5 * p})`, transform: `scale(${1 + 0.04 * p})` }}>{children}</AbsoluteFill>
    )
  }
  if (p >= 0.99 && frame >= D - 1) return <AbsoluteFill>{children}</AbsoluteFill>

  const cascade = Math.round(D * Math.min(0.8, spread))
  const span = Math.max(4, D - 1 - cascade)
  const maxDist = Math.max(
    ...[0, 1].flatMap((cx) => [0, 1].map((cy) => Math.hypot(cx - origin.x, (cy - origin.y) * (height / width)))),
  )

  const tiles = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = Math.round((width * c) / cols)
      const x1 = Math.round((width * (c + 1)) / cols)
      const y0 = Math.round((height * r) / rows)
      const y1 = Math.round((height * (r + 1)) / rows)
      const cxn = (c + 0.5) / cols
      const cyn = (r + 0.5) / rows
      const dist = Math.hypot(cxn - origin.x, (cyn - origin.y) * (height / width)) / maxDist
      const k = springPreset({ frame, fps, preset: tilePreset, delay: dist * cascade, durationInFrames: span })
      if (k <= 0.001) continue
      const angle = (1 - k) * 95
      const rot = axis === 'y' ? `rotateY(${-angle}deg)` : `rotateX(${angle}deg)`
      const scale = interpolate(k, [0, 1], [0.6, 1])
      const opacity = interpolate(k, [0, 0.25], [0, 1], { extrapolateRight: 'clamp' })
      const shade = Math.min(0.6, (angle / 95) * 0.6)
      tiles.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: x0,
            top: y0,
            width: x1 - x0 + 1,
            height: y1 - y0 + 1,
            overflow: 'hidden',
            opacity,
            transform: `perspective(1400px) ${rot} scale(${scale})`,
            borderRadius: 14 * (1 - Math.min(1, k)),
          }}
        >
          <div style={{ position: 'absolute', left: -x0, top: -y0, width, height }}>{children}</div>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#000', opacity: shade }} />
        </div>,
      )
    }
  }
  return <AbsoluteFill>{tiles}</AbsoluteFill>
}

/** Mosaïque : la nouvelle scène arrive tuile par tuile, retournées en cascade depuis un point. */
export const gridTiles = (props: GridTilesProps = {}): TransitionPresentation<GridTilesProps> => ({
  component: GridTiles,
  props,
})
