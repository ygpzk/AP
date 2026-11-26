// La scheda social della bacheca: un solo motore per due vesti, Instagram
// (ig.js) e TikTok (tt.js). È il codice nato per la scheda Instagram (24.11,
// vedi design/instagram-bacheca.md), spostato qui il 26.11 perché la scheda
// TikTok sia la stessa dashboard: stessa colonna dei profili, stessi numeri,
// stesse tessere che si sfogliano, stesso visualizzatore. Cambiano solo i dati,
// i testi, i colori (la classe della piattaforma in site.css) e gli sfondi.
//
// Ogni piattaforma passa a crea() la sua configurazione:
//   id        'ig' | 'tt' (prefisso degli id nel markup)
//   nome      'Instagram' | 'TikTok'
//   classe    classe in più sulla scheda e sul visualizzatore ('' per Instagram)
//   base      dove stanno i media ('/media/ig')
//   glifo     il tracciato SVG del marchio (icons.js)
//   marchio   (facoltativo) l'HTML del quadratino in cima alla colonna
//   testi     { it, en } (le altre lingue usano l'inglese)
//   mazzi(acc, lang, t)   le tessere: [{ items, n, viva, titolo, voce, meta, faccia }]
//   numeri(acc, lang, t)  la riga sotto i follower: [[numero, etichetta], …]
//   link(acc)             il profilo, per il visualizzatore
//   sfondi()              import() del modulo degli sfondi vivi
//
// Un elemento del mazzo (items) è { id, type: 'photo'|'video', src, w, h, at,
// durata } come le storie di Instagram, più tre campi facoltativi per il
// visualizzatore: chi (l'autore, al posto del titolo), nota (accanto al
// contatore), link e linkTesto (il collegamento in basso, al posto del profilo).
//
// I dati sono quelli che i raccoglitori sul pc scrivono in <base>/index.json:
// qui non si chiama nessun social e non si chiede nessun account a chi guarda.

