// Diretta OS: rifà giugnoh.gif (sfondo trasparente) dalla pagina vera /o/nome: gli otto numeri di Giugnoh in fila,
// fotogramma per fotogramma, poi ffmpeg li cuce. Serve il server acceso (node server.mjs), Edge e ffmpeg.
//   node strumenti/giugnoh-gif.mjs            (DIRETTA_PORTA=2351 per usare un'altra copia del server)
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PORTA = +process.env.DIRETTA_PORTA || 2350
const AL_SECONDO = 15, DURATA = 2.6 * 8 // (GIRO_NOME in pubblico/pezzi.js)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'giugnoh-'))
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f))
const p = spawn(edge, ['--headless=new', '--remote-debugging-port=0', '--hide-scrollbars', '--no-first-run', '--window-size=1920,1080', `--user-data-dir=${path.join(dir, 'profilo')}`, 'about:blank'], { stdio: 'ignore' })
const dormi = (t) => new Promise((r) => setTimeout(r, t))
let chiudi = null
const fine = async (codice) => {
  try { await Promise.race([chiudi?.(), dormi(1500)]) } catch {}
  // su Windows Edge senza finestra non si chiude da solo: via tutti i processi con questa cartella di profilo
  spawnSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${path.basename(dir)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' })
  setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }) } catch {} process.exit(codice) }, 500)
}
try {
  let porta = null
  for (let i = 0; i < 300 && !porta; i++) { await dormi(200); try { porta = +fs.readFileSync(path.join(dir, 'profilo', 'DevToolsActivePort'), 'utf8').split('\n')[0] } catch {} }
  if (!porta) throw new Error('Edge non si è aperto')
  let ws
  for (let i = 0; i < 100 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${porta}/json`)).json(); const t = l.find((x) => x.type === 'page'); if (t) ws = new WebSocket(t.webSocketDebuggerUrl) } catch {} if (!ws) await dormi(200) }
  await new Promise((r, n) => { ws.onopen = r; ws.onerror = n })
  let n = 0; const attese = new Map()
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attese.has(d.id)) { attese.get(d.id)(d.result); attese.delete(d.id) } }
  const cdp = (method, params = {}) => new Promise((r) => { const i = ++n; attese.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  chiudi = () => cdp('Browser.close')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA}/o/nome?gif&sempre&lente=10` })
  await dormi(2500)
  // il riquadro: la scritta ferma più il margine che serve ai salti, al viaggio e ai battiti
  const r = await cdp('Runtime.evaluate', { expression: 'JSON.stringify(document.querySelector(".n-parola").getBoundingClientRect())', returnByValue: true })
  const b = JSON.parse(r.result.value)
  const clip = { x: Math.max(0, Math.floor(b.left - 90)), y: Math.max(0, Math.floor(b.top - 110)), width: Math.ceil(b.width + 180), height: Math.ceil(b.height + 160), scale: 1 }
  const tot = Math.round(DURATA * AL_SECONDO)
  for (let i = 0; i < tot; i++) {
    await cdp('Runtime.evaluate', { expression: `__nome(${(i / AL_SECONDO).toFixed(4)})` })
    const s = await cdp('Page.captureScreenshot', { format: 'png', clip })
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(s.data, 'base64'))
  }
  const fatto = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(AL_SECONDO), '-i', path.join(dir, 'f%04d.png'), '-filter_complex', '[0:v]split[a][b];[a]palettegen=reserve_transparent=1:max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:alpha_threshold=128', '-gifflags', '-transdiff', '-loop', '0', path.join(QUI, 'giugnoh.gif')], { stdio: 'inherit' })
  console.log(fatto.status === 0 ? `fatto: giugnoh.gif, ${clip.width} × ${clip.height}, ${tot} fotogrammi, ${(fs.statSync(path.join(QUI, 'giugnoh.gif')).size / 1024).toFixed(0)} KB` : 'ffmpeg non ce l’ha fatta')
  await fine(fatto.status ?? 1)
} catch (e) { console.error('giugnoh.gif:', e.message); await fine(1) }
