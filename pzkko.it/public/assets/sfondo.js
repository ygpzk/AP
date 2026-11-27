/* pzkko.it — lo sfondo: la serranda (26.11.2026).

   pzkko: «lo sfondo di pzkko.it deve essere la stessa serranda ma con colori e sfumature dei colori di Discord,
   questa cosa è legata, cambia uno cambia l'altro; in più pienissima, tipo 50 graffiti di cui 70% dei colori del
   tema e il resto a piacere; anche tag famosi e scritte di qualsiasi tipo; no volantini; sì chewing gum;
   luminosità 100% e in dark mode 20%».

   La lamiera è quella del Muro (/serranda/, art/muro.webp), dipinta in sfondo.css col tema del profilo (--p in
   alto, --a in basso, come la scheda di Discord). Qui sopra, su una tela sola, ci sono i 50 graffiti (34 sui
   telefoni): 35 coi colori del tema e 15 coi colori loro (le bombolette vere di art/tag e art/scritte2, i neri, i
   bianchi, i fluo), più le gomme da masticare e qualche pezzo di lamiera ripassato di vernice. Niente volantini.

   Legati: quando app.js riscrive --p / --a (il tema di Discord) la tela si ridisegna da sola con le stesse scritte
   negli stessi posti e i colori nuovi. Il seme è fisso: il muro è lo stesso per tutti e a ogni visita.
   Le doghe passano anche sopra la vernice (l'ombra della lamiera, calcolata una volta dalla foto).
   Per provare: window.pzkkoSfondo.ridisegna(), window.pzkkoSfondo.piano(). */

const amb = document.querySelector('.ambient')
const root = document.documentElement
const SEME = 261126

// ─── i caratteri delle bombolette (public/fonts, serviti da qui) ─────────────
const CARATTERI = {
  marker: 'permanent-marker', salt: 'rock-salt', apple: 'homemade-apple', grace: 'covered-by-your-grace',
  gochi: 'gochi-hand', nothing: 'nothing-you-could-do', reenie: 'reenie-beanie', gloria: 'gloria-hallelujah',
  caveat: 'caveat', shrik: 'shrikhand', sakura: 'dn-sakura', jelly: 'dn-jellybean', ops: 'black-ops-one',
  bungee: 'bungee', rubik: 'rubik-mono-one', price: 'dn-pricedown', alfa: 'alfa-slab-one', bang: 'dn-headbang',
  anton: 'anton', bit: 'dn-8bit',
}

// ─── i 50 pezzi ──────────────────────────────────────────────────────────────
// c: 't' = coi colori del tema (cambiano con Discord), 'l' = un colore a piacere, 'f' = i colori suoi (la foto
// della bomboletta vera). w = larghezza in celle del muro.
const CATALOGO = [
  // i suoi
  { k: 'throw', t: 'pzk', f: 'shrik', w: 2.1, c: 't', nuvola: 1 },
  { k: 'throw', t: 'PZKKO', f: 'sakura', w: 2.6, c: 't' },
  { k: 'pezzo', t: 'pzkko', f: 'bungee', w: 2.7, c: 't', nuvola: 1 },
  { k: 'pezzo', t: 'OLLARE', f: 'rubik', w: 2.5, c: 't' },
  { k: 'pezzo', t: 'ygpzk', f: 'price', w: 2.2, c: 't', nuvola: 1 },
  { k: 'tag', t: 'pzkko', f: 'salt', w: 1.6, c: 't', deco: 'corona' },
  { k: 'tag', t: 'pzk', f: 'marker', w: 1.1, c: 't', deco: 'stella' },
  { k: 'tag', t: 'pzkko.it', f: 'nothing', w: 1.5, c: 't', deco: 'freccia' },
  { k: 'tag', t: 'bella zio', f: 'apple', w: 1.6, c: 't' },
  { k: 'throw', t: 'zio', f: 'jelly', w: 1.3, c: 't' },
  { k: 'adesivo', d: 'hello', t: 'pzkko', w: 0.62, c: 't' },
  { k: 'adesivo', d: 'tondo', t: 'pzk', w: 0.42, c: 't' },
  { k: 'img', src: '/art/tag/tag-nero.webp', w: 1.3, c: 't' },
  { k: 'img', src: '/art/tag/scarabocchio.webp', w: 1.1, c: 't' },
  { k: 'img', src: '/art/tag/stencil-chiocciola.webp', w: 1.2, c: 't' },
  { k: 'img', src: '/art/tag/faccia.webp', w: 0.75, c: 't' },
  { k: 'img', src: '/art/scritte2/unimore.webp', w: 1.1, c: 't' },
  { k: 'img', src: '/art/tag/tag-arancio.webp', w: 1.3, c: 't' },
  // i tag famosi
  { k: 'tag', t: 'TAKI 183', f: 'marker', w: 1.6, c: 't' },
  { k: 'rullo', t: 'COST REVS', f: 'anton', w: 2.6, c: 't' },
  { k: 'pezzo', t: 'SEEN', f: 'alfa', w: 1.8, c: 't' },
  { k: 'disegno', d: 'kilroy', w: 1.25, c: 't' },
  { k: 'scritta', t: 'CLAPTON IS GOD', f: 'marker', w: 1.7, c: 't', spray: 1 },
  { k: 'scritta', t: 'FRODO LIVES', f: 'gochi', w: 1.3, c: 't' },
  { k: 'pezzo', t: 'NO FUTURE', f: 'bang', w: 2.0, c: 't' },
  { k: 'scritta', t: 'io e te\n3 metri sopra il cielo', f: 'gloria', w: 1.8, c: 't' },
  // le scritte
  { k: 'scritta', t: 'fine lavori: mai', f: 'marker', w: 1.5, c: 't', spray: 1 },
  { k: 'scritta', t: 'lavori in corso', f: 'grace', w: 1.4, c: 't' },
  { k: 'scritta', t: 'torno subito', f: 'gloria', w: 1.2, c: 't' },
  { k: 'stencil', t: 'VIETATO\nAFFIGGERE', f: 'ops', w: 1.6, c: 't', cornice: 1 },
  { k: 'stencil', t: 'PASSO\nCARRABILE', f: 'ops', w: 1.6, c: 't', cornice: 1 },
  { k: 'pezzo', t: 'GAME OVER', f: 'bit', w: 1.9, c: 't' },
  { k: 'disegno', d: 'cuore', t: 'ti amo', w: 0.9, c: 't' },
  { k: 'disegno', d: 'corona', w: 0.7, c: 't' },
  { k: 'disegno', d: 'stella', w: 0.55, c: 't' },
  // a piacere (15)
  { k: 'img', src: '/art/tag/tag-azzurro.webp', w: 1.4, c: 'f' },
  { k: 'img', src: '/art/tag/tag-verde.webp', w: 1.4, c: 'f' },
  { k: 'img', src: '/art/tag/ciao-bianco.webp', w: 1.1, c: 'f' },
  { k: 'img', src: '/art/tag/throwup-argento.webp', w: 1.7, c: 'f' },
  { k: 'img', src: '/art/scritte2/brat-summer.webp', w: 1.0, c: 'f' },
  { k: 'tag', t: 'CORNBREAD', f: 'marker', w: 1.7, c: 'l', deco: 'sottolinea' },
  { k: 'scritta', t: 'ciao mamma', f: 'caveat', w: 1.1, c: 'l' },
  { k: 'disegno', d: 'smile', w: 0.7, c: 'l' },
  { k: 'throw', t: 'OK', f: 'shrik', w: 1.2, c: 'l' },
  { k: 'adesivo', d: 'hello', t: 'ygpzk', w: 0.6, c: 'l' },
  { k: 'tag', t: 'mai dire mai', f: 'reenie', w: 1.4, c: 'l' },
  { k: 'disegno', d: 'freccia', w: 0.9, c: 'l' },
  { k: 'pezzo', t: 'WOW', f: 'bungee', w: 1.4, c: 'l' },
  { k: 'disegno', d: 'tacche', w: 0.6, c: 'l' },
  { k: 'scritta', t: 'chi legge è scemo', f: 'caveat', w: 1.4, c: 'l' },
]
const ROT = { tag: 0.2, throw: 0.1, pezzo: 0.06, rullo: 0.04, stencil: 0.05, scritta: 0.12, disegno: 0.25, adesivo: 0.42, img: 0.12 }
const PRIMA = { rullo: 0, pezzo: 1, throw: 2, img: 3, stencil: 3, tag: 4, scritta: 5, disegno: 5, adesivo: 7 }

