// Diretta OS · «sto riavviando il pc»: lo schermo del pc, a pixel, come un vecchio monitor (le righe, gli angoli
// scuri). Si spegne (la riga bianca che si chiude), il BIOS di pzkko che scrive le sue righe e conta la memoria, la
// lumaca di pzkko con la rotellina, l'aggiornamento che corre, rallenta, salta e si pianta al 99%, il login col cielo di
// adesso e l'ora vera, la tua faccia a pixel e la password a pallini, il desktop che apre le app… poi lo schermo viola
// «:(» e si riavvia di nuovo (e l'aggiornamento dopo è «2 di 3», poi «3 di 3», poi «4 di 3»).
// Il tempo della scena parte da quando hai premuto il tasto.

import { W, H, tela, R, ellisse, scrivi, largo, figura, mescola, cielo, dipingiCielo, semi, ss, lin } from './pixel.js'
import { pioppo } from './natura.js'
import { omino } from './omino.js'

const LIME = '#ccff00', VIOLA = '#9d00ff', GRIGIO = '#b8b4c0', NERO = '#05040a'
// i pezzi di un giro, in secondi
const F = { spento: 0, bios: 2.6, logo: 10.6, aggiorna: 16.6, nero: 60.6, login: 63, desktop: 80, glitch: 100, errore: 102, fine: 116 }
const BIOS = [
  [0.2, 'PZKKO BIOS V2.6', LIME], [0.5, 'COPYRIGHT 2026 PZKKO.IT', GRIGIO], [1.2, 'CPU: GIUGNOH 9000  5.2 GHZ ........ OK'],
  [1.8, 'MEMORIA'], [3.6, 'DISCO 0: SSD 2 TB ................. OK'], [4.0, 'DISCO 1: HDD 4 TB ................. OK'],
  [4.5, 'USB: TASTIERA, MOUSE, PAD ......... OK'], [5.0, 'WEBCAM: IPHONE CAMO ............... OK'], [5.6, 'RETE: WI-FI ....................... OK'],
  [6.6, 'PREMI CANC PER IL SETUP, F12 PER IL BOOT', LIME],
]
// la lumaca di pzkko: verde, gli occhiali da sole, il guscio lime con la spirale
const LUMACA = [
  '.........ggg.........',
  '.......gLLLLLg.......',
  '......gLLdddLLg......',
  '.....gLLdLLLdLLg.....',
  '.....gLdLLddLdLg..e.e',
  '.....gLdLdLLdLLg..v.v',
  '.....gLLdLLLdLg..vvvv',
  '......gLLdddLLg.kkkkk',
  '.......gLLLLLg.vkkvkk',
  '..vvvvvvggggvvvvvvvv.',
  '.vVVVVVVVVVVVVVVVVv..',
  '..vvvvvvvvvvvvvvvv...',
]
const PAL_LUMACA = { g: '#3a6a10', L: '#ccff00', d: '#5a8a10', v: '#2fae4a', V: '#4fd06a', e: '#2fae4a', k: '#0b090e' }
const FRECCIA = ['k.......', 'kk......', 'kwk.....', 'kwwk....', 'kwwwk...', 'kwwwwk..', 'kwwwwwk.', 'kwwkkkkk', 'kwk.....', 'kk......']
const ICONE = ['#ccff00', '#9d00ff', '#5865f2', '#ff3d4a', '#2dff7a', '#ffb03a', '#05d9e8', '#ff73fa', '#ffffff', '#f0b232']
const SIGLE = ['P', 'D', 'C', 'Y', 'S', 'M', 'W', 'G', 'F', 'R']

// l'aggiornamento: corre, rallenta, salta, si pianta al 99, poi 100 (u: secondi dall'inizio, 44 in tutto)
function percento(u) {
  const P = [[0, 0], [6, 37], [14, 38], [16, 71], [25, 96], [28, 99], [41, 99], [42.5, 100]]
  for (let i = 1; i < P.length; i++) if (u <= P[i][0]) return Math.floor(P[i - 1][1] + (P[i][1] - P[i - 1][1]) * (u - P[i - 1][0]) / (P[i][0] - P[i - 1][0]))
  return 100
}

