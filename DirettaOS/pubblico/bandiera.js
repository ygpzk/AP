// Diretta OS: la bandiera appesa al muro. Una bandiera del catalogo (bandiere.js) fatta di stoffa: la trama 4K di
// tessuto-4k.jpg (strumenti/tessuto.mjs), le pieghe leggere di quando era piegata, le grinze tirate dallo scotch ai
// quattro angoli, l'orlo cucito. Sul muro prende la luce vera della stanza, studiata sulla foto (riferimenti/<lente>.jpg):
//   - quanta luce e di che colore: quella del muro proprio lì dietro (la media dei punti di muro vicini, senza la tv, le
//     persone e le cose davanti), così una striscia bianca viene del colore del muro accanto;
//   - da dove arriva: un punto luce che spiega com'è chiaro il muro (più chiaro vicino, più scuro lontano), e da lì il
//     lato delle pieghe che si illumina, il lucido della stoffa e da che parte cade l'ombrina sul muro.
// Si disegna una volta sola (una tela ferma), di nuovo solo quando la sposti, la cambi o cambia la foto della stanza.
import { bandieraDi, PRIMA } from '/bandiere.js'
import { porta, sulPiano, scalaIn } from '/muri.js'

export const LARGO = 900 // la bandiera, in pixel del pezzo (alta quanto vogliono le sue proporzioni)
export const BORDO = 44 // attorno: lo scotch che esce e l'ombra
const MURO = 0.8 // quanto riflette il muro (bianco): la luce che arriva lì = il muro nella foto / 0.8
const STOFFA = 0.84 // quanto riflette il bianco della bandiera
const MM = 1.3 // millimetri per pixel del pezzo quando la bandiera non è su un muro (larga 1,2 m)

// sRGB ↔ lineare (la luce si somma e si moltiplica in lineare)
const LIN = new Float32Array(256)
for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const SRGB = new Uint8ClampedArray(4096)
for (let i = 0; i < 4096; i++) { const c = i / 4095; SRGB[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)) }
const enc = (x) => SRGB[x >= 1 ? 4095 : x <= 0 ? 0 : (x * 4095) | 0]
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const tela2d = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })] }
const dormi = () => new Promise((r) => setTimeout(r, 0))
// vettori
const pd = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const meno = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const vett = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const uno = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l) }

const B = { box: null, tela: null, ricolloca: null, id: PRIMA, muro: null, chiave: '', vuole: false, gira: false, fatto: 0 }
export const bandieraLuce = () => B.studio && { ...B.studio, ms: B.ms, tempi: B.tempi }
window.__bandieraLuce = bandieraLuce // (la regia la legge dall'anteprima per dire da dove arriva la luce)

export function creaBandiera(ricolloca) {
  const box = document.createElement('div')
  box.className = 'bandiera'
  const tela = document.createElement('canvas')
  box.append(tela)
  Object.assign(B, { box, tela, ricolloca })
  misura()
  ridisegna() // (si disegna quando sa dove sta: il pezzo chiama bandieraMuro appena va a posto)
  return box
}
function misura() {
  const b = bandieraDi(B.id), w = LARGO + 2 * BORDO, h = Math.round(LARGO / b.r) + 2 * BORDO
  for (const e of [B.box, B.tela]) { e.style.width = `${w}px`; e.style.height = `${h}px` }
}
// lo stato del server: quale bandiera
export function bandieraArriva(s) {
  const id = bandieraDi(s?.bandiera).id
  if (id === B.id) return
  B.id = id
  misura()
  B.ricolloca?.() // (cambia l'altezza: il pezzo si rimette a posto, e da lì richiama bandieraMuro)
  ridisegna()
}
// dove sta: sul muro { pi, q, G, w, h, img } (la parete, il punto, la matrice, la foto della stanza), o in aria (null)
export function bandieraMuro(x) { B.muro = x; ridisegna() }

