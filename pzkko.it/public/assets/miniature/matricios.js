// miniature/matricios.js — Matrici OS: il terminale didattico su un CRT, al buio.
// Il giro (14 s) è quello vero del programma: avvio coi controlli, il menu (la cattura vera, ritinta
// per tema), l'esercizio del prodotto righe per colonne (riga di A × colonna di B, la risposta battuta
// sulla tastiera, «ESATTO! +10 XP»), il salto di rango e i progressi. A ogni giro il CRT si spegne
// e si riaccende con un altro tema: verde fosfori, ambra, blu ghiaccio (le palette di Term.cs).
// Col mouse sopra la camera entra nello schermo e il programma corre più svelto.

const TEMI = [
  { bg: '#041009', dim: '#1d7a3a', norm: '#33ff77', hi: '#c8ffda', rgb: '51,255,119' },
  { bg: '#120b02', dim: '#8c5a0e', norm: '#ffb000', hi: '#ffe3a3', rgb: '255,176,0' },
  { bg: '#030a14', dim: '#22608c', norm: '#55c8ff', hi: '#d5f1ff', rgb: '85,200,255' },
]
// le lettere a blocchi del logo (Term.cs), più la O e la S per «OS»
const G = {
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  I: ['###', ' # ', ' # ', ' # ', '###'],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
}
const SEZIONI = ['RIGHE, COLONNE, DIMENSIONE', 'POSIZIONE DEGLI ELEMENTI', 'TIPI DI MATRICI (FORMA)', 'DIAGONALI E TRACCIA',
  'QUADRATE SPECIALI', 'UGUAGLIANZA', 'TRASPOSTA', 'SOMMA E DIFFERENZA', 'PRODOTTO PER SCALARE', 'PRODOTTO RIGHE PER COLONNE']
const AVVIO = ['> AVVIO SISTEMA', '> TEST MEMORIA 64K RAM', '> CARICAMENTO MODULO MATRICI', '> CARICAMENTO 11 LEZIONI',
  '> CARICAMENTO 100 ESERCIZI', '> LETTURA PROFILO STUDENTE']