// ─── numeri e colori ─────────────────────────────────────────────────────────
const rng = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const mescola = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const tra = (r, a, b) => a + r() * (b - a)
const hex = (h) => { h = String(h).trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h.slice(0, 6), 16); return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : null }
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
const luce = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; const y = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y }
const NERO = [18, 12, 10], BIANCO = [252, 249, 240]
const LIBERI = ['#141414', '#f6f4ee', '#1ec8ff', '#35e35c', '#ff4fb8', '#8a5cff', '#2446ff', '#00c2a8', '#c3c6cc'].map(hex)

function colori() {
  const leggi = (k, d) => hex(root.style.getPropertyValue(k) || getComputedStyle(root).getPropertyValue(k)) || hex(d)
  const P = leggi('--p', '#ffd21a'), A = leggi('--a', '#d81e1e')
  // le sfumature del tema: i due colori, le loro medie, più chiari e più scuri
  const tema = [P, A, mix(P, A, 0.5), mix(P, A, 0.25), mix(P, A, 0.75), mix(P, [255, 255, 255], 0.45), mix(A, [255, 255, 255], 0.35),
    mix(P, [30, 12, 0], 0.5), mix(A, [25, 0, 0], 0.5), mix(A, [12, 0, 0], 0.78)]
  return { P, A, tema, chiave: css(P) + css(A) }
}
// un colore della lista che si stacchi dalla lamiera lì sotto
function stacca(lista, fondo, r, min = 24, evita) {
  const Lf = luce(fondo)
  let buoni = lista.filter((c) => Math.abs(luce(c) - Lf) >= min && (!evita || Math.abs(luce(c) - luce(evita)) >= 18))
  if (!buoni.length) buoni = [lista.reduce((a, b) => (Math.abs(luce(b) - Lf) > Math.abs(luce(a) - Lf) ? b : a))]
  return buoni[Math.floor(r() * buoni.length)]
}

// ─── tele e maschere ─────────────────────────────────────────────────────────
const tela = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.min(4096, Math.ceil(w))); c.height = Math.max(1, Math.min(4096, Math.ceil(h))); return c }
const ctx = (c) => c.getContext('2d')
function tinta(m, col, a = 1) { const c = tela(m.width, m.height), x = ctx(c); x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = css(col, a); x.fillRect(0, 0, c.width, c.height); return c }
// lo spruzzo intorno: l'ombra sfocata della maschera, disegnata fuori dalla tela perché resti solo l'ombra
function alone(x, m, col, blur, a, dx = 0, dy = 0) {
  if (blur <= 0) return
  x.save(); x.shadowColor = css(col, a); x.shadowBlur = blur; x.shadowOffsetX = 20000 + dx; x.shadowOffsetY = dy; x.drawImage(m, -20000, 0); x.restore()
}
function guarda(m, s = 0.25, blur = 0) {
  const w = Math.max(1, Math.round(m.width * s)), h = Math.max(1, Math.round(m.height * s))
  const c = tela(w, h), x = c.getContext('2d', { willReadFrequently: true })
  if (blur) { x.shadowColor = '#fff'; x.shadowBlur = blur * s; x.shadowOffsetX = 20000; x.drawImage(m, -20000, 0, w, h) } else x.drawImage(m, 0, 0, w, h)
  return { d: x.getImageData(0, 0, w, h).data, w, h, s }
}
// i puntini della bomboletta, dove lo spruzzo si dirada
function puntini(x, m, col, blur, quanti, r, D) {
  const A = guarda(m, 0.25, blur), n = Math.round(((m.width * m.height) / 260) * quanti)
  x.fillStyle = css(col, 0.9); x.beginPath()
  for (let i = 0; i < n; i++) {
    const px = r() * m.width, py = r() * m.height
    const a = A.d[((Math.min(A.h - 1, Math.floor(py * A.s)) * A.w + Math.min(A.w - 1, Math.floor(px * A.s))) << 2) + 3] / 255
    if (a > 0.02 && a < 0.6 && r() < a * 2.2) { const rr = (0.35 + r() * 1.05) * D; x.moveTo(px + rr, py); x.arc(px, py, rr, 0, 7) }
  }
  x.fill()
}
// dove cola: i punti più bassi della vernice
function colature(m, n, r) {
  if (n <= 0) return []
  const A = guarda(m, 0.25), fondo = new Int32Array(A.w).fill(-1)
  for (let cx = 0; cx < A.w; cx++) for (let cy = A.h - 1; cy >= 0; cy--) if (A.d[((cy * A.w + cx) << 2) + 3] > 150) { fondo[cx] = cy; break }
  let cand = []
  for (let cx = 1; cx < A.w - 1; cx++) if (fondo[cx] >= 0 && fondo[cx] >= fondo[cx - 1] && fondo[cx] >= fondo[cx + 1]) cand.push(cx)
  const out = []
  while (out.length < n && cand.length) {
    const cx = cand[Math.floor(r() * cand.length)]
    cand = cand.filter((c) => Math.abs(c - cx) > 4)
    out.push({ x: (cx + 0.5) / A.s, y: (fondo[cx] + 0.5) / A.s })
  }
  return out
}
function colata(x, X, Y, len, w, col, a) {
  x.globalAlpha = a; x.fillStyle = css(col)
  x.beginPath()
  x.moveTo(X - w * 0.55, Y - w * 1.2)
  x.quadraticCurveTo(X - w * 0.42, Y + len * 0.55, X - w * 0.3, Y + len)
  x.lineTo(X + w * 0.3, Y + len)
  x.quadraticCurveTo(X + w * 0.42, Y + len * 0.55, X + w * 0.55, Y - w * 1.2)
  x.closePath(); x.fill()
  x.beginPath(); x.ellipse(X, Y + len + w * 0.15, w * 0.5, w * 0.64, 0, 0, 7); x.fill()
  x.globalAlpha = 1
}

