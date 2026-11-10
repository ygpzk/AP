// Il tavolo dei ricordi di Deutschland (9.11.2026 notte, «Deutschland 3»): quello che si vede appena si entra. Alberto:
// «rifarei la disposizione, è poco pratica, poco simmetrica, troppo spazio occupa», «devono essere sparse e messe a mano e
// non perfette le foto», «metti solo foto migliori appena apri e poi nelle sigarette vedi tutto», «le sigarette voglio
// vederle meglio, mettile tra le foto», «deve sembrare l'outro di Cars 2, con la carta vera e tutte le cose del viaggio e i
// suoi ricordi», e i meme di JMA: «mettili tutti». Poi: «cambia tutte le foto casualmente», «altri font, tipo altri 5».
// #tavolo è un foglio di carta (galleria.css: grana, macchie, margini spessi a destra e a sinistra) e sopra, in fila per
// giorno ma storti come buttati lì a mano: 46 FOTO A CASO (scegli(): una per raffica, niente schermate; diverse a ogni visita
// e a ogni «↻ Mischen» in testa al foglio; Polaroid con la scritta a mano o stampe col nastro), i 16 PACCHETTI di sigarette in
// mezzo (ognuno vicino a una foto del suo tag, se c'è; un tocco → «deutschland:pacco» {tag}, packung.js apre il suo album
// sopra), i MEME del viaggio (manifesto.meme) su post-it, sottobicchieri, fogli di quaderno, scontrini e tovaglioli, ognuno
// con una calligrafia a caso fra otto (MANI), gli STICKER, e per ogni giorno un pezzo di nastro col giorno e il timbro della
// città. La disposizione la fa impagina(): colonne uguali (simmetrico, niente buchi), ogni cosa nella colonna più bassa con le
// sue storture (--r, --x, --y), gli sticker sugli angoli.
// Le foto: la «m» (480 px) da rete.js quando si avvicinano (IntersectionObserver, 800 px), mai l'originale. Il tocco → il
// visore («deutschland:apri»), che scorre le foto del tavolo (album.usaTavolo). La foto a un terzo dello schermo muove la
// GLA sulla mappa («deutschland:foto»), con un altro IntersectionObserver: niente che giri a pagina ferma.

import { evento, caso } from './comune.js'
import { prendi, miniatura, libera } from './rete.js'
import { PACCHI, immagineDi, conteggi, SEGNAPOSTO } from './filtri.js'
import { dataTedesca, citta, doveDelGiorno, usaTavolo } from './album.js'

const QUANTE = 46 // le foto sul tavolo a ogni giro
const SOTTOSOPRA = new Set(['img-6327']) // (sottosopra nell'originale: mai sul tavolo)
const BRUTTE = /schermat|app |applicaz|biglietto|documento|ricevuta|scontrino|telefono|cellulare|smartphone|menu|interfaccia|mappa|sfocat|saldo/i
// le calligrafie delle scritte a mano (pacchi.css): famiglia e quanto ingrandirla perché sembrino grandi uguali
const MANI = [
  ['"Gloria Hallelujah"', 0.78], ['"Shadows Into Light"', 1], ['"Patrick Hand"', 0.95], ['"Covered By Your Grace"', 1.05], ['"Gochi Hand"', 0.92],
  ['"Caveat"', 1], ['"Permanent Marker"', 0.78], ['"Reenie Beanie"', 1.12],
]
const STICKER = ['ampelmann', 'brezel', 'ubahn', 'currywurst', 'autobahn', 'mass', 'targa', 'jma'] // art/deutschland/sticker/<nome>.webp
const CARTE_MEME = ['postit', 'bierdeckel', 'quaderno', 'scontrino', 'tovagliolo']
const VICINO = '800px 0px'

let el, foto = [], posti = new Map(), ordine = [], rnd = Math.random

const tra = (a, b) => a + (b - a) * rnd()
const deg = (v) => `${v.toFixed(2)}deg`
const px = (v) => `${v.toFixed(1)}px`

const mano = () => MANI[Math.floor(rnd() * MANI.length)]

/** Le foto del tavolo, A CASO a ogni visita e a ogni «mischen» (Alberto, 9.11 notte: «cambia tutte le foto casualmente»): le
 *  foto (niente video né schermate, niente didascalie da schermata o da foto mossa) si dividono in raffiche (scatti a meno di
 *  45 s l'uno dall'altro), si pescano QUANTE raffiche a caso e da ognuna una foto a caso; poi in ordine di tempo. */
