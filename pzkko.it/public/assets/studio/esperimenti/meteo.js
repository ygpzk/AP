// 09 · Meteo vivo. Il meteo vero di Mantova dalla funzione /api/meteo/ (Open-Meteo,
// in cache dieci minuti sul server): temperatura, vento, pioggia delle ultime ore
// e un disegno che cambia con il codice WMO. Se il ponte non risponde, lo dice.
// La grafica (27.11): il «Telemuro», un vecchio televisore col meteorologo-chiocciola davanti
// alla cartina di Mantova, una scena per ogni famiglia del tempo; sotto il ritaglio della
// «Gazzetta del Muro» col termometro a mercurio e tre strumenti veri: la manica a vento
// (si gonfia e si gira col vento vero), il pluviometro (si riempie con la pioggia delle
// ultime 12 ore) e un ottotipo «M AN TOVA» che si sfoca con la visibilità.
// Le battute sono battute; i numeri sono solo quelli di /api/meteo/.
import { esc } from '../utils.js'

const T = {
  it: {
    nota: 'Il meteo vero di Mantova, da Open-Meteo attraverso /api/meteo/. La funzione tiene la risposta in cache dieci minuti: il servizio non vede ogni visita. Le battute invece sono nostre.',
    vento: 'vento',
    pioggia: 'pioggia 12 h',
    neve: 'neve',
    visibilita: 'visibilità',
    adesso: 'adesso',
    nonRisponde: 'il meteo non risponde',
    pronta: 'Open-Meteo',
    attesa: 'guardo fuori…',
    gradi: '°C',
    kmh: 'km/h',
    mm: 'mm',
    m: 'm',
    rilevato: 'rilevato alle',
    diretta: 'in diretta',
    meteo: 'meteo',
    testata: 'La Gazzetta del Muro',
    sezione: 'il tempo · edizione di Mantova',
    chiedi: 'senti la chiocciola',
    sintonizzo: 'sintonizzo l’antenna…',
    segnale: 'segnale assente',
    torno: 'torno subito',
    calma: '(sono una chiocciola: con calma)',
    timbro: 'non pervenuto',
    postit: 'non toccate l’antenna!',
    da: 'da',
    lontano: '← Milano (lontano)',
    figura: (cielo, gradi) => `Il Telemuro col meteorologo-chiocciola davanti alla cartina, che indica Mantova: ${cielo}, ${gradi}.`,
    figuraGiu: 'Il Telemuro senza segnale, col monoscopio e un biglietto «torno subito»: il meteo non risponde.',
    figuraAttesa: 'Il Telemuro si sta sintonizzando.',
    bussola: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  },
  en: {
    nota: 'The real weather in Mantova, from Open-Meteo through /api/meteo/. The function caches the answer for ten minutes: the service does not see every visit. The jokes, though, are ours.',
    vento: 'wind',
    pioggia: 'rain 12 h',
    neve: 'snow',
    visibilita: 'visibility',
    adesso: 'now',
    nonRisponde: 'weather is not answering',
    pronta: 'Open-Meteo',
    attesa: 'looking outside…',
    gradi: '°C',
    kmh: 'km/h',
    mm: 'mm',
    m: 'm',
    rilevato: 'observed at',
    diretta: 'live',
    meteo: 'weather',
    testata: 'The Wall Gazette',
    sezione: 'weather · Mantova edition',
    chiedi: 'ask the snail',
    sintonizzo: 'tuning the antenna…',
    segnale: 'no signal',
    torno: 'back soon',
    calma: '(I’m a snail: give it time)',
    timbro: 'not received',
    postit: 'don’t touch the antenna!',
    da: 'from',
    lontano: '← Milan (far away)',
    figura: (cielo, gradi) => `The Telemuro TV with the snail weatherman in front of the map, pointing at Mantova: ${cielo}, ${gradi}.`,
    figuraGiu: 'The Telemuro TV with no signal, a test card and a «back soon» note: the weather is not answering.',
    figuraAttesa: 'The Telemuro TV is tuning in.',
    bussola: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]

// le battute, per famiglia del tempo (e la notte serena a parte)
const BATTUTE = {
  it: {
    sereno: [
      'Sereno. La chiocciola ha messo gli occhiali da sole: oggi esce dal guscio.',
      'Sole su Mantova: i lavori in corso procedono abbronzati.',
      'Neanche una nuvola. Se piove è il vicino che annaffia i gerani.',
    ],
    notte: [
      'Sereno di notte. Occhiali da sole lo stesso: è una questione di stile.',
      'Cielo pulito e stelle accese: la chiocciola fa il turno di notte.',
    ],
    poco: [
      'Un po’ di sole e un po’ di nuvole: il tempo non ha ancora deciso, come noi.',
      'Nuvole sparse. Il sole fa capolino come chi arriva tardi al lavoro.',
      'Variabile: porta ombrello e occhiali, e decidi in strada.',
    ],
    nuvoloso: [
      'Coperto. Grigio padano d’ordinanza: cinquanta sfumature, tutte uguali.',
      'Il cielo è un foglio di cartongesso. Lavori in corso anche lassù.',
      'Nuvoloso: perfetto per stare dentro e dire che fuori è brutto.',
    ],
    nebbia: [
      'Nebbia. Visibilità: zero, come sempre.',
      'La chiocciola è davanti alla cartina. Fidatevi: c’è.',
      'Nebbia padana: si taglia col coltello e si serve coi tortelli.',
    ],
    pioggia: [
      'Piove! La chiocciola è felicissima: per lei oggi è festa.',
      'Ombrello aperto, guscio lucido. Una lumaca non chiede altro.',
      'Pioggia su Mantova: i laghi fanno il pieno.',
    ],
    neve: [
      'Nevica. La chiocciola ha messo la sciarpa e chiama il guscio «igloo».',
      'Neve sul muro: i graffiti vanno in letargo.',
      'Fiocchi in arrivo. Scuole chiuse? No. Mi dispiace.',
    ],
    temporale: [
      'Temporale. Il meteorologo è rientrato nel guscio e non risponde.',
      'Tuoni e fulmini: staccate la spina del televisore, non la chiocciola.',
      'La chiocciola vi saluta da dentro il guscio. Linea allo studio.',
    ],
    giu: [
      'Il meteo non risponde. La chiocciola è uscita a guardare il cielo di persona: torna presto (è una chiocciola: presto per modo di dire).',
      'Segnale assente. Affacciatevi alla finestra: è gratis e funziona sempre.',
      'Il ponte col meteo è giù. Riprovo da solo fra qualche minuto.',
    ],
    attesa: ['Sintonizzo l’antenna. Un attimo, c’è la stagnola da sistemare.'],
  },
  en: {
    sereno: [
      'Clear skies. The snail put its sunglasses on: today it leaves the shell.',
      'Sun over Mantova: the roadworks are getting a tan.',
      'Not a cloud. If it rains, it’s the neighbour watering the geraniums.',
    ],
    notte: [
      'Clear night. Sunglasses anyway: it’s a matter of style.',
      'Clean sky, stars on: the snail is on the night shift.',
    ],
    poco: [
      'A bit of sun, a bit of cloud: the weather hasn’t decided yet, like us.',
      'Scattered clouds. The sun peeks in like someone late for work.',
      'Changeable: bring an umbrella and sunglasses, decide on the street.',
    ],
    nuvoloso: [
      'Overcast. Regulation Po valley grey: fifty shades, all the same.',
      'The sky is a sheet of plasterboard. Roadworks up there too.',
      'Cloudy: perfect for staying in and saying it’s ugly outside.',
    ],
    nebbia: [
      'Fog. Visibility: zero, as usual.',
      'The snail is in front of the map. Trust us: it is.',
      'Po valley fog: you cut it with a knife and serve it with tortelli.',
    ],
    pioggia: [
      'It’s raining! The snail is thrilled: for snails, today is a holiday.',
      'Umbrella open, shell shiny. A snail asks for nothing more.',
      'Rain over Mantova: the lakes are filling up.',
    ],
    neve: [
      'Snowing. The snail put its scarf on and calls its shell «the igloo».',
      'Snow on the wall: the graffiti go into hibernation.',
      'Flakes incoming. Schools closed? No. Sorry.',
    ],
    temporale: [
      'Thunderstorm. The weatherman went back into its shell and is not answering.',
      'Thunder and lightning: unplug the TV, not the snail.',
      'The snail greets you from inside its shell. Back to the studio.',
    ],
    giu: [
      'The weather is not answering. The snail went out to look at the sky in person: back soon (it’s a snail: «soon» is relative).',
      'No signal. Look out of the window: it’s free and it always works.',
      'The weather bridge is down. I’ll try again on my own in a few minutes.',
    ],
    attesa: ['Tuning the antenna. One moment, the tinfoil needs fixing.'],
  },
}

// la temperatura: una fascia e una frase
const FASCE = [
  [0, 'gelo', 'Sotto zero: anche il mercurio vorrebbe un caffè caldo.', 'Below zero: even the mercury wants a hot coffee.'],
  [8, 'freddo', 'Fa freddo: piumino, sciarpa e guscio ben chiuso.', 'Cold: puffer jacket, scarf and shell shut tight.'],
  [16, 'fresco', 'Fresco: la giacca sì, il piumino forse.', 'Cool: jacket yes, puffer maybe.'],
  [24, 'mite', 'Si sta bene. Sospetto.', 'It’s nice out. Suspicious.'],
  [30, 'caldo', 'Caldo: la chiocciola cerca ombra e un ghiacciolo.', 'Warm: the snail is looking for shade and an ice lolly.'],
  [Infinity, 'afa', 'Afa padana: si suda anche stando fermi. Soprattutto stando fermi.', 'Po valley swelter: you sweat standing still. Especially standing still.'],
]
const fascia = (gradi) => FASCE.find(([max]) => gradi < max)

const NOTE = {
  vento: [[5, 'calma piatta', 'flat calm'], [15, 'brezza', 'breeze'], [30, 'vento vero', 'proper wind'], [50, 'tenetevi il cappello', 'hold on to your hat'], [Infinity, 'chiudete le persiane', 'shut the shutters']],
  pioggia: [[0.05, 'asciutto', 'bone dry'], [2, 'due gocce', 'a few drops'], [10, 'bagnato', 'wet'], [25, 'secchiate', 'buckets'], [Infinity, 'trabocca!', 'overflowing!']],
  vis: [[1000, 'zero, come sempre', 'zero, as usual'], [5000, 'così così', 'so-so'], [15000, 'si vede bene', 'clear view'], [Infinity, 'si vedono le Alpi (quasi)', 'you can almost see the Alps']],
}
const nota = (tipo, v, lang) => { const r = NOTE[tipo].find(([max]) => v < max); return r ? r[lang === 'it' ? 1 : 2] : '' }

const CODICI = {
  0: ['sereno', 'clear'], 1: ['quasi sereno', 'mostly clear'], 2: ['poco nuvoloso', 'partly cloudy'], 3: ['nuvoloso', 'cloudy'],
  45: ['nebbia', 'fog'], 48: ['nebbia ghiacciata', 'freezing fog'],
  51: ['pioviggine', 'drizzle'], 53: ['pioviggine', 'drizzle'], 55: ['pioviggine forte', 'heavy drizzle'],
  56: ['pioviggine ghiacciata', 'freezing drizzle'], 57: ['pioviggine ghiacciata', 'freezing drizzle'],
  61: ['pioggia', 'rain'], 63: ['pioggia', 'rain'], 65: ['pioggia forte', 'heavy rain'],
  66: ['pioggia ghiacciata', 'freezing rain'], 67: ['pioggia ghiacciata', 'freezing rain'],
  71: ['neve', 'snow'], 73: ['neve', 'snow'], 75: ['neve forte', 'heavy snow'], 77: ['granelli di neve', 'snow grains'],
  80: ['rovesci', 'showers'], 81: ['rovesci', 'showers'], 82: ['rovesci forti', 'heavy showers'],
  85: ['rovesci di neve', 'snow showers'], 86: ['rovesci di neve', 'snow showers'],
  95: ['temporale', 'thunderstorm'], 96: ['temporale con grandine', 'thunderstorm with hail'], 99: ['temporale con grandine', 'thunderstorm with hail'],
}
const famiglia = (c) => (c === 0 || c === 1 ? 'sereno' : c === 2 ? 'poco' : c === 3 ? 'nuvoloso' : [45, 48].includes(c) ? 'nebbia' : [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(c) ? 'pioggia' : [71, 73, 75, 77, 85, 86].includes(c) ? 'neve' : [95, 96, 99].includes(c) ? 'temporale' : 'nuvoloso')
const etichetta = (c, lang) => (CODICI[c] ? CODICI[c][lang === 'it' ? 0 : 1] : '—')

// ── i disegni ─────────────────────────────────────────────────────────────────────────────────────────────────────
const f1 = (n) => Math.round(n * 10) / 10
const INK = '#24406e' // l'inchiostro blu dei manifesti

// la spirale del guscio
function spirale(cx, cy, giri, r0, r1) {
  const n = 120
  let d = ''
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * giri * Math.PI * 2 + 2.2
    const r = r0 + (r1 - r0) * (i / n)
    d += `${i ? 'L' : 'M'}${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`
  }
  return d
}

// il televisore: mobile di legno, antenna a baffo con la stagnola, manopole, piedini
function mobile(lang) {
  const griglia = Array.from({ length: 9 }, (_, i) => `<rect x="322" y="${190 + i * 6}" width="54" height="2.6" rx="1.3"/>`).join('')
  const tacche = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return `<line x1="${f1(349 + Math.cos(a) * 21)}" y1="${f1(104 + Math.sin(a) * 21)}" x2="${f1(349 + Math.cos(a) * 24)}" y2="${f1(104 + Math.sin(a) * 24)}"/>`
  }).join('')
  const ghiaccioli = Array.from({ length: 14 }, (_, i) => {
    const x = 20 + i * 26 + (i % 3) * 4, h = 6 + ((i * 7) % 5) * 2.4
    return `<path d="M${x} 270l3 ${h}l3 -${h}z"/>`
  }).join('')
  return `<svg class="lab-meteo__mobile" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="mt-legno" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6438"/><stop offset=".55" stop-color="#7b4a25"/><stop offset="1" stop-color="#5c3417"/></linearGradient>
      <pattern id="mt-venature" width="64" height="11" patternUnits="userSpaceOnUse"><path d="M0 5c10-4 18 3 32 0s22-3 32 0" fill="none" stroke="rgba(40,18,4,.28)" stroke-width="1"/><path d="M0 9c14-2 20 2 34 0s20-1 30 0" fill="none" stroke="rgba(255,220,170,.08)" stroke-width="1"/></pattern>
      <radialGradient id="mt-manopola" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f4f1ea"/><stop offset=".6" stop-color="#b9b2a4"/><stop offset="1" stop-color="#6d665b"/></radialGradient>
    </defs>
    <g class="lab-meteo__antenna">
      <path d="M205 30L150 3M205 30L262 6" stroke="#2c2c2c" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="150" cy="3" r="3.2" fill="#2c2c2c"/>
      <path d="M255 2l9-2 5 5-2 7-8 2-6-4z" fill="#cfd3da" stroke="#8b919b" stroke-width=".8"/><path d="M258 4l5 1-2 5z" fill="#eef1f5"/>
    </g>
    <ellipse cx="205" cy="31" rx="17" ry="7" fill="#2a2522"/>
    <rect x="4" y="30" width="392" height="242" rx="18" fill="url(#mt-legno)"/>
    <rect x="4" y="30" width="392" height="242" rx="18" fill="url(#mt-venature)"/>
    <rect x="5.5" y="31.5" width="389" height="239" rx="17" fill="none" stroke="rgba(255,230,190,.25)" stroke-width="1.5"/>
    <rect x="9" y="37" width="295" height="225" rx="30" fill="#1b1a19" stroke="#0d0c0b" stroke-width="2"/>
    <rect x="310" y="44" width="80" height="214" rx="7" fill="#2d2622"/>
    <text x="350" y="64" text-anchor="middle" class="lab-meteo__marca">TELEMURO</text>
    <g stroke="#d9c9a3" stroke-width="1.2" opacity=".7">${tacche}</g>
    <circle cx="349" cy="104" r="18" fill="url(#mt-manopola)" stroke="#111" stroke-width="1.5"/>
    <path d="M349 104l0-15" stroke="#3a2c22" stroke-width="3" stroke-linecap="round" class="lab-meteo__lancetta"/>
    <text x="349" y="136" text-anchor="middle" class="lab-meteo__targhetta">${lang === 'it' ? 'CANALE' : 'CHANNEL'}</text>
    <circle cx="349" cy="158" r="12" fill="url(#mt-manopola)" stroke="#111" stroke-width="1.5"/>
    <path d="M349 158l8-6" stroke="#3a2c22" stroke-width="2.4" stroke-linecap="round"/>
    <text x="349" y="181" text-anchor="middle" class="lab-meteo__targhetta">VOLUME</text>
    <g fill="#16110e">${griglia}</g>
    <circle cx="380" cy="250" r="2.6" fill="#ff3b2f" class="lab-meteo__spia"/>
    <path d="M34 272h34l-4 16h-26zM332 272h34l-4 16h-26z" fill="#3b2412"/>
    <path class="lab-meteo__cumulo lab-meteo__cumulo--tv" data-f="neve" d="M10 34c8-14 30-10 40-4 14-12 42-10 52-2 16-10 44-8 56 0 12-8 26-10 36-4 18-10 48-10 62 0 14-10 40-10 52-2 18-12 46-8 54 2 8 0 14 4 22 12z" fill="#fbfdff" stroke="#c6d6e6" stroke-width="1.2"/>
    <g data-tt="gelo" fill="#d9f0ff" stroke="#9cc6e6" stroke-width=".8">${ghiaccioli}</g>
  </svg>`
}

