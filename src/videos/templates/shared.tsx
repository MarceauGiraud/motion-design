/**
 * Briques partagées des templates : schémas zod réutilisables, fond de scène,
 * carton de fin, helpers de durée. Tout ce qui est éditable dans le Studio
 * passe par ces schémas.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { z } from 'zod'
import { zTextarea } from '@remotion/zod-types'

import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../../motion/tokens'
import { MeshGradient, PaperBackground } from '../../motion/backgrounds'
import { BRAND_RAMP_ON_DARK, EndCard } from '../../motion/brand'
import { brandTransition, TRANSITION_NAMES, transitionDuration, type TransitionName } from '../../motion/transitions'

// ---------------------------------------------------------------------------
// Schémas
// ---------------------------------------------------------------------------

/** Scènes de la plateforme (PlatformScreen). */
export const zScene = z.enum(['companies', 'inbox', 'contact', 'pipeline'])
export type SceneKey = z.infer<typeof zScene>

/** Thème clair (papier) ou sombre (nuit + mesh). */
export const zTheme = z.enum(['light', 'dark'])
export type Theme = z.infer<typeof zTheme>

/** Rectangle en coordonnées plateforme 1440x900 (voir Camera-PlatformGrid). */
export const zRect = z.object({
  x: z.number().min(0).max(1440),
  y: z.number().min(0).max(900),
  w: z.number().min(1).max(1440),
  h: z.number().min(1).max(900),
})

/** Nom d'une transition du module transitions. */
export const zTransition = z.enum(TRANSITION_NAMES as [TransitionName, ...TransitionName[]])

/** Scripted assistant actions (see src/kit/Platform.tsx). */
export const zAssistantAction = z.enum(['enrich', 'summarize'])

/** Texte multi-ligne (\n = retour à la ligne) avec un vrai textarea dans le Studio. */
export const zMultiline = () => zTextarea()

/** Carton de fin commun à tous les templates. */
export const zEnd = z.object({
  tagline: z.string(),
  highlight: z.array(z.string()),
  url: z.string(),
  /** Vide = pas de bouton. */
  cta: z.string(),
})
export type EndProps = z.infer<typeof zEnd>

export const DEFAULT_END: EndProps = {
  tagline: 'Le CRM qui travaille pour vous.',
  highlight: ['travaille'],
  url: 'acme.com',
  cta: 'Essayer gratuitement',
}

// ---------------------------------------------------------------------------
// Scènes
// ---------------------------------------------------------------------------

/** Fond de marque selon le thème : papier teinté (clair) ou mesh nuit (sombre). */
export const Backdrop = ({ theme, children, intensity }: { theme: Theme; children?: ReactNode; intensity?: number }) =>
  theme === 'dark' ? (
    <MeshGradient theme="dark" intensity={intensity ?? 0.42}>
      {children}
    </MeshGradient>
  ) : (
    <PaperBackground tint={intensity ?? 0.8}>{children}</PaperBackground>
  )

/** Carton de fin (EndCard) branché sur le schéma zEnd. */
export const EndScene = ({ end, theme, lockup = 'horizontal' }: { end: EndProps; theme: Theme; lockup?: 'symbol' | 'horizontal' }) => (
  <EndCard
    theme={theme}
    background="mesh"
    tagline={end.tagline}
    highlight={end.highlight}
    url={end.url}
    cta={end.cta.trim() === '' ? null : end.cta}
    logoVariant={theme === 'dark' ? 'converge' : 'morph'}
    logoLockup={lockup}
  />
)

/** Couleurs de texte selon le thème (le blanc n'est pas dans BRAND : palette locale). */
export const TEMPLATE_PALETTE = {
  white: '#FFFFFF',
  whiteMuted: 'rgba(255,255,255,0.72)',
  pillLight: 'rgba(255,255,255,0.78)',
  pillDark: 'rgba(255,255,255,0.08)',
} as const

/** Dégradé des mots mis en avant : le ramp éclairci sur fond nuit (l'encre y disparaît). */
export const rampFor = (theme: Theme) => (theme === 'dark' ? BRAND_RAMP_ON_DARK : BRAND_RAMP)

export const textColor = (theme: Theme) => (theme === 'dark' ? TEMPLATE_PALETTE.white : BRAND.text)
export const mutedColor = (theme: Theme) => (theme === 'dark' ? TEMPLATE_PALETTE.whiteMuted : BRAND.textMuted)

/** Petite pastille "eyebrow" au-dessus d'un titre. */
export const Eyebrow = ({ children, theme, style }: { children: ReactNode; theme: Theme; style?: CSSProperties }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 20px 10px 14px',
      borderRadius: 999,
      fontFamily: FONT_BODY,
      fontWeight: 600,
      fontSize: 22,
      letterSpacing: '0.01em',
      color: textColor(theme),
      background: theme === 'dark' ? TEMPLATE_PALETTE.pillDark : TEMPLATE_PALETTE.pillLight,
      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.14)' : BRAND.border}`,
      boxShadow: theme === 'dark' ? 'none' : '0 1px 2px rgba(16,15,14,0.05), 0 10px 30px -14px rgba(16,15,14,0.25)',
      ...style,
    }}
  >
    <span style={{ width: 10, height: 10, borderRadius: 99, backgroundImage: `linear-gradient(135deg, ${BRAND.rose}, ${BRAND.violet})` }} />
    {children}
  </div>
)

/** Sous-titre en corps Inter. */
export const Sub = ({ children, theme, size = 34, style }: { children: ReactNode; theme: Theme; size?: number; style?: CSSProperties }) => (
  <div
    style={{
      fontFamily: FONT_BODY,
      fontSize: size,
      lineHeight: 1.35,
      fontWeight: 400,
      color: mutedColor(theme),
      textAlign: 'center',
      letterSpacing: '-0.01em',
      ...style,
    }}
  >
    {children}
  </div>
)

export const Fill = ({ children, style }: { children?: ReactNode; style?: CSSProperties }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...style }}>{children}</AbsoluteFill>
)

export { FONT_DISPLAY }

// ---------------------------------------------------------------------------
// Durées
// ---------------------------------------------------------------------------

/** Durée totale d'une TransitionSeries : somme des scènes moins les chevauchements. */
export const seriesDuration = (scenes: number[], transitions: TransitionName[]) =>
  scenes.reduce((a, s) => a + s, 0) - transitions.reduce((a, t) => a + transitionDuration(t), 0)

/**
 * brandTransition pour un nom choisi dans le Studio (union) : les options qui
 * ne concernent pas la présentation choisie sont simplement ignorées.
 */
export const makeTransition = (name: TransitionName, options: Record<string, unknown> = {}) =>
  brandTransition(name, options as never)
