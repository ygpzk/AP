// miniature/compilatore.js — Codice C (27.11.2026): il cercapersone PZK Zero vero (la foto del modello 3D,
// media/p/zero/02.webp) con l'lcd vivo sopra. Sull'lcd gira l'app «codice C» di pzk os disegnata coi pezzi veri del
// sistema (os/lcd.js, il carattere 5 × 7 con Scale2x, la tavolozza a 8 bit, le icone, la testata): si scrive il
// fattoriale degli ESEMPI veri, OK apre il menu, «esegui», la rotellina di GCC 14.2 e l'output che scende fino alla
// fascia verde del codice d'uscita 0. Lì il colpo: il led verde, i bit che saltano fuori, il timbro.
// Col mouse sopra si scrive più in fretta, la luce sale e il cercapersone si alza verso chi guarda.
import { Lcd, PW, PH, W, H, SFONDI, esa } from '../../telefono/zero/os/lcd.js'
import { testata, centro, destra, elenco, txt } from '../../telefono/zero/os/pezzi.js'
import { ESEMPI } from '../../telefono/app/compilatore.js'

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

// ── «codice C»: i colori e le fasce dell'app vera (os/compilatore.js) ──
const BIANCO = esa('#ffffff'), NERO = esa('#000000')
const FASCE = { err: [esa('#cc0000'), BIANCO], avv: [esa('#ffcc00'), NERO], ok: [esa('#009900'), BIANCO] }
const TINTE = { stringa: esa('#006600'), commento: esa('#666666'), direttiva: esa('#0033cc'), verde: esa('#006600') }
const VIS = 9, COL = 36
function colori(L) {
  const K = []
  let blocco = false
  for (const riga of L) {
    const a = [...riga], k = new Array(a.length).fill(null)
    let i = 0, str = null
    const dir = /^\s*#/.test(riga)
    while (i < a.length) {
      if (blocco) { k[i] = 'commento'; if (a[i] === '*' && a[i + 1] === '/') { k[i + 1] = 'commento'; i += 2; blocco = false } else i++; continue }
      if (str) { k[i] = 'stringa'; if (a[i] === '\\') { if (i + 1 < a.length) k[i + 1] = 'stringa'; i += 2; continue } if (a[i] === str) str = null; i++; continue }
      if (a[i] === '/' && a[i + 1] === '/') { k.fill('commento', i); break }
      if (a[i] === '/' && a[i + 1] === '*') { k[i] = k[i + 1] = 'commento'; i += 2; blocco = true; continue }
      if (dir) { k[i++] = 'direttiva'; continue }
      if (a[i] === '"' || a[i] === '\'') { str = a[i]; k[i++] = 'stringa'; continue }
      i++
    }
    K.push(k)
  }
  return K
}

// il programma: il fattoriale degli esempi veri, con l'input «10»; la prima parte c'è già, il main si scrive
const CODICE = ESEMPI.fattoriale[1].replace(/\n$/, '')
const RIGHE = CODICE.split('\n')
const GIA = RIGHE.slice(0, 6).join('\n').length + 1 // fino alla riga vuota dopo fatt()
const USCITA = Array.from({ length: 11 }, (_, i) => `${String(i).padStart(2)}! = ${[1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][i]}`)
const OUT = [...USCITA.map((s) => ({ s })), { s: '' }, { s: '[finito: codice d’uscita 0 · 1,4 s]', fascia: 'ok' }, { s: '[GCC 14.2 · Compiler Explorer]' },
  ...Lcd.acapo('il codice si compila su un servizio esterno: non scriverci password.', 37).map((s) => ({ s }))]
// i tempi della scrittura: ogni carattere un po' a caso, l'a capo una pausa, il rientro arriva da solo (come l'editor vero)
const T0 = 0.8, T1 = 4.9
const quando = (() => {
  const q = new Float32Array(CODICE.length + 1)
  let tt = 0
  const pesi = []
  for (let i = GIA; i < CODICE.length; i++) {
    const ch = CODICE[i], prima = CODICE[i - 1]
    pesi.push(prima === '\n' && ch === ' ' ? 0 : ch === '\n' ? 3.2 : ch === ' ' ? 0.7 : 1 + ((i * 7) % 5) * 0.15)
  }
  const tot = pesi.reduce((a, b) => a + b, 0)
  for (let i = 0; i <= GIA; i++) q[i] = T0
  pesi.forEach((p, k) => { tt += p; q[GIA + k + 1] = T0 + ((T1 - T0) * tt) / tot })
  return q
})()
const CICLO = 14, T_MENU = 5.0, T_ESEGUI = 5.8, T_OUT = 7.0, PASSO_OUT = 0.15
const T_OK = T_OUT + USCITA.length * PASSO_OUT + 0.1 // la fascia verde: il colpo

