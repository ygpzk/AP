// pzkko.it come lo vede il browser dopo il deploy: i file di public/ e le
// intestazioni di vercel.json (CSP compresa).  Uso: npm run preview  (porta 5081)
// Per le prove: se la CSP blocca qualcosa, lo dice la console del browser.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, normalize, dirname, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(radice, 'public')
const porta = +(process.argv[2] || 5081)
const conf = JSON.parse(readFileSync(join(radice, 'vercel.json'), 'utf8'))
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.zip': 'application/zip', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon', '.exe': 'application/octet-stream' }

const esc = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
const regole = (conf.headers || []).map(({ source, headers }) => {
  const tutti = source.endsWith('/(.*)')
  const base = tutti ? source.slice(0, -5) : source
  return { re: new RegExp('^' + esc(base) + (tutti ? '/.*' : '') + '$'), headers }
})
function intestazioni(path) {
  const out = new Map()
  for (const r of regole) if (r.re.test(path)) for (const h of r.headers) out.set(h.key, h.value)
  return out
}

const funzioni = new Map()
createServer(async (req, res) => {
  let u
  try { u = new URL(req.url, 'http://x') } catch { res.writeHead(400); return res.end() }
  let p
  try { p = decodeURIComponent(u.pathname) } catch { res.writeHead(400); return res.end() }
  if (p.includes('\0')) { res.writeHead(400); return res.end() }
  for (const [k, v] of intestazioni(p)) res.setHeader(k, v)

  const api = /^\/api\/([a-z]+)\/?$/.exec(p)
  if (api) {
    const f = join(radice, 'api', `${api[1]}.mjs`)
    if (!existsSync(f)) { res.writeHead(404); return res.end('{}') }
    try {
      if (!funzioni.has(f)) funzioni.set(f, (await import(pathToFileURL(f))).default)
      req.query = Object.fromEntries(u.searchParams)
      return await funzioni.get(f)(req, res)
    } catch (e) { console.error(e); res.writeHead(500); return res.end('{"ok":false}') }
  }

  const base = normalize(pub)
  let file = normalize(join(base, p))
  if (file !== base && !file.startsWith(base + sep)) { res.writeHead(403); return res.end() }
  if (/(^|[\\/])(\.env|\.git|\.vercel)([\\/]|$)/i.test(file)) { res.writeHead(404); return res.end() }
  try {
    let s = await stat(file).catch(() => null)
    if (s?.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null) }
    if (!s && !extname(file)) { file += '.html'; s = await stat(file).catch(() => null) }
    if (!s) throw 0
    const corpo = await readFile(file)
    res.writeHead(200, { 'Content-Type': TIPI[extname(file)] || 'application/octet-stream' })
    res.end(req.method === 'HEAD' ? undefined : corpo)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(req.method === 'HEAD' ? undefined : await readFile(join(pub, '404.html')).catch(() => 'non trovato'))
  }
}).listen(porta, () => console.log(`pzkko.it (intestazioni di produzione) su http://localhost:${porta}`))
