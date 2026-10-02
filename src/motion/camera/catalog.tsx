/** Compositions de démonstration du module caméra (dossier Studio : Catalog/Camera). */
import type { ReactNode } from 'react'
import { AbsoluteFill, Composition, Folder, interpolate, useCurrentFrame } from 'remotion'
import { PlatformScreen, type PlatformSceneKey } from '../../kit/Platform'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY, FPS } from '../tokens'
import { Camera } from './Camera'
import { HANDHELD_DEMO_FRAMES, HandheldDemo } from './HandheldDemo'
import { DollyZoom, OrbitCards, Tilt3D } from './Depth'
import { centeredPlacement, platformPointToStage, platformRectToStage, PLATFORM_REGIONS as R, rectCenter } from './geometry'
import { CropFlyOut, PlacedPlatform, PlatformCrop } from './PlatformCrop'
import { Callout, FocusRing } from '../ui/Highlight'
import { Cursor } from '../ui/Cursor'
import { Badge } from '../ui/Indicators'
import { NotificationCard } from '../ui/Notifications'

const W = 1920
const H = 1080
const PLACE = centeredPlacement(1600, W, H)

/** Fond papier + lueur de marque très diffuse. */
const Paper = ({ children }: { children?: ReactNode }) => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <div style={{ position: 'absolute', left: '15%', right: '15%', top: '20%', bottom: '10%', backgroundImage: BRAND_RAMP, filter: 'blur(180px)', opacity: 0.12 }} />
    {children}
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------

/** Grille de coordonnées sur une scène plateforme 1440x900 : pour relever des rects. */
const PlatformGrid = ({ scene }: { scene: PlatformSceneKey }) => (
  <AbsoluteFill>
    <PlatformScreen scene={scene} mode="static" />
    <svg width={1440} height={900} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 15 }, (_, i) => (
        <g key={'x' + i}>
          <line x1={i * 100} y1={0} x2={i * 100} y2={900} stroke={BRAND.rose} strokeOpacity={0.35} />
          <text x={i * 100 + 2} y={12} fontSize={11} fill={BRAND.rose}>{i * 100}</text>
        </g>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <g key={'y' + i}>
          <line x1={0} y1={i * 100} x2={1440} y2={i * 100} stroke={BRAND.ink} strokeOpacity={0.35} />
          <text x={2} y={i * 100 + 12} fontSize={11} fill={BRAND.ink}>{i * 100}</text>
        </g>
      ))}
    </svg>
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------

/** Keyframes : plan large incliné -> push sur la toolbar (clic Créer) -> colonne Statut en biais -> retour. */
const KeyframesDemo = () => {
  const create = platformPointToStage(rectCenter(R.companies.createButton), PLACE)
  const row = platformPointToStage({ x: 1335, y: 167 }, PLACE)
  return (
    <Paper>
      <Camera
        drift
        platform={PLACE}
        keyframes={[
          { at: 0, zoom: 0.86, rotateX: 14, y: 600 },
          { at: 4, zoom: 1, rotateX: 0, y: H / 2 },
          { at: 50, focus: { rect: { x: 980, y: 0, w: 460, h: 130 }, padding: 120, maxZoom: 2.6 } },
          { at: 118, focus: { rect: { x: 1080, y: 82, w: 360, h: 300 }, padding: 90, maxZoom: 2.4 }, rotateY: -7 },
          { at: 190, zoom: 1, x: W / 2, y: H / 2, rotateY: 0 },
        ]}
      >
        <PlacedPlatform placement={PLACE}>
          <PlatformScreen scene="companies" />
        </PlacedPlatform>
        <Cursor
          waypoints={[
            { at: 70, x: 1100, y: 420 },
            { at: 96, x: create.x, y: create.y, click: true, hand: true },
            { at: 150, x: row.x, y: row.y, hand: true },
          ]}
          size={24}
        />
      </Camera>
    </Paper>
  )
}

/** Focus : la caméra cadre successivement des cartes du pipeline, un anneau les souligne. */
const FocusDemo = () => {
  const heli = platformRectToStage(R.pipeline.cardInitech, PLACE)
  const meca = platformRectToStage(R.pipeline.cardUmbrella, PLACE)
  return (
    <Paper>
      <Camera
        platform={PLACE}
        drift={{ amplitude: 4 }}
        keyframes={[
          { at: 0 },
          { at: 24, focus: { rect: R.pipeline.cardInitech, padding: 260 } },
          { at: 84, focus: { rect: R.pipeline.cardUmbrella, padding: 260 } },
          { at: 140, focus: { rect: { x: 200, y: 90, w: 1240, h: 460 }, padding: 60 } },
        ]}
      >
        <PlacedPlatform placement={PLACE}>
          <PlatformScreen scene="pipeline" />
        </PlacedPlatform>
        <FocusRing steps={[{ at: 40, rect: heli, radius: 11 }, { at: 90, rect: meca, radius: 11 }]} until={140} gap={5} thickness={2.5} />
      </Camera>
    </Paper>
  )
}

