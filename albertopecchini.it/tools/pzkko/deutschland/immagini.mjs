#!/usr/bin/env node
// Le immagini di Deutschland (9.11.2026, rifatte la sera dello stesso giorno: «Deutschland 2») con openai/gpt-image-2 su
// Replicate (qualità high, come tutte le immagini grandi del sito: tools/replicate.mjs, token in .env.local). gpt-image-2
// non fa il fondo trasparente: si disegna su magenta pieno (#FF00FF) e si toglie con la chiave cromatica di
// tools/mascotte/immagine.mjs (la stessa dei fogli del muro). Ogni generazione costa ≈ 0,2 $: i prompt stanno QUI, nel
// repo, così ogni immagine si rigenera uguale (o si ritocca il prompt e si rifà solo quella).
//
//   node tools/pzkko/deutschland/immagini.mjs genera <nome…|pacchi|sticker|tutti> [--parallelo=4]
//       disegna in tools/pzkko/lavoro/deutschland/<nome>/ (un PNG per generazione, col JSON dell'input accanto; sotto i
//       10 $ di credito Replicate accetta al massimo 5 predizioni insieme: mai più di 4 in parallelo)
//   node tools/pzkko/deutschland/immagini.mjs recupera <nome> <id-predizione>
//       scarica un'immagine già pagata (se l'attesa si è interrotta)
//   node tools/pzkko/deutschland/immagini.mjs usa <nome…|pacchi|sticker|tutti> [--file=…]
//       l'ultimo PNG di ognuno (o --file) → pzkko/art/deutschland/:
//         automat          → la chiave, poi schermo.mjs angoli (il verde → `schermo`, il blu → `vetrine` e `tasti` in
//                            muro-dati.js; automat.webp 900 e automat-grande.webp 1800, coi nostri pacchetti dentro)
//         pacco-<tag>      → pacchi/<tag>.webp, 600 px di lato lungo (i 16 pacchetti: uno per generazione)
//         sticker-<nome>   → sticker/<nome>.webp, 512 px, trasparente
//         gla              → gla.webp 160 px (la GLA vista dall'alto, per la mappa)
//   node tools/pzkko/deutschland/immagini.mjs contatto [pacchi|sticker]
//       il foglio di contatto delle webp fatte (tools/pzkko/lavoro/deutschland/pacchi-v2.png, sticker-v2.png): da GUARDARE
//       prima di dire che è finita (le scritte giuste? sembra vero?) e rigenerare i brutti (al massimo 2 tentativi l'uno)
//
// Alberto sui pacchetti del primo giro (scatole colorate senza una scritta): «non sono fatte male così, tutte le marche
// devono essere davvero reali e simili alla realtà, fallo più bello». Quindi ogni pacchetto è un VERO pacchetto tedesco in
// vendita: nome grande, sottotitolo, «20 Filter Zigaretten», la fascia bianca con l'avvertenza nera «Rauchen ist tödlich»
// (quella dei pacchetti 2003–2016, prima delle foto), il sigillo fiscale sul coperchio, il cartone. La grafica si ISPIRA
// alle marche vere ma coi nostri nomi: mai un marchio registrato vero (niente Marlboro, niente dromedario, niente logo).
// Della macchinetta del primo giro Alberto ha detto «fatta da dio»: la nuova tiene la stessa impostazione (frontale, verde
// e blu pieni per schermo e vetrinette) e aggiunge la notte, gli sticker, i tasti numerati, il lettore «Altersnachweis».
//
// Com'è andata il 9.11 sera (27 generazioni lanciate, 26 riuscite, ≈ 5,5 $): i 16 pacchetti giusti al primo colpo (uno rifatto per un timeout
// di Replicate, non per il disegno); la macchinetta fatta due volte, tenuta la prima (lavoro/deutschland/automat/
// 20261109-153455-1.png: luce più drammatica, bocchetta più grande; la seconda sta in automat/scarti/ perché «usa» prende
// l'ultimo PNG della cartella); gli 8 sticker al primo colpo; la GLA è rimasta quella del mattino (a 64 px si legge). Il
// formato più grande che il modello dà in verticale senza «experimental» è 1152×2048: la macchinetta ritagliata viene
// ~1030 px di larghezza, quindi automat-grande.webp è 1028 e non 1800 (sulla pagina sta a ≥ 80 vh: basta).
import { mkdir, readdir, access } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { ROOT, die, predict, prediction, salva } from '../../replicate.mjs'
import { chiave, fondoMagenta, leggiA, rifila, scriviWebp } from '../../mascotte/immagine.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/deutschland')
const ART = join(ROOT, 'pzkko/art/deutschland')
const QUI = join(ROOT, 'tools/pzkko/deutschland')
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const PARALLELO = Math.max(1, Math.min(4, Number(opz('parallelo', 4)) || 4))
const BORDO = [60, 60, 58] // il colore che prendono i pixel spariti: scuro come il muro e la pagina, così i bordi non restano rosa
const ce = (f) => access(f).then(() => true, () => false)

