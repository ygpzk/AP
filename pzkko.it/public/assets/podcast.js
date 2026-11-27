// Giugnoh's Cast in bacheca (27.11): il palco del podcast nello stile della tv e dei pezzi di Diretta OS (neon lime e
// viola, Pricedown che ondeggia, l'insegna ON AIR, il rullo dell'argomento a caso coi coriandoli, il nastro che scorre
// con la lumaca al neon). In cima la puntata che sta per andare in onda, col conto alla rovescia e «Unisciti»; sotto
// i redattori, ognuno con la sua scheda Discord vera (la stessa del profilo, coi suoi colori, le sue foto e il suo
// tema), il rullo e l'archivio delle puntate.
//
// Dati: puntate, palco e argomenti in config.js (PODCAST); i redattori in /media/cast/redattori.json, con le foto
// scaricate dalla CDN di Discord (scripts/cast-profili.py); pzkko arriva dal profilo dal vivo (`mio()` da app.js).
// Lo stile è podcast.css, qui accanto: lo carica questo modulo, src/site.css non lo contiene.

import { PODCAST, NAME_FONTS } from './config.js'
import { mountEffect } from './fx.js'

const stile = document.createElement('link')
stile.rel = 'stylesheet'
stile.href = new URL('./podcast.css', import.meta.url).pathname
const vestito = new Promise((ok) => { stile.addEventListener('load', ok, { once: true }); stile.addEventListener('error', ok, { once: true }) })
document.head.append(stile)

const TZ = 'Europe/Rome'
const MIN = 60_000
const COLORI = ['#ccff00', '#9d00ff', '#eb459e', '#2dff7a', '#f0b232', '#ffffff', '#c77dff', '#05d9e8']
const NOME = PODCAST.nome

