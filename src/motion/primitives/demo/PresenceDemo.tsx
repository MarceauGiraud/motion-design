/** Pile de notifications : chaque arrivée pousse les autres (springTimeline), chaque toast sort seul. */
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { springTimeline } from '../../physics/timeline'
import { BRAND, FONT_DISPLAY } from '../../tokens'
import { Presence } from '../Presence'
import { avatar, Card, Stage } from './kit'

const TOASTS = [
  { at: 20, img: 'sn', title: "L’IA a enrichi 3 fiches", sub: 'Northwind, Globex, Initech · il y a 2 s' },
  { at: 48, img: 'em', title: 'Emma Morel a ouvert votre email', sub: 'Proposition Q4 · 3e ouverture' },
  { at: 76, img: 'ab', title: 'Nouveau deal · Northwind', sub: '48 k€ · Qualification' },
  { at: 104, img: 'hl', title: 'Réunion confirmée', sub: 'Hugo Lambert · jeudi 14:30' },
  { at: 132, img: 'ns', title: 'Deal gagné · Initech', sub: '96 k€ · signé électroniquement' },
]
const LIFE = 100
const GAP = 124

export const PresenceDemo = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <Stage title="Presence" caption="Entrée et sortie à ressort, interruptibles. Les voisins se poussent physiquement.">
      <AbsoluteFill style={{ left: 96, top: 420 }}>
        <Presence enterAt={14} exitAt={210} enter="clipUp" exit="clipUp">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 104, fontWeight: 500, letterSpacing: -3, lineHeight: 1, color: BRAND.text }}>Tout arrive.</div>
        </Presence>
        <Presence enterAt={24} exitAt={214} enter="clipUp" exit="clipUp">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 104, fontWeight: 500, letterSpacing: -3, lineHeight: 1.1, color: BRAND.textMuted }}>Rien ne se perd.</div>
        </Presence>
      </AbsoluteFill>
      <AbsoluteFill style={{ left: 1920 - 96 - 600, top: 250, width: 600 }}>
        {TOASTS.map((t, i) => {
          // Poussé vers le bas par chaque toast plus récent.
          const y = springTimeline(
            frame,
            fps,
            TOASTS.slice(i + 1).map((n, k) => ({ at: n.at, to: (k + 1) * GAP })),
            { preset: 'snappy' },
          )
          return (
            <div key={t.title} style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${y}px)` }}>
              <Presence enterAt={t.at} exitAt={t.at + LIFE} enter="slideLeft" exit="blur" preset="snappy" distance={180} motionBlur>
                <Card style={{ width: 600, padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderRadius: 22 }}>
                  <Img
                    src={avatar(t.img)}
                    style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: BRAND.text }}>{t.title}</div>
                    <div style={{ fontSize: 16, color: BRAND.textMuted, marginTop: 4 }}>{t.sub}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: i === 4 ? BRAND.rose : BRAND.blue }} />
                </Card>
              </Presence>
            </div>
          )
        })}
      </AbsoluteFill>
    </Stage>
  )
}
