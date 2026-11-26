// Diretta OS · la natura delle scene in pixel art: alberi (con la chioma della stagione), pini, pioppi della pianura,
// cespugli, ciuffi d'erba, funghi, sassi. Tutto disegnato a macchie, col lato in ombra in basso a destra.

import { R, linea, ellisse, CHIOME, mescola, scurisci, schiarisci } from './pixel.js'

// la chioma: tante macchie, prima l'ombra, poi il colore, poi la luce in alto a sinistra
export function chioma(g, r, cx, cy, rx, ry, cols, fitta = 1) {
  const n = Math.max(4, Math.round(((rx * ry) / 16) * fitta))
  const macchia = (dx, dy, s, col) => ellisse(g, cx + dx, cy + dy, Math.max(2, Math.round(s * (0.7 + r() * 0.6))), Math.max(2, Math.round(s * 0.75 * (0.7 + r() * 0.6))), col)
  const punto = (k) => { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * k; return [Math.cos(a) * rx * d, Math.sin(a) * ry * d] }
  for (let i = 0; i < n; i++) { const [x, y] = punto(0.85); macchia(x + 1, y + 2, 6, cols[0]) }
  for (let i = 0; i < n; i++) { const [x, y] = punto(0.78); macchia(x, y, 5.5, cols[1]) }
  for (let i = 0; i < n * 0.6; i++) { const [x, y] = punto(0.6); if (x + y < rx * 0.25) macchia(x - 1, y - 1, 4, cols[2]) }
  // i bordi frastagliati, a pixel
  for (let i = 0; i < n * 3; i++) { const a = r() * Math.PI * 2; R(g, cx + Math.cos(a) * rx * (0.85 + r() * 0.2), cy + Math.sin(a) * ry * (0.85 + r() * 0.2), 1 + (r() < 0.4), 1 + (r() < 0.4), cols[r() < 0.5 ? 0 : 1]) }
  if (cols[3]) for (let i = 0; i < n * 1.5; i++) { const [x, y] = punto(0.85); R(g, cx + x, cy + y, 1, 1, cols[3]) } // fiori, o neve
}
// i rami nudi d'inverno, che si dividono
export function rami(g, r, x, y, lungo, ang, spesso, col) {
  if (lungo < 3 || spesso < 1) return
  const x2 = x + Math.cos(ang) * lungo, y2 = y + Math.sin(ang) * lungo
  linea(g, x, y, x2, y2, Math.max(1, Math.round(spesso)), col)
  rami(g, r, x2, y2, lungo * (0.62 + r() * 0.15), ang - 0.45 - r() * 0.3, spesso * 0.65, col)
  rami(g, r, x2, y2, lungo * (0.62 + r() * 0.15), ang + 0.45 + r() * 0.3, spesso * 0.65, col)
}
// un tronco con la corteccia
export function tronco(g, r, x, yTop, yBase, w, col) {
  const scuro = scurisci(col, 0.35), chiaro = schiarisci(col, 0.12)
  R(g, x - w / 2, yTop, w, yBase - yTop, col)
  R(g, x + w / 2 - Math.max(2, w / 3), yTop, Math.max(2, w / 3), yBase - yTop, scuro)
  R(g, x - w / 2, yTop, 1, yBase - yTop, chiaro)
  for (let i = 0; i < (yBase - yTop) * w / 14; i++) R(g, x - w / 2 + 1 + r() * (w - 2), yTop + r() * (yBase - yTop), 1, 2 + r() * 4, scuro)
  // le radici
  if (w >= 6) for (const s of [-1, 1]) { linea(g, x + s * w / 2, yBase - 4, x + s * (w / 2 + 5), yBase, 3, col); linea(g, x + s * w / 2, yBase - 3, x + s * (w / 2 + 3), yBase, 2, s > 0 ? scuro : col) }
}
// un albero a foglie (d'inverno rami nudi; con la neve, i rami bianchi)
export function albero(g, r, x, yBase, alto, largo, stagione, neve = false, nebbia = 0, cielo = null) {
  const sfuma = (c) => (nebbia && cielo ? mescola(c, cielo, nebbia) : c)
  const legno = sfuma('#4a3627')
  const wt = Math.max(2, Math.round(largo / 6))
  tronco(g, r, x, yBase - alto * 0.62, yBase, wt, legno)
  if (stagione === 'inverno') {
    rami(g, r, x, yBase - alto * 0.6, alto * 0.28, -Math.PI / 2 - 0.3, wt * 0.7, legno)
    rami(g, r, x, yBase - alto * 0.62, alto * 0.3, -Math.PI / 2 + 0.35, wt * 0.7, legno)
    if (neve) for (let i = 0; i < largo; i++) R(g, x - largo / 2 + r() * largo, yBase - alto + r() * alto * 0.5, 2, 1, '#f2f6fb')
    return
  }
  let cols = CHIOME[stagione]
  if (stagione === 'autunno') { const k = r(); cols = k < 0.33 ? ['#7a3315', '#b04a1a', '#d9752a'] : k < 0.66 ? ['#9a5a12', '#cf8b23', '#ecbd45'] : ['#5a5a1e', '#86802a', '#b8a43a'] }
  cols = cols.map(sfuma)
  if (neve) cols = [cols[0], cols[1], cols[2], '#f2f6fb']
  chioma(g, r, x, yBase - alto * 0.72, largo / 2, alto * 0.32, cols)
}
// un pino (le file lontane del bosco)
export function pino(g, x, yBase, alto, col, scuro) {
  for (let i = 0; i < alto; i++) {
    const k = i / alto, w = Math.round((1 - k) * alto * 0.36 * (0.75 + 0.25 * Math.abs(Math.sin(i * 1.7))))
    R(g, x - w, yBase - i, w * 2 + 1, 1, col)
    if (scuro) R(g, x + Math.ceil(w * 0.3), yBase - i, Math.max(0, Math.floor(w * 0.7)) + 1, 1, scuro)
  }
}
// un pioppo, alto e stretto, come quelli in fila lungo i fossi della pianura
export function pioppo(g, r, x, yBase, alto, cols) {
  R(g, x, yBase - alto * 0.3, 2, alto * 0.3, '#4a3d33')
  for (let i = 0; i < alto * 0.85; i += 2) {
    const k = i / (alto * 0.85), w = Math.max(1, Math.round(Math.sin(Math.PI * Math.min(1, k * 1.15)) * 5 + r() * 1.5))
    R(g, x + 1 - w, yBase - alto * 0.18 - i, w * 2, 2, cols[0]); R(g, x + 1, yBase - alto * 0.18 - i, w, 2, cols[1] ?? cols[0])
  }
}
export function cespuglio(g, r, x, y, w, h, cols) {
  for (let i = 0; i < w / 3; i++) ellisse(g, x + (r() - 0.5) * w * 0.8, y - h * 0.4 + (r() - 0.5) * h * 0.4 + 1, 3 + r() * w * 0.18, 2 + r() * h * 0.35, cols[0])
  for (let i = 0; i < w / 3; i++) ellisse(g, x + (r() - 0.5) * w * 0.7, y - h * 0.5 + (r() - 0.5) * h * 0.4, 2 + r() * w * 0.15, 2 + r() * h * 0.3, cols[1])
  for (let i = 0; i < w / 5; i++) ellisse(g, x + (r() - 0.7) * w * 0.4, y - h * 0.7 + r() * h * 0.2, 1 + r() * w * 0.08, 1 + r() * h * 0.15, cols[2])
}
export function ciuffo(g, x, y, col, alto = 4) {
  R(g, x, y - alto, 1, alto, col); R(g, x - 1, y - alto + 2, 1, alto - 2, col); R(g, x + 1, y - alto + 1, 1, alto - 1, col); R(g, x + 2, y - alto + 3, 1, alto - 3, col)
}
export function fungo(g, x, y, porcino = true) {
  R(g, x - 1, y - 4, 3, 4, '#efe3c8'); R(g, x + 1, y - 4, 1, 4, '#d6c6a4')
  const c = porcino ? '#7a4a24' : '#c8281e'
  R(g, x - 3, y - 6, 7, 2, c); R(g, x - 2, y - 7, 5, 1, c); R(g, x - 1, y - 7, 2, 1, schiarisci(c, 0.25))
  if (!porcino) { R(g, x - 2, y - 6, 1, 1, '#fff'); R(g, x + 1, y - 7, 1, 1, '#fff') }
}
export function sasso(g, x, y, w, h) {
  ellisse(g, x, y - h / 2, w / 2, h / 2, '#7d7a76'); ellisse(g, x - 1, y - h / 2 - 1, w / 2 - 2, h / 2 - 1, '#97938e'); R(g, x - w / 4, y - h + 1, 2, 1, '#b3afa9')
}