function scegli(m) {
  const buone = []
  m.foto.forEach((f, i) => { if (f.tipo === 'foto' && !(f.tag ?? []).includes('screenshot') && !SOTTOSOPRA.has(f.id) && !BRUTTE.test(f.didascalia ?? '')) buone.push(i) })
  const raffiche = []
  let g = []
  for (const i of buone) { if (g.length && Date.parse(m.foto[i].t) - Date.parse(m.foto[g.at(-1)].t) > 45e3) { raffiche.push(g); g = [] } g.push(i) }
  if (g.length) raffiche.push(g)
  for (let k = raffiche.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [raffiche[k], raffiche[j]] = [raffiche[j], raffiche[k]] }
  return raffiche.slice(0, QUANTE).map((r) => r[Math.floor(rnd() * r.length)]).sort((a, b) => a - b)
}

/** Una cosa sul tavolo: le storture a caso (rotazione, spostamento, sopra o sotto). */
function cosa(tag, classi, { r = 4, x = 8, y = 10 } = {}) {
  const e = document.createElement(tag)
  e.className = `cosa ${classi}`
  e.style.setProperty('--r', deg(tra(-r, r)))
  e.style.setProperty('--x', px(tra(-x, x)))
  e.style.setProperty('--y', px(tra(-y, y)))
  e.style.setProperty('--z', String(1 + Math.floor(rnd() * 5)))
  e._lay = { tipo: 'riga', span: 1, u: rnd(), q: rnd() } // (impagina: che cosa è, quante colonne, dove nella colonna, quanto è grande)
  return e
}

function ricordo(i, k) {
  const f = foto[i]
  const p = posti.get(f.posto)
  const polaroid = rnd() < 0.55
  const orizz = (f.w || 3) > (f.h || 4)
  const b = cosa('button', `ricordo ${polaroid ? 'polaroid' : 'nastro'}${orizz ? ' orizz' : ''}`, { r: 4.5, x: 10, y: 12 })
  b.type = 'button'
  b.dataset.id = f.id
  b.dataset.i = String(i)
  b.setAttribute('role', 'listitem')
  b.setAttribute('aria-label', `foto delle ${f.ora ?? '?'}${p ? ` · ${p.nome}` : ''}${f.didascalia ? ` · ${f.didascalia}` : ''}`)
  b._lay.tipo = 'foto'; b._lay.span = orizz ? 2 : 1
  const quadro = document.createElement('span')
  quadro.className = 'ri-foto'
  quadro.style.aspectRatio = `${f.w || 3} / ${f.h || 4}`
  quadro.style.backgroundColor = f.col || '#2a2a2a'
  if (f.blur) quadro.style.backgroundImage = `url("${f.blur}")`
  const img = document.createElement('img')
  img.alt = ''
  img.decoding = 'async'
  img.draggable = false
  img.onload = () => b.classList.add('carica')
  quadro.append(img)
  b.append(quadro)
  if (polaroid) {
    const s = document.createElement('span'); s.className = 'ri-scritta'
    const [ff, fk] = mano(); s.style.fontFamily = `${ff}, cursive`; s.style.setProperty('--mk', String(fk))
    s.textContent = [p?.nome || citta(p), f.ora].filter(Boolean).join(' · ') || 'unterwegs'
    s.style.setProperty('--rs', deg(tra(-2.5, 2.5)))
    b.append(s)
  } else {
    // un pezzo di nastro di carta in alto (a volte due, agli angoli)
    const n = document.createElement('i'); n.className = rnd() < 0.5 ? 'ri-nastro' : 'ri-nastro due'
    n.style.setProperty('--rn', deg(tra(-8, 8)))
    b.append(n)
  }
  return b
}

