/**
 * Caméra à l'épaule "humanisée" : ce qu'un bon cadreur ajoute sans le vouloir.
 *
 * Trois couches, toutes fonctions pures de la frame :
 *  1. Dérive : bruit @remotion/noise en 3 octaves (≈0.15-0.6 Hz de dérive +
 *     une bande "respiration" ≈1.2 Hz très faible) sur x, y, roulis, zoom.
 *     L'amplitude gonfle un peu avec la vitesse caméra (on bouge plus en
 *     marchant qu'à l'arrêt).
 *  2. Rattrapage (catch) : le cadreur suit la cible avec une inertie du
 *     second ordre. Pendant un mouvement il traîne un peu, au freinage il
 *     dépasse puis recale le cadre (petit dépassement + oscillation amortie).
 *     Modèle : e'' + 2ζω e' + ω² e = -x''(cible), intégré sur une fenêtre
 *     glissante de ~2 s (donc pur et borné en coût).
 *  3. Impacts : secousse amortie ponctuelle (drop, logo, clic fort), bâtie
 *     sur la réponse impulsionnelle des presets de ressorts.
 *
 * Usage :
 *   <Camera handheld="natural" keyframes={...}>…</Camera>
 *   <Handheld intensity="subtle" impacts={[impactShake(42, 0.8)]}>…</Handheld>
 *   const { x, y, rotate, zoom } = useHandheld({ intensity: 'energetic' })
 */
import type { CSSProperties, ReactNode } from 'react'
import { noise2D } from '@remotion/noise'
import { random, useCurrentFrame, useVideoConfig } from 'remotion'
import { dampedImpulse, presetOscillator, stepFollowerError } from '../physics/oscillator'
import { springPreset, type SpringPresetName } from '../physics/springs'
import type { CameraKeyframe, CameraPose } from './Camera'

// ---------------------------------------------------------------------------
// Types

export type HandheldIntensity = 'subtle' | 'natural' | 'energetic'

/** Décalage écran à appliquer par-dessus un cadrage. */
export interface HandheldOffset {
  /** px écran. */
  x: number
  y: number
  /** Roulis en degrés. */
  rotate: number
  /** Multiplicateur de zoom (1 = neutre, 1.004 = +0.4 %). */
  zoom: number
}

/** Secousse ponctuelle (voir `impactShake`). */
export interface ImpactShake {
  /** Frame de l'impact. */
  at: number
  /** 1 = accent franc (~16 px vertical). 0.3 = tap discret. */
  strength?: number
  /** Preset qui donne le caractère du rebond. Défaut 'jelly'. */
  preset?: SpringPresetName
  /** Accélère (>1) / ralentit (<1) l'oscillation. Défaut 2. */
  speed?: number
  /** Direction horizontale dominante : -1, 1, ou 0 (aléatoire déterministe). Défaut 0. */
  direction?: -1 | 0 | 1
}

export interface HandheldOptions {
  /** Préréglage. Défaut 'natural'. */
  intensity?: HandheldIntensity
  /** Amplitude de dérive en px écran (remplace le préréglage). */
  amplitude?: number
  /**
   * Amplitude de roulis en degrés (0 = jamais de rotation).
   * Chrome rastérise flou tout calque tourné, même de 0.01° : par défaut le
   * roulis n'existe que pendant les mouvements (masqué par le flou de bouge),
   * les impacts et les rattrapages, et retombe à 0 pile au repos (texte net).
   */
  rotation?: number
  /** Autorise le roulis de dérive même caméra immobile (texte légèrement flou). Défaut false. */
  rollAtRest?: boolean
  /** Amplitude de "respiration" du zoom, en fraction (0.004 = ±0.4 %). */
  zoom?: number
  /** Multiplicateur des fréquences de bruit. */
  speed?: number
  /** Gonflement de l'amplitude avec la vitesse caméra (0 = aucun). */
  swell?: number
  /** Force du rattrapage après un mouvement de caméra (0 = aucun). Ignoré hors <Camera>. */
  catch?: number
  /** Secousses ponctuelles. */
  impacts?: ImpactShake[]
  /** Graine du bruit (deux caméras avec la même graine bougent pareil). */
  seed?: string
}

