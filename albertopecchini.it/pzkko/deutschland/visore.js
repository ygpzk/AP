// Il visore di Deutschland (9.11.2026): la foto grande dentro il <dialog id="visore"> di index.html. Portato in JS semplice
// dal visore di agosto (git show 6b0e2dd:src/app/shooting/Shooting.tsx, Visore): compare subito la versione media (g, 1800
// px, già in cache o quasi) e intanto parte in silenzio l'originale (o, 48 MP) in un new Image(); quando è pronto prende il
// suo posto SENZA lampo (stesso <img>, stessa inquadratura: il browser l'ha appena scaricato, è in cache) e l'etichetta in
// basso dice «originale · 6048×8064 · 15,8 MB». I video: <video controls playsinline preload=metadata poster>. Si apre
// con location.hash = '#f=<id>' (indietro chiude; un link con #f= apre direttamente), ← → Esc, contatore «12 / 452»,
// swipe di 50 px (pointer events, touch-action: pan-y), zoom col tap: scale(2.5) con l'origine nel punto toccato, un altro
// tap torna. Le g vicine si precaricano. Il tasto «salva» passa da condividi.js (Web Share col file o download).

import { indirizzo, ascolta, peso } from './comune.js'
import { lista } from './griglia.js'
import { salvaUno, azzera } from './condividi.js'

let dlg, foto = [], posti = new Map(), corrente = null, spinto = false, chiudendo = false
let tela, img, video, qualita, conta, info, salva, originale = null, p0 = null

