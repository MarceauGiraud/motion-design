/** Parallaxe : fond, cartes métriques, fenêtre plateforme, puces de premier plan avec profondeur de champ. */
import { AbsoluteFill, Img } from 'remotion'
import { PlatformScreen, PlatformWindow } from '../../../kit/Platform'
import { BRAND, FONT_DISPLAY } from '../../tokens'
import { Float } from '../Float'
import { Parallax, ParallaxLayer } from '../Parallax'
import { Presence } from '../Presence'
import { avatar, Card, PEOPLE, SHADOW } from './kit'

const METRICS = [
  { x: 150, y: 120, label: 'Pipeline', value: '1,2 M€' },
  { x: 1540, y: 140, label: 'Win rate', value: '38 %' },
  { x: 130, y: 790, label: 'Cycle moyen', value: '21 j' },
  { x: 1560, y: 780, label: 'Deals actifs', value: '146' },
]

const CHIPS = [
  { x: 300, y: 520, i: 0 },
  { x: 1560, y: 470, i: 2 },
  { x: 540, y: 900, i: 6 },
  { x: 1240, y: 110, i: 4 },
]

export const ParallaxDemo = () => (
  <AbsoluteFill style={{ backgroundColor: BRAND.paper }}>
    <Parallax camera={{ from: { x: -90, y: 24, zoom: 0.98 }, to: { x: 90, y: -16, zoom: 1.05 }, preset: 'gentle', delay: 0, durationInFrames: 200 }} focus={1} dof={3.5} handheld={3}>
      <ParallaxLayer depth={0.15}>
        <div style={{ position: 'absolute', left: 1100, top: -200, width: 900, height: 900, borderRadius: 450, background: BRAND.rose, opacity: 0.1, filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', left: -200, top: 500, width: 900, height: 900, borderRadius: 450, background: BRAND.ink, opacity: 0.08, filter: 'blur(120px)' }} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.5}>
        {METRICS.map((m, i) => (
          <div key={m.label} style={{ position: 'absolute', left: m.x, top: m.y }}>
            <Presence enter="fadeUp" enterAt={20 + i * 5}>
              <Card style={{ padding: '18px 24px', width: 250 }}>
                <div style={{ fontSize: 15, color: BRAND.textMuted }}>{m.label}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 500, color: BRAND.text, marginTop: 4 }}>{m.value}</div>
              </Card>
            </Presence>
          </div>
        ))}
      </ParallaxLayer>
      <ParallaxLayer depth={1} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Presence enter="scale" enterAt={0} preset="heavy">
          <PlatformWindow width={1120}>
            <PlatformScreen scene="pipeline" />
          </PlatformWindow>
        </Presence>
      </ParallaxLayer>
      <ParallaxLayer depth={1.7}>
        {CHIPS.map((c, k) => {
          const p = PEOPLE[c.i]
          return (
            <div key={k} style={{ position: 'absolute', left: c.x, top: c.y }}>
              <Presence enter="pop" enterAt={34 + k * 6}>
                <Float amplitude={10} seed={`chip-${k}`} period={200}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 20px 10px 10px',
                      borderRadius: 40,
                      background: BRAND.wing,
                      boxShadow: SHADOW.lift,
                      border: `1px solid ${BRAND.border}`,
                    }}
                  >
                    <Img src={avatar(p.img)} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
                    <div style={{ fontSize: 20, fontWeight: 600, color: BRAND.text }}>{p.name}</div>
                  </div>
                </Float>
              </Presence>
            </div>
          )
        })}
      </ParallaxLayer>
    </Parallax>
  </AbsoluteFill>
)
