// miniature/sabbia.js — il terrario di Sabbia (27.11.2026).
// L'automa cellulare vero di games/sabbia/sabbia.js (stessi materiali, stessi colori, stesse regole), su una griglia
// piccola dentro lo schermo nero col bordo di carta e il nastro, come nel banco del laboratorio. Il pennello (l'anello
// verde) versa sabbia sul titolo, alza una duna, riempie una pozza; poi il vulcano, l'olio che prende fuoco, la
// pioggia che spegne tutto, la gomma che apre il fondo e il mondo che si svuota. Ciclo di 18 s.
// Col mouse sopra: si accende la lampada, il tempo corre e compaiono i conti del mondo.

const VUOTO = 0, SABBIA = 1, ACQUA = 2, PIETRA = 3, FUOCO = 4, OLIO = 5, FUMO = 6, TITOLO = 7
const COLORI = { [SABBIA]: [216, 179, 108], [ACQUA]: [63, 127, 191], [PIETRA]: [111, 106, 99], [FUOCO]: [255, 122, 24], [OLIO]: [58, 42, 26], [FUMO]: [138, 138, 138] }
const NOMI = { [SABBIA]: ['sabbia', '#d9b36c'], [ACQUA]: ['acqua', '#3f7fbf'], [PIETRA]: ['pietra', '#6f6a63'], [OLIO]: ['olio', '#3a2a1a'], [FUOCO]: ['fuoco', '#ff7a18'], [VUOTO]: ['gomma', '#f2eee3'] }
const T = 18 // il ciclo
const GW = 96, MURO = 2 // la griglia è larga 96 celle; le pareti di pietra sono di 2 (nell'app 4 su 180)

