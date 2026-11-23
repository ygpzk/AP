// PZKMAPS di pzkko.it (19.11, Alberto: «fai gioco geoguesser chiamandolo "pzkmaps"… solo posti su strade asfaltate ma di
// tutto il mondo… voglio ogni volta un punto casuale, mai lo stesso di prima!!!»): ti trovi su una strada, e devi dire dove.
// Un foglio col nastro come gli altri giochi (../foglio.css), più largo perché dentro c'è la strada.
//
//   MONDO              un punto a caso su una strada asfaltata di uno degli 80 stati dove Street View è passata: si
//                      indovina solo lo STATO (dall'elenco, in italiano). Conta la fila di risposte giuste.
//   AMICI DI DISCORD   le «province» degli amici: un disco di 10 km dal centro della città. Qui si indovina il PUNTO
//                      esatto con un clic sulla mappa: cinque giri, fino a 5.000 punti l'uno secondo i metri di errore.
//
// I punti li dà punti.js (strade di OpenStreetMap, sempre nuovi, mai uno già uscito). La strada si guarda nella cornice di
// Street View di Google, quella senza chiave di «Condividi → Incorpora»: prende il panorama più vicino al punto. La
// cornice scrive l'indirizzo in alto a sinistra, e lì sopra c'è la targa del gioco; il marchio e i crediti di Google in
// basso restano in vista. Il sito non può sapere se in quel punto un panorama c'è (ogni tanto la cornice dice «Street View
// non disponibile», o mostra la foto di un passante): per questo «altro posto» non costa niente.
// La mappa delle risposte è Leaflet con le tessere di OpenStreetMap (da jsdelivr, come nel vecchio Mappa).
//
// Niente $pzk: si gioca per il record, che resta nel browser (localStorage «pzkko-pzkmaps»).
//
//   apri()   apre il foglio (lo carica la prima volta)
import { PAESI, CONTINENTI, ZONE, RAGGIO_KM, nomeDi } from './paesi.js'
import { puntoMondo, puntoZona, visto, vista, metri } from './punti.js'

const GIRI = 5, PIENO = 5000, SCALA_M = 1500
const CHIAVE = 'pzkko-pzkmaps'
const LEAFLET = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const it = (n) => n.toLocaleString('it-IT')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const senzaAccenti = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const lontano = (m) => (m < 1000 ? `${it(Math.round(m))} m` : `${(m / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} km`)
const puntiPer = (m) => (m <= 25 ? PIENO : Math.round(PIENO * Math.exp(-m / SCALA_M)))

// fase: 'scegli' · 'gioco' (si guarda e si risponde) · 'esito' · 'fine' (amici, dopo cinque giri)
const S = { fase: 'scegli', modo: 'mondo', zonaScelta: 'caso', zona: null, p: null, prossimo: null, carica: false, rotto: false, scelta: null, tiro: null, giro: 0, punti: 0, fila: 0, giuste: 0, giocate: 0, ultimi: [], storia: [], esito: null, nuovoRecord: false, cerca: '', partita: 0, ultimaZona: null }
const M = { fila: 0, zone: {} }
let dlg = null, el = {}, map = null, strato = null, Lf = null, Lp = null

function ricordato() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (!s) return
    M.fila = Number(s.fila) || 0
    if (s.zone && typeof s.zone === 'object') M.zone = s.zone
  } catch {}
}
function ricorda() { try { localStorage.setItem(CHIAVE, JSON.stringify(M)) } catch {} }

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) { dlg.classList.remove('chiude'); dlg.showModal() }
  if (S.fase === 'scegli') voce('dove sei finito?')
  disegna()
  el.dentro.focus({ preventScroll: true })
}

