// La scelta e «salva sul rullino» di Deutschland (9.11.2026). Alberto: «salva sul rullino diretto», «no file e no zip».
// Pressione lunga (400 ms) su una cella, o il tasto «scegli» dello scontrino (filtri.js → «deutschland:scegli») → modalità
// scelta: le celle si spuntano (.scelta), in basso la barra #scelte «n scelte · prepara · annulla». DUE passi, per via del
// gesto fresco di Safari iOS (navigator.share vuole un tocco appena fatto, non uno di cinque secondi fa dopo un download):
//   1. «prepara» scarica in memoria gli originali (o, o il mp4 v per i video) con fetch, mostrando l'avanzamento, e ne fa
//      dei File col nome vero (IMG_5506.JPG; per i video il nome del mp4). Tetto: 25 file o 250 MB, oltre un avviso.
//   2. il tasto diventa «salva sul rullino» e il clic chiama SUBITO navigator.share({files}) (prima canShare): su iPhone si
//      apre il foglio di condivisione e «Salva n immagini» le mette in Foto. Ripiego (computer, Firefox): <a download>
//      da blob:, cliccati in fila a 300 ms. MAI uno zip, MAI un file scritto sul server. Dopo si libera tutto
//      (revokeObjectURL, via i File).
// Il visore usa salvaUno(f, bottone) per la foto singola, con gli stessi due passi.

import { indirizzo, evento, ascolta, peso } from './comune.js'

const PRESSIONE = 400, MAX_FILE = 25, MAX_BYTE = 250e6, SOGLIA_MOVIMENTO = 10
let griglia, barra, nEl, statoEl, tasto, foto = new Map(), scelti = new Set(), attiva = false, pronti = null, abort = null
let timer = 0, ignoraClick = 0

export const inScelta = () => attiva

/** Il file da salvare per una foto: indirizzo, nome e tipo. */
function fileDi(f) {
  if (f.tipo === 'video') return { url: indirizzo('v', f.v), nome: (f.nome || f.id).replace(/\.[^.]+$/, '') + '.mp4', tipo: 'video/mp4' }
  const nome = f.nome || `${f.id}.jpg`
  return { url: indirizzo('o', f.o), nome, tipo: /\.png$/i.test(nome) ? 'image/png' : 'image/jpeg' }
}

/** Scarica un file in memoria (con l'avanzamento in byte) e ne fa un File col nome vero. */
async function scarica(f, segnale, avanza) {
  const { url, nome, tipo } = fileDi(f)
  const r = await fetch(url, { signal: segnale, credentials: 'omit' })
  if (!r.ok) throw new Error(`${nome}: ${r.status}`)
  const parti = []
  let letti = 0
  if (r.body) {
    const lettore = r.body.getReader()
    for (;;) { const { done, value } = await lettore.read(); if (done) break; parti.push(value); letti += value.length; avanza?.(letti) }
  } else { const b = await r.arrayBuffer(); parti.push(b); letti = b.byteLength; avanza?.(letti) }
  return new File(parti, nome, { type: r.headers.get('content-type')?.split(';')[0] || tipo })
}

/** Il ripiego senza Web Share: un <a download> da blob: per file, in fila a 300 ms. */
function scaricaTutti(files) {
  files.forEach((file, k) => setTimeout(() => {
    const u = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = u; a.download = file.name; a.rel = 'noopener'
    document.body.append(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(u), 10000)
  }, k * 300))
}

/** Condivide (o scarica). Torna true se è finita, false se chi guarda ha annullato il foglio (si può riprovare). */
async function consegna(files) {
  if (navigator.canShare?.({ files })) {
    try { await navigator.share({ files, title: 'Deutschland' }); return true }
    catch (e) { if (e?.name === 'AbortError') return false; console.warn('deutschland: share non riuscito, scarico', e?.message ?? e) }
  }
  scaricaTutti(files)
  return true
}

function cellaDi(id) { return griglia.querySelector(`.cella[data-id="${CSS.escape(id)}"]`) }

function aggiorna() {
  const n = scelti.size
  let tot = 0
  for (const id of scelti) tot += +foto.get(id)?.peso || 0
  nEl.textContent = `${n} ${n === 1 ? 'scelta' : 'scelte'}`
  if (pronti) { tasto.textContent = 'salva sul rullino'; tasto.classList.add('pronto'); tasto.disabled = false; statoEl.textContent = `${pronti.length} file · ${peso(pronti.reduce((s, f) => s + f.size, 0))}` }
  else { tasto.textContent = 'prepara'; tasto.classList.remove('pronto'); tasto.disabled = n === 0 || !!abort; if (!abort) statoEl.textContent = n ? peso(tot) : '' }
}

function entra() {
  if (attiva) return
  attiva = true
  griglia.classList.add('in-scelta')
  barra.hidden = false
  aggiorna()
}

function esci() {
  abort?.abort(); abort = null
  pronti = null
  for (const id of scelti) cellaDi(id)?.classList.remove('scelta')
  scelti.clear()
  attiva = false
  griglia.classList.remove('in-scelta')
  barra.hidden = true
  evento('scelta', { ids: [] })
}

function commuta(id) {
  if (!foto.has(id)) return
  if (scelti.has(id)) { scelti.delete(id); cellaDi(id)?.classList.remove('scelta') }
  else { scelti.add(id); cellaDi(id)?.classList.add('scelta') }
  abort?.abort(); abort = null; pronti = null // la scelta è cambiata: si riprepara
  aggiorna()
  evento('scelta', { ids: [...scelti] })
}

