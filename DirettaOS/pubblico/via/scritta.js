// Diretta OS · la scritta dei «torno subito»: grande, al centro dello schermo, viva.
// Quando premi un «torno subito» gli altri link si spengono (lo fa il server) e resta la scena con questa scritta in
// mezzo. Si muove lettera per lettera, ognuna col suo passo, secondo la scena e secondo quello che succede nella scena
// in quel momento: il ciocco che cade nella stufa (la scritta sobbalza, si accende e schizzano le scintille), la corsa
// nel bosco e «ahh», i passi verso casa e «ho trovato i tortelli!», il microonde, «mi vedete?» in postazione. La scena
// lo dice a ogni fotogramma (via.js → dice()) e la riga sotto il titolo lo racconta. Dietro e davanti alle lettere ci
// sono due tele, per la luce e per quello che vola: scintille, lucciole, foglie, gocce, bolle, vapore, briciole, pixel.
// Il tempo è quello della scena (da quando hai premuto): la regia e Camo, anche ricaricati a metà, vedono lo stesso.
// Gira nel giro unico della pagina (giro.js) e solo mentre si vede: quando sei qui non costa niente.

import { ogniGiro } from '/giro.js'

const M = 240 // quanto le due tele escono dalla scritta, per lato (le scintille volano in alto)

// ── piccoli attrezzi ──
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const caso = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) } // sempre lo stesso per lo stesso n
const rumore = (x) => { const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f); return caso(i) * (1 - k) + caso(i + 1) * k } // 0–1, morbido
const molla = (x) => (x <= 0 ? 0 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x)) // da 0 a 1 con un rimbalzino
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(3)})`
const tavolozza = (l) => l.map(([k, h]) => [k, hex(h)])
function scala(punti, k) { // un colore lungo una scala [[0, rgb], …, [1, rgb]]
  k = clamp(k)
  for (let i = 1; i < punti.length; i++) if (k <= punti[i][0]) { const [a, ca] = punti[i - 1], [b, cb] = punti[i]; return mix(ca, cb, (k - a) / (b - a)) }
  return punti[punti.length - 1][1]
}
function hsl(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l)
  return [0, 8, 4].map((n) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
}
const rnd = Math.random // (solo per le cose che volano: le lettere invece fanno tutte e due le pagine uguali)

const LIME = hex('#ccff00'), GIALLO = hex('#ffe14d'), BIANCO = [255, 255, 255], VIOLA = hex('#9d00ff'), ROSA = hex('#ff73fa')
const FUOCO = tavolozza([[0, '#8a1806'], [0.3, '#e0400c'], [0.55, '#ff8a14'], [0.75, '#ffc83a'], [0.9, '#ffec94'], [1, '#fff9e6']])
const ACQUA = tavolozza([[0, '#2fc8ff'], [0.5, '#7eeeff'], [1, '#e8fdff']])
const CIBO = tavolozza([[0, '#ff8a1a'], [0.5, '#ffb03a'], [1, '#ffe28a']])
const FOGLIE = { autunno: ['#e8742a', '#c8461e', '#f0b030', '#a8551e'], primavera: ['#ffd0e4', '#ffffff', '#ffb0d0'], estate: ['#ffffff', '#f4f0c8'], inverno: [] }

// ── le cose che volano: come nascono, come si muovono, come si disegnano (k = età da 0 a 1) ──
const COSE = {
  scintilla: {
    piu: true,
    nasce(p, L, botto) {
      p.x = L.px + (rnd() - 0.5) * L.w; p.y = L.py - L.h * (0.15 + rnd() * 0.3)
      const v = botto ? 260 + rnd() * 420 : 70 + rnd() * 140, ang = -Math.PI / 2 + (rnd() - 0.5) * (botto ? 1.9 : 0.8)
      p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v; p.vita = 0.8 + rnd() * 1.5; p.s = 1.4 + rnd() * 2.4
    },
    muovi(p, dt, t) { p.vy -= 40 * dt; p.vx += (rumore(t * 3 + p.seme * 50) - 0.5) * 260 * dt; p.vx *= 1 - 0.9 * dt; p.vy *= 1 - 0.6 * dt },
    disegna(g, p, k) {
      g.strokeStyle = rgba(scala(FUOCO, 1 - k * 0.85), 1 - k * k); g.lineWidth = p.s
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); g.stroke()
    },
  },
  coriandolo: {
    nasce(p, L, botto, S) {
      p.x = S.cx + (rnd() - 0.5) * 200; p.y = S.cy + (rnd() - 0.5) * 60
      const v = 320 + rnd() * 520, ang = rnd() * Math.PI * 2
      p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v * 0.7 - 260; p.vita = 1.3 + rnd() * 1.1; p.s = 8 + rnd() * 8
      p.c = [LIME, VIOLA, BIANCO, S.accento, ROSA][Math.floor(rnd() * 5)]; p.ang = rnd() * 6; p.va = (rnd() - 0.5) * 18
    },
    muovi(p, dt) { p.vy += 620 * dt; p.vx *= 1 - 1.4 * dt; p.vy *= 1 - 0.9 * dt; p.ang += p.va * dt },
    disegna(g, p, k) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.ang); g.scale(1, Math.cos(p.ang * 1.7))
      g.fillStyle = rgba(p.c, 1 - ss(0.6, 1, k)); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore()
    },
  },
  stella: {
    piu: true,
    nasce(p, L, botto, S) {
      p.x = S.cx + (rnd() - 0.5) * S.w * 0.9; p.y = S.cy + (rnd() - 0.5) * S.h * 0.8
      p.vx = (rnd() - 0.5) * 60; p.vy = -20 - rnd() * 60; p.vita = 0.6 + rnd() * 0.7; p.s = 10 + rnd() * 16; p.c = rnd() < 0.5 ? LIME : BIANCO
    },
    muovi() {},
    disegna(g, p, k) {
      const r = p.s * Math.sin(Math.PI * k), al = 1 - k
      g.strokeStyle = rgba(p.c, al); g.lineWidth = 2.5
      g.beginPath(); g.moveTo(p.x - r, p.y); g.lineTo(p.x + r, p.y); g.moveTo(p.x, p.y - r); g.lineTo(p.x, p.y + r); g.stroke()
      g.fillStyle = rgba(BIANCO, al); g.beginPath(); g.arc(p.x, p.y, 2.5, 0, 7); g.fill()
    },
  },
  foglia: {
    nasce(p, L, botto, S) {
      p.x = S.cx + (rnd() - 0.5) * (S.w + 300); p.y = S.cy - S.h / 2 - 160 - rnd() * 60
      p.vx = 20 + rnd() * 40; p.vy = 50 + rnd() * 50; p.vita = 6; p.s = 9 + rnd() * 7; p.ang = rnd() * 6; p.va = (rnd() - 0.5) * 4
      const l = FOGLIE[S.stagione] ?? FOGLIE.autunno; p.c = hex(l[Math.floor(rnd() * l.length)] ?? '#e8742a')
    },
    muovi(p, dt, t) { p.vx = 30 + Math.sin(t * 1.3 + p.seme * 9) * 60; p.ang += p.va * dt + Math.sin(t * 2 + p.seme) * 0.02 },
    disegna(g, p, k) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.ang); g.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(p.ang * 1.3)))
      g.fillStyle = rgba(p.c, 1 - ss(0.75, 1, k)); g.strokeStyle = rgba([11, 9, 14], 0.8 * (1 - ss(0.75, 1, k))); g.lineWidth = 2
      g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 7); g.fill(); g.stroke(); g.restore()
    },
  },
  neve: {
    nasce(p, L, botto, S) { p.x = S.cx + (rnd() - 0.5) * (S.w + 400); p.y = S.cy - S.h / 2 - 160; p.vx = 0; p.vy = 40 + rnd() * 40; p.vita = 9; p.s = 2 + rnd() * 3 },
    muovi(p, dt, t) { p.vx = Math.sin(t * 0.9 + p.seme * 7) * 30 },
    disegna(g, p, k) { g.fillStyle = rgba(BIANCO, 0.9 * (1 - ss(0.8, 1, k))); g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.fill() },
  },
  goccia: { // cade sulla lettera e schizza
    nasce(p, L) { p.x = L.px + (rnd() - 0.5) * L.w * 0.8; p.fondo = L.py - L.h * 0.42; p.y = p.fondo - 260 - rnd() * 260; p.vx = -30; p.vy = 900 + rnd() * 300; p.vita = 2; p.s = 2 },
    muovi(p, dt, t, S) { if (p.y >= p.fondo) { p.v = p.vita; for (let i = 0; i < 3; i++) S.nasci('schizzo', null, { x: p.x, y: p.fondo }) } },
    disegna(g, p) { g.strokeStyle = 'rgba(200,225,255,.75)'; g.lineWidth = p.s; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.025); g.stroke() },
  },
  schizzo: {
    nasce(p) { p.vx = (rnd() - 0.5) * 160; p.vy = -90 - rnd() * 120; p.vita = 0.35; p.s = 2 },
    muovi(p, dt) { p.vy += 900 * dt },
    disegna(g, p, k) { g.fillStyle = `rgba(210,232,255,${(0.9 * (1 - k)).toFixed(2)})`; g.fillRect(p.x - 1, p.y - 1, p.s, p.s) },
  },
  bolla: {
    nasce(p, L) { p.x = L.px + (rnd() - 0.5) * L.w; p.y = L.py + L.h * 0.3; p.vx = 0; p.vy = -45 - rnd() * 60; p.vita = 1.4 + rnd() * 1.8; p.s = 3 + rnd() * 7 },
    muovi(p, dt, t) { p.vx = Math.sin(t * 5 + p.seme * 11) * 24 },
    disegna(g, p, k) {
      const al = k > 0.92 ? 0 : 0.85
      g.strokeStyle = rgba([228, 252, 255], al); g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, p.s * (1 + k * 0.3), 0, 7); g.stroke()
      g.fillStyle = rgba(BIANCO, al); g.fillRect(p.x - p.s * 0.45, p.y - p.s * 0.45, 2, 2)
    },
  },
  vapore: {
    nasce(p, L) { p.x = L.px + (rnd() - 0.5) * L.w; p.y = L.py - L.h * 0.45; p.vx = (rnd() - 0.5) * 16; p.vy = -32 - rnd() * 24; p.vita = 2.4 + rnd() * 1.4; p.s = 12 + rnd() * 10 },
    muovi(p, dt, t) { p.vx += Math.sin(t * 1.7 + p.seme * 5) * 30 * dt },
    disegna(g, p, k) {
      const r = p.s + k * 46, gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
      gr.addColorStop(0, `rgba(255,255,255,${(0.2 * Math.sin(Math.PI * k)).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, r * 2, r * 2)
    },
  },
  briciola: {
    nasce(p, L) { p.x = L.px + (rnd() - 0.5) * L.w; p.y = L.py + L.h * 0.25; p.vx = (rnd() - 0.5) * 140; p.vy = -60 - rnd() * 120; p.vita = 0.9; p.s = 3 + Math.floor(rnd() * 3); p.c = rnd() < 0.5 ? hex('#e8b04a') : hex('#b8742a') },
    muovi(p, dt) { p.vy += 900 * dt },
    disegna(g, p, k) { g.fillStyle = rgba(p.c, 1 - ss(0.7, 1, k)); g.fillRect(p.x, p.y, p.s, p.s) },
  },
  pixel: { // i quadratini colorati di quando una lettera torna a posto
    nasce(p, L) { p.x = L.px + (rnd() - 0.5) * L.w; p.y = L.py + (rnd() - 0.5) * L.h * 0.6; p.vx = (rnd() - 0.5) * 260; p.vy = -120 - rnd() * 220; p.vita = 0.6 + rnd() * 0.4; p.s = 6; p.c = L.col ?? LIME },
    muovi(p, dt) { p.vy += 800 * dt },
    disegna(g, p, k) { g.fillStyle = rgba(p.c, 1 - ss(0.6, 1, k)); g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); g.strokeStyle = rgba([11, 9, 14], 1 - ss(0.6, 1, k)); g.lineWidth = 1.5; g.strokeRect(Math.round(p.x), Math.round(p.y), p.s, p.s) },
  },
  onda: { // la voce (o lo squillo): archi che partono dai lati della scritta e si allargano
    nasce(p, L, botto, S) { p.d = rnd() < 0.5 ? -1 : 1; p.x = S.cx + p.d * (S.w / 2 + 24); p.y = S.cy + (rnd() - 0.5) * 30; p.vita = 0.9; p.c = S.m.ondaCol ?? LIME },
    muovi() {},
    disegna(g, p, k) {
      const r = 14 + k * 110
      g.strokeStyle = rgba(p.c, 0.9 * (1 - k)); g.lineWidth = 6 * (1 - k * 0.6)
      g.beginPath(); g.arc(p.x - p.d * 14, p.y, r, p.d > 0 ? -0.55 : Math.PI - 0.55, p.d > 0 ? 0.55 : Math.PI + 0.55); g.stroke()
    },
  },
  scheggia: { // le schegge del ciocco spaccato: partono dal centro della scritta, girano e cadono
    nasce(p, L, botto, S) {
      p.x = S.cx + (rnd() - 0.5) * 40; p.y = S.cy - S.h * 0.2
      const v = 280 + rnd() * 520, ang = -Math.PI / 2 + (rnd() - 0.5) * 2.6
      p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v; p.vita = 1 + rnd() * 0.6; p.s = 8 + rnd() * 10; p.ang = rnd() * 6; p.va = (rnd() - 0.5) * 20
      p.c = [hex('#e2c08e'), hex('#f4dcb4'), hex('#8a5a32'), hex('#c08050')][Math.floor(rnd() * 4)]
    },
    muovi(p, dt) { p.vy += 1100 * dt; p.vx *= 1 - 0.8 * dt; p.ang += p.va * dt },
    disegna(g, p, k) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.ang)
      g.fillStyle = rgba([11, 9, 14], 1 - ss(0.7, 1, k)); g.fillRect(-p.s / 2 - 2, -4, p.s + 4, 8)
      g.fillStyle = rgba(p.c, 1 - ss(0.7, 1, k)); g.fillRect(-p.s / 2, -2, p.s, 4); g.restore()
    },
  },
  piuma: { // le piume delle ali (la Red Bull): scendono ondeggiando
    nasce(p, L, botto, S) { const d = rnd() < 0.5 ? -1 : 1; p.x = S.cx + d * (S.w / 2 + 60 + rnd() * 60); p.y = S.cy - 40 + (rnd() - 0.5) * 80; p.vx = d * (40 + rnd() * 80); p.vy = -60 - rnd() * 80; p.vita = 2 + rnd(); p.ang = rnd() * 6 },
    muovi(p, dt, t) { p.vy = Math.min(p.vy + 120 * dt, 50); p.vx *= 1 - 1.2 * dt; p.ang = Math.sin(t * 3 + p.seme * 9) * 0.8 },
    disegna(g, p, k) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.ang); g.globalAlpha = 1 - ss(0.7, 1, k)
      g.fillStyle = '#0b090e'; g.beginPath(); g.ellipse(0, 0, 13, 5, 0, 0, 7); g.fill()
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 0, 10, 3, 0, 0, 7); g.fill(); g.restore()
    },
  },
}

