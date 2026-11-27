// miniature/calcolatrice.js — Calcolatrice (27.11.2026): la calcolatrice in stile Discord coi colori pzk.
// Il riquadro è la cattura vera (media/p/calcolatrice: la scheda Base, e col mouse sopra la Scientifica), steso in
// prospettiva sopra una carta topografica; sullo schermo della cattura si scrive davvero: lo stesso conto della foto,
// (1250−320)×0,22+18, tasto per tasto (il tasto si abbassa), col risultato che si vede mentre scrivi, poi «=» (il lime):
// il risultato grande, «Copiato!» nel fumetto verde di Discord e i coriandoli lime e viola. Intanto, sulla carta, il
// geometra risolve un triangolo come la pagina TRIANGOLI di pzk os: due lati e l'angolo compreso in gon, poi Carnot dà
// il terzo lato e l'area. Col mouse sopra: la Scientifica, ANS×sin(50 in gon = 35,35533906, e l'angolo in tre scritture.
import { quad, nelQuad, angoli, fotogramma } from './borsa.js'

const CICLO = 12
const F = '"gg sans", "Noto Sans", Helvetica, Arial, sans-serif'
const TESTO = '#2e2b30', MUTO = '#5d5f58'

// le due facce della cattura: dove sono il riquadro, lo schermo, i tasti (in pixel della foto 1280 × 720)
const BASE = {
  src: 'cover', crop: [440, 48, 400, 624],
  schermo: { x0: 460, x1: 821, y0: 206, y1: 319, ans: 222, riga: 260, poi: 299, destra: 812, copia: [803, 197] },
  tasti: (() => {
    const T = {}, nomi = [['AC', '(', ')', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', ',', 'del', '=']]
    nomi.forEach((r, j) => r.forEach((k, i) => { T[k] = [456 + i * 94, 334 + j * 60, 86, 52] }))
    return T
  })(),
}
const SCI = {
  src: '01', crop: [280, 26, 720, 668],
  schermo: { x0: 300, x1: 981, y0: 188, y1: 297, ans: 200, riga: 238, poi: 277, destra: 972, copia: [964, 176] },
  tasti: (() => {
    const T = {}, nomi = [['AC', '(', ')', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', ',', 'del', '=']]
    nomi.forEach((r, j) => r.forEach((k, i) => { T[k] = [646 + i * 86.7, 356 + j * 60, 78, 52] }))
    const fn = [['sin(', 'cos(', 'tan(', 'π'], ['asin(', 'acos(', 'atan(', 'e'], ['log(', 'ln(', '√(', '^'], ['^2', '!', '×10^', 'ans']]
    fn.forEach((r, j) => r.forEach((k, i) => { T[k] = [296 + i * 86, 356 + j * 48, 80, 42] }))
    return T
  })(),
}
// i conti scritti: quello della foto della scheda Base, e quello della Scientifica (ANS = 50, in gon)
const CONTO = ['(', '1', '2', '5', '0', '−', '3', '2', '0', ')', '×', '0', ',', '2', '2', '+', '1', '8']
const CONTO_SCI = ['ans', '×', 'sin(', '5', '0']

// ── i conti: un piccolo calcolatore (niente eval), con le parentesi che si chiudono da sole come chiusa() ──
function calcola(s, ans = 0, gon = true) {
  let i = 0
  const t = s.replace(/ans/g, 'A')
  const vedi = () => t[i], prendi = () => t[i++]
  function primario() {
    const c = vedi()
    if (c === '(') { prendi(); const v = somma(); if (vedi() === ')') prendi(); return v }
    if (c === '−' || c === '-') { prendi(); return -primario() }
    if (c === 'A') { prendi(); return ans }
    if (t.startsWith('sin(', i)) { i += 4; const v = somma(); if (vedi() === ')') prendi(); return Math.sin(gon ? (v * Math.PI) / 200 : v) }
    let n = ''
    while (i < t.length && /[0-9,]/.test(t[i])) n += t[i++]
    if (!n) throw new Error('manca un numero')
    return parseFloat(n.replace(',', '.'))
  }
  function prodotto() {
    let v = primario()
    while (vedi() === '×' || vedi() === '÷') { const o = prendi(), w = primario(); v = o === '×' ? v * w : v / w }
    return v
  }
  function somma() {
    let v = prodotto()
    while (vedi() === '+' || vedi() === '−') { const o = prendi(), w = prodotto(); v = o === '+' ? v + w : v - w }
    return v
  }
  const v = somma()
  if (i < t.length) throw new Error('avanza')
  return v
}
const num = (n, dec = 8) => n.toLocaleString('it-IT', { maximumFractionDigits: dec, useGrouping: Math.abs(n) >= 1e4 })
const prova = (s, ans) => { try { const v = calcola(s, ans); return Number.isFinite(v) ? num(v) : null } catch { return null } }

// ── il triangolo del geometra (la pagina TRIANGOLI): a, b e γ compreso, in gon; Carnot e l'area ──
const TRI = (() => {
  const a = 125.4, b = 98.12, g = 61.27, gr = (g * Math.PI) / 200
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(gr)), S = 0.5 * a * b * Math.sin(gr)
  return { a, b, g, c, S, gr, deg: (g * 180) / 200 }
})()

export default async function crea(m) {
  const { kit } = m
  const [img0, img1] = await Promise.all([
    m.cattura ? kit.img(m.cattura) : kit.img('/media/p/calcolatrice/cover.webp'),
    kit.imgForse('/media/p/calcolatrice/01.webp'),
    kit.font('gg sans', 500), kit.font('gg sans', 600), kit.font('gg sans', 700), kit.font('Permanent Marker'),
  ])
  const facce = { cover: img0, '01': img1 || img0 }
  const tele = {} // il riquadro ridisegnato (uno per faccia)
  for (const L of [BASE, SCI]) {
    const c = document.createElement('canvas')
    c.width = L.crop[2]; c.height = L.crop[3]
    tele[L.src] = { c, g: c.getContext('2d'), chiave: '' }
  }
  let W = 0, H = 0, fondo = null, sopra = null, bagliore = null

  // la carta topografica: le isoipse con i quadrati che marciano su un campo di rumore, una volta per misura
  function rifai(w, h) {
    W = w; H = h
    fondo = kit.strato(w * 1.1, h * 1.1, m.dpr, (g) => {
      const ww = w * 1.1, hh = h * 1.1
      const l = g.createLinearGradient(0, 0, ww, hh)
      l.addColorStop(0, '#1a2266'); l.addColorStop(0.5, '#0e1238'); l.addColorStop(1, '#080a22')
      g.fillStyle = l; g.fillRect(0, 0, ww, hh)
      const NX = 72, NY = 42, campo = new Float32Array((NX + 1) * (NY + 1))
      const r = (x, y) => kit.rumore(x, 3) * 0.5 + kit.rumore(y * 1.3 + 7, 5) * 0.5
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
        const x = i / NX, y = j / NY
        campo[j * (NX + 1) + i] = Math.sin(x * 5.1 + Math.cos(y * 3.3) * 1.4) * 0.5 + Math.cos(y * 4.2 - x * 2.2) * 0.4 + r(x * 9, y * 9) * 0.5 + Math.exp(-((x - 0.3) ** 2 + (y - 0.7) ** 2) * 9) * 1.2
      }
      const v = (i, j) => campo[j * (NX + 1) + i], sx = ww / NX, sy = hh / NY
      for (let liv = -1.2, n = 0; liv <= 2.2; liv += 0.11, n++) {
        const maestra = n % 5 === 0
        g.strokeStyle = maestra ? 'rgba(130,140,255,.42)' : 'rgba(88,101,242,.24)'
        g.lineWidth = maestra ? Math.max(1, w * 0.0028) : Math.max(0.6, w * 0.0014)
        g.beginPath()
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1)
          const P = []
          const lato = (p, q, x0, y0, x1, y1) => { if ((p < liv) !== (q < liv)) { const k = (liv - p) / (q - p); P.push([(x0 + (x1 - x0) * k) * sx, (y0 + (y1 - y0) * k) * sy]) } }
          lato(a, b, i, j, i + 1, j); lato(b, c, i + 1, j, i + 1, j + 1); lato(d, c, i, j + 1, i + 1, j + 1); lato(a, d, i, j, i, j + 1)
          if (P.length >= 2) { g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]) }
          if (P.length === 4) { g.moveTo(P[2][0], P[2][1]); g.lineTo(P[3][0], P[3][1]) }
        }
        g.stroke()
      }
      // le quote, piccole, e il reticolo delle coordinate
      g.fillStyle = 'rgba(150,160,255,.35)'
      g.font = `500 ${Math.max(6, w * 0.016)}px ${F}`
      const rr = kit.rng(4)
      for (let k = 0; k < 9; k++) g.fillText(`${Math.round(40 + rr() * 160)}`, rr() * ww, rr() * hh)
      g.strokeStyle = 'rgba(88,101,242,.12)'; g.lineWidth = 1
      for (let x = ww / 8; x < ww; x += ww / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hh); g.stroke() }
      for (let y = hh / 5; y < hh; y += hh / 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(ww, y); g.stroke() }
      kit.granella(g, ww, hh, 0.05, 0)
    })
    sopra = kit.strato(w, h, m.dpr, (g) => kit.vignetta(g, w, h, 0.42))
    const bs = h * 0.9
    bagliore = kit.strato(bs, bs, 1, (g) => {
      const b = g.createRadialGradient(bs / 2, bs / 2, 0, bs / 2, bs / 2, bs / 2)
      b.addColorStop(0, 'rgba(204,255,0,.42)'); b.addColorStop(0.5, 'rgba(157,0,255,.3)'); b.addColorStop(1, 'rgba(157,0,255,0)')
      g.fillStyle = b; g.fillRect(0, 0, bs, bs)
    })
  }

  // ── lo schermo della cattura: si ridipinge il riquadro dell'espressione e ci si scrive sopra ──
  function telo(L, st, altezza) {
    const T = tele[L.src], k = JSON.stringify(st) + altezza
    if (T.chiave === k) return T.p
    T.chiave = k
    const { g } = T, [cx, cy, cw, ch] = L.crop, s = L.schermo
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, cw, ch)
    g.save()
    kit.tondo(g, 1, 1, cw - 2, ch - 2, 12); g.clip()
    g.drawImage(facce[L.src], cx, cy, cw, ch, 0, 0, cw, ch)
    g.translate(-cx, -cy)
    // lo schermo
    const gr = g.createLinearGradient(0, s.y0, 0, s.y1)
    gr.addColorStop(0, 'rgb(248,250,232)'); gr.addColorStop(1, 'rgb(249,246,236)')
    g.fillStyle = gr; g.fillRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0)
    g.textAlign = 'right'; g.textBaseline = 'middle'
    if (st.fatto) {
      g.font = `400 15px ${F}`; g.fillStyle = MUTO
      g.fillText(`${st.fatto.expr.replace(/ans/g, 'ANS')} =`, s.destra, s.ans)
      const z = 44 * Math.max(0.55, Math.min(1, 12 / st.fatto.ris.length)) * (1 + st.salto * 0.12)
      g.font = `600 ${z}px ${F}`; g.fillStyle = TESTO
      g.fillText(st.fatto.ris, s.destra, s.riga)
    } else {
      g.font = `400 15px ${F}`; g.fillStyle = MUTO
      g.fillText(`ANS = ${st.ans}`, s.destra, s.ans)
      const z = 44 * Math.max(0.55, Math.min(1, 12 / Math.max(1, st.expr.length)))
      let x = s.destra - 6
      if (st.cursore) { g.fillStyle = '#c8ef1e'; g.fillRect(x + 2, s.riga - z * 0.38, 2, z * 0.8) }
      // da destra a sinistra, a pezzi: ANS nella sua pillola viola
      const pezzi = st.expr ? st.expr.split(/(ans)/).filter(Boolean) : []
      if (!pezzi.length) { g.font = `600 ${z}px ${F}`; g.fillStyle = 'rgba(93,95,88,.45)'; g.fillText('0', x, s.riga) }
      for (let i = pezzi.length - 1; i >= 0; i--) {
        const p = pezzi[i]
        if (p === 'ans') {
          g.font = `700 ${z * 0.5}px ${F}`
          const pw = g.measureText('ANS').width + z * 0.44
          g.fillStyle = 'rgba(157,0,255,.28)'; kit.tondo(g, x - pw - z * 0.04, s.riga - z * 0.33, pw, z * 0.62, z * 0.11); g.fill()
          g.fillStyle = TESTO; g.fillText('ANS', x - z * 0.26, s.riga + z * 0.02)
          x -= pw + z * 0.1
        } else {
          g.font = `600 ${z}px ${F}`; g.fillStyle = TESTO
          g.fillText(p, x, s.riga)
          x -= g.measureText(p).width
        }
      }
      if (st.poi) { g.font = `500 17px ${F}`; g.fillStyle = MUTO; g.fillText(`= ${st.poi}`, s.destra, s.poi) }
    }
    // il tasto premuto: si abbassa e si scurisce (come .premuto)
    if (st.tasto && L.tasti[st.tasto]) {
      const [x, y, w, h] = L.tasti[st.tasto]
      g.fillStyle = st.tasto === '=' ? 'rgba(40,60,0,.28)' : 'rgba(20,0,40,.22)'
      kit.tondo(g, x + 2, y + 3, w - 4, h - 4, 8); g.fill()
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2
      kit.tondo(g, x, y, w, h, 8); g.stroke()
    }
    // il fumetto di Discord sopra il tasto copia
    if (st.fumetto > 0) {
      const [fx, fy] = s.copia, k = kit.ease.outBack(Math.min(1, st.fumetto * 3))
      g.save(); g.translate(fx, fy - 18); g.scale(k, k)
      g.font = `500 14px ${F}`
      const tw = g.measureText('Copiato!').width + 20
      g.fillStyle = '#23a55a'; kit.tondo(g, -tw + 14, -30, tw, 28, 8); g.fill()
      g.beginPath(); g.moveTo(-6, -2); g.lineTo(4, -2); g.lineTo(-1, 4); g.fill()
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Copiato!', -tw / 2 + 14, -16)
      g.restore()
    }
    g.restore()
    // la copia piccola, alla misura in cui si vede: stenderla in prospettiva costa molto meno
    const ph = Math.max(40, Math.round(altezza)), pw = Math.round((ph * cw) / ch)
    if (!T.p || T.p.height !== ph) { T.p = document.createElement('canvas'); T.p.width = pw; T.p.height = ph }
    const x = T.p.getContext('2d')
    x.clearRect(0, 0, pw, ph); x.imageSmoothingQuality = 'high'; x.drawImage(T.c, 0, 0, pw, ph)
    return T.p
  }

  // i coriandoli dell'uguale (stesso t, stesso volo)
  const CORI = Array.from({ length: 34 }, (_, i) => { const r = kit.rng(70 + i); return { a: -Math.PI / 2 + (r() - 0.5) * 2.6, v: 0.5 + r() * 0.9, giri: (r() - 0.5) * 14, col: i % 3 === 0 ? '#9d00ff' : i % 3 === 1 ? '#ccff00' : '#ffffff', s: 0.5 + r() } })

  const api = { titolo: true, fermo: 6, ridimensiona: rifai, frame: fotogramma(m, disegna) }
  return api

  function disegna(t) {
    const { g, w, h, dpr } = m, su = m.su
    if (w !== W || h !== H || !fondo) rifai(w, h)
    const sci = su > 0.5
    const L = sci ? SCI : BASE
    const giro = sci ? 7 : CICLO, ph = t % giro
    const seq = sci ? CONTO_SCI : CONTO, ans = sci ? 50 : 1024
    const passo = sci ? 0.42 : 0.22, t0 = 0.6, tu = t0 + seq.length * passo + 0.35 // quando si preme «=»
    const n = Math.max(0, Math.min(seq.length, Math.floor((ph - t0) / passo) + 1))
    const expr = ph < t0 ? '' : seq.slice(0, n).join('')
    let tasto = null, fatto = null, salto = 0, fumetto = 0
    if (ph >= t0 && ph < tu - 0.35 && (ph - t0) % passo < passo * 0.55) tasto = seq[n - 1]
    const ris = num(calcola(seq.join(''), ans))
    if (ph >= tu) {
      fatto = { expr: seq.join(''), ris }
      salto = Math.exp(-(ph - tu) * 5) * Math.sin((ph - tu) * 18)
      if (ph - tu < 0.18) tasto = '='
      const tc = ph - tu - 0.9
      if (tc > 0 && tc < 1.8) fumetto = tc
    }
    const poi = expr && !/^[\d,]+$/.test(expr) ? prova(expr, ans) : null
    const st = { expr, ans: num(ans), poi, fatto, salto: Math.round(Math.max(0, salto) * 6) / 6, tasto, cursore: !fatto && Math.floor(t * 1.9) % 2 === 0, fumetto: Math.min(0.4, Math.round(fumetto * 15) / 15) * (fumetto > 0 ? 1 : 0) }

    // ── la carta, che scorre piano ──
    const dx = -w * 0.05 + Math.sin(t * 0.11) * w * 0.04, dy = -h * 0.05 + Math.cos(t * 0.09) * h * 0.04
    kit.metti(g, fondo, dx, dy, w * 1.1, h * 1.1)
    // la luce del teodolite che passa
    const lx = ((t * 0.08) % 1.4 - 0.2) * w
    const lg = g.createLinearGradient(lx - w * 0.15, 0, lx + w * 0.15, h)
    lg.addColorStop(0, 'rgba(88,101,242,0)'); lg.addColorStop(0.5, 'rgba(120,130,255,.10)'); lg.addColorStop(1, 'rgba(88,101,242,0)')
    g.fillStyle = lg; g.fillRect(0, 0, w, h)

    // ── il triangolo del geometra ──
    triangolo(g, w, h, ph, tu, sci, t)

    // ── il riquadro della calcolatrice ──
    const asp = L.crop[3] / L.crop[2]
    const ph2 = h * (sci ? 0.66 : 0.9), pw = ph2 / asp
    const pcx = sci ? w * 0.75 : w * 0.785, pcy = sci ? h * 0.64 : h * 0.53 + Math.sin(t * 0.7) * h * 0.008
    const gira = (sci ? -0.08 : -0.22 + Math.sin(t * 0.33) * 0.04) * (1 - su * 0.5), rot = 0.025 + Math.sin(t * 0.5) * 0.004
    const k = 1 + salto * 0.01
    const Q = angoli(pcx, pcy - salto * h * 0.006, pw * k, ph2 * k, gira, rot, sci ? 0.04 : 0.1)
    // l'ombra e il bagliore dei colori pzk sotto
    const fl = fatto ? Math.max(0, 1 - (ph - tu) * 0.8) : 0
    g.globalAlpha = Math.min(1, 0.45 + fl * 0.55)
    g.drawImage(bagliore, pcx - ph2 * 0.8, pcy - ph2 * 0.8, ph2 * 1.6, ph2 * 1.6)
    g.globalAlpha = 1
    for (const [ox, oy, a] of [[5, 9, 0.3], [12, 20, 0.14]]) {
      g.fillStyle = `rgba(0,0,10,${a})`; g.beginPath(); Q.forEach(([x, y], i) => (i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy))); g.closePath(); g.fill()
    }
    const tela = telo(L, st, ph2 * dpr * 1.15)
    quad(g, tela, Q, dpr, 10)
    // il riflesso
    const r0 = nelQuad(Q, kit.fract(t * 0.05) * 1.8 - 0.4, 0), r1 = nelQuad(Q, kit.fract(t * 0.05) * 1.8 - 0.1, 1)
    const rg = g.createLinearGradient(r0[0], r0[1], r1[0], r1[1])
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.5, `rgba(255,255,255,${0.1 + fl * 0.2})`); rg.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = rg; g.beginPath(); Q.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill()

    // ── i coriandoli dall'uguale ──
    if (fatto && ph - tu < 2.2) {
      const [kx, ky, kw, kh] = L.tasti['=']
      const o = nelQuad(Q, (kx + kw / 2 - L.crop[0]) / L.crop[2], (ky + kh / 2 - L.crop[1]) / L.crop[3]), tt = ph - tu
      for (const c of CORI) {
        const v = c.v * h * 1.1, x = o[0] + Math.cos(c.a) * v * tt, y = o[1] + Math.sin(c.a) * v * tt + 0.5 * h * 1.4 * tt * tt
        g.save(); g.translate(x, y); g.rotate(c.giri * tt); g.scale(1, Math.cos(tt * c.giri))
        g.globalAlpha = Math.max(0, 1 - tt / 2.2)
        g.fillStyle = c.col; g.fillRect(-w * 0.007 * c.s, -w * 0.004 * c.s, w * 0.014 * c.s, w * 0.008 * c.s)
        g.restore()
      }
      g.globalAlpha = 1
    }
    kit.metti(g, sopra, 0, 0, w, h)
  }

  /** il triangolo sulla carta: C in alto, il lato a verso B, il lato b verso A, l'angolo γ in gon; poi c e l'area */
  function triangolo(g, w, h, ph, tu, sci, t) {
    const sc = h * 0.0046, cx = w * 0.2, cy = h * 0.47, th = 0.18
    const C = [cx, cy], B = [cx + Math.cos(th) * TRI.a * sc, cy + Math.sin(th) * TRI.a * sc], A = [cx + Math.cos(th + TRI.gr) * TRI.b * sc, cy + Math.sin(th + TRI.gr) * TRI.b * sc]
    const traccia = sci ? 1 : kit.clamp((ph - 0.2) / 2.2), risolto = sci || ph >= tu
    const k1 = kit.clamp(traccia * 3), k2 = kit.clamp(traccia * 3 - 1), k3 = kit.clamp(traccia * 3 - 2)
    const lungo = (P, Q, k) => [P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]
    // l'area, quando il conto è fatto
    if (risolto) {
      const ka = sci ? 1 : kit.clamp((ph - tu) * 2)
      g.fillStyle = `rgba(255,233,77,${0.16 * ka})`
      g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.lineTo(...C); g.closePath(); g.fill()
    }
    g.save()
    g.lineWidth = Math.max(1.2, w * 0.0035); g.lineCap = 'round'
    g.setLineDash([w * 0.012, w * 0.008]); g.lineDashOffset = -t * w * 0.03
    g.strokeStyle = '#ffffff'
    g.beginPath(); g.moveTo(...C); g.lineTo(...lungo(C, B, k1)); g.stroke()
    if (k2 > 0) { g.beginPath(); g.moveTo(...C); g.lineTo(...lungo(C, A, k2)); g.stroke() }
    g.strokeStyle = risolto ? '#ccff00' : 'rgba(255,255,255,.35)'
    if (k3 > 0) { g.beginPath(); g.moveTo(...A); g.lineTo(...lungo(A, B, risolto ? 1 : k3)); g.stroke() }
    g.restore()
    // l'arco dell'angolo in C
    if (k2 > 0) {
      g.strokeStyle = '#ff5a52'; g.lineWidth = Math.max(1.2, w * 0.004)
      g.beginPath(); g.arc(C[0], C[1], h * 0.07, th, th + TRI.gr * k2); g.stroke()
    }
    // i vertici: il punto di stazione
    for (const [P, nome, k] of [[C, 'C', 1], [B, 'B', k1], [A, 'A', k2]]) {
      if (k <= 0) continue
      const r = w * 0.009 * kit.ease.outBack(Math.min(1, k * 2))
      g.fillStyle = '#0e1238'; g.beginPath(); g.arc(P[0], P[1], r * 1.6, 0, Math.PI * 2); g.fill()
      g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, w * 0.0025); g.beginPath(); g.arc(P[0], P[1], r, 0, Math.PI * 2); g.stroke()
      g.beginPath(); g.moveTo(P[0] - r * 1.9, P[1]); g.lineTo(P[0] + r * 1.9, P[1]); g.moveTo(P[0], P[1] - r * 1.9); g.lineTo(P[0], P[1] + r * 1.9); g.stroke()
      kit.scritta(g, nome, P[0] - w * 0.022, P[1] - w * 0.012, { font: 'gg sans', peso: 700, size: Math.max(8, w * 0.026), color: '#fff' })
    }
    // i cartellini: come le pillole di Discord
    const pill = (testo, x, y, k, col = '#111214', ink = '#dbdee1') => {
      if (k <= 0) return
      const z = Math.max(7, w * 0.021)
      g.font = `600 ${z}px ${F}`
      const tw = g.measureText(testo).width + z * 0.9
      g.save(); g.translate(x, y); const e = kit.ease.outBack(Math.min(1, k)); g.scale(e, e)
      g.fillStyle = col; kit.tondo(g, -tw / 2, -z * 0.8, tw, z * 1.6, z * 0.4); g.fill()
      g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(testo, 0, z * 0.05)
      g.restore()
    }
    const mid = (P, Q, o) => [(P[0] + Q[0]) / 2 + o[0], (P[1] + Q[1]) / 2 + o[1]]
    const it = (v, d = 2) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })
    const tp = sci ? 9 : ph
    const m1 = mid(C, B, [w * 0.02, -h * 0.045]), m2 = mid(C, A, [-w * 0.075, h * 0.02]), m3 = mid(A, B, [sci ? -w * 0.03 : w * 0.07, h * 0.03])
    pill(`a = ${it(TRI.a)} m`, m1[0], m1[1], (tp - 1.2) * 3)
    pill(`b = ${it(TRI.b)} m`, m2[0], m2[1], (tp - 1.8) * 3)
    pill(sci ? `γ = ${it(TRI.g)} gon = ${it(TRI.deg, 3)}° = ${it(TRI.gr, 4)} rad` : `γ = ${it(TRI.g)} gon`, C[0] + (sci ? w * 0.17 : w * 0.075), C[1] + h * 0.085, (tp - 2.4) * 3, '#ff5a52', '#fff')
    if (risolto) {
      const k = sci ? 1 : (ph - tu - 0.3) * 3
      pill(`c = ${it(TRI.c)} m · Carnot`, m3[0], m3[1], k, '#ccff00', '#161c00')
      const s = `area ${it(TRI.S, 1)} m²`
      const z = Math.max(8, w * 0.03)
      const ks = sci ? 1 : kit.clamp((ph - tu - 0.6) * 2.5)
      if (ks > 0) {
        const cxS = (A[0] + B[0] + C[0]) / 3, cyS = (A[1] + B[1] + C[1]) / 3
        kit.scritta(g, s, cxS, cyS + z * 0.35, { font: 'Permanent Marker', size: z * (0.6 + 0.4 * kit.ease.outBack(ks)), color: `rgba(255,233,77,${ks})`, align: 'center', rot: -0.06, ombra: 2, ombraColore: 'rgba(0,0,0,.5)' })
      }
    }
  }
}
