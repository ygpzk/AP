// Il messaggio d'ingresso (23.10.2026 notte): entrando nella home (solo lì), una volta per versione, esce lo SCONTRINO delle novità e
// di tutto quello che c'è sul sito, stampato in Fake Receipt come quello dello shop del cercapersone. Si chiude toccando
// fuori o con Esc (niente «×»); niente animazioni (Alberto: niente transizioni non chieste). Parte solo a pagina caricata
// e quando il browser è libero, così non rallenta l'apertura; se è aperta un'altra finestra (un gioco) aspetta; se il 3D
// si sta preparando aspetta che la strada si veda. Gli strumenti che fotografano la pagina non lo vedono
// (navigator.webdriver), se non con ?novita, che lo fa vedere sempre (anche a chi l'ha già letto).
//
// Per una versione nuova: VERSIONE, NOME e le righe di NOVITA (e di C_E_ANCHE, se il sito ha cose nuove per sempre).
// Dalla 3.0.1 alla 4.0.0 c'era anche «come si accende il 3D»; dalla 4.1.0 (6.11) il sito è solo in 2D e non c'è più.

// La 4.1.0 (6.11): la saracinesca alleggerita, i social rifatti, solo 2D. (La 4.0.0, 1.11, «chiocciola zero»: il
// cercapersone zero per tutti, la banca sul server, virtual, la miniera e le app di pzk os.)
export const VERSIONE = '4.1.0'
export const NOME = 'serranda leggera'
const CHIAVE = 'pzkko-novita' // l'ultima versione di cui si è letto lo scontrino

// [cosa, prezzo]: le novità di questa versione
const NOVITA = [
  ['la saracinesca alleggerita: restano i social e la petizione', 'nuovo'],
  ['i volantini dei social rifatti: più piccoli, ognuno col suo carattere', 'nuovo'],
  ['sul telefono ce ne stanno tre per riga', 'nuovo'],
  ['la petizione in fondo, sopra tutto: le penne dondolano sempre', 'nuovo'],
  ['molto più leggero: a pagina ferma il computer riposa, le ventole pure', 'nuovo'],
  ['i giochi si aprono dai gadget (in alto) e dal cercapersone', 'spostati'],
  ['la strada in 3D è spenta: il sito è solo in 2D', 'addio'],
]
// [cosa, prezzo]: quello che c'è sul sito
const C_E_ANCHE = [
  ['il muro: i social coi tagliandi da strappare, e la petizione', 'incluso'],
  ['sei giochi coi $pzk: roulette, blackjack, mine, dado, testa o croce, virtual', 'incluso'],
  ['il wallet: conto con nome e PIN, indirizzo pzk, invii agli amici', 'incluso'],
  ['la borsa PZK/EUR€ e gli euroshit da parcheggiare', 'incluso'],
  ['le banconote per terra, il sussidio, il regalo di Instagram', 'incluso'],
  ['il cercapersone zero: chat col bot, shop, sfide, quiz, quest, giocatori, zaino, foto e le altre app', 'incluso'],
  ['la petizione: «pzkko.it è un bel sito?», con la penna', 'incluso'],
  ['la regia (scrivi «regia»): ora, sera, strada, suoni', 'incluso'],
  ['i suoni della strada, sintetizzati dal vivo', 'incluso'],
  ['la storia vera della saracinesca, e lo strumento per le lezioni', 'incluso'],
]

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const letto = () => { try { return localStorage.getItem(CHIAVE) } catch { return null } }
const segna = () => { try { localStorage.setItem(CHIAVE, VERSIONE) } catch {} }
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
const libero = () => new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 300)))

function stile() {
  return new Promise((ok) => {
    if (document.querySelector('link[data-benvenuto]')) return ok()
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL('./benvenuto.css', import.meta.url).href; l.setAttribute('data-benvenuto', '')
    l.onload = l.onerror = () => ok()
    document.head.appendChild(l)
  })
}

const righe = (l) => `<ul>${l.map(([cosa, prezzo]) => `<li><span>${esc(cosa)}</span><b>${esc(prezzo)}</b></li>`).join('')}</ul>`

/** Apre lo scontrino (anche se l'hai già letto). */
export async function apri() {
  await stile()
  const ora = new Date()
  const d = document.createElement('dialog')
  d.className = 'benvenuto'
  d.setAttribute('aria-label', `le novità di pzkko.it, versione ${VERSIONE}`)
  d.innerHTML = `<article class="bv-scontrino">
    <header>
      <h2>pzkko.it</h2>
      <p>il muro di Alberto · Mantova</p>
      <p class="bv-ver">versione ${VERSIONE} «${NOME}»</p>
      <p>${ora.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
      <p class="bv-chiudi">tocca fuori per chiudere</p>
    </header>
    <hr>
    <h3>novità</h3>${righe(NOVITA)}
    <hr>
    <h3>c’è anche</h3>${righe(C_E_ANCHE)}
    <hr>
    <div class="bv-tot"><span>totale</span><b>0,00 $pzk</b></div>
    <div class="bv-iva"><span>di cui iva</span><b>la lumachina</b></div>
    <hr>
    <p class="bv-pie">grazie e arrivederci<br>conservare lo scontrino</p>
  </article>`
  document.body.appendChild(d)
  // fuori dallo scontrino (il dialog è grande quanto la finestra, lo scontrino sta nel mezzo) si chiude; Esc pure
  d.addEventListener('click', (e) => { if (e.target === d) d.close() })
  d.addEventListener('close', () => { segna(); d.remove() }, { once: true })
  d.showModal()
  d.querySelector('.bv-scontrino').focus?.({ preventScroll: true })
}

async function forseApri() {
  const forza = new URLSearchParams(location.search).has('novita')
  if (!/^\/(index\.html)?$/.test(location.pathname)) return // solo sulla home (la storia e la 404 nascono da index.html e hanno la stessa riga)
  if (!forza && (navigator.webdriver || letto() === VERSIONE)) return
  if (document.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }))
  await libero()
  // se il 3D si sta preparando, quando la strada si vede; se c'è un'altra finestra aperta (un gioco), quando si chiude
  for (let i = 0; i < 120; i++) {
    const r = document.documentElement
    const occupato = (r.classList.contains('scena-carico') && !r.classList.contains('scena-vista')) || document.querySelector('dialog[open]')
    if (!occupato) break
    await dorm(1000)
  }
  if (document.querySelector('dialog[open]')) return
  apri()
}
forseApri()
