// miniature/specchio.js — lo specchio con gli effetti (27.11.2026).
// Niente webcam e niente WebGL: davanti allo «specchio» c'è una scena del muro senza persone (la saracinesca, il
// pezzo PZK, un pomodoro che rimbalza, una lampada che passa), ridisegnata ogni fotogramma su una griglia piccola, e
// sopra girano i sei effetti del frammento GLSL di games/specchio/specchio.js rifatti in JavaScript con la stessa
// matematica: normale, caleidoscopio (sei spicchi), pixel, crt (bordi curvi, colori sfasati, righe), termico (la
// stessa scala di calore) e contorni (Sobel 3 × 3). Ogni 2,2 s cambia effetto con una passata; nel caleidoscopio
// scatta la foto: lampo, otturatore e la polaroid che resta attaccata col nastro. Ciclo di 13,2 s.
// Col mouse sopra: il tempo corre, la camera è «in diretta» e una riga divide lo schermo in prima/dopo.

const EFFETTI = ['normale', 'caleidoscopio', 'pixel', 'crt', 'termico', 'contorni']
const PASSO = 2.2, CICLO = PASSO * EFFETTI.length, SCATTO = 4.0
const GW = 128, GH = 72
const CALORE = [0.02, 0.02, 0.35, 0.4, 0.02, 0.4, 0.95, 0.25, 0.05, 1, 0.95, 0.5]

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, ease, smooth, TAU } = kit
  const [pzk] = await Promise.all([
    kit.imgForse('/art/facciata/pezzo-pzk.webp'),
    kit.font(m.font, 700), kit.font('Special Elite'), kit.font('Permanent Marker'),
  ])

  // ── le immagini rimpicciolite una volta sola: la scena si ridisegna a 128 × 72 ogni fotogramma ──
  const piccola = (im, w, h, sx = 0, sy = 0, sw = im?.width, sh = im?.height) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    if (im) c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, w, h)
    return c
  }
  // la saracinesca del muro, a doghe, disegnata qui (piccola com'è, non serve la foto grande)
  const muro = document.createElement('canvas'); muro.width = 240; muro.height = 111
  {
    const g = muro.getContext('2d'), r = kit.rng(7)
    g.fillStyle = '#8e8e8a'; g.fillRect(0, 0, 240, 111)
    for (let y = 0; y < 111; y += 7) {
      const l = g.createLinearGradient(0, y, 0, y + 7)
      l.addColorStop(0, '#a4a49f'); l.addColorStop(0.45, '#8e8e8a'); l.addColorStop(0.8, '#6d6d69'); l.addColorStop(1, '#4f4f4c')
      g.fillStyle = l; g.fillRect(0, y, 240, 7)
    }
    for (let k = 0; k < 260; k++) { g.fillStyle = r() < 0.5 ? 'rgba(120,70,30,.35)' : 'rgba(255,255,255,.18)'; g.fillRect(r() * 240, r() * 111, 1 + r() * 2, 1) }
    g.fillStyle = 'rgba(240,236,220,.35)'; g.fillRect(170, 14, 26, 34); g.fillRect(30, 70, 18, 22)
  }
  const graf = piccola(pzk, 72, 61)
  // il pomodoro (quello maturo della scena del muro), disegnato
  const pomo = document.createElement('canvas'); pomo.width = pomo.height = 40
  {
    const g = pomo.getContext('2d')
    const l = g.createRadialGradient(15, 14, 2, 20, 21, 19)
    l.addColorStop(0, '#ff8a6a'); l.addColorStop(0.35, '#e0261c'); l.addColorStop(1, '#7a0c08')
    g.fillStyle = l; g.beginPath(); g.ellipse(20, 22, 18, 16, 0, 0, TAU); g.fill()
    g.fillStyle = '#2f7d1e'
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; g.beginPath(); g.ellipse(20 + Math.cos(a) * 4, 8 + Math.sin(a) * 2.5, 5, 1.8, a, 0, TAU); g.fill() }
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(13, 15, 4, 2.4, -0.6, 0, TAU); g.fill()
  }

  const src = document.createElement('canvas'); src.width = GW; src.height = GH
  const sg = src.getContext('2d', { willReadFrequently: true })
  const out = document.createElement('canvas'); out.width = GW; out.height = GH
  const og = out.getContext('2d')
  const outImg = og.createImageData(GW, GH)
  const foto = document.createElement('canvas'); foto.width = GW; foto.height = GH
  const fg = foto.getContext('2d')
  let fotoFatta = -1

  // ── le mappe fisse dello shader: per ogni cella, da dove si prende il colore ──
  const N = GW * GH, asp = GW / GH
  const mappaK = new Int32Array(N), mappaC = new Int32Array(N), mappaP = new Int32Array(N)
  const vig = new Float32Array(N), crtVig = new Float32Array(N)
  const cella = (u, v) => {
    const x = clamp(Math.floor(u * GW), 0, GW - 1), y = clamp(Math.floor(v * GH), 0, GH - 1)
    return y * GW + x
  }
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x
    const vx = (x + 0.5) / GW, vy = (y + 0.5) / GH
    const ux = 1 - vx // lo specchio orizzontale (uMirror), acceso come nell'app
    // caleidoscopio: il piano piegato in sei spicchi
    let px = (vx - 0.5) * asp, py = vy - 0.5
    let a = Math.atan2(py, px)
    const r = Math.hypot(px, py)
    a = ((a % (TAU / 6)) + TAU / 6) % (TAU / 6)
    a = Math.abs(a - Math.PI / 6)
    px = Math.cos(a) * r; py = Math.sin(a) * r
    mappaK[i] = cella(px / asp + 0.5, py + 0.5)
    // crt: i bordi curvi
    const cx = ux - 0.5, cy = vy - 0.5, r2 = cx * cx + cy * cy
    mappaC[i] = cella(ux + cx * r2 * 0.18 * 1.6, vy + cy * r2 * 0.18 * 1.6)
    crtVig[i] = 1 - 0.35 * r2 * 2.2
    // pixel: 180 × 120 nell'app; qui i blocchi sono in proporzione alla miniatura (36 × 24, lo stesso 3:2)
    mappaP[i] = cella(Math.floor(ux * 36) / 36 + 0.5 / 36, Math.floor(vy * 24) / 24 + 0.5 / 24)
    vig[i] = 1 - 0.28 * Math.pow(Math.hypot(vx - 0.5, vy - 0.5) * 1.4, 2)
  }
  const specchiata = new Int32Array(N)
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) specchiata[y * GW + x] = y * GW + (GW - 1 - x)
  const luma = new Float32Array(N)

  // la scena davanti alla camera: la saracinesca, il pezzo PZK, la lampada, il pomodoro che rimbalza
  function scena(t) {
    const g = sg
    const ox = Math.sin(t * 0.45) * 5 + Math.sin(t * 1.7) * 0.6, oy = Math.cos(t * 0.38) * 3
    const z = 1.06 + 0.04 * Math.sin(t * 0.27)
    g.setTransform(z, 0, 0, z, GW / 2 * (1 - z), GH / 2 * (1 - z))
    g.globalCompositeOperation = 'source-over'
    g.fillStyle = '#6f706b'; g.fillRect(-20, -20, GW + 40, GH + 40)
    g.drawImage(muro, -50 + ox * 0.5, -18 + oy * 0.5)
    // il neon blu del muro e la sua luce
    const nx = 78 + ox * 0.7, ny = 30 + oy * 0.7
    const nl = g.createRadialGradient(nx, ny, 0, nx, ny, 46)
    nl.addColorStop(0, 'rgba(31,111,235,.75)'); nl.addColorStop(1, 'rgba(31,111,235,0)')
    g.fillStyle = nl; g.fillRect(nx - 50, ny - 50, 100, 100)
    g.strokeStyle = '#9fd0ff'; g.lineWidth = 2.4
    g.beginPath(); g.arc(nx, ny, 10, 0, TAU); g.stroke()
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.9; g.stroke()
    // il pezzo
    g.drawImage(graf, 10 + ox * 0.8, 6 + oy * 0.8)
    // la lampada che passa: una macchia calda che attraversa la scena
    const lx = 64 + Math.sin(t * 0.6) * 44, ly = 40 + Math.cos(t * 0.9) * 14
    const lg = g.createRadialGradient(lx, ly, 0, lx, ly, 34)
    lg.addColorStop(0, 'rgba(255,214,140,.9)'); lg.addColorStop(1, 'rgba(255,214,140,0)')
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = lg; g.fillRect(lx - 36, ly - 36, 72, 72)
    g.globalCompositeOperation = 'source-over'
    // il pavimento e il pomodoro
    const pav = g.createLinearGradient(0, 56, 0, 80)
    pav.addColorStop(0, 'rgba(20,18,16,.0)'); pav.addColorStop(0.3, 'rgba(20,18,16,.75)'); pav.addColorStop(1, 'rgba(10,9,8,.95)')
    g.fillStyle = pav; g.fillRect(-20, 54, GW + 40, 40)
    const fase = kit.fract(t / 1.3)
    const px = 64 + Math.sin(t * 0.55) * 24 + ox, py = 63 - Math.abs(Math.sin(fase * Math.PI)) * 26
    const sq = fase < 0.06 || fase > 0.94 ? 0.82 : 1
    g.fillStyle = 'rgba(0,0,0,.45)'
    g.beginPath(); g.ellipse(px, 66, 9 * (0.6 + 0.4 * (py / 63)), 2.2, 0, 0, TAU); g.fill()
    kit.con(g, px, py, t * 1.4, 1, () => { g.scale(1 / sq, sq); g.drawImage(pomo, -10, -10, 20, 20) })
    g.setTransform(1, 0, 0, 1, 0, 0)
  }

  // ── i sei effetti, cella per cella (la matematica del frammento GLSL) ──
  function effetto(e, d, i, o) {
    let r, g, b
    if (e === 1) { const j = specchiata[mappaK[i]] * 4; r = d[j]; g = d[j + 1]; b = d[j + 2] }
    else if (e === 2) { const j = mappaP[i] * 4; r = d[j]; g = d[j + 1]; b = d[j + 2] }
    else if (e === 3) {
      // colori sfasati: rosso da destra, blu da sinistra; i bordi si scuriscono
      const q = mappaC[i], qx = q % GW
      const jr = (q - qx + Math.min(GW - 1, qx + 1)) * 4, jb = (q - qx + Math.max(0, qx - 1)) * 4, jg = q * 4
      const k = crtVig[i]
      r = d[jr] * k; g = d[jg + 1] * k; b = d[jb + 2] * k
    } else if (e === 4) {
      // la scala di calore dello shader: blu notte → viola → arancio → giallo
      const l = luma[specchiata[i]]
      let o0, f
      if (l < 0.33) { o0 = 0; f = l / 0.33 } else if (l < 0.66) { o0 = 3; f = (l - 0.33) / 0.33 } else { o0 = 6; f = (l - 0.66) / 0.34 }
      r = (CALORE[o0] + (CALORE[o0 + 3] - CALORE[o0]) * f) * 255
      g = (CALORE[o0 + 1] + (CALORE[o0 + 4] - CALORE[o0 + 1]) * f) * 255
      b = (CALORE[o0 + 2] + (CALORE[o0 + 5] - CALORE[o0 + 2]) * f) * 255
    } else if (e === 5) {
      // Sobel 3 × 3 sulla luminanza
      const s = specchiata[i], x = s % GW, y = (s - x) / GW
      const x0 = x > 0 ? x - 1 : 0, x2 = x < GW - 1 ? x + 1 : x, y0 = (y > 0 ? y - 1 : 0) * GW, y1 = y * GW, y2 = (y < GH - 1 ? y + 1 : y) * GW
      const tl = luma[y0 + x0], tm = luma[y0 + x], tr = luma[y0 + x2], ml = luma[y1 + x0], mr = luma[y1 + x2], bl = luma[y2 + x0], bm = luma[y2 + x], br = luma[y2 + x2]
      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br
      const gy = -tl - 2 * tm - tr + bl + 2 * bm + br
      r = g = b = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 1.6) * 255
    } else { const j = specchiata[i] * 4; r = d[j]; g = d[j + 1]; b = d[j + 2] }
    const v = vig[i]
    o[i * 4] = r * v; o[i * 4 + 1] = g * v; o[i * 4 + 2] = b * v; o[i * 4 + 3] = 255
  }
  function calcola(t, eA, eB, taglio, divisore) {
    scena(t)
    const d = sg.getImageData(0, 0, GW, GH).data
    for (let i = 0, j = 0; i < N; i++, j += 4) luma[i] = (d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114) / 255
    const o = outImg.data
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = y * GW + x
      // la passata dell'effetto nuovo da sinistra; col mouse sopra, a sinistra della riga resta il «prima»
      let e = x < taglio ? eA : eB
      if (divisore >= 0 && x < divisore) e = 0
      effetto(e, d, i, o)
    }
    og.putImageData(outImg, 0, 0)
  }

  // ── misure e strati fissi ──
  let L = null, sotto = null, sopra = null
  function misure(w, h) {
    const bx = Math.max(4, w * 0.03), by = Math.max(4, h * 0.05)
    const ix = bx, iy = by, iw = w - 2 * bx, ih = h - by - Math.max(6, h * 0.065)
    const fs = Math.min(11.5, 104 / Math.max(...m.titolo.split(' ').map((p) => p.length || 1))) * w / 100 * 0.92
    L = { w, h, ix, iy, iw, ih, fs }
    sotto = kit.strato(w, h, m.dpr, (g) => {
      g.fillStyle = '#f2eee3'; g.fillRect(0, 0, w, h)
      g.save()
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = w * 0.03; g.shadowOffsetY = w * 0.012
      g.fillStyle = '#fffdf6'
      const b = Math.max(3, w * 0.014)
      g.fillRect(ix - b, iy - b, iw + 2 * b, ih + b * 2.3)
      g.restore()
      g.fillStyle = '#0b0d0a'; g.fillRect(ix, iy, iw, ih)
    })
    sopra = kit.strato(w, h, m.dpr, (g) => {
      g.save()
      g.beginPath(); g.rect(ix, iy, iw, ih); g.clip()
      // l'ombra del titolo, perché resti leggibile su qualunque effetto
      const r = g.createRadialGradient(ix, iy, 0, ix, iy, w * 0.55)
      r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = r; g.fillRect(ix, iy, iw, ih)
      const f = g.createLinearGradient(0, iy + ih * 0.7, 0, iy + ih)
      f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,.6)')
      g.fillStyle = f; g.fillRect(ix, iy, iw, ih)
      g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = w * 0.035
      g.strokeStyle = '#000'; g.lineWidth = w * 0.04
      g.strokeRect(ix - w * 0.02, iy - w * 0.02, iw + w * 0.04, ih + w * 0.04)
      g.shadowBlur = 0
      const v = g.createLinearGradient(ix, iy, ix + iw * 0.5, iy + ih)
      v.addColorStop(0, 'rgba(255,255,255,.08)'); v.addColorStop(0.4, 'rgba(255,255,255,0)')
      g.fillStyle = v; g.fillRect(ix, iy, iw, ih)
      g.restore()
      const nw = Math.max(26, w * 0.13), nh = nw * 0.3
      kit.nastro(g, ix + nw * 0.12, iy - nh * 0.1, nw, nh, -0.66, 'rgba(234,222,182,.86)')
      kit.nastro(g, ix + iw - nw * 0.12, iy - nh * 0.1, nw, nh, 0.66, 'rgba(234,222,182,.86)')
    })
  }

  function tasti(g, attivo, k) {
    const { w, ix, iy, iw, ih } = L
    const fs = Math.max(6.5, w * 0.018)
    g.font = `400 ${fs}px "Special Elite"`
    const pad = fs * 0.75, gap = fs * 0.45
    const larg = EFFETTI.map((n) => g.measureText(n).width + pad * 2)
    const tot = larg.reduce((a, b) => a + b, 0) + gap * (EFFETTI.length - 1)
    if (tot > iw * 0.92) {
      // troppo stretto: resta solo il tasto acceso
      const n = EFFETTI[attivo], lw = g.measureText(n).width + pad * 2
      tasto(g, n, ix + iw - lw - fs * 0.8, iy + ih - fs * 2.4, lw, fs * 1.7, true, fs)
      return
    }
    let x = ix + Math.min((iw - tot) / 2, L.w * 0.03)
    const y = iy + ih - fs * 2.5
    EFFETTI.forEach((n, i) => {
      tasto(g, n, x, y, larg[i], fs * 1.75, i === attivo, fs, i === attivo ? k : 1)
      x += larg[i] + gap
    })
  }
  function tasto(g, n, x, y, w, h, giu, fs, k = 1) {
    const spinta = giu ? 1 + (1 - ease.out(clamp(k * 3))) : 0
    g.fillStyle = '#161616'
    kit.tondo(g, x, y + 2, w, h, 3); g.fill()
    g.fillStyle = giu ? '#161616' : '#fffdf6'
    kit.tondo(g, x, y + spinta, w, h, 3); g.fill()
    g.strokeStyle = '#161616'; g.lineWidth = 1.2; g.stroke()
    g.fillStyle = giu ? '#fffdf6' : '#161616'
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(n, x + w / 2, y + spinta + h / 2 + fs * 0.06)
  }

  let orologio = 0
  return {
    titolo: false,
    fermo: 5.2,
    ridimensiona(w, h) { misure(w, h) },
    frame(t, dt) {
      const { w, h } = m
      if (!L || L.w !== w || L.h !== h) misure(w, h)
      const g = m.g
      orologio += dt * (1 + 0.8 * m.su)
      const c = kit.fract(orologio / CICLO) * CICLO
      const giro = Math.floor(orologio / CICLO)
      const ei = Math.floor(c / PASSO), l = c - ei * PASSO
      const prima = (ei + EFFETTI.length - 1) % EFFETTI.length
      const passata = ease.inOut(clamp(l / 0.45))
      const taglio = passata < 1 ? Math.round(passata * GW) : GW
      const divisore = m.su > 0.02 ? Math.round(GW * (0.5 + 0.22 * Math.sin(orologio * 1.3)) * m.su) : -1
      calcola(orologio, ei, prima, taglio, divisore)
      // lo scatto: si copia il fotogramma, come la Clipboard API dell'app
      if (c >= SCATTO && fotoFatta !== giro) { fg.drawImage(out, 0, 0); fotoFatta = giro }

      const { ix, iy, iw, ih } = L
      g.drawImage(sotto, 0, 0, w, h)
      g.save()
      g.beginPath(); g.rect(ix, iy, iw, ih); g.clip()
      g.imageSmoothingEnabled = ei !== 2 || taglio < GW
      g.imageSmoothingQuality = 'high'
      g.drawImage(out, ix, iy, iw, ih)
      g.imageSmoothingEnabled = true
      // le righe del crt, al passo dei pixel veri
      if (ei === 3) {
        g.fillStyle = 'rgba(0,0,0,.22)'
        const o = (orologio * 12) % 3
        for (let y = iy + o; y < iy + ih; y += 3) g.fillRect(ix + iw * (1 - Math.min(1, taglio / GW)), y, iw, 1)
      }
      // la passata: una riga di luce che porta l'effetto nuovo
      if (taglio < GW) {
        const x = ix + iw * (taglio / GW)
        const lg = g.createLinearGradient(x - iw * 0.06, 0, x + 2, 0)
        lg.addColorStop(0, 'rgba(204,255,0,0)'); lg.addColorStop(1, 'rgba(204,255,0,.55)')
        g.fillStyle = lg; g.fillRect(x - iw * 0.06, iy, iw * 0.06 + 2, ih)
        g.fillStyle = '#ccff00'; g.fillRect(x - 1, iy, 2, ih)
      }
      // la riga del prima/dopo col mouse sopra
      if (divisore >= 0) {
        const x = ix + iw * (divisore / GW)
        g.fillStyle = `rgba(255,253,246,${0.9 * m.su})`; g.fillRect(x - 1, iy, 2, ih)
        g.beginPath(); g.arc(x, iy + ih * 0.5, Math.max(4, w * 0.014), 0, TAU); g.fill()
        g.fillStyle = '#161616'; g.font = `400 ${Math.max(6, w * 0.015)}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillText('↔', x, iy + ih * 0.5 + 0.5)
      }
      g.drawImage(sopra, 0, 0, w, h)
      g.restore()
      g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip()

      // il titolo con il suo riflesso, come in uno specchio
      g.font = `700 ${L.fs}px "${m.font}"`
      g.textBaseline = 'alphabetic'; g.textAlign = 'left'
      const tx = w * 0.05, ty = w * 0.075 + L.fs * 0.82
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillText(m.titolo, tx + L.fs * 0.04, ty + L.fs * 0.05)
      g.fillStyle = '#ffffff'; g.fillText(m.titolo, tx, ty)
      g.save()
      g.translate(0, ty * 2 + L.fs * 0.06); g.scale(1, -1)
      g.globalAlpha = 0.22
      g.fillText(m.titolo, tx, ty)
      g.restore()
      // lo scatto: il lampo e l'otturatore
      const ds = c - SCATTO
      if (ds >= 0 && ds < 0.6) {
        const chiudi = ds < 0.12 ? ease.inOut(ds / 0.12) : 1 - ease.out(clamp((ds - 0.12) / 0.2))
        g.fillStyle = '#000'
        g.fillRect(ix, iy, iw, ih * 0.5 * chiudi); g.fillRect(ix, iy + ih - ih * 0.5 * chiudi, iw, ih * 0.5 * chiudi)
        const lampo = ds > 0.1 ? Math.max(0, 1 - (ds - 0.1) / 0.45) : 0
        g.fillStyle = `rgba(255,255,255,${lampo * 0.9})`; g.fillRect(ix, iy, iw, ih)
      }
      // i tasti degli effetti, in basso
      tasti(g, ei, l)
      // la spia: «in diretta» col mouse sopra
      if (w >= 260) {
        const f = Math.max(6, w * 0.019)
        g.font = `400 ${f}px "Special Elite"`; g.textAlign = 'right'; g.textBaseline = 'middle'
        const testo = m.su > 0.5 ? 'in diretta' : 'specchio · webgl'
        const tw = g.measureText(testo).width
        const x = ix + iw - f * 0.9, y = iy + f * 1.5
        g.fillStyle = 'rgba(27,27,27,.85)'
        kit.tondo(g, x - tw - f * 2.1, y - f * 0.85, tw + f * 2.7, f * 1.7, 2); g.fill()
        g.fillStyle = 'rgba(233,228,214,.9)'; g.fillText(testo, x, y + f * 0.05)
        g.fillStyle = m.su > 0.5 ? `rgba(255,60,50,${0.6 + 0.4 * Math.sin(orologio * 6)})` : '#ccff00'
        g.beginPath(); g.arc(x - tw - f * 1.1, y, f * 0.32, 0, TAU); g.fill()
      }
      g.restore()

      // la polaroid della foto scattata, attaccata col nastro in basso a destra
      if (fotoFatta === giro && ds >= 0.15) {
        const k = ease.outBack(clamp((ds - 0.15) / 0.7), 1.2)
        const via = smooth(CICLO - 0.75, CICLO - 0.1, c)
        const pw = w * 0.24, ph = pw * 0.98
        const fx = lerp(w * 0.5, w - pw * 0.52, k), fy = lerp(h * 0.45, h - ph * 0.46, k) + via * h * 0.6
        kit.con(g, fx, fy, lerp(0, 0.1, k) + via * 0.3, lerp(1.9, 1, clamp(k)), () => {
          g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-pw / 2 + 3, -ph / 2 + 5, pw, ph)
          g.fillStyle = '#fffdf6'; g.fillRect(-pw / 2, -ph / 2, pw, ph)
          const m2 = pw * 0.07, fw = pw - m2 * 2, fh = fw * 9 / 16
          g.drawImage(foto, -pw / 2 + m2, -ph / 2 + m2, fw, fh)
          if (w >= 260) {
            g.fillStyle = '#d0201c'; g.font = `400 ${pw * 0.075}px "Permanent Marker"`; g.textAlign = 'center'; g.textBaseline = 'middle'
            g.fillText('copiata negli appunti', 0, -ph / 2 + m2 + fh + (ph - fh - m2) / 2)
          }
          kit.nastro(g, 0, -ph / 2, pw * 0.4, pw * 0.11, -0.05)
        })
      }
      kit.granella(g, w, h, 0.045, t)
    },
  }
}
