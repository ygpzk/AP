// La vernice (9.11.2026, Alberto: «al click la vernice cola giù coprendo tutto di nero, si va a /deutschland/, e lì il
// telo nero scende via scoprendo la pagina»). Stessa estetica della colata della barra in alto (barra/barra.js, che non
// si tocca): una tela piccola, un pixel della tela = 4 px dello schermo, vernice nera con qualche goccia colorata sotto,
// la pancia in fondo, il riflesso a sinistra e l'ombra a destra. Una scena di circa un secondo che FINISCE: il
// requestAnimationFrame si ferma a copertura piena, e lo strato se ne va col cambio pagina (o quando la home si
// risveglia dalla cornice della musica, o tornando indietro dalla bfcache). Mai due colate insieme.
//
//   copri(url)   dalla home: lo strato sopra tutto (z-index 2147483000: sopra la barra, 80, e sotto l'iframe della cornice),
//                il fronte scende colonna per colonna con la molla e un ritardo 0–0,25 s, le gocce pendono sotto il
//                fronte; a copertura ≥ 92% ovunque si segna sessionStorage pzkko-vernice = adesso e si va a `url` con
//                vai() di suono/cornice.js (dentro la cornice, se la musica suona).
//   scopri()     in /deutschland/: il telo nero (.telo, già in pagina dal <head>) scende via: il nero resta SOTTO il
//                fronte con le gocce rovesciate che pendono dall'alto, il fronte va da 0 a H in ~0,8 s, poi il telo si
//                toglie e la chiave pure.
//   togli()      via lo strato della home, se c'è.
// Con prefers-reduced-motion: dissolvenze (.18 s a coprire, .25 s a scoprire), niente tela.
//
// Copiati da barra/barra.js: caso (r.36), P, NERO, COLORI, molla (r.100-103) e l'estetica di goccia() (r.130-147).
import { vai } from '/suono/cornice.js'

// il caso col seme (mulberry32): la colata è uguale a ogni visita — barra.js r.36
const caso = (seme) => () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
// barra.js r.100-103
const P = 4
const NERO = ['#0e0d0c', '#4a4640', '#0e0d0c'] // [la vernice, il riflesso, l'ombra]
const COLORI = [['#ffd400', '#fff3a6', '#c49a00'], ['#46ff7d', '#c9ffd9', '#1fb850'], ['#ff5a4a', '#ffc2bb', '#c22d1f'], ['#4aa8ff', '#c4e2ff', '#1f72c4']]
const molla = (k) => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2 // arriva, passa di poco e torna

export const CHIAVE = 'pzkko-vernice'
const Z = 2147483000
const RITARDO = 0.25 // s: il fronte parte a scaglioni, colonna per colonna
const COPRE = 0.75 // s: quanto ci mette una colonna a scendere (coprendo)
const SCOPRE = 0.8 // s: quanto ci mette il telo a scendere via (scoprendo)
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches
const clamp = (k) => Math.max(0, Math.min(1, k))

let strato = null, raf = 0, inCorso = false // (una colata alla volta, fra copri e scopri)

/** La tela a pixel grande quanto la finestra (un pixel = P px), stirata al 100%. */
function tela(dentro) {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.ceil(innerWidth / P)); cv.height = Math.max(1, Math.ceil(innerHeight / P))
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated'
  dentro.appendChild(cv)
  return cv
}

/** Il seme della scena: i ritardi delle colonne (a tratti, così il fronte scende a lingue) e le gocce (come barra.js:
 *  larghe 1–3, lunghe a modo loro, qualcuna colorata; le colorate sono più larghe e lunghe, se no sarebbero un puntino). */
function semina(N, seme) {
  const r = caso(seme), ritardo = new Float32Array(N), gocce = []
  for (let c = 0, s = r() * RITARDO; c < N; c++) { if (r() < 0.22) s = r() * RITARDO; ritardo[c] = s }
  for (let c = 1; c < N - 1;) {
    let w = r() < 0.28 ? 3 : r() < 0.6 ? 2 : 1, l = r() < 0.3 ? 7 + r() * 8 : 1.5 + r() * 4
    const tinta = r() < 0.13 ? COLORI[Math.floor(r() * COLORI.length)] : NERO
    if (tinta !== NERO) { w = Math.max(2, w); l = Math.max(l, 4.5) }
    gocce.push({ c, w, l, tinta })
    c += w + 1 + Math.floor(r() * 5)
  }
  return { ritardo, gocce }
}