// le lettere: una per una, un po' storte, come le fa la mano
function misura(t, fam, peso, sp) {
  const x = ctx(tela(1, 1)); x.font = `${peso} 100px "${fam}"`
  return Math.max(...t.split('\n').map((riga) => [...riga].reduce((s, ch) => s + x.measureText(ch).width + sp * 100, -sp * 100)), 1)
}
function glifi(t, fam, px, r, o = {}) {
  const peso = o.peso || 400, x = ctx(tela(1, 1)); x.font = `${peso} ${px}px "${fam}"`
  const sp = (o.sp || 0) * px, lh = px * (o.lh || 1.05), righe = t.split('\n')
  const mm = x.measureText(t.replace(/\n/g, ''))
  const asc = mm.actualBoundingBoxAscent || px * 0.78, desc = mm.actualBoundingBoxDescent || px * 0.22
  const linee = righe.map((riga) => { let cx = 0; const pos = []; for (const ch of riga) { const w = x.measureText(ch).width; pos.push({ ch, x: cx, w }); cx += w + sp } return { pos, tot: Math.max(1, cx - sp) } })
  const W = Math.max(...linee.map((l) => l.tot)), g = []
  linee.forEach((l, i) => {
    const x0 = (W - l.tot) / 2
    for (const p of l.pos) g.push({ ch: p.ch, x: x0 + p.x, w: p.w, y: asc + i * lh + (r() * 2 - 1) * (o.jy || 0) * px, rot: (r() * 2 - 1) * (o.jr || 0), s: 1 + (r() * 2 - 1) * (o.js || 0) })
  })
  return { g, w: W, h: asc + desc + (righe.length - 1) * lh, asc, px, font: x.font }
}
function maschera(L, pad, o = {}) {
  const c = tela(L.w + pad * 2, L.h + pad * 2), x = ctx(c)
  x.font = L.font; x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineJoin = o.join || 'round'; x.lineCap = 'round'; x.miterLimit = 3
  if (o.bordo) x.lineWidth = o.bordo
  for (const g of L.g) {
    if (g.ch === ' ') continue
    x.save(); x.translate(pad + g.x + g.w / 2, pad + g.y); x.rotate(g.rot); x.scale(g.s, g.s)
    if (o.bordo) x.strokeText(g.ch, -g.w / 2, 0)
    x.fillText(g.ch, -g.w / 2, 0)
    x.restore()
  }
  if (o.extra) { x.save(); o.extra(x); x.restore() }
  return c
}
const stella = (x, cx, cy, R, punte = 5, dentro = 0.45, giro = -Math.PI / 2) => {
  x.beginPath()
  for (let i = 0; i < punte * 2; i++) { const a = giro + (i * Math.PI) / punte, rr = i % 2 ? R * dentro : R; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) }
  x.closePath()
}
// i lampi bianchi dei pezzi
function lampi(x, n, w, h, pad, px, r) {
  x.fillStyle = 'rgba(255,255,255,.92)'
  for (let i = 0; i < n; i++) { stella(x, pad + r() * (w - pad * 2), pad * 0.8 + r() * (h - pad * 2) * 0.5, px * tra(r, 0.07, 0.13), 4, 0.18, 0); x.fill() }
}

