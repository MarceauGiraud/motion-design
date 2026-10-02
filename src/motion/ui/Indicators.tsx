/**
 * Indicateurs : <Badge> (pastille qui pop) et <ProgressRing> (anneau de
 * progression au dégradé de marque, compteur synchronisé).
 */
import { useId, type CSSProperties, type ReactNode } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, BRAND_RAMP, BRAND_RAMP_STOPS, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { UI_PALETTE } from './palette'

export type BadgeVariant = 'brand' | 'blue' | 'success' | 'warning' | 'danger' | 'neutral' | 'dark'

const BADGE_STYLES: Record<BadgeVariant, { bg: string; fg: string; ring: string }> = {
  brand: { bg: BRAND_RAMP, fg: UI_PALETTE.white, ring: BRAND.violet },
  blue: { bg: BRAND.blueSoft, fg: BRAND.blueDeep, ring: BRAND.blue },
  success: { bg: UI_PALETTE.successSoft, fg: UI_PALETTE.success, ring: UI_PALETTE.success },
  warning: { bg: UI_PALETTE.warningSoft, fg: UI_PALETTE.warning, ring: UI_PALETTE.warning },
  danger: { bg: UI_PALETTE.dangerSoft, fg: UI_PALETTE.danger, ring: UI_PALETTE.danger },
  neutral: { bg: UI_PALETTE.neutralSoft, fg: BRAND.text, ring: BRAND.textMuted },
  dark: { bg: BRAND.text, fg: UI_PALETTE.white, ring: BRAND.text },
}

export interface BadgeProps {
  /** Texte. Absent + `count` absent = simple pastille (dot). */
  label?: ReactNode
  /** Compteur animé (0 -> count) affiché à la place/à côté du label. */
  count?: number
  /** Frame du pop. Défaut 0. */
  at?: number
  until?: number
  variant?: BadgeVariant
  /** Icône à gauche. */
  icon?: ReactNode
  /** Taille de police (px). Défaut 16. */
  size?: number
  /** Onde qui pulse autour. Défaut false. */
  pulse?: boolean
  /** Preset du pop. Défaut 'bouncy'. */
  preset?: SpringPresetName
  style?: CSSProperties
}

/** Pastille / badge : pop élastique (scale + rotation de rattrapage), compteur, pulsation. */
export function Badge({ label, count, at = 0, until, variant = 'brand', icon, size = 16, pulse = false, preset = 'bouncy', style }: BadgeProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = springPreset({ frame, fps, preset, delay: at })
  const out = until === undefined ? 0 : springPreset({ frame, fps, preset: 'snappy', delay: until })
  const s = Math.max(0, pop - out)
  // Avant `at` : scale 0 mais la place est gardée (pas de saut de mise en page dans un flex).
  if (s <= 0.001 && out > 0.5) return null
  const c = BADGE_STYLES[variant]
  const n = count === undefined ? undefined : Math.round(count * springPreset({ frame, fps, preset: 'smooth', delay: at + 4, durationInFrames: 30 }))
  const dot = label === undefined && count === undefined
  const phase = ((frame - at) % 40) / 40
  const bgIsGradient = c.bg.startsWith('linear-gradient')
  return (
    <div style={{ position: 'relative', display: 'inline-flex', transform: `scale(${s}) rotate(${(1 - Math.min(1, pop)) * -12}deg)`, ...style }}>
      {pulse && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            border: `2px solid ${c.ring}`,
            transform: `scale(${1 + phase * 0.6})`,
            opacity: frame < at ? 0 : (1 - phase) * 0.6 * Math.min(1, pop),
          }}
        />
      )}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: size * 0.4,
          padding: dot ? 0 : `${size * 0.32}px ${size * 0.72}px`,
          width: dot ? size * 0.75 : undefined,
          height: dot ? size * 0.75 : undefined,
          borderRadius: 999,
          backgroundImage: bgIsGradient ? c.bg : undefined,
          backgroundColor: bgIsGradient ? undefined : c.bg,
          color: c.fg,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          boxShadow: variant === 'brand' || variant === 'dark' ? '0 6px 18px -6px rgba(128,2,159,0.45)' : `inset 0 0 0 1px ${c.ring}22`,
        }}
      >
        {icon}
        {n !== undefined && <span>{n.toLocaleString('fr-FR')}</span>}
        {label}
      </div>
    </div>
  )
}

