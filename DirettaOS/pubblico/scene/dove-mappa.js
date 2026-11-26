// Diretta OS · «Dove vivo»: la mappa nativa in SVG.
// Geometrie: © OpenStreetMap contributors (ODbL), ricavate dal punto della cascina.
// Qui non ci sono nomi, indirizzi o link: solo terra, erba, ghiaia, acqua, alberi, tetti e luci.
// Tutto il disegno è SVG (niente immagine AI come sfondo). Gli unici bitmap sono il trattore e,
// se c'è, il ritratto dell'ufficio: richiesti dall'utente a Replicate.

import { OSM } from '/scene/dove-osm.js'

const W = 900, H = 560
const ED = OSM.edifici
const casa = ED.find((e) => e.id === '847452995')
const fienile = ED.find((e) => e.id === '847452996')
const fieniletto = ED.find((e) => e.id === '1116986159')

const CAMPO_EST = 'M 594 90 C 690 64, 800 72, 900 98 L 900 454 C 806 470, 718 458, 646 430 C 606 402, 584 330, 584 252 Z'
const CAMPO_SUD = 'M 142 468 C 330 446, 590 458, 900 430 L 900 560 L 106 560 Z'
const T = {
  prato: ['#759c49', '#6a9142', '#86ab53', '#5d833b'],
  pratoChi: ['#8cae59', '#7fa04e', '#9cbd67', '#6e9145'],
  terra: ['#a47b50', '#91683f', '#b58b5d', '#7e5935'],
  bosco: ['#47632f', '#3c5629', '#5b783c', '#2f4823'],
  ghiaia: ['#c8bfaf', '#b4aa98', '#d8cfbf', '#9f9584'],
  tetto: ['#b76b45', '#9e5738', '#cf865a', '#7d422d'],
  acqua: ['#3e7f94', '#2e657d', '#64a9b8', '#8acbd0'],
  autunno: ['#c58b34', '#d6a94a', '#a86d2a', '#e2c06a'],
}

const p = (d, attrs = '') => `<path d="${d}" ${attrs}/>`
const use = (id, x, y, s, extra = '') => `<use href="#${id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})" ${extra}/>`

// ── gli alberi: tre sagome, tutte con ombra e chioma a strati ──
function simboli() {
  return `
  <g id="dv-pianta">
    <ellipse cx="2" cy="7" rx="8" ry="3" fill="#1f321b" opacity=".28"/>
    <path d="M0 7V0" stroke="#4a3524" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="-4" cy="-3" r="6.5" fill="#4d7a33"/><circle cx="4" cy="-5" r="7" fill="#5e8d3b"/>
    <circle cx="0" cy="-10" r="6" fill="#7da94c"/><circle cx="-5" cy="-8" r="4" fill="#6f9c43"/>
    <circle cx="2" cy="-12" r="3" fill="#a1c66a" opacity=".65"/>
  </g>
  <g id="dv-albero">
    <ellipse cx="4" cy="10" rx="20" ry="6" fill="#1b2b16" opacity=".32"/>
    <path d="M0 10V-2" stroke="#4a3323" stroke-width="4" stroke-linecap="round"/>
    <path d="M-2 3l-8-9M2 2l8-10M0 0l-1-13" stroke="#4a3323" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
    <g class="dv-chioma">
      <circle cx="-13" cy="-10" r="12" fill="#406b2d"/><circle cx="11" cy="-12" r="13" fill="#4d7a34"/>
      <circle cx="-2" cy="-23" r="12" fill="#65923d"/><circle cx="-16" cy="-21" r="8" fill="#578537"/>
      <circle cx="12" cy="-24" r="9" fill="#78a34a"/><circle cx="2" cy="-14" r="11" fill="#5d8b39"/>
      <circle cx="-7" cy="-27" r="5" fill="#8db45a" opacity=".65"/><circle cx="15" cy="-18" r="4" fill="#9cc168" opacity=".5"/>
    </g>
  </g>
  <g id="dv-albero-oro">
    <ellipse cx="4" cy="10" rx="20" ry="6" fill="#2b2313" opacity=".3"/>
    <path d="M0 10V-2" stroke="#4a3323" stroke-width="4" stroke-linecap="round"/>
    <path d="M-1 3l-8-9M2 2l8-10" stroke="#4a3323" stroke-width="2.2" stroke-linecap="round"/>
    <g class="dv-chioma">
      <circle cx="-13" cy="-10" r="12" fill="#a86d2a"/><circle cx="11" cy="-12" r="13" fill="#bd832f"/>
      <circle cx="-2" cy="-23" r="12" fill="#d2a13f"/><circle cx="-16" cy="-21" r="8" fill="#b37a2b"/>
      <circle cx="12" cy="-24" r="9" fill="#d9b051"/><circle cx="2" cy="-14" r="11" fill="#c18a33"/>
      <circle cx="-7" cy="-27" r="5" fill="#e5c36b" opacity=".7"/><circle cx="15" cy="-18" r="4" fill="#f0d17b" opacity=".5"/>
    </g>
  </g>
  <g id="dv-cespuglio">
    <ellipse cx="2" cy="7" rx="13" ry="4" fill="#1f321b" opacity=".25"/>
    <circle cx="-7" cy="-1" r="7" fill="#3c6b2d"/><circle cx="3" cy="-3" r="8" fill="#4d7c35"/>
    <circle cx="10" cy="0" r="6" fill="#5d8c3d"/><circle cx="-1" cy="-8" r="5" fill="#6d9c47"/>
    <circle cx="1" cy="-12" r="2" fill="#9bc466" opacity=".6"/>
  </g>`
}

