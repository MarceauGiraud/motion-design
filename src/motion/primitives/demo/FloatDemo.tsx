/** Constellation d'intégrations qui flottent autour du logo. Boucle 180 f. */
import { AbsoluteFill, Img, staticFile } from 'remotion'
import { stagger } from '../../physics/stagger'
import { ASSETS, BRAND } from '../../tokens'
import { Float } from '../Float'
import { Presence } from '../Presence'
import { DEMO, SHADOW, Stage } from './kit'

const ICONS = [
  { f: 'gmail.svg', x: -560, y: -170, s: 118 },
  { f: 'linkedin.svg', x: -330, y: -300, s: 96 },
  { f: 'whatsapp.svg', x: 360, y: -290, s: 104 },
  { f: 'google-calendar.svg', x: 580, y: -130, s: 120 },
  { f: 'notion.svg', x: 640, y: 150, s: 96 },
  { f: 'stripe.svg', x: 380, y: 300, s: 112 },
  { f: 'google-meet.svg', x: -380, y: 290, s: 108 },
  { f: 'openai.svg', x: -640, y: 110, s: 92 },
  { f: 'aircall.svg', x: -120, y: 360, s: 84 },
  { f: 'supabase.svg', x: 110, y: -380, s: 84 },
]

export const FloatDemo = () => (
  <Stage title="Float" caption="Idle organique, bouclé sans couture. Deux harmoniques, phases graines.">
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', top: 80 }}>
      {ICONS.map((ic, i) => (
        <div key={ic.f} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(${ic.x - ic.s / 2}px, ${ic.y - ic.s / 2}px)` }}>
          <Presence enter="pop" enterAt={stagger(i, 3, { count: ICONS.length, from: 'random', seed: 'icons', delay: 16 })}>
            <Float amplitude={10 + (i % 3) * 4} rotate={3} period={180 / (1 + (i % 2))} seed={ic.f} shadow={10}>
              <div
                style={{
                  width: ic.s,
                  height: ic.s,
                  borderRadius: ic.s * 0.28,
                  background: DEMO.white,
                  border: `1px solid ${BRAND.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Img src={staticFile(`images/icons/${ic.f}`)} style={{ width: ic.s * 0.5, height: ic.s * 0.5, objectFit: 'contain' }} />
              </div>
            </Float>
          </Presence>
        </div>
      ))}
      <Presence enter="pop" enterAt={6}>
        <Float amplitude={8} rotate={0} breathe={0.015} period={180} seed="logo">
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 60,
              background: DEMO.white,
              boxShadow: SHADOW.lift,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Img src={staticFile(ASSETS.logo)} style={{ width: 120, height: 120 }} />
          </div>
        </Float>
      </Presence>
    </AbsoluteFill>
  </Stage>
)