// una luce tonda (additiva) dietro a una lettera o a una lucciola
function luce(g, x, y, r, c, al) {
  if (al <= 0.003) return
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, rgba(c, al)); gr.addColorStop(1, rgba(c, 0))
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2)
}

// ── le scene: come entrano le lettere, come vivono, cosa dice la riga sotto ──
// passo(S) una volta per giro (S.f è quello che dice la scena, se c'è), lettera(L, S, q) per ognuna (q: lo spostamento
// tx, ty in px, r in gradi, sx, sy, e il colore col), luce(g, S) sulla tela dietro.
const MODI = {}

// legna nella stufa: lettere di fuoco, che sfarfallano ognuna per conto suo e si accendono quando entra un ciocco
MODI.legna = {
  accento: hex('#ff8a1a'),
  entra: (L) => ({ ty: 150 + 70 * L.s2, r: (L.s1 - 0.5) * 36, s: 0.5 }), // salgono dal basso, come le fiamme
  passo(S) {
    const f = S.f, t = S.t
    const eta = f ? f.eta : t < 1 ? -1 : (t - 1) % 50
    const ciocchi = f ? f.ciocchi : t < 1 ? 0 : Math.floor((t - 1) / 50) + 1
    S.m.fiamma = f ? f.fiammata : eta < 0.45 ? 0 : Math.exp(-(eta - 0.45) / 3.5)
    if (S.m.ciocchi === undefined) S.m.ciocchi = ciocchi // (ricaricata a metà: il colpo solo per i ciocchi nuovi)
    else if (ciocchi > S.m.ciocchi) { S.m.ciocchi = ciocchi; S.colpo(); S.esplodi('scintilla', 120) }
    const tau = t - S.colpoT // il tonfo del ciocco: la scritta sobbalza
    if (tau >= 0 && tau < 1.2) S.tit.ty += 18 * Math.exp(-tau * 6) * Math.sin(tau * 28)
    S.spargi('scintilla', 12 + 80 * S.m.fiamma)
    if (eta < 0) return S.dici('apro la stufa…')
    if (eta < 5) return S.dici(ciocchi <= 1 ? 'dentro il ciocco!' : `ciocco n. ${ciocchi} dentro!`)
    const fr = ['la fiamma si alza', 'crepita…', 'la stufa tira bene', S.gradi != null && S.gradi < 15 ? `fuori ${S.gradi}°, qui si sta bene` : 'si scalda tutto', 'che brace', 'fra un po’ ne metto un altro']
    S.dici(fr[(Math.floor((eta - 5) / 7) + ciocchi) % fr.length])
  },
  lettera(L, S, q) {
    const t = S.t, fl = rumore(t * 5.5 + L.i * 3.1), fl2 = rumore(t * 13 + L.i * 7.7), fi = S.m.fiamma
    const caldo = clamp(0.28 + 0.42 * fl + 0.12 * fl2 + 0.45 * fi + 0.12 * Math.sin(t * 1.7 + L.u * 6))
    L.caldo = caldo
    q.ty += -4 * Math.sin(t * 2.2 + L.u * 9) - 8 * fi * fl
    q.tx += 1.6 * (fl2 - 0.5)
    q.r += 4 * (rumore(t * 2.4 + L.i * 5) - 0.5)
    q.sy *= 1 + 0.08 * (fl - 0.5) + 0.12 * fi * fl
    q.col = scala(FUOCO, caldo)
    // il ciocco: le lettere saltano, a onda dal centro
    const tau = t - S.colpoT - Math.abs(L.u - 0.5) * 0.3
    if (tau > 0 && tau < 1.6) q.ty -= 34 * Math.exp(-tau * 3.5) * Math.abs(Math.sin(tau * 8))
  },
  luce(g, S) {
    luce(g, S.cx, S.cy + S.h * 0.15, S.w * 0.55, hex('#ff6a10'), 0.1 + 0.22 * S.m.fiamma + 0.04 * rumore(S.t * 7))
    for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.85, [255, 90 + 110 * L.caldo, 20], 0.06 + 0.2 * L.caldo)
  },
}

