/**
 * <CardToWindow> : une petite carte de fonctionnalité (icône + titre) qui
 * s'ouvre physiquement en fenêtre plateforme (le vrai CRM). Anticipation
 * (la carte s'enfonce), expansion au ressort `morph`, contenu FLIP : le
 * texte de la carte ne grossit pas, l'écran plateforme est dessiné à 1440 px
 * puis mis à l'échelle de la boîte courante (jamais déformé).
 */
import type { ComponentType, CSSProperties } from 'react'
import { Building2, Inbox, SquareKanban, UserRound, type LucideProps } from 'lucide-react'
import { Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { HERO_SHELL_TONE, PLATFORM_HEIGHT, PLATFORM_WIDTH, PlatformScreen, type PlatformSceneKey, type PlatformScreenProps } from '../../kit/Platform'
import { ContainerMorph } from './ContainerMorph'
import type { Rect } from './core'

const SCENE_ICON: Record<PlatformSceneKey, ComponentType<LucideProps>> = {
  companies: Building2,
  inbox: Inbox,
  contact: UserRound,
  pipeline: SquareKanban,
}

const SCENE_COPY: Record<PlatformSceneKey, { title: string; subtitle: string }> = {
  companies: { title: 'Entreprises', subtitle: 'Toutes vos fiches, enrichies par l’IA' },
  inbox: { title: 'Inbox unifiée', subtitle: 'Email, LinkedIn, WhatsApp au même endroit' },
  contact: { title: 'Fiche contact', subtitle: 'Chaque échange, chaque signal' },
  pipeline: { title: 'Pipeline', subtitle: 'Vos deals avancent tout seuls' },
}

export interface CardToWindowProps {
  /** Scène plateforme révélée. Défaut 'pipeline'. */
  scene?: PlatformSceneKey
  /** Props supplémentaires de l'écran (leo, search…). Frames relatives au début de l'expansion. */
  screen?: Omit<PlatformScreenProps, 'scene'>
  /** Frame de début de l'expansion. Défaut 36. */
  at?: number
  /** Titre de la carte. Défaut : selon la scène. */
  title?: string
  /** Sous-titre de la carte. */
  subtitle?: string
  /** Icône lucide de la carte. Défaut : selon la scène. */
  icon?: ComponentType<LucideProps>
  /** Rect de la carte (px vidéo). Défaut : 460 x 288 centré. */
  card?: Rect
  /** Rect final de la fenêtre. Défaut : ratio 1440/900, 80 % de la hauteur, centré. */
  window?: Rect
  /** Entrée de la carte (pop + flou) depuis la frame 0. Défaut true. */
  enter?: boolean
  /** Halo du dégradé de marque derrière la fenêtre. Défaut true. */
  halo?: boolean
  /** Preset de l'expansion. Défaut 'morph'. */
  preset?: SpringPresetName
  /** Frame de refermeture (retour carte). Optionnel. */
  closeAt?: number
  style?: CSSProperties
}

export interface FeatureCardProps {
  /** Icône lucide (tuile au dégradé de marque). */
  icon: ComponentType<LucideProps>
  title: string
  subtitle?: string
  width: number
  height: number
}

/** Face de la carte : tuile icône + titre + sous-titre, sans fond (le conteneur le porte). */
export function FeatureCard({ icon: Icon, title, subtitle, width, height }: FeatureCardProps) {
  const pad = Math.round(height * 0.14)
  const tile = Math.round(height * 0.26)
  return (
    <div style={{ width, height, padding: pad, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div
        style={{
          width: tile,
          height: tile,
          borderRadius: tile * 0.3,
          backgroundImage: BRAND_RAMP,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 24px -10px rgba(128,2,159,0.55)',
        }}
      >
        <Icon size={tile * 0.5} color="#FFFFFF" strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: height * 0.135, letterSpacing: '-0.02em', color: BRAND.text, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: height * 0.062, color: BRAND.textMuted, marginTop: height * 0.035, lineHeight: 1.3 }}>{subtitle ?? ""}</div>
      </div>
    </div>
  )
}

export function CardToWindow({
  scene = 'pipeline',
  screen,
  at = 36,
  title,
  subtitle,
  icon,
  card,
  window: win,
  enter = true,
  halo = true,
  preset = 'morph',
  closeAt,
  style,
}: CardToWindowProps) {
  const frame = useCurrentFrame()
  const { fps, width: W, height: H } = useVideoConfig()

  const cardRect: Rect = card ?? { x: (W - 460) / 2, y: (H - 288) / 2, width: 460, height: 288 }
  const winH = win?.height ?? Math.round(H * 0.8)
  const winW = win?.width ?? Math.round((winH * PLATFORM_WIDTH) / PLATFORM_HEIGHT)
  const winRect: Rect = win ?? { x: (W - winW) / 2, y: (H - winH) / 2, width: winW, height: winH }
  const scale = winRect.width / PLATFORM_WIDTH

  // Entrée : pop doux + flou qui se dissipe.
  const inP = enter ? springPreset({ frame, fps, preset: 'smooth' }) : 1
  const inPop = enter ? springPreset({ frame, fps, preset: 'snappy' }) : 1
  // Anticipation : la carte s'enfonce juste avant de s'ouvrir, puis relâche.
  const press = springPreset({ frame, fps, preset: 'snappy', delay: at - 7 }) - springPreset({ frame, fps, preset: 'snappy', delay: at })
  const s = (0.9 + 0.1 * inPop) * (1 - 0.045 * press)
  const origin = `${cardRect.x + cardRect.width / 2}px ${cardRect.y + cardRect.height / 2}px`

  const Icon = icon ?? SCENE_ICON[scene]
  const copy = SCENE_COPY[scene]

  const cardFace = <FeatureCard icon={Icon} title={title ?? copy.title} subtitle={subtitle ?? copy.subtitle} width={cardRect.width} height={cardRect.height} />
  const keyframes = [
    { at: 0, rect: cardRect, radius: 28, background: '#FFFFFF', borderColor: 'rgba(16,15,14,0.06)', elevation: 0.7, content: cardFace, contentFit: 'none' as const, contentAnchor: 'top-left' as const },
    {
      at,
      preset,
      rect: winRect,
      radius: 16,
      background: HERO_SHELL_TONE.wing,
      borderColor: 'rgba(16,15,14,0.04)',
      elevation: 1,
      contentSize: { width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
      contentFit: 'width' as const,
      contentAnchor: 'top' as const,
      content: (
        <Sequence from={at} layout="none">
          <PlatformScreen scene={scene} {...screen} />
        </Sequence>
      ),
    },
  ]
  if (closeAt !== undefined) keyframes.push({ ...keyframes[0], at: closeAt })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${(1 - inP) * 40}px) scale(${s})`,
        transformOrigin: origin,
        opacity: Math.min(1, inP * 1.4),
        filter: inP < 0.98 ? `blur(${((1 - inP) * 10).toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      <ContainerMorph
        keyframes={keyframes}
        contentBlur={10}
        backdrop={(st) =>
          halo ? (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: -5 * scale - 2,
                borderRadius: st.radius + 5,
                backgroundImage: BRAND_RAMP,
                filter: `blur(${12 * Math.max(scale, 0.6)}px)`,
                opacity: 0.38 * Math.min(1, Math.max(0, st.weights[1] ?? 0)),
              }}
            />
          ) : null
        }
      />
    </div>
  )
}
