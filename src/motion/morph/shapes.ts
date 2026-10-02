/**
 * Bibliothèque de formes pour <ShapeMorph> / <MorphBlob>.
 * Toutes normalisées dans une boîte 0..100 (centrées), donc interchangeables.
 */
import { getBoundingBox, scalePath, translatePath } from '@remotion/paths'

/** Placeholder logo mark (same as SYMBOL_PATH in brand/logo-paths.ts). Any path works: it's refitted into the box. */
export const LOGO_MARK_PATH =
  'M14 18H54A14 14 0 0 1 68 32V72A14 14 0 0 1 54 86H14A14 14 0 0 1 0 72V32A14 14 0 0 1 14 18Z' +
  'M34 36A16 16 0 1 0 34 68A16 16 0 1 0 34 36Z'

const BOX = 100

/** Recadre n'importe quel `d` au centre d'une boîte 0..box, en gardant le ratio. */
export function fitPath(d: string, box = BOX, padding = 4): string {
  const bb = getBoundingBox(d)
  const inner = box - padding * 2
  const s = inner / Math.max(bb.width, bb.height)
  const scaled = scalePath(translatePath(d, -bb.x1, -bb.y1), s, s)
  return translatePath(scaled, padding + (inner - bb.width * s) / 2, padding + (inner - bb.height * s) / 2)
}

const r2 = (n: number) => Math.round(n * 1000) / 1000

/** Polygone régulier / étoile. `inner` = rayon intérieur relatif (1 = polygone). */
export function starPath(points = 5, inner = 0.46, rotation = -90, box = BOX, padding = 4): string {
  const c = box / 2
  const R = c - padding
  const n = inner === 1 ? points : points * 2
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const r = inner === 1 || i % 2 === 0 ? R : R * inner
    const a = ((rotation + (i * 360) / n) * Math.PI) / 180
    pts.push(`${r2(c + r * Math.cos(a))} ${r2(c + r * Math.sin(a))}`)
  }
  return `M${pts.join('L')}Z`
}

export function circlePath(cx = 50, cy = 50, r = 46): string {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`
}

/** Rectangle arrondi (rayon clampé). */
export function roundedRectPath(x: number, y: number, w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  if (r === 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  )
}

/** Squircle (superellipse n=4), l'icône iOS. */
export function squirclePath(box = BOX, padding = 4, n = 4, steps = 96): string {
  const c = box / 2
  const R = c - padding
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const ct = Math.cos(t)
    const st = Math.sin(t)
    const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * R
    const y = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * R
    pts.push(`${r2(c + x)} ${r2(c + y)}`)
  }
  return `M${pts.join('L')}Z`
}

/** Blob organique déterministe (somme de sinus). */
export function blobPath(seed = 1, wobble = 0.14, box = BOX, padding = 6, steps = 96): string {
  const c = box / 2
  const R = c - padding
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const k =
      1 -
      wobble +
      wobble * (0.55 * Math.sin(3 * t + seed) + 0.3 * Math.sin(5 * t + seed * 2.1) + 0.15 * Math.cos(2 * t - seed * 0.7))
    pts.push(`${r2(c + Math.cos(t) * R * k)} ${r2(c + Math.sin(t) * R * k)}`)
  }
  return `M${pts.join('L')}Z`
}

/** Étincelle 4 branches concave (l'icône "IA"). */
export function sparklePath(box = BOX, padding = 4, pinch = 0.16): string {
  const c = box / 2
  const R = c - padding
  const p = R * pinch
  return (
    `M${c} ${c - R}Q${c + p} ${c - p} ${c + R} ${c}Q${c + p} ${c + p} ${c} ${c + R}` +
    `Q${c - p} ${c + p} ${c - R} ${c}Q${c - p} ${c - p} ${c} ${c - R}Z`
  )
}

/** Cœur plein (lucide "heart" recadré). */
const HEART =
  'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z'

/** Bulle de message avec queue. */
const BUBBLE = 'M20 16H80A12 12 0 0 1 92 28V62A12 12 0 0 1 80 74H44L26 90V74H20A12 12 0 0 1 8 62V28A12 12 0 0 1 20 16Z'

export type ShapeName =
  | 'circle'
  | 'square'
  | 'squircle'
  | 'pill'
  | 'star'
  | 'hexagon'
  | 'triangle'
  | 'diamond'
  | 'sparkle'
  | 'heart'
  | 'blob'
  | 'bubble'
  | 'plus'
  | 'logo'

const factories: Record<ShapeName, () => string> = {
  circle: () => circlePath(),
  square: () => roundedRectPath(8, 8, 84, 84, 14),
  squircle: () => squirclePath(),
  pill: () => roundedRectPath(4, 30, 92, 40, 20),
  star: () => starPath(5, 0.46),
  hexagon: () => starPath(6, 1, -90),
  triangle: () => fitPath(starPath(3, 1, -90), BOX, 6),
  diamond: () => starPath(4, 1, -90, BOX, 2),
  sparkle: () => fitPath(sparklePath(), BOX, 4),
  heart: () => fitPath(HEART, BOX, 6),
  blob: () => blobPath(1.7),
  bubble: () => fitPath(BUBBLE, BOX, 6),
  plus: () =>
    'M38 8H62V38H92V62H62V92H38V62H8V38H38Z',
  logo: () => fitPath(LOGO_MARK_PATH, BOX, 4),
}

const cache = new Map<ShapeName, string>()

/** `d` d'une forme de la bibliothèque (boîte 0..100). */
export function shapePath(name: ShapeName): string {
  let d = cache.get(name)
  if (!d) {
    d = factories[name]()
    cache.set(name, d)
  }
  return d
}

export const SHAPE_NAMES = Object.keys(factories) as ShapeName[]

/** Nom de forme ou `d` brut (déjà dans une boîte 0..100, sinon passez-le par fitPath). */
export type ShapeInput = ShapeName | { d: string; fit?: boolean }

export function resolveShape(s: ShapeInput): string {
  if (typeof s === 'string') return shapePath(s)
  return s.fit === false ? s.d : fitPath(s.d)
}
