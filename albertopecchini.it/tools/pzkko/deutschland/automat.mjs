#!/usr/bin/env node
// La macchinetta gialla e la via per la pagina (Deutschland 4, 10.11.2026): prende le immagini finite di via.mjs
// (lavoro/deutschland/via/automat-finale.png, la macchinetta su magenta con le 20 vetrinette blu pieno e il display
// verde pieno; via-nb/…png, il panorama della strada) e scrive tutto quello che serve a /deutschland/ e alla serranda:
//
//   node tools/pzkko/deutschland/automat.mjs [--controllo]
//
//   pzkko/art/deutschland/automat-gelb-1400.webp, -800.webp   la macchinetta intera, piede compreso, scontornata
//   pzkko/art/deutschland/automat.webp                       solo il corpo, 900 px: la serranda della home
//   pzkko/art/deutschland/via-6000.webp, via-3200.webp        il panorama (srcset) + il segnaposto 40 px in muro-dati.js
//   pzkko/deutschland/muro-dati.js                           le misure (frazioni) di tutto: vedi il commento lì
//   tools/pzkko/lavoro/deutschland/automat-rettangoli.png    il controllo da GUARDARE (vetrinette, display, foglio, bocchetta)
//
// Le vetrinette: le componenti blu, ordinate per righe (4 × 5); in ognuna il nostro pacchetto (art/deutschland/pacchi/)
// che riempie la larghezza e si taglia sotto, col cartellino del prezzo come quelli veri («10€ | 22 STK», nei colori del
// pacchetto) e il riflesso della plastica. Il display LCD: verde-grigio spento (le parole le scrive la pagina sopra).
// Il foglio nero (in basso a sinistra sul giallo): resta nero; sulla serranda ci va lo schermo delle tappe.
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { chiave, leggiA } from '../../mascotte/immagine.mjs'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const LAVORO = join(ROOT, 'tools/pzkko/lavoro/deutschland/via')
const ART = join(ROOT, 'pzkko/art/deutschland')
const DATI = join(ROOT, 'pzkko/deutschland/muro-dati.js')
const MACCHINETTA = join(LAVORO, 'automat-orto-finale.png') // (via.mjs orto: la frontale, coi testi rifatti)
// il muro intorno (via.mjs genera muro-nb: il travertino da vicino, di fronte, col posto vuoto al centro); --muro=file per provarne un altro
const VIA = join(LAVORO, process.argv.find((a) => a.startsWith('--muro='))?.slice(7) || 'muro-scelto.png')
const f4 = (v) => +v.toFixed(4)
const FINE_FASCIA = 3990
// la bocchetta (l'apertura nella fascia d'acciaio), in pixel della 3392 × 5056, a occhio su lavoro/deutschland/via/g-o-fascia.jpg
const BOCCHETTA = [1100, 3505, 1000, 235]

/** Le 20 vetrinette, da sinistra a destra e dall'alto in basso (4 per riga): tag del catalogo (null = JMA, il tavolo),
 *  immagine in art/deutschland/pacchi/, nome per chi legge, prezzo, pezzi, colori del cartellino. Come le macchinette
 *  vere, le marche più vendute stanno due volte (riga 5). */
