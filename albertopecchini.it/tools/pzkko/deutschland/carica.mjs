#!/usr/bin/env node
// Il caricamento delle foto di Deutschland su Backblaze B2 (Agente 1, 9.11.2026 sera): porta dati\ (foto.json, f\ s\ g\ p\ v\ o\)
// nel bucket privato di B2 con la stessa struttura di percorsi del server di casa (`s/img-5506.webp`, `f/3.bin`, `o/img-5506.jpg`,
// `foto.json`), così pzkko/deutschland/comune.js cambia solo la base e la query (`?Authorization=` al posto di `?b=`).
// API nativa B2 via fetch (C:\pzkko-server\deutschland\b2.mjs: autorizza, chiama; le credenziali le legge solo lui, qui non
// si stampano mai): b2_list_file_names per sapere cosa c'è già (si salta ciò che ha lo stesso sha1 e la stessa dimensione:
// ripresa dopo un errore = rilanciare), b2_get_upload_url + b2_upload_file con X-Bz-Content-Sha1 (4 caricamenti in
// parallelo, ognuno col suo indirizzo di upload; a un errore 5xx/rete si prende un indirizzo nuovo e si riprova, fino a 5
// volte), b2_update_bucket per le regole CORS (pzkko.it, le anteprime Vercel, localhost; solo download per nome; expose
// Content-Length e compagnia). Content-Type giusto, `b2-content-disposition: inline; filename="IMG_5506.JPG"` per
// originali e video (il nome col quale il telefono salva), `b2-cache-control` private 24 h (il manifesto no-cache).
// ~5,4 GB a 1 MB/s ≈ 1,5 ore: si lancia in sottofondo e si lascia andare; il log della regia riceve inizio, fine e i guai.
//
// I tetti gratuiti di B2: 2.500 chiamate di classe C al giorno (list, get_upload_url, update_bucket) e 2.500 di classe B
// (download): qui l'elenco è una chiamata per cartella (maxFileCount 10000) e un indirizzo di upload per lavoratore (gli
// upload stessi sono classe A, gratis).
//
//   node tools/pzkko/deutschland/carica.mjs                         tutto quello che manca o è cambiato
//   node tools/pzkko/deutschland/carica.mjs --solo=s,f,foto.json    solo quelle cartelle (s m f g p v o foto.json)
//   node tools/pzkko/deutschland/carica.mjs --prova                 elenca cosa caricherebbe, non carica niente
//   node tools/pzkko/deutschland/carica.mjs --max=5                 carica al più N file (per provare davvero con poco)
//   node tools/pzkko/deutschland/carica.mjs --paralleli=4           quanti insieme (4)
//   node tools/pzkko/deutschland/carica.mjs --senza-cors            non tocca le regole CORS del bucket
//   node tools/pzkko/deutschland/carica.mjs --elenco                stampa soltanto cosa c'è nel bucket (per cartella)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DATI, SERVER, leggiJson, argomenti, die } from './comune.mjs'
import { barra, log as logRegia } from '../../cruscotto/diretta.mjs'

const args = argomenti()
const PROVA = Boolean(args.prova)
const PARALLELI = Math.max(1, Math.min(8, Number(args.paralleli) || 4))
const MAX = Number(args.max) > 0 ? Number(args.max) : Infinity
// (m, la miniatura 480 che usa il tavolo dei ricordi dal 9.11 notte, mancava: aggiunta il 10.11, le foto del tavolo non arrivavano)
const CARTELLE = ['foto.json', 'f', 's', 'm', 'g', 'p', 'v', 'o']
const SOLO = typeof args.solo === 'string' ? args.solo.split(',').map((s) => s.trim()).filter(Boolean) : CARTELLE
for (const c of SOLO) if (!CARTELLE.includes(c)) die(`--solo: «${c}» non è fra ${CARTELLE.join(' ')}`)
const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', bin: 'application/octet-stream', json: 'application/json' }
const ORIGINI_CORS = ['https://www.pzkko.it', 'https://pzkko.it', 'https://*.vercel.app', 'http://localhost:5182', 'http://127.0.0.1:5182']

const b2File = path.join(SERVER, 'b2.mjs')
if (!existsSync(b2File)) die(`manca ${b2File}`)
const b2 = await import(pathToFileURL(b2File).href)
if (!b2.configurata()) die('C:\\pzkko-server\\config\\b2.json manca o è incompleto: il caricamento parte quando c’è ({ keyId, key, bucketId, bucket })')

