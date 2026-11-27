// miniature/rapina.js — Rapina (27.11.2026): di notte, davanti alla saracinesca della cassa di pzk, il cercapersone PZK
// Zero vero (la foto del modello 3D, media/p/zero/02.webp) con l'lcd vivo sopra. Sull'lcd gira la rapina di pzk os coi
// pezzi veri del sistema (os/lcd.js, le icone, la testata a pagine, i tasti) e con le regole vere (app/rapina.js: le
// probabilità della banda, il bottino): la cassa che cresce, il codice di quattro lettere sul biglietto, i complici che
// entrano, il «via!», la cassaforte che si scassina. Poi l'esito, a giri alterni come nel gioco: il colpo riesce e le
// banconote vere dei $pzk saltano fuori dallo schermo, oppure «presi!», il lampeggiante dei carabinieri e la cella.
// Col mouse sopra scattano i laser dell'allarme e tutto va più in fretta.
import { Lcd, PW, PH, W, H, SFONDI, C, esa } from '../../telefono/zero/os/lcd.js'
import * as icone from '../../telefono/zero/os/icone.js'
import { testata, centro, destra, corto, bottoni } from '../../telefono/zero/os/pezzi.js'
import { PROB, bottino, ORE_GALERA, CAUZIONE } from '../../telefono/app/rapina.js'

// ── il cercapersone: la foto vera, scontornata una volta per pagina (la maschera sta sull'immagine stessa) ──
const FOTO = '/media/p/zero/02.webp'
const FW = 1600, FH = 900
const SCHERMO = [77, 134, 775, 470, 44] // x, y, w, h, raggio dell'lcd nella foto
const CROCE = [1138, 368, 223], OKT = [1141, 366, 70], INDIETRO = [1432, 523, 70], LED = [912, 578]
function scontorna(im) {
  if (im._cercapersoneScontornato) return im._cercapersoneScontornato
  const sw = 800, sh = 450, c = document.createElement('canvas')
  c.width = sw; c.height = sh
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(im, 0, 0, sw, sh)
  const d = g.getImageData(0, 0, sw, sh), p = d.data, fuori = new Uint8Array(sw * sh), pila = []
  const buio = (i) => p[i * 4] + p[i * 4 + 1] + p[i * 4 + 2] < 120
  for (let x = 0; x < sw; x++) pila.push(x, (sh - 1) * sw + x)
  for (let y = 0; y < sh; y++) pila.push(y * sw)
  while (pila.length) {
    const i = pila.pop()
    if (fuori[i] || !buio(i)) continue
    fuori[i] = 1
    const x = i % sw
    if (x > 0) pila.push(i - 1)
    if (x < sw - 1) pila.push(i + 1)
    if (i >= sw) pila.push(i - sw)
    if (i < sw * (sh - 1)) pila.push(i + sw)
  }
  for (let i = 0; i < sw * sh; i++) { p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = 255; p[i * 4 + 3] = fuori[i] ? 0 : 255 }
  g.putImageData(d, 0, 0)
  const out = document.createElement('canvas')
  out.width = FW; out.height = FH
  const o = out.getContext('2d')
  o.drawImage(im, 0, 0, FW, FH)
  o.globalCompositeOperation = 'destination-in'
  o.imageSmoothingQuality = 'high'
  o.drawImage(c, 0, 0, FW, FH)
  im._cercapersoneScontornato = out
  return out
}

// ── l'lcd: un Lcd di pzk os senza la sua tela grande (1536 × 768): qui basta 512 × 256, ricopiata a 20 al secondo ──
function nuovoLcd() {
  const l = Object.create(Lcd.prototype)
  Object.assign(l, { fb: new Uint8Array(PW * PH), luce: 1, massima: 1, tema: SFONDI[0], sporco: true, pronti: null, clip: null, ascolti: new Set() })
  const cv = document.createElement('canvas')
  cv.width = PW; cv.height = PH
  const g = cv.getContext('2d')
  const img = g.createImageData(PW, PH), u = new Uint32Array(img.data.buffer)
  l.stampa = () => {
    const { tav, fondo } = l.prepara(), fb = l.fb
    for (let i = 0; i < fb.length; i++) u[i] = tav[fb[i] || fondo[i]]
    g.putImageData(img, 0, 0)
  }
  return { l, cv }
}
const BARRA = 12, MARGINE = 6
/** la barra di stato di pzk os (os.js, barra): l'ora vera, le tacche, il nome, la batteria */
function barra(l, ora) {
  l.riempi(0, 0, W, BARRA, 0)
  l.orizz(1, BARRA - 1, W - 2)
  l.testo(MARGINE + 2, 2, ora)
  for (let i = 0; i < 3; i++) { const h = 2 + i * 2; l.riempi(MARGINE + 38 + i * 3, 9 - h, 2, h) }
  centro(l, 2, 'pzkko')
  const bx = W - MARGINE - 17
  l.testo(bx - 4 - Lcd.larghezza('100%'), 2, '100%')
  l.riquadro(bx, 2, 15, 7); l.vert(bx + 15, 4, 3); l.riempi(bx + 2, 4, 11, 3)
}

