// Diretta OS · le due scene di prima («Dove vivo» in SVG, il montaggio di foto dell'azienda), tenute qui com'erano
// e messe al centro della tela piena finché non arrivano quelle nuove (scene/dove/ e scene/sito/). Da buttare dopo.
import { mappaDove } from '/scene/dove-mappa.js'

const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }
const due = (n) => String(n).padStart(2, '0')
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const attivo = (el) => !!el.closest('.pezzo')?.classList.contains('su') && !document.getElementById('scena')?.classList.contains('dal-vivo')


// ── il meteo: le stesse icone del pezzo meteo, rimpicciolite per stare nella scena ──
const TEMPO = {
  sole: '<span class="dv-raggi"><svg viewBox="0 0 64 64"><g stroke="#ccff00" stroke-width="5" stroke-linecap="round"><path d="M32 5v8M32 51v8M5 32h8M51 32h8M12.9 12.9l5.7 5.7M45.4 45.4l5.7 5.7M12.9 51.1l5.7-5.7M45.4 18.6l5.7-5.7"/></g></svg></span><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="12.5" fill="#ccff00"/></svg>',
  luna: '<svg viewBox="0 0 64 64"><path d="M44 40.5A20 20 0 0 1 23.5 12a21 21 0 1 0 26.8 27.4 20 20 0 0 1-6.3 1.1z" fill="#ccff00"/><circle cx="46" cy="16" r="2.5" fill="#e2b3ff"/><circle cx="54" cy="27" r="1.8" fill="#e2b3ff"/></svg>',
  nuvolo: '<svg viewBox="0 0 64 64"><circle cx="23" cy="22" r="11" fill="#ccff00"/><path d="M20 52a11 11 0 0 1-1-21.9A15 15 0 0 1 48 31a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/></svg>',
  nuvole: '<svg viewBox="0 0 64 64"><path d="M30 34a9 9 0 0 1 0-18 12 12 0 0 1 23 2 8 8 0 0 1 1 16z" fill="#8f86a0"/><path d="M17 54a11 11 0 0 1-1-21.9A15 15 0 0 1 45 33a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/></svg>',
  nebbia: '<svg viewBox="0 0 64 64"><path d="M20 34a11 11 0 0 1-1-21.9A15 15 0 0 1 48 13a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g stroke="#c9a3ff" stroke-width="5" stroke-linecap="round"><path d="M10 43h44M16 53h32"/></g></svg>',
  pioggia: '<svg viewBox="0 0 64 64"><path d="M20 38a11 11 0 0 1-1-21.9A15 15 0 0 1 48 17a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g stroke="#8ea1ff" stroke-width="5" stroke-linecap="round"><path d="M22 46l-3 9M33 46l-3 9M44 46l-3 9"/></g></svg>',
  neve: '<svg viewBox="0 0 64 64"><path d="M20 38a11 11 0 0 1-1-21.9A15 15 0 0 1 48 17a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g fill="#c9e4ff"><circle cx="21" cy="50" r="3.6"/><circle cx="33" cy="54" r="3.6"/><circle cx="45" cy="50" r="3.6"/></g></svg>',
  temporale: '<svg viewBox="0 0 64 64"><path d="M20 36a11 11 0 0 1-1-21.9A15 15 0 0 1 48 15a10.5 10.5 0 0 1 0 21z" fill="#8f86a0"/><path d="M35 33l-11 15h8l-4 13 13-17h-8z" fill="#ccff00"/></svg>',
}

// ── «Dove vivo»: la mappa nativa in SVG (geometrie OpenStreetMap), dall'alto e senza indirizzi; qui l'animazione, la bussola corretta, il meteo e l'ora ──
function bussolaDove() {
  let tacche = ''
  for (let i = 0; i < 48; i++) {
    const a = i * 7.5 * Math.PI / 180
    const r1 = i % 6 === 0 ? 50 : 54, r2 = 59
    tacche += `<path d="M${(80 + r1 * Math.cos(a)).toFixed(1)} ${(80 + r1 * Math.sin(a)).toFixed(1)}L${(80 + r2 * Math.cos(a)).toFixed(1)} ${(80 + r2 * Math.sin(a)).toFixed(1)}"/>`
  }
  return `<svg viewBox="0 0 160 160" aria-label="Bussola, nord in alto">
    <circle class="bb-fondo" cx="80" cy="80" r="74"/>
    <circle class="bb-anello" cx="80" cy="80" r="68"/>
    <g class="bb-tacche">${tacche}</g>
    <g class="bb-aste"><path d="M80 22v116M22 80h116"/></g>
    <g class="bb-ago">
      <path class="bb-lato" d="M80 80L94 66L86 80L94 94Z"/>
      <path class="bb-lato" d="M80 80L66 94L80 86L94 94Z" opacity=".45"/>
      <path class="bb-nord" d="M80 28L88 80L80 74L72 80Z"/>
      <path class="bb-sud" d="M80 132L72 80L80 86L88 80Z"/>
      <circle class="bb-perno" cx="80" cy="80" r="5"/>
      <circle class="bb-punto" cx="80" cy="80" r="1.8"/>
    </g>
    <text class="bb-n" x="80" y="17">N</text><text class="bb-l" x="144" y="84">E</text><text class="bb-l" x="80" y="151">S</text><text class="bb-l" x="16" y="84">O</text>
  </svg>`
}