// ── il disegno: uno alla volta, al massimo otto al secondo mentre la trascini ──
function ridisegna() {
  B.vuole = true
  if (B.gira) return
  B.gira = true
  ;(async () => {
    try {
      while (B.vuole) {
        B.vuole = false
        // (sempre un attimo dopo: intanto il pezzo è andato al suo posto, e i cambi di fila diventano uno)
        await new Promise((r) => setTimeout(r, Math.max(16, 120 - (performance.now() - B.fatto))))
        const t0 = performance.now()
        await disegna()
        B.fatto = performance.now(); B.ms = Math.round(B.fatto - t0) // (quanto ci ha messo l'ultimo disegno: __bandieraLuce().ms)
      }
    } catch (e) { console.warn('bandiera:', e) } finally { B.gira = false }
  })()
}

// ── le cose che servono, tenute da parte finché non cambiano ──
const cache = { svg: '', svgDati: null, tess: null, tessN: 0, tessDati: null, nastro: '', nastroDati: null, pieghe: '', pieghePronte: null }
let tessutoBlob = null
async function tessuto(n) { // la trama 4K, ricampionata (bene) a n × n
  if (cache.tessN === n && cache.tessDati) return cache.tessDati
  tessutoBlob ??= await fetch('/tessuto-4k.jpg').then((r) => (r.ok ? r.blob() : null)).catch(() => null)
  const g = new Float32Array(n * n)
  if (tessutoBlob) {
    const bm = await createImageBitmap(tessutoBlob, { resizeWidth: n, resizeHeight: n, resizeQuality: 'high' })
    const [, cx] = tela2d(n, n)
    cx.drawImage(bm, 0, 0); bm.close()
    const d = cx.getImageData(0, 0, n, n).data
    for (let i = 0; i < n * n; i++) g[i] = d[i * 4] / 255
  } else g.fill(0.6)
  // quanto si vede: la trama deve muovere la stoffa di un 5% (più fine è, più si appiattisce: la si rialza)
  let m = 0, v = 0
  for (let i = 0; i < g.length; i += 7) m += g[i]
  m /= Math.ceil(g.length / 7)
  for (let i = 0; i < g.length; i += 7) v += (g[i] - m) ** 2
  const k = Math.min(1.8, 0.055 / (Math.sqrt(v / Math.ceil(g.length / 7)) || 1))
  for (let i = 0; i < g.length; i++) g[i] = 1 + (g[i] - m) * k
  cache.tessN = n; cache.tessDati = g
  return g
}
async function colori(b, fw, fh, W, H, ox, oy) { // la bandiera piatta, coi suoi colori, nella tela W × H
  const k = `${b.id}:${fw}:${fh}:${W}:${H}`
  if (cache.svg === k) return cache.svgDati
  const testo = b.svg.replace(/width="[\d.]+" height="[\d.]+">/, `width="${fw}" height="${fh}" preserveAspectRatio="none">`)
  const url = URL.createObjectURL(new Blob([testo], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const [, cx] = tela2d(W, H)
    cx.drawImage(img, ox, oy, fw, fh)
    cache.svg = k; cache.svgDati = cx.getImageData(0, 0, W, H).data
    return cache.svgDati
  } finally { URL.revokeObjectURL(url) }
}
// lo scotch di carta sui quattro angoli: un pezzetto di traverso, strappato ai due capi
function nastro(W, H, ox, oy, fw, fh, pmm) {
  const k = `${W}:${H}:${fw}:${fh}:${pmm.toFixed(3)}`
  if (cache.nastro === k) return cache.nastroDati
  const [, cx] = tela2d(W, H)
  const L = 66 / pmm, A = 21 / pmm // 66 × 21 mm
  const angoli = [[ox, oy, -45], [ox + fw, oy, 45], [ox + fw, oy + fh, -45], [ox, oy + fh, 45]]
  angoli.forEach(([x, y, g], n) => {
    cx.save()
    // un po' dentro la bandiera, girato quasi a 45°, ognuno un filo diverso
    const dx = x === ox ? 1 : -1, dy = y === oy ? 1 : -1
    cx.translate(x + dx * 7 / pmm, y + dy * 7 / pmm)
    cx.rotate((g + (n % 2 ? 4 : -3)) * Math.PI / 180)
    cx.beginPath()
    const denti = 7
    cx.moveTo(-L / 2, -A / 2)
    cx.lineTo(L / 2, -A / 2)
    for (let i = 1; i <= denti; i++) cx.lineTo(L / 2 + ((i + n) % 2 ? 1.6 : -0.6) / pmm, -A / 2 + A * i / denti)
    cx.lineTo(-L / 2, A / 2)
    for (let i = 1; i <= denti; i++) cx.lineTo(-L / 2 + ((i + n) % 2 ? -1.4 : 0.7) / pmm, A / 2 - A * i / denti)
    cx.closePath()
    cx.fillStyle = '#fff'
    cx.fill()
    cx.restore()
  })
  const d = cx.getImageData(0, 0, W, H).data, a = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3] / 255
  cache.nastro = k; cache.nastroDati = a
  return a
}
// le pieghe: l'altezza della stoffa sul muro (millimetri), poi la pendenza in ogni punto
async function pieghe(W, H, ox, oy, fw, fh, pmm) {
  const k = `${W}:${H}:${fw}:${fh}:${pmm.toFixed(3)}`
  if (cache.pieghe === k) return cache.pieghePronte
  const Wm = fw * pmm, Hm = fh * pmm, alto = new Float32Array(W * H)
  const fan = [[0, 0], [Wm, 0], [Wm, Hm], [0, Hm]].map(([x, y], n) => [x, y, Math.atan2(Hm / 2 - y, Wm / 2 - x), n * 1.7])
  const punto = Math.max(0.9, pmm * 0.8) // (le cuciture non più fini di un pixel)
  const raggio = Wm * 0.32
  // (quello che dipende solo dalla colonna o solo dalla riga si calcola una volta: per pixel restano somme)
  const Xs = Float32Array.from({ length: W }, (_, i) => (i + 0.5 - ox) * pmm)
  const yc = [1, 2].map((n) => Xs.map((X) => Hm * n / 3 + 2 * Math.sin(X / 97 + n * 0.7)))
  const ya = [1, 2].map((n) => Xs.map((X) => (n % 2 ? 1 : -1) * 1.0 * (0.6 + 0.4 * Math.sin(X / 170 + n * 1.3))))
  const sx1 = Xs.map((X) => Math.sin(X / 97 + 1.3)), sx2 = Xs.map((X) => Math.sin(X / 53)), cx2 = Xs.map((X) => Math.cos(X / 53))
  for (let j = 0; j < H; j++) {
    if (j % 64 === 63) await dormi() // (a pezzi: la diretta non salta fotogrammi)
    const Y = (j + 0.5 - oy) * pmm
    if (Y < -2 || Y > Hm + 2) continue
    // le pieghe di quando stava piegata: in piedi a un quarto, metà, tre quarti; di traverso a un terzo e due terzi.
    // Monte e valle si alternano, una piega è una riga netta che sfuma
    const xc = [1, 2, 3].map((n) => Wm * n / 4 + 2.2 * Math.sin(Y / 83 + n * 1.9))
    const xa = [1, 2, 3].map((n) => (n % 2 ? -1 : 1) * (n === 2 ? 1.3 : 0.85) * (0.65 + 0.35 * Math.sin(Y / 140 + n * 2.3)))
    const sy1 = 0.9 * Math.sin(Y / 131 + 0.4), sy2 = Math.sin(Y / 71 + 2.1), cy2 = Math.cos(Y / 71 + 2.1)
    for (let i = 0; i < W; i++) {
      const X = Xs[i]
      if (X < -2 || X > Wm + 2) continue
      let h = 0
      for (let n = 0; n < 3; n++) { const d = Math.abs(X - xc[n]); if (d < 45) h += xa[n] * Math.exp(-d / 6) }
      for (let n = 0; n < 2; n++) { const d = Math.abs(Y - yc[n][i]); if (d < 45) h += ya[n][i] * Math.exp(-d / 6) }
      // le grinze tirate dallo scotch: a ventaglio dall'angolo verso il centro
      for (let n = 0; n < 4; n++) {
        const [cx, cy, t0, f] = fan[n], dx = X - cx, dy = Y - cy
        if (Math.abs(dx) > raggio || Math.abs(dy) > raggio) continue
        const r = Math.sqrt(dx * dx + dy * dy)
        if (r > raggio || r < 10) continue
        let df = Math.atan2(dy, dx) - t0
        df -= Math.round(df / (2 * Math.PI)) * 2 * Math.PI
        if (Math.abs(df) > 1) continue
        h += 1.7 * Math.exp(-r / (Wm * 0.13) - (df / 0.42) ** 2) * ss(10, 45, r) * Math.sin(df * 17 + f)
      }
      // la stoffa che non sta piatta del tutto: onde larghe
      h += sx1[i] * sy1 + 0.5 * (sx2[i] * cy2 + cx2[i] * sy2)
      // l'orlo: la stoffa ripiegata (più alta) e la cucitura a puntini
      const bordo = Math.min(X, Y, Wm - X, Hm - Y)
      if (bordo < 14) {
        h += 0.32 * ss(12, 10, bordo)
        const lungo = bordo === X || bordo === Wm - X ? Y : X
        h -= 0.28 * Math.exp(-(((bordo - 7.5) / punto) ** 2)) * (lungo % 3.6 < 2.7 ? 1 : 0.25)
      }
      alto[j * W + i] = h
    }
  }
  // la pendenza (mm per mm), da cui la normale della stoffa; e quanto è in fondo a una piega (lì arriva meno luce
  // sparsa: le pieghe si vedono anche con la luce dritta davanti)
  const gx = new Float32Array(W * H), gy = new Float32Array(W * H), fondo = new Float32Array(W * H)
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    const p = j * W + i
    gx[p] = (alto[p + 1] - alto[p - 1]) / (2 * pmm)
    gy[p] = (alto[p + W] - alto[p - W]) / (2 * pmm)
    const lap = (alto[p + 1] + alto[p - 1] + alto[p + W] + alto[p - W] - 4 * alto[p]) / Math.max(1, pmm * pmm)
    fondo[p] = Math.min(0.3, Math.max(-0.12, lap * 1.4))
  }
  cache.pieghe = k; cache.pieghePronte = { gx, gy, fondo }
  return cache.pieghePronte
}

