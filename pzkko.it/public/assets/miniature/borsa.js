// miniature/borsa.js — Borsa $pzk (27.11.2026): la banca del cercapersone aperta sulla borsa, dal vivo.
// L'lcd è quello di pzk os (telefono/zero/os): 256 × 128, il carattere 5 × 7 di font.js, la tavolozza a 8 bit con la
// tinta della retroilluminazione arancione, la pagina «la borsa» di banca.js rifatta pixel per pixel (la barra di
// stato, la testata col ◀ ▶, il periodo rovesciato, il cambio a scala 2, il cartellino, l'apertura tratteggiata, l'area
// rossa o verde staccata dalla linea, la linea che cresce, il cursore). La linea è quella vera: letta colonna per
// colonna dalla cattura del 19.11 (24 ore, min 1.1082, max 1.2179); poi arrivano i punti nuovi e il cambio schizza.
// Intorno: il nastro di led coi numeri veri, la stampa della cattura col nastro, il cercapersone vero (art/zero) che
// fa vedere la stessa borsa, e le monete $pzk quando sale. Col mouse sopra: il cursore, come OK sull'app.
// (Le parti dell'lcd sono esportate: le usa anche conversioni.js.)
import { glifo } from '../../telefono/zero/os/font.js'

// ── l'lcd di pzk os, in piccolo ──
export const LW = 256, LH = 128
const u32 = (r, g, b) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
/** un colore della tavolozza col filtro della retroilluminazione accesa (lcd.js: g × .94, b × .85) */
export const col = (r, g, b) => u32(r, Math.round(g * 0.94), Math.round(b * 0.85))
export const LC = {
  fondo: col(255, 153, 51), ink: col(18, 18, 18), nero: col(0, 0, 0), bianco: col(255, 255, 255),
  su: col(51, 255, 102), giu: col(255, 51, 51), areaSu: col(51, 153, 51), areaGiu: col(204, 51, 51),
  blu: col(0, 102, 204), rosso: col(204, 0, 0), giallo: col(255, 204, 0),
}

// il glifo 5 × 7 (a scala 2 passato per Scale2x, come lcd.js: le diagonali si ammorbidiscono)
function scale2x(g, w, h) {
  const o = new Uint8Array(w * 2 * h * 2), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : g[y * w + x]), W2 = w * 2
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1)
    o[y * 2 * W2 + x * 2] = C === A && C !== D && A !== B ? A : P
    o[y * 2 * W2 + x * 2 + 1] = A === B && A !== C && B !== D ? B : P
    o[(y * 2 + 1) * W2 + x * 2] = D === C && D !== B && C !== A ? C : P
    o[(y * 2 + 1) * W2 + x * 2 + 1] = B === D && B !== A && D !== C ? D : P
  }
  return o
}
const glifi = new Map()
function punti(ch, scala) {
  const k = ch + scala
  let r = glifi.get(k)
  if (r) return r
  const g = glifo(ch)
  let px = new Uint8Array(35), w = 5, h = 7
  for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) px[y * 5 + x] = g[y][x] === '#' ? 1 : 0
  if (scala >= 2) { px = scale2x(px, w, h); w *= 2; h *= 2 }
  const f = scala >= 2 ? scala / 2 : 1, out = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[y * w + x]) for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) out.push(x * f + i, y * f + j)
  r = Int16Array.from(out)
  glifi.set(k, r)
  return r
}

export class Lcd8 {
  constructor(fondo = LC.fondo) {
    this.c = document.createElement('canvas')
    this.c.width = LW; this.c.height = LH
    this.g = this.c.getContext('2d')
    this.img = this.g.createImageData(LW, LH)
    this.b = new Uint32Array(this.img.data.buffer)
    this.fondo = fondo
  }
  pulisci(v = this.fondo) { this.b.fill(v) }
  px(x, y, v = LC.ink) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < LW && y < LH) this.b[y * LW + x] = v }
  riempi(x, y, w, h, v = LC.ink) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
    const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(LW, x + w), y1 = Math.min(LH, y + h)
    for (let yy = y0; yy < y1; yy++) this.b.fill(v, yy * LW + x0, yy * LW + x1)
  }
  orizz(x, y, w, v) { this.riempi(x, y, w, 1, v) }
  vert(x, y, h, v) { this.riempi(x, y, 1, h, v) }
  riquadro(x, y, w, h, v) { this.orizz(x, y, w, v); this.orizz(x, y + h - 1, w, v); this.vert(x, y, h, v); this.vert(x + w - 1, y, h, v) }
  static larghezza(s, scala = 1) { return Math.max(0, [...String(s)].length * 6 * scala - scala) }
  testo(x, y, s, { scala = 1, col: v = LC.ink } = {}) {
    let cx = Math.round(x)
    y = Math.round(y)
    for (const ch of String(s)) {
      const p = punti(ch, scala)
      for (let i = 0; i < p.length; i += 2) this.px(cx + p[i], y + p[i + 1], v)
      cx += 6 * scala
    }
    return cx - x - scala
  }
  destra(xd, y, s, o) { this.testo(xd - Lcd8.larghezza(s, o?.scala), y, s, o) }
  centro(y, s, o) { this.testo(Math.round(LW / 2 - Lcd8.larghezza(s, o?.scala) / 2), y, s, o) }
  linea(x0, y0, x1, y1, v = LC.ink) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let e = dx + dy
    for (let n = 0; n < 600; n++) {
      this.px(x0, y0, v)
      if (x0 === x1 && y0 === y1) return
      const e2 = 2 * e
      if (e2 >= dy) { e += dy; x0 += sx }
      if (e2 <= dx) { e += dx; y0 += sy }
    }
  }
  /** un'icona fatta con `icona()` */
  bitmap(b, x, y) { if (b) for (let i = 0; i < b.length; i += 3) this.px(x + b[i], y + b[i + 1], b[i + 2]) }
  mostra() { this.g.putImageData(this.img, 0, 0) }
}

