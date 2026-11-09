#!/usr/bin/env node
// Le immagini di Deutschland (9.11.2026) con openai/gpt-image-2 su Replicate (qualità high, come tutte le immagini grandi
// del sito: tools/replicate.mjs, token in .env.local). gpt-image-2 non fa il fondo trasparente: si disegna su magenta
// pieno (#FF00FF) e si toglie con la chiave cromatica di tools/mascotte/immagine.mjs (la stessa dei fogli del muro).
// Regola di Alberto: PRIMA l'UX coi segnaposti, le immagini vere per ultime.
//
//   node tools/pzkko/deutschland/immagini.mjs genera <nome…|tutti> [--parallelo=3]
//       disegna in tools/pzkko/lavoro/deutschland/<nome>/ (sotto i 10 $ di credito al massimo 5 predizioni insieme)
//   node tools/pzkko/deutschland/immagini.mjs recupera <nome> <id-predizione>
//       scarica un'immagine già pagata (se l'attesa si è interrotta)
//   node tools/pzkko/deutschland/immagini.mjs usa <nome…|tutti> [--file=…] [--ordine=alles,pekko,…]
//       l'ultimo PNG di ognuno → pzkko/art/deutschland/: automat → la chiave e poi schermo.mjs angoli (trova il verde,
//       scrive muro-dati.js, automat.webp 900 e automat-grande.webp 1800); gla → gla.webp 160 px; jma → jma.webp 480 px;
//       pacchi → il foglio 4 × 4 tagliato in 16 pacchetti pacchi/<tag>.webp da 240 px (--ordine se il modello li ha
//       messi in un altro ordine, da sinistra a destra e dall'alto in basso)
//
// I nomi: automat (la macchinetta, schermo verde pieno #00FF00 così schermo.mjs trova gli angoli), gla (la Mercedes GLA
// grigia vista dall'alto per la mappa), jma (l'adesivo «JMA»), pacchi (i 16 pacchetti inventati: i colori e lo stile
// tutti diversi, SENZA scritte: il nome lo scrive l'html col suo carattere, pacchi.css).
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { ROOT, die, predict, prediction, salva } from '../../replicate.mjs'
import { chiave, fondoMagenta, leggiA, rifila, ritaglia, scriviWebp } from '../../mascotte/immagine.mjs'

// i 15 tag del catalogo nell'ordine di pzkko/deutschland/comune.js (TAG: non si importa da Node, usa `location`)
const TAG = ['pekko', 'mikas', 'jonny', 'jella', 'cibo', 'paesaggi', 'natura', 'strada', 'auto', 'screenshot', 'hotel', 'mezzi', 'alcool', 'foto', 'video']

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/deutschland')
const ART = join(ROOT, 'pzkko/art/deutschland')
const QUI = join(ROOT, 'tools/pzkko/deutschland')
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const PARALLELO = Math.max(1, Math.min(5, Number(opz('parallelo', 3)) || 3))
const BORDO = [60, 60, 58] // il colore che prendono i pixel spariti: scuro come il muro e la pagina, così i bordi non restano rosa

const MAGENTA = 'The background is a perfectly flat, solid, uniform pure magenta (#FF00FF) filling the entire canvas edge to edge: no gradient, no vignette, no shadow cast on it, no reflection, nothing else in the picture.'
const PACCHI_TAG = ['alles', ...TAG.filter((t) => t !== 'foto' && t !== 'video'), 'foto', 'video'] // 16: alles + i 15 del catalogo
// (la lista nel piano: tag → nome → com'è il pacchetto; il nome lo scrive l'html, qui solo i colori e il disegno)
const PACCHETTI = {
  alles: 'JMA: glossy black box with three bold horizontal bands black, red and gold like the German flag, a small gold eagle silhouette',
  pekko: 'luckypzkko: white box with a big red bullseye roundel with thin black, white and gold rings in the centre',
  mikas: "Mikas's Smoke: charcoal grey matte box with a swirl of pale blue-grey smoke rising across the front",
  jonny: "Jonny's Tobacco: kraft brown paper-textured box with a dark green tobacco leaf and a thin cream ribbon",
  jella: 'Jella Leicht: pale pink and sky blue soft pastel box, airy, with a tiny white feather',
  cibo: 'Brezn Gold: deep golden yellow box with a dark brown pretzel symbol and a warm amber stripe',
  paesaggi: 'Alpenblick: cobalt blue box with white snowy mountain peaks and a small sun',
  natura: 'Schwarzwald: dark forest green box with black fir tree silhouettes and a thin silver line',
  strada: 'Autobahn 100: blue German motorway-sign style box with a white arrow and a white border',
  auto: 'GLA Grau: brushed silver metallic grey box with a simple dark car silhouette seen from the front',
  screenshot: 'Bildschirm: teal and black box with a glowing pixel grid pattern and a thin cyan frame',
  hotel: 'Nachtportier: midnight navy box with a golden hotel room key and a little gold star',
  mezzi: 'S-Bahn Blau: white box with a bright blue band and a stylised train front in white',
  alcool: 'Jäger Hirsch 56: very dark green box with an orange-brown stag head and a glowing cross between its antlers',
  foto: 'Südkurve: red and white box with a light blue diagonal stripe, football scarf feel',
  video: 'Cannstatter: white box with one wide red horizontal chest band, like a football jersey',
}

