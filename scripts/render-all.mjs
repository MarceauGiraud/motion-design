#!/usr/bin/env node
/**
 * Rend toutes les compositions du dossier Studio "Videos" (vidéos finales +
 * templates) en mp4 dans out/videos/<id>.mp4, via la CLI Remotion (aucune dépendance).
 *
 *   npm run render:all
 *   node scripts/render-all.mjs --only=Template-          # regex sur l'id
 *   node scripts/render-all.mjs --scale=0.5 --dry-run
 *   node scripts/render-all.mjs --props=./props.json --only=Template-Changelog
 *
 * Options :
 *   --only=<regex>      ne rend que les ids qui matchent
 *   --skip=<regex>      ignore les ids qui matchent
 *   --scale=<n>         échelle de rendu (défaut 1)
 *   --concurrency=<n>   passé à remotion render
 *   --props=<file|json> props d'entrée (surcharge des defaultProps)
 *   --out=<dir>         dossier de sortie (défaut out/videos)
 *   --entry=<file>      point d'entrée (défaut src/index.ts)
 *   --dry-run           liste les ids sans rendre
 *
 * Le bundle est construit UNE fois dans un dossier temporaire puis réutilisé
 * pour chaque rendu (bien plus rapide que de re-bundler par composition), et
 * supprimé à la fin.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=')
    return [k, v.length ? v.join('=') : true]
  })
)

const ENTRY = args.entry ?? 'src/index.ts'
const OUT = args.out ?? 'out/videos'
/** Tout ce qui vit sous Catalog/ ou Platform/ dans le Studio (préfixes d'ids). */
const NOT_VIDEOS = /^(Primitives|Text|Transitions|Morph|Camera|UI|Backgrounds|Brand|Audio)-|^PlatformPreview$/

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function run(cmdArgs, { capture = false } = {}) {
  const res = spawnSync(npx, ['remotion', ...cmdArgs], { stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', encoding: 'utf8' })
  if (res.status !== 0) throw new Error(`remotion ${cmdArgs[0]} a échoué (code ${res.status})`)
  return res.stdout ?? ''
}

const bundleDir = mkdtempSync(path.join(tmpdir(), 'render-all-'))
let failures = 0
try {
  console.log(`▸ Bundle de ${ENTRY}…`)
  run(['bundle', ENTRY, '--out-dir', bundleDir])

  const propsArgs = args.props ? ['--props', String(args.props)] : []
  const ids = run(['compositions', bundleDir, '-q', ...propsArgs], { capture: true })
    .split(/\s+/)
    .filter(Boolean)
    .filter((id) => !NOT_VIDEOS.test(id))
    .filter((id) => (args.only ? new RegExp(String(args.only)).test(id) : true))
    .filter((id) => (args.skip ? !new RegExp(String(args.skip)).test(id) : true))

  if (ids.length === 0) {
    console.log('Aucune composition à rendre.')
  } else {
    console.log(`▸ ${ids.length} composition(s) : ${ids.join(', ')}`)
  }
  const toRender = args['dry-run'] ? [] : ids
  if (toRender.length) mkdirSync(OUT, { recursive: true })
  for (const [i, id] of toRender.entries()) {
    const file = path.join(OUT, `${id}.mp4`)
    console.log(`\n▸ [${i + 1}/${ids.length}] ${id} → ${file}`)
    const extra = []
    if (args.scale) extra.push(`--scale=${args.scale}`)
    if (args.concurrency) extra.push(`--concurrency=${args.concurrency}`)
    try {
      run(['render', bundleDir, id, file, ...propsArgs, ...extra])
    } catch (err) {
      failures++
      console.error(`✗ ${id} : ${err.message}`)
    }
  }
} finally {
  rmSync(bundleDir, { recursive: true, force: true })
}

if (failures) {
  console.error(`\n${failures} rendu(s) en échec.`)
  process.exit(1)
}
console.log('\n✓ Terminé.')
