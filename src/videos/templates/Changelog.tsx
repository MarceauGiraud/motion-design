/**
 * Template-Changelog : "Quoi de neuf" avec N nouveautés.
 *   1. Carton titre (version + titre + nombre de nouveautés)
 *   2. Une scène par nouveauté : texte à gauche, fenêtre plateforme à droite
 *      dans laquelle la caméra cadre `focus` ; transition entre chaque scène
 *   3. Carton de fin
 * Ajouter / retirer une entrée dans `items` recalcule la durée.
 */
import { Fragment } from 'react'
import { TransitionSeries } from '@remotion/transitions'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { z } from 'zod'

import { PLATFORM_HEIGHT, PLATFORM_WIDTH, PlatformScreen } from '../../kit/Platform'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../../motion/tokens'
import { springPreset } from '../../motion/physics'
import { Reveal } from '../../motion/primitives'
import { KineticHeadline } from '../../motion/text'
import { Camera, PlacedPlatform, Tilt3D } from '../../motion/camera'
import { Badge } from '../../motion/ui'
import { Backdrop, DEFAULT_END, EndScene, Eyebrow, Fill, makeTransition, mutedColor, seriesDuration, Sub, rampFor, textColor, zEnd, zMultiline, zRect, zScene, zTheme, zTransition } from './shared'

const zItem = z.object({
  /** Pastille : Nouveau, Amélioré, Bêta… */
  tag: z.string(),
  title: z.string(),
  description: zMultiline(),
  scene: zScene,
  /** Zone cadrée dans la fenêtre (coords plateforme ; 0,0,1440,900 = plein cadre). */
  focus: zRect,
})

export const changelogSchema = z.object({
  theme: zTheme,
  version: z.string(),
  title: zMultiline(),
  highlight: z.array(z.string()),
  /** Sous-titre ; {n} = nombre de nouveautés. Vide = aucun. */
  subtitle: z.string(),
  items: z.array(zItem).min(1).max(10),
  /** Durée de chaque nouveauté (frames). */
  itemFrames: z.number().int().min(60).max(300),
  transitionIn: zTransition,
  /** Transition entre deux nouveautés. */
  transitionBetween: zTransition,
  transitionOut: zTransition,
  end: zEnd,
})

export type ChangelogProps = z.infer<typeof changelogSchema>
export type ChangelogItem = z.infer<typeof zItem>

export const changelogDefaults: ChangelogProps = {
  theme: 'light',
  version: 'Acme 2.8 · Septembre 2026',
  title: 'Quoi de neuf\ndans Acme ?',
  highlight: ['neuf'],
  subtitle: '{n} nouveautés livrées ce mois-ci.',
  items: [
    {
      tag: 'Nouveau',
      title: 'Pipeline intelligent',
      description: 'Les deals qui stagnent remontent d’eux-mêmes, avec la prochaine action à faire.',
      scene: 'pipeline',
      focus: { x: 212, y: 96, w: 740, h: 330 },
    },
    {
      tag: 'Amélioré',
      title: 'Inbox unifiée',
      description: 'Email, LinkedIn et WhatsApp réunis dans un seul fil par contact.',
      scene: 'inbox',
      focus: { x: 590, y: 82, w: 850, h: 640 },
    },
    {
      tag: 'Nouveau',
      title: 'Fiche contact 360°',
      description: 'Score, champs clés et toute l’historique des échanges sur une seule page.',
      scene: 'contact',
      focus: { x: 200, y: 80, w: 900, h: 420 },
    },
  ],
  itemFrames: 130,
  transitionIn: 'liquidWipe',
  transitionBetween: 'slidePush',
  transitionOut: 'brandRampSweep',
  end: { tagline: 'Déjà disponible dans Acme.', highlight: ['disponible'], url: 'acme.com/changelog', cta: 'Voir les nouveautés' },
}

const INTRO = 84
const OUTRO = 120

const transitionsOf = (p: ChangelogProps) => [p.transitionIn, ...p.items.slice(1).map(() => p.transitionBetween), p.transitionOut]

export const changelogDuration = (p: ChangelogProps) =>
  seriesDuration([INTRO, ...p.items.map(() => p.itemFrames), OUTRO], transitionsOf(p))

// ---------------------------------------------------------------------------

const Intro = ({ theme, version, title, highlight, subtitle, items }: ChangelogProps) => (
  <Backdrop theme={theme}>
    <Fill style={{ flexDirection: 'column', gap: 40 }}>
      <Reveal variant="fadeDown" delay={2}>
        <Eyebrow theme={theme}>{version}</Eyebrow>
      </Reveal>
      <KineticHeadline text={title} highlight={highlight} fontSize={140} color={textColor(theme)} highlightGradient={rampFor(theme)} delay={6} maxWidth={1600} />
      {subtitle.trim() !== '' && (
        <Reveal variant="blur" delay={30}>
          <Sub theme={theme}>{subtitle.replaceAll('{n}', String(items.length))}</Sub>
        </Reveal>
      )}
    </Fill>
  </Backdrop>
)

