// public/assets/adesso.js
// (26.11) Il riquadro «ADESSO» della bacheca e della scheda attività, e l'attività
// in primo piano nella scheda a sinistra. DeepSeek: UX, macchina a stati e agganci;
// Claude Code: la grafica. Il lato dati (vetrina.js, api/vetrina.mjs) non si tocca.
//
// Regola di fondo: niente innerHTML a ogni cambio. Ogni app, ogni voce (gioco o
// brano) e ogni barra è un nodo con chiave che resta lo stesso finché la cosa
// esiste, così le transizioni di Claude hanno qualcosa su cui stare. La barra del
// brano avanza col solo transform, senza ridisegnare.
//
// L'uso vero del pc (quale app è in primo piano, da quanto, quanto spesso ci torna)
// qui si misura nel browser dal momento in cui la pagina è aperta: i campi veri
// (suDa, uso, ritorni, fermo…) sono richiesti al programma sul pc nel brief
// design/adesso-vivo.md. Finché non ci sono, la pagina calcola quello che può.
//
// Contratto in ingresso (opzioni):
//   testi()         -> tutte le scritte (vedi il brief)
//   icone           -> { desktop, game, gameBig, spotify, luogo:{ufficio,giro}, device:{desktop,web,mobile} } (HTML fidato)
//   coloreStato(st) -> colore del pallino dello stato
//   immagine(id)    -> url di icona/copertina (vetrina)
//   asset(a,k)      -> url di un asset Lanyard (o null)
//   clock(ms)       -> «m:ss» o «h:mm:ss»
//   presenza()      -> la presenza Lanyard (o null)
//   vetrina()       -> la vetrina (o null)
//   reduced         -> prefers-reduced-motion
//
// Esce un gestore: { widget(root), card(root), aggiorna(), distruggi() }.
//
// Agganci per la grafica (dettaglio e motivi nel brief):
//   stato della zona    -> data-stato (online|idle|dnd|offline), data-pc (vivo|fermo|spento),
//                          data-vuoto (presente se non c'è niente), data-motion (off se ridotto)
//   stato di un'app     -> data-app (nome), data-i (posizione), is-su, is-entra, is-esce,
//                          is-fondo (mai in primo piano), variabili --uso --da --ritorni
//   cambio di posizione -> is-flip/is-flip-on con --dx/--dy (FLIP)
//   barra del brano     -> --pct sulla .bar-t__fill, --done/--total sulla .bar-t
//   eventi             -> «adesso:cambio» su ogni radice (bubbles), detail { da, a, tipo }
//
// (26.11, Claude Code, dopo DeepSeek) Tre ritocchi al motore, per la grafica:
//   - opzioni.arte (facoltativa): il vestito, in adesso-arte.js. Il motore lo chiama in tre punti e basta:
//     arte.zona(z) alla nascita di un riquadro, arte.aggiorna(z, { presenza, vetrina, voci, uso, pc }) dopo ogni
//     aggiornamento, arte.tick(z) una volta al secondo. Tutto il resto (carta, timbri, adesivi) sta lì e nel CSS.
//   - il battito è un timer da un secondo, non un rAF a ogni fotogramma: la barra avanza lo stesso liscia, perché
//     il CSS la porta al valore nuovo con una transizione lineare di un secondo (lavora il compositore, non la
//     pagina; su uno schermo a 164 Hz erano 164 giri al secondo per niente). E i tempi sono quelli di Date.now():
//     prima alla barra arrivava il tempo di rAF (millisecondi dal caricamento) e restava ferma a 0:00.
//   - se il pc manda i numeri dell'uso (uso, ritorni, dal: vedi il brief, §8) valgono quelli; se no, la misura
//     nel browser di prima. Niente `title` sulle icone: il nome lo dà il cartellino (e lo span .sr a chi non vede).

