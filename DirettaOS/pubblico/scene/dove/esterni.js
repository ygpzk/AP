// «Dove vivo» · fuori casa: la piscina rialzata col bordo in cotto e gli aironi, il pergolato con la vite, le reti,
// il cancello in fondo al viale, il Landini grigio con le ruote arancioni, i vasi, le lanterne.
import { Pezzi, norm } from './geo.js'
import { viteSu } from './verde.js'
import { rng } from './tele.js'

const senzaDup = (p) => (p.length > 1 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) < 0.05 ? p.slice(0, -1) : p)
const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1] }; return a / 2 }
// un contorno spostato di d metri (fuori se d > 0), con gli spigoli a punta
function sposta(p, d) {
  const ccw = area(p) > 0 ? 1 : -1
  return p.map((q, i) => {
    const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length]
    const e1 = norm([q[0] - a[0], 0, q[1] - a[1]]), e2 = norm([b[0] - q[0], 0, b[1] - q[1]])
    const n1 = [e1[2] * ccw, -e1[0] * ccw], n2 = [e2[2] * ccw, -e2[0] * ccw]
    let nx = n1[0] + n2[0], ny = n1[1] + n2[1]
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l
    const cos = Math.max(0.35, nx * n1[0] + ny * n1[1])
    return [q[0] + (nx * d) / cos, q[1] + (ny * d) / cos]
  })
}

