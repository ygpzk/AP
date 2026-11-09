// La mappa di Deutschland (9.11.2026). Alberto: «copia sistema waze map con la macchinina»: Leaflet 1.9.4 (vendorizzato in
// lib/leaflet/, 42 KB gzip; MapLibre scartato: 290 kB contro pzkko-leggero) con le tile CARTO Dark Matter tinte nero/oro
// con un filtro CSS sul pannello delle tile (galleria.css; poi OSM rovesciato, vedi TILE); il percorso intero del viaggio tratteggiato grigio sotto, e
// sopra quello FATTO, giallo con un bordo nero, che si allunga fino alla foto corrente mentre la griglia scorre
// («deutschland:foto» {i}: ricerca binaria sui punti con GPS); la macchinina (la GLA grigia, art/deutschland/gla.webp;
// finché non c'è, un svg qui dentro) è un divIcon che si sposta con setLatLng e gira col bearing dal punto prima, per la
// via più corta, con una transizione CSS di .4 s; la mappa si sposta (panTo animato) SOLO se la macchinina esce dai
// bordi ridotti del 20%. I posti sono pallini rossi col nome in Anton su nero (tooltip fisso); il click → «deutschland:vai»
// {id} e la griglia va alla prima foto di lì. Niente che giri a pagina ferma: si muove solo quando scorri.
// Leaflet lo carica galleria.js dopo l'accesso e ce lo passa (L): qui niente import della libreria.

import { evento, ascolta, esiste } from './comune.js'