const MAGENTA = 'The background is a perfectly flat, solid, uniform pure magenta (#FF00FF) filling the entire canvas edge to edge: no gradient, no vignette, no shadow cast on it, no reflection, nothing else in the picture.'

// ── i 16 pacchetti ──────────────────────────────────────────────────────────────────────────────────────────────────
// tag del catalogo (pzkko/deutschland/comune.js, più «alles» = tutto) → nome della marca, sottotitolo, carattere, grafica.
// Il nome e il sottotitolo li scrive il modello (gpt-image-2 scrive bene; si controlla sul foglio di contatto).
const PACCHETTI = {
  alles: { nome: 'JMA', sotto: 'Jonny · Mikas · Alberto', font: 'heavy black Roman serif capitals, wide letter-spacing', grafica: 'a white box whose upper part is a big bright red chevron pointing downwards like a roof (the red fills the top and comes down to a point in the middle), the name in black on the white area under the red roof, a tiny gold crest in the middle of the red' },
  pekko: { nome: 'luckypzkko', sotto: 'Original Red', font: 'bold black condensed grotesque, lowercase exactly as written', grafica: 'a white box with a big red bullseye roundel in the middle (red disc, white ring, black ring, thin gold ring), the name in a black band above the roundel' },
  mikas: { nome: "Mikas's Smoke", sotto: 'Baltic Blend · Vilnius', font: 'ornate Victorian serif with swash capitals, dark brown', grafica: 'a warm sand-beige box with a brown illustrated Baltic elk (moose) standing in profile in front of low dunes and a few pine trees, a thin brown border frame around the front' },
  jonny: { nome: "Jonny's Tobacco", sotto: 'Manila Gold', font: 'elegant golden copperplate script with flourishes', grafica: 'a deep emerald green box with gold filigree ornaments, a gold tobacco leaf under the name, a thin double gold border' },
  jella: { nome: 'Jella Leicht', sotto: 'Blondes · Light', font: 'clean white geometric sans-serif, medium weight', grafica: 'a saturated royal blue box, a white winged Gallic helmet drawn in simple lines in the centre, a thin white border' },
  cibo: { nome: 'Brezn Gold', sotto: 'Bayerische Mischung', font: 'readable Bavarian blackletter (Fraktur) in dark brown', grafica: 'a rich golden yellow box with a dark brown stripe across the middle, a glossy brown pretzel with coarse salt drawn above the name, a small blue-and-white Bavarian lozenge pattern detail' },
  paesaggi: { nome: 'Alpenblick', sotto: 'Export · Filter', font: 'tall condensed white serif capitals', grafica: 'a sky blue box with a white snowy Alps panorama drawn across the middle, a small gold crest above the name, a white band at the top' },
  natura: { nome: 'Schwarzwald', sotto: 'Edel · Mild', font: 'classic German grotesque in gold, bold', grafica: 'a dark forest green box with a row of black fir tree silhouettes along the lower part, a gold rule above and below the name, a small gold number 23 near the top' },
  strada: { nome: 'Autobahn 100', sotto: 'Full Flavour', font: 'military stencil capitals in white', grafica: 'a dark charcoal grey box with a black lower half, a blue German motorway sign square with the white road-and-bridge pictogram above the name, a thin silver line' },
  auto: { nome: 'GLA Grau', sotto: 'Silver Edition', font: 'slim elegant engraved chrome serif capitals', grafica: 'a brushed metallic silver-grey box with a darker grey band across the middle, a simple dark compact SUV silhouette seen from the front above the name, a fine black border' },
  screenshot: { nome: 'Bildschirm', sotto: 'Original · f-Serie', font: 'rounded 1970s retro sans-serif in dark brown, lowercase', grafica: 'a bright orange box like an East German pack of the 1970s, a cream square in the upper half with a small pixelated screen symbol in it, two thin brown stripes' },
  hotel: { nome: 'Nachtportier', sotto: 'Rezeption 24h', font: 'gold Art Deco capitals with thin lines', grafica: 'a deep bordeaux red box with gold rules, a golden old hotel room key with a round brass tag hanging in the centre, a small gold star' },
  mezzi: { nome: 'S-Bahn Blau', sotto: 'Linie S1 · Mild', font: 'bold white DIN-like sans-serif', grafica: 'a teal-blue box with a white band, a round green sign with a big white S (the German S-Bahn symbol) in the centre, a thin white route line crossing the front' },
  alcool: { nome: 'Jäger Hirsch 56', sotto: 'Kräuter · Halb und Halb', font: 'bold condensed orange gothic-inspired capitals', grafica: 'a very dark green box, an orange-brown stag head with large antlers and a glowing golden cross between the antlers in the centre, a thin orange border' },
  foto: { nome: 'Südkurve', sotto: 'München · Rot-Weiß', font: 'sporty bold italic sans-serif in white', grafica: 'a bright red box with a white diagonal stripe, a white football stadium silhouette with floodlights in the lower part, a small white 1900 badge' },
  video: { nome: 'Cannstatter', sotto: 'Stuttgart · Wasen', font: 'wide geometric black sans-serif capitals', grafica: 'a white box with one wide bright red horizontal band across the chest like a football jersey, the name in black on the white above the band, a small black ferris-wheel silhouette on the band' },
}
const PACCHI_TAG = Object.keys(PACCHETTI) // 16: alles + i 15 del catalogo

