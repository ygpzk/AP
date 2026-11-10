// L'accesso a Deutschland (9.11.2026, Alberto: «/deutschland/ mostra la macchinetta da vicino che chiede la password;
// struttura sicura: repo pubblico, verifica a casa»). Deutschland 4 (10.11.2026, Alberto: «ricrea esattamente quello
// sfondo e questa macchinetta al posto di quell'inizio orribile e triste»): la via di Stoccarda dove l'8.11 c'era la
// macchinetta gialla vera, la password su un FOGLIETTO attaccato al muro (#accesso). La notte stessa («crea la macchinetta
// da zero frontalmente perfettamente in vista perpendicolare», «avvicinati di più, centrale e super protagonista», «eviti
// di aprirmi una finestra per selezionare e mi fai fare tutto lì direttamente», «disabilita lo scroll e togli il piè di
// pagina»): una schermata sola, ferma; la macchinetta frontale al centro, grande quanto lo schermo lascia (disponi()), la
// via intorno alla sua scala; le 20 vetrinette sono tasti VERI sulla macchinetta (#am-vetrine): col mouse il puntatore
// sopra mostra il cartellino (nome e prezzo) e il clic compra; col dito il primo tocco mostra il cartellino, il secondo
// sullo stesso compra (le vetrinette sono piccole: così non si sbaglia). Comprato → il pacchetto cade dalla bocchetta e
// si entra: il tavolo dei ricordi, e tranne JMA l'album del suo tag sopra («deutschland:pacco», packung.js). Le misure
// stanno in muro-dati.js (le scrive tools/pzkko/deutschland/automat.mjs).
// La password non sta qui né su Vercel: il form la manda a POST /api/deutschland/ (il ponte di Vercel verso il pc di
// Alberto, C:\pzkko-server\deutschland\accesso.mjs), che se è quella giusta dà il biglietto {url, biglietto, scade, cdn}
// con cui si chiedono le foto (comune.js, rete.js). Il biglietto resta in localStorage: alla visita dopo si prova subito
// foto.json; 200 → dentro; 404 → scaduto, si dimentica e si richiede la password. Se il pc di Alberto è spento (503, o la
// rete tace) «la macchinetta è spenta». In locale (comune.js LOCALE) il server è quello aperto su 127.0.0.1:8790
// (DEUTSCHLAND_APERTO=1), senza password: se risponde si entra subito, se no il foglietto con «server locale spento».
// Dal tavolo, «◂ Automat» («deutschland:automat») riporta qui: col biglietto ancora buono basta scegliere un pacchetto.
// Niente animazioni che girano a pagina ferma (memoria pzkko-leggero): solo transizioni a un gesto. Niente console.error
// nelle condizioni normali, server spento compreso (il bot dei bug le conta come errori).
import { LOCALE, stato, leggi, salva, dimentica, indirizzo, evento, ascolta } from './comune.js'
import { pagina, vetrine as VETRINE, via as VIA } from './muro-dati.js'
import { proietta } from './muro.js'

const API = '/api/deutschland/' // (con la barra finale: senza, Vercel risponde 308)
const SPENTA = 'la macchinetta è spenta: il pc di Alberto è spento'
const LOCALE_SPENTO = 'server locale spento (127.0.0.1:8790)'
const LOCALE_COME = 'server locale spento: DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs'
const SCADUTO = 'il biglietto è scaduto: la password, di nuovo'
const PRIMA = 'prima la password, qui sul foglietto'

const $ = (s) => document.querySelector(s)
const automat = $('#automat'), album = $('#album'), form = $('#accesso'), input = $('#ac-password'), riga = $('#ac-stato'), occhio = $('#ac-occhio')
const viaFoto = $('#via-foto'), corpo = $('#am-corpo'), pacco = $('#am-pacco'), led = $('#ac-led'), titolo = $('#fo-titolo')
const tastiEl = $('#am-vetrine'), etichetta = $('#am-etichetta')
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches
const pc = (v) => `${(v * 100).toFixed(3)}%`

