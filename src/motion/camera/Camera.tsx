/**
 * Caméra virtuelle : cadre n'importe quel contenu (la "scène", de la taille de
 * la composition) avec des keyframes reliées par des ressorts.
 *
 * Chaque keyframe k déclenche, à sa frame `at`, un ressort 0->1 qui fait
 * glisser la pose de k-1 vers k. Les contributions s'additionnent, donc des
 * keyframes rapprochées s'enchaînent sans cassure de vitesse.
 */
import type { CSSProperties, ReactNode } from 'react'
import { noise2D } from '@remotion/noise'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { centeredPlacement, platformRectToStage, type PlatformPlacement, type Point, type Rect } from './geometry'
import type { SpringConfig } from 'remotion'
import { handheldAt, handheldCatchAt, HANDHELD_PRESETS, normalizeHandheld, type HandheldIntensity, type HandheldOptions } from './Handheld'

/** Pose de caméra. x/y = point de la scène placé au centre de l'écran. */
export interface CameraPose {
  x: number
  y: number
  /** 1 = cadrage d'origine. */
  zoom: number
  rotateX: number
  rotateY: number
  rotateZ: number
}

/** Cible de cadrage : la caméra calcule zoom + centre pour cadrer `rect`. */
export interface FocusTarget {
  rect: Rect
  /** Marge écran (px) autour du rectangle cadré. Défaut 80. */
  padding?: number
  /** 'platform' (défaut) = rect en coordonnées 1440x900 ; 'stage' = coordonnées scène. */
  space?: 'platform' | 'stage'
  /** Zoom maximal autorisé. Défaut 4. */
  maxZoom?: number
}

export interface CameraKeyframe extends Partial<CameraPose> {
  /** Frame où le ressort vers cette pose démarre. */
  at: number
  /** Remplace x/y/zoom par le cadrage de ce rectangle. */
  focus?: FocusTarget
  /** Preset du ressort qui mène à cette keyframe (défaut: celui de <Camera>). */
  preset?: SpringPresetName
  /** Ajustement léger du preset. */
  config?: Partial<SpringConfig>
  /** Force la durée du ressort (frames). */
  durationInFrames?: number
}

export interface DriftOptions {
  /** Amplitude de translation en px écran. Défaut 6. */
  amplitude?: number
  /** Amplitude de roulis en degrés. Défaut 0 (une rotation, même infime, rend Chrome flou : opt-in). */
  rotation?: number
  /** Vitesse (cycles de bruit / seconde). Défaut 0.18. */
  speed?: number
  /** Graine du bruit. */
  seed?: string
}

export interface CameraProps {
  children: ReactNode
  /** Poses successives. La première est la pose initiale (sans ressort). */
  keyframes?: CameraKeyframe[]
  /** Raccourci : cadre `rect`. Sans `at`, cadrage immédiat ; avec `at`, ressort depuis le plan large. */
  focus?: FocusTarget & { at?: number }
  /** Placement de la PlatformWindow dans la scène (pour focus en coords plateforme). Défaut : centrée, 1600 px. */
  platform?: PlatformPlacement
  /** Preset par défaut des transitions. Défaut 'heavy'. */
  preset?: SpringPresetName
  /** Caméra à l'épaule (bruit lent). `true` = réglages par défaut. */
  drift?: boolean | DriftOptions
  /**
   * Caméra à l'épaule humanisée (voir Handheld.tsx) : dérive multi-octave qui
   * gonfle avec la vitesse, rattrapage amorti après chaque keyframe, impacts.
   * `true` = 'natural'. Défaut : désactivé. Se cumule avec `drift`.
   */
  handheld?: boolean | HandheldIntensity | HandheldOptions
  /** Flou de mouvement lié à la vitesse. `true` = 2 px max, nombre = max px. Défaut true. */
  motionBlur?: boolean | number
  /** Perspective CSS pour les rotations X/Y. Défaut 2000. */
  perspective?: number
  /** Taille de la scène. Défaut : taille de la composition. */
  width?: number
  height?: number
  /**
   * Sur-échantillonnage par `zoom` CSS (texte net en plan 3D zoomé).
   * Défaut : automatique si une keyframe pivote en X/Y et zoome > 1.05.
   */
  supersample?: boolean
  /** Fond derrière la scène (visible quand on dézoome ou pivote). */
  background?: string
  style?: CSSProperties
}

