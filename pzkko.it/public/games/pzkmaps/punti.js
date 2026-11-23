// PZKMAPS: i punti. Ogni volta un punto a caso su una strada asfaltata, e mai uno già uscito.
//
// Le strade sono quelle di OpenStreetMap, lette dalle tessere vettoriali di OpenFreeMap (tiles.openfreemap.org: senza
// chiave, aperte a tutti i siti, un decimo di secondo l'una). Si pesca un punto a caso nella zona, si prende la tessera
// (zoom 14, un paio di chilometri di lato) che lo contiene, si tengono solo le strade buone e su quelle si sceglie un punto
// a caso lungo il tracciato, non un incrocio: così il punto è sempre nuovo.
// (Overpass, l'altra via per chiedere le strade a OpenStreetMap, il 19.11 non rispondeva da nessuno dei suoi indirizzi.)
//
// Strada buona = una strada vera (statale, provinciale, comunale, di quartiere: trunk, primary, secondary, tertiary, minor)
// su cui la mappa dice «asfaltata» (surface = paved). Mai sterrate, strade senza la superficie scritta, sentieri, piste,
// strade di servizio, gallerie, svincoli, strade chiuse. Negli stati dove la macchina di Street View ha fatto solo le
// strade principali (SOLO_GRANDI) si pesca solo su quelle.
//
// I punti usciti restano nel browser (localStorage «pzkmaps-visti»): uno a meno di 150 m da uno già visto si scarta.
//
//   puntoMondo({ evita })  → { lat, lng, dir, paese, dove }   lo stato lo conferma BigDataCloud (senza chiave)
//   puntoZona(zona)        → { lat, lng, dir }                dentro il disco di 10 km della zona
//   visto(p)               segna il punto come uscito
import { leggi } from './mvt.js'
import { PAESI, RAGGIO_KM } from './paesi.js'

const FONTE = 'https://tiles.openfreemap.org/planet'
const Z = 14, N = 2 ** Z
const GRANDI = new Set(['trunk', 'primary', 'secondary'])
const PICCOLE = new Set(['tertiary', 'minor'])
const SOLO_GRANDI = new Set('RW UG KE GH SN NG TN BW LS SZ KG KZ MN BD KH LK IN BO EC GT DO PA JO PE CO PH ID'.split(' '))
const CHIAVE = 'pzkmaps-visti', TIENE = 1500, VICINO_M = 150
const RAD = Math.PI / 180

export const metri = (a, b) => {
  const dLat = (b.lat - a.lat) * RAD, dLng = (b.lng - a.lng) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2
  return 2 * 6371008 * Math.asin(Math.min(1, Math.sqrt(h)))
}
/** Un punto a caso, uniforme, nel disco di raggio km intorno a (lat, lng). */
export function nelDisco(lat, lng, km) {
  const r = km * Math.sqrt(Math.random()), t = Math.random() * 2 * Math.PI
  return { lat: lat + (r * Math.cos(t)) / 111.32, lng: lng + (r * Math.sin(t)) / (111.32 * Math.cos(lat * RAD)) }
}

// ── i punti già usciti ──
let visti = null
function carica() {
  if (visti) return visti
  try { visti = JSON.parse(globalThis.localStorage?.getItem(CHIAVE) || '[]') } catch { visti = [] }
  if (!Array.isArray(visti)) visti = []
  return visti
}
const giaVisto = (p) => carica().some(([la, ln]) => Math.abs(la - p.lat) < 0.003 && metri({ lat: la, lng: ln }, p) < VICINO_M)
export function visto(p) {
  carica().push([+p.lat.toFixed(5), +p.lng.toFixed(5)])
  if (visti.length > TIENE) visti.splice(0, visti.length - TIENE)
  try { globalThis.localStorage?.setItem(CHIAVE, JSON.stringify(visti)) } catch {}
}
export const quantiVisti = () => carica().length

// ── le tessere ──
let modello = null
async function indirizzo() {
  if (!modello) modello = fetch(FONTE, { signal: AbortSignal.timeout(8000) }).then((r) => r.json()).then((j) => j.tiles[0]).catch((e) => { modello = null; throw e })
  return modello
}
const tessere = new Map() // «x/y» → i tratti delle strade buone della tessera (le ultime restano in memoria)
const buona = (t) => t.surface === 'paved' && t.brunnel !== 'tunnel' && !t.ramp && t.access !== 'no' && (GRANDI.has(t.class) || PICCOLE.has(t.class))
async function strade(x, y) {
  const k = `${x}/${y}`
  if (tessere.has(k)) return tessere.get(k)
  const u = (await indirizzo()).replace('{z}', Z).replace('{x}', x).replace('{y}', y)
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) })
  const tratti = [] // [x1, y1, x2, y2 (in frazioni di tessera), lunghezza, 1 se è una strada grande]
  if (r.ok) {
    const strato = leggi(await r.arrayBuffer(), 'transportation')
    const E = strato?.estensione ?? 4096
    for (const f of strato?.feat ?? []) {
      if (!buona(f.tag)) continue
      const g = GRANDI.has(f.tag.class) ? 1 : 0
      for (const l of f.linee) for (let i = 1; i < l.length; i++) {
        const [ax, ay] = l[i - 1], [bx, by] = l[i]
        if (Math.min(ax, bx) < 0 || Math.min(ay, by) < 0 || Math.max(ax, bx) > E || Math.max(ay, by) > E) continue // (oltre il bordo: è dell'altra tessera)
        const lung = Math.hypot(bx - ax, by - ay)
        if (lung > 0) tratti.push([ax / E, ay / E, bx / E, by / E, lung, g])
      }
    }
  } else if (r.status !== 404 && r.status !== 204) throw new Error(`tessera ${r.status}`)
  if (tessere.size > 60) tessere.delete(tessere.keys().next().value)
  tessere.set(k, tratti)
  return tratti
}
const tx = (lng) => Math.floor(((lng + 180) / 360) * N)
const ty = (lat) => Math.floor(((1 - Math.asinh(Math.tan(lat * RAD)) / Math.PI) / 2) * N)
const aLng = (x) => (x / N) * 360 - 180
const aLat = (y) => Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / N))) / RAD