// ─── i pezzi, uno per tipo ───────────────────────────────────────────────────
// ognuno restituisce la sua tela (in pixel del dispositivo) e le colature, che si disegnano dopo dritte in giù
const FARE = {
  tag(it, k) {
    const { r, D, col } = k, fam = 'pzg-' + it.f, sp = -0.05
    const px = Math.min(500, (it.larg * D) / (misura(it.t, fam, 400, sp) / 100))
    const L = glifi(it.t, fam, px, r, { jr: 0.14, jy: 0.07, sp, js: 0.08 }), pad = px * 0.75, lw = px * 0.07
    const extra = (x) => {
      x.lineWidth = lw
      if (it.deco === 'corona') { const g = L.g[0], cx = pad + g.x + g.w * 0.6, b = pad - px * 0.02, s = px * 0.28; x.beginPath(); x.moveTo(cx - s, b); x.lineTo(cx - s, b - s * 0.9); x.lineTo(cx - s * 0.45, b - s * 0.35); x.lineTo(cx, b - s * 1.15); x.lineTo(cx + s * 0.45, b - s * 0.35); x.lineTo(cx + s, b - s * 0.9); x.lineTo(cx + s, b); x.closePath(); x.stroke() }
      if (it.deco === 'stella') { stella(x, pad + L.w + px * 0.32, pad + L.asc * 0.35, px * 0.24); x.stroke() }
      if (it.deco === 'freccia' || it.deco === 'sottolinea') {
        const y0 = pad + L.h + px * 0.08, x1 = pad + L.w + px * 0.25
        x.beginPath(); x.moveTo(pad - px * 0.15, y0 + px * 0.05); x.quadraticCurveTo(pad + L.w * 0.5, y0 - px * 0.18, x1, y0 - px * 0.02); x.stroke()
        if (it.deco === 'freccia') { x.beginPath(); x.moveTo(x1 - px * 0.2, y0 - px * 0.2); x.lineTo(x1, y0 - px * 0.02); x.lineTo(x1 - px * 0.22, y0 + px * 0.12); x.stroke() }
      }
    }
    const m = maschera(L, pad, { bordo: px * (it.spessore || 0.03), extra }), c = tela(m.width, m.height), x = ctx(c)
    alone(x, m, col, px * 0.09, 0.32)
    x.drawImage(tinta(m, col), 0, 0)
    puntini(x, m, col, px * 0.12, 1, r, D)
    const colate = colature(m, it.colate ?? 1 + Math.floor(r() * 4), r).map((p) => ({ ...p, len: px * tra(r, 0.15, 0.7), w: px * tra(r, 0.03, 0.055), col }))
    return { c, colate }
  },

  throw(it, k) {
    const { r, D, col } = k, fam = 'pzg-' + it.f, sp = -0.03
    const px = Math.min(520, (it.larg * D) / (misura(it.t, fam, 400, sp) / 100) / 1.12)
    const L = glifi(it.t, fam, px, r, { jr: 0.1, jy: 0.06, sp, js: 0.07 }), pad = px * 0.75, ow = px * 0.09
    const pieno = maschera(L, pad, { bordo: px * 0.035 }), fuori = maschera(L, pad, { bordo: ow * 2 + px * 0.035 })
    const c = tela(pieno.width, pieno.height), x = ctx(c)
    const bordo = luce(col) > 58 ? NERO : BIANCO, ombra = k.col2
    if (it.nuvola) nuvola(x, c.width, c.height, pad, px, k.col3, r)
    const E = tinta(fuori, ombra), prof = px * 0.11, ang = r() < 0.6 ? 0.75 : 2.35
    for (let i = 1; i <= prof; i += Math.max(1, D * 0.8)) x.drawImage(E, Math.cos(ang) * i, Math.sin(ang) * i)
    alone(x, fuori, bordo, px * 0.05, 0.4)
    x.drawImage(tinta(fuori, bordo), 0, 0)
    const F = tela(c.width, c.height), f = ctx(F), gr = f.createLinearGradient(0, pad, 0, pad + L.h)
    gr.addColorStop(0, css(mix(col, [255, 255, 255], 0.35))); gr.addColorStop(0.5, css(col)); gr.addColorStop(1, css(mix(col, NERO, 0.32)))
    f.fillStyle = gr; f.fillRect(0, 0, F.width, F.height)
    f.globalCompositeOperation = 'destination-in'; f.drawImage(pieno, 0, 0)
    f.globalCompositeOperation = 'source-atop'; f.fillStyle = 'rgba(255,255,255,.85)'
    for (const g of L.g) {
      if (g.ch === ' ') continue
      const alta = g.ch !== g.ch.toLowerCase(), cx = pad + g.x + g.w * 0.34, cy = pad + g.y - L.asc * (alta ? 0.72 : 0.42)
      f.beginPath(); f.ellipse(cx, cy, g.w * 0.13, px * 0.045, -0.5, 0, 7); f.fill()
      f.beginPath(); f.arc(cx + g.w * 0.22, cy - px * 0.03, px * 0.022, 0, 7); f.fill()
    }
    x.drawImage(F, 0, 0)
    lampi(x, 1 + Math.floor(r() * 3), c.width, c.height, pad, px, r)
    const colate = colature(fuori, Math.floor(r() * 4), r).map((p) => ({ ...p, len: px * tra(r, 0.12, 0.5), w: px * tra(r, 0.035, 0.06), col: bordo }))
    return { c, colate }
  },

  pezzo(it, k) {
    const { r, D, col } = k, fam = 'pzg-' + it.f, sp = 0.01
    const px = Math.min(520, (it.larg * D) / (misura(it.t, fam, 400, sp) / 100) / 1.14)
    const L = glifi(it.t, fam, px, r, { jr: 0.05, jy: 0.05, sp, js: 0.04 }), pad = px * 0.8, ow = px * 0.06
    const pieno = maschera(L, pad, { join: 'miter' }), fuori = maschera(L, pad, { bordo: ow * 2, join: 'miter' })
    const c = tela(pieno.width, pieno.height), x = ctx(c)
    const bordo = luce(col) > 58 ? NERO : BIANCO
    if (it.nuvola) nuvola(x, c.width, c.height, pad, px, k.col3, r)
    const E = tinta(fuori, mix(k.col2, NERO, 0.35)), prof = px * 0.17
    for (let i = 1; i <= prof; i += Math.max(1, D * 0.8)) x.drawImage(E, i * 0.7, i)
    alone(x, fuori, bordo, px * 0.04, 0.35)
    x.drawImage(tinta(fuori, bordo), 0, 0)
    x.drawImage(tinta(pieno, [255, 255, 255], 0.9), -px * 0.025, -px * 0.025)
    const F = tela(c.width, c.height), f = ctx(F), gr = f.createLinearGradient(0, pad, 0, pad + L.h)
    gr.addColorStop(0, css(col)); gr.addColorStop(0.46, css(col)); gr.addColorStop(0.56, css(k.col2)); gr.addColorStop(1, css(mix(k.col2, NERO, 0.25)))
    f.fillStyle = gr; f.fillRect(0, 0, F.width, F.height)
    f.globalCompositeOperation = 'destination-in'; f.drawImage(pieno, 0, 0)
    f.globalCompositeOperation = 'source-atop'; f.fillStyle = 'rgba(255,255,255,.75)'; f.fillRect(0, pad + L.h * 0.5, F.width, Math.max(1, px * 0.025))
    x.drawImage(F, 0, 0)
    lampi(x, 2 + Math.floor(r() * 3), c.width, c.height, pad, px, r)
    const colate = colature(fuori, Math.floor(r() * 3), r).map((p) => ({ ...p, len: px * tra(r, 0.1, 0.4), w: px * tra(r, 0.03, 0.05), col: bordo }))
    return { c, colate }
  },

  // le lettere col rullo, grandi e piatte, a strisce, che colano tanto
  rullo(it, k) {
    const { r, col } = k, fam = 'pzg-' + it.f, sp = 0.03
    const px = Math.min(560, (it.larg * k.D) / (misura(it.t, fam, 400, sp) / 100))
    const L = glifi(it.t, fam, px, r, { jr: 0.02, jy: 0.03, sp }), pad = px * 0.4
    const m = maschera(L, pad), y = ctx(m)
    y.globalCompositeOperation = 'destination-out'
    for (let yy = pad; yy < pad + L.h; yy += Math.max(1, k.D * 1.5)) if (r() < 0.3) { y.fillStyle = `rgba(0,0,0,${tra(r, 0.15, 0.6)})`; y.fillRect(pad + tra(r, -0.1, 0.5) * L.w, yy, L.w * tra(r, 0.2, 0.7), k.D * tra(r, 1, 2.6)) }
    const c = tinta(m, col)
    const colate = colature(m, 5 + Math.floor(r() * 4), r).map((p) => ({ ...p, len: px * tra(r, 0.2, 0.9), w: px * tra(r, 0.02, 0.04), col }))
    return { c, colate }
  },

  stencil(it, k) {
    const { r, D, col } = k, fam = 'pzg-' + it.f, sp = 0.05
    const px = Math.min(300, (it.larg * D) / (misura(it.t, fam, 400, sp) / 100) / 1.3)
    const L = glifi(it.t, fam, px, r, { sp, lh: 1.12 }), pad = px * 1.1, fr = px * 0.38
    const m = maschera(L, pad, { extra: it.cornice ? (x) => { x.lineWidth = px * 0.1; x.strokeRect(pad - fr, pad - fr, L.w + fr * 2, L.h + fr * 2) } : null }), y = ctx(m)
    // i ponticelli della mascherina
    y.globalCompositeOperation = 'destination-out'; y.fillStyle = '#000'
    for (const g of L.g) if ('OQDBPRAG0C69'.includes(g.ch)) y.fillRect(pad + g.x + g.w / 2 - px * 0.035, pad + g.y - L.asc - 2, px * 0.07, L.asc + 4)
    if (it.cornice) { const gx = pad - fr - px * 0.1, gy = pad - fr - px * 0.1, gw = L.w + fr * 2 + px * 0.2, gh = L.h + fr * 2 + px * 0.2; y.fillRect(gx + gw / 2 - px * 0.08, gy, px * 0.16, px * 0.25); y.fillRect(gx + gw / 2 - px * 0.08, gy + gh - px * 0.25, px * 0.16, px * 0.25); y.fillRect(gx, gy + gh / 2 - px * 0.08, px * 0.25, px * 0.16); y.fillRect(gx + gw - px * 0.25, gy + gh / 2 - px * 0.08, px * 0.25, px * 0.16) }
    const c = tela(m.width, m.height), x = ctx(c)
    // il foglio della mascherina lascia il suo rettangolo di spruzzo
    x.fillStyle = css(col, 0.06); x.fillRect(pad - fr * 2.2, pad - fr * 2.2, L.w + fr * 4.4, L.h + fr * 4.4)
    alone(x, m, col, px * 0.16, 0.45)
    puntini(x, m, col, px * 0.3, 2.2, r, D)
    x.drawImage(tinta(m, col), 0, 0)
    return { c, colate: colature(m, Math.floor(r() * 2), r).map((p) => ({ ...p, len: px * tra(r, 0.1, 0.4), w: px * 0.04, col })) }
  },

  scritta(it, k) {
    const { r, D, col } = k, fam = 'pzg-' + it.f
    const px = Math.min(260, (it.larg * D) / (misura(it.t, fam, 400, 0) / 100))
    const L = glifi(it.t, fam, px, r, { jr: 0.05, jy: 0.04, lh: 1.05 }), pad = px * 0.6
    const m = maschera(L, pad, { bordo: px * (it.spray ? 0.035 : 0.015) }), c = tela(m.width, m.height), x = ctx(c)
    if (it.spray) { alone(x, m, col, px * 0.08, 0.3); puntini(x, m, col, px * 0.1, 0.8, r, D) }
    x.drawImage(tinta(m, col), 0, 0)
    const colate = it.spray ? colature(m, 1 + Math.floor(r() * 3), r).map((p) => ({ ...p, len: px * tra(r, 0.2, 0.8), w: px * tra(r, 0.03, 0.05), col })) : []
    return { c, colate }
  },

  disegno(it, k) {
    const { r, D, col } = k, S = it.larg * D, pad = S * 0.3, c0 = tela(S + pad * 2, S + pad * 2), y = ctx(c0)
    y.translate(pad + S / 2, pad + S / 2); y.strokeStyle = y.fillStyle = '#fff'; y.lineWidth = S * 0.06; y.lineCap = y.lineJoin = 'round'
    const cuore = (s) => { y.beginPath(); y.moveTo(0, s * 0.38); y.bezierCurveTo(-s * 0.62, -s * 0.02, -s * 0.42, -s * 0.52, 0, -s * 0.2); y.bezierCurveTo(s * 0.42, -s * 0.52, s * 0.62, -s * 0.02, 0, s * 0.38); y.closePath() }
    const scrivi = (t, fam, s, yy) => { y.font = `400 ${s}px "pzg-${fam}"`; y.textAlign = 'center'; y.fillText(t, 0, yy) }
    switch (it.d) {
      case 'cuore':
        cuore(S); y.stroke()
        y.beginPath(); y.moveTo(-S * 0.55, S * 0.25); y.lineTo(S * 0.55, -S * 0.3); y.stroke()
        y.beginPath(); y.moveTo(S * 0.55, -S * 0.3); y.lineTo(S * 0.38, -S * 0.3); y.moveTo(S * 0.55, -S * 0.3); y.lineTo(S * 0.5, -S * 0.14); y.stroke()
        if (it.t) scrivi(it.t, 'marker', S * 0.17, S * 0.08)
        break
      case 'corona':
        y.beginPath(); y.moveTo(-S * 0.45, S * 0.22); y.lineTo(-S * 0.45, -S * 0.2); y.lineTo(-S * 0.22, S * 0.04); y.lineTo(0, -S * 0.34); y.lineTo(S * 0.22, S * 0.04); y.lineTo(S * 0.45, -S * 0.2); y.lineTo(S * 0.45, S * 0.22); y.closePath(); y.stroke()
        for (const [px, py] of [[-S * 0.45, -S * 0.28], [0, -S * 0.43], [S * 0.45, -S * 0.28]]) { y.beginPath(); y.arc(px, py, S * 0.05, 0, 7); y.fill() }
        break
      case 'stella': stella(y, 0, 0, S * 0.45); y.fill(); break
      case 'smile':
        y.beginPath(); y.arc(0, 0, S * 0.42, 0, 7); y.fill()
        y.globalCompositeOperation = 'destination-out'
        y.beginPath(); y.ellipse(-S * 0.14, -S * 0.1, S * 0.045, S * 0.09, 0, 0, 7); y.ellipse(S * 0.14, -S * 0.1, S * 0.045, S * 0.09, 0, 0, 7); y.fill()
        y.lineWidth = S * 0.055; y.beginPath(); y.arc(0, S * 0.02, S * 0.24, 0.25, Math.PI - 0.25); y.stroke()
        break
      case 'freccia':
        y.beginPath(); y.moveTo(-S * 0.48, S * 0.25); y.bezierCurveTo(-S * 0.2, -S * 0.35, S * 0.15, -S * 0.3, S * 0.42, S * 0.02); y.stroke()
        y.beginPath(); y.moveTo(S * 0.17, S * 0.02); y.lineTo(S * 0.44, S * 0.05); y.lineTo(S * 0.42, -S * 0.24); y.stroke()
        break
      case 'tacche':
        for (const g of [-0.25, 0.25]) { for (let i = 0; i < 4; i++) { y.beginPath(); y.moveTo(S * (g - 0.15 + i * 0.09), -S * 0.22); y.lineTo(S * (g - 0.14 + i * 0.09), S * 0.22); y.stroke() } y.beginPath(); y.moveTo(S * (g - 0.22), S * 0.14); y.lineTo(S * (g + 0.2), -S * 0.12); y.stroke() }
        break
      case 'kilroy': {
        y.lineWidth = S * 0.035
        y.beginPath(); y.moveTo(-S * 0.5, 0); y.lineTo(S * 0.5, 0); y.stroke()
        y.beginPath(); y.arc(0, 0, S * 0.2, Math.PI, 0); y.stroke()
        for (const s of [-1, 1]) { y.beginPath(); y.arc(s * S * 0.075, -S * 0.08, S * 0.04, 0, 7); y.stroke(); y.beginPath(); y.arc(s * S * 0.07, -S * 0.07, S * 0.012, 0, 7); y.fill(); for (let i = 0; i < 3; i++) { y.beginPath(); y.arc(s * S * (0.27 + i * 0.045), 0, S * 0.022, Math.PI, 0); y.stroke() } }
        y.beginPath(); y.moveTo(-S * 0.03, -S * 0.03); y.bezierCurveTo(-S * 0.06, S * 0.2, S * 0.06, S * 0.2, S * 0.03, -S * 0.03); y.stroke()
        scrivi('KILROY WAS HERE', 'marker', S * 0.1, S * 0.33)
        break
      }
    }
    const c = tela(c0.width, c0.height), x = ctx(c)
    alone(x, c0, col, S * 0.04, 0.35)
    x.drawImage(tinta(c0, col), 0, 0)
    puntini(x, c0, col, S * 0.05, 0.9, r, D)
    const colate = colature(c0, it.d === 'tacche' || it.d === 'kilroy' ? 0 : Math.floor(r() * 3), r).map((p) => ({ ...p, len: S * tra(r, 0.08, 0.3), w: S * 0.035, col }))
    return { c, colate }
  },

  adesivo(it, k) {
    const { r, D, col } = k, W = it.larg * D, pad = W * 0.12
    if (it.d === 'tondo') {
      const c = tela(W + pad * 2, W + pad * 2), x = ctx(c), R = W / 2, cx = pad + R
      x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = W * 0.04; x.shadowOffsetY = W * 0.015
      x.fillStyle = css(BIANCO); x.beginPath(); x.arc(cx, cx, R, 0, 7); x.fill(); x.shadowColor = 'transparent'
      x.fillStyle = css(col); x.beginPath(); x.arc(cx, cx, R * 0.9, 0, 7); x.fill()
      const ink = luce(col) > 58 ? NERO : BIANCO
      x.fillStyle = css(ink); x.textAlign = 'center'; x.font = `400 ${R * 0.62}px "pzg-shrik"`; x.fillText(it.t, cx, cx + R * 0.12)
      x.font = `700 ${R * 0.16}px "gg sans"`; x.fillText('pzkko.it', cx, cx + R * 0.5)
      return { c }
    }
    const H = W * 0.7, c = tela(W + pad * 2, H + pad * 2), x = ctx(c), rr = W * 0.06, angolo = Math.floor(r() * 4), s = W * tra(r, 0.08, 0.16)
    const forma = () => {
      // il rettangolo coi bordi tondi, con un angolo strappato
      const p = [[pad, pad], [pad + W, pad], [pad + W, pad + H], [pad, pad + H]]
      x.beginPath()
      p.forEach(([px, py], i) => {
        const [nx, ny] = p[(i + 1) % 4]
        if (i === angolo) { const [qx, qy] = p[(i + 3) % 4]; x.lineTo(px + Math.sign(qx - px) * s, py + Math.sign(qy - py) * s * 0.9); x.lineTo(px + Math.sign(nx - px) * s * 1.1, py + Math.sign(ny - py) * s) } else x.arcTo(px, py, nx, ny, rr)
      })
      x.closePath()
    }
    x.save(); x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = W * 0.035; x.shadowOffsetY = W * 0.012
    forma(); x.fillStyle = '#fbfaf6'; x.fill(); x.restore()
    forma(); x.save(); x.clip()
    x.fillStyle = css(col); x.fillRect(pad, pad, W, H * 0.34); x.fillRect(pad, pad + H * 0.9, W, H * 0.1)
    const ink = luce(col) > 62 ? NERO : BIANCO
    x.fillStyle = css(ink); x.textAlign = 'center'
    x.font = `800 ${H * 0.17}px "gg sans"`; x.fillText('HELLO', pad + W / 2, pad + H * 0.19)
    x.font = `600 ${H * 0.075}px "gg sans"`; x.fillText('my name is', pad + W / 2, pad + H * 0.29)
    const nome = 'pzg-marker', np = Math.min(H * 0.34, (W * 0.8) / (misura(it.t, nome, 400, 0) / 100))
    x.save(); x.translate(pad + W / 2, pad + H * 0.73); x.rotate(tra(r, -0.08, 0.05)); x.fillStyle = '#16120f'; x.font = `400 ${np}px "${nome}"`; x.fillText(it.t, 0, 0); x.restore()
    const gr = x.createLinearGradient(pad, pad, pad + W, pad + H); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,.08)')
    x.fillStyle = gr; x.fillRect(pad, pad, W, H)
    x.restore()
    return { c }
  },

  img(it, k) {
    const im = immagini.get(it.src)
    if (!im || !im.naturalWidth) return null
    const W = it.larg * k.D, H = (W * im.naturalHeight) / im.naturalWidth, c = tela(W, H)
    ctx(c).drawImage(im, 0, 0, c.width, c.height)
    return { c: it.c === 'f' ? c : tinta(c, k.col) }
  },
}

