// L'accesso a Deutschland (9.11.2026, Alberto: «/deutschland/ mostra la macchinetta da vicino che chiede la password;
// struttura sicura: repo pubblico, verifica a casa»; la sera: «più semplice entrare con tasti più grandi e più visibili»).
// La password non sta qui né su Vercel: il form la manda a POST /api/deutschland/ (il ponte di Vercel verso il pc di
// Alberto, C:\pzkko-server\deutschland\accesso.mjs), che se è quella giusta dà il biglietto {url, biglietto, scade, cdn}
// con cui si chiedono le foto (comune.js, rete.js). Il biglietto resta in localStorage: alla visita dopo si prova subito
// foto.json; 200 → dentro; 404 → scaduto, si dimentica e si richiede la password. Se il pc di Alberto è spento (503, o la
// rete tace) «la macchinetta è spenta». In locale (comune.js LOCALE) il server è quello aperto su 127.0.0.1:8790
// (DEUTSCHLAND_APERTO=1), senza password: se risponde si entra subito, se no il form con l'avviso «server locale spento».
// Il display della macchinetta è proiettato sui suoi angoli (muro.js proietta, muro-dati.js): sul computer il campo della
// password sta DENTRO il display (#ac-slot) e il tasto largo «ZIEHEN ▸» sotto il display (#ac-slot-ziehen); sul telefono
// campo, tasto e riga di stato stanno sotto la macchinetta nel flusso (#ac-modulo), grandi per il pollice: `disponi` li
// sposta al cambio di misura. Invio = ZIEHEN. Password giusta → la macchinetta sputa il pacchetto (una transizione sola)
// e si apre l'album (galleria.js). Qui si tiene anche il telo della vernice: chi arriva dal muro lo trova nero e lo vede
// scendere via (vernice.js scopri). Niente console.error nelle condizioni normali, server spento compreso (il bot dei bug
// le conta come errori).
import { LOCALE, stato, leggi, salva, dimentica, indirizzo, evento, ascolta } from './comune.js'
import dati from './muro-dati.js'
import { proietta } from './muro.js'

const API = '/api/deutschland/' // (con la barra finale: senza, Vercel risponde 308)
const SPENTA = 'la macchinetta è spenta: il pc di Alberto è spento'
const LOCALE_SPENTO = 'server locale spento (127.0.0.1:8790)'
const LOCALE_COME = 'server locale spento: DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs'
const SCADUTO = 'il biglietto è scaduto: la password, di nuovo'

const $ = (s) => document.querySelector(s)
const automat = $('#automat'), album = $('#album'), form = $('#accesso'), input = $('#ac-password'), riga = $('#ac-stato'), ziehen = $('#ac-ziehen'), occhio = $('#ac-occhio')
const corpo = $('.am-corpo'), schermo = $('#am-schermo'), slot = $('#ac-slot'), slotZiehen = $('#ac-slot-ziehen'), modulo = $('#ac-modulo'), campo = $('.ac-campo'), pacco = $('#am-pacco')
const telefono = matchMedia('(max-width:899px),(hover:none) and (pointer:coarse)') // (lo stesso di deutschland.css)
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches

/** La riga di stato: tipo = '' | 'male' | 'bene' | 'spenta' | 'attesa'. Mai «undefined» né «NaN» in pagina. */
function di(testo, tipo = '') { if (!riga) return; riga.textContent = String(testo ?? ''); if (tipo) riga.dataset.tipo = tipo; else delete riga.dataset.tipo }
const suono = (tipo) => import('/suono/interfaccia.js').then((s) => s.tasto?.(tipo)).catch(() => {})
const numero = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)

// lo schermo proiettato sugli angoli della foto; il tasto ZIEHEN sotto lo schermo, largo quanto lo schermo
if (corpo && schermo) proietta(corpo, schermo, dati.schermo)
if (slotZiehen && dati.schermo) {
  const xs = dati.schermo.map((p) => p[0]), ys = dati.schermo.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys)
  // tutto dentro la fascia fra il display e le vetrinette (~55 px sul pc: il tasto è alto 48–52, deutschland.css), un po'
  // più stretto del display
  const stretto = (x1 - x0) * 0.03
  Object.assign(slotZiehen.style, { left: `${(x0 + stretto) * 100}%`, top: `${(y1 + 0.003) * 100}%`, width: `${(x1 - x0 - 2 * stretto) * 100}%` })
}

/** Dove stanno campo, tasto e riga di stato: nel display e sotto (computer) o nel flusso sotto la macchinetta (telefono). */
function disponi() {
  if (!campo || !ziehen || !riga || !modulo) return
  if (telefono.matches) { modulo.append(campo, ziehen, riga) }
  else { slot?.append(campo, riga); slotZiehen?.append(ziehen) }
}
disponi()
telefono.addEventListener('change', disponi)

// l'occhio: mostra o nasconde la password
occhio?.addEventListener('click', () => {
  const mostra = input.type === 'password'
  input.type = mostra ? 'text' : 'password'
  occhio.setAttribute('aria-pressed', String(mostra))
  occhio.setAttribute('aria-label', mostra ? 'nascondi la password' : 'mostra la password')
  input.focus({ preventScroll: true })
})

let dentro = false, occupato = false, albumPronto = null, contaAttesa = 0

