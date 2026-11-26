// ─────────────────────────────────────────────────────────────────────────────
//  SICUREZZA ONLINE — tre tavole animate per la sezione sulla sicurezza:
//  bot e phishing, attacchi DDoS, recupero dati.
//
//  Nei dati si usano come le altre tavole:
//
//    { art: 'sicurezza', variant: 'phishing', alt: '…' }   // anche 'ddos', 'recupero'
//
//  Sono disegni tecnici su carta, come il resto del sito: inchiostro per le
//  minacce, il blu di Alberto per quello che protegge. Ogni tavola porta con sé
//  il suo foglio di stile (classi sz-*, nomi diversi per ogni tavola), così
//  funziona uguale dentro una pagina del sito, in un file .svg a sé o nelle
//  copertine di D:\a\claude\04 Grafica\Cover sicurezza.
//
//  Movimento: un giro di 10 secondi che ricomincia, solo transform, opacità e
//  tratti che si disegnano. Con «riduci movimento» le animazioni si spengono e
//  resta il fotogramma finale, quello che conta: la minaccia fermata, il sito
//  online, i dati tornati al loro posto.
// ─────────────────────────────────────────────────────────────────────────────

import { svg, text, rect, line, circle, path, cross, softShadow, rng, n, nextId } from './kit.js'

const W = 960
const H = 640
const GIRO = 10 // secondi

// ── CSS delle animazioni ─────────────────────────────────────────────────────

const pct = (k) =>
  String(k)
    .split(',')
    .map((p) => `${+(+p).toFixed(2)}%`)
    .join(',')

/** Raccoglie keyframes e regole di una tavola; `a()` restituisce la classe da mettere sull'elemento. */
function motion(prefix) {
  const rules = []
  let i = 0
  const a = (stops, extra = '') => {
    const name = `${prefix}${(++i).toString(36)}`
    const frames = Object.entries(stops)
      .sort(([x], [y]) => parseFloat(x) - parseFloat(y))
      .map(([k, v]) => `${pct(k)}{${v}}`)
      .join('')
    rules.push(`@keyframes ${name}{${frames}}.sz .${name}{animation-name:${name};${extra}}`)
    return `sz-an ${name}`
  }
  const css = (more = '') =>
    `<style>` +
    `.sz{--sz-card:#faf9f5;--sz-soft:color-mix(in srgb,var(--art-accent) 13%,var(--sz-card));--sz-soft2:color-mix(in srgb,var(--art-accent) 30%,var(--sz-card))}` +
    `.art--ink.sz{--sz-card:#1d1d1c}` +
    `.sz .sz-card{fill:var(--sz-card)}.sz .sz-bs{fill:var(--sz-soft)}.sz .sz-bs2{fill:var(--sz-soft2)}` +
    `.sz .sz-thin{stroke-width:1.1}.sz .sz-fat{stroke-width:2.6}.sz .sz-dim{opacity:.78}` +
    `.sz .sz-serif{font-family:var(--font-serif);font-variation-settings:'opsz' 144;font-weight:380}` +
    `.sz .sz-it{font-style:italic;font-weight:360}` +
    `.sz .sz-an{animation-duration:${GIRO}s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.22,1,.36,1);animation-fill-mode:both;transform-box:fill-box;transform-origin:center}` +
    rules.join('') +
    more +
    `@media (prefers-reduced-motion:reduce){.sz .sz-an{animation:none!important}}` +
    `</style>`
  return { a, css }
}

// ── Piccoli pezzi di disegno ─────────────────────────────────────────────────

const mono = (x, y, s, o = {}) => text(x, y, s, { c: 'a-tm', size: 12.5, ...o })
const sans = (x, y, s, o = {}) => text(x, y, s, { size: 14, ...o, c: `${o.c || 'a-t'} a-sans` })

/** Crocini di registro agli angoli e intestazione della tavola, come su un elaborato. */
const plate = (tav, title) =>
  cross(24, 24) +
  cross(W - 24, 24) +
  cross(24, H - 24) +
  cross(W - 24, H - 24) +
  mono(56, 58, `tav. ${tav} · ${title}`, { size: 12 }) +
  mono(W - 56, 58, 'scala 1:1', { size: 12, anchor: 'end' })

/** Numero di richiamo (pallino blu), con l'anello che si allarga quando compare. */
const marker = (x, y, k, { pop = '', ping = '' } = {}) =>
  `<g transform="translate(${n(x)} ${n(y)})">` +
  (ping ? `<circle class="a-sa ${ping}" r="11" opacity="0"/>` : '') +
  `<g class="${pop}"><circle class="a-acc" r="11"/>${text(0, 4.2, k, { c: 'a-ti', size: 12, anchor: 'middle', weight: 600 })}</g>` +
  `</g>`

