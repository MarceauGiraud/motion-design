/**
 * Curseur macOS scripté : trajectoires courbes en ressort entre waypoints,
 * clic (enfoncement + onde), main au survol, inclinaison liée à la vitesse.
 */
import type { CSSProperties } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND } from '../tokens'
import { UI_PALETTE } from './palette'
import { ClickRipple } from './ClickRipple'

export interface CursorWaypoint {
  /** Frame d'ARRIVÉE sur ce point (le déplacement se termine ici). */
  at: number
  x: number
  y: number
  /** Clique en arrivant. */
  click?: boolean
  /** Affiche la main (lien/bouton) une fois arrivé. */
  hand?: boolean
  /** Durée du trajet vers ce point (frames). Défaut : selon la distance (12..28). */
  travel?: number
  /** Courbure du trajet (-1..1, 0 = droit). Défaut 0.18. */
  bend?: number
}

export interface CursorProps {
  /** Waypoints en coordonnées du conteneur (scène). */
  waypoints: CursorWaypoint[]
  /** Taille du curseur en px (hauteur de la flèche). Défaut 28. */
  size?: number
  /** Frame d'apparition (fondu + scale). Défaut : 12 frames avant le 1er waypoint. */
  appearAt?: number
  /** Frame de disparition. */
  hideAt?: number
  /** Preset du déplacement. Défaut 'morph' (précis, micro-dépassement). */
  preset?: SpringPresetName
  /** Onde de clic. Défaut true. */
  ripple?: boolean
  /** Couleur de l'onde. Défaut BRAND.blue. */
  rippleColor?: string
  /** Force la main pendant toute la durée. */
  hand?: boolean
  /** Flou de vitesse. Défaut true. */
  motionBlur?: boolean
  style?: CSSProperties
}

export interface CursorState {
  x: number
  y: number
  /** Vitesse px/frame. */
  vx: number
  vy: number
  /** Enfoncement du clic 0..1. */
  press: number
  /** Index du dernier waypoint atteint (-1 avant). */
  index: number
}

const bezier = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b

function travelFrames(wp: CursorWaypoint, prev: CursorWaypoint): number {
  if (wp.travel !== undefined) return wp.travel
  const d = Math.hypot(wp.x - prev.x, wp.y - prev.y)
  return Math.round(Math.min(28, Math.max(12, 10 + d / 55)))
}

function positionAt(frame: number, fps: number, wps: CursorWaypoint[], preset: SpringPresetName): { x: number; y: number } {
  let x = wps[0].x
  let y = wps[0].y
  for (let i = 1; i < wps.length; i++) {
    const a = wps[i - 1]
    const b = wps[i]
    const dur = travelFrames(b, a)
    const p = springPreset({ frame, fps, preset, delay: b.at - dur, durationInFrames: dur })
    if (p <= 0) break
    // Point de contrôle décalé perpendiculairement : arc naturel du poignet.
    const bend = b.bend ?? 0.18
    const mx = (a.x + b.x) / 2 - (b.y - a.y) * bend
    const my = (a.y + b.y) / 2 + (b.x - a.x) * bend
    const t = Math.min(1, p)
    const over = p - t // dépassement du ressort, prolongé dans la direction d'arrivée
    x = bezier(a.x, mx, b.x, t) + (b.x - mx) * over * 2
    y = bezier(a.y, my, b.y, t) + (b.y - my) * over * 2
  }
  return { x, y }
}

/** État du curseur à la frame courante (position, vitesse, clic). */
export function useCursorState(waypoints: CursorWaypoint[], preset: SpringPresetName = 'morph'): CursorState {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const wps = [...waypoints].sort((a, b) => a.at - b.at)
  const cur = positionAt(frame, fps, wps, preset)
  const prev = positionAt(frame - 1, fps, wps, preset)
  let press = 0
  let index = -1
  for (let i = 0; i < wps.length; i++) {
    const w = wps[i]
    if (frame >= w.at) index = i
    if (!w.click) continue
    const down = springPreset({ frame, fps, preset: 'snappy', delay: w.at - 2 })
    const up = springPreset({ frame, fps, preset: 'snappy', delay: w.at + 3 })
    press = Math.max(press, down - up)
  }
  return { x: cur.x, y: cur.y, vx: cur.x - prev.x, vy: cur.y - prev.y, press, index }
}