function creaDove0() {
  const el = $(`<div class="dv" data-fase="giorno" data-meteo="sereno" data-vento="0">
    <div class="dv-scena">
      ${mappaDove()}
      <div class="dv-meteo"><span class="dv-ico"></span><div class="dv-met"><b>–°</b><span>in attesa del cielo</span></div></div>
      <div class="dv-ora"><b>--:--</b><span class="dv-data">oggi</span></div>
      <div class="dv-bussola">${bussolaDove()}</div>
    </div>
  </div>`)
  const ico = el.querySelector('.dv-ico'), gradi = el.querySelector('.dv-met b'), testo = el.querySelector('.dv-met span')
  const numOra = el.querySelector('.dv-ora b'), data = el.querySelector('.dv-data')
  let meteo = null, prova = null, chiaveMeteo = '', ultimoMinuto = -1, frameScala = 0
  // la scala vera del pezzo (la regia la cambia con un transform): sotto 1× si nascondono i dettagli minuti
  function controllaScala() {
    const w = el.getBoundingClientRect().width
    const k = w / (el.offsetWidth || 800)
    const s = k < .92 ? 'piccola' : k > 1.7 ? 'grande' : 'normale'
    if (el.dataset.scala !== s) el.dataset.scala = s
  }
  const TESTI = { sole: 'sereno', luna: 'sereno', nuvolo: 'poco nuvoloso', nuvole: 'coperto', nebbia: 'nebbia', pioggia: 'pioggia', neve: 'neve', temporale: 'temporale' }
  function aggiornaOra(forza = false) {
    const d = new Date()
    const t = `${due(d.getHours())}:${due(d.getMinutes())}`
    if (forza || numOra.textContent !== t) numOra.textContent = t
    const gg = `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`
    if (forza || data.textContent !== gg) data.textContent = gg
  }
  const tipoMeteo = () => (prova && prova !== 'vento' ? prova : meteo?.icona ?? 'nuvole')
  const tipoFx = (tipo) => tipo === 'temporale' ? 'temporale' : tipo === 'pioggia' ? 'pioggia' : tipo === 'neve' ? 'neve' : tipo === 'nebbia' ? 'nebbia' : (tipo === 'nuvolo' || tipo === 'nuvole') ? 'nuvoloso' : 'sereno'
  function disegnaMeteo() {
    if (!meteo) return
    const tipo = tipoMeteo()
    const ventoso = prova === 'vento' || meteo.vento >= 25
    const k = `${tipo}|${meteo.gradi}|${meteo.testo}|${meteo.min}|${meteo.max}|${ventoso}`
    if (k === chiaveMeteo) return
    chiaveMeteo = k
    ico.innerHTML = TEMPO[tipo] ?? TEMPO.nuvole
    ico.dataset.tipo = tipo
    gradi.textContent = `${meteo.gradi}°`
    testo.textContent = `${prova ? TESTI[tipo] : meteo.testo}${ventoso ? ` · vento ${Math.max(meteo.vento, prova === 'vento' ? 40 : 0)} km/h` : ''} · ${meteo.min}°/${meteo.max}°`
  }
  function fase() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60
    let f = h < 6 || h >= 21 ? 'notte' : h < 8 ? 'mattina' : h < 17 ? 'giorno' : h < 20 ? 'tramonto' : 'sera'
    if (meteo?.icona === 'luna') f = 'notte'
    const tipo = tipoMeteo()
    const m = tipoFx(tipo)
    const vento = prova === 'vento' || (meteo?.vento ?? 0) >= 25 ? '1' : '0'
    if (el.dataset.fase !== f) el.dataset.fase = f
    if (el.dataset.meteo !== m) el.dataset.meteo = m
    if (el.dataset.vento !== vento) el.dataset.vento = vento
    // direzione del sole (approssimata, ora locale): l'ombra cade dal lato opposto
    const t = Math.min(1, Math.max(0, (h - 6) / 14)), az = Math.PI / 2 + t * Math.PI, elev = Math.sin(t * Math.PI)
    const len = 5 + 10 * Math.max(0, 1 - elev)
    el.style.setProperty('--ombra-x', `${(-Math.sin(az) * len).toFixed(1)}px`)
    el.style.setProperty('--ombra-y', `${(Math.cos(az) * len).toFixed(1)}px`)
    el.style.setProperty('--luce-rot', `${(az * 180 / Math.PI - 90).toFixed(0)}deg`)
  }
  aggiornaOra(true)
  controllaScala()
  fase()
  return {
    el,
    aggiorna(s) { meteo = s.meteo; prova = s.meteoProva ?? null; aggiornaOra(); disegnaMeteo(); controllaScala(); fase() },
    giro() {
      if (++frameScala % 30 === 0) controllaScala()
      aggiornaOra(); disegnaMeteo()
      const m = new Date().getMinutes()
      if (m !== ultimoMinuto) { ultimoMinuto = m; fase() }
    },
  }
}

