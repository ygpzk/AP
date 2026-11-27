// miniature/pzkmaps.js — pzkmaps (27.11.2026): ti lascio su una strada asfaltata, devi dire in che stato sei.
// Come il gioco vero (games/pzkmaps): la strada a tutto riquadro, la targa nera in alto a sinistra col nome giallo in
// Anton e «mondo · posto n. …» a pennarello (qui la targa è il titolo), il foglio col nastro della mappa con lo spillo
// rosso (il tuo) e quello verde (il posto vero), la riga tratteggiata fra i due, e il timbro «giusto!» o «no!» con
// «sei in …». La mappa del mondo è fatta coi punti veri da cui il gioco pesca (paesi.js, PAESI: le zone dove Street View
// è passata), niente tessere scaricate; la strada è disegnata qui, una per stato: Norvegia, Australia, Giappone.
// (L'Italia resta fuori dalla mappa e dai posti, e le province degli amici non si usano.)
// Col mouse sopra: si guarda in giro più svelti, il foglio della mappa si avvicina e i punti si accendono.
import { PAESI, nomeDi } from '../../games/pzkmaps/paesi.js'
import { fotogramma } from './borsa.js'

const GIRO = 9 // ogni posto
const POSTI = [
  {
    codice: 'NO', vero: [60.39, 5.32], tiro: [60.1, 6.2], giusto: true,
    cielo: ['#2b1d4f', '#d77a5a', '#f6c28b'], sole: [0.72, 0.47, '#ffd9a0'], monti: ['#3b3561', '#6a6290'], neve: true,
    colline: '#1d2b2a', terra: '#2f3d2c', strada: '#3a3c42', margine: '#596055', riga: '#f2e9c8', lati: 'pini', nebbia: 'rgba(246,194,139,.25)',
  },
  {
    codice: 'AU', vero: [-23.7, 133.88], tiro: [-26.2, 28.05], giusto: false,
    cielo: ['#2f7fd6', '#8cc6f2', '#e8f2f4'], sole: [0.2, 0.18, '#fffbe6'], monti: ['#a44a2a', '#c96a3a'], neve: false,
    colline: '#b25f34', terra: '#c4693a', strada: '#4b4644', margine: '#d8834a', riga: '#f4f1e6', lati: 'cespugli', nebbia: 'rgba(255,220,180,.18)',
  },
  {
    codice: 'JP', vero: [43.06, 141.35], tiro: [43.2, 141.7], giusto: true,
    cielo: ['#8b9cae', '#c6d0d8', '#e6e9ea'], sole: [0.6, 0.25, 'rgba(255,255,255,.6)'], monti: ['#5f7a6e', '#7d9688'], neve: false,
    colline: '#3f6b46', terra: '#4f7a3f', strada: '#55585c', margine: '#8b9c7e', riga: '#ffffff', lati: 'pali', nebbia: 'rgba(230,233,234,.35)',
  },
]
const LAT0 = 78, LAT1 = -56 // la mappa: lon −180…180, lat 78…−56
const PUNTI = Object.entries(PAESI).filter(([k]) => k !== 'IT').flatMap(([, z]) => z.map(([la, lo]) => [la, lo]))

