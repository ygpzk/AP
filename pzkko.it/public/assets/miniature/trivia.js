// miniature/trivia.js — la miniatura viva di Trivia (27.11.2026).
// Il foglio vero dei giochi (art/roulette/carta.webp) con una partita che si gioca da sola, coi pezzi di games/trivia:
// i cartellini degli argomenti con le icone vere della chat, la domanda col tempo che cala, le risposte di carta (giusta =
// verde a pennarello, le altre si spengono), i pallini della partita, il saldo che sale con la moneta $pzk vera. Le due
// domande sono quelle delle catture vere (i gradi centesimali dell'angolo giro, il parmigiano col latte di capra).
// Il momento grosso: la pagella «8 su 8» che sbatte sul foglio, il timbro «perfetta», coriandoli e il bonus.
// Col mouse sopra: il foglio si alza, il tempo si ferma e il pennarello rosso cancella due risposte sbagliate (50 e 50).

const VW = 480, VH = 270
const NERO = '#161616', VERDE = '#23864a', GIALLO = '#ffd400', ROSSO = '#b3121f', MATITA = '#3a3632', BLU = '#1446a0'
const FA = 'Anton', MK = 'Permanent Marker', SE = 'Special Elite'
const ARG = [['di tutto', 'chat-slot/dado'], ['cucina', 'chat-cibo/tortelli'], ['cultura', 'chat-stati/trofeo'], ['scienza', 'chat-stati/fulmine'],
  ['tech', 'chat-attrezzi/telefono'], ['giochi', 'chat-giochi/carte'], ['pzk', 'chat-stati/pzk'], ['geometra', 'chat-attrezzi/pala'],
  ['storia', 'chat-stati/clessidra'], ['natura', 'chat-pesci/rana'], ['musica', 'chat-slot/campana'], ['foto', 'chat-giochi/quiz']]
const DOMANDE = [
  { q: 'Quanti gradi centesimali (gon) ha un angolo giro?', r: ['100', '200', '400', '360'], giusta: 2, diff: 'facile · 20 $pzk', voce: 'domanda 1', esito: 'giusta: +27,5 $pzk' },
  { q: 'Vero o falso? Il parmigiano si fa col latte di capra.', r: ['vero', 'falso'], giusta: 1, vf: true, diff: 'facile · 20 $pzk', voce: 'vero o falso?', esito: 'giusta: +27,5 $pzk · 2 di fila' },
]
// i tempi (secondi): la scelta, le due domande, la pagella
const SCELTA = 2.7, DOM = 4.6, PAGELLA = 5.4, CICLO = SCELTA + 2 * DOM + PAGELLA
const SCEGLIE = 2.55, RISPONDE = 2.5, AVANTI = 4.25
const SALDI = [1000, 1027.5, 1055, 1155]
const it = (n) => { const [a, b] = String(Math.round(n * 10) / 10).split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (b ? `,${b}` : '') }
/** un'immagine del sito, pronta appena caricata (kit.img aspetta anche decode(), che nella foto senza finestra arriva solo alla fine) */
const carica = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src })

