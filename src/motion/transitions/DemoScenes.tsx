/**
 * Scènes de démonstration pour le catalogue des transitions : volontairement
 * très contrastées (nuit / papier / dégradé / plateforme) pour que chaque
 * transition se lise clairement. Chacune respire un peu (dérive lente) pour
 * que la transition ne passe jamais sur une image figée.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { PlatformScreen, PlatformWindow, type PlatformSceneKey } from '../../kit/Platform'
import { springPreset } from '../physics/springs'
import { ASSETS, BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY } from '../tokens'

/** Dérive lente (zoom) commune à toutes les scènes de démo. */
function useDrift(amount = 0.04, frames = 150) {
  const frame = useCurrentFrame()
  return 1 + interpolate(frame, [0, frames], [0, amount], { extrapolateRight: 'clamp' })
}

function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const k = springPreset({ frame, fps, preset: 'smooth', delay })
  return (
    <div style={{ ...style, opacity: k, transform: `translateY(${(1 - k) * 40}px)`, filter: `blur(${(1 - k) * 8}px)` }}>{children}</div>
  )
}

const eyebrow: CSSProperties = {
  fontFamily: FONT_BODY,
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

/** Nuit, logo et grand titre. */
export function NightTitleScene({ title = 'Votre CRM, en mouvement.', kicker = 'Acme' }: { title?: string; kicker?: string }) {
  const s = useDrift()
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.night, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(60% 55% at 50% 110%, ${BRAND.violet}88 0%, transparent 70%), radial-gradient(40% 40% at 15% 0%, ${BRAND.ink}55 0%, transparent 70%)`,
          transform: `scale(${s})`,
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 36, transform: `scale(${s})` }}>
        <Rise>
          <Img src={staticFile(ASSETS.logo)} style={{ height: 120 }} />
        </Rise>
        <Rise delay={4} style={{ ...eyebrow, color: 'rgba(255,255,255,0.55)' }}>
          {kicker}
        </Rise>
        <Rise delay={8} style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 124, lineHeight: 1, letterSpacing: '-0.035em', color: '#fff' }}>
          {title}
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Fond papier + vraie fenêtre plateforme. */
export function PlatformDemoScene({ scene = 'companies', tone = 'paper' }: { scene?: PlatformSceneKey; tone?: 'paper' | 'night' | 'blue' }) {
  const s = useDrift(0.035)
  const bg = tone === 'paper' ? BRAND.paper : tone === 'night' ? BRAND.night : BRAND.blueSoft
  return (
    <AbsoluteFill style={{ backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {tone === 'night' ? (
        <AbsoluteFill style={{ backgroundImage: `radial-gradient(50% 50% at 50% 50%, ${BRAND.violet}55 0%, transparent 75%)` }} />
      ) : null}
      <div style={{ transform: `scale(${s})` }}>
        <PlatformWindow width={1500}>
          <PlatformScreen scene={scene} />
        </PlatformWindow>
      </div>
    </AbsoluteFill>
  )
}

/** Plein dégradé de marque, gros titre blanc. */
export function RampScene({ title = 'Chaque relation compte.', caption = 'Pipeline · Inbox · IA' }: { title?: string; caption?: string }) {
  const s = useDrift(0.05)
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: BRAND.violet }}>
      <AbsoluteFill style={{ backgroundImage: BRAND_RAMP, transform: `scale(${1.2 * s}) rotate(${interpolate(frame, [0, 150], [-4, 4])}deg)` }} />
      <AbsoluteFill style={{ alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0 140px 150px' }}>
        <Rise style={{ ...eyebrow, color: 'rgba(255,255,255,0.75)', marginBottom: 28 }}>{caption}</Rise>
        <Rise delay={5} style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 168, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#fff', maxWidth: 1400 }}>
          {title}
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Papier clair, gros chiffre en dégradé. */
export function StatScene({ value = '+38 %', label = 'de deals conclus au premier trimestre' }: { value?: string; label?: string }) {
  const s = useDrift(0.03)
  return (
    <AbsoluteFill style={{ backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${BRAND.border} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.border} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          opacity: 0.6,
          transform: `scale(${s})`,
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 50%, #000 0%, transparent 100%)',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${s})` }}>
        <Rise
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: 300,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            backgroundImage: BRAND_RAMP,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            paddingBottom: 12,
          }}
        >
          {value}
        </Rise>
        <Rise delay={6} style={{ fontFamily: FONT_BODY, fontSize: 40, fontWeight: 500, color: BRAND.textMuted, marginTop: 12 }}>
          {label}
        </Rise>
      </div>
    </AbsoluteFill>
  )
}

const PEOPLE = ['ab', 'ac', 'af', 'cb', 'em', 'hl', 'hv', 'jr', 'le', 'lv', 'ma', 'ns', 'pm', 'sk', 'sn', 'sr', 'st', 'ta']

/** Mur de visages : l'équipe / les clients. */
export function PeopleScene({ title = 'Toute votre équipe, alignée.' }: { title?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = useDrift(0.04)
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.blueSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 70 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 132px)', gap: 28, transform: `scale(${s})` }}>
        {PEOPLE.map((id, i) => {
          const k = springPreset({ frame, fps, preset: 'snappy', delay: (i % 9) * 1.5 + Math.floor(i / 9) * 4 })
          return (
            <Img
              key={id}
              src={staticFile(`images/people/${id}.jpg`)}
              style={{
                width: 132,
                height: 132,
                borderRadius: '50%',
                objectFit: 'cover',
                transform: `scale(${0.6 + 0.4 * k})`,
                opacity: Math.min(1, k * 1.5),
                boxShadow: '0 12px 30px -10px rgba(16,15,14,0.35)',
                border: '4px solid #fff',
              }}
            />
          )
        })}
      </div>
      <Rise delay={10} style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 96, letterSpacing: '-0.035em', color: BRAND.text }}>
        {title}
      </Rise>
    </AbsoluteFill>
  )
}

/** Petite étiquette de catalogue (nom de la transition), en bas à gauche. */
export function TransitionLabel({ name, detail }: { name: string; detail?: string }) {
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: 48, pointerEvents: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          padding: '12px 22px',
          borderRadius: 999,
          backgroundColor: 'rgba(7,6,15,0.72)',
          backdropFilter: 'blur(12px)',
          color: '#fff',
          fontFamily: FONT_BODY,
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 600 }}>{name}</span>
        {detail ? <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>{detail}</span> : null}
      </div>
    </AbsoluteFill>
  )
}
