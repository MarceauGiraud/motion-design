/**
 * <EndCard> : écran de fin avec appel à l'action.
 * Symbole révélé -> accroche mot par mot -> URL -> bouton (pop + reflet qui
 * repasse en boucle). Fond intégré au choix (mesh clair par défaut).
 */
import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { springPreset } from '../physics/springs'
import { MeshGradient } from '../backgrounds/MeshGradient'
import { PaperBackground } from '../backgrounds/PaperBackground'
import { LogoReveal, type LogoRevealVariant } from './LogoReveal'
import { RevealWords } from './RevealWords'
import type { LogoTheme } from './Logo'

/** Rampe éclaircie pour les mots surlignés sur fond nuit (l'encre #0001F8 y disparaît). */
export const BRAND_RAMP_ON_DARK = 'linear-gradient(100deg, #FF3D6E 0%, #B340E0 50%, #5B6BFF 100%)'

export interface EndCardProps {
  /** Accroche principale. */
  tagline?: string
  /** Mots de l'accroche peints au dégradé de marque. */
  highlight?: string[]
  /** URL affichée sous l'accroche. */
  url?: string
  /** Libellé du bouton (null = pas de bouton). */
  cta?: string | null
  theme?: LogoTheme
  /** Fond intégré. 'none' = transparent. */
  background?: 'mesh' | 'paper' | 'none'
  /** Révélation du logo. */
  logoVariant?: LogoRevealVariant
  /** 'symbol' (défaut) ou 'horizontal' (symbole + Acme). */
  logoLockup?: 'symbol' | 'horizontal'
  /** Décalage global (frames). */
  delay?: number
  /** Le reflet du bouton repasse toutes les N frames. */
  shineEvery?: number
  style?: CSSProperties
}

export const EndCard: React.FC<EndCardProps> = ({
  tagline = 'Le CRM qui travaille pour vous.',
  highlight = ['travaille'],
  url = 'acme.com',
  cta = 'Essayer gratuitement',
  theme = 'light',
  background = 'mesh',
  logoVariant = 'morph',
  logoLockup = 'symbol',
  delay = 0,
  shineEvery = 75,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const u = Math.min(width, height) / 1080
  const f = frame - delay
  const dark = theme === 'dark'
  const ink = dark ? '#FFFFFF' : BRAND.text
  const muted = dark ? 'rgba(255,255,255,0.62)' : BRAND.textMuted
  const portrait = height > width

  const tagAt = 26
  const urlIn = springPreset({ frame: f, fps, preset: 'smooth', delay: tagAt + 14 })
  const btnIn = springPreset({ frame: f, fps, preset: 'snappy', delay: tagAt + 20 })
  const btnPrev = springPreset({ frame: f - 1, fps, preset: 'snappy', delay: tagAt + 20 })
  const btnBlur = Math.min(6, Math.abs(btnIn - btnPrev) * 30)
  // Reflet : linéaire et bouclé (pas un mouvement physique, un balayage de lumière).
  const shineStart = tagAt + 34
  const shineT = f < shineStart ? -1 : ((f - shineStart) % shineEvery) / 24
  const shineX = interpolate(shineT, [0, 1], [-60, 160], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const content = (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 * u, padding: `0 ${80 * u}px`, textAlign: 'center' }}>
        <LogoReveal
          inline
          variant={logoVariant}
          lockup={logoLockup}
          theme={theme}
          delay={delay}
          height={(logoLockup === 'horizontal' ? 110 : 170) * u}
          wordmarkAt={logoLockup === 'horizontal' ? 20 : undefined}
        />
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: (portrait ? 96 : 92) * u,
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
            color: ink,
            maxWidth: (portrait ? 900 : 1400) * u,
          }}
        >
          <RevealWords
            text={tagline}
            delay={delay + tagAt}
            stagger={3}
            highlight={highlight}
            highlightStyle={{ backgroundImage: dark ? BRAND_RAMP_ON_DARK : BRAND_RAMP, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: portrait ? 'column' : 'row',
            alignItems: 'center',
            gap: 28 * u,
            marginTop: 6 * u,
          }}
        >
          {cta && (
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 999,
                padding: `${22 * u}px ${42 * u}px`,
                background: dark ? '#FFFFFF' : BRAND.text,
                color: dark ? BRAND.text : '#FFFFFF',
                fontFamily: FONT_BODY,
                fontWeight: 600,
                fontSize: 30 * u,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: 14 * u,
                transform: `scale(${0.6 + 0.4 * btnIn})`,
                opacity: Math.min(1, btnIn * 1.5),
                filter: btnBlur > 0.2 ? `blur(${btnBlur}px)` : undefined,
                boxShadow: dark
                  ? `0 ${18 * u}px ${50 * u}px rgba(128, 2, 159, 0.45)`
                  : `0 ${1 * u}px ${2 * u}px rgba(16,15,14,0.2), 0 ${18 * u}px ${40 * u}px rgba(16,15,14,0.18)`,
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>{cta}</span>
              <span style={{ position: 'relative', zIndex: 1, transform: `translateX(${(1 - btnIn) * -10 * u}px)` }}>→</span>
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${shineX}%`,
                  width: '38%',
                  transform: 'skewX(-20deg)',
                  background: `linear-gradient(90deg, transparent, ${dark ? 'rgba(128,2,159,0.25)' : 'rgba(255,255,255,0.35)'}, transparent)`,
                }}
              />
            </div>
          )}
          <div
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 500,
              fontSize: 30 * u,
              color: muted,
              letterSpacing: '-0.01em',
              opacity: urlIn,
              transform: `translateY(${(1 - urlIn) * 16 * u}px)`,
            }}
          >
            {url}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )

  if (background === 'none') return content
  if (background === 'paper') return <PaperBackground tint={1}>{content}</PaperBackground>
  return (
    <MeshGradient theme={theme} intensity={dark ? 0.32 : 0.3} enterAt={delay - 20}>
      {content}
    </MeshGradient>
  )
}
