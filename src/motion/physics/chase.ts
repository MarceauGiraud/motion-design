/**
 * Poursuite physique et mouvement secondaire, construits sur simulateSpring.
 *
 *  chase         : une valeur poursuit une liste de keyframes (cible en escalier),
 *                  critique par défaut -> aucun dépassement, arrivée la plus rapide.
 *  followThrough : une valeur secondaire suit une valeur primaire avec un retard
 *                  et un ressort plus mou (queue, antenne, ombre, badge accroché).
 *  followChain   : N maillons, chacun suivant le précédent (traînée, chaîne, cheveux).
 */
import type { SpringConfig } from 'remotion'
import { simulateSpring, type SpringState } from './simulate'
import { SPRINGS, type SpringPresetName } from './springs'

export interface ChaseKey {
  /** Frame à laquelle la cible saute sur `value`. */
  at: number
  value: number
}

export interface ChaseOptions {
  frame: number
  fps: number
  keys: readonly ChaseKey[]
  /** Défaut 'critical'. */
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  /** Cible glissante : interpole linéairement entre les keys au lieu de sauter. */
  glide?: boolean
}

/** Cible (sans physique) d'une liste de keyframes. */
export function keyTarget(keys: readonly ChaseKey[], frame: number, glide = false): number {
  if (keys.length === 0) return 0
  const sorted = [...keys].sort((a, b) => a.at - b.at)
  if (frame <= sorted[0].at) return sorted[0].value
  for (let i = sorted.length - 1; i >= 0; i--) {
    const k = sorted[i]
    if (frame >= k.at) {
      const next = sorted[i + 1]
      if (!glide || !next) return k.value
      const t = (frame - k.at) / Math.max(1e-6, next.at - k.at)
      return k.value + (next.value - k.value) * t
    }
  }
  return sorted[0].value
}

/** Valeur qui poursuit physiquement des keyframes. */
export function chase({ frame, fps, keys, preset = 'critical', config, glide = false }: ChaseOptions): SpringState {
  const sorted = [...keys].sort((a, b) => a.at - b.at)
  const start = sorted.length ? Math.min(0, sorted[0].at) : 0
  return simulateSpring({
    frame,
    fps,
    preset,
    config,
    startFrame: start,
    target: (f) => keyTarget(sorted, f, glide),
  })
}

export interface FollowThroughOptions {
  frame: number
  fps: number
  /** La valeur primaire, fonction pure de la frame. */
  driver: (frame: number) => number
  /** Retard (frames) avant que le secondaire "sente" le primaire. */
  lag?: number
  /** Défaut 'jelly' : dépasse et ondule après l'arrêt du primaire. */
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  startFrame?: number
}

/** Mouvement secondaire : suit `driver` avec retard et élasticité. */
export function followThrough({ frame, fps, driver, lag = 2, preset = 'jelly', config, startFrame = 0 }: FollowThroughOptions): SpringState {
  return simulateSpring({ frame, fps, preset, config, startFrame, target: (f) => driver(f - lag) })
}

/**
 * Chaîne de N maillons : le maillon k suit le maillon k-1 (le 0 suit driver),
 * chacun avec `lag` frames de retard. Intégration conjointe en une passe O(frame·N).
 * Retourne les N états, du plus proche au plus lointain.
 */
export function followChain({
  frame,
  fps,
  driver,
  links = 4,
  lag = 1,
  preset = 'snappy',
  config,
  startFrame = 0,
  substeps = 4,
}: FollowThroughOptions & { links?: number; substeps?: number }): SpringState[] {
  const { mass, damping, stiffness } = { ...SPRINGS[preset], ...config }
  const x0 = driver(startFrame)
  const x = new Array<number>(links).fill(x0)
  const v = new Array<number>(links).fill(0)
  const lagSteps = Math.max(0, Math.round(lag * substeps))
  // Historique des positions de chaque maillon (et du driver) par sous-pas.
  const hist: number[][] = Array.from({ length: links }, () => [])
  const dt = 1 / (fps * substeps)
  const total = Math.max(0, Math.round((frame - startFrame) * substeps))
  const prevFrameStep = Math.max(0, total - substeps)
  let prevValues = x.slice()
  const read = (arr: number[], i: number) => (i < 0 ? x0 : arr[Math.min(i, arr.length - 1)])
  for (let n = 0; n < total; n++) {
    if (n === prevFrameStep) prevValues = x.slice()
    const t = startFrame + n / substeps
    for (let k = 0; k < links; k++) {
      const target = k === 0 ? driver(t - lag) : read(hist[k - 1], n - lagSteps)
      const a = (-stiffness * (x[k] - target) - damping * v[k]) / mass
      v[k] += a * dt
      x[k] += v[k] * dt
    }
    for (let k = 0; k < links; k++) hist[k].push(x[k])
  }
  if (total < substeps) prevValues = new Array<number>(links).fill(x0)
  return x.map((value, k) => ({ value, velocity: value - prevValues[k] }))
}