function defs() {
  const tegole = `
  <pattern id="dv-tegole" width="7" height="4.4" patternUnits="userSpaceOnUse">
    <path d="M0 3.5c1.8 0 1.8-1.8 3.5-1.8s1.8 1.8 3.5 1.8" fill="none" stroke="#6f3826" stroke-width=".5" opacity=".5"/>
    <path d="M0 1.3c1.8 0 1.8-1.8 3.5-1.8s1.8 1.8 3.5 1.8" fill="none" stroke="#d79a6e" stroke-width=".45" opacity=".3"/>
    <path d="M3.5 0v4.4" stroke="#6f3826" stroke-width=".28" opacity=".18"/>
  </pattern>`
  const pannelli = `
  <pattern id="dv-pannelli" width="22" height="16" patternUnits="userSpaceOnUse">
    <rect width="22" height="16" fill="#152936"/>
    <rect x="1" y="1" width="9.5" height="6" rx=".6" fill="#2f5368" stroke="#0d1a23" stroke-width=".7"/>
    <rect x="11.5" y="1" width="9.5" height="6" rx=".6" fill="#3d667d" stroke="#0d1a23" stroke-width=".7"/>
    <rect x="1" y="8.5" width="9.5" height="6" rx=".6" fill="#284a5e" stroke="#0d1a23" stroke-width=".7"/>
    <rect x="11.5" y="8.5" width="9.5" height="6" rx=".6" fill="#365d73" stroke="#0d1a23" stroke-width=".7"/>
    <path d="M2 2l7 4" stroke="#a8d8e5" stroke-width=".7" opacity=".22"/>
  </pattern>`
  const ghiaia = `
  <pattern id="dv-ghiaia" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="#c5bcab"/>
    <circle cx="3" cy="4" r="1.7" fill="#a79d8b"/><circle cx="11" cy="2" r="1.1" fill="#dbd2c1"/>
    <circle cx="19" cy="6" r="1.4" fill="#918777"/><circle cx="6" cy="12" r="1.2" fill="#e0d8c8"/>
    <circle cx="15" cy="12" r="2" fill="#b4aa98"/><circle cx="22" cy="15" r="1" fill="#8c8273"/>
    <circle cx="3" cy="19" r="1.4" fill="#d8cfbf"/><circle cx="12" cy="20" r="1" fill="#a69b89"/>
    <circle cx="20" cy="21" r="1.7" fill="#b9ae9b"/><circle cx="9" cy="7" r=".8" fill="#83796a"/>
  </pattern>`
  const terra = `
  <pattern id="dv-terra" width="42" height="26" patternUnits="userSpaceOnUse">
    <rect width="42" height="26" fill="#8a7157"/>
    <path d="M0 8h42M0 19h42" stroke="#6d5841" stroke-width="1.2" opacity=".34"/>
    <path d="M0 13h42" stroke="#a78f73" stroke-width=".7" opacity=".26"/>
    <circle cx="5" cy="3" r="1" fill="#6a523c" opacity=".5"/><circle cx="22" cy="10" r="1.4" fill="#a78d6c" opacity=".45"/>
    <circle cx="14" cy="22" r="1" fill="#6a523c" opacity=".35"/><circle cx="36" cy="6" r="1.2" fill="#a78d6c" opacity=".4"/>
    <circle cx="31" cy="17" r=".8" fill="#6a523c" opacity=".35"/>
  </pattern>`
  const prato = `
  <pattern id="dv-prato" width="46" height="46" patternUnits="userSpaceOnUse">
    <rect width="46" height="46" fill="#6f9846"/>
    <path d="M4 43C6 35 7 28 5 17M13 45C15 37 16 29 14 20M23 44C24 36 26 26 24 15M31 20C29 14 30 8 28 2M39 45C37 37 39 28 38 21M44 30C42 26 43 20 42 15" stroke="#5b8239" stroke-width="1.1" stroke-linecap="round" opacity=".5"/>
    <path d="M9 16C8 10 10 5 9 1M19 32C17 25 19 19 18 12M30 33C28 27 30 21 29 16M40 12C38 8 39 4 38 1" stroke="#91b85c" stroke-width=".8" stroke-linecap="round" opacity=".45"/>
    <circle cx="8" cy="32" r="1.1" fill="#a3c96b" opacity=".35"/><circle cx="24" cy="9" r=".9" fill="#a3c96b" opacity=".3"/><circle cx="38" cy="34" r="1" fill="#a3c96b" opacity=".3"/>
  </pattern>`
  const pratoChi = `
  <pattern id="dv-prato-chiaro" width="54" height="54" patternUnits="userSpaceOnUse">
    <rect width="54" height="54" fill="#88ab55"/>
    <path d="M3 51C5 43 6 34 4 24M16 53C18 44 19 33 17 23M31 52C33 43 34 34 32 24M44 28C42 21 43 14 41 7M50 49C48 40 50 31 49 24" stroke="#709a45" stroke-width="1.1" stroke-linecap="round" opacity=".5"/>
    <path d="M9 19C8 13 10 8 9 3M24 37C22 30 24 23 23 16M38 14C36 9 37 5 36 1M48 38C46 33 47 28 46 24" stroke="#a3c66e" stroke-width=".8" opacity=".5"/>
    <circle cx="14" cy="42" r="1.1" fill="#b1d277" opacity=".3"/><circle cx="36" cy="38" r=".9" fill="#b1d277" opacity=".25"/>
  </pattern>`
  const bosco = `
  <pattern id="dv-sottobosco" width="28" height="28" patternUnits="userSpaceOnUse">
    <rect width="28" height="28" fill="#425d2e"/>
    <circle cx="4" cy="5" r="2" fill="#5c7d3b" opacity=".6"/><circle cx="16" cy="3" r="1.4" fill="#6f8c45" opacity=".5"/>
    <path d="M8 18c2-3 4-4 7-5M20 22c-2-3-5-4-8-5" stroke="#6f8c45" stroke-width="1" opacity=".35"/>
    <circle cx="23" cy="10" r="1.2" fill="#8aa955" opacity=".4"/><circle cx="12" cy="24" r="1" fill="#2f4823" opacity=".6"/>
  </pattern>`
  return `
  <defs>
    <clipPath id="dv-taglio"><path d="M30 56 C 130 18, 310 32, 470 24 C 650 16, 828 38, 872 74 C 894 96, 894 150, 888 220 C 880 330, 894 450, 872 508 C 852 552, 760 530, 650 526 C 510 520, 380 548, 250 536 C 130 526, 22 548, 16 478 C 8 410, 22 320, 14 230 C 8 160, 8 96, 30 56 Z"/></clipPath>
    <clipPath id="dv-bosco-clip"><path d="${OSM.bosco[0] || ''}"/></clipPath>
    <clipPath id="dv-corte-clip"><path d="${OSM.corte[0] || ''}"/></clipPath>
    <clipPath id="dv-casa-clip"><path d="${casa?.d || ''}"/></clipPath>
    <clipPath id="dv-fienile-clip"><path d="${fienile?.d || ''}"/></clipPath>
    <clipPath id="dv-fontana-clip"><circle cx="375" cy="306" r="20"/></clipPath>
    <clipPath id="dv-campi-est-clip"><path d="${CAMPO_EST}"/></clipPath>
    <clipPath id="dv-campi-sud-clip"><path d="${CAMPO_SUD}"/></clipPath>
    <clipPath id="dv-callout-clip"><rect x="38" y="50" width="124" height="109" rx="11"/></clipPath>
    <linearGradient id="dv-g-terra" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a98257"/><stop offset="1" stop-color="#7f5a36"/></linearGradient>
    <linearGradient id="dv-g-prato" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#8db35c"/><stop offset="1" stop-color="#5d833b"/></linearGradient>
    <linearGradient id="dv-g-tetto" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d08a5e"/><stop offset=".48" stop-color="#b16845"/><stop offset="1" stop-color="#783d2b"/></linearGradient>
    <linearGradient id="dv-g-tetto2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98057"/><stop offset="1" stop-color="#8a4a32"/></linearGradient>
    <linearGradient id="dv-g-acqua" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#79c5cf"/><stop offset=".45" stop-color="#4b9aad"/><stop offset="1" stop-color="#2b6a82"/></linearGradient>
    <linearGradient id="dv-g-vetro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ff9f"/><stop offset=".6" stop-color="#a9e85a"/><stop offset="1" stop-color="#5b9a38"/></linearGradient>
    <radialGradient id="dv-g-sole"><stop offset="0" stop-color="#fff3bf" stop-opacity=".34"/><stop offset=".55" stop-color="#ffe0a0" stop-opacity=".1"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="dv-g-luce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c9" stop-opacity=".16"/><stop offset=".55" stop-color="#fff1c9" stop-opacity="0"/><stop offset="1" stop-color="#193b52" stop-opacity=".12"/></linearGradient>
    <linearGradient id="dv-g-notte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1735" stop-opacity=".78"/><stop offset=".6" stop-color="#13264a" stop-opacity=".6"/><stop offset="1" stop-color="#07101e" stop-opacity=".72"/></linearGradient>
    <linearGradient id="dv-g-tramonto" x1="0" y1="0" x2=".65" y2="1"><stop offset="0" stop-color="#ffc98a" stop-opacity=".62"/><stop offset=".48" stop-color="#ff9d6b" stop-opacity=".44"/><stop offset="1" stop-color="#b79ac9" stop-opacity=".5"/></linearGradient>
    <radialGradient id="dv-g-lampada"><stop offset="0" stop-color="#ffe29b" stop-opacity=".8"/><stop offset=".4" stop-color="#ffc55f" stop-opacity=".32"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>
    <filter id="dv-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="dv-soft2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="dv-grana" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .055"/></feComponentTransfer></filter>
    <pattern id="dv-tegole-p" width="7" height="4.4" patternUnits="userSpaceOnUse">${tegole.replace('<pattern id="dv-tegole" width="7" height="4.4" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    <pattern id="dv-pannelli-p" width="22" height="16" patternUnits="userSpaceOnUse">${pannelli.replace('<pattern id="dv-pannelli" width="22" height="16" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    <pattern id="dv-ghiaia-p" width="24" height="24" patternUnits="userSpaceOnUse">${ghiaia.replace('<pattern id="dv-ghiaia" width="24" height="24" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    <pattern id="dv-terra-p" width="42" height="26" patternUnits="userSpaceOnUse">${terra.replace('<pattern id="dv-terra" width="42" height="26" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    <pattern id="dv-prato-p" width="46" height="46" patternUnits="userSpaceOnUse">${prato.replace('<pattern id="dv-prato" width="46" height="46" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    <pattern id="dv-pratochi-p" width="54" height="54" patternUnits="userSpaceOnUse" patternTransform="rotate(11)">${pratoChi.replace('<pattern id="dv-prato-chiaro" width="54" height="54" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    <pattern id="dv-bosco-p" width="28" height="28" patternUnits="userSpaceOnUse">${bosco.replace('<pattern id="dv-sottobosco" width="28" height="28" patternUnits="userSpaceOnUse">', '').replace('</pattern>', '')}</pattern>
    ${simboli()}
  </defs>`
}