async function costruisci() {
  ricordato()
  await Promise.all(['../foglio.css', 'pzkmaps.css'].map((f) => new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL(f, import.meta.url).pathname
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })))
  dlg = document.createElement('dialog')
  dlg.className = 'fg pm'
  dlg.setAttribute('aria-labelledby', 'pm-titolo')
  dlg.innerHTML = `
    <div class="fg-dentro" tabindex="-1">
      <header class="fg-testa"><h2 id="pm-titolo">pzkmaps</h2><p class="fg-voce" role="status" aria-live="polite"></p>
        <button type="button" class="fg-chiudi" data-chiudi aria-label="chiudi"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button></header>
      <div class="pm-corpo">
        <section class="pm-scegli">
          <div class="pm-modo">
            <h3>mondo</h3>
            <p>ti lascio su una <b>strada asfaltata</b> di uno di ${Object.keys(PAESI).length} stati, ogni volta in un punto nuovo. Devi dire solo <b>in che stato sei</b>.</p>
            <p class="pm-rec" data-rec-mondo></p>
            <button type="button" class="fg-tasto" data-vai="mondo">gioca</button>
          </div>
          <div class="pm-modo">
            <h3>amici di discord</h3>
            <p>un posto a caso entro <b>${RAGGIO_KM} km</b> dal centro: qui devi trovare <b>il punto esatto</b> sulla mappa. Cinque giri.</p>
            <div class="pm-zone">${ZONE.map((z) => `<button type="button" class="pm-zona" data-vai="amici" data-zona="${z.id}"><b>provincia di ${esc(z.citta)}</b><span>${esc(z.chi)}</span><small data-rec="${z.id}"></small></button>`).join('')}<button type="button" class="pm-zona caso" data-vai="amici" data-zona="caso"><b>a caso</b><span>ogni giro una provincia diversa</span><small data-rec="caso"></small></button></div>
          </div>
        </section>
        <section class="pm-gioco" hidden>
          <div class="pm-vista">
            <iframe class="pm-sv" title="la strada" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin" loading="eager"></iframe>
            <p class="pm-targa"><b>pzkmaps</b><span data-targa></span></p>
            <p class="pm-carica" hidden><span></span></p>
          </div>
          <div class="pm-lato">
            <dl class="pm-conti"><div><dt data-c1></dt><dd data-v1></dd></div><div><dt data-c2></dt><dd data-v2></dd></div><div><dt>record</dt><dd data-v3></dd></div></dl>
            <div class="pm-paesi"><input type="search" class="pm-cerca" placeholder="cerca lo stato…" aria-label="cerca lo stato" autocomplete="off" spellcheck="false" enterkeyhint="search"><div class="pm-elenco" role="listbox" aria-label="gli stati"></div></div>
            <div class="pm-esito" hidden></div>
            <div class="pm-mappa" hidden></div>
            <div class="pm-azioni"><button type="button" class="fg-tasto" data-conferma>conferma</button><button type="button" class="fg-link" data-altro>altro posto</button><button type="button" class="fg-link" data-smetti>smetto</button></div>
          </div>
        </section>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = { dentro: q('.fg-dentro'), voce: q('.fg-voce'), scegli: q('.pm-scegli'), gioco: q('.pm-gioco'), sv: q('.pm-sv'), targa: q('[data-targa]'), carica: q('.pm-carica'), paesi: q('.pm-paesi'), cerca: q('.pm-cerca'), elenco: q('.pm-elenco'), esito: q('.pm-esito'), mappa: q('.pm-mappa'), conferma: q('[data-conferma]'), altro: q('[data-altro]'), smetti: q('[data-smetti]') }
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) return chiudi()
    const vai = e.target.closest('[data-vai]')
    if (vai) return comincia(vai.dataset.vai, vai.dataset.zona)
    const paese = e.target.closest('[data-paese]')
    if (paese && S.fase === 'gioco' && !S.carica) { S.scelta = paese.dataset.paese; return elenco() }
    if (e.target.closest('[data-conferma]')) return avanti()
    if (e.target.closest('[data-altro]')) return altroPosto()
    if (e.target.closest('[data-smetti]')) return smetti()
    if (e.target.closest('[data-riprova]')) return giro()
  })
  el.elenco.addEventListener('dblclick', (e) => { if (e.target.closest('[data-paese]')) avanti() })
  el.cerca.addEventListener('input', () => { S.cerca = el.cerca.value; elenco() })
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.target === el.cerca && S.fase === 'gioco') { // invio nella ricerca: se ne resta uno solo è quello
      e.preventDefault()
      const visibili = [...el.elenco.querySelectorAll('[data-paese]')]
      if (visibili.length === 1) { S.scelta = visibili[0].dataset.paese; elenco() }
      if (S.scelta) avanti()
      return
    }
    if (!e.target.closest('button, input') && S.fase !== 'scegli') { e.preventDefault(); avanti() }
  })
  el.sv.addEventListener('load', () => { if (el.sv.dataset.vero) setTimeout(() => { S.carica = false; disegna() }, 500) })
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude') }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', fine, { once: true })
}
function voce(t, scossa = false) {
  if (!el.voce) return
  el.voce.textContent = t
  if (scossa && !RIDOTTO.matches) { el.voce.classList.remove('scossa'); void el.voce.offsetWidth; el.voce.classList.add('scossa') }
}

// ── la mappa (Leaflet, caricato la prima volta che serve) ──
function leaflet() {
  if (globalThis.L?.map) return Promise.resolve(globalThis.L)
  return (Lp ??= new Promise((ok, no) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `${LEAFLET}.css`; document.head.appendChild(l)
    const s = document.createElement('script'); s.src = `${LEAFLET}.js`; s.async = true
    s.onload = () => ok(globalThis.L); s.onerror = () => { Lp = null; no(new Error('mappa')) }
    document.head.appendChild(s)
  }))
}
async function mappa() {
  Lf = await leaflet()
  if (!map) {
    map = Lf.map(el.mappa, { zoomControl: true, attributionControl: true, zoomSnap: 0.25 })
    map.attributionControl.setPrefix(false)
    Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(map)
    strato = Lf.layerGroup().addTo(map)
    map.on('click', (e) => { if (S.modo === 'amici' && S.fase === 'gioco' && !S.carica) { S.tiro = { lat: e.latlng.lat, lng: e.latlng.lng }; spilli(); disegna({ soloTasti: true }) } })
  }
  map.invalidateSize()
  return Lf
}
const spillo = (tipo) => Lf.divIcon({ className: `pm-spillo ${tipo}`, iconSize: [26, 26], iconAnchor: [13, 24], html: '<i></i>' })
/** Quello che c'è sulla mappa secondo il momento: il disco della zona, il tuo spillo, e a risposta data quello vero e la riga. */
function spilli() {
  if (!map) return
  strato.clearLayers()
  if (S.modo === 'amici' && S.zona) Lf.circle([S.zona.lat, S.zona.lng], { radius: RAGGIO_KM * 1000, color: '#b3121f', weight: 2.5, dashArray: '7 7', fill: true, fillColor: '#ffd400', fillOpacity: 0.06, interactive: false }).addTo(strato)
  if (S.tiro) Lf.marker([S.tiro.lat, S.tiro.lng], { icon: spillo('tuo'), interactive: false, keyboard: false }).addTo(strato)
  if (S.fase !== 'gioco' && S.p) {
    if (S.tiro) Lf.polyline([[S.tiro.lat, S.tiro.lng], [S.p.lat, S.p.lng]], { color: '#161616', weight: 3, dashArray: '2 7', interactive: false }).addTo(strato)
    Lf.marker([S.p.lat, S.p.lng], { icon: spillo('vero'), interactive: false, keyboard: false }).addTo(strato)
  }
}
function inquadra() {
  if (!map) return
  map.invalidateSize()
  if (S.modo === 'amici' && S.fase === 'gioco' && S.zona) return map.fitBounds(Lf.latLng(S.zona.lat, S.zona.lng).toBounds(RAGGIO_KM * 2000), { padding: [6, 6], animate: false })
  if (S.modo === 'amici' && S.p && S.tiro) return map.fitBounds([[S.tiro.lat, S.tiro.lng], [S.p.lat, S.p.lng]], { padding: [40, 40], maxZoom: 17, animate: !RIDOTTO.matches })
  if (S.p) map.setView([S.p.lat, S.p.lng], 4, { animate: false })
}

// ── il disegno ──
function elenco() {
  const c = senzaAccenti(S.cerca.trim())
  el.elenco.innerHTML = CONTINENTI.map(([nome, codici]) => {
    const righe = codici.map((k) => [k, nomeDi(k)]).filter(([, n]) => !c || senzaAccenti(n).includes(c)).sort((a, b) => a[1].localeCompare(b[1], 'it'))
    return righe.length ? `<h4>${nome}</h4>${righe.map(([k, n]) => `<button type="button" class="pm-paese" role="option" data-paese="${k}" aria-selected="${k === S.scelta}">${esc(n)}</button>`).join('')}` : ''
  }).join('') || '<p class="pm-niente">nessuno stato con questo nome</p>'
  el.conferma.disabled = S.carica || !S.scelta
}
function disegna({ soloTasti = false } = {}) {
  const f = S.fase, mondo = S.modo === 'mondo'
  el.scegli.hidden = f !== 'scegli'; el.gioco.hidden = f === 'scegli'
  dlg.dataset.fase = f; dlg.dataset.modo = S.modo
  if (f === 'scegli') {
    dlg.querySelector('[data-rec-mondo]').innerHTML = M.fila ? `il tuo record: <b>${M.fila}</b> di fila` : 'non hai ancora un record'
    for (const s of dlg.querySelectorAll('[data-rec]')) s.textContent = M.zone[s.dataset.rec] ? `record ${it(M.zone[s.dataset.rec])}` : ''
    return
  }
  // i tasti
  el.conferma.textContent = f === 'gioco' ? 'conferma' : f === 'fine' ? 'ancora' : mondo || S.giro < GIRI ? 'avanti' : 'la pagella'
  el.conferma.disabled = S.carica || S.rotto || (f === 'gioco' && (mondo ? !S.scelta : !S.tiro))
  el.altro.hidden = f !== 'gioco' || S.rotto
  el.altro.disabled = S.carica
  el.smetti.textContent = f === 'fine' ? 'cambia gioco' : 'smetto'
  if (soloTasti) return
  // i conti
  const t = (k, v) => { dlg.querySelector(`[data-${k}]`).textContent = v }
  if (mondo) { t('c1', 'di fila'); t('v1', S.fila); t('c2', 'giuste'); t('v2', `${S.giuste}/${S.giocate}`); t('v3', M.fila) }
  else { t('c1', 'giro'); t('v1', `${Math.min(S.giro, GIRI)}/${GIRI}`); t('c2', 'punti'); t('v2', it(S.punti)); t('v3', it(M.zone[S.zonaScelta] || 0)) }
  el.targa.textContent = mondo ? `mondo · posto n. ${S.giocate + (f === 'gioco' ? 1 : 0)}` : S.zona ? `provincia di ${S.zona.citta} · ${S.zona.chi}` : 'amici di discord'
  el.carica.hidden = !S.carica && !S.rotto
  el.carica.firstElementChild.innerHTML = S.rotto ? 'le strade non rispondono. <button type="button" class="fg-link" data-riprova>riprova</button>' : 'cerco una strada…'
  // a destra: l'elenco degli stati (mondo, mentre si gioca), l'esito, la mappa (amici sempre; mondo solo a risposta data)
  el.paesi.hidden = !(mondo && f === 'gioco')
  el.esito.hidden = f === 'gioco'
  el.mappa.hidden = mondo && f === 'gioco'
  if (mondo && f === 'gioco') elenco()
  if (f !== 'gioco') el.esito.innerHTML = esito()
  if (!el.mappa.hidden) mappa().then(() => { spilli(); inquadra() }).catch(() => { el.mappa.hidden = true })
}
function esito() {
  const e = S.esito, p = S.p
  if (S.fase === 'fine') {
    return `<p class="pm-timbro ${S.nuovoRecord ? 'giusto' : ''}">${S.nuovoRecord ? 'nuovo record!' : 'la pagella'}</p>
      <p class="pm-totale"><b>${it(S.punti)}</b><small>su ${it(GIRI * PIENO)}</small></p>
      <ol class="pm-storia">${S.storia.map(([citta, m, pt]) => `<li><span>${esc(citta)}</span><b>${lontano(m)}</b><i>${it(pt)}</i></li>`).join('')}</ol>`
  }
  if (!e) return ''
  if (S.modo === 'mondo') {
    return `<p class="pm-timbro ${e.giusto ? 'giusto' : 'sbagliato'}">${e.giusto ? 'giusto!' : 'no!'}</p>
      <p class="pm-era">${e.giusto ? 'sei in' : `hai detto ${esc(nomeDi(S.scelta))}, ma sei in`} <b>${esc(nomeDi(p.paese))}</b>${p.dove ? `<small>${esc(p.dove)}</small>` : ''}</p>`
  }
  return `<p class="pm-timbro ${e.m < 500 ? 'giusto' : e.m > 4000 ? 'sbagliato' : ''}">${lontano(e.m)}</p>
    <p class="pm-era">dal punto vero: <b>+${it(e.punti)}</b> punti<small>provincia di ${esc(S.zona.citta)} · ${esc(S.zona.chi)}</small></p>`
}

// ── le mosse ──
function comincia(modo, zona = 'caso') {
  Object.assign(S, { modo, zonaScelta: modo === 'amici' ? zona : 'caso', fase: 'gioco', giro: 0, punti: 0, fila: 0, giuste: 0, giocate: 0, storia: [], prossimo: null, nuovoRecord: false, cerca: '', partita: S.partita + 1 })
  el.cerca.value = ''
  giro()
}
function genera() {
  if (S.modo === 'mondo') return puntoMondo({ evita: S.ultimi })
  const altre = ZONE.filter((z) => z !== S.ultimaZona) // (a caso: mai la stessa provincia due volte di fila)
  const zona = S.zonaScelta === 'caso' ? altre[Math.floor(Math.random() * altre.length)] : ZONE.find((z) => z.id === S.zonaScelta)
  S.ultimaZona = zona
  return puntoZona(zona).then((p) => ({ ...p, zona }))
}
/** Un posto nuovo: quello già pronto, se c'è, altrimenti si cerca adesso; e intanto si prepara il prossimo. */
async function giro({ stesso = false } = {}) {
  const partita = S.partita
  if (!stesso) S.giro++
  Object.assign(S, { fase: 'gioco', carica: true, rotto: false, scelta: null, tiro: null, esito: null, p: null })
  el.sv.dataset.vero = ''
  el.sv.src = 'about:blank'
  if (S.modo === 'amici') S.zona = S.zonaScelta === 'caso' ? null : ZONE.find((z) => z.id === S.zonaScelta)
  voce(S.modo === 'mondo' ? 'in che stato sei?' : 'trova il punto esatto sulla mappa')
  disegna()
  let p = null
  try { p = (await S.prossimo) ?? (await genera()) } catch { try { p = await genera() } catch {} }
  if (partita !== S.partita || S.fase !== 'gioco') return
  S.prossimo = null
  if (!p) { S.carica = false; S.rotto = true; voce('non trovo strade: la rete?', true); return disegna() }
  visto(p)
  S.p = p
  if (p.zona) S.zona = p.zona
  if (S.modo === 'mondo') { S.ultimi.push(p.paese); if (S.ultimi.length > 6) S.ultimi.shift() }
  el.sv.dataset.vero = '1'
  el.sv.src = vista(p)
  setTimeout(() => { if (S.p === p && S.carica) { S.carica = false; disegna() } }, 4000) // (se la cornice non avvisa)
  disegna()
  S.prossimo = genera().catch(() => null) // il prossimo si prepara mentre guardi questo
}
function altroPosto() {
  if (S.fase !== 'gioco' || S.carica) return
  voce('va bene, un altro posto')
  giro({ stesso: true })
}
function avanti() {
  if (S.carica || S.rotto) return
  if (S.fase === 'fine') return comincia(S.modo, S.zonaScelta)
  if (S.fase === 'esito') {
    if (S.modo === 'amici' && S.giro >= GIRI) return pagella()
    return giro()
  }
  if (S.fase !== 'gioco' || !S.p) return
  if (S.modo === 'mondo') {
    if (!S.scelta) return voce('scegli uno stato dall’elenco', true)
    const giusto = S.scelta === S.p.paese
    S.giocate++
    if (giusto) { S.giuste++; S.fila++; if (S.fila > M.fila) { M.fila = S.fila; ricorda() } } else S.fila = 0
    S.esito = { giusto }
    voce(giusto ? (S.fila > 1 ? `${S.fila} di fila!` : 'preso!') : `era ${nomeDi(S.p.paese)}`, !giusto)
  } else {
    if (!S.tiro) return voce('fai un clic sulla mappa dove pensi di essere', true)
    const m = metri(S.tiro, S.p), punti = puntiPer(m)
    S.punti += punti
    S.storia.push([S.zona.citta, m, punti])
    S.esito = { m, punti }
    voce(m < 100 ? 'praticamente sopra!' : m < 500 ? 'vicinissimo' : m < 2000 ? 'non male' : 'lontanuccio')
  }
  S.fase = 'esito'
  disegna()
  el.conferma.focus({ preventScroll: true })
}
function pagella() {
  S.fase = 'fine'
  const prima = M.zone[S.zonaScelta] || 0
  S.nuovoRecord = S.punti > prima
  if (S.nuovoRecord) { M.zone[S.zonaScelta] = S.punti; ricorda() }
  voce(`${it(S.punti)} punti in cinque giri`)
  S.tiro = null; S.p = null
  disegna()
  if (map && S.zona) { spilli(); map.fitBounds(Lf.latLng(S.zona.lat, S.zona.lng).toBounds(RAGGIO_KM * 2000), { padding: [6, 6], animate: false }) }
}
function smetti() {
  S.partita++
  Object.assign(S, { fase: 'scegli', prossimo: null, carica: false, rotto: false, p: null, zona: null })
  el.sv.dataset.vero = ''
  el.sv.src = 'about:blank'
  voce('dove sei finito?')
  disegna()
}
