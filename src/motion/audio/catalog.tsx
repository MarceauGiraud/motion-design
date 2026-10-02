/**
 * Démos du module audio (dossier Studio: Catalog/Audio).
 * Voix off : écris un script (voiceover/example.json), lance `npm run voiceover -- voiceover/example.json`,
 * puis monte <VoiceOverTrack> / <Captions> / <MusicBed duckUnder> (voir voiceover.tsx).
 */
import { AbsoluteFill, Composition, Folder } from 'remotion'

import { BRAND } from '../tokens'
import { SoundCue, TypingSfx } from './index'

const FPS = 30
/**
 * Thème « classic » (vrais enregistrements CC0) : click, ouverture de menu,
 * frappe mécanique (une touche par caractère, espace = barre), Entrée, succès,
 * dépose. Écran blanc : c'est une démo à écouter.
 */
const CLASSIC_TEXT = "How's our relationship with Novaria going?"
const ClassicThemeDemo = () => (
  <AbsoluteFill style={{ background: BRAND.paper, alignItems: 'center', justifyContent: 'center', fontSize: 40, color: BRAND.text }}>
    classic
    <SoundCue theme="classic" role="click" at={10} volume={0.6} />
    <SoundCue theme="classic" role="open" at={28} volume={0.45} />
    <SoundCue theme="classic" role="click" at={50} volume={0.6} />
    <TypingSfx theme="classic" at={70} text={CLASSIC_TEXT} cps={14} volume={0.5} seed="demo" enterAfter={8} />
    <SoundCue theme="classic" role="success" at={70 + Math.ceil((CLASSIC_TEXT.length * 30) / 14) + 30} volume={0.45} />
    <SoundCue theme="classic" role="drop" at={70 + Math.ceil((CLASSIC_TEXT.length * 30) / 14) + 60} volume={0.6} />
  </AbsoluteFill>
)

export const Catalog = () => (
  <Folder name="Audio">
    <Composition id="Audio-ClassicTheme" component={ClassicThemeDemo} durationInFrames={270} fps={FPS} width={1920} height={1080} />
  </Folder>
)
