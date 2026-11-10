// La «Packung» di Deutschland (9.11.2026 notte, «Deutschland 3»): l'album di un pacchetto IN SOVRAPPOSIZIONE al tavolo.
// Alberto: «le sigarette si aprono album in sovrapposizione solo con quelle foto del pacchetto», «ovviamente album con tutto
// ci sarà» (JMA = tutte le foto). Si apre da un pacchetto del tavolo («deutschland:pacco» {tag}), da un tasto 2–8 della
// macchinetta (accesso.js, lo stesso evento), o da un timbro della mappa quando l'album è chiuso («deutschland:vai» {id}:
// le foto di quel posto). È #packung di index.html, a tutto schermo sopra al tavolo: in testa il pacchetto, il suo nome
// nel suo carattere e quante foto, i cartelli «Scegli foto» · «Salva scelte» (in italiano dal 10.11: in tedesco non si capivano) · KARTE e la ✕; sotto #pk-scorre con l'album (album.js,
// che riceve «deutschland:packung» {aperta} e poi «deutschland:filtro» {tag,posto}).
// La storia del browser: aprire mette #p=<tag> (#p=alles per JMA, #p=@<posto> per un posto), così «indietro» sul telefono
// chiude l'album e un link con #p= lo apre; il visore sopra mette il suo #f= e tornando indietro si ritrova #p=. Esc
// chiude (se il visore e la mappa sono chiusi). Una transizione sola all'apertura; il tavolo sotto non scorre.

import { evento, ascolta } from './comune.js'
import { paccoDi, immagineDi, conteggi, SEGNAPOSTO } from './filtri.js'
import { inScelta } from './condividi.js'

let el, scorre, nome, conta, img, scatola, auswahl, m, perTag = new Map(), posti = new Map(), aperta = null, spinto = false, richiesta = null

const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches
const chiave = ({ tag = null, posto = null } = {}) => (posto ? `@${posto}` : tag ?? 'alles')
const daChiave = (k) => (k?.startsWith('@') ? { tag: null, posto: k.slice(1) } : { tag: !k || k === 'alles' ? null : k, posto: null })
const leggiHash = () => { const r = /^#p=([@a-z0-9-]+)$/i.exec(location.hash); return r ? decodeURIComponent(r[1]) : null }

/** Apre l'album di un pacchetto (tag) o di un posto. `storia` = mettere #p= nella storia del browser. */
function apri(cosa, { storia = true } = {}) {
  if (!m) { richiesta = cosa; return }
  const k = chiave(cosa)
  const { tag, posto } = daChiave(k)
  const p = posto ? null : paccoDi(tag)
  const luogo = posto ? posti.get(posto) : null
  if (posto && !luogo) return
  // la testa: il pacchetto nel suo carattere e colore, o il timbro rosso del posto
  el.style.setProperty('--c', p?.colore ?? '#dd0000')
  el.style.setProperty('--t', p?.testo ?? '#fff')
  el.style.setProperty('--f', p?.font ?? '"Oswald", Impact, sans-serif')
  el.classList.toggle('di-posto', !!posto)
  nome.textContent = posto ? luogo.nome || luogo.nomeAuto || posto : p.nome
  if (p) { img.onerror = () => { img.onerror = null; img.src = SEGNAPOSTO }; img.src = immagineDi(p); img.hidden = false } else { img.removeAttribute('src'); img.hidden = true }
  const n = posto ? m.foto.filter((f) => f.posto === posto).length : perTag.get(tag) ?? 0
  conta.textContent = `${n} ${n === 1 ? 'Erinnerung' : 'Erinnerungen'}${p && !p.tag ? ' · alles' : ''}`
  const gia = aperta !== null
  aperta = k
  el.hidden = false
  document.documentElement.classList.add('in-packung')
  if (!gia && !fermo()) { el.classList.remove('entra'); void el.offsetWidth; el.classList.add('entra') }
  // prima si scopre (album.js misura la larghezza), poi il filtro
  evento('packung', { aperta: true, tag, posto })
  evento('filtro', { tag, posto })
  scorre.scrollTop = 0
  if (storia && leggiHash() !== k) {
    if (gia && spinto) history.replaceState(null, '', `#p=${k}`)
    else { history.pushState(null, '', `#p=${k}`); spinto = true }
  }
  el.querySelector('.pk-chiudi')?.focus({ preventScroll: true })
}

/** Chiude l'album e torna al tavolo. */
function chiudi({ storia = true } = {}) {
  if (aperta === null) return
  aperta = null
  if (inScelta()) evento('scegli') // (la scelta multipla si chiude con l'album)
  el.hidden = true
  el.classList.remove('entra')
  document.documentElement.classList.remove('in-packung')
  evento('packung', { aperta: false })
  if (storia && leggiHash()) {
    if (spinto) { spinto = false; history.back() } else history.replaceState(null, '', location.pathname + location.search)
  }
}

/** L'indirizzo è cambiato (indietro, avanti, un link): #p= apre, niente chiude, #f= (il visore) lascia com'è. */
function daHash() {
  if (/^#f=/.test(location.hash)) return
  const k = leggiHash()
  if (k) { if (k !== aperta) apri(daChiave(k), { storia: false }) }
  else if (aperta !== null) { spinto = false; chiudi({ storia: false }) }
}

export function avvia(manifesto) {
  el = document.getElementById('packung')
  if (!el) return
  scorre = document.getElementById('pk-scorre')
  nome = document.getElementById('pk-nome'); conta = document.getElementById('pk-conta'); img = document.getElementById('pk-pacco'); scatola = document.getElementById('pk-scatola')
  auswahl = el.querySelector('[data-azione="auswahl"]')
  m = manifesto
  perTag = conteggi(manifesto)
  posti = new Map(manifesto.posti.map((p) => [p.id, p]))
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-azione]')
    if (!t) return
    const a = t.dataset.azione
    if (a === 'chiudi') chiudi()
    else if (a === 'auswahl') evento('scegli')
    else if (a === 'speichern') evento('speichern')
    else if (a === 'karte') evento('karte', { aperta: true })
  })
  ascolta('scelta', ({ attiva }) => auswahl?.setAttribute('aria-pressed', String(!!attiva)))
  ascolta('conta', ({ n }) => { if (aperta !== null) conta.textContent = `${n} ${n === 1 ? 'Erinnerung' : 'Erinnerungen'}${aperta === 'alles' ? ' · alles' : ''}` })
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || aperta === null) return
    if (document.getElementById('visore')?.open || document.documentElement.classList.contains('karte-aperta') || inScelta()) return
    chiudi()
  })
  addEventListener('hashchange', daHash)
  addEventListener('popstate', daHash)
  if (richiesta) { const r = richiesta; richiesta = null; apri(r) }
  else daHash() // arrivati con #p=… nell'indirizzo
}

// ascolta subito (anche prima del manifesto: accesso.js può chiedere un pacchetto appena si entra)
ascolta('pacco', ({ tag }) => apri({ tag: tag ?? null }))
// un timbro della mappa (è l'unico che manda «vai»: le tappe dei capitoli scorrono dentro album.js): SEMPRE l'album di
// quel posto, anche con un altro album già aperto (prima lo cercava dentro quello aperto e dal secondo timbro in poi non
// succedeva niente: Alberto, «va 1 volta poi non va più»). Sul telefono la mappa si chiude, sopra non si vedrebbe
ascolta('vai', ({ id }) => {
  if (!id) return
  if (aperta !== `@${id}`) apri({ posto: id })
  if (innerWidth < 900) evento('karte', { aperta: false })
})
ascolta('automat', () => chiudi())