// la nuvola di colore dietro i pezzi, con le bolle bianche
function nuvola(x, w, h, pad, px, col, r) {
  const m = tela(w, h), y = ctx(m); y.fillStyle = '#fff'
  for (let i = 0; i < 24; i++) { y.beginPath(); y.arc(pad * 0.55 + r() * (w - pad * 1.1), pad * 0.65 + r() * (h - pad * 1.3), px * tra(r, 0.16, 0.42), 0, 7); y.fill() }
  alone(x, m, col, px * 0.3, 0.78)
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = Math.max(1, px * 0.025)
  for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(pad * 0.5 + r() * (w - pad), pad * 0.5 + r() * (h - pad), px * tra(r, 0.04, 0.12), 0, 7); x.stroke() }
}

// le gomme da masticare: fresche, vecchie e nere, schiacciate
const GOMME = [
  [['#ffb3d1', '#f07aa8', '#b8456f'], 3], [['#e7b9c2', '#c48d99', '#8e5f69'], 2], [['#b5b0aa', '#8b8681', '#5b5753'], 3],
  [['#5a5551', '#3a3633', '#1e1b19'], 4], [['#fbf8f0', '#e2dccf', '#b0a99b'], 2], [['#c8f5e1', '#87d9b7', '#4f9c7f'], 1], [['#c9e2ff', '#86b5f2', '#4d78b3'], 1],
]
function gomma(x, g, D) {
  const r = rng(g.seme), X = g.x * D, Y = g.y * D, R = (g.d * D) / 2
  let tot = GOMME.reduce((s, [, p]) => s + p, 0) * r(), col = GOMME[0][0]
  for (const [c, p] of GOMME) { tot -= p; if (tot <= 0) { col = c; break } }
  const sq = tra(r, 0.7, 1), n = 12, pts = []
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = R * tra(r, 0.78, 1.18); pts.push([X + Math.cos(a) * rr, Y + Math.sin(a) * rr * sq]) }
  const forma = () => { x.beginPath(); for (let i = 0; i < n; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n]; if (!i) x.moveTo((ax + bx) / 2, (ay + by) / 2); else x.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2) } const [ax, ay] = pts[0], [bx, by] = pts[1]; x.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2); x.closePath() }
  x.save(); x.shadowColor = 'rgba(0,0,0,.38)'; x.shadowBlur = R * 0.6; x.shadowOffsetY = R * 0.28
  const gr = x.createRadialGradient(X - R * 0.3, Y - R * 0.35 * sq, R * 0.1, X, Y, R * 1.15)
  gr.addColorStop(0, col[0]); gr.addColorStop(0.55, col[1]); gr.addColorStop(1, col[2])
  forma(); x.fillStyle = gr; x.fill(); x.restore()
  x.fillStyle = `rgba(255,255,255,${sq > 0.85 ? 0.5 : 0.25})`; x.beginPath(); x.ellipse(X - R * 0.35, Y - R * 0.35 * sq, R * 0.24, R * 0.14, -0.6, 0, 7); x.fill()
  x.fillStyle = 'rgba(30,20,15,.35)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(X + tra(r, -0.6, 0.6) * R, Y + tra(r, -0.5, 0.5) * R * sq, Math.max(0.6, R * 0.05), 0, 7); x.fill() }
}

