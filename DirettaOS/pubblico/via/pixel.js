// Diretta OS · gli attrezzi delle scene in pixel art dei «torno subito», come gli oggetti di pzkko: si disegna su una
// tela piccola (480 × 270) che il browser ingrandisce quattro volte senza sfumare. Qui ci sono i pennelli, la
// scrittura a pixel, il cielo vero (l'ora, il sole e la luna sopra Mantova, il tempo che fa, la stagione) e la luce
// di notte. Le scene (bosco.js, casa.js, postazione.js) li usano tutti.

export const W = 480, H = 270
export const SCURO = '#120e16'

export function tela(w = W, h = H) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false
  return [c, g]
}

// ── il caso, sempre lo stesso per lo stesso seme (così la regia e Camo vedono la stessa scena) ──
export function semi(seme) {
  let a = seme >>> 0
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export const caso = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
export const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)))
export const mix = (a, b, k) => a + (b - a) * k

// ── i colori ──
export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export const hex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
export const mescola = (a, b, k) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k))
export const scurisci = (a, k) => mescola(a, '#000000', k)
export const schiarisci = (a, k) => mescola(a, '#ffffff', k)

// ── i pennelli: sempre su pixel interi, niente sfumature ──
export function R(g, x, y, w, h, c) { if (c) g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)) }
export function linea(g, x0, y0, x1, y1, s, c) {
  g.fillStyle = c
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, o = Math.floor(s / 2)
  let e = dx + dy
  for (let n = 0; n < 2000; n++) {
    g.fillRect(x0 - o, y0 - o, s, s)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * e
    if (e2 >= dy) { e += dy; x0 += sx }
    if (e2 <= dx) { e += dx; y0 += sy }
  }
}
export function ellisse(g, cx, cy, rx, ry, c) {
  if (c) g.fillStyle = c
  cx = Math.round(cx); cy = Math.round(cy)
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.5) * (ry + 0.5))))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1) }
}
// una figura scritta a lettere: ogni lettera è un colore della tavolozza, il punto è vuoto
const figure = new Map()
export function figura(righe, pal) {
  const k = righe.join('|') + JSON.stringify(pal)
  let c = figure.get(k)
  if (c) return c
  const [t, g] = tela(Math.max(...righe.map((r) => r.length)), righe.length)
  righe.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) R(g, x, y, 1, 1, col) } })
  figure.set(k, t)
  return t
}
export function metti(g, img, x, y, dir = 1) {
  x = Math.round(x); y = Math.round(y)
  if (dir >= 0) { g.drawImage(img, x, y); return }
  g.save(); g.translate(x + img.width, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore()
}
// il contorno scuro di un pixel tutto attorno (come i personaggi di pzkko), su una tela che si riusa
export function contorno(src, dst, col = SCURO) {
  const w = src.width, h = src.height
  if (dst.width !== w + 2 || dst.height !== h + 2) { dst.width = w + 2; dst.height = h + 2 }
  const g = dst.getContext('2d')
  g.imageSmoothingEnabled = false
  g.clearRect(0, 0, w + 2, h + 2)
  g.globalCompositeOperation = 'source-over'
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(src, dx, dy)
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = col; g.fillRect(0, 0, w + 2, h + 2)
  g.globalCompositeOperation = 'source-over'
  g.drawImage(src, 1, 1)
  return dst
}

// ── la scrittura a pixel (3 × 5, maiuscole) ──
const LETTERE = Object.fromEntries(Object.entries({
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.', E: '### #.. ##. #.. ###',
  F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#', I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.',
  K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###', M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.',
  P: '##. #.# ##. #.. #..', Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#', Y: '#.# #.# .#. .#. .#.',
  Z: '### ..# .#. #.. ###', 0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
  4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.', 8: '### #.# ### #.# ###',
  9: '### #.# ### ..# ##.', '!': '.#. .#. .#. ... .#.', '?': '##. ..# .#. ... .#.', '.': '... ... ... ... .#.', ',': '... ... ... .#. #..',
  ':': '... .#. ... .#. ...', '-': '... ... ### ... ...', '+': '... .#. ### .#. ...', "'": '.#. .#. ... ... ...', '>': '#.. .#. ..# .#. #..',
  '/': '..# ..# .#. #.. #..', '%': '#.# ..# .#. #.. #.#',
}).map(([k, v]) => [k, v.replace(/ /g, '')]))
const CUORE = ['.#.#.', '#####', '#####', '.###.', '..#..']
export function largo(testo) { let w = 0; for (const ch of testo.toUpperCase()) w += ch === ' ' ? 3 : ch === '♥' ? 6 : 4; return Math.max(0, w - 1) }
export function scrivi(g, testo, x, y, c) {
  g.fillStyle = c
  let cx = Math.round(x)
  for (const ch of testo.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')) {
    if (ch === ' ') { cx += 3; continue }
    if (ch === '♥') { CUORE.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') g.fillRect(cx + i, y + j, 1, 1) }); cx += 6; continue }
    const m = LETTERE[ch]
    if (m) for (let i = 0; i < 15; i++) if (m[i] === '#') g.fillRect(cx + (i % 3), Math.round(y) + Math.floor(i / 3), 1, 1)
    cx += 4
  }
}
// il fumetto: bianco, bordo scuro, la punta verso chi parla (x, y è la punta)
export function fumetto(g, testo, x, y, { col = '#ffffff', ink = SCURO, su = true } = {}) {
  const w = largo(testo) + 6, h = 11
  const bx = Math.round(x - w / 2), by = Math.round(su ? y - h - 3 : y + 3)
  R(g, bx + 1, by, w - 2, h, ink); R(g, bx, by + 1, w, h - 2, ink)
  R(g, bx + 1, by + 1, w - 2, h - 2, col)
  if (su) { R(g, x - 1, by + h - 1, 3, 2, ink); R(g, x, by + h, 1, 2, ink); R(g, x, by + h - 1, 1, 1, col) }
  else { R(g, x - 1, by - 1, 3, 1, ink); R(g, x, by - 2, 1, 1, ink); R(g, x, by, 1, 1, col) }
  scrivi(g, testo, bx + 3, by + 3, ink)
}

// ── il cielo vero: il sole e la luna sopra Mantova (il nome che si vede in onda; la differenza col paese sono minuti) ──
const LAT = 45.156, LON = 10.791, RAD = Math.PI / 180
export function sole(d) {
  const inizio = Date.UTC(d.getUTCFullYear(), 0, 1)
  const ore = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
  const g = 2 * Math.PI / 365 * ((d - inizio) / 864e5 - ore / 24 + (ore - 12) / 24)
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const ha = ((ore * 60 + eqt + 4 * LON) / 4 - 180) * RAD
  const cz = Math.sin(LAT * RAD) * Math.sin(decl) + Math.cos(LAT * RAD) * Math.cos(decl) * Math.cos(ha)
  const alt = 90 - Math.acos(Math.min(1, Math.max(-1, cz))) / RAD
  // da est (-1) a ovest (+1): dove sta nel cielo, guardando a sud
  return { alt, est: Math.max(-1, Math.min(1, Math.sin(ha) / Math.max(0.3, Math.cos(alt * RAD)))) }
}
// la fase della luna (0 nuova, 0,5 piena) e dove sta: in ritardo sul sole di quasi un'ora al giorno
export function luna(d) {
  let f = ((d - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 / 29.530588853) % 1
  if (f < 0) f += 1
  const s = sole(new Date(d - f * 24.84 * 3600e3))
  return { fase: f, alt: s.alt, est: s.est }
}
export const stagione = (d) => ['inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'estate', 'estate', 'estate', 'autunno', 'autunno', 'autunno', 'inverno'][d.getMonth()]

// i colori del cielo a seconda di quanto è alto il sole: [in alto, a metà, all'orizzonte]
const CIELI = [
  [-90, ['#04050d', '#080a1e', '#10142e']], [-14, ['#05060f', '#0b0e27', '#161b3d']], [-9, ['#0a0f2a', '#1b2152', '#3b3162']],
  [-4, ['#1b2557', '#4b4080', '#c46e74']], [0, ['#2e4888', '#a5708f', '#ff985e']], [5, ['#4a77c0', '#a3b7d4', '#ffc68a']],
  [14, ['#3f7fd6', '#80b3ea', '#d3e8f6']], [90, ['#2c6fd2', '#68a6ec', '#bcdcf8']],
]
const GRIGI = [[-90, ['#06070c', '#0c0e16', '#151821']], [-6, ['#1c2130', '#2a3040', '#3c4252']], [2, ['#5a6272', '#7a8292', '#9aa0aa']], [14, ['#8a929e', '#a8afb9', '#c6cbd1']], [90, ['#8f97a3', '#adb4be', '#cbd0d6']]]
function interpola(tab, alt) {
  let i = tab.findIndex(([a]) => a > alt)
  if (i <= 0) i = i === 0 ? 1 : tab.length - 1
  const [a0, c0] = tab[i - 1], [a1, c1] = tab[i], k = Math.min(1, Math.max(0, (alt - a0) / (a1 - a0)))
  return c0.map((c, j) => mescola(c, c1[j], k))
}
// com'è il cielo adesso: i colori, quanto è buio, le stelle, la luce che tinge le cose
export function cielo(adesso, meteo) {
  const s = sole(adesso), l = luna(adesso), tempo = meteo?.icona ?? 'sole'
  const coperto = { nuvole: 1, pioggia: 1, temporale: 1, nebbia: 0.9, neve: 1, nuvolo: 0.35 }[tempo] ?? 0
  const sereno = interpola(CIELI, s.alt), grigio = interpola(GRIGI, s.alt)
  let colori = sereno.map((c, i) => mescola(c, grigio[i], coperto * 0.85))
  // la nebbia della pianura: di giorno il cielo è latte, non grigio-azzurro
  if (tempo === 'nebbia') colori = colori.map((c, i) => mescola(c, ['#b9bec4', '#c9cdd1', '#d6d9dc'][i], 0.75 * ss(-6, 6, s.alt)))
  const buio = 1 - ss(-12, 4, s.alt) // 0 di giorno, 1 di notte piena
  const stelle = (1 - ss(-11, -3, s.alt)) * (1 - coperto * 0.9)
  // la tinta delle cose: niente di giorno, arancio al tramonto, blu nell'ora blu, blu scuro di notte
  const tramonto = ss(-3, 1, s.alt) * (1 - ss(4, 10, s.alt)) * (1 - coperto * 0.7)
  let tinta = null, forza = 0
  if (buio > 0.02) { tinta = mescola('#2a3570', '#0b1030', ss(0.4, 1, buio)); forza = 0.25 + 0.47 * buio }
  if (tramonto > 0.05 && buio < 0.6) { tinta = tinta ? mescola(tinta, '#ff7a3a', tramonto * 0.6) : '#ff8a4a'; forza = Math.max(forza, 0.16 * tramonto) }
  if (coperto > 0.5 && buio < 0.3) { tinta = tinta ? mescola(tinta, '#7d8794', 0.5) : '#8a929c'; forza = Math.max(forza, 0.18 * coperto) }
  return { sole: s, luna: l, colori, buio, stelle, tinta, forza, tempo, coperto, stagione: stagione(adesso), gradi: meteo?.gradi ?? 12, vento: meteo?.vento ?? 0 }
}

// lo sfondo del cielo, con la sfumatura a puntini (come i vecchi giochi) e le stelle; si rifà una volta al minuto
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export function dipingiCielo(g, c, fino = H, seme = 7) {
  const img = g.createImageData(W, fino), d = img.data
  const [a, b, o] = c.colori.map(rgb)
  for (let y = 0; y < fino; y++) {
    const k = y / Math.max(1, fino - 1)
    const col = k < 0.55 ? a.map((v, i) => v + (b[i] - v) * (k / 0.55)) : b.map((v, i) => v + (o[i] - v) * ((k - 0.55) / 0.45))
    for (let x = 0; x < W; x++) {
      const soglia = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16, p = (y * W + x) * 4
      for (let i = 0; i < 3; i++) { const v = col[i] / 6, f = Math.floor(v); d[p + i] = Math.min(255, (v - f > soglia ? f + 1 : f) * 6) }
      d[p + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  // le stelle (fisse: la scintilla la fa la scena)
  if (c.stelle > 0.02) {
    const r = semi(seme), n = Math.round(150 * c.stelle)
    for (let i = 0; i < n; i++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * fino * 0.85), v = r()
      g.fillStyle = `rgba(255,${240 + Math.floor(r() * 15)},${215 + Math.floor(r() * 40)},${(0.25 + 0.75 * v * c.stelle).toFixed(2)})`
      g.fillRect(x, y, 1, 1)
    }
  }
}
// le stelle che scintillano (poche, grandi, a croce)
export function scintille(g, c, t, fino = H, seme = 11) {
  if (c.stelle < 0.1) return
  const r = semi(seme)
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * fino * 0.7) + 2, f = r() * 6, v = 0.5 + 0.5 * Math.sin(t * (1.2 + r()) + f)
    if (v < 0.25) continue
    g.fillStyle = `rgba(255,250,225,${(v * c.stelle).toFixed(2)})`
    g.fillRect(x, y, 1, 1)
    if (v > 0.7) { g.fillStyle = `rgba(255,250,225,${((v - 0.7) * 2 * c.stelle).toFixed(2)})`; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3) }
  }
}
// la luna con la sua fase vera, e il sole; x, y dove metterli (la scena sceglie)
export function astro(g, c, x, y, t) {
  if (c.buio > 0.35 && c.luna.alt > -2 && c.coperto < 0.95) {
    const f = c.luna.fase, r = 8, luce = Math.cos(f * 2 * Math.PI) // 1 nuova, -1 piena
    const alone = g.createRadialGradient(x, y, 2, x, y, 30)
    alone.addColorStop(0, `rgba(220,230,255,${(0.22 * (1 - c.coperto)).toFixed(2)})`); alone.addColorStop(1, 'rgba(220,230,255,0)')
    g.fillStyle = alone; g.fillRect(x - 30, y - 30, 60, 60)
    for (let yy = -r; yy <= r; yy++) {
      const w = Math.sqrt(Math.max(0, r * r - yy * yy))
      for (let xx = -Math.ceil(w); xx <= Math.ceil(w); xx++) {
        if (xx * xx + yy * yy > r * r + 2) continue
        // il terminatore: la parte illuminata cresce da destra (luna crescente) e cala a sinistra
        const u = w ? xx / w : 0, acceso = f < 0.5 ? u > luce : u < -luce
        g.fillStyle = acceso ? ((xx * 7 + yy * 3) % 11 === 0 || (xx === -2 && yy === 1) || (xx === 3 && yy === -3) ? '#c9cbd6' : '#f1efe4') : 'rgba(30,36,60,0.85)'
        g.fillRect(Math.round(x + xx), Math.round(y + yy), 1, 1)
      }
    }
  }
  if (c.sole.alt > -1 && c.coperto < 0.9) {
    const basso = 1 - ss(2, 25, c.sole.alt), col = mescola('#fff6d0', '#ff8a3a', basso)
    const alone = g.createRadialGradient(x, y, 3, x, y, 46)
    alone.addColorStop(0, `rgba(255,${Math.round(230 - 90 * basso)},${Math.round(160 - 110 * basso)},${(0.5 * (1 - c.coperto)).toFixed(2)})`); alone.addColorStop(1, 'rgba(255,200,120,0)')
    g.fillStyle = alone; g.fillRect(x - 46, y - 46, 92, 92)
    ellisse(g, x, y, 7, 7, col)
  }
}

// le nuvole a pixel, che passano piano
export function nuvole(g, c, t, fino, seme = 5, quante = null) {
  const n = quante ?? Math.round({ sole: 2, luna: 1, nuvolo: 4, nuvole: 7, pioggia: 8, temporale: 8, neve: 7, nebbia: 3 }[c.tempo] ?? 3)
  const r = semi(seme)
  const base = c.buio > 0.6 ? '#2a2f45' : c.coperto > 0.5 ? '#9aa1ab' : '#ffffff', ombra = c.buio > 0.6 ? '#1c2033' : c.coperto > 0.5 ? '#7f8792' : '#d9e4f2'
  const col = c.tinta && c.forza > 0.1 && c.buio < 0.6 ? mescola(base, c.tinta, c.forza * 1.2) : base
  for (let i = 0; i < n; i++) {
    const w = 30 + r() * 60, v = 2 + r() * 4, y = 6 + r() * fino * 0.5
    const x = ((r() * (W + w) + t * v) % (W + w * 2)) - w
    const h = 6 + r() * 6
    ellisse(g, x + w * 0.5, y + h * 0.2, w * 0.5, h * 0.55, ombra)
    ellisse(g, x + w * 0.5, y, w * 0.5, h * 0.5, col)
    ellisse(g, x + w * 0.3, y - h * 0.35, w * 0.22, h * 0.45, col)
    ellisse(g, x + w * 0.62, y - h * 0.5, w * 0.2, h * 0.5, col)
  }
}

// ── la luce: le cose del mondo si tingono col cielo (blu di notte, arancio al tramonto), le luci accese no ──
export function tingi(g, c, w = W, h = H) {
  if (!c.tinta || c.forza < 0.01) return
  g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = Math.min(0.85, c.forza); g.fillStyle = c.tinta; g.fillRect(0, 0, w, h); g.restore()
}
// un alone di luce che si somma (lampioni, finestre, lucciole)
export function alone(g, x, y, r, col, forza = 1) {
  const [a, b, d] = rgb(col)
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, `rgba(${a},${b},${d},${(0.55 * forza).toFixed(3)})`); gr.addColorStop(0.4, `rgba(${a},${b},${d},${(0.2 * forza).toFixed(3)})`); gr.addColorStop(1, `rgba(${a},${b},${d},0)`)
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore()
}

// ── il tempo che fa: pioggia, neve, nebbia (sopra tutto) ──
// i banchi di nebbia: una striscia di macchie tenui, larga quanto la tela, che si ripete scorrendo
function banco(seme, chiaro) {
  const r = semi(seme), [c, g] = tela(W, 40)
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = 8 + r() * 24, rx = 30 + r() * 70, ry = 4 + r() * 9
    g.fillStyle = chiaro ? 'rgba(226,229,233,0.05)' : 'rgba(84,90,112,0.045)'
    for (const dx of [-W, 0, W]) ellisse(g, x + dx, y, Math.round(rx), Math.round(ry))
  }
  return c
}
export function creaTempo(seme = 3) {
  const r = semi(seme), gocce = Array.from({ length: 160 }, () => ({ x: r() * W, y: r() * H, v: 0.7 + r() * 0.6 }))
  const banchi = { chiaro: [banco(seme + 1, true), banco(seme + 2, true)], scuro: [banco(seme + 1, false), banco(seme + 2, false)] }
  return function tempo(g, c, t, dt, fino = H) {
    const tipo = c.tempo
    if (tipo === 'pioggia' || tipo === 'temporale') {
      g.fillStyle = c.buio > 0.5 ? 'rgba(150,170,210,0.55)' : 'rgba(200,215,235,0.6)'
      for (const d of gocce) {
        d.y += 260 * d.v * dt; d.x -= 50 * d.v * dt
        if (d.y > fino) { d.y -= fino + 10; d.x = Math.random() * (W + 40) }
        if (d.x < -5) d.x += W + 10
        g.fillRect(Math.round(d.x), Math.round(d.y), 1, 4); g.fillRect(Math.round(d.x) - 1, Math.round(d.y) + 3, 1, 2)
      }
      if (tipo === 'temporale') { const f = (t % 7.3) / 7.3; if (f < 0.025 || (f > 0.04 && f < 0.055)) { g.fillStyle = 'rgba(230,235,255,0.45)'; g.fillRect(0, 0, W, H) } }
    } else if (tipo === 'neve') {
      g.fillStyle = '#ffffff'
      for (const d of gocce) {
        d.y += 24 * d.v * dt; d.x += Math.sin(t * 1.3 + d.v * 9) * 10 * dt
        if (d.y > fino) { d.y -= fino + 4; d.x = Math.random() * W }
        g.fillRect(Math.round(d.x), Math.round(d.y), d.v > 1.1 ? 2 : 1, d.v > 1.1 ? 2 : 1)
      }
    } else if (tipo === 'nebbia') {
      // un velo su tutto, poi i banchi che scorrono piano, più fitti in basso
      g.fillStyle = c.buio > 0.5 ? 'rgba(70,76,96,0.12)' : 'rgba(225,228,232,0.16)'; g.fillRect(0, 0, W, fino)
      const b = banchi[c.buio > 0.5 ? 'scuro' : 'chiaro']
      for (let i = 0; i < 3; i++) {
        const y = Math.round(fino * (0.5 + i * 0.16)) - 20, x = Math.round((t * (2.5 + i * 1.6) + i * 97) % W)
        g.globalAlpha = 0.8 + i * 0.1
        g.drawImage(b[i % 2], x - W, y); g.drawImage(b[i % 2], x, y)
      }
      g.globalAlpha = 1
    }
  }
}

// le foglie che cadono (autunno), i petali (primavera), la neve sui rami (inverno): di che colore sono gli alberi
export const CHIOME = {
  primavera: ['#3f8f34', '#5cb043', '#82cc5a', '#f4b6d2'], estate: ['#2a6326', '#367d2f', '#4c9a3c', '#5fae48'],
  autunno: ['#9a3b17', '#c45a1e', '#e0892a', '#eebc3c'], inverno: ['#5a4a3c', '#6b5a4a', '#7a6a58', '#e8eef5'],
}
export const ERBA = { primavera: ['#4f9a38', '#6db84a', '#3d7d2c'], estate: ['#4a8a30', '#62a43e', '#376b25'], autunno: ['#6f8237', '#8a9442', '#56662a'], inverno: ['#6f7a5c', '#86907a', '#57614a'] }
