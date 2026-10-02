/**
 * Template-MetricsHighlight : chiffres clés qui comptent, dans une carte qui morphe.
 *   1. Carton titre
 *   2. Une pastille devient la carte du 1er chiffre, qui morphe (taille, couleur,
 *      rayon) vers la carte du suivant… chaque CountUp repart au moment du morph.
 *      À la fin, la carte rejoint sa place dans une grille récapitulative et les
 *      autres chiffres apparaissent autour.
 *   3. Carton de fin
 */
import type { ReactNode } from 'react'
import { TransitionSeries } from '@remotion/transitions'
import { Sequence } from 'remotion'
import { z } from 'zod'

import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../../motion/tokens'
import { ContainerMorph, centeredRect, type ContainerKeyframe, type Rect } from '../../motion/morph'
import { Presence, Reveal } from '../../motion/primitives'
import { CountUp, KineticHeadline } from '../../motion/text'
import { Backdrop, DEFAULT_END, EndScene, Eyebrow, Fill, makeTransition, seriesDuration, Sub, TEMPLATE_PALETTE, rampFor, textColor, zEnd, zMultiline, zTheme, zTransition } from './shared'

const zMetric = z.object({
  value: z.number(),
  /** Valeur de départ du compteur. */
  from: z.number(),
  decimals: z.number().int().min(0).max(3),
  prefix: z.string(),
  /** Inclure l'espace, ex. ' %' ou ' k€'. */
  suffix: z.string(),
  label: z.string(),
  caption: z.string(),
  /** Couleur de la carte. */
  tone: z.enum(['light', 'dark', 'brand']),
})

export const metricsHighlightSchema = z.object({
  theme: zTheme,
  eyebrow: z.string(),
  title: zMultiline(),
  highlight: z.array(z.string()),
  subtitle: z.string(),
  /** Libellé de la pastille de départ et titre de la grille finale. */
  pill: z.string(),
  metrics: z.array(zMetric).min(1).max(5),
  /** Temps passé sur chaque chiffre (frames). */
  metricFrames: z.number().int().min(45).max(200),
  /** Compteur à tambours (odometer) plutôt que compteur simple. */
  odometer: z.boolean(),
  locale: z.string(),
  transitionIn: zTransition,
  transitionOut: zTransition,
  end: zEnd,
})

export type MetricsHighlightProps = z.infer<typeof metricsHighlightSchema>
type Metric = z.infer<typeof zMetric>

export const metricsHighlightDefaults: MetricsHighlightProps = {
  theme: 'light',
  eyebrow: 'Bilan T3 2026',
  title: 'Acme,\nen chiffres.',
  highlight: ['chiffres.'],
  subtitle: 'Ce que nos clients ont gagné ce trimestre.',
  pill: 'Acme en chiffres',
  metrics: [
    { value: 12480, from: 0, decimals: 0, prefix: '', suffix: '', label: 'contacts enrichis par l’IA', caption: 'chaque semaine, sans saisie', tone: 'light' },
    { value: 38.5, from: 0, decimals: 1, prefix: '+', suffix: ' %', label: 'de deals signés', caption: 'vs. leur ancien CRM', tone: 'dark' },
    { value: 6, from: 0, decimals: 0, prefix: '', suffix: ' h', label: 'gagnées par commercial', caption: 'chaque semaine', tone: 'brand' },
  ],
  metricFrames: 78,
  odometer: false,
  locale: 'fr-FR',
  transitionIn: 'blurDissolve',
  transitionOut: 'zoomThrough',
  end: DEFAULT_END,
}

const INTRO = 84
const OUTRO = 120
/** Début du premier morph (pastille -> carte 1) dans le segment. */
const M0 = 22
/** Temps laissé à la grille finale. */
const GRID_HOLD = 96

const segmentFrames = (p: MetricsHighlightProps) => M0 + p.metrics.length * p.metricFrames + GRID_HOLD

export const metricsHighlightDuration = (p: MetricsHighlightProps) =>
  seriesDuration([INTRO, segmentFrames(p), OUTRO], [p.transitionIn, p.transitionOut])

// ---------------------------------------------------------------------------