export function creaAdesso(opzioni) {
  const o = opzioni
  const motion = () => !o.reduced && !document.hidden
  const el = (tag, cls, testo) => { const n = document.createElement(tag); if (cls) n.className = cls; if (testo != null) n.textContent = testo; return n }

  // stato condiviso
  let prec = { presenza: null, vetrina: null, pc: 'spento' }
  const zone = new Set()
  const zonaPerRoot = new WeakMap()

  // l'osservatorio dell'uso (nel browser, dal momento in cui la pagina è aperta):
  // per ogni app il tempo in primo piano, i ritorni, e da quanto non è più in primo piano
  const oss = new Map()
  let primo = 0, frontAttuale = null, frontDal = 0

  const statoPc = (v) => {
    if (!v) return 'spento'
    const t = Number(v.agg)
    if (!t) return 'spento'                 // il pc non ha mai scritto
    if (Date.now() - t > 180_000) return 'fermo'  // non scrive da 3 minuti
    return 'vivo'
  }

  function osservo(v) {
    const ora = Date.now()
    if (!primo) primo = ora
    const app = v?.app || []
    for (const a of app) if (!oss.has(a.n)) oss.set(a.n, { suDa: 0, ultimoSu: a.su ? ora : null, ritorni: 0 })
    const su = app.find((x) => x.su)
    const nSu = su?.n ?? null
    if (nSu === frontAttuale) return
    if (frontAttuale && frontDal) {
      const x = oss.get(frontAttuale) || { suDa: 0, ultimoSu: null, ritorni: 0 }
      x.suDa += ora - frontDal
      x.ultimoSu = ora   // smette di essere in primo piano adesso
      oss.set(frontAttuale, x)
    }
    frontAttuale = nSu
    frontDal = nSu ? ora : 0
    if (nSu) { const x = oss.get(nSu); x.ritorni++; x.ultimoSu = ora }
  }

  // (i numeri del pc, se ci sono: uso = secondi in primo piano nell'ultima ora, senza il turno in corso; dal = da
  // quando è in primo piano, in ms; ritorni = quante volte ci è passato nell'ultima ora)
  const ORA = 3600
  function usoDalPc(k) {
    const a = (o.vetrina()?.app || []).find((x) => x.n === k)
    if (!a || !Number.isFinite(a.uso)) return null
    const ora = Date.now()
    const turno = a.su && Number.isFinite(a.dal) ? Math.max(0, (ora - a.dal) / 1000) : 0
    const sec = a.uso + turno
    return { da: a.su ? Math.round(turno) : null, uso: Math.min(1, sec / ORA), sec: Math.round(sec), ritorni: a.ritorni || 0, fondo: !a.su && sec < 1, pc: true }
  }
  function usoDi(k) {
    const pc = usoDalPc(k)
    if (pc) return pc
    const x = oss.get(k)
    const ora = Date.now()
    const attivo = frontAttuale === k
    if (!x) return { da: null, uso: 0, ritorni: 0, fondo: true }
    const suDa = x.suDa + (attivo && frontDal ? ora - frontDal : 0)
    const finestra = Math.max(1000, ora - (primo || ora))
    return {
      da: attivo ? Math.round(suDa / 1000) : (x.ultimoSu ? Math.round((ora - x.ultimoSu) / 1000) : null),
      sec: Math.round(suDa / 1000),
      uso: Math.min(1, suDa / finestra),
      ritorni: x.ritorni,
      fondo: !x.ultimoSu && !attivo,
    }
  }

  // ── la barra (brano o gioco): avanza col solo transform, senza ridisegnare ──
  function creaBar(o) {
    const bar = el('div', 'bar-t')
    bar.hidden = true
    const fatto = el('span')
    const track = el('div', 'bar-t__track')
    const fill = el('div', 'bar-t__fill')
    track.appendChild(fill)
    const totale = el('span')
    bar.append(fatto, track, totale)
    let inizio = null
    return {
      el: bar, fatto, fill, totale,
      aggiorna(start, end, now, testo) {
        const total = Math.max(0, end - start)
        const done = Math.min(total, Math.max(0, now - start))
        // (la barra punta a dove sarà fra un secondo: ci arriva con la transizione lineare del CSS, e intanto è già
        // ora del battito dopo. Al primo giro e quando il brano ricomincia o cambia, ci va di colpo: data-salta)
        const salta = inizio === null || Math.abs(start - inizio) > 1500
        inizio = start
        const pct = total ? Math.min(total, done + (salta ? 0 : 1000)) / total : 0
        if (salta) bar.dataset.salta = ''
        bar.style.setProperty('--pct', pct.toFixed(4))
        bar.style.setProperty('--done', String(Math.round(done / 1000)))
        bar.style.setProperty('--total', String(Math.round(total / 1000)))
        fill.style.transform = `scaleX(${pct.toFixed(4)})`
        if (salta) { void bar.offsetWidth; delete bar.dataset.salta }
        if (testo) { fatto.textContent = o.clock(done); totale.textContent = o.clock(total) }
      },
    }
  }

  // ── le voci vive (un gioco di Discord o il brano di Spotify) ──
  function creaVoceMusica(o) {
    const act = el('div', 'act')
    const art = el('div', 'act__art')
    const imgEl = el('img'); imgEl.alt = ''; imgEl.draggable = false; imgEl.hidden = true
    const ph = el('span', 'act__ph'); ph.innerHTML = o.icone.spotify
    art.append(imgEl, ph)
    const lines = el('div', 'act__lines')
    const b = el('b')
    const aLink = el('a'); aLink.target = '_blank'; aLink.rel = 'noopener noreferrer'; b.appendChild(aLink)
    const artist = el('span', 'act__muted')
    const album = el('span', 'act__muted'); album.hidden = true
    lines.append(b, artist, album)
    act.append(art, lines)
    const bar = creaBar(o)
    return { act, bar, imgEl, ph, title: aLink, artist, album }
  }
  function creaVoceGioco(o) {
    const act = el('div', 'act')
    const art = el('div', 'act__art')
    const imgEl = el('img'); imgEl.alt = ''; imgEl.draggable = false; imgEl.hidden = true
    const smallEl = el('img', 'act__small'); smallEl.alt = ''; smallEl.hidden = true
    const ph = el('span', 'act__ph'); ph.innerHTML = o.icone.gameBig
    art.append(imgEl, smallEl, ph)
    const lines = el('div', 'act__lines')
    const title = el('b')
    const dettagli = el('span', 'act__muted'); dettagli.hidden = true
    const stato = el('span', 'act__muted'); stato.hidden = true
    const trascorso = el('span', 'act__muted'); trascorso.hidden = true
    lines.append(title, dettagli, stato, trascorso)
    act.append(art, lines)
    const bar = creaBar(o)
    return { act, bar, imgEl, smallEl, ph, title, dettagli, stato, trascorso }
  }
  function creaVoce(v, o) {
    const wrap = el('div', 'adesso__voce')
    wrap.dataset.voce = v.chiave
    const head = el('div', 'widget__h')
    head.innerHTML = v.tipo === 'musica' ? o.icone.spotify : o.icone.game
    const headLabel = el('span')
    head.appendChild(headLabel)
    wrap.appendChild(head)
    const body = v.tipo === 'musica' ? creaVoceMusica(o) : creaVoceGioco(o)
    wrap.appendChild(body.act)
    wrap.appendChild(body.bar.el)
    return { wrap, headLabel, ...body, barInfo: null, trascorsoInfo: null }
  }
  function aggiornaVoce(rec, v, o) {
    const T = o.testi()
    rec.headLabel.textContent = v.tipo === 'musica' ? T.listening : (T.act[v.a.type] || T.act[0])
    if (v.tipo === 'musica') {
      const m = v.m
      rec.title.textContent = m.titolo
      rec.title.href = `https://open.spotify.com/search/${encodeURIComponent(`${m.artista} ${m.titolo}`)}`
      rec.artist.textContent = `${T.by} ${m.artista}`
      rec.album.textContent = m.album ? `${T.on} ${m.album}` : ''
      rec.album.hidden = !m.album
      if (m.img) {
        rec.ph.hidden = true; rec.imgEl.hidden = false
        if (rec.imgEl.dataset.id !== m.img) { rec.imgEl.dataset.id = m.img; rec.imgEl.src = o.immagine(m.img) }
      } else { rec.imgEl.hidden = true; rec.ph.hidden = false }
      if (m.inizio && m.fine) { rec.bar.el.hidden = false; rec.barInfo = { start: m.inizio, end: m.fine } }
      else { rec.bar.el.hidden = true; rec.barInfo = null }
    } else {
      const a = v.a, ts = a.timestamps || {}
      rec.title.textContent = a.name
      rec.dettagli.textContent = a.details || ''; rec.dettagli.hidden = !a.details
      rec.stato.textContent = a.state || ''; rec.stato.hidden = !a.state
      rec.trascorsoInfo = (ts.start && !ts.end) ? { start: ts.start } : null
      rec.trascorso.hidden = !rec.trascorsoInfo
      if (rec.trascorsoInfo) rec.trascorso.textContent = `${o.clock(Date.now() - ts.start)} ${T.elapsed}`
      const big = o.asset(a, 'large_image'), small = o.asset(a, 'small_image')
      if (big) {
        rec.ph.hidden = true; rec.imgEl.hidden = false
        if (rec.imgEl.dataset.src !== big) { rec.imgEl.dataset.src = big; rec.imgEl.src = big }
      } else { rec.imgEl.hidden = true; rec.ph.hidden = false }
      if (small) { rec.smallEl.hidden = false; if (rec.smallEl.dataset.src !== small) { rec.smallEl.dataset.src = small; rec.smallEl.src = small } }
      else rec.smallEl.hidden = true
      if (ts.start && ts.end) { rec.bar.el.hidden = false; rec.barInfo = { start: ts.start, end: ts.end } }
      else { rec.bar.el.hidden = true; rec.barInfo = null }
    }
  }
  function conciliaVoci(z, voci, soloPrima, o, anima = true) {
    const box = z.refs.items
    const lista = soloPrima ? voci.slice(0, 1) : voci
    const presenti = new Set(lista.map((v) => v.chiave))
    const m = motion() && anima
    for (const [k, rec] of [...z.voci]) if (!presenti.has(k)) {
      z.voci.delete(k)
      if (m) { rec.wrap.classList.add('is-esce'); setTimeout(() => rec.wrap.remove(), 220) }
      else rec.wrap.remove()
    }
    const entra = []
    lista.forEach((v) => {
      let rec = z.voci.get(v.chiave)
      if (!rec) {
        rec = creaVoce(v, o)
        z.voci.set(v.chiave, rec)
        if (m) { rec.wrap.classList.add('is-entra'); entra.push(rec.wrap) }
      }
      aggiornaVoce(rec, v, o)
      box.appendChild(rec.wrap)   // ordina (giochi prima, poi musica)
    })
    if (m) for (const w of entra) {
      void w.offsetWidth
      w.classList.add('is-entra-on')
      const fine = () => w.classList.remove('is-entra', 'is-entra-on')
      w.addEventListener('transitionend', fine, { once: true })
      setTimeout(fine, 320)   // (Claude: se il vestito non fa una transizione, le classi restavano per sempre)
    }
  }

  // ── la fila delle app aperte: nodi a chiave e FLIP per i cambi di posizione ──
  function creaApp(x, o) {
    const li = el('li', 'pcapp__i')
    li.tabIndex = 0
    li.setAttribute('role', 'listitem')
    li.dataset.app = x.n
    iconaApp(li, x, o)
    li.appendChild(el('span', 'sr'))
    return li
  }
  function iconaApp(li, x, o) {
    const cur = li.firstElementChild
    const curImg = cur?.tagName === 'IMG'
    // (Claude: senza `cur &&` un'app senza icona non riceveva mai la sua iniziale: il primo giro usciva subito)
    if (cur && curImg === !!x.i && (!x.i || cur.dataset.icon === x.i)) return
    if (cur) cur.remove()
    let node
    if (x.i) {
      node = el('img'); node.dataset.icon = x.i; node.src = o.immagine(x.i); node.alt = ''
      node.width = 32; node.height = 32; node.draggable = false; node.loading = 'lazy'
    } else {
      node = el('b'); node.setAttribute('aria-hidden', 'true'); node.textContent = (x.n || '?').slice(0, 1)
    }
    li.insertBefore(node, li.firstElementChild)
  }
  function aggiornaApp(li, x, idx, o) {
    iconaApp(li, x, o)
    li.dataset.i = idx
    li.classList.toggle('is-su', !!x.su)
    const sr = li.querySelector('.sr')
    if (sr) sr.textContent = x.su ? `${x.n} · ${o.testi().su}` : x.n
    const u = usoDi(x.n)
    li.style.setProperty('--uso', u.uso.toFixed(3))
    li.style.setProperty('--ritorni', String(u.ritorni))
    li.style.setProperty('--da', u.da == null ? '' : String(u.da))
    li.classList.toggle('is-fondo', u.fondo)
  }
  function conciliaApps(riga, nuove, o, anima = true) {
    const presenti = new Set(nuove.map((x) => x.n))
    const attuali = new Map()
    for (const li of [...riga.children]) if (li.dataset.app) attuali.set(li.dataset.app, li)

    const m = motion() && anima
    const prima = m ? new Map([...riga.children].map((li) => [li, li.getBoundingClientRect()])) : null

    // le uscite: tenute al loro posto (assolute) mentre sfumano, così le altre scorrono sotto
    for (const [k, li] of attuali) if (!presenti.has(k)) {
      attuali.delete(k)
      if (m) {
        const box = riga.getBoundingClientRect()
        const r = li.getBoundingClientRect()
        li.style.position = 'absolute'
        li.style.left = `${r.left - box.left}px`
        li.style.top = `${r.top - box.top}px`
        li.style.width = `${r.width}px`
        li.style.height = `${r.height}px`
        li.style.margin = '0'
        li.classList.add('is-esce')
        li.dataset.app = ''
        setTimeout(() => li.remove(), 220)
      } else li.remove()
    }

    const entra = []
    nuove.forEach((x, idx) => {
      let li = attuali.get(x.n)
      if (!li) {
        li = creaApp(x, o)
        attuali.set(x.n, li)
        if (m) { li.classList.add('is-entra'); entra.push(li) }
      }
      aggiornaApp(li, x, idx, o)
      riga.appendChild(li)   // sposta in ordine di Alt+Tab (la più recente per prima)
    })

    if (m) {
      // FLIP: chi si è spostato riparte dalla posizione vecchia e scivola nella nuova
      for (const li of [...riga.children]) {
        if (!li.dataset.app) continue
        const p = prima.get(li)
        if (!p) continue
        const n = li.getBoundingClientRect()
        const dx = p.left - n.left, dy = p.top - n.top
        if (dx || dy) {
          li.style.setProperty('--dx', `${dx}px`)
          li.style.setProperty('--dy', `${dy}px`)
          li.classList.add('is-flip')
          void li.offsetWidth
          li.classList.add('is-flip-on')
          const fine = () => { li.classList.remove('is-flip', 'is-flip-on'); li.style.removeProperty('--dx'); li.style.removeProperty('--dy') }
          li.addEventListener('transitionend', fine, { once: true })
          setTimeout(fine, 320)
        }
      }
      for (const li of entra) {
        void li.offsetWidth
        li.classList.add('is-entra-on')
        const fine = () => li.classList.remove('is-entra', 'is-entra-on')
        li.addEventListener('transitionend', fine, { once: true })
        setTimeout(fine, 320)
      }
    }
  }

  // ── le voci e i dispositivi ──
  function calcolaVoci(presenza, vetrina) {
    const out = []
    for (const a of presenza?.activities || []) if ([0, 1, 3, 5].includes(a.type)) out.push({ tipo: 'gioco', chiave: `g:${a.id || ''}:${a.name}:${a.type}`, a })
    const m = vetrina?.musica
    if (m) out.push({ tipo: 'musica', chiave: 'm', m })
    return out
  }
  function aggiornaDevices(z, presenza, T, o) {
    const d = []
    if (presenza?.active_on_discord_desktop) d.push(['desktop', T.devices.desktop])
    if (presenza?.active_on_discord_web) d.push(['web', T.devices.web])
    if (presenza?.active_on_discord_mobile) d.push(['mobile', T.devices.mobile])
    const chiave = d.map((x) => x[0]).join('|')
    if (chiave === z.devKey) return
    z.devKey = chiave
    const box = z.refs.devices
    box.replaceChildren()
    if (!d.length) { box.hidden = true; return }
    box.hidden = false
    box.append(document.createTextNode(`${T.activeOn} `))
    for (const [k, lab] of d) {
      const span = el('span', 'role')
      span.innerHTML = o.icone.device[k] || ''
      span.append(document.createTextNode(lab))
      span.dataset.device = k
      box.append(span)
    }
  }

  // ── la zona (un riquadro montato) ──
  function creaZona(root, tipo) {
    root.dataset.adesso = tipo === 'widget' ? '1' : 'card'
    root.setAttribute('data-motion', o.reduced ? 'off' : 'on')
    const z = { root, tipo, voci: new Map(), refs: {}, T: o.testi(), devKey: null }
    if (tipo === 'widget') {
      const h = el('div', 'widget__h'); const hNow = el('span'); const hLive = el('span', 'right live'); h.append(hNow, hLive)
      const sl = el('div', 'status-line'); const dot = el('span', 'status-dot'); const sLabel = el('span'); const luogo = el('span', 'luogo'); luogo.hidden = true; sl.append(dot, sLabel, luogo)
      const vuoto = el('p', 'act__muted'); vuoto.hidden = true
      const items = el('div')
      const pcapp = el('div', 'pcapp'); pcapp.hidden = true
      const ph = el('div', 'widget__h'); ph.innerHTML = o.icone.desktop; const phLabel = el('span'); const phN = el('span', 'right live'); ph.append(phLabel, phN)
      const riga = el('ul', 'pcapp__row'); riga.setAttribute('role', 'list')
      const devices = el('div', 'devices'); devices.hidden = true
      pcapp.append(ph, riga)
      root.append(h, sl, vuoto, items, pcapp, devices)
      z.refs = { hNow, hLive, dot, sLabel, luogo, vuoto, items, pcapp, riga, phLabel, phN, devices }
    } else {
      const items = el('div')
      root.append(items)
      z.refs = { items }
    }
    z.aggiorna = () => aggiornaZona(z)
    z.tick = (now, sec) => tickZona(z, now, sec)
    if (tipo === 'widget') o.arte?.zona(z)
    return z
  }
  function aggiornaZona(z) {
    const T = o.testi(); z.T = T
    const presenza = o.presenza()
    const vetrina = o.vetrina()
    if (z.tipo === 'widget') {
      z.refs.hNow.textContent = T.now
      z.refs.hLive.textContent = T.live
      const st = presenza?.discord_status || 'offline'
      z.refs.dot.style.background = o.coloreStato(st)
      z.refs.sLabel.textContent = T.status[st] || st
      z.root.dataset.stato = st
      z.root.dataset.pc = statoPc(vetrina)
      const luogo = vetrina?.luogo
      z.refs.luogo.replaceChildren()
      if (luogo) {
        z.refs.luogo.hidden = false
        z.refs.luogo.dataset.luogo = luogo
        z.refs.luogo.insertAdjacentHTML('beforeend', o.icone.luogo[luogo] || '')
        z.refs.luogo.append(document.createTextNode(T.luogo[luogo] || ''))
      } else { z.refs.luogo.hidden = true; delete z.refs.luogo.dataset.luogo }
    }
    const voci = calcolaVoci(presenza, vetrina)
    // (Claude: la prima volta che una zona ha i dati li disegna fermi, come dice il brief al §9.1: prima, a ogni
    // ritorno sulla bacheca, tutte le icone rientravano da capo)
    const anima = !!z.vista
    conciliaVoci(z, voci, z.tipo === 'card', o, anima)
    if (z.tipo === 'widget') {
      const apps = vetrina?.app || []
      const haApp = apps.length > 0
      z.refs.pcapp.hidden = !haApp
      z.refs.vuoto.hidden = !(voci.length === 0 && !haApp)
      if (!z.refs.vuoto.hidden) z.refs.vuoto.textContent = T.nothing
      z.root.toggleAttribute('data-vuoto', voci.length === 0 && !haApp)
      if (haApp) {
        z.refs.phLabel.textContent = T.app
        z.refs.phN.textContent = String(apps.length)
        z.refs.riga.setAttribute('aria-label', T.app)
        conciliaApps(z.refs.riga, apps, o, anima)
      } else {
        for (const li of [...z.refs.riga.children]) {
          if (motion()) { li.classList.add('is-esce'); setTimeout(() => li.remove(), 220) } else li.remove()
        }
      }
      aggiornaDevices(z, presenza, T, o)
      o.arte?.aggiorna(z, { presenza, vetrina, voci, uso: usoDi, pc: z.root.dataset.pc })
    }
    z.vista = !!(vetrina || presenza)
  }
  function tickZona(z, now, sec) {
    for (const rec of z.voci.values()) {
      if (rec.barInfo) rec.bar.aggiorna(rec.barInfo.start, rec.barInfo.end, now, sec)
      if (rec.trascorsoInfo) {
        if (sec) rec.trascorso.textContent = `${o.clock(now - rec.trascorsoInfo.start)} ${z.T.elapsed}`
        rec.trascorso.hidden = false
      }
    }
    if (sec && z.refs.riga) {
      for (const li of z.refs.riga.children) {
        const k = li.dataset.app
        if (!k) continue
        const u = usoDi(k)
        li.style.setProperty('--uso', u.uso.toFixed(3))
        li.style.setProperty('--ritorni', String(u.ritorni))
        li.style.setProperty('--da', u.da == null ? '' : String(u.da))
        li.classList.toggle('is-fondo', u.fondo)
      }
    }
    if (sec && z.tipo === 'widget') o.arte?.tick(z)
  }

  // ── il battito: un solo timer da un secondo per tutte le zone, solo quando serve (la barra avanza liscia lo
  // stesso: la porta il CSS, con una transizione lineare lunga quanto il battito) ──
  let raf = 0
  function battito() {
    if (document.hidden) { clearInterval(raf); raf = 0; return }
    const now = Date.now()
    for (const z of zone) if (z.root.isConnected) z.tick(now, true)
  }
  function agenda() {
    let serve = false
    for (const z of zone) {
      if (!z.root.isConnected) continue
      if (z.refs.riga?.children.length) { serve = true; break }
      for (const rec of z.voci.values()) if (rec.barInfo || rec.trascorsoInfo) { serve = true; break }
    }
    if (serve && !raf && !document.hidden) { raf = setInterval(battito, 1000); battito() }
    else if (!serve && raf) { clearInterval(raf); raf = 0 }
  }

  // ── i cambi, per l'evento adesso:cambio ──
  function diffCambi(p, presenza, vetrina) {
    const c = []
    const ps = p.presenza?.discord_status || 'offline'
    const ns = presenza?.discord_status || 'offline'
    if (ps !== ns) c.push({ tipo: 'stato', da: ps, a: ns })
    const pl = p.vetrina?.luogo, nl = vetrina?.luogo
    if (nl && nl !== pl) c.push({ tipo: 'luogo', da: pl || null, a: nl })
    const pm = p.vetrina?.musica, nm = vetrina?.musica
    const pt = pm?.titolo || null, nt = nm?.titolo || null
    if (nt && nt !== pt) c.push({ tipo: 'musica', da: pt ? { titolo: pt, artista: pm.artista, album: pm.album } : null, a: { titolo: nt, artista: nm.artista, album: nm.album } })
    else if (pt && !nt) c.push({ tipo: 'musica-stop', da: { titolo: pt } })
    const papps = new Set((p.vetrina?.app || []).map((x) => x.n))
    const napps = new Set((vetrina?.app || []).map((x) => x.n))
    for (const n of napps) if (!papps.has(n)) c.push({ tipo: 'app-entra', a: n })
    for (const a of papps) if (!napps.has(a)) c.push({ tipo: 'app-esce', da: a })
    const psu = (p.vetrina?.app || []).find((x) => x.su)?.n ?? null
    const nsu = (vetrina?.app || []).find((x) => x.su)?.n ?? null
    if (psu !== nsu) c.push({ tipo: 'app-su', da: psu, a: nsu })
    const ppc = p.pc, npc = statoPc(vetrina)
    if (ppc !== npc) c.push({ tipo: 'pc', da: ppc, a: npc })
    return c
  }
  function avvisa(cambi) {
    for (const z of zone) if (z.root.isConnected) for (const c of cambi) z.root.dispatchEvent(new CustomEvent('adesso:cambio', { detail: c, bubbles: true }))
  }

  // ── l'aggiornamento ──
  function aggiorna() {
    for (const z of [...zone]) if (!z.root.isConnected) { zone.delete(z); zonaPerRoot.delete(z.root) }
    const presenza = o.presenza()
    const vetrina = o.vetrina()
    const cambi = diffCambi(prec, presenza, vetrina)
    prec = { presenza, vetrina, pc: statoPc(vetrina) }
    osservo(vetrina)
    const ora = Date.now()
    for (const z of zone) if (z.root.isConnected) { z.aggiorna(); z.tick(ora, true) }  // (il tick subito: un brano nuovo non aspetta il battito per avere la sua barra)
    if (cambi.length) avvisa(cambi)
    agenda()
  }
  function zonaDi(root, tipo) {
    let z = zonaPerRoot.get(root)
    if (!z) { z = creaZona(root, tipo); zonaPerRoot.set(root, z); zone.add(z) }
    return z
  }
  const widget = (root) => { zonaDi(root, 'widget'); aggiorna() }
  const card = (root) => { zonaDi(root, 'card'); aggiorna() }
  function distruggi() { if (raf) clearInterval(raf); raf = 0; zone.clear() }

  // la scheda tornata visibile: riallinea (la vetrina si ricollega da sé)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) aggiorna() })

  return { widget, card, aggiorna, distruggi }
}
