// La barra in alto di pzkko.it (26.10, Alberto: «fai una topbar con sezioni dove c'è la storia del sito, i gadget, elenchi di
// oggetti, achievement, account, info e copyright»; poi: «più in stile pzk, senza sfondo: pixel che escono dall'alto, tasti
// che sono pezzi di carta, scritte di vari font»; il 6.11: «rifallo stra figo»). Niente striscia: dall'alto cola vernice a
// pixel (la colata: una tela piccola, più sotto), e le voci sono pezzi di carta veri, ognuno il suo oggetto (lo scontrino,
// il cartone pinzato, il post-it, il biglietto con la puntina, la pagina di quaderno, lo strappo, il cartellino appeso
// allo spago: CARTE), il suo carattere e la sua storta, in fila al centro (Alberto: «niente tasto pzk, allinea tutto
// centralmente»: il muro c'è già sotto). Gli strappi e la colata vengono da un caso col seme fisso: sempre gli stessi.
// La mette questo modulo in ogni pagina che lo carica (la home, la storia e la 404 che si generano da lei, e le pagine
// nuove: gadget, oggetti, traguardi, info), così le voci stanno in un posto solo. L'altezza è --barra (barra.css): la home
// ci sposta sotto il wallet e il cercapersone.
// ACCOUNT nella home apre il cercapersone sull'app Account (games/pzk.js, apriWallet('conto')); nelle altre pagine porta
// alla home con #account, che fa lo stesso. WIKI è pzkkopedia (/wiki/), piena dal 2.11. Una voce senza indirizzo (null) si
// vedrebbe col timbro «presto».

import { src } from '../chat/icone.js'
// il fruscio dei pezzi di carta (e i suonini dei tasti e le musichette di tutta la pagina: suono/interfaccia.js)
// (vai: nella cornice, se la musica suona, la pagina nuova si apre senza lasciare questa: suono/cornice.js)
import { fruscio, vai } from '../suono/interfaccia.js'

// [indirizzo, nome, icona, a cosa serve, la carta, il carattere]
const VOCI = [
  ['/storia/', 'storia', 'clessidra', 'com’è nato pzkko', 'scontrino', 'macchina'],
  ['/gadget/', 'gadget', 'pager', 'il wallet, il cercapersone e le sue app, i giochi', 'cartone', 'stencil'],
  ['/oggetti/', 'oggetti', 'zaino', 'tutto quello che si compra, si pesca, si caccia, si scava', 'postit', 'pennarello'],
  ['/traguardi/', 'traguardi', 'trofeo', 'gli achievement: quelli fatti e quelli da fare', 'rosa', 'tondo'],
  ['#account', 'account', 'app-account', 'il conto: crealo, entra, cambia, invia', 'quaderno', 'mono'],
  ['/info/', 'info', 'cuore', 'cos’è pzkko, chi l’ha fatto, il copyright', 'bianca', 'mano'],
  ['/wiki/', 'wiki', 'manuale-landini', 'pzkkopedia, l’enciclopedia libera del muro: una voce per ogni cosa del sito', 'grigia', 'bungee'],
]
// (fuori dalla home, prima di tutte) INDIETRO (26.10, Alberto: «premendo i tasti in topbar non ho modo di tornare
// indietro»): una freccia di cartoncino rosso; porta sempre alla home pulita, «/» (Alberto: «quando faccio indietro deve
// tornare in home», non alla pagina di prima: quella poteva essere /#account, che riapriva l'account)
const INDIETRO = ['/', 'indietro', null, 'torna indietro', 'indietro', 'pennarello']

// il caso col seme (mulberry32): la barra è uguale a ogni visita
const caso = (seme) => () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const px = (n) => `${n.toFixed(1)}px`
const pc = (t) => `${(t * 100).toFixed(1)}%`

/** Il bordo strappato di un pezzo di carta: un poligono coi denti piccoli e storti sui lati che hanno un'ampiezza (su,
 *  de, giu, si, in px; un lato a zero resta dritto, tagliato con le forbici). Un dente ogni «passo» px, più o meno. */
