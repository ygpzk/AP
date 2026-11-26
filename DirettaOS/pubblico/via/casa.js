// Diretta OS · «sono andato a prendere qualcosa da mangiare / da bere»: tutto in due minuti. L'omino esce
// dall'ufficio, fa i 50 metri fino a casa nella campagna (i pioppi, il campanile, la barchessa, l'orto con le zucche,
// il trattore; il cielo e il tempo di adesso), entra, cerca in frigo e negli sportelli, trova qualcosa (un oggetto
// vero di pzkko, scelto secondo l'ora) e si siede al tavolo a mangiare o a bere. Dopo i due minuti resta lì.
// La Red Bull (cosa 'redbull') è la stessa strada, ma in cucina sa dov'è: dritto al frigo, la lattina di pzkko con l'ala,
// «PSST!», un sorso lungo… e gli spuntano le ali (si alza da terra); poi al tavolo, carico.
// Fuori si disegna a 480 × 270; dentro la cucina è più vicina, a 240 × 135, e si ingrandisce il doppio.

import { W, H, tela, semi, ss, lin, R, linea, ellisse, fumetto, scrivi, largo, cielo, dipingiCielo, scintille, astro, nuvole, tingi, alone, creaTempo, ERBA, mescola, scurisci, schiarisci, SCURO } from './pixel.js'
import { pioppo, cespuglio, ciuffo, chioma } from './natura.js'
import { omino } from './omino.js'

// ── fuori: 24 pixel al metro, come l'omino (1,80 m = 44 pixel) ──
const WM = 1540, PIEDI = 229, UFF = 170, CASA = 1370 // la porta dell'ufficio e quella di casa: 1200 pixel, 50 metri
const PL = 0.25, PM = 0.6 // quanto scorrono il lontano e il mezzo rispetto al vicino
const A_CASA = 38.8 // quando arriva alla porta di casa (1,4 m al secondo)
const DENTRO = 41.2 // quando si è dentro
// ── dentro: la cucina ──
const IW = 240, IH = 135, BL = 100, IP = 104 // il fondo dove stanno i mobili, i piedi
const FRIGO = 192, PENSILE = 152, BASSO = 138, FORNO = 101, TAVOLO = 64
const OROL = [104, 40] // l'orologio con l'ora vera

const ORA = (h) => (h >= 5 && h < 11 ? 'mattina' : h < 15 ? 'pranzo' : h < 18 ? 'merenda' : h < 23 ? 'cena' : 'notte')
const CIBI = {
  mattina: [['chat-attrezzi/cornetto', 'un cornetto!', 'piatto'], ['chat-cibo/sbrisolona', 'la sbrisolona!', 'piatto']],
  pranzo: [['chat-cibo/tortelli', 'i tortelli di zucca!', 'microonde'], ['chat-cucina/risotto', 'il risotto!', 'microonde'], ['chat-cucina/salamella', 'la salamella!', 'microonde']],
  merenda: [['chat-cibo/sbrisolona', 'la sbrisolona!', 'piatto'], ['chat-cibo/grissini', 'i grissini!', 'piatto'], ['chat-cucina/amaretti', 'gli amaretti!', 'piatto'], ['chat-cibo/frutti-bosco', 'i frutti di bosco!', 'piatto']],
  cena: [['chat-cibo/tortelli', 'i tortelli di zucca!', 'microonde'], ['chat-cibo/ramen', 'un ramen!', 'microonde'], ['chat-cucina/risotto', 'il risotto!', 'microonde']],
  notte: [['chat-cibo/ramen', 'un ramen!', 'microonde'], ['chat-attrezzi/mortadella', 'la mortadella!', 'piatto'], ['chat-cibo/sbrisolona', 'la sbrisolona!', 'piatto'], ['chat-cucina/parmigiano', 'il parmigiano!', 'piatto']],
}
const BEVANDE = [['chat-cibo/pzk-kola', 'una pzk-kola!'], ['chat-cibo/estathe', 'un estathé!'], ['chat-attrezzi/lattina', 'una lattina!']]

