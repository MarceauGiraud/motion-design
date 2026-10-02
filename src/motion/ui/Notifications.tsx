/**
 * Notifications façon macOS : <Toast> (une carte) et <NotificationStack>
 * (pile qui pousse les anciennes vers le bas quand une nouvelle arrive).
 */
import type { CSSProperties, ReactNode } from 'react'
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset } from '../physics/springs'
import { ASSETS, BRAND, FONT_BODY } from '../tokens'
import { UI_PALETTE } from './palette'

export interface NotificationContent {
  title: ReactNode
  body?: ReactNode
  /** Nom de l'app en en-tête. Défaut 'Acme'. */
  app?: string
  /** Horodatage à droite. Défaut 'maintenant'. */
  time?: string
  /** Icône : chemin public (staticFile) ou nœud React. Défaut logo. */
  icon?: string | ReactNode
  /** Vignette à droite (ex. photo de contact) : chemin public. */
  thumbnail?: string
}

export interface NotificationCardProps extends NotificationContent {
  /** Largeur (px). Défaut 460. */
  width?: number
  /** 'light' (défaut) ou 'dark'. */
  theme?: 'light' | 'dark'
  style?: CSSProperties
}

/** Carte de notification statique (sans animation). */
export function NotificationCard({ title, body, app = 'Acme', time = 'maintenant', icon, thumbnail, width = 460, theme = 'light', style }: NotificationCardProps) {
  const dark = theme === 'dark'
  const iconNode =
    icon === undefined || typeof icon === 'string' ? (
      <Img delayRenderTimeoutInMilliseconds={8000} delayRenderRetries={3} src={staticFile(typeof icon === 'string' ? icon : ASSETS.logo)} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'contain' }} />
    ) : (
      icon
    )
  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 22,
        background: dark ? UI_PALETTE.glassDark : UI_PALETTE.glassLight,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(16,15,14,0.06)'}`,
        backdropFilter: 'blur(24px) saturate(1.6)',
        boxShadow: '0 1px 1px rgba(16,15,14,0.05), 0 14px 36px -10px rgba(16,15,14,0.28)',
        fontFamily: FONT_BODY,
        color: dark ? UI_PALETTE.white : BRAND.text,
        ...style,
      }}
    >
      <div style={{ flexShrink: 0, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{iconNode}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ flex: 1, fontSize: 16.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.55)' : BRAND.textMuted, flexShrink: 0 }}>{time}</div>
        </div>
        {body !== undefined && (
          <div style={{ fontSize: 15.5, lineHeight: 1.35, marginTop: 2, color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(16,15,14,0.78)' }}>{body}</div>
        )}
        <div style={{ fontSize: 12.5, marginTop: 3, color: dark ? 'rgba(255,255,255,0.45)' : BRAND.textMuted, letterSpacing: '0.01em' }}>{app}</div>
      </div>
      {thumbnail && <Img delayRenderTimeoutInMilliseconds={8000} delayRenderRetries={3} src={staticFile(thumbnail)} style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />}
    </div>
  )
}

export interface ToastProps extends NotificationCardProps {
  /** Frame d'arrivée. */
  at: number
  /** Frame de départ (glisse hors champ). */
  until?: number
  /** Côté d'où la carte arrive. Défaut 'right'. */
  from?: 'right' | 'top' | 'left' | 'bottom'
  /** Distance parcourue à l'entrée (px). Défaut 480. */
  distance?: number
}

/** Transform + opacité d'entrée/sortie d'une notification (ressort 'bouncy' amorti en entrée). */
function useToastMotion(at: number, until: number | undefined, from: ToastProps['from'], distance: number) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = springPreset({ frame, fps, preset: 'bouncy', delay: at, config: { damping: 14 } })
  const exit = until === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: until, durationInFrames: 18 })
  const off = (1 - enter) * distance + exit * distance
  const dir = from ?? 'right'
  const tx = dir === 'right' ? off : dir === 'left' ? -off : 0
  const ty = dir === 'bottom' ? off : dir === 'top' ? -off : 0
  const scale = 0.9 + 0.1 * Math.min(1.02, enter)
  const opacity = interpolate(enter, [0, 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (1 - exit)
  return { transform: `translate(${tx}px, ${ty}px) scale(${scale})`, opacity, visible: frame >= at && exit < 0.999 }
}

/** Une notification qui arrive en ressort et repart. Position : via `style` (absolute conseillé). */
export function Toast({ at, until, from = 'right', distance = 480, style, ...card }: ToastProps) {
  const m = useToastMotion(at, until, from, distance)
  if (!m.visible) return null
  return (
    <div style={{ transformOrigin: '100% 0%', ...style, transform: m.transform, opacity: m.opacity * Number(style?.opacity ?? 1) }}>
      <NotificationCard {...card} />
    </div>
  )
}

export interface NotificationItem extends NotificationContent {
  /** Frame d'arrivée. */
  at: number
  /** Frame de retrait individuel. */
  until?: number
}

export interface NotificationStackProps {
  items: NotificationItem[]
  /** Coin d'ancrage. Défaut 'top-right'. */
  anchor?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** Marge au bord (px). Défaut 36. */
  margin?: number
  width?: number
  /** Hauteur estimée d'une carte (px) pour l'empilement. Défaut 96. */
  itemHeight?: number
  gap?: number
  /** Nombre max de cartes visibles, les plus anciennes s'effacent. Défaut 4. */
  maxVisible?: number
  /** 'list' (cartes espacées) ou 'stack' (iOS : cartes tassées derrière). Défaut 'list'. */
  mode?: 'list' | 'stack'
  theme?: 'light' | 'dark'
  style?: CSSProperties
}

/**
 * Pile de notifications. La plus récente est au bord ; chaque arrivée pousse
 * les autres d'un cran en ressort 'snappy'.
 */
export function NotificationStack({
  items,
  anchor = 'top-right',
  margin = 36,
  width = 460,
  itemHeight = 96,
  gap = 12,
  maxVisible = 4,
  mode = 'list',
  theme = 'light',
  style,
}: NotificationStackProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sorted = [...items].sort((a, b) => a.at - b.at)
  const top = anchor.startsWith('top')
  const right = anchor.endsWith('right')
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}>
      {sorted.map((it, i) => {
        // Rang = nombre (continu) de notifications plus récentes déjà arrivées.
        let rank = 0
        for (let j = i + 1; j < sorted.length; j++) {
          const pushed = springPreset({ frame, fps, preset: 'snappy', delay: sorted[j].at })
          const gone = sorted[j].until === undefined ? 0 : springPreset({ frame, fps, preset: 'snappy', delay: sorted[j].until! + 6 })
          rank += pushed - gone
        }
        const step = mode === 'stack' ? 12 : itemHeight + gap
        const offset = rank * step
        const scale = mode === 'stack' ? 1 - Math.min(rank, 3) * 0.05 : 1
        const fade = interpolate(rank, [maxVisible - 1, maxVisible], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const stackFade = mode === 'stack' ? interpolate(rank, [0, 3], [1, 0.55], { extrapolateRight: 'clamp' }) : 1
        return (
          <Toast
            key={i}
            {...it}
            width={width}
            theme={theme}
            from={right ? 'right' : 'left'}
            style={{
              position: 'absolute',
              [top ? 'top' : 'bottom']: margin + offset,
              [right ? 'right' : 'left']: margin,
              opacity: fade * stackFade,
              zIndex: i + 1,
              scale: String(scale),
              transformOrigin: top ? '50% 0%' : '50% 100%',
            }}
          />
        )
      })}
    </div>
  )
}
