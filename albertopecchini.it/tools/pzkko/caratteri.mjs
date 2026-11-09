#!/usr/bin/env node
// I caratteri a pezzi di pzkko.it (6.11.2026, Alberto: «leggerissimo»): un titolo di volantino o una voce della barra
// sono poche lettere, e scaricare tutto il carattere (13–59 KB l'uno) per scriverne sei non serve. Google Fonts dà il
// woff2 con dentro solo le lettere chieste (css2?family=…&text=…): questo strumento le chiede una volta, le mette in
// pzkko/fonts/sub/ (servite da qui: a chi guarda il sito Google non arriva niente) e riscrive le regole @font-face fra i
// segni «/* caratteri: <gruppo> */ … /* /caratteri: <gruppo> */» dei file che le usano. Ogni indirizzo porta l'impronta
// del file (?v=…): cambiando le lettere cambia l'indirizzo, e la cache lunga (vercel.json) non serve mai un pezzo vecchio
// a cui manca una lettera.
//
//   node tools/pzkko/caratteri.mjs           scarica e riscrive (da albertopecchini.it/)
//   node tools/pzkko/caratteri.mjs --elenco  dice solo cosa c'è
//
// Per un titolo nuovo: una riga in GRUPPI (il testo è quello che si scrive davvero, le lettere doppie non contano), poi
// questo comando. Le famiglie hanno un nome loro («s-pacifico», «b-caveat»): non si confondono col carattere intero, che
// altre pagine usano con tutte le lettere.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const PZKKO = join(QUI, '../../pzkko')
const DOVE = join(PZKKO, 'fonts/sub')
// le lettere a mano dei volantini (i contatti, i tagliandi, «copiato: …»): minuscole, cifre e i segni degli indirizzi
const MANO = 'abcdefghijklmnopqrstuvwxyz0123456789 @.:/+-_?!,’\'èéàìòù'

export const GRUPPI = {
  // i volantini dei social sulla saracinesca (pzkko/index.html): ognuno esce da una stamperia diversa
  social: {
    file: join(PZKKO, 'index.html'),
    caratteri: [
      { nome: 's-pacifico', famiglia: 'Pacifico', testo: 'instagram' },
      { nome: 's-rubik-glitch', famiglia: 'Rubik Glitch', testo: 'tiktok' },
      { nome: 's-silkscreen', famiglia: 'Silkscreen', peso: 700, testo: 'github' },
      { nome: 's-titan-one', famiglia: 'Titan One', testo: 'whatsapp' },
      { nome: 's-playfair', famiglia: 'Playfair Display', peso: 900, corsivo: true, testo: 'e-mail' },
      { nome: 's-ultra', famiglia: 'Ultra', testo: 'un caffè?' },
      { nome: 's-mano', famiglia: 'Patrick Hand', testo: MANO, mostra: 'swap' },
    ],
  },
  // la petizione sul muro (e il nastro «suono»): le sue scritte stampate sono sempre quelle. Le regole .vol.petizione e
  // .suono mettono questi pezzi davanti al carattere intero, che arriva solo se serve una lettera in più (il foglio da
  // vicino, quando scrive «grazie! hai firmato alle…»)
  petizione: {
    file: join(PZKKO, 'index.html'),
    caratteri: [
      { nome: 'p-anton', famiglia: 'Anton', testo: 'pzkko.it è un bel sito?' },
      { nome: 'p-special-elite', famiglia: 'Special Elite', testo: 'PETIZIONE POPOLARE noi sottoscritti dichiariamo che pzkko.it è un bel sito. n. nome e cognome data ora firma' },
      { nome: 'p-marker', famiglia: 'Permanent Marker', testo: 'firma anche tu suono' },
    ],
  },
  // le voci della barra in alto (pzkko/barra/barra.js, VOCI): sette parole, più «← indietro» e «presto»
  barra: {
    file: join(PZKKO, 'barra/barra.css'),
    caratteri: [
      { nome: 'b-special-elite', famiglia: 'Special Elite', testo: 'storia presto' },
      { nome: 'b-black-ops', famiglia: 'Black Ops One', testo: 'gadget' },
      { nome: 'b-marker', famiglia: 'Permanent Marker', testo: 'oggetti ← indietro' },
      { nome: 'b-shrikhand', famiglia: 'Shrikhand', testo: 'traguardi' },
      { nome: 'b-rubik-mono', famiglia: 'Rubik Mono One', testo: 'account' },
      { nome: 'b-caveat', famiglia: 'Caveat', peso: 700, testo: 'info' },
      { nome: 'b-bungee', famiglia: 'Bungee', testo: 'wiki' },
    ],
  },
}