// ── gli alberi dell'orto, a filari, dentro il bosco ──
function orto() {
  let s = ''
  let n = 0
  for (let y = 112; y < 570; y += 26) {
    for (let x = -8; x < 330; x += 24) {
      const xx = x + ((Math.floor(y / 26) % 2) * 12)
      s += use(n % 11 === 0 ? 'dv-albero' : 'dv-pianta', xx, y, n % 11 === 0 ? .72 : .62, `class="dv-orto-${n % 7}"`)
      n++
    }
  }
  return `<g class="dv-orto" clip-path="url(#dv-bosco-clip)" transform="rotate(-13 160 330)">${s}</g>`
}

// ── i filari veri (dai dati OSM), con alberi grandi ──
function filari() {
  let s = ''
  let n = 0
  for (const f of OSM.filari) {
    const pts = f.pts.map(([x, y]) => ({ x, y }))
    let resto = 18
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy)
      if (!len) continue
      let t = resto / len
      while (t <= 1) {
        const x = a.x + dx * t, y = a.y + dy * t
        const autunno = n % 4 === 1
        s += use(autunno ? 'dv-albero-oro' : 'dv-albero', x, y, .78 + (n % 3) * .08, `class="dv-albero-fila-${n % 5}"`)
        n++
        t += (28 + (n % 4) * 3) / len
      }
      resto = (t - 1) * len
    }
  }
  return s
}

// ── alberi grandi sparsi (dai nodi OSM + giardino) ──
function alberiGrandi() {
  let s = ''
  for (const [x, y] of OSM.alberi) s += use('dv-albero', x, y, 1.05)
  const extra = [
    [330, 350, 1.15, 'oro'], [525, 360, 1.2, 'verde'], [315, 245, .95, 'verde'],
    [540, 200, 1.0, 'verde'], [545, 412, 1.1, 'oro'], [360, 425, .95, 'verde'],
    [300, 455, 1.15, 'oro'], [570, 470, 1.05, 'verde'], [255, 390, .9, 'oro'],
  ]
  for (const [x, y, sc, t] of extra) s += use(t === 'oro' ? 'dv-albero-oro' : 'dv-albero', x, y, sc, `class="dv-albero-grande-${Math.round(x) % 3}"`)
  return s
}

// ── siepi e cespugli ──
function siepi() {
  return `
  <g class="dv-siepi">
    ${use('dv-cespuglio', 336, 300, .9)}${use('dv-cespuglio', 352, 285, .8)}${use('dv-cespuglio', 372, 279, .85)}
    ${use('dv-cespuglio', 391, 283, .75)}${use('dv-cespuglio', 407, 300, .8)}${use('dv-cespuglio', 421, 326, .7)}
    ${use('dv-cespuglio', 431, 353, .85)}${use('dv-cespuglio', 451, 374, .8)}${use('dv-cespuglio', 477, 382, .75)}
    ${use('dv-cespuglio', 501, 379, .85)}${use('dv-cespuglio', 523, 368, .75)}${use('dv-cespuglio', 531, 344, .8)}
    ${use('dv-cespuglio', 529, 318, .7)}${use('dv-cespuglio', 520, 300, .75)}${use('dv-cespuglio', 348, 369, .8)}
    ${use('dv-cespuglio', 365, 385, .7)}${use('dv-cespuglio', 395, 394, .65)}${use('dv-cespuglio', 511, 391, .65)}
  </g>`
}