function strappo(r, { su = 0, de = 0, giu = 0, si = 0, largo = 100, passo = 5 } = {}) {
  const p = [], nx = Math.max(5, Math.round(largo / passo)), ny = Math.max(3, Math.round(40 / passo))
  const lato = (amp, n, f) => { for (let i = 0; i < (amp ? n : 1); i++) p.push(f(i ? (i + (r() - 0.5) * 0.6) / n : 0, amp ? r() * amp * (r() < 0.15 ? 1.7 : 1) : 0)) }
  lato(su, nx, (t, d) => `${pc(t)} ${px(d)}`)
  lato(de, ny, (t, d) => `calc(100% - ${px(d)}) ${pc(t)}`)
  lato(giu, nx, (t, d) => `${pc(1 - t)} calc(100% - ${px(d)})`)
  lato(si, ny, (t, d) => `${px(d)} ${pc(1 - t)}`)
  return `polygon(${p.join(',')})`
}
/** La freccia di cartoncino del tasto indietro: la punta a sinistra, la coda strappata. */
const freccia = (r) => `polygon(16px 0,100% 0,${[1, 2, 3, 4].map((i) => `calc(100% - ${px(r() * 3.4)}) ${i * 20}%`).join(',')},100% 100%,16px 100%,0 50%)`

// Le carte (6.11, «rifallo stra figo»): ogni voce è un oggetto vero, non un rettangolo colorato. Di ognuna: com'è tagliata
// (forma: il clip-path della carta; i buchi e i denti regolari li fa la maschera in barra.css), se strappandosi mostra
// l'anima chiara (orlo), con cosa sta attaccata (fermi), e cos'ha stampato sopra (dentro la carta) o addosso (fuori).
const CARTE = {
  // lo scontrino: carta termica, strappato in cima, i denti della taglierina in fondo, il codice a barre
  scontrino: { forma: (r, largo) => strappo(r, { su: 2.4, largo }), fermi: ['nastro'], dentro: '<i class="codice"></i>' },
  // il cartone: strappato a mano su quattro lati (si vede l'onda dentro), pinzato con due graffette
  cartone: { forma: (r, largo) => strappo(r, { su: 3, de: 3.4, giu: 3, si: 3.4, largo, passo: 6 }), orlo: true, fermi: ['graffa', 'graffa due'] },
  // il post-it: si regge da solo, con l'angolo in basso che si alza
  postit: { forma: () => 'polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)', fuori: '<i class="piega"></i>' },
  // il biglietto rosa: le due tacche, la cornice, la matrice tratteggiata con l'icona; una puntina gialla
  rosa: { fermi: ['puntina'], dentro: '<i class="cornice"></i><i class="taglio"></i>' },
  // la pagina di quaderno: i buchi, il margine rosso, strappata in fondo; un pezzo di scotch sull'angolo
  quaderno: { forma: (r, largo) => strappo(r, { giu: 2.6, de: 1.2, largo }), fermi: ['scotch'] },
  // lo strappo bianco scritto a mano: strappato tutto intorno, con l'alone di una tazzina
  bianca: { forma: (r, largo) => strappo(r, { su: 3, de: 3, giu: 3.4, si: 3, largo }), orlo: true, fermi: ['nastro'], dentro: '<i class="alone"></i>' },
  // il cartellino grigio: gli angoli smussati, il buco con l'anello, appeso allo spago
  grigia: { forma: () => 'polygon(10px 0,100% 0,100% 100%,10px 100%,0 calc(100% - 9px),0 9px)', fermi: ['spago'], fuori: '<i class="anello"></i>' },
  // indietro: una freccia di cartoncino rosso, col nastro nero
  indietro: { forma: (r) => freccia(r), fermi: ['nastro nero'] },
}

// il giro di pennarello rosso intorno alla pagina in cui sei: si disegna da solo
const GIRO = '<svg class="giro" viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M14 27C10 9 44 3 70 4c28 1 44 9 42 22-2 14-36 21-64 19C22 43 5 36 9 22 12 11 34 5 60 6"/></svg>'

