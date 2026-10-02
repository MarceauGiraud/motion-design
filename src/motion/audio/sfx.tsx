/**
 * Effets sonores.
 *
 *   <Sfx id="uisfx/soft/press" at={42} />               un son précis, typé (SfxId)
 *   <SoundCue role="whoosh" at={90} theme="soft" />      un rôle, résolu par le thème
 *
 * Les ids viennent de sfx-registry.ts, généré par `npm run sfx:index` à partir
 * de public/sfx/** (sources et licences : public/sfx/manifest.json).
 * Un thème = une palette sonore cohérente pour toute une vidéo : on ne mélange
 * pas les packs uisfx d'une scène à l'autre.
 */
import { Audio, interpolate, random, Sequence, staticFile, useVideoConfig } from 'remotion'

import { SFX_REGISTRY, type SfxId } from './sfx-registry'

export type { SfxId }

export const sfxSrc = (id: SfxId) => staticFile(SFX_REGISTRY[id].file)
export const sfxDuration = (id: SfxId) => SFX_REGISTRY[id].duration

export interface SfxProps {
  id: SfxId
  /** Frame de déclenchement (relative à la Sequence englobante). */
  at: number
  /** 0..1. Défaut 0.7 : les SFX accompagnent, ils ne couvrent pas la voix. */
  volume?: number
  /** Variation de hauteur/vitesse (1 = original). Utile pour ne pas répéter le même click. */
  playbackRate?: number
  /** Fondu de sortie en frames (sons longs : ambiances, risers). */
  fadeOut?: number
  /** Coupe le son après N frames. */
  maxFrames?: number
}

