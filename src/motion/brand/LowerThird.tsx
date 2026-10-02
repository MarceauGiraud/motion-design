/**
 * <LowerThird> : bandeau nom / fonction en bas d'écran.
 * La carte s'ouvre en largeur (ressort 'morph'), la barre de marque pousse,
 * l'avatar pop (bouncy), les textes montent d'un masque. Sortie symétrique
 * à `exitAt`.
 */
import type { CSSProperties } from 'react'
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'
import { springPreset } from '../physics/springs'
import type { LogoTheme } from './Logo'

export interface LowerThirdProps {
  /** Ligne principale (nom). */
  title?: string
  /** Ligne secondaire (fonction, entreprise). */
  subtitle?: string
  /** Chemin d'image dans public/ (ex. 'images/people/ma.jpg'). null = pas d'avatar. */
  avatar?: string | null
  /** Pastille à droite du nom (ex. 'Client'). */
  badge?: string | null
  theme?: LogoTheme
  /** Coin d'ancrage. */
  position?: 'left' | 'right' | 'center'
  /** Frame d'entrée. */
  delay?: number
  /** Frame (absolue) de sortie. undefined = reste. */
  exitAt?: number
  style?: CSSProperties
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  title = 'Camille Laurent',
  subtitle = 'Head of Sales, Novaria',
  avatar = 'images/people/cb.jpg',
  badge = null,
  theme = 'light',
  position = 'left',
  delay = 0,
  exitAt,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const u = Math.min(width, height) / 1080
  const dark = theme === 'dark'
  const out = exitAt === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: exitAt, durationInFrames: 20 })

  const card = springPreset({ frame, fps, preset: 'morph', delay }) * (1 - out)
  const cardPrev = springPreset({ frame: frame - 1, fps, preset: 'morph', delay })
  const bar = springPreset({ frame, fps, preset: 'snappy', delay: delay + 4 }) * (1 - out)
  const av = springPreset({ frame, fps, preset: 'bouncy', delay: delay + 6 }) * (1 - out)
  const t1 = springPreset({ frame, fps, preset: 'morph', delay: delay + 8 })
  const t2 = springPreset({ frame, fps, preset: 'morph', delay: delay + 12 })
  const bd = springPreset({ frame, fps, preset: 'snappy', delay: delay + 18 }) * (1 - out)
  const textOut = out

  const blurX = Math.min(8, Math.abs(card - cardPrev) * 40)
  const hidden = Math.max(0, (1 - card) * 100)
  const r = 26 * u
  const clip =
    position === 'right'
      ? `inset(0 0 0 ${hidden}% round ${r}px)`
      : position === 'center'
        ? `inset(0 ${hidden / 2}% 0 ${hidden / 2}% round ${r}px)`
        : `inset(0 ${hidden}% 0 0 round ${r}px)`
  const margin = 96 * u
  const avatarSize = 84 * u

  const anchor: CSSProperties =
    position === 'right'
      ? { right: margin, bottom: margin * 0.9 }
      : position === 'center'
        ? { left: '50%', bottom: margin * 0.9, transform: 'translateX(-50%)' }
        : { left: margin, bottom: margin * 0.9 }

  return (
    <div style={{ position: 'absolute', ...anchor, ...style }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 22 * u,
          padding: `${18 * u}px ${34 * u}px ${18 * u}px ${avatar ? 18 * u : 34 * u}px`,
          borderRadius: 26 * u,
          background: dark ? 'rgba(20, 18, 34, 0.72)' : 'rgba(255, 255, 255, 0.86)',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : BRAND.border}`,
          boxShadow: dark
            ? `0 ${20 * u}px ${60 * u}px rgba(0,0,0,0.45)`
            : `0 ${1 * u}px ${2 * u}px rgba(16,15,14,0.06), 0 ${24 * u}px ${60 * u}px rgba(16,15,14,0.12)`,
          backdropFilter: 'blur(18px)',
          // Ouverture en largeur par clip (pas de scaleX : l'avatar ne se déforme pas).
          clipPath: clip,
          transform: `translateY(${(1 - card) * 24 * u}px)`,
          opacity: Math.min(1, card * 2),
          filter: blurX > 0.2 ? `blur(${blurX}px)` : undefined,
          overflow: 'hidden',
        }}
      >
        {/* Barre de marque. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '18%',
            bottom: '18%',
            width: 5 * u,
            borderRadius: 4 * u,
            background: BRAND_RAMP,
            transform: `scaleY(${bar})`,
          }}
        />
        {avatar && (
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              marginLeft: 8 * u,
              transform: `scale(${av})`,
              boxShadow: `0 0 0 ${3 * u}px ${dark ? 'rgba(255,255,255,0.14)' : '#FFFFFF'}, 0 ${6 * u}px ${16 * u}px rgba(16,15,14,0.18)`,
            }}
          >
            <Img src={staticFile(avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * u }}>
          <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14 * u, paddingBottom: 2 * u }}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 500,
                fontSize: 42 * u,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: dark ? '#FFFFFF' : BRAND.text,
                transform: `translateY(${(1 - t1) * 110 + textOut * 110}%)`,
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </div>
            {badge && (
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontWeight: 600,
                  fontSize: 18 * u,
                  padding: `${5 * u}px ${12 * u}px`,
                  borderRadius: 999,
                  color: BRAND.blueDeep,
                  background: BRAND.blueSoft,
                  transform: `scale(${bd})`,
                  whiteSpace: 'nowrap',
                }}
              >
                {badge}
              </div>
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 500,
                fontSize: 24 * u,
                lineHeight: 1.25,
                color: dark ? 'rgba(255,255,255,0.65)' : BRAND.textMuted,
                transform: `translateY(${(1 - t2) * 110 + textOut * 110}%)`,
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
