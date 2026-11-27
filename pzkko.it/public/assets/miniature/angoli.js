// miniature/angoli.js — la miniatura viva di Angoli (27.11.2026).
// Il foglio vero dei giochi (art/roulette/carta.webp) con un minuto di gioco che va da solo, coi pezzi di games/angoli:
// le due semirette con la freccia, l'arco e lo spicchio, tracciati dalle penne vere col cordino (art/penne) nei colori dei
// pennarelli del gioco; il «?» sulla bisettrice; i tentativi scritti col tastierino (verde = più grande, rosso = più
// piccolo); i punti, il tempo che cala, e allo scadere la pagella col nuovo record e il timbro del geometra.
// Gli angoli sono in gradi centesimali (il giro è 400g), al passo di 5g, come nel gioco.
// Col mouse sopra: il foglio si alza e arriva il goniometro trasparente (in gradi centesimali) che misura l'angolo.

const VW = 480, VH = 270
const NERO = '#161616', VERDE = '#23864a', GIALLO = '#ffd400', ROSSO = '#b3121f', MATITA = '#3a3632', BLU = '#1446a0'
const FA = 'Anton', MK = 'Permanent Marker', SE = 'Special Elite'
const C = [152, 152], R = 90, RA = 36, S = R / 178 // il disegno del gioco è in 400 × 400 (raggio 178): qui in scala
// i tre giri: [ampiezza in g, rotazione in gradi, [penna delle semirette, penna dell'arco], i tentativi, i punti]
const GIRI = [
  { g: 140, rot: 18, penna: ['#161616', '#b3121f'], prove: [120, 160, 140], punti: 1212 },
  { g: 75, rot: 205, penna: ['#1446a0', '#e8501c'], prove: [80, 75], punti: 1508 },
  { g: 250, rot: 300, penna: ['#23864a', '#7a1fa2'], prove: [250], punti: 1744 },
]
const DISEGNA = 1.3, PRIMA = 1.5, OGNI = 1.0, TIENI = 0.8, FINE = 5.0
for (const r of GIRI) r.dura = PRIMA + (r.prove.length - 1) * OGNI + 0.6 + TIENI
const GIOCO = GIRI.reduce((a, r) => a + r.dura, 0), CICLO = GIOCO + FINE
const RECORD = 3910, TOTALE = GIRI.reduce((a, r) => a + r.punti, 0)
const TIMBRI = [[3, 'geometra dilettante'], [5, 'geometra esperto'], [7, 'geometra professionista'], [10, 'trofeo della geometria piana']]
const it = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const rad = (g) => (g * Math.PI) / 200
/** un'immagine del sito, pronta appena caricata (kit.img aspetta anche decode(), che nella foto senza finestra arriva solo alla fine) */
const carica = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src })

