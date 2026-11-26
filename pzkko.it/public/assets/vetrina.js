// La vetrina dal vivo (25.11.2026): dove è pzkko («in ufficio» / «in giro per il mondo»), le app aperte sul suo pc con le
// icone e la musica che suona sul suo Spotify.
//
// Due strade, in ordine di velocità:
//   1. il canale diretto col pc (Server-Sent Events, /v1/live sul server dei dati): quando la banca scrive
//      pzkko/vetrina.json, il server manda subito il nuovo stato a chi è collegato. Il brano cambia nel browser
//      appena cambia su Spotify, senza aspettare il CDN. Il biglietto lo dà /api/vetrina/?biglietto=1.
//   2. se il canale non c'è (pc spento, tunnel giù, o il browser non lo può aprire), si chiede /api/vetrina/ ogni
//      15 secondi, solo a pagina visibile: è la riserva, non la strada normale.
const OGNI = 15_000
let dati = null, fra = null, inCorso = false
const ascolti = new Set()

function ricevuto(d) {
  if (!d?.ok) return
  const prima = dati && JSON.stringify({ ...dati, agg: 0 })
  dati = d
  if (JSON.stringify({ ...d, agg: 0 }) !== prima) for (const f of ascolti) { try { f(d) } catch (e) { console.error(e) } }
}

// ── la riserva: la funzione di Vercel, ogni 15 secondi ──
async function chiedi() {
  clearTimeout(fra)
  if (document.hidden || inCorso || canaleOk) return
  inCorso = true
  try {
    const r = await fetch('/api/vetrina/', { headers: { accept: 'application/json' }, cache: 'no-store' })
    const d = r.ok ? await r.json() : null
    if (d?.ok && !canaleOk) ricevuto(d)
  } catch {}
  inCorso = false
  if (!canaleOk && !document.hidden) fra = setTimeout(chiedi, OGNI)
}

// ── la strada veloce: il canale diretto col pc ──
let canale = null, canaleOk = false, inCollega = false, attesa = null, errori = 0
async function collega() {
  clearTimeout(attesa)
  if (canale || inCollega || document.hidden) return
  inCollega = true
  let b = null
  try {
    const r = await fetch('/api/vetrina/?biglietto=1', { headers: { accept: 'application/json' }, cache: 'no-store' })
    b = r.ok ? await r.json() : null
  } catch {}
  inCollega = false
  if (!b?.ok || !b.url || !b.biglietto) {
    errori++
    attesa = setTimeout(collega, Math.min(60_000, 1000 * 2 ** errori))
    return
  }
  if (canale || document.hidden) return
  let es
  try { es = new EventSource(`${b.url}/v1/live?b=${encodeURIComponent(b.biglietto)}`) } catch { es = null }
  if (!es) { errori++; attesa = setTimeout(collega, Math.min(60_000, 1000 * 2 ** errori)); return }
  canale = es
  let aperto = false
  es.onopen = () => { aperto = true; canaleOk = true; errori = 0; clearTimeout(fra) }
  es.onmessage = (m) => {
    let a
    try { a = JSON.parse(m.data) } catch { return }
    if (a?.k === 'vetrina') ricevuto({ ok: true, luogo: a.luogo, app: a.app, musica: a.musica, agg: a.t })
  }
  // (un errore: il server l'ha chiusa dopo mezz'ora, il biglietto è scaduto, la rete: si chiude e si riapre con un biglietto nuovo)
  es.onerror = () => {
    if (canale !== es) return
    try { es.close() } catch {}
    canale = null; canaleOk = false
    errori++
    attesa = setTimeout(collega, aperto ? 400 : Math.min(60_000, 1000 * 2 ** errori))
    chiedi()
  }
}
function ferma() {
  clearTimeout(attesa)
  const c = canale
  canale = null; canaleOk = false
  try { c?.close() } catch {}
  clearTimeout(fra)
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) ferma()
  else { errori = 0; chiedi(); collega() }
})

/** L'ultima vetrina arrivata: { luogo, app: [{ n, i, su, str? }] (str: la chiave dello strumento in uso con quell'app, se il pc la sa), musica: { titolo, artista, album, img, inizio, fine } | null }, o null. */
export const vetrina = () => dati
/** Chiama `f(dati)` a ogni cambio (e comincia a chiedere). Restituisce come smettere. */
export function ascolta(f) {
  ascolti.add(f)
  if (dati) f(dati)
  else { chiedi(); collega() }
  return () => ascolti.delete(f)
}
/** L'indirizzo di un'icona o di una copertina. */
export const immagine = (id) => `/api/vetrina/?img=${encodeURIComponent(id)}`

chiedi()
collega()
