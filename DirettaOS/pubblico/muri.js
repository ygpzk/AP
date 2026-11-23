// Diretta OS: i muri. Una parete della stanza si segna con quattro punti sulla foto della webcam: gli angoli di un
// rettangolo vero sul muro (gli spigoli, la riga del soffitto, il battiscopa, il bordo di un quadro). Da lì si sa com'è
// girata rispetto al telefono e quanto è lontana, e i pezzi ci si appoggiano sopra in prospettiva: più piccoli dove il
// muro scappa via, più grandi dove è vicino. Un pezzo sul muro ha una grandezza vera (millimetri di muro per pixel):
// spostato su un muro più vicino diventa più grande, su uno più lontano più piccolo, come una cosa vera.
// Le stesse funzioni le usano i pezzi (pezzi.js), la pagina dei muri (muri.html) e il server (per controllare i dati).

export const C = [960, 540] // il centro dell'immagine 1920 × 1080: lì guarda il telefono
// La lunghezza focale in pixel della tela: la 0,5× è un 13 mm equivalente (campo visivo orizzontale ~106°), la 1,0× un
// 26 mm (~67°). Si corregge dalla pagina dei muri (a mano o «stima dai muri»).
export const F_LENTE = { '05': 720, '10': 1440 }
export const fDi = (M, L) => M?.f || F_LENTE[L] || 1440
export const gradi = (f) => 2 * Math.atan(960 / f) * 180 / Math.PI // campo visivo orizzontale
export const daGradi = (g) => 960 / Math.tan(g * Math.PI / 360)
export const COLORI = ['#ccff00', '#c77dff', '#05d9e8', '#ff73fa', '#f0b232', '#2dff7a', '#ff8a1a', '#8ea1ff']
// i pezzi che non vanno sui muri: la cornice è il bordo dello schermo, la puff segue la puff, la zona cavi è un ritocco
// 2D dell'inquadratura (sfoca quello che ha sotto, non è una cosa appesa alla parete)
export const MAI_SUL_MURO = ['cornice', 'puff', 'cavi']

// ── vettori ──
const piu = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const meno = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const per = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const pd = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const lungo = (a) => Math.hypot(a[0], a[1], a[2])
const uno = (a) => per(a, 1 / (lungo(a) || 1))

// ── la prospettiva del piano: H porta il quadrato (u, v) ∈ 0…1 sui quattro punti, in quest'ordine: alto-sinistra,
// alto-destra, basso-destra, basso-sinistra (Heckbert). H è una riga dopo l'altra, 9 numeri ──
export function omografia(p) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3
  let g = 0, h = 0
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1
    g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den
  }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1]
}
// dove va il punto (u, v); il terzo numero è w (positivo: davanti al telefono)
export const porta = (H, u, v) => { const w = H[6] * u + H[7] * v + H[8]; return [(H[0] * u + H[1] * v + H[2]) / w, (H[3] * u + H[4] * v + H[5]) / w, w] }
export function inversa(H) {
  const [a, b, c, d, e, f, g, h, i] = H
  const A = e * i - f * h, B = f * g - d * i, Cc = d * h - e * g, det = a * A + b * B + c * Cc
  if (!det) return null
  return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, Cc, b * g - a * h, a * e - b * d].map((x) => x / det)
}

// quattro punti cliccati in un ordine qualsiasi → alto-sinistra, alto-destra, basso-destra, basso-sinistra
export function ordina(pp) {
  const cx = pp.reduce((s, p) => s + p[0], 0) / pp.length, cy = pp.reduce((s, p) => s + p[1], 0) / pp.length
  const s = pp.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)) // in senso orario sullo schermo
  let k = 0, su = Infinity
  for (let i = 0; i < 4; i++) { const y = (s[i][1] + s[(i + 1) % 4][1]) / 2; if (y < su) { su = y; k = i } } // il lato in alto
  return [0, 1, 2, 3].map((i) => s[(k + i) % 4])
}
// i quattro punti fanno un quadrilatero convesso, girato come si deve (in senso orario sullo schermo)
export function convesso(p) {
  if (!p || p.length !== 4) return false
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4]
    if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) <= 1e-6) return false
  }
  return true
}
// il punto sta dentro un quadrilatero convesso (in qualunque verso sia girato)
export function dentro(p, x, y) {
  let segno = 0
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], z = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])
    if (Math.abs(z) < 1e-9) continue
    if (segno && Math.sign(z) !== segno) return false
    segno = Math.sign(z)
  }
  return true
}

