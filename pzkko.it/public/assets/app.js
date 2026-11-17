// pzkko.it: il profilo di Discord, dal vivo. Lanyard dà avatar, decorazione,
// stato, Spotify, giochi e stato personalizzato; il profilo pubblico (dstn) dà
// banner, tema, bio, badge e collegamenti. Niente librerie.

import { CONFIG, SOCIALS, iconUrl, PROJECTS, TOOLS, LANGS } from './config.js'
import { I18N } from './i18n.js'
import { coverSvg, isDrawn } from './covers.js'
import { mountEffect } from './effect.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const ID = CONFIG.discordId

// ─── icone ───────────────────────────────────────────────────────────────────
const I = {
  chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4.6 21.4a.6.6 0 0 0 .8.7l3.9-1.6c.9.2 1.8.3 2.7.3 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>',
  copy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  dots: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  ext: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>',
  moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.7 14.6A8.6 8.6 0 0 1 9.4 3.3a9 9 0 1 0 11.3 11.3z"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  desktop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/></svg>',
  web: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/></svg>',
  mobile: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 4v13h10V4z"/></svg>',
  game: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 7h12a5 5 0 0 1 4.9 6.02l-.8 4A3.2 3.2 0 0 1 16.4 18.6L14.6 16H9.4l-1.8 2.6a3.2 3.2 0 0 1-5.7-1.58l-.8-4A5 5 0 0 1 6 7zm1 3v1.5H5.5v1.5H7v1.5h1.5V13H10v-1.5H8.5V10H7zm9.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
  spotify: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#1ed760" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.42-1.021.599-1.56.3z"/></svg>',
}

// ─── stato ───────────────────────────────────────────────────────────────────
const LANG_KEY = 'pzkko-lang', THEME_KEY = 'pzkko-theme'
const detectLang = () => {
  const saved = store.get(LANG_KEY)
  if (saved && I18N[saved]) return saved
  for (const l of navigator.languages || [navigator.language]) { const c = String(l).slice(0, 2).toLowerCase(); if (I18N[c]) return c }
  return 'en'
}
let lang = detectLang()
let theme = store.get(THEME_KEY) === 'dark' ? 'dark' : 'light'
const profile = structuredClone(CONFIG.profile)
let presence = null, presenceAt = 0
const t = () => I18N[lang]
const ui = () => t().ui
const locale = () => (LANGS.find((l) => l.code === lang) || LANGS[0]).locale

// ─── colori del tema ─────────────────────────────────────────────────────────
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix = (c, w, a) => '#' + hex(c).map((v, i) => Math.round(v * (1 - a) + w[i] * a).toString(16).padStart(2, '0')).join('')
function applyTheme() {
  const root = document.documentElement
  root.dataset.theme = theme
  const [p, a] = profile.theme
  root.style.setProperty('--p', p)
  root.style.setProperty('--a', a)
  root.style.setProperty('--ring', theme === 'dark' ? mix(p, [0, 0, 0], 0.6) : mix(p, [255, 255, 255], 0.8))
  $('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? mix(p, [0, 0, 0], 0.6) : mix(p, [255, 255, 255], 0.8))
  const b = $('#theme-btn')
  b.innerHTML = theme === 'dark' ? I.sun : I.moon
  b.setAttribute('aria-label', theme === 'dark' ? ui().theme.light : ui().theme.dark)
  b.title = b.getAttribute('aria-label')
  renderIcons()
}

// ─── utilità ─────────────────────────────────────────────────────────────────
const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}` }
const sinceDate = () => new Date(Number((BigInt(ID) >> 22n) + 1420070400000n))
const STATUS_COLOR = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' }
function statusSvg(st) {
  const ring = 'var(--ring)'
  return `<svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="${ring}"/><circle cx="15" cy="15" r="10" fill="${STATUS_COLOR[st] ?? STATUS_COLOR.offline}"/>${st === 'idle' ? `<circle cx="10.5" cy="10.5" r="6.5" fill="${ring}"/>` : ''}${st === 'dnd' ? `<rect x="8.5" y="13" width="13" height="4" rx="2" fill="${ring}"/>` : ''}${st === 'offline' ? `<circle cx="15" cy="15" r="4.5" fill="${ring}"/>` : ''}</svg>`
}
let toastTimer
function toast(msg) {
  const el = $('#toast')
  el.textContent = msg
  el.classList.add('is-on')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 1600)
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text) } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy') } catch {} ta.remove()
  }
  toast(ui().copied)
}
function assetUrl(act, key) {
  const a = act.assets?.[key]
  if (!a) return null
  if (a.startsWith('mp:')) return `https://media.discordapp.net/${a.slice(3)}`
  if (a.startsWith('spotify:')) return `https://i.scdn.co/image/${a.slice(8)}`
  if (act.application_id && /^\d+$/.test(a)) return `https://cdn.discordapp.com/app-assets/${act.application_id}/${a}.png`
  return null
}
const coverHtml = (c, alt = '') => (isDrawn(c) ? coverSvg(c) : `<img src="${esc(c)}" alt="${esc(alt)}" loading="lazy" draggable="false">`)

