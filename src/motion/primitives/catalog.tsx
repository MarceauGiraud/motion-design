/** Compositions de démonstration du module "primitives" (dossier Studio: Catalog/Primitives). */
import { Composition, Folder } from 'remotion'
import { FloatDemo } from './demo/FloatDemo'
import { JellyDemo } from './demo/JellyDemo'
import { ParallaxDemo } from './demo/ParallaxDemo'
import { PhysicsDemo } from './demo/PhysicsDemo'
import { PresenceDemo } from './demo/PresenceDemo'
import { RevealDemo } from './demo/RevealDemo'
import { SpringLabDemo } from './demo/SpringLabDemo'
import { StaggerDemo } from './demo/StaggerDemo'

const base = { fps: 30, width: 1920, height: 1080 } as const

export const Catalog = () => (
  <Folder name="Primitives">
    <Composition id="Primitives-Reveal" component={RevealDemo} durationInFrames={210} {...base} />
    <Composition id="Primitives-Stagger" component={StaggerDemo} durationInFrames={220} {...base} />
    <Composition id="Primitives-Presence" component={PresenceDemo} durationInFrames={240} {...base} />
    <Composition id="Primitives-SpringBox" component={SpringLabDemo} durationInFrames={210} {...base} />
    <Composition id="Primitives-Float" component={FloatDemo} durationInFrames={180} {...base} />
    <Composition id="Primitives-Parallax" component={ParallaxDemo} durationInFrames={210} {...base} />
    <Composition id="Primitives-MagnetWobble" component={JellyDemo} durationInFrames={180} {...base} />
    <Composition id="Primitives-Physics" component={PhysicsDemo} durationInFrames={240} {...base} />
  </Folder>
)
