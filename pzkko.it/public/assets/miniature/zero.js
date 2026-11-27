// miniature/zero.js — PZK Zero: il cercapersone vero (art/zero/zero-piccolo.webp) attaccato col nastro alla saracinesca,
// con pzk os vivo dentro il vetro: le schermate sono le catture vere (media/p/zero), portate sui quattro angoli dell'lcd
// della foto (muro-dati.js) e cambiate coi tasti, come quando lo si usa. Ogni tanto (e col mouse sopra) la telecamera
// vola sullo schermo come quando lo si apre: la vista dritta sul fronte, con la croce e OK che si premono.
import { MEDIA } from '../media.js'
import dati from '../../telefono/zero/muro-dati.js'

// le schermate vere, nell'ordine in cui si girano (la home, il menu, codice C, bin·hex, virtual, shop, profilo)
const ORDINE = [-1, 0, 1, 2, 3, 5, 4]
// l'lcd nelle catture di fronte (frazioni del fotogramma 16:9) e i tasti
const LCD_B = { u0: 0.0495, u1: 0.531, v0: 0.153, v1: 0.668 }
const TASTI_B = { croce: [0.7125, 0.409, 0.139], ok: [0.7125, 0.409, 0.044], indietro: [0.896, 0.58, 0.045], led: [0.57, 0.644] }
// e nella foto di tre quarti (frazioni di 1344 × 776)
const TASTI_A = { croce: [0.672, 0.538, 0.092, 0.162], ok: [0.672, 0.528, 0.028, 0.05], indietro: [0.791, 0.683, 0.031, 0.054] }
const GIRO = 13 // secondi del ciclo: muro → volo sullo schermo → muro
const PASSO = 2.5 // ogni quanto cambia schermata