// ── il muro nello spazio, in metri, col telefono nell'origine (x a destra, y giù, z avanti) ──
// K⁻¹·H = [m1 m2 m3]: il punto (u, v) del muro è X = (m3 + u·m1 + v·m2) / λ, e λ viene dalla distanza «d» (in metri,
// dal telefono al centro dei quattro punti). Con la focale giusta e un rettangolo vero, m1 e m2 sono ad angolo retto.
export function piano(muro, f) {
  if (!muro || !convesso(muro.punti) || !(f > 0)) return null
  let H = omografia(muro.punti)
  if (porta(H, 0.5, 0.5)[2] < 0) H = H.map((x) => -x)
  for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) if (porta(H, u, v)[2] <= 0) return null // (un angolo dietro il telefono)
  const Ki = (x, y, w) => [(x - C[0] * w) / f, (y - C[1] * w) / f, w]
  const m1 = Ki(H[0], H[3], H[6]), m2 = Ki(H[1], H[4], H[7]), m3 = Ki(H[2], H[5], H[8])
  const lam = lungo(piu(m3, per(piu(m1, m2), 0.5))) / (muro.d || 3)
  const X = (u, v) => per(piu(m3, piu(per(m1, u), per(m2, v))), 1 / lam)
  // Il «su» dei pezzi: dei due lati del muro, quello che nell'immagine è più in piedi (gli spigoli della stanza), anche
  // col telefono storto e in qualunque ordine siano stati messi gli angoli. b scende lungo quel lato, a va lungo l'altro.
  // Tutti e due seguono proprio le righe della griglia, come il punto di fuga di Photoshop: quattro angoli messi a mano
  // non fanno mai un rettangolo perfetto, e un pezzo raddrizzato ad angolo retto usciva di qualche grado dalle righe del
  // muro. a va dalla parte che non mette il pezzo allo specchio (a destra di b come x e y sullo schermo).
  const X0 = X(0.5, 0.5), s0 = [f * X0[0] / X0[2], f * X0[1] / X0[2]]
  const verso = (d) => { const P = piu(X0, per(d, 0.01)); return [f * P[0] / P[2] - s0[0], f * P[1] / P[2] - s0[1]] }
  const e1 = uno(m1), e2 = uno(m2), V1 = verso(e1), V2 = verso(e2)
  const ritto = Math.abs(V1[1]) / Math.hypot(...V1) > Math.abs(V2[1]) / Math.hypot(...V2) // (il lato u è quello in piedi)
  let b = ritto ? e1 : e2, a = ritto ? e2 : e1
  if ((ritto ? V1 : V2)[1] < 0) b = per(b, -1)
  const A = verso(a), B = verso(b)
  if (A[0] * B[1] - A[1] * B[0] < 0) a = per(a, -1)
  const lu = lungo(m1) / lam, lv = lungo(m2) / lam
  return { H, Hi: inversa(H), f, X, a, b, largo: ritto ? lv : lu, alto: ritto ? lu : lv }
}
// da un punto dell'immagine al suo (u, v) sul muro
export const sulPiano = (pi, x, y) => { const [u, v] = porta(pi.Hi, x, y); return [u, v] }

// ── un pezzo sul muro: il centro in (u, v), «s» millimetri di muro per pixel del pezzo, girato di «r» gradi sul muro.
// G porta il pixel (x, y) del pezzo (w × h) nell'immagine; css3d la scrive per il transform ──
export function matrice(pi, q, w, h) {
  const k = (q.s || 1) / 1000, t = (q.r || 0) * Math.PI / 180, co = Math.cos(t) * k, si = Math.sin(t) * k
  const ex = piu(per(pi.a, co), per(pi.b, si)), ey = piu(per(pi.a, -si), per(pi.b, co))
  const o = meno(pi.X(q.u, q.v), piu(per(ex, w / 2), per(ey, h / 2)))
  const K = (v) => [pi.f * v[0] + C[0] * v[2], pi.f * v[1] + C[1] * v[2], v[2]]
  const c1 = K(ex), c2 = K(ey), c3 = K(o)
  const G = [c1[0], c2[0], c3[0], c1[1], c2[1], c3[1], c1[2], c2[2], c3[2]]
  const wc = G[6] * w / 2 + G[7] * h / 2 + G[8]
  return G.map((x) => x / wc)
}
export const css3d = (G) => `matrix3d(${[G[0], G[3], 0, G[6], G[1], G[4], 0, G[7], 0, 0, 1, 0, G[2], G[5], 0, G[8]].map((n) => +n.toPrecision(10)).join(',')})`
export const proietta = (G, x, y) => porta(G, x, y)
// quanto è ingrandito il pezzo in quel punto (1 = un pixel del pezzo è un pixel dell'immagine)
export function scalaIn(G, x, y) {
  const [X, Y, w] = porta(G, x, y)
  const a = (G[0] - X * G[6]) / w, b = (G[1] - X * G[7]) / w, c = (G[3] - Y * G[6]) / w, d = (G[4] - Y * G[7]) / w
  return Math.sqrt(Math.abs(a * d - b * c))
}
// i quattro angoli del pezzo nell'immagine
export const angoli = (G, w, h) => [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => proietta(G, x, y))
// la distanza dal telefono (metri) del centro del pezzo
export const distanza = (pi, q) => lungo(pi.X(q.u, q.v))

