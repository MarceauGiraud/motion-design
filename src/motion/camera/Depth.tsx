/**
 * Plans 3D : tilt "hero" du website, dolly zoom (vertigo), cartes en orbite.
 */
import type { CSSProperties, ReactNode } from 'react'
import { noise2D } from '@remotion/noise'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'

// ---------------------------------------------------------------------------
// Tilt3D
// ---------------------------------------------------------------------------

export interface Tilt3DProps {
  children: ReactNode
  /** Inclinaison de départ (rotateX, degrés). Défaut 11 (comme le hero du site). */
  from?: number
  /** Inclinaison finale. Défaut 0. */
  to?: number
  /** Frame de départ du redressement. Défaut 0. */
  delay?: number
  /** Preset. Défaut 'heavy'. */
  preset?: SpringPresetName
  /** Perspective CSS (px). Défaut 1400. */
  perspective?: number
  /** Décalage vertical de départ (px) qui remonte avec le ressort. Défaut 80. */
  lift?: number
  /** Échelle de départ. Défaut 0.92. */
  scaleFrom?: number
  /** Fondu d'entrée. Défaut true. */
  fade?: boolean
  /** Flottement résiduel après stabilisation (degrés). 0 = aucun. Défaut 0.6. */
  float?: number
  /** transform-origin. Défaut '50% 0%' (pivot sur le bord haut, comme le site). */
  origin?: string
  style?: CSSProperties
}