interface ResolvedHandheld {
  amplitude: number
  rotation: number
  zoom: number
  speed: number
  swell: number
  catch: number
  catchMaxPx: number
  catchMaxZoom: number
}

/** Préréglages. Discrets par défaut : on doit le sentir, pas le voir. */
export const HANDHELD_PRESETS: Record<HandheldIntensity, ResolvedHandheld> = {
  subtle: { amplitude: 3, rotation: 0.06, zoom: 0.0025, speed: 0.85, swell: 0.6, catch: 0.6, catchMaxPx: 7, catchMaxZoom: 0.004 },
  natural: { amplitude: 5.5, rotation: 0.14, zoom: 0.004, speed: 1, swell: 1, catch: 1, catchMaxPx: 12, catchMaxZoom: 0.007 },
  energetic: { amplitude: 10, rotation: 0.28, zoom: 0.007, speed: 1.45, swell: 1.5, catch: 1.5, catchMaxPx: 20, catchMaxZoom: 0.012 },
}

/** Normalise `true | 'natural' | {…}` en options. `false`/undefined -> null. */
export function normalizeHandheld(h: boolean | HandheldIntensity | HandheldOptions | undefined): HandheldOptions | null {
  if (!h) return null
  if (h === true) return {}
  if (typeof h === 'string') return { intensity: h }
  return h
}

function resolve(opts: HandheldOptions): ResolvedHandheld {
  const p = HANDHELD_PRESETS[opts.intensity ?? 'natural']
  return {
    ...p,
    amplitude: opts.amplitude ?? p.amplitude,
    rotation: opts.rotation ?? p.rotation,
    zoom: opts.zoom ?? p.zoom,
    speed: opts.speed ?? p.speed,
    swell: opts.swell ?? p.swell,
    catch: opts.catch ?? p.catch,
  }
}

// ---------------------------------------------------------------------------
// 1. Dérive (bruit multi-octave)

/** Octaves : [fréquence Hz, poids]. Deux bandes de dérive + une de respiration. */
const OCTAVES: Array<[number, number]> = [
  [0.17, 1],
  [0.43, 0.42],
  [1.2, 0.09],
]
const OCTAVE_NORM = 1 / OCTAVES.reduce((s, [, w]) => s + w, 0)

/** Bruit fractal lisse dans ~[-1, 1] (en pratique rarement au-delà de ±0.7). */
function fbm(seed: string, t: number, speed: number): number {
  let v = 0
  for (let i = 0; i < OCTAVES.length; i++) {
    const [f, w] = OCTAVES[i]
    // Deuxième coordonnée décalée par octave : couches décorrélées.
    v += noise2D(`${seed}-${i}`, t * f * speed, i * 7.31) * w
  }
  // Le bruit simplex plafonne vers ±0.7 en pratique : on recentre sur ±1.
  return v * OCTAVE_NORM * 1.45
}

// ---------------------------------------------------------------------------
// 3. Impacts

/** Déclare une secousse d'impact (à passer dans `impacts`). */
export function impactShake(at: number, strength = 1, opts: Omit<ImpactShake, 'at' | 'strength'> = {}): ImpactShake {
  return { at, strength, ...opts }
}

/** Petit recalage doux, comme un cadreur qui reprend son cadre après une coupe ou un arrêt. */
export function settleShake(at: number, strength = 0.5): ImpactShake {
  return { at, strength, preset: 'bouncy', speed: 0.6 }
}

const IMPACT_PX_Y = 16
const IMPACT_PX_X = 8
const IMPACT_ROT = 0.3
const IMPACT_ZOOM = 0.012

