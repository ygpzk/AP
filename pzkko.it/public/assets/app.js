// pzkko.it: il profilo di Discord, dal vivo. Lanyard dà avatar, decorazione, stato,
// Spotify, giochi, stato personalizzato e stile del nome; il profilo pubblico (dstn) dà
// banner, tema, bio, badge, collegamenti e gli oggetti da collezione; Discord dà la
// cornice e l'effetto veri. Niente librerie.

import { CONFIG, COLLECTIBLES, NAME_FONTS, SOCIALS, PROJECTS, TOOLS, LANGS } from './config.js'
import { I18N } from './i18n.js'
import { ICONS } from './icons.js'
import { MEDIA } from './media.js'
import { mountFrame, mountParallax, mountEffect } from './fx.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches
const wide = matchMedia('(min-width: 900px)')
const conn = navigator.connection
// immagini e filmati pesanti (banner animato, decorazione animata, effetto) solo dove non pesano
const heavy = !reduced && !conn?.saveData && !/(^|-)[23]g$/.test(conn?.effectiveType || '')
const ID = CONFIG.discordId
const CDN = 'https://cdn.discordapp.com'

// ─── icone ───────────────────────────────────────────────────────────────────
const svg = (d, { s = 18, fill = false, w = 2 } = {}) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`} aria-hidden="true">${d}</svg>`
const I = {
  chat: svg('<path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4.6 21.4a.6.6 0 0 0 .8.7l3.9-1.6c.9.2 1.8.3 2.7.3 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/>', { fill: true }),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  link: svg('<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.100l1.700-1.700"/>'),
  dots: svg('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>', { fill: true }),
  globe: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>', { s: 16 }),
  ext: svg('<path d="M7 17 17 7M9 7h8v8"/>', { s: 14, w: 2.2 }),
  sun: svg('<circle cx="12" cy="12" r="4.5"/><path d="M12 1.500v2.500M12 20v2.500M4.600 4.600l1.800 1.800M17.600 17.600l1.800 1.800M1.500 12H4M20 12h2.500M4.600 19.400l1.800-1.800M17.600 6.400l1.800-1.800"/>', { s: 16 }),
  moon: svg('<path d="M20.700 14.600A8.600 8.600 0 0 1 9.400 3.300a9 9 0 1 0 11.300 11.300z"/>', { s: 16, fill: true }),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>', { w: 2.4 }),
  left: svg('<path d="m15 6-6 6 6 6"/>', { s: 20, w: 2.4 }),
  right: svg('<path d="m9 6 6 6-6 6"/>', { s: 20, w: 2.4 }),
  check: svg('<path d="m5 12.500 4.500 4.500L19 7.500"/>', { s: 16, w: 2.6 }),
  ok: svg('<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.400 14.200-4-4 1.500-1.500 2.500 2.500 5.400-5.400 1.500 1.500z"/>', { s: 14, fill: true }),
  play: svg('<path d="M7 4.500v15l13-7.500z"/>', { s: 12, fill: true }),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2.500"/><circle cx="9" cy="10" r="1.800"/><path d="m4 18 5.500-5 4 3.500 2.500-2 4 3.500"/>', { s: 12 }),
  star: svg('<path d="m12 2.500 2.900 6.200 6.800.800-5 4.700 1.300 6.700L12 17.600l-6 3.300 1.300-6.700-5-4.700 6.800-.800z"/>', { s: 14, fill: true }),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.600-3.600"/>', { s: 16, w: 2.4 }),
  desktop: svg('<path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>', { s: 14, fill: true }),
  web: svg('<circle cx="12" cy="12" r="9.500"/><path d="M2.500 12h19M12 2.500c3 3.200 3 15.800 0 19M12 2.500c-3 3.200-3 15.800 0 19"/>', { s: 14 }),
  mobile: svg('<path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 4v13h10V4z"/>', { s: 14, fill: true }),
  game: svg('<path d="M6 7h12a5 5 0 0 1 4.900 6.020l-.800 4A3.200 3.200 0 0 1 16.400 18.600L14.600 16H9.400l-1.800 2.600a3.200 3.200 0 0 1-5.700-1.580l-.800-4A5 5 0 0 1 6 7zm1 3v1.500H5.500v1.500H7v1.500h1.500V13H10v-1.500H8.500V10H7zm9.500 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>', { s: 14, fill: true }),
  down: svg('<path d="M12 4v11m0 0-4.500-4.500M12 15l4.500-4.500M5 20h14"/>', { s: 16, w: 2.2 }),
  tool: svg('<path d="M14.700 6.300a4 4 0 0 0-5.200 5.200L3 18l3 3 6.500-6.500a4 4 0 0 0 5.200-5.200l-2.600 2.600-2.100-.500-.500-2.100z"/>', { s: 14 }),
}
I.site = I.web

// Le icone dei marchi: il colore cambia col tema senza ridisegnare (variabili --icl / --icd).
const hex2rgb = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const rgb2hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t)
const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
function brandColors(hex, o = {}) {
  const c = hex2rgb(hex), l = lum(c)
  const light = o.light ? `#${o.light}` : l > 0.55 ? rgb2hex(mix(c, [0, 0, 0], 0.32)) : `#${hex}`
  const dark = o.dark ? `#${o.dark}` : l < 0.07 ? '#ffffff' : l < 0.16 ? rgb2hex(mix(c, [255, 255, 255], 0.3)) : `#${hex}`
  return [light, dark]
}
function brand(key, o = {}) {
  const ic = ICONS[key]
  if (!ic) return ''
  const [l, d] = brandColors(ic[0], o)
  const inner = ic[1] ? `<path d="${ic[1]}"/>` : ic[3]
  return `<svg class="bi" style="--icl:${l};--icd:${d}" viewBox="${ic[1] ? '0 0 24 24' : ic[2]}" fill="currentColor" aria-hidden="true">${inner}</svg>`
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
const collectibles = structuredClone(COLLECTIBLES)
let presence = null, presenceAt = 0
const t = () => I18N[lang]
const ui = () => t().ui
const locale = () => (LANGS.find((l) => l.code === lang) || LANGS[0]).locale
const cap = (s) => (s && (s[lang] || s.en || s.it)) || ''
const username = () => presence?.discord_user?.username || profile.username

// ─── il tema del profilo, calcolato come lo calcola Discord ──────────────────
const rgb2hsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn
  if (!d) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
const hsl2rgb = ([h, s, l]) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}
const rgb2lab = (c) => {
  const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116)
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
const lab2rgb = ([L, A, B]) => {
  const y = (L + 16) / 116, x = A / 500 + y, z = y - B / 200
  const f = (v) => (v ** 3 > 0.008856 ? v ** 3 : (v - 16 / 116) / 7.787)
  const X = f(x) * 0.95047, Y = f(y), Z = f(z) * 1.08883
  return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z].map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255)
}
function themeVars(p, a, dark) {
  const P = hex2rgb(p), A = hex2rgb(a)
  // il velo: bianco all'80 % col tema chiaro, nero al 60 % con quello scuro
  const ring = dark ? mix(P, [0, 0, 0], 0.6) : mix(P, [255, 255, 255], 0.8)
  // la tinta del testo: il colore più scuro (o il più chiaro, col tema scuro) a saturazione piena
  let [hi, lo] = lum(P) > lum(A) ? [P, A] : [A, P]
  if (!rgb2hsl(lo)[0]) lo = hi
  const base = rgb2hsl(dark ? hi : lo)
  const purple = base[0] >= 200 && base[0] <= 300
  const tint = hsl2rgb([base[0], 1, purple ? (dark ? 0.8 : 0.25) : dark ? 0.95 : 0.15])
  // lo sfondo del pannello: la media dei due colori (in Lab), molto chiara o molto scura
  const mid = rgb2hsl(lab2rgb(mix(rgb2lab(P), rgb2lab(A), 0.5)).map((v) => Math.max(0, Math.min(255, v))))
  const modal = hsl2rgb([mid[0], Math.min(mid[1], 0.5), dark ? Math.min(mid[2], 0.1) : Math.max(mid[2], 0.86)])
  // il pulsante: il primario spento e scurito finché il bianco ci si legge
  const isMine = p.toLowerCase() === '#ccff00'
  const ph = rgb2hsl(P)
  const btn = isMine ? hex2rgb(dark ? '#5c7a52' : '#79966f') : hsl2rgb([ph[0], Math.min(ph[1], 0.24), dark ? 0.4 : 0.46])
  return { ring: rgb2hex(ring), tint: rgb2hex(tint), modal: rgb2hex(modal), btn: rgb2hex(btn) }
}
function applyTheme() {
  const root = document.documentElement
  root.dataset.theme = theme
  const [p, a] = profile.theme
  const v = themeVars(p, a, theme === 'dark')
  root.style.setProperty('--p', p)
  root.style.setProperty('--a', a)
  root.style.setProperty('--ring', v.ring)
  root.style.setProperty('--tint', v.tint)
  root.style.setProperty('--modal-bg', v.modal)
  root.style.setProperty('--btn', v.btn)
  $('meta[name=theme-color]')?.setAttribute('content', v.ring)
  const b = $('#theme-btn')
  b.innerHTML = theme === 'dark' ? I.sun : I.moon
  b.setAttribute('aria-label', theme === 'dark' ? ui().theme.light : ui().theme.dark)
  b.title = b.getAttribute('aria-label')
}