// ── la rapina di pzk os (os/rapina.js): i colori dei disegni e i numeri come li scrive la banca ──
const ACCIAIO = esa('#666666'), FERRO = esa('#999999'), LUCE = esa('#cccccc'), BUIO = esa('#333333')
const SU = esa('#006600'), GIU = esa('#990000')
const fmt = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 1, useGrouping: 'always' })
function corti(n) { // (come pzk.fmtCorto)
  const a = Math.abs(n)
  if (a < 1000) return fmt(a)
  const U = [['K', 1e3], ['M', 1e6], ['B', 1e9]], i = U.findLastIndex(([, v]) => a >= v)
  return (Math.round((a / U[i][1]) * 10) / 10).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + U[i][0]
}
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const tingi = (l, x, y, riga, pezzo, col) => { const i = riga.lastIndexOf(pezzo); if (pezzo && i >= 0) l.testo(x + [...riga.slice(0, i)].length * 6, y, pezzo, { col }) }
const FINTO = { zona() {} } // (le zone del clic: qui non si clicca)

// il colpo che si gioca: la banda si riempie fino a quattro, poi il via; il codice e i soprannomi sono inventati
const CODICE = 'MNCO', BANDA = ['pzkko', 'nutria', 'carpa', 'zanzara'], ENTRA = [3, 3.5, 4.4, 5.3]
const CASSA0 = 1243000
const CICLO = 16, T_APERTO = 3, T_VIA = 6.6, T_SCASSO = 7, T_ESITO = 8.6, T_CELLA = 10.4

