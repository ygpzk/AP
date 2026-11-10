// L'accesso a Deutschland (9.11.2026, Alberto: «/deutschland/ mostra la macchinetta da vicino che chiede la password;
// struttura sicura: repo pubblico, verifica a casa»; la sera: «più semplice entrare con tasti più grandi e più visibili»;
// la notte, «Deutschland 3»: «il tasto dell'accesso deve essere della macchinetta gigante, non tuo messo così a caso»,
// «deve avere la luce vera», «metti tasto torna alla macchinetta»).
// La password non sta qui né su Vercel: il form la manda a POST /api/deutschland/ (il ponte di Vercel verso il pc di
// Alberto, C:\pzkko-server\deutschland\accesso.mjs), che se è quella giusta dà il biglietto {url, biglietto, scade, cdn}
// con cui si chiedono le foto (comune.js, rete.js). Il biglietto resta in localStorage: alla visita dopo si prova subito
// foto.json; 200 → dentro; 404 → scaduto, si dimentica e si richiede la password. Se il pc di Alberto è spento (503, o la
// rete tace) «la macchinetta è spenta». In locale (comune.js LOCALE) il server è quello aperto su 127.0.0.1:8790
// (DEUTSCHLAND_APERTO=1), senza password: se risponde si entra subito, se no il form con l'avviso «server locale spento».
// Il display della macchinetta è proiettato sui suoi angoli (muro.js proietta, muro-dati.js) e il campo della password ci
// sta DENTRO, sul computer e sul telefono. Si manda coi TASTI VERI della foto: otto bottoni trasparenti sopra i tasti 1–8
// (muro-dati.js `tasti`, #am-tasti), col bordo che si schiaccia (ombra dentro) e la luce gialla su quello scelto; Invio
// = il tasto 1. Password giusta → la macchinetta sputa il pacchetto di QUEL tasto dalla bocchetta (una transizione sola)
// e si entra: il tasto 1 (JMA) apre il tavolo dei ricordi, gli altri anche l'album del loro pacchetto sopra al tavolo
// («deutschland:pacco» {tag}, packung.js). Dal tavolo, «◂ Automat» («deutschland:automat») riporta qui: col biglietto
// ancora buono il display dice «BITTE WÄHLEN» e basta un tasto, senza password.
// LA LUCE (#am-luce): insegna ZIGARETTEN e vetrinette accese da dietro (color-dodge: si schiariscono le parti chiare, il
// nero resta nero), l'alone verde del display sul metallo, il led dell'Altersnachweis, la luce delle vetrinette che cade
// sui tasti; si accendono UNA volta all'arrivo, con lo sfarfallio dei neon (niente che giri dopo: memoria pzkko-leggero).
// Qui si tiene anche il telo della vernice: chi arriva dal muro lo trova nero e lo vede scendere via (vernice.js scopri).
// Niente console.error nelle condizioni normali, server spento compreso (il bot dei bug le conta come errori).
import { LOCALE, stato, leggi, salva, dimentica, indirizzo, evento, ascolta } from './comune.js'
import dati from './muro-dati.js'
import { proietta } from './muro.js'

const API = '/api/deutschland/' // (con la barra finale: senza, Vercel risponde 308)
const SPENTA = 'la macchinetta è spenta: il pc di Alberto è spento'
const LOCALE_SPENTO = 'server locale spento (127.0.0.1:8790)'
const LOCALE_COME = 'server locale spento: DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs'
const SCADUTO = 'il biglietto è scaduto: la password, di nuovo'
/** I pacchetti nelle otto vetrinette della foto, da sinistra (schermo.mjs li ha composti così): tag del filtro e immagine. */
const VETRINE = [
  { tag: null, img: 'alles', nome: 'JMA: il tavolo dei ricordi' },
  { tag: 'pekko', img: 'pekko', nome: 'luckypzkko: le foto di Pekko' },
  { tag: 'mikas', img: 'mikas', nome: 'Mikas’s Smoke: le foto di Mikas' },
  { tag: 'jonny', img: 'jonny', nome: 'Jonny’s Tobacco: le foto di Jonny' },
  { tag: 'jella', img: 'jella', nome: 'Jella Leicht: le foto di Jella' },
  { tag: 'alcool', img: 'alcool', nome: 'Jäger Hirsch 56: l’alcool' },
  { tag: 'foto', img: 'foto', nome: 'Südkurve: tutte le foto' },
  { tag: 'video', img: 'video', nome: 'Cannstatter: i video' },
]
// Le altre cose accese della foto (automat-grande.webp, in frazioni; misurate a occhio sulla foto a 1028 × 1641): l'insegna
// ZIGARETTEN, il led verde dell'Altersnachweis, la bocchetta da cui cade il pacchetto
const INSEGNA = [0.108, 0.04, 0.752, 0.077], LED = [0.919, 0.414], BOCCHETTA = [0.18, 0.803, 0.606, 0.093]