/** La riga di stato sul foglietto: tipo = '' | 'male' | 'bene' | 'spenta' | 'attesa'. Mai «undefined» né «NaN». */
function di(testo, tipo = '') { if (!riga) return; riga.textContent = String(testo ?? ''); if (tipo) riga.dataset.tipo = tipo; else delete riga.dataset.tipo }
/** Il display LCD della macchinetta: parole corte, in tedesco come quelli veri. */
const display = (t) => { if (led) led.textContent = t }
const suono = (tipo) => import('/suono/interfaccia.js').then((s) => s.tasto?.(tipo)).catch(() => {})
const numero = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
const euro = (v) => `${v.euro},00 €`

// ── la scena: la macchinetta grande al centro, la via intorno alla sua scala ──
/** Mette la macchinetta e il panorama per lo schermo di adesso (e lo rifà quando cambia). Sul computer il corpo della
 *  macchinetta è alto quanto lo schermo sotto la barra (il piede esce in basso: ci si è avvicinati), la targa a sinistra e
 *  il foglietto a destra sul muro; sul telefono (o se ai lati non c'è posto) la macchinetta è larga quanto lo schermo, la
 *  targa sopra e il foglietto sul piede. */
function disponi() {
  if (!automat || !corpo) return
  const W = innerWidth, H = innerHeight
  const barra = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barra')) || 62
  const a = pagina.w / pagina.h, c = pagina.corpo
  let mh = (H - barra - 24) / c // il corpo dalla barra al fondo
  const stretto = mh * a + 2 * 300 > W
  let top = barra + 10
  if (stretto) {
    const sopra = barra + Math.min(96, H * 0.11) // (la targa)
    mh = Math.min((W - 14) / a, (H - sopra - 20) / c)
    top = sopra
  }
  const mw = mh * a, left = (W - mw) / 2
  automat.classList.toggle('stretto', stretto)
  for (const [k, v] of Object.entries({ '--mx': left, '--my': top, '--mw': mw, '--mh': mh })) automat.style.setProperty(k, `${v.toFixed(1)}px`)
  // il muro alla stessa scala: la macchinetta occupa `posto` (frazioni dell'immagine); se così non coprisse lo schermo
  // (schermi larghissimi o bassi) si ingrandisce quanto basta attorno alla macchinetta
  const { posto, w, h } = VIA, asp = w / h
  const met = W / 2, x0 = posto.x, y0 = posto.piede - posto.alto, cy = top
  let S = mh / posto.alto
  S = Math.max(S, met / x0 / asp, met / (1 - x0) / asp, cy / y0, (H - cy) / (1 - y0))
  const PW = S * asp
  if (viaFoto) Object.assign(viaFoto.style, { width: `${PW.toFixed(1)}px`, height: `${S.toFixed(1)}px`, left: `${(W / 2 - x0 * PW).toFixed(1)}px`, top: `${(cy - y0 * S).toFixed(1)}px` })
}
if (VIA.segnaposto && automat) automat.style.setProperty('--segnaposto', `url("${VIA.segnaposto}")`)
const lcdEl = $('#am-lcd')
if (lcdEl && corpo) proietta(corpo, lcdEl, pagina.lcd)
if (pacco && pagina.bocchetta) { const [bx, by, bw, bh] = pagina.bocchetta; Object.assign(pacco.style, { left: pc(bx + bw / 2), top: pc(by + bh * 0.1), width: pc(bw * 0.3) }) }