const TONE_BG: Record<Metric['tone'], string> = { light: TEMPLATE_PALETTE.white, dark: BRAND.night, brand: BRAND.violet }
const toneText = (t: Metric['tone']) => (t === 'light' ? BRAND.text : TEMPLATE_PALETTE.white)
const toneMuted = (t: Metric['tone']) => (t === 'light' ? BRAND.textMuted : TEMPLATE_PALETTE.whiteMuted)

/** Grandes cartes : tailles différentes pour que chaque morph se voie. */
const HERO_SIZES: Array<[number, number]> = [
  [1180, 560],
  [980, 600],
  [1240, 520],
  [1040, 580],
  [1160, 540],
]

/** Contenu d'une carte (grand format ou vignette de grille). */
const MetricFace = ({ m, size, width, height, animate, locale, odometer, delay = 0 }: { m: Metric; size: 'hero' | 'grid'; width: number; height: number; animate: boolean; locale: string; odometer: boolean; delay?: number }) => {
  const hero = size === 'hero'
  const valueSize = hero ? 200 : Math.min(118, width * 0.24)
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: hero ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: hero ? 60 : 44,
        boxSizing: 'border-box',
        gap: hero ? 18 : 10,
        color: toneText(m.tone),
      }}
    >
      <CountUp
        from={animate ? m.from : m.value}
        to={m.value}
        delay={delay}
        decimals={m.decimals}
        prefix={m.prefix}
        suffix={m.suffix}
        locale={locale}
        variant={odometer ? 'odometer' : 'plain'}
        preset={odometer ? 'snappy' : 'heavy'}
        durationInFrames={odometer ? 50 : undefined}
        fontSize={valueSize}
        color={toneText(m.tone)}
        affixStyle={{ color: m.tone === 'light' ? BRAND.violet : toneMuted(m.tone) }}
      />
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: hero ? 46 : 30, fontWeight: 500, letterSpacing: '-0.02em', textAlign: hero ? 'center' : 'left', lineHeight: 1.1 }}>{m.label}</div>
      {m.caption.trim() !== '' && (
        <div style={{ fontFamily: FONT_BODY, fontSize: hero ? 28 : 20, color: toneMuted(m.tone), textAlign: hero ? 'center' : 'left' }}>{m.caption}</div>
      )}
    </div>
  )
}