// pipì nel bosco: scappa (le lettere corrono), controlla, poi il sollievo; dopo, sul ceppo, le lucciole
MODI.pipi = {
  accento: LIME,
  ordine: (L) => 1 - L.n, // arrivano di corsa da sinistra: prima le ultime, così non si scavalcano
  entra: () => ({ tx: -1100, r: -14 }),
  passo(S) {
    const f = S.f, t = S.t
    const fase = f?.fase ?? (t < 7.6 ? 'corre' : t < 11.6 ? 'controlla' : t < 38 ? 'fa' : t < 40.4 ? 'fatto' : 'ceppo')
    S.m.fase = fase
    if (fase === 'fatto' && S.m.prima !== 'fatto') { S.colpo(); S.esplodi('stella', 26) }
    S.m.prima = fase
    if (fase === 'guarda-sx') S.tit.tx = -22 * ss(8.2, 8.8, t)
    else if (fase === 'guarda-dx') S.tit.tx = 22 * ss(9.2, 9.7, t) - 22 * (1 - ss(9.2, 9.7, t))
    else if (fase === 'controlla') S.tit.tx = 22 * (1 - ss(10.2, 10.7, t))
    else if (fase === 'ahh') S.tit.ty = 16 * ss(31, 32, t) * (1 - ss(33.6, 34.5, t))
    else if (fase === 'fatto') { const tau = t - S.colpoT; S.tit.s = 1 + 0.18 * Math.exp(-tau * 5) * Math.cos(tau * 14) }
    // di notte le lucciole lime girano attorno alla scritta; di giorno cade quello della stagione; e il tempo che fa
    const notte = f ? f.notte : new Date().getHours() < 7 || new Date().getHours() >= 18
    S.m.lucciole = notte && ['ceppo', 'al-ceppo', 'fa', 'ahh', 'scrolla', 'fatto'].includes(fase)
    const tempo = f?.tempo
    if (tempo === 'pioggia' || tempo === 'temporale') S.spargi('goccia', 26)
    else if (tempo === 'neve') S.spargi('neve', 10)
    else if (!notte && f?.stagione !== 'inverno') S.spargi('foglia', f?.stagione === 'estate' ? 0.6 : 1.3)
    const b = f?.bolla
    if (fase === 'corre') return S.dici('scappa!!')
    if (fase === 'arriva') return S.dici('eccomi…')
    if (fase.startsWith('guarda') || fase === 'controlla') return S.dici('nessuno guarda?')
    if (fase === 'fa') return S.dici(t < 20 ? 'psssss…' : t < 31 ? 'ci voleva' : 'quasi…')
    if (fase === 'ahh') return S.dici('ahhh…')
    if (fase === 'scrolla') return S.dici('scrollatina')
    if (fase === 'fatto') return S.dici('fatto!')
    if (fase === 'al-ceppo') return S.dici('due minuti sul ceppo')
    const detti = { 'CHE STELLE': 'che stelle stanotte', 'PIOVE...': 'piove…', NEBBIA: 'che nebbia', 'BUIO...': 'che buio', 'SI STA BENE': 'si sta bene qui', '♥': '♥' }
    if (b && detti[b]) return S.dici(detti[b])
    if (f?.telefono) return S.dici('guardo il telefono')
    const fr = [notte ? 'le lucciole' : 'si sta bene', S.gradi != null ? `fuori fa ${S.gradi}°` : 'aria fresca', 'due minuti e torno', 'guardo il cielo']
    S.dici(fr[Math.floor((t - 44.6) / 6) % fr.length] ?? fr[0])
  },
  lettera(L, S, q) {
    const t = S.t, fase = S.m.fase
    let giallo = 0
    if (fase === 'corre') { // di corsa, piegate in avanti, a saltelli
      q.ty -= 12 * Math.abs(Math.sin(t * Math.PI * 2.3 + L.i * 1.3)); q.r += -8 + 3 * Math.sin(t * 20 + L.i); q.tx += 3 * (rumore(t * 25 + L.i * 3) - 0.5)
    } else if (fase === 'arriva') { q.r += -8 * (1 - ss(7.6, 8.1, t)) }
    else if (fase === 'guarda-sx' || fase === 'guarda-dx' || fase === 'controlla') { // si guardano attorno, un po' tese
      q.r += fase === 'guarda-sx' ? -6 : fase === 'guarda-dx' ? 6 : 0; q.sy *= 0.95; q.tx += 0.8 * Math.sin(t * 40 + L.i)
    } else if (fase === 'fa' || fase === 'ahh') { // il sollievo: si rilassano e ondeggiano come l'erba
      q.r += 5 * Math.sin(t * 1.3 + L.u * 5); q.ty += 3 * Math.sin(t * 1.05 + L.u * 4)
      if (fase === 'ahh') { q.sx *= 1 + 0.06 * ss(31, 32, t) * (1 - ss(33.6, 34.5, t)); q.ty += 5 * Math.sin(t * 2 + L.u * 6) }
      giallo = ss(0, 1, (f2(S) * 1.3) - L.u * 0.3)
    } else if (fase === 'scrolla') { q.tx += 6 * Math.sin(t * 60 + L.i) * (1 - ss(38.6, 39.6, t)); giallo = 1 - ss(38, 39.6, t) }
    else { // sul ceppo: respirano piano
      q.ty += 4 * Math.sin(t * 0.9 + L.u * 3); q.r += 2 * Math.sin(t * 0.7 + L.u * 4)
    }
    q.col = mix(LIME, GIALLO, 0.75 * giallo)
    // una lucciola vicina accende la lettera
    if (S.m.lucciole) {
      let vicina = 0
      for (const l of S.m.lp ?? []) { const d = Math.hypot(l[0] - L.px, l[1] - L.py); if (d < 90) vicina = Math.max(vicina, (1 - d / 90) * l[2]) }
      if (vicina) q.col = mix(q.col, hex('#f4ffb0'), vicina)
    }
  },
  luce(g, S) {
    if (!S.m.lucciole) { S.m.lp = []; return }
    // 12 lucciole che girano attorno alla scritta (strade di Lissajous, ognuna la sua), accese a intermittenza
    const t = S.t, lp = []
    for (let i = 0; i < 12; i++) {
      const fx = 0.13 + caso(i) * 0.2, fy = 0.21 + caso(i + 40) * 0.25, ph = caso(i + 80) * 6.28
      const x = S.cx + (S.w / 2 + 90) * Math.sin(t * fx + ph), y = S.cy + (S.h / 2 + 70) * Math.sin(t * fy + ph * 1.7)
      const acc = Math.max(0, Math.sin(t * (1.6 + caso(i + 9)) + ph)) ** 2
      lp.push([x, y, acc])
      luce(g, x, y, 34, LIME, 0.5 * acc)
    }
    S.m.lp = lp
  },
  davanti(g, S) { for (const [x, y, acc] of S.m.lp ?? []) if (acc > 0.05) { g.fillStyle = rgba([240, 255, 170], acc); g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill() } },
}
const f2 = (S) => S.f?.pipi ?? clamp((S.t - 11.6) / 24.4)

