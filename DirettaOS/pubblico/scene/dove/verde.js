// «Dove vivo» · il verde: platani del viale, gelsi capitozzati sul prato, pioppi cipressini lungo i campi, alberelli
// a filari nel bosco nuovo, siepi lungo le reti. Rami veri (tubi) e foglie a ciuffi (carte con la trasparenza),
// con la stagione vera: quante foglie restano e di che colore (a fine novembre i platani sono mezzi gialli e spogli).
// Ogni tipo ha qualche modello; gli alberi uguali sono copie leggere (thin instances) dello stesso modello.
import { Mesh, VertexData, Matrix, Quaternion, Vector3 } from '../lib/babylon/babylon.js'
import { Pezzi, norm } from './geo.js'
import { rng } from './tele.js'

const lin = (h) => { const c = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]; return c.map((v) => Math.pow(v, 2.2)) }
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

// i colori di ogni tipo (estate, autunno chiaro, autunno scuro) e quanto perde le foglie
export const TIPI = {
  platano: { estate: 0x58773a, giallo: 0xc39a40, bruno: 0x8a6538, caduco: true, carta: 2.0, ciuffi: 72, perCiuffo: 5, corteccia: 'platano' },
  gelso: { estate: 0x5f8b37, giallo: 0xd7bb42, bruno: 0xb59a3c, caduco: true, carta: 1.05, ciuffi: 48, perCiuffo: 3, corteccia: 'scura' },
  pioppo: { estate: 0x6b8d3f, giallo: 0xd3b03b, bruno: 0xa98a3a, caduco: true, carta: 1.0, ciuffi: 70, perCiuffo: 3, corteccia: 'scura' },
  tondo: { estate: 0x4c7232, giallo: 0xc99a3c, bruno: 0x9a6236, caduco: true, carta: 1.35, ciuffi: 50, perCiuffo: 4, corteccia: 'scura' },
  siepe: { estate: 0x34552a, giallo: 0x4a6a2e, bruno: 0x3c5a28, caduco: false, carta: 0.9 },
  vite: { estate: 0x6a8b36, giallo: 0xcfa53a, bruno: 0xa9542c, caduco: true, carta: 1.1 },
}
const FOGLIE_TEX = { platano: 'platano', gelso: 'gelso', pioppo: 'pioppo', tondo: 'tondo', siepe: 'siepe', vite: 'vite' }