function pacco(p, n, grande = false) {
  const b = cosa('button', `tav-pacco${grande ? ' grande' : ''}`, { r: 13, x: 8, y: 12 })
  b.type = 'button'
  b.dataset.tag = p.tag ?? 'alles'
  b.setAttribute('role', 'listitem')
  b.setAttribute('aria-label', p.tag ? `${p.nome}: l'album di ${p.tag}, ${n} foto` : `${p.nome}: l'album con tutte le ${n} foto`)
  b.style.setProperty('--c', p.colore); b.style.setProperty('--t', p.testo); b.style.setProperty('--f', p.font)
  b._lay.tipo = grande ? 'riga' : 'pacco'
  const img = document.createElement('img')
  img.alt = ''; img.decoding = 'async'; img.loading = 'lazy'; img.width = 120; img.height = 192; img.draggable = false
  img.onerror = () => { img.onerror = null; img.src = SEGNAPOSTO; b.classList.add('segnaposto') }
  img.src = immagineDi(p)
  const marca = document.createElement('b'); marca.className = 'tp-marca'; marca.textContent = p.nome // (sul segnaposto)
  const cartellino = document.createElement('span'); cartellino.className = 'tp-cartellino'
  cartellino.style.setProperty('--rc', deg(tra(-6, 6)))
  cartellino.innerHTML = `<span class="tp-nome"></span><span class="tp-n">${n}</span>`
  cartellino.querySelector('.tp-nome').textContent = p.tag ? p.nome : 'JMA · alles'
  b.append(img, marca, cartellino)
  return b
}

function meme(mm, k) {
  // (il sottobicchiere è tondo e piccolo: solo per le frasi corte; le lunghe vanno su un foglio che cresce)
  let carta = CARTE_MEME[k % CARTE_MEME.length]
  if (carta === 'bierdeckel' && mm.testo.length > 24) carta = 'postit'
  const f = cosa('figure', `meme meme-${carta}`, { r: carta === 'bierdeckel' ? 14 : 6, x: 8, y: 10 })
  f.setAttribute('role', 'listitem')
  f._lay.tipo = carta === 'bierdeckel' ? 'tondo' : 'meme'
  const q = document.createElement('blockquote'); q.textContent = mm.testo
  q._mk = 1
  if (carta !== 'scontrino') { const [ff, fk] = mano(); q.style.fontFamily = `${ff}, cursive`; q._mk = fk }
  q.style.setProperty('--mk', String(q._mk))
  f.append(q)
  if (mm.chi) { const c = document.createElement('figcaption'); c.textContent = `— ${mm.chi[0].toUpperCase()}${mm.chi.slice(1)}`; f.append(c) }
  return f
}

function sticker(nome) {
  const s = cosa('img', 'tav-sticker', { r: 20, x: 6, y: 4 })
  s.alt = ''; s.decoding = 'async'; s.loading = 'lazy'; s.draggable = false
  s.src = `/art/deutschland/sticker/${nome}.webp`
  s.onerror = () => { s.hidden = true }
  s._lay.tipo = 'sticker'
  return s
}

function giorno(g, k, giorni, indici) {
  const h = cosa('h2', 'giorno', { r: 0.4, x: 20, y: 2 }) // (largo quanto il foglio: storto di più alzerebbe il timbro in fondo sulle foto)
  // la città del timbro: quella del posto con più foto del giorno
  const quante = new Map()
  for (const i of indici) { const c = citta(posti.get(foto[i].posto)); if (c) quante.set(c, (quante.get(c) ?? 0) + 1) }
  const timbro = [...quante].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const [aa, mm, gg] = g.split('-')
  const dove = doveDelGiorno(indici, k, giorni, foto, posti)
  h.innerHTML = `<span class="gi-nastro"><span class="gi-tag">Tag ${k}</span> <span class="gi-data"></span></span>${dove ? '<span class="gi-dove"></span>' : ''}${timbro ? `<span class="gi-timbro" aria-hidden="true"><b></b><small>${gg}.${mm}.${String(aa).slice(2)}</small></span>` : ''}`
  h.querySelector('.gi-data').textContent = dataTedesca(g)
  if (dove) h.querySelector('.gi-dove').textContent = dove
  if (timbro) { h.querySelector('.gi-timbro b').textContent = timbro.toUpperCase(); h.querySelector('.gi-timbro').style.setProperty('--rt', deg(tra(-16, 16))) }
  return h
}

function testa(m, n) {
  const h = document.createElement('header')
  h.className = 'cosa tav-testa'
  h._lay = { tipo: 'riga', span: 1, u: 0.5, q: 0.5 }
  h.innerHTML = '<p class="tt-titolo">München <span>→</span> Stuttgart</p><p class="tt-sotto"></p><button type="button" class="segnale segnale-gelb tt-mischen" data-azione="mischen" title="altre foto a caso"><span aria-hidden="true">↻</span> Mischen</button>'
  const da = new Date(`${m.viaggio?.da}T12:00:00`), a = new Date(`${m.viaggio?.a}T12:00:00`)
  const date = Number.isNaN(+da) || Number.isNaN(+a) ? '' : `${da.getDate()}.–${a.getDate()}. ${dataTedesca(m.viaggio.a).split(' ').at(-1)} ${a.getFullYear()}`
  h.querySelector('.tt-sotto').textContent = [date, 'mit JMA', `${n} Erinnerungen`].filter(Boolean).join(' · ')
  return h
}