/** Un punto a caso lungo le strade asfaltate della tessera che contiene (lat, lng); null se lì non ce n'è. */
export async function suStrada(lat, lng, { dentro = null, soloGrandi = false } = {}) {
  const x = tx(lng), y = ty(lat)
  let tratti = await strade(x, y)
  if (soloGrandi) tratti = tratti.filter((t) => t[5])
  if (!tratti.length) return null
  const tot = tratti.reduce((s, t) => s + t[4], 0)
  for (let giro = 0; giro < 12; giro++) {
    let q = Math.random() * tot, t = tratti[0]
    for (const c of tratti) { t = c; q -= c[4]; if (q <= 0) break }
    const f = Math.random()
    const p = { lat: aLat(y + t[1] + (t[3] - t[1]) * f), lng: aLng(x + t[0] + (t[2] - t[0]) * f) }
    if (dentro && !dentro(p)) continue
    if (giaVisto(p)) continue
    // lo sguardo lungo la strada, in uno dei due versi
    const a = { lat: aLat(y + t[1]), lng: aLng(x + t[0]) }, b = { lat: aLat(y + t[3]), lng: aLng(x + t[2]) }
    let dir = Math.atan2((b.lng - a.lng) * Math.cos(p.lat * RAD), b.lat - a.lat) / RAD
    if (Math.random() < 0.5) dir += 180
    p.dir = Math.round((dir + 360) % 360)
    return p
  }
  return null
}

// ── mondo: lo stato, una zona abitata, un punto lì intorno ──
const pesi = Object.entries(PAESI).map(([c, zone]) => [c, 1 + zone.length / 4])
function pescaPaese(evita) {
  let lista = pesi.filter(([c]) => !evita.includes(c))
  if (!lista.length) lista = pesi
  let q = Math.random() * lista.reduce((s, [, p]) => s + p, 0)
  for (const [c, p] of lista) { q -= p; if (q <= 0) return c }
  return lista[0][0]
}
/** In che stato è davvero il punto (e vicino a cosa): BigDataCloud, senza chiave. null se non risponde. */
async function doveSta(p) {
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.lat.toFixed(5)}&longitude=${p.lng.toFixed(5)}&localityLanguage=it`, { signal: AbortSignal.timeout(3500) })
    const j = await r.json()
    if (!j?.countryCode) return null
    return { paese: j.countryCode, dove: [j.city || j.locality, j.principalSubdivision].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') }
  } catch { return null }
}
/** Lo stato si pesca per primo (fra quelli non in `evita`), poi si cerca la strada lì: uno stato con poche strade segnate
 *  esce quanto gli altri, ci mette solo qualche tessera in più. `solo`: uno stato preciso (per le prove). */
export async function puntoMondo({ evita = [], solo = null } = {}) {
  let errori = 0
  for (let volta = 0; volta < 8; volta++) {
    const paese = solo ?? pescaPaese(evita)
    const zone = PAESI[paese], soloGrandi = SOLO_GRANDI.has(paese)
    for (let giro = 0; giro < 40; giro++) {
      const [lat, lng, km = 30] = zone[Math.floor(Math.random() * zone.length)]
      try {
        const qui = nelDisco(lat, lng, km)
        const p = await suStrada(qui.lat, qui.lng, { soloGrandi })
        if (!p) continue
        const d = await doveSta(p)
        if (d && d.paese !== paese) continue // (oltre il confine: se ne pesca un altro)
        p.paese = paese
        p.dove = d?.dove ?? ''
        p.giri = giro + 1
        return p
      } catch (e) { if (++errori > 8) throw e }
    }
  }
  throw new Error('nessun punto')
}

// ── amici: un punto a caso nel disco, poi una strada della sua tessera ──
export async function puntoZona(zona) {
  const dentro = (p) => metri(zona, p) <= RAGGIO_KM * 1000
  let errori = 0
  for (let giro = 0; giro < 80; giro++) {
    try {
      const qui = nelDisco(zona.lat, zona.lng, RAGGIO_KM)
      const p = await suStrada(qui.lat, qui.lng, { dentro })
      if (p) return p
    } catch (e) { if (++errori > 8) throw e }
  }
  throw new Error('nessun punto')
}

/** L'indirizzo della cornice di Street View (senza chiave): il panorama più vicino al punto, guardando lungo la strada. */
export const vista = (p) => `https://www.google.com/maps/embed?origin=mfe&pb=!6m7!1m6!2m2!1d${p.lat.toFixed(6)}!2d${p.lng.toFixed(6)}!3f${p.dir ?? 0}!4f0!5f1`
