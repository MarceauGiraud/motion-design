/**
 * Démo "Camera-Handheld" : le même plan (push, pan, retour, impact) filmé
 * trois fois — sans épaule, 'subtle', 'natural' — côte à côte, chaque panneau
 * étant une vraie caméra 1920x1080 réduite (les amplitudes sont donc fidèles).
 * En bas : tracé du décalage horizontal de l'épaule, pour juger la douceur.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { PlatformScreen } from '../../kit/Platform'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { Camera, resolveKeyframes, type CameraKeyframe } from './Camera'
import { centeredPlacement, PLATFORM_REGIONS as R } from './geometry'
import { handheldAt, handheldCatchAt, HANDHELD_PRESETS, impactShake, type HandheldIntensity } from './Handheld'
import { PlacedPlatform } from './PlatformCrop'

const W = 1920
const H = 1080
const PLACE = centeredPlacement(1600, W, H)
const IMPACT_AT = 176
export const HANDHELD_DEMO_FRAMES = 240

const KEYS: CameraKeyframe[] = [
  { at: 0 },
  { at: 18, focus: { rect: R.pipeline.cardInitech, padding: 260, maxZoom: 2.2 } },
  { at: 80, focus: { rect: { x: 40, y: 120, w: 520, h: 360 }, padding: 120, maxZoom: 2 } },
  { at: 138, zoom: 1, x: W / 2, y: H / 2 },
]
const IMPACTS = [impactShake(IMPACT_AT, 0.8)]

const PANEL_SCALE = 0.3
const PW = W * PANEL_SCALE
const PH = H * PANEL_SCALE
const GAP = 36
const LEFT = (W - PW * 3 - GAP * 2) / 2
const TOP = 210

type Mode = 'off' | HandheldIntensity
const MODES: Mode[] = ['off', 'subtle', 'natural']
const COLORS: Record<Mode, string> = { off: BRAND.textMuted, subtle: '#93C5FD', natural: BRAND.blue, energetic: BRAND.violet }

const Panel = ({ mode, index }: { mode: Mode; index: number }) => (
  <div style={{ position: 'absolute', left: LEFT + index * (PW + GAP), top: TOP }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: BRAND.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 12, height: 12, borderRadius: 6, background: COLORS[mode] }} />
      {mode === 'off' ? 'Sans épaule' : `handheld="${mode}"`}
    </div>
    <div style={{ width: PW, height: PH, borderRadius: 18, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 60px -30px rgba(16,15,14,0.35)', border: `1px solid ${BRAND.border}` }}>
      <div style={{ width: W, height: H, transform: `scale(${PANEL_SCALE})`, transformOrigin: '0 0', position: 'absolute' }}>
        <AbsoluteFill style={{ background: BRAND.paper }}>
          <Camera
            platform={PLACE}
            keyframes={KEYS}
            handheld={mode === 'off' ? false : { intensity: mode, impacts: IMPACTS }}
            width={W}
            height={H}
          >
            <PlacedPlatform placement={PLACE}>
              <PlatformScreen scene="pipeline" mode="static" />
            </PlacedPlatform>
          </Camera>
          {/* Réticule fixe : rend la dérive lisible. */}
          <div style={{ position: 'absolute', left: W / 2 - 1.5, top: H / 2 - 40, width: 3, height: 80, background: 'rgba(255,3,70,0.55)' }} />
          <div style={{ position: 'absolute', left: W / 2 - 40, top: H / 2 - 1.5, width: 80, height: 3, background: 'rgba(255,3,70,0.55)' }} />
        </AbsoluteFill>
      </div>
    </div>
  </div>
)

/** Tracé du décalage x (px écran) sur toute la durée, par intensité. */
const Trace = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const resolved = resolveKeyframes(KEYS, { width: W, height: H, platform: PLACE })
  const gx = LEFT
  const gw = PW * 3 + GAP * 2
  const gy = 820
  const gh = 190
  const scaleY = gh / 2 / 26
  const toX = (f: number) => gx + (f / (durationInFrames - 1)) * gw
  const paths = (['subtle', 'natural'] as const).map((mode) => {
    const r = HANDHELD_PRESETS[mode]
    const pts: string[] = []
    for (let f = 0; f < durationInFrames; f++) {
      const c = handheldCatchAt(f, fps, resolved, 'heavy', 1, r.catch, r.catchMaxPx, r.catchMaxZoom)
      const o = handheldAt(f, fps, { intensity: mode, impacts: IMPACTS }, 0, c)
      pts.push(`${toX(f).toFixed(1)},${(gy + gh / 2 - o.x * scaleY).toFixed(1)}`)
    }
    return { mode, d: 'M' + pts.join(' L') }
  })
  const marks = [
    ...KEYS.slice(1).map((k) => ({ f: k.at, label: `kf ${k.at}` })),
    { f: IMPACT_AT, label: 'impact' },
  ]
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <rect x={gx} y={gy} width={gw} height={gh} rx={14} fill="#FFFFFF" stroke={BRAND.border} />
      <line x1={gx} x2={gx + gw} y1={gy + gh / 2} y2={gy + gh / 2} stroke={BRAND.border} strokeDasharray="4 6" />
      {marks.map((m) => (
        <g key={m.label}>
          <line x1={toX(m.f)} x2={toX(m.f)} y1={gy} y2={gy + gh} stroke={BRAND.textMuted} strokeOpacity={0.25} />
          <text x={toX(m.f) + 6} y={gy + 22} fontSize={16} fontFamily={FONT_BODY} fill={BRAND.textMuted}>{m.label}</text>
        </g>
      ))}
      {paths.map((p) => (
        <path key={p.mode} d={p.d} fill="none" stroke={COLORS[p.mode]} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <line x1={toX(frame)} x2={toX(frame)} y1={gy - 8} y2={gy + gh + 8} stroke={BRAND.rose} strokeWidth={2} />
      <text x={gx} y={gy - 16} fontSize={20} fontFamily={FONT_BODY} fill={BRAND.text}>Décalage horizontal de l'épaule (±26 px) — dérive + rattrapage + impact</text>
    </svg>
  )
}

export const HandheldDemo = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <div style={{ position: 'absolute', left: '20%', right: '20%', top: '25%', bottom: '20%', backgroundImage: BRAND_RAMP, filter: 'blur(200px)', opacity: 0.08 }} />
    <div style={{ position: 'absolute', left: LEFT, top: 80, fontFamily: FONT_DISPLAY, fontSize: 56, color: BRAND.text, letterSpacing: -1 }}>Caméra à l'épaule</div>
    {MODES.map((m, i) => (
      <Panel key={m} mode={m} index={i} />
    ))}
    <Trace />
  </AbsoluteFill>
)
