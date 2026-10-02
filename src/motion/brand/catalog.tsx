/** Compositions de démonstration du module "brand" (dossier Studio: Catalog/Brand). */
import { AbsoluteFill, Composition, Folder } from 'remotion'
import { PlatformScreen, PlatformWindow } from '../../kit/Platform'
import { Aurora } from '../backgrounds/Aurora'
import { MeshGradient } from '../backgrounds/MeshGradient'
import { PaperBackground } from '../backgrounds/PaperBackground'
import { EndCard } from './EndCard'
import { LogoReveal } from './LogoReveal'
import { LowerThird } from './LowerThird'
import { TitleCard } from './TitleCard'
import { Watermark } from './Watermark'

const W = 1920
const H = 1080

const LogoDraw = () => (
  <PaperBackground tint={1}>
    <LogoReveal variant="draw" delay={8} />
  </PaperBackground>
)
const LogoSweep = () => (
  <MeshGradient theme="dark" intensity={0.4}>
    <LogoReveal variant="sweep" theme="dark" delay={8} />
  </MeshGradient>
)
const LogoConverge = () => (
  <Aurora intensity={0.35}>
    <LogoReveal variant="converge" theme="dark" delay={8} />
  </Aurora>
)
const LogoMorph = () => (
  <PaperBackground tint={1}>
    <LogoReveal variant="morph" delay={8} />
  </PaperBackground>
)
const LogoSymbolOnly = () => (
  <PaperBackground>
    <LogoReveal variant="draw" lockup="symbol" delay={8} exitAt={100} />
  </PaperBackground>
)

const LowerThirdDemo = () => (
  <PaperBackground>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: 'translateY(-60px)' }}>
      <PlatformWindow width={1400} halo={false}>
        <PlatformScreen scene="contact" mode="static" />
      </PlatformWindow>
    </AbsoluteFill>
    <LowerThird delay={10} exitAt={130} badge="Client" />
  </PaperBackground>
)
const LowerThirdDark = () => (
  <MeshGradient theme="dark" intensity={0.45}>
    <LowerThird theme="dark" title="Marc Aubert" subtitle="Fondateur, Acme" avatar="images/people/ma.jpg" position="right" delay={10} />
  </MeshGradient>
)

const WatermarkDemo = () => (
  <PaperBackground>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <PlatformWindow width={1500} halo>
        <PlatformScreen scene="pipeline" mode="static" />
      </PlatformWindow>
    </AbsoluteFill>
    <Watermark />
  </PaperBackground>
)

export const Catalog = () => (
  <Folder name="Brand">
    <Composition id="Brand-LogoDraw" component={LogoDraw} durationInFrames={120} fps={30} width={W} height={H} />
    <Composition id="Brand-LogoSweep" component={LogoSweep} durationInFrames={100} fps={30} width={W} height={H} />
    <Composition id="Brand-LogoConverge" component={LogoConverge} durationInFrames={110} fps={30} width={W} height={H} />
    <Composition id="Brand-LogoMorph" component={LogoMorph} durationInFrames={100} fps={30} width={W} height={H} />
    <Composition id="Brand-LogoSymbol" component={LogoSymbolOnly} durationInFrames={130} fps={30} width={W} height={H} />
    <Composition id="Brand-EndCard" component={() => <EndCard />} durationInFrames={150} fps={30} width={W} height={H} />
    <Composition id="Brand-EndCardDark" component={() => <EndCard theme="dark" logoVariant="converge" logoLockup="horizontal" />} durationInFrames={170} fps={30} width={W} height={H} />
    <Composition id="Brand-EndCardPortrait" component={() => <EndCard />} durationInFrames={150} fps={30} width={1080} height={1920} />
    <Composition id="Brand-LowerThird" component={LowerThirdDemo} durationInFrames={160} fps={30} width={W} height={H} />
    <Composition id="Brand-LowerThirdDark" component={LowerThirdDark} durationInFrames={120} fps={30} width={W} height={H} />
    <Composition id="Brand-TitleCard" component={() => <TitleCard exitAt={110} />} durationInFrames={140} fps={30} width={W} height={H} />
    <Composition id="Brand-TitleCardDark" component={() => <TitleCard theme="dark" background="mesh" align="left" eyebrow="03 — IA" title="Votre IA commerciale." highlight={['IA']} subtitle="Elle enrichit, relance et résume. Vous signez." />} durationInFrames={120} fps={30} width={W} height={H} />
    <Composition id="Brand-Watermark" component={WatermarkDemo} durationInFrames={90} fps={30} width={W} height={H} />
  </Folder>
)
