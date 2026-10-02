/**
 * <GridBackground> : grille technique façon Linear / Vercel.
 *  - 'perspective' : sol en perspective qui défile vers la caméra, fondu à l'horizon.
 *  - 'flat'        : grille à plat, masque radial, lueur qui "allume" les lignes.
 * Le défilement et la lueur bouclent parfaitement sur `loopFrames`.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { loopAngle, loopNoise, withAlpha, type BackgroundTheme } from './loop'

export interface GridBackgroundProps {
  variant?: 'perspective' | 'flat'
  theme?: BackgroundTheme
  /** Taille d'une cellule en px (à 1080p). */
  cell?: number
  /** Couleur des lignes. Par défaut : encre à 9 % (clair) ou blanc à 10 % (sombre). */
  lineColor?: string
  /** Couleur de la lueur mobile. */
  glowColor?: string
  /** Fond. */
  base?: string
  /** Position de l'horizon (0 = haut, 1 = bas) pour 'perspective'. */
  horizon?: number
  /** Inclinaison du sol en degrés (perspective). */
  tilt?: number
  /** Durée d'une boucle parfaite (défilement + lueur). */
  loopFrames?: number
  /** Nombre de cellules parcourues par boucle (entier = boucle parfaite). */
  cellsPerLoop?: number
  /** Affiche la lueur mobile. */
  glow?: boolean
  children?: ReactNode
  style?: CSSProperties
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  variant = 'perspective',
  theme = 'light',
  cell = 72,
  lineColor,
  glowColor,
  base,
  horizon = 0.46,
  tilt = 72,
  loopFrames = 300,
  cellsPerLoop = 2,
  glow = true,
  children,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const unit = Math.min(width, height) / 1080
  const c = cell * unit
  const bg = base ?? (theme === 'light' ? BRAND.paper : BRAND.night)
  const line = lineColor ?? (theme === 'light' ? withAlpha(BRAND.text, 0.09) : 'rgba(255,255,255,0.1)')
  const glowC = glowColor ?? (theme === 'light' ? BRAND.violet : BRAND.blue)
  const lw = Math.max(1, unit * 1.2)
  const gridImage = (color: string) =>
    `linear-gradient(to right, ${color} ${lw}px, transparent ${lw}px), linear-gradient(to bottom, ${color} ${lw}px, transparent ${lw}px)`

  const phase = (((frame % loopFrames) + loopFrames) % loopFrames) / loopFrames
  const a = loopAngle(frame, loopFrames)

  if (variant === 'flat') {
    // Lueur en Lissajous (1:2) : boucle parfaite, trajectoire organique.
    const gx = 0.5 + Math.sin(a) * 0.3 + loopNoise('grid-gx', 0, 0, frame, loopFrames, 0.4) * 0.05
    const gy = 0.5 + Math.sin(a * 2) * 0.18 + loopNoise('grid-gy', 0, 0, frame, loopFrames, 0.4) * 0.05
    const offset = phase * c * cellsPerLoop * 0.5
    const r = 0.28 * Math.max(width, height)
    return (
      <AbsoluteFill style={{ background: bg, overflow: 'hidden', ...style }}>
        <AbsoluteFill
          style={{
            backgroundImage: gridImage(line),
            backgroundSize: `${c}px ${c}px`,
            backgroundPosition: `${width / 2 + offset}px ${height / 2 + offset}px`,
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
          }}
        />
        {glow && (
          <>
            {/* Lignes "allumées" sous la lueur. */}
            <AbsoluteFill
              style={{
                backgroundImage: gridImage(withAlpha(glowC, theme === 'light' ? 0.55 : 0.9)),
                backgroundSize: `${c}px ${c}px`,
                backgroundPosition: `${width / 2 + offset}px ${height / 2 + offset}px`,
                maskImage: `radial-gradient(circle ${r}px at ${gx * 100}% ${gy * 100}%, black 0%, transparent 100%)`,
                WebkitMaskImage: `radial-gradient(circle ${r}px at ${gx * 100}% ${gy * 100}%, black 0%, transparent 100%)`,
              }}
            />
            <AbsoluteFill
              style={{
                background: `radial-gradient(circle ${r * 0.9}px at ${gx * 100}% ${gy * 100}%, ${withAlpha(glowC, theme === 'light' ? 0.1 : 0.22)} 0%, transparent 100%)`,
              }}
            />
          </>
        )}
        {children}
      </AbsoluteFill>
    )
  }

  // --- perspective ---
  const hy = horizon * height
  const scroll = phase * c * cellsPerLoop
  const glowX = 0.5 + Math.sin(a) * 0.28
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden', ...style }}>
      {/* Ciel : léger dégradé vers l'horizon. */}
      <AbsoluteFill
        style={{
          background:
            theme === 'light'
              ? `linear-gradient(to bottom, ${BRAND.paper} 0%, ${withAlpha(BRAND.wing, 1)} ${horizon * 100}%, ${BRAND.paper} 100%)`
              : `linear-gradient(to bottom, ${BRAND.night} 0%, ${withAlpha(BRAND.ink, 0.12)} ${horizon * 100}%, ${BRAND.night} 100%)`,
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: hy, bottom: 0, perspective: 520 * unit, perspectiveOrigin: '50% 0%' }}>
        <div
          style={{
            position: 'absolute',
            left: -width,
            width: width * 3,
            top: 0,
            height: height * 2.4,
            transformOrigin: '50% 0%',
            transform: `rotateX(${tilt}deg)`,
            backgroundImage: gridImage(line),
            backgroundSize: `${c}px ${c}px`,
            backgroundPosition: `${width * 1.5}px ${scroll}px`,
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
          }}
        >
          {glow && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: gridImage(withAlpha(glowC, theme === 'light' ? 0.6 : 0.95)),
                backgroundSize: `${c}px ${c}px`,
                backgroundPosition: `${width * 1.5}px ${scroll}px`,
                maskImage: `radial-gradient(ellipse ${width * 0.35}px ${height * 0.5}px at ${(1 + glowX) * 33.33}% 18%, black 0%, transparent 100%)`,
                WebkitMaskImage: `radial-gradient(ellipse ${width * 0.35}px ${height * 0.5}px at ${(1 + glowX) * 33.33}% 18%, black 0%, transparent 100%)`,
              }}
            />
          )}
        </div>
      </div>
      {glow && (
        // Halo d'horizon.
        <div
          style={{
            position: 'absolute',
            left: glowX * width - width * 0.4,
            top: hy - height * 0.18,
            width: width * 0.8,
            height: height * 0.36,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 50% 50%, ${withAlpha(glowC, theme === 'light' ? 0.16 : 0.35)} 0%, transparent 70%)`,
            filter: `blur(${30 * unit}px)`,
          }}
        />
      )}
      {children}
    </AbsoluteFill>
  )
}
