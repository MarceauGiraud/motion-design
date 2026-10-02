/**
 * <LiquidButton> : CTA en pilule qui se remplit d'un liquide "gooey" (filtre
 * SVG flou + seuil alpha). Le liquide jaillit du point de clic, s'étale des
 * deux côtés avec un front ondulant (bruit), projette quelques gouttes qui
 * sont réabsorbées ; le bouton s'écrase et rebondit (vitesse d'un ressort jelly).
 */
import { useId, type CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { noise2D } from '@remotion/noise'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, BRAND_RAMP_STOPS, FONT_DISPLAY } from '../tokens'
import { springPreset, type SpringPresetName } from '../physics/springs'
import { safeId } from './core'

export interface LiquidButtonProps {
  /** Libellé. */
  label?: string
  /** Largeur (px). Défaut 560. */
  width?: number
  /** Hauteur (px). Défaut 128. */
  height?: number
  /** Frame du "clic" qui déclenche le remplissage. Défaut 24. */
  fillAt?: number
  /** Frame de vidange (optionnel). */
  drainAt?: number
  /** Point de départ du liquide, fraction de la largeur (0..1). Défaut 0.22. */
  origin?: number
  /** Stops du dégradé liquide. Défaut : rampe de marque. */
  colors?: readonly string[]
  /** Couleur du texte avant remplissage. */
  textColor?: string
  /** Couleur du texte sur le liquide. */
  fillTextColor?: string
  /** Fond de la pilule vide. */
  background?: string
  /** Affiche une flèche après le libellé. Défaut true. */
  arrow?: boolean
  /** Preset de l'étalement. Défaut 'heavy'. */
  preset?: SpringPresetName
  style?: CSSProperties
}

export function LiquidButton({
  label = 'Essayer Acme',
  width = 560,
  height = 128,
  fillAt = 24,
  drainAt,
  origin = 0.22,
  colors = BRAND_RAMP_STOPS,
  textColor = BRAND.text,
  fillTextColor = '#FFFFFF',
  background = '#FFFFFF',
  arrow = true,
  preset = 'heavy',
  style,
}: LiquidButtonProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const id = safeId(useId())
  const h = height
  const w = width
  const cx = w * origin

  const drain = drainAt === undefined ? 0 : springPreset({ frame, fps, preset: 'smooth', delay: drainAt })
  const spread = springPreset({ frame, fps, preset, delay: fillAt }) * (1 - drain)
  const splash = springPreset({ frame, fps, preset: 'snappy', delay: fillAt }) * (1 - drain)
  const started = frame >= fillAt

  // Écrasement : vitesse d'un ressort jelly (démarre à 0, pas de saut).
  const jelly = (f: number) => springPreset({ frame: f, fps, preset: 'jelly', delay: fillAt - 3 })
  const v = jelly(frame) - jelly(frame - 1)
  const sx = 1 + v * 0.35
  const sy = 1 - v * 0.55

  const L = cx - (cx + h * 0.6) * spread
  const R = cx + (w - cx + h * 0.6) * spread
  const t = frame * 0.06
  const front = (side: number, i: number) => noise2D(`${id}-${side}`, i * 0.9, t) * h * 0.16

  // Gouttes projetées depuis le front droit, réabsorbées.
  const drops = [0, 1, 2].map((i) => {
    const d = springPreset({ frame, fps, preset: 'bouncy', delay: fillAt + 4 + i * 5 })
    const back = springPreset({ frame, fps, preset: 'smooth', delay: fillAt + 16 + i * 5 })
    const out = (d - back) * h * (0.55 + i * 0.12)
    const y = h * (0.25 + i * 0.25)
    return { x: R + out - h * 0.1, y, r: h * (0.13 - i * 0.02) * (d - back * 0.6) }
  })

  const nudge = springPreset({ frame, fps, preset: 'snappy', delay: fillAt + 10 }) * (1 - drain)
  const fillWidth = Math.max(0, Math.min(w, R) - Math.max(0, L))
  const coverage = fillWidth / w
  const goo = h * 0.09

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transform: `scale(${sx}, ${sy})`,
        borderRadius: h / 2,
        background,
        boxShadow: [
          'inset 0 0 0 1.5px rgba(16,15,14,0.10)',
          '0 1px 2px rgba(16,15,14,0.06)',
          `0 ${h * 0.25}px ${h * 0.6}px -${h * 0.25}px rgba(128,2,159,${(0.15 + 0.45 * coverage).toFixed(3)})`,
        ].join(', '),
        ...style,
      }}
    >
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={w} y2={h * 0.5}>
            {colors.map((c, i) => (
              <stop key={i} offset={i / Math.max(1, colors.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
          <filter id={`${id}-goo`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={goo} result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <rect x={0} y={0} width={w} height={h} rx={h / 2} />
          </clipPath>
        </defs>
        {started && (
          <g clipPath={`url(#${id}-clip)`}>
            <g filter={`url(#${id}-goo)`} fill={`url(#${id}-g)`}>
              {/* Goutte initiale au point de clic */}
              <circle cx={cx} cy={h / 2} r={h * 0.55 * splash} />
              {/* Corps */}
              {R - L > h * 0.4 && <rect x={L + h * 0.2} y={-h * 0.2} width={Math.max(0, R - L - h * 0.4)} height={h * 1.4} />}
              {/* Fronts ondulants */}
              {[0, 1, 2, 3].map((i) => (
                <circle key={`r${i}`} cx={R - h * 0.28 + front(1, i)} cy={(h * (i + 0.5)) / 4} r={h * 0.3 * Math.min(1, spread * 3)} />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <circle key={`l${i}`} cx={L + h * 0.28 - front(0, i)} cy={(h * (i + 0.5)) / 4} r={h * 0.3 * Math.min(1, spread * 3)} />
              ))}
              {drops.map((d, i) => (d.r > 0.5 ? <circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} /> : null))}
            </g>
          </g>
        )}
      </svg>
      <Label label={label} arrow={arrow} color={textColor} h={h} nudge={nudge} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${Math.max(0, w - R + h * 0.12)}px 0 ${Math.max(0, L + h * 0.12)}px)` }}>
        <Label label={label} arrow={arrow} color={fillTextColor} h={h} nudge={nudge} />
      </div>
    </div>
  )
}

function Label({ label, arrow, color, h, nudge }: { label: string; arrow: boolean; color: string; h: number; nudge: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: h * 0.14,
        fontFamily: FONT_DISPLAY,
        fontWeight: 500,
        fontSize: h * 0.3,
        letterSpacing: '-0.01em',
        color,
      }}
    >
      <span>{label}</span>
      {arrow && <ArrowRight size={h * 0.3} strokeWidth={2.2} color={color} style={{ transform: `translateX(${nudge * h * 0.08}px)` }} />}
    </div>
  )
}
