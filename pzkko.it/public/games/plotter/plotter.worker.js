// PLOTTER, il motore (26.11): gira in un Web Worker, così il disegno non blocca il foglio. Riceve algoritmo, seme,
// densità e misura; restituisce i tracciati per l'SVG e i segmenti per l'animazione. Nessuna libreria, nessun caso:
// lo stesso seme dà sempre lo stesso disegno.
//
//   { algo: 'flusso' | 'armoniche' | 'truchet' | 'rose', seme, densita, larg, alt } → { paths, segmenti, punti }

const TAU = Math.PI * 2

function rng(seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hash2(x, y, seme) {
  let h = (seme ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function noise(x, y, seme) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, seme), b = hash2(xi + 1, yi, seme)
  const c = hash2(xi, yi + 1, seme), d = hash2(xi + 1, yi + 1, seme)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const num = (n) => Math.round(n * 10) / 10
const M = (x, y) => `M${num(x)} ${num(y)}`
const L = (x, y) => `L${num(x)} ${num(y)}`

function flusso(rand, densita, W, H, seme) {
  const n = Math.round(260 + densita * 740)
  const passi = Math.round(90 + densita * 150)
  const margine = 26
  const paths = [], segmenti = []
  for (let i = 0; i < n; i++) {
    let x = margine + rand() * (W - 2 * margine)
    let y = margine + rand() * (H - 2 * margine)
    let d = M(x, y)
    const colore = i % 4
    for (let s = 0; s < passi; s++) {
      const a = noise(x * 0.004, y * 0.004, seme) * TAU * 2 + noise(x * 0.0009, y * 0.0009, seme + 7) * 1.5
      const nx = x + Math.cos(a) * 2.6, ny = y + Math.sin(a) * 2.6
      if (nx < margine || nx > W - margine || ny < margine || ny > H - margine) break
      d += L(nx, ny)
      segmenti.push([x, y, nx, ny, colore, 0.75])
      x = nx; y = ny
    }
    if (d.length > 12) paths.push({ d, colore, spessore: 0.8 })
  }
  return { paths, segmenti }
}

function armoniche(rand, densita, W, H) {
  const curve = Math.round(3 + densita * 4)
  const paths = [], segmenti = []
  const cx = W / 2, cy = H / 2
  for (let c = 0; c < curve; c++) {
    const f1 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const f2 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const f3 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const f4 = 1 + Math.floor(rand() * 5) + rand() * 0.02
    const p1 = rand() * TAU, p2 = rand() * TAU, p3 = rand() * TAU, p4 = rand() * TAU
    const d1 = 0.004 + rand() * 0.012, d2 = 0.004 + rand() * 0.012
    const A = W * (0.16 + rand() * 0.1), B = H * (0.18 + rand() * 0.12)
    const colore = c % 4
    const passi = 2400
    let d = ''
    let px = 0, py = 0
    for (let i = 0; i < passi; i++) {
      const t = (i / passi) * 160
      const e1 = Math.exp(-d1 * t), e2 = Math.exp(-d2 * t)
      const x = cx + (Math.sin(f1 * t + p1) * 0.6 + Math.sin(f2 * t + p2) * 0.4) * A * e1
      const y = cy + (Math.sin(f3 * t + p3) * 0.6 + Math.sin(f4 * t + p4) * 0.4) * B * e2
      if (!i) { d = M(x, y); px = x; py = y }
      else { d += L(x, y); segmenti.push([px, py, x, y, colore, 1]); px = x; py = y }
    }
    paths.push({ d, colore, spessore: 1.05 })
  }
  return { paths, segmenti }
}

function truchet(rand, densita, W, H) {
  const cols = Math.round(9 + densita * 7)
  const righe = Math.max(5, Math.round(cols * H / W))
  const cw = W / cols, ch = H / righe
  const s = Math.min(cw, ch) * 0.94
  const paths = [], segmenti = []
  for (let r = 0; r < righe; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + (cw - s) / 2
      const y = r * ch + (ch - s) / 2
      const giro = rand() < 0.5
      const colore = (r + c) % 4
      const T = [x + s / 2, y], R = [x + s, y + s / 2], B = [x + s / 2, y + s], L = [x, y + s / 2]
      const archi = giro ? [[T, R], [L, B]] : [[L, T], [B, R]]
      const chiave = (p) => (p[0] === x ? 'L' : p[0] === x + s ? 'R' : (p[1] === y ? 'T' : 'B'))
      const centri = { LT: [x, y], TR: [x + s, y], RB: [x + s, y + s], BL: [x, y + s], TL: [x, y], RT: [x + s, y], BR: [x + s, y + s], LB: [x, y + s] }
      let d = ''
      for (const [p0, p1] of archi) {
        const centro = centri[chiave(p0) + chiave(p1)]
        const raggio = s / 2
        const a0 = Math.atan2(p0[1] - centro[1], p0[0] - centro[0])
        let a1 = Math.atan2(p1[1] - centro[1], p1[0] - centro[0])
        let delta = (a1 - a0) % TAU
        if (delta < 0) delta += TAU
        const verso = Math.abs(delta - Math.PI / 2) < 0.01 ? 1 : 0
        d += `${M(p0[0], p0[1])}A${num(raggio)} ${num(raggio)} 0 0 ${verso} ${num(p1[0])} ${num(p1[1])}`
        const a2 = a0 + (verso ? Math.PI / 2 : -Math.PI / 2)
        let px = p0[0], py = p0[1]
        const passi = 18
        for (let k = 1; k <= passi; k++) {
          const aa = a0 + (a2 - a0) * (k / passi)
          const px2 = centro[0] + Math.cos(aa) * raggio, py2 = centro[1] + Math.sin(aa) * raggio
          segmenti.push([px, py, px2, py2, colore, 1.1])
          px = px2; py = py2
        }
      }
      paths.push({ d, colore, spessore: 1.25 })
    }
  }
  return { paths, segmenti }
}

function rose(rand, densita, W, H) {
  const curve = Math.round(10 + densita * 18)
  const paths = [], segmenti = []
  const cx = W / 2, cy = H / 2
  const scala = Math.min(W, H) * 0.42
  for (let c = 0; c < curve; c++) {
    const k = 2 + Math.floor(rand() * 7)
    const fase = rand() * TAU
    const colore = c % 4
    const passi = 480
    let d = '', px = 0, py = 0
    for (let i = 0; i <= passi; i++) {
      const t = (i / passi) * TAU
      const r = scala * Math.cos(k * t + fase) * (0.72 + 0.28 * Math.sin(t * 3 + c))
      const x = cx + Math.cos(t) * r
      const y = cy + Math.sin(t) * r
      if (!i) { d = M(x, y); px = x; py = y }
      else { d += L(x, y); segmenti.push([px, py, x, y, colore, 1]); px = x; py = y }
    }
    paths.push({ d, colore, spessore: 1.1 })
  }
  return { paths, segmenti }
}

self.onmessage = (e) => {
  const { algo = 'flusso', seme = 1, densita = 0.5, larg = 1000, alt = 700 } = e.data || {}
  const rand = rng(seme)
  let out
  try {
    if (algo === 'armoniche') out = armoniche(rand, densita, larg, alt)
    else if (algo === 'truchet') out = truchet(rand, densita, larg, alt)
    else if (algo === 'rose') out = rose(rand, densita, larg, alt)
    else out = flusso(rand, densita, larg, alt, seme)
  } catch (err) {
    self.postMessage({ errore: String(err?.message || err) })
    return
  }
  self.postMessage({ algo, seme, ...out, punti: out.segmenti.length })
}
