/** Compositions de démonstration du module "text" (dossier Studio : Catalog/Text). */
import type { ReactNode } from 'react'
import { AbsoluteFill, Composition, Folder, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset } from '../physics/springs'
import { BRAND, FONT_BODY, FPS } from '../tokens'
import { CountUp } from './CountUp'
import { GradientText } from './GradientText'
import { Highlighter } from './Highlighter'
import { KineticHeadline } from './KineticHeadline'
import { Scramble } from './Scramble'
import { SplitReveal } from './SplitReveal'
import { TextMorph } from './TextMorph'
import { TypeWriter } from './TypeWriter'
import { WordRotator } from './WordRotator'
import { withAlpha } from './shared'

/** Palette locale des démos (hors marque). */
const DEMO = { white: '#FFFFFF', nightGlow: '#151233' } as const

/** Fond de démo : papier chaud (clair) ou nuit, halo doux. */
const Stage: React.FC<{ children: ReactNode; dark?: boolean }> = ({ children, dark = false }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? `radial-gradient(120% 90% at 50% 40%, ${DEMO.nightGlow} 0%, ${BRAND.night} 60%)`
        : `radial-gradient(110% 90% at 50% 35%, ${DEMO.white} 0%, ${BRAND.paper} 70%)`,
      alignItems: 'center',
      justifyContent: 'center',
      color: dark ? DEMO.white : BRAND.text,
    }}
  >
    {children}
  </AbsoluteFill>
)

