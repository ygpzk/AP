// TikTok in bacheca: la sorella della scheda Instagram, non la gemella. Stessa
// famiglia (occhielli in gg mono, numeri in Ginto Nord, dati statici scritti dal
// raccoglitore sul pc in /media/tt/index.json, nessuna chiamata a TikTok dal
// browser, nessun account chiesto a chi guarda), ma vestita da TikTok: i numeri
// sdoppiati ciano e rosso come il marchio, la colonna delle azioni a destra come
// sopra ogni video, il disco del suono che gira e cambia lo sfondo, i video in
// fila come la griglia del profilo.
//
// Qui c'è la grafica: la scheda, gli stati e lo sfondo. Le interazioni (il
// visualizzatore a tutto schermo, l'anteprima al passaggio, la tastiera sulla
// fila) sono nel brief design/tiktok-bacheca.md: gli agganci sono già nel markup
// (data-tt-clip, data-tt-storie, #tt-pan).

import { ICONS } from './icons.js'
import { PERSONAL_SOCIALS } from './config.js'

const TT_PATH = ICONS.tiktok[1]
const logo = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${TT_PATH}"/></svg>`
// il marchio sdoppiato: ciano sotto a sinistra, rosso sotto a destra, inchiostro sopra
const logoDoppio = (s = 22) => `<span class="ttc__logo" style="--s:${s}px" aria-hidden="true"><i>${logo(s)}</i><i>${logo(s)}</i><i>${logo(s)}</i></span>`
const ext = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`
const lock = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`
const playIco = (s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"><path d="M7 4.8v14.4L19 12z"/></svg>`
const cuoreIco = (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.2 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5z"/></svg>`
const personeIco = (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="7.5" r="3.6"/><path d="M2.5 19.4c0-3.6 2.9-6.1 6.5-6.1s6.5 2.5 6.5 6.1c0 .6-.4.9-.9.9H3.4c-.5 0-.9-.3-.9-.9z"/><circle cx="16.8" cy="8.6" r="2.8" opacity=".7"/><path d="M16.4 13.4c3 0 5.1 2 5.1 4.9 0 .5-.3.8-.8.8h-3.9c.1-2.2-.6-4.1-2-5.4.5-.2 1-.3 1.6-.3z" opacity=".7"/></svg>`
const filmIco = (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm4 5.3v7.4c0 .5.5.8 1 .5l5.6-3.7c.4-.3.4-.8 0-1.1L11 7.8c-.5-.3-1 0-1 .5z"/></svg>`
const condividiIco = (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.6 3.6 22 11.2c.5.4.5 1.1 0 1.5l-8.4 7.7c-.6.5-1.6.1-1.6-.7v-3.9c-5.2 0-8.1 1.6-9.6 4.6-.3.6-1.2.4-1.2-.3C1.6 13.3 5.2 8.8 12 8.3V4.3c0-.8 1-1.2 1.6-.7z"/></svg>`
const piuIco = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`
const spuntaIco = (s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`
const repostIco = (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5V9.5a3 3 0 0 1 3-3h12"/><path d="m16 3.5 3 3-3 3"/><path d="M20 12.5v2a3 3 0 0 1-3 3H5"/><path d="m8 20.5-3-3 3-3"/></svg>`
const fotoIco = (s = 13) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2.5"/><path d="M7 2.8h11.2A2.8 2.8 0 0 1 21 5.6V17"/></svg>`

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const LOCALE = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', ru: 'ru-RU', ja: 'ja-JP', zh: 'zh-CN' }
const locale = (lang) => LOCALE[lang] || 'en-US'

const TESTI = {
  it: {
    profilo: 'TikTok',
    follower: 'follower',
    miPiace: 'mi piace',
    seguiti: 'seguiti',
    video: 'video',
    storie: 'Storie di oggi',
    storieBreve: 'Storie',
    videoTitolo: 'Video',
    fissato: 'fissato',
    nessunVideo: 'Nessun video pubblico, per ora. Quando esce qualcosa compare qui da solo.',
    repost: 'Repost',
    repostDi: (u, d) => `Repost di un video di @${u} del ${d}`,
    repostFoto: (u, d) => `Repost delle foto di @${u} del ${d}`,
    soloQui: 'solo qui',
    soloQuiLungo: 'su TikTok non è pubblico: si guarda solo qui',
    segui: 'Segui su TikTok',
    apri: 'Apri su TikTok',
    profiloDi: (u) => `Il profilo di @${u} su TikTok`,
    controllato: 'controllo automatico ogni ora',
    aggiornato: 'aggiornato',
    errore: 'TikTok non risponde adesso. Riprovo più tardi.',
    vuoto: 'In attesa del primo aggiornamento.',
    privacy: 'Solo i numeri e i video che ho scelto io. Niente commenti, niente elenchi di follower.',
    visto: (n) => `${n} visualizzazioni`,
    videoDel: (d) => `Video del ${d}`,
    fotoDel: (d) => `Foto del ${d}`,
    storiaDel: (d) => `Storia delle ${d}`,
    privato: 'profilo privato',
    verificato: 'account verificato',
    settimana: 'negli ultimi 7 giorni',
    cambiaSfondo: 'Cambia sfondo',
    sfondoFascia: (da, a, n) => `Sfondo delle ${da}–${a} · ${n}`,
    sfondoScelto: (n) => `Sfondo scelto · ${n}`,
  },
  en: {
    profilo: 'TikTok',
    follower: 'followers',
    miPiace: 'likes',
    seguiti: 'following',
    video: 'videos',
    storie: 'Today’s stories',
    storieBreve: 'Stories',
    videoTitolo: 'Videos',
    fissato: 'pinned',
    nessunVideo: 'No public videos yet. When something comes out, it shows up here on its own.',
    repost: 'Reposts',
    repostDi: (u, d) => `Repost of a video by @${u} from ${d}`,
    repostFoto: (u, d) => `Repost of photos by @${u} from ${d}`,
    soloQui: 'only here',
    soloQuiLungo: 'not public on TikTok: you can only watch it here',
    segui: 'Follow on TikTok',
    apri: 'Open on TikTok',
    profiloDi: (u) => `@${u} on TikTok`,
    controllato: 'automatic check every hour',
    aggiornato: 'updated',
    errore: 'TikTok is not answering right now. I’ll try again later.',
    vuoto: 'Waiting for the first update.',
    privacy: 'Only the counts and videos I chose. No comments, no follower lists.',
    visto: (n) => `${n} views`,
    videoDel: (d) => `Video from ${d}`,
    fotoDel: (d) => `Photos from ${d}`,
    storiaDel: (d) => `Story from ${d}`,
    privato: 'private profile',
    verificato: 'verified account',
    settimana: 'in the last 7 days',
    cambiaSfondo: 'Change backdrop',
    sfondoFascia: (da, a, n) => `${da}–${a} backdrop · ${n}`,
    sfondoScelto: (n) => `Chosen backdrop · ${n}`,
  },
}
const T = (lang) => TESTI[lang] || TESTI.en

const numero = (n, lang) => new Intl.NumberFormat(locale(lang), { useGrouping: 'always' }).format(Number(n) || 0)
// «12,3 K» sotto le icone, come fa TikTok; il numero intero resta nel titolo
const corto = (n, lang) => {
  const v = Number(n) || 0
  if (v < 10000) return numero(v, lang)
  return new Intl.NumberFormat(locale(lang), { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(v).replace(/\s/g, ' ')
}
const relativo = (iso, lang) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' })
  for (const [u, s] of [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(sec) >= s) return rtf.format(Math.round(sec / s), u)
  }
  return rtf.format(sec, 'second')
}
const dataOra = (iso, lang) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}
const giorno = (iso, lang) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}
const ora = (iso, lang) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit' }).format(d)
}
const durata = (s) => {
  const v = Math.round(Number(s) || 0)
  return v > 0 ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : ''
}
// una storia vale 24 ore (o fino a «until»), anche se il JSON è vecchio
const viva = (s) => {
  const fine = Date.parse(s?.until || '') || (Date.parse(s?.at || '') + 24 * 3600 * 1000)
  return Number.isFinite(fine) && Date.now() < fine
}
const storieBuone = (acc) => (acc?.stories || []).filter(viva)

let cache = null
let cacheAt = 0
let richiesta = null

async function dati(forza = false) {
  if (!forza && cache && Date.now() - cacheAt < 60_000) return cache
  if (!forza && richiesta) return richiesta
  richiesta = fetch(`/media/tt/index.json?v=${Date.now()}`, { cache: 'no-store' })
    .then((r) => {
      if (r.status === 404) return { accounts: [] }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then((j) => { cache = j; cacheAt = Date.now(); return j })
    .finally(() => { richiesta = null })
  return richiesta
}

const STATO = new WeakMap()
let scelto = ''

const media = (p) => `/media/tt/${p}`

function avatar(acc, px) {
  return acc?.avatar
    ? `<img src="${esc(media(acc.avatar))}" alt="" width="${px}" height="${px}" loading="lazy" decoding="async" draggable="false">`
    : `<span class="ttc__fallback" aria-hidden="true">${esc((acc?.name || acc?.username || '?').trim().slice(0, 1))}</span>`
}

// l'andamento vero degli ultimi sette giorni (come nella scheda Instagram)
function andamento(history, lang) {
  const punti = (history || []).map((p) => ({ t: Date.parse(p.t), f: Number(p.f) })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.f)).sort((a, b) => a.t - b.t)
  if (punti.length < 2) return ''
  const soglia = Date.now() - 7 * 24 * 3600 * 1000
  let primo = 0
  punti.forEach((p, i) => { if (p.t <= soglia) primo = i })
  const serie = punti.slice(primo)
  if (serie.length < 2) return ''
  const v = serie.map((p) => p.f)
  const min = Math.min(...v), max = Math.max(...v)
  const larg = 64, alt = 18, pad = 2
  const t0 = serie[0].t, t1 = serie.at(-1).t
  const x = (p) => pad + (t1 === t0 ? 0 : (p.t - t0) / (t1 - t0)) * (larg - pad * 2)
  const y = (f) => (max === min ? alt / 2 : pad + (1 - (f - min) / (max - min)) * (alt - pad * 2))
  const d = serie.map((p, i) => `${i ? 'L' : 'M'}${x(p).toFixed(1)} ${y(p.f).toFixed(1)}`).join(' ')
  const delta = v.at(-1) - v[0]
  return `<span class="ttc__trend ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}" title="${esc(`${numero(v[0], lang)} → ${numero(v.at(-1), lang)}`)}">
      <svg viewBox="0 0 ${larg} ${alt}" width="${larg}" height="${alt}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <b>${delta > 0 ? '+' : ''}${numero(delta, lang)}</b> <span>${esc(T(lang).settimana)}</span>
    </span>`
}

// un numero grande sdoppiato: le due copie colorate stanno in ::before/::after
function grande(valore, etichetta, extra, lang) {
  const n = numero(valore, lang)
  return `<div class="ttc__big">
      <div class="ttc__num" data-n="${esc(n)}" data-len="${Math.min(n.length, 9)}">${n}</div>
      <div class="ttc__numl"><span>${esc(etichetta)}</span>${extra || ''}</div>
    </div>`
}

// le storie di oggi: una tessera con l'anello che gira (cliccandola si aprono tutte)
function tesseraStorie(storie, acc, lang) {
  const t = T(lang)
  const ultima = storie.at(-1)
  const faccia = storie.findLast((s) => s.type === 'photo')?.src || ''
  return `<a class="ttc__clip ttc__clip--storia" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me" data-tt-storie aria-label="${esc(`${t.storie} · ${storie.length} · ${t.storiaDel(ora(ultima.at, lang))}`)}">
      <span class="ttc__face">
        ${faccia ? `<img src="${esc(media(faccia))}" alt="" loading="lazy" decoding="async" draggable="false">` : `<span class="ttc__vuota" aria-hidden="true">${logo(26)}</span>`}
        <span class="ttc__segs" aria-hidden="true">${'<i></i>'.repeat(Math.min(storie.length, 24))}</span>
        <span class="ttc__cap" aria-hidden="true"><b>${esc(t.storieBreve)}</b><span>${esc(`${storie.length} · ${relativo(ultima.at, lang)}`)}</span></span>
      </span>
    </a>`
}

function tesseraVideo(v, k, acc, lang) {
  const t = T(lang)
  const foto = v.type === 'photo'
  const quando = giorno(v.at, lang)
  const etichetta = [foto ? t.fotoDel(quando) : t.videoDel(quando), t.visto(numero(v.stats?.views, lang)), v.pinned ? t.fissato : '', v.solo_qui ? t.soloQuiLungo : ''].filter(Boolean).join(' · ')
  // un video «solo qui» su TikTok non si vede: il ripiego senza visualizzatore è il file del sito
  const dove = v.solo_qui && v.src ? media(v.src) : (v.url || acc.url)
  return `<a class="ttc__clip${v.solo_qui ? ' ttc__clip--qui' : ''}" href="${esc(dove)}" target="_blank" rel="noopener noreferrer${v.solo_qui ? '' : ' me'}" data-tt-clip="${k}" aria-label="${esc(etichetta)}">
      <span class="ttc__face">
        ${v.cover ? `<img src="${esc(media(v.cover))}" alt="" loading="lazy" decoding="async" draggable="false"${v.w && v.h ? ` width="${v.w}" height="${v.h}"` : ''}>` : `<span class="ttc__vuota" aria-hidden="true">${logo(26)}</span>`}
        <span class="ttc__prev" aria-hidden="true"></span>
        ${v.pinned ? `<span class="ttc__pin" aria-hidden="true">${esc(t.fissato)}</span>` : v.solo_qui ? `<span class="ttc__pin ttc__pin--qui" aria-hidden="true">${esc(t.soloQui)}</span>` : ''}
        <span class="ttc__dur" aria-hidden="true">${foto ? `${fotoIco(12)}${(v.photos?.length || 0) + 1}` : esc(durata(v.durata))}</span>
        <span class="ttc__views" aria-hidden="true">${playIco(13)}${esc(corto(v.stats?.views, lang))}</span>
      </span>
    </a>`
}

function tesseraRepost(r, k, lang) {
  const t = T(lang)
  const foto = r.type === 'photo'
  const quando = giorno(r.at, lang)
  const chi = r.author || '?'
  const etichetta = [foto ? t.repostFoto(chi, quando) : t.repostDi(chi, quando), t.visto(numero(r.stats?.views, lang))].join(' · ')
  return `<a class="ttc__rep" href="${esc(r.url || '#')}" target="_blank" rel="noopener noreferrer" data-tt-repost="${k}" aria-label="${esc(etichetta)}">
      <span class="ttc__clip ttc__clip--rep">
        <span class="ttc__face">
          ${r.cover ? `<img src="${esc(media(r.cover))}" alt="" loading="lazy" decoding="async" draggable="false">` : `<span class="ttc__vuota" aria-hidden="true">${logo(22)}</span>`}
          <span class="ttc__prev" aria-hidden="true"></span>
          <span class="ttc__dur" aria-hidden="true">${foto ? `${fotoIco(11)}` : esc(durata(r.durata))}</span>
          <span class="ttc__views" aria-hidden="true">${playIco(11)}${esc(corto(r.stats?.views, lang))}</span>
        </span>
      </span>
      ${r.author ? `<span class="ttc__rep-chi" aria-hidden="true">@${esc(r.author)}</span>` : ''}
    </a>`
}

function mainHtml(j, acc, lang) {
  const t = T(lang)
  const s = acc.stats || {}
  const aggiornato = acc.synced || j.updated
  const bio = (acc.bio || []).map((r) => esc(r)).join('<br>')
  const storie = storieBuone(acc)
  const video = acc.videos || []
  const reposts = acc.reposts || []
  const fila = [storie.length ? tesseraStorie(storie, acc, lang) : '', ...video.map((v, k) => tesseraVideo(v, k, acc, lang))].join('')
  const testa = [storie.length ? t.storie : '', video.length ? t.videoTitolo : ''].filter(Boolean).join(' · ') || t.videoTitolo
  // il nome del profilo, se il raccoglitore lo ha lasciato; altrimenti il titolo è @account
  const nome = acc.name && acc.name !== acc.username ? acc.name : ''
  const spunta = acc.verified ? `<span class="ttc__ok" title="${esc(t.verificato)}" aria-label="${esc(t.verificato)}">${spuntaIco(10)}</span>` : ''

  return `<div class="ttc__kick">
      <span class="ttc__kick-a"><i aria-hidden="true"></i>${esc(t.profilo)}${acc.private ? `<span class="ttc__priv">${lock(11)}${esc(t.privato)}</span>` : ''}</span>
      <span class="ttc__kick-b">${esc(t.controllato)}</span>
    </div>
    <div class="ttc__me">
      ${nome
        ? `<div class="ttc__name">${esc(nome)}${spunta}</div>
           <a class="ttc__user" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me">@${esc(acc.username)}</a>`
        : `<a class="ttc__name ttc__name--at" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me"><span>@${esc(acc.username)}</span>${spunta}</a>`}
      ${bio ? `<div class="ttc__bio">${bio}</div>` : ''}
    </div>
    <div class="ttc__nums">
      ${grande(s.followers, t.follower, andamento(acc.history, lang), lang)}
      ${grande(s.likes, t.miPiace, '', lang)}
    </div>
    <a class="ttc__go" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me">${logo(15)}<span>${esc(t.segui)}</span>${ext(12)}</a>
    <div class="ttc__reel">
      <div class="ttc__reel-head"><span>${esc(testa)}</span><span>${numero(video.length + storie.length, lang)}</span></div>
      ${fila ? `<div class="ttc__strip">${fila}</div>` : `<p class="ttc__niente">${esc(t.nessunVideo)}</p>`}
    </div>
    ${reposts.length ? `<div class="ttc__reel ttc__reel--rep">
      <div class="ttc__reel-head"><span>${repostIco(13)}${esc(t.repost)}</span><span>${numero(reposts.length, lang)}</span></div>
      <div class="ttc__strip ttc__strip--rep">${reposts.map((r, k) => tesseraRepost(r, k, lang)).join('')}</div>
    </div>` : ''}
    <div class="ttc__foot">
      <span>${esc(t.privacy)}</span>
      <span class="ttc__meta"><i aria-hidden="true"></i>${esc(t.aggiornato)} ${esc(relativo(aggiornato, lang))}${aggiornato ? ` · ${esc(dataOra(aggiornato, lang))}` : ''}</span>
    </div>`
}

// la colonna delle azioni, come sopra ogni video di TikTok
function sideHtml(acc, lang) {
  const t = T(lang)
  const s = acc.stats || {}
  const voce = (ico, n, nome, classe = '') => `<span class="ttc__act ${classe}" title="${esc(`${numero(n, lang)} ${nome}`)}"><span class="ttc__act-i">${ico}</span><b aria-hidden="true">${esc(corto(n, lang))}</b><span class="ttc__sr">${esc(`${numero(n, lang)} ${nome}`)}</span></span>`
  return `<div class="ttc__side">
      <a class="ttc__me-ava" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me" aria-label="${esc(t.profiloDi(acc.username))}">
        <span class="ttc__me-img">${avatar(acc, 48)}</span>
        <span class="ttc__plus" aria-hidden="true">${acc.verified ? spuntaIco(10) : piuIco(10)}</span>
      </a>
      ${voce(personeIco(), s.following, t.seguiti)}
      ${voce(filmIco(), Math.max(Number(s.videos) || 0, (acc.videos || []).length), t.video)}
      ${(acc.reposts || []).length ? voce(repostIco(), acc.reposts.length, t.repost.toLowerCase()) : ''}
      <a class="ttc__act ttc__act--go" href="${esc(acc.url)}" target="_blank" rel="noopener noreferrer me" aria-label="${esc(t.apri)}" title="${esc(t.apri)}"><span class="ttc__act-i">${condividiIco()}</span><b aria-hidden="true">${esc(t.profilo)}</b></a>
      <button type="button" class="ttc__disco" data-tt-disco aria-label="${esc(t.cambiaSfondo)}" data-tip="${esc(t.cambiaSfondo)}">
        <span class="ttc__disco-v" aria-hidden="true"><span class="ttc__disco-in">${avatar(acc, 22)}</span></span>
      </button>
    </div>`
}

function guscio(testo, lang) {
  const t = T(lang)
  const tt = PERSONAL_SOCIALS.find((s) => s.key === 'tiktok')
  return `<div class="ttc__in ttc__in--solo">
      <div class="ttc__main ttc__main--solo">
        <div class="ttc__kick"><span class="ttc__kick-a"><i aria-hidden="true"></i>${esc(t.profilo)}</span></div>
        ${logoDoppio(40)}
        <p class="ttc__vuoto">${esc(testo)}</p>
        ${tt ? `<a class="ttc__go" href="${esc(tt.url)}" target="_blank" rel="noopener noreferrer me">${logo(15)}<span>${esc(t.apri)}</span>${ext(12)}</a>` : ''}
      </div>
    </div>`
}

const scheletro = () => `<div class="ttc__in ttc__in--attesa" aria-hidden="true"><div class="ttc__main"><span class="ttc__osso ttc__osso--a"></span><span class="ttc__osso ttc__osso--b"></span><span class="ttc__osso ttc__osso--c"></span><span class="ttc__osso ttc__osso--d"></span></div><div class="ttc__side"><span class="ttc__osso ttc__osso--ava"></span><span class="ttc__osso ttc__osso--act"></span><span class="ttc__osso ttc__osso--act"></span><span class="ttc__osso ttc__osso--act"></span></div></div>`

function dipingi(root, j, lang, nota = '') {
  const accounts = (j?.accounts || []).filter((a) => a && a.username)
  if (!accounts.length) {
    STATO.delete(root)
    root.innerHTML = guscio(T(lang).vuoto, lang)
    return
  }
  const acc = accounts.find((a) => a.username === scelto) || accounts[0]
  STATO.set(root, { acc, storie: storieBuone(acc), video: acc.videos || [], repost: acc.reposts || [] })
  root.innerHTML = `<div class="ttc__in"><div class="ttc__main" id="tt-pan" data-tt-lang="${esc(lang)}">${mainHtml(j, acc, lang)}</div>${sideHtml(acc, lang)}</div>`
  if (nota) root.querySelector('.ttc__meta')?.insertAdjacentHTML('beforeend', ` <span class="ttc__stale">· ${esc(nota)}</span>`)
}

// ── lo sfondo vivo: dodici scene, una ogni due ore (tt-sfondi.js) ───────────

const SFONDI = new WeakMap()

function disco(root) {
  const b = root.querySelector('[data-tt-disco]')
  const s = SFONDI.get(root)
  if (!b || !s) return
  const lang = root.dataset.ttLang || 'it'
  const t = T(lang)
  const nome = s.nome(lang)
  const { fascia, scelto: suo, ore } = s.stato
  const da = String(fascia * ore).padStart(2, '0') + ':00'
  const a = String((fascia * ore + ore) % 24).padStart(2, '0') + ':00'
  const testo = suo ? t.sfondoScelto(nome) : t.sfondoFascia(da, a, nome)
  b.dataset.tip = testo
  b.setAttribute('aria-label', `${t.cambiaSfondo}. ${testo}`)
}

function sfondo(root) {
  const dentro = root.querySelector('.ttc__in:not(.ttc__in--attesa)')
  if (!dentro) return
  const s = SFONDI.get(root)
  if (s) { s.sposta(dentro); return disco(root) }
  if (root._ttSfondo) return
  root._ttSfondo = import('./tt-sfondi.js')
    .then((m) => {
      const casa = root.querySelector('.ttc__in:not(.ttc__in--attesa)')
      if (!casa || !root.isConnected) { root._ttSfondo = null; return }
      SFONDI.set(root, m.accendi(casa, { quandoCambia: () => disco(root) }))
      disco(root)
    })
    .catch(() => { root._ttSfondo = null })
}

function collega(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tt-disco]')
    if (!b) return
    SFONDI.get(root)?.prossimo()
    // il disco fa un giro in più, come quando cambia il suono
    b.classList.remove('is-gira')
    void b.offsetWidth
    b.classList.add('is-gira')
  })
}

// ── montaggio ───────────────────────────────────────────────────────────────

export async function monta(root, { lang = 'it' } = {}) {
  if (!root) return
  root.classList.add('ttc')
  root.setAttribute('aria-label', 'TikTok')
  if (!root.dataset.ttOn) {
    root.dataset.ttOn = '1'
    collega(root)
  }
  root.dataset.ttLang = lang
  await disegna(root, lang)
}

// per chi rifinisce l'esperienza: lo stato della scheda (profilo, storie vive, video)
export const stato = (root) => STATO.get(root) || null

async function disegna(root, lang) {
  if (!root?.isConnected) return
  if (!root.firstElementChild) root.innerHTML = scheletro()
  try {
    const j = cache && Date.now() - cacheAt < 60_000 ? cache : await dati()
    if (root.isConnected) dipingi(root, j, lang)
  } catch {
    if (!root.isConnected) return
    if (cache) dipingi(root, cache, lang, T(lang).errore)
    else root.innerHTML = guscio(T(lang).errore, lang)
  }
  if (root.isConnected) sfondo(root)
}