/** Flèche macOS (noire, liseré blanc). Pointe en (0,0). */
export function ArrowGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size * 0.72} height={size} viewBox="0 0 20 28" style={{ display: 'block', overflow: 'visible' }}>
      <path d="M1.5 1.5 L1.5 22.5 L6.6 17.7 L9.9 25.6 L13.6 24.1 L10.4 16.4 L17.3 16.4 Z" fill={BRAND.text} stroke={UI_PALETTE.white} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}

/** Main "pointer" macOS. Pointe de l'index vers (≈6,1). */
export function HandGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size * 0.86} height={size} viewBox="0 0 24 28" style={{ display: 'block', overflow: 'visible' }}>
      <path
        d="M7.2 2.2c1.1 0 2 .9 2 2v7.1l.6-.1c.3-.9 1.1-1.5 2-1.5 1 0 1.8.7 2 1.6.4-.5 1-.8 1.7-.8 1 0 1.9.8 2 1.8.4-.3.9-.5 1.4-.5 1.2 0 2.1 1 2.1 2.2v5.6c0 4.3-3 7.6-7.2 7.6h-2.1c-2.3 0-4.1-1-5.4-2.9l-4.1-6c-.6-.9-.4-2.1.5-2.7.8-.5 1.9-.4 2.5.4l.9 1.2V4.2c0-1.1.9-2 2-2z"
        fill={UI_PALETTE.white}
        stroke={BRAND.text}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M11.4 17.4v4.6M14.4 17.4v4.6M17.4 17.4v4.6" stroke={BRAND.text} strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  )
}

/**
 * <Cursor waypoints={[{ at: 0, x: 400, y: 600 }, { at: 40, x: 1500, y: 150, click: true, hand: true }]} />
 * À poser dans le même repère que le contenu (ex. dans <Camera> pour suivre le zoom).
 */
export function Cursor({
  waypoints,
  size = 28,
  appearAt,
  hideAt,
  preset = 'morph',
  ripple = true,
  rippleColor = BRAND.blue,
  hand,
  motionBlur = true,
  style,
}: CursorProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const wps = [...waypoints].sort((a, b) => a.at - b.at)
  const state = useCursorState(wps, preset)
  if (wps.length === 0) return null

  const start = appearAt ?? wps[0].at - 12
  const show = springPreset({ frame, fps, preset: 'snappy', delay: start })
  const hide = hideAt === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: hideAt })
  const visible = Math.max(0, show - hide)
  if (visible <= 0.001) return null

  const speed = Math.hypot(state.vx, state.vy)
  // Inclinaison de suivi : la flèche "traîne" légèrement dans les virages.
  const tilt = Math.max(-10, Math.min(10, state.vx * 0.35))
  const blur = motionBlur ? Math.min(1.6, Math.max(0, (speed - 14) * 0.05)) : 0
  const current = state.index >= 0 ? wps[state.index] : undefined
  const handOn = hand ?? (current?.hand === true && speed < 6)
  const scale = (0.6 + 0.4 * visible) * (1 - 0.14 * state.press)

  return (
    <>
      {ripple &&
        wps.filter((w) => w.click).map((w, i) => <ClickRipple key={i} at={w.at} x={w.x} y={w.y} color={rippleColor} />)}
      <div
        style={{
          position: 'absolute',
          left: state.x,
          top: state.y,
          opacity: interpolate(visible, [0, 1], [0, 1]),
          transformOrigin: '0 0',
          transform: `translate(${handOn ? -size * 0.24 : -size * 0.05}px, ${handOn ? -size * 0.06 : -size * 0.05}px) rotate(${tilt}deg) scale(${scale})`,
          filter: `drop-shadow(0 ${2 + state.press}px ${3}px rgba(0,0,0,0.28))${blur > 0.05 ? ` blur(${blur.toFixed(2)}px)` : ''}`,
          zIndex: 1000,
          pointerEvents: 'none',
          ...style,
        }}
      >
        {handOn ? <HandGlyph size={size} /> : <ArrowGlyph size={size} />}
      </div>
    </>
  )
}