/** Tilt hero : la fenêtre arrive inclinée à 11° et se redresse, sous un titre. */
const Tilt3DDemo = () => {
  const frame = useCurrentFrame()
  const t = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <Paper>
      <div style={{ position: 'absolute', top: 92, width: '100%', textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 16}px)` }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 76, letterSpacing: '-0.03em', color: BRAND.text }}>Le CRM qui travaille pour vous.</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 24, color: BRAND.textMuted, marginTop: 10 }}>Emails, LinkedIn, WhatsApp : tout remonte dans vos fiches.</div>
      </div>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Tilt3D delay={8}>
          <div style={{ width: 1440 * 1.08, height: 900 * 1.08 }}>
            <PlacedPlatform placement={{ x: 0, y: 0, width: 1440 * 1.08 }}>
              <PlatformScreen scene="companies" entranceDelay={14} />
            </PlacedPlatform>
          </div>
        </Tilt3D>
      </div>
    </Paper>
  )
}

/** Dolly zoom : la carte deal garde sa taille, l'app derrière s'éloigne (vertigo). */
const DollyZoomDemo = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <DollyZoom
      delay={12}
      durationInFrames={80}
      from={5000}
      to={650}
      background={
        <AbsoluteFill>
          <PlacedPlatform placement={PLACE} halo={false}>
            <PlatformScreen scene="pipeline" mode="static" />
          </PlacedPlatform>
          <AbsoluteFill style={{ background: 'rgba(244,242,240,0.35)' }} />
        </AbsoluteFill>
      }
      layers={[
        {
          depth: 450,
          node: (
            <AbsoluteFill>
              <Badge label="+88 k€" variant="success" size={26} at={20} style={{ position: 'absolute', left: 540, top: 250 }} />
              <Badge label="Réunion jeudi 14h" variant="blue" size={24} at={26} style={{ position: 'absolute', left: 1180, top: 780 }} />
              <Badge label="L’IA a enrichi 3 fiches" variant="brand" size={24} at={32} style={{ position: 'absolute', left: 1240, top: 260 }} />
            </AbsoluteFill>
          ),
        },
      ]}
      subject={
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PlatformCrop rect={R.pipeline.cardInitech} scene="pipeline" scale={2.4} radius={22} elevation={1.6} />
        </AbsoluteFill>
      }
    />
  </AbsoluteFill>
)

/** Orbite : fragments d'UI en lévitation 3D sur fond nuit. */
const OrbitDemo = () => (
  <AbsoluteFill style={{ background: BRAND.night }}>
    <div style={{ position: 'absolute', left: '25%', right: '25%', top: '25%', bottom: '25%', backgroundImage: BRAND_RAMP, filter: 'blur(200px)', opacity: 0.35 }} />
    <OrbitCards
      delay={4}
      tilt={-4}
      cards={[
        { node: <PlatformCrop rect={{ x: 200, y: 82, w: 700, h: 250 }} scene="companies" scale={1.3} />, x: 0, y: 0, z: 0 },
        { node: <PlatformCrop rect={R.pipeline.cardInitech} scene="pipeline" scale={1.6} />, x: -540, y: -250, z: 180, rotateY: 8 },
        { node: <PlatformCrop rect={R.inbox.bubbleFirst} scene="inbox" scale={1.15} />, x: 500, y: -270, z: 120, rotateY: -8 },
        { node: <PlatformCrop rect={{ x: 512, y: 250, w: 620, h: 160 }} scene="contact" scale={1.05} />, x: 470, y: 250, z: 200, rotateY: -6 },
        { node: <NotificationCard title="Nouveau deal : Ramp — 42 k€" body="Ajouté en Proposition par l’IA" />, x: -500, y: 250, z: 260, rotateY: 10 },
        { node: <PlatformCrop rect={R.contact.fields} scene="contact" scale={0.8} />, x: 860, y: -10, z: -380, rotateY: -14 },
        { node: <PlatformCrop rect={R.pipeline.cardUmbrella} scene="pipeline" scale={1.3} />, x: -880, y: 10, z: -340, rotateY: 14 },
      ]}
    />
  </AbsoluteFill>
)

/** Fly-out : la carte Helioma quitte le pipeline, vient au premier plan, une annotation la décrit. */
const FlyOutDemo = () => {
  const frame = useCurrentFrame()
  const target = { x: 1180, y: 540 }
  return (
    <Paper>
      <Camera platform={PLACE} keyframes={[{ at: 0 }, { at: 34, zoom: 1.05, x: 1000, y: 540 }]} motionBlur={false}>
        <PlacedPlatform placement={PLACE}>
          <PlatformScreen scene="pipeline" />
        </PlacedPlatform>
        <AbsoluteFill style={{ background: BRAND.night, opacity: interpolate(frame, [36, 60], [0, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
        <CropFlyOut placement={PLACE} rect={R.pipeline.cardInitech} scene="pipeline" at={36} to={{ x: target.x, y: target.y, scale: 2.3, rotateY: -10, rotateX: 4 }} />
        <Callout target={{ x: target.x - 290, y: target.y + 60 }} offset={{ x: -170, y: 130 }} at={78} title="88 000 € en réunion" body="Relance planifiée par l’IA, jeudi 14h." badge="1" />
      </Camera>
    </Paper>
  )
}

export const Catalog = () => (
  <Folder name="Camera">
    <Composition id="Camera-Keyframes" component={KeyframesDemo} durationInFrames={240} fps={FPS} width={W} height={H} />
    <Composition id="Camera-Focus" component={FocusDemo} durationInFrames={200} fps={FPS} width={W} height={H} />
    <Composition id="Camera-Tilt3D" component={Tilt3DDemo} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="Camera-DollyZoom" component={DollyZoomDemo} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="Camera-OrbitCards" component={OrbitDemo} durationInFrames={180} fps={FPS} width={W} height={H} />
    <Composition id="Camera-Handheld" component={HandheldDemo} durationInFrames={HANDHELD_DEMO_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Camera-FlyOut" component={FlyOutDemo} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition
      id="Camera-PlatformGrid"
      component={PlatformGrid}
      defaultProps={{ scene: 'companies' as PlatformSceneKey }}
      durationInFrames={30}
      fps={FPS}
      width={1440}
      height={900}
    />
  </Folder>
)