// ── un modello d'albero: rami (Pezzi 'legno') e carte di foglie ('foglie') ──
function modello(tipo, seme, sta) {
  const r = rng(seme)
  const P = TIPI[tipo]
  const legno = new Pezzi()
  const punte = [] // dove nascono i ciuffi: { p, peso }
  const rr = (a, b) => a + (b - a) * r()
  const ruota = (v, asse, ang) => { // Rodrigues
    const c = Math.cos(ang), s = Math.sin(ang), k = norm(asse)
    const d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]
    const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]]
    return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)]
  }
  const perp = (v) => norm(Math.abs(v[1]) < 0.9 ? [v[2], 0, -v[0]] : [1, 0, 0])
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
  let centro = [0, 6, 0], raggio = [4, 4, 4]
  function ramo(a, dir, lung, r0, liv, max, cfg) {
    const segm = liv < 2 ? 3 : 2
    let p = a, d = dir, rad = r0
    const pts = [a]
    for (let k = 0; k < segm; k++) {
      const piega = cfg.piega * (r() - 0.5)
      d = norm(add(ruota(d, perp(d), piega), [0, cfg.su, 0], 0.18))
      const q = add(p, d, lung / segm)
      const r1 = r0 * (1 - ((k + 1) / segm) * 0.62)
      legno.tubo('legno', p, q, rad, r1, liv < 1 ? 8 : liv < 2 ? 6 : 4, { v0: k, v1: k + 1 })
      p = q; rad = r1; pts.push(q)
    }
    if (liv >= max) { punte.push({ p, peso: 1 }); return }
    const figli = cfg.figli[liv]
    for (let i = 0; i < figli; i++) {
      const t = cfg.da + (1 - cfg.da) * (i + r() * 0.8) / figli
      const idx = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)))
      const base = add(pts[idx], norm([pts[idx + 1][0] - pts[idx][0], pts[idx + 1][1] - pts[idx][1], pts[idx + 1][2] - pts[idx][2]]), (t * (pts.length - 1) - idx) * lung / segm)
      const giro = i * 2.39996 + r() * 0.6
      let nd = ruota(dir, perp(dir), cfg.apertura[liv] * (0.75 + r() * 0.5))
      nd = ruota(nd, dir, giro)
      ramo(base, nd, lung * cfg.cala * (0.8 + r() * 0.4), Math.max(0.012, rad * cfg.spessore), liv + 1, max, cfg)
      if (liv + 1 === max) punte.push({ p: base, peso: 0.6 })
    }
  }

  if (tipo === 'platano' || tipo === 'tondo') {
    const alto = tipo === 'platano' ? rr(3.2, 4.2) : rr(2.0, 2.6)
    const lungRami = tipo === 'platano' ? rr(6.0, 7.5) : rr(3.6, 4.4)
    const fusto = tipo === 'platano' ? 0.34 : 0.2
    legno.tubo('legno', [0, -0.2, 0], [0, alto, 0], fusto * 1.15, fusto, 9)
    const cfg = { piega: 0.55, su: 0.35, figli: [0, 4, 3, 0], apertura: [0, 0.75, 0.7], cala: 0.62, spessore: 0.55, da: 0.3 }
    const n = tipo === 'platano' ? 4 : 4
    for (let i = 0; i < n; i++) {
      const giro = i * 2.39996 + r()
      const d = norm([Math.cos(giro) * 0.62, 1, Math.sin(giro) * 0.62])
      ramo([0, alto - 0.3, 0], d, lungRami, fusto * 0.62, 1, 3, cfg)
    }
    const altC = tipo === 'platano' ? alto + 5.5 : alto + 3.2
    centro = [0, altC, 0]; raggio = tipo === 'platano' ? [5.8, 5.2, 5.8] : [3.6, 3.2, 3.6]
  } else if (tipo === 'gelso') {
    // il gelso capitozzato: tronco corto e grosso, la testa, i polloni dritti tutto intorno
    const alto = rr(1.7, 2.2)
    legno.tubo('legno', [0, -0.2, 0], [r() * 0.2 - 0.1, alto, r() * 0.2 - 0.1], 0.3, 0.24, 9)
    legno.tubo('legno', [0, alto - 0.1, 0], [0, alto + 0.35, 0], 0.3, 0.2, 9)
    const cfg = { piega: 0.25, su: 0.5, figli: [0, 3, 2, 0], apertura: [0, 0.5, 0.6], cala: 0.55, spessore: 0.5, da: 0.45 }
    const n = 9 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) {
      const giro = i * 2.39996 + r()
      const d = norm([Math.cos(giro) * 0.75, 1, Math.sin(giro) * 0.75])
      ramo([Math.cos(giro) * 0.15, alto + 0.25, Math.sin(giro) * 0.15], d, rr(2.0, 2.7), 0.05, 1, 2, cfg)
    }
    centro = [0, alto + 1.9, 0]; raggio = [2.5, 1.8, 2.5]
  } else if (tipo === 'pioppo') {
    // il pioppo cipressino: il fusto sale fino in cima, i rami corti tutti all'insù
    const alto = rr(19, 24)
    legno.tubo('legno', [0, -0.2, 0], [0, alto * 0.55, 0], 0.32, 0.2, 8)
    legno.tubo('legno', [0, alto * 0.55, 0], [r() * 0.3, alto, r() * 0.3], 0.2, 0.03, 6)
    const cfg = { piega: 0.2, su: 0.9, figli: [0, 2, 0], apertura: [0, 0.3, 0.3], cala: 0.5, spessore: 0.5, da: 0.5 }
    for (let i = 0; i < 26; i++) {
      const h = 2.2 + (i / 26) * (alto - 3.2)
      const giro = i * 2.39996
      const d = norm([Math.cos(giro) * 0.42, 1, Math.sin(giro) * 0.42])
      ramo([0, h, 0], d, 2.6 * (1 - (i / 26) * 0.55), 0.06, 1, 2, cfg)
    }
    centro = [0, alto * 0.55, 0]; raggio = [1.9, alto * 0.47, 1.9]
  }

  // ── le carte di foglie: ciuffi sulle punte, normali «a palla» dal centro della chioma (luce morbida) ──
  const foglie = new Pezzi()
  const quante = P.caduco ? sta.foglie : 1
  const cEst = lin(P.estate), cGia = lin(P.giallo), cBru = lin(P.bruno), cTenero = lin(0x9fbf4a)
  const sceltaPunte = punte.slice().sort(() => r() - 0.5)
  const nCiuffi = Math.round(P.ciuffi * Math.min(1, quante * 1.15))
  for (let i = 0; i < nCiuffi && sceltaPunte.length; i++) {
    const pt = sceltaPunte[i % sceltaPunte.length]
    // in autunno i ciuffi rimasti sono gialli o bruni, qualcuno ancora verde
    const k = r()
    let col = k < sta.giallo * 0.92 ? (r() < 0.62 ? cGia : cBru) : mixc(cEst, cGia, sta.giallo * 0.4)
    if (sta.verdino > 0) col = mixc(col, cTenero, sta.verdino)
    const scuro = 0.75 + r() * 0.45
    col = col.map((v) => Math.min(1, v * scuro * 1.9))
    for (let j = 0; j < P.perCiuffo; j++) {
      const off = [(r() - 0.5) * 1.4, (r() - 0.3) * 1.0, (r() - 0.5) * 1.4]
      const c = add(pt.p, off)
      const s = P.carta * (0.75 + r() * 0.5)
      // orientamento a caso, un po' rivolto in su (dall'alto la chioma deve chiudersi)
      let nn = norm([r() - 0.5, r() * 0.9 + 0.2, r() - 0.5])
      const t1 = perp(nn), t2 = norm([nn[1] * t1[2] - nn[2] * t1[1], nn[2] * t1[0] - nn[0] * t1[2], nn[0] * t1[1] - nn[1] * t1[0]])
      const rad = norm([(c[0] - centro[0]) / raggio[0], (c[1] - centro[1]) / raggio[1] + 0.25, (c[2] - centro[2]) / raggio[2]])
      const nLuce = norm([rad[0] * 0.8 + nn[0] * 0.2, rad[1] * 0.8 + nn[1] * 0.2, rad[2] * 0.8 + nn[2] * 0.2])
      const h = s / 2
      const q = (a, b) => add(add(c, t1, a * h), t2, b * h)
      const col4 = [...col, 1]
      foglie.tri('foglie', q(-1, -1), q(1, -1), q(1, 1), nLuce, [0, 0], [1, 0], [1, 1], col4)
      foglie.tri('foglie', q(-1, -1), q(1, 1), q(-1, 1), nLuce, [0, 0], [1, 1], [0, 1], col4)
    }
  }
  return { legno, foglie, centro, raggio }
}

