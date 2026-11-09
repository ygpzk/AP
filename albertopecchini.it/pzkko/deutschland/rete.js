// La rete di Deutschland (Agente 1, 9.11.2026): come la galleria (album, visore, mappa, condividi) prende i file delle foto
// senza mettere in ginocchio la banda. Il primo giro scaricava l'originale appena aprivi una foto e le 967 miniature una
// per una: dal telefono «moltissime anteprime non si caricano». Qui: prima la Cache Storage del browser (`deutschland-v2`,
// chiave `/deutschland/<tipo>/<file>` SENZA biglietto: il giorno dopo il biglietto cambia ma la cache resta), poi una coda
// con al più 6 richieste in volo (HTTP/1.1 ne ha 6 per host: di più si mettono solo in fila), con la priorità 0 (visibile)
// > 1 (vicino) > 2 (prefetch) e l'AbortController collegato al `signal` di chi chiede (scorri via = la richiesta sparisce).
// Le miniature piccole viaggiano in FASCI (`f/<n>.bin`, 40 per fascio: 25 richieste per tutto l'album invece di 967) e si
// spacchettano qui, una miniatura per voce della cache; il prefetch dei fasci va in idle, uno alla volta, e si ferma se la
// pagina è nascosta. Gli ORIGINALI (`o`, e i video `v`) non si chiedono mai da soli: solo `originale()`, su un tocco, in
// streaming con la percentuale, e MAI in Cache Storage (troppo grandi).
//
// È il contratto con l'Agente 3: a questa API si può solo aggiungere.
//   prendi(tipo, file, { priorita = 1, signal })  → Promise<blob URL>      tipo 's' 'm' 'g' 'p' 'v' 'o'
//   miniatura(foto, opz)                           → Promise<blob URL>      la piccola: dal fascio (`foto.fascio`) o da `m`
//   libera(url)                                    revoca il blob URL (idempotente)
//   precarica(manifesto)                           prefetch in idle dei fasci che mancano; evento «scaricato» {fatti,totale,percento}
//   originale(foto, { onProgress, signal })        → Promise<File> col nome originale; onProgress(ricevuti, totale)
//   stato()                                        → { inVolo, inCoda, richiesteOggi }
//   pulisci(versione)                              svuota la cache se la versione è diversa da quella salvata
//
// Il fascio `f/<n>.bin` (lo scrive tools/pzkko/deutschland/fasci.mjs, stesso formato): 4 byte big-endian = lunghezza L
// della testa; L byte di JSON `{ "<file s>": [offset, len], … }` (offset dall'inizio dei dati, cioè dopo la testa); poi i
// webp in fila. Un fascio spacchettato lascia in cache un segnaposto `/deutschland/f/<n>.bin` (il prefetch guarda quello).
//
// B2 ha un tetto di 2.500 download al giorno (classe B): si contano le richieste di rete del giorno in localStorage
// (`pzkko-deutschland-richieste`) e a 2.000 un console.warn, una volta. Regola pzkko-leggero: nessun timer a pagina ferma,
// il prefetch finisce e basta. Una risposta 404/403/401 dal server = il biglietto è scaduto o cambiato → evento «uscita»
// (comune.js) e la promessa è rifiutata; in locale col server aperto (niente biglietto) un 404 è solo un file che manca.
import { indirizzo, evento, stato as accesso, LOCALE } from './comune.js'

const CACHE = 'deutschland-v2'
const CHIAVE_VERSIONE = 'pzkko-deutschland-cache-v'
const CHIAVE_RICHIESTE = 'pzkko-deutschland-richieste'
const MAX_IN_VOLO = 6
const TETTO_AVVISO = 2000
const TIPI = new Set(['s', 'm', 'g', 'p', 'v', 'o', 'f'])
const IN_CACHE = new Set(['s', 'm', 'g', 'p']) // mai gli originali né i video: troppo grandi
const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', bin: 'application/octet-stream' }

const chiaveDi = (tipo, file) => `/deutschland/${tipo}/${file}`
const errore = (nome, msg) => Object.assign(new Error(msg), { name: nome })
const abortito = () => errore('AbortError', 'richiesta annullata')