const manifesto = leggiJson(path.join(DATI, 'foto.json'))
if (!manifesto?.foto) die('manca dati\\foto.json: prima manifesto.mjs')
/** id → nome col quale si salva il file (IMG_5506.JPG / .PNG / .MP4), come fa il server di casa. */
const nomi = new Map()
for (const f of manifesto.foto) {
  const base = String(f.nome ?? f.id).replace(/\.[^.]+$/, '')
  if (f.o) nomi.set(`o/${f.o}`, `${base}.${f.o.split('.').pop().toUpperCase().replace('JPEG', 'JPG')}`)
  if (f.v) nomi.set(`v/${f.v}`, `${base}.MP4`)
}
const sha1 = (b) => createHash('sha1').update(b).digest('hex')
const pulito = (s) => String(s).replace(/[^\x20-\x7e]/g, '?').replace(/["\\]/g, '_')

// ── cosa c'è in locale ──
const locali = [] // { nome: 'o/img-5506.jpg', file, size }
for (const c of SOLO) {
  if (c === 'foto.json') { locali.push({ nome: 'foto.json', file: path.join(DATI, 'foto.json'), size: statSync(path.join(DATI, 'foto.json')).size }); continue }
  const dir = path.join(DATI, c)
  if (!existsSync(dir)) continue
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f), st = statSync(p)
    if (!st.isFile() || /\.tmp$/.test(f)) continue
    locali.push({ nome: `${c}/${f}`, file: p, size: st.size })
  }
}
// i file che il manifesto non nomina non si caricano (resti di prove, dati finti)
const usati = new Set(['foto.json'])
for (const f of manifesto.foto) for (const k of ['s', 'm', 'g', 'o', 'p', 'v']) if (f[k]) usati.add(`${k}/${f[k]}`)
for (let n = 0; n < (manifesto.fasci?.n ?? 0); n++) usati.add(`f/${n}.bin`)
const daConsiderare = locali.filter((l) => usati.has(l.nome))
console.log(`${daConsiderare.length} file in locale nelle cartelle ${SOLO.join(' ')} (${(daConsiderare.reduce((a, l) => a + l.size, 0) / 1e9).toFixed(2)} GB)${locali.length > daConsiderare.length ? `, ${locali.length - daConsiderare.length} non nel manifesto: ignorati` : ''}`)

// ── cosa c'è nel bucket (una chiamata per cartella, maxFileCount 10000) ──
const a = await b2.autorizza()
console.log(`B2: bucket «${a.bucket}», api ${new URL(a.apiUrl).host}, download ${new URL(a.downloadUrl).host}`)
const remoti = new Map() // nome → { sha1, size }
async function elenca(prefisso) {
  let startFileName
  for (let giro = 0; giro < 20; giro++) {
    const r = await b2.chiama('b2_list_file_names', { bucketId: a.bucketId, prefix: prefisso, maxFileCount: 10000, ...(startFileName ? { startFileName } : {}) })
    for (const f of r.files ?? []) if (f.action === 'upload') remoti.set(f.fileName, { sha1: f.contentSha1, size: f.contentLength })
    if (!r.nextFileName) break
    startFileName = r.nextFileName
  }
}
for (const c of SOLO) await elenca(c === 'foto.json' ? 'foto.json' : `${c}/`)
if (args.elenco) {
  const perCartella = {}
  for (const [nome, r] of remoti) { const c = nome.includes('/') ? nome.split('/')[0] : nome; perCartella[c] ??= { n: 0, byte: 0 }; perCartella[c].n++; perCartella[c].byte += r.size }
  for (const [c, v] of Object.entries(perCartella)) console.log(`  ${c}: ${v.n} file, ${(v.byte / 1e6).toFixed(1)} MB`)
  console.log(`nel bucket: ${remoti.size} file, ${([...remoti.values()].reduce((s, r) => s + r.size, 0) / 1e9).toFixed(2)} GB`)
  process.exit(0)
}

// ── cosa manca: dimensione diversa, o uguale ma sha1 diverso ──
const daFare = []
let saltati = 0
for (const l of daConsiderare) {
  const r = remoti.get(l.nome)
  if (r && r.size === l.size) {
    l.sha1 = sha1(readFileSync(l.file))
    if (r.sha1 === l.sha1) { saltati++; continue }
  }
  daFare.push(l)
}
// prima il piccolo (foto.json, fasci, miniature), poi grandi, poster, video, originali
const ordine = Object.fromEntries(CARTELLE.map((c, i) => [c, i]))
daFare.sort((x, y) => ordine[x.nome.split('/')[0]] - ordine[y.nome.split('/')[0]] || x.nome.localeCompare(y.nome))
const scelti = daFare.slice(0, MAX)
const byte = scelti.reduce((s, l) => s + l.size, 0)
console.log(`${saltati} già uguali nel bucket, ${daFare.length} da caricare (${(daFare.reduce((s, l) => s + l.size, 0) / 1e9).toFixed(2)} GB)${scelti.length < daFare.length ? `, ne faccio ${scelti.length} (--max)` : ''}${PROVA ? ' · PROVA: non carico niente' : ''}`)
if (PROVA) { for (const l of scelti.slice(0, 30)) console.log(`  ${l.nome} ${(l.size / 1e3).toFixed(0)} KB`); if (scelti.length > 30) console.log(`  … e altri ${scelti.length - 30}`); process.exit(0) }