/** Una goccia che pende sotto il fronte (l'estetica di barra.js goccia(): il menisco dove esce, la pancia in fondo, la
 *  punta, il riflesso a sinistra e l'ombra a destra). `cima` è la riga del fronte alla sua colonna, `k` quanto è cresciuta. */
function goccia(g, d, cima, k) {
  const l = Math.round(d.l * (k < 1 ? molla(k) : 1)), y1 = cima + l, [col, luce, ombra] = d.tinta
  if (l <= 0) return
  g.fillStyle = col
  if (d.tinta === NERO) g.fillRect(d.c - 1, Math.max(0, cima - 1), d.w + 2, 2) // dove esce dal fronte è più larga: il menisco
  g.fillRect(d.c, 0, d.w, y1 - 1)
  const pancia = l >= 7 && d.w > 1
  if (pancia) g.fillRect(d.c - 1, y1 - 5, d.w + 2, 3)
  if (d.w !== 2 || !pancia) g.fillRect(d.c + (d.w === 3 ? 1 : d.w === 2 ? d.c & 1 : 0), y1 - 1, 1, 1) // la punta
  if (d.w > 1 && l >= 4) {
    if (col !== ombra) { g.fillStyle = ombra; g.fillRect(d.c + d.w - 1, cima + 1, 1, l - 3) }
    g.fillStyle = luce
    g.fillRect(d.c, cima + 1, 1, Math.max(1, l - (pancia ? 6 : 4)))
    if (pancia) g.fillRect(d.c - 1, y1 - 5, 1, 2)
  }
}

/** La stessa goccia rovesciata: pende dall'alto dentro il nero, con la punta verso l'alto (il telo che scende via). */
function gocciaSu(g, d, base, k) {
  const l = Math.round(d.l * (k < 1 ? molla(k) : 1)), y0 = base - l, [col, luce, ombra] = d.tinta
  if (l <= 0) return
  g.fillStyle = col
  g.fillRect(d.c, y0 + 1, d.w, l)
  const pancia = l >= 7 && d.w > 1
  if (pancia) g.fillRect(d.c - 1, y0 + 2, d.w + 2, 3)
  if (d.w !== 2 || !pancia) g.fillRect(d.c + (d.w === 3 ? 1 : d.w === 2 ? d.c & 1 : 0), y0, 1, 1)
  if (d.w > 1 && l >= 4) {
    if (col !== ombra) { g.fillStyle = ombra; g.fillRect(d.c + d.w - 1, y0 + 2, 1, l - 3) }
    g.fillStyle = luce
    g.fillRect(d.c, y0 + (pancia ? 5 : 3), 1, Math.max(1, l - (pancia ? 6 : 4)))
  }
}

const segna = () => { try { sessionStorage.setItem(CHIAVE, String(Date.now())) } catch {} }
const dimentica = () => { try { sessionStorage.removeItem(CHIAVE) } catch {} }

/** Via lo strato della home (la cornice si è chiusa, o si è tornati indietro): si può ricolare. */
export function togli() {
  cancelAnimationFrame(raf); raf = 0
  if (strato) { strato.remove(); strato = null }
  inCorso = false
  document.dispatchEvent(new CustomEvent('pzkko-vernice-via'))
}