const IDENTITY = (w: number, h: number): CameraPose => ({ x: w / 2, y: h / 2, zoom: 1, rotateX: 0, rotateY: 0, rotateZ: 0 })

/** Calcule la pose qui cadre un rectangle (coordonnées scène) dans un écran WxH. */
export function focusPose(rect: Rect, viewW: number, viewH: number, padding = 80, maxZoom = 4): Pick<CameraPose, 'x' | 'y' | 'zoom'> {
  const zoom = Math.min(maxZoom, Math.min((viewW - padding * 2) / rect.w, (viewH - padding * 2) / rect.h))
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, zoom: Math.max(0.05, zoom) }
}

interface ResolveContext {
  width: number
  height: number
  platform: PlatformPlacement
}

/** Transforme les keyframes partielles en poses complètes (héritage de la précédente). */
export function resolveKeyframes(keyframes: CameraKeyframe[], ctx: ResolveContext): Array<CameraKeyframe & { pose: CameraPose }> {
  const sorted = [...keyframes].sort((a, b) => a.at - b.at)
  let prev = IDENTITY(ctx.width, ctx.height)
  return sorted.map((k) => {
    const pose: CameraPose = { ...prev }
    if (k.focus) {
      const r = k.focus.space === 'stage' ? k.focus.rect : platformRectToStage(k.focus.rect, ctx.platform)
      Object.assign(pose, focusPose(r, ctx.width, ctx.height, k.focus.padding, k.focus.maxZoom))
    }
    for (const key of ['x', 'y', 'zoom', 'rotateX', 'rotateY', 'rotateZ'] as const) {
      const v = k[key]
      if (v !== undefined && !(k.focus && (key === 'x' || key === 'y' || key === 'zoom'))) pose[key] = v
    }
    prev = pose
    return { ...k, pose }
  })
}

/** Pose de la caméra à une frame donnée. Zoom interpolé en log (vitesse perçue constante). */
export function poseAt(
  frame: number,
  fps: number,
  resolved: Array<CameraKeyframe & { pose: CameraPose }>,
  defaultPreset: SpringPresetName,
  fallback: CameraPose,
): CameraPose {
  if (resolved.length === 0) return fallback
  const first = resolved[0].pose
  const out: CameraPose = { ...first, zoom: Math.log(first.zoom) }
  for (let i = 1; i < resolved.length; i++) {
    const k = resolved[i]
    const a = resolved[i - 1].pose
    const b = k.pose
    const p = springPreset({ frame, fps, delay: k.at, preset: k.preset ?? defaultPreset, config: k.config, durationInFrames: k.durationInFrames })
    out.x += (b.x - a.x) * p
    out.y += (b.y - a.y) * p
    out.zoom += (Math.log(b.zoom) - Math.log(a.zoom)) * p
    out.rotateX += (b.rotateX - a.rotateX) * p
    out.rotateY += (b.rotateY - a.rotateY) * p
    out.rotateZ += (b.rotateZ - a.rotateZ) * p
  }
  out.zoom = Math.exp(out.zoom)
  return out
}

/** Options du hook de pose. */
export interface UseCameraOptions {
  keyframes?: CameraKeyframe[]
  focus?: FocusTarget & { at?: number }
  platform?: PlatformPlacement
  preset?: SpringPresetName
  width?: number
  height?: number
}

/** Construit la liste de keyframes effective (keyframes + raccourci focus). */
function buildKeyframes(opts: UseCameraOptions): CameraKeyframe[] {
  const list = [...(opts.keyframes ?? [])]
  if (opts.focus) {
    const { at, ...target } = opts.focus
    if (at === undefined) list.push({ at: list.length ? Math.max(...list.map((k) => k.at)) : 0, focus: target })
    else {
      if (list.length === 0) list.push({ at: -1 })
      list.push({ at, focus: target })
    }
  }
  return list
}

