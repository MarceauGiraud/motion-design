/** Banc d'essai : chaque preset de SPRINGS sur la même course, aller-retour, avec squash et motion blur. */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { SPRINGS, type SpringPresetName } from '../../physics/springs'
import { BRAND, BRAND_RAMP, FONT_DISPLAY } from '../../tokens'
import { SpringBox, springBoxState, type SpringBoxStep } from '../SpringBox'
import { Stage, Tag } from './kit'

const PRESETS = Object.keys(SPRINGS) as SpringPresetName[]
const TRACK = 1240
const BALL = 44

export const SpringLabDemo = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <Stage title="SpringBox" caption="Même course, neuf presets. Étirement et flou dérivés de la vitesse.">
      <AbsoluteFill style={{ left: 96, top: 290, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {PRESETS.map((preset, row) => {
          const steps: SpringBoxStep[] = [
            { at: 24 + row * 2, to: { x: TRACK } },
            { at: 120 + row * 2, to: { x: 0 } },
          ]
          const anim = { steps, preset }
          return (
            <div key={preset} style={{ display: 'flex', alignItems: 'center', height: 52 }}>
              <div style={{ width: 170 }}>
                <Tag color={BRAND.text}>{preset}</Tag>
              </div>
              <div style={{ position: 'relative', width: TRACK + BALL, height: BALL }}>
                <div style={{ position: 'absolute', left: BALL / 2, right: BALL / 2, top: BALL / 2 - 1, height: 2, borderRadius: 1, background: BRAND.border }} />
                {/* Traînée : positions passées, pures (état à frame - k). */}
                {[4, 3, 2, 1].map((k, j) => {
                  const s = springBoxState(frame - k, fps, anim)
                  return (
                    <div
                      key={k}
                      style={{ position: 'absolute', width: BALL, height: BALL, borderRadius: BALL / 2, background: BRAND.violet, opacity: 0.05 + j * 0.035, transform: `translateX(${s.x}px)` }}
                    />
                  )
                })}
                <SpringBox steps={steps} preset={preset} motionBlur={0.7} squash={{ intensity: 0.01, max: 0.45 }} style={{ position: 'absolute' }}>
                  <div style={{ width: BALL, height: BALL, borderRadius: BALL / 2, backgroundImage: BRAND_RAMP }} />
                </SpringBox>
              </div>
              <div style={{ marginLeft: 36, fontFamily: FONT_DISPLAY, fontSize: 18, color: BRAND.textMuted, width: 220 }}>
                m {SPRINGS[preset].mass} · k {SPRINGS[preset].stiffness} · c {SPRINGS[preset].damping}
              </div>
            </div>
          )
        })}
      </AbsoluteFill>
    </Stage>
  )
}
