// miniature/synth.js — il banco del Synth che suona da solo, in silenzio.
// Com'è l'app vera (games/synth): l'oscilloscopio nero a fosfori dentro la cornice di carta col nastro, il foglietto
// «oscillatore» coi tasti sin/tri/saw/quadra e il cursore del taglio a puntina rossa, la tastiera da 25 tasti
// (do3–do5) coi tasti accesi in giallo. L'arpeggiatore gira su quattro accordi; ogni accordo cambia l'onda.
// La traccia è calcolata come nel suono vero: due oscillatori (detune ±7 cent) e un passa-basso risonante.
// Il «wow»: un glissando su tutta la tastiera e l'accordo pieno di do. Col mouse sopra: arpeggio più veloce, filtro
// aperto, fosfori più accesi.

const LIME = '#ccff00'
const SCHERMO = '#10130f'
const FOGLIETTO = '#fffdf6'
const INK = '#161616'
const ROSSO = '#b3121f'
const NOMI = ['do', 'do#', 're', 're#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']
const BIANCHE = [0, 2, 4, 5, 7, 9, 11]
const BASE = 48 // do3, come costruisciPiano() nell'app
const ONDE = [['sawtooth', 'saw'], ['square', 'quadra'], ['triangle', 'tri'], ['sine', 'sin']]
const ETICHETTE = ['sin', 'tri', 'saw', 'quadra']
const TIPI_ETI = ['sine', 'triangle', 'sawtooth', 'square']
// le note tenute: la minore, fa, do, sol (l'arpeggiatore «su» le ripete in ordine)
const ACCORDI = [
  { nome: 'la', note: [57, 60, 64, 69, 72] },
  { nome: 'fa', note: [53, 57, 60, 65, 69] },
  { nome: 'do', note: [48, 52, 55, 60, 64, 67] },
  { nome: 'sol', note: [55, 59, 62, 67, 71] },
]
const PIENO = [48, 52, 55, 60, 64, 67, 72] // l'accordo del wow
const PASSI_ACCORDO = 16
const PASSI_WOW = 10
const GIRO = ACCORDI.length * PASSI_ACCORDO + PASSI_WOW
const freqMidi = (n) => 440 * 2 ** ((n - 69) / 12)
const nomeNota = (n) => `${NOMI[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`
const hz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(2)} kHz` : `${Math.round(f)} Hz`)
const migliaia = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// le armoniche di ogni onda (serie di Fourier), come gli oscillatori della Web Audio
function armonica(tipo, n) {
  if (tipo === 'sine') return n === 1 ? 1 : 0
  if (tipo === 'square') return n % 2 ? 4 / Math.PI / n : 0
  if (tipo === 'triangle') return n % 2 ? (8 / (Math.PI * Math.PI)) * ((n - 1) / 2 % 2 ? -1 : 1) / (n * n) : 0
  return (2 / Math.PI) * (n % 2 ? 1 : -1) / n // sawtooth
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, TAU, fract, smooth, ease } = kit
  await Promise.all([kit.font('Mainframe', 700), kit.font('Anton'), kit.font('Special Elite'), kit.font('Permanent Marker')])

  const N_ARM = 14, N_TAB = 128
  const tab = new Float32Array(N_TAB + 1)
  const tracce = [] // le ultime tracce, per la persistenza dei fosfori
  let fase = 0, su = 0
  let L = null // gli strati fissi e la geometria
  let W = 0, H = 0, D = 0

  // ── la geometria (in proporzione alla larghezza: u = 1% di w) ──
  function geometria(w, h) {
    const u = w / 100
    const kbTop = h - 19.5 * u
    const g = {
      u, w, h,
      scr: { x: 45 * u, y: 4.6 * u, w: 51 * u, h: kbTop - 2.8 * u - 4.6 * u },
      fog: { x: 3.6 * u, y: 21.6 * u, w: 37 * u, h: kbTop - 2.4 * u - 21.6 * u },
      kb: { x: 3 * u, y: kbTop, w: 94 * u, h: h - 1.6 * u - kbTop },
    }
    g.tasti = g.kb.y + 2.9 * u
    g.tastiH = g.kb.y + g.kb.h - g.tasti
    g.kw = g.kb.w / 15
    // ogni tasto: x, larghezza, nero?
    g.chiavi = []
    let ib = 0
    for (let i = 0; i <= 24; i++) {
      const n = BASE + i
      const nero = !BIANCHE.includes(n % 12)
      if (!nero) { g.chiavi.push({ n, nero, x: g.kb.x + ib * g.kw, l: g.kw }); ib++ } else {
        const bw = g.kw * 0.62
        g.chiavi.push({ n, nero, x: g.kb.x + ib * g.kw - bw / 2, l: bw })
      }
    }
    return g
  }

  function cornice(g, x, y, w, h, u) {
    // la foto attaccata al foglio: bordo di carta bianca (più alto sotto) e due pezzi di nastro
    const b = Math.max(2, 1.25 * u)
    g.fillStyle = FOGLIETTO
    g.fillRect(x - b, y - b, w + b * 2, h + b * 2 + b * 0.3)
  }
  function nastri(g, x, y, w, u) {
    kit.nastro(g, x + 1 * u, y - 0.6 * u, 11 * u, 3.4 * u, -0.66)
    kit.nastro(g, x + w - 1 * u, y - 0.6 * u, 11 * u, 3.4 * u, 0.66)
  }

  function costruisci() {
    W = m.w; H = m.h; D = m.dpr
    const G = geometria(W, H)
    const u = G.u
    // sfondo, schermo, foglietto, cassa della tastiera
    const fondo = kit.strato(W, H, D, (g) => {
      g.fillStyle = m.c2
      g.fillRect(0, 0, W, H)
      let r = g.createRadialGradient(G.scr.x + G.scr.w * 0.5, G.scr.y + G.scr.h * 0.5, 0, G.scr.x + G.scr.w * 0.5, G.scr.y + G.scr.h * 0.5, W * 0.62)
      r.addColorStop(0, 'rgba(204,255,0,.16)')
      r.addColorStop(1, 'rgba(204,255,0,0)')
      g.fillStyle = r
      g.fillRect(0, 0, W, H)
      r = g.createLinearGradient(0, 0, W * 0.5, H)
      r.addColorStop(0, 'rgba(204,255,0,.10)')
      r.addColorStop(1, 'rgba(204,255,0,0)')
      g.fillStyle = r
      g.fillRect(0, 0, W, H)
      // le righe della copertina di prima, sottili
      g.fillStyle = 'rgba(204,255,0,.045)'
      for (let y = 0; y < H; y += Math.max(2, 0.9 * u)) g.fillRect(0, y, W, Math.max(0.5, 0.18 * u))
    })
    // lo schermo nella cornice, con l'ombra (strato a parte: col mouse sopra si avvicina)
    const schermoS = kit.strato(W, H, D, (g) => {
      const s = G.scr
      g.save()
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 3 * u; g.shadowOffsetY = 1.2 * u
      g.translate(s.x + s.w / 2, s.y + s.h / 2); g.rotate(0.012); g.translate(-(s.x + s.w / 2), -(s.y + s.h / 2))
      cornice(g, s.x, s.y, s.w, s.h, u)
      g.restore()
      g.save()
      g.translate(s.x + s.w / 2, s.y + s.h / 2); g.rotate(0.012); g.translate(-(s.x + s.w / 2), -(s.y + s.h / 2))
      g.fillStyle = SCHERMO
      g.fillRect(s.x, s.y, s.w, s.h)
      g.strokeStyle = 'rgba(204,255,0,.14)'
      g.lineWidth = Math.max(0.6, 0.14 * u)
      for (let i = 0; i <= 8; i++) { const x = s.x + (s.w * i) / 8; g.beginPath(); g.moveTo(x, s.y); g.lineTo(x, s.y + s.h); g.stroke() }
      for (let i = 0; i <= 4; i++) { const y = s.y + (s.h * i) / 4; g.beginPath(); g.moveTo(s.x, y); g.lineTo(s.x + s.w, y); g.stroke() }
      // le tacche al centro, come un oscilloscopio vero
      g.strokeStyle = 'rgba(204,255,0,.22)'
      for (let i = 0; i <= 40; i++) { const x = s.x + (s.w * i) / 40; g.beginPath(); g.moveTo(x, s.y + s.h / 2 - 0.5 * u); g.lineTo(x, s.y + s.h / 2 + 0.5 * u); g.stroke() }
      // il vetro: ombra dentro e riflesso
      const v = g.createRadialGradient(s.x + s.w / 2, s.y + s.h / 2, s.h * 0.2, s.x + s.w / 2, s.y + s.h / 2, s.w * 0.7)
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)')
      g.fillStyle = v
      g.fillRect(s.x, s.y, s.w, s.h)
      // la targhetta dell'etichettatrice
      if (W > 260) {
        g.font = `400 ${1.9 * u}px "Special Elite"`
        if ('letterSpacing' in g) g.letterSpacing = `${0.25 * u}px`
        const t = 'OSCILLOSCOPIO', tw = g.measureText(t).width
        g.fillStyle = '#1b1b1b'
        g.fillRect(s.x + s.w - tw - 3.2 * u, s.y + 1.3 * u, tw + 1.8 * u, 2.8 * u)
        g.fillStyle = 'rgba(233,228,214,.85)'
        g.textBaseline = 'middle'
        g.fillText(t, s.x + s.w - tw - 2.3 * u, s.y + 2.8 * u)
        if ('letterSpacing' in g) g.letterSpacing = '0px'
      }
      nastri(g, s.x, s.y, s.w, u)
      g.restore()

    })
    // il foglietto «oscillatore» (ombra, carta, nastro)
    const foglioS = kit.strato(W, H, D, (g) => {
      const f = G.fog
      g.save()
      g.translate(f.x + f.w / 2, f.y + f.h / 2); g.rotate(-0.022); g.translate(-(f.x + f.w / 2), -(f.y + f.h / 2))
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 2.4 * u; g.shadowOffsetY = 1 * u
      g.fillStyle = FOGLIETTO
      g.fillRect(f.x, f.y, f.w, f.h)
      g.shadowColor = 'transparent'
      const lc = g.createLinearGradient(f.x, f.y, f.x + f.w * 0.4, f.y + f.h)
      lc.addColorStop(0, 'rgba(255,255,255,.7)'); lc.addColorStop(1, 'rgba(90,70,30,.07)')
      g.fillStyle = lc
      g.fillRect(f.x, f.y, f.w, f.h)
      // il titolo a pennarello con l'evidenziatore
      const ts = Math.max(5, 2.5 * u)
      g.font = `400 ${ts}px "Permanent Marker"`
      const tw = g.measureText('oscillatore').width
      kit.evidenzia(g, f.x + 1.6 * u, f.y + 1.2 * u, tw + 1.2 * u, ts * 1.05)
      g.fillStyle = INK
      g.textBaseline = 'alphabetic'
      g.fillText('oscillatore', f.x + 2.2 * u, f.y + 1.2 * u + ts * 0.86)
      kit.nastro(g, f.x + f.w * 0.5, f.y - 0.3 * u, 9 * u, 2.6 * u, -0.05)
      g.restore()

    })
    // la cassa della tastiera: il pannello scuro sopra i tasti, con le serigrafie
    const cassa = kit.strato(W, H, D, (g) => {
      const k = G.kb
      g.save()
      g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 3 * u; g.shadowOffsetY = 1.4 * u
      g.fillStyle = '#1c1f1a'
      kit.tondo(g, k.x - 1 * u, k.y, k.w + 2 * u, k.h + 0.8 * u, 0.8 * u)
      g.fill()
      g.restore()
      const cg = g.createLinearGradient(0, k.y, 0, G.tasti)
      cg.addColorStop(0, '#2c3128'); cg.addColorStop(1, '#151813')
      g.fillStyle = cg
      kit.tondo(g, k.x - 1 * u, k.y, k.w + 2 * u, G.tasti - k.y + 0.6 * u, 0.8 * u)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,.12)'
      g.fillRect(k.x, k.y + 0.25 * u, k.w, Math.max(0.5, 0.15 * u))
      if (W > 220) {
        g.font = `400 ${1.55 * u}px "Special Elite"`
        g.fillStyle = 'rgba(233,228,214,.55)'
        g.textBaseline = 'middle'
        if ('letterSpacing' in g) g.letterSpacing = `${0.2 * u}px`
        g.fillText('ARP', k.x + 4.2 * u, k.y + 1.45 * u)
        g.fillText('MIDI', k.x + 12.6 * u, k.y + 1.45 * u)
        g.textAlign = 'right'
        g.fillText('PZK · SYNTH 2 OSC', k.x + k.w - 1.4 * u, k.y + 1.45 * u)
        g.textAlign = 'left'
        if ('letterSpacing' in g) g.letterSpacing = '0px'
      }
    })

    // i tasti bianchi a riposo (con il bordo davanti) e i tasti neri
    const bianchi = kit.strato(W, H, D, (g) => {
      g.fillStyle = '#f7f3e7'
      g.fillRect(G.kb.x, G.tasti, G.kb.w, G.tastiH)
      for (const c of G.chiavi) if (!c.nero) tastoBianco(g, G, c, 0, false)
    })
    const neri = kit.strato(W, H, D, (g) => {
      for (const c of G.chiavi) if (c.nero) tastoNero(g, G, c, 0)
      // l'ombra della cassa sui tasti
      const o = g.createLinearGradient(0, G.tasti, 0, G.tasti + 1.6 * G.u)
      o.addColorStop(0, 'rgba(0,0,0,.45)'); o.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = o
      g.fillRect(G.kb.x, G.tasti, G.kb.w, 1.6 * G.u)
    })
    // il titolo, col bagliore dei fosfori (lo shadowBlur costa: si fa una volta qui)
    const ts = 11.5 * G.u
    const titolo = m.titolo || 'Synth'
    const scrittaT = kit.strato(W, H, D, (g) => {
      g.font = `700 ${ts}px "Mainframe"`
      g.textBaseline = 'alphabetic'
      g.fillStyle = 'rgba(0,0,0,.55)'
      g.fillText(titolo, 5 * G.u, 4.8 * G.u + ts * 0.86 + 0.7 * G.u)
      g.fillStyle = LIME
      g.fillText(titolo, 5 * G.u, 4.8 * G.u + ts * 0.86)
      if (W > 300) {
        g.font = `400 ${2.15 * G.u}px "Special Elite"`
        g.fillStyle = 'rgba(204,255,0,.62)'
        g.fillText('2 osc · adsr · filtro · arp', 5.2 * G.u, 4.8 * G.u + ts * 0.86 + 3.6 * G.u)
      }
    })
    const alone = kit.strato(W, H, D, (g) => {
      g.font = `700 ${ts}px "Mainframe"`
      g.shadowColor = 'rgba(204,255,0,.95)'
      g.shadowBlur = 3.4 * G.u
      g.fillStyle = 'rgba(204,255,0,.5)'
      g.fillText(titolo, 5 * G.u, 4.8 * G.u + ts * 0.86)
    })
    const vign = kit.strato(W, H, D, (g) => kit.vignetta(g, W, H, 0.42))
    L = { G, fondo, schermoS, foglioS, cassa, bianchi, neri, scrittaT, alone, vign }
  }

  function tastoBianco(g, G, c, giu, acceso, k = 1) {
    const u = G.u
    const x = c.x + 0.08 * u, w = c.l - 0.16 * u
    const y = G.tasti, h = G.tastiH
    const labbro = lerp(1.3 * u, 0.55 * u, giu)
    const gr = g.createLinearGradient(0, y, 0, y + h)
    if (acceso) { gr.addColorStop(0, `rgba(255,240,168,${k})`); gr.addColorStop(1, `rgba(240,210,74,${k})`) } else { gr.addColorStop(0, '#fffdf5'); gr.addColorStop(1, '#ebe4d1') }
    g.fillStyle = gr
    kit.tondo(g, x, y - 1, w, h + 1 - labbro, 0.5 * u)
    g.fill()
    // il bordo davanti del tasto (si accorcia quando il tasto va giù)
    g.fillStyle = acceso ? `rgba(196,160,30,${k})` : '#cfc7b2'
    kit.tondo(g, x, y + h - labbro - 0.4 * u, w, labbro + 0.4 * u, 0.5 * u)
    g.fill()
    if (!acceso) {
      g.fillStyle = 'rgba(22,22,22,.28)'
      g.fillRect(c.x + c.l - 0.1 * u, y, Math.max(0.6, 0.12 * u), h - labbro)
      if (G.w > 300 && c.n % 12 === 0) {
        g.font = `400 ${1.5 * u}px "Special Elite"`
        g.fillStyle = '#8a8479'
        g.textAlign = 'center'
        g.textBaseline = 'alphabetic'
        g.fillText(nomeNota(c.n), c.x + c.l / 2, y + h - labbro - 0.9 * u)
        g.textAlign = 'left'
      }
    }
  }
  function tastoNero(g, G, c, giu, k = 0) {
    const u = G.u
    const h = G.tastiH * 0.62
    const gr = g.createLinearGradient(0, G.tasti, 0, G.tasti + h)
    gr.addColorStop(0, k ? '#6b6b6b' : '#2c2c2c'); gr.addColorStop(1, k ? '#262626' : '#0c0c0c')
    g.fillStyle = 'rgba(0,0,0,.35)'
    g.fillRect(c.x + 0.3 * u, G.tasti, c.l, h + 0.7 * u)
    g.fillStyle = gr
    kit.tondo(g, c.x, G.tasti - 1, c.l, h + 1 - giu * 0.4 * u, 0.35 * u)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,.14)'
    g.fillRect(c.x + 0.25 * u, G.tasti + h - (1.2 + giu * -0.4) * u, c.l - 0.5 * u, Math.max(0.6, 0.25 * u))
    if (k) {
      g.fillStyle = `rgba(204,255,0,${0.5 * k})`
      g.fillRect(c.x + 0.25 * u, G.tasti + h - 1.25 * u, c.l - 0.5 * u, Math.max(0.6, 0.3 * u))
    }
  }

  // ── la musica, in passi dell'arpeggiatore ──
  // stato del passo: che note sono tenute, quale suona, che onda, da quanto
  function statoAl(f) {
    const giro = Math.floor(f / GIRO)
    const p = f - giro * GIRO
    const passo = Math.floor(p)
    const dentro = p - passo // 0→1 dentro il passo
    if (passo < ACCORDI.length * PASSI_ACCORDO) {
      const ia = Math.floor(passo / PASSI_ACCORDO)
      const ip = passo % PASSI_ACCORDO
      const acc = ACCORDI[ia]
      return { wow: 0, ia, ip, tenute: acc.note, suona: [acc.note[ip % acc.note.length]], dentro, passo, giro, cambio: ip + dentro }
    }
    // il wow: glissando sui 25 tasti (metà) e poi l'accordo pieno
    const k = (p - ACCORDI.length * PASSI_ACCORDO) / PASSI_WOW
    if (k < 0.45) {
      const i = Math.floor((k / 0.45) * 25)
      return { wow: k, ia: 0, ip: 0, tenute: [], suona: [BASE + clamp(i, 0, 24)], dentro: fract((k / 0.45) * 25), passo, giro, cambio: 99, gliss: true }
    }
    return { wow: k, ia: 0, ip: 0, tenute: PIENO, suona: PIENO, dentro: (k - 0.45) / 0.55, passo, giro, cambio: 99, pieno: true }
  }

  // la forma d'onda di un periodo: armoniche dell'onda (con passaggio morbido) filtrate dal passa-basso risonante
  function riempiTabella(tipoA, tipoB, mix, f, taglio, q) {
    const amp = new Float32Array(N_ARM + 1)
    let somma = 0
    for (let n = 1; n <= N_ARM; n++) {
      const a = lerp(armonica(tipoA, n), armonica(tipoB, n), mix)
      const r = (n * f) / taglio
      const gain = Math.min(q * 0.75, 1 / Math.sqrt((1 - r * r) ** 2 + (r / q) ** 2))
      amp[n] = a * gain
      somma += Math.abs(amp[n])
    }
    let max = 0
    for (let i = 0; i <= N_TAB; i++) {
      const x = (i / N_TAB) * TAU
      let v = 0
      for (let n = 1; n <= N_ARM; n++) if (amp[n]) v += amp[n] * Math.sin(n * x)
      tab[i] = v
      if (Math.abs(v) > max) max = Math.abs(v)
    }
    const k = 1 / Math.max(0.35, max)
    for (let i = 0; i <= N_TAB; i++) tab[i] *= k
    return somma
  }
  const leggi = (x) => {
    const p = fract(x) * N_TAB
    const i = Math.floor(p)
    return lerp(tab[i], tab[i + 1], p - i)
  }

  return {
    titolo: false,
    fermo: 3.2,
    frame(t, dt) {
      if (!L || W !== m.w || H !== m.h || D !== m.dpr) costruisci()
      const g = m.g
      const { G } = L
      const u = G.u
      su = m.su
      // il tempo dell'arpeggiatore: 132 bpm a crome; col mouse sopra corre
      const bpm = 132 * (1 + su * 0.55)
      fase += dt * (bpm / 60) * 2
      const S = statoAl(fase)
      const ora = S.suona
      // l'inviluppo del colpo (attacco breve, decadimento) e la luce del wow
      const inv = S.pieno ? 0.55 + 0.45 * Math.exp(-S.dentro * 2.2) : 0.3 + 0.7 * Math.exp(-S.dentro * 3.2)
      const lampo = S.pieno ? Math.exp(-S.dentro * 5) : 0
      const colpo = S.pieno ? Math.exp(-S.dentro * 3.5) : 0

      // l'onda: ogni accordo la sua, con un passaggio di due passi (il tasto premuto sul foglietto cambia)
      const ia = S.ia
      const tipo = ONDE[ia][0], prima = ONDE[(ia + ONDE.length - 1) % ONDE.length][0]
      const mix = S.gliss || S.pieno ? 1 : smooth(0, 2, S.cambio)
      // il taglio del filtro respira (e col mouse sopra si apre)
      const taglio = lerp(520, 5200, 0.5 - 0.5 * Math.cos(t * TAU / 9.5)) * (1 + su * 0.9) * (S.pieno ? 1.6 : 1)
      const q = 4

      g.drawImage(L.fondo, 0, 0, W, H)
      g.drawImage(L.cassa, 0, 0, W, H)

      // ── il titolo: Mainframe lime, l'alone respira con le note ──
      g.save()
      g.globalAlpha = clamp(0.25 + inv * 0.45 + su * 0.25 + lampo * 0.4)
      g.drawImage(L.alone, 0, 0, W, H)
      g.restore()
      g.drawImage(L.scrittaT, 0, 0, W, H)

      // ── lo schermo ──
      const s = G.scr
      // col mouse sopra lo schermo si stacca dal muro (parallasse); l'accordo pieno lo fa saltare
      g.save()
      verso(g, s, -0.9 * u * su, -0.8 * u * su, 1 + 0.03 * su + 0.035 * colpo * Math.cos(S.dentro * 18), 0.006 * su)
      g.drawImage(L.schermoS, 0, 0, W, H)
      g.save()
      g.translate(s.x + s.w / 2, s.y + s.h / 2); g.rotate(0.012); g.translate(-(s.x + s.w / 2), -(s.y + s.h / 2))
      g.beginPath(); g.rect(s.x, s.y, s.w, s.h); g.clip()
      const nota = ora[0]
      const f0 = freqMidi(nota)
      riempiTabella(prima, tipo, mix, f0, taglio, q)
      const cy = s.y + s.h / 2
      const amp = s.h * 0.4 * inv
      const cicli = S.pieno ? 2.2 : clamp(f0 / 118, 1.1, 4.6)
      const battito = f0 * (2 ** (14 / 1200) - 1) // i due oscillatori a ±7 cent battono
      const deriva = 0.16 * Math.sin(t * battito * TAU) + 0.04
      const P = Math.max(48, Math.round(s.w / (u * 0.55)))
      const punti = new Float32Array(P * 2)
      for (let i = 0; i < P; i++) {
        const k = i / (P - 1)
        const x = k * cicli
        let v
        if (S.pieno) {
          // l'accordo pieno: do, mi, sol, do sommati (rapporti veri delle frequenze)
          v = (leggi(x) + leggi(x * 1.26 + deriva * 0.3) * 0.8 + leggi(x * 1.498 + 0.2) * 0.7 + leggi(x * 2 + deriva) * 0.5) / 2.2
        } else v = 0.62 * leggi(x) + 0.38 * leggi(x + deriva)
        // la traccia entra un po' sfumata ai bordi, come un trigger vero
        punti[i * 2] = s.x + k * s.w
        punti[i * 2 + 1] = cy - v * amp
      }
      // l'accordo pieno si apre nelle sue quattro note, che poi tornano a sommarsi
      if (S.pieno) {
        const apre = 1 - smooth(0.05, 0.75, S.dentro)
        const rap = [1, 1.26, 1.498, 2]
        for (let j = 0; j < 4; j++) {
          const off = (j - 1.5) * s.h * 0.2 * apre
          g.strokeStyle = `rgba(${j % 2 ? '255,240,168' : '204,255,0'},${0.18 + 0.5 * apre})`
          g.lineWidth = Math.max(0.8, 0.32 * u)
          g.beginPath()
          for (let i = 0; i < P; i += 2) {
            const k = i / (P - 1)
            const y = cy + off - leggi(k * cicli * rap[j] + j * 0.2) * amp * 0.45
            i ? g.lineTo(s.x + k * s.w, y) : g.moveTo(s.x + k * s.w, y)
          }
          g.stroke()
        }
      }
      tracce.unshift(punti)
      const tieni = 3 + Math.round(su * 3)
      while (tracce.length > tieni) tracce.pop()
      // la persistenza: le tracce di prima, più deboli
      for (let j = tracce.length - 1; j >= 0; j--) {
        const pt = tracce[j]
        const a = j ? (0.22 * (1 - j / (tieni + 1))) * (1 + su) : 1
        if (j) {
          g.strokeStyle = `rgba(204,255,0,${a})`
          g.lineWidth = Math.max(0.8, 0.28 * u)
          linea(g, pt)
          continue
        }
        // la traccia viva: tre passate per il bagliore (niente shadowBlur)
        g.lineJoin = 'round'
        g.strokeStyle = `rgba(204,255,0,${0.1 + su * 0.06 + lampo * 0.15})`
        g.lineWidth = Math.max(3, 1.6 * u)
        linea(g, pt)
        g.strokeStyle = `rgba(214,255,60,${0.32 + su * 0.1})`
        g.lineWidth = Math.max(1.6, 0.7 * u)
        linea(g, pt)
        g.strokeStyle = lampo > 0.2 ? '#f4ffd0' : LIME
        g.lineWidth = Math.max(1, 0.3 * u)
        linea(g, pt)
      }
      // il lampo del wow: il vetro si illumina
      if (lampo > 0.01) {
        g.fillStyle = `rgba(204,255,0,${0.16 * lampo})`
        g.fillRect(s.x, s.y, s.w, s.h)
      }
      g.fillStyle = `rgba(204,255,0,${0.03 + 0.03 * su})`
      g.fillRect(s.x, s.y, s.w, s.h)
      // il display in basso a sinistra: nota, frequenza, nome (come .sy-display)
      const ns = Math.max(9, 5.2 * u)
      g.font = `400 ${ns}px "Anton"`
      g.textBaseline = 'alphabetic'
      const testoNota = S.pieno ? 'do' : nomeNota(nota)
      g.fillStyle = 'rgba(204,255,0,.22)'
      g.fillText(testoNota, s.x + 2 * u, s.y + s.h - 1.7 * u + 0.3 * u)
      g.fillStyle = LIME
      g.fillText(testoNota, s.x + 2 * u, s.y + s.h - 1.7 * u)
      const nw = g.measureText(testoNota).width
      if (W > 220) {
        g.font = `400 ${Math.max(6, 2.1 * u)}px "Special Elite"`
        g.fillStyle = '#9fb35e'
        g.fillText(S.pieno ? 'do maggiore · 7 voci' : `${hz(f0)} · ${NOMI[nota % 12]}`, s.x + 3.2 * u + nw, s.y + s.h - 1.9 * u)
      }
      righe(g, s, u)
      g.restore()
      g.restore()

      // ── il foglietto: i quattro tasti dell'onda e il cursore del taglio ──
      const fo = G.fog
      g.save()
      verso(g, fo, 0.6 * u * su, 0.5 * u * su, 1 + 0.015 * su, -0.012 * su)
      g.drawImage(L.foglioS, 0, 0, W, H)
      g.translate(fo.x + fo.w / 2, fo.y + fo.h / 2); g.rotate(-0.022); g.translate(-(fo.x + fo.w / 2), -(fo.y + fo.h / 2))
      const kh = Math.min(4.6 * u, fo.h * 0.3)
      const ky = fo.y + fo.h * 0.36
      const gap = 1.1 * u
      const kws = [5.6, 5.6, 5.6, 9.2].map((v) => v * u)
      const tot = kws.reduce((a, b) => a + b, 0) + gap * 3
      let kx = fo.x + (fo.w - tot) / 2
      const attivo = mix > 0.5 ? tipo : prima
      for (let i = 0; i < 4; i++) {
        const premuto = TIPI_ETI[i] === attivo
        const dy = premuto ? 0.35 * u : 0
        g.fillStyle = INK
        g.fillRect(kx, ky + 0.55 * u, kws[i], kh) // l'ombra piena del tasto
        g.fillStyle = premuto ? INK : FOGLIETTO
        g.fillRect(kx, ky + dy, kws[i], kh)
        g.strokeStyle = INK
        g.lineWidth = Math.max(0.8, 0.3 * u)
        g.strokeRect(kx, ky + dy, kws[i], kh)
        if (W > 200) {
          g.font = `400 ${Math.max(5, 2.2 * u)}px "Special Elite"`
          g.fillStyle = premuto ? FOGLIETTO : INK
          g.textAlign = 'center'
          g.textBaseline = 'middle'
          g.fillText(ETICHETTE[i], kx + kws[i] / 2, ky + dy + kh / 2 + 0.15 * u)
          g.textAlign = 'left'
        }
        kx += kws[i] + gap
      }
      // il cursore: riga a matita e puntina rossa
      const sy = fo.y + fo.h * 0.8
      const sx0 = fo.x + 10.5 * u, sx1 = fo.x + fo.w - 9.6 * u
      if (W > 200) {
        g.font = `400 ${Math.max(5, 1.9 * u)}px "Special Elite"`
        g.fillStyle = '#5a544c'
        g.textBaseline = 'middle'
        g.fillText('taglio', fo.x + 2.2 * u, sy)
        g.textAlign = 'right'
        g.fillStyle = INK
        g.fillText(`${migliaia(taglio)} Hz`, fo.x + fo.w - 1.6 * u, sy)
        g.textAlign = 'left'
      }
      g.fillStyle = 'rgba(22,22,22,.55)'
      g.fillRect(sx0, sy - 0.25 * u, sx1 - sx0, Math.max(1, 0.5 * u))
      const pk = clamp(Math.log(taglio / 80) / Math.log(14000 / 80))
      puntina(g, lerp(sx0, sx1, pk), sy, 1.45 * u)
      g.restore()
      // il timbro rosso dell'accordo pieno: sbatte sul foglietto e poi sbiadisce
      const pg = fase - Math.floor(fase / GIRO) * GIRO
      const inizio = ACCORDI.length * PASSI_ACCORDO + PASSI_WOW * 0.45
      const dopo = pg >= inizio ? pg - inizio : pg < 14 && fase > GIRO ? pg + GIRO - inizio : -1
      if (dopo >= 0 && dopo < 18) {
        const ent = clamp(dopo / 0.7)
        const scala = lerp(2.4, 1, ease.out(ent))
        g.save()
        g.globalAlpha = ent * (1 - smooth(9, 18, dopo)) * 0.92
        kit.con(g, fo.x + fo.w * 0.74, fo.y + fo.h * 0.2, 0, scala, () => kit.timbro(g, 'do maggiore', 0, 0, 6.2 * u, -0.22, ROSSO, 1))
        g.restore()
      }

      // ── la tastiera ──
      g.drawImage(L.bianchi, 0, 0, W, H)
      const accesi = new Map()
      for (const n of S.tenute) accesi.set(n, 0.55)
      for (const n of ora) accesi.set(n, 1)
      // nel glissando restano accesi per un attimo anche i tasti appena passati
      if (S.gliss) {
        const i = ora[0] - BASE
        for (let j = 1; j <= 4; j++) if (i - j >= 0) accesi.set(BASE + i - j, Math.max(accesi.get(BASE + i - j) || 0, (1 - j / 5) * 0.9))
      }
      for (const c of G.chiavi) {
        if (c.nero || !accesi.has(c.n)) continue
        const k = accesi.get(c.n)
        const giu = k >= 1 ? 1 - S.dentro * 0.4 : 0.55
        tastoBianco(g, G, c, giu, true, k >= 1 ? 1 : 0.78)
      }
      g.drawImage(L.neri, 0, 0, W, H)
      for (const c of G.chiavi) {
        if (!c.nero || !accesi.has(c.n)) continue
        tastoNero(g, G, c, 1, accesi.get(c.n))
      }
      // le spie della cassa: ARP lampeggia a tempo, MIDI acceso col mouse sopra
      spia(g, G.kb.x + 2.4 * u, G.kb.y + 1.45 * u, 0.75 * u, 0.35 + 0.65 * Math.exp(-S.dentro * 5))
      spia(g, G.kb.x + 10.8 * u, G.kb.y + 1.45 * u, 0.75 * u, su)

      // l'onda d'urto dell'accordo pieno, dalla tastiera
      if (S.pieno && S.dentro < 0.9) {
        const k = ease.out(S.dentro / 0.9)
        g.strokeStyle = `rgba(204,255,0,${0.55 * (1 - k)})`
        g.lineWidth = Math.max(1, 1.2 * u * (1 - k))
        g.beginPath(); g.arc(G.kb.x + G.kb.w / 2, G.tasti, 6 * u + k * 70 * u, Math.PI, kit.TAU); g.stroke()
        g.strokeStyle = `rgba(255,240,168,${0.35 * (1 - k)})`
        g.beginPath(); g.arc(G.kb.x + G.kb.w / 2, G.tasti, 3 * u + k * 48 * u, Math.PI, kit.TAU); g.stroke()
      }
      // ── le scintille: ogni colpo lancia qualche granello di fosforo dal tasto ──
      scintille(g, G, S, u)

      // ── la luce: un riflesso che passa sullo schermo e la vignetta ──
      const passa = fract(t / 7.5)
      if (passa < 0.35) {
        const k = passa / 0.35
        const x = lerp(-0.3, 1.3, ease.inOut(k)) * W
        const r = g.createLinearGradient(x - 12 * u, 0, x + 12 * u, 0)
        r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, `rgba(255,255,255,${0.05 + su * 0.04})`); r.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = r
        g.fillRect(0, 0, W, H)
      }
      g.save()
      g.globalAlpha = 1 - su * 0.5
      g.drawImage(L.vign, 0, 0, W, H)
      g.restore()
      kit.granella(g, W, H, 0.05, t)
    },
  }

  // sposta, scala e ruota un pezzo attorno al suo centro
  function verso(g, r, dx, dy, sc, rot) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2
    g.translate(cx + dx, cy + dy)
    if (rot) g.rotate(rot)
    g.scale(sc, sc)
    g.translate(-cx, -cy)
  }
  function linea(g, pt) {
    g.beginPath()
    g.moveTo(pt[0], pt[1])
    for (let i = 2; i < pt.length; i += 2) g.lineTo(pt[i], pt[i + 1])
    g.stroke()
  }
  function righe(g, s, u) {
    g.fillStyle = 'rgba(0,0,0,.16)'
    const p = Math.max(2, 0.7 * u)
    for (let y = s.y; y < s.y + s.h; y += p) g.fillRect(s.x, y, s.w, Math.max(0.5, p * 0.35))
  }
  function puntina(g, x, y, r) {
    g.fillStyle = 'rgba(0,0,0,.35)'
    g.beginPath(); g.arc(x + r * 0.2, y + r * 0.35, r, 0, kit.TAU); g.fill()
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r)
    gr.addColorStop(0, '#ff8a8a'); gr.addColorStop(0.52, ROSSO); gr.addColorStop(1, '#6d0810')
    g.fillStyle = gr
    g.beginPath(); g.arc(x, y, r, 0, kit.TAU); g.fill()
  }
  function spia(g, x, y, r, k) {
    g.fillStyle = '#2a2e26'
    g.beginPath(); g.arc(x, y, r, 0, kit.TAU); g.fill()
    if (k > 0.02) {
      g.fillStyle = `rgba(204,255,0,${0.18 * k})`
      g.beginPath(); g.arc(x, y, r * 2.6, 0, kit.TAU); g.fill()
      g.fillStyle = `rgba(204,255,0,${0.35 + 0.65 * k})`
      g.beginPath(); g.arc(x, y, r * 0.8, 0, kit.TAU); g.fill()
    }
  }
  // i granelli: per ogni passo recente si rifà lo stesso volo (deterministico dal numero del passo)
  function scintille(g, G, S, u) {
    const vita = 1.6 // in passi
    const p0 = fase
    for (let back = 0; back < 5; back++) {
      const f = Math.floor(p0) - back
      if (f < 0) continue
      const st = statoAl(f + 0.001)
      const eta = (p0 - f) / vita
      if (eta > 1) continue
      for (const n of st.suona) {
        const c = G.chiavi[n - BASE]
        if (!c) continue
        const r = kit.rng(f * 31 + n)
        const quanti = st.pieno ? 7 : 4
        for (let i = 0; i < quanti; i++) {
          const vx = (r() - 0.5) * 6 * u
          const vy = -(5 + r() * 9) * u * (1 + su * 0.5) * (st.pieno ? 2.2 : 1)
          const x = c.x + c.l / 2 + vx * eta
          const y = G.tasti + vy * eta + 9 * u * eta * eta
          const a = (1 - eta) * (0.7 + su * 0.3)
          const s = (0.35 + r() * 0.5) * u
          g.fillStyle = r() < 0.3 ? `rgba(255,240,168,${a})` : `rgba(204,255,0,${a})`
          g.fillRect(x - s / 2, y - s / 2, s, s)
        }
      }
    }
  }
}
