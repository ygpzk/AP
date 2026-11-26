// Diretta OS · «Azienda di Giugnoh»: il sito della cascina che si visita da solo.
// Tutto quello che si vede è una funzione del playhead x (0→1, il giro del visitatore), del puntatore e
// dell'orologio della scena: la stessa x e lo stesso t danno lo stesso fotogramma in regia, in onda e nella prova.
// L'autopilota muove x come una persona che scorre, si ferma, entra in una scheda ed esce; il mouse e la rotella
// prendono il comando e, dopo otto secondi di quiete, il giro riparte da dove si era rimasti (le altre pagine
// seguono con i messaggi di ctx.manda). Nessuna animazione CSS infinita, nessun requestAnimationFrame: solo giro().

const T = 86 // secondi di un giro intero

// ── piccoli attrezzi ──
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const caso = (n) => { const q = Math.sin(n * 127.1 + 311.7) * 43758.5453; return q - Math.floor(q) }
const mix = (a, b, k) => a + (b - a) * k

// ── il giro dell'autopilota: la x si muove a scatti morbidi, si ferma, riparte ──
const AUTO = [
  [0, 0], [3.4, 0.0007], [4.8, 0.13], [11.0, 0.25], [12.6, 0.29], [15.0, 0.315],
  [30.0, 0.44], [32.0, 0.48], [35.5, 0.498], [38.5, 0.512], [48.0, 0.588],
  [51.0, 0.615], [53.0, 0.645], [55.0, 0.675], [58.0, 0.70], [70.0, 0.80],
  [77.0, 0.85], [79.0, 0.885], [83.0, 0.965], [86.0, 1],
]
function xAuto(t) {
  t = ((t % T) + T) % T
  for (let i = 1; i < AUTO.length; i++) {
    const [t1, x1] = AUTO[i], [t0, x0] = AUTO[i - 1]
    if (t <= t1) return x0 + (x1 - x0) * ss(t0, t1, t)
  }
  return 1
}
function xFase(x) { // la x è sempre crescente: si può tornare indietro dal punto giusto del giro
  x = clamp(x)
  if (x <= 0) return 0
  if (x >= 1) return T
  let a = 0, b = T
  for (let i = 0; i < 42; i++) { const m = (a + b) / 2; if (xAuto(m) < x) a = m; else b = m }
  return (a + b) / 2
}

// ── le sei schermate del sito: quando una è ferma, l'altra entra ──
const TAPPE = [
  [0, 0], [0.10, 0], [0.13, 1], [0.25, 1], [0.29, 2], [0.44, 2],
  [0.48, 3], [0.645, 3], [0.675, 4], [0.85, 4], [0.885, 5], [1, 5],
]
function syDi(x) {
  for (let i = 1; i < TAPPE.length; i++) {
    const [x1, y1] = TAPPE[i], [x0, y0] = TAPPE[i - 1]
    if (x <= x1) return y0 + (y1 - y0) * ss(x0, x1, x)
  }
  return 5
}

// ── la scheda del raccolto che si apre e si chiude ──
const CARD = { x: 1110, y: 322, w: 700, h: 394 }
function detDi(x) {
  if (x <= 0.498) return 0
  if (x < 0.512) return ss(0.498, 0.512, x)
  if (x <= 0.588) return 1
  return 1 - ss(0.588, 0.615, x)
}
const dentroDi = (x) => clamp((x - 0.512) / (0.588 - 0.512))

// ── i prodotti (numeri e stagioni letti sul sito della cascina) ──
const MESI = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D']
const PRODOTTI = [
  { n: '01', nome: 'Latte', sotto: 'Filiera Grana Padano DOP', testo: 'Tutto l’anno, ogni giorno.', mesi: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], label: 'conferimento', foto: 'cascina', col: 'lime' },
  { n: '02', nome: 'Fieno', sotto: 'Erba medica', testo: 'Tre tagli, da maggio a settembre. In rotoballe.', mesi: [4, 5, 6, 7, 8], label: 'tagli', foto: 'fieno', col: 'viola' },
  { n: '03', nome: 'Mais', sotto: 'Pieno campo', testo: 'Semina in primavera, raccolta da settembre a novembre.', mesi: [8, 9, 10], label: 'raccolta', foto: 'mais', col: 'crema' },
  { n: '04', nome: 'Frumento', sotto: 'Pieno campo', testo: 'Semina in autunno, trebbiatura a giugno.', mesi: [5], label: 'trebbiatura', foto: 'frumento', col: 'scuro' },
  { n: '05', nome: 'Legna', sotto: 'Da ardere', testo: 'Pioppo, robinia, ciliegio. Da ottobre a marzo.', mesi: [9, 10, 11, 0, 1, 2], label: 'vendita', foto: 'legna', col: 'lime' },
  { n: '06', nome: 'Fiori', sotto: 'Dal giardino', testo: 'Da aprile a settembre. Quantità limitate.', mesi: [3, 4, 5, 6, 7, 8], label: 'fioritura', foto: 'fiori', col: 'viola' },
]

// ── i quattro capitoli dentro il raccolto (date, ore e fatti del sito) ──
const SLIDES = [
  { num: 'I', giorno: '24', mese: 'SET', ora: '16:00', tit: 'Lo sfalcio.', testo: 'Il trattore entra nel campo, l’erba resta a terra in strisce parallele.', foto: 'rac-1', didascalia: 'il campo, appena falciato' },
  { num: 'II', giorno: '25', mese: 'SET', ora: 'il sole', tit: 'Due giorni.', testo: 'L’erba asciuga in campo. Se piove, si ricomincia.', foto: 'rac-2', didascalia: 'le andane, la sera del 26' },
  { num: 'III', giorno: '26', mese: 'SET', ora: '18:56', tit: 'La rotoballa.', testo: 'Le andane diventano rotoballe, una dietro l’altra.', foto: 'rac-3', didascalia: 'l’ultimo giro lungo i platani' },
  { num: 'IV', giorno: '26', mese: 'SET', ora: '19:01', tit: 'Il tramonto.', testo: 'Il sole va giù dietro i campi. La fontana tiene ancora l’azzurro.', foto: 'rac-4', didascalia: 'la fontana, gli aironi' },
]