// la cartina con il meteorologo
function mappa(lang) {
  const raggi = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    return `<line x1="${f1(Math.cos(a) * 22)}" y1="${f1(Math.sin(a) * 22)}" x2="${f1(Math.cos(a) * (i % 2 ? 28 : 31))}" y2="${f1(Math.sin(a) * (i % 2 ? 28 : 31))}"/>`
  }).join('')
  const nuvola = (cls, fill, x, y, s) => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})"><path d="M-26 12h50a12 12 0 0 0 1-24A20 20 0 0 0-14-14a13 13 0 0 0-12 26z" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M-18 4a8 8 0 0 1 8-7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g></g>`
  const campi = Array.from({ length: 16 }, (_, i) => {
    const x = (i * 53) % 260, y = 20 + ((i * 37) % 150)
    return `<rect x="${x}" y="${y}" width="${28 + (i % 4) * 9}" height="${16 + (i % 3) * 7}" transform="rotate(${(i % 5) - 2} ${x} ${y})"/>`
  }).join('')
  return `<svg class="lab-meteo__mappa" viewBox="0 0 280 210" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="mt-righe" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(36,64,110,.12)" stroke-width="1.4"/></pattern>
      <radialGradient id="mt-sole" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff2a6"/><stop offset=".6" stop-color="#ffd23f"/><stop offset="1" stop-color="#f5a300"/></radialGradient>
      <linearGradient id="mt-cielo-notte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2b55"/><stop offset="1" stop-color="#2f4a7a"/></linearGradient>
    </defs>
    <rect width="280" height="210" fill="#c7dea2"/>
    <g fill="#d6e8b4" opacity=".9">${campi}</g>
    <rect width="280" height="210" fill="url(#mt-righe)"/>
    <g stroke="rgba(36,64,110,.13)" stroke-width="1">${[35, 70, 105, 140, 175].map((y) => `<line x1="0" y1="${y}" x2="280" y2="${y}"/>`).join('')}${[40, 80, 120, 160, 200, 240].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="210"/>`).join('')}</g>
    <path d="M-6 150C38 136 70 164 112 151S182 132 212 143 262 160 290 140" fill="none" stroke="#3f7fcc" stroke-width="7" stroke-linecap="round"/>
    <path d="M-6 150C38 136 70 164 112 151S182 132 212 143 262 160 290 140" fill="none" stroke="#8ec1f2" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 9" class="lab-meteo__corrente"/>
    <path d="M176-4C182 26 170 50 172 74" fill="none" stroke="#3f7fcc" stroke-width="3" stroke-linecap="round"/>
    <path d="M170 86C170 70 196 62 214 72S230 98 222 110" fill="none" stroke="#3f7fcc" stroke-width="9" stroke-linecap="round"/>
    <path d="M222 110C228 124 236 134 234 147" fill="none" stroke="#3f7fcc" stroke-width="3" stroke-linecap="round"/>
    <text x="252" y="141" class="lab-meteo__fiume">Po</text>
    <text x="180" y="12" class="lab-meteo__fiume lab-meteo__fiume--piccolo">↑ Verona</text>
    <text x="8" y="58" class="lab-meteo__fiume lab-meteo__fiume--piccolo">${esc(t(lang, 'lontano'))}</text>
    <g class="lab-meteo__castello" fill="#efe3c6" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"><path d="M183 92V80h3v2h2v-2h3v12zM201 92V80h3v2h2v-2h3v12z"/><path d="M189 92V85h1.6v1.5h1.8V85h1.6v1.5h1.8V85h1.6v1.5h1.8V85h1.6v1.5h1.8V85H203v7z"/><path d="M194 92v-3a2 2 0 0 1 4 0v3" fill="${INK}"/></g>
    <circle cx="196" cy="98" r="5" fill="none" stroke="#b3121f" stroke-width="2" class="lab-meteo__onda"/>
    <circle cx="196" cy="98" r="5.2" fill="#b3121f" stroke="#fff" stroke-width="2"/>
    <text x="196" y="125" text-anchor="middle" class="lab-meteo__citta">MANTOVA</text>

    <g class="lab-meteo__simbolo" transform="translate(236 50)">
      <g data-f="sereno poco" class="lab-meteo__sole" data-giorno-si>
        <g class="lab-meteo__raggi" stroke="#f5a300" stroke-width="3.2" stroke-linecap="round">${raggi}</g>
        <circle r="19" fill="url(#mt-sole)" stroke="#d48600" stroke-width="2"/>
        <circle cx="-6" cy="-3" r="1.8" fill="${INK}"/><circle cx="6" cy="-3" r="1.8" fill="${INK}"/>
        <path d="M-7 5q7 7 14 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="-11" cy="4" r="3" fill="#ff8a5c" opacity=".6"/><circle cx="11" cy="4" r="3" fill="#ff8a5c" opacity=".6"/>
      </g>
      <g data-f="sereno poco" class="lab-meteo__luna" data-giorno-no>
        <path d="M6-20A20 20 0 1 0 14 14 16 16 0 1 1 6-20z" fill="#fff3b8" stroke="#d4b545" stroke-width="2"/>
        <circle cx="-4" cy="-2" r="1.6" fill="${INK}"/><path d="M-9 6q4 3 8 0" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
        <path class="lab-meteo__stella" d="M-34 -14l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="#fff6c8"/>
        <path class="lab-meteo__stella lab-meteo__stella--2" d="M24 22l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill="#fff6c8"/>
      </g>
      <g data-f="poco">${nuvola('lab-meteo__nuvola', '#ffffff', 10, 14, .78)}</g>
      <g data-f="nuvoloso nebbia">${nuvola('lab-meteo__nuvola lab-meteo__nuvola--dietro', '#c9ced6', -20, -6, .7)}${nuvola('lab-meteo__nuvola', '#e6e9ee', 6, 8, .95)}</g>
      <g data-f="pioggia neve temporale">${nuvola('lab-meteo__nuvola lab-meteo__nuvola--dietro', '#7d8796', -18, -8, .7)}${nuvola('lab-meteo__nuvola', '#a3abb8', 4, 4, 1)}</g>
      <g data-f="pioggia" fill="#3f7fcc"><path class="lab-meteo__goccina" d="M-12 22q3 5 0 8-3-3 0-8z"/><path class="lab-meteo__goccina" d="M2 24q3 5 0 8-3-3 0-8z"/><path class="lab-meteo__goccina" d="M16 22q3 5 0 8-3-3 0-8z"/></g>
      <g data-f="neve" stroke="#fff" stroke-width="2" stroke-linecap="round" class="lab-meteo__fiocco"><path d="M0 18v16M-7 22l14 8M-7 30l14-8"/></g>
      <path data-f="temporale" class="lab-meteo__saetta" d="M4 10l-12 18h9l-5 15 16-21h-9l6-12z" fill="#ffd400" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    </g>

    <path data-f="neve" class="lab-meteo__cumulo" d="M-4 212V166c14-10 28-4 42-9s30 5 44 0 26-9 44-3 30 5 44-2 28-7 44 0 22 2 34-3v61z" fill="#fbfdff" stroke="#c6d6e6" stroke-width="1"/>
    <g data-f="pioggia" class="lab-meteo__pozza"><ellipse cx="82" cy="172" rx="66" ry="6" fill="#6aa7e8" opacity=".6"/><ellipse class="lab-meteo__cerchio" cx="34" cy="172" rx="8" ry="2" fill="none" stroke="#e6f3ff" stroke-width="1"/><ellipse class="lab-meteo__cerchio lab-meteo__cerchio--2" cx="128" cy="173" rx="8" ry="2" fill="none" stroke="#e6f3ff" stroke-width="1"/></g>

    <g transform="translate(4 -30)"><g class="lab-meteo__lumaca">
      <ellipse cx="72" cy="201" rx="60" ry="5" fill="rgba(20,30,50,.22)"/>
      <g class="lab-meteo__bacchetta" data-f="sereno poco nuvoloso neve"><line x1="128" y1="157" x2="185" y2="127" stroke="#6b3f1f" stroke-width="2.6" stroke-linecap="round"/><circle cx="185" cy="127" r="2.8" fill="#b3121f"/></g>
      <g class="lab-meteo__corpo" data-no="temporale">
        <path d="M10 198c2-8 26-11 58-10h36c5-16 1-34 6-46 6-12 22-10 24 4 2 14-4 32 0 48 2 6-4 7-10 7H16c-6 0-7-1-6-3z" fill="#efe3c6" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>
        <g fill="#d6c59c"><circle cx="30" cy="194" r="1.4"/><circle cx="50" cy="193" r="1.2"/><circle cx="92" cy="194" r="1.4"/><circle cx="120" cy="184" r="1.2"/></g>
        <path d="M114 142C110 128 106 120 104 112M126 142C127 130 131 122 134 114" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
        <g class="lab-meteo__occhi">
          <circle cx="104" cy="108" r="5.6" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="105.6" cy="108.6" r="2.4" fill="#161616"/>
          <circle cx="134" cy="110" r="5.6" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="135.6" cy="110.6" r="2.4" fill="#161616"/>
        </g>
        <g data-f="nuvoloso" fill="#efe3c6" stroke="${INK}" stroke-width="1.6"><path d="M98.4 108a5.6 5.6 0 0 1 11.2 0z"/><path d="M128.4 110a5.6 5.6 0 0 1 11.2 0z"/></g>
        <g data-f="sereno" class="lab-meteo__occhiali"><path d="M96 104h16l-1 7c-1 3-13 3-14 0zM126 106h16l-1 7c-1 3-13 3-14 0z" fill="#111" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/><path d="M112 106c4-2 10-1 14 1" fill="none" stroke="#111" stroke-width="1.8"/><path d="M99 106l4 0M129 108l4 0" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>
        <path data-no="sereno poco pioggia" d="M116 156q6 5 12 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
        <path data-f="sereno poco pioggia" d="M115 154q7 10 14 0z" fill="#8a2230" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="132" cy="160" r="3.2" fill="#f2a0a0" opacity=".75"/>
        <path data-tt="caldo afa" class="lab-meteo__sudore" d="M104 134q3 5 0 8-3-3 0-8z" fill="#8ec1f2" stroke="${INK}" stroke-width=".8"/>
        <g data-no="neve"><path d="M112 172l8 4-8 4zM128 172l-8 4 8 4z" fill="#b3121f" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="120" cy="176" r="2.2" fill="#7d0b14"/></g>
        <g data-f="neve"><path d="M106 168c8 5 22 5 30 0l1 8c-9 5-23 5-31 0z" fill="#b3121f" stroke="${INK}" stroke-width="1.4"/><path d="M110 172v6M116 173v6M122 173v6M128 172v6" stroke="#fff" stroke-width="2"/><path class="lab-meteo__sciarpa" d="M130 174l8 18 6-3-6-16z" fill="#b3121f" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="130" cy="150" r="3" fill="#e0453c"/></g>
      </g>
      <g class="lab-meteo__guscio">
        <circle cx="58" cy="158" r="37" fill="#e8733a" stroke="${INK}" stroke-width="2.4"/>
        <path d="${spirale(58, 158, 2.6, 2, 33)}" fill="none" stroke="#a8401c" stroke-width="3.2" stroke-linecap="round"/>
        <path d="${spirale(58, 158, 2.6, 2, 33)}" fill="none" stroke="#ffb27a" stroke-width="1" stroke-linecap="round" transform="translate(-1.2 -1.2)"/>
        <ellipse cx="44" cy="136" rx="12" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 44 136)"/>
        <path data-f="neve" class="lab-meteo__cumulo lab-meteo__cumulo--guscio" d="M26 140c4-12 18-18 32-18s28 6 32 18c-6-4-12-2-16 0-6-4-14-4-18 0-6-4-14-4-18 0-4-2-8-2-12 0z" fill="#fbfdff" stroke="#c6d6e6" stroke-width="1"/>
        <g data-f="temporale" class="lab-meteo__sbircia"><ellipse cx="92" cy="176" rx="9" ry="7" fill="#1c1510"/><circle cx="89" cy="175" r="2.4" fill="#fff"/><circle cx="96" cy="175" r="2.4" fill="#fff"/><circle cx="89.8" cy="175.4" r="1.1" fill="#111"/><circle cx="96.8" cy="175.4" r="1.1" fill="#111"/></g>
      </g>
      <g data-f="pioggia" class="lab-meteo__ombrello">
        <path d="M120 162V86" stroke="#2c2c2c" stroke-width="2.4" stroke-linecap="round"/><path d="M120 162q0 6-5 6" fill="none" stroke="#2c2c2c" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M82 92Q84 58 120 54 156 58 158 92q-6-6-12.7 0-6-6-12.7 0-6-6-12.6 0-6-6-12.7 0-6-6-12.6 0-6-6-12.7 0z" fill="#b3121f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M120 54C112 66 108 80 107.3 92M120 54C128 66 132 80 132.7 92" fill="none" stroke="#fff" stroke-width="2" opacity=".85"/>
        <path d="M120 54v-6" stroke="#2c2c2c" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    </g></g>
  </svg>`
}

// la manica a vento (segmenti a strisce che si stringono)
function manica() {
  const seg = Array.from({ length: 5 }, (_, i) => {
    const x0 = 16 + i * 18, x1 = x0 + 18
    const h = (x) => 10 - (4.6 * (x - 16)) / 90
    return `<path d="M${x0} ${f1(16 - h(x0))}L${x1} ${f1(16 - h(x1))}L${x1} ${f1(16 + h(x1))}L${x0} ${f1(16 + h(x0))}z" fill="${i % 2 ? '#f6f1e6' : '#d6402b'}"/>`
  }).join('')
  return `<svg class="lab-meteo__disegno" viewBox="0 0 120 84" aria-hidden="true" focusable="false">
    <g data-verso>
      <path d="M8 82h14" stroke="#4a4a4a" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="10" x2="14" y2="82" stroke="#6a6a6a" stroke-width="3.2" stroke-linecap="round"/>
      <line x1="13" y1="10" x2="13" y2="82" stroke="#bbb" stroke-width="1"/>
      <g class="lab-meteo__manica"><g class="lab-meteo__sventola">${seg}<path d="M16 6L106 11.4 106 20.6 16 26z" fill="none" stroke="#161616" stroke-width="1.3" stroke-linejoin="round"/><ellipse cx="16" cy="16" rx="2.4" ry="10" fill="#e9e2d0" stroke="#161616" stroke-width="1.3"/></g></g>
      <circle cx="14" cy="9" r="2.6" fill="#b3121f"/>
    </g>
  </svg>`
}

// il pluviometro: imbuto e cilindro graduato
function pluviometro() {
  const tacche = Array.from({ length: 11 }, (_, i) => {
    const y = 80 - i * 5.4
    return `<line x1="44" y1="${f1(y)}" x2="${i % 5 ? 49 : 52}" y2="${f1(y)}"/>`
  }).join('')
  return `<svg class="lab-meteo__disegno" viewBox="0 0 76 88" aria-hidden="true" focusable="false">
    <g data-f="pioggia temporale" fill="#3f7fcc"><path class="lab-meteo__stilla" d="M36 -6q3 5 0 8-3-3 0-8z"/><path class="lab-meteo__stilla lab-meteo__stilla--2" d="M30 -6q3 5 0 8-3-3 0-8z"/><path class="lab-meteo__stilla lab-meteo__stilla--3" d="M42 -6q3 5 0 8-3-3 0-8z"/></g>
    <rect x="25.6" y="26" width="18.8" height="56" fill="#3f7fcc" class="lab-meteo__acqua"/>
    <path d="M12 8h46l-13 16h-20z" fill="rgba(214,236,255,.55)" stroke="#161616" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="24" y="24" width="22" height="60" rx="3" fill="rgba(214,236,255,.28)" stroke="#161616" stroke-width="1.5"/>
    <path d="M27 28v52" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>
    <g stroke="#161616" stroke-width="1">${tacche}</g>
    <text x="54" y="82" class="lab-meteo__scala">0</text><text x="54" y="55" class="lab-meteo__scala">10</text><text x="54" y="28" class="lab-meteo__scala">20</text>
    <path d="M18 84h34" stroke="#4a4a4a" stroke-width="3" stroke-linecap="round"/>
  </svg>`
}

// il termometro a mercurio, da -10 a 40 °C
function termometro() {
  const y = (g) => f1(120 - ((g + 10) / 50) * 106)
  const tacche = [-10, 0, 10, 20, 30, 40].map((g) => `<line x1="30" y1="${y(g)}" x2="36" y2="${y(g)}"/><text x="38" y="${f1(+y(g) + 3)}" class="lab-meteo__scala">${g}</text>`).join('')
  const fini = Array.from({ length: 26 }, (_, i) => `<line x1="30" y1="${y(-10 + i * 2)}" x2="33" y2="${y(-10 + i * 2)}"/>`).join('')
  return `<svg class="lab-meteo__termometro" viewBox="0 0 54 150" aria-hidden="true" focusable="false">
    <rect x="4" y="2" width="46" height="146" rx="6" fill="#f7f3ea" stroke="#161616" stroke-width="1.4"/>
    <circle cx="27" cy="6.5" r="1.8" fill="#888"/>
    <rect x="16" y="10" width="10" height="118" rx="5" fill="#fff" stroke="#161616" stroke-width="1.3"/>
    <rect x="18.6" y="14" width="4.8" height="106" rx="2.4" fill="#c8141f" class="lab-meteo__mercurio"/>
    <rect x="18.6" y="116" width="4.8" height="16" fill="#c8141f"/>
    <circle cx="21" cy="134" r="8.4" fill="#c8141f" stroke="#161616" stroke-width="1.3"/>
    <circle cx="18.4" cy="131.4" r="2.2" fill="#fff" opacity=".6"/>
    <g stroke="#161616" stroke-width=".8">${fini}</g><g stroke="#161616" stroke-width="1.1">${tacche}</g>
    <text x="38" y="141" class="lab-meteo__scala">°C</text>
  </svg>`
}

export default {
  id: 'meteo',
  titolo: { it: 'Meteo vivo', en: 'Live weather' },
  testo: {
    it: 'Che tempo fa davvero a Mantova adesso: temperatura, vento, pioggia delle ultime dodici ore e un disegno che cambia col codice del tempo.',
    en: 'The actual weather in Mantova right now: temperature, wind, rain over the last twelve hours and a drawing that changes with the weather code.',
  },
  tecnologie: ['Fetch', '/api/meteo', 'Open-Meteo'],
  monta(el, api) {
    const lang = api.lang
    const L = lang === 'it' ? 'it' : 'en'
    const gocce = Array.from({ length: 7 }, (_, i) => `<i style="--x:${8 + ((i * 37) % 86)}%;--y:${38 + ((i * 23) % 50)}%;--d:${(i * 1.37) % 6}s"></i>`).join('')
    el.innerHTML = `<div class="lab-meteo" data-meteo="attesa" data-giorno="1" data-temp="" style="--t:0;--v:0;--p:0;--sfoca:0px">
      <figure class="lab-meteo__icona" role="img" aria-label="${esc(t(lang, 'figuraAttesa'))}" data-icona>
        <div class="lab-meteo__tv">
          ${mobile(lang)}
          <div class="lab-meteo__schermo">
            ${mappa(lang)}
            <div class="lab-meteo__strato lab-meteo__pioggia" data-f="pioggia temporale"></div>
            <div class="lab-meteo__strato lab-meteo__neve" data-f="neve"></div>
            <div class="lab-meteo__strato lab-meteo__nebbia" data-f="nebbia"><i></i><i></i><i></i></div>
            <div class="lab-meteo__strato lab-meteo__fari" data-f="nebbia"><i></i><i></i></div>
            <div class="lab-meteo__strato lab-meteo__lampo" data-f="temporale"><svg viewBox="0 0 280 210" aria-hidden="true" focusable="false"><path d="M168 -4l-16 44 14-2-22 50 12-2-20 46 40-58-14 2 22-44-14 2 16-38z" fill="#fffbe0" stroke="#ffd400" stroke-width="2.5" stroke-linejoin="round"/></svg></div>
            <div class="lab-meteo__bollino"><span>${esc(t(lang, 'diretta'))}</span><b>CH 9</b></div>
            <div class="lab-meteo__sottopancia"><b>${esc(t(lang, 'meteo'))}</b><span class="lab-meteo__nastro"><span data-ticker>${esc(t(lang, 'sintonizzo'))}</span></span></div>
            <div class="lab-meteo__strato lab-meteo__statico" data-f="attesa"><b>${esc(t(lang, 'sintonizzo'))}</b></div>
            <div class="lab-meteo__strato lab-meteo__mono" data-f="giu">
              <div class="lab-meteo__barre"></div>
              <div class="lab-meteo__tondo"><b>TELEMURO</b><span>${esc(t(lang, 'segnale'))}</span></div>
              <p class="lab-meteo__biglietto"><b>${esc(t(lang, 'torno'))}</b><span>${esc(t(lang, 'calma'))}</span></p>
            </div>
            <div class="lab-meteo__vetro"></div>
          </div>
          <span class="lab-meteo__postit">${esc(t(lang, 'postit'))}</span>
        </div>
      </figure>
      <div class="lab-meteo__comandi"><button type="button" class="lab__bottone lab__bottone--fantasma" data-chiedi>${esc(t(lang, 'chiedi'))}</button></div>
      <div class="lab-meteo__testo">
        ${termometro()}
        <div class="lab-meteo__articolo">
          <p class="lab-meteo__testata"><span>${esc(t(lang, 'testata'))}</span><i>${esc(t(lang, 'sezione'))}</i></p>
          <div class="lab-meteo__riga"><b data-gradi>—</b><span data-cielo>${esc(t(lang, 'attesa'))}</span></div>
          <small data-luogo>Mantova · ${esc(t(lang, 'adesso'))}</small>
          <p class="lab-meteo__battuta" data-battuta aria-live="polite">${esc(BATTUTE[L].attesa[0])}</p>
          <p class="lab-meteo__frase" data-frase></p>
          <span class="lab-meteo__timbro" data-f="giu" aria-hidden="true">${esc(t(lang, 'timbro'))}</span>
        </div>
      </div>
      <div class="lab-meteo__numeri">
        <span class="lab-meteo__strumento" data-s="vento">${manica()}<b data-vento>—</b><small>${esc(t(lang, 'vento'))}</small><em data-nota-vento></em></span>
        <span class="lab-meteo__strumento" data-s="pioggia">${pluviometro()}<b data-pioggia>—</b><small>${esc(t(lang, 'pioggia'))}</small><em data-nota-pioggia></em></span>
        <span class="lab-meteo__strumento" data-s="vis"><span class="lab-meteo__ottotipo" aria-hidden="true"><span>M</span><span>A N</span><span>T O V A</span></span><b data-visibilita>—</b><small>${esc(t(lang, 'visibilita'))}</small><em data-nota-vis></em></span>
      </div>
      <div class="lab-meteo__gocce" data-f="pioggia temporale" aria-hidden="true">${gocce}</div>
    </div>
    <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const box = el.querySelector('[data-meteo]')
    const $ = (s) => el.querySelector(s)
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let ultimo = 0, inCorso = false, vivo = true, chiave = 'attesa', giro = Math.floor(Math.random() * 3), dati = null, annuisce = 0

    const numero = (n, cifre = 0) => n.toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB', { maximumFractionDigits: cifre })
    const scegli = () => {
      const lista = BATTUTE[L][chiave] || BATTUTE[L].attesa
      return lista[giro % lista.length]
    }
    // il nastro del telegiornale: i dati veri e la battuta, ripetuti due volte per girare senza salti
    function nastro() {
      let testo
      if (chiave === 'giu') testo = `${t(lang, 'segnale')} · ${t(lang, 'nonRisponde')} · ${t(lang, 'torno')}`
      else if (!dati) testo = t(lang, 'sintonizzo')
      else testo = `Mantova ${$('[data-gradi]').textContent} · ${$('[data-cielo]').textContent} · ${t(lang, 'vento')} ${$('[data-vento]').textContent} · ${scegli()}`
      const tk = $('[data-ticker]')
      tk.textContent = `${testo}  ✦  ${testo}  ✦  `
      tk.style.animationDuration = `${Math.max(12, Math.round(testo.length * 0.22))}s`
    }
    function battuta() {
      $('[data-battuta]').textContent = scegli()
      nastro()
    }

    function disegna(d) {
      const f = famiglia(d.codice)
      const notte = d.giorno === 0
      chiave = f === 'sereno' && notte ? 'notte' : f
      box.dataset.meteo = f
      box.dataset.giorno = notte ? '0' : '1'
      const gradi = Number.isFinite(d.temperatura) ? `${Math.round(d.temperatura)}${t(lang, 'gradi')}` : '—'
      $('[data-gradi]').textContent = gradi
      $('[data-cielo]').textContent = etichetta(d.codice, lang)
      const ora = typeof d.ora === 'string' && /T(\d\d:\d\d)/.exec(d.ora)
      $('[data-luogo]').textContent = ora ? `Mantova · ${t(lang, 'rilevato')} ${ora[1]}` : `Mantova · ${t(lang, 'adesso')}`
      // il termometro e la frase sulla temperatura
      if (Number.isFinite(d.temperatura)) {
        const fa = fascia(d.temperatura)
        box.dataset.temp = fa[1]
        box.style.setProperty('--t', Math.max(0.02, Math.min(1, (d.temperatura + 10) / 50)).toFixed(3))
        $('[data-frase]').textContent = fa[L === 'it' ? 2 : 3]
      } else { box.dataset.temp = ''; box.style.setProperty('--t', '0'); $('[data-frase]').textContent = '' }
      // la manica a vento: si gonfia col vento vero e punta dove va il vento
      if (Number.isFinite(d.vento)) {
        const dir = Number.isFinite(d.direzione) ? t(lang, 'bussola')[Math.round((((d.direzione % 360) + 360) % 360) / 45) % 8] : ''
        box.style.setProperty('--v', Math.min(1, d.vento / 35).toFixed(3))
        box.style.setProperty('--fl', `${(2.6 - Math.min(1, d.vento / 35) * 2).toFixed(2)}s`)
        $('[data-vento]').textContent = `${Math.round(d.vento)} ${t(lang, 'kmh')}`
        $('[data-nota-vento]').textContent = dir ? `${t(lang, 'da')} ${dir} · ${nota('vento', d.vento, lang)}` : nota('vento', d.vento, lang)
        // il vento che viene da est soffia verso ovest: la manica si gira a sinistra
        const ovest = Number.isFinite(d.direzione) && ((d.direzione % 360) + 360) % 360 > 0 && ((d.direzione % 360) + 360) % 360 < 180
        el.querySelector('[data-verso]').setAttribute('transform', ovest ? 'translate(120 0) scale(-1 1)' : '')
      } else { box.style.setProperty('--v', '0'); $('[data-vento]').textContent = '—'; $('[data-nota-vento]').textContent = '' }
      // il pluviometro: 0–20 mm in scala, oltre trabocca
      if (Number.isFinite(d.pioggia12)) {
        box.style.setProperty('--p', Math.min(1, d.pioggia12 / 20).toFixed(3))
        box.dataset.trabocca = d.pioggia12 > 20 ? '1' : '0'
        $('[data-pioggia]').textContent = `${numero(d.pioggia12, 1)} ${t(lang, 'mm')}`
        $('[data-nota-pioggia]').textContent = nota('pioggia', d.pioggia12, lang)
      } else { box.style.setProperty('--p', '0'); $('[data-pioggia]').textContent = '—'; $('[data-nota-pioggia]').textContent = '' }
      // l'ottotipo si sfoca con la visibilità
      if (Number.isFinite(d.visibilita)) {
        const km = d.visibilita / 1000
        box.style.setProperty('--sfoca', `${(km >= 15 ? 0 : km >= 5 ? 0.4 : km >= 1 ? 1.3 : 3.2).toFixed(1)}px`)
        $('[data-visibilita]').textContent = km < 1 ? `${numero(Math.round(d.visibilita / 10) * 10)} ${t(lang, 'm')}` : `${numero(Math.round(km))} km`
        $('[data-nota-vis]').textContent = nota('vis', d.visibilita, lang)
      } else { box.style.setProperty('--sfoca', '0px'); $('[data-visibilita]').textContent = '—'; $('[data-nota-vis]').textContent = '' }
      $('[data-icona]').setAttribute('aria-label', t(lang, 'figura')(etichetta(d.codice, lang), gradi))
      battuta()
    }

    function giu() {
      chiave = 'giu'
      dati = null
      box.dataset.meteo = 'giu'
      box.dataset.temp = ''
      box.style.setProperty('--t', '0'); box.style.setProperty('--v', '0'); box.style.setProperty('--p', '0'); box.style.setProperty('--sfoca', '3.2px')
      for (const k of ['gradi', 'vento', 'pioggia', 'visibilita']) $(`[data-${k}]`).textContent = '—'
      for (const k of ['frase', 'nota-vento', 'nota-pioggia', 'nota-vis']) $(`[data-${k}]`).textContent = ''
      $('[data-cielo]').textContent = t(lang, 'nonRisponde')
      $('[data-luogo]').textContent = `Mantova · ${t(lang, 'adesso')}`
      $('[data-icona]').setAttribute('aria-label', t(lang, 'figuraGiu'))
      battuta()
    }

    async function chiedi(forza = false) {
      if (!vivo || inCorso) return
      if (!forza && Date.now() - ultimo < 9 * 60_000) return
      inCorso = true
      try {
        const r = await fetch('/api/meteo/', { headers: { accept: 'application/json' }, cache: 'no-store' })
        if (!r.ok) throw new Error(`meteo ${r.status}`)
        const d = await r.json()
        if (!vivo) return
        dati = d
        disegna(d)
        api.stato(stato, t(lang, 'pronta'), 'ok')
        ultimo = Date.now()
      } catch (e) {
        console.warn('meteo lab:', e)
        if (vivo) {
          giu()
          api.stato(stato, t(lang, 'nonRisponde'), 'no')
        }
      } finally {
        inCorso = false
      }
    }

    // «senti la chiocciola»: un'altra battuta, e la chiocciola annuisce
    const bottone = $('[data-chiedi]')
    const chiediBattuta = () => {
      giro++
      battuta()
      box.classList.remove('is-annuisce')
      void box.offsetWidth
      box.classList.add('is-annuisce')
      clearTimeout(annuisce)
      annuisce = setTimeout(() => box.classList.remove('is-annuisce'), 900)
    }
    bottone.addEventListener('click', chiediBattuta)
    // le animazioni si fermano quando la scheda non si vede
    const smetti = api.quandoVisibile(box, (si) => { box.dataset.fermo = si ? '0' : '1' })

    chiedi(true)
    const timer = setInterval(() => { if (!document.hidden) chiedi() }, 10 * 60_000)
    const vis = () => { if (!document.hidden) chiedi() }
    document.addEventListener('visibilitychange', vis)
    return () => {
      vivo = false
      clearInterval(timer)
      clearTimeout(annuisce)
      document.removeEventListener('visibilitychange', vis)
      bottone.removeEventListener('click', chiediBattuta)
      smetti?.()
    }
  },
}
