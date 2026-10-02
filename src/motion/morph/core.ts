/**
 * Noyau des morphs de conteneur : keyframes -> état à une frame donnée.
 *
 * Chaque transition (keyframe i-1 -> i) est un ressort lancé à `at_i`.
 * Les grandeurs numériques se SUPERPOSENT (base + Σ delta_i * ressort_i) :
 * une transition interrompue par la suivante repart de sa position ET de sa
 * vitesse, comme un magic-move Keynote. Les couleurs et les poids de contenu
 * se mélangent séquentiellement (clampé 0..1).
 */
import { interpolateColors } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Rect centré dans un cadre (par défaut 1920 x 1080). */
export function centeredRect(width: number, height: number, frameW = 1920, frameH = 1080, dx = 0, dy = 0): Rect {
  return { x: (frameW - width) / 2 + dx, y: (frameH - height) / 2 + dy, width, height }
}

export interface MorphStyle {
  rect: Rect
  /** Rayon des coins (px). */
  radius?: number
  /** Couleur de fond (couleur CSS unie, interpolée). */
  background?: string
  /** Couleur de bordure 1px (couleur CSS, interpolée). `transparent` par défaut. */
  borderColor?: string
  /** Élévation 0..1 -> ombre portée. */
  elevation?: number
  /** Opacité globale du conteneur. */
  opacity?: number
}

export interface MorphKeyframe extends MorphStyle {
  /** Frame (relative à la Sequence) où la transition VERS cette keyframe démarre. Ignoré pour la 1re. */
  at: number
  /** Preset du ressort de cette transition. */
  preset?: SpringPresetName
  /** Force la durée du ressort (frames). */
  duration?: number
}

