// Diretta OS · «sto sistemando la postazione»: la tua stanza in pixel art (il mobile chiaro con la TV e il casco da
// cross, il cono arancione col peluche, l'orologio dorato, la cassetta verde, il microfono bianco) e la scrivania in
// mezzo, col PC da gaming e i due schermi. L'omino ci gira attorno senza fermarsi mai: sposta uno schermo, si infila
// sotto la scrivania per i cavi, cambia i colori del PC e delle luci, gira la sedia, aggiusta la webcam (e la scena
// si storce). L'ordine lo sceglie il seme: la regia e Camo vedono le stesse cose. Si disegna a 240 × 135, ×2.

import { W, H, tela, semi, ss, R, linea, ellisse, fumetto, scrivi, cielo, tingi, alone, mescola } from './pixel.js'
import { omino } from './omino.js'

const IW = 240, IH = 135, MURO = 74 // dove il muro tocca il pavimento
const DAVANTI = 128, DIETRO = 80, SX = 58, DX = 198 // il giro attorno alla scrivania (i piedi)
const LATI = [DX - SX, DAVANTI - DIETRO, DX - SX, DAVANTI - DIETRO], GIRO = LATI.reduce((a, b) => a + b)
const LED = ['#ccff00', '#9d00ff', '#ff3d9a', '#05d9e8', '#ff8a1a']
const VENTOLE = [(k, t) => `hsl(${(t * 90 + k * 60) % 360} 100% 60%)`, () => '#ccff00', () => '#9d00ff', (k, t) => (Math.sin(t * 6 + k) > 0 ? '#ff3d9a' : '#05d9e8')]

// dove sta sul giro (s da 0 a GIRO): davanti verso destra, su a destra, dietro verso sinistra, giù a sinistra
function punto(s) {
  s = ((s % GIRO) + GIRO) % GIRO
  if (s < LATI[0]) return [SX + s, DAVANTI, 0]
  s -= LATI[0]; if (s < LATI[1]) return [DX, DAVANTI - s, 1]
  s -= LATI[1]; if (s < LATI[2]) return [DX - s, DIETRO, 2]
  s -= LATI[2]; return [SX, DIETRO + s, 3]
}
const sDi = (lato, x, y) => lato === 0 ? x - SX : lato === 1 ? LATI[0] + DAVANTI - y : lato === 2 ? LATI[0] + LATI[1] + DX - x : LATI[0] + LATI[1] + LATI[2] + y - DIETRO
// le cose da sistemare: dove, per quanto, che posa, cosa dice
const LAVORI = {
  schermoSx: { s: sDi(2, 99, DIETRO), dura: 8, bolle: [[1.5, '?'], [5.5, 'OK']] },
  schermoDx: { s: sDi(2, 139, DIETRO), dura: 8, bolle: [[1.5, 'STORTO'], [5.8, 'MEGLIO']] },
  luci: { s: sDi(2, 178, DIETRO), dura: 6, bolle: [[3, 'COLORE!']] },
  cavi: { s: sDi(0, 150, DAVANTI), dura: 9, bolle: [[2, '...'], [6, '!']] },
  pc: { s: sDi(1, DX, 112), dura: 7, bolle: [[3.5, 'RGB!']] },
  sedia: { s: sDi(0, 120, DAVANTI), dura: 7, bolle: [[4.5, 'PFF']] },
  webcam: { s: sDi(0, 84, DAVANTI), dura: 6, bolle: [[1.5, 'MI VEDETE?']] },
  tastiera: { s: sDi(0, 102, DAVANTI), dura: 6, bolle: [[3, 'DRITTA']] },
}

