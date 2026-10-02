/**
 * Voix off ElevenLabs.
 *
 * Pipeline :
 *   1. voiceover/<video>.json         le texte, la voix, les réglages
 *   2. npm run voiceover -- voiceover/<video>.json
 *   3. public/voiceover/<video>/index.json + un mp3 par réplique (timestamps au mot)
 *   4. ici : buildVoiceTimeline() place les répliques sur la timeline, et les
 *      scènes se calent sur `timeline.at(id)`, pas l'inverse. C'est la voix qui
 *      donne le tempo du montage.
 *
 *   import index from '../../../public/voiceover/demo/index.json'
 *   const vo = buildVoiceTimeline(index, { fps: 30, startAt: 15, gap: 12 })
 *   <VoiceOverTrack timeline={vo} />
 *   <Captions timeline={vo} />
 *   <MusicBed id="elevenlabs/ambience/studio-bed" duckUnder={vo} />
 */
import { Audio, interpolate, Loop, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { CSSProperties } from 'react'

import { springPreset } from '../physics/springs'
import { BRAND, FONT_DISPLAY } from '../tokens'
import { sfxDuration, sfxSrc, type SfxId } from './sfx'

export interface VoiceWord {
  text: string
  start: number
  end: number
}

export interface VoiceLine {
  id: string
  text: string
  file: string
  duration: number
  words: VoiceWord[]
}

export interface PlacedVoiceLine extends VoiceLine {
  /** Frame de début sur la timeline de la composition. */
  from: number
  durationInFrames: number
}

export interface VoiceTimeline {
  lines: PlacedVoiceLine[]
  fps: number
  /** Frame de fin de la dernière réplique. */
  end: number
  /** Frame de début d'une réplique (pour caler une scène dessus). */
  at: (id: string) => number
  /** Durée en frames d'une réplique. */
  length: (id: string) => number
}

export interface VoiceTimelineOptions {
  fps: number
  /** Frame de la première réplique. */
  startAt?: number
  /** Silence entre deux répliques, en frames. */
  gap?: number
  /** Départs imposés par réplique (frames absolues), ex. { cta: 600 }. */
  pin?: Record<string, number>
}

export function buildVoiceTimeline(index: VoiceLine[], { fps, startAt = 0, gap = 10, pin = {} }: VoiceTimelineOptions): VoiceTimeline {
  let cursor = startAt
  const lines = index.map((line) => {
    const from = pin[line.id] ?? cursor
    const durationInFrames = Math.ceil(line.duration * fps) + 2
    cursor = from + durationInFrames + gap
    return { ...line, from, durationInFrames }
  })
  const find = (id: string) => {
    const line = lines.find((l) => l.id === id)
    if (!line) throw new Error(`Réplique inconnue : ${id}`)
    return line
  }
  return {
    lines,
    fps,
    end: lines.length ? lines[lines.length - 1].from + lines[lines.length - 1].durationInFrames : startAt,
    at: (id) => find(id).from,
    length: (id) => find(id).durationInFrames,
  }
}

/** Charge un index au runtime (pour calculateMetadata). */
export async function loadVoiceIndex(video: string): Promise<VoiceLine[]> {
  const res = await fetch(staticFile(`voiceover/${video}/index.json`))
  if (!res.ok) throw new Error(`Voix off introuvable : lancer npm run voiceover -- voiceover/${video}.json`)
  return res.json()
}

export function VoiceOverTrack({ timeline, volume = 1 }: { timeline: VoiceTimeline; volume?: number }) {
  return (
    <>
      {timeline.lines.map((line) => (
        <Sequence key={line.id} from={line.from} durationInFrames={line.durationInFrames} layout="none" name={`vo:${line.id}`}>
          <Audio src={staticFile(line.file)} volume={volume} />
        </Sequence>
      ))}
    </>
  )
}

/**
 * Volume de musique abaissé pendant la voix, avec rampes douces.
 * `bridge` (frames) : un silence entre deux répliques plus court que ça reste
 * ducké, pour éviter que la musique « respire » entre les phrases.
 */
export function duckedVolume(frame: number, timeline: VoiceTimeline | undefined, base: number, ducked: number, ramp = 8, bridge = 0): number {
  if (!timeline) return base
  // Fusionne les répliques séparées de moins de `bridge` frames.
  const spans: [number, number][] = []
  for (const line of [...timeline.lines].sort((a, b) => a.from - b.from)) {
    const a = line.from
    const b = line.from + line.durationInFrames
    const last = spans[spans.length - 1]
    if (last && a - last[1] < bridge) last[1] = Math.max(last[1], b)
    else spans.push([a, b])
  }
  let v = base
  for (const [a, b] of spans) {
    const inside = interpolate(frame, [a - ramp, a, b, b + ramp], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    // Rampe en S (sinus) : pas d'angle audible au début/fin du ducking.
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * inside)
    v = Math.min(v, base - (base - ducked) * eased)
  }
  return v
}

export interface MusicBedProps {
  /** Un son du registre (ambiance générée) ou un chemin dans public/. */
  id?: SfxId
  src?: string
  volume?: number
  /** Volume pendant la voix. */
  duckedTo?: number
  duckUnder?: VoiceTimeline
  fadeIn?: number
  fadeOut?: number
  /** Durée des rampes de ducking, en frames (défaut 8). */
  duckRamp?: number
  /** Silences entre répliques plus courts que ça (frames) : on reste ducké. Défaut 0. */
  duckBridge?: number
  /** false : la piste n'est pas bouclée (piste continue taillée à la durée du film). */
  loop?: boolean
}

export function MusicBed({ id, src, volume = 0.35, duckedTo = 0.12, duckUnder, fadeIn = 20, fadeOut = 30, duckRamp = 8, duckBridge = 0, loop = true }: MusicBedProps) {
  const { durationInFrames, fps } = useVideoConfig()
  const url = id ? sfxSrc(id) : staticFile(src ?? '')
  const loopFrames = id ? Math.floor(sfxDuration(id) * fps) : durationInFrames
  const envelope = (f: number) =>
    interpolate(f, [0, fadeIn, durationInFrames - fadeOut, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const vol = (abs: number) => envelope(abs) * duckedVolume(abs, duckUnder, volume, duckedTo, duckRamp, duckBridge)
  if (!loop) return <Audio src={url} volume={vol} />
  return (
    <Loop durationInFrames={Math.max(1, loopFrames)} layout="none">
      <LoopedAudio src={url} loopFrames={loopFrames} volume={vol} />
    </Loop>
  )
}

/** Dans une <Loop>, retrouve la frame absolue pour que l'enveloppe ne boucle pas. */
function LoopedAudio({ src, volume, loopFrames }: { src: string; volume: (absFrame: number) => number; loopFrames: number }) {
  const iteration = Loop.useLoop()?.iteration ?? 0
  const base = iteration * loopFrames
  return <Audio src={src} volume={(f) => volume(base + f)} />
}

// ---------------------------------------------------------------------------
// Sous-titres synchronisés au mot
// ---------------------------------------------------------------------------

export interface CaptionsProps {
  timeline: VoiceTimeline
  /** Position verticale depuis le bas, en px. */
  bottom?: number
  fontSize?: number
  /** Couleur du mot prononcé. */
  activeColor?: string
  color?: string
  style?: CSSProperties
}

/**
 * Sous-titres « karaoké » : la réplique entre en ressort, chaque mot s'allume
 * au moment exact où il est prononcé (timestamps ElevenLabs).
 */
export function Captions({ timeline, bottom = 90, fontSize = 44, activeColor = BRAND.blue, color = BRAND.text, style }: CaptionsProps) {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const line = timeline.lines.find((l) => frame >= l.from && frame < l.from + l.durationInFrames + 6)
  if (!line) return null
  const local = frame - line.from
  const t = local / fps
  const enter = springPreset({ frame: local, fps, preset: 'snappy' })
  const exit = springPreset({ frame: local - line.durationInFrames, fps, preset: 'smooth', durationInFrames: 6 })

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        display: 'flex',
        justifyContent: 'center',
        opacity: enter * (1 - exit),
        transform: `translateY(${(1 - enter) * 24}px)`,
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: width * 0.78,
          padding: '14px 26px',
          borderRadius: 18,
          background: 'rgba(253,253,252,0.82)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 12px 40px -18px rgba(16,15,14,0.35)',
          fontFamily: FONT_DISPLAY,
          fontWeight: 500,
          fontSize,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          color,
        }}
      >
        {line.words.map((word, i) => {
          const lit = springPreset({ frame: (t - word.start) * fps, fps, preset: 'snappy' })
          const spoken = t >= word.start
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.28em',
                color: spoken ? activeColor : color,
                opacity: 0.35 + 0.65 * lit,
                transform: `translateY(${(1 - lit) * 4}px)`,
              }}
            >
              {word.text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
