// miniature/parole.js — la miniatura viva di Parole (27.11.2026).
// Il foglio vero dei giochi (art/roulette/carta.webp, girato come nel gioco: «rovescio») con la partita che si gioca da
// sola, coi pezzi e i colori di games/parole: le tessere che si girano una a una (verde = al posto giusto, giallo = c'è
// ma altrove, grigio = non c'è), la tastiera che prende il colore migliore visto, la tabella di quanto torna, le fiches
// vere. Due partite vere: «zitto» presa al 3° (100 → tornano 400, come nella cattura) e «fiume» presa al 2°.
// Il momento grosso: la riga giusta salta, le fiches volano nel saldo che sale. Col mouse sopra il foglio si alza, la
// partita accelera e a matita, nella riga da scrivere, si legge la parola nascosta.

const VW = 480, VH = 270
const NERO = '#161616', VERDE = '#23864a', GIALLO = '#ffd400', GRIGIO = '#8a8479', ROSSO = '#b3121f', MATITA = '#3a3632'
const FA = 'Anton', MK = 'Permanent Marker', SE = 'Special Elite'
const PAGA = [20, 8, 4, 2.5, 1.5, 1]
const RIGHE_K = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const PARTITE = [
  { parola: 'zitto', prove: ['carte', 'suino', 'zitto'], puntata: 100, fiche: 'f100' },
  { parola: 'fiume', prove: ['fiore', 'fiume'], puntata: 25, fiche: 'f25' },
]
// i tempi di una partita (secondi)
const PRIMA = 0.9, RIGA = 2.15, BATTI = 0.12, INVIO = 0.85, PASSO = 0.11, GIRA = 0.42, FESTA = 3.9, PULISCI = 1.0

/** i colori come li fa la banca: g = posto giusto, c = c'è altrove, n = non c'è */
function colori(prova, parola) {
  const out = Array(prova.length).fill('n'), resto = {}
  for (let i = 0; i < prova.length; i++) { if (prova[i] === parola[i]) out[i] = 'g'; else resto[parola[i]] = (resto[parola[i]] || 0) + 1 }
  for (let i = 0; i < prova.length; i++) if (out[i] !== 'g' && resto[prova[i]]) { out[i] = 'c'; resto[prova[i]]-- }
  return out
}
const durata = (p) => PRIMA + p.prove.length * RIGA + FESTA + PULISCI
for (const p of PARTITE) { p.colori = p.prove.map((q) => colori(q, p.parola)); p.n = p.prove.length; p.vinta = PRIMA + (p.n - 1) * RIGA + INVIO + 4 * PASSO + GIRA + 0.08; p.torna = p.puntata * PAGA[p.n - 1] }
const CICLO = PARTITE.reduce((a, p) => a + durata(p), 0)
/** i numeri come pzk.fmt: 1.300 · 2,5 */
const it = (n) => { const [a, b] = String(Math.round(n * 10) / 10).split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (b ? `,${b}` : '') }

// la griglia e il lato destro, nelle misure virtuali 480 × 270
const LATO = 26.5, SPAZIO = 4, GX = 40, GY = 66
const cella = (r, i) => [GX + i * (LATO + SPAZIO), GY + r * (LATO + SPAZIO)]
const KW = 19, KH = 17, KG = 3, KY = 176
const SALDO = [372, 50]
/** un'immagine del sito, pronta appena caricata (kit.img aspetta anche decode(), che nella foto senza finestra arriva solo alla fine) */
const carica = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(`immagine mancante: ${src}`)); i.src = src })