const GIRO = 14

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, rng, strato, tondo, TAU, fract } = kit
  await Promise.all([kit.font('gg mono'), kit.font('gg mono', 700), kit.font('gg sans', 700), kit.font('Permanent Marker')])
  // la cattura vera: basta onload (decode() in certi browser senza finestra non risponde mai)
  const cattura = m.cattura ? await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = m.cattura }) : null
  const MONO = '"gg mono", Consolas, monospace'

  // il menu vero (cover.webp: il riquadro del terminale), ritinto una volta per tema
  const menu = TEMI.map((te, i) => {
    if (!cattura) return null
    const c = document.createElement('canvas')
    c.width = 436; c.height = 340
    const x = c.getContext('2d')
    x.drawImage(cattura, 205, 8, 872, 680, 0, 0, 436, 340)
    if (i) {
      x.globalCompositeOperation = 'color'
      x.fillStyle = te.norm
      x.fillRect(0, 0, 436, 340)
    }
    return c
  })

  let L = null // misure
  let fondo = null, monitor = null, postit = null, vetro = null, righe = null, tastiera = null, titoli = []
  let schermo = null, sg = null, piccolo = null, pg = null
  let T = 0 // il tempo del programma (corre più svelto col mouse sopra)
  let ultimaPagina = -1, ultimoTema = -1
  // il retino a puntini delle barre (quello vero), un motivo 2×2 per colore
  const retini = new Map()
  function retino(g, colore) {
    if (!retini.has(colore)) {
      const c = document.createElement('canvas'); c.width = c.height = 2
      const x = c.getContext('2d'); x.fillStyle = colore; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1)
      retini.set(colore, g.createPattern(c, 'repeat'))
    }
    return retini.get(colore)
  }

  function misure(w, h) {
    const SH = h * 0.64, SW = SH * (872 / 680)
    const bx = w * 0.03, bt = h * 0.045, bb = h * 0.11
    const MW = SW + bx * 2, MH = SH + bt + bb
    const mx = w - w * 0.025 - MW, my = h * 0.035
    const s = Math.max(1.4, w * 0.0098) // il lato di un blocco del titolo
    return { w, h, SW, SH, MW, MH, mx, my, sx: mx + bx, sy: my + bt, s, dX: h * 0.84 }
  }

  function ridimensiona(w, h) {
    if (!w || !h) return
    L = misure(w, h)
    const d = m.dpr
    // la stanza e la scrivania
    fondo = strato(w, h, d, (g) => {
      const r = g.createLinearGradient(0, 0, 0, h)
      r.addColorStop(0, '#060807'); r.addColorStop(0.7, '#0b0e0c'); r.addColorStop(1, '#030403')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      // la carta da parati: righe verticali appena visibili
      g.fillStyle = 'rgba(255,255,255,.012)'
      for (let x = 0; x < w; x += w / 42) g.fillRect(x, 0, w / 84, L.dX)
      // la scrivania
      const sc = g.createLinearGradient(0, L.dX, 0, h)
      sc.addColorStop(0, '#1a1712'); sc.addColorStop(1, '#0c0a08')
      g.fillStyle = sc; g.fillRect(0, L.dX, w, h - L.dX)
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, L.dX, w, 1)
      // le venature del piano
      const rr = rng(5)
      g.strokeStyle = 'rgba(255,255,255,.025)'; g.lineWidth = 1
      for (let i = 0; i < 9; i++) { const y = L.dX + (h - L.dX) * rr(); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w, y + 2); g.stroke() }
    })
    // il monitor: guscio, cornice incassata, etichetta, piede (con le ombre, una volta sola)
    monitor = strato(w, h, d, (g) => {
      const { mx, my, MW, MH, sx, sy, SW, SH } = L
      // il piede
      g.fillStyle = '#141513'
      g.beginPath(); g.moveTo(mx + MW * 0.38, my + MH - 2); g.lineTo(mx + MW * 0.62, my + MH - 2); g.lineTo(mx + MW * 0.68, L.dX + h * 0.035); g.lineTo(mx + MW * 0.32, L.dX + h * 0.035); g.closePath(); g.fill()
      g.fillStyle = '#1d1e1b'; tondo(g, mx + MW * 0.24, L.dX + h * 0.02, MW * 0.52, h * 0.035, h * 0.01); g.fill()
      // il guscio con l'ombra
      g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = w * 0.04; g.shadowOffsetY = h * 0.02
      const gs = g.createLinearGradient(0, my, 0, my + MH)
      gs.addColorStop(0, '#34362f'); gs.addColorStop(0.5, '#262822'); gs.addColorStop(1, '#1b1c18')
      g.fillStyle = gs; tondo(g, mx, my, MW, MH, w * 0.018); g.fill(); g.restore()
      g.strokeStyle = 'rgba(255,255,255,.09)'; g.lineWidth = 1; tondo(g, mx + 0.5, my + 0.5, MW - 1, MH - 1, w * 0.018); g.stroke()
      // la cornice incassata dello schermo
      const p = w * 0.012
      const gi = g.createLinearGradient(0, sy - p, 0, sy + SH + p)
      gi.addColorStop(0, '#0b0c0a'); gi.addColorStop(1, '#2b2d27')
      g.fillStyle = gi; tondo(g, sx - p, sy - p, SW + p * 2, SH + p * 2, w * 0.022); g.fill()
      g.fillStyle = '#000'; tondo(g, sx, sy, SW, SH, w * 0.02); g.fill()
      // l'etichetta e le prese d'aria
      g.font = `700 ${Math.max(5, h * 0.028)}px "gg sans", sans-serif`; g.textBaseline = 'middle'
      g.fillStyle = 'rgba(220,225,210,.42)'; g.fillText('MATRICI-OS', sx, my + MH - L.h * 0.055)
      g.fillStyle = 'rgba(0,0,0,.45)'
      for (let i = 0; i < 6; i++) tondo(g, sx + SW * 0.62 + i * SW * 0.035, my + MH - h * 0.068, SW * 0.018, h * 0.026, 2), g.fill()
      // la manopola
      g.fillStyle = '#121310'; g.beginPath(); g.arc(sx + SW - h * 0.03, my + MH - h * 0.055, h * 0.018, 0, TAU); g.fill()
    })
    // il post-it attaccato all'angolo dello schermo, scritto a pennarello (va sopra il vetro)
    postit = strato(w, h, d, (g) => {
      const { mx, my, MW, MH } = L
      g.save(); g.translate(mx - MW * 0.035, my + MH * 0.66); g.rotate(-0.12)
      const pw = MW * 0.2, ph = pw * 0.8
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = pw * 0.1; g.shadowOffsetY = pw * 0.04
      g.fillStyle = '#f3e35a'; g.fillRect(0, 0, pw, ph); g.shadowColor = 'transparent'
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, pw, ph * 0.18)
      g.fillStyle = '#1b1b1b'; g.font = `400 ${pw * 0.17}px "Permanent Marker"`; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText('riga ×', pw / 2, ph * 0.42); g.fillText('colonna!', pw / 2, ph * 0.72)
      g.strokeStyle = '#d0201c'; g.lineWidth = pw * 0.025; g.beginPath(); g.moveTo(pw * 0.15, ph * 0.9); g.quadraticCurveTo(pw * 0.5, ph * 0.84, pw * 0.86, ph * 0.9); g.stroke()
      g.restore(); g.textAlign = 'left'
    })
    // il vetro bombato: angoli scuri e il riflesso della stanza
    vetro = strato(L.SW, L.SH, d, (g, W, H) => {
      const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.56)
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.72)')
      g.fillStyle = v; g.fillRect(0, 0, W, H)
      const r = g.createLinearGradient(0, 0, W * 0.6, H * 0.8)
      r.addColorStop(0, 'rgba(255,255,255,.10)'); r.addColorStop(0.35, 'rgba(255,255,255,.03)'); r.addColorStop(0.36, 'rgba(255,255,255,0)')
      g.fillStyle = r; g.beginPath(); g.ellipse(W * 0.28, H * 0.2, W * 0.45, H * 0.3, -0.35, 0, TAU); g.fill()
    })
    righe = strato(L.SW, L.SH, d, (g, W, H) => {
      const p = Math.max(2, H / 110)
      g.fillStyle = 'rgba(0,0,0,.33)'
      for (let y = 0; y < H; y += p) g.fillRect(0, y, W, p * 0.45)
    })
    // la tastiera, in basso a sinistra, un po' in prospettiva
    tastiera = strato(w, h, d, (g) => {
      const kx = w * 0.05, ky = L.dX + h * 0.035, kw = w * 0.36, kh = h * 0.19
      g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = w * 0.02; g.shadowOffsetY = h * 0.01
      g.fillStyle = '#1f201c'
      g.beginPath(); g.moveTo(kx + kw * 0.04, ky); g.lineTo(kx + kw * 0.96, ky); g.lineTo(kx + kw, ky + kh); g.lineTo(kx, ky + kh); g.closePath(); g.fill()
      g.restore()
      for (const k of tasti()) {
        g.fillStyle = '#0e0f0c'; tondo(g, k.x, k.y + k.h * 0.18, k.w, k.h, k.h * 0.2); g.fill()
        g.fillStyle = '#34352f'; tondo(g, k.x, k.y, k.w, k.h * 0.92, k.h * 0.2); g.fill()
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(k.x + k.w * 0.15, k.y + 1, k.w * 0.7, 1)
      }
    })
    // il titolo a blocchi, uno per tema, con l'alone dei fosfori
    titoli = TEMI.map((te) => strato(w * 0.62, h * 0.4, d, (g) => {
      g.shadowColor = `rgba(${te.rgb},.85)`; g.shadowBlur = L.s * 3.2
      blocchi(g, L.s * 0.5, L.s * 0.6, L.s, te.norm)
      g.shadowBlur = 0
      blocchi(g, L.s * 0.5, L.s * 0.6, L.s, te.norm)
    }))
    // la pagina del terminale e la sua copia piccola per l'alone
    ultimaPagina = -1
    schermo = document.createElement('canvas')
    schermo.width = Math.max(1, Math.round(L.SW * d)); schermo.height = Math.max(1, Math.round(L.SH * d))
    sg = schermo.getContext('2d')
    piccolo = document.createElement('canvas')
    piccolo.width = Math.max(1, Math.round(L.SW / 6)); piccolo.height = Math.max(1, Math.round(L.SH / 6))
    pg = piccolo.getContext('2d')
  }

  // «MATRICI» e sotto «OS», coi blocchi staccati di un filo
  function blocchi(g, x0, y0, s, colore) {
    g.fillStyle = colore
    const riga = (parola, y) => {
      let x = x0
      for (const ch of parola) {
        const gl = G[ch]
        for (let r = 0; r < 5; r++) for (let c = 0; c < gl[r].length; c++) if (gl[r][c] === '#') g.fillRect(x + c * s, y + r * s * 1.25, s * 0.88, s * 1.15)
        x += (gl[0].length + 1.2) * s
      }
    }
    riga('MATRICI', y0)
    riga('OS', y0 + s * 7.6)
  }

  function tasti() {
    const out = []
    const kx = L.w * 0.05, ky = L.dX + L.h * 0.035, kw = L.w * 0.36, kh = L.h * 0.19
    for (let r = 0; r < 4; r++) {
      const n = 13 - (r === 3 ? 0 : 0)
      const y = ky + kh * (0.1 + r * 0.215)
      const sc = 0.94 + r * 0.02
      const rw = kw * sc, rx = kx + (kw - rw) / 2
      for (let c = 0; c < n; c++) {
        if (r === 3 && c > 2 && c < 9) { if (c === 3) out.push({ x: rx + rw * (3 / n) + 1, y, w: rw * (6 / n) - 2, h: kh * 0.16, r, c }); continue }
        out.push({ x: rx + rw * (c / n) + rw * 0.006 + r * kw * 0.012, y, w: rw / n - rw * 0.014, h: kh * 0.16, r, c })
      }
    }
    return out
  }

  // ── il programma, fotogramma per fotogramma ──
  function stato(T) {
    const giro = Math.floor(T / GIRO)
    const k = T - giro * GIRO
    const r = rng(giro * 7 + 3)
    const n = () => 1 + Math.floor(r() * 8)
    const A = [n(), n(), n(), n()], B = [n(), n(), n(), n()]
    return { giro, k, tema: TEMI[giro % 3], ti: giro % 3, A, B, c11: A[0] * B[0] + A[1] * B[2] }
  }

  function pagina(st, su) {
    const g = sg, d = m.dpr
    const W = L.SW, H = L.SH, te = st.tema, k = st.k
    g.setTransform(d, 0, 0, d, 0, 0)
    g.fillStyle = te.bg; g.fillRect(0, 0, W, H)
    const spazia = 'letterSpacing' in g
    // la griglia dei caratteri: fitta come quella vera (64 × 25) o ingrandita per l'esercizio (44 × 18)
    let cw, lh, fs, R
    // (la spaziatura porta ogni carattere nella sua cella: una fillText per riga basta)
    const griglia = (c, r) => {
      cw = W / c; lh = H / r; R = r; fs = lh * 0.74; g.font = `400 ${fs}px ${MONO}`; g.textBaseline = 'middle'
      if (spazia) { g.letterSpacing = '0px'; g.letterSpacing = `${cw * 0.98 - g.measureText('0').width}px` }
    }
    griglia(64, 25)
    const scrivi = (s, col, riga, colore = te.norm, inv = false, peso = 400) => {
      const x = cw * (col + 1.5), y = lh * (riga + 0.9)
      if (inv) { g.fillStyle = te.hi; g.fillRect(x - cw * 0.4, y - lh * 0.48, s.length * cw * 0.98 + cw * 0.8, lh * 0.96); colore = te.bg }
      if (peso !== 400) g.font = `${peso} ${fs}px ${MONO}`
      g.fillStyle = colore
      // monospazio vero: un carattere per cella
      // monospazio sulla griglia: una sola fillText, con la spaziatura che porta ogni carattere nella sua cella
      g.fillText(s, x, y)
      if (peso !== 400) g.font = `400 ${fs}px ${MONO}`
    }
    const cornice = (titolo, sotto, piede) => {
      g.strokeStyle = te.dim; g.lineWidth = Math.max(1, lh * 0.06)
      g.strokeRect(cw * 0.6, lh * 0.5, W - cw * 1.2, H - lh * 1.0)
      g.strokeRect(cw * 0.95, lh * 0.75, W - cw * 1.9, H - lh * 1.5)
      g.beginPath(); g.moveTo(cw * 0.95, lh * 2.6); g.lineTo(W - cw * 0.95, lh * 2.6); g.moveTo(cw * 0.95, H - lh * 2.5); g.lineTo(W - cw * 0.95, H - lh * 2.5); g.stroke()
      g.fillStyle = te.bg; g.fillRect(cw * 2.2, lh * 0.3, (titolo.length + 2) * cw, lh * 0.8)
      scrivi(titolo, 1.3, -0.2, te.hi)
      scrivi(sotto, 0.8, 0.95)
      scrivi(piede, 0.8, R - 2.7, te.dim)
    }

    if (k < 1.9) {
      // l'avvio: i controlli di sistema, uno dopo l'altro
      const p = k / 1.9
      scrivi('MATRICI-OS (TM)  //  TERMINALE DIDATTICO  //  v1.0', 2, 1, te.hi)
      scrivi('COPYRIGHT 2026  -  LABORATORIO DI ALGEBRA LINEARE', 2, 2, te.hi)
      AVVIO.forEach((s, i) => {
        const q = clamp(p * 9 - i * 1.05)
        if (q <= 0) return
        const riga = s + ' ' + '.'.repeat(Math.round((44 - s.length) * clamp(q * 1.6)))
        scrivi(riga, 2, 4 + i)
        if (q >= 1) scrivi('OK', 48, 4 + i, te.hi)
      })
      if (p > 0.78) { scrivi('> ACCESSO CONSENTITO.  BENVENUTO, PZKKO.', 2, 11, te.hi); scrivi('XP: 240    RANGO: APPRENDISTA    RISOLTI: 24/100', 4, 12) }
      if (p > 0.86 && fract(k * 2.5) < 0.6) scrivi('[ PREMI UN TASTO PER ENTRARE ]', 17, 18, te.norm, true)
    } else if (k < 3.9) {
      // il menu vero: la cattura, e la selezione che scende su ESERCIZI
      const im = menu[st.ti]
      if (im) {
        if (spazia) g.letterSpacing = '0px'
        g.drawImage(im, 0, 0, W, H)
        const sc = W / 872, giu = smooth(2.7, 3.0, k)
        if (giu > 0) {
          // ripassa la riga 1 a mano e accende la 2
          const fy = 280 * sc, rh = 24 * sc
          g.fillStyle = te.bg; g.fillRect(270 * sc, fy, 350 * sc, rh * 2)
          g.font = `400 ${17 * sc}px ${MONO}`; g.textBaseline = 'middle'
          const y = fy + rh * (giu > 0.5 ? 1 : 0)
          g.fillStyle = k > 3.6 && fract(k * 8) < 0.5 ? te.norm : te.hi; g.fillRect(281 * sc, y, 330 * sc, rh)
          g.fillStyle = giu > 0.5 ? te.norm : te.bg; g.fillText('[1] LEZIONI', 304 * sc, fy + rh / 2)
          g.fillStyle = giu > 0.5 ? te.bg : te.norm; g.fillText('[2] ESERCIZI', 304 * sc, fy + rh * 1.5)
          g.fillText('►', 282 * sc, y + rh / 2)
          g.font = `400 ${fs}px ${MONO}`
        }
      } else {
        cornice('MATRICI-OS v1.0', 'UTENTE: PZKKO   XP: 240   RANGO: APPRENDISTA', '[↑↓] scegli   [INVIO] conferma')
        ;['[1] LEZIONI', '[2] ESERCIZI', '[3] SFIDA RAPIDA', '[4] RIPASSO ERRORI (0)', '[5] PROGRESSI', '[0] ESCI'].forEach((s, i) => scrivi(s, 22, 8 + i, te.norm, i === (k > 2.9 ? 1 : 0)))
      }
    } else if (k < 10.6) {
      // l'esercizio: c11 di A · B, riga 1 di A per colonna 1 di B
      const e = k - 3.9
      const { A, B } = st
      griglia(44, 18)
      cornice('SEZ. 10 // PRODOTTO RIGHE PER COLONNE', 'ES. 099  DOMANDA 4 DI 5  XP ' + (e > 3.5 ? 250 : 240) + '  SERIE 3', '[INVIO] prossimo   [ESC] menù')
      scrivi('Sia C = A · B. Calcola c11', 1, 3.2)
      scrivi('(RIGA 1 di A per COLONNA 1 di B)', 1, 4.2, te.dim)
      const mat = (nome, v, col, riga, evR, evC) => {
        scrivi(nome + ' =', col, riga + 1.5, te.hi)
        const x = cw * (col + 5.5), y = lh * (riga + 0.45), bw = cw * 7.6, bh = lh * 2.9
        g.strokeStyle = te.norm; g.lineWidth = Math.max(1, cw * 0.18)
        g.beginPath(); g.moveTo(x + cw * 0.8, y); g.lineTo(x, y); g.lineTo(x, y + bh); g.lineTo(x + cw * 0.8, y + bh)
        g.moveTo(x + bw - cw * 0.8, y); g.lineTo(x + bw, y); g.lineTo(x + bw, y + bh); g.lineTo(x + bw - cw * 0.8, y + bh); g.stroke()
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
          const acceso = (evR && i === 0 && j < evR) || (evC && j === 0 && i < evC)
          scrivi(String(v[i * 2 + j]), col + 6.4 + j * 3.2, riga + 1 + i * 1.05, te.hi, acceso)
        }
      }
      // l'evidenziatore scorre: prima la riga, poi la colonna
      const evR = e > 0.6 ? (e > 1.0 ? 2 : 1) : 0
      const evC = e > 1.3 ? (e > 1.7 ? 2 : 1) : 0
      mat('A', A, 3, 5.4, evR, 0)
      mat('B', B, 22, 5.4, 0, evC)
      // la risposta battuta
      const ris = String(st.c11)
      const nb = clamp(Math.floor((e - 2.2) / 0.35) + 1, 0, ris.length)
      if (e > 2.0) {
        const cur = e < 3.4 && fract(e * 2.2) < 0.55 ? '█' : ''
        scrivi('> ' + ris.slice(0, nb) + cur, 1, 9.6, te.hi)
        scrivi('scrivi un numero e premi INVIO', 3, 10.6, te.dim)
      }
      if (e > 3.5) {
        scrivi('ESATTO! +10 XP', 1.4, 12, te.hi, true, 700)
        const f = `c11 = ${A[0]}·${B[0]} + ${A[1]}·${B[2]} = ${A[0] * B[0]} + ${A[1] * B[2]} = ${st.c11}`
        scrivi(f.slice(0, Math.round(f.length * clamp((e - 3.7) / 0.9))), 1, 13.2)
      }
      if (e > 4.6) {
        // il salto di rango: il riquadro lampeggia
        const lamp = e < 6.2 && fract(e * 3) < 0.5
        scrivi(' RANGO SUPERIORE: TECNICO ', 8, 14.4, te.hi, lamp, 700)
      }
    } else if (k < 13.1) {
      // i progressi: le barre si riempiono (il retino è quello vero, a puntini)
      const e = k - 10.6
      cornice('PROGRESSI', 'UTENTE: PZKKO   XP: 250   RANGO: TECNICO   RISOLTI: 25/100', '[R] azzera tutti i progressi   [ESC] indietro')
      scrivi('SEZIONE', 2, 4, te.dim); scrivi('RISOLTI', 36, 4, te.dim)
      const pieni = [10, 4, 3, 2, 0, 1, 0, 0, 0, 5], tot = [10, 15, 15, 10, 15, 5, 10, 8, 7, 5]
      SEZIONI.forEach((s, i) => {
        scrivi(`${String(i + 1).padStart(2)}. ${s}`, 1, 5.2 + i * 1.3, i === 9 || pieni[i] === tot[i] ? te.hi : te.norm)
        const x = cw * 37.5, y = lh * (5.2 + i * 1.3 + 0.55), bw = cw * 14, bh = lh * 0.8
        g.fillStyle = te.dim; g.globalAlpha = 0.35
        g.fillStyle = retino(g, te.dim); g.fillRect(x, y, bw, bh)
        g.globalAlpha = 1
        const q = ease.out(clamp(e * 1.6 - i * 0.09))
        g.fillStyle = te.hi; g.fillRect(x, y, bw * (pieni[i] / tot[i]) * q, bh)
        scrivi(`${Math.round(pieni[i] * q)}/${tot[i]}`, 53, 5.2 + i * 1.3)
      })
    } else {
      // il cambio tema: resta il menu
      const im = menu[st.ti]
      if (im) g.drawImage(im, 0, 0, W, H)
    }
  }

  function frame(t, dt) {
    if (!L || L.w !== m.w || L.h !== m.h) ridimensiona(m.w, m.h)
    const g = m.g, { w, h } = L, su = m.su
    T += (dt || 0) * (1 + su * 0.9)
    const st = stato(T)
    const te = st.tema, k = st.k
    // l'accensione/spegnimento del CRT a cavallo del giro
    const spegni = k > GIRO - 0.75 ? smooth(GIRO - 0.75, GIRO - 0.15, k) : 0
    const accendi = k < 0.6 && st.giro > 0 ? 1 - smooth(0, 0.6, k) : 0
    const crt = Math.max(spegni, accendi) // 0 acceso, 1 spento
    // il lampo del rango
    const e = k - 3.9
    const lampo = e > 4.6 && e < 6.0 ? Math.exp(-(e - 4.6) * 3.2) : 0
    const luce = (1 - crt) * (0.85 + 0.15 * Math.sin(t * 50) * 0.2) + lampo * 0.8

    // la camera: col mouse sopra entra verso lo schermo
    // (si allarga verso destra e in basso, così il titolo a sinistra resta libero)
    const zoom = 1 + ease.inOut(su) * 0.12
    const cx = L.sx + L.SW / 2, cy = L.sy + L.SH / 2
    const respiro = Math.sin(t * 0.4) * 0.004
    const ax = L.mx + L.MW * 0.15, ay = L.my
    g.save()
    g.translate(ax, ay); g.scale(zoom + respiro, zoom + respiro); g.translate(-ax, -ay)
    g.drawImage(fondo, 0, 0, w, h)
    // la luce dello schermo sulla stanza e sul piano
    g.globalCompositeOperation = 'lighter'
    const rl = g.createRadialGradient(cx, cy + L.SH * 0.6, 0, cx, cy + L.SH * 0.6, w * 0.75)
    rl.addColorStop(0, `rgba(${te.rgb},${0.16 * luce})`); rl.addColorStop(1, `rgba(${te.rgb},0)`)
    g.fillStyle = rl; g.fillRect(0, 0, w, h)
    g.globalCompositeOperation = 'source-over'
    g.drawImage(monitor, 0, 0, w, h)
    g.drawImage(tastiera, 0, 0, w, h)
    // i tasti premuti: la risposta (cifre), INVIO, e qualche tasto a caso durante l'avvio
    premuti(g, st, t)

    // lo schermo
    // la pagina si ridisegna a 30 fotogrammi al secondo (il terminale vero è ancora più lento)
    const passo = Math.floor(T * 30)
    if (passo !== ultimaPagina || st.ti !== ultimoTema) {
      pagina(st, su); ultimaPagina = passo; ultimoTema = st.ti
      // e la sua copia piccola per l'alone
      pg.globalCompositeOperation = 'copy'
      pg.drawImage(schermo, 0, 0, piccolo.width, piccolo.height)
    }
    g.save()
    tondo(g, L.sx, L.sy, L.SW, L.SH, w * 0.02); g.clip()
    g.fillStyle = '#000'; g.fillRect(L.sx, L.sy, L.SW, L.SH)
    if (crt < 1) {
      // il fascio che si chiude in una riga e poi in un punto
      const vy = crt < 0.6 ? 1 - ease.in(crt / 0.6) * 0.985 : 0.015
      const vx = crt < 0.6 ? 1 : 1 - ease.in((crt - 0.6) / 0.4)
      const sw = L.SW * vx, sh = L.SH * vy
      const tremo = Math.sin(t * 13) > 0.97 ? L.SH * 0.006 : 0
      g.globalAlpha = clamp(1 - crt * 0.3)
      g.drawImage(schermo, L.sx + (L.SW - sw) / 2 + tremo, L.sy + (L.SH - sh) / 2, sw, sh)
      // l'alone dei fosfori: la pagina rimpicciolita e riallargata, sommata
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 0.55 * luce
      g.drawImage(piccolo, L.sx + (L.SW - sw) / 2 - 2, L.sy + (L.SH - sh) / 2 - 2, sw + 4, sh + 4)
      g.globalAlpha = 1
      if (crt > 0.5) { g.fillStyle = `rgba(${te.rgb},${(crt - 0.5) * 1.6})`; g.fillRect(L.sx + (L.SW - sw) / 2, cy - 1, sw, 2) }
      g.globalCompositeOperation = 'source-over'
    }
    g.drawImage(righe, L.sx, L.sy + ((t * 6) % 3), L.SW, L.SH)
    // la riga che scorre, chiara
    const ry = L.sy + fract(t * 0.23) * L.SH * 1.3 - L.SH * 0.15
    const rg = g.createLinearGradient(0, ry - L.SH * 0.08, 0, ry + L.SH * 0.08)
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.5, `rgba(${te.rgb},${0.07 * (1 - crt)})`); rg.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = rg; g.fillRect(L.sx, ry - L.SH * 0.08, L.SW, L.SH * 0.16)
    if (lampo) { g.fillStyle = `rgba(${te.rgb},${lampo * 0.35})`; g.globalCompositeOperation = 'lighter'; g.fillRect(L.sx, L.sy, L.SW, L.SH); g.globalCompositeOperation = 'source-over' }
    g.drawImage(vetro, L.sx, L.sy, L.SW, L.SH)
    g.restore()
    g.drawImage(postit, 0, 0, w, h)
    // la spia d'accensione
    g.fillStyle = crt > 0.5 ? '#2a1a0a' : te.norm
    g.beginPath(); g.arc(L.sx + L.SW - h * 0.075, L.my + L.MH - h * 0.055, h * 0.008, 0, TAU); g.fill()
    // il salto di rango: le cifre volano fuori dallo schermo
    if (e > 4.5 && e < 6.6) scintille(g, e - 4.5, st, te)
    g.restore()

    // il titolo a blocchi (resta fermo: è il nome dell'app) e sotto il cruscotto dello studente
    const ti = st.ti
    const prev = (ti + 2) % 3
    const tw = w * 0.62, th = h * 0.4
    const tx = w * 0.045 - L.s * 0.5, ty = h * 0.075 - L.s * 0.6
    const mix = st.giro > 0 && k < 0.6 ? smooth(0, 0.6, k) : 1
    const tremola = 0.92 + 0.08 * Math.sin(t * 31) * Math.sin(t * 7.3)
    g.globalAlpha = (1 - mix) * tremola; if (mix < 1) g.drawImage(titoli[prev], tx, ty, tw, th)
    g.globalAlpha = mix * tremola; g.drawImage(titoli[ti], tx, ty, tw, th)
    g.globalAlpha = 1
    // il cursore che lampeggia dopo «OS»
    if (fract(t * 1.6) < 0.55) { g.fillStyle = te.norm; g.fillRect(tx + L.s * 0.5 + L.s * 13.6, ty + L.s * 0.6 + L.s * 7.6 + L.s * 3.8, L.s * 3.4, L.s * 1.2) }
    cruscotto(g, st, t, e, lampo)
    kit.vignetta(g, w, h, 0.5)
    kit.granella(g, w, h, 0.05, t)
  }

  function premuti(g, st, t) {
    const k = st.k, e = k - 3.9
    const ks = tasti()
    let giu = []
    const ris = String(st.c11)
    for (let i = 0; i < ris.length; i++) { const tt = e - (2.2 + i * 0.35); if (tt > 0 && tt < 0.18) giu.push(ks[(+ris[i] + 9) % 10 + 1]) }
    if (e > 3.3 && e < 3.5) giu.push(ks[38]) // INVIO, più o meno lì
    if (k > 1.6 && k < 1.8) giu.push(ks[45]) // la barra: «premi un tasto»
    if (k > 2.95 && k < 3.1) giu.push(ks[24])
    for (const q of giu) {
      if (!q) continue
      g.fillStyle = '#0e0f0c'; tondo(g, q.x, q.y, q.w, q.h * 1.1, q.h * 0.2); g.fill()
      g.fillStyle = '#2a2b26'; tondo(g, q.x, q.y + q.h * 0.16, q.w, q.h * 0.9, q.h * 0.2); g.fill()
      g.fillStyle = `rgba(${st.tema.rgb},.25)`; g.fillRect(q.x, q.y + q.h * 0.16, q.w, 1)
    }
  }

  function scintille(g, a, st, te) {
    const r = rng(st.giro * 13 + 1)
    const cx = L.sx + L.SW / 2, cy = L.sy + L.SH / 2
    g.textAlign = 'center'; g.textBaseline = 'middle'
    for (let i = 0; i < 34; i++) {
      const ang = r() * TAU, v = 0.4 + r() * 0.9, ch = r() < 0.3 ? '█' : String(Math.floor(r() * 10))
      const p = ease.out(clamp(a / (1.4 + r())))
      const dist = p * v * L.w * 0.55
      const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist * 0.7 + p * p * L.h * 0.15
      const s = L.h * (0.025 + p * 0.05 * v)
      g.globalAlpha = clamp(1.2 - p * 1.1)
      g.font = `700 ${s}px ${MONO}`
      g.fillStyle = i % 4 ? te.norm : te.hi
      g.fillText(ch, x, y)
    }
    g.globalAlpha = 1; g.textAlign = 'left'
  }

  // XP, rango e risolti, scritti sotto il titolo come la riga in alto del programma
  function cruscotto(g, st, t, e, lampo) {
    const { w, h } = L, te = st.tema
    const x = w * 0.05, y0 = h * 0.47
    const fs = Math.max(6, h * 0.045)
    g.font = `400 ${fs}px ${MONO}`; g.textBaseline = 'middle'
    const xp = e > 3.5 && st.k < 13.6 ? 250 : 240
    const tecnico = xp >= 250
    g.fillStyle = te.dim; g.fillText('UTENTE: PZKKO', x, y0)
    g.fillStyle = te.norm; g.fillText(`XP: ${xp}`, x, y0 + fs * 1.5)
    // la barra dell'XP verso il prossimo rango
    const bx = x + fs * 4.6, by = y0 + fs * 1.5 - fs * 0.35, bw = w * 0.22, bh = fs * 0.7
    g.strokeStyle = te.dim; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh)
    // da APPRENDISTA (100) a TECNICO (250): la barra si riempie, lampeggia piena e riparte da zero
    const q = tecnico ? clamp((e - 3.5) / 1.2) : 0
    const pieno = !tecnico ? 140 / 150 : q < 0.6 ? lerp(140 / 150, 1, clamp(q * 4)) : 0.02
    g.fillStyle = q > 0.3 && q < 0.6 && fract(t * 8) < 0.5 ? te.hi : te.norm
    g.fillRect(bx + 1, by + 1, (bw - 2) * pieno, bh - 2)
    g.fillStyle = tecnico ? te.hi : te.norm
    const rango = tecnico ? 'TECNICO' : 'APPRENDISTA'
    g.fillText(`RANGO: ${rango}`, x, y0 + fs * 3)
    if (tecnico && lampo > 0.02) {
      // il timbro del rango nuovo
      kit.timbro(g, 'rango su', x + w * 0.31, y0 + fs * 3.1, fs * 2.4, -0.18, te.hi, clamp(1 - lampo * 0.4))
    }
    g.fillStyle = te.dim; g.fillText(`RISOLTI: ${xp === 250 ? 25 : 24}/100`, x, y0 + fs * 4.5)
  }

  ridimensiona(m.w, m.h)
  return { frame, ridimensiona, titolo: false, fermo: 9.2 }
}
