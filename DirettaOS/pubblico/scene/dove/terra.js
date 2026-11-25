// «Dove vivo» · il terreno: una mappa dipinta in canvas (prato rasato a strisce, ghiaia, campi arati a novembre o
// verdi d'estate, strade bianche, fossi) e, oltre, la campagna della bassa fino all'orizzonte, a campi lunghi.
// I campi «inventati» fuori dai dati sono una funzione del posto: la mappa vicina e quella lontana combaciano.
import { rng, nuovaTela, tela, fbm } from './tele.js'

export const MAPPA = { x0: -320, y0: -340, lato: 640, px: 4096 }
export const LONTANO = { x0: -3200, y0: -3200, lato: 6400, px: 2048 }
const ANG = 0.33117

const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

// i colori dei campi per stagione: [arato, erpicato, grano/erba medica, stoppie, prato]
function coloriCampi(sta) {
  const g = sta.giorno
  const verde = g > 100 && g < 200 ? '#6f9440' : g >= 200 && g < 250 ? '#8a9a4a' : '#6f8a45'
  return {
    arato: ['#6b5741', '#5f4d3a', '#76604a'],
    erpicato: ['#8b745a', '#7f6a52'],
    grano: g > 150 && g < 200 ? ['#c8b05a', '#bfa552'] : [verde, '#7c9748'],
    stoppie: ['#a48f62', '#9a8459'],
    prato: ['#66883d', '#5f803a'],
  }
}

// la campagna: colonne lunghe nella direzione dei campi, tagliate in strisce
function campagna(g, X, Y, ext, sta, dettaglio) {
  const C = Math.cos(ANG), S = Math.sin(ANG)
  const col = coloriCampi(sta)
  const tipi = ['arato', 'arato', 'arato', 'erpicato', 'grano', 'grano', 'grano', 'stoppie', 'prato', 'arato']
  const R = Math.hypot(ext.lato, ext.lato) * 0.75
  const cx = ext.x0 + ext.lato / 2, cy = ext.y0 + ext.lato / 2
  // coordinate ruotate (a lungo i campi, b di traverso)
  const ca = cx * C + cy * S, cb = -cx * S + cy * C
  const aMin = Math.floor((ca - R) / 130), aMax = Math.ceil((ca + R) / 130)
  for (let ia = aMin; ia <= aMax; ia++) {
    const larg = 95 + hash(ia, 7) * 70
    const a0 = ia * 130, a1 = a0 + larg, a2 = a0 + 130
    for (const [A0, A1, seme] of [[a0, a1, 1], [a1, a2, 2]]) {
      let b = cb - R + hash(ia, seme * 31) * 40
      let k = 0
      while (b < cb + R) {
        const lung = 28 + hash(ia * 3 + seme, k) * 62
        const tipo = tipi[Math.floor(hash(ia + seme * 101, k * 7 + 3) * tipi.length)]
        const varianti = col[tipo]
        const colore = varianti[Math.floor(hash(ia, k * 13 + seme) * varianti.length)]
        const angolo = (P) => [P[0] * C - P[1] * S, P[0] * S + P[1] * C]
        const pts = [[A0 + 1.2, b + 1.2], [A1 - 1.2, b + 1.2], [A1 - 1.2, b + lung - 1.2], [A0 + 1.2, b + lung - 1.2]].map(angolo)
        g.fillStyle = colore
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.closePath(); g.fill()
        // i solchi, lungo il lato lungo del campo
        if (dettaglio && tipo !== 'prato') {
          g.save(); g.clip()
          const passo = tipo === 'arato' ? 0.9 : tipo === 'grano' ? 0.55 : 1.4
          g.strokeStyle = tipo === 'grano' ? 'rgba(70,58,40,.35)' : tipo === 'stoppie' ? 'rgba(200,180,130,.35)' : 'rgba(40,30,22,.32)'
          g.lineWidth = Math.max(1, (passo * 0.35 * ext.px) / ext.lato)
          const lungoA = A1 - A0 > lung
          g.beginPath()
          if (lungoA) for (let bb = b; bb < b + lung; bb += passo) { const p = angolo([A0, bb]), q = angolo([A1, bb]); g.moveTo(X(p[0]), Y(p[1])); g.lineTo(X(q[0]), Y(q[1])) }
          else for (let aa = A0; aa < A1; aa += passo) { const p = angolo([aa, b]), q = angolo([aa, b + lung]); g.moveTo(X(p[0]), Y(p[1])); g.lineTo(X(q[0]), Y(q[1])) }
          g.stroke()
          g.restore()
        } else if (tipo !== 'prato') {
          // da lontano: righe larghe appena accennate
          g.save(); g.clip()
          g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 1
          g.beginPath()
          for (let aa = A0; aa < A1; aa += 9) { const p = angolo([aa, b]), q = angolo([aa, b + lung]); g.moveTo(X(p[0]), Y(p[1])); g.lineTo(X(q[0]), Y(q[1])) }
          g.stroke(); g.restore()
        }
        b += lung; k++
      }
    }
  }
}