// ── la Cache Storage (null se il browser non la dà: http su un indirizzo che non è localhost, finestra privata vecchia) ──
let cacheP = null
const cache = () => (cacheP ??= (async () => { try { return typeof caches !== 'undefined' ? await caches.open(CACHE) : null } catch { return null } })())
async function daCache(chiave) {
  const c = await cache()
  if (!c) return null
  try { return (await c.match(chiave)) ?? null } catch { return null }
}
async function inCache(chiave, blob, tipo) {
  const c = await cache()
  if (!c) return
  try { await c.put(chiave, new Response(blob, { headers: { 'Content-Type': tipo || blob.type || 'application/octet-stream', 'Content-Length': String(blob.size) } })) } catch {}
}
// lo stesso contenuto in memoria quando la cache non c'è (le miniature di un fascio: 7 MB per tutto l'album, va bene)
const memoria = new Map()

// ── il conto delle richieste del giorno (il tetto di B2) ──
const oggi = () => new Date().toISOString().slice(0, 10)
let avvisato = false
function contaRichiesta() {
  let r = { giorno: oggi(), n: 0 }
  try { const s = JSON.parse(localStorage.getItem(CHIAVE_RICHIESTE) || 'null'); if (s && s.giorno === r.giorno && Number.isFinite(+s.n)) r = { giorno: s.giorno, n: +s.n } } catch {}
  r.n++
  try { localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(r)) } catch {}
  if (r.n >= TETTO_AVVISO && !avvisato) { avvisato = true; console.warn(`deutschland: ${r.n} richieste oggi, il tetto di B2 è 2.500 al giorno`) }
  return r.n
}
function richiesteOggi() {
  try { const s = JSON.parse(localStorage.getItem(CHIAVE_RICHIESTE) || 'null'); return s && s.giorno === oggi() && Number.isFinite(+s.n) ? +s.n : 0 } catch { return 0 }
}

// ── la coda: al più 6 in volo, la priorità più bassa prima, a parità chi ha chiesto prima ──
const coda = [] // { chiave, tipo, file, priorita, ordine, attese: Set<waiter>, controller, partito }
const lavori = new Map() // chiave → lavoro (anche quelli in volo): due richieste uguali = una sola fetch
let inVolo = 0, ordine = 0, uscitaDetta = 0

