// pzkko.it: il profilo di Discord, dal vivo. Lanyard dà avatar, decorazione, stato,
// giochi, stato personalizzato e stile del nome; il profilo pubblico (dstn) dà
// banner, tema, bio, badge, collegamenti e gli oggetti da collezione; Discord dà la
// cornice e l'effetto veri. La musica (il suo Spotify, non quello di Lanyard), le app
// aperte sul pc e dove è arrivano dalla vetrina (vetrina.js). Niente librerie.

import { CONFIG, COLLECTIBLES, NAME_FONTS, SOCIALS, PERSONAL_SOCIALS, PROJECTS, TOOLS, LANGS } from './config.js'
import { I18N, LINGUE, caricaLingua } from './i18n.js'
import { ICONS } from './icons.js'
import { MEDIA } from './media.js'
import { mountFrame, mountParallax, mountEffect } from './fx.js'
import { ascolta as ascoltaVetrina, vetrina, immagine } from './vetrina.js'
import * as chiSono from './chisono.js'
import { creaAdesso } from './adesso.js'
import { creaArte } from './adesso-arte.js'
import { creaScheda } from './scheda-attivita.js'
import { provare } from './provare.js'

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
  if (saved && LINGUE.includes(saved)) return saved
  for (const l of navigator.languages || [navigator.language]) { const c = String(l).slice(0, 2).toLowerCase(); if (LINGUE.includes(c)) return c }
  return 'en'
}
let lang = detectLang()
// le lingue oltre a italiano e inglese arrivano solo adesso, e solo quella scelta
if (!I18N[lang]) await caricaLingua(lang).catch(() => {})
if (!I18N[lang]) lang = 'en'
// (26.11) chiaro di giorno e scuro di notte, al sole di Mantova: lo decide assets/tema.js, nell'<head>
let theme = window.pzkkoTema?.adesso() || (store.get(THEME_KEY) === 'dark' ? 'dark' : 'light')
const profile = structuredClone(CONFIG.profile)
// (26.11) le voci che config.js tiene ferme: non le cambia né Lanyard né il profilo pubblico
const fisso = (k) => Array.isArray(profile.fisso) && profile.fisso.includes(k)
const collectibles = structuredClone(COLLECTIBLES)
let presence = null, presenceAt = 0
const liveListeners = new Set() // lo Studio e chi altro vuole la presenza senza aprire un altro socket
const t = () => I18N[lang]
const ui = () => t().ui
// le dieci app del laboratorio (26.11) hanno i testi in italiano e in inglese; le altre sette lingue vedono l'inglese
// invece di un buco nella scheda. I testi veri stanno in assets/i18n/it.js e en.js, sotto `projects`.
const VUOTO_PROGETTO = { card: '', full: '', role: '', features: [] }
const projText = (key) => t().projects?.[key] || I18N.en.projects?.[key] || VUOTO_PROGETTO
const locale = () => (LANGS.find((l) => l.code === lang) || LANGS[0]).locale
const cap = (s) => (s && (s[lang] || s.en || s.it)) || ''
const username = () => profile.username
// la scheda Community non ha una voce nei nove file i18n: l'etichetta sta qui,
// così il resto della scheda può restare italiano/inglese senza toccare i locale.
const COMMUNITY_LABEL = { it: 'Community', en: 'Community', es: 'Comunidad', fr: 'Communauté', de: 'Community', pt: 'Comunidade', ru: 'Сообщество', ja: 'コミュニティ', zh: '社区' }
const STUDIO_LABEL = { it: 'Studio', en: 'Studio', es: 'Estudio', fr: 'Studio', de: 'Studio', pt: 'Estúdio', ru: 'Студия', ja: 'スタジオ', zh: '工作室' }
const tabLabel = (k) => ui().tabs[k] || (k === 'community' ? COMMUNITY_LABEL[lang] || 'Community' : k === 'studio' ? STUDIO_LABEL[lang] || 'Studio' : k)

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
  el.innerHTML = `<b aria-hidden="true">✓</b><span>${esc(msg)}</span>` // (25.11) un pezzo di nastro scritto a pennarello
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
  // il banner fermo è un file del sito
  if (fisso('banner') && profile.bannerSrc) {
    banner.hidden = false
    if (shown.bannerHash === profile.bannerSrc) return
    shown.bannerHash = profile.bannerSrc
    banner.src = profile.bannerSrc
    amb.onload = () => amb.classList.add('is-on')
    amb.src = profile.bannerSrc.replace(/\.webp$/, '-300.webp')
    return
  }
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
  const mio = fisso('avatar') && profile.avatarSrc // la foto ferma è un file del sito
  const url = mio || (ok ? `${CDN}/avatars/${ID}/${av}.webp?size=256${av.startsWith('a_') && heavy ? '&animated=true' : ''}` : '/me.png')
  setImg($('#avatar'), 'avatar', url)
  if (mio) setFavicon(mio.replace(/\.webp$/, '-64.png'))
  else if (u && ok) setFavicon(`${CDN}/avatars/${ID}/${av}.png?size=64`)
  const deco = u && !fisso('decoration') ? u.avatar_decoration_data?.asset : profile.decoration
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
  el.textContent = profile.displayName
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
  return `<li>${m.url ? `<a class="conn" href="${esc(encodeURI(m.url))}" target="_blank" rel="noopener noreferrer me">${inner}</a>` : `<span class="conn">${inner}</span>`}</li>`
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
  $('#uname').textContent = p.username
  // i pronomi: solo quelli scritti in config.js
  const pr = $('#pron')
  if (pr) { pr.textContent = p.pronouns || ''; pr.hidden = !p.pronouns }
  const g = u?.primary_guild?.identity_enabled ? { tag: u.primary_guild.tag, id: u.primary_guild.identity_guild_id, badge: u.primary_guild.badge } : (u ? null : p.guild)
  const gt = $('#gtag')
  if (g?.tag) { gt.innerHTML = `${g.badge && /^[a-z0-9_]+$/i.test(g.badge) && /^\d+$/.test(g.id) ? `<img src="${CDN}/clan-badges/${g.id}/${g.badge}.png?size=32" alt="">` : ''}${esc(g.tag)}`; gt.hidden = false } else gt.hidden = true
  $('#badges').innerHTML = p.badges.filter((b) => /^[a-z0-9_]+$/i.test(b.icon || '')).map((b) => {
    const img = `<img src="${CDN}/badge-icons/${b.icon}.png" alt="${esc(b.description)}" width="22" height="22" draggable="false">`
    return b.link && /^https:\/\//.test(b.link) ? `<a href="${esc(b.link)}" target="_blank" rel="noopener noreferrer" title="${esc(b.description)}">${img}</a>` : `<span title="${esc(b.description)}">${img}</span>`
  }).join('')
  $('#badges').hidden = !p.badges.length
  // sezioni
  $('#bio').textContent = p.bio || ''
  $('#bio-sec').hidden = !p.bio
  $('#since').textContent = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(sinceDate())
  $('#conns').innerHTML = p.connections.map(connRow).join('')
  $('#social-icons').innerHTML = [...SOCIALS, ...PERSONAL_SOCIALS].filter((s) => s.key !== 'discord').map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer me" title="${esc(`${s.name} · ${s.handle}`)}" aria-label="${esc(`${s.name} ${s.handle}`)}">${brand(s.icon, s)}</a>`).join('')
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
// (26.11) la musica e i giochi ora vivono in adesso.js: qui sotto restano solo
// le scritte della vetrina (VTX) e gli agganci. Niente innerHTML a ogni cambio.
// le scritte della vetrina: non hanno una voce nei nove file i18n, come la Community
const VTX = {
  it: { app: 'Aperte sul PC', su: 'in primo piano', luogo: { ufficio: 'in ufficio', giro: 'in giro per il mondo' } },
  en: { app: 'Open on my PC', su: 'in the foreground', luogo: { ufficio: 'at the office', giro: 'somewhere in the world' } },
  es: { app: 'Abiertas en el PC', su: 'en primer plano', luogo: { ufficio: 'en la oficina', giro: 'por el mundo' } },
  fr: { app: 'Ouvertes sur le PC', su: 'au premier plan', luogo: { ufficio: 'au bureau', giro: 'quelque part dans le monde' } },
  de: { app: 'Offen am PC', su: 'im Vordergrund', luogo: { ufficio: 'im Büro', giro: 'irgendwo auf der Welt' } },
  pt: { app: 'Abertas no PC', su: 'em primeiro plano', luogo: { ufficio: 'no escritório', giro: 'pelo mundo fora' } },
  ru: { app: 'Открыто на ПК', su: 'на переднем плане', luogo: { ufficio: 'в офисе', giro: 'где-то в мире' } },
  ja: { app: 'PCで開いているアプリ', su: '最前面', luogo: { ufficio: 'オフィスにいます', giro: '世界のどこか' } },
  zh: { app: '电脑上打开的应用', su: '在最前面', luogo: { ufficio: '在办公室', giro: '在世界某处' } },
}
const vtx = () => VTX[lang] || VTX.en
const I_LUOGO = {
  ufficio: svg('<path d="M12 21.500s-7-6.300-7-11.800a7 7 0 0 1 14 0c0 5.500-7 11.800-7 11.800z"/><circle cx="12" cy="9.700" r="2.600"/>', { s: 14, w: 2.2 }),
  giro: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.300 15.300 0 0 1 4 10 15.300 15.300 0 0 1-4 10 15.300 15.300 0 0 1-4-10 15.300 15.300 0 0 1 4-10z"/>', { s: 14, w: 2.2 }),
}
// (26.11) il riquadro «ADESSO» e l'attività della scheda vivono in adesso.js:
// nodi a chiave, niente innerHTML a ogni cambio, così le transizioni possono restare.
// (il vestito del riquadro è in adesso-arte.js: il cartoncino, i timbri, gli adesivi. Le sue due scritte, nove lingue)
const VTX_ARTE = {
  it: { voce: 'in diretta dal mio pc', spento: 'pc spento' },
  en: { voce: 'live from my pc', spento: 'pc off' },
  es: { voce: 'en directo desde mi pc', spento: 'pc apagado' },
  fr: { voce: 'en direct de mon pc', spento: 'pc éteint' },
  de: { voce: 'live von meinem PC', spento: 'PC aus' },
  pt: { voce: 'em direto do meu pc', spento: 'pc desligado' },
  ru: { voce: 'прямо с моего ПК', spento: 'ПК выключен' },
  ja: { voce: 'PCからライブ中', spento: 'PCオフ' },
  zh: { voce: '我的电脑实况', spento: '电脑已关机' },
}
const adesso = creaAdesso({
  arte: creaArte({ testi: () => VTX_ARTE[lang] || VTX_ARTE.en, locale: () => locale(), reduced }),
  testi: () => ({
    now: ui().now, live: ui().live, nothing: ui().nothing,
    by: ui().by, on: ui().on, elapsed: ui().elapsed,
    listening: ui().listening, act: ui().act,
    activeOn: ui().activeOn, devices: ui().devices, status: t().status,
    app: vtx().app, su: vtx().su, luogo: vtx().luogo,
  }),
  icone: {
    desktop: I.desktop,
    game: I.game,
    gameBig: I.game.replace('width="14" height="14"', 'width="34" height="34"'),
    spotify: brand('spotify', { light: '169c46' }),
    luogo: I_LUOGO,
    device: { desktop: I.desktop, web: I.web, mobile: I.mobile },
  },
  coloreStato: (st) => STATUS_COLOR[st] ?? STATUS_COLOR.offline,
  immagine,
  asset: assetUrl,
  clock,
  presenza: () => presence,
  vetrina: () => vetrina(),
  reduced,
})
// (26.11) il riquadro attività della scheda profilo ha un modulo suo (scheda-attivita.js): una cosa sola alla volta
// (gioco, app in primo piano, brano, o lo stato), il foglietto col nastro, i cambi secondo l'uso. Si iscrive da sé alla vetrina.
const attivita = creaScheda({
  testi: () => ({ live: ui().live, by: ui().by, on: ui().on, elapsed: ui().elapsed, listening: ui().listening, act: ui().act, status: t().status, su: vtx().su }),
  icone: { desktop: I.desktop, game: I.game, gameBig: I.game.replace('width="14" height="14"', 'width="34" height="34"'), spotify: brand('spotify', { light: '169c46' }) },
  coloreStato: (st) => STATUS_COLOR[st] ?? STATUS_COLOR.offline,
  immagine,
  asset: assetUrl,
  clock,
  lingua: () => lang,
  presenza: () => presence,
  vetrina: () => vetrina(),
  reduced,
})
function renderCardActivity() {
  attivita.card($('#card-activity'))
}

