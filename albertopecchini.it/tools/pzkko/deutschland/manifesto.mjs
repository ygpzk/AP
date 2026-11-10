#!/usr/bin/env node
// Il manifesto di Deutschland (9.11.2026): unisce la cache del catalogo (cataloga.mjs), i posti (posti.mjs), i volti
// (riconosci.py + catalogo\volti.json scritto da Alberto: { gruppo: nome }), i tag di CLIP (categorie.mjs) e le
// correzioni a mano (catalogo\tag-mano.json { piu: { 'img-5506': ['cibo'] }, meno: { 'img-5506': ['auto'] } }) e scrive
// C:\pzkko-server\deutschland\dati\foto.json, il contratto della galleria (piano del cantiere, «Manifesto»): foto in ordine
// di tempo, posti, tappe (le file di foto dello stesso posto), i tag. Atomico: il server e la galleria non vedono mai
// mezzo file. Accanto, dati\origini.json (privato, il server non lo serve): per ogni id da dove leggere l'originale su D:
// (dal 9.11 sera solo il DNG per /raw: gli originali scaricabili stanno tutti in dati\o\).
//
// MANIFESTO v2 (9.11 sera): ogni voce porta anche `s` (la miniatura piccola, 360 px) e `fascio` (il numero del fascio di
// 40 che la contiene, nell'ordine delle foto: fasci.mjs scrive dati\f\<n>.bin), e, se catalogo\didascalie.json c'è (lo
// scrive descrivi.mjs dell'Agente 4, un modello che guarda la foto: { "<id>": { didascalia, persone, tag: [...], sicuro } }),
// `didascalia` e `persone`. I tag del modello si uniscono a quelli di CLIP con la regola del piano: un tag entra se lo dicono
// ENTRAMBI, oppure se il modello è sicuro (`sicuro: true` sulla voce, o il tag in `sicuri: [...]`); i tag di persona (volti),
// quelli a mano e foto/video/screenshot restano come sono. L'elenco `tag` del manifesto è TAG più i tag nuovi del modello,
// nell'ordine di TAG_MODELLO. `manifesto.fasci` = quanti sono e da quanti.
//
//   node tools/pzkko/deutschland/manifesto.mjs              scrive foto.json e origini.json (sostituisce quello finto)
//   node tools/pzkko/deutschland/manifesto.mjs --prova      dice cosa scriverebbe
//   node tools/pzkko/deutschland/manifesto.mjs --pulisci    toglie da dati\{s,m,g,o,p,v} i file che nessuna voce usa (quelli finti)
import { existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { DATI, CATALOGO, TAG, VIAGGIO, PER_FASCIO, leggiJson, scriviJson, argomenti, die } from './comune.mjs'
import { log as logRegia } from '../../cruscotto/diretta.mjs'

const args = argomenti()
const cache = leggiJson(path.join(CATALOGO, 'cache.json'))
if (!cache?.voci) die('manca catalogo\\cache.json: prima cataloga.mjs')
const posti = leggiJson(path.join(CATALOGO, 'posti.json'), { posti: [], di: {} })
const clipAuto = leggiJson(path.join(CATALOGO, 'clip-auto.json'), {})
const gruppi = leggiJson(path.join(CATALOGO, 'volti-gruppi.json'), { perFoto: {} })
const nomiVolti = leggiJson(path.join(CATALOGO, 'volti.json'), {}) // { '1': 'pekko', '4': 'mikas' } (lo scrive Alberto guardando i fogli)
const mano = leggiJson(path.join(CATALOGO, 'tag-mano.json'), { piu: {}, meno: {} })
const didascalie = leggiJson(path.join(CATALOGO, 'didascalie.json'), null) // (Agente 4: si legge soltanto)
// i ricordi (Deutschland 3, 9.11.2026 notte): { migliori: [id…], meme: [{ testo, chi, vicino? }] }, scritto a mano. Le
// migliori sono le foto del tavolo appena si entra; i meme le frasi del viaggio sparse sul tavolo (vicino = la foto accanto
// a cui stanno). Stanno qui, nel manifesto dietro la password, e non nel repo pubblico
const ricordi = leggiJson(path.join(CATALOGO, 'ricordi.json'), { migliori: [], meme: [] })
const PERSONE = new Set(['pekko', 'mikas', 'jonny', 'jella'])
/** L'elenco chiuso dei 20 tag del modello (piano, punto 4), nell'ordine in cui si aggiungono a TAG se compaiono. */
const TAG_MODELLO = ['pekko', 'mikas', 'jonny', 'jella', 'gruppo', 'selfie', 'cibo', 'birra', 'notte', 'stadio', 'chiesa', 'strada', 'auto', 'treno', 'hotel', 'natura', 'panorama', 'negozio', 'screenshot', 'video']
const pulito = (s, n = 120) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

const voci = Object.values(cache.voci).filter((v) => !v.escluso && v.t).sort((a, b) => Date.parse(a.t) - Date.parse(b.t) || (a.numero ?? 0) - (b.numero ?? 0))
const foto = [], origini = {}, tagVisti = new Set(TAG)
for (const v of voci) {
  const tag = new Set([v.tipo === 'video' ? 'video' : 'foto'])
  if (v.screenshot) tag.add('screenshot')
  const clip = new Set(clipAuto[v.id] ?? [])
  const d = didascalie?.[v.id]
  if (d && Array.isArray(d.tag)) {
    // la regola del piano: dentro se lo dicono entrambi, o se il modello è sicuro
    const sicuri = new Set(Array.isArray(d.sicuro) ? d.sicuro : Array.isArray(d.sicuri) ? d.sicuri : []) // (descrivi.mjs: `sicuro` ⊆ `tag`)
    for (const t of d.tag) if (typeof t === 'string' && (clip.has(t) || d.sicuro === true || sicuri.has(t)) && !PERSONE.has(t) && TAG_MODELLO.includes(t)) tag.add(t)
    // (un tag di CLIP che il modello non può nemmeno dire — paesaggi, mezzi, alcool: fuori dal suo elenco — resta)
    for (const t of clip) if (d.tag.includes(t) || !TAG_MODELLO.includes(t)) tag.add(t)
  } else for (const t of clip) tag.add(t)
  const volti = gruppi.perFoto?.[v.id]
  for (const g of volti?.gruppi ?? []) { const nome = nomiVolti[String(g)]; if (nome && PERSONE.has(nome)) tag.add(nome) }
  for (const t of mano.piu?.[v.id] ?? []) tag.add(t) // (prima di «gruppo»: una persona messa a mano conta)
  if ([...tag].filter((t) => PERSONE.has(t)).length >= 2) tag.add('gruppo')
  for (const t of mano.meno?.[v.id] ?? []) tag.delete(t)
  for (const t of tag) tagVisti.add(t)
  const f = {
    id: v.id, tipo: v.tipo, nome: v.nome, t: v.t, giorno: v.giorno, ora: v.ora, tStimato: Boolean(v.tStimato),
    ...(Number.isFinite(v.lat) ? { lat: v.lat, lon: v.lon, gpsStimato: Boolean(v.gpsStimato) } : { gpsStimato: true }),
    posto: posti.di?.[v.id] ?? null, w: v.w, h: v.h, m: v.m, g: v.g,
    // s e fascio solo se la miniatura piccola c'è (derivate v3): senza, rete.js usa m
    ...(v.s ? { s: v.s, fascio: Math.floor(foto.length / PER_FASCIO) } : {}),
  }
  if (v.tipo === 'video') Object.assign(f, { v: v.v, p: v.p, durata: v.durata, ...(v.live ? { live: true } : {}) })
  else f.o = v.o
  if (v.raw) { f.raw = v.raw; f.pesoRaw = v.pesoRaw }
  Object.assign(f, { peso: v.peso, blur: v.blur, col: v.col, tag: [...tag], volti: volti?.volti ?? 0, persone: Number.isInteger(d?.persone) && d.persone >= 0 ? d.persone : volti?.volti ?? 0 })
  if (d && pulito(d.didascalia)) f.didascalia = pulito(d.didascalia)
  foto.push(f)
  origini[v.id] = { nome: v.nome, ...(v.origine ? { o: v.origine } : {}), ...(v.raw ? { raw: v.nome } : {}) }
}
// i tag nell'ordine: TAG, poi quelli nuovi del modello nell'ordine di TAG_MODELLO
const ELENCO_TAG = [...TAG, ...TAG_MODELLO.filter((t) => !TAG.includes(t) && tagVisti.has(t))]
for (const f of foto) f.tag = ELENCO_TAG.filter((t) => f.tag.includes(t))

// i posti (solo quelli con foto incluse) e le tappe: file consecutive dello stesso posto nell'ordine del tempo
const usati = new Set(foto.map((f) => f.posto).filter(Boolean))
const elencoPosti = posti.posti.filter((p) => usati.has(p.id)).map((p) => ({ id: p.id, nome: p.nome || p.nomeAuto || p.id, nomeAuto: p.nomeAuto || '', lat: p.lat, lon: p.lon, n: foto.filter((f) => f.posto === p.id).length }))
const tappe = []
for (const [i, f] of foto.entries()) {
  if (!f.posto) continue
  const u = tappe[tappe.length - 1]
  if (u && u.posto === f.posto && u.a >= i - 3) u.a = i // (una foto senza posto in mezzo non spezza la tappa)
  else tappe.push({ posto: f.posto, da: i, a: i })
}
const giorni = foto.map((f) => f.giorno).sort()
const nFasci = foto.length ? Math.floor((foto.length - 1) / PER_FASCIO) + 1 : 0
const manifesto = { v: 2, generato: new Date().toISOString(), viaggio: { ...VIAGGIO, da: giorni[0] ?? VIAGGIO.da, a: giorni[giorni.length - 1] ?? VIAGGIO.a }, tag: ELENCO_TAG, fasci: { n: nFasci, per: PER_FASCIO }, posti: elencoPosti, tappe, foto }
{
  const ci = new Set(foto.map((f) => f.id))
  const via = (ricordi.migliori ?? []).filter((id) => !ci.has(id))
  if (via.length) console.log(`  ATTENZIONE: in ricordi.json ${via.length} migliori che non ci sono più (${via.slice(0, 5).join(', ')})`)
  manifesto.migliori = (ricordi.migliori ?? []).filter((id) => ci.has(id))
  manifesto.meme = (ricordi.meme ?? []).map((m) => ({ testo: pulito(m.testo, 200), chi: pulito(m.chi, 30) || null, vicino: ci.has(m.vicino) ? m.vicino : null })).filter((m) => m.testo)
}

const conta = Object.fromEntries(ELENCO_TAG.map((t) => [t, foto.filter((f) => f.tag.includes(t)).length]))
const senzaS = foto.filter((f) => !cache.voci[f.id]?.s).length
console.log(`${foto.length} voci (${foto.filter((f) => f.tipo === 'video').length} video, ${foto.filter((f) => f.tStimato).length} con data stimata, ${foto.filter((f) => !Number.isFinite(f.lat)).length} senza GPS), ${elencoPosti.length} posti, ${tappe.length} tappe, ${nFasci} fasci da ${PER_FASCIO}, ${manifesto.viaggio.da} → ${manifesto.viaggio.a}${didascalie ? ` · ${foto.filter((f) => f.didascalia).length} didascalie` : ' · (catalogo\\didascalie.json non c’è ancora)'}`)
console.log(`tag: ${Object.entries(conta).map(([t, n]) => `${t} ${n}`).join(' · ')}`)
if (senzaS) console.log(`  ATTENZIONE: ${senzaS} voci senza la miniatura piccola s (derivate vecchie): rilancia cataloga.mjs; intanto s = m`)
if (!existsSync(path.join(CATALOGO, 'volti.json'))) console.log('  (catalogo\\volti.json non c’è ancora: niente pekko/mikas/jonny/jella finché Alberto non dice chi è chi nei fogli di lavoro\\deutschland\\volti\\)')
if (args.prova) process.exit(0)

scriviJson(path.join(DATI, 'origini.json'), origini)
scriviJson(path.join(DATI, 'foto.json'), manifesto)
console.log(`✓ ${path.join(DATI, 'foto.json')} e origini.json`)
logRegia('claude', `A1: manifesto VERO scritto in C:\\pzkko-server\\deutschland\\dati\\foto.json (${foto.length} voci, ${elencoPosti.length} posti): sostituisce quello finto, il server lo rilegge da sé`)

if (args.pulisci) {
  const usa = new Set()
  for (const f of foto) for (const k of ['s', 'm', 'g', 'o', 'p', 'v']) if (f[k]) usa.add(`${k}/${f[k]}`)
  let via = 0
  for (const k of ['s', 'm', 'g', 'o', 'p', 'v']) if (existsSync(path.join(DATI, k))) for (const nome of readdirSync(path.join(DATI, k))) if (!usa.has(`${k}/${nome}`)) { rmSync(path.join(DATI, k, nome)); via++ }
  console.log(`  ${via} file che nessuna voce usa tolti da dati\\`)
}
