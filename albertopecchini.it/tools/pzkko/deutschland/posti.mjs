#!/usr/bin/env node
// I posti di Deutschland (9.11.2026): le tappe del viaggio come gruppi di foto vicine (≤150 m dal centro del gruppo),
// con un nome bozza da Nominatim (OpenStreetMap, 1 richiesta al secondo, User-Agent con l'email come vuole la loro
// policy) che Alberto corregge a mano («poi ti dico i nomi precisissimi»): un posto con fisso: true tiene il suo nome
// per sempre, gli altri si riscrivono a ogni giro. Scrive C:\pzkko-server\deutschland\catalogo\posti.json:
//   { posti: [{ id: 'p03', nome: 'Marienplatz', nomeAuto: 'Marienplatz, Altstadt-Lehel, München', lat, lon, n, fisso, primo }],
//     di: { 'img-5506': 'p01', … } }     (di = il posto di ogni foto; le foto senza GPS non hanno posto)
// Gli id dei posti restano stabili fra un giro e l'altro (un posto esistente si riconosce dalla distanza).
//
//   node tools/pzkko/deutschland/posti.mjs             dopo cataloga.mjs; poi manifesto.mjs
//   node tools/pzkko/deutschland/posti.mjs --senza-nomi   solo i gruppi, niente Nominatim
//   node tools/pzkko/deutschland/posti.mjs --raggio=200   il raggio dei gruppi in metri (150 di base)
import path from 'node:path'
import { CATALOGO, leggiJson, scriviJson, metri, argomenti, die } from './comune.mjs'

const args = argomenti()
const RAGGIO = Number(args.raggio) || 150
// un gruppo con meno foto di così non è un posto: sono gli scatti dal finestrino lungo l'autostrada (ognuno in un punto
// diverso) e restano «in viaggio», senza posto, con il loro GPS sulla mappa
const MINIMO = Number(args.minimo) || 3
const FILE = path.join(CATALOGO, 'posti.json')
const UA = 'pzkko-deutschland (pzkko@yahoo.com)'
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

const cache = leggiJson(path.join(CATALOGO, 'cache.json'))
if (!cache?.voci) die('manca catalogo\\cache.json: prima node tools/pzkko/deutschland/cataloga.mjs')
const foto = Object.values(cache.voci).filter((v) => !v.escluso && Number.isFinite(v.lat) && v.t).sort((a, b) => Date.parse(a.t) - Date.parse(b.t))
const vecchio = leggiJson(FILE, { posti: [], di: {} })

// i gruppi: si parte da quelli vecchi (centro e nome), poi ogni foto va al gruppo più vicino entro il raggio, o ne apre uno
const posti = vecchio.posti.map((p) => ({ ...p, membri: [], somma: { lat: 0, lon: 0, n: 0 } }))
let prossimo = posti.reduce((m, p) => Math.max(m, Number(p.id.slice(1)) || 0), 0) + 1
for (const f of foto) {
  let migliore = null
  for (const p of posti) { const d = metri(f.lat, f.lon, p.lat, p.lon); if (d <= RAGGIO && (!migliore || d < migliore.d)) migliore = { p, d } }
  let p = migliore?.p
  if (!p) { p = { id: null, nome: '', nomeAuto: '', lat: f.lat, lon: f.lon, fisso: false, membri: [], somma: { lat: 0, lon: 0, n: 0 } }; posti.push(p) } // (l'id dopo, solo ai gruppi che restano)
  p.membri.push(f)
  // il centro segue le foto col GPS vero (quelle col GPS ereditato stanno dove sta la vicina: non spostano niente)
  if (!f.gpsStimato) { p.somma.lat += f.lat; p.somma.lon += f.lon; p.somma.n++ }
}
for (const p of posti) {
  if (p.somma.n && !p.fisso) { p.lat = +(p.somma.lat / p.somma.n).toFixed(6); p.lon = +(p.somma.lon / p.somma.n).toFixed(6) }
  p.n = p.membri.length
  p.primo = p.membri[0]?.t ?? p.primo ?? null
}
const vivi = posti.filter((p) => p.n >= MINIMO || p.fisso).sort((a, b) => Date.parse(a.primo ?? 0) - Date.parse(b.primo ?? 0))
// gli id: i posti vecchi tengono il loro, i nuovi ne prendono uno in fila; le foto dei gruppi troppo piccoli restano senza posto
for (const p of vivi) if (!p.id) p.id = `p${String(prossimo++).padStart(2, '0')}`
const di = {}
for (const p of vivi) for (const f of p.membri) di[f.id] = p.id
const inViaggio = foto.length - Object.keys(di).length

