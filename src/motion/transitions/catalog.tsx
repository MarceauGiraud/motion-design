/** Compositions de démonstration du module "transitions" (dossier Studio: Catalog/Transitions). */
import type { ReactNode } from 'react'
import { AbsoluteFill, Composition, Folder } from 'remotion'
import { TransitionSeries } from '@remotion/transitions'
import { FPS, FORMATS } from '../tokens'
import { NightTitleScene, PeopleScene, PlatformDemoScene, RampScene, StatScene, TransitionLabel } from './DemoScenes'
import { brandTransition, TRANSITIONS, TRANSITION_NAMES, type BrandTransitionOptions, type TransitionName } from './registry'

type SceneKey = 'night' | 'companies' | 'inbox' | 'pipeline' | 'contact' | 'ramp' | 'stat' | 'people' | 'companiesNight'

const SCENES: Record<SceneKey, () => ReactNode> = {
  night: () => <NightTitleScene />,
  companies: () => <PlatformDemoScene scene="companies" tone="paper" />,
  companiesNight: () => <PlatformDemoScene scene="companies" tone="night" />,
  inbox: () => <PlatformDemoScene scene="inbox" tone="blue" />,
  pipeline: () => <PlatformDemoScene scene="pipeline" tone="night" />,
  contact: () => <PlatformDemoScene scene="contact" tone="paper" />,
  ramp: () => <RampScene />,
  stat: () => <StatScene />,
  people: () => <PeopleScene />,
}

/** Paire de scènes + options de démo pour chaque transition. */
const DEMOS: { [K in TransitionName]: { a: SceneKey; b: SceneKey; options?: BrandTransitionOptions<K> } } = {
  circleReveal: { a: 'night', b: 'ramp', options: { origin: { x: 0.5, y: 0.62 } } },
  zoomThrough: { a: 'companies', b: 'stat' },
  blurDissolve: { a: 'ramp', b: 'inbox' },
  liquidWipe: { a: 'stat', b: 'people', options: { direction: 'up' } },
  gooeyMorph: { a: 'night', b: 'people', options: { origin: { x: 0.5, y: 0.8 } } },
  splitPanels: { a: 'people', b: 'pipeline' },
  flip3D: { a: 'contact', b: 'stat' },
  cubeRotate: { a: 'ramp', b: 'companies' },
  slidePush: { a: 'inbox', b: 'companies' },
  shapeMorphMask: { a: 'stat', b: 'night' },
  gridTiles: { a: 'stat', b: 'pipeline' },
  brandRampSweep: { a: 'companies', b: 'night' },
}

const A_LEN = 50
const B_LEN = 70

const compId = (name: TransitionName) => `Transitions-${name.charAt(0).toUpperCase()}${name.slice(1)}`

function TransitionDemo({ name }: { name: TransitionName }) {
  const demo = DEMOS[name] as { a: SceneKey; b: SceneKey; options?: BrandTransitionOptions<typeof name> }
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>{SCENES[demo.a]()}</TransitionSeries.Sequence>
        <TransitionSeries.Transition {...brandTransition(name, demo.options)} />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>{SCENES[demo.b]()}</TransitionSeries.Sequence>
      </TransitionSeries>
      <TransitionLabel name={name} detail={TRANSITIONS[name].label} />
    </AbsoluteFill>
  )
}

/** Ordre et scènes du reel : alternance clair / sombre / couleur. */
const REEL_SCENES: SceneKey[] = ['night', 'companies', 'stat', 'ramp', 'inbox', 'people', 'pipeline', 'contact', 'ramp', 'companiesNight', 'stat', 'night', 'companies']
const REEL_OPTIONS: Partial<{ [K in TransitionName]: BrandTransitionOptions<K> }> = {
  liquidWipe: { direction: 'up' },
  gooeyMorph: { origin: { x: 0.5, y: 0.8 } },
}
const REEL_SCENE_LEN = 80

function TransitionsReel() {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {REEL_SCENES.flatMap((key, i) => {
          const seq = (
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={REEL_SCENE_LEN}>
              {SCENES[key]()}
            </TransitionSeries.Sequence>
          )
          const name = TRANSITION_NAMES[i]
          if (!name) return [seq]
          return [seq, <TransitionSeries.Transition key={`t${i}`} {...brandTransition(name, REEL_OPTIONS[name] as never)} />]
        })}
      </TransitionSeries>
    </AbsoluteFill>
  )
}

const reelDuration =
  REEL_SCENES.length * REEL_SCENE_LEN - TRANSITION_NAMES.slice(0, REEL_SCENES.length - 1).reduce((acc, n) => acc + TRANSITIONS[n].durationInFrames, 0)

export const Catalog = () => (
  <Folder name="Transitions">
    {TRANSITION_NAMES.map((name) => (
      <Composition
        key={name}
        id={compId(name)}
        component={TransitionDemo}
        defaultProps={{ name }}
        durationInFrames={A_LEN + B_LEN - TRANSITIONS[name].durationInFrames}
        fps={FPS}
        width={FORMATS.landscape.width}
        height={FORMATS.landscape.height}
      />
    ))}
    <Composition
      id="Transitions-Reel"
      component={TransitionsReel}
      durationInFrames={reelDuration}
      fps={FPS}
      width={FORMATS.landscape.width}
      height={FORMATS.landscape.height}
    />
  </Folder>
)