/** Documento con l'angolo piegato. `ghost`: solo il contorno tratteggiato. */
const doc = (x, y, w = 44, h = 54, ghost = false) => {
  const f = Math.round(w * 0.27)
  const body = `M${n(x)} ${n(y)}H${n(x + w - f)}L${n(x + w)} ${n(y + f)}V${n(y + h)}H${n(x)}Z`
  if (ghost) return path(body, 'a-s2 a-dash')
  const lines = [0.42, 0.58, 0.74].map((p, i) => `M${n(x + w * 0.2)} ${n(y + h * p)}H${n(x + w * (i === 2 ? 0.6 : 0.8))}`).join('')
  return path(body, 'sz-card a-s') + path(`M${n(x + w - f)} ${n(y)}V${n(y + f)}H${n(x + w)}`, 'a-s2') + path(lines, 'a-s2')
}

// ── 01 · Bot e phishing ──────────────────────────────────────────────────────
// Una finta pagina di accesso e la chat di un bot. I dettagli che tradiscono la
// truffa si segnano come su un rilievo (richiami numerati e legenda); il link
// parte dalla chat, sbatte sullo scudo e prende il timbro «bloccato».

function phishing() {
  const { a, css } = motion('szp')
  const clip = nextId('szc')
  let o = ''

  o += plate('01', 'rilievo di un messaggio truffa')

  // finta pagina di accesso
  const P = { x: 56, y: 92, w: 378, h: 408 }
  o += softShadow(P.x, P.y + 8, P.w, P.h, { sigma: 16, opacity: 0.07 })
  o += rect(P.x, P.y, P.w, P.h, 'sz-card a-s2', ' rx="14"')
  o += line(P.x, P.y + 44, P.x + P.w, P.y + 44, 'a-s2')
  o += [80, 96, 112].map((x) => circle(x, P.y + 22, 4.5, 'a-s2')).join('')
  o += rect(132, P.y + 10, 284, 24, 'a-soft', ' rx="12"')
  o += path(`M146 ${P.y + 22}v-3a4 4 0 0 1 8 0v3`, 'a-s2') + rect(144, P.y + 21, 12, 8.5, 'a-s2', ' rx="2"')
  o += mono(164, P.y + 26.5, 'verifica-account-sicuro.info', { size: 12 })
  o += sans(84, 196, 'verifica il tuo account', { size: 25, weight: 620, spacing: '-0.02em' })
  o += sans(84, 222, 'entro 24 ore o l’account verrà sospeso.', { c: 'a-tm', size: 14 })
  o += rect(84, 246, 322, 46, 'a-bg a-s2', ' rx="9"') + mono(102, 274, 'nome@email.it', { size: 13.5 })
  o += rect(84, 304, 322, 46, 'a-bg a-s2', ' rx="9"') + mono(102, 333, '••••••••••', { c: 'a-t', size: 16 })
  o += rect(84, 370, 322, 50, 'a-fill', ' rx="25"') + sans(245, 401, 'verifica ora', { c: 'a-ti', size: 16, weight: 600, anchor: 'middle' })
  o += mono(84, 466, 'assistenza · privacy · termini', { size: 11 })

  // la scansione che passa sulla pagina
  o += `<clipPath id="${clip}"><rect x="${P.x}" y="${P.y + 45}" width="${P.w}" height="${P.h - 46}" rx="2"/></clipPath>`
  o +=
    `<g clip-path="url(#${clip})"><g class="${a({ '0,4': 'transform:translateY(-70px);opacity:0', 7: 'opacity:1', 24: 'opacity:1', '27,100': 'transform:translateY(330px);opacity:0' }, 'animation-timing-function:cubic-bezier(.65,0,.35,1)')}" opacity="0">` +
    rect(P.x, P.y + 46, P.w, 58, 'sz-bs', ' opacity=".7"') +
    line(P.x, P.y + 104, P.x + P.w, P.y + 104, 'a-sa') +
    `</g></g>`

  // lo scudo, centrato fra la pagina e la chat (26 unità a destra del disegno
  // originale: prima era più vicino alla pagina, con un vuoto più largo a destra)
  const SHIFT = 26
  const S = 'M528 172L602 202V298C602 368 566 410 528 434C490 410 454 368 454 298V202Z'
  const shield = a({ '0,55': 'transform:scale(1)', 58: 'transform:scale(1.05)', '64,100': 'transform:scale(1)' })
  o += `<g transform="translate(${SHIFT} 0)">`
  o += `<g class="${shield}">`
  o += `<path class="sz-bs" d="${S}"/>`
  o += `<path class="a-sa sz-fat ${a({ 0: 'stroke-dashoffset:1;opacity:0', 1: 'opacity:1', 11: 'stroke-dashoffset:0', 93: 'opacity:1', '98,100': 'opacity:0;stroke-dashoffset:0' }, 'animation-timing-function:cubic-bezier(.65,0,.35,1)')}" d="${S}" pathLength="1" stroke-dasharray="1"/>`
  o += `<path class="a-sa" d="${S}" opacity=".35" transform="translate(528 302) scale(.84) translate(-528 -302)"/>`
  o += `<path class="a-sa ${a({ '0,8': 'stroke-dashoffset:1', 15: 'stroke-dashoffset:0', 93: 'opacity:1', '98,100': 'opacity:0' })}" d="M498 300L520 322L562 276" style="stroke-width:9" pathLength="1" stroke-dasharray="1"/>`
  o += `</g>`
  // l'onda che parte dallo scudo quando il link ci sbatte contro
  o += `<path class="a-sa ${a({ '0,56': 'transform:scale(1);opacity:0', 57: 'opacity:.7', '70,100': 'transform:scale(1.32);opacity:0' })}" d="${S}" opacity="0"/>`
  o += `</g>`

  // la chat del bot
  const C = { x: 674, y: 92, w: 230, h: 340 }
  o += softShadow(C.x, C.y + 8, C.w, C.h, { sigma: 16, opacity: 0.07 })
  o += rect(C.x, C.y, C.w, C.h, 'sz-card a-s2', ' rx="18"')
  o += rect(690, 106, 30, 30, 'a-s2', ' rx="8"') + circle(699, 121, 2.4, 'a-fill') + circle(711, 121, 2.4, 'a-fill') + path('M700 129h10M705 106v-5', 'a-s2') + circle(705, 99.5, 2, 'a-fill')
  o += sans(730, 117, 'assistenza clienti', { size: 14, weight: 600 }) + mono(730, 133, 'bot · online', { size: 11 })
  o += line(C.x, 150, C.x + C.w, 150, 'a-s2')
  o += rect(688, 166, 196, 60, 'a-soft2', ' rx="14"') + sans(702, 191, 'ciao! il tuo pacco è', { size: 13.5 }) + sans(702, 211, 'fermo in deposito.', { size: 13.5 })
  // «sta scrivendo…»
  const dots = [0, 1, 2]
    .map((i) => `<circle class="a-tm sz-an" cx="${706 + i * 13}" cy="257" r="3.4" style="animation-name:szp-dot;animation-duration:.9s;animation-delay:${i * 0.15}s"/>`)
    .join('')
  o += `<g class="${a({ '0,22': 'opacity:0', 24: 'opacity:1', 32: 'opacity:1', '34,100': 'opacity:0' })}" opacity="0">${rect(688, 242, 64, 30, 'a-soft2', ' rx="15"')}${dots}</g>`
  // il messaggio con il link
  o +=
    `<g class="${a({ '0,32': 'opacity:0;transform:translateY(8px)', 36: 'opacity:1;transform:none', 88: 'opacity:1', '94,100': 'opacity:0' })}">` +
    rect(688, 240, 204, 92, 'a-soft2', ' rx="14"') +
    sans(702, 265, 'paga 1,99 € di spedizione', { size: 13.5 }) +
    sans(702, 285, 'entro oggi, qui:', { size: 13.5 }) +
    rect(700, 297, 154, 24, 'a-bg a-s2', ' rx="12"') +
    mono(712, 313.5, 'bit.ly/pacco-fermo', { c: 'a-t', size: 11.5 }) +
    `</g>`
  o += rect(688, 384, 202, 34, 'a-s2', ' rx="17"') + mono(704, 405, 'scrivi un messaggio', { size: 11.5 })

  // il link che parte e viene fermato: a riposo sta contro lo scudo, barrato
  const travelX = a({ '0,44': 'transform:translateX(96px);opacity:0', 45: 'opacity:1', 56: 'transform:translateX(0);opacity:1', 62: 'opacity:1', '70,100': 'transform:translateX(0);opacity:.0' }, 'animation-timing-function:cubic-bezier(.55,0,.9,.4)')
  const travelY = a({ '0,45': 'transform:translateY(23px)', '56,100': 'transform:translateY(0)' }, 'animation-timing-function:cubic-bezier(.55,0,.9,.4)')
  o +=
    `<g transform="translate(650 286)"><g class="${travelX}"><g class="${travelY}">` +
    circle(0, 0, 17, 'a-bg a-s') +
    path('M-7.5 1.5-9.5 3.5a3.6 3.6 0 0 0 5.1 5.1l2-2M7.5-1.5 9.5-3.5a3.6 3.6 0 0 0-5.1-5.1l-2 2M-3.6 3.6 3.6-3.6', 'a-s') +
    `<path class="a-sa sz-fat ${a({ '0,56': 'stroke-dashoffset:1', '60,100': 'stroke-dashoffset:0' })}" d="M-13 13 13-13" pathLength="1" stroke-dasharray="1"/>` +
    `</g></g></g>`
  // la scia tratteggiata del link
  o += `<path class="a-sa a-dash ${a({ '0,46': 'opacity:0', 50: 'opacity:.8', 60: 'opacity:.5', '72,100': 'opacity:0' })}" d="M700 305C690 300 680 296 670 292" opacity="0"/>`

  // il timbro
  o +=
    `<g transform="translate(564 462) rotate(-7)"><g class="${a({ '0,57': 'opacity:0;transform:scale(1.7)', 61: 'opacity:1;transform:scale(.96)', 63: 'transform:scale(1)', 88: 'opacity:1', '94,100': 'opacity:0;transform:scale(1)' }, 'animation-timing-function:cubic-bezier(.5,0,.75,0)')}">` +
    rect(-90, -27, 180, 54, 'a-bg') +
    rect(-90, -27, 180, 54, 'a-sa', ' rx="6" style="stroke-width:2.4"') +
    rect(-84, -21, 168, 42, 'a-sa', ' rx="3" style="stroke-width:.9"') +
    text(0, 8, 'bloccato', { c: 'a-ta', size: 22, anchor: 'middle', weight: 650, spacing: '.16em' }) +
    `</g></g>`

  // richiami numerati sulla pagina e sulla chat, con la legenda in basso
  const calls = [
    { k: '1', x: 404, y: P.y + 22, t: 10, label: 'dominio registrato 4 giorni fa' },
    { k: '2', x: 392, y: 217, t: 16, label: 'la fretta: «entro 24 ore»' },
    { k: '3', x: 392, y: 327, t: 22, label: 'chiede password e codici' },
    { k: '4', x: 866, y: 309, t: 40, label: 'link accorciato, mandato da un bot' },
  ]
  for (const c of calls) {
    const pop = a({ [`0,${c.t}`]: 'transform:scale(0);opacity:0', [c.t + 2.2]: 'transform:scale(1.2);opacity:1', [c.t + 4]: 'transform:scale(1)', 88: 'opacity:1;transform:scale(1)', '93,100': 'opacity:0;transform:scale(1)' })
    const ping = a({ [`0,${c.t + 1}`]: 'transform:scale(1);opacity:0', [c.t + 1.5]: 'opacity:.8', [`${c.t + 9},100`]: 'transform:scale(2.6);opacity:0' })
    o += marker(c.x, c.y, c.k, { pop, ping })
  }
  o += line(56, 528, 904, 528, 'a-s2')
  calls.forEach((c, i) => {
    const x = i % 2 ? 494 : 56
    const y = i < 2 ? 562 : 594
    const show = a({ [`0,${c.t}`]: 'opacity:0;transform:translateX(-6px)', [c.t + 4]: 'opacity:1;transform:none', 88: 'opacity:1', '93,100': 'opacity:0' })
    o += `<g class="${show}">${marker(x + 11, y - 4.5, c.k)}${mono(x + 32, y, c.label, { c: 'a-t', size: 13.5 })}</g>`
  })

  const more = `@keyframes szp-dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`
  return css(more) + o
}

