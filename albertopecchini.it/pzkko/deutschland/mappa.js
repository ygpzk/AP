// La mappa di Deutschland (9.11.2026, «Deutschland 2»). Alberto: «fai la mappa dentro a un foglio vero», «la mappa è troppo
// buia e piccole le scritte». Leaflet 1.9.4 (vendorizzato in lib/leaflet/, 42 KB gzip) dentro il foglio di carta
// (#mappa-foglio, galleria.css: crema, pieghe, nastro, titolo a pennarello, legenda, scala) con le tile CHIARE dello stile
// tedesco di OpenStreetMap (tile.openstreetmap.de, nomi in tedesco; se non arrivano, tile.openstreetmap.org) e un filtro
// leggero (saturate .85, sepia .12): niente più nero. I posti sono TIMBRI rossi con numero e nome in Oswald 16–18 px (il
// nome sempre visibile per le tappe con 20+ foto o da vicino, le altre al tocco o col mouse sopra); il click → «deutschland:vai»
// {id} e l'album va alla prima foto di lì. Il percorso intero a puntini grigi sotto, e sopra quello FATTO a pennarello
// giallo (peso 6, lineCap round, con l'ombra), che si allunga fino alla foto corrente mentre l'album scorre («deutschland:foto»
// {i}: ricerca binaria sui punti con GPS); la GLA grigia (art/deutschland/gla.webp) è un divIcon che si sposta con setLatLng
// e gira col bearing dal punto prima, per la via più corta, con una transizione CSS di .4 s, e lascia una piccola scia; la
// mappa si sposta SOLO se la GLA esce dai bordi ridotti del 20% (panTo; se è lontana, setView sulla città). Zoom iniziale
// per città, il tasto «TUTTO IL VIAGGIO» (che poi diventa «DOV'È LA GLA»). Sul telefono il foglio sta ripiegato in alto
// (36 dvh) e KARTE («deutschland:karte» {aperta}) lo apre a tutto schermo. Niente che giri a pagina ferma.
// Leaflet lo carica galleria.js dopo l'accesso e ce lo passa (L): qui niente import della libreria.

import { evento, ascolta } from './comune.js'