/** un'icona di os/icone.js (tracciato 16 × 16) col suo colore e il bordino d'inchiostro, come daSvg → [x, y, colore…] */
export function icona(d, colore) {
  const c = document.createElement('canvas')
  c.width = c.height = 16
  const g = c.getContext('2d', { willReadFrequently: true })
  g.fillStyle = colore
  g.fill(new Path2D(d), 'evenodd')
  const a = g.getImageData(0, 0, 16, 16).data, v = col(...[1, 3, 5].map((i) => parseInt(colore.slice(i, i + 2), 16)))
  const pieno = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && a[(y * 16 + x) * 4 + 3] > 127
  const out = []
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (pieno(x, y)) out.push(x, y, v)
    else if (pieno(x - 1, y) || pieno(x + 1, y) || pieno(x, y - 1) || pieno(x, y + 1)) out.push(x, y, LC.ink)
  }
  return out
}

/** la barra di stato di os.js (come il Flipper): l'ora, le tre tacche, il nome, la batteria */
export function barra(l, ora, nome = 'sessione') {
  l.riempi(0, 0, LW, 12, l.fondo)
  l.orizz(1, 11, LW - 2)
  l.testo(8, 2, ora)
  for (let i = 0; i < 3; i++) { const h = 2 + i * 2; l.riempi(46 + i * 3, 9 - h, 2, h) }
  l.centro(2, nome)
  const bx = LW - 23
  l.testo(bx - 4 - Lcd8.larghezza('100%'), 2, '100%')
  l.riquadro(bx, 2, 15, 7); l.vert(bx + 15, 4, 3); l.riempi(bx + 2, 4, 11, 3)
}
/** la testata di pezzi.js: ◀, l'icona, il nome, i pallini delle pagine, ▶, la riga */
export function testata(l, ic, nome, n = 1, pag = 0) {
  if (n <= 1) { l.bitmap(ic, 8, 14); l.testo(28, 18, nome); l.orizz(6, 31, LW - 12); return }
  l.testo(7, 18, '◀'); l.bitmap(ic, 16, 14); l.testo(36, 18, nome)
  const xp = LW - 17 - n * 6
  for (let i = 0; i < n; i++) { const x = xp + i * 6; if (i === pag) l.riempi(x, 19, 4, 4); else l.riquadro(x, 19, 4, 4) }
  l.testo(LW - 12, 18, '▶'); l.orizz(6, 31, LW - 12)
}

/** l'lcd ingrandito 3 volte coi pixel netti e la griglia fra i pixel (lcd.js: tre texel per pixel, il terzo più scuro) */
export class Vetro {
  constructor(lcd, K = 3) {
    this.lcd = lcd; this.K = K
    this.c = document.createElement('canvas')
    this.c.width = LW * K; this.c.height = LH * K
    this.g = this.c.getContext('2d')
    this.g.imageSmoothingEnabled = false
    const gr = document.createElement('canvas')
    gr.width = LW * K; gr.height = LH * K
    const x = gr.getContext('2d')
    x.fillStyle = K > 2 ? 'rgba(0,0,0,.075)' : 'rgba(0,0,0,.05)'
    for (let i = 0; i < LW; i++) x.fillRect(i * K + K - 1, 0, 1, LH * K)
    for (let j = 0; j < LH; j++) x.fillRect(0, j * K + K - 1, LW * K, 1)
    // l'ombra in basso sotto il vetro, una volta sola
    const v = x.createLinearGradient(0, LH * K * 0.25, 0, LH * K)
    v.addColorStop(0, 'rgba(60,20,0,0)'); v.addColorStop(1, 'rgba(60,20,0,.2)')
    x.fillStyle = v; x.fillRect(0, 0, LW * K, LH * K)
    this.griglia = gr
  }
  aggiorna() { this.lcd.mostra(); this.g.drawImage(this.lcd.c, 0, 0, LW * this.K, LH * this.K); this.g.drawImage(this.griglia, 0, 0) }
}

