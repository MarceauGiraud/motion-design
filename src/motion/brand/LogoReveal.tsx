/**
 * <LogoReveal> : révélations du logo, tout en ressorts.
 *
 *  variant 'draw'     : le contour se trace (pointe lumineuse), puis le dégradé remplit.
 *  variant 'sweep'    : un front de dégradé balaie le symbole de bas en haut, puis un reflet passe.
 *  variant 'converge' : des particules convergent en spirale sur le contour, le symbole éclot (onde de choc).
 *  variant 'morph'    : un point tombe, s'écrase (jelly), puis se métamorphose en symbole.
 *
 * lockup 'horizontal' : une fois le symbole posé, il glisse à gauche et le lettrage
 * "Acme" monte lettre par lettre (flou de mouvement lié à la vitesse).
 * Fond transparent : à poser sur un fond du module backgrounds.
 */
import { useId, type CSSProperties } from 'react'
import { evolvePath, getLength, getPointAtLength, getSubpaths, interpolatePath } from '@remotion/paths'
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { springPreset } from '../physics/springs'
import { safeId, SymbolGradient, wordmarkColor, type LogoTheme } from './Logo'
import { HORIZ_VIEWBOX, SYMBOL_PATH, SYMBOL_VIEWBOX, WORDMARK_LETTERS } from './logo-paths'

export type LogoRevealVariant = 'draw' | 'sweep' | 'converge' | 'morph'

export interface LogoRevealProps {
  /** Style de révélation. */
  variant?: LogoRevealVariant
  /** 'horizontal' = symbole + lettrage ; 'symbol' = symbole seul. */
  lockup?: 'symbol' | 'horizontal'
  /** Thème du fond sous le logo (couleur du lettrage, lueur). */
  theme?: LogoTheme
  /** Hauteur du symbole en px. Défaut : 22 % (horizontal) ou 36 % (symbole) de la hauteur vidéo. */
  height?: number
  /** Frame de départ. */
  delay?: number
  /** Frame (relative à delay) où le lettrage entre. Défaut : fin de la révélation du symbole. */
  wordmarkAt?: number
  /** Couleur du lettrage (défaut selon le thème). */
  wordmarkColor?: string
  /** Lueur de marque derrière le symbole. Défaut : true en sombre. */
  glow?: boolean
  /** Frame (relative à delay) de sortie : le logo recule et se dissout. */
  exitAt?: number
  /** true = rend le <svg> seul (pour l'insérer dans une mise en page) au lieu d'un AbsoluteFill centré. */
  inline?: boolean
  style?: CSSProperties
}

/** Durée (frames) de la révélation du symbole par variante : là où le lettrage entre. */
export const LOGO_REVEAL_TIMING: Record<LogoRevealVariant, number> = {
  draw: 58,
  sweep: 30,
  converge: 44,
  morph: 36,
}

// ---------------------------------------------------------------------------
// Géométrie précalculée (module) : pure, donc déterministe.
// ---------------------------------------------------------------------------
const SUBPATHS = getSubpaths(SYMBOL_PATH)
const SUB_LENGTHS = SUBPATHS.map((d) => getLength(d))
const CX = SYMBOL_VIEWBOX.width / 2
const CY = SYMBOL_VIEWBOX.height / 2

function circlePath(cx: number, cy: number, r: number): string {
  const k = 0.5523 * r
  return `M${cx} ${cy - r}C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}Z`
}

const PARTICLE_COUNT = 170
const TOTAL_LEN = SUB_LENGTHS.reduce((a, b) => a + b, 0)
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  // Réparti le long des contours, proportionnellement à leur longueur.
  let at = ((i + 0.5) / PARTICLE_COUNT) * TOTAL_LEN
  let s = 0
  while (s < SUBPATHS.length - 1 && at > SUB_LENGTHS[s]) {
    at -= SUB_LENGTHS[s]
    s++
  }
  const target = getPointAtLength(SUBPATHS[s], Math.min(at, SUB_LENGTHS[s])) ?? { x: CX, y: CY }
  const ang = random(`kp-a-${i}`) * Math.PI * 2
  const dist = 70 + random(`kp-d-${i}`) * 110
  return {
    tx: target.x,
    ty: target.y,
    sx: CX + Math.cos(ang) * dist,
    sy: CY + Math.sin(ang) * dist * 0.8,
    delay: random(`kp-t-${i}`) * 16,
    swirl: (random(`kp-s-${i}`) - 0.3) * 60,
    r: 0.55 + random(`kp-r-${i}`) * 0.75,
  }
})