// ── le 20 vetrinette: tasti veri sulla macchinetta. Il tasto è la casella intera della griglia (la vetrinetta più il
//    metallo intorno fino a metà strada dalle vicine): più facile da prendere, nessun buco fra le vetrinette ──
const R = pagina.vetrine ?? []
const passoX = R.length > 1 ? R[1][0] - R[0][0] : 0, passoY = R.length > 4 ? R[4][1] - R[0][1] : 0
const tasti = R.map((r, k) => {
  const v = VETRINE[k] ?? VETRINE[0]
  const cw = Math.max(r[2], passoX), ch = Math.max(r[3], passoY)
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'am-vetrina'
  b.dataset.n = String(k + 1)
  b.dataset.suonoNo = ''
  b.setAttribute('aria-label', `${v.nome}, ${v.euro} euro`)
  Object.assign(b.style, { left: pc(r[0] - (cw - r[2]) / 2), top: pc(r[1] - (ch - r[3]) / 2), width: pc(cw), height: pc(ch) })
  // la luce sta sulla vetrinetta vera, dentro la casella
  b.style.setProperty('--in-x', pc((cw - r[2]) / 2 / cw)); b.style.setProperty('--in-y', pc((ch - r[3]) / 2 / ch))
  b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mostra(k + 1) })
  b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && scelta === k + 1 && !occupato) nascondi() })
  b.addEventListener('focus', () => mostra(k + 1))
  b.addEventListener('pointerdown', (e) => { tipoUltimo = e.pointerType; b.classList.add('premuto') }, { passive: true })
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { if (!occupato) b.classList.remove('premuto') }, { passive: true })
  b.addEventListener('click', () => tocca(k + 1))
  return b
})
tastiEl?.append(...tasti)

let dentro = false, occupato = false, albumPronto = null, contaAttesa = 0, buono = false, scelta = 0, tipoUltimo = 'mouse'

/** Il cartellino sopra la vetrinetta n: nome e prezzo; il display dice il prezzo, come le macchinette vere. */
function mostra(n) {
  const v = VETRINE[n - 1], r = R[n - 1]
  if (!v || !r || !etichetta) return
  scelta = n
  for (const t of tasti) t.classList.toggle('scelto', t === tasti[n - 1])
  etichetta.querySelector('b').textContent = v.nome.split(':')[0]
  etichetta.querySelector('span').textContent = buono ? euro(v) : `${euro(v)} · prima la password`
  Object.assign(etichetta.style, { left: pc(r[0] + r[2] / 2), top: pc(r[1]) })
  etichetta.hidden = false
  if (buono) display(euro(v))
}
function nascondi() {
  scelta = 0
  for (const t of tasti) t.classList.remove('scelto')
  if (etichetta) etichetta.hidden = true
  display(buono ? 'BITTE WÄHLEN' : 'PASSWORT?')
}
// (col dito: un tocco fuori dalle vetrinette toglie il cartellino)
addEventListener('pointerdown', (e) => { if (scelta && !occupato && !e.target.closest?.('.am-vetrina')) nascondi() }, { passive: true })

/** Il foglietto si fa notare (una scossa sola) e prende il fuoco. */
function scuoti(msg = PRIMA) {
  di(msg, 'male')
  form?.classList.remove('scuoti'); void form?.offsetWidth; form?.classList.add('scuoti')
  input?.focus({ preventScroll: true })
}

/** Un tocco su una vetrinetta: senza biglietto il foglietto; col dito il primo tocco mostra, il secondo compra. */
function tocca(n) {
  if (occupato || dentro) return
  if (!buono) { suono('meccanico'); mostra(n); return scuoti() }
  if (tipoUltimo !== 'mouse' && scelta !== n) { mostra(n); return }
  compra(n)
}

/** Dentro: il tavolo (galleria.js e i suoi moduli) e l'evento con il biglietto; n = la vetrinetta scelta (tranne JMA,
 *  anche l'album del suo pacchetto). */
async function entra(n = 1) {
  dentro = true
  nascondi()
  document.documentElement.classList.add('dentro')
  if (automat) automat.hidden = true
  if (album) album.hidden = false
  scrollTo({ top: 0, behavior: 'instant' })
  // (il modulo prima, l'evento dopo: così chi si mette in ascolto importandosi lo sente)
  albumPronto ??= import('./galleria.js').catch((e) => { albumPronto = null; console.warn('album non aperto (galleria.js)', e?.message ?? e) })
  await albumPronto
  evento('accesso', { url: stato.url, biglietto: stato.biglietto, scade: stato.scade, cdn: stato.cdn })
  const v = VETRINE[n - 1]
  if (v?.tag) evento('pacco', { tag: v.tag })
}