// ── l'ufficio nella casa: callout e stanza visti dall'alto ──
function ufficio() {
  return `
  <g class="dv-ufficio">
    <path d="M162 146 C 240 166, 328 182, 384 186" fill="none" stroke="#0b090e" stroke-width="5.2" stroke-linecap="round" opacity=".55"/>
    <path d="M162 146 C 240 166, 328 182, 384 186" fill="none" stroke="#ccff00" stroke-width="2.2" stroke-dasharray="5 6" stroke-linecap="round" opacity=".9"/>
    <circle cx="384" cy="186" r="2.6" fill="#ccff00" stroke="#0b090e" stroke-width="1.5"/>
    <circle cx="384" cy="186" r="6.2" fill="none" stroke="#ccff00" stroke-width="1.2" opacity=".5"/>
    <g filter="url(#dv-soft)">
      <rect x="38" y="50" width="124" height="109" rx="11" fill="#0b090e" opacity=".44"/>
    </g>
    <g clip-path="url(#dv-callout-clip)">
      <rect x="38" y="50" width="124" height="109" fill="#d7c39b"/>
      <svg x="38" y="50" width="124" height="109" viewBox="88 12 850 744" preserveAspectRatio="xMidYMid slice">
        <image href="/scene/ufficio.webp" width="1024" height="768"/>
      </svg>
      <rect class="dv-callout-notte" x="38" y="50" width="124" height="109" fill="#081120"/>
      <ellipse class="dv-schermo-lime" cx="82" cy="64" rx="11" ry="5" fill="#ccff00" filter="url(#dv-soft2)"/>
      <rect x="38" y="50" width="124" height="109" fill="none" stroke="#0b090e" stroke-width="4.4" rx="11"/>
    </g>
    <g class="dv-etichetta-ufficio"><rect x="44" y="165" width="76" height="22" rx="11" fill="#ccff00" stroke="#0b090e" stroke-width="2.2"/><text x="82" y="180" font-family="Ginto Nord, gg sans" font-size="11" font-weight="800" letter-spacing=".1em" text-anchor="middle" fill="#0b090e">UFFICIO</text></g>
  </g>`
}

function fontana() {
  return `
  <g class="dv-fontana-g">
    <ellipse cx="375" cy="306" rx="38" ry="37" fill="#8b806d" opacity=".45" filter="url(#dv-soft2)"/>
    <circle cx="375" cy="306" r="27" fill="#b4a78f" stroke="#6a5f50" stroke-width="2.4"/>
    <circle cx="375" cy="306" r="24" fill="#9d907a" stroke="#ddd2bd" stroke-width="1.2" stroke-dasharray="7 3"/>
    <circle cx="375" cy="306" r="20" fill="url(#dv-g-acqua)" stroke="#d8cbb4" stroke-width="2.4"/>
    <circle cx="375" cy="306" r="15" fill="none" stroke="#e8fbf8" stroke-width="1" opacity=".45"/>
    <g clip-path="url(#dv-fontana-clip)">
      <path d="M 361 303 C 367 293, 381 292, 389 302" fill="none" stroke="#e5ffff" stroke-width="2" opacity=".5" stroke-linecap="round"/>
      <path d="M 368 309 C 371 300, 380 300, 382 309" fill="none" stroke="#efffff" stroke-width="1.3" opacity=".4" stroke-linecap="round"/>
      <ellipse class="dv-onda-f" cx="375" cy="312" rx="12" ry="4" fill="none" stroke="#e8ffff" stroke-width="1.4"/>
      <ellipse class="dv-onda-f2" cx="375" cy="312" rx="19" ry="6" fill="none" stroke="#e8ffff" stroke-width="1" opacity=".6"/>
      <g fill="#4e7b3d" opacity=".8"><ellipse cx="363" cy="317" rx="4" ry="2.2"/><ellipse cx="386" cy="315" rx="3.4" ry="1.8"/></g>
      <g fill="#f7efcf"><circle cx="359" cy="310" r="1.3"/><circle cx="390" cy="308" r="1.1"/><circle cx="379" cy="323" r="1.1"/></g>
      <circle class="dv-goccia-f" cx="386" cy="300" r="1.8" fill="#eaffff"/>
      <circle class="dv-goccia-f" cx="378" cy="295" r="1.3" fill="#eaffff"/>
    </g>
    <g class="dv-airone">
      <ellipse cx="375" cy="299" rx="6.5" ry="2.6" fill="#6f6453" opacity=".75"/>
      <path d="M 370 295c2-3 5-4 7-2 2-3 5-3 7 0 1 2-1 3-3 3-2 0-2 2-4 2-3 0-6-1-7-3z" fill="#f7f1dd" stroke="#575044" stroke-width="1.2"/>
      <path d="M 369 294c1-4-2-6-5-6 1 2 1 3 2 5" fill="none" stroke="#575044" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M 384 295c3-1 5 1 5 3" fill="none" stroke="#575044" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <g class="dv-zampilli" fill="none" stroke="#eaffff" stroke-linecap="round">
      <path d="M 363 303 C 367 291, 380 290, 387 302" stroke-width="2" opacity=".6"/>
      <path d="M 368 307 C 371 298, 378 297, 382 307" stroke-width="1.4" opacity=".5"/>
    </g>
    <g class="dv-gocce-f" fill="#eaffff"><circle cx="387" cy="300" r="1.3"/><circle cx="379" cy="293" r="1"/><circle cx="363" cy="300" r="1.1"/></g>
    <g fill="#f6e7bf" opacity=".9"><circle cx="350" cy="315" r="1.4"/><circle cx="399" cy="318" r="1.2"/><circle cx="393" cy="330" r="1"/><circle cx="354" cy="332" r="1.1"/></g>
  </g>`
}