// ─── utilità ─────────────────────────────────────────────────────────────────
const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}` }
const sinceDate = () => new Date(Number((BigInt(ID) >> 22n) + 1420070400000n))
const STATUS_COLOR = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' }
function statusSvg(st) {
  const ring = 'var(--ring)'
  return `<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="${ring}"/><circle cx="15" cy="15" r="10" fill="${STATUS_COLOR[st] ?? STATUS_COLOR.offline}"/>${st === 'idle' ? `<circle cx="10.5" cy="10.5" r="6.5" fill="${ring}"/>` : ''}${st === 'dnd' ? `<rect x="8.5" y="13" width="13" height="4" rx="2" fill="${ring}"/>` : ''}${st === 'offline' ? `<circle cx="15" cy="15" r="4.5" fill="${ring}"/>` : ''}</svg>`
}
let toastTimer
function toast(msg) {
  const el = $('#toast')
  el.innerHTML = `${I.check}<span>${esc(msg)}</span>`
  el.classList.add('is-on')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 1700)
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
  if (act.application_id && /^\d+$/.test(a)) return `${CDN}/app-assets/${act.application_id}/${a}.png`
  return null
}
// un cambio di vista con la dissolvenza del browser, dove c'è
const swap = (fn) => (document.startViewTransition && !reduced ? document.startViewTransition(fn) : (fn(), null))
const emojiHtml = (e, size = 32) => (e ? (e.id && /^\d+$/.test(e.id) ? `<img src="${CDN}/emojis/${e.id}.${e.animated ? 'gif' : 'png'}?size=${size}" alt="${esc(e.name)}">` : esc(e.name)) : '')

// ─── la scheda a sinistra ────────────────────────────────────────────────────
const shown = {}
function setImg(el, key, url) {
  if (shown[key] === url) return false
  shown[key] = url
  el.src = url
  return true
}
function renderBanner() {
  const h = profile.banner, banner = $('#banner'), amb = $('#ambient')
  banner.parentElement.style.background = profile.bannerColor || '#110f10'
  if (!h || !/^[a-z0-9_]+$/i.test(h)) { banner.hidden = true; amb.classList.remove('is-on'); shown.bannerHash = null; return }
  banner.hidden = false
  if (shown.bannerHash === h) return
  shown.bannerHash = h
  const base = `${CDN}/banners/${ID}/${h}.webp`
  // prima il fermo immagine (20 KB), poi il banner animato dove non pesa
  banner.src = `${base}?size=600`
  if (h.startsWith('a_') && heavy) {
    const anim = `${base}?size=${wide.matches ? 480 : 300}&animated=true`
    const pre = new Image()
    pre.onload = () => { if (shown.bannerHash === h) banner.src = anim }
    const go = () => { pre.src = anim }
    if (document.readyState === 'complete') setTimeout(go, 600); else addEventListener('load', () => setTimeout(go, 600), { once: true })
  }
  amb.onload = () => amb.classList.add('is-on')
  amb.src = `${base}?size=300`
}
function renderAvatar() {
  const u = presence?.discord_user
  const av = u?.avatar ?? profile.avatar
  const ok = av && /^[a-z0-9_]+$/i.test(av)
  const url = ok ? `${CDN}/avatars/${ID}/${av}.webp?size=256${av.startsWith('a_') && heavy ? '&animated=true' : ''}` : '/me.png'
  setImg($('#avatar'), 'avatar', url)
  if (u && ok) setFavicon(`${CDN}/avatars/${ID}/${av}.png?size=64`)
  const deco = u ? u.avatar_decoration_data?.asset : profile.decoration
  const el = $('#deco')
  if (!deco || !/^[a-z0-9_]+$/i.test(deco)) { el.hidden = true; shown.deco = null; return }
  if (shown.deco === deco) return
  shown.deco = deco
  el.hidden = false
  // prima la decorazione ferma (40 KB), poi quella animata dove non pesa
  el.src = `${CDN}/avatar-decoration-presets/${deco}.png?size=240&passthrough=false`
  if (deco.startsWith('a_') && heavy) {
    const anim = `${CDN}/avatar-decoration-presets/${deco}.webp?size=160&animated=true`
    const pre = new Image()
    pre.onload = () => { if (shown.deco === deco) el.src = anim }
    setTimeout(() => { pre.src = anim }, 1500)
  }
}
function renderName() {
  const u = presence?.discord_user, el = $('#dname')
  el.textContent = u?.global_name || u?.display_name || profile.displayName
  const st = u?.display_name_styles ?? profile.nameStyle
  const f = NAME_FONTS[st?.font_id]
  if (f) {
    el.dataset.font = f[0]
    el.style.setProperty('--dn-font', `"${f[0]}"`)
    el.style.setProperty('--dn-weight', f[1])
    el.style.setProperty('--dn-space', f[2])
  } else delete el.dataset.font
  // l'effetto del nome: tinta unita, sfumatura, neon, pop, bagliore
  const c = (st?.colors || []).map((n) => '#' + Number(n).toString(16).padStart(6, '0'))
  const s = el.style
  s.color = s.backgroundImage = s.textShadow = s.webkitBackgroundClip = s.backgroundClip = ''
  if (c.length) {
    if (st.effect_id === 2 && c[1]) { s.backgroundImage = `linear-gradient(90deg, ${c[0]}, ${c[1]})`; s.webkitBackgroundClip = s.backgroundClip = 'text'; s.color = 'transparent' }
    else {
      s.color = c[0]
      if (st.effect_id === 3) s.textShadow = `0 0 6px ${c[0]}, 0 0 14px ${c[1] || c[0]}`
      else if (st.effect_id === 4 || st.effect_id === 5) s.textShadow = `2px 2px 0 ${c[1] || 'rgba(0,0,0,.35)'}`
      else if (st.effect_id === 6) s.textShadow = `0 0 12px ${c[1] || c[0]}`
    }
  }
  return f
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
  const ico = (m.icon && brand(m.icon)) || I.globe
  const ok = c.verified ? `<span class="conn__ok" title="${esc(ui().verified)}">${I.ok}<span class="sr">${esc(ui().verified)}</span></span>` : ''
  const inner = `<span class="conn__ico">${ico}</span><span>${esc(c.name)}</span>${ok}${m.url ? `<span class="conn__arrow">${I.ext}</span>` : ''}`
  return `<li>${m.url ? `<a class="conn" href="${esc(encodeURI(m.url))}" target="_blank" rel="noopener me">${inner}</a>` : `<span class="conn">${inner}</span>`}</li>`
}
function renderCard() {
  const u = presence?.discord_user
  const p = profile
  renderBanner()
  renderAvatar()
  renderName()
  // stato
  const st = presence?.discord_status || 'offline'
  $('#status').innerHTML = statusSvg(st)
  $('#status').title = t().status[st]
  $('#avatar-box').setAttribute('aria-label', `${p.displayName}, ${t().status[st]}`)
  // stato personalizzato
  const custom = presence?.activities?.find((x) => x.type === 4)
  const bubble = $('#bubble')
  if (custom && (custom.state || custom.emoji)) {
    const emo = emojiHtml(custom.emoji)
    $('.bubble__text', bubble).innerHTML = `${emo}${emo && custom.state ? ' ' : ''}${esc(custom.state ?? '')}`
    bubble.hidden = false
  } else bubble.hidden = true
  // nome utente, tag del server, badge
  $('#uname').textContent = u?.username || p.username
  const g = u?.primary_guild?.identity_enabled ? { tag: u.primary_guild.tag, id: u.primary_guild.identity_guild_id, badge: u.primary_guild.badge } : (u ? null : p.guild)
  const gt = $('#gtag')
  if (g?.tag) { gt.innerHTML = `${g.badge && /^[a-z0-9_]+$/i.test(g.badge) && /^\d+$/.test(g.id) ? `<img src="${CDN}/clan-badges/${g.id}/${g.badge}.png?size=32" alt="">` : ''}${esc(g.tag)}`; gt.hidden = false } else gt.hidden = true
  $('#badges').innerHTML = p.badges.filter((b) => /^[a-z0-9_]+$/i.test(b.icon || '')).map((b) => {
    const img = `<img src="${CDN}/badge-icons/${b.icon}.png" alt="${esc(b.description)}" width="22" height="22" draggable="false">`
    return b.link && /^https:\/\//.test(b.link) ? `<a href="${esc(b.link)}" target="_blank" rel="noopener" title="${esc(b.description)}">${img}</a>` : `<span title="${esc(b.description)}">${img}</span>`
  }).join('')
  $('#badges').hidden = !p.badges.length
  // sezioni
  $('#bio').textContent = p.bio || ''
  $('#bio-sec').hidden = !p.bio
  $('#since').textContent = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(sinceDate())
  $('#conns').innerHTML = p.connections.map(connRow).join('')
  $('#social-icons').innerHTML = SOCIALS.filter((s) => s.key !== 'discord').map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener me" title="${esc(`${s.name} · ${s.handle}`)}" aria-label="${esc(`${s.name} ${s.handle}`)}">${brand(s.icon, s)}</a>`).join('')
  renderCardActivity()
  fitBio()
}
function fitBio() {
  const bio = $('#bio'), more = $('#bio-more')
  if (more.dataset.open === '1') { bio.classList.remove('is-clamped'); more.hidden = false; more.textContent = ui().showLess; return }
  bio.classList.add('is-clamped')
  more.textContent = ui().showMore
  more.hidden = !(bio.scrollHeight > bio.clientHeight + 2)
}
$('#bio-more').addEventListener('click', (e) => { const b = e.currentTarget; b.dataset.open = b.dataset.open === '1' ? '' : '1'; fitBio() })
$('#bubble').addEventListener('click', (e) => e.currentTarget.classList.toggle('is-open'))