function nota(testo, classe = '') {
  const p = cosa('p', `tav-nota ${classe}`, { r: 5, x: 6, y: 6 })
  p.textContent = testo
  p._lay.tipo = 'nota'
  return p
}

/** Mette le cose in fila: testa, poi per ogni giorno il nastro e le foto, coi meme accanto alla loro foto; i meme senza
 *  foto, i pacchetti e gli sticker sparsi in mezzo; in fondo JMA, l'album di tutto. */
function disponi(m) {
  const n = conteggi(m)
  const best = scegli(m)
  const giorni = [...new Set(m.foto.map((f) => f.giorno || '?'))].sort()
  const perGiorno = new Map()
  for (const i of best) { const g = foto[i].giorno || '?'; if (!perGiorno.has(g)) perGiorno.set(g, []); perGiorno.get(g).push(i) }
  const tuttiDelGiorno = new Map()
  foto.forEach((f, i) => { const g = f.giorno || '?'; if (!tuttiDelGiorno.has(g)) tuttiDelGiorno.set(g, []); tuttiDelGiorno.get(g).push(i) })

  // la fila: [{ tipo, … }]; `dopo` = dopo quale foto (posizione nella fila delle foto) vanno le cose sparse
  const meme0 = m.meme ?? []
  const vicini = new Map()
  const liberi = []
  for (const mm of meme0) { const i = mm.vicino ? foto.findIndex((f) => f.id === mm.vicino) : -1; if (i >= 0 && best.includes(i)) { if (!vicini.has(i)) vicini.set(i, []); vicini.get(i).push(mm) } else liberi.push(mm) }
  const fila = [] // posizioni delle foto, nell'ordine
  for (const g of giorni) for (const i of perGiorno.get(g) ?? []) fila.push(i)
  const N = fila.length
  const sparsi = Array.from({ length: N }, () => []) // cose da mettere dopo la foto k
  // i pacchetti: JMA dopo la prima foto; gli altri vicino a una foto del loro tag, il più lontano possibile dagli altri
  const usati = []
  const lontano = (k) => (usati.length ? Math.min(...usati.map((u) => Math.abs(u - k))) : N)
  for (const p of PACCHI) {
    let k
    if (!p.tag) k = Math.min(1, N - 1)
    else {
      const cand = fila.map((i, kk) => [i, kk]).filter(([i]) => (foto[i].tag ?? []).includes(p.tag)).map(([, kk]) => kk)
      const tutte = cand.length ? cand : fila.map((_, kk) => kk)
      k = tutte.reduce((best, kk) => (lontano(kk) > lontano(best) ? kk : best), tutte[0])
    }
    if (k == null || k < 0) continue
    usati.push(k)
    sparsi[k].push({ tipo: 'pacco', p })
  }
  // i meme senza foto: a distanza uguale
  liberi.forEach((mm, j) => { const k = Math.min(N - 1, Math.round(((j + 0.55) * N) / liberi.length)); sparsi[Math.max(0, k)].push({ tipo: 'meme', mm }) })
  // gli sticker: uno ogni tanto, dove non c'è già un pacchetto
  STICKER.forEach((s, j) => { let k = Math.min(N - 1, Math.round(((j + 0.3) * N) / STICKER.length)); while (k < N - 1 && sparsi[k].some((x) => x.tipo === 'pacco')) k++; sparsi[Math.max(0, k)].push({ tipo: 'sticker', s }) })

  const frag = document.createDocumentFragment()
  frag.append(testa(m, foto.length))
  let kMeme = 0, k = 0
  for (const g of giorni) {
    const delGiorno = perGiorno.get(g)
    if (!delGiorno?.length) continue
    frag.append(giorno(g, giorni.indexOf(g) + 1, giorni.length, tuttiDelGiorno.get(g)))
    for (const i of delGiorno) {
      frag.append(ricordo(i, k))
      for (const mm of vicini.get(i) ?? []) frag.append(meme(mm, kMeme++))
      for (const x of sparsi[k]) {
        if (x.tipo === 'pacco') {
          frag.append(pacco(x.p, n.get(x.p.tag) ?? 0))
          if (!x.p.tag) frag.append(nota('tocca le sigarette: si apre il loro album', 'tav-istruzioni'))
        } else if (x.tipo === 'meme') frag.append(meme(x.mm, kMeme++))
        else frag.append(sticker(x.s))
      }
      k++
    }
  }
  // in fondo: JMA, tutte le foto
  const fine = document.createElement('div')
  fine.className = 'cosa tav-fine'
  fine._lay = { tipo: 'riga', span: 1, u: 0.5, q: 0.5 }
  fine.append(pacco(PACCHI[0], n.get(null) ?? foto.length, true), nota(`e le altre ${foto.length - N}? tutte qui dentro`, 'tav-istruzioni'))
  frag.append(fine)
  el.replaceChildren(frag)
  return fila
}