/** Una voce: il <li> col suo pezzo di carta. */
function voce(r, i, [href, nome, ic, cosa, carta, font], qui) {
  const c = CARTE[carta], largo = nome.length * 10 + 62, qua = href === qui
  const stile = `--i:${i};--r:${((r() - 0.5) * 6).toFixed(1)}deg;--y:${(r() * 5).toFixed(1)}px;--n:${((r() - 0.5) * 26).toFixed(0)}deg;--nx:${(34 + r() * 32).toFixed(0)}%`
  // la carta è un livello sotto (span.carta): il suo clip-path non taglia il nastro, lo spago né l'ombra del pezzo
  const forma = c.forma ? ` style="clip-path:${c.forma(r, largo)}"` : ''
  const orlo = c.orlo ? `<span class="orlo" style="clip-path:${c.forma(r, largo)}"></span>` : ''
  const fermi = (c.fermi ?? []).map((f) => `<i class="fermo ${f}"></i>`).join('')
  const icona = ic ? `<img src="${src(ic)}" alt="" width="22" height="22">` : ''
  const dentro = `${orlo}<span class="carta"${forma}>${c.dentro ?? ''}</span>${fermi}${c.fuori ?? ''}${icona}${nome}${href ? '' : '<small>presto</small>'}${qua ? GIRO : ''}`
  const attr = `class="pezzo c-${carta} f-${font}" title="${cosa}"`
  const dove = `href="${href}"${qua ? ' aria-current="page"' : ''}${href === '#account' ? ' data-account' : ''}${carta === 'indietro' ? ' data-indietro' : ''}`
  return `<li${carta === 'indietro' ? ' class="fisso"' : ''} style="${stile}">${href ? `<a ${attr} ${dove}>${dentro}</a>` : `<span ${attr} aria-disabled="true">${dentro}</span>`}</li>`
}

// ------------------------------------------------------------------------------------------------------- la colata
// La vernice a pixel che cola dall'alto (6.11; prima era una frangia: un SVG fermo che si ripeteva). Una tela piccola,
// un pixel della tela = 4 px dello schermo: in cima una fascia nera, e giù le gocce, ognuna larga e lunga a modo suo, con
// la pancia in fondo e il suo riflesso; qualcuna è di vernice colorata, sotto la nera. Si muove solo quando serve: alla
// prima pagina della visita cola giù, sotto il puntatore le gocce si allungano, e finché stai su una voce qualche goccia
// si stacca e cade. A pagina ferma non gira niente (nove animazioni sempre in corso tenevano sveglia la scheda grafica).
const P = 4, RIGHE = 30
const NERO = ['#0e0d0c', '#4a4640', '#0e0d0c'] // [la vernice, il riflesso, l'ombra]
const COLORI = [['#ffd400', '#fff3a6', '#c49a00'], ['#46ff7d', '#c9ffd9', '#1fb850'], ['#ff5a4a', '#ffc2bb', '#c22d1f'], ['#4aa8ff', '#c4e2ff', '#1f72c4']]
const molla = (k) => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2 // arriva, passa di poco e torna