const pacchetto = (p) => `A photorealistic product photograph of ONE German cigarette pack: a hard flip-top box, closed, standing upright, seen perfectly from the front (no perspective, no tilt), centred and filling most of the frame with a margin all around. Soft studio lighting, a gentle highlight on the slightly glossy printed cardboard, fine paper texture visible, crisp edges, the thin horizontal seam of the flip-top lid visible in the upper third. Design: ${p.grafica}. Printed text on the front, exactly and only this: the brand name "${p.nome}" very large and perfectly legible across the upper part, in ${p.font}; under it the smaller subtitle "${p.sotto}"; and at the bottom of the coloured area the small line "20 Filter Zigaretten". The lowest 30% of the front is the mandatory German health warning band: a white rectangle with a thin black border and the bold black text "Rauchen ist tödlich" in plain sans-serif, centred. A narrow pale tax stamp strip (Steuerzeichen) wraps over the top edge of the lid and is partly visible. Spell every word exactly as given. No other text, no barcode, no real-world cigarette brand, logo or mascot anywhere. ${MAGENTA}`

// ── gli sticker ─────────────────────────────────────────────────────────────────────────────────────────────────────
const STICKER = {
  ampelmann: 'the green East German traffic-light man (Ampelmännchen) striding to the left, flat bright green figure with his hat, on a black rounded square',
  currywurst: 'a Currywurst: a white paper tray with a sliced bratwurst covered in red curry ketchup, dusted with curry powder, a tiny wooden fork, drawn bold and juicy',
  ubahn: 'the German U-Bahn sign: a big white capital U on a royal blue square with a thin white border',
  autobahn: 'a German Autobahn sign: a blue square with the white road-and-bridge pictogram (two white lanes going into the distance under a white bridge)',
  mass: 'a one-litre Bavarian glass beer mug (Maß) full of golden beer with a thick white foam head, with the handle to the right',
  brezel: 'a Bavarian pretzel (Brezel), glossy dark brown with coarse white salt grains',
  targa: 'two German car licence plates stacked one above the other with a slight offset: the upper one reads exactly "M · JMA 2026", the lower one reads exactly "S · PZK 56", black FE-Schrift characters on white, each with the blue EU strip with a white D on the left and a small round registration seal after the city letter',
  jma: 'the three letters «JMA» in heavy black condensed sans-serif capitals (spelled exactly J, M, A) on a bright yellow background with one red and one black diagonal stripe behind the letters',
}
const sticker = (cosa) => `A single printed vinyl street sticker seen flat from the front, the kind stuck on lamp posts: ${cosa}. A thick white die-cut border follows the outline, the print is slightly worn and scuffed with tiny scratches, matte finish. Only this one sticker, centred, with a wide margin. No other text. ${MAGENTA}`