// bere / mangiare: i passi fino a casa, il frigo che illumina, «ho trovato…!», il microonde, poi a tavola
function casa(bere) {
  const PAL = bere ? ACQUA : CIBO
  return {
    accento: bere ? hex('#5ee7ff') : hex('#ffb03a'),
    entra: (L) => ({ ty: -240 - 90 * L.s1, r: (L.s2 - 0.5) * 50, s: 0.7 }), // cadono dall'alto e rimbalzano
    passo(S) {
      const f = S.f, t = S.t, fase = f?.fase ?? (t < 2.8 ? 'esce' : t < 38.8 ? 'cammina' : 'entra')
      S.m.fase = fase
      if (fase === 'trovato' && S.m.prima !== 'trovato') { S.colpo(); S.esplodi('coriandolo', 80); S.esplodi('stella', 18) }
      if (f?.bolla === 'DING!' && S.m.bolla !== 'DING!') { S.colpo(); S.esplodi('stella', 10) }
      S.m.prima = fase; S.m.bolla = f?.bolla
      const tau = t - S.colpoT
      if (tau >= 0 && tau < 1.5) S.tit.s = 1 + (fase === 'trovato' ? 0.22 : 0.1) * Math.exp(-tau * 4.5) * Math.cos(tau * 13)
      if (fase === 'pensile') S.tit.ty = -12
      else if (fase === 'basso') S.tit.ty = 14
      else if (fase === 'pensa') S.tit.r = 3 * Math.sin(t * 1.2)
      const tavola = fase === 'tavolo'
      if (bere) S.spargi('bolla', tavola ? 10 : fase === 'trovato' || fase === 'piatto' ? 6 : 2)
      else {
        if (f?.scalda && (tavola || fase === 'a-tavola' || (fase === 'microonde' && f?.bolla === 'DING!'))) S.spargi('vapore', 5)
        if (tavola && f?.bocca) S.spargi('briciola', 9)
      }
      const b = f?.bolla, nome = (f?.nome ?? '').replace(/!$/, '')
      if (fase === 'esce') return S.dici('esco dall’ufficio')
      if (fase === 'cammina') {
        if (b === 'FAME...') return S.dici('che fame…'); if (b === 'SETE...') return S.dici('che sete…')
        if (b === 'PIOVE!') return S.dici('piove!'); if (b === 'BRR') return S.dici('brr, che freddo')
        return S.dici(f?.metri != null ? `verso casa · ${f.metri} m` : 'verso casa')
      }
      if (fase === 'entra') return S.dici('eccomi a casa')
      if (fase === 'dentro') return S.dici('in cucina')
      if (fase === 'frigo') return S.dici(b === '?' ? '?' : b === 'MEH' ? 'meh, niente' : 'apro il frigo…')
      if (fase === 'va') return S.dici('vediamo…')
      if (fase === 'pensile') return S.dici(b === 'NO' ? 'niente' : 'nel pensile…')
      if (fase === 'basso') return S.dici('giù in basso…')
      if (fase === 'pensa') return S.dici('hmm…')
      if (fase === 'frigo2') return S.dici(b === '!' ? '!!!' : 'più in fondo…')
      if (fase === 'trovato') return S.dici(nome ? `ho trovato ${nome}!` : 'trovato!')
      if (fase === 'microonde') return S.dici(b === 'DING!' ? 'ding!' : 'nel microonde…')
      if (fase === 'piatto') return S.dici(bere ? (b === 'PSST' ? 'psst!' : 'un bicchiere') : b === '♥' ? '♥' : 'un piatto')
      if (fase === 'a-tavola') return S.dici('a tavola')
      const detti = { GNAM: 'gnam', BUONO: 'buono!', 'GLU GLU': 'glu glu', AHH: 'ahh' }
      if (b && detti[b]) return S.dici(detti[b])
      if (f?.telefono) return S.dici('guardo il telefono')
      const fr = [nome ? `${bere ? 'bevo' : 'mangio'} ${nome}` : bere ? 'bevo' : 'mangio', 'con calma', 'due minuti e torno']
      S.dici(fr[Math.floor(t / 7) % fr.length])
    },
    lettera(L, S, q) {
      const t = S.t, fase = S.m.fase, f = S.f
      let luceFrigo = 0
      if (fase === 'cammina' || fase === 'va' || fase === 'a-tavola' || fase === 'esce') { // i passi: una lettera sì e una no
        const ph = t * Math.PI * 2 * 1.7 + (L.i % 2) * Math.PI
        q.ty -= 10 * Math.max(0, Math.sin(ph)); q.r += 3 * Math.sin(ph)
      } else if (fase === 'frigo' || fase === 'frigo2') { // cercano, illuminate dalla luce fredda del frigo
        q.r += 6 * Math.sin(t * 2.2 + L.u * 3); q.ty -= 4 * Math.abs(Math.sin(t * 3 + L.i)); luceFrigo = 0.45
        if (f?.bolla === '!') q.tx += 2.5 * Math.sin(t * 50 + L.i)
      } else if (fase === 'pensile') { q.r += 4 * Math.sin(t * 1.8 + L.u * 4) }
      else if (fase === 'basso') { q.sy *= 0.86; q.r += 3 * Math.sin(t * 2 + L.i) }
      else if (fase === 'microonde') { q.tx += 0.9 * Math.sin(t * 90 + L.i); q.ty += 1.5 * Math.sin(t * 3 + L.u * 8) }
      else if (fase === 'tavolo') {
        if (bere) { q.ty += 5 * Math.sin(t * 4 - L.u * 10); q.r += 2 * Math.sin(t * 4 - L.u * 10 + 1) } // ondeggia come un bicchiere
        else if (f?.bocca) { const m = Math.abs(Math.sin(t * 14)); q.sy *= 1 - 0.08 * m; q.sx *= 1 + 0.05 * m } // mastica
        else q.ty += 3 * Math.sin(t * 1.4 + L.u * 4)
        if (f?.telefono) q.r += 3
      } else q.ty += 3 * Math.sin(t * 1.6 + L.u * 5)
      let c = scala(PAL, 0.5 + 0.5 * Math.sin(t * 1.4 - L.u * 6))
      if (luceFrigo) c = mix(c, [232, 251, 255], luceFrigo)
      const tau = t - S.colpoT
      if (fase === 'trovato' || tau < 1.2) c = mix(c, LIME, fase === 'trovato' ? 0.7 : 0.5 * (1 - tau / 1.2))
      if (fase === 'tavolo' && f?.telefono) c = mix(c, hex('#bfe0ff'), 0.35)
      q.col = c
    },
    luce(g, S) { for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.8, S.accento, S.m.fase === 'frigo' || S.m.fase === 'frigo2' ? 0.16 : 0.08) },
  }
}
MODI.bere = casa(true)
MODI.mangiare = casa(false)

