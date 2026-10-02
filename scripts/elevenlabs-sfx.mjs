#!/usr/bin/env node
/**
 * SFX sur mesure via l'API Sound Effects d'ElevenLabs.
 *
 *   npm run sfx:generate                       génère sfx/prompts.json (avec cache)
 *   npm run sfx:generate -- sfx/autre.json
 *
 * Entrée : [{ "id": "whoosh/airy-01", "prompt": "...", "duration": 0.8,
 *             "promptInfluence": 0.4, "loop": false }]
 * Sortie : public/sfx/elevenlabs/<id>.mp3, puis réindexation (sfx-registry.ts).
 *
 * Chaque génération consomme des crédits : un hash du prompt et des réglages
 * sert de cache, on ne regénère que ce qui a changé.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) {
  console.error('ELEVENLABS_API_KEY manquant. Ajoute-le dans .env (ELEVENLABS_API_KEY=...).')
  process.exit(1)
}

const input = resolve(process.argv[2] ?? 'sfx/prompts.json')
const prompts = JSON.parse(readFileSync(input, 'utf8'))
const outRoot = join(process.cwd(), 'public/sfx/elevenlabs')
const cachePath = join(outRoot, '.cache.json')
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}

for (const p of prompts) {
  const body = {
    text: p.prompt,
    model_id: p.modelId ?? 'eleven_text_to_sound_v2',
    ...(p.duration ? { duration_seconds: p.duration } : {}),
    prompt_influence: p.promptInfluence ?? 0.4,
    ...(p.loop ? { loop: true } : {}),
  }
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16)
  const out = join(outRoot, `${p.id}.mp3`)
  if (cache[p.id] === hash && existsSync(out)) {
    console.log(`= ${p.id} (cache)`)
    continue
  }
  console.log(`→ ${p.id} : ${p.prompt}`)
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${p.id} -> ${res.status} ${await res.text()}`)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, Buffer.from(await res.arrayBuffer()))
  cache[p.id] = hash
  writeFileSync(cachePath, JSON.stringify(cache, null, 1))
}

execFileSync('node', ['scripts/sfx-manifest.mjs'], { stdio: 'inherit' })
