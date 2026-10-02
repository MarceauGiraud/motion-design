/**
 * Template-FeatureSpotlight : une fonctionnalité en ~14 s.
 *   1. Carton titre (eyebrow + headline cinétique + sous-titre)
 *   2. Plan plateforme : la fenêtre arrive inclinée, la caméra cadre `focus`,
 *      un anneau de marque l'entoure, le curseur joue son trajet, les callouts pop.
 *   3. Carton de fin (EndCard).
 * Toutes les frames du plan (curseur, callouts) sont relatives au DÉBUT DU PLAN
 * plateforme ; les coordonnées sont en px plateforme 1440x900.
 */
import { TransitionSeries } from '@remotion/transitions'
import { z } from 'zod'

import { PlatformScreen } from '../../kit/Platform'
import { Reveal } from '../../motion/primitives'
import { KineticHeadline } from '../../motion/text'
import { Camera, centeredPlacement, PlacedPlatform, platformPointToStage, platformRectToStage, stageToScreen, useCameraPose, type CameraKeyframe } from '../../motion/camera'
import { Callout, Cursor, FocusRing } from '../../motion/ui'
import {
  Backdrop,
  DEFAULT_END,
  EndScene,
  Eyebrow,
  Fill,
  makeTransition,
  seriesDuration,
  Sub,
  rampFor, textColor,
  zEnd,
  zMultiline,
  zRect,
  zScene,
  zTheme,
  zTransition,
} from './shared'

export const featureSpotlightSchema = z.object({
  theme: zTheme,
  eyebrow: z.string(),
  headline: zMultiline(),
  highlight: z.array(z.string()),
  subheadline: z.string(),
  scene: zScene,
  /** Zone cadrée par la caméra (coords plateforme). */
  focus: zRect,
  /** Zoom maximal du cadrage. */
  focusMaxZoom: z.number().min(1).max(4),
  /** Trajet du curseur (frames relatives au début du plan plateforme). */
  cursor: z.array(z.object({ at: z.number().int().min(0), x: z.number(), y: z.number(), click: z.boolean() })),
  /** Annotations (cible en coords plateforme, décalage de la bulle en px écran). */
  callouts: z.array(
    z.object({
      at: z.number().int().min(0),
      x: z.number(),
      y: z.number(),
      dx: z.number(),
      dy: z.number(),
      title: z.string(),
      body: z.string(),
      style: z.enum(['light', 'dark', 'brand']),
    })
  ),
  transitionIn: zTransition,
  transitionOut: zTransition,
  end: zEnd,
})

export type FeatureSpotlightProps = z.infer<typeof featureSpotlightSchema>

export const featureSpotlightDefaults: FeatureSpotlightProps = {
  theme: 'light',
  eyebrow: 'Nouveau · Pipeline',
  headline: 'Chaque deal,\nau bon moment.',
  highlight: ['moment.'],
  subheadline: 'Acme repère les opportunités qui stagnent et vous dit qui relancer.',
  scene: 'pipeline',
  focus: { x: 700, y: 110, w: 520, h: 300 },
  focusMaxZoom: 1.6,
  cursor: [
    { at: 60, x: 560, y: 520, click: false },
    { at: 92, x: 835, y: 175, click: true },
    { at: 150, x: 1087, y: 305, click: true },
  ],
  callouts: [
    { at: 100, x: 760, y: 170, dx: -150, dy: -60, title: 'Helioma · 88 k€', body: 'Sans réponse depuis 9 jours.', style: 'light' },
    { at: 158, x: 1190, y: 330, dx: 120, dy: 150, title: 'Solvya · relance prête', body: 'L’IA a rédigé le message.', style: 'brand' },
  ],
  transitionIn: 'zoomThrough',
  transitionOut: 'blurDissolve',
  end: DEFAULT_END,
}

const INTRO = 96
const SHOT = 260
const OUTRO = 120

export const featureSpotlightDuration = (p: FeatureSpotlightProps) => seriesDuration([INTRO, SHOT, OUTRO], [p.transitionIn, p.transitionOut])

// ---------------------------------------------------------------------------

const Intro = ({ theme, eyebrow, headline, highlight, subheadline }: FeatureSpotlightProps) => (
  <Backdrop theme={theme}>
    <Fill style={{ flexDirection: 'column', gap: 40, padding: '0 160px' }}>
      {eyebrow.trim() !== '' && (
        <Reveal variant="fadeDown" delay={2}>
          <Eyebrow theme={theme}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <KineticHeadline text={headline} highlight={highlight} fontSize={132} color={textColor(theme)} highlightGradient={rampFor(theme)} delay={8} maxWidth={1600} />
      {subheadline.trim() !== '' && (
        <Reveal variant="blur" delay={30}>
          <Sub theme={theme} style={{ maxWidth: 1400 }}>
            {subheadline}
          </Sub>
        </Reveal>
      )}
    </Fill>
  </Backdrop>
)

const W = 1920
const H = 1080
const PLACE = centeredPlacement(1600, W, H)

/** Fin du cadrage serré : la caméra repart en plan large. */
const WIDE_AT = 212

const Shot = (p: FeatureSpotlightProps) => {
  const keyframes: CameraKeyframe[] = [
    { at: 0, zoom: 0.86, rotateX: 12, y: 600, x: W / 2 },
    { at: 2, zoom: 1, rotateX: 0, y: H / 2 },
    { at: 46, focus: { rect: p.focus, padding: 220, maxZoom: p.focusMaxZoom } },
    { at: WIDE_AT, zoom: 1, x: W / 2, y: H / 2, preset: 'smooth' },
  ]
  const { pose } = useCameraPose({ keyframes, platform: PLACE })
  const ring = platformRectToStage(p.focus, PLACE)

  return (
    <Backdrop theme={p.theme}>
      <Camera platform={PLACE} keyframes={keyframes} drift={{ amplitude: 4 }}>
        <PlacedPlatform placement={PLACE}>
          <PlatformScreen scene={p.scene} entranceDelay={6} />
        </PlacedPlatform>
        <FocusRing rect={ring} at={62} until={WIDE_AT - 6} radius={14} />
        {p.cursor.length > 0 && (
          <Cursor
            size={22}
            hideAt={WIDE_AT}
            waypoints={p.cursor.map((c) => ({ ...platformPointToStage(c, PLACE), at: c.at, click: c.click, hand: c.click }))}
          />
        )}
      </Camera>
      {/* HUD : les bulles gardent leur taille, leur cible suit la caméra. */}
      {p.callouts.map((c, i) => (
        <Callout
          key={i}
          target={stageToScreen(platformPointToStage(c, PLACE), pose, W, H)}
          offset={{ x: c.dx, y: c.dy }}
          at={c.at}
          until={WIDE_AT - 8}
          title={c.title}
          body={c.body}
          theme={c.style}
          badge={p.callouts.length > 1 ? String(i + 1) : undefined}
          scale={1.2}
        />
      ))}
    </Backdrop>
  )
}

export const FeatureSpotlight = (props: FeatureSpotlightProps) => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={INTRO}>
      <Intro {...props} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...makeTransition(props.transitionIn)} />
    <TransitionSeries.Sequence durationInFrames={SHOT}>
      <Shot {...props} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...makeTransition(props.transitionOut)} />
    <TransitionSeries.Sequence durationInFrames={OUTRO}>
      <EndScene end={props.end} theme={props.theme} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
)
