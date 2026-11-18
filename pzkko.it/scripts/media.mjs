// pzkko.it: scrive public/assets/media.js dalle cartelle di public/media/p/.
// Ogni cartella è un progetto e contiene le sue catture vere: cover.webp (1280 × 720),
// 01.webp, 02.webp… (la galleria), loop.mp4 (facoltativo) e meta.json con misure e didascalie.
// Uso: npm run media
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const dir = join(root, 'media', 'p')
// l'impronta del file va nell'indirizzo: /media/ resta in cache un mese
const v = (file) => createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8)
const url = (key, file) => `/media/p/${key}/${file}?v=${v(join(dir, key, file))}`

const out = {}
for (const key of existsSync(dir) ? readdirSync(dir).sort() : []) {
  const metaFile = join(dir, key, 'meta.json')
  if (!existsSync(metaFile)) continue
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'))
  const has = (f) => f && existsSync(join(dir, key, f))
  if (!has('cover.webp')) continue
  out[key] = {
    cover: url(key, 'cover.webp'),
    video: meta.video && has(meta.video.file) ? { src: url(key, meta.video.file), w: meta.video.w, h: meta.video.h, seconds: meta.video.seconds } : null,
    shots: (meta.shots || []).filter((s) => has(s.file)).map((s) => ({ src: url(key, s.file), w: s.w, h: s.h, it: s.it || '', en: s.en || '' })),
  }
}
const body = `// Generato da scripts/media.mjs (npm run media): non modificare a mano.\n// Le catture vere dei progetti in public/media/p/, con misure, didascalie e impronta del file.\nexport const MEDIA = ${JSON.stringify(out, null, 1)}\n`
writeFileSync(join(root, 'assets', 'media.js'), body)
console.log(`media.js: ${Object.keys(out).length} progetti (${Object.keys(out).join(', ') || 'nessuno'})`)