/** Dalla home: la vernice cola giù e copre tutto, poi si va a `url`. */
export function copri(url) {
  if (inCorso) return
  inCorso = true
  strato = document.createElement('div')
  strato.className = 'vernice'
  strato.setAttribute('aria-hidden', 'true')
  strato.style.cssText = `position:fixed;inset:0;z-index:${Z};overflow:hidden;pointer-events:auto;background:transparent`
  document.body.appendChild(strato)
  let andato = false
  const parti = () => { if (andato) return; andato = true; segna(); vai(url) }
  if (fermo()) {
    strato.style.cssText += `;background:${NERO[0]};opacity:0;transition:opacity .18s linear`
    requestAnimationFrame(() => { if (strato) strato.style.opacity = '1' })
    setTimeout(parti, 200)
    return
  }
  const cv = tela(strato), g = cv.getContext('2d')
  if (!g) { strato.style.background = NERO[0]; setTimeout(parti, 150); return }
  const N = cv.width, H = cv.height, { ritardo, gocce } = semina(N, 1911)
  const fronte = new Int16Array(N), kappa = new Float32Array(N)
  const nato = performance.now()
  const passo = (t) => {
    const eta = (t - nato) / 1000
    let pieno = true
    for (let c = 0; c < N; c++) { const k = clamp((eta - ritardo[c]) / COPRE); kappa[c] = k; fronte[c] = Math.round(H * (k < 1 ? molla(k) : 1)); if (k < 1) pieno = false }
    g.clearRect(0, 0, N, H)
    for (const d of gocce) if (d.tinta !== NERO) goccia(g, d, fronte[d.c], kappa[d.c]) // le colorate stanno sotto la nera
    g.fillStyle = NERO[0]
    for (let c = 0; c < N; c++) if (fronte[c] > 0) g.fillRect(c, 0, 1, fronte[c])
    for (const d of gocce) if (d.tinta === NERO) goccia(g, d, fronte[d.c], kappa[d.c])
    if (!andato && eta >= RITARDO + 0.92 * COPRE) parti()
    if (pieno) { strato.style.background = NERO[0]; raf = 0; return } // tutto nero: qui si ferma
    raf = requestAnimationFrame(passo)
  }
  raf = requestAnimationFrame(passo)
}

/** In /deutschland/: il telo nero scende via e scopre la pagina. */
export function scopri() {
  const telo = document.querySelector('.telo')
  if (!telo) return
  if (document.documentElement.classList.contains('senza-telo') || inCorso) { telo.remove(); dimentica(); return }
  inCorso = true
  const fine = () => { telo.remove(); dimentica(); inCorso = false; raf = 0; document.dispatchEvent(new CustomEvent('pzkko-vernice-via')) }
  if (fermo()) {
    telo.style.transition = 'opacity .25s linear'
    requestAnimationFrame(() => { telo.style.opacity = '0' })
    setTimeout(fine, 300)
    return
  }
  const cv = tela(telo), g = cv.getContext('2d')
  if (!g) return fine()
  const N = cv.width, H = cv.height, { ritardo, gocce } = semina(N, 1911)
  const fronte = new Int16Array(N), kappa = new Float32Array(N)
  let nato = 0
  const passo = (t) => {
    if (!nato) { nato = t; telo.style.background = 'transparent' } // (il primo fotogramma è tutto nero come il telo: nessun lampo)
    const eta = (t - nato) / 1000
    let via = true
    for (let c = 0; c < N; c++) { const k = clamp((eta - ritardo[c]) / SCOPRE); kappa[c] = k; fronte[c] = Math.round(H * k ** 1.7); if (k < 1) via = false }
    g.clearRect(0, 0, N, H)
    for (const d of gocce) if (d.tinta !== NERO) gocciaSu(g, d, fronte[d.c], kappa[d.c])
    g.fillStyle = NERO[0]
    for (let c = 0; c < N; c++) if (fronte[c] < H) g.fillRect(c, fronte[c], 1, H - fronte[c])
    for (const d of gocce) if (d.tinta === NERO) gocciaSu(g, d, fronte[d.c], kappa[d.c])
    if (via) return fine()
    raf = requestAnimationFrame(passo)
  }
  // il primo fotogramma subito (tutto nero), così il telo può diventare trasparente senza lampi
  g.fillStyle = NERO[0]; g.fillRect(0, 0, N, H)
  raf = requestAnimationFrame(passo)
}

// la home si risveglia (la cornice della musica si è chiusa) o si torna indietro dalla cache: via lo strato
document.addEventListener('pzkko-altrove', (e) => { if (e.detail === false) togli() })
addEventListener('pageshow', (e) => { if (e.persisted) togli() })
