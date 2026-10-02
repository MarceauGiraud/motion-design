/**
 * <IconMorph> : morph entre icônes au trait (lucide) par interpolation de
 * chemins. Chaque trait est apparié au plus proche de l'icône précédente ;
 * les traits orphelins naissent d'un point (et s'estompent) : play -> pause,
 * menu -> x, plus -> check… restent lisibles à chaque frame.
 */
import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { buildTrack, evalPresence, evalSlot, toPathD } from './path-engine'
import { resolveIcon, type IconInput } from './icons'

export interface IconMorphProps {
  /** Suite d'icônes (nom de ICONS ou IconNode lucide). Défaut play -> pause. */
  icons?: IconInput[]
  /** at[i] = frame de la transition vers icons[i+1]. Défaut toutes les 30 frames depuis 15. */
  at?: number[]
  /** Taille affichée (px). Défaut 160. */
  size?: number
  /** Couleur du trait. Défaut BRAND.text. */
  color?: string
  /** Épaisseur du trait (unités de la grille 24). Défaut 2. */
  strokeWidth?: number
  /** Remplit les contours fermés (play plein, pause pleine…). Défaut false. */
  filled?: boolean
  /** Rotation (deg) ajoutée par transition, portée par le ressort. Défaut 0. */
  rotate?: number
  /** Petit rebond d'échelle pendant la transition. Défaut 0.08. */
  pop?: number
  /** Preset des transitions. Défaut 'morph'. */
  preset?: SpringPresetName
  /** Taille de la grille source. Défaut 24 (lucide). */
  viewBoxSize?: number
  style?: CSSProperties
}

export function IconMorph({
  icons = ['play', 'pause'],
  at,
  size = 160,
  color = BRAND.text,
  strokeWidth = 2,
  filled = false,
  rotate = 0,
  pop = 0.08,
  preset = 'morph',
  viewBoxSize = 24,
  style,
}: IconMorphProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const track = buildTrack(icons.map(resolveIcon), { samples: 120, openSamples: 64 })
  const w = icons.map((_, i) => (i === 0 ? 0 : springPreset({ frame, fps, preset, delay: at?.[i - 1] ?? 15 + (i - 1) * 30 })))
  const bump = icons.reduce((a, _, i) => {
    if (i === 0) return a
    const p = Math.min(1, Math.max(0, w[i]))
    return a + Math.sin(Math.PI * p)
  }, 0)
  const rot = rotate * w.reduce((a, v) => a + v, 0)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{ overflow: 'visible', transform: `rotate(${rot}deg) scale(${1 - pop * 0.5 * bump})`, ...style }}
    >
      {track.slots.map((s, i) => {
        const o = evalPresence(s, w)
        if (o < 0.01) return null
        return (
          <path
            key={i}
            d={toPathD(evalSlot(s, w), s.closed)}
            fill={filled && s.closed ? color : 'none'}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={o}
          />
        )
      })}
    </svg>
  )
}
