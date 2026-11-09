#!/usr/bin/env node
// Le didascalie di Deutschland (9.11.2026, Agente 4 del cantiere «Deutschland 2»): un modello che guarda la foto (VLM
// su Replicate, tools/replicate.mjs: il token in .env.local) scrive per ogni voce del manifesto una didascalia in
// italiano da album dei ricordi (≤ 12 parole, mai nomi di persona), conta le persone e sceglie i tag da un elenco
// chiuso. CLIP (categorie.mjs → clip-auto.json) resta la seconda opinione: manifesto.mjs (A1) fa entrare un tag se lo
// dicono entrambi, oppure se il VLM lo ha in `sicuro`.
//
// Al modello va la miniatura m\ (480 px) per le foto, il poster p\ per i video, la media g\ (ridotta a 1280 px) per gli
// screenshot, perché lì conta il testo. L'immagine viaggia dentro la richiesta come data URL base64: niente indirizzi
// pubblici in giro, niente file lasciati su Replicate. Le didascalie non si stampano a video se non con --prova.
//
// I risultati sono incrementali in catalogo\didascalie.json { "<id>": { didascalia, persone, tag, sicuro, modello } }
// (si scrive ogni 20 voci e alla fine: se il processo cade non si perde niente e al giro dopo riparte da dove era);
// il conto della spesa (secondi di GPU × prezzo) in catalogo\didascalie-conto.json.
//
//   node tools/pzkko/deutschland/descrivi.mjs                       le voci che non hanno ancora la didascalia
//   node tools/pzkko/deutschland/descrivi.mjs --solo=20              le prime 20 che mancano (per provare)
//   node tools/pzkko/deutschland/descrivi.mjs --ids=5506,5522 --prova   queste, e stampa la risposta grezza
//   node tools/pzkko/deutschland/descrivi.mjs --ids=… --secco          prova senza salvare niente (per confrontare i modelli)
//   node tools/pzkko/deutschland/descrivi.mjs --rifai=5506,5522      rifà queste anche se ci sono già
//   node tools/pzkko/deutschland/descrivi.mjs --modello=molmo        qwen (default) · molmo · moondream
//   node tools/pzkko/deutschland/descrivi.mjs --paralleli=6          richieste in volo insieme (max 6)
//   node tools/pzkko/deutschland/descrivi.mjs --conta                solo la distribuzione dei tag di quello che c'è
//   node tools/pzkko/deutschland/descrivi.mjs --ripulisci            riapplica la pulizia delle didascalie già salvate (gratis)
import path from 'node:path'
import sharp from 'sharp'
import { DATI, CATALOGO, leggiJson, scriviJson, argomenti, die } from './comune.mjs'
import { api } from '../../replicate.mjs'

const args = argomenti()
const PARALLELI = Math.min(6, Math.max(1, Number(args.paralleli) || 6))
const OGNI = 20 // voci fra una scrittura e l'altra
const PREZZO_SECONDO = 0.000975 // $ al secondo di Nvidia L40S (replicate.com/pricing, 9.11.2026): i tre modelli girano lì

/** L'elenco chiuso dei tag che il modello può dare; `screenshot` e `video` li mette il tipo del file, non il modello. */
export const TAG_VLM = ['gruppo', 'selfie', 'cibo', 'birra', 'notte', 'stadio', 'chiesa', 'strada', 'auto', 'treno', 'hotel', 'natura', 'panorama', 'negozio']
/** Quello che il modello scrive fuori dall'elenco e che si capisce lo stesso (il resto va via). */
const SINONIMI = { ristorante: 'cibo', pranzo: 'cibo', cena: 'cibo', colazione: 'cibo', food: 'cibo', beer: 'birra', alcool: 'birra', alcol: 'birra', liquori: 'birra', piazza: 'strada', via: 'strada', street: 'strada', città: 'strada', tunnel: 'auto', autostrada: 'auto', car: 'auto', metro: 'treno', tram: 'treno', stazione: 'treno', train: 'treno', albergo: 'hotel', camera: 'hotel', parco: 'natura', alberi: 'natura', bosco: 'natura', nature: 'natura', vista: 'panorama', skyline: 'panorama', supermercato: 'negozio', mercato: 'negozio', shop: 'negozio', amici: 'gruppo', amicizia: 'gruppo', group: 'gruppo', night: 'notte', notturna: 'notte', sera: 'notte', duomo: 'chiesa', cattedrale: 'chiesa', church: 'chiesa', calcio: 'stadio', arena: 'stadio', stadium: 'stadio' }
const NOMI = /\b(pekko|pecchini|alberto|mikas|jonny|jonathan|jella|jma)\b/gi // (i volti li gestisce un altro passo)

