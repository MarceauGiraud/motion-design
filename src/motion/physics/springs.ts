/**
 * Presets de ressorts : LE vocabulaire de mouvement du studio.
 *
 * Règle : aucun composant n'écrit de stiffness/damping en dur. Il choisit un
 * preset par son intention. Changer la sensation d'une vidéo entière, c'est
 * changer une ligne ici.
 */
import { spring, type SpringConfig } from 'remotion'

export type SpringPresetName = keyof typeof SPRINGS

export const SPRINGS = {
  /** Défaut. Arrivée douce, zéro rebond visible. Texte, cartes, UI. */
  smooth: { mass: 1, damping: 200, stiffness: 100, overshootClamping: false },
  /** Réactif, un soupçon de dépassement. Boutons, badges, pops. */
  snappy: { mass: 0.6, damping: 18, stiffness: 220, overshootClamping: false },
  /** Rebond franc, ludique. Icônes, notifications, emojis. */
  bouncy: { mass: 0.8, damping: 10, stiffness: 160, overshootClamping: false },
  /** Lourd et cinématique. Caméra, grandes surfaces, fenêtre plateforme. */
  heavy: { mass: 2.2, damping: 40, stiffness: 90, overshootClamping: false },
  /** Très lent, flottant. Fonds, halos, parallaxe. */
  gentle: { mass: 1.4, damping: 30, stiffness: 40, overshootClamping: false },
  /** Morphs et magic-move : précis, tenu, sans flottement final. */
  morph: { mass: 1, damping: 26, stiffness: 170, overshootClamping: false },
  /** Élastique, pour squash & stretch et gélatine. */
  jelly: { mass: 1, damping: 7, stiffness: 120, overshootClamping: false },
  /** Amortissement critique exact (c = 2·√(k·m)) : le plus rapide sans dépasser. Poursuites, suivi de cible. */
  critical: { mass: 1, damping: 24, stiffness: 144, overshootClamping: false },
  /** Fouet : très rapide, un seul petit dépassement. Aimants, snaps, clics. */
  whip: { mass: 0.5, damping: 13, stiffness: 320, overshootClamping: false },
} satisfies Record<string, SpringConfig>

export interface SpringOptions {
  frame: number
  fps: number
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** Frame de départ (le ressort vaut `from` avant). */
  delay?: number
  from?: number
  to?: number
  /** Étire le ressort pour qu'il dure exactement N frames. */
  durationInFrames?: number
  reverse?: boolean
}

/** spring() avec un preset nommé. */
export function springPreset({ frame, fps, preset = 'smooth', config, delay = 0, from = 0, to = 1, durationInFrames, reverse }: SpringOptions): number {
  return spring({
    frame: frame - delay,
    fps,
    config: { ...SPRINGS[preset], ...config },
    from,
    to,
    durationInFrames,
    reverse,
  })
}