/** Hook : pose courante et pose de la frame précédente (pour la vitesse). */
export function useCameraPose(opts: UseCameraOptions): {
  pose: CameraPose
  prev: CameraPose
  width: number
  height: number
  /** Zoom maximal atteint par les keyframes. */
  maxZoom: number
  /** Au moins une keyframe pivote en X/Y. */
  has3D: boolean
  /** Keyframes résolues (poses complètes). */
  resolved: Array<CameraKeyframe & { pose: CameraPose }>
  /** Preset par défaut effectif. */
  preset: SpringPresetName
} {
  const frame = useCurrentFrame()
  const { fps, width: cw, height: ch } = useVideoConfig()
  const width = opts.width ?? cw
  const height = opts.height ?? ch
  const platform = opts.platform ?? centeredPlacement(1600, width, height)
  const resolved = resolveKeyframes(buildKeyframes(opts), { width, height, platform })
  const fallback = IDENTITY(width, height)
  const preset = opts.preset ?? 'heavy'
  return {
    pose: poseAt(frame, fps, resolved, preset, fallback),
    prev: poseAt(frame - 1, fps, resolved, preset, fallback),
    width,
    height,
    maxZoom: Math.max(1, ...resolved.map((k) => k.pose.zoom)),
    has3D: resolved.some((k) => Math.abs(k.pose.rotateX) > 0.01 || Math.abs(k.pose.rotateY) > 0.01),
    resolved,
    preset,
  }
}

/** Projette un point de la scène vers l'écran (rotations ignorées). Utile pour poser un overlay hors caméra. */
export function stageToScreen(point: Point, pose: CameraPose, width: number, height: number): Point {
  return { x: width / 2 + (point.x - pose.x) * pose.zoom, y: height / 2 + (point.y - pose.y) * pose.zoom }
}

/** Idem pour un rectangle. */
export function stageRectToScreen(rect: Rect, pose: CameraPose, width: number, height: number): Rect {
  const p = stageToScreen(rect, pose, width, height)
  return { x: p.x, y: p.y, w: rect.w * pose.zoom, h: rect.h * pose.zoom }
}

/** CSS transform d'une pose (origine 0 0 sur la scène). */
export function poseTransform(pose: CameraPose, width: number, height: number, dx = 0, dy = 0, dRot = 0): string {
  // Les termes 3D ne sont émis que s'ils comptent : une couche 3D est
  // rastérisée à l'échelle 1 puis agrandie par Chrome (texte flou en zoom).
  const parts = [`translate(${width / 2 + dx}px, ${height / 2 + dy}px)`]
  if (Math.abs(pose.rotateX) > 0.01) parts.push(`rotateX(${pose.rotateX}deg)`)
  if (Math.abs(pose.rotateY) > 0.01) parts.push(`rotateY(${pose.rotateY}deg)`)
  const rz = pose.rotateZ + dRot
  if (Math.abs(rz) > 0.001) parts.push(`rotate(${rz}deg)`)
  parts.push(`scale(${pose.zoom})`, `translate(${-pose.x}px, ${-pose.y}px)`)
  return parts.join(' ')
}

/**
 * <Camera> : enveloppe un contenu de la taille de la scène et le filme.
 *
 *   <Camera keyframes={[{ at: 0 }, { at: 30, focus: { rect: PLATFORM_REGIONS.companies.createButton } }]}>
 *     <PlacedPlatform placement={p}><PlatformScreen scene="companies" /></PlacedPlatform>
 *   </Camera>
 */
