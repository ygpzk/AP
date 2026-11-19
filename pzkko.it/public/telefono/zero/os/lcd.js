// L'lcd di pzk os (29.10): 256 × 128 pixel d'impaginazione, il doppio del Flipper (128 × 64). Dall'11.11 (Alberto:
// «aumenta la qualità dei pixel in dpi e fai colori a 8bit su tutto») i pixel veri sono il doppio per lato (D = 2:
// 512 × 256, come uno schermo retina) e ognuno ha un colore della tavolozza a 8 bit (256 colori). Le app disegnano come
// prima, coi numeri di 256 × 128: un pixel loro è un quadratino di 2 × 2 pixel veri; il testo esce col carattere di
// font.js ingrandito con Scale2x (le diagonali si ammorbidiscono invece di fare scalini), le icone e le foto coi loro
// pixel veri e i loro colori. Nel buffer: 0 è il fondo (lo sfondo scelto nelle impostazioni, anche a motivi), 1
// l'inchiostro del tema, 16–231 il cubo di colori 6 × 6 × 6, 232–255 i grigi. La tela: tre texel per pixel vero con un
// filo di griglia (1536 × 768), la stessa che zero.js stende sotto il vetro del 3D e che muro.js ricopia sul tasto del
// muro. La retroilluminazione (luce 0–1) scurisce tutto: spenta, lo schermo resta leggibile ma scuro, come un lcd vero.
import { glifo, PASSO, ALTEZZA } from './font.js'

export const W = 256, H = 128
/** I pixel veri per ogni pixel d'impaginazione, per lato. */
export const D = 2
export const PW = W * D, PH = H * D
const K = 3 // texel per pixel vero

// ── la tavolozza a 8 bit ──
const LIV = [0, 51, 102, 153, 204, 255]
const TAV = new Array(256).fill(null)
for (let i = 0; i < 216; i++) TAV[16 + i] = [LIV[Math.floor(i / 36)], LIV[Math.floor(i / 6) % 6], LIV[i % 6]]
for (let i = 0; i < 24; i++) { const v = 8 + i * 10; TAV[232 + i] = [v, v, v] }
const vicini = new Map()
/** Il colore della tavolozza più vicino a r, g, b (0–255). → l'indice da dare a px, riempi, testo({ col }) */
export function colore(r, g, b) {
  const k = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2)
  let i = vicini.get(k)
  if (i !== undefined) return i
  let meglio = 1e9
  for (let j = 16; j < 256; j++) { const c = TAV[j], d = 2 * (c[0] - r) ** 2 + 4 * (c[1] - g) ** 2 + 3 * (c[2] - b) ** 2; if (d < meglio) { meglio = d; i = j } }
  vicini.set(k, i)
  return i
}
/** Un colore #rrggbb → l'indice. */
export const esa = (s) => colore(parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16))
/** L'rgb di un indice (0 e 1 sono quelli del tema). */
export const rgb = (i) => TAV[i] ?? [0, 0, 0]
/** Qualche colore con un nome, per le app. */
export const C = {
  rosso: esa('#ff3300'), arancio: esa('#ff9900'), giallo: esa('#ffcc00'), verde: esa('#33cc33'), acqua: esa('#00cccc'),
  blu: esa('#3366ff'), viola: esa('#9933cc'), rosa: esa('#ff6699'), marrone: esa('#996633'), grigio: esa('#999999'),
  bianco: esa('#ffffff'), nero: esa('#000000'), oro: esa('#ffcc33'), cielo: esa('#66ccff'), erba: esa('#669933'),
}