// ── le regole CORS del bucket (idempotenti: una chiamata) ──
if (!args['senza-cors']) {
  try {
    await b2.chiama('b2_update_bucket', { accountId: a.accountId, bucketId: a.bucketId, corsRules: [{ corsRuleName: 'pzkko-deutschland', allowedOrigins: ORIGINI_CORS, allowedOperations: ['b2_download_file_by_name'], allowedHeaders: ['range', 'if-none-match', 'if-range', 'authorization'], exposeHeaders: ['content-length', 'content-type', 'content-range', 'accept-ranges', 'etag', 'x-bz-content-sha1', 'x-bz-file-name'], maxAgeSeconds: 86400 }], lifecycleRules: [] })
    console.log(`CORS impostato per ${ORIGINI_CORS.join(', ')}`)
  } catch (e) { console.error(`✗ CORS non impostato: ${e.message} (serve la capacità writeBucketCors; --senza-cors per saltare)`) }
}
if (!scelti.length) { console.log('niente da caricare'); process.exit(0) }

// ── il caricamento: PARALLELI lavoratori, ognuno col suo indirizzo di upload ──
const t0 = Date.now()
let fatti = 0, fattiByte = 0, errori = 0
const falliti = []
if (scelti.length > 10) logRegia('claude', `A1 carica.mjs: parte il caricamento su B2 di ${scelti.length} file (${(byte / 1e9).toFixed(2)} GB) in ${PARALLELI} paralleli`)
async function indirizzoUpload() {
  const r = await b2.chiama('b2_get_upload_url', { bucketId: a.bucketId })
  if (!r.uploadUrl || !r.authorizationToken) throw new Error('b2_get_upload_url senza indirizzo')
  return r
}
async function carica(l, up) {
  const dati = readFileSync(l.file)
  l.sha1 ??= sha1(dati)
  const est = l.nome.split('.').pop().toLowerCase()
  const intest = {
    Authorization: up.authorizationToken,
    'X-Bz-File-Name': encodeURIComponent(l.nome).replace(/%2F/g, '/'),
    'Content-Type': MIME[est] ?? 'application/octet-stream',
    'Content-Length': String(dati.length),
    'X-Bz-Content-Sha1': l.sha1,
    'X-Bz-Info-b2-cache-control': encodeURIComponent(l.nome === 'foto.json' ? 'private, no-cache' : 'private, max-age=86400'),
  }
  const nome = nomi.get(l.nome)
  if (nome) intest['X-Bz-Info-b2-content-disposition'] = encodeURIComponent(`inline; filename="${pulito(nome)}"`)
  const r = await fetch(up.uploadUrl, { method: 'POST', headers: intest, body: dati, signal: AbortSignal.timeout(20 * 60_000) })
  if (r.ok) return
  const corpo = await r.json().catch(() => ({}))
  throw new b2.ErroreB2('b2_upload_file', r.status, corpo)
}
let prossimo = 0
async function lavoratore(k) {
  let up = null
  while (prossimo < scelti.length) {
    const l = scelti[prossimo++]
    let ok = false
    for (let tentativo = 1; tentativo <= 5 && !ok; tentativo++) {
      try {
        up ??= await indirizzoUpload()
        await carica(l, up)
        ok = true
      } catch (e) {
        // 401 (token dell'upload scaduto), 408, 429, 5xx e gli errori di rete: indirizzo nuovo e si riprova dopo un po'
        const status = e.status ?? 0
        const riprovabile = status === 0 || status === 401 || status === 408 || status === 429 || status >= 500
        up = null
        if (!riprovabile || tentativo === 5) { errori++; falliti.push(l.nome); console.error(`  ✗ ${l.nome}: ${e.message}`); break }
        await new Promise((r) => setTimeout(r, Math.min(30_000, 1000 * 2 ** tentativo)))
      }
    }
    if (ok) { fatti++; fattiByte += l.size; remoti.set(l.nome, { sha1: l.sha1, size: l.size }) }
    const sec = (Date.now() - t0) / 1000
    if (fatti % 25 === 0 || l.size > 5e6) console.log(`  ${ok ? '✓' : '✗'} ${l.nome} ${(l.size / 1e6).toFixed(1)} MB · ${fatti}/${scelti.length} · ${(fattiByte / 1e6).toFixed(0)} MB · ${(fattiByte / 1e6 / Math.max(1, sec)).toFixed(2)} MB/s · ~${Math.round(((byte - fattiByte) / Math.max(1e3, fattiByte / Math.max(1, sec))) / 60)} min`)
    barra('deutschland-b2', 'Deutschland → B2', fatti + errori, scelti.length, l.nome)
  }
}
await Promise.all(Array.from({ length: PARALLELI }, (_, k) => lavoratore(k)))
const min = Math.round((Date.now() - t0) / 60_000)
console.log(`\n${fatti} caricati (${(fattiByte / 1e9).toFixed(2)} GB) in ${min} min, ${errori} falliti${falliti.length ? `: ${falliti.slice(0, 10).join(', ')}${falliti.length > 10 ? '…' : ''} (rilancia: riprende da sé)` : ''}`)
if (scelti.length > 10 || errori) logRegia('claude', `A1 carica.mjs: ${fatti} file (${(fattiByte / 1e9).toFixed(2)} GB) su B2 in ${min} min, ${errori} falliti${errori ? ' (rilanciare carica.mjs riprende)' : ''}`)
if (errori) process.exitCode = 1