export default async function crea(m) {
  const { kit } = m
  const [carta, ...fiches] = await Promise.all([carica('/art/roulette/carta.webp'), ...['f5', 'f25', 'f100', 'f500'].map((f) => carica(`/art/fiches/${f}.webp`))])
  const FICHE = { f5: fiches[0], f25: fiches[1], f100: fiches[2], f500: fiches[3] }
  // i caratteri: si aspettano al massimo un secondo e mezzo, poi si parte lo stesso (il canvas si ridisegna)
  await Promise.race([Promise.all([FA, MK, SE].map((f) => kit.font(f))), new Promise((ok) => setTimeout(ok, 6000))])

  let k = 1, ox = 0, oy = 0, fondo = null, foglio = null, davanti = null, T = 0, ultimo = -1, anticipo = 0
  // la tastiera: dove sta ogni tasto
  const tasti = []
  RIGHE_K.forEach((r, ri) => {
    const larghi = ri === 2 ? 2 : 0, wr = r.length * (KW + KG) - KG + larghi * (30 + KG)
    let x = 330 - wr / 2
    if (ri === 2) { tasti.push({ k: 'invio', x, y: KY + ri * (KH + KG), w: 30 }); x += 30 + KG }
    for (const c of r) { tasti.push({ k: c, x, y: KY + ri * (KH + KG), w: KW }); x += KW + KG }
    if (ri === 2) tasti.push({ k: 'canc', x, y: KY + ri * (KH + KG), w: 30 })
  })
  const tastoDi = Object.fromEntries(tasti.map((t) => [t.k, t]))

  function rifai(w, h) {
    k = Math.min(w / VW, h / VH); ox = (w - VW * k) / 2; oy = (h - VH * k) / 2
    const d = m.dpr
    // lo sfondo: il viola scuro della copertina, luci sfocate e tessere fuori fuoco
    fondo = kit.strato(w, h, d, (g) => {
      const r = g.createRadialGradient(w * 0.55, h * 0.4, 0, w * 0.55, h * 0.4, Math.hypot(w, h) * 0.7)
      r.addColorStop(0, '#5a1834'); r.addColorStop(1, '#1c0611')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      g.filter = `blur(${Math.max(2, 10 * k)}px)`
      const rn = kit.rng(7)
      for (let i = 0; i < 9; i++) {
        g.fillStyle = ['rgba(232,80,28,.5)', 'rgba(255,212,0,.28)', 'rgba(35,134,74,.35)'][i % 3]
        g.beginPath(); g.arc(rn() * w, rn() * h, (20 + rn() * 50) * k, 0, kit.TAU); g.fill()
      }
      g.filter = 'none'
    })
    // il foglio col nastro, con l'ombra e le scritte che non cambiano
    foglio = kit.strato(VW * k, VH * k + 40 * k, d, (g) => {
      g.scale(k, k)
      g.save()
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 6
      // la carta: dentro l'immagine il foglio va da (115,112) a (1420,1040); girata in verticale come nel gioco
      const fx = 16, fy = 12, fw = 448, fh = 300, sx = fw / 1305, sy = fh / 928
      g.translate(0, fy + fh / 2); g.scale(1, -1); g.translate(0, -(fy + fh / 2))
      g.drawImage(carta, fx - 115 * sx, fy - (1152 - 1040) * sy, 1536 * sx, 1152 * sy)
      g.restore()
      // la testata
      kit.scritta(g, 'parole', 32, 50, { font: FA, size: 33, color: NERO })
      kit.scritta(g, 'hai', SALDO[0], SALDO[1] - 20, { font: MK, size: 8, color: MATITA })
      // il lato: la tabella e le scelte
      kit.scritta(g, 'quanto torna, secondo il tentativo', 222, 76, { font: MK, size: 8.5, color: MATITA })
      kit.scritta(g, 'lettere', 222, 141, { font: MK, size: 8.5, color: MATITA })
      g.lineWidth = 1.6; g.strokeStyle = NERO
      kit.tondo(g, 256, 128, 19, 17, 2); g.fillStyle = NERO; g.fill()
      kit.scritta(g, '5', 265.5, 141.5, { font: FA, size: 12, color: '#fff', align: 'center' })
      kit.tondo(g, 279, 128, 19, 17, 2); g.fillStyle = 'rgba(255,255,255,.34)'; g.fill(); g.stroke()
      kit.scritta(g, '6', 288.5, 141.5, { font: FA, size: 12, color: NERO, align: 'center' })
      kit.scritta(g, 'soldi finti: niente premi, niente pagamenti.', 222, 251, { font: MK, size: 7.5, color: MATITA })
    })
    // in primo piano: una fiche e una tessera fuori fuoco
    davanti = kit.strato(VW * k, VH * k, d, (g) => {
      g.scale(k, k)
      g.filter = `blur(${Math.max(1.5, 3.2 * k)}px)`
      kit.con(g, 6, 262, -0.5, 1, () => g.drawImage(FICHE.f500, -36, -36, 72, 72))
      kit.con(g, 476, 118, 0.35, 1, () => {
        g.fillStyle = VERDE; kit.tondo(g, -22, -22, 44, 44, 4); g.fill()
        kit.scritta(g, 'P', 0, 13, { font: FA, size: 32, color: '#fff', align: 'center' })
      })
      g.filter = 'none'
    })
  }

  // ── lo stato della partita al tempo `u` (dentro la partita p) ──
  function stato(p, u) {
    const s = { righe: [], tastiera: {}, fatte: 0, scritta: '', attiva: -1, premuto: null, festa: u - p.vinta, pulisci: u - (p.vinta + FESTA) }
    for (let r = 0; r < p.n; r++) {
      const t0 = PRIMA + r * RIGA
      if (u < t0) break
      const lettere = Math.min(5, Math.floor((u - t0) / BATTI) + 1)
      const giri = []
      for (let i = 0; i < 5; i++) giri.push(kit.clamp((u - (t0 + INVIO + i * PASSO)) / GIRA))
      s.righe.push({ r, lettere: p.prove[r].slice(0, lettere), giri })
      if (lettere < 5 || u < t0 + INVIO) { s.attiva = r; s.premuto = u - t0 < 5 * BATTI ? p.prove[r][Math.floor((u - t0) / BATTI)] : u > t0 + INVIO - 0.05 ? 'invio' : null }
      for (let i = 0; i < 5; i++) if (giri[i] >= 1) {
        const c = p.colori[r][i], l = p.prove[r][i], v = s.tastiera[l]
        if (c === 'g' || (c === 'c' && v !== 'g') || (c === 'n' && !v)) s.tastiera[l] = c
      }
      if (giri[4] >= 1) s.fatte = r + 1
    }
    if (s.fatte < p.n && u >= PRIMA && s.attiva < 0) s.attiva = s.fatte
    return s
  }

  function voce(p, s, u) {
    if (u < PRIMA) return ['scegli la puntata e gioca', 0]
    if (s.festa >= 0) return [`presa al ${p.n}°: tornano ${it(p.torna)} $pzk`, p.vinta]
    if (!s.fatte) return ['5 lettere, sei tentativi: scrivi la prima', PRIMA]
    const giuste = p.colori[s.fatte - 1].filter((c) => c === 'g').length
    const quando = PRIMA + (s.fatte - 1) * RIGA + INVIO + 4 * PASSO + GIRA
    return [giuste === 4 ? 'manca una lettera sola' : giuste ? `${giuste} al posto giusto: se la prendi ora torna ×${it(PAGA[s.fatte])}` : `tentativo ${s.fatte + 1} di 6`, quando]
  }

  function tessera(g, x, y, l, cosa, giro, rot, sopra, tratteggio, fantasma, fa) {
    // giro 0→1: la tessera si gira (rotateX), a metà cambia faccia
    const sc = giro > 0 && giro < 1 ? Math.abs(Math.cos(Math.PI * giro)) : 1
    const faccia = giro >= 0.5 ? cosa : l ? 'piena' : 'vuota'
    g.save()
    g.translate(x + LATO / 2, y + LATO / 2 - sopra)
    g.rotate(rot)
    g.scale(1, Math.max(0.02, sc))
    const h = LATO / 2
    if (faccia === 'g' || faccia === 'c' || faccia === 'n') {
      if (faccia !== 'n') { g.fillStyle = 'rgba(0,0,0,.2)'; kit.tondo(g, -h + 1.6, -h + 1.6, LATO, LATO, 2.5); g.fill() }
      g.fillStyle = faccia === 'g' ? VERDE : faccia === 'c' ? GIALLO : GRIGIO
      kit.tondo(g, -h, -h, LATO, LATO, 2.5); g.fill()
    } else {
      g.fillStyle = 'rgba(255,255,255,.34)'
      kit.tondo(g, -h, -h, LATO, LATO, 2.5); g.fill()
      g.lineWidth = 1.5
      g.strokeStyle = faccia === 'piena' ? NERO : 'rgba(22,22,22,.28)'
      if (faccia === 'vuota' && tratteggio) g.setLineDash([3, 2.5])
      g.stroke(); g.setLineDash([])
    }
    if (l) {
      g.font = `400 ${LATO * 0.6}px "${FA}"`; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillStyle = faccia === 'c' || faccia === 'piena' ? NERO : '#fff'
      g.fillText(l.toUpperCase(), 0, 1)
    } else if (fantasma && fa > 0.01) {
      // la parola nascosta, a matita (col mouse sopra)
      g.font = `400 ${LATO * 0.55}px "${MK}"`; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillStyle = `rgba(58,54,50,${0.45 * fa})`
      g.fillText(fantasma.toUpperCase(), 0, 2)
    }
    g.restore()
  }

  function frame(t, dt) {
    const { g, w, h, su } = m
    // il tempo: quello del motore (stesso t, stessa immagine) più l'anticipo preso col mouse sopra
    if (t < ultimo) anticipo = 0
    ultimo = t; anticipo += (dt || 0) * 0.75 * su; T = t + anticipo
    // dove siamo nel ciclo delle due partite
    let u = T % CICLO, pi = 0
    while (u >= durata(PARTITE[pi])) { u -= durata(PARTITE[pi]); pi++ }
    const p = PARTITE[pi], s = stato(p, u)
    const base = pi === 0 ? 1000 : 1000 - PARTITE[0].puntata + PARTITE[0].torna

    kit.metti(g, fondo, 0, 0, w, h)
    g.save()
    g.translate(ox, oy); g.scale(k, k)

    // il foglio: respira piano; col mouse sopra si alza verso chi guarda
    const sway = Math.sin(T * 0.5) * 0.004 - 0.008, alza = su
    const pugno = s.festa > 0 && s.festa < 0.5 ? Math.sin((s.festa / 0.5) * Math.PI) * 0.012 : s.festa > 0.7 && s.festa < 0.9 ? Math.sin(((s.festa - 0.7) / 0.2) * Math.PI) * -0.008 : 0
    g.save()
    g.translate(VW / 2, VH / 2)
    g.rotate(sway)
    g.scale(1 + 0.025 * alza + pugno, 1 + 0.025 * alza + pugno)
    g.translate(-VW / 2 + Math.sin(T * 0.37) * 1.2, -VH / 2 - 3 * alza)
    if (alza > 0.01) { g.fillStyle = `rgba(0,0,0,${0.25 * alza})`; g.fillRect(24, 26, 440, 260) }
    kit.metti(g, foglio, 0, 0, VW, VH + 40)

    // la voce a pennarello rosso, che si scrive da sinistra
    const [testo, da] = voce(p, s, u)
    g.save()
    g.font = `400 10.5px "${MK}"`
    let vs = 10.5
    while (g.measureText(testo).width > 222 && vs > 7.5) { vs -= 0.5; g.font = `400 ${vs}px "${MK}"` }
    const scritto = kit.clamp((u - da) / 0.55)
    g.beginPath(); g.rect(118, 20, 6 + 236 * kit.ease.out(scritto), 40); g.clip()
    kit.scritta(g, testo, 124, 46, { font: MK, size: vs, color: ROSSO, rot: -0.026 })
    g.restore()

    // il saldo: in gioco la puntata è sul tavolo, a partita presa sale
    const sale = kit.clamp((s.festa - 0.75) / 1.1)
    const saldo = u < PRIMA ? base : base - p.puntata + (s.festa > 0 ? p.torna * kit.ease.inOut(sale) : 0)
    const batte = s.festa > 0.75 && s.festa < 2.2 ? 1 + 0.12 * Math.sin(kit.clamp((s.festa - 0.75) / 1.45) * Math.PI) : 1
    if (s.festa > 1.6) kit.evidenzia(g, SALDO[0] - 3, SALDO[1] - 15, 88, 18, kit.ease.out(kit.clamp((s.festa - 1.6) / 0.35)))
    kit.con(g, SALDO[0], SALDO[1], 0, batte, () => kit.scritta(g, `$pzk ${it(Math.round(saldo / 2.5) * 2.5)}`, 0, 0, { font: FA, size: 17, color: NERO }))
    kit.scritta(g, u >= PRIMA && s.festa < 0 ? `sul tavolo ${p.puntata}` : 'sessione di prova', SALDO[0], SALDO[1] + 9, { font: SE, size: 6.5, color: '#5a544c' })

    // la tabella di quanto torna
    for (let i = 0; i < 6; i++) {
      const cx = 222 + (i % 3) * 77, cy = 82 + Math.floor(i / 3) * 20
      const ora = s.festa >= 0 ? i === p.n - 1 : u >= PRIMA && i === s.fatte, passato = s.festa < 0 && u >= PRIMA && i < s.fatte
      g.save()
      if (ora) {
        const pop = s.festa >= 0 ? kit.ease.outBack(kit.clamp((s.festa - 0.15) / 0.4)) : 1
        g.translate(cx + 36, cy + 8); g.rotate(-0.018); g.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop); g.translate(-cx - 36, -cy - 8)
        g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(cx + 1.5, cy + 1.5, 72, 16)
        g.fillStyle = GIALLO; g.fillRect(cx, cy, 72, 16)
      } else {
        g.strokeStyle = 'rgba(22,22,22,.3)'; g.setLineDash([1.5, 2]); g.lineWidth = 1.2
        g.beginPath(); g.moveTo(cx, cy + 16); g.lineTo(cx + 72, cy + 16); g.stroke(); g.setLineDash([])
      }
      if (passato) g.globalAlpha = 0.35
      kit.scritta(g, `al ${i + 1}°`, cx + 4, cy + 12, { font: SE, size: 7.5, color: NERO })
      kit.scritta(g, it(PAGA[i]), cx + 69, cy + 13, { font: FA, size: 11.5, color: NERO, align: 'right' })
      const lx = cx + 69 - g.measureText(it(PAGA[i])).width
      kit.scritta(g, '×', lx - 1.5, cy + 12.5, { font: SE, size: 7.5, color: NERO, align: 'right' })
      if (passato) { g.strokeStyle = NERO; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 3, cy + 9); g.lineTo(cx + 70, cy + 9); g.stroke() }
      g.restore()
    }

    // le fiches della puntata: quella scelta è alzata e girata (col mouse sopra saltella)
    const nomi = ['f5', 'f25', 'f100', 'f500']
    nomi.forEach((n, i) => {
      const scelta = n === p.fiche
      const salta = scelta ? 4 + Math.abs(Math.sin(T * 5)) * 3 * su : 0
      kit.con(g, 314 + i * 22, 136 - salta, scelta ? -0.14 : 0, 1, () => {
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0.5, 2.5 + salta * 0.6, 10, 9, 0, 0, kit.TAU); g.fill()
        g.drawImage(FICHE[n], -10.5, -10.5, 21, 21)
      })
    })
    // il tasto nero storto: gioca, prova, ancora
    const scritta = u < PRIMA ? 'gioca' : s.festa >= 0 ? 'ancora' : 'prova'
    const giu = (u > PRIMA - 0.12 && u < PRIMA) || s.premuto === 'invio' ? 1.5 : 0
    kit.con(g, 420, 140 + giu, -0.035, 1, () => {
      g.font = `400 13px "${FA}"`
      const tw = g.measureText(scritta).width + 12
      if (!giu) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-tw / 2 + 2.5, -9.5, tw, 18) }
      g.fillStyle = NERO; g.fillRect(-tw / 2, -12, tw, 18)
      kit.scritta(g, scritta, 0, 2.5, { font: FA, size: 13, color: '#fff', align: 'center' })
    })

    // la tastiera: ogni tasto ha il colore migliore visto fin qui
    for (const tk of tasti) {
      const c = s.tastiera[tk.k], pr = s.premuto === tk.k ? 1.5 : 0
      const x = tk.x, y = tk.y + pr
      if (c !== 'n' && !pr) { g.fillStyle = 'rgba(0,0,0,.28)'; kit.tondo(g, x, y + 1.6, tk.w, KH, 2.5); g.fill() }
      kit.tondo(g, x, y, tk.w, KH, 2.5)
      g.fillStyle = c === 'g' ? VERDE : c === 'c' ? GIALLO : c === 'n' ? GRIGIO : pr ? 'rgba(255,233,77,.7)' : 'rgba(255,255,255,.55)'
      g.fill()
      if (!c || c === 'c') { g.lineWidth = 1.3; g.strokeStyle = NERO; g.stroke() }
      const largo = tk.k.length > 1
      kit.scritta(g, largo ? tk.k : tk.k.toUpperCase(), x + tk.w / 2, y + KH / 2 + (largo ? 2.5 : 3), { font: largo ? MK : SE, size: largo ? 6.5 : 9, color: c === 'g' || c === 'n' ? '#fff' : NERO, align: 'center' })
    }

    // la griglia: sei righe di cinque tessere
    const pul = s.pulisci
    for (let r = 0; r < 6; r++) {
      const riga = s.righe[r]
      for (let i = 0; i < 5; i++) {
        const [x, y] = cella(r, i)
        const rot = ((r + i) % 2 ? 0.009 : -0.01)
        let l = riga ? riga.lettere[i] || '' : '', giro = riga ? riga.giri[i] : 0, cosa = riga ? p.colori[r][i] : null
        // la riga presa salta a onda
        let sopra = 0
        if (s.festa > 0 && r === p.n - 1) { const q = kit.clamp((s.festa - i * 0.08) / 0.5); sopra = Math.sin(q * Math.PI) * 9 + (s.festa > 1.8 ? Math.sin((s.festa - 1.8) * 6 - i * 0.7) * 1.2 * Math.max(0, 1 - (s.festa - 1.8) / 1.6) : 0) }
        // a partita finita le tessere si rigirano bianche, a onda
        if (pul > 0 && riga) {
          const q = kit.clamp((pul - (r * 0.09 + i * 0.05)) / 0.34)
          if (q > 0) { giro = 1 - q; if (q >= 0.5) { l = ''; cosa = null } }
        }
        const attiva = r === s.attiva && s.festa < 0
        // col mouse sopra, a matita, la parola nascosta nella prima riga ancora vuota (e nelle caselle da scrivere)
        const spia = s.festa < 0 && u >= PRIMA && (attiva || r === s.righe.length)
        tessera(g, x, y, l, cosa, giro, rot, sopra, attiva, spia ? p.parola[i] : '', su)
      }
    }

    // il timbro rosso sulle righe rimaste vuote: «presa ×4»
    if (s.festa > 0.55) {
      const q = kit.clamp((s.festa - 0.55) / 0.16), via = pul > 0 ? kit.clamp(1 - pul / 0.4) : 1
      g.save()
      g.globalAlpha = via
      kit.con(g, GX + 76, GY + 4.55 * (LATO + SPAZIO), -0.16, 1 + 0.9 * (1 - kit.ease.out(q)), () => {
        g.globalCompositeOperation = 'multiply'
        kit.timbro(g, `presa ×${it(PAGA[p.n - 1])}`, 0, 0, 40, 0, ROSSO, q)
      })
      g.restore()
    }

    // la luce che passa sul foglio (e il lampo quando la prendi)
    const passa = kit.ciclo(T, 7.5)
    const lx = -120 + passa * 760
    const lg = g.createLinearGradient(lx - 70, 0, lx + 70, 40)
    const lampo = s.festa > 0 ? Math.max(0, 1 - Math.abs(s.festa - 0.35) / 0.35) : 0
    lg.addColorStop(0, 'rgba(255,248,225,0)'); lg.addColorStop(0.5, `rgba(255,248,225,${0.1 + 0.25 * lampo})`); lg.addColorStop(1, 'rgba(255,248,225,0)')
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = lg; g.fillRect(16, 12, 448, 270); g.restore()
    g.restore() // (fine foglio)

    // le fiches che volano dalla riga presa al saldo
    if (s.festa > 0.3 && s.festa < 2.4) {
      const fy = GY + (p.n - 1) * (LATO + SPAZIO) + LATO / 2
      for (let j = 0; j < 8; j++) {
        const q = kit.clamp((s.festa - 0.35 - j * 0.07) / 0.8)
        if (q <= 0 || q >= 1) continue
        const e = kit.ease.inOut(q)
        const x0 = GX + 14 + (j % 5) * (LATO + SPAZIO), y0 = fy
        const x1 = SALDO[0] + 30, y1 = SALDO[1] - 6
        const cx = (x0 + x1) / 2 - 20 + j * 6, cy = -4 - j * 3
        const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * x1
        const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y1
        const sc = 1 + Math.sin(q * Math.PI) * 0.9 - q * 0.4
        g.globalAlpha = q > 0.85 ? (1 - q) / 0.15 : 1
        kit.con(g, x, y, q * 9 + j, sc, () => {
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(2, 4, 10, 10, 0, 0, kit.TAU); g.fill()
          g.drawImage(FICHE[nomi[(j + (pi ? 1 : 2)) % 4]], -11, -11, 22, 22)
        })
        g.globalAlpha = 1
      }
    }
    kit.metti(g, davanti, 0, 0, VW, VH)
    g.restore()
    kit.vignetta(g, w, h, 0.35)
    kit.granella(g, w, h, 0.05, t)
  }

  rifai(m.w || 480, m.h || 270)
  return {
    frame,
    ridimensiona: (w, h) => rifai(w, h),
    titolo: false,
    fermo: 7.6,
  }
}