// ─── la scheda a sinistra ────────────────────────────────────────────────────
function renderCard() {
  const u = presence?.discord_user
  const p = profile
  // banner
  const bannerHash = p.banner
  const banner = $('#banner')
  banner.parentElement.style.background = p.bannerColor || '#110f10'
  if (bannerHash) {
    const url = `https://cdn.discordapp.com/banners/${ID}/${bannerHash}.${bannerHash.startsWith('a_') && !reduced ? 'gif' : 'png'}?size=600`
    if (banner.getAttribute('src') !== url) banner.src = url
    banner.hidden = false
  } else banner.hidden = true
  // avatar e decorazione
  const av = u?.avatar ?? p.avatar
  const avUrl = av ? `https://cdn.discordapp.com/avatars/${ID}/${av}.${av.startsWith('a_') && !reduced ? 'gif' : 'png'}?size=256` : '/me.png'
  if ($('#avatar').getAttribute('src') !== avUrl) $('#avatar').src = avUrl
  const deco = u ? u.avatar_decoration_data?.asset : p.decoration
  const deImg = $('#deco')
  if (deco) {
    const url = `https://cdn.discordapp.com/avatar-decoration-presets/${deco}.png?size=160&passthrough=${!reduced}`
    if (deImg.getAttribute('src') !== url) deImg.src = url
    deImg.hidden = false
  } else deImg.hidden = true
  if (u) setFavicon(avUrl.replace('size=256', 'size=64'))
  // stato
  const st = presence?.discord_status || 'offline'
  $('#status').innerHTML = statusSvg(st)
  $('#status').title = t().status[st]
  $('#avatar-box').setAttribute('aria-label', `${p.displayName}, ${t().status[st]}`)
  // stato personalizzato
  const custom = presence?.activities?.find((x) => x.type === 4)
  const bubble = $('#bubble')
  if (custom && (custom.state || custom.emoji)) {
    const emo = custom.emoji ? (custom.emoji.id ? `<img src="https://cdn.discordapp.com/emojis/${custom.emoji.id}.${custom.emoji.animated ? 'gif' : 'png'}?size=32" alt="${esc(custom.emoji.name)}">` : esc(custom.emoji.name)) : ''
    $('.bubble__text', bubble).innerHTML = `${emo}${emo && custom.state ? ' ' : ''}${esc(custom.state ?? '')}`
    bubble.hidden = false
  } else bubble.hidden = true
  // nome, tag, badge
  $('#dname').textContent = u?.global_name || p.displayName
  $('#uname').textContent = u?.username || p.username
  const g = u?.primary_guild?.identity_enabled ? { tag: u.primary_guild.tag, id: u.primary_guild.identity_guild_id, badge: u.primary_guild.badge } : (u ? null : p.guild)
  const gt = $('#gtag')
  if (g?.tag) { gt.innerHTML = `${g.badge ? `<img src="https://cdn.discordapp.com/clan-badges/${g.id}/${g.badge}.png?size=32" alt="">` : ''}${esc(g.tag)}`; gt.hidden = false } else gt.hidden = true
  $('#badges').innerHTML = p.badges.map((b) => {
    const img = `<img src="https://cdn.discordapp.com/badge-icons/${b.icon}.png" alt="${esc(b.description)}" draggable="false">`
    return b.link ? `<a href="${esc(b.link)}" target="_blank" rel="noopener" title="${esc(b.description)}">${img}</a>` : `<span title="${esc(b.description)}">${img}</span>`
  }).join('')
  $('#badges').hidden = !p.badges.length
  // sezioni
  $('#bio').textContent = p.bio || ''
  $('#bio-sec').hidden = !p.bio
  $('#since').textContent = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(sinceDate())
  $('#conns').innerHTML = p.connections.map(connRow).join('')
  renderIcons()
  renderCardActivity()
}
const CONN = {
  domain: (c) => ({ url: `https://${c.name}`, icon: null }),
  github: (c) => ({ url: `https://github.com/${c.name}`, icon: 'github' }),
  steam: (c) => ({ url: `https://steamcommunity.com/profiles/${c.id}`, icon: 'steam' }),
  twitch: (c) => ({ url: `https://www.twitch.tv/${c.name}`, icon: 'twitch' }),
  youtube: (c) => ({ url: `https://www.youtube.com/channel/${c.id}`, icon: 'youtube' }),
  twitter: (c) => ({ url: `https://x.com/${c.name}`, icon: 'x' }),
  reddit: (c) => ({ url: `https://www.reddit.com/user/${c.name}`, icon: 'reddit' }),
  spotify: (c) => ({ url: `https://open.spotify.com/user/${c.id}`, icon: 'spotify' }),
  tiktok: (c) => ({ url: `https://www.tiktok.com/@${c.name}`, icon: 'tiktok' }),
  instagram: (c) => ({ url: `https://www.instagram.com/${c.name}`, icon: 'instagram' }),
}
function connRow(c) {
  const m = (CONN[c.type] || (() => ({ url: null, icon: c.type })))(c)
  const dark = theme === 'dark' && ['github', 'steam', 'x', 'tiktok'].includes(m.icon)
  const ico = m.icon ? `<img src="https://cdn.simpleicons.org/${m.icon}${dark ? '/ffffff' : ''}" alt="" data-ico="${m.icon}">` : I.globe
  const inner = `<span class="conn__ico">${ico}</span><span>${esc(c.name)}</span>${m.url ? `<span class="conn__arrow">${I.ext}</span>` : ''}`
  return `<li>${m.url ? `<a class="conn" href="${esc(m.url)}" target="_blank" rel="noopener me">${inner}</a>` : `<span class="conn">${inner}</span>`}</li>`
}
function renderIcons() {
  const box = $('#social-icons')
  if (!box) return
  const dark = theme === 'dark'
  box.innerHTML = SOCIALS.filter((s) => s.key !== 'discord').map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener me" title="${esc(`${s.name} · ${s.handle}`)}" aria-label="${esc(`${s.name} ${s.handle}`)}"><img src="${iconUrl(s, dark)}" alt="" loading="lazy"></a>`).join('')
  for (const img of $$('#conns img[data-ico]')) {
    const ic = img.dataset.ico
    img.src = `https://cdn.simpleicons.org/${ic}${dark && ['github', 'steam', 'x', 'tiktok'].includes(ic) ? '/ffffff' : ''}`
  }
  if (activeTab === 'social') renderSocial()
  if (activeTab === 'board') renderToolsPills()
}

