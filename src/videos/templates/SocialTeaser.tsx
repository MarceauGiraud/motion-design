/**
 * Template-SocialTeaser (1080x1080 et 1080x1920) : format réseaux sociaux.
 *   1. Accroche cinétique plein cadre
 *   2. Un fragment de la plateforme (crop) arrive incliné et flotte, légendé
 *   3. Carton de fin
 * La mise en page s'adapte au format (carré / vertical) via useVideoConfig.
 */
import { TransitionSeries } from '@remotion/transitions'
import { useVideoConfig } from 'remotion'
import { z } from 'zod'

import { Float } from '../../motion/primitives'
import { KineticHeadline } from '../../motion/text'
import { PlatformCrop, Tilt3D } from '../../motion/camera'
import { Badge } from '../../motion/ui'
import { Backdrop, DEFAULT_END, EndScene, Fill, makeTransition, seriesDuration, rampFor, textColor, zEnd, zMultiline, zRect, zScene, zTheme, zTransition } from './shared'

export const socialTeaserSchema = z.object({
  theme: zTheme,
  hook: zMultiline(),
  highlight: z.array(z.string()),
  /** Durée de l'accroche (frames). */
  hookFrames: z.number().int().min(40).max(200),
  scene: zScene,
  /** Fragment de la plateforme montré (coords 1440x900). */
  crop: zRect,
  caption: zMultiline(),
  captionHighlight: z.array(z.string()),
  /** Pastille au-dessus du crop (vide = aucune). */
  badge: z.string(),
  /** Durée du plan produit (frames). */
  shotFrames: z.number().int().min(60).max(300),
  transitionIn: zTransition,
  transitionOut: zTransition,
  end: zEnd,
})

export type SocialTeaserProps = z.infer<typeof socialTeaserSchema>

export const socialTeaserDefaults: SocialTeaserProps = {
  theme: 'dark',
  hook: 'Encore un\nCRM à remplir ?',
  highlight: ['remplir', '?'],
  hookFrames: 72,
  scene: 'pipeline',
  crop: { x: 212, y: 96, w: 744, h: 316 },
  caption: 'Acme se remplit\ntout seul.',
  captionHighlight: ['seul.'],
  badge: '+ 3 deals détectés',
  shotFrames: 120,
  transitionIn: 'zoomThrough',
  transitionOut: 'brandRampSweep',
  end: { ...DEFAULT_END, cta: 'Essayer gratuitement' },
}

export const socialTeaserPortraitDefaults: SocialTeaserProps = {
  ...socialTeaserDefaults,
  crop: { x: 212, y: 96, w: 490, h: 520 },
}

const OUTRO = 110

export const socialTeaserDuration = (p: SocialTeaserProps) =>
  seriesDuration([p.hookFrames, p.shotFrames, OUTRO], [p.transitionIn, p.transitionOut])

// ---------------------------------------------------------------------------

const Hook = ({ theme, hook, highlight }: SocialTeaserProps) => {
  const { width, height } = useVideoConfig()
  const portrait = height > width * 1.3
  return (
    <Backdrop theme={theme} intensity={theme === 'dark' ? 0.55 : 1}>
      <Fill style={{ padding: '0 70px' }}>
        <KineticHeadline
          text={hook}
          highlight={highlight}
          fontSize={portrait ? 150 : 132}
          color={textColor(theme)} highlightGradient={rampFor(theme)}
          delay={4}
          stagger={4}
          maxWidth={width - 140}
          preset="bouncy"
        />
      </Fill>
    </Backdrop>
  )
}

const Shot = ({ theme, scene, crop, caption, captionHighlight, badge }: SocialTeaserProps) => {
  const { width, height } = useVideoConfig()
  const portrait = height > width * 1.3
  // Le crop tient dans ~86 % de la largeur et ~46/56 % de la hauteur.
  const maxW = width * 0.86
  const maxH = height * (portrait ? 0.56 : 0.5)
  const scale = Math.min(maxW / crop.w, maxH / crop.h)
  const cropW = crop.w * scale
  const cropH = crop.h * scale
  const captionSize = portrait ? 92 : 76

  return (
    <Backdrop theme={theme}>
      <Fill style={{ flexDirection: 'column', gap: portrait ? 90 : 54 }}>
        <KineticHeadline text={caption} highlight={captionHighlight} fontSize={captionSize} color={textColor(theme)} highlightGradient={rampFor(theme)} delay={10} maxWidth={width - 120} />
        <div style={{ position: 'relative', width: cropW, height: cropH }}>
          <Tilt3D delay={2} from={16} lift={120} float={0} origin="50% 100%">
            <Float amplitude={6} rotate={0.4} drift={2} seed="teaser" period={120} display="block">
              <PlatformCrop rect={crop} scene={scene} scale={scale} radius={22} elevation={1.4} screen={{ mode: 'animate', entranceDelay: 4 }} />
            </Float>
          </Tilt3D>
          {badge.trim() !== '' && (
            <div style={{ position: 'absolute', right: -14, top: -26 }}>
              <Badge label={badge} variant="brand" size={portrait ? 30 : 26} at={34} pulse />
            </div>
          )}
        </div>
      </Fill>
    </Backdrop>
  )
}

export const SocialTeaser = (props: SocialTeaserProps) => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={props.hookFrames}>
      <Hook {...props} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...makeTransition(props.transitionIn)} />
    <TransitionSeries.Sequence durationInFrames={props.shotFrames}>
      <Shot {...props} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition {...makeTransition(props.transitionOut)} />
    <TransitionSeries.Sequence durationInFrames={OUTRO}>
      <EndScene end={props.end} theme={props.theme} lockup="symbol" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
)