// un pezzo di lamiera ripassato di vernice sopra i graffiti vecchi
function lavato(x, b, K, H, D) {
  const r = rng(b.seme), fondo = mix(K.P, K.A, Math.max(0, Math.min(1, b.y / H))), col = mix(mix(fondo, [128, 124, 120], 0.28), NERO, 0.06)
  const X = b.x * D, Y = b.y * D, w = b.w * D, h = b.h * D, pts = [], passo = Math.max(8, w / 10)
  for (let i = 0; i <= w; i += passo) pts.push([X + i, Y + tra(r, -1, 1) * h * 0.04])
  for (let i = 0; i <= h; i += passo) pts.push([X + w + tra(r, -1, 1) * w * 0.03, Y + i])
  for (let i = w; i >= 0; i -= passo) pts.push([X + i, Y + h + tra(r, -1, 1) * h * 0.05])
  for (let i = h; i >= 0; i -= passo) pts.push([X + tra(r, -1, 1) * w * 0.03, Y + i])
  x.beginPath(); pts.forEach(([a, c]) => x.lineTo(a, c)); x.closePath(); x.fillStyle = css(col, 0.93); x.fill()
  x.save(); x.clip()
  for (let yy = Y; yy < Y + h; yy += Math.max(2, D * 3)) if (r() < 0.4) { x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; x.fillRect(X, yy, w, D * tra(r, 2, 6)) }
  x.restore()
}

