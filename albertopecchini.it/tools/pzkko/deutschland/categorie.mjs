#!/usr/bin/env node
// Le categorie di Deutschland (9.11.2026): i tag di contenuto (cibo, paesaggi, natura, strada, auto, hotel, mezzi,
// alcool) con CLIP su Replicate (andreasjansson/clip-features, tools/replicate.mjs: il token in .env.local). Si carica
// la miniatura (dati\m\, 480 px, ~15 KB) e si confronta il suo embedding con quelli delle frasi: softmax dei coseni
// (×100, come CLIP), e un tag entra se la sua probabilità supera la soglia (0.22), al più 3. Alcune frasi «di scarto»
// (persone, screenshot, selfie, un muro…) prendono la probabilità delle foto che non c'entrano con nessun tag.
// Le somiglianze si salvano in catalogo\clip.json, così la soglia si ritocca senza ripagare; i tag finiscono in
// catalogo\clip-auto.json { 'img-5506': ['cibo'] } che manifesto.mjs unisce al resto. pekko/mikas/jonny/jella li dà
// riconosci.py, screenshot foto video li dà il tipo del file. Spesa: una predizione per 24 immagini, pochi centesimi.
//
//   node tools/pzkko/deutschland/categorie.mjs                 le miniature che non hanno ancora le somiglianze
//   node tools/pzkko/deutschland/categorie.mjs --soglia=0.25    rifà solo i tag dalle somiglianze salvate
//   node tools/pzkko/deutschland/categorie.mjs --solo=5506      una foto, per guardare le probabilità
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { CATALOGO, configurazione, leggiJson, scriviJson, argomenti, die } from './comune.mjs'
import { api } from '../../replicate.mjs'

const args = argomenti()
const MODELLO = 'andreasjansson/clip-features'
const SOGLIA = Number(args.soglia) || 0.22, MAX_TAG = 3
const LOTTO = Number(args.lotto) || 8 // (con 24 miniature da 480 px il modello finiva la memoria della GPU: CUDA out of memory)
const FRASI = {
  cibo: 'a photo of food, a meal on a plate or a dish in a restaurant',
  paesaggi: 'a landscape photo: a city skyline, a panoramic view, mountains or a river seen from far away',
  natura: 'a photo of nature: trees, a park, a forest, a lake or a garden',
  strada: 'a photo of a city street with buildings, shops and people walking',
  auto: 'a photo of a car, the inside of a car, a dashboard or a highway seen from a car',
  hotel: 'a photo of a hotel room, a bed, a bathroom or a hotel corridor',
  mezzi: 'a photo of a train, a subway, a tram, a bus or a station platform',
  alcool: 'a photo of beer glasses, cocktails, bottles of alcohol or a bar counter',
  // le frasi di scarto (niente tag)
  _persone: 'a selfie or a close-up portrait of one or more people looking at the camera',
  _screenshot: 'a screenshot of a phone app, a map or a chat',
  _altro: 'a blurry photo of a wall, a floor, a ceiling or an object held in hand',
}
const SOLO = typeof args.solo === 'string' ? new Set(args.solo.split(',').map((s) => `img-${s.trim().replace(/^img[-_]?/i, '')}`)) : null

const cache = leggiJson(path.join(CATALOGO, 'cache.json'))
if (!cache?.voci) die('manca catalogo\\cache.json: prima cataloga.mjs')
const CLIP = path.join(CATALOGO, 'clip.json')
const clip = leggiJson(CLIP, { frasi: null, testi: {}, sim: {} })

const norma = (v) => { const n = Math.hypot(...v); return v.map((x) => x / n) }
const punto = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)