const IMMAGINI = {
  automat: {
    prompt: `An old West-German wall-mounted cigarette vending machine (Zigarettenautomat) from the 1970s–80s, photographed straight on, perfectly frontal, the whole machine centred and entirely inside the frame with a generous margin all around. Enamelled steel body in pale grey with a slightly worn, chipped finish and a dark frame, a coin slot, a row of eight chrome pull knobs, a tray at the bottom, a small black–red–gold stripe, the word ZIGARETTEN. In the upper part a large flat rectangular screen panel that is a PERFECTLY UNIFORM SOLID PURE GREEN (#00FF00) rectangle with sharp straight edges, no reflections, no glare, no text, no pixels on it: a flat green chroma key panel. Above the knobs a row of EIGHT small product windows, and each window is a PERFECTLY UNIFORM SOLID PURE BLUE (#0000FF) rectangle: no packs, no text, no reflections inside the windows, just flat blue chroma key rectangles. No real cigarette brands anywhere. Soft even studio light, no cast shadow. ${MAGENTA}`,
    aspect_ratio: '3:4',
  },
  gla: {
    prompt: `A grey 2022 Mercedes-Benz GLA compact SUV seen from directly above (perfect top-down bird's-eye view), the car pointing straight up, in the flat clean style of a navigation-app car icon: simple soft shading, dark windows, no text, no logo, no shadow on the ground, the whole car centred and fully inside the frame with a wide margin. ${MAGENTA}`,
    aspect_ratio: '1:1',
  },
  jma: {
    prompt: `A single die-cut vinyl sticker, seen flat from the front: the three letters «JMA» in heavy black condensed sans-serif capitals (spelled exactly J, M, A) on a bright yellow background with a red and a black diagonal stripe behind the letters, a thick white die-cut border following the outline of the sticker, slightly worn edges. Only this one sticker, centred, with a wide margin. ${MAGENTA}`,
    aspect_ratio: '1:1',
  },
  pacchi: {
    prompt: `A product sheet of 16 different invented cigarette packs (hard flip-top boxes, closed, seen straight from the front, all the same size), arranged in a STRICT 4 × 4 GRID: 4 columns and 4 rows, equal spacing, every pack fully inside its own cell, none touching or overlapping. NO TEXT ANYWHERE: no letters, no words, no numbers, no logotypes, no health warnings; only colours, shapes, stripes, bands and simple symbols. Each pack a completely different colour scheme and graphic style. Reading left to right, top to bottom: ${PACCHI_TAG.map((t, i) => `${i + 1}) ${PACCHETTI[t].replace(/^[^:]+: /, '')}`).join('; ')}. Soft even light, no cast shadows. ${MAGENTA}`,
    aspect_ratio: '2048x2048',
  },
}

const quale = (nome) => IMMAGINI[nome] || die(`nessuna immagine «${nome}»: ${Object.keys(IMMAGINI).join(', ')}`)