// ── un quadrilatero: l'immagine stesa su quattro angoli (TL, TR, BR, BL) a strisce, per la prospettiva leggera ──
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
/** il punto (u, v) del quadrilatero Q = [TL, TR, BR, BL] */
export const nelQuad = (Q, u, v) => mix(mix(Q[0], Q[1], u), mix(Q[3], Q[2], u), v)
export function quad(g, src, Q, dpr, n = 12) {
  const sw = src.width, sh = src.height
  g.save()
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, T0 = mix(Q[0], Q[1], u0), T1 = mix(Q[0], Q[1], u1), B0 = mix(Q[3], Q[2], u0)
    const sx0 = u0 * sw, sx1 = u1 * sw, dw = sx1 - sx0, ov = i < n - 1 ? Math.min(1, sw - sx1) : 0
    const a = (T1[0] - T0[0]) / dw, b = (T1[1] - T0[1]) / dw, c = (B0[0] - T0[0]) / sh, d = (B0[1] - T0[1]) / sh
    g.setTransform(a * dpr, b * dpr, c * dpr, d * dpr, (T0[0] - a * sx0) * dpr, (T0[1] - b * sx0) * dpr)
    g.drawImage(src, sx0, 0, dw + ov, sh, sx0, 0, dw + ov, sh)
  }
  g.restore()
}
/** un rettangolo stondato dello spazio (u, v) 0–1 portato sul quadrilatero, come tracciato */
export function tracciaQuad(g, Q, u0, v0, u1, v1, ru, rv) {
  const P = []
  const arco = (cu, cv, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + (k / 4) * (Math.PI / 2); P.push(nelQuad(Q, cu + Math.cos(a) * ru, cv + Math.sin(a) * rv)) } }
  arco(u1 - ru, v0 + rv, -Math.PI / 2); arco(u1 - ru, v1 - rv, 0); arco(u0 + ru, v1 - rv, Math.PI / 2); arco(u0 + ru, v0 + rv, Math.PI)
  g.beginPath()
  P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
}
/** il pannello dello schermo (telefono/schermo.js): la cornice nera stondata, l'ombra, l'lcd dentro, il riflesso */
export function pannello(g, Q, vetro, dpr, { luce = 1, riflesso = 0.5, lampo = 0, bu = 0.016, bv = 0.03 } = {}) {
  // l'ombra morbida: tre passate spostate
  for (const [dx, dy, a] of [[4, 7, 0.26], [10, 18, 0.12]]) {
    g.save(); g.translate(dx, dy); g.fillStyle = `rgba(0,0,0,${a})`; tracciaQuad(g, Q, 0, 0, 1, 1, 0.035, 0.07); g.fill(); g.restore()
  }
  g.fillStyle = '#0d0d0f'
  tracciaQuad(g, Q, 0, 0, 1, 1, 0.035, 0.07); g.fill()
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1; g.stroke()
  const L = [nelQuad(Q, bu, bv), nelQuad(Q, 1 - bu, bv), nelQuad(Q, 1 - bu, 1 - bv), nelQuad(Q, bu, 1 - bv)]
  quad(g, vetro.c, L, dpr)
  g.save()
  const bx0 = Math.min(...L.map((p) => p[0])), by0 = Math.min(...L.map((p) => p[1])), bx1 = Math.max(...L.map((p) => p[0])), by1 = Math.max(...L.map((p) => p[1]))
  tracciaQuad(g, L, 0, 0, 1, 1, 0.012, 0.024); g.clip()
  if (luce < 1) { g.fillStyle = `rgba(20,8,0,${(1 - luce) * 0.75})`; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0) }
  // il riflesso del vetro: una banda chiara in diagonale
  const a = nelQuad(L, riflesso - 0.3, 0), b = nelQuad(L, riflesso + 0.1, 1)
  const gr = g.createLinearGradient(a[0], a[1], b[0], b[1])
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, `rgba(255,255,255,${0.1 + lampo * 0.35})`); gr.addColorStop(0.55, `rgba(255,255,255,${0.03 + lampo * 0.2})`); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(bx0, by0, bx1 - bx0, by1 - by0)
  g.restore()
  return L
}
/** i quattro angoli di un pannello largo pw, alto ph, al centro (cx, cy), girato di `gira` (verso destra) e `rot` */
export function angoli(cx, cy, pw, ph, gira = 0, rot = 0, pend = 0) {
  const sx = 1 - Math.abs(gira) * 0.12, hl = ph / 2 * (1 + gira * 0.22), hr = ph / 2 * (1 - gira * 0.22)
  const ht = pw / 2 * (1 + pend * 0.1), hb = pw / 2 * (1 - pend * 0.1)
  const P = [[-ht * sx, -hl], [ht * sx, -hr], [hb * sx, hr], [-hb * sx, hl]]
  const c = Math.cos(rot), s = Math.sin(rot)
  return P.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c])
}
/** il cercapersone vero (art/zero/zero-piccolo.webp, 1344 × 776): gli angoli del suo vetro nell'immagine */
export const ZERO_VETRO = [[361, 231], [744, 269], [742.5, 506], [369, 458.5]]

