// L'album di Deutschland (9.11.2026, «Deutschland 2»; prima era griglia.js, 4×5 celle). Alberto: «fai l'elenco fotografico
// in un album vero», «le foto restino nel loro ratio». Dalla notte («Deutschland 3») l'album non sta più nella pagina: sta
// DENTRO la sovrapposizione #packung (packung.js), che si apre da un pacchetto del tavolo (tutte le foto di quel tag; JMA =
// tutte) o da un timbro della mappa (le foto di quel posto), e scorre per conto suo (#pk-scorre). #pagine è l'album: un
// CAPITOLO per giorno («TAG 1 · Freitag 6. November · casa → München», il cartello giallo delle Ortsschilder tedesche, con
// sotto le tappe della giornata e uno sticker), e dentro le RIGHE GIUSTIFICATE: l'algoritmo delle righe ad altezza obiettivo
// (190 px sul computer, 140 sul telefono) coi w/h veri del manifesto, ogni stampa tiene il suo ratio, l'ultima riga del
// capitolo non si stira. Ogni stampa: bordo bianco, ombra, l'ora in un angolo, triangolo e durata sui video; il `blur` del
// manifesto come fondo finché la miniatura arriva.
// Le miniature passano TUTTE da rete.js (miniatura → blob URL, priorità 0 a schermo, 1 vicino): le chiede un
// IntersectionObserver (radice #pk-scorre) con 700 px di margine e, quando una stampa esce da quel margine (o l'album si
// chiude), il blob si libera. Lo scorrimento dell'album muove la mappa senza rAF continuo: a ogni scroll (passivo) UN
// requestAnimationFrame, che trova la riga a un terzo dell'album (ricerca binaria) e dice «deutschland:foto» {i,id}.
// «deutschland:filtro» {tag,posto} RIFÀ la disposizione; «deutschland:vai» {id} (un timbro, una tappa) porta alla prima foto
// di quel posto, se l'album è aperto. Il click su una stampa → «deutschland:apri» {id} (visore.js); la pressione lunga la
// gestisce condividi.js sopra di noi (cattura). `lista()` è quello che il visore scorre: le foto dell'album se è aperto,
// se no quelle del tavolo (usaTavolo).

import { evento, ascolta } from './comune.js'
import { miniatura, libera } from './rete.js'

const MARGINE = '700px 0px' // quanto prima dello schermo si chiedono le miniature (e oltre il quale si liberano)
const GIORNI = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MESI = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const CITTA = { Mantua: 'Mantova', Munich: 'München' }
const STICKER = ['ampelmann', 'currywurst', 'ubahn', 'autobahn', 'mass', 'brezel', 'targa', 'jma'] // art/deutschland/sticker/<nome>.webp

let el, scorre, foto = [], posti = new Map(), stampe = [], visibili = [], righe = [], corrente = -1, raf = 0, evidenza = 0, larghezza = 0, osservatore
let aperta = false, daTavolo = () => []

/** Le foto che il visore scorre: quelle dell'album se è aperto, se no quelle del tavolo. */
export const lista = () => (aperta ? visibili.map((i) => foto[i]) : daTavolo())
/** Il tavolo dice quali sono le sue foto (tavolo.js). */
export const usaTavolo = (f) => { daTavolo = f }