function edifici() {
  const t = (e) => e ? e.d : ''
  return `
  <g class="dv-casa-g">
    <path d="${t(casa)}" fill="#d3b28f" stroke="#3c2a20" stroke-width="3"/>
    <path d="${t(casa)}" fill="url(#dv-g-tetto)" stroke="#4a2c21" stroke-width="3"/>
    <path d="${t(casa)}" fill="url(#dv-tegole-p)" opacity=".78"/>
    <path d="${t(casa)}" fill="url(#dv-g-tetto2)" opacity=".2"/>
    <g clip-path="url(#dv-casa-clip)">
      <path d="M 345 252 L 472 185 L 496 248 L 388 302 Z" fill="#ffd0a2" opacity=".28"/>
      <path d="M 352 282 L 468 212 L 492 278 L 392 313 Z" fill="#351810" opacity=".3"/>
      <path d="M 378 180 L 450 254" stroke="#f0b78c" stroke-width="1.2" opacity=".2"/>
      <g stroke="#6b3524" stroke-width=".9" opacity=".32"><path d="M 345 240 L 471 197"/><path d="M 350 251 L 474 208"/><path d="M 354 262 L 477 219"/><path d="M 359 273 L 480 230"/><path d="M 364 284 L 483 241"/><path d="M 369 295 L 486 252"/></g>
    </g>
    <path d="M 365 232 L 463 200" fill="none" stroke="#4b2117" stroke-width="5.6" opacity=".65" stroke-linecap="round"/>
    <path d="M 365 232 L 463 200" fill="none" stroke="#713a28" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M 365 232 L 463 200" fill="none" stroke="#e2a675" stroke-width="1.3" stroke-dasharray="8 4" opacity=".45"/>
    <path d="M 367 228 L 463 196" fill="none" stroke="#e2a675" stroke-width="1.4" opacity=".6"/>
    <path d="M 389 208 L 428 193" fill="none" stroke="#6e3827" stroke-width="2.4" opacity=".7"/>
    <path d="M 356 176 C 390 191, 440 203, 478 214" fill="none" stroke="#f0c49e" stroke-width="1.2" opacity=".3"/>
    <g class="dv-falde-ufficio">
      <path d="M 385 185 L 398 178 L 413 174 L 421 198 L 404 202 L 391 197 Z" fill="#7d4732" stroke="#4d2418" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 398 178 L 413 174 L 421 198 L 404 202 Z" fill="#c47c55" stroke="#4d2418" stroke-width="1.3"/>
      <path d="M 385 185 L 398 178 L 404 202 L 391 197 Z" fill="#e0a074" stroke="#4d2418" stroke-width="1.3"/>
      <path d="M 398 178 L 404 202" fill="none" stroke="#f6cfa7" stroke-width="1.8"/>
      <path d="M 385 185 L 398 178 L 413 174" fill="none" stroke="#f0b78c" stroke-width="1.1" opacity=".6"/>
      <path d="M 391 197 L 404 202 L 421 198" fill="none" stroke="#3f1e14" stroke-width="2.2" opacity=".55"/>
    </g>
    <g class="dv-taglio-ufficio">
      <rect x="397" y="184" width="14" height="9" rx="1.2" fill="#c18954" stroke="#3d241a" stroke-width="1.8"/>
      <rect x="398" y="185" width="5" height="3" rx=".6" fill="#8e6038" stroke="#2b1b13" stroke-width=".6"/>
      <rect x="400" y="186" width="8" height="5" rx=".7" fill="#151820" stroke="#0b090e" stroke-width="1"/>
      <rect x="401" y="187" width="6" height="3" rx=".5" fill="#b9ef61"/>
      <circle cx="403" cy="192" r="1.4" fill="#c98c67"/>
      <path d="M401 193.5h4" stroke="#2a2320" stroke-width="1.4" stroke-linecap="round"/>
    </g>
    <path class="dv-lume-ufficio" d="M 401 188 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0" fill="none" stroke="#ffd37b" stroke-width="2" opacity=".35"/>
    <g class="dv-finestre-tetto">
      <g transform="rotate(-16 394 244)"><rect x="389" y="240" width="12" height="7" rx="1" fill="#abd7d4" stroke="#3e2b23" stroke-width="1.4"/><path d="M392 240v7M398 240v7" stroke="#d7f0e8" stroke-width=".7" opacity=".7"/></g>
      <g transform="rotate(-16 421 234)"><rect x="416" y="230" width="10" height="6" rx="1" fill="#b9ded9" stroke="#3e2b23" stroke-width="1.3"/></g>
    </g>
    <rect x="435" y="187" width="10" height="7" rx="1" fill="#5b4032" stroke="#2d1c14" stroke-width="1.6"/>
    <rect x="438" y="191" width="4" height="3" fill="#e6c49d"/>
    <rect x="449" y="220" width="11" height="18" rx="1" fill="#5c3b2b" stroke="#2d1c14" stroke-width="1.8"/>
    <rect x="452" y="224" width="4" height="3" fill="#d8b17d"/>
    <path d="M 409 252 l 25 -9" stroke="#e4b18a" stroke-width="1.3" opacity=".45"/>
  </g>
  <g class="dv-fienile-g">
    <path d="${t(fienile)}" fill="#cfc4ad" stroke="#34464d" stroke-width="3"/>
    <path d="${t(fienile)}" fill="url(#dv-pannelli-p)" stroke="#0b1a22" stroke-width="3"/>
    <g clip-path="url(#dv-fienile-clip)"><path d="M 404 356 L 490 304 L 498 318 L 412 370 Z" fill="#e8fbff" opacity=".15"/><path d="M 420 354 L 488 313 L 491 319 L 424 361 Z" fill="#fff" opacity=".13"/></g>
    <path d="${t(fienile)}" fill="url(#dv-g-tetto2)" opacity=".2"/>
    <path d="M 419 324 L 480 304" fill="none" stroke="#0a151c" stroke-width="4" opacity=".65"/>
    <path d="M 423 331 L 477 313" fill="none" stroke="#8bb8c6" stroke-width="1.2" opacity=".28"/>
    <path d="M 415 351 l 11 -4 l 3 8 l -11 4 z" fill="#c9b99a" stroke="#2b2018" stroke-width="1.4"/>
    <circle cx="480" cy="350" r="2.6" fill="#7b8f91" stroke="#283634" stroke-width="1"/>
  </g>
  <g class="dv-fieniletto">
    <path d="${t(fieniletto)}" fill="url(#dv-g-tetto2)" stroke="#432b20" stroke-width="2.2"/>
    <path d="${t(fieniletto)}" fill="url(#dv-tegole-p)" opacity=".45"/>
  </g>
  `
}