let faviconSet = ''
function setFavicon(url) {
  if (faviconSet === url) return
  faviconSet = url
  for (const l of $$('link[rel~="icon"], link[rel="apple-touch-icon"]')) l.remove()
  for (const rel of ['icon', 'apple-touch-icon']) {
    const l = document.createElement('link')
    l.rel = rel
    if (rel === 'icon') l.type = url.includes('.gif') ? 'image/gif' : 'image/png'
    l.href = url
    document.head.appendChild(l)
  }
}

// ─── attività dal vivo ───────────────────────────────────────────────────────
function bar(start, end, now) {
  const total = Math.max(0, end - start), done = Math.min(total, Math.max(0, now - start)), pct = total ? (done / total) * 100 : 0
  return `<div class="bar"><span>${clock(done)}</span><div class="bar__track"><div class="bar__fill" style="width:${pct.toFixed(1)}%"></div></div><span>${clock(total)}</span></div>`
}
function spotifyHtml(s, now) {
  const link = s.track_id ? `https://open.spotify.com/track/${encodeURIComponent(s.track_id)}` : null
  return `<div class="act"><div class="act__art"><img src="${esc(s.album_art_url)}" alt="" draggable="false"></div><div class="act__lines">
      <b>${link ? `<a href="${link}" target="_blank" rel="noopener" class="hover:underline">${esc(s.song)}</a>` : esc(s.song)}</b>
      <span class="act__muted">${esc(ui().by)} ${esc(s.artist)}</span><span class="act__muted">${esc(ui().on)} ${esc(s.album)}</span></div></div>
    ${s.timestamps?.start && s.timestamps?.end ? bar(s.timestamps.start, s.timestamps.end, now) : ''}`
}
function gameHtml(a, now) {
  const big = assetUrl(a, 'large_image'), small = assetUrl(a, 'small_image'), ts = a.timestamps || {}
  const art = big ? `<img src="${esc(big)}" alt="" draggable="false">${small ? `<img class="act__small" src="${esc(small)}" alt="">` : ''}` : `<span class="act__ph">${I.game.replace('width="14" height="14"', 'width="34" height="34"')}</span>`
  const elapsed = ts.start && !ts.end ? `<span class="act__muted">${clock(now - ts.start)} ${esc(ui().elapsed)}</span>` : ''
  return `<div class="act"><div class="act__art">${art}</div><div class="act__lines"><b>${esc(a.name)}</b>${a.details ? `<span class="act__muted">${esc(a.details)}</span>` : ''}${a.state ? `<span class="act__muted">${esc(a.state)}</span>` : ''}${elapsed}</div></div>${ts.start && ts.end ? bar(ts.start, ts.end, now) : ''}`
}
const liveItems = () => {
  const now = Date.now(), out = []
  for (const a of presence?.activities || []) if ([0, 1, 3, 5].includes(a.type)) out.push({ head: `${I.game}<span>${esc(ui().act[a.type] ?? ui().act[0])}</span>`, body: gameHtml(a, now), ticking: !!a.timestamps })
  if (presence?.listening_to_spotify && presence.spotify) out.push({ head: `${I.spotify}<span>${esc(ui().listening)}</span>`, body: spotifyHtml(presence.spotify, now), ticking: true })
  return out
}
function renderCardActivity() {
  const first = liveItems()[0]
  $('#card-activity').innerHTML = first ? `<div class="widget__h">${first.head}</div>${first.body}` : ''
}
function devicesHtml() {
  const d = []
  if (presence?.active_on_discord_desktop) d.push(['desktop', ui().devices.desktop])
  if (presence?.active_on_discord_web) d.push(['web', ui().devices.web])
  if (presence?.active_on_discord_mobile) d.push(['mobile', ui().devices.mobile])
  return d.length ? `<div class="flex flex-wrap items-center gap-2 mt-2 text-[13px]" style="color:var(--muted)">${esc(ui().activeOn)} ${d.map(([k, l]) => `<span class="pill">${I[k]}${esc(l)}</span>`).join('')}</div>` : ''
}
function nowWidget() {
  const st = presence?.discord_status || 'offline'
  const items = liveItems()
  const body = items.length ? items.map((x) => `<div class="mt-1"><div class="widget__h" style="margin-bottom:8px">${x.head}</div>${x.body}</div>`).join('<hr style="border:0;border-top:1px solid var(--line);margin:12px 0">') : `<p style="color:var(--muted)">${esc(ui().nothing)}</p>`
  return `<div class="widget__h"><span>${esc(ui().now)}</span><span class="live">${esc(ui().live)}</span></div>
    <div class="flex items-center gap-2 mb-2 text-[14px] font-semibold"><span style="width:10px;height:10px;border-radius:50%;background:${STATUS_COLOR[st]}"></span>${esc(t().status[st])}</div>${body}${devicesHtml()}`
}

