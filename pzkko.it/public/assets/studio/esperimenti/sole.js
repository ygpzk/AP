// 08 · Orologio solare. Alba, tramonto, mezzogiorno e altezza del sole sopra
// Mantova, calcolati con la formula NOAA (sole-math.js): niente API, niente
// geolocalizzazione. Il disegno è un SVG che si ridisegna ogni minuto.
// La grafica (27.11): il panorama della pianura, una stampa attaccata al foglio. L'asse orizzontale è l'ora del
// giorno (il metro da sarta in basso, 00–24), quello verticale l'altezza vera del sole: la curva tratteggiata è il
// giro di oggi, calcolato punto per punto; sotto l'orizzonte il sole passa nella sezione del terreno e dorme lì
// (altezza negativa). Il cielo prende il colore dall'altezza, la luna ha la fase e la posizione calcolate (formula
// corta, circa un grado), il cartello stradale fa da gnomone con l'ombra vera, e la chiocciola tira il sole con
// una corda. Le battute sono battute; le ore e i gradi sono quelli calcolati.
import { esc } from '../utils.js'
import { calcola, LATITUDINE, LONGITUDINE } from './sole-math.js'

const T = {
  it: {
    titolo: 'La luce sopra Mantova',
    nota: 'Calcolata, non guardata fuori dalla finestra: alba, tramonto e altezza del sole con data, latitudine e longitudine. Si aggiorna ogni minuto. La luna è calcolata con una formula corta: circa un grado.',
    alba: 'alba',
    tramonto: 'tramonto',
    mezzogiorno: 'mezzogiorno',
    altezza: 'altezza',
    giorno: 'giorno',
    notte: 'notte',
    oraBlu: 'ora blu',
    oraOro: 'ora d’oro',
    sotto: 'sotto l’orizzonte',
    durata: 'durata del giorno',
    adesso: 'adesso',
    pronta: 'calcolato',
    andata: 'andata',
    ritorno: 'ritorno',
    validita: 'validità',
    quota: 'quota',
    altra: 'un’altra',
    battute: 'Battute del giorno',
    pianura: 'fig. 1 — la bassa in sezione. in basso il metro delle ore, in verticale l’altezza vera.',
    tana: 'il sole dorme qui',
    turno: 'di notte passa di qua',
    f: {
      sale: 'salgo, salgo…',
      scende: 'scendo, scendo…',
      cima: (g) => `più su di ${g} oggi non vado`,
      oroM: 'foto adesso, poi lavoro',
      oroS: 'foto adesso, poi chiudo',
      bluM: 'altri cinque minuti…',
      bluS: 'buonanotte pianura',
      notte: 'zzz',
    },
    b: {
      tramonto: (s, c) => `il sole tramonta alle ${s}, la chiocciola alle ${c}.`,
      meno: (n) => `domani ${n} di luce in meno. reclamo già spedito.`,
      piu: (n) => `domani ${n} di luce in più: la primavera ha i lavori in corso.`,
      fermo: 'domani la stessa luce, secondo più secondo meno: è il solstizio, il sole fa la chiocciola.',
      mezzogiorno: (n) => `mezzogiorno vero alle ${n}. quello dei campanili è un accordo fra amici.`,
      dorme: (a) => `il sole dorme sotto i campi. sveglia alle ${a}, chiocciola permettendo.`,
      sotto: (g) => `adesso è ${g} sotto l’orizzonte: più giù della cantina.`,
      blu: 'ora blu: la chiocciola accende i fari.',
      oro: 'ora d’oro: tutti fotografi, anche la chiocciola.',
      ombra: (k) => `il cartello fa un’ombra lunga ${k} volte lui. si sente importante.`,
      nebbia: 'nebbia o no, il sole c’è: l’ha detto la matematica, non la finestra.',
      lunaSu: (p) => `luna al ${p} e in crescita, come la lista dei lavori in corso.`,
      lunaGiu: (p) => `luna al ${p} e in calo, come la batteria alle due di notte.`,
      giorno: (d) => `${d} di luce oggi. la chiocciola ne usa tre per uscire dal guscio.`,
    },
  },
  en: {
    titolo: 'The light over Mantova',
    nota: 'Calculated, not looked at out of the window: sunrise, sunset and sun height from date, latitude and longitude. It updates every minute. The moon uses a short formula: about one degree off.',
    alba: 'sunrise',
    tramonto: 'sunset',
    mezzogiorno: 'solar noon',
    altezza: 'height',
    giorno: 'day',
    notte: 'night',
    oraBlu: 'blue hour',
    oraOro: 'golden hour',
    sotto: 'below the horizon',
    durata: 'day length',
    adesso: 'now',
    pronta: 'calculated',
    andata: 'outbound',
    ritorno: 'return',
    validita: 'valid for',
    quota: 'altitude',
    altra: 'another one',
    battute: 'Jokes of the day',
    pianura: 'fig. 1 — the po valley, cross-section. hours on the tape measure, real height going up.',
    tana: 'the sun sleeps here',
    turno: 'night shift goes this way',
    f: {
      sale: 'going up, going up…',
      scende: 'going down, going down…',
      cima: (g) => `today I don’t go higher than ${g}`,
      oroM: 'photos now, then work',
      oroS: 'photos now, then I close',
      bluM: 'five more minutes…',
      bluS: 'good night, plain',
      notte: 'zzz',
    },
    b: {
      tramonto: (s, c) => `the sun sets at ${s}, the snail at ${c}.`,
      meno: (n) => `tomorrow ${n} less light. complaint already filed.`,
      piu: (n) => `tomorrow ${n} more light: spring is under construction.`,
      fermo: 'tomorrow the same light, give or take a second: it’s the solstice, the sun does the snail.',
      mezzogiorno: (n) => `true noon at ${n}. the church bells just agreed on another one.`,
      dorme: (a) => `the sun sleeps under the fields. alarm at ${a}, snail permitting.`,
      sotto: (g) => `right now it’s ${g} below the horizon: deeper than the cellar.`,
      blu: 'blue hour: the snail turns its headlights on.',
      oro: 'golden hour: everyone’s a photographer, the snail too.',
      ombra: (k) => `the sign casts a shadow ${k} times its height. it feels important.`,
      nebbia: 'fog or no fog, the sun is there: maths said so, not the window.',
      lunaSu: (p) => `moon at ${p} and growing, like the to-do list.`,
      lunaGiu: (p) => `moon at ${p} and shrinking, like a phone battery at 2 am.`,
      giorno: (d) => `${d} of light today. the snail needs three just to leave the shell.`,
    },
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]
const ora = (d) => new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
const durata = (ms) => `${Math.floor(ms / 3600000)}h ${String(Math.round((ms % 3600000) / 60000)).padStart(2, '0')}m`
const num = (lang, n, cifre = 1) => n.toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: cifre, maximumFractionDigits: cifre })