// i nomi bozza da Nominatim (solo per chi non ce l'ha o non è fisso): zoom 17 = la via o il luogo, in tedesco
async function nomina(p) {
  const u = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lon}&zoom=17&accept-language=de`
  const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!r.ok) throw new Error(`Nominatim ${r.status}`)
  const j = await r.json()
  const a = j.address ?? {}
  const nome = j.name || a.amenity || a.tourism || a.building || a.road || a.pedestrian || a.suburb || a.village || a.town || a.city || 'posto senza nome'
  const citta = a.city || a.town || a.village || a.municipality || ''
  const nomeAuto = [nome, a.suburb && a.suburb !== nome ? a.suburb : null, citta && citta !== nome ? citta : null].filter(Boolean).join(', ') || j.display_name?.split(',').slice(0, 3).join(',') || nome
  return { nome, nomeAuto }
}
let nominati = 0
if (!args['senza-nomi']) {
  const daNominare = vivi.filter((p) => !p.fisso && (!p.nomeAuto || !p.nome))
  for (const p of daNominare) {
    try { Object.assign(p, await nomina(p)); nominati++; console.log(`  ${p.id} ${p.lat},${p.lon} → «${p.nome}» (${p.nomeAuto})`) } catch (e) { console.warn(`  ${p.id}: ${e.message}`) }
    await pausa(1100)
  }
}
// lo stesso posto spezzato in più gruppi (l'Allianz Arena in cinque pezzi di Werner-Heisenberg-Allee, 150 m alla volta): due
// gruppi non fissi con lo stesso nome entro UNIONE metri si uniscono nel più grande, che tiene l'id
const UNIONE = Number(args.unione) || 800
for (let cambiato = true; cambiato; ) {
  cambiato = false
  for (const a of vivi) for (const b of vivi) {
    if (a === b || a.fisso || b.fisso || !a.nome || a.nome !== b.nome || a.n < b.n || !vivi.includes(b)) continue
    if (metri(a.lat, a.lon, b.lat, b.lon) > UNIONE) continue
    a.membri.push(...b.membri); a.n = a.membri.length
    const veri = a.membri.filter((f) => !f.gpsStimato)
    if (veri.length) { a.lat = +(veri.reduce((s, f) => s + f.lat, 0) / veri.length).toFixed(6); a.lon = +(veri.reduce((s, f) => s + f.lon, 0) / veri.length).toFixed(6) }
    a.primo = a.membri.map((f) => f.t).sort()[0]
    vivi.splice(vivi.indexOf(b), 1)
    for (const f of b.membri) di[f.id] = a.id
    cambiato = true
    break
  }
}
vivi.sort((a, b) => Date.parse(a.primo ?? 0) - Date.parse(b.primo ?? 0))
scriviJson(FILE, { generato: new Date().toISOString(), raggio: RAGGIO, minimo: MINIMO, unione: UNIONE, posti: vivi.map(({ membri, somma, ...p }) => p), di }, 1)
console.log(`✓ ${FILE}: ${vivi.length} posti (${vivi.filter((p) => p.fisso).length} fissi, ${nominati} nominati adesso) per ${foto.length} foto col GPS, ${inViaggio} «in viaggio» (gruppi sotto le ${MINIMO} foto)`)
for (const p of vivi) console.log(`  ${p.id} ${p.fisso ? '🔒' : '  '} ${String(p.n).padStart(3)} ${p.primo?.slice(0, 16)} «${p.nome}» ${p.nomeAuto !== p.nome ? `(${p.nomeAuto})` : ''}`)