// ── le scritte grosse: poche parole, si leggono con gli occhi ──
const FRASI = [
  [0.000, 'questo è il sito'],
  [0.130, 'sessantatré biolche'],
  [0.170, 'tre colture'],
  [0.210, 'due persone, tanti campi'],
  [0.245, 'si passa ai prodotti'],
  [0.290, 'latte ogni giorno'],
  [0.320, 'fieno, tre tagli'],
  [0.350, 'mais, frumento'],
  [0.380, 'legna, fiori'],
  [0.410, 'tutto in cascina'],
  [0.440, 'dentro il raccolto'],
  [0.480, 'la falciatrice entra'],
  [0.510, 'l’erba asciuga'],
  [0.540, 'il fieno gira'],
  [0.570, 'il sole va giù'],
  [0.600, 'si esce dal campo'],
  [0.630, 'si torna a casa'],
  [0.665, 'l’airone di guardia'],
  [0.690, 'il tetto lavora'],
  [0.735, 'i platani in fila'],
  [0.780, 'ombre lunghe'],
  [0.805, 'casa nostra'],
  [0.850, 'stagione chiusa'],
  [0.920, 'domani si riparte'],
]

// ── il puntatore dell'autopilota: dove va, cosa guarda (x, nx, ny) ──
const PUNTI = [
  [0.000, 0.62, 0.55], [0.030, 0.73, 0.58], [0.068, 0.79, 0.52], [0.100, 0.80, 0.48],
  [0.128, 0.65, 0.05], [0.160, 0.70, 0.46], [0.200, 0.55, 0.42], [0.245, 0.62, 0.42],
  [0.292, 0.74, 0.05], [0.320, 0.50, 0.55], [0.365, 0.66, 0.57], [0.405, 0.40, 0.55],
  [0.440, 0.48, 0.54], [0.490, 0.76, 0.48], [0.520, 0.66, 0.45], [0.560, 0.32, 0.42],
  [0.600, 0.68, 0.44], [0.645, 0.70, 0.42], [0.678, 0.94, 0.05], [0.705, 0.62, 0.40],
  [0.745, 0.39, 0.38], [0.785, 0.70, 0.45], [0.825, 0.28, 0.42], [0.860, 0.56, 0.45],
  [0.900, 0.50, 0.50], [0.966, 0.035, 0.05], [1.000, 0.50, 0.55],
]
function puntoAuto(x, t) {
  let i = 1
  while (i < PUNTI.length - 1 && x > PUNTI[i][0]) i++
  const [x1, a1, b1] = PUNTI[i], [x0, a0, b0] = PUNTI[i - 1]
  const k = ss(x0, x1, x)
  return [mix(a0, a1, k) + Math.sin(t * 0.47 + 1.3) * 0.005, mix(b0, b1, k) + Math.sin(t * 0.39 + 2.1) * 0.006]
}

// ── i clic dell'autopilota: quando la x passa di lì il dito preme ──
const CLIC = [0.128, 0.292, 0.490, 0.678, 0.966]

function htmlProdotti() {
  return PRODOTTI.map((p, i) => `<article class="st-card st-c-${p.col}" data-card="${i}">
      <span class="st-card-n">${p.n} / 06</span>
      <h3>${p.nome}</h3>
      <div class="st-card-sotto">${p.sotto}</div>
      <p>${p.testo}</p>
      <div class="st-card-foto"><img data-foto="${p.foto}" data-sez="2" alt=""></div>
      <div class="st-mesi">${MESI.map((m, j) => `<b class="${p.mesi.includes(j) ? 'st-on' : ''}">${m}</b>`).join('')}</div>
      <div class="st-mesi-label"><span>${p.label}</span><span>stagione</span></div>
    </article>`).join('')
}

function htmlSlides() {
  return SLIDES.map((s, i) => `<article class="st-slide">
      <div class="st-slide-n">${s.num}</div>
      <div class="st-slide-testo" data-sl-testo>
        <div class="st-slide-data">${s.giorno}<small>${s.mese}</small></div>
        <span class="st-slide-ora">${s.ora}</span>
        <h3>${s.tit}</h3>
        <p>${s.testo}</p>
      </div>
      <figure class="st-slide-foto" data-sl-foto>
        <img data-foto="${s.foto}" data-solo="dentro" data-i="${i}" alt="">
        <figcaption>${s.didascalia}</figcaption>
      </figure>
    </article>`).join('')
}

