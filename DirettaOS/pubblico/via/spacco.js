// Diretta OS · «sto spaccando la legna»: sotto la barchessa (i pilastri di mattoni, gli archi, la catasta), col ceppo
// davanti e la campagna di Mantova a destra. L'omino arriva con l'ascia, poi un ciocco alla volta: lo prende dal
// mucchio, lo mette sul ceppo, prende l'ascia, la alza… TOC! le due metà volano, le schegge, e finiscono sulla catasta
// che cresce. Ogni tanto l'ascia resta piantata nel ciocco («BLOCCATA!») e lo sbatte giù di nuovo; ogni tanto si
// asciuga la fronte. Col freddo si vede il fiato; pioggia e neve cadono fuori, non sotto il portico.
// Il tempo della scena parte da quando hai premuto il tasto.

import { W, H, tela, semi, ss, lin, R, linea, ellisse, fumetto, cielo, dipingiCielo, scintille, astro, nuvole, tingi, alone, creaTempo, ERBA, mescola } from './pixel.js'
import { pioppo, ciuffo } from './natura.js'
import { omino } from './omino.js'

const BASE = 222, ORIZZONTE = 172, FINE = 292 // il terreno, l'orizzonte, dove finisce la barchessa
const X = 312, CX = 330 // dove sta l'omino (i piedi) e il centro del ceppo
const CATASTA = [166, 262] // dentro il secondo arco
const INTRO = 3.6

// i tempi di un giro (da quando comincia): prende, mette, afferra, alza, cala, colpo, raccoglie, lancia, riposa, libera
const G = { prende: 0, mette: 1.1, afferra: 1.8, alza: 2.2, cala: 3.1, colpo: 3.24, raccoglie: 3.7, lancia: 4.4, riposa: 4.9, libera: 5.6, fine: 6.2 }
const BLOCCO = 1.6 // quanto dura in più un giro con l'ascia piantata nel ciocco