/** l'editor: le righe, i numeri, i colori, il cursore (os/compilatore.js, disegna) */
function editor(l, testo, tic, scrive) {
  const L = testo.split('\n'), K = colori(L)
  const rr = L.length - 1, cc = L[rr].length
  const tp = Math.max(0, rr - VIS + 1)
  const s0 = Math.max(0, cc - COL + 1)
  testata(l, null, { icona: 'app-compilatore', nome: 'codice C', n: 1 })
  destra(l, 245, 18, `${rr + 1}:${cc + 1}`)
  for (let i = 0; i < VIS && tp + i < L.length; i++) {
    const k = tp + i, y = 34 + i * 9
    l.testo(8, y, String(k + 1).padStart(2))
    const a = [...txt(L[k])], kk = K[k] ?? []
    for (let j = s0; j < Math.min(a.length, s0 + COL);) {
      let e = j + 1
      while (e < Math.min(a.length, s0 + COL) && kk[e] === kk[j]) e++
      l.testo(26 + (j - s0) * 6, y, a.slice(j, e).join(''), kk[j] ? { col: TINTE[kk[j]] } : {})
      j = e
    }
    if (a.length > s0 + COL) l.testo(242, y, '›')
    if (s0 > 0 && a.length) l.px(24, y + 3)
  }
  l.vert(22, 33, VIS * 9)
  if (scrive || tic % 10 < 5) { const xx = 26 + (cc - s0) * 6, yy = 34 + (rr - tp) * 9; l.riempi(xx - 1, yy - 1, 7, 9); l.testo(xx, yy, ' ', { inv: true }) }
}
function menu(l) {
  testata(l, null, { icona: 'app-compilatore', nome: 'codice C: cosa fai', n: 1 })
  const voci = [['esegui'], ['scrivi qui', 'riga 13'], ['a capo'], ['cancella un carattere'], ['l’input (quello che legge scanf)'], ['l’ultimo output'], ['gli esempi', '6']]
  elenco(l, () => {}, {
    voci, stato: { sel: 0, da: 0 }, y0: 34, alta: 80, passo: 10,
    riga(l, v, x0, y, w, on) { l.testo(x0, y + 1, v[0], { inv: on }); if (v[1]) destra(l, x0 + w, y + 1, v[1], { inv: on }) },
  })
  centro(l, H - 9, 'OK sceglie · ↑↓ · INDIETRO torna')
}
function compila(l, tic) {
  testata(l, null, { icona: 'app-compilatore', nome: 'l’output', n: 1 })
  const g = ['|', '/', '-', '\\'][Math.floor(tic / 2) % 4]
  centro(l, 56, `${g} compilo ed eseguo ${g}`)
  centro(l, 68, 'GCC 14.2 su Compiler Explorer')
  for (let i = 0; i < 12; i++) { const x = 92 + i * 6, on = (Math.floor(tic / 2) - i + 120) % 12 < 3; if (on) l.riempi(x, 82, 4, 4, TINTE.verde); else l.px(x + 1, 84) }
  centro(l, H - 9, 'INDIETRO torna (finisce lo stesso)')
}
function uscita(l, k) {
  testata(l, null, { icona: 'app-compilatore', nome: 'l’output', n: 1 })
  // le righe arrivano una alla volta e la finestra le segue, come un terminale
  const n = Math.min(OUT.length, k), g = Math.max(0, n - VIS)
  OUT.slice(g, n).forEach((r, i) => {
    const y = 34 + i * 9
    if (r.fascia) { const [f, c] = FASCE[r.fascia]; l.riempi(8, y - 1, Lcd.larghezza(r.s) + 4, 9, f); l.testo(10, y, r.s, { col: c }) }
    else l.testo(10, y, r.s)
  })
  if (g > 0) l.testo(W - 14, 34, '↑')
  centro(l, H - 9, n >= OUT.length ? '↑↓ legge · OK di nuovo · INDIETRO' : 'OK di nuovo · INDIETRO torna')
}
function striscia(l, s) { l.riempi(10, H - 11, W - 20, 10); centro(l, H - 9, s, { inv: true }) }

