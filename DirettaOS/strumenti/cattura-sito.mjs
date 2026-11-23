// Cattura le pagine vere di Diretta OS per pzkko.it (screenshot e un filmato del giro).
// Uso: node strumenti/cattura-sito.mjs <cartella-di-uscita> [indirizzo-base]
// Apre Edge in prova (headless), parla col suo protocollo e salva PNG/JPEG; il filmato lo fa ffmpeg.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const out = resolve(process.argv[2] ?? 'catture')
const base = (process.argv[3] ?? 'http://127.0.0.1:2450').replace(/\/$/, '')
const soloResto = process.argv.includes('--resto')
const soloTutto = process.argv.includes('--tutto')
const soloRegia = process.argv.includes('--regia')
const scena = (process.argv.find((x) => x.startsWith('--scena=')) ?? '').slice(8)
mkdirSync(out, { recursive: true })
const frames = join(tmpdir(), `direttaos-frame-${process.pid}`)
rmSync(frames, { recursive: true, force: true })
mkdirSync(frames, { recursive: true })

const EDGE = process.env.EDGE ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORTA = 9400 + (process.pid % 300)
const profilo = join(tmpdir(), `direttaos-edge-${process.pid}`)
rmSync(profilo, { recursive: true, force: true })
const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${profilo}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows', '--autoplay-policy=no-user-gesture-required',
  'about:blank',
], { stdio: 'ignore' })
const stop = () => { try { edge.kill() } catch {} }
process.on('exit', stop)

const attesa = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 100; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORTA}/json/version`)
    if (r.ok) { const j = await r.json(); wsUrl = j.webSocketDebuggerUrl; break }
  } catch {}
  await attesa(100)
}
if (!wsUrl) throw new Error('Edge non risponde')
const pagina = await (await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' })).json()

const ws = new WebSocket(pagina.webSocketDebuggerUrl)
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no })
let n = 0
const inSospeso = new Map()
const eventi = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && inSospeso.has(m.id)) { const { ok, no } = inSospeso.get(m.id); inSospeso.delete(m.id); m.error ? no(new Error(m.error.message)) : ok(m.result) }
  else if (m.method) { for (const f of eventi.get(m.method) ?? []) f(m.params) }
}
const manda = (method, params = {}) => new Promise((ok, no) => {
  const id = ++n
  inSospeso.set(id, { ok, no })
  ws.send(JSON.stringify({ id, method, params }))
  setTimeout(() => { if (inSospeso.has(id)) { inSospeso.delete(id); no(new Error(`${method}: tempo scaduto`)) } }, 90000)
})
const su = (metodo, f) => { if (!eventi.has(metodo)) eventi.set(metodo, []); eventi.get(metodo).push(f) }

await manda('Page.enable')
await manda('Runtime.enable')
await manda('Emulation.setFocusEmulationEnabled', { enabled: true })

async function vai(url, { w = 1920, h = 1080, fondo = { r: 11, g: 9, b: 14, a: 1 }, attendi = 5500 } = {}) {
  await manda('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  await manda('Emulation.setDefaultBackgroundColorOverride', { color: fondo })
  await manda('Page.navigate', { url: base + url })
  await attesa(attendi)
}

async function scatta(file, clip) {
  const r = await manda('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
  writeFileSync(join(out, file), Buffer.from(r.data, 'base64'))
  console.log('scatto', file)
}

if (soloTutto) {
  await vai('/o/tutto?fps=30', { w: 1920, h: 1080, attendi: 6500 })
  await scatta('tutto.png')
  ws.close(); stop(); process.exit(0)
}
if (scena) {
  await vai(`/via/prova.html?scena=${scena}&ora=21:40&meteo=nebbia&gradi=4&t=35`, { w: 1920, h: 1080, attendi: 6500 })
  await scatta(`${scena}.png`)
  ws.close(); stop(); process.exit(0)
}
if (soloRegia) {
  await vai('/', { w: 1920, h: 1080, attendi: 7000 })
  // (al posto della webcam vera: un fondo neutro; i pezzi e tutta la regia sono quelli veri)
  await manda('Runtime.evaluate', { expression: `(() => {
    const f = document.querySelector('#anteprima iframe'); if (!f) return 'no frame';
    const d = f.contentDocument; if (!d) return 'no doc';
    const s = d.createElement('style');
    s.textContent = 'html,body{background:radial-gradient(ellipse at 50% 28%,#31333d 0%,#16151b 58%,#0b090e 100%)!important}#scena{background-image:none!important}.vivo-foto{display:none!important}';
    d.head.appendChild(s);
    return 'ok';
  })()` })
  await attesa(2500)
  await scatta('regia.png')
  ws.close(); stop(); process.exit(0)
}
if (!soloResto) {
  console.log('regia')
  await vai('/', { w: 1920, h: 1080, attendi: 7000 })
  await scatta('regia.png')
  await vai('/muri.html', { w: 1920, h: 1080, attendi: 5000 })
  await scatta('muri.png')
  await vai('/o/tutto?fps=30', { w: 1920, h: 1080, attendi: 6500 })
  await scatta('tutto.png')
  for (const [pagina, file, attesaPagina] of [
    ['/o/nome', 'nome.png', 3500],
    ['/o/tasti', 'tasti.png', 4500],
    ['/o/meteo', 'meteo.png', 4500],
    ['/o/spie', 'spie.png', 3500],
    ['/o/social', 'social.png', 3500],
  ]) {
    console.log(pagina)
    await vai(pagina, { w: 1920, h: 1080, attendi: attesaPagina })
    await scatta(file)
  }
}
for (const [pagina, file, attesaPagina] of [
  ['/tv', 'tv.png', 5000],
  ['/via/prova.html?scena=bosco&ora=22:30&meteo=nebbia&gradi=4&t=20', 'bosco.png', 6500],
]) {
  console.log(pagina)
  await manda('Page.navigate', { url: 'about:blank' })
  await attesa(500)
  await vai(pagina, { w: 1920, h: 1080, attendi: attesaPagina })
  // (i messaggi del browser: non sono parte della tv)
  await manda('Runtime.evaluate', { expression: "for (const s of ['#schermo','#filo']) { const e=document.querySelector(s); if(e) e.style.display='none' }" })
  await attesa(600)
  await scatta(file)
}

// il filmato: il giro delle sovrimpressioni, 9 secondi a 30 fotogrammi
console.log('filmato')
await vai('/o/tutto?fps=30', { w: 1280, h: 720, attendi: 4000 })
let conta = 0
const scriviFrame = (params) => {
  const f = join(frames, `${String(++conta).padStart(5, '0')}.jpg`)
  writeFileSync(f, Buffer.from(params.data, 'base64'))
  manda('Page.screencastFrameAck', { sessionId: params.sessionId }).catch(() => {})
}
su('Page.screencastFrame', scriviFrame)
await manda('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 960, maxHeight: 540, everyNthFrame: 1 })
await attesa(9000)
await manda('Page.stopScreencast')
console.log('fotogrammi', conta)
try {
  const ff = spawn('ffmpeg', ['-y', '-framerate', '30', '-i', join(frames, '%05d.jpg'), '-vf', 'scale=960:540:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(out, 'loop.mp4')], { stdio: 'ignore' })
  await new Promise((ok, no) => { ff.on('exit', (c) => c === 0 ? ok() : no(new Error('ffmpeg ' + c))); ff.on('error', no) })
  console.log('filmato pronto')
} catch (e) { console.error('filmato no:', e.message) }

ws.close()
stop()
for (const d of [profilo, frames]) { try { rmSync(d, { recursive: true, force: true }) } catch {} }
console.log('fatto:', out)