// ─── le schede a destra ──────────────────────────────────────────────────────
const TABS = ['board', 'projects', 'activity', 'social']
const SLUG = { board: 'bacheca', projects: 'progetti', activity: 'attivita', social: 'social' }
let activeTab = 'board'
function renderTabs() {
  $('#tabs').innerHTML = TABS.map((k) => `<button class="tab" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${k === activeTab}" tabindex="${k === activeTab ? 0 : -1}" data-tab="${k}">${esc(ui().tabs[k])}</button>`).join('')
}
function showTab(k, focus = false) {
  activeTab = k
  renderTabs()
  for (const p of $$('.tabpanel')) p.hidden = p.id !== `panel-${k}`
  renderPanel()
  if (focus) $(`#tab-${k}`).focus()
  const slug = `#${SLUG[k]}`
  if (location.hash !== slug && !(k === 'board' && !location.hash)) history.replaceState(null, '', slug)
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab) })
$('#tabs').addEventListener('keydown', (e) => {
  const i = TABS.indexOf(activeTab)
  if (e.key === 'ArrowRight') { e.preventDefault(); showTab(TABS[(i + 1) % TABS.length], true) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); showTab(TABS[(i - 1 + TABS.length) % TABS.length], true) }
})

function renderToolsPills() {
  const box = $('#tools-pills')
  if (box) box.innerHTML = TOOLS.map((x) => `<span class="pill"><img src="${esc(theme === 'dark' && x.dark ? x.dark : x.icon)}" alt="" loading="lazy">${esc(x.title)}</span>`).join('')
}
function renderBoard() {
  const u = ui()
  const feat = PROJECTS.slice(0, 4)
  $('#panel-board').innerHTML = `<div class="grid2">
    <div class="widget main-site span2">
      <div class="widget__h">${I.globe}<span>${esc(u.mainTitle)}</span></div>
      <p>${esc(u.mainText)}</p>
      <div class="mt-3"><a class="btn btn--msg" href="${esc(CONFIG.mainSite.url)}" target="_blank" rel="noopener">${esc(u.mainCta)} ${I.ext}</a></div>
    </div>
    <div class="widget" id="now-widget">${nowWidget()}</div>
    <div class="widget"><div class="widget__h"><span>${esc(u.aboutTitle)}</span></div><p>${esc(u.aboutText)}</p></div>
    <div class="widget span2"><div class="widget__h"><span>${esc(u.tools)}</span></div><div class="pills" id="tools-pills"></div></div>
    <div class="widget span2">
      <div class="widget__h"><span>${esc(u.featured)}</span><button type="button" class="more-link" data-goto="projects">${esc(u.seeAll)} →</button></div>
      <div class="grid2" style="gap:6px 14px">${feat.map((p) => `<button type="button" class="mini" data-open="${p.key}"><span class="mini__thumb">${coverHtml(p.cover)}</span><span class="min-w-0"><b class="block text-[14px]">${esc(p.title)}</b><span class="block text-[13px] truncate" style="color:var(--muted)">${esc(t().projects[p.key].card)}</span></span></button>`).join('')}</div>
    </div>
  </div>`
  renderToolsPills()
}
function renderProjects() {
  const u = ui()
  $('#panel-projects').innerHTML = `<div class="grid2">${PROJECTS.map((p) => {
    const tx = t().projects[p.key]
    return `<article class="pcard">
      <button type="button" class="pcard__cover" data-open="${p.key}" aria-label="${esc(`${u.details}: ${p.title}`)}">${coverHtml(p.cover, p.title)}</button>
      <div class="pcard__body">
        <h3 class="pcard__title">${esc(p.title)}${!p.url && !p.code ? `<span class="tag">${esc(u.archived)}</span>` : ''}</h3>
        <p class="pcard__desc">${esc(tx.card)}</p>
        <div class="pills">${p.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
        <div class="pcard__actions">
          <button type="button" class="btn btn--msg" data-open="${p.key}">${esc(u.details)}</button>
          ${p.url ? `<a class="btn btn--ghost" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(u.open)} ${I.ext}</a>` : ''}
          ${p.code ? `<a class="btn btn--ghost" href="${esc(p.code)}" target="_blank" rel="noopener">${esc(u.code)} ${I.ext}</a>` : ''}
        </div>
      </div></article>`
  }).join('')}</div>`
}
function renderActivity() {
  const u = ui()
  const custom = presence?.activities?.find((x) => x.type === 4)
  const ago = presenceAt ? new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' }).format(-Math.round((Date.now() - presenceAt) / 1000 / 60), 'minute') : ''
  $('#panel-activity').innerHTML = `<div class="grid2">
    <div class="widget span2" id="now-widget-2">${nowWidget()}</div>
    ${custom ? `<div class="widget span2"><div class="widget__h"><span>${esc(u.customStatus)}</span></div><p class="text-[15px]">${custom.emoji && !custom.emoji.id ? esc(custom.emoji.name) + ' ' : ''}${esc(custom.state ?? '')}</p></div>` : ''}
  </div>${ago ? `<p class="mt-3 text-[12px]" style="color:var(--faint)">${esc(u.updatedAgo)} ${esc(ago)} · Lanyard</p>` : ''}`
}
function renderSocial() {
  const dark = theme === 'dark'
  const main = `<a class="srow span2 main-site" href="${esc(CONFIG.mainSite.url)}" target="_blank" rel="noopener"><span class="srow__ico">${I.globe}</span><span class="min-w-0"><span class="srow__name block">${esc(ui().mainTitle)}</span><span class="srow__handle block">${esc(CONFIG.mainSite.label)}</span></span><span class="ml-auto opacity-60">${I.ext}</span></a>`
  $('#panel-social').innerHTML = `<div class="grid2" style="gap:10px">${main}${SOCIALS.map((s) => `<a class="srow" href="${esc(s.url)}" target="_blank" rel="noopener me"><span class="srow__ico"><img src="${iconUrl(s, dark)}" alt="" loading="lazy"></span><span class="min-w-0"><span class="srow__name block">${esc(s.name)}</span><span class="srow__handle block">${esc(s.handle)}</span></span><span class="ml-auto opacity-60">${I.ext}</span></a>`).join('')}</div>`
}
function renderPanel() {
  if (activeTab === 'board') renderBoard()
  else if (activeTab === 'projects') renderProjects()
  else if (activeTab === 'activity') renderActivity()
  else renderSocial()
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]')
  if (o) { openModal(o.dataset.open); return }
  const g = e.target.closest('[data-goto]')
  if (g) showTab(g.dataset.goto, true)
})

