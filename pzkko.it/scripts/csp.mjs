// Genera l'impronta SHA-256 di ogni <script> in linea di public/ e scrive la
// Content-Security-Policy dentro vercel.json.  Uso: npm run csp
//
// (Le pagine vecchie hanno ancora script in linea: con le impronte il browser
// li esegue solo se sono esattamente quelli pubblicati, e blocca qualunque
// script iniettato da fuori.  `npm run check` verifica che le impronte siano
// ancora aggiornate.)
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const pubblico = join(radice, 'public')

// ogni direttiva ha solo i suoi host: un'immagine non può diventare un canale
// per mandare dati a un'API, e viceversa.
const IMMAGINI = [
  'https://cdn.discordapp.com',
  'https://media.discordapp.net',
  'https://i.scdn.co',
  'https://dcdn.dstn.to',
  'https://tile.openstreetmap.org',
  'https://thumb.wikimedia.org',
  'https://upload.wikimedia.org',
  'https://i.imgur.com',
]
const CONNESSIONI = [
  'https://api.lanyard.rest',
  'wss://api.lanyard.rest',
  'https://dcdn.dstn.to',
  'https://discord.com',
  'https://cdn.discordapp.com',
  'https://media.discordapp.net',
  'https://tiles.openfreemap.org',
  'https://api.bigdatacloud.net',
]
const CORNICI = [
  "'self'",
  'https://www.google.com',
  'https://maps.google.com',
  'https://consent.google.com',
]

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? htmlFiles(p) : /\.html$/i.test(e.name) ? [p] : []
  })
}

/** Tutti gli script in linea (JavaScript o module), con la loro impronta. */
export function scriptInLinea() {
  const out = []
  for (const file of htmlFiles(pubblico)) {
    const html = readFileSync(file, 'utf8').replace(/\r\n?/g, '\n')
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      const attr = m[1], corpo = m[2]
      if (/\bsrc\s*=/i.test(attr)) continue
      const tipo = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attr)?.[1]?.toLowerCase() ?? ''
      if (tipo && !/^(?:module|text\/javascript|application\/javascript)$/.test(tipo)) continue
      const hash = `sha256-${createHash('sha256').update(corpo, 'utf8').digest('base64')}`
      out.push({ file: relative(radice, file), hash })
    }
  }
  return out
}

/** La CSP intera, con le impronte di adesso. */
export function cspAttesa() {
  const hash = [...new Set(scriptInLinea().map((s) => s.hash))].sort()
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src 'self' 'wasm-unsafe-eval' ${hash.map((h) => `'${h}'`).join(' ')}`.trim(),
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${IMMAGINI.join(' ')}`,
    "font-src 'self'",
    `connect-src 'self' ${CONNESSIONI.join(' ')}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    `frame-src ${CORNICI.join(' ')}`,
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export function aggiornaVercel() {
  const file = join(radice, 'vercel.json')
  const conf = JSON.parse(readFileSync(file, 'utf8'))
  const regola = conf.headers?.find((r) => r.source === '/(.*)')
  if (!regola) throw new Error('vercel.json: manca la regola /(.*)')
  const voce = regola.headers?.find((h) => h.key === 'Content-Security-Policy')
  if (!voce) throw new Error('vercel.json: manca Content-Security-Policy')
  voce.value = cspAttesa()
  writeFileSync(file, JSON.stringify(conf, null, 2) + '\n', 'utf8')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const hash = scriptInLinea()
  if (process.argv.includes('--write')) {
    aggiornaVercel()
    console.log(`vercel.json aggiornato: ${new Set(hash.map((h) => h.hash)).size} impronte da ${hash.length} script in linea`)
  } else {
    console.log(cspAttesa())
  }
}