// ── lo sfondo: il codice vero che scorre (tutti gli esempi), lontano e sfocato ──
function listato(w, h) {
  const lh = h * 0.068, n = Math.ceil((h * 2) / lh)
  const righe = Object.values(ESEMPI).flatMap(([, c]) => c.split('\n'))
  return { lh, alto: n * lh, tela: (g, sz) => {
    g.font = `400 ${sz}px "gg mono"`
    g.textBaseline = 'top'
    for (let i = 0; i < n; i++) {
      const r = righe[i % righe.length]
      g.fillStyle = /^\s*#/.test(r) ? 'rgba(102,153,255,.55)' : /"/.test(r) ? 'rgba(130,230,140,.6)' : 'rgba(63,185,80,.45)'
      g.fillText(r, w * 0.03, i * lh)
    }
  } }
}

export default async function crea(m) {
  const { kit } = m
  const [foto] = await Promise.all([kit.img(FOTO), kit.font('Mainframe', 700), kit.font('gg mono'), kit.font('gg mono', 700)])
  const sagoma = scontorna(foto)
  const { l, cv: lcdCv } = nuovoLcd()
  const rnd = kit.rng('compilatore')
  // i bit che saltano fuori dall'lcd al colpo: sempre gli stessi (deterministici)
  const BIT = Array.from({ length: 46 }, () => ({ a: rnd() * kit.TAU, v: 0.25 + rnd() * 0.75, s: rnd(), d: rnd() * 0.35, c: rnd() < 0.5 ? '0' : '1', r: rnd() }))

  let S = {} // gli strati, rifatti a ogni misura
  function ridimensiona(w, h) {
    const dpr = m.dpr
    // il cercapersone: largo 1,05 volte la copertina (non più di 1,9 altezze), in basso a destra
    const dw = Math.min(w * 1.05, h * 1.9), s = dw / FW, dh = FH * s
    const dx = w * 0.14, dy = h - dh * 0.86 + h * 0.1
    const pad = dw * 0.06
    const corpo = kit.strato(dw + pad * 2, dh + pad * 2, dpr, (g) => {
      g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = dw * 0.04; g.shadowOffsetY = dw * 0.02
      g.drawImage(sagoma, pad, pad, dw, dh)
    })
    const fondo = kit.strato(w, h, dpr, (g) => {
      const l1 = g.createLinearGradient(0, 0, w * 0.4, h)
      l1.addColorStop(0, '#0a2413'); l1.addColorStop(1, m.c2 || '#04130a')
      g.fillStyle = l1; g.fillRect(0, 0, w, h)
      kit.vignetta(g, w, h, 0.55)
    })
    const L = listato(w, h)
    const codice = kit.strato(w, L.alto, Math.min(dpr, 1.5), (g) => L.tela(g, h * 0.05))
    const codiceSfocato = kit.strato(w, L.alto, 1, (g) => { g.filter = `blur(${Math.max(1, h * 0.008)}px)`; L.tela(g, h * 0.05) })
    // il titolo, col bagliore verde (fermo: va nello strato)
    const tsz = Math.min(w * 0.088, h * 0.17)
    const titolo = kit.strato(w * 0.75, tsz * 1.8, dpr, (g) => {
      g.font = `700 ${tsz}px "Mainframe"`
      g.textBaseline = 'alphabetic'
      g.shadowColor = 'rgba(63,185,80,.9)'; g.shadowBlur = tsz * 0.35
      g.fillStyle = '#7dff92'; g.fillText(m.titolo || 'Codice C', tsz * 0.25, tsz * 1.25)
      g.shadowBlur = 0; g.fillStyle = '#d9ffe0'; g.fillText(m.titolo || 'Codice C', tsz * 0.25, tsz * 1.25)
    })
    titolo.largo = (() => { const g = m.g; g.save(); g.font = `700 ${tsz}px "Mainframe"`; const x = g.measureText(m.titolo || 'Codice C').width; g.restore(); return x })()
    // la polvere fuori fuoco davanti (un tondo morbido solo, ridisegnato più volte)
    const pr = Math.max(4, h * 0.09)
    const bokeh = kit.strato(pr * 2, pr * 2, dpr, (g) => {
      const r = g.createRadialGradient(pr, pr, 0, pr, pr, pr)
      r.addColorStop(0, 'rgba(150,255,165,.5)'); r.addColorStop(0.6, 'rgba(110,240,130,.22)'); r.addColorStop(1, 'rgba(63,185,80,0)')
      g.fillStyle = r; g.fillRect(0, 0, pr * 2, pr * 2)
    })
    S = { w, h, dw, dh, s, dx, dy, pad, corpo, fondo, codice, codiceSfocato, L, titolo, tsz, bokeh, pr }
  }
  const POLVERE = Array.from({ length: 7 }, (_, i) => ({ x: rnd(), y: rnd(), k: 0.5 + rnd(), v: 0.02 + rnd() * 0.04, f: rnd() * 6 }))

  let prima = -1, extra = 0, lcdChiave = ''
  function frame(t, dt) {
    const { w, h } = m
    if (!S.corpo || S.w !== w || S.h !== h) ridimensiona(w, h)
    if (t < prima) extra = 0
    prima = t
    const su = m.su
    extra += (dt || 0) * su * 1.1
    const tau = t + extra, c = kit.fract(tau / CICLO) * CICLO
    const g = m.g
    const { dw, dh, s, dx, dy, pad } = S

    // ── 1. lo sfondo e il codice che scorre ──
    kit.metti(g, S.fondo, 0, 0, w, h)
    const L = S.L
    const scorri = (lay, vel, a, ox) => {
      const y = -((tau * vel * h) % L.alto)
      g.globalAlpha = a
      g.drawImage(lay, ox, y, w, L.alto)
      g.drawImage(lay, ox, y + L.alto, w, L.alto)
    }
    scorri(S.codiceSfocato, 0.035, 0.35 + 0.25 * su, w * 0.02)
    g.save()
    g.beginPath(); g.rect(0, h * 0.3, w * 0.2, h); g.clip()
    scorri(S.codice, 0.06, 0.5 + 0.3 * su, -w * 0.01)
    g.restore()
    g.globalAlpha = 1
    kit.righeCrt(g, w, h, 0.12, Math.max(2, Math.round(h / 90))) // (le righe solo sul fondo: l'lcd resta un lcd)

    // ── 2. il colpo (la fascia verde): quanto è acceso ──
    const dopo = c - T_OK, colpo = dopo > 0 ? Math.exp(-dopo * 1.6) * kit.smooth(0, 0.08, dopo) : 0
    // la luce verde dietro il cercapersone
    const sx0 = dx + SCHERMO[0] * s, sy0 = dy + SCHERMO[1] * s, sw = SCHERMO[2] * s, sh = SCHERMO[3] * s
    const lift = su * 0.022, galla = Math.sin(tau * 0.9) * h * 0.006
    const rg = g.createRadialGradient(sx0 + sw * 0.5, sy0 + sh * 0.5, sw * 0.1, sx0 + sw * 0.5, sy0 + sh * 0.5, sw * (0.9 + 0.3 * colpo))
    rg.addColorStop(0, `rgba(63,185,80,${0.18 + 0.2 * su + 0.45 * colpo})`)
    rg.addColorStop(1, 'rgba(63,185,80,0)')
    g.fillStyle = rg; g.fillRect(0, 0, w, h)

    // ── 3. il cercapersone (un filo inclinato, che galleggia) ──
    const rot = -0.022 + Math.sin(tau * 0.45) * 0.004 - su * 0.008
    const cx = dx + dw * 0.3, cy = dy + dh * 0.45
    g.save()
    g.translate(cx, cy + galla - lift * h); g.rotate(rot); g.scale(1 + lift, 1 + lift); g.translate(-cx, -cy)
    g.drawImage(S.corpo, dx - pad, dy - pad, dw + pad * 2, dh + pad * 2)

    // ── 4. l'lcd vivo: si ridisegna a 20 al secondo (pzk os gira a 10) ──
    const tic = Math.floor(tau * 20)
    const ora = new Date(), hh = `${String(ora.getHours()).padStart(2, '0')}:${String(ora.getMinutes()).padStart(2, '0')}`
    let vista, chiaveLcd
    if (c < T_MENU) {
      const k = c < T0 ? GIA : (() => { let i = GIA; while (i < CODICE.length && quando[i + 1] <= c) i++; return i })()
      vista = () => { editor(l, CODICE.slice(0, k), Math.floor(tic / 2), c > T0 && c < T1 + 0.1); if (c < T0) striscia(l, '✓ caricato: fattoriale (ricorsione)') }
      chiaveLcd = `e${k}:${c < T0}:${(c > T0 && c < T1 + 0.1) || Math.floor(tic / 2) % 10 < 5}`
    } else if (c < T_ESEGUI) { vista = () => menu(l); chiaveLcd = 'm' }
    else if (c < T_OUT) { vista = () => compila(l, tic); chiaveLcd = `c${Math.floor(tic / 2)}` }
    else if (c < CICLO - 0.8) {
      const k = Math.floor((c - T_OUT) / PASSO_OUT) + 1, n = k > USCITA.length ? USCITA.length + 2 + Math.floor((c - T_OK) / 0.25) : k
      vista = () => uscita(l, n); chiaveLcd = `o${n}`
    } else { vista = () => { editor(l, CODICE.slice(0, GIA), 0, false); striscia(l, '✓ caricato: fattoriale (ricorsione)') }; chiaveLcd = 'r' }
    const luce = Math.round((0.86 + 0.14 * su) * 20) / 20
    chiaveLcd += `|${hh}|${luce}`
    if (chiaveLcd !== lcdChiave) {
      lcdChiave = chiaveLcd
      l.luce = luce; l.pulisci(); barra(l, hh); vista(); l.stampa()
    }
    g.save()
    kit.tondo(g, sx0, sy0, sw, sh, SCHERMO[4] * s); g.clip()
    g.imageSmoothingEnabled = sw / PW < 1.2
    g.imageSmoothingQuality = 'high'
    g.drawImage(lcdCv, sx0, sy0, sw, sh)
    g.imageSmoothingEnabled = true
    // il vetro: l'ombra del bordo in alto a sinistra e il riflesso in diagonale
    const v1 = g.createLinearGradient(sx0, sy0, sx0 + sw * 0.08, sy0 + sh * 0.12)
    v1.addColorStop(0, 'rgba(0,0,0,.35)'); v1.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = v1; g.fillRect(sx0, sy0, sw, sh)
    const rx = sx0 + sw * (kit.fract(tau / 7) * 1.8 - 0.4)
    const v2 = g.createLinearGradient(rx, sy0, rx + sw * 0.35, sy0 + sh)
    v2.addColorStop(0, 'rgba(255,255,255,0)'); v2.addColorStop(0.5, `rgba(255,255,255,${0.07 + 0.05 * su})`); v2.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = v2; g.fillRect(sx0, sy0, sw, sh)
    if (colpo > 0.01) { g.fillStyle = `rgba(160,255,170,${0.22 * colpo})`; g.fillRect(sx0, sy0, sw, sh) }
    g.restore()

    // ── 5. i tasti che si premono (OK per il menu e per «esegui», ↓ per leggere) e il led ──
    const premuto = (t0, d = 0.16) => (c >= t0 && c < t0 + d ? Math.sin(((c - t0) / d) * Math.PI) : 0)
    const pOk = Math.max(premuto(T_MENU - 0.12), premuto(T_ESEGUI - 0.14))
    const pGiu = Math.max(premuto(T_OK + 0.9), premuto(T_OK + 1.3), premuto(T_OK + 1.7))
    if (pOk > 0) {
      const [x, y, r] = OKT
      g.fillStyle = `rgba(60,20,0,${0.35 * pOk})`
      g.beginPath(); g.arc(dx + x * s, dy + y * s, r * s, 0, kit.TAU); g.fill()
    }
    if (pGiu > 0) {
      const [x, y, r] = CROCE
      g.fillStyle = `rgba(60,20,0,${0.3 * pGiu})`
      g.beginPath(); g.moveTo(dx + x * s, dy + y * s); g.arc(dx + x * s, dy + y * s, r * s, Math.PI * 0.25, Math.PI * 0.75); g.closePath(); g.fill()
    }
    {
      const [x, y] = LED, acceso = colpo > 0.02 ? colpo : c > T_ESEGUI && c < T_OUT ? (Math.floor(tau * 6) % 2 ? 0.6 : 0) : 0
      const col = c > T_ESEGUI && c < T_OUT ? '255,170,40' : '90,255,120'
      if (acceso > 0) {
        const lr = g.createRadialGradient(dx + x * s, dy + y * s, 0, dx + x * s, dy + y * s, 40 * s)
        lr.addColorStop(0, `rgba(${col},${acceso})`); lr.addColorStop(0.25, `rgba(${col},${acceso * 0.5})`); lr.addColorStop(1, `rgba(${col},0)`)
        g.fillStyle = lr; g.fillRect(dx + x * s - 40 * s, dy + y * s - 40 * s, 80 * s, 80 * s)
      }
    }
    g.restore()

    // ── 6. il colpo: i bit che saltano fuori dall'lcd e il timbro ──
    if (dopo > 0 && dopo < 2.6) {
      g.save()
      g.font = `700 ${h * 0.055}px "gg mono"`
      g.textAlign = 'center'; g.textBaseline = 'middle'
      const ox = sx0 + sw * 0.3, oy = sy0 + sh * 0.78 // dalla fascia verde
      for (const b of BIT) {
        const e = dopo - b.d
        if (e <= 0) continue
        const k = 1 - Math.exp(-e * 2.2), dist = (0.12 + b.v) * w * 0.5 * k
        const x = ox + Math.cos(b.a) * dist * 1.3, y = oy + Math.sin(b.a) * dist * 0.7 + e * e * h * 0.06
        const a = kit.clamp(1 - e / 2.2) * (0.5 + 0.5 * b.s) * kit.smooth(0.05, 0.3, k)
        g.fillStyle = b.r < 0.15 ? `rgba(255,255,255,${a})` : `rgba(125,255,146,${a})`
        g.fillText(b.c, x, y)
      }
      g.restore()
    }
    {
      const e = c - T_OK - 0.15
      if (e > 0 && c < CICLO - 0.9) {
        const k = kit.ease.outBack(kit.clamp(e / 0.35), 2.4), via = kit.clamp((c - (CICLO - 1.6)) / 0.7)
        g.save()
        g.globalAlpha = (1 - via) * 0.92
        kit.timbro(g, 'exit 0', sx0 + sw * 0.86, sy0 + sh * 0.1, Math.min(w * 0.13, h * 0.24) * (1.6 - 0.6 * k), -0.16, '#d0201c', k)
        g.restore()
      }
    }

    // ── 7. la polvere fuori fuoco davanti ──
    for (const p of POLVERE) {
      const x = kit.fract(p.x + tau * p.v * 0.3) * w * 1.2 - w * 0.1, y = (p.y + Math.sin(tau * p.v * 6 + p.f) * 0.04) * h
      const r = S.pr * p.k
      g.globalAlpha = (0.25 + 0.2 * Math.sin(tau * 0.7 + p.f)) * (1 + su * 0.6 + colpo)
      g.drawImage(S.bokeh, x - r, y - r, r * 2, r * 2)
    }
    g.globalAlpha = 1

    // ── 8. il titolo e il cursore che lampeggia; sopra, piccolo, il comando vero dell'app ──
    const tl = S.titolo, tsz = S.tsz, ty = h * 0.035
    if (w > 300) { // (piccola, sarebbe solo un rumore)
      g.font = `400 ${h * 0.04}px "gg mono"`
      g.textBaseline = 'top'; g.textAlign = 'left'
      g.fillStyle = `rgba(125,255,146,${0.5 + 0.35 * su})`
      g.fillText('$ gcc -std=c17 -Wall -O1 main.c', w * 0.03 + tsz * 0.25, ty)
    }
    kit.metti(g, tl, w * 0.03, ty + h * 0.015, w * 0.75, tsz * 1.8)
    if (Math.floor(tau * 2) % 2 === 0 || su > 0.5) {
      g.fillStyle = 'rgba(125,255,146,.85)'
      g.fillRect(w * 0.03 + tsz * 0.25 + tl.largo + tsz * 0.12, ty + h * 0.015 + tsz * 0.45, tsz * 0.45, tsz * 0.82)
    }

    // ── 9. la grana ──
    kit.granella(g, w, h, 0.05, tau)
  }

  return { frame, ridimensiona, titolo: false, fermo: 9 }
}
