#!/usr/bin/env node
/**
 * Voix off ElevenLabs, synchronisée au mot.
 *
 *   npm run voiceover -- voiceover/example.json     génère (avec cache)
 *   npm run voiceover -- --voices                         liste tes voix + voix FR partagées
 *
 * Entrée : un script JSON (voir voiceover/example.json) :
 *   { "video": "example", "voiceId": "...", "modelId": "eleven_multilingual_v2",
 *     "languageCode": "fr", "seed": 42, "voiceSettings": {...},
 *     "lines": [ { "id": "hook", "text": "..." }, ... ] }
 *
 * Sortie, dans public/voiceover/<video>/ :
 *   <id>.mp3                 l'audio de la réplique
 *   index.json               [{ id, text, file, duration, words: [{ text, start, end }] }]
 *
 * Chaque réplique est générée avec previous_text / next_text pour que la
 * prosodie s'enchaîne d'une scène à l'autre. Le cache repose sur un hash du
 * texte et des réglages : relancer ne regénère (et ne facture) que ce qui a changé.
 *
 * Clé : ELEVENLABS_API_KEY, lue depuis l'environnement ou .env.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const API = 'https://api.elevenlabs.io'
const KEY = process.env.ELEVENLABS_API_KEY
const args = process.argv.slice(2)

if (!KEY) {
  console.error('ELEVENLABS_API_KEY manquant. Ajoute-le dans .env (ELEVENLABS_API_KEY=...).')
  process.exit(1)
}

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`)
  return res.json()
}

// --voices : aide au casting
if (args.includes('--voices')) {
  const mine = await api('/v1/voices')
  console.log('\n== Tes voix ==')
  for (const v of mine.voices ?? []) console.log(`${v.voice_id}  ${v.name}  [${v.category}] ${v.labels ? JSON.stringify(v.labels) : ''}`)
  const shared = await api('/v1/shared-voices?language=fr&page_size=30&sort=usage_character_count_1y')
  console.log('\n== Voix partagées FR (les plus utilisées) ==')
  for (const v of shared.voices ?? []) console.log(`${v.voice_id}  ${v.name}  ${v.gender ?? ''} ${v.age ?? ''} ${v.accent ?? ''}  ${v.use_case ?? ''}  ${v.preview_url ?? ''}`)
  process.exit(0)
}

const scriptPath = args.find((a) => !a.startsWith('--'))
if (!scriptPath) {
  console.error('Usage : npm run voiceover -- voiceover/<video>.json   |   npm run voiceover -- --voices')
  process.exit(1)
}

const script = JSON.parse(readFileSync(resolve(scriptPath), 'utf8'))
const {
  video,
  voiceId,
  modelId = 'eleven_multilingual_v2',
  languageCode = 'fr',
  seed = 42,
  voiceSettings = { stability: 0.5, similarity_boost: 0.75, style: 0, speed: 1, use_speaker_boost: true },
  pronunciationDictionaryLocators,
  // Accélère (ou ralentit) toutes les répliques sans changer la hauteur (ffmpeg atempo).
  // L'audio ElevenLabs d'origine est gardé en <id>.src.mp3 : changer le tempo ne coûte aucun crédit.
  tempo = 1,
  // Coupe les silences / respirations avant le premier mot et après le dernier (secondes gardées de chaque côté).
  trim,
  lines,
} = script
if (!video || !voiceId || voiceId.startsWith('<') || !Array.isArray(lines)) throw new Error('Le script doit définir video, voiceId (réel) et lines[].')

const outDir = join(process.cwd(), 'public/voiceover', video)
mkdirSync(outDir, { recursive: true })
const indexPath = join(outDir, 'index.json')
const previous = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : []

/** Regroupe l'alignement caractère par caractère en mots. */
function toWords(alignment) {
  const words = []
  let current = null
  // Les balises d'interprétation eleven_v3 ([excited], [laughs softly]…) ne sont pas prononcées : on les saute.
  let inTag = false
  alignment.characters.forEach((char, i) => {
    if (char === '[') inTag = true
    if (inTag) {
      if (char === ']') inTag = false
      return
    }
    const start = alignment.character_start_times_seconds[i]
    const end = alignment.character_end_times_seconds[i]
    if (/\s/.test(char)) {
      if (current) words.push(current)
      current = null
      return
    }
    if (!current) current = { text: '', start, end }
    current.text += char
    current.end = end
  })
  if (current) words.push(current)
  return words
}

/**
 * Produit l'audio final : rognage éventuel des silences de bord, puis tempo
 * (global, ou `tempo` propre à la réplique), et recale les timestamps.
 */
