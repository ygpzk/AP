// 05 · Cartolina viva. Una vera cartolina illustrata 1200 × 630, costruita adesso con i dati veri di api.adesso():
// a sinistra il «fronte» alla vecchia maniera («Saluti da PZKKO» a lettere grandi, dentro la copertina del brano),
// a destra il «retro» da spedire (francobollo dentellato con l'avatar, timbro postale con la data vera, il messaggio a
// penna, l'indirizzo, il timbro rosso). Si scarica in SVG o PNG e si condivide col foglio di condivisione.
// Il PNG si fa da un canvas che disegna lo SVG come immagine: lì dentro i font della pagina non arrivano, quindi lo SVG
// «da file» porta con sé i suoi @font-face (i woff2 del sito come data URL), l'avatar e la copertina come data URL.
// Nell'anteprima invece lo SVG sta in linea (usa i font della pagina) e ha qualche animazione e due scherzi al clic.
import { esc, ferma, ora as oraIt, notte, semi, caso } from '../utils.js'
import { mescola, luminanza, inchiostro } from '../colori.js'

const T = {
  it: {
    pronta: 'pronta',
    preparo: 'preparo…',
    svg: 'Scarica SVG',
    png: 'Scarica PNG',
    condividi: 'Condividi',
    nota: 'La cartolina si costruisce qui, con i dati di adesso. Il PNG è 1200 × 630, pronto per una storia o per un messaggio. Tocca la chiocciola, o il timbro.',
    senza: 'niente da condividere',
    fatto: 'fatto',
    offline: 'offline',
    online: 'online',
    inPausa: 'in pausa',
    nonDisturbare: 'non disturbare',
    ufficio: 'in ufficio',
    giro: 'in giro per il mondo',
    saluti: 'Saluti da',
    cartolina: 'CARTOLINA POSTALE',
    sotto: 'carte postale · post card · posta lenta',
    francoSu: 'POSTA LENTA',
    franco: '€ 0,00',
    leccato: 'leccato a mano',
    poste: 'POSTE PZKKO',
    luogoTimbro: { ufficio: 'UFFICIO', giro: 'IN GIRO', '': 'DAL MURO' },
    mesi: ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'],
    ore: 'ore',
    cari: 'Cari tutti,',
    statoFrase: {
      online: (l) => `qui pzkko è online${l ? `, ${l}` : ''}.`,
      idle: (l) => `pzkko è in pausa${l ? `, ${l}` : ''}: torna subito (forse).`,
      dnd: (l) => `pzkko è in non disturbare${l ? `, ${l}` : ''}. Shh.`,
      offline: (l) => `pzkko è offline${l ? `, ${l}` : ''}: la chiocciola dorme.`,
    },
    gioca: (g) => `sta giocando a ${g}.`,
    inCuffia: 'In cuffia:',
    di: 'di',
    silenzio: { on: 'In cuffia: niente. Si sente il frigo.', off: 'In cuffia: silenzio stampa.' },
    baci: 'Baci dal muro,',
    firma: 'la chiocciola',
    spett: 'Spett.le',
    indirizzo: ['chi sta guardando', 'lo schermo, ovunque sia', '00404 INTERNET (IT)'],
    gomma: {
      online: ['PRIORITARIA', '(ma con calma)'],
      idle: ['TORNO SUBITO', '(forse)'],
      dnd: ['RISERVATA', 'non disturbare'],
      offline: ['ASSENTE', '(ripassare domani)'],
    },
    repertorio: 'foto di repertorio',
    bordo: 'EDIZIONI PZKKO · CARTOLINA FATTA DAL VIVO · VIETATO NON CONDIVIDERLA',
    ripeti: 'timbra di nuovo',
    chiocciola: 'la chiocciola: dimmi qualcosa',
    timbri: (n) => (n >= 7 ? 'basta timbri!' : `timbrata ×${n}`),
    battute: [
      'sono lenta, ma arrivo',
      'il francobollo? leccato io',
      'prioritaria: entro il 2031',
      'non scuotere: c’è la bava',
      'saluta tua nonna da parte mia',
      'il guscio è in affitto',
      'ho perso il treno. a piedi.',
    ],
    etichetta: (s) => `Cartolina: ${s}`,
  },
  en: {
    pronta: 'ready',
    preparo: 'preparing…',
    svg: 'Download SVG',
    png: 'Download PNG',
    condividi: 'Share',
    nota: 'The postcard is built here, with right-now data. The PNG is 1200 × 630, ready for a story or a message. Poke the snail, or the postmark.',
    senza: 'nothing to share',
    fatto: 'done',
    offline: 'offline',
    online: 'online',
    inPausa: 'idle',
    nonDisturbare: 'do not disturb',
    ufficio: 'at the office',
    giro: 'somewhere in the world',
    saluti: 'Greetings from',
    cartolina: 'POST CARD',
    sotto: 'cartolina postale · carte postale · snail mail',
    francoSu: 'SNAIL MAIL',
    franco: '€ 0.00',
    leccato: 'hand-licked',
    poste: 'PZKKO POST',
    luogoTimbro: { ufficio: 'OFFICE', giro: 'ON THE ROAD', '': 'THE WALL' },
    mesi: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    ore: 'at',
    cari: 'Dear all,',
    statoFrase: {
      online: (l) => `pzkko is online here${l ? `, ${l}` : ''}.`,
      idle: (l) => `pzkko is idle${l ? `, ${l}` : ''}: back soon (maybe).`,
      dnd: (l) => `pzkko is on do not disturb${l ? `, ${l}` : ''}. Shh.`,
      offline: (l) => `pzkko is offline${l ? `, ${l}` : ''}: the snail is asleep.`,
    },
    gioca: (g) => `playing ${g}.`,
    inCuffia: 'In my headphones:',
    di: 'by',
    silenzio: { on: 'Headphones: nothing. Just the fridge.', off: 'Headphones: radio silence.' },
    baci: 'Love from the wall,',
    firma: 'the snail',
    spett: 'To:',
    indirizzo: ['whoever is looking', 'at this screen, wherever', 'INTERNET 00404 (IT)'],
    gomma: {
      online: ['PRIORITY', '(eventually)'],
      idle: ['BACK SOON', '(maybe)'],
      dnd: ['PRIVATE', 'do not disturb'],
      offline: ['AWAY', '(try tomorrow)'],
    },
    repertorio: 'stock photo',
    bordo: 'PZKKO EDITIONS · POSTCARD MADE LIVE · NOT SHARING IT IS FORBIDDEN',
    ripeti: 'stamp it again',
    chiocciola: 'the snail: say something',
    timbri: (n) => (n >= 7 ? 'enough stamps!' : `stamped ×${n}`),
    battute: [
      'slow, but I get there',
      'the stamp? I licked it',
      'priority mail: by 2031',
      'do not shake: slime inside',
      'say hi to your nan for me',
      'the shell is rented',
      'missed the train. walking.',
    ],
    etichetta: (s) => `Postcard: ${s}`,
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]

// ── i font: in pagina li dà il CSS (Anton, Special Elite, Permanent Marker) più due nostri; nel file vanno dentro ──
const FONTI = [
  ['Anton', '/fonts/anton.woff2'],
  ['Special Elite', '/fonts/special-elite.woff2'],
  ['Permanent Marker', '/fonts/permanent-marker.woff2'],
  ['Cartolina Saluti', '/fonts/shrikhand.woff2'],
  ['Cartolina Penna', '/fonts/caveat.woff2'],
]
const F = {
  fa: 'Anton, Impact, \'Arial Narrow\', sans-serif',
  mac: '\'Special Elite\', \'Courier New\', monospace',
  marker: '\'Permanent Marker\', \'Comic Sans MS\', cursive',
  saluti: '\'Cartolina Saluti\', Georgia, serif',
  penna: '\'Cartolina Penna\', \'Segoe Print\', \'Comic Sans MS\', cursive',
}
const INK = '#1d1820', ROSSO = '#b3121f', PENNA = '#1446a0', CARTA = '#f1e6cd', CREMA = '#fff6e2'

const cacheImg = new Map()
async function dataUrl(url, tipo = 'image/png') {
  if (!url) return null
  if (cacheImg.has(url)) return cacheImg.get(url)
  const p = (async () => {
    const r = await fetch(url, { cache: 'force-cache' })
    if (!r.ok) throw new Error(`${r.status}`)
    const b = await r.blob()
    return await new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(String(fr.result))
      fr.onerror = () => rej(fr.error)
      fr.readAsDataURL(b.type && b.type !== 'application/octet-stream' ? b : new Blob([b], { type: tipo }))
    })
  })().catch(() => null)
  cacheImg.set(url, p)
  if (cacheImg.size > 24) cacheImg.delete(cacheImg.keys().next().value)
  return p
}

