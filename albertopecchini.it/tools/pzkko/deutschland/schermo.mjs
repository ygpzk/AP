#!/usr/bin/env node
// Lo schermo della macchinetta delle sigarette (9.11.2026): due lavori, tutti e due con sharp.
//
//   node tools/pzkko/deutschland/schermo.mjs angoli [--foto=tools/pzkko/lavoro/deutschland/automat.png]
//       nella foto della macchinetta (gpt-image-2, immagini.mjs) trova lo schermo verde pieno (#00FF00: G alto e lontano
//       da R e B), ne prende i quattro angoli e li scrive in frazioni in pzkko/deutschland/muro-dati.js (`schermo`; la
//       `manopola` resta com'è), poi riempie il verde di nero spento (#0b0f0a) e scrive pzkko/art/deutschland/automat.webp
//       (900 px, sul muro si vede al più a 290 px CSS) e automat-grande.webp (1800 px, la pagina). Le otto vetrinette
//       sopra le manopole sono blu pieno (#0000FF) nella foto: le trova (componenti connesse, da sinistra), le riempie
//       di grigio scuro e ci compone i nostri pacchetti (pacchi/<tag>.webp, con un po' d'ombra; --pacchi=alles,pekko,…),
//       così dentro non ci sono marche vere (Alberto: marche inventate)
//   node tools/pzkko/deutschland/schermo.mjs sprite [--finto]
//       lo sprite delle tappe per lo schermo sul muro: 4 × 3 mattonelle di 12 × 9 px, ingrandite ×6 a pixel netti e
//       sfumate di 1 px → pzkko/art/deutschland/schermo.webp (irriconoscibili: possono stare nel repo). Le mattonelle
//       vengono dalle miniature del manifesto vero (C:\pzkko-server\deutschland\dati\foto.json e dati\m\, 12 foto a
//       passo regolare lungo il viaggio); con --finto, o se il manifesto non c'è, 12 colori e forme astratte.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const ART = join(ROOT, 'pzkko/art/deutschland')
const DATI = join(ROOT, 'pzkko/deutschland/muro-dati.js')
const SERVER = process.env.PZKKO_DEUTSCHLAND || 'C:\\pzkko-server\\deutschland\\dati'
const SPENTO = { r: 11, g: 15, b: 10 } // #0b0f0a
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const ce = (f) => access(f).then(() => true, () => false)

// ── angoli ──────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Quanto un pixel è «il verde dello schermo»: 0–1 (G alto e ben sopra R e B; l'orlo sfumato viene a metà). */
const verde = (r, g, b) => Math.max(0, Math.min(1, (g - Math.max(r, b) - 60) / 90)) * (g > 150 ? 1 : 0)

/** Quanto un pixel è «il blu delle vetrinette» (#0000FF): 0–1, come verde(). */
const blu = (r, g, b) => Math.max(0, Math.min(1, (b - Math.max(r, g) - 60) / 90)) * (b > 150 ? 1 : 0)
const VETRINA = { r: 40, g: 41, b: 43 } // il fondo della vetrinetta, grigio scuro
const PACCHI_VETRINE = 'alles,pekko,mikas,jonny,jella,alcool,foto,video' // gli otto pacchetti nelle vetrinette (--pacchi=…)

/** Le componenti connesse dei pixel blu pieni, con riquadro, grandi almeno 400 pixel, da sinistra a destra. */
function componentiBlu(data, w, h) {
  const pieno = new Uint8Array(w * h), visto = new Uint8Array(w * h), out = []
  for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] > 200 && blu(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) > 0.9) pieno[i] = 1
  for (let s = 0; s < w * h; s++) {
    if (!pieno[s] || visto[s]) continue
    const c = { n: 0, x0: w, y0: h, x1: 0, y1: 0 }, coda = [s]; visto[s] = 1
    while (coda.length) {
      const p = coda.pop(), x = p % w, y = (p / w) | 0
      c.n++; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (pieno[q] && !visto[q]) { visto[q] = 1; coda.push(q) } }
    }
    if (c.n >= 400) out.push(c)
  }
  return out.sort((a, b) => a.x0 - b.x0)
}