// il battito per le barre di Spotify e i tempi dei giochi
setInterval(() => {
  if (!presence || !liveItems().some((x) => x.ticking)) return
  renderCardActivity()
  const n1 = $('#now-widget'), n2 = $('#now-widget-2')
  if (n1) n1.innerHTML = nowWidget()
  if (n2) n2.innerHTML = nowWidget()
}, 1000)

// ─── la scheda del progetto ──────────────────────────────────────────────────
let modal = null
function openModal(key) {
  const p = PROJECTS.find((x) => x.key === key)
  if (!p) return
  closeMenus()
  const u = ui(), tx = t().projects[key]
  const media = [p.cover, ...(p.media || [])]
  const root = document.createElement('div')
  root.className = 'modal'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-labelledby', 'modal-title')
  root.innerHTML = `<div class="modal__bg" data-close></div>
    <div class="modal__panel" tabindex="-1">
      <button type="button" class="modal__close" data-close aria-label="${esc(u.close)}">${I.close}</button>
      <div class="modal__media" data-media>${media.map((m, i) => `<div>${isDrawn(m) ? coverSvg(m) : `<img src="${esc(m)}" alt="${esc(`${p.title} ${i + 1}`)}" draggable="false">`}</div>`).join('')}</div>
      ${media.length > 1 ? `<div class="modal__dots">${media.map((_, i) => `<button type="button" data-dot="${i}" aria-label="${i + 1}" aria-current="${i === 0}"></button>`).join('')}</div>` : ''}
      <div class="modal__body">
        <div><h2 class="modal__title" id="modal-title">${esc(p.title)}</h2><div class="pills mt-2">${p.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}${!p.url && !p.code ? `<span class="tag">${esc(u.archived)}</span>` : ''}</div></div>
        <div class="widget"><div class="widget__h"><span>${esc(u.overview)}</span></div><p>${esc(tx.full)}</p></div>
        <div class="grid2">
          <div class="widget"><div class="widget__h"><span>${esc(u.features)}</span></div><ul class="feat">${tx.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
          <div class="widget"><div class="widget__h"><span>${esc(u.role)}</span></div><p>${esc(tx.role)}</p>
            <div class="flex flex-wrap gap-2 mt-3">${p.url ? `<a class="btn btn--msg" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(u.open)} ${I.ext}</a>` : ''}${p.code ? `<a class="btn btn--ghost" href="${esc(p.code)}" target="_blank" rel="noopener">${esc(u.code)} ${I.ext}</a>` : ''}</div>
          </div>
        </div>
      </div>
    </div>`
  document.body.appendChild(root)
  document.documentElement.style.overflow = 'hidden'
  modal = { root, last: document.activeElement }
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-on')))
  $('.modal__panel', root).focus({ preventScroll: true })
  const strip = $('[data-media]', root)
  strip.addEventListener('scroll', () => {
    const i = Math.round(strip.scrollLeft / strip.clientWidth)
    for (const d of $$('[data-dot]', root)) d.setAttribute('aria-current', String(+d.dataset.dot === i))
  }, { passive: true })
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal()
    const d = e.target.closest('[data-dot]')
    if (d) strip.scrollTo({ left: +d.dataset.dot * strip.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
  })
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'Tab') {
      const f = $$('a[href],button:not([disabled])', root)
      if (!f.length) return
      if (e.shiftKey && (document.activeElement === f[0] || !root.contains(document.activeElement) || document.activeElement === $('.modal__panel', root))) { e.preventDefault(); f.at(-1).focus() }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus() }
    }
  })
}
function closeModal() {
  if (!modal) return
  const { root, last } = modal
  modal = null
  root.classList.remove('is-on')
  setTimeout(() => { root.remove(); document.documentElement.style.overflow = '' }, 220)
  last?.focus?.({ preventScroll: true })
}