let faviconSet = ''
function setFavicon(url) {
  if (faviconSet === url) return
  faviconSet = url
  for (const l of $$('link[rel~="icon"]')) l.remove()
  const l = document.createElement('link')
  l.rel = 'icon'
  l.type = 'image/png'
  l.href = url
  document.head.appendChild(l)
}

// ─── attività dal vivo ───────────────────────────────────────────────────────
function bar(start, end, now) {
  const total = Math.max(0, end - start), done = Math.min(total, Math.max(0, now - start)), pct = total ? (done / total) * 100 : 0
  return `<div class="bar-t"><span>${clock(done)}</span><div class="bar-t__track"><div class="bar-t__fill" style="width:${pct.toFixed(1)}%"></div></div><span>${clock(total)}</span></div>`
}
function spotifyHtml(s, now) {
  const link = s.track_id ? `https://open.spotify.com/track/${encodeURIComponent(s.track_id)}` : null
  return `<div class="act"><div class="act__art"><img src="${esc(s.album_art_url)}" alt="" draggable="false"></div><div class="act__lines">
      <b>${link ? `<a href="${link}" target="_blank" rel="noopener">${esc(s.song)}</a>` : esc(s.song)}</b>
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
  if (presence?.listening_to_spotify && presence.spotify) out.push({ head: `${brand('spotify', { light: '169c46' })}<span>${esc(ui().listening)}</span>`, body: spotifyHtml(presence.spotify, now), ticking: true })
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
  return d.length ? `<div class="devices">${esc(ui().activeOn)} ${d.map(([k, l]) => `<span class="role">${I[k]}${esc(l)}</span>`).join('')}</div>` : ''
}
function nowWidget() {
  const st = presence?.discord_status || 'offline'
  const items = liveItems()
  const body = items.length ? items.map((x) => `<div class="widget__h" style="margin-bottom:8px">${x.head}</div>${x.body}`).join('<hr class="act-sep">') : `<p class="act__muted">${esc(ui().nothing)}</p>`
  return `<div class="widget__h"><span>${esc(ui().now)}</span><span class="right live">${esc(ui().live)}</span></div>
    <div class="status-line"><span class="status-dot" style="background:${STATUS_COLOR[st]}"></span>${esc(t().status[st])}</div>${body}${devicesHtml()}`
}

// ─── i progetti: copertine, filmati, ruoli ───────────────────────────────────
const rolesHtml = (list) => `<div class="roles">${list.map(([name, ic]) => `<span class="role">${ICONS[ic] ? brand(ic) : `<i style="--c:${esc(ic || 'var(--muted)')}"></i>`}${esc(name)}</span>`).join('')}</div>`
const archived = (p) => !p.url && !p.code && !p.download
function mediaHtml(p, { eager = false, chips = true } = {}) {
  const m = MEDIA[p.key]
  if (!m) return `<span class="media__ph">${esc(p.title)}</span>`
  const n = m.shots.length
  return `<img src="${esc(m.cover)}" alt="" width="1280" height="720" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false">
    ${m.video ? `<video muted loop playsinline preload="none" disableremoteplayback data-src="${esc(m.video.src)}" aria-hidden="true" tabindex="-1"></video>` : ''}
    ${chips ? `<span class="chip chip--tl">${I[p.kind] || ''}${esc(ui().kind[p.kind] || '')}</span>${m.video || n ? `<span class="chip chip--br">${m.video ? `${I.play}${clock(m.video.seconds * 1000)}` : ''}${m.video && n ? ' · ' : ''}${n ? `${I.image}${n}` : ''}</span>` : ''}` : ''}`
}
function linksHtml(p, primary = false) {
  const u = ui()
  return `${p.url ? `<a class="btn ${primary ? 'btn--msg' : 'btn--ghost'}" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(u.open)} ${I.ext}</a>` : ''}${p.download ? `<a class="btn ${primary && !p.url ? 'btn--msg' : 'btn--ghost'}" href="${esc(p.download)}" rel="noopener">${I.down}${esc(u.download)}</a>` : ''}${p.code ? `<a class="btn btn--ghost" href="${esc(p.code)}" target="_blank" rel="noopener">${brand('github', { dark: 'ffffff' }).replace('<svg ', '<svg width="16" height="16" ')}${esc(u.code)}</a>` : ''}`
}
// i filmati: al passaggio del mouse sul computer, quando la scheda è in vista sul telefono
let autoIO = null
function playMedia(el) {
  const v = $('video', el)
  if (!v || reduced) return
  if (!v.src) v.src = v.dataset.src
  v.play().then(() => el.classList.add('is-playing')).catch(() => {})
}
function stopMedia(el) {
  const v = $('video', el)
  if (!v) return
  el.classList.remove('is-playing')
  v.pause()
}
function wireMedia(root) {
  for (const el of $$('.media', root)) {
    if (!$('video', el)) continue
    if (canHover) {
      el.addEventListener('pointerenter', () => playMedia(el))
      el.addEventListener('pointerleave', () => { if (!el.dataset.auto) stopMedia(el) })
      el.addEventListener('focus', () => playMedia(el))
      el.addEventListener('blur', () => { if (!el.dataset.auto) stopMedia(el) })
      if (el.dataset.auto && heavy) (autoIO ??= makeAutoIO()).observe(el)
    } else if (heavy) (autoIO ??= makeAutoIO()).observe(el)
  }
}
const makeAutoIO = () => new IntersectionObserver((es) => { for (const e of es) e.isIntersecting && !modal ? playMedia(e.target) : stopMedia(e.target) }, { threshold: 0.7 })

// ─── le schede a destra ──────────────────────────────────────────────────────
const TABS = ['board', 'projects', 'activity', 'social']
const SLUG = { board: 'bacheca', projects: 'progetti', activity: 'attivita', social: 'social' }
let activeTab = 'board', filter = 'all'
function renderTabs() {
  $('#tabs').innerHTML = TABS.map((k) => `<button class="tab" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${k === activeTab}" tabindex="${k === activeTab ? 0 : -1}" data-tab="${k}">${esc(ui().tabs[k])}${k === 'projects' ? `<span class="tab__n">${PROJECTS.length}</span>` : ''}</button>`).join('') + '<span class="tabs__ink" aria-hidden="true"></span>'
  moveInk()
}
function moveInk() {
  const tab = $(`#tab-${activeTab}`), ink = $('.tabs__ink')
  if (!tab || !ink) return
  ink.style.width = `${tab.offsetWidth}px`
  ink.style.transform = `translateX(${tab.offsetLeft}px)`
  tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}
