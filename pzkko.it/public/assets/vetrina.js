// La vetrina dal vivo (25.11.2026): dove è pzkko («in ufficio» / «in giro per il mondo»), le app aperte sul suo pc con le
// icone e la musica che suona sul suo Spotify. Arriva da /api/vetrina/ (api/vetrina.mjs) ogni 15 secondi, solo a pagina
// visibile. Lanyard resta per Discord (avatar, stato, giochi); la musica viene da qui e basta.
const OGNI = 15_000
let dati = null, fra = null, inCorso = false
const ascolti = new Set()

async function chiedi() {
  clearTimeout(fra)
  if (document.hidden || inCorso) return
  inCorso = true
  try {
    const r = await fetch('/api/vetrina/', { headers: { accept: 'application/json' } })
    const d = r.ok ? await r.json() : null
    if (d?.ok) {
      const prima = dati && JSON.stringify({ ...dati, agg: 0 })
      dati = d
      if (JSON.stringify({ ...d, agg: 0 }) !== prima) for (const f of ascolti) { try { f(d) } catch (e) { console.error(e) } }
    }
  } catch {}
  inCorso = false
  fra = setTimeout(chiedi, OGNI)
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) chiedi() })

/** L'ultima vetrina arrivata: { luogo, app: [{ n, i, su }], musica: { titolo, artista, album, img, inizio, fine } | null }, o null. */
export const vetrina = () => dati
/** Chiama `f(dati)` a ogni cambio (e comincia a chiedere). */
export function ascolta(f) { ascolti.add(f); if (dati) f(dati); else chiedi() }
/** L'indirizzo di un'icona o di una copertina. */
export const immagine = (id) => `/api/vetrina/?img=${encodeURIComponent(id)}`