/** Le contenu arrive incliné vers l'arrière puis se redresse face caméra. */
export function Tilt3D({
  children,
  from = 11,
  to = 0,
  delay = 0,
  preset = 'heavy',
  perspective = 1400,
  lift = 80,
  scaleFrom = 0.92,
  fade = true,
  float = 0.6,
  origin = '50% 0%',
  style,
}: Tilt3DProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = springPreset({ frame, fps, preset, delay })
  const t = (frame - delay) / fps
  const bobX = float ? noise2D('tilt-x', t * 0.2, 0) * float : 0
  const bobY = float ? noise2D('tilt-y', 0, t * 0.2) * float : 0
  const rx = from + (to - from) * p + bobX * p
  const ry = bobY * p
  const opacity = fade ? interpolate(p, [0, 0.35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1
  return (
    <div style={{ perspective, perspectiveOrigin: '50% 20%', ...style }}>
      <div
        style={{
          transformOrigin: origin,
          transform: `translateY(${lift * (1 - p)}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scaleFrom + (1 - scaleFrom) * p})`,
          opacity,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DollyZoom
// ---------------------------------------------------------------------------

export interface DollyLayer {
  node: ReactNode
  /** Distance derrière le sujet (px). Plus c'est loin, plus l'effet est fort. */
  depth: number
}

export interface DollyZoomProps {
  /** Sujet, taille constante (plan z=0). */
  subject: ReactNode
  /** Arrière-plan plein cadre. */
  background?: ReactNode
  /** Profondeur de l'arrière-plan. Défaut 1400. */
  backgroundDepth?: number
  /** Plans intermédiaires optionnels (parallaxe d'échelle). */
  layers?: DollyLayer[]
  /** Perspective de départ (px, grand = téléobjectif). Défaut 5000. */
  from?: number
  /** Perspective finale (petit = grand angle, fond qui s'éloigne). Défaut 700. */
  to?: number
  delay?: number
  preset?: SpringPresetName
  /** Étire le ressort sur N frames. Défaut 75. */
  durationInFrames?: number
  /** Pré-agrandit l'arrière-plan pour qu'il couvre toujours le cadre. Défaut true. */
  fill?: boolean
  style?: CSSProperties
}

/**
 * Vertigo : le sujet garde sa taille pendant que la perspective change, donc
 * l'arrière-plan "respire" (se rétracte ou s'étire) derrière lui.
 * Physique réelle : un plan à profondeur d s'affiche à l'échelle P / (P + d).
 */
export function DollyZoom({
  subject,
  background,
  backgroundDepth = 1400,
  layers = [],
  from = 5000,
  to = 700,
  delay = 0,
  preset = 'heavy',
  durationInFrames = 75,
  fill = true,
  style,
}: DollyZoomProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = springPreset({ frame, fps, preset, delay, durationInFrames })
  // Interpolation en log : la perspective varie sur plusieurs ordres de grandeur.
  const P = Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * p)
  const pMin = Math.min(from, to)
  const layer = (node: ReactNode, depth: number, key: string | number) => {
    const comp = fill ? (pMin + depth) / pMin : 1
    return (
      <div key={key} style={{ position: 'absolute', inset: 0, transform: `translateZ(${-depth}px) scale(${comp})`, transformStyle: 'preserve-3d' }}>
        {node}
      </div>
    )
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', perspective: P, ...style }}>
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
        {background !== undefined && layer(background, backgroundDepth, 'bg')}
        {[...layers].sort((a, b) => b.depth - a.depth).map((l, i) => layer(l.node, l.depth, i))}
        <div style={{ position: 'absolute', inset: 0 }}>{subject}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OrbitCards
// ---------------------------------------------------------------------------

export interface OrbitCard {
  node: ReactNode
  /** Position du centre de la carte, relative au centre du cadre (px). */
  x: number
  y: number
  /** Profondeur (px, positif = vers la caméra). */
  z: number
  /** Inclinaisons propres de la carte (degrés). */
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  /** Retard d'entrée supplémentaire (frames). */
  delay?: number
}

export interface OrbitCardsProps {
  cards: OrbitCard[]
  /** Angle (rotateY) de la plateforme au départ et à la fin. Défaut -18 -> 14. */
  orbitFrom?: number
  orbitTo?: number
  /** Inclinaison fixe de la plateforme (rotateX). Défaut -6. */
  tilt?: number
  /** Durée du mouvement orbital (frames). Défaut : durée de la composition. */
  orbitDuration?: number
  /** Décalage entre les entrées de cartes (frames). Défaut 5. */
  stagger?: number
  /** Frame de départ des entrées. Défaut 0. */
  delay?: number
  /** Amplitude du flottement (px). Défaut 10. */
  bob?: number
  /** Profondeur de champ : flou des cartes lointaines. Défaut true. */
  depthOfField?: boolean
  perspective?: number
  /** Met en page chaque carte plus grande puis la réduit (texte net malgré la perspective). Défaut true. */
  supersample?: boolean
  style?: CSSProperties
}

/**
 * Calques d'UI en lévitation autour d'un pivot central. Chaque carte arrive de
 * loin (z) en ressort, flotte doucement, et la plateforme pivote lentement :
 * la parallaxe fait le reste.
 */
export function OrbitCards({
  cards,
  orbitFrom = -18,
  orbitTo = 14,
  tilt = -6,
  orbitDuration,
  stagger = 5,
  delay = 0,
  bob = 10,
  depthOfField = true,
  perspective = 1800,
  supersample = true,
  style,
}: OrbitCardsProps) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const orbitP = springPreset({ frame, fps, preset: 'gentle', delay, durationInFrames: orbitDuration ?? durationInFrames })
  const angle = orbitFrom + (orbitTo - orbitFrom) * orbitP
  const rad = (angle * Math.PI) / 180
  const t = frame / fps

  return (
    <div style={{ position: 'absolute', inset: 0, perspective, perspectiveOrigin: '50% 45%', ...style }}>
      {/* Pas de preserve-3d : chaque carte porte la rotation du plateau et son
          ordre de peinture vient de sa profondeur calculée (robuste avec filter). */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {cards.map((c, i) => {
          const d = delay + i * stagger + (c.delay ?? 0)
          const enter = springPreset({ frame, fps, preset: 'heavy', delay: d })
          const z = c.z - 1400 * (1 - enter)
          const by = bob ? noise2D(`orbit-${i}`, t * 0.25, i) * bob : 0
          const bx = bob ? noise2D(`orbit-x-${i}`, i, t * 0.2) * bob * 0.5 : 0
          // Profondeur après rotation de la plateforme -> flou et voile.
          const zView = -c.x * Math.sin(rad) + z * Math.cos(rad)
          const dof = depthOfField ? Math.min(4, Math.max(0, -zView / 180)) : 0
          const opacity = interpolate(enter, [0, 0.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          // Sur-échantillonnage : une carte rapprochée est agrandie par la
          // perspective ; on la met en page plus grande (zoom CSS) puis on la réduit.
          const k = supersample ? Math.min(3, Math.max(1.5, (perspective / Math.max(200, perspective - c.z)) * 1.4)) : 1
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
                zIndex: Math.round(5000 + zView),
                transform: `rotateX(${tilt}deg) rotateY(${angle}deg) translate3d(${c.x + bx}px, ${c.y + by}px, ${z}px) rotateX(${c.rotateX ?? 0}deg) rotateY(${c.rotateY ?? 0}deg) rotateZ(${c.rotateZ ?? 0}deg)`,
                filter: dof > 0.1 ? `blur(${dof.toFixed(2)}px)` : undefined,
                opacity,
              }}
            >
              {/* translate(-50%) s'applique à la boîte agrandie, puis scale(1/k) la ramène : carte centrée. */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: 'max-content', transformOrigin: '0 0', transform: `scale(${1 / k}) translate(-50%, -50%)` }}>
                {k === 1 ? c.node : <div style={{ zoom: k }}>{c.node}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
