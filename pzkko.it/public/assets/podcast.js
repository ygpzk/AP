// Giugnoh's Cast in bacheca (27.11): il palco del podcast nello stile della tv e dei pezzi di Diretta OS (neon lime e
// viola, Pricedown che ondeggia, l'insegna ON AIR, il nastro che scorre con la lumaca al neon). In cima un banner
// tutto SVG (la cup di lean che si rovescia, fluida) con il titolo della puntata e i numeri di ieri; sotto la
// puntata che sta per andare in onda (o quella rimandata), il voto del podcast (uno ogni sei ore, senza account),
// i redattori coi loro soprannomi e l'archivio delle puntate.
//
// Dati: puntate, palco, soprannomi e voto in config.js (PODCAST); i redattori in /media/cast/redattori.json, con le
// foto scaricate dalla CDN di Discord (scripts/cast-profili.py); pzkko arriva dal profilo dal vivo (`mio()` da
// app.js). Lo stile è podcast.css, qui accanto: lo carica questo modulo, src/site.css non lo contiene.

import { PODCAST, NAME_FONTS } from './config.js'
import { mountEffect } from './fx.js'

const stile = document.createElement('link')
stile.rel = 'stylesheet'
stile.href = new URL('./podcast.css', import.meta.url).pathname
const vestito = new Promise((ok) => { stile.addEventListener('load', ok, { once: true }); stile.addEventListener('error', ok, { once: true }) })
document.head.append(stile)

const TZ = 'Europe/Rome'
const MIN = 60_000
const NOME = PODCAST.nome