// ─── i progetti: copertine, filmati, ruoli ───────────────────────────────────
const rolesHtml = (list) => `<div class="roles">${list.map(([name, ic]) => `<span class="role">${ICONS[ic] ? brand(ic) : `<i style="--c:${esc(ic || 'var(--muted)')}"></i>`}${esc(name)}</span>`).join('')}</div>`
const archived = (p) => !p.url && !p.code && !p.download && !p.play
function mediaHtml(p, { eager = false, chips = true, video = true } = {}) {
  const m = MEDIA[p.key], n = m?.shots.length || 0
  const [c1, c2, font, pat] = p.art || ['#9d00ff', '#2a0047', 'Pricedown', 'punti']
  const ink = lum(hex2rgb(c1)) > 0.45 ? '#141414' : '#ffffff'
  return `<span class="art" data-pat="${esc(pat)}" style="--c1:${esc(c1)};--c2:${esc(c2)};--ink:${ink};--af:'${esc(font)}';--fs:${Math.min(11.5, 104 / Math.max(...p.title.split(' ').map((w) => w.length))).toFixed(1)}cqw">
      <span class="art__title">${esc(p.title)}</span>
      ${m ? `<span class="art__shot"><img src="${esc(m.cover)}" alt="" width="1280" height="720" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false">${m.video && video ? `<video muted loop playsinline preload="none" disableremoteplayback data-src="${esc(m.video.src)}" aria-hidden="true" tabindex="-1"></video>` : ''}</span>` : ''}
    </span>
    ${chips ? `<span class="chip chip--tl">${I[p.kind] || ''}${esc(ui().kind[p.kind] || '')}</span>${m && (m.video || n) ? `<span class="chip chip--br">${m.video ? `${I.play}${clock(m.video.seconds * 1000)}` : ''}${m.video && n ? ' · ' : ''}${n ? `${I.image}${n}` : ''}</span>` : ''}` : ''}`
}
// i tasti di un progetto: quello che gira dentro il sito (play), poi il sito fuori, lo scaricabile, il codice
function playHtml(p, all = false) {
  if (!p.play) return ''
  const u = ui(), verb = p.kind === 'game' ? u.play : u.open
  const one = ([label, href], i) => `<button type="button" class="btn ${i === 0 ? 'btn--msg' : 'btn--ghost'}" data-app="${esc(href)}" data-app-title="${esc(label)}">${i === 0 || !all ? I.play.replace('width="12" height="12"', 'width="14" height="14"') : ''}${esc(all && p.play.length > 1 ? label : verb)}</button>`
  return (all ? p.play : p.play.slice(0, 1)).map(one).join('')
}
function linksHtml(p, primary = false) {
  const u = ui()
  return `${p.url ? `<a class="btn ${primary && !p.play ? 'btn--msg' : 'btn--ghost'}" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(u.open)} ${I.ext}</a>` : ''}${p.download ? `<a class="btn ${primary && !p.url && !p.play ? 'btn--msg' : 'btn--ghost'}" href="${esc(p.download)}" rel="noopener noreferrer">${I.down}${esc(u.download)}</a>` : ''}${p.code ? `<a class="btn btn--ghost" href="${esc(p.code)}" target="_blank" rel="noopener noreferrer">${brand('github', { dark: 'ffffff' }).replace('<svg ', '<svg width="16" height="16" ')}${esc(u.code)}</a>` : ''}`
}
// ─── le app di casa, in vetrina (25.11, pzkko: «invoglia la gente a usare le mie app, fai il sito più sponsorizzato
// internamente»). Il browser si ricorda quali app hai aperto (pzkko-provate, solo qui, niente server): gli annunci propongono
// prima quelle nuove che non hai mai provato, poi le altre mai provate, poi il resto, in un giro che cambia ogni giorno.
// Le stesse proposte stanno nella bacheca («da provare», con la tessera da riempire), nel volantino che esce quando chiudi
// un'app o dopo un po' che giri, nella scheda del progetto («prova anche») e nella ricerca («gioca subito») ──
const SPOT = {
  it: { titolo: 'da provare', voce: 'girano tutte qui dentro, senza scaricare niente', tessera: (a, b) => `la tua tessera: ${a} su ${b}`, piena: 'tessera piena: le hai provate tutte!', provata: 'provata', nuovo: 'nuovo', dopo: 'ti è piaciuto? prova anche', mai: 'non l’hai ancora provato', giorno: 'l’app del giorno', cose: 'cos’è', altre: 'prova anche', subito: 'Gioca subito', chiudi: 'Chiudi', annuncio: 'Annuncio', indietro: 'indietro', avanti: 'avanti', appNova: 'nuova app', cambia: 'cambia app (frecce o trascina)', notaMai: 'mai aperta', notaPreferita: 'la tua preferita', notaOggi: 'l’ultima volta oggi', notaIeri: 'l’ultima volta ieri', notaUna: 'provata una volta', notaVolte: (n) => `provata ${n} volte` },
  en: { titolo: 'try these', voce: 'they all run right here, nothing to download', tessera: (a, b) => `your card: ${a} of ${b}`, piena: 'card full: you tried them all!', provata: 'tried', nuovo: 'new', dopo: 'liked it? try this next', mai: 'you haven’t tried this yet', giorno: 'app of the day', cose: 'what is it', altre: 'try also', subito: 'Play now', chiudi: 'Close', annuncio: 'Ad', indietro: 'back', avanti: 'next', appNova: 'new app', cambia: 'switch app (arrows or swipe)', notaMai: 'never opened', notaPreferita: 'your favourite', notaOggi: 'last time today', notaIeri: 'last time yesterday', notaUna: 'tried once', notaVolte: (n) => `tried ${n} times` },
}
const spot = () => SPOT[lang] || SPOT.en
const PROVATE_KEY = 'pzkko-provate'
// le app che girano qui (Diretta OS è un programma da installare: la sua guida non si propone come un gioco)
const APPS = PROJECTS.filter((p) => p.play?.length && p.key !== 'direttaos')
const provate = () => { try { const v = JSON.parse(store.get(PROVATE_KEY) || '[]'); return new Set(Array.isArray(v) ? v : []) } catch { return new Set() } }
const provata = (p, s = provate()) => (p.play || []).some(([, h]) => s.has(h))
const isNew = (p) => !!p.nuovo && Date.now() - Date.parse(p.nuovo) < 21 * 864e5
const appDi = (target) => APPS.filter((p) => p.play.some(([, h]) => h === target)).map((p) => p.key)
// i numeri dell'uso per app, sommati sui target (le stesse chiavi che legge provare.js per riordinare la pila)
const APP_STATS_KEY = 'pzkko-app-stats'
function statApp(p) {
  let st = {}
  try { st = JSON.parse(store.get(APP_STATS_KEY) || '{}') || {} } catch {}
  let n = 0, at = 0, ms = 0
  for (const [, h] of p.play || []) { const e = st[h]; if (e) { n += e.n || 0; at = Math.max(at, e.at || 0); ms += e.ms || 0 } }
  return { n, at, ms }
}
// la riga scritta a mano sui volantini, che cambia con l'uso (testi e soglie di DeepSeek)
function notaUso(n, giorni) {
  const u = spot()
  if (n === 0) return u.notaMai
  if (n >= 5) return u.notaPreferita
  if (giorni === 0) return u.notaOggi
  if (giorni === 1) return u.notaIeri
  if (n === 1) return u.notaUna
  return u.notaVolte(n)
}
/** Ricorda che quell'app (`qui:parole`, `/serranda/`…) è stata aperta, e registra i numeri
 *  dell'uso (quante volte, quando, quanto dura) in provare.js. */
function segna(target) {
  provare.aperta(target)
  const s = provate()
  if (s.has(target)) return
  s.add(target)
  store.set(PROVATE_KEY, JSON.stringify([...s].slice(-80)))
  // niente reagisci qui: la tessera si timbra alla chiusura, quando si torna in bacheca
  // (all'apertura il dialog copre tutto e il «pop» del buco non lo vedrebbe nessuno)
}
const seme = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
/** Le prossime `n` app da proporre (tranne quelle in `tranne`). */
function daProvare(n = 4, tranne = []) {
  const s = provate(), giorno = Math.floor(Date.now() / 864e5)
  const peso = (p) => (provata(p, s) ? 3 : isNew(p) ? 0 : 1) * 2 ** 32 + seme(`${p.key}${giorno}`)
  return APPS.filter((p) => !tranne.includes(p.key)).sort((a, b) => peso(a) - peso(b)).slice(0, n)
}
const verbo = (p) => (p.kind === 'game' ? ui().play : ui().open)
/** Apre una cosa del sito: «qui:…» sopra il profilo, un indirizzo nella finestra. */
function lancia(target, titolo = '') { if (target.startsWith('qui:')) return openHere(target.slice(4)); openApp(target, titolo) }
// (26.11) un'app provata ha il timbro verde anche se è nuova: è lo stesso conto di data-uso sul volantino
const stampHtml = (p, s) => (provata(p, s) ? `<span class="timbro timbro--fatto">${esc(spot().provata)} ✓</span>` : isNew(p) ? `<span class="timbro timbro--nuovo">${esc(spot().nuovo)}</span>` : '')
/** Un volantino di carta per un'app: la cattura, il nome, una riga, il tasto. */
function flyerHtml(p, i = 0, { s = provate(), cls = '' } = {}) {
  const [label, href] = p.play[0]
  const { n, at } = statApp(p)
  const prov = provata(p, s)
  const uso = isNew(p) && !prov ? 'nuova' : prov ? 'provata' : 'mai'
  const giorni = at ? Math.floor((Date.now() - at) / 864e5) : 999
  const nota = notaUso(n, giorni)
  return `<article class="fly ${cls}" data-app="${p.key}" data-genere="${p.kind}" data-uso="${uso}" data-volte="${n}" style="--r:${[-1.6, 1.2, -.6, 1.8, -1.1][i % 5]}deg">
      <i class="pz-nastro" aria-hidden="true"></i>
      <button type="button" class="fly__foto media" data-open="${p.key}" aria-label="${esc(`${spot().cose}: ${p.title}`)}">${mediaHtml(p, { chips: false, video: false })}</button>
      ${stampHtml(p, s)}
      <h3 class="fly__t">${esc(p.title)}</h3>
      ${nota ? `<p class="fly__nota">${esc(nota)}</p>` : ''}
      <p class="fly__d">${esc(projText(p.key).card)}</p>
      <div class="fly__tasti"><button type="button" class="pz-tasto" data-app="${esc(href)}" data-app-title="${esc(label)}">${esc(verbo(p))}</button><button type="button" class="pz-link" data-open="${p.key}">${esc(spot().cose)}</button></div>
    </article>`
}
/** La tessera: un tondo per ogni app, timbrato quando l'hai provata. */
function tesseraHtml(s = provate()) {
  const n = APPS.filter((p) => provata(p, s)).length
  return `<div class="tessera" role="img" aria-label="${esc(spot().tessera(n, APPS.length))}" data-stato="${n === APPS.length ? 'piena' : 'incompleta'}" data-pieni="${n}" data-totale="${APPS.length}">
      <span class="tessera__t">${esc(n === APPS.length ? spot().piena : spot().tessera(n, APPS.length))}</span>
      <span class="tessera__buchi">${APPS.map((p) => `<i class="${provata(p, s) ? 'on' : ''}" data-app="${p.key}" title="${esc(p.title)}"></i>`).join('')}</span>
    </div>`
}
// la zona «da provare» ora vive in provare.js: la bacheca monta il muro con
// provare.monta($('#annunci'), …) dentro renderBoard(), e segna()/openHere()/openApp()
// chiamano provare.aperta()/provare.chiusa() per far reagire il muro all'uso.

// il volantino: esce quando chiudi un'app (un'altra da provare) e una volta per visita dopo un po' che giri. Non copre
// niente di aperto, non esce nella chat (sta dove si scrive) e dopo due chiusure con la X per questa visita tace
let vol = null, volZitto = 0, volTimer = 0
const VOL_GIORNO = 'pzkko-vol-giorno'
const occupato = () => !!(document.querySelector('dialog[open]') || modal || qs || appWin || openMenu)
function volantino(motivo = 'giorno', tranne = []) {
  if (volZitto >= 2 || activeTab === 'chat' || occupato()) return false
  const s = provate()
  // il volantino può usare la scelta di provare.js (genere + recenza); se non c'è, il giro di sempre
  const p = provare.scegli(tranne) || daProvare(1, tranne)[0]
  if (!p) return false
  togliVolantino(true)
  const k = motivo === 'dopo' ? spot().dopo : provata(p, s) ? spot().giorno : spot().mai
  const el = document.createElement('aside')
  el.className = 'vol'
  el.setAttribute('aria-label', `${spot().annuncio}: ${p.title}`)
  el.innerHTML = `<button type="button" class="pz-x vol__x" data-x aria-label="${esc(spot().chiudi)}"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button>
    <p class="vol__voce">${esc(k)}</p>
    ${flyerHtml(p, 0, { s, cls: 'fly--vol' })}`
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-x]')) { volZitto++; togliVolantino(); return }
    if (e.target.closest('[data-app],[data-open]')) togliVolantino()
  })
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { volZitto++; togliVolantino() } })
  document.body.appendChild(el)
  vol = el
  requestAnimationFrame(() => el.classList.add('is-on'))
  return true
}
function togliVolantino(subito = false) {
  const el = vol
  vol = null
  if (!el) return
  if (subito) return el.remove()
  el.classList.remove('is-on')
  setTimeout(() => el.remove(), 260)
}
// l'app del giorno: dopo 40 secondi di giro, una volta per visita, quando niente è aperto (se c'è qualcosa, riprova)
function volantinoDelGiorno() {
  try { if (sessionStorage.getItem(VOL_GIORNO)) return } catch {}
  if (navigator.webdriver && !new URLSearchParams(location.search).has('volantino')) return
  let tentativi = 0
  const prova = () => {
    if (document.hidden || !volantino('giorno')) { if (++tentativi < 12) volTimer = setTimeout(prova, 15000); return }
    try { sessionStorage.setItem(VOL_GIORNO, '1') } catch {}
  }
  volTimer = setTimeout(prova, new URLSearchParams(location.search).has('volantino') ? 1500 : 40000)
}
/** Dopo che si apre un'app (un <dialog> nuovo), quando la chiudi: registra la chiusura, il muro
 *  reagisce e poi esce il volantino con un'altra. */
function dopoChiusura(prima, tranne, target) {
  requestAnimationFrame(() => {
    const d = $$('dialog[open]').find((x) => !prima.includes(x))
    d?.addEventListener('close', () => {
      provare.chiusa(target)
      provare.reagisci(target, 'chiusa')
      setTimeout(() => { if (!occupato()) volantino('dopo', tranne) }, 600)
    }, { once: true })
  })
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
const TABS = ['board', 'community', 'projects', 'chat', 'activity', 'social', 'studio']
const SLUG = { board: 'bacheca', community: 'community', projects: 'progetti', chat: 'chat', activity: 'attivita', social: 'social', studio: 'studio' }
// il banner in bacheca: Giugnoh's Cast e i due server, con il tema del profilo
const COMMUNITY_COPY = {
  it: {
    kicker: "Giugnoh's Cast · community",
    title1: 'Il podcast e le clip,',
    title2: 'in due server.',
    text: 'OLLARE e SOLLARY: i numeri pubblici della community, senza bot e senza nomi. Il podcast e le clip li registro io, in tutti e due.',
    cta: 'Apri la community',
    noNames: 'membri tracciati',
  },
  en: {
    kicker: "Giugnoh's Cast · community",
    title1: 'The podcast and the clips,',
    title2: 'across two servers.',
    text: 'OLLARE and SOLLARY: the community’s public numbers, no bots and no names. I record the podcast and the clips in both.',
    cta: 'Open the community',
    noNames: 'members tracked',
  },
}
const communityCopy = () => COMMUNITY_COPY[lang] || COMMUNITY_COPY.en
let activeTab = 'board', filter = 'all', toolFilter = null
function renderTabs() {
  $('#tabs').innerHTML = TABS.map((k) => `<button class="tab" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${k === activeTab}" tabindex="${k === activeTab ? 0 : -1}" data-tab="${k}">${esc(tabLabel(k))}${k === 'projects' ? `<span class="tab__n">${PROJECTS.length}</span>` : ''}</button>`).join('') + '<span class="tabs__ink" aria-hidden="true"></span>'
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
    if (k === 'chat') togliVolantino(true)
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
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { toolFilter = null; showTab(b.dataset.tab) } })
$('#tabs').addEventListener('keydown', (e) => {
  const i = TABS.indexOf(activeTab)
  if (e.key === 'ArrowRight') { e.preventDefault(); showTab(TABS[(i + 1) % TABS.length], { focus: true }) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); showTab(TABS[(i - 1 + TABS.length) % TABS.length], { focus: true }) }
  if (e.key === 'Home') { e.preventDefault(); showTab(TABS[0], { focus: true }) }
  if (e.key === 'End') { e.preventDefault(); showTab(TABS.at(-1), { focus: true }) }
})