export function costruisciEsterni(D, T, sta) {
  const pz = new Pezzi()
  const r = rng(555)
  const getti = [], lanterne = []

  // ── la piscina: muretto di cemento alto 62 cm, bordo in cotto, l'acqua azzurra ──
  const fonte = senzaDup(D.fonte.p)
  {
    const h = 0.62
    const fuori = sposta(fonte, 0.0), bordoF = sposta(fonte, 0.06), dentro = sposta(fonte, -0.34)
    const ccw = area(fuori) > 0 ? 1 : -1
    for (let i = 0; i < fuori.length; i++) {
      const a = fuori[i], b = fuori[(i + 1) % fuori.length]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = norm([(b[1] - a[1]) * ccw, 0, -(b[0] - a[0]) * ccw])
      pz.quad('cemento', [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], n, [[0, 0], [L, 0], [L, h], [0, h]])
      const c = bordoF[i], d = bordoF[(i + 1) % bordoF.length]
      pz.quad('cotto', [c[0], h, c[1]], [d[0], h, d[1]], [d[0], h + 0.07, d[1]], [c[0], h + 0.07, c[1]], n, [[0, 0], [L, 0], [L, 0.07], [0, 0.07]])
      // dentro: le piastrelle che si vedono sopra l'acqua
      const e = dentro[i], f = dentro[(i + 1) % dentro.length]
      pz.quad('piastrelle', [e[0], h - 0.14, e[1]], [f[0], h - 0.14, f[1]], [f[0], h + 0.07, f[1]], [e[0], h + 0.07, e[1]], [-n[0], 0, -n[2]], [[0, 0], [L / 2, 0], [L / 2, 0.1], [0, 0.1]])
    }
    pz.piano('cotto', bordoF, [dentro], (x, y) => [x, h + 0.07, y], [0, 1, 0], (x, y) => [x, y])
    pz.piano('acquaPiscina', dentro, [], (x, y) => [x, h - 0.1, y], [0, 1, 0], (x, y) => [x / 3, y / 3])
    // due getti d'acqua, come nelle foto, e due aironi sugli spigoli
    const c = D.fonte.centro
    getti.push([c[0] - 1.6, h - 0.1, c[1] + 0.4], [c[0] + 1.4, h - 0.1, c[1] - 0.9])
    let ia = 0
    for (const i of [1, 6]) {
      const p = bordoF[i % bordoF.length]
      airone(pz, p[0], h + 0.07, p[1], ia++ * 2.1 + 0.6)
    }
  }

  // ── il pergolato con la vite, sul lato ovest dell'ala a due piani ──
  {
    const u0 = -20.6, u1 = -14.3, v0 = -2.2, v1 = 4.6, alto = 2.65
    const punti = []
    for (const u of [u0, (u0 + u1) / 2, u1 - 0.1]) for (const v of [v0, (v0 + v1) / 2, v1]) {
      if (u > u1 - 0.2 && Math.abs(v - (v0 + v1) / 2) < 0.1) continue
      pz.scatola('legno', T, u - 0.08, u + 0.08, 0, alto, v - 0.08, v + 0.08, { senza: 'g' })
    }
    for (const u of [u0, (u0 + u1) / 2, u1 - 0.1]) pz.scatola('legno', T, u - 0.09, u + 0.09, alto, alto + 0.2, v0 - 0.4, v1 + 0.4)
    for (let v = v0 - 0.2; v <= v1 + 0.21; v += 0.55) pz.scatola('legno', T, u0 - 0.45, u1 + 0.05, alto + 0.2, alto + 0.3, v - 0.04, v + 0.04)
    for (let u = u0 - 0.3; u < u1; u += 0.45) for (let v = v0 - 0.2; v < v1 + 0.3; v += 0.45) punti.push(T.p(u + r() * 0.3, alto + 0.3, v + r() * 0.3))
    // i tralci che salgono sui pali
    for (const v of [v0, v1]) pz.tubo('legno', T.p(u0, 0, v + 0.1), T.p(u0 + 0.2, alto, v + 0.15), 0.05, 0.03, 5)
    viteSu(pz, punti, sta, r)
    // un tavolo sotto
    pz.scatola('legno', T, -18.6, -16.4, 0.72, 0.78, 0.4, 1.4)
    for (const [u, v] of [[-18.5, 0.5], [-16.5, 0.5], [-18.5, 1.3], [-16.5, 1.3]]) pz.scatola('legno', T, u - 0.04, u + 0.04, 0, 0.72, v - 0.04, v + 0.04)
  }

  // ── le reti: pali grigi ogni 2,5 m e la maglia a rombi ──
  for (const linea of D.recinzioni) {
    for (let i = 0; i < linea.length - 1; i++) {
      const a = linea[i], b = linea[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(1, Math.round(L / 2.5))
      for (let k = 0; k <= n; k++) { const t = k / n; const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; pz.tubo('palo', [x, -0.1, y], [x, 1.72, y], 0.03, 0.03, 5) }
      const nn = norm([b[1] - a[1], 0, -(b[0] - a[0])])
      pz.quad('rete', [a[0], 0.05, a[1]], [b[0], 0.05, b[1]], [b[0], 1.65, b[1]], [a[0], 1.65, a[1]], nn, [[0, 0], [L / 0.8, 0], [L / 0.8, 1.6 / 0.8], [0, 1.6 / 0.8]])
      pz.tubo('palo', [a[0], 1.65, a[1]], [b[0], 1.65, b[1]], 0.018, 0.018, 4)
    }
  }

  // ── il cancello in fondo al viale: pilastri di cemento col cappello, cancello scorrevole a lance ──
  {
    const A = [16.0, 28.1], B = [20.4, 28.5]
    const d = norm([B[0] - A[0], 0, B[1] - A[1]]), n = [d[2], 0, -d[0]]
    for (const p of [A, B]) {
      const P = (x, y, z) => [p[0] + d[0] * x + n[0] * z, y, p[1] + d[2] * x + n[2] * z]
      for (const [s, y0, y1] of [[0.24, 0, 2.15], [0.3, 2.15, 2.3]]) {
        const q = (x, y, z) => P(x * s, y, z * s)
        pz.quad('cemento', q(-1, y0, -1), q(1, y0, -1), q(1, y1, -1), q(-1, y1, -1), [-n[0], 0, -n[2]], [[0, 0], [0.5, 0], [0.5, y1 - y0], [0, y1 - y0]])
        pz.quad('cemento', q(-1, y0, 1), q(1, y0, 1), q(1, y1, 1), q(-1, y1, 1), n, [[0, 0], [0.5, 0], [0.5, y1 - y0], [0, y1 - y0]])
        pz.quad('cemento', q(-1, y0, -1), q(-1, y0, 1), q(-1, y1, 1), q(-1, y1, -1), [-d[0], 0, -d[2]], [[0, 0], [0.5, 0], [0.5, y1 - y0], [0, y1 - y0]])
        pz.quad('cemento', q(1, y0, -1), q(1, y0, 1), q(1, y1, 1), q(1, y1, -1), d, [[0, 0], [0.5, 0], [0.5, y1 - y0], [0, y1 - y0]])
        pz.quad('cemento', q(-1, y1, -1), q(1, y1, -1), q(1, y1, 1), q(-1, y1, 1), [0, 1, 0], [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]])
      }
    }
    const L = Math.hypot(B[0] - A[0], B[1] - A[1])
    const P = (s, y) => [A[0] + d[0] * s, y, A[1] + d[2] * s]
    for (const y of [0.12, 0.55, 1.55]) pz.tubo('cancello', P(0.25, y), P(L - 0.25, y), 0.03, 0.03, 4)
    for (let s = 0.32; s < L - 0.25; s += 0.13) { pz.tubo('cancello', P(s, 0.1), P(s, 1.72), 0.013, 0.013, 4); pz.tubo('cancello', P(s, 1.72), P(s, 1.84), 0.03, 0.002, 4) }
  }

  // ── il Landini: grigio, ruote arancioni, davanti all'arco del capannone ──
  trattore(pz, T, 2.2, -16.4, -0.15)

  // ── i vasi di cotto e le lanterne accanto alle porte ──
  for (const [u, v] of [[-12.4, -3.05], [-10.7, -3.05], [-0.95, -2.95], [0.95, -2.95], [10.6, -3.0]]) {
    const p = T.p(u, 0, v)
    pz.tubo('cotto', [p[0], 0, p[2]], [p[0], 0.55, p[2]], 0.2, 0.28, 10, { chiudi: true })
  }
  return { pz, getti, lanterne }
}