// la Red Bull: la stessa strada fino a casa (i passi), poi dritto al frigo, «presa!», psst, glu glu… e alla scritta
// spuntano le ali: si alza e resta su, carica (le ali piccole restano finché torni)
const LATTINA = tavolozza([[0, '#2f6fd8'], [0.5, '#8fb8ff'], [1, '#eef3fa']])
function ala(g, x, y, d, k, f) {
  if (k < 0.02) return
  g.save(); g.translate(x, y); g.scale(d * k, k); g.rotate(-0.2 - f * 0.45)
  const penne = [[44, -22, 52, 16, -0.45], [40, 2, 46, 14, -0.25], [30, 22, 34, 11, -0.05]]
  g.fillStyle = '#0b090e'; for (const [px, py, rx, ry, an] of penne) { g.beginPath(); g.ellipse(px, py, rx + 6, ry + 6, an, 0, 7); g.fill() }
  g.fillStyle = '#ffffff'; for (const [px, py, rx, ry, an] of penne) { g.beginPath(); g.ellipse(px, py, rx, ry, an, 0, 7); g.fill() }
  g.fillStyle = '#d8e2f0'; for (const [px, py, rx, ry, an] of penne) { g.beginPath(); g.ellipse(px + 6, py + ry * 0.4, rx * 0.7, ry * 0.35, an, 0, 7); g.fill() }
  g.restore()
}
MODI.lattina = {
  accento: hex('#2f6fd8'),
  entra: MODI.bere.entra,
  passo(S) {
    const f = S.f, t = S.t, fase = f?.fase ?? (t < 2.8 ? 'esce' : t < 38.8 ? 'cammina' : 'entra')
    S.m.fase = fase
    if (fase === 'trovato' && S.m.prima !== 'trovato') { S.colpo(); S.esplodi('coriandolo', 60); S.esplodi('stella', 16) }
    if (f?.bolla === 'PSST!' && S.m.bolla !== 'PSST!') { S.colpo(); for (let i = 0; i < 40; i++) S.nasci('bolla') }
    if (fase === 'ali' && S.m.prima !== 'ali') { S.colpo(); S.esplodi('piuma', 22); S.esplodi('stella', 14) }
    S.m.prima = fase; S.m.bolla = f?.bolla
    // le ali: grandi mentre vola, poi piccole finché torni
    const vuole = fase === 'ali' ? 1 : fase === 'a-tavola' || fase === 'tavolo' ? 0.5 : 0
    S.m.ali = (S.m.ali ?? 0) + (vuole - (S.m.ali ?? 0)) * (1 - Math.exp(-S.dt / 0.35))
    S.tit.ty = -26 * S.m.ali + 6 * S.m.ali * Math.sin(t * 2.4)
    S.spargi('bolla', fase === 'sorso' || fase === 'tavolo' ? 8 : 2)
    if (fase === 'ali') S.spargi('piuma', 3)
    const b = f?.bolla, n = S.redbull
    if (fase === 'esce') return S.dici('esco dall’ufficio')
    if (fase === 'cammina') return S.dici(b === 'SONNO...' ? 'che sonno…' : b === 'PIOVE!' ? 'piove!' : b === 'BRR' ? 'brr, che freddo' : f?.metri != null ? `verso casa · ${f.metri} m` : 'verso casa')
    if (fase === 'entra') return S.dici('eccomi a casa')
    if (fase === 'dentro') return S.dici('so dov’è')
    if (fase === 'frigo') return S.dici(b === '!' ? 'eccola' : 'apro il frigo')
    if (fase === 'trovato') return S.dici('presa: una Red Bull!')
    if (fase === 'apre') return S.dici(b === 'PSST!' ? 'psst!' : 'la apro')
    if (fase === 'sorso') return S.dici(b === 'AHH' ? 'ahh' : 'glu glu glu')
    if (fase === 'ali') return S.dici('mi mette le ali')
    if (fase === 'a-tavola') return S.dici('carico')
    if (b === 'GLU') return S.dici('glu')
    if (b === 'AHH') return S.dici('ahh')
    if (b === 'ANCORA UNA?') return S.dici('ancora una?')
    if (f?.telefono) return S.dici('guardo il telefono')
    const fr = [Number.isFinite(n) ? `è la numero ${n + 1} di oggi` : 'carico a molla', 'carico a molla', 'due minuti e torno']
    S.dici(fr[Math.floor(t / 7) % fr.length])
  },
  lettera(L, S, q) {
    const t = S.t, fase = S.m.fase, ali = S.m.ali ?? 0
    if (fase === 'cammina' || fase === 'esce' || fase === 'a-tavola') { const ph = t * Math.PI * 2 * 1.7 + (L.i % 2) * Math.PI; q.ty -= 10 * Math.max(0, Math.sin(ph)); q.r += 3 * Math.sin(ph) }
    else if (fase === 'frigo') q.r += 5 * Math.sin(t * 2.2 + L.u * 3)
    else if (fase === 'apre') { const tau = t - S.colpoT; if (tau > 0 && tau < 1.2) { q.ty -= 14 * Math.exp(-tau * 4) * (0.5 + rumore(t * 20 + L.i * 3)); q.tx += 3 * Math.sin(t * 50 + L.i) * Math.exp(-tau * 3) } }
    else if (fase === 'sorso') { q.ty += 5 * Math.sin(t * 4 - L.u * 10); q.r += 2 * Math.sin(t * 4 - L.u * 10 + 1) }
    else q.ty += 3 * Math.sin(t * 1.6 + L.u * 5)
    // carico: un tremolio veloce, come la caffeina
    if (fase === 'ali' || fase === 'tavolo' || fase === 'a-tavola') { const e = fase === 'ali' ? 1 : 0.55; q.tx += (rumore(t * 30 + L.i * 7) - 0.5) * 4 * e; q.ty += (rumore(t * 27 + L.i * 3) - 0.5) * 3 * e }
    let c = scala(LATTINA, 0.5 + 0.5 * Math.sin(t * 1.4 - L.u * 6))
    if (fase === 'frigo') c = mix(c, [232, 251, 255], 0.45)
    if (fase === 'trovato') c = mix(c, LIME, 0.6)
    if (ali > 0.6) c = mix(c, BIANCO, 0.35 * ali)
    q.col = c
  },
  luce(g, S) { for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.8, [80, 140, 255], 0.09 + 0.08 * (S.m.ali ?? 0)) },
  davanti(g, S) {
    const k = S.m.ali ?? 0, f = Math.sin(S.t * (k > 0.7 ? 11 : 6)), y = S.cy - 6 + S.tit.ty
    ala(g, S.cx - S.w / 2 - 14, y, -1, k * 1.25, f); ala(g, S.cx + S.w / 2 + 14, y, 1, k * 1.25, f)
  },
}

// al telefono: squilla (le lettere vibrano a scatti), «pronto?», poi la voce: quando parla le lettere saltano come un
// equalizzatore e partono gli archi della voce; quando ascolta stanno quiete e annuiscono; quando ride si piegano
MODI.telefono = {
  accento: LIME,
  entra: (L) => ({ s: 0.15, r: (L.s1 - 0.5) * 40 }), // si accendono dal niente, come uno squillo
  passo(S) {
    const f = S.f, t = S.t, fase = f?.fase ?? (t < 2.6 ? 'esce' : t < 4.6 ? 'risponde' : 'cammina')
    S.m.fase = fase; S.m.squilla = f ? f.squilla : t < 3; S.m.parla = !!f?.parla; S.m.ride = !!f?.ride; S.m.ascolta = !!f?.ascolta
    S.m.ondaCol = S.m.squilla ? BIANCO : LIME
    if (S.m.squilla) S.spargi('onda', Math.sin(t * Math.PI * 2 / 0.8) > 0 ? 7 : 0)
    if (S.m.parla) S.spargi('onda', 2.6)
    const b = f?.bolla
    if (S.m.ascolta && b && b !== S.m.bolla && b !== '...') S.m.annuisce = t // annuisce quando dice «mh mh»
    S.m.bolla = b
    if (S.m.ride) S.tit.r = 2 * Math.sin(t * 9)
    const tempo = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
    if (fase === 'esce') return S.dici('drin drin…')
    if (fase === 'risponde') return S.dici(b === 'PRONTO?' ? 'pronto?' : 'chi è?')
    if (b === 'IN DIRETTA!') return S.dici('sono in diretta!')
    if (b && b !== '...') return S.dici(b.toLowerCase())
    if (fase === 'panca') return S.dici(`mi siedo un attimo · ${tempo(f?.chiamata ?? 0)}`)
    S.dici(`in chiamata da ${tempo(f?.chiamata ?? t - 3.4)}`)
  },
  lettera(L, S, q) {
    const t = S.t
    let c = mix(LIME, BIANCO, 0.25 + 0.25 * Math.sin(t * 0.9 - L.u * 4))
    if (S.m.squilla) { // squilla: vibra a scatti, come il telefono sul tavolo
      if (Math.sin(t * Math.PI * 2 / 0.8) > 0) { q.tx += 2.6 * Math.sin(t * 95 + L.i * 2); q.r += 2.5 * Math.sin(t * 77 + L.i) }
    } else if (S.m.ride) { q.ty -= 9 * Math.abs(Math.sin(t * 14 + L.i * 0.9)); q.r += 7 * Math.sin(t * 12 + L.i * 2) }
    else if (S.m.parla) { // l'equalizzatore della voce
      const v = 14 * rumore(t * 9 + L.i * 1.7) * (0.45 + 0.55 * Math.abs(Math.sin(t * 13 + L.u * 7)))
      q.ty -= v; q.sy *= 1 + v / 70; c = mix(c, BIANCO, v / 18)
    } else { // ascolta: quieto, un po' piegato, e annuisce
      q.r += 3 * Math.sin(t * 0.8 + L.u * 2)
      const tau = t - (S.m.annuisce ?? -9) - L.u * 0.12
      if (tau > 0 && tau < 0.7) q.ty += 11 * Math.sin(Math.PI * tau / 0.35) * (tau < 0.35 ? 1 : 0.5)
    }
    if (S.m.fase === 'cammina') q.ty -= 4 * Math.max(0, Math.sin(t * Math.PI * 2 * 1.3 + (L.i % 2) * Math.PI))
    q.col = c
  },
  luce(g, S) { for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.8, LIME, S.m.parla ? 0.12 : 0.06) },
}