const durata = (s) => { s = Math.round(+s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const telefono = () => innerWidth < 900
/** Le misure dell'album: altezza obiettivo, spazio fra le stampe, bordo bianco. */
const misure = () => (telefono() ? { H: 140, gap: 6, bordo: 3 } : { H: 190, gap: 10, bordo: 4 })
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches

/** La città di un posto, dall'ultimo pezzo del nome lungo («Landsberger Straße, Laim, München» → München). */
export function citta(p) {
  if (!p) return ''
  const pezzi = String(p.nomeAuto || p.nome || '').split(',').map((s) => s.trim()).filter(Boolean)
  const c = pezzi.at(-1) ?? ''
  return CITTA[c] ?? c
}

/** «Freitag 6. November» da «2026-11-06» (la usano anche il visore e il tavolo). */
export function dataTedesca(giorno) {
  const d = new Date(`${giorno}T12:00:00`)
  if (Number.isNaN(+d)) return giorno
  return `${GIORNI[d.getDay()]} ${d.getDate()}. ${MESI[d.getMonth()]}`
}

/** Da dove a dove è andata una giornata («casa → München»): la prima e l'ultima foto CON un posto; il primo giorno parte
 *  da «casa» se la prima tappa è in Italia (a sud delle Alpi), l'ultimo finisce a «casa». k = 1… il giorno del viaggio. */
export function doveDelGiorno(indici, k, giorni, tutte = foto, perId = posti) {
  const conPosto = indici.filter((i) => tutte[i].posto)
  const primo = perId.get(tutte[conPosto[0] ?? indici[0]]?.posto), ultimo = perId.get(tutte[conPosto.at(-1) ?? indici.at(-1)]?.posto)
  const italia = (p) => p && Number.isFinite(+p.lat) && +p.lat < 46.6
  const c1 = k === 1 && italia(primo) ? 'casa' : citta(primo), c2 = k === giorni ? 'casa' : citta(ultimo)
  return c1 && c2 && c1 !== c2 ? `${c1} → ${c2}` : c1 || c2 || ''
}

// ── le stampe ──
function stampa(f, i) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'stampa' + (f.tipo === 'video' ? ' video' : '')
  b.dataset.id = f.id
  b.dataset.i = i
  b.setAttribute('role', 'listitem')
  const posto = posti.get(f.posto)
  b.setAttribute('aria-label', `${f.tipo === 'video' ? 'video' : 'foto'} delle ${f.ora ?? '?'}${f.tStimato ? ' circa' : ''}${posto ? ` · ${posto.nome}` : ''}${f.didascalia ? ` · ${f.didascalia}` : ''}`)
  const quadro = document.createElement('span')
  quadro.className = 'st-foto'
  quadro.style.backgroundColor = f.col || '#2a2a2a'
  if (f.blur) quadro.style.backgroundImage = `url("${f.blur}")`
  const img = document.createElement('img')
  img.alt = ''
  img.decoding = 'async'
  img.draggable = false
  img.onload = () => b.classList.add('carica')
  img.onerror = () => { if (img.getAttribute('src')) b.classList.add('rotta') }
  quadro.append(img)
  b.append(quadro)
  if (f.tStimato) { const s = document.createElement('i'); s.className = 'st-stima'; s.title = 'ora stimata'; b.append(s) }
  if (f.tipo === 'video') { const p = document.createElement('span'); p.className = 'st-play'; p.textContent = durata(f.durata); b.append(p) }
  const ora = document.createElement('span'); ora.className = 'st-ora'; ora.textContent = f.ora ?? ''; b.append(ora)
  const spunta = document.createElement('span'); spunta.className = 'st-spunta'; spunta.setAttribute('aria-hidden', 'true'); b.append(spunta)
  return b
}

/** La miniatura arriva (rete.js) quando la stampa è vicina allo schermo; se ne va quando è lontana o l'album è chiuso. */
function osserva(voci) {
  for (const v of voci) {
    const b = v.target, i = +b.dataset.i
    if (v.isIntersecting && aperta) {
      if (b._url || b._ctrl) continue
      const ctrl = new AbortController()
      b._ctrl = ctrl
      const r = b.getBoundingClientRect()
      const aSchermo = r.bottom > 0 && r.top < innerHeight
      miniatura(foto[i], { priorita: aSchermo ? 0 : 1, signal: ctrl.signal })
        .then((url) => { if (ctrl.signal.aborted) { libera(url); return } b._url = url; b.querySelector('img').src = url })
        .catch((e) => { if (e?.name !== 'AbortError' && e?.name !== 'UscitaError') b.classList.add('rotta') })
        .finally(() => { if (b._ctrl === ctrl) b._ctrl = null })
    } else if (!v.isIntersecting && (b._ctrl || b._url)) {
      b._ctrl?.abort(); b._ctrl = null
      const img = b.querySelector('img')
      img.removeAttribute('src')
      b.classList.remove('carica')
      if (b._url) { libera(b._url); b._url = null }
    }
  }
}

// ── i capitoli e le righe giustificate ──
function intestazione(giorno, n, indici, k, giorni) {
  const h = document.createElement('header')
  h.className = 'cap-testa'
  const dove = doveDelGiorno(indici, k, giorni)
  const schild = document.createElement('h2')
  schild.className = 'ortsschild'
  schild.innerHTML = `<span class="cap-tag">Tag ${k}</span><span class="cap-data">${dataTedesca(giorno)}</span>${dove ? `<span class="cap-dove">${dove}</span>` : ''}`
  h.append(schild)
  // le tappe della giornata, nell'ordine, con quante foto; un tocco porta alla prima foto di lì
  const tappe = [], conta = new Map()
  for (const i of indici) { const p = foto[i].posto; if (!p) continue; if (!conta.has(p)) tappe.push(p); conta.set(p, (conta.get(p) ?? 0) + 1) }
  if (tappe.length > 1) {
    const riga = document.createElement('p'); riga.className = 'cap-tappe'
    for (const id of tappe) {
      const p = posti.get(id); if (!p) continue
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cap-tappa'; b.dataset.posto = id
      b.innerHTML = `${p.nome || p.nomeAuto || id} <small>${conta.get(id)}</small>`
      riga.append(b)
    }
    h.append(riga)
  }
  const n2 = document.createElement('p'); n2.className = 'cap-conta'; n2.textContent = `${n} ${n === 1 ? 'Erinnerung' : 'Erinnerungen'}`
  h.append(n2)
  // uno sticker street: se il file non c'è, sparisce (mai un'immagine rotta)
  const st = document.createElement('img'); st.className = 'cap-sticker'; st.alt = ''; st.decoding = 'async'; st.loading = 'lazy'
  st.src = `/art/deutschland/sticker/${STICKER[(k - 1) % STICKER.length]}.webp`
  st.onerror = () => { st.hidden = true }
  h.append(st)
  return h
}

/** Dispone le foto visibili in capitoli e righe giustificate, larghe quanto #pagine. */
function disponi() {
  if (!el) return
  larghezza = el.clientWidth
  if (!larghezza) return
  const { H, gap, bordo } = misure()
  const perGiorno = new Map()
  for (const i of visibili) { const g = foto[i].giorno || '?'; if (!perGiorno.has(g)) perGiorno.set(g, []); perGiorno.get(g).push(i) }
  const frag = document.createDocumentFragment()
  righe = []
  const giorniTutti = [...new Set(foto.map((f) => f.giorno || '?'))].sort()
  for (const [giorno, indici] of perGiorno) {
    const cap = document.createElement('section')
    cap.className = 'capitolo'
    cap.dataset.giorno = giorno
    cap.append(intestazione(giorno, indici.length, indici, giorniTutti.indexOf(giorno) + 1, giorniTutti.length))
    // le righe: si accumulano foto finché, all'altezza obiettivo, riempiono la larghezza; poi si scala l'altezza
    let riga = [], somma = 0
    const chiudi = (ultima) => {
      if (!riga.length) return
      const n = riga.length
      const libero = larghezza - (n - 1) * gap - n * 2 * bordo
      const h = ultima ? Math.min(H, libero / somma) : libero / somma
      const r = document.createElement('div'); r.className = 'riga'; r.style.setProperty('--h', `${h.toFixed(2)}px`)
      for (const i of riga) {
        const f = foto[i], b = stampe[i]
        const w = (h * f.w) / f.h
        b.style.width = `${w.toFixed(2)}px`
        b.style.height = `${h.toFixed(2)}px`
        r.append(b)
      }
      righe.push({ el: r, primo: riga[0], top: 0 })
      cap.append(r)
      riga = []; somma = 0
    }
    for (const i of indici) {
      const f = foto[i]
      riga.push(i); somma += (f.w || 3) / (f.h || 4)
      if (somma * H >= larghezza - (riga.length - 1) * gap - riga.length * 2 * bordo) chiudi(false)
    }
    chiudi(true)
    frag.append(cap)
  }
  el.replaceChildren(frag)
  misuraRighe()
}

/** Dove sta ogni riga dentro l'album che scorre (per lo scroll → la foto corrente). */
function misuraRighe() {
  if (!scorre) return
  const base = scorre.scrollTop - scorre.getBoundingClientRect().top
  for (const r of righe) r.top = r.el.getBoundingClientRect().top + base
}

/** La riga a un terzo dell'album → la foto corrente → la mappa. */
function aggiorna() {
  raf = 0
  if (!righe.length || !aperta) return
  const y = scorre.scrollTop + scorre.clientHeight / 3
  let lo = 0, hi = righe.length - 1, k = 0
  while (lo <= hi) { const m = (lo + hi) >> 1; if (righe[m].top <= y) { k = m; lo = m + 1 } else hi = m - 1 }
  const i = righe[k].primo
  if (i !== corrente) { corrente = i; evento('foto', { i, id: foto[i].id }) }
}

function applica({ tag = null, posto = null } = {}) {
  visibili = []
  foto.forEach((f, i) => { if ((!tag || (f.tag ?? []).includes(tag)) && (!posto || f.posto === posto)) visibili.push(i) })
  if (scorre) scorre.scrollTop = 0
  disponi()
  corrente = -1
  evento('conta', { n: visibili.length, totale: foto.length })
  if (!raf) raf = requestAnimationFrame(aggiorna)
}

/** Porta alla prima foto di un posto (da una tappa di un capitolo, o dalla mappa con l'album aperto). */
function vai({ id, da }) {
  if (!aperta) return
  let k = visibili.find((i) => foto[i].posto === id && (!da || foto[i].giorno === da))
  if (k == null) k = visibili.find((i) => foto[i].posto === id)
  if (k == null) return
  const b = stampe[k]
  const y = b.getBoundingClientRect().top - scorre.getBoundingClientRect().top + scorre.scrollTop - 16
  scorre.scrollTo({ top: Math.max(0, y), behavior: fermo() ? 'instant' : 'smooth' })
  b.classList.add('evidenzia')
  clearTimeout(evidenza)
  evidenza = setTimeout(() => b.classList.remove('evidenzia'), 1400)
}

export function avvia(manifesto) {
  el = document.getElementById('pagine')
  scorre = document.getElementById('pk-scorre')
  if (!el || !scorre) return
  foto = manifesto.foto
  posti = new Map(manifesto.posti.map((p) => [p.id, p]))
  stampe = foto.map((f, i) => stampa(f, i))
  osservatore = new IntersectionObserver(osserva, { root: scorre, rootMargin: MARGINE, threshold: 0 })
  for (const b of stampe) osservatore.observe(b)
  scorre.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(aggiorna) }, { passive: true })
  // la finestra che cambia misura (telefono girato): le righe si rifanno solo se la larghezza è cambiata
  let attesa = 0
  addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(() => { if (!aperta) return; if (el.clientWidth !== larghezza) { disponi(); if (!raf) raf = requestAnimationFrame(aggiorna) } else misuraRighe() }, 120) }, { passive: true })
  el.addEventListener('click', (e) => {
    const t = e.target.closest('.cap-tappa')
    if (t) { vai({ id: t.dataset.posto, da: t.closest('.capitolo')?.dataset.giorno }); return }
    const b = e.target.closest('.stampa')
    if (b) evento('apri', { id: b.dataset.id })
  })
  // l'album si apre (packung.js lo scopre PRIMA di mandare il filtro, così le righe hanno la larghezza) o si chiude (via le
  // stampe dalla pagina: l'osservatore libera i blob)
  ascolta('packung', ({ aperta: a }) => {
    aperta = !!a
    if (!aperta) { visibili = []; righe = []; el.replaceChildren() }
  })
  ascolta('filtro', applica)
  ascolta('vai', vai)
  // le immagini dei capitoli (sticker) e i caratteri che arrivano spostano le righe: si rimisurano
  document.fonts?.ready.then(misuraRighe)
}
