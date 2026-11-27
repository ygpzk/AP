// 04 · Radio pzk. Non è il brano di Spotify: è una traduzione in 8 bit generata
// dal vivo. Il seme viene dal brano (o dallo stato), e da lì nascono scala, tempo
// e timbro. Web Audio, Media Session e un analizzatore per le barre.
// La grafica (27.11): un boombox anni '80 disegnato, col display VFD (le barre sono il canvas), la lancetta di
// sintonia, la cassetta che gira, gli altoparlanti che pompano coi bassi veri dell'analizzatore e la chiocciola DJ
// sul manico, che annuisce al tempo del brano e dorme quando la radio è spenta.
import { esc, semi, limita, telaPronta } from '../utils.js'

const T = {
  it: {
    accendi: 'accendi',
    spegni: 'spegni',
    nota: 'Non è il brano di Spotify: è una traduzione generata qui, nota per nota. Il seme cambia col brano (o con lo stato).',
    volume: 'Volume',
    pronta: 'pronta',
    no: 'Web Audio non disponibile',
    titolo: 'Radio pzk',
    artista: 'generata dal vivo',
    album: 'pzkko.it/#studio',
    ferma: 'in pausa',
    onda: 'in onda',
    etichetta: 'Radio pzk: un boombox disegnato. Si accende col tasto qui sotto.',
    marca: 'radio pzk 88.8 fm',
    motto: 'la radio che nessuno ha chiesto',
    serigrafia: 'stereo · 4 bande · 0 ascoltatori',
    postit: 'volume max 55%: lo dice il condominio',
    timbro: 'non è spotify',
    bassi: 'bassi',
    nastro: 'mixtape pzk',
    lato: 'lato',
    qui: 'noi',
    premi: '← premi qui',
    dj: 'La chiocciola DJ: clicca per una battuta',
    nessuno: 'nessun brano · suona lo stato',
    stati: { online: 'online', idle: 'assente', dnd: 'non disturbare', offline: 'offline' },
    acceso: [
      'Prossimo pezzo: lo stesso, ma in 8 bit.',
      'Questa la dedico a chi parcheggia sul marciapiede.',
      'Richieste? No.',
      'Zero pubblicità, zero ascoltatori, zero problemi.',
      'Vado piano, ma il tempo lo tengo.',
      'Se la sai, non cantarla: è in 8 bit.',
      'In diretta dal guscio. Il segnale arriva fino al cancello.',
    ],
    spento: [
      'Zzz… la radio è spenta, e anche io.',
      'Premi ▶, io intanto dormo.',
      'Trasmettiamo dalle nove alle nove e un quarto.',
      'Il DJ è in pausa sindacale.',
    ],
    tasti: {
      rec: 'REC? Registrare la radio è pirateria. Noi siamo onesti, più o meno.',
      rew: 'Indietro non si torna: è una radio, non una macchina del tempo.',
      ff: 'Avanti veloce? Sono una lumaca.',
      eject: 'La cassetta è incollata dentro dal 1987.',
      tono: 'I bassi sono già al massimo. Lo sa anche il vicino.',
      antenna: 'Prende solo Radio pzk. Per scelta.',
    },
  },
  en: {
    accendi: 'turn on',
    spegni: 'turn off',
    nota: 'This is not the Spotify track: it is a translation generated here, note by note. The seed changes with the track (or the status).',
    volume: 'Volume',
    pronta: 'ready',
    no: 'Web Audio not available',
    titolo: 'Radio pzk',
    artista: 'generated live',
    album: 'pzkko.it/#studio',
    ferma: 'paused',
    onda: 'on air',
    etichetta: 'Radio pzk: a drawn boombox. Turn it on with the key below.',
    marca: 'radio pzk 88.8 fm',
    motto: 'the radio nobody asked for',
    serigrafia: 'stereo · 4 bands · 0 listeners',
    postit: 'max volume 55%: house rules',
    timbro: 'not spotify',
    bassi: 'bass',
    nastro: 'mixtape pzk',
    lato: 'side',
    qui: 'us',
    premi: '← press here',
    dj: 'The DJ snail: click for a joke',
    nessuno: 'no track · playing the status',
    stati: { online: 'online', idle: 'away', dnd: 'do not disturb', offline: 'offline' },
    acceso: [
      'Next up: the same song, but in 8 bit.',
      'This one goes out to whoever parks on the pavement.',
      'Requests? No.',
      'Zero ads, zero listeners, zero problems.',
      'I am slow, but I keep the beat.',
      'If you know the words, don’t sing: it’s 8 bit.',
      'Live from the shell. The signal reaches the gate.',
    ],
    spento: [
      'Zzz… the radio is off, and so am I.',
      'Press ▶, I’ll be sleeping.',
      'We broadcast from nine to quarter past nine.',
      'The DJ is on a union break.',
    ],
    tasti: {
      rec: 'REC? Taping the radio is piracy. We are honest, more or less.',
      rew: 'No going back: it’s a radio, not a time machine.',
      ff: 'Fast forward? I am a snail.',
      eject: 'The tape has been glued in since 1987.',
      tono: 'The bass is already maxed out. The neighbour knows.',
      antenna: 'It only gets Radio pzk. By choice.',
    },
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]
const MODI = [[0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10], [0, 1, 3, 5, 7, 8, 10], [0, 2, 4, 7, 9], [0, 3, 5, 7, 10]]
const TIPI = ['triangle', 'square', 'sawtooth', 'sine']

// i colori del vetro VFD (il display è un oggetto: non cambia col tema)
const VFD = { freddo: '#5ef2d0', medio: '#c6f56a', caldo: '#ffb347', spento: 'rgba(94, 242, 208, .085)', picco: '#ff7a4d' }
// la scala della sintonia: 87.5–108 MHz; noi stiamo a 88.8
const FM_MIN = 87.5, FM_MAX = 108
const posFM = (f) => (f - FM_MIN) / (FM_MAX - FM_MIN)

// ── i disegni ────────────────────────────────────────────────────────────────────────────────────────────────────
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' }
function cifra(x, y, w, h, s, i) {
  const r = (k, a, b, c, d) => `<rect data-c="${i}" data-s="${k}" x="${a.toFixed(2)}" y="${b.toFixed(2)}" width="${c.toFixed(2)}" height="${d.toFixed(2)}" rx="1.1"/>`
  const m = h / 2
  return r('a', x + s * .7, y, w - s * 1.4, s) + r('b', x + w - s, y + s * .7, s, m - s * 1.05) + r('c', x + w - s, y + m + s * .35, s, m - s * 1.05)
    + r('d', x + s * .7, y + h - s, w - s * 1.4, s) + r('e', x, y + m + s * .35, s, m - s * 1.05) + r('f', x, y + s * .7, s, m - s * 1.05)
    + r('g', x + s * .7, y + m - s / 2, w - s * 1.4, s)
}
const svgCifre = () => `<svg class="lab-radio__cifre" viewBox="0 0 100 46" aria-hidden="true" focusable="false">
  <g transform="skewX(-7) translate(5 0)">${cifra(4, 6, 18, 34, 3.6, 0)}${cifra(27, 6, 18, 34, 3.6, 1)}<circle data-c="p" cx="52" cy="38.2" r="2.1"/>${cifra(57, 6, 18, 34, 3.6, 2)}</g>
  <text x="84" y="15" class="lab-radio__fm">FM</text>
  <text x="84" y="29" class="lab-radio__st" data-st>ST</text>
  <text x="84" y="40" class="lab-radio__mhz">MHz</text>
</svg>`

// le sfumature in comune (cromo, gomma, cono): un SVG vuoto con le defs, gli altri le richiamano per id
const svgDefs = (u) => `<svg class="lab-radio__defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="${u}cromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfcfd"/><stop offset=".32" stop-color="#9da1a8"/><stop offset=".55" stop-color="#eef0f2"/><stop offset=".8" stop-color="#6d7178"/><stop offset="1" stop-color="#c9ccd1"/></linearGradient>
  <radialGradient id="${u}gomma" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#121213"/><stop offset=".9" stop-color="#3b3c3f"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient>
  <radialGradient id="${u}cono" cx=".46" cy=".42" r=".6"><stop offset="0" stop-color="#4a4c50"/><stop offset=".45" stop-color="#232427"/><stop offset="1" stop-color="#0d0d0e"/></radialGradient>
  <radialGradient id="${u}cupola" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#c9ccd1"/><stop offset=".7" stop-color="#5d6066"/><stop offset="1" stop-color="#2a2b2e"/></radialGradient>
  <linearGradient id="${u}vetro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity=".04"/><stop offset=".31" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".63" stop-color="#fff" stop-opacity=".07"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="${u}guscio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d44"/><stop offset="1" stop-color="#1f2126"/></linearGradient>
  <clipPath id="${u}finestra"><rect x="44" y="40" width="72" height="22" rx="4"/></clipPath>
</defs></svg>`

function svgCassa(u, lato) {
  const viti = [[19, 16], [81, 16], [19, 84], [81, 84]]
  const anelli = [41, 37, 33, 29, 25].map((r) => `<circle r="${r}" fill="none" stroke="rgba(255,255,255,.045)" stroke-width="1"/>`).join('')
  return `<span class="lab-radio__cono lab-radio__cono--${lato}" aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false">
    <circle cx="50" cy="50" r="49" fill="url(#${u}cromo)" stroke="#2b2c30" stroke-width="1"/>
    <circle cx="50" cy="50" r="45.2" fill="#0e0e0f"/>
    ${viti.map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="2.4" fill="url(#${u}cupola)" stroke="#222" stroke-width=".5"/><path d="M-1.6 -.6 L1.6 .6" stroke="#2a2a2a" stroke-width=".8"/></g>`).join('')}
    <circle cx="50" cy="50" r="43" fill="url(#${u}gomma)"/>
    <g class="lab-radio__membrana" transform="translate(50 50)">
      <circle r="38" fill="url(#${u}cono)"/>
      ${anelli}
      <circle r="14.5" fill="#0b0b0c"/>
      <circle r="13" fill="url(#${u}cupola)"/>
      <ellipse cx="-4" cy="-5" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30)"/>
    </g>
    <path d="M18 32 A36 36 0 0 1 40 14" stroke="#fff" stroke-opacity=".16" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg></span>`
}

function svgCassetta(u, lang) {
  const denti = [0, 60, 120, 180, 240, 300].map((a) => `<rect x="-1" y="-6.6" width="2" height="2.6" fill="#f4f1e8" transform="rotate(${a})"/>`).join('')
  const bobina = (x) => `<g transform="translate(${x} 51)"><g class="lab-radio__bobina"><circle r="6.6" fill="#f4f1e8" stroke="#3a3a3a" stroke-width=".8"/><circle r="3.6" fill="#141414"/>${denti}</g></g>`
  return `<svg class="lab-radio__cassetta" viewBox="0 0 160 104" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="158" height="102" rx="7" fill="#0f1012" stroke="#000"/>
    <rect x="9" y="9" width="142" height="86" rx="5" fill="url(#${u}guscio)" stroke="#08080a"/>
    ${[[15, 15], [145, 15], [15, 89], [145, 89], [80, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#777b82" stroke="#111" stroke-width=".6"/>`).join('')}
    <rect x="18" y="14" width="124" height="54" rx="3" fill="#f6efd9"/>
    <rect x="18" y="14" width="124" height="9" fill="#b3121f"/>
    <text x="24" y="21.4" class="lab-radio__c60">C-60 · ${esc(t(lang, 'lato'))} A</text>
    <text x="137" y="21.4" text-anchor="end" class="lab-radio__c60">PZK</text>
    <text x="24" y="35.5" class="lab-radio__mano">${esc(t(lang, 'nastro'))}</text>
    <path d="M24 37.5 Q60 35.2 98 37.6" stroke="#1446a0" stroke-width=".9" fill="none" opacity=".7"/>
    <rect x="44" y="40" width="72" height="22" rx="4" fill="#24170f" stroke="#111" stroke-width="1"/>
    <g clip-path="url(#${u}finestra)">
      <circle data-pacco="sx" cx="58" cy="51" r="17" fill="#3d2818"/>
      <circle data-pacco="dx" cx="102" cy="51" r="11" fill="#3d2818"/>
      <rect x="44" y="40" width="72" height="22" fill="url(#${u}vetro)"/>
    </g>
    ${bobina(58)}${bobina(102)}
    <path d="M40 95 L46 74 L114 74 L120 95 Z" fill="#2c2f35" stroke="#08080a"/>
    ${[56, 68, 80, 92, 104].map((x) => `<circle cx="${x}" cy="85" r="${x === 80 ? 2.6 : 2}" fill="#060607"/>`).join('')}
    <rect x="4" y="4" width="152" height="96" rx="6" fill="url(#${u}vetro)" stroke="rgba(255,255,255,.12)" stroke-width=".8"/>
  </svg>`
}

// la chiocciola DJ: guscio arancione a spirale, cuffie rosse, antennine con gli occhi; dorme o annuisce
function spirale() {
  const p = []
  for (let a = 0; a <= Math.PI * 4.6; a += 0.12) {
    const r = 2.2 + a * 1.86
    p.push(`${(48 + Math.cos(a + 2.2) * r).toFixed(1)} ${(50 + Math.sin(a + 2.2) * r * 0.94).toFixed(1)}`)
  }
  return `M${p.join(' L')}`
}
const svgLumaca = () => `<svg class="lab-radio__lumaca" viewBox="0 0 124 92" aria-hidden="true" focusable="false">
  <path class="lab-radio__piede" d="M5 86 C5 79 16 76 34 76 L92 75 C104 75 112 79 112 84 C112 88 106 89 98 89 L12 89 C7 89 5 88 5 86 Z" fill="#9cc7c1" stroke="#1d3b44" stroke-width="2.2"/>
  <path d="M14 84 L96 83" stroke="#1d3b44" stroke-width="1" stroke-dasharray="2 4" opacity=".5"/>
  <g class="lab-radio__guscio">
    <circle cx="48" cy="50" r="29" fill="#e8743b" stroke="#1d3b44" stroke-width="2.4"/>
    <path d="${spirale()}" fill="none" stroke="#9e3b12" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
    <path d="${spirale()}" fill="none" stroke="#1d3b44" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M28 34 Q36 24 50 23" stroke="#ffd9b8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>
  </g>
  <g class="lab-radio__testa">
    <path d="M84 77 C88 62 92 44 98 37 C104 30 115 31 117 41 C119 53 114 67 108 78 Z" fill="#9cc7c1" stroke="#1d3b44" stroke-width="2.2"/>
    <path d="M101 34 L95 9" stroke="#1d3b44" stroke-width="5.4" stroke-linecap="round"/><path d="M101 34 L95 9" stroke="#9cc7c1" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M110 34 L115 9" stroke="#1d3b44" stroke-width="5.4" stroke-linecap="round"/><path d="M110 34 L115 9" stroke="#9cc7c1" stroke-width="2.8" stroke-linecap="round"/>
    <g class="lab-radio__occhi-aperti">
      <circle cx="95" cy="8" r="5" fill="#fff" stroke="#1d3b44" stroke-width="1.8"/><circle cx="96.4" cy="8.6" r="2.2" fill="#161616"/>
      <circle cx="115" cy="8" r="5" fill="#fff" stroke="#1d3b44" stroke-width="1.8"/><circle cx="116.4" cy="8.6" r="2.2" fill="#161616"/>
    </g>
    <g class="lab-radio__occhi-chiusi" fill="none" stroke="#1d3b44" stroke-width="1.8" stroke-linecap="round">
      <circle cx="95" cy="8" r="5" fill="#9cc7c1"/><circle cx="115" cy="8" r="5" fill="#9cc7c1"/>
      <path d="M91 8.5 Q95 11.5 99 8.5"/><path d="M111 8.5 Q115 11.5 119 8.5"/>
    </g>
    <g class="lab-radio__occhiali"><path d="M100.5 6.5 Q105 3.5 109.5 6.5" fill="none" stroke="#161616" stroke-width="1.8"/>
      <ellipse cx="95" cy="8.4" rx="6.6" ry="5.2" fill="#161616"/><ellipse cx="115" cy="8.4" rx="6.6" ry="5.2" fill="#161616"/>
      <path d="M91.5 6.4 L94.5 5.2 M111.5 6.4 L114.5 5.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".85"/></g>
    <path d="M90 41 C90 22 121 21 121 41" fill="none" stroke="#161616" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="85.5" y="38" width="8" height="13" rx="3" fill="#b3121f" stroke="#161616" stroke-width="1.6"/>
    <rect x="116.5" y="38" width="8" height="13" rx="3" fill="#b3121f" stroke="#161616" stroke-width="1.6"/>
    <path class="lab-radio__bocca" d="M102 55 Q108 61 114 53" fill="none" stroke="#1d3b44" stroke-width="2" stroke-linecap="round"/>
    <circle cx="112" cy="49" r="2.4" fill="#f29a8a" opacity=".7"/>
  </g>
  <g class="lab-radio__zzz" fill="#1446a0"><text x="72" y="22">z</text><text x="64" y="12" font-size="11">z</text><text x="54" y="5" font-size="13">Z</text></g>
</svg>`

export default {
  id: 'radio',
  titolo: { it: 'Radio pzk', en: 'Radio pzk' },
  testo: {
    it: 'Il brano che sta suonando diventa un seme: da lì parte una piccola radio in 8 bit, generata nota per nota nel browser. Con le barre che ballano.',
    en: 'The track that is playing becomes a seed: from there a little 8-bit radio starts, generated note by note in the browser. With dancing bars.',
  },
  tecnologie: ['Web Audio', 'Media Session', 'AnalyserNode'],
  monta(el, api) {
    const lang = api.lang
    const supportato = !!(window.AudioContext || window.webkitAudioContext)
    const u = `lr${Math.random().toString(36).slice(2, 7)}-`
    el.innerHTML = `<div class="lab-radio" data-on="0" data-vis="1" role="group" aria-label="${esc(t(lang, 'etichetta'))}">
      ${svgDefs(u)}
      <div class="lab-radio__cielo">
        <span class="lab-radio__antenna" data-k="antenna" aria-hidden="true"><i></i><b class="lab-radio__onde"><s></s><s></s><s></s></b></span>
        <span class="lab-radio__manico" aria-hidden="true"><i></i></span>
        <span class="lab-radio__postit" aria-hidden="true">${esc(t(lang, 'postit'))}</span>
        <button type="button" class="lab-radio__dj" data-dj aria-label="${esc(t(lang, 'dj'))}">${svgLumaca()}</button>
        <span class="lab-radio__note" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i></span>
        <p class="lab-radio__fumetto" data-fumetto aria-live="polite"></p>
      </div>
      <div class="lab-radio__cassa">
        <div class="lab-radio__controlli">
          <span class="lab-radio__tasti" aria-hidden="true"><i data-k="rec" class="lab-radio__rec"><b></b></i><i data-k="rew">◀◀</i><i data-k="ff">▶▶</i><i data-k="eject" class="lab-radio__eject">⏏</i></span>
          <button type="button" class="lab-radio__play" data-play aria-pressed="false" ${supportato ? '' : 'disabled'}><span data-icona>▶</span> <span data-etichetta>${esc(t(lang, 'accendi'))}</span></button>
          <span class="lab-radio__premi" aria-hidden="true">${esc(t(lang, 'premi'))}</span>
          <label class="lab-radio__volume"><span class="lab-radio__serig">${esc(t(lang, 'volume'))}</span><input type="range" min="0" max="100" value="55" data-volume aria-label="${esc(t(lang, 'volume'))}"><span class="lab-radio__tacche" aria-hidden="true"><i>0</i><i>5</i><i>10</i></span></label>
        </div>
        <div class="lab-radio__fronte">
          <div class="lab-radio__marca" aria-hidden="true">
            <b class="lab-radio__logo">pzk</b>
            <span class="lab-radio__nome"><span>${esc(t(lang, 'marca'))}</span><small>${esc(t(lang, 'serigrafia'))}</small></span>
            <span class="lab-radio__motto">${esc(t(lang, 'motto'))}</span>
            <span class="lab-radio__power"><i class="lab-radio__led"></i>power</span>
          </div>
          <div class="lab-radio__vfd">
            ${svgCifre()}
            <canvas class="lab-radio__barre" aria-hidden="true"></canvas>
            <div class="lab-radio__riga"><div class="lab-radio__scorre"><span class="lab-radio__brano" data-brano>—</span><span class="lab-radio__eco" aria-hidden="true" data-eco></span></div></div>
          </div>
          <div class="lab-radio__sintonia" aria-hidden="true">
            <span class="lab-radio__banda">fm</span>
            <span class="lab-radio__scala">${[88, 92, 96, 100, 104, 108].map((f) => `<i style="left:${(posFM(f) * 100).toFixed(2)}%">${f}</i>`).join('')}
              <span class="lab-radio__qui" style="left:${(posFM(88.8) * 100).toFixed(2)}%">${esc(t(lang, 'qui'))}</span>
              <span class="lab-radio__ago"></span></span>
          </div>
          <div class="lab-radio__giu">
            ${svgCassa(u, 'sx')}
            <div class="lab-radio__centro">
              ${svgCassetta(u, lang)}
              <div class="lab-radio__pomelli" aria-hidden="true">
                <span class="lab-radio__pomello"><span class="lab-radio__manopola" data-manopola></span><small>vol</small></span>
                <span class="lab-radio__pomello"><span class="lab-radio__manopola lab-radio__manopola--bassi" data-k="tono"></span><small>${esc(t(lang, 'bassi'))}</small></span>
              </div>
            </div>
            ${svgCassa(u, 'dx')}
          </div>
        </div>
        <span class="lab-radio__timbro" aria-hidden="true">${esc(t(lang, 'timbro'))}</span>
      </div>
    </div><p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const radio = el.querySelector('.lab-radio')
    const canvas = el.querySelector('canvas')
    const bottone = el.querySelector('[data-play]')
    const icona = bottone.querySelector('[data-icona]')
    const scritta = bottone.querySelector('[data-etichetta]')
    const volume = el.querySelector('[data-volume]')
    const brano = el.querySelector('[data-brano]')
    const eco = el.querySelector('[data-eco]')
    const fumetto = el.querySelector('[data-fumetto]')
    const manopola = el.querySelector('[data-manopola]')
    const cifre = [...el.querySelectorAll('.lab-radio__cifre [data-c]')]
    const st = el.querySelector('[data-st]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let ac = null, master = null, analizzatore = null, timer = 0, raf = 0, playing = false, vivo = true, visibile = true
    let passo = 0, prossimo = 0, seed = semi('pzkko'), bpm = 88, radice = 220, scala = MODI[0], timbro = 'triangle'
    let corrente = api.adesso()
    let volumeV = 55
    let coda = 0, ultimoDisegno = 0, bassiPrima = -1, dati = null
    let tSintonia = 0, tFumetto = 0, tSospendi = 0, battuta = -1
    const picchi = new Float32Array(40)
    try { volumeV = Number(localStorage.getItem('pzkko-lab-radio') ?? 55) } catch {}
    if (!Number.isFinite(volumeV)) volumeV = 55
    volumeV = limita(volumeV, 0, 100)
    volume.value = volumeV
    radio.style.setProperty('--vol', String(volumeV / 100))
    api.stato(stato, supportato ? t(lang, 'pronta') : t(lang, 'no'), supportato ? 'ok' : 'no')

    // il display a sette segmenti: '88.8' acceso, tutto spento (ma i segmenti fantasma si vedono) quando è giù
    function scriviCifre(s) {
      const c = String(s).replace('.', '')
      const punto = String(s).includes('.')
      for (const r of cifre) {
        if (r.dataset.c === 'p') { r.classList.toggle('si', punto); continue }
        r.classList.toggle('si', (SEG[c[+r.dataset.c]] || '').includes(r.dataset.s))
      }
      st.classList.toggle('si', !!s)
    }
    function sintonizza() {
      clearTimeout(tSintonia)
      if (api.reduced()) { scriviCifre('88.8'); return }
      const giro = ['87.5', '87.9', '88.3', '88.6', '88.7', '88.9', '88.8']
      let i = 0
      const passa = () => { scriviCifre(giro[i]); if (++i < giro.length && playing) tSintonia = setTimeout(passa, 110) }
      passa()
    }

    function creaRumore() {
      const n = Math.floor(ac.sampleRate * 0.05)
      const b = ac.createBuffer(1, n, ac.sampleRate)
      const d = b.getChannelData(0)
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
      return b
    }
    let rumore = null

    function testoBrano(x) {
      if (x.track) return `♪ ${x.track.titolo}${x.track.artista ? ` · ${x.track.artista}` : ''}`
      const s = t(lang, 'stati')[x.status] || x.status || '—'
      return `${t(lang, 'nessuno')} «${s}»`
    }
    function imposta(x) {
      const chiave = x.track ? `${x.track.titolo}|${x.track.artista}` : `${x.status}|${x.luogo || ''}`
      const nuovo = semi(chiave)
      if (nuovo !== seed) {
        seed = nuovo
        bpm = 74 + (seed % 35)
        radice = 196 + (seed % 5) * 12
        scala = MODI[seed % MODI.length]
        timbro = TIPI[(seed >>> 3) % TIPI.length]
      }
      radio.style.setProperty('--battito', `${(60 / bpm).toFixed(3)}s`)
      // quanto nastro c'è sulle due bobine: cambia col seme, così ogni brano ha la sua cassetta
      const q = (seed % 1000) / 1000
      el.querySelector('[data-pacco="sx"]')?.setAttribute('r', (9 + q * 9).toFixed(1))
      el.querySelector('[data-pacco="dx"]')?.setAttribute('r', (18 - q * 9).toFixed(1))
      const testo = testoBrano(x)
      brano.textContent = testo
      eco.textContent = testo
      radio.style.setProperty('--scorri', `${Math.max(7, testo.length * 0.32).toFixed(1)}s`)
      impostaMedia(x)
    }

    function impostaMedia(x) {
      if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: x.track ? `${t(lang, 'titolo')} · ${x.track.titolo}` : t(lang, 'titolo'),
          artist: t(lang, 'artista'),
          album: t(lang, 'album'),
          artwork: [{ src: new URL('/apple-touch-icon.png', location.href).href, sizes: '180x180', type: 'image/png' }],
        })
      } catch {}
    }

    function nota(n, quando, durata, guadagno, tipo = timbro) {
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = tipo
      o.frequency.value = n
      g.gain.setValueAtTime(0.0001, quando)
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, guadagno), quando + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, quando + durata)
      o.connect(g).connect(master)
      o.start(quando)
      o.stop(quando + durata + 0.02)
    }
    function battito(quando, guadagno = 0.016) {
      if (!rumore) return
      const s = ac.createBufferSource(), g = ac.createGain(), hp = ac.createBiquadFilter()
      s.buffer = rumore; hp.type = 'highpass'; hp.frequency.value = 5000
      g.gain.setValueAtTime(guadagno, quando)
      g.gain.exponentialRampToValueAtTime(0.0001, quando + 0.035)
      s.connect(hp).connect(g).connect(master)
      s.start(quando); s.stop(quando + 0.05)
    }
    const hash = (n) => {
      let x = (seed ^ Math.imul(n + 1, 2654435761)) >>> 0
      x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15
      return (x >>> 0) / 4294967296
    }
    function programma(p, quando) {
      const h = hash(p)
      if (p % 8 === 0) nota(radice / 2, quando, 0.55, 0.055, 'sine')
      if (p % 2 === 0 && h > 0.22) {
        const giro = (p >> 3) % 2
        const idx = (p + Math.floor(h * scala.length)) % scala.length
        const n = radice * 2 ** ((scala[idx] + giro * 12) / 12)
        nota(n, quando, 0.16 + h * 0.12, 0.035, timbro)
      }
      if (p % 4 === 2) battito(quando)
      if (p % 16 === 15 && h > 0.6) nota(radice * 2, quando, 0.3, 0.025, 'sine')
    }
    function tick() {
      if (!playing || !ac) return
      if (prossimo < ac.currentTime) prossimo = ac.currentTime + 0.05
      // a scheda nascosta il browser rallenta i timer a 1 s: si programma più avanti, così la radio non singhiozza
      const avanti = document.hidden ? 1.6 : 0.16
      while (prossimo < ac.currentTime + avanti) {
        programma(passo, prossimo)
        passo++
        prossimo += 60 / bpm / 2
      }
    }

    // le barre del VFD: colonne di segmenti, quelli spenti si vedono appena (come sul vetro vero), picco che cade
    function disegna() {
      const w = canvas.clientWidth || 300, h = canvas.clientHeight || 70
      const c = telaPronta(canvas, w, h)
      c.clearRect(0, 0, w, h)
      const n = limita(Math.floor(w / 9), 12, 40)
      const pX = w / n, lx = Math.max(2, pX * 0.7)
      const righe = limita(Math.floor(h / 5), 8, 20)
      const pY = h / righe, ly = Math.max(1.5, pY * 0.62)
      const suona = !!(analizzatore && (playing || performance.now() < coda))
      if (suona) { if (!dati) dati = new Uint8Array(analizzatore.frequencyBinCount); analizzatore.getByteFrequencyData(dati) }
      let bassi = 0
      if (suona) bassi = ((dati[1] + dati[2] + dati[3] + dati[4]) / 4) / 255
      for (let i = 0; i < n; i++) {
        let v = 0
        if (suona) {
          // colonne in scala logaritmica: più spazio ai bassi e ai medi, dove sta la musica
          const a = 1 + Math.floor(95 * (i / n) ** 1.8), b = Math.max(a + 1, 1 + Math.floor(95 * ((i + 1) / n) ** 1.8))
          for (let k = a; k < b && k < dati.length; k++) v = Math.max(v, dati[k])
          v = Math.min(1, (v / 255) ** 1.3 * 1.18)
        }
        const livello = Math.round(v * righe)
        picchi[i] = suona ? Math.max(livello, picchi[i] - 0.22) : 0
        const x = i * pX + (pX - lx) / 2
        for (let r = 0; r < righe; r++) {
          const y = h - (r + 1) * pY + (pY - ly) / 2
          const acceso = r < livello
          c.fillStyle = acceso ? (r >= righe * 0.8 ? VFD.caldo : r >= righe * 0.58 ? VFD.medio : VFD.freddo) : VFD.spento
          c.fillRect(x, y, lx, ly)
        }
        const p = Math.floor(picchi[i])
        if (suona && p > livello && p < righe) { c.fillStyle = VFD.picco; c.fillRect(x, h - (p + 1) * pY + (pY - ly) / 2, lx, ly) }
      }
      // gli altoparlanti pompano coi bassi veri (non con un'animazione finta)
      const bq = api.reduced() ? 0 : Math.round(bassi * 40) / 40
      if (bq !== bassiPrima) { bassiPrima = bq; radio.style.setProperty('--bassi', String(bq)) }
    }
    function ciclo(ora) {
      raf = 0
      if (!vivo || !visibile) return
      const lento = api.reduced()
      if (!lento || ora - ultimoDisegno > 240) { ultimoDisegno = ora; disegna() }
      if (playing || performance.now() < coda) raf = requestAnimationFrame(ciclo)
      else disegna()
    }
    function avvia() { if (!raf && vivo && visibile) raf = requestAnimationFrame(ciclo) }
    function cancellaRaf() { cancelAnimationFrame(raf); raf = 0 }

    function accendi() {
      if (!supportato) return
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext
        ac = new C()
        master = ac.createGain()
        analizzatore = ac.createAnalyser()
        analizzatore.fftSize = 256
        analizzatore.smoothingTimeConstant = 0.72
        master.connect(analizzatore)
        analizzatore.connect(ac.destination)
        master.gain.value = (volumeV / 100) ** 2 * 0.55
        rumore = creaRumore()
      }
      clearTimeout(tSospendi)
      ac.resume?.()
      master.gain.cancelScheduledValues(ac.currentTime)
      master.gain.setTargetAtTime(Math.max(0.0001, (volumeV / 100) ** 2 * 0.55), ac.currentTime, 0.02)
      playing = true
      passo = 0
      prossimo = ac.currentTime + 0.08
      clearInterval(timer)
      timer = setInterval(tick, 25)
      radio.dataset.on = '1'
      icona.textContent = '■'
      scritta.textContent = t(lang, 'spegni')
      bottone.setAttribute('aria-pressed', 'true')
      api.stato(stato, t(lang, 'onda'), 'ok')
      impostaMedia(corrente)
      sintonizza()
      cancellaRaf(); avvia()
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'playing'
          navigator.mediaSession.setActionHandler('pause', spegni)
          navigator.mediaSession.setActionHandler('play', accendi)
        } catch {}
      }
    }
    function spegni() {
      playing = false
      clearInterval(timer)
      clearTimeout(tSintonia)
      if (ac) {
        master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03)
        // le barre cadono ancora un attimo, poi l'audio si sospende (il pc resta leggero)
        coda = performance.now() + 650
        clearTimeout(tSospendi)
        tSospendi = setTimeout(() => { if (!playing) { try { ac?.suspend?.() } catch {} } }, 900)
      }
      radio.dataset.on = '0'
      scriviCifre('')
      icona.textContent = '▶'
      scritta.textContent = t(lang, 'accendi')
      bottone.setAttribute('aria-pressed', 'false')
      api.stato(stato, t(lang, 'ferma'), '')
      if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused' } catch {} }
      avvia()
    }

    // le battute: la chiocciola DJ (bottone vero) e i tasti finti del boombox (solo decorazione, al clic)
    function dici(testo) {
      clearTimeout(tFumetto)
      fumetto.textContent = testo
      fumetto.dataset.vede = '1'
      tFumetto = setTimeout(() => { fumetto.dataset.vede = '0' }, 3800)
    }
    function premi(tasto) {
      tasto.classList.remove('giu'); void tasto.offsetWidth; tasto.classList.add('giu')
    }
    const suDj = () => {
      const lista = t(lang, playing ? 'acceso' : 'spento')
      battuta = (battuta + 1 + Math.floor(Math.random() * (lista.length - 1))) % lista.length
      dici(lista[battuta])
      premi(el.querySelector('[data-dj]'))
    }
    const suTasto = (e) => {
      const k = e.target.closest('[data-k]')
      if (!k || !radio.contains(k)) return
      premi(k)
      dici(t(lang, 'tasti')[k.dataset.k] || '')
    }
    const suPlay = () => { playing ? spegni() : accendi() }

    function impostaVolume(v) {
      volumeV = limita(Math.round(v), 0, 100)
      radio.style.setProperty('--vol', String(volumeV / 100))
      try { localStorage.setItem('pzkko-lab-radio', String(volumeV)) } catch {}
      if (ac && master) master.gain.setTargetAtTime(Math.max(0.0001, (volumeV / 100) ** 2 * 0.55), ac.currentTime, 0.02)
    }
    const suVolume = () => impostaVolume(Number(volume.value))
    // la manopola si gira trascinando (su/destra alza); la tastiera passa dal cursore, che è il controllo vero
    let presa = null
    const giu = (e) => { e.preventDefault(); try { manopola.setPointerCapture(e.pointerId) } catch {} presa = { x: e.clientX, y: e.clientY, v: volumeV } }
    const muovi = (e) => {
      if (!presa) return
      const v = limita(presa.v + ((presa.y - e.clientY) + (e.clientX - presa.x)) * 0.6, 0, 100)
      volume.value = String(Math.round(v))
      impostaVolume(v)
    }
    const su = () => { presa = null }

    bottone.addEventListener('click', suPlay)
    volume.addEventListener('input', suVolume)
    manopola.addEventListener('pointerdown', giu)
    manopola.addEventListener('pointermove', muovi)
    manopola.addEventListener('pointerup', su)
    manopola.addEventListener('pointercancel', su)
    el.querySelector('[data-dj]').addEventListener('click', suDj)
    radio.addEventListener('click', suTasto)

    const togli = api.onAdesso((x) => { corrente = x; imposta(x) })
    // fuori dallo schermo (o a scheda nascosta) si ferma tutto quello che si vede; l'audio, se acceso, continua
    const fineVis = api.quandoVisibile(radio, (v) => {
      visibile = v
      radio.dataset.vis = v ? '1' : '0'
      if (v) { if (!raf) { disegna(); if (playing) avvia() } } else cancellaRaf()
    })
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (!raf && visibile) disegna() }) : null
    ro?.observe(canvas)
    imposta(corrente)
    scriviCifre('')
    disegna()
    return () => {
      vivo = false
      togli(); clearInterval(timer); cancellaRaf(); fineVis?.(); ro?.disconnect()
      clearTimeout(tSintonia); clearTimeout(tFumetto); clearTimeout(tSospendi)
      bottone.removeEventListener('click', suPlay)
      volume.removeEventListener('input', suVolume)
      radio.removeEventListener('click', suTasto)
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.setActionHandler('play', null); navigator.mediaSession.setActionHandler('pause', null) } catch {}
      }
      try { ac?.close() } catch {}
      ac = null; master = null; analizzatore = null
    }
  },
}
