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
// L'eccezione voluta il 24.11: i profili personali in «Altri social» e la scheda
// Instagram. I nomi possono stare solo nei posti che li mostrano davvero (la
// configurazione, la scheda e i dati scaricati); il dominio personale e ogni
// altro nome restano vietati.
// (26.11: anche i dati della scheda TikTok, public/media/tt/. La scheda tt.js non
// scrive nessun nome: legge l'account dai dati, e il nome del profilo, se contiene
// il nome personale, il raccoglitore non lo scrive.)
const ECCEZIONE_SOCIAL = /^(?:public\/assets\/(?:ig|config)\.js|public\/media\/(?:ig|tt)\/)/i
const NOMI_SOCIAL = [
  decodifica('YWxiZXJ0b3hwZWNjaGluaQ=='), // Instagram, TikTok, Pinterest, SoundCloud
  decodifica('YWxiZXJ0b3BlY2NoaW5p'),      // Telegram
  decodifica('YWxiZXJ0by1oN3kzaA=='),      // YouTube
].map((n) => new RegExp(n, 'gi'))
const TESTO = new Set(['.js', '.mjs', '.html', '.css', '.json', '.txt', '.xml', '.md', '.webmanifest', '.svg'])
const VIETATI = [
  [new RegExp(DOMINIO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), 'dominio vietato'],
  ...NOMI.map((n) => [new RegExp(n, 'i'), 'nome o account personale']),
  [/C:[\\/]+Users[\\/]+[A-Za-z0-9._-]+/i, 'percorso del computer'],
  // (26.11: le cose nuove non devono portarsi dietro la rete di casa: l'IP
  // privato scritto in una pagina dice com'è fatta la LAN, e non serve a chi legge)
  [/\b192\.168\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/, 'indirizzo di rete privato'],
  [/\b10\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/, 'indirizzo di rete privato'],
  [/\b172\.(?:1[6-9]|2\d|3[01])\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/, 'indirizzo di rete privato'],
  [/\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/, 'indirizzo Tailscale'],
  [/\b[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b/i, 'indirizzo email'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'chiave privata'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'chiave AWS'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, 'token GitHub'],
  [/\bsk-[A-Za-z0-9]{20,}\b/, 'chiave API'],
  [/PZKKO_SERVER_SECRET\s*=\s*['"]?[A-Za-z0-9_-]{43}/, 'segreto del server scritto nel pubblicato'],
]

function controllaFile(file) {
  if (!TESTO.has(extname(file).toLowerCase())) return
  const rel = relative(radice, file).replaceAll('\\', '/')
  const eccezione = ECCEZIONE_SOCIAL.test(rel)
  const righe = readFileSync(file, 'utf8').split(/\r?\n/)
  for (const [re, cosa] of VIETATI) {
    righe.forEach((riga, i) => {
      let testo = riga
      if (eccezione) for (const nome of NOMI_SOCIAL) testo = testo.replace(nome, '')
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
console.log('✓ controllo di sicurezza: CSP allineata, nessun dominio personale (tranne i profili scelti), nessun segreto nel pubblicato')