function percorso(g, X, Y, punti, chiudi = false) {
  g.beginPath()
  punti.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))))
  if (chiudi) g.closePath()
}

// una macchia di rumore stesa sopra (variazione di colore larga)
function velo(g, ext, seme, alpha, modo = 'soft-light') {
  const n = fbm(256, 4, 5, seme, 0.55)
  const c = nuovaTela(256), cg = c.getContext('2d'), img = cg.createImageData(256, 256)
  for (let i = 0; i < n.length; i++) { const v = n[i] * 255; img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255 }
  cg.putImageData(img, 0, 0)
  g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = modo
  g.imageSmoothingEnabled = true
  for (let x = 0; x < ext.px; x += ext.px / 2) for (let y = 0; y < ext.px; y += ext.px / 2) g.drawImage(c, x, y, ext.px / 2, ext.px / 2)
  g.restore()
}

// ── la mappa vicina ──
export function dipingiMappa(D, { alberi, siepi, zone, sta, chiave }) {
  return tela('mappa-' + chiave, () => {
    const E = MAPPA
    const c = nuovaTela(E.px), g = c.getContext('2d')
    const k = E.px / E.lato
    const X = (x) => (x - E.x0) * k, Y = (y) => (E.y0 + E.lato - y) * k
    const r = rng(4242)
    g.fillStyle = '#6f5c46'; g.fillRect(0, 0, E.px, E.px)
    campagna(g, X, Y, E, sta, true)
    // i campi dei dati: arati (a novembre) o verdi
    const col = coloriCampi(sta)
    for (const f of D.campi) {
      if (f.c !== 'farmland') continue
      g.fillStyle = col.arato[0]
      percorso(g, X, Y, f.p, true); g.fill()
      g.save(); g.clip()
      g.strokeStyle = 'rgba(40,30,22,.3)'; g.lineWidth = 0.4 * k
      g.beginPath()
      const C = Math.cos(ANG), S = Math.sin(ANG)
      for (let t = -420; t < 420; t += 0.9) { const x0 = -t * S - 420 * C, y0 = t * C - 420 * S, x1 = -t * S + 420 * C, y1 = t * C + 420 * S; g.moveTo(X(x0), Y(y0)); g.lineTo(X(x1), Y(y1)) }
      g.stroke(); g.restore()
    }
    // le bordure d'erba fra i campi e lungo le strade: un filo verde
    // il prato del lotto e del giardino: rasato a strisce
    g.save()
    percorso(g, X, Y, D.confine, true); g.clip()
    g.fillStyle = '#688c42'; g.fillRect(0, 0, E.px, E.px)
    {
      const C = Math.cos(ANG), S = Math.sin(ANG)
      g.fillStyle = 'rgba(255,255,200,.07)'
      for (let t = -200; t < 200; t += 3.2) {
        const a = [-t * S - 200 * C, t * C - 200 * S], b = [-t * S + 200 * C, t * C + 200 * S]
        const a2 = [a[0] - S * 1.6, a[1] + C * 1.6], b2 = [b[0] - S * 1.6, b[1] + C * 1.6]
        percorso(g, X, Y, [a, b, b2, a2], true); g.fill()
      }
    }
    g.restore()
    // le zone: marciapiedi in cemento, ghiaia del cortile e dei vialetti
    for (const z of zone) {
      g.fillStyle = z.colore
      if (z.linea) { g.strokeStyle = z.colore; g.lineWidth = z.largo * k; g.lineCap = 'round'; g.lineJoin = 'round'; percorso(g, X, Y, z.linea); g.stroke() }
      else { percorso(g, X, Y, z.p, true); g.fill() }
    }
    // le strade: asfalto per quelle vere, sterrato con l'erba in mezzo per le carraie
    for (const s of D.strade) {
      const sterrato = s.c === 'track'
      g.lineCap = 'round'; g.lineJoin = 'round'
      g.strokeStyle = sterrato ? '#9c8f76' : '#5d5c5a'
      g.lineWidth = (s.w + (sterrato ? 0.6 : 1.2)) * k
      percorso(g, X, Y, s.p); g.stroke()
      if (sterrato) { g.strokeStyle = 'rgba(96,120,60,.55)'; g.lineWidth = 0.7 * k; percorso(g, X, Y, s.p); g.stroke() }
      else { g.strokeStyle = 'rgba(80,80,78,1)'; g.lineWidth = s.w * k; percorso(g, X, Y, s.p); g.stroke() }
    }
    // i fossi: le rive verde scuro e l'acqua (sopra va la mesh dell'acqua)
    for (const a of D.acqua) {
      g.lineCap = 'round'; g.lineJoin = 'round'
      g.strokeStyle = '#4b6631'; g.lineWidth = (a.w + 3.6) * k; percorso(g, X, Y, a.p); g.stroke()
      g.strokeStyle = '#3c4f2a'; g.lineWidth = (a.w + 1.2) * k; percorso(g, X, Y, a.p); g.stroke()
      g.strokeStyle = '#2f3b2c'; g.lineWidth = a.w * k; percorso(g, X, Y, a.p); g.stroke()
    }
    for (const sp of D.specchi) { g.fillStyle = '#3f6a74'; percorso(g, X, Y, sp.p, true); g.fill() }
    // la variazione larga del colore (prato più verde qui, più giallo là)
    velo(g, E, 7, 0.55)
    // sotto gli alberi e le siepi: l'ombra morbida del cielo, e in autunno le foglie cadute
    const autunno = Math.max(0, sta.giallo * (1 - sta.foglie * 0.6))
    for (const a of alberi) {
      const rr = (a.tipo === 'platano' ? 5.5 : a.tipo === 'gelso' ? 2.8 : a.tipo === 'pioppo' ? 2.4 : 3.6) * a.s
      const gr = g.createRadialGradient(X(a.x), Y(a.y), 0, X(a.x), Y(a.y), rr * k)
      gr.addColorStop(0, 'rgba(18,24,10,.42)'); gr.addColorStop(0.6, 'rgba(18,24,10,.2)'); gr.addColorStop(1, 'rgba(18,24,10,0)')
      g.fillStyle = gr; g.beginPath(); g.arc(X(a.x), Y(a.y), rr * k, 0, 6.29); g.fill()
      if (autunno > 0.05 && a.tipo !== 'pioppo') {
        const n = Math.round(rr * rr * 9 * autunno)
        for (let i = 0; i < n; i++) {
          const an = r() * 6.28, d = Math.sqrt(r()) * rr * 1.25
          g.fillStyle = r() < 0.55 ? 'rgba(196,150,58,.85)' : 'rgba(150,96,46,.8)'
          g.fillRect(X(a.x + Math.cos(an) * d), Y(a.y + Math.sin(an) * d), 0.18 * k, 0.12 * k)
        }
      }
    }
    for (const s of siepi) {
      g.strokeStyle = 'rgba(20,26,12,.38)'; g.lineWidth = (s.larga + 1.6) * k; g.lineCap = 'round'
      percorso(g, X, Y, s.p); g.stroke()
    }
    return c
  })
}

