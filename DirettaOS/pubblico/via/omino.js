// Diretta OS · l'omino delle scene: Giugnoh in pixel art (i capelli castani tirati indietro, il maglione grigio scuro con
// la zip, i jeans, le scarpe bianche). Di lato, di fronte e di schiena; le braccia vanno dove gli dici di mettere le
// mani, le gambe camminano da sole col passo. Si disegna su una tela sua, poi prende il contorno scuro e va nella scena.
//
// omino(g, x, y, posa): x, y sono i piedi (y è il pavimento). La posa:
//   vista 'lato' | 'fronte' | 'retro', dir 1 (guarda a destra) | -1, passo (fase del passo, in radianti) o null,
//   mani [[x, y] | null, [x, y] | null] dove mettere la mano davanti e quella dietro (rispetto ai piedi, x verso dove
//   guarda), giu (quanto si abbassa, in pixel), busto (quanto si piega in avanti, radianti), seduto (solo il busto),
//   occhi (0 chiusi), bocca (0 chiusa, 1 aperta), testa ('su', 'giu', -1/1 girata di lato nella vista retro/fronte)

import { tela, linea, R, figura, metti, contorno, SCURO } from './pixel.js'

const C = {
  h: '#5b3d26', H: '#3f2918', l: '#7d5835', s: '#efc19e', o: '#d39b77', e: '#1d1a24', m: '#8a3a32', w: '#ffffff',
  maglia: '#3c3b41', magliaS: '#2c2b31', magliaL: '#4e4d55', zip: '#c9c9d2', jeans: '#34476f', jeansS: '#27365a', scarpa: '#f2f2f2', suola: '#b4b8c2',
}
const PAL = { h: C.h, H: C.H, l: C.l, s: C.s, o: C.o, e: C.e, m: C.m, w: C.w }
const TESTE = {
  lato: [
    '...hhhhhh...',
    '.hhhllllhhh.',
    'hhhhhhhhhhhh',
    'hhhhhhhhhhh.',
    'hhhhhhhhsss.',
    'hHhhhhssssss',
    'hHHhoosssess',
    'hHHhoossssss',
    '.HHhsssssssss',
    '..Hhsssssss.',
    '...osssssm..',
    '....ooooo...',
  ],
  fronte: [
    '...hhhhhh...',
    '.hhllllllhh.',
    'hhhhhhhhhhhh',
    'hhhhhhhhhhhh',
    'hhssshhhhhhh',
    'hsssssssshhh',
    'ossessssesso',
    'ossessssesso',
    'osssssosssso',
    '.ssssmmssss.',
    '..ssssssss..',
    '...oooooo...',
  ],
  retro: [
    '...hhhhhh...',
    '.hhhllllhhh.',
    'hhhhhhhhhhhh',
    'hhhhhhhhhhhh',
    'hhhhhhhhhhhh',
    'hhhhhhhhhhhh',
    'ohhhhhhhhhho',
    'ohhhhhhhhhho',
    '.hHhhhhhhHh.',
    '.HHHhhhhHHH.',
    '..sooooooos.',
    '...oooooo...',
  ],
}
// la testa girata di lato nella vista di schiena (si vede l'orecchio e un po' di guancia)
const RETRO_GIRATA = TESTE.retro.map((r, i) => (i >= 5 && i <= 9 ? r.slice(0, 10) + (i === 7 ? 'so' : i === 8 ? 's.' : 'oo') : r))

// le braccia: dove sta il gomito per arrivare con la mano lì (due pezzi, si piega verso «piega»)
function gomito(sx, sy, hx, hy, l1, l2, piega) {
  const dx = hx - sx, dy = hy - sy, d = Math.min(l1 + l2 - 0.01, Math.max(0.01, Math.hypot(dx, dy)))
  const a = Math.atan2(dy, dx), b = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
  const k = a + b * piega
  const ex = sx + Math.cos(k) * l1, ey = sy + Math.sin(k) * l1
  // se la mano è più lontana del braccio, ci arriva fin dove può
  const fx = ex + (hx - ex) * Math.min(1, l2 / Math.max(0.01, Math.hypot(hx - ex, hy - ey))), fy = ey + (hy - ey) * Math.min(1, l2 / Math.max(0.01, Math.hypot(hx - ex, hy - ey)))
  return [ex, ey, fx, fy]
}