// ── la borsa vera: la linea della cattura del 19.11 (24 ore), una y dell'lcd per colonna, da x 10 a 245 ──
const REALE = [61, 62, 61, 61, 58, 58, 60, 60, 56, 58, 61, 69, 74, 74, 75, 77, 78, 78, 77, 78, 79, 78, 76, 76, 73, 70, 69, 67, 70, 71, 72, 74, 75, 73, 73, 74, 73, 73, 73, 75, 78, 78, 78, 77, 74, 73, 75, 74, 73, 73, 74, 74, 73, 72, 71, 70, 66, 69, 69, 73, 75, 76, 79, 81, 82, 82, 85, 87, 87, 88, 88, 88, 85, 84, 84, 84, 85, 88, 91, 91, 90, 88, 90, 91, 98, 100, 100, 98, 92, 90, 93, 95, 94, 93, 93, 92, 89, 89, 83, 78, 78, 80, 80, 79, 77, 78, 79, 76, 77, 77, 78, 81, 83, 83, 84, 83, 82, 81, 79, 79, 80, 80, 81, 82, 82, 82, 80, 80, 81, 85, 86, 86, 85, 80, 80, 81, 83, 87, 89, 90, 91, 92, 91, 90, 89, 88, 90, 91, 90, 91, 91, 91, 90, 88, 88, 90, 93, 94, 94, 96, 95, 84, 84, 85, 82, 83, 83, 85, 85, 85, 83, 77, 73, 74, 76, 81, 89, 92, 90, 87, 88, 93, 97, 99, 101, 103, 101, 97, 94, 97, 97, 96, 93, 95, 98, 101, 98, 96, 95, 96, 96, 97, 98, 101, 103, 104, 103, 100, 99, 99, 100, 100, 101, 99, 97, 97, 96, 94, 92, 89, 88, 90, 92, 92, 90, 90, 89, 87, 90, 91, 94, 95, 95, 92, 94, 94]
const N = REALE.length // 236: un punto per colonna
const LO0 = 1.1082, HI0 = 1.2179
const DOPO = 72 // i punti nuovi che arrivano mentre si guarda: l'ultimo tratto è il colpo
const SERIE = (() => {
  const v = REALE.map((y, i) => LO0 + ((104 - y) / 49) * (HI0 - LO0) + (Math.sin(i * 2.7) * 0.5 + Math.sin(i * 1.3) * 0.5) * 0.0009)
  let x = v[N - 1], s = 77, base = x
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < DOPO; i++) {
    if (i < 48) { x += (r() - 0.5) * 0.0062 + 0.0003; base = x }
    else { const k = (i - 48) / (DOPO - 49); x = base + 0.142 * (1 - (1 - Math.min(1, k * 1.5)) ** 3) - 0.014 * Math.max(0, k - 0.7) + (r() - 0.5) * 0.004 }
    v.push(x)
  }
  return v
})()
const tasso = (v) => (v >= 10 ? v.toFixed(3) : v.toFixed(4))
const variazione = (v) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v * 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
const ora = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
const INIZIO = 19 * 60 + 10, PASSO_MIN = 1440 / N // la cattura: «da 19:10», 24 ore in 236 colonne

/** Il fotogramma: la scena dipende solo da t, quindi nelle foto ferme (il motore arriva al tempo voluto a passi di 1/60 s)
 *  si disegna una volta sola, l'ultimo tempo, appena il motore ha finito i passi. */
export function fotogramma(m, disegna) {
  let ultimo = 0, attesa = false
  return (t) => {
    if (!m.fermo) return disegna(t)
    ultimo = t
    if (attesa) return
    attesa = true
    queueMicrotask(() => { attesa = false; m.g.setTransform(m.dpr, 0, 0, m.dpr, 0, 0); disegna(ultimo) })
  }
}

const COIN = 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1z M7 4h2v1h2v1H9v1h2v1H9v2H7V9H5V8h2V7H5V6h2z' // os/icone.js «pzk»
const CICLO = 13

