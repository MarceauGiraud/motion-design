import { useId, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { safeId } from './timing'

export interface DirectionalBlurProps {
  /** Flou horizontal (px). */
  x?: number
  /** Flou vertical (px). */
  y?: number
  children: ReactNode
  style?: CSSProperties
}

/**
 * Flou de mouvement DIRECTIONNEL (filtre SVG, flou anisotrope), là où
 * `filter: blur()` ne sait faire qu'un flou rond. Sans flou, aucun filtre.
 */
export function DirectionalBlur({ x = 0, y = 0, children, style }: DirectionalBlurProps) {
  const id = `dblur-${safeId(useId())}`
  const active = x > 0.15 || y > 0.15
  return (
    <>
      {active ? (
        <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} edgeMode="duplicate" />
          </filter>
        </svg>
      ) : null}
      <AbsoluteFill style={{ ...style, filter: active ? `url(#${id})` : style?.filter }}>{children}</AbsoluteFill>
    </>
  )
}