// ─── il piano del muro: dove sta ogni cosa (sempre lo stesso, dato il formato) ─
function progetta(W, H) {
  const r = rng(SEME), N = W < 700 ? 34 : 50, cella = Math.sqrt((W * H) / N)
  const cols = Math.max(3, Math.round(W / cella)), righe = Math.max(3, Math.ceil(N / cols)), posti = []
  for (let j = 0; j < righe; j++) for (let i = 0; i < cols; i++) posti.push([((i + 0.1 + r() * 0.8) / cols) * W, ((j + 0.1 + r() * 0.8) / righe) * H])
  mescola(posti, r)
  // il 70 % col tema anche sul telefono
  const nt = Math.round(N * 0.7), tema = mescola(CATALOGO.filter((d) => d.c === 't'), r).slice(0, nt), altri = mescola(CATALOGO.filter((d) => d.c !== 't'), r).slice(0, N - nt)
  const pezzi = mescola([...tema, ...altri], r).map((d, i) => ({
    ...d, x: posti[i][0], y: posti[i][1], larg: d.w * cella * tra(r, 0.85, 1.15),
    rot: (r() * 2 - 1) * ROT[d.k] - (d.k === 'tag' ? 0.05 : 0), skew: d.k === 'tag' ? tra(r, -14, 4) : 0, seme: (r() * 2 ** 31) | 0, vecchio: r() < 0.25,
  }))
  pezzi.sort((a, b) => (b.vecchio - a.vecchio) || (PRIMA[a.k] - PRIMA[b.k]))
  const lavati = Array.from({ length: 3 }, () => ({ x: r() * W * 0.9, y: r() * H * 0.9, w: cella * tra(r, 1.2, 2.2), h: cella * tra(r, 0.5, 1.1), seme: (r() * 2 ** 31) | 0 }))
  const gomme = Array.from({ length: W < 700 ? 12 : 22 }, () => ({ x: r() * W, y: H * (0.15 + 0.85 * Math.sqrt(r())), d: cella * tra(r, 0.06, 0.13), seme: (r() * 2 ** 31) | 0 }))
  return { W, H, cella, pezzi, lavati, gomme }
}

