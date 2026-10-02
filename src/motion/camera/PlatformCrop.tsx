/**
 * Fragments de la plateforme : une région de <PlatformScreen> rendue seule,
 * en carte flottante, et le plan "le fragment s'échappe de l'app".
 */
import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { PlatformScreen, PlatformWindow, type PlatformSceneKey, type PlatformScreenProps } from '../../kit/Platform'
import { BRAND } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { platformRectToStage, placementScale, type PlatformPlacement, type Rect } from './geometry'

// ---------------------------------------------------------------------------
// PlacedPlatform
// ---------------------------------------------------------------------------

export interface PlacedPlatformProps {
  /** Position/largeur de la fenêtre dans la scène. */
  placement: PlatformPlacement
  children: ReactNode
  /** Halo du dégradé de marque. Défaut true. */
  halo?: boolean
  style?: CSSProperties
}

/** <PlatformWindow> positionnée en absolu selon un PlatformPlacement (même repère que focus/curseur). */
export function PlacedPlatform({ placement, children, halo = true, style }: PlacedPlatformProps) {
  return (
    <div style={{ position: 'absolute', left: placement.x, top: placement.y, ...style }}>
      <PlatformWindow width={placement.width} halo={halo}>
        {children}
      </PlatformWindow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlatformCrop
// ---------------------------------------------------------------------------

export interface PlatformCropProps {
  /** Région à découper, en coordonnées plateforme 1440x900. */
  rect: Rect
  /** Scène rendue (si pas de children). Défaut 'companies'. */
  scene?: PlatformSceneKey
  /** Props passées au PlatformScreen généré. Défaut mode 'static'. */
  screen?: Partial<Omit<PlatformScreenProps, 'scene'>>
  /** PlatformScreen personnalisé (remplace scene/screen). */
  children?: ReactNode
  /** Échelle px vidéo par px plateforme. Défaut 1.5. */
  scale?: number
  /** Rayon des coins (px vidéo). Défaut 16. */
  radius?: number
  /** Intensité de l'ombre portée 0..1+. Défaut 1. */
  elevation?: number
  /** Liseré intérieur. Défaut true. */
  border?: boolean
  style?: CSSProperties
}

/** Ombre "carte flottante" dont la profondeur suit l'élévation. */
export function floatingShadow(elevation: number): string {
  const e = Math.max(0, elevation)
  return [
    `0 ${1 + e}px ${2 + e * 2}px rgba(16,15,14,${0.06 + 0.04 * e})`,
    `0 ${12 * e}px ${40 * e}px -${8 * e}px rgba(16,15,14,${0.18 * Math.min(e, 1.6)})`,
    `0 ${40 * e}px ${90 * e}px -${30 * e}px rgba(40,10,80,${0.22 * Math.min(e, 1.6)})`,
  ].join(', ')
}

/** Rend uniquement `rect` d'un PlatformScreen, en carte arrondie avec ombre. */
export function PlatformCrop({ rect, scene = 'companies', screen, children, scale = 1.5, radius = 16, elevation = 1, border = true, style }: PlatformCropProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: rect.w * scale,
        height: rect.h * scale,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: BRAND.wing,
        boxShadow: floatingShadow(elevation),
        ...style,
      }}
    >
      {/* zoom CSS (et non transform) : le contenu est mis en page à l'échelle, donc net même sous rotation 3D. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: rect.w, height: rect.h, zoom: scale, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: -rect.x, top: -rect.y }}>
          {children ?? <PlatformScreen scene={scene} mode="static" {...screen} />}
        </div>
      </div>
      {border && <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 1px rgba(16,15,14,0.08)`, pointerEvents: 'none' }} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CropFlyOut
// ---------------------------------------------------------------------------

export interface CropFlyOutTarget {
  /** Centre d'arrivée en coordonnées scène. */
  x: number
  y: number
  /** Échelle finale relative à la taille d'origine dans la fenêtre. Défaut 1.6. */
  scale?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
}

export interface CropFlyOutProps {
  /** Placement de la fenêtre plateforme d'où sort le fragment. */
  placement: PlatformPlacement
  /** Région (coords plateforme). */
  rect: Rect
  /** Frame de décollage. */
  at: number
  /** Pose d'arrivée. */
  to: CropFlyOutTarget
  /** Frame de retour (le fragment revient se loger). Absent = reste. */
  returnAt?: number
  scene?: PlatformSceneKey
  screen?: Partial<Omit<PlatformScreenProps, 'scene'>>
  children?: ReactNode
  /** Preset du vol. Défaut 'heavy'. */
  preset?: SpringPresetName
  /** Laisse un "trou" en creux à l'emplacement d'origine. Défaut true. */
  hole?: boolean
  radius?: number
  /** Flou de mouvement max (px). Défaut 2.5. */
  motionBlur?: number
}

/**
 * Le fragment décolle de la fenêtre : anticipation (léger enfoncement),
 * vol en ressort vers `to`, ombre qui s'approfondit, flou de vitesse.
 * À placer dans la même scène (même repère) que la <PlacedPlatform>.
 */
export function CropFlyOut({
  placement,
  rect,
  at,
  to,
  returnAt,
  scene = 'companies',
  screen,
  children,
  preset = 'heavy',
  hole = true,
  radius = 10,
  motionBlur = 2.5,
}: CropFlyOutProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s0 = placementScale(placement)
  const origin = platformRectToStage(rect, placement)

  const progressAt = (f: number) => {
    const go = springPreset({ frame: f, fps, preset, delay: at })
    const back = returnAt === undefined ? 0 : springPreset({ frame: f, fps, preset: 'morph', delay: returnAt })
    return go - back
  }
  const p = progressAt(frame)
  const pPrev = progressAt(frame - 1)

  // Anticipation : petit enfoncement juste avant le décollage.
  const dip =
    springPreset({ frame, fps, preset: 'snappy', delay: at - 7 }) - springPreset({ frame, fps, preset: 'snappy', delay: at - 1 })
  const cx0 = origin.x + origin.w / 2
  const cy0 = origin.y + origin.h / 2
  const cx = cx0 + (to.x - cx0) * p
  const cy = cy0 + (to.y - cy0) * p
  const target = to.scale ?? 1.6
  // Mise en page à la taille finale (max), le transform ne fait que réduire : net en 3D.
  const layout = Math.max(1, target)
  const scale = (1 + (target - 1) * p) * (1 - 0.03 * dip)
  const velocity = Math.abs(p - pPrev) * Math.hypot(to.x - cx0, to.y - cy0)
  const blur = Math.min(motionBlur, Math.max(0, (velocity - 12) * 0.05))
  const lifted = Math.max(0, Math.min(1, p))

  return (
    <>
      {hole && (
        <div
          style={{
            position: 'absolute',
            left: origin.x,
            top: origin.y,
            width: origin.w,
            height: origin.h,
            borderRadius: radius * s0,
            background: BRAND.paper,
            boxShadow: 'inset 0 2px 6px rgba(16,15,14,0.10)',
            opacity: lifted,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) perspective(1600px) rotateX(${(to.rotateX ?? 0) * p}deg) rotateY(${(to.rotateY ?? 0) * p}deg) rotateZ(${(to.rotateZ ?? 0) * p}deg) scale(${scale / layout})`,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        <PlatformCrop rect={rect} scale={s0 * layout} scene={scene} screen={screen} radius={radius * s0 * layout} elevation={lifted * 1.4 * layout} border={lifted > 0.02}>
          {children}
        </PlatformCrop>
      </div>
    </>
  )
}
