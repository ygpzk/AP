// Diretta OS · «sono a fare pipì»: il bosco, con il cielo di quando premi (le stelle e la luna vera di notte, il sole
// di giorno, il tramonto), il tempo che fa davvero (pioggia, nebbia, neve) e la stagione (adesso le foglie d'autunno).
// L'omino arriva di corsa, controlla che nessuno guardi, la fa contro l'albero grande, poi si siede sul ceppo a
// guardare le lucciole (lime, come pzkko) e il cielo. Il tempo della scena parte da quando hai premuto il tasto.

import { W, H, tela, semi, ss, lin, R, linea, ellisse, fumetto, cielo, dipingiCielo, scintille, astro, nuvole, tingi, alone, creaTempo, ERBA, mescola, scurisci } from './pixel.js'
import { albero, pino, cespuglio, ciuffo, fungo, sasso, tronco, chioma, rami } from './natura.js'
import { omino } from './omino.js'

const TX = 320, TB = 214 // l'albero grande: il centro del tronco e la base
const CEPPO = [234, 252] // dove si siede (fuori dal sentiero, se no ci passa sopra arrivando)
const ORIZZONTE = 186

export function crea({ seme = 7, meteo = null } = {}) {
  const [c, g] = tela(), [cs, gs] = tela(), [dietro, gd] = tela(), [davanti, gv] = tela(), [attori, ga] = tela(), [luci, gl] = tela()
  const tempo = creaTempo(seme)
  let chiave = '', C = null, met = meteo
  const caso = semi(seme * 31 + 5)
  const lucciole = Array.from({ length: 40 }, (_, i) => ({ x: 60 + caso() * 380, y: 120 + caso() * 130, vx: 0, vy: 0, f: caso() * 10, v: 0.6 + caso() * 0.8, i }))
  const foglie = Array.from({ length: 16 }, () => ({ x: 220 + caso() * 220, y: caso() * 220, v: 8 + caso() * 10, f: caso() * 6, col: ['#c45a1e', '#e0892a', '#eebc3c', '#9a3b17'][Math.floor(caso() * 4)] }))
  const fiati = []
  let fiatoFra = 0

  // ── il bosco fermo: si rifà quando cambia il minuto o il tempo ──
  function prepara(adesso) {
    C = cielo(adesso, met)
    const r = semi(seme), st = C.stagione, neve = C.tempo === 'neve', nebbia = C.tempo === 'nebbia' ? 0.45 : 0
    const orizzonte = C.colori[2]
    dipingiCielo(gs, C, H, seme)
    gd.clearRect(0, 0, W, H); gv.clearRect(0, 0, W, H)
    // le file di alberi lontani, chiare per la foschia
    const lontano1 = mescola(st === 'inverno' ? '#3b4a3c' : st === 'autunno' ? '#5a4a2a' : '#2f5a35', orizzonte, 0.55 + nebbia * 0.3)
    const lontano2 = mescola(st === 'inverno' ? '#2c3a2e' : st === 'autunno' ? '#4a3a22' : '#24482a', orizzonte, 0.32 + nebbia * 0.3)
    for (let x = -6; x < W + 6; x += 7 + Math.floor(r() * 6)) pino(gd, x, ORIZZONTE - 2, 22 + r() * 18, lontano1)
    for (let x = -4; x < W + 6; x += 9 + Math.floor(r() * 8)) {
      if (r() < 0.5) pino(gd, x, ORIZZONTE + 4, 30 + r() * 22, lontano2, mescola(lontano2, '#000000', 0.12))
      else chioma(gd, r, x, ORIZZONTE - 10 - r() * 10, 9 + r() * 6, 10 + r() * 6, [mescola(lontano2, '#000000', 0.1), lontano2, mescola(lontano2, '#ffffff', 0.08)], 0.7)
    }
    // il prato: dal lontano (più chiaro) al vicino
    const erba = ERBA[st].map((e) => (neve ? mescola(e, '#eef3f8', 0.85) : e))
    for (let y = ORIZZONTE; y < H; y++) {
      const k = (y - ORIZZONTE) / (H - ORIZZONTE)
      R(gd, 0, y, W, 1, mescola(mescola(erba[1], orizzonte, 0.25 * (1 - k) + nebbia * 0.3 * (1 - k)), erba[2], k * 0.7))
    }
    for (let i = 0; i < 1400; i++) { const y = ORIZZONTE + r() * (H - ORIZZONTE); R(gd, r() * W, y, 1, 1, r() < 0.5 ? erba[0] : erba[2]) }
    // il sentiero, dal basso a sinistra fino all'albero
    for (let y = TB - 4; y < H; y++) {
      const k = (y - TB + 4) / (H - TB + 4), cx = (TX - 14) +(90 - (TX - 14)) * Math.pow(k, 0.8), w = 10 + 46 * k
      R(gd, cx - w / 2, y, w, 1, neve ? '#d9dfe6' : mescola('#7a6048', '#6a523c', k))
      if (r() < 0.6) R(gd, cx - w / 2 + r() * w, y, 1, 1, neve ? '#c4ccd6' : '#8f7458')
    }
    // gli alberi di mezzo, poi l'albero grande
    const mezzo = [[34, 200, 70, 46], [96, 196, 82, 52], [168, 192, 60, 36], [430, 198, 84, 56], [470, 204, 70, 44], [232, 190, 50, 30]]
    for (const [x, y, a, l] of mezzo) albero(gd, r, x, y, a, l, st, neve, nebbia, orizzonte)
    if (st === 'autunno') for (let i = 0; i < 260; i++) R(gd, r() * W, ORIZZONTE + 6 + r() * (H - ORIZZONTE - 6), 1 + (r() < 0.3), 1, ['#b5521f', '#d9822b', '#e8b33a', '#8a3a1c'][Math.floor(r() * 4)])
    for (let i = 0; i < 90; i++) { const x = r() * W, y = ORIZZONTE + 8 + r() * (H - ORIZZONTE - 8); ciuffo(gd, x, y, r() < 0.5 ? erba[0] : erba[2], 3 + Math.floor(r() * 3)) }
    // il ramo del gufo, il tronco grande e la sua chioma (fuori dall'alto)
    linea(gd, TX - 8, 104, TX - 38, 94, 3, '#4a3627'); linea(gd, TX - 30, 96, TX - 42, 90, 2, '#4a3627')
    tronco(gd, r, TX, 10, TB, 24, '#4f3a2a')
    R(gd, TX - 4, 140, 5, 7, '#2e2219'); R(gd, TX - 3, 141, 3, 5, '#1d1611') // il buco nel tronco
    if (st === 'inverno') { rami(gd, r, TX, 40, 60, -Math.PI / 2 - 0.5, 8, '#4f3a2a'); rami(gd, r, TX, 40, 60, -Math.PI / 2 + 0.5, 8, '#4f3a2a') }
    else {
      let cols = { primavera: ['#3f8f34', '#5cb043', '#82cc5a', '#f4b6d2'], estate: ['#2a6326', '#367d2f', '#4c9a3c'], autunno: ['#8a3a17', '#c0561d', '#e0892a'] }[st]
      if (neve) cols = [...cols.slice(0, 3), '#f2f6fb']
      chioma(gd, r, TX + 4, 16, 128, 58, cols, 1.1)
    }
    // il ceppo dove si siede
    const [cx, cy] = CEPPO
    R(gd, cx - 9, cy - 14, 18, 12, '#5a4230'); R(gd, cx + 3, cy - 14, 6, 12, '#46331f'); R(gd, cx - 9, cy - 3, 18, 3, '#3a2a1c')
    ellisse(gd, cx, cy - 14, 9, 2, '#c49a6a'); ellisse(gd, cx, cy - 14, 6, 1, '#a8804f'); R(gd, cx - 1, cy - 14, 2, 1, '#8a6640')
    fungo(gd, cx + 13, cy - 1, true); fungo(gd, cx + 17, cy, true)
    sasso(gd, 140, 236, 12, 6); sasso(gd, 380, 226, 9, 5)
    if (st !== 'inverno' || !neve) { fungo(gd, TX + 22, TB + 3, false); fungo(gd, 70, 222, true) }
    // davanti: i cespugli in basso, sopra all'omino quando arriva
    const cesp = (st === 'inverno' ? ['#4f5a44', '#68735a', '#829072'] : st === 'autunno' ? ['#6a4a1f', '#8f6a2a', '#b8913f'] : ['#2f5a25', '#407a31', '#5a9a42']).map((x) => (neve ? mescola(x, '#f2f6fb', 0.5) : x))
    cespuglio(gv, r, 18, 274, 70, 34, cesp); cespuglio(gv, r, 462, 276, 80, 40, cesp); cespuglio(gv, r, 400, 280, 40, 22, cesp)
    for (let i = 0; i < 30; i++) ciuffo(gv, r() * W, H - r() * 6, erba[2], 5 + Math.floor(r() * 5))
    tingi(gd, C); tingi(gv, C)
  }

  // ── dove sta l'omino, cosa fa, cosa dice, secondo per secondo ──
  function scena(t) {
    const o = { x: 0, y: 0, posa: {}, bolla: null, pipi: 0, getto: false, seduto: false, fase: 'corre' }
    if (t < 7.6) { // arriva di corsa lungo il sentiero
      const k = t / 7.6
      o.x = -16 + (TX - 15 + 16) * k; o.y = 250 - 24 * ss(0, 1, k)
      o.posa = { vista: 'lato', dir: 1, passo: t * Math.PI * 2 * 2.3, busto: 0.12 }
      if (t > 2 && t < 4.5) o.bolla = 'SCAPPA!'
    } else if (t < 8.2) { o.x = TX - 15; o.y = 226; o.posa = { vista: 'lato', dir: 1 }; o.fase = 'arriva' }
    else if (t < 11.6) { // si gira verso l'albero e controlla che nessuno guardi
      o.x = TX - 15; o.y = 226; o.fase = t < 9.2 ? 'guarda-sx' : t < 10.2 ? 'guarda-dx' : 'controlla'
      o.posa = { vista: 'retro', testa: t < 9.2 ? -1 : t < 10.2 ? 1 : 0 }
      if (t > 10.2) o.bolla = '...'
    } else if (t < 38) { // la fa
      o.x = TX - 15; o.y = 226; o.getto = true; o.pipi = lin(11.6, 36, t); o.fase = t > 31 && t < 34.5 ? 'ahh' : 'fa'
      o.posa = { vista: 'retro', mani: [[3, -18], [-3, -18]], testa: t > 27 && t < 30 ? 'su' : 0 }
      if ((t > 13 && t < 16) || (t > 22 && t < 25)) o.bolla = 'PSSS'
      if (t > 31 && t < 34.5) o.bolla = 'AHH'
    } else if (t < 39.6) { // la scrollatina
      o.x = TX - 15 + (t < 38.8 ? Math.round(Math.sin(t * 40)) : 0); o.y = 226; o.pipi = 1; o.fase = 'scrolla'
      o.posa = { vista: 'retro', mani: t < 38.8 ? [[3, -18], [-3, -18]] : null }
    } else if (t < 40.4) { o.x = TX - 15; o.y = 226; o.pipi = 1; o.posa = { vista: 'fronte' }; o.bolla = 'FATTO'; o.fase = 'fatto' }
    else if (t < 44.6) { // va al ceppo
      const k = ss(0, 1, (t - 40.4) / 4.2)
      o.x = TX - 15 + (CEPPO[0] - TX + 15) * k; o.y = 226 + (CEPPO[1] - 226) * k; o.pipi = 1; o.fase = 'al-ceppo'
      o.posa = { vista: 'lato', dir: -1, passo: t * Math.PI * 2 * 1.4 }
    } else { // seduto sul ceppo: guarda il cielo, le lucciole, il telefono
      o.x = CEPPO[0]; o.y = CEPPO[1]; o.pipi = 1; o.seduto = true; o.fase = 'ceppo'
      const s = (t - 44.6) % 18, giu = Math.round(6 * ss(44.6, 45.3, t))
      const notte = C.buio > 0.45, telefono = s > 9 && s < 14
      o.posa = { vista: 'fronte', giu, testa: s < 6 && (notte || C.tempo === 'sole') ? 'su' : 0, mani: telefono ? [[2, -16], [-2, -16]] : null, occhi: (t % 3.7) < 0.15 ? 0 : 1 }
      o.telefono = telefono
      if (s > 1.5 && s < 4.5) o.bolla = notte && C.stelle > 0.4 ? 'CHE STELLE' : C.tempo === 'pioggia' || C.tempo === 'temporale' ? 'PIOVE...' : C.tempo === 'nebbia' ? 'NEBBIA' : notte ? 'BUIO...' : 'SI STA BENE'
      if (s > 15 && s < 17.5 && notte) o.bolla = '♥'
    }
    return o
  }

  function disegna(t, adesso, dt = 1 / 30) {
    const k = `${adesso.getHours()}:${adesso.getMinutes()}|${met?.icona}|${met?.gradi}`
    if (k !== chiave) { chiave = k; prepara(adesso) }
    const o = scena(t), notte = C.buio > 0.45
    // il cielo, le stelle che brillano, la luna vera (o il sole), le nuvole
    g.drawImage(cs, 0, 0)
    scintille(g, C, t, ORIZZONTE, seme + 3)
    // (all'orizzonte, quando tramonta, sta dietro agli alberi lontani, come davvero)
    const mx = 46 + ((notte ? C.luna.est : C.sole.est) + 1) * 70, my = Math.max(18, ORIZZONTE - 18 - Math.max(0, notte ? C.luna.alt : C.sole.alt) * 3.4)
    astro(g, C, mx, my, t)
    nuvole(g, C, t, ORIZZONTE, seme + 9)
    g.drawImage(dietro, 0, 0)

    // chi si muove: l'omino, la pozzanghera, il gufo (si tingono con la luce dell'ora)
    ga.clearRect(0, 0, W, H)
    if (o.pipi > 0) { // la pozzanghera alla base del tronco, e la corteccia bagnata
      const p = Math.min(1, o.pipi)
      ellisse(ga, TX - 6, TB + 3, Math.round(2 + 9 * p), Math.round(1 + 2 * p), '#c9b44a'); ellisse(ga, TX - 6, TB + 3, Math.round(1 + 6 * p), Math.round(1 + p), '#e3d06a')
      R(ga, TX - 9, TB - 16, 5, Math.round(14 * p), 'rgba(40,28,18,0.55)')
    }
    // il gufo di notte sul ramo (ti guarda mentre la fai), di giorno un pettirosso
    if (notte) {
      const gx = TX - 36, gy = 84, guarda = o.getto && t > 15 ? -1 : 0, chiude = (t % 4.3) < 0.18
      R(ga, gx - 4, gy, 9, 10, '#6b5032'); R(ga, gx - 3, gy + 4, 7, 6, '#9a7a52'); R(ga, gx - 4, gy - 2, 2, 2, '#6b5032'); R(ga, gx + 3, gy - 2, 2, 2, '#6b5032')
      for (const ex of [gx - 3, gx + 1]) { R(ga, ex, gy + 1, 3, 3, chiude ? '#6b5032' : '#f2d23a'); if (!chiude) R(ga, ex + 1 + guarda * 0 + (guarda < 0 ? 1 : 0), gy + 2, 1, 1, '#120e16') }
      R(ga, gx, gy + 4, 1, 1, '#d08a2a')
      if (o.getto && t > 20 && t < 22.5) fumetto(ga, '?', gx, gy - 4)
    } else {
      const bx = TX - 30 + Math.round(Math.sin(t * 0.7) * 6), by = 90 - (Math.sin(t * 5) > 0.92 ? 2 : 0)
      R(ga, bx - 3, by - 3, 6, 4, '#6a5a4a'); R(ga, bx - 3, by - 1, 4, 3, '#e06a2a'); R(ga, bx + 2, by - 3, 2, 2, '#6a5a4a'); R(ga, bx + 4, by - 2, 1, 1, '#d0a040'); R(ga, bx + 2, by - 3, 1, 1, '#120e16')
      if (o.getto && t > 19 && t < 21.5) fumetto(ga, 'CIP?', bx, by - 5)
    }
    omino(ga, Math.round(o.x), Math.round(o.y), o.posa)
    // il fiato quando fa freddo
    if (C.gradi < 9 && (o.posa.vista === 'fronte' || o.posa.vista === 'lato')) {
      fiatoFra -= dt
      if (fiatoFra <= 0) { fiatoFra = 2.6 + Math.random(); fiati.push({ x: o.x + (o.posa.vista === 'lato' ? (o.posa.dir ?? 1) * 7 : 0), y: o.y - (o.seduto ? 32 : 38) + (o.posa.giu ?? 0), v: 0 }) }
    }
    tingi(ga, C)
    g.drawImage(attori, 0, 0)
    // il getto: un archetto giallo che spunta di fianco, contro il tronco (si vede appena)
    if (o.getto && t > 12) {
      const f = Math.sin(t * 30) > 0 ? 1 : 0
      ga.clearRect(0, 0, W, H)
      linea(ga, o.x + 6, o.y - 19, o.x + 8, o.y - 20, 1, '#f0dc5a'); linea(ga, o.x + 8, o.y - 20, o.x + 10, o.y - 18 - f, 1, '#f0dc5a')
      R(ga, o.x + 10, o.y - 18 + (f ? 0 : 2), 1, 1, '#fff3a8'); R(ga, o.x + 9 + f, o.y - 15, 1, 1, '#f0dc5a')
      tingi(ga, C); g.drawImage(attori, 0, 0)
    }
    g.drawImage(davanti, 0, 0)

    // le foglie che cadono (autunno)
    if (C.stagione === 'autunno' && C.tempo !== 'neve') for (const f of foglie) {
      f.y += f.v * dt; f.x += Math.sin(t * 1.6 + f.f) * 12 * dt - (C.vento > 20 ? 18 * dt : 0)
      if (f.y > H) { f.y = 40 + Math.random() * 20; f.x = 200 + Math.random() * 260 }
      if (f.x < -4) f.x = W
      R(g, f.x, f.y, Math.sin(t * 4 + f.f) > 0 ? 2 : 1, 1, notte ? mescola(f.col, '#1b2550', 0.6) : f.col)
    }
    // il fiato e il vapore della pozzanghera, quando fa freddo
    for (const f of fiati) { f.v += dt; f.y -= 6 * dt; f.x += 2 * dt }
    while (fiati.length && fiati[0].v > 1.6) fiati.shift()
    for (const f of fiati) { g.fillStyle = `rgba(235,240,250,${(0.55 * (1 - f.v / 1.6)).toFixed(2)})`; ellisse(g, f.x, f.y, 1 + Math.round(f.v * 2), 1 + Math.round(f.v)) }
    if (o.pipi > 0.1 && C.gradi < 9) for (let i = 0; i < 3; i++) { const v = ((t * 0.5 + i / 3) % 1); g.fillStyle = `rgba(235,240,250,${(0.3 * (1 - v) * Math.min(1, o.pipi * 2)).toFixed(2)})`; ellisse(g, TX - 6 + Math.sin(t + i) * 3, TB - v * 14, 1 + Math.round(v * 2), 1) }

    // le lucciole (di sera e di notte), le farfalle di giorno
    if (C.buio > 0.3) {
      gl.clearRect(0, 0, W, H)
      const n = C.stagione === 'estate' ? 40 : 26, verso = o.seduto ? [o.x, o.y - 26] : null
      for (const l of lucciole.slice(0, n)) {
        l.vx += (Math.random() - 0.5) * 30 * dt; l.vy += (Math.random() - 0.5) * 30 * dt
        if (verso && l.i < 12) { l.vx += (verso[0] + Math.cos(t * 0.3 + l.i) * 24 - l.x) * 0.25 * dt; l.vy += (verso[1] + Math.sin(t * 0.4 + l.i * 2) * 16 - l.y) * 0.25 * dt }
        l.vx *= 0.97; l.vy *= 0.97; l.x += l.vx * dt * l.v; l.y += l.vy * dt * l.v
        if (l.y < 100) l.vy += 6 * dt; if (l.y > H - 6) l.vy -= 6 * dt; if (l.x < 4) l.vx += 6 * dt; if (l.x > W - 4) l.vx -= 6 * dt
        const acc = Math.max(0, Math.sin(t * 1.3 * l.v + l.f)) ** 2 * C.buio
        if (acc < 0.05) continue
        alone(gl, l.x, l.y, 7, '#c8ff3a', acc * 0.9)
        gl.fillStyle = `rgba(236,255,160,${acc.toFixed(2)})`; gl.fillRect(Math.round(l.x), Math.round(l.y), 1, 1)
      }
      // quella che gli si posa sulla testa
      if (o.seduto && t > 60) { const acc = 0.5 + 0.5 * Math.sin(t * 2); alone(gl, o.x + 2, o.y - 44 + (o.posa.giu ?? 0), 8, '#c8ff3a', acc); gl.fillStyle = '#ecffa0'; gl.fillRect(o.x + 2, o.y - 44 + (o.posa.giu ?? 0), 1, 1) }
      g.drawImage(luci, 0, 0)
    } else if (C.buio < 0.15 && (C.tempo === 'sole' || C.tempo === 'nuvolo')) {
      // le farfalle: le ali si aprono (larghe e basse) e si chiudono (strette e alte)
      for (let i = 0; i < 3; i++) {
        const x = Math.round(150 + i * 105 + Math.sin(t * 0.45 + i * 2) * 46), y = Math.round(196 + Math.sin(t * 0.8 + i) * 18 + Math.sin(t * 3 + i) * 2), apre = Math.sin(t * 12 + i * 1.7) > 0
        const [a, b] = [['#ffffff', '#d8dde6'], ['#f4d03a', '#d9a520'], ['#ff9a3a', '#d9661e']][i]
        if (apre) { R(g, x - 3, y - 2, 3, 2, a); R(g, x + 1, y - 2, 3, 2, a); R(g, x - 2, y, 2, 1, b); R(g, x + 1, y, 2, 1, b) } else { R(g, x - 1, y - 4, 1, 4, a); R(g, x + 1, y - 4, 1, 4, b) }
        R(g, x, y - 2, 1, 3, '#2a2228')
      }
    }
    // la luce del telefono sulla faccia
    if (o.telefono) { alone(g, o.x, o.y - 18 + (o.posa.giu ?? 0), notte ? 22 : 10, '#bfe0ff', notte ? 0.9 : 0.3); R(g, o.x - 2, o.y - 18 + (o.posa.giu ?? 0), 4, 2, '#e8f4ff') }

    tempo(g, C, t, dt, H)
    if (o.bolla) fumetto(g, o.bolla, Math.round(o.x), Math.round(o.y - 48 + (o.posa.giu ?? 0)))
    // per la scritta al centro (scritta.js): a che punto è, cosa dice, com'è fuori
    return { fase: o.fase, bolla: o.bolla, pipi: o.pipi, telefono: !!o.telefono, notte, stagione: C.stagione, tempo: C.tempo, stelle: C.stelle }
  }
  return { tela: c, disegna, meteo(m) { if (m && JSON.stringify(m) !== JSON.stringify(met)) { met = m; chiave = '' } } }
}
