/**
 * Brand tokens of the studio. Every color of a video comes from here: no hex
 * invented inside a component. Replace these values with your own brand.
 */
export { FONT_BODY, FONT_DISPLAY } from '../studio/fonts'

export const BRAND = {
  rose: '#F43F5E',
  violet: '#8B5CF6',
  ink: '#3B82F6',
  blue: '#2563EB',
  blueDeep: '#1D4ED8',
  blueSoft: '#DBEAFE',
  orange: '#FB923C',
  /** Fond "papier" chaud des scènes claires. */
  paper: '#F4F2F0',
  /** Aile (sidebar/topbar) de la plateforme. */
  wing: '#FDFDFC',
  /** Encre du texte (--foreground du site, jamais #000). */
  text: '#100F0E',
  textMuted: '#64748B',
  night: '#07060F',
  border: '#E2DFDD',
} as const

/** The brand gradient, same as --brand-ramp in src/studio/styles.css. */
export const BRAND_RAMP = 'linear-gradient(100deg, #F43F5E 0%, #8B5CF6 45%, #3B82F6 100%)'
export const BRAND_RAMP_STOPS = [BRAND.rose, BRAND.violet, BRAND.ink] as const

/** Formats de sortie de l'usine. */
export const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 },
} as const

export const FPS = 30

export const ASSETS = {
  logo: 'brand/logo.svg',
  logoPng: 'brand/logo.svg',
  wordmark: 'brand/wordmark.svg',
} as const