// ── dettagli veri: trattore, auto, legna, lumi, fiori, uccelli, fumo, pozzanghere ──
function dettagli() {
  return `
  <g class="dv-trattore-g">
    <g class="dv-trattore">
      <ellipse cx="2" cy="6" rx="18" ry="6" fill="#213117" opacity=".35" filter="url(#dv-soft2)"/>
      <image href="/scene/trattore.webp" x="-21" y="-21" width="42" height="42" preserveAspectRatio="xMidYMid meet"/>
    </g>
    <path class="dv-polvere" d="M 638 246 C 674 258, 704 266, 734 276" fill="none" stroke="#cfb286" stroke-width="2.2" stroke-dasharray="4 10" opacity=".45"/>
  </g>
  <g class="dv-auto" transform="translate(508 246) rotate(18)">
    <ellipse cx="2" cy="3" rx="20" ry="8" fill="#1c2a1a" opacity=".38" filter="url(#dv-soft2)"/>
    <rect x="-19" y="-8" width="38" height="16" rx="7" fill="#355b6b" stroke="#0b090e" stroke-width="2"/>
    <rect x="-9" y="-6.6" width="17" height="13.2" rx="4.4" fill="#8fb7c2" opacity=".9"/>
    <rect x="-6" y="-5.2" width="11" height="10.4" rx="3" fill="#3f6470"/>
    <path d="M8 -5.8 L 13 0 L 8 5.8 Z" fill="#d3ebee" opacity=".65"/>
    <path d="M-15 -5 L -10 0 L -15 5 Z" fill="#a8ccd2" opacity=".55"/>
    <path d="M-1 -7.4 V 7.4" stroke="#1e3941" stroke-width=".8" opacity=".55"/>
    <rect x="6.5" y="-10.2" width="3.4" height="2.2" rx="1" fill="#22343a" stroke="#0b090e" stroke-width=".8"/>
    <rect x="6.5" y="8" width="3.4" height="2.2" rx="1" fill="#22343a" stroke="#0b090e" stroke-width=".8"/>
    <rect x="-15" y="-9.6" width="6" height="2.2" rx="1" fill="#22343a"/><rect x="-15" y="7.4" width="6" height="2.2" rx="1" fill="#22343a"/>
    <rect x="14" y="-6" width="2" height="3.4" rx="1" fill="#22343a"/><rect x="14" y="2.6" width="2" height="3.4" rx="1" fill="#22343a"/>
  </g>
  <g class="dv-legna" transform="translate(474 374) rotate(-8)">
    <rect x="-17" y="-6" width="34" height="12" rx="2" fill="#6a4a2d" opacity=".85"/>
    <path d="M-14 -4v8M-9 -4v8M-4 -4v8M1 -4v8M6 -4v8M11 -4v8" stroke="#a17645" stroke-width="2.2"/>
    <path d="M-16 -7h32" stroke="#3f2c1b" stroke-width="1.4"/>
  </g>
  <g class="dv-lumi">
    <g class="dv-lume" transform="translate(516 268)"><circle r="18" fill="url(#dv-g-lampada)"/><circle r="3" fill="#ffe1a0" stroke="#2b2218" stroke-width="1.4"/></g>
    <g class="dv-lume" transform="translate(345 340)"><circle r="16" fill="url(#dv-g-lampada)"/><circle r="2.6" fill="#ffe1a0" stroke="#2b2218" stroke-width="1.2"/></g>
    <g class="dv-lume" transform="translate(520 390)"><circle r="18" fill="url(#dv-g-lampada)"/><circle r="3" fill="#ffe1a0" stroke="#2b2218" stroke-width="1.4"/></g>
  </g>
  <g class="dv-arredi">
    <path d="M 447 380h26v4h-26z" fill="#b48a5b" stroke="#3d2a1e" stroke-width="1.2"/>
    <path d="M 450 384v7M 470 384v7" stroke="#3d2a1e" stroke-width="2"/>
    <path d="M 446 376h4v8h-4zM 470 376h4v8h-4z" fill="#745233" stroke="#3d2a1e" stroke-width="1"/>
    <g transform="translate(333 372)"><circle r="7" fill="#3e6b31"/><circle cx="4" cy="-3" r="5" fill="#5f8e3d"/><path d="M0 7v8" stroke="#5b3a26" stroke-width="2.4"/><path d="M-4 15h8l-1 8h-6z" fill="#a8643d" stroke="#0b090e" stroke-width="1.2"/></g>
    <g transform="translate(530 405)"><circle r="6" fill="#3e6b31"/><path d="M0 6v7" stroke="#5b3a26" stroke-width="2.2"/><path d="M-3 13h6l-1 7h-4z" fill="#a8643d" stroke="#0b090e" stroke-width="1.1"/></g>
  </g>
  <g class="dv-fiori" fill="#f7e7bf">
    <circle cx="340" cy="306" r="2"/><circle cx="351" cy="318" r="1.6"/><circle cx="408" cy="386" r="2"/><circle cx="422" cy="394" r="1.5"/>
    <circle cx="510" cy="356" r="1.8"/><circle cx="526" cy="344" r="1.4"/><circle cx="385" cy="414" r="1.6"/><circle cx="368" cy="402" r="1.3"/>
  </g>
  <g class="dv-pozzanghere" fill="#9bc3c7" opacity=".48">
    <ellipse cx="545" cy="244" rx="10" ry="3"/><ellipse cx="506" cy="230" rx="7" ry="2.4"/><ellipse cx="588" cy="256" rx="13" ry="3.2"/>
  </g>
  <g transform="translate(560 122)"><g class="dv-uccelli" fill="none" stroke="#203027" stroke-width="1.8" stroke-linecap="round">
    <path d="M0 0c4-4 7-4 11 0 4-4 7-4 11 0"/><path d="M-42 -16c3-3 5-3 8 0 3-3 5-3 8 0"/><path d="M-18 22c2-2 4-2 6 0 2-2 4-2 6 0"/>
  </g></g>
  <g class="dv-fumo" fill="none" stroke="#d9d4c7" stroke-width="3" stroke-linecap="round" opacity=".35">
    <path d="M454 184c-5-9 6-12 1-20s5-11 2-18"/><path d="M460 182c-3-7 4-10 0-16"/>
  </g>`
}

function meteoFx() {
  const caso = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v) }
  let pioggia = '', neve = '', foglie = ''
  for (let i = 0; i < 170; i++) {
    const x = 8 + caso(i) * 884, y = 8 + caso(i + 71) * 544
    pioggia += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 7).toFixed(1)}" y2="${(y + 22).toFixed(1)}" stroke="#d8f1ff" stroke-width="${i % 4 ? 1 : 1.7}" opacity="${.32 + (i % 5) * .09}" style="animation-delay:${(-(i % 9) * .13).toFixed(2)}s;animation-duration:${(.72 + (i % 5) * .1).toFixed(2)}s"/>`
  }
  for (let i = 0; i < 52; i++) {
    const x = 16 + caso(i + 200) * 868, y = 8 + caso(i + 300) * 520
    neve += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1.4 + (i % 3) * .7}" fill="#f4fbff" opacity=".8" style="animation-delay:${(-(i % 9) * .5).toFixed(2)}s;animation-duration:${(5 + (i % 4))}s"/>`
  }
  for (let i = 0; i < 12; i++) {
    const x = 40 + caso(i + 400) * 820, y = 100 + caso(i + 500) * 380
    foglie += `<path d="M0 0c5-5 10-3 12 2-4 5-9 5-12-2z" fill="${i % 3 ? '#c18a33' : '#d5a84b'}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${i * 31})" opacity=".75"/>`
  }
  return `
  <g class="dv-fx">
    <rect class="dv-velo-pioggia" width="900" height="560" fill="#26363e"/>
    <g class="dv-ripple-pioggia" fill="none" stroke="#d9f4f6" stroke-width="1.3" opacity=".8">
      <circle cx="208" cy="240" r="5"/><circle cx="252" cy="322" r="4"/><circle cx="300" cy="400" r="5"/>
      <circle cx="392" cy="118" r="5"/><circle cx="470" cy="110" r="4"/><circle cx="560" cy="105" r="5"/><circle cx="620" cy="102" r="4"/>
      <circle cx="375" cy="306" r="6"/><circle cx="368" cy="300" r="4"/>
    </g>
    <g class="dv-pioggia">${pioggia}</g>
    <g class="dv-neve">${neve}</g>
    <g class="dv-foglie-vento">${foglie}</g>
    <g class="dv-nebbia-fx"><ellipse cx="210" cy="220" rx="230" ry="42" fill="#e8f2ef" opacity=".25"/><ellipse cx="630" cy="360" rx="300" ry="52" fill="#e8f2ef" opacity=".2"/><ellipse cx="430" cy="130" rx="260" ry="34" fill="#f4fbf8" opacity=".2"/></g>
    <rect class="dv-lampo" width="900" height="560" fill="#eaf6ff" opacity="0"/>
  </g>`
}