// ── il tempo a Roma e un po' di astronomia in più (luna, azimut) ─────────────────────────────────────────────────
const fmtRoma = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
function minutiRoma(d) {
  const p = Object.fromEntries(fmtRoma.formatToParts(d).map((x) => [x.type, x.value]))
  return (+p.hour % 24) * 60 + +p.minute + +p.second / 60
}
const RAD = Math.PI / 180
const giro = (a) => ((a % 360) + 360) % 360
// sole e luna in coordinate locali (formule corte dell'Almanacco: sole ~0,01°, luna ~1°)
function cielo(data) {
  const d = data.getTime() / 864e5 + 2440587.5 - 2451545
  const eps = (23.439 - 0.00000036 * d) * RAD
  const lat = LATITUDINE * RAD
  const lst = giro(280.46061837 + 360.98564736629 * d + LONGITUDINE)
  const locale = (lon, bet) => {
    const l = lon * RAD, b = bet * RAD
    const dec = Math.asin(Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l))
    const ra = Math.atan2(Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps), Math.cos(l)) / RAD
    const h = giro(lst - ra) * RAD
    const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h)) / RAD
    const az = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) / RAD // da sud, + verso ovest
    return { ra, alt, az }
  }
  const g = giro(357.529 + 0.98560028 * d) * RAD
  const ls = giro(280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g))
  const L = 218.316 + 13.176396 * d, M = (134.963 + 13.064993 * d) * RAD, F = (93.272 + 13.22935 * d) * RAD
  const lm = giro(L + 6.289 * Math.sin(M)), bm = 5.128 * Math.sin(F)
  const sole = locale(ls, 0)
  const luna = locale(lm, bm)
  luna.alt -= 0.95 * Math.cos(luna.alt * RAD) // la parallasse: la luna vista da qui, non dal centro della Terra
  const el = Math.acos(Math.cos(bm * RAD) * Math.cos((lm - ls) * RAD))
  luna.luce = (1 - Math.cos(el)) / 2
  luna.cresce = giro(lm - ls) < 180
  return { sole, luna }
}

// ── colori ───────────────────────────────────────────────────────────────────────────────────────────────────────
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * k)) }
const liscio = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k) }
// il cielo per altezza: [gradi, alto, mezzo, basso (mattina), mezzo e basso (sera)]
const CIELO = [
  [-90, '#03050f', '#060a1c', '#0b1230', '#060a1c', '#0b1230'],
  [-18, '#050818', '#0a1030', '#141c45', '#0a1030', '#141c45'],
  [-12, '#0b1238', '#17215c', '#2b3070', '#17215c', '#2b3070'],
  [-7, '#18235c', '#3a3f86', '#8e5c8e', '#43407e', '#a4506c'],
  [-3, '#2a3c82', '#7a6aa8', '#f0a3a6', '#a8607a', '#f08a52'],
  [0, '#3a5ca6', '#a891c2', '#ffc2a8', '#e39a7c', '#ffa456'],
  [4, '#4876be', '#9cb9e0', '#ffdcbc', '#b9b6cf', '#ffc583'],
  [12, '#3e80d2', '#8ec2ee', '#e9f1f0', '#8ec2ee', '#f3eadc'],
  [30, '#2a72cf', '#79b6ef', '#c6e6ff', '#79b6ef', '#c6e6ff'],
  [90, '#1a5bbf', '#69a7e9', '#b1dcff', '#69a7e9', '#b1dcff'],
]
function coloriCielo(alt, sera) {
  let i = 0
  while (i < CIELO.length - 2 && alt > CIELO[i + 1][0]) i++
  const a = CIELO[i], b = CIELO[i + 1]
  const k = Math.max(0, Math.min(1, (alt - a[0]) / (b[0] - a[0])))
  const s = sera ? [1, 4, 5] : [1, 2, 3]
  return s.map((j) => mix(a[j], b[j], k))
}

// ── la geometria del panorama (viewBox 640 × 420) ───────────────────────────────────────────────────────────────
const W = 640, ORIZ = 246, TERRA = 326, FONDO = 388, METRO = 396
const X = (min) => 24 + (min / 1440) * 592
const Y = (alt) => alt >= 0 ? ORIZ - 196 * (Math.min(alt, 75) / 75) ** 0.72 // su: compressa in alto, così d'inverno si vede
  : alt > -4 ? ORIZ + (TERRA + 4 - ORIZ) * (-alt / 4) // dietro i campi: si tuffa
    : TERRA + 4 + (FONDO - TERRA - 14) * Math.min(1, (-alt - 4) / 71)
const f1 = (n) => n.toFixed(1)
const rnd = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }

