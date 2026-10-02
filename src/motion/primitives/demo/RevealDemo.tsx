/** Galerie : chaque variante de <Reveal> dans sa tuile, entrée puis sortie. */
import { AbsoluteFill } from 'remotion'
import { BRAND } from '../../tokens'
import { Presence } from '../Presence'
import { Stagger } from '../Stagger'
import { REVEAL_VARIANTS } from '../variants'
import { Card, DealCard, Stage, Tag } from './kit'

export const RevealDemo = () => {
  const cols = 4
  return (
    <Stage title="Reveal" caption="Onze variantes, un seul ressort. Entrée, tenue, sortie à l'envers.">
      <AbsoluteFill style={{ paddingTop: 280, paddingLeft: 96, paddingRight: 96 }}>
        <Stagger
          variant="scale"
          step={2}
          delay={2}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}
        >
          {REVEAL_VARIANTS.map((v, i) => (
            <Card key={v} style={{ height: 200, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: BRAND.wing, overflow: 'hidden' }}>
              <Tag>{v}</Tag>
              <Presence enter={v} enterAt={30 + i * 6} exitAt={150 + i * 3} motionBlur>
                <DealCard i={i} width="100%" />
              </Presence>
            </Card>
          ))}
        </Stagger>
      </AbsoluteFill>
    </Stage>
  )
}
