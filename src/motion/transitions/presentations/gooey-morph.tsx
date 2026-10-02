import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, random, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP } from '../../tokens'
import { remap, type SpringDrivenProps } from '../timing'

export interface GooeyMorphProps extends SpringDrivenProps {
  /** Point de naissance de la goutte, en fraction de l'écran. */
  origin?: { x: number; y: number }
  /** Nombre de gouttelettes satellites qui fusionnent. */
  blobs?: number
  /** Graine du placement des satellites. */
  seed?: string
  /** Liseré coloré (dégradé) autour de la goutte ; null = aucun. */
  rimColor?: string | null
  /** Épaisseur du liseré (px). */
  rimWidth?: number
  /** Fond visible derrière la sortante quand elle recule. */
  backdrop?: string
}

interface Blob {
  x: number
  y: number
  r: number
}

/** Masque SVG en data-URL : cercles + filtre "goo" (flou puis seuil alpha). */
function gooMask(blobs: Blob[], width: number, height: number, grow: number): string {
  const circles = blobs
    .filter((b) => b.r + grow > 0.5)
    .map((b) => `<circle cx='${b.x.toFixed(1)}' cy='${b.y.toFixed(1)}' r='${(b.r + grow).toFixed(1)}'/>`)
    .join('')
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>` +
    `<filter id='g' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='26'/>` +
    `<feColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 26 -11'/></filter>` +
    `<g filter='url(#g)' fill='#fff'>${circles}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const GooeyMorph: React.FC<TransitionPresentationComponentProps<GooeyMorphProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { width, height } = useVideoConfig()
  const { origin = { x: 0.5, y: 0.55 }, blobs: count = 7, seed = 'goo', rimColor = BRAND_RAMP, rimWidth = 18, backdrop = BRAND.night } = passedProps

  if (presentationDirection === 'exiting') {
    const s = 1 - 0.05 * p
    return (
      <AbsoluteFill style={{ backgroundColor: p > 0.001 ? backdrop : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${s})`, filter: `saturate(${1 - 0.4 * p})` }}>
          {children}
          <AbsoluteFill style={{ backgroundColor: BRAND.night, opacity: 0.3 * p }} />
        </AbsoluteFill>
      </AbsoluteFill>
    )
  }
  if (p >= 0.995) return <AbsoluteFill>{children}</AbsoluteFill>

  const ox = origin.x * width
  const oy = origin.y * height
  const maxR = Math.max(Math.hypot(ox, oy), Math.hypot(width - ox, oy), Math.hypot(ox, height - oy), Math.hypot(width - ox, height - oy))
  const q = Math.max(0, p)
  const env = Math.sin(Math.PI * Math.min(1, q))
  const R = maxR * 1.08 * Math.pow(q, 1.25)

  const list: Blob[] = [{ x: ox, y: oy, r: R }]
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + random(`${seed}-a-${i}`) * 0.8
    // Chaque satellite naît un peu après, jaillit devant la goutte puis se fait avaler.
    const born = remap(q, [0.04 + 0.05 * random(`${seed}-t-${i}`), 0.35])
    const r = born * (maxR * (0.05 + 0.05 * random(`${seed}-r-${i}`)) + R * 0.3)
    // Collée au bord de la goutte (le filtre "goo" crée le pont), un peu devant.
    const reach = R * 0.9 + r * (0.55 + 0.5 * random(`${seed}-d-${i}`)) * (0.6 + 0.4 * env)
    list.push({ x: ox + Math.cos(a) * reach, y: oy + Math.sin(a) * reach, r })
    // Gouttelette détachée, plus loin, qui sera avalée.
    const r2 = r * 0.38
    const reach2 = reach + r + r2 + maxR * 0.03 * env
    list.push({ x: ox + Math.cos(a + 0.12) * reach2, y: oy + Math.sin(a + 0.12) * reach2, r: r2 * env })
  }

  const sceneMask = gooMask(list, width, height, 0)
  const rimMask = rimColor ? gooMask(list, width, height, rimWidth * env + 2) : null
  const maskStyle = (m: string): React.CSSProperties => ({
    WebkitMaskImage: m,
    maskImage: m,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  })

  return (
    <AbsoluteFill>
      {rimMask ? <AbsoluteFill style={{ backgroundImage: rimColor ?? undefined, ...maskStyle(rimMask) }} /> : null}
      <AbsoluteFill style={maskStyle(sceneMask)}>
        <AbsoluteFill style={{ transform: `scale(${1.06 - 0.06 * Math.min(1, q)})`, transformOrigin: `${ox}px ${oy}px` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Métaballes : une goutte naît d'un point, des gouttelettes jaillissent et fusionnent jusqu'à couvrir l'écran. */
export const gooeyMorph = (props: GooeyMorphProps = {}): TransitionPresentation<GooeyMorphProps> => ({
  component: GooeyMorph,
  props,
})
