// miniature/synesthesia.js — Synesthesia: la marca nata a Roma di notte, come la impagina il suo sito.
// Carta crema con la griglia a 24 colonne, la barra in alto in mono che scorre, a destra la notte con le
// statue di Roma in bianco e nero e il fumo, a sinistra i capi della SZN I che sfilano col loro codice.
// Ogni 10 s parte la tendina del sito: il nero copre tutto, l'emblema cromato si accende col suo riflesso
// e, quando si riapre, nella notte c'è un'altra statua e un altro modello.
// Col mouse sopra i capi si girano e mostrano il retro, e il carrello passa a 01.
// Le immagini (capi, statue, emblema, fumo) sono quelle del sito, ridotte, in miniature/synesthesia/.

const DIR = '/assets/miniature/synesthesia/'
const GIRO = 10
// i modelli della SZN I: numero, colore, imperatore, quartiere (dal catalogo del sito)
const MODELLI = [
  ['037', 'Onice', 'Caligola', 'San Lorenzo'], ['064', 'Fuoco', 'Nerone', 'Trastevere'], ['080', 'Marmo', 'Vespasiano', 'Flaminio'],
  ['101', 'Ossido', 'Traiano', 'Quadraro'], ['117', 'Inchiostro', 'Adriano', 'Borgo'], ['180', 'Ferro', 'Commodo', 'Ostiense'],
  ['211', 'Brace', 'Caracalla', 'Testaccio'], ['218', 'Sangue', 'Eliogabalo', 'Pigneto'], ['312', 'Cenere', 'Costantino', 'San Giovanni'],
]
const BARRA = '●  ANTEPRIMA DI STILE — SZN I · ROMA DI NOTTE     PRODUZIONE 2—8 SETTIMANE PER CAPO     SU MISURA: +50 € A CAPO — TAGLIE XS—XXL     '
const C = { carta: '#eae5d8', carta2: '#ded8c9', inchiostro: '#05070f', notte: '#070b17', acciaio: '#93a0bc', elettrico: '#2338ff', volt: '#d9ff43' }

