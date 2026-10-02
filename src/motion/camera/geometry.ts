/**
 * Géométrie partagée caméra / UI : rectangles, placement de la fenêtre
 * plateforme sur la scène, conversion coordonnées plateforme -> scène.
 */
import { PLATFORM_HEIGHT, PLATFORM_REGIONS, PLATFORM_WIDTH } from '../../kit/Platform'

/** Rectangle en px. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Point en px. */
export interface Point {
  x: number
  y: number
}

/**
 * Où est posée la <PlatformWindow> sur la scène (coin haut-gauche + largeur
 * affichée). La hauteur se déduit du ratio 1440x900.
 */
export interface PlatformPlacement {
  x: number
  y: number
  width: number
}

/** Placement centré d'une fenêtre de largeur `width` dans une scène WxH. */
export function centeredPlacement(width = 1600, stageWidth = 1920, stageHeight = 1080, offsetY = 0): PlatformPlacement {
  const height = (width / PLATFORM_WIDTH) * PLATFORM_HEIGHT
  return { x: (stageWidth - width) / 2, y: (stageHeight - height) / 2 + offsetY, width }
}

/** Échelle plateforme -> scène d'un placement. */
export const placementScale = (p: PlatformPlacement) => p.width / PLATFORM_WIDTH

/** Rectangle en coordonnées plateforme (1440x900) -> coordonnées scène. */
export function platformRectToStage(rect: Rect, placement: PlatformPlacement): Rect {
  const s = placementScale(placement)
  return { x: placement.x + rect.x * s, y: placement.y + rect.y * s, w: rect.w * s, h: rect.h * s }
}

/** Point en coordonnées plateforme -> coordonnées scène. */
export function platformPointToStage(point: Point, placement: PlatformPlacement): Point {
  const s = placementScale(placement)
  return { x: placement.x + point.x * s, y: placement.y + point.y * s }
}

/** Centre d'un rectangle. */
export const rectCenter = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

/** Agrandit un rectangle de `pad` px de chaque côté. */
export const inflate = (r: Rect, pad: number): Rect => ({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 })

/** Interpolation linéaire de deux rectangles (t non clampé : garde l'overshoot du ressort). */
export const mixRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
})

/** Notable regions of the placeholder app, computed from its layout (see src/kit/Platform.tsx). */
export { PLATFORM_REGIONS }