const durata = (s) => { s = Math.round(+s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

/** Smette di aspettare l'originale di prima e ferma il video. */
function ferma() {
  if (originale) { originale.onload = originale.onerror = null; originale = null }
  if (video && !video.hidden) { video.pause(); video.removeAttribute('src'); video.removeAttribute('poster'); video.load() }
}

function zoomVia() { tela.classList.remove('zoom'); img.style.transformOrigin = '' }

function mostra(f, k, n) {
  corrente = f.id
  ferma()
  zoomVia()
  const posto = posti.get(f.posto)
  conta.textContent = k >= 0 ? `${k + 1} / ${n}` : ''
  info.textContent = [f.giorno, f.ora ? `${f.ora}${f.tStimato ? ' circa' : ''}` : null, posto?.nome].filter(Boolean).join(' · ')
  azzera(salva)
  if (f.tipo === 'video') {
    img.hidden = true; img.removeAttribute('src')
    video.hidden = false
    if (f.p) video.poster = indirizzo('p', f.p)
    video.src = indirizzo('v', f.v)
    qualita.textContent = `video · ${durata(f.durata)}${f.peso ? ` · ${peso(f.peso)}` : ''}`
  } else {
    video.hidden = true
    img.hidden = false
    img.width = f.w || 3; img.height = f.h || 4
    img.alt = `foto delle ${f.ora ?? ''}`
    img.src = indirizzo('g', f.g)
    qualita.textContent = 'anteprima…'
    if (f.o) {
      // (crossOrigin: la richiesta porta l'Origin e la risposta l'Access-Control-Allow-Origin, così l'originale in cache
      // vale anche per il fetch di «salva» (condividi.js): senza, la cache darebbe una risposta senza CORS e il fetch fallirebbe)
      const o = new Image()
      o.crossOrigin = 'anonymous'
      originale = o
      o.onload = () => { if (corrente !== f.id) return; img.src = o.src; qualita.textContent = `originale · ${f.w}×${f.h}${f.peso ? ` · ${peso(f.peso)}` : ''}`; originale = null }
      o.onerror = () => { if (corrente === f.id) qualita.textContent = 'anteprima · 1800 px'; originale = null }
      o.src = indirizzo('o', f.o)
    }
  }
  // le due vicine, pronte prima che servano (Shooting.tsx: «premere ← o → non deve mai mostrare un buco»)
  if (k >= 0) {
    const l = lista()
    for (const d of [1, -1]) { const v = l[k + d]; if (v && v.tipo !== 'video' && v.g) { const p = new Image(); p.crossOrigin = 'anonymous'; p.src = indirizzo('g', v.g) } }
  }
}

function apri(id) {
  const l = lista()
  const k = l.findIndex((f) => f.id === id)
  if (k >= 0) mostra(l[k], k, l.length)
  else { const f = foto.find((x) => x.id === id); if (!f) return; mostra(f, -1, 0) }
  if (!dlg.open) dlg.showModal()
}

function vai(d) {
  const l = lista()
  const k = l.findIndex((f) => f.id === corrente)
  const v = l[k + d]
  if (k < 0 || !v) return
  history.replaceState(null, '', `#f=${v.id}`)
  mostra(v, k + d, l.length)
}

function chiudi() { if (dlg.open) dlg.close() }

function daHash() {
  // (tornati indietro per chiudere: se la voce prima era un'altra foto, #f= di nuovo, non si riapre: si pulisce)
  if (chiudendo) { chiudendo = false; if (/^#f=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); return }
  const m = /^#f=([a-z0-9-]+)$/.exec(location.hash)
  if (m) apri(m[1])
  else chiudi()
}

function zoom(e) {
  if (tela.classList.contains('zoom')) return zoomVia()
  const r = img.getBoundingClientRect()
  img.style.transformOrigin = `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`
  tela.classList.add('zoom')
}

export function avvia(manifesto) {
  dlg = document.getElementById('visore')
  if (!dlg) return
  foto = manifesto.foto
  posti = new Map(manifesto.posti.map((p) => [p.id, p]))
  dlg.innerHTML = `
    <div class="v-barra">
      <span class="v-conta"></span>
      <span class="v-info"></span>
      <button type="button" class="v-salva">salva</button>
      <button type="button" class="v-chiudi" aria-label="chiudi">×</button>
    </div>
    <div class="v-tela">
      <img class="v-img" alt="" decoding="async" crossorigin="anonymous" hidden>
      <video class="v-video" controls playsinline preload="metadata" crossorigin="anonymous" hidden></video>
    </div>
    <button type="button" class="v-freccia v-prima" aria-label="foto precedente">‹</button>
    <button type="button" class="v-freccia v-dopo" aria-label="foto successiva">›</button>
    <div class="v-piede"><span class="v-qualita"></span><span class="v-aiuto">tocca per ingrandire · scorri per cambiare</span></div>`
  tela = dlg.querySelector('.v-tela'); img = dlg.querySelector('.v-img'); video = dlg.querySelector('.v-video')
  qualita = dlg.querySelector('.v-qualita'); conta = dlg.querySelector('.v-conta'); info = dlg.querySelector('.v-info'); salva = dlg.querySelector('.v-salva')

  dlg.querySelector('.v-chiudi').addEventListener('click', chiudi)
  dlg.querySelector('.v-prima').addEventListener('click', () => vai(-1))
  dlg.querySelector('.v-dopo').addEventListener('click', () => vai(1))
  salva.addEventListener('click', () => { const f = foto.find((x) => x.id === corrente); if (f) salvaUno(f, salva) })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() }) // il fondo fuori dalla foto
  // (Esc lo chiude già il <dialog>, ma Chrome a volte vuole due Esc senza un gesto fresco: qui basta uno)
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') vai(1); else if (e.key === 'ArrowLeft') vai(-1); else if (e.key === 'Escape') { e.preventDefault(); chiudi() } })
  // chiuso (Esc, ×, fondo): via l'hash. Se l'abbiamo spinto noi si torna indietro nella storia, se no (arrivati da un link
  // #f=) si toglie e basta, senza uscire dal sito
  dlg.addEventListener('close', () => {
    ferma(); corrente = null
    if (/^#f=/.test(location.hash)) { if (spinto) { chiudendo = true; history.back() } else history.replaceState(null, '', location.pathname + location.search) }
    spinto = false
  })
  // swipe (50 px in orizzontale) o tap (zoom): pointer events, così vale per dito e mouse
  tela.addEventListener('pointerdown', (e) => { if (e.button) return; p0 = { x: e.clientX, y: e.clientY }; try { tela.setPointerCapture(e.pointerId) } catch {} })
  tela.addEventListener('pointerup', (e) => {
    if (!p0) return
    const dx = e.clientX - p0.x, dy = e.clientY - p0.y
    p0 = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && !tela.classList.contains('zoom')) vai(dx < 0 ? 1 : -1)
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && !img.hidden) zoom(e)
  })
  tela.addEventListener('pointercancel', () => { p0 = null })

  ascolta('apri', ({ id }) => { if (location.hash === `#f=${id}`) apri(id); else { spinto = true; location.hash = `#f=${id}` } })
  addEventListener('hashchange', daHash)
  daHash() // arrivati con #f=… nell'indirizzo
}
