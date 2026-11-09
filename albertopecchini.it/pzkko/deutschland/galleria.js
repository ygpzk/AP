// La galleria di Deutschland (9.11.2026): le foto del viaggio a Monaco e Stoccarda con Mikas, Jonny e Jella, dopo la
// password. Alberto: «4 colonne di foto e 5 righe sempre visibili», «copia sistema waze map con la macchinina», «salva sul
// rullino diretto», «no file e no zip». Questo modulo lo importa accesso.js (import('/deutschland/galleria.js')) quando il
// biglietto c'è: scarica il manifesto foto.json dal server di casa (comune.js: indirizzo), lo passa ai pezzi e li avvia:
//   griglia.js    le celle 4×5, lo scorrimento che muove la mappa, i filtri applicati
//   filtri.js     i 16 pacchetti di sigarette e lo scontrino dei posti
//   visore.js     la foto grande (prima la media, poi l'originale senza lampo), i video
//   condividi.js  la scelta a pressione lunga e «salva sul rullino» (Web Share coi file)
//   mappa.js      Leaflet con la macchinina: si carica SOLO qui, dopo l'accesso (pzkko-leggero: niente mappa per chi non entra)
// Il foglio di stile (galleria.css, pacchi.css) lo aggiunge lui, così la pagina chiusa non lo scarica.
// Se il server risponde 404 (biglietto scaduto o cambiato) o non risponde: evento «uscita», accesso.js riapre il form.

import { stato, indirizzo, evento, ascolta } from './comune.js'
import * as filtri from './filtri.js'
import * as griglia from './griglia.js'
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

/** Il manifesto dal server di casa, o null (e l'evento «uscita») se non si può. */
async function manifesto() {
  let r
  try { r = await fetch(indirizzo('foto.json'), { credentials: 'omit' }) }
  catch (e) { console.warn('deutschland: il server delle foto non risponde', e?.message ?? e); evento('uscita', { motivo: 'rete' }); return null }
  if (!r.ok) { console.warn(`deutschland: foto.json ha risposto ${r.status}`); evento('uscita', { motivo: String(r.status) }); return null }
  try { return await r.json() } catch (e) { console.warn('deutschland: foto.json non è JSON', e?.message ?? e); evento('uscita', { motivo: 'json' }); return null }
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
  const g = document.getElementById('galleria')
  if (g) g.hidden = false
  await filtri.avvia(m)
  griglia.avvia(m)
  visore.avvia(m)
  condividi.avvia(m)
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
}

ascolta('accesso', () => { parti() })
parti()
