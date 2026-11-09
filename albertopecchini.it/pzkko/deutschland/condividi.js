// La scelta multipla e «salva tutte» di Deutschland (9.11.2026, «Deutschland 2»). Alberto: «fallo semplice per scaricarle
// su iPhone e pc», «no file e no zip». Tocco lungo (400 ms) su una stampa, o il cartello AUSWAHL della barra
// («deutschland:scegli») → modalità scelta: le stampe si spuntano (.scelta, spunta grande gialla), in basso la barra grande
// #scelte «7 FOTO · SALVA TUTTE · ANNULLA». Gli originali li dà rete.js (originale(): su un tocco, mai da soli).
//   iPhone (Web Share): il gesto fresco di Safari vuole navigator.share dentro un tocco appena fatto, non dopo cinque secondi
//     di download: quindi DUE tocchi chiari. «SALVA TUTTE» scarica il primo gruppo (≤ 25 file o 250 MB) con l'avanzamento
//     dentro la barra, poi il tasto diventa «TOCCA PER SALVARE (1/2)» e il tocco chiama SUBITO navigator.share({files}):
//     il foglio di iOS, «Salva n immagini» → in Foto. Poi il gruppo dopo, finché finiscono.
//   pc (o niente Web Share): una dopo l'altra, <a download> da blob: col nome vero (IMG_5506.JPG) appena ognuna è scaricata.
// MAI uno zip, MAI un file scritto sul server. Dopo si libera tutto (revokeObjectURL, via i File).
// Il visore usa PC, scaricaFile e condividiFile per la foto singola. SPEICHERN della barra («deutschland:speichern») salva
// le scelte, o se non ce ne sono apre la scelta con l'invito «tocca le foto da salvare».

import { evento, ascolta, peso } from './comune.js'
import { originale } from './rete.js'

/** Sul computer (mouse, o niente Web Share coi file) si scarica; sul telefono si condivide nel rullino. */
export const PC = matchMedia('(hover:hover) and (pointer:fine)').matches || typeof navigator.canShare !== 'function'
const PRESSIONE = 400, MAX_FILE = 25, MAX_BYTE = 250e6, SOGLIA_MOVIMENTO = 10

let pagine, barra, nEl, statoEl, tasto, annulla, foto = new Map(), scelti = new Set(), attiva = false, abort = null
let gruppi = [], gruppoK = 0, pronto = null, timer = 0, ignoraClick = 0

export const inScelta = () => attiva

/** Scarica un File col link download (il pc): blob: col nome vero, liberato dopo dieci secondi. */
export function scaricaFile(file) {
  const u = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = u; a.download = file.name; a.rel = 'noopener'
  document.body.append(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 10000)
}

/** Condivide dei File (Web Share, dentro un tocco). Torna true se è finita, false se chi guarda ha chiuso il foglio (si può
 *  riprovare); se il browser non può condividere file, li scarica. */
export async function condividiFile(files) {
  if (!PC && navigator.canShare?.({ files })) {
    try { await navigator.share({ files, title: 'Deutschland' }); return true }
    catch (e) { if (e?.name === 'AbortError') return false; console.warn('deutschland: share non riuscito, scarico', e?.message ?? e) }
  }
  files.forEach((f, k) => setTimeout(() => scaricaFile(f), k * 300))
  return true
}

const stampaDi = (id) => pagine.querySelector(`.stampa[data-id="${CSS.escape(id)}"]`)

function aggiorna(messaggio) {
  const n = scelti.size
  let tot = 0
  for (const id of scelti) tot += +foto.get(id)?.peso || 0
  nEl.textContent = `${n} ${n === 1 ? 'Foto' : 'Fotos'}`
  if (pronto) {
    tasto.textContent = gruppi.length > 1 ? `Tocca per salvare ${gruppoK + 1}/${gruppi.length}` : 'Tocca per salvare'
    tasto.classList.add('pronto'); tasto.disabled = false
    statoEl.textContent = `${pronto.length} file · ${peso(pronto.reduce((s, f) => s + f.size, 0))} pronti`
  } else {
    tasto.textContent = PC ? 'Scarica tutte' : 'Salva tutte'
    tasto.classList.remove('pronto')
    tasto.disabled = n === 0 || !!abort
    if (messaggio != null) statoEl.textContent = messaggio
    else if (!abort) statoEl.textContent = n ? peso(tot) : 'tocca le foto da salvare'
  }
}

function entra(messaggio) {
  if (attiva) { if (messaggio) aggiorna(messaggio); return }
  attiva = true
  pagine.classList.add('in-scelta')
  barra.hidden = false
  aggiorna(messaggio)
  evento('scelta', { ids: [...scelti], attiva: true })
}

function esci() {
  abort?.abort(); abort = null
  gruppi = []; gruppoK = 0; pronto = null
  for (const id of scelti) stampaDi(id)?.classList.remove('scelta')
  scelti.clear()
  attiva = false
  pagine.classList.remove('in-scelta')
  barra.hidden = true
  evento('scelta', { ids: [], attiva: false })
}

function commuta(id) {
  if (!foto.has(id)) return
  const b = stampaDi(id)
  if (scelti.has(id)) { scelti.delete(id); b?.classList.remove('scelta') }
  else { scelti.add(id); b?.classList.add('scelta') }
  b?.setAttribute('aria-pressed', String(scelti.has(id)))
  abort?.abort(); abort = null; gruppi = []; gruppoK = 0; pronto = null // la scelta è cambiata: si riprepara
  aggiorna()
  evento('scelta', { ids: [...scelti], attiva })
}