function showTab(k, { focus = false, url = true } = {}) {
  if (!TABS.includes(k)) return
  const changed = k !== activeTab
  const go = () => {
    activeTab = k
    for (const b of $$('.tab')) { const on = b.dataset.tab === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1 }
    moveInk()
    for (const p of $$('.tabpanel')) p.hidden = p.id !== `panel-${k}`
    renderPanel()
  }
  if (changed) swap(go); else go()
  if (focus) $(`#tab-${k}`)?.focus({ preventScroll: true })
  // se la barra è agganciata in alto si riparte dall'inizio della scheda
  if (changed && $('#bar').classList.contains('is-stuck')) $('#panel').scrollIntoView({ block: 'start', behavior: 'auto' })
  if (url) {
    const hash = `#${SLUG[k]}`
    if (location.hash !== hash && !(k === 'board' && !location.hash)) history.replaceState(null, '', hash)
  }
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab) })
$('#tabs').addEventListener('keydown', (e) => {
  const i = TABS.indexOf(activeTab)
  if (e.key === 'ArrowRight') { e.preventDefault(); showTab(TABS[(i + 1) % TABS.length], { focus: true }) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); showTab(TABS[(i - 1 + TABS.length) % TABS.length], { focus: true }) }
  if (e.key === 'Home') { e.preventDefault(); showTab(TABS[0], { focus: true }) }
  if (e.key === 'End') { e.preventDefault(); showTab(TABS.at(-1), { focus: true }) }
})

