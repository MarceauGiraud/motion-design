/** Les helpers physiques rendus visibles : chase, followChain, springTimeline, loop. */
import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { chase, followChain, keyTarget } from '../../physics/chase'
import { motionBlurFilter, stretchTransform } from '../../physics/deform'
import { loop, type LoopShape } from '../../physics/loop'
import { springTimeline, type TimelineStep } from '../../physics/timeline'
import { BRAND, BRAND_RAMP, FONT_DISPLAY } from '../../tokens'
import { Stagger } from '../Stagger'
import { Card, Stage, Tag } from './kit'

const PANEL_W = 852
const PANEL_H = 330
const Panel = ({ title, hint, children }: { title: string; hint: string; children: ReactNode }) => (
  <Card style={{ width: PANEL_W, height: PANEL_H, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 28, top: 24 }}>
      <Tag color={BRAND.text}>{title}</Tag>
      <div style={{ fontSize: 15, color: BRAND.textMuted, marginTop: 4 }}>{hint}</div>
    </div>
    {children}
  </Card>
)

const Dot = ({ x, y, size, vx = 0, vy = 0, fill = BRAND_RAMP, opacity = 1 }: { x: number; y: number; size: number; vx?: number; vy?: number; fill?: string; opacity?: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: size,
      height: size,
      borderRadius: size / 2,
      background: fill,
      opacity,
      transform: `translate(${x - size / 2}px, ${y - size / 2}px) ${stretchTransform(vx, vy)}`,
      filter: motionBlurFilter(Math.hypot(vx, vy)),
    }}
  />
)

// Chase : cible en escalier, deux poursuivants.
const CHASE_KEYS_X = [
  { at: 0, value: 160 },
  { at: 30, value: 560 },
  { at: 80, value: 300 },
  { at: 130, value: 640 },
  { at: 180, value: 160 },
]
const CHASE_KEYS_Y = [
  { at: 0, value: 230 },
  { at: 30, value: 150 },
  { at: 80, value: 240 },
  { at: 130, value: 220 },
  { at: 180, value: 180 },
]

const ChasePanel = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const tx = keyTarget(CHASE_KEYS_X, frame)
  const ty = keyTarget(CHASE_KEYS_Y, frame)
  const cx = chase({ frame, fps, keys: CHASE_KEYS_X })
  const cy = chase({ frame, fps, keys: CHASE_KEYS_Y })
  const jx = chase({ frame, fps, keys: CHASE_KEYS_X, preset: 'jelly' })
  const jy = chase({ frame, fps, keys: CHASE_KEYS_Y, preset: 'jelly' })
  return (
    <Panel title="chase" hint="Critique (dégradé) vs jelly (violet) sur la même cible">
      <div style={{ position: 'absolute', left: tx - 24, top: ty - 24, width: 48, height: 48, borderRadius: 24, border: `2px dashed ${BRAND.textMuted}` }} />
      <Dot x={jx.value} y={jy.value} size={22} vx={jx.velocity} vy={jy.velocity} fill={BRAND.violet} opacity={0.55} />
      <Dot x={cx.value} y={cy.value} size={32} vx={cx.velocity} vy={cy.velocity} />
    </Panel>
  )
}

// followChain : un meneur qui dessine un 8, une traînée qui suit.
const ChainPanel = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const lx = (f: number) => 420 + Math.sin((f / 120) * Math.PI * 2) * 260
  const ly = (f: number) => 200 + Math.sin((f / 60) * Math.PI * 2) * 70
  const xs = followChain({ frame, fps, driver: lx, links: 8, lag: 1, preset: 'snappy' })
  const ys = followChain({ frame, fps, driver: ly, links: 8, lag: 1, preset: 'snappy' })
  return (
    <Panel title="followChain" hint="Huit maillons, chacun suit le précédent avec retard">
      {xs
        .map((x, k) => ({ x, y: ys[k], k }))
        .reverse()
        .map(({ x, y, k }) => (
          <Dot key={k} x={x.value} y={y.value} size={30 - k * 2.6} fill={k % 2 ? BRAND.violet : BRAND.rose} opacity={1 - k * 0.1} />
        ))}
      <Dot x={lx(frame)} y={ly(frame)} size={34} fill={BRAND.ink} />
    </Panel>
  )
}