// ── dove stanno gli alberi (prima del terreno: sotto ogni chioma il prato è più scuro) ──
export function piantaAlberi(DATI, aMondo, evita) {
  const r = rng(1234)
  const alberi = []
  const senzaDup = (p) => (p.length > 1 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) < 0.05 ? p.slice(0, -1) : p)
  const lungo = (f, passo, jit = 0) => {
    const out = []
    for (let i = 0; i < f.length - 1; i++) {
      const a = f[i], b = f[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.5) continue
      const n = Math.max(1, Math.round(L / passo))
      for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; out.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * jit, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * jit]) }
    }
    return out
  }
  const vicino = (p, q, d) => Math.hypot(p[0] - q[0], p[1] - q[1]) < d
  const metti = (x, y, tipo, s) => { if (!evita(x, y, tipo)) alberi.push({ x, y, tipo, s, rot: r() * 6.283, var: Math.floor(r() * 3) }) }
  const siepi = []
  for (const f of DATI.filari) {
    const p = f.p
    if (p.length < 2) continue
    const viale = p.some((q) => vicino(q, [17.35, 21.91], 2)) && p.some((q) => vicino(q, [29.55, -15.46], 2))
    const vialeEst = p.some((q) => vicino(q, [19.2, 22.1], 4)) && !viale
    const sud = f.c === 'mixed'
    const casa = p.some((q) => vicino(q, [-16.74, 10.3], 2))
    if (vialeEst || sud) { siepi.push({ p: p.filter((q) => Math.hypot(q[0], q[1]) < 260), alta: 2.3, larga: 1.3 }); continue }
    if (viale) {
      // il filare è disegnato sulla strada: i platani stanno 3,4 m a ovest della ghiaia
      const L = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), nx = (p[1][1] - p[0][1]) / L, ny = -(p[1][0] - p[0][0]) / L
      const s = nx < 0 ? 3.4 : -3.4
      for (const q of lungo(p, 6.2, 0.3)) metti(q[0] + nx * s, q[1] + ny * s, 'platano', 0.95 + r() * 0.2)
      continue
    }
    if (casa) { for (const q of lungo(p, 7.5, 0.6)) metti(q[0], q[1], 'tondo', 0.95 + r() * 0.25); continue }
    // il lungo viale verso sud (platani) e i filari lontani (pioppi)
    const vialeSud = p.some((q) => vicino(q, [59.85, -120.6], 3))
    for (const q of lungo(p, vialeSud ? 6.4 : 8.5, vialeSud ? 0.3 : 1.2)) {
      const d = Math.hypot(q[0], q[1])
      if (d > 520) continue
      metti(q[0], q[1], vialeSud ? 'platano' : r() < 0.82 ? 'pioppo' : 'tondo', 0.9 + r() * 0.3)
    }
  }
  // i gelsi capitozzati: tre file sul prato a ovest, parallele al confine
  {
    const A = [-27.73, -23.35], B = [-59.26, 13.68]
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L
    const nx = dy, ny = -dx // (verso l'interno del lotto: est)
    for (let fila = 0; fila < 3; fila++) {
      for (let t = 4; t < L + 18; t += 7.2) {
        const x = A[0] + dx * t + nx * (6 + fila * 9), y = A[1] + dy * t + ny * (6 + fila * 9)
        metti(x + (r() - 0.5) * 0.5, y + (r() - 0.5) * 0.5, 'gelso', 0.9 + r() * 0.2)
      }
    }
  }
  // il bosco nuovo a nord della casa: alberelli a filari (nel poligono del bosco, dentro il confine)
  const bosco = DATI.campi.find((c) => c.c === 'wood')
  if (bosco) {
    const poly = senzaDup(bosco.p)
    const dentro = (p, poly) => { let d = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) d = !d } return d }
    const ang = 0.33117, C = Math.cos(ang), S = Math.sin(ang)
    for (let a = -80; a < 80; a += 7.5) for (let b = 24; b < 80; b += 6.5) {
      const x = a * C - b * S, y = a * S + b * C
      if (!dentro([x, y], poly)) continue
      if (y < 18 && x > -18) continue
      metti(x + (r() - 0.5) * 0.8, y + (r() - 0.5) * 0.8, 'tondo', 0.5 + r() * 0.25)
    }
  }
  // qualche albero grande nel giardino e attorno alle case vicine
  for (const [u, v, tipo, s] of [[-19, 9, 'tondo', 1.05], [18.5, 9, 'tondo', 1.0], [18.5, -6, 'tondo', 0.95], [-21, -18, 'tondo', 1.1], [3, 23, 'tondo', 1.0]]) {
    const p = aMondo(u, v)
    metti(p[0], p[1], tipo, s)
  }
  for (const e of DATI.edifici) {
    const p = senzaDup(e.p)
    let cx = 0, cy = 0
    for (const q of p) { cx += q[0]; cy += q[1] }
    cx /= p.length; cy /= p.length
    const d = Math.hypot(cx, cy)
    if (d < 40 || d > 560) continue
    for (let k = 0; k < 4; k++) { const a = r() * 6.28, rr = 9 + r() * 12; metti(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r() < 0.4 ? 'pioppo' : 'tondo', 0.8 + r() * 0.4) }
  }
  return { alberi, siepi }
}