function airone(pz, x, y, z, ang) {
  const c = Math.cos(ang), s = Math.sin(ang)
  const P = (a, h, b) => [x + a * c - b * s, y + h, z + a * s + b * c]
  pz.tubo('airone', P(0, 0, 0), P(0.02, 0.38, 0), 0.012, 0.012, 4)
  pz.tubo('airone', P(0, 0, 0.08), P(0.02, 0.38, 0.06), 0.012, 0.012, 4)
  pz.tubo('airone', P(-0.16, 0.42, 0.03), P(0.2, 0.6, 0.03), 0.09, 0.07, 8, { chiudi: true })
  pz.tubo('airone', P(-0.18, 0.42, 0.03), P(-0.34, 0.36, 0.03), 0.07, 0.015, 6)
  pz.tubo('airone', P(0.18, 0.58, 0.03), P(0.22, 0.95, 0.03), 0.035, 0.03, 6)
  pz.tubo('airone', P(0.22, 0.95, 0.03), P(0.3, 1.0, 0.03), 0.045, 0.04, 6)
  pz.tubo('airone', P(0.3, 1.0, 0.03), P(0.48, 0.97, 0.03), 0.02, 0.004, 5)
}

function trattore(pz, T, u, v, rot) {
  const c = Math.cos(rot), s = Math.sin(rot)
  const P = (a, h, b) => T.p(u + a * c - b * s, h, v + a * s + b * c)
  const box = (m, a0, a1, h0, h1, b0, b1) => {
    const q = (a, h, b) => P(a, h, b)
    const n = (x, y, z) => norm(T.d(x * c - z * s, y, x * s + z * c))
    pz.quad(m, q(a0, h1, b0), q(a1, h1, b0), q(a1, h1, b1), q(a0, h1, b1), [0, 1, 0])
    pz.quad(m, q(a0, h0, b0), q(a1, h0, b0), q(a1, h1, b0), q(a0, h1, b0), n(0, 0, -1))
    pz.quad(m, q(a0, h0, b1), q(a1, h0, b1), q(a1, h1, b1), q(a0, h1, b1), n(0, 0, 1))
    pz.quad(m, q(a0, h0, b0), q(a0, h0, b1), q(a0, h1, b1), q(a0, h1, b0), n(-1, 0, 0))
    pz.quad(m, q(a1, h0, b0), q(a1, h0, b1), q(a1, h1, b1), q(a1, h1, b0), n(1, 0, 0))
  }
  // muso a +a: cofano, radiatore, sedile dietro
  box('trattore', -0.4, 1.55, 0.55, 1.18, -0.34, 0.34)
  box('trattore', 1.5, 1.68, 0.5, 1.2, -0.36, 0.36)
  box('scuro', 1.68, 1.7, 0.6, 1.12, -0.3, 0.3)
  box('trattore', -1.0, -0.35, 0.45, 0.9, -0.42, 0.42)
  box('scuro', -0.95, -0.55, 1.05, 1.15, -0.25, 0.25)
  pz.tubo('scuro', P(-0.75, 0.9, 0), P(-0.75, 1.05, 0), 0.05, 0.05, 5)
  pz.tubo('scuro', P(-0.2, 1.1, 0), P(-0.45, 1.45, 0), 0.02, 0.02, 4)
  pz.tubo('scuro', P(-0.45, 1.45, -0.18), P(-0.45, 1.45, 0.18), 0.02, 0.02, 4)
  pz.tubo('scuro', P(1.1, 1.18, 0.22), P(1.1, 1.85, 0.22), 0.04, 0.04, 6)
  // le ruote: dietro grandi, davanti piccole; gomma nera, cerchio arancione
  for (const [a, b, rr, w] of [[-0.75, -0.66, 0.66, 0.34], [-0.75, 0.66, 0.66, 0.34], [1.2, -0.5, 0.4, 0.2], [1.2, 0.5, 0.4, 0.2]]) {
    const segno = Math.sign(b)
    pz.tubo('gomma', P(a, rr, b - w / 2 * segno), P(a, rr, b + w / 2 * segno), rr, rr, 16, { chiudi: true })
    pz.tubo('ruota', P(a, rr, b + (w / 2 + 0.005) * segno), P(a, rr, b + (w / 2 + 0.02) * segno), rr * 0.62, rr * 0.55, 12, { chiudi: true })
  }
}