const ORO = '#ffd400', GRIGIO = '#7a756b'
const MONACO = [48.137, 11.575]
const GLA = '/art/deutschland/gla.webp'
const TILE_DE = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'
const TILE_ORG = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUZIONE = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
const ZOOM_CITTA = 12, ZOOM_VICINO = 13, GRANDE = 20 // (GRANDE: da quante foto in su il nome del timbro è sempre visibile)
const MESI = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const fermo = () => matchMedia('(prefers-reduced-motion:reduce)').matches
// la macchinina di scorta: un'auto grigia vista dall'alto, muso in su (0° = nord)
const GLA_SVG = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
<ellipse cx="20" cy="22" rx="11" ry="17" fill="#000" opacity=".3"/>
<rect x="5" y="9" width="4" height="7" rx="1.5" fill="#111"/><rect x="31" y="9" width="4" height="7" rx="1.5" fill="#111"/>
<rect x="5" y="25" width="4" height="7" rx="1.5" fill="#111"/><rect x="31" y="25" width="4" height="7" rx="1.5" fill="#111"/>
<path d="M12 6 Q20 2 28 6 L30 12 L30 34 Q20 38 10 34 L10 12 Z" fill="#8d9197" stroke="#2b2d30" stroke-width="1.2"/>
<path d="M12.5 12 Q20 9.5 27.5 12 L26.5 17 Q20 15.5 13.5 17 Z" fill="#1d2a36"/>
<rect x="13" y="18" width="14" height="10" rx="2" fill="#a6aab0"/>
<path d="M12.5 33 Q20 35 27.5 33 L27 29.5 Q20 31 13 29.5 Z" fill="#242a33"/>
<circle cx="14" cy="6.5" r="1.6" fill="#fff4b0"/><circle cx="26" cy="6.5" r="1.6" fill="#fff4b0"/>
</svg>`)

let L, map, el, foglio, punti = [], tutti = [], fatto, casing, scia, auto, img, angolo = 0, ultimoK = -1, avvisoTile = false, tileDe = true, vistaTutto = false, tastoTutto

/** Il bearing (gradi da nord, in senso orario) da a verso b. */
function bearing(a, b) {
  const r = Math.PI / 180, f1 = a.lat * r, f2 = b.lat * r, dl = (b.lng - a.lng) * r
  const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)
  return (Math.atan2(y, x) / r + 360) % 360
}

/** Gira la GLA verso `verso`, per la via più corta (mai un giro intero per passare da 350° a 10°). */
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

/** La foto corrente è cambiata: percorso fatto, GLA, scia, inquadratura. */
function vai(i) {
  if (!punti.length) return
  const k = ultimoPunto(i)
  if (k === ultimoK) return
  ultimoK = k
  const ll = punti[k].ll
  const via = punti.slice(0, k + 1).map((p) => p.ll)
  casing.setLatLngs(via)
  fatto.setLatLngs(via)
  scia.setLatLngs(via.slice(-4))
  auto.setLatLng(ll)
  // il punto prima in un posto diverso (più foto nello stesso punto non girano la macchina)
  let j = k - 1
  while (j >= 0 && punti[j].ll.equals(ll, 1e-5)) j--
  if (j >= 0) gira(bearing(punti[j].ll, ll))
  else if (punti.length > k + 1) gira(bearing(ll, punti[k + 1].ll))
  if (vistaTutto) return // (si guarda tutto il viaggio: la GLA si muove, la mappa no)
  if (!map.getBounds().pad(-0.2).contains(ll)) {
    // vicina: si trasla; lontana (un'altra città): si va lì allo zoom della città, una transizione sola
    const p = map.latLngToContainerPoint(ll), s = map.getSize()
    const lontana = Math.abs(p.x - s.x / 2) > s.x * 1.5 || Math.abs(p.y - s.y / 2) > s.y * 1.5
    if (lontana) map.setView(ll, Math.max(map.getZoom(), ZOOM_CITTA), { animate: !fermo(), duration: 0.6 })
    else map.panTo(ll, { animate: !fermo(), duration: 0.5 })
  }
}

/** Il timbro di un posto: numero nel tondo, nome a fianco (sempre visibile se il posto è grande). */
function timbro(p, n, grande) {
  const nome = (p.nome || p.nomeAuto || '').replace(/</g, '')
  return L.divIcon({ className: 'timbro-icona', iconSize: [28, 28], iconAnchor: [14, 14], html: `<span class="timbro${grande ? ' grande' : ''}" title="${nome} · ${p.n ?? ''} foto"><b>${n}</b><i>${nome}</i></span>` })
}

/** «TUTTO IL VIAGGIO» ↔ «DOV'È LA GLA». */
function tutto(si) {
  vistaTutto = si
  if (tastoTutto) { tastoTutto.textContent = si ? 'Dov’è la GLA' : 'Tutto il viaggio'; tastoTutto.setAttribute('aria-pressed', String(si)) }
  if (si && tutti.length) map.fitBounds(L.latLngBounds(tutti), { padding: [36, 36], animate: !fermo() })
  else if (!si) map.setView(auto.getLatLng(), ZOOM_CITTA, { animate: !fermo() })
}

/** KARTE: sul telefono il foglio a tutto schermo (o ripiegato); sul computer, dove il foglio è sempre lì, «tutto il viaggio». */
function karte({ aperta }) {
  if (!foglio) return
  if (innerWidth >= 900) { tutto(!!aperta); return }
  foglio.classList.toggle('piena', !!aperta)
  document.documentElement.classList.toggle('karte-aperta', !!aperta)
  // (invalidateSize lo fa il ResizeObserver; qui l'inquadratura: aperta → la GLA da vicino)
  requestAnimationFrame(() => { map.invalidateSize({ animate: false }); if (aperta && !vistaTutto) map.setView(auto.getLatLng(), ZOOM_VICINO, { animate: false }) })
}

/** «München → Stuttgart · 6.–8. November · 967 Erinnerungen» per il titolo a pennarello. */
function titolo(manifesto) {
  const t = document.getElementById('mf-titolo')
  if (!t) return
  const da = new Date(`${manifesto.viaggio?.da}T12:00:00`), a = new Date(`${manifesto.viaggio?.a}T12:00:00`)
  const date = Number.isNaN(+da) || Number.isNaN(+a) ? '' : da.getMonth() === a.getMonth() ? `${da.getDate()}.–${a.getDate()}. ${MESI[a.getMonth()]}` : `${da.getDate()}. ${MESI[da.getMonth()]} – ${a.getDate()}. ${MESI[a.getMonth()]}`
  t.innerHTML = `<span>München → Stuttgart</span>${date ? ` <span class="mf-sep">·</span> <span>${date}</span>` : ''} <span class="mf-sep">·</span> <span>${manifesto.foto.length} Erinnerungen</span>`
}

export function avvia(manifesto, Leaflet) {
  L = Leaflet
  el = document.getElementById('mappa'); foglio = document.getElementById('mappa-foglio')
  if (!el) return
  titolo(manifesto)
  map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: true, zoomSnap: 0.5, worldCopyJump: false, zoomAnimation: !fermo(), fadeAnimation: !fermo(), markerZoomAnimation: !fermo() })
  map.zoomControl.setPosition('topright')
  map.attributionControl.setPrefix(false) // (solo i crediti delle tile, che sono obbligatori: «Leaflet» sta nel codice)
  L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map)
  el.leaflet = map // (per le prove e il bot: la mappa a portata di mano da fuori)
  // (la vista subito: finché la mappa non ha una vista Leaflet NON aggiunge davvero i layer)
  map.setView(MONACO, 6, { animate: false })
  // le tile tedesche; se non arrivano (tre errori di fila), quelle di openstreetmap.org
  let errori = 0
  const tile = L.tileLayer(TILE_DE, { maxZoom: 19, attribution: ATTRIBUZIONE, crossOrigin: 'anonymous' })
  tile.on('tileerror', () => {
    if (tileDe && ++errori >= 3) { tileDe = false; console.warn('deutschland: le tile di openstreetmap.de non arrivano, passo a openstreetmap.org'); tile.setUrl(TILE_ORG) }
    else if (!tileDe && !avvisoTile) { avvisoTile = true; console.warn('deutschland: le tile della mappa non arrivano (niente rete?)') }
  })
  tile.on('tileload', () => { errori = 0 })
  tile.addTo(map)

  punti = manifesto.foto
    .map((f, i) => ({ i, lat: +f.lat, lon: +f.lon }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({ i: p.i, ll: L.latLng(p.lat, p.lon) }))
  tutti = punti.map((p) => p.ll)

  // il percorso: a puntini grigi quello ancora da fare, sotto; sopra l'ombra, il pennarello giallo e la scia della GLA
  if (tutti.length > 1) L.polyline(tutti, { color: GRIGIO, weight: 3, dashArray: '1 9', lineCap: 'round', opacity: .8, interactive: false }).addTo(map)
  casing = L.polyline([], { color: '#000', weight: 9, opacity: .22, lineJoin: 'round', lineCap: 'round', interactive: false }).addTo(map)
  scia = L.polyline([], { color: ORO, weight: 16, opacity: .25, lineJoin: 'round', lineCap: 'round', interactive: false }).addTo(map)
  fatto = L.polyline([], { color: ORO, weight: 6, opacity: .95, lineJoin: 'round', lineCap: 'round', interactive: false }).addTo(map)

  // i timbri: numerati nell'ordine del viaggio (le tappe), poi i posti fuori tappa
  const ordine = []
  for (const t of manifesto.tappe) if (!ordine.includes(t.posto)) ordine.push(t.posto)
  for (const p of manifesto.posti) if (!ordine.includes(p.id)) ordine.push(p.id)
  const perId = new Map(manifesto.posti.map((p) => [p.id, p]))
  ordine.forEach((id, k) => {
    const p = perId.get(id)
    if (!p || !Number.isFinite(+p.lat) || !Number.isFinite(+p.lon)) return
    const grande = (+p.n || 0) >= GRANDE
    const m = L.marker([+p.lat, +p.lon], { icon: timbro(p, k + 1, grande), keyboard: true, title: p.nome || '', riseOnHover: true, zIndexOffset: grande ? 500 : 0 }).addTo(map)
    m.on('click', () => { m.getElement()?.querySelector('.timbro')?.classList.toggle('aperto'); evento('vai', { id: p.id }) })
  })

  // la GLA: la foto vera (gla.webp); se manca, il svg di scorta
  const icona = L.divIcon({ className: 'gla-icona', html: `<img class="gla" alt="" src="${GLA}" onerror="this.onerror=null;this.src='${GLA_SVG}'">`, iconSize: [44, 44], iconAnchor: [22, 22] })
  auto = L.marker(tutti[0] ?? MONACO, { icon: icona, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map)
  img = auto.getElement()?.querySelector('img')

  // lo zoom iniziale per città: dove sta la GLA (la prima foto)
  map.setView(tutti[0] ?? MONACO, ZOOM_CITTA, { animate: false })

  // da vicino tutti i nomi, da lontano solo i grandi (zoomend scatta solo quando si zooma: a mappa ferma niente)
  const vicino = () => el.classList.toggle('vicino', map.getZoom() >= ZOOM_VICINO)
  map.on('zoomend', vicino)
  vicino()
  // un gesto sulla mappa (trascinata o zoomata a mano) toglie la vista «tutto il viaggio»: da lì la mappa segue di nuovo
  map.on('dragstart', () => { if (vistaTutto) { vistaTutto = false; if (tastoTutto) { tastoTutto.textContent = 'Tutto il viaggio'; tastoTutto.setAttribute('aria-pressed', 'false') } } })

  tastoTutto = foglio?.querySelector('.mf-tutto')
  tastoTutto?.addEventListener('click', () => tutto(!vistaTutto))
  foglio?.querySelector('.mf-chiudi')?.addEventListener('click', () => evento('karte', { aperta: false }))

  ascolta('foto', ({ i }) => vai(+i))
  ascolta('karte', karte)
  // la misura cambia (telefono girato, il foglio aperto a tutto schermo): Leaflet deve rimisurarsi. Un ResizeObserver
  // scatta solo quando cambia qualcosa: a pagina ferma niente
  new ResizeObserver(() => map.invalidateSize({ animate: false })).observe(el)
}