// ── le mesh: per ogni tipo tre modelli, ognuno con le sue copie ──
export function creaAlberi(scene, alberi, siepi, sta, materiali, ombre) {
  const out = []
  const perTipo = new Map()
  for (const a of alberi) {
    const k = `${a.tipo}-${a.var}`
    if (!perTipo.has(k)) perTipo.set(k, [])
    perTipo.get(k).push(a)
  }
  const m = new Matrix(), q = new Quaternion(), sc = new Vector3(), tr = new Vector3()
  for (const [k, lista] of perTipo) {
    const [tipo, v] = k.split('-')
    const mod = modello(tipo, 1000 + v * 77 + tipo.length * 13, sta)
    const mats = { legno: materiali['legno-' + TIPI[tipo].corteccia], foglie: materiali['foglie-' + FOGLIE_TEX[tipo]] }
    const pezzi = [...mod.legno.mesh(scene, mats, { nome: 'albero-' + k }), ...mod.foglie.mesh(scene, mats, { nome: 'chioma-' + k })]
    const buf = new Float32Array(lista.length * 16)
    lista.forEach((a, i) => {
      Quaternion.RotationYawPitchRollToRef(a.rot, 0, 0, q)
      sc.set(a.s, a.s * (0.92 + ((i * 37) % 17) / 100), a.s)
      tr.set(a.x, 0, a.y)
      Matrix.ComposeToRef(sc, q, tr, m)
      m.copyToArray(buf, i * 16)
    })
    for (const p of pezzi) {
      p.unfreezeWorldMatrix()
      p.thinInstanceSetBuffer('matrix', buf, 16, true)
      p.alwaysSelectAsActiveMesh = true
      if (ombre) ombre(p)
      out.push(p)
    }
  }
  // le siepi: un'anima piena verde scuro e tante carte di foglie fuori, così il bordo non è una scatola
  if (siepi.length) {
    const r = rng(77)
    const pz = new Pezzi()
    const cS = lin(TIPI.siepe.estate)
    for (const s of siepi) {
      for (let i = 0; i < s.p.length - 1; i++) {
        const a = s.p[i], b = s.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
        if (L < 0.3) continue
        const dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L, nx = -dy, ny = dx
        const w = s.larga / 2 - 0.15, h = s.alta - 0.25
        const P = (t, o, y) => [a[0] + dx * t + nx * o, y, a[1] + dy * t + ny * o]
        pz.quad('anima', P(0, -w, 0), P(L, -w, 0), P(L, -w, h), P(0, -w, h), [-nx, 0, -ny], [[0, 0], [L, 0], [L, h], [0, h]])
        pz.quad('anima', P(0, w, 0), P(L, w, 0), P(L, w, h), P(0, w, h), [nx, 0, ny], [[0, 0], [L, 0], [L, h], [0, h]])
        pz.quad('anima', P(0, -w, h), P(L, -w, h), P(L, w, h), P(0, w, h), [0, 1, 0], [[0, 0], [L, 0], [L, 1], [0, 1]])
        const n = Math.round(L * 7)
        for (let k = 0; k < n; k++) {
          const t = r() * L, lato = r()
          const o = lato < 0.4 ? -w - 0.05 + r() * 0.15 : lato < 0.8 ? w + 0.05 - r() * 0.15 : (r() - 0.5) * 2 * w
          const y = lato < 0.8 ? 0.25 + r() * (h - 0.1) : h + r() * 0.12
          const c = P(t, o, y)
          const nn = lato < 0.4 ? [-nx, 0.3, -ny] : lato < 0.8 ? [nx, 0.3, ny] : [0, 1, 0]
          const sz = TIPI.siepe.carta * (0.7 + r() * 0.5) / 2
          const t1 = norm([dx + (r() - 0.5) * 0.6, (r() - 0.5) * 0.8, dy + (r() - 0.5) * 0.6]), t2 = norm([nn[1] * t1[2] - nn[2] * t1[1], nn[2] * t1[0] - nn[0] * t1[2], nn[0] * t1[1] - nn[1] * t1[0]])
          const qq = (u, v) => [c[0] + t1[0] * u * sz + t2[0] * v * sz, c[1] + t1[1] * u * sz + t2[1] * v * sz, c[2] + t1[2] * u * sz + t2[2] * v * sz]
          const scuro = 0.8 + r() * 0.5
          const col = [...cS.map((v) => Math.min(1, v * scuro * 1.9)), 1]
          const nl = norm(nn)
          pz.tri('foglie', qq(-1, -1), qq(1, -1), qq(1, 1), nl, [0, 0], [1, 0], [1, 1], col)
          pz.tri('foglie', qq(-1, -1), qq(1, 1), qq(-1, 1), nl, [0, 0], [1, 1], [0, 1], col)
        }
      }
    }
    const ms = pz.mesh(scene, { anima: materiali.siepeAnima, foglie: materiali['foglie-siepe'] }, { nome: 'siepi' })
    for (const p of ms) { if (ombre) ombre(p); out.push(p) }
  }
  return out
}