const [foglio, fg] = tela(44, 64), [bordo] = tela(46, 66)
const OX = 22, OY = 60 // i piedi, sul foglio

function gamba(g, hx, hy, piede, col, dir) {
  // dall'anca al piede, il ginocchio si piega in avanti
  const [kx, ky, fx, fy] = gomito(hx, hy, piede[0], piede[1], 8, 8.5, -dir)
  linea(g, hx, hy, kx, ky, 4, col); linea(g, kx, ky, fx, fy, 4, col)
  return [fx, fy]
}
function scarpa(g, fx, fy, dir) {
  const x = Math.round(fx), y = Math.round(fy)
  R(g, dir > 0 ? x - 2 : x - 3, y - 1, 6, 2, C.scarpa); R(g, dir > 0 ? x - 2 : x - 3, y + 1, 6, 1, C.suola)
}
function braccio(g, sx, sy, mano, col, dir, dove = null) {
  // (il gomito si può dare: per portare la mano alla bocca sta in basso, e da solo non lo sceglierebbe)
  const [ex, ey, hx, hy] = dove ? [dove[0], dove[1], mano[0], mano[1]] : gomito(sx, sy, mano[0], mano[1], 6.5, 6, dir)
  linea(g, sx, sy, ex, ey, 3, col); linea(g, ex, ey, hx, hy, 3, col)
  R(g, Math.round(hx) - 1, Math.round(hy) - 1, 3, 3, C.s)
}