// ── 02 · Attacchi DDoS ───────────────────────────────────────────────────────
// Le richieste arrivano da sinistra su sette corsie: quelle false (quadratini
// d'inchiostro) si fermano al filtro, i visitatori veri (pallini blu) passano e
// arrivano al server. Sopra, il picco delle richieste e lo stato del sito.

function ddos() {
  const { a, css } = motion('szd')
  const r = rng(17)
  let o = ''

  o += plate('02', 'il filtro davanti al sito')

  // grafico delle richieste
  o += softShadow(56, 88, 372, 144, { sigma: 16, opacity: 0.06 })
  o += rect(56, 84, 372, 144, 'sz-card a-s2', ' rx="14"')
  o += mono(76, 110, 'richieste al secondo')
  o += `<rect class="a-fill sz-dim" x="296" y="101" width="9" height="9" rx="1.5"/>` + mono(311, 110, 'false', { size: 11.5 })
  o += circle(361, 105.5, 4.5, 'a-acc') + mono(371, 110, 'vere', { size: 11.5 })
  o += line(76, 210, 408, 210, 'a-s2')
  const spike = []
  for (let i = 0; i <= 22; i++) {
    const x = 76 + i * (332 / 22)
    const base = i < 9 ? 198 - r.range(0, 6) : i < 12 ? 198 - (i - 8) * 18 - r.range(0, 6) : 140 + r.range(-6, 12)
    spike.push(`${n(x)} ${n(base)}`)
  }
  const real = []
  for (let i = 0; i <= 22; i++) real.push(`${n(76 + i * (332 / 22))} ${n(200 - r.range(0, 4))}`)
  const draw = (from, to) => a({ [`0,${from}`]: 'stroke-dashoffset:1', [`${to},92`]: 'stroke-dashoffset:0;opacity:1', '97,100': 'opacity:0;stroke-dashoffset:0' }, 'animation-timing-function:linear')
  o += `<path class="a-s sz-fat ${draw(2, 62)}" d="M${spike.join('L')}" pathLength="1" stroke-dasharray="1" style="stroke-width:2"/>`
  o += `<path class="a-sa ${draw(2, 62)}" d="M${real.join('L')}" pathLength="1" stroke-dasharray="1" style="stroke-width:2.2"/>`
  const rise = spike[10].split(' ').map(Number)
  o += `<g class="${a({ '0,30': 'opacity:0', '36,92': 'opacity:1', '97,100': 'opacity:0' })}">${path(`M${n(rise[0] - 6)} ${n(rise[1])}H${n(rise[0] - 30)}`, 'a-s2')}${mono(rise[0] - 36, rise[1] + 4, 'picco', { c: 'a-t', size: 11.5, anchor: 'end' })}</g>`

  // stato del sito
  o += softShadow(532, 88, 372, 144, { sigma: 16, opacity: 0.06 })
  o += rect(532, 84, 372, 144, 'sz-card a-s2', ' rx="14"')
  o += mono(552, 110, 'stato del sito')
  o += text(550, 174, 'online', { c: 'a-ta sz-serif sz-it', size: 62, spacing: '-0.02em' })
  o += mono(552, 208, 'risponde a chi serve, anche durante il picco', { size: 11.5 })
  o += `<circle class="a-sa ${a({ '0': 'transform:scale(1);opacity:.8', '100': 'transform:scale(3);opacity:0' }, 'animation-duration:1.8s;animation-timing-function:ease-out')}" cx="872" cy="152" r="7"/>`
  o += circle(872, 152, 7, 'a-acc')

  // terreno in sezione
  const ground = 560
  const hid = nextId('szh')
  o += `<pattern id="${hid}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="a-s2" d="M0 0V9"/></pattern>`
  o += `<rect x="40" y="${ground}" width="880" height="14" style="fill:url(#${hid})"/>` + line(40, ground, 920, ground, 'a-s')

  // il server
  const R = { x: 694, y: 292, w: 164, h: ground - 292 }
  o += softShadow(R.x, R.y + 6, R.w, R.h - 6, { sigma: 14, opacity: 0.07 })
  o += rect(R.x, R.y, R.w, R.h, 'sz-card a-s', ' rx="8"')
  for (let i = 0; i < 4; i++) {
    const y = R.y + 14 + i * 63
    o += rect(R.x + 14, y, R.w - 28, 52, 'a-s2', ' rx="4"')
    o += `<circle class="a-acc sz-an" cx="${R.x + 32}" cy="${y + 26}" r="4.5" style="animation-name:szd-led;animation-duration:${(0.7 + r.range(0, 0.9)).toFixed(2)}s;animation-delay:-${r.range(0, 1).toFixed(2)}s;animation-timing-function:steps(1)"/>`
    o += circle(R.x + 48, y + 26, 4.5, 'a-soft2')
    o += path(`M${R.x + 72} ${y + 18}H${R.x + 136}M${R.x + 72} ${y + 26}H${R.x + 136}M${R.x + 72} ${y + 34}H${R.x + 120}`, 'a-s2')
  }
  o += mono(R.x + R.w / 2, R.y - 16, 'il tuo sito', { c: 'a-t', size: 13, anchor: 'middle', weight: 600 })

  // il filtro
  const F = 566
  o += rect(F - 9, 270, 18, ground - 270, 'sz-bs')
  o += `<rect class="sz-bs2 sz-an" x="${F - 9}" y="270" width="18" height="${ground - 270}" opacity="0" style="animation-name:szd-hum;animation-duration:1.4s;animation-timing-function:ease-in-out"/>`
  let teeth = ''
  for (let y = 278; y < ground - 4; y += 13) teeth += `M${F - 14} ${y}H${F + 14}`
  o += path(teeth, 'a-sa sz-thin') + line(F, 266, F, ground, 'a-sa sz-fat')
  o += mono(F, 254, 'filtro', { c: 'a-ta', size: 13, anchor: 'middle', weight: 600 })

  // le richieste
  const lanes = [300, 340, 380, 420, 460, 500, 540]
  const START = 46
  const WALL = F - 22 // dove si fermano le false
  const DOOR = R.x - 8 // dove entrano le vere
  let req = ''
  lanes.forEach((y, li) => {
    const bots = 3 + (li % 2)
    for (let k = 0; k < bots; k++) {
      const dur = r.range(2.6, 3.9)
      const at = START + ((k + r.range(0.1, 0.8)) / bots) * (WALL - START)
      req +=
        `<rect class="a-fill sz-dim sz-an szd-bot" x="${n(at)}" y="${y - 5.5}" width="11" height="11" rx="1.5"` +
        ` style="--a:${n(START - at)}px;--b:${n(WALL - at)}px;animation-duration:${dur.toFixed(2)}s;animation-delay:-${(r.next() * dur).toFixed(2)}s"/>`
    }
    if (li % 2 === 0 || li === 5) {
      const dur = r.range(4.2, 5.4)
      // a riposo metà dei visitatori sono già oltre il filtro: passano
      const at = li % 4 === 0 ? F + 24 + r.range(0, 0.8) * (DOOR - F - 40) : START + r.range(0.15, 0.75) * (WALL - START)
      req +=
        `<circle class="a-acc sz-an szd-vis" cx="${n(at)}" cy="${y}" r="6"` +
        ` style="--a:${n(START - at)}px;--b:${n(DOOR - at)}px;animation-duration:${dur.toFixed(2)}s;animation-delay:-${(r.next() * dur).toFixed(2)}s"/>`
    }
  })
  o += req
  // quelle già fermate, ammucchiate contro il filtro
  o += lanes.map((y, li) => `<rect class="a-fill" x="${WALL - 2 - (li % 3) * 13}" y="${y - 5.5 + 14}" width="11" height="11" rx="1.5" opacity=".22"/>`).join('')

  // legenda
  o += `<rect class="a-fill sz-dim" x="56" y="590" width="11" height="11" rx="1.5"/>` + mono(76, 600, 'richieste false: si fermano al filtro', { c: 'a-t', size: 13 })
  o += circle(510, 595.5, 6, 'a-acc') + mono(526, 600, 'visitatori veri: passano', { c: 'a-t', size: 13 })

  const more =
    `.sz .szd-bot{animation-name:szd-bot;animation-timing-function:linear}` +
    `.sz .szd-vis{animation-name:szd-vis;animation-timing-function:linear}` +
    `@keyframes szd-bot{0%{transform:translateX(var(--a));opacity:0}8%{opacity:1}84%{transform:translateX(var(--b));opacity:1}100%{transform:translate(var(--b),18px);opacity:0}}` +
    `@keyframes szd-vis{0%{transform:translateX(var(--a));opacity:0}6%{opacity:1}92%{transform:translateX(var(--b));opacity:1}100%{transform:translateX(var(--b));opacity:0}}` +
    `@keyframes szd-led{0%{opacity:1}50%{opacity:.25}}` +
    `@keyframes szd-hum{0%,100%{opacity:0}50%{opacity:.9}}`
  return css(more) + o
}