// ── gli sfondi (11.11, Alberto: «dammi impostazione per cambiare sfondo»): il fondo (un colore, o un motivo che dipende dal
// pixel vero) e l'inchiostro che ci si legge sopra. Tutto passa dalla tavolozza: i passaggi di colore col retino di Bayer ──
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
const q = (c) => rgb(colore(c[0], c[1], c[2]))
const sfuma = (a, b, t, x, y) => { const s = t + (BAYER[y & 3][x & 3] / 16 - 0.47) * 0.16; return s < 0.5 ? a : b } // (due colori della tavolozza, mescolati a retino)
const tinta = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t))
function gradiente(alto, basso) {
  const passi = 6, P = Array.from({ length: passi + 1 }, (_, i) => q(tinta(alto, basso, i / passi)))
  return (x, y) => { const t = (y / (PH - 1)) * passi, i = Math.min(passi - 1, Math.floor(t)); return sfuma(P[i], P[i + 1], t - i, x, y) }
}
export const SFONDI = [
  { id: 'arancione', nome: 'arancione', fondo: [247, 161, 58], inchiostro: [34, 20, 8] }, // (la retroilluminazione del Flipper vero)
  { id: 'verde', nome: 'verde lcd', fondo: [155, 188, 15], inchiostro: [15, 56, 15] },
  { id: 'carta', nome: 'carta', fondo: [236, 232, 220], inchiostro: [24, 24, 32] },
  { id: 'cielo', nome: 'cielo', fondo: [140, 200, 255], inchiostro: [10, 24, 60] },
  { id: 'rosa', nome: 'rosa', fondo: [255, 170, 200], inchiostro: [60, 10, 40] },
  { id: 'notte', nome: 'notte', fondo: [0, 0, 51], inchiostro: [235, 230, 200] },
  { id: 'tramonto', nome: 'tramonto', fondo: gradiente([255, 200, 90], [240, 90, 120]), inchiostro: [40, 10, 20] },
  { id: 'mare', nome: 'mare', fondo: gradiente([150, 230, 255], [40, 110, 200]), inchiostro: [5, 15, 40] },
  { id: 'puntini', nome: 'puntini', fondo: (() => { const a = q([247, 161, 58]), b = q([255, 204, 102]); return (x, y) => (x % 16 < 2 && y % 16 < 2 ? b : a) })(), inchiostro: [34, 20, 8] },
  { id: 'scacchi', nome: 'scacchi', fondo: (() => { const a = q([200, 230, 160]), b = q([180, 214, 140]); return (x, y) => ((Math.floor(x / 32) + Math.floor(y / 32)) % 2 ? b : a) })(), inchiostro: [20, 40, 10] },
  { id: 'righe', nome: 'righe', fondo: (() => { const a = q([236, 232, 220]), b = q([214, 208, 196]); return (x, y) => ((x + y) % 24 < 8 ? b : a) })(), inchiostro: [24, 24, 32] },
]
export const sfondo = (id) => SFONDI.find((s) => s.id === id) ?? SFONDI[0]

// ── il carattere ad alta densità: il glifo 5 × 7 di font.js passato per Scale2x (una volta per scala 1, due per scala 2):
// le curve e le diagonali si arrotondano invece di diventare scalini grossi ──
function scale2x(g, w, h) {
  const o = new Uint8Array(w * 2 * h * 2), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : g[y * w + x])
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), Cc = at(x - 1, y), Dd = at(x, y + 1), W2 = w * 2
    const e0 = Cc === A && Cc !== Dd && A !== B ? A : P, e1 = A === B && A !== Cc && B !== Dd ? B : P
    const e2 = Dd === Cc && Dd !== B && Cc !== A ? Cc : P, e3 = B === Dd && B !== A && Dd !== Cc ? Dd : P
    o[y * 2 * W2 + x * 2] = e0; o[y * 2 * W2 + x * 2 + 1] = e1; o[(y * 2 + 1) * W2 + x * 2] = e2; o[(y * 2 + 1) * W2 + x * 2 + 1] = e3
  }
  return o
}
const glifi = new Map()
function glifoVero(ch, scala) {
  const k = ch + '\u0000' + scala
  let r = glifi.get(k)
  if (r) return r
  const g = glifo(ch), b = new Uint8Array(5 * ALTEZZA)
  for (let y = 0; y < ALTEZZA; y++) for (let x = 0; x < 5; x++) b[y * 5 + x] = g[y][x] === '#' ? 1 : 0
  let px = b, w = 5, h = ALTEZZA, fatto = 1
  while (fatto < scala * D && fatto * 2 <= scala * D) { px = scale2x(px, w, h); w *= 2; h *= 2; fatto *= 2 }
  if (fatto < scala * D) { const f = (scala * D) / fatto, o = new Uint8Array(w * f * h * f); for (let y = 0; y < h * f; y++) for (let x = 0; x < w * f; x++) o[y * w * f + x] = px[Math.floor(y / f) * w + Math.floor(x / f)]; px = o; w *= f; h *= f }
  const punti = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[y * w + x]) punti.push(x, y)
  r = Int16Array.from(punti)
  glifi.set(k, r)
  return r
}

export class Lcd {
  constructor() {
    this.fb = new Uint8Array(PW * PH)
    this.canvas = document.createElement('canvas')
    this.canvas.width = PW * K; this.canvas.height = PH * K
    this.ctx = this.canvas.getContext('2d', { alpha: false })
    this.img = this.ctx.createImageData(PW * K, PH * K)
    this.u32 = new Uint32Array(this.img.data.buffer)
    this.luce = 1
    this.massima = 1 // la luminosità delle impostazioni: la luce vera è luce × massima
    this.tema = SFONDI[0]
    this.sporco = true
    this.pronti = null // i colori già scuriti per la luce di adesso (si rifanno quando cambia la luce o lo sfondo)
    this.clip = null // [x0, y0, x1, y1] in pixel veri, esclusi
    this.ascolti = new Set()
  }
  /** Chiama fn ogni volta che la tela cambia (dopo disegna()). */
  ascolta(fn) { this.ascolti.add(fn); return () => this.ascolti.delete(fn) }

