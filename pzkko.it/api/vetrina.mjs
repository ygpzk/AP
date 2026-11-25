// /api/vetrina (25.11.2026, pzkko: «metti la zona app aperte con le icone in live», «in ufficio / in giro per il mondo»,
// e la musica dal suo Spotify invece che da Lanyard). Il dato lo prepara il pc di pzkko e lo lascia nel server dei dati
// (pzkko/vetrina.json, le immagini in pzkko/vetrina-immagini.json); qui si legge attraverso il ponte firmato e si passa
// solo il risultato: dove è, i nomi e le icone delle app aperte, il brano che suona.
//   GET /api/vetrina/            { ok, luogo, app: [{ n, i, su }], musica, agg }   (sul CDN 10 secondi)
//   GET /api/vetrina/?img=<id>   l'icona o la copertina (png/jpeg), per sempre: l'id è l'impronta del contenuto
// Se il pc non scrive da 3 minuti (spento, o il ponte giù): niente app, niente musica, «in giro per il mondo».
import { archivioServer, ipDi, troppeRichieste } from './_server.mjs'

const FILE = 'pzkko/vetrina.json', FILE_IMG = 'pzkko/vetrina-immagini.json'
const FRESCO = 3 * 60_000
const vuoto = () => ({})
const testo = (s, n = 80) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n) : '')
const id = (s) => (typeof s === 'string' && /^[0-9a-f]{16}$/.test(s) ? s : null)
const ora = (n) => (Number.isFinite(n) && n > 1.7e12 && n < 4e12 ? Math.round(n) : null)

function intestazioni(res, tipo, cache) {
  res.setHeader('Content-Type', tipo)
  res.setHeader('Cache-Control', cache)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Robots-Tag', 'noindex')
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; sandbox")
}

/** Il risultato e basta, con i campi controllati uno per uno. */
export function pulisci(d, adesso = Date.now()) {
  const fresco = Number.isFinite(d?.t) && adesso - d.t < FRESCO
  if (!fresco) return { ok: true, luogo: 'giro', app: [], musica: null, agg: ora(d?.t) }
  const app = (Array.isArray(d.app) ? d.app : []).slice(0, 16).map((a) => ({ n: testo(a?.n, 40), i: id(a?.i), su: a?.su === true })).filter((a) => a.n)
  const m = d.musica
  const musica = m && testo(m.titolo) && testo(m.artista)
    ? { titolo: testo(m.titolo), artista: testo(m.artista), album: testo(m.album), img: id(m.img), inizio: ora(m.inizio), fine: ora(m.fine) }
    : null
  return { ok: true, luogo: d.luogo === 'ufficio' ? 'ufficio' : 'giro', app, musica, agg: ora(d.t) }
}

export default async function handler(req, res) {
  const manda = (status, corpo, cache = 'no-store') => {
    res.statusCode = status
    intestazioni(res, 'application/json; charset=utf-8', cache)
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(corpo))
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return manda(405, { ok: false, errore: 'solo GET' }) }
  if (troppeRichieste(`vetrina:${ipDi(req)}`, 240)) return manda(429, { ok: false, errore: 'troppe richieste: aspetta un momento' })
  let q
  try { q = new URL(req.url || '/', 'http://x').searchParams } catch { return manda(400, { ok: false, errore: 'richiesta sbagliata' }) }

  const quale = q.get('img')
  if (quale !== null) {
    const k = id(quale)
    if (!k) return manda(400, { ok: false, errore: 'immagine sbagliata' })
    const arch = archivioServer(FILE_IMG, vuoto)
    if (!arch) return manda(404, { ok: false }, 'public, s-maxage=60')
    try {
      const { db } = await arch.read()
      const x = db?.img?.[k]
      if (!x || !['image/png', 'image/jpeg'].includes(x.tipo) || typeof x.dati !== 'string') return manda(404, { ok: false }, 'public, s-maxage=30')
      const buf = Buffer.from(x.dati, 'base64')
      res.statusCode = 200
      intestazioni(res, x.tipo, 'public, max-age=31536000, immutable')
      return res.end(req.method === 'HEAD' ? undefined : buf)
    } catch (e) {
      console.warn('vetrina img:', e?.message)
      return manda(503, { ok: false }, 'no-store')
    }
  }

  const arch = archivioServer(FILE, vuoto)
  if (!arch) return manda(200, pulisci(null), 'public, max-age=0, s-maxage=30')
  try {
    const { db } = await arch.read()
    return manda(200, pulisci(db), 'public, max-age=0, s-maxage=10, stale-while-revalidate=30')
  } catch (e) {
    console.warn('vetrina:', e?.message)
    return manda(200, pulisci(null), 'public, max-age=0, s-maxage=15')
  }
}