// ── 03 · Recupero dati ───────────────────────────────────────────────────────
// Regola 3-2-1: il computer (l'originale), il disco esterno e il cloud. I file
// spariscono dal computer, si torna alla copia di ieri e i documenti rientrano
// uno a uno dal disco, mentre l'anello del ripristino si chiude.

function recupero() {
  const { a, css } = motion('szr')
  let o = ''

  o += plate('03', 'si riparte dalla copia giusta')

  // le copie dei giorni: la linea del tempo
  o += mono(56, 98, 'copie di sicurezza, una al giorno')
  const ticks = Array.from({ length: 7 }, (_, i) => 72 + i * 58)
  o += line(ticks[0], 136, ticks[6], 136, 'a-s2')
  o += ticks.map((x) => circle(x, 136, 4.5, 'a-bg a-s2')).join('')
  o += mono(ticks[0], 162, '7 giorni fa', { size: 11 }) + mono(ticks[6], 162, 'oggi', { size: 11, anchor: 'end' })
  const back = a({ '0,18': 'transform:translateX(58px)', '32,90': 'transform:translateX(0)', '100': 'transform:translateX(58px)' }, 'animation-timing-function:cubic-bezier(.65,0,.35,1)')
  o += `<g class="${back}">` + line(ticks[5], 118, ticks[5], 150, 'a-sa') + circle(ticks[5], 136, 7.5, 'a-acc') + `</g>`
  o += `<g class="${a({ '0,30': 'opacity:0;transform:translateY(4px)', '35,88': 'opacity:1;transform:none', '93,100': 'opacity:0' })}">${mono(ticks[5], 110, 'ieri · 04:12', { c: 'a-ta', size: 12.5, anchor: 'middle', weight: 600 })}</g>`

  // il computer
  const L = { x: 72, y: 196, w: 320, h: 222 }
  o += softShadow(L.x - 12, L.y + 10, L.w + 24, L.h + 26, { sigma: 18, opacity: 0.07 })
  o += rect(L.x, L.y, L.w, L.h, 'sz-card a-s', ' rx="12"')
  o += rect(L.x + 12, L.y + 12, L.w - 24, L.h - 24, 'a-bg a-s2', ' rx="5"')
  o += mono(L.x + 26, L.y + 34, 'documenti', { size: 11.5 }) + line(L.x + 12, L.y + 44, L.x + L.w - 12, L.y + 44, 'a-s2')
  o += path(`M${L.x - 20} ${L.y + L.h}H${L.x + L.w + 20}L${L.x + L.w + 34} ${L.y + L.h + 20}Q${L.x + L.w + 36} ${L.y + L.h + 26} ${L.x + L.w + 28} ${L.y + L.h + 26}H${L.x - 28}Q${L.x - 36} ${L.y + L.h + 26} ${L.x - 34} ${L.y + L.h + 20}Z`, 'sz-card a-s')
  o += path(`M${L.x + L.w / 2 - 34} ${L.y + L.h + 26}V${L.y + L.h + 21}H${L.x + L.w / 2 + 34}V${L.y + L.h + 26}`, 'a-s2')

  const slots = []
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) slots.push({ x: L.x + 34 + c * 70, y: L.y + 60 + r * 72 })
  o += slots.map((s) => doc(s.x, s.y, 44, 54, true)).join('')

  // i documenti che tornano: partono dal disco, salgono e ricadono al loro posto
  const FROM = { x: 676, y: 352 }
  slots.forEach((s, i) => {
    const gone = 11 + i * 0.9
    const t0 = 40 + i * 3.6
    const t1 = t0 + 8.5
    const tm = t0 + 4.2
    // nel computer
    o += `<g class="${a({ [`0,${gone}`]: 'opacity:1;transform:scale(1)', [gone + 2]: 'opacity:0;transform:scale(.86)', [t1 - 0.4]: 'opacity:0;transform:scale(.86)', [t1 + 1.2]: 'opacity:1;transform:scale(1.08)', [`${t1 + 2.6},100`]: 'opacity:1;transform:scale(1)' })}">${doc(s.x, s.y)}</g>`
    // in volo
    const dx = s.x + 22 - FROM.x
    const dy = s.y + 27 - FROM.y
    const peak = s.y - 64 - FROM.y
    const fx = a({ [`0,${t0}`]: 'transform:translateX(0);opacity:0', [t0 + 0.6]: 'opacity:1', [t1 - 0.6]: 'opacity:1', [t1]: `transform:translateX(${n(dx)}px);opacity:0`, 100: `transform:translateX(${n(dx)}px);opacity:0` }, 'animation-timing-function:cubic-bezier(.45,.05,.55,.95)')
    const fy = a({ [`0,${t0}`]: 'transform:translateY(0);animation-timing-function:cubic-bezier(.2,.7,.4,1)', [tm]: `transform:translateY(${n(peak)}px);animation-timing-function:cubic-bezier(.6,0,.8,.3)`, [`${t1},100`]: `transform:translateY(${n(dy)}px)` })
    o += `<g class="${fx}" opacity="0"><g class="${fy}">${doc(FROM.x - 15, FROM.y - 19, 30, 38)}</g></g>`
  })

  // cosa dice il computer
  const said = (str, stops) => `<g class="${a(stops)}">${mono(L.x + L.w / 2, L.y + L.h + 62, str, { c: 'a-t', size: 13.5, anchor: 'middle' })}</g>`
  o += said('8 file cancellati', { '0,13': 'opacity:0', '16,74': 'opacity:1', '77,100': 'opacity:0' }).replace('<g class', '<g opacity="0" class')
  o += said('8 file ripristinati, tutto al suo posto', { 0: 'opacity:1', '12,76': 'opacity:0', '80,100': 'opacity:1' })

  // il disco esterno
  const D = { x: 664, y: 318, w: 224, h: 78 }
  o += softShadow(D.x, D.y + 6, D.w, D.h, { sigma: 14, opacity: 0.07 })
  o += rect(D.x, D.y, D.w, D.h, 'sz-card a-s', ' rx="12"')
  o += sans(D.x + 20, D.y + 33, 'disco esterno', { size: 15, weight: 600 }) + mono(D.x + 20, D.y + 55, 'ieri 04:12 · copia verificata', { size: 11 })
  o += `<circle class="a-acc sz-an" cx="${D.x + D.w - 22}" cy="${D.y + 24}" r="5" style="animation-name:szr-led;animation-duration:.5s;animation-timing-function:steps(1)"/>`

  // il cloud
  o += path('M712 236C686 236 676 214 690 200C682 180 704 164 722 174C730 152 766 148 778 170C792 158 822 164 822 188C842 190 848 214 836 226C832 232 826 236 818 236Z', 'sz-card a-s')
  o += sans(762, 194, 'cloud', { size: 15, weight: 600, anchor: 'middle' }) + mono(762, 210, 'fuori casa', { size: 11, anchor: 'middle' })

  // i collegamenti fra le tre copie
  o += path(`M${L.x + L.w} 380C520 380 560 357 ${D.x} 357`, 'a-s2 a-dash')
  o += `<path class="a-sa a-dash ${a({ '0,38': 'stroke-dashoffset:0;opacity:0', 40: 'opacity:1', 74: 'stroke-dashoffset:-88;opacity:1', '78,100': 'opacity:0;stroke-dashoffset:-88' }, 'animation-timing-function:linear')}" d="M${D.x} 357C560 357 520 380 ${L.x + L.w} 380" opacity="0"/>`
  o += path(`M776 238V${D.y}`, 'a-s2 a-dash')
  o += path(`M${L.x + L.w} 236C520 236 600 205 686 205`, 'a-s2 a-dash')

  // i tre richiami: 3 copie, 2 supporti, 1 fuori casa
  o += marker(L.x + L.w, L.y, '1') + marker(D.x + D.w, D.y, '2') + marker(842, 178, '3')

  // l'anello del ripristino
  const cx = 528
  const cy = 474
  o += `<circle class="a-soft2" cx="${cx}" cy="${cy}" r="44" style="fill:none;stroke:var(--art-soft-2);stroke-width:9"/>`
  o += `<path class="a-sa ${a({ '0,40': 'stroke-dashoffset:1;opacity:1', '76,92': 'stroke-dashoffset:0;opacity:1', '98,100': 'stroke-dashoffset:0;opacity:0' }, 'animation-timing-function:cubic-bezier(.45,.05,.55,.95)')}" d="M${cx} ${cy - 44}a44 44 0 1 1 0 88a44 44 0 1 1 0-88" style="stroke-width:9;stroke-linecap:butt" pathLength="1" stroke-dasharray="1"/>`
  o += `<g class="${a({ '0,76': 'opacity:0;transform:scale(.8)', '79,94': 'opacity:1;transform:scale(1)', '98,100': 'opacity:0' })}">${text(cx, cy + 8, '100%', { c: 'a-t a-sans', size: 22, anchor: 'middle', weight: 620, spacing: '-0.02em' })}</g>`
  o += `<g opacity="0" class="${a({ '0,40': 'opacity:0', '43,73': 'opacity:1', '76,100': 'opacity:0' })}">${mono(cx, cy + 4, 'in corso', { size: 11, anchor: 'middle' })}</g>`
  o += mono(cx, cy + 70, 'ripristino', { size: 11.5, anchor: 'middle' })

  // regola 3-2-1
  o += line(56, 562, 904, 562, 'a-s2')
  o += mono(56, 596, 'regola 3-2-1', { c: 'a-ta', size: 13.5, weight: 650 }) + mono(178, 596, 'tre copie, su due supporti diversi, una fuori casa', { c: 'a-t', size: 13.5 })

  const more = `@keyframes szr-led{0%{opacity:1}50%{opacity:.2}}`
  return css(more) + o
}