/** Il prompt: in inglese (il modello lo segue meglio), con il contesto che il manifesto sa (ora, città dal GPS, via). */
function prompt(v) {
  const screenshot = (v.tag ?? []).includes('screenshot')
  const posto = manifesto.posti?.find((p) => p.id === v.posto)
  const contesto = [`${v.ora} o'clock`, cittaDi(v), posto && !v.gpsStimato ? `near ${posto.nome}` : null].filter(Boolean).join(', ')
  return `You are captioning ${v.tipo === 'video' ? 'a frame of a short video' : screenshot ? 'a phone screenshot' : 'a photo'} for a private photo album of a trip to Munich and Stuttgart (Germany) with friends.
Where and when (from the file, may be imprecise): ${contesto}.
Answer with ONE JSON object only, no markdown, no comments, exactly these keys:
{"didascalia": "...", "persone": 0, "tag": [], "sicuro": []}
- "didascalia": a caption in ITALIAN, at most 12 words, warm and CONCRETE: name what is actually in the picture (objects, building, food, light, weather, mood), like a friend writing under the photo. Good: "Brezn e birra al tavolo dell'Hofbräuhaus", "La GLA grigia sulla A8 sotto la pioggia", "Ultime luci sul Neues Rathaus, quasi mezzanotte". Do not repeat the context: no dates, no "ricordo di viaggio", no "autunno", no "giorno del viaggio". City names in Italian (Monaco, Stoccarda), only when a landmark or the context supports them. Never start with "Immagine di", "Foto di" or "Ritratto di". NEVER use personal names.${screenshot ? ' For a screenshot say what the app shows (a map, a chat, a ticket, a route…).' : ''}
- "persone": how many people are visible, counting also partial figures, people in mirrors and in the background (0 if none).
- "tag": zero or more from this closed list, only what the picture clearly shows: ${TAG_VLM.join(', ')}. (gruppo = two or more friends posing; selfie = taken at arm's length or in a mirror; cibo = food or a meal; birra = beer or liquor glasses or bottles; notte = taken at night; stadio = football stadium; chiesa = church inside or outside; strada = city street or square; auto = car, inside a car or a highway; treno = train, subway, tram or station; hotel = hotel room, bed, bathroom, corridor or reception; natura = trees, park, lake, forest; panorama = wide view or skyline; negozio = shop, supermarket, kiosk, market stall.)
- "sicuro": the subset of "tag" you are certain about.`
}
/** La città dal GPS: Monaco, Stoccarda, l'autostrada fra le due, l'Italia all'andata e al ritorno. */
function cittaDi(v) {
  if (v.lat == null) return 'place unknown'
  if (v.lat < 47.3) return 'in Italy (on the way)'
  if (v.lat > 48.6 && v.lon < 9.5) return 'in Stuttgart'
  if (v.lat > 47.9 && v.lat < 48.4 && v.lon > 11.3 && v.lon < 11.8) return 'in Munich'
  return 'on the road between Munich and Stuttgart (Bavaria / Baden-Württemberg)'
}

// i tre modelli della community (si chiamano con la versione su /predictions, come fa categorie.mjs): nome breve →
// come si costruisce l'input e come si legge l'output (moondream risponde a pezzi, in un array)
const MODELLI = {
  qwen: { nome: 'lucataco/qwen2-vl-7b-instruct', input: (img, p) => ({ media: img, prompt: p, max_new_tokens: 160 }) },
  molmo: { nome: 'zsxkib/molmo-7b', input: (img, p) => ({ image: img, text: p, max_new_tokens: 160, temperature: 0.2, top_p: 0.9 }) },
  moondream: { nome: 'lucataco/moondream2', input: (img, p) => ({ image: img, prompt: p }) },
}
const SCELTO = args.modello && typeof args.modello === 'string' ? args.modello : 'qwen'
const MODELLO = MODELLI[SCELTO] ?? die(`modello «${SCELTO}»: scegli fra ${Object.keys(MODELLI).join(', ')}`)