const TESTI = {
  it: {
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
    rimandata: 'rimandata',
    aData: 'a data da destinarsi',
    notaRimandata: 'La puntata di stasera non si fa: la nuova data si annuncia su OLLARE.',
    redattori: 'redattori principali',
    apri: (n) => `Apri il profilo di ${n}`,
    voto: 'vota il podcast',
    votoDomanda: 'Quanto ti piace Giugnoh’s Cast?',
    votoNota: 'Un voto ogni 6 ore · senza accedere',
    votoSenza: 'Nessun account: chiunque può votare, senza accedere.',
    votoFatto: (n) => `Hai votato ${n}/5. Grazie!`,
    votoAttesa: (s) => `Puoi votare di nuovo tra ${s}`,
    stella: (n) => (n === 1 ? '1 stella' : `${n} stelle`),
    puntate: 'le puntate',
    andata: 'andata in onda', inArrivo: 'in arrivo', ora: 'in onda',
    durata: (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`),
    da: 'da',
    numeri: 'OLLARE in numeri',
    ieri: 'ieri',
    spettatori: 'max spettatori in simultanea',
    // la scheda dei redattori
    profilo: 'Profilo', membroDa: 'Membro da', collegamenti: 'Collegamenti', verificato: 'Verificato',
    messaggio: 'Messaggio', copia: 'Copia il nome utente', chiudi: 'Chiudi',
    prec: 'Redattore precedente', succ: 'Redattore successivo',
    ruolo: 'Redattore principale', dalla: (n, d) => `dalla puntata ${n} · ${d}`,
    avatar: (n) => `Avatar di ${n}`, decorazione: 'Decorazione',
    castTag: (n) => `Nel cast: ${n}`,
    ora_it: 'ora italiana',
  },
  en: {
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
    rimandata: 'postponed',
    aData: 'date to be announced',
    notaRimandata: 'Tonight’s episode is postponed: the new date is announced on OLLARE.',
    redattori: 'main hosts',
    apri: (n) => `Open ${n}’s profile`,
    voto: 'vote the podcast',
    votoDomanda: 'How much do you like Giugnoh’s Cast?',
    votoNota: 'One vote every 6 hours · no sign-in',
    votoSenza: 'No account: anyone can vote, without signing in.',
    votoFatto: (n) => `You voted ${n}/5. Thank you!`,
    votoAttesa: (s) => `You can vote again in ${s}`,
    stella: (n) => (n === 1 ? '1 star' : `${n} stars`),
    puntate: 'episodes',
    andata: 'aired', inArrivo: 'coming up', ora: 'on air',
    durata: (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`),
    da: 'for',
    numeri: 'OLLARE in numbers',
    ieri: 'yesterday',
    spettatori: 'peak viewers at the same time',
    profilo: 'Profile', membroDa: 'Member since', collegamenti: 'Connections', verificato: 'Verified',
    messaggio: 'Message', copia: 'Copy username', chiudi: 'Close',
    prec: 'Previous host', succ: 'Next host',
    ruolo: 'Main host', dalla: (n, d) => `since episode ${n} · ${d}`,
    avatar: (n) => `${n}’s avatar`, decorazione: 'Decoration',
    castTag: (n) => `In the cast: ${n}`,
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

// il voto: nessun account, resta nel browser; uno ogni sei ore (PODCAST.voto in config.js)
const VOTO_KEY = 'pzkko-cast-voto'
const leggiVoto = () => {
  try {
    const v = JSON.parse(localStorage.getItem(VOTO_KEY) || 'null')
    return Number.isFinite(v?.stelle) && Number.isFinite(v?.quando) ? v : null
  } catch { return null }
}
const salvaVoto = (v) => { try { localStorage.setItem(VOTO_KEY, JSON.stringify(v)) } catch {} }

// ─── le puntate: quale è in onda, quale viene dopo, quali sono passate, quale è rimandata ───
function calendario(adesso) {
  const tutte = (PODCAST.puntate || []).map((p) => {
    if (p.stato === 'rimandata' || !p.inizio) return { ...p, a: NaN, f: NaN, rimandata: true }
    const a = Date.parse(p.inizio)
    const f = p.fine ? Date.parse(p.fine) : a + (PODCAST.durata || 150) * MIN
    return { ...p, a, f, rimandata: false }
  }).filter((p) => p.rimandata || (Number.isFinite(p.a) && Number.isFinite(p.f)))
  const lista = tutte.filter((p) => !p.rimandata).sort((x, y) => x.a - y.a)
  const rimandata = tutte.filter((p) => p.rimandata).sort((x, y) => x.n - y.n)[0] || null
  const onda = lista.find((p) => p.a <= adesso && adesso < p.f) || null
  const prossima = lista.find((p) => p.a > adesso) || null
  const passate = lista.filter((p) => p.f <= adesso)
  // il prossimo istante in cui cambia qualcosa (si accende l'insegna, finisce una puntata)
  const cambio = Math.min(...lista.flatMap((p) => [p.a, p.f]).filter((x) => x > adesso), Infinity)
  return { tutte, lista, onda, prossima, passate, rimandata, cambio }
}

// «EP 1 - Attualità, Sessualità e Ambiente»: sempre un titolo, mai gli argomenti estratti
const nomePuntata = (p) => (p ? `EP ${p.n}${p.titolo ? ` - ${p.titolo}` : ''}` : NOME)

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

  // i soprannomi e l'ordine del cast: Giugnoh, Maggioh, Aprileh (PODCAST.cast in config.js)
  const ordine = PODCAST.cast || []
  const trovaCast = (r) => ordine.find((c) => (c.id && c.id === r.id) || (c.username && c.username.toLowerCase() === String(r.username || '').toLowerCase()))
  const posCast = (r) => { const i = ordine.findIndex((c) => (c.id && c.id === r.id) || (c.username && c.username.toLowerCase() === String(r.username || '').toLowerCase())); return i < 0 ? 999 : i }
  const conSoprannome = (r) => ({ ...r, soprannome: r.soprannome || trovaCast(r)?.soprannome || r.nome })
  const redattori = () => [ctx.mio(), ...altri].map(conSoprannome).sort((a, b) => posCast(a) - posCast(b))

  let cal = calendario(Date.now()), visibile = true, timer = 0, chiaveMio = '', voto = leggiVoto()
  const chiave = (m) => JSON.stringify([m.nome, m.soprannome, m.foto, m.gilda, m.stileNome])
  const statoVoto = () => {
    const stelle = Number(voto?.stelle) || 0
    const resta = voto ? Math.max(0, Number(voto.quando) + (PODCAST.voto?.ogniOre || 6) * 3600_000 - Date.now()) : 0
    return { stelle, resta }
  }
  const aggiornaVoto = () => {
    const el = root.querySelector('[data-voto-nota]')
    if (!el) return
    const { stelle, resta } = statoVoto()
    el.textContent = resta > 0 ? `${t.votoFatto(stelle)} · ${t.votoAttesa(tempo(resta / 1000))}` : t.votoNota
    // finite le sei ore, le stelle tornano cliccabili senza ricaricare la pagina
    for (const b of root.querySelectorAll('[data-voto]')) {
      const bloccato = resta > 0
      if (b.disabled !== bloccato) b.disabled = bloccato
    }
  }
  const disegna = () => {
    cal = calendario(Date.now())
    const red = redattori()
    chiaveMio = chiave(red[0])
    root.dataset.stato = cal.onda ? 'onda' : cal.prossima ? 'attesa' : cal.rimandata ? 'rimandata' : 'nessuna'
    root.innerHTML = markup(cal, t, ctx, red, voto)
    nastro(root, cal, t, red)
    aggiorna()
  }
  // pzkko è il profilo dal vivo: quando la presenza porta un tag, una foto o una decorazione nuovi, la sua scheda
  // piccola si ridisegna (solo lei, e solo se è cambiato qualcosa)
  const smetti = ctx.ascolta?.(() => {
    if (!root.isConnected) return ferma()
    const m = conSoprannome(ctx.mio()), k = chiave(m)
    if (k === chiaveMio) return
    chiaveMio = k
    const i = redattori().findIndex((r) => r.tuo)
    const li = root.querySelector(`[data-gc-red="${i}"]`)?.closest('li')
    if (li) li.outerHTML = redHtml(m, i, t, ctx)
  })

  // ogni secondo: l'orologio, il conto alla rovescia, da quanto è in onda e il tempo rimasto per votare
  const aggiorna = () => {
    const adesso = Date.now()
    if (adesso >= cal.cambio) { disegna(); return }
    const ora = root.querySelector('[data-gc-orologio]')
    if (ora) ora.textContent = oraDi(adesso)
    aggiornaVoto()
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

  // i redattori: sul computer la foto e il banner animati partono al passaggio del mouse, al clic la scheda;
  // le stelle del voto: un clic, poi il voto resta fermo per sei ore
  root.addEventListener('click', (e) => {
    const r = e.target.closest('[data-gc-red]')
    if (r) { e.preventDefault(); return apriScheda(redattori(), +r.dataset.gcRed, t, ctx, r) }
    const st = e.target.closest('[data-voto]')
    if (st) {
      e.preventDefault()
      if (st.disabled) return
      const n = +st.dataset.voto
      voto = { stelle: n, quando: Date.now() }
      salvaVoto(voto)
      const box = st.closest('[data-voto-box]')
      for (const b of root.querySelectorAll('[data-voto]')) {
        b.classList.toggle('is-on', +b.dataset.voto <= n)
        b.setAttribute('aria-checked', String(+b.dataset.voto === n))
        b.disabled = true
      }
      box?.classList.remove('is-fatto')
      void box?.offsetWidth
      box?.classList.add('is-fatto')
      setTimeout(() => box?.classList.remove('is-fatto'), 1000)
      return aggiornaVoto()
    }
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

function markup(cal, t, ctx, red, voto) {
  const adesso = Date.now(), loc = ctx.locale
  const p = cal.onda || cal.prossima || cal.rimandata
  return `<div class="gc__sfondo" aria-hidden="true"><i class="gc-lu gc-lu1"></i><i class="gc-lu gc-lu2"></i><i class="gc-lu gc-lu3"></i><div class="gc__pavimento"><i></i></div><i class="gc__scansione"></i></div>

  <header class="gc__testa">
    <div class="gc-onair" aria-hidden="true"><i></i><span>${cal.onda ? 'ON AIR' : 'OFF AIR'}</span></div>
    <div class="gc__dx">
      <div class="gc__ora" title="${esc(t.ora_it)}" data-gc-orologio>${oraDi(adesso)}</div>
      <div class="gc__ep">${p ? `EP ${p.n}` : esc(NOME)}${p?.rimandata ? `<span class="gc__rim">${esc(t.rimandata)}</span>` : ''}${cal.onda ? `<span class="gc__da">${esc(t.da)} <b data-gc-da>0:00</b></span>` : ''}</div>
    </div>
  </header>

  ${bannerHtml(cal, t, red)}

  <div class="gc__corpo">
    ${prossimaHtml(cal, t, ctx)}
    ${votoHtml(t, voto)}
    <section class="gc-redattori" aria-label="${esc(t.redattori)}">
      <h3 class="gc-et">${esc(t.redattori)}</h3>
      <ul>${red.map((r, i) => redHtml(r, i, t, ctx)).join('')}</ul>
    </section>
    <section class="gc-archivio" aria-label="${esc(t.puntate)}">
      <h3 class="gc-et">${esc(t.puntate)}</h3>
      <ol>${[...cal.tutte].sort((a, b) => b.n - a.n).map((x) => puntataHtml(x, cal, t, loc)).join('')}</ol>
      <button type="button" class="gc-numeri" data-gc-vai="community">${esc(t.numeri)} →</button>
    </section>
  </div>

  <div class="gc-eq" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--h:${(0.18 + caso(i) * 0.5).toFixed(2)};--d:${(0.45 + caso(i + 40) * 0.9).toFixed(2)}s;--r:${(-caso(i + 80)).toFixed(2)}s"></i>`).join('')}</div>
  <img class="gc__lumaca" src="/art/chat-pzk/neon.webp" alt="" width="159" height="129" draggable="false" aria-hidden="true">
  <footer class="gc__nastrino" aria-hidden="true"><div class="gc__scorre" data-scorre></div></footer>`
}

// ─── il banner: tutto SVG, la cup di lean che si rovescia, il titolo e i numeri di ieri ───
function bannerHtml(cal, t, red) {
  const ep = cal.onda || cal.prossima || cal.passate.at(-1) || cal.rimandata
  const n = ep?.n || 1
  const spett = Number(PODCAST.spettatoriIeri ?? cal.passate.at(-1)?.spettatori) || 0
  const titolo = ep?.titolo ? String(ep.titolo) : ''
  // il titolo va a capo dove respira: dopo la virgola e prima della «e» (Attualità, / Sessualità / e Ambiente)
  const gruppi = titolo.split(/\s*,\s*/).filter(Boolean)
  const righe = gruppi.flatMap((g, i) => {
    const pezzi = g.split(/\s+e\s+/i).map((x, k) => (k === 0 ? x : `e ${x}`))
    if (i < gruppi.length - 1) pezzi[pezzi.length - 1] += ','
    return pezzi
  })
  const titoloHtml = righe.map((x) => `<span>${esc(x)}</span>`).join('')
  const nomi = red.map((r) => esc(r.soprannome || r.nome)).join('<i>·</i>')
  return `<section class="gc-banner" aria-label="${esc(`${NOME}: EP ${n}${titolo ? ` - ${titolo}` : ''}. ${spett} ${t.spettatori} ${t.ieri}. ${red.map((r) => r.soprannome || r.nome).join(', ')}`)}">
    <svg class="gc-banner__fondo" viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gcb-bg" x1="0" y1="0" x2="1000" y2="420" gradientUnits="userSpaceOnUse"><stop stop-color="#1c0730"/><stop offset=".46" stop-color="#12071c"/><stop offset="1" stop-color="#0b090e"/></linearGradient>
        <radialGradient id="gcb-lime" cx=".2" cy=".14" r=".8"><stop stop-color="#ccff00" stop-opacity=".36"/><stop offset="1" stop-color="#ccff00" stop-opacity="0"/></radialGradient>
        <radialGradient id="gcb-viola" cx=".78" cy=".72" r=".82"><stop stop-color="#9d00ff" stop-opacity=".56"/><stop offset="1" stop-color="#9d00ff" stop-opacity="0"/></radialGradient>
        <linearGradient id="gcb-striscia" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ccff00" stop-opacity="0"/><stop offset=".5" stop-color="#ccff00" stop-opacity=".2"/><stop offset="1" stop-color="#ccff00" stop-opacity="0"/></linearGradient>
        <pattern id="gcb-griglia" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="#ccff00" stroke-width="1" stroke-opacity=".12"/></pattern>
        <pattern id="gcb-punti" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#eb459e" opacity=".2"/></pattern>
        <path id="gcb-stella" d="M0-9 2-2 9 0 2 2 0 9-2 2-9 0-2-2Z"/>
      </defs>
      <rect width="1000" height="420" fill="url(#gcb-bg)"/>
      <rect width="1000" height="420" fill="url(#gcb-griglia)"/>
      <rect width="1000" height="420" fill="url(#gcb-punti)"/>
      <circle cx="170" cy="60" r="270" fill="url(#gcb-lime)"/>
      <circle cx="850" cy="340" r="300" fill="url(#gcb-viola)"/>
      <g class="gc-banner__raggi" stroke="#ccff00" stroke-opacity=".14" stroke-width="2">
        <path d="M780 230 1080 30M780 230 1080 130M780 230 1080 230M780 230 1080 330M780 230 1080 430M780 230 1040 510M780 230 940 540M780 230 840 560M780 230 720 560M780 230 620 540M780 230 520 510M780 230 480 430M780 230 480 330M780 230 480 230M780 230 480 130M780 230 480 30M780 230 520-70M780 230 620-100M780 230 720-120M780 230 840-120M780 230 940-100M780 230 1040-70M780 230 1080-30"/>
      </g>
      <g class="gc-banner__orbite" fill="none">
        <ellipse cx="740" cy="210" rx="280" ry="120" stroke="#9d00ff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 16" transform="rotate(-18 740 210)"/>
        <ellipse cx="740" cy="210" rx="210" ry="84" stroke="#ccff00" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="2 10" transform="rotate(16 740 210)"/>
        <circle cx="740" cy="210" r="170" stroke="#71c2d9" stroke-opacity=".18" stroke-width="1"/>
      </g>
      <g class="gc-banner__strisce">
        <path d="M-300 470 240-50 330-50-210 470Z" fill="url(#gcb-striscia)"/>
        <path d="M-160 470 380-50 410-50-130 470Z" fill="url(#gcb-striscia)" opacity=".65"/>
        <path d="M640 470 1180-50 1210-50 670 470Z" fill="url(#gcb-striscia)" opacity=".4"/>
      </g>
      <g class="gc-banner__stelle" fill="#ccff00">
        <use href="#gcb-stella" transform="translate(86 312) scale(1.15)" style="--d:0s"/>
        <use href="#gcb-stella" transform="translate(242 70) scale(.7)" style="--d:-1.2s"/>
        <use href="#gcb-stella" transform="translate(880 92) scale(1.3)" style="--d:-2.4s"/>
        <use href="#gcb-stella" transform="translate(936 348) scale(.8)" style="--d:-.6s"/>
        <use href="#gcb-stella" transform="translate(620 380) scale(.6)" style="--d:-3.1s"/>
      </g>
      <g fill="#c773ff"><circle cx="900" cy="390" r="2.4" opacity=".8"/><circle cx="820" cy="70" r="1.8" opacity=".7"/><circle cx="300" cy="380" r="2" opacity=".55"/><circle cx="70" cy="200" r="1.6" opacity=".5"/></g>
    </svg>
    <div class="gc-banner__contenuto">
      <div class="gc-banner__marchio">
        <h2 class="gc-banner__logo" aria-label="${esc(NOME)}">
          <span class="gc-banner__riga" aria-hidden="true">${lettere("Giugnoh's")}</span>
          <span class="gc-banner__riga gc-banner__riga--2" aria-hidden="true">${lettere('Cast')}</span>
        </h2>
        <p class="gc-banner__cast" aria-label="${esc(red.map((r) => r.soprannome || r.nome).join(', '))}"><b>${nomi}</b></p>
      </div>
      <div class="gc-banner__cup" aria-hidden="true">${cupSvg()}</div>
      <div class="gc-banner__ep">
        <span class="gc-banner__n">EP ${n}</span>
        ${titoloHtml ? `<p class="gc-banner__titolo">${titoloHtml}</p>` : ''}
        ${spett ? `<div class="gc-banner__dati"><span class="gc-banner__ieri">${esc(t.ieri)}</span><b>${spett}</b><span class="gc-banner__spett">${esc(t.spettatori)}</span></div>` : ''}
      </div>
    </div>
  </section>`
}

function cupSvg() {
  return `<svg class="gc-cup" viewBox="0 0 440 340" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="gcb-cup" x1="120" y1="70" x2="260" y2="290" gradientUnits="userSpaceOnUse"><stop stop-color="#fffdf4"/><stop offset=".55" stop-color="#f2ead7"/><stop offset="1" stop-color="#d5c8ad"/></linearGradient>
      <linearGradient id="gcb-cup2" x1="150" y1="80" x2="280" y2="280" gradientUnits="userSpaceOnUse"><stop stop-color="#e7dcc2"/><stop offset="1" stop-color="#c3b495"/></linearGradient>
      <linearGradient id="gcb-lean" x1="140" y1="60" x2="250" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#e39cff"/><stop offset=".45" stop-color="#9d00ff"/><stop offset="1" stop-color="#5c0096"/></linearGradient>
      <linearGradient id="gcb-straw" x1="260" y1="30" x2="240" y2="130" gradientUnits="userSpaceOnUse"><stop stop-color="#ff8ec7"/><stop offset=".5" stop-color="#eb459e"/><stop offset="1" stop-color="#ff3d4a"/></linearGradient>
      <radialGradient id="gcb-alone" cx=".5" cy=".5" r=".5"><stop stop-color="#9d00ff" stop-opacity=".55"/><stop offset=".55" stop-color="#9d00ff" stop-opacity=".14"/><stop offset="1" stop-color="#9d00ff" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="gc-cup__alone" cx="220" cy="170" rx="168" ry="158" fill="url(#gcb-alone)"/>
    <ellipse class="gc-cup__ombra" cx="214" cy="294" rx="116" ry="18" fill="#050207" opacity=".75"/>
    <g class="gc-cup__corpo">
      <path d="M264 30 244 126" stroke="#0b090e" stroke-width="17" stroke-linecap="round"/>
      <path d="M264 30 244 126" stroke="url(#gcb-straw)" stroke-width="11" stroke-linecap="round"/>
      <path d="M258 60 252 90" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <path d="M140 78 163 268Q165 283 180 283L242 283Q257 283 259 268L282 78Z" fill="url(#gcb-cup2)" stroke="#0b090e" stroke-width="7" stroke-linejoin="round"/>
      <path d="M118 78 142 268Q144 284 160 284L220 284Q236 284 238 268L262 78Z" fill="url(#gcb-cup)" stroke="#0b090e" stroke-width="7" stroke-linejoin="round"/>
      <ellipse cx="190" cy="78" rx="72" ry="18" fill="#f8f2e3" stroke="#0b090e" stroke-width="7"/>
      <ellipse cx="190" cy="82" rx="58" ry="12" fill="#5c0096"/>
      <ellipse cx="190" cy="79" rx="58" ry="12" fill="url(#gcb-lean)"/>
      <ellipse cx="190" cy="79" rx="58" ry="12" fill="none" stroke="#ccff00" stroke-width="2" opacity=".55"/>
      <g class="gc-cup__liquido">
        <rect x="160" y="66" width="22" height="20" rx="4" transform="rotate(-18 171 76)" fill="#e8fbff" stroke="#8ad9e8" stroke-width="2"/>
        <rect x="195" y="68" width="18" height="16" rx="4" transform="rotate(14 204 76)" fill="#e8fbff" stroke="#8ad9e8" stroke-width="2"/>
        <rect x="212" y="73" width="14" height="14" rx="3" transform="rotate(-28 219 80)" fill="#f4feff" stroke="#8ad9e8" stroke-width="2" opacity=".9"/>
      </g>
      <path d="M130 96Q136 112 129 122" stroke="#9d00ff" stroke-width="7" stroke-linecap="round"/>
      <path d="M252 98Q246 116 253 126" stroke="#9d00ff" stroke-width="6" stroke-linecap="round" opacity=".8"/>
      <path d="M126 118Q190 130 254 118" stroke="#d4c8ae" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <path d="M132 156Q190 168 248 156" stroke="#d4c8ae" stroke-width="4" stroke-linecap="round" opacity=".55"/>
      <path d="M138 194Q190 205 242 194" stroke="#d4c8ae" stroke-width="4" stroke-linecap="round" opacity=".35"/>
      <path d="M184 138 162 184 182 184 172 224 206 168 186 168 198 138Z" fill="#ccff00" stroke="#0b090e" stroke-width="5" stroke-linejoin="round"/>
      <path d="M148 100Q142 150 152 228" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".38"/>
    </g>
    <g class="gc-cup__pozza"><ellipse cx="398" cy="326" rx="50" ry="12" fill="#9d00ff" opacity=".85"/><ellipse cx="398" cy="322" rx="30" ry="6" fill="#d66bff" opacity=".95"/></g>
    <g class="gc-cup__flusso"><path d="M394 264C414 292 410 314 398 328" stroke="#6a00ad" stroke-width="20" stroke-linecap="round"/><path d="M394 264C414 292 410 314 398 328" stroke="#9d00ff" stroke-width="14" stroke-linecap="round"/><path d="M394 266C410 291 406 311 398 324" stroke="#e39cff" stroke-width="5" stroke-linecap="round"/></g>
    <g class="gc-cup__gocce">
      <circle class="g1" cx="402" cy="282" r="8"/><circle class="g2" cx="414" cy="296" r="6"/><circle class="g3" cx="390" cy="304" r="5"/>
    </g>
  </svg>`
}

function votoHtml(t, voto) {
  const ore = PODCAST.voto?.ogniOre || 6
  const stelle = Number(voto?.stelle) || 0
  const resta = voto ? Math.max(0, Number(voto.quando) + ore * 3600_000 - Date.now()) : 0
  const bloccato = resta > 0
  const stella = (n) => `<button type="button" role="radio" aria-checked="${stelle === n}" aria-label="${esc(t.stella(n))}" data-voto="${n}" class="${n <= stelle ? 'is-on' : ''}" style="--n:${n}" ${bloccato ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6 3.3 1.3-6.7-5-4.7 6.8-.8z"/></svg></button>`
  const nota = resta > 0 ? `${t.votoFatto(stelle)} · ${t.votoAttesa(tempo(resta / 1000))}` : t.votoNota
  return `<section class="gc-voto" data-voto-box aria-label="${esc(t.voto)}">
    <span class="gc-chip gc-chip--lime">${esc(t.voto)}</span>
    <div class="gc-voto__corpo">
      <p class="gc-voto__domanda">${esc(t.votoDomanda)}</p>
      <div class="gc-stelle" role="radiogroup" aria-label="${esc(t.votoDomanda)}">${[1, 2, 3, 4, 5].map(stella).join('')}</div>
      <p class="gc-voto__nota" data-voto-nota>${esc(nota)}</p>
      <p class="gc-voto__libera">${esc(t.votoSenza)}</p>
    </div>
  </section>`
}

function prossimaHtml(cal, t, ctx) {
  const adesso = Date.now(), palco = PODCAST.nomePalco || 'OLLARE'
  const ext = ctx.I?.ext || ''
  if (cal.onda) {
    const p = cal.onda
    return `<section class="gc-prossima gc-prossima--onda" aria-label="${esc(`${t.inOnda}: ${nomePuntata(p)}`)}">
      <span class="gc-chip gc-chip--rosso"><i class="gc-rec"></i>${esc(t.inOnda)}</span>
      <h3 class="gc-prossima__titolo">${esc(nomePuntata(p))}</h3>
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
    return `<section class="gc-prossima" aria-label="${esc(`${t.prossima}: ${nomePuntata(p)}, ${quando(p.a, adesso, t, ctx.locale)}`)}">
      <span class="gc-chip">${esc(t.prossima)}</span>
      <h3 class="gc-prossima__titolo">${esc(nomePuntata(p))}</h3>
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
  if (cal.rimandata) {
    const p = cal.rimandata
    return `<section class="gc-prossima gc-prossima--rimandata" aria-label="${esc(`${nomePuntata(p)}: ${t.rimandata}, ${t.aData}`)}">
      <span class="gc-chip gc-chip--ambra">${esc(t.rimandata)}</span>
      <h3 class="gc-prossima__titolo">${esc(`EP ${p.n}`)}</h3>
      <p class="gc-prossima__quando gc-prossima__quando--data">${esc(t.aData)}</p>
      <div class="gc-azioni">
        <a class="gc-unisciti" href="${esc(PODCAST.invito)}" target="_blank" rel="noopener noreferrer">${esc(t.entra)}<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg></a>
        <a class="gc-palco" href="${esc(PODCAST.palco)}" target="_blank" rel="noopener noreferrer">${esc(t.apriPalco)} ${esc(palco)} ${ext}</a>
      </div>
      <p class="gc-nota">${esc(t.notaRimandata)}</p>
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
  const sop = r.soprannome || r.nome
  return `<li><button type="button" class="gc-red${c.neutro ? ' gc-red--neutro' : ''}" data-gc-red="${i}" style="${c.css}" aria-haspopup="dialog" aria-label="${esc(`${t.apri(r.nome)} · ${t.castTag(sop)}`)}">
    <span class="gc-red__banner">${banner ? `<img src="${esc(banner)}"${anim ? ` data-anim="${esc(anim)}"` : ''} alt="" loading="lazy" decoding="async" draggable="false">` : ''}</span>
    <span class="gc-red__av"><img class="gc-red__img" src="${esc(percorso(f.avatar) || '/me.png')}" alt="" width="72" height="72" loading="lazy" decoding="async" draggable="false">${deco ? `<img class="gc-red__deco" src="${esc(deco)}"${decoAnim ? ` data-anim="${esc(decoAnim)}"` : ''} alt="" loading="lazy" decoding="async" draggable="false">` : ''}</span>
    <span class="gc-red__sop">${esc(sop)}</span>
    ${r.nome && r.nome !== sop ? `<span class="gc-red__nome${n.font ? ' is-font' : ''}${largo(r.nome) ? ' is-largo' : ''}" style="${n.css}">${esc(r.nome)}</span>` : ''}
    <span class="gc-red__user">@${esc(r.username)}</span>
    ${r.gilda?.tag ? `<span class="gc-red__tag">${percorso(r.gilda.stemma) ? `<img src="${esc(percorso(r.gilda.stemma))}" alt="" width="14" height="14">` : ''}${esc(r.gilda.tag)}</span>` : ''}
  </button></li>`
}

function puntataHtml(p, cal, t, loc) {
  const rimandata = !!p.rimandata
  const stato = rimandata ? 'rimandata' : cal.onda === p ? 'onda' : p.f <= Date.now() ? 'andata' : 'arrivo'
  const etichetta = { onda: t.ora, andata: t.andata, arrivo: t.inArrivo, rimandata: t.rimandata }[stato]
  const orari = rimandata ? '' : p.fine ? `${oraDi(p.a)} → ${oraDi(p.f)}` : `${oraDi(p.a)}`
  const durata = !rimandata && p.fine ? ` · ${t.durata(Math.round((p.f - p.a) / MIN))}` : ''
  const spett = Number(p.spettatori ?? (p.n === 1 ? PODCAST.spettatoriIeri : 0)) || 0
  const icona = stato === 'onda' ? '<i class="gc-rec"></i>' : stato === 'andata' ? '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : stato === 'rimandata' ? '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>' : ''
  return `<li class="gc-ep gc-ep--${stato}">
    <span class="gc-ep__n">#${p.n}</span>
    <div class="gc-ep__testo">
      <div class="gc-ep__titolo"><b>${esc(nomePuntata(p))}</b>${spett ? `<span class="gc-ep__spett"><b>${spett}</b>${esc(t.spettatori)}<em>${esc(t.ieri)}</em></span>` : ''}</div>
      <div class="gc-ep__riga">${rimandata ? `<b>${esc(t.aData)}</b>` : `<b>${esc(dataBreve(p.a, loc))}</b><span>${orari}${durata}</span>`}<em class="gc-ep__stato">${icona}${esc(etichetta)}</em></div>
    </div>
  </li>`
}

// ─── il nastro in basso: la puntata, i redattori, i numeri di ieri, il voto ───
function nastro(root, cal, t, red) {
  const s = root.querySelector('[data-scorre]')
  if (!s) return
  const pezzi = [`<span class="m">${esc(NOME)}</span>`]
  if (cal.onda) pezzi.push(`<span>${esc(nomePuntata(cal.onda))} · ${esc(t.inOnda)}</span>`)
  else if (cal.prossima) pezzi.push(`<span>${esc(nomePuntata(cal.prossima))} · ${esc(quando(cal.prossima.a, Date.now(), t, 'it-IT'))}</span>`)
  else if (cal.rimandata) pezzi.push(`<span>EP ${cal.rimandata.n} · ${esc(t.rimandata)} · ${esc(t.aData)}</span>`)
  pezzi.push(`<span>${esc(PODCAST.nomePalco || 'OLLARE')}</span>`)
  pezzi.push(`<span>${esc(t.redattori)}: ${red.map((r) => esc(r.soprannome || r.nome)).join(' · ')}</span>`)
  for (const p of [...cal.passate].reverse()) {
    pezzi.push(`<span>${esc(nomePuntata(p))}</span>`)
    if (p.spettatori) pezzi.push(`<span>${p.spettatori} ${esc(t.spettatori)} · ${esc(t.ieri)}</span>`)
  }
  pezzi.push(`<span>${esc(t.voto)} · ${esc(t.votoNota)}</span>`)
  pezzi.push('<span>pzkko.it</span>')
  const h = `${pezzi.join('<i></i>')}<i></i>`
  s.innerHTML = h + h // due volte: scorre in tondo senza salti
  requestAnimationFrame(() => { s.style.setProperty('--durata', `${Math.max(24, s.scrollWidth / 2 / 46).toFixed(1)}s`) })
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
          ${r.soprannome ? `<p class="gcp-sop">${esc(t.castTag(r.soprannome))}</p>` : ''}
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
          <div class="box gcp-cast"><span class="gcp-cast__logo">${esc(NOME)}</span><span class="gcp-cast__sop">${esc(r.soprannome || r.nome)}</span><span class="gcp-cast__ruolo">${esc(t.ruolo)}${prima ? ` · ${esc(t.dalla(prima.n, new Intl.DateTimeFormat(ctx.locale, { timeZone: TZ, day: 'numeric', month: 'short' }).format(prima.a)))}` : ''}</span></div>
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
