// public/assets/scheda-attivita.js
// Il riquadro attività della scheda profilo (#card-activity), vivo (26.11.2026). pzkko: «fai questa zona stra animata e
// stra nel mio stile, animazione per cambio app, switch e transizione in base all'utilizzo».
//
// La UX è di DeepSeek (design/attivita-scheda-ux-deepseek.md): è il segnalatore sempre in vista, una cosa sola alla volta.
// In ordine: l'attività di Discord (gioco, diretta…), l'app in primo piano sul pc, il brano, e se non c'è niente lo stato.
// Quando la musica è di sottofondo sta su un nastro sotto. Il riquadro non sparisce mai. Un'app deve restare davanti
// 1,8 secondi prima di prendere il posto e chi l'ha preso lo tiene almeno 3; tre ritmi: app mai vista (annuncio pieno,
// solo le prime tre della sessione), app già vista (scambio svelto), stessa cosa da otto minuti (si calma).
// La grafica è di Claude Code: un foglietto del muro attaccato alla scheda col nastro di carta, la copertina nella busta
// col vinile che gira, il titolo in Anton evidenziato, la barra a matita ripassata a pennarello, l'icona vera dell'app
// su un bollo adesivo col giro rosso di quanto la usa e le tacche di quante volte ci torna. Lo stile sta in
// src/scheda-attivita.css. Niente librerie. adesso.js e vetrina.js non si toccano.
import { ascolta } from './vetrina.js'

// ── i tempi (dalla specifica UX) ──
const ATTESA = 1800 // un'app deve restare in primo piano tanto, prima di prendere il posto
const RESTA = 3000 // chi ha preso il posto lo tiene almeno tanto, nei cambi da un'app all'altra
const GUARDIA = 300 // i cambi veri (parte un gioco, parte o si ferma la musica, il pc si spegne) aspettano solo questo
const CALMA = 8 * 60_000 // dopo quanto la stessa cosa smette di agitarsi
const NOVITA = 3 // quanti annunci pieni per sessione: poi solo scambi svelti
const ESCE = 240 // quanto resta il foglietto che se ne va
const VECCHIO = 180_000 // il pc non scrive da tre minuti: quello che diceva non vale più

// le app che suonano: se una di queste è davanti e c'è un brano, il posto è del brano
const SUONA = /spotify|apple music|itunes|\bvlc\b|foobar|tidal|deezer|youtube music|amazon music/i

// le scritte che i file delle lingue non hanno (come la vetrina e la community: stanno qui)
const TX = {
  it: { pc: 'Al pc', da: 'da {n} min' },
  en: { pc: 'At the PC', da: 'for {n} min' },
  es: { pc: 'En el PC', da: 'desde hace {n} min' },
  fr: { pc: 'Au PC', da: 'depuis {n} min' },
  de: { pc: 'Am PC', da: 'seit {n} Min.' },
  pt: { pc: 'No PC', da: 'há {n} min' },
  ru: { pc: 'За ПК', da: 'уже {n} мин' },
  ja: { pc: 'PCで', da: '{n}分前から' },
  zh: { pc: '在电脑前', da: '已 {n} 分钟' },
}

// i segni fatti a mano (decorativi)
const RIGA = 'M1 4.5c14-2.4 26 1.800 40 .2s28-2 42-.4 30 1.600 44 .2 30-1.800 44-.6 18 .9 28 .4'
const FRECCIA = '<svg class="ca__freccia" viewBox="0 0 26 16" aria-hidden="true"><path d="M2 3c1 6 6 9 18 8M15 6l6 5-7 3"/></svg>'
const GIRO = '<svg class="ca__giro" viewBox="0 0 80 80" aria-hidden="true"><path pathLength="100" d="M40 3.500c10.500-.4 20 3.800 26.500 11.500 6 7.200 9 16.600 7.700 26-1.300 9.800-6.600 18.600-14.700 24.200-7.800 5.400-17.600 7.400-26.900 5.300C22.800 68.400 14.200 62.300 9 53.800 4 45.600 2.400 35.600 5 26.300c2.400-8.700 8.200-16.100 16-20.500 5.800-3.300 12.500-4.500 19-2.300"/></svg>'
const TACCHE = '<svg class="ca__tacche" viewBox="0 0 34 18" aria-hidden="true"><path pathLength="1" d="M4 2.500c.6 4.500.2 9-.4 13.500"/><path pathLength="1" d="M11 2c.5 4.600.3 9.400-.3 14"/><path pathLength="1" d="M18 2.500c.7 4.400.1 9.100-.5 13.500"/><path pathLength="1" d="M25 2c.4 4.700.4 9.300-.2 14"/><path pathLength="1" d="M1 13.500c10-2 20-5.500 31-10.500"/></svg>'