// ══ lo studio della luce, sulla foto della stanza ══
// La foto in piccolo (480 × 270), in lineare. Poi, per ogni muro: i punti di muro (in metri sul muro), il punto luce
// che li spiega meglio (E = A·h / (d² + h²)^1,5 + B: A la lampada, B la luce sparsa) e quali punti non sono muro.
const foto = { src: '', D: null, muri: new Map() }
function fotoDati(img) {
  if (foto.src === img.src && foto.D) return foto.D
  const W = 480, H = 270, [, cx] = tela2d(W, H)
  cx.drawImage(img, 0, 0, W, H)
  const d = cx.getImageData(0, 0, W, H).data, c = new Float32Array(W * H * 3)
  for (let i = 0; i < W * H; i++) { c[i * 3] = LIN[d[i * 4]]; c[i * 3 + 1] = LIN[d[i * 4 + 1]]; c[i * 3 + 2] = LIN[d[i * 4 + 2]] }
  foto.src = img.src; foto.D = { W, H, c }; foto.muri.clear()
  return foto.D
}
function fotoColore(D, x, y) {
  const fx = Math.min(D.W - 1.001, Math.max(0, x / 1920 * D.W - 0.5)), fy = Math.min(D.H - 1.001, Math.max(0, y / 1080 * D.H - 0.5))
  const x0 = fx | 0, y0 = fy | 0, u = fx - x0, v = fy - y0, o = [0, 0, 0]
  for (const [dx, dy, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) {
    const i = ((y0 + dy) * D.W + x0 + dx) * 3
    o[0] += D.c[i] * w; o[1] += D.c[i + 1] * w; o[2] += D.c[i + 2] * w
  }
  return o
}
const Y = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
// la cornice del muro: il centro, i due versi sul muro (a destra, in giù) e la normale verso la stanza
function cornice(pi) {
  const P0 = pi.X(0.5, 0.5)
  let n = uno(vett(pi.a, pi.b))
  if (pd(n, P0) > 0) n = n.map((v) => -v)
  return { P0, a: pi.a, b: pi.b, n }
}
const sulMuro = (fr, P) => { const d = meno(P, fr.P0); return [pd(d, fr.a), pd(d, fr.b)] }
async function studia(pi, D, chiave) {
  if (foto.muri.has(chiave)) return foto.muri.get(chiave)
  const fr = cornice(pi), punti = []
  const NU = 44, NV = 30
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const u = -0.1 + 1.2 * (i + 0.5) / NU, v = -0.1 + 1.2 * (j + 0.5) / NV, [x, y, w] = porta(pi.H, u, v)
    if (w <= 0 || x < 6 || x > 1914 || y < 6 || y > 1074) continue
    const c = fotoColore(D, x, y), [s, t] = sulMuro(fr, pi.X(u, v))
    punti.push({ s, t, c, y: Y(c), w: 1 })
  }
  let luce = null
  if (punti.length >= 40) {
    const smin = Math.min(...punti.map((p) => p.s)), smax = Math.max(...punti.map((p) => p.s)), tmin = Math.min(...punti.map((p) => p.t)), tmax = Math.max(...punti.map((p) => p.t))
    // (i punti buoni in tabelle piatte; l'errore viene dalle somme, senza ripassarli)
    let ps, pt, py, n0, sy, syy
    const tieni = () => {
      const b = punti.filter((p) => p.w)
      ps = Float64Array.from(b, (p) => p.s); pt = Float64Array.from(b, (p) => p.t); py = Float64Array.from(b, (p) => p.y)
      n0 = b.length; sy = py.reduce((x, y) => x + y, 0); syy = py.reduce((x, y) => x + y * y, 0)
    }
    const prova = (x0, y0, h) => {
      let a = 0, b = 0, d = 0
      const h2 = h * h
      for (let i = 0; i < n0; i++) {
        const r2 = (ps[i] - x0) ** 2 + (pt[i] - y0) ** 2 + h2, f = h / (r2 * Math.sqrt(r2))
        a += f * f; b += f; d += f * py[i]
      }
      const det = a * n0 - b * b
      let A = det ? (d * n0 - b * sy) / det : 0, Bs = det ? (a * sy - b * d) / det : sy / n0
      if (Bs < 0) { Bs = 0; A = d / a }
      if (A < 0) { A = 0; Bs = sy / n0 }
      const err = A * A * a + 2 * A * Bs * b - 2 * A * d + n0 * Bs * Bs - 2 * Bs * sy + syy
      return { x0, y0, h, A, B: Bs, err: err / n0 }
    }
    const passi = (a, b, s) => { const o = []; for (let x = a; x <= b + 1e-9; x += s) o.push(x); return o }
    for (let giro = 0; giro < 3; giro++) {
      tieni()
      let m = null
      for (const h of [0.35, 0.6, 0.9, 1.3, 1.8, 2.5, 3.5, 5]) {
        for (const x0 of passi(smin - 3, smax + 3, 0.5)) for (const y0 of passi(tmin - 3, tmax + 3, 0.5)) { const r = prova(x0, y0, h); if (!m || r.err < m.err) m = r }
        await dormi() // (un pezzo alla volta: la diretta non salta un fotogramma)
      }
      const c = m
      for (const h of passi(c.h * 0.7, c.h * 1.35, c.h * 0.05)) {
        for (const x0 of passi(c.x0 - 0.45, c.x0 + 0.45, 0.075)) for (const y0 of passi(c.y0 - 0.45, c.y0 + 0.45, 0.075)) { const r = prova(x0, y0, h); if (r.err < m.err) m = r }
        await dormi()
      }
      luce = m
      // via i punti che non sono muro (la tv, il cono, chi sta seduto): troppo lontani da come dovrebbe essere il muro
      const res = punti.map((p) => { const r2 = (p.s - m.x0) ** 2 + (p.t - m.y0) ** 2 + m.h * m.h; return p.y - (m.A * m.h / (r2 * Math.sqrt(r2)) + m.B) })
      const mad = res.map(Math.abs).sort((a, b) => a - b)[res.length >> 1] * 1.4826 || 0.01
      punti.forEach((p, i) => { p.w = Math.abs(res[i]) < 2.5 * mad ? 1 : 0 })
      await dormi()
    }
  }
  // il colore della luce: la media del muro (bianco: il colore che ha nella foto è quello della luce)
  let cr = [0, 0, 0], n = 0
  for (const p of punti) if (p.w && p.y > 0.002) { cr = cr.map((v, k) => v + p.c[k] / p.y); n++ }
  cr = n ? cr.map((v) => v / n) : [1, 1, 1]
  const r = { fr, punti: punti.filter((p) => p.w), luce, cr }
  foto.muri.set(chiave, r)
  return r
}
// la luce in un punto del muro: la media del muro lì attorno (20 cm), e dove di muro non se ne vede, il punto luce
function luceIn(S, s, t) {
  let w = 0, c = [0, 0, 0]
  const s2 = 2 * 0.2 * 0.2
  for (const p of S.punti) {
    const d2 = (p.s - s) ** 2 + (p.t - t) ** 2
    if (d2 > 9 * s2) continue
    const k = Math.exp(-d2 / s2)
    w += k; c[0] += p.c[0] * k; c[1] += p.c[1] * k; c[2] += p.c[2] * k
  }
  const L = S.luce
  const m = L ? L.A * L.h / (((s - L.x0) ** 2 + (t - L.y0) ** 2 + L.h ** 2) ** 1.5) + L.B : 0.18
  const k0 = 1.5 // (quanto conta il punto luce quando di muro ce n'è poco)
  return c.map((v, i) => (v + m * S.cr[i] * k0) / (w + k0) / MURO)
}

