// Diretta OS · scatta: apre UNA pagina in Edge senza finestra, la fotografa e chiude tutto per bene.
//
//   node strumenti/scatta.mjs <indirizzo> <uscita.png> [opzioni]
//
//   --w 1920 --h 1080     la finestra (la tela delle scene è 1920 × 1080)
//   --scala 0.5           rimpicciolisce il PNG salvato (0.5 = 960 × 540: basta per guardarlo, pesa un quarto)
//   --attesa 1500         millisecondi dopo il caricamento, prima del primo scatto
//   --scatti 0,2,5        più scatti, a questi secondi dal primo: uscita-0.png, uscita-2.png, uscita-5.png
//   --js file.js          JavaScript da eseguire nella pagina dopo l'attesa (può essere asincrono; il valore finisce a schermo)
//   --jsogni file.js      JavaScript da eseguire prima di OGNI scatto; riceve `window.__scatto` = secondi di quello scatto
//   --ritaglio x,y,w,h    fotografa solo quel rettangolo (in pixel della pagina)
//   --senza-gpu           niente scheda video (di norma è accesa: serve a WebGL)
//   --muto                non stampa la console della pagina
//
// Regole di questo pc (vedi README): un Edge alla volta, si chiude con Browser.close e poi si controlla che
// non resti nessun processo del suo profilo. Se resta, lo si ferma per profilo, mai per nome.
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'

const A = process.argv.slice(2)
const opz = (n, d) => { const i = A.indexOf(`--${n}`); return i >= 0 ? A[i + 1] : d }
const ha = (n) => A.includes(`--${n}`)
const CON_VALORE = ['w', 'h', 'scala', 'attesa', 'scatti', 'js', 'jsogni', 'ritaglio']
const liberi = A.filter((x, i) => !x.startsWith('--') && !CON_VALORE.includes((A[i - 1] ?? '').slice(2)))
const [indirizzo, uscita0] = liberi
if (!indirizzo || !uscita0) { console.error('uso: node strumenti/scatta.mjs <indirizzo> <uscita.png> [--scatti 0,2,5] [--scala 0.5] [--js file.js]'); process.exit(2) }
const uscita = resolve(uscita0)
mkdirSync(dirname(uscita), { recursive: true })
const W = +opz('w', 1920), H = +opz('h', 1080), SCALA = +opz('scala', 1), ATTESA = +opz('attesa', 1500)
const scatti = opz('scatti') ? opz('scatti').split(',').map(Number) : null
const ritaglio = opz('ritaglio') ? opz('ritaglio').split(',').map(Number) : null

const EDGE = process.env.EDGE ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const profilo = join(tmpdir(), `direttaos-scatta-${process.pid}-${Date.now()}`)
mkdirSync(profilo, { recursive: true })
const attesa = (ms) => new Promise((r) => setTimeout(r, ms))

const edge = spawn(EDGE, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profilo}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
  ...(ha('senza-gpu') ? ['--disable-gpu'] : ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist']),
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  '--autoplay-policy=no-user-gesture-required', `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' })

let ws, chiuso = false
async function chiudi(codice) {
  if (chiuso) return
  chiuso = true
  try { if (ws?.readyState === 1) { ws.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); await attesa(1200) } } catch {}
  // quello che resta di questo profilo (e solo di questo) si ferma qui
  try {
    const ps = `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${profilo.replace(/'/g, "''")}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $_.ProcessId }`
    const rimasti = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' }).trim()
    if (rimasti) console.error(`scatta: fermati ${rimasti.split(/\s+/).length} processi rimasti del profilo`)
  } catch {}
  await attesa(300)
  try { rmSync(profilo, { recursive: true, force: true }) } catch {}
  process.exit(codice)
}
process.on('SIGINT', () => chiudi(130))
const guardia = setTimeout(() => { console.error('scatta: troppo tempo, chiudo'); chiudi(3) }, 120000 + (scatti ? Math.max(...scatti) * 1000 : 0))

try {
  // la porta la sceglie Edge e la scrive nel profilo
  let porta
  for (let i = 0; i < 150 && !porta; i++) {
    const f = join(profilo, 'DevToolsActivePort')
    if (existsSync(f)) porta = +readFileSync(f, 'utf8').split('\n')[0]
    else await attesa(100)
  }
  if (!porta) throw new Error('Edge non parte')
  const bersagli = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()
  const pagina = bersagli.find((b) => b.type === 'page')
  ws = new WebSocket(pagina.webSocketDebuggerUrl)
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('niente filo con Edge')) })
  let n = 0
  const sospesi = new Map(), ascolti = new Map()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && sospesi.has(m.id)) { const [ok, no] = sospesi.get(m.id); sospesi.delete(m.id); m.error ? no(new Error(m.error.message)) : ok(m.result) }
    else if (m.method) for (const f of ascolti.get(m.method) ?? []) f(m.params)
  }
  const dì = (method, params = {}) => new Promise((ok, no) => { const id = ++n; sospesi.set(id, [ok, no]); ws.send(JSON.stringify({ id, method, params })) })
  const quando = (ev, f) => { ascolti.set(ev, [...(ascolti.get(ev) ?? []), f]) }

  await dì('Page.enable'); await dì('Runtime.enable'); await dì('Log.enable')
  if (!ha('muto')) {
    quando('Runtime.consoleAPICalled', (p) => { if (['error', 'warning', 'log', 'info'].includes(p.type)) console.log(`[pagina ${p.type}]`, p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 600)) })
    quando('Runtime.exceptionThrown', (p) => console.log('[pagina ECCEZIONE]', (p.exceptionDetails.exception?.description ?? p.exceptionDetails.text ?? '').slice(0, 900)))
    quando('Log.entryAdded', (p) => { if (p.entry.level === 'error') console.log('[pagina rete/errore]', p.entry.text.slice(0, 300), p.entry.url ?? '') })
  }
  await dì('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
  await dì('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  const caricata = new Promise((ok) => quando('Page.loadEventFired', ok))
  await dì('Page.navigate', { url: indirizzo })
  await Promise.race([caricata, attesa(20000)])
  await attesa(ATTESA)
  const esegui = async (file) => {
    const r = await dì('Runtime.evaluate', { expression: `(async () => { ${readFileSync(file, 'utf8')}\n })()`, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) console.log('[js ECCEZIONE]', r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    else if (r.result?.value !== undefined) console.log('[js]', typeof r.result.value === 'string' ? r.result.value : JSON.stringify(r.result.value))
  }
  if (opz('js')) await esegui(opz('js'))
  const foto = async (file, sec) => {
    if (opz('jsogni')) { await dì('Runtime.evaluate', { expression: `window.__scatto = ${sec}` }); await esegui(opz('jsogni')) }
    const clip = ritaglio ? { x: ritaglio[0], y: ritaglio[1], width: ritaglio[2], height: ritaglio[3], scale: SCALA } : { x: 0, y: 0, width: W, height: H, scale: SCALA }
    const r = await dì('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: false })
    writeFileSync(file, Buffer.from(r.data, 'base64'))
    console.log('scatta:', file)
  }
  if (scatti) {
    const t0 = Date.now()
    for (const s of scatti) {
      const manca = s * 1000 - (Date.now() - t0)
      if (manca > 0) await attesa(manca)
      await foto(uscita.replace(/\.png$/i, `-${s}.png`), s)
    }
  } else await foto(uscita, 0)
  clearTimeout(guardia)
  await chiudi(0)
} catch (e) {
  console.error('scatta: errore:', e.message)
  clearTimeout(guardia)
  await chiudi(1)
}