// ─── menu (lingua e «altro») ─────────────────────────────────────────────────
let openMenu = null
function closeMenus() { if (openMenu) { const m = openMenu; openMenu = null; m.el.classList.add('is-hidden'); m.btn.setAttribute('aria-expanded', 'false'); setTimeout(() => m.el.remove(), 130) } }
function showMenu(btn, html, onPick) {
  if (openMenu?.btn === btn) { closeMenus(); return }
  closeMenus()
  const el = document.createElement('div')
  el.className = 'menu is-hidden'
  el.setAttribute('role', 'menu')
  el.innerHTML = html
  document.body.appendChild(el)
  const r = btn.getBoundingClientRect()
  el.style.top = `${r.bottom + 8}px`
  el.style.left = `${Math.max(8, Math.min(innerWidth - el.offsetWidth - 8, r.right - el.offsetWidth))}px`
  btn.setAttribute('aria-expanded', 'true')
  openMenu = { el, btn }
  requestAnimationFrame(() => el.classList.remove('is-hidden'))
  const items = $$('[role=menuitem]', el)
  items[0]?.focus()
  el.addEventListener('click', (e) => { const it = e.target.closest('[role=menuitem]'); if (it) { closeMenus(); onPick(it.dataset.v); btn.focus() } })
  el.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus() }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); closeMenus(); btn.focus() }
  })
}
document.addEventListener('pointerdown', (e) => { if (openMenu && !openMenu.el.contains(e.target) && !openMenu.btn.contains(e.target)) closeMenus() })
addEventListener('resize', closeMenus)

