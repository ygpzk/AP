// miniature/serranda.js — Il Muro: la saracinesca coi volantini, l'insegna «pzkko» e i graffiti.
// I pezzi sono quelli veri del muro (/art/muro.webp, /art/insegna*.svg, /art/manifesti*, /art/tag,
// /art/scritte*, /art/adesivi, /art/leggere) e la cattura vera della vecchia home sta in una polaroid
// attaccata col nastro. Il giro (14 s) è un giorno: di giorno una bomboletta firma la lamiera (a ogni
// giro un tag diverso, sopra quelli vecchi), al tramonto l'insegna sfarfalla e si accende al neon, di
// notte resta la luce del lampione con le falene, all'alba torna grigio. La camera scorre piano.
// Col mouse sopra si fa sera: insegna e lampione si accendono, il vento muove i volantini.

const GIRO = 14
const cache = new Map()
// un'immagine del sito: basta onload (decode() in certi browser senza finestra non risponde mai)
function carica(src) {
  if (!cache.has(src)) cache.set(src, new Promise((ok) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = () => ok(null)
    i.src = src
  }))
  return cache.get(src)
}

// i volantini fissi: [immagine, x centro (frazione di w, nel mondo largo 1,12 w), y centro (frazione di h), larghezza (frazione di w), rotazione]
const FISSI = [
  ['/art/scritte2/siti.webp', 0.27, 0.6, 0.11, -0.05],
  ['/art/manifesti1/concerto.webp', 0.505, 0.73, 0.14, -0.035],
  ['/art/manifesti2/gatto.webp', 0.83, 0.71, 0.135, -0.04],
  ['/art/manifesti2/moneta.webp', 0.985, 0.75, 0.13, 0.03],
  ['/art/manifesti4/brat.webp', 1.075, 0.73, 0.1, -0.05],
  ['/art/tag/stencil-chiocciola.webp', 0.7, 0.545, 0.075, 0],
  ['/art/tag/scarabocchio.webp', 0.92, 0.53, 0.07, 0],
  ['/art/adesivi/teschio.webp', 0.415, 0.93, 0.045, 0.2],
  ['/art/adesivi/occhio.webp', 0.6, 0.55, 0.04, -0.1],
  ['/art/adesivi/nutria.webp', 0.905, 0.93, 0.05, 0.1],
  ['/art/adesivi/concerto.webp', 1.04, 0.53, 0.045, -0.12],
  ['/art/adesivi/pzkkonet.webp', 0.165, 0.95, 0.06, 0.06],
]
// i volantini che il vento muove (appesi al nastro in alto)
const MOBILI = [
  ['/art/manifesti1/roulette.webp', 0.335, 0.745, 0.145, 0.035],
  ['/art/manifesti2/dadi.webp', 0.665, 0.76, 0.14, 0.05],
]
// i tag della bomboletta, uno per giro, e i tre posti dove li fa
const TAG = ['/art/tag/tag-verde.webp', '/art/tag/tag-arancio.webp', '/art/tag/throwup-argento.webp', '/art/tag/tag-azzurro.webp']
const COLORE_TAG = ['#35c94a', '#ff7a1a', '#c9ced6', '#4fb3ff']
const POSTI = [[0.42, 0.54, 0.12], [0.76, 0.545, 0.12], [0.98, 0.6, 0.1]]

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, rng, strato, tondo, TAU, fract } = kit
  const nomi = [...new Set([...FISSI, ...MOBILI].map((f) => f[0]).concat(TAG))]
  const [muro, intonaco, insegna, notte, falena1, falena2, mosca, cattura, ...resto] = await Promise.all([
    carica('/art/muro.webp'), carica('/art/intonaco.svg'), carica('/art/insegna.svg'), carica('/art/insegna-notte.svg'),
    carica('/art/leggere/mosca-vola.webp'), carica('/art/leggere/mosca-vola2.webp'), carica('/art/leggere/mosca.webp'),
    m.cattura ? carica(m.cattura) : null,
    ...nomi.map(carica),
    kit.font('Permanent Marker'), kit.font('Special Elite'),
  ])
  if (!muro || !insegna) throw new Error('muro mancante')
  const im = Object.fromEntries(nomi.map((n, i) => [n, resto[i]]))

  let W = 0, H = 0, MW = 0
  let mondo = null, accesa = null, mobili = []

  // l'insegna: dove sta nel mondo
  const ins = () => { const iw = W * 0.46; return { x: W * 0.745 - iw / 2, y: H * 0.035, w: iw, h: iw * 450 / 1080 } }
  const lampada = () => ({ x: W * 1.065, y: H * 0.17 })

  function ridimensiona(w, h) {
    if (!w || !h) return
    W = w; H = h; MW = w * 1.12
    const d = m.dpr
    const yS = h * 0.44 // dove comincia la saracinesca
    mondo = strato(MW, h, d, (g) => {
      // l'intonaco del palazzo, scuro
      g.fillStyle = '#3a3836'; g.fillRect(0, 0, MW, yS)
      if (intonaco) { const t = h * 0.6; for (let x = 0; x < MW; x += t) for (let y = 0; y < yS; y += t) g.drawImage(intonaco, x, y, t, t) }
      g.fillStyle = 'rgba(20,18,16,.45)'; g.fillRect(0, 0, MW, yS)
      // le colature sotto il davanzale
      const r = rng(3)
      for (let i = 0; i < 26; i++) { const x = r() * MW, l = h * (0.05 + r() * 0.2); const c = g.createLinearGradient(0, yS - l, 0, yS); c.addColorStop(0, 'rgba(0,0,0,0)'); c.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = c; g.fillRect(x, yS - l, 1 + r() * 3, l) }
      // la lamiera vera, scurita come sul sito
      const th = MW * 1475 / 3200
      g.drawImage(muro, 0, yS, MW, th)
      if (th < h - yS) g.drawImage(muro, 0, yS + th, MW, th)
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#6a6c70'; g.fillRect(0, yS, MW, h - yS)
      g.globalCompositeOperation = 'source-over'
      // il cassonetto e le guide
      const cg = g.createLinearGradient(0, yS - h * 0.035, 0, yS + h * 0.01)
      cg.addColorStop(0, '#2b2c2d'); cg.addColorStop(0.7, '#1a1b1c'); cg.addColorStop(1, '#0d0d0e')
      g.fillStyle = cg; g.fillRect(0, yS - h * 0.035, MW, h * 0.045)
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, yS - h * 0.035, MW, 1)
      const sh = g.createLinearGradient(0, yS + h * 0.01, 0, yS + h * 0.06); sh.addColorStop(0, 'rgba(0,0,0,.5)'); sh.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = sh; g.fillRect(0, yS + h * 0.01, MW, h * 0.05)
      // l'insegna di giorno, con la sua ombra
      const s = ins()
      g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = w * 0.025; g.shadowOffsetY = h * 0.02
      g.drawImage(insegna, s.x, s.y, s.w, s.h); g.restore()
      // il lampione a muro: il braccio e il piatto
      const L = lampada()
      g.strokeStyle = '#151515'; g.lineWidth = Math.max(2, w * 0.006); g.lineCap = 'round'
      g.beginPath(); g.moveTo(L.x + w * 0.06, L.y - h * 0.08); g.quadraticCurveTo(L.x + w * 0.01, L.y - h * 0.1, L.x, L.y - h * 0.02); g.stroke()
      g.fillStyle = '#1c1c1c'; g.beginPath(); g.moveTo(L.x - w * 0.035, L.y + h * 0.01); g.lineTo(L.x + w * 0.035, L.y + h * 0.01); g.lineTo(L.x + w * 0.012, L.y - h * 0.025); g.lineTo(L.x - w * 0.012, L.y - h * 0.025); g.closePath(); g.fill()
      // la polaroid con la vecchia home vera, attaccata col nastro
      if (cattura) {
        const pw = w * 0.2, iw = pw * 0.88, ih = iw * 9 / 16, ph = pw * 0.06 + ih + pw * 0.17
        kit.con(g, w * 0.135, h * 0.71, -0.06, 1, () => {
          g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = pw * 0.06; g.shadowOffsetY = pw * 0.03
          g.fillStyle = '#f4f1ea'; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.shadowColor = 'transparent'
          g.drawImage(cattura, -iw / 2, -ph / 2 + pw * 0.06, iw, ih)
          g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(-iw / 2, -ph / 2 + pw * 0.06, iw, ih * 0.4)
          g.font = `400 ${pw * 0.075}px "Permanent Marker"`; g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.textBaseline = 'middle'
          g.fillText('la vecchia home', 0, ph / 2 - pw * 0.085)
          kit.nastro(g, 0, -ph / 2, pw * 0.34, pw * 0.09, 0.05)
        })
      }
      // i volantini e i graffiti fissi
      for (const [src, cx, cy, fw, rot] of FISSI) {
        const i = im[src]; if (!i) continue
        const iw = w * fw, ih = iw * i.height / i.width
        const carta = src.includes('manifesti')
        kit.foglio(g, i, cx * w, cy * h, iw, ih, rot, carta ? 0.45 : 0)
        if (carta) kit.nastro(g, cx * w, cy * h - ih / 2 + ih * 0.02, iw * 0.3, iw * 0.08, rot - 0.08)
      }
      // il marciapiede in fondo
      const mg = g.createLinearGradient(0, h * 0.965, 0, h); mg.addColorStop(0, '#1d1c1a'); mg.addColorStop(1, '#0e0d0c')
      g.fillStyle = mg; g.fillRect(0, h * 0.965, MW, h * 0.035)
    })
    // l'insegna accesa, rasterizzata una volta
    const s = ins()
    accesa = notte ? strato(s.w, s.h, d, (g, a, b) => g.drawImage(notte, 0, 0, a, b)) : null
    // i volantini mobili, ognuno nel suo strato (con l'ombra già fatta)
    mobili = MOBILI.map(([src, cx, cy, fw, rot]) => {
      const i = im[src]; if (!i) return null
      const iw = w * fw, ih = iw * i.height / i.width, p = iw * 0.12
      const c = strato(iw + p * 2, ih + p * 2, d, (g) => {
        g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = iw * 0.05; g.shadowOffsetY = iw * 0.025
        g.drawImage(i, p, p, iw, ih); g.shadowColor = 'transparent'
        kit.nastro(g, p + iw / 2, p + ih * 0.02, iw * 0.3, iw * 0.08, -0.08)
      })
      return { c, cx: cx * w, cy: cy * h, iw, ih, p, rot }
    })
  }

  // la luce del giorno: 0 giorno … 1 notte, e l'insegna (0 spenta, 1 accesa) col suo sfarfallio
  function cielo(q) {
    const n = smooth(5.2, 7.2, q) * (1 - smooth(12, 13.8, q))
    const SF = [0, 1, 0, 0, 1, 0.2, 1, 1, 0, 1, 1, 0.4, 1]
    let neon = 0
    if (q > 6.3 && q < 7.3) neon = SF[Math.floor((q - 6.3) / 1 * SF.length)]
    else if (q >= 7.3 && q < 12.6) neon = 1
    else if (q >= 12.6 && q < 13) neon = 1 - (q - 12.6) / 0.4
    return { n, neon, lampione: smooth(6.6, 7.0, q) * (1 - smooth(12.2, 12.7, q)) }
  }

  function bomboletta(g, q, giro, t) {
    // a ogni giro un tag nuovo in un posto nuovo; quelli vecchi restano, finché non ci si ridipinge sopra
    for (let back = 3; back >= 1; back--) {
      const gg = giro - back
      if (gg < 0) continue
      if (gg % 3 === giro % 3) continue // lì si sta ridipingendo
      disegnaTag(g, gg, 1)
    }
    const p = clamp((q - 0.8) / 3.6)
    if (giro >= 3 && p < 1) disegnaTag(g, giro - 3, 1)
    if (p <= 0) return
    disegnaTag(g, giro, p, t)
  }
  function disegnaTag(g, gg, p, t) {
    const [cx, cy, fw] = POSTI[gg % 3]
    const i = im[TAG[gg % TAG.length]]; if (!i) return
    const tw = W * fw, th = tw * i.height / i.width
    const x0 = cx * W - tw / 2, y0 = cy * H - th / 2
    if (p >= 1) { g.drawImage(i, x0, y0, tw, th); return }
    // si scopre da sinistra a destra, a passate, dietro la bomboletta
    const e = ease.inOut(p)
    const bx = x0 + tw * e
    const by = y0 + th * (0.5 + 0.38 * Math.sin(e * TAU * 3.5))
    g.save()
    g.beginPath(); g.rect(x0 - 2, y0 - 2, tw * e + 2, th + 4)
    g.arc(bx, by, th * 0.32, 0, TAU)
    g.clip()
    g.drawImage(i, x0, y0, tw, th)
    g.restore()
    // la nebbiolina della vernice e la bomboletta
    const col = COLORE_TAG[gg % TAG.length]
    const r = rng(Math.floor(t * 30))
    g.fillStyle = col
    for (let k = 0; k < 18; k++) { const a = r() * TAU, d = r() * th * 0.22; g.globalAlpha = 0.25 * r(); g.fillRect(bx + Math.cos(a) * d, by + Math.sin(a) * d, 1.4, 1.4) }
    g.globalAlpha = 1
    const s = W * 0.022
    kit.con(g, bx + s * 0.9, by + s * 0.6, 0.35 + Math.sin(t * 9) * 0.05, 1, () => {
      const lg = g.createLinearGradient(-s / 2, 0, s / 2, 0)
      lg.addColorStop(0, '#222'); lg.addColorStop(0.35, col); lg.addColorStop(0.6, '#fff'); lg.addColorStop(0.75, col); lg.addColorStop(1, '#111')
      g.fillStyle = lg; tondo(g, -s / 2, -s * 0.9, s, s * 2.6, s * 0.25); g.fill()
      g.fillStyle = '#e8e8e8'; tondo(g, -s * 0.3, -s * 1.35, s * 0.6, s * 0.5, s * 0.12); g.fill()
      g.fillStyle = '#111'; g.fillRect(-s * 0.42, -s * 1.42, s * 0.2, s * 0.14)
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-s / 2, s * 0.55, s, s * 0.08)
    })
  }

  function frame(t, dt) {
    if (W !== m.w || H !== m.h || !mondo) ridimensiona(m.w, m.h)
    if (!mondo) return
    const g = m.g, su = m.su
    const giro = Math.floor(t / GIRO), q = t - giro * GIRO
    const c = cielo(q)
    const sera = ease.inOut(su)
    const notteV = Math.max(c.n, sera * 0.62)
    const neon = Math.max(c.neon, su > 0.15 ? (su < 0.4 ? (fract(t * 9) < 0.5 ? 1 : 0.2) : 1) : 0)
    const lamp = Math.max(c.lampione, smooth(0.3, 0.7, su))
    const vento = 0.25 + su * 1.2

    // la camera: scorre piano lungo il muro, col mouse sopra si avvicina un filo
    const pan = -(MW - W) * kit.onda(t, 30)
    const z = 1 + sera * 0.05
    g.save()
    g.translate(W * 0.6, H * 0.55); g.scale(z, z); g.translate(-W * 0.6, -H * 0.55)
    g.translate(pan, 0)
    g.drawImage(mondo, 0, 0, MW, H)
    // i volantini mobili: dondolano appesi al nastro
    mobili.forEach((v, i) => {
      if (!v) return
      const a = v.rot + Math.sin(t * (1.3 + i * 0.4) + i) * 0.02 * vento + kit.rumore(t * 1.5, i) * 0.03 * vento
      g.save(); g.translate(v.cx, v.cy - v.ih / 2); g.rotate(a)
      // l'angolo in basso si solleva col vento: lo schiaccio un poco in verticale
      g.scale(1, 1 - 0.03 * vento * (0.5 + 0.5 * Math.sin(t * 2.3 + i)))
      g.drawImage(v.c, -v.iw / 2 - v.p, -v.p, v.iw + v.p * 2, v.ih + v.p * 2)
      g.restore()
    })
    // i graffiti vanno sopra i volantini, come sui muri veri
    bomboletta(g, q, giro, t)
    // di giorno una mosca cammina sulla polaroid
    if (mosca && notteV < 0.5) {
      const f = fract(t / 9)
      const mx = W * (0.07 + f * 0.13), my = H * (0.64 + Math.sin(f * TAU * 1.5) * 0.04)
      g.globalAlpha = 1 - notteV * 2
      kit.con(g, mx, my, Math.atan2(Math.cos(f * TAU * 1.5) * 0.3, 1) + Math.PI / 2, 1, () => g.drawImage(mosca, -W * 0.012, -W * 0.012, W * 0.024, W * 0.025))
      g.globalAlpha = 1
    }

    // di giorno il sole radente da sinistra
    if (notteV < 0.99) {
      g.globalCompositeOperation = 'soft-light'
      const sg = g.createLinearGradient(-pan, 0, -pan + W, H)
      sg.addColorStop(0, `rgba(255,214,150,${0.55 * (1 - notteV)})`); sg.addColorStop(0.6, 'rgba(255,214,150,0)'); sg.addColorStop(1, `rgba(0,0,40,${0.3 * (1 - notteV)})`)
      g.fillStyle = sg; g.fillRect(-pan - W, -H, W * 3, H * 3)
      g.globalCompositeOperation = 'source-over'
    }
    // la notte: tutto si scurisce e vira al blu
    if (notteV > 0.001) {
      const tr = Math.sin(clamp(notteV) * Math.PI) * 0.6 // al tramonto un filo d'arancio
      const R = Math.round(lerp(255, 52, notteV) + tr * 60), G = Math.round(lerp(255, 58, notteV) + tr * 10), B = Math.round(lerp(255, 92, notteV) - tr * 30)
      g.globalCompositeOperation = 'multiply'
      g.fillStyle = `rgb(${clamp(R, 0, 255)},${clamp(G, 0, 255)},${clamp(B, 0, 255)})`
      g.fillRect(-pan - W, -H, W * 3, H * 3)
      g.globalCompositeOperation = 'source-over'
    }
    // la luce del lampione: scopre il muro nel suo cono e lo scalda
    const L = lampada()
    if (lamp > 0.01) {
      const cono = (a) => { g.beginPath(); g.moveTo(L.x - W * 0.03, L.y + H * 0.01); g.lineTo(L.x + W * 0.03, L.y + H * 0.01); g.lineTo(L.x + W * 0.2 * a, H); g.lineTo(L.x - W * 0.24 * a, H); g.closePath() }
      g.save(); cono(1.25); g.clip()
      g.globalAlpha = lamp * notteV * 0.3
      g.drawImage(mondo, 0, 0, MW, H)
      g.restore(); g.save(); cono(1); g.clip()
      g.globalAlpha = lamp * notteV * 0.45
      g.drawImage(mondo, 0, 0, MW, H)
      g.globalAlpha = 1
      g.globalCompositeOperation = 'lighter'
      const lg = g.createLinearGradient(0, L.y, 0, H)
      lg.addColorStop(0, `rgba(255,205,140,${0.32 * lamp})`); lg.addColorStop(1, `rgba(255,170,90,${0.06 * lamp})`)
      g.fillStyle = lg; g.fillRect(L.x - W * 0.3, L.y, W * 0.6, H)
      // la polvere nella luce
      const r = rng(8)
      g.fillStyle = `rgba(255,230,190,${0.5 * lamp})`
      for (let i = 0; i < 22; i++) { const px = L.x + (r() - 0.5) * W * 0.3, py = L.y + fract(r() + t * 0.03 * (0.5 + r())) * (H - L.y); g.fillRect(px + Math.sin(t + i) * 4, py, 1.2, 1.2) }
      g.restore()
      // la lampadina
      g.globalCompositeOperation = 'lighter'
      const bg = g.createRadialGradient(L.x, L.y + H * 0.015, 0, L.x, L.y + H * 0.015, W * 0.09)
      bg.addColorStop(0, `rgba(255,236,200,${0.9 * lamp})`); bg.addColorStop(0.2, `rgba(255,200,130,${0.35 * lamp})`); bg.addColorStop(1, 'rgba(255,170,90,0)')
      g.fillStyle = bg; g.fillRect(L.x - W * 0.1, L.y - W * 0.1, W * 0.2, W * 0.2)
      g.globalCompositeOperation = 'source-over'
    }
    // l'insegna al neon: alone sul muro, poi i tubi accesi
    const s = ins()
    if (neon > 0.01 && accesa) {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2
      g.globalCompositeOperation = 'lighter'
      const ng = g.createRadialGradient(cx, cy, s.h * 0.1, cx, cy, s.w * 0.85)
      ng.addColorStop(0, `rgba(255,190,110,${0.34 * neon})`); ng.addColorStop(0.45, `rgba(255,170,90,${0.12 * neon})`); ng.addColorStop(1, 'rgba(255,170,90,0)')
      g.fillStyle = ng; g.fillRect(cx - s.w, cy - s.w, s.w * 2, s.w * 2)
      g.globalCompositeOperation = 'source-over'
      g.globalAlpha = neon
      g.drawImage(accesa, s.x, s.y, s.w, s.h)
      g.globalAlpha = 1
    }
    // all'accensione l'insegna sputa qualche scintilla
    if (q > 6.3 && q < 8.2) {
      const r = rng(giro * 3 + 7), a0 = q - 6.3
      g.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 14; i++) {
        const t0 = r() * 0.9, e = a0 - t0
        if (e < 0 || e > 1) { r(); r(); continue }
        const x = s.x + s.w * (0.25 + r() * 0.5) + (r() - 0.5) * W * 0.08 * e, y = s.y + s.h * 0.8 + e * e * H * 0.5
        g.fillStyle = `rgba(255,${180 + Math.round(60 * (1 - e))},120,${1 - e})`
        g.fillRect(x, y, 2, 2 + 4 * (1 - e))
      }
      g.globalCompositeOperation = 'source-over'
    }
    // di notte passa un'auto: i fari scorrono sulla lamiera
    if (c.n > 0.5 && q > 9 && q < 11) {
      const f = (q - 9) / 2, x = -pan + lerp(-W * 0.5, W * 1.5, ease.inOut(f))
      g.globalCompositeOperation = 'lighter'
      const fg = g.createLinearGradient(x - W * 0.25, 0, x + W * 0.25, 0)
      fg.addColorStop(0, 'rgba(255,250,230,0)'); fg.addColorStop(0.5, `rgba(255,250,230,${0.22 * Math.sin(f * Math.PI)})`); fg.addColorStop(1, 'rgba(255,250,230,0)')
      g.fillStyle = fg; g.fillRect(x - W * 0.25, H * 0.42, W * 0.5, H * 0.58)
      g.globalCompositeOperation = 'source-over'
    }
    // le falene intorno al lampione
    if (lamp > 0.05 && falena1) {
      for (let i = 0; i < 3; i++) {
        const a = t * (2.2 + i * 0.7) + i * 2.1
        const x = L.x + Math.cos(a) * W * (0.035 + i * 0.015), y = L.y + H * 0.04 + Math.sin(a * 1.3) * H * (0.04 + i * 0.012)
        g.globalAlpha = lamp
        const f = fract(t * 14 + i * 0.3) < 0.5 ? falena1 : falena2
        kit.con(g, x, y, a + Math.PI, 1, () => g.drawImage(f, -W * 0.009, -W * 0.007, W * 0.018, W * 0.014))
      }
      g.globalAlpha = 1
    }
    g.restore()
    kit.vignetta(g, W, H, 0.42 + notteV * 0.2)
    kit.granella(g, W, H, 0.06, t)
  }

  ridimensiona(m.w, m.h)
  return { frame, ridimensiona, titolo: true, fermo: 2.6 }
}