export function crea({ seme = 7, meteo = null } = {}) {
  const [c, g] = tela(), [sfondo, gs] = tela(), [velo, gv] = tela(), [foglio, gq] = tela(240, 8), [faccia, gfa] = tela(44, 64)
  let chiave = '', C = null, met = meteo
  // le righe del vecchio monitor e gli angoli scuri (si fanno una volta)
  for (let y = 0; y < H; y += 2) { gv.fillStyle = 'rgba(0,0,0,0.13)'; gv.fillRect(0, y, W, 1) }
  const vg = gv.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)')
  gv.fillStyle = vg; gv.fillRect(0, 0, W, H)
  omino(gfa, 22, 60, { vista: 'fronte' }) // la tua faccia per il login

  // lo sfondo del login e del desktop: il cielo di adesso sopra i pioppi della pianura (si rifà ogni minuto)
  function prepara(adesso) {
    C = cielo(adesso, met)
    const q = semi(seme)
    dipingiCielo(gs, C, H, seme)
    const scuro = mescola(C.colori[2], '#0b090e', 0.7)
    for (let x = -4; x < W + 8; x += 7 + Math.floor(q() * 6)) pioppo(gs, q, x, 214, 26 + q() * 22, [scuro, mescola(scuro, '#000000', 0.2), mescola(scuro, '#ffffff', 0.06)])
    R(gs, 0, 212, W, H - 212, mescola(scuro, '#000000', 0.3))
  }
  // il testo grande: si scrive piccolo su un foglio e si ingrandisce (senza sfumare)
  function grande(testo, x, y, col, k = 2, centro = false) {
    gq.clearRect(0, 0, 240, 8); scrivi(gq, testo, 0, 1, col)
    const w = largo(testo) + 1
    g.drawImage(foglio, 0, 0, w, 7, Math.round(centro ? x - (w * k) / 2 : x), Math.round(y), w * k, 7 * k)
  }
  const testo = (s, x, y, col = GRIGIO, centro = false) => scrivi(g, s, centro ? Math.round(x - largo(s) / 2) : x, y, col)
  function rotella(cx, cy, t, col = '#ffffff', rr = 9) {
    for (let i = 0; i < 8; i++) { const a = t * 6 + i * Math.PI / 4, k = ((i + Math.floor(t * 8)) % 8) / 7; R(g, cx + Math.cos(a) * rr - 1, cy + Math.sin(a) * rr - 1, 3, 3, mescola('#3a3444', col, k)) }
  }

  function disegna(tt, adesso) {
    const kk = `${adesso.getHours()}:${adesso.getMinutes()}|${met?.icona}`
    if (kk !== chiave) { chiave = kk; prepara(adesso) }
    const giro = Math.floor(tt / F.fine), u = tt - giro * F.fine
    const fase = u < F.bios ? 'spento' : u < F.logo ? 'bios' : u < F.aggiorna ? 'logo' : u < F.nero ? 'aggiorna' : u < F.login ? 'nero' : u < F.desktop ? 'login' : u < F.glitch ? 'desktop' : u < F.errore ? 'glitch' : 'errore'
    const v = u - F[fase]
    let pct = null, tasti = 0, icone = 0
    R(g, 0, 0, W, H, NERO)

    if (fase === 'spento') {
      // la riga bianca che si chiude, il puntino che si spegne; poi il cursore che lampeggia
      if (v < 0.25) { const h = Math.max(2, H * (1 - v / 0.25)); R(g, 0, H / 2 - h / 2, W, h, mescola('#ffffff', NERO, v / 0.4)) }
      else if (v < 0.55) { const w = Math.max(2, W * (1 - (v - 0.25) / 0.3)); R(g, W / 2 - w / 2, H / 2 - 1, w, 2, '#ffffff') }
      else if (v < 1) { const a = 1 - (v - 0.55) / 0.45; g.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`; g.fillRect(W / 2 - 1, H / 2 - 1, 3, 3) }
      if (v > 1.4 && Math.floor(v * 2.5) % 2) R(g, 12, 18, 3, 5, GRIGIO)
    } else if (fase === 'bios') {
      let y = 14, ultimo = null
      for (const [da, riga, col] of BIOS) {
        if (v < da) break
        let s = riga
        if (riga === 'MEMORIA') { const n = Math.min(32768, Math.floor((v - da) / 1.6 * 32768 / 64) * 64); s = `MEMORIA: ${n} MB ${n >= 32768 ? 'OK' : ''}` }
        const vede = riga === 'MEMORIA' ? s : s.slice(0, Math.floor((v - da) * 60))
        const lampeggia = da === 6.6 && Math.floor(v * 2) % 2
        if (!lampeggia) testo(vede, 12, y, col ?? GRIGIO)
        ultimo = [12 + largo(vede) + 2, y]
        y += riga === 'COPYRIGHT 2026 PZKKO.IT' ? 16 : 9
      }
      if (ultimo && Math.floor(v * 3) % 2) R(g, ultimo[0], ultimo[1], 3, 5, GRIGIO)
      g.drawImage(figura(LUMACA, PAL_LUMACA), W - 12 - 42, 12, 42, 24) // la lumaca in alto a destra
      testo('ENERGY STAR? NO, RED BULL.', W - 12 - largo('ENERGY STAR? NO, RED BULL.'), H - 16, '#6a6474')
    } else if (fase === 'logo' || fase === 'nero') {
      if (fase === 'logo') {
        const a = Math.min(1, v / 0.6)
        g.globalAlpha = a; g.drawImage(figura(LUMACA, PAL_LUMACA), W / 2 - 42, 12, 84, 48); g.globalAlpha = 1
        grande('PZKKO OS', W / 2, 64, LIME, 2, true)
      }
      rotella(W / 2, 222, tt)
    } else if (fase === 'aggiorna') {
      for (let y = 0; y < H; y++) R(g, 0, y, W, 1, mescola('#2a0a4a', '#120420', y / H))
      pct = percento(v)
      rotella(W / 2, 26, tt, LIME, 11)
      grande(`AGGIORNAMENTO ${giro + 1} DI 3`, W / 2, 46, '#ffffff', 2, true)
      grande(`${pct}%`, W / 2, 194, LIME, 5, true)
      R(g, W / 2 - 101, 234, 202, 8, '#0b090e'); R(g, W / 2 - 100, 235, 200, 6, '#3a1a5a'); R(g, W / 2 - 100, 235, 2 * pct, 6, LIME)
      testo(pct >= 99 && pct < 100 ? 'CI SIAMO QUASI. QUASI.' : 'NON SPEGNERE IL PC. CI VORRA\' UN PO\'.', W / 2, 250, GRIGIO, true)
    } else if (fase === 'login') {
      g.drawImage(sfondo, 0, 0)
      const su = ss(4, 5, v) // dopo 4 secondi arriva il pannello col tuo nome (in basso: in mezzo c'è la scritta)
      const ora = `${String(adesso.getHours()).padStart(2, '0')}:${String(adesso.getMinutes()).padStart(2, '0')}`
      const data = adesso.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
      grande(ora, W / 2, 12, '#ffffff', 7, true); testo(data, W / 2, 64, '#ffffff', true)
      if (su > 0) {
        g.globalAlpha = su
        const y0 = 196 + (1 - su) * 20, ax = W / 2 - 80, ay = y0 + 30
        g.fillStyle = 'rgba(11,9,14,0.5)'; g.fillRect(W / 2 - 112, y0, 224, 64)
        // la faccia: l'omino di fronte, solo la testa, in un tondo col bordo lime
        ellisse(g, ax, ay, 22, 22, LIME); ellisse(g, ax, ay, 20, 20, '#2a2436')
        g.save(); g.beginPath(); g.arc(ax, ay, 20, 0, 7); g.clip(); g.drawImage(faccia, 13, 10, 18, 20, ax - 24, ay - 23, 48, 53); g.restore()
        grande('GIUGNOH', W / 2 - 50, y0 + 8, '#ffffff', 2)
        R(g, W / 2 - 50, y0 + 27, 140, 14, '#f4f2f8'); R(g, W / 2 - 49, y0 + 28, 138, 12, '#ffffff')
        tasti = Math.max(0, Math.min(8, Math.floor((v - 5.6) * 2.2)))
        for (let i = 0; i < tasti; i++) ellisse(g, W / 2 - 41 + i * 9, y0 + 33, 2, 2, '#1a1424')
        if (v < 9.4 && tasti < 8 && Math.floor(v * 3) % 2) R(g, W / 2 - 44 + tasti * 9, y0 + 29, 1, 9, '#1a1424')
        if (v > 9.6) { testo('BENVENUTO', W / 2 - 50, y0 + 48, LIME); rotella(W / 2 + 30, y0 + 50, tt, '#ffffff', 5) }
        g.globalAlpha = 1
      }
    } else if (fase === 'desktop' || fase === 'glitch') {
      const w = fase === 'glitch' ? 20 : v
      g.drawImage(sfondo, 0, 0)
      // le finestre che si aprono
      const finestre = [[2, 40, 30, 200, 120, 'DIRETTA OS'], [5, 210, 60, 220, 110, 'PZKKO.IT'], [8.5, 120, 100, 170, 90, 'CHAT']]
      for (const [da, x, y, fw, fh, nome] of finestre) {
        if (w < da) continue
        const k = ss(da, da + 0.4, w), cx = x + fw / 2, cy = y + fh / 2, ww = fw * k, hh = fh * k
        R(g, cx - ww / 2 - 1, cy - hh / 2 - 1, ww + 2, hh + 2, '#0b090e'); R(g, cx - ww / 2, cy - hh / 2, ww, hh, '#1e1a26'); R(g, cx - ww / 2, cy - hh / 2, ww, 9, VIOLA)
        if (k > 0.95) {
          testo(nome, x + 4, y + 2, '#ffffff'); R(g, x + fw - 8, y + 2, 5, 5, '#ff3d4a')
          for (let i = 0; i < Math.floor((fh - 16) / 8); i++) R(g, x + 6, y + 14 + i * 8, (fw - 20) * (0.4 + 0.6 * ((i * 37 + da * 13) % 10) / 10), 3, i ? '#3a3444' : LIME)
          if (nome === 'DIRETTA OS') { R(g, x + fw - 60, y + 16, 50, 50, '#120e16'); g.drawImage(figura(LUMACA, PAL_LUMACA), x + fw - 56, y + 30, 42, 24) }
        }
      }
      if (w > 10 && w < 15) { const k = ss(10, 10.5, w) * (1 - ss(14.5, 15, w)); R(g, W - 150 * k, 190, 140, 26, '#1e1a26'); R(g, W - 150 * k, 190, 3, 26, LIME); testo('AGGIORNAMENTI INSTALLATI', W - 144 * k, 196, '#ffffff'); testo('NON SONO SERVITI A NIENTE', W - 144 * k, 205, GRIGIO) }
      // la barra in basso: le icone arrivano una alla volta
      R(g, 0, H - 18, W, 18, 'rgba(14,10,20,0.88)'); R(g, 0, H - 18, W, 1, '#3a3444')
      icone = Math.min(ICONE.length, Math.floor(w / 0.6))
      R(g, 6, H - 15, 12, 12, LIME); scrivi(g, 'P', 11, H - 12, '#0b090e')
      for (let i = 0; i < icone; i++) { const k = Math.min(1, (w - i * 0.6) / 0.3), s = Math.round(12 * (0.4 + 0.6 * k)), x = 28 + i * 18 + (12 - s) / 2, y = H - 15 + (12 - s) / 2; R(g, x, y, s, s, ICONE[i]); if (k >= 1) scrivi(g, SIGLE[i], x + 4, y + 3, '#0b090e'); if (k >= 1 && i === icone - 1 && i < ICONE.length - 1) R(g, x + 2, H - 2, 8, 1, '#ffffff') }
      testo(`${String(adesso.getHours()).padStart(2, '0')}:${String(adesso.getMinutes()).padStart(2, '0')}`, W - 26, H - 12, '#ffffff')
      // il cursore che gira (e la rotellina accanto: sta ancora caricando)
      const mx = Math.round(W / 2 + Math.sin(w * 0.7) * 150 + Math.sin(w * 1.9) * 30), my = Math.round(H / 2 + Math.sin(w * 0.9 + 1) * 70)
      g.drawImage(figura(FRECCIA, { k: '#0b090e', w: '#ffffff' }), mx, my)
      if (w < 16) rotella(mx + 14, my + 12, tt, '#ffffff', 4)
      if (fase === 'glitch') { // si pianta: le strisce che scivolano, i colori sbagliati
        const q = semi(Math.floor(tt * 20))
        for (let i = 0; i < 9; i++) { const y = Math.floor(q() * H), h = 2 + Math.floor(q() * 14), dx = Math.floor((q() - 0.5) * 60); g.drawImage(c, 0, y, W, h, dx, y, W, h) }
        g.fillStyle = `rgba(${q() < 0.5 ? '157,0,255' : '204,255,0'},0.12)`; g.fillRect(0, 0, W, H)
      }
    } else { // lo schermo viola: «:(», le percentuali, poi si riavvia di nuovo
      R(g, 0, 0, W, H, '#3a0a6a')
      // «:(» (la scrittura a pixel non ha la parentesi: si disegna qui, 3 × 5 a quadrettoni)
      for (const [dx, m] of [[0, '...' + '.#.' + '...' + '.#.' + '...'], [30, '.#.' + '#..' + '#..' + '#..' + '.#.']]) for (let i = 0; i < 15; i++) if (m[i] === '#') R(g, 40 + dx + (i % 3) * 9, 16 + Math.floor(i / 3) * 9, 9, 9, '#ffffff')
      pct = Math.min(100, Math.floor(ss(0.5, 12, v) * 100))
      testo('IL PC HA AVUTO UN PROBLEMA E DEVE RIAVVIARSI.', 110, 24, '#ffffff'); testo('STO RACCOGLIENDO UN PO\' DI INFORMAZIONI, POI LO RIAVVIO.', 110, 34, GRIGIO)
      testo('PER SAPERNE DI PIU\': TORNO SUBITO.', 110, 50, GRIGIO); testo('CODICE: PZKKO HA DETTO NO', 110, 60, GRIGIO)
      grande(`${pct}% COMPLETATO`, 40, 200, '#ffffff', 3)
      const q = semi(seme + 77), qx = W - 84, qy = 196
      R(g, qx, qy, 44, 44, '#ffffff'); for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (q() < 0.5) R(g, qx + 2 + x * 2, qy + 2 + y * 2, 2, 2, '#3a0a6a')
      if (v > 13 && Math.floor(v * 4) % 2) R(g, 0, 0, W, H, 'rgba(255,255,255,0.08)')
    }
    g.drawImage(velo, 0, 0)
    // per la scritta al centro (scritta.js)
    return { fase, u: v, pct, giro, tasti, icone }
  }
  return { tela: c, disegna, meteo(m) { if (m && JSON.stringify(m) !== JSON.stringify(met)) { met = m; chiave = '' } } }
}