export function crea(ctx) {
  // il foglio di stile della scena, una volta sola
  if (!document.querySelector('link[href="/scene/sito/sito.css"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/scene/sito/sito.css'
    document.head.append(link)
  }

  const el = document.createElement('div')
  el.className = 'st'
  el.dataset.sez = '0'
  el.dataset.chiaro = '0'
  el.dataset.carta = '0'
  el.innerHTML = `
    <div class="st-mondo">
      <section class="st-sez st-hero" data-i="0">
        <div class="st-hero-foto"><img data-foto="eroe" data-sez="0" alt=""></div>
        <div class="st-hero-velo"></div>
        <div class="st-hero-testo">
          <p class="st-riga"><i></i> azienda agricola · dal 2007</p>
          <h1 class="st-hero-titolo">
            <span class="st-parola" data-par="0">Azienda</span>
            <span class="st-parola st-dinome" data-par="1"><i>di</i><b>Giugnoh</b></span>
          </h1>
          <p class="st-hero-sotto">Una famiglia. Una terra.<br><b>Sessantatré biolche</b> di pianura.</p>
          <button class="st-cta" data-vai="0.512" data-mag>guarda il raccolto <b>→</b></button>
        </div>
        <figure class="st-polaroid" data-mag>
          <span class="st-nastro"></span>
          <img data-foto="cascina" data-sez="0" alt="">
          <figcaption>la cascina, dai campi</figcaption>
        </figure>
        <img class="st-sticker st-sticker-trattore" src="/scene/sito/foto/trattore.webp" alt="">
        <div class="st-scorri"><i>↓</i><span>sotto</span></div>
      </section>

      <section class="st-sez st-storia" data-i="1">
        <div class="st-anno" data-anno>2007</div>
        <div class="st-storia-testo">
          <p class="st-occhiello">01 — la storia</p>
          <h2 class="st-titolo" data-par>Una famiglia,<br>una terra.<br><em>Dal 2007.</em></h2>
          <p class="st-paragrafo">Sessantatré biolche <b>tra l’acqua e i campi</b>, in pianura. Mais, frumento ed erba medica; e il latte che ogni giorno va al caseificio della filiera del <b>Grana&nbsp;Padano&nbsp;DOP</b>.</p>
          <div class="st-numeri">
            <div><b data-conta="63">63</b><span>biolche</span></div>
            <div><b data-conta="16">16</b><span>ettari circa</span></div>
            <div><b data-conta="2">2</b><span>operatori</span></div>
          </div>
        </div>
        <figure class="st-quadro st-quadro-storia" data-mag>
          <div class="st-maschera">
            <img data-foto="cascina" data-sez="1" alt="">
            <i class="st-pannello st-p1"></i><i class="st-pannello st-p2"></i>
          </div>
          <span class="st-targhetta">dal 2007</span>
          <figcaption>la cascina e il capannone, dai campi</figcaption>
        </figure>
      </section>

      <section class="st-sez st-prodotti" data-i="2">
        <div class="st-prod-testo">
          <p class="st-occhiello">02 — i prodotti</p>
          <h2 class="st-titolo" data-par>Sei produzioni<em>.</em></h2>
          <p class="st-sottotitolo">Un anno intero di lavoro, in cascina.</p>
        </div>
        <p class="st-prod-nota">Fieno, legna e fiori si ritirano in cascina, su appuntamento.</p>
        <div class="st-prod-vista"><div class="st-prod-filo" data-filo>${htmlProdotti()}</div></div>
      </section>

      <section class="st-sez st-raccolto" data-i="3">
        <div class="st-rac-foto"><img data-foto="rac-2" data-sez="3" alt=""></div>
        <div class="st-rac-velo"></div>
        <div class="st-rac-testo">
          <p class="st-occhiello">03 — il raccolto</p>
          <h2 class="st-titolo" data-par>Tre giorni<br>di settembre.</h2>
          <p class="st-paragrafo">L’ultimo taglio dell’erba medica: lo sfalcio, due giorni di sole, la rotopressa lungo il filare dei platani.</p>
          <p class="st-rac-data"><b>24—27</b> settembre · quattro momenti</p>
        </div>
        <p class="st-rac-etichetta">il raccolto, dall’inizio alla fine</p>
        <div class="st-rac-card" data-vai="0.512">
          <img data-foto="rac-1" data-sez="3" alt="">
          <span class="st-play"><i></i></span>
          <div class="st-rac-card-piede"><b>apri il raccolto</b><span>24—27 set</span></div>
        </div>
        <div class="st-rac-num">26<span>09</span></div>
      </section>

      <section class="st-sez st-cascina" data-i="4">
        <div class="st-casc-testo">
          <p class="st-occhiello">04 — la cascina</p>
          <h2 class="st-titolo" data-par>La casa,<br>il giardino,<br>l’acqua.</h2>
        </div>
        <figure class="st-quadro st-casc-a" data-mag>
          <img data-foto="casc-fontana" data-sez="4" alt="">
          <figcaption>la fontana, gli aironi</figcaption>
        </figure>
        <figure class="st-quadro st-casc-b">
          <img data-foto="casc-viale" data-sez="4" alt="">
          <figcaption>il viale dei platani</figcaption>
        </figure>
        <figure class="st-quadro st-casc-c">
          <img data-foto="casc-gelsi" data-sez="4" alt="">
          <figcaption>i gelsi</figcaption>
        </figure>
        <figure class="st-quadro st-casc-d">
          <img data-foto="casc-solare" data-sez="4" alt="">
          <figcaption>trenta pannelli sul tetto</figcaption>
        </figure>
        <p class="st-casc-nota">I platani lungo il viale, i gelsi del giardino, <b>la fontana con gli aironi</b>. E sul capannone trenta pannelli: circa il <b>60% dell’energia</b>.</p>
        <span class="st-bollo">30 pannelli · ~60%</span>
        <img class="st-sticker st-sticker-chiocciola" src="/scene/sito/foto/chiocciola.webp" alt="">
      </section>

      <section class="st-sez st-finale" data-i="5">
        <div class="st-finale-foto"><img data-foto="eroe" data-sez="5" alt=""></div>
        <div class="st-finale-velo"></div>
        <div class="st-finale-testo">
          <p class="st-occhiello">05 — fine del giro</p>
          <h2 class="st-finale-titolo" data-par>Il fieno<br>è a posto.</h2>
          <p class="st-finale-sotto">E si ricomincia.</p>
          <div class="st-finale-marchio"><span>azienda</span><b>di Giugnoh</b></div>
          <p class="st-finale-nota">fieno · legna · fiori — in cascina, su appuntamento</p>
        </div>
        <img class="st-sticker st-sticker-finale" src="/scene/sito/foto/chiocciola.webp" alt="">
        <p class="st-firma">a domani</p>
      </section>
    </div>

    <header class="st-testata">
      <button class="st-marchio" data-vai="0" data-mag>
        <img src="/scene/sito/foto/chiocciola.webp" alt="">
        <b>Azienda di Giugnoh</b>
      </button>
      <div class="st-vivo"><span class="st-ora" data-ora>--:--</span><span class="st-meteo" data-meteo></span></div>
      <nav class="st-nav">
        <button data-vai="0.13" data-nav="1">storia</button>
        <button data-vai="0.29" data-nav="2">prodotti</button>
        <button data-vai="0.48" data-nav="3">raccolto</button>
        <button data-vai="0.675" data-nav="4">cascina</button>
      </nav>
    </header>
    <div class="st-filo"><i data-filo-x></i></div>

    <div class="st-velo-dentro" data-velo></div>

    <div class="st-dentro" data-dentro>
      <div class="st-dentro-fondo"></div>
      <div class="st-dentro-testa"><span>il raccolto</span><b>24 — 27 settembre</b><i>quattro momenti</i></div>
      <button class="st-chiudi" data-vai="0.63">chiudi ×</button>
      <div class="st-dentro-filo"><div class="st-dentro-nastro" data-nastro>${htmlSlides()}</div></div>
      <div class="st-dentro-piede"><span class="st-dentro-barra"><i data-barra-dentro></i></span><span class="st-dentro-conta" data-conta-dentro>01 / 04</span></div>
    </div>

    <div class="st-scritte" data-scritte></div>

    <div class="st-puntatore" data-puntatore>
      <span class="st-anello"></span>
      <svg class="st-freccia" viewBox="0 0 30 38" aria-hidden="true">
        <path class="st-punta" d="M4 3 L27 22 L16 23 L21 35 L14 37 L9 25 L4 31 Z" stroke="#0b090e" stroke-width="3" stroke-linejoin="round"/>
        <path d="M7 6 L23 20 L14 21" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
      </svg>
    </div>
    <div class="st-onde" data-onde><i class="st-onda"></i><i class="st-onda"></i><i class="st-onda"></i><i class="st-onda"></i></div>
    <div class="st-sipario" data-sipario></div>
  `

  // ── i riferimenti ──
  const $ = (s) => el.querySelector(s)
  const $$ = (s) => [...el.querySelectorAll(s)]
  const mondo = $('.st-mondo')
  const testata = $('.st-testata')
  const filoX = $('[data-filo-x]')
  const velo = $('[data-velo]')
  const dentro = $('[data-dentro]')
  const nastro = $('[data-nastro]')
  const barraDentro = $('[data-barra-dentro]')
  const contaDentro = $('[data-conta-dentro]')
  const scritte = $('[data-scritte]')
  const puntatore = $('[data-puntatore]')
  const onde = $$('.st-onda')
  const sipario = $('[data-sipario]')
  const filoProd = $('[data-filo]')
  const oraEl = $('[data-ora]')
  const meteoEl = $('[data-meteo]')
  const nav = $$('[data-nav]')
  const carte = $$('[data-card]')
  const slideTesti = $$('[data-sl-testo]')
  const slideFoto = $$('[data-sl-foto]')
  const numeri = $$('[data-conta]')
  const pannelli = $$('.st-pannello')
  const parStoria = $('.st-storia .st-titolo')
  const parProd = $('.st-prodotti .st-titolo')
  const parRac = $('.st-rac-testo .st-titolo')
  const testoStoria = $('.st-storia-testo')
  const testoProd = $('.st-prod-testo')
  const notaProd = $('.st-prod-nota')
  const testoFin = $('.st-finale-testo')
  const anno = $('[data-anno]')
  const heroFoto = $('.st-hero-foto img')
  const heroPar = $$('.st-hero-titolo [data-par]')
  const polaroid = $('.st-polaroid')
  const cta = $('.st-cta')
  const quadroStoria = $('.st-quadro-storia')
  const chiudiBtn = $('.st-chiudi')
  const stickerT = $('.st-sticker-trattore')
  const stickerC = $('.st-sticker-chiocciola')
  const stickerF = $('.st-sticker-finale')
  const racFoto = $('.st-rac-foto img')
  const racTesto = $('.st-rac-testo')
  const racEtichetta = $('.st-rac-etichetta')
  const racCard = $('.st-rac-card')
  const racNum = $('.st-rac-num')
  const cascTesto = $('.st-casc-testo')
  const cascNote = $('.st-casc-nota')
  const cascA = $('.st-casc-a')
  const cascB = $('.st-casc-b')
  const cascC = $('.st-casc-c')
  const cascD = $('.st-casc-d')
  const bollo = $('.st-bollo')
  const finaleFoto = $('.st-finale-foto img')
  const finaleTitolo = $('.st-finale-titolo')
  const firma = $('.st-firma')
  const filo = $('.st-filo')

  // (scritture di stile solo quando cambiano: ogni scrittura costa)
  const cache = new WeakMap()
  function metti(e, k, v) {
    let c = cache.get(e)
    if (!c) cache.set(e, c = {})
    if (c[k] === v) return
    c[k] = v
    e.style[k] = v
  }
  const tr = (e, v) => metti(e, 'transform', v)
  const op = (e, v) => metti(e, 'opacity', v)

  // ── le foto: si caricano solo quelle della schermata che si vede ──
  const IMG = $$('img[data-foto]')
  const FILE = (n) => `/scene/sito/foto/${n}.webp`
  let sezFoto = -1
  function carica(im) {
    if (im.dataset.caricata) return
    im.dataset.caricata = '1'
    im.src = FILE(im.dataset.foto)
    const pronta = () => im.classList.add('st-pronta')
    im.decode?.().then(pronta).catch(pronta) ?? (im.onload = pronta)
  }
  function scarica(im) {
    if (!im.dataset.caricata) return
    delete im.dataset.caricata
    im.classList.remove('st-pronta')
    im.removeAttribute('src')
  }
  function curaFoto(sy) {
    const s = Math.round(sy)
    if (s === sezFoto) return
    sezFoto = s
    const vicine = new Set([s, Math.floor(sy), Math.ceil(sy)])
    if (sy > 4.4) vicine.add(0) // (la copertina si riaccende mentre si chiude il giro)
    for (const im of IMG) {
      if (im.dataset.solo) continue
      const sez = +im.dataset.sez
      if (vicine.has(sez)) carica(im)
      else scarica(im)
    }
  }
  const IMMAGINI_DENTRO = $$('img[data-solo="dentro"]')
  let centroDentro = -1
  function curaDentro(attivo, centro) {
    if (!attivo) {
      if (centroDentro >= 0) { for (const im of IMMAGINI_DENTRO) scarica(im); centroDentro = -1 }
      return
    }
    if (centro === centroDentro) return
    centroDentro = centro
    for (const im of IMMAGINI_DENTRO) {
      const i = +im.dataset.i
      if (Math.abs(i - centro) <= 1) carica(im)
      else scarica(im)
    }
  }

  // ── lo stato: playhead, puntatore, autopilota / manuale ──
  let acceso = false
  let tOra = 0
  let x = 0 // il playhead disegnato
  let xv = 0 // dove deve arrivare (input e comandi)
  let manuale = false
  let manualeFino = 0
  let autoDa = 0
  let autoFase = 0
  let faseTour = 0
  let ultimoInvio = -99
  let timerInvio = 0
  let primaVolta = true
  let meteo = null
  let ultimaOra = ''
  let fraseI = -1
  let fraseT = -99
  let primaFrase = true
  let parole = []
  let ultimaDentro = -1
  let ultimaSez = -1
  let cartaPrima = null
  let ultimoComando = null
  const fatto = CLIC.map(() => false)
  const pnt = { x: 0.62, y: 0.55, tx: 0.62, ty: 0.55 }
  const ondeStato = onde.map(() => -99)
  const ondeDove = onde.map(() => ({ x: 0, y: 0 }))
  let indiceOnda = 0

  // (le posizioni fisse dei magneti e dei bottoni: si misurano una volta)
  const centri = new Map()
  function pos(e) {
    let px = 0, py = 0, n = e
    while (n && n !== el) { px += n.offsetLeft; py += n.offsetTop; n = n.offsetParent }
    return { x: px, y: py }
  }
  function misura() {
    centri.clear()
    for (const e of $$('[data-mag], [data-vai]')) {
      const p = pos(e)
      const sez = e.closest('.st-sez')?.dataset.i
      centri.set(e, { x: p.x, y: p.y, sez: sez == null ? -1 : +sez })
    }
  }

  // ── il tempo e il meteo nella testata ──
  function aggiornaMeteo() {
    const m = meteo
    if (m && m.gradi != null) {
      meteoEl.textContent = `· ${Math.round(m.gradi)}° ${m.testo ?? ''}`.trim()
      meteoEl.style.display = ''
    } else meteoEl.style.display = 'none'
  }
  function aggiornaOra() {
    let d
    try { d = ctx.ora() } catch { d = new Date() }
    if (!(d instanceof Date) || isNaN(d)) d = new Date()
    const s = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    if (s !== ultimaOra) { ultimaOra = s; oraEl.textContent = s }
  }

  // ── l'invio alle altre pagine: { x, px, py, t, f? } — x è il playhead 0..1, px/py il dito 0..1,
  //    t i secondi della scena, f l'ultimo messaggio. Al massimo ~12 al secondo, più l'ultimo. ──
  function pubblica(finale = false) {
    if (typeof ctx.manda !== 'function') return
    const t = tOra
    if (!finale && t - ultimoInvio < 0.085) return
    ultimoInvio = t
    manualeFino = t + 8
    try { ctx.manda({ x: +xv.toFixed(5), px: +pnt.tx.toFixed(3), py: +pnt.ty.toFixed(3), t: +t.toFixed(2), ...(finale ? { f: 1 } : {}) }) } catch {}
  }
  function inviaDopo() {
    clearTimeout(timerInvio)
    timerInvio = setTimeout(() => pubblica(true), 240)
  }
  function tocca(t) {
    manuale = true
    tOra = t
    manualeFino = t + 8
    if (!el.classList.contains('st-manuale')) el.classList.add('st-manuale')
    pubblica(false)
    inviaDopo()
  }
  function vai(a, t) {
    xv = clamp(a)
    tocca(t)
  }
  function riparti(t) {
    manuale = false
    el.classList.remove('st-manuale')
    x = xv
    autoDa = manualeFino || t
    autoFase = xFase(x)
    tOra = t
  }

  // ── il puntatore: un dito disegnato da noi, uguale in ogni pagina ──
  function disegnaPuntatore(dt, t) {
    let tx, ty
    if (manuale) { tx = pnt.tx; ty = pnt.ty }
    else { [tx, ty] = puntoAuto(x, t) }
    const k = 1 - Math.exp(-dt / (manuale ? 0.08 : 0.13))
    pnt.x += (tx - pnt.x) * k
    pnt.y += (ty - pnt.y) * k
    tr(puntatore, `translate3d(${(pnt.x * 1920).toFixed(1)}px, ${(pnt.y * 1080).toFixed(1)}px, 0)`)
    op(puntatore, acceso ? '1' : '0')
  }

  function onda(t, px, py) {
    const i = indiceOnda++ % onde.length
    ondeStato[i] = t
    ondeDove[i] = { x: px, y: py }
    tr(onde[i], `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(.4)`)
    op(onde[i], '.85')
  }
  function disegnaOnde(t) {
    for (let i = 0; i < onde.length; i++) {
      const k = (t - ondeStato[i]) / 0.62
      if (k < 0 || k > 1) { op(onde[i], '0'); continue }
      tr(onde[i], `translate3d(${ondeDove[i].x.toFixed(1)}px, ${ondeDove[i].y.toFixed(1)}px, 0) scale(${(0.4 + k * 2.2).toFixed(3)})`)
      op(onde[i], (0.85 * (1 - k)).toFixed(3))
    }
  }

  // ── le scritte ──
  function costruisciFrase(i, t) {
    const testo = FRASI[i][1]
    scritte.innerHTML = `<div class="st-frase">${testo.split(' ').map((w, j) => `<span class="st-w${j === 0 ? ' st-attivo' : ''}" data-w="${j}" data-on="${j === 0 ? '1' : '0'}">${w}</span>`).join('')}</div>`
    parole = [...scritte.querySelectorAll('.st-w')]
    fraseT = (primaFrase || manuale) ? t - 1 : t
    primaFrase = false
    fraseI = i
  }
  function disegnaScritte(x, t) {
    let i = 0
    while (i < FRASI.length - 1 && x >= FRASI[i + 1][0]) i++
    if (i !== fraseI) costruisciFrase(i, t)
    const a = FRASI[i][0]
    const b = FRASI[i + 1]?.[0] ?? 1
    const p = clamp((x - a) / (b - a))
    const n = parole.length
    const attivo = Math.min(n - 1, Math.floor(p * n))
    const ent = ss(0, 0.18, t - fraseT)
    for (let j = 0; j < n; j++) {
      const w = parole[j]
      const loc = p * n - j
      const pop = j === attivo ? 1 + 0.08 * Math.exp(-Math.max(0, loc) * 6) : 1
      const ty = (1 - ent) * 30 - (j === attivo ? 4 : 0)
      tr(w, `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${pop.toFixed(3)})`)
      op(w, ent.toFixed(2))
      const era = w.dataset.on === '1'
      if ((j === attivo) !== era) { w.dataset.on = j === attivo ? '1' : '0'; w.classList.toggle('st-attivo', j === attivo) }
    }
  }

  // ── i magneti: le cose si spostano verso il dito ──
  function magnete(e, base = '') {
    const c = centri.get(e)
    if (!c) return base
    const dx = pnt.x * 1920 - c.x
    const dy = pnt.y * 1080 - (c.sez >= 0 ? c.y - syDi(x) * 1080 : c.y)
    const d = Math.hypot(dx, dy)
    if (d > 260) return base
    const k = 1 - d / 260
    return `${base} translate3d(${(dx * 0.07 * k).toFixed(1)}px, ${(dy * 0.07 * k).toFixed(1)}px, 0) scale(${(1 + 0.05 * k).toFixed(3)})`
  }

  // ── il disegno di un fotogramma ──
  function disegna(dt, t) {
    // prima l'autopilota o il comando manuale
    if (!manuale) {
      faseTour = autoFase + (t - autoDa)
      faseTour = ((faseTour % T) + T) % T
      x = xAuto(faseTour)
    } else {
      x += (xv - x) * (1 - Math.exp(-dt / 0.09))
      if (Math.abs(xv - x) < 0.00002) x = xv
      if (t >= manualeFino) riparti(t)
      faseTour = null
    }
    tOra = t
    const sy = syDi(x)
    const det = detDi(x)
    const di = dentroDi(x)
    // (il testo di una schermata si accende quando è salita sopra le scritte, non mentre ci passa sotto)
    const entra = (i) => ss(i - 0.36, i - 0.08, sy)

    // il mondo che scorre
    tr(mondo, `translate3d(0, ${(-sy * 1080).toFixed(2)}px, 0)`)
    const sez = Math.round(sy)
    if (sez !== ultimaSez) {
      ultimaSez = sez
      el.dataset.sez = String(sez)
      el.dataset.chiaro = sez === 2 ? '1' : '0'
      for (const b of nav) b.dataset.attivo = (+b.dataset.nav === sez) ? '1' : '0'
    }
    // le scritte sono scure quando sotto c'è il foglio di carta (la testata si spegne da sola mentre si scorre)
    const carta = sy > 1.26 && sy < 2.17
    if (carta !== cartaPrima) { cartaPrima = carta; el.dataset.carta = carta ? '1' : '0' }
    curaFoto(sy)

    // la barra del giro
    tr(filoX, `scaleX(${x.toFixed(4)})`)

    // ── copertina ──
    const ph = clamp(x / 0.10)
    tr(heroFoto, `translate3d(${((pnt.x - 0.5) * -18).toFixed(1)}px, ${(-8 * ph + (pnt.y - 0.5) * -10).toFixed(1)}px, 0) scale(${(1.03 + ph * 0.045 + Math.sin(t * 0.11) * 0.004).toFixed(4)})`)
    tr(heroPar[0], `translate3d(${((pnt.x - 0.5) * -8).toFixed(1)}px, ${(Math.sin(t * 0.7) * 3).toFixed(1)}px, 0)`)
    tr(heroPar[1], `translate3d(${((pnt.x - 0.5) * 14).toFixed(1)}px, ${(Math.sin(t * 0.62 + 1) * 3).toFixed(1)}px, 0)`)
    tr(polaroid, magnete(polaroid, `translate3d(0, ${(Math.sin(t * 0.6 + 1.4) * 4).toFixed(1)}px, 0) rotate(3.4deg)`))
    tr(cta, magnete(cta))
    tr(stickerT, `translate3d(0, ${(Math.sin(t * 0.9) * 7).toFixed(1)}px, 0) rotate(-7deg)`)

    // ── storia ──
    const ps = clamp((x - 0.13) / 0.12)
    op(testoStoria, entra(1).toFixed(3))
    tr(anno, `translate3d(${(ps * -42 + (pnt.x - 0.5) * -8).toFixed(1)}px, ${((pnt.y - 0.5) * -6).toFixed(1)}px, 0)`)
    tr(parStoria, `translate3d(${((pnt.x - 0.5) * -7).toFixed(1)}px, ${(Math.sin(t * 0.58) * 2).toFixed(1)}px, 0)`)
    tr(pannelli[0], `translate3d(${(-100 * ss(0.01, 0.10, ps)).toFixed(2)}%, 0, 0)`)
    tr(pannelli[1], `translate3d(${(100 * ss(0.04, 0.16, ps)).toFixed(2)}%, 0, 0)`)
    for (let i = 0; i < numeri.length; i++) {
      const k = ss(0.0 + i * 0.02, 0.10 + i * 0.02, ps)
      const blocco = numeri[i].parentElement
      tr(blocco, `translate3d(0, ${((1 - k) * 34).toFixed(1)}px, 0) scale(${(0.82 + 0.18 * k).toFixed(3)})`)
      op(blocco, k.toFixed(2))
    }
    tr(quadroStoria, magnete(quadroStoria, `translate3d(0, ${(-14 * ps + (pnt.y - 0.5) * -9).toFixed(1)}px, 0) rotate(-2.2deg)`))

    // ── prodotti ──
    const pp = clamp((x - 0.29) / 0.15)
    op(testoProd, entra(2).toFixed(3))
    op(notaProd, entra(2).toFixed(3))
    const corsa = pp * 2052
    tr(filoProd, `translate3d(${(-corsa + (pnt.x - 0.5) * -10).toFixed(1)}px, 0, 0)`)
    for (let i = 0; i < carte.length; i++) {
      const cx = 96 + i * 636 - corsa + 300
      const d = Math.abs(cx - 960)
      const vicino = Math.max(0, 1 - d / 900)
      const dip = Math.pow((cx - 960) / 960, 2) * 10
      const lift = vicino * 12
      const sc = 1 + vicino * 0.014
      tr(carte[i], `translate3d(0, ${(dip + lift + Math.sin(t * 0.8 + i * 1.7) * 2).toFixed(1)}px, 0) scale(${sc.toFixed(3)})`)
    }
    tr(parProd, `translate3d(${((pnt.x - 0.5) * -7).toFixed(1)}px, ${(Math.sin(t * 0.5 + 2) * 2).toFixed(1)}px, 0)`)

    // ── raccolto ──
    const pr = clamp((x - 0.48) / 0.165)
    tr(racFoto, `translate3d(${((pnt.x - 0.5) * -22).toFixed(1)}px, ${(-pr * 24 + (pnt.y - 0.5) * -8).toFixed(1)}px, 0) scale(${(1.1 - pr * 0.04).toFixed(4)})`)
    tr(parRac, `translate3d(${((pnt.x - 0.5) * -8).toFixed(1)}px, ${(Math.sin(t * 0.6) * 3).toFixed(1)}px, 0)`)
    const fluttua = Math.sin(t * 0.65) * 4
    tr(racCard, `translate3d(0, ${fluttua.toFixed(1)}px, 0)`)
    tr(racNum, `translate3d(${((pnt.x - 0.5) * -10).toFixed(1)}px, 0, 0)`)
    const sparisce = ss(0.02, 0.5, det)
    op(racTesto, ((1 - sparisce) * entra(3)).toFixed(3))
    op(racEtichetta, ((1 - sparisce) * entra(3)).toFixed(3))

    // ── cascina ──
    const pc = clamp((x - 0.675) / 0.175)
    op(cascTesto, entra(4).toFixed(3))
    op(cascNote, entra(4).toFixed(3))
    tr(cascTesto, `translate3d(${((pnt.x - 0.5) * -10).toFixed(1)}px, ${(Math.sin(t * 0.55) * 3).toFixed(1)}px, 0)`)
    tr(cascNote, `translate3d(${((pnt.x - 0.5) * -6).toFixed(1)}px, 0, 0)`)
    tr(cascA, magnete(cascA, `translate3d(${(-pc * 30 + (pnt.x - 0.5) * -18).toFixed(1)}px, ${(-pc * 20 + (pnt.y - 0.5) * -14 + Math.sin(t * 0.6) * 3).toFixed(1)}px, 0) rotate(-1.4deg)`))
    tr(cascB, `translate3d(${(pc * 18 + (pnt.x - 0.5) * -11).toFixed(1)}px, ${(-pc * 42 + (pnt.y - 0.5) * -9).toFixed(1)}px, 0) rotate(2.4deg)`)
    tr(cascC, `translate3d(${(pc * 10 + (pnt.x - 0.5) * -13).toFixed(1)}px, ${(-pc * 18 + (pnt.y - 0.5) * -9).toFixed(1)}px, 0) rotate(-2.6deg)`)
    tr(cascD, `translate3d(${(pc * 24 + (pnt.x - 0.5) * -9).toFixed(1)}px, ${(pc * 10 + (pnt.y - 0.5) * -7).toFixed(1)}px, 0) rotate(1deg)`)
    tr(bollo, `translate3d(0, ${(Math.sin(t * 0.8 + 2) * 3).toFixed(1)}px, 0) rotate(-3deg)`)
    tr(stickerC, `translate3d(0, ${(Math.sin(t * 0.85 + 1) * 6).toFixed(1)}px, 0) rotate(6deg)`)

    // ── finale ──
    const pf = clamp((x - 0.885) / 0.115)
    op(testoFin, entra(5).toFixed(3))
    tr(finaleFoto, `translate3d(0, ${(-pf * 18).toFixed(1)}px, 0) scale(${(1.02 + pf * 0.05).toFixed(4)})`)
    tr(finaleTitolo, `translate3d(0, ${((1 - pf) * 26).toFixed(1)}px, 0) scale(${(0.95 + pf * 0.05).toFixed(3)})`)
    tr(firma, `translate3d(0, ${(Math.sin(t * 0.9) * 5).toFixed(1)}px, 0) rotate(-7deg)`)
    tr(stickerF, `translate3d(0, ${(Math.sin(t * 0.75 + 2) * 7).toFixed(1)}px, 0) rotate(-7deg)`)

    // ── la scheda che si apre ──
    const dent = det > 0.001
    el.classList.toggle('st-dentro-aperto', dent)
    op(dentro, dent ? '1' : '0')
    metti(dentro, 'visibility', dent ? 'visible' : 'hidden')
    const k = ss(0, 1, det)
    const scala = (CARD.w / 1920) + (1 - CARD.w / 1920) * k
    const tx = CARD.x * (1 - k)
    const ty = (CARD.y + (dent ? fluttua : 0)) * (1 - k)
    tr(dentro, `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scala.toFixed(4)})`)
    op(velo, (dent ? (0.68 * k).toFixed(2) : '0'))
    const dist = Math.abs(sy - Math.round(sy))
    const visHead = (1 - ss(0.015, 0.09, dist)) * (dent ? Math.max(0, 1 - k * 3) : 1)
    op(testata, visHead.toFixed(3))
    op(filo, dent ? String(Math.max(0, 1 - k * 3)) : '1')

    // dentro: il nastro dei quattro capitoli
    const N = SLIDES.length
    const u = di * (N - 1)
    const i0 = Math.min(N - 2, Math.floor(u))
    const f0 = u - i0
    const pan = i0 + ss(0.16, 0.84, f0)
    tr(nastro, `translate3d(${(-pan * 1920).toFixed(1)}px, 0, 0)`)
    const idx = Math.round(pan)
    if (dent && idx !== ultimaDentro) { ultimaDentro = idx; contaDentro.textContent = `${String(idx + 1).padStart(2, '0')} / 04` }
    tr(barraDentro, `scaleX(${(pan / (N - 1)).toFixed(4)})`)
    curaDentro(dent, idx)
    for (let i = 0; i < slideFoto.length; i++) {
      const q = (pnt.x - 0.5)
      tr(slideFoto[i], `translate3d(${(q * 34).toFixed(1)}px, ${((pnt.y - 0.5) * -12).toFixed(1)}px, 0) rotate(${i % 2 ? 0.7 : -0.7}deg)`)
      tr(slideTesti[i], `translate3d(${(q * -14).toFixed(1)}px, 0, 0)`)
    }

    // ── le scritte e il dito ──
    disegnaScritte(x, t)
    disegnaPuntatore(dt, t)

    // ── i clic dell'autopilota (e le onde) ──
    for (let i = 0; i < CLIC.length; i++) {
      const c = CLIC[i]
      if (primaVolta) fatto[i] = x > c
      else if (!fatto[i] && x >= c && x < c + 0.02) { fatto[i] = true; onda(t, pnt.x * 1920, pnt.y * 1080) }
      else if (fatto[i] && x < c - 0.003) fatto[i] = false
    }
    primaVolta = false
    disegnaOnde(t)

    // ── il sipario lime: chiude il giro e nasconde lo stacco (solo in autopilota) ──
    let kSip = 0
    if (!manuale && faseTour != null) {
      if (faseTour > T - 1.0) kSip = ss(0, 1, (faseTour - (T - 1.0)) / 1.0)
      else if (faseTour < 0.55) kSip = 1 - ss(0, 0.55, faseTour)
    }
    tr(sipario, `scaleY(${kSip.toFixed(4)})`)
    op(puntatore, kSip > 0.02 ? '0' : (acceso ? '1' : '0'))
  }

  // ── quello che arriva dalle altre pagine ──
  function comando(v) {
    if (!v || typeof v !== 'object' || !Number.isFinite(+v.x)) return
    ultimoComando = v
    const t = tOra || ctx.tempo()
    const tf = Number.isFinite(+v.t) ? +v.t : t
    const dtCom = t - tf
    xv = clamp(+v.x)
    if (Number.isFinite(+v.px)) pnt.tx = clamp(+v.px)
    if (Number.isFinite(+v.py)) pnt.ty = clamp(+v.py)
    if (dtCom >= 8 || dtCom < -1) {
      manuale = false
      el.classList.remove('st-manuale')
      manualeFino = 0
      if (dtCom >= 8) {
        // (comando di più di otto secondi fa: le altre pagine sono già ripartite, ci si allinea al loro punto)
        autoDa = tf + 8
        autoFase = xFase(xv)
        x = xAuto(autoFase + (t - autoDa))
      } else {
        // (comando di un'altra accensione: è un segnalibro, il giro riparte da lì adesso)
        autoDa = t
        autoFase = xFase(xv)
        x = xv
      }
    } else {
      manuale = true
      manualeFino = tf + 8
      el.classList.add('st-manuale')
      // (una pagina appena creata non deve scorrere dal fondo: si mette subito dove è l'altra)
      if (primaVolta) { x = xv; pnt.x = pnt.tx; pnt.y = pnt.ty }
    }
  }

  // ── il giro, chiamato da fuori (≤60 volte al secondo) ──
  function giro(dt) {
    if (!acceso) return
    const t = ctx.tempo()
    if (!Number.isFinite(t)) return
    tOra = t
    // il manuale che si ferma da solo dopo otto secondi
    if (manuale && t >= manualeFino) riparti(t)
    aggiornaOra()
    disegna(Math.min(0.1, dt || 1 / 60), t)
  }

  function mostra(su) {
    if (su) {
      acceso = true
      el.classList.remove('st-manuale', 'st-dentro-aperto')
      manuale = false
      manualeFino = 0
      x = xv = 0
      autoDa = 0
      autoFase = 0
      pnt.x = pnt.tx = 0.62
      pnt.y = pnt.ty = 0.55
      primaVolta = true
      sezFoto = -1
      centroDentro = -1
      fraseI = -1
      fraseT = -99
      primaFrase = true
      ultimaDentro = -1
      ultimaSez = -1
      cartaPrima = null
      for (let i = 0; i < fatto.length; i++) fatto[i] = false
      for (const im of $$('img[data-foto]')) scarica(im)
      misura()
      aggiornaMeteo()
      const t = ctx.tempo()
      tOra = Number.isFinite(t) ? t : 0
      if (ultimoComando) comando(ultimoComando)
      // (il puntatore parte già al posto giusto: la prova con &t=37 mostra il secondo 37 esatto)
      if (!manuale) {
        const x0 = xAuto(tOra)
        const [tx0, ty0] = puntoAuto(x0, tOra)
        pnt.x = pnt.tx = tx0
        pnt.y = pnt.ty = ty0
      }
      // (al primo giro si disegna subito: la prova con &t=37 deve mostrare il secondo 37)
      disegna(1 / 60, tOra)
    } else {
      acceso = false
      clearTimeout(timerInvio)
      for (const im of $$('img[data-foto]')) scarica(im)
      sezFoto = -1
      centroDentro = -1
    }
  }

  function aggiorna(s) {
    meteo = s?.meteo ?? null
    aggiornaMeteo()
  }

  // le porte della scena: mouse, rotella, tasti, clic
  let trascino = null
  let pntInizio = null
  function evento(e) {
    const r = el.getBoundingClientRect()
    if (!r.width) return
    pnt.tx = clamp((e.clientX - r.left) / r.width)
    pnt.ty = clamp((e.clientY - r.top) / r.height)
  }
  el.addEventListener('pointermove', (e) => {
    evento(e)
    if (!acceso) return
    if (trascino) {
      const dy = trascino.y0 - e.clientY
      xv = clamp(trascino.x0 + dy * 0.00017)
      if (Math.abs(dy) > 5) trascino.mosso = true
      tocca(ctx.tempo())
      return
    }
    if (!manuale) {
      // (un movimento vero, non il primo evento che il browser manda quando la pagina si apre)
      if (!pntInizio) pntInizio = { x: e.clientX, y: e.clientY }
      if (Math.hypot(e.clientX - pntInizio.x, e.clientY - pntInizio.y) < 3) return
      xv = x
    }
    tocca(ctx.tempo())
  }, { passive: true })
  el.addEventListener('pointerleave', () => { if (!trascino) pntInizio = null }, { passive: true })
  el.addEventListener('pointerdown', (e) => {
    if (!acceso) return
    evento(e)
    const vaiA = e.target.closest?.('[data-vai]')
    if (vaiA) return // (il clic lo gestisce il pointerup, così non si trascina per sbaglio)
    try { el.setPointerCapture(e.pointerId) } catch {}
    trascino = { y0: e.clientY, x0: xv, mosso: false }
    tocca(ctx.tempo())
  }, { passive: true })
  el.addEventListener('pointerup', (e) => {
    if (!acceso) return
    evento(e)
    const era = trascino
    trascino = null
    const vaiA = e.target.closest?.('[data-vai]')
    if (vaiA && !era?.mosso) {
      const t = ctx.tempo()
      if (detDi(x) > 0.02 && !vaiA.classList.contains('st-chiudi')) vai(0.63, t)
      else vai(+vaiA.dataset.vai, t)
      onda(t, pnt.tx * 1920, pnt.ty * 1080)
      inviaDopo()
      return
    }
    if (detDi(x) > 0.02 && !era?.mosso) {
      vai(0.63, ctx.tempo())
      onda(ctx.tempo(), pnt.tx * 1920, pnt.ty * 1080)
      inviaDopo()
      return
    }
    if (era?.mosso) inviaDopo()
  }, { passive: true })
  el.addEventListener('pointercancel', () => { trascino = null })
  el.addEventListener('wheel', (e) => {
    if (!acceso) return
    e.preventDefault()
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 1080 : 1)
    xv = clamp(xv + dy * 0.00019)
    tocca(ctx.tempo())
    inviaDopo()
  }, { passive: false })
  function tasto(e) {
    if (!acceso || e.ctrlKey || e.metaKey || e.altKey) return
    const a = document.activeElement
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
    const t = ctx.tempo()
    let d = 0
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') d = 0.035
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') d = -0.035
    else if (e.key === 'ArrowRight') d = 0.02
    else if (e.key === 'ArrowLeft') d = -0.02
    else if (e.key === 'Home') { e.preventDefault(); vai(0, t); inviaDopo(); return }
    else if (e.key === 'End') { e.preventDefault(); vai(0.985, t); inviaDopo(); return }
    else if (e.key === 'Enter' && detDi(x) > 0.02) { e.preventDefault(); vai(0.63, t); inviaDopo(); return }
    if (!d) return
    e.preventDefault()
    xv = clamp(xv + d)
    tocca(t)
    inviaDopo()
  }
  window.addEventListener('keydown', tasto)

  // (le misure definitive: prima che il primo giro disegni)
  misura()
  const t0 = ctx.tempo()
  tOra = Number.isFinite(t0) ? t0 : 0
  aggiornaOra()
  aggiornaMeteo()

  return { el, mostra, giro, aggiorna, comando }
}
