// miniature/theremin.js — il Theremin che suona da solo, in silenzio.
// Com'è l'app vera (games/theremin): il campo nero a fosfori dentro la cornice di carta col nastro, le note della
// scala pentatonica (due ottave, do4–do6) come righe con i nomi a sinistra, il punto luminoso con la riga verticale
// e la scia, la colonna del volume a destra, la lettura «sol4 · 392 Hz» col bordo lime, il tasto «suona» (verde
// quando suona). Qui una mano invisibile al theremin vero: più a destra = più acuto, più in alto = più forte, con
// il vibrato. La corda della nota suona, e dal dito parte l'onda (lunghezza dalla frequenza, altezza dal volume).
// Il «wow»: un glissando su tutte e due le ottave fino al do6, le corde suonano una dopo l'altra e il campo si
// illumina. Col mouse sopra: la mano si avvicina al vetro, il volume sale, la scia (lo «spazio») si allunga.

const LIME = '#ccff00'
const CAMPO = '#10120f'
const FOGLIETTO = '#fffdf6'
const INK = '#161616'
const NOMI = ['do', 'do#', 're', 're#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']
const PENTA = [0, 2, 4, 7, 9]
const NOTE = Array.from({ length: PENTA.length * 2 + 1 }, (_, i) => 60 + PENTA[i % 5] + 12 * Math.floor(i / 5))
const freqMidi = (n) => 440 * 2 ** ((n - 69) / 12)
const nomeNota = (n) => `${NOMI[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`
const hz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(2)} kHz` : `${Math.round(f)} Hz`)
// la melodia: [indice della nota, durata in secondi, volume]
const MELODIA = [[2, 1.1, 0.62], [4, 0.7, 0.7], [5, 1.3, 0.82], [4, 0.6, 0.66], [7, 1.4, 0.9], [5, 0.8, 0.72], [3, 0.9, 0.6], [4, 1.6, 0.78], [1, 1.0, 0.5]]
const DURATA_MELODIA = MELODIA.reduce((a, n) => a + n[1], 0)
const GLISS = 1.6, RITORNO = 1.3
const GIRO = DURATA_MELODIA + GLISS + RITORNO

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU, fract } = kit
  await Promise.all([kit.font('Modern', 500), kit.font('Anton'), kit.font('Special Elite'), kit.font('Permanent Marker')])

  const corde = new Float32Array(NOTE.length)
  let L = null, W = 0, H = 0, D = 0
  let tm = 0 // il tempo della mano (col mouse sopra va un poco più svelto)
  let su = 0

  // ── dove sta la mano al tempo s: x 0→1 (la nota), v 0→1 (il volume), wow 0→1 ──
  const xNota = (i) => i / (NOTE.length - 1)
  function mano(s) {
    const c = s - Math.floor(s / GIRO) * GIRO
    if (c < DURATA_MELODIA) {
      let a = 0
      for (let j = 0; j < MELODIA.length; j++) {
        const [i, dur, vol] = MELODIA[j]
        if (c < a + dur) {
          const k = (c - a) / dur
          const prec = MELODIA[(j + MELODIA.length - 1) % MELODIA.length]
          const prima = j === 0 ? [MELODIA[0][0], 0, 0.72] : prec
          // la mano scivola alla nota nuova (portamento) e poi la tiene col vibrato
          const pass = ease.inOut(clamp(k / 0.22))
          const vib = Math.sin(s * TAU * 5.5) * 0.007 * smooth(0.2, 0.5, k)
          const x = lerp(xNota(prima[0]), xNota(i), pass) + vib
          // il volume si gonfia sulla nota e cala prima della prossima
          const v = lerp(prima[2] * 0.7, vol, ease.out(clamp(k / 0.35))) * (1 - 0.25 * smooth(0.75, 1, k))
          return { x, v, wow: 0, k }
        }
        a += dur
      }
    }
    if (c < DURATA_MELODIA + GLISS) {
      // il glissando: dal do4 al do6, il volume che sale fino in cima
      const k = (c - DURATA_MELODIA) / GLISS
      const sale = ease.inOut(clamp(k / 0.75))
      const prima = xNota(MELODIA[MELODIA.length - 1][0])
      return { x: lerp(prima, 1, sale) + Math.sin(s * TAU * 6) * 0.006 * smooth(0.75, 0.9, k), v: lerp(0.45, 1, ease.in(clamp(k / 0.8))), wow: k, k }
    }
    // il ritorno all'inizio, col volume che scende
    const k = (c - DURATA_MELODIA - GLISS) / RITORNO
    const e = ease.inOut(k)
    return { x: lerp(1, xNota(MELODIA[0][0]), e) + Math.sin(s * TAU * 5.5) * 0.007 * (1 - k), v: lerp(1, 0.5, e), wow: 1 + k, k }
  }
  const indice = (x) => clamp(Math.round(clamp(x) * (NOTE.length - 1)), 0, NOTE.length - 1)

  function geometria(w, h) {
    const u = w / 100
    const campo = { x: 4 * u, y: 22.4 * u, w: 92 * u, h: h - 3.4 * u - 22.4 * u }
    return {
      u, w, h, campo,
      lx: campo.x + 8.6 * u, // dove iniziano le righe (a sinistra i nomi)
      rx: campo.x + campo.w - 5.2 * u, // la colonna del volume a destra
      let: { x: 61 * u, y: 4 * u, w: 35 * u, h: 12.6 * u },
    }
  }
  const yNota = (G, i) => G.campo.y + G.campo.h - (i + 0.5) * (G.campo.h / NOTE.length)
  const xPunto = (G, x) => G.lx + clamp(x) * (G.rx - 1.6 * G.u - G.lx)
  const yPunto = (G, v) => G.campo.y + G.campo.h * (1 - clamp(v)) * 0.92 + G.campo.h * 0.04

  function costruisci() {
    W = m.w; H = m.h; D = m.dpr
    const G = geometria(W, H)
    const u = G.u
    const c = G.campo
    const fondo = kit.strato(W, H, D, (g) => {
      g.fillStyle = m.c2
      g.fillRect(0, 0, W, H)
      const r = g.createRadialGradient(W * 0.05, 0, 0, W * 0.05, 0, W * 0.7)
      r.addColorStop(0, 'rgba(204,255,0,.2)'); r.addColorStop(1, 'rgba(204,255,0,0)')
      g.fillStyle = r
      g.fillRect(0, 0, W, H)
      // i punti della copertina di prima
      g.fillStyle = 'rgba(204,255,0,.06)'
      const p = 6.8 * u
      for (let y = p / 2; y < c.y; y += p) for (let x = p / 2; x < W; x += p) { g.beginPath(); g.arc(x, y, 1.2 * u, 0, TAU); g.fill() }
      // la cornice di carta del campo, con l'ombra
      const b = Math.max(2, 1.25 * u)
      g.save()
      g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 3.2 * u; g.shadowOffsetY = 1.3 * u
      g.fillStyle = FOGLIETTO
      g.fillRect(c.x - b, c.y - b, c.w + 2 * b, c.h + 2.3 * b)
      g.restore()
      g.fillStyle = CAMPO
      g.fillRect(c.x, c.y, c.w, c.h)
      // le righe delle note e i nomi (ogni do più chiaro, come nell'app)
      g.font = `400 ${Math.max(5, 1.75 * u)}px "Special Elite"`
      g.textBaseline = 'middle'
      for (let i = 0; i < NOTE.length; i++) {
        const y = yNota(G, i)
        g.strokeStyle = i % 5 === 0 ? 'rgba(204,255,0,.2)' : 'rgba(204,255,0,.075)'
        g.lineWidth = Math.max(0.6, 0.16 * u)
        g.beginPath(); g.moveTo(G.lx, y); g.lineTo(G.rx - 1.2 * u, y); g.stroke()
        if (W > 220 || i % 5 === 0) {
          g.fillStyle = i % 5 === 0 ? 'rgba(204,255,0,.75)' : 'rgba(204,255,0,.35)'
          g.fillText(nomeNota(NOTE[i]), c.x + 1.6 * u, y)
        }
      }
      // la colonna del volume, vuota
      g.strokeStyle = 'rgba(204,255,0,.35)'
      g.lineWidth = Math.max(0.6, 0.18 * u)
      g.fillStyle = 'rgba(0,0,0,.35)'
      g.fillRect(G.rx, c.y + 1.6 * u, 2.6 * u, c.h - 3.2 * u)
      g.strokeRect(G.rx, c.y + 1.6 * u, 2.6 * u, c.h - 3.2 * u)
      // il nastro
      kit.nastro(g, c.x + 1 * u, c.y - 0.6 * u, 11 * u, 3.3 * u, -0.66)
      kit.nastro(g, c.x + c.w - 1 * u, c.y - 0.6 * u, 11 * u, 3.3 * u, 0.66)
    })
    // il vetro sopra il campo: ombra dentro e un riflesso storto
    const vetro = kit.strato(W, H, D, (g) => {
      const v = g.createRadialGradient(c.x + c.w / 2, c.y + c.h / 2, c.h * 0.3, c.x + c.w / 2, c.y + c.h / 2, c.w * 0.62)
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)')
      g.fillStyle = v
      g.fillRect(c.x, c.y, c.w, c.h)
      g.save()
      g.beginPath(); g.rect(c.x, c.y, c.w, c.h); g.clip()
      const r = g.createLinearGradient(c.x, c.y, c.x + c.w * 0.5, c.y + c.h)
      r.addColorStop(0, 'rgba(255,255,255,.07)'); r.addColorStop(0.35, 'rgba(255,255,255,0)')
      g.fillStyle = r
      g.fillRect(c.x, c.y, c.w, c.h)
      g.fillStyle = 'rgba(0,0,0,.14)'
      for (let y = c.y; y < c.y + c.h; y += Math.max(2, 0.7 * u)) g.fillRect(c.x, y, c.w, Math.max(0.5, 0.25 * u))
      g.restore()
    })
    // la lettura: il riquadro col bordo lime
    const lettura = kit.strato(W, H, D, (g) => {
      const l = G.let
      g.save()
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 2 * u; g.shadowOffsetY = 0.8 * u
      g.fillStyle = 'rgba(16,18,15,.92)'
      g.fillRect(l.x, l.y, l.w, l.h)
      g.restore()
      g.strokeStyle = 'rgba(204,255,0,.32)'
      g.lineWidth = Math.max(0.8, 0.22 * u)
      g.strokeRect(l.x, l.y, l.w, l.h)
    })
    // il titolo: Modern, lime; il bagliore a parte (lo shadowBlur una volta sola)
    const titolo = m.titolo || 'Theremin'
    let ts = 11.5 * u
    const misura = kit.strato(4, 4, 1, (g) => { g.font = `500 ${ts}px "Modern"`; ts *= Math.min(1, (53 * u) / g.measureText(titolo).width) })
    void misura
    const ty = 4.6 * u + ts * 0.86
    const scrittaT = kit.strato(W, H, D, (g) => {
      g.font = `500 ${ts}px "Modern"`
      g.textBaseline = 'alphabetic'
      g.fillStyle = 'rgba(0,0,0,.55)'
      g.fillText(titolo, 5 * u, ty + 0.7 * u)
      g.fillStyle = LIME
      g.fillText(titolo, 5 * u, ty)
      if (W > 260) {
        g.font = `400 ${2.15 * u}px "Special Elite"`
        g.fillStyle = 'rgba(204,255,0,.6)'
        g.fillText('a destra acuto · in alto forte', 5.2 * u, ty + 3.9 * u)
      }
    })
    const alone = kit.strato(W, H, D, (g) => {
      g.font = `500 ${ts}px "Modern"`
      g.shadowColor = 'rgba(204,255,0,.95)'
      g.shadowBlur = 3.4 * u
      g.fillStyle = 'rgba(204,255,0,.5)'
      g.fillText(titolo, 5 * u, ty)
    })
    // la mano (un guanto da cartone, col contorno nero) e la sua ombra sfocata
    const S = 0.8 * u
    const mw = 22 * S, mh = 26 * S
    const manoS = kit.strato(mw, mh, D, (g) => disegnaMano(g, S, 4 * S, 2.5 * S, false))
    const ombraS = kit.strato(mw + 8 * S, mh + 8 * S, D, (g) => {
      g.shadowColor = 'rgba(0,0,0,.75)'
      g.shadowBlur = 2.2 * S * D
      g.shadowOffsetX = 400 * D
      g.translate(-400, 0)
      disegnaMano(g, S, 8 * S, 6.5 * S, true)
    })
    const vign = kit.strato(W, H, D, (g) => kit.vignetta(g, W, H, 0.4))
    L = { G, fondo, vetro, lettura, scrittaT, alone, manoS, ombraS, mw, mh, S, vign }
  }

  // il guanto che indica: la punta del dito è in (ox, oy), la mano scende in basso a destra
  function disegnaMano(g, S, ox, oy, ombra) {
    g.save()
    g.translate(ox, oy)
    g.rotate(-0.5)
    g.scale(S, S)
    const forma = () => {
      g.beginPath()
      // l'indice
      g.moveTo(-1.35, 1.4)
      g.arc(0, 1.4, 1.35, Math.PI, 0)
      g.lineTo(1.35, 8)
      // le nocche delle dita piegate
      g.arc(2.75, 8.2, 1.4, Math.PI, 0)
      g.arc(5.4, 8.6, 1.3, Math.PI, 0.1)
      g.arc(7.6, 9.4, 1.15, Math.PI * 1.05, 0.25)
      // il palmo, il polso
      g.quadraticCurveTo(9.3, 13, 8, 16)
      g.lineTo(7.8, 18.5)
      g.lineTo(0.4, 18.5)
      g.lineTo(0.2, 16)
      // il pollice
      g.quadraticCurveTo(-3.4, 13.6, -3.7, 10.4)
      g.quadraticCurveTo(-3.6, 9.2, -2.4, 9.4)
      g.quadraticCurveTo(-1.3, 10.4, -1.35, 11)
      g.closePath()
    }
    forma()
    g.fillStyle = ombra ? '#000' : FOGLIETTO
    g.fill()
    if (!ombra) {
      // il chiaroscuro del guanto
      const r = g.createLinearGradient(-3, 0, 9, 18)
      r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(1, 'rgba(120,110,80,.28)')
      g.fillStyle = r
      g.fill()
      g.lineJoin = 'round'
      g.strokeStyle = INK
      g.lineWidth = 0.55
      g.stroke()
      // le pieghe delle dita e il polsino
      g.lineWidth = 0.4
      g.beginPath()
      g.moveTo(1.35, 8); g.quadraticCurveTo(1.8, 10, 1.4, 11.4)
      g.moveTo(4.1, 8.3); g.quadraticCurveTo(4.3, 9.8, 3.9, 10.8)
      g.moveTo(6.6, 9); g.quadraticCurveTo(6.8, 10.2, 6.4, 11)
      g.moveTo(-0.2, 3.6); g.lineTo(0.6, 3.6)
      g.stroke()
      g.fillStyle = INK
      g.fillRect(0.1, 16.2, 7.9, 2.6)
      g.fillStyle = 'rgba(255,255,255,.18)'
      g.fillRect(0.4, 16.5, 7.3, 0.5)
    }
    g.restore()
  }

  return {
    titolo: false,
    fermo: 3,
    frame(t, dt) {
      if (!L || W !== m.w || H !== m.h || D !== m.dpr) costruisci()
      const g = m.g
      const { G } = L
      const u = G.u
      const c = G.campo
      su = m.su
      tm += dt * (1 + su * 0.25)
      const M = mano(tm)
      const vol = clamp(M.v + su * 0.12)
      const idx = indice(M.x)
      const nota = NOTE[idx]
      const f = freqMidi(nota)
      // le corde: quella della nota suona; le altre si spengono piano (nel glissando suonano tutte, una per volta)
      for (let i = 0; i < corde.length; i++) {
        if (i === idx) corde[i] = Math.max(corde[i], vol)
        else corde[i] *= Math.exp(-dt * (M.wow > 0 ? 1.4 : 3))
      }
      // il lampo in cima al glissando
      const cima = M.wow >= 0.72 && M.wow < 1 ? 1 - (M.wow - 0.72) / 0.28 : M.wow >= 1 ? 0 : 0
      const lampo = M.wow >= 0.72 ? Math.exp(-(M.wow - 0.72) * 3.2) : 0

      g.drawImage(L.fondo, 0, 0, W, H)
      void cima

      // ── il titolo ──
      g.save()
      g.globalAlpha = clamp(0.25 + vol * 0.4 + su * 0.25 + lampo * 0.5)
      g.drawImage(L.alone, 0, 0, W, H)
      g.restore()
      g.drawImage(L.scrittaT, 0, 0, W, H)

      // ── il campo ──
      g.save()
      g.beginPath(); g.rect(c.x, c.y, c.w, c.h); g.clip()
      if (lampo > 0.01 || su > 0.01) {
        g.fillStyle = `rgba(204,255,0,${0.1 * lampo + 0.03 * su})`
        g.fillRect(c.x, c.y, c.w, c.h)
      }
      // le corde che suonano: un'onda stazionaria sulla riga della nota
      for (let i = 0; i < NOTE.length; i++) {
        const a = corde[i]
        if (a < 0.02) continue
        const y = yNota(G, i)
        const nodi = 2 + i * 0.5
        const amp = a * 0.9 * u * Math.sin(t * (30 + i * 4))
        g.strokeStyle = `rgba(204,255,0,${0.12 + 0.6 * a})`
        g.lineWidth = Math.max(0.8, (0.2 + 0.25 * a) * u)
        g.beginPath()
        const n = 36
        for (let j = 0; j <= n; j++) {
          const k = j / n
          const x = lerp(G.lx, G.rx - 1.2 * u, k)
          const yy = y + amp * Math.sin(Math.PI * k * nodi)
          j ? g.lineTo(x, yy) : g.moveTo(x, yy)
        }
        g.stroke()
        // il nome della nota si accende
        g.font = `400 ${Math.max(5, 1.75 * u)}px "Special Elite"`
        g.textBaseline = 'middle'
        g.fillStyle = `rgba(230,255,140,${a})`
        g.fillText(nomeNota(NOTE[i]), c.x + 1.6 * u, y)
      }
      // la posizione della mano sul campo
      const px = xPunto(G, M.x), py = yPunto(G, vol)
      // l'onda che parte dal dito: lunga quanto la nota, alta quanto il volume
      const lam = 7.5 * u * (262 / f)
      const A = vol * (1.6 + su * 0.8) * u + lampo * 1.5 * u
      // lo «spazio» (il riverbero dell'app): le onde di un attimo fa, più deboli; col mouse sopra si sentono di più
      for (const [ritardo, forza] of [[0.5, 0.1], [0.25, 0.18]]) {
        const Me = mano(tm - ritardo)
        const ve = clamp(Me.v + su * 0.12)
        const pxe = xPunto(G, Me.x), pye = yPunto(G, ve)
        const fe = freqMidi(NOTE[indice(Me.x)])
        const Ae = ve * (1.6 + su * 0.8) * u
        g.strokeStyle = `rgba(204,255,0,${forza * (0.6 + su * 1.2)})`
        g.lineWidth = Math.max(0.6, 0.22 * u)
        g.beginPath()
        const n = 48
        for (let j = 0; j <= n; j++) {
          const x = lerp(G.lx, G.rx - 1.2 * u, j / n)
          const d = Math.abs(x - pxe)
          const inv = (1 - Math.exp(-d / (2.5 * u))) * Math.exp(-d / (40 * u))
          const yy = pye + Ae * Math.sin((d / (7.5 * u * (262 / fe))) * TAU - (tm - ritardo) * 11) * inv
          j ? g.lineTo(x, yy) : g.moveTo(x, yy)
        }
        g.stroke()
      }
      for (const passata of [[3.2, 0.1], [1.4, 0.3], [0.45, 1]]) {
        g.strokeStyle = `rgba(214,255,60,${passata[1] * (0.55 + 0.45 * vol)})`
        g.lineWidth = Math.max(passata[0] > 1 ? 1.5 : 0.8, passata[0] * u * 0.5)
        g.beginPath()
        const n = Math.max(60, Math.round((G.rx - G.lx) / (0.7 * u)))
        for (let j = 0; j <= n; j++) {
          const x = lerp(G.lx, G.rx - 1.2 * u, j / n)
          const d = Math.abs(x - px)
          const inv = (1 - Math.exp(-d / (2.5 * u))) * Math.exp(-d / (34 * u))
          const yy = py + A * Math.sin((d / lam) * TAU - tm * 11) * inv
          j ? g.lineTo(x, yy) : g.moveTo(x, yy)
        }
        g.stroke()
      }
      // la riga verticale e la scia (le posizioni di prima, che svaniscono)
      g.strokeStyle = 'rgba(204,255,0,.35)'
      g.lineWidth = Math.max(0.6, 0.18 * u)
      g.beginPath(); g.moveTo(px, c.y); g.lineTo(px, c.y + c.h); g.stroke()
      const lunga = 22 + Math.round(su * 14)
      for (let j = lunga; j >= 1; j--) {
        const Mj = mano(tm - j * 0.045)
        const vita = 1 - j / (lunga + 1)
        const x = xPunto(G, Mj.x), y = yPunto(G, clamp(Mj.v + su * 0.12))
        g.fillStyle = `rgba(204,255,0,${0.2 * vita})`
        g.beginPath(); g.arc(x, y, (1.6 * vita + 0.25) * u, 0, TAU); g.fill()
      }
      // il punto
      g.fillStyle = 'rgba(204,255,0,.16)'
      g.beginPath(); g.arc(px, py, 2.9 * u * (1 + 0.2 * Math.sin(t * 9)), 0, TAU); g.fill()
      g.fillStyle = 'rgba(204,255,0,.32)'
      g.beginPath(); g.arc(px, py, 1.9 * u, 0, TAU); g.fill()
      g.fillStyle = '#f2ffc4'
      g.beginPath(); g.arc(px, py, 1.15 * u, 0, TAU); g.fill()
      // le onde d'urto del wow, dal dito
      if (M.wow >= 0.72 && M.wow < 1.6) {
        for (let r = 0; r < 3; r++) {
          const k = clamp((M.wow - 0.72) * 1.6 - r * 0.18)
          if (k <= 0 || k >= 1) continue
          g.strokeStyle = `rgba(204,255,0,${0.6 * (1 - k)})`
          g.lineWidth = Math.max(1, 1.1 * u * (1 - k))
          g.beginPath(); g.arc(px, py, 2 * u + ease.out(k) * 60 * u, 0, TAU); g.stroke()
        }
      }
      // la colonna del volume
      const vh = (c.h - 3.2 * u) * vol
      const vy0 = c.y + c.h - 1.6 * u
      const vg = g.createLinearGradient(0, vy0 - (c.h - 3.2 * u), 0, vy0)
      vg.addColorStop(0, LIME); vg.addColorStop(1, '#5a7a00')
      g.fillStyle = vg
      g.fillRect(G.rx, vy0 - vh, 2.6 * u, vh)
      g.fillStyle = `rgba(204,255,0,${0.12 + 0.2 * vol})`
      g.fillRect(G.rx - 1 * u, vy0 - vh - 0.4 * u, 4.6 * u, 0.8 * u)
      if (W > 240) {
        g.font = `400 ${1.7 * u}px "Special Elite"`
        g.fillStyle = LIME
        g.textAlign = 'right'
        g.textBaseline = 'middle'
        g.fillText(`${Math.round(vol * 100)}%`, G.rx - 0.8 * u, clamp(vy0 - vh, c.y + 2.5 * u, vy0 - 1 * u))
        g.textAlign = 'left'
      }
      g.drawImage(L.vetro, 0, 0, W, H)
      g.restore()

      // ── la mano sopra il vetro: l'ombra si stacca quando la mano è lontana ──
      const vicino = su * 0.7
      const alto = 1 - vicino
      const sc = 1 + vicino * 0.1 + lampo * 0.06
      const S = L.S
      g.save()
      g.globalAlpha = 0.32 + vicino * 0.25
      g.drawImage(L.ombraS, px - 8 * S * sc + (3 + 3 * alto) * u, py - 6.5 * S * sc + (2.5 + 3 * alto) * u, (L.mw + 8 * S) * sc, (L.mh + 8 * S) * sc)
      g.restore()
      const dondola = Math.sin(tm * 1.7) * 0.04 + smooth(0.55, 1, M.x) * 0.6
      kit.con(g, px, py, dondola, sc, () => {
        g.drawImage(L.manoS, -4 * S, -2.5 * S, L.mw, L.mh)
      })
      // la punta del dito si accende
      g.fillStyle = `rgba(204,255,0,${0.22 + 0.3 * vol})`
      g.beginPath(); g.arc(px, py, 0.9 * u, 0, TAU); g.fill()

      // ── la lettura e il tasto ──
      const l = G.let
      const pop = 1 + lampo * 0.12
      kit.con(g, l.x + l.w / 2, l.y + l.h / 2, 0, pop, () => {
        g.translate(-(l.x + l.w / 2), -(l.y + l.h / 2))
        g.drawImage(L.lettura, 0, 0, W, H)
        const ns = Math.max(9, 7.6 * u)
        g.font = `400 ${ns}px "Anton"`
        g.textBaseline = 'alphabetic'
        const testo = nomeNota(nota)
        g.fillStyle = `rgba(204,255,0,${0.18 + lampo * 0.3})`
        g.fillText(testo, l.x + 2 * u, l.y + l.h - 2.2 * u + 0.4 * u)
        g.fillStyle = lampo > 0.3 ? '#f2ffc4' : LIME
        g.fillText(testo, l.x + 2 * u, l.y + l.h - 2.2 * u)
        const nw = g.measureText(testo).width
        if (W > 200) {
          g.font = `400 ${Math.max(5, 2.2 * u)}px "Special Elite"`
          g.fillStyle = '#93a857'
          g.fillText(hz(f), l.x + 3.2 * u + nw, l.y + l.h - 2.6 * u)
          // la scala e il timbro scelti nei foglietti dell'app
          g.font = `400 ${Math.max(5, 1.6 * u)}px "Special Elite"`
          g.fillStyle = 'rgba(204,255,0,.45)'
          g.textAlign = 'right'
          g.fillText('pentatonica · sin', l.x + l.w - 1.5 * u, l.y + 2.9 * u)
          g.textAlign = 'left'
        }
      })
      // il tasto «suona», verde perché suona, storto
      const bs = Math.max(6, 2.9 * u)
      g.font = `400 ${bs}px "Anton"`
      const bw = g.measureText('ferma').width + 3 * u
      kit.con(g, l.x + bw / 2 + 0.4 * u, l.y + l.h + 2.6 * u, -0.04, 1 + lampo * 0.08, () => {
        g.fillStyle = 'rgba(0,0,0,.35)'
        g.fillRect(-bw / 2 + 0.5 * u, -bs * 0.62 + 0.5 * u, bw, bs * 1.22)
        g.fillStyle = '#7cc400'
        g.fillRect(-bw / 2, -bs * 0.62, bw, bs * 1.22)
        g.fillStyle = CAMPO
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText('ferma', 0, bs * 0.04)
        g.textAlign = 'left'
      })
      // la spia accanto: «strumento» acceso
      const lx = l.x + bw + 2.6 * u, ly = l.y + l.h + 2.6 * u
      g.fillStyle = 'rgba(35,134,74,.3)'
      g.beginPath(); g.arc(lx, ly, 1.5 * u, 0, TAU); g.fill()
      g.fillStyle = '#3fd27a'
      g.beginPath(); g.arc(lx, ly, 0.8 * u, 0, TAU); g.fill()

      g.save()
      g.globalAlpha = 1 - su * 0.4
      g.drawImage(L.vign, 0, 0, W, H)
      g.restore()
      kit.granella(g, W, H, 0.05, t)
      void fract
    },
  }
}
