// Instagram in bacheca: il profilo nativo (non uno screenshot), le storie in
// evidenza e il visualizzatore a tutto schermo. I dati sono quelli che il
// raccoglitore sul pc scrive in /media/ig/index.json: qui non si chiama
// Instagram e non si chiede nessun account a chi guarda.
//
// Regola dei tempi: il raccoglitore controlla i follower ogni ora, scarica
// una storia solo quando compare e confronta le evidenze ogni sei ore. La
// scheda mostra l'ultimo cambiamento vero, non un battito finto.

import { ICONS } from './icons.js'

const IG_PATH = ICONS.instagram[1]
const ico = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${IG_PATH}"/></svg>`
const ext = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`
const lock = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`
const closeIco = (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`
const leftIco = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>`
const rightIco = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`
const playIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`
const pauseIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
const audioIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`
const mutoIco = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>`
const igBig = (s = 22) => ico(s)

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const LOCALE = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', ru: 'ru-RU', ja: 'ja-JP', zh: 'zh-CN' }
const locale = (lang) => LOCALE[lang] || 'en-US'

const TESTI = {
  it: {
    profilo: 'Instagram',
    follower: 'follower',
    seguiti: 'seguiti',
    post: 'post',
    evidenze: 'Storie in evidenza',
    nessunaEvidenza: 'Nessuna storia in evidenza.',
    storia: 'Storia',
    apri: 'Apri su Instagram',
    controllato: 'controllo automatico ogni ora',
    aggiornato: 'aggiornato',
    errore: 'Instagram non risponde adesso. Riprovo più tardi.',
    vuoto: 'In attesa del primo aggiornamento.',
    privacy: 'Solo conteggi e storie scelte da me. Nessun elenco di follower.',
    chiudi: 'Chiudi',
    prima: 'Prima',
    dopo: 'Dopo',
    pausa: 'Metti in pausa',
    riprendi: 'Riprendi',
    attivaAudio: 'Attiva l’audio',
    disattivaAudio: 'Disattiva l’audio',
    conta: (i, n) => `${i} di ${n}`,
    settimana: 'negli ultimi 7 giorni',
    senzaStoria: 'Storia non disponibile.',
    storieDi: (u) => `Storie di @${u}`,
    evidenzaDi: (u, t) => `${t} di @${u}`,
    pzkko: 'anche @pzkko',
    privato: 'profilo privato',
  },
  en: {
    profilo: 'Instagram',
    follower: 'followers',
    seguiti: 'following',
    post: 'posts',
    evidenze: 'Highlights',
    nessunaEvidenza: 'No highlights yet.',
    storia: 'Story',
    apri: 'Open on Instagram',
    controllato: 'automatic check every hour',
    aggiornato: 'updated',
    errore: 'Instagram is not answering right now. I’ll try again later.',
    vuoto: 'Waiting for the first update.',
    privacy: 'Only counts and stories I chose. No follower list.',
    chiudi: 'Close',
    prima: 'Previous',
    dopo: 'Next',
    pausa: 'Pause',
    riprendi: 'Resume',
    attivaAudio: 'Turn sound on',
    disattivaAudio: 'Turn sound off',
    conta: (i, n) => `${i} of ${n}`,
    settimana: 'in the last 7 days',
    senzaStoria: 'Story not available.',
    storieDi: (u) => `Stories by @${u}`,
    evidenzaDi: (u, t) => `${t} by @${u}`,
    pzkko: 'also @pzkko',
    privato: 'private profile',
  },
}

const T = (lang) => TESTI[lang] || TESTI.en
const numero = (n, lang) => new Intl.NumberFormat(locale(lang)).format(Number(n) || 0)
const dataIt = (iso, lang) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}
const relativo = (iso, lang) => {
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
const scaduta = (at) => {
  const d = Date.parse(at || '')
  return Number.isFinite(d) && Date.now() - d > 24 * 3600 * 1000
}
const storieBuone = (acc) => (acc?.stories || []).filter((s) => !scaduta(s.at))

let cache = null
let cacheAt = 0
let richiesta = null

async function dati(forza = false) {
  if (!forza && cache && Date.now() - cacheAt < 60_000) return cache
  if (!forza && richiesta) return richiesta
  richiesta = fetch(`/media/ig/index.json?v=${Date.now()}`, { cache: 'no-store' })
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

function avatar(acc, px, classe = '') {
  const src = acc?.avatar ? `/media/ig/${acc.avatar}` : ''
  const iniziale = esc((acc?.name || acc?.username || '?').trim().slice(0, 1))
  return src
    ? `<img class="${classe}" src="${esc(src)}" alt="" width="${px}" height="${px}" loading="lazy" decoding="async">`
    : `<span class="igc__fallback ${classe}" style="--igpx:${px}px" aria-hidden="true">${iniziale}</span>`
}

function sparkline(history, lang) {
  const punti = (history || []).slice(-40)
  if (punti.length < 2) return ''
  const valori = punti.map((p) => Number(p.f) || 0)
  const min = Math.min(...valori), max = Math.max(...valori)
  const larg = 128, alt = 30, pad = 3
  const x = (i) => pad + (i / (punti.length - 1)) * (larg - pad * 2)
  const y = (v) => (max === min ? alt / 2 : pad + (1 - (v - min) / (max - min)) * (alt - pad * 2))
  const d = punti.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(Number(p.f) || 0).toFixed(1)}`).join(' ')
  const delta = valori.at(-1) - valori[0]
  const segno = delta > 0 ? '+' : ''
  const titolo = `${numero(valori[0], lang)} → ${numero(valori.at(-1), lang)}`
  return `<span class="igc__spark" aria-hidden="true"><svg viewBox="0 0 ${larg} ${alt}" width="${larg}" height="${alt}" role="img"><title>${esc(titolo)}</title><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <span class="igc__delta ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}">${segno}${numero(delta, lang)} <span>${esc(T(lang).settimana)}</span></span>`
}

function titoloEvidenza(h) {
  return h?.title || 'Highlights'
}

function cardHtml(j, lang, selezionato) {
  const t = T(lang)
  const accounts = (j.accounts || []).filter((a) => a && a.username)
  if (!accounts.length) {
    return `<div class="igc__vuoto"><p>${esc(t.vuoto)}</p></div>`
  }
  const acc = accounts.find((a) => a.username === selezionato) || accounts[0]
  const storie = storieBuone(acc)
  const evidenze = acc.highlights || []
  const stats = acc.stats || {}
  const aggiornato = acc.synced || j.updated
  const bio = (acc.bio || []).map((r) => esc(r)).join('<br>')
  const nome = acc.name || acc.username

  const chi = accounts.length > 1
    ? `<div class="igc__who" role="tablist" aria-label="Instagram">${accounts.map((a) => `<button type="button" class="igc__who-btn ${a.username === acc.username ? 'is-on' : ''}" role="tab" aria-selected="${a.username === acc.username}" data-ig-acc="${esc(a.username)}">${avatar(a, 26, 'igc__who-ava')}<span><b>${esc(a.name || a.username)}</b><span>@${esc(a.username)}</span></span></button>`).join('')}</div>`
    : ''

  const ava = storie.length
    ? `<button type="button" class="igc__ava has-story" data-ig-story aria-label="${esc(t.storieDi(acc.username))}"><span class="igc__ava-in">${avatar(acc, 72)}</span><span class="igc__ring" aria-hidden="true"></span></button>`
    : `<div class="igc__ava"><span class="igc__ava-in">${avatar(acc, 72)}</span></div>`

  const hl = evidenze.map((h, i) => {
    const copertina = h.cover ? `<img src="/media/ig/${esc(h.cover)}" alt="" width="72" height="72" loading="lazy" decoding="async">` : `<span class="igc__hlph" aria-hidden="true">${ico(24)}</span>`
    return `<button type="button" class="igc__hlitem" data-ig-open="${i}" aria-label="${esc(t.evidenzaDi(acc.username, titoloEvidenza(h)))}">
      <span class="igc__hlcover">${copertina}<span class="igc__hlcount">${numero(h.count ?? (h.items || []).length, lang)}</span></span>
      <span class="igc__hltitle">${esc(titoloEvidenza(h))}</span>
    </button>`
  }).join('')

  const vuoto = !storie.length && !evidenze.length ? `<p class="igc__vuoto">${esc(t.nessunaEvidenza)}</p>` : ''

  return `<div class="igc__top">
      <span class="igc__brand">${igBig(18)}<span>${esc(t.profilo)}</span></span>
      <span class="igc__auto"><i aria-hidden="true"></i>${esc(t.controllato)}</span>
    </div>
    ${chi}
    <div class="igc__body">
      <div class="igc__head">
        ${ava}
        <div class="igc__id">
          <div class="igc__name">${esc(nome)} ${acc.private ? `<span class="igc__lock" title="${esc(t.privato)}">${lock(12)}</span>` : ''}</div>
          <a class="igc__user" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me">@${esc(acc.username)}</a>
          ${bio ? `<div class="igc__bio">${bio}</div>` : ''}
        </div>
        <a class="igc__go" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me">${igBig(16)}<span>${esc(t.apri)}</span>${ext(12)}</a>
      </div>
      <div class="igc__stats">
        <div><b>${numero(stats.posts, lang)}</b><span>${esc(t.post)}</span></div>
        <div><b>${numero(stats.followers, lang)}</b><span>${esc(t.follower)}</span></div>
        <div><b>${numero(stats.following, lang)}</b><span>${esc(t.seguiti)}</span></div>
      </div>
      ${(acc.history || []).length > 1 ? `<div class="igc__trend">${sparkline(acc.history, lang)}</div>` : ''}
      <div class="igc__hl">
        <div class="igc__hl-head"><span>${esc(t.evidenze)}</span><span>${evidenze.length}</span></div>
        <div class="igc__hlrow">
          ${storie.length ? `<button type="button" class="igc__hlitem igc__hlitem--storia" data-ig-story aria-label="${esc(t.storieDi(acc.username))}"><span class="igc__hlcover igc__hlcover--ava">${avatar(acc, 72)}</span><span class="igc__hltitle">${esc(t.storia)}</span></button>` : ''}
          ${hl}
        </div>
        ${vuoto}
      </div>
      <div class="igc__foot">
        <span>${esc(t.privacy)}</span>
        <a class="igc__pzk" href="https://www.instagram.com/pzkko/" target="_blank" rel="noopener noreferrer me">${igBig(13)} ${esc(t.pzkko)} ${ext(11)}</a>
      </div>
      <div class="igc__meta"><span class="igc__dot" aria-hidden="true"></span><span>${esc(t.aggiornato)} ${esc(relativo(aggiornato, lang))}${aggiornato ? ` · ${dataIt(aggiornato, lang)}` : ''}</span></div>
    </div>`
}

export function apri(acc, items, titolo, lang, partenza = 0) {
  if (!items?.length) return
  vista?.()
  const t = T(lang)
  const vecchioFocus = document.activeElement
  const scroll = document.documentElement.style.overflow
  const root = document.createElement('div')
  root.className = 'igv'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-label', titolo)
  root.innerHTML = `<div class="igv__bg" data-ig-chiudi></div>
    <div class="igv__panel" tabindex="-1">
      <div class="igv__bars" aria-hidden="true">${items.map(() => '<i></i>').join('')}</div>
      <div class="igv__top">
        ${avatar(acc, 32, 'igv__ava')}
        <div class="igv__who"><b>${esc(acc.name || acc.username)}</b><span>@${esc(acc.username)}</span></div>
        <button type="button" class="igv__ctrl" data-ig-pausa aria-label="${esc(t.pausa)}">${pauseIco(18)}</button>
        <button type="button" class="igv__ctrl" data-ig-audio aria-label="${esc(t.attivaAudio)}" hidden>${mutoIco(18)}</button>
        <button type="button" class="igv__ctrl" data-ig-chiudi aria-label="${esc(t.chiudi)}">${closeIco(20)}</button>
      </div>
      <div class="igv__stage" data-ig-stage>
        <div class="igv__media" data-ig-media></div>
        <button type="button" class="igv__nav igv__nav--prev" data-ig-indietro aria-label="${esc(t.prima)}">${leftIco()}</button>
        <button type="button" class="igv__nav igv__nav--next" data-ig-avanti aria-label="${esc(t.dopo)}">${rightIco()}</button>
      </div>
      <div class="igv__bottom">
        <span class="igv__conta" data-ig-conta aria-live="polite"></span>
        <a class="igv__link" href="https://www.instagram.com/${esc(acc.username)}/" target="_blank" rel="noopener noreferrer me">${igBig(14)} ${esc(t.apri)} ${ext(11)}</a>
      </div>
    </div>`
  document.body.appendChild(root)
  document.documentElement.style.overflow = 'hidden'

  const barre = [...root.querySelectorAll('.igv__bars i')]
  const media = root.querySelector('[data-ig-media]')
  const conta = root.querySelector('[data-ig-conta]')
  const audioBtn = root.querySelector('[data-ig-audio]')
  const pausaBtn = root.querySelector('[data-ig-pausa]')
  const stage = root.querySelector('[data-ig-stage]')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  let i = Math.max(0, Math.min(items.length - 1, partenza))
  let video = null
  let raf = 0
  let inizio = 0
  let durata = reduced ? 8000 : 5200
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
    media.innerHTML = ''
    barre.forEach((b, k) => { b.style.transform = k < n ? 'scaleX(1)' : 'scaleX(0)' })
    const it = items[n]
    const bar = barra(n)
    if (bar) bar.style.transform = 'scaleX(0)'
    conta.textContent = t.conta(n + 1, items.length)
    const prox = items[n + 1]
    if (prox?.type === 'photo') { const im = new Image(); im.src = `/media/ig/${prox.src}` }
    if (it.type === 'video') {
      video = document.createElement('video')
      video.src = `/media/ig/${it.src}`
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.autoplay = true
      video.setAttribute('playsinline', '')
      video.setAttribute('aria-label', titolo)
      media.appendChild(video)
      audioBtn.hidden = false
      audioBtn.innerHTML = mutoIco(18)
      audioBtn.setAttribute('aria-label', t.attivaAudio)
      audioBtn.dataset.muto = '1'
      durata = 15000
      inizio = performance.now()
      video.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(video.duration) && video.duration > 0) durata = video.duration * 1000
        inizio = performance.now()
      }, { once: true })
      video.play().catch(() => {})
    } else {
      audioBtn.hidden = true
      durata = reduced ? 8000 : 5200
      inizio = performance.now()
      const img = document.createElement('img')
      img.src = `/media/ig/${it.src}`
      img.alt = ''
      img.decoding = 'async'
      img.draggable = false
      if (it.w && it.h) { img.width = it.w; img.height = it.h }
      img.addEventListener('error', () => {
        media.innerHTML = `<p class="igv__errore">${esc(t.senzaStoria)}</p>`
        setTimeout(() => { if (!chiuso) avanti(1) }, 1800)
      }, { once: true })
      media.appendChild(img)
    }
    pausa = false
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
    const b = pausaBtn
    if (b) {
      b.innerHTML = pausa ? playIco(18) : pauseIco(18)
      b.setAttribute('aria-label', pausa ? t.riprendi : t.pausa)
    }
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
    if (n < 0) { inizio = performance.now(); if (video) video.currentTime = 0; return }
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
    else if (e.key === ' ' || e.key === 'k') { e.preventDefault(); cambiaPausa() }
    else if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('a[href],button:not([disabled])')].filter((x) => !x.hidden)
      if (!f.length) return
      const primo = f[0], ultimo = f.at(-1)
      if (e.shiftKey && (document.activeElement === primo || document.activeElement === root)) { e.preventDefault(); ultimo.focus() }
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
      if (!muto) video.play().catch(() => {})
      return
    }
  })
  stage.addEventListener('click', (e) => {
    if (e.target.closest('button')) return
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
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) avanti(dx < 0 ? 1 : -1)
    else if (dy > 80) chiudi()
  }, { passive: true })
  document.addEventListener('keydown', tasto)
  vista = chiudi
  root.querySelector('[data-ig-chiudi]')?.focus({ preventScroll: true })
  mostra(i)
}

let vista = null
function chiudi() { vista?.() }

export async function monta(root, { lang = 'it' } = {}) {
  if (!root) return
  root.classList.add('igc')
  root.setAttribute('aria-label', 'Instagram')
  if (!root.dataset.igOn) {
    root.dataset.igOn = '1'
    root.addEventListener('click', async (e) => {
      const lingua = root.dataset.igLang || 'it'
      const accBtn = e.target.closest('[data-ig-acc]')
      if (accBtn) {
        root.dataset.igAcc = accBtn.dataset.igAcc
        return disegna(root, lingua)
      }
      const apriBtn = e.target.closest('[data-ig-open]')
      if (apriBtn) {
        const j = await dati().catch(() => cache)
        const acc = trova(j, root.dataset.igAcc)
        const h = (acc?.highlights || [])[Number(apriBtn.dataset.igOpen)]
        if (h?.items?.length) apri(acc, h.items, titoloEvidenza(h), lingua)
        return
      }
      if (e.target.closest('[data-ig-story]')) {
        const j = await dati().catch(() => cache)
        const acc = trova(j, root.dataset.igAcc)
        const storie = storieBuone(acc)
        if (storie.length) apri(acc, storie, T(lingua).storieDi(acc.username), lingua)
      }
    })
  }
  root.dataset.igLang = lang
  await disegna(root, lang)
}

function trova(j, selezionato) {
  const accounts = j?.accounts || []
  return accounts.find((a) => a.username === selezionato) || accounts[0]
}

async function disegna(root, lang) {
  if (!root?.isConnected) return
  if (!root.querySelector('.igc__scheletro')) {
    root.innerHTML = `<div class="igc__scheletro" aria-hidden="true"><span></span><span></span><span></span></div>`
  }
  try {
    const j = cache && Date.now() - cacheAt < 60_000 ? cache : await dati()
    if (!root.isConnected) return
    root.innerHTML = cardHtml(j, lang, root.dataset.igAcc)
  } catch (e) {
    if (!root.isConnected) return
    if (cache) {
      root.innerHTML = cardHtml(cache, lang, root.dataset.igAcc)
      root.querySelector('.igc__meta')?.insertAdjacentHTML('beforeend', `<span class="igc__stale">· ${esc(T(lang).errore)}</span>`)
    } else {
      root.innerHTML = `<div class="igc__vuoto"><p>${esc(T(lang).errore)}</p></div>`
    }
  }
}