export const VETRINE = [
  { tag: null, img: 'alles', nome: 'JMA: il tavolo dei ricordi', euro: 10, stk: 22, fondo: '#1d5fbf', testo: '#fff' },
  { tag: 'pekko', img: 'pekko', nome: 'luckypzkko: le foto di Pekko', euro: 10, stk: 24, fondo: '#d4202a', testo: '#fff' },
  { tag: 'mikas', img: 'mikas', nome: 'Mikas’s Smoke: le foto di Mikas', euro: 9, stk: 20, fondo: '#6b4423', testo: '#f6e7c8' },
  { tag: 'jonny', img: 'jonny', nome: 'Jonny’s Tobacco: le foto di Jonny', euro: 10, stk: 23, fondo: '#d9b44a', testo: '#13311f' },
  { tag: 'jella', img: 'jella', nome: 'Jella Leicht: le foto di Jella', euro: 9, stk: 20, fondo: '#ffd400', testo: '#111' },
  { tag: 'alcool', img: 'alcool', nome: 'Jäger Hirsch 56: l’alcool', euro: 10, stk: 22, fondo: '#e07a1f', testo: '#fff' },
  { tag: 'foto', img: 'foto', nome: 'Südkurve: tutte le foto', euro: 10, stk: 22, fondo: '#fff', testo: '#c8102e' },
  { tag: 'video', img: 'video', nome: 'Cannstatter: i video', euro: 9, stk: 20, fondo: '#c8102e', testo: '#fff' },
  { tag: 'cibo', img: 'cibo', nome: 'Brezn Gold: il cibo', euro: 9, stk: 20, fondo: '#5a3418', testo: '#ffd25a' },
  { tag: 'paesaggi', img: 'paesaggi', nome: 'Alpenblick: i paesaggi', euro: 10, stk: 22, fondo: '#fff', testo: '#1f6fb5' },
  { tag: 'natura', img: 'natura', nome: 'Schwarzwald: la natura', euro: 10, stk: 23, fondo: '#c9a13b', testo: '#10301c' },
  { tag: 'strada', img: 'strada', nome: 'Autobahn 100: la strada', euro: 9, stk: 20, fondo: '#ffd400', testo: '#111' },
  { tag: 'auto', img: 'auto', nome: 'GLA Grau: la macchina', euro: 10, stk: 22, fondo: '#1b1b1b', testo: '#e8e8e8' },
  { tag: 'screenshot', img: 'screenshot', nome: 'Bildschirm: gli screenshot', euro: 9, stk: 20, fondo: '#5a3418', testo: '#ffb347' },
  { tag: 'hotel', img: 'hotel', nome: 'Nachtportier: l’hotel', euro: 10, stk: 24, fondo: '#d4af37', testo: '#4a0d1a' },
  { tag: 'mezzi', img: 'mezzi', nome: 'S-Bahn Blau: i mezzi', euro: 9, stk: 20, fondo: '#fff', testo: '#00727a' },
  { tag: null, img: 'alles', nome: 'JMA: il tavolo dei ricordi', euro: 10, stk: 22, fondo: '#1d5fbf', testo: '#fff' },
  { tag: 'pekko', img: 'pekko', nome: 'luckypzkko: le foto di Pekko', euro: 10, stk: 24, fondo: '#d4202a', testo: '#fff' },
  { tag: 'foto', img: 'foto', nome: 'Südkurve: tutte le foto', euro: 10, stk: 22, fondo: '#fff', testo: '#c8102e' },
  { tag: 'video', img: 'video', nome: 'Cannstatter: i video', euro: 9, stk: 20, fondo: '#c8102e', testo: '#fff' },
]

const blu = (r, g, b) => b > 150 && b - Math.max(r, g) > 120
const verde = (r, g, b) => g > 150 && g - Math.max(r, b) > 120
const nero = (r, g, b) => r < 34 && g < 34 && b < 36

/** Componenti connesse (4 vicini) dei pixel opachi che passano `test`, con riquadro e numero di pixel. */
function componenti(px, w, h, test, minimo = 400) {
  const si = new Uint8Array(w * h), visto = new Uint8Array(w * h), out = []
  for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] > 200 && test(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])) si[i] = 1
  for (let s = 0; s < w * h; s++) {
    if (!si[s] || visto[s]) continue
    const c = { n: 0, x0: w, y0: h, x1: 0, y1: 0 }, coda = [s]; visto[s] = 1
    while (coda.length) {
      const p = coda.pop(), x = p % w, y = (p / w) | 0
      c.n++; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y
      for (const q of [p + 1, p - 1, p + w, p - w]) if (q >= 0 && q < w * h && si[q] && !visto[q] && Math.abs((q % w) - x) <= 1) { visto[q] = 1; coda.push(q) }
    }
    if (c.n >= minimo) out.push(c)
  }
  return out
}