const DIDASCALIE = path.join(CATALOGO, 'didascalie.json')
const CONTO = path.join(CATALOGO, 'didascalie-conto.json')
const manifesto = leggiJson(path.join(DATI, 'foto.json'))
if (!manifesto?.foto?.length) die('manca dati\\foto.json: prima manifesto.mjs')
const didascalie = leggiJson(DIDASCALIE, {})
const conto = leggiJson(CONTO, { modelli: {} })

const ids = (s) => new Set(String(s).split(',').map((x) => x.trim()).filter(Boolean).map((x) => (/^img-/.test(x) ? x : `img-${x.replace(/^img[-_]?/i, '')}`)))
const RIFAI = typeof args.rifai === 'string' ? ids(args.rifai) : null
const IDS = typeof args.ids === 'string' ? ids(args.ids) : null

// --conta: la distribuzione dei tag di quello che c'è già, e basta
function distribuzione() {
  const n = {}, mod = {}
  let persone = 0, conPersone = 0
  for (const d of Object.values(didascalie)) {
    for (const t of d.tag) n[t] = (n[t] ?? 0) + 1
    mod[d.modello] = (mod[d.modello] ?? 0) + 1
    persone += d.persone; if (d.persone) conPersone++
  }
  console.log(`${Object.keys(didascalie).length} didascalie (${Object.entries(mod).map(([m, k]) => `${m} ${k}`).join(', ')}) · ${conPersone} con persone, ${persone} persone in tutto`)
  console.log('  tag:', Object.entries(n).sort((a, b) => b[1] - a[1]).map(([t, k]) => `${t} ${k}`).join(' · ') || '—')
  const mancano = manifesto.foto.filter((v) => !didascalie[v.id]).length
  console.log(`  mancano ${mancano} voci del manifesto`)
  const spesa = Object.values(conto.modelli).reduce((s, m) => s + m.secondi * PREZZO_SECONDO, 0)
  console.log(`  spesa: ${spesa.toFixed(2)} $ (${Object.entries(conto.modelli).map(([m, k]) => `${m}: ${k.n} risposte, ${k.secondi.toFixed(0)} s di GPU`).join('; ') || '—'})`)
}
if (args.conta) { distribuzione(); process.exit(0) }
// --ripulisci: riapplica la pulizia delle didascalie a quelle già salvate (dopo un ritocco di didascaliaPulita, senza ripagare)
if (args.ripulisci) {
  let n = 0
  for (const d of Object.values(didascalie)) { const p = didascaliaPulita(d.didascalia); if (p && p !== d.didascalia) { console.log(`  ${d.didascalia} → ${p}`); d.didascalia = p; n++ } }
  if (n) scriviJson(DIDASCALIE, didascalie, 1)
  console.log(`✓ ${n} didascalie ripulite`); process.exit(0)
}