function renderBoard() {
  const u = ui()
  const feat = PROJECTS.find((p) => p.featured && MEDIA[p.key]) || PROJECTS.find((p) => MEDIA[p.key]) || PROJECTS[0], tx = t().projects[feat.key]
  const others = PROJECTS.filter((p) => p !== feat)
  const root = $('#panel-board')
  root.innerHTML = `<div class="grid2">
    <article class="hero span2 rise">
      <button type="button" class="hero__media media" data-open="${feat.key}" data-auto="1" aria-label="${esc(`${u.details}: ${feat.title}`)}">${mediaHtml(feat, { eager: true })}</button>
      <div class="hero__body">
        <div class="widget__h" style="margin:0">${I.star}<span>${esc(u.featured)}</span></div>
        <h2 class="hero__title">${esc(feat.title)}</h2>
        <p>${esc(tx.card)}</p>
        ${rolesHtml(feat.tags)}
        <div class="hero__actions"><button type="button" class="btn btn--msg" data-open="${feat.key}">${esc(u.details)}</button>${linksHtml(feat)}</div>
      </div>
    </article>
    <div class="widget rise" style="--i:1" id="now-widget">${nowWidget()}</div>
    <div class="widget rise" style="--i:2"><div class="widget__h"><span>${esc(u.aboutTitle)}</span></div><p>${esc(u.aboutText)}</p></div>
    <div class="widget span2 rise" style="--i:3">
      <div class="widget__h"><span>${esc(u.others)}</span><button type="button" class="link" data-goto="projects">${esc(u.seeAll)} →</button></div>
      <div class="strip">${others.map((p) => `<button type="button" class="mini" data-open="${p.key}"><span class="mini__thumb media">${mediaHtml(p, { chips: false }).replace(/<video[^>]*><\/video>/, '')}</span><span><b>${esc(p.title)}</b><span class="sub">${esc(u.kind[p.kind] || '')}</span></span></button>`).join('')}</div>
    </div>
    <div class="widget span2 rise" style="--i:4"><div class="widget__h"><span>${esc(u.tools)}</span></div>${rolesHtml(TOOLS)}</div>
    <div class="widget main-site span2 rise" style="--i:5">
      <div class="widget__h">${I.globe}<span>${esc(u.mainTitle)}</span></div>
      <div class="cta"><p>${esc(u.mainText)}</p><a class="btn btn--msg" href="${esc(CONFIG.mainSite.url)}" target="_blank" rel="noopener">${esc(u.mainCta)} ${I.ext}</a></div>
    </div>
  </div>`
  wireMedia(root)
}
function projectCard(p, i) {
  const u = ui(), tx = t().projects[p.key]
  return `<article class="pcard rise" style="--i:${Math.min(i, 8)}">
    <button type="button" class="pcard__cover media" data-open="${p.key}" aria-label="${esc(`${u.details}: ${p.title}`)}">${mediaHtml(p, { eager: i < 2 })}</button>
    <div class="pcard__body">
      <h3 class="pcard__title">${esc(p.title)}${archived(p) ? `<span class="tag">${esc(u.archived)}</span>` : ''}</h3>
      <p class="pcard__desc">${esc(tx.card)}</p>
      ${rolesHtml(p.tags)}
      <div class="pcard__actions"><button type="button" class="btn btn--msg" data-open="${p.key}">${esc(u.details)}</button>${linksHtml(p)}</div>
    </div></article>`
}
function renderProjects() {
  const u = ui(), root = $('#panel-projects')
  const kinds = ['all', ...new Set(PROJECTS.map((p) => p.kind))]
  const list = PROJECTS.filter((p) => filter === 'all' || p.kind === filter)
  root.innerHTML = `<div class="filters" role="group" aria-label="${esc(u.tabs.projects)}">${kinds.map((k) => `<button type="button" class="filter" data-filter="${k}" aria-pressed="${k === filter}">${esc(u.filters[k])}<b>${k === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.kind === k).length}</b></button>`).join('')}<span class="filters__note">${I.image}${esc(u.real)}</span></div>
    <div class="grid2" id="pgrid">${list.map(projectCard).join('')}</div>`
  wireMedia(root)
}
function renderCollection() {
  const u = ui(), rows = []
  const eff = collectibles[profile.effectSku], frame = collectibles[profile.frameSku], deco = collectibles[profile.decorationSku]
  const decoAsset = presence?.discord_user ? presence.discord_user.avatar_decoration_data?.asset : profile.decoration
  if (profile.effectSku && eff) rows.push([eff.thumb?.startsWith(`${CDN}/`) ? `<img src="${esc(eff.thumb)}" alt="" loading="lazy">` : '', eff.name, u.colEffect, ''])
  const front = frame?.layers?.find((l) => l.order === 'front')
  if (profile.frameSku && frame && front) rows.push([`<img src="${CDN}/media/v1/collectibles-shop/${profile.frameSku}/${front.id}/static?format=webp" alt="" loading="lazy" style="object-fit:cover;object-position:50% 12%;scale:1.6">`, frame.name, u.colFrame, ''])
  if (decoAsset && /^[a-z0-9_]+$/i.test(decoAsset)) rows.push([`<img src="${CDN}/avatar-decoration-presets/${decoAsset}.png?size=96&passthrough=false" alt="" loading="lazy">`, deco?.name || '—', u.colDeco, ''])
  const st = presence?.discord_user?.display_name_styles ?? profile.nameStyle, f = NAME_FONTS[st?.font_id]
  if (f) rows.push([`<span style="font-family:'${f[0]}',var(--font-sans);font-weight:${f[1]}">Aa</span>`, f[0], u.colFont, ' col__img--name'])
  if (!rows.length) return ''
  return `<div class="widget span2 rise" style="--i:2"><div class="widget__h"><span>${esc(u.collection)}</span></div><div class="grid2 col">${rows.map(([img, name, sub, cls]) => `<div class="col__row"><span class="col__img${cls}">${img}</span><span style="min-width:0"><b>${esc(name)}</b><span class="sub">${esc(sub)}</span></span></div>`).join('')}</div></div>`
}
function renderActivity() {
  const u = ui()
  const custom = presence?.activities?.find((x) => x.type === 4)
  const ago = presenceAt ? new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' }).format(-Math.round((Date.now() - presenceAt) / 1000 / 60), 'minute') : ''
  $('#panel-activity').innerHTML = `<div class="grid2">
    <div class="widget span2 rise" id="now-widget-2">${nowWidget()}</div>
    ${custom && (custom.state || custom.emoji) ? `<div class="widget span2 rise" style="--i:1"><div class="widget__h"><span>${esc(u.customStatus)}</span></div><p class="quote">${emojiHtml(custom.emoji, 48)}${custom.emoji && custom.state ? ' ' : ''}${esc(custom.state ?? '')}</p></div>` : ''}
    ${renderCollection()}
  </div>${ago ? `<p class="fine">${esc(u.updatedAgo)} ${esc(ago)} · Lanyard</p>` : ''}`
}
function renderSocial() {
  const u = ui()
  const verified = new Set(profile.connections.filter((c) => c.verified).map((c) => `${(CONN[c.type]?.(c).icon) || c.type}:${String(c.name).toLowerCase()}`))
  const row = (s, i) => {
    const ok = s.key === 'discord' || verified.has(`${s.icon}:${s.handle.toLowerCase()}`)
    return `<a class="srow rise" style="--i:${Math.min(i + 1, 10)};--c:#${ICONS[s.icon]?.[0] || '888'}" href="${esc(s.url)}" target="_blank" rel="noopener me"><span class="srow__ico">${brand(s.icon, s)}</span><span class="srow__txt"><span class="srow__name">${esc(s.name)}${ok ? `<span class="conn__ok" title="${esc(u.verified)}">${I.ok}<span class="sr">${esc(u.verified)}</span></span>` : ''}</span><span class="srow__handle">${esc(s.handle)}</span></span><span class="srow__go">${I.ext}</span></a>`
  }
  $('#panel-social').innerHTML = `<div class="sgrid">
    <a class="srow span2 main-site rise" href="${esc(CONFIG.mainSite.url)}" target="_blank" rel="noopener"><span class="srow__ico">${I.globe}</span><span class="srow__txt"><span class="srow__name">${esc(u.mainTitle)}</span><span class="srow__handle">${esc(CONFIG.mainSite.label)}</span></span><span class="srow__go">${I.ext}</span></a>
    ${SOCIALS.map(row).join('')}</div>`
}
function renderPanel() {
  if (activeTab === 'board') renderBoard()
  else if (activeTab === 'projects') renderProjects()
  else if (activeTab === 'activity') renderActivity()
  else renderSocial()
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]')
  if (o) { openProject(o.dataset.open, { from: o.classList.contains('media') ? o : o.closest('.pcard, .hero')?.querySelector('.media') }); return }
  const g = e.target.closest('[data-goto]')
  if (g) { showTab(g.dataset.goto, { focus: true }); return }
  const f = e.target.closest('[data-filter]')
  if (f && f.dataset.filter !== filter) { filter = f.dataset.filter; swap(renderProjects) }
})

// il battito per le barre di Spotify e i tempi dei giochi
setInterval(() => {
  if (!presence || document.hidden || !liveItems().some((x) => x.ticking)) return
  renderCardActivity()
  const n1 = $('#now-widget'), n2 = $('#now-widget-2')
  if (n1 && activeTab === 'board') n1.innerHTML = nowWidget()
  if (n2 && activeTab === 'activity') n2.innerHTML = nowWidget()
}, 1000)