export function creaScheda(opzioni) {
  const o = opzioni
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)')
  const el = (tag, cls, testo) => { const n = document.createElement(tag); if (cls) n.className = cls; if (testo != null) n.textContent = testo; return n }
  const tx = () => TX[o.lingua?.()] || TX.en
  const fermo = () => ridotto.matches || !!o.reduced

  // ── lo stato del modulo: resta anche se la scheda viene ridisegnata (cambio di lingua, di presenza) ──
  let radice = null, refs = null
  let scena = null // quello che si vede: { tipo, chiave, base, dal, … }
  let voce = null // il foglietto montato: { el, tipo, chiave, aggiorna(c), tic(ora) }
  let pendente = null, timer = 0, calma = 0, orologio = 0, giro = 0
  let discNoto = false, prove = 0

  // la memoria della sessione: quali cose sono già state annunciate, e quanti annunci pieni sono già usciti
  const memoria = (() => { try { return JSON.parse(sessionStorage.getItem('pzkko-ca') || 'null') || {} } catch { return {} } })()
  const viste = new Set(memoria.viste || [])
  let novita = +memoria.novita || 0
  const ricorda = () => { try { sessionStorage.setItem('pzkko-ca', JSON.stringify({ viste: [...viste].slice(-40), novita })) } catch {} }

  // ── l'osservatorio dell'uso, nel browser, da quando la pagina è aperta: per ogni app quanto è stata davanti,
  //    quante volte ci è tornato, da quando è davanti adesso (se un giorno il pc lo dirà lui, si parte da lì) ──
  const oss = new Map()
  let primo = 0, davanti = null, davantiDal = 0
  function osservo(su) {
    const ora = Date.now()
    if (!primo) primo = ora
    const n = su?.n ?? null
    if (n === davanti) return
    if (davanti && davantiDal) { const x = oss.get(davanti); if (x) x.tempo += ora - davantiDal }
    davanti = n
    davantiDal = n ? ora : 0
    if (n) { const x = oss.get(n) || { tempo: 0, ritorni: 0 }; x.ritorni++; oss.set(n, x) }
  }
  function usoDi(n) {
    const x = oss.get(n)
    if (!x) return { da: 0, uso: 0, ritorni: 0 }
    const ora = Date.now(), ora2 = davanti === n && davantiDal ? ora - davantiDal : 0
    return { da: Math.round(ora2 / 1000), uso: Math.min(1, (x.tempo + ora2) / Math.max(20_000, ora - primo)), ritorni: Math.max(0, x.ritorni - 1) }
  }

  const statoPc = (v) => { const t = Number(v?.agg); return !t ? 'spento' : Date.now() - t > VECCHIO ? 'fermo' : 'vivo' }
  const stato = () => o.presenza()?.discord_status || (discNoto ? 'offline' : '')

  /** Quello che i dati di adesso chiedono di mostrare (vince il primo: gioco, app davanti, brano, riposo). */
  function candidato() {
    const p = o.presenza(), v = o.vetrina(), pc = statoPc(v), vivo = pc === 'vivo'
    const a = (p?.activities || []).find((x) => [0, 1, 3, 5].includes(x.type)) || null
    const su = vivo ? (v.app || []).find((x) => x.su) || null : null
    const m = vivo ? v.musica || null : null
    const base = { gioco: a ? `${a.name}:${a.type}` : '', musica: !!m, pc }
    if (a) return { tipo: 'gioco', chiave: `g:${a.id || ''}:${a.name}:${a.type}`, a, m, base }
    if (su && !(m && SUONA.test(su.n))) return { tipo: 'app', chiave: `a:${su.n}`, app: su, m, base }
    if (m) return { tipo: 'musica', chiave: 'm', m, base }
    return { tipo: 'riposo', chiave: 'r', m: null, base }
  }
  const sottofondo = (c) => (c.tipo === 'gioco' || c.tipo === 'app') && c.m ? c.m : null

  // ── i pezzi comuni dei foglietti ──
  function foglio(tipo, etichetta, icona) {
    const f = el('article', `ca__foglio ca__${tipo}`)
    f.dataset.slot = tipo
    f.style.setProperty('--r', `${[-1.2, 0.9, -0.7, 1.3][giro++ % 4]}deg`)
    const carta = el('span', 'ca__carta'); carta.setAttribute('aria-hidden', 'true')
    const scotch = el('span', 'ca__scotch'); scotch.setAttribute('aria-hidden', 'true')
    const capo = el('header', 'ca__capo')
    const ico = el('span', 'ca__ico'); ico.setAttribute('aria-hidden', 'true'); ico.innerHTML = icona || ''
    const eti = el('span', 'ca__etichetta', etichetta)
    const timbro = el('span', 'ca__timbro'); timbro.setAttribute('aria-hidden', 'true'); timbro.append(el('i'), document.createTextNode(o.testi().live))
    capo.append(ico, eti, timbro)
    const corpo = el('div', 'ca__corpo')
    f.append(carta, scotch, capo, corpo)
    return { f, corpo, eti, timbro }
  }
  /** La barra: una riga a matita, ripassata a pennarello fin dove è arrivato. Avanza col solo transform. */
  function barra() {
    const b = el('div', 'ca__barra')
    b.hidden = true
    const svg = `<svg viewBox="0 0 200 8" preserveAspectRatio="none"><path d="${RIGA}"/></svg>`
    const fatto = el('span', 'ca__t'), tot = el('span', 'ca__t')
    const solco = el('span', 'ca__solco'); solco.setAttribute('aria-hidden', 'true')
    solco.innerHTML = `${svg}<span class="ca__fatto"><span>${svg}</span></span><span class="ca__testina"><i></i></span>`
    b.append(fatto, solco, tot)
    let info = null, ultimo = ''
    return {
      el: b,
      metti(inizio, fine) {
        const k = inizio && fine && fine > inizio ? `${inizio}:${fine}` : ''
        if (k === ultimo) return
        ultimo = k
        info = k ? { inizio, fine } : null
        b.hidden = !info
        if (!info) return
        // un brano nuovo: la barra salta al punto giusto senza scivolarci
        b.classList.add('is-salto')
        this.tic(Date.now())
        void b.offsetWidth
        b.classList.remove('is-salto')
      },
      tic(ora) {
        if (!info) return
        const totale = info.fine - info.inizio, giaFatto = Math.min(totale, Math.max(0, ora - info.inizio))
        b.style.setProperty('--pct', (giaFatto / totale).toFixed(4))
        b.style.setProperty('--done', String(Math.round(giaFatto / 1000)))
        b.style.setProperty('--total', String(Math.round(totale / 1000)))
        fatto.textContent = o.clock(giaFatto)
        tot.textContent = o.clock(totale)
      },
      get viva() { return !!info },
    }
  }
  function figura(img, ph, src) {
    if (src) {
      ph.hidden = true; img.hidden = false
      if (img.dataset.src !== src) { img.dataset.src = src; img.src = src }
    } else { img.hidden = true; ph.hidden = false; delete img.dataset.src; img.removeAttribute('src') }
  }
  const nuovaImg = (cls) => { const i = el('img', cls); i.alt = ''; i.draggable = false; i.decoding = 'async'; i.hidden = true; i.addEventListener('error', () => { i.hidden = true; if (i.nextElementSibling?.classList.contains('ca__ph')) i.nextElementSibling.hidden = false }); return i }
  const cerca = (m) => `https://open.spotify.com/search/${encodeURIComponent(`${m.artista} ${m.titolo}`)}`

  // ── i quattro foglietti ──
  function voceMusica() {
    const T = o.testi()
    const { f, corpo, eti } = foglio('musica', T.listening, o.icone.spotify)
    const disco = el('div', 'ca__disco'); disco.setAttribute('aria-hidden', 'true')
    const vinile = el('span', 'ca__vinile'), centro = el('i'); vinile.append(centro)
    const busta = el('span', 'ca__busta'), img = nuovaImg(''), ph = el('span', 'ca__ph'); ph.innerHTML = o.icone.spotify
    busta.append(img, ph); disco.append(vinile, busta)
    const righe = el('div', 'ca__righe')
    const titolo = el('a', 'ca__titolo'); titolo.target = '_blank'; titolo.rel = 'noopener noreferrer'
    const hl = el('span', 'ca__hl'); titolo.append(hl)
    const artista = el('span', 'ca__sotto'), album = el('span', 'ca__sotto ca__sotto--due')
    righe.append(titolo, artista, album)
    const eq = el('span', 'ca__eq'); eq.setAttribute('aria-hidden', 'true'); eq.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'
    corpo.append(disco, righe, eq)
    const bar = barra()
    f.append(bar.el)
    let brano = null, cambio = 0, inCambio = false, prossimo = null
    const scrivi = (m) => {
      const T = o.testi()
      hl.textContent = m.titolo
      titolo.href = cerca(m)
      titolo.title = m.titolo
      artista.textContent = `${T.by} ${m.artista}`
      album.textContent = m.album ? `${T.on} ${m.album}` : ''
      album.hidden = !m.album
      const src = m.img ? o.immagine(m.img) : ''
      figura(img, ph, src)
      centro.style.backgroundImage = src ? `url("${src}")` : ''
      bar.metti(m.inizio, m.fine)
    }
    return {
      el: f, tipo: 'musica',
      aggiorna(c) {
        const m = c.m, k = `${m.titolo}
${m.artista}`
        eti.textContent = o.testi().listening
        // (lo stesso brano mentre la busta si sta girando: si lascia finire il giro, con i dati più freschi)
        if (inCambio && brano === k) { prossimo = m; return }
        clearTimeout(cambio); inCambio = false
        if (brano === null || brano === k || fermo() || document.hidden) { brano = k; f.classList.remove('is-brano'); scrivi(m); return }
        // il brano è cambiato: il vinile rientra, la busta si gira, e a metà del giro c'è già quello nuovo
        brano = k; prossimo = m; inCambio = true
        f.classList.remove('is-brano'); void f.offsetWidth; f.classList.add('is-brano')
        cambio = setTimeout(() => { scrivi(prossimo); cambio = setTimeout(() => { inCambio = false; f.classList.remove('is-brano') }, 310) }, 150)
      },
      tic(ora) { bar.tic(ora) },
      get vivo() { return bar.viva },
    }
  }
  function voceApp(c) {
    const { f, corpo, eti } = foglio('app', tx().pc, o.icone.desktop)
    f.dataset.app = c.app.n
    const bollo = el('span', 'ca__bollo'); bollo.setAttribute('aria-hidden', 'true')
    const dentro = el('span', 'ca__bollo-in')
    bollo.innerHTML = `${GIRO}<span class="ca__botta"><i></i><i></i><i></i><i></i><i></i></span>`
    bollo.append(dentro)
    const righe = el('div', 'ca__righe')
    const titolo = el('b', 'ca__titolo'), hl = el('span', 'ca__hl'); titolo.append(hl)
    const penna = el('span', 'ca__penna'); penna.innerHTML = FRECCIA
    const su = el('span'), da = el('span', 'ca__da')
    penna.append(su, da)
    penna.insertAdjacentHTML('beforeend', TACCHE)
    righe.append(titolo, penna)
    corpo.append(bollo, righe)
    let icona = null
    const numeri = () => {
      const u = usoDi(c.app.n), min = Math.floor(u.da / 60)
      f.style.setProperty('--uso', u.uso.toFixed(3))
      f.style.setProperty('--giro', (u.uso * 100).toFixed(1))
      f.style.setProperty('--da', String(u.da))
      f.style.setProperty('--ritorni', String(u.ritorni))
      f.dataset.tacche = String(Math.min(5, u.ritorni))
      da.textContent = min >= 1 ? ` · ${tx().da.replace('{n}', min)}` : ''
      f.title = min >= 1 ? `${c.app.n} · ${o.testi().su} ${tx().da.replace('{n}', min)}` : `${c.app.n} · ${o.testi().su}`
    }
    return {
      el: f, tipo: 'app', vivo: true,
      aggiorna(n) {
        c = n
        eti.textContent = tx().pc
        hl.textContent = c.app.n
        su.textContent = o.testi().su
        if (icona !== (c.app.i || '')) {
          icona = c.app.i || ''
          dentro.replaceChildren()
          const lettera = () => dentro.replaceChildren(el('b', '', (c.app.n || '?').slice(0, 1)))
          if (icona) { const i = el('img'); i.alt = ''; i.draggable = false; i.width = 44; i.height = 44; i.addEventListener('error', lettera); i.src = o.immagine(icona); dentro.append(i) }
          else lettera()
        }
        numeri()
      },
      tic: numeri,
    }
  }
  function voceGioco() {
    const { f, corpo, eti } = foglio('gioco', '', o.icone.game)
    const foto = el('span', 'ca__foto'); foto.setAttribute('aria-hidden', 'true')
    const img = nuovaImg(''), ph = el('span', 'ca__ph'); ph.innerHTML = o.icone.gameBig
    const mini = nuovaImg('ca__mini')
    foto.append(img, ph, mini)
    const righe = el('div', 'ca__righe')
    const titolo = el('b', 'ca__titolo'), hl = el('span', 'ca__hl'); titolo.append(hl)
    const dettagli = el('span', 'ca__sotto'), cosa = el('span', 'ca__sotto ca__sotto--due'), tempo = el('span', 'ca__tempo')
    righe.append(titolo, dettagli, cosa, tempo)
    corpo.append(foto, righe)
    const bar = barra()
    f.append(bar.el)
    let da = 0
    return {
      el: f, tipo: 'gioco',
      aggiorna(c) {
        const a = c.a, ts = a.timestamps || {}, T = o.testi()
        eti.textContent = T.act[a.type] || T.act[0]
        hl.textContent = a.name
        titolo.title = a.name
        dettagli.textContent = a.details || ''; dettagli.hidden = !a.details
        cosa.textContent = a.state || ''; cosa.hidden = !a.state
        figura(img, ph, o.asset(a, 'large_image') || '')
        const piccola = o.asset(a, 'small_image')
        mini.hidden = !piccola
        if (piccola && mini.dataset.src !== piccola) { mini.dataset.src = piccola; mini.src = piccola }
        da = ts.start && !ts.end ? ts.start : 0
        tempo.hidden = !da
        bar.metti(ts.start && ts.end ? ts.start : 0, ts.end || 0)
        f.toggleAttribute('data-barra', bar.viva)
        this.tic(Date.now())
      },
      tic(ora) { bar.tic(ora); if (da) tempo.textContent = `${o.clock(ora - da)} ${o.testi().elapsed}` },
      get vivo() { return bar.viva || !!da },
    }
  }
  function voceRiposo() {
    const f = el('div', 'ca__foglio ca__riposo')
    f.dataset.slot = 'riposo'
    f.style.setProperty('--r', `${[0.8, -0.9][giro++ % 2]}deg`)
    const carta = el('span', 'ca__carta'); carta.setAttribute('aria-hidden', 'true')
    const scotch = el('span', 'ca__scotch'); scotch.setAttribute('aria-hidden', 'true')
    const punto = el('span', 'ca__punto')
    const parola = el('b', 'ca__parola'), hl = el('span', 'ca__hl'); parola.append(hl)
    const zzz = el('span', 'ca__zzz'); zzz.setAttribute('aria-hidden', 'true'); zzz.innerHTML = '<i>z</i><i>z</i><i>z</i>'
    f.append(carta, scotch, punto, parola, zzz)
    let prima = null
    return {
      el: f, tipo: 'riposo',
      aggiorna() {
        const st = stato()
        // lo stato è cambiato sotto gli occhi: l'evidenziatore ripassa la parola
        if (prima !== null && prima !== st && !fermo() && !document.hidden) { f.classList.remove('is-stato'); void f.offsetWidth; f.classList.add('is-stato') }
        prima = st
        f.dataset.stato = st
        punto.style.background = st ? o.coloreStato(st) : ''
        hl.textContent = st ? (o.testi().status[st] || st) : ''
      },
      tic() {},
    }
  }
  const crea = (c) => (c.tipo === 'musica' ? voceMusica() : c.tipo === 'app' ? voceApp(c) : c.tipo === 'gioco' ? voceGioco() : voceRiposo())

  // ── il nastro col brano, quando la musica è di sottofondo ──
  let branoNastro = ''
  function nastro(c, subito) {
    const a = refs.nastro, m = sottofondo(c)
    radice.toggleAttribute('data-nastro', !!m)
    a.inert = !m
    a.setAttribute('aria-hidden', m ? 'false' : 'true')
    if (!m) { branoNastro = ''; return }
    const k = `${m.titolo}\n${m.artista}`
    a.href = cerca(m)
    a.title = `${m.titolo} · ${m.artista}`
    if (k === branoNastro) return
    const prima = branoNastro
    branoNastro = k
    const b = el('b', '', m.titolo)
    refs.brano.replaceChildren(b, document.createTextNode(` · ${m.artista}`))
    if (prima && !subito && !fermo() && !document.hidden) { a.classList.remove('is-cambia'); void a.offsetWidth; a.classList.add('is-cambia') }
  }

  // ── la messa in scena ──
  function attributi(c) {
    const st = stato()
    radice.dataset.stato = st || 'offline'
    radice.dataset.pc = c.base.pc
    radice.dataset.slot = c.tipo
    radice.toggleAttribute('data-vuoto', c.tipo === 'riposo')
    radice.toggleAttribute('data-barra', c.tipo === 'gioco' && !!(c.a.timestamps?.start && c.a.timestamps?.end))
    radice.dataset.motion = fermo() ? 'off' : 'on'
  }
  /** Mette in scena `c`. tr: 'nuova' (annuncio pieno), 'ritorno' (scambio svelto), 'piano' (dissolvenza), 'ridotto', 'fermo' (subito). */
  function mostra(c, tr) {
    scena = { ...c, dal: Date.now() }
    if (c.tipo !== 'riposo') viste.add(c.chiave) // quello che è già stato in scena, quando torna, è un ritorno
    if (!radice) return
    if (document.hidden) tr = 'fermo'
    else if (fermo() && tr !== 'fermo') tr = 'ridotto'
    const slot = refs.slot, vecchia = voce
    for (const v of slot.querySelectorAll('.is-esce')) if (tr === 'fermo') v.remove()
    if (vecchia) {
      const v = vecchia.el
      if (tr === 'fermo') v.remove()
      else {
        // chi se ne va tiene la sua misura mentre il riquadro cambia altezza; una cosa calma esce senza scena
        v.style.height = `${v.offsetHeight}px`
        v.style.bottom = 'auto'
        v.dataset.tr = v.dataset.calma || vecchia.tipo === 'riposo' ? (tr === 'ridotto' ? 'ridotto' : 'piano') : tr
        v.classList.remove('is-entra', 'is-entra-on', 'is-brano')
        v.classList.add('is-esce')
        v.setAttribute('aria-hidden', 'true')
        v.inert = true
        setTimeout(() => v.remove(), ESCE)
      }
    }
    voce = crea(c)
    voce.chiave = c.chiave
    voce.aggiorna(c)
    const n = voce.el
    n.dataset.tr = tr
    slot.append(n)
    if (tr !== 'fermo') {
      n.classList.add('is-entra')
      void n.offsetWidth
      n.classList.add('is-entra-on')
      const fine = () => n.classList.remove('is-entra', 'is-entra-on')
      n.addEventListener('animationend', (e) => { if (e.target === n) fine() })
      setTimeout(fine, 700)
    }
    attributi(c)
    nastro(c, tr === 'fermo')
    clearTimeout(calma)
    calma = setTimeout(() => { if (voce?.el === n) n.dataset.calma = '1' }, CALMA)
    batti()
  }
  /** Stessa cosa in scena, dati nuovi (un altro brano, i dettagli del gioco, l'icona arrivata dopo): si aggiorna dov'è. */
  function ritocca(c) {
    scena = { ...c, dal: scena.dal }
    if (!radice || !voce) return
    voce.aggiorna(c)
    attributi(c)
    nastro(c, false)
    batti()
  }
  const frase = (c) => {
    const T = o.testi()
    if (c.tipo === 'gioco') return `${T.act[c.a.type] || T.act[0]}: ${c.a.name}`
    if (c.tipo === 'musica') return `${T.listening}: ${c.m.titolo} ${T.by} ${c.m.artista}`
    if (c.tipo === 'app') return `${tx().pc}: ${c.app.n}`
    return T.status[stato()] || ''
  }
  function cambia(c) {
    const da = scena
    let tr = 'ritorno'
    if (c.tipo === 'riposo') tr = 'piano'
    else if (!viste.has(c.chiave) && novita < NOVITA && !(c.tipo === 'app' && usoDi(c.app.n).ritorni >= 3)) { tr = 'nuova'; novita++ }
    mostra(c, tr)
    ricorda()
    // un solo annuncio, gentile, e solo a cambio avvenuto (mai a ogni alt-tab, mai per il nastro)
    if (refs) refs.dice.textContent = frase(c)
    radice?.dispatchEvent(new CustomEvent('attivita:cambio', { bubbles: true, detail: { da: da ? { tipo: da.tipo, chiave: da.chiave } : null, a: { tipo: c.tipo, chiave: c.chiave }, tipo: tr } }))
  }

  /** Un dato nuovo: si decide se e quando cambiare. */
  function valuta() {
    const v = o.vetrina()
    osservo(statoPc(v) === 'vivo' ? (v.app || []).find((x) => x.su) : null)
    if (!radice) return
    const c = candidato()
    if (!scena) { mostra(c, 'fermo'); return }
    if (c.chiave === scena.chiave) { clearTimeout(timer); pendente = null; ritocca(c); return }
    // (intanto, se in scena c'è lo stato, la parola segue Discord)
    if (voce?.tipo === 'riposo') voce.aggiorna()
    // i cambi veri (un gioco, la musica che parte o si ferma, il pc che si spegne o si riaccende) aspettano poco;
    // quelli da un'app all'altra aspettano che l'app resti davanti, e che chi c'è abbia avuto il suo tempo
    const b = scena.base, n = c.base
    const duro = b.gioco !== n.gioco || b.musica !== n.musica || b.pc !== n.pc
    const attesa = duro ? GUARDIA : Math.max(ATTESA, RESTA - (Date.now() - scena.dal))
    if (pendente && pendente.chiave === c.chiave && pendente.duro === duro) return
    clearTimeout(timer)
    pendente = { chiave: c.chiave, duro }
    timer = setTimeout(() => {
      pendente = null
      const ora = candidato()
      if (ora.chiave !== scena.chiave) cambia(ora); else ritocca(ora)
    }, prove ? Math.min(attesa, prove) : attesa)
  }

  // ── il battito: una volta al secondo, solo se c'è qualcosa che conta e la scheda si vede ──
  function batti() {
    clearInterval(orologio); orologio = 0
    if (!voce || document.hidden || !radice?.isConnected) return
    const serve = voce.vivo || (scena && statoPc(o.vetrina()) === 'vivo')
    if (!serve) return
    orologio = setInterval(() => {
      if (!radice?.isConnected) { clearInterval(orologio); orologio = 0; return }
      voce.tic(Date.now())
      // il pc ha smesso di scrivere: quello che c'è in scena non vale più
      if (scena && statoPc(o.vetrina()) !== scena.base.pc) valuta()
    }, 1000)
    voce.tic(Date.now())
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInterval(orologio); orologio = 0; return }
    // tornata visibile: si riallinea subito, senza rifare i cambi persi
    clearTimeout(timer); pendente = null
    if (radice && scena) { const c = candidato(); if (c.chiave !== scena.chiave) mostra(c, 'fermo'); else ritocca(c) }
  })
  ridotto.addEventListener?.('change', () => { if (radice) radice.dataset.motion = fermo() ? 'off' : 'on' })

  /** Monta il riquadro in `root` (la scheda lo richiama a ogni ridisegno: se è già montato, aggiorna e basta). */
  function card(root) {
    if (!root) return
    if (root === radice && refs?.ca.isConnected) { aggiorna(); return }
    radice = root
    root.dataset.ca = '1'
    root.removeAttribute('aria-live') // l'annuncio lo fa una riga sola, a cambio avvenuto (.ca__dice)
    const ca = el('div', 'ca'), slot = el('div', 'ca__slot')
    ca.append(slot)
    const a = el('a', 'ca__nastro'); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.inert = true
    const disco = el('span', 'ca__dischetto'); disco.setAttribute('aria-hidden', 'true')
    const brano = el('span', 'ca__brano')
    a.append(disco, brano)
    const dice = el('p', 'sr ca__dice'); dice.setAttribute('aria-live', 'polite'); dice.setAttribute('aria-atomic', 'true')
    root.replaceChildren(ca, a, dice)
    refs = { ca, slot, nastro: a, brano, dice }
    voce = null; branoNastro = ''
    mostra(candidato(), 'fermo')
  }

  /** Le scritte o la lingua sono cambiate, o la scheda è stata ridisegnata: stessa scena, testi nuovi. */
  function aggiorna() {
    if (!radice || !scena || !voce) return
    const c = candidato()
    if (c.chiave === scena.chiave) ritocca(c)
    else { voce.aggiorna(scena); valuta() }
    for (const t of radice.querySelectorAll('.ca__timbro')) t.lastChild.textContent = o.testi().live
  }
  /** Lo stato di Discord, a ogni cambio di presenza (le attività le legge da `presenza()`). */
  function presenza(st) {
    if (st) discNoto = true
    valuta()
  }
  function distruggi() { clearTimeout(timer); clearTimeout(calma); clearInterval(orologio); orologio = 0; radice = null; refs = null; voce = null }

  let finta = null
  const veraVetrina = o.vetrina
  /**
   * Per le prove: scheda.prova({ luogo, app, musica }, attesaMs) mette una vetrina finta (agg = adesso) e accorcia le attese;
   * scheda.prova(null) torna ai dati veri.
   */
  function prova(d, attesaMs = 0) {
    finta = d ? { ok: true, ...d, agg: Date.now() } : null
    prove = d ? attesaMs || 1 : 0
    o.vetrina = finta ? () => finta : veraVetrina
    valuta()
  }

  ascolta(() => { if (!finta) valuta() })
  return { card, presenza, aggiorna, distruggi, prova }
}
