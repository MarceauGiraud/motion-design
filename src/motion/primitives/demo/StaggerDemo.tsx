/** Quatre vagues, quatre origines : start, end, center, random. */
import { AbsoluteFill, Img } from 'remotion'
import type { StaggerFrom } from '../../physics/stagger'
import { BRAND, FONT_DISPLAY } from '../../tokens'
import { Stagger } from '../Stagger'
import type { RevealVariant } from '../variants'
import { avatar, Card, PEOPLE, Stage, Tag } from './kit'

const ROWS: Array<{ from: StaggerFrom; variant: RevealVariant; exit: RevealVariant }> = [
  { from: 'start', variant: 'fadeUp', exit: 'fadeDown' },
  { from: 'end', variant: 'pop', exit: 'pop' },
  { from: 'center', variant: 'flipUp', exit: 'blur' },
  { from: 'random', variant: 'blur', exit: 'scale' },
]

const Chip = ({ i }: { i: number }) => {
  const p = PEOPLE[i % PEOPLE.length]
  return (
    <Card style={{ width: 148, height: 148, borderRadius: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <Img src={avatar(p.img)} style={{ width: 64, height: 64, borderRadius: 32, objectFit: 'cover' }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.text }}>{p.name.split(' ')[0]}</div>
    </Card>
  )
}

export const StaggerDemo = () => (
  <Stage title="Stagger" caption="N'importe quels enfants, en vague. Origine, pas et variante au choix.">
    <AbsoluteFill style={{ paddingTop: 290, paddingLeft: 96, display: 'flex', flexDirection: 'column', gap: 34 }}>
      {ROWS.map((r, row) => (
        <div key={String(r.from)} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ width: 150 }}>
            <Tag>{String(r.from)}</Tag>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: BRAND.text, marginTop: 6 }}>{r.variant}</div>
          </div>
          <Stagger
            variant={r.variant}
            from={r.from}
            seed={`row-${row}`}
            step={3}
            delay={24 + row * 14}
            exitAt={170 + row * 4}
            exitVariant={r.exit}
            motionBlur
            style={{ display: 'flex', gap: 20, height: 148 }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <Chip key={i} i={i + row * 3} />
            ))}
          </Stagger>
        </div>
      ))}
    </AbsoluteFill>
  </Stage>
)
