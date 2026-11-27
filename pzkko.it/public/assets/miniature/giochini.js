// miniature/giochini.js — Casinò $pzk: il foglio vero della roulette (art/roulette/carta.webp, col nastro) attaccato al
// muro, con la ruota europea che gira davvero (i 37 numeri nell'ordine di games/roulette/ruota.js, i colori e l'ottone del
// gioco), il tavolo stampato col suo zero verde, le fiches fotografate (art/fiches) e il dolly. La pallina parte, corre
// sulla pista, rallenta, salta fra i rombi e cade nella casella: il cartello del numero si stampa, a pennarello rosso
// «25 rosso: ti tornano 180 $pzk», le fiches volano nel saldo. Accanto, sul muro, le foto vere degli altri tavoli
// (blackjack, mine, dado, testa o croce, virtual) che si danno il cambio, e l'insegna del casinò al neon.
// Col mouse sopra: il foglio si raddrizza e viene avanti, la ruota corre, le foto si aprono a ventaglio.
import { MEDIA } from '../media.js'
import { NUMERI, colore } from '../../games/roulette/ruota.js'

const N = NUMERI.length, DELTA = (Math.PI * 2) / N
const ROSSO = '#b3121f', NERO = '#161616', VERDE = '#0b5d2b'
const SPICCHIO = { rosso: '#a8121d', nero: '#141313', verde: '#0b6a32' }
const CASELLA = { rosso: '#86101a', nero: '#121111', verde: '#0a5a2b' }
const OTTONE = '#d8b56a'
// le mani: dove cade la pallina, cosa c'è sul tavolo (numero → fiche), quanto torna
const MANI = [
  { esce: 25, puntate: [[25, 'f5'], [11, 'f1']] },
  { esce: 8, puntate: [[17, 'f25'], [20, 'f5']] },
  { esce: 32, puntate: [[32, 'f25'], [35, 'f1']] },
  { esce: 0, puntate: [[0, 'f5'], [26, 'f1']] },
]
const VALORE = { f1: 1, f5: 5, f25: 25, f100: 100, f500: 500 }
const MANO = 11 // secondi di una mano
const LANCIO = 1.1, CADE = 6.6 // quando parte la pallina, quando è nella casella
const fmt = (n) => n.toLocaleString('it-IT')

