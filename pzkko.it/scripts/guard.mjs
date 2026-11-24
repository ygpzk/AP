// Il controllo che gira prima della build.  Fallisce se:
//  - la Content-Security-Policy in vercel.json non è più allineata agli script
//    in linea (in quel caso: npm run csp);
//  - ricompare il dominio vietato o un nome/account personale nel pubblicato,
//    nel README o negli script;
//  - finiscono nel pubblicato percorsi del computer, segreti o chiavi.
//
// (I nomi vietati stanno in base64: questo file non li deve citare nemmeno lui.)
import { cspAttesa } from './csp.mjs'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = join(dirname(fileURLToPath(import.meta.url)), '..')
const decodifica = (s) => Buffer.from(s, 'base64').toString('utf8')
const DOMINIO = decodifica('YWxiZXJ0b3BlY2NoaW5pLml0')
const NOMI = [decodifica('YWxiZXJ0bw=='), decodifica('cGVjY2hpbmk=')]
const errori = []

// ── 1. la CSP è quella giusta? ───────────────────────────────────────────────
const conf = JSON.parse(readFileSync(join(radice, 'vercel.json'), 'utf8'))
const regola = conf.headers?.find((r) => r.source === '/(.*)')
const csp = regola?.headers?.find((h) => h.key === 'Content-Security-Policy')?.value
if (csp !== cspAttesa()) errori.push('vercel.json: la Content-Security-Policy non è aggiornata (esegui: npm run csp)')

// ── 2. niente dominio vietato, niente nome personale, niente percorsi del pc ──
// L'eccezione voluta il 24.11: il profilo Instagram personale in bacheca.
// Il nome può stare solo nei tre posti che lo mostrano davvero (la scheda,
// la configurazione e i dati scaricati); il dominio personale e ogni altro
// nome restano vietati.
const ECCEZIONE_IG = /^(?:public\/assets\/(?:ig|config)\.js|public\/media\/ig\/)/i
const NOME_IG = new RegExp(decodifica('YWxiZXJ0b3hwZWNjaGluaQ=='), 'gi')
const TESTO = new Set(['.js', '.mjs', '.html', '.css', '.json', '.txt', '.xml', '.md', '.webmanifest', '.svg'])
const VIETATI = [
  [new RegExp(DOMINIO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), 'dominio vietato'],
  ...NOMI.map((n) => [new RegExp(n, 'i'), 'nome o account personale']),
  [/C:[\\/]+Users[\\/]+[A-Za-z0-9._-]+/i, 'percorso del computer'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'chiave privata'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'chiave AWS'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, 'token GitHub'],
  [/\bsk-[A-Za-z0-9]{20,}\b/, 'chiave API'],
  [/PZKKO_SERVER_SECRET\s*=\s*['"]?[A-Za-z0-9_-]{43}/, 'segreto del server scritto nel pubblicato'],
]

function controllaFile(file) {
  if (!TESTO.has(extname(file).toLowerCase())) return
  const rel = relative(radice, file).replaceAll('\\', '/')
  const eccezione = ECCEZIONE_IG.test(rel)
  const righe = readFileSync(file, 'utf8').split(/\r?\n/)
  for (const [re, cosa] of VIETATI) {
    righe.forEach((riga, i) => {
      const testo = eccezione ? riga.replace(NOME_IG, '') : riga
      if (re.test(testo)) errori.push(`${rel}:${i + 1}: ${cosa}`)
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

for (const d of ['public', 'api', 'scripts']) cammina(join(radice, d))
for (const f of ['README.md', 'vercel.json', 'package.json']) controllaFile(join(radice, f))

if (errori.length) {
  console.error(`\n✗ controllo di sicurezza: ${errori.length} problema${errori.length === 1 ? '' : 'i'}\n`)
  for (const e of errori) console.error(`  - ${e}`)
  console.error('')
  process.exit(1)
}
console.log('✓ controllo di sicurezza: CSP allineata, nessun dominio personale (tranne l’Instagram voluto), nessun segreto nel pubblicato')
