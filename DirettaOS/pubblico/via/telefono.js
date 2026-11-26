// Diretta OS · «sono al telefono»: fuori, nell'aia davanti a casa, col telefono all'orecchio. L'omino esce col telefono
// che squilla, risponde («PRONTO?») e poi va avanti e indietro sulla ghiaia parlando e ascoltando: si ferma a
// gesticolare, si siede sulla panchina, ride, annuisce. Il cielo, il tempo e la stagione sono quelli veri (le finestre e
// il lampione accesi di sera); con la pioggia sta sotto la tettoia. Il gatto nero di casa è sullo scalino.
// Il tempo della scena parte da quando hai premuto il tasto; le battute e i giri sono scelti col seme.

import { W, H, tela, semi, ss, lin, R, linea, ellisse, fumetto, cielo, dipingiCielo, scintille, astro, nuvole, tingi, alone, creaTempo, ERBA, mescola, scurisci } from './pixel.js'
import { pioppo, cespuglio, ciuffo, albero } from './natura.js'
import { omino } from './omino.js'

const ORIZZONTE = 156, BASE = 214, PIEDI = 236 // l'orizzonte, il piede della casa, dove cammina
const PORTA = 96, PANCA = 160, CASA = 200 // la porta, la panchina, dove finisce la casa
const TETTOIA = [44, 178] // la tettoia sopra la porta e la panchina (da x a x): con la pioggia si cammina lì sotto
const DICE = ['SÌ SÌ', 'NO DAI', 'DAVVERO?', 'AH OK', 'CERTO', 'MA VA!', 'ASPETTA', 'GIURO', 'VA BENE', 'E POI?', 'NOOO', 'OK OK', 'STASERA?', 'BOH', 'ESATTO', 'TRANQUILLO', 'DIMMI', 'IN DIRETTA!']
const ASCOLTA = ['MH MH', '...', 'SÌ', 'MH', null, null]