const ext = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`
const lock = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`
const closeIco = (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`
const leftIco = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>`
const rightIco = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`
const playIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`
const pauseIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
const audioIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`
const mutoIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>`
const dadoIco = (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><g fill="currentColor" stroke="none"><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/></g></svg>`
export const glifo = (path, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const LOCALE = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', ru: 'ru-RU', ja: 'ja-JP', zh: 'zh-CN' }
export const locale = (lang) => LOCALE[lang] || 'en-US'

// «1.667» e non «1667»: in italiano le migliaia a quattro cifre restano attaccate, qui no
export const numero = (n, lang) => new Intl.NumberFormat(locale(lang), { useGrouping: 'always' }).format(Number(n) || 0)
// «1,6 Mln», «757,2K»: per le visualizzazioni dei singoli video
export const corto = (n, lang) => {
  const v = Number(n) || 0
  return v < 10000 ? numero(v, lang) : new Intl.NumberFormat(locale(lang), { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}
const dataIt = (iso, lang) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}
export const relativo = (iso, lang) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' })
  const passi = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [unita, secondi] of passi) {
    if (Math.abs(sec) >= secondi) return rtf.format(Math.round(sec / secondi), unita)
  }
  return rtf.format(sec, 'second')
}
const scaduta = (s) => {
  const fine = Date.parse(s?.until || '') || (Date.parse(s?.at || '') + 24 * 3600 * 1000)
  return Number.isFinite(fine) && Date.now() > fine
}
// le storie di oggi: il client le ignora oltre le 24 ore (o oltre «until») anche se il JSON è vecchio
export const storieBuone = (acc) => (acc?.stories || []).filter((s) => !scaduta(s))

export const giorno = (iso, lang) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}
// una storia di oggi si legge «3 ore fa», una in evidenza con la sua data
const quando = (iso, lang) => {
  const d = Date.parse(iso || '')
  if (!Number.isFinite(d)) return ''
  return Date.now() - d < 24 * 3600 * 1000 ? relativo(iso, lang) : giorno(iso, lang)
}
export const anni = (items) => {
  const a = items.map((x) => new Date(x.at).getFullYear()).filter(Number.isFinite)
  if (!a.length) return ''
  const da = Math.min(...a), fino = Math.max(...a)
  return da === fino ? String(da) : `${da}–${String(fino).slice(-2)}`
}
export const ultimaFoto = (items) => items.findLast?.((x) => x.type === 'photo')?.src || ''

// l'andamento vero degli ultimi sette giorni: si parte dall'ultimo valore
// noto prima della finestra, non dai primi quaranta punti qualsiasi
function andamento(history, lang, t) {
  const punti = (history || [])
    .map((p) => ({ t: Date.parse(p.t), f: Number(p.f) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.f))
    .sort((a, b) => a.t - b.t)
  if (punti.length < 2) return ''
  const soglia = Date.now() - 7 * 24 * 3600 * 1000
  let primo = 0
  punti.forEach((p, i) => { if (p.t <= soglia) primo = i })
  const serie = punti.slice(primo)
  if (serie.length < 2) return ''
  const valori = serie.map((p) => p.f)
  const min = Math.min(...valori), max = Math.max(...valori)
  const larg = 64, alt = 18, pad = 2
  const t0 = serie[0].t, t1 = serie.at(-1).t
  const x = (p) => pad + (t1 === t0 ? 0 : (p.t - t0) / (t1 - t0)) * (larg - pad * 2)
  const y = (v) => (max === min ? alt / 2 : pad + (1 - (v - min) / (max - min)) * (alt - pad * 2))
  const d = serie.map((p, i) => `${i ? 'L' : 'M'}${x(p).toFixed(1)} ${y(p.f).toFixed(1)}`).join(' ')
  const delta = valori.at(-1) - valori[0]
  const segno = delta > 0 ? '+' : ''
  return `<span class="igc__trend ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}" title="${esc(`${numero(valori[0], lang)} → ${numero(valori.at(-1), lang)}`)}">
      <svg viewBox="0 0 ${larg} ${alt}" width="${larg}" height="${alt}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <b>${segno}${numero(delta, lang)}</b> <span>${esc(t.settimana)}</span>
    </span>`
}

const righe = (pezzi) => pezzi.map((x) => `<span>${esc(x)}</span>`).join('')

const SEG_MAX = 48
const STATO = new WeakMap()
const SFONDI = new WeakMap()
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
// un visualizzatore alla volta, qualunque sia la scheda che lo apre
let vista = null

export function crea(P) {
  const T = (lang) => P.testi[lang] || P.testi.en
  const ico = (s = 18) => glifo(P.glifo, s)
  const media = (p) => `${P.base}/${p}`
  const idPan = `${P.id}-pan`

  let cache = null
  let cacheAt = 0
  let richiesta = null
  // il profilo scelto resta quello anche se la bacheca viene ridisegnata
  // (cambio di scheda o di lingua); non sta sul nodo della scheda, che contiene
  // i pulsanti dei profili: un closest('[data-ig-acc]') lo scambierebbe per uno di loro
  let scelto = ''

  async function dati(forza = false) {
    if (!forza && cache && Date.now() - cacheAt < 60_000) return cache
    if (!forza && richiesta) return richiesta
    richiesta = fetch(`${P.base}/index.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j) => {
        cache = j
        cacheAt = Date.now()
        return j
      })
      .finally(() => { richiesta = null })
    return richiesta
  }

  // ── la scheda ─────────────────────────────────────────────────────────────
  // Un palco dentro la bacheca: a sinistra i profili come la colonna dei server
  // di Discord, al centro i follower in Ginto Nord col gradiente della
  // piattaforma, a destra le tessere 9:16 con le loro barre vere (una per
  // elemento). Passando sopra una tessera la si sfoglia; il clic apre il
  // visualizzatore dall'elemento che si sta guardando.

  function avatar(acc, px, classe = '') {
    const src = acc?.avatar ? media(acc.avatar) : ''
    const iniziale = esc((acc?.name || acc?.username || '?').trim().slice(0, 1))
    return src
      ? `<img class="${classe}" src="${esc(src)}" alt="" width="${px}" height="${px}" loading="lazy" decoding="async" draggable="false">`
      : `<span class="igc__fallback ${classe}" style="--igpx:${px}px" aria-hidden="true">${iniziale}</span>`
  }

  function tessera(k, m) {
    const segs = Math.min(m.n, SEG_MAX)
    const faccia = m.faccia
      ? `<img class="igc__rest" src="${esc(media(m.faccia))}" alt="" loading="lazy" decoding="async" draggable="false">`
      : `<span class="igc__rest igc__rest--vuoto" aria-hidden="true">${ico(26)}</span>`
    return `<button type="button" class="igc__tile ${m.viva ? 'igc__tile--live' : ''}" data-ig-tile="${k}" aria-label="${esc(`${m.voce} · ${m.meta.join(' · ')}`)}">
        <span class="igc__face">
          ${faccia}
          <span class="igc__scrub" aria-hidden="true"></span>
          <span class="igc__segs ${segs > 26 ? 'is-fitte' : ''}" aria-hidden="true">${'<i></i>'.repeat(segs)}</span>
          <span class="igc__cap" aria-hidden="true"><b>${esc(m.titolo)}</b><span data-ig-meta>${righe(m.meta)}</span></span>
        </span>
      </button>`
  }

  const marchio = () => `${P.marchio ? P.marchio() : `<span class="igc__home" aria-hidden="true">${ico(22)}</span>`}<span class="igc__sep" aria-hidden="true"></span>`

  function railHtml(accounts, acc, lang) {
    const uno = accounts.length < 2
    const voci = accounts.map((a) => {
      const on = a.username === acc.username
      const dentro = `<span class="igc__srv-in">${avatar(a, 40)}</span>`
      const etichetta = esc(`${a.name || a.username} @${a.username}`)
      return uno
        ? `<span class="igc__srv is-on" data-tip="@${esc(a.username)}">${dentro}</span>`
        : `<button type="button" class="igc__srv ${on ? 'is-on' : ''}" role="tab" id="${P.id}-tab-${esc(a.username)}" aria-controls="${idPan}" aria-selected="${on}" tabindex="${on ? 0 : -1}" aria-label="${etichetta}" data-tip="@${esc(a.username)}" data-ig-acc="${esc(a.username)}">${dentro}</button>`
    }).join('')
    return `<div class="igc__rail" data-ig-rail="${esc(accounts.map((a) => a.username).join(' '))}">
        ${marchio()}
        <div class="igc__srvs" ${uno ? '' : `role="tablist" aria-orientation="vertical" aria-label="${esc(T(lang).profili)}"`}>${voci}</div>
        <button type="button" class="igc__dado" data-ig-dado aria-label="${esc(T(lang).cambiaSfondo)}" data-tip="${esc(T(lang).cambiaSfondo)}">${dadoIco()}</button>
      </div>`
  }

  function mainHtml(j, acc, lista, lang) {
    const t = T(lang)
    const stats = acc.stats || {}
    const aggiornato = acc.synced || j.updated
    const bio = (acc.bio || []).map((r) => esc(r)).join('<br>')
    // il nome, se c'è e non è l'account stesso; altrimenti il titolo è @account
    const nome = acc.name && acc.name !== acc.username ? acc.name : ''
    const follower = numero(stats.followers, lang)
    const viva = lista[0]?.viva
    const evidenze = lista.filter((m) => !m.viva).length

    const ava = viva
      ? `<button type="button" class="igc__ava has-story" data-ig-tile="0" aria-label="${esc(t.storieDi(acc.username))}">${avatar(acc, 56)}</button>`
      : `<span class="igc__ava">${avatar(acc, 56)}</span>`

    const mazzo = lista.length
      ? `<div class="igc__deck">${lista.map((m, k) => tessera(k, m)).join('')}</div>
         <p class="igc__hint"><span class="igc__hint-m">${esc(t.sfoglia)}</span><span class="igc__hint-t">${esc(t.tocca)}</span></p>`
      : `<p class="igc__niente">${esc(t.nessunaEvidenza)}</p>`

    const numeri = P.numeri(acc, lang, t).map(([n, nomeN]) => `<span><b>${numero(n, lang)}</b> ${esc(nomeN)}</span>`).join('')

    return `<div class="igc__kick">
        <span class="igc__kick-a"><i aria-hidden="true"></i>${esc(t.profilo)}${acc.private ? `<span class="igc__priv">${lock(11)}${esc(t.privato)}</span>` : ''}</span>
        <span class="igc__kick-b">${esc(t.controllato)}</span>
      </div>
      <div class="igc__me">
        <div class="igc__id">
          ${ava}
          <div class="igc__idt">
            ${nome ? `<div class="igc__name">${esc(nome)}</div>` : ''}
            <a class="igc__user${nome ? '' : ' igc__user--solo'}" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me">@${esc(acc.username)}</a>
          </div>
        </div>
        ${bio ? `<div class="igc__bio">${bio}</div>` : ''}
        <div class="igc__big">
          <div class="igc__num" data-len="${Math.min(follower.length, 9)}">${follower}</div>
          <div class="igc__numl"><span>${esc(t.follower)}</span>${andamento(acc.history, lang, t)}</div>
        </div>
        <div class="igc__stats">${numeri}</div>
        <a class="igc__go" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me">${ico(16)}<span>${esc(t.apri)}</span>${ext(12)}</a>
      </div>
      <div class="igc__hl">
        <div class="igc__hl-head"><span>${esc(t.evidenze)}</span><span>${evidenze}</span></div>
        ${mazzo}
      </div>
      <div class="igc__foot">
        <span>${esc(t.privacy)}</span>
        <span class="igc__meta"><i aria-hidden="true"></i>${esc(t.aggiornato)} ${esc(relativo(aggiornato, lang))}${aggiornato ? ` · ${esc(dataIt(aggiornato, lang))}` : ''}</span>
      </div>`
  }

  const guscio = (testo) => `<div class="igc__in"><div class="igc__rail">${marchio()}</div><div class="igc__main igc__main--solo"><p class="igc__vuoto">${esc(testo)}</p></div></div>`
  const scheletro = () => `<div class="igc__in igc__in--attesa" aria-hidden="true"><div class="igc__rail">${marchio()}<span class="igc__osso igc__osso--srv"></span><span class="igc__osso igc__osso--srv"></span></div><div class="igc__main"><span class="igc__osso igc__osso--a"></span><span class="igc__osso igc__osso--b"></span><span class="igc__osso igc__osso--c"></span><span class="igc__osso igc__osso--d"></span></div></div>`

  function dipingi(root, j, lang, nota = '') {
    const accounts = (j?.accounts || []).filter((a) => a && a.username)
    if (!accounts.length) {
      STATO.delete(root)
      root.innerHTML = guscio(T(lang).vuoto)
      return
    }
    const acc = accounts.find((a) => a.username === scelto) || accounts[0]
    const lista = P.mazzi(acc, lang, T(lang))
    STATO.set(root, { acc, lista })
    const dentro = mainHtml(j, acc, lista, lang)
    const rail = root.querySelector('.igc__rail')
    const main = root.querySelector(`#${idPan}`)
    // stessi profili di prima: si aggiorna sul posto, così la tacca bianca
    // scorre da un profilo all'altro e il fuoco della tastiera non si perde
    if (rail && main && rail.dataset.igRail === accounts.map((a) => a.username).join(' ') && main.dataset.igLang === lang) {
      for (const b of rail.querySelectorAll('[data-ig-acc]')) {
        const on = b.dataset.igAcc === acc.username
        b.classList.toggle('is-on', on)
        b.setAttribute('aria-selected', String(on))
        b.tabIndex = on ? 0 : -1
      }
      main.innerHTML = dentro
    } else {
      root.innerHTML = `<div class="igc__in">${railHtml(accounts, acc, lang)}<div class="igc__main" id="${idPan}" data-ig-lang="${esc(lang)}">${dentro}</div></div>`
    }
    const pan = root.querySelector(`#${idPan}`)
    if (accounts.length > 1) {
      pan.setAttribute('role', 'tabpanel')
      pan.setAttribute('aria-labelledby', `${P.id}-tab-${acc.username}`)
    }
    if (nota) root.querySelector('.igc__meta')?.insertAdjacentHTML('beforeend', ` <span class="igc__stale">· ${esc(nota)}</span>`)
  }

  // ── lo sfondo vivo ────────────────────────────────────────────────────────
  // Il modulo arriva dopo la scheda, così non la rallenta; la tela segue il
  // palco quando viene ridisegnato.

  function dado(root) {
    const b = root.querySelector('[data-ig-dado]')
    const s = SFONDI.get(root)
    if (!b || !s) return
    const lang = root.dataset.igLang || 'it'
    const t = T(lang)
    const nome = s.nome(lang)
    const testo = s.stato.aCaso ? t.sfondoCaso(nome) : t.sfondoOra(s.stato.ora, nome)
    b.dataset.tip = testo
    b.setAttribute('aria-label', `${t.cambiaSfondo}. ${testo}`)
  }

  function sfondo(root) {
    const dentro = root.querySelector('.igc__in:not(.igc__in--attesa)')
    if (!dentro) return
    const s = SFONDI.get(root)
    if (s) { s.sposta(dentro); return dado(root) }
    if (root._igSfondo) return
    root._igSfondo = P.sfondi()
      .then((m) => {
        const casa = root.querySelector('.igc__in:not(.igc__in--attesa)')
        if (!casa || !root.isConnected) { root._igSfondo = null; return }
        SFONDI.set(root, m.accendi(casa, { quandoCambia: () => dado(root) }))
        dado(root)
      })
      .catch(() => { root._igSfondo = null })
  }

  // ── sfogliare una tessera ─────────────────────────────────────────────────
  // Il puntatore che attraversa la tessera scorre gli elementi del mazzo: la
  // barra si accende subito, la foto arriva dopo un attimo di sosta (così
  // attraversare la scheda di passaggio non scarica niente).

  function punta(root, tile, k, lang) {
    const m = STATO.get(root)?.lista?.[Number(tile.dataset.igTile)]
    if (!m?.items?.length) return
    k = Math.max(0, Math.min(m.items.length - 1, k))
    if (tile._igK === k) return
    tile._igK = k
    tile.classList.add('is-sfoglia')
    const segs = [...tile.querySelectorAll('.igc__segs i')]
    const acceso = Math.floor((k * segs.length) / m.items.length)
    segs.forEach((s, i) => s.classList.toggle('on', i <= acceso))
    const it = m.items[k]
    const meta = tile.querySelector('[data-ig-meta]')
    if (meta) meta.innerHTML = righe([`${k + 1}/${m.items.length}`, it.chi || quando(it.at, lang)].filter(Boolean))
    clearTimeout(tile._igT)
    tile._igT = setTimeout(() => {
      const scrub = tile.querySelector('.igc__scrub')
      if (!scrub || tile._igK !== k) return
      const metti = (el) => { if (tile._igK === k && tile.isConnected) scrub.replaceChildren(el) }
      if (it.type === 'video') {
        const v = document.createElement('video')
        v.muted = true
        v.loop = true
        v.playsInline = true
        v.setAttribute('playsinline', '')
        v.preload = reduced() ? 'metadata' : 'auto'
        v.src = media(it.src)
        v.addEventListener('loadeddata', () => { metti(v); if (!reduced()) v.play().catch(() => {}) }, { once: true })
      } else {
        const img = new Image()
        img.alt = ''
        img.draggable = false
        img.decoding = 'async'
        img.src = media(it.src)
        img.decode().then(() => metti(img)).catch(() => {})
      }
    }, 90)
  }

  function riposa(root, tile) {
    if (tile._igK == null || tile._igK < 0) return
    clearTimeout(tile._igT)
    tile._igK = -1
    tile.classList.remove('is-sfoglia')
    tile.querySelector('.igc__scrub')?.replaceChildren()
    for (const s of tile.querySelectorAll('.igc__segs i.on')) s.classList.remove('on')
    const meta = tile.querySelector('[data-ig-meta]')
    const m = STATO.get(root)?.lista?.[Number(tile.dataset.igTile)]
    if (meta && m) meta.innerHTML = righe(m.meta)
  }

  function collega(root) {
    const lingua = () => root.dataset.igLang || 'it'
    const tessere = (e) => e.target.closest?.('.igc__tile')

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-ig-dado]')) return SFONDI.get(root)?.aCaso()
      const accBtn = e.target.closest('.igc__srv[data-ig-acc]')
      if (accBtn) {
        if (accBtn.dataset.igAcc === STATO.get(root)?.acc?.username) return
        scelto = accBtn.dataset.igAcc
        return disegna(root, lingua())
      }
      const tile = e.target.closest('[data-ig-tile]')
      if (tile) {
        const s = STATO.get(root)
        const m = s?.lista?.[Number(tile.dataset.igTile)]
        if (m?.items?.length) apri(s.acc, m.items, m.voce, lingua(), tile._igK > 0 ? tile._igK : 0, m.titolo)
      }
    })

    root.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      const tile = tessere(e)
      if (!tile) return
      const r = tile.getBoundingClientRect()
      const n = STATO.get(root)?.lista?.[Number(tile.dataset.igTile)]?.items?.length || 0
      if (n && r.width) punta(root, tile, Math.floor(((e.clientX - r.left) / r.width) * n), lingua())
    })
    root.addEventListener('pointerout', (e) => {
      const tile = tessere(e)
      if (tile && !tile.contains(e.relatedTarget)) riposa(root, tile)
    })
    root.addEventListener('focusout', (e) => {
      const tile = tessere(e)
      if (tile) riposa(root, tile)
    })

    root.addEventListener('keydown', (e) => {
      const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
      if (!passo) return
      const tab = e.target.closest('.igc__srv[data-ig-acc]')
      if (tab) {
        const tutti = [...root.querySelectorAll('.igc__srv[data-ig-acc]')]
        const prossimo = tutti[(tutti.indexOf(tab) + passo + tutti.length) % tutti.length]
        if (!prossimo || prossimo === tab) return
        e.preventDefault()
        prossimo.focus({ preventScroll: true })
        prossimo.click()
        return
      }
      const tile = tessere(e)
      if (tile && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        punta(root, tile, (tile._igK ?? -1) < 0 ? 0 : tile._igK + passo, lingua())
      }
    })
  }

  // ── il visualizzatore ─────────────────────────────────────────────────────

  function apri(acc, items, titolo, lang, partenza = 0, etichetta = '') {
    if (!items?.length) return
    vista?.()
    const t = T(lang)
    const vecchioFocus = document.activeElement
    const scroll = document.documentElement.style.overflow
    const root = document.createElement('div')
    root.className = `igv${P.classe ? ` igv--${P.id}` : ''}`
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')
    root.setAttribute('aria-label', titolo)
    root.innerHTML = `<div class="igv__bg" data-ig-chiudi><i class="igv__amb" data-ig-amb></i></div>
      <button type="button" class="igv__nav igv__nav--prev" data-ig-indietro aria-label="${esc(t.prima)}">${leftIco()}</button>
      <div class="igv__panel" tabindex="-1">
        <div class="igv__stage" data-ig-stage>
          <div class="igv__media" data-ig-media></div>
          <span class="igv__pausa" aria-hidden="true">${pauseIco(13)}${esc(t.inPausa)}</span>
        </div>
        <div class="igv__top">
          <div class="igv__bars ${items.length > 30 ? 'is-fitte' : ''}" aria-hidden="true">${items.map(() => '<i><b></b></i>').join('')}</div>
          <div class="igv__head">
            ${avatar(acc, 34, 'igv__ava')}
            <div class="igv__who"><b>${esc(acc.name || acc.username)}</b><span>${etichetta ? `<em data-ig-chi>${esc(etichetta)}</em>` : `@${esc(acc.username)}`}<time data-ig-quando></time></span></div>
            <button type="button" class="igv__ctrl" data-ig-pausa aria-label="${esc(t.pausa)}">${pauseIco(18)}</button>
            <button type="button" class="igv__ctrl" data-ig-audio aria-label="${esc(t.attivaAudio)}" hidden>${mutoIco(18)}</button>
            <button type="button" class="igv__ctrl" data-ig-chiudi aria-label="${esc(t.chiudi)}">${closeIco(20)}</button>
          </div>
        </div>
        <div class="igv__bottom">
          <span class="igv__conta" data-ig-conta aria-live="polite"></span>
          <a class="igv__link" data-ig-link href="${esc(P.link(acc))}" target="_blank" rel="noopener noreferrer me">${ico(14)}<span>${esc(t.apri)}</span>${ext(11)}</a>
        </div>
      </div>
      <button type="button" class="igv__nav igv__nav--next" data-ig-avanti aria-label="${esc(t.dopo)}">${rightIco()}</button>`
    document.body.appendChild(root)
    document.documentElement.style.overflow = 'hidden'

    const barre = [...root.querySelectorAll('.igv__bars b')]
    const media_ = root.querySelector('[data-ig-media]')
    const conta = root.querySelector('[data-ig-conta]')
    const data = root.querySelector('[data-ig-quando]')
    const chi = root.querySelector('[data-ig-chi]')
    const link = root.querySelector('[data-ig-link]')
    const ambiente = root.querySelector('[data-ig-amb]')
    const audioBtn = root.querySelector('[data-ig-audio]')
    const pausaBtn = root.querySelector('[data-ig-pausa]')
    const indietroBtn = root.querySelector('[data-ig-indietro]')
    const stage = root.querySelector('[data-ig-stage]')
    const lento = reduced()

    let i = Math.max(0, Math.min(items.length - 1, partenza))
    let video = null
    let raf = 0
    let inizio = 0
    let durata = lento ? 8000 : 5200
    let pausa = false
    let fermoDa = 0
    let chiuso = false
    let toccoX = 0
    let toccoY = 0

    const ferma = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }
    const barra = (n) => barre[n] || null

    function mostra(n) {
      i = n
      ferma()
      if (video) { video.pause(); video.remove() }
      video = null
      media_.innerHTML = ''
      barre.forEach((b, k) => { b.style.transform = k < n ? 'scaleX(1)' : 'scaleX(0)' })
      const it = items[n]
      conta.textContent = t.conta(n + 1, items.length) + (it.nota ? ` · ${it.nota}` : '')
      const q = quando(it.at, lang)
      data.textContent = q
      if (q) data.dateTime = it.at
      // l'autore (i repost) al posto del titolo, e il collegamento di quell'elemento
      if (chi) chi.textContent = it.chi || etichetta
      link.href = it.link || P.link(acc)
      link.querySelector('span').textContent = it.link ? (it.linkTesto || t.apri) : t.apri
      indietroBtn.classList.toggle('is-fermo', n === 0)
      const prox = items[n + 1]
      if (prox?.type === 'photo') { const im = new Image(); im.src = media(prox.src) }
      // la luce dietro al pannello è la foto stessa, sfocata: nessuno scarico in più
      ambiente.style.backgroundImage = it.type === 'photo' ? `url("${encodeURI(media(it.src))}")` : ''
      if (it.type === 'video') {
        video = document.createElement('video')
        video.src = media(it.src)
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'
        video.autoplay = true
        video.setAttribute('playsinline', '')
        video.setAttribute('aria-label', titolo)
        media_.appendChild(video)
        audioBtn.hidden = false
        audioBtn.innerHTML = mutoIco(18)
        audioBtn.setAttribute('aria-label', t.attivaAudio)
        durata = (Number(it.durata) > 0 ? Number(it.durata) : 15) * 1000
        inizio = performance.now()
        video.addEventListener('loadedmetadata', () => {
          if (Number.isFinite(video.duration) && video.duration > 0) durata = video.duration * 1000
          inizio = performance.now()
        }, { once: true })
        video.play().catch(() => {})
      } else {
        audioBtn.hidden = true
        durata = lento ? 8000 : 5200
        inizio = performance.now()
        const img = document.createElement('img')
        img.src = media(it.src)
        img.alt = ''
        img.decoding = 'async'
        img.draggable = false
        if (it.w && it.h) { img.width = it.w; img.height = it.h }
        img.addEventListener('error', () => {
          media_.innerHTML = `<p class="igv__errore">${esc(t.senzaStoria)}</p>`
          setTimeout(() => { if (!chiuso && i === n) avanti(1) }, 1800)
        }, { once: true })
        media_.appendChild(img)
      }
      pausa = false
      fermoDa = 0
      aggiornaPausa()
      tick()
    }

    function tick() {
      if (chiuso) return
      if (!pausa) {
        let p = durata ? (performance.now() - inizio) / durata : 0
        if (video && Number.isFinite(video.duration) && video.duration > 0) p = video.currentTime / video.duration
        const b = barra(i)
        if (b) b.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`
        if (p >= 1) { avanti(1); return }
      }
      raf = requestAnimationFrame(tick)
    }

    function aggiornaPausa() {
      root.classList.toggle('is-pausa', pausa)
      pausaBtn.innerHTML = pausa ? playIco(18) : pauseIco(18)
      pausaBtn.setAttribute('aria-label', pausa ? t.riprendi : t.pausa)
    }

    function cambiaPausa(forza) {
      pausa = typeof forza === 'boolean' ? forza : !pausa
      if (pausa) {
        fermoDa = performance.now()
        video?.pause()
      } else {
        if (fermoDa) inizio += performance.now() - fermoDa
        fermoDa = 0
        video?.play().catch(() => {})
        if (!raf) raf = requestAnimationFrame(tick)
      }
      aggiornaPausa()
    }

    function avanti(passo) {
      const n = i + passo
      if (n < 0) return mostra(0)
      if (n >= items.length) return chiudi()
      mostra(n)
    }

    function chiudi() {
      if (chiuso) return
      chiuso = true
      ferma()
      video?.pause()
      document.removeEventListener('keydown', tasto)
      document.documentElement.style.overflow = scroll
      root.remove()
      vecchioFocus?.focus?.({ preventScroll: true })
      vista = null
    }

    function tasto(e) {
      if (e.key === 'Escape') { e.preventDefault(); chiudi() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); avanti(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); avanti(1) }
      else if (e.key === ' ' || e.key === 'k') {
        // sullo spazio un pulsante a fuoco fa già il suo mestiere
        if (e.key === ' ' && e.target.closest?.('button, a')) return
        e.preventDefault()
        cambiaPausa()
      } else if (e.key === 'Tab') {
        // solo ciò che si vede davvero: le frecce laterali spariscono sul tocco
        const f = [...root.querySelectorAll('a[href],button:not([disabled])')].filter((x) => !x.hidden && x.getClientRects().length)
        if (!f.length) return
        const primo = f[0], ultimo = f.at(-1)
        if (!root.contains(document.activeElement)) { e.preventDefault(); primo.focus() }
        else if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus() }
      }
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-ig-chiudi]')) return chiudi()
      if (e.target.closest('[data-ig-indietro]')) return avanti(-1)
      if (e.target.closest('[data-ig-avanti]')) return avanti(1)
      if (e.target.closest('[data-ig-pausa]')) return cambiaPausa()
      if (e.target.closest('[data-ig-audio]')) {
        if (!video) return
        video.muted = !video.muted
        const muto = video.muted
        audioBtn.innerHTML = muto ? mutoIco(18) : audioIco(18)
        audioBtn.setAttribute('aria-label', muto ? t.attivaAudio : t.disattivaAudio)
        if (!muto && !pausa) video.play().catch(() => {})
      }
    })
    stage.addEventListener('click', (e) => {
      const r = stage.getBoundingClientRect()
      const x = r.width ? (e.clientX - r.left) / r.width : 0.5
      if (x < 0.34) avanti(-1)
      else if (x > 0.66) avanti(1)
      else cambiaPausa()
    })
    stage.addEventListener('touchstart', (e) => {
      const p = e.changedTouches[0]
      toccoX = p.clientX; toccoY = p.clientY
    }, { passive: true })
    stage.addEventListener('touchend', (e) => {
      const p = e.changedTouches[0]
      const dx = p.clientX - toccoX, dy = p.clientY - toccoY
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); avanti(dx < 0 ? 1 : -1) }
      else if (dy > 80 && dy > Math.abs(dx)) { e.preventDefault(); chiudi() }
    })
    document.addEventListener('keydown', tasto)
    vista = chiudi
    root.querySelector('.igv__panel')?.focus({ preventScroll: true })
    mostra(i)
  }

  // ── montaggio ─────────────────────────────────────────────────────────────

  async function monta(root, { lang = 'it' } = {}) {
    if (!root) return
    root.classList.add('igc')
    if (P.classe) root.classList.add(P.classe)
    root.setAttribute('aria-label', P.nome)
    if (!root.dataset.igOn) {
      root.dataset.igOn = '1'
      collega(root)
    }
    root.dataset.igLang = lang
    await disegna(root, lang)
  }

  async function disegna(root, lang) {
    if (!root?.isConnected) return
    if (!root.firstElementChild) root.innerHTML = scheletro()
    try {
      const j = cache && Date.now() - cacheAt < 60_000 ? cache : await dati()
      if (root.isConnected) dipingi(root, j, lang)
    } catch (e) {
      if (!root.isConnected) return
      if (cache) dipingi(root, cache, lang, T(lang).errore)
      else root.innerHTML = guscio(T(lang).errore)
    }
    if (root.isConnected) sfondo(root)
  }

  return { monta, apri, stato: (root) => STATO.get(root) || null }
}
