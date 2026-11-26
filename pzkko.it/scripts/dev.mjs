// pzkko.it in locale: i file di public/ e le funzioni di api/ come su Vercel.
// Uso: npm run serve  (porta 5080; la banca è quella vera sul pc, se C:\pzkko-server è acceso)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, normalize, dirname, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(radice, 'public')
const porta = +(process.argv[2] || 5080)
// il segreto resta sul pc: si legge dal file del server, non si scrive da nessuna parte
const conf = 'C:/pzkko-server/config/config.json'
if (!process.env.PZKKO_SERVER_SECRET && existsSync(conf)) {
  const c = JSON.parse(readFileSync(conf, 'utf8'))
  process.env.PZKKO_SERVER_SECRET = c.segreto
  process.env.PZKKO_SERVER_URL ??= `http://127.0.0.1:${c.porta || 8787}`
}
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.zip': 'application/zip', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon' }
const funzioni = new Map()
const SICUREZZA = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // (26.11) il laboratorio accende microfono, camera, MIDI e sensori solo per sé: le altre origini restano fuori.
  'Permissions-Policy': 'camera=(self), microphone=(self), midi=(self), xr-spatial-tracking=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

createServer(async (req, res) => {
  let u
  try { u = new URL(req.url, 'http://x') } catch { res.writeHead(400, SICUREZZA); return res.end() }
  let p
  try { p = decodeURIComponent(u.pathname) } catch { res.writeHead(400, SICUREZZA); return res.end() }
  if (p.includes('\0')) { res.writeHead(400, SICUREZZA); return res.end() }
  const api = /^\/api\/([a-z]+)\/?$/.exec(p)
  if (api) {
    const f = join(radice, 'api', `${api[1]}.mjs`)
    if (!existsSync(f)) { res.writeHead(404, SICUREZZA); return res.end('{}') }
    try {
      if (!funzioni.has(f)) funzioni.set(f, (await import(pathToFileURL(f))).default)
      req.query = Object.fromEntries(u.searchParams)
      return await funzioni.get(f)(req, res)
    } catch (e) { console.error(e); res.writeHead(500, SICUREZZA); return res.end('{"ok":false}') }
  }
  // la vecchia pagina /community/ non esiste più: la scheda sta nella home, a #community
  if (p === '/community' || p === '/community/') { res.writeHead(308, { ...SICUREZZA, Location: '/#community' }); return res.end() }
  if (p === '/studio' || p === '/studio/') { res.writeHead(308, { ...SICUREZZA, Location: '/#studio' }); return res.end() }
  const radicePub = normalize(pub)
  let file = normalize(join(radicePub, p))
  if (file !== radicePub && !file.startsWith(radicePub + sep)) { res.writeHead(403, SICUREZZA); return res.end() }
  if (/(^|[\\/])(\.env|\.git|\.vercel)([\\/]|$)/i.test(file)) { res.writeHead(404, SICUREZZA); return res.end() }
  try {
    let s = await stat(file).catch(() => null)
    if (s?.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null) }
    if (!s && !extname(file)) { file += '.html'; s = await stat(file).catch(() => null) }
    if (!s) throw 0
    const corpo = await readFile(file)
    res.writeHead(200, {
      ...SICUREZZA,
      'Content-Type': TIPI[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(req.method === 'HEAD' ? undefined : corpo)
  } catch {
    res.writeHead(404, { ...SICUREZZA, 'Content-Type': 'text/html; charset=utf-8' })
    res.end(req.method === 'HEAD' ? undefined : await readFile(join(pub, '404.html')).catch(() => 'non trovato'))
  }
}).listen(porta, () => console.log(`pzkko.it su http://localhost:${porta} · banca: ${process.env.PZKKO_SERVER_URL || 'spenta'}`))