async function angoli() {
  const foto = resolve(ROOT, arg('foto', 'tools/pzkko/lavoro/deutschland/automat.png'))
  if (!(await ce(foto))) throw new Error(`non trovo la foto ${foto}: prima node tools/pzkko/deutschland/immagini.mjs automat`)
  const img = sharp(foto).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  // i quattro angoli: gli estremi di x+y, x−y, −x+y, −x−y fra i pixel verdi pieni (> .9); poi un giro di pulizia: solo
  // la componente grande (il verde sparso altrove, es. un riflesso, non conta): si tiene chi sta nel riquadro del grosso
  let n = 0, sx = 0, sy = 0
  const pieno = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) { const v = verde(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]); if (v > 0.9 && data[i * 4 + 3] > 200) { pieno[i] = 1; n++; sx += i % w; sy += (i / w) | 0 } }
  if (n < 400) throw new Error(`il verde dello schermo non c'è (${n} pixel): la foto non ha il rettangolo #00FF00 pieno`)
  const cx = sx / n, cy = sy / n
  // la componente del centro: allagamento dal pixel verde più vicino al baricentro
  let seme = -1, dist = Infinity
  for (let i = 0; i < w * h; i++) if (pieno[i]) { const d = (i % w - cx) ** 2 + (((i / w) | 0) - cy) ** 2; if (d < dist) { dist = d; seme = i } }
  const dentro = new Uint8Array(w * h), coda = [seme]; dentro[seme] = 1
  while (coda.length) { const p = coda.pop(), x = p % w, y = (p / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (pieno[q] && !dentro[q]) { dentro[q] = 1; coda.push(q) } } }
  let tl = null, tr = null, br = null, bl = null
  for (let i = 0; i < w * h; i++) {
    if (!dentro[i]) continue
    const x = i % w, y = (i / w) | 0
    if (!tl || x + y < tl[0] + tl[1]) tl = [x, y]
    if (!tr || x - y > tr[0] - tr[1]) tr = [x, y]
    if (!br || x + y > br[0] + br[1]) br = [x, y]
    if (!bl || y - x > bl[1] - bl[0]) bl = [x, y]
  }
  // (l'angolo è il pixel estremo: il bordo esterno sta mezzo pixel più in là)
  const fr = ([x, y], ax, ay) => [+((x + ax) / w).toFixed(4), +((y + ay) / h).toFixed(4)]
  const schermo = [fr(tl, 0, 0), fr(tr, 1, 0), fr(br, 1, 1), fr(bl, 0, 1)]
  console.log(`schermo: ${schermo.map((p) => `(${p[0]}, ${p[1]})`).join(' ')}  (${w}×${h}, ${n} pixel verdi)`)
  // muro-dati.js: solo `schermo`, con le misure della foto
  let js = await readFile(DATI, 'utf8')
  js = js.replace(/schermo:\s*\[\[[^\]]*\](?:,\s*\[[^\]]*\]){3}\]/, `schermo: ${JSON.stringify(schermo).replace(/,/g, ', ')}`).replace(/w:\s*\d+,\s*h:\s*\d+/, `w: 900, h: ${Math.round((h / w) * 900)}`)
  await writeFile(DATI, js)
  // il verde → nero spento, il blu delle vetrinette → grigio scuro (l'orlo sfumato si mescola), poi le due misure
  const out = Buffer.from(data)
  for (let i = 0; i < w * h; i++) {
    const v = verde(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]), u = v ? 0 : blu(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
    if (!v && !u) continue
    const c = v ? SPENTO : VETRINA, k = v || u
    out[i * 4] = Math.round(data[i * 4] * (1 - k) + c.r * k); out[i * 4 + 1] = Math.round(data[i * 4 + 1] * (1 - k) + c.g * k); out[i * 4 + 2] = Math.round(data[i * 4 + 2] * (1 - k) + c.b * k)
  }
  await mkdir(ART, { recursive: true })
  // le vetrinette: i rettangoli blu (componenti connesse, da sinistra a destra), e dentro i nostri pacchetti
  const vetrine = componentiBlu(data, w, h)
  let base = sharp(out, { raw: { width: w, height: h, channels: 4 } })
  if (vetrine.length) {
    console.log(`vetrinette: ${vetrine.length} ${vetrine.map((b) => `[${(b.x0 / w).toFixed(3)},${(b.y0 / h).toFixed(3)} ${((b.x1 - b.x0 + 1) / w).toFixed(3)}×${((b.y1 - b.y0 + 1) / h).toFixed(3)}]`).join(' ')}`)
    const nomi = arg('pacchi', PACCHI_VETRINE).split(',')
    const strati = []
    for (const [i, b] of vetrine.entries()) {
      const nome = nomi[i % nomi.length], file = join(ART, 'pacchi', `${nome}.webp`)
      if (!(await ce(file))) { console.warn(`  manca ${file}`); continue }
      const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
      const pacco = await sharp(file).resize({ width: Math.round(bw * 0.78), height: Math.round(bh * 0.84), fit: 'inside' }).png().toBuffer({ resolveWithObject: true })
      const left = Math.round(b.x0 + (bw - pacco.info.width) / 2), top = Math.round(b.y0 + (bh - pacco.info.height) / 2)
      // l'ombra: la sagoma del pacchetto, nera e sfumata, un po' più in basso a destra
      const ombra = await sharp(pacco.data).ensureAlpha().linear([0, 0, 0, 0.55], [0, 0, 0, 0]).blur(3).png().toBuffer()
      strati.push({ input: ombra, left: left + Math.round(bw * 0.03), top: top + Math.round(bh * 0.04) }, { input: pacco.data, left, top })
    }
    base = sharp(await base.composite(strati).raw().toBuffer(), { raw: { width: w, height: h, channels: 4 } })
  } else console.warn('nessuna vetrinetta blu nella foto: resta com’è')
  await base.clone().resize({ width: 900 }).webp({ quality: 84, alphaQuality: 90 }).toFile(join(ART, 'automat.webp'))
  await base.clone().resize({ width: Math.min(1800, w) }).webp({ quality: 86, alphaQuality: 90 }).toFile(join(ART, 'automat-grande.webp'))
  console.log(`✓ ${join(ART, 'automat.webp')} (900) e automat-grande.webp (${Math.min(1800, w)}); muro-dati.js aggiornato`)
}