/** la pagina «la borsa» di banca.js. S: { s (punti nuovi arrivati), cresce, cursore, carica, lampeggia, t } */
function paginaBorsa(l, ic, S) {
  l.pulisci()
  const start = INIZIO + S.s * PASSO_MIN
  barra(l, ora(start + 1440 - 3))
  testata(l, ic, 'la borsa', 3, 1)
  const nome = '24 ore', pw = Lcd8.larghezza(nome) + 6
  l.riempi(245 - pw, 34, pw, 9); l.destra(242, 35, nome, { col: l.fondo })
  if (S.carica != null) { l.centro(70, `mi collego alla borsa${'...'.slice(0, (Math.floor(S.carica * 6) % 3) + 1)}`); l.centro(LH - 9, '↑↓ periodo • ←→ pagine'); return null }
  const P = SERIE.slice(S.s, S.s + N)
  const k = S.cursore == null ? N - 1 : S.cursore, vk = P[k]
  const grande = tasso(vk), xe = Math.max(88, 10 + Lcd8.larghezza(grande, 2) + 6)
  l.testo(10, 34, grande, { scala: 2 })
  l.testo(xe, 34, '€ per'); l.testo(xe, 42, '$pzk')
  if (S.cursore != null) l.destra(245, 45, ora(start + k * PASSO_MIN))
  else {
    const v = vk / P[0] - 1, s = variazione(v), w = Lcd8.larghezza(s)
    l.riempi(245 - w - 2, 44, w + 4, 9, v >= 0 ? LC.su : LC.giu); l.testo(245 - w, 45, s, { col: LC.nero })
  }
  const X0 = 10, X1 = 245, Y0 = 55, Y1 = 104
  let lo = Infinity, hi = -Infinity
  for (const v of P) { if (v < lo) lo = v; if (v > hi) hi = v }
  const px = (i) => Math.round(X0 + ((X1 - X0) * i) / (N - 1)), py = (v) => Math.round(Y1 - ((Y1 - Y0) * (v - lo)) / (hi - lo))
  const fino = Math.max(1, Math.round((N - 1) * S.cresce)), ya = py(P[0])
  for (let xx = X0; xx <= X1; xx += 4) l.orizz(xx, ya, 2)
  let xp = px(0), yp = py(P[0])
  for (let i = 1; i <= fino; i++) {
    const xn = px(i), yn = py(P[i])
    for (let xx = xp; xx <= xn; xx++) {
      const yy = xn === xp ? yn : Math.round(yp + ((yn - yp) * (xx - xp)) / (xn - xp))
      if (yy + 2 < ya) l.vert(xx, yy + 2, ya - yy - 2, LC.areaSu)
      else if (yy - 2 > ya) l.vert(xx, ya + 1, yy - ya - 2, LC.areaGiu)
    }
    l.linea(xp, yp, xn, yn)
    xp = xn; yp = yn
  }
  l.orizz(X0, Y1 + 1, X1 - X0 + 1)
  const fx = px(fino), fy = py(P[fino])
  if (S.cresce >= 1) {
    const cx = px(k), cy = py(vk)
    if (S.cursore != null) { for (let y = Y0 - 1; y <= Y1; y += 2) l.px(cx, y); l.riempi(cx - 2, cy - 2, 5, 5, l.fondo); l.riquadro(cx - 2, cy - 2, 5, 5) }
    else if (S.lampeggia) l.riempi(cx - 1, cy - 1, 3, 3)
  }
  l.testo(10, 108, `min ${tasso(lo)}`)
  l.destra(245, 108, `max ${tasso(hi)}`)
  l.centro(108, S.cursore != null ? `${k + 1}/${N}` : `da ${ora(start)}`)
  l.centro(LH - 9, S.cursore != null ? '←→ muove • OK o INDIETRO esce' : 'OK cursore • ↑↓ periodo • ←→ pagine')
  return { x: fx, y: fy, su: vk >= P[0] }
}