const cache = new Map()
// un'immagine: basta onload (decode() in certi browser senza finestra non risponde mai)
function carica(src) {
  if (!cache.has(src)) cache.set(src, new Promise((ok, no) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = () => no(new Error('immagine mancante: ' + src))
    i.src = src
  }))
  return cache.get(src)
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, strato, TAU, fract } = kit
  const [capi, statue, emblema, fumo] = await Promise.all([
    carica(DIR + 'capi.webp'), carica(DIR + 'statue.webp'), carica(DIR + 'emblema.webp'), carica(DIR + 'fumo.webp'),
    kit.font('gg mono'), kit.font('ABC Ginto Nord', 800), kit.font('gg sans', 500), kit.font('Modern', 500),
  ])
  const MONO = '"gg mono", monospace'

  let W = 0, H = 0, carta = null, cromo = null, cg = null, nebbia = null
  let carrello = 0

  function ridimensiona(w, h) {
    if (!w || !h) return
    W = w; H = h
    const d = m.dpr
    // la carta con la griglia a filo (24 colonne) e la grana
    carta = strato(w, h, d, (g) => {
      g.fillStyle = C.carta; g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(7,11,23,.07)'
      for (let i = 1; i < 24; i++) g.fillRect(Math.round(w * i / 24), 0, 1, h)
      g.fillStyle = 'rgba(7,11,23,.12)'
      g.fillRect(0, Math.round(h * 0.47), w * 0.565, 1)
      g.fillRect(0, Math.round(h * 0.93), w, 1)
      kit.granella(g, w, h, 0.05)
    })
    // il fumo con i bordi sfumati (così non si vede il taglio dell'immagine)
    nebbia = strato(400, 110, 1, (g) => {
      g.drawImage(fumo, 0, 0, 400, 110)
      g.globalCompositeOperation = 'destination-in'
      const v = g.createLinearGradient(0, 0, 0, 110); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.45, '#000'); v.addColorStop(1, '#000')
      g.fillStyle = v; g.fillRect(0, 0, 400, 110)
      const o = g.createLinearGradient(0, 0, 400, 0); o.addColorStop(0, 'rgba(0,0,0,0)'); o.addColorStop(0.1, '#000'); o.addColorStop(0.9, '#000'); o.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = o; g.fillRect(0, 0, 400, 110)
    })
    // l'emblema su un canvas suo: il riflesso che passa lo disegna solo sopra il metallo
    const eh = h * 0.5, ew = eh * 200 / 293
    cromo = document.createElement('canvas')
    cromo.width = Math.max(1, Math.round(ew * d)); cromo.height = Math.max(1, Math.round(eh * d))
    cg = cromo.getContext('2d')
  }

  // ── i pezzi ──
  function barra(g, t) {
    const bh = H * 0.062
    g.fillStyle = C.inchiostro; g.fillRect(0, 0, W, bh)
    const fs = Math.max(6, bh * 0.4)
    g.font = `400 ${fs}px ${MONO}`; g.textBaseline = 'middle'
    const tw = g.measureText(BARRA).width
    const x0 = -fract(t * 0.035) * tw
    g.fillStyle = C.carta
    for (let x = x0; x < W; x += tw) g.fillText(BARRA, x, bh / 2)
    // il pallino «acceso» lampeggia in volt
    g.fillStyle = fract(t * 1.1) < 0.6 ? C.volt : '#55607a'
    for (let x = x0; x < W; x += tw) { g.beginPath(); g.arc(x + fs * 0.32, bh / 2, fs * 0.28, 0, TAU); g.fill() }
  }

  // la notte a destra: la statua che respira (Ken Burns), il fumo, le scritte del modello
  function notte(g, t, idx, su) {
    const x = W * 0.585, y = H * 0.105, w = W * 0.39, h = H * 0.79
    g.save()
    g.beginPath(); g.rect(x, y, w, h); g.clip()
    g.fillStyle = C.notte; g.fillRect(x, y, w, h)
    const s = idx % 4
    // la statua: 300×375, la riempio e la faccio salire piano
    const ph = fract((t + 0.4) / GIRO)
    const z = 1.08 + ph * 0.12 + su * 0.08
    const iw = w * z, ih = iw * 375 / 300
    const ix = x + (w - iw) / 2 + Math.sin(t * 0.2) * w * 0.02, iy = y + (h - ih) * (0.35 + 0.3 * (1 - ph))
    g.drawImage(statue, s * 300, 0, 300, 375, ix, iy, iw, ih)
    // il fumo che attraversa
    if (fumo) {
      g.globalCompositeOperation = 'screen'
      g.globalAlpha = 0.55
      const fw = w * 1.6, fh = fw * 220 / 800
      const fx = x - fract(t * 0.02) * fw
      g.drawImage(nebbia, fx, y + h - fh * 0.9, fw, fh); g.drawImage(nebbia, fx + fw, y + h - fh * 0.9, fw, fh)
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
    }
    // il blu della notte sopra, più fitto in basso, e la vignetta
    const vg = g.createLinearGradient(0, y, 0, y + h)
    vg.addColorStop(0, 'rgba(7,11,23,.6)'); vg.addColorStop(0.2, 'rgba(7,11,23,.1)'); vg.addColorStop(0.6, 'rgba(7,11,23,.25)'); vg.addColorStop(1, 'rgba(7,11,23,.88)')
    g.fillStyle = vg; g.fillRect(x, y, w, h)
    // le scritte del modello, in mono
    const [n, colore, imp, quart] = MODELLI[idx % MODELLI.length]
    const fs = Math.max(6, H * 0.032)
    g.font = `400 ${fs}px ${MONO}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
    g.fillStyle = C.acciaio
    g.fillText(`SYN-${n}`, x + w * 0.05, y + h * 0.09)
    g.textAlign = 'right'; g.fillText(`ANNO ${+n}`, x + w * 0.95, y + h * 0.09)
    g.textAlign = 'left'
    g.font = `800 ${H * 0.085}px "ABC Ginto Nord"`; g.fillStyle = C.carta
    g.fillText(colore.toUpperCase(), x + w * 0.05, y + h * 0.88)
    g.font = `400 ${fs}px ${MONO}`; g.fillStyle = C.acciaio
    g.fillText(`${imp.toUpperCase()} · ${quart.toUpperCase()}`, x + w * 0.05, y + h * 0.95)
    // le crocette di registro agli angoli
    g.strokeStyle = 'rgba(234,229,216,.5)'; g.lineWidth = 1
    const cr = (cx, cy) => { g.beginPath(); g.moveTo(cx - 5, cy); g.lineTo(cx + 5, cy); g.moveTo(cx, cy - 5); g.lineTo(cx, cy + 5); g.stroke() }
    cr(x + w * 0.05, y + h * 0.15); cr(x + w * 0.95, y + h * 0.15)
    g.restore()
  }

  // i capi che sfilano: la foto vera sul crema, il codice sotto
  function sfilata(g, t, su) {
    const x0 = W * 0.02, x1 = W * 0.565, y = H * 0.5
    const cw = W * 0.118, ch = cw * 188 / 150, passo = cw * 1.12
    const v = t * W * 0.028 + carrello * W * 0.05
    g.save()
    g.beginPath(); g.rect(x0, y - H * 0.02, x1 - x0, H * 0.48); g.clip()
    const primo = Math.floor(v / passo) - 1
    for (let j = primo; j < primo + 7; j++) {
      const i = ((j % 9) + 9) % 9
      const x = x1 - (j * passo - v) - cw - W * 0.01
      if (x > x1 || x + cw < x0) continue
      // si girano col mouse sopra, uno dopo l'altro
      const fl = clamp(su * 1.6 - ((x - x0) / (x1 - x0)) * 0.6)
      const ang = ease.inOut(fl) * Math.PI
      const sx = Math.abs(Math.cos(ang)), retro = ang > Math.PI / 2
      g.save(); g.translate(x + cw / 2, y)
      g.scale(Math.max(0.02, sx), 1)
      g.fillStyle = 'rgba(7,11,23,.08)'; g.fillRect(-cw / 2 + 3, 4, cw, ch)
      g.drawImage(capi, i * 150, retro ? 188 : 0, 150, 188, -cw / 2, 0, cw, ch)
      g.strokeStyle = 'rgba(7,11,23,.18)'; g.lineWidth = 1; g.strokeRect(-cw / 2 + 0.5, 0.5, cw - 1, ch - 1)
      g.restore()
      const [n, colore] = MODELLI[i]
      const fs = Math.max(5, H * 0.026)
      g.font = `400 ${fs}px ${MONO}`; g.fillStyle = C.inchiostro; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
      g.fillText(`SYN-${n}`, x, y + ch + fs * 1.5)
      g.fillStyle = '#55617c'; g.fillText(retro ? 'RETRO' : colore.toUpperCase(), x, y + ch + fs * 2.8)
      if (n === '064') { g.textAlign = 'right'; g.fillStyle = C.elettrico; g.fillText('350 €', x + cw, y + ch + fs * 1.5); g.textAlign = 'left' }
    }
    g.restore()
  }

  // la scritta enorme del piede, dietro tutto, che scorre piano
  function parolone(g, t) {
    g.font = `800 ${H * 0.42}px "ABC Ginto Nord"`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
    const s = 'SYNESTHESIA ', tw = g.measureText(s).width
    g.fillStyle = 'rgba(7,11,23,.045)'
    const x0 = -fract(t * 0.012) * tw
    for (let x = x0; x < W; x += tw) g.fillText(s, x, H * 1.08)
  }

  function utilita(g, t) {
    const fs = Math.max(6, H * 0.03)
    g.font = `400 ${fs}px ${MONO}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
    g.fillStyle = C.inchiostro
    const y = H * 0.455
    g.fillText('CAPI 15', W * 0.045, y)
    g.fillStyle = '#55617c'; g.fillText('MODELLI 11', W * 0.165, y)
    const c = String(carrello > 0.5 ? 1 : 0).padStart(2, '0')
    g.fillStyle = C.inchiostro; g.fillText(`CARRELLO ${c}`, W * 0.3, y)
    if (carrello > 0.05) {
      g.fillStyle = `rgba(217,255,67,${carrello})`
      g.fillRect(W * 0.3 + g.measureText('CARRELLO ').width - 2, y - fs * 0.95, g.measureText(c).width + 4, fs * 1.2)
      g.fillStyle = C.inchiostro; g.fillText(c, W * 0.3 + g.measureText('CARRELLO ').width, y)
    }
  }

  // la tendina del sito: il nero entra da destra, l'emblema col riflesso, poi esce a sinistra
  function tendina(g, t) {
    if (t < 8.6) return // la prima tendina parte al primo giro
    const ph = fract((t - 8.6) / GIRO) * GIRO
    if (ph > 2.05) return
    const dentro = ease.inOut(clamp(ph / 0.6)), fuori = ease.inOut(clamp((ph - 1.35) / 0.65))
    const xa = W * (1 - dentro) , xb = W * (1 - fuori)
    // il nero copre da xa a destra, poi si ritira da destra verso sinistra
    const L = Math.min(xa, W), R = fuori > 0 ? xb : W
    if (R <= L) return
    g.fillStyle = C.inchiostro; g.fillRect(L, 0, R - L, H)
    // sopra il nero il titolo diventa crema
    // (mentre c'è l'emblema il nome lo dice lui, sotto in mono)
    const aE = smooth(0.45, 0.75, ph) * (1 - smooth(1.25, 1.5, ph))
    g.save(); g.globalAlpha = 1 - aE; g.beginPath(); g.rect(L, 0, R - L, H); g.clip(); titolo(g, C.carta); g.restore()
    g.fillStyle = C.elettrico; g.fillRect(dentro < 1 ? L - 2 : R, 0, 3, H)
    // l'emblema, che appare a tendina chiusa
    const a = smooth(0.45, 0.75, ph) * (1 - smooth(1.25, 1.5, ph))
    if (a <= 0) return
    const eh = H * 0.5, ew = eh * 200 / 293
    const d = m.dpr
    cg.setTransform(d, 0, 0, d, 0, 0)
    cg.globalCompositeOperation = 'source-over'
    cg.clearRect(0, 0, ew, eh)
    cg.drawImage(emblema, 0, 0, ew, eh)
    cg.globalCompositeOperation = 'source-atop'
    const sx = lerp(-ew, ew * 2, clamp((ph - 0.6) / 0.7))
    const lg = cg.createLinearGradient(sx - ew * 0.4, 0, sx + ew * 0.4, eh * 0.6)
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)')
    cg.fillStyle = lg; cg.fillRect(0, 0, ew, eh)
    const zz = 0.92 + 0.08 * ease.out(a)
    g.save(); g.globalAlpha = a
    g.translate(W / 2, H * 0.46); g.scale(zz, zz)
    g.drawImage(cromo, -ew / 2, -eh / 2, ew, eh)
    g.restore()
    g.globalAlpha = a
    g.font = `400 ${Math.max(6, H * 0.034)}px ${MONO}`; g.textAlign = 'center'; g.fillStyle = C.carta
    if ('letterSpacing' in g) g.letterSpacing = `${H * 0.012}px`
    g.fillText('SYNESTHESIA', W / 2, H * 0.83)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    g.textAlign = 'left'; g.globalAlpha = 1
  }

  // il nome, dove sta il titolo della copertina (stesse misure), nel carattere Modern
  function titolo(g, colore) {
    const fs = W * Math.min(0.115, 1.04 / 11)
    g.font = `500 ${fs}px "Modern"`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
    g.fillStyle = colore
    g.fillText('Synesthesia', W * 0.05, W * 0.09 + fs * 0.8)
  }

  function frame(t, dt) {
    if (W !== m.w || H !== m.h || !carta) ridimensiona(m.w, m.h)
    if (!carta) return
    const g = m.g, su = m.su
    carrello += ((su > 0.5 ? 1 : 0) - carrello) * Math.min(1, (dt || 0) * 5)
    if (!dt) carrello = su > 0.5 ? 1 : 0
    const idx = Math.floor((t + 0.4) / GIRO)
    g.drawImage(carta, 0, 0, W, H)
    parolone(g, t)
    notte(g, t, idx, su)
    sfilata(g, t, su)
    utilita(g, t)
    titolo(g, '#141414')
    barra(g, t)
    tendina(g, t)
  }

  ridimensiona(m.w, m.h)
  return { frame, ridimensiona, titolo: false, fermo: 2.5 }
}