function renderBoard() {
  const u = ui(), cc = communityCopy()
  const feat = PROJECTS.find((p) => p.featured && MEDIA[p.key]) || PROJECTS.find((p) => MEDIA[p.key]) || PROJECTS[0], tx = projText(feat.key)
  const others = PROJECTS.filter((p) => p !== feat)
  const root = $('#panel-board')
  root.innerHTML = `<div class="grid2">
    <section class="cm-banner cm-banner--home span2 rise" style="--i:0" aria-label="${esc(cc.kicker)}">
      <img class="cm-banner__art" src="/assets/community/hero.svg" alt="" width="1200" height="760" loading="lazy" aria-hidden="true">
      <span class="cm-banner__shade" aria-hidden="true"></span>
      <div class="cm-banner__body">
        <span class="cm-kicker"><i></i>${esc(cc.kicker)}</span>
        <h2>${esc(cc.title1)}<br>${esc(cc.title2)}</h2>
        <p>${esc(cc.text)}</p>
        <div class="cm-banner__actions">
          <a class="btn btn--msg" href="#community" data-goto="community">${esc(cc.cta)} →</a>
          <a class="btn btn--ghost" href="https://discord.gg/ollare" target="_blank" rel="noopener noreferrer">OLLARE ${I.ext}</a>
          <a class="btn btn--ghost" href="https://discord.gg/sollary" target="_blank" rel="noopener noreferrer">SOLLARY ${I.ext}</a>
        </div>
      </div>
      <span class="cm-banner__badge"><b>0</b>${esc(cc.noNames)}</span>
    </section>
    <article class="hero span2 rise">
      ${feat.key === 'zero' ? '<div class="hero__media hero__zero" data-zero-slot></div>' : `<button type="button" class="hero__media media" data-open="${feat.key}" data-auto="1" aria-label="${esc(`${u.details}: ${feat.title}`)}">${mediaHtml(feat, { eager: true })}</button>`}
      <div class="hero__body">
        <div class="widget__h" style="margin:0">${I.star}<span>${esc(u.featured)}</span></div>
        <h2 class="hero__title">${esc(feat.title)}</h2>
        <p>${esc(tx.card)}</p>
        ${rolesHtml(feat.tags)}
        <div class="hero__actions">${playHtml(feat)}<button type="button" class="btn ${feat.play ? 'btn--ghost' : 'btn--msg'}" data-open="${feat.key}">${esc(u.details)}</button>${linksHtml(feat)}</div>
      </div>
    </article>
    <section class="annunci span2 rise" style="--i:1" id="annunci" aria-label="${esc(spot().titolo)}"></section>
    <section class="span2 rise" style="--i:2" id="ig-card" aria-label="Instagram"></section>
    <section class="span2 rise" style="--i:3" id="tt-card" aria-label="TikTok"></section>
    <section class="widget span2 rise lab-teaser" style="--i:3" aria-label="Studio">
      <div class="widget__h"><span>Studio</span><button type="button" class="link" data-goto="studio">${esc(cap({ it: 'Apri lo studio', en: 'Open the studio' }))} →</button></div>
      <p>${esc(cap({ it: 'Dieci cose nuove, tutte vere: la scheda Adesso in Picture-in-Picture, un quadro coi colori della copertina, il diario di bordo, una radio in 8 bit, la cartolina, la costellazione dei progetti, la stanza, il sole, il meteo e una clip da sei secondi.', en: 'Ten new things, all real: the Now card in Picture-in-Picture, a painting made from the cover colours, the ship’s log, an 8-bit radio, the postcard, the project constellation, the room, the sun, the weather and a six-second clip.' }))}</p>
      <div class="lab-teaser__cose"><span>Picture-in-Picture</span><span>Canvas</span><span>Web Audio</span><span>IndexedDB</span><span>SVG</span><span>MediaRecorder</span></div>
    </section>
    <div class="widget rise" style="--i:1" id="now-widget"></div>
    <section class="chi rise" style="--i:2" id="chi-sono" aria-label="${esc(u.aboutTitle)}"></section>
    <div class="widget span2 rise" style="--i:3">
      <div class="widget__h"><span>${esc(u.others)}</span><button type="button" class="link" data-goto="projects">${esc(u.seeAll)} →</button></div>
      <div class="strip">${others.map((p) => `<button type="button" class="mini" data-open="${p.key}"><span class="mini__thumb media">${mediaHtml(p, { chips: false, video: false })}</span><span><b>${esc(p.title)}</b><span class="sub">${esc(u.kind[p.kind] || '')}</span></span></button>`).join('')}</div>
    </div>
    <section class="st span2 rise" style="--i:4" id="tools-card" aria-label="${esc(u.tools)}"></section>
  </div>`
  $('[data-zero-slot]', root)?.append(zeroButton())
  wireMedia(root)
  // la zona «da provare» (comportamento in provare.js): le passiamo i pezzi che le servono
  provare.monta($('#annunci', root), { APPS, provate, provata, isNew, appDi, seme, flyerHtml, tesseraHtml, spot, esc, reduced, canHover, heavy, occupato, attivo: () => activeTab === 'board', I })
  const nw = $('#now-widget', root)
  if (nw) adesso.widget(nw)
  const ig = $('#ig-card', root)
  if (ig) import('./ig.js').then((m) => m.monta(ig, { lang })).catch((e) => console.error(e))
  // «chi sono» vivo (26.11): la scena di quello che sta facendo sul pc; a riposo, la bio di sempre
  const chi = $('#chi-sono', root)
  if (chi) chiSono.monta(chi, { lang, titolo: u.aboutTitle, bio: u.aboutText, stati: t().status, stato: presence?.discord_status })
  const tt = $('#tt-card', root)
  if (tt) import('./tt.js').then((m) => m.monta(tt, { lang })).catch((e) => console.error(e))
  // gli strumenti (26.11): il foglio coi cartellini, e quello che ha in mano adesso (la vetrina del pc)
  const st = $('#tools-card', root)
  if (st) import('./strumenti.js').then((m) => { if (st.isConnected) m.monta(st, { lang, titolo: u.tools, brand, luogo: (l) => vtx().luogo[l] || '', vai: (k) => { toolFilter = k; filter = 'all'; showTab('projects', { focus: true }) } }) })
    .catch((e) => { console.error(e); st.innerHTML = `<div class="widget"><div class="widget__h"><span>${esc(u.tools)}</span></div>${rolesHtml(TOOLS)}</div>` })
}
function projectCard(p, i, s = provate()) {
  const u = ui(), tx = projText(p.key)
  return `<article class="pcard rise" style="--i:${Math.min(i, 8)}">
    <button type="button" class="pcard__cover media" data-open="${p.key}" aria-label="${esc(`${u.details}: ${p.title}`)}">${mediaHtml(p, { eager: i < 2 })}</button>${stampHtml(p, s)}
    <div class="pcard__body">
      <h3 class="pcard__title">${esc(p.title)}${archived(p) ? `<span class="tag">${esc(u.archived)}</span>` : ''}</h3>
      <p class="pcard__desc">${esc(tx.card)}</p>
      ${rolesHtml(p.tags)}
      <div class="pcard__actions">${playHtml(p)}<button type="button" class="btn ${p.play ? 'btn--ghost' : 'btn--msg'}" data-open="${p.key}">${esc(u.details)}</button>${linksHtml(p)}</div>
    </div></article>`
}
function renderProjects() {
  const u = ui(), root = $('#panel-projects')
  const kinds = ['all', ...new Set(PROJECTS.map((p) => p.kind))]
  // (26.11) arrivando da uno strumento della bacheca: solo i progetti che lo usano, finché non si toglie il cartellino
  const tool = toolFilter && TOOLS.find((x) => x[1] === toolFilter)
  const list = PROJECTS.filter((p) => (filter === 'all' || p.kind === filter) && (!tool || p.tags.some((x) => x[1] === tool[1])))
  root.innerHTML = `<div class="filters" role="group" aria-label="${esc(u.tabs.projects)}">${kinds.map((k) => `<button type="button" class="filter" data-filter="${k}" aria-pressed="${k === filter}">${esc(u.filters[k])}<b>${k === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.kind === k).length}</b></button>`).join('')}${tool ? `<button type="button" class="filter filter--tool" data-tool-off aria-pressed="true" aria-label="${esc(`${tool[0]}: ${u.close}`)}">${brand(tool[1])}${esc(tool[0])}<b aria-hidden="true">✕</b></button>` : ''}<span class="filters__note">${I.image}${esc(u.real)}</span></div>
    <div class="grid2" id="pgrid">${list.map((p, i) => projectCard(p, i)).join('')}</div>`
  wireMedia(root)
}
function renderCollection() {
  const u = ui(), rows = []
  const eff = collectibles[profile.effectSku], frame = collectibles[profile.frameSku], deco = collectibles[profile.decorationSku]
  const decoAsset = presence?.discord_user && !fisso('decoration') ? presence.discord_user.avatar_decoration_data?.asset : profile.decoration
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
    <div class="widget span2 rise" id="now-widget-2"></div>
    ${custom && (custom.state || custom.emoji) ? `<div class="widget span2 rise" style="--i:1"><div class="widget__h"><span>${esc(u.customStatus)}</span></div><p class="quote">${emojiHtml(custom.emoji, 48)}${custom.emoji && custom.state ? ' ' : ''}${esc(custom.state ?? '')}</p></div>` : ''}
    ${renderCollection()}
  </div>${ago ? `<p class="fine">${esc(u.updatedAgo)} ${esc(ago)} · Lanyard</p>` : ''}`
  const nw2 = $('#now-widget-2')
  if (nw2) adesso.widget(nw2)
}
function renderSocial() {
  const u = ui()
  const verified = new Set(profile.connections.filter((c) => c.verified).map((c) => `${(CONN[c.type]?.(c).icon) || c.type}:${String(c.name).toLowerCase()}`))
  const row = (s, i) => {
    const ok = s.key === 'discord' || verified.has(`${s.icon}:${s.handle.toLowerCase()}`)
    return `<a class="srow rise" style="--i:${Math.min(i + 1, 10)};--c:#${ICONS[s.icon]?.[0] || '888'}" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer me"><span class="srow__ico">${brand(s.icon, s)}</span><span class="srow__txt"><span class="srow__name">${esc(s.name)}${ok ? `<span class="conn__ok" title="${esc(u.verified)}">${I.ok}<span class="sr">${esc(u.verified)}</span></span>` : ''}</span><span class="srow__handle">${esc(s.handle)}</span></span><span class="srow__go">${I.ext}</span></a>`
  }
  const personale = PERSONAL_SOCIALS.map(row).join('')
  $('#panel-social').innerHTML = `<div class="sgrid sgrid--pzkko">${SOCIALS.map(row).join('')}</div>
    ${personale ? `<p class="sgrid__title">${esc(cap({ it: 'Personale', en: 'Personal' }))}</p><div class="sgrid sgrid--personale">${personale}</div>` : ''}`
}
// la community: il modulo si scarica solo quando si apre #community
let communityMounted = false, communityLang = null
function renderCommunity() {
  if (communityMounted && communityLang === lang) return
  communityMounted = true
  communityLang = lang
  const root = $('#panel-community')
  root.innerHTML = `<div class="cm-tab"><div class="widget"><p class="cm-loading">${esc(cap({ it: 'Carico i numeri…', en: 'Loading the numbers…' }))}</p></div></div>`
  import('./community-tab.js')
    .then((m) => m.monta(root, { lang }))
    .catch((e) => {
      communityMounted = false
      communityLang = null
      console.error(e)
      root.innerHTML = `<div class="widget"><p>${esc(cap({ it: 'Non riesco a caricare la community. Riprova.', en: 'I can’t load the community. Try again.' }))}</p></div>`
    })
}

