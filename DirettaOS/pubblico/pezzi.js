// Diretta OS: i pezzi. La stessa pagina fa da /o/nome, /o/tasti, /o/meteo… e da /o/tutto: monta solo i pezzi che
// l'indirizzo chiede, sempre sulla tela 1920 × 1080 e sempre allo stesso posto, così tenerle aperte tutte insieme o una
// sola è uguale. Chi è acceso, la lente e i dati arrivano dal server (/api/flusso).
// Lo stile è «sospeso»: niente riquadri, le cose galleggiano sopra la webcam con un contorno scuro che le fa leggere
// sia sul muro bianco sia sulla tv nera.

// I posti, per lente: [x, y, scala]. Sono scelti sulle due foto di riferimento (0,5× e 1,0×) perché niente finisca
// sopra chi è in webcam. Dalla regia si spostano col mouse: quelli spostati arrivano dal server (stato.posti) e vincono.
export const POSTI = {
  '05': { nome: [40, 18, 1], meteo: [640, 10, 1], spie: [1574, 20, 1], conto: [1406, 990, 1], tasti: [30, 842, .9], meme: [1350, 630, 1], adv: [1350, 812, 1], adigeo: [986, 198, 1], redbull: [548, 668, 1], social: [40, 178, 1], puff: [0, 0, 1], legna: [792, 26, 1], pipi: [792, 26, 1], bere: [792, 26, 1], mangiare: [792, 26, 1], lattina: [792, 26, 1], telefono: [792, 26, 1], spacco: [792, 26, 1], sistemo: [792, 26, 1], riavvio: [792, 26, 1] },
  '10': { nome: [40, 18, 1], meteo: [640, 10, 1], spie: [1300, 20, 1], conto: [1406, 990, 1], tasti: [24, 580, .7], meme: [1350, 618, 1], adv: [1350, 800, 1], adigeo: [1236, 182, 1], redbull: [190, 852, 1], social: [40, 178, 1], puff: [0, 0, 1], legna: [650, 34, 1], pipi: [650, 34, 1], bere: [650, 34, 1], mangiare: [650, 34, 1], lattina: [650, 34, 1], telefono: [650, 34, 1], spacco: [650, 34, 1], sistemo: [650, 34, 1], riavvio: [650, 34, 1] },
}
// (Giugnoh, quando segue la testa, e il cartellino della puff non usano il posto: x e y li dà l'occhio, il posto
// tiene la grandezza, e per Giugnoh anche quanto sta più in là o più in alto rispetto alla testa)
// dove arriva la punta della freccia di Adigeo, rispetto all'angolo del pezzo
export const FRECCIA = { '05': [450, 66], '10': [530, 6] }
export const VIA = ['legna', 'pipi', 'bere', 'mangiare', 'lattina', 'telefono', 'spacco', 'sistemo', 'riavvio'] // (i «torno subito»: la scritta sta al centro, i posti qui non contano)
export const PEZZI = ['cornice', 'nome', 'spie', 'conto', 'meteo', 'tasti', 'social', 'meme', 'adv', 'adigeo', 'redbull', 'puff', ...VIA]
export const NOMI = { cornice: 'Cornice', nome: 'Giugnoh', spie: 'Spie', conto: 'A letto fra', meteo: 'Meteo', tasti: 'Tastiera, mouse, controller', meme: 'Meme di pzkko', adv: 'Pubblicità', adigeo: 'Adigeo', redbull: 'Red Bull di oggi', social: 'Follower', puff: 'Puff', legna: 'Legna nella stufa', pipi: 'Pipì', bere: 'Qualcosa da bere', mangiare: 'Qualcosa da mangiare', lattina: 'Una Red Bull', telefono: 'Al telefono', spacco: 'Spacco la legna', sistemo: 'Sistemo la postazione', riavvio: 'Riavvio il pc' }

import { creaDualSense, daBrowser } from '/dualsense.js'
import { creaG413 } from '/g413.js'
import { creaG502 } from '/g502.js'
import { MEME, simbolo, SFUMATURE } from '/meme.js'
import { creaSfondo } from '/via/via.js' // le scene dei «torno subito»
import { creaScritta } from '/via/scritta.js' // e la loro scritta al centro
import { ICONS } from '/assets/icons.js' // le icone dei marchi di pzkko.it
// i pezzi del pc (app aperte, cpu, gpu, ram, ssd, hdd, temperatura, wi-fi) stanno in pc.js: qui si aggiungono agli altri
import { PC, PC_NOMI, PC_POSTI, creaPc, pcArriva, pcNomi, appArriva } from '/pc.js'
PEZZI.push(...PC); Object.assign(NOMI, PC_NOMI); for (const L of ['05', '10']) Object.assign(POSTI[L], PC_POSTI[L])
// Giugnoh's Cast, il podcast: l'argomento a caso e la fine puntata (cast-pezzi.js), anche loro aggiunti agli altri
import { CAST, CAST_NOMI, CAST_POSTI, creaCast, castArriva } from '/cast-pezzi.js'
PEZZI.push(...CAST); Object.assign(NOMI, CAST_NOMI); for (const L of ['05', '10']) Object.assign(POSTI[L], CAST_POSTI[L])
// le scene nuove: dove vivo, l'azienda di famiglia e il surf. Hanno lo stesso nome della regia e lo stesso
// indirizzo (/o/dovevivo…), e stanno al loro posto in tutte e due le lenti.
import { SCENE, SCENE_NOMI, SCENE_POSTI, creaScena, sceneArriva } from '/scene.js'
PEZZI.push(...SCENE); Object.assign(NOMI, SCENE_NOMI); for (const L of ['05', '10']) Object.assign(POSTI[L], SCENE_POSTI[L])
// la bandiera appesa al muro (bandiera.js, il catalogo in bandiere.js): sta per prima, cioè sotto a tutti gli altri
import { creaBandiera, bandieraArriva, bandieraMuro } from '/bandiera.js'
PEZZI.unshift('bandiera'); NOMI.bandiera = 'Bandiera'; POSTI['05'].bandiera = [700, 60, 0.5]; POSTI['10'].bandiera = [700, 60, 0.5]
// la vista esterna (esterna.js): la webcam di un portatile in wifi, come una finestra (sotto agli altri pezzi)
import { creaEsterna, ESTERNA_NOMI, ESTERNA_POSTI } from '/esterna.js'
import { sorveglianza } from '/sorveglianza.js' // (e sopra, la scritta da telecamera di sicurezza: ora, ● REC, CAM 02 · ESTERNO)
PEZZI.splice(1, 0, 'esterna'); Object.assign(NOMI, ESTERNA_NOMI); for (const L of ['05', '10']) Object.assign(POSTI[L], ESTERNA_POSTI[L])
// la zona cavi (cavi.js): una macchia scura e sfocata presa dalla foto della stanza, da mettere dietro ai monitor
import { creaCavi, CAVI_NOMI, CAVI_POSTI } from '/cavi.js'
PEZZI.splice(1, 0, 'cavi'); Object.assign(NOMI, CAVI_NOMI); for (const L of ['05', '10']) Object.assign(POSTI[L], CAVI_POSTI[L])
// i muri della stanza: un pezzo appeso a una parete va in prospettiva su quella parete (muri.js; si spostano dalla regia)
import { fDi, piano as muroPiano, matrice as muroMatrice, css3d, filtro as muroFiltro, luminosita } from '/muri.js'
// un solo giro di disegno per tutta la pagina, a 60 al secondo (il monitor ne fa 164: Camo ne usa 60 al massimo)
import { ogniGiro, frenaAnimazioni, fpsScegli } from '/giro.js'
// le regolazioni di ogni sorgente scelte in regia: rotazione, specchio, opacità e filtri (regola.js)
import { cssDi } from '/regola.js'

const scena = document.getElementById('scena')