// ─── la scheda del progetto ──────────────────────────────────────────────────
let modal = null
function openProject(key, { from = null, push = true } = {}) {
  const p = PROJECTS.find((x) => x.key === key)
  if (!p || modal?.key === key) return
  if (modal) closeProject({ instant: true, pop: false })
  closeMenus()
  closeSearch()
  const u = ui(), tx = t().projects[key], m = MEDIA[key]
  const slides = m ? [...(m.video ? [{ video: m.video, img: m.cover }] : []), ...m.shots.map((s) => ({ img: s.src, w: s.w, h: s.h, cap: s }))] : []
  if (m && !slides.length) slides.push({ img: m.cover, w: 1280, h: 720 })
  const root = document.createElement('div')
  root.className = 'pv'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-labelledby', 'pv-title')
  root.innerHTML = `<div class="pv__bg" data-close></div>
    <div class="pv__panel" tabindex="-1">
      <div class="pv__top">
        <button type="button" class="ctrl" data-share aria-label="${esc(u.copyLink)}" title="${esc(u.copyLink)}">${I.link.replace('width="18" height="18"', 'width="16" height="16"')}</button>
        <button type="button" class="ctrl" data-close aria-label="${esc(u.close)}" title="${esc(u.close)}">${I.close.replace('width="18" height="18"', 'width="16" height="16"')}</button>
      </div>
      ${slides.length ? `<div class="pv__stage">
        <div class="pv__strip" data-strip tabindex="0" aria-label="${esc(`${slides.length} ${u.shots}`)}">${slides.map((s, i) => `<div class="pv__slide" style="--img:url('${esc(s.img)}')">${s.video
          ? `<video src="${esc(s.video.src)}" poster="${esc(s.img)}" muted loop playsinline ${reduced ? 'controls' : 'autoplay'} disableremoteplayback></video>`
          : `<img src="${esc(s.img)}" alt="${esc(cap(s.cap) || `${p.title} ${i + 1}`)}" ${s.w ? `width="${s.w}" height="${s.h}"` : ''} ${i > 1 ? 'loading="lazy"' : ''} decoding="async" draggable="false">`}</div>`).join('')}</div>
        ${slides.length > 1 ? `<button type="button" class="pv__nav pv__nav--prev" data-step="-1" aria-label="${esc(u.prev)}">${I.left}</button><button type="button" class="pv__nav pv__nav--next" data-step="1" aria-label="${esc(u.next)}">${I.right}</button>` : ''}
        <div class="pv__cap" data-cap></div>
      </div>
      ${slides.length > 1 ? `<div class="pv__thumbs" data-thumbs>${slides.map((s, i) => `<button type="button" class="pv__thumb" data-go="${i}" aria-label="${i + 1}" aria-current="${i === 0}"><img src="${esc(s.video ? s.img : s.img)}" alt="" loading="lazy" decoding="async">${s.video ? `<span class="play">${I.play.replace('width="12" height="12"', 'width="18" height="18"')}</span>` : ''}</button>`).join('')}</div>` : ''}` : ''}
      <div class="pv__body">
        <div class="pv__head">
          <div style="min-width:0;flex:1 1 280px"><span class="pv__kind">${esc(u.kind[p.kind] || '')}${archived(p) ? ` · ${esc(u.archived)}` : ''}</span><h2 class="pv__title" id="pv-title">${esc(p.title)}</h2>${rolesHtml(p.tags)}</div>
          ${p.url || p.code || p.download ? `<div class="pv__links">${linksHtml(p, true)}</div>` : ''}
        </div>
        <div class="widget"><div class="widget__h"><span>${esc(u.overview)}</span></div><p>${esc(tx.full)}</p></div>
        <div class="grid2">
          <div class="widget"><div class="widget__h"><span>${esc(u.features)}</span></div><ul class="feat">${tx.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
          <div class="widget"><div class="widget__h"><span>${esc(u.role)}</span></div><p>${esc(tx.role)}</p></div>
        </div>
        ${slides.length ? `<p class="fine">${I.image}${esc(u.real)}</p>` : ''}
      </div>
    </div>`
  const strip = $('[data-strip]', root), capEl = $('[data-cap]', root)
  let index = -1
  const setIndex = (i) => {
    i = Math.max(0, Math.min(slides.length - 1, i))
    if (i === index) return
    index = i
    for (const d of $$('[data-go]', root)) { const on = +d.dataset.go === i; d.setAttribute('aria-current', on); if (on) d.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' }) }
    const s = slides[i]
    if (capEl) capEl.innerHTML = `<b>${i + 1} / ${slides.length}</b>${esc(s.video ? u.video : cap(s.cap))}`
    const prev = $('.pv__nav--prev', root), next = $('.pv__nav--next', root)
    if (prev) { prev.disabled = i === 0; next.disabled = i === slides.length - 1 }
    const v = $('video', root)
    if (v && !reduced) slides[i].video ? v.play().catch(() => {}) : v.pause()
  }
  const go = (i) => strip?.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * strip.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
  strip?.addEventListener('scroll', () => setIndex(Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))), { passive: true })
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return closeProject()
    if (e.target.closest('[data-share]')) return copy(`${location.origin}/#${SLUG.projects}/${key}`)
    const d = e.target.closest('[data-go]')
    if (d) return go(+d.dataset.go)
    const s = e.target.closest('[data-step]')
    if (s) return go(index + +s.dataset.step)
    const v = e.target.closest('video')
    if (v && !v.controls) v.paused ? v.play().catch(() => {}) : v.pause()
  })
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeProject() }
    else if (e.key === 'ArrowRight' && slides.length > 1) { e.preventDefault(); go(index + 1) }
    else if (e.key === 'ArrowLeft' && slides.length > 1) { e.preventDefault(); go(index - 1) }
    else if (e.key === 'Tab') {
      const f = $$('a[href],button:not([disabled]),[data-strip]', root)
      const panel = $('.pv__panel', root)
      if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === panel)) { e.preventDefault(); f.at(-1).focus() }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus() }
    }
  })
  const pushed = push && location.hash !== `#${SLUG.projects}/${key}`
  if (pushed) history.pushState({ pv: key }, '', `#${SLUG.projects}/${key}`)
  modal = { root, key, last: document.activeElement, pushed }
  for (const el of $$('.media.is-playing')) stopMedia(el)
  const mount = () => {
    document.body.appendChild(root)
    document.documentElement.style.overflow = 'hidden'
    setIndex(0)
  }
  const stage = $('.pv__stage', root)
  const fromOk = from && stage && from.getBoundingClientRect().bottom > 0 && from.getBoundingClientRect().top < innerHeight
  if (document.startViewTransition && !reduced && fromOk) {
    // la copertina della scheda diventa l'immagine grande della finestra
    from.style.viewTransitionName = 'pv-media'
    const tr = document.startViewTransition(() => { from.style.viewTransitionName = ''; root.classList.add('is-on'); stage.style.viewTransitionName = 'pv-media'; mount() })
    tr.finished.finally(() => { stage.style.viewTransitionName = '' })
  } else {
    mount()
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-on')))
  }
  $('.pv__panel', root).focus({ preventScroll: true })
}
function closeProject({ instant = false, pop = true } = {}) {
  if (!modal) return
  const { root, last, pushed } = modal
  modal = null
  root.classList.remove('is-on')
  $('video', root)?.pause()
  const done = () => { root.remove(); if (!modal) document.documentElement.style.overflow = '' }
  if (instant) done(); else setTimeout(done, 240)
  if (pop) {
    if (pushed) history.back()
    else if (location.hash.includes('/')) history.replaceState(null, '', `#${SLUG[activeTab]}`)
  }
  last?.focus?.({ preventScroll: true })
}

// ─── gli indirizzi: #progetti, #progetti/zero… e il tasto «indietro» ─────────
function parseHash() {
  const [a, b] = decodeURIComponent(location.hash.slice(1)).split('/')
  const tab = Object.entries(SLUG).find(([, s]) => s === a)?.[0] || null
  return { tab, proj: tab === 'projects' && PROJECTS.some((p) => p.key === b) ? b : null }
}
function route() {
  const { tab, proj } = parseHash()
  if (tab && tab !== activeTab) showTab(tab, { url: false })
  if (proj) openProject(proj, { push: false })
  else if (modal) closeProject({ pop: false })
}
addEventListener('hashchange', route)
addEventListener('popstate', route)

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
  el.style.top = `${Math.min(r.bottom + 8, innerHeight - el.offsetHeight - 8)}px`
  el.style.left = `${Math.max(8, Math.min(innerWidth - el.offsetWidth - 8, r.right - el.offsetWidth))}px`
  btn.setAttribute('aria-expanded', 'true')
  openMenu = { el, btn }
  requestAnimationFrame(() => el.classList.remove('is-hidden'))
  const items = $$('[role=menuitem]', el)
  items[0]?.focus({ preventScroll: true })
  el.addEventListener('click', (e) => { const it = e.target.closest('[role=menuitem]'); if (it) { closeMenus(); onPick(it.dataset.v); btn.focus({ preventScroll: true }) } })
  el.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus() }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); closeMenus(); btn.focus() }
  })
}
document.addEventListener('pointerdown', (e) => { if (openMenu && !openMenu.el.contains(e.target) && !openMenu.btn.contains(e.target)) closeMenus() })
addEventListener('resize', closeMenus)
addEventListener('scroll', closeMenus, { passive: true })

