// pzkko.it — la zona «da provare» della bacheca: il COMPORTAMENTO (UX). Claude disegna sopra.
// Qui si decide come e quando i quattro volantini cambiano e come la zona reagisce a quello che
// la persona ha fatto; la grafica (movimenti, colori, keyframe) la fa Claude sui ganci che questo
// codice mette e toglie (data-*, le classi .is-out/.is-in/.is-appena/.is-nuova) e sulle variabili
// CSS che legge (--pz-scambio, --pz-respiro, --pz-appena, --pz-sfalsa). Il contratto completo è in
// design/da-provare-ux.md.
//
// Niente dipendenze, niente server. I numeri dell'uso (quante volte, quando l'ultima, quanto è
// durata) stanno in localStorage in `pzkko-app-stats` e `pzkko-app-ultima`; `pzkko-provate` (l'array
// dei target già aperti) resta di app.js e non si tocca: qui aggiungiamo solo chiavi nuove.
//
// Modello: il muro di 4 volantini è una finestra su una pila ordinata delle 26 app. Un volantino
// alla volta esce e uno nuovo entra; l'ordine della pila cambia in base all'uso (mai provate prima,
// nuove davanti, poi le altre col peso di genere e di recenza). Tutte le 26 passano dal muro senza
// diventare una lista, e il volantino che esce da solo in basso può usare la stessa scelta.