// la vignetta e la grana in uno strato solo, fatto una volta: a ogni fotogramma costa un drawImage
function finitura(kit, W, H, dpr, scuro = 0.42, grana = 0.07) {
  return kit.strato(W, H, dpr, (g) => {
    kit.vignetta(g, W, H, scuro)
    const n = document.createElement('canvas'), x = n.getContext('2d'), r = kit.rng(5)
    n.width = n.height = 96
    const d = x.createImageData(96, 96)
    for (let i = 0; i < d.data.length; i += 4) { const v = r(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > 0.5 ? 255 : 0; d.data[i + 3] = Math.abs(v - 0.5) * 2 * grana * 255 }
    x.putImageData(d, 0, 0)
    g.fillStyle = g.createPattern(n, 'repeat')
    g.fillRect(0, 0, W, H)
  })
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU } = kit
  const lista = MEDIA.zero?.shots ?? []
  const fonti = ORDINE.map((i) => (i < 0 ? m.cattura : lista[i]?.src)).filter(Boolean)
  const [dev, nastro, muro, ...schermi] = await Promise.all([
    kit.img('/art/zero/zero-piccolo.webp'), kit.imgForse('/art/zero/attacco.svg'), kit.img('/art/muro.webp'), ...fonti.map((s) => kit.imgForse(s)),
  ])
  const vere = schermi.filter(Boolean)
  let shots = []
  if (!vere.length) throw new Error('zero: nessuna cattura')
  await kit.font(m.font)

  let W = 0, H = 0, fino = null, viaVig = null, fondo = null, ombra = null, attacco = null, D = null
  let tau = 0 // il tempo della scena (col mouse sopra corre un po' di più)

  function ridimensiona(w, h) {
    W = w; H = h
    // il cercapersone: a destra e in basso, la fascia del titolo resta libera
    const dw = W * 0.8, dh = (dw * dev.height) / dev.width
    D = { x: W * 0.255, y: H * 0.235, w: dw, h: dh }
    // la saracinesca, scurita come sulla bacheca, un po' più grande per la parallasse
    fondo = kit.strato(W * 1.12, H * 1.12, m.dpr, (g, fw, fh) => {
      const s = (fh * 1.35) / muro.height
      for (let x = 0; x < fw; x += muro.width * s) g.drawImage(muro, x, -fh * 0.1, muro.width * s, muro.height * s)
      g.fillStyle = 'rgba(18,12,8,.62)'
      g.fillRect(0, 0, fw, fh)
      const l = g.createLinearGradient(0, 0, 0, fh)
      l.addColorStop(0, 'rgba(0,0,0,.35)'); l.addColorStop(0.5, 'rgba(0,0,0,0)'); l.addColorStop(1, 'rgba(0,0,0,.45)')
      g.fillStyle = l
      g.fillRect(0, 0, fw, fh)
    })
    // l'ombra del cercapersone sul muro (sfocata una volta sola)
    ombra = kit.strato(D.w * 1.2, D.h * 1.3, m.dpr, (g, ow, oh) => {
      g.shadowColor = 'rgba(0,0,0,.75)'
      g.shadowBlur = D.w * 0.05 * m.dpr // (ombre e scostamenti non seguono la scala: px veri)
      g.shadowOffsetX = -ow * 3 * m.dpr
      g.shadowOffsetY = 0
      g.drawImage(dev, D.w * 0.1 + ow * 3, D.h * 0.12, D.w, D.h)
    })
    // le catture già alla misura della scena (rimpicciolire 1600 × 900 a ogni fotogramma costa)
    shots = vere.map((im) => kit.strato(W, H, m.dpr, (g) => { g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, W, H) }))
    fino = finitura(kit, W, H, m.dpr, 0.5)
    viaVig = finitura(kit, W, H, m.dpr, 0.3)
    attacco = nastro ? kit.strato(D.w, D.h, m.dpr, (g, aw, ah) => g.drawImage(nastro, 0, 0, aw, ah)) : null
  }

  // i quattro angoli dell'lcd nella foto, in px della scena
  const angolo = (k) => [D.x + dati.lcd[k][0] * D.w, D.y + dati.lcd[k][1] * D.h]
  const inA = (fx, fy) => [D.x + fx * D.w, D.y + fy * D.h]

  // una schermata vera (solo il suo lcd) nel rettangolo unitario, con la nuova che scende dall'alto (k = quanto)
  function lcdUnita(g, vecchia, nuova, k, luce) {
    const sw = (LCD_B.u1 - LCD_B.u0), sh = (LCD_B.v1 - LCD_B.v0)
    const src = (im) => [LCD_B.u0 * im.width, LCD_B.v0 * im.height, sw * im.width, sh * im.height]
    g.drawImage(vecchia, ...src(vecchia), 0, 0, 1, 1)
    if (k < 1) {
      g.save(); g.beginPath(); g.rect(0, 0, 1, k); g.clip()
      g.drawImage(nuova, ...src(nuova), 0, 0, 1, 1)
      g.restore()
      g.fillStyle = 'rgba(255,214,150,.55)'
      g.fillRect(0, k - 0.012, 1, 0.02)
    } else g.drawImage(nuova, ...src(nuova), 0, 0, 1, 1)
    // la retroilluminazione che respira, e un riflesso del vetro che passa
    if (luce !== 0) { g.fillStyle = luce > 0 ? `rgba(255,190,110,${luce})` : `rgba(0,0,0,${-luce})`; g.fillRect(0, 0, 1, 1) }
  }

  // l'lcd sui quattro angoli: due triangoli, ognuno con la sua trasformazione affine esatta
  function lcdSulMuro(g, vecchia, nuova, k, luce, riflesso) {
    const p0 = angolo(0), p1 = angolo(1), p2 = angolo(2), p3 = angolo(3)
    g.save()
    g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.closePath(); g.clip()
    g.fillStyle = '#c06e24'
    g.fill()
    g.save()
    g.transform(p1[0] - p0[0], p1[1] - p0[1], p3[0] - p0[0], p3[1] - p0[1], p0[0], p0[1])
    lcdUnita(g, vecchia, nuova, k, luce)
    g.restore()
    // il secondo triangolo (in basso a destra)
    g.beginPath(); g.moveTo(p1[0] + 1, p1[1] - 1); g.lineTo(p2[0] + 1, p2[1] + 1); g.lineTo(p3[0] - 1, p3[1] + 1); g.closePath(); g.clip()
    const e = [p1[0] + p3[0] - p2[0], p1[1] + p3[1] - p2[1]]
    g.transform(p2[0] - p3[0], p2[1] - p3[1], p2[0] - p1[0], p2[1] - p1[1], e[0], e[1])
    lcdUnita(g, vecchia, nuova, k, luce)
    g.restore()
    // il vetro: un riflesso obliquo che scorre
    if (riflesso > -0.5 && riflesso < 1.5) {
      g.save()
      g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.closePath(); g.clip()
      const x = lerp(p0[0] - D.w * 0.2, p1[0] + D.w * 0.1, riflesso)
      const gr = g.createLinearGradient(x - D.w * 0.06, p0[1], x + D.w * 0.06, p3[1])
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      g.fillRect(p0[0] - D.w * 0.3, p0[1] - D.h * 0.1, D.w * 0.8, D.h * 0.6)
      g.restore()
    }
  }

  // il tasto premuto: un'ombra a mezzaluna dal lato premuto (verso: 0 su, 1 destra, 2 giù, 3 sinistra; -1 OK)
  function premi(g, croce, ok, verso, k, ry = 1) {
    if (k <= 0) return
    g.save()
    g.globalAlpha = k
    if (verso < 0) {
      const [x, y, r] = ok
      const gr = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r * 1.05)
      gr.addColorStop(0, 'rgba(60,20,0,.05)'); gr.addColorStop(1, 'rgba(40,12,0,.55)')
      g.fillStyle = gr
      g.beginPath(); g.ellipse(x, y, r, r * ry, 0, 0, TAU); g.fill()
    } else {
      const [x, y, r] = croce
      const a = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][verso]
      g.beginPath(); g.ellipse(x, y, r, r * ry, 0, 0, TAU); g.clip()
      const dx = Math.cos(a) * r * 0.75, dy = Math.sin(a) * r * 0.75 * ry
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r * 0.7)
      gr.addColorStop(0, 'rgba(40,12,0,.5)'); gr.addColorStop(1, 'rgba(40,12,0,0)')
      g.fillStyle = gr
      g.fillRect(x - r, y - r * ry, r * 2, r * 2 * ry)
    }
    g.restore()
  }

  function titolo(g, o) {
    // a muro: dove sta il titolo della copertina; aperto: piccolo, in basso a destra sul fronte grigio, come una
    // serigrafia del modello (la scritta PZKKO arancione resta quella vera, a sinistra)
    const k = ease.inOut(clamp((o - 0.45) / 0.55))
    const nome = m.titolo || 'PZK Zero'
    const size = lerp(W * 0.115, W * 0.05, k)
    g.save()
    g.font = `400 ${size}px "${m.font}"`
    g.textBaseline = 'alphabetic'
    const larg = g.measureText(nome).width
    const x = lerp(W * 0.05, W * 0.955 - larg, k), y = lerp(W * 0.09 + size * 0.8, H * 0.905, k)
    if (k < 1) {
      g.globalAlpha = 1 - k
      g.fillStyle = 'rgba(0,0,0,.35)'
      g.fillText(nome, x, y + size * 0.05)
      g.fillStyle = '#ffffff'
      g.fillText(nome, x, y)
    }
    if (k > 0) {
      g.globalAlpha = k
      g.fillStyle = 'rgba(255,255,255,.7)'
      g.fillText(nome, x, y + Math.max(1, size * 0.04))
      g.fillStyle = '#5d6066'
      g.fillText(nome, x, y)
    }
    g.restore()
  }

  let dprFatto = 0
  function frame(t, dt) {
    if (m.w !== W || m.h !== H || m.dpr !== dprFatto) { dprFatto = m.dpr; ridimensiona(m.w, m.h) }
    const g = m.g, su = m.su
    tau += dt * (1 + 0.7 * su)
    // quanto è «aperto» (0 sul muro, 1 dritto sullo schermo): il volo del ciclo, o il mouse sopra
    const c = tau % GIRO
    const giro = smooth(7.3, 8.5, c) - smooth(11.4, 12.6, c)
    const o = Math.max(giro, ease.inOut(su))
    // la schermata di adesso e quella di prima, col tasto che le ha cambiate
    const n = Math.floor(tau / PASSO), u = tau / PASSO - n
    const nuova = shots[n % shots.length], vecchia = shots[(n + shots.length - 1) % shots.length]
    const wipe = ease.out(clamp(u / 0.16))
    const verso = n % 3 === 0 ? -1 : n % 3 === 1 ? 2 : 1 // OK, giù, destra
    const premuto = smooth(0, 0.03, u) * (1 - smooth(0.1, 0.2, u))
    const luce = 0.04 * Math.sin(tau * 1.7) + (u < 0.18 ? 0.12 * (1 - u / 0.18) : 0)
    const led = (n % 4 === 2 ? 1 : 0) * (0.5 + 0.5 * Math.sin(tau * 9))

    // ── la vista sul muro ──
    if (o < 0.62) {
      const k = ease.inOut(clamp(o / 0.6))
      const p0 = angolo(0), p1 = angolo(1), p2 = angolo(2), p3 = angolo(3)
      const cA = [(p0[0] + p1[0] + p2[0] + p3[0]) / 4, (p0[1] + p1[1] + p2[1] + p3[1]) / 4]
      const larg = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      const zm = ((LCD_B.u1 - LCD_B.u0) * W) / larg
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
      const cB = [((LCD_B.u0 + LCD_B.u1) / 2) * W, ((LCD_B.v0 + LCD_B.v1) / 2) * H]
      // la telecamera: una deriva lenta, poi il volo verso lo schermo (zoom, rotazione, centro)
      const drift = [Math.sin(tau * 0.23) * W * 0.008, Math.cos(tau * 0.19) * H * 0.008]
      const z = lerp(1, zm, k), rot = -ang * k
      const tx = lerp(cA[0] + drift[0], cB[0], k), ty = lerp(cA[1] + drift[1], cB[1], k)
      g.save()
      g.translate(tx, ty); g.rotate(rot); g.scale(z, z); g.translate(-cA[0], -cA[1])
      // il muro più lontano: si muove meno
      g.save()
      g.translate(cA[0], cA[1]); g.scale(1 / (1 + (z - 1) * 0.55), 1 / (1 + (z - 1) * 0.55)); g.translate(-cA[0], -cA[1])
      kit.metti(g, fondo, -W * 0.06 - drift[0] * 0.6, -H * 0.06 - drift[1] * 0.6, W * 1.12, H * 1.12)
      g.restore()
      // la luce arancione dell'lcd sul muro
      g.save()
      g.globalCompositeOperation = 'lighter'
      const gl = g.createRadialGradient(cA[0], cA[1], 0, cA[0], cA[1], D.w * 0.75)
      gl.addColorStop(0, `rgba(255,120,20,${0.2 + luce})`); gl.addColorStop(1, 'rgba(255,120,20,0)')
      g.fillStyle = gl
      g.fillRect(cA[0] - D.w, cA[1] - D.w, D.w * 2, D.w * 2)
      g.restore()
      kit.metti(g, ombra, D.x - D.w * 0.07, D.y - D.h * 0.04, D.w * 1.2, D.h * 1.3)
      g.drawImage(dev, D.x, D.y, D.w, D.h)
      lcdSulMuro(g, vecchia, nuova, wipe, luce, ((tau % 6.5) / 6.5) * 2.2 - 0.6)
      // i tasti premuti e il led
      const cr = TASTI_A.croce, okA = TASTI_A.ok
      const sc = D.w
      premi(g, [...inA(cr[0], cr[1]), cr[2] * sc], [...inA(okA[0], okA[1]), okA[2] * sc], verso, premuto * 0.9, 1.02)
      const [lx, ly] = inA(dati.led.x, dati.led.y), lr = dati.led.r * D.w
      if (led > 0.02) {
        g.save(); g.globalCompositeOperation = 'lighter'
        const gr = g.createRadialGradient(lx, ly, 0, lx, ly, lr * 4)
        gr.addColorStop(0, `rgba(120,255,140,${0.9 * led})`); gr.addColorStop(1, 'rgba(120,255,140,0)')
        g.fillStyle = gr; g.fillRect(lx - lr * 4, ly - lr * 4, lr * 8, lr * 8)
        g.restore()
      }
      if (attacco) kit.metti(g, attacco, D.x, D.y, D.w, D.h)
      g.restore()
    }

    // ── la vista aperta: dritto sul fronte, la cattura vera a tutto riquadro ──
    const b = smooth(0.4, 0.62, o)
    if (b > 0) {
      const push = 1 + 0.05 * clamp((o - 0.55) / 0.45) + 0.012 * Math.sin(tau * 0.5)
      const cB = [((LCD_B.u0 + LCD_B.u1) / 2) * W, ((LCD_B.v0 + LCD_B.v1) / 2) * H]
      g.save()
      g.globalAlpha = b
      g.translate(cB[0], cB[1]); g.scale(push, push); g.translate(-cB[0], -cB[1])
      g.drawImage(vecchia, 0, 0, W, H)
      // la schermata nuova scende dentro l'lcd
      const lx = LCD_B.u0 * W, ly = LCD_B.v0 * H, lw = (LCD_B.u1 - LCD_B.u0) * W, lh = (LCD_B.v1 - LCD_B.v0) * H
      g.save(); g.beginPath(); g.rect(lx - W * 0.02, ly - H * 0.02, lw + W * 0.04, (lh + H * 0.04) * wipe); g.clip()
      g.drawImage(nuova, 0, 0, W, H)
      g.restore()
      if (wipe < 1) { g.fillStyle = 'rgba(255,214,150,.5)'; g.fillRect(lx, ly - H * 0.02 + (lh + H * 0.04) * wipe - 1, lw, 2) }
      if (luce > 0) { g.fillStyle = `rgba(255,190,110,${luce * 0.8})`; g.fillRect(lx, ly, lw, lh) }
      // i tasti di fronte
      const cr = TASTI_B.croce, okB = TASTI_B.ok
      premi(g, [cr[0] * W, cr[1] * H, cr[2] * W], [okB[0] * W, okB[1] * H, okB[2] * W], verso, premuto, 1)
      if (led > 0.02) {
        const [x, y] = TASTI_B.led, r = W * 0.012
        g.save(); g.globalCompositeOperation = 'lighter'
        const gr = g.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * 3)
        gr.addColorStop(0, `rgba(120,255,140,${led})`); gr.addColorStop(1, 'rgba(120,255,140,0)')
        g.fillStyle = gr; g.fillRect(x * W - r * 3, y * H - r * 3, r * 6, r * 6)
        g.restore()
      }
      // un riflesso sul vetro che attraversa
      const rx = ((tau % 4.3) / 4.3) * 1.6 - 0.3
      g.save(); g.beginPath(); g.rect(lx, ly, lw, lh); g.clip()
      const gr = g.createLinearGradient((rx - 0.08) * W, 0, (rx + 0.08) * W, H * 0.6)
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr; g.fillRect(lx, ly, lw, lh)
      g.restore()
      g.restore()
    }
    // il lampo del volo, quando una vista lascia il posto all'altra
    const lampo = 1 - Math.abs(o - 0.51) / 0.1
    if (lampo > 0 && o < 0.99) { g.fillStyle = `rgba(255,200,140,${0.22 * lampo})`; g.fillRect(0, 0, W, H) }
    if (b < 1) kit.metti(g, fino, 0, 0, W, H)
    if (b > 0) { g.save(); g.globalAlpha = b; kit.metti(g, viaVig, 0, 0, W, H); g.restore() }
    titolo(g, o)
  }

  return { frame, ridimensiona, titolo: false, cattura: false, fermo: 2.6 }
}