export interface MorphState {
  rect: Rect
  radius: number
  background: string
  borderColor: string
  elevation: number
  opacity: number
  /** Progression brute de chaque transition (index 0 = 0). */
  progress: number[]
  /** Poids de présence de chaque keyframe (somme = 1), pour le cross-fade de contenu. */
  weights: number[]
  /** Index de la keyframe dominante. */
  active: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export const DEFAULTS = {
  radius: 16,
  background: '#FFFFFF',
  borderColor: 'rgba(16,15,14,0)',
  elevation: 0.5,
  opacity: 1,
}

/** Progression de chaque transition à `frame`. */
export function keyframeProgress(keyframes: MorphKeyframe[], frame: number, fps: number, preset: SpringPresetName): number[] {
  return keyframes.map((k, i) =>
    i === 0 ? 0 : springPreset({ frame, fps, preset: k.preset ?? preset, delay: k.at, durationInFrames: k.duration })
  )
}

/** Mélange séquentiel (couleurs). */
function mixColors(values: string[], progress: number[]): string {
  let c = values[0]
  for (let i = 1; i < values.length; i++) {
    // La couleur mène légèrement la forme : le gris "boueux" du milieu dure moins.
    const p = clamp01(progress[i] * 1.3)
    if (p === 0) continue
    c = interpolateColors(p, [0, 1], [c, values[i]])
  }
  return c
}

/** Superposition additive (nombres). */
function sumNumbers(values: number[], progress: number[]): number {
  let v = values[0]
  for (let i = 1; i < values.length; i++) v += (values[i] - values[i - 1]) * progress[i]
  return v
}

export function evalMorph(keyframes: MorphKeyframe[], frame: number, fps: number, preset: SpringPresetName = 'morph'): MorphState {
  const progress = keyframeProgress(keyframes, frame, fps, preset)
  const pick = <K extends keyof MorphStyle>(key: K, fallback: NonNullable<MorphStyle[K]>): NonNullable<MorphStyle[K]>[] => {
    // Valeur manquante = celle de la keyframe précédente (héritage).
    const out: NonNullable<MorphStyle[K]>[] = []
    keyframes.forEach((k, i) => out.push((k[key] ?? (i === 0 ? fallback : out[i - 1])) as NonNullable<MorphStyle[K]>))
    return out
  }
  const rects = keyframes.map((k) => k.rect)
  const rect: Rect = {
    x: sumNumbers(rects.map((r) => r.x), progress),
    y: sumNumbers(rects.map((r) => r.y), progress),
    width: Math.max(0, sumNumbers(rects.map((r) => r.width), progress)),
    height: Math.max(0, sumNumbers(rects.map((r) => r.height), progress)),
  }
  const weights: number[] = keyframes.map((_, i) => (i === 0 ? 1 : 0))
  for (let i = 1; i < keyframes.length; i++) {
    const p = clamp01(progress[i])
    for (let j = 0; j < weights.length; j++) weights[j] *= 1 - p
    weights[i] += p
  }
  let active = 0
  weights.forEach((w, i) => {
    if (w > weights[active]) active = i
  })
  return {
    rect,
    radius: Math.max(0, sumNumbers(pick('radius', DEFAULTS.radius), progress)),
    background: mixColors(pick('background', DEFAULTS.background), progress),
    borderColor: mixColors(pick('borderColor', DEFAULTS.borderColor), progress),
    elevation: Math.max(0, sumNumbers(pick('elevation', DEFAULTS.elevation), progress)),
    opacity: clamp01(sumNumbers(pick('opacity', DEFAULTS.opacity), progress)),
    progress,
    weights,
    active,
  }
}

/** Vitesse (px/frame) du centre + des dimensions entre deux états. */
export function morphSpeed(a: MorphState, b: MorphState): number {
  const dc = Math.hypot(a.rect.x + a.rect.width / 2 - (b.rect.x + b.rect.width / 2), a.rect.y + a.rect.height / 2 - (b.rect.y + b.rect.height / 2))
  const ds = Math.abs(a.rect.width - b.rect.width) + Math.abs(a.rect.height - b.rect.height)
  return dc + ds * 0.2
}

/** Flou de mouvement : 0 en dessous d'un seuil, plafonné. */
export function motionBlurFromSpeed(speed: number, strength = 1, threshold = 8, max = 5): number {
  if (strength <= 0) return 0
  return Math.min(max * strength, Math.max(0, speed - threshold) * 0.04 * strength)
}

/** Ombre portée "papier" à partir d'une élévation 0..1. */
export function elevationShadow(e: number): string {
  if (e <= 0.001) return 'none'
  const k = Math.min(e, 1.5)
  return [
    `0 1px 2px 0 rgba(16,15,14,${(0.06 * Math.min(k, 1)).toFixed(3)})`,
    `0 ${(k * 26).toFixed(1)}px ${(k * 70).toFixed(1)}px -${(k * 26).toFixed(1)}px rgba(16,15,14,${(0.18 + 0.2 * Math.min(k, 1)).toFixed(3)})`,
  ].join(', ')
}

export type ContentFit = 'contain' | 'cover' | 'width' | 'height' | 'none'
export type ContentAnchor = 'center' | 'top' | 'top-left'

/** Échelle FLIP : contenu dessiné à sa taille native, mis à l'échelle sans distorsion. */
export function fitScale(fit: ContentFit, native: { width: number; height: number }, box: { width: number; height: number }): number {
  const sx = box.width / Math.max(1, native.width)
  const sy = box.height / Math.max(1, native.height)
  switch (fit) {
    case 'contain':
      return Math.min(sx, sy)
    case 'cover':
      return Math.max(sx, sy)
    case 'width':
      return sx
    case 'height':
      return sy
    default:
      return 1
  }
}

/** Position (left/top) d'un contenu mis à l'échelle dans la boîte. */
export function anchorOffset(anchor: ContentAnchor, scaled: { width: number; height: number }, box: { width: number; height: number }) {
  const left = anchor === 'top-left' ? 0 : (box.width - scaled.width) / 2
  const top = anchor === 'center' ? (box.height - scaled.height) / 2 : 0
  return { left, top }
}

/** Identifiant SVG sûr (React useId contient des ':'). */
export const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')