export function crea({ seme = 7, meteo = null } = {}) {
  const [c, g] = tela(), [stanza, gs] = tela(IW, IH), [qui, gq] = tela(IW, IH)
  let chiave = '', C = null, met = meteo
  // il copione: una fila di lavori a caso (mai lo stesso due volte di fila), con le camminate in mezzo
  const r = semi(seme * 7 + 3), copione = []
  let t = 0, s = LAVORI.webcam.s - 40, prima = null
  copione.push({ tipo: 'entra', da: 0, a: 2.5, s0: s - 30, s1: s }); t = 2.5
  while (t < 3 * 3600) {
    let l; do l = Object.keys(LAVORI)[Math.floor(r() * Object.keys(LAVORI).length)]; while (l === prima)
    prima = l
    const dest = LAVORI[l].s
    let d = ((dest - s) % GIRO + GIRO) % GIRO; if (d > GIRO / 2) d -= GIRO
    const dura = Math.abs(d) / 42
    copione.push({ tipo: 'cammina', da: t, a: t + dura, s0: s, s1: s + d }); t += dura; s = dest
    copione.push({ tipo: l, da: t, a: t + LAVORI[l].dura, s }); t += LAVORI[l].dura
  }
  // quello che resta cambiato dopo ogni lavoro (i colori del PC e delle luci)
  const dopo = (tipo, fino) => copione.filter((p) => p.tipo === tipo && p.a <= fino).length

  function prepara(adesso) {
    C = cielo(adesso, met)
    const q = semi(seme)
    gs.clearRect(0, 0, IW, IH)
    // il muro bianco, il pavimento di legno, il battiscopa
    for (let y = 0; y < MURO; y++) R(gs, 0, y, IW, 1, mescola('#e4e0da', '#d6d1c9', y / MURO))
    for (let i = 0; i < 80; i++) R(gs, q() * IW, q() * MURO, 2, 1, '#dcd7cf')
    for (let y = MURO; y < IH; y++) R(gs, 0, y, IW, 1, mescola('#a8784e', '#8a5e3a', (y - MURO) / (IH - MURO)))
    for (let y = MURO + 5; y < IH; y += 6 + Math.floor((y - MURO) / 10)) R(gs, 0, y, IW, 1, '#7a5232')
    for (let i = 0; i < 40; i++) R(gs, q() * IW, MURO + q() * (IH - MURO), 4 + q() * 8, 1, '#9a6c44')
    R(gs, 0, MURO - 2, IW, 2, '#cfc8bd')
    // il mobile chiaro con la TV e il casco, a sinistra
    R(gs, 4, 46, 52, 28, '#d9c6a2'); R(gs, 4, 46, 52, 2, '#c8b28a'); R(gs, 6, 49, 23, 23, '#e4d3b2'); R(gs, 31, 49, 23, 23, '#e4d3b2'); R(gs, 27, 58, 1, 3, '#8a8a8a'); R(gs, 33, 58, 2, 1, '#b8b8b8')
    R(gs, 9, 14, 42, 26, '#1a1a1e'); R(gs, 10, 15, 40, 24, '#23232a'); R(gs, 12, 16, 10, 8, '#2e2e38'); R(gs, 18, 40, 2, 6, '#2a2a2a'); R(gs, 40, 40, 2, 6, '#2a2a2a')
    ellisse(gs, 42, 40, 7, 6, '#1e1e22'); R(gs, 36, 40, 12, 2, '#d8e02a'); R(gs, 44, 37, 5, 3, '#c8ccd2'); R(gs, 35, 44, 13, 2, '#1e1e22')
    R(gs, 8, 41, 9, 5, '#2a2a30'); R(gs, 9, 42, 7, 3, '#5a6a8a')
    // a destra: il tavolino con l'orologio dorato, il cono col peluche, la cassetta verde, le bottiglie
    R(gs, 206, 50, 34, 24, '#d9c6a2'); R(gs, 206, 50, 34, 2, '#c8b28a'); R(gs, 208, 54, 30, 18, '#e4d3b2')
    R(gs, 212, 40, 7, 10, '#b8902a'); ellisse(gs, 215, 43, 2, 2, '#f2ead0'); R(gs, 211, 49, 9, 1, '#8a6a1a')
    for (let y = 0; y < 26; y++) { const w = Math.round(3 + y * 0.42); R(gs, 228 - w, 24 + y, w * 2, 1, (y > 7 && y < 11) || (y > 15 && y < 19) ? '#dfe3e8' : '#ff6a1a'); R(gs, 228 + w - 2, 24 + y, 2, 1, (y > 7 && y < 11) || (y > 15 && y < 19) ? '#b8bec6' : '#d8500e') }
    R(gs, 216, 50, 24, 2, '#e85a10'); R(gs, 224, 16, 8, 8, '#6a6a72'); R(gs, 222, 20, 3, 6, '#5a5a62'); R(gs, 231, 22, 4, 3, '#5a5a62')
    R(gs, 204, 76, 22, 13, '#3f4a2a'); R(gs, 204, 76, 22, 2, '#4f5a36'); R(gs, 208, 80, 10, 4, '#e8e4d8')
    for (const x of [230, 235]) { R(gs, x, 64, 4, 10, 'rgba(220,235,245,0.75)'); R(gs, x + 1, 62, 2, 2, '#e8f0f4') }
    // l'insegna di pzkko sul muro
    tingi(gs, { tinta: C.buio > 0.45 ? '#1a1430' : null, forza: C.buio > 0.45 ? 0.4 : 0 }, IW, IH)
  }

  // ── a che punto è: il pezzo del copione di adesso ──
  function adesso(t) {
    let i = 0, j = copione.length - 1
    while (i < j) { const m = (i + j) >> 1; if (copione[m].a <= t) i = m + 1; else j = m }
    return copione[i]
  }

  function disegna(tt, ora, dt = 1 / 30) {
    const k = `${ora.getHours()}:${ora.getMinutes()}|${met?.icona}`
    if (k !== chiave) { chiave = k; prepara(ora) }
    const p = adesso(tt), f = (tt - p.da) / (p.a - p.da), u = tt - p.da, notte = C.buio > 0.45
    // dove sta e come
    let x, y, lato, posa, bolla = null
    if (p.tipo === 'entra' || p.tipo === 'cammina') {
      const s = p.s0 + (p.s1 - p.s0) * f, avanti = p.s1 >= p.s0
      ;[x, y, lato] = punto(s)
      const passo = tt * Math.PI * 2 * 1.9
      posa = lato === 0 ? { vista: 'lato', dir: avanti ? 1 : -1, passo } : lato === 2 ? { vista: 'lato', dir: avanti ? -1 : 1, passo } : (lato === 1) === avanti ? { vista: 'retro', passo } : { vista: 'fronte', passo }
    } else {
      ;[x, y, lato] = punto(p.s)
      const L = LAVORI[p.tipo]
      for (const [q, b] of L.bolle) if (u > q && u < q + 2.2) bolla = b
      const tira = Math.sin(u * 3)
      posa = {
        schermoSx: { vista: 'fronte', mani: [[6, -23 + tira * 0.6], [-6, -23 - tira * 0.6]] },
        schermoDx: { vista: 'fronte', mani: [[6, -23 + tira * 0.6], [-6, -23 - tira * 0.6]] },
        luci: { vista: 'retro', mani: [[3, -40 + Math.round(Math.sin(u * 5))], null] },
        cavi: { vista: 'lato', dir: -1, giu: Math.round(9 * ss(0, 0.8, u) * (1 - ss(p.a - p.da - 0.8, p.a - p.da, u))), busto: 0.85 * ss(0, 0.8, u) * (1 - ss(p.a - p.da - 0.8, p.a - p.da, u)), mani: u > 0.8 && u < p.a - p.da - 0.8 ? [[13 + tira * 2, -10], [11, -8]] : null },
        pc: { vista: 'lato', dir: -1, giu: Math.round(6 * ss(0, 0.6, u) * (1 - ss(6.2, 7, u))), busto: 0.3, mani: [[9, -17 + tira], [7, -15]] },
        sedia: { vista: 'retro', mani: [[5, -26], [-5, -26]] },
        webcam: { vista: 'fronte', mani: [[5, -37 + tira], [-5, -37 - tira]], bocca: u > 1.5 && u < 3.7 ? 1 : 0 },
        tastiera: { vista: 'lato', dir: -1, busto: 0.5, mani: [[14 + Math.round(Math.sin(u * 7)), -26], [12, -25]] },
      }[p.tipo]
    }
    posa.occhi = (tt % 3.9) < 0.15 ? 0 : 1

    // ── la stanza ──
    gq.drawImage(stanza, 0, 0)
    // le luci dietro agli schermi (cambiano col lavoro «luci»)
    const led = LED[dopo('luci', tt) % LED.length], ledNuovo = p.tipo === 'luci' && u > 2.5 ? LED[(dopo('luci', tt) + 1) % LED.length] : led
    alone(gq, 120, 58, 70, ledNuovo, notte ? 0.9 : 0.45)
    R(gq, 80, 52, 80, 1, ledNuovo)
    // l'insegna lime
    R(gq, 174, 17, 25, 9, '#1a1a1e'); scrivi(gq, 'PZKKO', 176, 19, '#ccff00')
    if (notte) alone(gq, 186, 21, 18, '#ccff00', 0.6)

    // ── le cose in ordine di profondità (prima le più lontane): l'omino dietro, la scrivania, la sedia, l'omino davanti ──
    const pezzi = []
    const omo = () => omino(gq, Math.round(x), Math.round(y), posa)
    pezzi.push([y, omo])
    // la scrivania (chiara, come la tua) con gli schermi, la tastiera, il mouse, il microfono
    pezzi.push([118, () => {
      // i cavi sotto (si muovono quando ci sei sotto)
      const smuovi = p.tipo === 'cavi' && u > 1 && u < 8 ? Math.sin(tt * 9) * 2 : 0
      for (const [cx, col] of [[104, '#2a2a2e'], [112, '#3a3a40'], [140, '#2a2a2e']]) linea(gq, cx, 96, cx + smuovi + (cx - 120) * 0.2, 112, 1, col)
      // le gambe di dietro, il piano, il bordo davanti, le gambe davanti
      R(gq, 74, 92, 3, 14, '#b8a07a'); R(gq, 164, 92, 3, 14, '#b8a07a')
      for (let yy = 86; yy < 96; yy++) R(gq, 68 - (yy - 86) * 0.4, yy, 106 + (yy - 86) * 0.8, 1, mescola('#e3cfa8', '#d8c296', (yy - 86) / 10))
      R(gq, 64, 96, 114, 3, '#c4ab80'); R(gq, 66, 99, 3, 19, '#b8a07a'); R(gq, 173, 99, 3, 19, '#b8a07a')
      // gli schermi: a sinistra la call di Discord, a destra... questa scena (piccola)
      const storto = (n) => (p.tipo === (n ? 'schermoDx' : 'schermoSx') && u > 0.8 && u < 6 ? Math.round(Math.sin(u * 2.4) * 2) : 0)
      for (const [mx, n] of [[82, 0], [122, 1]]) {
        const s = storto(n)
        R(gq, mx + 15, 80, 6, 7, '#2a2a2e'); R(gq, mx + 11, 87, 14, 2, '#2a2a2e')
        for (let yy = 0; yy < 24; yy++) R(gq, mx + Math.round(s * (1 - yy / 24)), 57 + yy, 36, 1, '#1a1a1e')
        const sx = mx + 2 + Math.round(s * 0.5)
        if (!n) {
          R(gq, sx, 59, 32, 19, '#313338')
          for (const [ax, ay, col, parla] of [[sx + 3, 61, '#5865f2', false], [sx + 18, 61, '#eb459e', true], [sx + 3, 70, '#57f287', false], [sx + 18, 70, '#f0b232', false]]) { R(gq, ax, ay, 12, 7, '#232428'); ellisse(gq, ax + 6, ay + 3, 2, 2, col); if (parla && Math.sin(tt * 5) > -0.3) { R(gq, ax, ay, 12, 1, '#23a55a'); R(gq, ax, ay + 6, 12, 1, '#23a55a'); R(gq, ax, ay, 1, 7, '#23a55a'); R(gq, ax + 11, ay, 1, 7, '#23a55a') } }
        } else gq.drawImage(c, 0, 0, W, H, sx, 59, 32, 19)
        if (notte) alone(gq, mx + 18, 68, 26, n ? '#a8c8ff' : '#7a8aff', 0.5)
      }
      // la tastiera (le luci fanno l'onda), il mouse, il microfono bianco
      R(gq, 96, 90, 34, 4, '#1a1a1e')
      for (let kx = 0; kx < 32; kx += 2) R(gq, 97 + kx, 91, 1, 2, `hsl(${(kx * 12 + tt * (p.tipo === 'tastiera' ? 400 : 60)) % 360} 100% ${p.tipo === 'tastiera' ? 70 : 55}%)`)
      R(gq, 136, 90, 4, 3, '#1a1a1e'); R(gq, 137, 90, 2, 1, '#05d9e8')
      R(gq, 154, 76, 6, 9, '#f2f2f2'); R(gq, 154, 76, 6, 2, '#2a2a2e'); R(gq, 156, 85, 2, 4, '#e8e8e8'); R(gq, 152, 89, 10, 2, '#e8e8e8'); R(gq, 155, 82, 4, 1, '#05d9e8')
    }])
    // il PC da gaming, accanto alla scrivania: il vetro, le tre ventole coi colori (cambiano col lavoro «pc»)
    pezzi.push([119, () => {
      const modo = VENTOLE[dopo('pc', tt) % VENTOLE.length], spento = p.tipo === 'cavi' && u > 5.8 && u < 6.6
      R(gq, 176, 82, 18, 37, '#141418'); R(gq, 177, 83, 16, 35, '#22222a'); R(gq, 178, 84, 14, 33, '#0e0e14')
      for (let i = 0; i < 3; i++) {
        const col = spento ? '#1a1a20' : modo(i, tt)
        ellisse(gq, 185, 90 + i * 10, 4, 4, col); ellisse(gq, 185, 90 + i * 10, 2, 2, '#0e0e14'); R(gq, 185 + Math.round(Math.cos(tt * 12 + i) * 2), 90 + i * 10 + Math.round(Math.sin(tt * 12 + i) * 2), 1, 1, '#3a3a44')
        if (!spento) alone(gq, 185, 90 + i * 10, 10, col.startsWith('hsl') ? '#c88aff' : col, notte ? 0.5 : 0.25)
      }
      R(gq, 180, 84, 1, 1, '#ffffff')
    }])
    // la sedia nera a rete (gira col lavoro «sedia», e sale e scende)
    pezzi.push([124, () => {
      const gira = p.tipo === 'sedia' && u > 0.6 && u < 4 ? Math.floor(u * 6) % 4 : 0, alza = p.tipo === 'sedia' && u > 4.2 && u < 6.5 ? Math.round(Math.sin((u - 4.2) * 4) * 2) : 0
      const cx = 120
      R(gq, cx - 1, 112 - alza, 3, 8 + alza, '#2a2a2e'); linea(gq, cx - 8, 122, cx + 8, 122, 2, '#2a2a2e'); R(gq, cx - 9, 123, 2, 2, '#111'); R(gq, cx + 8, 123, 2, 2, '#111'); R(gq, cx, 123, 2, 2, '#111')
      if (gira === 1 || gira === 3) { R(gq, cx - 3, 92 - alza, 6, 18, '#1e1e24'); R(gq, cx - 7, 108 - alza, 14, 4, '#2a2a30') }
      else { R(gq, cx - 9, 90 - alza, 18, 18, '#1e1e24'); for (let yy = 92; yy < 106; yy += 2) R(gq, cx - 8, yy - alza, 16, 1, gira === 2 ? '#3a3a44' : '#2c2c34'); R(gq, cx - 10, 106 - alza, 20, 5, '#2a2a30'); R(gq, cx - 12, 102 - alza, 3, 6, '#2a2a2e'); R(gq, cx + 9, 102 - alza, 3, 6, '#2a2a2e') }
    }])
    pezzi.sort((a, b) => a[0] - b[0]).forEach(([, fai]) => fai())
    if (notte && (posa.vista === 'fronte' && y < 100)) alone(gq, x, y - 34, 14, '#a8c0ff', 0.4) // la luce degli schermi sulla faccia
    if (bolla) fumetto(gq, bolla, Math.round(x), Math.round(y - 48 + (posa.giu ?? 0)))
    // «mi vedete?»: aggiusta la webcam e tutta la scena si storce un attimo
    g.save()
    if (p.tipo === 'webcam' && u > 0.5 && u < 5) { const a = Math.sin(u * 2.2) * 0.035 * Math.min(1, (5 - u) * 2); g.translate(W / 2, H / 2); g.rotate(a); g.scale(1.06, 1.06); g.translate(-W / 2, -H / 2) }
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H)
    g.drawImage(qui, 0, 0, W, H)
    g.restore()
    // per la scritta al centro (scritta.js): il lavoro di adesso, da quanto ci è sopra, quanto dura, cosa dice
    return { lavoro: p.tipo, u, dura: p.a - p.da, da: p.da, bolla }
  }
  return { tela: c, disegna, meteo(m) { if (m && JSON.stringify(m) !== JSON.stringify(met)) { met = m; chiave = '' } } }
}