// ── i ciuffi di vite sopra il pergolato ──
export function viteSu(pz, punti, sta, r) {
  const P = TIPI.vite
  const n = Math.round(punti.length * Math.max(0.08, sta.foglie))
  const cE = lin(P.estate), cG = lin(P.giallo), cB = lin(P.bruno)
  for (let i = 0; i < n; i++) {
    const c = punti[Math.floor(r() * punti.length)]
    let col = r() < sta.giallo * 0.9 ? (r() < 0.6 ? cG : cB) : cE
    col = [...col.map((v) => Math.min(1, v * (0.8 + r() * 0.4) * 1.9)), 1]
    const s = P.carta * (0.7 + r() * 0.5) / 2, a = r() * 6.28
    const t1 = [Math.cos(a), (r() - 0.5) * 0.3, Math.sin(a)], t2 = [-Math.sin(a), (r() - 0.5) * 0.3, Math.cos(a)]
    const q = (u, v) => [c[0] + t1[0] * u * s + t2[0] * v * s, c[1] + 0.08 + t1[1] * u * s + t2[1] * v * s, c[2] + t1[2] * u * s + t2[2] * v * s]
    pz.tri('vite', q(-1, -1), q(1, -1), q(1, 1), [0, 1, 0], [0, 0], [1, 0], [1, 1], col)
    pz.tri('vite', q(-1, -1), q(1, 1), q(-1, 1), [0, 1, 0], [0, 0], [1, 1], [0, 1], col)
  }
}

