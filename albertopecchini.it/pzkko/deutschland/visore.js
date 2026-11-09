// Il visore di Deutschland (9.11.2026, «Deutschland 2»): la foto grande dentro il <dialog id="visore"> di index.html, su
// fondo nero, nel suo ratio. Compare la versione media (g, 1400–1800 px) da rete.js (prendi, priorità 0; le due vicine si
// scaldano con priorità 1) e BASTA: l'originale non parte mai da solo (il primo giro lo scaricava appena aprivi una foto:
// 16 MB che bloccavano tutto il resto). Sotto la foto la SCHEDA: la didascalia (dal manifesto v2; se manca, il posto),
// giorno e ora, il posto, e i due tasti grandi:
//   iPhone  «SALVA NEL RULLINO»: al tocco scarica l'originale con la percentuale dentro il tasto, poi il tasto diventa
//           «TOCCA PER SALVARE» e il secondo tocco chiama navigator.share (il gesto fresco di Safari: due tocchi chiari)
//   pc      «SCARICA ORIGINALE»: scarica e salva col nome vero (IMG_5506.JPG) via <a download>
//   «ORIGINALE 48 MP» (i megapixel da w×h della foto: 12 MP per i DNG a 4032 px; sotto l'avviso «15,8 MB · ~45 s», il
//   tempo a 350 KB/s dal Funnel di casa o a 5 MB/s da Backblaze, comune.js stato.cdn) per lo zoom pieno: scarica
//   l'originale e lo mette al posto della media.
// I video: <video controls playsinline preload=metadata> con il poster da rete.js (il mp4 in streaming dal server, col
// biglietto del momento: un blob di 100 MB non si può). Si apre con location.hash = '#f=<id>' (indietro chiude; un link con
// #f= apre direttamente), ← → Esc, contatore «12 / 967», swipe di 50 px, doppio tocco (zoom 2.5 sul punto), pinch con due
// dita e trascinamento quando è ingrandita. Una transizione sola per gesto, niente che giri a pagina ferma.

import { ascolta, peso, indirizzo, stato as accesso } from './comune.js'
import { prendi, libera, originale } from './rete.js'
import { lista, dataTedesca } from './album.js'
import { PC, scaricaFile, condividiFile } from './condividi.js'

// byte/s per l'avviso «~45 s» sotto il tasto dell'originale: dal Funnel di casa 350 KB/s, da Backblaze (cdn 'b2') 5 MB/s
const velocita = () => (accesso.cdn === 'b2' ? 5e6 : 350e3)
/** «48 MP» dagli HEIC a 6048×8064, «12 MP» dai DNG a 4032 px: dalla foto, non a mano. */
const megapixel = (f) => Math.max(1, Math.round(((+f.w || 0) * (+f.h || 0)) / 1e6))
let dlg, foto = [], posti = new Map(), corrente = null, spinto = false, chiudendo = false
let tela, img, video, conta, didascalia, meta, qualita, salva, grande, grandeNota, ctrl = null, urlG = null, urlO = null, urlP = null, file = null
let scala = 1, tx = 0, ty = 0, pinch0 = null, p0 = null, mosso = false, ultimoTap = 0
const puntatori = new Map()
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches

