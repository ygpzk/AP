// Il terreno della scena «Dove vivo»: una finta ortofoto disegnata a mano, non una foto vera.
// I confini, i campi, le strade e l'acqua sono quelli del rilievo (dati.js, metri locali); i campi
// lontani, i filari, i boschi e le ombre sono inventati qui. Niente dati geografici, niente rete:
// tutto è un canvas, una volta sola, all'avvio della scena.
import { DATI } from './dati.js'

const RAD = Math.PI / 180
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const mescola = (a, b, t) => a + (b - a) * t
const rndSemina = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 }

// ── i tipi di albero, in comune con mondo.js (3D) e con il disegno dell'orto ──
// tronco: altezza in metri · chioma: raggio · alto: per i pioppi, l'altezza della colonna
export const TIPI_ALBERO = {
  platano: { tronco: 3.4, chioma: 3.2, colori: ['#5f7648', '#69804e', '#536b40', '#708753'] },
  gelso: { tronco: 2.6, chioma: 3.0, colori: ['#587044', '#62794a', '#4d653d', '#6c8352'] },
  pioppo: { tronco: 2.8, chioma: 1.8, alto: 6.2, colori: ['#5b7143', '#647b48', '#50683e', '#6f8650'] },
  frutteto: { tronco: 1.3, chioma: 2.15, colori: ['#6d844d', '#788f54', '#607945', '#829757'] },
  autunno: { tronco: 3.2, chioma: 2.9, colori: ['#8d743e', '#9a8046', '#7c6537', '#a88c4f'] },
  siepe: { tronco: 0.9, chioma: 1.15, colori: ['#4f683b', '#587143', '#465f35', '#617a46'] },
}

// ── piccole utilità per disegnare in metri locali (x est, y nord) ──
const nuovoCanvas = (lato) => { const c = document.createElement('canvas'); c.width = c.height = lato; return c }
const rgba = (h, a) => {
  const n = parseInt(h.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const bbox = (p) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]) }
  return [x0, y0, x1, y1]
}
const angoloLungo = (p) => {
  let L = 0, a = 0
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length], d = Math.hypot(q[0] - p[i][0], q[1] - p[i][1])
    if (d > L) { L = d; a = Math.atan2(q[1] - p[i][1], q[0] - p[i][0]) }
  }
  return a
}
const senzaDup = (p) => (p.length > 1 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) < 0.05 ? p.slice(0, -1) : p)

// ── le tavolozze dell'orto: verdi spenti, stoppie, terra, bosco ──
const P = {
  prato: ['#83965c', '#8da064', '#7a8c55', '#96a36c', '#74864f'],
  pratoChiaro: ['#9da86e', '#a7af79', '#94a066', '#b1b781'],
  stoppia: ['#bdae7b', '#c6b886', '#b2a36e', '#cfc18e'],
  terra: ['#8f7252', '#997a59', '#846749', '#a38463', '#785d42'],
  coltura: ['#71894a', '#7d9353', '#657f42', '#889d5b'],
  bosco: ['#50693b', '#596f41', '#485f36', '#617848'],
  acqua: '#3f6765',
  acquaScura: '#315452',
  ghiaia: '#bcb09d',
  asfalto: '#55585a',
  sterrato: '#a99a82',
  tetto: ['#8f5a43', '#9b644c', '#84503a', '#a36b51'],
  muro: ['#d7cdb8', '#dfd5c0', '#cfc4ae'],
}
const scelta = (a, r) => a[Math.floor(r() * a.length) % a.length]

// ── un campo di rumore morbido, da stendere sopra i colori pieni ──
function campoRumore(lato, seed) {
  const c = nuovoCanvas(lato), g = c.getContext('2d')
  const im = g.createImageData(lato, lato), d = im.data
  const r = rndSemina(seed)
  const latoGriglia = 16, griglia = new Float32Array((latoGriglia + 1) * (latoGriglia + 1))
  for (let i = 0; i < griglia.length; i++) griglia[i] = r()
  const v = (x, y) => {
    const xi = x * latoGriglia, yi = y * latoGriglia
    const i = Math.floor(xi), j = Math.floor(yi)
    const fx = xi - i, fy = yi - j
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
    const a = griglia[j * (latoGriglia + 1) + i], b = griglia[j * (latoGriglia + 1) + i + 1]
    const c = griglia[(j + 1) * (latoGriglia + 1) + i], e = griglia[(j + 1) * (latoGriglia + 1) + i + 1]
    return mescola(mescola(a, b, sx), mescola(c, e, sx), sy)
  }
  for (let y = 0; y < lato; y++) for (let x = 0; x < lato; x++) {
    const u = x / lato, w = y / lato
    let n = v(u, w) * 0.55 + v((u * 3.1) % 1, (w * 3.1) % 1) * 0.3 + v((u * 9.3) % 1, (w * 9.3) % 1) * 0.15
    n = clamp(n, 0, 1)
    const k = (y * lato + x) * 4
    d[k] = d[k + 1] = d[k + 2] = 128 + (n - 0.5) * 255
    d[k + 3] = 255
  }
  g.putImageData(im, 0, 0)
  return c
}

// ── i sassolini e la grana fine: un velo sopra tutto, a risoluzione piena ──
function grana(lato, seed) {
  const c = nuovoCanvas(lato), g = c.getContext('2d')
  const im = g.createImageData(lato, lato), d = im.data
  const r = rndSemina(seed)
  for (let i = 0; i < d.length; i += 4) {
    const n = 128 + (r() - 0.5) * 50
    d[i] = d[i + 1] = d[i + 2] = n
    d[i + 3] = 255
  }
  g.putImageData(im, 0, 0)
  return c
}

