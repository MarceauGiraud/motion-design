/**
 * Oscillateurs amortis dérivés des presets de ressorts.
 *
 * Même vocabulaire que SPRINGS (aucune constante en dur) : on lit masse,
 * raideur et amortissement d'un preset pour en tirer pulsation propre et
 * taux d'amortissement, puis on évalue la réponse analytiquement (pur, O(1)).
 * `timeScale` accélère (>1) ou ralentit (<1) l'oscillation sans changer son
 * caractère (le taux d'amortissement est conservé).
 */
import { SPRINGS, type SpringPresetName } from './springs'

export interface Oscillator {
  /** Pulsation propre (rad/s). */
  omega: number
  /** Taux d'amortissement (1 = critique). */
  zeta: number
  /** Pulsation amortie (rad/s), 0 si sur-amorti. */
  omegaD: number
}

/** Oscillateur équivalent à un preset. */
export function presetOscillator(preset: SpringPresetName, timeScale = 1): Oscillator {
  const { mass: m, stiffness: k, damping: c } = SPRINGS[preset]
  const omega = Math.sqrt(k / m) * timeScale
  const zeta = c / (2 * Math.sqrt(k * m))
  return { omega, zeta, omegaD: zeta < 1 ? omega * Math.sqrt(1 - zeta * zeta) : 0 }
}

/**
 * Réponse impulsionnelle normalisée (pic ≈ 1) : 0 à t=0, coup franc, puis
 * rebonds décroissants. `t` en secondes ; 0 avant l'impact.
 * Pour un preset sur-amorti, donne une bosse unique (t·e^-ωt).
 */
export function dampedImpulse(t: number, osc: Oscillator, phase = 0): number {
  if (t <= 0) return 0
  const { omega, zeta, omegaD } = osc
  if (omegaD === 0) return omega * t * Math.exp(1 - omega * t)
  // Pic de e^{-ζωt} sin(ωd t) à t* = atan(ωd/ζω)/ωd : on normalise dessus.
  const tPeak = Math.atan2(omegaD, zeta * omega) / omegaD
  const peak = Math.exp(-zeta * omega * tPeak) * Math.sin(omegaD * tPeak)
  return (Math.exp(-zeta * omega * t) * Math.sin(omegaD * t + phase)) / peak
}

/**
 * Avance d'un pas (dt s) l'erreur e d'un suiveur du second ordre soumis à
 * l'accélération `accel` de sa cible : e'' + 2ζω e' + ω² e = -accel.
 * Intégration semi-implicite (stable pour dt·ω < 1).
 */
export function stepFollowerError(state: { e: number; v: number }, accel: number, osc: Oscillator, dt: number): void {
  state.v += (-accel - 2 * osc.zeta * osc.omega * state.v - osc.omega * osc.omega * state.e) * dt
  state.e += state.v * dt
}