// (Google sceglie il formato dal browser che chiede: uno recente, per avere woff2)
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const lettere = (t) => [...new Set(t)].sort().join('')

async function scarica(c) {
  const asse = c.corsivo ? `:ital,wght@1,${c.peso ?? 400}` : c.peso ? `:wght@${c.peso}` : ''
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(c.famiglia).replace(/%20/g, '+')}${asse}&text=${encodeURIComponent(lettere(c.testo))}`
  const css = await (await fetch(url, { headers: { 'User-Agent': BROWSER } })).text()
  const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)?.[1]
  if (!src) throw new Error(`${c.famiglia}: Google Fonts non ha dato un woff2 (${url})\n${css.slice(0, 300)}`)
  const r = await fetch(src, { headers: { 'User-Agent': BROWSER } })
  if (!r.ok) throw new Error(`${c.famiglia}: ${r.status} su ${src}`)
  return Buffer.from(await r.arrayBuffer())
}

const elenco = process.argv.includes('--elenco')
await mkdir(DOVE, { recursive: true })
for (const [gruppo, g] of Object.entries(GRUPPI)) {
  const regole = []
  let peso = 0
  for (const c of g.caratteri) {
    const dove = join(DOVE, `${c.nome}.woff2`)
    let dati
    if (elenco) { try { dati = await readFile(dove) } catch { console.log(`  ${c.nome}: manca`); continue } }
    else { dati = await scarica(c); await writeFile(dove, dati) }
    peso += dati.length
    const v = createHash('sha1').update(dati).digest('hex').slice(0, 8)
    regole.push(`@font-face{font-family:"${c.nome}";src:url(/fonts/sub/${c.nome}.woff2?v=${v}) format("woff2");font-weight:400;font-style:normal;font-display:${c.mostra ?? 'block'}}`)
    console.log(`  ${c.nome.padEnd(16)} ${String(dati.length).padStart(6)} byte  ${c.famiglia}${c.peso ? ' ' + c.peso : ''}${c.corsivo ? ' corsivo' : ''}: «${lettere(c.testo).trim()}»`)
  }
  console.log(`${gruppo}: ${g.caratteri.length} caratteri, ${(peso / 1024).toFixed(1)} KB in tutto`)
  if (elenco) continue
  // le regole fra i segni; e nella home i <link rel="preload"> dei titoli (fra «<!-- caratteri: social -->» e la sua chiusa)
  let testo = await readFile(g.file, 'utf8')
  const acapo = testo.includes('\r\n') ? '\r\n' : '\n'
  const tra = (apre, chiude, dentro) => {
    const a = testo.indexOf(apre), b = testo.indexOf(chiude)
    if (a < 0 || b < a) throw new Error(`${g.file}: non trovo «${apre}» … «${chiude}»`)
    testo = testo.slice(0, a + apre.length) + acapo + dentro.join(acapo) + acapo + testo.slice(b)
  }
  tra(`/* caratteri: ${gruppo} */`, `/* /caratteri: ${gruppo} */`, regole)
  if (testo.includes(`<!-- caratteri: ${gruppo} -->`)) {
    tra(`<!-- caratteri: ${gruppo} -->`, `<!-- /caratteri: ${gruppo} -->`, regole.map((r) => `<link rel="preload" href="${r.match(/url\(([^)]+)\)/)[1]}" as="font" type="font/woff2" crossorigin data-home>`))
  }
  await writeFile(g.file, testo)
}