function colata(nav, entra) {
  const tela = nav.querySelector('canvas'), fila = nav.querySelector('ul'), g = tela.getContext('2d')
  if (!g) return
  const fermo = matchMedia('(prefers-reduced-motion:reduce)').matches, nato = performance.now()
  let N = 0, base = [], gocce = [], cadono = [], punta = -1e4, sopra = false, piove = false, attivo = false, ultimo = 0, prossima = 0

  function semina() {
    const r = caso(1981), voci = fila.querySelectorAll('li')
    N = Math.ceil(nav.clientWidth / P)
    tela.width = N; tela.height = RIGHE; tela.style.width = `${N * P}px`
    // fra la prima e l'ultima voce le gocce restano corte: lì ci sono i pezzi di carta
    const da = voci.length ? voci[0].getBoundingClientRect().left / P - 3 : 0, a = voci.length ? voci[voci.length - 1].getBoundingClientRect().right / P + 3 : 0
    base = []; gocce = []
    for (let c = 0, s = 2; c < N; c++) { if (r() < 0.35) s = [2, 3, 3, 3, 4, 2, 4][Math.floor(r() * 7)]; base.push(s) }
    for (let c = 2; c < N;) {
      let w = r() < 0.28 ? 3 : r() < 0.6 ? 2 : 1, l = r() < 0.3 ? 7 + r() * 8 : 1.5 + r() * 4
      const tinta = r() < 0.13 ? COLORI[Math.floor(r() * COLORI.length)] : NERO, ritardo = r(), stacco = r() < 0.4 ? 2 + Math.floor(r() * 2) : 0, salto = w + 1 + Math.floor(r() * 5)
      if (c > da && c < a) l = Math.min(l, 2 + (l % 3))
      if (tinta !== NERO) { w = Math.max(2, w); l = Math.max(l, 4.5) } // una colorata corta sarebbe un puntino sotto la nera
      gocce.push({ c, w, l, tinta, ritardo, stacco: l >= 7 ? stacco : 0, tira: 0 })
      c += salto
    }
  }

  /** Una goccia; torna la riga dove finisce. */
  function goccia(d, k) {
    const cima = base[d.c], l = Math.round(d.l * (k < 1 ? molla(k) : 1) + d.tira), y1 = cima + l, [col, luce, ombra] = d.tinta
    if (l <= 0) return cima
    g.fillStyle = col
    if (d.tinta === NERO) g.fillRect(d.c - 1, 0, d.w + 2, cima + 1) // dove esce dalla fascia è più larga: il menisco
    g.fillRect(d.c, 0, d.w, y1 - 1)
    const pancia = l >= 7 && d.w > 1
    if (pancia) g.fillRect(d.c - 1, y1 - 5, d.w + 2, 3)
    if (d.w !== 2 || !pancia) g.fillRect(d.c + (d.w === 3 ? 1 : d.w === 2 ? d.c & 1 : 0), y1 - 1, 1, 1) // la punta
    if (d.w > 1 && l >= 4) {
      if (col !== ombra) { g.fillStyle = ombra; g.fillRect(d.c + d.w - 1, cima + 1, 1, l - 3) }
      g.fillStyle = luce
      g.fillRect(d.c, cima + 1, 1, Math.max(1, l - (pancia ? 6 : 4)))
      if (pancia) g.fillRect(d.c - 1, y1 - 5, 1, 2)
    }
    if (d.stacco && k >= 1) { g.fillStyle = col; g.fillRect(d.c + (d.w >> 1), y1 + d.stacco - 1, 1, 1) } // una goccia già staccata
    return y1
  }

  /** Tutta la tela; torna i secondi passati dall'apertura. */
  function disegna(t) {
    const eta = (t - nato) / 1000, quanto = (d) => (entra && !fermo ? Math.max(0, Math.min(1, (eta - 0.15 - d.ritardo * 0.8) / 0.55)) : 1)
    g.clearRect(0, 0, N, RIGHE)
    for (const d of gocce) if (d.tinta !== NERO) d.fine = goccia(d, quanto(d)) // le colorate stanno sotto la nera
    g.fillStyle = NERO[0]
    for (let c = 0; c < N; c++) g.fillRect(c, 0, 1, base[c])
    for (const d of gocce) if (d.tinta === NERO) d.fine = goccia(d, quanto(d))
    for (const k of cadono) { g.globalAlpha = Math.max(0, k.a); g.fillStyle = k.col; g.fillRect(k.c, Math.round(k.y), 1, 1) }
    g.globalAlpha = 1
    return eta
  }

  function passo(t) {
    const dt = Math.min(50, t - ultimo) / 1000
    ultimo = t
    let mosso = false
    for (const d of gocce) { // sotto il puntatore le gocce si allungano
      const lontano = Math.abs(d.c + d.w / 2 - punta), vuole = sopra && lontano < 22 ? (1 - lontano / 22) ** 2 * 4 : 0
      if (Math.abs(vuole - d.tira) > 0.04) { d.tira += (vuole - d.tira) * Math.min(1, dt * 10); mosso = true } else d.tira = vuole
    }
    const eta = disegna(t), scena = entra && eta < 3.2 // la scena dell'apertura: cola giù, poi piove un attimo
    if ((piove || (scena && eta > 1)) && t > prossima && gocce.length) { // una goccia si stacca
      const d = gocce[Math.floor(Math.random() * gocce.length)]
      cadono.push({ c: d.c + (d.w >> 1), y: d.fine ?? 3, v: 0, a: 1, col: d.tinta[0] })
      prossima = t + 220 + Math.random() * 520
    }
    for (const k of cadono) { k.v += 70 * dt; k.y += k.v * dt; if (k.y > RIGHE - 9) k.a -= dt * 5 }
    cadono = cadono.filter((k) => k.a > 0 && k.y < RIGHE)
    if (mosso || scena || piove || cadono.length) requestAnimationFrame(passo)
    else { attivo = false; disegna(t) }
  }
  const sveglia = () => { if (!attivo && !fermo) { attivo = true; ultimo = performance.now(); requestAnimationFrame(passo) } }
  const rifai = () => { semina(); if (!attivo) disegna(performance.now()) }

  semina()
  disegna(performance.now())
  if (entra) sveglia()
  let larga = nav.clientWidth
  new ResizeObserver(() => { if (nav.clientWidth !== larga) { larga = nav.clientWidth; rifai() } }).observe(nav)
  document.fonts?.ready.then(rifai) // coi caratteri veri le voci sono larghe diverse
  if (fermo) return
  // il puntatore: conta solo quando sta in cima alla pagina
  addEventListener('pointermove', (e) => {
    const era = sopra
    sopra = e.clientY < 130 && e.pointerType !== 'touch'
    if (!sopra && !era) return
    punta = e.clientX / P
    sveglia()
  }, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => { if (sopra) { sopra = false; sveglia() } })
  nav.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') { piove = true; sveglia() } })
  nav.addEventListener('pointerout', (e) => { if (!nav.contains(e.relatedTarget)) piove = false })
}