/** Dentro: l'album (galleria.js e i suoi moduli) e l'evento con il biglietto. */
async function entra() {
  dentro = true
  document.documentElement.classList.add('dentro')
  if (automat) automat.hidden = true
  if (album) album.hidden = false
  scrollTo({ top: 0, behavior: 'instant' })
  // (il modulo prima, l'evento dopo: così chi si mette in ascolto importandosi lo sente)
  albumPronto ??= import('./galleria.js').catch((e) => { albumPronto = null; console.warn('album non aperto (galleria.js)', e?.message ?? e) })
  await albumPronto
  evento('accesso', { url: stato.url, biglietto: stato.biglietto, scade: stato.scade, cdn: stato.cdn })
}

/** La macchinetta sputa il pacchetto: una transizione sola (.7 s), poi si entra. Con reduced-motion si entra e basta. */
function sputa() {
  if (!pacco || fermo()) return Promise.resolve()
  pacco.hidden = false
  return new Promise((ok) => {
    let fatto = false
    const fine = () => { if (fatto) return; fatto = true; pacco.hidden = true; pacco.classList.remove('sputa'); ok() }
    pacco.addEventListener('transitionend', fine, { once: true })
    setTimeout(fine, 900) // (se la transizione non parte, es. scheda nascosta)
    requestAnimationFrame(() => requestAnimationFrame(() => pacco.classList.add('sputa')))
  })
}

/** Fuori: la macchinetta col form (e un messaggio sul display, se c'è). */
function fuori(messaggio = '', tipo = '') {
  dentro = false
  document.documentElement.classList.remove('dentro')
  if (album) album.hidden = true
  if (automat) automat.hidden = false
  di(messaggio, tipo)
}

/** C'è un biglietto (o siamo in locale): il server delle foto risponde? */
async function prova() {
  try {
    const r = await fetch(indirizzo('foto.json'), { cache: 'no-cache' })
    if (r.ok) return entra()
    if (r.status === 404) { dimentica(); return fuori(LOCALE ? LOCALE_SPENTO : SCADUTO, LOCALE ? 'spenta' : 'male') }
    console.warn(`il server delle foto risponde ${r.status}`)
    return fuori(LOCALE ? LOCALE_SPENTO : SPENTA, 'spenta')
  } catch (e) {
    console.warn(LOCALE ? LOCALE_COME : 'la macchinetta è spenta: il server delle foto tace', e?.message ?? '')
    return fuori(LOCALE ? LOCALE_SPENTO : SPENTA, 'spenta')
  }
}

/** 429: «aspetta n s», con il conto alla rovescia; il campo intanto non si tocca. */
function aspetta(secondi) {
  clearInterval(contaAttesa)
  let n = Math.max(1, Math.round(secondi))
  const mostra = () => { di(`aspetta ${n} s`, 'attesa'); if (input) input.disabled = n > 0; if (ziehen) ziehen.disabled = n > 0 }
  mostra()
  contaAttesa = setInterval(() => { n--; if (n <= 0) { clearInterval(contaAttesa); di('', ''); if (input) { input.disabled = false; input.focus({ preventScroll: true }) } if (ziehen) ziehen.disabled = false } else mostra() }, 1000)
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (occupato || dentro) return
  const password = (input?.value ?? '').trim()
  suono('meccanico')
  if (!password) { di('scrivi la password', 'male'); input?.focus(); return }
  occupato = true
  form.classList.add('attesa'); ziehen?.classList.add('tirata')
  di('…')
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'entra', password }) })
    const d = await r.json().catch(() => ({}))
    if (r.ok && d && d.ok && d.url && d.biglietto) {
      salva({ url: d.url, biglietto: d.biglietto, scade: numero(d.scade, Date.now() + 6 * 3600e3), cdn: d.cdn })
      di('bitte schön', 'bene')
      if (input) input.value = ''
      await sputa()
      await entra()
    } else if (r.status === 401) {
      const restano = numero(d?.restano, null)
      di(restano === null ? 'non è quella' : `non è quella · restano ${restano}`, 'male')
      input?.select()
    } else if (r.status === 429) {
      const a = numero(d?.attesa, 60)
      aspetta(a > 1000 ? a / 1000 : a) // (secondi; se arrivano millisecondi si capisce dalla misura)
    } else if (r.status === 503 || r.status === 502 || r.status === 504 || (r.status === 404 && LOCALE)) {
      console.warn(`la macchinetta è spenta: ${API} risponde ${r.status}`)
      di(LOCALE && r.status === 404 ? 'in locale l’api non c’è: accendi il server aperto su 8790' : SPENTA, 'spenta')
    } else {
      console.warn(`${API} risponde ${r.status}`)
      di(SPENTA, 'spenta')
    }
  } catch (err) {
    console.warn('la macchinetta è spenta: la rete tace', err?.message ?? '')
    di(SPENTA, 'spenta')
  } finally {
    occupato = false
    form.classList.remove('attesa'); ziehen?.classList.remove('tirata')
  }
})
// il tasto si vede schiacciato anche col dito fermo sopra
ziehen?.addEventListener('pointerdown', () => ziehen.classList.add('tirata'), { passive: true })
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) ziehen?.addEventListener(ev, () => { if (!occupato) ziehen.classList.remove('tirata') }, { passive: true })

// il server ha risposto 404 a una foto: biglietto scaduto o cambiato → si richiede la password
ascolta('uscita', () => { dimentica(); fuori(SCADUTO, 'male') })

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
scopri()
if (leggi()) prova()
else fuori()
// sul computer il campo prende il fuoco da solo (sul telefono no: si aprirebbe la tastiera sopra la macchinetta)
pronta.then(() => { if (!dentro && matchMedia('(hover:hover)').matches && document.activeElement === document.body) input?.focus({ preventScroll: true }) })