export default async function crea(m) {
  const { kit } = m
  const [moneta, zero, cattura] = await Promise.all([
    kit.imgForse('/art/chat-stati/pzk.webp'),
    kit.imgForse('/art/zero/zero-piccolo.webp'),
    m.cattura ? kit.imgForse(m.cattura) : null,
    kit.font('Permanent Marker'),
  ])
  const lcd = new Lcd8(), vetro = new Vetro(lcd, 2)
  const ic = icona(COIN, '#ffcc00')
  let W = 0, H = 0, sopra = null, zeroC = null, fondo = null, fantasma = null, nastroLed = null, stampa = null, moneta1 = null, ledW = 0, ledH = 0

  // ── gli strati fissi ──
  function rifai(w, h) {
    W = w; H = h
    const dpr = m.dpr
    fondo = kit.strato(w, h, dpr, (g) => {
      const l = g.createLinearGradient(0, 0, w * 0.4, h)
      l.addColorStop(0, '#0f3520'); l.addColorStop(0.55, '#0a1f14'); l.addColorStop(1, '#06120c')
      g.fillStyle = l; g.fillRect(0, 0, w, h)
      // la parete della sala: la griglia del grafico, fine
      g.strokeStyle = 'rgba(35,165,90,.10)'; g.lineWidth = 1
      const p = w / 24
      for (let x = p / 2; x < w; x += p) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke() }
      for (let y = h * 0.12; y < h; y += p) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() }
      const r = g.createRadialGradient(w * 0.62, h * 0.72, 0, w * 0.62, h * 0.72, w * 0.55)
      r.addColorStop(0, 'rgba(255,150,40,.20)'); r.addColorStop(1, 'rgba(255,150,40,0)')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      kit.granella(g, w, h, 0.06, 0)
    })
    sopra = kit.strato(w, h, dpr, (g) => kit.vignetta(g, w, h, 0.42))
    // il cercapersone vero, già girato e rimpicciolito (ridisegnare la foto grande a ogni fotogramma costa)
    if (zero) {
      const zs = (w * 0.42) / 1344, zr = -0.12, c = Math.cos(zr), sn = Math.sin(zr)
      const R = ([x, y]) => [(x * c - y * sn) * zs, (x * sn + y * c) * zs]
      const B = [[0, 0], [1344, 0], [1344, 776], [0, 776]].map(R), x0 = Math.min(...B.map((p) => p[0])), y0 = Math.min(...B.map((p) => p[1]))
      const bw = Math.max(...B.map((p) => p[0])) - x0, bh = Math.max(...B.map((p) => p[1])) - y0
      zeroC = { x0, y0, w: bw, h: bh, vetro: ZERO_VETRO.map(R), c: kit.strato(bw, bh, dpr, (g) => { g.translate(-x0, -y0); g.rotate(zr); g.imageSmoothingQuality = 'high'; g.drawImage(zero, 0, 0, 1344 * zs, 776 * zs) }) }
    }
    // il grafico fantasma sul muro: la serie vera, larga, sfocata (due volte di fila, così scorre senza cucitura)
    fantasma = kit.strato(w * 2, h, dpr, (g) => {
      g.lineJoin = 'round'
      for (let rip = 0; rip < 2; rip++) {
        g.beginPath()
        SERIE.forEach((v, i) => { const x = rip * w + (i / (SERIE.length - 1)) * w, y = h * (0.86 - (v - 1.08) * 3.4); i ? g.lineTo(x, y) : g.moveTo(x, y) })
        g.shadowColor = 'rgba(70,255,125,.8)'; g.shadowBlur = w * 0.02
        g.strokeStyle = 'rgba(70,255,125,.35)'; g.lineWidth = Math.max(1.5, w * 0.006); g.stroke()
      }
    })
    // il nastro di led in alto: i numeri veri della cattura, a puntini
    const testoLed = ' $PZK/EUR€ 1.1332  ▼ 6,00 %  •  24 ORE  •  MIN 1.1082  •  MAX 1.2179  •  1 $PZK = 1.1332 €  • '
    ledH = Math.round(h * 0.078)
    const pd = ledH / 9
    ledW = [...testoLed].length * 6 * pd
    nastroLed = kit.strato(ledW, ledH, dpr, (g) => {
      g.fillStyle = '#04100a'; g.fillRect(0, 0, ledW, ledH)
      let cx = 0, rosso = false
      for (const ch of testoLed) {
        if (ch === '▼') rosso = true
        if (ch === '•') rosso = false
        const gl = glifo(ch)
        for (let y = 0; y < 7; y++) for (let x = 0; x < 6; x++) {
          const on = x < 5 && gl[y][x] === '#'
          g.fillStyle = on ? (rosso ? '#ff4a3a' : '#46ff7d') : 'rgba(70,255,125,.07)'
          if (on) { g.shadowColor = rosso ? 'rgba(255,60,40,.9)' : 'rgba(70,255,125,.9)'; g.shadowBlur = pd * 1.2 } else g.shadowBlur = 0
          g.beginPath(); g.arc(cx + x * pd + pd / 2, pd + y * pd + pd / 2, pd * 0.36, 0, Math.PI * 2); g.fill()
        }
        cx += 6 * pd
      }
    })
    // la stampa della cattura vera, col nastro e il pennarello
    const sw = w * 0.25, sh = sw * (412 / 804) + w * 0.052
    stampa = { w: sw + 24, h: sh + 24 }
    stampa.c = kit.strato(stampa.w, stampa.h, dpr, (g) => {
      g.translate(12, 12)
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 3
      g.fillStyle = '#f4efe1'; g.fillRect(0, 0, sw, sh)
      g.shadowColor = 'transparent'
      const fw = sw - w * 0.016, fh = fw * (412 / 804), fx = w * 0.008, fy = w * 0.008
      if (cattura) g.drawImage(cattura, 238, 124, 804, 412, fx, fy, fw, fh)
      else { g.fillStyle = '#ff902a'; g.fillRect(fx, fy, fw, fh) }
      g.fillStyle = 'rgba(255,240,200,.10)'; g.fillRect(fx, fy, fw, fh)
      // il pennarello: il cerchio sul −6 % e la data della cattura
      g.strokeStyle = 'rgba(208,32,28,.9)'; g.lineWidth = Math.max(1.2, w * 0.004); g.lineCap = 'round'
      g.beginPath(); g.ellipse(fx + fw * 0.88, fy + fh * 0.36, fw * 0.12, fh * 0.1, -0.1, 0.3, Math.PI * 2.15); g.stroke()
      g.fillStyle = '#c0201c'
      g.font = `400 ${Math.max(7, w * 0.024)}px "Permanent Marker"`
      g.textBaseline = 'middle'
      g.fillText('la borsa vera · 19.11', fx + 2, fy + fh + (sh - fh - fy) / 2)
    })
    // la moneta $pzk con la sua ombra
    const ms = w * 0.075
    moneta1 = { s: ms, c: moneta ? kit.strato(ms * 1.3, ms * 1.3, dpr, (g) => { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = ms * 0.12; g.shadowOffsetY = ms * 0.06; g.drawImage(moneta, ms * 0.15, ms * 0.12, ms, ms) }) : null }
  }

  // le monete che saltano fuori quando la borsa schizza (deterministiche: stesso t, stesso volo)
  const MONETE = Array.from({ length: 22 }, (_, i) => {
    const r = kit.rng(31 + i * 7)
    return { vx: -1.15 + (i / 21) * 1.45 + (r() - 0.5) * 0.25, vy: -(1.0 + r() * 1.0), giri: 2 + r() * 5, f: r() * 6, k: 0.7 + r() * 0.5, ritardo: r() * 0.35 }
  })

  let lastLcd = '', ultimaPunta = null
  const api = {
    titolo: true,
    fermo: 5,
    ridimensiona(w, h) { rifai(w, h) },
    frame: fotogramma(m, disegna),
  }
  return api
  function disegna(t) {
    {
      const { g, w, h, dpr } = m, su = m.su
      if (w !== W || h !== H || !fondo) rifai(w, h)
      const ph = t % CICLO
      const curs = su > 0.5

      // ── lo stato dell'app per questo momento del giro ──
      let carica = null, cresce = 1, s = 0
      if (ph < 0.6 && !curs) carica = ph / 0.6
      else if (ph < 3.4 && !curs) cresce = kit.ease.inOut(kit.clamp((ph - 0.6) / 2.8))
      if (ph > 6) s = Math.round(DOPO * kit.ease.inOut(kit.clamp((ph - 6) / 3.4)))
      const colpo = ph - 9.4 // il cambio è schizzato: le monete, il lampo
      let cursore = null
      if (curs) {
        const passi = 38, q = Math.floor(t * 7) % (passi * 2), i = q < passi ? q : passi * 2 - q
        cursore = kit.clamp(Math.round(4 + (i / passi) * (N - 9)), 0, N - 1)
      }
      const chiave = `${carica == null ? -1 : Math.floor(carica * 6)}|${cresce.toFixed(3)}|${s}|${cursore}|${Math.floor(t * 2) % 2}`
      let punta = null
      if (chiave !== lastLcd) {
        lastLcd = chiave
        punta = paginaBorsa(lcd, ic, { s, cresce, cursore, carica, lampeggia: Math.floor(t * 2) % 2 === 0 })
        vetro.aggiorna()
        ultimaPunta = punta
      } else punta = ultimaPunta

      // ── lo sfondo ──
      kit.metti(g, fondo, 0, 0, w, h)
      const dx = -((t * w * 0.02) % w)
      g.globalAlpha = 0.45 + su * 0.35 + (colpo > 0 && colpo < 1.5 ? (1.5 - colpo) * 0.3 : 0)
      g.drawImage(fantasma, dx, 0, w * 2, h)
      g.globalAlpha = 1
      // il nastro di led
      const ly = Math.round(h * 0.012), vel = w * (0.07 + su * 0.12)
      const lx = -((t * vel) % ledW)
      g.fillStyle = '#020805'; g.fillRect(0, ly - 1, w, ledH + 2)
      for (let x = lx; x < w; x += ledW) {
        const a = Math.max(0, -x), b = Math.min(ledW, w - x) // solo il pezzo che si vede
        if (b > a) g.drawImage(nastroLed, a * dpr, 0, (b - a) * dpr, ledH * dpr, x + a, ly, b - a, ledH)
      }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, ly + ledH + 1, w, 2)

      // ── la stampa della cattura, attaccata in alto a destra ──
      const scx = w * 0.845, scy = h * 0.265 - su * h * 0.02, srot = 0.07 + Math.sin(t * 0.7) * 0.008 + su * 0.03
      g.save(); g.translate(scx, scy); g.rotate(srot)
      g.drawImage(stampa.c, -stampa.w / 2, -stampa.h / 2, stampa.w, stampa.h)
      kit.nastro(g, 0, -stampa.h / 2 + 12, w * 0.09, w * 0.024, -0.05)
      g.restore()

      // ── il cercapersone vero, in basso a sinistra, con la stessa borsa sul suo vetro ──
      if (zeroC) {
        const zx = -w * 0.06 + Math.sin(t * 0.5) * w * 0.004, zy = h * 0.6 + Math.cos(t * 0.6) * h * 0.006
        g.drawImage(zeroC.c, zx + zeroC.x0, zy + zeroC.y0, zeroC.w, zeroC.h)
        const Qz = zeroC.vetro.map(([x, y]) => [zx + x, zy + y])
        g.fillStyle = '#ff902a'
        g.beginPath(); Qz.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill()
        const Lz = [nelQuad(Qz, 0.03, 0.08), nelQuad(Qz, 0.97, 0.08), nelQuad(Qz, 0.97, 0.92), nelQuad(Qz, 0.03, 0.92)]
        quad(g, vetro.c, Lz, dpr, 6)
        const gl = g.createLinearGradient(Qz[0][0], Qz[0][1], Qz[2][0], Qz[2][1])
        gl.addColorStop(0, 'rgba(255,255,255,.18)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)')
        g.fillStyle = gl; g.beginPath(); Qz.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill()
      }

      // ── il pannello dello schermo con la borsa ──
      const salto = colpo > 0 && colpo < 1.2 ? Math.sin(colpo * 14) * Math.exp(-colpo * 4) : 0
      const pw = w * (0.575 + su * 0.05) * (1 + salto * 0.015), ph2 = pw * (412 / 804) * (h / w < 0.6 ? 1 : 1.04)
      const pcx = w * 0.64 - su * w * 0.025, pcy = h * 0.68 - su * h * 0.025 + Math.sin(t * 0.8) * h * 0.006 - salto * h * 0.01
      const gira = (0.2 + Math.sin(t * 0.35) * 0.05) * (1 - su * 0.85), rot = -0.035 * (1 - su * 0.6) + Math.sin(t * 0.5) * 0.004
      const Q = angoli(pcx, pcy, pw, ph2, gira, rot, 0.12 * (1 - su))
      // la luce dello schermo sul muro
      const lum = g.createRadialGradient(pcx, pcy, 0, pcx, pcy, pw * 0.75)
      const fl = colpo > 0 && colpo < 2 ? (2 - colpo) / 2 : 0
      lum.addColorStop(0, `rgba(${fl > 0 ? '90,255,140' : '255,150,40'},${0.16 + fl * 0.25 + su * 0.06})`); lum.addColorStop(1, 'rgba(255,150,40,0)')
      g.fillStyle = lum; g.fillRect(pcx - pw * 0.8, pcy - pw * 0.8, pw * 1.6, pw * 1.6)
      const spegne = ph > 12.4 ? kit.smooth(12.4, 12.9, ph) : ph < 0.25 ? 1 - ph / 0.25 : 0
      const L = pannello(g, Q, vetro, dpr, { luce: 1 - spegne * 0.7, riflesso: kit.fract(t * 0.06) * 1.6 - 0.2, lampo: fl * 0.8 })

      // ── le monete $pzk che saltano fuori dal punto della linea ──
      if (colpo > 0 && colpo < 3.2 && moneta1.c && punta) {
        const o = nelQuad(L, punta.x / LW, punta.y / LH), gpx = h * 1.6
        for (const mo of MONETE) {
          const tt = colpo - mo.ritardo
          if (tt <= 0) continue
          const x = o[0] + mo.vx * w * 0.32 * tt, y = o[1] + mo.vy * h * 0.75 * tt + 0.5 * gpx * tt * tt
          if (y > h + moneta1.s) continue
          const sx = Math.cos(mo.f + tt * mo.giri * 3), sz = moneta1.s * mo.k * kit.ease.outBack(kit.clamp(tt * 4))
          g.save(); g.translate(x, y); g.rotate(tt * mo.vx * 2); g.scale(Math.max(0.08, Math.abs(sx)), 1)
          g.drawImage(moneta1.c, -sz * 0.65, -sz * 0.65, sz * 1.3, sz * 1.3)
          if (sx < 0) { g.fillStyle = 'rgba(0,40,10,.35)'; g.beginPath(); g.arc(0, 0, sz * 0.47, 0, Math.PI * 2); g.fill() }
          g.restore()
        }
        // il ▲ che sale dal punto
        if (colpo < 1.8) {
          const k = colpo / 1.8
          kit.scritta(g, '▲', o[0], o[1] - h * 0.08 - k * h * 0.12, { font: 'gg sans', size: w * 0.05, color: `rgba(70,255,125,${1 - k})`, align: 'center' })
        }
      }

      kit.metti(g, sopra, 0, 0, w, h)
    }
  }
}