const flag = (f) => `/assets/flags/${f}.png`
const setLang = (v) => { if (!I18N[v] || v === lang) return; lang = v; store.set(LANG_KEY, v); applyLang(); loadCollectibles() }
const toggleTheme = () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set(THEME_KEY, theme); swap(applyTheme) }
$('#lang-btn').addEventListener('click', (e) => showMenu(e.currentTarget, LANGS.map((l) => `<button role="menuitem" tabindex="-1" data-v="${l.code}"><img src="${flag(l.flag)}" alt="" width="20" height="15">${esc(l.name)}${l.code === lang ? `<span class="check">${I.check}</span>` : ''}</button>`).join(''), setLang))
$('#more-btn').addEventListener('click', (e) => showMenu(e.currentTarget, `
  <button role="menuitem" tabindex="-1" data-v="user">${I.copy}${esc(ui().copyUser)}</button>
  <button role="menuitem" tabindex="-1" data-v="id">${I.copy}${esc(ui().copyId)}</button><hr>
  <button role="menuitem" tabindex="-1" data-v="open">${I.chat}${esc(ui().openDiscord)}</button>`, (v) => {
  if (v === 'user') copy(username())
  else if (v === 'id') copy(ID)
  else window.open(`https://discord.com/users/${ID}`, '_blank', 'noopener')
}))
$('#copy-btn').addEventListener('click', () => copy(username()))
$('#theme-btn').addEventListener('click', toggleTheme)

// ─── la ricerca rapida (Ctrl K), come quella di Discord ──────────────────────
let qs = null
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
function searchItems() {
  const u = ui()
  return [
    ...TABS.map((k) => ({ group: u.pages, label: u.tabs[k], ico: I.search, run: () => showTab(k) })),
    { group: u.pages, label: u.mainTitle, sub: CONFIG.mainSite.label, ico: I.globe, run: () => window.open(CONFIG.mainSite.url, '_blank', 'noopener') },
    ...PROJECTS.map((p) => ({ group: u.tabs.projects, label: p.title, sub: u.kind[p.kind], words: `${p.tags.map((x) => x[0]).join(' ')} ${t().projects[p.key].card}`, ico: MEDIA[p.key] ? `<img src="${esc(MEDIA[p.key].cover)}" alt="">` : I[p.kind], run: () => { showTab('projects'); openProject(p.key) } })),
    ...SOCIALS.map((s) => ({ group: u.tabs.social, label: s.name, sub: s.handle, ico: brand(s.icon, s), run: () => window.open(s.url, '_blank', 'noopener') })),
    { group: u.actions, label: theme === 'dark' ? u.theme.light : u.theme.dark, ico: theme === 'dark' ? I.sun : I.moon, run: toggleTheme },
    { group: u.actions, label: u.copyUser, sub: username(), ico: I.copy, run: () => copy(username()) },
    ...LANGS.filter((l) => l.code !== lang).map((l) => ({ group: u.language, label: l.name, sub: l.code.toUpperCase(), ico: `<img src="${flag(l.flag)}" alt="">`, run: () => setLang(l.code) })),
  ]
}
function openSearch() {
  if (qs) return
  closeMenus()
  const u = ui(), items = searchItems()
  const root = document.createElement('div')
  root.className = 'qs'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-label', u.search)
  root.innerHTML = `<div class="qs__bg" data-close></div><div class="qs__panel">
    <p class="qs__hint">${esc(u.searchHint)}</p>
    <input class="qs__input" type="text" role="combobox" aria-expanded="true" aria-controls="qs-list" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(u.searchPh)}" aria-label="${esc(u.search)}">
    <ul class="qs__list" id="qs-list" role="listbox"></ul>
    <div class="qs__foot"><span><kbd>↑</kbd> <kbd>↓</kbd> ${esc(u.kNav)}</span><span><kbd>↵</kbd> ${esc(u.kOpen)}</span><span><kbd>esc</kbd> ${esc(u.kClose)}</span></div></div>`
  const input = $('input', root), list = $('ul', root)
  let found = [], sel = 0
  const draw = () => {
    const q = norm(input.value.trim())
    found = items.filter((it) => !q || norm(`${it.label} ${it.sub || ''} ${it.words || ''} ${it.group}`).includes(q))
    if (!q) found = found.filter((it) => it.group !== u.language && it.group !== u.tabs.social)
    // prima chi ha la parola nel nome, poi gli altri (i gruppi restano uniti)
    else {
      const rank = (it) => { const l = norm(it.label); return l.startsWith(q) ? 0 : l.includes(q) ? 1 : 2 }
      const groups = [...new Set(found.map((it) => it.group))].sort((g1, g2) => Math.min(...found.filter((it) => it.group === g1).map(rank)) - Math.min(...found.filter((it) => it.group === g2).map(rank)))
      found = groups.flatMap((g) => found.filter((it) => it.group === g).sort((x, y) => rank(x) - rank(y)))
    }
    sel = Math.min(sel, Math.max(0, found.length - 1))
    let group = ''
    list.innerHTML = found.length ? found.map((it, i) => `${it.group !== group ? `<li class="qs__group" role="presentation">${esc(group = it.group)}</li>` : ''}<li role="presentation"><button type="button" class="qs__item" role="option" id="qs-${i}" data-i="${i}" aria-selected="${i === sel}" tabindex="-1"><span class="ico">${it.ico || ''}</span><span>${esc(it.label)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}</button></li>`).join('') : `<li class="qs__empty">${esc(u.noResults)}</li>`
    input.setAttribute('aria-activedescendant', found.length ? `qs-${sel}` : '')
  }
  const mark = (i) => { sel = (i + found.length) % Math.max(1, found.length); for (const b of $$('.qs__item', list)) b.setAttribute('aria-selected', +b.dataset.i === sel); $(`#qs-${sel}`, list)?.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', `qs-${sel}`) }
  const run = (i) => { const it = found[i]; if (!it) return; closeSearch(); it.run() }
  input.addEventListener('input', () => { sel = 0; draw() })
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSearch() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); mark(sel + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(sel - 1) }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel) }
    else if (e.key === 'Tab') e.preventDefault()
  })
  root.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) return closeSearch(); const b = e.target.closest('.qs__item'); if (b) run(+b.dataset.i) })
  list.addEventListener('pointermove', (e) => { const b = e.target.closest('.qs__item'); if (b && +b.dataset.i !== sel) mark(+b.dataset.i) })
  document.body.appendChild(root)
  qs = { root, last: document.activeElement }
  draw()
  requestAnimationFrame(() => root.classList.add('is-on'))
  input.focus({ preventScroll: true })
}
function closeSearch() {
  if (!qs) return
  const { root, last } = qs
  qs = null
  root.classList.remove('is-on')
  setTimeout(() => root.remove(), 170)
  last?.focus?.({ preventScroll: true })
}
$('#search-btn').addEventListener('click', openSearch)
addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); qs ? closeSearch() : openSearch() }
  else if (e.key === '/' && !typing && !modal && !qs && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openSearch() }
})