async function genera(nome) {
  const im = quale(nome)
  const input = { prompt: im.prompt, aspect_ratio: im.aspect_ratio, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
  console.log(`→ ${nome}: qualità high, ${im.aspect_ratio}, attendo il modello…`)
  const p = await predict(input, `node tools/pzkko/deutschland/immagini.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { immagine: nome })
}

async function generaTutti(nomi) {
  const coda = [...nomi], errori = []
  await Promise.all(Array.from({ length: PARALLELO }, async () => {
    while (coda.length) { const n = coda.shift(); try { await genera(n) } catch (e) { errori.push(`${n}: ${e.message}`); console.error(`✗ ${n}: ${e.message}`) } }
  }))
  if (errori.length) die(`immagini non riuscite:\n  ${errori.join('\n  ')}`)
}

/** L'ultimo PNG generato per `nome` (o --file). */
async function ultimo(nome) {
  const chiesto = opz('file')
  if (chiesto) return resolve(ROOT, chiesto)
  const dir = join(LAVORO, nome)
  const png = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.png') && !f.includes('chiave')).sort()
  if (!png.length) die(`nessun PNG in ${dir}: prima «genera ${nome}»`)
  return join(dir, png.at(-1))
}

/** Legge il PNG e toglie il magenta (se c'è ancora). */
async function scontornata(file) {
  const img = await leggiA(file)
  if (fondoMagenta(img)) chiave(img, BORDO)
  return img
}

async function usa(nome) {
  quale(nome)
  const file = await ultimo(nome)
  await mkdir(ART, { recursive: true })
  console.log(`← ${nome}: ${file}`)
  if (nome === 'automat') {
    // la chiave, poi schermo.mjs: il verde → gli angoli in muro-dati.js, il nero spento, automat.webp e automat-grande.webp
    const img = rifila(await scontornata(file), 4)
    const chiavePng = join(LAVORO, 'automat', 'automat-chiave.png')
    const { default: sharp } = await import('sharp')
    await sharp(img.px, { raw: { width: img.w, height: img.h, channels: 4 } }).png().toFile(chiavePng)
    const r = spawnSync(process.execPath, [join(QUI, 'schermo.mjs'), 'angoli', `--foto=${chiavePng}`, ...(opz('ordine') ? [`--pacchi=${opz('ordine')}`] : [])], { stdio: 'inherit' })
    if (r.status) die('schermo.mjs angoli non è riuscito')
    return
  }
  if (nome === 'gla' || nome === 'jma') {
    const img = rifila(await scontornata(file), 4), larg = nome === 'gla' ? 160 : 480
    const [w, h] = await scriviWebp(img, join(ART, `${nome}.webp`), Math.min(1, larg / img.w), 88)
    console.log(`✓ ${join(ART, `${nome}.webp`)} (${w}×${h})`)
    return
  }
  if (nome === 'pacchi') {
    // il foglio 4 × 4: ogni cella rifilata ai suoi pixel pieni, poi 240 px di larghezza
    const ordine = opz('ordine') ? opz('ordine').split(',') : PACCHI_TAG
    if (ordine.length !== 16 || ordine.some((t) => !PACCHI_TAG.includes(t))) die(`--ordine vuole i 16 tag: ${PACCHI_TAG.join(',')}`)
    const img = await scontornata(file)
    // le celle: le fasce di righe e di colonne con qualcosa dentro, separate dal vuoto (il modello non mette i pacchetti
    // esattamente a 1/4: tagliando a griglia fissa un pacchetto si porta via una striscia del vicino)
    const fasce = (n, pieno) => { const f = []; let da = -1; for (let i = 0; i <= n; i++) { const p = i < n && pieno(i); if (p && da < 0) da = i; if (!p && da >= 0) { f.push([da, i - 1]); da = -1 } } return f.filter(([a, b]) => b - a > 20) }
    let righe = fasce(img.h, (y) => { for (let x = 0; x < img.w; x++) if (img.px[(y * img.w + x) * 4 + 3] > 0) return true; return false })
    let colonne = fasce(img.w, (x) => { for (let y = 0; y < img.h; y++) if (img.px[(y * img.w + x) * 4 + 3] > 0) return true; return false })
    if (righe.length !== 4 || colonne.length !== 4) { console.warn(`  trovate ${righe.length} righe e ${colonne.length} colonne di pacchetti: taglio a griglia fissa`); righe = [0, 1, 2, 3].map((i) => [i * Math.floor(img.h / 4), (i + 1) * Math.floor(img.h / 4) - 1]); colonne = [0, 1, 2, 3].map((i) => [i * Math.floor(img.w / 4), (i + 1) * Math.floor(img.w / 4) - 1]) }
    await mkdir(join(ART, 'pacchi'), { recursive: true })
    for (let i = 0; i < 16; i++) {
      const [x0, x1] = colonne[i % 4], [y0, y1] = righe[Math.floor(i / 4)]
      const cella = ritaglia(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1)
      const pieno = cella.px.some((v, j) => j % 4 === 3 && v > 0)
      if (!pieno) { console.warn(`  cella ${i + 1} vuota: niente ${ordine[i]}`); continue }
      const pacco = rifila(cella, 2)
      const out = join(ART, 'pacchi', `${ordine[i]}.webp`)
      const [w, h] = await scriviWebp(pacco, out, Math.min(1, 240 / pacco.w), 86)
      console.log(`  ✓ ${ordine[i]}.webp (${w}×${h})`)
    }
    return
  }
}

const [cosa, ...resto] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const nomi = resto.includes('tutti') || !resto.length ? Object.keys(IMMAGINI) : resto
if (cosa === 'genera') await generaTutti(nomi)
else if (cosa === 'recupera') { const [nome, id] = resto; if (!nome || !id) die('recupera <nome> <id-predizione>'); quale(nome); await salva(await prediction(id), join(LAVORO, nome), { immagine: nome }) }
else if (cosa === 'usa') for (const n of nomi) await usa(n)
else { console.log('uso: immagini.mjs genera <nome…|tutti> | recupera <nome> <id> | usa <nome…|tutti> [--file=…] [--ordine=…]'); process.exit(2) }