/** Il cartellino del prezzo (SVG largo w, alto h) come sulle vetrinette vere: il prezzo grande a sinistra, i pezzi nel
 *  riquadro a destra. */
const cartellino = (v, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${v.fondo}"/><rect width="${w}" height="${Math.max(2, h * 0.05)}" fill="#000" opacity=".18"/>
  <text x="${w * 0.33}" y="${h * 0.78}" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${h * (v.euro >= 10 ? 0.6 : 0.68)}" letter-spacing="${-h * 0.03}" fill="${v.testo}">${v.euro}€</text>
  <g font-family="Arial" font-weight="700" fill="${v.testo}" text-anchor="middle"><text x="${w * 0.825}" y="${h * 0.5}" font-size="${h * 0.34}">${v.stk}</text><text x="${w * 0.825}" y="${h * 0.84}" font-size="${h * 0.26}">STK</text></g>
  <rect x="${w * 0.68}" y="${h * 0.14}" width="${w * 0.29}" height="${h * 0.76}" fill="none" stroke="${v.testo}" stroke-width="${Math.max(1, h * 0.045)}" opacity=".85"/></svg>`


/** La vetrinetta riempita: il pacchetto largo quanto lei (si taglia sotto), il cartellino, la plastica sopra. */
async function vetrina(v, w, h) {
  const pacco = await sharp(join(ART, 'pacchi', `${v.img}.webp`)).resize({ width: Math.round(w * 1.04) }).png().toBuffer({ resolveWithObject: true })
  const ch = Math.round(h * 0.27), strati = [
    { input: await sharp(pacco.data).extract({ left: Math.round(w * 0.02), top: 0, width: w, height: Math.min(pacco.info.height, h) }).png().toBuffer(), left: 0, top: Math.round(-h * 0.0) },
    { input: Buffer.from(cartellino(v, w, ch)), left: 0, top: h - ch },
    // la plastica: un riflesso in diagonale, l'orlo scuro, un'ombra in alto (la vetrinetta è incassata)
    { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".38" stop-color="#fff" stop-opacity=".08"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".06"/></linearGradient><linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".12" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#o)"/><rect width="${w}" height="${h}" fill="url(#r)"/><rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${Math.max(2, w * 0.03)}"/></svg>`), left: 0, top: 0 },
  ]
  return sharp({ create: { width: w, height: h, channels: 4, background: { r: 58, g: 58, b: 60, alpha: 1 } } }).composite(strati).png().toBuffer()
}

