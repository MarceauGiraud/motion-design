/**
 * <AnnotationTree> : un point d'ancrage sur l'UI, un tronc bleu de marque qui se
 * ramifie vers 1..N cartes d'annotation travaillées.
 *
 *   ancre ●── tronc ──●── branche ──╮
 *                     │             ╰── [ carte ]
 *                     ╰── branche ────── [ carte ]
 *
 * Tiges : BRAND.blue (Tailwind blue-600), 2 px, coudes arrondis (ou courbes),
 * tracées au ressort (stroke-dasharray). Ordre : ancre, tronc, nœud, branches en
 * stagger, puis chaque carte (scale .96→1, y 8→0, flou 6→0). Sortie en miroir.
 *
 * Également exportés : <AnnotationCard> (la carte seule) et `routeStems`
 * (géométrie pure), réutilisés par <Callout>.
 */
import { isValidElement, useId, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { springPreset } from '../physics/springs'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import type { Point } from '../camera/geometry'
import { UI_PALETTE } from './palette'

// ---------------------------------------------------------------------------
// Géométrie des tiges (pure)
// ---------------------------------------------------------------------------

export type StemRoute = 'orthogonal' | 'curve'
export type StemAxis = 'x' | 'y'
export type CardSide = 'left' | 'right' | 'top' | 'bottom'

export interface StemBranchGeometry {
  /** Chemin SVG (repère du conteneur). Pour une seule branche, il part de l'ancre. */
  d: string
  /** Bout de la tige (= point d'attache de la carte). */
  end: Point
  /** Côté de `end` où la carte se pose (sens d'arrivée de la tige). */
  side: CardSide
}

export interface StemGeometry {
  axis: StemAxis
  /** Tronc ancre → nœud. Null pour une branche unique (un seul tracé continu). */
  trunk: string | null
  /** Nœud de ramification. Null pour une branche unique. */
  node: Point | null
  branches: StemBranchGeometry[]
}

export interface RouteStemsOptions {
  route?: StemRoute
  /** Axe principal (celui du tronc). Défaut : déduit de la position moyenne des cartes. */
  axis?: StemAxis
  /** Longueur du tronc (px, le long de l'axe). Défaut : 42 % de la cible la plus proche. */
  trunk?: number
  /** Rayon des coudes (px). Défaut 18. */
  radius?: number
}

const f = (n: number) => Math.round(n * 100) / 100

/**
 * Calcule tronc + branches. Travaille dans un repère (u, v) où u = axe du tronc :
 * le même code sert aux arbres horizontaux et verticaux.
 */
export function routeStems(anchor: Point, targets: Point[], opts: RouteStemsOptions = {}): StemGeometry {
  const { route = 'orthogonal', radius = 18 } = opts
  const mdx = targets.reduce((a, t) => a + Math.abs(t.x - anchor.x), 0)
  const mdy = targets.reduce((a, t) => a + Math.abs(t.y - anchor.y), 0)
  const axis: StemAxis = opts.axis ?? (mdx >= mdy ? 'x' : 'y')
  const toUV = (p: Point) => (axis === 'x' ? { u: p.x - anchor.x, v: p.y - anchor.y } : { u: p.y - anchor.y, v: p.x - anchor.x })
  const P = (u: number, v: number) => (axis === 'x' ? `${f(anchor.x + u)} ${f(anchor.y + v)}` : `${f(anchor.x + v)} ${f(anchor.y + u)}`)
  const uvs = targets.map(toUV)
  const meanU = uvs.reduce((a, t) => a + t.u, 0) / Math.max(1, uvs.length)
  const s = meanU >= 0 ? 1 : -1
  const minAbsU = uvs.length ? Math.min(...uvs.map((t) => Math.abs(t.u))) : 0
  const single = targets.length === 1
  const su = s * Math.max(0, Math.min(opts.trunk ?? minAbsU * 0.42, minAbsU - 8))
  const sideOf = (): CardSide => (axis === 'x' ? (s > 0 ? 'right' : 'left') : s > 0 ? 'bottom' : 'top')

  const branch = (t: { u: number; v: number }): string => {
    const run = Math.abs(t.u - su)
    const sv = t.v >= 0 ? 1 : -1
    if (route === 'curve') {
      const k = run * 0.55
      const start = single ? `M ${P(0, 0)} L ${P(su, 0)}` : `M ${P(su, 0)}`
      if (Math.abs(t.v) < 0.5) return `${start} L ${P(t.u, t.v)}`
      // Premier point de contrôle légèrement ouvert : les branches s'écartent dès le nœud.
      return `${start} C ${P(su + s * k * 0.8, single ? 0 : t.v * 0.12)} ${P(t.u - s * k, t.v)} ${P(t.u, t.v)}`
    }
    if (Math.abs(t.v) < 0.5) return `M ${P(single ? 0 : su, 0)} L ${P(t.u, 0)}`
    // Coude d'arrivée (v → u), toujours arrondi.
    const r2 = Math.max(0, Math.min(radius, Math.abs(t.v) / 2, run))
    const tail = `L ${P(su, t.v - sv * r2)} Q ${P(su, t.v)} ${P(su + s * r2, t.v)} L ${P(t.u, t.v)}`
    if (!single) return `M ${P(su, 0)} ${tail}`
    // Branche unique : le coude de départ (u → v) est arrondi aussi.
    const r1 = Math.max(0, Math.min(radius, Math.abs(su), Math.abs(t.v) / 2))
    return `M ${P(0, 0)} L ${P(su - s * r1, 0)} Q ${P(su, 0)} ${P(su, sv * r1)} ${tail}`
  }

  return {
    axis,
    trunk: single ? null : `M ${P(0, 0)} L ${P(su, 0)}`,
    node: single ? null : axis === 'x' ? { x: anchor.x + su, y: anchor.y } : { x: anchor.x, y: anchor.y + su },
    branches: targets.map((t, i) => ({ d: branch(uvs[i]), end: t, side: sideOf() })),
  }
}

// ---------------------------------------------------------------------------
// Carte
// ---------------------------------------------------------------------------

export type AnnotationTheme = 'light' | 'dark' | 'brand'
/** Icône lucide (composant) ou nœud React (texte, numéro, élément). */
export type AnnotationIcon = ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }> | ReactNode

