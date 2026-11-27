// miniature/plotter.js — il plotter da tavolo (27.11.2026).
// Le curve vere di games/plotter/plotter.worker.js (flusso, armoniche, rose, truchet: stesso generatore col seme,
// stesso rumore, stesse formule) tracciate dal pennino su un foglio 10:7 sotto il carrello. Finito il disegno arriva
// il timbro «pronto», poi il foglio esce e ne entra uno nuovo con un altro algoritmo. Un foglio ogni 10 s.
// Col mouse sopra: il carrello corre, l'evidenziatore passa sul cartellino e sul foglio si vede la matematica
// (il campo del rumore, la griglia delle piastrelle, i cerchi delle rose, gli assi dei pendoli).

const W = 1000, H = 700, CARTA = '#f4efe1', TAU = Math.PI * 2
const PALETTE = {
  inchiostro: ['#161616', '#b3121f', '#1446a0', '#c98a00'],
  botanica: ['#14532d', '#65a30d', '#0e7490', '#161616'],
  sera: ['#5b21b6', '#c026d3', '#e8501c', '#7a1fa2'],
}
const SPIEGA = { flusso: 'mille fili seguono un campo di rumore', armoniche: 'quattro pendoli per curva', truchet: 'piastrelle con due archi', rose: 'rose di Grandi sovrapposte' }
// i quattro fogli del giro: [algoritmo, seme, densità, inchiostro]
const FOGLI = [
  ['flusso', 2611, 0.15, 'inchiostro'],
  ['armoniche', 12, 0.15, 'sera'],
  ['rose', 1927, 0.3, 'botanica'],
  ['truchet', 77, 0.3, 'inchiostro'],
]
const DURATA = 10, ENTRA = 0.8, INIZIO = 0.95, FINE = 7.3, TIMBRO = 7.45