/** Mette le cose sul tavolo come buttate lì a mano ma senza buchi: colonne uguali (il foglio resta simmetrico), ogni cosa
 *  nella colonna più bassa (le foto orizzontali su due), un po' più stretta della colonna e spostata a caso dentro, il
 *  nastro dei giorni e la testa su tutta la larghezza; gli sticker attaccati sull'angolo della cosa prima. Le misure le
 *  dà il browser (offsetHeight, che non sente le rotazioni); si rifà quando cambia la larghezza o arrivano i caratteri. */
let larghezza = 0
function impagina() {
  if (!el) return
  const cs = getComputedStyle(el)
  const pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0
  const W = el.clientWidth - pl - pr
  if (W <= 0) return
  larghezza = el.clientWidth
  const telefono = innerWidth < 900
  const G = telefono ? 10 : 22, GY = telefono ? 14 : 20
  const N = Math.max(2, Math.min(6, Math.floor((W + G) / ((telefono ? 150 : 172) + G))))
  const C = (W - (N - 1) * G) / N
  const cose = [...el.children].filter((c) => c._lay)
  // 1. le larghezze (prima tutte, poi si leggono le altezze: un layout solo)
  for (const c of cose) {
    const { tipo, span, u, q } = c._lay
    let w
    if (tipo === 'riga') w = W
    else if (tipo === 'foto') { const s = Math.min(span, N); w = (s * C + (s - 1) * G) * (0.84 + 0.16 * q) }
    else if (tipo === 'pacco') w = Math.min(C * (0.6 + 0.14 * q), 150)
    else if (tipo === 'tondo') w = C * (0.82 + 0.12 * q)
    else if (tipo === 'meme') w = C * (0.88 + 0.12 * q)
    else if (tipo === 'nota') w = C * 0.92
    else w = Math.min(C * 0.44, 92) // sticker
    c.style.width = `${w.toFixed(1)}px`
    if (tipo === 'tondo') c.style.height = `${w.toFixed(1)}px`
  }
  // le scritte devono stare nel loro foglio: se una parola sborda di lato, o la frase esce dal sottobicchiere, si
  // rimpicciolisce un po' alla volta (dalla sua grandezza di partenza, così allargando la finestra torna grande)
  for (const c of cose) {
    if (c._lay.tipo !== 'meme' && c._lay.tipo !== 'tondo') continue
    const q = c.querySelector('blockquote')
    let k = q._mk ?? 1
    q.style.setProperty('--mk', String(k))
    for (let n = 0; n < 14 && (q.scrollWidth > q.clientWidth + 1 || (c._lay.tipo === 'tondo' && c.scrollHeight > c.clientHeight + 1)); n++) { k *= 0.92; q.style.setProperty('--mk', k.toFixed(3)) }
  }
  const alte = cose.map((c) => c.offsetHeight)
  // 2. le posizioni
  const col = new Array(N).fill(0)
  let prima = null, pavimento = 0, dopoRiga = false // (pavimento: sotto l'ultimo nastro, dove uno sticker non può salire)
  cose.forEach((c, k) => {
    const { tipo, span, u } = c._lay
    const w = parseFloat(c.style.width), h = alte[k]
    let x, y
    if (tipo === 'sticker') {
      // sull'angolo della cosa prima: in alto a destra o in basso a sinistra
      if (!prima) { c.style.display = 'none'; return }
      const su = u < 0.5
      x = su ? prima.x + prima.w - w * 0.65 : prima.x - w * 0.3
      y = su ? prima.y - h * 0.35 : prima.y + prima.h - h * 0.6
      x = Math.max(-pl * 0.6, Math.min(W - w + pr * 0.6, x))
      y = Math.max(pavimento, y)
      // (lo sticker che pende sotto occupa la sua colonna: chi viene dopo, nastri compresi, sta più giù)
      for (let j = 0; j < N; j++) { const cx = j * (C + G); if (cx < x + w && cx + C > x) col[j] = Math.max(col[j], y + h * 1.18 + 6) }
    } else if (tipo === 'riga') {
      // (aria sopra e sotto: le cose storte e spostate non devono finire sul nastro del giorno)
      y = Math.max(...col) + (!prima ? 0 : dopoRiga ? -GY - 6 : GY + 22) // (due righe di fila: niente aria in più)
      x = 0
      pavimento = y + h + 42 // (il timbro storto sporge sotto il nastro)
      for (let j = 0; j < N; j++) col[j] = y + h + GY + 30
    } else {
      const s = tipo === 'foto' ? Math.min(span, N) : 1
      let j = 0, best = Infinity
      for (let a = 0; a + s <= N; a++) { const top = Math.max(...col.slice(a, a + s)); if (top < best - 0.5) { best = top; j = a } }
      const slot = s * C + (s - 1) * G
      x = j * (C + G) + (slot - w) * u
      y = best
      for (let a = j; a < j + s; a++) col[a] = y + h + GY
    }
    c.style.left = `${(pl + x).toFixed(1)}px`
    c.style.top = `${(pt + y).toFixed(1)}px`
    if (tipo !== 'sticker') { prima = { x, y, w, h }; dopoRiga = tipo === 'riga' }
  })
  el.style.height = `${(pt + Math.max(...col) - GY + pb).toFixed(0)}px`
}