// la chiocciola (in piedi a destra, origine sotto il piede): di giorno col casco, di notte col berretto
function chiocciola(notte) {
  const giri = []
  for (let a = 0; a <= 4.4 * Math.PI; a += 0.25) { const r = 1.2 + a * 1.25; giri.push(`${f1(28 + Math.cos(a) * r)} ${f1(-21 + Math.sin(a) * r)}`) }
  const occhi = notte
    ? '<path d="M57 -40l5 1M70 -41l-4 2" class="s-tratto"/>'
    : '<g class="s-antenne"><path d="M61 -33Q58 -42 59 -50M68 -33Q72 -41 73 -49" class="s-tratto"/><circle cx="59" cy="-51" r="3.4" class="s-occhio"/><circle cx="73" cy="-50" r="3.4" class="s-occhio"/><circle cx="60" cy="-51" r="1.4" fill="#1d3f55"/><circle cx="74" cy="-50" r="1.4" fill="#1d3f55"/></g>'
  const testa = notte
    ? '<path d="M54 -33Q58 -48 72 -40l-2 3Q62 -40 57 -32Z" fill="#c7322f"/><circle cx="76" cy="-38" r="3.2" fill="#fffdf6"/>'
    : '<path d="M56 -33Q64 -46 76 -34Z" fill="#ffd400" stroke="#1d3f55" stroke-width="1.6"/><path d="M53 -33H79" stroke="#1d3f55" stroke-width="2.2" stroke-linecap="round"/><path d="M62 -40h8" stroke="#1d3f55" stroke-width="1.4"/>'
  return `<path d="M-6 1C-4 -6 14 -6 36 -7C46 -8 51 -16 54 -25C56 -32 62 -34 68 -32C75 -30 76 -24 73 -18C70 -10 67 -3 63 -1C59 1 50 2 44 2H-4Z" class="s-corpo"/>
    <path d="M60 -19q5 4 10 0" class="s-tratto"/>${occhi}
    <circle cx="28" cy="-21" r="20" class="s-guscio"/><path d="M${giri.join('L')}" class="s-spira"/>
    <path d="M12 -30q6 -8 14 -10" stroke="#fff6" stroke-width="2.4" fill="none" stroke-linecap="round"/>${testa}`
}

