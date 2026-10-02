/**
 * stagger : retard (frames) de l'élément i dans un groupe.
 *
 *   stagger(i, 3)                                  -> i * 3
 *   stagger(i, 3, { count: 9, from: 'center' })    -> part du milieu
 *   stagger(i, 3, { count: 9, from: 'random', seed: 'grid' })
 */
import { random } from 'remotion'

export type StaggerFrom = 'start' | 'end' | 'center' | 'edges' | 'random' | number

export interface StaggerOptions {
  /** Nombre total d'éléments (requis pour end/center/edges/random). */
  count?: number
  /** Origine de la vague. Un nombre = index d'origine. */
  from?: StaggerFrom
  /** Graine de l'ordre aléatoire. */
  seed?: string | number
  /** Courbure : 1 = linéaire, <1 = les premiers s'espacent plus, >1 = accélère la fin. */
  ease?: number
  /** Retard ajouté à tous. */
  delay?: number
}

/** Rang (0..count-1, fractionnaire pour center/edges) de l'élément i. */
export function staggerRank(i: number, { count = i + 1, from = 'start', seed = 'stagger' }: StaggerOptions = {}): number {
  const last = Math.max(0, count - 1)
  if (typeof from === 'number') return Math.abs(i - from)
  switch (from) {
    case 'start':
      return i
    case 'end':
      return last - i
    case 'center':
      return Math.abs(i - last / 2)
    case 'edges':
      return last / 2 - Math.abs(i - last / 2)
    case 'random': {
      // Permutation stable : rang = position de i dans le tri par clé aléatoire.
      const key = (j: number) => random(`${seed}-${j}`)
      const mine = key(i)
      let rank = 0
      for (let j = 0; j < count; j++) {
        const k = key(j)
        if (k < mine || (k === mine && j < i)) rank++
      }
      return rank
    }
  }
}

/** Retard en frames de l'élément i (step frames entre deux rangs). */
export function stagger(i: number, step: number, opts: StaggerOptions = {}): number {
  const rank = staggerRank(i, opts)
  const ease = opts.ease ?? 1
  const shaped = ease === 1 ? rank : Math.pow(rank, ease)
  return (opts.delay ?? 0) + shaped * step
}
