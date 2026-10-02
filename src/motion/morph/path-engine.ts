/**
 * Moteur de morph de chemins SVG.
 *
 * Principe : chaque forme (N sous-chemins) est aplatie via @remotion/paths
 * (parsePath -> reduceInstructions : M/L/C/Z), rééchantillonnée en un nombre
 * FIXE de points à abscisse curviligne constante, puis alignée sur la forme
 * précédente (sens de parcours + point de départ qui minimise la distance).
 * Les sous-chemins sont appariés par centroïde ; un sous-chemin sans partenaire
 * devient un point dégénéré (il "pousse" depuis ce point). Résultat : n'importe
 * quelle forme morphe vers n'importe quelle autre sans croisements.
 *
 * Tout est pur et mémoïsé : une "piste" se construit une fois, puis chaque
 * frame n'est qu'une combinaison linéaire de points.
 */
import { parsePath, reduceInstructions, type ReducedInstruction } from '@remotion/paths'

export type Pt = [number, number]

/** Un trait / contour échantillonné. */
export interface Poly {
  pts: Pt[]
  closed: boolean
}

// ---------------------------------------------------------------------------
// Aplatissement + rééchantillonnage
// ---------------------------------------------------------------------------

const CURVE_STEPS = 28

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

/** Découpe un `d` en polylignes fines (une par sous-chemin). */
export function flattenPath(d: string): Poly[] {
  const inst: ReducedInstruction[] = reduceInstructions(parsePath(d))
  const out: Poly[] = []
  let cur: Pt[] = []
  let start: Pt = [0, 0]
  let last: Pt = [0, 0]
  const flush = (closed: boolean) => {
    if (cur.length > 1) {
      // Un trait qui revient à son point de départ est un contour fermé.
      const loops = !closed && cur.length > 3 && dist(cur[0], cur[cur.length - 1]) < 1e-3
      if (loops) cur.pop()
      out.push({ pts: cur, closed: closed || loops })
    }
    cur = []
  }
  for (const i of inst) {
    if (i.type === 'M') {
      flush(false)
      start = [i.x, i.y]
      last = start
      cur = [start]
    } else if (i.type === 'L') {
      last = [i.x, i.y]
      cur.push(last)
    } else if (i.type === 'C') {
      const [x0, y0] = last
      for (let s = 1; s <= CURVE_STEPS; s++) {
        const t = s / CURVE_STEPS
        cur.push([cubicAt(x0, i.cp1x, i.cp2x, i.x, t), cubicAt(y0, i.cp1y, i.cp2y, i.y, t)])
      }
      last = [i.x, i.y]
    } else if (i.type === 'Z') {
      flush(true)
      last = start
      cur = [start]
    }
  }
  flush(false)
  return out
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Rééchantillonne une polyligne en `n` points équidistants. */
export function resample(poly: Poly, n: number): Pt[] {
  const src = poly.closed ? [...poly.pts, poly.pts[0]] : poly.pts
  const cum: number[] = [0]
  for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + dist(src[i - 1], src[i]))
  const total = cum[cum.length - 1]
  if (total === 0) return Array.from({ length: n }, () => [src[0][0], src[0][1]] as Pt)
  const out: Pt[] = []
  let seg = 1
  for (let k = 0; k < n; k++) {
    const target = poly.closed ? (k / n) * total : (k / (n - 1)) * total
    while (seg < src.length - 1 && cum[seg] < target) seg++
    const a = src[seg - 1]
    const b = src[seg]
    const span = cum[seg] - cum[seg - 1] || 1
    const t = Math.min(1, Math.max(0, (target - cum[seg - 1]) / span))
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

export function centroid(pts: Pt[]): Pt {
  let x = 0
  let y = 0
  for (const p of pts) {
    x += p[0]
    y += p[1]
  }
  return [x / pts.length, y / pts.length]
}

export function signedArea(pts: Pt[]) {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a / 2
}

function sqCost(a: Pt[], b: Pt[], offset: number) {
  const n = a.length
  let c = 0
  for (let i = 0; i < n; i++) {
    const q = b[(i + offset) % n]
    const dx = a[i][0] - q[0]
    const dy = a[i][1] - q[1]
    c += dx * dx + dy * dy
  }
  return c
}

/** Aligne `b` sur `a` : même sens, meilleur point de départ (fermé) ou meilleure direction (ouvert). */
export function align(a: Pt[], b: Pt[], closed: boolean): Pt[] {
  const n = a.length
  if (!closed) {
    const rev = [...b].reverse()
    return sqCost(a, rev, 0) < sqCost(a, b, 0) ? rev : b
  }
  let cand = b
  // Même orientation (horaire / anti-horaire), sauf contours dégénérés.
  const sa = signedArea(a)
  const sb = signedArea(b)
  if (Math.abs(sa) > 1e-6 && Math.abs(sb) > 1e-6 && Math.sign(sa) !== Math.sign(sb)) cand = [...b].reverse()
  let best = 0
  let bestCost = Infinity
  const step = n > 96 ? 2 : 1
  for (let o = 0; o < n; o += step) {
    const c = sqCost(a, cand, o)
    if (c < bestCost) {
      bestCost = c
      best = o
    }
  }
  return cand.map((_, i) => cand[(i + best) % n])
}

// ---------------------------------------------------------------------------
// Pistes multi-formes
// ---------------------------------------------------------------------------

/** Un "slot" = un contour suivi de forme en forme. */
export interface MorphSlot {
  closed: boolean
  /** Points par forme (même longueur pour toutes). */
  frames: Pt[][]
  /** 1 si le contour existe dans la forme, 0 s'il est dégénéré. */
  presence: number[]
}

export interface MorphTrack {
  slots: MorphSlot[]
  shapes: number
}

export interface BuildTrackOptions {
  /** Points par contour fermé. */
  samples?: number
  /** Points par trait ouvert. */
  openSamples?: number
}

const trackCache = new Map<string, MorphTrack>()

/**
 * Construit la piste qui relie une suite de formes. Chaque forme est une liste
 * de `d` (un ou plusieurs chemins, eux-mêmes multi sous-chemins acceptés).
 */
export function buildTrack(shapes: string[][], { samples = 180, openSamples = 72 }: BuildTrackOptions = {}): MorphTrack {
  const key = `${samples}|${openSamples}|${JSON.stringify(shapes)}`
  const hit = trackCache.get(key)
  if (hit) return hit

  const polys: Poly[][] = shapes.map((ds) => {
    const all = ds.flatMap(flattenPath)
    // Les grands contours d'abord : l'extérieur s'apparie avec l'extérieur.
    return all
      .map((p) => ({ p, area: p.closed ? Math.abs(signedArea(p.pts)) : 0, len: p.pts.length }))
      .sort((x, y) => y.area - x.area)
      .map((x) => x.p)
  })

  const slots: MorphSlot[] = []
  polys.forEach((shapePolys, si) => {
    const sampled = shapePolys.map((p) => ({ closed: p.closed, pts: resample(p, p.closed ? samples : openSamples) }))
    const used = new Set<number>()
    // Appariement glouton par centroïde (même type ouvert/fermé).
    const pairs: Array<[number, number, number]> = []
    sampled.forEach((s, pi) => {
      const c = centroid(s.pts)
      slots.forEach((slot, k) => {
        if (slot.closed !== s.closed) return
        const prev = slot.frames[si - 1]
        pairs.push([pi, k, dist(c, centroid(prev)) - (slot.presence[si - 1] ? 1e6 : 0)])
      })
    })
    pairs.sort((a, b) => a[2] - b[2])
    const assigned = new Map<number, number>()
    for (const [pi, k] of pairs) {
      if (assigned.has(pi) || used.has(k)) continue
      assigned.set(pi, k)
      used.add(k)
    }
    sampled.forEach((s, pi) => {
      const k = assigned.get(pi)
      if (k !== undefined) {
        const slot = slots[k]
        slot.frames[si] = align(slot.frames[si - 1], s.pts, s.closed)
        slot.presence[si] = 1
      } else {
        // Nouveau contour : dégénéré (point) dans toutes les formes précédentes.
        const c = centroid(s.pts)
        const n = s.pts.length
        const frames: Pt[][] = []
        const presence: number[] = []
        for (let j = 0; j < si; j++) {
          frames.push(Array.from({ length: n }, () => [c[0], c[1]] as Pt))
          presence.push(0)
        }
        frames.push(s.pts)
        presence.push(1)
        slots.push({ closed: s.closed, frames, presence })
        used.add(slots.length - 1)
      }
    })
    // Contours disparus : se replient sur leur centroïde.
    slots.forEach((slot, k) => {
      if (used.has(k)) return
      const prev = slot.frames[si - 1]
      const c = centroid(prev)
      slot.frames[si] = prev.map(() => [c[0], c[1]] as Pt)
      slot.presence[si] = 0
    })
  })

  const track = { slots, shapes: shapes.length }
  trackCache.set(key, track)
  return track
}

/**
 * Évalue la piste. `weights[i]` est la progression (ressort, peut dépasser 1)
 * de la transition forme i-1 -> forme i, pour i >= 1. Superposition additive :
 * une transition lancée avant la fin de la précédente s'enchaîne sans à-coup.
 */
export function evalSlot(slot: MorphSlot, weights: number[]): Pt[] {
  const base = slot.frames[0]
  const out = base.map((p) => [p[0], p[1]] as Pt)
  for (let i = 1; i < slot.frames.length; i++) {
    const w = weights[i] ?? 0
    if (w === 0) continue
    const a = slot.frames[i - 1]
    const b = slot.frames[i]
    for (let k = 0; k < out.length; k++) {
      out[k][0] += (b[k][0] - a[k][0]) * w
      out[k][1] += (b[k][1] - a[k][1]) * w
    }
  }
  return out
}

/** Présence (0..1) d'un slot : mélange séquentiel clampé. */
export function evalPresence(slot: MorphSlot, weights: number[]): number {
  let v = slot.presence[0]
  for (let i = 1; i < slot.presence.length; i++) {
    const w = Math.min(1, Math.max(0, weights[i] ?? 0))
    v = v + (slot.presence[i] - v) * w
  }
  return v
}

const f = (n: number) => (Math.round(n * 100) / 100).toString()

/** Polyligne -> `d`. Fermé : polygone. `smooth` : Catmull-Rom -> Bézier. */
export function toPathD(pts: Pt[], closed: boolean, smooth = false): string {
  if (pts.length === 0) return ''
  if (!smooth || pts.length < 3) {
    return `M${f(pts[0][0])} ${f(pts[0][1])}` + pts.slice(1).map((p) => `L${f(p[0])} ${f(p[1])}`).join('') + (closed ? 'Z' : '')
  }
  const n = pts.length
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  const end = closed ? n : n - 1
  for (let i = 0; i < end; i++) {
    const p0 = get(i - 1)
    const p1 = get(i)
    const p2 = get(i + 1)
    const p3 = get(i + 2)
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + (closed ? 'Z' : '')
}

/**
 * Morph ponctuel entre deux chemins, progression t (0..1, dépassement permis).
 * Plus robuste que interpolatePath de @remotion/paths quand les formes n'ont
 * rien en commun (cercle -> étoile -> logo).
 */
export function morphPath(t: number, from: string, to: string, options?: BuildTrackOptions): string {
  const track = buildTrack([[from], [to]], options)
  return track.slots
    .map((s) => toPathD(evalSlot(s, [0, t]), s.closed))
    .join(' ')
}