// la chat col bot pzk: il modulo (e il motore dei comandi) si scarica solo quando si apre la scheda
let chatMounted = false
function renderChat() {
  if (chatMounted) return
  chatMounted = true
  const root = $('#panel-chat')
  root.innerHTML = '<div class="dc dc--attesa"><div class="dc__scrive"><i></i><i></i><i></i></div></div>'
  if (!$('link[data-chat-css]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/chat/chat.css'; l.dataset.chatCss = '1'; document.head.prepend(l) }
  import('./dchat.js').then((m) => m.monta(root, { qui: openHere })).catch((e) => { console.error(e); chatMounted = false; root.innerHTML = `<p class="fine">${esc(ui().nothing)}</p>` })
}
// lo Studio (26.11): dieci motori nuovi, una scheda sola. Il modulo si scarica
// quando si apre e si rimonta al cambio di lingua. Le grafiche sono di Claude
// Code: qui passiamo solo i dati veri e gli agganci. (Non è la Frontiera
// /frontiera/ delle dieci tecnologie del browser: quella è un'altra cosa.)
let studioMounted = false, studioLang = null, studioMod = null, studioSeq = 0
function renderStudio() {
  if (studioMounted && studioLang === lang) return
  const root = $('#panel-studio')
  if (!root) return
  const seq = ++studioSeq
  try { studioMod?.distruggi?.() } catch {}
  studioMod = null
  studioMounted = true
  studioLang = lang
  root.innerHTML = `<div class="lab"><p class="lab__nota">${esc(cap({ it: 'Accendo lo studio…', en: 'Waking the studio up…' }))}</p></div>`
  import('./studio/index.js').then((m) => {
    if (seq !== studioSeq) return
    studioMod = m.monta(root, {
      lang,
      presence: () => presence,
      onPresence: (f) => {
        liveListeners.add(f)
        if (presence) f(presence)
        return () => liveListeners.delete(f)
      },
      open: (key) => openProject(key),
      toast,
    })
  }).catch((e) => {
    console.error(e)
    if (seq !== studioSeq) return
    studioMounted = false
    studioLang = null
    root.innerHTML = `<div class="lab"><p class="lab__errore">${esc(cap({ it: 'Lo studio non si è acceso. Riprova a ricaricare.', en: 'The studio did not start. Try reloading.' }))}</p></div>`
  })
}
function renderPanel() {
  if (activeTab === 'board') renderBoard()
  else if (activeTab === 'community') renderCommunity()
  else if (activeTab === 'projects') renderProjects()
  else if (activeTab === 'chat') renderChat()
  else if (activeTab === 'activity') renderActivity()
  else if (activeTab === 'studio') renderStudio()
  else renderSocial()
}
document.addEventListener('click', (e) => {
  const ap = e.target.closest('[data-app]')
  if (ap && !ap.closest('dialog')) { lancia(ap.dataset.app, ap.dataset.appTitle); return }
  const o = e.target.closest('[data-open]')
  if (o) { openProject(o.dataset.open, { from: o.classList.contains('media') ? o : o.closest('.pcard, .hero')?.querySelector('.media') }); return }
  const g = e.target.closest('[data-goto]')
  if (g) { toolFilter = null; showTab(g.dataset.goto, { focus: true }); return }
  const f = e.target.closest('[data-filter]')
  if (f && f.dataset.filter !== filter) { filter = f.dataset.filter; swap(renderProjects); return }
  if (e.target.closest('[data-tool-off]')) { toolFilter = null; swap(renderProjects) }
})
// i tasti d'app dell'accesso (l'invito, le novità): il riquadro si chiude e l'app si apre qui
document.addEventListener('pzkko-apri', (e) => { const a = e.detail?.app; if (typeof a !== 'string' || !/^(qui:[a-z:]+|\/[a-z])/.test(a)) return; e.preventDefault(); lancia(a) })

// (26.11) le barre del brano e i tempi dei giochi avanzano da sole dentro adesso.js
// (un solo rAF, fermo quando non serve e quando la scheda è nascosta)

// ─── la scheda del progetto ──────────────────────────────────────────────────
let modal = null
function openProject(key, { from = null, push = true } = {}) {
  const p = PROJECTS.find((x) => x.key === key)
  if (!p || modal?.key === key) return
  if (modal) closeProject({ instant: true, pop: false })
  closeMenus()
  closeSearch()
  const u = ui(), tx = projText(key), m = MEDIA[key]
  const slides = m ? [...(m.video ? [{ video: m.video, img: m.cover }] : []), ...m.shots.map((s) => ({ img: s.src, w: s.w, h: s.h, cap: s }))] : []
  if (m && !slides.length) slides.push({ img: m.cover, w: 1280, h: 720 })
  const root = document.createElement('div')
  root.className = 'pv'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-labelledby', 'pv-title')
  // (25.11) la scheda è un manifesto del muro: il foglio col nastro, le catture attaccate come foto, Anton e la macchina da
  // scrivere, il tasto nero; in fondo «prova anche», tre volantini di altre app da aprire subito
  const altre = daProvare(3, [key])
  root.innerHTML = `<div class="pv__bg" data-close></div>
    <div class="pv__panel" tabindex="-1">
      <div class="pv__top">
        <button type="button" class="pz-ico" data-share aria-label="${esc(u.copyLink)}" title="${esc(u.copyLink)}">${I.link.replace('width="18" height="18"', 'width="20" height="20"')}</button>
        <button type="button" class="pz-x" data-close aria-label="${esc(u.close)}" title="${esc(u.close)}"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button>
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
          <div style="min-width:0;flex:1 1 280px"><span class="pv__kind">${esc(u.kind[p.kind] || '')}${archived(p) ? ` · ${esc(u.archived)}` : ''}</span>${stampHtml(p)}<h2 class="pv__title" id="pv-title">${esc(p.title)}</h2>${rolesHtml(p.tags)}</div>
          ${p.url || p.code || p.download || p.play ? `<div class="pv__links">${playHtml(p, true)}${linksHtml(p, true)}</div>` : ''}
        </div>
        <section class="pv__sez"><h3>${esc(u.overview)}</h3><p>${esc(tx.full)}</p></section>
        <div class="grid2">
          <section class="pv__sez"><h3>${esc(u.features)}</h3><ul class="feat">${tx.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>
          <section class="pv__sez"><h3>${esc(u.role)}</h3><p>${esc(tx.role)}</p></section>
        </div>
        ${slides.length ? `<p class="fine">${I.image}${esc(u.real)}</p>` : ''}
        ${altre.length ? `<section class="pv__altre"><h3>${esc(spot().altre)}</h3><div class="pv__fila">${altre.map((x, i) => flyerHtml(x, i + 1)).join('')}</div></section>` : ''}
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

// ─── quello che gira QUI, sopra il profilo: il cercapersone 3D (telefono/telefono.js, con pzk os) e i tavoli veri
// (games/<gioco>/<gioco>.js). Niente finestra e niente muro dietro: sono gli stessi moduli della chat, quindi il conto,
// i soldi e lo zaino sono gli stessi nello stesso momento ──
const TAVOLI = ['roulette', 'blackjack', 'mine', 'dado', 'moneta', 'virtual', 'parole', 'trivia', 'angoli', 'pzkmaps', 'calcolatrice',
  'synth', 'batteria', 'theremin', 'spettro', 'specchio', 'sabbia', 'plotter', 'livella', 'dettatura', 'tavolozza']
let zeroBtn = null
/** Il cercapersone vivo della bacheca: la foto a sfondo trasparente con pzk os acceso sul vetro. Un solo elemento, che a
 *  ogni ridisegno della bacheca torna al suo posto. */
function zeroButton() {
  if (zeroBtn) return zeroBtn
  const b = zeroBtn = document.createElement('button')
  b.type = 'button'
  b.className = 'chat-tasto zero'
  b.setAttribute('aria-label', 'PZK Zero')
  b.innerHTML = '<img src="/art/zero/zero-piccolo.webp" alt="" width="1344" height="776" decoding="async" draggable="false"><span class="ct-lcd" aria-hidden="true"></span><span class="ct-led" aria-hidden="true"></span>'
  b.addEventListener('click', () => openHere('zero'))
  const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 600))
  idle(() => {
    import('/chat/chat.js').then((c) => c.prepara(b)).catch((e) => console.warn('cercapersone non acceso', e))
    // il 3D si scalda da solo quando la pagina è tranquilla (non col risparmio dati né sui telefoni): la prima apertura parte senza attese
    if (!navigator.connection?.saveData && matchMedia('(hover: hover) and (min-width: 900px)').matches) setTimeout(() => idle(() => { fetch('/art/zero/zero.glb', { priority: 'low' }).catch(() => {}); import('/telefono/zero/zero.js').catch(() => {}) }), 2500)
  }, { timeout: 2500 })
  return b
}
function openHere(what, { app = null, comando = null } = {}) {
  closeMenus(); closeSearch(); togliVolantino(true)
  for (const el of $$('.media.is-playing')) stopMedia(el)
  // (25.11) l'app aperta finisce nella tessera, e quando la chiudi il volantino ne propone un'altra
  const target = `qui:${what}`, prima = $$('dialog[open]'), tranne = appDi(target)
  segna(target)
  const poi = () => dopoChiusura(prima, tranne, target)
  if (what === 'chat') { if (modal) closeProject(); showTab('chat', { focus: true }); return Promise.resolve() }
  if (TAVOLI.includes(what)) return import(`/games/${what}/${what}.js`).then((m) => m.apri()).then(poi).catch((e) => { console.error(e); toast(ui().nothing) })
  // le app singole («qui:app:miniera»): un'app del cercapersone da sola, sullo schermo steso piatto (telefono/schermo.js)
  if (what === 'app' || what.startsWith('app:')) return import('/telefono/schermo.js').then((m) => m.apri(what.slice(4) || app)).then(poi).catch((e) => { console.error(e); toast(ui().nothing) })
  const da = zeroBtn?.isConnected && activeTab === 'board' && !modal ? zeroBtn : null
  return import('/telefono/telefono.js').then((t) => t.apri(app, { ...(da && { da }), ...(comando && { comando }) })).then(poi).catch((e) => { console.error(e); toast(ui().nothing) })
}

// ─── le pagine intere (il muro, pzk$meeting) in una finestra dentro il sito ──
let appWin = null
function openApp(href, title = '') {
  if (!/^\/[a-z]/.test(href) || appWin) return
  closeMenus(); closeSearch(); togliVolantino(true)
  segna(href)
  for (const el of $$('.media.is-playing')) stopMedia(el)
  $('.pv video')?.pause()
  const u = ui(), box = document.createElement('div')
  box.className = 'app'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-modal', 'true')
  box.setAttribute('aria-label', title)
  // (26.11) la Frontiera chiede fotocamera, microfono, MIDI e WebXR: gli altri no
  const permessi = /^\/frontiera(?:\/|$)/.test(href)
    ? 'fullscreen; autoplay; gamepad; clipboard-write; camera; microphone; midi; xr-spatial-tracking'
    : 'fullscreen; autoplay; gamepad; clipboard-write'
  // (25.11) la testata è una striscia di carta col nastro: il nome in Anton, l'indirizzo a macchina
  box.innerHTML = `<div class="app__bar"><i class="pz-nastro" aria-hidden="true"></i><b>${esc(title)}</b><span class="app__sub">pzkko.it${esc(href.split('?')[0])}</span>
      <a class="pz-ico" href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(u.open)}" aria-label="${esc(u.open)}">${I.ext.replace('width="14" height="14"', 'width="20" height="20"')}</a>
      <button type="button" class="pz-x" data-close title="${esc(u.close)}" aria-label="${esc(u.close)}"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button></div>
    <iframe class="app__frame" src="${esc(href)}" title="${esc(title)}" allow="${permessi}"></iframe>`
  box.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeApp() })
  history.pushState({ app: href }, '')
  document.body.appendChild(box)
  document.documentElement.style.overflow = 'hidden'
  appWin = { box, last: document.activeElement, href }
  requestAnimationFrame(() => box.classList.add('is-on'))
  $('iframe', box).focus()
}
function closeApp({ pop = true } = {}) {
  if (!appWin) return
  const { box, last, href } = appWin
  appWin = null
  box.classList.remove('is-on')
  setTimeout(() => { box.parentNode?.removeChild(box); if (!modal && !appWin) document.documentElement.style.overflow = '' }, 200)
  if (pop) history.back()
  last?.focus?.({ preventScroll: true })
  window.dispatchEvent(new Event('pzkko-app-chiusa'))
  provare.chiusa(href)
  provare.reagisci(href, 'chiusa')
  setTimeout(() => { if (!occupato()) volantino('dopo', appDi(href)) }, 700)
}

// ─── gli indirizzi: #progetti, #progetti/zero… e il tasto «indietro» ─────────
function parseHash() {
  const [a, b] = decodeURIComponent(location.hash.slice(1)).split('/')
  const tab = Object.entries(SLUG).find(([, s]) => s === a)?.[0] || null
  return { tab, proj: tab === 'projects' && PROJECTS.some((p) => p.key === b) ? b : null }
}
function route() {
  if (appWin) { closeApp({ pop: false }); return }
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
let langSeq = 0
const setLang = async (v) => {
  if (!LINGUE.includes(v) || v === lang) return
  const seq = ++langSeq
  try { await caricaLingua(v) } catch { return }
  if (seq !== langSeq) return // (se nel frattempo ne hai scelta un'altra, vince l'ultima)
  lang = v
  store.set(LANG_KEY, v)
  applyLang()
  loadCollectibles()
}
// a mano vale fino al prossimo cambio del sole (alba o tramonto), poi torna l'automatico
const toggleTheme = () => { theme = theme === 'dark' ? 'light' : 'dark'; if (window.pzkkoTema) window.pzkkoTema.scegli(theme); else store.set(THEME_KEY, theme); swap(applyTheme) }
window.pzkkoTema?.segui((t) => { theme = t; swap(applyTheme) })
$('#lang-btn').addEventListener('click', (e) => showMenu(e.currentTarget, LANGS.map((l) => `<button role="menuitem" tabindex="-1" data-v="${l.code}"><img src="${flag(l.flag)}" alt="" width="20" height="15">${esc(l.name)}${l.code === lang ? `<span class="check">${I.check}</span>` : ''}</button>`).join(''), setLang))
$('#more-btn').addEventListener('click', (e) => showMenu(e.currentTarget, `
  <button role="menuitem" tabindex="-1" data-v="user">${I.copy}${esc(ui().copyUser)}</button>
  <button role="menuitem" tabindex="-1" data-v="id">${I.copy}${esc(ui().copyId)}</button><hr>
  <button role="menuitem" tabindex="-1" data-v="open">${I.chat}${esc(ui().openDiscord)}</button>`, (v) => {
  if (v === 'user') copy(username())
  else if (v === 'id') copy(ID)
  else window.open(`https://discord.com/users/${ID}`, '_blank', 'noopener,noreferrer')
}))
$('#copy-btn').addEventListener('click', () => copy(username()))
$('#theme-btn').addEventListener('click', toggleTheme)