export function Sfx({ id, at, volume = 0.7, playbackRate = 1, fadeOut = 0, maxFrames }: SfxProps) {
  const { fps } = useVideoConfig()
  const natural = Math.ceil((sfxDuration(id) / playbackRate) * fps) + 1
  const length = Math.max(1, Math.min(natural, maxFrames ?? natural))
  return (
    <Sequence from={Math.round(at)} durationInFrames={length} layout="none" name={`sfx:${id}`}>
      <Audio
        src={sfxSrc(id)}
        playbackRate={playbackRate}
        volume={(f) =>
          fadeOut > 0
            ? volume * interpolate(f, [length - fadeOut, length], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : volume
        }
      />
    </Sequence>
  )
}

// ---------------------------------------------------------------------------
// Rôles et thèmes
// ---------------------------------------------------------------------------

export type SoundRole =
  | 'click' | 'hover' | 'pop' | 'open' | 'close' | 'typing' | 'send' | 'receive'
  | 'notification' | 'success' | 'toggle' | 'swipe' | 'drop'
  | 'whoosh' | 'swoosh' | 'whooshFast' | 'zoomThrough' | 'morph'
  | 'riser' | 'impact' | 'sting' | 'ambience'

export type SoundThemeName = 'soft' | 'minimal' | 'glass' | 'cinematic' | 'studio' | 'classic'

/** Rôles transverses : les SFX ElevenLabs sur mesure, partagés par tous les thèmes. */
const SHARED: Pick<Record<SoundRole, SfxId>, 'whoosh' | 'swoosh' | 'whooshFast' | 'zoomThrough' | 'morph' | 'riser' | 'impact' | 'sting' | 'ambience'> = {
  whoosh: 'elevenlabs/whoosh/airy-short',
  swoosh: 'elevenlabs/whoosh/swoosh-soft',
  whooshFast: 'elevenlabs/whoosh/fast-pass',
  zoomThrough: 'elevenlabs/whoosh/zoom-through',
  morph: 'elevenlabs/ui/morph-glass',
  riser: 'elevenlabs/riser/tension-2s',
  impact: 'elevenlabs/impact/soft-hit',
  sting: 'elevenlabs/sting/logo-bright',
  ambience: 'elevenlabs/ambience/studio-bed',
}

function uiPack(pack: 'soft' | 'minimal' | 'glass' | 'cinematic' | 'studio'): Record<SoundRole, SfxId> {
  const id = (cue: string) => `uisfx/${pack}/${cue}` as SfxId
  return {
    ...SHARED,
    click: id('press'),
    hover: id('hover'),
    pop: id('open'),
    open: id('expand'),
    close: id('collapse'),
    typing: id('typing'),
    send: id('send'),
    receive: id('receive'),
    notification: id('notification'),
    success: id('success'),
    toggle: id('toggle-on'),
    swipe: id('swipe'),
    drop: id('drop'),
  }
}

/**
 * « classic » : vrais enregistrements CC0 (public/sfx/freesound, voir credits.json) :
 * click de souris propre (appui + relâchement), clavier mécanique, petit pop
 * d'ouverture de menu, succès discret, dépose = souffle grave feutré.
 * Pas de son de survol (hover = silence). Souffles de caméra : SHARED.
 */
const CLASSIC: Record<SoundRole, SfxId> = {
  ...SHARED,
  click: 'freesound/mouse/click',
  hover: 'synth/silence',
  pop: 'freesound/ui/pop-open',
  open: 'freesound/ui/pop-open',
  close: 'freesound/mouse/release',
  typing: 'freesound/keyboard/key-01',
  send: 'freesound/keyboard/enter',
  receive: 'freesound/ui/success-wood',
  notification: 'freesound/ui/success-wood',
  success: 'freesound/ui/success',
  toggle: 'freesound/mouse/click',
  swipe: 'elevenlabs/whoosh/swoosh-soft',
  drop: 'synth/drop-swoosh',
}

export const SOUND_THEMES: Record<SoundThemeName, Record<SoundRole, SfxId>> = {
  soft: uiPack('soft'),
  minimal: uiPack('minimal'),
  glass: uiPack('glass'),
  cinematic: uiPack('cinematic'),
  studio: uiPack('studio'),
  classic: CLASSIC,
}

/** Jeux de touches d'un vrai clavier : alternés à chaque caractère. */
export const KEYBOARDS: Partial<Record<SoundThemeName, { keys: SfxId[]; space: SfxId; enter: SfxId }>> = {
  classic: {
    keys: [
      'freesound/keyboard/key-01', 'freesound/keyboard/key-02', 'freesound/keyboard/key-03',
      'freesound/keyboard/key-04', 'freesound/keyboard/key-05', 'freesound/keyboard/key-06',
      'freesound/keyboard/key-07', 'freesound/keyboard/key-08', 'freesound/keyboard/key-09',
    ],
    space: 'freesound/keyboard/space',
    enter: 'freesound/keyboard/enter',
  },
}

export interface SoundCueProps extends Omit<SfxProps, 'id'> {
  role: SoundRole
  theme?: SoundThemeName
}

export function SoundCue({ role, theme = 'soft', ...rest }: SoundCueProps) {
  return <Sfx id={SOUND_THEMES[theme][role]} {...rest} />
}

export interface TypingSfxProps {
  /** Frame du premier caractère (relative à la Sequence englobante). */
  at: number
  /** Nombre de caractères tapés (ignoré si `text` est fourni). */
  chars?: number
  /** Texte tapé : les espaces jouent la barre d'espace, '\n' la touche Entrée. */
  text?: string
  /** Caractères par seconde : doit être celui de l'animation de saisie. */
  cps?: number
  theme?: SoundThemeName
  volume?: number
  /** Graine de la variation (deux saisies d'une même vidéo ne sonnent pas pareil). */
  seed?: string
  /** Appuie sur Entrée N frames après le dernier caractère (envoi). */
  enterAfter?: number
}

/**
 * Frappe clavier synchronisée à une saisie.
 *
 * Thème à clavier (KEYBOARDS, ex. 'classic') : UNE touche par caractère, en
 * alternant plusieurs prises d'un vrai clavier mécanique (jamais deux fois la
 * même d'affilée), avec une infime variation déterministe de hauteur (±3 %)
 * et de volume (-2..0 dB). Espace = barre d'espace. Si la saisie dépasse un
 * caractère par frame, une frappe par frame au plus (sinon on empile les sons).
 *
 * Autres thèmes : comportement historique (un click tous les deux caractères).
 */
export function TypingSfx({ at, chars, text, cps = 38, theme = 'soft', volume = 0.35, seed = 'typing', enterAfter }: TypingSfxProps) {
  const { fps } = useVideoConfig()
  const step = fps / cps
  const count = text?.length ?? chars ?? 0
  const kb = KEYBOARDS[theme]

  if (!kb) {
    const hits = Array.from({ length: Math.ceil(count / 2) }, (_, i) => i * 2)
    return (
      <>
        {hits.map((i) => (
          <Sfx key={i} id={SOUND_THEMES[theme].click} at={at + i * step} volume={volume} playbackRate={1 + ((i * 7) % 5) * 0.04} maxFrames={4} />
        ))}
      </>
    )
  }

  const hits: { frame: number; id: SfxId; rate: number; gain: number }[] = []
  let prev = -1
  let lastFrame = -Infinity
  for (let i = 0; i < count; i++) {
    const frame = Math.round(at + i * step)
    if (frame <= lastFrame) continue
    lastFrame = frame
    const ch = text?.[i]
    const r = (k: string) => random(`${seed}-${k}-${i}`)
    let id: SfxId
    if (ch === ' ') id = kb.space
    else if (ch === '\n') id = kb.enter
    else {
      // Tirage sans répétition immédiate de la prise précédente.
      const n = kb.keys.length
      const pick = prev < 0 ? Math.floor(r('k') * n) : (prev + 1 + Math.floor(r('k') * (n - 1))) % n
      prev = pick
      id = kb.keys[pick]
    }
    hits.push({ frame, id, rate: 0.97 + r('p') * 0.06, gain: Math.pow(10, (-2 * r('v')) / 20) })
  }
  if (enterAfter != null && count > 0) {
    hits.push({ frame: Math.round(at + (count - 1) * step + enterAfter), id: kb.enter, rate: 1, gain: 1 })
  }
  return (
    <>
      {hits.map((h, i) => (
        <Sfx key={i} id={h.id} at={h.frame} volume={volume * h.gain} playbackRate={h.rate} />
      ))}
    </>
  )
}
