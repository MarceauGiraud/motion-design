/**
 * <CountUp> : nombre porté par un ressort. Formatage Intl (fr-FR / en-US…),
 * préfixe / suffixe, chiffres tabulaires.
 *  - variant "plain"    : la valeur défile, flou selon la vitesse, petit "punch" à l'arrivée.
 *  - variant "odometer" : chaque chiffre est un tambour sur son propre ressort (snappy
 *                         conseillé), les colonnes de tête naissent en s'élargissant.
 */
import { useMemo, type CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset, type SpringPresetName } from '../physics/springs'
import { BRAND, FONT_DISPLAY } from '../tokens'
import { clamp, motionBlur, springV } from './shared'

export interface CountUpProps {
  from?: number
  to?: number
  /** Frame de départ. */
  delay?: number
  /** Preset du ressort (heavy = cinématique, sans dépassement). */
  preset?: SpringPresetName
  /** Force la durée du ressort (frames). */
  durationInFrames?: number
  /** Locale Intl. fr-FR : espace fine comme séparateur, virgule décimale. */
  locale?: string
  /** Décimales affichées. */
  decimals?: number
  /** Options Intl supplémentaires (style currency, notation…). */
  format?: Intl.NumberFormatOptions
  prefix?: string
  suffix?: string
  /** Style appliqué au préfixe / suffixe (ex : plus petit, couleur atténuée). */
  affixStyle?: CSSProperties
  variant?: 'plain' | 'odometer'
  /** Odometer : décalage (frames) entre deux colonnes, de gauche à droite. */
  odometerStagger?: number
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  style?: CSSProperties
}

const PAD = 0.08
const COLUMN_MASK = `linear-gradient(180deg, transparent 0, #000 ${PAD}em, #000 calc(100% - ${PAD}em), transparent 100%)`
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to = 12480,
  delay = 0,
  preset = 'heavy',
  durationInFrames,
  locale = 'fr-FR',
  decimals = 0,
  format,
  prefix = '',
  suffix = '',
  affixStyle,
  variant = 'plain',
  odometerStagger = 2,
  fontSize = 180,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.03em',
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { value: p, velocity } = springV({ frame, fps, preset, delay, durationInFrames })
  const value = from + (to - from) * p
  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, ...format }),
    [locale, decimals, format],
  )

  // Punch d'arrivée : léger gonflement quand le ressort se pose.
  const settle = springV({ frame, fps, preset: 'bouncy', delay: delay + (durationInFrames ?? 40) * 0.8 }).value
  const punch = 1 + 0.035 * Math.sin(clamp(settle) * Math.PI)

  const base: CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    letterSpacing,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum" 1',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'baseline',
    ...style,
  }

  const affix = (s: string) => (s ? <span style={{ whiteSpace: 'pre', ...affixStyle }}>{s}</span> : null)

  if (variant === 'plain') {
    const blur = motionBlur(velocity * 400, 1, 3.5)
    return (
      <div style={{ ...base, transform: `scale(${punch})` }}>
        {affix(prefix)}
        <span style={{ filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>{fmt.format(value)}</span>
        {affix(suffix)}
      </div>
    )
  }

  return (
    <div style={{ ...base, transform: `scale(${punch})` }}>
      {affix(prefix)}
      <Odometer from={from} to={to} fmt={fmt} frame={frame} fps={fps} delay={delay} preset={preset} durationInFrames={durationInFrames ?? 50} stagger={odometerStagger} />
      {affix(suffix)}
    </div>
  )
}

/**
 * Tambours : chaque colonne a son propre ressort (léger décalage gauche -> droite)
 * et atterrit exactement sur son chiffre ; les colonnes basses font plus de tours.
 */
const Odometer: React.FC<{
  from: number
  to: number
  fmt: Intl.NumberFormat
  frame: number
  fps: number
  delay: number
  preset: SpringPresetName
  durationInFrames: number
  stagger: number
}> = ({ from, to, fmt, frame, fps, delay, preset, durationInFrames, stagger }) => {
  const parts = fmt.formatToParts(to)
  const digitsOf = (n: number) =>
    fmt
      .formatToParts(n)
      .filter((x) => x.type === 'integer' || x.type === 'fraction')
      .map((x) => x.value)
      .join('')
      .split('')
      .map(Number)
  const target = digitsOf(to)
  const start = digitsOf(from)
  const D = target.length

  const column = (k: number) => {
    const r = D - k
    const s0 = r <= start.length ? start[start.length - r] : null
    const t = target[k]
    const spins = Math.min(3, Math.round((k * 3) / Math.max(1, D - 1)))
    const travel = ((t - (s0 ?? 0) + 10) % 10) + 10 * spins
    const q = springPreset({ frame, fps, preset, delay: delay + k * stagger, durationInFrames })
    const qPrev = springPreset({ frame: frame - 1, fps, preset, delay: delay + k * stagger, durationInFrames })
    const grow = s0 === null ? clamp(q * 1.6) : 1
    // Le dépassement du ressort ne doit pas être proportionnel à la course
    // (3 tours = 30 chiffres : 2 % de dépassement = un demi-chiffre coupé qui
    // traîne). Course pleine jusqu'à 1, dépassement plafonné à ~2 chiffres.
    const drum = (v: number) => travel * Math.min(v, 1) + Math.max(0, v - 1) * Math.min(travel, 2)
    return { pos: ((((s0 ?? 0) + drum(q)) % 10) + 10) % 10, speed: Math.abs(drum(q) - drum(qPrev)), grow }
  }

  const nodes: React.ReactNode[] = []
  let k = 0
  parts.forEach((part, pi) => {
    if (part.type === 'integer' || part.type === 'fraction') {
      for (let c = 0; c < part.value.length; c++) {
        const { pos, speed, grow } = column(k)
        const blur = Math.min(6, speed * 3)
        nodes.push(
          <span
            key={`d${k}`}
            style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: `${grow * 0.7}em`,
              lineHeight: 1,
              padding: `${PAD}em 0`,
              margin: `-${PAD}em 0`,
              clipPath: 'inset(0)',
              maskImage: COLUMN_MASK,
              WebkitMaskImage: COLUMN_MASK,
              opacity: grow * grow,
            }}
          >
            <span style={{ visibility: 'hidden' }}>0</span>
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: `${PAD}em`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `translate(-50%, ${-pos}em)`,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {DIGITS.map((d, i) => (
                <span key={i} style={{ height: '1em', lineHeight: 1 }}>
                  {d}
                </span>
              ))}
            </span>
          </span>,
        )
        k++
      }
    } else {
      // Séparateurs : naissent avec la colonne qui suit.
      const g = k < D ? column(k).grow : 1
      nodes.push(
        <span key={`s${pi}`} style={{ display: 'inline-block', opacity: g, maxWidth: `${g * 0.6}em`, clipPath: 'inset(0)', whiteSpace: 'pre' }}>
          {part.value}
        </span>,
      )
    }
  })
  return <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>{nodes}</span>
}
