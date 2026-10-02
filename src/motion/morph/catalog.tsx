/** Compositions de démonstration du module "morph" (dossier Studio: Catalog/Morph). */
import type { ReactNode } from 'react'
import { Bell, Building2, Inbox, Play, Sparkles, SquareKanban, UserRound, Zap } from 'lucide-react'
import { AbsoluteFill, Composition, Folder, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS, BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY, FPS } from '../tokens'
import { springPreset } from '../physics/springs'
import { PLATFORM_HEIGHT, PLATFORM_WIDTH, PlatformScreen } from '../../kit/Platform'
import { ContainerMorph, MagicMove, SharedElement } from './ContainerMorph'
import { CardToWindow, FeatureCard } from './CardToWindow'
import { ShapeMorph } from './ShapeMorph'
import { MorphBlob } from './MorphBlob'
import { IconMorph } from './IconMorph'
import { LiquidButton } from './LiquidButton'
import { centeredRect } from './core'
import type { IconInput } from './icons'

const Paper = ({ children }: { children: ReactNode }) => <AbsoluteFill style={{ background: BRAND.paper }}>{children}</AbsoluteFill>

/** Légende discrète en bas de cadre. */
const Caption = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 56,
      textAlign: 'center',
      fontFamily: FONT_BODY,
      fontSize: 22,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: dark ? 'rgba(255,255,255,0.45)' : BRAND.textMuted,
    }}
  >
    {children}
  </div>
)

// ---------------------------------------------------------------------------
// 1. Pilule -> carte -> fenêtre plateforme (ContainerMorph, 3 états)
// ---------------------------------------------------------------------------