// ─── la ricerca rapida (Ctrl K), come quella di Discord ──────────────────────
let qs = null
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
function searchItems() {
  const u = ui(), s = provate(), primi = daProvare(5).map((p) => p.key)
  // (25.11) «gioca subito»: ogni cosa che gira qui (la roulette, parole, la miniera…) si apre dalla ricerca senza passare
  // dalla scheda; a ricerca vuota restano solo le cinque da provare, a ricerca piena ci sono tutte
  const gioca = APPS.flatMap((p) => p.play.map(([label, href], i) => ({ group: spot().subito, label, sub: label === p.title ? verbo(p) : p.title, words: `${p.title} ${p.tags.map((x) => x[0]).join(' ')}`, ico: MEDIA[p.key] ? `<img src="${esc(MEDIA[p.key].cover)}" alt="">` : I[p.kind], play: true, top: i === 0 && primi.includes(p.key), giro: primi.includes(p.key) ? primi.indexOf(p.key) : 99, fresh: isNew(p) || !provata(p, s), run: () => lancia(href, label) })))
  gioca.sort((a, b) => b.top - a.top || a.giro - b.giro)
  return [
    ...gioca,
    ...TABS.map((k) => ({ group: u.pages, label: tabLabel(k), ico: k === 'chat' ? I.chat.replace('width="18" height="18"', 'width="15" height="15"') : I.search, run: () => showTab(k) })),
    ...PROJECTS.map((p) => ({ group: u.tabs.projects, label: p.title, sub: u.kind[p.kind], words: `${p.tags.map((x) => x[0]).join(' ')} ${projText(p.key).card}`, ico: MEDIA[p.key] ? `<img src="${esc(MEDIA[p.key].cover)}" alt="">` : I[p.kind], run: () => { showTab('projects'); openProject(p.key) } })),
    ...[...SOCIALS, ...PERSONAL_SOCIALS].map((s) => ({ group: u.tabs.social, label: s.name, sub: s.handle, ico: brand(s.icon, s), run: () => window.open(s.url, '_blank', 'noopener,noreferrer') })),
    { group: u.actions, label: theme === 'dark' ? u.theme.light : u.theme.dark, ico: theme === 'dark' ? I.sun : I.moon, run: toggleTheme },
    { group: u.actions, label: u.copyUser, sub: username(), ico: I.copy, run: () => copy(username()) },
    ...(account() ? [] : [{ group: u.actions, label: acc().join, sub: acc().sub, ico: I_ACC, run: () => access('accedi') }]),
    { group: u.actions, label: acc().news, ico: I_ACC, run: () => access('novita') },
    { group: u.actions, label: acc().gift, sub: 'Instagram', ico: I_ACC, run: () => access('premio') },
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
    if (!q) found = found.filter((it) => it.group !== u.language && it.group !== u.tabs.social && (!it.play || it.top))
    // prima chi ha la parola nel nome, poi gli altri (i gruppi restano uniti)
    else {
      const rank = (it) => { const l = norm(it.label); return l.startsWith(q) ? 0 : l.includes(q) ? 1 : 2 }
      const groups = [...new Set(found.map((it) => it.group))].sort((g1, g2) => Math.min(...found.filter((it) => it.group === g1).map(rank)) - Math.min(...found.filter((it) => it.group === g2).map(rank)))
      found = groups.flatMap((g) => found.filter((it) => it.group === g).sort((x, y) => rank(x) - rank(y)))
    }
    sel = Math.min(sel, Math.max(0, found.length - 1))
    let group = ''
    list.innerHTML = found.length ? found.map((it, i) => `${it.group !== group ? `<li class="qs__group" role="presentation">${esc(group = it.group)}</li>` : ''}<li role="presentation"><button type="button" class="qs__item" role="option" id="qs-${i}" data-i="${i}" aria-selected="${i === sel}" tabindex="-1"><span class="ico">${it.ico || ''}</span><span>${esc(it.label)}</span>${it.play && it.fresh ? `<span class="qs__nuovo" title="${esc(spot().mai)}" aria-hidden="true">★</span>` : ''}${it.sub ? `<span class="sub${it.play ? ' sub--play' : ''}">${it.play ? '▶ ' : ''}${esc(it.sub)}</span>` : ''}</button></li>`).join('') : `<li class="qs__empty">${esc(u.noResults)}</li>`
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
  if (document.querySelector('dialog[open]')) return
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); qs ? closeSearch() : openSearch() }
  else if (e.key === '/' && !typing && !modal && !qs && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openSearch() }
})