function disegnaSVG(s) {
  const { lang, c, cl, adesso, giornata, sera } = s
  const alt = c.altezza
  const [alto, mezzo, basso] = coloriCielo(alt, sera)
  const luce = liscio(-9, 7, alt) // 0 notte, 1 giorno
  const oro = Math.exp(-(((alt - 2) / 7) ** 2)) * (alt > -5 ? 1 : 0)
  const tinta = (giorno, notte) => mix(mix(notte, giorno, luce), '#ff8c42', oro * 0.22)
  const buio = 1 - liscio(-12, -2, alt) // 1 = stelle piene
  const sx = X(adesso), sy = Y(alt)
  const giorno = alt > -0.833
  // la curva di oggi, vera, punto per punto
  const curva = giornata.map(([m, a]) => `${f1(X(m))} ${f1(Y(a))}`).join('L')
  // stelle (posti fissi, così non ballano a ogni ridisegno)
  const r = rnd(808)
  let stelle = ''
  if (buio > 0.02) {
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = r() * (ORIZ - 40), g = r()
      stelle += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${g > 0.9 ? 1.6 : g > 0.6 ? 1.1 : 0.7}" opacity="${f1((0.35 + g * 0.6) * buio)}"/>`
    }
  }
  const brilli = buio > 0.3 ? [[96, 40], [212, 74], [402, 30], [560, 92], [300, 120], [610, 28]].map(([x, y], i) =>
    `<path d="M${x} ${y - 6}l1.4 4.6 4.6 1.4-4.6 1.4-1.4 4.6-1.4-4.6-4.6-1.4 4.6-1.4z" class="lab-sole__brillo" style="--i:${i}"/>`).join('') : ''
  // la luna: fase e posto calcolati
  let luna = ''
  const L = cl.luna
  if (L.alt > -1) {
    const mx = X(((adesso + (cl.sole.ra - L.ra) * 4) % 1440 + 1440) % 1440)
    const my = Math.min(Y(Math.max(L.alt, 0.5)), ORIZ - 6)
    const R = 13, rx = Math.abs(1 - 2 * L.luce) * R
    const lato = `M0 ${-R}A${R} ${R} 0 0 1 0 ${R}A${f1(rx)} ${R} 0 0 ${L.luce > 0.5 ? 1 : 0} 0 ${-R}Z`
    luna = `<g transform="translate(${f1(mx)} ${f1(my)})" opacity="${f1(0.55 + 0.45 * (1 - luce))}">
      <circle r="${R + 10}" fill="url(#sole-alone-luna)" opacity="${f1(L.luce * (1 - luce))}"/>
      <circle r="${R}" fill="${mix('#3a4370', '#9fb3dc', luce)}" opacity=".55"/>
      <path d="${lato}" fill="#f6f0d8" transform="scale(${L.cresce ? 1 : -1} 1)"/>
      <g fill="#d9cfae" opacity=".55"><circle cx="-3" cy="-3" r="2.2"/><circle cx="4" cy="3" r="1.6"/><circle cx="-1" cy="5" r="1.1"/></g></g>`
  }
  // il sole: col viso di giorno, a letto di notte
  const col = alt < 3 ? '#ff7a2f' : alt < 12 ? mix('#ff9a3c', '#ffc93c', (alt - 3) / 9) : '#ffd23f'
  const ritardo = `style="animation-delay:-${((Date.now() / 1000) % 60).toFixed(1)}s"`
  const viso = alt > 18
    ? '<path d="M-9 -4h7v4a3 3 0 0 1-7 0zM2 -4h7v4a3 3 0 0 1-7 0zM-2 -3h4" fill="#1b1b1b" stroke="#1b1b1b" stroke-width="1.2"/><path d="M-6 -3l2 0" stroke="#fff" stroke-width="1"/>'
    : alt < 5
      ? '<path d="M-8 -2q3 -2 6 0M2 -2q3 -2 6 0" class="s-tratto-scuro"/><path d="M-8 -2q3 2 6 0M2 -2q3 2 6 0" fill="#7a3510"/>'
      : '<circle cx="-5" cy="-2" r="1.8" fill="#5a2a08"/><circle cx="5" cy="-2" r="1.8" fill="#5a2a08" class="lab-sole__occhiolino"/>'
  const bocca = alt > 18 ? '<path d="M-5 5q5 5 10 0" class="s-tratto-scuro"/>' : '<path d="M-4 5q4 3 8 0" class="s-tratto-scuro"/>'
  const soleDi = giorno ? `<g transform="translate(${f1(sx)} ${f1(sy)})" class="lab-sole__astro">
      <circle r="58" fill="url(#sole-alone)"/>
      <g class="lab-sole__raggi" ${ritardo}>${Array.from({ length: 12 }, (_, i) => `<path d="M0 -21L3 -29L0 -36L-3 -29Z" transform="rotate(${i * 30})" fill="${col}"/>`).join('')}</g>
      <circle r="17" fill="${col}"/><circle r="17" fill="url(#sole-luce)"/>
      <circle cx="-9" cy="4" r="3" fill="#ff6f61" opacity=".45"/><circle cx="9" cy="4" r="3" fill="#ff6f61" opacity=".45"/>
      ${viso}${bocca}</g>` : ''
  // sotto terra: la tana, il berretto, gli zeta
  const ty = Math.min(Math.max(sy, TERRA + 16), FONDO - 20)
  const soleNotte = giorno ? '' : `<g transform="translate(${f1(sx)} ${f1(ty)})">
      <ellipse rx="27" ry="17" fill="#22150d"/><ellipse rx="27" ry="17" fill="url(#sole-tana)"/>
      <path d="M-24 11q24 9 48 0v5h-48z" fill="#e9dcc0" opacity=".85"/>
      <circle r="12" fill="#f39a3d"/><circle r="12" fill="url(#sole-luce)"/>
      <path d="M-6 0q2.5 2 5 0M1.5 0q2.5 2 5 0" class="s-tratto-scuro"/><path d="M-2 5q2 1.4 4 0" class="s-tratto-scuro"/>
      <path d="M-12 -4Q-10 -17 4 -15Q14 -13 21 -2L17 0Q11 -8 3 -8Q-6 -8 -9 -2Z" fill="#c7322f"/><circle cx="21" cy="-1" r="3.4" fill="#fffdf6"/>
      <g class="lab-sole__zeta" font-family="Permanent Marker, cursive" fill="#fffdf6"><text x="14" y="-18" font-size="11">z</text><text x="21" y="-26" font-size="14">z</text><text x="29" y="-36" font-size="17">Z</text></g></g>`
  // il cartello «lavori in corso» fa da gnomone: ombra lunga altezza / tan(altezza), girata dall'azimut
  const GX = 300, GY = 304, GH = 50
  let ombra = ''
  if (alt > 0.4) {
    const lung = Math.min(230, GH / Math.tan(alt * RAD))
    const az = cl.sole.az * RAD
    const dx = -Math.sin(az) * lung, dy = Math.min(14, Math.cos(az) * lung * 0.16)
    const op = Math.min(0.42, 0.12 + alt / 60)
    ombra = `<g opacity="${f1(op)}" fill="#1a1408"><path d="M${GX - 1.6} ${GY}L${f1(GX + dx * 0.72 - 1)} ${f1(GY + dy * 0.72)}L${f1(GX + dx * 0.72 + 1)} ${f1(GY + dy * 0.72)}L${GX + 1.6} ${GY}Z"/>
      <path d="M${f1(GX + dx * 0.72)} ${f1(GY + dy * 0.72)}l${f1(dx * 0.28 - 7)} ${f1(dy * 0.28)}l14 0z"/></g>`
  }
  const luceCartello = mix('#2b3550', '#fffdf6', luce)
  const cartello = `${ombra}<g transform="translate(${GX} ${GY})">
      <rect x="-1.6" y="-${GH - 10}" width="3.2" height="${GH - 10}" fill="${tinta('#8c8f94', '#2a3040')}"/>
      <path d="M0 -${GH + 12}L14 -${GH - 13}H-14Z" fill="${luceCartello}" stroke="#c4121f" stroke-width="3.2" stroke-linejoin="round"/>
      <g transform="translate(-7 -${GH - 19}) scale(.17)" fill="#161616"><path d="M-6 1C-4 -6 14 -6 36 -7C46 -8 51 -16 54 -25C56 -32 62 -34 68 -32C75 -30 76 -24 73 -18C70 -10 67 -3 63 -1C59 1 50 2 44 2H-4Z"/><circle cx="28" cy="-21" r="20"/><path d="M61 -33Q58 -42 59 -50M68 -33Q72 -41 73 -49" stroke="#161616" stroke-width="5" fill="none"/></g></g>`
  // la città: torri, cupola, campanile, castello (stilizzati, non una mappa) con le finestre accese di notte
  const citta = tinta(mix('#8a7266', basso, 0.38), '#0b1020')
  const finestre = (1 - luce) > 0.25 ? [[452, ORIZ - 40], [457, ORIZ - 52], [488, ORIZ - 20], [500, ORIZ - 20], [536, ORIZ - 34], [541, ORIZ - 22], [583, ORIZ - 18], [597, ORIZ - 18], [430, ORIZ - 9], [470, ORIZ - 8], [522, ORIZ - 8], [560, ORIZ - 10], [612, ORIZ - 8]]
    .map(([x, y], i) => `<rect x="${x}" y="${y}" width="2.6" height="3.4" fill="#ffd27a" opacity="${f1((1 - luce) * (i % 3 ? 0.9 : 0.55))}"/>`).join('') : ''
  const lancette = (() => { const h = (adesso / 60) % 12, m = adesso % 60; return `<path d="M520 ${ORIZ - 41}l${f1(Math.sin(h / 6 * Math.PI) * 2.4)} ${f1(-Math.cos(h / 6 * Math.PI) * 2.4)}M520 ${ORIZ - 41}l${f1(Math.sin(m / 30 * Math.PI) * 3.6)} ${f1(-Math.cos(m / 30 * Math.PI) * 3.6)}" stroke="#1b1b1b" stroke-width=".9" stroke-linecap="round"/>` })()
  const skyline = `<g fill="${citta}">
      <path d="M404 ${ORIZ}V${ORIZ - 9}l8 -5 8 5v-3h14l6 -6 6 6v8h10v-6l7 -4 7 4v-2h60v-4l8 -6 8 6v8h12v-5h10v5h12V${ORIZ}Z"/>
      <rect x="449" y="${ORIZ - 62}" width="13" height="62"/><path d="M447 ${ORIZ - 62}h17l-8.5 -14z"/><rect x="455" y="${ORIZ - 80}" width="1" height="6"/>
      <rect x="481" y="${ORIZ - 32}" width="28" height="32"/><path d="M478 ${ORIZ - 32}Q479 ${ORIZ - 60} 495 ${ORIZ - 61}Q511 ${ORIZ - 60} 512 ${ORIZ - 32}Z"/><rect x="492" y="${ORIZ - 70}" width="6" height="10"/><circle cx="495" cy="${ORIZ - 72}" r="2.2"/>
      <rect x="513" y="${ORIZ - 50}" width="14" height="50"/><path d="M511 ${ORIZ - 50}h18l-9 -9z"/>
      <rect x="532" y="${ORIZ - 56}" width="16" height="56"/><path d="M531 ${ORIZ - 56}h18v-5l-2 0-1 3-2 -3h-1v-0l-2 3-2 -3h-1l-2 3-2 -3h-1l-2 3z"/>
      <path d="M566 ${ORIZ}V${ORIZ - 30}h-3v-10h4v3h3v-3h4v10h26v-10h4v3h3v-3h4v10h-3V${ORIZ}Z"/>
      <path d="M574 ${ORIZ - 30}v-3h3v3h3v-3h3v3h3v-3h3v3h3v-3h3v3"/></g>
    <circle cx="520" cy="${ORIZ - 41}" r="4.4" fill="${mix('#efe6cf', '#2c3048', 1 - luce)}"/>${lancette}${finestre}`
  // i pioppi: un filare lontano lungo l'orizzonte e uno vicino
  const r2 = rnd(31)
  let lontani = '', vicini = ''
  for (let x = 14; x < 420; x += 9 + r2() * 9) {  const h = 9 + r2() * 9; lontani += `<ellipse cx="${f1(x)}" cy="${f1(ORIZ - h * 0.75)}" rx="${f1(2.4 + r2() * 1.6)}" ry="${f1(h)}"/>` }
  for (let i = 0; i < 8; i++) { const x = 226 + i * 11 + r2() * 3, h = 22 + r2() * 8; vicini += `<rect x="${f1(x - 0.8)}" y="${f1(262 - h * 0.4)}" width="1.6" height="${f1(h * 0.4)}"/><ellipse cx="${f1(x)}" cy="${f1(262 - h * 1.05)}" rx="${f1(5 + r2() * 1.5)}" ry="${f1(h * 0.78)}"/>` }
  // i campi: bande in prospettiva coi solchi verso il punto di fuga
  const campi = [['#8d9b4d', '#141b2c'], ['#a89359', '#192136'], ['#6f8b3d', '#11192a'], ['#9a7a4f', '#1a2237'], ['#7f9346', '#141c2e']]
  const bande = [256, 262, 270, 281, 294, TERRA].map((y, i, a) => i < a.length - 1 ? `<rect x="0" y="${y}" width="${W}" height="${a[i + 1] - y + 0.5}" fill="${tinta(campi[i][0], campi[i][1])}"/>` : '').join('')
  let solchi = ''
  for (let x = -600; x <= 1240; x += 34) solchi += `M${f1(330 + (x - 330) * 0.04)} 256L${x} 330`
  const strada = `M318 256L326 256L392 330H322Z`
  // la sezione del terreno
  const r3 = rnd(77)
  let sassi = ''
  for (let i = 0; i < 26; i++) { const x = r3() * W, y = TERRA + 14 + r3() * (FONDO - TERRA - 18); if (Math.abs(x - sx) < 34 && !giorno) continue; sassi += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(1.6 + r3() * 3.4)}" ry="${f1(1.2 + r3() * 1.8)}" fill="${r3() > 0.5 ? '#8b6b4c' : '#3a2a1f'}" opacity=".8"/>` }
  const radici = [130, 160, 190, 222].map((x, i) => `M${x} ${TERRA}q${i % 2 ? 6 : -5} 14 ${i % 2 ? -2 : 3} 26M${x} ${TERRA + 10}q8 4 12 14`).join('')
  // la corda: dalla bocca della chiocciola al sole (di giorno) o giù nel buco fino alla tana (di notte)
  const CX = 58, CY = 302, bx = CX + 73 * 1.05, by = CY - 22 * 1.05
  const corda = giorno
    ? `M${f1(bx)} ${f1(by)}Q${f1((bx + sx) / 2)} ${f1(Math.max(by, sy) + 26)} ${f1(sx - 10)} ${f1(sy + 12)}`
    : `M${f1(bx)} ${f1(by)}Q${f1(bx + 12)} ${f1(by + 4)} ${f1(bx + 16)} ${TERRA - 6}L${f1(bx + 16)} ${TERRA + 2}Q${f1(bx + 16)} ${f1(ty - 4)} ${f1(sx - (sx > bx ? 12 : -12))} ${f1(ty)}`
  // il metro da sarta: l'ora del giorno, le bandierine di alba e tramonto, l'ago di adesso
  let tacche = '', numeri = ''
  for (let h = 0; h <= 24; h++) {
    const x = X(h * 60)
    tacche += `M${f1(x)} ${METRO}v${h % 3 ? 5 : 9}`
    if (h % 3 === 0) numeri += `<text x="${f1(x)}" y="${METRO + 21}">${String(h).padStart(2, '0')}</text>`
    if (h < 24) tacche += `M${f1(X(h * 60 + 30))} ${METRO}v3`
  }
  const bandierina = (m, colore) => `<g transform="translate(${f1(X(m))} ${METRO})"><path d="M0 0V-12" stroke="#161616" stroke-width="1.2"/><path d="M0 -12h9l-3 3 3 3H0z" fill="${colore}"/></g>`
  const ago = `<g transform="translate(${f1(sx)} ${METRO})"><path d="M0 -6V24" stroke="#c4121f" stroke-width="2.2"/><path d="M-5 -10h10l-5 6z" fill="#c4121f"/></g>`
  const scritta = (x, y, testo, rot, cls = '') => `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" class="lab-sole__mano ${cls}">${esc(testo)}</text>`
  return `<svg viewBox="0 0 ${W} 420" width="100%" role="img" aria-label="${esc(t(lang, 'titolo'))}">
    <defs>
      <linearGradient id="sole-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${alto}"/><stop offset=".62" stop-color="${mezzo}"/><stop offset="1" stop-color="${basso}"/></linearGradient>
      <linearGradient id="sole-lago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(basso, '#000000', 0.12)}"/><stop offset="1" stop-color="${mix(mezzo, '#000000', 0.3)}"/></linearGradient>
      <radialGradient id="sole-alone"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset=".4" stop-color="${col}" stop-opacity=".18"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
      <radialGradient id="sole-alone-luna"><stop offset=".4" stop-color="#f6f0d8" stop-opacity=".35"/><stop offset="1" stop-color="#f6f0d8" stop-opacity="0"/></radialGradient>
      <radialGradient id="sole-luce" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#fff8d8" stop-opacity=".75"/><stop offset=".5" stop-color="#fff8d8" stop-opacity="0"/><stop offset="1" stop-color="#b8420a" stop-opacity=".35"/></radialGradient>
      <radialGradient id="sole-tana" cx=".5" cy=".45"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".45"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
      <radialGradient id="sole-orizzonte" cx="${f1(sx / W)}" cy="1" r=".55"><stop offset="0" stop-color="#ffb070" stop-opacity="${f1(oro * 0.75)}"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
      <linearGradient id="sole-terra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4b30"/><stop offset=".45" stop-color="#553926"/><stop offset="1" stop-color="#3a281c"/></linearGradient>
      <pattern id="sole-retino" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="1.2" cy="1.2" r=".75" fill="#fff"/></pattern>
      <linearGradient id="sole-via"><stop offset="0" stop-color="#b8c4ff" stop-opacity="0"/><stop offset=".45" stop-color="#c9d2ff" stop-opacity=".22"/><stop offset=".7" stop-color="#e6d4ff" stop-opacity=".14"/><stop offset="1" stop-color="#b8c4ff" stop-opacity="0"/></linearGradient>
      <clipPath id="sole-su"><rect width="${W}" height="${ORIZ}"/></clipPath>
      <clipPath id="sole-giu"><rect y="${TERRA + 3}" width="${W}" height="${FONDO - TERRA - 3}"/></clipPath>
    </defs>
    <rect width="${W}" height="${ORIZ + 2}" fill="url(#sole-cielo)"/>
    <rect width="${W}" height="${ORIZ + 2}" fill="url(#sole-orizzonte)"/>
    <rect width="${W}" height="${ORIZ}" fill="url(#sole-retino)" opacity="${f1(0.05 + 0.07 * luce)}"/>
    ${buio > 0.3 ? `<path d="M-40 40Q200 120 380 70T700 150" stroke="url(#sole-via)" stroke-width="54" fill="none" opacity="${f1(buio * 0.28)}"/><path d="M-40 46Q200 118 380 74T700 146" stroke="url(#sole-via)" stroke-width="12" fill="none" opacity="${f1(buio * 0.5)}"/>` : ''}
    <g fill="#fffdf6">${stelle}${brilli}</g>
    ${luce > 0.6 ? `<g class="lab-sole__uccelli" fill="none" stroke="${mix('#2a2a3a', basso, 0.2)}" stroke-width="1.3" stroke-linecap="round"><path d="M150 70q4 -4 8 0q4 -4 8 0"/><path d="M172 80q3 -3 6 0q3 -3 6 0"/><path d="M138 84q3 -3 6 0q3 -3 6 0"/></g>` : ''}
    ${luna}
    <path d="M${curva}" clip-path="url(#sole-su)" class="lab-sole__curva" stroke="${luce > 0.5 ? 'rgba(255,255,255,.75)' : 'rgba(255,240,200,.45)'}"/>
    <g fill="${tinta('#4d6a48', '#0e1526')}" opacity=".85">${lontani}</g>
    ${soleDi}
    ${giorno ? `<g transform="translate(${f1(sx - 10)} ${f1(sy + 12)})" fill="#c4121f"><path d="M0 0l-6 -4v8zM0 0l6 -4v8z"/><circle r="1.8"/></g>` : ''}
    ${skyline}
    <rect y="${ORIZ}" width="${W}" height="11" fill="url(#sole-lago)"/>
    ${giorno && alt < 40 ? `<g fill="${col}" opacity="${f1(0.35 + oro * 0.4)}">${[0, 1, 2, 3].map((i) => `<rect x="${f1(sx - 12 + i * 2 + (i % 2) * 5)}" y="${ORIZ + 1.5 + i * 2.4}" width="${18 - i * 3}" height="1.1" rx=".5"/>`).join('')}</g>` : ''}
    <path d="M0 ${ORIZ + 0.5}H${W}" stroke="rgba(255,255,255,.28)" stroke-width=".8"/>
    ${bande}
    <path d="${solchi}" stroke="${luce > 0.4 ? 'rgba(40,30,10,.16)' : 'rgba(150,170,220,.07)'}" stroke-width="1.1" fill="none" clip-path="url(#sole-campi)"/>
    <clipPath id="sole-campi"><rect y="256" width="${W}" height="${TERRA - 256}"/></clipPath>
    <path d="${strada}" fill="${tinta('#d8c79c', '#232b40')}"/>
    <g fill="${tinta('#2f4a2a', '#0a0f1c')}">${vicini}</g>
    ${cartello}
    <path d="M0 ${TERRA - 4}Q160 ${TERRA - 8} 320 ${TERRA - 4}T${W} ${TERRA - 4}V${TERRA + 4}H0Z" fill="${tinta('#5e7f34', '#151d2c')}"/>
    <rect y="${TERRA + 3}" width="${W}" height="${FONDO - TERRA - 3}" fill="url(#sole-terra)"/>
    <path d="M0 ${TERRA + 30}q80 -6 160 2t160 -2 160 3 160 -3M0 ${TERRA + 50}q90 5 180 -1t180 2 160 -2 120 1" stroke="#2c1d13" stroke-width="1" fill="none" opacity=".5"/>
    ${sassi}
    <path d="${radici}" stroke="#2a1b10" stroke-width="1.4" fill="none" opacity=".7"/>
    <path d="M${curva}" clip-path="url(#sole-giu)" class="lab-sole__curva lab-sole__curva--giu"/>
    <g class="lab-sole__lombrico"><path d="M560 ${TERRA + 40}q6 -6 12 0t12 0 10 -2" stroke="#d9837a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="595" cy="${TERRA + 37}" r=".9" fill="#161616"/></g>
    ${soleNotte}
    ${giorno ? scritta(30, TERRA + 27, t(lang, 'turno') + ' →', -2) : `<text x="${f1(sx < 230 ? sx + 30 : sx - 30)}" y="${f1(sx < 230 ? ty + 5 : ty + 18)}" text-anchor="${sx < 230 ? 'start' : 'end'}" class="lab-sole__mano lab-sole__mano--chiara">${sx < 230 ? '← ' : ''}${esc(t(lang, 'tana'))}${sx < 230 ? '' : ' →'}</text>`}
    ${giorno ? '' : `<ellipse cx="${f1(bx + 16)}" cy="${TERRA - 5}" rx="7" ry="2.4" fill="#05070d"/>`}
    <path d="${corda}" class="lab-sole__corda"/>
    <g transform="translate(${CX} ${CY}) scale(1.05)" class="lab-sole__lumaca${giorno ? '' : ' lab-sole__lumaca--dorme'}">${chiocciola(!giorno)}${giorno ? '<g class="lab-sole__fatica" stroke="#fffdf6" stroke-width="1.6" stroke-linecap="round"><path d="M-12 -30l-6 -3M-13 -22h-7M-12 -14l-6 3"/></g><path d="M84 -50q2 4 0 6q-2 -2 0 -6z" fill="#8fd3ff" class="lab-sole__goccia"/>' : ''}</g>
    <rect y="${METRO - 8}" width="${W}" height="${420 - METRO + 8}" fill="#f1d34a"/>
    <path d="M0 ${METRO - 8}H${W}" stroke="#b9971a" stroke-width="1"/>
    <path d="${tacche}" stroke="#161616" stroke-width="1.1"/>
    <g class="lab-sole__metro">${numeri}</g>
    <rect x="${W - 14}" y="${METRO - 8}" width="14" height="${420 - METRO + 8}" fill="#a9a9a3"/><rect x="${W - 14}" y="${METRO - 8}" width="3" height="${420 - METRO + 8}" fill="#d9d9d2"/>
    <text x="5" y="${METRO + 21}" class="lab-sole__metro-h">h</text>
    ${bandierina(minutiRoma(c.sorge), '#ff8fa3')}${bandierina(minutiRoma(c.mezzogiorno), '#ffd400')}${bandierina(minutiRoma(c.tramonta), '#ff8a3a')}
    ${ago}
  </svg>`
}

