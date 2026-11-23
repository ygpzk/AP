// Il controllo che gira prima della build.  Fallisce se:
//  - la Content-Security-Policy in vercel.json non è più allineata agli script
//    in linea (in quel caso: npm run csp);
//  - ricompare un collegamento o un testo che porta ad albertopecchini.it;
//  - finiscono nel pubblicato percorsi del computer, segreti o chiavi.
import { cspAttesa } from './csp.mjs'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const errori = []

// ── 1. la CSP è quella giusta? ───────────────────────────────────────────────
const conf = JSON.parse(readFileSync(join(radice, 'vercel.json'), 'utf8'))
const regola = conf.headers?.find((r) => r.source === '/(.*)')
const csp = regola?.headers?.find((h) => h.key === 'Content-Security-Policy')?.value
if (csp !== cspAttesa()) errori.push('vercel.json: la Content-Security-Policy non è aggiornata (esegui: npm run csp)')

// ── 2. niente rimandi al vecchio sito, niente percorsi del pc ─────────────────
const TESTO = new Set(['.js', '.mjs', '.html', '.css', '.json', '.txt', '.xml', '.md', '.webmanifest', '.svg'])
const VIETATI = [
  [/albertopecchini\.it/i, 'rimando ad albertopecchini.it'],
  [/C:[\\/]+Users[\\/]+[A-Za-z0-9._-]+/i, 'percorso del computer'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'chiave privata'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'chiave AWS'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, 'token GitHub'],
  [/\bsk-[A-Za-z0-9]{20,}\b/, 'chiave API'],
  [/PZKKO_SERVER_SECRET\s*=\s*['"]?[A-Za-z0-9_-]{43}/, 'segreto del server scritto nel pubblicato'],
]

function controllaFile(file) {
  if (!TESTO.has(extname(file).toLowerCase())) return
  const righe = readFileSync(file, 'utf8').split(/\r?\n/)
  for (const [re, cosa] of VIETATI) {
    righe.forEach((riga, i) => {
      if (re.test(riga)) errori.push(`${relative(radice, file)}:${i + 1}: ${cosa}`)
    })
  }
}

function cammina(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') cammina(p) }
    else controllaFile(p)
  }
}

cammina(join(radice, 'public'))
cammina(join(radice, 'api'))
for (const f of ['README.md', 'vercel.json', 'package.json']) controllaFile(join(radice, f))

if (errori.length) {
  console.error(`\n✗ controllo di sicurezza: ${errori.length} problema${errori.length === 1 ? '' : 'i'}\n`)
  for (const e of errori) console.error(`  - ${e}`)
  console.error('')
  process.exit(1)
}
console.log('✓ controllo di sicurezza: CSP allineata, nessun rimando esterno vietato, nessun segreto nel pubblicato')
