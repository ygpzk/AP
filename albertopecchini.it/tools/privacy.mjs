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
// Aggiungere qui ogni cosa nuova da non pubblicare.
//
//   node tools/privacy.mjs [dist] [--tutto]     il controllo a mano, con file e riga
//
// I pezzi da cercare sono scritti in modo da non contenere i dati per intero.

import { readdirSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs'
import { join, relative, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// file e cartelle di dist/ (cioè di public/) da non pubblicare
export const VIA = [
  'tempo', // le copie intere dei siti vecchi (macchina del tempo)
  'media/tempo', // le loro foto
  'media/mappa', // la carta dell'area operativa con la sede
  'media/assistenza', // le immagini di bettercallpekko.it: hanno il loro sito
  'assistenza',
  'contatti/assistenza',
  'bcp', // i file di bettercallpekko.it
  'media/progetti/museo-mestieri-del-fiume', // progetto nascosto (src/data/projects.js, NASCOSTI)
  'media/tavole/museo-mestieri-del-fiume',
  'media/web/rivalta-*', // il sito del paese: progetto nascosto
  'media/studio/fototessera*', // la fototessera: dal 12.11.2026 il ritratto è il selfie in bianco e nero
  'media/studio/curioso-*', // la foto a colori con l'iPhone bianco, sostituita dallo stesso selfie
]

const TESTO = new Set(['.html', '.js', '.mjs', '.json', '.xml', '.txt', '.webmanifest', '.css', '.svg', '.md', '.vcf', '.ics'])

export const REGOLE = [
  ['social', /(?:instagram\.com|tiktok\.com|(?:^|[^a-z])x\.com\/[a-z]|twitter\.com\/(?!intent|share)|youtube\.com\/@|youtu\.be|snapchat\.com|t\.me\/(?!share)|telegram\.me|pinterest\.[a-z]+\/|twitch\.tv\/|threads\.net|reddit\.com\/(?:user|u)\/|linkedin\.com\/in\/|facebook\.com\/(?!sharer|dialog|tr\b)[a-z0-9.]+|github\.com\/(?:ygpzk|albertoxpecchini))/i],
  ['social', /@albertoxpecchini|yungpzkko/i],
  ['numeri', /wa\.me\/\d|api\.whatsapp\.com\/send\?phone|tel:\+?\d/i],
  ['numeri', /351[\s.\-]?035[\s.\-]?5506|3510355506|447340995142|7340[\s.]?995[\s.]?142/],
  ['indirizzi', /belvedere|\b46040\b|(?<![\d.])45[.,]22\d{2}|(?<![\d.])10[.,]67\d{2}|45°\s?1[34]|10°\s?4[01]|openstreetmap\.org\/\?mlat|google\.[a-z.]+\/maps|maps\.app\.goo|tail6c90b3|desktop-inpvhr2/i],
  ['luoghi', /rivalta|mincio|mantova|mantovan|\(MN\)|rodigo|goito|curtatone|castellucchio|porto mantovano/i],
]

export async function ripulisci(dist) {
  for (const v of VIA) {
    if (v.endsWith('*')) {
      const [dir, pre] = [v.slice(0, v.lastIndexOf('/')), v.slice(v.lastIndexOf('/') + 1, -1)]
      const d = join(dist, dir)
      if (existsSync(d)) for (const n of readdirSync(d)) if (n.startsWith(pre)) rmSync(join(d, n), { recursive: true, force: true })
    } else rmSync(join(dist, v), { recursive: true, force: true })
  }
}

export function trova(dist) {
  const trovati = []
  const giro = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      const s = statSync(p)
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

export function controlla(dist, { tutto = false } = {}) {
  const trovati = trova(dist)
  if (!trovati.length) { console.log(`privacy: ${relative(process.cwd(), dist) || dist}/ pulita (niente social, numeri, indirizzi, luoghi)`); return true }
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
