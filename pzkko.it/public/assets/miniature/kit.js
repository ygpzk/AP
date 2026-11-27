// miniature/kit.js — gli attrezzi comuni delle miniature vive. Solo Canvas 2D, niente librerie.
// Ogni modulo lo riceve come `m.kit` (o lo importa: import * as kit from './kit.js').

// ── numeri ──
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, k) => a + (b - a) * k
export const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k) }
export const fract = (v) => v - Math.floor(v)
export const TAU = Math.PI * 2
/** ciclo 0→1 che si ripete ogni `periodo` secondi (con uno sfasamento) */
export const ciclo = (t, periodo, sfasa = 0) => fract(t / periodo + sfasa)
/** onda 0→1→0 morbida */
export const onda = (t, periodo, sfasa = 0) => 0.5 - 0.5 * Math.cos(TAU * (t / periodo + sfasa))

export const ease = {
  in: (k) => k * k * k,
  out: (k) => 1 - (1 - k) ** 3,
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2),
  outBack: (k, s = 1.7) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2,
  outElastic: (k) => (k === 0 || k === 1 ? k : 2 ** (-10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1),
  outBounce: (k) => {
    const n = 7.5625, d = 2.75
    if (k < 1 / d) return n * k * k
    if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75
    if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375
    return n * (k -= 2.625 / d) * k + 0.984375
  },
}

/** generatore pseudo-casuale con seme (mulberry32): stesso seme, stessa scena */
export function rng(seme = 1) {
  let a = typeof seme === 'string' ? [...seme].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 7) : seme >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** rumore 1D liscio, per tremolii e derive */
export function rumore(x, seme = 0) {
  const h = (n) => fract(Math.sin(n * 127.1 + seme * 311.7) * 43758.5453)
  const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f)
  return lerp(h(i), h(i + 1), k)
}

// ── immagini e caratteri ──
const immagini = new Map()
/** carica (una volta sola per la pagina) un'immagine del sito: '/art/carta/kraft.webp', '/games/roulette/…' */
export function img(src) {
  if (!immagini.has(src)) {
    immagini.set(src, new Promise((ok, no) => {
      const i = new Image()
      i.decoding = 'async'
      // basta onload: decode() in Edge senza finestra si risolve solo a fine budget di tempo virtuale
      i.onload = () => ok(i)
      i.onerror = () => no(new Error(`immagine mancante: ${src}`))
      i.src = src
    }))
  }
  return immagini.get(src)
}
/** come img, ma se manca dà null invece di rompere il modulo */
export const imgForse = (src) => img(src).catch(() => null)

/** aspetta un carattere del sito prima di usarlo nel canvas ('Pricedown', 'Anton', 'Special Elite', 'gg sans'…) */
export function font(nome, peso = 400) {
  return document.fonts?.load(`${peso} 40px "${nome}"`).catch(() => {}) ?? Promise.resolve()
}

// ── strati fissi: disegnati una volta, poi copiati (le ombre sfocate costano: mettile qui) ──
/** crea un canvas fuori schermo di w×h px CSS (con il dpr della miniatura) e ci disegna dentro `fn(g, w, h)` */
export function strato(w, h, dpr, fn) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * dpr))
  c.height = Math.max(1, Math.round(h * dpr))
  const g = c.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  fn(g, w, h)
  return c
}
/** disegna uno strato fatto con `strato` alle sue misure CSS (w, h: le stesse passate a `strato`) */
export const metti = (g, c, x, y, w, h) => g.drawImage(c, x, y, w, h)

// ── forme ──
export function tondo(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}
/** salva, sposta, ruota (radianti), scala; poi fn(); poi ripristina */
export function con(g, x, y, rot, scala, fn) {
  g.save()
  g.translate(x, y)
  if (rot) g.rotate(rot)
  if (scala != null && scala !== 1) g.scale(scala, scala)
  fn()
  g.restore()
}

