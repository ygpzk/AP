// Il controllo dei dati personali (12.11.2026, Alberto: «rimetti tutto uguale a prima ma togli social,
// numeri, indirizzi e luoghi»). Due pezzi, chiamati dal plugin della build (plugins/site-pages.js):
//   ripulisci(dist)  toglie da dist/ i file copiati da public/ che dicono dove abito o il numero
//                    (le copie dei siti vecchi della macchina del tempo, le foto del paese, la mappa…):
//                    nel repository restano, online no
//   controlla(dist)  cerca nei file di testo di dist/:
//                      social     link a profili (Instagram, TikTok, X, YouTube, GitHub, Telegram, …)
//                      numeri     numeri di telefono, tel:, wa.me
//                      indirizzi  la via, il CAP, le coordinate, i link alle mappe
//                      luoghi     il paese, la provincia, i dintorni
//                    e se trova qualcosa la build si ferma: su Vercel resta online la versione di prima.
//                    Anche /tempo/: dal 26.11.2026 le pagine di allora sono oscurate
//                    (tools/tempo/oscura-pagine.mjs) e valgono le stesse regole del resto del sito;
//                    trovaTempo in più cerca email e telefoni che non conosce.
// Aggiungere qui ogni cosa nuova da non pubblicare.
//
//   node tools/privacy.mjs [dist] [--tutto]     il controllo a mano, con file e riga
//
// I pezzi da cercare sono scritti in modo da non contenere i dati per intero.

import { readdirSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs'
import { join, relative, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// file e cartelle di dist/ (cioè di public/) da non pubblicare
export const VIA = [
  'media/mappa', // la carta dell'area operativa con la sede
  'assistenza',
  'contatti/assistenza',
  'media/progetti/museo-mestieri-del-fiume', // progetto nascosto (src/data/projects.js, NASCOSTI)
  'media/tavole/museo-mestieri-del-fiume',
  'media/web/rivalta-*', // il sito del paese: progetto nascosto
  'media/studio/fototessera*', // la fototessera: dal 12.11.2026 il ritratto è il selfie in bianco e nero
  'media/studio/curioso-*', // la foto a colori con l'iPhone bianco, sostituita dallo stesso selfie
  // la macchina del tempo (26.11.2026): Rivalta è un progetto nascosto e il suo nome è il paese
  'tempo/rivaltasulmincio.it',
  'media/tempo/rivalta',
  // le foto intere delle catture, fatte prima dell'oscuramento (paese, coordinate, numero): al loro
  // posto -t e -v, rifatte dalle copie oscurate (tools/tempo/oscura-pagine.mjs)
  'media/tempo/*/*-d.webp',
  'media/tempo/*/*-m.webp',
]

// un percorso di VIA come espressione: * vale un pezzo di nome; senza *, anche tutto ciò che sta dentro
const comeRe = (v) => new RegExp(`^${v.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}(?:/.*)?$`)

const TESTO = new Set(['.html', '.js', '.mjs', '.json', '.xml', '.txt', '.webmanifest', '.css', '.svg', '.md', '.vcf', '.ics'])

export const REGOLE = [
  ['social', /(?:instagram\.com|tiktok\.com|(?:^|[^a-z])x\.com\/[a-z]|twitter\.com\/(?!intent|share)|youtube\.com\/@|youtu\.be|snapchat\.com|t\.me\/(?!share)|telegram\.me|pinterest\.[a-z]+\/|twitch\.tv\/|threads\.net|reddit\.com\/(?:user|u)\/|linkedin\.com\/in\/|facebook\.com\/(?!sharer|dialog|tr\b)[a-z0-9.]+|github\.com\/(?:ygpzk|albertoxpecchini))/i],
  ['social', /@albertoxpecchini|yungpzkko/i],
  ['numeri', /wa\.me\/\d|api\.whatsapp\.com\/send\?phone|tel:\+?\d/i],
  ['numeri', /351[\s.\-]?035[\s.\-]?5506|3510355506|447340995142|7340[\s.]?995[\s.]?142/],
  ['indirizzi', /belvedere|\b46040\b|(?<![\d.])45[.,]22\d{2}|(?<![\d.])10[.,]67\d{2}|45°\s?1[34]|10°\s?4[01]|openstreetmap\.org\/\?mlat|google\.[a-z.]+\/maps|maps\.app\.goo|tail6c90b3|desktop-inpvhr2/i],
  ['luoghi', /rivalta|mincio|mantova|mantovan|\(MN\)|rodigo|goito|curtatone|castellucchio|porto mantovano/i],
]

// La macchina del tempo: le pagine di allora sono congelate, ripulite nel deposito (privato.mjs) e
// poi oscurate (tools/tempo/oscura-pagine.mjs, 26.11.2026: anche i luoghi e i contatti di enti e
// aziende, che dicevano il paese). Queste due liste sono i contatti che trovaTempo lascia passare;
// un contatto nuovo fa fermare la build e si decide se aggiungerlo.
const EMAIL_TEMPO = new Set([
  'pzkko@yahoo.com',
  'info@prolocorivalta.mn.it',
  'cascinafontana@pec.it',
  'segreteria@comune.rodigo.mn.it',
  'info@cascinafontana.xyz',
  'nome@email.it',
  'la-tua-email@dominio.it',
  'tua@email.it',
  'tua.email@esempio.it',
])
const TELEFONI_TEMPO = new Set([
  '3398995680', '393398995680', // Pro Loco Rivalta
  '3510220302', '393510220302', // Rivalta Green Village
  '0000000000', '39000000000', // segnaposto
])
const SOCIAL_TEMPO = /@albertoxpecchini|yungpzkko|(?:instagram|tiktok|threads|x|twitter|linkedin|github|facebook)\.com\/(?:@|in\/)?(?:albertoxpecchini|ygpzk)/gi
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const TEL_LINK = /(?:wa\.me\/|tel:)(\+?\d[\d\s.-]*)/gi

export async function ripulisci(dist) {
  const regole = VIA.map(comeRe)
  const giro = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      const rel = relative(dist, p).split(sep).join('/')
      if (regole.some((re) => re.test(rel))) rmSync(p, { recursive: true, force: true })
      else if (statSync(p).isDirectory()) giro(p)
    }
  }
  if (existsSync(dist)) giro(dist)

  // le risorse delle copie della macchina del tempo che nessuna copia usa più: le immagini tolte
  // dall'oscuramento (tools/tempo/immagini-tolte.json) restano nel repository, online no
  const risorse = join(dist, 'media/tempo/risorse')
  const tempo = join(dist, 'tempo')
  if (existsSync(risorse) && existsSync(tempo)) {
    const usate = new Set()
    const leggi = (dir) => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n)
        if (statSync(p).isDirectory()) leggi(p)
        else if (n.endsWith('.html')) for (const m of readFileSync(p, 'utf8').matchAll(/\/media\/tempo\/risorse\/([\w.-]+)/g)) usate.add(m[1])
      }
    }
    leggi(tempo)
    for (const n of readdirSync(risorse)) if (!usate.has(n)) rmSync(join(risorse, n), { force: true })
  }
}

