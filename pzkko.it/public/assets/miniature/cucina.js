// miniature/cucina.js — Cucina del Mincio (27.11.2026): il cercapersone PZK Zero vero (la foto del modello 3D,
// media/p/zero/02.webp) appoggiato sul tavolo di legno, fra gli ingredienti veri delle ricette (le webp a pixel di
// art/chat-cucina e art/chat-cibo, in cucina/atlante.webp), con la nonna vera (av-nonna) che si sporge a guardare. Sull'lcd gira la cucina di
// pzk os coi pezzi veri del sistema (os/lcd.js, le icone, la testata, il fumetto): i tortelli di zucca, il coltello che va
// e viene sul tagliere e taglia sulle righe, il mestolo che gira nel sugo, la lancetta che si ferma nella fascia verde, il
// voto, e alla fine la medaglia d'oro. Lì il colpo: la medaglia vera scende col nastro e dondola, le scintille, la nonna
// contenta. Col mouse sopra si cucina più in fretta, il vapore sale e la nonna si avvicina.
import { Lcd, PW, PH, W, H, D, SFONDI, C, esa, colore } from '../../telefono/zero/os/lcd.js'
import * as icone from '../../telefono/zero/os/icone.js'
import { testata, centro, destra, corto, txt } from '../../telefono/zero/os/pezzi.js'

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

// ── la cucina di pzk os (os/cucina.js): i colori, la medaglia, il fumetto, la pillola ──
const COL = {
  verde: esa('#339933'), rosso: esa('#cc3300'), oro: esa('#ffcc33'),
  legno: esa('#cc9966'), gesso: C.bianco, taglio: esa('#330000'), lama: esa('#cccccc'), manico: esa('#996633'),
  sugo: esa('#993300'), mestolo: esa('#ffcc99'),
}
const ORO = esa('#ffd400')
// le icone a pixel delle ricette (zucca, pentola, tortelli) vengono dalle webp di pzkko, impacchettate in un foglio solo
// (cucina/atlante.webp: una richiesta invece di nove) e passate alla tavolozza a 8 bit come fa icone.js con le webp
const ATLANTE = { nonna: [0, 0, 256, 256], mattarello: [258, 0, 156, 165], zucca: [416, 0, 180, 162], tortelli: [598, 0, 159, 159], farina: [759, 0, 123, 138], uova: [0, 258, 153, 126], pentola: [155, 258, 156, 117], amaretti: [313, 258, 174, 114] }
function ritaglio(at, nome) {
  const [x, y, w, h] = ATLANTE[nome], c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(at, x, y, w, h, 0, 0, w, h)
  return c
}
function bitmapLcd(im, lato) {
  const L = lato * D, cv = document.createElement('canvas')
  cv.width = cv.height = L
  const g = cv.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'
  const k = Math.min(L / im.width, L / im.height), w = im.width * k, h = im.height * k
  g.drawImage(im, (L - w) / 2, (L - h) / 2, w, h)
  const d = g.getImageData(0, 0, L, L).data, px = new Uint8Array(L * L)
  for (let i = 0; i < L * L; i++) if (d[i * 4 + 3] > 127) px[i] = colore(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])
  return { w: lato, h: lato, d: D, px }
}
const BM = {}
const bm = (id) => BM[id] ?? icone.bitmap('app-cucina', 32)
const centro0 = (l, x, w, y, s, scala = 1, col = 1) => l.testo(x + Math.round((w - Lcd.larghezza(s, scala)) / 2), y, s, { scala, col })
function pillola(l, x, y, s, fondo, col = C.bianco) {
  const w = Lcd.larghezza(s) + 6
  l.riempi(x - 3, y - 1, w, 9, fondo)
  for (const [a, b] of [[x - 3, y - 1], [x + w - 4, y - 1], [x - 3, y + 7], [x + w - 4, y + 7]]) l.px(a, b, 0)
  l.testo(x, y, s, { col })
  return w
}
function medaglina(l, x, y, c, b = 1) {
  l.riempi(x + 2, y, 3, 1, b); l.riempi(x + 1, y + 1, 5, 1, b); l.riempi(x, y + 2, 7, 3, b); l.riempi(x + 1, y + 5, 5, 1, b); l.riempi(x + 2, y + 6, 3, 1, b)
  l.riempi(x + 2, y + 1, 3, 1, c); l.riempi(x + 1, y + 2, 5, 3, c); l.riempi(x + 2, y + 5, 3, 1, c)
}
const righeCorte = (s, n, max) => { const R = Lcd.acapo(txt(s), n), o = R.slice(0, max); if (R.length > max) o[max - 1] = corto(o[max - 1] + '…', n); return o }
function fumetto(l, y, testo, righe = 3) {
  l.bitmap(icone.bitmap('nonna', 24), 10, y)
  const R = righeCorte(testo, 33, righe)
  l.riquadro(38, y, W - 48, R.length * 9 + 4)
  l.px(37, y + 6); l.px(36, y + 7)
  R.forEach((s, i) => l.testo(41, y + 3 + i * 9, s))
}
const commento = (v) => (v >= 0.9 ? 'perfetto! meglio della nonna' : v >= 0.7 ? 'brava, così si fa' : v >= 0.45 ? 'mmh… si può mangiare' : 'la nonna sospira')
// il coltello e la lancetta si muovono col tempo, come nella cucina vera e sulla banca (app/cucina.js)
const coltello = (ms) => { const p = ((ms / 1000) * 0.66) % 2; return p <= 1 ? p : 2 - p }
const lancetta = (ms) => 0.5 - 0.5 * Math.cos((ms / 1000) * 2.6)