export interface AnnotationCardProps {
  title: ReactNode
  caption?: ReactNode
  icon?: AnnotationIcon
  /** Valeur mise en avant à droite (ex. « 88 k€ »). */
  metric?: ReactNode
  /** Pastille sous le titre (ex. « +12 % », « IA »). */
  pill?: ReactNode
  theme?: AnnotationTheme
  /** Échelle globale. Défaut 1. */
  scale?: number
  /** Taille du titre à scale 1. Défaut 21. */
  titleSize?: number
  /** Taille de la légende à scale 1. Défaut 16. */
  captionSize?: number
  /** Largeur max à scale 1. Défaut 380. */
  maxWidth?: number
  /** Largeur fixe à scale 1 (sinon s'adapte au contenu). */
  width?: number
  style?: CSSProperties
}

function renderIcon(icon: AnnotationIcon, size: number, color: string, fontSize: number): ReactNode {
  if (icon === null || icon === undefined || icon === false) return null
  if (typeof icon === 'string' || typeof icon === 'number') {
    return <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{icon}</span>
  }
  if (isValidElement(icon)) return icon
  const Icon = icon as ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  return <Icon size={size} color={color} strokeWidth={2} />
}

const CARD_SKIN: Record<AnnotationTheme, { card: CSSProperties; text: string; muted: string; chip: CSSProperties; chipInk: string; pill: CSSProperties; metric: string }> = {
  light: {
    card: {
      background: UI_PALETTE.white,
      border: `1px solid ${BRAND.border}`,
      boxShadow: [
        '0 1px 0 rgba(255,255,255,0.9) inset',
        '0 1px 2px rgba(16,15,14,0.05)',
        '0 6px 14px -6px rgba(16,15,14,0.10)',
        '0 28px 56px -24px rgba(16,15,14,0.28)',
      ].join(', '),
    },
    text: BRAND.text,
    muted: BRAND.textMuted,
    chip: { background: BRAND.blueSoft, boxShadow: `inset 0 0 0 1px ${UI_PALETTE.blueHairline}` },
    chipInk: BRAND.blue,
    pill: { background: BRAND.blueSoft, color: BRAND.blueDeep },
    metric: BRAND.text,
  },
  dark: {
    card: {
      background: UI_PALETTE.glassNavy,
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(18px) saturate(1.3)',
      boxShadow: ['0 1px 0 rgba(255,255,255,0.10) inset', '0 10px 24px -10px rgba(0,0,0,0.45)', '0 34px 70px -28px rgba(0,0,0,0.65)'].join(', '),
    },
    text: UI_PALETTE.white,
    muted: 'rgba(255,255,255,0.64)',
    chip: { background: UI_PALETTE.blueGlass, boxShadow: 'inset 0 0 0 1px rgba(147,197,253,0.22)' },
    chipInk: UI_PALETTE.blueOnDark,
    pill: { background: UI_PALETTE.blueGlass, color: UI_PALETTE.blueOnDark },
    metric: UI_PALETTE.white,
  },
  brand: {
    card: {
      backgroundImage: BRAND_RAMP,
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: ['0 1px 0 rgba(255,255,255,0.25) inset', '0 8px 18px -8px rgba(128,2,159,0.35)', '0 30px 60px -26px rgba(16,15,14,0.45)'].join(', '),
    },
    text: UI_PALETTE.white,
    muted: 'rgba(255,255,255,0.80)',
    chip: { background: 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' },
    chipInk: UI_PALETTE.white,
    pill: { background: 'rgba(255,255,255,0.18)', color: UI_PALETTE.white },
    metric: UI_PALETTE.white,
  },
}

/** La carte d'annotation seule (statique) : pastille d'icône, titre, légende, métrique, pastille. */
export function AnnotationCard({
  title,
  caption,
  icon,
  metric,
  pill,
  theme = 'light',
  scale = 1,
  titleSize = 21,
  captionSize = 16,
  maxWidth = 380,
  width,
  style,
}: AnnotationCardProps) {
  const k = CARD_SKIN[theme]
  const z = scale
  const chip = Math.round(38 * z * (titleSize / 21))
  const hasIcon = icon !== undefined && icon !== null && icon !== false
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: width !== undefined ? width * z : 'max-content',
        maxWidth: maxWidth * z,
        padding: `${14 * z}px ${18 * z}px ${14 * z}px ${hasIcon ? 14 * z : 18 * z}px`,
        borderRadius: 15 * z,
        display: 'flex',
        alignItems: 'center',
        gap: 13 * z,
        fontFamily: FONT_BODY,
        color: k.text,
        ...k.card,
        ...style,
      }}
    >
      {hasIcon && (
        <div
          style={{
            flex: 'none',
            width: chip,
            height: chip,
            borderRadius: chip * 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...k.chip,
          }}
        >
          {renderIcon(icon, chip * 0.5, k.chipInk, chip * 0.44)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * z }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: titleSize * z, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</div>
          {pill !== undefined && (
            <div
              style={{
                flex: 'none',
                padding: `${2.5 * z}px ${8 * z}px`,
                borderRadius: 999,
                fontSize: captionSize * 0.78 * z,
                fontWeight: 600,
                lineHeight: 1.3,
                fontVariantNumeric: 'tabular-nums',
                ...k.pill,
              }}
            >
              {pill}
            </div>
          )}
        </div>
        {caption !== undefined && <div style={{ marginTop: 3 * z, fontSize: captionSize * z, lineHeight: 1.4, color: k.muted, textWrap: 'pretty' } as CSSProperties}>{caption}</div>}
      </div>
      {metric !== undefined && (
        <div
          style={{
            flex: 'none',
            marginLeft: 6 * z,
            paddingLeft: 14 * z,
            borderLeft: `1px solid ${theme === 'light' ? BRAND.border : 'rgba(255,255,255,0.14)'}`,
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: titleSize * 1.15 * z,
            letterSpacing: '-0.02em',
            color: k.metric,
            fontVariantNumeric: 'tabular-nums',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {metric}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rendu animé partagé (ancre, tiges, cartes)
// ---------------------------------------------------------------------------

export type CardCross = 'start' | 'center' | 'end'

interface CardSlot {
  end: Point
  side: CardSide
  cross: CardCross
  /** 0..1 : présence de la carte (entrée − sortie). */
  p: number
  node: ReactNode
}

/** Position absolue d'une carte collée au bout de sa tige. */
function CardPlacement({ end, side, cross, p, node, scale }: CardSlot & { scale: number }) {
  if (p <= 0.001) return null
  const horizontal = side === 'left' || side === 'right'
  // Décalage transversal : 'start' aligne la tige sur la pastille d'icône.
  const lead = 33 * scale
  const crossT = cross === 'center' ? '-50%' : cross === 'start' ? `-${lead}px` : `calc(-100% + ${lead}px)`
  const tx = horizontal ? (side === 'right' ? '0px' : '-100%') : crossT
  const ty = horizontal ? crossT : side === 'bottom' ? '0px' : '-100%'
  const origin = { right: '0% 50%', left: '100% 50%', bottom: '50% 0%', top: '50% 100%' }[side]
  const blur = 6 * (1 - p)
  return (
    <div
      style={{
        position: 'absolute',
        left: end.x,
        top: end.y,
        transform: `translate(${tx}, ${ty}) translateY(${8 * (1 - p)}px) scale(${0.96 + 0.04 * p})`,
        transformOrigin: origin,
        opacity: interpolate(p, [0, 0.55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      {node}
    </div>
  )
}

interface StemLayerProps {
  geo: StemGeometry
  anchor: Point
  anchorP: number
  trunkP: number
  nodeP: number
  branchP: number[]
  socketP: number[]
  color: string
  theme: AnnotationTheme
  stroke: number
  fade: boolean
  pulse: number
  scale: number
}

const dash = (p: number) => ({ pathLength: 1, strokeDasharray: `${Math.min(1, Math.max(0, p))} 2` })

/** Tiges + ancre + nœud (sous les cartes) ; les douilles sont rendues par <SocketLayer>. */
function StemLayer({ geo, anchor, anchorP, trunkP, nodeP, branchP, color, theme, stroke, fade, pulse, scale }: StemLayerProps) {
  const id = useId().replace(/:/g, '')
  const dark = theme === 'dark'
  const casing = dark ? null : { stroke: UI_PALETTE.white, width: stroke + 4 * scale, opacity: 0.9 }
  const paths: { d: string; p: number; grad?: string }[] = []
  if (geo.trunk) paths.push({ d: geo.trunk, p: trunkP })
  geo.branches.forEach((b, i) => paths.push({ d: b.d, p: branchP[i], grad: fade ? `g${id}${i}` : undefined }))
  const visible = paths.filter((q) => q.p > 0.002)
  const from = geo.node ?? anchor
  return (
    <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <defs>
        {dark && (
          <filter id={`glow${id}`} filterUnits="userSpaceOnUse" x={-10000} y={-10000} width={20000} height={20000}>
            <feGaussianBlur stdDeviation={3 * scale} />
          </filter>
        )}
        {fade &&
          geo.branches.map((b, i) => (
            <linearGradient key={i} id={`g${id}${i}`} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={b.end.x} y2={b.end.y}>
              <stop offset="0" stopColor={color} stopOpacity={1} />
              <stop offset="0.55" stopColor={color} stopOpacity={0.9} />
              <stop offset="1" stopColor={color} stopOpacity={0.35} />
            </linearGradient>
          ))}
      </defs>
      {/* Liseré blanc (clair) ou halo bleu (sombre) : la tige se lit sur n'importe quelle UI. */}
      {visible.map((q, i) =>
        casing ? (
          <path key={`c${i}`} d={q.d} fill="none" stroke={casing.stroke} strokeOpacity={casing.opacity} strokeWidth={casing.width} strokeLinecap="round" strokeLinejoin="round" {...dash(q.p)} />
        ) : (
          <path key={`c${i}`} d={q.d} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={stroke * 2.5} strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow${id})`} {...dash(q.p)} />
        ),
      )}
      {visible.map((q, i) => (
        <path key={`s${i}`} d={q.d} fill="none" stroke={q.grad ? `url(#${q.grad})` : color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...dash(q.p)} />
      ))}
      {geo.node && nodeP > 0.001 && (
        <g transform={`translate(${geo.node.x} ${geo.node.y}) scale(${nodeP})`}>
          <circle r={5.5 * scale} fill={dark ? UI_PALETTE.glassNavy : UI_PALETTE.white} />
          <circle r={3.5 * scale} fill={color} />
        </g>
      )}
      {anchorP > 0.001 && (
        <g transform={`translate(${anchor.x} ${anchor.y})`}>
          {/* Onde : s'élargit et s'efface, en boucle douce. */}
          <circle r={(7 + 17 * pulse) * scale} fill={color} fillOpacity={0.1 * (1 - pulse) * anchorP} stroke={color} strokeOpacity={0.45 * (1 - pulse) * anchorP} strokeWidth={1.25 * scale} />
          <circle r={12 * scale * anchorP} fill={color} fillOpacity={dark ? 0.22 : 0.14} />
          <circle r={6 * scale * anchorP} fill={color} stroke={UI_PALETTE.white} strokeWidth={2.25 * scale} />
        </g>
      )}
    </svg>
  )
}

/** Douille au bout de chaque tige, posée sur le bord de la carte (au-dessus). */
function SocketLayer({ ends, ps, color, theme, scale }: { ends: Point[]; ps: number[]; color: string; theme: AnnotationTheme; scale: number }) {
  if (!ps.some((p) => p > 0.001)) return null
  return (
    <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {ends.map((e, i) =>
        ps[i] > 0.001 ? (
          <g key={i} transform={`translate(${e.x} ${e.y}) scale(${ps[i]})`}>
            <circle r={4.5 * scale} fill={theme === 'dark' ? UI_PALETTE.glassNavy : UI_PALETTE.white} stroke={color} strokeWidth={1.75 * scale} />
          </g>
        ) : null,
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// AnnotationTree
// ---------------------------------------------------------------------------

export interface AnnotationBranch {
  /** Bout de la tige = point d'attache de la carte (repère du conteneur). */
  to: Point
  title: ReactNode
  caption?: ReactNode
  /** Icône lucide (`icon: Sparkles`) ou nœud (texte, numéro). */
  icon?: AnnotationIcon
  metric?: ReactNode
  pill?: ReactNode
  /**
   * Côté du bout de tige où se pose la carte. Défaut : dans le sens d'arrivée
   * de la tige ('right' si la tige arrive vers la droite, etc.).
   */
  align?: CardSide
  /** Alignement transversal de la carte sur la tige. Défaut 'center'. */
  cross?: CardCross
  /** Largeur fixe de la carte (px à scale 1). */
  width?: number
}

export interface AnnotationTreeProps {
  /** Point désigné sur l'UI (repère du conteneur). */
  anchor: Point
  branches: AnnotationBranch[]
  /** Frame d'apparition de l'ancre. */
  at: number
  /** Frame de début de la sortie (cartes, puis branches, tronc, ancre). */
  exitAt?: number
  theme?: 'light' | 'dark'
  /** 'orthogonal' (coudes arrondis, défaut) ou 'curve' (Bézier). */
  route?: StemRoute
  /** Axe du tronc. Défaut : déduit des positions. */
  axis?: StemAxis
  /** Longueur du tronc (px). Défaut : 42 % de la carte la plus proche. */
  trunk?: number
  /** Rayon des coudes (px). Défaut 18 × scale. */
  radius?: number
  /** Frames entre deux branches. Défaut 5. */
  stagger?: number
  /** Couleur des tiges. Défaut BRAND.blue (#2563EB). */
  color?: string
  /** Épaisseur des tiges (px à scale 1). Défaut 2. */
  strokeWidth?: number
  /** Dégradé d'opacité vers le bout des tiges. Défaut false. */
  fade?: boolean
  /** Échelle (cartes, traits, points). Défaut 1. */
  scale?: number
  /** Largeur commune des cartes (px à scale 1) : une colonne nette. Défaut : selon le contenu. */
  cardWidth?: number
  /** Largeur max des cartes (px à scale 1). Défaut 380. */
  maxWidth?: number
  style?: CSSProperties
}

/** Ancre pulsante + tronc bleu qui se ramifie vers des cartes d'annotation. */
export function AnnotationTree({
  anchor,
  branches,
  at,
  exitAt,
  theme = 'light',
  route = 'orthogonal',
  axis,
  trunk,
  radius,
  stagger = 5,
  color = BRAND.blue,
  strokeWidth = 2,
  fade = false,
  scale = 1,
  cardWidth,
  maxWidth = 380,
  style,
}: AnnotationTreeProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < at || branches.length === 0) return null
  const n = branches.length
  const single = n === 1
  const geo = routeStems(anchor, branches.map((b) => b.to), { route, axis, trunk, radius: radius ?? 18 * scale })

  const sp = (delay: number, preset: 'smooth' | 'morph' | 'whip' | 'snappy' = 'smooth', durationInFrames?: number) =>
    springPreset({ frame, fps, preset, delay, durationInFrames })
  const out = (delay: number, dur: number) => (exitAt === undefined ? 0 : sp(delay, 'smooth', dur))

  // Entrée
  const tBranch0 = single ? at + 3 : at + 13
  const trunkIn = sp(at + 3, 'smooth', 12)
  const nodeIn = sp(at + 11, 'whip')
  const branchIn = branches.map((_, i) => sp(tBranch0 + i * stagger, 'smooth', single ? 20 : 16))
  const cardIn = branches.map((_, i) => sp(tBranch0 + i * stagger + (single ? 15 : 12), 'morph'))
  const socketIn = branches.map((_, i) => sp(tBranch0 + i * stagger + (single ? 16 : 13), 'whip'))
  const anchorIn = sp(at, 'snappy')

  // Sortie (miroir : dernière carte d'abord, puis tiges vers l'ancre)
  const e = exitAt ?? 0
  const rev = (i: number) => (n - 1 - i) * 3
  const cardOut = branches.map((_, i) => out(e + rev(i), 10))
  const branchOut = branches.map((_, i) => out(e + 5 + rev(i), 12))
  const tTrunkOut = e + 5 + (n - 1) * 3 + 8
  const trunkOut = out(tTrunkOut, 10)
  const nodeOut = out(tTrunkOut - 2, 8)
  const anchorOut = out(tTrunkOut + 6, 10)
  if (exitAt !== undefined && anchorOut >= 0.999) return null

  const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
  const pulse = (((frame - at) % 60) + 60) % 60 / 60
  const pulseEased = 1 - (1 - pulse) * (1 - pulse)

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', ...style }}>
      <StemLayer
        geo={geo}
        anchor={anchor}
        anchorP={clamp01(anchorIn) * (1 - anchorOut)}
        trunkP={trunkIn * (1 - trunkOut)}
        nodeP={clamp01(nodeIn) * (1 - nodeOut)}
        branchP={branchIn.map((p, i) => p * (1 - branchOut[i]))}
        socketP={[]}
        color={color}
        theme={theme}
        stroke={strokeWidth * scale}
        fade={fade}
        pulse={pulseEased}
        scale={scale}
      />
      {branches.map((b, i) => (
        <CardPlacement
          key={i}
          end={b.to}
          side={b.align ?? geo.branches[i].side}
          cross={b.cross ?? 'center'}
          p={Math.max(0, cardIn[i] - cardOut[i])}
          scale={scale}
          node={
            <AnnotationCard
              title={b.title}
              caption={b.caption}
              icon={b.icon}
              metric={b.metric}
              pill={b.pill}
              theme={theme}
              scale={scale}
              maxWidth={maxWidth}
              width={b.width ?? cardWidth}
            />
          }
        />
      ))}
      <SocketLayer ends={branches.map((b) => b.to)} ps={socketIn.map((p, i) => clamp01(p) * (1 - cardOut[i]))} color={color} theme={theme} scale={scale} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variante à une branche, utilisée par <Callout> (même langage visuel).
// ---------------------------------------------------------------------------

export interface LeaderAnnotationProps {
  target: Point
  end: Point
  at: number
  until?: number
  card: ReactNode
  side: CardSide
  theme: AnnotationTheme
  color: string
  scale: number
}

/** Ancre → tige en L arrondie → carte. Interne : sert de rendu à <Callout>. */
export function LeaderAnnotation({ target, end, at, until, card, side, theme, color, scale }: LeaderAnnotationProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < at) return null
  const out = (delay: number, dur: number) => (until === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay, durationInFrames: dur }))
  const cardOut = out(until ?? 0, 10)
  const lineOut = out((until ?? 0) + 5, 12)
  const anchorOut = out((until ?? 0) + 12, 10)
  if (until !== undefined && anchorOut >= 0.999) return null
  const anchorIn = springPreset({ frame, fps, preset: 'snappy', delay: at })
  const lineIn = springPreset({ frame, fps, preset: 'smooth', delay: at + 3, durationInFrames: 18 })
  const cardIn = springPreset({ frame, fps, preset: 'morph', delay: at + 16 })
  const socketIn = springPreset({ frame, fps, preset: 'whip', delay: at + 17 })
  // L : on longe d'abord l'axe vertical, puis on entre horizontalement dans la carte.
  const geo = routeStems(target, [end], { axis: 'x', trunk: 0, radius: 18 * scale })
  const pulse = (((frame - at) % 60) + 60) % 60 / 60
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
  return (
    <>
      <StemLayer
        geo={geo}
        anchor={target}
        anchorP={clamp01(anchorIn) * (1 - anchorOut)}
        trunkP={0}
        nodeP={0}
        branchP={[lineIn * (1 - lineOut)]}
        socketP={[]}
        color={color}
        theme={theme === 'dark' ? 'dark' : 'light'}
        stroke={2 * scale * 1.2}
        fade={false}
        pulse={1 - (1 - pulse) * (1 - pulse)}
        scale={scale * 1.2}
      />
      <CardPlacement end={end} side={side} cross="center" p={Math.max(0, cardIn - cardOut)} node={card} scale={scale} />
      <SocketLayer ends={[end]} ps={[clamp01(socketIn) * (1 - cardOut)]} color={color} theme={theme} scale={scale * 1.2} />
    </>
  )
}