export function crea({ cosa = 'mangiare', seme = 7, meteo = null } = {}) {
  const rb = cosa === 'redbull', bere = cosa === 'bere' || rb
  const [c, g] = tela()
  const [cs, gs] = tela(), [lontano, glo] = tela(Math.ceil(W + (WM - W) * PL), H), [mezzo, gme] = tela(Math.ceil(W + (WM - W) * PM), H)
  const [vicino, gvi] = tela(WM, H), [attori, ga] = tela(), [cucina, gcu] = tela(IW, IH), [dentro, gde] = tela(IW, IH), [finestra, gfi] = tela()
  const tempo = creaTempo(seme)
  let chiave = '', C = null, met = meteo, scelta = null, fumo = []
  const caso = semi(seme * 13 + 1)

  // ── fuori, fermo: si rifà ogni minuto (la luce cambia) ──
  function prepara(adesso) {
    C = cielo(adesso, met)
    if (!scelta) { // cosa trova: deciso una volta, col seme (la regia e Camo trovano la stessa cosa)
      const l = bere ? BEVANDE : CIBI[ORA(adesso.getHours())]
      const [src, nome, dopo] = l[Math.floor(caso() * l.length)]
      scelta = rb ? { src: '/art/chat-attrezzi/lattina.webp', nome: 'una Red Bull!', dopo: 'lattina' } : { src: `/art/${src}.webp`, nome, dopo: bere ? 'bicchiere' : dopo }
    }
    const r = semi(seme), st = C.stagione, neve = C.tempo === 'neve', nebbia = C.tempo === 'nebbia' ? 0.5 : 0, oriz = C.colori[2], notte = C.buio > 0.45
    const erba = ERBA[st].map((e) => (neve ? mescola(e, '#eef3f8', 0.85) : e))
    dipingiCielo(gs, C, H, seme)
    // il lontano: i campi della pianura, le file di pioppi, una cascina, il campanile
    glo.clearRect(0, 0, lontano.width, H)
    const sf = (col, k) => mescola(col, oriz, Math.min(0.9, k + nebbia * 0.35))
    for (let y = 176; y < H; y++) R(glo, 0, y, lontano.width, 1, sf(erba[(Math.floor((y - 176) / 3) % 2) ? 1 : 0], 0.5 - (y - 176) / 200))
    for (let x = 0; x < lontano.width; x += 0) { const n = 6 + Math.floor(r() * 12); for (let i = 0; i < n; i++) pioppo(glo, r, x + i * 5, 178, 26 + r() * 8, [sf(st === 'autunno' ? '#8a7a2a' : st === 'inverno' ? '#5a5048' : '#3f6a34', 0.45), sf(st === 'autunno' ? '#a8923a' : st === 'inverno' ? '#6a6058' : '#4f7f40', 0.45)]); x += n * 5 + 30 + r() * 80 }
    const cas = 300; R(glo, cas, 162, 60, 16, sf('#d9c7a0', 0.45)); R(glo, cas - 3, 157, 66, 6, sf('#a85a3a', 0.45)); R(glo, cas + 40, 150, 20, 12, sf('#d9c7a0', 0.45)); R(glo, cas + 38, 146, 24, 5, sf('#a85a3a', 0.45))
    if (notte) for (const x of [cas + 8, cas + 22, cas + 46]) R(glo, x, 167, 2, 2, '#ffd27a')
    const cam = 560; R(glo, cam, 120, 10, 58, sf('#c9a27a', 0.4)); R(glo, cam + 2, 128, 6, 6, sf('#5a4a3a', 0.4)); linea(glo, cam - 1, 120, cam + 5, 106, 2, sf('#8a5a3a', 0.4)); linea(glo, cam + 11, 120, cam + 5, 106, 2, sf('#8a5a3a', 0.4)); R(glo, cam + 1, 116, 8, 4, sf('#8a5a3a', 0.4))
    tingi(glo, C, lontano.width)
    // il mezzo: siepi, i gelsi, la barchessa coi suoi archi
    gme.clearRect(0, 0, mezzo.width, H)
    const siepe = (st === 'inverno' ? ['#4a5040', '#5a6250', '#6a725e'] : st === 'autunno' ? ['#5a5a28', '#7a7230', '#9a8a3a'] : ['#2f5228', '#3f6a32', '#55843f']).map((x) => sf(x, 0.25))
    for (let x = -10; x < mezzo.width + 10; x += 14 + r() * 20) cespuglio(gme, r, x, 210, 24 + r() * 16, 10 + r() * 6, siepe)
    for (const x of [120, 380, 820, 1010]) { R(gme, x, 172, 3, 34, sf('#4a3a2c', 0.2)); chioma(gme, r, x + 1, 168, 14, 11, (st === 'autunno' ? ['#7a6a20', '#a08a2a', '#c4a83a'] : st === 'inverno' ? ['#4a3a2c', '#4a3a2c', '#5a4a3a'] : ['#2f5a28', '#3f7a32', '#58943f']).map((x) => sf(x, 0.2)), 0.8) }
    const bx = 560; R(gme, bx, 160, 140, 48, sf('#a8553a', 0.2)); R(gme, bx - 6, 152, 152, 9, sf('#8a3e2a', 0.2))
    for (let i = 0; i < 5; i++) { const ax = bx + 8 + i * 27; R(gme, ax, 176, 20, 32, sf('#3a2a22', 0.2)); ellisse(gme, ax + 10, 177, 10, 4, sf('#3a2a22', 0.2)) }
    for (let i = 0; i < 40; i++) R(gme, bx + r() * 140, 162 + r() * 44, 3, 1, sf('#8f4630', 0.2))
    tingi(gme, C, mezzo.width)
    // il vicino: il prato, il vialetto, l'ufficio, l'orto, il trattore, i lampioni, la casa
    gvi.clearRect(0, 0, WM, H)
    for (let y = 204; y < H; y++) R(gvi, 0, y, WM, 1, mescola(mescola(erba[1], oriz, 0.15 * (1 - (y - 204) / 66) + nebbia * 0.2), erba[2], (y - 204) / 90))
    for (let i = 0; i < 3000; i++) R(gvi, r() * WM, 204 + r() * 66, 1, 1, r() < 0.5 ? erba[0] : erba[2])
    for (let i = 0; i < 160; i++) ciuffo(gvi, r() * WM, 210 + r() * 58, r() < 0.5 ? erba[0] : erba[2], 3 + Math.floor(r() * 3))
    if (st === 'autunno') for (let i = 0; i < 400; i++) R(gvi, r() * WM, 206 + r() * 64, 1, 1, ['#b5521f', '#d9822b', '#e8b33a'][Math.floor(r() * 3)])
    // il fosso davanti, con l'acqua che fa da specchio al cielo e le canne (la pianura è piena di fossi)
    const fy = 252
    for (let y = fy; y < fy + 8; y++) R(gvi, 0, y, WM, 1, mescola(C.colori[2], '#24323e', 0.35 + (y - fy) * 0.06))
    R(gvi, 0, fy - 1, WM, 1, mescola(erba[2], '#3a2a1a', 0.45)); R(gvi, 0, fy + 8, WM, 2, mescola(erba[2], '#3a2a1a', 0.45))
    for (let i = 0; i < 160; i++) R(gvi, r() * WM, fy + 1 + r() * 6, 3 + r() * 7, 1, mescola(C.colori[1], '#ffffff', 0.35))
    for (let x = 0; x < WM; x += 3 + r() * 10) { const h = 7 + r() * 10; R(gvi, x, fy - h, 1, h, st === 'inverno' ? '#8a7a5a' : st === 'autunno' ? '#a08a4a' : '#4f7a34'); if (r() < 0.35) R(gvi, x, fy - h - 3, 2, 4, '#6a4a2a') }
    // il vialetto di ghiaia
    R(gvi, UFF - 20, PIEDI - 7, CASA - UFF + 40, 13, neve ? '#e3e8ee' : '#b9ab92'); R(gvi, UFF - 20, PIEDI - 8, CASA - UFF + 40, 1, neve ? '#d0d8e2' : '#a39579')
    for (let i = 0; i < 1400; i++) R(gvi, UFF - 20 + r() * (CASA - UFF + 40), PIEDI - 7 + r() * 13, 1, 1, neve ? '#cfd7e0' : r() < 0.5 ? '#a39579' : '#d0c4ab')
    // l'ufficio: intonaco chiaro, la vetrata con la luce della postazione, la porta a vetri, l'insegna
    const ux = 30
    R(gvi, ux, 140, 172, PIEDI - 140, '#d8d2c8'); R(gvi, ux, 140, 172, 2, '#c2bbb0'); R(gvi, ux - 3, 134, 178, 7, '#6e6a66'); R(gvi, ux - 3, 134, 178, 1, '#8a8682')
    R(gvi, ux, PIEDI - 9, 172, 9, '#a39c92'); R(gvi, ux + 162, 140, 10, PIEDI - 140, '#c8c1b6')
    for (let i = 0; i < 60; i++) R(gvi, ux + r() * 170, 142 + r() * 76, 2, 1, '#cbc4b8')
    R(gvi, ux + 18, 158, 84, 46, '#2a2a30') // la vetrata
    R(gvi, UFF - 12, 180, 24, PIEDI - 180, '#2a2a30') // il telaio della porta
    R(gvi, ux + 120, 172, 10, 7, '#e8e4dc'); R(gvi, ux + 122, 174, 6, 3, '#9a948a') // il condizionatore
    R(gvi, ux + 6, PIEDI - 16, 8, 7, '#8a5a3a'); chioma(gvi, r, ux + 10, PIEDI - 20, 6, 5, ['#2f5a28', '#3f7a32', '#58943f'], 0.8) // la pianta
    // l'orto, con lo steccato: le zucche d'autunno (Mantova!), i cavoli d'inverno, l'insalata in primavera, i pomodori d'estate
    const ox = 600
    for (let y = 206; y < 220; y += 3) R(gvi, ox + 4, y, 172, 2, neve ? '#e8edf2' : '#6a4a32')
    for (let i = 0; i < 12; i++) {
      const x = ox + 12 + i * 14 + Math.floor(r() * 4), y = 209 + (i % 3) * 4
      if (st === 'autunno') { ellisse(gvi, x, y, 4, 3, '#e07a1a'); ellisse(gvi, x - 1, y - 1, 2, 1, '#f39a3a'); R(gvi, x, y - 4, 1, 2, '#4a6a2a'); linea(gvi, x + 1, y - 3, x + 4, y - 4, 1, '#4f8a2f') }
      else if (st === 'inverno') { ellisse(gvi, x, y, 3, 2, neve ? '#d9e2d4' : '#4f6f4a'); R(gvi, x - 1, y - 1, 2, 1, '#6f8f6a') }
      else if (st === 'primavera') { ellisse(gvi, x, y, 3, 2, '#7cc85a'); R(gvi, x - 1, y - 1, 2, 1, '#a8e07a') }
      else { R(gvi, x, y - 6, 1, 6, '#3f6a2a'); ellisse(gvi, x + 1, y - 4, 2, 2, '#4f8a2f'); R(gvi, x - 1, y - 3, 2, 2, '#d8321e'); R(gvi, x + 2, y - 1, 2, 2, '#d8321e') }
    }
    for (let x = ox; x <= ox + 180; x += 10) { R(gvi, x, 202, 2, 20, '#8a6a48'); R(gvi, x, 202, 2, 1, '#a88a62') }
    R(gvi, ox, 206, 182, 1, '#8a6a48'); R(gvi, ox, 213, 182, 1, '#8a6a48')
    // il trattore, rosso e grigio, parcheggiato sull'erba
    const tx = 900
    R(gvi, tx, 196, 46, 14, '#8a8e94'); R(gvi, tx, 196, 46, 2, '#a8acb2'); R(gvi, tx + 30, 182, 16, 16, '#7a7e84'); R(gvi, tx + 32, 184, 12, 7, '#3a4a5a')
    R(gvi, tx + 6, 186, 2, 11, '#3a3a3a'); R(gvi, tx + 5, 184, 4, 2, '#2a2a2a')
    for (const [wx, wr] of [[tx + 34, 13], [tx + 6, 8]]) { ellisse(gvi, wx, PIEDI - wr, wr, wr, '#2a2a2a'); ellisse(gvi, wx, PIEDI - wr, wr - 3, wr - 3, '#c8321e'); ellisse(gvi, wx, PIEDI - wr, 2, 2, '#e8e8e8') }
    // i lampioni
    for (const lx of [430, 770, 1110]) { R(gvi, lx, 162, 2, PIEDI - 162 - 6, '#3a3a40'); R(gvi, lx - 1, PIEDI - 8, 4, 2, '#2a2a30'); linea(gvi, lx + 1, 162, lx + 7, 160, 1, '#3a3a40'); R(gvi, lx + 5, 160, 6, 3, '#2a2a30'); R(gvi, lx + 6, 163, 4, 1, notte ? '#fff2c0' : '#c8ccd2') }
    // la casa: due piani, ocra, il tetto di coppi, le persiane verdi, la porta col lampione, i gerani
    const hx = 1280, hw = 220, hy = 72
    R(gvi, hx, hy, hw, PIEDI - hy, '#e3c27c'); R(gvi, hx + hw - 16, hy, 16, PIEDI - hy, '#cfa964'); R(gvi, hx, PIEDI - 12, hw, 12, '#b89356')
    for (let i = 0; i < 90; i++) R(gvi, hx + r() * hw, hy + r() * (PIEDI - hy - 12), 2, 1, '#d8b56e')
    for (let y = 0; y < 30; y++) { const w = hw + 16 - Math.round(y * 0.35) * 0; R(gvi, hx - 8 + y * 0.6, hy - 30 + y, w - y * 1.2, 1, y % 4 === 3 ? '#8a3a22' : '#b4532f') }
    for (let x = hx - 6; x < hx + hw + 6; x += 6) R(gvi, x, hy - 2, 3, 2, '#9a4428')
    R(gvi, hx + 170, hy - 52, 14, 30, '#c8a26a'); R(gvi, hx + 168, hy - 54, 18, 3, '#8a3a22')
    const finestre = [[hx + 26, hy + 18], [hx + 96, hy + 18], [hx + 166, hy + 18], [hx + 26, hy + 92], [hx + 166, hy + 92]]
    finestre.forEach(([fx, fy], i) => {
      R(gvi, fx - 1, fy - 1, 20, 30, '#a8875a'); R(gvi, fx, fy, 18, 28, notte && i % 2 === 0 ? '#ffd27a' : notte ? '#2a2a3a' : '#5a7a9a'); R(gvi, fx + 8, fy, 2, 28, '#a8875a'); R(gvi, fx, fy + 12, 18, 2, '#a8875a')
      for (const s of [-1, 1]) { const px = s < 0 ? fx - 11 : fx + 19; R(gvi, px, fy - 1, 10, 30, '#3f6d3c'); for (let k = 1; k < 30; k += 3) R(gvi, px + 1, fy - 1 + k, 8, 1, '#355c33') }
      R(gvi, fx - 2, fy + 28, 22, 2, '#cfc6b4')
      if (i < 3) for (let k = 0; k < 5; k++) R(gvi, fx + 1 + k * 4, fy + 26, 2, 2, ['#d8321e', '#e84a7a'][k % 2])
    })
    // la porta di casa (si apre nella scena) e il lampione sopra
    R(gvi, CASA - 13, 182, 26, PIEDI - 182, '#a8875a'); ellisse(gvi, CASA, 184, 13, 6, '#a8875a')
    R(gvi, CASA - 3, 172, 6, 4, '#2a2a30'); R(gvi, CASA - 2, 176, 4, 2, notte ? '#fff2c0' : '#d8dce2')
    R(gvi, CASA - 16, PIEDI - 3, 32, 3, '#9a9488')
    // la bici appoggiata al muro
    const bx2 = 1300; for (const wx of [bx2, bx2 + 18]) { ellisse(gvi, wx, PIEDI - 7, 7, 7, '#2a2a2a'); ellisse(gvi, wx, PIEDI - 7, 5, 5, '#e3c27c') }
    linea(gvi, bx2, PIEDI - 7, bx2 + 8, PIEDI - 14, 1, '#2a6aa8'); linea(gvi, bx2 + 8, PIEDI - 14, bx2 + 18, PIEDI - 7, 1, '#2a6aa8'); linea(gvi, bx2 + 8, PIEDI - 14, bx2 + 15, PIEDI - 14, 1, '#2a6aa8'); R(gvi, bx2 + 6, PIEDI - 16, 4, 1, '#2a2a2a')
    tingi(gvi, C, WM)
    // dentro: la cucina (la finestra fa vedere fuori)
    preparaCucina(adesso)
  }

  function preparaCucina(adesso) {
    const r = semi(seme + 77), notte = C.buio > 0.45
    gcu.clearRect(0, 0, IW, IH)
    // il soffitto con le travi, il muro, il pavimento di cotto
    R(gcu, 0, 0, IW, 22, '#efe4d0'); for (let x = 6; x < IW; x += 34) { R(gcu, x, 0, 9, 22, '#5a3a24'); R(gcu, x, 19, 9, 3, '#3f2818') }
    R(gcu, 0, 22, IW, BL - 22, '#eadcbf'); R(gcu, 0, 22, IW, 2, '#d8c8a8')
    for (let i = 0; i < 90; i++) R(gcu, r() * IW, 24 + r() * (BL - 24), 2, 1, '#e2d2b2')
    for (let y = BL; y < IH; y++) R(gcu, 0, y, IW, 1, mescola('#b8664a', '#a2563c', (y - BL) / (IH - BL)))
    for (let y = BL + 4; y < IH; y += 7 + Math.floor((y - BL) / 8)) R(gcu, 0, y, IW, 1, '#8f4a34')
    for (let x = -60; x < IW + 60; x += 14) linea(gcu, x, BL, x + (x - IW / 2) * 0.6, IH, 1, '#8f4a34')
    R(gcu, 0, BL - 3, IW, 3, '#c9b28a')
    // la porta verso fuori (a sinistra)
    R(gcu, 4, 44, 22, BL - 44, '#7a5a3a'); R(gcu, 6, 46, 18, BL - 46, '#5a3e26'); R(gcu, 20, 70, 2, 3, '#d8b04a')
    // la finestra: si vede il cielo di adesso
    R(gcu, 34, 34, 30, 32, '#f2ead8'); R(gcu, 36, 36, 26, 28, '#000')
    // le persiane verdi aperte, la tenda
    R(gcu, 26, 34, 8, 32, '#3f6d3c'); R(gcu, 64, 34, 8, 32, '#3f6d3c'); for (let k = 36; k < 66; k += 3) { R(gcu, 27, k, 6, 1, '#355c33'); R(gcu, 65, k, 6, 1, '#355c33') }
    // l'orologio (le lancette le mette disegna)
    ellisse(gcu, OROL[0], OROL[1], 7, 7, '#3a2a22'); ellisse(gcu, OROL[0], OROL[1], 6, 6, '#f6f0e2')
    // i mobili: i pensili, il piano di lavoro, le piastrelle, il lavello, i fornelli con la moka, il microonde
    R(gcu, 112, 62, 82, 16, '#f4efe6'); for (let x = 112; x < 194; x += 6) R(gcu, x, 62, 1, 16, '#dcd4c6'); for (let y = 62; y < 78; y += 5) R(gcu, 112, y, 82, 1, '#dcd4c6')
    R(gcu, 116, 36, 76, 26, '#c79a62'); R(gcu, 116, 60, 76, 2, '#a87a48'); for (const x of [116, 141, 166]) { R(gcu, x + 1, 37, 23, 22, '#d6aa72'); R(gcu, x + 11, 56, 3, 1, '#7a5a3a') }
    R(gcu, 110, 78, 86, 3, '#8f8a84'); R(gcu, 110, 78, 86, 1, '#aaa59e')
    R(gcu, 112, 81, 82, BL - 81, '#c79a62'); for (const x of [112, 133, 154, 175]) { R(gcu, x + 1, 82, 19, BL - 84, '#d6aa72'); R(gcu, x + 9, 86, 3, 1, '#7a5a3a') }
    R(gcu, 140, 77, 18, 2, '#5a5a62'); R(gcu, 152, 70, 2, 8, '#b8bcc4'); R(gcu, 150, 70, 5, 2, '#b8bcc4')
    R(gcu, 168, 77, 22, 2, '#2a2a2e'); R(gcu, 174, 70, 6, 7, '#8a8e96'); R(gcu, 173, 68, 8, 2, '#6a6e76'); R(gcu, 180, 72, 3, 1, '#2a2a2e')
    R(gcu, 112, 66, 22, 12, '#3a3a40'); R(gcu, 114, 68, 14, 8, '#1a1a20'); R(gcu, 129, 68, 3, 8, '#5a5a62')
    // il frigo, alto quanto lui, con le calamite (una lime, di pzkko)
    R(gcu, 200, BL - 46, 28, 46, '#e8ecef'); R(gcu, 224, BL - 46, 4, 46, '#cfd5da'); R(gcu, 200, BL - 30, 28, 1, '#b8bfc6'); R(gcu, 202, BL - 42, 2, 9, '#9aa2aa'); R(gcu, 202, BL - 27, 2, 12, '#9aa2aa')
    R(gcu, 210, BL - 40, 4, 3, '#ccff00'); R(gcu, 216, BL - 36, 3, 4, '#9d00ff'); R(gcu, 208, BL - 22, 6, 5, '#f4f0e6'); R(gcu, 209, BL - 21, 4, 3, '#7aa0c8')
    R(gcu, 198, 32, 32, 20, '#c79a62'); R(gcu, 199, 33, 30, 18, '#d6aa72')
    // il tavolo davanti, a sinistra, e la lampada sopra
    R(gcu, TAVOLO + 1, 0, 1, 30, '#2a2a2a'); R(gcu, TAVOLO - 6, 30, 15, 5, '#3f6d3c'); R(gcu, TAVOLO - 7, 34, 17, 1, '#2f5a2c')
    tingi(gcu, { tinta: notte ? '#2a2040' : null, forza: notte ? 0.18 : 0 }, IW, IH)
  }

  // la cucina di adesso: il cielo nella finestra, l'orologio con l'ora vera, il frigo e gli sportelli aperti
  function disegnaCucina(t, adesso, o) {
    gde.drawImage(cucina, 0, 0)
    // il cielo vero nella finestra (preso dal cielo di fuori)
    gde.save(); gde.beginPath(); gde.rect(36, 36, 26, 28); gde.clip()
    gde.drawImage(cs, 120, 40, 120, 130, 36, 36, 26, 28)
    if (C.buio < 0.4) { R(gde, 36, 58, 26, 6, mescola(ERBA[C.stagione][1], C.colori[2], 0.3)); R(gde, 42, 52, 2, 7, '#3f6a34'); R(gde, 54, 50, 2, 9, '#3f6a34') }
    tempo(gde, C, t, 1 / 30, IH)
    gde.restore()
    R(gde, 48, 36, 1, 28, '#f2ead8'); R(gde, 36, 49, 26, 1, '#f2ead8')
    // l'orologio: l'ora vera
    const h = adesso.getHours() % 12 + adesso.getMinutes() / 60, m = adesso.getMinutes() / 60
    const [ox, oy] = OROL
    linea(gde, ox, oy, ox + Math.sin(h / 12 * 2 * Math.PI) * 3.5, oy - Math.cos(h / 12 * 2 * Math.PI) * 3.5, 1, '#1a1a1a')
    linea(gde, ox, oy, ox + Math.sin(m * 2 * Math.PI) * 5, oy - Math.cos(m * 2 * Math.PI) * 5, 1, '#3a3a3a')
    // gli sportelli aperti
    if (o.pensile) { R(gde, 141, 37, 23, 22, '#4a3a2a'); R(gde, 143, 40, 8, 7, '#e8c86a'); R(gde, 152, 41, 6, 6, '#c84a3a'); R(gde, 143, 50, 16, 1, '#7a5a3a'); R(gde, 145, 51, 4, 7, '#f4f4f4'); R(gde, 151, 53, 5, 5, '#e8e8f0'); R(gde, 164, 37, 4, 22, '#e2b67e') }
    if (o.basso) { R(gde, 133, 82, 19, BL - 84, '#3a2a1e'); R(gde, 135, 86, 6, 4, '#c8a050'); R(gde, 142, 87, 7, 3, '#7a7e86'); R(gde, 152, 82, 4, BL - 84, '#e2b67e') }
    if (o.forno) { R(gde, 114, 68, 14, 8, o.forno > 1 ? '#f4d27a' : '#3a3a40'); if (o.forno > 1) { ellisse(gde, 121, 74, 5, 1, '#e8e8e8'); R(gde, 119 + Math.round(Math.sin(t * 4) * 2), 71, 4, 3, '#c84a2a') } R(gde, 129, 70, 3, 2, o.forno > 1 ? '#3aff6a' : '#5a5a62') }
    // il frigo aperto: la luce fredda, i ripiani, le cose dentro
    if (o.frigo > 0) {
      const k = o.frigo
      R(gde, 200, BL - 46, 28, 46, '#dfe8ee'); R(gde, 202, BL - 44, 24, 42, '#f4fbff')
      for (const y of [BL - 33, BL - 22, BL - 12]) R(gde, 202, y, 24, 1, '#bcd0dc')
      const roba = [[204, BL - 38, 4, 5, '#e8d040'], [210, BL - 37, 5, 4, '#f4f4f0'], [217, BL - 39, 3, 6, '#7a2a3a'], [204, BL - 27, 6, 5, '#e0a040'], [212, BL - 26, 4, 4, '#c8e0f0'], [218, BL - 28, 5, 6, '#4a8a3a'], [205, BL - 16, 8, 4, '#f0e6c8'], [215, BL - 17, 6, 5, '#e85a3a']]
      for (const [x, y, w, h2, col] of roba) R(gde, x + (o.fruga ? Math.round(Math.sin(t * 9 + x) * 0.7) : 0), y, w, h2, col)
      // la fila delle lattine blu (per la Red Bull): una in meno quando l'ha presa
      if (rb) for (let i = 0; i < (o.preso ? 4 : 5); i++) { const x = 203 + i * 4; R(gde, x, BL - 29, 3, 7, '#2f6fd8'); R(gde, x, BL - 29, 3, 1, '#dfe6ee'); R(gde, x + 1, BL - 26, 1, 2, '#ffffff') }
      // lo sportello aperto verso destra
      const sw = Math.round(4 + 10 * k)
      R(gde, 228, BL - 46, sw, 46, '#e8ecef'); R(gde, 228, BL - 46, 1, 46, '#b8bfc6'); R(gde, 229, BL - 36, sw - 2, 1, '#cfd5da'); R(gde, 229, BL - 22, sw - 2, 1, '#cfd5da')
    }
  }

  // ── fuori: dove sta e cosa fa (t = secondi da quando sei andato via) ──
  function fuori(t) {
    const o = { x: UFF, posa: { vista: 'lato', dir: 1 }, porta: 0, portaCasa: 0, dentro: false, metri: null }
    if (t < 1.2) { o.porta = lin(0.2, 0.8, t); o.x = UFF; o.posa = { vista: 'fronte' }; o.nascosto = t < 0.6 }
    else if (t < 2.8) { o.porta = 1 - lin(2.1, 2.7, t); o.x = UFF + 14 * ss(1.2, 2.4, t); o.posa = t < 1.8 ? { vista: 'fronte' } : { vista: 'lato', dir: 1, passo: t * Math.PI * 2 * 1.7 } }
    else if (t < A_CASA) {
      const k = (t - 2.8) / (A_CASA - 2.8)
      o.x = UFF + 14 + (CASA - UFF - 14) * k
      o.posa = { vista: 'lato', dir: 1, passo: t * Math.PI * 2 * 1.7, occhi: (t % 4.1) < 0.15 ? 0 : 1 }
      o.metri = Math.max(0, Math.round(50 * (1 - (o.x - UFF) / (CASA - UFF))))
      if (t > 8 && t < 10.5) o.bolla = rb ? 'SONNO...' : bere ? 'SETE...' : 'FAME...'
      if (C.tempo === 'pioggia' && t > 16 && t < 18.5) o.bolla = 'PIOVE!'
      if (C.gradi < 6 && t > 22 && t < 24.5) o.bolla = 'BRR'
    } else {
      o.x = CASA; o.portaCasa = lin(A_CASA, A_CASA + 0.5, t) * (1 - lin(40.4, 40.9, t))
      o.posa = { vista: 'retro' }; o.nascosto = t > 40.2
    }
    return o
  }

  // ── dentro: il copione della cucina (ti = secondi da quando è entrato) ──
  function cammina(ti, a, b, x0, x1) { const k = ss(a, b, ti); return { x: x0 + (x1 - x0) * k, posa: { vista: 'lato', dir: x1 > x0 ? 1 : -1, passo: k > 0 && k < 1 ? ti * Math.PI * 2 * 1.8 : null } } }
  // la Red Bull: sa dov'è. Dritto al frigo, la prende, «PSST!», un sorso lungo a testa in su… le ali; poi al tavolo
  function casaRB(ti) {
    const o = { x: FRIGO, posa: { vista: 'lato', dir: 1 }, frigo: 0, pensile: false, basso: false, forno: 0, oggetto: null, seduto: false, preso: ti >= 9.2 }
    if (ti < 1) Object.assign(o, { x: 15 })
    else if (ti < 5) Object.assign(o, cammina(ti, 1, 5, 15, FRIGO))
    else if (ti < 9.5) { // il frigo: le lattine sono lì, in fila
      o.frigo = lin(5.2, 5.8, ti); const s = ti > 6 && ti < 9.2
      o.posa = { vista: 'lato', dir: 1, busto: s ? 0.2 : 0, mani: s ? [[13, -27 + Math.sin(ti * 2) * 1.5], null] : null }
      if (ti > 7.4 && ti < 9.4) o.bolla = '!'
    } else if (ti < 15) { // la tiene su
      o.frigo = 1 - lin(14.4, 15, ti)
      o.posa = { vista: 'fronte', mani: [[5, -50], null], gomiti: [[9, -40], null], bocca: 1 }
      o.oggetto = { x: o.x + 5, y: IP - 52, s: 150 * ss(9.5, 10.1, ti), nome: scelta.nome, su: true }
    } else if (ti < 19) { // la apre
      o.posa = { vista: 'fronte', mani: [[3, -27], [-3, -26]] }
      o.oggetto = { x: o.x + 1, y: IP - 17, s: 70 }
      o.frizz = ti > 16.3 ? ti - 16.3 : 0
      if (ti > 16.3 && ti < 18.4) o.bolla = 'PSST!'
    } else if (ti < 24) { // il sorso lungo, a testa in su
      o.posa = { vista: 'fronte', mani: [[1, -36], null], gomiti: [[9, -30], null], testa: 'su', occhi: 0 }
      o.oggetto = { x: o.x + 2, y: IP - 27, s: 70 }
      if (ti > 19.6 && ti < 22.2) o.bolla = 'GLU GLU'
      if (ti > 22.5) o.bolla = 'AHH'
    } else if (ti < 28.5) { // le ali: si alza da terra e sbatte
      const k = ss(24, 24.8, ti) * (1 - ss(27.6, 28.5, ti))
      o.ali = k; o.su = Math.round(7 * k + Math.sin(ti * 9) * 1.5 * k)
      o.posa = { vista: 'fronte', mani: [[8, -31], [-9, -31]], bocca: 1 }
      o.oggetto = { x: o.x + 8, y: IP - 22 - o.su, s: 70 }
      if (ti > 24.6 && ti < 27.4) o.bolla = 'CARICO!'
    } else if (ti < 33) { Object.assign(o, cammina(ti, 28.5, 33, FRIGO, TAVOLO + 8)); o.oggetto = { x: o.x - 8, y: IP - 22, s: 70 } }
    else { // al tavolo: un sorso ogni tanto, il telefono
      o.x = TAVOLO; o.seduto = true
      const s = (ti - 33) % 20, telefono = s > 11 && s < 17, sorso = !telefono && (ti - 33) % 6 < 1.6
      o.posa = { vista: 'fronte', seduto: true, mani: telefono ? [[2, -14], [-2, -14]] : sorso ? [[2, -27], null] : [[7, -14], null], gomiti: sorso ? [[9, -18], null] : [null, null], testa: sorso ? 'su' : 0, occhi: (ti % 3.1) < 0.15 ? 0 : 1 }
      o.telefono = telefono
      o.oggetto = sorso ? { x: TAVOLO + 2, y: 106, s: 70 } : { x: TAVOLO + 22, y: 112, s: 110 }
      if (s > 1 && s < 3.2) o.bolla = 'GLU'
      if (s > 7 && s < 9.5) o.bolla = ti > 70 ? 'ANCORA UNA?' : 'AHH'
    }
    return o
  }
  // le ali bianche dietro le spalle (k: quanto sono aperte), che sbattono
  function ali(gq, x, y, k, t) {
    const f = Math.sin(t * 18)
    gq.save(); gq.globalAlpha = Math.min(1, k * 1.5)
    for (const d of [-1, 1]) {
      const bx = x + d * 4, by = y - 30
      for (const [lx, ly] of [[11, -7 - 3 * f], [10, -3 - 2 * f], [8, 1 - f]]) { linea(gq, bx, by, bx + d * lx * k, by + ly * k, 3, SCURO) }
      for (const [lx, ly] of [[11, -7 - 3 * f], [10, -3 - 2 * f], [8, 1 - f]]) { linea(gq, bx, by, bx + d * lx * k, by + ly * k, 1, '#ffffff') }
    }
    gq.restore()
  }

  function casa(ti, t) {
    if (rb) return casaRB(ti)
    const o = { x: FRIGO, posa: { vista: 'lato', dir: 1 }, frigo: 0, pensile: false, basso: false, forno: 0, oggetto: null, seduto: false }
    const sc = scelta, fine = sc.dopo
    if (ti < 1) Object.assign(o, { x: 15, posa: { vista: 'lato', dir: 1 } })
    else if (ti < 6.2) Object.assign(o, cammina(ti, 1, 6.2, 15, FRIGO))
    else if (ti < 15.6) { // il frigo, la prima volta: niente
      o.frigo = lin(6.4, 7, ti) * (1 - lin(15, 15.6, ti)); o.fruga = ti > 7 && ti < 15
      const s = ti > 7 && ti < 15
      o.posa = { vista: 'lato', dir: 1, busto: s ? 0.28 : 0, mani: s ? [[13 + Math.sin(ti * 2.2) * 3, -24 + Math.sin(ti * 1.3) * 9], [10, -20]] : ti < 7 ? [[11, -24], null] : null }
      if (ti > 8.5 && ti < 10.5) o.bolla = '?'
      if (ti > 12.5 && ti < 14.6) o.bolla = 'MEH'
    } else if (ti < 17.6) Object.assign(o, cammina(ti, 15.6, 17.6, FRIGO, PENSILE))
    else if (ti < 23.5) { // il pensile
      o.x = PENSILE; o.pensile = ti > 18.6 && ti < 23
      o.posa = { vista: 'lato', dir: 1, testa: 'su', mani: ti > 18.2 && ti < 23.2 ? [[10, -46 + Math.sin(ti * 3) * 1.5], null] : null }
      if (ti > 19.5 && ti < 21.5) o.bolla = '?'
      if (ti > 21.8 && ti < 23.5) o.bolla = 'NO'
    } else if (ti < 24.5) Object.assign(o, cammina(ti, 23.5, 24.5, PENSILE, BASSO))
    else if (ti < 31) { // lo sportello in basso, chinato
      o.x = BASSO; o.basso = ti > 25.4 && ti < 30.4
      const giu = Math.round(7 * ss(24.5, 25.2, ti) * (1 - ss(30.4, 31, ti)))
      o.posa = { vista: 'lato', dir: 1, giu, busto: giu / 14, mani: giu > 3 ? [[11 + Math.sin(ti * 3) * 2, -12], [9, -10]] : null }
      if (ti > 26.5 && ti < 29) o.bolla = '...'
    } else if (ti < 33.5) { o.x = BASSO; o.posa = { vista: 'fronte', mani: [[3, -41], null], gomiti: [[8, -34], null] }; if (ti > 31.5) o.bolla = 'HMM' }
    else if (ti < 36) Object.assign(o, cammina(ti, 33.5, 36, BASSO, FRIGO))
    else if (ti < 44) { // il frigo, la seconda volta: più dentro... eccolo!
      o.frigo = lin(36.2, 36.8, ti); o.fruga = true
      o.posa = { vista: 'lato', dir: 1, busto: ti > 37 ? 0.42 : 0, mani: ti > 37 ? [[15 + Math.sin(ti * 4) * 3, -22 + Math.sin(ti * 2.6) * 8], [12, -18]] : null }
      if (ti > 42) o.bolla = '!'
    } else if (ti < 49.6) { // lo tiene su: trovato!
      o.frigo = 1 - lin(49, 49.6, ti)
      o.posa = { vista: 'fronte', mani: [[5, -50], null], gomiti: [[9, -40], null], bocca: 1 }
      o.oggetto = { x: o.x + 5, y: IP - 52, s: 150 * ss(44, 44.6, ti), nome: sc.nome, su: true }
    } else if (fine === 'microonde' && ti < 62) {
      if (ti < 52.5) Object.assign(o, cammina(ti, 49.6, 52.5, FRIGO, FORNO))
      else { o.x = FORNO; o.posa = { vista: 'lato', dir: 1, mani: ti < 54 || ti > 61 ? [[14, -31], null] : null }; o.forno = ti > 53.6 && ti < 61 ? 2 : 1; if (ti > 55 && ti < 59.5) o.bolla = '...'; if (ti > 60 && ti < 61.6) o.bollaForno = 'DING!' }
      if (ti < 53.6 || ti > 61) o.oggetto = { x: o.x + 10, y: IP - 30, s: 70 }
    } else if (ti < 62) { // un piatto (o un bicchiere) dal pensile
      if (ti < 51.6) Object.assign(o, cammina(ti, 49.6, 51.6, FRIGO, PENSILE))
      else { o.x = PENSILE; o.pensile = ti > 52 && ti < 55; o.posa = { vista: 'lato', dir: 1, mani: ti < 55 ? [[10, -46], null] : [[10, -28], [8, -27]] }; if (bere && ti > 56 && ti < 58) o.bolla = 'PSST'; if (!bere && ti > 57 && ti < 59) o.bolla = '♥' }
      o.oggetto = { x: o.x + 10, y: IP - 30, s: 70 }
    } else if (ti < 67) { Object.assign(o, cammina(ti, 62, 67, fine === 'microonde' ? FORNO : PENSILE, TAVOLO + 8)); o.oggetto = { x: o.x + 8 * (o.posa.dir ?? 1), y: IP - 26, s: 70 } }
    else { // al tavolo
      o.x = TAVOLO; o.seduto = true
      const s = (ti - 67) % 22, giro = (ti - 67) % 4.5, telefono = s > 13 && s < 19
      const boccone = !telefono && giro < 1.3
      o.posa = { vista: 'fronte', seduto: true, mani: telefono ? [[2, -14], [-2, -14]] : boccone ? [[2, -27], null] : [[7, -14], null], gomiti: boccone ? [[9, -18], null] : [null, null], bocca: !telefono && giro > 1.3 && giro < 3.6 && Math.sin(ti * 18) > 0 ? 1 : 0, testa: s > 19.5 && s < 21.5 ? 1 : 0, occhi: (ti % 3.3) < 0.15 ? 0 : 1 }
      o.telefono = telefono
      o.oggetto = { x: TAVOLO + 22, y: 112, s: 110 }
      if (s > 2 && s < 4.5) o.bolla = bere ? 'GLU GLU' : 'GNAM'
      if (s > 8 && s < 10.5 && ti > 80) o.bolla = bere ? 'AHH' : 'BUONO'
    }
    return o
  }

  // a che punto è, per la scritta al centro (scritta.js): gli stessi tempi dei due copioni qui sopra
  function fase(t) {
    if (t < 2.8) return 'esce'
    if (t < A_CASA) return 'cammina'
    if (t < DENTRO) return 'entra'
    const ti = t - DENTRO
    if (rb) return ti < 5 ? 'dentro' : ti < 9.5 ? 'frigo' : ti < 15 ? 'trovato' : ti < 19 ? 'apre' : ti < 24 ? 'sorso' : ti < 28.5 ? 'ali' : ti < 33 ? 'a-tavola' : 'tavolo'
    return ti < 6.2 ? 'dentro' : ti < 15.6 ? 'frigo' : ti < 17.6 ? 'va' : ti < 23.5 ? 'pensile' : ti < 24.5 ? 'va' : ti < 31 ? 'basso' : ti < 33.5 ? 'pensa' : ti < 36 ? 'va' : ti < 44 ? 'frigo2' : ti < 49.6 ? 'trovato' : ti < 62 ? (scelta.dopo === 'microonde' ? 'microonde' : 'piatto') : ti < 67 ? 'a-tavola' : 'tavolo'
  }

  function disegna(t, adesso, dt = 1 / 30) {
    const k = `${adesso.getHours()}:${adesso.getMinutes()}|${met?.icona}|${met?.gradi}`
    if (k !== chiave) { chiave = k; prepara(adesso) }
    let adesivo = null, detto = {}
    const notte = C.buio > 0.45
    if (t < DENTRO) {
      const o = fuori(t)
      detto = { metri: o.metri, bolla: o.bolla ?? null }
      const cam = Math.max(0, Math.min(WM - W, o.x - 200))
      g.drawImage(cs, 0, 0)
      scintille(g, C, t, 176, seme + 3)
      astro(g, C, 60 + ((notte ? C.luna.est : C.sole.est) + 1) * 170, Math.max(16, 166 - Math.max(0, notte ? C.luna.alt : C.sole.alt) * 3.2), t)
      nuvole(g, C, t, 176, seme + 9)
      g.drawImage(lontano, -Math.round(cam * PL), 0)
      g.drawImage(mezzo, -Math.round(cam * PM), 0)
      g.drawImage(vicino, -Math.round(cam), 0)
      // le luci accese: la vetrata dell'ufficio (la postazione, viola e lime), l'insegna, i lampioni, le finestre di casa
      const X = (x) => Math.round(x - cam)
      const vx = X(48), lampeggia = 0.85 + 0.15 * Math.sin(t * 2)
      g.fillStyle = mescola('#3a1a6a', '#5a2aa0', 0.5 + 0.5 * Math.sin(t * 0.7)); g.fillRect(vx + 2, 160, 80, 42)
      R(g, vx + 14, 186, 22, 13, '#1a1420'); R(g, vx + 16, 188, 18, 9, mescola('#5865f2', '#9d00ff', 0.5 + 0.5 * Math.sin(t))); R(g, vx + 40, 186, 22, 13, '#1a1420'); R(g, vx + 42, 188, 18, 9, '#2a6a4a')
      R(g, vx + 10, 199, 64, 3, '#ccff00'); R(g, vx + 2, 160, 80, 1, '#7a4ad0')
      if (notte) { alone(g, vx + 42, 182, 50, '#9d6aff', 0.55 * lampeggia); for (const lx of [430, 770, 1110]) { alone(g, X(lx + 8), 166, 26, '#ffe6a0', 0.9); g.fillStyle = 'rgba(255,230,160,0.16)'; ellisse(g, X(lx + 8), PIEDI - 2, 22, 4) } alone(g, X(CASA), 178, 26, '#ffd27a', 0.8) }
      // l'insegna al neon sopra la vetrata
      scrivi(g, 'PZKKO', vx + 30, 148, notte ? '#eaff8a' : '#a8c820'); if (notte) alone(g, vx + 40, 151, 22, '#ccff00', 0.7 * lampeggia)
      // la porta dell'ufficio che si apre
      const px = X(UFF - 10)
      R(g, px, 182, 20, PIEDI - 182, '#3a3f55'); R(g, px + 1, 183, 18, 2, '#5a607a')
      if (o.porta > 0) { R(g, px, 182, 20, PIEDI - 182, '#1a1428'); alone(g, px + 10, 205, 24, '#9d6aff', 0.6 * o.porta); R(g, px + 20 - Math.round(4 + 16 * (1 - o.porta)), 182, Math.round(4 + 16 * (1 - o.porta)), PIEDI - 182, '#4a5070') }
      R(g, px + 15, 204, 2, 4, '#c8c8d0')
      // la porta di casa
      const cx = X(CASA - 11)
      R(g, cx, 186, 22, PIEDI - 186, '#2f4a32'); R(g, cx + 2, 190, 8, 14, '#355a38'); R(g, cx + 12, 190, 8, 14, '#355a38'); R(g, cx + 17, 208, 2, 2, '#d8b04a')
      if (o.portaCasa > 0) { R(g, cx, 186, 22, PIEDI - 186, '#3a2414'); alone(g, cx + 11, 208, 26, '#ffc870', 0.9 * o.portaCasa); R(g, cx, 186, Math.round(4 + 18 * (1 - o.portaCasa)), PIEDI - 186, '#2f4a32') }
      // il gatto sullo scalino di casa (muove la coda)
      const gx = X(CASA + 24)
      R(g, gx, PIEDI - 9, 7, 6, '#1a1a1e'); R(g, gx + 1, PIEDI - 6, 4, 3, '#f2f2f2'); R(g, gx + 1, PIEDI - 13, 5, 5, '#1a1a1e'); R(g, gx + 1, PIEDI - 14, 1, 1, '#1a1a1e'); R(g, gx + 5, PIEDI - 14, 1, 1, '#1a1a1e'); R(g, gx + 2, PIEDI - 11, 1, 1, '#c8e05a'); R(g, gx + 4, PIEDI - 11, 1, 1, '#c8e05a')
      linea(g, gx + 7, PIEDI - 4, gx + 9 + Math.round(Math.sin(t * 2) * 2), PIEDI - 9, 1, '#1a1a1e')
      // il fumo del camino quando fa freddo
      if (C.gradi < 12) {
        if (Math.random() < dt * 3) fumo.push({ x: 1280 + 177, y: 72 - 54, v: 0 })
        for (const f of fumo) { f.v += dt; f.y -= 7 * dt; f.x += (3 + C.vento * 0.2) * dt }
        while (fumo.length && fumo[0].v > 4) fumo.shift()
        for (const f of fumo) { g.fillStyle = `rgba(${notte ? '120,120,140' : '225,225,230'},${(0.5 * (1 - f.v / 4)).toFixed(2)})`; ellisse(g, X(f.x), f.y, 2 + Math.round(f.v * 1.5), 1 + Math.round(f.v)) }
      }
      // l'omino
      if (!o.nascosto) {
        ga.clearRect(0, 0, W, H)
        omino(ga, X(o.x), PIEDI, o.posa)
        tingi(ga, C)
        g.drawImage(attori, 0, 0)
        if (notte && o.x > UFF + 10) alone(g, X(o.x), PIEDI - 20, 16, '#9d9dd0', 0.12)
      }
      // quanto manca a casa, sopra la testa
      if (o.metri !== null) {
        const s = `CASA ${o.metri} M`, w = largo(s), sx = X(o.x) - Math.round(w / 2), sy = PIEDI - (o.bolla ? 72 : 60)
        g.fillStyle = SCURO; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) scrivi(g, s, sx + dx, sy + dy, SCURO)
        scrivi(g, s, sx, sy, '#ccff00')
      }
      tempo(g, C, t, dt, H)
      if (o.bolla) fumetto(g, o.bolla, X(o.x), PIEDI - 49)
      // il buio prima della cucina
      if (t > 40.4) { g.fillStyle = `rgba(8,6,12,${lin(40.4, 41.2, t).toFixed(2)})`; g.fillRect(0, 0, W, H) }
    } else {
      const ti = t - DENTRO, o = casa(ti, t)
      detto = { bolla: o.bolla ?? o.bollaForno ?? null, bocca: !!o.posa.bocca, telefono: !!o.telefono, seduto: !!o.seduto }
      disegnaCucina(t, adesso, o)
      // l'omino (seduto: dietro al tavolo, che va disegnato sopra)
      if (o.seduto) {
        R(gde, TAVOLO - 9, 84, 18, 4, '#7a5232'); R(gde, TAVOLO - 9, 84, 2, 26, '#7a5232'); R(gde, TAVOLO + 7, 84, 2, 26, '#7a5232') // lo schienale della sedia
        omino(gde, Math.round(o.x), 126, o.posa)
      } else {
        if (o.ali) ali(gde, Math.round(o.x), IP - (o.su ?? 0), o.ali, t)
        omino(gde, Math.round(o.x), IP - (o.su ?? 0), o.posa)
        // la lattina che si apre: le goccioline che schizzano
        if (o.frizz && o.frizz < 1.4) for (let k = 0; k < 12; k++) { const a = o.frizz; R(gde, o.x + 1 + Math.sin(k * 2.3) * a * (6 + k), IP - 28 - a * (12 + (k % 4) * 5) + a * a * 10, 1, 1, k % 3 ? '#ffffff' : '#9fd4ff') }
      }
      // il tavolo (sopra all'omino seduto)
      R(gde, TAVOLO - 34, 110, 72, 5, '#8a5a32'); R(gde, TAVOLO - 34, 110, 72, 1, '#a8774a'); R(gde, TAVOLO - 34, 115, 72, 3, '#6a4224'); R(gde, TAVOLO - 30, 118, 4, 17, '#6a4224'); R(gde, TAVOLO + 30, 118, 4, 17, '#6a4224')
      R(gde, TAVOLO - 26, 109, 56, 2, '#e8e0d0'); R(gde, TAVOLO - 26, 109, 56, 1, '#f4efe4') // la tovaglia
      if (o.telefono) { alone(gde, o.x, 112, notte ? 20 : 10, '#bfe0ff', notte ? 0.8 : 0.3); R(gde, o.x - 2, 111, 4, 2, '#e8f4ff') }
      // la luce della lampada sul tavolo, di sera
      if (notte) alone(gde, TAVOLO, 40, 60, '#ffd890', 0.35)
      if (o.bolla) fumetto(gde, o.bolla, Math.round(o.x), o.seduto ? 80 : IP - 49 + (o.posa.giu ?? 0))
      if (o.bollaForno) fumetto(gde, o.bollaForno, 121, 64)
      if (ti < 0.8) { gde.fillStyle = `rgba(8,6,12,${(1 - ti / 0.8).toFixed(2)})`; gde.fillRect(0, 0, IW, IH) }
      g.drawImage(dentro, 0, 0, W, H)
      // l'oggetto trovato: quello vero di pzkko (in pixel art anche lui), sopra la scena; le coordinate qui sono ×2
      if (o.oggetto && o.oggetto.s > 1) adesivo = { src: scelta.src, x: o.oggetto.x * 2, y: o.oggetto.y * 2, s: o.oggetto.s, nome: o.oggetto.nome ?? null, su: !!o.oggetto.su }
    }
    return { adesivo, ...detto, fase: fase(t), nome: scelta.nome, scalda: scelta.dopo === 'microonde', bere, rb, notte, gradi: C.gradi, tempo: C.tempo }
  }
  return { tela: c, disegna, meteo(m) { if (m && JSON.stringify(m) !== JSON.stringify(met)) { met = m; chiave = '' } } }
}