/** Décalage d'une secousse à une frame donnée (pur). */
export function impactShakeAt(frame: number, fps: number, impact: ImpactShake, seed = 'impact'): HandheldOffset {
  const t = (frame - impact.at) / fps
  if (t <= 0) return { x: 0, y: 0, rotate: 0, zoom: 1 }
  const s = impact.strength ?? 1
  const speed = impact.speed ?? 2
  const main = presetOscillator(impact.preset ?? 'jelly', speed)
  const side = presetOscillator('bouncy', speed * 0.83)
  const roll = presetOscillator('whip', speed * 0.55)
  const dir = impact.direction || (random(`${seed}-${impact.at}`) < 0.5 ? -1 : 1)
  const y = dampedImpulse(t, main) * IMPACT_PX_Y * s
  const x = dampedImpulse(t, side, 0.6) * IMPACT_PX_X * s * dir
  const rotate = dampedImpulse(t, roll, 0.3) * IMPACT_ROT * s * -dir
  // Punch de zoom : une seule bosse amortie, pas de pompage.
  const zoom = 1 + Math.max(0, dampedImpulse(t, presetOscillator('snappy', speed * 0.7))) * IMPACT_ZOOM * s
  return { x, y, rotate, zoom }
}

// ---------------------------------------------------------------------------
// 2. Rattrapage après les keyframes de <Camera>

/** Oscillateur du cadreur : ~1.2 Hz, ζ≈0.44 (preset bouncy ralenti). */
const OPERATOR = (fps: number) => ({ osc: presetOscillator('bouncy', 0.55), windowFrames: Math.round(fps * 2.2) })

/**
 * Erreur de cadrage du cadreur à `frame`, pour une caméra à keyframes.
 * Renvoie le décalage écran (px), le roulis induit et le zoom.
 */
export function handheldCatchAt(
  frame: number,
  fps: number,
  resolved: Array<CameraKeyframe & { pose: CameraPose }>,
  defaultPreset: SpringPresetName,
  currentZoom: number,
  strength = 1,
  maxPx = 12,
  maxZoom = 0.007,
): HandheldOffset {
  if (strength <= 0 || resolved.length < 2) return { x: 0, y: 0, rotate: 0, zoom: 1 }
  const { osc, windowFrames } = OPERATOR(fps)
  const dt = 1 / fps
  let ex = 0
  let ey = 0
  let ez = 0
  for (let i = 1; i < resolved.length; i++) {
    const k = resolved[i]
    if (frame <= k.at) continue
    const a = resolved[i - 1].pose
    const b = k.pose
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = Math.log(b.zoom) - Math.log(a.zoom)
    if (Math.abs(dx) + Math.abs(dy) < 0.5 && Math.abs(dz) < 1e-4) continue
    const p = (f: number) => springPreset({ frame: f, fps, delay: k.at, preset: k.preset ?? defaultPreset, config: k.config, durationInFrames: k.durationInFrames })
    const start = Math.max(k.at - 1, frame - windowFrames)
    // Fenêtre entièrement après l'arrivée : plus rien à rattraper.
    if (start > k.at + 1 && Math.abs(1 - p(start)) < 3e-4 && Math.abs(p(start) - p(start - 1)) < 1e-5) continue
    const st = { e: 0, v: 0 }
    let p2 = p(start - 2)
    let p1 = p(start - 1)
    for (let f = start; f <= frame; f++) {
      const p0 = p(f)
      stepFollowerError(st, (p0 - 2 * p1 + p2) * fps * fps, osc, dt)
      p2 = p1
      p1 = p0
    }
    // e est en "fraction du mouvement" ; le cadre visé = cible + e.
    ex += st.e * dx
    ey += st.e * dy
    ez += st.e * dz
  }
  const gain = 0.035 * strength
  // Le contenu se déplace à l'opposé de la visée, à l'échelle du zoom courant.
  const soft = (v: number, max: number) => max * Math.tanh(v / max)
  const x = soft(-ex * currentZoom * gain, maxPx * Math.max(1, strength))
  const y = soft(-ey * currentZoom * gain, maxPx * Math.max(1, strength))
  const z = soft(ez * gain * 1.4, maxZoom * Math.max(1, strength))
  // Au rattrapage latéral, le poignet roule un peu.
  return { x, y, rotate: x * 0.012, zoom: Math.exp(z) }
}