const PillFace = () => (
  <div style={{ width: 380, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#fff', fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 500 }}>
    <div style={{ width: 44, height: 44, borderRadius: 22, backgroundImage: BRAND_RAMP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Play size={20} color="#fff" fill="#fff" />
    </div>
    Voir Acme en action
  </div>
)

const FEATURES: Array<[typeof Sparkles, string, string]> = [
  [Sparkles, 'L’IA enrichit vos fiches', 'Secteur, taille, décideurs : en un clic.'],
  [Inbox, 'Inbox unifiée', 'Email, LinkedIn et WhatsApp au même endroit.'],
  [Zap, 'Relances automatiques', 'Aucun deal ne tombe entre deux chaises.'],
]

const PromoCard = () => (
  <div style={{ width: 760, height: 460, padding: 48, boxSizing: 'border-box', fontFamily: FONT_BODY, color: BRAND.text }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 46, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
      Votre CRM,{' '}
      <span style={{ backgroundImage: BRAND_RAMP, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>piloté par l’IA</span>
    </div>
    <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 26 }}>
      {FEATURES.map(([Icon, t, s]) => (
        <div key={t} style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: BRAND.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={26} color={BRAND.violet} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: 19, color: BRAND.textMuted, marginTop: 4 }}>{s}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const PillToWindow = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = springPreset({ frame, fps, preset: 'snappy' })
  const winH = 940
  const winW = Math.round((winH * PLATFORM_WIDTH) / PLATFORM_HEIGHT)
  return (
    <Paper>
      <AbsoluteFill style={{ transform: `scale(${0.6 + 0.4 * pop})`, opacity: Math.min(1, pop * 1.5) }}>
        <ContainerMorph
          keyframes={[
            { at: 0, rect: centeredRect(380, 88), radius: 44, background: BRAND.text, elevation: 0.6, content: <PillFace /> },
            { at: 40, rect: centeredRect(760, 460), radius: 36, background: '#FFFFFF', borderColor: 'rgba(16,15,14,0.06)', elevation: 0.8, content: <PromoCard /> },
            {
              at: 118,
              preset: 'heavy',
              rect: centeredRect(winW, winH),
              radius: 16,
              background: BRAND.wing,
              elevation: 1,
              contentSize: { width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
              contentFit: 'width',
              contentAnchor: 'top',
              content: (
                <Sequence from={118} layout="none">
                  <PlatformScreen scene="companies" assistant={{ openAt: 50, askAt: 66 }} />
                </Sequence>
              ),
            },
          ]}
        />
      </AbsoluteFill>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// 2. MagicMove : notification -> message ouvert -> retour
// ---------------------------------------------------------------------------

const Avatar = ({ src, size }: { src: string; size: number }) => (
  <Img src={staticFile(src)} style={{ width: size, height: size, borderRadius: size / 2, objectFit: 'cover' }} />
)

const Toast = () => (
  <div style={{ width: 560, height: 104, display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', boxSizing: 'border-box', fontFamily: FONT_BODY, color: '#fff' }}>
    <Avatar src="images/people/em.jpg" size={60} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 600 }}>Élodie Mercier</div>
      <div style={{ fontSize: 19, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ok pour une démo jeudi ?</div>
    </div>
    <Bell size={26} color="#fff" />
  </div>
)

const Message = () => (
  <div style={{ width: 820, height: 520, padding: 48, boxSizing: 'border-box', fontFamily: FONT_BODY, color: BRAND.text, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <Avatar src="images/people/em.jpg" size={84} />
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em' }}>Élodie Mercier</div>
        <div style={{ fontSize: 20, color: BRAND.textMuted, marginTop: 4 }}>Head of Sales · Globex</div>
      </div>
    </div>
    <div style={{ marginTop: 36, fontSize: 26, lineHeight: 1.5 }}>
      Bonjour, merci pour l'échange d'hier. Ok pour une démo jeudi à 15h ? J'ajoute notre directeur commercial à l'invitation.
    </div>
    <div style={{ marginTop: 'auto', display: 'flex', gap: 14 }}>
      <div style={{ padding: '16px 28px', borderRadius: 999, backgroundImage: BRAND_RAMP, color: '#fff', fontSize: 21, fontWeight: 600 }}>Répondre avec l’IA</div>
      <div style={{ padding: '16px 28px', borderRadius: 999, background: BRAND.paper, fontSize: 21, fontWeight: 600 }}>Planifier</div>
    </div>
  </div>
)

const MagicMoveDemo = () => (
  <Paper>
    <MagicMove
      from={{ rect: centeredRect(560, 104, 1920, 1080, 0, -380), radius: 52, background: BRAND.text, elevation: 0.7 }}
      to={{ rect: centeredRect(820, 520), radius: 36, background: '#FFFFFF', borderColor: 'rgba(16,15,14,0.06)', elevation: 1 }}
      at={30}
      returnAt={120}
      fromContent={<Toast />}
      toContent={<Message />}
    />
  </Paper>
)

// ---------------------------------------------------------------------------
// 3. SharedElement : une photo de la grille devient le héros
// ---------------------------------------------------------------------------

const PEOPLE = ['ab', 'cb', 'em', 'hl', 'jr', 'ma', 'ns', 'sk']
const TILE = 180
const GAP = 28
const GRID_X = (1920 - (TILE * 4 + GAP * 3)) / 2
const GRID_Y = (1080 - (TILE * 2 + GAP)) / 2

const SharedElementDemo = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const at = 40
  const hero = 2
  const heroRect = { x: 300, y: 230, width: 620, height: 620 }
  const tileRect = (i: number) => ({ x: GRID_X + (i % 4) * (TILE + GAP), y: GRID_Y + Math.floor(i / 4) * (TILE + GAP), width: TILE, height: TILE })
  const text = springPreset({ frame, fps, preset: 'smooth', delay: at + 14 })
  return (
    <Paper>
      {PEOPLE.map((p, i) => {
        if (i === hero) return null
        const enter = springPreset({ frame, fps, preset: 'snappy', delay: i * 2 })
        const out = springPreset({ frame, fps, preset: 'smooth', delay: at - 4 + Math.abs(i - hero) * 1.5 })
        const r = tileRect(i)
        return (
          <div
            key={p}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: TILE,
              height: TILE,
              borderRadius: TILE / 2,
              overflow: 'hidden',
              opacity: enter * (1 - out),
              transform: `scale(${(0.7 + 0.3 * enter) * (1 - 0.25 * out)}) translateY(${out * 40}px)`,
              filter: out > 0.02 ? `blur(${(out * 10).toFixed(2)}px)` : undefined,
            }}
          >
            <Img src={staticFile(`images/people/${p}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )
      })}
      <SharedElement from={{ rect: tileRect(hero), radius: TILE / 2, elevation: 0.2 }} to={{ rect: heroRect, radius: 44, elevation: 1 }} at={at} preset="morph" contentSize={{ width: 620, height: 620 }}>
        <Img src={staticFile(`images/people/${PEOPLE[hero]}.jpg`)} style={{ width: 620, height: 620, objectFit: 'cover' }} />
      </SharedElement>
      <div style={{ position: 'absolute', left: 1020, top: 360, fontFamily: FONT_BODY, color: BRAND.text, opacity: text, transform: `translateX(${(1 - text) * 60}px)`, filter: `blur(${((1 - text) * 8).toFixed(2)}px)` }}>
        <div style={{ fontSize: 26, color: BRAND.violet, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Contact clé</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 96, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 12 }}>Élodie Mercier</div>
        <div style={{ fontSize: 32, color: BRAND.textMuted, marginTop: 14 }}>Head of Sales · Globex · Paris</div>
      </div>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// 4. CardToWindow : trois cartes, celle du milieu s'ouvre sur le pipeline
// ---------------------------------------------------------------------------

const SideCard = ({ x, icon, title, subtitle, at, dir }: { x: number; icon: typeof Building2; title: string; subtitle: string; at: number; dir: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const inP = springPreset({ frame, fps, preset: 'smooth', delay: 4 })
  const out = springPreset({ frame, fps, preset: 'smooth', delay: at - 2 })
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: (1080 - 288) / 2,
        width: 460,
        height: 288,
        borderRadius: 28,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(16,15,14,0.06), 0 18px 50px -20px rgba(16,15,14,0.3), inset 0 0 0 1px rgba(16,15,14,0.06)',
        opacity: inP * (1 - out),
        transform: `translate(${dir * out * 160}px, ${(1 - inP) * 40}px) scale(${1 - 0.12 * out})`,
        filter: `blur(${((1 - inP) * 10 + out * 12).toFixed(2)}px)`,
      }}
    >
      <FeatureCard icon={icon} title={title} subtitle={subtitle} width={460} height={288} />
    </div>
  )
}

const CardToWindowDemo = () => (
  <Paper>
    <SideCard x={1920 / 2 - 230 - 500} icon={Inbox} title="Inbox unifiée" subtitle="Email, LinkedIn, WhatsApp au même endroit" at={40} dir={-1} />
    <SideCard x={1920 / 2 - 230 + 500} icon={UserRound} title="Fiche contact" subtitle="Chaque échange, chaque signal" at={40} dir={1} />
    <CardToWindow scene="pipeline" at={40} icon={SquareKanban} />
  </Paper>
)

// ---------------------------------------------------------------------------
// 5. ShapeMorph : cercle -> étoile -> cœur -> étincelle -> logo
// ---------------------------------------------------------------------------

const ShapeMorphDemo = () => (
  <AbsoluteFill style={{ background: BRAND.night, alignItems: 'center', justifyContent: 'center' }}>
    <ShapeMorph shapes={['circle', 'star', 'heart', 'sparkle', 'bubble', 'logo']} at={[24, 60, 96, 132, 170]} size={560} spin={0} />
    <Caption dark>ShapeMorph · circle → star → heart → sparkle → bubble → logo</Caption>
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------
// 6. MorphBlob : goutte vivante qui change de forme
// ---------------------------------------------------------------------------

const MorphBlobDemo = () => (
  <Paper>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <MorphBlob size={600} shapes={['circle', 'squircle', 'star', 'heart', 'circle']} at={[40, 90, 140, 190]} amplitude={0.09} />
    </AbsoluteFill>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Img src={staticFile(ASSETS.wordmark)} style={{ width: 300, filter: 'brightness(0) invert(1)' }} />
    </AbsoluteFill>
    <Caption>MorphBlob · noise3D + jelly spring</Caption>
  </Paper>
)

// ---------------------------------------------------------------------------
// 7. IconMorph : grille de paires d'icônes
// ---------------------------------------------------------------------------

const ICON_PAIRS: Array<{ icons: IconInput[]; label: string; filled?: boolean }> = [
  { icons: ['play', 'pause', 'play'], label: 'play / pause', filled: true },
  { icons: ['menu', 'x', 'menu'], label: 'menu / close' },
  { icons: ['plus', 'check', 'plus'], label: 'add / done' },
  { icons: ['search', 'x', 'search'], label: 'search / clear' },
  { icons: ['mail', 'send', 'mail'], label: 'mail / send' },
  { icons: ['bell', 'circle-check', 'bell'], label: 'notify / read' },
  { icons: ['heart', 'star', 'heart'], label: 'like / star' },
  { icons: ['user', 'users', 'user'], label: 'user / team' },
]

const IconMorphDemo = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cell = 260
  const gap = 36
  const x0 = (1920 - (cell * 4 + gap * 3)) / 2
  const y0 = (1080 - (cell * 2 + gap)) / 2 - 20
  return (
    <Paper>
      {ICON_PAIRS.map((p, i) => {
        const enter = springPreset({ frame, fps, preset: 'snappy', delay: i * 3 })
        const start = 30 + i * 4
        return (
          <div
            key={p.label}
            style={{
              position: 'absolute',
              left: x0 + (i % 4) * (cell + gap),
              top: y0 + Math.floor(i / 4) * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: 40,
              background: '#fff',
              boxShadow: '0 1px 2px rgba(16,15,14,0.05), 0 20px 50px -24px rgba(16,15,14,0.25), inset 0 0 0 1px rgba(16,15,14,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              opacity: enter,
              transform: `scale(${0.8 + 0.2 * enter})`,
            }}
          >
            <IconMorph icons={p.icons} at={[start, start + 60]} size={110} color={BRAND.text} filled={p.filled} strokeWidth={1.8} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 19, color: BRAND.textMuted, letterSpacing: '0.02em' }}>{p.label}</div>
          </div>
        )
      })}
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// 8. LiquidButton : curseur, clic, remplissage gooey
// ---------------------------------------------------------------------------

const Cursor = ({ x, y, press }: { x: number; y: number; press: number }) => (
  <svg width={44} height={44} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - 0.18 * press})`, transformOrigin: '4px 3px', filter: 'drop-shadow(0 4px 8px rgba(16,15,14,0.3))' }}>
    <path d="M4 3l15 7.5-6.2 1.6L10 18.5z" fill={BRAND.text} stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
)

const LiquidButtonDemo = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const fillAt = 36
  const w = 600
  const h = 136
  const bx = (1920 - w) / 2
  const by = (1080 - h) / 2
  const move = springPreset({ frame, fps, preset: 'smooth', delay: 4, durationInFrames: 30 })
  const tx = bx + w * 0.22
  const ty = by + h * 0.55
  const press = springPreset({ frame, fps, preset: 'snappy', delay: fillAt - 4 }) - springPreset({ frame, fps, preset: 'snappy', delay: fillAt + 2 })
  const leave = springPreset({ frame, fps, preset: 'smooth', delay: fillAt + 24 })
  return (
    <Paper>
      <div style={{ position: 'absolute', left: bx, top: by }}>
        <LiquidButton width={w} height={h} fillAt={fillAt} drainAt={130} origin={0.22} label="Essayer Acme" />
      </div>
      <Cursor x={1400 + (tx - 1400) * move + leave * 140} y={900 + (ty - 900) * move + leave * 120} press={press} />
      <Caption>LiquidButton · gooey fill</Caption>
    </Paper>
  )
}

// ---------------------------------------------------------------------------

const common = { fps: FPS, width: 1920, height: 1080 }

export const Catalog = () => (
  <Folder name="Morph">
    <Composition id="Morph-PillToWindow" component={PillToWindow} durationInFrames={260} {...common} />
    <Composition id="Morph-MagicMove" component={MagicMoveDemo} durationInFrames={170} {...common} />
    <Composition id="Morph-SharedElement" component={SharedElementDemo} durationInFrames={130} {...common} />
    <Composition id="Morph-CardToWindow" component={CardToWindowDemo} durationInFrames={200} {...common} />
    <Composition id="Morph-ShapeMorph" component={ShapeMorphDemo} durationInFrames={220} {...common} />
    <Composition id="Morph-MorphBlob" component={MorphBlobDemo} durationInFrames={240} {...common} />
    <Composition id="Morph-IconMorph" component={IconMorphDemo} durationInFrames={160} {...common} />
    <Composition id="Morph-LiquidButton" component={LiquidButtonDemo} durationInFrames={170} {...common} />
  </Folder>
)