export default async function crea(m) {
  const { kit } = m
  const [carta, moneta, ...icone] = await Promise.all([carica('/art/roulette/carta.webp'), carica('/art/chat-stati/pzk.webp'), ...ARG.map(([, f]) => carica(`/art/${f}.webp`))])
  if (!carta) throw new Error('manca la carta')
  await Promise.race([Promise.all([FA, MK, SE].map((f) => kit.font(f))), new Promise((ok) => setTimeout(ok, 6000))])

  let k = 1, ox = 0, oy = 0, fondo = null, foglio = null, T = 0
  const righe = {} // la domanda andata a capo, una volta sola

  function rifai(w, h) {
    k = Math.min(w / VW, h / VH); ox = (w - VW * k) / 2; oy = (h - VH * k) / 2
    fondo = kit.strato(w, h, m.dpr, (g) => {
      const r = g.createRadialGradient(w * 0.5, h * 1.05, 0, w * 0.5, h * 0.6, Math.hypot(w, h) * 0.75)
      r.addColorStop(0, '#1c7a3e'); r.addColorStop(0.45, '#0b3d1e'); r.addColorStop(1, '#03170a')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
    })
    foglio = kit.strato(VW * k, (VH + 40) * k, m.dpr, (g) => {
      g.scale(k, k)
      g.save()
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 6
      const fx = 16, fy = 12, fw = 448, fh = 300, sx = fw / 1305, sy = fh / 928
      g.drawImage(carta, fx - 115 * sx, fy - 112 * sy, 1536 * sx, 1152 * sy)
      g.restore()
      kit.scritta(g, 'trivia', 32, 50, { font: FA, size: 33, color: NERO })
      kit.scritta(g, 'hai', 32, 241, { font: MK, size: 7, color: MATITA })
      kit.scritta(g, 'soldi finti: niente premi, niente pagamenti.', 448, 259, { font: MK, size: 7, color: MATITA, align: 'right' })
    })
  }

  /** va a capo dentro `larg` */
  function capo(g, testo, larg, font) {
    const chiave = `${font}|${larg}|${testo}`
    if (righe[chiave]) return righe[chiave]
    g.font = font
    const out = []
    let riga = ''
    for (const p of testo.split(' ')) {
      const prova = riga ? `${riga} ${p}` : p
      if (g.measureText(prova).width > larg && riga) { out.push(riga); riga = p } else riga = prova
    }
    if (riga) out.push(riga)
    return (righe[chiave] = out)
  }

  function cartellino(g, x, y, w, h, i, sel, comp) {
    if (comp <= 0) return
    const rot = [0.006, -0.004, 0.008, -0.012][i % 4]
    kit.con(g, x + w / 2, y + h / 2, rot + (sel ? -0.026 : 0), (0.6 + 0.4 * kit.ease.outBack(comp)) * (sel ? 1.04 : 1), () => {
      g.globalAlpha = kit.clamp(comp * 2)
      g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(-w / 2 + 1.5, -h / 2 + 1.5, w, h)
      g.fillStyle = sel ? GIALLO : 'rgba(255,255,255,.55)'; g.fillRect(-w / 2, -h / 2, w, h)
      g.lineWidth = 1.4; g.strokeStyle = NERO; g.strokeRect(-w / 2, -h / 2, w, h)
      if (icone[i]) { g.imageSmoothingEnabled = false; g.drawImage(icone[i], -w / 2 + 4, -7, 14, 14); g.imageSmoothingEnabled = true }
      const tutto = i === 0
      kit.scritta(g, ARG[i][0], -w / 2 + 21, tutto ? 4.5 : 3.5, { font: tutto ? FA : SE, size: tutto ? 12 : 9, color: NERO })
      g.globalAlpha = 1
    })
  }

  function tastoNero(g, testo, x, y, giu = 0, size = 15) {
    kit.con(g, x, y + giu, -0.035, 1, () => {
      g.font = `400 ${size}px "${FA}"`
      const tw = g.measureText(testo).width + size * 0.8
      if (!giu) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(2.5, 2.5, tw, size * 1.3) }
      g.fillStyle = NERO; g.fillRect(0, 0, tw, size * 1.3)
      kit.scritta(g, testo, tw / 2, size * 1.04, { font: FA, size, color: '#fff', align: 'center' })
    })
  }

  function moneta1(g, x, y, s, rot = 0) {
    if (!moneta) return
    kit.con(g, x, y, rot, s, () => { g.imageSmoothingEnabled = false; g.drawImage(moneta, -8, -8, 16, 16); g.imageSmoothingEnabled = true })
  }

  // ── le schermate ──
  function scelta(g, u, su) {
    const quale = u < 0.8 ? 0 : u < 1.15 ? 1 : u < 1.5 ? 3 : u < 1.85 ? 7 : 0
    for (let i = 0; i < ARG.length; i++) {
      const c = i % 4, r = Math.floor(i / 4)
      cartellino(g, 32 + c * 105, 66 + r * 29, 98, 22, i, i === quale, kit.clamp((u - 0.05 - i * 0.04) / 0.35))
    }
    g.globalAlpha = kit.clamp((u - 0.5) / 0.4)
    kit.scritta(g, '8 domande, 15 secondi l’una. Giusta: 20 · 40 · 80 $pzk, tutte giuste +100.', 32, 172, { font: SE, size: 8, color: MATITA })
    g.globalAlpha = 1
    tastoNero(g, 'via', 32, 184, u > SCEGLIE - 0.15 && u < SCEGLIE + 0.1 ? 2 : 0, 16)
  }

  function domanda(g, d, n, u, su) {
    const risposto = u >= RISPONDE + 0.2
    // in alto: «n di 8», i pallini, la difficoltà
    kit.scritta(g, `${n + 1} di 8`, 32, 74, { font: FA, size: 13, color: NERO })
    for (let i = 0; i < 8; i++) {
      const x = 78 + i * 12, y = 69.5
      const fatto = i < n || (i === n && risposto), ora = i === n && !risposto
      g.beginPath(); g.arc(x, y, 4.2, 0, kit.TAU)
      g.fillStyle = fatto ? VERDE : ora ? GIALLO : 'rgba(0,0,0,0)'; g.fill()
      g.lineWidth = 1.3; g.strokeStyle = fatto ? VERDE : NERO; g.stroke()
      if (i === n && risposto) { const q = kit.clamp((u - RISPONDE - 0.2) / 0.3); g.beginPath(); g.arc(x, y, 4.2 + 6 * q, 0, kit.TAU); g.strokeStyle = `rgba(35,134,74,${1 - q})`; g.stroke() }
    }
    kit.scritta(g, d.diff, 448, 74, { font: MK, size: 8, color: MATITA, align: 'right' })
    // il tempo: la barra rossa cala (col mouse sopra si ferma e diventa gialla)
    const resta = risposto ? 1 - RISPONDE / 6.5 : 1 - Math.min(u, RISPONDE + 0.2) / 6.5
    kit.tondo(g, 32, 80, 416, 6, 3); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill()
    g.save(); g.clip()
    g.fillStyle = su > 0.5 && !risposto ? '#d9a400' : ROSSO; g.fillRect(32, 80, 416 * resta, 6)
    g.restore()
    kit.tondo(g, 32, 80, 416, 6, 3); g.lineWidth = 1.3; g.strokeStyle = NERO; g.stroke()
    // la domanda, parola per parola
    const font = `400 17px "${FA}"`, lines = capo(g, d.q, 410, font)
    let parole = Math.floor(u / 0.07), y0 = d.vf ? 142 : 126
    for (let l = 0; l < lines.length; l++) {
      const ws = lines[l].split(' '), vis = ws.slice(0, Math.max(0, parole)).join(' ')
      parole -= ws.length
      if (vis) kit.scritta(g, vis, 32, y0 + l * 21, { font: FA, size: 17, color: NERO })
    }
    // le risposte di carta
    const n2 = d.r.length
    for (let i = 0; i < n2; i++) {
      const c = i % 2, r = Math.floor(i / 2)
      const x = 32 + c * 213, y = d.vf ? 176 : 160 + r * 36, w = 203, h = 29
      const comp = kit.clamp((u - 0.35 - i * 0.08) / 0.3)
      if (comp <= 0) continue
      const giusta = risposto && i === d.giusta, spenta = risposto && i !== d.giusta
      const premuto = !risposto && u > RISPONDE - 0.1 && i === d.giusta
      const pop = giusta ? kit.ease.outBack(kit.clamp((u - RISPONDE - 0.2) / 0.35)) : 0
      g.save()
      g.globalAlpha = comp * (spenta ? 0.42 : 1)
      kit.con(g, x + w / 2, y + h / 2 + (premuto ? 1.5 : 0) + (1 - kit.ease.out(comp)) * 10, giusta ? -0.018 * pop : 0, 1 + 0.02 * pop, () => {
        if (!premuto) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(-w / 2 + 2.5, -h / 2 + 2.5, w, h) }
        g.fillStyle = giusta ? VERDE : 'rgba(255,255,255,.5)'; g.fillRect(-w / 2, -h / 2, w, h)
        g.lineWidth = 1.4; g.strokeStyle = giusta ? VERDE : NERO; g.strokeRect(-w / 2, -h / 2, w, h)
        g.beginPath(); g.arc(-w / 2 + 15, 0, 9, 0, kit.TAU); g.fillStyle = giusta ? '#fff' : NERO; g.fill()
        kit.scritta(g, d.vf ? (i ? 'F' : 'V') : 'ABCD'[i], -w / 2 + 15, 4.2, { font: FA, size: 11, color: giusta ? VERDE : '#fff', align: 'center' })
        kit.scritta(g, d.r[i], -w / 2 + 30, 3.5, { font: SE, size: 10, color: giusta ? '#fff' : NERO })
        // col mouse sopra il pennarello rosso cancella due sbagliate (50 e 50)
        const via = !risposto && i !== d.giusta && (d.vf ? true : i !== (d.giusta + 1) % n2) ? kit.clamp(su * 1.4 - (i % 2) * 0.35) : 0
        if (via > 0) {
          g.strokeStyle = ROSSO; g.lineWidth = 3; g.lineCap = 'round'
          g.beginPath(); g.moveTo(-w / 2 + 8, 2); g.lineTo(-w / 2 + 8 + (w - 16) * via, -3); g.stroke()
        }
      })
      g.restore()
    }
    // la moneta vola dalla risposta giusta al saldo
    if (risposto && u < RISPONDE + 1.4) {
      const gi = d.giusta, x0 = 32 + (gi % 2) * 213 + 150, y0b = d.vf ? 190 : 175 + Math.floor(gi / 2) * 36
      for (let j = 0; j < 3; j++) {
        const q = kit.clamp((u - RISPONDE - 0.3 - j * 0.09) / 0.7)
        if (q <= 0 || q >= 1) continue
        const e = kit.ease.inOut(q)
        const x = kit.lerp(x0, 70, e), y = kit.lerp(y0b, 252, e) - Math.sin(e * Math.PI) * 40
        moneta1(g, x, y, 1 + Math.sin(q * Math.PI) * 0.6, q * 6)
      }
    }
    // «avanti»
    if (risposto) tastoNero(g, n ? 'pagella' : 'avanti', 392, 216, u > AVANTI - 0.1 && u < AVANTI + 0.1 ? 2 : 0, 14)
  }

  function pagella(g, u, su) {
    const sbatte = 1.0
    kit.scritta(g, 'tutte giuste!', 240, 92, { font: MK, size: 11, color: MATITA, align: 'center' })
    // il voto conta da 2 a 8, poi sbatte
    const conta = u < sbatte ? 2 + Math.floor(kit.clamp((u - 0.25) / (sbatte - 0.3)) * 6) : 8
    const q = kit.clamp((u - sbatte) / 0.22)
    const sc = u < sbatte ? 0.85 : 1 + 0.5 * (1 - kit.ease.out(q))
    if (u > 1.25) kit.evidenzia(g, 168, 134, 146, 26, kit.ease.out(kit.clamp((u - 1.25) / 0.3)))
    kit.con(g, 240, 152, -0.05, sc, () => {
      g.font = `400 70px "${FA}"`
      const a = g.measureText(String(conta)).width
      g.font = `400 26px "${FA}"`
      const b = g.measureText(' su 8').width
      const x = -(a + b) / 2
      kit.scritta(g, String(conta), x, 22, { font: FA, size: 70, color: u >= sbatte ? VERDE : NERO })
      kit.scritta(g, ' su 8', x + a, 22, { font: FA, size: 26, color: u >= sbatte ? VERDE : NERO })
    })
    // i conti
    const conti = [['296', '$pzk guadagnati'], ['24', 'xp'], ['+100', 'bonus perfetta'], ['8', 'serie migliore']]
    conti.forEach(([n, l], i) => {
      const c = kit.clamp((u - 1.3 - i * 0.12) / 0.3)
      if (c <= 0) return
      g.globalAlpha = c
      const x = 128 + i * 75
      kit.scritta(g, n, x, 196 - (1 - c) * 6, { font: FA, size: 15, color: i === 2 ? ROSSO : NERO, align: 'center' })
      kit.scritta(g, l, x, 206 - (1 - c) * 6, { font: SE, size: 6.5, color: MATITA, align: 'center' })
      g.globalAlpha = 1
    })
    if (u > 2.1) {
      g.globalAlpha = kit.clamp((u - 2.1) / 0.3)
      tastoNero(g, 'ancora', 188, 214, 0, 14)
      kit.scritta(g, 'cambia argomento', 246, 229, { font: MK, size: 8, color: BLU })
      g.fillStyle = BLU; g.fillRect(246, 231, 76, 1.2)
      g.globalAlpha = 1
    }
    // il timbro
    if (u > 1.55) {
      const tq = kit.clamp((u - 1.55) / 0.16)
      kit.con(g, 362, 128, -0.22, 1 + 1.1 * (1 - kit.ease.out(tq)), () => {
        g.globalCompositeOperation = 'multiply'
        kit.timbro(g, 'perfetta', 0, 0, 34, 0, ROSSO, tq)
        g.globalCompositeOperation = 'source-over'
      })
    }
  }

  function coriandoli(g, u, forza) {
    if (u < 1.0 || u > 4.6) return
    const r = kit.rng(31)
    const tt = u - 1.0
    for (let i = 0; i < 70 * forza; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 120 + r() * 170
      const x = 240 + Math.cos(ang) * v * tt + Math.sin(tt * 3 + i) * 6
      const y = 150 + Math.sin(ang) * v * tt + 160 * tt * tt
      if (y > 300) continue
      const col = [VERDE, GIALLO, ROSSO, '#ffffff', BLU][i % 5]
      g.save()
      g.translate(x, y); g.rotate(tt * (4 + r() * 6) + i)
      g.scale(1, Math.abs(Math.cos(tt * 7 + i)))
      g.fillStyle = col; g.globalAlpha = kit.clamp(4.6 - u)
      g.fillRect(-2.5, -1.5, 5, 3)
      g.restore()
    }
  }

  function frame(t, dt) {
    const { g, w, h, su } = m
    T = t
    const c = T % CICLO
    // quale schermata e da quanto
    let fase, u, n = 0
    if (c < SCELTA) { fase = 'scelta'; u = c }
    else if (c < SCELTA + 2 * DOM) { fase = 'domanda'; n = Math.floor((c - SCELTA) / DOM); u = c - SCELTA - n * DOM }
    else { fase = 'pagella'; u = c - SCELTA - 2 * DOM }

    kit.metti(g, fondo, 0, 0, w, h)
    g.save()
    g.translate(ox, oy); g.scale(k, k)

    // le luci del quiz in tv: fasci che girano dietro al foglio
    g.save()
    g.globalCompositeOperation = 'lighter'
    const lampo = fase === 'pagella' ? Math.max(0, 1 - Math.abs(u - 1.05) / 0.5) : 0
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + Math.sin(T * 0.6 + i * 1.7) * 0.9
      g.fillStyle = `rgba(${i % 2 ? '255,233,77' : '120,255,160'},${0.07 + 0.12 * lampo})`
      g.beginPath(); g.moveTo(240 + (i - 2.5) * 40, 300)
      g.lineTo(240 + Math.cos(a - 0.09) * 520, 300 + Math.sin(a - 0.09) * 520)
      g.lineTo(240 + Math.cos(a + 0.09) * 520, 300 + Math.sin(a + 0.09) * 520)
      g.closePath(); g.fill()
    }
    g.restore()

    // il foglio
    const shake = fase === 'pagella' && u > 1 && u < 1.3 ? Math.sin((u - 1) * 60) * (1.3 - u) * 4 : 0
    g.save()
    g.translate(VW / 2, VH / 2)
    g.rotate(Math.sin(T * 0.45) * 0.004 + 0.004 + shake * 0.002)
    g.scale(1 + 0.025 * su, 1 + 0.025 * su)
    g.translate(-VW / 2 + shake, -VH / 2 - 3 * su)
    if (su > 0.01) { g.fillStyle = `rgba(0,0,0,${0.25 * su})`; g.fillRect(24, 26, 440, 260) }
    kit.metti(g, foglio, 0, 0, VW, VH + 40)

    // la voce a pennarello
    let voce, da
    if (fase === 'scelta') { voce = 'di cosa parliamo?'; da = 0 }
    else if (fase === 'domanda') { const d = DOMANDE[n]; voce = u >= RISPONDE + 0.2 ? d.esito : d.voce; da = u >= RISPONDE + 0.2 ? RISPONDE + 0.2 : 0 }
    else { voce = 'pagella perfetta'; da = 0.9 }
    g.save()
    g.beginPath(); g.rect(102, 20, 6 + 240 * kit.ease.out(kit.clamp((u - da) / 0.5)), 40); g.clip()
    kit.scritta(g, voce, 108, 45, { font: MK, size: 11, color: ROSSO, rot: -0.026 })
    g.restore()

    // il saldo: sale quando paga
    let saldo
    if (fase === 'scelta') saldo = SALDI[0]
    else if (fase === 'domanda') saldo = kit.lerp(SALDI[n], SALDI[n + 1], kit.ease.inOut(kit.clamp((u - RISPONDE - 0.9) / 0.6)))
    else saldo = kit.lerp(SALDI[2], SALDI[3], kit.ease.inOut(kit.clamp((u - 2.0) / 0.8)))
    const batte = (fase === 'domanda' && u > RISPONDE + 0.9 && u < RISPONDE + 1.5) || (fase === 'pagella' && u > 2 && u < 2.8)
    kit.con(g, 32, 259, 0, batte ? 1.08 : 1, () => kit.scritta(g, `$pzk ${it(SALDI.some((v) => Math.abs(v - saldo) < 0.01) ? saldo : Math.round(saldo))}`, 0, 0, { font: FA, size: 15, color: batte ? VERDE : NERO }))

    // la schermata, con un piccolo scorrimento quando cambia
    const entra = (q) => (1 - kit.ease.out(kit.clamp(q / 0.3))) * 30
    g.save()
    if (fase === 'scelta') { g.translate(entra(c < 0.3 && T > CICLO ? c : 1), 0); scelta(g, u, su) }
    else if (fase === 'domanda') { g.translate(entra(u), 0); g.globalAlpha = kit.clamp(u / 0.2); domanda(g, DOMANDE[n], n, u, su) }
    else { g.globalAlpha = kit.clamp(u / 0.2) * kit.clamp((PAGELLA - u) / 0.3); pagella(g, u, su) }
    g.restore()

    // la luce che scorre sul foglio
    const lx = -150 + kit.ciclo(T, 6.5) * 800
    const lg = g.createLinearGradient(lx - 80, 0, lx + 80, 50)
    lg.addColorStop(0, 'rgba(255,250,230,0)'); lg.addColorStop(0.5, `rgba(255,250,230,${0.12 + 0.3 * lampo})`); lg.addColorStop(1, 'rgba(255,250,230,0)')
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = lg; g.fillRect(16, 12, 448, 270); g.restore()
    g.restore() // (fine foglio)

    // i coriandoli e le monete del bonus, sopra a tutto
    if (fase === 'pagella') {
      coriandoli(g, u, 1 + 0.5 * su)
      for (let j = 0; j < 6; j++) {
        const q = kit.clamp((u - 2.0 - j * 0.08) / 0.7)
        if (q <= 0 || q >= 1) continue
        const e = kit.ease.in(q)
        moneta1(g, kit.lerp(300 + j * 22, 60, e), kit.lerp(-10, 255, e) - Math.sin(e * Math.PI) * 20, 1.8 - q * 0.6, q * 8 + j)
      }
    }
    g.restore()
    kit.vignetta(g, w, h, 0.35)
    kit.granella(g, w, h, 0.05, t)
  }

  rifai(m.w || 480, m.h || 270)
  return { frame, ridimensiona: rifai, titolo: false, fermo: SCELTA + 2 * DOM + 2.4 }
}
