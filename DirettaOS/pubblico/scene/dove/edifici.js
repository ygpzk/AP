// «Dove vivo» · la casa e il capannone, rifatti dalle foto (cemento a vista grigio, pilastri e davanzali in mattoni,
// coppi, persiane verde scuro, modiglioni sotto la gronda, pluviali marrone scuro).
//
// Tutto è nel telaio della casa: u lungo il lato lungo (verso est-nord-est), v di traverso (verso nord-nord-ovest),
// origine al centro del corpo centrale. Le sagome sono quelle del rilievo (dati.js):
//   corpo centrale 16,24 × 17,15 m: davanti (v < -2,64) il portico a tutta altezza, tre archi sul fronte e uno per lato;
//                                   dietro, due piani con il portone e le finestre; tetto a capanna, colmo lungo u
//   ala ovest 6,09 × 10,15 m, due piani, pilastri d'angolo in mattoni, il pergolato sul lato corto
//   ala est   6,09 × 10,15 m, un piano, porta ad arco e finestra (come nella foto del cantiere)
//   capannone 16,24 × 10,15 m: lunette ad arco sui lati, un grande arco verso la casa, i pannelli sulla falda a sud
import { Pezzi, telaio, muro, arco, rettangolo, RAD, norm } from './geo.js'

export const ANGOLO = 0.33117 // il lato lungo, da est verso nord (dal rilievo: 18,97°)
const PEND = 18 * RAD, TAN = Math.tan(PEND)

// un'apertura: lato d (v0, davanti) r (v1, dietro) o (u0) e (u1); c = centro (u o v assoluti), w larghezza
// tipo: finestra · porta · portone · vetrata · lunetta · arco (vano aperto ad arco) · vano
const F = (lato, c, w, y0, y1, tipo = 'finestra', extra = {}) => ({ lato, c, w, y0, y1, tipo, ...extra })