function ombraSprite() {
  const c = nuovoCanvas(128), g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62)
  grad.addColorStop(0, 'rgba(20,29,16,0.6)')
  grad.addColorStop(0.55, 'rgba(20,29,16,0.26)')
  grad.addColorStop(1, 'rgba(20,29,16,0)')
  g.fillStyle = grad
  g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill()
  return c
}
function alberoSprite() {
  const c = nuovoCanvas(128), g = c.getContext('2d')
  const grad = g.createRadialGradient(58, 52, 6, 64, 64, 60)
  grad.addColorStop(0, 'rgba(92,113,64,0.96)')
  grad.addColorStop(0.55, 'rgba(66,86,46,0.86)')
  grad.addColorStop(1, 'rgba(46,62,34,0)')
  g.fillStyle = grad
  g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill()
  return c
}

// ── il disegno del terreno ──
export function creaTerreno({
  lato = 4096, metri = 700, seed = 20261124, lontano = false,
  alberi = [], siepi = [], giardino = null, ghiaia = null, viale = null,
} = {}) {
  const c = nuovoCanvas(lato), g = c.getContext('2d')
  const s = lato / metri
  const X = (x) => lato / 2 + x * s
  const Y = (y) => lato / 2 - y * s
  const px = (m) => m * s
  const r = rndSemina(seed)
  const percorso = (p) => {
    g.beginPath()
    p.forEach((q, i) => { const x = X(q[0]), y = Y(q[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y) })
    g.closePath()
  }
  const riempi = (p, colore) => { percorso(p); g.fillStyle = colore; g.fill() }
  const bordo = (p, colore, larghezza, alpha = 1) => {
    percorso(p); g.strokeStyle = colore; g.lineWidth = Math.max(0.6, larghezza); g.globalAlpha = alpha; g.stroke(); g.globalAlpha = 1
  }
  const dentro = (x, y, p) => {
    let d = false
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1]
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d
    }
    return d
  }

  // 1 · il fondo: colore di prato, nuvole di verde, poi la campagna a pezze
  g.fillStyle = '#7d8d55'
  g.fillRect(0, 0, lato, lato)
  const nuvola = campoRumore(256, seed + 3)
  g.globalAlpha = 0.55
  g.globalCompositeOperation = 'soft-light'
  g.drawImage(nuvola, 0, 0, lato, lato)
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'

  // parcelle: una griglia irregolare ruotata, come i campi della pianura
  const angPezze = 12 * RAD
  const C = Math.cos(angPezze), S = Math.sin(angPezze)
  const mondo = (u, v) => [u * C - v * S, u * S + v * C]
  const pezze = []
  const taglia = (u0, v0, u1, v1, prof) => {
    const w = u1 - u0, h = v1 - v0
    if (prof <= 0 || (w < metri * 0.075 && h < metri * 0.075)) { pezze.push([u0, v0, u1, v1]); return }
    const vert = w > h ? true : h > w ? false : r() < 0.5
    const f = 0.36 + r() * 0.28
    if (vert) { const m = u0 + w * f; taglia(u0, v0, m, v1, prof - 1); taglia(m, v0, u1, v1, prof - 1) }
    else { const m = v0 + h * f; taglia(u0, v0, u1, m, prof - 1); taglia(u0, m, u1, v1, prof - 1) }
  }
  const latoPezze = metri * 1.6
  taglia(-latoPezze / 2, -latoPezze / 2, latoPezze / 2, latoPezze / 2, lontano ? 5 : 7)

  // i campi lontani: colori alternati, righe leggere, qualche filare e boschetto
  const spriteOmbra = ombraSprite()
  const spriteAlbero = alberoSprite()
  const disegnaOmbra = (x, y, rx, ry, alpha = 0.55) => {
    g.globalAlpha = alpha
    g.drawImage(spriteOmbra, X(x) - rx * s, Y(y) - ry * s, rx * 2 * s, ry * 2 * s)
    g.globalAlpha = 1
  }
  const disegnaAlberoVista = (x, y, raggio, alpha = 0.9) => {
    g.globalAlpha = alpha
    g.drawImage(spriteAlbero, X(x) - raggio * s, Y(y) - raggio * s, raggio * 2 * s, raggio * 2 * s)
    g.globalAlpha = 1
  }

  for (let i = 0; i < pezze.length; i++) {
    const [u0, v0, u1, v1] = pezze[i]
    const q = [mondo(u0, v0), mondo(u1, v0), mondo(u1, v1), mondo(u0, v1)]
    const bb = bbox(q)
    // fuori dal disegno non serve
    if (X(bb[2]) < -40 || X(bb[0]) > lato + 40 || Y(bb[1]) < -40 || Y(bb[3]) > lato + 40) continue
    const tipo = r()
    let colore, righe = false, passo = 0.65, ang = angPezze, terra = false, stoppia = false
    if (tipo < 0.17) { colore = scelta(P.terra, r); righe = true; passo = 0.8 + r() * 0.5; terra = true; ang += (r() - 0.5) * 0.55 }
    else if (tipo < 0.32) { colore = scelta(P.stoppia, r); righe = true; passo = 0.44 + r() * 0.34; stoppia = true; ang += (r() - 0.5) * 0.22 }
    else if (tipo < 0.63) { colore = scelta(P.coltura, r); righe = true; passo = 0.34 + r() * 0.3 }
    else if (tipo < 0.83) { colore = scelta(P.prato, r); righe = r() < 0.32; passo = 1.5 + r() * 1.1 }
    else { colore = scelta(P.pratoChiaro, r); righe = r() < 0.36; passo = 1.4 + r() }
    if (r() < 0.5) ang += Math.PI / 2
    ang += (r() - 0.5) * 0.16
    riempi(q, colore)
    // macchie di terreno, erba secca, foglie: il campo non è un colore piatto
    {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const [x, y] of q) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
      g.save(); percorso(q); g.clip()
      for (let k = 0; k < 64; k++) {
        const x = mescola(x0, x1, r()), y = mescola(y0, y1, r())
        const rr = 0.5 + r() * (terra ? 2.6 : 3.8)
        g.fillStyle = rgba(r() < 0.5
          ? (terra ? '#5d4632' : '#556b3b')
          : (stoppia ? '#d0c392' : '#94a462'), 0.04 + r() * 0.09)
        g.beginPath(); g.ellipse(X(x), Y(y), px(rr), px(rr * (0.5 + r() * 0.6)), r() * 3, 0, 7); g.fill()
      }
      g.restore()
    }
    // righe di coltura, solo dove si vedono (da lontano sarebbero rumore)
    if (righe && s > 1.1) {
      const cx = (X(q[0][0]) + X(q[2][0])) / 2, cy = (Y(q[0][1]) + Y(q[2][1])) / 2
      const R = Math.hypot(X(bb[2]) - X(bb[0]), Y(bb[3]) - Y(bb[1])) * 0.55
      g.save()
      percorso(q); g.clip()
      g.translate(cx, cy); g.rotate(-ang)
      if (terra) {
        // terreno arato: bande larghe, con il filo del solco chiaro
        for (let d = -R; d <= R; d += Math.max(2.5, passo * s)) {
          g.fillStyle = 'rgba(55,42,29,0.3)'; g.fillRect(-R, d, R * 2, Math.max(1.4, passo * s * 0.52))
          g.fillStyle = 'rgba(216,195,160,0.09)'; g.fillRect(-R, d + Math.max(1.4, passo * s * 0.52), R * 2, Math.max(0.8, passo * s * 0.1))
        }
        // solchi ogni 5–7 metri: si vedono anche da lontano
        for (let d = -R; d <= R; d += Math.max(10, px(5 + r() * 2))) {
          g.fillStyle = ((d / px(5)) | 0) % 2 ? 'rgba(205,185,150,0.05)' : 'rgba(52,40,27,0.06)'
          g.fillRect(-R, d, R * 2, Math.max(8, px(3.4)))
        }
      } else if (stoppia) {
        g.strokeStyle = 'rgba(247,238,204,0.28)'; g.lineWidth = Math.max(1, px(0.28))
        g.beginPath()
        for (let d = -R; d <= R; d += Math.max(2.2, passo * s)) { g.moveTo(-R, d); g.lineTo(R, d) }
        g.stroke()
        g.strokeStyle = 'rgba(96,79,49,0.24)'; g.lineWidth = Math.max(1, px(0.4))
        g.beginPath()
        for (let d = -R + passo * s * 0.5; d <= R; d += Math.max(2.2, passo * s)) { g.moveTo(-R, d); g.lineTo(R, d) }
        g.stroke()
        // bande di stoppie alte e basse, per la lettura da lontano
        for (let d = -R; d <= R; d += Math.max(15, px(4.2 + r() * 2.5))) {
          g.fillStyle = ((d / px(4.2)) | 0) % 2 ? 'rgba(244,230,186,0.06)' : 'rgba(91,76,47,0.055)'
          g.fillRect(-R, d, R * 2, Math.max(10, px(3.2)))
        }
        g.strokeStyle = 'rgba(82,66,42,0.16)'; g.lineWidth = Math.max(1.2, px(0.5))
        for (const off of [-1.6 * s, 1.6 * s]) { g.beginPath(); g.moveTo(-R, off); g.lineTo(R, off); g.stroke() }
      } else {
        g.strokeStyle = 'rgba(46,60,31,0.3)'; g.lineWidth = Math.max(0.9, px(0.28))
        g.beginPath()
        for (let d = -R; d <= R; d += Math.max(2.3, passo * s)) { g.moveTo(-R, d); g.lineTo(R, d) }
        g.stroke()
        g.strokeStyle = 'rgba(178,192,126,0.13)'; g.lineWidth = Math.max(0.8, px(0.12))
        g.beginPath()
        for (let d = -R + passo * s * 0.5; d <= R; d += Math.max(2.3, passo * s)) { g.moveTo(-R, d); g.lineTo(R, d) }
        g.stroke()
        // bande larghe di coltura, per la lettura da lontano
        for (let d = -R; d <= R; d += Math.max(14, px(4 + r() * 3))) {
          g.fillStyle = ((d / px(4)) | 0) % 2 ? 'rgba(194,208,142,0.04)' : 'rgba(45,59,30,0.05)'
          g.fillRect(-R, d, R * 2, Math.max(10, px(3)))
        }
      }
      // due tracce dei mezzi, ogni tanto
      if (r() < 0.62) {
        g.strokeStyle = 'rgba(62,52,38,0.14)'; g.lineWidth = Math.max(1.2, px(0.45))
        for (const off of [-1.7 * s, 1.7 * s]) { g.beginPath(); g.moveTo(-R, off); g.lineTo(R, off); g.stroke() }
      }
      g.restore()
    } else if (s > 1.1) {
      // prato falciato: bande larghe, quasi invisibili, che tolgono il colore piatto
      const cx = (X(q[0][0]) + X(q[2][0])) / 2, cy = (Y(q[0][1]) + Y(q[2][1])) / 2
      const R = Math.hypot(X(bb[2]) - X(bb[0]), Y(bb[3]) - Y(bb[1])) * 0.6
      g.save(); percorso(q); g.clip()
      g.translate(cx, cy); g.rotate(-ang + 0.25)
      for (let d = -R; d <= R; d += Math.max(8, px(4.2))) {
        g.fillStyle = ((d / px(4.2)) | 0) % 2 ? 'rgba(209,215,151,0.055)' : 'rgba(54,72,38,0.05)'
        g.fillRect(-R, d, R * 2, Math.max(8, px(4.2)))
      }
      g.restore()
    }
    // balle di fieno, ogni tanto, nelle stoppie
    if (stoppia && s > 1.4) {
      const bb2 = bbox(q)
      for (let k = 0; k < 2 + Math.floor(r() * 4); k++) {
        const x = mescola(bb2[0], bb2[2], r()), y = mescola(bb2[1], bb2[3], r())
        g.fillStyle = 'rgba(60,48,32,0.25)'
        g.beginPath(); g.ellipse(X(x) + px(0.5), Y(y) + px(0.4), px(0.9), px(0.45), 0, 0, 7); g.fill()
        g.fillStyle = '#d7c895'; g.beginPath(); g.arc(X(x), Y(y), px(0.8 + r() * 0.3), 0, 7); g.fill()
        g.strokeStyle = 'rgba(120,103,66,0.35)'; g.lineWidth = Math.max(0.6, px(0.08)); g.stroke()
      }
    }
    // una pozza o un piccolo stagno in fondo al campo
    if (tipo < 0.32 && r() < 0.14) {
      const bb2 = bbox(q)
      const x = mescola(bb2[0], bb2[2], r()), y = mescola(bb2[1], bb2[3], r())
      g.fillStyle = 'rgba(68,88,73,0.5)'
      g.beginPath(); g.ellipse(X(x), Y(y), px(3 + r() * 6), px(1.5 + r() * 3.5), r() * 3, 0, 7); g.fill()
      g.fillStyle = 'rgba(87,116,104,0.35)'
      g.beginPath(); g.ellipse(X(x), Y(y), px(2 + r() * 3), px(0.8 + r() * 1.5), r() * 3, 0, 7); g.fill()
    }
    // il bordo del campo: una fascia di erba o di terra battuta
    bordo(q, r() < 0.22 ? 'rgba(57,72,42,0.7)' : 'rgba(72,82,54,0.26)', Math.max(1.2, px(r() < 0.22 ? 1.1 : 0.4)))
    // filari sui bordi
    if (r() < 0.23 && s > 0.9) {
      const [x0, y0, x1, y1] = bb
      const lati = [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]]
      for (const [a, b] of lati) {
        if (r() > 0.55) continue
        const L = Math.hypot(b[0] - a[0], b[1] - a[1])
        const n = Math.max(2, Math.floor(L / (7 + r() * 5)))
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n
          const x = a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 1.5
          const y = a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 1.5
          if (r() > 0.8) continue
          disegnaOmbra(x + 1.2, y - 1.2, 3.1, 1.9, 0.3)
          disegnaAlberoVista(x, y, 2.7 + r() * 1.3, 0.82)
        }
      }
    }
    // un boschetto ogni tanto
    if (r() < 0.12 && s > 0.9) {
      const [x0, y0, x1, y1] = bb
      const cx = mescola(x0, x1, 0.5), cy = mescola(y0, y1, 0.5)
      const rr = Math.min(x1 - x0, y1 - y0) * 0.3
      for (let k = 0; k < 26; k++) {
        const a = r() * 6.28, d = Math.sqrt(r()) * rr
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d
        disegnaOmbra(x + 1, y - 1, 1.9, 1.2, 0.25)
        disegnaAlberoVista(x, y, 1.6 + r() * 1.4, 0.7)
      }
    }
    // una cascina lontana, ogni tanto
    if (r() < 0.035 && s > 1.2) {
      const [x0, y0, x1, y1] = bb
      const cx = mescola(x0, x1, 0.35 + r() * 0.3), cy = mescola(y0, y1, 0.35 + r() * 0.3)
      const w = 7 + r() * 9, h = 5 + r() * 6, rot = angPezze + (r() - 0.5) * 0.4
      const cr = Math.cos(rot), sr = Math.sin(rot)
      const angolo = (du, dv) => [cx + du * cr - dv * sr, cy + du * sr + dv * cr]
      const wall = [angolo(-w / 2, -h / 2), angolo(w / 2, -h / 2), angolo(w / 2, h / 2), angolo(-w / 2, h / 2)]
      g.globalAlpha = 0.28; riempi(wall.map(([x, y]) => [x + 1.8, y - 1.4]), '#24301e'); g.globalAlpha = 1
      riempi(wall, scelta(P.muro, r))
      bordo(wall, 'rgba(60,48,38,0.55)', Math.max(1, px(0.3)))
      const roof = [angolo(-w / 2 - 0.5, -h / 2), angolo(w / 2 + 0.5, -h / 2), angolo(w / 2 + 0.5, 0), angolo(-w / 2 - 0.5, 0)]
      riempi(roof, scelta(P.tetto, r))
      bordo(roof, 'rgba(65,38,28,0.6)', Math.max(1, px(0.3)))
    }
  }

  // 2 · dentro il lotto: prato di casa, campi veri, cortile, giardino
  const confine = senzaDup(DATI.confine)
  riempi(confine, '#8a9e60')
  g.save()
  percorso(confine); g.clip()
  g.globalAlpha = 0.5
  g.globalCompositeOperation = 'soft-light'
  g.drawImage(nuvola, 0, 0, lato, lato)
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
  // strisce di falciatura, appena percettibili
  {
    const bb = bbox(confine), R = Math.hypot(X(bb[2]) - X(bb[0]), Y(bb[3]) - Y(bb[1])) * 0.6
    g.save()
    g.translate(X((bb[0] + bb[2]) / 2), Y((bb[1] + bb[3]) / 2)); g.rotate(-24 * RAD)
    for (let d = -R; d <= R; d += px(4.2)) {
      g.fillStyle = ((d / px(4.2)) | 0) % 2 ? 'rgba(220,226,170,0.035)' : 'rgba(50,70,35,0.035)'
      g.fillRect(-R, d, R * 2, px(4.2))
    }
    g.restore()
  }
  g.restore()

  // i campi del rilievo
  const coloriCampi = {
    farmland: [P.coltura[1], P.stoppia[0], P.terra[1], P.coltura[3]],
    wood: [P.bosco[0], P.bosco[2], P.bosco[1]],
    vineyard: ['#7b7048'],
    residential: ['#8a9a62', '#899660'],
    meadow: [P.pratoChiaro[0]], grass: [P.prato[1]],
  }
  for (let i = 0; i < DATI.campi.length; i++) {
    const campo = DATI.campi[i], p = senzaDup(campo.p)
    if (p.length < 3) continue
    const tipo = campo.c
    const arato = tipo === 'farmland' && i === 7
    const verde = tipo === 'farmland' && i !== 7
    const col = arato ? '#856a4d' : verde ? '#788f4e' : scelta(coloriCampi[tipo] ?? P.prato, r)
    riempi(p, col)
    const bb = bbox(p)
    // macchie dentro il campo
    g.save(); percorso(p); g.clip()
    for (let k = 0; k < 190; k++) {
      const x = mescola(bb[0], bb[2], r()), y = mescola(bb[1], bb[3], r())
      const rr = 0.5 + r() * 3.4
      g.fillStyle = rgba(arato ? (r() < 0.5 ? '#5e4632' : '#9b7e5c') : (r() < 0.5 ? '#536a39' : '#95a666'), 0.04 + r() * 0.11)
      g.beginPath(); g.ellipse(X(x), Y(y), px(rr), px(rr * (0.5 + r() * 0.6)), r() * 3, 0, 7); g.fill()
    }
    g.restore()
    if (tipo === 'farmland' || tipo === 'vineyard') {
      const ang = angoloLungo(p)
      const passo = tipo === 'vineyard' ? 1.6 : arato ? 0.8 : 0.62
      const cx = X((bb[0] + bb[2]) / 2), cy = Y((bb[1] + bb[3]) / 2)
      const R = Math.hypot(X(bb[2]) - X(bb[0]), Y(bb[3]) - Y(bb[1])) * 0.6
      g.save(); percorso(p); g.clip()
      g.translate(cx, cy); g.rotate(-ang)
      if (arato) {
        for (let d = -R; d <= R; d += Math.max(3, passo * s)) {
          g.fillStyle = 'rgba(55,42,29,0.3)'; g.fillRect(-R, d, R * 2, Math.max(1.8, passo * s * 0.5))
          g.fillStyle = 'rgba(219,196,160,0.09)'; g.fillRect(-R, d + Math.max(1.8, passo * s * 0.5), R * 2, Math.max(0.8, passo * s * 0.08))
        }
      } else {
        g.strokeStyle = tipo === 'vineyard' ? 'rgba(48,44,32,0.45)' : 'rgba(44,60,30,0.34)'
        g.lineWidth = Math.max(1, px(tipo === 'vineyard' ? 0.3 : 0.24))
        g.beginPath()
        for (let d = -R; d <= R; d += Math.max(2.4, passo * s)) { g.moveTo(-R, d); g.lineTo(R, d) }
        g.stroke()
        if (verde) {
          g.strokeStyle = 'rgba(188,205,132,0.16)'; g.lineWidth = Math.max(0.9, px(0.14))
          g.beginPath()
          for (let d = -R + passo * s * 0.5; d <= R; d += Math.max(2.4, passo * s)) { g.moveTo(-R, d); g.lineTo(R, d) }
          g.stroke()
        }
      }
      // bande larghe di coltura, per la lettura da lontano
      for (let d = -R; d <= R; d += Math.max(16, px(4.5 + r() * 2))) {
        g.fillStyle = ((d / px(4.5)) | 0) % 2 ? 'rgba(198,211,146,0.045)' : 'rgba(45,59,30,0.055)'
        g.fillRect(-R, d, R * 2, Math.max(12, px(3.2)))
      }
      // le ruotate dei trattori
      g.strokeStyle = 'rgba(55,47,34,0.17)'; g.lineWidth = Math.max(1.2, px(0.55))
      for (const off of [-1.8 * s, 1.8 * s]) { g.beginPath(); g.moveTo(-R, off); g.lineTo(R, off); g.stroke() }
      g.restore()
      // la fascia di testata lungo il bordo, più chiara
      bordo(p, arato ? 'rgba(93,75,52,0.4)' : 'rgba(88,106,55,0.35)', Math.max(1.5, px(1.1)))
    }
    if (tipo === 'wood') {
      // sottobosco e i filari dell'orto, con la stessa geometria dei 3D
      g.save(); percorso(p); g.clip()
      for (let k = 0; k < 320; k++) {
        const x = mescola(bb[0], bb[2], r()), y = mescola(bb[1], bb[3], r())
        const rr = 0.7 + r() * 4
        g.fillStyle = rgba(r() < 0.5 ? '#3c5330' : '#647b4a', 0.2 + r() * 0.3)
        g.beginPath(); g.arc(X(x), Y(y), px(rr), 0, 7); g.fill()
      }
      const angOrto = 108 * RAD, passi = [4.3, 5.5]
      for (const passo of passi) {
        g.save()
        g.translate(X((bb[0] + bb[2]) / 2), Y((bb[1] + bb[3]) / 2)); g.rotate(-angOrto)
        const R = Math.hypot(X(bb[2]) - X(bb[0]), Y(bb[3]) - Y(bb[1])) * 0.7
        g.strokeStyle = 'rgba(52,64,36,0.28)'; g.lineWidth = Math.max(1.2, px(0.9))
        g.beginPath()
        for (let d = -R; d <= R; d += passo * s) { g.moveTo(-R, d); g.lineTo(R, d) }
        g.stroke()
        g.restore()
      }
      g.restore()
    }
    bordo(p, 'rgba(52,63,37,0.32)', Math.max(1, px(0.5)))
  }
  // vigneto piccolo vicino a casa: filari chiari
  {
    const v = senzaDup(DATI.campi.find((c) => c.c === 'vineyard')?.p ?? [])
    if (v.length > 2) {
      g.save(); percorso(v); g.clip()
      const bb = bbox(v)
      for (let y = bb[1]; y < bb[3]; y += 1.7) {
        g.strokeStyle = 'rgba(60,56,38,0.4)'; g.lineWidth = Math.max(1, px(0.3))
        g.beginPath(); g.moveTo(X(bb[0]), Y(y)); g.lineTo(X(bb[2]), Y(y)); g.stroke()
      }
      g.restore()
    }
  }

  // 3 · strade, acqua, cortili
  const linea = (p, colore, larghezza, alpha = 1, tratteggio = null) => {
    if (p.length < 2) return
    g.save()
    g.lineCap = 'round'; g.lineJoin = 'round'
    g.strokeStyle = colore; g.globalAlpha = alpha; g.lineWidth = Math.max(1, px(larghezza))
    if (tratteggio) g.setLineDash(tratteggio.map((d) => px(d)))
    g.beginPath()
    p.forEach((q, i) => { if (i) g.lineTo(X(q[0]), Y(q[1])); else g.moveTo(X(q[0]), Y(q[1])) })
    g.stroke()
    g.restore()
  }
  for (const strada of DATI.strade) {
    if (strada.p.length < 2) continue
    const tipo = strada.c
    const larg = strada.w ?? (tipo === 'secondary' ? 6.5 : 3)
    const asfalto = tipo === 'secondary' || tipo === 'primary' || tipo === 'tertiary' || tipo === 'trunk' || tipo === 'motorway'
    linea(strada.p, 'rgba(107,101,82,0.5)', larg + 1.6)
    linea(strada.p, asfalto ? '#4d5051' : P.sterrato, larg)
    if (asfalto) {
      linea(strada.p, 'rgba(230,224,203,0.16)', Math.max(0.1, larg * 0.03), 1, [3.4, 5])
      linea(strada.p, 'rgba(25,28,28,0.2)', Math.max(0.35, larg * 0.2), 1)
      // le due piste di usura delle ruote
      linea(strada.p, 'rgba(183,180,166,0.08)', Math.max(0.3, larg * 0.1), 1)
    } else {
      linea(strada.p, 'rgba(226,215,192,0.2)', Math.max(0.5, larg * 0.12), 1)
      linea(strada.p, 'rgba(90,78,60,0.18)', Math.max(0.35, larg * 0.16), 1)
    }
  }
  // una capezzagna di terra nel campo grande, per rompere la distesa verde
  if (!lontano) {
    const capezzagna = [[54, -26], [50, -53], [46, -83], [41, -112], [36, -138]]
    linea(capezzagna, 'rgba(119,105,84,0.5)', 3.4)
    linea(capezzagna, 'rgba(177,161,132,0.45)', 2.6)
    for (const off of [-0.8, 0.8]) {
      linea(capezzagna.map(([x, y]) => [x + off, y]), 'rgba(74,64,49,0.18)', 0.4)
    }
  }
  for (const a of DATI.acqua) {
    if (a.p.length < 2) continue
    linea(a.p, 'rgba(91,84,61,0.55)', a.w + 2.6)
    linea(a.p, P.acquaScura, a.w + 0.6)
    linea(a.p, P.acqua, Math.max(0.7, a.w))
    linea(a.p, 'rgba(174,206,198,0.28)', Math.max(0.25, a.w * 0.18))
    if (a.p.length > 3) linea(a.p, 'rgba(230,246,238,0.25)', Math.max(0.2, a.w * 0.1), 1, [1.5, 7])
    // canneti sul bordo
    for (let i = 0; i < a.p.length - 1; i += 1) {
      if (r() < 0.5) continue
      const [x, y] = a.p[i]
      const dx = a.p[i + 1][0] - x, dy = a.p[i + 1][1] - y, L = Math.hypot(dx, dy) || 1
      const nx = -dy / L, ny = dx / L
      for (const lato of [-1, 1]) {
        if (r() < 0.55) continue
        const px2 = x + nx * (a.w / 2 + 1.3) * lato, py2 = y + ny * (a.w / 2 + 1.3) * lato
        g.fillStyle = rgba('#5b703e', 0.35 + r() * 0.3)
        g.beginPath(); g.arc(X(px2), Y(py2), px(1.1 + r() * 1.2), 0, 7); g.fill()
      }
    }
  }
  for (const spec of DATI.specchi) {
    const p = senzaDup(spec.p)
    if (p.length < 3) continue
    riempi(p, 'rgba(112,119,92,0.65)')
    bordo(p, 'rgba(232,228,210,0.5)', Math.max(1, px(0.7)))
    const q = p.map(([x, y]) => [x, y])
    riempi(q, P.acqua)
    riempi(q, 'rgba(97,151,148,0.4)')
  }

  // prima il giardino, poi il cortile: il cortile deve restare in ghiaia
  if (giardino) {
    riempi(giardino, '#8aa05f')
    g.save(); percorso(giardino); g.clip()
    const bb = bbox(giardino)
    g.globalAlpha = 0.4
    g.globalCompositeOperation = 'soft-light'
    g.drawImage(nuvola, 0, 0, lato, lato)
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    for (let k = 0; k < 600; k++) {
      const x = mescola(bb[0], bb[2], r()), y = mescola(bb[1], bb[3], r())
      g.fillStyle = rgba(r() < 0.55 ? '#6f8a4a' : '#9caa6c', 0.14 + r() * 0.22)
      g.beginPath(); g.arc(X(x), Y(y), px(0.4 + r() * 1.8), 0, 7); g.fill()
    }
    // le strisce della falciatura
    const R = Math.hypot(X(bb[2]) - X(bb[0]), Y(bb[3]) - Y(bb[1])) * 0.6
    g.save()
    g.translate(X((bb[0] + bb[2]) / 2), Y((bb[1] + bb[3]) / 2)); g.rotate(-28 * RAD)
    for (let d = -R; d <= R; d += px(3.4)) {
      g.fillStyle = ((d / px(3.4)) | 0) % 2 ? 'rgba(225,230,175,0.055)' : 'rgba(52,72,36,0.045)'
      g.fillRect(-R, d, R * 2, px(3.4))
    }
    g.restore()
    // aiuole: terra scura lungo il muro e qualche fiore
    for (const [x, y, w, h] of [[-16, -8, 10, 2.2], [-5, -10, 8, 1.8], [8, 7, 9, 1.6]]) {
      g.fillStyle = 'rgba(70,56,39,0.65)'
      g.beginPath(); g.roundRect(X(x), Y(y + h), px(w), px(h), px(0.6)); g.fill()
      for (let k = 0; k < 22; k++) {
        g.fillStyle = rgba(r() < 0.5 ? '#c65f68' : '#d9b349', 0.35 + r() * 0.4)
        g.beginPath(); g.arc(X(x + r() * w), Y(y + r() * h), px(0.12 + r() * 0.2), 0, 7); g.fill()
      }
    }
    // l'orto dietro casa: terra, filari, qualche zucca
    {
      const x0 = -17, y0 = 16, w = 13, h = 9
      g.fillStyle = 'rgba(74,58,40,0.75)'
      g.beginPath(); g.roundRect(X(x0), Y(y0 + h), px(w), px(h), px(0.7)); g.fill()
      g.strokeStyle = 'rgba(84,102,58,0.6)'; g.lineWidth = Math.max(1, px(0.6)); g.stroke()
      for (let yy = y0 + 1; yy < y0 + h - 0.5; yy += 1.15) {
        g.strokeStyle = 'rgba(48,39,27,0.4)'; g.lineWidth = Math.max(1, px(0.25))
        g.beginPath(); g.moveTo(X(x0 + 0.5), Y(yy)); g.lineTo(X(x0 + w - 0.5), Y(yy)); g.stroke()
        for (let xx = x0 + 0.8; xx < x0 + w - 0.5; xx += 0.8) {
          g.fillStyle = rgba(r() < 0.5 ? '#5f7b3f' : '#78954d', 0.45 + r() * 0.35)
          g.beginPath(); g.arc(X(xx), Y(yy), px(0.22 + r() * 0.2), 0, 7); g.fill()
        }
      }
    }
    g.restore()
    bordo(giardino, 'rgba(76,96,54,0.28)', Math.max(1, px(0.5)))
  }
  // il cortile in ghiaia, il vialetto e la piazzola della fontana
  if (ghiaia) {
    riempi(ghiaia, '#b6a993')
    g.save(); percorso(ghiaia); g.clip()
    for (let k = 0; k < 4200; k++) {
      const bb = bbox(ghiaia)
      const x = mescola(bb[0], bb[2], r()), y = mescola(bb[1], bb[3], r())
      g.fillStyle = rgba(r() < 0.5 ? '#948874' : '#ddd2bf', 0.12 + r() * 0.42)
      g.fillRect(X(x), Y(y), 1 + r() * 2, 1 + r() * 2)
    }
    // macchie di terra e le ruotate che entrano in cortile
    for (let k = 0; k < 22; k++) {
      const bb = bbox(ghiaia), x = mescola(bb[0], bb[2], r()), y = mescola(bb[1], bb[3], r())
      g.fillStyle = rgba(r() < 0.5 ? '#8f826d' : '#c8bca7', 0.08 + r() * 0.1)
      g.beginPath(); g.ellipse(X(x), Y(y), px(1.5 + r() * 5), px(1 + r() * 3), r() * 3, 0, 7); g.fill()
    }
    g.strokeStyle = 'rgba(88,78,62,0.07)'; g.lineWidth = Math.max(1, px(0.26))
    g.beginPath(); g.moveTo(X(18), Y(20)); g.bezierCurveTo(X(16), Y(6), X(7), Y(-4), X(-1), Y(-14)); g.stroke()
    g.beginPath(); g.moveTo(X(16), Y(18)); g.bezierCurveTo(X(14), Y(5), X(5), Y(-4), X(-2), Y(-12)); g.stroke()
    g.restore()
    bordo(ghiaia, 'rgba(112,102,86,0.45)', Math.max(1.2, px(0.5)))
    // ghiaia anche intorno alla fontana, e un sentiero che la raggiunge
    g.fillStyle = '#b3a690'
    g.beginPath(); g.arc(X(-9.97), Y(-16.34), px(7.4), 0, 7); g.fill()
    g.strokeStyle = 'rgba(112,102,86,0.35)'; g.lineWidth = Math.max(1, px(0.5)); g.stroke()
    linea([[-2, -17], [-5.2, -17], [-7.4, -16.2]], '#b3a690', 2.4)
  }
  if (DATI.viale?.length > 1) {
    const v = [[17.7, 29.5], ...DATI.viale, [15.5, -22]]
    linea(v, 'rgba(128,116,98,0.5)', 4.8)
    linea(v, '#b6a993', 3.6)
    linea(v, 'rgba(232,224,205,0.22)', 0.6, 1, [2, 8])
  }

  // 3b · le case vicine: una piazzola, un po' d'ombra e il piede sul prato
  for (const e of DATI.edifici) {
    const p = senzaDup(e.p)
    if (p.length < 3) continue
    const bb = bbox(p), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2
    if (Math.hypot(cx, cy) > 190) continue
    const grande = p.map(([x, y]) => [cx + (x - cx) * 1.28, cy + (y - cy) * 1.28])
    g.fillStyle = 'rgba(178,170,152,0.42)'
    percorso(grande); g.fill()
    g.save()
    g.filter = 'blur(11px)'
    g.fillStyle = 'rgba(25,34,19,0.4)'
    percorso(p); g.fill()
    const ombra = p.map(([x, y]) => [x - 2.6, y + 1.8])
    g.filter = 'blur(16px)'
    g.fillStyle = 'rgba(25,34,19,0.33)'
    percorso(ombra); g.fill()
    g.restore()
  }
  // la casa e il capannone: un piede morbido, senza il quale sembrano incollati
  for (const k of ['casa', 'capannone']) {
    const p = DATI.case[k]?.impronta
    if (!p) continue
    g.save()
    g.filter = 'blur(15px)'
    g.fillStyle = 'rgba(25,34,19,0.38)'
    percorso(p); g.fill()
    g.filter = 'blur(20px)'
    g.fillStyle = 'rgba(25,34,19,0.42)'
    const ombra = p.map(([x, y]) => [x - 3.2, y + 2.2])
    percorso(ombra); g.fill()
    g.restore()
  }

  // il confine del lotto: un margine falciato e una traccia, discreti
  linea([...confine, confine[0]], 'rgba(177,177,128,0.55)', 0.8)
  linea([...confine, confine[0]], 'rgba(120,104,80,0.55)', 0.28)

  // 4 · le ombre/il piede degli alberi veri (il 3D li copre, ma sotto resta l'ombra)
  for (const a of alberi) {
    const cfg = TIPI_ALBERO[a.tipo] ?? TIPI_ALBERO.platano
    const rr = cfg.chioma * (a.s ?? 1)
    disegnaOmbra(a.x + rr * 0.42, a.y - rr * 0.3, rr * 0.95, rr * 0.62, 0.4)
  }
  // le siepi: solo un'ombra corta, non un nastro lungo che sembra una trave sul cortile
  for (const si of siepi) {
    if (!si.p || si.p.length < 2) continue
    for (let i = 0; i < si.p.length - 1; i++) {
      const a = si.p[i], b = si.p[i + 1]
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.4) continue
      g.save()
      g.translate(X(mx) + px(0.5), Y(my) + px(0.4)); g.rotate(-Math.atan2(b[1] - a[1], b[0] - a[0]))
      g.fillStyle = 'rgba(42,56,33,0.28)'
      g.beginPath(); g.ellipse(0, 0, px(L * 0.52), px((si.spessore ?? 1.2) * 0.72), 0, 0, 7); g.fill()
      g.restore()
    }
  }

  // 5 · la grana: sabbia, foglie, sassi, appena visibili
  g.globalAlpha = 0.24
  g.globalCompositeOperation = 'overlay'
  g.drawImage(grana(lontano ? 1024 : 2048, seed + 9), 0, 0, lato, lato)
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'

  return { canvas: c, lato, metri, scala: s }
}

// Il disegno della campagna lontana riusa le stesse regole, con meno dettagli.
export function creaTerrenoLontano() {
  return creaTerreno({ lato: 2048, metri: 3000, lontano: true, seed: 20261125 })
}