function disegnaLcd(l, c, riesce, tic, oraOra) {
  const cassa = CASSA0 + Math.floor(c * 1700)
  if (c < T_APERTO) { // la cassa
    testata(l, FINTO, { icona: 'app-rapina', nome: 'il colpo', n: 2, pag: 0 })
    l.bitmap(icone.bitmap('app-rapina', 32), 10, 35)
    l.testo(50, 35, 'la cassa di pzk')
    const s = corti(cassa); l.testo(50, 45, s, { scala: 2 }); l.testo(54 + Lcd.larghezza(s, 2), 52, '$pzk')
    l.testo(10, 69, 'dentro: puntate perse, acquisti e multe')
    const sel = c > 2.2 ? 0 : 1
    ;['organizza un colpo', 'entra col codice'].forEach((v, i) => {
      const y = 81 + i * 13, on = i === sel
      if (on) l.riempi(6, y, W - 12, 12)
      l.testo(10, y + 3, v, { inv: on })
      if (!i) destra(l, W - 10, y + 3, '32-48 %', { inv: on })
    })
    centro(l, H - 9, 'OK fa · ↑↓ sceglie · ←→ regole')
    return
  }
  if (c < T_SCASSO) { // il colpo aperto: il codice sul biglietto, la banda che entra
    testata(l, FINTO, { icona: 'app-rapina', nome: 'il colpo', n: 1 })
    const n = ENTRA.filter((x) => c >= x).length
    l.testo(10, 34, 'il codice: dallo ai complici')
    const bw = Math.min(80, Lcd.larghezza(CODICE, 3) + 6)
    l.riempi(7, 43, bw, 25, BUIO); l.cornice(7, 43, bw, 25, C.oro)
    l.testo(10, 45, CODICE, { scala: 3, col: C.oro })
    l.testo(96, 46, `scade fra ${mmss(899000 - (c - T_APERTO) * 1000)}`)
    l.testo(96, 55, `banda ${n}/4 · riesce ${PROB[Math.max(2, n)]} %`)
    BANDA.slice(0, n).forEach((m, i) => { const xx = 10 + (i % 2) * 118, y = 70 + Math.floor(i / 2) * 9; l.testo(xx, y, i ? `• ${m}` : `• ${m} (capo)`) })
    if (n < 2) centro(l, 89, `serve almeno un complice${'...'.slice(0, (Math.floor(tic / 10) % 3) + 1)}`)
    bottoni(l, FINTO.zona, { etichette: [`via! ${PROB[Math.max(2, n)]} %`, 'esci dal colpo'], sel: 0, y: 101, premi() {} })
    centro(l, H - 9, 'OK preme · ←→ i tasti')
    return
  }
  if (c < T_ESITO) { // la cassaforte che si scassina
    testata(l, FINTO, { icona: 'app-rapina', nome: 'il colpo', n: 1 })
    const k = (c - T_SCASSO) / (T_ESITO - T_SCASSO), cx = 128, cy = 66, r = 18, a = k * 9 * 0.9 + Math.floor(tic / 2) * 0.35
    l.riquadro(cx - 28, cy - 26, 56, 52); l.riempi(cx - 27, cy - 25, 54, 50, ACCIAIO); l.riquadro(cx - 26, cy - 24, 52, 48, FERRO)
    for (let i = 0; i < 24; i++) { const g = (i / 24) * Math.PI * 2; l.px(Math.round(cx + Math.cos(g) * r), Math.round(cy + Math.sin(g) * r), C.oro) }
    for (let s = 0; s < r - 3; s++) l.px(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), C.bianco)
    l.riempi(cx - 1, cy - 1, 3, 3, C.rosso)
    centro(l, 98, 'si scassina la cassa…')
    l.riquadro(68, 108, 120, 6); l.riempi(69, 109, 118, 4, BUIO); l.riempi(70, 110, Math.round(116 * k), 2, C.oro)
    centro(l, H - 9, 'un tasto salta')
    return
  }
  const e = c - T_ESITO
  if (riesce) { // il colpo riuscito: il sacco che salta, la quota sporca
    testata(l, FINTO, { icona: 'app-rapina', nome: 'il colpo', n: 1 })
    const q = Math.round(bottino(cassa, 4)), su = [0, 3, 5, 6, 5, 3, 1, 0][Math.floor(e * 10)] ?? 0
    l.bitmap(icone.bitmap('sacco', 32), 10, 38 - su)
    l.testo(50, 36, 'colpo riuscito', { scala: 2 })
    const preso = corto(`+${fmt(q)} sporchi a testa`, 32)
    l.testo(50, 54, preso); tingi(l, 50, 54, preso, `+${fmt(q)}`, SU)
    l.testo(50, 63, corto(`${fmt(q * 4)} in tutto, 4 nella banda`, 32))
    Lcd.acapo('sporchi: non si spendono né si mandano. Si lavano nella lavatrice, o da soli in 96 giorni.', 39).slice(0, 3).forEach((r, i) => l.testo(10, 74 + i * 9, r))
    bottoni(l, FINTO.zona, { etichette: ['la lavatrice', 'va bene'], sel: 0, y: 101, premi() {} })
    centro(l, H - 9, 'OK preme · ←→ i tasti')
    return
  }
  if (c < T_CELLA) { // presi: il lampeggiante dei carabinieri
    testata(l, FINTO, { icona: 'app-rapina', nome: 'il colpo', n: 2, pag: 0 })
    const on = Math.floor(e * 10) % 4 < 2, o = on ? { col: C.bianco } : {}
    if (on) l.riempi(MARGINE, 32, W - 2 * MARGINE, 86, C.blu)
    l.bitmap(icone.bitmap('sirena', 32), 112, 38)
    centro(l, 78, 'presi!', { scala: 3, col: on ? C.bianco : GIU })
    centro(l, 104, 'arrivano i carabinieri', o)
    centro(l, H - 9, 'un tasto salta')
    return
  }
  // la galera: il bot dietro le sbarre, che ogni tanto si scuotono
  testata(l, FINTO, { icona: 'app-rapina', nome: 'il colpo', n: 2, pag: 0 })
  const scossa = kit_fract((c - T_CELLA) / 2.5) < 0.12, dx = scossa ? (tic % 2 ? 1 : -1) : 0
  l.riquadro(10, 34, 72, 80); l.riempi(11, 35, 70, 78, BUIO)
  l.bitmap(icone.bitmap('bot', 32), 30, 56)
  for (let xx = 16; xx < 80; xx += 9) { l.vert(xx + dx, 35, 78, LUCE); l.vert(xx + 1 + dx, 35, 78, FERRO) }
  l.orizz(11, 44, 70, FERRO); l.orizz(11, 104, 70, FERRO)
  l.testo(92, 35, 'in galera', { scala: 2 })
  const fuori = new Date(oraOra.getTime() + ORE_GALERA * 36e5)
  l.testo(92, 54, `fuori alle ${String(fuori.getHours()).padStart(2, '0')}:${String(fuori.getMinutes()).padStart(2, '0')}`)
  l.testo(92, 63, `fra ${ORE_GALERA - 1} h 59 min`)
  const multa = fmt(1240)
  Lcd.acapo(`presi: ${ORE_GALERA} ore e una multa di ${multa} $pzk.`, 25).slice(0, 2).forEach((r, i) => { l.testo(92, 75 + i * 9, r); tingi(l, 92, 75 + i * 9, r, r.includes(`${multa} $pzk`) ? `${multa} $pzk` : '', GIU) })
  const eti = `cauzione ${fmt(CAUZIONE)}`, bw = Lcd.larghezza(eti) + 8
  l.riempi(92, 99, bw, 11); l.testo(96, 101, eti, { inv: true })
  centro(l, H - 9, 'OK paga la cauzione · ←→ regole')
}
const kit_fract = (v) => v - Math.floor(v)

