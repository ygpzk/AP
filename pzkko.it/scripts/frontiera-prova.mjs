// frontiera-prova.mjs — apre /frontiera/ in Edge senza finestra (con la fotocamera finta) e
// fotografa un esperimento, raccogliendo gli errori della console. Serve per provare le dieci
// app senza mouse.
//
// Uso:
//   node scripts/frontiera-prova.mjs --app ink --foto C:\temp\ink.png
//   node scripts/frontiera-prova.mjs --app busta --js-file C:\temp\prova.js --foto C:\temp\busta.png
//   node scripts/frontiera-prova.mjs --app occhio --mobile --foto C:\temp\occhio.png
//
// Opzioni: --app <id> (senza: la pagina), --w <px>, --h <px>, --mobile, --attesa <ms>,
//          --js "<codice>" o --js-file <file> (girato dentro la pagina, il risultato torna in JSON),
//          --url <percorso>, --foto <file>, --tempo <ms> (tempo virtuale prima della foto),
//          --camera / --no-camera (default: finta camera accesa).
import { spawn, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const flag = (n) => process.argv.includes(`--${n}`)
const app = arg('app', '')
const w = +arg('w', 1280)
const h = +arg('h', 900)
const attesa = +arg('attesa', 1600)
const tempo = +arg('tempo', 0)
const mobile = flag('mobile')
const camera = !flag('no-camera')
const urlPath = arg('url', '/frontiera/')
const foto = arg('foto', '') ? resolve(arg('foto')) : join(tmpdir(), `frontiera-${app || 'pagina'}.png`)
const codice = arg('js-file', '') ? readFileSync(resolve(arg('js-file', '')), 'utf8') : arg('js', '')
const porta = 5300 + Math.floor(Math.random() * 600)
const portaCdp = 9300 + Math.floor(Math.random() * 600)
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
if (!edge) throw new Error('Edge non trovato')

const dormi = (ms) => new Promise((r) => setTimeout(r, ms))

const server = spawn(process.execPath, [join(radice, 'scripts/preview.mjs'), String(porta)], { stdio: 'ignore' })
const profilo = mkdtempSync(join(tmpdir(), 'frontiera-edge-'))
const argomenti = [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', `--user-data-dir=${profilo}`, `--remote-debugging-port=${portaCdp}`,
  `--window-size=${w},${h}`, 'about:blank',
]
if (camera) {
  argomenti.push('--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream')
  const finto = join(radice, 'scripts', 'prova-camera.y4m')
  if (existsSync(finto)) argomenti.push('--use-file-for-fake-video-capture=' + finto)
}
const browser = spawn(edge, argomenti, { stdio: 'ignore' })

let ws
let seq = 0
const attese = new Map()
const eventi = []
const errori = []

function manda(method, params = {}) {
  return new Promise((ok, ko) => {
    const id = ++seq
    attese.set(id, { ok, ko })
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => {
      if (attese.delete(id)) ko(new Error(`timeout su ${method}`))
    }, 30000)
  })
}

async function bersaglio() {
  const fine = Date.now() + 20000
  while (Date.now() < fine) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${portaCdp}/json/list`)).json()
      const pagina = lista.find((t) => t.type === 'page')
      if (pagina?.webSocketDebuggerUrl) return pagina.webSocketDebuggerUrl
    } catch {}
    await dormi(200)
  }
  throw new Error('Edge non risponde su CDP')
}

try {
  await dormi(700)
  const wsUrl = await bersaglio()
  ws = new WebSocket(wsUrl)
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko })
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && attese.has(d.id)) {
      const { ok, ko } = attese.get(d.id)
      attese.delete(d.id)
      if (d.error) ko(new Error(d.error.message))
      else ok(d.result)
      return
    }
    if (d.method === 'Runtime.consoleAPICalled') {
      const testo = (d.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ')
      eventi.push({ tipo: d.params.type, testo })
      if (d.params.type === 'error') errori.push(testo)
    }
    if (d.method === 'Runtime.exceptionThrown') {
      const e = d.params.exceptionDetails
      const testo = e.exception?.description || e.text
      eventi.push({ tipo: 'exception', testo })
      errori.push(testo)
    }
    if (d.method === 'Log.entryAdded') {
      const e = d.params.entry
      eventi.push({ tipo: e.level, testo: e.text })
      if (e.level === 'error') errori.push(e.text)
    }
  }
  await manda('Runtime.enable')
  await manda('Log.enable')
  await manda('Page.enable')
  await manda('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 1, mobile,
  })
  if (mobile) await manda('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

  const hash = app ? `#${app}` : ''
  await manda('Page.navigate', { url: `http://127.0.0.1:${porta}${urlPath}${hash}` })
  await dormi(attesa)

  if (app) {
    // aspetta che il dialogo sia aperto (il modulo si carica al volo)
    const fine = Date.now() + 8000
    let aperto = false
    while (Date.now() < fine) {
      const r = await manda('Runtime.evaluate', { expression: `!!document.querySelector('dialog[open]')`, returnByValue: true })
      if (r.result?.value) { aperto = true; break }
      await dormi(150)
    }
    if (!aperto) errori.push(`il dialogo ${app} non si è aperto`)
    await dormi(900)
  }

  let risultato = null
  if (codice) {
    try {
      const r = await manda('Runtime.evaluate', {
        expression: `(async () => { ${codice} })()`, awaitPromise: true, returnByValue: true, userGesture: true,
      })
      risultato = r.result?.value ?? r.result?.description ?? null
      if (r.exceptionDetails) errori.push(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
    } catch (e) {
      errori.push(String(e.message || e))
    }
    await dormi(400)
  }

  if (tempo) await dormi(tempo)

  const scatto = await manda('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(foto, Buffer.from(scatto.data, 'base64'))

  // un riassunto della pagina, per i log
  const info = await manda('Runtime.evaluate', {
    expression: `(() => {
      const d = document.querySelector('dialog[open]')
      return {
        titolo: document.title,
        dialogo: d ? d.dataset.lab : null,
        stato: d?.querySelector('.lab-stato')?.textContent || '',
        altezza: document.documentElement.scrollHeight,
        larghezza: document.documentElement.scrollWidth,
        orizzontale: document.documentElement.scrollWidth > window.innerWidth + 1,
      }
    })()`,
    returnByValue: true,
  })
  console.log(JSON.stringify({
    app: app || '(pagina)', foto, info: info.result?.value, risultato,
    errori: [...new Set(errori)], eventi: eventi.slice(-40),
  }, null, 2))
} finally {
  try { await manda('Browser.close') } catch {}
  try { ws?.close() } catch {}
  try { execFileSync('taskkill', ['/F', '/T', '/PID', String(browser.pid)], { stdio: 'ignore' }) } catch {}
  server.kill()
  await dormi(700)
  try { rmSync(profilo, { recursive: true, force: true }) } catch {}
}