// ── tutte le immagini ───────────────────────────────────────────────────────────────────────────────────────────────
const IMMAGINI = {
  automat: {
    // La macchinetta «fatta da dio». Gli sticker e i tag stanno SUL metallo (il corpo va ritagliato e messo sul muro della
    // serranda: l'intonaco intorno non entra nel ritaglio). Verde e blu pieni: schermo.mjs ci trova gli angoli.
    prompt: `A German wall-mounted cigarette vending machine (Zigarettenautomat) from the 1990s, photographed perfectly frontal at night, the whole machine centred and entirely inside the frame with a generous margin all around, nothing else in the picture. Lighting: one warm orange sodium street lamp from the upper left, so the left side of the machine glows warm and the right side falls into cool dark shadow, with small specular highlights on the metal. Body: scratched grey painted sheet steel with chipped paint, rust spots at the lower corners, a few small worn stickers and tiny spray-paint tags on its sides and lower panel (invented, no real brands, no readable words). Layout from top to bottom: a black header with the word ZIGARETTEN in white capital letters; under it a large flat rectangular display panel that is a PERFECTLY UNIFORM SOLID PURE GREEN (#00FF00) rectangle with sharp straight edges, no reflections, no glare, no text on it (a chroma key panel); under the display a row of EIGHT equal product windows side by side, and each window is a PERFECTLY UNIFORM SOLID PURE BLUE (#0000FF) rectangle with no packs, no text and no reflections inside (chroma key rectangles); directly under the windows a row of EIGHT big square grey push buttons, one under each window, each clearly numbered 1 2 3 4 5 6 7 8 in black; on the right side a vertical coin slot with a coin return and a card reader labelled Altersnachweis; at the bottom a wide dispensing tray with a dark opening. No real cigarette brands anywhere. ${MAGENTA}`,
    aspect_ratio: '1152x2048',
  },
  gla: {
    prompt: `A grey 2022 Mercedes-Benz GLA compact SUV seen from directly above (perfect top-down bird's-eye view), the car pointing straight up, in the flat clean style of a navigation-app car icon: simple soft shading, dark windows, no text, no logo, no shadow on the ground, the whole car centred and fully inside the frame with a wide margin. ${MAGENTA}`,
    aspect_ratio: '1:1',
  },
  ...Object.fromEntries(PACCHI_TAG.map((t) => [`pacco-${t}`, { prompt: pacchetto(PACCHETTI[t]), aspect_ratio: '1024x1536' }])),
  ...Object.fromEntries(Object.keys(STICKER).map((s) => [`sticker-${s}`, { prompt: sticker(STICKER[s]), aspect_ratio: '1024x1024' }])),
}