// la vignetta e la grana in uno strato solo, fatto una volta: a ogni fotogramma costa un drawImage
// (granella e vignetta del kit rifatte a ogni fotogramma pesano quanto tutta la scena)
function finitura(kit, W, H, dpr, scuro = 0.42, grana = 0.07) {
  return kit.strato(W, H, dpr, (g) => {
    kit.vignetta(g, W, H, scuro)
    const n = document.createElement('canvas'), x = n.getContext('2d'), r = kit.rng(5)
    n.width = n.height = 96
    const d = x.createImageData(96, 96)
    for (let i = 0; i < d.data.length; i += 4) { const v = r(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > 0.5 ? 255 : 0; d.data[i + 3] = Math.abs(v - 0.5) * 2 * grana * 255 }
    x.putImageData(d, 0, 0)
    g.fillStyle = g.createPattern(n, 'repeat')
    g.fillRect(0, 0, W, H)
  })
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU, rng } = kit
  const shots = (MEDIA.giochini?.shots ?? []).slice(1, 6).map((s) => s.src) // blackjack, mine, dado, moneta, virtual
  const [carta, muro, legno, dolly, ...resto] = await Promise.all([
    kit.img('/art/roulette/carta.webp'), kit.img('/art/muro.webp'), kit.imgForse('/art/roulette/legno.webp'), kit.imgForse('/art/fiches/dolly.webp'),
    ...['f1', 'f5', 'f25', 'f100', 'f500'].map((f) => kit.imgForse(`/art/fiches/${f}.webp`)),
    ...shots.map((s) => kit.imgForse(s)),
  ])
  const fiche = { f1: resto[0], f5: resto[1], f25: resto[2], f100: resto[3], f500: resto[4] }
  const foto = resto.slice(5).filter(Boolean)
  await Promise.all(['Anton', 'Permanent Marker', 'Special Elite', m.font].map((f) => kit.font(f)))

  // conti delle mani: quanto torna e il saldo prima di ognuna
  let saldo = 1000
  for (const h of MANI) {
    h.prima = saldo
    h.puntato = h.puntate.reduce((a, [, f]) => a + VALORE[f], 0)
    h.torna = h.puntate.reduce((a, [n, f]) => a + (n === h.esce ? VALORE[f] * 36 : 0), 0)
    saldo += h.torna - h.puntato
    h.dopo = saldo
    h.col = colore(h.esce)
  }

  let W = 0, H = 0, dprFatto = 0
  let fino, fondo, insegnaSpenta, insegnaAccesa, foglio, rotore, ombraFoto, fotoPiccole = []
  let PW = 0, PH = 0, R = 0, RY = 0
  const SQ = 0.56 // quanto è schiacciata la ruota (la guardiamo di sbieco)
  let tau = 0

  // ── la geometria nel foglio (origine al centro della carta) ──
  const ruota = () => ({ x: -0.16 * PW, y: 0.02 * PH })
  const tav = () => ({ x0: 0.13 * PW, x1: 0.445 * PW, y0: -0.2 * PH, z0: -0.285 * PH, y1: 0.415 * PH })
  function cella(n) {
    const t = tav(), cw = (t.x1 - t.x0) / 3, rh = (t.y1 - t.y0) / 12
    if (n === 0) return { x: (t.x0 + t.x1) / 2, y: (t.z0 + t.y0) / 2, w: t.x1 - t.x0, h: t.y0 - t.z0 }
    const r = Math.ceil(n / 3) - 1, c = (n - 1) % 3
    return { x: t.x0 + (c + 0.5) * cw, y: t.y0 + (r + 0.5) * rh, w: cw, h: rh }
  }
  const saldoXY = () => ({ x: -0.455 * PW, y: 0.455 * PH })

  function ridimensiona(w, h) {
    W = w; H = h
    PW = W * 0.6; PH = PW / 1.415
    R = PW * 0.265; RY = R * SQ
    const dpr = m.dpr
    // il muro di notte, con la luce calda della lampada sul foglio
    fondo = kit.strato(W, H, dpr, (g) => {
      const s = (H * 1.25) / muro.height
      for (let x = 0; x < W; x += muro.width * s) g.drawImage(muro, x, -H * 0.1, muro.width * s, muro.height * s)
      g.fillStyle = 'rgba(6,20,12,.74)'
      g.fillRect(0, 0, W, H)
      const l = g.createRadialGradient(W * 0.68, H * 0.35, 0, W * 0.68, H * 0.45, W * 0.62)
      l.addColorStop(0, 'rgba(255,214,150,.30)'); l.addColorStop(0.6, 'rgba(255,190,120,.08)'); l.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = l
      g.fillRect(0, 0, W, H)
    })
    fino = finitura(kit, W, H, dpr, 0.4)
    // l'insegna al neon: i tubi spenti e la luce (sfocata una volta sola)
    const fs = W * 0.088
    const scriviInsegna = (g, acceso) => {
      g.font = `400 ${fs}px "${m.font}"`
      g.textBaseline = 'alphabetic'
      g.lineJoin = 'round'
      const righe = [['casinò', W * 0.04, H * 0.27], ['$pzk', W * 0.085, H * 0.27 + fs * 0.98]]
      for (const [s, x, y] of righe) {
        if (acceso) {
          g.shadowColor = 'rgba(124,255,80,.95)'; g.shadowBlur = fs * 0.35 * dpr
          g.strokeStyle = '#9dff6a'; g.lineWidth = fs * 0.07
          g.strokeText(s, x, y)
          g.shadowBlur = fs * 0.12 * dpr
          g.strokeText(s, x, y)
          g.shadowBlur = 0
          g.strokeStyle = '#f2ffe6'; g.lineWidth = fs * 0.025
          g.strokeText(s, x, y)
        } else {
          g.fillStyle = 'rgba(0,0,0,.35)'
          g.fillText(s, x + fs * 0.04, y + fs * 0.06)
          g.strokeStyle = 'rgba(90,120,80,.55)'; g.lineWidth = fs * 0.07
          g.strokeText(s, x, y)
        }
      }
    }
    insegnaSpenta = kit.strato(W * 0.5, H * 0.62, dpr, (g) => scriviInsegna(g, false))
    insegnaAccesa = kit.strato(W * 0.5, H * 0.62, dpr, (g) => scriviInsegna(g, true))
    ombraFoto = kit.strato(W * 0.42, W * 0.27, dpr, (g, ow, oh) => {
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = W * 0.02 * dpr; g.shadowOffsetX = -ow * 2 * dpr; g.shadowOffsetY = 0
      g.fillStyle = '#000'; g.fillRect(ow * 0.1 + ow * 2, oh * 0.12, ow * 0.8, oh * 0.8)
    })
    // le foto vere già alla loro misura (rimpicciolire 1600 × 900 a ogni fotogramma costa)
    const fw = W * 0.32, fh = fw * 0.5625
    fotoPiccole = foto.map((im) => kit.strato(fw, fh, dpr, (g) => { g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, fw, fh) }))
    foglio = kit.strato(PW * 1.3, PH * 1.4, dpr, (g, fw, fh) => disegnaFoglio(g, fw / 2, fh / 2))
    rotore = kit.strato(R * 2, R * 2, dpr * 2, (g) => disegnaRotore(g, R))
  }

  // ── la parte ferma del foglio: carta, testata, tavolo stampato, la scodella della ruota ──
  function disegnaFoglio(g, ox, oy) {
    g.save()
    g.translate(ox, oy)
    const IW = PW / 0.854, IH = PH / 0.805
    g.save()
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = PW * 0.05 * m.dpr; g.shadowOffsetY = PW * 0.02 * m.dpr
    g.drawImage(carta, -PW / 2 - 0.073 * IW, -PH / 2 - 0.098 * IH, IW, IH)
    g.restore()
    // la testata
    g.fillStyle = NERO
    g.font = `400 ${PW * 0.082}px Anton`
    g.textBaseline = 'alphabetic'
    g.fillText('roulette', -0.455 * PW, -0.33 * PH)
    // il tavolo: lo zero verde in cima, poi 12 righe da tre numeri (come il tavolo vero, in verticale)
    const t = tav(), cw = (t.x1 - t.x0) / 3, rh = (t.y1 - t.y0) / 12
    g.globalCompositeOperation = 'multiply'
    g.fillStyle = VERDE
    g.fillRect(t.x0, t.z0, t.x1 - t.x0, t.y0 - t.z0)
    for (let n = 1; n <= 36; n++) {
      const c = cella(n)
      g.fillStyle = colore(n) === 'rosso' ? ROSSO : '#2a2a2a'
      g.fillRect(c.x - c.w / 2 + 0.6, c.y - c.h / 2 + 0.6, c.w - 1.2, c.h - 1.2)
    }
    g.globalCompositeOperation = 'source-over'
    g.font = `400 ${rh * 0.78}px Anton`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillStyle = '#f4efe1'
    for (let n = 1; n <= 36; n++) { const c = cella(n); g.fillText(String(n), c.x, c.y + rh * 0.04) }
    g.font = `400 ${(t.y0 - t.z0) * 0.8}px Anton`
    g.fillText('0', (t.x0 + t.x1) / 2, (t.z0 + t.y0) / 2)
    // le colonne in fondo «2:1» e la cornice a matita
    g.strokeStyle = 'rgba(22,22,22,.8)'; g.lineWidth = Math.max(0.6, PW * 0.003)
    g.strokeRect(t.x0, t.z0, t.x1 - t.x0, t.y1 - t.z0)
    // la ruota: l'ombra sul foglio, il fianco di legno, il bordo, la pista e il piano coi rombi (fermi)
    const c = ruota()
    g.save()
    g.translate(c.x, c.y)
    g.save()
    g.filter = `blur(${R * 0.06}px)`
    g.fillStyle = 'rgba(40,20,10,.45)'
    g.beginPath(); g.ellipse(R * 0.04, RY * 0.5, R * 1.04, RY * 1.08, 0, 0, TAU); g.fill()
    g.restore()
    const fianco = R * 0.14
    const lg = g.createLinearGradient(-R, 0, R, 0)
    lg.addColorStop(0, '#2a1410'); lg.addColorStop(0.35, '#6a2c1e'); lg.addColorStop(0.6, '#4a1f16'); lg.addColorStop(1, '#1e0e0a')
    g.fillStyle = lg
    g.beginPath(); g.ellipse(0, fianco, R, RY, 0, 0, Math.PI); g.lineTo(-R, 0); g.ellipse(0, 0, R, RY, 0, Math.PI, 0, true); g.closePath(); g.fill()
    g.scale(1, SQ)
    // il bordo di legno lucido
    g.save()
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.arc(0, 0, R * 0.86, 0, TAU, true); g.clip()
    if (legno) { g.drawImage(legno, -R, -R, R * 2, R * 2); g.fillStyle = 'rgba(106,40,28,.35)'; g.fillRect(-R, -R, R * 2, R * 2) } else { g.fillStyle = '#5a2318'; g.fillRect(-R, -R, R * 2, R * 2) }
    const lu = g.createLinearGradient(0, -R, 0, R)
    lu.addColorStop(0, 'rgba(255,230,200,.35)'); lu.addColorStop(0.5, 'rgba(255,255,255,0)'); lu.addColorStop(1, 'rgba(0,0,0,.35)')
    g.fillStyle = lu; g.fillRect(-R, -R, R * 2, R * 2)
    g.restore()
    // la pista scura e il piano inclinato
    g.fillStyle = '#17120f'
    g.beginPath(); g.arc(0, 0, R * 0.86, 0, TAU); g.arc(0, 0, R * 0.79, 0, TAU, true); g.fill()
    const pi = g.createRadialGradient(0, 0, R * 0.68, 0, 0, R * 0.79)
    pi.addColorStop(0, '#2a1c16'); pi.addColorStop(1, '#4b2a1f')
    g.fillStyle = pi
    g.beginPath(); g.arc(0, 0, R * 0.79, 0, TAU); g.arc(0, 0, R * 0.69, 0, TAU, true); g.fill()
    // i rombi d'ottone
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2, r = R * 0.74
      g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(a)
      g.fillStyle = '#e8cf8f'
      g.beginPath(); g.moveTo(-R * 0.035, 0); g.lineTo(0, -R * 0.014); g.lineTo(R * 0.035, 0); g.lineTo(0, R * 0.014); g.closePath(); g.fill()
      g.restore()
    }
    g.restore()
    g.restore()
  }

  // ── il rotore visto dall'alto: l'anello dei numeri, le caselle, il cono, la torretta ──
  function disegnaRotore(g, r) {
    g.translate(r, r)
    for (let i = 0; i < N; i++) {
      const a0 = (i - 0.5) * DELTA, a1 = (i + 0.5) * DELTA, n = NUMERI[i]
      g.fillStyle = SPICCHIO[colore(n)]
      g.beginPath(); g.arc(0, 0, r * 0.69, a0, a1); g.arc(0, 0, r * 0.585, a1, a0, true); g.closePath(); g.fill()
      g.fillStyle = CASELLA[colore(n)]
      g.beginPath(); g.arc(0, 0, r * 0.585, a0, a1); g.arc(0, 0, r * 0.5, a1, a0, true); g.closePath(); g.fill()
      // il numero, scritto verso fuori
      g.save()
      g.rotate(i * DELTA)
      g.translate(r * 0.637, 0)
      g.rotate(Math.PI / 2)
      g.fillStyle = '#f6f1e6'
      g.font = `400 ${r * 0.075}px Anton`
      g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(String(n), 0, 0)
      g.restore()
      // i fili d'ottone fra le caselle
      g.strokeStyle = OTTONE; g.lineWidth = r * 0.008
      g.beginPath(); g.moveTo(Math.cos(a0) * r * 0.5, Math.sin(a0) * r * 0.5); g.lineTo(Math.cos(a0) * r * 0.69, Math.sin(a0) * r * 0.69); g.stroke()
    }
    g.strokeStyle = OTTONE; g.lineWidth = r * 0.01
    for (const k of [0.69, 0.585, 0.5]) { g.beginPath(); g.arc(0, 0, r * k, 0, TAU); g.stroke() }
    // il cono di legno chiaro, lucido
    const co = g.createRadialGradient(-r * 0.1, -r * 0.12, r * 0.05, 0, 0, r * 0.5)
    co.addColorStop(0, '#a05a3a'); co.addColorStop(0.55, '#6a2c1e'); co.addColorStop(1, '#3a1810')
    g.fillStyle = co
    g.beginPath(); g.arc(0, 0, r * 0.5, 0, TAU); g.fill()
    g.strokeStyle = 'rgba(216,181,106,.6)'; g.lineWidth = r * 0.006
    g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.stroke()
    // la torretta: la croce cromata con i pomelli
    const cr = g.createLinearGradient(-r * 0.2, -r * 0.2, r * 0.2, r * 0.2)
    cr.addColorStop(0, '#f4f2ee'); cr.addColorStop(0.5, '#a9a6a0'); cr.addColorStop(1, '#efece6')
    g.strokeStyle = cr; g.lineCap = 'round'; g.lineWidth = r * 0.03
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.26, Math.sin(a) * r * 0.26); g.stroke()
      g.fillStyle = '#e6e3dc'
      g.beginPath(); g.arc(Math.cos(a) * r * 0.27, Math.sin(a) * r * 0.27, r * 0.025, 0, TAU); g.fill()
    }
    g.fillStyle = cr
    g.beginPath(); g.arc(0, 0, r * 0.085, 0, TAU); g.fill()
    g.fillStyle = 'rgba(255,255,255,.8)'
    g.beginPath(); g.arc(-r * 0.025, -r * 0.03, r * 0.03, 0, TAU); g.fill()
  }

  // ── una fiche vista di sbieco (schiacciata), con l'ombra ──
  function disegnaFiche(g, im, x, y, d, sq = 1, alpha = 1) {
    if (!im) return
    g.save()
    g.globalAlpha *= alpha
    g.fillStyle = 'rgba(0,0,0,.3)'
    g.beginPath(); g.ellipse(x + d * 0.06, y + d * 0.1, d * 0.5, d * 0.5 * Math.max(0.3, sq), 0, 0, TAU); g.fill()
    g.translate(x, y); g.scale(1, sq)
    g.drawImage(im, -d / 2, -d / 2, d, d)
    g.restore()
  }

  // ── la pallina: angolo e raggio (in px della ruota, non schiacciati) al tempo s della mano ──
  const pa = (n) => NUMERI.indexOf(n) * DELTA
  const thetaW = (tt) => -0.55 * tt // il rotore gira piano, in senso antiorario
  function pallina(s, h, prima, tt) {
    if (s < LANCIO) return { a: thetaW(tt) + pa(prima.esce), r: R * 0.545, salta: 0 }
    const T = CADE - LANCIO, k = clamp((s - LANCIO) / T)
    const d = (((pa(prima.esce) - pa(h.esce)) % TAU) + TAU) % TAU
    const B = d - TAU * 5
    const a = thetaW(tt) + pa(h.esce) + B * (1 - k) ** 3
    const lancio = ease.out(clamp((s - LANCIO) / 0.25))
    let r = lerp(R * 0.545, R * 0.825, lancio)
    let salta = 0
    if (k > 0.62) {
      const q = clamp((k - 0.62) / 0.33)
      r = lerp(R * 0.825, R * 0.545, ease.outBounce(q))
      salta = Math.abs(Math.sin(q * Math.PI * 3)) * (1 - q) // i saltelli fra i rombi
    }
    return { a, r, salta, k }
  }

  function frame(t, dt) {
    if (m.w !== W || m.h !== H || m.dpr !== dprFatto) { dprFatto = m.dpr; ridimensiona(m.w, m.h) }
    const g = m.g, su = m.su
    tau += dt * (1 + 0.6 * su)
    const giro = Math.floor(tau / MANO), s = tau - giro * MANO
    const h = MANI[giro % MANI.length], prima = MANI[(giro + MANI.length - 1) % MANI.length]
    const vinta = h.torna > 0
    const dopo = s - CADE // tempo dal colpo

    // ── il muro ──
    kit.metti(g, fondo, 0, 0, W, H)
    // ── l'insegna: si accende a scatti all'inizio, e lampeggia sulle vincite ──
    const tremo = kit.rumore(tau * 9, 2) > 0.18 ? 1 : 0.35
    const accesa = clamp(s < 0.5 ? (s > 0.12 && s < 0.2 ? 0 : s / 0.5) : 1) * tremo
    const festa = vinta && dopo > 0 && dopo < 2.4 ? 0.5 + 0.5 * Math.sin(dopo * 18) : 0
    kit.metti(g, insegnaSpenta, 0, 0, W * 0.5, H * 0.62)
    g.save(); g.globalAlpha = clamp(0.25 + 0.75 * accesa + 0.3 * festa + 0.2 * su)
    kit.metti(g, insegnaAccesa, 0, 0, W * 0.5, H * 0.62)
    g.restore()
    // la luce verde dell'insegna sul muro
    g.save(); g.globalCompositeOperation = 'lighter'
    const ng = g.createRadialGradient(W * 0.17, H * 0.33, 0, W * 0.17, H * 0.33, W * 0.3)
    ng.addColorStop(0, `rgba(80,200,60,${0.12 * accesa + 0.1 * festa})`); ng.addColorStop(1, 'rgba(80,200,60,0)')
    g.fillStyle = ng; g.fillRect(0, 0, W * 0.5, H * 0.8)
    g.restore()

    // ── le foto vere degli altri tavoli, a ventaglio, che si danno il cambio ──
    if (foto.length) {
      const P = 3.4, nn = Math.floor(tau / P), u = ease.inOut(smooth(0.72, 1, (tau / P) % 1))
      const fw = W * 0.32, fh = fw * 0.5625
      const apri = 1 + 0.5 * su
      const posto = (sl) => ({ x: W * (0.2 - 0.03 * sl * apri), y: H * (0.84 - 0.06 * sl * apri), rot: [-0.07, 0.09, -0.16, 0.05][Math.max(0, Math.min(3, Math.floor(sl)))] })
      const lista = []
      for (let j = 0; j < Math.min(4, foto.length); j++) lista.push(j)
      for (let j = lista.length - 1; j >= 0; j--) {
        const im = fotoPiccole[(nn + j) % foto.length]
        let sl = j - u
        let x, y, rot, a = 1
        if (sl < 0) { // la prima scivola via in basso e va dietro
          const q = -sl
          const p0 = posto(0)
          x = p0.x - q * W * 0.12; y = p0.y + q * H * 0.5; rot = p0.rot - q * 0.4; a = 1 - q
        } else {
          const p0 = posto(Math.floor(sl)), p1 = posto(Math.ceil(sl)), f = sl - Math.floor(sl)
          x = lerp(p0.x, p1.x, f); y = lerp(p0.y, p1.y, f); rot = lerp(p0.rot, p1.rot, f)
          if (sl > 2.2) a = clamp(3 - sl)
        }
        if (a <= 0) continue
        const sc = j === 0 ? 1 + 0.06 * su : 1
        g.save()
        g.globalAlpha = a
        g.translate(x, y); g.rotate(rot); g.scale(sc, sc)
        kit.metti(g, ombraFoto, -fw * 0.62, -fh * 0.62, W * 0.42, W * 0.27)
        g.fillStyle = '#f4efe1'
        g.fillRect(-fw / 2 - 3, -fh / 2 - 3, fw + 6, fh + 6)
        g.drawImage(im, -fw / 2, -fh / 2, fw, fh)
        kit.nastro(g, 0, -fh / 2 - 1, fw * 0.28, fh * 0.13, 0.04 * (j % 2 ? -1 : 1))
        g.restore()
      }
    }

    // ── il foglio della roulette ──
    const fx = lerp(W * 0.685, W * 0.67, su), fy = lerp(H * 0.535, H * 0.52, su)
    const frot = lerp(-0.035, -0.008, su) + Math.sin(tau * 0.4) * 0.004, fsc = 1 + 0.05 * su
    g.save()
    g.translate(fx, fy); g.rotate(frot); g.scale(fsc, fsc)
    kit.metti(g, foglio, -PW * 0.65, -PH * 0.7, PW * 1.3, PH * 1.4)

    // la voce a pennarello rosso, scritta un pezzo alla volta dopo il colpo
    const voce = vinta ? `${h.esce} ${h.col}: ti tornano ${fmt(h.torna)} $pzk` : `${h.esce} ${h.col}: niente, si rigioca`
    const quanti = dopo > 0.3 ? Math.floor(clamp((dopo - 0.3) / 1.2) * voce.length) : 0
    const vecchia = `${prima.esce} ${prima.col}: ${prima.torna ? `ti tornano ${fmt(prima.torna)} $pzk` : 'niente, si rigioca'}`
    const testo = dopo > 0.3 ? voce.slice(0, quanti) : s < LANCIO ? vecchia : 'gira…'
    const svanisce = s < LANCIO ? 1 - smooth(LANCIO - 0.4, LANCIO, s) : 1
    g.save()
    g.globalAlpha = svanisce
    g.translate(-0.15 * PW, -0.345 * PH); g.rotate(-0.025)
    g.font = `400 ${PW * 0.036}px "Permanent Marker"`
    g.fillStyle = ROSSO; g.textBaseline = 'middle'
    g.fillText(testo, 0, 0)
    g.restore()

    // le fiches del tavolo: posate all'inizio della mano, poi vincono (volano nel saldo) o le ritira il banco
    const d = PW * 0.05
    h.puntate.forEach(([n, f], i) => {
      const c = cella(n), posa = ease.outBack(clamp((s - 0.2 - i * 0.25) / 0.4))
      if (posa <= 0) return
      const ok = n === h.esce
      let x = c.x, y = c.y, a = 1
      // arrivano dalla fila delle fiches in basso
      if (posa < 1) { x = lerp(-0.05 * PW, c.x, posa); y = lerp(0.43 * PH, c.y, Math.min(1, posa)) }
      if (dopo > 0.4 && !ok) { const q = clamp((dopo - 0.4) / 0.6); x = lerp(c.x, 0.55 * PW, ease.in(q)); y = lerp(c.y, -0.5 * PH, ease.in(q)); a = 1 - q }
      if (dopo > 1.6 && ok) a = 1 - clamp((dopo - 1.6) / 0.3)
      if (a > 0) disegnaFiche(g, fiche[f], x, y, d, 0.92, a)
    })
    // il dolly che cade sul numero uscito, e il cerchio a pennarello
    const cu = cella(h.esce)
    if (dopo > 0 && dopo < MANO - CADE - 0.3) {
      const q = ease.outBounce(clamp(dopo / 0.5))
      const fuori = 1 - smooth(MANO - CADE - 0.9, MANO - CADE - 0.3, dopo)
      g.save(); g.globalAlpha = fuori
      g.strokeStyle = ROSSO; g.lineWidth = Math.max(1, PW * 0.006); g.lineCap = 'round'
      const giroC = clamp((dopo - 0.2) / 0.5)
      g.beginPath(); g.ellipse(cu.x, cu.y, cu.w * 0.62, cu.h * 0.85, -0.1, -1.2, -1.2 + TAU * 1.08 * giroC); g.stroke()
      if (dolly) { const dw = PW * 0.04, dh = (dw * dolly.height) / dolly.width; g.drawImage(dolly, cu.x - dw / 2, lerp(cu.y - PH * 0.4, cu.y - dh * 0.85, q), dw, dh) }
      g.restore()
    }

    // la ruota che gira e la pallina
    const c = ruota()
    const th = thetaW(tau)
    g.save()
    g.translate(c.x, c.y); g.scale(1, SQ); g.rotate(th)
    kit.metti(g, rotore, -R, -R, R * 2, R * 2)
    g.restore()
    // il riflesso della lampada sul cono (fermo: è la luce, non la ruota)
    g.save(); g.globalCompositeOperation = 'lighter'
    const rf = g.createRadialGradient(c.x - R * 0.15, c.y - RY * 0.25, 0, c.x - R * 0.15, c.y - RY * 0.25, R * 0.45)
    rf.addColorStop(0, 'rgba(255,240,210,.18)'); rf.addColorStop(1, 'rgba(255,240,210,0)')
    g.fillStyle = rf; g.fillRect(c.x - R, c.y - RY, R * 2, RY * 2)
    g.restore()
    const b = pallina(s, h, prima, tau)
    const br = Math.max(1.2, R * 0.04)
    // la scia quando corre
    if (s > LANCIO && b.k < 0.7) {
      for (let i = 1; i <= 4; i++) {
        const bb = pallina(s - i * 0.018, h, prima, tau - i * 0.018)
        g.fillStyle = `rgba(255,250,240,${0.16 * (1 - i / 5)})`
        g.beginPath(); g.arc(c.x + Math.cos(bb.a) * bb.r, c.y + Math.sin(bb.a) * bb.r * SQ - bb.salta * R * 0.08, br * 0.9, 0, TAU); g.fill()
      }
    }
    const bx = c.x + Math.cos(b.a) * b.r, by = c.y + Math.sin(b.a) * b.r * SQ
    g.fillStyle = 'rgba(0,0,0,.4)'
    g.beginPath(); g.ellipse(bx + br * 0.3, by + br * 0.4, br, br * 0.6, 0, 0, TAU); g.fill()
    const sy = by - b.salta * R * 0.08
    const bg = g.createRadialGradient(bx - br * 0.35, sy - br * 0.4, br * 0.1, bx, sy, br)
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.6, '#f0ece2'); bg.addColorStop(1, '#9d978a')
    g.fillStyle = bg
    g.beginPath(); g.arc(bx, sy, br, 0, TAU); g.fill()

    // il cartello del numero, stampato come un timbro
    if (dopo > 0 && dopo < MANO - CADE - 0.2) {
      const q = clamp(dopo / 0.45), sc = lerp(1.8, 1, ease.outBack(q))
      const via = 1 - smooth(MANO - CADE - 0.8, MANO - CADE - 0.2, dopo)
      g.save()
      g.globalAlpha = Math.min(q * 2, 1) * via
      g.translate(c.x + 0.06 * PW, 0.3 * PH); g.rotate(-0.05); g.scale(sc, sc)
      g.font = `400 ${PW * 0.068}px Anton`
      const s2 = `${h.esce} ${h.col}`, tw = g.measureText(s2).width
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-tw / 2 - PW * 0.02, -PW * 0.04 + 2, tw + PW * 0.04, PW * 0.08)
      g.fillStyle = h.col === 'rosso' ? ROSSO : h.col === 'verde' ? VERDE : NERO
      g.fillRect(-tw / 2 - PW * 0.02, -PW * 0.04, tw + PW * 0.04, PW * 0.08)
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(s2, 0, PW * 0.004)
      g.restore()
    }

    // il saldo in basso a sinistra, che conta le fiches che arrivano
    const sxy = saldoXY()
    const conta = vinta ? lerp(h.prima - h.puntato, h.dopo, ease.out(clamp((dopo - 0.9) / 1.2))) : s > 0.3 ? h.dopo : h.prima
    g.save()
    g.fillStyle = NERO; g.textBaseline = 'alphabetic'
    g.font = `400 ${PW * 0.022}px "Permanent Marker"`
    g.fillText('HAI', sxy.x, sxy.y - PW * 0.05)
    g.font = `400 ${PW * 0.06}px Anton`
    g.fillText(`$pzk ${fmt(Math.round(conta))}`, sxy.x, sxy.y)
    if (vinta && dopo > 0.9 && dopo < 2.6) {
      g.globalAlpha = 1 - clamp((dopo - 2) / 0.6)
      kit.evidenzia(g, sxy.x - 2, sxy.y - PW * 0.058, PW * 0.2, PW * 0.07, clamp((dopo - 0.9) / 0.3))
    }
    g.restore()
    // la fila delle fiches da puntare
    ;['f1', 'f5', 'f25', 'f100', 'f500'].forEach((f, i) => {
      const su2 = i === 2 ? Math.sin(tau * 3) * PW * 0.004 : 0
      disegnaFiche(g, fiche[f], -0.07 * PW + i * PW * 0.044, 0.43 * PH + su2, PW * 0.04, 1)
    })
    // le fiches della vincita che volano nel saldo
    if (vinta && dopo > 0.7 && dopo < 2.4) {
      const quante = Math.min(10, 3 + Math.round(h.torna / 100))
      for (let i = 0; i < quante; i++) {
        const q = clamp((dopo - 0.7 - i * 0.07) / 0.6)
        if (q <= 0 || q >= 1) continue
        const e = ease.inOut(q)
        const x = lerp(cu.x, sxy.x + PW * 0.12, e), y = lerp(cu.y, sxy.y - PW * 0.03, e) - Math.sin(q * Math.PI) * PH * 0.35
        disegnaFiche(g, fiche[['f25', 'f5', 'f100', 'f1'][i % 4]], x, y, d * 0.9, Math.abs(Math.cos(q * 9 + i)), 1)
      }
    }
    g.restore()

    // ── la fontana di fiches dal numero uscito, sulle vincite (davanti a tutto, cade fuori dal quadro) ──
    if (vinta && dopo > 0.15 && dopo < 3.2) {
      const co = Math.cos(frot), si = Math.sin(frot)
      const ox = fx + (cu.x * co - cu.y * si) * fsc, oy = fy + (cu.x * si + cu.y * co) * fsc
      const rr = rng(giro * 13 + 1), quante = Math.min(26, 8 + Math.round(h.torna / 40))
      for (let i = 0; i < quante; i++) {
        const vx = (rr() - 0.62) * W * 0.9, vy = -(0.55 + rr() * 0.65) * H * 1.6, sfasa = rr() * 0.35, giri = 6 + rr() * 10
        const f = ['f1', 'f5', 'f25', 'f100', 'f500'][Math.floor(rr() * 5)], dd = W * (0.028 + rr() * 0.022)
        const q = dopo - 0.15 - sfasa
        if (q < 0) continue
        const x = ox + vx * q, y = oy + vy * q + 0.5 * H * 4.2 * q * q
        if (y > H + dd) continue
        disegnaFiche(g, fiche[f], x, y, dd, Math.cos(q * giri + i), clamp(q * 8))
      }
    }
    // ── la luce della lampada, la vignetta, la grana ──
    if (festa > 0) { g.fillStyle = `rgba(255,230,160,${0.06 * festa})`; g.fillRect(0, 0, W, H) }
    kit.metti(g, fino, 0, 0, W, H)
  }

  return { frame, titolo: false, cattura: false, fermo: 7.6 }
}
