/**
 * Outils de boucle parfaite pour les fonds.
 *
 * Astuce : on échantillonne le bruit sur un CERCLE dans deux dimensions
 * supplémentaires. frame = 0 et frame = loopFrames tombent au même point,
 * donc le fond boucle sans couture, quelle que soit la durée de la vidéo.
 */
import { noise4D } from '@remotion/noise'

export type BackgroundTheme = 'light' | 'dark'

/** Phase de boucle en radians, 0 -> 2π sur `loopFrames`. */
export function loopAngle(frame: number, loopFrames: number): number {
  return ((((frame % loopFrames) + loopFrames) % loopFrames) / loopFrames) * Math.PI * 2
}

/**
 * Bruit de Perlin qui boucle sur `loopFrames`. Retourne [-1, 1].
 * `radius` règle la quantité de variation par boucle (plus grand = plus agité).
 */
export function loopNoise(seed: string | number, x: number, y: number, frame: number, loopFrames: number, radius = 0.6): number {
  const a = loopAngle(frame, loopFrames)
  return noise4D(seed, x, y, Math.cos(a) * radius, Math.sin(a) * radius)
}

/** Hex '#RRGGBB' -> 'rgba(r,g,b,a)'. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Id SVG sûr à partir de useId() (React 19 renvoie des caractères spéciaux). */
export function svgId(raw: string, prefix: string): string {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
}