/** L'immagine da mandare, come data URL JPEG: miniatura per le foto, poster per i video, media ridotta per gli screenshot. */
async function immagine(v) {
  const screenshot = (v.tag ?? []).includes('screenshot')
  const file = v.tipo === 'video' ? path.join(DATI, 'p', v.p) : screenshot ? path.join(DATI, 'g', v.g) : path.join(DATI, 'm', v.m)
  let s = sharp(file).rotate()
  if (screenshot) s = s.resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
  const buf = await s.jpeg({ quality: 85 }).toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

let VERSIONE = null
async function predizione(input) {
  VERSIONE ??= (await api(`/models/${MODELLO.nome}`)).latest_version?.id ?? die(`${MODELLO.nome}: niente versione`)
  let p
  for (let i = 1; !p; i++) {
    try { p = await api('/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'wait=60' }, body: JSON.stringify({ version: VERSIONE, input }) }) }
    catch (e) { if (e.status !== 429 || i === 12) throw e; await new Promise((r) => setTimeout(r, 5000 + Math.random() * 10000)) } // (sotto i 10 $ di credito: al più 5 di fila)
  }
  for (let i = 0; !['succeeded', 'failed', 'canceled'].includes(p.status); ) {
    await new Promise((r) => setTimeout(r, 2500))
    try { p = await api(p.urls.get); i = 0 } catch (e) { if (++i === 5) throw e } // (errori passeggeri durante l'attesa)
  }
  if (p.status !== 'succeeded') throw new Error(`predizione ${p.id} ${p.status}: ${p.error ?? ''}`)
  const testo = Array.isArray(p.output) ? p.output.join('') : String(p.output ?? '')
  return { testo, secondi: p.metrics?.predict_time ?? 0 }
}

/** Il primo oggetto { … } bilanciato dentro un testo (il modello a volte ci mette intorno ```json o due parole). */
function primoOggetto(testo) {
  const da = testo.indexOf('{')
  if (da < 0) return null
  let prof = 0, inStringa = false
  for (let i = da; i < testo.length; i++) {
    const c = testo[i]
    if (inStringa) { if (c === '\\') i++; else if (c === '"') inStringa = false; continue }
    if (c === '"') inStringa = true
    else if (c === '{') prof++
    else if (c === '}' && --prof === 0) return testo.slice(da, i + 1)
  }
  return testo.slice(da) + '"}' // (troncato dai max token: si prova a chiuderlo)
}
function leggiJsonSporco(s) {
  try { return JSON.parse(s) } catch {}
  const pulito = s.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"').replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')
  try { return JSON.parse(pulito) } catch { return null }
}

/** La didascalia pulita: niente «foto di», niente nomi, niente virgolette, al più 12 parole (tagliata alla virgola o al punto). */
function didascaliaPulita(s) {
  let d = String(s ?? '').replace(/\s+/g, ' ').trim()
  d = d.replace(/^["'«»“”]+|["'«»“”.]+$/g, '').replace(/^(?:una? |la |le |il |lo |gli |l')?(?:immagine|foto|fotografia|scatto|video|screenshot|ritratto) (?:di |che mostra |che ritrae |con )/i, '')
  // (la data la sa già l'album: via «7 novembre 2026», «novembre 2026», «, 6-9», «2026»)
  d = d.replace(/,?\s*(?:il |del |nel |in |a )?(?:\b\d{1,2}(?:-\d{1,2})?\s+)?(?:novembre|november)(?:\s+(?:del\s+)?20\d\d)?\b/gi, '').replace(/,?\s*\b20\d\d\b/g, '').replace(/,\s*\d{1,2}(?:-\d{1,2})?\s*$/g, '')
  d = d.replace(/\bMunich\b|\bMünchen\b|\bMunique\b/g, 'Monaco').replace(/\bStuttgart\b/g, 'Stoccarda').replace(/\bMonaco di Baviera\b/g, 'Monaco')
  // (i riempitivi che il modello copia dal contesto: «Ricordo di viaggio: …», «…, in autunno», «…, giorno 2 del viaggio»)
  d = d.replace(/^(?:ricord[oi] di viaggio|viaggio|album|didascalia)\s*[:,]\s*/i, '').replace(/^ricord[oi] di viaggio\s*[:,]?\s*/i, '').replace(/,?\s*(?:in |di |d')?autunno\b/gi, '').replace(/,?\s*(?:il |al )?giorno \d+ del viaggio/gi, '').replace(/,?\s*(?:sera|notte|giorno|mattina) di viaggio\b/gi, '')
  d = d.replace(/,?\s*(?:alle |verso le |ore )?\b\d{1,2}:\d{2}\b/g, '') // (l'ora copiata dal contesto: la sa già l'album)
  d = d.replace(NOMI, 'amici').replace(/\bundefined\b|\bnull\b/gi, '').replace(/\s+/g, ' ').trim()
  const parole = d.split(' ')
  if (parole.length > 12) {
    const testa = parole.slice(0, 12).join(' ')
    const taglio = Math.max(testa.lastIndexOf(','), testa.lastIndexOf('.'), testa.lastIndexOf(';'), testa.lastIndexOf(':'))
    d = taglio > 10 ? testa.slice(0, taglio) : testa
  }
  d = d.replace(/[,;:\s]+$/, '')
  return d ? d[0].toUpperCase() + d.slice(1) : null
}

/** Dalla risposta grezza alla voce valida, o null se non c'è niente da salvare. */
export function interpreta(testo, v) {
  const o = leggiJsonSporco(primoOggetto(testo) ?? '')
  if (!o || typeof o !== 'object') return null
  const didascalia = didascaliaPulita(o.didascalia ?? o.caption ?? o.descrizione)
  if (!didascalia || didascalia.split(' ').length < 2) return null
  const lista = (x) => (Array.isArray(x) ? x : typeof x === 'string' ? x.split(/[,\s]+/) : []).map((t) => { t = String(t).toLowerCase().trim(); return SINONIMI[t] ?? t }).filter((t) => TAG_VLM.includes(t))
  const screenshot = (v.tag ?? []).includes('screenshot')
  // (di uno screenshot il modello tagga quello che c'è nella mappa o nella chat: cibo, hotel… — resta solo `screenshot`)
  const tag = screenshot ? [] : [...new Set(lista(o.tag ?? o.tags))]
  const sicuro = [...new Set(lista(o.sicuro ?? o.sure ?? o.certain))].filter((t) => tag.includes(t))
  if (v.tipo === 'video') { tag.push('video'); sicuro.push('video') }
  if (screenshot) { tag.push('screenshot'); sicuro.push('screenshot') }
  let persone = Number.parseInt(o.persone ?? o.people ?? 0, 10)
  if (!Number.isFinite(persone) || persone < 0) persone = 0
  const senzaGruppo = (l) => (persone < 2 ? l.filter((t) => t !== 'gruppo') : l) // (gruppo = almeno due persone)
  return { didascalia, persone: Math.min(persone, 50), tag: senzaGruppo(tag), sicuro: senzaGruppo(sicuro), modello: SCELTO }
}

// le voci da fare
let voci = manifesto.foto
if (IDS) voci = voci.filter((v) => IDS.has(v.id))
else if (RIFAI) voci = voci.filter((v) => RIFAI.has(v.id))
else voci = voci.filter((v) => !didascalie[v.id])
if (typeof args.solo === 'string') voci = voci.slice(0, Number(args.solo) || 20)
console.log(`${manifesto.foto.length} voci nel manifesto, ${Object.keys(didascalie).length} didascalie già fatte, ${voci.length} da fare con ${MODELLO.nome} (${PARALLELI} in volo)`)
if (!voci.length) { distribuzione(); process.exit(0) }

let fatte = 0, errori = 0, daScrivere = 0, nonValide = 0
const m = (conto.modelli[SCELTO] ??= { n: 0, secondi: 0 })
function scrivi() {
  if (!daScrivere || args.secco) return
  scriviJson(DIDASCALIE, Object.fromEntries(Object.entries(didascalie).sort(([a], [b]) => a.localeCompare(b))), 1)
  conto.aggiornato = new Date().toISOString(); conto.prezzoSecondo = PREZZO_SECONDO
  scriviJson(CONTO, conto, 1)
  daScrivere = 0
}
process.on('SIGINT', () => { scrivi(); console.log(`\n⏸ fermato: ${fatte} fatte, ${Object.keys(didascalie).length} in didascalie.json`); process.exit(130) })

async function una(v) {
  const img = await immagine(v)
  for (let tentativo = 1; ; tentativo++) {
    try {
      const { testo, secondi } = await predizione(MODELLO.input(img, prompt(v)))
      m.n++; m.secondi += secondi
      const voce = interpreta(testo, v)
      if (args.prova) console.log(`\n— ${v.id} (${secondi.toFixed(1)} s) grezzo: ${testo.replace(/\s+/g, ' ').slice(0, 400)}\n  → ${JSON.stringify(voce)}`)
      if (!voce) { if (tentativo < 3) continue; nonValide++; console.warn(`  ✗ ${v.id}: risposta senza JSON valido dopo ${tentativo} tentativi`); return }
      didascalie[v.id] = voce
      daScrivere++
      return
    } catch (e) {
      if (tentativo === 4) { errori++; console.warn(`  ✗ ${v.id}: ${e.message}`); return }
      await new Promise((r) => setTimeout(r, 3000 * tentativo))
    }
  }
}

const partenza = Date.now()
let i = 0
await Promise.all(Array.from({ length: PARALLELI }, async () => {
  while (i < voci.length) {
    const v = voci[i++]
    await una(v)
    fatte++
    if (daScrivere >= OGNI) scrivi()
    if (fatte % 20 === 0 || fatte === voci.length) {
      const sec = (Date.now() - partenza) / 1000
      console.log(`  ${fatte}/${voci.length} · ${(sec / fatte).toFixed(1)} s a voce · GPU ${m.secondi.toFixed(0)} s ≈ ${(m.secondi * PREZZO_SECONDO).toFixed(2)} $ · restano ~${Math.round((voci.length - fatte) * sec / fatte / 60)} min`)
    }
  }
}))
scrivi()
console.log(`✓ ${fatte} voci (${errori} errori di rete, ${nonValide} senza JSON) → catalogo\\didascalie.json`)
distribuzione()
