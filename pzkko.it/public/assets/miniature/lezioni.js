// miniature/lezioni.js — la miniatura viva di pzk$meeting (27.11.2026).
// Sullo sfondo, fuori fuoco, la pagina vera dello strumento (la cattura: la saracinesca coi fogli). Davanti, la lezione
// che si registra: la lavagna dove il gesso scrive il limite della lezione di esempio (∞/∞, viene un mezzo) e ogni tanto
// il lampo della foto per l'OCR; la barra vera (art/lezioni/barra.webp) col tempo di registrazione che scorre, il livello
// della voce, gli scatti che salgono e la frase che Whisper trascrive parola per parola; in basso gli appunti
// (art/lezioni/appunti.webp, la pagina prodotta su una lezione inventata) che si scrivono man mano.
// Il momento grosso: «fine lezione», la pagina degli appunti vola al centro, il nastro la attacca e arriva il timbro;
// poi il cancellino pulisce la lavagna e si ricomincia.
// Col mouse sopra: si scalda la luce, il gesso va più svelto e gli appunti salgono a farsi leggere.

const VW = 480, VH = 270
const NERO = '#141414', ROSSO = '#b3121f', GIALLO = '#ffd60a', GESSO = 'rgba(244,242,232,.94)'
const FA = 'Anton', MK = 'Permanent Marker', SE = 'Special Elite'
const LEZIONE = 9.6, FINE = 4.2, PULISCI = 1.4, CICLO = LEZIONE + FINE + PULISCI
const FOTO = [2.6, 5.4, 8.2]
// le due frasi che Whisper trascrive (quella della barra vera, e il «detto a voce» degli appunti di esempio)
const FRASI = [
  [0.6, 'adesso raccogliamo il termine di', 'grado più alto, sopra e sotto'],
  [5.2, 'quando dite che 1/x² va a zero', 'state già sostituendo'],
]
// lo schermo con la lavagna
const SX = 214, SY = 14, SW = 248, SH = 136
// la barra vera: dove sta, e quanto è grande (l'immagine è 287 × 138)
const BX = 22, BY = 146, BS = 0.8
/** un'immagine del sito, pronta appena caricata (kit.img aspetta anche decode(), che nella foto senza finestra arriva solo alla fine) */
const carica = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src })

