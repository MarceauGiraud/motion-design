/**
 * <Highlighter> : phrase avec marques dessinées à la main.
 *  - marker    : coup de surligneur qui balaie derrière les mots
 *  - underline : trait ondulé qui se dessine (dégradé BRAND_RAMP par défaut)
 *  - circle    : entourage tracé au feutre
 *  - strike    : barré qui se dessine
 * Les marques se déclenchent en cascade après l'entrée du texte.
 */
import { useId, type CSSProperties } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { springPreset } from '../physics/springs'
import { BRAND, BRAND_RAMP_STOPS, FONT_DISPLAY } from '../tokens'
import { useTextLayouts, withAlpha } from './shared'

export type HighlightMark = 'marker' | 'underline' | 'circle' | 'strike'

export interface HighlightPart {
  text: string
  mark?: HighlightMark
  /** Couleur de la marque. Défaut : rose translucide (marker) / dégradé du logo (traits). */
  color?: string
  /** Frame de déclenchement de cette marque (sinon cascade automatique). */
  at?: number
}

export interface HighlighterProps {
  /** Segments : texte brut ou { text, mark }. */
  parts?: Array<string | HighlightPart>
  /** Frame de départ (entrée du texte). */
  startAt?: number
  /** Délai entre l'entrée du texte et la première marque. */
  markDelay?: number
  /** Frames entre deux marques. */
  markStagger?: number
  /** Entrée du texte (mots qui montent). false = texte déjà là. */
  enter?: boolean
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: string
  letterSpacing?: string
  lineHeight?: number
  align?: 'left' | 'center' | 'right'
  maxWidth?: number
  style?: CSSProperties
}

export const Highlighter: React.FC<HighlighterProps> = ({
  parts = ['Chaque relance ', { text: 'au bon moment', mark: 'marker' }, ', sans ', { text: 'aucun tableur', mark: 'strike' }, '. ', { text: 'Enfin.', mark: 'underline' }],
  startAt = 0,
  markDelay = 18,
  markStagger = 16,
  enter = true,
  fontSize = 92,
  fontWeight = 500,
  color = BRAND.text,
  fontFamily = FONT_DISPLAY,
  letterSpacing = '-0.035em',
  lineHeight = 1.2,
  align = 'center',
  maxWidth = 1500,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const segs = parts.map((p) => (typeof p === 'string' ? { text: p } : p))
  // Largeur réelle des segments marqués : les traits SVG sont tracés en px.
  const marked = segs.filter((s) => s.mark && s.mark !== 'marker').map((s) => s.text)
  const { layouts, measurer } = useTextLayouts(marked, { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight })
  const widthOf = (t: string) => layouts?.[marked.indexOf(t)]?.width ?? 0

  // Entrée des mots.
  let wordIndex = 0
  const wordCount = segs.reduce((n, s) => n + s.text.split(/\s+/).filter(Boolean).length, 0)
  const enterEnd = startAt + wordCount * 2.2
  const wordStyle = (): CSSProperties => {
    if (!enter) return { display: 'inline-block' }
    const s = springPreset({ frame, fps, preset: 'snappy', delay: startAt + wordIndex++ * 2.2 })
    return {
      display: 'inline-block',
      opacity: interpolate(s, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
      transform: `translateY(${(1 - s) * 0.4}em)`,
      filter: s < 0.96 ? `blur(${(1 - s) * 10}px)` : undefined,
    }
  }
  const renderWords = (t: string) =>
    t.split(/(\s+)/).map((w, i) => (/^\s+$/.test(w) || !w ? w : <span key={i} style={wordStyle()}>{w}</span>))

  let markIndex = 0
  return (
    <div style={{ position: 'relative', fontFamily, fontSize, fontWeight, color, letterSpacing, lineHeight, textAlign: align, maxWidth, whiteSpace: 'pre-wrap', ...style }}>
      {measurer}
      {segs.map((seg, si) => {
        if (!seg.mark) return <span key={si}>{renderWords(seg.text)}</span>
        const at = seg.at ?? (enter ? enterEnd : startAt) + markDelay + markIndex++ * markStagger
        const p = springPreset({ frame, fps, preset: seg.mark === 'marker' ? 'morph' : 'smooth', delay: at, durationInFrames: seg.mark === 'circle' ? 26 : 20 })
        const gid = `hl-${uid}-${si}`
        const f = fontSize
        const w = widthOf(seg.text)
        let deco: React.ReactNode = null
        if (seg.mark === 'marker') {
          deco = (
            <span
              style={{
                position: 'absolute',
                left: '-0.1em',
                right: '-0.1em',
                top: '0.24em',
                bottom: '0.06em',
                background: seg.color ?? withAlpha(BRAND.rose, 0.2),
                borderRadius: '0.18em 0.32em 0.22em 0.4em',
                transform: 'rotate(-1.2deg) skewX(-6deg)',
                clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 0.2em)`,
                zIndex: -1,
              }}
            />
          )
        } else if (w > 0) {
          let d: string
          let sw = f * 0.055
          if (seg.mark === 'underline') {
            d = `M ${-0.02 * w} ${1.07 * f} C ${0.25 * w} ${0.99 * f}, ${0.5 * w} ${1.13 * f}, ${0.75 * w} ${1.05 * f} S ${0.98 * w} ${1.01 * f}, ${1.03 * w} ${1.06 * f}`
          } else if (seg.mark === 'strike') {
            d = `M ${-0.04 * w} ${0.66 * f} C ${0.35 * w} ${0.62 * f}, ${0.7 * w} ${0.69 * f}, ${1.04 * w} ${0.62 * f}`
          } else {
            const cx = w / 2
            const cy = 0.62 * f
            const rx = w / 2 + 0.32 * f
            const ry = 0.6 * f
            sw = f * 0.042
            d = [
              `M ${cx + 0.1 * rx} ${cy - ry}`,
              `C ${cx + 1.05 * rx} ${cy - 1.02 * ry}, ${cx + 1.03 * rx} ${cy + 0.92 * ry}, ${cx} ${cy + ry}`,
              `C ${cx - 1.06 * rx} ${cy + 1.06 * ry}, ${cx - 1.04 * rx} ${cy - 0.96 * ry}, ${cx - 0.05 * rx} ${cy - 1.05 * ry}`,
              `C ${cx + 0.3 * rx} ${cy - 1.1 * ry}, ${cx + 0.6 * rx} ${cy - 0.92 * ry}, ${cx + 0.78 * rx} ${cy - 0.72 * ry}`,
            ].join(' ')
          }
          deco = (
            <svg width={w} height={f * lineHeight} viewBox={`0 0 ${w} ${f * lineHeight}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
              <defs>
                <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={-0.1 * w} x2={1.1 * w} y1={0} y2={0}>
                  {BRAND_RAMP_STOPS.map((c, k) => (
                    <stop key={k} offset={`${[0, 45, 100][k]}%`} stopColor={c} />
                  ))}
                </linearGradient>
              </defs>
              <path d={d} pathLength={1} fill="none" stroke={seg.color ?? `url(#${gid})`} strokeWidth={sw} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, p)} />
            </svg>
          )
        }
        return (
          <span key={si} style={{ position: 'relative', display: 'inline-block', isolation: 'isolate', whiteSpace: 'pre' }}>
            {deco}
            {renderWords(seg.text)}
          </span>
        )
      })}
    </div>
  )
}
