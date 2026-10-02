/**
 * Outils internes du module text : vitesse des ressorts, flou de mouvement,
 * mesure déterministe des glyphes (DOM + delayRender, jamais de frame fausse).
 */
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { continueRender, delayRender } from 'remotion'

import { springPreset, type SpringOptions } from '../physics/springs'

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Découpe en graphèmes (emoji / accents composés restent entiers). */
export const graphemes = (s: string): string[] => Array.from(s)

/** Ressort preset + sa vitesse par frame (value(f) - value(f-1)). */
export function springV(opts: SpringOptions): { value: number; velocity: number } {
  const value = springPreset(opts)
  const prev = springPreset({ ...opts, frame: opts.frame - 1 })
  return { value, velocity: value - prev }
}

/** Flou de mouvement (px) proportionnel à une vitesse en px/frame. */
export const motionBlur = (velocityPx: number, factor = 0.18, max = 10) => Math.min(max, Math.abs(velocityPx) * factor)

/** Couleur hex -> hex8 avec alpha (0..1). */
export const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(clamp(alpha) * 255)
    .toString(16)
    .padStart(2, '0')}`

/** Style commun "texte peint au dégradé". */
export const gradientFill = (background: string): CSSProperties => ({
  backgroundImage: background,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
})

// ---------------------------------------------------------------------------
// Mesure
// ---------------------------------------------------------------------------

export interface GlyphBox {
  char: string
  /** Position gauche (px) dans la ligne. */
  x: number
  /** Avance (px). */
  w: number
}

export interface TextLayout {
  text: string
  width: number
  height: number
  glyphs: GlyphBox[]
}

/** Style typographique qui influence la mesure. */
export interface MeasureStyle {
  fontFamily: string
  fontSize: number
  fontWeight?: number | string
  letterSpacing?: string | number
  fontFeatureSettings?: string
  lineHeight?: number
}

/**
 * Mesure la largeur et la position de chaque glyphe de `texts` avec le style
 * donné. Retourne `layouts: null` tant que la mesure n'est pas faite (le rendu
 * est bloqué par delayRender pendant ce temps) et un `measurer` à monter.
 * offsetLeft/offsetWidth ignorent les transforms : insensible au zoom du Studio.
 */
export function useTextLayouts(texts: readonly string[], style: MeasureStyle): { layouts: TextLayout[] | null; measurer: ReactNode } {
  const ref = useRef<HTMLDivElement>(null)
  const key = JSON.stringify([texts, style])
  const [state, setState] = useState<{ key: string; layouts: TextLayout[] } | null>(null)

  useLayoutEffect(() => {
    const handle = delayRender(`text-measure ${texts.join('|').slice(0, 40)}`)
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        continueRender(handle)
      }
    }
    const shorthand = `${style.fontWeight ?? 400} ${style.fontSize}px ${style.fontFamily}`
    const sample = texts.join('') || 'a'
    Promise.all([document.fonts.load(shorthand, sample).catch(() => []), document.fonts.ready])
      .then(() => {
        if (done || !ref.current) return finish()
        const rows = Array.from(ref.current.children) as HTMLElement[]
        const layouts = rows.map((row, i) => {
          const spans = Array.from(row.children) as HTMLElement[]
          return {
            text: texts[i],
            width: row.offsetWidth,
            height: row.offsetHeight,
            glyphs: spans.map((s) => ({ char: s.textContent ?? '', x: s.offsetLeft, w: s.offsetWidth })),
          }
        })
        setState({ key, layouts })
        finish()
      })
      .catch(finish)
    return finish
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const measurer = useMemo(
    () => (
      <div
        ref={ref}
        aria-hidden
        style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'pre' }}
      >
        {texts.map((t, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'inline-block',
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing,
              fontFeatureSettings: style.fontFeatureSettings,
              lineHeight: style.lineHeight ?? 1.2,
              whiteSpace: 'pre',
            }}
          >
            {graphemes(t).map((c, j) => (
              <span key={j} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  return { layouts: state?.key === key ? state.layouts : null, measurer }
}

// ---------------------------------------------------------------------------
// LCS : caractères partagés entre deux chaînes (pour le morph)
// ---------------------------------------------------------------------------

/** Paires [indexA, indexB] des caractères communs, dans l'ordre (plus longue sous-séquence). */
export function lcsPairs(a: string[], b: string[]): Array<[number, number]> {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] && a[i] !== ' ' ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const pairs: Array<[number, number]> = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j] && a[i] !== ' ' && dp[i][j] === dp[i + 1][j + 1] + 1) {
      pairs.push([i, j])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return pairs
}