const Intro = ({ theme, eyebrow, title, highlight, subtitle }: MetricsHighlightProps) => (
  <Backdrop theme={theme}>
    <Fill style={{ flexDirection: 'column', gap: 40 }}>
      {eyebrow.trim() !== '' && (
        <Reveal variant="fadeDown" delay={2}>
          <Eyebrow theme={theme}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <KineticHeadline text={title} highlight={highlight} fontSize={150} color={textColor(theme)} highlightGradient={rampFor(theme)} delay={6} maxWidth={1600} />
      {subtitle.trim() !== '' && (
        <Reveal variant="blur" delay={30}>
          <Sub theme={theme}>{subtitle}</Sub>
        </Reveal>
      )}
    </Fill>
  </Backdrop>
)

const W = 1920
const H = 1080

/** Rectangles de la grille finale. */
function gridRects(n: number): Rect[] {
  const margin = 120
  const gap = 32
  const w = (W - margin * 2 - gap * (n - 1)) / n
  const h = 380
  const y = (H - h) / 2 + 70
  return Array.from({ length: n }, (_, i) => ({ x: margin + i * (w + gap), y, width: w, height: h }))
}

const PillFace = ({ label, theme }: { label: string; theme: MetricsHighlightProps['theme'] }) => (
  <div
    style={{
      width: 520,
      height: 104,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: FONT_DISPLAY,
      fontSize: 38,
      fontWeight: 500,
      letterSpacing: '-0.02em',
      color: theme === 'dark' ? BRAND.text : TEMPLATE_PALETTE.white,
    }}
  >
    <span style={{ width: 14, height: 14, borderRadius: 99, backgroundImage: `linear-gradient(135deg, ${BRAND.rose}, ${BRAND.violet})` }} />
    {label}
  </div>
)

const Segment = (p: MetricsHighlightProps) => {
  const n = p.metrics.length
  const grid = gridRects(n)
  const gridAt = M0 + n * p.metricFrames
  const last = p.metrics[n - 1]

  const keyframes: ContainerKeyframe[] = [
    {
      at: 0,
      rect: centeredRect(520, 104),
      radius: 52,
      background: p.theme === 'dark' ? TEMPLATE_PALETTE.white : BRAND.text,
      elevation: 0.6,
      content: <PillFace label={p.pill} theme={p.theme} />,
    },
    ...p.metrics.map((m, i): ContainerKeyframe => {
      const [w, h] = HERO_SIZES[i % HERO_SIZES.length]
      const at = M0 + i * p.metricFrames
      return {
        at,
        rect: centeredRect(w, h, W, H, 0, 20),
        radius: 44,
        background: TONE_BG[m.tone],
        elevation: 1,
        content: (
          <Sequence from={at} layout="none">
            <MetricFace m={m} size="hero" width={w} height={h} animate locale={p.locale} odometer={p.odometer} delay={8} />
          </Sequence>
        ),
      }
    }),
    {
      at: gridAt,
      preset: 'heavy',
      rect: grid[n - 1],
      radius: 32,
      background: TONE_BG[last.tone],
      elevation: 0.7,
      content: <MetricFace m={last} size="grid" width={grid[n - 1].width} height={grid[n - 1].height} animate={false} locale={p.locale} odometer={false} />,
    },
  ]

  return (
    <Backdrop theme={p.theme}>
      {/* Titre de la grille */}
      <Presence enterAt={gridAt + 6} enter="fadeUp" containerStyle={{ position: 'absolute', left: 0, right: 0, top: grid[0].y - 150, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 72, fontWeight: 500, letterSpacing: '-0.035em', color: textColor(p.theme) }}>{p.pill}</div>
      </Presence>
      {/* Les autres vignettes apparaissent autour de la carte qui se pose */}
      {p.metrics.slice(0, n - 1).map((m, i) => (
        <Presence
          key={i}
          enterAt={gridAt + 10 + (n - 2 - i) * 4}
          enter="pop"
          containerStyle={{ position: 'absolute', left: grid[i].x, top: grid[i].y, width: grid[i].width, height: grid[i].height }}
        >
          <GridCard m={m} rect={grid[i]} locale={p.locale} />
        </Presence>
      ))}
      <ContainerMorph
        keyframes={keyframes}
        contentBlur={10}
        underlay={(state) => {
          // Cartes "brand" : le dégradé du logo, pondéré par le poids de leurs keyframes.
          const tones = ['pill', ...p.metrics.map((m) => m.tone), last.tone]
          const w = state.weights.reduce((a, wi, i) => a + (tones[i] === 'brand' ? Math.max(0, wi) : 0), 0)
          return w > 0.001 ? <div style={{ position: 'absolute', inset: 0, backgroundImage: BRAND_RAMP, opacity: Math.min(1, w) }} /> : null
        }}
      />
    </Backdrop>
  )
}

const GridCard = ({ m, rect, locale }: { m: Metric; rect: Rect; locale: string }): ReactNode => (
  <div
    style={{
      width: rect.width,
      height: rect.height,
      borderRadius: 32,
      background: TONE_BG[m.tone],
      backgroundImage: m.tone === 'brand' ? BRAND_RAMP : undefined,
      boxShadow: m.tone === 'light' ? `0 1px 2px rgba(16,15,14,0.06), 0 24px 60px -24px rgba(16,15,14,0.3), inset 0 0 0 1px ${BRAND.border}` : '0 24px 60px -24px rgba(16,15,14,0.45)',
      overflow: 'hidden',
    }}
  >
    <MetricFace m={m} size="grid" width={rect.width} height={rect.height} animate={false} locale={locale} odometer={false} />
  </div>
)

export const MetricsHighlight = (props: MetricsHighlightProps) => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={INTRO}>
      <Intro {...props} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...makeTransition(props.transitionIn)} />
    <TransitionSeries.Sequence durationInFrames={segmentFrames(props)}>
      <Segment {...props} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...makeTransition(props.transitionOut)} />
    <TransitionSeries.Sequence durationInFrames={OUTRO}>
      <EndScene end={props.end} theme={props.theme} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
)