export default async function crea(m) {
  const { kit } = m
  const [carta, nera, rossa, blu] = await Promise.all(['/art/roulette/carta.webp', '/art/penne/nera-aperta.webp', '/art/penne/rossa-aperta.webp', '/art/penne/blu.webp'].map(carica))
  if (!carta) throw new Error('manca la carta')
  await Promise.race([Promise.all([FA, MK, SE].map((f) => kit.font(f))), new Promise((ok) => setTimeout(ok, 6000))])
  // la penna vera per ogni pennarello del gioco (verde e viola non ci sono: si tinge la penna più vicina)
  const PENNA = { '#161616': nera, '#1446a0': blu, '#b3121f': rossa, '#e8501c': rossa, '#23864a': nera, '#7a1fa2': blu }

  let k = 1, ox = 0, oy = 0, fondo = null, foglio = null, T = 0

  function rifai(w, h) {
    k = Math.min(w / VW, h / VH); ox = (w - VW * k) / 2; oy = (h - VH * k) / 2
    fondo = kit.strato(w, h, m.dpr, (g) => {
      const r = g.createLinearGradient(0, 0, w, h)
      r.addColorStop(0, '#5a0d14'); r.addColorStop(1, '#22040a')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      // le righe del quaderno, sotto il foglio
      g.strokeStyle = 'rgba(255,190,190,.09)'; g.lineWidth = 1
      for (let y = 6; y < h; y += 12 * k) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() }
    })
    foglio = kit.strato(VW * k, (VH + 40) * k, m.dpr, (g) => {
      g.scale(k, k)
      g.save()
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 6
      const fx = 16, fy = 12, fw = 448, fh = 300, sx = fw / 1305, sy = fh / 928
      g.drawImage(carta, fx - 115 * sx, fy - 112 * sy, 1536 * sx, 1152 * sy)
      g.restore()
      kit.scritta(g, 'angoli', 32, 50, { font: FA, size: 33, color: NERO })
    })
  }

  // ── la figura: semirette, frecce, arco, spicchio, vertice; `p` = quanto è tracciato di ogni pezzo ──
  function punta(g, x, y, dx, dy) {
    const s = 15 * S * 1.15, a = 7 * S * 1.15
    g.beginPath(); g.moveTo(x - s * dx - a * dy, y - s * dy + a * dx); g.lineTo(x, y); g.lineTo(x - s * dx + a * dy, y - s * dy - a * dx); g.stroke()
  }
  function figura(g, giro, p, scritta, alfa, lampo) {
    const t = rad(giro.g), r0 = (giro.rot * Math.PI) / 180, [semi, arco] = giro.penna
    g.save()
    g.globalAlpha = alfa
    g.translate(C[0], C[1]); g.rotate(r0)
    g.lineCap = 'round'; g.lineJoin = 'round'
    // lo spicchio (si accende quando l'angolo è preso)
    if (p.arco > 0) {
      g.globalAlpha = alfa * (0.16 + 0.3 * lampo) * kit.clamp(p.arco * 2)
      g.fillStyle = arco
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, RA * (1 + 0.15 * lampo), 0, t * p.arco); g.closePath(); g.fill()
      g.globalAlpha = alfa
    }
    g.strokeStyle = arco; g.lineWidth = 6 * S * 1.3
    if (p.arco > 0) { g.beginPath(); g.arc(0, 0, RA, 0, t * p.arco); g.stroke() }
    g.strokeStyle = semi; g.lineWidth = 7 * S * 1.3
    if (p.s1 > 0) { g.beginPath(); g.moveTo(0, 0); g.lineTo(R * p.s1, 0); g.stroke() }
    if (p.s2 > 0) { g.beginPath(); g.moveTo(0, 0); g.lineTo(R * p.s2 * Math.cos(t), R * p.s2 * Math.sin(t)); g.stroke() }
    g.lineWidth = 6 * S * 1.3
    if (p.s1 >= 1) punta(g, R, 0, 1, 0)
    if (p.s2 >= 1) punta(g, R * Math.cos(t), R * Math.sin(t), Math.cos(t), Math.sin(t))
    if (p.v > 0) { g.fillStyle = semi; g.beginPath(); g.arc(0, 0, 9 * S * 1.2 * kit.ease.outBack(p.v), 0, kit.TAU); g.fill() }
    g.restore()
    // la scritta sulla bisettrice, dritta
    if (p.q > 0) {
      const b = t / 2 + r0, rs = (giro.g < 50 ? 132 : 120) * S
      const x = C[0] + rs * Math.cos(b), y = C[1] + rs * Math.sin(b)
      kit.con(g, x, y, 0, 0.4 + 0.6 * kit.ease.outBack(p.q) + 0.25 * lampo, () => {
        g.globalAlpha = alfa
        g.font = `400 ${44 * S * 1.15}px "${FA}"`; g.textAlign = 'center'; g.textBaseline = 'middle'
        g.lineJoin = 'round'; g.lineWidth = 9 * S; g.strokeStyle = '#f4f0e6'; g.strokeText(scritta, 0, 1)
        g.fillStyle = arco; g.fillText(scritta, 0, 1)
        g.globalAlpha = 1
      })
    }
  }

  /** la penna vera col cordino: la punta in (x, y) */
  function penna(g, im, x, y, inclina, colore) {
    if (!im) return
    const L = 140, W = L * (im.width / im.height)
    g.save()
    g.translate(x, y); g.rotate(inclina)
    // il cordino sale fuori dal foglio
    g.strokeStyle = 'rgba(240,236,225,.9)'; g.lineWidth = 1.6
    g.beginPath(); g.moveTo(0, -L + 6); g.bezierCurveTo(2, -L - 30, -6, -L - 60, 4, -L - 140); g.stroke()
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(4, -L / 2 + 6, W * 0.45, L * 0.5, 0.06, 0, kit.TAU); g.fill()
    g.drawImage(im, -W / 2, -L, W, L)
    if (colore === '#23864a' || colore === '#7a1fa2') { g.globalCompositeOperation = 'source-atop'; g.fillStyle = colore; g.globalAlpha = 0.45; g.fillRect(-W / 2, -L * 0.82, W, L * 0.66) }
    g.restore()
  }

  function tasto(g, x, y, w, h, testo, giu, nero) {
    const d = giu ? 1.5 : 0
    if (!giu) { g.fillStyle = 'rgba(0,0,0,.28)'; kit.tondo(g, x, y + 1.6, w, h, 2.5); g.fill() }
    kit.tondo(g, x, y + d, w, h, 2.5)
    g.fillStyle = nero ? NERO : giu ? 'rgba(255,233,77,.8)' : 'rgba(255,255,255,.5)'; g.fill()
    g.lineWidth = 1.3; g.strokeStyle = NERO; g.stroke()
    const largo = testo.length > 1
    kit.scritta(g, testo, x + w / 2, y + d + h / 2 + (largo ? 2.5 : 4), { font: largo ? MK : FA, size: largo ? 7.5 : 11, color: nero ? '#fff' : NERO, align: 'center' })
  }

  /** il goniometro trasparente in gradi centesimali, appoggiato sul vertice (col mouse sopra) */
  function goniometro(g, giro, su) {
    if (su < 0.02) return
    const r0 = (giro.rot * Math.PI) / 180, e = kit.ease.out(su)
    g.save()
    g.translate(C[0] + (1 - e) * 140, C[1] - (1 - e) * 30)
    g.rotate(r0 - (1 - e) * 0.9)
    g.globalAlpha = e
    const Rg = R * 0.98
    g.fillStyle = 'rgba(190,225,255,.22)'; g.beginPath(); g.arc(0, 0, Rg, 0, kit.TAU); g.arc(0, 0, Rg * 0.56, 0, kit.TAU, true); g.fill()
    g.strokeStyle = 'rgba(20,70,160,.75)'; g.lineWidth = 0.8
    g.beginPath(); g.arc(0, 0, Rg, 0, kit.TAU); g.stroke()
    g.beginPath(); g.arc(0, 0, Rg * 0.56, 0, kit.TAU); g.stroke()
    for (let i = 0; i < 80; i++) {
      const a = rad(i * 5), l = i % 10 === 0 ? 0.16 : i % 2 === 0 ? 0.09 : 0.05
      g.beginPath(); g.moveTo(Math.cos(a) * Rg, Math.sin(a) * Rg); g.lineTo(Math.cos(a) * Rg * (1 - l), Math.sin(a) * Rg * (1 - l)); g.stroke()
    }
    g.fillStyle = 'rgba(20,70,160,.85)'; g.font = `400 6.5px "${SE}"`; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (let i = 0; i < 8; i++) { const a = rad(i * 50); g.fillText(`${i * 50}`, Math.cos(a) * Rg * 0.74, Math.sin(a) * Rg * 0.74) }
    // il filo della lettura, lungo la seconda semiretta
    const t = rad(giro.g)
    g.strokeStyle = 'rgba(20,70,160,.9)'; g.lineWidth = 1; g.setLineDash([2, 2])
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(t) * (Rg + 8), Math.sin(t) * (Rg + 8)); g.stroke(); g.setLineDash([])
    g.beginPath(); g.arc(0, 0, 2, 0, kit.TAU); g.fillStyle = BLU; g.fill()
    g.restore()
    // la lettura a pennarello blu, accanto al bordo
    const b = rad(giro.g) + r0
    kit.scritta(g, `${giro.g}g`, C[0] + Math.cos(b) * (R + 14), C[1] + Math.sin(b) * (R + 14) + 4, { font: MK, size: 11, color: `rgba(20,70,160,${e})`, align: 'center', rot: -0.08 })
  }

  function frame(t, dt) {
    const { g, w, h, su } = m
    T = t
    const c = T % CICLO
    // il giro di adesso
    let gi = 0, u = c, fine = c >= GIOCO
    if (!fine) while (u >= GIRI[gi].dura) { u -= GIRI[gi].dura; gi++ }
    else { gi = GIRI.length - 1; u = GIRI[gi].dura + (c - GIOCO) }
    const giro = GIRI[gi]

    // lo stato dei tentativi
    const storia = []
    let scritto = '', premuto = null, preso = false, quandoPreso = 0, voce = 'multipli di 5g, da 5 a 395: scrivi e premi invio', daVoce = 0
    giro.prove.forEach((n, j) => {
      const t0 = PRIMA + j * OGNI, s = String(n)
      if (u < t0) return
      const ultimo = j === giro.prove.length - 1
      if (u < t0 + 0.55) { scritto = s.slice(0, Math.min(s.length, Math.floor((u - t0) / 0.15) + 1)); premuto = u - t0 < s.length * 0.15 ? s[Math.floor((u - t0) / 0.15)] : null }
      else if (u < t0 + 0.6) { scritto = s; premuto = 'invio' }
      else if (ultimo) { preso = true; quandoPreso = t0 + 0.6; voce = `${giro.g}g, preso${j === 0 ? ' al primo colpo' : ''}: +${it(giro.punti)}`; daVoce = quandoPreso }
      else { const sopra = giro.g > n; storia.push([n, sopra]); voce = sopra ? `più grande di ${n}g` : `più piccolo di ${n}g`; daVoce = t0 + 0.6 }
    })
    if (fine) { voce = 'tempo!'; daVoce = GIRI[gi].dura }
    let punti = 0
    for (let i = 0; i < gi; i++) punti += GIRI[i].punti
    if (preso) punti += giro.punti * kit.ease.out(kit.clamp((u - quandoPreso) / 0.5))
    const fila = gi === 2 && preso ? 1 : 0
    const resta = Math.max(0, (GIOCO - c) * 2)

    kit.metti(g, fondo, 0, 0, w, h)
    g.save()
    g.translate(ox, oy); g.scale(k, k)

    // il foglio
    const lampo = preso ? Math.max(0, 1 - Math.abs(u - quandoPreso - 0.15) / 0.35) : 0
    g.save()
    g.translate(VW / 2, VH / 2)
    g.rotate(Math.sin(T * 0.43) * 0.004 - 0.003)
    g.scale(1 + 0.02 * su, 1 + 0.02 * su)
    g.translate(-VW / 2, -VH / 2 - 3 * su)
    if (su > 0.01) { g.fillStyle = `rgba(0,0,0,${0.25 * su})`; g.fillRect(24, 26, 440, 260) }
    kit.metti(g, foglio, 0, 0, VW, VH + 40)

    // la voce a pennarello rosso
    g.save()
    g.beginPath(); g.rect(112, 20, 6 + 330 * kit.ease.out(kit.clamp((u - daVoce) / 0.45)), 40); g.clip()
    let vs = 11
    g.font = `400 ${vs}px "${MK}"`
    while (g.measureText(voce).width > 322 && vs > 7.5) { vs -= 0.5; g.font = `400 ${vs}px "${MK}"` }
    const scossa = !preso && storia.length && u - daVoce < 0.36 ? Math.sin((u - daVoce) * 70) * 2.5 * (1 - (u - daVoce) / 0.36) : 0
    kit.scritta(g, voce, 118 + scossa, 45, { font: MK, size: vs, color: ROSSO, rot: -0.026 })
    g.restore()

    // la figura: tracciata dalle penne, poi il «?»; preso, diventa l'ampiezza; al giro dopo si cancella
    const p = {
      s1: kit.ease.inOut(kit.clamp((u - 0.1) / 0.4)), s2: kit.ease.inOut(kit.clamp((u - 0.5) / 0.4)),
      arco: kit.ease.inOut(kit.clamp((u - 0.85) / 0.4)), v: kit.clamp((u - 0.05) / 0.25), q: kit.clamp((u - DISEGNA) / 0.25),
    }
    const via = fine ? 1 : kit.clamp((giro.dura - u) / 0.25)
    figura(g, giro, p, preso || fine ? `${giro.g}g` : '?', via, lampo)
    // preso: i tratti di pennarello che scoppiano intorno all'ampiezza
    if (preso && u - quandoPreso < 0.7) {
      const q = kit.clamp((u - quandoPreso) / 0.7), b = rad(giro.g) / 2 + (giro.rot * Math.PI) / 180, rs = (giro.g < 50 ? 132 : 120) * S
      const x = C[0] + rs * Math.cos(b), y = C[1] + rs * Math.sin(b)
      g.save(); g.strokeStyle = giro.penna[1]; g.lineCap = 'round'; g.lineWidth = 2.4 * (1 - q) + 0.6; g.globalAlpha = 1 - q * q
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * kit.TAU + 0.3, r1 = 22 + 26 * kit.ease.out(q), r2 = r1 + 9 * (1 - q)
        g.beginPath(); g.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.8); g.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2 * 0.8); g.stroke()
      }
      g.restore()
    }
    goniometro(g, giro, su * via)

    // il tempo, sotto la figura
    const poco = resta < 10
    kit.scritta(g, resta.toFixed(1).replace('.', ','), 92, 262, { font: FA, size: 15, color: poco ? ROSSO : NERO, align: 'right' })
    kit.scritta(g, 'secondi', 96, 261, { font: MK, size: 7.5, color: MATITA })
    kit.tondo(g, 134, 254, 104, 6, 2); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill()
    g.fillStyle = poco ? ROSSO : VERDE; g.fillRect(135, 255, 102 * (resta / 60), 4)
    kit.tondo(g, 134, 254, 104, 6, 2); g.lineWidth = 1.3; g.strokeStyle = NERO; g.stroke()

    // a destra: in gioco i conti, la risposta, i tentativi, i numeri; allo scadere la pagella
    const X = 278, LW = 170
    if (!fine) {
      ;[['punti', it(punti)], ['di fila', String(fila)], ['record', it(RECORD)]].forEach(([l, v], i) => {
        const x = X + i * 57
        kit.scritta(g, l, x + 3, 74, { font: MK, size: 7, color: MATITA })
        kit.con(g, x + 3, 92, 0, i === 0 && preso && u - quandoPreso < 0.6 ? 1 + 0.15 * Math.sin(((u - quandoPreso) / 0.6) * Math.PI) : 1, () => kit.scritta(g, v, 0, 0, { font: FA, size: 15, color: i === 0 && preso ? VERDE : NERO }))
        g.strokeStyle = 'rgba(22,22,22,.3)'; g.setLineDash([1.5, 2]); g.lineWidth = 1.2
        g.beginPath(); g.moveTo(x, 96); g.lineTo(x + 52, 96); g.stroke(); g.setLineDash([])
      })
      // la casella della risposta
      const pq = preso ? kit.ease.outBack(kit.clamp((u - quandoPreso) / 0.3)) : 0
      kit.con(g, X + LW / 2, 117, preso ? -0.018 * pq : 0, 1 + 0.03 * pq, () => {
        if (preso) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-LW / 2 + 2.5, -13 + 2.5, LW, 27) }
        g.fillStyle = preso ? VERDE : 'rgba(255,255,255,.45)'; g.fillRect(-LW / 2, -13, LW, 27)
        g.lineWidth = 1.4; g.strokeStyle = preso ? VERDE : NERO
        if (!scritto && !preso) g.setLineDash([4, 3])
        g.strokeRect(-LW / 2, -13, LW, 27); g.setLineDash([])
        const v = preso ? String(giro.g) : scritto
        g.font = `400 21px "${FA}"`
        const vw = g.measureText(v || '?').width
        kit.scritta(g, v || '?', vw / 2 - 4, 9, { font: FA, size: 21, color: preso ? '#fff' : v ? NERO : 'rgba(22,22,22,.25)', align: 'right' })
        kit.scritta(g, 'g', vw / 2, 8, { font: MK, size: 11, color: preso ? '#fff' : MATITA })
      })
      // i tentativi sbagliati: verde = più grande, rosso = più piccolo
      storia.slice(-4).forEach(([n, sopra], i) => {
        const x = X + (i % 2) * 86, y = 136 + Math.floor(i / 2) * 17
        g.fillStyle = sopra ? 'rgba(35,134,74,.14)' : 'rgba(179,18,31,.1)'; g.fillRect(x, y, 84, 14)
        g.fillStyle = sopra ? VERDE : ROSSO; g.fillRect(x, y, 3, 14)
        kit.scritta(g, `${n}g`, x + 7, y + 11, { font: FA, size: 10, color: NERO })
        kit.scritta(g, sopra ? '↑ più grande' : '↓ più piccolo', x + 30, y + 10.5, { font: SE, size: 7, color: NERO })
      })
      // il tastierino
      const K = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'canc', '0', 'invio']
      K.forEach((tk, i) => {
        const x = X + (i % 3) * 58, y = 176 + Math.floor(i / 3) * 20
        tasto(g, x, y, 54, 16, tk, premuto === tk, tk === 'invio')
      })
    } else {
      const f = c - GIOCO
      kit.scritta(g, 'la pagella', X, 76, { font: MK, size: 9, color: MATITA })
      const tot = TOTALE * kit.ease.out(kit.clamp((f - 0.3) / 1.0))
      kit.scritta(g, it(tot), X, 114, { font: FA, size: 38, color: NERO })
      g.font = `400 38px "${FA}"`
      kit.scritta(g, 'punti', X + g.measureText(it(TOTALE)).width + 5, 113, { font: MK, size: 10, color: MATITA })
      if (f > 1.3) {
        const q = kit.clamp((f - 1.3) / 0.18)
        kit.con(g, X + 128, 92, -0.07, 1 + 0.8 * (1 - kit.ease.out(q)), () => {
          g.globalAlpha = q
          g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(-32, -9, 66, 18)
          g.fillStyle = GIALLO; g.fillRect(-34, -11, 66, 18)
          kit.scritta(g, 'nuovo record!', -1, 2.5, { font: MK, size: 8.5, color: NERO, align: 'center' })
          g.globalAlpha = 1
        })
      }
      ;[['angoli presi', '3'], ['fila più lunga', '1'], ['record', it(f > 1.3 ? TOTALE : RECORD)]].forEach(([l, v], i) => {
        const x = X + i * 57
        kit.scritta(g, l, x + 3, 130, { font: MK, size: 6.5, color: MATITA })
        kit.scritta(g, v, x + 3, 146, { font: FA, size: 13, color: NERO })
      })
      TIMBRI.forEach(([n, nome], i) => {
        const x = X + (i % 2) * 86, y = 156 + Math.floor(i / 2) * 26
        const preso1 = i === 0, q = kit.clamp((f - 1.9) / 0.16)
        if (preso1 && q > 0) {
          kit.con(g, x + 41, y + 11, -0.035, 1 + 0.9 * (1 - kit.ease.out(q)), () => {
            g.globalAlpha = q
            g.strokeStyle = ROSSO; g.lineWidth = 1; g.strokeRect(-41, -11, 82, 22); g.strokeRect(-39, -9, 78, 18)
            kit.scritta(g, String(n), -34, 6, { font: FA, size: 14, color: ROSSO })
            kit.scritta(g, 'geometra', -22, -1, { font: MK, size: 7, color: ROSSO })
            kit.scritta(g, 'dilettante', -22, 7, { font: MK, size: 7, color: ROSSO })
            g.globalAlpha = 1
          })
        } else if (!preso1) {
          g.strokeStyle = 'rgba(22,22,22,.3)'; g.setLineDash([3, 2]); g.lineWidth = 1.2; g.strokeRect(x, y, 82, 22); g.setLineDash([])
          kit.scritta(g, String(n), x + 6, y + 17, { font: FA, size: 14, color: 'rgba(22,22,22,.4)' })
          const parole = nome.split(' ')
          kit.scritta(g, parole[0], x + 22, y + 10, { font: MK, size: 6, color: 'rgba(22,22,22,.4)' })
          kit.scritta(g, parole.slice(1).join(' '), x + 22, y + 17, { font: MK, size: 6, color: 'rgba(22,22,22,.4)' })
        }
      })
      g.globalAlpha = kit.clamp((f - 2.4) / 0.3)
      kit.con(g, X, 222, -0.035, 1, () => {
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(2.5, 2.5, 46, 18)
        g.fillStyle = NERO; g.fillRect(0, 0, 46, 18)
        kit.scritta(g, 'ancora', 23, 14, { font: FA, size: 13, color: '#fff', align: 'center' })
      })
      kit.scritta(g, 'cambia passo', X + 60, 236, { font: MK, size: 8, color: BLU })
      g.fillStyle = BLU; g.fillRect(X + 60, 238, 56, 1.2)
      g.globalAlpha = 1
    }

    // la luce che scorre sul foglio (e il lampo quando lo prendi)
    const lx = -150 + kit.ciclo(T, 7) * 800
    const lg = g.createLinearGradient(lx - 80, 0, lx + 80, 50)
    lg.addColorStop(0, 'rgba(255,250,230,0)'); lg.addColorStop(0.5, `rgba(255,250,230,${0.12 + 0.3 * lampo})`); lg.addColorStop(1, 'rgba(255,250,230,0)')
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = lg; g.fillRect(16, 12, 448, 270); g.restore()
    g.restore() // (fine foglio)

    // le penne vere: scendono col cordino, tracciano, risalgono
    if (!fine) {
      const t2 = rad(giro.g), r0 = (giro.rot * Math.PI) / 180
      const [cs, ca] = giro.penna
      // la penna delle semirette: prima la prima, poi la seconda
      let px, py, dentro
      if (u < 0.6) { const q = p.s1; px = C[0] + Math.cos(r0) * R * q; py = C[1] + Math.sin(r0) * R * q }
      else { const q = p.s2; px = C[0] + Math.cos(r0 + t2) * R * q; py = C[1] + Math.sin(r0 + t2) * R * q }
      dentro = kit.clamp(u / 0.12) * kit.clamp((1.0 - u) / 0.25)
      penna(g, PENNA[cs], px + (1 - dentro) * 30, py - (1 - kit.ease.out(dentro)) * 170, 0.32, cs)
      // la penna dell'arco
      const aq = r0 + t2 * p.arco
      const dentro2 = kit.clamp((u - 0.7) / 0.15) * kit.clamp((1.45 - u) / 0.25)
      penna(g, PENNA[ca], C[0] + Math.cos(aq) * RA + (1 - dentro2) * 30, C[1] + Math.sin(aq) * RA - (1 - kit.ease.out(dentro2)) * 170, 0.28, ca)
    }
    g.restore()
    kit.vignetta(g, w, h, 0.35)
    kit.granella(g, w, h, 0.05, t)
  }

  rifai(m.w || 480, m.h || 270)
  return { frame, ridimensiona: rifai, titolo: false, fermo: 5.6 }
}
