// «Dove vivo» · i fabbricati come poligoni 3D, con le misure del CAD (25 novembre 2026, sera: «intanto disegnamo solo i
// fabbricati come poligoni 3d dandoti le misure su cad»).
//
// La fonte è «2025-10-07 - DISEGNO - Soc. Agr. Cascina Fontana - Pianta dei fabbricati per l'IMU, pulita.dwg» in
// D:\pecchini\01 Cascina Fontana (società)\2025\Disegni (la copia in DXF è riferimenti/lotto/pulita.dxf). È in centimetri
// e ha tre tavole: il piano terra della casa, il piano primo (disegnato 44,36 m più a destra) e la rimessa agricola con la
// sezione del tetto. Qui sotto i numeri sono quelli del CAD, così si controllano a colpo d'occhio: U() e V() li portano
// nel telaio della casa (u lungo il lato lungo, v di traverso, in metri, origine al centro del corpo centrale col portico).
//
// Superfici piane a tinta unita, niente texture dipinte. Il CAD dà le piante, i pilastri, le finestre e le porte; non dà
// le altezze della casa: quelle (e gli archi del portico) vengono dal modello di prima, letto dalle foto, e stanno tutte in
// ALTEZZE. La rimessa invece ha la sua sezione: gronde, colmo e pendenza sono quelli del CAD.
import { Pezzi, telaio, muro, arco, rettangolo, RAD, norm } from './geo.js'

export const ANGOLO = 0.33117 // il lato lungo, da est verso nord (dal rilievo: 18,97°)

// ── dal CAD (centimetri) al telaio della casa (metri) ──
const XC = 12858, YC = 16561 // il centro del corpo centrale, portico compreso: (12058 + 13658) / 2, (15721 + 17401) / 2
const U = (x) => (x - XC) / 100
const V = (y) => (y - YC) / 100
const P1 = 4436 // la tavola del piano primo sta 44,36 m più a destra: x del piano primo − P1 = x del piano terra
// la rimessa ha la sua tavola: centro (20736, 17036). Nel lotto sta dove la mette il rilievo, col centro a v = −24,965
const UR = (x) => (x - 20736) / 100
const VR = (y) => (y - 17036) / 100 - 24.965

// ── quello che il CAD non dice: le altezze della casa (dal modello di prima, letto dalle foto) ──
export const ALTEZZE = {
  grondaCentro: 6.5, // corpo centrale col portico
  grondaOvest: 5.9, // ala ovest, due piani
  grondaEst: 3.6, // ala est, un piano
  pendenza: 18, // gradi, i tetti della casa
  solaio: 3.1, // il pavimento del piano primo
  imposta: 3.6, // dove partono gli archi del portico
  finestraPT: [0.95, 2.35], // davanzale e architrave delle finestre del piano terra
  finestraP1: [4.05, 5.35],
  porta: 2.4,
}
// la rimessa, dalla sezione del CAD: pavimento 16574, colmo (sotto) 17082 → 5,08 m; falde al 27,94 % (15,6°); il colmo
// sta a 3,70 m dal muro verso la casa (gronda 4,05 m) e a 6,30 m da quello verso i campi (gronda 3,32 m)
const RIMESSA = { colmo: 5.08, tan: 0.2794, dalNord: 3.7 }

// le sagome a terra (x est, y nord): servono al terreno (l'ombra sotto i muri) e a non piantare alberi dentro
const CA = Math.cos(ANGOLO), SA = Math.sin(ANGOLO)
const xy = ([u, v]) => [+(u * CA - v * SA).toFixed(2), +(u * SA + v * CA).toFixed(2)]
export const IMPRONTE = {
  casa: [
    [U(11458), V(16296)], [U(12058), V(16296)], [U(12058), V(15721)], [U(13658), V(15721)], [U(13658), V(16296)],
    [U(14258), V(16296)], [U(14258), V(17296)], [U(13658), V(17296)], [U(13658), V(17401)], [U(12058), V(17401)],
    [U(12058), V(17296)], [U(11458), V(17296)],
  ].map(xy),
  capannone: [[UR(19936), VR(16536)], [UR(21536), VR(16536)], [UR(21536), VR(17536)], [UR(19936), VR(17536)]].map(xy),
}