// ── la ricetta che si gioca: i tortelli di zucca (RICETTE[0]), tre dei suoi cinque passi ──
const RIGHE_ZUCCA = [0.22, 0.5, 0.79], TAGLI = [360, 790, 1190]
const BANDA = [0.76, 0.92], FERMA = 905
const SEG = [
  ['intro', 0, 1.4, { i: 1, testo: 'taglia la zucca', nonna: 'i tortelli di zucca! la vigilia di Natale, in tutta Mantova. pronta?', premi: 'OK quando il coltello è sulla riga' }],
  ['taglia', 1.4, 3.0],
  ['esito', 3.0, 4.0, { i: 1, v: 0.96 }],
  ['intro', 4.0, 4.7, { i: 3, testo: 'mescola il ripieno', nonna: 'ora: mescola il ripieno.', premi: 'gira: → ↓ ← ↑ e ancora' }],
  ['mescola', 4.7, 7.3],
  ['esito', 7.3, 8.2, { i: 3, v: 1 }],
  ['intro', 8.2, 8.9, { i: 5, testo: 'scolali quando vengono a galla', nonna: 'ora: scolali quando vengono a galla.', premi: 'OK quando la lancetta è nella fascia' }],
  ['cuoci', 8.9, 9.9],
  ['esito', 9.9, 10.7, { i: 5, v: 0.97 }],
  ['assaggia', 10.7, 11.4],
  ['fine', 11.4, 16],
]
const CICLO = 16, T_FINE = 11.4
/** la nonna fuori dall'lcd: le sue frasi vere, secondo il pezzo */
const parla = (tipo, o) => (tipo === 'intro' && o.i === 1 ? 'pronta?' : tipo === 'esito' ? commento(o.v) : tipo === 'assaggia' ? 'assaggio…' : tipo === 'fine' ? 'come li faccio io. anzi meglio!' : '')

