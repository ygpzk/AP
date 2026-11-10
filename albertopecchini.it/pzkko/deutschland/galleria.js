// Dentro Deutschland (9.11.2026, «Deutschland 2»; la notte «Deutschland 3», il tavolo dei ricordi): le foto del viaggio a
// Monaco e Stoccarda con Mikas, Jonny e Jella, dopo la password. Questo modulo lo importa accesso.js
// (import('/deutschland/galleria.js')) quando il biglietto c'è: scarica il manifesto foto.json dal server (comune.js:
// indirizzo), lo passa ai pezzi e li avvia:
//   tavolo.js     il tavolo dei ricordi: le foto migliori sparse a mano, i pacchetti, i meme, gli sticker (si vede subito)
//   packung.js    l'album di un pacchetto (o di un posto) in sovrapposizione al tavolo
//   album.js      dentro la sovrapposizione: i capitoli per giorno e le righe giustificate, lo scroll che muove la mappa
//   filtri.js     i 16 pacchetti (solo i dati)
//   visore.js     la foto grande con la didascalia e i due tasti grandi di salvataggio
//   condividi.js  la scelta multipla (tocco lungo o «Scegli foto» nell'album) e «salva tutte»
//   mappa.js      Leaflet dentro il foglio di carta che entra dal lato, con la GLA: si carica SOLO qui, dopo l'accesso
//   rete.js       tutte le immagini passano di lì (cache, coda, fasci): qui si avvia il prefetch in idle dell'album
// Qui stanno anche la barra alta del tavolo («◂ AUTOMAT» torna alla macchinetta, KARTE apre la mappa) con la riga «album
// scaricato al 62 %», e l'apri-e-chiudi della mappa: il foglio entra da destra (.aperta), col velo dietro e la linguetta
// KARTE sul bordo («deutschland:karte» {aperta}; mappa.js poi la inquadra). Il foglio di stile (galleria.css, pacchi.css) lo
// aggiunge lui se manca, così la pagina chiusa non lo scarica. Se il server risponde 404 (biglietto scaduto o cambiato) o
// non risponde: evento «uscita», accesso.js riapre il form.

import { stato, indirizzo, evento, ascolta } from './comune.js'
import * as rete from './rete.js'
import * as album from './album.js'
import * as tavolo from './tavolo.js'
import * as packung from './packung.js'
import * as visore from './visore.js'
import * as condividi from './condividi.js'

const QUI = new URL('.', import.meta.url)
let inCorso = false, partita = false

/** Aggiunge un foglio di stile (una volta sola) e aspetta che sia caricato. */
function foglio(nome) {
  const href = new URL(nome, QUI).href
  // (index.html li mette già in fondo al body: allora non si rifà niente)
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href === href)) return Promise.resolve()
  return new Promise((r) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = () => r(); document.head.append(l) })
}

/** Il manifesto dal server, o null (e l'evento «uscita») se non si può. */
async function manifesto() {
  let r
  try { r = await fetch(indirizzo('foto.json'), { credentials: 'omit' }) }
  catch (e) { console.warn('deutschland: il server delle foto non risponde', e?.message ?? e); evento('uscita', { motivo: 'rete' }); return null }
  if (!r.ok) { console.warn(`deutschland: foto.json ha risposto ${r.status}`); evento('uscita', { motivo: String(r.status) }); return null }
  try { return await r.json() } catch (e) { console.warn('deutschland: foto.json non è JSON', e?.message ?? e); evento('uscita', { motivo: 'json' }); return null }
}