export function costruisciFabbricati() {
  const T = telaio(0, 0, ANGOLO)
  const pz = new Pezzi()
  const luci = [] // dove la sera c'è una lanterna: { p: [x, y, z] }
  const pannelli = []
  const A = ALTEZZE, TAN = Math.tan(A.pendenza * RAD)
  let seme = 11
  const caso = () => { seme = (seme * 16807) % 2147483647; return seme / 2147483647 }

  // un'apertura fra due coordinate del telaio (u sui lati d e r, v sui lati o ed e)
  // tipo: finestra · porta · portone · lunetta (finestra ad arco) · arco (vano aperto ad arco) · vano (aperto)
  const ap = (t0, t1, y0, y1, tipo = 'finestra', extra = {}) => ({ t0: Math.min(t0, t1), t1: Math.max(t0, t1), y0, y1, tipo, ...extra })
  const fPT = (t0, t1, extra) => ap(t0, t1, A.finestraPT[0], A.finestraPT[1], 'finestra', extra)
  const fP1 = (t0, t1, extra) => ap(t0, t1, A.finestraP1[0], A.finestraP1[1], 'finestra', extra)
  const porta = (t0, t1, extra) => ap(t0, t1, 0, A.porta, 'porta', extra)

  // ── un muro dritto. lato: d (la faccia esterna guarda verso −v), r (+v), o (−u), e (+u); fisso = la u o la v della
  // faccia esterna; da → a = dove comincia e finisce (u per d e r, v per o ed e); cima(t) = l'altezza in cima, colmo = la
  // t dove la cima fa la punta (i timpani) ──
  function parete({ lato, fisso, da, a, sp = 0.3, cima, colmo = null, aperture = [], persiane = false }) {
    const lungo = lato === 'd' || lato === 'r'
    // (A e B a terra, con «fuori» a destra andando da A a B)
    const tA = lato === 'd' || lato === 'e' ? da : a, tB = tA === da ? a : da
    const pt = (t) => { const p = lungo ? T.p(t, 0, fisso) : T.p(fisso, 0, t); return [p[0], p[2]] }
    const s = (t) => Math.abs(t - tA)
    const L = Math.abs(a - da)
    const alto = typeof cima === 'function' ? cima : () => cima
    const cime = [tB, ...(colmo !== null && colmo > Math.min(da, a) && colmo < Math.max(da, a) ? [colmo] : []), tA]
    const profilo = [[0, -0.3], [L, -0.3], ...cime.map((t) => [s(t), alto(t)])]
    const aps = aperture.map((x) => {
      const s0 = Math.min(s(x.t0), s(x.t1)), s1 = Math.max(s(x.t0), s(x.t1))
      const tondo = x.tipo === 'lunetta' || x.tipo === 'arco'
      return { a: x, s0, s1, contorno: tondo ? arco(s0, s1, x.y0, x.y1, 20) : rettangolo(s0, s1, x.y0, x.y1) }
    })
    const m = muro(pz, { A: pt(tA), B: pt(tB), fuori: 1, spessore: sp, profilo, aperture: aps, mat: 'pMuro', matDentro: 'pDentro', matSguincio: 'pMuro' })
    for (const x of aps) riempi(m, x, sp, persiane)
    return m
  }

  // ── dentro un'apertura: il vetro (la sera alcuni si accendono), la porta verde scuro, il davanzale, le persiane aperte ──
  function riempi({ P, n }, { a, s0, s1, contorno }, sp, persiane) {
    if (a.tipo === 'arco' || a.tipo === 'vano') return
    if (a.tipo === 'porta' || a.tipo === 'portone') { pz.piano('pPorta', contorno, [], (s, y) => P(s, y, 0.09), n); return }
    const accesa = a.accesa ?? caso() < 0.5
    pz.piano(accesa ? 'vetroAcceso' : 'vetro', contorno, [], (s, y) => P(s, y, 0.13), n)
    const w = s1 - s0
    if (a.y0 > 0.3) {
      // il davanzale: una lastra che sporge di 6 cm
      pz.quad('pDavanzale', P(s0 - 0.05, a.y0, -0.06), P(s1 + 0.05, a.y0, -0.06), P(s1 + 0.05, a.y0, sp * 0.5), P(s0 - 0.05, a.y0, sp * 0.5), [0, 1, 0])
      pz.quad('pDavanzale', P(s0 - 0.05, a.y0 - 0.06, -0.06), P(s1 + 0.05, a.y0 - 0.06, -0.06), P(s1 + 0.05, a.y0, -0.06), P(s0 - 0.05, a.y0, -0.06), n)
    }
    if (persiane && a.tipo === 'finestra') {
      for (const [p0, p1] of [[s0 - w / 2, s0], [s1, s1 + w / 2]]) pz.quad('pPersiana', P(p0, a.y0, -0.03), P(p1, a.y0, -0.03), P(p1, a.y1, -0.03), P(p0, a.y1, -0.03), n)
    }
  }

  // ── un tetto a due falde col colmo lungo u: dalla u0 alla u1, gronde sopra le facce v0 e v1, colmo in vc a quota yc
  // (il sotto del tetto). Sporgenze: og0 e og1 sui timpani, ov0 e ov1 in gronda ──
  function tetto({ u0, u1, v0, v1, vc, yc, tan, og0 = 0.4, og1 = 0.4, ov0 = 0.55, ov1 = 0.55, sp = 0.22 }) {
    const y = (v) => yc - Math.abs(v - vc) * tan
    const U0 = u0 - og0, U1 = u1 + og1, pend = Math.atan(tan)
    for (const [ve, segno] of [[v0 - ov0, -1], [v1 + ov1, 1]]) {
      const su = norm(T.d(0, Math.cos(pend), segno * Math.sin(pend)))
      pz.quad('pTetto', T.p(U0, y(ve) + sp, ve), T.p(U1, y(ve) + sp, ve), T.p(U1, yc + sp, vc), T.p(U0, yc + sp, vc), su)
      pz.quad('pSotto', T.p(U0, y(ve), ve), T.p(U1, y(ve), ve), T.p(U1, yc, vc), T.p(U0, yc, vc), [-su[0], -su[1], -su[2]])
      // i bordi: lungo la gronda e sulle due teste
      pz.quad('pFascia', T.p(U0, y(ve), ve), T.p(U1, y(ve), ve), T.p(U1, y(ve) + sp, ve), T.p(U0, y(ve) + sp, ve), T.d(0, 0, segno))
      for (const [u, verso] of [[U0, -1], [U1, 1]]) pz.quad('pFascia', T.p(u, y(ve), ve), T.p(u, yc, vc), T.p(u, yc + sp, vc), T.p(u, y(ve) + sp, ve), T.d(verso, 0, 0))
    }
    pz.scatola('pColmo', T, U0, U1, yc + sp - 0.03, yc + sp + 0.1, vc - 0.15, vc + 0.15)
    return y
  }
  // un pilastro in mattoni (2 cm fuori dal muro, così non si pesta con l'intonaco)
  const pilastro = (u0, u1, v0, v1, y1) => pz.scatola('pMattone', T, u0 - 0.02, u1 + 0.02, 0, y1, v0 - 0.02, v1 + 0.02, { senza: 'g' })

  // ═══════════════ LA CASA ═══════════════
  // corpo centrale: u da U(12058) a U(13658) (16,00 m), v da V(15721) (il fronte del portico) a V(17401) (17,80 m)
  const cu0 = U(12058), cu1 = U(13658), cv0 = V(15721), cv1 = V(17401), cvc = (cv0 + cv1) / 2
  const cyc = A.grondaCentro + ((cv1 - cv0) / 2) * TAN
  const yC = tetto({ u0: cu0, u1: cu1, v0: cv0, v1: cv1, vc: cvc, yc: cyc, tan: TAN, ov0: 0.6, ov1: 0.6 })
  // il fronte del portico: tre arcate fra i quattro pilastri da 50 × 50 (12068, 12583, 13083, 13598)
  parete({
    lato: 'd', fisso: cv0, da: cu0, a: cu1, sp: 0.5, cima: A.grondaCentro,
    aperture: [ap(U(12118), U(12583), 0, A.imposta, 'arco'), ap(U(12633), U(13083), 0, A.imposta, 'arco'), ap(U(13133), U(13598), 0, A.imposta, 'arco')],
  })
  for (const [x0, x1] of [[12058, 12118], [12583, 12633], [13083, 13133], [13598, 13658]]) pilastro(U(x0), U(x1), cv0, V(15771), A.imposta)
  // i fianchi: timpani pieni fino al colmo; sotto il portico l'arco laterale, dal pilastro (15771) alla spalla (16181)
  for (const [lato, fisso] of [['o', cu0], ['e', cu1]]) {
    parete({ lato, fisso, da: cv0, a: cv1, sp: 0.4, cima: yC, colmo: cvc, aperture: [ap(V(15771), V(16181), 0, A.imposta, 'arco')] })
  }
  // le spalle in fondo agli archi laterali (70 cm, fino al tetto) con il pilastro in mattoni fino all'imposta
  for (const [x0, x1] of [[12058, 12128], [13588, 13658]]) {
    const ua = U(x0) + (x0 === 12058 ? 0.01 : 0), ub = U(x1) - (x0 === 12058 ? 0 : 0.01)
    pz.scatola('pMuro', T, ua, ub, 0, yC(V(16181)), V(16181) + 0.01, V(16341), { senza: 'g' })
    pilastro(U(x0), U(x1), V(16181), V(16181) + 0.5, A.imposta)
  }
  // la facciata sotto il portico (16341): finestra, portone, finestra al piano terra; sopra, il piano primo è aperto
  // sul portico (nel CAD lì non c'è muro)
  parete({
    lato: 'd', fisso: V(16341), da: U(12128), a: U(13588), sp: 0.3, cima: A.solaio - 0.25,
    aperture: [ap(U(12208), U(12508), 1.0, 2.5), ap(U(12704), U(13012), 0, 2.6, 'portone'), ap(U(13208), U(13508), 1.0, 2.5)],
  })
  pz.scatola('pSolaio', T, cu0 + 0.4, cu1 - 0.4, A.solaio - 0.25, A.solaio, V(16341) - 0.02, cv1 - 0.3)
  luci.push({ p: T.p(0, 2.72, V(16341) - 0.22) })
  // il pavimento del portico
  pz.scatola('pCotto', T, cu0 + 0.4, cu1 - 0.4, 0, 0.05, cv0 + 0.5, V(16341), { senza: 'g' })
  // il retro (17401): finestra, portone da 4,08 m, finestra; sopra tre finestre da 3 m
  parete({
    lato: 'r', fisso: cv1, da: cu0, a: cu1, sp: 0.3, cima: A.grondaCentro, persiane: false,
    aperture: [
      ap(U(12208), U(12508), 1.0, 2.6), ap(U(12654), U(13062), 0, 3.0, 'portone'), ap(U(13208), U(13508), 1.0, 2.6),
      ap(U(16644 - P1), U(16944 - P1), 4.2, 5.5), ap(U(17144 - P1), U(17444 - P1), 4.2, 5.5), ap(U(17644 - P1), U(17944 - P1), 4.2, 5.5),
    ],
  })
  // gli spigoli del retro in mattoni (i pilastri 12068 e 13598, a tutta altezza)
  for (const [x0, x1] of [[12058, 12118], [13598, 13658]]) pilastro(U(x0), U(x1), V(17341), cv1, A.grondaCentro - 0.05)

  // l'ala ovest: u da U(11458) a U(12058) (6,00 m), v da V(16296) a V(17296) (10,00 m), due piani
  {
    const u0 = U(11458), u1 = cu0, v0 = V(16296), v1 = V(17296), vc = (v0 + v1) / 2, h = A.grondaOvest
    const y = tetto({ u0, u1, v0, v1, vc, yc: h + ((v1 - v0) / 2) * TAN, tan: TAN, og1: 0 })
    parete({
      lato: 'd', fisso: v0, da: u0, a: u1, sp: 0.4, cima: h, persiane: true,
      aperture: [fPT(U(11578), U(11698)), porta(U(11810), U(11938)), fP1(U(16014 - P1), U(16134 - P1)), fP1(U(16254 - P1), U(16374 - P1))],
    })
    parete({
      lato: 'o', fisso: u0, da: v0, a: v1, sp: 0.4, cima: y, colmo: vc, persiane: true,
      aperture: [fPT(V(16746), V(16846)), porta(V(17016), V(17126)), fP1(V(16746), V(16846))],
    })
    parete({
      lato: 'r', fisso: v1, da: u0, a: u1, sp: 0.4, cima: h, persiane: true,
      aperture: [fPT(U(11818), U(11938)), fP1(U(16014 - P1), U(16134 - P1)), fP1(U(16254 - P1), U(16374 - P1))],
    })
    // gli spigoli in mattoni (le foto) sui pilastri del CAD (11488)
    for (const [va, vb] of [[v0, v0 + 0.5], [v1 - 0.5, v1]]) pilastro(u0, u0 + 0.5, va, vb, h - 0.04)
    luci.push({ p: T.p((U(11810) + U(11938)) / 2 - 0.95, 2.65, v0 - 0.22) })
  }

  // l'ala est: u da U(13658) a U(14258), v da V(16296) a V(17296), un piano
  {
    const u0 = cu1, u1 = U(14258), v0 = V(16296), v1 = V(17296), vc = (v0 + v1) / 2, h = A.grondaEst
    const y = tetto({ u0, u1, v0, v1, vc, yc: h + ((v1 - v0) / 2) * TAN, tan: TAN, og0: 0 })
    parete({ lato: 'd', fisso: v0, da: u0, a: u1, sp: 0.4, cima: h, persiane: true, aperture: [porta(U(13778), U(13906)), fPT(U(14018), U(14138))] })
    parete({ lato: 'e', fisso: u1, da: v0, a: v1, sp: 0.4, cima: y, colmo: vc, persiane: true, aperture: [fPT(V(16746), V(16846)), porta(V(17021), V(17121))] })
    parete({ lato: 'r', fisso: v1, da: u0, a: u1, sp: 0.4, cima: h, persiane: true, aperture: [fPT(U(13778), U(13898))] })
    luci.push({ p: T.p((U(13778) + U(13906)) / 2 + 0.95, 2.65, v0 - 0.22) })
  }

  // ═══════════════ LA RIMESSA AGRICOLA ═══════════════
  // pianta: u da UR(19936) a UR(21536) (16,00 m), v da VR(16536) (verso i campi) a VR(17536) (verso la casa), muri da 20
  {
    const u0 = UR(19936), u1 = UR(21536), v0 = VR(16536), v1 = VR(17536)
    const vc = v1 - RIMESSA.dalNord
    const y = tetto({ u0, u1, v0, v1, vc, yc: RIMESSA.colmo, tan: RIMESSA.tan, og0: 0.3, og1: 0.3, ov0: 0.5, ov1: 0.6, sp: 0.21 })
    // le finestre ad arco: i vuoti da 1,50 m nei muri del CAD
    const lunetta = (t0, t1) => ap(t0, t1, 1.6, 2.4, 'lunetta', { accesa: false })
    parete({ lato: 'd', fisso: v0, da: u0, a: u1, sp: 0.2, cima: y(v0), aperture: [lunetta(UR(20154), UR(20304)), lunetta(UR(20661), UR(20811)), lunetta(UR(21168), UR(21318))] })
    for (const [lato, fisso] of [['o', u0], ['e', u1]]) {
      parete({ lato, fisso, da: v0, a: v1, sp: 0.2, cima: y, colmo: vc, aperture: [lunetta(VR(16766), VR(16916)), ap(VR(17146), VR(17446), 0, 2.8, 'vano')] })
    }
    // verso la casa è aperta: quattro pilastri da 40 × 40 e la trave sopra
    parete({
      lato: 'r', fisso: v1, da: u0, a: u1, sp: 0.4, cima: y(v1),
      aperture: [ap(UR(19996), UR(20463), 0, 3.45, 'vano'), ap(UR(20503), UR(20969), 0, 3.45, 'vano'), ap(UR(21009), UR(21476), 0, 3.45, 'vano')],
    })
    pz.scatola('pDentro', T, u0 + 0.2, u1 - 0.2, 0, 0.03, v0 + 0.2, v1 - 0.4, { senza: 'g' })
    // i pannelli fotovoltaici sulla falda verso i campi: due file da dodici
    const pend = Math.atan(RIMESSA.tan), cs = Math.cos(pend), sn = Math.sin(pend)
    const giu = norm(T.d(0, cs, -sn))
    for (let f = 0; f < 2; f++) for (let k = 0; k < 12; k++) {
      const uA = -6.05 + k * 1.02, uB = uA + 1.0
      const d0 = 1.3 + f * 1.68 // dal filo del muro, lungo la falda
      const vA = v0 + d0 * cs, vB = vA + 1.65 * cs
      const yA = y(v0) + 0.21 + 0.05 + d0 * sn, yB = yA + 1.65 * sn
      pz.quad('pannello', T.p(uA, yA, vA), T.p(uB, yA, vA), T.p(uB, yB, vB), T.p(uA, yB, vB), giu, [[0, 1], [1, 1], [1, 0], [0, 0]])
      pz.quad('pFascia', T.p(uA, yA - 0.05, vA), T.p(uB, yA - 0.05, vA), T.p(uB, yA, vA), T.p(uA, yA, vA), norm(T.d(0, 0, -1)))
      pannelli.push(T.p(uA + 0.5, yA, vA))
    }
  }

  return { pz, T, luci, finestre: [], pannelli }
}