// spacco la legna: le lettere color legno; mentre alza l'ascia si tirano su in tensione, al colpo la scritta si
// spacca a metà (le lettere di sinistra a sinistra, quelle di destra a destra) e torna su, con le schegge
const LEGNO = tavolozza([[0, '#b8743e'], [0.5, '#e2b07a'], [1, '#f6e0bc']])
MODI.spacco = {
  accento: hex('#e2a35a'),
  entra: (L) => ({ ty: -300 - 120 * L.s2, r: (L.s1 - 0.5) * 50 }), // cadono come ciocchi
  passo(S) {
    const f = S.f, t = S.t, fase = f?.fase ?? 'arriva', n = f?.spacchi ?? 0
    S.m.fase = fase; S.m.alza = f?.alza ?? 0
    if (S.m.n === undefined) S.m.n = n
    else if (n > S.m.n) { S.m.n = n; S.colpo(); S.esplodi('scheggia', 46) }
    if (fase === 'bloccata' && S.m.prima !== 'bloccata') S.m.blocca = t
    S.m.prima = fase
    const tau = t - S.colpoT
    if (tau >= 0 && tau < 0.6) S.tit.ty += 12 * Math.exp(-tau * 9) * Math.sin(tau * 45)
    if (f?.freddo && (fase === 'colpo' || fase === 'riposa')) S.spargi('vapore', 3)
    const b = f?.bolla
    if (fase === 'arriva') return S.dici(b === 'BRR...' ? 'brr, che freddo' : 'al lavoro')
    if (fase === 'prende') return S.dici('un altro ciocco')
    if (fase === 'mette' || fase === 'afferra') return S.dici('sul ceppo')
    if (fase === 'alza') return S.dici('su l’ascia…')
    if (fase === 'cala' || fase === 'colpo') return S.dici(b ? b.toLowerCase() : 'toc!')
    if (fase === 'bloccata') return S.dici(b === 'DAI!' ? 'dai!' : 'bloccata!')
    if (fase === 'raccoglie' || fase === 'lancia') return S.dici(`sulla catasta · ${n}`)
    if (b === 'PFF') return S.dici('pff')
    S.dici(n === 1 ? 'un ciocco spaccato' : `ciocchi spaccati: ${n}`)
  },
  lettera(L, S, q) {
    const t = S.t, alza = S.m.alza
    q.ty += 2 * Math.sin(t * 1.2 + L.u * 4)
    if (S.m.fase === 'alza' || S.m.fase === 'cala') { q.ty -= 18 * alza; q.sy *= 1 + 0.12 * alza; if (alza > 0.9) q.tx += Math.sin(t * 60 + L.i) * 1.2 }
    if (S.m.fase === 'prende' || S.m.fase === 'raccoglie') q.r += -4 * Math.sin(t * 2 + L.u * 3)
    // il colpo: la scritta si spacca in due e torna, con un rimbalzo
    const tau = t - S.colpoT, lato = L.u < 0.5 ? -1 : 1
    let lampo = 0
    if (tau >= 0 && tau < 1.6) { const e = Math.exp(-tau * 5) * Math.cos(tau * 9); q.tx += lato * 54 * e; q.r += lato * 14 * e; q.ty -= 12 * Math.exp(-tau * 6) * Math.abs(Math.cos(tau * 12)); lampo = Math.exp(-tau * 5) }
    const tb = t - (S.m.blocca ?? -9)
    if (tb >= 0 && tb < 1.3) q.tx += 3 * Math.sin(t * 45 + L.i) * (1 - tb / 1.3)
    let c = scala(LEGNO, 0.3 + 0.5 * rumore(L.i * 3.1) + 0.2 * Math.sin(t * 0.7 + L.u * 3))
    if (lampo) c = mix(c, LIME, 0.8 * lampo)
    q.col = c
  },
  luce(g, S) { const tau = S.t - S.colpoT; for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.8, [255, 170, 80], 0.06 + (tau >= 0 && tau < 0.8 ? 0.25 * (1 - tau / 0.8) : 0)) },
}

// riavvio il pc: la scritta fa quello che fa lo schermo. Si spegne (si schiaccia in una riga), si riscrive a macchina
// col cursore nel BIOS, pulsa col logo, si riempie di lime con la percentuale dell'aggiornamento (al 99 freme), salta a
// ogni tasto della password, va in pezzi col glitch e con lo schermo viola
const CHIARO = [236, 236, 244], SPENTA = hex('#5a5466')
MODI.riavvio = {
  accento: LIME,
  entra: () => ({}),
  passo(S) {
    const f = S.f, t = S.t, fase = f?.fase ?? 'spento', u = f?.u ?? t, pct = f?.pct, giro = f?.giro ?? 0
    S.m.fase = fase; S.m.u = u; S.m.pct = pct ?? 0
    if (S.m.giro === undefined) S.m.giro = giro
    else if (giro > S.m.giro) { S.m.giro = giro; S.colpo() }
    if (f && f.tasti !== S.m.tasti) { if (f.tasti > (S.m.tasti ?? 0)) S.m.tastoT = t; S.m.tasti = f.tasti }
    if (f && f.icone !== S.m.icone) { if (f.icone > (S.m.icone ?? 0)) { S.m.iconaT = t; S.nasci('pixel', S.lettere[(f.icone * 5) % S.lettere.length], null, 3) } S.m.icone = f.icone }
    if (fase === 'glitch' || fase === 'errore') S.tit.tx = (caso(Math.floor(t * 12)) - 0.5) * (fase === 'glitch' ? 30 : 6)
    if (fase === 'spento') return S.dici(u < 1.4 ? 'si spegne…' : 'si riaccende…')
    if (fase === 'bios') return S.dici(u < 3.6 ? 'controllo la memoria' : 'BIOS ok')
    if (fase === 'logo') return S.dici('avvio…')
    if (fase === 'aggiorna') return S.dici(pct >= 99 && pct < 100 ? `${pct}%… dai…` : `aggiornamento ${giro + 1} di 3 · ${pct}%`)
    if (fase === 'nero') return S.dici('quasi…')
    if (fase === 'login') return S.dici((f?.tasti ?? 0) < 8 ? 'scrivo la password' : 'benvenuto')
    if (fase === 'desktop') return S.dici(`apro le app · ${f?.icone ?? 0}/10`)
    if (fase === 'glitch') return S.dici('no no no')
    S.dici(`:( si riavvia di nuovo · ${pct ?? 0}%`)
  },
  lettera(L, S, q) {
    const t = S.t, fase = S.m.fase, u = S.m.u, N = S.lettere.length
    let c = mix(CHIARO, LIME, 0.5 + 0.5 * Math.sin(t * 1.2 - L.u * 4))
    if (fase === 'spento') { // si schiaccia in una riga bianca, poi sparisce; poi resta solo il cursore
      if (u < 0.25) { q.sy *= Math.max(0.05, 1 - u / 0.25); q.sx *= 1 + 0.35 * (u / 0.25); c = mix(c, BIANCO, u / 0.25) }
      else { q.sy *= 0.05; q.sx *= 1.35 * Math.max(0, 1 - (u - 0.25) / 0.3); q.o *= Math.max(0, 1 - (u - 0.25) / 0.3); c = BIANCO }
      if (u > 0.6) q.o = 0
    } else if (fase === 'bios') { // si riscrive a macchina
      q.o *= L.i < Math.floor((u - 0.2) * 16) ? 0.88 + 0.12 * rumore(t * 30 + L.i) : 0
      c = LIME
    } else if (fase === 'logo' || fase === 'nero') { const w = Math.max(0, Math.sin(t * 6 - L.i * 0.45)); q.ty -= 7 * w; c = mix(CHIARO, LIME, w) }
    else if (fase === 'aggiorna') { // si riempie con la percentuale
      const p = S.m.pct / 100, piena = L.u <= p
      c = piena ? LIME : SPENTA
      if (Math.abs(L.u - p) < 0.04) c = mix(c, BIANCO, 0.5 + 0.5 * Math.sin(t * 20))
      if (S.m.pct >= 99 && S.m.pct < 100) { q.tx += Math.sin(t * 55 + L.i) * 1.6; q.ty += Math.sin(t * 43 + L.i * 2) * 1.2 }
      if (piena) q.ty -= 2 * Math.sin(t * 3 + L.u * 6)
    } else if (fase === 'login') { // ogni tasto della password fa saltare una lettera
      const tau = t - (S.m.tastoT ?? -9), quale = (((S.m.tasti ?? 1) - 1) * 5) % N
      if (Math.abs(L.i - quale) < 2 && tau < 0.5) q.ty -= 16 * Math.exp(-tau * 9) * (L.i === quale ? 1 : 0.5)
      c = (S.m.tasti ?? 0) >= 8 ? LIME : CHIARO
    } else if (fase === 'desktop') { const tau = t - (S.m.iconaT ?? -9) - L.u * 0.25; if (tau > 0 && tau < 0.6) { q.ty -= 9 * Math.sin(Math.PI * tau / 0.6); q.sx *= 1 + 0.1 * Math.sin(Math.PI * tau / 0.6) } }
    else { // glitch, errore: pezzi che scivolano, colori sbagliati
      const k = fase === 'glitch' ? 1 : 0.35, fr = Math.floor(t * 14)
      q.tx += (caso(fr * 7 + L.i) - 0.5) * 22 * k; q.ty += (caso(fr * 11 + L.i) - 0.5) * 12 * k
      c = [hex('#ff3d4a'), hex('#05d9e8'), BIANCO, hex('#c77dff')][Math.floor(caso(fr * 3 + L.i) * 4)]
      if (caso(fr * 13 + L.i) < 0.08 * k) q.o *= 0.2
    }
    q.col = c
  },
  luce(g, S) { if (S.m.fase === 'spento' && S.m.u < 0.6) luce(g, S.cx, S.cy, S.w * 0.5, BIANCO, 0.25 * (1 - S.m.u / 0.6)); else for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.8, LIME, 0.06) },
  davanti(g, S) {
    const u = S.m.u
    // il cursore che lampeggia: nello schermo nero, e dopo l'ultima lettera scritta nel BIOS; la riga bianca che si chiude
    if (S.m.fase === 'spento' && u > 1.4 && Math.floor(u * 2.5) % 2) { const L = S.lettere[0]; g.fillStyle = '#ccff00'; g.fillRect(L.px - L.w / 2, L.py - L.h * 0.35, L.w * 0.5, L.h * 0.7) }
    if (S.m.fase === 'bios') { const n = Math.floor((u - 0.2) * 16); if (n >= 0 && n < S.lettere.length && Math.floor(u * 3) % 2) { const L = S.lettere[n]; g.fillStyle = '#ccff00'; g.fillRect(L.px - L.w / 2, L.py - L.h * 0.35, Math.max(14, L.w * 0.55), L.h * 0.7) } }
    if (S.m.fase === 'spento' && u > 0.25 && u < 0.6) { const k = (u - 0.25) / 0.35, w = S.w * 1.3 * (1 - k); g.fillStyle = `rgba(255,255,255,${(1 - k * 0.5).toFixed(2)})`; g.fillRect(S.cx - w / 2, S.cy - 3, w, 6) }
  },
}