// ── piccoli attrezzi ──
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
const css = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`
const caso = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) } // sempre lo stesso per lo stesso n
function hsl(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l)
  return [0, 8, 4].map((n) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
}

// ── Giugnoh: otto numeri in fila, 2,6 secondi l'uno, poi ricomincia ──
// Ogni numero parte e finisce fermo (l'inviluppo «e»), così passano dall'uno all'altro senza scatti; i colori sfumano.
const DURA = 2.6
const FASI = [
  { nome: 'onda', // le lettere fanno l'onda, dal verde al viola
    lettera: (i, t, e) => ({ ty: -22 * Math.sin(2 * Math.PI * 1.3 * t - i * .75) * e, r: 6 * Math.cos(2 * Math.PI * 1.3 * t - i * .75) * e }),
    colore: (i, t) => lerp(rgb('#ccff00'), rgb('#c77dff'), .5 + .5 * Math.sin(2 * Math.PI * .5 * t + i * .55)), alone: () => rgb('#9d00ff') },
  { nome: 'rimbalzo', // salta e rimbalza, schiacciandosi quando tocca terra
    parola: (t, e) => { const s = Math.abs(Math.sin(Math.PI * 1.8 * t)), d = Math.exp(-.9 * t), terra = (1 - s) ** 6 * e * d; return { ty: -74 * s * d * e, sy: 1 - .26 * terra, sx: 1 + .2 * terra } },
    colore: () => rgb('#ffffff'), alone: () => rgb('#ccff00') },
  { nome: 'arcobaleno', // ogni lettera di un colore, che gira, e pulsano
    lettera: (i, t, e) => { const p = Math.sin(2 * Math.PI * 1.1 * t - i * .9); return { s: 1 + .2 * p * e, ty: -7 * p * e } },
    colore: (i, t) => hsl((t * 150 + i * 42) % 360, 100, 64), alone: (i, t) => hsl((t * 150 + i * 42 + 40) % 360, 100, 50) },
  { nome: 'giro', // una lettera alla volta fa la capriola
    lettera: (i, t) => { const p = Math.min(1, Math.max(0, (t - .25 - i * .17) / .75)); return { ry: 360 * ss(0, 1, p), ty: -16 * Math.sin(Math.PI * p) } },
    colore: (i) => rgb(i % 2 ? '#b18cff' : '#ff73fa'), alone: () => rgb('#eb459e') },
  { nome: 'gelatina', // trema come una gelatina
    parola: (t, e) => { const k = 2 * Math.PI * 2.4 * t, d = Math.exp(-.45 * t) * e; return { skew: 16 * Math.sin(k) * d, sy: 1 + .14 * Math.sin(k + Math.PI / 2) * d, sx: 1 - .1 * Math.sin(k + Math.PI / 2) * d } },
    colore: (i) => rgb(i % 2 ? '#e6ff66' : '#ccff00'), alone: () => rgb('#7dff00') },
  { nome: 'glitch', // si rompe come un segnale disturbato
    lettera: (i, t, e) => { const f = Math.floor(t * 16), su = caso(f * 7 + i) > .55 && e > .5; return { tx: su ? (caso(f * 13 + i) - .5) * 18 : 0, ty: su ? (caso(f * 17 + i) - .5) * 9 : 0, split: e > .3 ? (su ? 5 : 1.8) : 0 } },
    parola: (t, e) => { const f = Math.floor(t * 16); return { skew: caso(f * 3) > .86 && e > .5 ? 12 : 0 } },
    colore: () => rgb('#ffffff'), alone: () => rgb('#05d9e8') },
  { nome: 'viaggio', // va a fare un giro e torna, camminando
    parola: (t, e) => ({ tx: 64 * Math.sin(2 * Math.PI * t / DURA) * e, r: 3 * Math.sin(2 * Math.PI * 2 * t) * e }),
    lettera: (i, t, e) => ({ ty: -11 * Math.abs(Math.sin(Math.PI * 3 * t + i * .6)) * e }),
    colore: (i) => lerp(rgb('#f0b232'), rgb('#ff8a1a'), i / 6), alone: () => rgb('#ff5a00') },
  { nome: 'battito', // batte come un cuore, con il neon che sfarfalla
    parola: (t, e) => { const p = t % 1, b = Math.exp(-(((p - .1) / .06) ** 2)) + .7 * Math.exp(-(((p - .32) / .06) ** 2)); return { sx: 1 + .15 * b * e, sy: 1 + .15 * b * e } },
    lettera: (i, t) => ({ g: 12 + 20 * Math.exp(-((((t % 1) - .1) / .08) ** 2)) }),
    colore: (i, t) => (caso(Math.floor(t * 11) * 5 + i) > .9 ? rgb('#7a2a6f') : rgb('#ff73fa')), alone: () => rgb('#eb459e') },
]
export const GIRO_NOME = DURA * FASI.length
// la cornice: quattro strisce [classe, x, y, larghezza, altezza], spesse 9 px, e la sfumatura conica che gira in 14 s
const CORNICE = [['cr-su', 0, 0, 1920, 9], ['cr-giu', 0, 1071, 1920, 9], ['cr-sx', 0, 9, 9, 1062], ['cr-dx', 1911, 9, 9, 1062]]
const CORNICE_GIRO = 14

function avvia() {
  const chiesto = location.pathname.split('/').pop() || 'tutto'
  const Q = new URLSearchParams(location.search)
  // I pezzi appesi a un muro «dietro di me» stanno in uno strato loro, sotto agli altri pezzi. Non c'è più una maschera
  // del corpo: ognuno sparisce per conto suo quando l'occhio vede cambiare il colore attorno (classe .coperto).
  const stratoMuri = document.createElement('div')
  stratoMuri.className = 'strato-muri'
  scena.prepend(stratoMuri)
  const GIF = Q.has('gif') // (per strumenti/giugnoh-gif.mjs: niente aloni sfumati, il tempo lo dà lo strumento)
  if (GIF) scena.classList.add('gif')
  const monta = chiesto === 'tutto' ? PEZZI : PEZZI.filter((p) => p === chiesto)
  const el = {}
  let stato = null, roba = [], adv = []
  const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }
  const due = (n) => String(n).padStart(2, '0')
  const tempo = (s) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h ? `${h}:${due(m)}:${due(s % 60)}` : `${m}:${due(s % 60)}` }
  const aCaso = (l) => l[Math.floor(Math.random() * l.length)]
  const lente = () => Q.get('lente') ?? stato?.lente ?? '10'

  // ── i disegni ──
  const SPIE = {
    mic: ['MIC', '<svg viewBox="0 0 24 24"><rect class="pieno" x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7"/><path class="sbarra" d="M4 3l16 18"/></svg>'],
    cuffie: ['CUFFIE', '<svg viewBox="0 0 24 24"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect class="pieno" x="2.8" y="13.5" width="4.6" height="7.5" rx="2"/><rect class="pieno" x="16.6" y="13.5" width="4.6" height="7.5" rx="2"/><path class="sbarra" d="M4 3l16 18"/></svg>'],
    iphone: ['CAM', '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><circle class="pieno" cx="12" cy="8.2" r="2.6"/><path d="M10.2 18.6h3.6"/><path class="sbarra" d="M3.5 3l17 18"/></svg>'],
  }
  const TEMPO = {
    // (i raggi girano: stanno in un livello a parte che la scheda video fa ruotare, senza ridisegnarli)
    sole: '<span class="m-raggi"><svg viewBox="0 0 64 64"><g stroke="#ccff00" stroke-width="5" stroke-linecap="round"><path d="M32 5v8M32 51v8M5 32h8M51 32h8M12.9 12.9l5.7 5.7M45.4 45.4l5.7 5.7M12.9 51.1l5.7-5.7M45.4 18.6l5.7-5.7"/></g></svg></span><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="12.5" fill="#ccff00"/></svg>',
    luna: '<svg viewBox="0 0 64 64"><path d="M44 40.5A20 20 0 0 1 23.5 12a21 21 0 1 0 26.8 27.4 20 20 0 0 1-6.3 1.1z" fill="#ccff00"/><circle cx="46" cy="16" r="2.5" fill="#e2b3ff"/><circle cx="54" cy="27" r="1.8" fill="#e2b3ff"/></svg>',
    nuvolo: '<svg viewBox="0 0 64 64"><circle cx="23" cy="22" r="11" fill="#ccff00"/><path d="M20 52a11 11 0 0 1-1-21.9A15 15 0 0 1 48 31a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/></svg>',
    nuvole: '<svg viewBox="0 0 64 64"><path d="M30 34a9 9 0 0 1 0-18 12 12 0 0 1 23 2 8 8 0 0 1 1 16z" fill="#8f86a0"/><path d="M17 54a11 11 0 0 1-1-21.9A15 15 0 0 1 45 33a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/></svg>',
    nebbia: '<svg viewBox="0 0 64 64"><path d="M20 34a11 11 0 0 1-1-21.9A15 15 0 0 1 48 13a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g stroke="#c9a3ff" stroke-width="5" stroke-linecap="round"><path d="M10 43h44M16 53h32"/></g></svg>',
    pioggia: '<svg viewBox="0 0 64 64"><path d="M20 38a11 11 0 0 1-1-21.9A15 15 0 0 1 48 17a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g stroke="#8ea1ff" stroke-width="5" stroke-linecap="round"><path d="M22 46l-3 9M33 46l-3 9M44 46l-3 9"/></g></svg>',
    neve: '<svg viewBox="0 0 64 64"><path d="M20 38a11 11 0 0 1-1-21.9A15 15 0 0 1 48 17a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g fill="#c9e4ff"><circle cx="21" cy="50" r="3.6"/><circle cx="33" cy="54" r="3.6"/><circle cx="45" cy="50" r="3.6"/></g></svg>',
    temporale: '<svg viewBox="0 0 64 64"><path d="M20 36a11 11 0 0 1-1-21.9A15 15 0 0 1 48 15a10.5 10.5 0 0 1 0 21z" fill="#8f86a0"/><path d="M35 33l-11 15h8l-4 13 13-17h-8z" fill="#ccff00"/></svg>',
  }
  const NUVOLA = '<svg viewBox="0 0 64 34"><path d="M14 32a12 12 0 0 1-1-23.9A17 17 0 0 1 46 10a11 11 0 0 1 4 22z" fill="currentColor"/></svg>'
  const OMBRELLO = '<svg class="ombrello" viewBox="0 0 40 40"><path d="M3 18a17 15 0 0 1 34 0c-3-2.5-6-2.5-8.5 0-2.5-2.5-6-2.5-8.5 0-2.5-2.5-6-2.5-8.5 0C8.5 15.500 5.5 15.500 3 18z" fill="#5865f2" stroke="#0b090e" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 18v15a3 3 0 0 1-6 0" fill="none" stroke="#0b090e" stroke-width="3" stroke-linecap="round"/></svg>'
  const FOGLIA = '<svg viewBox="0 0 20 12"><path d="M1 6C5 0 14 0 19 6 14 12 5 12 1 6z" fill="currentColor" stroke="#0b090e" stroke-width="1.5"/></svg>'
  const LUNA = '<svg viewBox="0 0 24 24"><path d="M17.5 15.6A8 8 0 0 1 9 4.2a8.5 8.5 0 1 0 11 11 8 8 0 0 1-2.5.4z"/></svg>'

  // ── i nomi dei tasti (codici virtuali di Windows) ──
  const ALTRI = { 9: 'Tab', 32: 'Spazio', 160: 'Shift', 162: 'Ctrl', 8: '⌫', 13: 'Invio', 20: 'Caps', 27: 'Esc', 33: 'Pag↑', 34: 'Pag↓', 35: 'Fine', 36: 'Home', 37: '←', 38: '↑', 39: '→', 40: '↓', 45: 'Ins', 46: 'Canc', 91: 'Win', 161: 'Shift', 163: 'Ctrl', 164: 'Alt', 165: 'AltGr', 1: 'Clic', 2: 'Clic destro', 4: 'Rotella', 5: 'Indietro', 6: 'Avanti', 186: 'è', 187: '+', 188: ',', 189: '-', 190: '.', 191: 'ù', 192: 'ò', 219: '’', 220: '\\', 221: 'ì', 222: 'à', 226: '<' }
  const nomeTasto = (k) => ALTRI[k] ?? (k >= 48 && k <= 57 ? String(k - 48) : k >= 65 && k <= 90 ? String.fromCharCode(k) : k >= 96 && k <= 105 ? `Num ${k - 96}` : k >= 112 && k <= 123 ? `F${k - 111}` : null)

  // ── il montaggio ──
  const fatti = {
    // quattro strisce sottili, non uno schermo intero: si ridisegna solo il bordo (cornice.gif la fa strumenti/cornice-gif.mjs)
    cornice: () => $(`<div class="cornice${Q.has('fase') ? ' gif' : ''}">${CORNICE.map(([c, x, y, w, h]) => `<canvas class="${c}" width="${w}" height="${h}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></canvas>`).join('')}<i class="cr-alone"></i></div>`),
    nome: () => $(`<div class="nome${GIF ? ' gif' : ''}"><div class="n-parola">${[...'Giugnoh'].map((c) => `<span>${c}</span>`).join('')}</div></div>`),
    spie: () => $(`<div class="spie">${Object.entries(SPIE).map(([k, [et, v]]) => `<div class="spia" data-s="${k}">${k === 'mic' ? '<i class="onde"></i><svg class="livello" viewBox="0 0 100 100"><circle class="alone" cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="46"/></svg>' : ''}<div class="tondo">${v}</div><span class="et">${et}</span></div>`).join('')}</div>`),
    conto: () => $(`<div class="conto">${LUNA}<span data-t>a letto fra</span><b data-n>–:––</b></div>`),
    // in grande: l'icona, i gradi e la città sulla prima riga, il tempo e la minima/massima sotto
    meteo: () => $('<div class="meteo"><div class="m-cielo"></div><div class="m-riga"><span class="m-ico"></span><div class="m-testi"><div class="m-su"><b class="m-gradi">–°</b><span class="m-nome"></span></div><span class="m-testo"></span></div></div><div class="m-suolo"></div><i class="m-lampo"></i></div>'),
    tasti: () => $(`<div class="tasti" data-fonte="tastiera">
      <div class="t-tast"><div class="t-chips"></div><div class="t-banco"><div class="t-g413"></div><div class="t-mouse"><div class="t-rot"></div><div class="t-g502"></div></div></div></div>
      <div class="t-pad"></div></div>`),
    meme: () => $('<div class="adv"><div class="a-barra"><i></i></div></div>'),
    adv: () => $('<div class="adv"><div class="a-barra"><i></i></div></div>'),
    adigeo: () => $('<div class="adigeo"><svg class="ad-freccia"><g><path class="sotto"/><path class="sopra"/></g></svg><span class="ad-testo">lui è <b>Adigeo</b></span></div>'),
    redbull: () => $('<div class="rb"><b class="rb-n">0</b><div class="rb-t"><span>Red Bull</span><small>oggi</small></div><i class="rb-piu">+1</i></div>'),
    legna: () => via('legna', 'sono a mettere la legna nella stufa'),
    pipi: () => via('pipi', 'sono a fare pipì'),
    bere: () => via('bere', 'sono andato a prendere qualcosa da bere'),
    mangiare: () => via('mangiare', 'sono andato a prendere qualcosa da mangiare'),
    lattina: () => via('lattina', 'sono andato a prendere una Red Bull'),
    telefono: () => via('telefono', 'sono al telefono'),
    spacco: () => via('spacco', 'sto spaccando la legna'),
    sistemo: () => via('sistemo', 'sto sistemando la postazione'),
    riavvio: () => via('riavvio', 'sto riavviando il pc'),
    social: () => $('<div class="social"><div class="so-testa">follower</div><div class="so-reti"></div></div>'),
    // niente azzurro qui dentro: l'occhio cerca la puff proprio per il suo azzurro
    puff: () => $(`<div class="puff"><i class="pf-coda"></i><div class="pf-testa"><span class="app">PUFF</span><span class="pf-gusto"></span></div>
      <div class="pf-riga"><span class="pf-batt"><i></i></span><b class="pf-pct"></b><span class="pf-pod"><small>pod</small>${[1, 2, 3, 4].map((n) => `<i>${n}</i>`).join('')}</span></div></div>`),
  }
  // il «torno subito»: la scritta grande al centro dello schermo, viva (via/scritta.js: lettera per lettera, secondo
  // quello che succede nella scena); il disegno è la scena che copre la webcam (via/via.js). Gli altri link, quando sei
  // via, li spegne il server
  const scritte = {}
  function via(nome, titolo) {
    const box = $(`<div class="via" data-via="${nome}"></div>`)
    scritte[nome] = creaScritta(box, nome, titolo, {
      tempo: () => (stato?.via?.cosa === nome ? Math.max(0, (Date.now() - stato.via.da) / 1000) : null),
      dice: () => sfondo?.dice(),
      gradi: () => (stato ? meteoScena(stato).gradi : null),
      redbull: () => stato?.redbull?.n ?? null,
      pausa: () => scena.classList.contains('dal-vivo'),
      ricentra: () => { if (el[nome] && !el[nome].dataset.trascina) posiziona(nome) },
    })
    return box
  }
  for (const p of PC) fatti[p] = () => creaPc(p, Q)
  for (const p of CAST) fatti[p] = () => creaCast(p)
  for (const p of SCENE) fatti[p] = () => creaScena(p)
  fatti.bandiera = () => creaBandiera(() => { if (el.bandiera && !el.bandiera.dataset.trascina) posiziona('bandiera') })
  let vistaEsterna = null, vistaCavi = null
  fatti.esterna = () => (vistaEsterna = sorveglianza(creaEsterna())).el
  fatti.cavi = () => (vistaCavi = creaCavi()).el
  const ALTO = ['nome', 'meteo', 'spie', 'adigeo']
  monta.forEach((p, n) => {
    const dentro = fatti[p]()
    if (p === 'cornice') { el[p] = dentro; dentro.style.zIndex = '9999'; scena.append(dentro); return }
    const fuori = document.createElement('div')
    fuori.className = 'pezzo'; fuori.dataset.pezzo = p
    fuori.style.zIndex = String(n + 1) // (il suo posto nell'ordine, anche quando torna da uno strato)
    if (ALTO.includes(p)) fuori.dataset.da = 'alto'
    dentro.classList.add('dentro')
    // sospesi: ognuno ondeggia piano, ognuno col suo passo, così non si muovono tutti insieme
    const aria = document.createElement('div')
    aria.className = 'aria'
    aria.style.animationDelay = `${-(n * 1.7) % 6}s`
    aria.style.animationDuration = `${5 + (n % 3)}s`
    aria.append(dentro); fuori.append(aria); scena.append(fuori)
    el[p] = fuori
  })
  // la cornice: ogni striscia prende il suo pezzo della stessa sfumatura conica attorno al centro dello schermo
  // (come conic-gradient(from …): 0° è in alto, in senso orario). ?fase=0…1 la tiene ferma a quel punto del giro
  const corniceTele = el.cornice ? [...el.cornice.querySelectorAll('canvas')].map((c, i) => ({ g: c.getContext('2d'), x: CORNICE[i][1], y: CORNICE[i][2], w: CORNICE[i][3], h: CORNICE[i][4] })) : []
  function corniceDisegna(gradi) {
    const a = (gradi - 90) * Math.PI / 180
    for (const { g, x, y, w, h } of corniceTele) {
      const s = g.createConicGradient(a, 960 - x, 540 - y)
      s.addColorStop(0, '#ccff00'); s.addColorStop(0.25, '#9d00ff'); s.addColorStop(0.5, '#ccff00'); s.addColorStop(0.75, '#9d00ff'); s.addColorStop(1, '#ccff00')
      g.fillStyle = s; g.fillRect(0, 0, w, h)
    }
  }
  if (el.cornice) {
    if (Q.has('fase')) { corniceDisegna(+Q.get('fase') * 360); window.__cornice = corniceDisegna }
    else ogniGiro((dt, t) => { if (el.cornice.classList.contains('su') && !scena.classList.contains('dal-vivo')) corniceDisegna((t / CORNICE_GIRO * 360) % 360) })
  }

  // ── lo stato che arriva dal server ──
  let rbPrima = null
  function applica(s) {
    stato = s
    // il tasto «risparmio GPU»: niente ombre/filtri/animazioni e giro a 30. Se l'indirizzo ha già ?fps=…, quello vince.
    const gpuLeggero = Q.get('gpu') === '0' || !!s.gpuLeggero
    document.documentElement.classList.toggle('niente-gpu', gpuLeggero)
    window.__nienteGpu = gpuLeggero
    if (!Q.has('fps')) fpsScegli(gpuLeggero ? 30 : 60)
    const L = lente()
    // la foto della stanza (rifatta ogni mezz'ora: l'ora nel nome fa prendere quella nuova, e solo quando cambia)
    const sf = `url("/rif/${L}.jpg?v=${s.foto?.[L] ?? 0}")`
    if (Q.has('sfondo') && scena.style.backgroundImage !== sf) scena.style.backgroundImage = sf
    if (el.bandiera) bandieraArriva(s) // (quale bandiera: cambia l'altezza del pezzo, quindi prima di metterlo a posto)
    if (vistaEsterna) vistaEsterna.aggiorna(s)
    sceneArriva(s) // (meteo e ora per «Dove vivo»; le altre scene non aspettano altro)
    for (const p of monta) {
      const su = Q.has('sempre') || !!s.attivi[p]
      if (p !== 'cornice' && !el[p].dataset.trascina && !el[p].classList.contains('segue')) posiziona(p)
      regolaMetti(p)
      if (su !== el[p].classList.contains('su')) {
        el[p].classList.toggle('su', su)
        if (!su) el[p].classList.remove('coperto')
        if (giostre[p]) su ? giostre[p].parti() : giostre[p].ferma()
        if (p === 'adigeo' && su) frecciaDisegna(true)
      }
    }
    // via: la scena copre la webcam; quello che sta attaccato a te o alla stanza (Giugnoh, la puff, Adigeo) e la
    // tastiera spariscono finché torni
    const via = VIA.find((p) => s.attivi[p])
    if (sfondo) {
      if (via && s.via) sfondo.accendi(via, s.via.da, meteoScena(s)); else if (sfondo.acceso()) sfondo.spegni()
      sfondo.meteo(meteoScena(s))
    }
    for (const p of ['nome', 'puff', 'adigeo', 'tasti']) el[p]?.classList.toggle('nascosto', !!via)
    if (el.spie) for (const k of Object.keys(SPIE)) { const sp = el.spie.querySelector(`[data-s=${k}]`); sp.classList.toggle('ok', !!s.spie[k]?.ok); sp.classList.toggle('no', !s.spie[k]?.ok) }
    if (el.meteo && s.meteo) meteoApplica(s.meteo, s.meteoProva)
    if (el.adigeo) frecciaDisegna(false)
    if (el.social) socialDisegna(s)
    if (el.puff) puffDisegna(s.puff ?? {})
    if (el.redbull) {
      const n = s.redbull?.n ?? 0, rb = el.redbull.querySelector('.rb')
      rb.querySelector('.rb-n').textContent = n
      if (rbPrima !== null && n > rbPrima) { rb.classList.remove('beve'); void rb.offsetWidth; rb.classList.add('beve') }
      rbPrima = n
    }
    if (el.argomento || el.fine) castArriva(s)
    vistaCavi?.aggiorna(s)
    orologio()
  }

  // ── il conto alla rovescia, il «via da», l'ultima Red Bull ──
  // (4 volte al secondo, ma si scrive solo quello che è cambiato: ogni scrittura fa rifare l'impaginazione e il disegno)
  const scrivi = (e, t) => { if (e && e.textContent !== t) e.textContent = t }
  function orologio() {
    if (!stato) return
    if (el.conto) {
      const [h, m] = stato.letto.split(':').map(Number), ora = new Date(), meta = new Date(ora)
      meta.setHours(h, m, 0, 0)
      // passata l'ora, per sei ore conta quanto sono in ritardo; dopo riparte verso la notte successiva
      let manca = (meta - ora) / 1000
      if (manca < -6 * 3600) manca += 86400
      if (manca > 18 * 3600) manca -= 86400
      const tardi = manca <= 0, c = el.conto.querySelector('.conto')
      if (c.classList.contains('tardi') !== tardi) c.classList.toggle('tardi', tardi)
      scrivi(c.querySelector('[data-t]'), tardi ? 'dovevo essere a letto da' : 'a letto fra')
      scrivi(c.querySelector('[data-n]'), tempo(Math.abs(manca)))
    }
    for (const p of VIA) if (el[p] && stato.via?.cosa === p) scrivi(el[p].querySelector('[data-da]'), tempo((Date.now() - stato.via.da) / 1000))
    if (el.redbull) {
      const u = stato.redbull?.ultima, m = u ? Math.floor((Date.now() - u) / 60000) : null
      scrivi(el.redbull.querySelector('small'), u ? (m < 1 ? 'oggi · appena aperta' : m < 60 ? `oggi · l'ultima ${m}′ fa` : `oggi · l'ultima ${Math.floor(m / 60)}h ${due(m % 60)}′ fa`) : 'oggi')
    }
  }
  setInterval(orologio, 250)

  // ── Giugnoh ──
  // (il contorno scuro è un -webkit-text-stroke fermo nel CSS: si disegna una volta, non 9 ombre a ogni fotogramma)
  const nomeLettere = el.nome ? [...el.nome.querySelectorAll('.n-parola span')] : []
  const nomeParola = el.nome?.querySelector('.n-parola')
  function nomeDisegna(T) {
    const giro = FASI.length * DURA, tt = ((T % giro) + giro) % giro
    const f = Math.floor(tt / DURA), t = tt - f * DURA, F = FASI[f], P = FASI[(f + FASI.length - 1) % FASI.length]
    const e = ss(0, .35, t) * (1 - ss(DURA - .35, DURA, t)), k = ss(0, .5, t)
    const w = F.parola?.(t, e) ?? {}
    metti(nomeParola, 'transform', `translate(${(w.tx ?? 0).toFixed(1)}px, ${(w.ty ?? 0).toFixed(1)}px) rotate(${(w.r ?? 0).toFixed(2)}deg) skewX(${(w.skew ?? 0).toFixed(2)}deg) scale(${(w.sx ?? 1).toFixed(3)}, ${(w.sy ?? 1).toFixed(3)})`)
    nomeLettere.forEach((s, i) => {
      const l = F.lettera?.(i, t, e) ?? {}
      const col = lerp(P.colore(i, DURA), F.colore(i, t), k), alone = lerp(P.alone(i, DURA), F.alone(i, t), k)
      metti(s, 'transform', `translate(${(l.tx ?? 0).toFixed(1)}px, ${(l.ty ?? 0).toFixed(1)}px) rotate(${(l.r ?? 0).toFixed(2)}deg) rotateY(${(l.ry ?? 0).toFixed(1)}deg) scale(${(l.s ?? 1).toFixed(3)})`)
      metti(s, 'color', css(col))
      const split = l.split ? `${-l.split}px 0 0 #ff2a6d, ${l.split}px 0 0 #05d9e8, ` : ''
      metti(s, 'textShadow', split + (GIF ? '' : `0 0 ${Math.round(l.g ?? 18)}px ${css(alone)}, `) + '0 10px 18px rgba(0,0,0,.5)')
    })
  }
  // (scrive uno stile solo se è cambiato: ogni scrittura costa un ricalcolo e un ridisegno)
  function metti(e, k, v) { const c = e.__s ?? (e.__s = {}); if (c[k] !== v) { c[k] = v; e.style[k] = v } }
  if (GIF) window.__nome = nomeDisegna

  // ── le spie: l'anello del microfono segue la voce ──
  const mic = el.spie?.querySelector('[data-s=mic]')
  const arco = mic?.querySelector('.livello')
  let micVuole = 0, micSi = 0, ondaUltima = 0, micScritto = -1
  function micDisegna(dt, ora) {
    micSi = Math.max(micVuole, micSi - dt * 1.4) // sale subito, scende piano
    // (in silenzio non si scrive niente; l'alone verde è un livello a parte che cambia solo trasparenza e grandezza)
    if (Math.abs(micSi - micScritto) > 0.004 || (!micSi && micScritto)) {
      micScritto = micSi
      arco.style.setProperty('--resto', (289 * (1 - micSi)).toFixed(1))
      mic.style.setProperty('--voce', micSi.toFixed(3))
    }
    if (micVuole > .45 && ora - ondaUltima > 230 && mic.classList.contains('ok')) {
      ondaUltima = ora
      const o = document.createElement('b')
      o.style.setProperty('--forza', micVuole.toFixed(2))
      o.addEventListener('animationend', () => o.remove())
      mic.querySelector('.onde').append(o)
    }
  }
  const livello = (p) => Math.min(1, Math.max(0, (p - .012) / .3)) ** .55

  // ── il meteo: i personaggi che ci vivono dentro ──
  const BESTIE = [['anatra', -1], ['lepre', 1], ['nutria', 1], ['riccio', -1], ['piccione', 1], ['cinghiale', 1], ['volpe', 1], ['fagiano', 1]]
  const FRASI = {
    sole: ['che bel sole', 'si sta da dio', 'tutti fuori!', 'occhiali da sole ON'], luna: ['zzz…', 'shh, dormono', 'che sonno', 'buonanotte chat'],
    nuvolo: ['mah, esco lo stesso', 'un po’ di sole dai'], nuvole: ['grigio Mantova', 'minaccia pioggia', 'che cielo triste'],
    pioggia: ['piove!', 'ombrello!!', 'scappaaa', 'mi sto lavando'], temporale: ['AAAH', 'tuoni!!', 'tutti dentro!'],
    neve: ['che freddo', 'nevica!!', 'brrr'], nebbia: ['dove siete?', 'non vedo niente', 'nebbia padana'], vento: ['che vento!', 'mi porta via', 'tieniti!'],
  }
  const LARGO = 760 // (la larghezza del meteo in pezzi.css)
  let bestie = [], tipoMeteo = 'nuvole', vento = 0, fumettoFra = 0, lampoFra = 0
  if (el.meteo) {
    const scelte = [...BESTIE].sort(() => Math.random() - .5).slice(0, 3)
    const suolo = el.meteo.querySelector('.m-suolo')
    bestie = scelte.map(([nome, guarda], i) => {
      const b = $(`<div class="ani">${OMBRELLO}<img src="/art/chat-animali/${nome}.webp" alt=""><i class="zzz"><b>z</b><b>z</b><b>Z</b></i><span class="fumetto"></span></div>`)
      suolo.append(b)
      return { el: b, img: b.querySelector('img'), guarda, x: 60 + i * 260 + Math.random() * 70, dir: Math.random() < .5 ? -1 : 1, salto: 0, ferma: 0, pensa: 2 + Math.random() * 4, dorme: i !== 1 }
    })
  }
  function cielo(tipo, ventoso) {
    const c = el.meteo.querySelector('.m-cielo'), chiave = `${tipo}${ventoso ? '+vento' : ''}`
    if (c.dataset.tipo === chiave) return
    c.dataset.tipo = chiave
    const n = (k) => Array.from({ length: k }, (_, i) => i)
    let h = ''
    if (tipo === 'pioggia' || tipo === 'temporale') h += n(34).map((i) => `<i class="goccia" style="left:${(caso(i) * 100).toFixed(1)}%;animation-delay:${(-caso(i + 50)).toFixed(2)}s;animation-duration:${(.5 + caso(i + 9) * .3).toFixed(2)}s"></i>`).join('')
    if (tipo === 'neve') h += n(26).map((i) => `<i class="fiocco" style="left:${(caso(i) * 100).toFixed(1)}%;animation-delay:${(-caso(i + 50) * 5).toFixed(2)}s;animation-duration:${(3.5 + caso(i + 9) * 2.5).toFixed(2)}s;--grande:${(4 + caso(i + 3) * 5).toFixed(1)}px"></i>`).join('')
    if (tipo === 'luna') h += n(18).map((i) => `<i class="stella" style="left:${(caso(i) * 100).toFixed(1)}%;top:${(caso(i + 20) * 70).toFixed(1)}%;animation-delay:${(-caso(i + 40) * 3).toFixed(2)}s"></i>`).join('')
    if (tipo === 'sole') h += n(12).map((i) => `<i class="scintilla" style="left:${(caso(i) * 100).toFixed(1)}%;top:${(caso(i + 20) * 80).toFixed(1)}%;animation-delay:${(-caso(i + 40) * 2.4).toFixed(2)}s"></i>`).join('')
    if (['nuvolo', 'nuvole', 'temporale', 'pioggia'].includes(tipo)) h += n(tipo === 'nuvolo' ? 2 : 4).map((i) => `<i class="nuvola${tipo === 'temporale' ? ' scura' : ''}" style="top:${(caso(i + 7) * 30 - 6).toFixed(1)}%;animation-delay:${(-caso(i + 30) * 40).toFixed(1)}s;animation-duration:${(34 + caso(i + 3) * 20).toFixed(1)}s;--grande:${(70 + caso(i + 5) * 50).toFixed(0)}px">${NUVOLA}</i>`).join('')
    if (tipo === 'nebbia') h += n(4).map((i) => `<i class="banco" style="top:${(10 + i * 22).toFixed(0)}%;animation-delay:${(-caso(i) * 18).toFixed(1)}s;animation-duration:${(16 + i * 5)}s"></i>`).join('')
    if (ventoso) h += n(9).map((i) => `<i class="foglia" style="top:${(caso(i) * 85).toFixed(1)}%;animation-delay:${(-caso(i + 60) * 4).toFixed(2)}s;animation-duration:${(2.2 + caso(i + 2) * 1.6).toFixed(2)}s;color:${['#ccff00', '#f0b232', '#ff8a1a'][i % 3]}">${FOGLIA}</i>`).join('')
    c.innerHTML = h
  }
  function meteoApplica(m, prova) {
    const tipo = prova && prova !== 'vento' ? prova : m.icona
    const ventoso = prova === 'vento' || m.vento >= 25
    const q = (c) => el.meteo.querySelector(c)
    q('.m-ico').innerHTML = TEMPO[tipo] ?? TEMPO.nuvole
    q('.m-gradi').textContent = `${m.gradi}°`
    q('.m-nome').textContent = m.nome
    const testi = { sole: 'sereno', luna: 'sereno', nuvolo: 'poco nuvoloso', nuvole: 'coperto', nebbia: 'nebbia', pioggia: 'pioggia', neve: 'neve', temporale: 'temporale' }
    q('.m-testo').textContent = `${prova ? testi[tipo] : m.testo}${ventoso ? ` · vento ${Math.max(m.vento, prova === 'vento' ? 40 : 0)} km/h` : ''} · ${m.min}°/${m.max}°`
    el.meteo.querySelector('.meteo').dataset.tipo = tipo
    el.meteo.querySelector('.meteo').classList.toggle('ventoso', ventoso)
    if (tipo !== tipoMeteo) fumettoFra = 1.2
    tipoMeteo = tipo; vento = ventoso ? 1 : 0
    cielo(tipo, ventoso)
  }
  function fumetto(b, testo, dura = 2600) {
    // di fianco, verso il bordo più vicino: sopra la testa coprirebbe la temperatura
    const f = b.el.querySelector('.fumetto')
    f.classList.toggle('sx', b.x < LARGO / 2); f.classList.toggle('dx', b.x >= LARGO / 2)
    f.textContent = testo
    f.classList.add('su')
    clearTimeout(b.fumettoVia)
    b.fumettoVia = setTimeout(() => f.classList.remove('su'), dura)
  }
  function bestieMuovi(dt) {
    const notte = tipoMeteo === 'luna'
    const passo = { pioggia: 2.3, temporale: 2.6, neve: .6, nebbia: .75, nuvole: .9, luna: .45 }[tipoMeteo] ?? 1
    const bagnata = tipoMeteo === 'pioggia' || tipoMeteo === 'temporale', trema = tipoMeteo === 'neve'
    for (const b of bestie) {
      const dorme = notte && b.dorme
      if (b.stato !== `${dorme}${bagnata}${trema}`) { b.stato = `${dorme}${bagnata}${trema}`; b.el.classList.toggle('dorme', dorme); b.el.classList.toggle('bagnata', bagnata); b.el.classList.toggle('trema', trema) }
      b.pensa -= dt
      if (b.pensa <= 0) { // ogni tanto si ferma, si gira, o (col sole) fa un salto di gioia
        b.pensa = 1.5 + Math.random() * 4
        const r = Math.random()
        if (r < .25) b.ferma = .8 + Math.random() * 1.6
        else if (r < .45) b.dir *= -1
        else if (r < .7 && tipoMeteo === 'sole') b.salto = .55
      }
      if (!dorme && b.ferma <= 0) {
        // il vento spinge verso destra: chi va contro rallenta e si piega, chi va con lui corre
        const v = 30 * passo * (vento ? (b.dir > 0 ? 1.7 : .45) : 1)
        b.x += b.dir * v * dt
        if (b.x < 10) { b.x = 10; b.dir = 1 } else if (b.x > LARGO - 58) { b.x = LARGO - 58; b.dir = -1 }
      } else b.ferma -= dt
      if (b.salto > 0) b.salto = Math.max(0, b.salto - dt)
      const su = b.salto > 0 ? Math.sin(Math.PI * (1 - b.salto / .55)) * 20 : 0
      const zampetta = !dorme && b.ferma <= 0 ? Math.abs(Math.sin(performance.now() / (tipoMeteo === 'pioggia' || tipoMeteo === 'temporale' ? 70 : 130) + b.x)) * 3 : 0
      const piega = vento && !dorme ? (b.dir > 0 ? 6 : -10) : 0
      metti(b.el, 'transform', `translate(${b.x.toFixed(1)}px, ${(-su - zampetta).toFixed(1)}px)`)
      metti(b.img, 'transform', `scaleX(${b.dir * b.guarda}) rotate(${(b.dir * b.guarda * piega).toFixed(1)}deg)`)
    }
    fumettoFra -= dt
    if (fumettoFra <= 0) { // una frase alla volta, solo da chi non sta sotto le scritte
      fumettoFra = 8 + Math.random() * 7
      const b = aCaso(bestie)
      if (b) fumetto(b, aCaso(FRASI[vento && Math.random() < .5 ? 'vento' : tipoMeteo] ?? FRASI.nuvole))
    }
    if (tipoMeteo === 'temporale') {
      lampoFra -= dt
      if (lampoFra <= 0) {
        lampoFra = 4 + Math.random() * 5
        const m = el.meteo.querySelector('.meteo')
        m.classList.remove('lampeggia'); void m.offsetWidth; m.classList.add('lampeggia')
        for (const b of bestie) { b.salto = .55; fumetto(b, '!', 900) }
      }
    }
  }

  // ── Adigeo: la freccia, disegnata dalla scritta alla punta ──
  let frecciaLente = null
  function frecciaDisegna(daCapo) {
    const L = lente()
    if (L === frecciaLente && !daCapo) return
    frecciaLente = L
    const testo = el.adigeo.querySelector('.ad-testo'), svg = el.adigeo.querySelector('svg')
    const [tx, ty] = FRECCIA[L] ?? FRECCIA['10']
    const sx = testo.offsetLeft + testo.offsetWidth + 10, sy = testo.offsetTop + testo.offsetHeight * .55
    // una curva che s'inarca, poi la punta, nella direzione d'arrivo
    const mx = (sx + tx) / 2, my = (sy + ty) / 2, dx = tx - sx, dy = ty - sy, lungo = Math.hypot(dx, dy)
    const cx = mx - dy * .28, cy = my + dx * .28 - lungo * .12
    const ang = Math.atan2(ty - cy, tx - cx), a = 26, apre = .5
    const p1 = [tx - a * Math.cos(ang - apre), ty - a * Math.sin(ang - apre)], p2 = [tx - a * Math.cos(ang + apre), ty - a * Math.sin(ang + apre)]
    const d = `M${sx} ${sy}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx} ${ty}M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${tx} ${ty}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    for (const p of svg.querySelectorAll('path')) p.setAttribute('d', d)
    const minx = Math.min(sx, tx, cx) - 30, miny = Math.min(sy, ty, cy) - 30, maxx = Math.max(sx, tx, cx) + 30, maxy = Math.max(sy, ty, cy) + 30
    Object.assign(svg.style, { left: `${minx}px`, top: `${miny}px`, width: `${maxx - minx}px`, height: `${maxy - miny}px` })
    svg.setAttribute('viewBox', `${minx} ${miny} ${maxx - minx} ${maxy - miny}`)
    svg.style.setProperty('--ux', (Math.cos(ang) * 8).toFixed(1)); svg.style.setProperty('--uy', (Math.sin(ang) * 8).toFixed(1))
    if (daCapo) { svg.classList.remove('disegna'); void svg.offsetWidth; svg.classList.add('disegna') }
  }

  // ── un solo giro di disegno per tutto quello che si muove (giro.js: 60 al secondo, non 164) ──
  const avvio = performance.now()
  // (anche le animazioni CSS infinite a 60 al secondo, non a 164; ferme nell'anteprima dal vivo, dove i pezzi non si vedono)
  if (!GIF && !Q.has('fase')) frenaAnimazioni(() => scena.classList.contains('dal-vivo'))
  if (GIF) nomeDisegna(0)
  else ogniGiro((dt, t, ora) => {
    // (nell'anteprima dal vivo i pezzi sono invisibili, perché l'immagine di Camo li ha già: niente da disegnare)
    if (scena.classList.contains('dal-vivo')) return
    if (el.nome?.classList.contains('su') && !el.nome.classList.contains('nascosto')) nomeDisegna((ora - avvio) / 1000)
    if (mic && el.spie.classList.contains('su')) micDisegna(dt, ora)
    if (el.meteo?.classList.contains('su')) bestieMuovi(dt)
  })

  // ── tastiera, mouse e controller ──
  const SOLO = Q.get('solo') // «?solo=pad» tiene sempre il controller, «?solo=tastiera» sempre la tastiera
  const g413 = el.tasti ? creaG413() : null
  const g502 = el.tasti ? creaG502() : null
  if (g413) { el.tasti.querySelector('.t-g413').append(g413.el); el.tasti.querySelector('.t-g502').append(g502.el) }
  function tastiera({ k, fonte }) {
    if (!el.tasti) return
    el.tasti.querySelector('.tasti').dataset.fonte = SOLO ?? fonte
    g413.aggiorna(k)
    g502.aggiorna(k)
    // sopra, in grande, i nomi dei tasti premuti: la tastiera è piccola, questi si leggono anche in un riquadro di Discord
    const nomi = k.filter((c) => c > 6).map(nomeTasto).filter(Boolean).slice(0, 5)
    const riga = el.tasti.querySelector('.t-chips'), chiave = nomi.join('+')
    if (riga.dataset.c !== chiave) { riga.dataset.c = chiave; riga.innerHTML = nomi.map((n) => `<span>${n}</span>`).join('') }
  }
  function rotella({ n }) {
    if (!el.tasti) return
    const r = el.tasti.querySelector('.t-rot'), f = document.createElement('b')
    f.textContent = n > 0 ? '▲' : '▼'
    f.className = n > 0 ? 'su' : 'giu'
    f.addEventListener('animationend', () => f.remove())
    r.append(f)
    while (r.children.length > 4) r.firstElementChild.remove()
    const w = g502.el.querySelector('[data-k="4"]')
    w.classList.add('scorre'); clearTimeout(w.via); w.via = setTimeout(() => w.classList.remove('scorre'), 160)
  }
  const ds = el.tasti ? creaDualSense() : null
  if (ds) el.tasti.querySelector('.t-pad').append(ds.el)
  const controller = (lettura) => ds?.aggiorna(lettura)
  if (ds && Q.has('browser')) daBrowser((l) => { controller(l); el.tasti.querySelector('.tasti').dataset.fonte = 'pad' })

  // ── le due giostre, due pezzi e due indirizzi: /o/meme fa girare i meme di pzkko (meme.js), /o/adv i progetti di
  // config.json. Una scheda alla volta, mescolate a ogni giro, 9 s l'una ──
  const mescola = (l) => { const m = [...l]; for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]] } return m }
  const pulito = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  // il titolo si stringe finché ci sta in una riga, il testo finché ci sta in due
  // (si rimisura quando i caratteri sono arrivati: alla prima scheda dopo il caricamento Ginto Nord non c'è ancora, e
  // con quello di riserva, più stretto, il titolo sembrava starci)
  function stringi(s) {
    const t = s.querySelector('.a-titolo'), x = s.querySelector('.a-testo')
    t.style.fontSize = x.style.fontSize = ''
    for (let f = 36; t.scrollWidth > t.clientWidth + 1 && f > 22; f -= 2) t.style.fontSize = `${f - 2}px`
    for (let f = 23; x.offsetHeight > 56 && f > 17; f--) x.style.fontSize = `${f - 1}px`
  }
  function giostra(p, lista) {
    const meme = p === 'meme'
    let fra = null, coda = [], ultima = null, colori = 0
    function scheda(a) {
      const [g1, g2] = meme ? SFUMATURE[colori++ % SFUMATURE.length] : ['var(--p)', '#f0b3ff']
      const testo = pulito(a.testo).replace('{rb}', `<b>${stato?.redbull?.n ?? 0}</b>`)
      const foglio = /manifesti|auguri/.test(a.arte ?? '') ? ` foglio" style="--storto:${(Math.random() * 8 - 4).toFixed(1)}deg` : ''
      // (chi si muove sta fuori, l'ombra sta dentro: così l'ombra si disegna una volta sola e la scheda video la sposta)
      const sim = (a.simboli ?? []).slice(0, 3).map((n, i) => `<i class="a-sim s${i}" style="--d:${(.45 + i * .18).toFixed(2)}s"><b><img src="${simbolo(n)}" alt=""></b></i>`).join('')
      return `<div class="a-arte${foglio}"><div class="a-dondola"><img src="${a.arte ?? aCaso(roba) ?? ''}" alt=""></div>${sim}</div>`
        + `<div class="a-testi"><div class="a-testa"><span class="app${meme ? ' meme' : ''}">${meme ? 'MEME' : 'ADV'}</span><span>pzkko.it${a.da ? ` · ${pulito(a.da)}` : ''}</span></div>`
        + `<div class="a-titolo" style="--g1:${g1};--g2:${g2}">${pulito(a.titolo)}</div><div class="a-testo">${testo}</div></div>`
    }
    function mostra(a) {
      if (!el[p] || !a) return
      ultima = a
      const box = el[p].querySelector('.adv'), barra = box.querySelector('.a-barra'), nuova = document.createElement('div')
      // se ne va tutto quello che c'era, anche con due cambi di fila: mai due schede una sopra l'altra
      for (const v of box.querySelectorAll('.a-giro:not(.esce)')) { v.classList.add('esce'); setTimeout(() => v.remove(), 700) }
      nuova.className = 'a-giro arriva'; nuova.innerHTML = scheda(a)
      barra.before(nuova); stringi(nuova)
      Promise.all([document.fonts.load('800 36px "Ginto Nord"'), document.fonts.load('700 23px "gg sans"')]).then(() => nuova.isConnected && stringi(nuova), () => {})
      requestAnimationFrame(() => requestAnimationFrame(() => nuova.classList.remove('arriva')))
      const i = barra.firstElementChild; i.classList.remove('va'); void i.offsetWidth; i.classList.add('va')
    }
    function gira() {
      if (!coda.length) { coda = mescola(lista()); if (coda.length > 1 && coda[0] === ultima) coda.push(coda.shift()) } // mai la stessa due volte di fila
      if (!coda.length) return
      mostra(coda.shift())
      fra = setTimeout(gira, 9000)
    }
    return { parti() { clearTimeout(fra); gira() }, ferma() { clearTimeout(fra) }, rifai() { coda = [] }, mostra(a) { clearTimeout(fra); mostra(a) } }
  }
  const giostre = { meme: giostra('meme', () => MEME), adv: giostra('adv', () => adv) }
  Object.assign(giostre, scritte) // (anche le scritte dei «torno subito» partono quando si accendono e si fermano quando torni)

  // ── il posto normale di un pezzo (quello spostato dalla regia, o quello di POSTI) ──
  function posiziona(p) {
    const sul = sulMuroMetti(p)
    regolaMetti(p) // (sul muro lo gira il muro: salendo o scendendo cambia chi lo gira)
    if (sul) return
    const L = lente()
    // la scritta dei «torno subito» sta al centro dello schermo (se non l'hai spostata tu dalla regia), e così la fine
    // puntata del podcast
    if ((VIA.includes(p) || p === 'fine') && !stato?.posti?.[L]?.[p]) {
      const d = el[p].querySelector('.dentro')
      return metti(el[p], 'transform', `translate(${Math.round(960 - d.offsetWidth / 2)}px, ${Math.round(540 - d.offsetHeight / 2)}px) scale(1)`)
    }
    let [x, y, sc] = stato?.posti?.[L]?.[p] ?? POSTI[L]?.[p] ?? POSTI['10'][p]
    // i follower crescono coi social spuntati: se arrivano al bordo dello schermo salgono (o vanno a sinistra) quanto basta
    if (p === 'social') {
      const d = el[p].querySelector('.dentro')
      x = Math.max(0, Math.min(x, 1920 - 8 - d.offsetWidth * sc)); y = Math.max(0, Math.min(y, 1080 - 8 - d.offsetHeight * sc))
    }
    metti(el[p], 'transform', `translate(${x}px, ${y}px) scale(${sc})`)
    if (p === 'cavi') vistaCavi?.muovi()
  }

  // ── le regolazioni di ogni sorgente (regola.js), scelte in regia: la rotazione e lo specchio vanno nelle proprietà
  // «rotate» e «scale» di .dentro (attorno al suo centro; il transform resta all'entrata), l'opacità e il filtro in due
  // variabili che pezzi.css usa quando il pezzo è acceso. Su un muro la rotazione è quella del muro (q.r): questa non
  // si somma. Gamma, nitidezza, temperatura e vividezza passano da un filtro SVG, fatto solo per chi li usa. La regia,
  // mentre muovi un cursore, passa i suoi valori (window.__regola) senza aspettare il server ──
  const regProva = {}
  let regSvg = null
  function regolaMetti(p) {
    const e = el[p]
    if (!e) return
    const R = p in regProva ? regProva[p] : stato?.regola?.[p]
    const d = p === 'cornice' ? e : e.querySelector('.dentro'), c = cssDi(R, `reg-${p}`)
    const giro = p === 'cornice' || e.dataset.muro ? 0 : c.giro
    const k = `${giro}|${c.specchio}|${c.op}|${c.filtro}|${c.svg}`
    if ((d.__reg ?? '0||null||') === k) return
    d.__reg = k; d.__giro = giro
    d.style.rotate = giro ? `${giro}deg` : ''
    d.style.scale = p === 'cornice' ? '' : c.specchio
    if (c.op == null) d.style.removeProperty('--op'); else d.style.setProperty('--op', c.op)
    if (p === 'cornice') d.style.filter = c.filtro
    else if (c.filtro) d.style.setProperty('--reg', c.filtro); else d.style.removeProperty('--reg')
    // il filtro SVG: largo più del pezzo, perché ombre, fumetti e simbolini escono dal suo riquadro
    let f = regSvg?.querySelector(`#reg-${p}`)
    if (!c.svg) { f?.remove(); return }
    if (!regSvg) { regSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); regSvg.setAttribute('width', '0'); regSvg.setAttribute('height', '0'); regSvg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none'; document.body.append(regSvg) }
    if (!f) { f = document.createElementNS('http://www.w3.org/2000/svg', 'filter'); f.id = `reg-${p}`; for (const [a, v] of [['x', '-40%'], ['y', '-40%'], ['width', '180%'], ['height', '180%'], ['color-interpolation-filters', 'sRGB']]) f.setAttribute(a, v); regSvg.append(f) }
    if (f.__c !== c.svg) { f.__c = c.svg; f.innerHTML = c.svg }
  }
  function regolaArriva({ p, v }) {
    if (!stato) return
    stato.regola ??= {}
    if (v) stato.regola[p] = v; else delete stato.regola[p]
    delete regProva[p] // (quello che la regia stava provando è arrivato: vale il server)
    regolaMetti(p)
  }

  // ── i pezzi appesi ai muri (muri.js): la parete della stanza dà la prospettiva (più piccoli dove il muro scappa via),
  // la grandezza vera (su un muro vicino vengono più grandi), la luce (più scuri dove il muro è in ombra, dalla foto
  // della stanza) e un filo di sfocatura quando sono lontani. La pagina dei muri, mentre li sistemi, passa i suoi
  // (window.__muri) senza aspettare il server ──
  let muriProva = null
  const muriDi = (L) => (muriProva?.L === L ? muriProva.M : stato?.muri?.[L])
  function sulMuro(p) {
    const L = lente(), M = muriDi(L), q = M?.pezzi?.[p], m = q && M.pareti.find((x) => x.id === q.muro)
    const pi = m && muroPiano(m, fDi(M, L))
    return pi ? { M, q, pi, m } : null
  }
  const luce = { chiave: '', lum: null, img: null } // la foto della stanza in piccolo, per la luce sui muri (la bandiera la vuole intera)
  function luceCarica() {
    const L = lente(), v = stato?.foto?.[L] ?? 0, k = `${L}:${v}`
    if (luce.chiave === k || !Object.values(muriDi(L)?.pezzi ?? {}).length) return
    luce.chiave = k; luce.lum = null; luce.img = null
    const img = new Image()
    img.onload = () => { if (luce.chiave !== k) return; luce.lum = luminosita(img); luce.img = img; for (const p of monta) if (el[p]?.dataset.muro) posiziona(p) }
    img.src = `/rif/${L}.jpg?v=${v}`
  }
  function sulMuroMetti(p) {
    const e = el[p], s = p !== 'cornice' && sulMuro(p)
    if (!s) {
      if (e.dataset.muro) { delete e.dataset.muro; metti(e, 'filter', '') }
      if (e.parentElement === stratoMuri) scena.append(e) // (staccato dal muro: torna sopra, fuori dallo strato che si buca)
      if (p === 'bandiera') bandieraMuro(null)
      return false
    }
    // «dietro di me»: il pezzo va nello strato sotto agli altri. Gli altri muri (per esempio una parete davanti, o un
    // muro dove il corpo non passa mai) restano normali.
    const dove = s.m.corpo !== false ? stratoMuri : scena
    if (e.parentElement !== dove) dove.append(e)
    luceCarica()
    const w = e.offsetWidth, h = e.offsetHeight, G = muroMatrice(s.pi, s.q, w, h)
    e.dataset.muro = s.q.muro
    metti(e, 'transform', css3d(G))
    // (la bandiera la luce della stanza se la fa da sé, punto per punto: bandiera.js)
    if (p === 'bandiera') { metti(e, 'filter', ''); bandieraMuro({ pi: s.pi, q: s.q, G, w, h, img: luce.img }) }
    else metti(e, 'filter', muroFiltro(s.M, s.pi, s.q, G, w, h, luce.lum))
    return true
  }

  // ── la copertura: l'occhio confronta il colore attorno a ogni pezzo appeso con la foto di inizio e manda l'elenco
  // dei pezzi che in questo momento hanno qualcosa davanti. Non si buca più lo strato con la sagoma del corpo (niente
  // MediaPipe): il pezzo intero sparisce, come se ci fosse passata davanti una persona. La classe .coperto è solo
  // visiva; il riquadro del pezzo continua a essere mandato al server, così l'occhio può vederlo tornare.
  let copertiPrima = '', copertiScad = null
  function copertiMetti(l) {
    const k = l.slice().sort().join(',')
    if (k !== copertiPrima) {
      copertiPrima = k
      const set = new Set(l)
      for (const p of monta) el[p]?.classList.toggle('coperto', set.has(p))
    }
    clearTimeout(copertiScad)
    copertiScad = l.length ? setTimeout(() => copertiMetti([]), 1800) : null // (se l'occhio tace, tornano tutti)
  }

  // ── chi segue: Giugnoh sopra la testa e il cartellino accanto alla puff. L'occhio del server manda dove sono, 10
  // volte al secondo, con l'ora della foto. La foto è già un po' vecchia quando il pezzo arriva in onda: se ti stai
  // muovendo, il pezzo va dove sei adesso (la velocità per il tempo passato), non dove eri. Poi ci si arriva morbidi,
  // 60 volte al secondo: piano quando stai fermo (il riconoscimento trema di qualche pixel), svelto quando ti muovi ──
  const ANTICIPO = 0.08 // secondi in più: dalla foto all'immagine in onda passano anche Camo e la pagina
  let occhio = null, occhioAlle = 0, puffVista = null, puffAlle = 0
  const dove = { nome: null, puff: null } // dove sono adesso: [x, y, scala]
  const moto = { testa: null, puff: null } // il centro visto e la velocità (px al secondo): { x, y, vx, vy, t }
  function muovi(k, b, t) {
    if (!b || !t) { moto[k] = null; return }
    const x = k === 'testa' ? b.x + b.w / 2 : b.x, y = k === 'testa' ? b.y + b.h / 2 : b.y, m = moto[k] // (la puff arriva già dal centro)
    let vx = 0, vy = 0
    if (m && t > m.t && t - m.t < 400) { const dt = (t - m.t) / 1000; vx = m.vx * 0.5 + (x - m.x) / dt * 0.5; vy = m.vy * 0.5 + (y - m.y) / dt * 0.5 }
    moto[k] = { x, y, vx, vy, t }
  }
  // quanto portarlo avanti: sotto i 60 px al secondo è il tremolio del riconoscimento, non un movimento (e fra 60 e 180
  // entra piano); mai più in là di «max»
  function avanti(k, max) {
    const m = moto[k], v = m ? Math.hypot(m.vx, m.vy) : 0
    if (v < 60) return [0, 0]
    const s = Math.min(0.3, Math.max(0, (Date.now() - m.t) / 1000) + ANTICIPO) * Math.min(1, (v - 60) / 120)
    let dx = m.vx * s, dy = m.vy * s
    const d = Math.hypot(dx, dy)
    if (d > max) { dx *= max / d; dy *= max / d }
    return [dx, dy]
  }
  function occhioArriva(o) {
    occhio = o; occhioAlle = Date.now()
    muovi('testa', o.testa && o.testa.da !== 'persa' ? o.testa : null, o.t)
    if (o.puff) { puffVista = o.puff; puffAlle = Date.now() }
    muovi('puff', o.puff, o.t)
    if (Array.isArray(o.coperti)) copertiMetti(o.coperti)
  }
  const viaOra = () => VIA.some((p) => stato?.attivi?.[p])
  const vivo = () => Date.now() - occhioAlle < 3000 // (se l'occhio tace da 3 secondi, ognuno torna al suo posto)
  function bersaglio(p) {
    const L = lente(), mio = stato?.posti?.[L]?.[p], dentro = el[p].querySelector('.dentro')
    const [dw, dh] = misura(dentro)
    if (p === 'nome') {
      const t = occhio.testa, sc = mio?.[2] ?? 0.42, w = dw * sc, h = dh * sc, rif = stato.testaRif?.[L]
      const [ax, ay] = avanti('testa', t.w)
      // spostato a mano mentre seguiva: resta lì rispetto alla testa; se no, centrato sopra le cuffie
      if (mio && rif) return [mio[0] + t.x + t.w / 2 - rif[0] + ax, mio[1] + t.y - rif[1] + ay, sc]
      return [t.x + t.w / 2 - w / 2 + ax, t.y - t.h * 0.55 - h + ay, sc]
    }
    // il cartellino sta dalla parte della puff lontana dalla testa, sopra; se sopra coprirebbe la faccia (la puff in
    // mano), sotto; e dentro la tela
    const [ax, ay] = Date.now() - puffAlle < 400 ? avanti('puff', 120) : [0, 0]
    const b = { ...puffVista, x: puffVista.x + ax, y: puffVista.y + ay }, sc = mio?.[2] ?? 1, w = dw * sc, h = dh * sc, t = occhio?.testa
    let lato = t && b.x < t.x + t.w / 2 ? 'sx' : 'dx', su = true
    const xDi = (l) => l === 'dx' ? b.x + b.w / 2 + 22 : b.x - b.w / 2 - 22 - w
    if (xDi(lato) < 12 || xDi(lato) + w > 1908) lato = lato === 'dx' ? 'sx' : 'dx'
    const x = xDi(lato)
    let y = b.y - b.h / 2 - h - 12
    const faccia = t && [t.x - t.w * 0.3, t.y - t.h * 0.7, t.w * 1.6, t.h * 2.1]
    const copre = (yy) => faccia && x < faccia[0] + faccia[2] && x + w > faccia[0] && yy < faccia[1] + faccia[3] && yy + h > faccia[1]
    if (y < 12 || copre(y)) { y = b.y + b.h / 2 + 12; su = false }
    if (el.puff.dataset.lato !== lato) el.puff.dataset.lato = lato
    if (el.puff.dataset.su !== String(su)) el.puff.dataset.su = su
    return [x, y, sc]
  }
  function seguiGiro(dt) {
    for (const p of ['nome', 'puff']) {
      if (!el[p] || el[p].dataset.trascina || !stato) continue
      if (p === 'puff') el.puff.classList.toggle('nascosto', viaOra()) // (quando sei via, niente cartellino)
      const vuole = p === 'nome' ? stato.segue && !!occhio?.testa && vivo() && !viaOra() && !sulMuro('nome') :!!puffVista && (vivo() || Date.now() - puffAlle < 3000)
      if (!vuole) {
        if (el[p].classList.contains('segue')) { el[p].classList.remove('segue', 'persa'); dove[p] = null; posiziona(p) }
        // (la puff non s'è mai vista: il cartellino resta dove l'hai messo a mano, se l'hai messo; se no non si vede)
        if (p === 'puff') el.puff.classList.toggle('mai', !puffVista && !stato.posti?.[lente()]?.puff)
        continue
      }
      el[p].classList.add('segue'); if (p === 'puff') el.puff.classList.remove('mai')
      el[p].classList.toggle('persa', p === 'nome' ? occhio.testa.persa > 8000 : Date.now() - puffAlle > 3000)
      const b = bersaglio(p), c = dove[p] ?? (dove[p] = [...b]) // la prima volta, subito lì
      // lontano dal posto giusto si corre (τ 40 ms), vicino si va piano (τ 140 ms): niente ritardo, niente tremolio
      const lontano = Math.hypot(b[0] - c[0], b[1] - c[1]), k = 1 - Math.exp(-dt / (0.14 - 0.1 * Math.min(1, Math.max(0, (lontano - 6) / 60))))
      for (let i = 0; i < 3; i++) if (Math.abs(b[i] - c[i]) > (i === 2 ? 0.002 : 0.8)) c[i] += (b[i] - c[i]) * k
      metti(el[p], 'transform', `translate(${c[0].toFixed(1)}px, ${c[1].toFixed(1)}px) scale(${c[2].toFixed(3)})`)
    }
  }
  // (le misure dei due cartellini le dà il ResizeObserver: leggerle a ogni giro faceva rifare l'impaginazione)
  const misure = new Map()
  const misura = (e) => misure.get(e) ?? [e.offsetWidth, e.offsetHeight]
  const guardaMisure = new ResizeObserver((l) => { for (const r of l) misure.set(r.target, [r.target.offsetWidth, r.target.offsetHeight]) })
  for (const p of ['nome', 'puff']) if (el[p]) guardaMisure.observe(el[p].querySelector('.dentro'))
  if (el.nome || el.puff) ogniGiro(seguiGiro)

  // ── il cartellino della puff: gusto, batteria, quale pod ──
  function puffDisegna(pf) {
    const c = el.puff, b = Math.min(100, Math.max(0, pf.batteria ?? 0))
    c.querySelector('.pf-gusto').textContent = pf.gusto || 'puff'
    c.querySelector('.pf-pct').textContent = `${b}%`
    c.querySelector('.pf-batt i').style.width = `${b}%`
    c.querySelector('.pf-batt').dataset.livello = b <= 15 ? 'rosso' : b <= 40 ? 'giallo' : 'verde'
    c.querySelectorAll('.pf-pod i').forEach((i, n) => i.classList.toggle('su', n + 1 === pf.pod))
  }

  // ── i follower ──
  const ICONA = {
    instagram: '<svg viewBox="0 0 32 32"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#962fbf"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#ig)"/><rect x="8" y="8" width="16" height="16" rx="5" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="16" cy="16" r="3.8" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="22.2" cy="9.8" r="1.5" fill="#fff"/></svg>',
    tiktok: '<svg viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="9" fill="#000"/><g transform="translate(16 16)"><path d="M2.5-10c.4 2.6 2 4.3 4.6 4.5v3.4c-1.6 0-3.1-.5-4.5-1.4v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.5a2.3 2.3 0 1 0 1.4 2.1V-10z" fill="#25f4ee" transform="translate(-1 -1)"/><path d="M2.5-10c.4 2.6 2 4.3 4.6 4.5v3.4c-1.6 0-3.1-.5-4.5-1.4v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.5a2.3 2.3 0 1 0 1.4 2.1V-10z" fill="#fe2c55" transform="translate(1 1)"/><path d="M2.5-10c.4 2.6 2 4.3 4.6 4.5v3.4c-1.6 0-3.1-.5-4.5-1.4v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.5a2.3 2.3 0 1 0 1.4 2.1V-10z" fill="#fff"/></g></svg>',
    youtube: '<svg viewBox="0 0 32 32"><rect x="1" y="5" width="30" height="22" rx="7" fill="#ff0033"/><path d="M13 11v10l9-5z" fill="#fff"/></svg>',
    twitch: '<svg viewBox="0 0 32 32"><path d="M6 2 3 8v19h7v4h4l4-4h6l7-7V2z" fill="#9146ff"/><path d="M7 5h20v13l-4 4h-7l-4 4v-4H7z" fill="#fff"/><path d="M14 9h2.6v7H14zM20.6 9h2.6v7h-2.6z" fill="#9146ff"/></svg>',
  }
  // gli altri social: l'icona di pzkko.it nel colore del marchio (bianca quando il marchio è nero, come X o GitHub)
  const icona = (nome) => {
    if (ICONA[nome]) return ICONA[nome]
    const [col, d] = ICONS[nome] ?? []
    if (!d) return ''
    const [r, g, b] = rgb(`#${col}`)
    return `<svg viewBox="0 0 24 24"><path fill="#${0.2126 * r + 0.7152 * g + 0.0722 * b < 60 ? 'fff' : col}" d="${d}"/></svg>`
  }
  const numero = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1).replace('.', ',').replace(',0', '')}k` : n.toLocaleString('it-IT')
  function socialDisegna(s) {
    const box = el.social.querySelector('.so-reti')
    // in onda: quelli spuntati in regia che hanno un numero, nell'ordine di pzkko.it
    const vanno = (s.reti ?? []).filter(({ rete }) => s.socialSi?.[rete] && Number.isFinite(s.social?.[rete]?.n))
    for (const r of [...box.children]) if (!vanno.some((v) => v.rete === r.dataset.rete)) r.remove()
    vanno.forEach(({ rete, nome, icona: ic }, i) => {
      let r = box.querySelector(`[data-rete="${rete}"]`)
      if (!r) r = $(`<div class="so" data-rete="${rete}"><span class="so-ico">${icona(ic)}</span><span class="so-n"><b></b><small></small></span></div>`)
      if (box.children[i] !== r) box.insertBefore(r, box.children[i] ?? null)
      // due account con la stessa icona (i due Instagram): sotto il numero c'è anche il nome
      r.querySelector('small').textContent = vanno.some((v) => v.rete !== rete && v.icona === ic) ? `@${nome}` : ''
      const b = r.querySelector('b'), t = numero(s.social[rete].n)
      if (b.textContent && b.textContent !== t) { r.classList.remove('sale'); void r.offsetWidth; r.classList.add('sale') }
      b.textContent = t
    })
    el.social.querySelector('.social').classList.toggle('vuoto', !box.children.length)
    if (!el.social.dataset.trascina) posiziona('social') // (alto quanto le righe che ha adesso)
  }

  // ── i «torno subito»: la scena che copre tutta la webcam (via/via.js), sotto ai pezzi. Il tempo che fa è quello
  // vero, o quello di prova scelto in regia ──
  const sfondo = monta.some((p) => VIA.includes(p)) ? creaSfondo(scena) : null
  function meteoScena(s) {
    const m = s.meteo ?? { icona: 'nuvole', gradi: 12, vento: 0 }
    return s.meteoProva ? { ...m, icona: s.meteoProva === 'vento' ? m.icona : s.meteoProva, vento: s.meteoProva === 'vento' ? 40 : m.vento } : m
  }

  // ── l'anteprima della regia dal vivo (?sfondo=vivo): la webcam, 10 volte al secondo. Nell'immagine di Camo i pezzi ci
  // sono già, quindi qui diventano invisibili (restano lì per trascinarli: si vede solo quello che tieni in mano).
  // Chiede la foto dopo l'ultima che ha: il server la manda appena c'è, e lei la richiede subito. La decodifica la fa
  // il browser fuori dalla pagina (createImageBitmap), poi un disegno solo sulla tela ──
  if (Q.get('sfondo') === 'vivo') {
    const tela = document.createElement('canvas')
    tela.className = 'vivo-foto'; tela.width = 960; tela.height = 540
    const cx = tela.getContext('2d', { alpha: false })
    scena.prepend(tela)
    let n = 0
    const prossima = async () => {
      if (document.hidden) { setTimeout(prossima, 600); return }
      try {
        const r = await fetch(`/api/cam.jpg?dopo=${n}`, { cache: 'no-store' })
        if (!r.ok) throw new Error()
        const x = r.headers.get('X-Foto')
        if (!x) await new Promise((ok) => setTimeout(ok, 100)) // (un server di prima non aspetta la foto nuova: allora si va a tempo)
        n = +x || n + 1
        const foto = await createImageBitmap(await r.blob())
        if (tela.width !== foto.width) { tela.width = foto.width; tela.height = foto.height }
        cx.drawImage(foto, 0, 0); foto.close()
        scena.classList.add('dal-vivo')
        prossima()
      } catch { scena.classList.remove('dal-vivo'); n = 0; setTimeout(prossima, 1500) } // (niente webcam: la foto della stanza)
    }
    prossima()
  }

  // ── la maschera per l'occhio: le pagine di Camo (non l'anteprima della regia) dicono al server, ogni due secondi, dove
  // stanno disegnando. L'occhio lì non cerca la puff: le nostre scritte e le nostre immagini non la ingannano ──
  // Il riquadro di un pezzo è il suo box più un margine per quello che ne esce (i fumetti delle bestioline, i simbolini
  // dei meme, le onde del microfono). Prima si misuravano uno per uno tutti gli elementi di tutti i pezzi (centinaia,
  // coi pezzi del pc): ogni due secondi un fotogramma saltava.
  const ingombro = (e) => {
    const b = e.getBoundingClientRect(), m = 28
    if (!b.width || !b.height) return null
    const x0 = Math.max(-50, b.left - m), y0 = Math.max(-50, b.top - m)
    return [x0, y0, Math.min(1970, b.right + m) - x0, Math.min(1130, b.bottom + m) - y0]
  }
  if (window.top === window) {
    const pagina = Math.random().toString(36).slice(2)
    setInterval(() => {
      if (!stato) return
      const r = Object.entries(el).filter(([p, e]) => p !== 'cornice' && e.classList.contains('su') && !e.classList.contains('mai') && !e.classList.contains('nascosto'))
        .map(([p, e]) => { const b = ingombro(e.querySelector('.dentro')); return b && [...b, p] }).filter(Boolean)
      if (el.cornice?.classList.contains('su')) r.push([0, 0, 1920, 16, 'cornice'], [0, 1064, 1920, 16, 'cornice'], [0, 0, 16, 1080, 'cornice'], [1904, 0, 16, 1080, 'cornice'])
      if (sfondo?.acceso() && stato.via) r.push([0, 0, 1920, 1080, stato.via.cosa])
      fetch('/api/azione', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'riquadri', pagina, r }) }).catch(() => {})
    }, 2000)
  }

  // (per provare senza premere niente: la regia e gli strumenti chiamano questi)
  if (Q.has('prova')) window.__prova = { tastiera, controller, rotella, picco: (p) => { micVuole = livello(p) }, fumetto: (t) => bestie[0] && fumetto(bestie[0], t, 60000), meme: (i) => giostre.meme.mostra(MEME[i]), adv: (i) => giostre.adv.mostra(adv[i]) }
  // ── il filo col server ──
  fetch('/api/oggetti').then((r) => r.json()).then((d) => {
    roba = d.oggetti ?? []; adv = d.adv ?? []
    giostre.adv.rifai() // (i progetti arrivano adesso: se la giostra era già accesa, era vuota)
    if (el.adv?.classList.contains('su')) giostre.adv.parti()
  }).catch(() => {})
  // Nei livelli di Camo il filo resta sempre aperto. Nell'anteprima della regia (una pagina dentro un'altra) si stacca
  // quando la scheda va dietro, come quello della regia: il browser tiene al massimo 6 collegamenti per sito.
  const anteprima = window.top !== window
  let filo = null
  function collega() {
    if (filo || (anteprima && document.hidden)) return
    const pc = monta.some((p) => PC.includes(p)) // (i numeri del pc arrivano solo a chi li mostra)
    filo = new EventSource(pc ? '/api/flusso?pc' : '/api/flusso')
    filo.addEventListener('stato', (e) => applica(JSON.parse(e.data)))
    filo.addEventListener('occhio', (e) => occhioArriva(JSON.parse(e.data)))
    filo.addEventListener('nascondi', (e) => nascondi(JSON.parse(e.data).ms))
    filo.addEventListener('regola', (e) => regolaArriva(JSON.parse(e.data)))
    if (pc) {
      filo.addEventListener('pc', (e) => pcArriva(JSON.parse(e.data)))
      filo.addEventListener('pcnomi', (e) => pcNomi(JSON.parse(e.data)))
      if (!Q.has('prova')) filo.addEventListener('app', (e) => appArriva(JSON.parse(e.data))) // (in prova le app le passa chi prova: import('/pc.js'))
    }
    if (!Q.has('prova')) { // (in prova i sensori li faccio io: quelli veri non devono spegnerli)
      filo.addEventListener('tasti', (e) => tastiera(JSON.parse(e.data)))
      filo.addEventListener('pad', (e) => controller(JSON.parse(e.data)))
      filo.addEventListener('rotella', (e) => rotella(JSON.parse(e.data)))
      filo.addEventListener('picco', (e) => { micVuole = livello(JSON.parse(e.data).mic) })
    }
  }
  if (anteprima) document.addEventListener('visibilitychange', () => { if (!document.hidden) return collega(); filo?.close(); filo = null })
  collega()
  // la regia, quando trascina un pezzo, lo sposta qui senza aspettare il server
  window.__posto = (p, x, y, s, fermo) => {
    if (!el[p]) return
    if (fermo) delete el[p].dataset.trascina; else { el[p].dataset.trascina = '1'; el[p].classList.remove('coperto') } // (mentre lo sposti si vede)
    if (el[p].dataset.muro) { delete el[p].dataset.muro; metti(el[p], 'filter', '') } // (staccato da un muro, nella pagina dei muri)
    if (el[p].parentElement === stratoMuri) scena.append(el[p]) // (mentre lo trascini non è più sul muro: fuori dallo strato che si buca)
    metti(el[p], 'transform', `translate(${x}px, ${y}px) scale(${s})`)
    regolaMetti(p)
    if (p === 'cavi') vistaCavi?.muovi()
  }
  // la regia, mentre muove un cursore delle regolazioni: vale subito (R undefined: torna quello del server)
  window.__regola = (p, R) => { if (R === undefined) delete regProva[p]; else regProva[p] = R; regolaMetti(p) }
  window.__pezzi = () => Object.fromEntries(Object.entries(el).filter(([p]) => p !== 'cornice').map(([p, e]) => [p, { su: e.classList.contains('su'), box: e.querySelector('.dentro').getBoundingClientRect().toJSON(), posto: e.style.transform, w: e.offsetWidth, h: e.offsetHeight, muro: e.dataset.muro ?? null, giro: e.querySelector('.dentro').__giro || 0, segue: e.classList.contains('segue'), nascosto: e.classList.contains('nascosto') || e.classList.contains('mai'), coperto: e.classList.contains('coperto') }]))
  // la pagina dei muri: i suoi muri (per la lente L) valgono subito; «tiene» è il pezzo che ha in mano (niente scivolate)
  window.__muri = (L, M, tiene) => {
    muriProva = M ? { L, M } : null
    for (const p of monta) {
      if (p === 'cornice' || el[p].classList.contains('segue')) continue
      if (p === tiene) el[p].dataset.trascina = '1'; else if (el[p].dataset.trascina) delete el[p].dataset.trascina
      // (quelli in aria li mette a posto lo stato del server; qui solo chi è su un muro o ne è appena sceso)
      if (sulMuro(p) || (p !== tiene && el[p].dataset.muro)) posiziona(p)
    }
  }
  // la foto della stanza scattata dalla regia: per un attimo non si disegna niente, così nella foto i pezzi non ci sono
  let nascostaFra = null
  function nascondi(ms) {
    clearTimeout(nascostaFra)
    scena.classList.toggle('pulita', ms > 0)
    if (ms > 0) nascostaFra = setTimeout(() => scena.classList.remove('pulita'), ms)
  }
}

// (in fondo: prima devono esistere le fasi di Giugnoh e gli attrezzi qui sopra)
if (scena) avvia()