// ── Tavola ───────────────────────────────────────────────────────────────────

const VARIANTI = {
  phishing: { draw: phishing, label: 'Una finta pagina di accesso e la chat di un bot: i dettagli della truffa sono segnati e il link viene bloccato dallo scudo' },
  ddos: { draw: ddos, label: 'Richieste false fermate da un filtro davanti al server, mentre i visitatori veri passano e il sito resta online' },
  recupero: { draw: recupero, label: 'I file cancellati tornano nel computer dalla copia di ieri sul disco esterno, secondo la regola 3-2-1' },
}

export const SICUREZZA = Object.keys(VARIANTI)

export function sicurezza({ variant = 'phishing', tone = 'paper', label, bg = true, w, h } = {}) {
  const v = VARIANTI[variant]
  if (!v) throw new Error(`Tavola sicurezza sconosciuta: "${variant}". Disponibili: ${SICUREZZA.join(', ')}`)
  // la tavola è disegnata a 960 × 640 (3:2): `w`/`h` dal `ratio` dei dati la riquadrano senza deformarla
  const out = svg({ w: W, h: H, tone, label: label || v.label, body: v.draw(), bg })
  const box = w && h ? out.replace(`viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"`, `viewBox="0 0 ${W} ${H}" width="${w}" height="${h}"`) : out
  return box.replace('class="art ', `class="art sz sz--${variant} `)
}