function pompa() {
  while (inVolo < MAX_IN_VOLO && coda.length) {
    let k = 0
    for (let i = 1; i < coda.length; i++) if (coda[i].priorita < coda[k].priorita || (coda[i].priorita === coda[k].priorita && coda[i].ordine < coda[k].ordine)) k = i
    const l = coda.splice(k, 1)[0]
    if (!l.attese.size) { lavori.delete(l.chiave); continue }
    l.partito = true
    inVolo++
    esegui(l).finally(() => { inVolo--; lavori.delete(l.chiave); pompa() })
  }
}
/** La risposta del server è un «fuori»? 401/403/404 = biglietto scaduto o cambiato (in locale aperto, un 404 è solo un file che manca). */
function fuori(r) {
  if (!(r.status === 401 || r.status === 403 || r.status === 404)) return false
  if (LOCALE && !accesso.biglietto) return false
  if (Date.now() - uscitaDetta > 5000) { uscitaDetta = Date.now(); evento('uscita') }
  return true
}
async function esegui(l) {
  const url = indirizzo(l.tipo, l.file)
  let tentativi = 0, r
  for (;;) {
    try {
      contaRichiesta()
      r = await fetch(url, { signal: l.controller.signal, credentials: 'omit' })
    } catch (e) {
      if (l.controller.signal.aborted) return l.rifiuta(abortito())
      if (++tentativi > 1) return l.rifiuta(errore('RetError', `rete: ${e.message}`))
      await new Promise((ok) => setTimeout(ok, 600)); continue // (una seconda volta, poi basta)
    }
    if (r.ok) break
    if (fuori(r)) return l.rifiuta(errore('UscitaError', `il server ha risposto ${r.status}: biglietto scaduto`))
    if (r.status >= 500 && ++tentativi <= 1) { await new Promise((ok) => setTimeout(ok, 800)); continue }
    return l.rifiuta(errore('RetError', `il server ha risposto ${r.status} per ${l.tipo}/${l.file}`))
  }
  try {
    const blob = await r.blob()
    const tipo = r.headers.get('content-type') || MIME[String(l.file).split('.').pop()] || 'application/octet-stream'
    const b = blob.type ? blob : new Blob([blob], { type: tipo })
    if (IN_CACHE.has(l.tipo)) await inCache(l.chiave, b, tipo)
    l.risolvi(b)
  } catch (e) {
    l.rifiuta(l.controller.signal.aborted ? abortito() : errore('RetError', `lettura: ${e.message}`))
  }
}
/** Mette in coda (o si accoda a una richiesta uguale già in fila) e aspetta il Blob. */
function chiedi(tipo, file, { priorita = 1, signal } = {}) {
  if (!TIPI.has(tipo)) return Promise.reject(errore('TypeError', `tipo sconosciuto: ${tipo}`))
  if (!file) return Promise.reject(errore('TypeError', `manca il file (${tipo})`))
  if (signal?.aborted) return Promise.reject(abortito())
  const chiave = chiaveDi(tipo, file)
  let l = lavori.get(chiave)
  if (!l) {
    l = { chiave, tipo, file, priorita, ordine: ordine++, attese: new Set(), controller: new AbortController(), partito: false }
    l.risolvi = (b) => { for (const w of l.attese) w.ok(b); l.attese.clear() }
    l.rifiuta = (e) => { for (const w of l.attese) w.ko(e); l.attese.clear() }
    lavori.set(chiave, l); coda.push(l)
  } else if (priorita < l.priorita) l.priorita = priorita // (chi lo vuole subito alza la priorità di tutti)
  return new Promise((ok, ko) => {
    const w = { ok, ko }
    l.attese.add(w)
    if (signal) signal.addEventListener('abort', () => {
      if (!l.attese.has(w)) return
      l.attese.delete(w); ko(abortito())
      if (l.attese.size) return
      // nessuno lo vuole più: via dalla coda, o fermato se è in volo
      if (l.partito) l.controller.abort()
      else { const i = coda.indexOf(l); if (i >= 0) coda.splice(i, 1); lavori.delete(chiave) }
    }, { once: true })
    queueMicrotask(pompa)
  })
}

// ── l'API ──

/** Un file del server come blob URL: prima la cache, poi la coda. tipo 's' 'm' 'g' 'p' 'v' 'o'; 'o' e 'v' solo su richiesta
 *  esplicita e mai in cache. Da liberare con libera(url) quando esce dallo schermo. */
export async function prendi(tipo, file, opz = {}) {
  if (!TIPI.has(tipo) || tipo === 'f') throw errore('TypeError', `tipo sconosciuto: ${tipo}`)
  if (!file) throw errore('TypeError', `manca il file (${tipo})`)
  if (opz.signal?.aborted) throw abortito()
  const chiave = chiaveDi(tipo, file)
  const m = memoria.get(chiave)
  if (m) return URL.createObjectURL(m)
  if (IN_CACHE.has(tipo)) { const r = await daCache(chiave); if (r) return URL.createObjectURL(await r.blob()) }
  if (opz.signal?.aborted) throw abortito()
  return URL.createObjectURL(await chiedi(tipo, file, opz))
}

/** Revoca un blob URL (idempotente: revocarne uno già revocato non fa niente). */
export function libera(url) {
  if (typeof url === 'string' && url.startsWith('blob:')) { try { URL.revokeObjectURL(url) } catch {} }
}

