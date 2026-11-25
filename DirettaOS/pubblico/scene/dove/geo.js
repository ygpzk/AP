// «Dove vivo» · i mattoncini della geometria: si accumulano triangoli per materiale e alla fine si fa una mesh sola
// per materiale (poche chiamate di disegno). Coordinate del mondo: x est, y in alto, z nord (Babylon, mano sinistra).
// Un «telaio» porta le coordinate di un edificio (u lungo il lato lungo, v di traverso) nel mondo.
import { Mesh, VertexData, earcut } from '../lib/babylon/babylon.js'

export const RAD = Math.PI / 180
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const croce = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }

// il telaio di un edificio: centro (x, z) e angolo del lato lungo (da est verso nord)
export function telaio(cx, cz, ang) {
  const C = Math.cos(ang), S = Math.sin(ang)
  return {
    C, S, cx, cz, ang,
    p: (u, y, v) => [cx + u * C - v * S, y, cz + u * S + v * C], // un punto
    d: (du, dy, dv) => [du * C - dv * S, dy, du * S + dv * C], // una direzione
  }
}

export class Pezzi {
  constructor() { this.m = new Map() }
  di(mat) {
    let b = this.m.get(mat)
    if (!b) { b = { p: [], n: [], u: [], c: [], i: [], colori: false }; this.m.set(mat, b) }
    return b
  }
  // un triangolo con la normale voluta: l'ordine dei vertici si sistema da solo (in Babylon davanti = orario)
  tri(mat, a, b, c, n, ua = [0, 0], ub = [1, 0], uc = [1, 1], col = null) {
    const B = this.di(mat)
    if (punto(croce(sub(b, a), sub(c, a)), n) > 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub] }
    const k = B.p.length / 3
    B.p.push(...a, ...b, ...c)
    B.n.push(...n, ...n, ...n)
    B.u.push(...ua, ...ub, ...uc)
    if (col) { B.colori = true; B.c.push(...col, ...col, ...col) } else B.c.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
    B.i.push(k, k + 1, k + 2)
  }
  // un quadrilatero a, b, c, d in giro; uv opzionali, normale calcolata se manca
  quad(mat, a, b, c, d, n = null, uv = null, col = null) {
    n = n ?? norm(croce(sub(b, a), sub(d, a)))
    uv = uv ?? [[0, 0], [1, 0], [1, 1], [0, 1]]
    this.tri(mat, a, b, c, n, uv[0], uv[1], uv[2], col)
    this.tri(mat, a, c, d, n, uv[0], uv[2], uv[3], col)
  }
  // un poligono piano (anche concavo, anche con buchi): punti in 2D (s, t) e una funzione che li porta nel mondo
  piano(mat, contorno, buchi, a3d, n, uvDi = (s, t) => [s, t], col = null) {
    const flat = [], fori = []
    for (const q of contorno) flat.push(q[0], q[1])
    for (const h of buchi) { fori.push(flat.length / 2); for (const q of h) flat.push(q[0], q[1]) }
    const idx = earcut(flat, fori, 2)
    const P = [], U = []
    for (let i = 0; i < flat.length; i += 2) { P.push(a3d(flat[i], flat[i + 1])); U.push(uvDi(flat[i], flat[i + 1])) }
    for (let i = 0; i < idx.length; i += 3) this.tri(mat, P[idx[i]], P[idx[i + 1]], P[idx[i + 2]], n, U[idx[i]], U[idx[i + 1]], U[idx[i + 2]], col)
  }
  // una scatola nel telaio T: da u0 a u1, da y0 a y1, da v0 a v1; uv in metri; facce da saltare in «senza»
  scatola(mat, T, u0, u1, y0, y1, v0, v1, { senza = '', col = null, scala = 1 } = {}) {
    const P = (u, y, v) => T.p(u, y, v)
    const du = (u1 - u0) * scala, dy = (y1 - y0) * scala, dv = (v1 - v0) * scala
    if (!senza.includes('s')) this.quad(mat, P(u0, y1, v0), P(u1, y1, v0), P(u1, y1, v1), P(u0, y1, v1), [0, 1, 0], [[0, 0], [du, 0], [du, dv], [0, dv]], col)
    if (!senza.includes('g')) this.quad(mat, P(u0, y0, v0), P(u1, y0, v0), P(u1, y0, v1), P(u0, y0, v1), [0, -1, 0], [[0, 0], [du, 0], [du, dv], [0, dv]], col)
    if (!senza.includes('d')) this.quad(mat, P(u0, y0, v0), P(u1, y0, v0), P(u1, y1, v0), P(u0, y1, v0), T.d(0, 0, -1), [[0, 0], [du, 0], [du, dy], [0, dy]], col)
    if (!senza.includes('r')) this.quad(mat, P(u0, y0, v1), P(u1, y0, v1), P(u1, y1, v1), P(u0, y1, v1), T.d(0, 0, 1), [[0, 0], [du, 0], [du, dy], [0, dy]], col)
    if (!senza.includes('o')) this.quad(mat, P(u0, y0, v0), P(u0, y0, v1), P(u0, y1, v1), P(u0, y1, v0), T.d(-1, 0, 0), [[0, 0], [dv, 0], [dv, dy], [0, dy]], col)
    if (!senza.includes('e')) this.quad(mat, P(u1, y0, v0), P(u1, y0, v1), P(u1, y1, v1), P(u1, y1, v0), T.d(1, 0, 0), [[0, 0], [dv, 0], [dv, dy], [0, dy]], col)
  }
  // un tubo (tronchi, pluviali, ringhiere): da a a b, raggi ra → rb, n lati
  tubo(mat, a, b, ra, rb, lati = 8, { v0 = 0, v1 = 1, chiudi = false, col = null } = {}) {
    const ax = norm(sub(b, a))
    const ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const e1 = norm(croce(ax, ref)), e2 = croce(ax, e1)
    const anello = (c, r, k) => { const t = (k / lati) * Math.PI * 2; const cs = Math.cos(t), sn = Math.sin(t); return { p: [c[0] + (e1[0] * cs + e2[0] * sn) * r, c[1] + (e1[1] * cs + e2[1] * sn) * r, c[2] + (e1[2] * cs + e2[2] * sn) * r], n: norm([e1[0] * cs + e2[0] * sn, e1[1] * cs + e2[1] * sn, e1[2] * cs + e2[2] * sn]) } }
    const B = this.di(mat)
    const base = B.p.length / 3
    for (let k = 0; k <= lati; k++) {
      const p0 = anello(a, ra, k), p1 = anello(b, rb, k)
      B.p.push(...p0.p, ...p1.p); B.n.push(...p0.n, ...p1.n)
      B.u.push(k / lati, v0, k / lati, v1)
      const c = col ?? [1, 1, 1, 1]; if (col) B.colori = true
      B.c.push(...c, ...c)
    }
    for (let k = 0; k < lati; k++) {
      const i0 = base + k * 2, i1 = i0 + 1, i2 = i0 + 2, i3 = i0 + 3
      // (in Babylon davanti = orario visto da fuori)
      B.i.push(i0, i1, i2, i1, i3, i2)
    }
    if (chiudi) { for (let k = 0; k < lati; k++) { const q0 = anello(b, rb, k).p, q1 = anello(b, rb, k + 1).p; this.tri(mat, b, q0, q1, ax) } }
  }
  // tutte le mesh, una per materiale; materiali = { nome: materiale Babylon }
  mesh(scene, materiali, { ombre = null, ricevi = true, nome = 'pezzi' } = {}) {
    const out = []
    for (const [m, B] of this.m) {
      if (!B.i.length || !materiali[m]) continue
      const mesh = new Mesh(`${nome}-${m}`, scene)
      const vd = new VertexData()
      vd.positions = B.p; vd.normals = B.n; vd.uvs = B.u; vd.indices = B.i
      if (B.colori) vd.colors = B.c
      vd.applyToMesh(mesh, false)
      mesh.material = materiali[m]
      mesh.receiveShadows = ricevi
      mesh.isPickable = false
      mesh.freezeWorldMatrix()
      if (ombre) ombre(mesh, m)
      out.push(mesh)
    }
    return out
  }
}

