// Le foto delle vignette dello Studio, per vederle senza aprire il browser (27.11.2026).
// Uso: node scripts/studio-foto.mjs --solo radio [--q "stato=offline&musica=0&tema=dark"] [--w 560] [--h 1100]
//                                   [--tempo 6000] [--out foto.png]
// Accende /studio-prova/ (il guscio vero dello Studio con dati finti, vedi public/studio-prova/prova.js) con preview.mjs
// (le stesse intestazioni e CSP di Vercel) su una porta sua, e la fotografa con Edge senza finestra, con un profilo
// temporaneo. --tempo è il tempo virtuale prima della foto (le animazioni vanno avanti di tanto).
import { spawn, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const solo = arg('solo', '')
const extra = arg('q', '')
const w = +arg('w', 560)
const h = +arg('h', 1100)
const tempo = +arg('tempo', 5000)
const out = resolve(arg('out', join(tmpdir(), `studio-${solo.replace(/,/g, '-') || 'tutto'}.png`)))
const porta = 5200 + Math.floor(Math.random() * 700)
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
if (!edge) throw new Error('Edge non trovato')

const server = spawn(process.execPath, [join(radice, 'scripts/preview.mjs'), String(porta)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const avvio = Date.now()
const profilo = mkdtempSync(join(tmpdir(), 'studio-edge-'))
try {
  const qs = new URLSearchParams(extra)
  if (solo) qs.set('solo', solo)
  qs.set('w', String(w))
  const W = solo ? Math.min(7800, 36 + 60 + solo.split(',').length * (w + 40)) : 1280
  const url = `http://127.0.0.1:${porta}/studio-prova/?${qs}`
  execFileSync(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=user-gesture-required',
    `--user-data-dir=${profilo}`, `--window-size=${Math.ceil(W)},${Math.ceil(h)}`, `--virtual-time-budget=${tempo}`,
    '--force-device-scale-factor=1', `--screenshot=${out}`, url], { stdio: 'ignore', timeout: 90000 })
  // msedge.exe passa il lavoro a un altro processo ed esce subito: si aspetta il file
  const fine = Date.now() + 90000
  let ok = false
  while (Date.now() < fine) {
    await new Promise((r) => setTimeout(r, 500))
    if (existsSync(out) && statSync(out).mtimeMs > avvio && statSync(out).size > 0) { await new Promise((r) => setTimeout(r, 800)); ok = true; break }
  }
  if (!ok) throw new Error('la foto non è arrivata')
  console.log(out)
} finally {
  server.kill()
  try { rmSync(profilo, { recursive: true, force: true }) } catch {}
}