$('#lang-btn').addEventListener('click', (e) => showMenu(e.currentTarget, LANGS.map((l) => `<button role="menuitem" tabindex="-1" data-v="${l.code}"><img src="https://flagcdn.com/24x18/${l.flag}.png" alt="">${esc(l.name)}${l.code === lang ? ' ✓' : ''}</button>`).join(''), (v) => { lang = v; store.set(LANG_KEY, v); applyLang() }))
$('#more-btn').addEventListener('click', (e) => showMenu(e.currentTarget, `
  <button role="menuitem" tabindex="-1" data-v="user">${I.copy}${esc(ui().copyUser)}</button>
  <button role="menuitem" tabindex="-1" data-v="id">${I.copy}${esc(ui().copyId)}</button><hr>
  <button role="menuitem" tabindex="-1" data-v="open">${I.chat}${esc(ui().openDiscord)}</button>`, (v) => {
  if (v === 'user') copy(presence?.discord_user?.username || profile.username)
  else if (v === 'id') copy(ID)
  else window.open(`https://discord.com/users/${ID}`, '_blank', 'noopener')
}))
$('#copy-btn').addEventListener('click', () => copy(presence?.discord_user?.username || profile.username))
$('#theme-btn').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set(THEME_KEY, theme); applyTheme() })

// ─── lingua ──────────────────────────────────────────────────────────────────
function applyLang() {
  const u = ui(), l = LANGS.find((x) => x.code === lang) || LANGS[0]
  document.documentElement.lang = lang
  $('#lang-flag').src = `https://flagcdn.com/24x18/${l.flag}.png`
  $('#lang-code').textContent = l.code.toUpperCase()
  $('#lang-btn').setAttribute('aria-label', u.language)
  $('#msg-label').textContent = u.message
  $('#copy-btn').setAttribute('aria-label', u.copyUser); $('#copy-btn').title = u.copyUser
  $('#more-btn').setAttribute('aria-label', u.more); $('#more-btn').title = u.more
  $('#h-profile').textContent = u.profile
  $('#h-since').textContent = u.memberSince
  $('#h-conns').textContent = u.connections
  $('#h-socials').textContent = u.otherSocials
  const date = new Intl.DateTimeFormat(l.locale, { dateStyle: 'long' }).format(new Date(`${CONFIG.updated}T12:00:00`))
  $('#foot').innerHTML = `<b>${esc(CONFIG.domain)}</b> — ${esc(u.footFun)} · ${esc(u.footMain)} <a href="${esc(CONFIG.mainSite.url)}" target="_blank" rel="noopener">${esc(CONFIG.mainSite.label)}</a> · ${esc(u.updated)} ${esc(date)}<span id="views"></span>`
  applyTheme()
  renderCard()
  renderTabs()
  renderPanel()
  renderViews()
}