export function omino(g, x, y, p = {}) {
  const vista = p.vista ?? 'lato', dir = p.dir ?? 1, giu = p.giu ?? 0, busto = p.busto ?? 0
  fg.clearRect(0, 0, foglio.width, foglio.height)
  const passo = p.passo
  const ondeggia = passo == null ? 0 : -Math.round(Math.abs(Math.cos(passo)) * 1)
  const hy = OY - 19 + giu + ondeggia // l'anca
  const sporge = (h) => Math.round(h * Math.sin(busto)) // quanto il busto va avanti a quell'altezza
  const top = hy - 13 * Math.cos(busto)

  if (vista === 'lato') {
    // (sul foglio si disegna sempre verso destra: lo specchio, se serve, lo fa metti())
    const piedi = p.piedi ?? (passo == null
      ? [[OX + 1, OY - 3], [OX - 1, OY - 3]]
      : [0, Math.PI].map((f) => { const s = Math.sin(passo + f), su = Math.max(0, Math.cos(passo + f)); return [OX + 6 * s, OY - 3 - su * 2.5] }))
    const spallaX = OX + sporge(11), spallaY = Math.round(top) + 2
    const mani = p.mani ?? [null, null]
    const pendolo = (f) => passo == null ? [spallaX + 1, spallaY + 12] : [spallaX + 4.5 * Math.sin(passo + f + Math.PI), spallaY + 11.5 - Math.abs(Math.sin(passo + f)) * 1.2]
    const manoDietro = mani[1] ? [OX + mani[1][0], OY + mani[1][1]] : pendolo(Math.PI)
    const manoDavanti = mani[0] ? [OX + mani[0][0], OY + mani[0][1]] : pendolo(0)
    // dietro: il braccio e la gamba più scuri
    braccio(fg, spallaX - 1, spallaY, manoDietro, C.magliaS, 1)
    const f2 = gamba(fg, OX - 1, hy, piedi[1], C.jeansS, 1); scarpa(fg, f2[0], f2[1], 1)
    // il busto: il maglione, una riga alla volta (così si piega a pixel)
    for (let r = 0; r <= 13; r++) {
      const yy = Math.round(hy - r * Math.cos(busto)), xx = OX + sporge(r)
      R(fg, xx - 4, yy, 8, 1, C.maglia); R(fg, xx - 4, yy, 2, 1, C.magliaS)
      if (r > 8) R(fg, xx + 3, yy, 1, 1, C.magliaL)
    }
    R(fg, OX + sporge(13) + 1, Math.round(top), 3, 2, C.magliaL) // il collo alto della zip
    R(fg, OX + sporge(12) + 3, Math.round(top) + 2, 1, 4, C.zip)
    R(fg, OX + sporge(1) - 4, hy - 1, 8, 2, C.jeans) // la cintura dei jeans
    const f1 = gamba(fg, OX + 1, hy, piedi[0], C.jeans, 1); scarpa(fg, f1[0], f1[1], 1)
    // la testa
    const tx = OX + sporge(14) - 6, ty = Math.round(top) - 12
    R(fg, OX + sporge(13) - 1, Math.round(top) - 1, 3, 2, C.o)
    fg.drawImage(figura(TESTE.lato.map((r) => (p.occhi === 0 ? r.replace('e', 's') : r)).map((r) => (p.bocca ? r.replace('m', 'e') : r)), PAL), tx, ty + (p.testa === 'giu' ? 1 : p.testa === 'su' ? -1 : 0))
    braccio(fg, spallaX + 1, spallaY, manoDavanti, C.maglia, 1)
  } else {
    // di fronte o di schiena: le gambe sono due colonne, il passo le alza a turno
    const retro = vista === 'retro'
    const seduto = !!p.seduto
    const alza = (f) => passo == null ? 0 : Math.max(0, Math.sin(passo + f)) * 2
    if (!seduto) {
      for (const [lx, f] of [[-5, 0], [1, Math.PI]]) {
        const su = alza(f)
        R(fg, OX + lx, hy, 4, 16 - su - giu, lx < 0 ? C.jeans : C.jeansS)
        R(fg, OX + lx - (lx < 0 ? 1 : 0), OY - 3 - su, 5, 2, C.scarpa); R(fg, OX + lx - (lx < 0 ? 1 : 0), OY - 1 - su, 5, 1, C.suola)
      }
    }
    const by = seduto ? OY - 14 : hy
    const sy = by - 12, mani = p.mani ?? [null, null]
    const pend = (f) => [0, passo == null ? 0 : Math.sin(passo + f) * 1.5]
    // le braccia: davanti al busto se le mani sono davanti, se no ai fianchi. Di schiena, quelle che vanno in avanti
    // stanno dietro al busto: si disegnano prima
    const destra = mani[0] ? [OX + mani[0][0], OY + mani[0][1]] : [OX + 7, sy + 12 + pend(0)[1]]
    const sinistra = mani[1] ? [OX + mani[1][0], OY + mani[1][1]] : [OX - 8, sy + 12 + pend(Math.PI)[1]]
    const gomiti = (p.gomiti ?? [null, null]).map((e) => e && [OX + e[0], OY + e[1]])
    const braccia = () => { braccio(fg, OX + 6, sy, destra, retro ? C.magliaS : C.maglia, 1, gomiti[0]); braccio(fg, OX - 7, sy, sinistra, retro ? C.magliaS : C.maglia, -1, gomiti[1]) }
    if (retro) braccia()
    for (let r = 0; r <= 13; r++) {
      const w = r < 3 ? 10 : 12, yy = by - r
      R(fg, OX - w / 2, yy, w, 1, C.maglia); R(fg, OX - w / 2, yy, 1, 1, C.magliaS); R(fg, OX + w / 2 - 1, yy, 1, 1, C.magliaS)
    }
    if (!retro) { R(fg, OX - 3, by - 14, 6, 2, C.magliaL); R(fg, OX - 1, by - 12, 1, 6, C.zip) } else R(fg, OX - 3, by - 14, 6, 2, C.magliaS)
    R(fg, OX - 5, by - 1, 10, 2, C.jeans)
    if (!retro) braccia()
    R(fg, OX - 1, by - 15, 3, 2, C.o)
    let t = TESTE[vista]
    if (retro && p.testa) t = p.testa < 0 ? RETRO_GIRATA.map((r) => [...r].reverse().join('')) : RETRO_GIRATA
    if (!retro) t = t.map((r) => (p.occhi === 0 ? r.replace(/e/g, 'o') : r)).map((r) => (p.bocca ? r.replace(/m/g, 'e') : r))
    const dy = p.testa === 'su' ? -1 : p.testa === 'giu' ? 1 : 0
    fg.drawImage(figura(t, PAL), OX - 6 + (!retro && typeof p.testa === 'number' ? p.testa : 0), by - 27 + dy)
    // (le mani davanti al busto vanno sopra, se no la maglia le copre)
    if (mani[0] && !retro) braccio(fg, OX + 6, sy, destra, C.maglia, 1, gomiti[0])
  }
  contorno(foglio, bordo)
  const d = vista === 'lato' ? dir : 1
  metti(g, bordo, d > 0 ? x - OX - 1 : x - (bordo.width - OX - 2), y - OY - 1, d)
}

export const ALTEZZA = 44