// le aperture nei muri, in coordinate del muro (s lungo, y in alto)
export function rettangolo(s0, s1, y0, y1) { return [[s0, y0], [s1, y0], [s1, y1], [s0, y1]] }
export function arco(s0, s1, y0, yImposta, seg = 16) {
  const r = (s1 - s0) / 2, c = (s0 + s1) / 2
  const out = [[s0, y0], [s1, y0], [s1, yImposta]]
  for (let k = 1; k < seg; k++) { const a = (k / seg) * Math.PI; out.push([c + Math.cos(a) * r, yImposta + Math.sin(a) * r]) }
  out.push([s0, yImposta])
  return out
}

// un muro con aperture. Il lato esterno sta sulla linea da A a B (punti [x, z] a terra), la normale «fuori» è a destra
// guardando da A verso B quando fuori = 1. profilo e aperture in (s, y). Le aperture devono stare dentro il profilo.
export function muro(pz, { A, B, fuori = 1, spessore = 0.3, profilo, aperture = [], mat, matDentro = mat, matSguincio = mat, y0 = 0 }) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const d = [(B[0] - A[0]) / L, 0, (B[1] - A[1]) / L]
  const n = [d[2] * fuori, 0, -d[0] * fuori] // a destra di A→B (x est, z nord: destra di nord è est)
  const P = (s, y, k = 0) => [A[0] + d[0] * s - n[0] * k, y0 + y, A[1] + d[2] * s - n[2] * k]
  const buchi = aperture.map((a) => a.contorno)
  pz.piano(mat, profilo, buchi, (s, y) => P(s, y), n, (s, y) => [s, y])
  pz.piano(matDentro, profilo, buchi, (s, y) => P(s, y, spessore), [-n[0], 0, -n[2]], (s, y) => [s, y])
  // gli sguinci delle aperture
  for (const a of aperture) {
    const c = a.contorno
    let cs = 0, cy = 0
    for (const q of c) { cs += q[0]; cy += q[1] }
    cs /= c.length; cy /= c.length
    for (let k = 0; k < c.length; k++) {
      const p = c[k], q = c[(k + 1) % c.length]
      const es = q[0] - p[0], ey = q[1] - p[1], el = Math.hypot(es, ey) || 1
      let ns = -ey / el, ny = es / el
      const ms = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2
      if (ns * (cs - ms) + ny * (cy - my) < 0) { ns = -ns; ny = -ny }
      const nn = norm([d[0] * ns, ny, d[2] * ns])
      const lung = el
      pz.quad(matSguincio, P(p[0], p[1]), P(q[0], q[1]), P(q[0], q[1], spessore), P(p[0], p[1], spessore), nn, [[0, 0], [lung, 0], [lung, spessore], [0, spessore]])
    }
  }
  return { P, d, n, L }
}
