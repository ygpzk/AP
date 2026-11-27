// Le foto delle miniature vive, per vederle senza aprire il browser (27.11.2026).
// Uso: node scripts/miniature-foto.mjs --solo synth,sabbia --tempi 0.5,2,4,6 [--su 1] [--larghezza 480,240] [--out foto.png]
// Accende la pagina di prova /miniature/ con preview.mjs (le stesse intestazioni e CSP di Vercel) su una porta sua,
// e la fotografa con Edge senza finestra, con un profilo temporaneo (non tocca l'Edge di tutti i giorni).
import { spawn, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const solo = arg('solo', '')
const tempi = arg('tempi', '0.5,2,4')
const su = arg('su', '0')
const larghezze = arg('larghezza', '480').split(',').map(Number)
const out = resolve(arg('out', join(tmpdir(), `miniature-${solo.replace(/,/g, '-') || 'tutte'}.png`)))
const porta = 5200 + Math.floor(Math.random() * 700)
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
if (!edge) throw new Error('Edge non trovato')

const server = spawn(process.execPath, [join(radice, 'scripts/preview.mjs'), String(porta)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const avvio = Date.now()
const profilo = mkdtempSync(join(tmpdir(), 'mini-edge-'))
try {
  const n = solo ? solo.split(',').length : 33
  const nt = tempi.split(',').length
  const W = Math.min(7800, 60 + nt * larghezze.reduce((a, w) => a + w + 14, 0))
  const H = Math.min(12000, 110 + n * (Math.max(...larghezze) * 9 / 16 + 34))
  const url = `http://127.0.0.1:${porta}/miniature/?${new URLSearchParams({ ...(solo && { solo }), tempi, su, larghezza: larghezze.join(',') })}`
  execFileSync(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profilo}`, `--window-size=${Math.ceil(W)},${Math.ceil(H)}`, '--virtual-time-budget=15000',
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
  // msedge.exe lascia vivi i suoi processi figli: si chiudono quelli col nostro profilo, e solo quelli
  const nome = profilo.split(/[\\/]/).pop()
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-Command',
      `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${nome}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore', timeout: 30000 })
  } catch {}
  await new Promise((r) => setTimeout(r, 500))
  try { rmSync(profilo, { recursive: true, force: true }) } catch {}
}