const $ = (s) => document.querySelector(s)
const automat = $('#automat'), album = $('#album'), form = $('#accesso'), input = $('#ac-password'), riga = $('#ac-stato'), occhio = $('#ac-occhio')
const corpo = $('.am-corpo'), schermo = $('#am-schermo'), luce = $('#am-luce'), tastiEl = $('#am-tasti'), pacco = $('#am-pacco'), led = $('#ac-led'), ledSotto = $('#ac-led-sotto')
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches
const pc = (v) => `${(v * 100).toFixed(3)}%`

/** La riga di stato: tipo = '' | 'male' | 'bene' | 'spenta' | 'attesa'. Mai «undefined» né «NaN» in pagina. */
function di(testo, tipo = '') { if (!riga) return; riga.textContent = String(testo ?? ''); if (tipo) riga.dataset.tipo = tipo; else delete riga.dataset.tipo }
const suono = (tipo) => import('/suono/interfaccia.js').then((s) => s.tasto?.(tipo)).catch(() => {})
const numero = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
const rettangolo = (cls, [x, y, w, h], stile = {}) => { const e = document.createElement('i'); e.className = cls; Object.assign(e.style, { left: pc(x), top: pc(y), width: pc(w), height: pc(h), ...stile }); return e }

// lo schermo proiettato sugli angoli della foto
if (corpo && schermo) proietta(corpo, schermo, dati.schermo)

// ── la luce: insegna, vetrinette, alone del display, led, la luce che cade sui tasti ──
if (luce) {
  const pezzi = []
  const [ix, iy, iw, ih] = INSEGNA
  pezzi.push(rettangolo('luce-alone', [ix - iw * 0.06, iy - ih * 0.5, iw * 1.12, ih * 2]))
  pezzi.push(rettangolo('luce-insegna', INSEGNA))
  if (dati.schermo) {
    const xs = dati.schermo.map((p) => p[0]), ys = dati.schermo.map((p) => p[1])
    pezzi.push(rettangolo('luce-schermo', [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]))
  }
  for (const v of dati.vetrine ?? []) pezzi.push(rettangolo('luce-vetrina', v))
  if (dati.vetrine?.length && dati.tasti?.length) {
    const x0 = Math.min(...dati.vetrine.map((v) => v[0])), x1 = Math.max(...dati.vetrine.map((v) => v[0] + v[2]))
    const y0 = Math.max(...dati.vetrine.map((v) => v[1] + v[3])), y1 = Math.max(...dati.tasti.map((t) => t[1] + t[3]))
    pezzi.push(rettangolo('luce-cade', [x0 - 0.01, y0, x1 - x0 + 0.02, y1 - y0 + 0.01]))
  }
  pezzi.push(rettangolo('luce-led', [LED[0] - 0.02, LED[1] - 0.0125, 0.04, 0.025]))
  luce.append(...pezzi)
  // si accende una volta, quando la foto c'è (lo sfarfallio dei neon è un'animazione sola, poi resta accesa)
  const foto = $('.am-foto')
  const accendi = () => requestAnimationFrame(() => luce.classList.add('accesa'))
  if (foto?.complete) accendi(); else foto?.addEventListener('load', accendi, { once: true }), foto?.addEventListener('error', accendi, { once: true })
}

// ── i tasti veri 1–8 ──
const tasti = (dati.tasti ?? []).map((t, k) => {
  const v = VETRINE[k] ?? VETRINE[0]
  const b = document.createElement('button')
  b.type = 'submit'
  b.className = 'am-tasto'
  b.dataset.n = String(k + 1)
  b.dataset.suonoNo = ''
  b.setAttribute('aria-label', `tasto ${k + 1}: ${v.nome}`)
  b.title = `${k + 1} · ${v.nome}`
  Object.assign(b.style, { left: pc(t[0]), top: pc(t[1]), width: pc(t[2]), height: pc(t[3]) })
  // si vede schiacciato anche col dito fermo sopra
  b.addEventListener('pointerdown', () => b.classList.add('premuto'), { passive: true })
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { if (!occupato) b.classList.remove('premuto') }, { passive: true })
  return b
})
tastiEl?.append(...tasti)
const tastoN = (n) => tasti[n - 1] ?? tasti[0]

// l'occhio: mostra o nasconde la password
occhio?.addEventListener('click', () => {
  const mostra = input.type === 'password'
  input.type = mostra ? 'text' : 'password'
  occhio.setAttribute('aria-pressed', String(mostra))
  occhio.setAttribute('aria-label', mostra ? 'nascondi la password' : 'mostra la password')
  input.focus({ preventScroll: true })
})

let dentro = false, occupato = false, albumPronto = null, contaAttesa = 0, scegli = false

