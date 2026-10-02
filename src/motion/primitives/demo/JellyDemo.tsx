/** Magnet + Wobble : trois deals aimantés dans la colonne "Gagné", qui tremble à chaque impact. */
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BRAND, FONT_DISPLAY } from '../../tokens'
import { Magnet, Wobble } from '../Jelly'
import { Presence } from '../Presence'
import { Stagger } from '../Stagger'
import { DealCard, Stage } from './kit'

const COL_W = 460
const COL_X = [96, 96 + COL_W + 60, 96 + (COL_W + 60) * 2]
const TOP = 330
const ROW = 108
const SNAPS = [44, 84, 124]
/** L'impact a lieu quelques frames après le snap (temps de vol du ressort 'whip'). */
const IMPACT = 7

const COLUMNS = [
  { title: 'Qualifié', color: BRAND.blue },
  { title: 'Proposition', color: BRAND.violet },
  { title: 'Gagné', color: BRAND.rose },
]

export const JellyDemo = () => {
  const frame = useCurrentFrame()
  const won = SNAPS.filter((s) => frame >= s + IMPACT).length
  return (
    <Stage title="Magnet · Wobble" caption="Tension, snap, étirement dans l'axe de la vitesse. La cible encaisse l'impact.">
      <Stagger variant="fadeUp" step={5} delay={6}>
        {COLUMNS.map((c, i) => (
          <div
            key={c.title}
            style={{
              position: 'absolute',
              left: COL_X[i],
              top: TOP - 20,
              width: COL_W,
              height: 620,
              borderRadius: 24,
              background: `${BRAND.border}66`,
              border: `1px dashed ${BRAND.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px' }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: c.color }} />
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500, color: BRAND.text }}>{c.title}</div>
              {i === 2 && (
                <Wobble hits={SNAPS.map((s) => s + IMPACT)} intensity={0.35} transformOrigin="50% 50%" style={{ marginLeft: 'auto' }}>
                  <div
                    style={{
                      minWidth: 40,
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 20,
                      background: BRAND.rose,
                      color: BRAND.wing,
                      fontFamily: FONT_DISPLAY,
                      fontSize: 20,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {won}
                  </div>
                </Wobble>
              )}
            </div>
          </div>
        ))}
      </Stagger>
      <AbsoluteFill>
        {/* Cartes restantes de la colonne Proposition. */}
        {[3, 4].map((d, k) => (
          <div key={d} style={{ position: 'absolute', left: COL_X[1] + 20, top: TOP + 64 + k * ROW }}>
            <Presence enter="fadeUp" enterAt={16 + k * 4}>
              <DealCard i={d} width={COL_W - 40} />
            </Presence>
          </div>
        ))}
        {SNAPS.map((at, k) => (
          <div key={at} style={{ position: 'absolute', left: COL_X[2] + 20, top: TOP + 64 + (2 - k) * ROW, zIndex: 10 }}>
            <Magnet at={at} from={{ x: COL_X[0] - COL_X[2], y: (k - (2 - k)) * ROW }} to={{ x: 0, y: 0 }} tension={12} creep={0.05} tilt={0.08}>
              <Presence enter="fadeUp" enterAt={12 + k * 4}>
                <DealCard i={k * 4 + 2} width={COL_W - 40} />
              </Presence>
            </Magnet>
          </div>
        ))}
      </AbsoluteFill>
    </Stage>
  )
}