export const provare = (() => {
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]

  // stato del muro: azzera e riparte pulito a ogni monta (renderBoard rifà tutto l'HTML)
  let ctx = null          // i pezzi passati da app.js (APPS, flyerHtml, tesseraHtml, …)
  let zone = null         // #annunci
  let fila = null         // .annunci__fila
  let slots = []          // i 4 <article class="fly">
  let deck = []           // le chiavi in ordine di priorità
  let visibili = []       // le 4 chiavi mostrate adesso
  let posizione = 0       // dove riprendere a pescare dalla pila
  let cursore = 0         // quale slot cambia per primo al giro dopo
  let tick = 0            // il battito che decide quando cambiare
  let io = null           // IntersectionObserver: in vista / fuori vista
  let ac = null           // AbortController: smonta tutti gli ascoltatori
  let pausaHover = false
  let pausaFocus = false
  let inVista = true
  let ultimo = 0          // quando è avvenuto l'ultimo cambio
  let ultimaAnnuncia = 0  // per non annunciare a raffica ai lettori di schermo
  let appena = []         // le app appena usate (per non riproporle subito)
  let gen = 0             // generazione del monta: i timer scattano solo se è ancora questa
  let storia = []         // cronologia corta dei «prima» per il comando indietro (manuale)
  let festaFatta = false  // la festa per la tessera piena va una volta sola
  let artePromessa = null // l'import della grafica (una volta sola)
  const aperti = new Map() // target -> istante d'apertura, per calcolare la durata
  const MAX_STORIA = 6

  // un timer è «vivo» solo se appartiene alla generazione corrente e la zona è ancora montata
  const vivo = (g) => g === gen && zone && ctx
  const emetti = (nome, detail) => zone && zone.dispatchEvent(new CustomEvent(nome, { detail, bubbles: true }))

  // localStorage: i numeri in più dell'uso (app.js tiene `pzkko-provate`)
  const K_STATS = 'pzkko-app-stats'
  const K_ULTIMA = 'pzkko-app-ultima'
  const legge = (k) => { try { return localStorage.getItem(k) } catch { return null } }
  const scrive = (k, v) => { try { localStorage.setItem(k, v) } catch {} }
  const ripulisci = (k) => { try { localStorage.removeItem(k) } catch {} }

  let _stats = null
  function stats() {
    if (_stats) return _stats
    try { _stats = JSON.parse(legge(K_STATS) || '{}') || {} } catch { _stats = {} }
    return _stats
  }
  function salvaStats() { scrive(K_STATS, JSON.stringify(_stats || {})) }

  // app <-> target
  const app = (k) => ctx.APPS.find((p) => p.key === k)
  const targets = (p) => (p.play || []).map(([, h]) => h)
  // i numeri d'uso di un'app, sommando i suoi target (un progetto può avere più tasti)
  function statApp(p) {
    const st = stats(); let n = 0, at = 0, ms = 0
    for (const t of targets(p)) { const e = st[t]; if (e) { n += e.n || 0; at = Math.max(at, e.at || 0); ms += e.ms || 0 } }
    return { n, at, ms }
  }

  // ── l'ordine della pila: chi esce per primo ──
  // punteggio più basso = più in alto. Mai provate prima (nuove davanti), poi le provate:
  // riemergono prima quelle che non vedi da un po', poi quelle che usi di più; se usi quasi solo
  // un genere (giochi/tool), le mai-provate di quel genere salgono un po'. Un seme per giorno
  // tiene l'ordine stabile nella giornata ma diverso da un giorno all'altro.
  const GIORNO = 864e5
  function genereDominante() {
    const c = { game: 0, tool: 0, site: 0 }
    for (const p of ctx.APPS) { const { n } = statApp(p); if (n) c[p.kind] = (c[p.kind] || 0) + n }
    const ord = Object.entries(c).sort((a, b) => b[1] - a[1])
    if (!ord[0][1]) return null
    if (ord[0][1] >= (ord[1]?.[1] || 0) * 2) return ord[0][0]   // dominante solo se almeno il doppio
    return null
  }
  function pesoApp(p) {
    const s = ctx.provate(), prov = ctx.provata(p, s)
    const { n, at } = statApp(p)
    const dominante = genereDominante()
    if (!prov) {
      let pz = ctx.isNew(p) ? 0 : 10
      if (dominante && p.kind === dominante) pz -= 3
      return pz
    }
    const giorni = at ? Math.floor((Date.now() - at) / GIORNO) : 999
    const recenza = Math.max(0, 14 - giorni)   // 14 = usata oggi, 0 = dimenticata
    return 100 + recenza * 2 - Math.min(n, 20) // meno recente e più usata -> più su
  }
  function ordina() {
    const giorno = Math.floor(Date.now() / GIORNO)
    deck = ctx.APPS.map((p) => p.key).sort((a, b) => {
      const d = pesoApp(app(a)) - pesoApp(app(b))
      return d || (ctx.seme(`${a}${giorno}`) - ctx.seme(`${b}${giorno}`))
    })
  }

  // ── tempi (letti dal CSS, con l'unità: .56s = 560ms, 5.2s = 5200ms) ──
  let respiroForzato = null   // ?provare=veloce / =fermo
  function leggiMs(v, fb) {
    if (!zone) return fb
    const raw = (getComputedStyle(zone).getPropertyValue(v) || '').trim()
    const m = raw.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/i)
    if (!m) return fb
    const n = parseFloat(m[1])
    if (!Number.isFinite(n) || n < 0) return fb
    return m[2].toLowerCase() === 's' ? n * 1000 : n   // 's' → secondi, 'ms' o niente → millisecondi
  }
  function durataScambio() {
    if (ctx.reduced) return 0
    return leggiMs('--pz-scambio', 560)
  }
  function respiro() {
    return respiroForzato ?? leggiMs('--pz-respiro', 5200)
  }
  function appenaAttesa() {
    if (ctx.reduced) return 0
    return leggiMs('--pz-appena', 1000)
  }
  function sfalsa() {
    if (ctx.reduced) return 0
    return leggiMs('--pz-sfalsa', 90)
  }

  // ── chi pescare dalla pila ──
  function chiaviRecenti() {
    const ad = Date.now()
    appena = appena.filter((x) => ad - x.at < 40000)
    return new Set(appena.map((x) => x.k))
  }
  // pesca `n` chiavi nuove (non visibili e, se possibile, non recenti) avanzando `posizione`;
  // `preferisci` è la chiave di un'app appena usata: prima prova lo stesso genere.
  function pesca(n, preferisci = null) {
    const m = deck.length, out = []
    if (m === 0) return out
    const rec = chiaviRecenti()
    const visti = () => new Set([...visibili, ...out])
    const raccogli = (ok) => {
      for (let k = 0; k < m && out.length < n; k++) {
        const c = deck[(posizione + k) % m]
        if (!visti().has(c) && ok(c)) { out.push(c); posizione = (posizione + k + 1) % m }
      }
    }
    if (preferisci) { const p = app(preferisci); raccogli((c) => !rec.has(c) && app(c)?.kind === p?.kind) }
    raccogli((c) => !rec.has(c))
    raccogli(() => true)
    // rete di sicurezza: se la pila è corta, ripiega su qualunque chiave
    while (out.length < n) { out.push(deck[posizione % m]); posizione = (posizione + 1) % m }
    return out
  }
  const prossimaAvanti = (preferisci = null) => pesca(1, preferisci)[0] ?? null

  // ── costruire un volantino di uno slot (l'articolo è di app.js::flyerHtml) ──
  function costruisciSlot(i, chiave) {
    const p = app(chiave)
    const t = document.createElement('div')
    t.innerHTML = ctx.flyerHtml(p, i, { s: ctx.provate() })
    const el = t.firstElementChild
    el.dataset.slot = i
    el.dataset.stato = 'pronto'
    el.style.setProperty('--dir', '0')
    el.style.setProperty('--ritardo', '0ms')
    return el
  }

  // ── il cambio vero: un volantino esce, uno entra ──
  // La durata sta in --pz-scambio (letta dal CSS); se il CSS non c'è ancora, il tempo di sicurezza
  // evita che resti bloccato. Prima esce (data-stato=uscendo + data-motivo), poi il contenuto cambia
  // e il nuovo entra (entrando), poi torna pronto (il data-motivo si toglie). Con prefers-reduced-motion
  // la durata è 0. `motivo` è «giro» (automatico), «mano» (comando dell'utente) o «usata» (tornato da un'app).
  function scambia(slot, dir, { preferisci = null, entra = null, motivo = 'giro' } = {}) {
    const g = gen
    if (!zone || !slots[slot]) return null
    const el = slots[slot]
    if (el.dataset.stato === 'uscendo' || el.dataset.stato === 'entrando') return null
    const via = visibili[slot]
    const prossima = entra ?? prossimaAvanti(preferisci)
    if (!prossima) return null
    const d = durataScambio()
    el.dataset.stato = 'uscendo'
    el.dataset.motivo = motivo
    el.classList.remove('is-appena')
    el.classList.add('is-out')
    el.style.setProperty('--dir', dir)
    el.style.setProperty('--ritardo', '0ms')
    delete el.dataset.prossimo
    emetti('provare:esce', { slot, via, dir, motivo, el })
    setTimeout(() => {
      if (!vivo(g)) return
      const nuova = costruisciSlot(slot, prossima)
      nuova.dataset.stato = 'entrando'
      nuova.dataset.motivo = motivo
      nuova.classList.add('is-in')
      nuova.style.setProperty('--dir', dir)
      const vecchia = slots[slot]
      vecchia.replaceWith(nuova)
      slots[slot] = nuova
      visibili[slot] = prossima
      // il cambio è avvenuto: chi ascolta (grafica, suono) può agganciarsi qui
      emetti('provare:scambio', { slot, via, entra: prossima, dir, motivo, el: nuova })
      setTimeout(() => {
        if (!vivo(g)) return
        nuova.dataset.stato = 'pronto'
        delete nuova.dataset.motivo
        nuova.classList.remove('is-in')
        nuova.style.setProperty('--dir', '0')
        segnaProssimo()
      }, d)
    }, d)
    return prossima
  }
  // avanza di un volantino (senza annunci: è il giro automatico); torna la chiave entrata
  function avanti(dir = 1) {
    const entra = scambia(cursore, dir, { motivo: 'giro' })
    cursore = (cursore + 1) % 4
    azzeraConto()
    return entra
  }
  // il comando dell'utente (tasti, trascinamento, frecce): cambia TUTTA la fila, un volantino
  // dopo l'altro con --pz-sfalsa; «indietro» riporta quelli di prima (cronologia vera e corta).
  function manuale(dir) {
    const prima = cambiaRiga(dir)
    if (prima) annuncia(`${ctx.spot().appNova}: ${titolo(prima)}`)
  }
  function cambiaRiga(dir) {
    const g = gen
    if (!zone || !slots.length) return null
    if (slots.some((s) => s.dataset.stato === 'uscendo' || s.dataset.stato === 'entrando')) return null
    let nuovi
    if (dir >= 0) {
      const posPre = posizione
      nuovi = pesca(4)
      if (nuovi.length < 4) { posizione = posPre; return null }
      storia.push({ visibili: [...visibili], posizione: posPre })
      if (storia.length > MAX_STORIA) storia.shift()
    } else {
      const prima = storia.pop()
      if (!prima) return null
      nuovi = prima.visibili
      posizione = prima.posizione
    }
    const sf = sfalsa(), verso = dir >= 0 ? 1 : -1
    nuovi.forEach((chiave, i) => {
      setTimeout(() => { if (vivo(g)) scambia(i, verso, { entra: chiave, motivo: 'mano' }) }, i * sf)
    })
    cursore = 0
    azzeraConto()
    return nuovi[0]
  }

  const titolo = (chiave) => app(chiave)?.title || ''

  function annuncia(testo) {
    const el = zone && $('.annunci__live', zone)
    if (!el || !testo) return
    const ad = Date.now()
    if (ad - ultimaAnnuncia < 1400) return
    ultimaAnnuncia = ad
    el.textContent = ''
    requestAnimationFrame(() => { el.textContent = testo })
  }

  // ── il conto e il nastro del prossimo: segna la .fly che cambierà al giro dopo ──
  function segnaProssimo() {
    for (const s of slots) if (s?.isConnected) delete s.dataset.prossimo
    const el = slots[cursore]
    if (el?.isConnected) el.dataset.prossimo = '1'
  }
  function azzeraConto() {
    ultimo = Date.now()
    segnaProssimo()
  }

  // ── la tessera: la ridisegna col conto aggiornato e fa «pop» sul buco appena timbrato ──
  // `ritardo` (ms) è quando il buco deve timbrarsi davvero (se l'app è in vista: «appena»+scambio,
  // altrimenti subito); il gancio --timbro-ritardo e l'evento provare:timbro lo raccontano a Claude.
  function aggiornaTessera(chiaviNuove = [], ritardo = 0) {
    const g = gen
    const vecchia = zone && $('.tessera', zone)
    if (!vecchia) return
    const t = document.createElement('div')
    t.innerHTML = ctx.tesseraHtml(ctx.provate())
    const nuova = t.firstElementChild
    for (const d of nuova.querySelectorAll('i[data-app]')) if (chiaviNuove.includes(d.dataset.app)) d.classList.add('is-nuova')
    nuova.style.setProperty('--timbro-ritardo', `${ritardo}ms`)
    vecchia.replaceWith(nuova)
    if (chiaviNuove.length) emetti('provare:timbro', { chiavi: chiaviNuove, ritardo })
    for (const d of nuova.querySelectorAll('.is-nuova')) setTimeout(() => { if (vivo(g)) d.classList.remove('is-nuova') }, ritardo + 1600)
  }
  // il volantino appena usato: si ridisegna col timbro «provata ✓» e resta un attimo in evidenza
  function segnaAppena(slot) {
    const g = gen
    const chiave = visibili[slot]
    if (!chiave) return
    const nuova = costruisciSlot(slot, chiave)
    nuova.dataset.stato = 'appena'
    nuova.classList.add('is-appena')
    slots[slot].replaceWith(nuova)
    slots[slot] = nuova
    // se nel frattempo non è già uscito (scambia mette «uscendo»), torna pronto
    setTimeout(() => { if (vivo(g) && nuova.dataset.stato === 'appena') { nuova.dataset.stato = 'pronto'; nuova.classList.remove('is-appena') } }, 1400)
  }

  // ── la reazione all'uso: chiamata da app.js quando un'app si chiude ──
  // (il timbro della tessera e la reazione del muro avvengono qui, alla chiusura: all'apertura
  //  il dialog copre la bacheca e il «pop» non lo vedrebbe nessuno)
  function reagisci(target, motivo = 'chiusa') {
    if (!zone || !ctx || !ctx.attivo() || document.hidden) return
    const g = gen
    ordina()
    const chiavi = ctx.appDi(target)
    segnaRecenti(chiavi)
    azzeraConto()
    if (motivo === 'chiusa') {
      const slot = visibili.findIndex((k) => chiavi.includes(k))
      const ritardo = slot >= 0 ? appenaAttesa() + durataScambio() : 0
      aggiornaTessera(chiavi, ritardo)
      if (chiavi.length) annuncia(`${ctx.spot().provata}: ${titolo(chiavi[0])}`)
      const pronta = () => zone && ctx.attivo() && !document.hidden && !ctx.occupato() && inVista
      if (slot >= 0) {
        segnaAppena(slot)
        setTimeout(() => { if (vivo(g) && pronta()) scambia(slot, 1, { preferisci: visibili[slot], motivo: 'usata' }) }, appenaAttesa())
      } else {
        setTimeout(() => { if (vivo(g) && pronta()) avanti(1) }, 800)
      }
      // la tessera piena, appena completata: la festa, una volta sola
      if (ctx.APPS.every((p) => ctx.provata(p)) && !festaFatta) {
        festaFatta = true
        zone.dataset.festa = '1'
        setTimeout(() => { if (vivo(g)) delete zone.dataset.festa }, 6000)
      }
    }
    aggiornaStato()
  }
  function segnaRecenti(chiavi) {
    const ad = Date.now()
    for (const k of chiavi) appena.push({ k, at: ad })
  }

  // ── lo stato della zona (per Claude: gira / pausa / fermo / completo) ──
  function giraOra() {
    return !!zone && ctx.heavy && ctx.attivo() && !document.hidden && inVista && !ctx.occupato() && !pausaHover && !pausaFocus
  }
  function aggiornaStato() {
    if (!zone) return
    const pieno = ctx.APPS.every((p) => ctx.provata(p))
    zone.dataset.completo = pieno ? '1' : ''
    if (!pieno) festaFatta = false
    const stato = !ctx.heavy || !ctx.attivo() || document.hidden || !inVista || ctx.occupato() ? 'fermo'
      : (pausaHover || pausaFocus) ? 'pausa' : 'gira'
    if (zone.dataset.stato !== stato) zone.dataset.stato = stato
  }
  function cuore() {
    if (!zone || !ctx || !ctx.attivo() || document.hidden) return
    aggiornaStato()
    if (!giraOra()) { azzeraConto(); return }
    if (Date.now() - ultimo >= respiro()) {
      if (!slots.some((s) => s.dataset.stato === 'uscendo' || s.dataset.stato === 'entrando')) avanti(1)
    }
  }

  // ── comandi: tocco (trascina), tastiera, mouse ──
  let downX = 0, downY = 0, trascinato = false, pointerId = null
  function onDown(e) {
    if (e.pointerType === 'mouse') return     // il mouse ha i tasti + il passaggio che mette in pausa
    downX = e.clientX; downY = e.clientY; trascinato = false; pointerId = e.pointerId
  }
  function onMove(e) {
    if (e.pointerId !== pointerId) return
    const dx = e.clientX - downX, dy = e.clientY - downY
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) trascinato = true
  }
  function onUp(e) {
    if (e.pointerId !== pointerId) return
    pointerId = null
    const dx = e.clientX - downX
    if (trascinato && Math.abs(dx) > 40) manuale(dx < 0 ? 1 : -1)
    // se dopo il trascinamento arriva un click (raro), va ingoiato: il flag resta su fino a dopo
    if (trascinato) setTimeout(() => { trascinato = false }, 0)
  }
  function onKey(e) {
    if (e.target !== fila) return
    if (e.key === 'ArrowRight') { e.preventDefault(); manuale(1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); manuale(-1) }
  }
  function onClic(e) {
    // dopo un trascinamento non deve scattare il tasto finito sotto il dito
    if (trascinato) { e.stopPropagation(); e.preventDefault(); trascinato = false; return }
    if (e.target.closest('[data-provare-prev]')) { e.preventDefault(); manuale(-1) }
    else if (e.target.closest('[data-provare-next]')) { e.preventDefault(); manuale(1) }
  }

  // ── monta / smonta ──
  function smonta() {
    gen++
    if (tick) { clearInterval(tick); tick = 0 }
    if (ac) { ac.abort(); ac = null }
    if (io && zone) io.unobserve(zone)
    zone = null; fila = null; slots = []; visibili = []; deck = []
    posizione = 0; cursore = 0; ultimo = 0
    pausaHover = false; pausaFocus = false; inVista = true
    storia = []
    ctx = null
  }

  function leggiUltima() { try { return JSON.parse(legge(K_ULTIMA) || 'null') } catch { return null } }

  // carica la grafica di Claude (un modulo che ascolta gli eventi su document, non esporta niente che ci serva)
  const arte = () => (artePromessa ??= import('./provare-arte.js').catch(() => {}))

  function monta(root, deps) {
    smonta()
    if (!root) return
    const g = gen
    ctx = deps
    zone = root
    ac = new AbortController()
    const sp = ctx.spot()
    zone.dataset.provare = '1'
    zone.innerHTML = `
      <header class="annunci__h">
        <h2>${ctx.esc(sp.titolo)}</h2>
        <p class="annunci__voce">${ctx.esc(sp.voce)}</p>
        ${ctx.tesseraHtml(ctx.provate())}
      </header>
      <div class="annunci__fila" role="group" tabindex="0" aria-label="${ctx.esc(sp.cambia)}" data-provare-fila>
        <div class="annunci__comandi">
          <button type="button" class="annunci__nav annunci__nav--prev" data-provare-prev aria-label="${ctx.esc(sp.indietro)}">${ctx.I.left}</button>
          <button type="button" class="annunci__nav annunci__nav--next" data-provare-next aria-label="${ctx.esc(sp.avanti)}">${ctx.I.right}</button>
        </div>
      </div>
      <p class="sr annunci__live" role="status"></p>`
    fila = $('.annunci__fila', zone)
    ordina()
    const frag = document.createDocumentFragment()
    for (let i = 0; i < 4 && i < deck.length; i++) { const c = deck[i]; visibili.push(c); frag.appendChild(costruisciSlot(i, c)) }
    fila.appendChild(frag)
    slots = $$('.fly', fila)
    posizione = Math.min(4, deck.length)
    azzeraConto()

    // ascoltatori, tutti con AbortController: niente doppioni dopo un ridisegno della bacheca
    fila.addEventListener('pointerdown', onDown, { signal: ac.signal })
    fila.addEventListener('pointermove', onMove, { signal: ac.signal })
    fila.addEventListener('pointerup', onUp, { signal: ac.signal })
    fila.addEventListener('pointercancel', onUp, { signal: ac.signal })
    fila.addEventListener('keydown', onKey, { signal: ac.signal })
    zone.addEventListener('click', onClic, { signal: ac.signal })
    if (ctx.canHover) {
      zone.addEventListener('pointerenter', () => { pausaHover = true; aggiornaStato() }, { signal: ac.signal })
      zone.addEventListener('pointerleave', () => { pausaHover = false; aggiornaStato() }, { signal: ac.signal })
    }
    zone.addEventListener('focusin', () => { pausaFocus = true; aggiornaStato() }, { signal: ac.signal })
    zone.addEventListener('focusout', () => { pausaFocus = false; aggiornaStato() }, { signal: ac.signal })

    if (!io) io = new IntersectionObserver((es) => { for (const e of es) { inVista = e.isIntersecting } aggiornaStato() }, { threshold: 0.25 })
    io.observe(zone)

    // bentornato: se manchi da giorni, un gancio per Claude (tolto dopo un po')
    const u = leggiUltima()
    if (u && Date.now() - (u.at || 0) > 2 * GIORNO) {
      zone.dataset.ritorno = '1'
      setTimeout(() => { if (vivo(g)) delete zone.dataset.ritorno }, 5000)
    }

    tick = setInterval(cuore, 400)
    aggiornaStato()

    // se la tessera è già piena al monta, la festa è già stata fatta (anche in una sessione
    // precedente): non la rifare al prossimo ritorno. La festa scatta solo sul vero passaggio.
    if (ctx.APPS.every((p) => ctx.provata(p))) festaFatta = true

    // la grafica si carica una volta sola; provare:monta arriva dopo che è riuscita, così chi
    // si collega dopo la riceve comunque (e chi era già montato la riceve per la zona corrente)
    arte().then(() => { if (vivo(g)) emetti('provare:monta', { zone }) })
  }

  // ── registra l'uso (chiamato da app.js quando un'app si apre / si chiude) ──
  function aperta(target) {
    if (!target) return
    aperti.set(target, Date.now())
    const st = stats()
    const e = st[target] || { n: 0, at: 0, ms: 0 }
    e.n++; e.at = Date.now()
    st[target] = e
    _stats = st
    salvaStats()
  }
  function chiusa(target) {
    if (!target) return
    const st = stats()
    const e = st[target] || { n: 0, at: 0, ms: 0 }
    if (aperti.has(target)) { e.ms += Math.max(0, Date.now() - aperti.get(target)); aperti.delete(target) }
    st[target] = e
    _stats = st
    salvaStats()
    scrive(K_ULTIMA, JSON.stringify({ target, at: Date.now() }))
  }

  // la migliore app da proporre (la usa il volantino in basso, se vuole)
  function scegli(tranne = []) {
    if (!ctx) return null
    ordina()
    const vis = new Set(tranne), rec = chiaviRecenti()
    const k = deck.find((x) => !vis.has(x) && !rec.has(x))
    return k ? app(k) : null
  }

  // ── ?provare=… e console ──
  function debug() {
    const v = new URLSearchParams(location.search).get('provare')
    if (v === 'veloce') respiroForzato = 900
    else if (v === 'fermo') respiroForzato = Infinity
    else if (v === 'azzera') { ripulisci('pzkko-provate'); ripulisci(K_STATS); ripulisci(K_ULTIMA); festaFatta = false }
  }
  debug()

  return {
    monta, smonta, aperta, chiusa, reagisci, scegli,
    zona: () => zone,
    // per le prove da console: provare.avanza(), provare.indietro(), provare.stato(), provare.azzera()
    avanza: () => avanti(1),
    indietro: () => manuale(-1),
    stato: () => ({ visibili: [...visibili], deck: [...deck], posizione, cursore, storia: storia.length, stats: stats(), ultima: leggiUltima() }),
    azzera: () => { ripulisci('pzkko-provate'); ripulisci(K_STATS); ripulisci(K_ULTIMA); _stats = null; festaFatta = false },
  }
})()

// a disposizione della console per le prove a mano
if (typeof window !== 'undefined') window.provare = provare
