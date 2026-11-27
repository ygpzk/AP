// Dettatura: la voce diventa testo battuto a macchina sul quaderno a righe, come nell'app vera.
// Le parole arrivano prima provvisorie (grigio corsivo, anche sbagliate), poi diventano inchiostro; la punteggiatura
// detta a voce («virgola», «punto», «punto esclamativo») si cancella col rosso e diventa il segno vero (stessa
// funzione `punteggia` dell'app). Sotto, la striscia dei comandi con l'onda della voce. Col mouse sopra: si accende.
export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, rumore, TAU, con, tondo, evidenzia, timbro, strato, metti, nastro, PZK } = kit
  await Promise.all(['Special Elite', 'Anton', 'Permanent Marker', 'Journal'].map((f) => kit.font(f)))
  const penna = await kit.imgForse('/art/penne/rossa.webp')
  const puntina = await kit.imgForse('/art/nastro/puntina.webp')

  // ── la punteggiatura a voce: la stessa dell'app (games/dettatura) ──
  function punteggia(t) {
    let s = ` ${t} `.replace(/\s+/g, ' ')
    s = s.replace(/\s+punto interrogativo\b/gi, '?')
    s = s.replace(/\s+punto esclamativo\b/gi, '!')
    s = s.replace(/\s+punto e virgola\b/gi, ';')
    s = s.replace(/\s+due punti\b/gi, ':')
    s = s.replace(/\s+virgola\b/gi, ',')
    s = s.replace(/\s+punto\b/gi, '.')
    s = s.replace(/\s+([,.!?;:])/g, '$1').replace(/([,.!?;:])(?=\S)/g, '$1 ')
    s = s.replace(/(^|[.!?]\s+|\n)([a-zà-ù])/g, (x, a, b) => a + b.toUpperCase())
    s = s.replace(/^\s+/, '').replace(/\s+$/, '')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  const PAROLE_SEGNO = /\b(punto esclamativo|punto interrogativo|virgola|punto)\b/g

  // il copione: quello che si dice, cosa il riconoscimento capisce male per un attimo, quando lo corregge
  const COPIONE = [
    { detto: 'ciao foglio virgola oggi parlo io e tu scrivi punto', sbaglio: ['parlo io', 'parlò il'] },
    { detto: 'le parole arrivano da sole virgola battute a macchina punto', sbaglio: ['da sole', 'dal sole'] },
    { detto: 'funziona davvero punto esclamativo', a_capo: true },
  ]
  const VEL = 17 // caratteri al secondo del parlato
  const CHIUDE = 0.6, PAUSA = 0.35, INIZIO = 0.5
  let tc = INIZIO
  for (const f of COPIONE) {
    f.finale = punteggia(f.detto)
    f.t0 = tc
    f.t1 = tc + f.detto.length / VEL // fine del parlato
    f.t2 = f.t1 + CHIUDE // la punteggiatura è diventata segno
    // la correzione arriva poco dopo che la parola sbagliata è stata detta per intero
    if (f.sbaglio) { const i = f.detto.indexOf(f.sbaglio[0]); f.corregge = f.t0 + (i + f.sbaglio[0].length + 6) / VEL }
    f.segni = [...f.detto.matchAll(PAROLE_SEGNO)].map((x) => [x.index, x.index + x[0].length])
    tc = f.t2 + PAUSA
  }
  const FINE = tc // da qui il colpo: «!», evidenziatore, timbro
  const CICLO = FINE + 3.2

  const INK = '#1d1b18', GRIGIO = '#8a8479', CARTA = '#f7f1df'
  let W = 0, H = 0, s = 1, fondo = null, postit = null, tl = 0, primo = true
  let L = {} // misure del quaderno

  function misure() {
    s = W / 480
    const size = 17.5 * s
    const riga = 23 * s * Math.max(1, (H / W) / (270 / 480) * 0.9)
    const x0 = W * 0.115, x1 = W - 16 * s
    const g = m.g
    g.font = `400 ${size}px "Special Elite"`
    const cw = g.measureText('0').width || size * 0.6
    const top = Math.max(H * 0.43, 96 * s * (H / W) / (270 / 480))
    L = { size, riga, x0, x1, cw, cols: Math.max(10, Math.floor((x1 - x0) / cw)), top, margine: W * 0.092, pannello: H - 46 * s }
  }

  function faiFondo() {
    fondo = strato(W, H, m.dpr, (g) => {
      // il tavolo scuro, poi il foglio grande (un po' storto) con un secondo foglio sotto
      g.fillStyle = '#1d1b18'
      g.fillRect(0, 0, W, H)
      const fogliA = (rot, dx, dy, col, ombra) => con(g, W / 2 + dx, H / 2 + dy, rot, 1, () => {
        g.shadowColor = `rgba(0,0,0,${ombra})`; g.shadowBlur = 14 * s; g.shadowOffsetY = 4 * s
        g.fillStyle = col
        g.fillRect(-W / 2 - 6 * s, -H / 2 - 12 * s, W - 4 * s, H + 24 * s)
        g.shadowColor = 'transparent'
      })
      fogliA(0.012, 6 * s, 2 * s, '#e9e1c9', 0.5)
      fogliA(-0.006, -4 * s, 0, CARTA, 0.55)
      // luce sul foglio
      const r = g.createRadialGradient(W * 0.45, H * 0.15, 0, W * 0.45, H * 0.15, W * 0.8)
      r.addColorStop(0, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(120,100,60,.12)')
      g.fillStyle = r
      g.fillRect(0, 0, W - 10 * s, H)
      // le righe blu e il margine rosso
      g.fillStyle = 'rgba(20,70,160,.2)'
      for (let y = L.top + L.riga * 0.28; y < H + L.riga; y += L.riga) g.fillRect(0, y, W - 10 * s, Math.max(1, s))
      g.fillStyle = 'rgba(20,70,160,.13)'
      g.fillRect(0, L.top - L.riga * 1.7, W - 10 * s, Math.max(1, 1.4 * s))
      g.fillStyle = 'rgba(179,18,31,.42)'
      g.fillRect(L.margine, 0, Math.max(1, 1.5 * s), H)
      g.fillRect(L.margine + 3 * s, 0, Math.max(1, 0.8 * s), H)
      // i buchi dell'anellatura a sinistra
      for (let y = 14 * s; y < H; y += 20 * s) {
        g.fillStyle = '#1d1b18'
        g.beginPath(); g.arc(9 * s, y, 3.4 * s, 0, TAU); g.fill()
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = s
        g.beginPath(); g.arc(9 * s, y + 0.6 * s, 4.2 * s, 0.2, Math.PI - 0.2); g.stroke()
      }
      // l'alone del caffè, in basso a destra (si vede da vicino)
      g.strokeStyle = 'rgba(120,80,30,.13)'; g.lineWidth = 3 * s
      g.beginPath(); g.arc(W * 0.86, H * 0.64, 26 * s, 0.3, TAU - 0.5); g.stroke()
      g.lineWidth = 1.2 * s
      g.beginPath(); g.arc(W * 0.86, H * 0.64, 22 * s, 1, TAU - 1.6); g.stroke()
      // la grana della carta
      const rr = kit.rng(7)
      for (let i = 0; i < 900 * s * s + 200; i++) {
        g.fillStyle = rr() < 0.5 ? 'rgba(90,70,40,.06)' : 'rgba(255,255,255,.18)'
        g.fillRect(rr() * W, rr() * H, s * (0.6 + rr()), s * (0.6 + rr()))
      }
      // il bordo destro del foglio arricciato: ombra
      const o = g.createLinearGradient(W - 30 * s, 0, W - 10 * s, 0)
      o.addColorStop(0, 'rgba(0,0,0,0)'); o.addColorStop(1, 'rgba(60,40,10,.16)')
      g.fillStyle = o
      g.fillRect(W - 30 * s, 0, 20 * s, H)
    })
    // il post-it col promemoria della punteggiatura (come la nota dell'app)
    const pw = 92 * s, ph = 76 * s
    postit = strato(pw + 16 * s, ph + 16 * s, m.dpr, (g) => {
      g.translate(8 * s, 6 * s)
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8 * s; g.shadowOffsetY = 3 * s
      g.fillStyle = '#ffe94d'
      g.beginPath(); g.moveTo(0, 0); g.lineTo(pw, 0); g.lineTo(pw, ph - 10 * s); g.quadraticCurveTo(pw - 2 * s, ph, pw - 14 * s, ph); g.lineTo(0, ph); g.closePath(); g.fill()
      g.shadowColor = 'transparent'
      const lg = g.createLinearGradient(0, 0, 0, 16 * s)
      lg.addColorStop(0, 'rgba(160,120,0,.22)'); lg.addColorStop(1, 'rgba(160,120,0,0)')
      g.fillStyle = lg; g.fillRect(0, 0, pw, 16 * s)
      g.fillStyle = '#1d1b18'
      g.font = `400 ${9.5 * s}px "Permanent Marker"`
      g.textBaseline = 'alphabetic'
      const r = [['«virgola»', ','], ['«punto»', '.'], ['«a capo»', '↵']]
      r.forEach(([a, b], i) => {
        const y = 22 * s + i * 18 * s
        g.fillStyle = '#1d1b18'; g.fillText(a, 7 * s, y)
        g.fillStyle = PZK.rosso; g.font = `400 ${13 * s}px "Permanent Marker"`; g.fillText('→ ' + b, 60 * s, y + 1 * s)
        g.font = `400 ${9.5 * s}px "Permanent Marker"`
      })
    })
  }

  // ── il testo sul foglio: colonne fisse come una macchina da scrivere ──
  function impagina(txt) {
    const out = []
    const { cols } = L
    let riga = 0, col = 0
    const parole = txt.split(/( |\n)/)
    for (const p of parole) {
      if (p === '\n') { riga++; col = 0; continue }
      if (p === ' ') { if (col > 0) { col++ } continue }
      if (col > 0 && col + p.length > cols) { riga++; col = 0 }
      for (const ch of p) { out.push({ ch, riga, col }); col++ }
    }
    return out
  }

  // stato del testo a un tempo del ciclo: { prima, vivo, chiude, inchiostro, segni }
  function statoTesto(c) {
    let prima = '', ultimo = null
    for (let k = 0; k < COPIONE.length; k++) {
      const f = COPIONE[k]
      const sep = prima ? (f.a_capo ? '\n' : ' ') : ''
      if (c < f.t0) return { prima, vivo: '', k: -1, fresco: ultimo }
      if (c < f.t1) {
        let n = Math.floor((c - f.t0) * VEL)
        let vivo = f.detto.slice(0, n)
        if (f.sbaglio && c < f.corregge) vivo = vivo.replace(f.sbaglio[0], f.sbaglio[1])
        return { prima, sep, vivo, k, n, f, fresco: ultimo }
      }
      if (c < f.t2) return { prima, sep, vivo: f.detto, k, chiude: (c - f.t1) / CHIUDE, f, fresco: ultimo }
      prima = prima + sep + f.finale
      if (c < f.t2 + 0.5) { ultimo = { da: prima.length - f.finale.length, a: prima.length, k: (c - f.t2) / 0.5 } }
    }
    return { prima, vivo: '', k: -1, fresco: ultimo }
  }

  function h1(i) { return kit.fract(Math.sin(i * 91.7 + 3.1) * 43758.55) }

  return {
    titolo: true,
    fermo: FINE + 1.1,
    ridimensiona(w, h) { W = w; H = h; misure(); faiFondo() },
    frame(t, dt) {
      const g = m.g, su = m.su
      if (W !== m.w || H !== m.h || !fondo) { W = m.w; H = m.h; misure(); faiFondo() }
      if (primo) { tl = 0; primo = false }
      tl += (dt || 0) * (1 + 0.75 * su)
      const c = tl % CICLO
      metti(g, fondo, 0, 0, W, H)

      // la luce della lampada che si accende col mouse sopra
      if (su > 0.01) {
        const r = g.createRadialGradient(W * 0.55, H * 0.55, 0, W * 0.55, H * 0.55, W * 0.6)
        r.addColorStop(0, `rgba(255,214,120,${0.22 * su})`); r.addColorStop(1, 'rgba(255,214,120,0)')
        g.fillStyle = r; g.fillRect(0, 0, W, H)
      }

      // ── il post-it e la penna in alto a destra (parallasse leggera) ──
      const colpo = c > FINE ? c - FINE : -1
      const sbatte = colpo >= 0 ? Math.sin(colpo * 22) * Math.exp(-colpo * 4) * 0.12 : 0
      const pw = 92 * s, ph = 76 * s
      if (penna) {
        const pl = 150 * s, pwd = pl * 60 / 642
        const ang = -1.43 + Math.sin(t * 0.5) * 0.015 + su * 0.04
        con(g, W * 0.7 - su * 3 * s, 17 * s, ang, 1, () => {
          g.fillStyle = 'rgba(0,0,0,.2)'
          tondo(g, -pwd / 2 + 3 * s, -pl / 2 + 4 * s, pwd * 0.62, pl * 0.95, 4 * s); g.fill()
          g.drawImage(penna, -pwd / 2, -pl / 2, pwd, pl)
        })
      }
      con(g, W - 64 * s, 50 * s + Math.sin(t * 0.7) * 1.2 * s, 0.07 + sbatte - su * 0.06, 1, () => {
        g.drawImage(postit, -pw / 2 - 8 * s, -ph / 2 - 6 * s, pw + 16 * s, ph + 16 * s)
        if (puntina) { const pz = 18 * s; g.drawImage(puntina, -pz / 2, -ph / 2 - pz * 0.55, pz, pz) }
        else nastro(g, 0, -ph / 2, 36 * s, 11 * s, -0.05)
      })
      // ── il testo ──
      const st = statoTesto(c)
      const svanisce = c > CICLO - 0.75 ? smooth(CICLO - 0.75, CICLO - 0.05, c) : 0
      const testoTutto = st.prima + (st.vivo ? (st.sep || '') + st.vivo : '')
      const pos = impagina(testoTutto)
      // l'indice (nei caratteri non-spazio) da cui comincia il pezzo vivo
      let nPrima = 0
      for (const ch of st.prima) if (ch !== ' ' && ch !== '\n') nPrima++
      const righe = pos.length ? pos[pos.length - 1].riga + 1 : 1
      const scorri = Math.max(0, righe - 5) * L.riga
      const { x0, cw, riga, size, top } = L
      const baseY = top + riga * 0.2 - scorri - svanisce * riga * 1.2
      const xy = (p) => [x0 + p.col * cw, baseY + p.riga * riga]
      // la fonte delle lettere: il centro dell'onda nella striscia in basso
      const fonteX = W * 0.54, fonteY = L.pannello + 18 * s
      g.textBaseline = 'alphabetic'
      g.textAlign = 'left'
      // dove stanno le parole-segno nel pezzo vivo (in indici di caratteri non-spazio)
      const segniViv = []
      if (st.f && st.chiude != null) {
        let j = 0
        const mappa = []
        for (let i = 0; i < st.vivo.length; i++) { mappa[i] = j; if (st.vivo[i] !== ' ') j++ }
        for (const [a, b] of st.f.segni) segniViv.push([mappa[a], mappa[b - 1] + 1])
      }
      const fontVivo = `italic 400 ${size}px "Special Elite"`
      const fontFin = `400 ${size}px "Special Elite"`
      let fontOra = ''
      const vivoTempo = st.f && st.n != null ? (i) => st.f.t0 + (i + 1) / VEL : null
      // gli indici dei caratteri non-spazio del vivo, per sapere quando è stato «detto» ognuno
      let mappaVivo = null
      if (vivoTempo) { mappaVivo = []; for (let i = 0; i < st.vivo.length; i++) if (st.vivo[i] !== ' ') mappaVivo.push(i) }
      g.globalAlpha = 1 - svanisce
      for (let i = 0; i < pos.length; i++) {
        const p = pos[i]
        let [x, y] = xy(p)
        if (y < top - riga * 1.4) continue
        const vivo = i >= nPrima
        const j = i - nPrima
        const jit = (h1(i) - 0.5) * size * 0.08
        if (!vivo) {
          // inchiostro: un po' irregolare come i tasti veri; quelli appena fissati passano dal grigio al nero
          if (fontOra !== fontFin) { g.font = fontFin; fontOra = fontFin }
          g.fillStyle = INK
          g.globalAlpha = (0.78 + h1(i + 7) * 0.22) * (1 - svanisce)
          g.fillText(p.ch, x, y + jit)
        } else {
          if (fontOra !== fontVivo) { g.font = fontVivo; fontOra = fontVivo }
          let fx = x, fy = y, sc = 1, a = 1
          if (vivoTempo) {
            const td = vivoTempo(mappaVivo[j] ?? 0)
            const k = clamp((c - td + 1 / VEL) / (0.32 - su * 0.08))
            if (k < 1) {
              // la lettera vola dall'onda alla sua casella
              const e = ease.out(k)
              const cx = lerp(fonteX, x, 0.5) + (h1(i + 3) - 0.5) * 60 * s * (1 + su)
              const cy = Math.min(fonteY, y) - (30 + 40 * su) * s
              fx = (1 - e) * (1 - e) * fonteX + 2 * (1 - e) * e * cx + e * e * x
              fy = (1 - e) * (1 - e) * fonteY + 2 * (1 - e) * e * cy + e * e * y
              sc = lerp(1.9, 1, e); a = clamp(k * 3)
            }
          }
          let colore = GRIGIO
          let inSegno = false
          for (const [a1, b1] of segniViv) if (j >= a1 && j < b1) inSegno = true
          g.globalAlpha = a * (1 - svanisce)
          g.fillStyle = colore
          if (sc !== 1) {
            g.fillStyle = sc > 1.25 ? PZK.rosso : colore
            con(g, fx, fy, (1 - sc) * 0.25, sc, () => g.fillText(p.ch, 0, 0))
          } else g.fillText(p.ch, fx, fy + jit * 0.5)
          if (inSegno) {
            // la parola-segno: la penna rossa la cancella, poi diventa il segno vero
            const k = ease.out(clamp(st.chiude * 1.6))
            g.fillStyle = PZK.rosso
            g.globalAlpha = 0.9 * (1 - svanisce)
            g.fillRect(x - cw * 0.1, y - size * 0.32, cw * 1.2 * k, Math.max(1, 1.6 * s))
          }
        }
      }
      g.globalAlpha = 1
      // i caratteri appena fissati: un velo grigio che si ritira (l'inchiostro che asciuga)
      if (st.fresco) {
        const fin = impagina(st.prima)
        let nn = 0
        for (const ch of st.prima.slice(0, st.fresco.da)) if (ch !== ' ' && ch !== '\n') nn++
        g.font = fontFin
        for (let i = nn; i < fin.length; i++) {
          const [x, y] = xy(fin[i])
          const k = clamp(st.fresco.k * 1.4 - (i - nn) * 0.01)
          // un colpo del martelletto: il carattere si abbassa e torna
          g.fillStyle = CARTA
          g.globalAlpha = (1 - k) * 0.55 * (1 - svanisce)
          g.fillRect(x - 0.5, y - size * 0.8, cw + 1, size)
        }
        g.globalAlpha = 1
      }

      // il filo della voce: dall'onda all'ultima lettera, mentre si parla
      if (st.vivo && st.chiude == null && pos.length) {
        const [cx2, cy2] = xy(pos[pos.length - 1])
        g.save()
        g.strokeStyle = PZK.rosso; g.globalAlpha = (0.3 + 0.3 * su) * (1 - svanisce); g.lineWidth = 1.2 * s
        g.setLineDash([3 * s, 4 * s]); g.lineDashOffset = -tl * 40 * s
        g.beginPath(); g.moveTo(fonteX, fonteY - 10 * s)
        g.quadraticCurveTo(lerp(fonteX, cx2, 0.5) + 30 * s, Math.min(fonteY, cy2) - 30 * s, cx2 + cw * 1.5, cy2 + 2 * s); g.stroke()
        g.restore()
      }

      // il cursore: un trattino rosso che lampeggia dopo l'ultima lettera
      {
        const ult = pos[pos.length - 1]
        let [x, y] = ult ? xy(ult) : [x0 - cw, baseY]
        x += cw * 1.15
        if (Math.floor(t * 2.6) % 2 === 0 || (st.vivo && st.chiude == null)) {
          g.fillStyle = PZK.rosso
          g.globalAlpha = 1 - svanisce
          g.fillRect(x, y + 2 * s, cw * 0.9, Math.max(1.2, 2 * s))
          g.globalAlpha = 1
        }
      }

      // «a capo»: il campanello del carrello, come sulla macchina vera
      {
        const fa = COPIONE.find((f) => f.a_capo)
        const dd = c - fa.t0 + 0.05
        if (dd > 0 && dd < 1 && pos.length) {
          const [, yy] = xy(pos[pos.length - 1])
          const k = ease.outBack(clamp(dd * 4))
          g.globalAlpha = clamp((1 - dd) * 2.5) * (1 - svanisce)
          kit.scritta(g, 'ding!', W - 42 * s, yy - riga * 0.9 - dd * 6 * s, { font: PZK.pennarello, size: 15 * s * k, color: PZK.rosso, align: 'center', rot: -0.25 })
          g.globalAlpha = 1
        }
      }

      // ── il colpo: evidenziatore sull'ultima riga, una raggiera intorno al «!», il timbro ──
      if (colpo >= 0 && pos.length) {
        const ult = pos[pos.length - 1]
        const [ux, uy] = xy(ult)
        const primaRiga = pos.filter((p) => p.riga === ult.riga)[0]
        const [px] = xy(primaRiga)
        const kE = ease.inOut(clamp((colpo - 0.15) / 0.55))
        g.globalAlpha = 1 - svanisce
        evidenzia(g, px - 3 * s, uy - size * 0.82, ux + cw - px + 6 * s, size * 1.05, kE, 'rgba(255,233,77,.8)')
        // la raggiera del punto esclamativo
        const kR = clamp(colpo / 0.5)
        if (kR < 1) {
          g.strokeStyle = PZK.rosso; g.lineWidth = 1.6 * s
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * TAU + 0.3
            const r0 = lerp(6, 14, kR) * s, r1 = lerp(8, 24, ease.out(kR)) * s
            g.globalAlpha = (1 - kR) * (1 - svanisce)
            g.beginPath(); g.moveTo(ux + cw / 2 + Math.cos(a) * r0, uy - size * 0.35 + Math.sin(a) * r0)
            g.lineTo(ux + cw / 2 + Math.cos(a) * r1, uy - size * 0.35 + Math.sin(a) * r1); g.stroke()
          }
        }
        const kT = clamp((colpo - 0.55) / 0.35)
        if (kT > 0) {
          const sc = kT < 1 ? lerp(1.7, 1, ease.outBack(kT)) : 1
          g.globalAlpha = 0.88 * (1 - svanisce)
          con(g, W * 0.79, Math.min(uy + riga * 0.15, L.pannello - 22 * s), 0, sc, () => timbro(g, 'dettato', 0, 0, 42 * s, -0.16, PZK.rosso, 1))
        }
        g.globalAlpha = 1
      }

      // ── la striscia dei comandi: tasto nero, spia, onda della voce, contatori ──
      const py = L.pannello, pH = 36 * s, pX = 14 * s, pWd = W - 28 * s
      g.fillStyle = 'rgba(40,30,10,.22)'
      g.fillRect(pX + 2 * s, py + 4 * s, pWd, pH)
      g.fillStyle = '#fffdf6'
      g.fillRect(pX, py, pWd, pH)
      g.strokeStyle = PZK.nero; g.lineWidth = Math.max(1, 1.5 * s)
      g.strokeRect(pX, py, pWd, pH)
      nastro(g, pX + 8 * s, py + 2 * s, 26 * s, 9 * s, -0.7)
      nastro(g, pX + pWd - 8 * s, py + pH - 2 * s, 26 * s, 9 * s, -0.7)
      // il tasto nero inclinato «ascolta» (premuto: si ascolta)
      const premuto = 0.6 + su * 0.4
      con(g, pX + 44 * s, py + pH / 2 + premuto * 1.5 * s, -0.05, 1, () => {
        const bw = 56 * s, bh = 21 * s
        g.fillStyle = PZK.nero
        g.fillRect(-bw / 2, -bh / 2 + 2.5 * s * (1 - premuto), bw, bh)
        g.fillStyle = PZK.nero
        g.fillRect(-bw / 2, -bh / 2, bw, bh)
        g.fillStyle = '#fffdf6'
        g.font = `400 ${12.5 * s}px "Anton"`
        g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillText(su > 0.5 ? 'ferma' : 'ascolta', 0, 0.5 * s)
      })
      // la spia e lo stato
      const parla = st.vivo && st.chiude == null
      const spia = parla ? '#23864a' : '#c96a00'
      g.fillStyle = spia
      g.beginPath(); g.arc(pX + 84 * s, py + pH / 2, 3.6 * s, 0, TAU); g.fill()
      g.fillStyle = 'rgba(255,255,255,.7)'
      g.beginPath(); g.arc(pX + 83 * s, py + pH / 2 - 1.2 * s, 1.2 * s, 0, TAU); g.fill()
      if (parla) {
        g.strokeStyle = spia; g.globalAlpha = 0.5 * kit.onda(t, 0.8); g.lineWidth = s
        g.beginPath(); g.arc(pX + 84 * s, py + pH / 2, 6 * s, 0, TAU); g.stroke(); g.globalAlpha = 1
      }
      g.textAlign = 'left'; g.textBaseline = 'middle'
      g.fillStyle = '#5a544c'
      g.font = `400 ${9.5 * s}px "Special Elite"`
      g.fillText(parla ? 'ascolto…' : colpo >= 0 ? 'fermo' : 'scrivo…', pX + 92 * s, py + pH / 2 + 0.5 * s)
      // l'onda della voce
      const ox0 = pX + 150 * s, ox1 = pX + pWd - 112 * s
      const N = Math.max(12, Math.round((ox1 - ox0) / (5 * s)))
      const passo = (ox1 - ox0) / N
      let voce = 0.07
      if (parla) voce = 0.45 + 0.55 * Math.abs(Math.sin(tl * 7.3)) * (0.6 + 0.4 * rumore(tl * 3, 2))
      else if (st.chiude != null) voce = 0.25 * (1 - st.chiude)
      voce *= 1 + su * 0.35
      const cy = py + pH / 2
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1)
        const fin = Math.sin(u * Math.PI) ** 0.7
        const hgt = Math.max(1.2 * s, (pH * 0.42) * voce * fin * (0.25 + 0.75 * rumore(i * 0.55 + tl * 9, 4)))
        g.fillStyle = hgt > pH * 0.27 ? PZK.rosso : PZK.nero
        g.fillRect(ox0 + i * passo, cy - hgt, Math.max(1, passo * 0.55), hgt * 2)
      }
      // la riga di mezzo
      g.fillStyle = 'rgba(20,20,20,.2)'; g.fillRect(ox0, cy - 0.5, ox1 - ox0, 1)
      // i contatori, come nell'app
      const vero = (st.prima + (st.vivo ? ' ' + st.vivo : '')).trim()
      const nParole = vero ? vero.split(/\s+/).filter(Boolean).length : 0
      g.textAlign = 'right'
      g.fillStyle = PZK.nero
      g.font = `400 ${10.5 * s}px "Special Elite"`
      g.fillText(`${nParole} ${nParole === 1 ? 'parola' : 'parole'}`, pX + pWd - 10 * s, cy - 6 * s)
      g.fillStyle = '#5a544c'
      g.font = `400 ${8.5 * s}px "Special Elite"`
      g.fillText(`${vero.length} caratteri · it-IT`, pX + pWd - 10 * s, cy + 7 * s)
      g.textAlign = 'left'

      kit.vignetta(g, W, H, 0.28)
      kit.granella(g, W, H, 0.05, t)
    },
  }
}
