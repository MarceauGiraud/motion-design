/**
 * <Stagger> : fait apparaître (et disparaître) n'importe quels enfants en vague.
 *
 *   <Stagger variant="pop" step={3} from="center" style={{ display: 'flex', gap: 16 }}>
 *     {chips}
 *   </Stagger>
 *
 * Chaque enfant est enveloppé dans une <Presence>. Le conteneur prend `style`
 * (flex, grid…) : la mise en page reste à l'appelant.
 */
import { Children, type CSSProperties, type ReactNode } from 'react'
import type { SpringConfig } from 'remotion'
import { stagger, type StaggerFrom } from '../physics/stagger'
import type { SpringPresetName } from '../physics/springs'
import { Presence } from './Presence'
import type { RevealVariant } from './variants'

export interface StaggerProps {
  children?: ReactNode
  /** Variante d'entrée de chaque enfant. Défaut 'fadeUp'. */
  variant?: RevealVariant
  /** Frames entre deux enfants. Défaut 4. */
  step?: number
  /** Origine de la vague : start | end | center | edges | random | index. */
  from?: StaggerFrom
  /** Graine pour from='random'. */
  seed?: string | number
  /** Retard global avant le premier enfant. */
  delay?: number
  /** Courbure de l'espacement (1 = linéaire). */
  ease?: number
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  distance?: number
  motionBlur?: number | boolean
  /** Sortie : frame où la vague de sortie commence. */
  exitAt?: number
  /** Variante de sortie (jouée à l'envers). */
  exitVariant?: RevealVariant
  /** Frames entre deux sorties. Défaut = step / 2. */
  exitStep?: number
  /** Origine de la vague de sortie. Défaut = from. */
  exitFrom?: StaggerFrom
  exitPreset?: SpringPresetName
  /** display de chaque enveloppe d'enfant. Défaut 'block'. */
  itemDisplay?: CSSProperties['display']
  /** Style de chaque enveloppe d'enfant. */
  itemStyle?: CSSProperties
  /** Style du conteneur (layout). */
  style?: CSSProperties
  className?: string
}

export function Stagger({
  children,
  variant = 'fadeUp',
  step = 4,
  from = 'start',
  seed = 'stagger',
  delay = 0,
  ease = 1,
  preset,
  config,
  distance,
  motionBlur,
  exitAt,
  exitVariant,
  exitStep,
  exitFrom,
  exitPreset,
  itemDisplay = 'block',
  itemStyle,
  style,
  className,
}: StaggerProps) {
  const items = Children.toArray(children)
  const count = items.length
  return (
    <div className={className} style={style}>
      {items.map((child, i) => (
        <Presence
          key={i}
          enter={variant}
          exit={exitVariant}
          enterAt={stagger(i, step, { count, from, seed, delay, ease })}
          exitAt={exitAt === undefined ? undefined : stagger(i, exitStep ?? step / 2, { count, from: exitFrom ?? from, seed, delay: exitAt, ease })}
          preset={preset}
          exitPreset={exitPreset}
          config={config}
          distance={distance}
          motionBlur={motionBlur}
          keepMounted
          display={itemDisplay}
          containerStyle={itemStyle}
        >
          {child}
        </Presence>
      ))}
    </div>
  )
}