async function prepara() {
  const lista = [...scelti].map((id) => foto.get(id))
  const tot = lista.reduce((s, f) => s + (+f.peso || 0), 0)
  if (lista.length > MAX_FILE || tot > MAX_BYTE) { statoEl.textContent = `troppe: al massimo ${MAX_FILE} file o ${peso(MAX_BYTE)} per volta`; return }
  abort = new AbortController()
  const mio = abort
  aggiorna()
  const files = []
  let fatti = 0
  try {
    for (const [k, f] of lista.entries()) {
      statoEl.textContent = `${k + 1} / ${lista.length} · ${peso(fatti)}`
      const base = fatti
      files.push(await scarica(f, mio.signal, (letti) => { fatti = base + letti; statoEl.textContent = `${k + 1} / ${lista.length} · ${peso(fatti)}` }))
      fatti = base + files.at(-1).size
    }
  } catch (e) {
    if (mio.signal.aborted) return
    console.warn('deutschland: non riesco a preparare i file', e?.message ?? e)
    abort = null
    statoEl.textContent = 'il server non risponde: riprova'
    aggiorna()
    return
  }
  if (abort !== mio) return
  abort = null
  pronti = files
  aggiorna()
}

async function salva() {
  const files = pronti
  if (!files) return
  tasto.disabled = true
  const finita = await consegna(files)
  tasto.disabled = false
  if (finita) esci()
}

/** Il tasto «salva» del visore, con gli stessi due passi: scarica → «salva sul rullino» → share (o download diretto). */
export async function salvaUno(f, b) {
  if (b.dataset.stato === 'scarico') return
  if (b.dataset.stato === 'pronto' && b._file) {
    b.disabled = true
    const finita = await consegna([b._file])
    b.disabled = false
    if (finita) azzera(b)
    return
  }
  b.dataset.stato = 'scarico'
  b.textContent = 'scarico…'
  const ctrl = new AbortController()
  b._abort = ctrl
  try {
    const file = await scarica(f, ctrl.signal, (letti) => { b.textContent = f.peso ? `${Math.min(99, Math.round((letti / f.peso) * 100))}%` : peso(letti) })
    if (ctrl.signal.aborted) return
    if (navigator.canShare?.({ files: [file] })) { b._file = file; b.dataset.stato = 'pronto'; b.textContent = 'salva sul rullino' }
    else { scaricaTutti([file]); azzera(b) }
  } catch (e) {
    if (ctrl.signal.aborted) return
    console.warn('deutschland: non riesco a scaricare', e?.message ?? e)
    b.textContent = 'riprova'
    delete b.dataset.stato
  }
}

/** Riporta un tasto «salva» allo stato di partenza (cambiata foto, o finito). */
export function azzera(b) {
  b._abort?.abort(); b._abort = null; b._file = null
  delete b.dataset.stato
  b.textContent = 'salva'
  b.disabled = false
}

export function avvia(manifesto) {
  griglia = document.getElementById('griglia'); barra = document.getElementById('scelte')
  if (!griglia || !barra) return
  foto = new Map(manifesto.foto.map((f) => [f.id, f]))
  barra.innerHTML = '<span class="s-n"></span><span class="s-stato"></span><button type="button" class="s-tasto">prepara</button><button type="button" class="s-annulla">annulla</button>'
  nEl = barra.querySelector('.s-n'); statoEl = barra.querySelector('.s-stato'); tasto = barra.querySelector('.s-tasto')
  tasto.addEventListener('click', () => (pronti ? salva() : prepara()))
  barra.querySelector('.s-annulla').addEventListener('click', esci)

  // la pressione lunga su una cella: parte il conto alla rovescia, lo ferma un movimento (stai scorrendo), il dito che si
  // alza o lo scroll
  griglia.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.cella')
    if (!c || e.button) return
    const x = e.clientX, y = e.clientY
    clearTimeout(timer)
    const via = (ev) => {
      if (ev.type === 'pointermove' && Math.hypot(ev.clientX - x, ev.clientY - y) < SOGLIA_MOVIMENTO) return
      clearTimeout(timer); timer = 0
      for (const t of ['pointermove', 'pointerup', 'pointercancel']) griglia.removeEventListener(t, via)
      griglia.removeEventListener('scroll', via)
    }
    for (const t of ['pointermove', 'pointerup', 'pointercancel']) griglia.addEventListener(t, via)
    griglia.addEventListener('scroll', via, { passive: true })
    timer = setTimeout(() => {
      timer = 0
      via({ type: 'fine' })
      ignoraClick = Date.now()
      navigator.vibrate?.(15)
      entra()
      commuta(c.dataset.id)
    }, PRESSIONE)
  })
  // niente menu del browser sulle miniature tenute premute
  griglia.addEventListener('contextmenu', (e) => { if (e.target.closest('.cella')) e.preventDefault() })
  // in modalità scelta il click sceglie, e non arriva alla griglia (che aprirebbe il visore); il click che segue la
  // pressione lunga si butta via
  griglia.addEventListener('click', (e) => {
    const c = e.target.closest('.cella')
    if (!c) return
    if (ignoraClick && Date.now() - ignoraClick < 600) { ignoraClick = 0; e.stopPropagation(); e.preventDefault(); return }
    if (!attiva) return
    e.stopPropagation(); e.preventDefault()
    commuta(c.dataset.id)
  }, true)

  ascolta('scegli', () => (attiva ? esci() : entra()))
  // cambia il filtro: le celle scelte possono sparire dalla griglia; la scelta resta (si salva lo stesso)
}