// ─── lingua ──────────────────────────────────────────────────────────────────
function applyLang() {
  const u = ui(), l = LANGS.find((x) => x.code === lang) || LANGS[0]
  document.documentElement.lang = lang
  $('#lang-flag').src = flag(l.flag)
  $('#lang-code').textContent = l.code.toUpperCase()
  $('#lang-btn').setAttribute('aria-label', u.language); $('#lang-btn').title = u.language
  $('#search-btn').setAttribute('aria-label', u.search); $('#search-btn').title = `${u.search} (Ctrl K)`
  $('#skip').textContent = u.skip
  $('#msg-label').textContent = u.message
  $('#copy-btn').innerHTML = I.copy; $('#copy-btn').setAttribute('aria-label', u.copyUser); $('#copy-btn').title = u.copyUser
  $('#more-btn').innerHTML = I.dots; $('#more-btn').setAttribute('aria-label', u.more); $('#more-btn').title = u.more
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
  if (modal) { const k = modal.key; closeProject({ instant: true, pop: false }); openProject(k, { push: false }) }
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

// ─── il profilo pubblico (banner, tema, bio, badge, collegamenti, collezione) ─
async function loadProfile() {
  try {
    const r = await fetch(`${CONFIG.profileApi}${ID}`, { cache: 'no-store' })
    if (!r.ok) return
    const d = await r.json()
    const u = d.user || {}, up = d.user_profile || {}
    if (Array.isArray(up.theme_colors) && up.theme_colors.length === 2) profile.theme = up.theme_colors.map((c) => '#' + Number(c).toString(16).padStart(6, '0'))
    if ('banner' in u) profile.banner = u.banner
    if (/^#[0-9a-f]{6}$/i.test(u.banner_color || '')) profile.bannerColor = u.banner_color
    if (typeof up.bio === 'string') profile.bio = up.bio
    if (u.display_name_styles) profile.nameStyle = u.display_name_styles
    if (Array.isArray(d.badges)) profile.badges = d.badges.map((b) => ({ id: b.id, icon: b.icon, description: b.description, link: b.link }))
    if (Array.isArray(d.connected_accounts)) profile.connections = d.connected_accounts.map((c) => ({ type: c.type, name: c.name, id: c.id, verified: !!c.verified }))
    // gli oggetti da collezione: l'effetto, la cornice (tipo 3) e la decorazione
    const sku = (v) => (/^\d+$/.test(String(v ?? '')) ? String(v) : null)
    if ('profile_effect' in up) profile.effectSku = sku(up.profile_effect?.sku_id)
    if (Array.isArray(up.collectibles)) profile.frameSku = sku(up.collectibles.find((c) => c.type === 3)?.sku_id)
    if ('avatar_decoration_data' in u) profile.decorationSku = sku(u.avatar_decoration_data?.sku_id)
    applyTheme()
    renderCard()
    if (activeTab === 'social') renderSocial()
    await loadCollectibles()
  } catch {}
}
async function loadCollectibles() {
  await Promise.all([profile.effectSku, profile.frameSku, profile.decorationSku].filter(Boolean).map(loadCollectible))
  mountFx()
  if (activeTab === 'activity') renderActivity()
}
// Discord dà nome (nella lingua della pagina), immagini e misure di ogni oggetto; in memoria per un giorno
const DISCORD_LOCALE = { it: 'it', en: 'en-US', es: 'es-ES', fr: 'fr', de: 'de', pt: 'pt-BR', ru: 'ru', ja: 'ja', zh: 'zh-CN' }
async function loadCollectible(sku) {
  const key = `pzkko-col-${sku}-${lang}`
  try {
    const c = JSON.parse(store.get(key) || 'null')
    if (c && Date.now() - c.at < 864e5) { collectibles[sku] = c.v; return }
  } catch {}
  try {
    const r = await fetch(`${CONFIG.collectiblesApi}${sku}`, { headers: { 'X-Discord-Locale': DISCORD_LOCALE[lang] || 'en-US' } })
    if (!r.ok) return
    const d = await r.json(), it = d.items?.[0] || {}
    let v = null
    if (d.type === 1 && Array.isArray(it.effects)) v = { name: d.name, type: 1, thumb: it.thumbnailPreviewSrc, still: it.reducedMotionSrc, width: it.effects[0]?.width, height: it.effects[0]?.height, layers: it.effects.map((e) => ({ src: e.src, loop: !!e.loop, duration: +e.duration || 0, start: +e.start || 0, loopDelay: +e.loopDelay || 0 })) }
    else if (d.type === 3 && Array.isArray(it.layers)) v = { name: d.name, type: 3, inner: +it.inner_width || 0, top: +it.overflow_top || 0, bottom: +it.overflow_bottom || 0, side: +it.overflow_horizontal || 0, layers: it.layers.filter((l) => l.type === 'staple' && l.anchor === 'top').map((l) => ({ id: String(l.id), order: l.order })) }
    else if (d.type === 0) v = { name: d.name, type: 0 }
    if (!v) return
    collectibles[sku] = v
    store.set(key, JSON.stringify({ at: Date.now(), v }))
  } catch {}
}
let effect = null, fxKey = ''
function mountFx() {
  const card = $('#card')
  const frame = profile.frameSku ? collectibles[profile.frameSku] : null
  mountFrame(card, profile.frameSku, frame?.type === 3 ? frame : null)
  const eff = profile.effectSku ? collectibles[profile.effectSku] : null
  const key = `${profile.effectSku}|${eff?.layers?.length || 0}`
  if (key !== fxKey) {
    fxKey = key
    effect?.stop()
    // l'entrata (2 MB) solo sul computer; sul telefono resta il giro
    const start = () => { effect = mountEffect($('#fx'), eff?.type === 1 ? eff : null, { intro: wide.matches, heavy }) }
    if (document.readyState === 'complete') start(); else addEventListener('load', () => setTimeout(start, 300), { once: true })
  }
  placeCard()
}
$('#avatar-box').addEventListener('click', () => effect?.replay())

// ─── la scheda resta in vista mentre il pannello scorre ──────────────────────
function placeCard() {
  const card = $('#card'), shell = $('.shell')
  const top = parseFloat(getComputedStyle(shell).marginTop) || 0
  const h = card.offsetHeight
  card.style.setProperty('--card-top', `${Math.round(h + top + 20 > innerHeight ? Math.min(top, innerHeight - h - 20) : top)}px`)
}
let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    const bar = $('#bar'), panel = $('#panel')
    bar.classList.toggle('is-stuck', panel.getBoundingClientRect().top < -1)
  })
}
addEventListener('scroll', onScroll, { passive: true })
addEventListener('resize', () => { placeCard(); moveInk(); fitBio() })
new ResizeObserver(placeCard).observe($('#card'))
document.fonts?.ready.then(() => { moveInk(); fitBio() })

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
$('#avatar').addEventListener('error', (e) => { if (!e.currentTarget.src.endsWith('/me.png')) { shown.avatar = '/me.png'; e.currentTarget.src = '/me.png' } })
$('#banner').addEventListener('error', (e) => { e.currentTarget.hidden = true })
$('#deco').addEventListener('error', (e) => { e.currentTarget.hidden = true })
const first = parseHash()
if (first.tab) activeTab = first.tab
for (const p of $$('.tabpanel')) p.hidden = p.id !== `panel-${activeTab}`
applyLang()
mountParallax($('#card'))
mountFx()
connectLanyard()
loadProfile()
setInterval(loadProfile, 10 * 60 * 1000)
if (first.proj) openProject(first.proj, { push: false })
if (CONFIG.goatcounter) goatcounter(CONFIG.goatcounter)

// Per le prove: import('/assets/app.js').then((m) => m.onPresence({...}))
export { onPresence }