let fontiPagina = null, fontiFatti = false
function fontiInPagina() {
  if (fontiPagina) return fontiPagina
  fontiPagina = (async () => {
    if (!document.fonts) return
    for (const [fam, url] of FONTI.slice(3)) {
      if (![...document.fonts].some((f) => f.family.replace(/["']/g, '') === fam)) {
        try { document.fonts.add(new FontFace(fam, `url(${url}) format("woff2")`, { display: 'swap' })) } catch {}
      }
    }
    await Promise.race([
      Promise.all(FONTI.map(([fam]) => document.fonts.load(`30px "${fam}"`).catch(() => null))),
      new Promise((r) => setTimeout(r, 2500)),
    ])
  })().catch(() => {})
  return fontiPagina
}

let fontiFile = null
const fontiPerFile = () => (fontiFile ||= Promise.all(FONTI.map(async ([fam, url]) => {
  const d = await dataUrl(url, 'font/woff2')
  return d ? `@font-face{font-family:"${fam}";src:url(${d}) format("woff2");font-display:block}` : ''
})).then((a) => a.join('')))

// la grana della carta: un quadratino di rumore fatto una volta, come PNG (vale in pagina e nel file)
let grana = ''
function granaCarta() {
  if (grana) return grana
  try {
    const n = 140, c = document.createElement('canvas')
    c.width = c.height = n
    const x = c.getContext('2d'), img = x.createImageData(n, n), r = caso(semi('carta'))
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r()
      const scuro = v < 0.5
      img.data[i] = scuro ? 70 : 255; img.data[i + 1] = scuro ? 50 : 250; img.data[i + 2] = scuro ? 25 : 235
      img.data[i + 3] = Math.round((scuro ? v * 2 : (v - 0.5) * 2) ** 3 * 60)
    }
    x.putImageData(img, 0, 0)
    grana = c.toDataURL('image/png')
  } catch { grana = '' }
  return grana
}

// le misure dei testi, coi font veri quando ci sono
let tela = null
const ctxFont = (font) => { tela ||= document.createElement('canvas').getContext('2d'); tela.font = font; return tela }
const larga = (testo, font) => ctxFont(font).measureText(testo).width
const taglia = (testo, font, max) => {
  const s = String(testo || '')
  if (larga(s, font) <= max) return s
  let a = s
  while (a.length > 1 && larga(`${a}…`, font) > max) a = a.slice(0, -1)
  return `${a.trimEnd()}…`
}
/** A capo con le misure vere; se le righe non bastano, l'ultima si taglia coi puntini. */
function fitta(testo, font, max, n) {
  const parole = String(testo || '').split(/\s+/).filter(Boolean)
  const out = []
  let riga = ''
  for (const p of parole) {
    const prova = riga ? `${riga} ${p}` : p
    if (!riga || larga(prova, font) <= max) riga = prova
    else { out.push(riga); riga = p }
  }
  if (riga) out.push(riga)
  if (out.length <= n) return out
  const resto = out.slice(n - 1).join(' ')
  return [...out.slice(0, n - 1), taglia(`${resto}`, font, max).replace(/…?$/, '…')]
}

const statoParola = (s, lang) => (s === 'online' ? t(lang, 'online') : s === 'idle' ? t(lang, 'inPausa') : s === 'dnd' ? t(lang, 'nonDisturbare') : t(lang, 'offline'))
const luogo = (a, lang) => (a.luogo === 'ufficio' ? t(lang, 'ufficio') : a.luogo === 'giro' ? t(lang, 'giro') : '')
const chiaveStato = (a) => (['online', 'idle', 'dnd'].includes(a.status) ? a.status : 'offline')

/** I colori della cartolina dai cinque della copertina (o dal muro, senza musica). */
function tinte(colori, conMusica) {
  const base = conMusica ? colori : ['#ff7a3d', '#2f8fbf', '#ffd23f', '#fff1c9', '#1f3b57']
  const ord = [...base].sort((x, y) => luminanza(x) - luminanza(y))
  let scuro = ord[0], chiaro = ord[ord.length - 1]
  if (luminanza(scuro) > 0.08) scuro = mescola(scuro, '#120c18', 0.55)
  if (luminanza(chiaro) < 0.45) chiaro = mescola(chiaro, '#fff8e6', 0.6)
  const vivo = base[0], vivo2 = base[1] || base[0]
  return {
    scuro, chiaro, vivo, vivo2,
    cieloSu: mescola(chiaro, '#fff8e6', 0.25),
    cieloGiu: mescola(vivo, chiaro, 0.3),
    guscio: mescola(vivo2, CREMA, 0.25),
    franco: mescola(vivo, '#ffffff', 0.12),
    palazzi: mescola(scuro, vivo2, 0.18),
  }
}

// ── i pezzi disegnati ──────────────────────────────────────────────────────────────────────────────────────────────
const nota = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="cart-nota"><ellipse cx="0" cy="0" rx="7" ry="5.2" transform="rotate(-20)" fill="${INK}"/><path d="M6 -2 V-30 Q 14 -26 18 -18" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g></g>`

function spirale(cx, cy, r0) {
  const p = []
  for (let i = 0; i <= 90; i++) {
    const th = (i / 90) * Math.PI * 2 * 2.6 + 0.6, r = r0 * (1 - i / 100)
    p.push(`${(cx + r * Math.cos(th)).toFixed(1)} ${(cy + r * Math.sin(th)).toFixed(1)}`)
  }
  return `M${p.join(' L')}`
}

/** La chiocciola, che fa quello che fa pzkko. Origine: in basso a sinistra del piede. */
function chiocciola(st, conMusica, dove, guscio) {
  const dorme = st === 'offline'
  const ant = dorme
    ? `<path d="M122 -50 Q 114 -66 104 -72" /><path d="M136 -50 Q 146 -64 158 -68" />`
    : `<path d="M122 -50 Q 118 -70 112 -86" /><path d="M136 -50 Q 142 -68 148 -84" />`
  const occhi = dorme
    ? `<path d="M98 -73 q 6 4 12 0 M152 -70 q 6 4 12 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<g class="cart-occhi"><circle cx="112" cy="-88" r="7" fill="${CREMA}" stroke="${INK}" stroke-width="2.6"/><circle cx="148" cy="-86" r="7" fill="${CREMA}" stroke="${INK}" stroke-width="2.6"/><circle cx="114" cy="-88" r="2.8" fill="${INK}"/><circle cx="150" cy="-86" r="2.8" fill="${INK}"/></g>`
  const bocca = dorme ? `<path d="M134 -28 q 6 3 12 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    : st === 'dnd' ? `<path d="M134 -28 h 12" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
      : `<path d="M132 -32 Q 140 -22 148 -32" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
  let extra = ''
  if (dove === 'ufficio') extra += `<path d="M112 -16 l8 0 l3 14 l-7 8 l-7 -8 z" fill="${ROSSO}" stroke="${INK}" stroke-width="2"/><path d="M111 -18 h10" stroke="${INK}" stroke-width="3"/>`
  if (dove === 'giro') extra += `<g transform="translate(-54 0) rotate(-4)"><rect x="-26" y="-40" width="52" height="38" rx="6" fill="#a8642a" stroke="${INK}" stroke-width="2.8"/><path d="M-10 -40 v-8 h20 v8" fill="none" stroke="${INK}" stroke-width="2.8"/><path d="M-26 -24 h52" stroke="${INK}" stroke-width="2" opacity=".5"/><circle cx="-12" cy="-14" r="7" fill="${CREMA}" stroke="${INK}" stroke-width="1.6"/><rect x="2" y="-36" width="18" height="11" rx="2" fill="#ffd23f" stroke="${INK}" stroke-width="1.4" transform="rotate(8 11 -30)"/><path d="M-24 -2 l4 4 M20 -2 l4 4" stroke="${INK}" stroke-width="2.4"/></g>`
  if (conMusica && !dorme) {
    extra += `<path d="M110 -46 C 106 -84, 156 -86, 154 -46" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="102" y="-54" width="12" height="20" rx="4" fill="${ROSSO}" stroke="${INK}" stroke-width="2.4"/><rect x="148" y="-54" width="12" height="20" rx="4" fill="${ROSSO}" stroke="${INK}" stroke-width="2.4"/>`
    extra += `<g class="cart-note">${nota(190, -34, 1)}${nota(216, -64, 0.85)}</g>`
  }
  if (dorme) extra += `<g class="cart-zzz" font-family="${F.penna}" font-weight="700" fill="${INK}"><text x="166" y="-34" font-size="26">z</text><text x="186" y="-56" font-size="34">Z</text><text x="210" y="-82" font-size="42">Z</text></g>`
  if (st === 'idle') extra += `<g transform="translate(176 0)"><path d="M0 -26 h26 l-3 24 h-20 z" fill="${CREMA}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M26 -20 q 9 0 8 7 q -1 6 -9 5" fill="none" stroke="${INK}" stroke-width="2.6"/><g class="cart-fumo" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M8 -32 q -5 -8 0 -14 q 5 -6 0 -12"/><path d="M17 -32 q -5 -8 0 -14 q 5 -6 0 -12"/></g></g>`
  if (st === 'dnd') extra += `<g transform="translate(${dove === 'giro' ? 250 : -40} 0)"><path d="M0 0 V-40" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-56" r="20" fill="${ROSSO}" stroke="${INK}" stroke-width="2.6"/><rect x="-12" y="-60" width="24" height="8" rx="1.5" fill="${CREMA}"/></g>`
  return `<g class="cart-chiocciola">
    <path d="M-60 2 Q -30 -4 0 -1" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>
    <path d="M-60 2 Q -30 -4 0 -1" fill="none" stroke="#9fd4ff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>
    <g class="cart-corpo">
      <path d="M0 0 C 30 3, 100 3, 128 0 C 144 -2, 154 -12, 154 -28 C 154 -46, 142 -56, 128 -56 C 114 -56, 106 -44, 106 -32 L 104 -16 C 80 -13, 40 -11, 10 -9 C 2 -8, -5 -4, 0 0 Z" fill="${CREMA}" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>
      <circle cx="144" cy="-38" r="4.5" fill="#ff8fa3" opacity=".55"/>
      ${bocca}
      <g class="cart-antenne"><g fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round">${ant}</g>${occhi}</g>
      <circle cx="60" cy="-52" r="46" fill="${guscio}" stroke="${INK}" stroke-width="3.6"/>
      <path d="${spirale(60, -52, 40)}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M28 -78 A 40 40 0 0 1 64 -96" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>
      ${extra}
    </g>
  </g>`
}

/** I palazzi di periferia dietro le lettere, con le finestre accese se pzkko c'è. */
function periferia(x0, x1, base, colore, accese, sera) {
  const r = caso(semi('periferia'))
  let x = x0 - 6, out = ''
  while (x < x1) {
    const w = 34 + Math.floor(r() * 42), h = 50 + Math.floor(r() * 74)
    out += `<rect x="${x}" y="${base - h}" width="${w}" height="${h + 2}" fill="${colore}"/>`
    if (r() < 0.45) out += `<path d="M${x + w * 0.6} ${base - h} v-${12 + Math.floor(r() * 14)} m-6 4 h12" stroke="${colore}" stroke-width="2.4" fill="none"/>`
    for (let fy = base - h + 10; fy < base - 10; fy += 14) {
      for (let fx = x + 6; fx < x + w - 8; fx += 11) {
        const on = r() < (accese ? (sera ? 0.5 : 0.3) : 0.05)
        out += `<rect x="${fx}" y="${fy}" width="5" height="7" fill="${on ? '#ffd65a' : '#000'}" opacity="${on ? 0.95 : 0.22}"/>`
      }
    }
    x += w + Math.floor(r() * 4)
  }
  return out
}

const nuvola = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${CREMA}" opacity=".92"><circle cx="0" cy="0" r="18"/><circle cx="22" cy="-10" r="24"/><circle cx="48" cy="-2" r="19"/><rect x="-6" y="-2" width="60" height="18" rx="9"/></g>`

/** La cartolina intera. `d` sono i dati già pronti; `perFile` = lo SVG che si scarica (font dentro, niente scherzi). */
function svg(d, perFile = false) {
  const { a, lang, c, avatar, arte, fontiCss } = d
  const m = a.track
  const st = chiaveStato(a)
  const dove = a.luogo === 'ufficio' || a.luogo === 'giro' ? a.luogo : ''
  const lg = luogo(a, lang)
  const statoTesto = `${statoParola(a.status, lang)}${lg ? ` · ${lg}` : ''}`
  const quando = new Date()
  const sera = notte()
  const id = (n) => `cart-${n}`
  const P = { x: 28, y: 28, w: 636, h: 574 }

  // — il fronte —
  const rays = Array.from({ length: 22 }, (_, i) => {
    const a0 = (i / 22) * Math.PI * 2, a1 = a0 + Math.PI / 22, R = 900, cx = 346, cy = 560
    return i % 2 ? '' : `<path d="M${cx} ${cy} L${(cx + R * Math.cos(a0)).toFixed(0)} ${(cy + R * Math.sin(a0)).toFixed(0)} L${(cx + R * Math.cos(a1)).toFixed(0)} ${(cy + R * Math.sin(a1)).toFixed(0)} Z"/>`
  }).join('')
  const astro = sera
    ? `<g><circle cx="574" cy="112" r="34" fill="#fff4c8"/><circle cx="590" cy="100" r="30" fill="${c.cieloSu}"/>${[[470, 70], [520, 150], [612, 176], [430, 128], [640, 66]].map(([x, y], i) => `<path d="M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z" fill="#fff8d6" opacity="${0.6 + (i % 3) * 0.15}"/>`).join('')}</g>`
    : `<g><circle cx="578" cy="114" r="62" fill="#ffe680" opacity=".35"/><circle cx="578" cy="114" r="42" fill="#ffd23f" stroke="#f0a020" stroke-width="3"/></g>`
  const W = 552, X = 56, BASE = 392, FS = 236
  const saluti = t(lang, 'saluti')
  const fsSal = Math.max(44, Math.min(72, Math.floor(72 * 500 / (larga(saluti, `72px ${F.saluti}`) || 500))))
  const lettere = (extra) => `<text x="${X}" y="${BASE}" font-family="${F.fa}" font-size="${FS}" textLength="${W}" lengthAdjust="spacingAndGlyphs" ${extra}>PZKKO</text>`
  const estruso = Array.from({ length: 9 }, (_, i) => `<g transform="translate(${(9 - i) * 1.4} ${(9 - i) * 1.6})">${lettere(`fill="${c.scuro}" stroke="${c.scuro}" stroke-width="10" stroke-linejoin="round"`)}</g>`).join('')
  const dentro = m && arte
    ? `<pattern id="${id('dentro')}" patternUnits="userSpaceOnUse" x="${X}" y="${BASE - 380}" width="${W}" height="${W}"><image href="${arte}" width="${W}" height="${W}" preserveAspectRatio="xMidYMid slice"/></pattern>`
    : `<pattern id="${id('dentro')}" patternUnits="userSpaceOnUse" x="${X}" y="${BASE - 210}" width="84" height="84"><rect width="84" height="84" fill="#8c8a86"/>${avatar ? `<image href="${avatar}" width="84" height="84"/>` : `<path d="M0 8 H64 M0 24 H64 M0 40 H64 M0 56 H64" stroke="#6d6b68" stroke-width="3"/>`}</pattern>`

  // il nastro con lo stato
  const fNastro = `28px ${F.fa}`
  const testoNastro = statoTesto.toUpperCase()
  let tw = larga(testoNastro, fNastro) || testoNastro.length * 13
  const maxNastro = 360
  const tl = tw > maxNastro ? maxNastro : 0
  if (tl) tw = maxNastro
  const NW = Math.max(250, tw + 76), NCX = 262, NCY = 410, NL = NCX - NW / 2, NR = NCX + NW / 2
  const puntino = st === 'online' ? '#4be08a' : st === 'idle' ? '#ffd23f' : st === 'dnd' ? INK : '#a49d92'
  const nastro = `<g>
    <path d="M${NL - 38} ${NCY - 10} H${NL + 12} V${NCY + 34} H${NL - 38} L${NL - 22} ${NCY + 12} Z" fill="#7d0c16"/>
    <path d="M${NR + 38} ${NCY - 10} H${NR - 12} V${NCY + 34} H${NR + 38} L${NR + 22} ${NCY + 12} Z" fill="#7d0c16"/>
    <path d="M${NL} ${NCY + 23} L${NL + 12} ${NCY + 34} V${NCY + 23} Z M${NR} ${NCY + 23} L${NR - 12} ${NCY + 34} V${NCY + 23} Z" fill="#4a060c"/>
    <rect x="${NL}" y="${NCY - 23}" width="${NW}" height="46" fill="${ROSSO}"/>
    <path d="M${NL} ${NCY - 17} H${NR} M${NL} ${NCY + 17} H${NR}" stroke="${CREMA}" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="6 5"/>
    <circle cx="${NCX - tw / 2 - 12}" cy="${NCY}" r="8" fill="${puntino}" stroke="${CREMA}" stroke-width="2.6"/>
    ${st === 'dnd' ? `<rect x="${NCX - tw / 2 - 17}" y="${NCY - 1.6}" width="10" height="3.2" fill="${CREMA}"/>` : ''}
    <text x="${NCX + 10}" y="${NCY + 11}" text-anchor="middle" font-family="${F.fa}" font-size="28" fill="${CREMA}" letter-spacing=".5" ${tl ? `textLength="${tl - 20}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(testoNastro)}</text>
  </g>`

  // la foto attaccata: la copertina (o l'avatar, «foto di repertorio»)
  const fotoImg = m && arte ? arte : avatar
  const didascalia = m && m.inizio && m.fine && m.fine > m.inizio
    ? `${ferma(Math.min(m.fine - m.inizio, Math.max(0, quando - m.inizio)))} / ${ferma(m.fine - m.inizio)}`
    : m ? '' : t(lang, 'repertorio')
  const polaroid = `<g transform="translate(474 372) rotate(7)">
    <g filter="url(#${id('ombra')})"><rect width="178" height="216" fill="#fdfbf4"/></g>
    <rect x="10" y="10" width="158" height="158" fill="${c.scuro}"/>
    ${fotoImg ? `<image href="${fotoImg}" x="10" y="10" width="158" height="158" preserveAspectRatio="xMidYMid slice"/>` : ''}
    <rect x="10" y="10" width="158" height="158" fill="url(#${id('lucida')})"/>
    ${m ? `<g transform="translate(22 199)">${nota(0, 0, 0.62).replace('class="cart-nota"', '')}</g>` : ''}
    <text x="${m ? 98 : 89}" y="203" text-anchor="middle" font-family="${F.penna}" font-size="${m ? 28 : 25}" font-weight="700" fill="${PENNA}">${esc(didascalia)}</text>
    <rect x="-18" y="-10" width="62" height="22" transform="rotate(-32 12 0)" fill="#eadfb8" fill-opacity=".82"/>
    <rect x="140" y="-12" width="62" height="22" transform="rotate(28 170 0)" fill="#eadfb8" fill-opacity=".82"/>
  </g>`

  const fronte = `<g>
    <rect x="18" y="18" width="656" height="594" rx="5" fill="#fffaf0"/>
    <g clip-path="url(#${id('pannello')})">
      <rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" fill="url(#${id('cielo')})"/>
      <g fill="#ffffff" opacity=".13">${rays}</g>
      ${astro}
      ${nuvola(84, 206, 1.1)}${nuvola(420, 168, 0.8)}${nuvola(250, 92, 0.55)}
      <g>${periferia(P.x, P.x + P.w, 548, c.palazzi, a.online, sera)}</g>
      <rect x="${P.x}" y="546" width="${P.w}" height="60" fill="#cfc4ae"/>
      <g stroke="#9c917c" stroke-width="1.4">${Array.from({ length: 8 }, (_, i) => `<path d="M${P.x} ${552 + i * 7} H${P.x + P.w}"/>`).join('')}</g>
      <rect x="${P.x}" y="544" width="${P.w}" height="5" fill="#8f846f"/>
      <text x="330" y="590" font-family="${F.marker}" font-size="26" fill="${ROSSO}" opacity=".75" transform="rotate(-6 330 590)">pzk</text>
      <rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" fill="url(#${id('lino')})"/>
      <g transform="translate(-3 4)" opacity=".35"><g transform="rotate(-6 70 118)"><text x="70" y="118" font-family="${F.saluti}" font-size="${fsSal}" fill="${c.scuro}">${esc(saluti)}</text></g></g>
      <g transform="rotate(-6 70 118)"><text x="70" y="118" font-family="${F.saluti}" font-size="${fsSal}" fill="${CREMA}" stroke="${c.scuro}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(saluti)}</text></g>
      <g transform="rotate(-3 332 300)">
        ${estruso}
        ${lettere(`fill="url(#${id('dentro')})" stroke="${CREMA}" stroke-width="13" stroke-linejoin="round" paint-order="stroke"`)}
        ${m && arte ? lettere(`fill="${c.chiaro}" opacity=".22"`) : lettere(`fill="${c.vivo}" opacity=".22"`)}
        ${lettere(`fill="url(#${id('lucido')})"`)}
        ${lettere(`fill="none" stroke="${c.scuro}" stroke-width="3" stroke-opacity=".75"`)}
      </g>
      ${nastro}
    </g>
    <rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="3" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-width="1.5"/>
  </g>`

  // — il retro —
  const R0 = 706
  const fMsg = `31px ${F.penna}`, lMsg = 452
  const frase = T[lang]?.statoFrase?.[st] || T.en.statoFrase[st]
  const msg = []
  msg.push({ t: t(lang, 'cari') })
  for (const r of fitta(frase(lg), fMsg, lMsg, 2)) msg.push({ t: r })
  const custom = a.custom?.state ? String(a.custom.state) : ''
  if (custom) msg.push({ t: `«${taglia(custom, fMsg, lMsg - 26)}»` })
  if (a.gioco?.name) msg.push({ t: taglia((T[lang] || T.en).gioca(a.gioco.name), fMsg, lMsg), gioco: true })
  if (m) {
    const titolo = fitta(`${t(lang, 'inCuffia')} «${m.titolo}»`, fMsg, lMsg, 2)
    titolo.forEach((r) => msg.push({ t: r, evid: true }))
    if (m.artista) msg.push({ t: taglia(`${t(lang, 'di')} ${m.artista}`, fMsg, lMsg), artista: true })
  } else {
    msg.push({ t: taglia(t(lang, 'silenzio')[a.online ? 'on' : 'off'], fMsg, lMsg) })
  }
  // al massimo sette righe: prima va via il saluto, poi il gioco; con sette si scrive un po' più fitto
  if (msg.length > 6) msg.shift()
  if (msg.length > 7) msg.splice(msg.findIndex((r) => r.gioco), 1)
  const passo = msg.length > 6 ? 30 : 34, fsMsg = msg.length > 6 ? 28 : 31
  const Y0 = 266
  const evid = msg.map((r, i) => (r.evid ? `<rect x="${R0 - 4}" y="${Y0 + i * passo - 22}" width="${Math.min(lMsg + 8, larga(r.t, fMsg) + 10)}" height="20" rx="3" fill="#ffd400" opacity=".5" transform="skewX(-8)" transform-origin="${R0} ${Y0 + i * passo}"/>` : '')).join('')
  const righeMsg = msg.map((r, i) => `<text x="${R0}" y="${(Y0 + i * passo).toFixed(1)}" font-family="${F.penna}" font-size="${fsMsg}" font-weight="${r.evid ? 700 : 500}" fill="${PENNA}">${esc(r.t)}</text>`).join('')
  const fBaci = `30px ${F.penna}`
  const baciW = larga(t(lang, 'baci'), fBaci) || 170
  const yF = Math.min(478, Math.max(452, Y0 + msg.length * passo + 22))
  const firma = `<text x="${R0}" y="${yF}" font-family="${F.penna}" font-size="30" font-weight="500" fill="${PENNA}">${esc(t(lang, 'baci'))}</text>
    <text x="${R0 + baciW + 12}" y="${yF + 2}" font-family="${F.marker}" font-size="26" fill="${ROSSO}" transform="rotate(-4 ${R0 + baciW + 12} ${yF + 2})">${esc(t(lang, 'firma'))}</text>`

  // il francobollo dentellato, con l'avatar
  const FX = 1034, FY = 30, FW = 132, FH = 164
  const buchi = []
  for (let x = 6; x < FW; x += 12) buchi.push([x, 0], [x, FH])
  for (let y = 6; y < FH; y += 12) buchi.push([0, y], [FW, y])
  const tintaF = c.franco, inkF = inchiostro(tintaF)
  const francobollo = `<g transform="translate(${FX} ${FY}) rotate(3 66 82)"><g class="cart-francobollo">
    <g filter="url(#${id('ombretta')})"><rect width="${FW}" height="${FH}" fill="#fffdf6"/></g>
    <g fill="${CARTA}">${buchi.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
    <rect x="11" y="11" width="${FW - 22}" height="${FH - 22}" fill="${tintaF}"/>
    <rect x="11" y="11" width="${FW - 22}" height="${FH - 22}" fill="url(#${id('trama')})"/>
    <text x="${FW / 2}" y="34" text-anchor="middle" font-family="${F.fa}" font-size="17" fill="${inkF}" letter-spacing="1">${esc(t(lang, 'francoSu'))}</text>
    <circle cx="${FW / 2}" cy="84" r="35" fill="${CREMA}"/>
    ${avatar ? `<image href="${avatar}" x="${FW / 2 - 33}" y="51" width="66" height="66" clip-path="url(#${id('tondo')})"/>` : chiocciola('online', false, '', CREMA).replace('class="cart-chiocciola"', `transform="translate(${FW / 2 - 40} 104) scale(.42)"`)}
    <circle cx="${FW / 2}" cy="84" r="35" fill="none" stroke="${inkF}" stroke-width="2"/>
    <text x="${FW / 2}" y="${FH - 20}" text-anchor="middle" font-family="${F.fa}" font-size="26" fill="${inkF}">${esc(t(lang, 'franco'))}</text>
  </g></g>`

  // il timbro postale con la data e l'ora vere
  const giorno = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', day: '2-digit', month: 'numeric', year: 'numeric' }).formatToParts(quando)
  const pz = Object.fromEntries(giorno.map((p) => [p.type, p.value]))
  const dataTimbro = `${pz.day} ${t(lang, 'mesi')[+pz.month - 1]} ${pz.year}`
  const anello = `${t(lang, 'poste')} • ${t(lang, 'luogoTimbro')[dove]} • ${statoParola(a.status, lang).toUpperCase()} • `
  const onde = Array.from({ length: 5 }, (_, i) => {
    const y = 140 + i * 13
    let p = `M742 ${y}`
    for (let x = 742; x < 930; x += 24) p += ` q 6 -7 12 0 t 12 0`
    return `<path d="${p}"/>`
  }).join('')
  const timbro = `<g opacity=".78" fill="none" stroke="#2a2438" stroke-width="2.4" stroke-linecap="round">${onde}</g>
  <g transform="translate(992 170) rotate(-14)"${perFile ? '' : ` data-timbro role="button" tabindex="0" aria-label="${esc(t(lang, 'ripeti'))}" class="cart-tocca"`}>
    <g class="cart-timbro" opacity=".8">
      <circle r="62" fill="#000" fill-opacity="0"/>
      <circle r="58" fill="none" stroke="#2a2438" stroke-width="3"/>
      <circle r="40" fill="none" stroke="#2a2438" stroke-width="1.8"/>
      <path id="${id('anello')}" d="M-49 0 A49 49 0 1 1 49 0 A49 49 0 1 1 -49 0" fill="none"/>
      <text font-family="${F.mac}" font-size="11.5" fill="#2a2438" letter-spacing="1.2"><textPath href="#${id('anello')}" startOffset="0" textLength="300" lengthAdjust="spacingAndGlyphs">${esc(anello)}</textPath></text>
      <text y="-6" text-anchor="middle" font-family="${F.fa}" font-size="18" fill="#2a2438" textLength="70" lengthAdjust="spacingAndGlyphs">${esc(dataTimbro)}</text>
      <path d="M-30 4 H30" stroke="#2a2438" stroke-width="1.4"/>
      <text y="22" text-anchor="middle" font-family="${F.mac}" font-size="15" fill="#2a2438">${esc(t(lang, 'ore'))} ${esc(oraIt(quando, lang))}</text>
    </g>
    ${perFile ? '' : `<text class="cart-conta" x="20" y="88" font-family="${F.marker}" font-size="17" fill="${ROSSO}" transform="rotate(10)"></text>`}
  </g>`

  // il timbro di gomma rosso
  const [g1, g2] = (T[lang] || T.en).gomma[st]
  const fG = `26px ${F.fa}`
  const gl = larga(g1, fG) > 132 ? 132 : 0
  const gomma = `<g transform="translate(784 548) rotate(-9)"><g class="cart-gomma" opacity=".82" fill="none" stroke="${ROSSO}">
    <rect x="-78" y="-36" width="156" height="72" rx="7" stroke-width="3.6"/>
    <rect x="-71" y="-29" width="142" height="58" rx="4" stroke-width="1.4"/>
    <text y="0" text-anchor="middle" font-family="${F.fa}" font-size="26" fill="${ROSSO}" stroke="none" letter-spacing="1" ${gl ? `textLength="${gl}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(g1)}</text>
    <text y="20" text-anchor="middle" font-family="${F.mac}" font-size="14" fill="${ROSSO}" stroke="none">${esc(g2)}</text>
  </g></g>`

  // l'indirizzo a penna, sulle righe
  const fInd = `26px ${F.penna}`
  const indirizzo = `<text x="888" y="510" font-family="${F.mac}" font-size="15" fill="${INK}" opacity=".75">${esc(t(lang, 'spett'))}</text>
    <g stroke="${INK}" stroke-opacity=".38" stroke-width="1.3">${[536, 566, 596].map((y) => `<path d="M888 ${y} H1168"/>`).join('')}</g>
    ${t(lang, 'indirizzo').map((r, i) => `<text x="${i === 0 ? 952 : 896}" y="${531 + i * 30}" font-family="${F.penna}" font-size="26" font-weight="500" fill="${PENNA}">${esc(taglia(r, fInd, i === 0 ? 212 : 268))}</text>`).join('')}`

  const fLecc = `16px ${F.marker}`
  const lecc = `<g transform="translate(1028 222) rotate(-5)"><path d="M14 -16 q 8 -10 4 -22 m-8 6 l8 -6 l6 8" fill="none" stroke="${ROSSO}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="26" y="0" font-family="${F.marker}" font-size="16" fill="${ROSSO}">${esc(taglia(t(lang, 'leccato'), fLecc, 136))}</text></g>`

  // l'alone di una tazzina appoggiata sul retro (la posta lenta si legge col caffè)
  const caffe = `<g fill="none" stroke="#7a4a1e" opacity=".22"><circle cx="1110" cy="372" r="46" stroke-width="6"/><circle cx="1110" cy="372" r="41" stroke-width="1.5" stroke-dasharray="40 9 70 12"/><path d="M1060 392 q -6 10 2 16" stroke-width="4" stroke-linecap="round"/></g>`
  const retro = `<g>
    ${caffe}
    <text x="${R0}" y="66" font-family="${F.mac}" font-size="27" fill="${INK}" letter-spacing="2.5">${esc(t(lang, 'cartolina'))}</text>
    <path d="M${R0} 78 H1010 M${R0} 82 H1010" stroke="${INK}" stroke-width="1.2" opacity=".7"/>
    <text x="${R0}" y="102" font-family="${F.mac}" font-size="14" fill="${INK}" opacity=".62">${esc(t(lang, 'sotto'))}</text>
    <text x="${R0}" y="122" font-family="${F.mac}" font-size="14" fill="${INK}" opacity=".62">pzkko.it/#studio</text>
    ${francobollo}
    ${timbro}
    ${lecc}
    ${evid}
    ${righeMsg}
    ${firma}
    <path d="M${R0} 494 H${R0 + 150}" stroke="${INK}" stroke-opacity="0"/>
    ${gomma}
    ${indirizzo}
  </g>`

  const bordo = `<g transform="translate(690 596) rotate(-90)"><text x="0" y="0" font-family="${F.mac}" font-size="11.5" fill="${INK}" opacity=".5" letter-spacing=".6" textLength="560" lengthAdjust="spacingAndGlyphs">${esc(t(lang, 'bordo'))}</text></g>`

  const desc = `pzkko · ${statoTesto}${custom ? ` · «${custom}»` : ''}${m ? ` · ${m.titolo} — ${m.artista || ''}` : ''}`
  const fumetto = perFile ? '' : `<g class="cart-fumetto" transform="translate(262 352)" aria-hidden="true"><g class="cart-fumetto__in">
    <path d="M0 0 H232 a12 12 0 0 1 12 12 V54 a12 12 0 0 1 -12 12 H64 L36 90 L42 66 H0 a12 12 0 0 1 -12 -12 V12 a12 12 0 0 1 12 -12 Z" fill="#fffdf6" stroke="${INK}" stroke-width="3"/>
    <text x="116" y="42" text-anchor="middle" font-family="${F.marker}" font-size="20" fill="${INK}" class="cart-fumetto__testo"></text>
  </g></g>`
  const chioccioLa = `<g transform="translate(112 548) scale(1.3)"${perFile ? '' : ` data-chiocciola role="button" tabindex="0" aria-label="${esc(t(lang, 'chiocciola'))}" class="cart-tocca"`}>
    <rect x="-20" y="-150" width="250" height="160" fill="#000" fill-opacity="0"/>
    ${chiocciola(st, !!m, dove, c.guscio)}
  </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" text-rendering="geometricPrecision" font-weight="400" font-style="normal" letter-spacing="0" word-spacing="0" style="text-transform:none;font-variant:normal;font-kerning:normal" ${perFile ? 'role="img"' : 'role="group" class="lab-cartolina__svg"'} aria-label="${esc(t(lang, 'etichetta')(desc))}">
    ${perFile ? `<title>${esc(desc)}</title>` : ''}
    ${perFile && fontiCss ? `<style>${fontiCss}</style>` : ''}
    <defs>
      <linearGradient id="${id('cielo')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cieloSu}"/><stop offset=".85" stop-color="${c.cieloGiu}"/></linearGradient>
      <linearGradient id="${id('lucido')}" x1="0" y1="${BASE - 180}" x2="0" y2="${BASE}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".42" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
      <linearGradient id="${id('lucida')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="${id('vignetta')}" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-color="#5a3c14" stop-opacity="0"/><stop offset="1" stop-color="#5a3c14" stop-opacity=".22"/></radialGradient>
      ${dentro}
      <pattern id="${id('lino')}" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 0 H4" stroke="#fff" stroke-opacity=".09"/><path d="M0 0 V4" stroke="#000" stroke-opacity=".05"/></pattern>
      <pattern id="${id('trama')}" patternUnits="userSpaceOnUse" width="6" height="6"><path d="M0 6 L6 0" stroke="#fff" stroke-opacity=".16"/></pattern>
      ${d.grana ? `<pattern id="${id('grana')}" patternUnits="userSpaceOnUse" width="140" height="140"><image href="${d.grana}" width="140" height="140"/></pattern>` : ''}
      <clipPath id="${id('pannello')}"><rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="3"/></clipPath>
      <clipPath id="${id('tondo')}" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>
      <filter id="${id('ombra')}" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="7" stdDeviation="6" flood-color="#2a1a08" flood-opacity=".45"/></filter>
      <filter id="${id('ombretta')}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#2a1a08" flood-opacity=".35"/></filter>
    </defs>
    <rect width="1200" height="630" fill="${CARTA}"/>
    ${fronte}
    ${bordo}
    ${retro}
    <g aria-hidden="true">${polaroid}</g>
    ${chioccioLa}
    ${fumetto}
    ${d.grana ? `<rect width="1200" height="630" fill="url(#${id('grana')})" pointer-events="none"/>` : ''}
    <rect width="1200" height="630" fill="url(#${id('vignetta')})" pointer-events="none"/>
  </svg>`
}

export default {
  id: 'cartolina',
  titolo: { it: 'Cartolina viva', en: 'Living postcard' },
  testo: {
    it: 'Una cartolina 1200 × 630 con avatar, stato, luogo e brano di adesso: si scarica in SVG o PNG, o si manda al telefono col foglio di condivisione.',
    en: 'A 1200 × 630 postcard with avatar, status, place and current track: download it as SVG or PNG, or send it to a phone with the share sheet.',
  },
  tecnologie: ['SVG', 'Canvas', 'Web Share'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-cartolina" data-ante></div>
      <div class="lab__azioni">
        <button type="button" class="lab__bottone" data-svg>${esc(t(lang, 'svg'))}</button>
        <button type="button" class="lab__bottone lab__bottone--fantasma" data-png>${esc(t(lang, 'png'))}</button>
        <button type="button" class="lab__bottone lab__bottone--fantasma" data-share>${esc(t(lang, 'condividi'))}</button>
      </div>
      <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const ante = el.querySelector('[data-ante]')
    const statoEl = el.closest('.lab__card')?.querySelector('.lab__stato')
    let corrente = api.adesso(), dati = null, timer = 0, seq = 0, vivo = true, timbrate = 0, battuta = -1, tFumetto = 0

    async function costruisci(a) {
      const mio = ++seq
      const colori = a.track?.img ? await api.palette(a.track.img, ['#ff7a3d', '#2f8fbf', '#ffd23f', '#fff1c9', '#1f3b57']) : []
      const fonti = fontiInPagina()
      const [avatar, arte] = await Promise.all([
        dataUrl('/me.png', 'image/png'),
        a.track?.img ? dataUrl(api.immagine(a.track.img), 'image/png') : null,
      ])
      if (!vivo || mio !== seq) return
      dati = { a, lang, c: tinte(colori, !!a.track), avatar, arte, grana: granaCarta() }
      ante.innerHTML = svg(dati)
      // le misure dei testi cambiano coi font veri: appena ci sono, si ridisegna una volta
      if (!fontiFatti) fonti.then(() => { fontiFatti = true; if (vivo && mio === seq && dati) ante.innerHTML = svg(dati) })
      timbrate = 0
      api.stato(statoEl, t(lang, 'pronta'), 'ok')
      fontiPerFile() // si preparano già i font del file, così «Condividi» parte subito
    }

    async function perFile() {
      if (!dati) return ''
      const fontiCss = await fontiPerFile().catch(() => '')
      return svg({ ...dati, fontiCss }, true)
    }

    async function png() {
      const testo = await perFile()
      if (!testo) throw new Error('vuota')
      const url = URL.createObjectURL(new Blob([testo], { type: 'image/svg+xml' }))
      try {
        const img = new Image()
        await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('svg')); img.src = url })
        try { await img.decode() } catch {}
        // i font in data URL dentro l'immagine: un attimo perché siano pronti prima di disegnare
        await new Promise((r) => setTimeout(r, 120))
        const c = document.createElement('canvas')
        c.width = 1200; c.height = 630
        const x = c.getContext('2d')
        x.fillStyle = CARTA
        x.fillRect(0, 0, 1200, 630)
        x.drawImage(img, 0, 0, 1200, 630)
        return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'))
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    }

    // ── i due scherzi dell'anteprima: il timbro si ripete, la chiocciola parla ──
    function ritimbra() {
      const g = ante.querySelector('.cart-timbro')
      const conta = ante.querySelector('.cart-conta')
      if (!g) return
      timbrate++
      g.classList.remove('is-batti'); void g.getBoundingClientRect(); g.classList.add('is-batti')
      if (conta) conta.textContent = timbrate > 1 ? t(lang, 'timbri')(timbrate) : ''
    }
    function parla() {
      const f = ante.querySelector('.cart-fumetto'), testo = ante.querySelector('.cart-fumetto__testo')
      if (!f || !testo) return
      const b = t(lang, 'battute')
      battuta = (battuta + 1 + Math.floor(Math.random() * (b.length - 1))) % b.length
      testo.textContent = b[battuta]
      testo.removeAttribute('textLength')
      try { if (testo.getComputedTextLength() > 220) { testo.setAttribute('textLength', '220'); testo.setAttribute('lengthAdjust', 'spacingAndGlyphs') } } catch {}
      f.classList.add('is-on')
      clearTimeout(tFumetto)
      tFumetto = setTimeout(() => f.classList.remove('is-on'), 2800)
    }
    const tocca = (e) => {
      const q = e.target.closest?.('[data-timbro], [data-chiocciola]')
      if (!q) return
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      if (q.hasAttribute('data-timbro')) ritimbra()
      else parla()
    }
    ante.addEventListener('click', tocca)
    ante.addEventListener('keydown', tocca)

    // le animazioni girano solo quando la cartolina si vede
    const togliVista = api.quandoVisibile(ante, (si) => { ante.dataset.fermo = si ? '0' : '1' })

    el.querySelector('[data-svg]').addEventListener('click', async () => {
      if (!dati) return
      try {
        api.stato(statoEl, t(lang, 'preparo'), '')
        api.scarica(new Blob([await perFile()], { type: 'image/svg+xml' }), 'pzkko-cartolina.svg')
        api.stato(statoEl, t(lang, 'fatto'), 'ok')
      } catch (e) { console.error(e); api.stato(statoEl, 'SVG?', 'no') }
    })
    el.querySelector('[data-png]').addEventListener('click', async () => {
      if (!dati) return
      try {
        api.stato(statoEl, t(lang, 'preparo'), '')
        api.scarica(await png(), 'pzkko-cartolina.png')
        api.stato(statoEl, t(lang, 'fatto'), 'ok')
      } catch (e) { console.error(e); api.stato(statoEl, 'PNG?', 'no') }
    })
    el.querySelector('[data-share]').addEventListener('click', async () => {
      if (!dati) return
      try {
        api.stato(statoEl, t(lang, 'preparo'), '')
        const b = await png()
        const file = new File([b], 'pzkko-cartolina.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] }) && navigator.share) {
          await navigator.share({ files: [file], title: 'pzkko', text: 'pzkko.it/#studio' })
          api.stato(statoEl, t(lang, 'fatto'), 'ok')
        } else {
          api.scarica(b, 'pzkko-cartolina.png')
          api.stato(statoEl, t(lang, 'senza'), '')
        }
      } catch (e) {
        if (e?.name !== 'AbortError') console.error(e)
        api.stato(statoEl, t(lang, 'pronta'), 'ok')
      }
    })

    const togli = api.onAdesso((a) => {
      corrente = a
      clearTimeout(timer)
      timer = setTimeout(() => { if (vivo) costruisci(corrente) }, 700)
    })
    costruisci(corrente)
    return () => {
      vivo = false
      clearTimeout(timer); clearTimeout(tFumetto)
      togli(); togliVista?.()
      ante.removeEventListener('click', tocca)
      ante.removeEventListener('keydown', tocca)
    }
  },
}