// ── lo stile pzk (il muro: carta col nastro, Anton, pennarello, macchina da scrivere) ──
export const PZK = {
  rosso: '#d0201c', giallo: '#ffe94d', nero: '#141414', carta: '#f4efe1', verde: '#ccff00', viola: '#9d00ff',
  titolo: 'Anton', pennarello: 'Permanent Marker', macchina: 'Special Elite', discord: 'gg sans', mono: 'gg mono',
}
export const CARTE = ['bianco', 'giallo', 'kraft', 'giornale', 'arancio', 'verde', 'crema', 'lucido', 'azzurro']
/** un foglio vero del muro (/art/carta/<tipo>.webp, col nastro già sopra), ruotato, con l'ombra */
export async function carta(tipo = 'bianco') { return img(`/art/carta/${tipo}.webp`) }
export function foglio(g, im, cx, cy, w, h, rot = 0, ombra = 0.35) {
  con(g, cx, cy, rot, 1, () => {
    if (ombra) { g.shadowColor = `rgba(0,0,0,${ombra})`; g.shadowBlur = Math.max(4, w * 0.05); g.shadowOffsetY = w * 0.02 }
    g.drawImage(im, -w / 2, -h / 2, w, h)
  })
}
/** un pezzo di nastro adesivo disegnato (traslucido, coi bordi seghettati) */
export function nastro(g, cx, cy, w, h, rot = 0, colore = 'rgba(236,226,190,.72)') {
  con(g, cx, cy, rot, 1, () => {
    g.fillStyle = colore
    g.beginPath()
    const d = h / 5
    g.moveTo(-w / 2, -h / 2)
    for (let x = -w / 2; x <= w / 2; x += w / 8) g.lineTo(x, -h / 2 + ((x * 7) % 2 ? d * 0.4 : 0))
    g.lineTo(w / 2, -h / 2)
    for (let y = -h / 2; y <= h / 2; y += d) g.lineTo(w / 2 + (Math.round(y / d) % 2 ? d * 0.6 : 0), y)
    g.lineTo(-w / 2, h / 2)
    for (let y = h / 2; y >= -h / 2; y -= d) g.lineTo(-w / 2 - (Math.round(y / d) % 2 ? d * 0.6 : 0), y)
    g.closePath()
    g.fill()
    g.fillStyle = 'rgba(255,255,255,.18)'
    g.fillRect(-w / 2, -h / 2, w, h * 0.3)
  })
}
/** scritta con un carattere, allineata e ruotata; `ombra` = spessore dell'ombra piena sotto (px) */
export function scritta(g, testo, x, y, { font: f = PZK.titolo, size = 20, color = '#fff', align = 'left', base = 'alphabetic', rot = 0, ombra = 0, ombraColore = 'rgba(0,0,0,.35)', peso = 400, spazio = 0 } = {}) {
  con(g, x, y, rot, 1, () => {
    g.font = `${peso} ${size}px "${f}"`
    g.textAlign = align
    g.textBaseline = base
    if ('letterSpacing' in g) g.letterSpacing = `${spazio}px`
    if (ombra) { g.fillStyle = ombraColore; g.fillText(testo, 0, ombra) }
    g.fillStyle = color
    g.fillText(testo, 0, 0)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
  })
}
/** l'evidenziatore giallo dietro a un rettangolo (passata a mano, un po' storta) */
export function evidenzia(g, x, y, w, h, k = 1, colore = 'rgba(255,233,77,.85)') {
  g.save()
  g.fillStyle = colore
  g.beginPath()
  g.moveTo(x, y + h * 0.15)
  g.lineTo(x + w * k, y)
  g.lineTo(x + w * k + h * 0.1, y + h * 0.9)
  g.lineTo(x - h * 0.05, y + h)
  g.closePath()
  g.globalCompositeOperation = 'multiply'
  g.fill()
  g.restore()
}
/** un timbro di gomma (cerchio o rettangolo) con la scritta, inchiostro un po' mangiato */
export function timbro(g, testo, cx, cy, size, rot = -0.2, colore = PZK.rosso, k = 1) {
  con(g, cx, cy, rot, 0.6 + 0.4 * k, () => {
    g.globalAlpha *= clamp(k)
    g.strokeStyle = colore
    g.fillStyle = colore
    g.lineWidth = size * 0.08
    g.font = `400 ${size * 0.42}px "${PZK.titolo}"`
    const w = g.measureText(testo).width + size * 0.5
    tondo(g, -w / 2, -size * 0.36, w, size * 0.72, size * 0.12)
    g.stroke()
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(testo.toUpperCase(), 0, size * 0.03)
  })
}

// ── finiture: grana, vignetta, righe CRT ──
let grana = null
/** grana della foto sopra la scena (a = 0.03…0.1); il motivo è fatto una volta per tutta la pagina */
export function granella(g, w, h, a = 0.06, t = 0) {
  if (!grana) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const x = c.getContext('2d'), d = x.createImageData(128, 128), r = rng(9)
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 }
    x.putImageData(d, 0, 0)
    grana = c
  }
  g.save()
  g.globalAlpha = a
  g.globalCompositeOperation = 'overlay'
  const p = g.createPattern(grana, 'repeat')
  const o = Math.floor(t * 24) % 8
  g.translate(o * 17 % 128, o * 29 % 128)
  g.fillStyle = p
  g.fillRect(-128, -128, w + 256, h + 256)
  g.restore()
}
export function vignetta(g, w, h, a = 0.45) {
  const r = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.62)
  r.addColorStop(0, 'rgba(0,0,0,0)')
  r.addColorStop(1, `rgba(0,0,0,${a})`)
  g.fillStyle = r
  g.fillRect(0, 0, w, h)
}
export function righeCrt(g, w, h, a = 0.18, passo = 3) {
  g.fillStyle = `rgba(0,0,0,${a})`
  for (let y = 0; y < h; y += passo) g.fillRect(0, y, w, 1)
}
/** sfondo coi due colori della copertina (come la copertina di prima) */
export function fondo(g, w, h, c1, c2) {
  const l = g.createLinearGradient(0, 0, w, h)
  l.addColorStop(0, c1)
  l.addColorStop(1, c2)
  g.fillStyle = l
  g.fillRect(0, 0, w, h)
}