async function macchinetta() {
  const img = await leggiA(MACCHINETTA)
  chiave(img, [150, 142, 124])
  const { w, h, px } = img
  // le cose da trovare
  const blu20 = componenti(px, w, h, blu, 2000)
  if (blu20.length !== 20) throw new Error(`vetrinette blu: ${blu20.length}, ne servono 20`)
  // per righe: ordina per y, raggruppa a 4, poi per x
  blu20.sort((a, b) => a.y0 - b.y0)
  const righe = Array.from({ length: 5 }, (_, i) => blu20.slice(i * 4, i * 4 + 4).sort((a, b) => a.x0 - b.x0)).flat()
  const lcd = componenti(px, w, h, verde, 2000).sort((a, b) => b.n - a.n)[0]
  const foglio = componenti(px, w, h, nero, 20000).sort((a, b) => b.n - a.n)[0]
  if (!lcd || !foglio) throw new Error(`manca ${lcd ? 'il foglio nero' : 'il display verde'}`)
  // il corpo finisce dove finisce la fascia d'acciaio: la riga più bassa larga quasi quanto la macchinetta (sotto c'è il piede, più stretto)
  const larg = new Array(h).fill(0)
  for (let y = 0; y < h; y++) { let a = -1, b = -1; for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 128) { if (a < 0) a = x; b = x } larg[y] = a < 0 ? 0 : b - a }
  // (la fascia d'acciaio della bocchetta finisce a y 3891 della 3392 × 5056, misurata a occhio su automat-rettangoli.png:
  // la larghezza delle righe non basta, lo scivolo a destra la falsa)
  const finoCorpo = FINE_FASCIA
  let cima = 0; while (larg[cima] === 0) cima++
  let fondo = h - 1; while (larg[fondo] === 0) fondo--
  let sx = w, dx = 0
  for (let y = cima; y <= fondo; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 128) { if (x < sx) sx = x; if (x > dx) dx = x }
  console.log(`macchinetta ${w}×${h}: occupa x ${sx}–${dx}, y ${cima}–${fondo}; corpo fino a y ${finoCorpo}; display ${lcd.x0},${lcd.y0}–${lcd.x1},${lcd.y1}; foglio ${foglio.x0},${foglio.y0}–${foglio.x1},${foglio.y1}`)
  // il display spento (verde-grigio, un filo più scuro in alto) e le vetrinette coi pacchetti
  const lw = lcd.x1 - lcd.x0 + 1, lh = lcd.y1 - lcd.y0 + 1
  const strati = [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lw + 6}" height="${lh + 6}"><defs><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7a63"/><stop offset=".3" stop-color="#8d9a80"/><stop offset="1" stop-color="#97a38a"/></linearGradient></defs><rect width="${lw + 6}" height="${lh + 6}" fill="url(#l)"/><rect width="${lw + 6}" height="${lh + 6}" fill="none" stroke="#2b2f27" stroke-width="5"/></svg>`), left: lcd.x0 - 3, top: lcd.y0 - 3 }]
  for (const [i, b] of righe.entries()) {
    const vw = b.x1 - b.x0 + 5, vh = b.y1 - b.y0 + 5
    strati.push({ input: await vetrina(VETRINE[i], vw, vh), left: b.x0 - 2, top: b.y0 - 2 })
  }
  // (sharp: prima si compone in un buffer, poi si ritaglia e si riduce)
  const pieno = await sharp(px, { raw: { width: w, height: h, channels: 4 } }).composite(strati).raw().toBuffer()
  // i pixel ancora blu o verdi sull'orlo (l'alone della chiave) → grigio
  for (let i = 0; i < w * h; i++) { const r = pieno[i * 4], g = pieno[i * 4 + 1], b = pieno[i * 4 + 2]; if (b - Math.max(r, g) > 90 || g - Math.max(r, b) > 90) { pieno[i * 4] = pieno[i * 4 + 1] = pieno[i * 4 + 2] = 70 } }
  const tutto = { left: sx, top: cima, width: dx - sx + 1, height: fondo - cima + 1 }
  const T = sharp(pieno, { raw: { width: w, height: h, channels: 4 } })
  await mkdir(ART, { recursive: true })
  const ritaglio = await T.clone().extract(tutto).png().toBuffer()
  for (const L of [1400, 800]) await sharp(ritaglio).resize({ width: L }).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(join(ART, `automat-gelb-${L}.webp`))
  // la serranda: solo il corpo, 900 px
  await sharp(pieno, { raw: { width: w, height: h, channels: 4 } }).extract({ ...tutto, height: finoCorpo - cima + 1 }).resize({ width: 900 }).webp({ quality: 84, alphaQuality: 90 }).toFile(join(ART, 'automat.webp'))
  const [bx, by, bw, bh] = BOCCHETTA, boc = { x0: bx, y0: by, x1: bx + bw - 1, y1: by + bh - 1 }
  // le misure: frazioni del ritaglio intero (pagina) e del corpo (serranda)
  const fr = (b, R) => [f4((b.x0 - R.left) / R.width), f4((b.y0 - R.top) / R.height), f4((b.x1 - b.x0 + 1) / R.width), f4((b.y1 - b.y0 + 1) / R.height)]
  const quad = (b, R) => { const [x, y, ww, hh] = fr(b, R); return [[x, y], [f4(x + ww), y], [f4(x + ww), f4(y + hh)], [x, f4(y + hh)]] }
  const corpo = { ...tutto, height: finoCorpo - cima + 1 }
  return {
    pagina: { w: tutto.width, h: tutto.height, foglio: fr(foglio, tutto), lcd: quad(lcd, tutto), corpo: f4(corpo.height / tutto.height), vetrine: righe.map((b) => fr(b, tutto)), bocchetta: fr(boc, tutto) },
    muro: { w: 900, h: Math.round((corpo.height / corpo.width) * 900), schermo: quad(foglio, corpo) },
    controllo: { pieno, w, h, righe, lcd, foglio, bocchetta: boc, tutto },
  }
}

async function via() {
  const m = await sharp(VIA).metadata()
  for (const L of [4800, 2400]) await sharp(VIA).resize({ width: Math.min(L, m.width) }).webp({ quality: L > 3000 ? 76 : 80, effort: 6 }).toFile(join(ART, `muro-${L}.webp`))
  const segnaposto = `data:image/webp;base64,${(await sharp(VIA).resize({ width: 40 }).webp({ quality: 50 }).toBuffer()).toString('base64')}`
  return { w: m.width, h: m.height, segnaposto }
}

const d = await macchinetta()
const v = await via()
// dove sta la macchinetta sul muro (frazioni dell'immagine): il centro x, il piede sul marciapiede, l'altezza (il prompt
// MURO di via.mjs lascia vuoto il centro, 37–63 % in larghezza, dal 18 % al marciapiede all'87 %)
const POSTO = { x: 0.5, piede: 0.875, alto: 0.68 }
const js = `// Le misure della macchinetta gialla di Stoccarda e della sua via (Deutschland 4, 10.11.2026): le scrive
// tools/pzkko/deutschland/automat.mjs dalle immagini di via.mjs, non a mano (tranne \`via.posto\`, lì in POSTO). Tutto in
// frazioni dell'immagine a cui si riferisce, i quadrilateri da in alto a sinistra in senso orario.
//   default        la serranda della home (art/deutschland/automat.webp, solo il corpo): \`schermo\` = il foglio nero, dove
//                  muro.js proietta lo sprite delle tappe
//   pagina         la macchinetta intera di /deutschland/ (automat-gelb-*.webp, piede compreso): \`foglio\`, \`lcd\`,
//                  \`corpo\` (dove finisce la fascia d'acciaio, in altezza), le 20 \`vetrine\` [x, y, w, h] (per righe
//                  da 4: i tasti veri) e la \`bocchetta\` (da dove cade il pacchetto)
//   vetrine        cosa c'è in ogni vetrinetta (tag del catalogo, immagine, nome, prezzo)
//   via            il panorama (via-*.webp): misure, segnaposto, e dove sta la macchinetta (\`posto\`: centro x, piede, altezza)
export const pagina = ${JSON.stringify(d.pagina)}
export const vetrine = ${JSON.stringify(VETRINE.map(({ tag, img, nome, euro, stk }) => ({ tag, img, nome, euro, stk })))}
export const via = ${JSON.stringify({ w: v.w, h: v.h, posto: POSTO, segnaposto: v.segnaposto })}
export default ${JSON.stringify(d.muro)}
`
await writeFile(DATI, js)
console.log(`✓ ${DATI}`)
// il controllo
const c = d.controllo, R = (b, col) => `<rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" fill="none" stroke="${col}" stroke-width="8"/>`
const svg = `<svg width="${c.w}" height="${c.h}">${c.righe.map((b, i) => R(b, '#0ff') + `<text x="${b.x0 + 8}" y="${b.y0 + 50}" font-size="44" fill="#f0f">${i + 1}</text>`).join('')}${R(c.lcd, '#0f0')}${R(c.foglio, '#f80')}${R(c.bocchetta, '#f0f')}</svg>`
const buf = await sharp(c.pieno, { raw: { width: c.w, height: c.h, channels: 4 } }).composite([{ input: Buffer.from(svg) }]).png().toBuffer()
await sharp(buf).flatten({ background: '#555' }).resize({ width: 1100 }).png().toFile(join(ROOT, 'tools/pzkko/lavoro/deutschland/automat-rettangoli.png'))
console.log('✓ controllo: tools/pzkko/lavoro/deutschland/automat-rettangoli.png')
