/**
 * <Parallax> + <ParallaxLayer> : couches de profondeur pilotées par une caméra à ressort.
 *
 *   <Parallax camera={{ from: { x: -120 }, to: { x: 120, zoom: 1.08 }, preset: 'heavy' }} focus={1} dof={6}>
 *     <ParallaxLayer depth={0.2}>fond</ParallaxLayer>
 *     <ParallaxLayer depth={1}>sujet</ParallaxLayer>
 *     <ParallaxLayer depth={1.6}>premier plan</ParallaxLayer>
 *   </Parallax>
 *
 * depth 0 = infini (immobile), 1 = plan du sujet (suit la caméra 1:1), >1 = devant.
 * Chaque couche : translate = -camera · depth, scale = 1 + (zoom - 1) · depth.
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import type { SpringConfig } from 'remotion'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { joinFilters, motionBlurFilter } from '../physics/deform'
import { loopNoise } from '../physics/loop'
import { springPreset, type SpringPresetName } from '../physics/springs'

export interface CameraPose {
  /** Déplacement caméra horizontal (px, au plan depth=1). */
  x?: number
  y?: number
  /** Zoom au plan depth=1 (1 = neutre). */
  zoom?: number
}

export interface ParallaxCamera {
  from?: CameraPose
  to?: CameraPose
  delay?: number
  preset?: SpringPresetName
  config?: Partial<SpringConfig>
  durationInFrames?: number
}

interface ParallaxCtx {
  x: number
  y: number
  zoom: number
  vx: number
  vy: number
  focus: number
  dof: number
  motionBlur: number
}

const Ctx = createContext<ParallaxCtx>({ x: 0, y: 0, zoom: 1, vx: 0, vy: 0, focus: 1, dof: 0, motionBlur: 0 })

export interface ParallaxProps {
  children?: ReactNode
  /** Mouvement de caméra à ressort. */
  camera?: ParallaxCamera
  /** Dérive linéaire continue (px/frame) ajoutée à la caméra. */
  drift?: { x?: number; y?: number }
  /** Tremblé organique bouclé de caméra à l'épaule (px). 0 = aucun. */
  handheld?: number
  /** Profondeur nette. Défaut 1. */
  focus?: number
  /** Flou (px) par unité de distance au plan net. 0 = tout net. */
  dof?: number
  /** Flou de mouvement des couches (facteur, 0 = off). */
  motionBlur?: number | boolean
  style?: CSSProperties
  className?: string
}

function cameraAt(frame: number, fps: number, camera: ParallaxCamera | undefined, drift: ParallaxProps['drift'], handheld: number) {
  const from = { x: 0, y: 0, zoom: 1, ...camera?.from }
  const to = { ...from, ...camera?.to }
  const p = camera
    ? frame < (camera.delay ?? 0)
      ? 0
      : springPreset({ frame, fps, delay: camera.delay ?? 0, preset: camera.preset ?? 'heavy', config: camera.config, durationInFrames: camera.durationInFrames })
    : 0
  const hx = handheld ? loopNoise(frame, { period: 240, amplitude: handheld, seed: 'cam-x' }) : 0
  const hy = handheld ? loopNoise(frame, { period: 240, amplitude: handheld * 0.7, seed: 'cam-y' }) : 0
  return {
    x: from.x + (to.x - from.x) * p + (drift?.x ?? 0) * frame + hx,
    y: from.y + (to.y - from.y) * p + (drift?.y ?? 0) * frame + hy,
    zoom: from.zoom + (to.zoom - from.zoom) * p,
  }
}

export function Parallax({ children, camera, drift, handheld = 0, focus = 1, dof = 0, motionBlur = false, style, className }: ParallaxProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const c = cameraAt(frame, fps, camera, drift, handheld)
  const p = cameraAt(frame - 1, fps, camera, drift, handheld)
  const value: ParallaxCtx = {
    ...c,
    vx: c.x - p.x,
    vy: c.y - p.y,
    focus,
    dof,
    motionBlur: motionBlur === true ? 1 : motionBlur || 0,
  }
  return (
    <AbsoluteFill className={className} style={{ overflow: 'hidden', ...style }}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </AbsoluteFill>
  )
}

export interface ParallaxLayerProps {
  children?: ReactNode
  /** 0 = infini, 1 = plan du sujet, >1 = premier plan. */
  depth?: number
  /** Couche en plein cadre (AbsoluteFill). Défaut true. */
  fill?: boolean
  style?: CSSProperties
  className?: string
}

export function ParallaxLayer({ children, depth = 1, fill = true, style, className }: ParallaxLayerProps) {
  const cam = useContext(Ctx)
  const scale = 1 + (cam.zoom - 1) * depth
  const dofBlur = cam.dof * Math.abs(depth - cam.focus)
  const mb = cam.motionBlur > 0 ? motionBlurFilter(Math.hypot(cam.vx, cam.vy) * depth * cam.motionBlur) : undefined
  const layerStyle: CSSProperties = {
    transform: `translate(${-cam.x * depth}px, ${-cam.y * depth}px) scale(${scale})`,
    filter: joinFilters(dofBlur > 0.05 ? `blur(${dofBlur.toFixed(2)}px)` : undefined, mb, style?.filter as string | undefined),
  }
  if (fill) {
    return (
      <AbsoluteFill className={className} style={{ ...style, ...layerStyle }}>
        {children}
      </AbsoluteFill>
    )
  }
  return (
    <div className={className} style={{ ...style, ...layerStyle }}>
      {children}
    </div>
  )
}

/** Lecture de la caméra courante (pour un effet custom dans une couche). */
export function useParallaxCamera(): Readonly<ParallaxCtx> {
  return useContext(Ctx)
}