// ─── Lanyard (presenza dal vivo) ─────────────────────────────────────────────
function onPresence(d) {
  if (!d || !d.discord_user) return
  presence = d
  presenceAt = Date.now()
  renderCard()
  if (activeTab === 'board') { const n = $('#now-widget'); if (n) n.innerHTML = nowWidget() }
  if (activeTab === 'activity') renderActivity()
}
function connectLanyard() {
  let ws, beat, retry = 0, polling = null
  const poll = async () => { try { const j = await (await fetch(`https://api.lanyard.rest/v1/users/${ID}`, { cache: 'no-store' })).json(); if (j?.success) onPresence(j.data) } catch {} }
  poll()
  const open = () => {
    try { ws = new WebSocket('wss://api.lanyard.rest/socket') } catch { polling ??= setInterval(poll, 60000); return }
    ws.addEventListener('message', (e) => {
      let m; try { m = JSON.parse(e.data) } catch { return }
      if (m.op === 1) {
        clearInterval(beat)
        beat = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), m.d?.heartbeat_interval ?? 30000)
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: ID } }))
        retry = 0
        if (polling) { clearInterval(polling); polling = null }
      } else if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) onPresence(m.d)
    })
    ws.addEventListener('close', () => { clearInterval(beat); polling ??= setInterval(poll, 60000); setTimeout(open, Math.min(30000, 3000 * 2 ** retry++)) })
    ws.addEventListener('error', () => { try { ws.close() } catch {} })
  }
  open()
}

// ─── il profilo pubblico (banner, tema, bio, badge, collegamenti) ────────────
async function loadProfile() {
  try {
    const r = await fetch(`${CONFIG.profileApi}${ID}`, { cache: 'no-store' })
    if (!r.ok) return
    const d = await r.json()
    const u = d.user || {}, up = d.user_profile || {}
    if (Array.isArray(up.theme_colors) && up.theme_colors.length === 2) profile.theme = up.theme_colors.map((c) => '#' + Number(c).toString(16).padStart(6, '0'))
    if ('banner' in u) profile.banner = u.banner
    if (u.banner_color) profile.bannerColor = u.banner_color
    if (typeof up.bio === 'string') profile.bio = up.bio
    if (Array.isArray(d.badges)) profile.badges = d.badges.map((b) => ({ id: b.id, icon: b.icon, description: b.description, link: b.link }))
    if (Array.isArray(d.connected_accounts)) profile.connections = d.connected_accounts.map((c) => ({ type: c.type, name: c.name, id: c.id }))
    applyTheme()
    renderCard()
  } catch {}
}

// ─── visite (GoatCounter, solo se configurato) ───────────────────────────────
let views = null
function renderViews() {
  const box = $('#views')
  if (!box || views == null) return
  box.textContent = ` · ${views.toLocaleString(locale())} ${ui().views}`
}
function goatcounter(code) {
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`
  document.head.appendChild(s)
  fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`).then((r) => r.json()).then((j) => { const n = parseInt(String(j.count ?? '').replace(/[^\d]/g, ''), 10); if (!Number.isNaN(n)) { views = n; renderViews() } }).catch(() => {})
}

// ─── avvio ───────────────────────────────────────────────────────────────────
$('#msg').href = `https://discord.com/users/${ID}`
$('#avatar').addEventListener('error', (e) => { if (!e.currentTarget.src.endsWith('/me.png')) e.currentTarget.src = '/me.png' })
$('#banner').addEventListener('error', (e) => { e.currentTarget.hidden = true })
$('#deco').addEventListener('error', (e) => { e.currentTarget.hidden = true })
const fromHash = Object.entries(SLUG).find(([, s]) => `#${s}` === location.hash)?.[0]
if (fromHash) activeTab = fromHash
for (const p of $$('.tabpanel')) p.hidden = p.id !== `panel-${activeTab}`
applyLang()
mountEffect($('#card'))
connectLanyard()
loadProfile()
setInterval(loadProfile, 10 * 60 * 1000)
if (CONFIG.goatcounter) goatcounter(CONFIG.goatcounter)
addEventListener('hashchange', () => { const k = Object.entries(SLUG).find(([, s]) => `#${s}` === location.hash)?.[0]; if (k && k !== activeTab) showTab(k) })

// Per le prove: import('/assets/app.js').then((m) => m.onPresence({...}))
export { onPresence }