/** Le foto scelte a gruppi (≤ 25 file o 250 MB), nell'ordine dell'album. */
function aGruppi() {
  const lista = [...scelti].map((id) => foto.get(id)).sort((a, b) => (a.t ?? '').localeCompare(b.t ?? ''))
  const out = []
  let g = [], byte = 0
  for (const f of lista) {
    const p = +f.peso || 0
    if (g.length && (g.length >= MAX_FILE || byte + p > MAX_BYTE)) { out.push(g); g = []; byte = 0 }
    g.push(f); byte += p
  }
  if (g.length) out.push(g)
  return out
}

/** Scarica un gruppo di foto (originali o video) con l'avanzamento nella barra; torna i File. */
async function scaricaGruppo(gruppo, segnale, k, n) {
  const files = []
  const totale = gruppo.reduce((s, f) => s + (+f.peso || 0), 0)
  let fatti = 0
  for (const [j, f] of gruppo.entries()) {
    const base = fatti
    const testo = (letti) => { statoEl.textContent = `${n > 1 ? `gruppo ${k + 1}/${n} · ` : ''}${j + 1}/${gruppo.length} · ${peso(base + letti)}${totale ? ` di ${peso(totale)}` : ''}` }
    testo(0)
    const file = await originale(f, { signal: segnale, onProgress: (letti) => testo(letti) })
    files.push(file)
    fatti = base + file.size
    if (PC) scaricaFile(file) // (sul pc ognuna parte appena è giù: niente attesa a vuoto)
  }
  return files
}

async function salva() {
  // il secondo tocco: il gruppo pronto si condivide SUBITO (gesto fresco)
  if (pronto) {
    const files = pronto
    tasto.disabled = true
    const finita = await condividiFile(files)
    tasto.disabled = false
    if (!finita) return // (foglio chiuso: si può ritoccare)
    gruppoK++
    pronto = null
    if (gruppoK >= gruppi.length) { statoEl.textContent = 'fatto'; esci(); return }
    return prepara()
  }
  gruppi = aGruppi(); gruppoK = 0
  if (!gruppi.length) return
  return prepara()
}

/** Scarica il gruppo corrente: sul pc le fa partire una a una e finisce; sul telefono poi aspetta il tocco per condividere. */
async function prepara() {
  const gruppo = gruppi[gruppoK]
  if (!gruppo) { esci(); return }
  abort = new AbortController()
  const mio = abort
  tasto.textContent = 'Scarico…'
  aggiorna()
  tasto.textContent = 'Scarico…'
  let files
  try { files = await scaricaGruppo(gruppo, mio.signal, gruppoK, gruppi.length) }
  catch (e) {
    if (mio.signal.aborted) return
    console.warn('deutschland: non riesco a scaricare', e?.message ?? e)
    abort = null
    aggiorna('il server non risponde: riprova')
    return
  }
  if (abort !== mio) return
  abort = null
  if (PC) {
    gruppoK++
    if (gruppoK >= gruppi.length) { statoEl.textContent = `${files.length} file scaricati`; setTimeout(esci, 900); return }
    return prepara()
  }
  pronto = files
  aggiorna()
}

export function avvia(manifesto) {
  pagine = document.getElementById('pagine'); barra = document.getElementById('scelte')
  if (!pagine || !barra) return
  foto = new Map(manifesto.foto.map((f) => [f.id, f]))
  barra.innerHTML = '<span class="s-conta"><b class="s-n"></b><small class="s-stato"></small></span><button type="button" class="segnale segnale-gelb s-tasto">Salva tutte</button><button type="button" class="segnale s-annulla">Annulla</button>'
  nEl = barra.querySelector('.s-n'); statoEl = barra.querySelector('.s-stato'); tasto = barra.querySelector('.s-tasto'); annulla = barra.querySelector('.s-annulla')
  tasto.addEventListener('click', salva)
  annulla.addEventListener('click', esci)

  // la pressione lunga su una stampa: parte il conto alla rovescia, lo ferma un movimento (stai scorrendo), il dito che si
  // alza o lo scroll
  pagine.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.stampa')
    if (!c || e.button) return
    const x = e.clientX, y = e.clientY
    clearTimeout(timer)
    const via = (ev) => {
      if (ev.type === 'pointermove' && Math.hypot(ev.clientX - x, ev.clientY - y) < SOGLIA_MOVIMENTO) return
      clearTimeout(timer); timer = 0
      for (const t of ['pointermove', 'pointerup', 'pointercancel']) pagine.removeEventListener(t, via)
      removeEventListener('scroll', via)
    }
    for (const t of ['pointermove', 'pointerup', 'pointercancel']) pagine.addEventListener(t, via)
    addEventListener('scroll', via, { passive: true })
    timer = setTimeout(() => {
      timer = 0
      via({ type: 'fine' })
      ignoraClick = Date.now()
      navigator.vibrate?.(15)
      entra()
      commuta(c.dataset.id)
    }, PRESSIONE)
  })
  // niente menu del browser sulle stampe tenute premute
  pagine.addEventListener('contextmenu', (e) => { if (e.target.closest('.stampa')) e.preventDefault() })
  // in modalità scelta il click sceglie, e non arriva all'album (che aprirebbe il visore); il click che segue la
  // pressione lunga si butta via
  pagine.addEventListener('click', (e) => {
    const c = e.target.closest('.stampa')
    if (!c) return
    if (ignoraClick && Date.now() - ignoraClick < 600) { ignoraClick = 0; e.stopPropagation(); e.preventDefault(); return }
    if (!attiva) return
    e.stopPropagation(); e.preventDefault()
    commuta(c.dataset.id)
  }, true)

  ascolta('scegli', () => (attiva ? esci() : entra()))
  ascolta('speichern', () => { if (attiva && scelti.size && !abort) salva(); else entra('tocca le foto da salvare, poi «salva tutte»') })
  // cambia il filtro: le stampe scelte possono sparire dall'album; la scelta resta (si salva lo stesso)
}