// ── la focale dai muri: se i quattro punti sono un rettangolo vero, i due punti di fuga (dei lati orizzontali e di
// quelli verticali) stanno ad angolo retto visti dal telefono: (v1 − c)·(v2 − c) = −f². Serve che le righe convergano
// in tutte e due le direzioni (un muro visto di sbieco, col telefono un po' in giù); la mediana dei muri buoni ──
export function stimaF(pareti) {
  const st = []
  for (const m of pareti) {
    if (!convesso(m.punti)) continue
    const H = omografia(m.punti), h1 = [H[0], H[3], H[6]], h2 = [H[1], H[4], H[7]]
    const fuga = (h) => Math.abs(h[2]) > 1e-12 && Math.hypot(h[0] / h[2] - C[0], h[1] / h[2] - C[1]) < 20000
    if (!fuga(h1) || !fuga(h2)) continue
    const f2 = -((h1[0] - C[0] * h1[2]) * (h2[0] - C[0] * h2[2]) + (h1[1] - C[1] * h1[2]) * (h2[1] - C[1] * h2[2])) / (h1[2] * h2[2])
    if (f2 > 250 ** 2 && f2 < 6000 ** 2) st.push(Math.sqrt(f2))
  }
  st.sort((a, b) => a - b)
  return st.length ? { f: st[st.length >> 1], n: st.length } : null
}

// ── le distanze dei muri attaccati: due muri che hanno un angolo in comune (lo stesso punto dell'immagine) si toccano
// lì, quindi quel punto è alla stessa distanza per tutti e due. Si parte dal muro «ancora» (quello di cui hai scritto
// la distanza) e si passa ai vicini; i gruppi staccati partono dal loro primo muro ──
const stesso = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 2
export function propaga(pareti, f, ancora) {
  const fatti = new Set(), ordine = [...pareti].sort((a, b) => (b.id === ancora) - (a.id === ancora))
  for (const radice of ordine) {
    if (fatti.has(radice.id)) continue
    fatti.add(radice.id)
    const coda = [radice]
    while (coda.length) {
      const A = coda.shift(), pA = piano(A, f)
      if (!pA) continue
      for (const B of pareti) {
        if (fatti.has(B.id)) continue
        const pB = piano({ ...B, d: 1 }, f)
        if (!pB) continue
        const r = []
        A.punti.forEach((pa, i) => B.punti.forEach((pb, j) => {
          if (!stesso(pa, pb)) return
          const ua = [[0, 0], [1, 0], [1, 1], [0, 1]][i], ub = [[0, 0], [1, 0], [1, 1], [0, 1]][j]
          r.push(Math.log(lungo(pA.X(...ua)) / lungo(pB.X(...ub))))
        }))
        if (!r.length) continue
        B.d = +Math.min(100, Math.max(0.1, Math.exp(r.reduce((s, x) => s + x, 0) / r.length))).toFixed(3)
        fatti.add(B.id); coda.push(B)
      }
    }
  }
  return pareti
}