// ─── lingua ──────────────────────────────────────────────────────────────────
function applyLang() {
  const u = ui(), l = LANGS.find((x) => x.code === lang) || LANGS[0]
  document.documentElement.lang = lang
  renderAcc()
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
  $('#foot').innerHTML = `<b>${esc(CONFIG.domain)}</b> — ${esc(u.footFun)} · ${esc(u.updated)} ${esc(date)} · <a href="#community">${esc(tabLabel('community'))}</a> · <a href="#studio">${esc(tabLabel('studio'))}</a> · <a href="/info/">info</a><span id="views"></span>`
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
  adesso.aggiorna()
  chiSono.presenza(d.discord_status)
  attivita.presenza(d.discord_status)
  if (activeTab === 'activity') renderActivity()
  for (const f of liveListeners) { try { f(d) } catch (e) { console.error(e) } }
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

// ─── il profilo pubblico (banner, tema, badge, collezione) ─
async function loadProfile() {
  try {
    const r = await fetch(`${CONFIG.profileApi}${ID}`, { cache: 'no-store' })
    if (!r.ok) return
    const d = await r.json()
    const u = d.user || {}, up = d.user_profile || {}
    if (!fisso('theme') && Array.isArray(up.theme_colors) && up.theme_colors.length === 2) profile.theme = up.theme_colors.map((c) => '#' + Number(c).toString(16).padStart(6, '0'))
    if (!fisso('banner')) {
      if ('banner' in u) profile.banner = u.banner
      if (/^#[0-9a-f]{6}$/i.test(u.banner_color || '')) profile.bannerColor = u.banner_color
    }
    // (la bio e i collegamenti restano quelli di pzkko: il profilo dal vivo può
    // cambiare, ma non porta qui il nome o gli account personali)
    if (u.display_name_styles) profile.nameStyle = u.display_name_styles
    if (Array.isArray(d.badges)) profile.badges = d.badges.map((b) => ({ id: b.id, icon: b.icon, description: b.description, link: b.link }))
    // gli oggetti da collezione: l'effetto, la cornice (tipo 3) e la decorazione
    const sku = (v) => (/^\d+$/.test(String(v ?? '')) ? String(v) : null)
    if ('profile_effect' in up && !fisso('effect')) profile.effectSku = sku(up.profile_effect?.sku_id)
    if (Array.isArray(up.collectibles)) profile.frameSku = sku(up.collectibles.find((c) => c.type === 3)?.sku_id)
    if ('avatar_decoration_data' in u && !fisso('decoration')) profile.decorationSku = sku(u.avatar_decoration_data?.sku_id)
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

// ─── visite: nessun contatore di terze parti (nessuno script esterno, niente cookie) ───
let views = null
function renderViews() {
  const box = $('#views')
  if (!box || views == null) return
  box.textContent = ` · ${views.toLocaleString(locale())} ${ui().views}`
}

// ─── il conto (19.11): si entra con l'email e un codice, niente password (accesso/accesso.js). Nella scheda c'è il tasto:
// verde «Entra» per chi non ha un conto, il nome e i $pzk per chi è dentro (col menu: novità, regalo di instagram, esci).
// All'arrivo, a pagina ferma: l'invito per chi non ha un conto, le novità per chi ce l'ha, e col tasto della lettera
// (?premio=…) la decisione di pzkko sul regalo. Le scritte in italiano e in inglese (le altre lingue vedono l'inglese) ──
const ACC = {
  it: { join: 'Entra in pzkko.it', sub: '1.000 $pzk di benvenuto', news: 'Novità', gift: 'Regalo: +2.000 $pzk', giftWait: 'Regalo: pzkko controlla', gifts: (n) => `Regali da decidere (${n})`, out: 'Esci dal conto', bye: 'Uscito dal conto' },
  en: { join: 'Join pzkko.it', sub: '1,000 $pzk to start', news: 'What’s new', gift: 'Gift: +2,000 $pzk', giftWait: 'Gift: pzkko is checking', gifts: (n) => `Gifts to decide (${n})`, out: 'Log out', bye: 'Logged out' },
}
const acc = () => ACC[lang] || ACC.en
const I_ACC = svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>', { s: 16, w: 2.4 })
let pzkMod = null
const account = () => { if (pzkMod) return pzkMod.conto(); try { return JSON.parse(localStorage.getItem('pzkko-wallet') || 'null')?.conto ?? null } catch { return null } }
const premiDaDecidere = () => { if (pzkMod) return pzkMod.premi(); try { return JSON.parse(localStorage.getItem('pzkko-wallet') || 'null')?.premi ?? [] } catch { return [] } } // (25.11) i regali di instagram da decidere, solo nel conto di pzkko
const access = (what, ...a) => import('/accesso/accesso.js').then((m) => m[what](...a)).catch((e) => console.error(e))
function renderAcc() {
  const b = $('#acc-btn'), c = account()
  if (!b) return
  const regali = c ? premiDaDecidere().length : 0
  b.classList.toggle('btn--join', !c); b.classList.toggle('btn--ghost', !!c)
  b.setAttribute('aria-haspopup', c ? 'menu' : 'dialog')
  b.innerHTML = c
    ? `<i class="acc__dot"></i><span class="acc__name">${esc(c.nome)}</span>${regali ? `<i class="acc__badge" title="${esc(acc().gifts(regali))}">${regali}</i>` : ''}<span class="acc__pzk">$pzk ${Number(c.pzk || 0).toLocaleString(locale(), { maximumFractionDigits: 1 })}</span>`
    : `${I_ACC}<span>${esc(acc().join)}</span><small>${esc(acc().sub)}</small>`
}
$('#acc-btn').addEventListener('click', (e) => {
  const c = account()
  if (!c) return access('accedi')
  const st = c.seguo?.stato, regali = premiDaDecidere().length
  showMenu(e.currentTarget, `
    <button role="menuitem" tabindex="-1" data-v="novita">${I.search}${esc(acc().news)}</button>
    ${regali ? `<button role="menuitem" tabindex="-1" data-v="premi">${I_ACC}${esc(acc().gifts(regali))}</button>` : ''}
    ${st === 'dato' ? '' : `<button role="menuitem" tabindex="-1" data-v="premio">${I_ACC}${esc(st === 'attesa' ? acc().giftWait : acc().gift)}</button>`}<hr>
    <button role="menuitem" tabindex="-1" data-v="esci">${I.copy}${esc(acc().out)}</button>`, async (v) => {
    if (v !== 'esci') return access(v)
    const p = pzkMod ?? await import('/games/pzk.js')
    await p.esci(); renderAcc(); toast(acc().bye)
  })
})
addEventListener('storage', (e) => { if (e.key === 'pzkko-wallet' || e.key === null) renderAcc() })
document.addEventListener('pzkko-accesso', renderAcc)
function mountAccess() {
  const go = () => import('/games/pzk.js').then((p) => {
    pzkMod = p; p.osserva(renderAcc); p.alCambioConto(renderAcc); renderAcc()
    if (new URLSearchParams(location.search).has('premio') || (!modal && !qs && !first.proj)) access('arrivo')
  }).catch(() => {})
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 300))
  if (document.readyState === 'complete') setTimeout(idle, 700); else addEventListener('load', () => setTimeout(idle, 700), { once: true })
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
// la vetrina: a ogni cambio si aggiornano l'attività della scheda e il riquadro «adesso»
// (i nodi restano quelli: le transizioni possono sopravvivere)
ascoltaVetrina(() => {
  renderCardActivity()
  adesso.aggiorna()
})
loadProfile()
setInterval(loadProfile, 10 * 60 * 1000)
if (first.proj) openProject(first.proj, { push: false })
mountAccess()
volantinoDelGiorno()

// Per le prove: import('/assets/app.js').then((m) => m.onPresence({...}))
export { onPresence }