export interface ProgressRingProps {
  /** Valeur cible 0..1. Défaut 0.72. */
  value?: number
  /** Valeur de départ 0..1. Défaut 0. */
  from?: number
  /** Frame de départ. Défaut 0. */
  at?: number
  /** Diamètre (px). Défaut 200. */
  size?: number
  /** Épaisseur (px). Défaut size * 0.08. */
  thickness?: number
  /** Preset du remplissage. Défaut 'heavy'. */
  preset?: SpringPresetName
  /** Durée forcée (frames). Défaut 45. */
  durationInFrames?: number
  /** Contenu central. Défaut : pourcentage animé. */
  label?: ReactNode
  /** Légende sous le pourcentage. */
  caption?: ReactNode
  /** Couleur de la piste. Défaut BRAND.border. */
  track?: string
  /** 'light' ou 'dark' (couleur du texte). Défaut 'light'. */
  theme?: 'light' | 'dark'
  style?: CSSProperties
}

/** Anneau de progression : arc dégradé en ressort, tête lumineuse, compteur synchronisé. */
export function ProgressRing({
  value = 0.72,
  from = 0,
  at = 0,
  size = 200,
  thickness,
  preset = 'heavy',
  durationInFrames = 45,
  label,
  caption,
  track = BRAND.border,
  theme = 'light',
  style,
}: ProgressRingProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const id = useId().replace(/:/g, '')
  const appear = springPreset({ frame, fps, preset: 'snappy', delay: at - 8 })
  const p = springPreset({ frame, fps, preset, delay: at, durationInFrames })
  const v = Math.max(0, Math.min(1.02, from + (value - from) * p))
  const t = thickness ?? size * 0.08
  const r = (size - t) / 2 - 2
  const c = size / 2
  const a = v * Math.PI * 2 - Math.PI / 2
  const head = { x: c + r * Math.cos(a), y: c + r * Math.sin(a) }
  const fg = theme === 'dark' ? UI_PALETTE.white : BRAND.text
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        transform: `scale(${0.85 + 0.15 * appear})`,
        opacity: interpolate(appear, [0, 0.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        ...style,
      }}
    >
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`pr${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BRAND_RAMP_STOPS[0]} />
            <stop offset="50%" stopColor={BRAND_RAMP_STOPS[1]} />
            <stop offset="100%" stopColor={BRAND_RAMP_STOPS[2]} />
          </linearGradient>
          <filter id={`prb${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={t * 0.6} />
          </filter>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={t} opacity={theme === 'dark' ? 0.25 : 1} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#pr${id})`}
          strokeWidth={t}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${Math.min(v, 0.9999)} 1`}
          transform={`rotate(-90 ${c} ${c})`}
        />
        {v > 0.01 && (
          <>
            <circle cx={head.x} cy={head.y} r={t * 0.9} fill={BRAND.violet} opacity={0.45} filter={`url(#prb${id})`} />
            <circle cx={head.x} cy={head.y} r={t * 0.28} fill={UI_PALETTE.white} opacity={0.9} />
          </>
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: fg }}>
        {label ?? (
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: size * 0.24, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {Math.round(Math.min(1, v) * 100)}
            <span style={{ fontSize: size * 0.12, marginLeft: 2, opacity: 0.6 }}>%</span>
          </div>
        )}
        {caption !== undefined && (
          <div style={{ fontFamily: FONT_BODY, fontSize: size * 0.075, marginTop: size * 0.03, color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : BRAND.textMuted }}>{caption}</div>
        )}
      </div>
    </div>
  )
}