/** Petit sur-titre (eyebrow) en Inter. */
const Eyebrow: React.FC<{ children: ReactNode; delay?: number; dark?: boolean }> = ({ children, delay = 0, dark }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = springPreset({ frame, fps, preset: 'smooth', delay })
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: dark ? withAlpha(DEMO.white, 0.55) : BRAND.textMuted,
        opacity: s,
        transform: `translateY(${(1 - s) * 12}px)`,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------

const KineticDemo = () => (
  <Stage>
    <KineticHeadline text={'Votre pipeline,\nenfin fluide.'} highlight={['fluide.']} exitAt={120} fontSize={150} />
  </Stage>
)

const KineticCharsDemo = () => (
  <Stage dark>
    <KineticHeadline text={'Ship faster.\nSell smarter.'} splitBy="char" mask highlight={['smarter.']} color={DEMO.white} fontSize={170} stagger={1.4} exitAt={100} />
  </Stage>
)

const TypeWriterDemo = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = springPreset({ frame, fps, preset: 'heavy' })
  return (
    <Stage>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
        <Eyebrow>Demandez à l’IA</Eyebrow>
        <div
          style={{
            width: 1320,
            padding: '38px 52px',
            borderRadius: 36,
            background: DEMO.white,
            border: `1px solid ${BRAND.border}`,
            boxShadow: `0 30px 80px ${withAlpha(BRAND.violet, 0.12)}, 0 4px 14px rgba(16,15,14,0.06)`,
            transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + 0.04 * s})`,
            opacity: s,
          }}
        >
          <TypeWriter
            text={['Trouve les deals bloqués depuis 30 jours', 'Relance les leads froids de mars, en français.']}
            startAt={14}
            fontSize={58}
            cps={21}
            hold={34}
          />
        </div>
      </div>
    </Stage>
  )
}

const CountUpDemo = () => (
  <Stage>
    <div style={{ display: 'flex', gap: 180, alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Eyebrow delay={4}>Pipeline signé</Eyebrow>
        <CountUp to={1284500} delay={10} suffix=" €" variant="odometer" preset="snappy" fontSize={150} affixStyle={{ color: BRAND.textMuted }} durationInFrames={70} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Eyebrow delay={8}>Taux de closing</Eyebrow>
        <CountUp from={12} to={38.5} decimals={1} delay={16} suffix=" %" fontSize={150} affixStyle={{ color: BRAND.rose }} />
      </div>
    </div>
  </Stage>
)

const TextMorphDemo = () => (
  <Stage>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <Eyebrow>Un seul outil pour</Eyebrow>
      <TextMorph words={['Prospects', 'Pipeline', 'Relances', 'Clients']} startAt={6} hold={36} fontSize={180} gradient />
    </div>
  </Stage>
)

const WordRotatorDemo = () => (
  <Stage>
    <WordRotator before="Le CRM des" words={['fondateurs', 'agences', 'équipes sales', 'freelances']} after="." startAt={30} interval={42} />
  </Stage>
)

const ScrambleDemo = () => (
  <Stage dark>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      <Eyebrow dark>Synchronisation</Eyebrow>
      <Scramble text="12 480 contacts importés" color={DEMO.white} fontSize={104} startAt={8} />
    </div>
  </Stage>
)

const HighlighterDemo = () => (
  <Stage>
    <Highlighter
      parts={[
        'Chaque relance ',
        { text: 'au bon moment', mark: 'marker' },
        ',\nsans ',
        { text: 'aucun tableur', mark: 'strike' },
        '. ',
        { text: 'Enfin', mark: 'circle' },
        '.',
      ]}
      startAt={4}
      fontSize={104}
    />
  </Stage>
)

const GradientTextDemo = () => (
  <Stage dark>
    <GradientText text="Acme" fontSize={300} enterAt={4} revealAt={16} baseColor={DEMO.white} shineAt={70} speed={0.18} />
  </Stage>
)

const SplitRevealDemo = () => (
  <Stage>
    <SplitReveal text="Tout votre business." revealText="Un seul endroit." splitAt={42} />
  </Stage>
)

/** Enchaînement court : ce que donne le module dans un film. */
const ShowcaseDemo = () => {
  const frame = useCurrentFrame()
  const fadeOut = (start: number, len: number) => interpolate(frame, [start + len - 8, start + len], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <Stage>
      <Sequence durationInFrames={95} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <KineticHeadline text={'Votre CRM,\nenfin fluide.'} highlight={['fluide.']} exitAt={78} fontSize={150} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={90} durationInFrames={120} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fadeOut(90, 120) }}>
          <WordRotator before="Pensé pour les" words={['fondateurs', 'agences', 'équipes sales']} after="." enterAt={4} startAt={30} interval={32} steps={2} fontSize={104} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={210} durationInFrames={100} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 20, opacity: fadeOut(210, 100) }}>
          <Eyebrow delay={2}>Pipeline signé ce trimestre</Eyebrow>
          <CountUp to={1284500} delay={6} suffix=" €" variant="odometer" preset="snappy" fontSize={170} durationInFrames={50} affixStyle={{ color: BRAND.textMuted }} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={310} durationInFrames={110} layout="none">
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <SplitReveal text="Tout votre business." revealText="Un seul endroit." splitAt={34} />
        </AbsoluteFill>
      </Sequence>
    </Stage>
  )
}

// ---------------------------------------------------------------------------

const W = 1920
const H = 1080

export const Catalog = () => (
  <Folder name="Text">
    <Composition id="Text-KineticHeadline" component={KineticDemo} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="Text-KineticHeadlineChars" component={KineticCharsDemo} durationInFrames={130} fps={FPS} width={W} height={H} />
    <Composition id="Text-TypeWriter" component={TypeWriterDemo} durationInFrames={240} fps={FPS} width={W} height={H} />
    <Composition id="Text-CountUp" component={CountUpDemo} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="Text-TextMorph" component={TextMorphDemo} durationInFrames={240} fps={FPS} width={W} height={H} />
    <Composition id="Text-WordRotator" component={WordRotatorDemo} durationInFrames={210} fps={FPS} width={W} height={H} />
    <Composition id="Text-Scramble" component={ScrambleDemo} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="Text-Highlighter" component={HighlighterDemo} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="Text-GradientText" component={GradientTextDemo} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="Text-SplitReveal" component={SplitRevealDemo} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="Text-Showcase" component={ShowcaseDemo} durationInFrames={420} fps={FPS} width={W} height={H} />
  </Folder>
)