// ── la campagna lontana (fino a 3 km): gli stessi campi, senza solchi, e i filari scuri ──
export function dipingiLontano(D, sta, chiave) {
  return tela('lontano-' + chiave, () => {
    const E = LONTANO
    const c = nuovaTela(E.px), g = c.getContext('2d')
    const k = E.px / E.lato
    const X = (x) => (x - E.x0) * k, Y = (y) => (E.y0 + E.lato - y) * k
    g.fillStyle = '#6f5c46'; g.fillRect(0, 0, E.px, E.px)
    campagna(g, X, Y, E, sta, false)
    for (const s of D.strade) { g.strokeStyle = s.c === 'track' ? '#9c8f76' : '#5d5c5a'; g.lineWidth = Math.max(1, s.w * k); percorso(g, X, Y, s.p); g.stroke() }
    velo(g, E, 9, 0.5)
    return c
  })
}

// i filari lontani: alberi a carte incrociate sui bordi dei campi oltre la mappa vicina, e qualche cascina
export function filariLontani(sta) {
  const out = []
  const C = Math.cos(ANG), S = Math.sin(ANG)
  for (let ia = -26; ia <= 26; ia++) {
    if (hash(ia, 991) < 0.45) continue
    const a = ia * 130
    for (let b = -2800; b < 2800; b += 9 + hash(ia, b) * 4) {
      const x = a * C - b * S, y = a * S + b * C
      const d = Math.hypot(x, y)
      if (d < 340 || d > 2900) continue
      if (hash(ia * 7, Math.floor(b / 140)) < 0.35) continue
      const pioppo = hash(ia, 5) < 0.6
      out.push({ x, y, rot: hash(b, ia) * 6.28, w: pioppo ? 4.5 : 8 + hash(b, 3) * 4, h: pioppo ? 20 + hash(b, 9) * 6 : 10 + hash(b, 4) * 5 })
    }
  }
  return out
}