// sistemo la postazione: le lettere storte che tornano a posto una a una (clic, pixel), i colori RGB del pc
MODI.sistemo = {
  accento: ROSA,
  entra: (L) => ({ tx: (L.s1 - 0.5) * 760, ty: (L.s2 - 0.5) * 520, r: (L.s3 - 0.5) * 200, s: 0.6 }), // si montano da sparse
  passo(S) {
    const f = S.f, t = S.t
    const lavoro = f?.lavoro ?? 'cammina', u = f?.u ?? 0, dura = f?.dura ?? 1, id = Math.round((f?.da ?? 0) * 10)
    S.m.lavoro = lavoro; S.m.u = u; S.m.dura = dura; S.m.id = id
    S.m.seme = lavoro === 'cammina' || lavoro === 'entra' ? Math.round(((f?.da ?? 0) + dura) * 10) : id
    const env = ss(0, 0.8, u) * (1 - ss(dura - 0.8, dura, u))
    if (lavoro === 'webcam' && u > 0.5 && u < 5) { S.tit.r = Math.sin(u * 2.2) * 2.2 * Math.min(1, (5 - u) * 2); S.tit.s = 1.05 }
    if (lavoro === 'sedia') S.tit.ty = 12 * Math.sin(u * 2.4) * env
    if (f?.bolla && f.bolla !== S.m.bolla && ['OK', 'MEGLIO', 'COLORE!', 'RGB!', 'DRITTA', '!'].includes(f.bolla)) { S.colpo(); S.esplodi('pixel', 22) }
    S.m.bolla = f?.bolla
    S.m.giro = (S.m.giro ?? 0) + S.dt * (lavoro === 'pc' || lavoro === 'luci' ? 280 : 70) // il giro dei colori: più veloce sul pc e sulle luci
    const b = f?.bolla
    const D = {
      entra: () => 'arrivo…', cammina: () => (id % 2 ? 'un attimo…' : 'vediamo…'),
      schermoSx: () => (b === '?' ? '?' : b === 'OK' ? 'ok!' : 'lo schermo di sinistra'),
      schermoDx: () => (b === 'STORTO' ? 'storto…' : b === 'MEGLIO' ? 'meglio' : 'lo schermo di destra'),
      luci: () => (b === 'COLORE!' ? 'colore nuovo!' : 'le luci'),
      cavi: () => (b === '...' ? '…' : b === '!' ? 'trovato il cavo!' : 'i cavi sotto la scrivania'),
      pc: () => (b === 'RGB!' ? 'RGB!' : 'i colori del pc'),
      sedia: () => (b === 'PFF' ? 'pff' : 'la sedia'),
      webcam: () => 'mi vedete?',
      tastiera: () => (b === 'DRITTA' ? 'dritta!' : 'la tastiera'),
    }
    S.dici((D[lavoro] ?? D.cammina)())
  },
  lettera(L, S, q) {
    const { lavoro, u, dura, id } = S.m, t = S.t
    // quanto è storta: camminando si storta (tocca le cose), nel lavoro tornano dritte una a una, con lo scatto
    let storta
    if (lavoro === 'cammina' || lavoro === 'entra') storta = 0.75 * ss(0, Math.min(1.2, dura), u)
    else {
      const fix = lavoro === 'schermoSx' ? 0.1 + 0.7 * L.u : lavoro === 'schermoDx' ? 0.1 + 0.7 * (1 - L.u) : 0.1 + 0.72 * caso(id * 7 + L.i)
      const p = u / dura, tau = (p - fix) * dura
      storta = p < fix ? 1 : Math.exp(-tau * 9) * Math.cos(tau * 24)
      const fissa = p >= fix
      if (fissa && L.fissa === false && S.vivo) S.nasci('pixel', L, null, 4)
      L.fissa = fissa
    }
    if (lavoro === 'cammina' || lavoro === 'entra') L.fissa = false
    // (la camminata e il lavoro che viene dopo hanno la stessa storta: la camminata finisce dove il lavoro comincia)
    const sid = S.m.seme, k = 1 - Math.exp(-S.dt / (lavoro === 'cammina' ? 0.12 : 0.05))
    const gx = (caso(sid * 13 + L.i) - 0.5) * 26 * storta, gy = (caso(sid * 17 + L.i + 3) - 0.5) * 36 * storta, gr = (caso(sid * 19 + L.i + 7) - 0.5) * 30 * storta
    L.mx += (gx - L.mx) * k; L.my += (gy - L.my) * k; L.mr += (gr - L.mr) * k
    q.tx += L.mx; q.ty += L.my; q.r += L.mr
    const env = ss(0, 0.8, u) * (1 - ss(dura - 0.8, dura, u))
    if (lavoro === 'cavi') q.ty += 24 * Math.sin(Math.PI * L.u) * env // pendono come i cavi
    if (lavoro === 'tastiera' && L.i === Math.floor(u * 11) % S.lettere.length) q.ty += 8 // battute una a una
    q.ty += 2.5 * Math.sin(t * 1.5 + L.u * 5)
    L.col = q.col = hsl((S.m.giro + L.u * 300) % 360, 100, 64)
  },
  luce(g, S) { for (const L of S.lettere) luce(g, L.px, L.py, L.h * 0.8, L.col ?? ROSA, 0.13) },
}