// (clip-features è un modello della community: si chiama con la versione su /predictions, non su /models/…/predictions
//  come gli ufficiali che usa predict() di replicate.mjs)
let VERSIONE = null
async function predizione(input) {
  VERSIONE ??= (await api(`/models/${MODELLO}`)).latest_version?.id ?? die(`${MODELLO}: niente versione`)
  let p
  for (let i = 1; !p; i++) {
    try { p = await api('/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'wait=60' }, body: JSON.stringify({ version: VERSIONE, input }) }) }
    catch (e) { if (e.status !== 429 || i === 10) throw e; await new Promise((r) => setTimeout(r, 5000 + Math.random() * 10000)) } // (sotto i 10 $ di credito: al più 5 di fila)
  }
  while (!['succeeded', 'failed', 'canceled'].includes(p.status)) { await new Promise((r) => setTimeout(r, 2500)); p = await api(p.urls.get) }
  if (p.status !== 'succeeded') die(`predizione ${p.id} ${p.status}: ${p.error ?? ''}`)
  return p
}
/** Gli embedding di una lista di input (testi o URL), nell'ordine. */
async function embedding(inputs) {
  const p = await predizione({ inputs: inputs.join('\n') })
  const out = p.output
  if (!Array.isArray(out) || out.length !== inputs.length) throw new Error(`CLIP ha risposto con ${out?.length} embedding per ${inputs.length} input`)
  return out.map((o) => norma(o.embedding ?? o))
}

// le frasi: una volta (se cambiano, si rifanno e le somiglianze vecchie non valgono più)
const firmaFrasi = JSON.stringify(FRASI)
if (clip.frasi !== firmaFrasi) {
  console.log('→ gli embedding delle frasi…')
  const chiavi = Object.keys(FRASI)
  const e = await embedding(chiavi.map((k) => FRASI[k]))
  clip.testi = Object.fromEntries(chiavi.map((k, i) => [k, e[i]]))
  clip.frasi = firmaFrasi
  clip.sim = {} // (frasi nuove: le somiglianze si rifanno)
  scriviJson(CLIP, clip)
}

// le immagini che mancano: a lotti. Il modello scarica da sé gli indirizzi che gli si danno, e i file caricati su
// Replicate (upload) non sono pubblici: le miniature gliele dà il server delle foto di casa attraverso il Funnel
// (…/deutschland/m/<id>.webp), con un biglietto da venti minuti fatto apposta (biglietto.mjs, emetti con durata), così
// nei registri di Replicate non resta un biglietto buono per un giorno. Serve il server acceso e il Funnel aperto.
const voci = Object.values(cache.voci).filter((v) => !v.escluso && !v.screenshot && (!SOLO || SOLO.has(v.id)))
const mancano = voci.filter((v) => !clip.sim[v.id] || typeof args.solo === 'string')
void path; console.log(`${voci.length} immagini, ${mancano.length} senza somiglianze`)
let biglietto = null
if (mancano.length) {
  const { emetti } = await import(pathToFileURL('C:\\pzkko-server\\deutschland\\biglietto.mjs').href)
  const { pubblico } = configurazione()
  biglietto = { pubblico, ...emetti(Date.now(), undefined, 20 * 60_000) }
  const r = await fetch(`${pubblico}/m/${mancano[0].m}?b=${biglietto.biglietto}`, { method: 'HEAD' }).catch((e) => ({ status: e.message }))
  if (r.status !== 200) die(`il server delle foto non risponde da fuori (${pubblico}: ${r.status}): acceso? Funnel su /deutschland? (LEGGIMI.md del server)`)
}
for (let i = 0; i < mancano.length; i += LOTTO) {
  const lotto = mancano.slice(i, i + LOTTO)
  const url = lotto.map((v) => `${biglietto.pubblico}/m/${v.m}?b=${biglietto.biglietto}`)
  const e = await embedding(url)
  for (const [k, v] of lotto.entries()) clip.sim[v.id] = Object.fromEntries(Object.entries(clip.testi).map(([t, te]) => [t, +punto(e[k], te).toFixed(4)]))
  scriviJson(CLIP, clip)
  console.log(`  ${Math.min(i + LOTTO, mancano.length)}/${mancano.length}`)
}

// i tag: softmax ×100 dei coseni, soglia, al più 3; le frasi di scarto non danno tag
const tagDi = (sim) => {
  const k = Object.keys(sim), z = k.map((x) => Math.exp(100 * sim[x])), s = z.reduce((a, b) => a + b, 0)
  const prob = Object.fromEntries(k.map((x, i) => [x, z[i] / s]))
  return { prob, tag: k.filter((x) => !x.startsWith('_') && prob[x] >= SOGLIA).sort((a, b) => prob[b] - prob[a]).slice(0, MAX_TAG) }
}
const auto = {}, conta = {}
for (const v of voci) {
  if (!clip.sim[v.id]) continue
  const { prob, tag } = tagDi(clip.sim[v.id])
  if (tag.length) auto[v.id] = tag
  for (const t of tag) conta[t] = (conta[t] ?? 0) + 1
  if (SOLO) console.log(v.id, Object.entries(prob).sort((a, b) => b[1] - a[1]).map(([k, p]) => `${k} ${(p * 100).toFixed(0)}%`).join(' · '), '→', tag.join(', ') || '—')
}
if (!SOLO) {
  const vecchi = leggiJson(path.join(CATALOGO, 'clip-auto.json'), {})
  scriviJson(path.join(CATALOGO, 'clip-auto.json'), { ...vecchi, ...Object.fromEntries(voci.map((v) => [v.id, auto[v.id] ?? []])) }, 0)
  console.log(`✓ catalogo\\clip-auto.json: ${Object.keys(auto).length} immagini con almeno un tag (soglia ${SOGLIA}) · ${Object.entries(conta).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(', ')}`)
}
