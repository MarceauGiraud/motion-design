/**
 * <MeshGradient> : dégradé "mesh" lent, fait de taches de couleur de marque
 * pilotées par du bruit bouclé et fondues par un flou. Variantes claire
 * (papier, défaut du website) et sombre (nuit).
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND } from '../tokens'
import { springPreset } from '../physics/springs'
import { Grain } from './Grain'
import { loopNoise, withAlpha, type BackgroundTheme } from './loop'

/** Palettes par défaut des taches, par thème. */
const MESH_PALETTES: Record<BackgroundTheme, string[]> = {
  light: [BRAND.rose, BRAND.violet, BRAND.ink, BRAND.blueSoft, BRAND.orange, BRAND.blue],
  dark: [BRAND.ink, BRAND.violet, BRAND.rose, BRAND.blueDeep, BRAND.violet, BRAND.ink],
}

export interface MeshGradientProps {
  /** 'light' = papier + taches pastel ; 'dark' = nuit + taches lumineuses. */
  theme?: BackgroundTheme
  /** Couleurs des taches (cyclées). Par défaut la palette de marque du thème. */
  colors?: string[]
  /** Couleur du fond sous les taches. */
  base?: string
  /** Nombre de taches. */
  blobs?: number
  /** Opacité des taches (0–1). Défaut : 0.42 clair, 0.75 sombre. */
  intensity?: number
  /** Durée d'une boucle parfaite, en frames. */
  loopFrames?: number
  /** Amplitude du mouvement (fraction de la largeur). */
  drift?: number
  /** Flou global en px (à 1080p ; mis à l'échelle). */
  blur?: number
  /** Opacité du grain intégré (0 = aucun). */
  grain?: number
  /** Graine : change la disposition des taches. */
  seed?: string
  /** Fondu d'entrée par ressort 'gentle' à partir de cette frame. undefined = déjà là. */
  enterAt?: number
  children?: ReactNode
  style?: CSSProperties
}

export const MeshGradient: React.FC<MeshGradientProps> = ({
  theme = 'light',
  colors,
  base,
  blobs = 6,
  intensity,
  loopFrames = 600,
  drift = 0.22,
  blur = 70,
  grain = 0.05,
  seed = 'mesh',
  enterAt,
  children,
  style,
}) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const unit = Math.min(width, height) / 1080
  const palette = colors ?? MESH_PALETTES[theme]
  const alpha = intensity ?? (theme === 'light' ? 0.42 : 0.75)
  const bg = base ?? (theme === 'light' ? BRAND.paper : BRAND.night)
  const enter = enterAt === undefined ? 1 : springPreset({ frame, fps, preset: 'gentle', delay: enterAt })

  const items = Array.from({ length: blobs }, (_, i) => {
    const color = palette[i % palette.length]
    // Ancres réparties sur une ellipse autour du centre, puis bruit bouclé.
    const a0 = (i / blobs) * Math.PI * 2 + random(`${seed}-a-${i}`) * 0.8
    const ax = 0.5 + Math.cos(a0) * 0.32
    const ay = 0.5 + Math.sin(a0) * 0.3
    const nx = loopNoise(`${seed}-x`, i * 1.7, 0, frame, loopFrames, 0.7)
    const ny = loopNoise(`${seed}-y`, i * 1.7, 3, frame, loopFrames, 0.7)
    const ns = loopNoise(`${seed}-s`, i * 1.7, 6, frame, loopFrames, 0.5)
    const size = (0.55 + random(`${seed}-r-${i}`) * 0.35) * Math.max(width, height) * (1 + ns * 0.18)
    const x = (ax + nx * drift) * width
    const y = (ay + ny * drift * (height / width) * 1.4) * height
    return { color, x, y, size }
  })

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden', ...style }}>
      <AbsoluteFill style={{ filter: `blur(${blur * unit}px) saturate(${theme === 'light' ? 1.1 : 1.25})`, opacity: enter, transform: `scale(${1.08 - 0.08 * enter})` }}>
        {items.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x - b.size / 2,
              top: b.y - b.size / 2,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 50% 50%, ${withAlpha(b.color, alpha)} 0%, ${withAlpha(b.color, alpha * 0.45)} 35%, ${withAlpha(b.color, 0)} 68%)`,
              mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
            }}
          />
        ))}
      </AbsoluteFill>
      {theme === 'light' && (
        // Voile papier : garde les taches dans la retenue du website.
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${withAlpha(BRAND.paper, 0.35)} 0%, ${withAlpha(BRAND.paper, 0)} 70%)` }} />
      )}
      {grain > 0 && <Grain opacity={grain} blendMode={theme === 'light' ? 'multiply' : 'overlay'} seed={`${seed}-grain`} />}
      {children}
    </AbsoluteFill>
  )
}