/** La macchinetta sputa il pacchetto n dalla bocchetta (una transizione sola), poi si entra. */
function sputa(n = 1) {
  if (!pacco || fermo()) return Promise.resolve()
  pacco.src = `/art/deutschland/pacchi/${(VETRINE[n - 1] ?? VETRINE[0]).img}.webp`
  pacco.hidden = false
  return new Promise((ok) => {
    let fatto = false
    const fine = () => { if (fatto) return; fatto = true; setTimeout(() => { pacco.hidden = true; pacco.classList.remove('sputa'); ok() }, 160) }
    pacco.addEventListener('transitionend', fine, { once: true })
    setTimeout(fine, 1000) // (se la transizione non parte, es. scheda nascosta)
    requestAnimationFrame(() => requestAnimationFrame(() => pacco.classList.add('sputa')))
  })
}

/** Comprato: la vetrinetta si accende, il display ringrazia, il pacchetto cade, si entra. */
async function compra(n) {
  if (occupato || dentro) return
  if (!(stato.biglietto || LOCALE)) return fuori(PRIMA, 'male')
  occupato = true
  suono('meccanico')
  mostra(n)
  tasti[n - 1]?.classList.add('comprato')
  display('DANKE')
  await new Promise((r) => setTimeout(r, fermo() ? 0 : 250))
  await sputa(n)
  tasti[n - 1]?.classList.remove('comprato')
  occupato = false
  return entra(n)
}

/** Il foglietto: col campo (serve la password) o col biglietto buono («scegli un pacchetto»). */
function modo(conBiglietto) {
  buono = !!conBiglietto
  form?.classList.toggle('buono', buono)
  automat?.classList.toggle('buono', buono)
  if (titolo) titolo.textContent = buono ? 'Passt! ✓' : 'Passwort?'
  display(buono ? 'BITTE WÄHLEN' : 'PASSWORT?')
}

/** Fuori: la macchinetta (col foglietto da scrivere, o già a posto se il biglietto è buono) e un messaggio, se c'è. */
function fuori(messaggio = '', tipo = '', conBiglietto = false) {
  dentro = false
  document.documentElement.classList.remove('dentro')
  if (album) album.hidden = true
  if (automat) automat.hidden = false
  modo(conBiglietto)
  di(messaggio || (conBiglietto ? 'scegli un pacchetto ↖' : ''), tipo)
  disponi()
}

/** C'è un biglietto (o siamo in locale): il server delle foto risponde? */
async function prova() {
  try {
    const r = await fetch(indirizzo('foto.json'), { cache: 'no-cache' })
    if (r.ok) return entra()
    if (r.status === 404) { dimentica(); fuori(LOCALE ? LOCALE_SPENTO : SCADUTO, LOCALE ? 'spenta' : 'male'); return display('AUS') }
    console.warn(`il server delle foto risponde ${r.status}`)
    fuori(LOCALE ? LOCALE_SPENTO : SPENTA, 'spenta')
    display('AUS')
  } catch (e) {
    console.warn(LOCALE ? LOCALE_COME : 'la macchinetta è spenta: il server delle foto tace', e?.message ?? '')
    fuori(LOCALE ? LOCALE_SPENTO : SPENTA, 'spenta')
    display('AUS')
  }
}