  // ── il buffer: x, y, w, h nei pixel d'impaginazione (256 × 128); v è l'indice del colore (0 fondo, 1 inchiostro) ──
  pulisci(v = 0) { this.fb.fill(v); this.sporco = true }
  /** Un pixel vero (512 × 256). */
  pv(X, Y, v = 1) {
    if (X < 0 || Y < 0 || X >= PW || Y >= PH) return
    if (this.clip && (X < this.clip[0] || Y < this.clip[1] || X >= this.clip[2] || Y >= this.clip[3])) return
    this.fb[Y * PW + X] = v
    this.sporco = true
  }
  px(x, y, v = 1) { this.rettangolo((x | 0) * D, (y | 0) * D, D, D, v) }
  /** Un rettangolo in pixel veri, già tagliato dallo schermo e dal ritaglio. */
  rettangolo(X, Y, Wp, Hp, v) {
    let x0 = Math.max(0, X), y0 = Math.max(0, Y), x1 = Math.min(PW, X + Wp), y1 = Math.min(PH, Y + Hp)
    if (this.clip) { x0 = Math.max(x0, this.clip[0]); y0 = Math.max(y0, this.clip[1]); x1 = Math.min(x1, this.clip[2]); y1 = Math.min(y1, this.clip[3]) }
    if (x1 <= x0 || y1 <= y0) return
    for (let y = y0; y < y1; y++) this.fb.fill(v, y * PW + x0, y * PW + x1)
    this.sporco = true
  }
  riempi(x, y, w, h, v = 1) { if (w > 0 && h > 0) this.rettangolo(Math.round(x) * D, Math.round(y) * D, Math.round(w) * D, Math.round(h) * D, v) }
  riquadro(x, y, w, h, v = 1) { this.orizz(x, y, w, v); this.orizz(x, y + h - 1, w, v); this.vert(x, y, h, v); this.vert(x + w - 1, y, h, v) }
  /** Un riquadro con gli angoli smussati (come i dialoghi del Flipper). */
  cornice(x, y, w, h, v = 1) {
    this.orizz(x + 1, y, w - 2, v); this.orizz(x + 1, y + h - 1, w - 2, v); this.vert(x, y + 1, h - 2, v); this.vert(x + w - 1, y + 1, h - 2, v)
  }
  orizz(x, y, w, v = 1) { this.riempi(x, y, w, 1, v) }
  vert(x, y, h, v = 1) { this.riempi(x, y, 1, h, v) }
  /** Scambia fondo e inchiostro (i colori restano). */
  inverti(x, y, w, h) {
    for (let j = 0; j < h * D; j++) for (let i = 0; i < w * D; i++) {
      const X = x * D + i, Y = y * D + j
      if (X < 0 || Y < 0 || X >= PW || Y >= PH) continue
      if (this.clip && (X < this.clip[0] || Y < this.clip[1] || X >= this.clip[2] || Y >= this.clip[3])) continue
      const o = Y * PW + X
      if (this.fb[o] < 2) this.fb[o] ^= 1
    }
    this.sporco = true
  }
  /** Il ritaglio: fuori dal rettangolo non si disegna. ritaglia(null) lo toglie. */
  ritaglia(r) { this.clip = r ? [r[0] * D, r[1] * D, (r[0] + r[2]) * D, (r[1] + r[3]) * D] : null }
  /** C'è qualcosa (non il fondo) nel pixel d'impaginazione x, y? (per il collaudo) */
  pieno(x, y) { for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) if (this.fb[(y * D + j) * PW + x * D + i]) return true; return false }

  // ── il testo ──
  /** Scrive s da (x, y) in alto a sinistra; scala 2 raddoppia; inv scrive col fondo su una fascia; col: un colore. → la larghezza. */
  testo(x, y, s, { scala = 1, inv = false, col = 1 } = {}) {
    let cx = x
    const v = inv ? 0 : col
    for (const ch of String(s)) {
      const p = glifoVero(ch, scala), X = Math.round(cx) * D, Y = Math.round(y) * D
      for (let i = 0; i < p.length; i += 2) this.pv(X + p[i], Y + p[i + 1], v)
      cx += PASSO * scala
    }
    return cx - x - (scala)
  }
  static larghezza(s, scala = 1) { return Math.max(0, [...String(s)].length * PASSO * scala - scala) }
  /** Spezza s in righe di al più n caratteri, sulle parole (le parole più lunghe si tagliano). */
  static acapo(s, n) {
    n = Math.max(1, Math.floor(n)) // (n ≤ 0, da uno spazio stretto: il while qui sotto non finiva più)
    const out = []
    for (const par of String(s).split('\n')) {
      let riga = ''
      for (const parola of par.split(/\s+/).filter(Boolean)) {
        let p = parola
        while (p.length > n) { if (riga) { out.push(riga); riga = '' } out.push(p.slice(0, n)); p = p.slice(n) }
        if (!riga) riga = p
        else if (riga.length + 1 + p.length <= n) riga += ' ' + p
        else { out.push(riga); riga = p }
      }
      out.push(riga)
    }
    return out
  }

  // ── le bitmap: { w, h, bit } a un bit nei pixel d'impaginazione (le vecchie), o { w, h, d, px } a colori nei pixel veri
  // (w × d per h × d indici della tavolozza, 0 trasparente: icone.js, le foto, la miniera). w e h sono sempre in pixel
  // d'impaginazione, per impaginare come prima ──
  /** sbiadita: un pixel sì e uno no, a scacchi (le facce del profilo ancora chiuse). */
  bitmap(b, x, y, { inv = false, sbiadita = false } = {}) {
    if (!b) return
    x = Math.round(x); y = Math.round(y)
    if (b.px) {
      const d = b.d ?? D, pw = b.w * d, ph = b.h * d, f = D / d, X = x * D, Y = y * D
      for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) {
        let c = b.px[j * pw + i]
        if (!c || (sbiadita && (i + j) % 2)) continue
        if (inv && c === 1) c = 0
        if (f === 1) this.pv(X + i, Y + j, c); else this.rettangolo(X + i * f, Y + j * f, f, f, c)
      }
      return
    }
    for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.bit[j * b.w + i] && !(sbiadita && (i + j) % 2)) this.px(x + i, y + j, inv ? 0 : 1)
  }

  // ── la tela ──
  /** Lo sfondo (SFONDI, per id). */
  sfondo(id) { const s = sfondo(id); if (s !== this.tema) { this.tema = s; this.pronti = null; this.sporco = true } }
  /** I colori (già scuriti per la luce) in Uint32 della tela: la tavolozza, il fondo pixel per pixel, e la loro griglia. */
  prepara() {
    const lu = this.luce * this.massima
    if (this.pronti?.lu === lu && this.pronti.tema === this.tema) return this.pronti
    const scuro = (c, k = 1) => { const f = (0.3 + 0.7 * lu) * k; return [c[0] * f, c[1] * f * 0.94, c[2] * f * 0.85].map((v) => Math.max(0, Math.min(255, Math.round(v)))) } // (spenta, un lcd bruno)
    const u = (c) => (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]
    const tav = new Uint32Array(256), griglia = new Uint32Array(256)
    for (let i = 2; i < 256; i++) if (TAV[i]) { tav[i] = u(scuro(TAV[i])); griglia[i] = u(scuro(TAV[i], 0.93)) }
    const ink = q(this.tema.inchiostro)
    tav[1] = u(scuro(ink)); griglia[1] = u(scuro(ink, 0.93))
    // il fondo pixel per pixel, come indici della tavolozza: si calcola una volta per sfondo (la luce cambia solo tav)
    if (this.fondoDi !== this.tema) {
      const f = this.tema.fondo
      this.fondo = new Uint8Array(PW * PH)
      if (typeof f === 'function') { for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const c = f(x, y); this.fondo[y * PW + x] = colore(c[0], c[1], c[2]) } }
      else this.fondo.fill(colore(f[0], f[1], f[2]))
      this.fondoDi = this.tema
    }
    this.pronti = { lu, tema: this.tema, tav, griglia, fondo: this.fondo }
    return this.pronti
  }
  /** Ridisegna la tela se qualcosa è cambiato (il buffer o la luce). → true se l'ha ridisegnata */
  disegna() {
    if (!this.sporco) return false
    this.sporco = false
    const { tav, griglia, fondo } = this.prepara()
    const d = this.u32, LW = PW * K, fb = this.fb
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const o = y * PW + x, i = fb[o] || fondo[o]
      const c = tav[i], g = griglia[i]
      let p = y * K * LW + x * K
      d[p] = c; d[p + 1] = c; d[p + 2] = g; p += LW
      d[p] = c; d[p + 1] = c; d[p + 2] = g; p += LW
      d[p] = g; d[p + 1] = g; d[p + 2] = g
    }
    this.ctx.putImageData(this.img, 0, 0)
    for (const f of this.ascolti) f()
    return true
  }
  /** La retroilluminazione (0–1). */
  accendi(v) { v = Math.max(0, Math.min(1, v)); if (v !== this.luce) { this.luce = v; this.sporco = true } }
  /** La luminosità massima (le impostazioni, 0.3–1). */
  regola(v) { v = Math.max(0.2, Math.min(1, v)); if (v !== this.massima) { this.massima = v; this.sporco = true } }
}