export function trova(dist) {
  const trovati = []
  const giro = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      const s = statSync(p)
      // anche /tempo/, come tutto il resto: le pagine di allora sono oscurate
      if (s.isDirectory()) giro(p)
      else if (TESTO.has(extname(n).toLowerCase()) && s.size < 20 << 20) {
        readFileSync(p, 'utf8').split('\n').forEach((r, i) => {
          for (const [tipo, re] of REGOLE) {
            const m = r.match(re)
            if (m) trovati.push({ tipo, file: relative(dist, p).replace(/\\/g, '/'), riga: i + 1, pezzo: r.slice(Math.max(0, m.index - 50), m.index + 70).trim() })
          }
        })
      }
    }
  }
  giro(dist)
  return trovati
}

// /tempo/, in più: nelle pagine di allora (le cartelle «pagina») ogni email e ogni telefono che non
// è nelle due liste ferma la build. Dopo l'oscuramento (26.11.2026) resta solo l'email pubblica.
export function trovaTempo(dist) {
  const trovati = []
  const base = join(dist, 'tempo')
  if (!existsSync(base)) return trovati

  const file = (p) => {
    const rel = relative(dist, p).replace(/\\/g, '/')
    readFileSync(p, 'utf8').split('\n').forEach((r, i) => {
      const aggiungi = (tipo, pezzo) => trovati.push({ tipo, file: rel, riga: i + 1, pezzo: pezzo.slice(0, 140) })
      for (const m of r.matchAll(SOCIAL_TEMPO)) aggiungi('tempo/social', m[0])
      for (const m of r.matchAll(EMAIL)) if (!EMAIL_TEMPO.has(m[0].toLowerCase())) aggiungi('tempo/email', m[0])
      for (const m of r.matchAll(TEL_LINK)) {
        const numero = m[1].replace(/\D/g, '')
        if (!TELEFONI_TEMPO.has(numero)) aggiungi('tempo/numeri', m[0])
      }
    })
  }

  // le pagine di allora stanno in tempo/<sito>/<giorno>/pagina/
  const pagina = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      const s = statSync(p)
      if (s.isDirectory()) pagina(p)
      else if (TESTO.has(extname(n).toLowerCase()) && s.size < 20 << 20) file(p)
    }
  }
  const giro = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      const s = statSync(p)
      if (s.isDirectory()) (n === 'pagina' ? pagina : giro)(p)
    }
  }
  giro(base)
  return trovati
}

export function controlla(dist, { tutto = false } = {}) {
  const trovati = [...trova(dist), ...trovaTempo(dist)]
  if (!trovati.length) { console.log(`privacy: ${relative(process.cwd(), dist) || dist}/ pulita (niente social, numeri, indirizzi, luoghi; tempo: niente dati personali nelle pagine di allora)`); return true }
  const perTipo = {}
  for (const t of trovati) (perTipo[t.tipo] ||= []).push(t)
  for (const [tipo, l] of Object.entries(perTipo)) {
    console.log(`\n== ${tipo}: ${l.length}`)
    const file = {}
    for (const t of l) (file[t.file] ||= []).push(t)
    for (const [f, ts] of Object.entries(file)) {
      console.log(`  ${f} (${ts.length})`)
      for (const t of ts.slice(0, tutto ? 99 : 2)) console.log(`     ${t.riga}: …${t.pezzo.slice(0, 140)}…`)
    }
  }
  console.log(`\nprivacy: ${trovati.length} dati personali in dist/`)
  return false
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(controlla(resolve(process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || 'dist'), { tutto: process.argv.includes('--tutto') }) ? 0 : 1)
}
