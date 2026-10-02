/**
 * <TitleCard> : carton de section. Sur-titre numéroté + trait au dégradé de
 * marque qui pousse, titre qui monte mot par mot (mots clés peints à la
 * rampe), sous-titre en fondu. Fond papier intégré (ou transparent).
 */
import type { CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { springPreset } from '../physics/springs'
import { MeshGradient } from '../backgrounds/MeshGradient'
import { PaperBackground } from '../backgrounds/PaperBackground'
import { RevealWords } from './RevealWords'
import { BRAND_RAMP_ON_DARK } from './EndCard'
import type { LogoTheme } from './Logo'

export interface TitleCardProps {
  /** Sur-titre (ex. '02 — Pipeline'). null = aucun. */
  eyebrow?: string | null
  title?: string
  /** Mots du titre peints au dégradé de marque. */
  highlight?: string[]
  subtitle?: string | null
  theme?: LogoTheme
  align?: 'center' | 'left'
  /** Fond intégré. */
  background?: 'paper' | 'mesh' | 'none'
  /** Taille du titre en px (à 1080p). */
  titleSize?: number
  delay?: number
  /** Frame (absolue) de sortie. */
  exitAt?: number
  style?: CSSProperties
}

export const TitleCard: React.FC<TitleCardProps> = ({
  eyebrow = '02 — Pipeline',
  title = 'Chaque deal, au bon moment.',
  highlight = ['deal,'],
  subtitle = 'L’IA relance, priorise et met à jour votre pipeline pendant que vous vendez.',
  theme = 'light',
  align = 'center',
  background = 'paper',
  titleSize = 124,
  delay = 0,
  exitAt,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const u = Math.min(width, height) / 1080
  const dark = theme === 'dark'
  const out = exitAt === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: exitAt, durationInFrames: 20 })

  const line = springPreset({ frame, fps, preset: 'snappy', delay }) * (1 - out)
  const eb = springPreset({ frame, fps, preset: 'smooth', delay: delay + 4 }) * (1 - out)
  const sub = springPreset({ frame, fps, preset: 'smooth', delay: delay + 22 }) * (1 - out)
  const ink = dark ? '#FFFFFF' : BRAND.text
  const muted = dark ? 'rgba(255,255,255,0.62)' : BRAND.textMuted
  const left = align === 'left'

  const content = (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: left ? 'flex-start' : 'center', padding: `0 ${140 * u}px`, ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: left ? 'flex-start' : 'center', gap: 30 * u, textAlign: left ? 'left' : 'center' }}>
        {eyebrow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 * u }}>
            <div style={{ width: 64 * u, height: 4 * u, borderRadius: 4 * u, background: BRAND_RAMP, transform: `scaleX(${line})`, transformOrigin: 'left center' }} />
            <div
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 600,
                fontSize: 24 * u,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: muted,
                opacity: eb,
                transform: `translateX(${(1 - eb) * -14 * u}px)`,
              }}
            >
              {eyebrow}
            </div>
          </div>
        )}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: titleSize * u,
            lineHeight: 1.0,
            letterSpacing: '-0.04em',
            color: ink,
            maxWidth: 1500 * u,
          }}
        >
          <RevealWords
            text={title}
            delay={delay + 6}
            stagger={3}
            highlight={highlight}
            exitAt={exitAt}
            highlightStyle={{ backgroundImage: dark ? BRAND_RAMP_ON_DARK : BRAND_RAMP, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
          />
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 400,
              fontSize: 32 * u,
              lineHeight: 1.4,
              color: muted,
              maxWidth: 1180 * u,
              opacity: sub,
              transform: `translateY(${(1 - sub) * 18 * u}px)`,
              filter: sub < 0.98 ? `blur(${(1 - sub) * 6}px)` : undefined,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  )

  if (background === 'none') return content
  if (background === 'mesh') return <MeshGradient theme={theme} intensity={dark ? 0.5 : 0.28}>{content}</MeshGradient>
  return (
    <PaperBackground tint={1} color={dark ? BRAND.night : BRAND.paper} vignette={dark ? 1 : 0.5} light={dark ? 0 : 0.7}>
      {content}
    </PaperBackground>
  )
}