// ══ il disegno ══
async function disegna() {
  const b = bandieraDi(B.id), m = B.muro, fw0 = LARGO, fh0 = Math.round(LARGO / b.r), w = fw0 + 2 * BORDO, h = fh0 + 2 * BORDO
  // quanti pixel veri: quanto è grande in onda, un po' di più (sul muro) o la scala del posto (in aria)
  let k
  if (m) k = scalaIn(m.G, m.w / 2, m.h / 2) * 1.35
  else { const t = B.box.closest('.pezzo')?.style.transform ?? '', s = +(t.match(/scale\(([\d.]+)\)/)?.[1] ?? 1); k = s * 1.2 }
  k = Math.round(Math.min(1.6, Math.max(0.22, k)) * 40) / 40
  const pmm = (m ? m.q.s || 1 : MM) / k // millimetri di stoffa per pixel della tela
  const chiave = [b.id, k, m ? [m.q.u, m.q.v, m.q.s, m.q.r, m.pi.H.map((x) => x.toFixed(5)).join(','), m.img?.src ?? ''].join('|') : 'aria'].join('#')
  if (chiave === B.chiave) return
  const W = Math.round(w * k), H = Math.round(h * k), ox = Math.round(BORDO * k), oy = ox, fw = Math.round(fw0 * k), fh = Math.round(fh0 * k)
  const T = [performance.now()] // (i tempi di ogni passo: __bandieraLuce().tempi)
  const col = await colori(b, fw, fh, W, H, ox, oy)
  T.push(performance.now())
  const tex = await tessuto(fw)
  T.push(performance.now())
  const nas = m ? nastro(W, H, ox, oy, fw, fh, pmm) : null
  const { gx, gy, fondo } = await pieghe(W, H, ox, oy, fw, fh, pmm)
  if (B.muro !== m || B.id !== b.id) return // (cambiata intanto: ricomincia il giro)
  T.push(performance.now())

  // la luce: una griglia sul pezzo (quanta e di che colore), da dove arriva, da dove guarda il telefono
  const GX = 15, GY = 11, E = new Float32Array(GX * GY * 3)
  let Ld = uno([-0.35, -0.5, 1]), V = [0, 0, 1], kd = 0.6, ombra = [0, 0], forza = 0
  if (m && m.img) {
    const D = fotoDati(m.img), cm = `${m.img.src}|${m.pi.H.join(',')}`
    const S = await studia(m.pi, D, cm)
    if (B.muro !== m) return // (spostata intanto: ricomincia il giro)
    T.push(performance.now())
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      const [x, y] = porta(m.G, i / (GX - 1) * w, j / (GY - 1) * h), [u, v] = sulPiano(m.pi, x, y), [s, t] = sulMuro(S.fr, m.pi.X(u, v))
      const e = luceIn(S, s, t)
      E.set(e.map((x) => Math.min(1.6, x)), (j * GX + i) * 3)
    }
    // il verso della luce sulla bandiera (x a destra, y in giù, z fuori dal muro), girato come il pezzo
    const [sc, tc] = sulMuro(S.fr, m.pi.X(m.q.u, m.q.v)), r = (m.q.r || 0) * Math.PI / 180
    const giraXY = (a, bb) => [a * Math.cos(r) + bb * Math.sin(r), -a * Math.sin(r) + bb * Math.cos(r)]
    if (S.luce) {
      // dalla bandiera al punto luce; in più un filo dall'alto, come le lampade di una stanza (il muro da solo non dice
      // se la luce è più su o più giù quando è dritta davanti: lì le pieghe non avrebbero un lato in ombra)
      const L = S.luce, [lx, ly] = giraXY((L.x0 - sc) / L.h, (L.y0 - tc) / L.h - 0.45)
      Ld = uno([lx, ly, 1])
      const d2 = (sc - L.x0) ** 2 + (tc - L.y0) ** 2 + L.h ** 2, dir = L.A * L.h / (d2 ** 1.5)
      kd = Math.min(0.85, Math.max(0.4, dir / (dir + L.B || 1)))
    }
    const Pc = m.pi.X(m.q.u, m.q.v), Vw = uno(Pc.map((x) => -x)), [vx, vy] = giraXY(pd(Vw, S.fr.a), pd(Vw, S.fr.b))
    V = uno([vx, vy, pd(Vw, S.fr.n)])
    // l'ombrina: la stoffa sta 3 mm sopra il muro, l'ombra cade dalla parte opposta alla luce
    const alza = 3 / pmm, z = Math.max(0.25, Ld[2])
    ombra = [-Ld[0] / z * alza, -Ld[1] / z * alza]
    forza = 0.3 * kd
    B.studio = { luce: S.luce, kd, verso: Ld, colore: S.cr, punti: S.punti.length }
  } else {
    const e = m ? [0.62, 0.6, 0.57] : [0.9, 0.9, 0.9] // (sul muro ma senza foto: una luce qualsiasi)
    for (let i = 0; i < GX * GY; i++) E.set(e, i * 3)
  }
  const ka = 1 - kd, piatta = ka + kd * Ld[2]
  const Hh = uno([Ld[0] + V[0], Ld[1] + V[1], Ld[2] + V[2]]), luccica = 0.03 // (il lucido del poliestere, poco)
  const tape = [LIN[233] * 0.97, LIN[222] * 0.97, LIN[196] * 0.97]

  const out = new ImageData(W, H), o = out.data
  const sb = Math.max(1.2, 2.5 / pmm), alone = 3 / pmm // (quanto è sfumata l'ombrina; il buio stretto attorno, dove la stoffa tocca il muro)
  // i bordi fra uno scotch e l'altro non sono dritti: in alto la stoffa cala un po', ai lati e in basso tira verso
  // dentro (millimetri a metà lato → pixel)
  const cala = 4 / pmm, tira = 2.2 / pmm, suGiu = 1.8 / pmm
  const dentroX = Float32Array.from({ length: W }, (_, i) => Math.sin(Math.PI * Math.min(1, Math.max(0, (i + 0.5 - ox) / fw))))
  // quanto un punto è fuori dalla bandiera (pixel; dentro: negativo)
  const fuoriDa = (X, Yy) => {
    const dx = Math.max(ox - X, X - (ox + fw), 0), dy = Math.max(oy - Yy, Yy - (oy + fh), 0)
    return Math.hypot(dx, dy) - (dx === 0 && dy === 0 ? Math.min(X - ox, ox + fw - X, Yy - oy, oy + fh - Yy) : 0)
  }
  for (let j = 0; j < H; j++) {
    if (j % 48 === 47) { await dormi(); if (B.muro !== m || B.id !== b.id) return }
    const gyf = j / (H - 1) * (GY - 1), j0 = Math.min(GY - 2, gyf | 0), fy = gyf - j0
    const sy = Math.sin(Math.PI * Math.min(1, Math.max(0, (j + 0.5 - oy) / fh))), lato = tira * sy
    for (let i = 0; i < W; i++) {
      const p = j * W + i, q = p * 4
      // la luce qui (bilineare sulla griglia)
      const gxf = i / (W - 1) * (GX - 1), i0 = Math.min(GX - 2, gxf | 0), fx = gxf - i0
      const a00 = (j0 * GX + i0) * 3, a10 = a00 + 3, a01 = a00 + GX * 3, a11 = a01 + 3
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy
      const Er = E[a00] * w00 + E[a10] * w10 + E[a01] * w01 + E[a11] * w11
      const Eg = E[a00 + 1] * w00 + E[a10 + 1] * w10 + E[a01 + 1] * w01 + E[a11 + 1] * w11
      const Eb = E[a00 + 2] * w00 + E[a10 + 2] * w10 + E[a01 + 2] * w01 + E[a11 + 2] * w11
      let R = 0, G = 0, Bl = 0, A = 0
      // l'ombrina sul muro (fuori dalla bandiera), dalla parte opposta alla luce, e un filo di buio tutto attorno
      if (forza > 0) {
        const a1 = forza * (1 - ss(-sb, sb, fuoriDa(i + 0.5 - ombra[0], j + 0.5 - ombra[1])))
        const f0 = fuoriDa(i + 0.5, j + 0.5), a2 = f0 > -1 ? 0.13 * Math.exp(-Math.max(0, f0) / alone) : 0
        const a = 1 - (1 - a1) * (1 - a2)
        if (a > 0.002) A = 1 - (1 - a) ** (1 / 2.2) // (il nero sopra la webcam si mescola in sRGB: questo toglie «a» di luce vera)
      }
      // la stoffa (coi bordi un po' tirati: quanto è dentro dal bordo vero, in pixel)
      let cf = col[q + 3] / 255
      if (cf > 0 && m) {
        const X = i + 0.5 - ox, Yy = j + 0.5 - oy, sx = dentroX[i]
        const d = Math.min(X - lato, fw - X - lato, Yy - cala * sx ** 1.5, fh - Yy - suGiu * sx)
        cf *= Math.min(1, Math.max(0, d + 0.5))
      }
      if (cf > 0) {
        const nx = -gx[p], ny = -gy[p], nl = 1 / Math.sqrt(nx * nx + ny * ny + 1)
        const NL = (nx * Ld[0] + ny * Ld[1] + Ld[2]) * nl, NH = (nx * Hh[0] + ny * Hh[1] + Hh[2]) * nl
        const sh = (ka * (1 - fondo[p]) + kd * Math.max(0, NL)) / piatta
        const lu = luccica * Math.max(0, NH) ** 28
        const t = tex[(((j - oy) % fw + fw) % fw) * fw + (((i - ox) % fw + fw) % fw)] ?? 1
        const k1 = STOFFA * t * sh
        const fr = LIN[col[q]] * k1 + lu, fg = LIN[col[q + 1]] * k1 + lu, fb = LIN[col[q + 2]] * k1 + lu
        R = fr * Er * cf + R * (1 - cf); G = fg * Eg * cf + G * (1 - cf); Bl = fb * Eb * cf + Bl * (1 - cf); A = cf + A * (1 - cf)
      }
      // lo scotch, sopra a tutto: un filo trasparente (la stoffa si intravede)
      if (nas && nas[p] > 0) {
        const ta = nas[p] * 0.94, gr = 1 + 0.6 * (tex[(j % fw) * fw + (i * 7) % fw] - 1) // (la carta: fibre stirate)
        R = tape[0] * gr * Er * ta + R * (1 - ta); G = tape[1] * gr * Eg * ta + G * (1 - ta); Bl = tape[2] * gr * Eb * ta + Bl * (1 - ta); A = ta + A * (1 - ta)
      }
      if (A > 0.001) {
        // (R, G, B sono già moltiplicati per la copertura: si dividono prima di tornare in sRGB)
        o[q] = enc(R / A); o[q + 1] = enc(G / A); o[q + 2] = enc(Bl / A); o[q + 3] = Math.round(A * 255)
      }
    }
  }
  if (B.tela.width !== W || B.tela.height !== H) { B.tela.width = W; B.tela.height = H }
  B.tela.getContext('2d').putImageData(out, 0, 0)
  T.push(performance.now())
  B.tempi = { W, H, passi: T.slice(1).map((t, i) => Math.round(t - T[i])) } // colori, tessuto, pieghe, (studio), disegno
  B.chiave = chiave
}