export function crea({ seme = 7, meteo = null } = {}) {
  const [c, g] = tela(), [cs, gs] = tela(), [fermo, gf] = tela(), [attori, ga] = tela()
  const tempo = creaTempo(seme)
  let chiave = '', C = null, met = meteo
  const r = semi(seme * 17 + 3)

  // il copione di dove sta: esce, risponde, poi a caso: cammina fino a un punto, si ferma a gesticolare, la panchina
  // (le x sono da 0 a 1: col bel tempo vanno su tutta l'aia, con la pioggia sotto la tettoia)
  const passi = [{ tipo: 'esce', da: 0, a: 2.6 }, { tipo: 'risponde', da: 2.6, a: 4.6, k: 0.18 }]
  let t = 4.6, k = 0.18, giri = 0
  while (t < 3 * 3600) {
    giri++
    if (giri % 5 === 0) { // la panchina
      const d = Math.abs(k - 0.3); passi.push({ tipo: 'cammina', da: t, a: t + 0.5 + d * 9, k0: k, k1: 0.3 }); t += 0.5 + d * 9; k = 0.3
      const s = 12 + r() * 10; passi.push({ tipo: 'panca', da: t, a: t + s, k }); t += s; continue
    }
    const k1 = 0.08 + r() * 0.92, d = Math.abs(k1 - k), dura = 0.6 + d * 11
    passi.push({ tipo: 'cammina', da: t, a: t + dura, k0: k, k1 }); t += dura; k = k1
    const s = 2 + r() * 4; passi.push({ tipo: 'fermo', da: t, a: t + s, k }); t += s
  }
  // il copione di quello che dice: parla e ascolta a turno, ogni tanto ride
  const voce = []
  t = 4.6
  while (t < 3 * 3600) {
    const ascolta = 1.8 + r() * 3.6; voce.push({ tipo: 'ascolta', da: t, a: t + ascolta, b: ASCOLTA[Math.floor(r() * ASCOLTA.length)] }); t += ascolta
    if (r() < 0.16) { voce.push({ tipo: 'ride', da: t, a: t + 2.2, b: 'AHAHAH' }); t += 2.2; continue }
    const parla = 1.6 + r() * 1.8; voce.push({ tipo: 'parla', da: t, a: t + parla, b: DICE[Math.floor(r() * DICE.length)] }); t += parla
  }
  const trova = (l, tt) => { let i = 0, j = l.length - 1; while (i < j) { const m = (i + j) >> 1; if (l[m].a <= tt) i = m + 1; else j = m } return l[i] }

  // ── l'aia ferma: si rifà ogni minuto (la luce cambia) ──
  function prepara(adesso) {
    C = cielo(adesso, met)
    const q = semi(seme), st = C.stagione, neve = C.tempo === 'neve', nebbia = C.tempo === 'nebbia' ? 0.5 : 0, oriz = C.colori[2], notte = C.buio > 0.45
    dipingiCielo(gs, C, ORIZZONTE + 8, seme)
    gf.clearRect(0, 0, W, H)
    // lontano: i campi, la fila di pioppi, il campanile
    const erba = ERBA[st].map((e) => (neve ? mescola(e, '#eef3f8', 0.85) : e))
    for (let y = ORIZZONTE; y < BASE; y++) R(gf, 0, y, W, 1, mescola(mescola(erba[1], oriz, 0.45 * (1 - (y - ORIZZONTE) / (BASE - ORIZZONTE)) + nebbia * 0.3), erba[2], (y - ORIZZONTE) / (BASE - ORIZZONTE) * 0.5))
    const pioppi = (st === 'inverno' ? ['#59604e', '#6b7260', '#7c836f'] : st === 'autunno' ? ['#a8862e', '#c6a23c', '#8a6f26'] : ['#3d6a33', '#4f8240', '#62964d']).map((x) => mescola(x, oriz, 0.45 + nebbia * 0.3))
    for (let x = 210; x < W + 10; x += 9 + Math.floor(q() * 7)) pioppo(gf, q, x, ORIZZONTE + 2, 22 + q() * 14, pioppi)
    const cx = 330, campanile = mescola('#b0705a', oriz, 0.5 + nebbia * 0.3)
    R(gf, cx, ORIZZONTE - 46, 9, 48, campanile); R(gf, cx - 1, ORIZZONTE - 48, 11, 3, mescola(campanile, '#000000', 0.15))
    for (let i = 0; i < 6; i++) R(gf, cx + 4 - i * 0.7, ORIZZONTE - 49 - i, 1 + i * 1.4, 1, mescola('#8a4a3a', oriz, 0.5))
    R(gf, cx + 3, ORIZZONTE - 40, 3, 4, mescola('#3a2a2a', oriz, 0.4))
    for (let i = 0; i < 160; i++) R(gf, 200 + q() * (W - 200), ORIZZONTE + 4 + q() * (BASE - ORIZZONTE - 4), 2, 1, q() < 0.5 ? erba[0] : erba[2])
    // l'albero grande a destra e la staccionata
    albero(gf, q, 432, BASE + 4, 92, 58, st, neve, nebbia, oriz)
    for (let x = 214; x < W; x += 22) { R(gf, x, BASE - 14, 3, 16, '#6a4a32'); R(gf, x, BASE - 14, 3, 1, '#8a6a4a') }
    R(gf, 212, BASE - 11, W - 212, 2, '#7a583a'); R(gf, 212, BASE - 5, W - 212, 2, '#7a583a')
    // la ghiaia dell'aia
    for (let y = BASE; y < H; y++) R(gf, 0, y, W, 1, mescola(neve ? '#dfe4ea' : '#b5a891', neve ? '#cfd6de' : '#9f927b', (y - BASE) / (H - BASE)))
    for (let i = 0; i < 1500; i++) R(gf, q() * W, BASE + q() * (H - BASE), 1, 1, q() < 0.5 ? (neve ? '#f4f7fa' : '#cdbfa6') : (neve ? '#bfc8d2' : '#8a7e68'))
    for (let i = 0; i < 40; i++) ciuffo(gf, 200 + q() * 280, BASE + 2 + q() * 6, erba[2], 3 + Math.floor(q() * 3))
    // la casa: il muro, il tetto, le finestre con le persiane verdi, la porta, il lampione, la tettoia
    const muro = neve ? '#ead9bd' : '#e3c693'
    R(gf, 0, 34, CASA, BASE - 34, muro)
    for (let i = 0; i < 260; i++) R(gf, q() * CASA, 34 + q() * (BASE - 34), 2, 1, q() < 0.5 ? '#d6b783' : '#ecd3a8')
    R(gf, 0, BASE - 10, CASA, 10, '#c9a878'); R(gf, 0, BASE - 10, CASA, 1, '#b59464') // lo zoccolo
    R(gf, CASA - 3, 34, 3, BASE - 34, '#cfb07c')
    for (let x = -4; x < CASA + 8; x += 6) { R(gf, x, 22, 6, 12, '#9a4a32'); R(gf, x, 22, 6, 2, '#b85e40'); R(gf, x + 5, 22, 1, 12, '#7a3424') } // le tegole
    R(gf, -4, 33, CASA + 12, 3, '#6e3222')
    if (neve) R(gf, -4, 19, CASA + 12, 4, '#f2f6fb')
    const finestra = (x, y, w, h) => {
      R(gf, x - 7, y - 1, 7, h + 2, '#2f5a36'); R(gf, x + w, y - 1, 7, h + 2, '#2f5a36')
      for (let i = 0; i < h; i += 3) { R(gf, x - 6, y + i, 5, 1, '#3d7346'); R(gf, x + w + 1, y + i, 5, 1, '#3d7346') }
      R(gf, x - 1, y - 1, w + 2, h + 2, '#e9e1d0'); R(gf, x, y, w, h, notte ? '#2a2018' : '#4a5a6e'); R(gf, x + Math.floor(w / 2), y, 1, h, '#e9e1d0'); R(gf, x, y + Math.floor(h / 2), w, 1, '#e9e1d0')
      R(gf, x - 2, y + h + 1, w + 4, 2, '#cdbd9e')
    }
    finestra(22, 60, 20, 28); finestra(84, 60, 20, 28); finestra(150, 60, 20, 28); finestra(150, 122, 20, 24)
    // la porta verde (come in casa.js) e lo scalino
    R(gf, PORTA - 12, 150, 24, BASE - 150, '#2f4a32'); R(gf, PORTA - 10, 154, 9, 18, '#355a38'); R(gf, PORTA + 1, 154, 9, 18, '#355a38'); R(gf, PORTA + 6, 180, 2, 2, '#d8b04a')
    R(gf, PORTA - 15, 147, 30, 3, '#e9e1d0'); R(gf, PORTA - 16, BASE - 2, 32, 4, '#a89a84')
    // la tettoia
    R(gf, TETTOIA[0], 132, TETTOIA[1] - TETTOIA[0], 4, '#7a3a28'); R(gf, TETTOIA[0], 136, TETTOIA[1] - TETTOIA[0], 1, '#4a2218')
    for (const x of [TETTOIA[0] + 2, TETTOIA[1] - 6]) linea(gf, x, 136, x + (x < PORTA ? 8 : -8), 146, 2, '#5a3a28')
    // la panchina contro il muro
    R(gf, PANCA - 18, BASE - 2, 36, 3, '#7a5232'); R(gf, PANCA - 18, BASE - 3, 36, 1, '#a8774a'); R(gf, PANCA - 16, BASE + 1, 3, 8, '#5a3a22'); R(gf, PANCA + 13, BASE + 1, 3, 8, '#5a3a22')
    R(gf, PANCA - 18, BASE - 14, 36, 3, '#7a5232'); R(gf, PANCA - 18, BASE - 8, 36, 2, '#7a5232')
    // la bicicletta appoggiata al muro
    const bx = 186
    for (const wx of [bx - 9, bx + 9]) { ellisse(gf, wx, BASE + 5, 7, 7, '#2a2a30'); ellisse(gf, wx, BASE + 5, 5, 5, neve ? '#dfe4ea' : '#b0a38c'); R(gf, wx, BASE + 5, 1, 1, '#8a8a90') }
    linea(gf, bx - 9, BASE + 5, bx, BASE - 3, 1, '#c8323a'); linea(gf, bx, BASE - 3, bx + 9, BASE + 5, 1, '#c8323a'); linea(gf, bx - 9, BASE + 5, bx + 2, BASE + 5, 1, '#c8323a'); linea(gf, bx + 2, BASE + 5, bx, BASE - 3, 1, '#c8323a')
    linea(gf, bx + 8, BASE - 6, bx + 9, BASE + 5, 1, '#2a2a30'); R(gf, bx + 6, BASE - 7, 5, 1, '#2a2a30'); R(gf, bx - 2, BASE - 5, 5, 2, '#2a2a30')
    // il vaso di gerani
    R(gf, 60, BASE - 9, 10, 9, '#b8643a'); R(gf, 59, BASE - 10, 12, 2, '#c8744a')
    for (let i = 0; i < 9; i++) R(gf, 58 + q() * 12, BASE - 16 + q() * 6, 2, 2, st === 'inverno' ? '#5a6a4a' : i % 3 ? '#3f7a34' : '#e8323a')
    if (st !== 'inverno') cespuglio(gf, q, 8, BASE + 2, 22, 14, ['#2f5a25', '#407a31', '#5a9a42'])
    tingi(gf, C)
    // le luci accese di sera (dopo la tinta: non si scuriscono)
    if (notte) {
      for (const [x, y, w, h] of [[22, 60, 20, 28], [150, 122, 20, 24]]) { R(gf, x, y, w, h, '#f4c870'); R(gf, x + Math.floor(w / 2), y, 1, h, '#c8a060'); R(gf, x, y + Math.floor(h / 2), w, 1, '#c8a060') }
    }
    R(gf, PORTA + 18, 140, 5, 7, notte ? '#fff0b0' : '#d8d8d0'); R(gf, PORTA + 17, 138, 7, 2, '#2a2a30')
  }

  // ── dove sta e cosa fa ──
  function scena(tt) {
    const p = trova(passi, tt), v = tt >= 4.6 ? trova(voce, tt) : null, u = tt - p.da
    const sotto = C.tempo === 'pioggia' || C.tempo === 'temporale' || C.tempo === 'neve'
    const lo = sotto ? TETTOIA[0] + 10 : PORTA + 14, hi = sotto ? TETTOIA[1] - 4 : 400
    const X = (k) => lo + (hi - lo) * k
    const o = { x: X(0.18), posa: {}, bolla: null, fase: p.tipo, telefono: 'orecchio', giu: 0, porta: 0 }
    const parla = v && (v.tipo === 'parla' || v.tipo === 'ride') && u > 0.3
    const gesto = parla ? [Math.round(-9 + Math.sin(tt * 5) * 2), Math.round(-27 + Math.sin(tt * 3.3) * 4)] : null
    if (p.tipo === 'esce') { // la porta si apre, esce guardando il telefono che squilla
      o.porta = lin(0.2, 0.8, tt) * (1 - lin(1.9, 2.5, tt)); o.x = PORTA + 14 * ss(0.8, 2, tt)
      o.posa = tt < 1.2 ? { vista: 'fronte', mani: [[3, -24], null] } : { vista: 'lato', dir: 1, passo: tt < 2 ? tt * Math.PI * 2 * 1.6 : null, mani: [[9, -22], null] }
      o.telefono = 'mano'; o.squilla = true; o.nascosto = tt < 0.5
      if (tt > 0.6) o.bolla = 'DRIN DRIN'
    } else if (p.tipo === 'risponde') {
      o.x = X(0.18); const su = ss(2.9, 3.4, tt)
      o.posa = { vista: 'fronte', mani: [su > 0.5 ? [7, -38] : [3, -24], null], gomiti: [su > 0.5 ? [10, -30] : null, null] }
      o.telefono = su > 0.5 ? 'orecchio' : 'mano'; o.squilla = tt < 3
      if (tt > 3.4) o.bolla = 'PRONTO?'
    } else if (p.tipo === 'cammina') {
      const kk = ss(0, 1, u / (p.a - p.da)), dir = p.k1 >= p.k0 ? 1 : -1
      o.x = X(p.k0 + (p.k1 - p.k0) * kk)
      o.posa = { vista: 'lato', dir, passo: tt * Math.PI * 2 * 1.3, mani: [[-1, -37], null] }
    } else if (p.tipo === 'fermo') {
      o.x = X(p.k)
      o.posa = { vista: 'fronte', mani: [[7, -38], gesto], gomiti: [[10, -30], null], testa: Math.sin(tt * 0.7) > 0.6 ? 1 : 0 }
    } else { // sulla panchina
      o.x = X(p.k); o.giu = Math.round(6 * ss(0, 0.6, u) * (1 - ss(p.a - p.da - 0.6, p.a - p.da, u)))
      o.posa = { vista: 'fronte', giu: o.giu, mani: [[7, -38 + o.giu], gesto && [gesto[0], gesto[1] + o.giu]], gomiti: [[10, -30 + o.giu], null] }
    }
    // la voce: le battute, la bocca che si muove, ride (si piega), annuisce ascoltando
    if (v && !o.bolla) {
      const uv = tt - v.da
      if (v.tipo === 'parla' && uv > 0.3) o.bolla = v.b
      if (v.tipo === 'ride') { o.bolla = v.b; if (o.posa.vista === 'fronte') o.posa.giu = (o.posa.giu ?? 0) + (Math.sin(tt * 18) > 0 ? 1 : 0) }
      if (v.tipo === 'ascolta' && v.b && uv > 0.6 && uv < 2.2) o.bolla = v.b
      if (o.posa.vista === 'fronte') {
        o.posa.bocca = parla && Math.sin(tt * 16) > 0 ? 1 : 0
        if (v.tipo === 'ascolta' && Math.sin(uv * 5) > 0.7) o.posa.testa = 'giu' // annuisce
      }
    }
    o.parla = !!parla; o.ride = v?.tipo === 'ride'; o.ascolta = v?.tipo === 'ascolta'
    return o
  }

  function disegna(tt, adesso, dt = 1 / 30) {
    const kk = `${adesso.getHours()}:${adesso.getMinutes()}|${met?.icona}|${met?.gradi}`
    if (kk !== chiave) { chiave = kk; prepara(adesso) }
    const o = scena(tt), notte = C.buio > 0.45
    g.drawImage(cs, 0, 0)
    scintille(g, C, tt, ORIZZONTE, seme + 3)
    astro(g, C, 250 + ((notte ? C.luna.est : C.sole.est) + 1) * 100, Math.max(14, ORIZZONTE - 14 - Math.max(0, notte ? C.luna.alt : C.sole.alt) * 3.2), tt)
    nuvole(g, C, tt, ORIZZONTE, seme + 9)
    g.drawImage(fermo, 0, 0)
    // la porta che si apre
    if (o.porta > 0) { R(g, PORTA - 12, 150, 24, BASE - 150, '#2a1c12'); alone(g, PORTA, 186, 26, '#ffc870', 0.8 * o.porta); R(g, PORTA - 12, 150, Math.round(4 + 20 * (1 - o.porta)), BASE - 150, '#2f4a32') }
    if (notte) { alone(g, PORTA + 20, 144, 34, '#ffe6a0', 0.9); for (const [x, y] of [[32, 74], [160, 134]]) alone(g, x, y, 22, '#ffc870', 0.5) }
    // il gatto sullo scalino, con la coda che va
    const gx = PORTA + 22, gy = BASE + 1
    R(g, gx, gy - 9, 7, 6, '#1a1a1e'); R(g, gx + 1, gy - 6, 4, 3, '#f2f2f2'); R(g, gx + 1, gy - 13, 5, 5, '#1a1a1e'); R(g, gx + 1, gy - 14, 1, 1, '#1a1a1e'); R(g, gx + 5, gy - 14, 1, 1, '#1a1a1e'); R(g, gx + 2, gy - 11, 1, 1, '#c8e05a'); R(g, gx + 4, gy - 11, 1, 1, '#c8e05a')
    linea(g, gx + 7, gy - 4, gx + 9 + Math.round(Math.sin(tt * 2) * 2), gy - 9, 1, '#1a1a1e')
    // l'omino, col telefono
    ga.clearRect(0, 0, W, H)
    const x = Math.round(o.x)
    if (!o.nascosto) {
      const piedi = o.fase === 'panca' ? BASE + 9 : PIEDI // (sulla panchina: i piedi davanti all'asse, il sedere sull'asse)
      omino(ga, x, piedi, o.posa)
      // il telefono: all'orecchio o in mano (che vibra quando squilla)
      const dir = o.posa.vista === 'lato' ? (o.posa.dir ?? 1) : 1, m = o.posa.mani?.[0]
      if (m) {
        const vib = o.squilla ? Math.round(Math.sin(tt * 60)) : 0
        const px = x + m[0] * dir + vib, py = piedi + m[1]
        R(ga, px - 1, py - 3, 3, 6, '#1a1a22'); R(ga, px - 1, py - 3, 3, 1, '#3a3a44')
        if (o.telefono === 'mano') R(ga, px, py - 2, 1, 4, o.squilla && Math.sin(tt * 8) > 0 ? '#ccff00' : '#9fd4ff')
      }
      tingi(ga, C)
      g.drawImage(attori, 0, 0)
      // la luce del telefono sulla faccia, di sera
      if (notte && m) alone(g, x + m[0] * dir, piedi + m[1], 12, '#bfe0ff', 0.5)
      // il fiato col freddo, quando parla
      if (C.gradi < 7 && o.parla) for (let i = 0; i < 3; i++) { const a = ((tt * 1.5 + i / 3) % 1); g.fillStyle = `rgba(235,240,248,${(0.5 * (1 - a)).toFixed(2)})`; ellisse(g, x + dir * (5 + a * 9), piedi - 38 - a * 6, 1 + Math.round(a * 2), 1) }
    }
    // il tempo che fa, ma non sotto la tettoia
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.rect(TETTOIA[0], 137, TETTOIA[1] - TETTOIA[0], BASE - 137 + 30); g.clip('evenodd')
    tempo(g, C, tt, dt, H)
    g.restore()
    if (o.bolla) fumetto(g, o.bolla, x, (o.fase === 'panca' ? BASE + 9 : PIEDI) - 49 + (o.posa.giu ?? 0))
    // per la scritta al centro (scritta.js)
    return { fase: o.fase, bolla: o.bolla, parla: o.parla, ride: o.ride, ascolta: o.ascolta, squilla: !!o.squilla, chiamata: Math.max(0, tt - 3.4), notte, tempo: C.tempo, stagione: C.stagione, gradi: C.gradi }
  }
  return { tela: c, disegna, meteo(m) { if (m && JSON.stringify(m) !== JSON.stringify(met)) { met = m; chiave = '' } } }
}