function applyTempo(srcAbs, abs, src, lineTempo) {
  const t = lineTempo ?? tempo
  const words = src.words
  let a = 0
  let b = src.duration
  if (trim && words.length) {
    // On se fie au son réel, pas seulement aux timestamps : une consonne d'attaque (le K de « Kickoff »)
    // démarre souvent avant le mot aligné, et ElevenLabs range la respiration finale dans le dernier mot.
    const quiet = silences(srcAbs)
    const lead = quiet.find((q) => q.start <= 0.01)
    const onset = lead ? lead.end : 0
    a = Math.max(0, Math.min(words[0].start, onset) - trim.before)
    const lastStart = words.at(-1).start
    // Une respiration suit une vraie pause (≥ 0,2 s) ; une consonne finale douce (le « t » de « context ») non.
    const tail = quiet.filter((q) => q.start > lastStart && q.end - q.start >= 0.2 && src.duration - q.end < 0.35).at(-1)
    b = tail ? Math.min(src.duration, tail.start + trim.after) : src.duration
  }
  const filters = [`atrim=${a.toFixed(3)}:${b.toFixed(3)}`, 'asetpts=PTS-STARTPTS']
  if (trim) filters.push('afade=t=in:d=0.02', `afade=t=out:st=${Math.max(0, b - a - 0.04).toFixed(3)}:d=0.04`)
  if (t !== 1) filters.push(`atempo=${t}`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', srcAbs, '-af', filters.join(','), '-b:a', '128k', abs])
  const r = (x) => Math.round(((x - a) / t) * 1000) / 1000
  return {
    tempo: t,
    trim: trim ?? null,
    duration: r(b),
    words: words.map((w) => ({ text: w.text, start: r(w.start), end: r(w.end) })),
  }
}
/** Silences détectés (bord et intérieur) : [{ start, end }] en secondes. */
function silences(file) {
  // silencedetect écrit sur stderr.
  const { stderr } = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-af', 'silencedetect=noise=-38dB:d=0.06', '-f', 'null', '-'], { encoding: 'utf8' })
  const out = []
  for (const m of stderr.matchAll(/silence_(start|end): ([0-9.]+)/g)) {
    if (m[1] === 'start') out.push({ start: Number(m[2]), end: Infinity })
    else if (out.length) out[out.length - 1].end = Number(m[2])
  }
  return out
}
const stamp = (line) => JSON.stringify({ t: line.tempo ?? tempo, trim: trim ?? null, v: 2 })

const index = []
for (const [i, line] of lines.entries()) {
  const body = {
    text: line.text,
    model_id: line.modelId ?? modelId,
    language_code: languageCode,
    seed,
    voice_settings: { ...voiceSettings, ...(line.voiceSettings ?? {}) },
    // eleven_v3 refuse previous_text / next_text.
    ...((line.modelId ?? modelId) === 'eleven_v3' ? {} : { previous_text: lines[i - 1]?.text, next_text: lines[i + 1]?.text }),
    ...(pronunciationDictionaryLocators ? { pronunciation_dictionary_locators: pronunciationDictionaryLocators } : {}),
  }
  const hash = createHash('sha256').update(JSON.stringify({ voiceId, body })).digest('hex').slice(0, 16)
  const file = `voiceover/${video}/${line.id}.mp3`
  const cached = previous.find((e) => e.id === line.id && e.hash === hash)

  const abs = join(process.cwd(), 'public', file)
  const srcAbs = abs.replace(/\.mp3$/, '.src.mp3')

  if (cached && existsSync(abs)) {
    // Anciennes entrées sans source : l'audio actuel devient la source.
    if (!cached.src) {
      if (!existsSync(srcAbs)) writeFileSync(srcAbs, readFileSync(abs))
      cached.src = { duration: cached.duration, words: cached.words }
      cached.tempo = cached.tempo ?? 1
    }
    if (cached.stamp !== stamp(line)) Object.assign(cached, applyTempo(srcAbs, abs, cached.src, line.tempo), { stamp: stamp(line) })
    console.log(`= ${line.id} (cache)`)
    index.push(cached)
    continue
  }

  console.log(`→ ${line.id} : « ${line.text.slice(0, 60)}${line.text.length > 60 ? '…' : ''} »`)
  const res = await api(`/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  writeFileSync(srcAbs, Buffer.from(res.audio_base64, 'base64'))
  const alignment = res.normalized_alignment ?? res.alignment
  const src = {
    words: alignment ? toWords(alignment) : [],
    duration: alignment ? alignment.character_end_times_seconds.at(-1) ?? 0 : 0,
  }
  index.push({ id: line.id, text: line.text, file, hash, src, stamp: stamp(line), ...applyTempo(srcAbs, abs, src, line.tempo) })
}

writeFileSync(indexPath, JSON.stringify(index, null, 1))
const total = index.reduce((s, e) => s + e.duration, 0)
console.log(`\n${index.length} répliques, ${total.toFixed(1)}s -> public/voiceover/${video}/index.json`)
