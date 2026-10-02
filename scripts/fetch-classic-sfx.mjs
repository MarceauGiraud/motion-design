#!/usr/bin/env node
/**
 * Pack sonore « classic » : vrais enregistrements CC0 (Freesound), téléchargés,
 * découpés et normalisés de façon reproductible, puis réindexés.
 *
 *   node scripts/fetch-classic-sfx.mjs && npm run sfx:index
 *
 * Sortie : public/sfx/freesound/<cue>.wav + public/sfx/freesound/credits.json
 * (source, auteur, licence PAR FICHIER, lue par scripts/sfx-manifest.mjs).
 *
 * WAV plutôt que MP3 : un MP3 ajoute ~25 ms de silence d'amorce (encoder delay),
 * ce qui décale les clicks et les frappes par rapport à l'image.
 *
 * Chaque source a été vérifiée CC0 sur sa page Freesound
 * (creativecommons.org/publicdomain/zero/1.0/). Fichiers = aperçus HQ Freesound
 * (les originaux exigent un compte), qualité largement suffisante pour des clicks.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const OUT = join(process.cwd(), 'public/sfx/freesound')
const CACHE = join(tmpdir(), 'classic-sfx')
const CC0 = 'CC0-1.0'

/** Aperçu HQ Freesound : previews/<id/1000>/<id>_<userId>-hq.mp3 */
const fs = (user, id, userId) => ({
  url: `https://cdn.freesound.org/previews/${Math.floor(id / 1000)}/${id}_${userId}-hq.mp3`,
  page: `https://freesound.org/people/${user}/sounds/${id}/`,
  author: user,
  key: `${id}`,
})

const STAV = (id) => fs('StavSounds', id, 7862587)

/**
 * start/end en secondes dans la source ; gain appliqué après normalisation crête.
 * peak : crête visée en dBFS. lowpass/highpass optionnels (Hz).
 */
const CUES = [
  // --- Clavier mécanique (StavSounds, pack « Mechanical Keyboards », switches tactiles).
  // Chaque prise = appui + relâchement (~100-150 ms plus tard) : c'est ce qui fait
  // un vrai clavier. On garde les prises dont l'appui est net.
  ...[
    [766628, 'key-01'], [766630, 'key-02'], [766631, 'key-03'], [766632, 'key-04'], [766633, 'key-05'],
    [766634, 'key-06'], [766637, 'key-07'], [766638, 'key-08'], [766639, 'key-09'],
  ].map(([id, name]) => ({ id: `keyboard/${name}`, src: STAV(id), start: 0, end: 0.24, peak: -3, title: 'Keyboard_Tactile (single key press, tactile mechanical keyboard)' })),
  // Barre d'espace : Keychron K10, switches linéaires (Sadiquecat).
  { id: 'keyboard/space', src: fs('Sadiquecat', 789630, 5287430), start: 0, end: 0.36, peak: -5, title: 'Keychron k10 space_bar' },
  // Entrée : Corsair K70 (alpinemesh).
  { id: 'keyboard/enter', src: fs('alpinemesh', 627647, 13684433), start: 0, end: 0.2, peak: -4, title: 'Enter key press, Corsair K70 RGB' },

  // --- Souris : un seul enregistrement propre (Pixeliota), appui à 0,385 s, relâchement à 0,480 s.
  { id: 'mouse/click', src: fs('Pixeliota', 678248, 7806746), start: 0.372, end: 0.54, peak: -3, title: 'Mouse Click Sound (press + release)' },
  { id: 'mouse/press', src: fs('Pixeliota', 678248, 7806746), start: 0.372, end: 0.455, peak: -3, title: 'Mouse Click Sound (press only)' },
  { id: 'mouse/release', src: fs('Pixeliota', 678248, 7806746), start: 0.462, end: 0.54, peak: -5, title: 'Mouse Click Sound (release only)' },

  // --- UI : ouverture de menu, succès, dépose.
  { id: 'ui/pop-open', src: fs('Rob_Marion', 541993, 6856600), start: 0.08, end: 0.3, peak: -6, title: 'GASP_UI_Pop_1' },
  { id: 'ui/success', src: fs('Rob_Marion', 542044, 6856600), start: 0, end: 0.62, peak: -6, fade: 0.25, title: 'GASP_UI_Confirm' },
  { id: 'ui/success-wood', src: fs('qubodup', 822568, 71257), start: 0, end: 0.256, peak: -5, title: 'User Interface Elegant Wooden Confirmation Sound' },
]

function download(src) {
  mkdirSync(CACHE, { recursive: true })
  const file = join(CACHE, `${src.key}.mp3`)
  if (!existsSync(file)) execFileSync('curl', ['-sSLf', '-A', 'Mozilla/5.0', '-o', file, src.url])
  return file
}

function measurePeak(file) {
  // astats (et non volumedetect, plafonné à 0 dB) : les aperçus MP3 dépassent parfois 0 dBFS.
  const res = execFileSync('bash', ['-c', `ffmpeg -v info -i "${file}" -af astats=measure_perchannel=none -f null - 2>&1 | grep -m1 "Peak level dB"`]).toString()
  return Number(res.match(/Peak level dB: (-?[\d.]+)/)[1])
}

rmSync(OUT, { recursive: true, force: true })
const credits = {}
for (const c of CUES) {
  const input = download(c.src)
  const srcDur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input]).toString())
  const end = Math.min(c.end, srcDur - 0.005)
  const channels = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=channels', '-of', 'csv=p=0', input]).toString().trim())
  // Attaque calée à t=0 (±3 ms) : le son part pile sur la frame du geste.
  const onset = c.trimOnset === false ? '' : 'silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.003,'
  const chain = [
    `atrim=${c.start}:${end}`,
    'asetpts=PTS-STARTPTS',
    'aresample=44100',
    // Mono explicite (moyenne L/R) : le downmix implicite d'aformat ne donne pas la même crête.
    channels > 1 ? 'pan=mono|c0=0.5*c0+0.5*c1' : null,
    c.highpass ? `highpass=f=${c.highpass}` : null,
    c.lowpass ? `lowpass=f=${c.lowpass}` : null,
    `${onset}afade=t=in:st=0:d=${c.fadeIn ?? 0.002}`,
    // areverse x2 : fondu de sortie ancré sur la VRAIE fin (après suppression du silence d'attaque).
    `areverse,afade=t=in:st=0:d=${c.fade ?? 0.03},areverse`,
  ].filter(Boolean).join(',')
  const dur = end - c.start
  const out = join(OUT, `${c.id}.wav`)
  const raw = join(CACHE, 'raw.wav')
  mkdirSync(dirname(out), { recursive: true })
  // Deux passes : découpe mono, puis normalisation crête mesurée sur le fichier réel.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-af', chain, '-ac', '1', '-c:a', 'pcm_f32le', raw])
  const gain = c.peak - measurePeak(raw)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', `volume=${gain.toFixed(2)}dB`, '-c:a', 'pcm_s16le', out])
  credits[`${c.id}.wav`] = { source: c.src.page, author: c.src.author, title: c.title, license: CC0 }
  console.log(`${c.id}.wav  ≤${dur.toFixed(3)} s  gain ${gain.toFixed(1)} dB`)
}
writeFileSync(join(OUT, 'credits.json'), JSON.stringify(credits, null, 1))
console.log(`${CUES.length} sons -> public/sfx/freesound (credits.json). Lancer ensuite : npm run sfx:index`)