// ── la scritta ──
// box: l'elemento .via; cosa: legna, pipi, bere, mangiare, sistemo. Le funzioni: tempo() i secondi della scena (null se
// non sei via con questa), dice() quello che la scena dice di sé, gradi() quanti gradi fa fuori, pausa() vero quando non
// serve disegnare (l'anteprima dal vivo della regia), ricentra() quando cambia la grandezza (il pezzo si rimette al centro)
export function creaScritta(box, cosa, titolo, { tempo, dice, gradi = () => null, redbull = () => null, pausa = () => false, ricentra = () => {} }) {
  const modo = MODI[cosa] ?? MODI.legna
  const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  box.style.setProperty('--vc', rgb(modo.accento))
  // (le lettere si costruiscono solo quando la scritta si accende, e si smontano quando sono volate via: spenta non
  // costa niente, nemmeno i livelli della scheda video che ogni lettera si porta dietro)
  let dietro = null, davanti = null, gd = null, gv = null, testa = null, tit = null, riga = null, rigaT = null, giu = null, da = null, lettere = []
  let W = 0, H = 0
  function costruisci() {
    box.innerHTML = `<canvas class="v-dietro"></canvas>
      <div class="v-testa"><b>Giugnoh</b><span class="app">APP</span><span>torno subito</span></div>
      <div class="v-titolo">${titolo.split(' ').map((p) => `<span class="v-p">${[...p].map((c) => `<span class="v-l">${esc(c)}</span>`).join('')}</span>`).join(' ')}</div>
      <div class="v-ora"><i></i><span></span></div>
      <div class="v-giu"><span>via da</span><b data-da>0:00</b></div>
      <canvas class="v-davanti"></canvas>`
    ;[dietro, davanti] = box.querySelectorAll('canvas'); gd = dietro.getContext('2d'); gv = davanti.getContext('2d')
    testa = box.querySelector('.v-testa'); tit = box.querySelector('.v-titolo'); riga = box.querySelector('.v-ora'); rigaT = riga.querySelector('span'); giu = box.querySelector('.v-giu'); da = box.querySelector('[data-da]')
    lettere = [...box.querySelectorAll('.v-l')].map((e, i, tutte) => ({ e, i, n: i / Math.max(1, tutte.length - 1), s1: caso(i * 7.1 + 1), s2: caso(i * 3.3 + 5), s3: caso(i * 5.7 + 9), x: 0, y: 0, w: 60, h: 100, u: 0, px: 0, py: 0, c: {} }))
    S.lettere = lettere
    misura()
  }
  function smonta() { box.innerHTML = ''; tit = null; lettere = []; S.lettere = lettere; W = H = 0; ricentra() }

  // grande, ma su due righe al massimo: se ne fa tre si rimpicciolisce un po'
  function misura() {
    if (!tit) return
    let fs = 100
    tit.style.fontSize = `${fs}px`
    const righe = () => new Set([...tit.querySelectorAll('.v-p')].map((p) => p.offsetTop)).size
    while (righe() > 2 && fs > 66) { fs -= 6; tit.style.fontSize = `${fs}px` }
    W = box.offsetWidth; H = box.offsetHeight
    let x0 = Infinity, x1 = -Infinity
    for (const L of lettere) {
      L.x = L.e.offsetLeft + L.e.offsetWidth / 2; L.y = L.e.offsetTop + L.e.offsetHeight / 2; L.w = L.e.offsetWidth; L.h = L.e.offsetHeight
      x0 = Math.min(x0, L.x); x1 = Math.max(x1, L.x)
    }
    for (const L of lettere) { L.u = x1 > x0 ? (L.x - x0) / (x1 - x0) : 0.5; L.px = M + L.x; L.py = M + L.y }
    S.cx = M + W / 2; S.cy = M + tit.offsetTop + tit.offsetHeight / 2; S.w = tit.offsetWidth; S.h = tit.offsetHeight
    for (const c of [dietro, davanti]) { c.width = W + 2 * M; c.height = H + 2 * M; c.style.left = c.style.top = `${-M}px`; c.style.width = `${W + 2 * M}px`; c.style.height = `${H + 2 * M}px` }
    ricentra()
  }

  // ── lo stato di un giro, e le cose che volano ──
  let cose = []
  const quote = {}
  const S = {
    t: 0, dt: 1 / 60, f: null, m: {}, colpoT: -99, vivo: false, lettere, accento: modo.accento, gradi: null, stagione: null,
    tit: { tx: 0, ty: 0, r: 0, s: 1 }, cx: 0, cy: 0, w: 0, h: 0, testo: '',
    colpo() { S.colpoT = S.t },
    dici(t) { S.testo = t },
    nasci(tipo, L, dove, n = 1) {
      for (let i = 0; i < n && cose.length < 700; i++) {
        const p = { tipo, x: 0, y: 0, vx: 0, vy: 0, v: 0, vita: 1, s: 2, seme: rnd() }
        COSE[tipo].nasce(p, L ?? lettere[Math.floor(rnd() * lettere.length)], !!dove?.botto, S)
        if (dove?.x !== undefined) { p.x = dove.x; p.y = dove.y }
        cose.push(p)
      }
    },
    esplodi(tipo, n) { if (S.vivo) for (let i = 0; i < n; i++) S.nasci(tipo, null, { botto: true }) },
    spargi(tipo, alSecondo) { // (anche frazioni: si accumulano)
      if (!S.vivo) return
      quote[tipo] = (quote[tipo] ?? 0) + alSecondo * S.dt
      while (quote[tipo] >= 1) { quote[tipo] -= 1; S.nasci(tipo) }
    },
  }

  // (le misure: adesso, quando arrivano i caratteri e quando cambia la grandezza)
  document.fonts?.ready.then(misura)
  new ResizeObserver(() => { if (tit && (box.offsetWidth !== W || box.offsetHeight !== H)) misura() }).observe(box)

  // scrive uno stile solo se è cambiato (ogni scrittura costa)
  const metti = (L, k, v) => { if (L.c[k] !== v) { L.c[k] = v; L.e.style[k] = v } }
  const fuori = { e: null, c: {} }
  const mettiE = (e, k, v) => { fuori.e = e; fuori.c = e.__c ?? (e.__c = {}); metti(fuori, k, v) }

  let via = null, inizio = 0, fine = null, tScena = 0, testoOra = null, secondo = -1
  const q = { tx: 0, ty: 0, r: 0, sx: 1, sy: 1, o: 1, col: null }

  function giro(dt) {
    const ora = performance.now() / 1000
    if (fine !== null && ora - fine > 1.4) { via?.(); via = null; cose = []; smonta(); return }
    if (pausa() || document.hidden) return
    const tl = ora - inizio, uscita = fine === null ? -1 : ora - fine
    const tt = tempo()
    if (tt !== null) tScena = tt
    const f = dice()
    S.f = f && f.cosa === cosa && Math.abs(f.t - tScena) < 3 ? f : null
    S.t = tScena; S.dt = dt; S.vivo = fine === null
    const gr = gradi(); S.gradi = Number.isFinite(gr) ? Math.round(gr) : null
    S.redbull = redbull() // (quante Red Bull oggi: la scritta della Red Bull dice che numero è questa)
    S.stagione = S.f?.stagione ?? null
    S.tit.tx = S.tit.ty = S.tit.r = 0; S.tit.s = 1
    modo.passo(S)

    // le lettere
    for (const L of lettere) {
      q.tx = q.ty = q.r = 0; q.sx = q.sy = 1; q.o = 1; q.col = null
      modo.lettera(L, S, q)
      // l'entrata: ognuna dal suo punto di partenza, a onda, con la molla
      const te = tl - (0.12 + (modo.ordine ? modo.ordine(L) : L.n) * 0.55), k = molla(te * 1.15), e = modo.entra(L)
      q.tx += (1 - k) * (e.tx ?? 0); q.ty += (1 - k) * (e.ty ?? 0); q.r += (1 - k) * (e.r ?? 0)
      const sc = 1 + (1 - Math.min(1, k)) * ((e.s ?? 1) - 1)
      q.o *= clamp(te * 5)
      // l'uscita (sei tornato): volano via in alto, a onda
      if (uscita >= 0) { const ko = ss(0, 0.5, uscita - L.n * 0.25); q.ty -= 180 * ko * ko; q.r += (L.s1 - 0.5) * 90 * ko; q.o *= 1 - ko }
      L.px = M + L.x + q.tx * S.tit.s + S.tit.tx; L.py = M + L.y + q.ty + S.tit.ty
      metti(L, 'transform', `translate(${q.tx.toFixed(1)}px,${q.ty.toFixed(1)}px) rotate(${q.r.toFixed(2)}deg) scale(${(q.sx * sc).toFixed(3)},${(q.sy * sc).toFixed(3)})`)
      metti(L, 'opacity', q.o.toFixed(2))
      if (q.col) metti(L, 'color', rgb(q.col.map((v) => Math.round(v / 3) * 3))) // (a scalini di 3: meno ridisegni)
    }
    mettiE(tit, 'transform', `translate(${S.tit.tx.toFixed(1)}px,${S.tit.ty.toFixed(1)}px) rotate(${S.tit.r.toFixed(2)}deg) scale(${S.tit.s.toFixed(3)})`)

    // sopra e sotto: «Giugnoh · torno subito» scende per primo, la riga e il «via da» arrivano dopo il titolo
    const parte = (ritardo) => { const k = molla((tl - ritardo) * 1.2); return [(1 - k) * -40, clamp((tl - ritardo) * 4) * (uscita >= 0 ? 1 - ss(0, 0.4, uscita) : 1)] }
    const [ty0, o0] = parte(0.02), [ty1, o1] = parte(0.6), [ty2, o2] = parte(0.75)
    mettiE(testa, 'transform', `translateY(${(ty0 + 3 * Math.sin(S.t * 1.6)).toFixed(1)}px)`); mettiE(testa, 'opacity', o0.toFixed(2))
    mettiE(riga, 'transform', `translateY(${ty1.toFixed(1)}px)`); mettiE(riga, 'opacity', (S.testo ? o1 : 0).toFixed(2))
    mettiE(giu, 'transform', `translateY(${ty2.toFixed(1)}px)`); mettiE(giu, 'opacity', o2.toFixed(2))
    // la riga che racconta: quando cambia, la nuova entra con un piccolo salto
    if (S.testo !== testoOra) {
      testoOra = S.testo
      if (S.testo) { rigaT.textContent = S.testo; rigaT.animate?.([{ opacity: 0, transform: 'translateY(18px) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.9,.25,1.25)' }) }
    }
    // il «via da» batte a ogni secondo
    const s = Math.floor(S.t)
    if (s !== secondo) { if (secondo >= 0 && uscita < 0) da.animate?.([{ transform: 'scale(1.16)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }); secondo = s }

    // le tele: la luce dietro, le cose che volano davanti
    gd.clearRect(0, 0, dietro.width, dietro.height)
    gd.globalCompositeOperation = 'lighter'
    const al = uscita >= 0 ? 1 - ss(0, 0.6, uscita) : clamp(tl * 2)
    gd.globalAlpha = al
    modo.luce?.(gd, S)
    gd.globalAlpha = 1; gd.globalCompositeOperation = 'source-over'
    gv.clearRect(0, 0, davanti.width, davanti.height)
    gv.globalAlpha = al
    modo.davanti?.(gv, S)
    gv.globalAlpha = 1
    const vive = []
    for (const p of cose) {
      const C = COSE[p.tipo]
      p.v += dt
      C.muovi(p, dt, S.t, S)
      p.x += p.vx * dt; p.y += p.vy * dt
      if (p.v >= p.vita) continue
      vive.push(p)
      gv.globalCompositeOperation = C.piu ? 'lighter' : 'source-over'
      C.disegna(gv, p, p.v / p.vita)
    }
    gv.globalCompositeOperation = 'source-over'
    cose = vive
  }

  return {
    // si vede: l'entrata, e il giro parte (anche ricaricata a metà: rientra e riprende dal momento giusto della scena)
    parti() {
      if (fine === null && via) return
      if (!tit) costruisci()
      inizio = performance.now() / 1000; fine = null; S.m = {}; S.colpoT = -99; testoOra = null; cose = []
      for (const L of lettere) { L.fissa = undefined; L.mx = L.my = L.mr = 0 }
      if (!via) via = ogniGiro(giro)
    },
    // sei tornato: le lettere volano via, poi il giro si ferma da solo
    ferma() { if (via && fine === null) fine = performance.now() / 1000 },
  }
}