function disegnaLcd(l, seg, e, tic) {
  const [tipo, , , o = {}] = seg, ms = e * 1000
  testata(l, null, { icona: 'app-cucina', nome: 'tortelli di zucca', n: 1 })
  if (tipo !== 'fine' && tipo !== 'assaggia') destra(l, 245, 18, `passo ${o.i ?? (tipo === 'taglia' ? 1 : tipo === 'mescola' ? 3 : 5)}/5`)
  if (tipo === 'intro') {
    l.testo(10, 35, corto(txt(o.testo), 39))
    fumetto(l, 48, o.nonna)
    centro(l, 92, corto(o.premi, 39))
    centro(l, H - 9, 'OK via! · INDIETRO le ricette')
    return
  }
  if (tipo === 'esito') {
    const s = String(Math.round(o.v * 100)), lampo = Math.max(0, 8 - Math.floor(e * 10))
    l.riempi(W / 2 - Lcd.larghezza(s, 3) / 2 - 4, 34, Lcd.larghezza(s, 3) + 8, 25, lampo % 2 ? 1 : COL.verde)
    centro(l, 36, s, { scala: 3, inv: lampo % 2 === 1, col: C.bianco })
    centro(l, 61, 'su 100')
    fumetto(l, 72, commento(o.v), 2)
    centro(l, H - 9, o.i === 5 ? 'OK assaggia' : 'OK avanti')
    return
  }
  if (tipo === 'assaggia') {
    l.bitmap(bm('tortelli'), Math.round(W / 2 - 16), 44)
    centro(l, 84, 'la nonna assaggia' + '...'.slice(0, 1 + (Math.floor(tic / 3) % 3)))
    centro(l, H - 9, 'INDIETRO le ricette')
    return
  }
  if (tipo === 'fine') {
    l.bitmap(bm('tortelli'), 10, 33)
    const nm = 'medaglia d’oro'
    l.testo(48, 35, nm)
    medaglina(l, 48 + Lcd.larghezza(nm) + 4, 35, ORO)
    const v = '97 / 100'
    l.testo(48, 45, v, { scala: 2 })
    pillola(l, 48 + Lcd.larghezza(v, 2) + 9, 50, 'record!', COL.oro, C.nero)
    const wg = pillola(l, 13, 66, '+60 $pzk · +25 xp', COL.verde)
    l.testo(10 + wg + 4, 66, 'tortelli nello zaino')
    fumetto(l, 83, 'come li faccio io. anzi meglio!', 1)
    const E = ['rifalla', 'le ricette'], ws = E.map((x) => Lcd.larghezza(x) + 8)
    let xx = Math.round(W / 2 - (ws[0] + ws[1] + 4) / 2)
    E.forEach((x, i) => { if (i === 0) l.riempi(xx, 103, ws[i], 11); else l.cornice(xx, 103, ws[i], 11); l.testo(xx + 4, 105, x, { inv: i === 0 }); xx += ws[i] + 4 })
    centro(l, H - 9, '←→ sceglie · OK preme')
    return
  }
  // ── i giochi: la barra del tempo, verde e poi rossa ──
  const durata = { taglia: 12000, mescola: 7000, cuoci: 8000 }[tipo]
  const resta = Math.max(0, 1 - ms / durata)
  l.riquadro(10, 34, W - 20, 5); l.riempi(11, 35, Math.round((W - 22) * resta), 3, resta < 0.3 ? COL.rosso : COL.verde)
  if (tipo === 'taglia') {
    const x0 = 20, w = W - 40, xc = x0 + Math.round(coltello(Math.min(ms, 1540)) * w)
    l.riempi(x0 - 1, 49, w + 2, 40, COL.legno)
    l.bitmap(bm('zucca'), Math.round(W / 2 - 16), 52)
    l.riquadro(x0 - 2, 48, w + 4, 42)
    RIGHE_ZUCCA.forEach((x, k) => {
      const fatto = ms >= TAGLI[k], xq = x0 + Math.round(x * w)
      if (!fatto) for (let y = 49; y < 89; y += 3) l.px(xq, y, COL.gesso)
      else { const xd = x0 + Math.round(coltello(TAGLI[k]) * w); l.vert(xd, 49, 40, COL.taglio); l.vert(xd + 1, 49, 40, COL.taglio) }
    })
    l.riempi(xc - 1, 92, 3, 12); l.vert(xc, 93, 10, COL.lama); l.riempi(xc - 2, 104, 5, 6); l.riempi(xc - 1, 105, 3, 4, COL.manico); l.px(xc, 91)
    centro(l, H - 9, 'OK quando il coltello è sulla riga')
  } else if (tipo === 'mescola') {
    const cx = 128, cy = 76, rr = 28, quarti = Math.min(16, Math.floor(ms / 150))
    for (let dy = -(rr - 2); dy <= rr - 2; dy++) { const hw = Math.floor(Math.sqrt((rr - 1.5) ** 2 - dy * dy)); l.riempi(cx - hw, cy + dy, 2 * hw + 1, 1, COL.sugo) }
    for (let i = 0; i < 64; i++) { const q = (i / 64) * Math.PI * 2; l.px(Math.round(cx + Math.cos(q) * rr), Math.round(cy + Math.sin(q) * rr)); l.px(Math.round(cx + Math.cos(q) * (rr + 2)), Math.round(cy + Math.sin(q) * (rr + 2))) }
    const a = (quarti % 4) * (Math.PI / 2) - Math.PI / 2 + Math.PI / 4
    const mx = Math.round(cx + Math.cos(a) * 16), my = Math.round(cy + Math.sin(a) * 16)
    l.riempi(mx - 3, my - 3, 7, 7); l.riempi(mx - 2, my - 2, 5, 5, COL.mestolo)
    for (let s = 0; s < 16; s++) l.px(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s))
    l.testo(20, 60, 'ora'); l.testo(20, 70, ['→', '↓', '←', '↑'][quarti % 4], { scala: 2 })
    destra(l, 236, 60, 'giri'); destra(l, 236, 70, `${Math.floor(quarti / 4)}/4`, { scala: 2 })
    centro(l, H - 9, 'gira: → ↓ ← ↑ e ancora')
  } else if (tipo === 'cuoci') {
    l.bitmap(bm('pentola'), Math.round(W / 2 - 16), 44)
    const x0 = 20, w = W - 40, y = 86
    l.riquadro(x0, y, w, 12)
    const xa = x0 + Math.round(BANDA[0] * w), xb = x0 + Math.round(BANDA[1] * w)
    l.riempi(xa, y + 1, xb - xa + 1, 10, COL.verde)
    const xl = x0 + Math.round(lancetta(Math.min(ms, FERMA)) * w)
    l.riempi(xl - 1, y - 4, 3, 20)
    centro(l, H - 9, 'OK quando la lancetta è nella fascia')
  }
}