// il copione del pennello: [tempo, x, y (frazioni della griglia), materiale, versa fino al punto dopo?, raggio, solo il fondo?]
const COPIONE = [
  [0.0, 0.70, 0.46, SABBIA, 0, 2],
  [0.4, 0.07, 0.04, SABBIA, 0, 2],
  [0.5, 0.07, 0.04, SABBIA, 1, 2],
  [2.7, 0.37, 0.04, SABBIA, 0, 2],
  [3.0, 0.64, 0.96, PIETRA, 0, 1],
  [3.1, 0.64, 0.96, PIETRA, 1, 1],
  [3.5, 0.64, 0.88, PIETRA, 0, 1],
  [3.9, 0.82, 0.40, ACQUA, 0, 2],
  [4.0, 0.82, 0.40, ACQUA, 1, 2],
  [5.4, 0.93, 0.40, ACQUA, 0, 2],
  [6.4, 0.50, 0.30, OLIO, 0, 2],
  [7.7, 0.48, 0.30, OLIO, 1, 2],
  [9.3, 0.53, 0.30, OLIO, 0, 2],
  [10.2, 0.80, 0.30, OLIO, 0, 2],
  [13.6, 0.84, 0.26, VUOTO, 0, 4],
  [14.1, 0.04, 0.10, VUOTO, 0, 4],
  [14.2, 0.04, 0.10, VUOTO, 1, 4],
  [14.55, 0.38, 0.12, VUOTO, 1, 4],
  [14.9, 0.04, 0.27, VUOTO, 1, 4],
  [15.2, 0.38, 0.27, VUOTO, 0, 4],
  [15.4, 0.02, 0.92, VUOTO, 0, 4],
  [15.45, 0.02, 0.92, VUOTO, 1, 4],
  [16.5, 0.98, 0.92, VUOTO, 0, 4],
  [16.6, 0.98, 0.98, PIETRA, 0, 2, 1],
  [16.7, 0.98, 0.98, PIETRA, 1, 2, 1],
  [17.6, 0.02, 0.98, PIETRA, 0, 2, 1],
  [18.0, 0.70, 0.46, SABBIA, 0, 2],
]
const VULCANO = [7.0, 10.0], PIOGGIA = [11.0, 14.0]

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, ease, smooth } = kit
  await Promise.all([kit.font(m.font), kit.font('Special Elite'), kit.font('Permanent Marker'), kit.font('Anton')])

  // ── il mondo: griglie di byte come nell'app ──
  let GH = 0, G, VITA, VARIA, img, off, offG, fimg, fuo, fuoG, sfoca, sfocaG, maschera = null
  let R = kit.rng(1), giro = -1, orologio = 0, passiFatti = 0, passoN = 0
  let pioggiaFino = 0, vulcanoFino = 0, conti = { s: 0, a: 0, f: 0 }
  const idx = (x, y) => y * GW + x
  const dentro = (x, y) => x >= 0 && x < GW && y >= 0 && y < GH

  function griglia(gh) {
    GH = gh
    G = new Uint8Array(GW * GH); VITA = new Uint8Array(GW * GH); VARIA = new Int8Array(GW * GH)
    const r = kit.rng(46)
    for (let i = 0; i < VARIA.length; i++) VARIA[i] = Math.floor(r() * 19) - 9
    off = document.createElement('canvas'); off.width = GW; off.height = GH
    offG = off.getContext('2d'); img = offG.createImageData(GW, GH)
    fuo = document.createElement('canvas'); fuo.width = GW; fuo.height = GH
    fuoG = fuo.getContext('2d'); fimg = fuoG.createImageData(GW, GH)
    sfoca = document.createElement('canvas'); sfoca.width = Math.ceil(GW / 4); sfoca.height = Math.ceil(GH / 4)
    sfocaG = sfoca.getContext('2d')
    giro = -1
  }
  function scenario() {
    G.fill(VUOTO); VITA.fill(0)
    for (let x = 0; x < GW; x++) {
      for (let y = GH - 2; y < GH; y++) G[idx(x, y)] = PIETRA
      if (x < MURO || x >= GW - MURO) for (let y = 0; y < GH; y++) G[idx(x, y)] = PIETRA
    }
    if (maschera) for (let i = 0; i < maschera.length; i++) if (maschera[i] && G[i] === VUOTO) G[i] = TITOLO
    pioggiaFino = 0; vulcanoFino = 0; passoN = 0
  }

  // ── le regole, copiate dall'app (Math.random → un generatore col seme: stessa scena a ogni giro) ──
  function scambia(a, b) {
    const t = G[a]; G[a] = G[b]; G[b] = t
    const v = VITA[a]; VITA[a] = VITA[b]; VITA[b] = v
  }
  function sabbia(i, x, y, dir) {
    if (y + 1 < GH) {
      const sotto = idx(x, y + 1)
      if (G[sotto] === VUOTO || G[sotto] === ACQUA || G[sotto] === OLIO) return scambia(i, sotto)
      if (G[sotto] === FUOCO) { G[i] = VUOTO; VITA[i] = 0; G[sotto] = VUOTO; return }
    }
    const dx = dir || (R() < 0.5 ? -1 : 1)
    for (let k = 0, d = dx; k < 2; k++, d = -d) {
      const nx = x + d, ny = y + 1
      if (nx < MURO || nx >= GW - MURO || ny >= GH) continue
      const j = idx(nx, ny)
      if (G[j] === VUOTO || G[j] === ACQUA || G[j] === OLIO) { scambia(i, j); return }
    }
  }
  function acqua(i, x, y, dir) {
    if (y + 1 < GH) {
      const sotto = idx(x, y + 1)
      if (G[sotto] === VUOTO) return scambia(i, sotto)
      if (G[sotto] === FUOCO) { G[sotto] = FUMO; VITA[sotto] = 90 }
      if (G[sotto] === OLIO) return scambia(i, sotto)
    }
    const dx = dir || (R() < 0.5 ? -1 : 1)
    for (let k = 0; k < 3; k++) {
      const d = k === 0 ? dx : k === 1 ? -dx : 0
      const nx = x + d, ny = y + (d ? 1 : 0)
      if (nx < MURO || nx >= GW - MURO || ny >= GH) continue
      const j = idx(nx, ny)
      if (G[j] === VUOTO) { scambia(i, j); return }
      if (G[j] === OLIO && ny === y + 1) { scambia(i, j); return }
    }
    for (let k = 0, d = dx; k < 2; k++, d = -d) {
      const nx = x + d
      if (nx < MURO || nx >= GW - MURO) continue
      const j = idx(nx, y)
      if (G[j] === VUOTO) { scambia(i, j); return }
    }
  }
  function olio(i, x, y, dir) {
    if (y + 1 < GH) {
      const sotto = idx(x, y + 1)
      if (G[sotto] === VUOTO) return scambia(i, sotto)
      if (G[sotto] === ACQUA) return scambia(i, sotto)
    }
    const dx = dir || (R() < 0.5 ? -1 : 1)
    for (let k = 0, d = dx; k < 2; k++, d = -d) {
      const nx = x + d, ny = y + 1
      if (nx < MURO || nx >= GW - MURO || ny >= GH) continue
      const j = idx(nx, ny)
      if (G[j] === VUOTO || G[j] === ACQUA) { scambia(i, j); return }
    }
    for (let k = 0, d = dx; k < 2; k++, d = -d) {
      const nx = x + d
      if (nx < MURO || nx >= GW - MURO) continue
      const j = idx(nx, y)
      if (G[j] === VUOTO) { scambia(i, j); return }
    }
  }
  const VICINI = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  function fuoco(i, x, y, dir) {
    if (VITA[i] > 0) VITA[i]--
    for (const [dx, dy] of VICINI) {
      const nx = x + dx, ny = y + dy
      if (!dentro(nx, ny)) continue
      const j = idx(nx, ny)
      if (G[j] === OLIO && R() < 0.22) { G[j] = FUOCO; VITA[j] = 150 }
      if (G[j] === ACQUA) { G[i] = FUMO; VITA[i] = 70 }
    }
    if (G[i] !== FUOCO) return
    if (VITA[i] === 0) { G[i] = FUMO; VITA[i] = 110; return }
    sali(i, x, y, dir)
  }
  function fumo(i, x, y, dir) {
    if (VITA[i] > 0) VITA[i]--
    if (VITA[i] === 0) { G[i] = VUOTO; return }
    sali(i, x, y, dir)
  }
  function sali(i, x, y, dir) {
    const dx = dir || (R() < 0.5 ? -1 : 1)
    for (let k = 0; k < 5; k++) {
      const ax = k === 0 ? 0 : (k & 1 ? dx : -dx), ay = k < 3 ? -1 : 0
      const nx = x + ax, ny = y + ay
      if (!dentro(nx, ny) || nx < MURO || nx >= GW - MURO) continue
      const j = idx(nx, ny)
      if (G[j] === VUOTO) { scambia(i, j); return }
    }
  }
  function passo() {
    passoN++
    // nell'app la riga 0 non si aggiorna mai (il fuoco lassù resterebbe acceso per sempre): qui sì
    for (let y = 0; y < GH; y++) {
      const verso = R() < 0.5 ? 1 : -1
      for (let k = 0; k < GW; k++) {
        const x = verso > 0 ? k : GW - 1 - k
        if (x < MURO || x >= GW - MURO) continue
        const i = idx(x, y), q = G[i]
        if (q === FUOCO) fuoco(i, x, y, verso)
        else if (q === FUMO) fumo(i, x, y, verso)
      }
    }
    for (let y = GH - 2; y >= 0; y--) {
      const verso = R() < 0.5 ? 1 : -1
      for (let k = 0; k < GW; k++) {
        const x = verso > 0 ? k : GW - 1 - k
        if (x < MURO || x >= GW - MURO) continue
        const i = idx(x, y), q = G[i]
        if (q === SABBIA) sabbia(i, x, y, verso)
        else if (q === ACQUA) acqua(i, x, y, verso)
        else if (q === OLIO) olio(i, x, y, verso)
      }
    }
    // il fondo aperto dalla gomma: quello che arriva all'ultima riga esce dal mondo
    for (let x = MURO; x < GW - MURO; x++) { const i = idx(x, GH - 1); if (G[i] !== PIETRA) { G[i] = VUOTO; VITA[i] = 0 } }
    if (pioggiaFino > 0) {
      pioggiaFino--
      for (let k = 0; k < 3; k++) {
        const x = MURO + 1 + Math.floor(R() * (GW - 2 * MURO - 2))
        // nell'app nasce alla riga 1; qui nella prima cella libera in alto (il fumo lassù non la ferma)
        for (let y = 0; y < 6; y++) if (G[idx(x, y)] === VUOTO) { G[idx(x, y)] = ACQUA; break }
      }
    }
    if (vulcanoFino > 0) {
      vulcanoFino--
      for (let k = 0; k < 2; k++) {
        const x = Math.floor(GW / 2) + Math.floor(R() * 7) - 3
        const i = idx(x, GH - 3)
        if (G[i] === VUOTO) { G[i] = FUOCO; VITA[i] = 170 }
      }
    }
  }

  // ── il pennello: dove sta, cosa versa ──
  function pennello(c) {
    let k = 0
    while (k < COPIONE.length - 2 && COPIONE[k + 1][0] <= c) k++
    const a = COPIONE[k], b = COPIONE[k + 1]
    const f = clamp((c - a[0]) / Math.max(0.001, b[0] - a[0]))
    const e = a[4] ? f : ease.inOut(f) // quando versa va dritto, quando si sposta accelera e frena
    return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e), mat: a[3], versa: !!a[4], r: a[5], fondo: !!a[6] }
  }
  function versa(p) {
    const cx = Math.round(p.x * (GW - 1)), cy = Math.round(p.y * (GH - 1)), r = p.r
    if (p.mat === SABBIA || p.mat === ACQUA || p.mat === OLIO) {
      // come trascinare il pennello piccolo: qualche cella nuova a ogni passo
      const n = 2
      for (let k = 0; k < n; k++) {
        const x = cx + Math.round((R() * 2 - 1) * r), y = cy + Math.round((R() * 2 - 1) * r)
        if (!dentro(x, y) || x < MURO || x >= GW - MURO) continue
        if (G[idx(x, y)] === VUOTO) G[idx(x, y)] = p.mat
      }
      return
    }
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue
      const px = cx + x, py = cy + y
      if (!dentro(px, py) || px < MURO || px >= GW - MURO) continue
      const i = idx(px, py)
      if (G[i] === TITOLO) continue
      if (p.mat === PIETRA) { if (!p.fondo || py >= GH - 2) { G[i] = PIETRA; VITA[i] = 0 } }
      else { G[i] = VUOTO; VITA[i] = 0 }
    }
  }

  // il tempo del mondo: va a passi da 1/60 s come l'app; col mouse sopra corre
  function avanza(dt) {
    const v = 1 + 0.7 * m.su
    orologio += dt * v
    const g = Math.floor(orologio / T)
    if (g !== giro) { giro = g; R = kit.rng(4600 + (g % 3)); scenario(); passiFatti = 0 }
    const c = orologio - g * T
    const voluti = Math.floor(c * 60)
    let n = 0
    while (passiFatti < voluti && n < 6) {
      const cc = passiFatti / 60
      if (cc >= VULCANO[0] && cc < VULCANO[0] + 1 / 60) vulcanoFino = 180
      if (cc >= PIOGGIA[0] && cc < PIOGGIA[0] + 1 / 60) pioggiaFino = 180
      const p = pennello(cc)
      if (p.versa) versa(p)
      passo()
      passiFatti++; n++
    }
    if (passiFatti < voluti) passiFatti = voluti // se resta indietro salta, non insegue
    return c
  }

  function dipingi() {
    const d = img.data, f = fimg.data
    let s = 0, a = 0, fu = 0
    for (let i = 0, p = 0; i < G.length; i++, p += 4) {
      const q = G[i]
      f[p + 3] = 0
      if (q === VUOTO || q === TITOLO) { d[p + 3] = 0; continue }
      let r, gg, b
      if (q === FUOCO) {
        const v = VITA[i] / 170
        if (v > 0.55) { r = 255; gg = 215; b = 70 } else if (v > 0.25) { r = 255; gg = 122; b = 24 } else { r = 150; gg = 40; b = 12 }
        f[p] = r; f[p + 1] = gg; f[p + 2] = b; f[p + 3] = 255
        fu++
      } else if (q === FUMO) {
        const c = 70 + (VITA[i] / 110) * 70
        r = gg = b = c
      } else {
        const base = COLORI[q]
        // la luce dall'alto: la cella in superficie (sopra c'è il vuoto) è più chiara, come la sabbia vera
        const v = VARIA[i] + (i >= GW && (G[i - GW] === VUOTO || G[i - GW] === FUMO) && q !== PIETRA ? 26 : 0)
        r = base[0] + v; gg = base[1] + v; b = base[2] + v
        if (q === SABBIA) s++
        else if (q === ACQUA) a++
      }
      d[p] = r; d[p + 1] = gg; d[p + 2] = b; d[p + 3] = q === FUMO ? 200 : 255
    }
    offG.putImageData(img, 0, 0)
    fuoG.putImageData(fimg, 0, 0)
    sfocaG.clearRect(0, 0, sfoca.width, sfoca.height)
    sfocaG.imageSmoothingEnabled = true
    sfocaG.drawImage(fuo, 0, 0, sfoca.width, sfoca.height)
    conti = { s, a, f: fu }
  }

  // ── misure e strati fissi ──
  let L = null
  function misure(w, h) {
    const bx = Math.max(4, w * 0.03), by = Math.max(4, h * 0.05)
    const ix = bx, iw = w - 2 * bx
    const cs = iw / GW
    const gh = Math.max(20, Math.round((h - by - Math.max(6, h * 0.065)) / cs))
    const ih = gh * cs, iy = by
    const fs = Math.min(11.5, 104 / Math.max(...m.titolo.split(' ').map((p) => p.length || 1))) * w / 100
    L = { w, h, ix, iy, iw, ih, cs, gh, fs, tx: w * 0.05, ty: w * 0.085 }
    if (!G || gh !== GH) griglia(gh)
    // la maschera del titolo: le lettere sono pietra invisibile, la sabbia ci si posa sopra
    const c = document.createElement('canvas'); c.width = GW; c.height = GH
    const x = c.getContext('2d', { willReadFrequently: true })
    x.setTransform(1 / cs, 0, 0, 1 / cs, -ix / cs, -iy / cs)
    x.font = `400 ${L.fs}px "${m.font}"`; x.textBaseline = 'top'; x.fillStyle = '#000'
    x.fillText(m.titolo, L.tx, L.ty)
    x.strokeStyle = "#000"; x.lineWidth = cs * 0.9; x.lineJoin = "round"; x.strokeText(m.titolo, L.tx, L.ty)
    const dati = x.getImageData(0, 0, GW, GH).data
    maschera = new Uint8Array(GW * GH)
    for (let i = 0; i < maschera.length; i++) maschera[i] = dati[i * 4 + 3] > 110 ? 1 : 0
    giro = -1
    sotto = kit.strato(w, h, m.dpr, disegnaSotto)
    sopra = kit.strato(w, h, m.dpr, disegnaSopra)
  }
  let sotto = null, sopra = null
  function disegnaSotto(g, w, h) {
    // il foglio del banco, poi lo schermo nero con un filo di luce in alto
    g.fillStyle = '#f2eee3'; g.fillRect(0, 0, w, h)
    const r = g.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, w * 0.9)
    r.addColorStop(0, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(120,100,60,.18)')
    g.fillStyle = r; g.fillRect(0, 0, w, h)
    const { ix, iy, iw, ih } = L
    g.save()
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = w * 0.03; g.shadowOffsetY = w * 0.012
    g.fillStyle = '#fffdf6'
    const b = Math.max(3, w * 0.014)
    g.fillRect(ix - b, iy - b, iw + 2 * b, ih + b * 2.3)
    g.restore()
    const l = g.createLinearGradient(0, iy, 0, iy + ih)
    l.addColorStop(0, '#15170f'); l.addColorStop(0.6, '#0b0d0a'); l.addColorStop(1, '#070806')
    g.fillStyle = l; g.fillRect(ix, iy, iw, ih)
    // la griglia dei pixel, appena accennata
    g.strokeStyle = 'rgba(204,255,0,.035)'; g.lineWidth = 1
    g.beginPath()
    for (let x = 0; x <= GW; x += 8) { g.moveTo(ix + x * L.cs, iy); g.lineTo(ix + x * L.cs, iy + ih) }
    for (let y = 0; y <= GH; y += 8) { g.moveTo(ix, iy + y * L.cs); g.lineTo(ix + iw, iy + y * L.cs) }
    g.stroke()
  }
  function disegnaSopra(g, w, h) {
    const { ix, iy, iw, ih } = L
    // il vetro: ombra interna e due riflessi
    g.save()
    g.beginPath(); g.rect(ix, iy, iw, ih); g.clip()
    g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = w * 0.04
    g.strokeStyle = '#000'; g.lineWidth = w * 0.04
    g.strokeRect(ix - w * 0.02, iy - w * 0.02, iw + w * 0.04, ih + w * 0.04)
    g.shadowBlur = 0
    const v = g.createLinearGradient(ix, iy, ix + iw * 0.6, iy + ih)
    v.addColorStop(0, 'rgba(255,255,255,.10)'); v.addColorStop(0.35, 'rgba(255,255,255,0)')
    v.addColorStop(0.36, 'rgba(255,255,255,.04)'); v.addColorStop(0.46, 'rgba(255,255,255,0)')
    g.fillStyle = v; g.fillRect(ix, iy, iw, ih)
    g.restore()
    // il nastro sugli angoli in alto, come le foto del muro
    const nw = Math.max(26, w * 0.13), nh = nw * 0.3
    kit.nastro(g, ix + nw * 0.12, iy - nh * 0.1, nw, nh, -0.66, 'rgba(234,222,182,.86)')
    kit.nastro(g, ix + iw - nw * 0.12, iy - nh * 0.1, nw, nh, 0.66, 'rgba(234,222,182,.86)')
  }

  function cursore(g, p, c) {
    const { ix, iy, cs } = L
    const x = ix + p.x * (GW - 1) * cs + cs / 2, y = iy + p.y * (GH - 1) * cs + cs / 2
    const r = Math.max(4, (p.r * 2 + 1) * cs / 2)
    const pulsa = p.versa ? 1 + 0.08 * Math.sin(c * 30) : 1
    g.lineWidth = Math.max(1, L.w * 0.0032)
    g.strokeStyle = 'rgba(0,0,0,.55)'
    g.beginPath(); g.arc(x, y, r * pulsa + 1, 0, kit.TAU); g.stroke()
    g.strokeStyle = 'rgba(204,255,0,.9)'
    g.beginPath(); g.arc(x, y, r * pulsa, 0, kit.TAU); g.stroke()
    if (L.w < 260) return
    // la pastiglia del materiale accanto al pennello
    const [nome, col] = NOMI[p.mat] || NOMI[SABBIA]
    const fs = Math.max(7, L.w * 0.022)
    g.font = `400 ${fs}px "Special Elite"`
    const tw = g.measureText(nome).width
    const px = x + r + fs * 0.5, py = y - r - fs * 0.6
    const bw = tw + fs * 1.9, bh = fs * 1.55
    const qx = Math.min(px, ix + L.iw - bw - 3)
    g.fillStyle = 'rgba(255,253,246,.92)'
    kit.tondo(g, qx, py - bh / 2, bw, bh, 2); g.fill()
    g.fillStyle = col
    g.beginPath(); g.arc(qx + fs * 0.7, py, fs * 0.33, 0, kit.TAU); g.fill()
    g.strokeStyle = 'rgba(22,22,22,.4)'; g.lineWidth = 0.8; g.stroke()
    g.fillStyle = '#161616'; g.textBaseline = 'middle'; g.textAlign = 'left'
    g.fillText(nome, qx + fs * 1.25, py + fs * 0.05)
  }

  // la voce dell'app (il pennarello rosso) su una striscia di carta
  function voce(g, testo, k, x, y, rot) {
    if (k <= 0) return
    const fs = Math.max(7.5, L.w * 0.03)
    kit.con(g, x, y, rot, 0.6 + 0.4 * ease.outBack(clamp(k)), () => {
      g.globalAlpha = clamp(k * 1.5)
      g.font = `400 ${fs}px "Permanent Marker"`
      const tw = g.measureText(testo).width
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-tw / 2 - fs * 0.5 + 2, -fs * 0.8 + 3, tw + fs, fs * 1.6)
      g.fillStyle = '#fffdf6'; g.fillRect(-tw / 2 - fs * 0.5, -fs * 0.8, tw + fs, fs * 1.6)
      g.fillStyle = '#d0201c'; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(testo, 0, fs * 0.05)
      kit.nastro(g, -tw / 2 - fs * 0.3, -fs * 0.7, fs * 1.6, fs * 0.55, -0.5)
    })
  }
  function targhetta(g, testo, x, y, fs, destra) {
    g.font = `400 ${fs}px "Special Elite"`
    if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.12}px`
    const tw = g.measureText(testo).width
    const bx = destra ? x - tw - fs * 1.2 : x
    g.fillStyle = 'rgba(27,27,27,.88)'
    kit.tondo(g, bx, y - fs * 0.85, tw + fs * 1.2, fs * 1.7, 2); g.fill()
    g.fillStyle = 'rgba(233,228,214,.85)'; g.textAlign = 'left'; g.textBaseline = 'middle'
    g.fillText(testo, bx + fs * 0.6, y + fs * 0.05)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
  }
  const it = (n) => n.toLocaleString('it-IT')

  return {
    titolo: false,
    fermo: 9.2,
    ridimensiona(w, h) { misure(w, h) },
    frame(t, dt) {
      const { w, h } = m
      if (!L || L.w !== w || L.h !== h) misure(w, h)
      const g = m.g
      const c = avanza(dt)
      dipingi()
      const { ix, iy, iw, ih } = L
      const vk = smooth(VULCANO[0], VULCANO[0] + 0.4, c) * (1 - smooth(VULCANO[1] - 0.4, VULCANO[1] + 1.4, c))
      const pk = smooth(PIOGGIA[0], PIOGGIA[0] + 0.3, c) * (1 - smooth(PIOGGIA[1] - 0.3, PIOGGIA[1] + 0.6, c))
      // il colpo del vulcano: lo schermo trema un attimo
      const colpo = Math.max(0, 1 - Math.abs(c - VULCANO[0] - 0.15) * 3)
      const sx = colpo * Math.sin(t * 90) * w * 0.004, sy = colpo * Math.cos(t * 77) * w * 0.003

      g.drawImage(sotto, 0, 0, w, h)
      g.save()
      g.translate(sx, sy)
      g.beginPath(); g.rect(ix, iy, iw, ih); g.clip()
      // la lampada dall'alto (col mouse sopra si accende)
      const lamp = 0.12 + 0.3 * m.su
      const lg = g.createRadialGradient(ix + iw * 0.55, iy - ih * 0.2, 0, ix + iw * 0.55, iy - ih * 0.2, ih * 1.3)
      lg.addColorStop(0, `rgba(255,236,190,${lamp})`); lg.addColorStop(1, 'rgba(255,236,190,0)')
      g.fillStyle = lg; g.fillRect(ix, iy, iw, ih)
      g.imageSmoothingEnabled = false
      g.drawImage(off, ix, iy, iw, ih)
      // il bagliore del fuoco: la griglia del fuoco rimpicciolita e riallargata, sommata alla luce
      g.imageSmoothingEnabled = true
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 0.85
      g.drawImage(sfoca, ix - iw * 0.02, iy - ih * 0.02, iw * 1.04, ih * 1.04)
      g.globalAlpha = 0.35 * vk
      g.drawImage(sfoca, ix - iw * 0.15, iy - ih * 0.2, iw * 1.3, ih * 1.4)
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'
      // la pioggia: righe sottili che scendono davanti al vetro
      if (pk > 0.01) {
        g.strokeStyle = `rgba(150,190,235,${0.28 * pk})`; g.lineWidth = 1
        g.beginPath()
        for (let k = 0; k < 26; k++) {
          const x = ix + kit.fract(k * 0.618 + 0.13) * iw
          const y = iy + kit.fract(t * (1.3 + (k % 5) * 0.17) + k * 0.37) * (ih + 30) - 15
          g.moveTo(x, y); g.lineTo(x - 2, y + h * 0.05)
        }
        g.stroke()
      }
      // il titolo: le lettere sono pietra nel mondo, qui si vede la loro faccia
      g.font = `400 ${L.fs}px "${m.font}"`
      g.textBaseline = 'top'; g.textAlign = 'left'
      g.fillStyle = '#5c4218'
      g.fillText(m.titolo, L.tx + L.fs * 0.03, L.ty + L.fs * 0.06)
      const tg = g.createLinearGradient(0, L.ty, 0, L.ty + L.fs)
      tg.addColorStop(0, '#fff6dc'); tg.addColorStop(1, '#e8c98a')
      g.fillStyle = tg
      g.fillText(m.titolo, L.tx, L.ty)
      if (vk > 0) { g.globalAlpha = vk * 0.5; g.fillStyle = '#ff9a3c'; g.globalCompositeOperation = 'source-atop'; g.fillText(m.titolo, L.tx, L.ty); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 }
      // il pennello, sopra a tutto il mondo
      cursore(g, pennello(c), c)
      g.restore()
      g.drawImage(sopra, 0, 0, w, h)

      // i cartellini: la targhetta della griglia sempre, i conti col mouse sopra
      const fs = Math.max(6, w * 0.019)
      targhetta(g, `automa cellulare · ${GW} × ${GH}`, ix + iw - fs * 0.8, iy + ih - fs * 1.4, fs, true)
      if (m.su > 0.02 && w >= 260) {
        g.globalAlpha = m.su
        targhetta(g, `sabbia ${it(conti.s)} · acqua ${it(conti.a)} · fuoco ${it(conti.f)} · passi ${it(passoN)}`, ix + fs * 0.8, iy + ih - fs * 1.4 + (1 - m.su) * fs * 2, fs, false)
        g.globalAlpha = 1
      }
      // la voce dei due momenti scenografici
      const v1 = smooth(VULCANO[0], VULCANO[0] + 0.25, c) * (1 - smooth(VULCANO[0] + 2.2, VULCANO[0] + 2.6, c))
      const v2 = smooth(PIOGGIA[0], PIOGGIA[0] + 0.25, c) * (1 - smooth(PIOGGIA[0] + 2, PIOGGIA[0] + 2.4, c))
      voce(g, 'il vulcano si è svegliato', v1, w * 0.7, h * 0.14, 0.04)
      voce(g, 'piove', v2, w * 0.8, h * 0.16, -0.06)
      kit.granella(g, w, h, 0.05, t)
    },
  }
}