/** La barra alta del tavolo, la linguetta e il velo della mappa, e l'apri-e-chiudi del foglio. */
function barra() {
  const b = document.getElementById('al-barra')
  if (!b || b.dataset.pronta) return
  b.dataset.pronta = '1'
  const foglioMappa = document.getElementById('mappa-foglio'), velo = document.getElementById('karte-velo'), linguetta = document.getElementById('karte-linguetta')
  const tastiKarte = () => document.querySelectorAll('#al-barra [data-azione="karte"], #karte-linguetta')
  const aperta = () => foglioMappa?.classList.contains('aperta')
  b.addEventListener('click', (e) => {
    const t = e.target.closest('[data-azione]')
    if (!t) return
    if (t.dataset.azione === 'automat') { evento('karte', { aperta: false }); evento('automat') }
    else if (t.dataset.azione === 'karte') evento('karte', { aperta: !aperta() })
  })
  linguetta?.addEventListener('click', () => evento('karte', { aperta: !aperta() }))
  velo?.addEventListener('click', () => evento('karte', { aperta: false }))
  foglioMappa?.querySelector('.mf-chiudi')?.addEventListener('click', () => evento('karte', { aperta: false }))
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && aperta() && !document.getElementById('visore')?.open) evento('karte', { aperta: false }) })
  ascolta('karte', ({ aperta: si }) => {
    if (!foglioMappa) return
    foglioMappa.classList.toggle('aperta', !!si)
    foglioMappa.setAttribute('aria-hidden', String(!si))
    foglioMappa.inert = !si
    if (velo) velo.hidden = !si
    document.documentElement.classList.toggle('karte-aperta', !!si)
    for (const k of tastiKarte()) k.setAttribute('aria-pressed', String(!!si))
    if (si) foglioMappa.querySelector('.mf-chiudi')?.focus({ preventScroll: true })
  })
  if (foglioMappa) foglioMappa.inert = true
  if (linguetta) linguetta.hidden = false
  // «album scaricato al 62 %» (rete.js, prefetch dei fasci in idle); a 100 % la riga se ne va
  const riga = document.getElementById('al-scaricato')
  if (riga) {
    const barretta = riga.querySelector('i'), testo = riga.querySelector('span')
    ascolta('scaricato', ({ percento, totale }) => {
      if (!totale || percento >= 100) { riga.hidden = true; return }
      riga.hidden = false
      barretta.style.width = `${Math.max(0, Math.min(100, percento))}%`
      testo.textContent = `album scaricato al ${Math.round(percento)} %`
    })
  }
}

/** Parte (una volta): manifesto → stile → pezzi → Leaflet. */
export async function parti() {
  if (inCorso || partita || !stato.url) return
  inCorso = true
  const m = await manifesto()
  if (!m) { inCorso = false; return }
  m.foto ??= []; m.posti ??= []; m.tappe ??= []; m.tag ??= []
  evento('manifesto', { manifesto: m })
  await Promise.all([foglio('galleria.css'), foglio('pacchi.css')])
  const a = document.getElementById('album')
  if (a) a.hidden = false
  try { await rete.pulisci?.(String(m.v ?? 1)) } catch {}
  barra()
  album.avvia(m)
  tavolo.avvia(m)
  visore.avvia(m)
  condividi.avvia(m)
  packung.avvia(m)
  partita = true; inCorso = false
  // Leaflet solo adesso: prima il foglio, poi lo script (UMD: si mette su window.L), poi la mappa
  try {
    await foglio('lib/leaflet/leaflet.css')
    await import('./lib/leaflet/leaflet.js')
    if (!window.L) throw new Error('Leaflet non si è messo su window.L')
    const mappa = await import('./mappa.js')
    mappa.avvia(m, window.L)
  } catch (e) {
    console.warn('deutschland: la mappa non parte', e?.message ?? e)
    const el = document.getElementById('mappa')
    if (el) el.innerHTML = '<p class="mappa-ferma">la mappa non si carica</p>'
  }
  // il resto dell'album in tasca, in idle (fasci; col manifesto v1 non c'è niente da fare)
  try { rete.precarica?.(m) } catch (e) { console.warn('deutschland: prefetch non partito', e?.message ?? e) }
}

ascolta('accesso', () => { parti() })
// fuori (alla macchinetta) la linguetta della mappa non c'è
ascolta('automat', () => { const l = document.getElementById('karte-linguetta'); if (l) l.hidden = true })
ascolta('accesso', () => { const l = document.getElementById('karte-linguetta'); if (l && partita) l.hidden = false })
parti()