/** 429: «aspetta n s», con il conto alla rovescia; il campo intanto non si tocca. */
function aspetta(secondi) {
  clearInterval(contaAttesa)
  let n = Math.max(1, Math.round(secondi))
  const blocca = (si) => { if (input) input.disabled = si; const l = $('#fo-los'); if (l) l.disabled = si }
  const conta = () => { di(`aspetta ${n} s`, 'attesa'); blocca(n > 0) }
  conta()
  contaAttesa = setInterval(() => { n--; if (n <= 0) { clearInterval(contaAttesa); di('', ''); blocca(false); input?.focus({ preventScroll: true }) } else conta() }, 1000)
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (occupato || dentro || buono) return
  const password = (input?.value ?? '').trim()
  if (!password) { di('prima scrivi la password', 'male'); input?.focus(); return }
  occupato = true
  suono('meccanico')
  form.classList.add('attesa')
  di('…')
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'entra', password }) })
    const d = await r.json().catch(() => ({}))
    if (r.ok && d && d.ok && d.url && d.biglietto) {
      salva({ url: d.url, biglietto: d.biglietto, scade: numero(d.scade, Date.now() + 6 * 3600e3), cdn: d.cdn })
      if (input) { input.value = ''; input.blur() }
      modo(true)
      di('bitte schön: scegli un pacchetto ↖', 'bene')
    } else if (r.status === 401) {
      const restano = numero(d?.restano, null)
      display('FALSCH')
      di(restano === null ? 'non è quella' : `non è quella · restano ${restano}`, 'male')
      input?.select()
    } else if (r.status === 429) {
      const a = numero(d?.attesa, 60)
      aspetta(a > 1000 ? a / 1000 : a) // (secondi; se arrivano millisecondi si capisce dalla misura)
    } else if (r.status === 503 || r.status === 502 || r.status === 504 || (r.status === 404 && LOCALE)) {
      console.warn(`la macchinetta è spenta: ${API} risponde ${r.status}`)
      display('AUS')
      di(LOCALE && r.status === 404 ? 'in locale l’api non c’è: accendi il server aperto su 8790' : SPENTA, 'spenta')
    } else {
      console.warn(`${API} risponde ${r.status}`)
      display('AUS')
      di(SPENTA, 'spenta')
    }
  } catch (err) {
    console.warn('la macchinetta è spenta: la rete tace', err?.message ?? '')
    display('AUS')
    di(SPENTA, 'spenta')
  } finally {
    occupato = false
    form.classList.remove('attesa')
  }
})

// l'occhio: mostra o nasconde la password
occhio?.addEventListener('click', () => {
  const vedi = input.type === 'password'
  input.type = vedi ? 'text' : 'password'
  occhio.setAttribute('aria-pressed', String(vedi))
  occhio.setAttribute('aria-label', vedi ? 'nascondi la password' : 'mostra la password')
  input.focus({ preventScroll: true })
})

// il server ha risposto 404 a una foto: biglietto scaduto o cambiato → si richiede la password
ascolta('uscita', () => { dimentica(); fuori(SCADUTO, 'male') })
// «◂ Automat» dal tavolo: si torna qui; col biglietto buono basta scegliere
ascolta('automat', () => { fuori('', '', Boolean(stato.biglietto || LOCALE)); scrollTo({ top: 0, behavior: 'instant' }) })

// ── il telo della vernice: chi arriva dal muro lo trova nero e lo vede scendere via, appena la pagina è pronta ──
const pronta = new Promise((ok) => (document.readyState === 'loading' ? addEventListener('DOMContentLoaded', ok, { once: true }) : ok()))
const attimo = (ms) => new Promise((ok) => setTimeout(ok, ms))
async function scopri() {
  if (document.documentElement.classList.contains('senza-telo')) return
  await pronta
  const foto = $('.am-foto')
  await Promise.race([Promise.all([document.fonts?.ready ?? Promise.resolve(), foto?.decode?.().catch(() => {}) ?? Promise.resolve()]), attimo(700)])
  await new Promise(requestAnimationFrame)
  await import('./vernice.js').then((v) => v.scopri()).catch(() => { $('.telo')?.remove(); try { sessionStorage.removeItem('pzkko-vernice') } catch {} })
}

// ── via ──
disponi()
addEventListener('resize', () => { if (!dentro) disponi() }, { passive: true })
scopri()
if (leggi()) prova()
else fuori()
// sul computer il campo prende il fuoco da solo (sul telefono no: si aprirebbe la tastiera sopra la macchinetta)
pronta.then(() => { if (!dentro && !buono && matchMedia('(hover:hover)').matches && document.activeElement === document.body) input?.focus({ preventScroll: true }) })