export function mappaDove() {
  const dCorte = OSM.corte[0] || ''
  const campoPrato = OSM.campi.filter((c) => c.tipo === 'prato').map((c) => c.d)
  const campo = (d, fill, extra = '') => p(d, `fill="${fill}" ${extra}`)
  let campi = ''
  for (const c of OSM.campi) {
    campi += campo(c.d, c.tipo === 'prato' ? 'url(#dv-pratochi-p)' : 'url(#dv-terra-p)', 'opacity=".98"')
    if (c.tipo === 'prato') campi += p(c.d, 'fill="none" stroke="#709541" stroke-width="1.2" opacity=".4"')
  }
  const strada = (s) => {
    const w = s.tipo === 'asfalto' ? 12 : s.tipo === 'sterrato' ? 5.5 : 3.6
    const col = s.tipo === 'asfalto' ? '#35373b' : '#b79b6a'
    return `<path d="${s.d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity=".95"/>` +
      (s.tipo === 'asfalto' ? `<path d="${s.d}" fill="none" stroke="#e6dfcb" stroke-width="1" stroke-dasharray="10 12" opacity=".55"/>` : '')
  }
  let strade = ''
  for (const s of OSM.strade) strade += strada(s)

  // i campi che completano la mappa (l'OSM qui è rado): grande campo a est, filari bianchi a sud
  const campoEst = CAMPO_EST
  const campoSud = CAMPO_SUD
  const righeBianche = (() => {
    let s = ''
    for (let i = 0; i < 24; i++) {
      const y = 462 + i * 8
      s += `<path d="M 140 ${y} L 900 ${y - 45}" stroke="#f1ebd9" stroke-width="${i % 3 ? 4 : 5.4}" opacity="${i % 3 ? .72 : .9}" stroke-linecap="round"/>`
      s += `<path d="M 140 ${y + 3.2} L 900 ${y - 41.8}" stroke="#9a8b61" stroke-width="1" opacity=".25"/>`
    }
    return s
  })()
  const campoEstRighe = (() => {
    let s = ''
    for (let i = 0; i < 9; i++) {
      const y = 110 + i * 32
      s += `<path d="M 606 ${y} C 690 ${y - 13}, 790 ${y - 8}, 898 ${y + 12}" fill="none" stroke="#735737" stroke-width="1.3" opacity=".28"/>`
      s += `<path d="M 620 ${y + 3} C 700 ${y - 10}, 790 ${y - 4}, 894 ${y + 15}" fill="none" stroke="#b08a60" stroke-width=".8" opacity=".18"/>`
    }
    for (let i = 0; i < 22; i++) {
      const x = 610 + ((i * 37) % 270), y = 110 + ((i * 53) % 300)
      s += `<ellipse cx="${x}" cy="${y}" rx="${1.5 + (i % 3)}" ry="${.8 + (i % 2) * .5}" fill="#6b4e32" opacity=".28"/>`
    }
    return s
  })()
  const macchie = (() => {
    let s = ''
    for (let i = 0; i < 16; i++) {
      const x = 40 + ((i * 137) % 820), y = 40 + ((i * 211) % 470)
      const rx = 50 + (i % 5) * 26, ry = 26 + (i % 4) * 18
      s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${i % 3 ? '#3f6b2c' : '#9dbd63'}" opacity="${(.055 + (i % 4) * .015).toFixed(3)}"/>`
    }
    return s
  })()

  return `
  <svg class="dv-mappa" viewBox="0 0 ${W} ${H}" role="img" aria-label="La mappa illustrata di dove vivo, dall'alto, con la bussola, il meteo e l'ora">
    ${defs()}
    <g clip-path="url(#dv-taglio)">
      <rect width="${W}" height="${H}" fill="url(#dv-prato-p)"/>
      <rect width="${W}" height="${H}" fill="url(#dv-pratochi-p)" opacity=".26" style="mix-blend-mode:soft-light"/>
      <rect width="${W}" height="${H}" fill="url(#dv-g-prato)" opacity=".38"/>
      <g class="dv-macchie">${macchie}</g>
      <g class="dv-campi">
        ${campi}
        <path d="M 570 70 C 690 48, 820 58, 900 80 L 900 104 C 800 80, 690 74, 584 92 Z" fill="#6d8f47" opacity=".55"/>
        <g clip-path="url(#dv-campi-est-clip)"><path d="${campoEst}" fill="url(#dv-terra-p)"/><g opacity=".55">${campoEstRighe}</g>
          <g fill="#e7c994" opacity=".12"><path d="M 575 150 L 900 88 L 900 112 L 580 178 Z"/><path d="M 575 214 L 900 148 L 900 170 L 580 240 Z"/><path d="M 575 278 L 900 212 L 900 232 L 580 302 Z"/><path d="M 575 342 L 900 278 L 900 298 L 580 364 Z"/></g>
        </g>
        <path d="${campoEst}" fill="none" stroke="#7e5a37" stroke-width="2" opacity=".4"/>
        <path d="${campoSud}" fill="url(#dv-terra-p)"/>
        <path d="${campoSud}" fill="url(#dv-g-terra)" opacity=".22"/>
        <g clip-path="url(#dv-campi-sud-clip)">${righeBianche}</g>
        <path d="${campoSud}" fill="none" stroke="#7e5a37" stroke-width="2" opacity=".35"/>
      </g>
      <g class="dv-corte">
        ${dCorte ? p(dCorte, 'fill="#7f9a55" opacity=".32"') : ''}
        <path d="M 326 168 C 380 150, 480 154, 528 186 C 548 230, 550 300, 535 382 C 500 412, 430 424, 372 402 C 334 370, 318 300, 326 168 Z" fill="url(#dv-ghiaia-p)" opacity=".98"/>
        <path d="M 326 168 C 380 150, 480 154, 528 186 C 548 230, 550 300, 535 382 C 500 412, 430 424, 372 402 C 334 370, 318 300, 326 168 Z" fill="none" stroke="#a79d8b" stroke-width="2" opacity=".5"/>
        <path d="M 360 236 C 410 222, 466 226, 510 246" fill="none" stroke="#8e816e" stroke-width="17" stroke-linecap="round" opacity=".95"/>
        <path d="M 360 236 C 410 222, 466 226, 510 246" fill="none" stroke="#c8bda9" stroke-width="13" stroke-linecap="round"/>
        <path d="M 360 236 C 410 222, 466 226, 510 246" fill="none" stroke="#d8cfbf" stroke-width="1.1" stroke-dasharray="3 7" stroke-linecap="round" opacity=".5"/>
        <path d="M 516 224 C 600 230, 690 236, 792 232 L 792 258 C 690 262, 600 258, 518 252 Z" fill="url(#dv-ghiaia-p)" stroke="#8e816e" stroke-width="2.2"/>
        <path d="M 524 231 C 608 237, 700 243, 790 239" fill="none" stroke="#8f8473" stroke-width="1" opacity=".4"/>
        <path d="M 524 249 C 608 255, 700 259, 790 255" fill="none" stroke="#6f6557" stroke-width="1" opacity=".35"/>
        <g class="dv-giardino">
          <path d="M 326 286 C 356 264, 410 258, 452 274 C 500 292, 530 334, 524 378 C 490 408, 424 422, 376 400 C 338 370, 320 326, 326 286 Z" fill="url(#dv-prato-p)"/>
          <path d="M 326 286 C 356 264, 410 258, 452 274 C 500 292, 530 334, 524 378 C 490 408, 424 422, 376 400 C 338 370, 320 326, 326 286 Z" fill="none" stroke="#5c803a" stroke-width="2" opacity=".55"/>
          <path d="M 348 300 C 390 288, 450 300, 486 326" fill="none" stroke="#b8a98d" stroke-width="13" stroke-linecap="round" opacity=".7"/>
          <path d="M 368 352 C 410 344, 460 352, 498 370" fill="none" stroke="#b8a98d" stroke-width="10" stroke-linecap="round" opacity=".55"/>
        </g>
      </g>
      <g class="dv-bosco">
        ${OSM.bosco.map((b) => p(b, 'fill="url(#dv-bosco-p)" opacity=".98"')).join('')}
        ${OSM.bosco.map((b) => p(b, 'fill="#2f4b25" opacity=".18"')).join('')}
        ${orto()}
      </g>
      <g class="dv-vigneto">${OSM.vigneto.map((v) => p(v, 'fill="#7f8f45" opacity=".55"')).join('')}</g>
      <g class="dv-acque">
        ${OSM.acque.map((a) => a.tipo === 'specchio'
          ? p(a.d, 'fill="url(#dv-g-acqua)" stroke="#f2e7cf" stroke-width="3"')
          : `<path d="${a.d}" fill="none" stroke="#5b4b35" stroke-width="14" stroke-linecap="round" opacity=".7"/><path d="${a.d}" fill="none" stroke="#356d7f" stroke-width="9" stroke-linecap="round" opacity=".9"/><path d="${a.d}" fill="none" stroke="url(#dv-g-acqua)" stroke-width="7" stroke-linecap="round"/><path d="${a.d}" fill="none" stroke="#d8f5f4" stroke-width="1.2" opacity=".28"/><path d="${a.d}" fill="none" stroke="#d8f5f4" stroke-width="1.1" stroke-dasharray="4 44" stroke-linecap="round" opacity=".35"/>`).join('')}
        <g class="dv-canne" stroke="#6d8b45" stroke-width="2" stroke-linecap="round">
          <path d="M 426 354 l -2 -13 M 431 361 l 3 -11 M 493 386 l -2 -12 M 501 390 l 3 -10 M 573 395 l -2 -11 M 580 397 l 2 -9"/>
        </g>
      </g>
      <g class="dv-strade">${strade}</g>
      <g class="dv-strade-extra">
        <path d="M 790 80 C 778 200, 790 330, 812 520" fill="none" stroke="#3b3a3b" stroke-width="24" stroke-linecap="round"/>
        <path d="M 790 80 C 778 200, 790 330, 812 520" fill="none" stroke="#e8dfcb" stroke-width="2" opacity=".5"/>
        <path d="M 790 80 C 778 200, 790 330, 812 520" fill="none" stroke="#f3e9d2" stroke-width="1" stroke-dasharray="13 16" opacity=".65"/>
      </g>
      <g class="dv-alberi">
        ${filari()}
        ${alberiGrandi()}
      </g>
      <g class="dv-edifici">
        ${edifici()}
      </g>
      ${fontana()}
      ${siepi()}
      <g class="dv-dettagli">
        ${dettagli()}
      </g>
      ${meteoFx()}
      <rect class="dv-luce-ora" x="-160" y="-120" width="${W + 320}" height="${H + 240}" fill="url(#dv-g-luce)"/>
      <rect class="dv-tinta-tramonto" width="${W}" height="${H}" fill="url(#dv-g-tramonto)" opacity="0"/>
      <rect class="dv-notte" width="${W}" height="${H}" fill="url(#dv-g-notte)" opacity="0"/>
      <rect class="dv-grana" width="${W}" height="${H}" fill="#fff" filter="url(#dv-grana)" opacity=".5"/>
      <!-- le luci vere stanno sopra il velo della notte: altrimenti la notte le spegne -->
      <g class="dv-luci-notturne">
        <circle class="dv-luce-fontana-notte" cx="375" cy="306" r="44" fill="url(#dv-g-lampada)" opacity="0"/>
        <circle class="dv-alone-ufficio-notte" cx="402" cy="190" r="24" fill="url(#dv-g-lampada)" opacity="0"/>
        <rect class="dv-finestra-ufficio-notte" x="389" y="187" width="10" height="6" rx="1" fill="#ffe1a0" opacity="0" transform="rotate(-16 394 190)"/>
        <g class="dv-lume-notte" transform="translate(516 268)"><circle r="32" fill="url(#dv-g-lampada)" opacity="0"/><circle r="3" fill="#ffe1a0" opacity="0"/></g>
        <g class="dv-lume-notte" transform="translate(345 340)"><circle r="28" fill="url(#dv-g-lampada)" opacity="0"/><circle r="2.6" fill="#ffe1a0" opacity="0"/></g>
        <g class="dv-lume-notte" transform="translate(520 390)"><circle r="32" fill="url(#dv-g-lampada)" opacity="0"/><circle r="3" fill="#ffe1a0" opacity="0"/></g>
        <g class="dv-finestre-notturne"><rect x="389" y="240" width="12" height="7" rx="1" fill="#ffe1a0" opacity="0" transform="rotate(-16 394 244)"/><rect x="416" y="230" width="10" height="6" rx="1" fill="#ffe1a0" opacity="0" transform="rotate(-16 421 234)"/></g>
      </g>
      ${ufficio()}
    </g>
    <path d="M30 56 C 130 18, 310 32, 470 24 C 650 16, 828 38, 872 74 C 894 96, 894 150, 888 220 C 880 330, 894 450, 872 508 C 852 552, 760 530, 650 526 C 510 520, 380 548, 250 536 C 130 526, 22 548, 16 478 C 8 410, 22 320, 14 230 C 8 160, 8 96, 30 56 Z" fill="none" stroke="#0b090e" stroke-width="9" stroke-linejoin="round"/>
    <path d="M30 56 C 130 18, 310 32, 470 24 C 650 16, 828 38, 872 74 C 894 96, 894 150, 888 220" fill="none" stroke="#f6f4f8" stroke-width="2.2" opacity=".26" stroke-linecap="round"/>
    <g class="dv-credit"><rect x="310" y="514" width="280" height="22" rx="11" fill="#0b090e" opacity=".68"/><text x="450" y="530" font-family="gg sans" font-size="15" font-weight="700" text-anchor="middle" fill="#f6f4f8">© OpenStreetMap contributors</text></g>
  </svg>`
}
