// /api/community: i numeri pubblici dei due server Discord che stanno nella
// pagina /community/ (OLLARE e SOLLARY).  Non è un bot e non entra nei server:
// legge solo l'endpoint pubblico degli inviti, quello che vede chiunque apra
// un invito, e restituisce i conteggi aggregati.
//
// Cosa non esce mai da qui: nomi, ID di membri, messaggi, canali vocali,
// presenze individuali, storico.  La risposta è una fotografia di adesso,
// con i conteggi approssimativi che dà Discord.
//
// La funzione sta sotto pzkko.it, quindi il browser non parla con Discord:
// la risposta resta nella cache di Vercel cinque minuti (e fino a mezz'ora
// mentre se ne prepara una nuova).  Se un invito non risponde si tiene
// l'ultima copia buona e la pagina lo dice.

import { intestazioniJson, ipDi, origineAmmessa, troppeRichieste } from './_server.mjs'

const API = 'https://discord.com/api/v10/invites/'
const UA = 'pzkko.it community (statistiche pubbliche)'
const ATTESA = 6_000
const TTL = 5 * 60_000

// L'ordine è quello della pagina.  Il nome breve e il colore stanno qui, non
// arrivano da Discord: il nome del server può cambiare, l'etichetta no.
const INVITI = [
  { codice: 'ollare', nome: 'OLLARE', colore: '#b06cff' },
  { codice: 'sollary', nome: 'SOLLARY', colore: '#71c2d9' },
]

const stato = (globalThis.__pzkkoCommunity ??= { dati: null, quando: 0, parziale: false })

const json = (res, status, body, cache) => {
  res.statusCode = status
  intestazioniJson(res, cache)
  res.end(JSON.stringify(body))
}

// Il 15.11.2026 OLLARE è nato; SOLLARY è del 2020.  La data di nascita di un
// server Discord si ricava dal suo ID (neve: millisecondi dall'epoca Discord).
const creato = (id) => {
  try {
    const ms = Number((BigInt(id) >> 22n) + 1420070400000n)
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null
  } catch {
    return null
  }
}

const icona = (gilda) => {
  if (!gilda?.id || !gilda.icon) return null
  // le icone animate cominciano con a_: il .png è il primo fotogramma, basta
  // per un avatar da 64 px e pesa meno di una GIF.
  return `https://cdn.discordapp.com/icons/${gilda.id}/${gilda.icon}.png?size=128`
}

async function leggi(voce) {
  const r = await fetch(`${API}${voce.codice}?with_counts=true&with_expiration=true`, {
    headers: { accept: 'application/json', 'user-agent': UA },
    signal: AbortSignal.timeout(ATTESA),
  })
  if (!r.ok) throw new Error(`invito ${voce.codice}: ${r.status}`)
  const d = await r.json()
  const g = d.guild ?? {}
  const p = d.profile ?? {}
  const membri = Number.isFinite(d.approximate_member_count) ? d.approximate_member_count : Number(p.member_count) || null
  const online = Number.isFinite(d.approximate_presence_count) ? d.approximate_presence_count : Number(p.online_count) || null
  return {
    codice: voce.codice,
    nome: voce.nome,
    nomeDiscord: typeof g.name === 'string' ? g.name : voce.nome,
    id: g.id ?? null,
    invito: `https://discord.gg/${voce.codice}`,
    icona: icona(g),
    membri,
    online,
    boost: Number(g.premium_subscription_count) || 0,
    tier: Number(g.premium_tier) || 0,
    verifica: Number(g.verification_level) || 0,
    community: Array.isArray(g.features) && g.features.includes('COMMUNITY'),
    creato: g.id ? creato(g.id) : null,
    tag: typeof p.tag === 'string' ? p.tag : null,
    colore: typeof p.brand_color_primary === 'string' ? p.brand_color_primary : voce.colore,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return json(res, 405, { errore: 'solo GET' }, 'no-store')
  }

  if (!origineAmmessa(req)) return json(res, 403, { errore: 'origine non ammessa' }, 'no-store')
  if (troppeRichieste(ipDi(req), 120, 60_000)) return json(res, 429, { errore: 'troppe richieste' }, 'no-store')

  const adesso = Date.now()
  const fresco = stato.dati && adesso - stato.quando < TTL
  if (fresco) {
    const cache = `public, s-maxage=${Math.max(60, Math.round((TTL - (adesso - stato.quando)) / 1000))}, stale-while-revalidate=900`
    if (req.method === 'HEAD') { res.statusCode = 200; intestazioniJson(res, cache); return res.end() }
    return json(res, 200, stato.dati, cache)
  }

  const esiti = await Promise.allSettled(INVITI.map((v) => leggi(v)))
  const vecchi = new Map((stato.dati?.server ?? []).map((s) => [s.codice, s]))
  let parziale = false
  const server = esiti.map((e, i) => {
    if (e.status === 'fulfilled') return e.value
    parziale = true
    return vecchi.get(INVITI[i].codice) ?? null
  }).filter(Boolean)

  if (!server.length) {
    return json(res, 502, { errore: 'Discord non risponde: riprova fra poco' }, 'public, s-maxage=60, stale-while-revalidate=300')
  }

  // Se una parte è vecchia, il timestamp resta quello della lettura buona più
  // recente; la pagina mostra l'avviso e non spaccia i numeri per freschi.
  const dati = {
    aggiornato: new Date(adesso).toISOString(),
    fonte: 'Discord · inviti pubblici',
    parziale,
    nota: 'Conteggi approssimativi, come li dà Discord. Nessun dato individuale.',
    server,
  }
  // Se la lettura è parziale teniamo la copia precedente per la parte che ha
  // risposto, ma non la spacciamo per completa: la prossima volta si riprova.
  if (!parziale || !stato.dati) {
    stato.dati = dati
    stato.quando = adesso
    stato.parziale = parziale
  } else {
    // manteniamo il timestamp vecchio se non è arrivato niente di nuovo
    const qualcunoNuovo = esiti.some((e) => e.status === 'fulfilled')
    if (qualcunoNuovo) {
      stato.dati = { ...dati, aggiornato: new Date(adesso).toISOString() }
      stato.quando = adesso
      stato.parziale = true
    }
  }

  if (req.method === 'HEAD') {
    res.statusCode = 200
    intestazioniJson(res, 'public, s-maxage=300, stale-while-revalidate=900')
    return res.end()
  }
  return json(res, 200, stato.dati, 'public, s-maxage=300, stale-while-revalidate=900')
}