export default async function crea(m) {
  const { kit } = m
  await Promise.all([kit.font('Anton'), kit.font('Permanent Marker')])
  let W = 0, H = 0, strati = [], mappa = null, sopra = null, foglioC = null, MW = 0, MH = 0

  function rifai(w, h) {
    W = w; H = h
    const dpr = m.dpr
    // per ogni posto: il cielo, i monti lontani e le colline, larghi due volte (si gira la testa)
    strati = POSTI.map((P, n) => {
      const cielo = kit.strato(w, h * 0.62, dpr, (g) => {
        const l = g.createLinearGradient(0, 0, 0, h * 0.62)
        l.addColorStop(0, P.cielo[0]); l.addColorStop(0.7, P.cielo[1]); l.addColorStop(1, P.cielo[2])
        g.fillStyle = l; g.fillRect(0, 0, w, h * 0.62)
        const [sx, sy, sc] = P.sole, r = g.createRadialGradient(sx * w, sy * h, 0, sx * w, sy * h, w * 0.3)
        r.addColorStop(0, sc); r.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = r; g.fillRect(0, 0, w, h * 0.62)
        const rr = kit.rng(5 + n)
        g.fillStyle = 'rgba(255,255,255,.22)' // le nuvole, basse e lunghe
        for (let i = 0; i < 7; i++) { const x = rr() * w, y = h * (0.08 + rr() * 0.3), cw = w * (0.12 + rr() * 0.2); g.beginPath(); g.ellipse(x, y, cw, h * 0.018, 0, 0, Math.PI * 2); g.fill() }
      })
      const profilo = (g, ww, base, alto, seme, col, punte) => {
        g.fillStyle = col
        g.beginPath(); g.moveTo(0, h)
        for (let x = 0; x <= ww; x += ww / 160) {
          const k = (x / ww) * 8, v = kit.rumore(k, seme) * 0.6 + kit.rumore(k * 3.1, seme + 1) * 0.3 + kit.rumore(k * 9, seme + 2) * 0.1
          g.lineTo(x, base - (punte ? v ** 1.6 : v) * alto)
        }
        g.lineTo(ww, h); g.closePath(); g.fill()
      }
      const lontani = kit.strato(w * 2, h * 0.62, dpr, (g) => {
        profilo(g, w * 2, h * 0.6, h * 0.34, 10 + n, P.monti[0], true)
        if (P.neve) { g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(240,244,255,.85)'; g.fillRect(0, 0, w * 2, h * 0.38); g.restore() }
        profilo(g, w * 2, h * 0.62, h * 0.18, 20 + n, P.monti[1], false)
      })
      const vicini = kit.strato(w * 2, h * 0.62, dpr, (g) => {
        profilo(g, w * 2, h * 0.63, h * 0.09, 30 + n, P.colline, false)
        if (P.lati === 'pini') { // il bosco sul crinale
          const rr = kit.rng(40)
          g.fillStyle = '#132220'
          for (let x = 0; x < w * 2; x += w * 0.008) { const hh = h * (0.03 + rr() * 0.05); const b = h * 0.6 - kit.rumore((x / (w * 2)) * 8, 30 + n) * h * 0.06; g.beginPath(); g.moveTo(x, b - hh); g.lineTo(x + w * 0.006, b + 2); g.lineTo(x - w * 0.006, b + 2); g.fill() }
        }
      })
      return { cielo, lontani, vicini }
    })
    // la mappa: i punti veri di PAESI, a puntini, sul foglio
    MW = Math.round(w * 0.36); MH = Math.round(MW * ((LAT0 - LAT1) / 360) * 1.25)
    mappa = kit.strato(MW, MH, dpr, (g) => {
      g.fillStyle = '#cfe3e8'; g.fillRect(0, 0, MW, MH)
      g.strokeStyle = 'rgba(22,22,22,.08)'; g.lineWidth = 1
      for (let lo = -150; lo <= 150; lo += 30) { const x = ((lo + 180) / 360) * MW; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, MH); g.stroke() }
      for (let la = 60; la >= -40; la -= 30) { const y = ((LAT0 - la) / (LAT0 - LAT1)) * MH; g.beginPath(); g.moveTo(0, y); g.lineTo(MW, y); g.stroke() }
      const r = Math.max(0.9, MW * 0.006)
      for (const [la, lo] of PUNTI) {
        const x = ((lo + 180) / 360) * MW, y = ((LAT0 - la) / (LAT0 - LAT1)) * MH
        g.fillStyle = 'rgba(126,188,111,.35)'; g.beginPath(); g.arc(x, y, r * 2.6, 0, Math.PI * 2); g.fill()
        g.fillStyle = '#4f8a43'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
      }
    })
    // il foglio col bordo nero della mappa (.pm-mappa) e l'ombra
    const fw = MW + w * 0.03, fh = MH + w * 0.105
    foglioC = { w: fw + 24, h: fh + 24, c: kit.strato(fw + 24, fh + 24, dpr, (g) => {
      g.translate(12, 12)
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 4
      g.fillStyle = '#f2eee3'; g.fillRect(0, 0, fw, fh)
      g.shadowColor = 'transparent'
      const l = g.createRadialGradient(fw / 2, 0, 0, fw / 2, 0, fw)
      l.addColorStop(0, 'rgba(255,255,255,.5)'); l.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = l; g.fillRect(0, 0, fw, fh)
      g.strokeStyle = '#161616'; g.lineWidth = Math.max(1.5, w * 0.005)
      g.strokeRect(w * 0.015, w * 0.015, MW, MH)
    }) }
    sopra = kit.strato(w, h, dpr, (g) => { kit.vignetta(g, w, h, 0.38); kit.granella(g, w, h, 0.05, 0) })
  }

  const proietta = ([la, lo]) => [((lo + 180) / 360) * MW, ((LAT0 - la) / (LAT0 - LAT1)) * MH]
  function spillo(g, x, y, s, col, k) { // .pm-spillo: la goccia col bordo bianco, girata di 45°
    if (k <= 0) return
    const cad = (1 - kit.ease.outBounce(Math.min(1, k))) * s * 6
    g.save(); g.translate(x, y - cad)
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, cad + s * 0.1, s * 0.45, s * 0.15, 0, 0, Math.PI * 2); g.fill()
    g.translate(0, -s * 0.95); g.rotate(-Math.PI / 4)
    g.fillStyle = '#fff'; kit.tondo(g, -s * 0.62, -s * 0.62, s * 1.24, s * 1.24, s * 0.62); g.fill()
    g.beginPath(); g.moveTo(-s * 0.62, 0); g.lineTo(-s * 0.62, s * 0.62); g.lineTo(0, s * 0.62); g.fill()
    g.fillStyle = col; kit.tondo(g, -s * 0.45, -s * 0.45, s * 0.9, s * 0.9, s * 0.45); g.fill()
    g.beginPath(); g.moveTo(-s * 0.45, 0); g.lineTo(-s * 0.45, s * 0.45); g.lineTo(0, s * 0.45); g.fill()
    g.restore()
  }

  // la strada: profondità z (1 vicino … 40 lontano) → y sullo schermo
  function strada(g, w, h, P, ph, vx, avanti, su) {
    const hy = h * 0.6, Y = (z) => hy + (h - hy) / z, X = (z, lato) => vx + lato * (w * 0.62) / z + (1 - 1 / z) * Math.sin(ph * 0.2) * 0
    // il terreno
    g.fillStyle = P.terra; g.fillRect(0, hy, w, h - hy)
    const l = g.createLinearGradient(0, hy, 0, h)
    l.addColorStop(0, P.nebbia); l.addColorStop(0.4, 'rgba(0,0,0,0)'); l.addColorStop(1, 'rgba(0,0,0,.25)')
    g.fillStyle = l; g.fillRect(0, hy, w, h - hy)
    // la banchina e l'asfalto
    g.fillStyle = P.margine
    g.beginPath(); g.moveTo(vx, hy); g.lineTo(vx + w * 1.05, h); g.lineTo(vx - w * 1.05, h); g.closePath(); g.fill()
    g.fillStyle = P.strada
    g.beginPath(); g.moveTo(vx, hy); g.lineTo(vx + w * 0.72, h); g.lineTo(vx - w * 0.72, h); g.closePath(); g.fill()
    const ga = g.createLinearGradient(0, hy, 0, h)
    ga.addColorStop(0, 'rgba(255,255,255,.12)'); ga.addColorStop(1, 'rgba(0,0,0,.12)')
    g.fillStyle = ga; g.beginPath(); g.moveTo(vx, hy); g.lineTo(vx + w * 0.72, h); g.lineTo(vx - w * 0.72, h); g.closePath(); g.fill()
    // le righe ai bordi e i tratteggi in mezzo, che vengono avanti
    g.strokeStyle = P.riga; g.lineWidth = Math.max(1, w * 0.004)
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(vx, hy); g.lineTo(vx + s * w * 0.66, h); g.stroke() }
    g.fillStyle = P.riga
    for (let i = 0; i < 18; i++) {
      const z0 = 1 + ((i - avanti) % 18 + 18) % 18 * 1.6, z1 = z0 + 0.7
      if (z0 < 1) continue
      const y0 = Y(z1), y1 = Math.min(h, Y(z0)), w0 = w * 0.006 / z1 * 3, w1 = w * 0.006 / z0 * 3
      g.beginPath(); g.moveTo(vx - w0, y0); g.lineTo(vx + w0, y0); g.lineTo(vx + w1, y1); g.lineTo(vx - w1, y1); g.closePath(); g.fill()
    }
    // le cose ai lati: pini, pali con i fili, cespugli
    const pali = []
    for (let i = 0; i < 10; i++) {
      const z = 1.2 + ((i * 2.2 - avanti * 0.9) % 22 + 22) % 22
      for (const s of [-1, 1]) {
        if (P.lati === 'pali' && s > 0) continue
        const x = vx + s * (w * 0.95) / z, y = Y(z), a = (h * 0.55) / z
        if (x < -a || x > w + a) continue
        if (P.lati === 'pini') {
          g.fillStyle = '#0f1d1b'
          for (let k = 0; k < 3; k++) { const yy = y - a * (0.35 + k * 0.3), ww = a * (0.32 - k * 0.08); g.beginPath(); g.moveTo(x, yy - a * 0.38); g.lineTo(x + ww, yy + a * 0.05); g.lineTo(x - ww, yy + a * 0.05); g.fill() }
          g.fillRect(x - a * 0.03, y - a * 0.35, a * 0.06, a * 0.35)
        } else if (P.lati === 'pali') {
          g.fillStyle = '#3b3a38'; g.fillRect(x - a * 0.02, y - a * 1.2, a * 0.04, a * 1.2)
          g.fillRect(x - a * 0.16, y - a * 1.12, a * 0.32, a * 0.03)
          pali.push([x, y - a * 1.1, a])
        } else {
          g.fillStyle = '#7a8a3e'; g.beginPath(); g.ellipse(x, y - a * 0.06, a * 0.16, a * 0.08, 0, 0, Math.PI * 2); g.fill()
          g.fillStyle = '#5d6e2c'; g.beginPath(); g.ellipse(x + a * 0.05, y - a * 0.08, a * 0.1, a * 0.06, 0, 0, Math.PI * 2); g.fill()
        }
      }
    }
    if (pali.length > 1) { // i fili della luce fra un palo e l'altro, che pendono
      pali.sort((p, q) => q[2] - p[2])
      g.strokeStyle = 'rgba(30,30,30,.7)'; g.lineWidth = 1
      for (let i = 0; i < pali.length - 1; i++) for (const d of [-0.12, 0.12]) {
        const [x0, y0, a0] = pali[i], [x1, y1, a1] = pali[i + 1]
        g.beginPath(); g.moveTo(x0 + d * a0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + a0 * 0.12, x1 + d * a1, y1); g.stroke()
      }
    }
    // le frecce di Street View sulla strada
    const fa = 0.5 + su * 0.4 + Math.sin(ph * 3) * 0.1
    g.save(); g.translate(vx, h * 0.9); g.scale(1, 0.38)
    for (const [ang, k] of [[0, 1], [Math.PI, 0.75]]) {
      g.save(); g.rotate(ang)
      g.fillStyle = `rgba(255,255,255,${fa * k})`
      g.beginPath(); g.moveTo(0, -h * 0.2); g.lineTo(w * 0.05, -h * 0.1); g.lineTo(w * 0.022, -h * 0.1); g.lineTo(0, -h * 0.145); g.lineTo(-w * 0.022, -h * 0.1); g.lineTo(-w * 0.05, -h * 0.1); g.closePath(); g.fill()
      g.restore()
    }
    g.restore()
  }

  const api = { titolo: false, fermo: 6.5, ridimensiona: rifai, frame: fotogramma(m, disegna) }
  return api

  function disegna(t) {
    const { g, w, h } = m, su = m.su
    if (w !== W || h !== H || !mappa) rifai(w, h)
    const giro = Math.floor(t / GIRO), ph = t - giro * GIRO, n = giro % POSTI.length, P = POSTI[n], S = strati[n]

    // ── la strada di Street View: si gira la testa piano (col mouse sopra più svelti) ──
    const vel = 1 + su * 2.2
    const pan = Math.sin(t * 0.21 * vel) * w * 0.28 + t * w * 0.012 * vel
    const zoom = ph < 0.7 ? 1.12 - kit.ease.out(ph / 0.7) * 0.12 : 1
    g.save()
    if (zoom !== 1) { g.translate(w / 2, h * 0.6); g.scale(zoom, zoom); g.translate(-w / 2, -h * 0.6) }
    g.drawImage(S.cielo, 0, 0, w, h * 0.62)
    for (const [c, k, dy] of [[S.lontani, 0.25, 0], [S.vicini, 0.55, 0]]) {
      const x = -(((pan * k) % (w * 2)) + w * 2) % (w * 2)
      g.drawImage(c, x, dy, w * 2, h * 0.62); g.drawImage(c, x + w * 2, dy, w * 2, h * 0.62)
    }
    const vx = w * 0.5 - Math.sin(t * 0.21 * vel) * w * 0.22
    strada(g, w, h, P, ph, vx, ph * 1.1 + giro * 7, su)
    g.restore()

    // ── il foglio della mappa, col nastro ──
    const kSu = kit.ease.inOut(su), sc = 1 + kSu * 0.18
    const fcx = w * (0.79 - kSu * 0.08), fcy = h * (0.66 - kSu * 0.1), rot = 0.035 - kSu * 0.03 + Math.sin(t * 0.6) * 0.006
    g.save(); g.translate(fcx, fcy); g.rotate(rot); g.scale(sc, sc)
    g.drawImage(foglioC.c, -foglioC.w / 2, -foglioC.h / 2, foglioC.w, foglioC.h)
    const ox = -foglioC.w / 2 + 12 + w * 0.015, oy = -foglioC.h / 2 + 12 + w * 0.015
    g.save(); g.beginPath(); g.rect(ox, oy, MW, MH); g.clip()
    g.drawImage(mappa, ox, oy, MW, MH)
    if (su > 0.01) { // i punti si accendono: un'onda che passa sul mondo
      const fx = ox + ((t * 0.25) % 1) * MW * 1.4 - MW * 0.2
      const lg = g.createLinearGradient(fx - MW * 0.15, 0, fx + MW * 0.15, 0)
      lg.addColorStop(0, 'rgba(255,212,0,0)'); lg.addColorStop(0.5, `rgba(255,212,0,${0.35 * su})`); lg.addColorStop(1, 'rgba(255,212,0,0)')
      g.globalCompositeOperation = 'multiply'; g.fillStyle = lg; g.fillRect(ox, oy, MW, MH); g.globalCompositeOperation = 'source-over'
    }
    // gli spilli: il tuo (rosso) cade, poi quello vero (verde) e la riga tratteggiata
    const [tx, ty] = proietta(P.tiro), [vx2, vy2] = proietta(P.vero)
    const kT = (ph - 2.4) / 0.6, kV = (ph - 3.4) / 0.6, kL = kit.clamp((ph - 3.3) / 0.5), s = Math.max(5, w * 0.022)
    if (kL > 0 && ph < 8.7) {
      g.strokeStyle = '#161616'; g.lineWidth = Math.max(1.2, w * 0.004); g.setLineDash([2, 5]); g.lineCap = 'round'
      g.beginPath(); g.moveTo(ox + tx, oy + ty); g.lineTo(ox + tx + (vx2 - tx) * kL, oy + ty + (vy2 - ty) * kL); g.stroke(); g.setLineDash([])
    }
    if (ph < 8.7) { spillo(g, ox + tx, oy + ty, s, '#b3121f', kT); spillo(g, ox + vx2, oy + vy2, s, '#23864a', kV) }
    if (kV > 0 && kV < 2) { // l'anello che si allarga sul posto vero
      const k = kV / 2
      g.strokeStyle = `rgba(35,134,74,${1 - k})`; g.lineWidth = 2
      g.beginPath(); g.arc(ox + vx2, oy + vy2, s * (0.5 + k * 3), 0, Math.PI * 2); g.stroke()
    }
    g.restore()
    // il timbro e «sei in …»
    const kS = (ph - 4.0) / 0.35
    if (kS > 0 && ph < 8.7) {
      const e = kS < 1 ? 1.6 - 0.6 * kit.ease.out(kS) : 1, col = P.giusto ? '#23864a' : '#b3121f'
      const ty2 = oy + MH + w * 0.045
      g.save(); g.translate(ox + w * 0.075, ty2); g.rotate(-0.05); g.scale(e, e)
      g.globalAlpha = Math.min(1, kS * 2)
      const z = w * 0.045
      g.font = `400 ${z}px Anton`
      const tw = g.measureText(P.giusto ? 'giusto!' : 'no!').width
      g.strokeStyle = col; g.lineWidth = Math.max(1, w * 0.003)
      g.strokeRect(-tw / 2 - z * 0.25, -z * 0.62, tw + z * 0.5, z * 1.22); g.strokeRect(-tw / 2 - z * 0.33, -z * 0.7, tw + z * 0.66, z * 1.38)
      g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(P.giusto ? 'giusto!' : 'no!', 0, z * 0.04)
      g.restore()
      const nome = nomeDi(P.codice)
      kit.scritta(g, P.giusto ? 'sei in' : `era`, ox + w * 0.16, ty2 - w * 0.008, { font: 'Permanent Marker', size: w * 0.024, color: '#b3121f', rot: -0.03 })
      kit.scritta(g, nome.toLowerCase(), ox + w * 0.16, ty2 + w * 0.024, { font: 'Anton', size: w * 0.034, color: '#161616', rot: -0.03 })
    }
    kit.nastro(g, 0, -foglioC.h / 2 + 12, w * 0.1, w * 0.026, -0.06)
    g.restore()

    // ── il passaggio a un posto nuovo: il lampo bianco di Street View ──
    const lampo = ph < 0.5 ? 1 - ph / 0.5 : ph > 8.6 ? (ph - 8.6) / 0.4 : 0
    if (lampo > 0) { g.fillStyle = `rgba(255,255,255,${lampo * 0.9})`; g.fillRect(0, 0, w, h) }
    kit.metti(g, sopra, 0, 0, w, h)

    // ── la targa del gioco, che fa da titolo ──
    const tw = Math.min(w * 0.5, h * 0.95), th = tw * 0.32
    g.save(); g.translate(0, 0)
    g.fillStyle = 'rgba(0,0,0,.3)'; kit.tondo(g, 0, -10, tw + w * 0.008, th + 10 + w * 0.008, w * 0.014); g.fill()
    g.fillStyle = '#161616'; kit.tondo(g, -10, -10, tw + 10, th + 10, w * 0.014); g.fill()
    const z = th * 0.5
    kit.scritta(g, 'pzkmaps', tw * 0.07, th * 0.56, { font: 'Anton', size: z, color: '#ffd400', spazio: z * 0.01 })
    kit.scritta(g, `mondo · posto n. ${giro + 1}`, tw * 0.07, th * 0.86, { font: 'Permanent Marker', size: th * 0.17, color: '#fff' })
    g.restore()
  }
}