// gli ingredienti sul tavolo: [nome nell'atlante, x, y (frazioni della copertina), lato (frazione dell'altezza), rotazione]
const ROBA = [
  ['mattarello', 0.6, 0.07, 0.3, 0.9],
  ['amaretti', 0.73, 0.15, 0.2, -0.2],
  ['zucca', 0.9, 0.12, 0.34, 0.15],
  ['farina', 0.05, 0.9, 0.3, -0.3],
  ['uova', 0.5, 0.1, 0.18, 0.4],
]

export default async function crea(m) {
  const { kit } = m
  const [foto, nastroIm, atlante] = await Promise.all([
    kit.img(FOTO), kit.img('/art/nastro/carta-gommata.webp'), kit.img('/assets/miniature/cucina/atlante.webp'),
    kit.font('Sakura'), kit.font('gg sans', 700), kit.font('Anton'),
  ])
  const pezzo = Object.fromEntries(Object.keys(ATLANTE).map((n) => [n, ritaglio(atlante, n)]))
  for (const n of ['zucca', 'pentola', 'tortelli']) BM[n] = bitmapLcd(pezzo[n], 32)
  const nonnaIm = pezzo.nonna, pentolaIm = pezzo.pentola
  const sagoma = scontorna(foto)
  const { l, cv: lcdCv } = nuovoLcd()
  const rnd = kit.rng('cucina')
  const FARINA = Array.from({ length: 16 }, () => ({ x: rnd(), y: rnd(), v: 0.01 + rnd() * 0.03, f: rnd() * 6, r: 0.4 + rnd() }))
  const SCINTILLE = Array.from({ length: 22 }, () => ({ a: rnd() * kit.TAU, v: 0.4 + rnd(), d: rnd() * 0.5, r: rnd() }))

  let S = {}
  function ridimensiona(w, h) {
    const dpr = m.dpr
    const dw = Math.max(w * 1.03, h * 1.7), s = dw / FW, dh = FH * s
    const pad = dw * 0.06
    const corpo = kit.strato(dw + pad * 2, dh + pad * 2, dpr, (g) => {
      g.shadowColor = 'rgba(40,15,0,.55)'; g.shadowBlur = dw * 0.03; g.shadowOffsetY = dw * 0.018; g.shadowOffsetX = dw * 0.01
      g.drawImage(sagoma, pad, pad, dw, dh)
    })
    // il tavolo: assi di legno con le venature, la luce calda della finestra in alto a sinistra
    const tavolo = kit.strato(w, h, dpr, (g) => {
      const r = kit.rng('tavolo'), n = 4, ph = h / n
      for (let i = 0; i <= n; i++) {
        const y0 = i * ph - ph * 0.3, base = [[150, 98, 58], [138, 88, 50], [158, 106, 64], [142, 92, 54], [150, 100, 60]][i % 5]
        const lg = g.createLinearGradient(0, y0, 0, y0 + ph)
        lg.addColorStop(0, `rgb(${base.map((v) => v + 8)})`); lg.addColorStop(1, `rgb(${base.map((v) => v - 10)})`)
        g.fillStyle = lg; g.fillRect(0, y0, w, ph)
        for (let k = 0; k < 14; k++) {
          const yy = y0 + r() * ph, amp = ph * (0.02 + r() * 0.05), fr = 1 + r() * 3, fa = r() * 6
          g.strokeStyle = `rgba(70,35,12,${0.08 + r() * 0.14})`; g.lineWidth = Math.max(0.6, h * (0.002 + r() * 0.004))
          g.beginPath()
          for (let x = 0; x <= w; x += w / 40) { const yv = yy + Math.sin((x / w) * fr * kit.TAU + fa) * amp; x ? g.lineTo(x, yv) : g.moveTo(x, yv) }
          g.stroke()
        }
        // un nodo nel legno
        const nx = r() * w, ny = y0 + ph * (0.3 + r() * 0.4)
        g.strokeStyle = 'rgba(70,35,12,.25)'; g.lineWidth = Math.max(0.8, h * 0.004)
        for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(nx, ny, h * 0.02 * k, h * 0.008 * k, 0, 0, kit.TAU); g.stroke() }
        g.fillStyle = 'rgba(35,15,5,.55)'; g.fillRect(0, y0 + ph - Math.max(1, h * 0.006), w, Math.max(1, h * 0.006))
      }
      const lu = g.createRadialGradient(w * 0.15, -h * 0.2, h * 0.1, w * 0.15, -h * 0.2, w * 0.9)
      lu.addColorStop(0, 'rgba(255,214,150,.38)'); lu.addColorStop(1, 'rgba(255,190,120,0)')
      g.fillStyle = lu; g.fillRect(0, 0, w, h)
      kit.vignetta(g, w, h, 0.5)
    })
    // la roba sul tavolo, con l'ombra (ferma: tutta in uno strato)
    const tavola = kit.strato(w, h, dpr, (g) => {
      ROBA.forEach(([nome, x, y, k, rot]) => {
        const im = pezzo[nome]
        const lh = h * k, lw = (lh * im.width) / im.height
        kit.con(g, x * w, y * h, rot, 1, () => {
          g.shadowColor = 'rgba(40,15,0,.5)'; g.shadowBlur = h * 0.03; g.shadowOffsetY = h * 0.015; g.shadowOffsetX = h * 0.01
          g.drawImage(im, -lw / 2, -lh / 2, lw, lh)
        })
      })
    })
    // la nonna, con la sua ombra
    const nl = h * 0.62
    const nonna = kit.strato(nl * 1.15, nl * 1.15, dpr, (g) => {
      g.shadowColor = 'rgba(30,10,0,.55)'; g.shadowBlur = nl * 0.06; g.shadowOffsetX = -nl * 0.03
      g.imageSmoothingEnabled = false
      g.drawImage(nonnaIm, nl * 0.1, nl * 0.08, nl, nl)
    })
    const pl = h * 0.26
    const pentola = kit.strato(pl * 1.6, pl * 1.3, dpr, (g) => {
      g.shadowColor = 'rgba(40,15,0,.5)'; g.shadowBlur = pl * 0.1; g.shadowOffsetY = pl * 0.06
      g.drawImage(pentolaIm, pl * 0.15, pl * 0.12, pl * 1.3, (pl * 1.3 * pentolaIm.height) / pentolaIm.width)
    })
    // il titolo: scritto a pennarello su un pezzo di nastro di carta, come le etichette dei barattoli
    const tw = Math.min(w * 0.5, h * 0.9), th = tw * 0.27 // (il nastro un po' schiacciato: è carta stropicciata)
    const titolo = kit.strato(tw * 1.1, th * 1.4, dpr, (g) => {
      kit.con(g, tw * 0.55, th * 0.7, -0.035, 1, () => {
        g.shadowColor = 'rgba(40,15,0,.4)'; g.shadowBlur = th * 0.1; g.shadowOffsetY = th * 0.05
        g.drawImage(nastroIm, -tw / 2, -th / 2, tw, th)
        g.shadowColor = 'transparent'
        const t = m.titolo || 'Cucina del Mincio'
        let sz = th * 0.56
        g.font = `400 ${sz}px "Sakura"`
        const mw = g.measureText(t).width
        if (mw > tw * 0.84) sz *= (tw * 0.84) / mw
        g.font = `400 ${sz}px "Sakura"`
        g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillStyle = 'rgba(190,60,15,.22)'; g.fillText(t, sz * 0.03, th * 0.06 + sz * 0.04)
        g.fillStyle = '#c2410c'; g.fillText(t, 0, th * 0.06)
      })
    })
    const vr = Math.max(4, h * 0.09)
    const vapore = kit.strato(vr * 2, vr * 2, dpr, (g) => {
      const r = g.createRadialGradient(vr, vr, 0, vr, vr, vr)
      r.addColorStop(0, 'rgba(255,250,240,.55)'); r.addColorStop(0.5, 'rgba(255,250,240,.2)'); r.addColorStop(1, 'rgba(255,250,240,0)')
      g.fillStyle = r; g.fillRect(0, 0, vr * 2, vr * 2)
    })
    S = { w, h, dw, dh, s, pad, corpo, tavolo, tavola, nonna, nl, pentola, pl, titolo, tw, th, vapore, vr }
  }

  let prima = -1, extra = 0, lcdChiave = ''
  function frame(t, dt) {
    const { w, h } = m
    if (!S.corpo || S.w !== w || S.h !== h) ridimensiona(w, h)
    if (t < prima) extra = 0
    prima = t
    const su = m.su
    extra += (dt || 0) * su * 0.9
    const tau = t + extra, c = kit.fract(tau / CICLO) * CICLO
    const g = m.g
    const { dw, dh, s, pad } = S
    const seg = SEG.find((x) => c >= x[1] && c < x[2]) ?? SEG[SEG.length - 1], e = c - seg[1]
    const dopo = c - T_FINE

    // ── 1. il tavolo e la roba sopra ──
    kit.metti(g, S.tavolo, 0, 0, w, h)
    kit.metti(g, S.tavola, 0, 0, w, h)
    // la pentola che fuma, in alto a destra
    const px = w - S.pl * 1.25, py = -S.pl * 0.28
    g.drawImage(S.pentola, px, py, S.pl * 1.6, S.pl * 1.3)

    // ── 2. il cercapersone, posato storto sul tavolo ──
    const cx = w * 0.53, cy = h * 0.73, rot = -0.06 + Math.sin(tau * 0.3) * 0.002
    const sx = -dw / 2, sy = -dh / 2
    g.save()
    g.translate(cx, cy); g.rotate(rot)
    g.drawImage(S.corpo, sx - pad, sy - pad, dw + pad * 2, dh + pad * 2)
    const lx = sx + SCHERMO[0] * s, ly = sy + SCHERMO[1] * s, lw = SCHERMO[2] * s, lh = SCHERMO[3] * s
    const tic = Math.floor(tau * 20)
    const ora = new Date(), hh = `${String(ora.getHours()).padStart(2, '0')}:${String(ora.getMinutes()).padStart(2, '0')}`
    const luce = Math.round((0.88 + 0.12 * su) * 20) / 20
    const chiave = `${seg[0]}${seg[1]}|${seg[0] === 'intro' || seg[0] === 'fine' ? '' : seg[0] === 'esito' ? Math.min(9, Math.floor(e * 10)) : tic}|${hh}|${luce}`
    if (chiave !== lcdChiave) { lcdChiave = chiave; l.luce = luce; l.pulisci(); barra(l, hh); disegnaLcd(l, seg, e, tic); l.stampa() }
    g.save()
    kit.tondo(g, lx, ly, lw, lh, SCHERMO[4] * s); g.clip()
    g.imageSmoothingEnabled = lw / PW < 1.2; g.imageSmoothingQuality = 'high'
    g.drawImage(lcdCv, lx, ly, lw, lh)
    g.imageSmoothingEnabled = true
    const v1 = g.createLinearGradient(lx, ly, lx + lw * 0.08, ly + lh * 0.12)
    v1.addColorStop(0, 'rgba(0,0,0,.3)'); v1.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = v1; g.fillRect(lx, ly, lw, lh)
    // la finestra della cucina riflessa sul vetro
    const v2 = g.createLinearGradient(lx, ly, lx + lw, ly + lh)
    v2.addColorStop(0, 'rgba(255,240,210,0)'); v2.addColorStop(0.18, 'rgba(255,240,210,.13)'); v2.addColorStop(0.3, 'rgba(255,240,210,0)')
    g.fillStyle = v2; g.fillRect(lx, ly, lw, lh)
    g.restore()
    // i tasti: OK a ogni «via» e a ogni voto, le frecce mentre si mescola
    const premi = (t0, d = 0.15) => (c >= t0 && c < t0 + d ? Math.sin(((c - t0) / d) * Math.PI) : 0)
    const ok = Math.max(...[1.25, 3.85, 4.55, 7.95, 8.75, 9.8, 10.55].map((x) => premi(x)))
    if (ok > 0) { g.fillStyle = `rgba(60,20,0,${0.35 * ok})`; g.beginPath(); g.arc(sx + OKT[0] * s, sy + OKT[1] * s, OKT[2] * s, 0, kit.TAU); g.fill() }
    if (seg[0] === 'mescola' && e < 2.4) {
      const q = Math.floor((e * 1000) / 150) % 4, k = Math.sin(kit.fract((e * 1000) / 150) * Math.PI)
      const a0 = [0, 0.5, 1, 1.5][q] * Math.PI - Math.PI / 4
      g.fillStyle = `rgba(60,20,0,${0.3 * k})`
      g.beginPath(); g.moveTo(sx + CROCE[0] * s, sy + CROCE[1] * s); g.arc(sx + CROCE[0] * s, sy + CROCE[1] * s, CROCE[2] * s, a0, a0 + Math.PI / 2); g.closePath(); g.fill()
    }
    if (dopo > 0) { // il led: oro che pulsa
      const k = Math.exp(-dopo * 0.8) * (0.6 + 0.4 * Math.sin(dopo * 9)), x = sx + LED[0] * s, y = sy + LED[1] * s
      const lr = g.createRadialGradient(x, y, 0, x, y, 40 * s)
      lr.addColorStop(0, `rgba(255,210,60,${k})`); lr.addColorStop(0.3, `rgba(255,210,60,${k * 0.4})`); lr.addColorStop(1, 'rgba(255,210,60,0)')
      g.fillStyle = lr; g.fillRect(x - 40 * s, y - 40 * s, 80 * s, 80 * s)
    }
    g.restore()

    // ── 3. la medaglia d'oro: scende col nastro, rimbalza e dondola ──
    if (dopo > 0 && c < CICLO - 0.2) {
      const giu = kit.ease.outBounce(kit.clamp(dopo / 0.9)), via = kit.clamp((c - (CICLO - 1)) / 0.8)
      const mx = w * 0.63, my = h * (-0.25 + 0.88 * giu) - via * h * 0.8, mr = h * 0.11
      const ang = Math.sin(dopo * 3.2) * 0.22 * Math.exp(-dopo * 0.5)
      g.save()
      g.translate(mx, -h * 0.05); g.rotate(ang); g.translate(-mx, h * 0.05)
      // il nastro tricolore
      const nw = mr * 0.55
      ;[['#1f8a3b', -nw / 3], ['#f4efe1', 0], ['#c8202a', nw / 3]].forEach(([col, o]) => { g.fillStyle = col; g.fillRect(mx + o - nw / 6, -h * 0.05, nw / 3 + 0.5, my - mr * 0.7 + h * 0.05) })
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(mx - nw / 2, my - mr * 1.05, nw, mr * 0.35)
      // l'ombra sul cercapersone
      g.fillStyle = 'rgba(40,15,0,.3)'; g.beginPath(); g.ellipse(mx + mr * 0.25, my + mr * 0.3, mr, mr * 0.95, 0, 0, kit.TAU); g.fill()
      const rg = g.createRadialGradient(mx - mr * 0.35, my - mr * 0.4, mr * 0.1, mx, my, mr)
      rg.addColorStop(0, '#fff6b0'); rg.addColorStop(0.45, '#ffd400'); rg.addColorStop(1, '#b07a00')
      g.fillStyle = rg; g.beginPath(); g.arc(mx, my, mr, 0, kit.TAU); g.fill()
      g.strokeStyle = '#8a5d00'; g.lineWidth = mr * 0.08; g.beginPath(); g.arc(mx, my, mr * 0.78, 0, kit.TAU); g.stroke()
      g.fillStyle = '#7a5200'; g.font = `400 ${mr * 0.62}px "Anton"`; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText('97', mx, my + mr * 0.04)
      // il riflesso che passa
      const lk = kit.fract(dopo / 2.2)
      if (lk < 0.35) {
        g.save(); g.beginPath(); g.arc(mx, my, mr, 0, kit.TAU); g.clip()
        const rx = mx - mr + (lk / 0.35) * mr * 2.6
        const lr = g.createLinearGradient(rx - mr * 0.3, my - mr, rx + mr * 0.3, my + mr)
        lr.addColorStop(0, 'rgba(255,255,255,0)'); lr.addColorStop(0.5, 'rgba(255,255,255,.7)'); lr.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = lr; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2)
        g.restore()
      }
      g.restore()
      // le scintille, quando tocca
      const e2 = dopo - 0.35
      if (e2 > 0 && e2 < 1.6) {
        for (const p of SCINTILLE) {
          const k = e2 - p.d * 0.3
          if (k <= 0) continue
          const d = (1 - Math.exp(-k * 3)) * mr * (1.4 + p.v * 1.4)
          const x = mx + Math.cos(p.a) * d, y = my + Math.sin(p.a) * d * 0.8 + k * k * h * 0.05
          const a = kit.clamp(1 - k / 1.3), r = h * 0.012 * (0.6 + p.r)
          g.fillStyle = p.r > 0.6 ? `rgba(255,255,255,${a})` : `rgba(255,214,60,${a})`
          g.beginPath(); g.moveTo(x, y - r * 2); g.lineTo(x + r * 0.5, y - r * 0.5); g.lineTo(x + r * 2, y); g.lineTo(x + r * 0.5, y + r * 0.5); g.lineTo(x, y + r * 2); g.lineTo(x - r * 0.5, y + r * 0.5); g.lineTo(x - r * 2, y); g.lineTo(x - r * 0.5, y - r * 0.5); g.closePath(); g.fill()
        }
      }
    }

    // ── 4. la nonna che si sporge dal bordo, col mattarello; contenta si alza ──
    const contenta = seg[0] === 'fine' ? kit.ease.outBack(kit.clamp(e / 0.5)) : seg[0] === 'esito' ? 0.4 * Math.sin(kit.clamp(e / 0.8) * Math.PI) : 0
    const nl = S.nl
    const nx = w - nl * 0.78 - su * w * 0.05, ny = h - nl * 0.86 - contenta * h * 0.08 - su * h * 0.05 + Math.sin(tau * 1.3) * h * 0.008
    kit.con(g, nx + nl * 0.5, ny + nl, Math.sin(tau * 0.9) * 0.02 - contenta * 0.04 - su * 0.05, 1, () => g.drawImage(S.nonna, -nl * 0.6, -nl * 1.08, nl * 1.15, nl * 1.15))
    // il fumetto della nonna, con la frase vera del momento
    const frase = parla(seg[0], seg[3] ?? {})
    if (frase) {
      const k = kit.ease.outBack(kit.clamp(e / 0.25)), fs = Math.max(7, h * 0.052)
      g.font = `700 ${fs}px "gg sans"`
      const parole = frase.split(' '), righe = []
      let r = ''
      for (const p of parole) { const pr = r ? r + ' ' + p : p; if (g.measureText(pr).width > w * 0.26 && r) { righe.push(r); r = p } else r = pr }
      righe.push(r)
      const bw = Math.max(...righe.map((x) => g.measureText(x).width)) + fs * 1.2, bh = righe.length * fs * 1.2 + fs * 0.7
      const bx = nx - bw * 0.62, by = ny - bh * 0.1
      kit.con(g, bx + bw, by + bh, 0, k, () => {
        g.fillStyle = 'rgba(40,15,0,.25)'; kit.tondo(g, -bw + fs * 0.12, -bh + fs * 0.15, bw, bh, fs * 0.6); g.fill()
        g.fillStyle = '#fffaf0'; kit.tondo(g, -bw, -bh, bw, bh, fs * 0.6); g.fill()
        g.beginPath(); g.moveTo(-fs * 1.2, -fs * 0.2); g.lineTo(fs * 0.6, fs * 0.5); g.lineTo(-fs * 0.3, -fs * 0.9); g.fill()
        g.fillStyle = '#3a1a08'; g.textAlign = 'left'; g.textBaseline = 'top'
        righe.forEach((x, i) => g.fillText(x, -bw + fs * 0.6, -bh + fs * 0.4 + i * fs * 1.2))
      })
    }

    // ── 5. il vapore della pentola e la farina nella luce ──
    const vr = S.vr, forza = 1 + su * 0.8
    for (let i = 0; i < 9; i++) {
      const k = kit.fract(tau * 0.22 * forza + i / 9), x = px + S.pl * 0.75 + Math.sin(k * 5 + i) * S.pl * 0.25 - k * S.pl * 0.3, y = py + S.pl * 0.45 + S.pl * 0.4 - k * h * 0.5
      g.globalAlpha = Math.sin(k * Math.PI) * 0.55
      const r = vr * (0.6 + k * 1.4)
      g.drawImage(S.vapore, x - r, y - r, r * 2, r * 2)
    }
    g.globalAlpha = 1
    for (const p of FARINA) {
      const x = kit.fract(p.x + tau * p.v) * w, y = kit.fract(p.y + Math.sin(tau * 0.3 + p.f) * 0.03 + tau * p.v * 0.4) * h
      const fasciaLuce = kit.clamp(1 - Math.abs(x / w - (0.25 + (1 - y / h) * 0.2)) * 3)
      g.fillStyle = `rgba(255,248,230,${(0.25 + 0.35 * fasciaLuce) * (0.5 + 0.5 * Math.sin(tau * 2 + p.f))})`
      g.fillRect(x, y, h * 0.006 * p.r, h * 0.006 * p.r)
    }

    // ── 6. il titolo sul nastro di carta ──
    kit.metti(g, S.titolo, w * 0.015, h * 0.005, S.tw * 1.1, S.th * 1.4)

    kit.granella(g, w, h, 0.05, tau)
  }

  return { frame, ridimensiona, titolo: false, fermo: 12.4 }
}