// ── la luce della stanza: quanto è chiaro il muro sotto al pezzo rispetto al muro illuminato (nella foto della stanza
// di quella lente, che si rifà ogni mezz'ora). Un pezzo nell'angolo in ombra viene più scuro ──
export function luminosita(img, w = 192, h = 108) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, w, h)
  const d = g.getImageData(0, 0, w, h).data, l = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) l[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255
  const at = (x, y) => l[Math.min(h - 1, Math.max(0, Math.floor(y / 1080 * h))) * w + Math.min(w - 1, Math.max(0, Math.floor(x / 1920 * w)))]
  return { at }
}
export function luceSul(lum, pi, G, w, h) {
  const qui = [], muro = []
  for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) { const [x, y] = proietta(G, (i + 0.5) / 7 * w, (j + 0.5) / 5 * h); qui.push(lum.at(x, y)) }
  for (let j = 0; j < 9; j++) for (let i = 0; i < 14; i++) {
    const [x, y] = porta(pi.H, (i + 0.5) / 14, (j + 0.5) / 9)
    if (x >= 0 && x < 1920 && y >= 0 && y < 1080) muro.push(lum.at(x, y))
  }
  if (!muro.length) return 1
  qui.sort((a, b) => a - b); muro.sort((a, b) => a - b)
  const rif = muro[Math.floor(muro.length * 0.85)]
  return rif > 0.03 ? qui[qui.length >> 1] / rif : 1
}
// il filtro del pezzo: più scuro dove il muro è in ombra («luce», 0…1), un filo sfocato quando è lontano («sfoca», 0…1)
export function filtro(M, pi, q, G, w, h, lum) {
  const parti = []
  if (lum && M.luce > 0) {
    const k = Math.min(1.1, Math.max(0.4, luceSul(lum, pi, G, w, h)))
    const b = 1 - M.luce * (1 - k)
    if (Math.abs(b - 1) > 0.01) parti.push(`brightness(${b.toFixed(3)})`)
  }
  if (M.sfoca > 0) {
    const px = M.sfoca * 2.2 * Math.min(1, Math.max(0, (distanza(pi, q) - 1.2) / 3)) / (scalaIn(G, w / 2, h / 2) || 1)
    if (px > 0.12) parti.push(`blur(${px.toFixed(2)}px)`)
  }
  return parti.join(' ')
}

// ── i dati di una lente, puliti (li usa il server su quello che arriva dalla pagina dei muri) ──
// { f, luce, sfoca, ancora, foto, pareti: [{ id, nome, punti: [[x, y] ×4], d, corpo }], pezzi: { pezzo: { muro, u, v, s, r, corpo } } }
// `corpo` sul muro è il master «dietro di me»; `corpo` sul pezzo è la sua casella: se è false quel pezzo non si nasconde
// nemmeno quando qualcosa gli passa davanti (vedi occhio.mjs / copertura).
export function pulisci(d) {
  if (!d || typeof d !== 'object') d = {}
  const num = (x, a, b) => Number.isFinite(x) && x >= a && x <= b
  const out = {
    f: num(d.f, 200, 8000) ? Math.round(d.f) : null,
    luce: num(d.luce, 0, 1) ? +d.luce.toFixed(2) : 0.6,
    sfoca: num(d.sfoca, 0, 1) ? +d.sfoca.toFixed(2) : 0.25,
    ancora: typeof d.ancora === 'string' && /^[a-z0-9]{1,12}$/.test(d.ancora) ? d.ancora : null,
    foto: Number.isFinite(d.foto) && d.foto > 0 ? Math.round(d.foto) : 0, // l'ora della foto della stanza su cui li hai sistemati
    pareti: [], pezzi: {},
  }
  for (const m of Array.isArray(d.pareti) ? d.pareti.slice(0, 16) : []) {
    if (!m || typeof m.id !== 'string' || !/^[a-z0-9]{1,12}$/.test(m.id) || out.pareti.some((x) => x.id === m.id)) continue
    if (!Array.isArray(m.punti) || m.punti.length !== 4 || !m.punti.every((p) => Array.isArray(p) && p.length === 2 && num(p[0], -6000, 8000) && num(p[1], -6000, 8000))) continue
    out.pareti.push({ id: m.id, nome: String(m.nome ?? '').slice(0, 30), punti: m.punti.map((p) => p.map((v) => Math.round(v * 10) / 10)), d: num(m.d, 0.1, 100) ? +m.d.toFixed(3) : 3, corpo: m.corpo !== false })
  }
  for (const [p, q] of Object.entries(d.pezzi && typeof d.pezzi === 'object' ? d.pezzi : {})) {
    if (!/^[a-z]{1,16}$/.test(p) || MAI_SUL_MURO.includes(p) || !q || !out.pareti.some((m) => m.id === q.muro)) continue
    if (!num(q.u, -3, 4) || !num(q.v, -3, 4) || !Number.isFinite(q.s)) continue
    out.pezzi[p] = { muro: q.muro, u: +q.u.toFixed(4), v: +q.v.toFixed(4), s: +Math.min(50, Math.max(0.05, q.s)).toFixed(3), r: +Math.min(180, Math.max(-180, Number.isFinite(q.r) ? q.r : 0)).toFixed(1), corpo: q.corpo !== false }
  }
  return out
}
