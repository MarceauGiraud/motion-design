/** Compositions de démonstration du module "backgrounds" (dossier Studio: Catalog/Backgrounds). */
import { AbsoluteFill, Composition, Folder } from 'remotion'
import { PlatformScreen, PlatformWindow } from '../../kit/Platform'
import { BRAND, FONT_DISPLAY } from '../tokens'
import { Aurora } from './Aurora'
import { Grain } from './Grain'
import { GridBackground } from './GridBackground'
import { LightRays } from './LightRays'
import { MeshGradient } from './MeshGradient'
import { PaperBackground } from './PaperBackground'
import { Particles } from './Particles'
import { Spotlight } from './Spotlight'

const W = 1920
const H = 1080

/** Étiquette discrète pour lire le nom du fond dans le Studio. */
const Label: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 88, letterSpacing: '-0.035em', color: dark ? '#FFFFFF' : BRAND.text }}>{text}</div>
  </AbsoluteFill>
)

const GrainDemo = () => (
  <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.ink})` }}>
    <Label text="Grain" dark />
    <Grain opacity={0.14} />
  </AbsoluteFill>
)

const SpotlightDemo = () => (
  <PaperBackground>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <PlatformWindow width={1560} halo={false}>
        <PlatformScreen scene="companies" mode="static" />
      </PlatformWindow>
    </AbsoluteFill>
    <Spotlight mode="dim" />
  </PaperBackground>
)

const SpotlightGlowDemo = () => (
  <MeshGradient theme="dark" intensity={0.35}>
    <Spotlight mode="glow" color={BRAND.rose} />
    <Label text="Spotlight" dark />
  </MeshGradient>
)

export const Catalog = () => (
  <Folder name="Backgrounds">
    <Composition id="Backgrounds-Paper" component={() => <PaperBackground tint={1}><Label text="Paper" /></PaperBackground>} durationInFrames={600} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-MeshLight" component={() => <MeshGradient><Label text="Mesh gradient" /></MeshGradient>} durationInFrames={600} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-MeshDark" component={() => <MeshGradient theme="dark"><Label text="Mesh gradient" dark /></MeshGradient>} durationInFrames={600} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-GridPerspective" component={() => <GridBackground />} durationInFrames={300} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-GridPerspectiveDark" component={() => <GridBackground theme="dark" />} durationInFrames={300} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-GridFlat" component={() => <GridBackground variant="flat" theme="dark"><Label text="Grid" dark /></GridBackground>} durationInFrames={300} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-Grain" component={GrainDemo} durationInFrames={90} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-AuroraDark" component={() => <Aurora><Label text="Aurora" dark /></Aurora>} durationInFrames={600} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-AuroraLight" component={() => <Aurora theme="light"><Label text="Aurora" /></Aurora>} durationInFrames={600} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-Particles" component={() => <PaperBackground><Particles /></PaperBackground>} durationInFrames={900} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-Constellation" component={() => <Particles theme="dark" base={BRAND.night} count={110} links={170} direction="none" />} durationInFrames={900} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-LightRays" component={() => <LightRays><Label text="Light rays" dark /></LightRays>} durationInFrames={450} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-LightRaysLight" component={() => <LightRays theme="light"><Label text="Light rays" /></LightRays>} durationInFrames={450} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-SpotlightDim" component={SpotlightDemo} durationInFrames={180} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-SpotlightGlow" component={SpotlightGlowDemo} durationInFrames={180} fps={30} width={W} height={H} />
    <Composition id="Backgrounds-MeshPortrait" component={() => <MeshGradient><Label text="Acme" /></MeshGradient>} durationInFrames={600} fps={30} width={1080} height={1920} />
  </Folder>
)
