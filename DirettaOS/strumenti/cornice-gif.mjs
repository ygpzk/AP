// Diretta OS: rifà cornice.gif (1920 × 1080, sfondo trasparente, il bordo che gira) dalla pagina vera /o/cornice.
// Serve il server acceso (node server.mjs), Edge e ffmpeg.   node strumenti/cornice-gif.mjs
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const FOTOGRAMMI = 36, AL_SECONDO = 12 // mezzo giro: i colori si ripetono due volte, quindi il ciclo torna uguale
const porta = 9400 + Math.floor(Math.random() * 400), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cornice-'))
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f))
const p = spawn(edge, ['--headless=new', `--remote-debugging-port=${porta}`, '--hide-scrollbars', '--window-size=1920,1080', `--user-data-dir=${path.join(tmp, 'profilo')}`, 'about:blank'], { stdio: 'ignore' })
const dormi = (t) => new Promise((r) => setTimeout(r, t))
let ws
for (let i = 0; i < 40 && !ws; i++) { await dormi(300); try { const l = await (await fetch(`http://127.0.0.1:${porta}/json`)).json(); const t = l.find((x) => x.type === 'page'); if (t) ws = new WebSocket(t.webSocketDebuggerUrl) } catch {} }
await new Promise((r) => (ws.onopen = r))
let n = 0; const attese = new Map()
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attese.has(d.id)) { attese.get(d.id)(d.result); attese.delete(d.id) } }
const cdp = (method, params = {}) => new Promise((r) => { const i = ++n; attese.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
await cdp('Page.navigate', { url: 'http://127.0.0.1:2350/o/cornice?sempre&fase=0' })
await dormi(2500)
for (let i = 0; i < FOTOGRAMMI; i++) {
  await cdp('Runtime.evaluate', { expression: `__cornice(${(i / FOTOGRAMMI) * 180})` }) // (la cornice è disegnata su quattro tele: pezzi.js)
  await dormi(60)
  const r = await cdp('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(tmp, `f${String(i).padStart(3, '0')}.png`), Buffer.from(r.data, 'base64'))
}
// (su Windows Edge senza finestra non si chiude da solo: Browser.close, poi via i processi con questa cartella di profilo)
try { await Promise.race([cdp('Browser.close'), dormi(1500)]) } catch {}
spawnSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${path.basename(tmp)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' })
const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(AL_SECONDO), '-i', path.join(tmp, 'f%03d.png'), '-filter_complex', '[0:v]split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=dither=none:alpha_threshold=128', '-gifflags', '-transdiff', '-loop', '0', path.join(QUI, 'cornice.gif')], { stdio: 'inherit' })
fs.rmSync(tmp, { recursive: true, force: true })
console.log(r.status === 0 ? `fatto: cornice.gif, ${(fs.statSync(path.join(QUI, 'cornice.gif')).size / 1024).toFixed(0)} KB` : 'ffmpeg non ce l’ha fatta')
process.exit(r.status ?? 1)