// ── i fasci ──
const fasciInCorso = new Map() // n → Promise<void>
/** Spacchetta un fascio: { "<file>": Blob }. */
function spacchetta(buf) {
  const dv = new DataView(buf)
  const L = dv.getUint32(0, false)
  if (!(L > 1 && 4 + L <= buf.byteLength)) throw errore('RetError', 'fascio rotto (testa)')
  const testa = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, L)))
  const base = 4 + L, out = {}
  for (const [file, [da, len]] of Object.entries(testa)) {
    if (!(da >= 0 && len >= 0 && base + da + len <= buf.byteLength)) throw errore('RetError', `fascio rotto (${file})`)
    out[file] = new Blob([new Uint8Array(buf, base + da, len)], { type: MIME[file.split('.').pop()] || 'image/webp' })
  }
  return out
}
/** Scarica il fascio n (una volta sola: le promesse si condividono) e mette ogni miniatura in cache come /deutschland/s/<file>. */
function fascio(n, opz = {}) {
  let p = fasciInCorso.get(n)
  if (p) return p
  p = (async () => {
    const blob = await chiedi('f', `${n}.bin`, opz)
    const voci = spacchetta(await blob.arrayBuffer())
    const c = await cache()
    for (const [file, b] of Object.entries(voci)) {
      const chiave = chiaveDi('s', file)
      memoria.set(chiave, b)
      if (c) await inCache(chiave, b, b.type)
    }
    if (c) await inCache(chiaveDi('f', `${n}.bin`), new Blob([String(Object.keys(voci).length)], { type: 'text/plain' }), 'text/plain')
  })()
  fasciInCorso.set(n, p)
  p.finally(() => fasciInCorso.delete(n)).catch(() => {})
  return p
}
const fascioInCache = async (n) => Boolean(await daCache(chiaveDi('f', `${n}.bin`)))

/** La miniatura piccola di una voce del manifesto: dal fascio (`foto.fascio`, manifesto v2) o, se il manifesto non ha
 *  fasci (v1), la `m` di oggi. */
export async function miniatura(foto, opz = {}) {
  if (!foto) throw errore('TypeError', 'manca la foto')
  if (typeof foto.fascio === 'number' && foto.s) {
    const chiave = chiaveDi('s', foto.s)
    const m = memoria.get(chiave)
    if (m) return URL.createObjectURL(m)
    const r = await daCache(chiave)
    if (r) return URL.createObjectURL(await r.blob())
    await fascio(foto.fascio, opz)
    const b = memoria.get(chiave) ?? (await (await daCache(chiave))?.blob())
    if (!b) throw errore('RetError', `${foto.s} non è nel fascio ${foto.fascio}`)
    return URL.createObjectURL(b)
  }
  if (foto.s) return prendi('s', foto.s, opz)
  return prendi('m', foto.m, opz)
}

// ── il prefetch in idle dei fasci (uno alla volta, priorità 2, si ferma a pagina nascosta e riparte) ──
const prefetch = { daFare: [], visti: new Set(), fatti: 0, totale: 0, attivo: false, ascolta: false }
const inIdle = (f) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => f(), { timeout: 2000 }) : setTimeout(f, 200))
async function prossimoFascio() {
  if (!prefetch.daFare.length) { prefetch.attivo = false; return } // finito: nessun timer resta
  if (document.hidden) { prefetch.attivo = false; return } // riparte dal visibilitychange
  const n = prefetch.daFare[0]
  try {
    if (!(await fascioInCache(n))) await fascio(n, { priorita: 2 })
  } catch (e) {
    if (e?.name === 'UscitaError') { prefetch.daFare.length = 0; prefetch.attivo = false; return }
    // (un errore di rete: il fascio torna in fondo, si riprova una volta sola)
    if (!prefetch.visti.has(`ripreso:${n}`)) { prefetch.visti.add(`ripreso:${n}`); prefetch.daFare.push(n) }
  }
  prefetch.daFare.shift()
  prefetch.fatti = Math.max(0, prefetch.totale - prefetch.daFare.length)
  evento('scaricato', { fatti: prefetch.fatti, totale: prefetch.totale, percento: prefetch.totale ? Math.round((prefetch.fatti / prefetch.totale) * 100) : 100 })
  inIdle(prossimoFascio)
}
function avviaPrefetch() {
  if (prefetch.attivo || !prefetch.daFare.length) return
  prefetch.attivo = true
  inIdle(prossimoFascio)
}
/** Scarica in idle tutti i fasci del manifesto che non sono ancora in cache. Si può chiamare più volte: i fasci già
 *  in fila non si ripetono. Evento «scaricato» {fatti, totale, percento} a ogni fascio. */