const ORO = '#ffd400', ROSSO = '#dd0000', GRIGIO = '#3a3a3a', NERO = '#000'
const MONACO = [48.137, 11.575]
const GLA = '/art/deutschland/gla.webp'
// Le tile: il piano diceva CARTO Dark Matter, ma il 9.11.2026 le tile di basemaps.cartocdn.com escono con la scritta
// «API KEY REQUIRED» (provato con curl, con e senza Referer). Provate anche quelle scure di Esri (World Dark Gray: nere da
// lontano ma marrone fango in città). Si usano le tile normali di OpenStreetMap, gratuite con l'attribuzione, rovesciate
// dal filtro CSS in galleria.css (invert + seppia): fondo nero, strade e scritte d'oro, e in città c'è tutto, fino allo
// zoom 19. Poche persone, poche tile: dentro la politica d'uso di tile.openstreetmap.org.
const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUZIONE = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// la macchinina di scorta: un'auto grigia vista dall'alto, muso in su (0° = nord), stile Waze
const GLA_SVG = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
<ellipse cx="20" cy="22" rx="11" ry="17" fill="#000" opacity=".35"/>
<rect x="5" y="9" width="4" height="7" rx="1.5" fill="#111"/><rect x="31" y="9" width="4" height="7" rx="1.5" fill="#111"/>
<rect x="5" y="25" width="4" height="7" rx="1.5" fill="#111"/><rect x="31" y="25" width="4" height="7" rx="1.5" fill="#111"/>
<path d="M12 6 Q20 2 28 6 L30 12 L30 34 Q20 38 10 34 L10 12 Z" fill="#8d9197" stroke="#2b2d30" stroke-width="1.2"/>
<path d="M12.5 12 Q20 9.5 27.5 12 L26.5 17 Q20 15.5 13.5 17 Z" fill="#1d2a36"/>
<rect x="13" y="18" width="14" height="10" rx="2" fill="#a6aab0"/>
<path d="M12.5 33 Q20 35 27.5 33 L27 29.5 Q20 31 13 29.5 Z" fill="#242a33"/>
<circle cx="14" cy="6.5" r="1.6" fill="#fff4b0"/><circle cx="26" cy="6.5" r="1.6" fill="#fff4b0"/>
<rect x="11.5" y="33.5" width="4" height="1.6" rx=".8" fill="#dd0000"/><rect x="24.5" y="33.5" width="4" height="1.6" rx=".8" fill="#dd0000"/>
</svg>`)

let L, map, punti = [], fatto, casing, auto, img, angolo = 0, ultimoK = -1, avvisoTile = false

/** Il bearing (gradi da nord, in senso orario) da a verso b. */
function bearing(a, b) {
  const r = Math.PI / 180, f1 = a.lat * r, f2 = b.lat * r, dl = (b.lng - a.lng) * r
  const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)
  return (Math.atan2(y, x) / r + 360) % 360
}

/** Gira la macchinina verso `verso`, per la via più corta (mai un giro intero per passare da 350° a 10°). */
function gira(verso) {
  if (!Number.isFinite(verso)) return
  const d = ((verso - angolo) % 360 + 540) % 360 - 180
  angolo += d
  if (img) img.style.rotate = `${angolo.toFixed(1)}deg`
}

/** L'ultimo punto con GPS fino alla foto i (ricerca binaria su punti[].i, che è crescente). */
function ultimoPunto(i) {
  let lo = 0, hi = punti.length - 1, k = -1
  while (lo <= hi) { const m = (lo + hi) >> 1; if (punti[m].i <= i) { k = m; lo = m + 1 } else hi = m - 1 }
  return Math.max(0, k)
}

/** La foto corrente è cambiata: percorso fatto, macchinina, inquadratura. */
function vai(i) {
  if (!punti.length) return
  const k = ultimoPunto(i)
  if (k === ultimoK) return
  ultimoK = k
  const ll = punti[k].ll
  const via = punti.slice(0, k + 1).map((p) => p.ll)
  casing.setLatLngs(via)
  fatto.setLatLngs(via)
  auto.setLatLng(ll)
  // il punto prima in un posto diverso (più foto nello stesso punto non girano la macchina)
  let j = k - 1
  while (j >= 0 && punti[j].ll.equals(ll, 1e-5)) j--
  if (j >= 0) gira(bearing(punti[j].ll, ll))
  else if (punti.length > k + 1) gira(bearing(ll, punti[k + 1].ll))
  if (!map.getBounds().pad(-0.2).contains(ll)) map.panTo(ll, { animate: true, duration: 0.5 })
}

export function avvia(manifesto, Leaflet) {
  L = Leaflet
  const el = document.getElementById('mappa')
  if (!el) return
  map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: true, zoomSnap: 0.5, worldCopyJump: false })
  map.zoomControl.setPosition('topright')
  map.attributionControl.setPrefix(false) // (solo i crediti delle tile, che sono obbligatori: «Leaflet» sta nel codice)
  el.leaflet = map // (per le prove e il bot: la mappa a portata di mano da fuori)
  // (la vista subito: finché la mappa non ha una vista Leaflet NON aggiunge davvero i layer, e il marker della
  // macchinina non avrebbe ancora il suo elemento)
  map.setView(MONACO, 6, { animate: false })
  const tileErrore = () => { if (!avvisoTile) { avvisoTile = true; console.warn('deutschland: le tile della mappa non arrivano (niente rete?)') } }
  L.tileLayer(TILE, { maxZoom: 19, attribution: ATTRIBUZIONE }).on('tileerror', tileErrore).addTo(map)

  punti = manifesto.foto
    .map((f, i) => ({ i, lat: +f.lat, lon: +f.lon }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({ i: p.i, ll: L.latLng(p.lat, p.lon) }))
  const tutti = punti.map((p) => p.ll)

  if (tutti.length > 1) L.polyline(tutti, { color: GRIGIO, weight: 2, dashArray: '4 7', interactive: false }).addTo(map)
  casing = L.polyline([], { color: NERO, weight: 7, lineJoin: 'round', lineCap: 'round', interactive: false }).addTo(map)
  fatto = L.polyline([], { color: ORO, weight: 4, lineJoin: 'round', lineCap: 'round', interactive: false }).addTo(map)

  for (const p of manifesto.posti) {
    if (!Number.isFinite(+p.lat) || !Number.isFinite(+p.lon)) continue
    L.circleMarker([+p.lat, +p.lon], { radius: 6, color: NERO, weight: 2, fillColor: ROSSO, fillOpacity: 1 })
      .bindTooltip(p.nome || p.nomeAuto || '', { permanent: true, direction: 'top', offset: [0, -7], className: 'posto-nome' })
      .on('click', () => evento('vai', { id: p.id }))
      .addTo(map)
  }

  // la macchinina: parte col svg di scorta, e se la GLA vera c'è (una richiesta HEAD sola) la prende
  const icona = L.divIcon({ className: 'gla-icona', html: `<img class="gla" alt="" src="${GLA_SVG}">`, iconSize: [40, 40], iconAnchor: [20, 20] })
  auto = L.marker(tutti[0] ?? MONACO, { icon: icona, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map)
  img = auto.getElement()?.querySelector('img')
  esiste(GLA).then((c) => { if (c && img) img.src = GLA })

  if (tutti.length) map.fitBounds(L.latLngBounds(tutti), { padding: [28, 28], animate: false })

  // da lontano i nomi dei posti si accavallano (sei posti dentro Monaco): sotto lo zoom 11 si vedono solo i pallini
  // (zoomend scatta solo quando si zooma: a mappa ferma niente)
  const lontano = () => el.classList.toggle('lontano', map.getZoom() < 11)
  map.on('zoomend', lontano)
  lontano()

  ascolta('foto', ({ i }) => vai(+i))
  // la misura cambia (telefono girato, #galleria appena mostrato): Leaflet deve rimisurarsi. Un ResizeObserver scatta solo
  // quando cambia qualcosa: a pagina ferma niente
  new ResizeObserver(() => map.invalidateSize({ animate: false })).observe(el)
}
