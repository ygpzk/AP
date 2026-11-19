// /api/stato (11.11.2026, Alberto: «crea in ap e in pzk da qualche parte un informatore che dice che i sistemi vanno
// sempre connessi dal mio pc»). Il dato viene dal pc, attraverso il ponte che c'è già (_server.mjs, firmato HMAC), in sola
// lettura e senza niente salvato su Vercel:
//   pc       GET /v1/salute firmata: risponde il server di casa (C:\pzkko-server), quindi il pc è acceso, il tunnel va e
//            il segreto torna. «acceso» = da quando gira il server
//   banca    la GET pubblica di /api/wallet attraverso /v1/api/wallet (i totali, come la vede chiunque): la banca è carica
//   tempo    la macchina del tempo (tempo-server) attraverso il tunnel, senza firma: è pubblica anche lei
//   siti     i domini dei siti ospitati, misurati da qui (Vercel): 200, o il rimando a www
// L'indirizzo del tunnel e il nome del pc non escono mai: solo sì/no, codici e millisecondi.
//
// La risposta resta in cache sul CDN 60 secondi (e fino a 5 minuti mentre se ne prepara una nuova): al server di casa
// arriva al più una richiesta al minuto per regione. «agg» è l'ora vera del controllo: la pagina dice «controllato N min fa».
//
// Nei progetti senza le variabili del server (albertopecchini.it) la funzione non sa chiedere al pc: gira la domanda a
// pzkko.it, una volta sola (x-pzk-stato-inoltro), così le pagine di tutti e due i siti chiedono a /api/stato/ e basta.
// Albertopecchini.it/api/stato.js la riesporta. Lo stesso controllo, visto dal pc, è tools/cruscotto/hosting.mjs.
import { chiedi, serverOpzioni } from './_server.mjs'

const SITI = [
  'https://www.albertopecchini.it/',
  'https://www.pzkko.it/',
  'https://www.rivaltasulmincio.it/',
  'https://www.cascinafontana.xyz/',
  'https://www.bettercallpekko.it/',
  'https://dariodonelli.vercel.app/',
]
const ATTESA = 6_000
const PZKKO = 'https://www.pzkko.it/api/stato/'
const UA = 'pzkko-stato (controllo dei sistemi)'

async function misura(url) {
  const t0 = Date.now()
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(ATTESA) })
    r.body?.cancel?.().catch(() => {})
    return { codice: r.status, ms: Date.now() - t0, su: r.status >= 200 && r.status < 400 }
  } catch {
    return { codice: null, ms: Date.now() - t0, su: false }
  }
}

async function pc() {
  try {
    const r = await chiedi('/v1/salute')
    return { su: r.status === 200 && r.json?.ok === true, ms: r.ms, acceso: typeof r.json?.da === 'string' ? r.json.da : null }
  } catch (e) {
    return { su: false, ms: null, acceso: null, ...(e?.spento && { configurato: false }) }
  }
}

async function banca() {
  try {
    const busta = JSON.stringify({ m: 'GET', q: '', ip: '', ua: UA, corpo: '' })
    const r = await chiedi('/v1/api/wallet', { corpo: busta })
    let ok = false
    try { ok = r.json?.status === 200 && JSON.parse(r.json.corpo).ok === true } catch {}
    return { su: ok, ms: r.ms }
  } catch {
    return { su: false, ms: null }
  }
}

async function tempo() {
  const opz = serverOpzioni()
  if (!opz) return { su: false, ms: null }
  const m = await misura(opz.url + '/tempo/')
  return { su: m.su, ms: m.ms }
}

export async function controlla() {
  const [p, b, t, s] = await Promise.all([pc(), banca(), tempo(), Promise.all(SITI.map(misura))])
  const siti = SITI.map((u, i) => ({ nome: new URL(u).hostname.replace(/^www\./, ''), ...s[i] }))
  const giu = [...(b.su ? [] : ['la banca']), ...(t.su ? [] : ['la macchina del tempo']), ...siti.filter((x) => !x.su).map((x) => x.nome)]
  const stato = !p.su ? 'pc-spento' : giu.length ? 'parziale' : 'su'
  return { ok: true, agg: Date.now(), stato, pc: { su: p.su, ms: p.ms, acceso: p.acceso }, banca: b, tempo: t, siti, giu }
}

export default async function handler(req, res) {
  const manda = (status, corpo, cache) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', cache)
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(corpo))
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return manda(405, { ok: false, errore: 'solo GET' }, 'no-store') }
  const CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'

  // senza le variabili del server: si chiede a pzkko.it (mai due volte di fila: niente giri infiniti)
  if (!serverOpzioni()) {
    if (!req.headers['x-pzk-stato-inoltro']) {
      try {
        const r = await fetch(PZKKO, { headers: { 'x-pzk-stato-inoltro': '1', 'user-agent': UA }, signal: AbortSignal.timeout(9_000) })
        const d = await r.json()
        if (r.ok && d?.ok) return manda(200, d, CACHE)
      } catch {}
    }
    return manda(200, { ok: true, agg: Date.now(), stato: 'sconosciuto', giu: [] }, 'public, max-age=0, s-maxage=30')
  }
  try {
    return manda(200, await controlla(), CACHE)
  } catch (e) {
    console.warn('stato:', e?.message)
    return manda(500, { ok: false, errore: 'il controllo non è riuscito' }, 'no-store')
  }
}