export default async function crea(m) {
  const { kit } = m
  const [foto, soldi] = await Promise.all([kit.img(FOTO), kit.img('/assets/miniature/rapina/banconote.webp'), kit.font('Vampyre'), kit.font('Permanent Marker')])
  const sagoma = scontorna(foto)
  const { l, cv: lcdCv } = nuovoLcd()
  const rnd = kit.rng('rapina')
  // le banconote vere (b100 e b500 della banca $pzk), ritagliate dal foglio
  const nota = [0, 128].map((y) => { const c = document.createElement('canvas'); c.width = 240; c.height = 126; c.getContext('2d').drawImage(soldi, 0, y, 240, 126, 0, 0, 240, 126); return c })
  const SOLDI = Array.from({ length: 22 }, () => ({ a: -Math.PI / 2 + (rnd() - 0.5) * 2.6, v: 0.6 + rnd() * 0.8, d: rnd() * 0.5, giro: (rnd() - 0.5) * 7, flip: 2 + rnd() * 5, f: rnd() * 6, k: rnd() < 0.35 ? 1 : 0, s: 0.75 + rnd() * 0.5 }))
  const GOCCE = Array.from({ length: 9 }, () => ({ x: rnd(), l: 0.06 + rnd() * 0.16, v: 0.3 + rnd() * 0.7, w: 0.5 + rnd() }))

  let S = {}
  function ridimensiona(w, h) {
    const dpr = m.dpr
    const dw = Math.min(w * 1.05, h * 1.9), s = dw / FW, dh = FH * s
    const dx = w * 0.14, dy = h - dh * 0.86 + h * 0.13, pad = dw * 0.06
    const corpo = kit.strato(dw + pad * 2, dh + pad * 2, dpr, (g) => {
      g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = dw * 0.045; g.shadowOffsetY = dw * 0.022
      g.drawImage(sagoma, pad, pad, dw, dh)
      // di notte: il cercapersone prende la luce rossa della strada
      g.globalCompositeOperation = 'source-atop'
      const lg = g.createLinearGradient(0, 0, dw, dh)
      lg.addColorStop(0, 'rgba(40,0,10,.15)'); lg.addColorStop(1, 'rgba(20,0,5,.45)')
      g.fillStyle = lg; g.fillRect(0, 0, dw + pad * 2, dh + pad * 2)
    })
    // la saracinesca della cassa: le lamelle, la ruggine, il lampione in alto
    const fondo = kit.strato(w, h, dpr, (g) => {
      const r = kit.rng('lamiera'), lh = h * 0.062
      g.fillStyle = m.c2 || '#2a0507'; g.fillRect(0, 0, w, h)
      for (let y = -lh; y < h + lh; y += lh) {
        const lg = g.createLinearGradient(0, y, 0, y + lh)
        lg.addColorStop(0, '#5a1418'); lg.addColorStop(0.35, '#7a2026'); lg.addColorStop(0.7, '#3c0b0e'); lg.addColorStop(1, '#1a0305')
        g.fillStyle = lg; g.fillRect(0, y, w, lh)
      }
      for (let i = 0; i < 260; i++) { // ruggine e sporco
        g.fillStyle = r() < 0.6 ? `rgba(120,55,20,${r() * 0.25})` : `rgba(0,0,0,${r() * 0.3})`
        const x = r() * w, y = r() * h, s = h * (0.003 + r() * 0.012)
        g.fillRect(x, y, s * (1 + r() * 3), s)
      }
      for (let i = 0; i < 6; i++) { // le colature della pioggia
        const x = r() * w, lg = g.createLinearGradient(0, 0, 0, h)
        lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.5, 'rgba(0,0,0,.18)'); lg.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = lg; g.fillRect(x, 0, w * (0.01 + r() * 0.03), h)
      }
      const lu = g.createRadialGradient(w * 0.32, -h * 0.15, h * 0.05, w * 0.32, -h * 0.15, h * 1.1)
      lu.addColorStop(0, 'rgba(255,170,120,.28)'); lu.addColorStop(1, 'rgba(255,120,80,0)')
      g.fillStyle = lu; g.fillRect(0, 0, w, h)
      kit.vignetta(g, w, h, 0.7)
    })
    // il titolo: spruzzato sulla saracinesca, con l'alone della bomboletta
    const tsz = Math.min(w * 0.115, h * 0.2)
    const tlw = w * 0.7, tlh = tsz * 1.5
    let largo = 0
    const titolo = kit.strato(tlw, tlh, dpr, (g) => {
      g.font = `400 ${tsz}px "Vampyre"`
      g.textBaseline = 'alphabetic'
      largo = g.measureText(m.titolo || 'Rapina').width
      g.shadowColor = 'rgba(218,55,60,.85)'; g.shadowBlur = tsz * 0.18
      g.fillStyle = '#da373c'; g.fillText(m.titolo || 'Rapina', tsz * 0.12, tsz * 1.02)
      g.shadowBlur = tsz * 0.04; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowOffsetY = tsz * 0.03
      g.fillStyle = '#ff5a5f'; g.fillText(m.titolo || 'Rapina', tsz * 0.12, tsz * 1.02)
    })
    S = { w, h, dw, dh, s, dx, dy, pad, corpo, fondo, titolo, tsz, tlw, tlh, largo }
  }

  let prima = -1, extra = 0, lcdChiave = ''
  function frame(t, dt) {
    const { w, h } = m
    if (!S.corpo || S.w !== w || S.h !== h) ridimensiona(w, h)
    if (t < prima) extra = 0
    prima = t
    const su = m.su
    extra += (dt || 0) * su * 1
    const tau = t + extra, c = kit.fract(tau / CICLO) * CICLO, riesce = Math.floor(tau / CICLO) % 2 === 0
    const g = m.g
    const { dw, dh, s, dx, dy, pad } = S
    const e = c - T_ESITO

    // ── 1. la saracinesca e il lampeggiante che passa sulle lamelle ──
    kit.metti(g, S.fondo, 0, 0, w, h)
    const preso = !riesce && e > 0
    const forte = preso ? (e < 2.6 ? 1 : 0.35) : 0.12 + 0.1 * su
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 2; i++) {
      const fase = tau * (preso ? 3.2 : 0.9) + i * Math.PI, x = w * (0.5 + Math.cos(fase) * 0.75)
      const col = i ? '60,110,255' : '255,40,50'
      const a = forte * (0.5 + 0.5 * Math.sin(fase * 1.5 + i)) * (preso && e < 2.6 ? (Math.floor(tau * 8) % 2 === i ? 1 : 0.25) : 1)
      const lg = g.createLinearGradient(x - w * 0.35, 0, x + w * 0.35, 0)
      lg.addColorStop(0, `rgba(${col},0)`); lg.addColorStop(0.5, `rgba(${col},${0.45 * a})`); lg.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = lg; g.fillRect(0, 0, w, h)
    }
    g.restore()

    // ── 2. il titolo spruzzato, con le gocce che colano piano ──
    const tx = w * 0.025, ty = h * 0.0
    kit.metti(g, S.titolo, tx, ty, S.tlw, S.tlh)
    g.fillStyle = 'rgba(218,55,60,.85)'
    for (const d of GOCCE) {
      const x = tx + S.tsz * 0.15 + d.x * S.largo * 0.95, y0 = ty + S.tsz * 0.98
      const len = S.tsz * d.l * (0.5 + 0.5 * kit.onda(tau, 9 / d.v, d.x))
      const r = Math.max(0.8, S.tsz * 0.018 * d.w)
      g.fillRect(x - r / 2, y0, r, len)
      g.beginPath(); g.arc(x, y0 + len, r * 0.9, 0, kit.TAU); g.fill()
    }

    // ── 3. il cercapersone ──
    const rot = -0.03 + Math.sin(tau * 0.4) * 0.004, lift = su * 0.02, galla = Math.sin(tau * 0.8) * h * 0.005
    const cx = dx + dw * 0.3, cy = dy + dh * 0.45
    g.save()
    g.translate(cx, cy + galla - lift * h); g.rotate(rot); g.scale(1 + lift, 1 + lift); g.translate(-cx, -cy)
    g.drawImage(S.corpo, dx - pad, dy - pad, dw + pad * 2, dh + pad * 2)
    const sx0 = dx + SCHERMO[0] * s, sy0 = dy + SCHERMO[1] * s, sw = SCHERMO[2] * s, sh = SCHERMO[3] * s
    const tic = Math.floor(tau * 20), ora = new Date()
    const hh = `${String(ora.getHours()).padStart(2, '0')}:${String(ora.getMinutes()).padStart(2, '0')}`
    const luce = Math.round((0.82 + 0.18 * su) * 20) / 20
    const passo = c < T_APERTO ? `a${Math.floor(c * 4)}` : c < T_SCASSO ? `b${Math.floor(c * 2)}:${Math.floor(tic / 10)}` : c < T_ESITO ? `c${Math.floor(tic / 2)}` : riesce ? `r${Math.min(8, Math.floor(e * 10))}` : c < T_CELLA ? `p${Math.floor(e * 10) % 4 < 2}` : `g${tic % 2}:${kit.fract((c - T_CELLA) / 2.5) < 0.12}`
    const chiave = `${passo}|${riesce}|${hh}|${luce}`
    if (chiave !== lcdChiave) { lcdChiave = chiave; l.luce = luce; l.pulisci(); barra(l, hh); disegnaLcd(l, c, riesce, tic, ora); l.stampa() }
    g.save()
    kit.tondo(g, sx0, sy0, sw, sh, SCHERMO[4] * s); g.clip()
    g.imageSmoothingEnabled = sw / PW < 1.2; g.imageSmoothingQuality = 'high'
    g.drawImage(lcdCv, sx0, sy0, sw, sh)
    g.imageSmoothingEnabled = true
    const v1 = g.createLinearGradient(sx0, sy0, sx0 + sw * 0.08, sy0 + sh * 0.12)
    v1.addColorStop(0, 'rgba(0,0,0,.35)'); v1.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = v1; g.fillRect(sx0, sy0, sw, sh)
    const v2 = g.createLinearGradient(sx0, sy0, sx0 + sw, sy0 + sh) // il lampione riflesso sul vetro
    v2.addColorStop(0.1, 'rgba(255,200,170,0)'); v2.addColorStop(0.22, 'rgba(255,200,170,.12)'); v2.addColorStop(0.34, 'rgba(255,200,170,0)')
    g.fillStyle = v2; g.fillRect(sx0, sy0, sw, sh)
    g.restore()
    // i tasti: OK per organizzare e per il via, il led che dice com'è andata
    const premi = (t0, d = 0.16) => (c >= t0 && c < t0 + d ? Math.sin(((c - t0) / d) * Math.PI) : 0)
    const ok = Math.max(premi(2.85), premi(T_VIA), premi(T_VIA + 0.3))
    if (ok > 0) { g.fillStyle = `rgba(60,20,0,${0.35 * ok})`; g.beginPath(); g.arc(dx + OKT[0] * s, dy + OKT[1] * s, OKT[2] * s, 0, kit.TAU); g.fill() }
    const su2 = premi(2.2)
    if (su2 > 0) { g.fillStyle = `rgba(60,20,0,${0.3 * su2})`; g.beginPath(); g.moveTo(dx + CROCE[0] * s, dy + CROCE[1] * s); g.arc(dx + CROCE[0] * s, dy + CROCE[1] * s, CROCE[2] * s, -Math.PI * 0.75, -Math.PI * 0.25); g.closePath(); g.fill() }
    {
      const x = dx + LED[0] * s, y = dy + LED[1] * s
      const acceso = e > 0 ? (riesce ? Math.exp(-e * 0.6) : (Math.floor(tau * 6) % 2 ? 0.9 : 0.2)) : c > T_SCASSO ? (Math.floor(tau * 10) % 2 ? 0.7 : 0) : 0
      const col = e > 0 ? (riesce ? '90,255,120' : '255,40,40') : '255,170,40'
      if (acceso > 0.02) {
        const lr = g.createRadialGradient(x, y, 0, x, y, 40 * s)
        lr.addColorStop(0, `rgba(${col},${acceso})`); lr.addColorStop(0.3, `rgba(${col},${acceso * 0.45})`); lr.addColorStop(1, `rgba(${col},0)`)
        g.fillStyle = lr; g.fillRect(x - 40 * s, y - 40 * s, 80 * s, 80 * s)
      }
    }
    g.restore()

    // ── 4. il colpo: le banconote che saltano fuori dallo schermo, o il timbro dei presi ──
    if (riesce && e > 0 && e < 4.5) {
      const ox = sx0 + sw * 0.2, oy = sy0 + sh * 0.35
      for (const b of SOLDI) {
        const k = e - b.d * 0.6
        if (k <= 0) continue
        const vx = Math.cos(b.a) * b.v * w * 0.9, vy = Math.sin(b.a) * b.v * h * 1.6
        const x = ox + vx * k * Math.exp(-k * 0.35) + Math.sin(k * 2 + b.f) * w * 0.02
        const y = oy + vy * k + 0.5 * h * 1.1 * k * k * 0.9
        if (y > h * 1.3) continue
        const nw = Math.min(w * 0.16, h * 0.28) * b.s, nh = nw * 0.525
        g.save()
        g.translate(x, y); g.rotate(b.giro * k * 0.35 + b.f); g.scale(Math.cos(k * b.flip + b.f), 1)
        g.globalAlpha = kit.clamp(k * 6) * kit.clamp((4.5 - e) * 1.5)
        g.drawImage(nota[b.k], -nw / 2, -nh / 2, nw, nh)
        g.restore()
      }
      g.globalAlpha = 1
    }
    if (e > 0.25 && c < CICLO - 0.5) {
      const k = kit.ease.outBack(kit.clamp((e - 0.25) / 0.35), 2.2), via = kit.clamp((c - (CICLO - 1.3)) / 0.8)
      g.save(); g.globalAlpha = 1 - via
      kit.timbro(g, riesce ? 'colpo riuscito' : 'presi!', sx0 + sw * 0.97, sy0 - sh * 0.13, Math.min(w * 0.12, h * 0.21) * (1.6 - 0.6 * k), riesce ? -0.14 : 0.12, riesce ? '#ffd400' : '#d0201c', k)
      g.restore()
    }

    // ── 5. col mouse sopra: i laser dell'allarme ──
    if (su > 0.01) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 4; i++) {
        const y0 = h * (0.15 + i * 0.25) + Math.sin(tau * (0.7 + i * 0.2) + i) * h * 0.08, y1 = y0 + h * (i % 2 ? 0.35 : -0.3)
        g.strokeStyle = `rgba(255,30,40,${0.18 * su})`; g.lineWidth = Math.max(2, h * 0.022)
        g.beginPath(); g.moveTo(-w * 0.05, y0); g.lineTo(w * 1.05, y1); g.stroke()
        g.strokeStyle = `rgba(255,140,140,${0.85 * su})`; g.lineWidth = Math.max(0.7, h * 0.004)
        g.beginPath(); g.moveTo(-w * 0.05, y0); g.lineTo(w * 1.05, y1); g.stroke()
      }
      g.restore()
    }
    // la polvere di vetro e il buio intorno
    kit.granella(g, w, h, 0.07, tau)
  }

  return { frame, ridimensiona, titolo: false, fermo: 9.4 }
}