// ── il motore, copiato dal worker (solo i segmenti: i tracciati SVG qui non servono) ──
function rng(seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hash2(x, y, seme) {
  let h = (seme ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function noise(x, y, seme) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, seme), b = hash2(xi + 1, yi, seme)
  const c = hash2(xi, yi + 1, seme), d = hash2(xi + 1, yi + 1, seme)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const angoloFlusso = (x, y, seme) => noise(x * 0.004, y * 0.004, seme) * TAU * 2 + noise(x * 0.0009, y * 0.0009, seme + 7) * 1.5
function flusso(rand, densita, seme, S) {
  const n = Math.round(260 + densita * 740), passi = Math.round(90 + densita * 150), margine = 26
  for (let i = 0; i < n; i++) {
    let x = margine + rand() * (W - 2 * margine)
    let y = margine + rand() * (H - 2 * margine)
    const colore = i % 4
    for (let s = 0; s < passi; s++) {
      const a = angoloFlusso(x, y, seme)
      const nx = x + Math.cos(a) * 2.6, ny = y + Math.sin(a) * 2.6
      if (nx < margine || nx > W - margine || ny < margine || ny > H - margine) break
      S.push(x, y, nx, ny, colore, 0.75)
      x = nx; y = ny
    }
  }
}
function armoniche(rand, densita, S) {
  const curve = Math.round(3 + densita * 4)
  const cx = W / 2, cy = H / 2
  for (let c = 0; c < curve; c++) {
    const f1 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const f2 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const f3 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const f4 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const p1 = rand() * TAU, p2 = rand() * TAU, p3 = rand() * TAU, p4 = rand() * TAU
    const d1 = 0.004 + rand() * 0.012, d2 = 0.004 + rand() * 0.012
    const A = W * (0.16 + rand() * 0.1), B = H * (0.18 + rand() * 0.12)
    const colore = c % 4, passi = 2400
    let px = 0, py = 0
    for (let i = 0; i < passi; i++) {
      const t = (i / passi) * 160
      const e1 = Math.exp(-d1 * t), e2 = Math.exp(-d2 * t)
      const x = cx + (Math.sin(f1 * t + p1) * 0.6 + Math.sin(f2 * t + p2) * 0.4) * A * e1
      const y = cy + (Math.sin(f3 * t + p3) * 0.6 + Math.sin(f4 * t + p4) * 0.4) * B * e2
      if (i) S.push(px, py, x, y, colore, 1)
      px = x; py = y
    }
  }
}
function truchet(rand, densita, S) {
  const cols = Math.round(9 + densita * 7)
  const righe = Math.max(5, Math.round(cols * H / W))
  const cw = W / cols, ch = H / righe
  const s = Math.min(cw, ch) * 0.94
  for (let r = 0; r < righe; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + (cw - s) / 2, y = r * ch + (ch - s) / 2
      const giro = rand() < 0.5
      const colore = (r + c) % 4
      const T = [x + s / 2, y], R = [x + s, y + s / 2], B = [x + s / 2, y + s], L = [x, y + s / 2]
      const archi = giro ? [[T, R], [L, B]] : [[L, T], [B, R]]
      const chiave = (p) => (p[0] === x ? 'L' : p[0] === x + s ? 'R' : (p[1] === y ? 'T' : 'B'))
      const centri = { LT: [x, y], TR: [x + s, y], RB: [x + s, y + s], BL: [x, y + s], TL: [x, y], RT: [x + s, y], BR: [x + s, y + s], LB: [x, y + s] }
      for (const [p0, p1] of archi) {
        const centro = centri[chiave(p0) + chiave(p1)]
        const raggio = s / 2
        const a0 = Math.atan2(p0[1] - centro[1], p0[0] - centro[0])
        const a1 = Math.atan2(p1[1] - centro[1], p1[0] - centro[0])
        let delta = (a1 - a0) % TAU
        if (delta < 0) delta += TAU
        const verso = Math.abs(delta - Math.PI / 2) < 0.01 ? 1 : 0
        const a2 = a0 + (verso ? Math.PI / 2 : -Math.PI / 2)
        let px = p0[0], py = p0[1]
        for (let k = 1; k <= 18; k++) {
          const aa = a0 + (a2 - a0) * (k / 18)
          const px2 = centro[0] + Math.cos(aa) * raggio, py2 = centro[1] + Math.sin(aa) * raggio
          S.push(px, py, px2, py2, colore, 1.1)
          px = px2; py = py2
        }
      }
    }
  }
}
function rose(rand, densita, S) {
  const curve = Math.round(10 + densita * 18)
  const cx = W / 2, cy = H / 2, scala = Math.min(W, H) * 0.42
  for (let c = 0; c < curve; c++) {
    const k = 2 + Math.floor(rand() * 7)
    const fase = rand() * TAU
    const colore = c % 4, passi = 480
    let px = 0, py = 0
    for (let i = 0; i <= passi; i++) {
      const t = (i / passi) * TAU
      const r = scala * Math.cos(k * t + fase) * (0.72 + 0.28 * Math.sin(t * 3 + c))
      const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r
      if (i) S.push(px, py, x, y, colore, 1)
      px = x; py = y
    }
  }
}
// i fogli calcolati restano per tutta la pagina: lo stesso seme dà lo stesso disegno, anche in due copertine
const calcolati = new Map()
function foglio(n) {
  if (!calcolati.has(n)) {
    const [algo, seme, densita] = FOGLI[n]
    const S = [], rand = rng(seme)
    if (algo === 'armoniche') armoniche(rand, densita, S)
    else if (algo === 'truchet') truchet(rand, densita, S)
    else if (algo === 'rose') rose(rand, densita, S)
    else flusso(rand, densita, seme, S)
    calcolati.set(n, Float32Array.from(S))
  }
  return calcolati.get(n)
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, ease, smooth } = kit
  await Promise.all([kit.font(m.font, 700), kit.font('Special Elite'), kit.font('Permanent Marker'), kit.font('Anton')])
  const it = (n) => n.toLocaleString('it-IT')

  let L = null, fondo = null, barra = null, ombraBarra = null, carrello = null
  // due fogli: quello sul piano (A) e quello che esce (B)
  const tele = [{ c: null, g: null, n: -1, fatti: 0 }, { c: null, g: null, n: -1, fatti: 0 }]
  let orologio = 0, giro = -1, penna = null

  function misure(w, h) {
    const bx = Math.max(4, w * 0.03), by = Math.max(4, h * 0.05)
    const ix = bx, iy = by, iw = w - 2 * bx, ih = h - by - Math.max(6, h * 0.065)
    const ph = ih * 0.8, pw = ph * W / H
    const px = ix + iw - pw - iw * 0.04, py = iy + (ih - ph) * 0.55
    const fs = Math.min(9.6, 88 / Math.max(...m.titolo.split(' ').map((p) => p.length || 1))) * w / 100
    L = { w, h, ix, iy, iw, ih, pw, ph, px, py, s: pw / W, fs }
    fondo = kit.strato(w, h, m.dpr, disegnaFondo)
    const bh = Math.max(5, h * 0.045), span = pw + iw * 0.06
    L.bh = bh; L.span = span
    barra = kit.strato(span, bh, m.dpr, (g, bw, bhh) => {
      const l = g.createLinearGradient(0, 0, 0, bhh)
      l.addColorStop(0, '#e9ece8'); l.addColorStop(0.35, '#b9bdb8'); l.addColorStop(0.5, '#8f948e'); l.addColorStop(1, '#5d625c')
      g.fillStyle = l; kit.tondo(g, 0, 0, bw, bhh, bhh * 0.25); g.fill()
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, bhh * 0.48, bw, Math.max(1, bhh * 0.08))
      // le due testate con le viti
      for (const x of [0, bw - bhh * 1.3]) {
        g.fillStyle = '#2a2e26'; kit.tondo(g, x, -bhh * 0.1, bhh * 1.3, bhh * 1.2, 2); g.fill()
        g.fillStyle = '#8f948e'; g.beginPath(); g.arc(x + bhh * 0.65, bhh * 0.5, bhh * 0.16, 0, TAU); g.fill()
      }
    })
    ombraBarra = kit.strato(span + 30, bh + 30, m.dpr, (g, bw, bhh) => {
      g.shadowColor = 'rgba(40,30,10,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 0
      g.fillStyle = 'rgba(40,30,10,.5)'; g.fillRect(15, 15, bw - 30, bhh - 30)
    })
    const cw = bh * 1.7
    carrello = kit.strato(cw + 20, cw * 1.25 + 20, m.dpr, (g) => {
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 5; g.shadowOffsetY = 2
      const l = g.createLinearGradient(10, 0, 10 + cw, 0)
      l.addColorStop(0, '#3a3f38'); l.addColorStop(0.5, '#23271f'); l.addColorStop(1, '#151812')
      g.fillStyle = l; kit.tondo(g, 10, 10, cw, cw * 1.25, cw * 0.18); g.fill()
      g.shadowColor = 'transparent'
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(12, 12, cw - 4, cw * 0.2)
    })
    L.cw = cw
    for (const tl of tele) {
      tl.c = document.createElement('canvas')
      tl.c.width = Math.round(pw * m.dpr); tl.c.height = Math.round(ph * m.dpr)
      tl.g = tl.c.getContext('2d')
      const n = tl.n, fatti = tl.fatti, timbrato = tl.timbro
      tl.n = -1; tl.fatti = 0
      if (n >= 0) { prepara(tl, n); traccia(tl, fatti); if (timbrato) timbra(tl) }
    }
  }

  function disegnaFondo(g, w, h) {
    g.fillStyle = '#f2eee3'; g.fillRect(0, 0, w, h)
    const { ix, iy, iw, ih } = L
    g.save()
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = w * 0.03; g.shadowOffsetY = w * 0.012
    g.fillStyle = '#fffdf6'
    const b = Math.max(3, w * 0.014)
    g.fillRect(ix - b, iy - b, iw + 2 * b, ih + b * 2.3)
    g.restore()
    // il piano del plotter: il cartone grigio-sabbia del banco, con una griglia da tappetino da taglio
    const l = g.createLinearGradient(0, iy, 0, iy + ih)
    l.addColorStop(0, '#e3dccb'); l.addColorStop(1, '#cfc7b3')
    g.fillStyle = l; g.fillRect(ix, iy, iw, ih)
    g.strokeStyle = 'rgba(60,70,50,.10)'; g.lineWidth = 1
    g.beginPath()
    const passo = iw / 32
    for (let x = ix; x <= ix + iw; x += passo) { g.moveTo(x, iy); g.lineTo(x, iy + ih) }
    for (let y = iy; y <= iy + ih; y += passo) { g.moveTo(ix, y); g.lineTo(ix + iw, y) }
    g.stroke()
    // le due guide del carrello, a destra e a sinistra del foglio
    const { px, py, pw, ph } = L
    for (const x of [px - iw * 0.03, px + pw + iw * 0.03]) {
      g.save()
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 4; g.shadowOffsetX = 2; g.shadowOffsetY = 2
      const r = g.createLinearGradient(x - 3, 0, x + 3, 0)
      r.addColorStop(0, '#5d625c'); r.addColorStop(0.4, '#d9ddd8'); r.addColorStop(1, '#4a4f48')
      g.fillStyle = r
      g.fillRect(x - Math.max(1.5, w * 0.005), py - ph * 0.06, Math.max(3, w * 0.01), ph * 1.12)
      g.restore()
    }
    // il vetro del banco: ombra interna
    g.save()
    g.beginPath(); g.rect(ix, iy, iw, ih); g.clip()
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = w * 0.025
    g.strokeStyle = '#000'; g.lineWidth = w * 0.03
    g.strokeRect(ix - w * 0.015, iy - w * 0.015, iw + w * 0.03, ih + w * 0.03)
    g.restore()
  }

  // il foglio nuovo: carta, segni di registro, la targhetta dell'app
  function prepara(tl, n) {
    const g = tl.g, { pw, ph } = L, d = m.dpr
    g.setTransform(d, 0, 0, d, 0, 0)
    g.fillStyle = CARTA; g.fillRect(0, 0, pw, ph)
    g.strokeStyle = 'rgba(22,22,22,.22)'; g.lineWidth = 0.8
    const k = Math.max(3, pw * 0.02), o = pw * 0.025
    for (const [cx, cy] of [[o, o], [pw - o, o], [o, ph - o], [pw - o, ph - o]]) {
      g.beginPath(); g.moveTo(cx - k, cy); g.lineTo(cx + k, cy); g.moveTo(cx, cy - k); g.lineTo(cx, cy + k); g.stroke()
    }
    const [algo, seme, densita] = FOGLI[n]
    if (pw > 140) {
      g.fillStyle = 'rgba(22,22,22,.5)'
      g.font = `400 ${Math.max(6, pw * 0.028)}px "Special Elite"`
      g.textBaseline = 'alphabetic'; g.textAlign = 'left'
      g.fillText(`${algo} · seme ${seme} · ${densita.toFixed(2)}`, pw * 0.035, ph - ph * 0.035)
    }
    tl.n = n; tl.fatti = 0; tl.timbro = false
  }
  // il pennino: aggiunge al foglio i segmenti fino a «fino» (solo quelli nuovi, il resto è già sulla carta)
  function traccia(tl, fino) {
    const S = foglio(tl.n), tot = S.length / 6
    fino = Math.min(tot, fino)
    if (fino <= tl.fatti) return
    const g = tl.g, s = L.s, d = m.dpr, pal = PALETTE[FOGLI[tl.n][3]]
    g.setTransform(d * s, 0, 0, d * s, 0, 0)
    g.lineCap = 'round'; g.lineJoin = 'round'
    let colore = -1
    for (let i = tl.fatti; i < fino; i++) {
      const o = i * 6
      if (S[o + 4] !== colore) {
        if (colore >= 0) g.stroke()
        colore = S[o + 4]
        g.strokeStyle = pal[colore] || '#161616'
        g.lineWidth = Math.max(0.5 / s, S[o + 5] * 1.15)
        g.beginPath()
      }
      g.moveTo(S[o], S[o + 1]); g.lineTo(S[o + 2], S[o + 3])
    }
    if (colore >= 0) g.stroke()
    tl.fatti = fino
  }

  // il timbro finisce sulla carta: esce col suo foglio
  function timbra(tl) {
    const { pw, ph } = L, d = tl.c.width / pw
    tl.g.setTransform(d, 0, 0, d, 0, 0)
    tl.g.save()
    tl.g.globalAlpha = 0.9
    tl.g.globalCompositeOperation = 'multiply'
    kit.timbro(tl.g, 'pronto', pw * 0.8, ph * 0.84, Math.max(14, pw * 0.16), -0.22, '#b3121f', 1)
    tl.g.restore()
    tl.timbro = true
  }

  // la matematica sotto il disegno (col mouse sopra)
  function mostraMatematica(g, n, ox, oy, a) {
    const [algo, seme, densita] = FOGLI[n], s = L.s
    g.save()
    g.translate(ox, oy); g.scale(s, s)
    g.globalAlpha = a
    g.strokeStyle = 'rgba(20,70,160,.55)'; g.lineWidth = 0.9 / s
    g.beginPath()
    if (algo === 'flusso') {
      for (let y = 50; y < H; y += 70) for (let x = 50; x < W; x += 70) {
        const an = angoloFlusso(x, y, seme)
        const dx = Math.cos(an) * 24, dy = Math.sin(an) * 24
        g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy)
        g.moveTo(x + dx, y + dy); g.lineTo(x + dx - Math.cos(an - 0.5) * 9, y + dy - Math.sin(an - 0.5) * 9)
      }
    } else if (algo === 'truchet') {
      const cols = Math.round(9 + densita * 7), righe = Math.max(5, Math.round(cols * H / W))
      for (let c = 0; c <= cols; c++) { g.moveTo(c * W / cols, 0); g.lineTo(c * W / cols, H) }
      for (let r = 0; r <= righe; r++) { g.moveTo(0, r * H / righe); g.lineTo(W, r * H / righe) }
    } else if (algo === 'rose') {
      const sc = Math.min(W, H) * 0.42
      for (const k of [0.25, 0.5, 0.75, 1]) { g.moveTo(W / 2 + sc * k, H / 2); g.arc(W / 2, H / 2, sc * k, 0, TAU) }
      for (let k = 0; k < 12; k++) { g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + Math.cos(k * TAU / 12) * sc, H / 2 + Math.sin(k * TAU / 12) * sc) }
    } else {
      g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.moveTo(W / 2, 0); g.lineTo(W / 2, H)
      for (const k of [0.16, 0.26]) g.rect(W / 2 - W * k, H / 2 - H * (k + 0.02), W * k * 2, H * (k + 0.02) * 2)
    }
    g.stroke()
    g.restore()
  }

  function cartellino(g, n, stato, k, su) {
    const { w, h } = L
    if (w < 300) return
    const [algo] = FOGLI[n]
    const cw = L.px - L.ix - w * 0.065, ch = h * 0.42
    const cx = L.ix + w * 0.03 + cw / 2, cy = L.iy + L.ih * 0.66
    kit.con(g, cx, cy, -0.035 + 0.01 * Math.sin(k * 0.5), 1, () => {
      g.fillStyle = 'rgba(40,30,10,.25)'; g.fillRect(-cw / 2 + 2, -ch / 2 + 4, cw, ch)
      g.fillStyle = '#fffdf6'; g.fillRect(-cw / 2, -ch / 2, cw, ch)
      // le righe del quaderno
      g.strokeStyle = 'rgba(20,70,160,.12)'; g.lineWidth = 1
      g.beginPath()
      for (let y = -ch / 2 + ch * 0.3; y < ch / 2; y += ch * 0.155) { g.moveTo(-cw / 2 + 4, y); g.lineTo(cw / 2 - 4, y) }
      g.stroke()
      kit.nastro(g, 0, -ch / 2, cw * 0.42, ch * 0.13, 0.04)
      const f1 = Math.min(ch * 0.2, cw * 0.17)
      g.font = `400 ${f1}px "Permanent Marker"`
      const tw = g.measureText(algo).width
      if (su > 0.01) kit.evidenzia(g, -cw / 2 + cw * 0.08 - 2, -ch / 2 + ch * 0.13, tw + 6, f1 * 1.05, su)
      g.fillStyle = '#b3121f'; g.textAlign = 'left'; g.textBaseline = 'top'
      g.fillText(algo, -cw / 2 + cw * 0.08, -ch / 2 + ch * 0.12)
      // la macchina da scrivere: la spiegazione dell'app su due righe al massimo, poi lo stato
      const f2 = Math.max(6, Math.min(ch * 0.105, cw * 0.08))
      g.font = `400 ${f2}px "Special Elite"`
      const righe = [''], largo = cw * 0.84
      for (const p of SPIEGA[algo].split(' ')) {
        const prova = righe[righe.length - 1] ? `${righe[righe.length - 1]} ${p}` : p
        if (g.measureText(prova).width > largo && righe[righe.length - 1]) righe.push(p)
        else righe[righe.length - 1] = prova
      }
      g.fillStyle = '#5a544c'
      righe.slice(0, 2).forEach((r, i) => g.fillText(r, -cw / 2 + cw * 0.08, -ch / 2 + ch * (0.43 + i * 0.155)))
      g.fillStyle = stato.endsWith('pronto') ? '#23864a' : '#161616'
      let fs3 = f2
      if (g.measureText(stato).width > largo) { fs3 = f2 * largo / g.measureText(stato).width; g.font = `400 ${fs3}px "Special Elite"` }
      g.fillText(stato, -cw / 2 + cw * 0.08, -ch / 2 + ch * 0.75)
      // le quattro punte del giro: i colori di questo foglio
      const pal = PALETTE[FOGLI[n][3]]
      for (let i = 0; i < 4; i++) {
        const x = cw / 2 - cw * 0.09 - (3 - i) * ch * 0.085, y = ch / 2 - ch * 0.1
        g.fillStyle = pal[i]; g.beginPath(); g.arc(x, y, ch * 0.03, 0, TAU); g.fill()
      }
    })
  }

  return {
    titolo: false,
    fermo: 6.5,
    ridimensiona(w, h) { misure(w, h) },
    frame(t, dt) {
      const { w, h } = m
      if (!L || L.w !== w || L.h !== h) misure(w, h)
      const g = m.g
      orologio += dt * (1 + 1.1 * m.su)
      const gi = Math.floor(orologio / DURATA)
      const u = orologio - gi * DURATA
      const n = ((gi % FOGLI.length) + FOGLI.length) % FOGLI.length
      const [A, B] = tele
      if (gi !== giro) {
        // il foglio di prima va in uscita, finito; sul piano entra quello nuovo
        giro = gi
        const prima = (n + FOGLI.length - 1) % FOGLI.length
        if (A.n === prima) { tele[0] = B; tele[1] = A } else { prepara(B, prima) }
        const uscente = tele[1]
        traccia(uscente, Infinity)
        if (!uscente.timbro) timbra(uscente)
        prepara(tele[0], n)
      }
      const cur = tele[0], vec = tele[1]
      const S = foglio(n), tot = S.length / 6
      const k = clamp((u - INIZIO) / (FINE - INIZIO))
      const voluti = Math.floor(tot * k)
      traccia(cur, voluti)

      // dove sono i due fogli
      const entra = ease.out(clamp(u / ENTRA))
      const esce = ease.in(clamp(u / (ENTRA * 0.9)))
      const { px, py, pw, ph, s } = L
      const colpo = Math.max(0, 1 - Math.abs(u - TIMBRO - 0.3) * 6)
      const ay = py - (1 - entra) * (ph + L.iy + 10) + colpo * ph * 0.012, ar = (1 - entra) * 0.06 + colpo * 0.004
      const bx = px - esce * (pw + px + 20), br = -esce * 0.12

      g.drawImage(fondo, 0, 0, w, h)
      g.save()
      g.beginPath(); g.rect(L.ix, L.iy, L.iw, L.ih); g.clip()
      const disegnaFoglio = (tl, x, y, r) => {
        kit.con(g, x + pw / 2, y + ph / 2, r, 1, () => {
          g.fillStyle = 'rgba(40,30,10,.22)'; g.fillRect(-pw / 2 + 2, -ph / 2 + 3, pw, ph)
          g.drawImage(tl.c, -pw / 2, -ph / 2, pw, ph)
        })
      }
      if (esce < 1) disegnaFoglio(vec, bx, py, br)
      disegnaFoglio(cur, px, ay, ar)
      if (m.su > 0.01 && entra >= 1) mostraMatematica(g, n, px, py, 0.55 * m.su)

      // il timbro «pronto» quando il disegno è finito
      const tk = clamp((u - TIMBRO) / 0.35)
      if (tk >= 1 && !cur.timbro) timbra(cur)
      if (tk > 0 && !cur.timbro) {
        const sc = 1 + 1.4 * (1 - ease.outBack(tk))
        g.save()
        g.globalAlpha = clamp(tk * 2) * 0.9
        g.globalCompositeOperation = 'multiply'
        kit.timbro(g, 'pronto', px + pw * 0.8, ay + ph * 0.84, Math.max(14, pw * 0.16) * sc, -0.22, '#b3121f', 1)
        g.restore()
      }

      // il pennino: va dove finisce l'ultimo segmento, a penna alzata torna a casa
      let tx = px + pw * 0.06, ty = py - ph * 0.02, giu = 0
      if (voluti > 0 && k < 1) {
        const o = (voluti - 1) * 6
        tx = px + S[o + 2] * s; ty = ay + S[o + 3] * s; giu = 1
      }
      if (!penna) penna = { x: tx, y: ty, giu: 0, colore: 0 }
      const f = 1 - Math.exp(-dt * (giu ? 38 : 9))
      penna.x = lerp(penna.x, tx, f); penna.y = lerp(penna.y, ty, f)
      penna.giu = lerp(penna.giu, giu, 1 - Math.exp(-dt * 14))
      if (voluti > 0 && k < 1) penna.colore = S[(voluti - 1) * 6 + 4]
      const pal = PALETTE[FOGLI[n][3]]
      // la barra del carrello con la sua ombra sul foglio
      const alza = (1 - penna.giu) * L.bh * 0.5
      const barX = px + pw / 2 - L.span / 2, barY = penna.y - L.bh / 2
      g.globalAlpha = 0.55
      g.drawImage(ombraBarra, barX - 15 + L.bh * 0.35, barY - 15 + L.bh * 0.55 + alza * 0.6, L.span + 30, L.bh + 30)
      g.globalAlpha = 1
      g.drawImage(barra, barX, barY, L.span, L.bh)
      // la punta: un puntino d'inchiostro che si posa sulla carta
      const cw = L.cw
      g.fillStyle = pal[penna.colore] || '#161616'
      if (penna.giu > 0.5) { g.globalAlpha = 0.35 * penna.giu; g.beginPath(); g.arc(penna.x, penna.y, cw * 0.18, 0, TAU); g.fill(); g.globalAlpha = 1 }
      g.drawImage(carrello, penna.x - cw / 2 - 10, penna.y - cw * 0.62 - 10 - alza, cw + 20, cw * 1.25 + 20)
      g.beginPath(); g.arc(penna.x, penna.y - alza, cw * 0.24, 0, TAU); g.fill()
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(penna.x - cw * 0.08, penna.y - alza - cw * 0.08, cw * 0.07, 0, TAU); g.fill()
      // la spia del carrello: verde mentre disegna, rossa col mouse sopra
      g.fillStyle = giu ? (m.su > 0.5 ? '#ff4d3d' : '#7dff6a') : '#55594f'
      g.beginPath(); g.arc(penna.x + cw * 0.32, penna.y - cw * 0.45 - alza, Math.max(1, cw * 0.07), 0, TAU); g.fill()
      g.restore()

      // il titolo, a pennarello nero sul banco, con un'ombra di matita
      const stato = u < INIZIO ? 'calcolo…' : k < 1 ? 'disegno…' : `${it(tot)} segmenti · pronto`
      g.font = `700 ${L.fs}px "${m.font}"`
      g.textBaseline = 'top'; g.textAlign = 'left'
      g.fillStyle = 'rgba(22,22,22,.18)'; g.fillText(m.titolo, w * 0.05 + L.fs * 0.04, w * 0.075 + L.fs * 0.06)
      g.fillStyle = '#161616'; g.fillText(m.titolo, w * 0.05, w * 0.075)
      cartellino(g, n, stato, t, m.su)
      // i nastri del banco sopra a tutto
      const nw = Math.max(26, w * 0.13), nh = nw * 0.3
      kit.nastro(g, L.ix + nw * 0.12, L.iy - nh * 0.1, nw, nh, -0.66, 'rgba(234,222,182,.86)')
      kit.nastro(g, L.ix + L.iw - nw * 0.12, L.iy - nh * 0.1, nw, nh, 0.66, 'rgba(234,222,182,.86)')
      kit.granella(g, w, h, 0.04, t)
    },
  }
}
