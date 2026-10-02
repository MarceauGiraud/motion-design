/** Décor partagé des démos du module (non exporté par l'index). */
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, staticFile } from 'remotion'
import { BRAND, FONT_BODY, FONT_DISPLAY } from '../../tokens'
import { Reveal } from '../Presence'

/** Ombres locales de la démo, dérivées de BRAND.text (#100F0E). */
/** Palette locale des démos. */
export const DEMO = { white: '#FFFFFF' } as const

export const SHADOW = {
  card: '0 1px 2px rgba(16,15,14,0.06), 0 12px 32px -12px rgba(16,15,14,0.18)',
  lift: '0 2px 4px rgba(16,15,14,0.06), 0 30px 60px -24px rgba(16,15,14,0.32)',
} as const

export const PEOPLE = [
  { img: 'ab', name: 'Alice Bernard', co: 'Northwind', amount: '48 k€' },
  { img: 'hl', name: 'Hugo Lambert', co: 'Globex', amount: '12 k€' },
  { img: 'em', name: 'Emma Morel', co: 'Initech', amount: '96 k€' },
  { img: 'jr', name: 'Jules Robin', co: 'Umbrella', amount: '31 k€' },
  { img: 'lv', name: 'Léa Vidal', co: 'Hooli', amount: '64 k€' },
  { img: 'ma', name: 'Marc Aubert', co: 'Wayne Labs', amount: '22 k€' },
  { img: 'ns', name: 'Nina Simon', co: 'Northwind', amount: '78 k€' },
  { img: 'pm', name: 'Paul Mercier', co: 'Globex', amount: '18 k€' },
  { img: 'sk', name: 'Sarah Klein', co: 'Initech', amount: '54 k€' },
  { img: 'tl', name: 'Théo Leroy', co: 'Umbrella', amount: '27 k€' },
  { img: 'sr', name: 'Sofia Roux', co: 'Hooli', amount: '41 k€' },
  { img: 'tn', name: 'Tom Nguyen', co: 'Northwind', amount: '88 k€' },
] as const

export const avatar = (key: string) => staticFile(`images/people/${key}.jpg`)

/** Fond papier + titre de la démo, en haut à gauche. */
export function Stage({ title, caption, children, dark = false }: { title: string; caption?: string; children?: ReactNode; dark?: boolean }) {
  const fg = dark ? BRAND.wing : BRAND.text
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? BRAND.night : BRAND.paper, fontFamily: FONT_BODY, color: fg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 50% at 85% 0%, ${BRAND.rose}14 0%, transparent 70%), radial-gradient(50% 50% at 0% 100%, ${BRAND.ink}10 0%, transparent 70%)`,
        }}
      />
      {children}
      <div style={{ position: 'absolute', left: 96, top: 72 }}>
        <Reveal variant="fadeUp" delay={0} distance={16}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, letterSpacing: 2.4, textTransform: 'uppercase', color: dark ? `${BRAND.wing}88` : BRAND.textMuted }}>
            Primitives
          </div>
        </Reveal>
        <Reveal variant="clipUp" delay={4}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 56, fontWeight: 500, letterSpacing: -1.4, lineHeight: 1.1, marginTop: 6 }}>{title}</div>
        </Reveal>
        {caption && (
          <Reveal variant="fadeUp" delay={10} distance={12}>
            <div style={{ fontSize: 20, color: dark ? `${BRAND.wing}aa` : BRAND.textMuted, marginTop: 10, maxWidth: 720 }}>{caption}</div>
          </Reveal>
        )}
      </div>
    </AbsoluteFill>
  )
}

export function Card({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: DEMO.white,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 20,
        boxShadow: SHADOW.card,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Mini fiche deal : avatar, nom, société, montant. */
export function DealCard({ i, width = 300, style }: { i: number; width?: number | string; style?: CSSProperties }) {
  const p = PEOPLE[i % PEOPLE.length]
  return (
    <Card style={{ width, padding: 16, display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <Img src={avatar(p.img)} style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: BRAND.text }}>{p.name}</div>
        <div style={{ fontSize: 14, color: BRAND.textMuted, marginTop: 2 }}>{p.co}</div>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: BRAND.text }}>{p.amount}</div>
    </Card>
  )
}

/** Petite étiquette mono de légende. */
export function Tag({ children, color = BRAND.textMuted, style }: { children?: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500, letterSpacing: 1.6, textTransform: 'uppercase', color, ...style }}>
      {children}
    </div>
  )
}
