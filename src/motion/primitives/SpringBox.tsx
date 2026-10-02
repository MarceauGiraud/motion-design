/**
 * <SpringBox> : boîte générique animée d'un état `from` vers un état `to`
 * par un preset, avec motion blur et squash & stretch issus de la vitesse.
 *
 *   <SpringBox from={{ x: -400, opacity: 0 }} to={{ x: 0 }} preset="snappy" motionBlur squash />
 *
 * `steps` remplace from/to par une timeline : [{ at: 0, to: { x: 0 } }, { at: 60, to: { x: 300 } }].
 */
import type { CSSProperties, ReactNode } from 'react'
import type { SpringConfig } from 'remotion'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { joinFilters, motionBlurFilter, stretchTransform, type SquashOptions } from '../physics/deform'
import { springPreset, type SpringPresetName } from '../physics/springs'

export interface BoxState {
  x?: number
  y?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  /** degrés */
  rotate?: number
  opacity?: number
  /** flou (px), en plus du motion blur */
  blur?: number
}

const DEFAULTS: Required<BoxState> = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, blur: 0 }
const KEYS = Object.keys(DEFAULTS) as Array<keyof BoxState>

export interface SpringBoxStep {
  /** Frame de départ de l'étape. */
  at: number
  /** État visé (les clés absentes restent où elles sont). */
  to: BoxState
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
}

export interface SpringBoxProps {
  children?: ReactNode
  /** État de départ. */
  from?: BoxState
  /** État d'arrivée. */
  to?: BoxState
  /** Alternative à from/to : suite d'étapes superposées (interruptibles). */
  steps?: SpringBoxStep[]
  /** Frame de départ (pour from/to). */
  delay?: number
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  durationInFrames?: number
  /** Flou de mouvement lié à la vitesse (true ou facteur). */
  motionBlur?: number | boolean
  /** Squash & stretch dans l'axe du mouvement (true ou options). */
  squash?: boolean | SquashOptions
  transformOrigin?: CSSProperties['transformOrigin']
  display?: CSSProperties['display']
  style?: CSSProperties
  className?: string
}

/** Résout l'état animé à une frame donnée (pur). */
export function springBoxState(
  frame: number,
  fps: number,
  { from = {}, to = {}, steps, delay = 0, preset = 'smooth', config, durationInFrames }: Pick<SpringBoxProps, 'from' | 'to' | 'steps' | 'delay' | 'preset' | 'config' | 'durationInFrames'>,
): Required<BoxState> {
  const out = { ...DEFAULTS, ...from } as Required<BoxState>
  if (steps && steps.length) {
    const prev = { ...out }
    for (const s of [...steps].sort((a, b) => a.at - b.at)) {
      const p = frame < s.at ? 0 : springPreset({ frame, fps, delay: s.at, preset: s.preset ?? preset, config: { ...config, ...s.config } })
      for (const k of KEYS) {
        const target = s.to[k]
        if (target === undefined) continue
        out[k] += (target - prev[k]) * p
        prev[k] = target
      }
    }
    return out
  }
  const p = frame < delay ? 0 : springPreset({ frame, fps, delay, preset, config, durationInFrames })
  for (const k of KEYS) {
    const a = from[k] ?? DEFAULTS[k]
    const b = to[k] ?? from[k] ?? DEFAULTS[k]
    out[k] = a + (b - a) * p
  }
  return out
}

export function SpringBox({ children, motionBlur = false, squash = false, transformOrigin, display = 'block', style, className, ...anim }: SpringBoxProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = springBoxState(frame, fps, anim)
  const p = springBoxState(frame - 1, fps, anim)
  const vx = s.x - p.x
  const vy = s.y - p.y
  const factor = motionBlur === true ? 1 : motionBlur || 0
  const mb = factor > 0 ? motionBlurFilter(Math.hypot(vx, vy) * factor) : undefined
  const stretch = squash ? stretchTransform(vx, vy, squash === true ? undefined : squash) : ''
  return (
    <div
      className={className}
      style={{
        display,
        ...style,
        transform: `translate(${s.x}px, ${s.y}px) ${stretch} rotate(${s.rotate}deg) scale(${s.scale * s.scaleX}, ${s.scale * s.scaleY}) ${style?.transform ?? ''}`,
        transformOrigin,
        opacity: Math.min(1, Math.max(0, s.opacity)) * ((style?.opacity as number | undefined) ?? 1),
        filter: joinFilters(style?.filter as string | undefined, s.blur > 0.05 ? `blur(${s.blur}px)` : undefined, mb),
      }}
    >
      {children}
    </div>
  )
}