/** Fenêtre plateforme à droite, cadrée par une caméra interne. */
const WIN_W = 1120
const WIN_H = (WIN_W / PLATFORM_WIDTH) * PLATFORM_HEIGHT

/**
 * Cadrage de `rect` (coords plateforme) dans la fenêtre, borné pour que la
 * caméra ne sorte jamais du canvas (pas de bord vide visible).
 */
function insideFocus(rect: { x: number; y: number; w: number; h: number }, padding: number, maxZoom: number) {
  const s = WIN_W / PLATFORM_WIDTH
  const r = { x: rect.x * s, y: rect.y * s, w: rect.w * s, h: rect.h * s }
  const zoom = Math.max(1, Math.min(maxZoom, WIN_W / (r.w + padding * 2), WIN_H / (r.h + padding * 2)))
  const halfW = WIN_W / 2 / zoom
  const halfH = WIN_H / 2 / zoom
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  return { zoom, x: clamp(r.x + r.w / 2, halfW, WIN_W - halfW), y: clamp(r.y + r.h / 2, halfH, WIN_H - halfH) }
}

const ItemScene = ({ item, index, count, theme }: { item: ChangelogItem; index: number; count: number; theme: ChangelogProps['theme'] }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const place = { x: 0, y: 0, width: WIN_W }
  const full = item.focus.w >= PLATFORM_WIDTH - 1 && item.focus.h >= PLATFORM_HEIGHT - 1
  const bar = springPreset({ frame, fps, preset: 'smooth', delay: 10 })

  return (
    <Backdrop theme={theme}>
      {/* Colonne texte */}
      <div style={{ position: 'absolute', left: 110, top: 0, bottom: 0, width: 560, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 500, color: mutedColor(theme), letterSpacing: '-0.01em' }}>
          <Reveal variant="fadeUp" delay={4} distance={20}>
            {String(index + 1).padStart(2, '0')} <span style={{ opacity: 0.5 }}>/ {String(count).padStart(2, '0')}</span>
          </Reveal>
        </div>
        {item.tag.trim() !== '' && (
          <div>
            <Badge label={item.tag} variant={index % 2 === 0 ? 'brand' : 'blue'} size={22} at={8} />
          </div>
        )}
        <KineticHeadline text={item.title} fontSize={84} align="left" color={textColor(theme)} delay={10} stagger={3} maxWidth={560} lineHeight={1.02} />
        <Reveal variant="blur" delay={24}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 30, lineHeight: 1.42, color: mutedColor(theme), whiteSpace: 'pre-line', maxWidth: 520 }}>{item.description}</div>
        </Reveal>
        {/* Progression dans le changelog */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={{ width: 54, height: 5, borderRadius: 9, background: theme === 'dark' ? 'rgba(255,255,255,0.16)' : BRAND.border, overflow: 'hidden' }}>
              <div style={{ width: `${i < index ? 100 : i === index ? bar * 100 : 0}%`, height: '100%', backgroundImage: BRAND_RAMP }} />
            </div>
          ))}
        </div>
      </div>

      {/* Fenêtre plateforme */}
      <div style={{ position: 'absolute', left: 720, top: (1080 - WIN_H) / 2, width: WIN_W, height: WIN_H }}>
        <Tilt3D delay={0} from={9} lift={60} float={0} origin="0% 50%">
          <div style={{ position: 'relative', width: WIN_W, height: WIN_H }}>
            <div
              aria-hidden
              style={{ position: 'absolute', inset: -8, borderRadius: 26, backgroundImage: BRAND_RAMP, filter: 'blur(18px)', opacity: 0.32 }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(16,15,14,0.06), 0 40px 90px -30px rgba(16,15,14,0.45)',
              }}
            >
              <Camera
                width={WIN_W}
                height={WIN_H}
                platform={place}
                drift={false}
                keyframes={full ? [{ at: 0, zoom: 1 }] : [{ at: 0, zoom: 1 }, { at: 34, ...insideFocus(item.focus, 24, 2.2) }]}
              >
                <PlacedPlatform placement={place} halo={false}>
                  <PlatformScreen scene={item.scene} entranceDelay={8} />
                </PlacedPlatform>
              </Camera>
            </div>
          </div>
        </Tilt3D>
      </div>
    </Backdrop>
  )
}

export const Changelog = (props: ChangelogProps) => {
  const n = props.items.length
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO}>
        <Intro {...props} />
      </TransitionSeries.Sequence>
      {props.items.map((item, i) => (
        <Fragment key={i}>
          <TransitionSeries.Transition {...makeTransition(i === 0 ? props.transitionIn : props.transitionBetween)} />
          <TransitionSeries.Sequence durationInFrames={props.itemFrames}>
            <ItemScene item={item} index={i} count={n} theme={props.theme} />
          </TransitionSeries.Sequence>
        </Fragment>
      ))}
      <TransitionSeries.Transition {...makeTransition(props.transitionOut)} />
      <TransitionSeries.Sequence durationInFrames={OUTRO}>
        <EndScene end={props.end} theme={props.theme} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