export function costruisciEdifici() {
  const T = telaio(0, 0, ANGOLO)
  const pz = new Pezzi()
  const luci = [] // dove la sera c'è una lanterna: { p: [x, y, z] }
  const finestre = [] // i vetri che la sera si accendono (in un materiale a parte)
  let seme = 7
  const caso = () => { seme = (seme * 16807) % 2147483647; return seme / 2147483647 }

  // ── un volume: muri con aperture, tetto, modiglioni, gronde, pluviali ──
  function blocco(b) {
    const { u0, u1, v0, v1, h, spessore = 0.3, aperture = [], senza = '', profiloTop = null } = b
    const vc = (v0 + v1) / 2, mezzo = (v1 - v0) / 2
    const colmo = h + mezzo * TAN
    const lati = {
      d: { A: [u0, v0], B: [u1, v0], s: (u) => u - u0, L: u1 - u0 },
      e: { A: [u1, v0], B: [u1, v1], s: (v) => v - v0, L: v1 - v0, timpano: true },
      r: { A: [u1, v1], B: [u0, v1], s: (u) => u1 - u, L: u1 - u0 },
      o: { A: [u0, v1], B: [u0, v0], s: (v) => v1 - v, L: v1 - v0, timpano: true },
    }
    for (const [k, l] of Object.entries(lati)) {
      if (senza.includes(k)) continue
      const sp = b.spessori?.[k] ?? spessore
      // il profilo: rettangolo fino alla gronda, sui lati corti il timpano fino sotto il tetto
      const yTop = profiloTop?.[k] ?? h
      const profilo = l.timpano
        ? [[0, -0.4], [l.L, -0.4], [l.L, h], [l.L / 2, colmo - 0.02], [0, h]]
        : [[0, -0.4], [l.L, -0.4], [l.L, yTop], [0, yTop]]
      const qui = aperture.filter((a) => a.lato === k)
      const aps = qui.map((a) => {
        const s = l.s(a.c), s0 = s - a.w / 2, s1 = s + a.w / 2
        const tondo = a.tipo === 'lunetta' || a.tipo === 'arco' || a.arcata
        return { a, s0, s1, contorno: tondo ? arco(s0, s1, a.y0, a.y1, 18) : rettangolo(s0, s1, a.y0, a.y1) }
      })
      const A = T.p(l.A[0], 0, l.A[1]), B = T.p(l.B[0], 0, l.B[1])
      const m = muro(pz, { A: [A[0], A[2]], B: [B[0], B[2]], fuori: 1, spessore: sp, profilo, aperture: aps, mat: 'cemento', matDentro: b.dentro ?? 'cementoDentro', matSguincio: 'cemento' })
      for (const ap of aps) riempi(m, ap, sp)
    }
    if (b.tetto !== false) tetto({ u0, u1, v0, v1, h, og0: b.og0 ?? 0.45, og1: b.og1 ?? 0.45, ov: b.ov ?? 0.62, modiglioni: b.modiglioni ?? 2.6, pluviali: b.pluviali ?? true })
    return { colmo }
  }

  // ── cosa c'è dentro un'apertura: vetro, persiane, porta, davanzale in mattoni ──
  function riempi(m, { a, s0, s1, contorno }, sp) {
    const { P, n } = m
    const dentro = (k) => (s, y) => P(s, y, k)
    if (a.tipo === 'arco' || a.tipo === 'vano') return
    const rientro = a.tipo === 'finestra' || a.tipo === 'lunetta' ? 0.14 : 0.1
    if (a.tipo === 'finestra' || a.tipo === 'lunetta' || a.tipo === 'vetrata') {
      const accesa = a.accesa ?? caso() < 0.55
      const mat = accesa ? 'vetroAcceso' : 'vetro'
      pz.piano(mat, contorno, [], dentro(rientro), n, (s, y) => [(s - s0) / (s1 - s0), y])
      if (accesa) finestre.push(P((s0 + s1) / 2, (a.y0 + a.y1) / 2, rientro))
      // la croce del serramento
      const sm = (s0 + s1) / 2, tt = 0.035
      const top = a.tipo === 'lunetta' ? a.y1 + (s1 - s0) / 2 : a.y1
      telaietto(P, n, sm - tt, sm + tt, a.y0, top, rientro - 0.02)
      if (a.tipo === 'lunetta') telaietto(P, n, s0, s1, a.y1 - tt, a.y1 + tt, rientro - 0.02)
      else if (a.y1 - a.y0 > 1.6) telaietto(P, n, s0, s1, a.y0 + (a.y1 - a.y0) * 0.62 - tt, a.y0 + (a.y1 - a.y0) * 0.62 + tt, rientro - 0.02)
      // le persiane: aperte contro il muro, o chiuse dentro il vano
      const pers = a.persiane ?? (a.tipo === 'finestra' ? (caso() < 0.72 ? 'aperte' : 'chiuse') : null)
      const w = s1 - s0
      if (pers === 'aperte') {
        for (const [p0, p1] of [[s0 - w / 2, s0], [s1, s1 + w / 2]]) {
          pz.quad('persiana', P(p0, a.y0, -0.03), P(p1, a.y0, -0.03), P(p1, a.y1, -0.03), P(p0, a.y1, -0.03), n, [[0, 0], [1, 0], [1, 1], [0, 1]])
        }
      } else if (pers === 'chiuse') {
        pz.quad('persiana', P(s0, a.y0, 0.05), P(s1, a.y0, 0.05), P(s1, a.y1, 0.05), P(s0, a.y1, 0.05), n, [[0, 0], [2, 0], [2, 1], [0, 1]])
      }
      // il davanzale in mattoni
      if (a.y0 > 0.3) {
        const d0 = 0.07
        const q = (s, y, k) => P(s, y, k)
        pz.quad('mattone', q(s0 - 0.06, a.y0, -d0), q(s1 + 0.06, a.y0, -d0), q(s1 + 0.06, a.y0, sp * 0.5), q(s0 - 0.06, a.y0, sp * 0.5), [0, 1, 0], [[0, 0], [w, 0], [w, 0.2], [0, 0.2]])
        pz.quad('mattone', q(s0 - 0.06, a.y0 - 0.08, -d0), q(s1 + 0.06, a.y0 - 0.08, -d0), q(s1 + 0.06, a.y0, -d0), q(s0 - 0.06, a.y0, -d0), n, [[0, 0], [w, 0], [w, 0.08], [0, 0.08]])
      }
      return
    }
    // porte e portoni: verde scuro, la porta ad arco aperta lascia vedere il buio dentro
    const aperta = a.aperta ?? false
    const mat = aperta ? 'scuro' : 'porta'
    const top = (s, y) => [(s - s0) / (s1 - s0) * (s1 - s0) / 1.0, y / 1.0]
    pz.piano(mat, contorno, [], dentro(aperta ? sp - 0.02 : rientro), n, top)
    if (a.tipo === 'portone' && !aperta) telaietto(P, n, (s0 + s1) / 2 - 0.03, (s0 + s1) / 2 + 0.03, a.y0, a.y1, rientro - 0.02, 'fascia')
  }
  function telaietto(P, n, s0, s1, y0, y1, k, mat = 'telaio') {
    pz.quad(mat, P(s0, y0, k), P(s1, y0, k), P(s1, y1, k), P(s0, y1, k), n, [[0, 0], [1, 0], [1, 1], [0, 1]])
  }

  // ── il tetto a capanna, colmo lungo u: coppi sopra, legno sotto, fascia scura sui bordi, gronda e pluviali ──
  function tetto({ u0, u1, v0, v1, h, og0, og1, ov, modiglioni, pluviali }) {
    const vc = (v0 + v1) / 2, spess = 0.24
    const U0 = u0 - og0, U1 = u1 + og1
    const yS = (v) => h + (Math.min(v - v0, v1 - v)) * TAN // sotto il tetto, a quota v
    const vE0 = v0 - ov, vE1 = v1 + ov
    const yE = yS(vE0) // (negativo: la gronda scende sotto la quota del muro)
    const yC = yS(vc)
    const lungo = (vc - vE0) / Math.cos(PEND)
    for (const [ve, segno] of [[vE0, -1], [vE1, 1]]) {
      const nTop = norm(T.d(0, Math.cos(PEND), segno * Math.sin(PEND)))
      const nSot = [-nTop[0], -nTop[1], -nTop[2]]
      const a = T.p(U0, yE + spess, ve), b = T.p(U1, yE + spess, ve), c = T.p(U1, yC + spess, vc), d = T.p(U0, yC + spess, vc)
      const du = U1 - U0
      // uv dei coppi: u lungo la gronda, v giù per la falda (metri)
      pz.quad('coppi', a, b, c, d, nTop, [[0, lungo], [du, lungo], [du, 0], [0, 0]])
      pz.quad('sottotetto', T.p(U0, yE, ve), T.p(U1, yE, ve), T.p(U1, yC, vc), T.p(U0, yC, vc), nSot, [[0, 0], [du, 0], [du, lungo], [0, lungo]])
      // la fascia lungo la gronda
      pz.quad('fascia', T.p(U0, yE - 0.04, ve), T.p(U1, yE - 0.04, ve), T.p(U1, yE + spess, ve), T.p(U0, yE + spess, ve), T.d(0, 0, segno), [[0, 0], [du, 0], [du, 0.3], [0, 0.3]])
      // la gronda (canale) e i pluviali
      const vg = ve + segno * 0.09
      pz.scatola('gronda', T, U0 + 0.04, U1 - 0.04, yE - 0.13, yE + 0.02, Math.min(vg, ve + segno * 0.17), Math.max(vg, ve + segno * 0.17) - 0.0001)
      if (pluviali) {
        for (const up of [U0 + 0.35, U1 - 0.35]) {
          const muroV = (segno < 0 ? v0 : v1) + segno * 0.07
          const uw = Math.max(u0 + 0.3, Math.min(u1 - 0.3, up))
          const p1 = T.p(up, yE - 0.1, ve + segno * 0.12), p2 = T.p(uw, yE - 0.55, muroV + segno * 0.05), p3 = T.p(uw, 0.12, muroV + segno * 0.05)
          pz.tubo('gronda', p1, p2, 0.05, 0.05, 6)
          pz.tubo('gronda', p2, p3, 0.05, 0.05, 6)
          pz.tubo('gronda', p3, T.p(uw, 0.02, muroV + segno * 0.2), 0.05, 0.06, 6)
        }
      }
      // i modiglioni sotto la sporgenza, a passo regolare
      if (modiglioni) {
        const n = Math.max(2, Math.round((u1 - u0) / modiglioni))
        const vw = segno < 0 ? v0 : v1
        for (let k = 0; k <= n; k++) {
          const u = u0 + 0.35 + ((u1 - u0 - 0.7) * k) / n
          const yTop = yS(vw - segno * 0.0)
          const lungoM = ov - 0.1
          const vA = vw, vB = vw + segno * lungoM
          pz.scatola('cemento', T, u - 0.12, u + 0.12, yTop - 0.24, yTop, Math.min(vA, vB), Math.max(vA, vB), { senza: segno < 0 ? 'r' : 'd' })
          const vC = vw + segno * lungoM * 0.45
          pz.scatola('cemento', T, u - 0.12, u + 0.12, yTop - 0.46, yTop - 0.24, Math.min(vA, vC), Math.max(vA, vC), { senza: segno < 0 ? 'r' : 'd' })
        }
      }
    }
    // le teste del tetto (timpani): la fascia inclinata
    for (const [u, segno, og] of [[U0, -1, og0], [U1, 1, og1]]) {
      if (og <= 0.01) continue
      for (const ve of [vE0, vE1]) {
        pz.quad('fascia', T.p(u, yE - 0.04, ve), T.p(u, yC - 0.04, vc), T.p(u, yC + spess, vc), T.p(u, yE + spess, ve), T.d(segno, 0, 0), [[0, 0], [1, 0], [1, 0.3], [0, 0.3]])
      }
    }
    // il colmo: una fila di coppi più scuri
    pz.scatola('colmo', T, U0, U1, yC + spess - 0.04, yC + spess + 0.13, vc - 0.17, vc + 0.17)
  }

  // ═══════════════ LA CASA ═══════════════
  const H = 6.5 // gronda del corpo centrale
  const vP = -2.64 // il fronte delle ali e il muro di fondo del portico
  const imp = 3.6 // l'imposta degli archi del portico
  // le tre arcate del fronte (pilastri d'angolo 0,8 in mattoni fino all'imposta, centrali 0,7 in cemento)
  const luce = (16.24 - 0.8 * 2 - 0.7 * 2) / 3
  const archiFronte = [0, 1, 2].map((k) => { const s0 = -8.12 + 0.8 + k * (luce + 0.7); return F('d', s0 + luce / 2, luce, 0, imp, 'arco') })
  const luceLato = (-8.58 + 0.8) - (vP - 0.7) // (negativo: la si gira sotto)
  const archiLato = [F('o', ((-8.58 + 0.8) + (vP - 0.7)) / 2, Math.abs(luceLato), 0, imp, 'arco'), F('e', ((-8.58 + 0.8) + (vP - 0.7)) / 2, Math.abs(luceLato), 0, imp, 'arco')]
  blocco({
    u0: -8.12, u1: 8.12, v0: -8.58, v1: 8.58, h: H, spessori: { d: 0.7, o: 0.7, e: 0.7 },
    aperture: [
      ...archiFronte, ...archiLato,
      // il retro: due finestre e il portone giù, tre finestre su
      F('r', -5.2, 1.2, 0.9, 2.4), F('r', 0, 3.0, 0, 3.1, 'portone'), F('r', 5.2, 1.2, 0.9, 2.4),
      F('r', -5.2, 1.2, 3.95, 5.35), F('r', 0, 1.2, 3.95, 5.35), F('r', 5.2, 1.2, 3.95, 5.35),
    ],
  })
  // il muro di fondo del portico (la facciata della casa sotto il portico), fino sotto il tetto
  {
    const yTop = H + (vP - -8.58) * TAN - 0.02
    const A = T.p(-8.12 + 0.69, 0, vP), B = T.p(8.12 - 0.69, 0, vP)
    const L = 16.24 - 1.38
    const s = (u) => u - (-8.12 + 0.69)
    const aps = [
      { a: F('d', 0, 2.6, 0, 3.0, 'vetrata', { accesa: true }) },
      { a: F('d', -4.6, 1.2, 0.95, 2.45) }, { a: F('d', 4.6, 1.2, 0.95, 2.45) },
      { a: F('d', -6.55, 1.0, 3.32, 5.6, 'porta') }, { a: F('d', -2.6, 1.2, 4.0, 5.4) }, { a: F('d', 2.6, 1.2, 4.0, 5.4) }, { a: F('d', 5.6, 1.2, 4.0, 5.4) },
    ].map(({ a }) => { const s0 = s(a.c) - a.w / 2, s1 = s(a.c) + a.w / 2; return { a, s0, s1, contorno: rettangolo(s0, s1, a.y0, a.y1) } })
    const m = muro(pz, { A: [A[0], A[2]], B: [B[0], B[2]], spessore: 0.3, profilo: [[0, -0.4], [L, -0.4], [L, yTop], [0, yTop]], aperture: aps, mat: 'cemento', matDentro: 'cementoDentro' })
    for (const ap of aps) riempi(m, ap, 0.3)
    luci.push({ p: T.p(0, 3.35, vP - 0.25) })
  }
  // il pavimento del portico, in cotto
  pz.scatola('cotto', T, -8.12, 8.12, 0, 0.06, -8.58, vP, { senza: 'g' })
  // i pilastri in mattoni: i due d'angolo del fronte e i due in fondo agli archi laterali, fino all'imposta, con il cappello
  for (const [ua, ub, va, vb] of [[-8.16, -7.28, -8.62, -7.74], [7.28, 8.16, -8.62, -7.74], [-8.16, -7.4, vP - 0.74, vP], [7.4, 8.16, vP - 0.74, vP]]) {
    pz.scatola('mattone', T, ua, ub, 0, imp - 0.12, va, vb, { senza: 'g' })
    pz.scatola('cemento', T, ua - 0.04, ub + 0.04, imp - 0.12, imp + 0.02, va - 0.04, vb + 0.04, { senza: 'g' })
  }
  // la scala di ferro sotto il portico, contro la facciata: dal centro sale verso ovest fino al pianerottolo
  {
    const gradini = 18, uA = -1.0, uB = -5.95, alto = 3.3, vA = vP - 1.15, vB = vP - 0.02
    for (let k = 0; k < gradini; k++) {
      const u = uA + ((uB - uA) * k) / gradini, y = (alto * (k + 1)) / gradini
      pz.scatola('metallo', T, u + (uB - uA) / gradini, u, y - 0.04, y, vA, vB)
    }
    pz.scatola('metallo', T, -7.45, uB, alto - 0.08, alto, vA - 0.1, vB)
    // il cosciale e la ringhiera
    pz.tubo('metallo', T.p(uA, 0.1, vA), T.p(uB, alto, vA), 0.06, 0.06, 4)
    pz.tubo('metallo', T.p(uA, 1.0, vA), T.p(uB, alto + 1.0, vA), 0.025, 0.025, 5)
    pz.tubo('metallo', T.p(uB, alto + 1.0, vA), T.p(-7.45, alto + 1.0, vA - 0.1), 0.025, 0.025, 5)
    for (let k = 0; k <= 9; k++) { const t = k / 9, u = uA + (uB - uA) * t, y = alto * t; pz.tubo('metallo', T.p(u, y, vA), T.p(u, y + 1.0, vA), 0.015, 0.015, 4) }
    for (const u of [uB, -6.7, -7.45]) pz.tubo('metallo', T.p(u, 0, vA - 0.1), T.p(u, alto, vA - 0.1), 0.04, 0.04, 4)
  }
  // il comignolo in mattoni sul timpano est, accanto all'ala bassa
  pz.scatola('mattone', T, 8.12, 8.74, 0, 9.45, vP - 0.7, vP - 0.02, { senza: 'g' })
  pz.scatola('cemento', T, 8.06, 8.8, 9.45, 9.6, vP - 0.76, vP + 0.04)
  pz.scatola('coppi', T, 8.1, 8.76, 9.78, 9.86, vP - 0.74, vP)
  for (const [ua, ub] of [[8.12, 8.24], [8.62, 8.74]]) pz.scatola('mattone', T, ua, ub, 9.6, 9.78, vP - 0.7, vP - 0.02, { senza: 'g' })
  // i pilastri d'angolo in mattoni sul retro del corpo centrale
  for (const [ua, ub] of [[-8.16, -7.66], [7.66, 8.16]]) pz.scatola('mattone', T, ua, ub, 0, H - 0.05, 8.08, 8.62, { senza: 'g' })

  // l'ala ovest: due piani, i pilastri d'angolo in mattoni, il pergolato sul lato corto
  const HO = 5.9
  blocco({
    u0: -14.21, u1: -8.12, v0: vP, v1: 7.51, h: HO, senza: 'e', og1: 0,
    aperture: [
      F('d', -13.15, 1.0, 0.9, 2.3), F('d', -11.55, 1.0, 0, 2.4, 'porta'), F('d', -9.75, 1.1, 0, 2.0, 'lunetta', { tipo: 'porta', arcata: true, aperta: true }),
      F('d', -12.75, 1.0, 3.45, 4.85), F('d', -10.0, 1.0, 3.45, 4.85),
      F('o', -0.3, 1.1, 0.9, 2.3), F('o', 4.6, 1.1, 0, 2.4, 'porta'), F('o', -0.3, 1.1, 3.45, 4.85), F('o', 4.6, 1.1, 3.45, 4.85),
      F('r', -11.2, 1.1, 0.9, 2.3), F('r', -11.2, 1.1, 3.45, 4.85),
    ],
  })
  for (const [ua, ub, va, vb] of [[-14.25, -13.72, vP - 0.04, vP + 0.5], [-14.25, -13.72, 7.01, 7.55]]) pz.scatola('mattone', T, ua, ub, 0, HO - 0.04, va, vb, { senza: 'g' })
  luci.push({ p: T.p(-11.55, 2.65, vP - 0.22) })

  // l'ala est: un piano, porta ad arco e finestra davanti, finestra-porta-finestra sul lato corto
  const HE = 3.7
  blocco({
    u0: 8.12, u1: 14.21, v0: vP, v1: 7.51, h: HE, senza: 'o', og0: 0, modiglioni: 2.2,
    aperture: [
      F('d', 9.75, 1.1, 0, 1.85, 'lunetta', { tipo: 'porta', arcata: true }), F('d', 12.55, 1.2, 1.0, 2.3),
      F('e', -0.5, 1.1, 1.0, 2.3), F('e', 3.1, 1.1, 0, 1.85, 'lunetta', { tipo: 'porta', arcata: true }), F('e', 5.9, 1.1, 1.0, 2.3),
      F('r', 11.2, 1.1, 1.0, 2.3),
    ],
  })
  luci.push({ p: T.p(9.75, 2.6, vP - 0.22) })

  // ═══════════════ IL CAPANNONE ═══════════════
  const vC0 = -30.04, vC1 = -19.89, HC = 4.4
  blocco({
    u0: -8.12, u1: 8.12, v0: vC0, v1: vC1, h: HC, dentro: 'scuro', modiglioni: 3.1,
    aperture: [
      ...[-6.1, -2.05, 2.05, 6.1].map((u) => F('d', u, 1.5, 1.75, 2.4, 'lunetta', { accesa: false })),
      F('r', -5.6, 1.5, 1.75, 2.4, 'lunetta', { accesa: false }), F('r', -1.7, 1.5, 1.75, 2.4, 'lunetta', { accesa: false }),
      F('r', 4.3, 3.7, 0, 2.15, 'arco'),
      F('o', -26.4, 2.5, 0.95, 2.15, 'lunetta', { accesa: false }), F('o', -22.3, 1.3, 1.6, 2.3, 'lunetta', { accesa: false }),
      F('e', -22.9, 1.4, 0, 2.5, 'porta'), F('e', -27.4, 1.3, 1.6, 2.3, 'lunetta', { accesa: false }),
    ],
  })
  pz.scatola('scuro', T, -7.85, 7.85, 0, 0.04, vC0 + 0.3, vC1 - 0.3, { senza: 'g' })
  // i pannelli fotovoltaici sulla falda a sud (davanti, verso -v): due file da dodici
  const pannelli = []
  {
    const lungoP = 1.65, largoP = 1.0, file = 2, perFila = 12
    for (let f = 0; f < file; f++) for (let k = 0; k < perFila; k++) {
      const u = -6.05 + k * (largoP + 0.02)
      const d0 = 1.45 + f * (lungoP + 0.03) // distanza dalla gronda, lungo la falda
      const vA = vC0 - 0.62 + d0 * Math.cos(PEND), vB = vA + lungoP * Math.cos(PEND)
      const yA = HC - 0.62 * TAN + 0.24 + d0 * Math.sin(PEND) + 0.05, yB = yA + lungoP * Math.sin(PEND)
      const n = norm(T.d(0, Math.cos(PEND), -Math.sin(PEND)))
      pz.quad('pannello', T.p(u, yA, vA), T.p(u + largoP, yA, vA), T.p(u + largoP, yB, vB), T.p(u, yB, vB), n, [[0, 1], [1, 1], [1, 0], [0, 0]])
      // il bordo d'alluminio (spessore)
      pz.quad('telaioChiaro', T.p(u, yA - 0.05, vA), T.p(u + largoP, yA - 0.05, vA), T.p(u + largoP, yA, vA), T.p(u, yA, vA), norm(T.d(0, 0, -1)))
      pannelli.push(T.p(u + 0.5, yA, vA))
    }
  }

  // il casotto accanto al capannone (3 × 2,6 m)
  {
    const cu = -10.65, cv = -23.3
    blocco({ u0: cu - 1.3, u1: cu + 1.3, v0: cv - 1.5, v1: cv + 1.5, h: 2.45, ov: 0.35, og0: 0.3, og1: 0.3, modiglioni: 0, pluviali: false, dentro: 'scuro', aperture: [F('r', cu, 0.9, 0, 2.05, 'porta')] })
  }

  return { pz, T, luci, finestre, pannelli }
}