// springTimeline : courbe tracée au fil du temps.
const STEPS: TimelineStep[] = [
  { at: 10, to: 1 },
  { at: 60, to: 0.35, preset: 'bouncy' },
  { at: 110, to: 1.1, preset: 'snappy' },
  { at: 125, to: 0.6, preset: 'jelly' },
  { at: 190, to: 0 },
]
const TimelinePanel = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const W = PANEL_W - 80
  const H = 190
  const x0 = 40
  const y0 = 110
  const total = 240
  const pts: string[] = []
  for (let f = 0; f <= Math.min(frame, total); f++) {
    const v = springTimeline(f, fps, STEPS)
    pts.push(`${x0 + (f / total) * W},${y0 + H - v * H * 0.85}`)
  }
  const v = springTimeline(frame, fps, STEPS)
  const cx = x0 + (Math.min(frame, total) / total) * W
  const cy = y0 + H - v * H * 0.85
  return (
    <Panel title="springTimeline" hint="Étapes superposées : une étape en interrompt une autre sans cassure">
      <svg width={PANEL_W} height={PANEL_H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="pl-ramp" x1="0" x2="1">
            <stop offset="0%" stopColor={BRAND.rose} />
            <stop offset="45%" stopColor={BRAND.violet} />
            <stop offset="100%" stopColor={BRAND.ink} />
          </linearGradient>
        </defs>
        <line x1={x0} x2={x0 + W} y1={y0 + H} y2={y0 + H} stroke={BRAND.border} strokeWidth={2} />
        {STEPS.map((s) => (
          <line key={s.at} x1={x0 + (s.at / total) * W} x2={x0 + (s.at / total) * W} y1={y0} y2={y0 + H} stroke={BRAND.border} strokeDasharray="4 6" />
        ))}
        <polyline points={pts.join(' ')} fill="none" stroke="url(#pl-ramp)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={9} fill={BRAND.ink} />
      </svg>
    </Panel>
  )
}

// loop : quatre formes bouclées.
const SHAPES: LoopShape[] = ['sine', 'triangle', 'bounce', 'breathe']
const LoopPanel = () => {
  const frame = useCurrentFrame()
  return (
    <Panel title="loop" hint="Oscillations raccordées : loop(f + période) = loop(f)">
      {SHAPES.map((shape, i) => {
        const y = loop(frame, { period: 60, amplitude: shape === 'bounce' ? 90 : 55, shape })
        const baseY = shape === 'bounce' ? 280 : 215
        return (
          <div key={shape}>
            <Dot x={140 + i * 185} y={baseY - y} size={34} fill={[BRAND.rose, BRAND.violet, BRAND.blue, BRAND.ink][i]} />
            <div style={{ position: 'absolute', left: 140 + i * 185 - 60, width: 120, top: 296, textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 16, color: BRAND.textMuted }}>
              {shape}
            </div>
          </div>
        )
      })}
    </Panel>
  )
}

export const PhysicsDemo = () => (
  <Stage title="Physics" caption="Les helpers purs de src/motion/physics, rendus visibles.">
    <AbsoluteFill style={{ left: 96, top: 290 }}>
      <Stagger variant="scale" step={4} delay={4} style={{ display: 'grid', gridTemplateColumns: `${PANEL_W}px ${PANEL_W}px`, columnGap: 24, rowGap: 24 }}>
        <ChasePanel />
        <ChainPanel />
        <TimelinePanel />
        <LoopPanel />
      </Stagger>
    </AbsoluteFill>
  </Stage>
)