export function crea({ seme = 7, meteo = null } = {}) {
  const [c, g] = tela(), [cs, gs] = tela(), [fermo, gf] = tela(), [attori, ga] = tela()
  const tempo = creaTempo(seme)
  let chiave = '', C = null, met = meteo
  const r = semi(seme * 23 + 7)
  // i giri, decisi col seme: quando comincia ognuno e se l'ascia resta piantata
  const giri = []
  for (let t = INTRO, k = 0; t < 3 * 3600; k++) { const blocca = k > 1 && r() < 0.2; giri.push({ da: t, blocca, k }); t += G.fine + (blocca ? BLOCCO : 0) }
  const giroDi = (t) => { let i = 0, j = giri.length - 1; while (i < j) { const m = (i + j + 1) >> 1; if (giri[m].da <= t) i = m; else j = m - 1 } return giri[i] }
  const schegge = [], perTerra = []
  let ultimoColpo = -1

  // ── fermo: la barchessa, la campagna, il terreno; si rifà ogni minuto ──
  function prepara(adesso) {
    C = cielo(adesso, met)
    const q = semi(seme), st = C.stagione, neve = C.tempo === 'neve', nebbia = C.tempo === 'nebbia' ? 0.5 : 0, oriz = C.colori[2]
    dipingiCielo(gs, C, ORIZZONTE + 8, seme)
    gf.clearRect(0, 0, W, H)
    // la campagna a destra: i campi arati (o verdi), i pioppi, una cascina lontana
    const erba = ERBA[st].map((e) => (neve ? mescola(e, '#eef3f8', 0.85) : e))
    const arato = st === 'autunno' || st === 'inverno'
    for (let y = ORIZZONTE; y < BASE; y++) {
      const k = (y - ORIZZONTE) / (BASE - ORIZZONTE)
      R(gf, FINE, y, W - FINE, 1, mescola(mescola(arato && !neve ? '#7a6248' : erba[1], oriz, 0.45 * (1 - k) + nebbia * 0.3), arato && !neve ? '#5f4a36' : erba[2], k * 0.5))
      if (arato && !neve && y % 3 === 0) R(gf, FINE, y, W - FINE, 1, mescola('#6a5440', oriz, 0.35 * (1 - k)))
    }
    const pioppi = (st === 'inverno' ? ['#59604e', '#6b7260', '#7c836f'] : st === 'autunno' ? ['#a8862e', '#c6a23c', '#8a6f26'] : ['#3d6a33', '#4f8240', '#62964d']).map((x) => mescola(x, oriz, 0.45 + nebbia * 0.3))
    for (let x = FINE + 4; x < W + 10; x += 8 + Math.floor(q() * 7)) pioppo(gf, q, x, ORIZZONTE + 2, 18 + q() * 16, pioppi)
    const casc = mescola('#c8a070', oriz, 0.55); R(gf, 410, ORIZZONTE - 12, 30, 14, casc); for (let i = 0; i < 8; i++) R(gf, 408 + i, ORIZZONTE - 13 - i, 34 - i * 2, 1, mescola('#9a5040', oriz, 0.55))
    // il terreno battuto, con qualche ciuffo verso il campo
    for (let y = BASE; y < H; y++) R(gf, 0, y, W, 1, mescola(neve ? '#d9dfe6' : '#86705a', neve ? '#c4ccd6' : '#6c5846', (y - BASE) / (H - BASE)))
    for (let i = 0; i < 1100; i++) R(gf, q() * W, BASE + q() * (H - BASE), 1, 1, q() < 0.5 ? (neve ? '#eef2f6' : '#9a8268') : (neve ? '#b8c0ca' : '#5e4c3c'))
    for (let i = 0; i < 26; i++) ciuffo(gf, FINE + 30 + q() * 160, BASE + 2 + q() * 8, erba[2], 3 + Math.floor(q() * 3))
    // la barchessa: il tetto, i mattoni, due archi grandi col buio dentro
    for (let x = -4; x < FINE + 10; x += 6) { R(gf, x, 14, 6, 14, '#8a3e2a'); R(gf, x, 14, 6, 2, '#a85238'); R(gf, x + 5, 14, 1, 14, '#6a2e20') }
    R(gf, -4, 27, FINE + 14, 3, '#5a281a')
    if (neve) R(gf, -4, 11, FINE + 14, 4, '#f2f6fb')
    for (let y = 30; y < BASE; y += 4) for (let x = -10 + ((y / 4) % 2) * 5; x < FINE; x += 10) { R(gf, x, y, 10, 4, mescola('#a4523a', '#8a4430', q() * 0.6)); R(gf, x, y + 3, 10, 1, '#c9a88a'); R(gf, x + 9, y, 1, 4, '#c9a88a') }
    const arco = (x0, x1) => {
      const cx = (x0 + x1) / 2, rr = (x1 - x0) / 2, im = 100
      for (let y = im - rr; y < BASE; y++) {
        const dy = y - im, w = y < im ? Math.sqrt(Math.max(0, rr * rr - dy * dy)) : rr
        R(gf, cx - w, y, w * 2, 1, mescola('#1c120c', '#2e2016', (y - im + rr) / (BASE - im + rr)))
      }
      for (let a = Math.PI; a <= 2 * Math.PI; a += 0.04) R(gf, cx + Math.cos(a) * (rr + 1), im + Math.sin(a) * (rr + 1), 2, 2, '#c9a88a') // la cornice dell'arco
      // il muro di fondo, appena
      for (let y = im - rr + 20; y < BASE - 4; y += 6) for (let x = x0 + 6 + ((y / 6) % 2) * 6; x < x1 - 6; x += 12) R(gf, x, y, 11, 1, 'rgba(70,40,28,0.35)')
    }
    arco(18, 134); arco(156, 272)
    // nel primo arco la legna vecchia, tonda, impilata fino in alto; un rastrello appeso
    for (let row = 0; row < 9; row++) for (let i = 0; i < 9; i++) {
      const x = 30 + i * 11 + (row % 2) * 5, y = BASE - 6 - row * 9
      if (x > 124) continue
      ellisse(gf, x, y, 5, 4, '#4a3020'); ellisse(gf, x, y, 4, 3, mescola('#b08050', '#c89a68', q())); R(gf, x, y, 1, 1, '#8a6038')
    }
    linea(gf, 146, 40, 146, 96, 1, '#7a5a3a'); R(gf, 142, 94, 9, 2, '#6a6a70'); for (let i = 0; i < 5; i++) R(gf, 142 + i * 2, 96, 1, 3, '#6a6a70')
    // il mucchio dei ciocchi da spaccare, davanti al pilastro
    for (const [x, y] of [[282, BASE - 4], [292, BASE - 4], [302, BASE - 4], [287, BASE - 12], [297, BASE - 12], [292, BASE - 20]]) { ellisse(gf, x, y, 5, 5, '#4a3020'); ellisse(gf, x, y, 4, 4, '#c49264'); ellisse(gf, x, y, 2, 2, '#a87a4c'); R(gf, x, y, 1, 1, '#8a6038') }
    // il ceppo
    R(gf, CX - 11, BASE - 12, 22, 13, '#5a4030'); R(gf, CX + 4, BASE - 12, 7, 13, '#46301f'); R(gf, CX - 11, BASE - 1, 22, 2, '#3a2818')
    ellisse(gf, CX, BASE - 12, 11, 3, '#c49a6a'); ellisse(gf, CX, BASE - 12, 7, 2, '#a8804f'); R(gf, CX - 2, BASE - 12, 3, 1, '#8a6640')
    // la lampadina sotto il secondo arco (accesa di sera, dopo la tinta)
    linea(gf, 214, 30, 214, 50, 1, '#2a2a2a')
    tingi(gf, C)
    R(gf, 212, 50, 5, 5, C.buio > 0.3 ? '#fff0b0' : '#d8d8d0')
  }

  // la catasta: le metà spaccate una sull'altra, 16 per fila, dal basso (sei file c'erano già)
  function catasta(gq, n) {
    const tot = Math.min(16 * 20, 96 + n)
    for (let i = 0; i < tot; i++) {
      const row = Math.floor(i / 16), col = i % 16, x = CATASTA[0] + col * 6 + (row % 2) * 2, y = BASE - 4 - row * 4
      R(gq, x, y, 6, 4, '#3a2416'); R(gq, x, y, 5, 3, row % 3 ? '#e2c08e' : '#d6b07c'); R(gq, x + 4, y, 1, 3, '#7a5232')
    }
  }
  const posto = (n) => { const i = Math.min(16 * 20 - 1, 96 + n), row = Math.floor(i / 16), col = i % 16; return [CATASTA[0] + col * 6 + (row % 2) * 2 + 3, BASE - 3 - row * 4] }

  function ascia(gq, gx, gy, a) {
    const ca = Math.cos(a), sa = Math.sin(a), ex = gx + ca * 12, ey = gy + sa * 12, px = -sa, py = ca
    linea(gq, gx - ca * 2, gy - sa * 2, ex, ey, 3, '#1a120c'); linea(gq, gx - ca * 2, gy - sa * 2, ex, ey, 1, '#c89a5a')
    linea(gq, ex - px * 2, ey - py * 2, ex + px * 4, ey + py * 4, 4, '#1a120c'); linea(gq, ex - px * 1, ey - py * 1, ex + px * 3, ey + py * 3, 2, '#8a949e')
    R(gq, ex + px * 4, ey + py * 4, 1, 1, '#eef4f8')
  }
  const meta = (gq, x, y, a) => { linea(gq, x - Math.cos(a) * 4, y - Math.sin(a) * 4, x + Math.cos(a) * 4, y + Math.sin(a) * 4, 4, '#3a2416'); linea(gq, x - Math.cos(a) * 3, y - Math.sin(a) * 3, x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2, '#e2c08e') }
  const ciocco = (gq, x, y) => { R(gq, x - 5, y - 9, 10, 9, '#3a2416'); R(gq, x - 4, y - 8, 8, 8, '#6a4a30'); ellisse(gq, x, y - 9, 5, 2, '#c49264'); R(gq, x - 1, y - 9, 2, 1, '#a87a4c') }

  // ── cosa fa in questo momento ──
  function scena(t) {
    const o = { x: X, posa: { vista: 'lato', dir: 1 }, fase: 'arriva', bolla: null, ascia: 'mano', a: 1.2, legno: null, meta: null, alza: 0, spacchi: 0 }
    if (t < INTRO) { // arriva da sinistra con l'ascia in spalla
      const k = ss(0, INTRO - 0.4, t)
      o.x = 236 + (X - 236) * k
      o.posa = { vista: 'lato', dir: 1, passo: k < 1 ? t * Math.PI * 2 * 1.6 : null, mani: [[4, -31], null] }
      o.a = -2.2; o.grip = [o.x + 4, BASE - 31]
      if (t > 1 && t < 3) o.bolla = C.gradi < 6 ? 'BRR...' : 'AL LAVORO'
      return o
    }
    const gr = giroDi(t), b = gr.blocca ? BLOCCO : 0
    let u = t - gr.da
    o.spacchi = gr.k + (u >= G.colpo + b ? 1 : 0)
    const S = [X + 1, BASE - 30] // la spalla
    const presa = (a, d = 8) => [S[0] + Math.cos(a) * d, S[1] + Math.sin(a) * d]
    const piantata = presa(0.62)
    const mani = (p) => [[p[0] - X, p[1] - BASE], [p[0] - X - 1, p[1] - BASE + 1]]
    // (un giro con l'ascia piantata ha un pezzo in più dopo il primo colpo: il resto slitta)
    if (gr.blocca && u >= G.colpo) {
      if (u < G.colpo + b) { // l'ascia è rimasta nel ciocco: lo tira su insieme e lo sbatte di nuovo
        const v = u - G.colpo
        o.fase = 'bloccata'
        const a = v < 0.5 ? 0.62 + Math.sin(v * 30) * 0.05 : v < 1.3 ? 0.62 + (-1.9 - 0.62) * ss(0.5, 1.3, v) : -1.9 + (0.62 + 1.9) * Math.min(1, ((v - 1.3) / 0.3) ** 2)
        o.a = a; o.grip = presa(a); o.posa = { vista: 'lato', dir: 1, mani: mani(o.grip), busto: v < 1.3 ? 0.1 : 0.25 }
        o.legno = 'ascia'
        o.bolla = v < 1.2 ? 'BLOCCATA!' : 'DAI!'
        return o
      }
      u -= b
    }
    if (u < G.mette) { // si gira verso il mucchio e prende un ciocco
      o.fase = 'prende'; o.ascia = 'appoggiata'
      const giu = ss(0.15, 0.5, u) * (1 - ss(0.75, 1.05, u))
      o.posa = { vista: 'lato', dir: -1, busto: 0.55 * giu, giu: Math.round(4 * giu), mani: u < 0.6 ? [[10, -8], [9, -7]] : [[7, -20], [6, -19]] }
      if (u > 0.55) o.legno = 'mano'
    } else if (u < G.afferra) { // lo mette sul ceppo
      o.fase = 'mette'; o.ascia = 'appoggiata'
      const k = ss(G.mette, G.mette + 0.5, u)
      o.posa = { vista: 'lato', dir: 1, busto: 0.3 * k, mani: [[7 + 10 * k, -20 + 6 * k], [6 + 10 * k, -19 + 6 * k]] }
      o.legno = u < G.mette + 0.5 ? 'mano' : 'ceppo'
    } else if (u < G.alza) { // prende l'ascia appoggiata al ceppo
      o.fase = 'afferra'; o.legno = 'ceppo'
      const k = ss(G.afferra, G.afferra + 0.25, u)
      o.a = 1.25; o.grip = presa(1.25, 6 + 2 * k)
      o.posa = { vista: 'lato', dir: 1, busto: 0.25 * (1 - k), mani: mani(o.grip) }
      o.ascia = k > 0.6 ? 'mano' : 'appoggiata'
    } else if (u < G.colpo) { // la alza sopra la testa… e giù
      o.fase = u < G.cala ? 'alza' : 'cala'; o.legno = 'ceppo'
      const a = u < G.cala ? 1.25 + (-2.5 - 1.25) * ss(G.alza, G.cala - 0.15, u) : -2.5 + (0.62 + 2.5) * ((u - G.cala) / (G.colpo - G.cala)) ** 2
      o.alza = u < G.cala ? ss(G.alza, G.cala - 0.15, u) : 1
      o.a = a; o.grip = presa(a); o.posa = { vista: 'lato', dir: 1, busto: u < G.cala ? -0.08 * o.alza : 0.25, mani: mani(o.grip) }
    } else if (u < G.raccoglie) { // TOC: le due metà volano
      o.fase = 'colpo'; o.ascia = 'piantata'; o.a = 0.62; o.grip = piantata
      const v = u - G.colpo
      o.posa = { vista: 'lato', dir: 1, busto: 0.25 * (1 - ss(0.2, 0.46, v)), mani: v < 0.25 ? mani(piantata) : null }
      o.meta = { v }
      o.bolla = gr.k % 2 ? 'CRAC!' : 'TOC!'
    } else if (u < G.riposa) { // raccoglie le metà e le lancia sulla catasta
      o.fase = u < G.lancia ? 'raccoglie' : 'lancia'; o.ascia = 'piantata'; o.a = 0.62; o.grip = piantata
      const giu = ss(G.raccoglie, G.raccoglie + 0.3, u) * (1 - ss(G.lancia - 0.2, G.lancia, u))
      o.posa = { vista: 'lato', dir: u < G.lancia ? 1 : -1, busto: 0.6 * giu, giu: Math.round(4 * giu), mani: u < G.lancia ? [[14, -6 + 10 * (1 - giu)], [12, -5 + 10 * (1 - giu)]] : [[8, -30 + 8 * ss(G.lancia, G.lancia + 0.3, u)], null] }
      o.meta = { v: 9, presa: ss(G.raccoglie + 0.1, G.raccoglie + 0.5, u), lancio: u > G.lancia ? (u - G.lancia) / (G.riposa - G.lancia) : null }
    } else { // riposa (ogni tanto si asciuga la fronte), poi libera l'ascia e la appoggia al ceppo
      o.fase = u < G.libera ? 'riposa' : 'libera'
      if (u < G.libera) {
        o.ascia = 'piantata'; o.a = 0.62; o.grip = piantata
        const fronte = gr.k % 3 === 2
        o.posa = { vista: 'lato', dir: 1, mani: fronte ? [[3 + Math.sin(u * 12), -41], null] : null }
        if (fronte) o.bolla = 'PFF'
      } else {
        const v = u - G.libera
        o.a = 0.62 + Math.sin(v * 40) * 0.08 * (1 - ss(0.2, 0.35, v)); o.grip = presa(o.a)
        o.ascia = v < 0.4 ? 'mano' : 'appoggiata'
        o.posa = { vista: 'lato', dir: 1, busto: 0.2, mani: v < 0.4 ? mani(o.grip) : null }
      }
    }
    return o
  }

  function disegna(tt, adesso, dt = 1 / 30) {
    const kk = `${adesso.getHours()}:${adesso.getMinutes()}|${met?.icona}|${met?.gradi}`
    if (kk !== chiave) { chiave = kk; prepara(adesso) }
    const o = scena(tt), notte = C.buio > 0.45
    // il colpo: le schegge, e la scena trema un attimo
    if (o.spacchi !== ultimoColpo) {
      if (ultimoColpo >= 0 && o.spacchi > ultimoColpo && o.fase === 'colpo') for (let i = 0; i < 16; i++) schegge.push({ x: CX + (Math.random() - 0.5) * 6, y: BASE - 19, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 90, c: Math.random() < 0.5 ? '#e2c08e' : '#6a4a30' })
      ultimoColpo = o.spacchi
    }
    const trema = o.fase === 'colpo' && o.meta.v < 0.12 ? (o.meta.v < 0.06 ? 2 : 1) : 0
    g.fillStyle = C.colori[0]; g.fillRect(0, 0, W, H)
    g.save(); g.translate(0, trema)
    g.drawImage(cs, 0, 0)
    scintille(g, C, tt, ORIZZONTE, seme + 3)
    astro(g, C, 330 + ((notte ? C.luna.est : C.sole.est) + 1) * 60, Math.max(40, ORIZZONTE - 14 - Math.max(0, notte ? C.luna.alt : C.sole.alt) * 2.6), tt)
    nuvole(g, C, tt, ORIZZONTE, seme + 9)
    g.drawImage(fermo, 0, 0)
    if (C.buio > 0.3) alone(g, 214, 54, 70, '#ffd27a', 0.9)
    // la catasta, le schegge per terra
    ga.clearRect(0, 0, W, H)
    catasta(ga, o.spacchi * 2 - (o.meta && !(o.meta.lancio != null && o.meta.lancio * 1.6 >= 1) ? 2 : 0)) // (le due di adesso ci vanno quando atterrano)
    for (const p of perTerra) R(ga, p.x, p.y, 2, 1, p.c)
    // l'ascia appoggiata o piantata (dietro all'omino), i ciocchi
    if (o.ascia === 'appoggiata') ascia(ga, CX - 12, BASE - 2, -1.25)
    if (o.legno === 'ceppo') ciocco(ga, CX, BASE - 12)
    if (o.ascia === 'piantata') ascia(ga, o.grip[0], o.grip[1], o.a)
    // le due metà: volano, cadono, si raccolgono, si lanciano
    if (o.meta) {
      const v = Math.min(o.meta.v, 0.62)
      const vola = (d) => [CX + d * (6 + 28 * v), Math.min(BASE - 2, BASE - 16 - 60 * v + 160 * v * v), d * v * 9]
      let ps = [vola(-1), vola(1)]
      if (o.meta.presa) ps = ps.map((p, i) => { const k = o.meta.presa, m = [X + 14 - i * 2, BASE - 6 - (o.posa.giu ? 0 : 10) - i * 2]; return [p[0] + (m[0] - p[0]) * k, p[1] + (m[1] - p[1]) * k, p[2] * (1 - k) + 0.3 * k] })
      if (o.meta.lancio != null) {
        const k = Math.min(1, o.meta.lancio * 1.6), [tx, ty] = posto(o.spacchi * 2 - 2)
        ps = ps.map((_, i) => [X - 6 + (tx - X + 6) * k + i * 6, BASE - 32 + (ty - BASE + 32) * k - Math.sin(Math.PI * k) * 26, k * 9])
        if (k >= 1) ps = []
      }
      for (const [x, y, a] of ps) meta(ga, x, y, a)
    }
    // l'omino, con l'ascia in mano (e il ciocco in mano o piantato sull'ascia)
    omino(ga, Math.round(o.x), BASE, o.posa)
    if (o.legno === 'mano') { const m = o.posa.mani[0], d = o.posa.dir ?? 1; ciocco(ga, Math.round(o.x + m[0] * d), BASE + m[1] + 5) }
    if (o.ascia === 'mano') {
      ascia(ga, o.grip[0], o.grip[1], o.a)
      if (o.legno === 'ascia') { const ex = o.grip[0] + Math.cos(o.a) * 12, ey = o.grip[1] + Math.sin(o.a) * 12; ciocco(ga, Math.round(ex), Math.round(ey) + 6) }
    }
    // le schegge che volano (poi restano per terra)
    for (let i = schegge.length - 1; i >= 0; i--) {
      const p = schegge[i]; p.vy += 380 * dt; p.x += p.vx * dt; p.y += p.vy * dt
      if (p.y >= BASE + 2) { schegge.splice(i, 1); perTerra.push({ x: Math.round(p.x), y: BASE + 1 + Math.floor(Math.random() * 6), c: p.c }); if (perTerra.length > 90) perTerra.shift(); continue }
      R(ga, p.x, p.y, 2, 2, p.c)
    }
    tingi(ga, C)
    g.drawImage(attori, 0, 0)
    // il fiato col freddo, dopo il colpo e mentre riposa
    if (C.gradi < 8 && (o.fase === 'colpo' || o.fase === 'riposa')) for (let i = 0; i < 3; i++) { const a = ((tt * 1.2 + i / 3) % 1); g.fillStyle = `rgba(235,240,248,${(0.55 * (1 - a)).toFixed(2)})`; ellisse(g, o.x + 6 + a * 10, BASE - 38 - a * 7, 1 + Math.round(a * 2), 1) }
    // pioggia e neve fuori, non sotto il portico
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.rect(0, 0, FINE, BASE); g.clip('evenodd')
    tempo(g, C, tt, dt, H)
    g.restore()
    if (o.bolla) fumetto(g, o.bolla, Math.round(o.x), BASE - 49 + (o.posa.giu ?? 0))
    g.restore()
    // per la scritta al centro (scritta.js)
    return { fase: o.fase, spacchi: o.spacchi, bolla: o.bolla, alza: o.alza, freddo: C.gradi < 8, gradi: C.gradi, notte, tempo: C.tempo, stagione: C.stagione }
  }
  return { tela: c, disegna, meteo(m) { if (m && JSON.stringify(m) !== JSON.stringify(met)) { met = m; chiave = '' } } }
}