// ── «Azienda di Giugnoh»: un montaggio di foto e zoom, in loop. Il nome vero dell'azienda non compare mai. ──
const AZ_SLIDES = [
  { f: 'campi', t: 'Sessantatré biolche', p: 'tra l’acqua e i campi, dal 2007', stat: ['63', 'biolche'], fx: 'zi', pos: '50% 52%', d: 4.2 },
  { f: 'casa', t: 'La casa', p: 'le finestre ad arco, il giardino', stat: ['', ''], fx: 'dx', pos: '50% 46%', d: 3.8 },
  { f: 'irrigazione', t: 'I canali', p: 'tra due fiumi, nei campi', stat: ['6', 'produzioni'], fx: 'dx', pos: '50% 52%', d: 3.8 },
  { f: 'andane', t: 'Le andane', p: 'tre giorni di sole, poi il fieno', stat: ['3', 'giorni'], fx: 'zi', pos: '50% 52%', d: 3.8 },
  { f: 'capannone', t: 'Trenta pannelli', p: 'il tetto che lavora', stat: ['60%', 'energia'], fx: 'zo', pos: '50% 56%', d: 3.6 },
  { f: 'gelsi', t: 'I gelsi', p: 'tronchi nodosi, ombre lunghe', stat: ['', ''], fx: 'sal', pos: '50% 42%', d: 3.6 },
  { f: 'viale', t: 'Il viale dei platani', p: 'una fila lunga, verso i campi', stat: ['2007', 'l’inizio'], fx: 'giu', pos: '50% 56%', d: 3.8 },
  { f: 'fontana', t: 'L’airone di guardia', p: 'l’acqua che resta', stat: ['', ''], fx: 'zi', pos: '50% 56%', d: 3.4 },
  { f: 'tramonto', t: 'La giornata si mette da parte', p: 'un rullo dopo l’altro, la stagione', stat: ['', ''], fx: 'dx', pos: '50% 56%', d: 4.6, finale: true },
]
const AZ_TOT = AZ_SLIDES.length
function creaAzienda0() {
  const BORDO = 'M20 30 C 140 12, 320 30, 490 22 C 660 14, 840 36, 970 52 C 994 62, 996 116, 990 184 C 980 300, 994 430, 980 522 C 968 586, 880 608, 780 602 C 620 592, 430 608, 280 596 C 130 584, 22 598, 14 522 C 6 452, 18 342, 10 242 C 4 162, 4 94, 20 30 Z'
  const el = $(`<div class="az">
    <div class="az-quadro" style="clip-path:path('${BORDO}')">
      <div class="az-foto a"><img alt=""></div><div class="az-foto b"><img alt=""></div>
      <div class="az-velo"></div><div class="az-grana"></div><div class="az-luce"></div>
      <div class="az-marchio"><span class="az-sole">${SOLE_MARCHIO()}</span><div><b>Azienda di Giugnoh</b><small>dal 2007 · in pianura</small></div></div>
      <div class="az-testi"><h3 class="az-titolo"></h3><p class="az-sotto"></p></div>
      <div class="az-stat"><b></b><span></span></div>
      <div class="az-finale"><b>Azienda di Giugnoh</b><span>dal 2007 · in pianura</span></div>
      <div class="az-piede"><div class="az-barra"><i></i></div></div>
    </div>
    <svg class="az-bordo" viewBox="0 0 1000 620" aria-hidden="true"><path d="${BORDO}" fill="none" stroke="#0b090e" stroke-width="10" stroke-linejoin="round"/><path d="M20 30 C 140 12, 320 30, 490 22 C 660 14, 840 36, 970 52" fill="none" stroke="#f6f4f8" stroke-width="2.4" opacity=".26" stroke-linecap="round"/></svg>
  </div>`)
  const quad = el.querySelector('.az-quadro'), strati = [el.querySelector('.az-foto.a'), el.querySelector('.az-foto.b')]
  const img = strati.map((s) => s.querySelector('img')), titolo = el.querySelector('.az-titolo'), sotto = el.querySelector('.az-sotto')
  const stat = el.querySelector('.az-stat'), statN = stat.querySelector('b'), statT = stat.querySelector('span'), barra = el.querySelector('.az-barra i')
  let i = -1, giro = 0, prossimo = 0, era = false
  const preloaded = new Set()
  function preload(n) { // (solo le due che arrivano: nove foto tutte insieme sarebbero troppa memoria)
    for (let k = 1; k <= 2; k++) {
      const s = AZ_SLIDES[(n + k) % AZ_TOT]
      if (preloaded.has(s.f)) continue
      preloaded.add(s.f)
      const im = new Image()
      im.src = `/scene/azienda/${s.f}.webp`
    }
  }
  function mostra(n, prima = false) {
    const s = AZ_SLIDES[n], strato = strati[giro], altro = strati[giro ^ 1]
    img[giro].src = `/scene/azienda/${s.f}.webp`
    img[giro].style.objectPosition = s.pos
    img[giro].style.setProperty('--d', `${s.d}s`)
    img[giro].className = s.fx
    void img[giro].offsetWidth
    img[giro].classList.add('vivo')
    strato.classList.add('su')
    if (!prima) altro.classList.remove('su')
    preload(n)
    titolo.textContent = s.t
    sotto.textContent = s.p
    statN.textContent = s.stat[0]
    statT.textContent = s.stat[1]
    stat.classList.toggle('vuoto', !s.stat[0])
    quad.classList.toggle('finale', !!s.finale)
    barra.style.transition = 'none'; barra.style.width = '0%'
    requestAnimationFrame(() => requestAnimationFrame(() => { if (el.closest('.pezzo')?.classList.contains('su')) { barra.style.transition = `width ${s.d}s linear`; barra.style.width = '100%' } }))
    giro ^= 1
  }
  return {
    el,
    giro(dt, t) {
      if (!attivo(el)) { era = false; return }
      if (!era) { era = true; prossimo = t + (i < 0 ? .15 : .7) }
      if (i < 0 || t >= prossimo) {
        const vecchio = i
        i = i < 0 ? 0 : (i + 1) % AZ_TOT
        mostra(i, vecchio < 0)
        prossimo = t + AZ_SLIDES[i].d
      }
    },
  }
}
function SOLE_MARCHIO() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="13" fill="#ccff00" stroke="#0b090e" stroke-width="3"/><g stroke="#ccff00" stroke-width="4" stroke-linecap="round"><path d="M32 5v9M32 50v9M5 32h9M50 32h9M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g><path d="M8 52c9-6 15-6 24 0 9-6 15-6 24 0" fill="none" stroke="#f6f4f8" stroke-width="3" stroke-linecap="round"/></svg>`
}


// al centro della tela 1920 × 1080, ingrandite quanto ci stanno
function piena(x, w, h) {
  const k = Math.min(1840 / w, 1040 / h)
  const el = $('<div class="sc-vecchia"></div>')
  x.el.style.cssText += `;position:absolute;left:${Math.round((1920 - w) / 2)}px;top:${Math.round((1080 - h) / 2)}px;transform:scale(${k.toFixed(3)});transform-origin:50% 50%`
  el.append(x.el)
  return { el, giro: x.giro, aggiorna: x.aggiorna }
}
export const creaDove = () => piena(creaDove0(), 800, 500)
export const creaAzienda = () => piena(creaAzienda0(), 1000, 620)