// ── gli alberi lontani (oltre 500 m): due carte incrociate con la sagoma, copie leggere ──
export function creaLontani(scene, punti, materiale) {
  const vd = new VertexData()
  const p = [], n = [], u = [], i = []
  for (const [k, ang] of [[0, 0], [1, Math.PI / 2]]) {
    const c = Math.cos(ang), s = Math.sin(ang), b = p.length / 3
    p.push(-c * 0.5, 0, -s * 0.5, c * 0.5, 0, s * 0.5, c * 0.5, 1, s * 0.5, -c * 0.5, 1, -s * 0.5)
    for (let j = 0; j < 4; j++) n.push(0, 0.6, 0) // (luce da sopra: niente facce nere)
    u.push(0, 0, 1, 0, 1, 1, 0, 1)
    i.push(b, b + 2, b + 1, b, b + 3, b + 2)
  }
  vd.positions = p; vd.normals = n.map((v, j) => (j % 3 === 1 ? 1 : 0)); vd.uvs = u; vd.indices = i
  const mesh = new Mesh('alberi-lontani', scene)
  vd.applyToMesh(mesh)
  mesh.material = materiale
  const buf = new Float32Array(punti.length * 16)
  const m = new Matrix(), q = new Quaternion(), sc = new Vector3(), tr = new Vector3()
  punti.forEach((a, k) => {
    Quaternion.RotationYawPitchRollToRef(a.rot, 0, 0, q)
    sc.set(a.w, a.h, a.w); tr.set(a.x, 0, a.y)
    Matrix.ComposeToRef(sc, q, tr, m); m.copyToArray(buf, k * 16)
  })
  mesh.thinInstanceSetBuffer('matrix', buf, 16, true)
  mesh.alwaysSelectAsActiveMesh = true
  mesh.isPickable = false
  return mesh
}
