#!/usr/bin/env node
/**
 * Indexe public/sfx/** et génère :
 *   - public/sfx/manifest.json           {id, file, source, license, duration}
 *   - src/motion/audio/sfx-registry.ts   ids typés (SfxId) + durées
 *
 * À relancer après tout ajout de son (téléchargé ou généré par ElevenLabs) :
 *   npm run sfx:index
 *
 * Chaque dossier racine de public/sfx correspond à UNE source, avec sa licence
 * déclarée ci-dessous. Un dossier inconnu fait échouer le script : on ne met
 * pas dans une vidéo un son dont on ne connaît pas la licence.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SFX_DIR = join(ROOT, 'public/sfx')

const SOURCES = {
  uisfx: { source: 'https://github.com/romainsimon/uisfx', license: 'CC0-1.0' },
  'kenney-interface': { source: 'https://kenney.nl/assets/interface-sounds', license: 'CC0-1.0' },
  remotion: { source: 'https://remotion.media (whoosh, mouse-click, page-turn)', license: 'CC0-1.0' },
  // Enregistrements CC0 de plusieurs auteurs : source/auteur exacts PAR FICHIER dans
  // public/sfx/freesound/credits.json (écrit par scripts/fetch-classic-sfx.mjs).
  freesound: { source: 'https://freesound.org (voir credits.json)', license: 'CC0-1.0', perFile: true },
  'synth': { source: 'Synthèse maison (scripts/synth-sfx.py), œuvre originale', license: 'CC0-1.0' },
  elevenlabs: { source: 'ElevenLabs Sound Effects API (généré par scripts/elevenlabs-sfx.mjs)', license: 'ElevenLabs paid plan, commercial use' },
}

const AUDIO = /\.(mp3|wav|ogg|m4a|aac)$/i

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : AUDIO.test(name) ? [path] : []
  })
}

function duration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])
  return Math.round(Number(out.toString().trim()) * 1000) / 1000
}

const creditCache = {}
function creditsOf(top) {
  const path = join(SFX_DIR, top, 'credits.json')
  creditCache[top] ??= existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
  return creditCache[top]
}

const entries = walk(SFX_DIR)
  .sort()
  .map((file) => {
    const rel = relative(SFX_DIR, file).split(sep).join('/')
    const top = rel.split('/')[0]
    const meta = SOURCES[top]
    if (!meta) throw new Error(`Source inconnue pour ${rel} : déclarer "${top}" dans SOURCES avec sa licence.`)
    const { perFile, ...base } = meta
    let credit = {}
    if (perFile) {
      const credits = creditsOf(top)
      credit = credits[rel.slice(top.length + 1)]
      if (!credit?.license || !credit?.source) throw new Error(`${rel} : pas d'entrée source+licence dans public/sfx/${top}/credits.json.`)
    }
    return { id: rel.replace(AUDIO, ''), file: `sfx/${rel}`, ...base, ...credit, duration: duration(file) }
  })

writeFileSync(join(SFX_DIR, 'manifest.json'), JSON.stringify(entries, null, 1))

const lines = entries.map((e) => `  ${JSON.stringify(e.id)}: { file: ${JSON.stringify(e.file)}, duration: ${e.duration} },`)
writeFileSync(
  join(ROOT, 'src/motion/audio/sfx-registry.ts'),
  `// GÉNÉRÉ par scripts/sfx-manifest.mjs — ne pas éditer. Sources et licences : public/sfx/manifest.json\n` +
    `export const SFX_REGISTRY = {\n${lines.join('\n')}\n} as const\n\n` +
    `export type SfxId = keyof typeof SFX_REGISTRY\n`
)

console.log(`${entries.length} sons indexés -> public/sfx/manifest.json + src/motion/audio/sfx-registry.ts`)
