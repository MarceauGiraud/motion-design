/**
 * <TypeWriter> : frappe humaine, déterministe. Le rythme vient d'un tirage
 * seedé (random), avec pauses après ponctuation et petites rafales. Chaque
 * caractère arrive sur un ressort (pop discret). Plusieurs phrases possibles :
 * tape, tient, efface, passe à la suivante. Caret : fixe pendant la frappe,
 * clignote au repos.
 */
import { useMemo, type CSSProperties } from 'react'
import { interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset } from '../physics/springs'
import { BRAND, FONT_DISPLAY } from '../tokens'
import { graphemes } from './shared'

export interface TypeWriterProps {
  /** Texte, ou liste de phrases jouées l'une après l'autre (tape / tient / efface). */
  text?: string | string[]
  /** Frame de début de frappe. */
  startAt?: number
  /** Caractères par seconde (moyenne). */
  cps?: number
  /** Irrégularité 0..1 du rythme. */
  jitter?: number
  /** Graine du rythme (même graine = même frappe). */
  seed?: string
  /** Frames de tenue d'une phrase avant effacement (multi-phrases). */
  hold?: number
  /** Vitesse d'effacement (car/s). */
  deleteCps?: number
  /** Efface aussi la dernière phrase et reboucle. */
  loop?: boolean
  /** Affiche le caret. */
  caret?: boolean
  caretShape?: 'bar' | 'block' | 'underscore'
  caretColor?: string
  /** Période du clignotement (frames). */
  blinkPeriod?: number
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  style?: CSSProperties
}

interface Key {
  frame: number
  /** Nombre de caractères visibles après l'événement. */
  len: number
  phrase: number
}

/** Construit la chronologie des frappes (pure, seedée). */
function buildSchedule(phrases: string[][], startAt: number, fps: number, cps: number, jitter: number, seed: string, hold: number, deleteCps: number, loop: boolean) {
  const keys: Key[] = [{ frame: -Infinity, len: 0, phrase: 0 }]
  /** Frame d'apparition de chaque caractère, par phrase. */
  const typedAt: number[][] = phrases.map(() => [])
  let t = startAt
  const base = fps / cps
  phrases.forEach((chars, p) => {
    chars.forEach((c, i) => {
      const r = random(`${seed}-${p}-${i}`)
      let d = base * (1 + jitter * (r * 2 - 1))
      if (random(`${seed}-burst-${p}-${i}`) < 0.18) d *= 0.45
      const prev = chars[i - 1]
      if (prev && /[,;:]/.test(prev)) d += base * 3
      else if (prev && /[.!?…]/.test(prev)) d += base * 5
      else if (prev === ' ') d *= 1.25
      t += i === 0 ? 0 : d
      typedAt[p][i] = t
      keys.push({ frame: t, len: i + 1, phrase: p })
    })
    const last = p === phrases.length - 1
    if (!last || loop) {
      t += hold
      const dBase = fps / deleteCps
      for (let i = chars.length - 1; i >= 0; i--) {
        t += dBase * (1 + 0.3 * (random(`${seed}-del-${p}-${i}`) - 0.5))
        keys.push({ frame: t, len: i, phrase: p })
      }
      t += base * 4
    }
  })
  return { keys, typedAt, total: t - startAt }
}

export const TypeWriter: React.FC<TypeWriterProps> = ({
  text = 'Relance les leads froids de mars',
  startAt = 8,
  cps = 16,
  jitter = 0.55,
  seed = 'typewriter',
  hold = 45,
  deleteCps = 38,
  loop = false,
  caret = true,
  caretShape = 'bar',
  caretColor = BRAND.rose,
  blinkPeriod = 32,
  fontSize = 72,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.02em',
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const phrases = useMemo(() => (Array.isArray(text) ? text : [text]).map(graphemes), [text])
  const { keys, typedAt, total } = useMemo(
    () => buildSchedule(phrases, startAt, fps, cps, jitter, seed, hold, deleteCps, loop),
    [phrases, startAt, fps, cps, jitter, seed, hold, deleteCps, loop],
  )

  // Boucle : on replie le temps sur la durée totale.
  const local = loop && frame >= startAt ? startAt + ((frame - startAt) % Math.max(1, total)) : frame
  let k = 0
  for (let i = 0; i < keys.length; i++) if (keys[i].frame <= local) k = i
  const current = keys[k]
  const chars = phrases[current.phrase].slice(0, current.len)
  const sinceKey = local - current.frame

  // Caret : plein pendant la frappe, clignotement doux au repos.
  const typing = sinceKey < 10
  const cyc = (Math.max(0, sinceKey - 10) % blinkPeriod) / blinkPeriod
  const blink = typing ? 1 : interpolate(cyc, [0, 0.45, 0.55, 0.95, 1], [1, 1, 0, 0, 1])

  const caretStyle: CSSProperties =
    caretShape === 'block'
      ? { width: '0.55em', height: '1em', borderRadius: '0.06em', marginLeft: '0.04em', opacity: 0.85 * blink }
      : caretShape === 'underscore'
        ? { width: '0.55em', height: '0.08em', marginLeft: '0.04em', transform: 'translateY(0.38em)', opacity: blink }
        : { width: '0.075em', height: '1.05em', borderRadius: '0.04em', marginLeft: '0.05em', opacity: blink }

  return (
    <div style={{ fontFamily, fontSize, fontWeight, color, letterSpacing, lineHeight: 1.2, whiteSpace: 'pre', display: 'inline-flex', alignItems: 'center', ...style }}>
      <span>
        {chars.map((c, i) => {
          const at = typedAt[current.phrase][i]
          const s = springPreset({ frame: local, fps, preset: 'snappy', delay: at })
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
                transform: `translateY(${(1 - s) * 0.18}em) scale(${0.85 + 0.15 * s})`,
                transformOrigin: '50% 80%',
                filter: s < 0.95 ? `blur(${(1 - s) * 3}px)` : undefined,
              }}
            >
              {c}
            </span>
          )
        })}
      </span>
      {caret ? <span style={{ display: 'inline-block', background: caretColor, flexShrink: 0, ...caretStyle }} /> : null}
    </div>
  )
}

/** Durée (frames) nécessaire pour taper `text` (utile pour caler la suite). */
export function typeWriterDuration(text: string | string[], opts: { fps?: number; cps?: number; jitter?: number; seed?: string; hold?: number; deleteCps?: number } = {}): number {
  const phrases = (Array.isArray(text) ? text : [text]).map(graphemes)
  return buildSchedule(phrases, 0, opts.fps ?? 30, opts.cps ?? 16, opts.jitter ?? 0.55, opts.seed ?? 'typewriter', opts.hold ?? 45, opts.deleteCps ?? 38, false).total
}