// ---------------------------------------------------------------------------
// Symbole, par variante. Repère 68 x 104. `f` = frame locale.
// ---------------------------------------------------------------------------
interface SymbolArtProps {
  f: number
  fps: number
  gid: string
  uid: string
  theme: LogoTheme
}

const DrawSymbol: React.FC<SymbolArtProps> = ({ f, fps, gid, uid }) => {
  const p = springPreset({ frame: f, fps, preset: 'smooth', durationInFrames: 52 })
  const fill = springPreset({ frame: f, fps, preset: 'smooth', delay: 38, durationInFrames: 26 })
  const strokeOut = springPreset({ frame: f, fps, preset: 'smooth', delay: 50, durationInFrames: 20 })
  const tipOpacity = interpolate(p, [0, 0.04, 0.9, 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const inflate = 0.985 + 0.015 * fill
  return (
    <g>
      <defs>
        <filter id={`${uid}-tip`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <path
        d={SYMBOL_PATH}
        fill={`url(#${gid})`}
        fillRule="evenodd"
        opacity={fill}
        transform={`translate(${CX} ${CY}) scale(${inflate}) translate(${-CX} ${-CY})`}
      />
      {SUBPATHS.map((d, i) => {
        const ev = evolvePath(p, d)
        const tip = getPointAtLength(d, Math.max(0.001, p * SUB_LENGTHS[i])) ?? { x: CX, y: CY }
        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={ev.strokeDasharray}
              strokeDashoffset={ev.strokeDashoffset}
              opacity={1 - strokeOut}
            />
            <circle cx={tip.x} cy={tip.y} r={3.2} fill={BRAND.violet} opacity={tipOpacity * 0.7} filter={`url(#${uid}-tip)`} />
            <circle cx={tip.x} cy={tip.y} r={0.9} fill="#FFFFFF" opacity={tipOpacity} />
          </g>
        )
      })}
    </g>
  )
}

const SweepSymbol: React.FC<SymbolArtProps> = ({ f, fps, gid, uid }) => {
  const e = springPreset({ frame: f, fps, preset: 'smooth', durationInFrames: 34 })
  const edge = interpolate(e, [0, 1], [122, -26])
  const lift = springPreset({ frame: f, fps, preset: 'heavy', from: 0, to: 1 })
  const s = 0.9 + 0.1 * lift
  const ty = 8 * (1 - lift)
  const shine = springPreset({ frame: f, fps, preset: 'smooth', delay: 22, durationInFrames: 30 })
  const shineX = interpolate(shine, [0, 1], [-50, 110])
  const edgeGlow = interpolate(e, [0, 0.1, 0.85, 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <g transform={`translate(0 ${ty}) translate(${CX} ${CY}) scale(${s}) translate(${-CX} ${-CY})`}>
      <defs>
        <linearGradient id={`${uid}-front`} gradientUnits="userSpaceOnUse" x1={CX + 10} y1={edge + 12} x2={CX - 10} y2={edge - 12}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={108} height={144}>
          <rect x={-20} y={-20} width={108} height={144} fill={`url(#${uid}-front)`} />
        </mask>
        <clipPath id={`${uid}-clip`}>
          <path d={SYMBOL_PATH} clipRule="evenodd" />
        </clipPath>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <path d={SYMBOL_PATH} fill={`url(#${gid})`} fillRule="evenodd" mask={`url(#${uid}-mask)`} />
      <g clipPath={`url(#${uid}-clip)`}>
        {/* Liseré lumineux au front de balayage. */}
        <rect x={-20} y={edge - 3} width={108} height={6} fill="#FFFFFF" opacity={edgeGlow * 0.75} filter={`url(#${uid}-soft)`} transform={`rotate(-17 ${CX} ${edge})`} />
        {/* Reflet spéculaire qui traverse une fois posé. */}
        <rect x={shineX} y={-30} width={26} height={170} fill={`url(#${uid}-shine)`} transform={`skewX(-18)`} opacity={shine > 0.001 && shine < 0.999 ? 1 : 0} />
      </g>
    </g>
  )
}

const ConvergeSymbol: React.FC<SymbolArtProps> = ({ f, fps, gid }) => {
  const fill = springPreset({ frame: f, fps, preset: 'snappy', delay: 32 })
  const fade = springPreset({ frame: f, fps, preset: 'smooth', delay: 34, durationInFrames: 16 })
  const ring = springPreset({ frame: f, fps, preset: 'smooth', delay: 32, durationInFrames: 28 })
  const s = 0.9 + 0.1 * fill
  const pos = (pt: (typeof PARTICLES)[number], frame: number) => {
    const p = springPreset({ frame, fps, preset: 'snappy', delay: pt.delay, config: { mass: 0.9 } })
    // Trajectoire incurvée : décalage perpendiculaire en sin(πp) (spirale).
    const dx = pt.tx - pt.sx
    const dy = pt.ty - pt.sy
    const len = Math.hypot(dx, dy) || 1
    const curl = Math.sin(Math.PI * Math.min(1, p)) * pt.swirl
    return { x: pt.sx + dx * p + (-dy / len) * curl, y: pt.sy + dy * p + (dx / len) * curl, p }
  }
  return (
    <g>
      <circle cx={CX} cy={CY} r={18 + ring * 70} fill="none" stroke={`url(#${gid})`} strokeWidth={1.4 * (1 - ring)} opacity={ring > 0.001 ? (1 - ring) * 0.8 : 0} />
      <path
        d={SYMBOL_PATH}
        fill={`url(#${gid})`}
        fillRule="evenodd"
        opacity={Math.min(1, Math.max(0, fill))}
        transform={`translate(${CX} ${CY}) scale(${s}) translate(${-CX} ${-CY})`}
      />
      <g opacity={1 - fade}>
        {PARTICLES.map((pt, i) => {
          const now = pos(pt, f)
          const prev = pos(pt, f - 0.8)
          if (now.p <= 0.0005) return null
          const appear = Math.min(1, now.p * 4)
          return (
            <line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={now.x}
              y2={now.y}
              stroke={`url(#${gid})`}
              strokeWidth={pt.r * 2 * appear}
              strokeLinecap="round"
            />
          )
        })}
      </g>
    </g>
  )
}

const HOLE_CENTER = { x: 50.4, y: 70 }
const MorphSymbol: React.FC<SymbolArtProps> = ({ f, fps, gid }) => {
  // 1. Le point tombe et s'écrase (jelly), 2. il se métamorphose (morph), 3. pop (bouncy).
  const drop = springPreset({ frame: f, fps, preset: 'bouncy', durationInFrames: 22 })
  const dropPrev = springPreset({ frame: f - 1, fps, preset: 'bouncy', durationInFrames: 22 })
  const r = springPreset({ frame: f, fps, preset: 'jelly', from: 0, to: 8 })
  const m = springPreset({ frame: f, fps, preset: 'morph', delay: 13 })
  const pop = springPreset({ frame: f, fps, preset: 'bouncy', delay: 13, from: 0.88, to: 1 })
  const v = (drop - dropPrev) * 40
  const squash = 1 + Math.max(-0.35, Math.min(0.5, v * 0.05))
  const dy = interpolate(drop, [0, 1], [-60, 0])
  const dotY = CY + 6 + dy
  const outer = interpolatePath(Math.min(1, Math.max(0, m)), circlePath(CX, dotY, Math.max(0.01, r)), SUBPATHS[0])
  const hole = SUBPATHS[1] ? interpolatePath(Math.min(1, Math.max(0, m)), circlePath(HOLE_CENTER.x, HOLE_CENTER.y, 0.01), SUBPATHS[1]) : ''
  const pre = m < 0.001
  const s = pre ? 1 : pop
  const sx = pre ? 1 / Math.sqrt(squash) : 1
  const sy = pre ? squash : 1
  return (
    <g transform={`translate(${CX} ${pre ? dotY : CY}) scale(${s * sx} ${s * sy}) translate(${-CX} ${-(pre ? dotY : CY)})`}>
      <path d={`${outer} ${hole}`} fill={`url(#${gid})`} fillRule="evenodd" />
    </g>
  )
}

const ART: Record<LogoRevealVariant, React.FC<SymbolArtProps>> = {
  draw: DrawSymbol,
  sweep: SweepSymbol,
  converge: ConvergeSymbol,
  morph: MorphSymbol,
}

// ---------------------------------------------------------------------------

export const LogoReveal: React.FC<LogoRevealProps> = ({
  variant = 'morph',
  lockup = 'horizontal',
  theme = 'light',
  height,
  delay = 0,
  wordmarkAt,
  wordmarkColor: wmColor,
  glow,
  exitAt,
  inline = false,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps, height: vh } = useVideoConfig()
  const uid = safeId(useId(), 'lr')
  const gid = `${uid}-grad`
  const f = frame - delay
  const horizontal = lockup === 'horizontal'
  const h = height ?? vh * (horizontal ? 0.2 : 0.36)
  const wmAt = wordmarkAt ?? LOGO_REVEAL_TIMING[variant]
  const showGlow = glow ?? theme === 'dark'
  const Art = ART[variant]

  // Glissement du symbole vers sa place dans le lockup.
  const slide = horizontal ? springPreset({ frame: f, fps, preset: 'morph', delay: wmAt - 4 }) : 1
  const slidePrev = horizontal ? springPreset({ frame: f - 1, fps, preset: 'morph', delay: wmAt - 4 }) : 1
  const lockCenter = HORIZ_VIEWBOX.width / 2
  const symbolShift = horizontal ? (1 - slide) * (lockCenter - CX) : 0
  const slideBlur = Math.min(3, Math.abs(slide - slidePrev) * (lockCenter - CX) * 0.25)

  const glowIn = springPreset({ frame: f, fps, preset: 'gentle', delay: wmAt - 10 })
  const exit = exitAt === undefined ? 0 : springPreset({ frame: f, fps, preset: 'smooth', delay: exitAt, durationInFrames: 24 })

  const vbW = horizontal ? HORIZ_VIEWBOX.width : SYMBOL_VIEWBOX.width
  const vbH = HORIZ_VIEWBOX.height
  const pxW = (h * vbW) / vbH
  const color = wmColor ?? wordmarkColor(theme)

  const svg = (
      <svg
        width={pxW}
        height={h}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={{
          overflow: 'visible',
          opacity: 1 - exit,
          transform: `scale(${1 - exit * 0.06})`,
          filter: exit > 0.001 ? `blur(${exit * 12}px)` : undefined,
        }}
      >
        <defs>
          <SymbolGradient id={gid} />
          <filter id={`${uid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={`${uid}-hblur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={`${slideBlur} 0`} />
          </filter>
          <clipPath id={`${uid}-wmclip`}>
            <rect x={80} y={10} width={290} height={80} />
          </clipPath>
        </defs>
        <g transform={`translate(${symbolShift} 0)`} filter={slideBlur > 0.05 ? `url(#${uid}-hblur)` : undefined}>
          {showGlow && <path d={SYMBOL_PATH} fill={`url(#${gid})`} opacity={0.55 * glowIn} filter={`url(#${uid}-glow)`} />}
          {f >= 0 && <Art f={f} fps={fps} gid={gid} uid={uid} theme={theme} />}
        </g>
        {horizontal && (
          <g clipPath={`url(#${uid}-wmclip)`}>
            <g transform="translate(0 -4)">
              {WORDMARK_LETTERS.map((d, i) => {
                const at = wmAt + 2 + i * 3
                const p = springPreset({ frame: f, fps, preset: 'morph', delay: at })
                const pPrev = springPreset({ frame: f - 1, fps, preset: 'morph', delay: at })
                const vy = Math.abs(p - pPrev) * 70
                const blurId = `${uid}-lb${i}`
                return (
                  <g key={i}>
                    <filter id={blurId} x="-20%" y="-50%" width="140%" height="200%">
                      <feGaussianBlur stdDeviation={`0 ${Math.min(4, vy * 0.35)}`} />
                    </filter>
                    <path
                      d={d}
                      fill={color}
                      fillRule="evenodd"
                      transform={`translate(${(1 - p) * -6} ${(1 - p) * 70})`}
                      opacity={Math.min(1, p * 1.6)}
                      filter={vy > 0.05 ? `url(#${blurId})` : undefined}
                    />
                  </g>
                )
              })}
            </g>
          </g>
        )}
      </svg>
  )
  if (inline) return <div style={{ display: 'inline-flex', ...style }}>{svg}</div>
  return <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', ...style }}>{svg}</AbsoluteFill>
}
