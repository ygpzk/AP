// Le icone di pzk os a un bit (29.10, Alberto: «rifai icone in svg consumando pochissimo… mantieni stile 8bit»): disegnate
// qui come tracciati SVG (viewBox 16 × 16), riempiti su una tela della misura chiesta e ridotti a pixel acceso/spento
// (niente immagini da scaricare, niente retino: sagome pulite anche a 16 pixel). Un'icona di Alberto che qui non c'è
// (art/chat-*, chat/icone.js) si prende dalla sua webp col retino di Bayer, come riserva. Le bitmap stanno in cache.
//
// Dall'11.11 a colori (la tavolozza a 8 bit di lcd.js, COLORI qui sotto) e ai pixel veri dello schermo (lato × D).
//
//   bitmap(nome, lato) → { w, h, d, px } subito (se è SVG o già in cache), se no null e carica: quando arriva chiama chi s'è
//   messo in ascolto
import { esiste, src } from '../../../chat/icone.js'
import { D, colore } from './lcd.js'

// i tracciati: ogni icona è una lista di percorsi SVG (riempiti), nel quadrato 16 × 16
const SVG = {
  // le app (le piastrelle di telefono.js: APP[].icona)
  'app-chat': ['M2 2h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7l-4 3v-3H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M4 5h8v1H4z M4 7h6v1H4z'],
  'app-profilo': ['M1 3h14v10H1z M3 5h4v4H3z M8 6h5v1H8z M8 8h5v1H8z M3 10h10v1H3z'], // (un tracciato: i dettagli bucano la scheda)
  'app-account': ['M8 1 1 5v1h14V5z M2 7h2v5H2z M5 7h2v5H5z M9 7h2v5H9z M12 7h2v5h-2z M1 13h14v2H1z'],
  'app-shop': ['M1 2h14v4H1z M4 2h2v4H4z M10 2h2v4h-2z M2 7h12v8H2z M7 10h3v5H7z M4 9h2v2H4z'], // (la bottega con la tenda a righe: la borsa sembrava un lucchetto)
  'app-pzkstore': ['M1 10h14v5H1z', 'M7 1h2v6h2l-3 3-3-3h2z'],
  'app-sfide': ['M9 1 3 9h4l-1 6 6-8H8z'],
  'app-quiz': ['M8 1a4 4 0 0 1 4 4c0 2-2 2.5-3 3.5V10H7V8c0-2 3-2 3-3a2 2 0 0 0-4 0H4a4 4 0 0 1 4-4z M7 12h2v2H7z'],
  'app-quest': ['M4 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M5 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z', 'M6 5l8 8-1 1-1-1-1 1-1-1-1 1-2-2 1-1-4-4z'],
  'app-giocatori': ['M5 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z M1 15v-3a4 4 0 0 1 8 0v3z M11.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z M10 15v-2.5a2.5 2.5 0 0 1 5 0V15z'], // (mancava: nel menu non c'era l'icona)
  lente: ['M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1z M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M10.5 9.5l4.5 4.5-1.5 1.5-4.5-4.5z'],
  'app-zaino': ['M4 5h8v10H4z M6 5V3a2 2 0 0 1 4 0v2H9V3a1 1 0 0 0-2 0v2z M6 8h4v3H6z'],
  'app-miniera': ['M2 2c3-1 7 0 10 4l1-1 2 2-5 5-2-2 1-1C6 6 3 5 2 2z M8 8l2 2-6 6-2-2z'],
  'app-foto': ['M1 4h3l1-2h6l1 2h3v10H1z M8 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M8 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
  'app-virtual': ['M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1z M8 4l3 2-1 3H6L5 6z M3 7l2 1-1 3H2z M13 7l-2 1 1 3h2z M6 11h4l1 2-3 1-3-1z'],
  'app-banca': ['M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1z M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3z M7 5h2v1h2v1H9v1h2v1H9v2H7V9H5V8h2V7H5V6h2z'],
  'app-rapina': ['M1 6c2-3 12-3 14 0v3c-2 3-12 3-14 0z M3 7h4v2H3z M9 7h4v2H9z M6 11h4v1H6z'],
  sacco: ['M5 1h6l-2 2H7z M6 4h4c3 2 5 5 5 8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3c0-3 2-6 5-8z M7 7h2v1h1v1H7v1h3v3H9v1H7v-1H6v-1h3v-1H6V8h1z'], // (il bottino: il $ è un buco nel sacco)
  nonna: ['M6 0h4v2H6z', 'M8 2a5 5 0 1 1 0 10A5 5 0 0 1 8 2z M4 6h3v2H4z M9 6h3v2H9z M6 9h4v1H6z', 'M2 16c0-3 3-4 6-4s6 1 6 4z'], // (la cucina: la crocchia, gli occhiali, il sorriso)
  triangolo: ['M8 1l7 13H1z M8 5l-4 7h8z'], // (la calcolatrice: i triangoli)
  bussola: ['M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1z M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3z', 'M8 4l2 4-2 4-2-4z'], // (le coordinate, l'azimut)
  goniometro: ['M1 13a7 7 0 0 1 14 0v1H1z M3 13a5 5 0 0 1 10 0z', 'M7 7h2v6H7z'], // (gli angoli)
  sirena: ['M5 6a3 3 0 0 1 6 0v5H5z M7 6h1v4H7z', 'M3 12h10v3H3z', 'M7 1h2v2H7z', 'M1 3h2l1 2H2z', 'M13 3h2l-1 2h-2z'], // (presi: il lampeggiante)
  'app-lavatrice': ['M2 1h12v14H2z M4 2h3v1H4z M8 8a3 3 0 1 1 0 .1z M8 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  'app-decifratore': ['M3 7h10v8H3z M5 7V5a3 3 0 0 1 6 0v2H9V5a1 1 0 0 0-2 0v2z M7 10h2v3H7z'],
  'wallet-pzk': ['M3 2h10v2H3z', 'M1 4h14v10H1z M2 6h12v7H2z M10 8h4v3h-4z M11 9h1v1h-1z'], // (1.11, il decifratore: il portafoglio con la fibbia)
  chiavetta: ['M1 5h10v6H1z M3 7h5v2H3z', 'M11 6h4v4h-4z M12 7h2v2h-2z'], // (la chiavetta usb: l'etichetta, la presa)
  'app-conversioni': ['M1 3h3v2H3v6h1v2H1z M12 3h3v10h-3v-2h1V5h-1z M5 4h2v8H5z M9 4h2v3H9v2h2v3H9v-2h1V7H9z'],
  'app-calcolatrice': ['M2 1h12v14H2z M4 3h8v3H4z M4 8h2v2H4z M7 8h2v2H7z M10 8h2v2h-2z M4 11h2v2H4z M7 11h2v2H7z M10 11h2v2h-2z'],
  'app-compilatore': ['M11 3a6 6 0 1 0 0 10l-2-2a3 3 0 1 1 0-6z'],
  'app-cucina': ['M2 6h12v8H2z M1 6h14v1H1z M4 3h8l1 3H3z M3 11H1v1h2z M13 11h2v1h-2z'],
  'app-home': ['M8 1 1 8h2v7h4v-4h2v4h4V8h2z'],
  impostazioni: ['M8 1l1 2 2-1 1 2 2 1-1 2 2 1-1 2 1 2-2 1 1 2-2 1-1 2-2-1-1 2-1-2-2 1-1-2-2-1 1-2-2-1 1-2-1-2 2-1-1-2 2-1 1-2 2 1z M8 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'],
  // il bot (la chiocciola) e i suoi umori: la stessa sagoma
  bot: ['M3 12a4 4 0 0 1 8-1c0 1 0 2-1 2H3z M7 10a2 2 0 1 1 0 .1z M11 10c1-2 1-4 2-5l-1 0v-2h1V2h1v1h1v2l-1 0c-1 1-1 3-2 5z M2 13h12v1H2z'],
  'bot-pensa': ['M3 12a4 4 0 0 1 8-1c0 1 0 2-1 2H3z M7 10a2 2 0 1 1 0 .1z M11 10c1-2 1-4 2-5l-1 0v-2h1V2h1v1h1v2l-1 0c-1 1-1 3-2 5z M2 13h12v1H2z M1 3h1v1H1z M3 2h1v1H3z M5 1h1v1H5z'],
  'bot-ride': 'bot', 'bot-arrabbiato': 'bot', 'bot-morto': 'bot', 'bot-occhiolino': 'bot', 'bot-triste': 'bot', 'bot-ricco': 'bot',
  // i minigiochi: le mine e il gratta e vinci, la slot
  gemma: ['M4 2h8l3 4-7 9-7-9z M6 4h4l1 2H5z'],
  mina: ['M8 5a5 5 0 1 1 0 10A5 5 0 0 1 8 5z M7 3h2v2H7z M9 1l2 1 1 2-1 0-1-2z M5 8a2 2 0 0 1 2-1v1a1 1 0 0 0-1 1z'],
  ciliegia: ['M5 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M11 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M6 8 9 2h1l-3 6z M11 8 9 2h1l2 6z'],
  limone: ['M2 8c0-3 3-5 6-5s6 2 6 5-3 5-6 5-6-2-6-5z M13 7h2v2h-2z'],
  sette: ['M3 2h10v2l-5 10H5l5-10H3z'],
  campana: ['M8 1h1v2h-1z M4 10V7a4 4 0 0 1 8 0v3l2 2H2z M7 13h2v2H7z'],
  diamante: ['M4 2h8l3 4-7 9-7-9z M6 4h4l1 2H5z'],
  'chiocciola-oro': 'bot',
  bar: ['M1 5h14v6H1z M3 7h10v2H3z'],
  trifoglio: ['M5 3a3 3 0 1 1 3 3 3 3 0 1 1-3-3z M8 6a3 3 0 1 1 3 3 3 3 0 1 1-3-3z M5 6a3 3 0 1 1 3 3 3 3 0 1 1-3-3z M7 9h2v6H7z'],
  anguria: ['M1 6h14a7 7 0 0 1-14 0z M3 7h10a5 5 0 0 1-10 0z M6 9h1v1H6z M9 10h1v1H9z M7 11h1v1H7z'],
  uva: ['M8 1h1v3H8z M5 4a2 2 0 1 1 0 .1z M9 4a2 2 0 1 1 0 .1z M3 7a2 2 0 1 1 0 .1z M7 7a2 2 0 1 1 0 .1z M11 7a2 2 0 1 1 0 .1z M5 10a2 2 0 1 1 0 .1z M9 10a2 2 0 1 1 0 .1z M7 13a2 2 0 1 1 0 .1z'],
  stella: ['M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z'],
  dado: ['M2 2h12v12H2z M4 4h2v2H4z M10 4h2v2h-2z M7 7h2v2H7z M4 10h2v2H4z M10 10h2v2h-2z'],
  // le cose che compaiono spesso nelle schede
  pzk: ['M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1z M7 4h2v1h2v1H9v1h2v1H9v2H7V9H5V8h2V7H5V6h2z'],
  regalo: ['M1 6h14v3H1z M2 9h12v6H2z M7 6h2v9H7z M4 3a2 2 0 0 1 4 1 2 2 0 0 1 4-1c1 1 0 3-1 3H5c-1 0-2-2-1-3z'],
  clessidra: ['M3 1h10v3l-4 4 4 4v3H3v-3l4-4-4-4z M5 3v1l3 3 3-3V3z'],
  teschio: ['M8 1a6 6 0 0 1 6 6c0 2-1 3-2 4v3H4v-3C3 10 2 9 2 7a6 6 0 0 1 6-6z M5 6a2 2 0 1 1 0 .1z M9 6a2 2 0 1 1 0 .1z M7 10h2v2H7z'],
  cornetto: ['M12 1c2 3 1 7-2 10l-4 4c-2 0-4-2-4-4l4-4c3-3 7-4 6-6z'],
  canna: ['M2 14 13 2l1 1L3 15z M13 2a2 2 0 0 1 2 3l-1 1-2-2z M3 12l1 1v2H2z'],
  // il profilo (os/profilo.js): le classifiche e i progressi, la modifica, le facce chiuse
  trofeo: ['M4 1h8v1h3v3a3 3 0 0 1-3 3h-1a3 3 0 0 1-2 2v2h2v2H5v-2h2v-2a3 3 0 0 1-2-2H4a3 3 0 0 1-3-3V2h3z M2 3v2a2 2 0 0 0 2 2V3z M12 3v4a2 2 0 0 0 2-2V3z'],
  matita: ['M11 1l4 4-9 9-5 1 1-5z M10 4l2 2-6 6-2-2z'],
  lucchetto: ['M3 7h10v8H3z M5 7V5a3 3 0 0 1 6 0v2H9V5a1 1 0 0 0-2 0v2z M7 9h2v3H7z'],
  rider: ['M5 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M11 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M7 12l2-6h3v1h-2l-1 3h3l-1 2z M9 3a2 2 0 1 1 0 .1z'],
  // la cucina (os/cucina.js, 11.11): le webp chiare di burro, uova e parmigiano a un bit uscivano vuote nelle carte di «ordina»
  burro: ['M1 6l3-3h11l-3 3z M1 7h11v6H1z M13 6l2-2v7l-2 2z'], // (il panetto: il sopra, il davanti, il fianco)
  uova: ['M4.5 3C6.5 3 8 6 8 9s-1.5 5-3.5 5S1 12 1 9s1.5-6 3.5-6z M12 6c1.7 0 3 2 3 4.5S13.7 14 12 14s-3-1-3-3.5S10.3 6 12 6z'], // (due uova)
  parmigiano: ['M1 13V9l13-5h1v9z M5 10h2v2H5z M10 8h2v2h-2z'], // (lo spicchio coi buchi)
}


// (11.11, Alberto: «colori a 8bit su tutto») i colori delle icone: uno per tracciato (o uno per tutti), presi dalla
// tavolozza a 8 bit di lcd.js. Chi non ha colore resta dell'inchiostro del tema, come prima
const COLORI = {
  'app-chat': '#33ccff', 'app-profilo': '#ffcc66', 'app-account': '#99ccff', 'app-shop': '#ff6633', 'app-pzkstore': ['#3366ff', '#33cc33'],
  'app-sfide': '#ffcc00', 'app-quiz': '#cc66ff', 'app-quest': ['#ffcc33', '#cc9966'], 'app-giocatori': '#66ccff', lente: '#99ccff',
  'app-zaino': '#cc6633', 'app-miniera': '#cccccc', 'app-foto': '#ff6699', 'app-virtual': '#ffffff', 'app-banca': '#ffcc00',
  'app-rapina': '#cc3333', sacco: '#cc9966', nonna: ['#cccccc', '#ffcc99', '#cc3366'], triangolo: '#33cc99', bussola: ['#cccccc', '#ff3300'],
  goniometro: ['#66ccff', '#ff3300'], sirena: ['#ff3300', '#999999', '#ffcc00', '#ffcc00', '#ffcc00'], 'app-lavatrice': '#cccccc',
  'app-decifratore': '#ffcc00', 'wallet-pzk': ['#996633', '#cc6633'], chiavetta: ['#3366ff', '#cccccc'], 'app-conversioni': '#33cc33',
  'app-calcolatrice': '#999999', 'app-compilatore': '#3399ff', 'app-cucina': '#cccccc', 'app-home': '#ff9933', impostazioni: '#999999',
  bot: '#cc9966', 'bot-pensa': '#cc9966', 'bot-ride': '#cc9966', 'bot-arrabbiato': '#ff6633', 'bot-morto': '#999999', 'bot-occhiolino': '#cc9966',
  'bot-triste': '#6699cc', 'bot-ricco': '#ffcc00', 'chiocciola-oro': '#ffcc00',
  gemma: '#33ccff', mina: '#666666', ciliegia: '#ff3333', limone: '#ffff33', sette: '#ff3300', campana: '#ffcc00', diamante: '#66ffff',
  bar: '#ff3300', trifoglio: '#33cc33', anguria: '#ff3366', uva: '#9933cc', stella: '#ffcc00', dado: '#ffffff',
  pzk: '#ffcc00', regalo: '#ff3366', clessidra: '#cc9966', teschio: '#ffffff', cornetto: '#ff3333', canna: '#996633',
  trofeo: '#ffcc00', matita: '#ffcc00', lucchetto: '#ffcc00', rider: '#ff6633', burro: '#ffff99', uova: '#ffffcc', parmigiano: '#ffcc33',
}

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
const cache = new Map() // «nome/lato» → bitmap | 'carico'
const immagini = new Map() // nome → Image
const ascolti = new Set()
export const ascolta = (fn) => { ascolti.add(fn); return () => ascolti.delete(fn) }

const tracciati = (nome) => { let v = SVG[nome]; while (typeof v === 'string') v = SVG[v]; return v ?? null }
export const vettoriale = (nome) => !!tracciati(nome)

/** Dai pixel di una tela (rgba) agli indici della tavolozza: trasparente sotto metà, e il bordino d'inchiostro attorno alle
 *  forme colorate (le icone gialle sul fondo arancione si perdevano). */
function aIndici(dati, L, { bordo = true } = {}) {
  const px = new Uint8Array(L * L)
  for (let i = 0; i < L * L; i++) if (dati[i * 4 + 3] > 127) px[i] = colore(dati[i * 4], dati[i * 4 + 1], dati[i * 4 + 2])
  if (bordo) {
    const pieno = (x, y) => x >= 0 && y >= 0 && x < L && y < L && px[y * L + x] > 1
    const out = px.slice()
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (!px[y * L + x] && (pieno(x - 1, y) || pieno(x + 1, y) || pieno(x, y - 1) || pieno(x, y + 1))) out[y * L + x] = 1
    return out
  }
  return px
}

/** La bitmap di un'icona SVG, a colori e ai pixel veri (lato × D): ogni tracciato col suo colore, o l'inchiostro. */
function daSvg(nome, lato) {
  const L = lato * D, cv = document.createElement('canvas')
  cv.width = cv.height = L
  const g = cv.getContext('2d', { willReadFrequently: true })
  g.scale(L / 16, L / 16)
  const col = COLORI[nome], T = tracciati(nome)
  T.forEach((d, i) => { const c = Array.isArray(col) ? col[i] ?? col[col.length - 1] : col; g.fillStyle = c ?? '#000'; g.fill(new Path2D(d), 'evenodd') })
  const dati = g.getImageData(0, 0, L, L).data
  let px
  if (col) px = aIndici(dati, L)
  else { px = new Uint8Array(L * L); for (let i = 0; i < L * L; i++) if (dati[i * 4 + 3] > 127) px[i] = 1 } // (senza colore: l'inchiostro, come prima)
  return { w: lato, h: lato, d: D, px }
}

function carica(nome) {
  let im = immagini.get(nome)
  if (im) return im
  im = new Image()
  im.decoding = 'async'
  im.src = src(nome)
  im.onload = () => { for (const k of [...cache.keys()]) if (cache.get(k) === 'carico' && k.startsWith(nome + '/')) cache.delete(k); for (const f of ascolti) f(nome) }
  immagini.set(nome, im)
  return im
}
/** La bitmap dell'icona, lato × lato (pixel d'impaginazione), a colori: l'SVG se c'è, se no la webp di Alberto coi suoi colori. */
export function bitmap(nome, lato = 16) {
  const k = `${nome}/${lato}`
  const c = cache.get(k)
  if (c && c !== 'carico') return c
  if (vettoriale(nome)) { const b = daSvg(nome, lato); cache.set(k, b); return b }
  if (!esiste(nome)) return null
  const im = carica(nome)
  if (!im.complete || !im.naturalWidth) { cache.set(k, 'carico'); return null }
  const L = lato * D, cv = document.createElement('canvas')
  cv.width = cv.height = L
  const g = cv.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'
  const s = Math.min(L / im.naturalWidth, L / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s
  g.drawImage(im, (L - w) / 2, (L - h) / 2, w, h)
  const b = { w: lato, h: lato, d: D, px: aIndici(g.getImageData(0, 0, L, L).data, L, { bordo: false }) } // (le webp di Alberto hanno già il bordo bianco)
  cache.set(k, b)
  return b
}

// ── le foto (29.10: il quiz e la galleria): rimpicciolite a w × h (ai pixel veri, w × D), a colori a 8 bit col retino di
// Bayer; in cache per indirizzo e misura. → la bitmap, «carico» (poi() quando arriva) o «no» (non si carica, o il browser
// non la lascia leggere) ──
const foto_ = new Map() // url/w/h → bitmap | 'carico' | 'no'
export function foto(url, w, h, poi = () => {}) {
  const k = `${url}/${w}/${h}`
  const c = foto_.get(k)
  if (c) return c
  foto_.set(k, 'carico')
  const im = new Image()
  im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer'
  im.onload = () => {
    try {
      const s = Math.min(w / im.naturalWidth, h / im.naturalHeight)
      const fw = Math.max(1, Math.round(im.naturalWidth * s)), fh = Math.max(1, Math.round(im.naturalHeight * s)), PWf = fw * D, PHf = fh * D
      const cv = document.createElement('canvas')
      cv.width = PWf; cv.height = PHf
      const g = cv.getContext('2d', { willReadFrequently: true })
      g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, PWf, PHf)
      const d = g.getImageData(0, 0, PWf, PHf).data, px = new Uint8Array(PWf * PHf)
      for (let y = 0; y < PHf; y++) for (let x = 0; x < PWf; x++) {
        const o = (y * PWf + x) * 4, t = (BAYER[y & 3][x & 3] / 16 - 0.47) * 40 // (il retino fra i 256 colori: le sfumature senza strisce)
        const cl = (v) => Math.max(0, Math.min(255, v + t))
        px[y * PWf + x] = colore(cl(d[o]), cl(d[o + 1]), cl(d[o + 2]))
      }
      foto_.set(k, { w: fw, h: fh, d: D, px })
    } catch { foto_.set(k, 'no') } // (la foto non si lascia leggere: niente)
    poi()
  }
  im.onerror = () => { foto_.set(k, 'no'); poi(); setTimeout(() => { if (foto_.get(k) === 'no') foto_.delete(k) }, 30000) } // (11.11: la rete caduta un momento lasciava il «?» per sempre; dopo 30 s il disegno dopo la richiede. Quella che il browser non lascia leggere, il catch, resta «no»)
  im.src = url
  return 'carico'
}