const GRUPPI = { pacchi: PACCHI_TAG.map((t) => `pacco-${t}`), sticker: Object.keys(STICKER).map((s) => `sticker-${s}`), tutti: Object.keys(IMMAGINI) }
const quale = (nome) => IMMAGINI[nome] || die(`nessuna immagine «${nome}»: ${Object.keys(IMMAGINI).join(', ')}`)
const sciogli = (resto) => (resto.length ? resto : ['tutti']).flatMap((n) => GRUPPI[n] || [n])

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
    // la chiave, poi schermo.mjs: il verde → gli angoli, il blu → vetrine e tasti in muro-dati.js, automat.webp e automat-grande.webp
    const img = rifila(await scontornata(file), 4)
    const chiavePng = join(LAVORO, 'automat', 'automat-chiave.png')
    await sharp(img.px, { raw: { width: img.w, height: img.h, channels: 4 } }).png().toFile(chiavePng)
    const r = spawnSync(process.execPath, [join(QUI, 'schermo.mjs'), 'angoli', `--foto=${chiavePng}`, ...process.argv.filter((a) => a.startsWith('--pacchi=') || a.startsWith('--tasti='))], { stdio: 'inherit' })
    if (r.status) die('schermo.mjs angoli non è riuscito')
    return
  }
  if (nome === 'gla') {
    const img = rifila(await scontornata(file), 4)
    const [w, h] = await scriviWebp(img, join(ART, 'gla.webp'), Math.min(1, 160 / img.w), 88)
    console.log(`✓ ${join(ART, 'gla.webp')} (${w}×${h})`)
    return
  }
  if (nome.startsWith('pacco-')) {
    const img = rifila(await scontornata(file), 2), out = join(ART, 'pacchi', `${nome.slice(6)}.webp`)
    await mkdir(join(ART, 'pacchi'), { recursive: true })
    const [w, h] = await scriviWebp(img, out, Math.min(1, 600 / Math.max(img.w, img.h)), 86)
    console.log(`✓ ${out} (${w}×${h})`)
    return
  }
  if (nome.startsWith('sticker-')) {
    const img = rifila(await scontornata(file), 4), out = join(ART, 'sticker', `${nome.slice(8)}.webp`)
    await mkdir(join(ART, 'sticker'), { recursive: true })
    const [w, h] = await scriviWebp(img, out, Math.min(1, 512 / Math.max(img.w, img.h)), 86)
    console.log(`✓ ${out} (${w}×${h})`)
    // l'adesivo JMA sta anche in art/deutschland/jma.webp (480 px): lo usava già la pagina del primo giro
    if (nome === 'sticker-jma') { const [w2, h2] = await scriviWebp(img, join(ART, 'jma.webp'), Math.min(1, 480 / img.w), 88); console.log(`✓ ${join(ART, 'jma.webp')} (${w2}×${h2})`) }
  }
}

/** Il foglio di contatto delle webp di un gruppo, col nome sotto ognuna, in tools/pzkko/lavoro/deutschland/<gruppo>-v2.png. */
async function contatto(gruppo = 'pacchi') {
  const voci = gruppo === 'sticker' ? Object.keys(STICKER).map((s) => [s, join(ART, 'sticker', `${s}.webp`)]) : PACCHI_TAG.map((t) => [`${t} · ${PACCHETTI[t].nome}`, join(ART, 'pacchi', `${t}.webp`)])
  const W = 300, H = gruppo === 'sticker' ? 340 : 440, C = 4, R = Math.ceil(voci.length / C), strati = []
  for (const [i, [nome, file]] of voci.entries()) {
    const x = (i % C) * W, y = Math.floor(i / C) * H
    const svg = `<svg width="${W}" height="${H}"><text x="${W / 2}" y="${H - 10}" font-family="Arial" font-size="15" fill="#eee" text-anchor="middle">${nome.replace(/&/g, '&amp;')}</text></svg>`
    strati.push({ input: Buffer.from(svg), left: x, top: y })
    if (!(await ce(file))) continue
    const b = await sharp(file).resize({ width: W - 24, height: H - 44, fit: 'inside' }).png().toBuffer({ resolveWithObject: true })
    strati.push({ input: b.data, left: x + Math.round((W - b.info.width) / 2), top: y + 10 + Math.round((H - 44 - b.info.height) / 2) })
  }
  const out = join(LAVORO, `${gruppo}-v2.png`)
  await sharp({ create: { width: W * C, height: H * R, channels: 4, background: { r: 60, g: 60, b: 58, alpha: 1 } } }).composite(strati).png().toFile(out)
  console.log(`✓ ${out}`)
}

const [cosa, ...resto] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (cosa === 'genera') await generaTutti(sciogli(resto))
else if (cosa === 'recupera') { const [nome, id] = resto; if (!nome || !id) die('recupera <nome> <id-predizione>'); quale(nome); await salva(await prediction(id), join(LAVORO, nome), { immagine: nome }) }
else if (cosa === 'usa') for (const n of sciogli(resto)) await usa(n)
else if (cosa === 'contatto') await contatto(resto[0])
else { console.log('uso: immagini.mjs genera <nome…|pacchi|sticker|tutti> | recupera <nome> <id> | usa <nome…|pacchi|sticker|tutti> [--file=…] | contatto [pacchi|sticker]'); process.exit(2) }