const durata = (s) => { s = Math.round(+s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const corrente_ = () => foto.find((x) => x.id === corrente)

// ── zoom: pinch, doppio tocco, trascinamento ──
function applica() { img.style.transform = scala === 1 && !tx && !ty ? '' : `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scala.toFixed(3)})`; tela.classList.toggle('zoom', scala > 1) }
function zoomVia() { scala = 1; tx = 0; ty = 0; applica() }
/** Porta la scala a s tenendo fermo il punto (cx, cy) dello schermo. */
function zoomA(s, cx, cy) {
  const r = tela.getBoundingClientRect()
  const x = cx - r.left - r.width / 2, y = cy - r.top - r.height / 2
  tx = x - (x - tx) * (s / scala); ty = y - (y - ty) * (s / scala); scala = s
  applica()
}
function animato(f) { if (fermo()) return f(); img.style.transition = 'transform .25s ease'; f(); setTimeout(() => { img.style.transition = '' }, 260) }

// ── la foto ──
/** Smette di aspettare quello che stava arrivando, ferma il video, libera i blob. */
function ferma() {
  ctrl?.abort(); ctrl = null
  if (urlG) { libera(urlG); urlG = null }
  if (urlO) { URL.revokeObjectURL(urlO); urlO = null }
  if (urlP) { libera(urlP); urlP = null }
  file = null
  if (video && !video.hidden) { video.pause(); video.removeAttribute('src'); video.removeAttribute('poster'); video.load() }
}

function azzeraTasti(f) {
  const v = f.tipo === 'video'
  salva.disabled = false; salva.classList.remove('pronto', 'fatto'); delete salva.dataset.stato
  salva.textContent = PC ? (v ? 'Scarica il video' : 'Scarica originale') : (v ? 'Salva il video' : 'Salva nel rullino')
  grande.hidden = v || !f.o
  grande.disabled = false; grande.classList.remove('fatto')
  grande.querySelector('span').textContent = `Originale ${megapixel(f)} MP`
  grandeNota.textContent = f.peso ? `${peso(f.peso)} · ~${Math.max(5, Math.round(f.peso / velocita() / 5) * 5)} s` : ''
}

async function mostra(f, k, n) {
  corrente = f.id
  ferma()
  zoomVia()
  const posto = posti.get(f.posto)
  conta.textContent = k >= 0 ? `${k + 1} / ${n}` : ''
  didascalia.textContent = f.didascalia || (f.tipo === 'video' ? `Video · ${durata(f.durata)}` : posto?.nome || 'Unterwegs')
  meta.textContent = [dataTedesca(f.giorno), f.ora ? `${f.ora}${f.tStimato ? ' ca.' : ''}` : null, f.didascalia ? posto?.nome : null].filter(Boolean).join(' · ')
  azzeraTasti(f)
  const mio = (ctrl = new AbortController())
  if (f.tipo === 'video') {
    img.hidden = true; img.removeAttribute('src')
    video.hidden = false
    qualita.textContent = `video · ${durata(f.durata)}${f.peso ? ` · ${peso(f.peso)}` : ''}`
    // (il poster da rete.js; il mp4 in streaming dal server: l'indirizzo col biglietto del momento)
    video.src = indirizzo('v', f.v)
    if (f.p) prendi('p', f.p, { priorita: 0, signal: mio.signal }).then((u) => { if (mio.signal.aborted) { libera(u); return } urlP = u; video.poster = u }).catch(() => {})
  } else {
    video.hidden = true
    img.hidden = false
    img.width = f.w || 3; img.height = f.h || 4
    img.alt = f.didascalia || `foto delle ${f.ora ?? ''}`
    img.removeAttribute('src')
    qualita.textContent = 'anteprima…'
    try {
      const u = await prendi('g', f.g, { priorita: 0, signal: mio.signal })
      if (mio.signal.aborted) { libera(u); return }
      urlG = u
      img.src = u
      qualita.textContent = 'anteprima'
    } catch (e) {
      if (mio.signal.aborted) return
      if (e?.name !== 'UscitaError') console.warn('deutschland: la foto grande non arriva', e?.message ?? e)
      qualita.textContent = 'la foto non arriva'
    }
  }
  // le due vicine, pronte prima che servano (poi si libera il blob: resta in cache)
  if (k >= 0) {
    const l = lista()
    for (const d of [1, -1]) { const v = l[k + d]; if (v && v.tipo !== 'video' && v.g) prendi('g', v.g, { priorita: 1 }).then(libera).catch(() => {}) }
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

// ── i tasti grandi: salva e 48 MP ──
/** Scarica l'originale della foto corrente (una volta: il File resta finché non si cambia foto), con la percentuale su `b`. */
async function scarica(f, b, etichetta) {
  if (file) return file
  b.dataset.stato = 'scarico'; b.disabled = true
  try {
    // (la g può ancora arrivare: non la si ferma; se intanto si cambia foto, il file non serve più)
    const out = await originale(f, { onProgress: (letti, totale) => { if (corrente === f.id) b.textContent = totale ? `${etichetta} · ${Math.min(99, Math.round((letti / totale) * 100))} %` : `${etichetta} · ${peso(letti)}` } })
    if (corrente !== f.id) return null
    file = out
    return out
  } finally { if (corrente === f.id) { delete b.dataset.stato; b.disabled = false } }
}

async function salvaClick() {
  const f = corrente_()
  if (!f || salva.dataset.stato === 'scarico') return
  const v = f.tipo === 'video'
  // il secondo tocco (telefono): si condivide SUBITO
  if (salva.dataset.stato === 'pronto' && file) {
    salva.disabled = true
    const finita = await condividiFile([file])
    salva.disabled = false
    if (!finita) return
    salva.textContent = v ? '✓ Video salvato' : '✓ Nel rullino'; salva.classList.add('fatto'); delete salva.dataset.stato
    setTimeout(() => { if (corrente === f.id) azzeraTasti(f) }, 2200)
    return
  }
  try {
    const out = await scarica(f, salva, PC ? 'Scarico' : 'Salvo')
    if (!out) return
    if (PC) { scaricaFile(out); salva.textContent = v ? '✓ Video scaricato' : '✓ Scaricata'; salva.classList.add('fatto'); setTimeout(() => { if (corrente === f.id) azzeraTasti(f) }, 2200) }
    else { salva.dataset.stato = 'pronto'; salva.classList.add('pronto'); salva.textContent = 'Tocca per salvare' }
  } catch (e) {
    if (corrente !== f.id) return
    console.warn('deutschland: non riesco a scaricare', e?.message ?? e)
    salva.textContent = 'Riprova'
  }
}

async function grandeClick() {
  const f = corrente_()
  if (!f || f.tipo === 'video' || grande.dataset.stato === 'scarico') return
  const s = grande.querySelector('span')
  grande.dataset.stato = 'scarico'; grande.disabled = true
  try {
    const out = file ?? await originale(f, { onProgress: (letti, totale) => { s.textContent = totale ? `${Math.min(99, Math.round((letti / totale) * 100))} %` : peso(letti) } })
    if (corrente !== f.id) return
    file = out
    if (urlO) URL.revokeObjectURL(urlO)
    urlO = URL.createObjectURL(out)
    img.src = urlO
    qualita.textContent = `originale · ${f.w}×${f.h} · ${peso(out.size)}`
    s.textContent = `✓ ${megapixel(f)} MP`; grande.classList.add('fatto'); grandeNota.textContent = 'pizzica per ingrandire'
  } catch (e) {
    if (corrente !== f.id) return
    console.warn('deutschland: l’originale non arriva', e?.message ?? e)
    s.textContent = 'Riprova'; grande.disabled = false
  } finally { if (corrente === f.id) { delete grande.dataset.stato; if (!grande.classList.contains('fatto')) grande.disabled = false } }
}

export function avvia(manifesto) {
  dlg = document.getElementById('visore')
  if (!dlg) return
  foto = manifesto.foto
  posti = new Map(manifesto.posti.map((p) => [p.id, p]))
  dlg.innerHTML = `
    <div class="v-testa">
      <span class="v-conta"></span>
      <span class="v-qualita"></span>
      <button type="button" class="v-chiudi" aria-label="chiudi"><span aria-hidden="true">×</span></button>
    </div>
    <div class="v-tela">
      <img class="v-img" alt="" decoding="async" draggable="false" hidden>
      <video class="v-video" controls playsinline preload="metadata" hidden></video>
    </div>
    <button type="button" class="v-freccia v-prima" aria-label="foto precedente">‹</button>
    <button type="button" class="v-freccia v-dopo" aria-label="foto successiva">›</button>
    <div class="v-scheda">
      <p class="v-didascalia"></p>
      <p class="v-meta"></p>
      <div class="v-tasti">
        <button type="button" class="segnale segnale-gelb v-salva">Salva nel rullino</button>
        <button type="button" class="segnale v-grande"><span>Originale</span><small></small></button>
      </div>
    </div>`
  tela = dlg.querySelector('.v-tela'); img = dlg.querySelector('.v-img'); video = dlg.querySelector('.v-video')
  qualita = dlg.querySelector('.v-qualita'); conta = dlg.querySelector('.v-conta'); didascalia = dlg.querySelector('.v-didascalia'); meta = dlg.querySelector('.v-meta')
  salva = dlg.querySelector('.v-salva'); grande = dlg.querySelector('.v-grande'); grandeNota = grande.querySelector('small')

  dlg.querySelector('.v-chiudi').addEventListener('click', chiudi)
  dlg.querySelector('.v-prima').addEventListener('click', () => vai(-1))
  dlg.querySelector('.v-dopo').addEventListener('click', () => vai(1))
  salva.addEventListener('click', salvaClick)
  grande.addEventListener('click', grandeClick)
  // (Esc lo chiude già il <dialog>, ma Chrome a volte vuole due Esc senza un gesto fresco: qui basta uno)
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') vai(1); else if (e.key === 'ArrowLeft') vai(-1); else if (e.key === 'Escape') { e.preventDefault(); chiudi() } })
  // chiuso (Esc, ×, fondo): via l'hash. Se l'abbiamo spinto noi si torna indietro nella storia, se no (arrivati da un link
  // #f=) si toglie e basta, senza uscire dal sito
  dlg.addEventListener('close', () => {
    ferma(); corrente = null
    if (/^#f=/.test(location.hash)) { if (spinto) { chiudendo = true; history.back() } else history.replaceState(null, '', location.pathname + location.search) }
    spinto = false
  })

  // dita e mouse sulla tela: swipe (50 px) quando non è ingrandita, doppio tocco = zoom sul punto, pinch, trascinamento
  tela.addEventListener('pointerdown', (e) => {
    if (e.button || !video.hidden) return
    puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try { tela.setPointerCapture(e.pointerId) } catch {}
    if (puntatori.size === 2) {
      const [a, b] = [...puntatori.values()]
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, scala }
      p0 = null
    } else { p0 = { x: e.clientX, y: e.clientY, tx, ty, sfondo: e.target === tela }; mosso = false }
  })
  tela.addEventListener('pointermove', (e) => {
    if (!puntatori.has(e.pointerId)) return
    puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (puntatori.size === 2 && pinch0) {
      const [a, b] = [...puntatori.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1
      zoomA(Math.min(5, Math.max(1, pinch0.scala * (d / pinch0.d))), (a.x + b.x) / 2, (a.y + b.y) / 2)
      mosso = true
    } else if (puntatori.size === 1 && p0 && scala > 1) {
      tx = p0.tx + (e.clientX - p0.x); ty = p0.ty + (e.clientY - p0.y)
      if (Math.hypot(e.clientX - p0.x, e.clientY - p0.y) > 8) mosso = true
      applica()
    } else if (p0 && Math.hypot(e.clientX - p0.x, e.clientY - p0.y) > 8) mosso = true
  })
  const su = (e) => {
    const c = puntatori.get(e.pointerId)
    puntatori.delete(e.pointerId)
    if (puntatori.size < 2) pinch0 = null
    if (!c || puntatori.size || !p0) { if (!puntatori.size && scala < 1.05) zoomVia(); return }
    const dx = e.clientX - p0.x, dy = e.clientY - p0.y
    const tap = !mosso && Math.abs(dx) < 8 && Math.abs(dy) < 8
    if (tap) {
      const adesso = Date.now()
      if (adesso - ultimoTap < 300) { ultimoTap = 0; animato(() => (scala > 1 ? zoomVia() : zoomA(2.5, e.clientX, e.clientY))) }
      else { ultimoTap = adesso; if (p0.sfondo && scala === 1) setTimeout(() => { if (ultimoTap === adesso) chiudi() }, 300) }
    } else if (scala === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) vai(dx < 0 ? 1 : -1)
    if (scala < 1.05) zoomVia()
    p0 = null
  }
  tela.addEventListener('pointerup', su)
  tela.addEventListener('pointercancel', (e) => { puntatori.delete(e.pointerId); pinch0 = null; p0 = null })
  // la rotella con ctrl (trackpad) ingrandisce sul computer
  tela.addEventListener('wheel', (e) => { if (!e.ctrlKey || !video.hidden) return; e.preventDefault(); zoomA(Math.min(5, Math.max(1, scala * (e.deltaY < 0 ? 1.12 : 1 / 1.12))), e.clientX, e.clientY); if (scala < 1.05) zoomVia() }, { passive: false })

  ascolta('apri', ({ id }) => { if (location.hash === `#f=${id}`) apri(id); else { spinto = true; location.hash = `#f=${id}` } })
  addEventListener('hashchange', daHash)
  daHash() // arrivati con #f=… nell'indirizzo
}