function barra() {
  if (document.querySelector('.barra')) return
  const qui = location.pathname.replace(/\/?$/, '/'), r = caso(26101)
  const nav = document.createElement('nav')
  nav.className = 'barra'
  nav.setAttribute('aria-label', 'le sezioni di pzkko')
  // la prima pagina della visita: la vernice cola giù e i pezzi di carta si attaccano uno dopo l'altro; nelle pagine dopo
  // la barra c'è già, ferma (è la stessa barra: cambiando pagina non deve rifare la scena)
  let entra = false
  try { entra = !sessionStorage.getItem('pzkko-barra'); sessionStorage.setItem('pzkko-barra', '1') } catch {}
  if (entra) nav.classList.add('entra')
  const voci = qui === '/' ? VOCI : [INDIETRO, ...VOCI]
  nav.innerHTML = `<div class="barra-colata" aria-hidden="true"><canvas></canvas></div>
    <ul>${voci.map((v, i) => voce(r, i, v, qui)).join('')}</ul>`
  document.body.prepend(nav)
  document.documentElement.classList.add('con-barra')
  // sul telefono la fila scorre: la voce della pagina in cui sei si porta in vista, scorrendo il meno possibile (e la
  // freccia INDIETRO resta ferma a sinistra, sopra le altre: li.fisso, barra.css)
  const fila = nav.querySelector('ul'), qua = nav.querySelector('[aria-current]')?.parentElement
  if (qua) fila.scrollLeft = Math.max(0, qua.offsetLeft + qua.offsetWidth + 14 - fila.clientWidth)
  colata(nav, entra)
  // il fruscio, e il link parte un attimo dopo (se no la pagina nuova lo tronca); coi tasti modificatori (nuova scheda) subito
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a.pezzo')
    if (!a) return
    fruscio()
    if (a.hasAttribute('data-account') || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return
    e.preventDefault()
    setTimeout(() => vai(a.href), 120) // (INDIETRO compreso: il suo link è la home, «/»)
  })
  nav.querySelector('[data-account]')?.addEventListener('click', (e) => {
    e.preventDefault()
    if (qui === '/') import('../games/pzk.js').then((p) => p.apriWallet('conto')) // nella home: il cercapersone sull'account
    else vai('/#account')
  })
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', barra)
else barra()
// il canale sempre aperto col server (games/live.js): solo chi è entrato nel conto, e quando il browser è tranquillo
try { if (localStorage.getItem('pzkko-wallet')) (window.requestIdleCallback ?? setTimeout)(() => import('../games/live.js').catch(() => {}), { timeout: 3000 }) } catch {}