// ─── le risorse: caratteri e foto, una volta sola ────────────────────────────
const caratteri = new Map(), immagini = new Map()
function carattere(k) {
  if (!caratteri.has(k)) {
    const f = new FontFace('pzg-' + k, `url(/fonts/${CARATTERI[k]}.woff2)`)
    caratteri.set(k, f.load().then((ff) => { document.fonts.add(ff) }).catch(() => {}))
  }
  return caratteri.get(k)
}
function immagine(src) {
  if (!immagini.has(src)) { const im = new Image(); im.decoding = 'async'; im.src = src; immagini.set(src, im) }
  const im = immagini.get(src)
  return im.complete ? Promise.resolve() : im.decode().catch(() => {})
}
const entro = (p, ms) => Promise.race([p, new Promise((ok) => setTimeout(ok, ms))])
async function risorse(piano) {
  const attese = [document.fonts.load('800 20px "gg sans"'), document.fonts.load('600 20px "gg sans"'), carattere('marker'), carattere('shrik')]
  for (const p of piano.pezzi) { if (p.f) attese.push(carattere(p.f)); if (p.src) attese.push(immagine(p.src)) }
  attese.push(immagine('/art/muro.webp'))
  await entro(Promise.all(attese), 6000)
}

// l'ombra delle doghe, ricavata una volta dalla foto della lamiera: nero dove la lamiera è più scura della media,
// bianco dove è più chiara; si stende sopra la vernice (source-atop) e la vernice segue le pieghe
let ombraDoghe = null
function doghe() {
  if (ombraDoghe) return ombraDoghe
  const im = immagini.get('/art/muro.webp')
  if (!im || !im.naturalWidth) return null
  const w = 1600, h = Math.round((w * im.naturalHeight) / im.naturalWidth), c = tela(w, h), x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(im, 0, 0, w, h)
  const id = x.getImageData(0, 0, w, h), d = id.data
  let somma = 0
  for (let i = 0; i < d.length; i += 4) somma += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
  const media = somma / (d.length / 4)
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 - media, a = Math.min(255, Math.abs(v) * 2.4)
    d[i] = d[i + 1] = d[i + 2] = v < 0 ? 0 : 255; d[i + 3] = a
  }
  x.putImageData(id, 0, 0)
  return (ombraDoghe = c)
}
// la larghezza della lamiera la decide sfondo.css (background-size): la tela la legge da lì, così le doghe combaciano
function largDoghe() { const v = parseFloat(getComputedStyle(amb).backgroundSize); return Number.isFinite(v) && v > 0 ? v : 1600 }

// ─── il disegno ──────────────────────────────────────────────────────────────
let giro = 0, ultimo = null, pianoUsato = null
const pausa = () => new Promise((ok) => setTimeout(ok, 0))
async function disegna() {
  const mio = ++giro
  const W = amb.clientWidth || innerWidth, H = amb.clientHeight || innerHeight, D = Math.min(2, devicePixelRatio || 1)
  const K = colori(), piano = progetta(W, H)
  await risorse(piano)
  if (mio !== giro) return
  const c = tela(W * D, H * D), x = ctx(c)
  let t0 = performance.now()
  const respira = async () => { if (performance.now() - t0 > 12) { await pausa(); t0 = performance.now() } return mio === giro }
  const posa = (it, P, a) => {
    const M = new DOMMatrix().translateSelf(it.x * D, it.y * D).rotateSelf((it.rot * 180) / Math.PI).skewXSelf(it.skew || 0).translateSelf(-P.c.width / 2, -P.c.height / 2)
    x.setTransform(M); x.globalAlpha = a; x.drawImage(P.c, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1
    for (const d of P.colate || []) { const p = M.transformPoint(new DOMPoint(d.x, d.y - d.w)); colata(x, p.x, p.y, d.len, d.w, d.col, a) }
  }
  let lavatiFatti = false
  for (const it of piano.pezzi) {
    if (!it.vecchio && !lavatiFatti) { for (const b of piano.lavati) lavato(x, b, K, H, D); lavatiFatti = true }
    const r = rng(it.seme), fondo = mix(K.P, K.A, Math.max(0, Math.min(1, it.y / H)))
    const lista = it.c === 't' ? K.tema : LIBERI
    const col = stacca(lista, fondo, r), col2 = stacca(lista, fondo, r, 12, col), col3 = stacca(it.c === 't' ? K.tema : LIBERI, fondo, r, 8)
    try {
      const P = FARE[it.k](it, { r, D, col, col2, col3 })
      if (P) posa(it, P, it.vecchio ? tra(r, 0.5, 0.72) : tra(r, 0.9, 1))
    } catch (e) { /* un pezzo che non viene non ferma il muro */ }
    if (!(await respira())) return
  }
  // le pieghe della lamiera sopra la vernice
  const om = doghe()
  if (om) {
    const pat = x.createPattern(om, 'repeat'), s = (largDoghe() * D) / om.width
    pat.setTransform(new DOMMatrix().scaleSelf(s, s))
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = pat; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'source-over'
  }
  for (const g of piano.gomme) gomma(x, g, D)
  if (mio !== giro) return
  // dentro: la tela nuova sfuma sopra la vecchia, poi la vecchia se ne va
  c.className = 'ambient__muro'
  c.setAttribute('aria-hidden', 'true')
  const vecchia = amb.querySelector('canvas.ambient__muro.is-on')
  amb.appendChild(c)
  requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('is-on')))
  if (vecchia) setTimeout(() => vecchia.remove(), 1400)
  ultimo = { W, H, D, chiave: K.chiave }
  pianoUsato = piano
}

let timer = 0
const programma = (ms) => { clearTimeout(timer); timer = setTimeout(() => disegna().catch(() => {}), ms) }

if (amb) {
  // legati: il tema di Discord cambia (app.js riscrive --p/--a), il muro si ridipinge
  new MutationObserver(() => { if (ultimo && colori().chiave !== ultimo.chiave) programma(120) }).observe(root, { attributes: true, attributeFilter: ['style'] })
  addEventListener('resize', () => {
    if (!ultimo) return
    const W = amb.clientWidth, H = amb.clientHeight, D = Math.min(2, devicePixelRatio || 1)
    if (Math.abs(W - ultimo.W) > 60 || H > ultimo.H * 1.12 || H < ultimo.H * 0.75 || D !== ultimo.D) programma(400)
  })
  const via = () => (window.requestIdleCallback ? requestIdleCallback(() => programma(0), { timeout: 1500 }) : programma(200))
  if (document.readyState === 'complete') via(); else addEventListener('load', via, { once: true })
  window.pzkkoSfondo = { ridisegna: () => programma(0), piano: () => pianoUsato }
}