export default {
  id: 'sole',
  titolo: { it: 'Orologio solare', en: 'Solar clock' },
  testo: {
    it: 'Quanto è alto il sole in questo momento, quando sorge e quando tramonta: un orologio astronomico calcolato per Mantova, senza guardare fuori.',
    en: 'How high the sun is right now, when it rises and sets: an astronomical clock calculated for Mantova, without looking outside.',
  },
  tecnologie: ['SVG', 'Astronomia NOAA', 'Intl.DateTimeFormat'],
  monta(el, api) {
    const lang = api.lang
    const L = T[lang] || T.en
    el.innerHTML = `<div class="lab-sole">
        <div class="lab-sole__foto">
          <div data-svg></div>
          <div class="lab-sole__nebbia" aria-hidden="true"><i></i><i></i></div>
          <i class="lab-sole__cometa" aria-hidden="true"></i>
          <p class="lab-sole__fumetto" aria-hidden="true" hidden></p>
        </div>
        <p class="lab-sole__didascalia" aria-hidden="true">${esc(t(lang, 'pianura'))}</p>
      </div>
      <div class="lab-sole__numeri">
        <span data-k="alba"><i aria-hidden="true">${esc(t(lang, 'andata'))}</i><b data-alba>—</b>${esc(t(lang, 'alba'))}</span>
        <span data-k="tramonto"><i aria-hidden="true">${esc(t(lang, 'ritorno'))}</i><b data-tramonto>—</b>${esc(t(lang, 'tramonto'))}</span>
        <span data-k="durata"><i aria-hidden="true">${esc(t(lang, 'validita'))}</i><b data-durata>—</b>${esc(t(lang, 'durata'))}</span>
        <span data-k="altezza"><i aria-hidden="true">${esc(t(lang, 'quota'))}</i><b data-altezza>—</b>${esc(t(lang, 'altezza'))}</span>
      </div>
      <aside class="lab-sole__postit" aria-label="${esc(t(lang, 'battute'))}">
        <p class="lab-sole__battuta" aria-live="polite"></p>
        <button type="button" class="lab__bottone lab__bottone--fantasma lab-sole__altra">${esc(t(lang, 'altra'))} ↻</button>
      </aside>
      <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const foto = el.querySelector('.lab-sole')
    const fumetto = el.querySelector('.lab-sole__fumetto')
    const battuta = el.querySelector('.lab-sole__battuta')
    let battute = [], quale = 0, giornataDi = '', giornata = []

    const disegna = () => {
      const c = calcola()
      const adesso = minutiRoma(c.adesso)
      // il giro di oggi, ricalcolato solo quando cambia il giorno
      const chiave = ora(c.sorge) + c.giorno
      if (chiave !== giornataDi) {
        const mezzanotte = c.adesso.getTime() - adesso * 60000
        giornata = []
        for (let m = 0; m <= 1440; m += 12) giornata.push([m, calcola(new Date(mezzanotte + m * 60000)).altezza])
        giornataDi = chiave
      }
      const cl = cielo(c.adesso)
      const mezzo = minutiRoma(c.mezzogiorno)
      const sera = adesso > mezzo
      const alt = c.altezza
      el.querySelector('[data-svg]').innerHTML = disegnaSVG({ lang, c, cl, adesso, giornata, sera })
      el.querySelector('[data-alba]').textContent = ora(c.sorge)
      el.querySelector('[data-tramonto]').textContent = ora(c.tramonta)
      el.querySelector('[data-durata]').textContent = durata(c.durata)
      el.querySelector('[data-altezza]').textContent = `${num(lang, alt)}°`
      const fase = alt < -6 ? 'notte' : alt < -0.833 ? 'blu' : alt < 6 ? 'oro' : 'giorno'
      foto.dataset.fase = fase
      api.stato(stato, { notte: t(lang, 'notte'), blu: t(lang, 'oraBlu'), oro: t(lang, 'oraOro'), giorno: t(lang, 'giorno') }[fase], fase === 'notte' ? '' : 'ok')
      // la nebbia: più fitta di notte e all'alba (novembre in pianura), quasi niente a mezzogiorno
      foto.style.setProperty('--sole-nebbia', (0.22 + 0.2 * (1 - liscio(-6, 14, alt))).toFixed(2))
      // il fumetto del sole
      const cima = calcola(c.mezzogiorno).altezza
      const f = L.f
      const testo = fase === 'notte' ? f.notte : fase === 'blu' ? (sera ? f.bluS : f.bluM) : fase === 'oro' ? (sera ? f.oroS : f.oroM)
        : Math.abs(adesso - mezzo) < 40 ? f.cima(`${num(lang, cima, 0)}°`) : sera ? f.scende : f.sale
      const x = 24 + (adesso / 1440) * 592
      const giorno = alt > -0.833
      const y = giorno ? Y(alt) : Math.max(Y(alt), TERRA + 16)
      fumetto.hidden = fase === 'notte'
      fumetto.textContent = testo
      fumetto.style.left = `${((x / W) * 100).toFixed(2)}%`
      fumetto.style.top = `${((y / 420) * 100).toFixed(2)}%`
      fumetto.dataset.lato = x > W * 0.62 ? 'sx' : 'dx'
      fumetto.dataset.giu = giorno ? '0' : '1'
      // le battute: prima quella che c'entra con adesso
      const B = L.b
      const domani = calcola(new Date(c.adesso.getTime() + 864e5)).durata
      const diff = Math.round((domani - c.durata) / 60000)
      const minuti = (n) => lang === 'it' ? `${n} ${n === 1 ? 'minuto' : 'minuti'}` : `${n} ${n === 1 ? 'minute' : 'minutes'}`
      const pct = `${Math.round(cl.luna.luce * 100)}%`
      const lista = []
      if (fase === 'notte') lista.push(B.dorme(ora(calcola(new Date(c.adesso.getTime() + (sera ? 864e5 : 0))).sorge)), B.sotto(`${num(lang, -alt)}°`))
      if (fase === 'blu') lista.push(B.blu)
      if (fase === 'oro') lista.push(B.oro)
      if (fase === 'giorno' && alt > 0.4) lista.push(B.ombra(num(lang, 1 / Math.tan(alt * RAD))))
      lista.push(B.tramonto(ora(c.tramonta), ora(new Date(c.tramonta.getTime() - 60000))))
      lista.push(diff <= -1 ? B.meno(minuti(-diff)) : diff >= 1 ? B.piu(minuti(diff)) : B.fermo)
      if (cl.luna.alt > 0) lista.push(cl.luna.cresce ? B.lunaSu(pct) : B.lunaGiu(pct))
      lista.push(B.mezzogiorno(ora(c.mezzogiorno)), B.giorno(durata(c.durata)), B.nebbia)
      if (lista.join() !== battute.join()) { battute = lista; quale = 0; battuta.textContent = battute[0] }
    }
    const altra = () => {
      if (!battute.length) return
      quale = (quale + 1) % battute.length
      battuta.textContent = battute[quale]
      battuta.classList.remove('lab-sole__battuta--nuova')
      void battuta.offsetWidth
      battuta.classList.add('lab-sole__battuta--nuova')
    }
    const bottone = el.querySelector('.lab-sole__altra')
    bottone.addEventListener('click', altra)
    disegna()
    const timer = setInterval(() => { if (!document.hidden) disegna() }, 60_000)
    const vis = () => { if (!document.hidden) disegna() }
    document.addEventListener('visibilitychange', vis)
    // le animazioni CSS si fermano quando il foglio non si vede
    const smetti = api.quandoVisibile?.(foto, (si) => { foto.dataset.fermo = si ? '0' : '1' })
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', vis)
      bottone.removeEventListener('click', altra)
      smetti?.()
    }
  },
}