const TESTI = {
  it: {
    motto: 'il podcast di Giugnoh',
    puntata: 'puntata',
    prossima: 'prossima puntata',
    inOnda: 'in onda adesso',
    daAnnunciare: 'da annunciare',
    oggi: 'oggi', stasera: 'stasera', domani: 'domani', alle: 'alle', dalle: 'dalle',
    unita: { g: 'giorni', o: 'ore', m: 'min', s: 'sec' },
    unisciti: 'Unisciti', unisciOra: 'Unisciti ora', entra: 'Entra in OLLARE',
    apriPalco: 'apri il palco',
    notaInvito: (palco) => `Si entra dal server OLLARE: il palco ${palco} si apre all’ora della puntata.`,
    notaOnda: (palco) => `Siamo sul palco ${palco}: entra, ascolta, chiedi la parola.`,
    notaNessuna: 'La prossima si annuncia su OLLARE: entra e non te la perdi.',
    redattori: 'redattori principali',
    apri: (n) => `Apri il profilo di ${n}`,
    argomento: 'argomento a caso',
    ultimo: (n) => `l’ultimo estratto in onda · puntata ${n}`,
    tuo: 'estratto adesso, da te: portalo in puntata',
    gira: 'Gira', giraAncora: 'Gira ancora',
    puntate: 'le puntate',
    andata: 'andata in onda', inArrivo: 'in arrivo', ora: 'in onda',
    argomenti: 'argomenti estratti',
    nessunArgomento: 'gli argomenti si estraggono in diretta',
    durata: (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`),
    da: 'da',
    numeri: 'OLLARE in numeri',
    // la scheda dei redattori
    profilo: 'Profilo', membroDa: 'Membro da', collegamenti: 'Collegamenti', verificato: 'Verificato',
    messaggio: 'Messaggio', copia: 'Copia il nome utente', chiudi: 'Chiudi',
    prec: 'Redattore precedente', succ: 'Redattore successivo',
    ruolo: 'Redattore principale', dalla: (n, d) => `dalla puntata ${n} · ${d}`,
    avatar: (n) => `Avatar di ${n}`, decorazione: 'Decorazione',
    ora_it: 'ora italiana',
  },
  en: {
    motto: 'Giugnoh’s podcast',
    puntata: 'episode',
    prossima: 'next episode',
    inOnda: 'on air now',
    daAnnunciare: 'to be announced',
    oggi: 'today', stasera: 'tonight', domani: 'tomorrow', alle: 'at', dalle: 'from',
    unita: { g: 'days', o: 'hours', m: 'min', s: 'sec' },
    unisciti: 'Join', unisciOra: 'Join now', entra: 'Join OLLARE',
    apriPalco: 'open the stage',
    notaInvito: (palco) => `You get in through the OLLARE server: the ${palco} stage opens when the episode starts.`,
    notaOnda: (palco) => `We’re on the ${palco} stage: come in, listen, ask to speak.`,
    notaNessuna: 'The next one is announced on OLLARE: join and you won’t miss it.',
    redattori: 'main hosts',
    apri: (n) => `Open ${n}’s profile`,
    argomento: 'random topic',
    ultimo: (n) => `last topic drawn on air · episode ${n}`,
    tuo: 'drawn just now, by you: bring it to the show',
    gira: 'Spin', giraAncora: 'Spin again',
    puntate: 'episodes',
    andata: 'aired', inArrivo: 'coming up', ora: 'on air',
    argomenti: 'topics drawn',
    nessunArgomento: 'topics are drawn live',
    durata: (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`),
    da: 'for',
    numeri: 'OLLARE in numbers',
    profilo: 'Profile', membroDa: 'Member since', collegamenti: 'Connections', verificato: 'Verified',
    messaggio: 'Message', copia: 'Copy username', chiudi: 'Close',
    prec: 'Previous host', succ: 'Next host',
    ruolo: 'Main host', dalla: (n, d) => `since episode ${n} · ${d}`,
    avatar: (n) => `${n}’s avatar`, decorazione: 'Decoration',
    ora_it: 'Italian time',
  },
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const due = (n) => String(n).padStart(2, '0')
const hex = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null)
const percorso = (u) => (typeof u === 'string' && (/^\/media\//.test(u) || /^https:\/\/cdn\.discordapp\.com\//.test(u)) ? u : '')
const caso = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const luce = (h) => { const n = parseInt(h.slice(1), 16), v = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] }
const giorno = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
const oraDi = (ms) => new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
// da quanto è in onda: sempre ore:minuti:secondi, così accanto all'orologio non sembra un'ora
const tempo = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 3600)}:${due(Math.floor(s / 60) % 60)}:${due(s % 60)}` }
// i nomi coi caratteri larghi (「ＳＥＲＩＣ」): nella scheda piccola vanno un po' più stretti, se no vanno a capo a lettere
const largo = (s) => /[　-〿＀-￯]/.test(String(s || ''))

// il rullo: parte forte e frena piano, va un filo oltre e torna, come lo scatto della diretta (cast.js di Diretta OS)
const GIRA_DA = 0.75, GIRA_FINO = 5.2
function posizione(t, indice) {
  if (t <= GIRA_DA) return 0
  if (t < GIRA_FINO) { const u = (t - GIRA_DA) / (GIRA_FINO - GIRA_DA); return indice * (1 - (1 - u) ** 3.6) }
  const d = t - GIRA_FINO
  return indice + 0.2 * Math.sin(d * 21) * Math.exp(-d * 7)
}

// ─── le puntate: quale è in onda, quale viene dopo, quali sono passate ────────
function calendario(adesso) {
  const lista = (PODCAST.puntate || []).map((p) => {
    const a = Date.parse(p.inizio)
    const f = p.fine ? Date.parse(p.fine) : a + (PODCAST.durata || 150) * MIN
    return { ...p, a, f, argomenti: Array.isArray(p.argomenti) ? p.argomenti : [] }
  }).filter((p) => Number.isFinite(p.a) && Number.isFinite(p.f)).sort((x, y) => x.a - y.a)
  const onda = lista.find((p) => p.a <= adesso && adesso < p.f) || null
  const prossima = lista.find((p) => p.a > adesso) || null
  const passate = lista.filter((p) => p.f <= adesso)
  // il prossimo istante in cui cambia qualcosa (si accende l'insegna, finisce una puntata)
  const cambio = Math.min(...lista.flatMap((p) => [p.a, p.f]).filter((x) => x > adesso), Infinity)
  return { lista, onda, prossima, passate, cambio }
}

// «stasera alle 23:00», «domani alle 23:00», «ven 4 dic alle 23:00»
function quando(ms, adesso, t, locale) {
  const g = giorno(ms), oggi = giorno(adesso), domani = giorno(adesso + 24 * 3600_000)
  const ora = oraDi(ms)
  if (g === oggi) return `${+ora.slice(0, 2) >= 18 ? t.stasera : t.oggi} ${t.alle} ${ora}`
  if (g === domani) return `${t.domani} ${t.alle} ${ora}`
  return `${new Intl.DateTimeFormat(locale, { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(ms)} ${t.alle} ${ora}`
}
const dataBreve = (ms, locale) => new Intl.DateTimeFormat(locale, { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(ms)

// ─── lo stile del nome di Discord (carattere, colore, effetto), come nella scheda del profilo ───
function stileNome(st) {
  const f = NAME_FONTS[st?.font_id]
  const c = (st?.colors || []).map((n) => `#${Number(n).toString(16).padStart(6, '0')}`).filter(hex)
  let css = f ? `--dn-font:'${f[0]}';--dn-weight:${f[1]};--dn-space:${f[2]};` : ''
  if (c.length) {
    if (st.effect_id === 2 && c[1]) css += `background-image:linear-gradient(90deg,${c[0]},${c[1]});-webkit-background-clip:text;background-clip:text;color:transparent;`
    else {
      css += `color:${c[0]};`
      if (st.effect_id === 3) css += `text-shadow:0 0 6px ${c[0]},0 0 14px ${c[1] || c[0]};`
      else if (st.effect_id === 4 || st.effect_id === 5) css += `text-shadow:2px 2px 0 ${c[1] || 'rgba(0,0,0,.35)'};`
      else if (st.effect_id === 6) css += `text-shadow:0 0 12px ${c[1] || c[0]};`
    }
  }
  return { font: !!f, css, colore: c[0] || null }
}

// le lettere che ondeggiano: «Giugnoh's» lime, «Cast» bianco (come il logo della tv)
const lettere = (testo, bianche) => [...testo].map((c, i, a) => (c === ' ' ? '<i class="gc-sp"></i>' : `<span class="${bianche && i >= bianche ? 'b' : ''}" style="--i:${a.slice(0, i).filter((x) => x !== ' ').length}">${esc(c)}</span>`)).join('')

// ─── la zona ─────────────────────────────────────────────────────────────────
let redattoriFile = null
const caricaRedattori = () => (redattoriFile ??= fetch('/media/cast/redattori.json', { headers: { accept: 'application/json' } })
  .then((r) => (r.ok ? r.json() : { redattori: [] }))
  .then((d) => (Array.isArray(d?.redattori) ? d.redattori : []))
  .catch(() => []))

/**
 * Monta il palco dentro `root`. `ctx` arriva da app.js: lang, locale, mio() (pzkko come redattore), themeVars,
 * statusSvg, connRow, copia, stati, vai(tab), heavy, reduced, canHover, I (icone).
 */
export async function monta(root, ctx) {
  const t = TESTI[ctx.lang] || TESTI.en
  root.classList.add('gc')
  root.style.minHeight = '640px'
  const [altri] = await Promise.all([caricaRedattori(), vestito])
  if (!root.isConnected) return
  root.style.removeProperty('min-height')
  const redattori = () => [ctx.mio(), ...altri]

  let cal = calendario(Date.now()), visibile = true, timer = 0, chiaveMio = ''
  const chiave = (m) => JSON.stringify([m.nome, m.foto, m.gilda, m.stileNome])
  const disegna = () => {
    cal = calendario(Date.now())
    const red = redattori()
    chiaveMio = chiave(red[0])
    root.dataset.stato = cal.onda ? 'onda' : cal.prossima ? 'attesa' : 'nessuna'
    root.innerHTML = markup(cal, t, ctx, red)
    nastro(root, cal, t, red)
    rullo(root, cal, t, ctx)
    aggiorna()
  }
  // pzkko è il profilo dal vivo: quando la presenza porta un tag, una foto o una decorazione nuovi, la sua scheda
  // piccola si ridisegna (solo lei, e solo se è cambiato qualcosa)
  const smetti = ctx.ascolta?.(() => {
    if (!root.isConnected) return ferma()
    const m = ctx.mio(), k = chiave(m)
    if (k === chiaveMio) return
    chiaveMio = k
    const li = root.querySelector('[data-gc-red="0"]')?.closest('li')
    if (li) li.outerHTML = redHtml(m, 0, t, ctx)
  })

  // ogni secondo: l'orologio, il conto alla rovescia o da quanto è in onda; al cambio di fase si ridisegna tutto
  const aggiorna = () => {
    const adesso = Date.now()
    if (adesso >= cal.cambio) { disegna(); return }
    const ora = root.querySelector('[data-gc-orologio]')
    if (ora) ora.textContent = oraDi(adesso)
    if (cal.onda) {
      for (const el of root.querySelectorAll('[data-gc-da]')) el.textContent = tempo((adesso - cal.onda.a) / 1000)
    } else if (cal.prossima) {
      let s = Math.max(0, Math.floor((cal.prossima.a - adesso) / 1000))
      const g = Math.floor(s / 86400); s -= g * 86400
      const v = { g, o: Math.floor(s / 3600), m: Math.floor(s / 60) % 60, s: s % 60 }
      for (const [k, n] of Object.entries(v)) { const el = root.querySelector(`[data-gc-conto="${k}"]`); if (el) el.textContent = due(n) }
      root.querySelector('.gc-conto')?.toggleAttribute('data-giorni', g > 0)
      root.querySelector('.gc-conto')?.toggleAttribute('data-vicino', cal.prossima.a - adesso < 3600_000)
    }
  }
  const batti = () => {
    clearTimeout(timer)
    if (!root.isConnected) return ferma()
    if (visibile && !document.hidden) aggiorna()
    timer = setTimeout(batti, 1000 - (Date.now() % 1000) + 5)
  }
  const io = new IntersectionObserver(([e]) => { visibile = e.isIntersecting; root.classList.toggle('is-fuori', !visibile) }, { rootMargin: '120px' })
  const ferma = () => { clearTimeout(timer); io.disconnect(); document.removeEventListener('visibilitychange', batti); smetti?.() }
  io.observe(root)
  document.addEventListener('visibilitychange', batti)

  // i redattori: sul computer la foto e il banner animati partono al passaggio del mouse, al clic la scheda
  root.addEventListener('click', (e) => {
    const r = e.target.closest('[data-gc-red]')
    if (r) { e.preventDefault(); return apriScheda(redattori(), +r.dataset.gcRed, t, ctx, r) }
    const v = e.target.closest('[data-gc-vai]')
    if (v) { e.preventDefault(); ctx.vai(v.dataset.gcVai) }
  })
  if (ctx.canHover && ctx.heavy) {
    const anima = (el, on) => { for (const img of el.querySelectorAll('img[data-anim]')) { if (!img.dataset.fermo) img.dataset.fermo = img.getAttribute('src'); img.src = on ? img.dataset.anim : img.dataset.fermo } }
    root.addEventListener('pointerover', (e) => { const r = e.target.closest('[data-gc-red]'); if (r && !r.contains(e.relatedTarget)) anima(r, true) })
    root.addEventListener('pointerout', (e) => { const r = e.target.closest('[data-gc-red]'); if (r && !r.contains(e.relatedTarget)) anima(r, false) })
  }

  disegna()
  batti()
}

function markup(cal, t, ctx, red) {
  const adesso = Date.now(), loc = ctx.locale
  const p = cal.onda || cal.prossima
  const ultimaConArgomenti = [...cal.passate].reverse().find((x) => x.argomenti.length)
  return `<div class="gc__sfondo" aria-hidden="true"><i class="gc-lu gc-lu1"></i><i class="gc-lu gc-lu2"></i><i class="gc-lu gc-lu3"></i><div class="gc__pavimento"><i></i></div><i class="gc__scansione"></i></div>

  <header class="gc__testa">
    <div class="gc-onair" aria-hidden="true"><i></i><span>${cal.onda ? 'ON AIR' : 'OFF AIR'}</span></div>
    <div class="gc__dx">
      <div class="gc__ora" title="${esc(t.ora_it)}" data-gc-orologio>${oraDi(adesso)}</div>
      <div class="gc__ep">${p ? `${esc(t.puntata)} ${p.n}` : esc(NOME)}${cal.onda ? `<span class="gc__da">${esc(t.da)} <b data-gc-da>0:00</b></span>` : ''}</div>
    </div>
  </header>

  <div class="gc__marchio">
    <img class="gc__cuffie" src="/art/chat-ufficio/cuffie.webp" alt="" width="120" height="135" draggable="false">
    <h2 class="gc__logo" aria-label="${esc(NOME)}"><span class="gc__lettere" aria-hidden="true">${lettere(NOME, 10)}</span></h2>
    <p class="gc__motto">${esc(t.motto)}<span> · OLLARE</span></p>
  </div>

  <div class="gc__corpo">
    ${prossimaHtml(cal, t, ctx)}
    <section class="gc-redattori" aria-label="${esc(t.redattori)}">
      <h3 class="gc-et">${esc(t.redattori)}</h3>
      <ul>${red.map((r, i) => redHtml(r, i, t, ctx)).join('')}</ul>
    </section>
    <section class="gc-rullo" data-gc-rullo aria-label="${esc(t.argomento)}">
      <span class="gc-chip gc-chip--viola">${esc(t.argomento)}</span>
      <div class="gc-rullo__corpo">
        <i class="gc-rullo__banda" aria-hidden="true"></i>
        <div class="gc-rullo__finestra"><div class="gc-rullo__nastro" data-nastro></div></div>
        <i class="gc-freccia gc-freccia--sx" aria-hidden="true"></i><i class="gc-freccia gc-freccia--dx" aria-hidden="true"></i>
        <i class="gc-lampo" aria-hidden="true"></i>
        <div class="gc-cor" data-cor aria-hidden="true"></div>
      </div>
      <div class="gc-rullo__sotto"><span class="gc-rullo__nota" data-nota aria-live="polite">${ultimaConArgomenti ? esc(t.ultimo(ultimaConArgomenti.n)) : ''}</span><button type="button" class="gc-gira" data-gira><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0 .6 4"/><path d="M20 4v7h-7"/></svg><span>${esc(t.gira)}</span></button></div>
    </section>
    <section class="gc-archivio" aria-label="${esc(t.puntate)}">
      <h3 class="gc-et">${esc(t.puntate)}</h3>
      <ol>${[...cal.lista].reverse().map((x) => puntataHtml(x, cal, t, loc)).join('')}</ol>
      <button type="button" class="gc-numeri" data-gc-vai="community">${esc(t.numeri)} →</button>
    </section>
  </div>

  <div class="gc-eq" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--h:${(0.18 + caso(i) * 0.5).toFixed(2)};--d:${(0.45 + caso(i + 40) * 0.9).toFixed(2)}s;--r:${(-caso(i + 80)).toFixed(2)}s"></i>`).join('')}</div>
  <img class="gc__lumaca" src="/art/chat-pzk/neon.webp" alt="" width="159" height="129" draggable="false" aria-hidden="true">
  <footer class="gc__nastrino" aria-hidden="true"><div class="gc__scorre" data-scorre></div></footer>`
}

function prossimaHtml(cal, t, ctx) {
  const adesso = Date.now(), palco = PODCAST.nomePalco || 'OLLARE'
  const ext = ctx.I?.ext || ''
  if (cal.onda) {
    const p = cal.onda
    return `<section class="gc-prossima gc-prossima--onda" aria-label="${esc(`${t.inOnda}: ${t.puntata} ${p.n}`)}">
      <span class="gc-chip gc-chip--rosso"><i class="gc-rec"></i>${esc(t.inOnda)}</span>
      <h3 class="gc-prossima__titolo">${esc(t.puntata)} ${p.n}</h3>
      <p class="gc-prossima__quando">${esc(t.dalle)} ${oraDi(p.a)} · <span class="gc-prossima__da"><i class="gc-rec"></i><b data-gc-da>0:00</b></span></p>
      <div class="gc-azioni">
        <a class="gc-unisciti gc-unisciti--ora" href="${esc(PODCAST.invito)}" target="_blank" rel="noopener noreferrer">${esc(t.unisciOra)}<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg></a>
        <a class="gc-palco" href="${esc(PODCAST.palco)}" target="_blank" rel="noopener noreferrer">${esc(t.apriPalco)} ${esc(palco)} ${ext}</a>
      </div>
      <p class="gc-nota">${esc(t.notaOnda(palco))}</p>
    </section>`
  }
  if (cal.prossima) {
    const p = cal.prossima
    const u = t.unita
    return `<section class="gc-prossima" aria-label="${esc(`${t.prossima}: ${t.puntata} ${p.n}, ${quando(p.a, adesso, t, ctx.locale)}`)}">
      <span class="gc-chip">${esc(t.prossima)}</span>
      <h3 class="gc-prossima__titolo">${esc(t.puntata)} ${p.n}</h3>
      <p class="gc-prossima__quando">${esc(quando(p.a, adesso, t, ctx.locale))}</p>
      <div class="gc-conto" aria-hidden="true">
        <div class="gc-conto__g"><b data-gc-conto="g">00</b><small>${esc(u.g)}</small></div>
        <div><b data-gc-conto="o">00</b><small>${esc(u.o)}</small></div><span class="gc-conto__due">:</span>
        <div><b data-gc-conto="m">00</b><small>${esc(u.m)}</small></div><span class="gc-conto__due">:</span>
        <div><b data-gc-conto="s">00</b><small>${esc(u.s)}</small></div>
      </div>
      <div class="gc-azioni">
        <a class="gc-unisciti" href="${esc(PODCAST.invito)}" target="_blank" rel="noopener noreferrer">${esc(t.unisciti)}<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg></a>
        <a class="gc-palco" href="${esc(PODCAST.palco)}" target="_blank" rel="noopener noreferrer">${esc(t.apriPalco)} ${esc(palco)} ${ext}</a>
      </div>
      <p class="gc-nota">${esc(t.notaInvito(palco))}</p>
    </section>`
  }
  return `<section class="gc-prossima gc-prossima--niente" aria-label="${esc(t.prossima)}">
    <span class="gc-chip">${esc(t.prossima)}</span>
    <h3 class="gc-prossima__titolo">${esc(t.daAnnunciare)}</h3>
    <div class="gc-azioni"><a class="gc-unisciti" href="${esc(PODCAST.invito)}" target="_blank" rel="noopener noreferrer">${esc(t.entra)}<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg></a></div>
    <p class="gc-nota">${esc(t.notaNessuna)}</p>
  </section>`
}

// i colori di una scheda: il tema di Discord se c'è, altrimenti quelli neutri di Discord
function colori(r, ctx, scuro) {
  const tema = Array.isArray(r.tema) && hex(r.tema[0]) && hex(r.tema[1]) ? r.tema : null
  if (!tema) return { neutro: true, scuro, css: `--banner-c:${hex(r.coloreBanner) || '#5865f2'};` }
  const v = ctx.themeVars(tema[0], tema[1], scuro)
  return { neutro: false, scuro, css: `--p:${tema[0]};--a:${tema[1]};--ring:${v.ring};--tint:${v.tint};--modal-bg:${v.modal};--btn:${v.btn};--banner-c:${hex(r.coloreBanner) || tema[0]};` }
}

function redHtml(r, i, t, ctx) {
  const f = r.foto || {}, n = stileNome(r.stileNome)
  const c = colori(r, ctx, true)
  const banner = percorso(f.banner), anim = ctx.heavy ? percorso(f.bannerAnim) : ''
  const deco = percorso(f.deco), decoAnim = ctx.heavy ? percorso(f.decoAnim) : ''
  return `<li><button type="button" class="gc-red${c.neutro ? ' gc-red--neutro' : ''}" data-gc-red="${i}" style="${c.css}" aria-haspopup="dialog" aria-label="${esc(t.apri(r.nome))}">
    <span class="gc-red__banner">${banner ? `<img src="${esc(banner)}"${anim ? ` data-anim="${esc(anim)}"` : ''} alt="" loading="lazy" decoding="async" draggable="false">` : ''}</span>
    <span class="gc-red__av"><img class="gc-red__img" src="${esc(percorso(f.avatar) || '/me.png')}" alt="" width="72" height="72" loading="lazy" decoding="async" draggable="false">${deco ? `<img class="gc-red__deco" src="${esc(deco)}"${decoAnim ? ` data-anim="${esc(decoAnim)}"` : ''} alt="" loading="lazy" decoding="async" draggable="false">` : ''}</span>
    <span class="gc-red__nome${n.font ? ' is-font' : ''}${largo(r.nome) ? ' is-largo' : ''}" style="${n.css}">${esc(r.nome)}</span>
    <span class="gc-red__user">${esc(r.username)}</span>
    ${r.gilda?.tag ? `<span class="gc-red__tag">${percorso(r.gilda.stemma) ? `<img src="${esc(percorso(r.gilda.stemma))}" alt="" width="14" height="14">` : ''}${esc(r.gilda.tag)}</span>` : ''}
  </button></li>`
}

function puntataHtml(p, cal, t, loc) {
  const stato = cal.onda === p ? 'onda' : p.f <= Date.now() ? 'andata' : 'arrivo'
  const etichetta = { onda: t.ora, andata: t.andata, arrivo: t.inArrivo }[stato]
  const orari = p.fine ? `${oraDi(p.a)} → ${oraDi(p.f)}` : `${oraDi(p.a)}`
  const durata = p.fine ? ` · ${t.durata(Math.round((p.f - p.a) / MIN))}` : ''
  return `<li class="gc-ep gc-ep--${stato}">
    <span class="gc-ep__n">#${p.n}</span>
    <div class="gc-ep__testo">
      <div class="gc-ep__riga"><b>${esc(dataBreve(p.a, loc))}</b><span>${orari}${durata}</span><em class="gc-ep__stato">${stato === 'onda' ? '<i class="gc-rec"></i>' : stato === 'andata' ? '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}${esc(etichetta)}</em></div>
      ${p.argomenti.length ? `<div class="gc-ep__argo"><small>${esc(t.argomenti)}</small>${p.argomenti.map((a, i) => `<span><b>${i + 1}</b>${esc(a)}</span>`).join('')}</div>` : stato === 'andata' ? '' : `<div class="gc-ep__argo gc-ep__argo--vuoto"><small>${esc(t.nessunArgomento)}</small></div>`}
    </div>
  </li>`
}

// ─── il nastro in basso: la puntata, i redattori, gli argomenti ──────────────
function nastro(root, cal, t, red) {
  const s = root.querySelector('[data-scorre]')
  if (!s) return
  const pezzi = [`<span class="m">${esc(NOME)}</span>`]
  if (cal.onda) pezzi.push(`<span>${esc(t.puntata)} ${cal.onda.n} · ${esc(t.inOnda)}</span>`)
  else if (cal.prossima) pezzi.push(`<span>${esc(t.puntata)} ${cal.prossima.n} · ${esc(quando(cal.prossima.a, Date.now(), t, 'it-IT'))}</span>`)
  pezzi.push(`<span>${esc(PODCAST.nomePalco || 'OLLARE')}</span>`)
  pezzi.push(`<span>${esc(t.redattori)}: ${red.map((r) => esc(r.nome)).join(' · ')}</span>`)
  for (const p of [...cal.passate].reverse()) p.argomenti.forEach((a, i) => pezzi.push(`<span>#${p.n}.${i + 1} ${esc(a)}</span>`))
  pezzi.push('<span>pzkko.it</span>')
  const h = `${pezzi.join('<i></i>')}<i></i>`
  s.innerHTML = h + h // due volte: scorre in tondo senza salti
  requestAnimationFrame(() => { s.style.setProperty('--durata', `${Math.max(24, s.scrollWidth / 2 / 46).toFixed(1)}s`) })
}

