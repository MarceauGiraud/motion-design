/**
 * Touches de clavier : <Keycap> (une touche qui s'enfonce en ressort) et
 * <ShortcutCombo> (⌘K : apparition en cascade, pression enchaînée, relâche).
 */
import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset } from '../physics/springs'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { UI_PALETTE } from './palette'

export interface KeycapProps {
  /** Symbole ou texte de la touche ('⌘', 'K', 'Entrée'…). */
  label: ReactNode
  /** Petit libellé secondaire (ex. 'command'). */
  sublabel?: ReactNode
  /** Frame(s) d'enfoncement. */
  pressAt?: number | number[]
  /** Durée du maintien (frames). Défaut 8. */
  hold?: number
  /** Frame d'apparition (pop 'bouncy'). Absent = déjà là. */
  appearAt?: number
  /** Côté de la touche carrée (px). Défaut 96. */
  size?: number
  /** Multiplicateur de largeur (1 = carré, 1.6 = shift…). Défaut 1. */
  widthRatio?: number
  /** 'light' (défaut) ou 'dark'. */
  theme?: 'light' | 'dark'
  /** Halo dégradé de marque sous la touche enfoncée. Défaut true. */
  glow?: boolean
  style?: CSSProperties
}

/** Enfoncement 0..1 d'une touche : descend en 'snappy', remonte après `hold`. */
export function usePress(pressAt: number | number[] | undefined, hold = 8): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (pressAt === undefined) return 0
  const list = Array.isArray(pressAt) ? pressAt : [pressAt]
  let p = 0
  for (const at of list) {
    const down = springPreset({ frame, fps, preset: 'snappy', delay: at })
    const up = springPreset({ frame, fps, preset: 'snappy', delay: at + hold })
    p = Math.max(p, down - up)
  }
  return p
}

/** Touche physique : face bombée, tranche de 7 % qui s'écrase à la pression. */
export function Keycap({ label, sublabel, pressAt, hold = 8, appearAt, size = 96, widthRatio = 1, theme = 'light', glow = true, style }: KeycapProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const press = usePress(pressAt, hold)
  const appear = appearAt === undefined ? 1 : springPreset({ frame, fps, preset: 'bouncy', delay: appearAt })
  const dark = theme === 'dark'
  const depth = size * 0.075
  const w = size * widthRatio
  const sink = depth * press
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: size + depth,
        transform: `scale(${Math.max(0, appear)})`,
        opacity: interpolate(appear, [0, 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        ...style,
      }}
    >
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: -size * 0.12,
            top: size * 0.2,
            borderRadius: size * 0.3,
            backgroundImage: BRAND_RAMP,
            filter: `blur(${size * 0.2}px)`,
            opacity: 0.55 * press,
          }}
        />
      )}
      {/* Tranche */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: depth,
          height: size,
          borderRadius: size * 0.2,
          background: dark ? UI_PALETTE.keyEdgeDark : UI_PALETTE.keyEdge,
          boxShadow: `0 ${size * 0.1 * (1 - press * 0.6)}px ${size * 0.22}px -${size * 0.06}px rgba(16,15,14,${dark ? 0.6 : 0.28})`,
        }}
      />
      {/* Face */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: sink,
          height: size,
          borderRadius: size * 0.2,
          background: `linear-gradient(180deg, ${dark ? UI_PALETTE.keyTopDark : UI_PALETTE.keyTop} 0%, ${dark ? UI_PALETTE.keyTopDarkEnd : UI_PALETTE.keyTopEnd} 100%)`,
          boxShadow: `inset 0 1px 0 ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.9)'}, inset 0 0 0 1px ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(16,15,14,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: dark ? UI_PALETTE.white : BRAND.text,
          gap: size * 0.02,
        }}
      >
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: size * 0.42, lineHeight: 1 }}>{label}</div>
        {sublabel !== undefined && (
          <div style={{ fontFamily: FONT_BODY, fontSize: size * 0.13, color: dark ? 'rgba(255,255,255,0.55)' : BRAND.textMuted, lineHeight: 1 }}>{sublabel}</div>
        )}
      </div>
    </div>
  )
}

export interface ShortcutComboProps {
  /** Touches, dans l'ordre d'appui. Défaut ['⌘', 'K']. */
  keys?: Array<ReactNode | { label: ReactNode; sublabel?: ReactNode; widthRatio?: number }>
  /** Frame où la première touche s'enfonce. Défaut 30. */
  at?: number
  /** Écart entre deux appuis (frames). Défaut 5. */
  pressStagger?: number
  /** Maintien de la combinaison après la dernière touche (frames). Défaut 10. */
  hold?: number
  /** Frame d'apparition des touches (cascade). Défaut at - 24. */
  appearAt?: number
  size?: number
  theme?: 'light' | 'dark'
  /** Affiche des "+" entre les touches. Défaut false. */
  plus?: boolean
  /** Légende sous la combinaison. */
  caption?: ReactNode
  style?: CSSProperties
}

/** Combinaison de touches jouée : cascade d'apparition, appuis enchaînés, relâche commune. */
export function ShortcutCombo({
  keys = ['⌘', 'K'],
  at = 30,
  pressStagger = 5,
  hold = 10,
  appearAt,
  size = 96,
  theme = 'light',
  plus = false,
  caption,
  style,
}: ShortcutComboProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const start = appearAt ?? at - 24
  const lastPress = at + (keys.length - 1) * pressStagger
  const captionIn = springPreset({ frame, fps, preset: 'smooth', delay: lastPress, durationInFrames: 20 })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.32, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.16 }}>
        {keys.map((k, i) => {
          const spec = typeof k === 'object' && k !== null && 'label' in (k as object) ? (k as { label: ReactNode; sublabel?: ReactNode; widthRatio?: number }) : { label: k as ReactNode }
          const pressFrame = at + i * pressStagger
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: size * 0.16 }}>
              {plus && i > 0 && (
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: size * 0.34,
                    color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : BRAND.textMuted,
                    opacity: springPreset({ frame, fps, preset: 'smooth', delay: start + i * 4 }),
                  }}
                >
                  +
                </div>
              )}
              <Keycap
                label={spec.label}
                sublabel={spec.sublabel}
                widthRatio={spec.widthRatio}
                size={size}
                theme={theme}
                appearAt={start + i * 4}
                pressAt={pressFrame}
                hold={lastPress - pressFrame + hold}
              />
            </div>
          )
        })}
      </div>
      {caption !== undefined && (
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: size * 0.22,
            fontWeight: 500,
            color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : BRAND.textMuted,
            opacity: captionIn,
            transform: `translateY(${(1 - captionIn) * 12}px)`,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  )
}