/** Il display: «PASSWORT» col campo, o «BITTE WÄHLEN» senza (si torna dal tavolo col biglietto ancora buono). */
function modo(soloTasto) {
  scegli = !!soloTasto
  form?.classList.toggle('scegli', scegli)
  if (led) led.textContent = scegli ? 'BITTE WÄHLEN' : 'PASSWORT'
  if (ledSotto) ledSotto.textContent = scegli ? 'TASTE 1–8 DRÜCKEN ▼' : 'DANN TASTE DRÜCKEN ▼'
}

/** Dentro: il tavolo (galleria.js e i suoi moduli) e l'evento con il biglietto; n = il tasto premuto (2–8: anche l'album
 *  del suo pacchetto). */
async function entra(n = 1) {
  dentro = true
  document.documentElement.classList.add('dentro')
  if (automat) automat.hidden = true
  if (album) album.hidden = false
  for (const t of tasti) t.classList.remove('scelto', 'premuto')
  scrollTo({ top: 0, behavior: 'instant' })
  // (il modulo prima, l'evento dopo: così chi si mette in ascolto importandosi lo sente)
  albumPronto ??= import('./galleria.js').catch((e) => { albumPronto = null; console.warn('album non aperto (galleria.js)', e?.message ?? e) })
  await albumPronto
  evento('accesso', { url: stato.url, biglietto: stato.biglietto, scade: stato.scade, cdn: stato.cdn })
  const v = VETRINE[n - 1]
  if (v?.tag) evento('pacco', { tag: v.tag })
}

/** La macchinetta sputa il pacchetto del tasto n dalla bocchetta: una transizione sola (.7 s), poi si entra. Con
 *  reduced-motion si entra e basta. */
function sputa(n = 1) {
  if (!pacco || fermo()) return Promise.resolve()
  pacco.src = `/art/deutschland/pacchi/${(VETRINE[n - 1] ?? VETRINE[0]).img}.webp`
  pacco.hidden = false
  return new Promise((ok) => {
    let fatto = false
    const fine = () => { if (fatto) return; fatto = true; pacco.hidden = true; pacco.classList.remove('sputa'); ok() }
    pacco.addEventListener('transitionend', fine, { once: true })
    setTimeout(fine, 900) // (se la transizione non parte, es. scheda nascosta)
    requestAnimationFrame(() => requestAnimationFrame(() => pacco.classList.add('sputa')))
  })
}

/** Fuori: la macchinetta (col campo, o solo coi tasti se il biglietto è buono) e un messaggio sul display, se c'è. */
function fuori(messaggio = '', tipo = '', soloTasto = false) {
  dentro = false
  document.documentElement.classList.remove('dentro')
  if (album) album.hidden = true
  if (automat) automat.hidden = false
  modo(soloTasto)
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
  const blocca = (si) => { if (input) input.disabled = si; for (const t of tasti) t.disabled = si }
  const mostra = () => { di(`aspetta ${n} s`, 'attesa'); blocca(n > 0) }
  mostra()
  contaAttesa = setInterval(() => { n--; if (n <= 0) { clearInterval(contaAttesa); di('', ''); blocca(false); input?.focus({ preventScroll: true }) } else mostra() }, 1000)
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (occupato || dentro) return
  const n = Math.min(8, Math.max(1, +(e.submitter?.dataset?.n || 1) || 1))
  const tasto = tastoN(n)
  suono('meccanico')
  // col biglietto ancora buono (tornati dal tavolo) basta il tasto
  if (scegli && (stato.biglietto || LOCALE)) {
    occupato = true
    tasto?.classList.add('scelto')
    di('bitte schön', 'bene')
    await sputa(n)
    occupato = false
    return entra(n)
  }
  const password = (input?.value ?? '').trim()
  if (!password) { tasto?.classList.remove('premuto'); di('prima la password, poi il tasto', 'male'); input?.focus(); return }
  occupato = true
  form.classList.add('attesa'); tasto?.classList.add('premuto')
  di('…')
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'entra', password }) })
    const d = await r.json().catch(() => ({}))
    if (r.ok && d && d.ok && d.url && d.biglietto) {
      salva({ url: d.url, biglietto: d.biglietto, scade: numero(d.scade, Date.now() + 6 * 3600e3), cdn: d.cdn })
      di('bitte schön', 'bene')
      tasto?.classList.add('scelto')
      if (input) input.value = ''
      await sputa(n)
      occupato = false
      await entra(n)
      return
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
    form.classList.remove('attesa')
    if (!dentro) for (const t of tasti) t.classList.remove('premuto')
  }
})

// il server ha risposto 404 a una foto: biglietto scaduto o cambiato → si richiede la password
ascolta('uscita', () => { dimentica(); fuori(SCADUTO, 'male') })
// «◂ Automat» dal tavolo: si torna qui; col biglietto buono basta un tasto
ascolta('automat', () => {
  fuori('', '', Boolean(stato.biglietto || LOCALE))
  scrollTo({ top: 0, behavior: 'instant' })
})

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
pronta.then(() => { if (!dentro && !scegli && matchMedia('(hover:hover)').matches && document.activeElement === document.body) input?.focus({ preventScroll: true }) })