// ─── il rullo dell'argomento a caso ──────────────────────────────────────────
function rullo(root, cal, t, ctx) {
  const box = root.querySelector('[data-gc-rullo]')
  if (!box) return
  const nastroEl = box.querySelector('[data-nastro]'), nota = box.querySelector('[data-nota]'), btn = box.querySelector('[data-gira]')
  const tutti = (PODCAST.argomenti || []).filter(Boolean)
  const ultima = [...cal.passate].reverse().find((x) => x.argomenti.length)
  let voci = [ultima?.argomenti.at(-1) || tutti[0] || NOME], corrente = 0, gira = false
  const disegna = () => { nastroEl.innerHTML = voci.map((v, i) => `<div class="gc-voce${i === corrente ? ' is-scelta' : ''}" style="--n:${i}"><span>${esc(v)}</span></div>`).join('') }
  const metti = (p, vel = 0) => { nastroEl.style.transform = `translate3d(0, calc(${(-p).toFixed(4)} * var(--voce)), 0)`; box.style.setProperty('--vel', Math.min(30, Math.abs(vel)).toFixed(2)) }
  disegna()
  metti(0)
  btn?.addEventListener('click', () => {
    if (gira || !tutti.length) return
    const prima = voci[corrente]
    const altri = tutti.filter((a) => a !== prima)
    const scelto = altri[Math.floor(Math.random() * altri.length)] || prima
    const giro = [prima]
    for (let i = 0; i < 26; i++) giro.push(altri[Math.floor(Math.random() * altri.length)] || prima)
    giro.push(scelto)
    voci = giro
    corrente = -1
    const indice = giro.length - 1
    const finito = () => {
      corrente = indice
      gira = false
      box.dataset.fase = 'preso'
      btn.disabled = false
      btn.querySelector('span').textContent = t.giraAncora
      if (nota) nota.textContent = t.tuo
      // per non tenere nel DOM le 28 voci: si riparte dalla scelta
      voci = [scelto]; corrente = 0; disegna(); metti(0)
    }
    if (ctx.reduced) { voci = [scelto]; corrente = 0; disegna(); metti(0); finito(); return }
    gira = true
    btn.disabled = true
    box.dataset.fase = 'gira'
    disegna()
    metti(0)
    let botto = false
    const t0 = performance.now()
    const passo = (ora) => {
      const s = (ora - t0) / 1000 + GIRA_DA
      const p = posizione(s, indice)
      metti(p, (posizione(s + 0.02, indice) - posizione(s - 0.02, indice)) / 0.04)
      if (!botto && s >= GIRA_FINO) {
        botto = true
        nastroEl.children[indice]?.classList.add('is-scelta')
        esplodi(box)
      }
      if (s < GIRA_FINO + 0.9 && box.isConnected) requestAnimationFrame(passo)
      else if (box.isConnected) finito()
    }
    requestAnimationFrame(passo)
  })
}

