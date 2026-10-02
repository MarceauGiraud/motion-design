/**
 * Vocabulaire des apparitions : une progression p (0 -> 1, peut dépasser avec
 * un ressort qui rebondit) devient un style. Fonction pure, réutilisable hors
 * composant (ex. dans un layout calculé à la main).
 */
import type { CSSProperties } from 'react'
import { interpolate } from 'remotion'
import { joinFilters, motionBlurFilter } from '../physics/deform'
import type { SpringPresetName } from '../physics/springs'

export type RevealVariant =
  | 'fadeUp'
  | 'fadeDown'
  | 'fade'
  | 'scale'
  | 'blur'
  | 'slideLeft'
  | 'slideRight'
  | 'pop'
  | 'clipUp'
  | 'rotateIn'
  | 'flipUp'

export const REVEAL_VARIANTS: readonly RevealVariant[] = [
  'fadeUp',
  'fadeDown',
  'fade',
  'scale',
  'blur',
  'slideLeft',
  'slideRight',
  'pop',
  'clipUp',
  'rotateIn',
  'flipUp',
]

/** Preset naturel de chaque variante (surchargeable). */
export const VARIANT_PRESET: Record<RevealVariant, SpringPresetName> = {
  fadeUp: 'smooth',
  fadeDown: 'smooth',
  fade: 'smooth',
  scale: 'smooth',
  blur: 'smooth',
  slideLeft: 'morph',
  slideRight: 'morph',
  pop: 'bouncy',
  clipUp: 'morph',
  rotateIn: 'snappy',
  flipUp: 'snappy',
}

/** Distance par défaut (px) des variantes qui se déplacent. */
export const VARIANT_DISTANCE: Record<RevealVariant, number> = {
  fadeUp: 40,
  fadeDown: 40,
  fade: 0,
  scale: 0,
  blur: 0,
  slideLeft: 120,
  slideRight: 120,
  pop: 0,
  clipUp: 0,
  rotateIn: 30,
  flipUp: 30,
}

export interface RevealStyleOptions {
  /** Distance de déplacement (px). Défaut : VARIANT_DISTANCE. */
  distance?: number
  /** Vitesse de p (par frame) pour le motion blur. */
  velocity?: number
  /** Active le flou de mouvement (facteur multiplicatif, 1 = normal). */
  motionBlur?: number | boolean
}

export interface RevealStyles {
  /** Style du conteneur (masque de clipUp, perspective). */
  outer: CSSProperties
  /** Style de l'élément animé. */
  inner: CSSProperties
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** Opacité : arrive vite (60 % de la course), jamais au-delà de 1. */
const fadeIn = (p: number, end = 0.6) => clamp01(interpolate(p, [0, end], [0, 1]))

/** Style d'une variante à la progression p. */
export function revealStyle(variant: RevealVariant, p: number, opts: RevealStyleOptions = {}): RevealStyles {
  const d = opts.distance ?? VARIANT_DISTANCE[variant]
  const q = 1 - p // reste à parcourir
  const blurFactor = opts.motionBlur === true ? 1 : opts.motionBlur === false || opts.motionBlur === undefined ? 0 : opts.motionBlur
  // Vitesse en px/frame de la partie translatée (pour le flou).
  const pxVel = (opts.velocity ?? 0) * Math.max(d, 60)
  const mb = blurFactor > 0 ? motionBlurFilter(pxVel * blurFactor) : undefined

  switch (variant) {
    case 'fade':
      return { outer: {}, inner: { opacity: fadeIn(p, 1) } }
    case 'fadeUp':
      return { outer: {}, inner: { opacity: fadeIn(p), transform: `translateY(${q * d}px)`, filter: mb } }
    case 'fadeDown':
      return { outer: {}, inner: { opacity: fadeIn(p), transform: `translateY(${-q * d}px)`, filter: mb } }
    case 'slideLeft':
      return { outer: {}, inner: { opacity: fadeIn(p, 0.5), transform: `translateX(${q * d}px)`, filter: mb } }
    case 'slideRight':
      return { outer: {}, inner: { opacity: fadeIn(p, 0.5), transform: `translateX(${-q * d}px)`, filter: mb } }
    case 'scale':
      return { outer: {}, inner: { opacity: fadeIn(p), transform: `scale(${0.86 + 0.14 * p})` } }
    case 'blur': {
      const b = Math.max(0, q) * 18
      return {
        outer: {},
        inner: { opacity: fadeIn(p, 0.8), transform: `scale(${1.06 - 0.06 * p})`, filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined },
      }
    }
    case 'pop':
      return { outer: {}, inner: { opacity: fadeIn(p, 0.25), transform: `scale(${Math.max(0, p)})` } }
    case 'clipUp':
      // Masque fixe, contenu qui monte de sous la ligne.
      return {
        outer: { overflow: 'hidden' },
        inner: { transform: `translateY(${q * 105}%)`, filter: mb },
      }
    case 'rotateIn':
      return {
        outer: {},
        inner: {
          opacity: fadeIn(p, 0.5),
          transform: `translateY(${q * d}px) rotate(${q * -9}deg) scale(${0.94 + 0.06 * p})`,
          transformOrigin: '0% 100%',
          filter: mb,
        },
      }
    case 'flipUp':
      return {
        outer: { perspective: 1100 },
        inner: {
          opacity: fadeIn(p, 0.5),
          transform: `translateY(${q * d}px) rotateX(${q * 80}deg)`,
          transformOrigin: '50% 100%',
          backfaceVisibility: 'hidden',
        },
      }
  }
}

/** Fusionne un style utilisateur avec un style de variante (filtres concaténés). */
export function mergeStyle(base: CSSProperties | undefined, anim: CSSProperties): CSSProperties {
  return {
    ...base,
    ...anim,
    transform: [base?.transform, anim.transform].filter(Boolean).join(' ') || undefined,
    filter: joinFilters(base?.filter as string | undefined, anim.filter as string | undefined),
    opacity: anim.opacity === undefined ? base?.opacity : (anim.opacity as number) * ((base?.opacity as number | undefined) ?? 1),
  }
}