// ---------------------------------------------------------------------------
// Combinaison

/**
 * Décalage "à l'épaule" à une frame (pur). `velocity` = vitesse écran de la
 * caméra en px/frame (gonfle la dérive), `catchOffset` = rattrapage précalculé.
 */
export function handheldAt(frame: number, fps: number, options: HandheldOptions = {}, velocity = 0, catchOffset?: HandheldOffset): HandheldOffset {
  const r = resolve(options)
  const seed = options.seed ?? 'handheld'
  const t = frame / fps
  const swell = 1 + r.swell * Math.min(1, Math.max(0, velocity) / 45)
  let x = fbm(`${seed}-x`, t, r.speed) * r.amplitude * swell
  let y = fbm(`${seed}-y`, t, r.speed) * r.amplitude * 0.8 * swell
  // Roulis de dérive : seulement en mouvement (voir `rotation`).
  const moving = options.rollAtRest ? 1 : smooth01(Math.max(0, velocity) / 18)
  let rotate = r.rotation ? fbm(`${seed}-r`, t, r.speed * 0.8) * r.rotation * swell * moving : 0
  let zoom = 1 + fbm(`${seed}-z`, t, r.speed * 0.6) * r.zoom
  if (catchOffset) {
    x += catchOffset.x
    y += catchOffset.y
    if (r.rotation) rotate += catchOffset.rotate
    zoom *= catchOffset.zoom
  }
  for (const imp of options.impacts ?? []) {
    const o = impactShakeAt(frame, fps, imp, seed)
    x += o.x
    y += o.y
    if (r.rotation) rotate += o.rotate
    zoom *= o.zoom
  }
  // Sous le seuil, le roulis est invisible mais coûterait la netteté.
  if (!options.rollAtRest && Math.abs(rotate) < ROLL_SNAP) rotate = 0
  return { x, y, rotate, zoom }
}

/** Roulis (deg) en dessous duquel on revient à 0 pile. */
const ROLL_SNAP = 0.012

const smooth01 = (v: number) => {
  const c = Math.min(1, Math.max(0, v))
  return c * c * (3 - 2 * c)
}

/** Hook : décalage "à l'épaule" de la frame courante. */
export function useHandheld(options: HandheldOptions & { velocity?: number } = {}): HandheldOffset {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return handheldAt(frame, fps, options, options.velocity ?? 0)
}

/** Hook : une seule secousse d'impact (x, y, rotate, zoom). */
export function useImpactShake(at: number, strength = 1, opts: Omit<ImpactShake, 'at' | 'strength'> = {}): HandheldOffset {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return impactShakeAt(frame, fps, impactShake(at, strength, opts))
}

/** CSS transform d'un décalage (autour du centre du conteneur). */
export function handheldTransform(o: HandheldOffset): string {
  const parts = [`translate(${o.x.toFixed(3)}px, ${o.y.toFixed(3)}px)`]
  if (Math.abs(o.rotate) > 0.0005) parts.push(`rotate(${o.rotate.toFixed(4)}deg)`)
  if (Math.abs(o.zoom - 1) > 1e-5) parts.push(`scale(${o.zoom.toFixed(5)})`)
  return parts.join(' ')
}

export interface HandheldProps extends HandheldOptions {
  children: ReactNode
  /** Vitesse du contenu en px/frame, si connue (gonfle la dérive). */
  velocity?: number
  /** Surdimensionne légèrement le contenu pour ne jamais voir les bords. Défaut 0 (aucun). */
  overscan?: number
  style?: CSSProperties
}

/**
 * <Handheld> : pose une caméra à l'épaule sur n'importe quel contenu plein
 * cadre (fond, fenêtre, plan). Sans keyframes : dérive + impacts.
 */
export function Handheld({ children, velocity, overscan = 0, style, ...options }: HandheldProps) {
  const o = useHandheld({ ...options, velocity })
  const scale = overscan > 0 ? ` scale(${1 + overscan})` : ''
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: handheldTransform(o) + scale }}>{children}</div>
    </div>
  )
}