function esplodi(box) {
  box.classList.remove('botto')
  void box.offsetWidth
  box.classList.add('botto')
  setTimeout(() => box.classList.remove('botto'), 1000)
  const cor = box.querySelector('[data-cor]')
  if (!cor) return
  const seme = Math.random() * 1000
  cor.innerHTML = Array.from({ length: 30 }, (_, i) => {
    const a = caso(seme + i) * Math.PI * 2, d = 70 + caso(seme + i + 50) * 170
    return `<i style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d * 0.55 - 40).toFixed(0)}px;--r:${(caso(seme + i + 90) * 720 - 360).toFixed(0)}deg;--w:${(7 + caso(seme + i + 9) * 7).toFixed(1)}px;background:${COLORI[i % COLORI.length]}"></i>`
  }).join('')
  setTimeout(() => { if (cor.isConnected) cor.replaceChildren() }, 1900)
}

// ─── la scheda del redattore: la stessa scheda del profilo, coi suoi colori ──
let aperta = null
function apriScheda(lista, i, t, ctx, da) {
  aperta?.dlg.close()
  const dlg = document.createElement('dialog')
  dlg.className = 'gcp'
  dlg.setAttribute('aria-labelledby', 'gcp-nome')
  dlg.innerHTML = `<button type="button" class="gcp__x" data-chiudi aria-label="${esc(t.chiudi)}" title="${esc(t.chiudi)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>
    <div class="gcp__giro">
      ${lista.length > 1 ? `<button type="button" class="gcp__freccia" data-passo="-1" aria-label="${esc(t.prec)}" title="${esc(t.prec)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
      <div class="gcp__scena" data-scena></div>
      ${lista.length > 1 ? `<button type="button" class="gcp__freccia" data-passo="1" aria-label="${esc(t.succ)}" title="${esc(t.succ)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
    </div>
    ${lista.length > 1 ? `<div class="gcp__punti" role="group">${lista.map((r, k) => `<button type="button" data-vai="${k}" aria-label="${esc(r.nome)}"></button>`).join('')}</div>` : ''}`
  document.body.append(dlg)
  const scena = dlg.querySelector('[data-scena]')
  let effetto = null, idx = i
  const mostra = (k, dir = 0) => {
    idx = (k + lista.length) % lista.length
    const r = idx === 0 ? ctx.mio() : lista[idx] // pzkko si rilegge dal vivo
    effetto?.stop()
    effetto = null
    scena.innerHTML = schedaHtml(r, t, ctx)
    const card = scena.firstElementChild
    if (dir) card.classList.add(dir > 0 ? 'entra-dx' : 'entra-sx')
    for (const b of dlg.querySelectorAll('[data-vai]')) b.setAttribute('aria-current', +b.dataset.vai === idx)
    // il banner e la decorazione animati, dopo il fermo immagine (come nella scheda del profilo)
    if (ctx.heavy) for (const img of card.querySelectorAll('img[data-anim]')) { const pre = new Image(); pre.onload = () => { if (img.isConnected) img.src = img.dataset.anim }; pre.src = img.dataset.anim }
    // l'effetto del profilo (solo chi ce l'ha: per ora pzkko, «Boost Relic»)
    if (r.effetto?.type === 1) effetto = mountEffect(card.querySelector('[data-fx]'), r.effetto, { intro: true, heavy: ctx.heavy })
    inclina(card, ctx)
  }
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) return dlg.close()
    const p = e.target.closest('[data-passo]')
    if (p) return mostra(idx + +p.dataset.passo, +p.dataset.passo)
    const v = e.target.closest('[data-vai]')
    if (v) return mostra(+v.dataset.vai, +v.dataset.vai > idx ? 1 : -1)
    const c = e.target.closest('[data-copia]')
    if (c) return ctx.copia(c.dataset.copia)
    const av = e.target.closest('[data-av]')
    if (av) {
      // la foto si tocca: salta, la decorazione si anima, e l'effetto del profilo riparte
      av.classList.remove('is-boop'); void av.offsetWidth; av.classList.add('is-boop')
      const d = av.querySelector('img[data-anim]')
      if (d) d.src = d.dataset.anim
      effetto?.replay()
    }
  })
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && lista.length > 1) { e.preventDefault(); mostra(idx + 1, 1) }
    else if (e.key === 'ArrowLeft' && lista.length > 1) { e.preventDefault(); mostra(idx - 1, -1) }
  })
  dlg.addEventListener('close', () => {
    effetto?.stop()
    dlg.remove()
    if (aperta?.dlg === dlg) aperta = null
    document.documentElement.style.removeProperty('overflow')
    if (da?.isConnected) da.focus({ preventScroll: true })
  })
  aperta = { dlg }
  mostra(i)
  document.documentElement.style.overflow = 'hidden'
  dlg.showModal()
  dlg.querySelector('.gcp__x').blur()
  dlg.querySelector('[data-scena] .gcp-card')?.focus({ preventScroll: true })
}