export function precarica(manifesto) {
  const numeri = new Set()
  for (const f of manifesto?.foto ?? []) if (typeof f.fascio === 'number') numeri.add(f.fascio)
  for (const n of [...numeri].sort((a, b) => a - b)) if (!prefetch.visti.has(n)) { prefetch.visti.add(n); prefetch.daFare.push(n); prefetch.totale++ }
  if (!prefetch.ascolta) { prefetch.ascolta = true; document.addEventListener('visibilitychange', () => { if (!document.hidden) avviaPrefetch() }) }
  avviaPrefetch()
}

// ── l'originale, in streaming, mai in cache ──
/** L'originale di una foto (o il video) come File col nome originale e il tipo giusto: onProgress(ricevuti, totale) a ogni
 *  pezzo (totale 0 se il server non dice quanto è lungo). Non passa dalla cache, non ci finisce. */
export async function originale(foto, { onProgress, signal } = {}) {
  if (!foto) throw errore('TypeError', 'manca la foto')
  if (signal?.aborted) throw abortito()
  const tipo = foto.tipo === 'video' ? 'v' : 'o'
  const file = foto[tipo]
  if (!file) throw errore('TypeError', `la voce ${foto.id ?? '?'} non ha ${tipo}`)
  const { blob, tipoRisposta } = await scaricaAPezzi(indirizzo(tipo, file), { onProgress, signal })
  // il nome originale (IMG_5506.HEIC) con l'estensione di quello che si serve davvero (JPG, PNG, MP4), come fa il server
  const est = String(file).split('.').pop().toLowerCase()
  const estNome = tipo === 'v' ? 'MP4' : est === 'jpeg' ? 'JPG' : est.toUpperCase()
  const nome = String(foto.nome || file).replace(/\.[^.]+$/, '') + '.' + estNome
  const mime = (tipoRisposta && !/octet-stream/.test(tipoRisposta) ? tipoRisposta.split(';')[0].trim() : null) || MIME[est] || 'application/octet-stream'
  return new File([blob], nome, { type: mime, lastModified: foto.t ? Date.parse(foto.t) || Date.now() : Date.now() })
}

// la lettura a pezzi: una fetch fuori dalla coda dei blob ma dentro il conto delle 6 in volo
async function scaricaAPezzi(url, { onProgress, signal } = {}) {
  const controller = new AbortController()
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })
  inVolo++
  try {
    contaRichiesta()
    let r
    try { r = await fetch(url, { signal: controller.signal, credentials: 'omit' }) } catch (e) { throw controller.signal.aborted ? abortito() : errore('RetError', `rete: ${e.message}`) }
    if (!r.ok) { if (fuori(r)) throw errore('UscitaError', `il server ha risposto ${r.status}: biglietto scaduto`); throw errore('RetError', `il server ha risposto ${r.status}`) }
    const totale = Number(r.headers.get('content-length')) || 0
    const tipoRisposta = r.headers.get('content-type') || ''
    if (!r.body) return { blob: await r.blob(), totale, tipoRisposta }
    const reader = r.body.getReader(), pezzi = []
    let ricevuti = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      pezzi.push(value); ricevuti += value.byteLength
      if (onProgress) { try { onProgress(ricevuti, totale) } catch {} }
    }
    return { blob: new Blob(pezzi), totale, tipoRisposta }
  } finally { inVolo--; pompa() }
}

/** Quante richieste sono in volo, quante in fila, quante ne abbiamo fatte oggi (il tetto di B2 è 2.500). */
export function stato() {
  return { inVolo, inCoda: coda.length, richiesteOggi: richiesteOggi() }
}

/** Svuota la cache se `versione` (una stringa: il `v` del manifesto, o il giorno) è diversa da quella salvata l'ultima volta.
 *  Torna true se ha svuotato. */
export async function pulisci(versione) {
  const v = String(versione ?? '')
  let salvata = null
  try { salvata = localStorage.getItem(CHIAVE_VERSIONE) } catch {}
  if (salvata === v) return false
  try { if (typeof caches !== 'undefined') await caches.delete(CACHE) } catch {}
  cacheP = null; memoria.clear()
  try { localStorage.setItem(CHIAVE_VERSIONE, v) } catch {}
  return salvata !== null // (la prima volta non c'era niente da svuotare)
}