// ── sprite ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const TW = 12, TH = 9, K = 6, COL = 4, RIG = 3

/** Le 12 miniature del viaggio dal manifesto vero (a passo regolare lungo le foto), o null se non c'è. */
async function miniature() {
  const manifesto = join(SERVER, 'foto.json')
  if (!(await ce(manifesto))) return null
  const m = JSON.parse(await readFile(manifesto, 'utf8'))
  const foto = (m.foto ?? []).filter((f) => f.m)
  if (foto.length < 12) return null
  const scelte = Array.from({ length: 12 }, (_, i) => foto[Math.floor(((i + 0.5) / 12) * foto.length)])
  const tessere = []
  for (const f of scelte) {
    const file = join(SERVER, 'm', f.m)
    if (!(await ce(file))) return null
    tessere.push(await sharp(file).resize(TW, TH, { fit: 'cover', kernel: 'lanczos3' }).removeAlpha().raw().toBuffer())
  }
  console.log(`12 tappe dal manifesto vero (${foto.length} foto)`)
  return tessere
}

/** 12 mattonelle finte: cielo e terra in due colori, una forma in mezzo (il viaggio in astratto). */
function finte() {
  const TINTE = [[[72, 110, 170], [60, 70, 60]], [[200, 160, 90], [90, 60, 40]], [[40, 40, 50], [180, 30, 30]], [[120, 170, 200], [40, 90, 50]],
    [[230, 200, 60], [30, 30, 30]], [[90, 90, 100], [200, 200, 210]], [[30, 60, 120], [20, 20, 30]], [[170, 120, 200], [60, 40, 70]],
    [[240, 240, 230], [120, 120, 130]], [[20, 120, 90], [10, 40, 30]], [[220, 90, 40], [60, 30, 20]], [[140, 180, 90], [40, 60, 30]]]
  return TINTE.map(([a, b], i) => {
    const buf = Buffer.alloc(TW * TH * 3), oriz = 4 + (i % 3)
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const p = (y * TW + x) * 3, c = y < oriz ? a : b
      buf[p] = c[0]; buf[p + 1] = c[1]; buf[p + 2] = c[2]
      // una forma: una torre, una casa, un'auto, a seconda della mattonella
      const forma = i % 4 === 0 ? x >= 5 && x <= 6 && y >= 1 : i % 4 === 1 ? Math.abs(x - 6) <= 2 && y >= oriz - 2 && y < oriz + 1 : i % 4 === 2 ? y === oriz && x >= 3 && x <= 8 : x >= 2 && x <= 3 && y >= oriz - 3 && y < oriz
      if (forma) { buf[p] = Math.round(c[0] * 0.5 + 40); buf[p + 1] = Math.round(c[1] * 0.5 + 40); buf[p + 2] = Math.round(c[2] * 0.5 + 40) }
    }
    return buf
  })
}

async function sprite() {
  const vere = process.argv.includes('--finto') ? null : await miniature()
  const tessere = vere ?? finte()
  if (tessere.length !== 12) throw new Error('servono 12 mattonelle')
  // il foglio 48 × 27 (4 × 3 mattonelle), poi ×6 a pixel netti e sfumato di 1 px
  const W = TW * COL, H = TH * RIG, foglio = Buffer.alloc(W * H * 3)
  tessere.forEach((t, i) => { const ox = (i % COL) * TW, oy = Math.floor(i / COL) * TH; for (let y = 0; y < TH; y++) t.copy(foglio, ((oy + y) * W + ox) * 3, y * TW * 3, (y + 1) * TW * 3) })
  await mkdir(ART, { recursive: true })
  const out = join(ART, 'schermo.webp')
  await sharp(foglio, { raw: { width: W, height: H, channels: 3 } }).resize(W * K, H * K, { kernel: 'nearest' }).blur(1).webp({ quality: 80 }).toFile(out)
  console.log(`✓ ${out} (${W * K}×${H * K}, ${vere ? 'dal manifesto vero' : 'finto'})`)
}

const cosa = process.argv[2]
try {
  if (cosa === 'angoli') await angoli()
  else if (cosa === 'sprite') await sprite()
  else { console.log('uso: schermo.mjs angoli [--foto=…] | sprite [--finto]'); process.exit(2) }
} catch (e) { console.error(`✗ ${e.message}`); process.exit(1) }