export default async function crea(m) {
  const { kit } = m
  const [sfondo, barra, appunti, bianco] = await Promise.all([m.cattura || '/art/muro.webp', '/art/lezioni/barra.webp', '/art/lezioni/appunti.webp', '/art/carta/bianco.webp'].map(carica))
  if (!barra || !appunti) throw new Error('mancano i pezzi della lezione')
  await Promise.race([Promise.all([FA, MK, SE].map((f) => kit.font(f))), new Promise((ok) => setTimeout(ok, 6000))])

  let k = 1, ox = 0, oy = 0, fondo = null, testa = null, T = 0, ultimo = -1, anticipo = 0

  function rifai(w, h) {
    k = Math.min(w / VW, h / VH); ox = (w - VW * k) / 2; oy = (h - VH * k) / 2
    // dietro: la pagina vera, sfocata e scurita, con la luce gialla della copertina
    fondo = kit.strato(w, h, m.dpr, (g) => {
      g.fillStyle = '#3d3a36'; g.fillRect(0, 0, w, h)
      if (sfondo) {
        g.filter = `blur(${Math.max(1, 2.2 * k)}px) saturate(.8)`
        const sc = Math.max(w / sfondo.width, h / sfondo.height) * 1.12
        g.drawImage(sfondo, (w - sfondo.width * sc) / 2, (h - sfondo.height * sc) / 2 + 6 * k, sfondo.width * sc, sfondo.height * sc)
        g.filter = 'none'
      }
      g.fillStyle = 'rgba(20,16,10,.5)'; g.fillRect(0, 0, w, h)
      const r = g.createRadialGradient(w * 0.62, h * 0.35, 0, w * 0.62, h * 0.35, w * 0.7)
      r.addColorStop(0, 'rgba(255,214,10,.22)'); r.addColorStop(1, 'rgba(255,214,10,0)')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
    })
    // il foglio del titolo: carta bianca, il nome in Anton che esce dal foglio come sulla pagina vera
    testa = kit.strato(VW * k, 130 * k, m.dpr, (g) => {
      g.scale(k, k)
      kit.con(g, 104, 60, -0.03, 1, () => {
        g.save()
        g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 4
        if (bianco) g.drawImage(bianco, 70, 90, 420, 560, -86, -46, 172, 92)
        else { g.fillStyle = '#f2f1ec'; g.fillRect(-86, -46, 172, 92) }
        g.restore()
        kit.scritta(g, 'pzk$meeting', -76, -8, { font: FA, size: 33, color: NERO })
        kit.scritta(g, 'registra la lezione, la trascrive', -74, 10, { font: SE, size: 8.2, color: '#222' })
        kit.scritta(g, 'parola per parola e ti dà', -74, 20, { font: SE, size: 8.2, color: '#222' })
        kit.scritta(g, 'gli appunti in pdf.', -74, 30, { font: SE, size: 8.2, color: '#222' })
        kit.scritta(g, 'gratis, per windows', 0, 41, { font: MK, size: 8, color: '#1446a0', rot: -0.03 })
        kit.nastro(g, -84, -42, 34, 11, -0.6)
        kit.nastro(g, 86, 40, 34, 11, -0.65)
      })
    })
  }

  // ── la lavagna: il gesso scrive il limite, pezzo per pezzo ──
  // [inizio, durata, disegna(g, k 0→1) nelle coordinate della lavagna]
  const PEZZI = []
  const testo = (s, x, y, size, t0, d) => PEZZI.push([t0, d, (g) => kit.scritta(g, s, x, y, { font: MK, size, color: GESSO }), x, y - size * 0.7, size, s.length * size * 0.55])
  const riga = (x1, y1, x2, t0, d) => PEZZI.push([t0, d, (g) => { g.strokeStyle = GESSO; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y1 + 0.8); g.stroke() }, x1, y1 - 3, 6, x2 - x1])
  testo('lim', 12, 52, 17, 0.5, 0.5)
  testo('x→+∞', 9, 66, 8.5, 1.0, 0.5)
  testo('x³ + x', 56, 40, 15, 1.6, 0.8)
  riga(50, 48, 116, 2.4, 0.35)
  testo('2x³ − 1', 52, 68, 15, 2.8, 0.9)
  testo('=', 124, 56, 17, 3.8, 0.25)
  testo('1', 148, 43, 15, 4.2, 0.25)
  riga(143, 49, 160, 4.5, 0.2)
  testo('2', 147, 69, 15, 4.75, 0.3)
  testo('F.I. ∞/∞: raccolgo x³ sopra e sotto', 10, 96, 9, 5.6, 2.2)
  const GIRO = [8.1, 0.9] // il cerchio intorno a 1/2

  function lavagna(g, u, pulisci) {
    const bx = SX + 7, by = SY + 18, bw = SW - 14, bh = SH - 25
    g.save()
    g.beginPath(); g.rect(bx, by, bw, bh); g.clip()
    const lg = g.createLinearGradient(bx, by, bx + bw, by + bh)
    lg.addColorStop(0, '#24453a'); lg.addColorStop(1, '#173027')
    g.fillStyle = lg; g.fillRect(bx, by, bw, bh)
    // gli aloni del gesso vecchio, sfumati
    for (const [x, y, r] of [[70, 30, 46], [170, 85, 40]]) {
      const al = g.createRadialGradient(bx + x, by + y, 0, bx + x, by + y, r)
      al.addColorStop(0, 'rgba(255,255,255,.06)'); al.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = al; g.fillRect(bx + x - r, by + y - r, r * 2, r * 2)
    }
    g.translate(bx, by)
    let testaX = null, testaY = null
    for (const [t0, d, fn, x, y, size, larg] of PEZZI) {
      const q = kit.clamp((u - t0) / d)
      if (q <= 0) continue
      g.save()
      if (q < 1) { g.beginPath(); g.rect(x - 4, y - size, larg * q + 4, size * 2.2); g.clip(); testaX = x + larg * q; testaY = y + size * 0.3 }
      fn(g)
      g.restore()
    }
    const qc = kit.clamp((u - GIRO[0]) / GIRO[1])
    if (qc > 0) {
      g.strokeStyle = 'rgba(255,214,10,.9)'; g.lineWidth = 1.8; g.lineCap = 'round'
      g.beginPath(); g.ellipse(153, 55, 15, 20, -0.2, -2.2, -2.2 + kit.TAU * 1.08 * kit.ease.inOut(qc)); g.stroke()
      if (qc < 1) { const a = -2.2 + kit.TAU * 1.08 * kit.ease.inOut(qc); testaX = 153 + Math.cos(a) * 15; testaY = 55 + Math.sin(a) * 20 }
    }
    // il gessetto che scrive, con la polvere
    if (testaX != null && u < LEZIONE) {
      kit.con(g, testaX + 2, testaY + 1, -0.6, 1, () => { g.fillStyle = qc > 0 && qc < 1 ? '#ffe680' : '#f4f2e8'; g.fillRect(-1.6, -9, 3.2, 10); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(1.6, -9, 1, 10) })
      const r = kit.rng(Math.floor(u * 20))
      g.fillStyle = 'rgba(255,255,255,.5)'
      for (let i = 0; i < 5; i++) g.fillRect(testaX + (r() - 0.3) * 8, testaY + r() * 10, 0.9, 0.9)
    }
    // il cancellino pulisce a strisciate
    if (pulisci > 0) {
      const q = kit.clamp(pulisci / 1.1)
      const ex = -30 + q * (bw + 60), ey = 20 + Math.sin(q * Math.PI * 5) * 30 + 30
      g.fillStyle = '#1d3a30'
      g.fillRect(-10, -10, Math.max(0, ex - 6), bh + 20)
      g.fillStyle = 'rgba(255,255,255,.06)'
      g.fillRect(ex - 40, 0, 34, bh)
      kit.con(g, ex, ey, 0.2, 1, () => {
        g.fillStyle = '#7a5a3a'; g.fillRect(-9, -16, 18, 32)
        g.fillStyle = '#d8d4c8'; g.fillRect(-9, -16, 5, 32)
      })
    }
    g.restore()
  }

  function schermo(g, u, lampo, rec) {
    // la finestra della lezione: cornice scura, la riga in alto col pallino rosso
    g.fillStyle = 'rgba(0,0,0,.35)'; kit.tondo(g, SX + 3, SY + 4, SW, SH, 6); g.fill()
    g.fillStyle = '#1b1b1d'; kit.tondo(g, SX, SY, SW, SH, 6); g.fill()
    g.fillStyle = '#2a2a2e'; kit.tondo(g, SX, SY, SW, 14, 6); g.fill(); g.fillRect(SX, SY + 8, SW, 6)
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(SX + 9 + i * 8, SY + 7, 2.2, 0, kit.TAU); g.fill() })
    kit.scritta(g, 'lezione di analisi · in registrazione', SX + 38, SY + 10, { font: SE, size: 6.5, color: '#c9c7c0' })
    const acceso = 0.55 + 0.45 * Math.round(kit.onda(rec, 1.2))
    g.fillStyle = `rgba(230,40,40,${acceso})`; g.beginPath(); g.arc(SX + SW - 10, SY + 7, 3, 0, kit.TAU); g.fill()
    lavagna(g, u, u > LEZIONE + FINE ? u - LEZIONE - FINE : 0)
    // il lampo della foto alla lavagna
    if (lampo > 0) { g.fillStyle = `rgba(255,255,255,${0.75 * lampo})`; g.fillRect(SX + 7, SY + 18, SW - 14, SH - 25) }
    // il riflesso sul vetro
    const rg = g.createLinearGradient(SX, SY, SX + SW * 0.6, SY + SH)
    rg.addColorStop(0, 'rgba(255,255,255,.07)'); rg.addColorStop(0.5, 'rgba(255,255,255,0)')
    g.fillStyle = rg; g.fillRect(SX + 7, SY + 18, SW - 14, SH - 25)
  }

  // ── la barra vera, coi pezzi che si muovono disegnati sopra ──
  function barraViva(g, u, rec, scatti, lampo, su) {
    kit.con(g, BX, BY, -0.025, 1, () => {
      g.save()
      g.scale(BS, BS)
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(6, 8, 262, 136)
      g.drawImage(barra, 0, 0)
      const carta = 'rgb(234,233,236)'
      // il tempo di registrazione
      g.fillStyle = carta; g.fillRect(70, 15, 44, 24)
      const mm = Math.floor(rec / 60), ss = Math.floor(rec % 60)
      kit.scritta(g, `${mm}:${String(ss).padStart(2, '0')}`, 72, 35, { font: FA, size: 20.5, color: NERO })
      // il pallino rosso che respira
      const p = 0.5 + 0.5 * Math.sin(u * 5)
      g.fillStyle = `rgba(255,60,40,${0.25 * p + 0.25 * su})`; g.beginPath(); g.arc(29, 28, 7 + 3 * p + 3 * su, 0, kit.TAU); g.fill()
      // il livello della voce
      g.fillStyle = carta; g.fillRect(25, 40, 62, 16)
      const livello = Math.floor(3 + kit.rumore(u * 7, 3) * 6.5)
      for (let i = 0; i < 9; i++) { g.fillStyle = i < livello ? NERO : '#cfccc6'; g.fillRect(27 + i * 6.2, 54 - 3 - i * 0.9, 4.2, 3 + i * 0.9) }
      // gli scatti
      g.fillStyle = carta; g.fillRect(174, 53, 56, 13)
      kit.scritta(g, `${scatti} scatti`, 176, 63, { font: SE, size: 10, color: '#222' })
      if (lampo > 0) { g.fillStyle = `rgba(255,255,255,${0.9 * lampo})`; g.fillRect(172, 17, 58, 34) }
      // la frase che Whisper trascrive
      g.fillStyle = carta; g.fillRect(25, 95, 198, 32)
      const [t0, a, b] = u >= FRASI[1][0] ? FRASI[1] : FRASI[0]
      const parole = [...a.split(' ').map((p) => [0, p]), ...b.split(' ').map((p) => [1, p])]
      const quante = Math.floor((u - t0) / 0.26)
      const righe = ['', '']
      parole.slice(0, Math.max(0, quante)).forEach(([r, p]) => { righe[r] += (righe[r] ? ' ' : '') + p })
      const ap = quante > 0 ? '«' : ''
      kit.scritta(g, ap + righe[0], 27, 108, { font: MK, size: 9.6, color: ROSSO })
      kit.scritta(g, righe[1] + (quante >= parole.length ? '»' : ''), 27, 121, { font: MK, size: 9.6, color: ROSSO })
      // il cursore della trascrizione
      if (quante < parole.length && quante >= 0 && Math.floor(u * 3) % 2) {
        g.font = `400 9.6px "${MK}"`
        const r = righe[1] ? 1 : 0, x = 27 + g.measureText((r ? '' : ap) + righe[r]).width + 2
        g.fillStyle = ROSSO; g.fillRect(x, r ? 112 : 99, 1.4, 10)
      }
      g.restore()
    })
  }

  function frame(t, dt) {
    const { g, w, h, su } = m
    // il tempo: quello del motore (stesso t, stessa immagine) più l'anticipo preso col mouse sopra
    if (t < ultimo) anticipo = 0
    ultimo = t; anticipo += (dt || 0) * 0.5 * su; T = t + anticipo
    const u = T % CICLO
    const giro = Math.floor(T / CICLO)
    const rec = 52 * 60 + 18 + Math.floor(T)
    let scatti = 214 + giro * 3, lampo = 0
    for (const f of FOTO) { if (u >= f) scatti++; const d = u - f; if (d >= 0 && d < 0.35) lampo = Math.max(lampo, 1 - d / 0.35) }

    kit.metti(g, fondo, 0, 0, w, h)
    g.save()
    g.translate(ox, oy); g.scale(k, k)
    // la luce gialla che passa sulla saracinesca (più calda col mouse sopra)
    const lx = 80 + Math.sin(T * 0.35) * 160
    const lg = g.createRadialGradient(lx, 120, 0, lx, 120, 260)
    lg.addColorStop(0, `rgba(255,214,10,${0.1 + 0.12 * su})`); lg.addColorStop(1, 'rgba(255,214,10,0)')
    g.fillStyle = lg; g.fillRect(-40, -40, VW + 80, VH + 80)

    // gli strati con un po' di parallasse
    const px = Math.sin(T * 0.3) * 2, py = Math.cos(T * 0.24) * 1.5
    g.save(); g.translate(px * 0.6, py * 0.6)
    schermo(g, u, lampo, T)
    g.restore()

    // gli appunti: in basso a destra si scrivono man mano; a fine lezione volano al centro
    const fq = kit.clamp((u - LEZIONE) / 0.55), torna = kit.clamp((u - LEZIONE - FINE + 0.5) / 0.55)
    const vola = kit.ease.outBack(fq) * (1 - kit.ease.inOut(torna))
    const pw = kit.lerp(150, 172, vola), ph = pw * (appunti.height / appunti.width)
    const cx = kit.lerp(382, 300, vola), cy = kit.lerp(242 - 40 * su, 140, vola) + py
    const rot = kit.lerp(0.07, -0.035, vola)
    const scritto = u >= LEZIONE ? 1 : kit.clamp(u / LEZIONE) * 0.92 + 0.08
    // la foto della lavagna vola dalla lavagna agli appunti
    g.save(); g.translate(px, py)
    barraViva(g, u, rec, scatti, lampo, su)
    g.restore()
    kit.con(g, cx, cy, rot, 1, () => {
      g.fillStyle = `rgba(0,0,0,${0.3 + 0.2 * vola})`; g.fillRect(-pw / 2 + 4 + 6 * vola, -ph / 2 + 5 + 8 * vola, pw, ph)
      g.fillStyle = '#fbfaf7'; g.fillRect(-pw / 2, -ph / 2, pw, ph)
      g.save()
      g.beginPath(); g.rect(-pw / 2, -ph / 2, pw, ph * scritto); g.clip()
      g.drawImage(appunti, -pw / 2, -ph / 2, pw, ph)
      g.restore()
      // la riga che si sta scrivendo
      if (scritto < 1) { g.fillStyle = 'rgba(255,214,10,.55)'; g.fillRect(-pw / 2 + 8, -ph / 2 + ph * scritto - 2, pw - 16, 3) }
      // il nastro che la attacca quando arriva al centro
      const nq = kit.clamp((u - LEZIONE - 0.45) / 0.2) * (1 - torna)
      if (nq > 0) {
        g.globalAlpha = nq
        kit.nastro(g, -pw / 2 + 6, -ph / 2 + 4, 40 * (0.7 + 0.3 * nq), 12, -0.7)
        kit.nastro(g, pw / 2 - 6, -ph / 2 + 4, 40 * (0.7 + 0.3 * nq), 12, 0.7)
        g.globalAlpha = 1
      }
      // il timbro
      const tq = kit.clamp((u - LEZIONE - 0.85) / 0.16) * (1 - torna)
      if (tq > 0) kit.con(g, pw * 0.12, ph * 0.12, -0.22, 1 + 0.9 * (1 - kit.ease.out(kit.clamp((u - LEZIONE - 0.85) / 0.16))), () => {
        g.globalCompositeOperation = 'multiply'
        g.globalAlpha = 0.95; kit.timbro(g, 'appunti pronti', 0, 0, 44, 0, ROSSO, tq); kit.timbro(g, 'appunti pronti', 0.4, 0.3, 44, 0, ROSSO, tq * 0.6)
        g.globalCompositeOperation = 'source-over'
      })
    })
    // il cartellino della fine lezione
    if (u > LEZIONE + 0.1 && u < LEZIONE + FINE - 0.2) {
      const q = kit.clamp((u - LEZIONE - 0.1) / 0.3) * kit.clamp((LEZIONE + FINE - 0.2 - u) / 0.3)
      kit.con(g, 112, 131, -0.06, 0.8 + 0.2 * kit.ease.outBack(q), () => {
        g.globalAlpha = q
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-52, -12, 108, 28)
        g.fillStyle = NERO; g.fillRect(-56, -16, 108, 28)
        kit.scritta(g, 'fine lezione', -2, 6, { font: FA, size: 17, color: '#fff', align: 'center' })
        g.globalAlpha = 1
      })
    }
    // il titolo, davanti a tutto
    kit.metti(g, testa, 0, 0, VW, 130)
    g.restore()
    kit.vignetta(g, w, h, 0.4)
    kit.granella(g, w, h, 0.05, t)
  }

  rifai(m.w || 480, m.h || 270)
  return { frame, ridimensiona: rifai, titolo: false, fermo: 6.5 }
}