function schedaHtml(r, t, ctx) {
  const sitoScuro = document.documentElement.dataset.theme === 'dark'
  const temaOk = Array.isArray(r.tema) && hex(r.tema[0]) && hex(r.tema[1])
  // col tema, chiaro o scuro lo decide il colore principale, come su Discord; senza tema, lo scuro di Discord (com'è
  // negli screenshot dei profili). Il profilo di pzkko segue il sito, come la scheda a sinistra.
  const scuro = r.tuo ? sitoScuro : !temaOk || luce(r.tema[0]) < 0.4
  const c = colori(r, ctx, scuro)
  const f = r.foto || {}, n = stileNome(r.stileNome)
  const banner = percorso(f.banner), deco = percorso(f.deco)
  const anim = (u) => (ctx.heavy && percorso(u) ? ` data-anim="${esc(percorso(u))}"` : '')
  const nato = new Date(r.membroDa)
  const membro = Number.isNaN(nato.getTime()) ? '' : new Intl.DateTimeFormat(ctx.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(nato)
  const prima = (PODCAST.puntate || []).map((p) => ({ n: p.n, a: Date.parse(p.inizio) })).filter((p) => Number.isFinite(p.a)).sort((a, b) => a.a - b.a)[0]
  const badge = (r.badge || []).filter((b) => percorso(b.icona)).map((b) => {
    const img = `<img src="${esc(percorso(b.icona))}" alt="" width="22" height="22" draggable="false">`
    const attr = `data-tip="${esc(b.testo)}" aria-label="${esc(b.testo)}"`
    return /^https:\/\/discord\.com\//.test(b.link || '') ? `<a href="${esc(b.link)}" target="_blank" rel="noopener noreferrer" ${attr}>${img}</a>` : `<span tabindex="0" role="img" ${attr}>${img}</span>`
  }).join('')
  const conns = (r.collegamenti || []).map((x) => ctx.connRow(x)).join('')
  const stato = r.tuo ? (r.stato || 'offline') : null
  return `<article class="gcp-card${c.neutro ? ' gcp-card--neutro' : ''}" data-tema="${scuro ? 'scuro' : 'chiaro'}" style="${c.css}" tabindex="-1">
    <div class="gcp-card__tilt">
      <div class="card__in gcp-in">
        <div class="banner gcp-banner">${banner ? `<img src="${esc(banner)}"${anim(f.bannerAnim)} alt="" draggable="false">` : ''}</div>
        <button type="button" class="avatar gcp-av" data-av aria-label="${esc(t.avatar(r.nome))}">
          <img class="avatar__img" src="${esc(percorso(f.avatar) || '/me.png')}" alt="" width="92" height="92" draggable="false">
          ${deco ? `<img class="avatar__deco" src="${esc(deco)}"${anim(f.decoAnim)} alt="" draggable="false">` : ''}
          ${stato ? `<span class="avatar__status" title="${esc(ctx.stati?.[stato] || '')}">${ctx.statusSvg(stato)}</span>` : ''}
        </button>
        <div class="card__body">
          <h2 class="dname" id="gcp-nome"${n.font ? ' data-font' : ''} style="${n.css}">${esc(r.nome)}</h2>
          <div class="uname"><span>${esc(r.username)}</span>${r.pronomi ? `<span class="pron">${esc(r.pronomi)}</span>` : ''}${r.gilda?.tag ? `<span class="gtag">${percorso(r.gilda.stemma) ? `<img src="${esc(percorso(r.gilda.stemma))}" alt="">` : ''}${esc(r.gilda.tag)}</span>` : ''}</div>
          ${badge ? `<div class="badges gcp-badges">${badge}</div>` : ''}
          <div class="actions">
            <a class="btn btn--msg btn--grow" href="https://discord.com/users/${esc(r.id)}" target="_blank" rel="noopener noreferrer">${ctx.I?.chat || ''}<span>${esc(t.messaggio)}</span></a>
            <button type="button" class="btn btn--icon" data-copia="${esc(r.username)}" aria-label="${esc(t.copia)}" title="${esc(t.copia)}">${ctx.I?.copy || ''}</button>
          </div>
          <div class="box">
            ${r.bio && r.bio.replace(/[\s.]/g, '') ? `<section class="sec"><h3 class="sec__h">${esc(t.profilo)}</h3><p class="sec__p">${esc(r.bio)}</p></section>` : r.bio ? `<section class="sec"><p class="sec__p gcp-puntini">${esc(r.bio)}</p></section>` : ''}
            ${membro ? `<section class="sec"><h3 class="sec__h">${esc(t.membroDa)}</h3><p class="sec__p">${esc(membro)}</p></section>` : ''}
          </div>
          ${conns ? `<div class="box"><section class="sec"><h3 class="sec__h">${esc(t.collegamenti)}</h3><ul class="conns">${conns}</ul></section></div>` : ''}
          <div class="box gcp-cast"><span class="gcp-cast__logo">${esc(NOME)}</span><span class="gcp-cast__ruolo">${esc(t.ruolo)}${prima ? ` · ${esc(t.dalla(prima.n, new Intl.DateTimeFormat(ctx.locale, { timeZone: TZ, day: 'numeric', month: 'short' }).format(prima.a)))}` : ''}</span></div>
        </div>
        <div class="fx gcp-fx" data-fx aria-hidden="true"></div>
      </div>
      <i class="gcp-luce" aria-hidden="true"></i>
    </div>
  </article>`
}

// la scheda si inclina sotto il mouse, con un riflesso che segue il puntatore
function inclina(card, ctx) {
  if (!ctx.canHover || ctx.reduced) return
  const el = card.querySelector('.gcp-card__tilt')
  let raf = 0
  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      const b = card.getBoundingClientRect()
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height
      el.style.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      card.classList.add('is-sopra')
    })
  })
  card.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf)
    card.classList.remove('is-sopra')
    for (const k of ['--rx', '--ry']) el.style.setProperty(k, '0deg')
  })
}