/** Le foto arrivano quando si avvicinano: la «m» (480 px), o la miniatura se la «m» non c'è. */
function carica(voci, oss) {
  for (const v of voci) {
    if (!v.isIntersecting) continue
    const b = v.target
    oss.unobserve(b)
    const f = foto[+b.dataset.i]
    const img = b.querySelector('img')
    const r = b.getBoundingClientRect()
    const priorita = r.bottom > 0 && r.top < innerHeight ? 0 : 1
    ;(f.m ? prendi('m', f.m, { priorita }) : miniatura(f, { priorita }))
      .catch((e) => { if (e?.name === 'UscitaError') throw e; return miniatura(f, { priorita }) })
      .then((u) => { b._url = u; img.src = u })
      .catch(() => {})
  }
}

let manifesto, vicino, linea

/** Mette giù il tavolo (le foto a caso, le storture a caso) e lo guarda: foto che si avvicinano, foto a un terzo. */
function monta() {
  for (const b of el.querySelectorAll('.ricordo')) { vicino.unobserve(b); linea.unobserve(b); if (b._url) { libera(b._url); b._url = null } }
  rnd = caso((Math.random() * 2 ** 31) | 0)
  ordine = disponi(manifesto)
  impagina()
  for (const b of el.querySelectorAll('.ricordo')) { vicino.observe(b); linea.observe(b) }
}

export function avvia(m) {
  el = document.getElementById('tavolo')
  if (!el) return
  manifesto = m
  foto = m.foto
  posti = new Map(m.posti.map((p) => [p.id, p]))
  usaTavolo(() => ordine.map((i) => foto[i]))
  vicino = new IntersectionObserver(carica, { rootMargin: VICINO })
  // la foto che passa a un terzo dello schermo → la GLA sulla mappa
  linea = new IntersectionObserver((voci) => {
    for (const v of voci) if (v.isIntersecting) { const i = +v.target.dataset.i; evento('foto', { i, id: foto[i].id }) }
  }, { rootMargin: '-33% 0px -62% 0px' })
  monta()
  document.fonts?.ready.then(impagina)
  let attesa = 0
  addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(() => { if (el.clientWidth !== larghezza && el.clientWidth) impagina() }, 120) }, { passive: true })
  // (il tavolo nascosto alla macchinetta ha larghezza zero: si rifà quando si torna dentro)
  new ResizeObserver(() => { if (el.clientWidth && el.clientWidth !== larghezza) impagina() }).observe(el)
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-azione="mischen"]')) { monta(); return }
    const p = e.target.closest('.tav-pacco')
    if (p) { evento('pacco', { tag: p.dataset.tag === 'alles' ? null : p.dataset.tag }); return }
    const r = e.target.closest('.ricordo')
    if (r) evento('apri', { id: r.dataset.id })
  })
}