export function Camera({
  children,
  keyframes,
  focus,
  platform,
  preset = 'heavy',
  drift = false,
  handheld,
  motionBlur = true,
  perspective = 2000,
  width: w,
  height: h,
  supersample,
  background,
  style,
}: CameraProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { pose: basePose, prev, width, height, maxZoom, has3D, resolved, preset: effPreset } = useCameraPose({ keyframes, focus, platform, preset, width: w, height: h })
  // Plan 3D zoomé : Chrome rastérise les couches sous rotation 3D sans tenir
  // compte du zoom (texte flou). On sur-échantillonne par la mise en page :
  // `zoom` CSS constant (= zoom max du plan), puis le transform ne fait que réduire.
  // Vitesse écran (pan + zoom + rotation), px/frame : flou et épaule.
  const pan = Math.hypot(basePose.x - prev.x, basePose.y - prev.y) * basePose.zoom
  const zoomSpeed = Math.abs(Math.log(basePose.zoom / prev.zoom)) * Math.hypot(width, height) * 0.5
  const rotSpeed = (Math.abs(basePose.rotateX - prev.rotateX) + Math.abs(basePose.rotateY - prev.rotateY) + Math.abs(basePose.rotateZ - prev.rotateZ)) * 12
  const speed = pan + zoomSpeed + rotSpeed

  // Épaule humanisée : décalage écran + roulis + respiration de zoom.
  const hh = normalizeHandheld(handheld)
  let hx = 0
  let hy = 0
  let hRot = 0
  let pose = basePose
  if (hh) {
    const r = HANDHELD_PRESETS[hh.intensity ?? 'natural']
    const catchOffset = handheldCatchAt(frame, fps, resolved, effPreset, basePose.zoom, hh.catch ?? r.catch, r.catchMaxPx, r.catchMaxZoom)
    const o = handheldAt(frame, fps, hh, speed, catchOffset)
    hx = o.x
    hy = o.y
    hRot = o.rotate
    pose = { ...basePose, zoom: basePose.zoom * o.zoom }
  }

  const ss = supersample ?? (has3D && maxZoom > 1.05)
  const base = ss ? Math.min(3, maxZoom) : 1

  // Bruit "à l'épaule" : translation et roulis lents, en px écran.
  let dx = 0
  let dy = 0
  let dRot = 0
  if (drift) {
    const d: DriftOptions = drift === true ? {} : drift
    const amp = d.amplitude ?? 6
    const t = (frame / fps) * (d.speed ?? 0.18)
    const seed = d.seed ?? 'camera-drift'
    dx = noise2D(`${seed}-x`, t, 0) * amp
    dy = noise2D(`${seed}-y`, 0, t) * amp
    dRot = d.rotation ? noise2D(`${seed}-r`, t, t) * d.rotation : 0
  }
  dx += hx
  dy += hy
  dRot += hRot

  // Flou de mouvement : vitesse écran (pan + zoom + rotation).
  let blur = 0
  if (motionBlur) {
    const max = motionBlur === true ? 2 : motionBlur
    blur = Math.min(max, Math.max(0, (speed - 10) * 0.045))
  }

  // Deux couches : la rotation (3D) enveloppe le zoom (2D). Ainsi le contenu
  // zoomé est peint à pleine résolution dans la couche 3D (texte net).
  const is3D = Math.abs(pose.rotateX) > 0.01 || Math.abs(pose.rotateY) > 0.01
  const rz = pose.rotateZ + dRot
  const rot: string[] = [`translate(${dx}px, ${dy}px)`]
  if (Math.abs(pose.rotateX) > 0.01) rot.push(`rotateX(${pose.rotateX}deg)`)
  if (Math.abs(pose.rotateY) > 0.01) rot.push(`rotateY(${pose.rotateY}deg)`)
  if (Math.abs(rz) > 0.001) rot.push(`rotate(${rz}deg)`)
  // Plan 2D : tout (translation, roulis, zoom) tient dans UNE matrice sur la
  // couche zoomée. Une rotation portée par une couche parente séparée fait
  // rastériser le contenu à l'échelle 1 par Chrome (texte flou) ; fusionnée
  // ici, le texte reste net même sous roulis. Rendu identique sinon.
  const flat = !is3D
  const zoomLayer = `scale(${pose.zoom / base}) translate(${-pose.x * base}px, ${-pose.y * base}px)`
  const inner = flat
    ? `translate(${width / 2 + dx}px, ${height / 2 + dy}px)${Math.abs(rz) > 0.001 ? ` rotate(${rz}deg)` : ''} ${zoomLayer}`
    : `translate(${width / 2}px, ${height / 2}px) ${zoomLayer}`
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', perspective: is3D ? perspective : undefined, background, ...style }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: '50% 50%',
          transform: flat ? undefined : rot.join(' '),
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * base,
            height: height * base,
            transformOrigin: '0 0',
            transform: inner,
          }}
        >
          {base === 1 ? children : <div style={{ position: 'absolute', left: 0, top: 0, width, height, zoom: base }}>{children}</div>}
        </div>
      </div>
    </div>
  )
}
