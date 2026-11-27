// Tavolozza: il banco di colore dell'app, vivo. Il colore di partenza resta quello dell'app (#b3121f); girano la
// «ruota» e l'armonia, e i cinque campioni si rigenerano con la matematica vera (OKLCH, gamut, contrasto WCAG):
// esadecimale, oklch(), contrasto col bianco e col nero e il timbro AA/AAA sono calcolati, non scritti a mano.
// La ruota dei toni mostra la forma dell'armonia. Col mouse sopra passa la lente del daltonismo (stesse matrici).
export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU, con, tondo, strato, metti, nastro, timbro, PZK, rng } = kit
  await Promise.all(['Monkey Bars', 'Anton', 'Special Elite', 'Permanent Marker'].map((f) => kit.font(f)))
  const puntina = await kit.imgForse('/art/nastro/puntina.webp')

  // ── la matematica dell'app (games/tavolozza) ──
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
  const c01 = (n) => Math.max(0, Math.min(1, n))
  const rgbHex = (r, g, b) => `#${[r, g, b].map((x) => Math.round(c01(x) * 255).toString(16).padStart(2, '0')).join('')}`
  const hexRgb = (h) => { const s = h.slice(1); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255) }
  function rgbOklch([r, g, b]) {
    const R = lin(r), G = lin(g), B = lin(b)
    const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
    const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
    const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180 / Math.PI) + 360) % 360 }
  }
  function oklchRgb(L, C, h) {
    const r = h * Math.PI / 180, a = Math.cos(r) * C, b = Math.sin(r) * C
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return [gam(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s), gam(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s), gam(-0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s)]
  }
  const dentro = (rgb) => rgb.every((x) => x >= -0.0001 && x <= 1.0001)
  function oklchHex(L, C, h) {
    let rgb = oklchRgb(L, C, h)
    if (!dentro(rgb)) {
      let lo = 0, hi = C
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (dentro(oklchRgb(L, mid, h))) lo = mid; else hi = mid }
      rgb = oklchRgb(L, lo, h)
    }
    return rgbHex(...rgb.map(c01))
  }
  const lum = (rgb) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const contrasto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const testoSu = (rgb) => (contrasto(rgb, [1, 1, 1]) >= contrasto(rgb, [0, 0, 0]) ? '#ffffff' : '#161616')
  const DALTONISMO = [
    ['protanopia', [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998]],
    ['deuteranopia', [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881]],
    ['tritanopia', [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900]],
  ]
  function simula(hex, M) {
    const [r, g, b] = hexRgb(hex).map(lin)
    return rgbHex(gam(c01(M[0] * r + M[1] * g + M[2] * b)), gam(c01(M[3] * r + M[4] * g + M[5] * b)), gam(c01(M[6] * r + M[7] * g + M[8] * b)))
  }
  const OFFSET = {
    analoga: [0, -26, 26, -50, 50], complementare: [0, 180, 12, 192, -12], triade: [0, 120, 240, 20, 140],
    tetrade: [0, 90, 180, 270, 45], monocroma: [0, 0, 0, 0, 0],
  }
  const BASE = '#b3121f'
  const b0 = rgbOklch(hexRgb(BASE))
  function genera(armonia, ruota, cromia) {
    const h = (b0.h + ruota + 360) % 360
    const luce = [0.2, 0.1, 0, -0.1, -0.2]
    const tutti = OFFSET[armonia].map((off, i) => {
      const hue = (h + off + 360) % 360
      const L = clamp(b0.L + luce[i], 0.16, 0.97)
      const C = clamp(b0.C * cromia * (1 - Math.abs(luce[i]) * 0.55), 0, 0.37)
      const hex = oklchHex(L, C, hue)
      const rgb = hexRgb(hex)
      const cw = contrasto(rgb, [1, 1, 1]), cb = contrasto(rgb, [0, 0, 0])
      return {
        hex, L, C, h: hue, i, rgb, cw, cb, su: testoSu(rgb),
        voto: cw >= 7 || cb >= 7 ? 'AAA' : cw >= 4.5 || cb >= 4.5 ? 'AA' : '—',
        testo: `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${hue.toFixed(1)})`,
        dalto: DALTONISMO.map(([, M]) => simula(hex, M)),
      }
    })
    // il colore di partenza ruotato (quello che l'app mette nel selettore)
    const hc = oklchHex(b0.L, clamp(b0.C * cromia, 0, 0.37), h), rc = hexRgb(hc)
    tutti.centro = { hex: hc, su: testoSu(rc), L: b0.L, testo: `oklch(${(b0.L * 100).toFixed(1)}% ${clamp(b0.C * cromia, 0, 0.37).toFixed(3)} ${h.toFixed(1)})` }
    return tutti
  }
  // i giri della ruota: armonia e rotazione come se qualcuno muovesse i comandi dell'app
  const PASSI = [['analoga', 0, 1], ['complementare', 118, 1], ['triade', -96, 0.95], ['tetrade', 52, 1.1], ['monocroma', -150, 1.2], ['analoga', 164, 1]]
  const TAV = PASSI.map(([a, r, c]) => ({ armonia: a, ruota: r, cromia: c, colori: genera(a, r, c) }))
  const DUR = 2.6, CICLO = DUR * PASSI.length

  let W = 0, H = 0, s = 1, fondo = null, ruota = null, ombra = null
  const lay = {}
  function misure() {
    s = W / 480
    const k = Math.min(1, (H / W) / (270 / 480))
    lay.cardTop = H - 140 * s
    lay.cardH = 128 * s
    lay.gap = 8 * s
    lay.cardW = (W - 32 * s - 4 * lay.gap) / 5
    lay.rx = W - 72 * s; lay.ry = 66 * s * k + 4 * s; lay.rr = 52 * s
  }
  // i foglietti già disegnati (ombra compresa), uno per passo e per posto: si rifanno solo quando servono
  let facce = new Map()
  function faccia(passo, i) {
    const k = passo * 5 + i
    if (!facce.has(k)) {
      if (facce.size > 14) facce.delete(facce.keys().next().value)
      const w = lay.cardW, h = lay.cardH
      facce.set(k, strato(w + 24 * s, h + 24 * s, m.dpr, (g) => campione(g, TAV[passo].colori[i], i, 12 * s, 12 * s, w, h, 1, null, true)))
    }
    return facce.get(k)
  }
  function faiStrati() {
    facce = new Map()
    fondo = strato(W, H, m.dpr, (g) => {
      g.fillStyle = '#f2eee3'; g.fillRect(0, 0, W, H)
      // il tappetino da taglio: quadretti e i numeri della riga
      g.strokeStyle = 'rgba(20,70,160,.07)'; g.lineWidth = Math.max(0.6, 0.6 * s)
      for (let x = 0; x < W; x += 12 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
      for (let y = 0; y < H; y += 12 * s) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
      g.strokeStyle = 'rgba(20,70,160,.14)'
      for (let x = 0; x < W; x += 60 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
      const r = g.createRadialGradient(W * 0.35, H * 0.2, 0, W * 0.4, H * 0.3, W * 0.85)
      r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(110,90,50,.18)')
      g.fillStyle = r; g.fillRect(0, 0, W, H)
      const rr = rng(3)
      for (let i = 0; i < 700 * s * s + 150; i++) {
        g.fillStyle = rr() < 0.5 ? 'rgba(80,60,30,.07)' : 'rgba(255,255,255,.2)'
        g.fillRect(rr() * W, rr() * H, s * (0.5 + rr()), s * (0.5 + rr()))
      }
      // gocce di colore secco sul tappetino (dettagli)
      const gocce = [['#b3121f', 0.47, 0.06, 5], ['#1446a0', 0.58, 0.16, 3], ['#ffd400', 0.04, 0.5, 4], ['#23864a', 0.52, 0.42, 2.5]]
      for (const [c, x, y, rd] of gocce) {
        g.fillStyle = c; g.globalAlpha = 0.55
        g.beginPath(); g.arc(W * x, H * y, rd * s, 0, TAU); g.fill()
        g.beginPath(); g.arc(W * x + rd * 1.6 * s, H * y + rd * 0.7 * s, rd * 0.35 * s, 0, TAU); g.fill()
      }
      g.globalAlpha = 1
    })
    // la ruota dei toni OKLCH (L 0.7, C 0.14): fatta una volta
    const R = lay.rr, D = R * 2 + 24 * s
    ruota = strato(D, D, m.dpr, (g) => {
      const c = D / 2
      g.shadowColor = 'rgba(40,30,10,.4)'; g.shadowBlur = 10 * s; g.shadowOffsetY = 4 * s
      g.fillStyle = '#fffdf6'
      g.beginPath(); g.arc(c, c, R + 8 * s, 0, TAU); g.fill()
      g.shadowColor = 'transparent'
      const N = 90
      for (let i = 0; i < N; i++) {
        const a0 = i / N * TAU, a1 = (i + 1.15) / N * TAU
        g.fillStyle = oklchHex(0.68, 0.15, i / N * 360)
        g.beginPath(); g.arc(c, c, R, a0, a1); g.arc(c, c, R - 13 * s, a1, a0, true); g.closePath(); g.fill()
      }
      // dentro: la luce, dal nero al bianco
      const gr = g.createRadialGradient(c, c, 0, c, c, R - 13 * s)
      gr.addColorStop(0, '#fffdf6'); gr.addColorStop(1, '#ece6d6')
      g.fillStyle = gr
      g.beginPath(); g.arc(c, c, R - 13 * s, 0, TAU); g.fill()
      g.strokeStyle = PZK.nero; g.lineWidth = Math.max(1, 1.3 * s)
      g.beginPath(); g.arc(c, c, R, 0, TAU); g.stroke()
      g.beginPath(); g.arc(c, c, R - 13 * s, 0, TAU); g.stroke()
      // le tacche ogni 30°
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU
        g.beginPath(); g.moveTo(c + Math.cos(a) * (R + 1 * s), c + Math.sin(a) * (R + 1 * s)); g.lineTo(c + Math.cos(a) * (R + 5 * s), c + Math.sin(a) * (R + 5 * s)); g.stroke()
      }
    })
    // l'ombra morbida dei foglietti (una, riusata)
    ombra = strato(lay.cardW + 24 * s, lay.cardH + 24 * s, m.dpr, (g) => {
      g.shadowColor = 'rgba(40,30,10,.5)'; g.shadowBlur = 9 * s; g.shadowOffsetY = 5 * s
      g.fillStyle = '#000'; g.fillRect(12 * s, 12 * s, lay.cardW, lay.cardH)
      g.globalCompositeOperation = 'destination-out'; g.shadowColor = 'transparent'
      g.fillRect(12 * s, 12 * s, lay.cardW, lay.cardH)
    })
  }

  const ROT = [-0.8, 0.9, -0.3, 0.9, -0.8].map((d) => d * Math.PI / 180)
  // un campione come .tv-sw: foglietto bianco, colore, numero, HEX in Anton, oklch, contrasti e voto
  function campione(g, c, i, x, y, w, h, sx, colore, dritto) {
    con(g, x + w / 2, y + h / 2, dritto ? 0 : ROT[i], 1, () => {
      g.scale(sx, 1)
      g.drawImage(ombra, -w / 2 - 12 * s, -h / 2 - 12 * s, w + 24 * s, h + 24 * s)
      g.fillStyle = '#fffdf6'
      g.fillRect(-w / 2, -h / 2, w, h)
      const b = 4 * s
      g.fillStyle = colore || c.hex
      g.fillRect(-w / 2 + b, -h / 2 + b, w - 2 * b, h - b * 2.6)
      if (Math.abs(sx) < 0.25) return
      const tc = c.su
      g.fillStyle = tc
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'
      g.globalAlpha = 0.65
      g.font = `400 ${7.5 * s}px "Special Elite"`
      g.fillText(String(i + 1).padStart(2, '0'), -w / 2 + b + 4 * s, -h / 2 + b + 10 * s)
      g.globalAlpha = 1
      g.font = `400 ${15.5 * s}px "Anton"`
      g.fillText(c.hex.toUpperCase(), -w / 2 + b + 4 * s, h / 2 - b * 2.6 - 30 * s)
      g.globalAlpha = 0.85
      g.font = `400 ${5.6 * s}px "Special Elite"`
      g.fillText(c.testo, -w / 2 + b + 4 * s, h / 2 - b * 2.6 - 20 * s)
      g.fillText(`b ${c.cw.toFixed(1)} · n ${c.cb.toFixed(1)}`, -w / 2 + b + 4 * s, h / 2 - b * 2.6 - 11 * s)
      g.globalAlpha = 1
      // il voto in un riquadretto
      g.font = `400 ${7 * s}px "Anton"`
      const vw = g.measureText(c.voto).width + 5 * s
      const vx = w / 2 - b - vw - 4 * s, vy = h / 2 - b * 2.6 - 17 * s
      g.strokeStyle = tc; g.lineWidth = Math.max(0.8, 0.9 * s)
      g.strokeRect(vx, vy, vw, 10 * s)
      if (c.voto !== '—') { g.fillStyle = tc === '#ffffff' ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.1)'; g.fillRect(vx, vy, vw, 10 * s); g.fillStyle = tc }
      g.textAlign = 'center'
      g.fillText(c.voto, vx + vw / 2, vy + 8.2 * s)
    })
  }

  return {
    titolo: false,
    fermo: 3.4,
    ridimensiona(w, h) { W = w; H = h; misure(); faiStrati() },
    frame(t) {
      const g = m.g, su = m.su
      if (W !== m.w || H !== m.h || !fondo) { W = m.w; H = m.h; misure(); faiStrati() }
      const c = t % CICLO
      const n = Math.floor(c / DUR), k = (c % DUR) / DUR
      const ora = TAV[n], prima = TAV[(n + PASSI.length - 1) % PASSI.length]
      metti(g, fondo, 0, 0, W, H)

      // il cambio: i foglietti si girano uno dopo l'altro, nei primi 0,8 s del passo
      const giro = (i) => clamp((c % DUR - i * 0.08) / 0.42)
      const colori = ora.colori.map((cc, i) => (giro(i) < 0.5 ? prima.colori[i] : cc))
      const passoDi = (i) => (giro(i) < 0.5 ? (n + PASSI.length - 1) % PASSI.length : n)
      // la ruota che si muove morbida verso la rotazione nuova
      const kr = ease.inOut(clamp((c % DUR) / 0.7))
      const ruotaOra = lerp(prima.ruota, ora.ruota, kr)

      // ── il titolo: ogni lettera prende un colore della tavolozza ──
      const lettere = 'Tavolozza'
      const ts = 44 * s
      g.font = `400 ${ts}px "Monkey Bars"`
      g.textBaseline = 'alphabetic'; g.textAlign = 'left'
      let x = 20 * s
      const ty = 62 * s
      for (let i = 0; i < lettere.length; i++) {
        const ch = lettere[i]
        const cw = g.measureText(ch).width
        const col = colori[i % 5]
        const sb = Math.sin(t * 2.2 + i * 0.7) * 1.6 * s * (0.4 + su)
        const r = Math.sin(i * 1.7) * 0.05
        con(g, x + cw / 2, ty + sb, r, 1, () => {
          g.fillStyle = PZK.nero
          g.fillText(ch, -cw / 2 + 2.2 * s, 2.6 * s)
          g.fillStyle = col.hex
          g.fillText(ch, -cw / 2, 0)
          g.strokeStyle = 'rgba(20,20,20,.55)'; g.lineWidth = Math.max(0.7, 0.8 * s)
          g.strokeText(ch, -cw / 2, 0)
        })
        x += cw - 0.5 * s
      }
      // la riga del colore di partenza, come la scrive l'app
      const base = giro(0) < 0.5 ? prima.colori.centro : ora.colori.centro
      g.font = `400 ${8.5 * s}px "Special Elite"`
      g.fillStyle = '#36312b'
      g.fillText(`${base.testo}  ·  ${ora.armonia}`, 22 * s, ty + 18 * s)

      // ── il cursore «ruota» con la puntina rossa e il tasto nero dell'armonia ──
      const sy = ty + 36 * s, sx0 = 50 * s, sx1 = 178 * s
      g.fillStyle = '#5a544c'
      g.font = `400 ${8 * s}px "Special Elite"`
      g.fillText('ruota', 22 * s, sy + 3 * s)
      g.fillStyle = PZK.nero
      g.fillRect(sx0, sy - 0.8 * s, sx1 - sx0, 1.6 * s)
      for (let i = 0; i <= 8; i++) g.fillRect(sx0 + (sx1 - sx0) * i / 8, sy + (i % 4 ? 2 : 1) * s, Math.max(0.7, 0.8 * s), (i % 4 ? 3 : 5) * s)
      const kx = lerp(sx0, sx1, (ruotaOra + 180) / 360)
      g.fillStyle = PZK.rosso; g.globalAlpha = 0.5
      g.fillRect(lerp(sx0, sx1, 0.5), sy - 0.8 * s, kx - lerp(sx0, sx1, 0.5), 1.6 * s)
      g.globalAlpha = 1
      if (puntina) { const pz = 17 * s; g.drawImage(puntina, kx - pz / 2, sy - pz * 0.78, pz, pz) }
      else { g.fillStyle = PZK.rosso; g.beginPath(); g.arc(kx, sy, 5 * s, 0, TAU); g.fill() }
      g.fillStyle = PZK.nero
      g.font = `400 ${8.5 * s}px "Special Elite"`
      g.fillText(`${Math.round(ruotaOra)}°`, sx1 + 6 * s, sy + 3 * s)
      // il tasto nero inclinato con l'armonia (premuto quando cambia)
      const kp = 1 - clamp((c % DUR) / 0.25)
      g.font = `400 ${11 * s}px "Anton"`
      const bw = g.measureText(ora.armonia).width + 14 * s, bh = 18 * s
      con(g, sx1 + 34 * s + bw / 2, sy + kp * 2 * s, -0.06, 1, () => {
        g.fillStyle = 'rgba(20,20,20,.35)'; g.fillRect(-bw / 2 + 1.5 * s, -bh / 2 + 2.5 * s * (1 - kp), bw, bh)
        g.fillStyle = PZK.nero; g.fillRect(-bw / 2, -bh / 2, bw, bh)
        g.fillStyle = '#fffdf6'; g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillText(ora.armonia, 0, 0.5 * s)
      })
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'

      // ── la ruota dei toni: i cinque punti e la forma dell'armonia ──
      const { rx, ry, rr } = lay
      const D = rr * 2 + 24 * s
      con(g, rx, ry, 0, 1 + su * 0.04, () => {
        g.drawImage(ruota, -D / 2, -D / 2, D, D)
        nastro(g, -rr * 0.2, -rr - 8 * s, 30 * s, 10 * s, -0.12)
        const pts = ora.colori.map((cc, i) => {
          const hp = prima.colori[i].h, hn = cc.h
          let dh = ((hn - hp + 540) % 360) - 180
          const hh = (hp + dh * ease.inOut(clamp(((c % DUR) - i * 0.08) / 0.55))) * Math.PI / 180
          // in OKLCH l'angolo 0 è il rosso-magenta; sulla ruota l'angolo cresce in senso orario come nel disegno
          const rad = rr - 6.5 * s - (i - 2) * 0.9 * s
          return [Math.cos(hh) * rad, Math.sin(hh) * rad]
        })
        // la forma dell'armonia: un poligono a inchiostro
        g.strokeStyle = PZK.nero; g.lineWidth = Math.max(0.8, 1 * s)
        g.setLineDash([3 * s, 2.5 * s])
        g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.stroke()
        g.setLineDash([])
        // la lancetta sul tono di partenza
        const [bx, by] = pts[0]
        g.strokeStyle = PZK.rosso; g.lineWidth = Math.max(1, 1.6 * s)
        g.beginPath(); g.moveTo(0, 0); g.lineTo(bx * 1.12, by * 1.12); g.stroke()
        pts.forEach(([px, py], i) => {
          g.fillStyle = '#fffdf6'
          g.beginPath(); g.arc(px, py, 5.2 * s, 0, TAU); g.fill()
          g.fillStyle = colori[i].hex
          g.beginPath(); g.arc(px, py, 3.8 * s, 0, TAU); g.fill()
          g.strokeStyle = PZK.nero; g.lineWidth = Math.max(0.7, 0.9 * s)
          g.beginPath(); g.arc(px, py, 5.2 * s, 0, TAU); g.stroke()
        })
        // al centro, il campione di partenza
        g.fillStyle = base.hex
        g.beginPath(); g.arc(0, 0, 15 * s, 0, TAU); g.fill()
        g.strokeStyle = '#fffdf6'; g.lineWidth = 2.5 * s; g.stroke()
        g.strokeStyle = PZK.nero; g.lineWidth = Math.max(0.7, 0.9 * s)
        g.beginPath(); g.arc(0, 0, 16.3 * s, 0, TAU); g.stroke()
        g.fillStyle = base.su
        g.font = `400 ${5.5 * s}px "Special Elite"`; g.textAlign = 'center'
        g.fillText('L ' + (base.L * 100).toFixed(0), 0, 2 * s)
        g.textAlign = 'left'
      })

      // ── i cinque foglietti ──
      const { cardTop, cardH, cardW, gap } = lay
      const posCarta = (i) => {
        const kk = giro(i)
        const alza = Math.sin(kk * Math.PI) * 8 * s + su * 3 * s + Math.sin(t * 1.3 + i) * 0.8 * s
        return [16 * s + i * (cardW + gap), cardTop - alza, Math.cos(kk * Math.PI)]
      }
      for (let i = 0; i < 5; i++) {
        const [cx, cy, sx] = posCarta(i)
        const f = faccia(passoDi(i), i)
        con(g, cx + cardW / 2, cy + cardH / 2, ROT[i], 1, () => {
          g.scale(Math.max(0.04, Math.abs(sx)), 1)
          g.drawImage(f, -cardW / 2 - 12 * s, -cardH / 2 - 12 * s, cardW + 24 * s, cardH + 24 * s)
        })
      }

      // il timbro sul foglietto col contrasto migliore, appena girati tutti
      let best = 0
      ora.colori.forEach((cc, i) => { if (Math.max(cc.cw, cc.cb) > Math.max(ora.colori[best].cw, ora.colori[best].cb)) best = i })
      const kt = clamp(((c % DUR) - 0.85) / 0.3)
      if (kt > 0) {
        const [cx, cy] = posCarta(best)
        const sc = kt < 1 ? lerp(1.9, 1, ease.outBack(kt)) : 1
        g.globalAlpha = 0.9 * clamp((DUR - (c % DUR)) / 0.25)
        con(g, cx + cardW / 2, cy + cardH * 0.36, 0, sc, () => timbro(g, ora.colori[best].voto === '—' ? 'AA' : ora.colori[best].voto, 0, 0, 30 * s, -0.22 + best * 0.05, PZK.rosso, 1))
        g.globalAlpha = 1
      }

      // ── il colpo: all'inizio del giro i coriandoli di carta nei cinque colori escono dalla ruota ──
      const tc = c
      if (tc < 1.6) {
        const r = rng(11)
        for (let i = 0; i < 46; i++) {
          const a = -Math.PI / 2 + (r() - 0.5) * 2.6, v = (90 + r() * 170) * s
          const gx = rx + Math.cos(a) * v * tc, gy = ry + Math.sin(a) * v * tc + 260 * s * tc * tc
          const al = clamp((1.6 - tc) * 1.6)
          con(g, gx, gy, tc * (4 + r() * 8) + r() * 6, 1, () => {
            g.globalAlpha = al
            g.fillStyle = TAV[0].colori[i % 5].hex
            g.fillRect(-3 * s, -1.8 * s * Math.abs(Math.cos(tc * 9 + i)), 6 * s, 3.6 * s * Math.abs(Math.cos(tc * 9 + i)) + 0.4)
          })
        }
        g.globalAlpha = 1
      }

      // ── col mouse sopra: la lente del daltonismo passa sui foglietti ──
      if (su > 0.02) {
        const corsa = (Math.sin(t * 0.9) * 0.5 + 0.5)
        const lx = lerp(16 * s + cardW * 0.6, W - 16 * s - cardW * 0.6, corsa)
        const ly = cardTop + cardH * 0.45
        const LR = 40 * s * ease.outBack(clamp(su))
        const tipo = Math.floor(t / 2.5) % 3
        g.save()
        g.beginPath(); g.arc(lx, ly, LR, 0, TAU); g.clip()
        g.fillStyle = '#f2eee3'; g.fillRect(lx - LR, ly - LR, LR * 2, LR * 2)
        g.translate(lx, ly); g.scale(1.18, 1.18); g.translate(-lx, -ly)
        for (let i = 0; i < 5; i++) {
          const [cx, cy, sx] = posCarta(i)
          if (cx > lx + LR || cx + cardW < lx - LR) continue
          const cc = colori[i]
          const finto = { ...cc, su: testoSu(hexRgb(cc.dalto[tipo])) }
          campione(g, finto, i, cx, cy, cardW, cardH, Math.max(0.04, Math.abs(sx)), cc.dalto[tipo])
        }
        g.restore()
        // vetro, cerchio e manico
        g.globalAlpha = su
        const lg = g.createLinearGradient(lx - LR, ly - LR, lx + LR, ly + LR)
        lg.addColorStop(0, 'rgba(255,255,255,.35)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,.12)')
        g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, LR, 0, TAU); g.fill()
        g.strokeStyle = PZK.nero; g.lineWidth = 3.2 * s
        g.beginPath(); g.arc(lx, ly, LR, 0, TAU); g.stroke()
        con(g, lx + LR * 0.72, ly + LR * 0.72, Math.PI / 4, 1, () => {
          g.fillStyle = PZK.nero; tondo(g, 0, -3.5 * s, 26 * s, 7 * s, 3 * s); g.fill()
        })
        // il cartellino col tipo di simulazione
        con(g, lx, ly - LR - 9 * s, -0.04, 1, () => {
          g.font = `400 ${8.5 * s}px "Special Elite"`
          const tw = g.measureText(DALTONISMO[tipo][0]).width + 10 * s
          g.fillStyle = PZK.giallo; g.fillRect(-tw / 2, -7 * s, tw, 13 * s)
          g.fillStyle = PZK.nero; g.textAlign = 'center'; g.textBaseline = 'middle'
          g.fillText(DALTONISMO[tipo][0], 0, 0)
        })
        g.textAlign = 'left'; g.textBaseline = 'alphabetic'
        g.globalAlpha = 1
      }

      kit.vignetta(g, W, H, 0.22)
      kit.granella(g, W, H, 0.05, t)
    },
  }
}
