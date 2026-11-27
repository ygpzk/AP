// miniature/index.js — le miniature vive delle app (27.11.2026).
//
// Ogni copertina `.art[data-mini="<chiave>"]` (la fa mediaHtml in app.js) riceve un canvas e il modulo
// `./<chiave>.js` la disegna fotogramma per fotogramma. Il motore pensa a tutto il resto:
//   · un solo requestAnimationFrame per la pagina, al massimo 60 fps anche sui monitor da 144/164 Hz;
//   · gira solo quello che si vede (IntersectionObserver) e niente a scheda nascosta;
//   · canvas nitido (devicePixelRatio fino a 2), ridimensionato con ResizeObserver;
//   · `m.su` va da 0 a 1 col mouse sopra (o il fuoco), morbido: i moduli lo usano per «accendersi»;
//   · prefers-reduced-motion: un fotogramma solo, fermo (quello di `fermo`, se il modulo lo dice);
//   · se un modulo manca o si rompe, resta la copertina di prima (colori, motivo, titolo).
//
// Il contratto di un modulo (vedi design/miniature.md):
//   export default function crea(m) → { frame(t, dt), ridimensiona?(), chiudi?(), titolo?: bool, cattura?: bool, fermo?: number }
//   (può anche restituire una Promise, per caricare immagini e caratteri prima del primo fotogramma)
import * as kit from './kit.js'
import { MEDIA } from '../media.js'

const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches
const PASSO = 1000 / 60
const vive = new Map() // .art → voce
let raf = 0, ultimo = 0, fisso = null, avviato = false

const cssUrl = new URL('./miniature.css', import.meta.url).href
function caricaCss() {
  if (document.querySelector(`link[href="${cssUrl}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = cssUrl
  document.head.appendChild(l)
}

const vista = new IntersectionObserver((voci) => {
  for (const v of voci) {
    const voce = vive.get(v.target)
    if (!voce) continue
    voce.visibile = v.isIntersecting
    if (voce.visibile) parti()
  }
}, { rootMargin: '120px' })

const misura = new ResizeObserver((voci) => {
  for (const v of voci) {
    const voce = vive.get(v.target)
    if (voce) dimensiona(voce)
  }
})

function dimensiona(voce) {
  const r = voce.el.getBoundingClientRect()
  const w = Math.round(r.width), h = Math.round(r.height)
  if (!w || !h) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  if (w === voce.m.w && h === voce.m.h && dpr === voce.m.dpr) return
  voce.m.w = w
  voce.m.h = h
  voce.m.dpr = dpr
  voce.cv.width = Math.round(w * dpr)
  voce.cv.height = Math.round(h * dpr)
  try { voce.api?.ridimensiona?.(w, h) } catch (e) { rotto(voce, e) }
  if (voce.api && voce.fermo) disegnaFermo(voce)
  else if (voce.api) disegna(voce, 0)
}

function disegna(voce, dt) {
  const { g, m } = voce
  g.setTransform(m.dpr, 0, 0, m.dpr, 0, 0)
  try { voce.api.frame(m.t, dt) } catch (e) { rotto(voce, e) }
}

// un fotogramma solo a un tempo preciso: si arriva lì a passi di 1/60 s, così anche le simulazioni sono giuste
function disegnaFermo(voce) {
  const T = voce.tempo ?? voce.api.fermo ?? 2.5
  voce.m.su = voce.el.closest('[data-mini-su]') ? 1 : 0
  const passi = Math.min(60 * 30, Math.round(T * 60))
  voce.m.t = 0
  for (let i = 0; i < passi; i++) {
    voce.m.t = i / 60
    if (i < passi - 1) { voce.g.setTransform(voce.m.dpr, 0, 0, voce.m.dpr, 0, 0); try { voce.api.frame(voce.m.t, 1 / 60) } catch (e) { return rotto(voce, e) } }
  }
  voce.m.t = T
  disegna(voce, 1 / 60)
}

function rotto(voce, e) {
  console.warn(`[miniature] ${voce.m.chiave}:`, e)
  chiudi(voce)
}

function chiudi(voce) {
  vive.delete(voce.el)
  vista.unobserve(voce.el)
  misura.unobserve(voce.el)
  try { voce.api?.chiudi?.() } catch {}
  voce.cv.remove()
  voce.el.classList.remove('is-vivo', 'art--senza-titolo', 'art--con-cattura')
}

function giro(ora) {
  raf = 0
  if (document.hidden || ridotto) return
  let attive = 0
  for (const voce of vive.values()) if (voce.visibile && voce.api && !voce.fermo) attive++
  if (!attive) return
  raf = requestAnimationFrame(giro)
  if (ora - ultimo < PASSO - 1.5) return
  const dt = Math.min(0.05, ultimo ? (ora - ultimo) / 1000 : PASSO / 1000)
  ultimo = ora
  for (const voce of [...vive.values()]) {
    if (!voce.el.isConnected) { chiudi(voce); continue }
    if (!voce.visibile || !voce.api || voce.fermo) continue
    const m = voce.m
    m.su += ((voce.sopra ? 1 : 0) - m.su) * Math.min(1, dt * 7)
    if (Math.abs(m.su - (voce.sopra ? 1 : 0)) < 0.002) m.su = voce.sopra ? 1 : 0
    m.t += dt
    disegna(voce, dt)
  }
}
function parti() {
  if (raf || ridotto || document.hidden) return
  ultimo = 0
  raf = requestAnimationFrame(giro)
}

async function monta(el) {
  if (vive.has(el) || el.dataset.miniFatto) return
  const chiave = el.dataset.mini
  if (!chiave || !/^[a-z0-9-]+$/.test(chiave)) return
  el.dataset.miniFatto = '1'
  let crea
  try { crea = (await import(`./${chiave}.js`)).default } catch { return } // niente modulo: resta la copertina di prima
  if (typeof crea !== 'function' || !el.isConnected) return
  const cs = getComputedStyle(el)
  const cv = document.createElement('canvas')
  cv.className = 'art__vivo'
  cv.setAttribute('aria-hidden', 'true')
  const g = cv.getContext('2d')
  const cover = MEDIA[chiave]?.cover || null
  const m = {
    chiave, cv, g, w: 0, h: 0, dpr: 1, t: 0, su: 0, kit,
    titolo: el.querySelector('.art__title')?.textContent || '',
    c1: cs.getPropertyValue('--c1').trim() || '#9d00ff',
    c2: cs.getPropertyValue('--c2').trim() || '#2a0047',
    ink: cs.getPropertyValue('--ink').trim() || '#ffffff',
    font: (cs.getPropertyValue('--af').trim() || 'Pricedown').replace(/['"]/g, ''),
    cattura: cover, // l'immagine vera del progetto in funzione (se c'è): meglio metterla nella scena che inventarla
    ridotto,
    fermo: false,
  }
  // un fotogramma fermo: per tutti (prefers-reduced-motion, avvia({ fisso })) o per una copertina sola (data-mini-t="2.5", le prove)
  const tempo = el.dataset.miniT != null && Number.isFinite(+el.dataset.miniT) ? +el.dataset.miniT : fisso
  const voce = { el, cv, g, m, api: null, visibile: false, sopra: false, tempo, fermo: ridotto || tempo != null }
  m.fermo = voce.fermo
  if (el.closest('[data-mini-su]')) voce.sopra = true // le prove «col mouse sopra»
  vive.set(el, voce)
  el.prepend(cv)
  const tasto = el.closest('.media, button, a') || el
  const su = () => { voce.sopra = true; parti() }
  const giu = () => { voce.sopra = false }
  tasto.addEventListener('pointerenter', su)
  tasto.addEventListener('pointerleave', giu)
  tasto.addEventListener('focusin', su)
  tasto.addEventListener('focusout', giu)
  dimensiona(voce)
  misura.observe(el)
  vista.observe(el)
  try { voce.api = await crea(m) } catch (e) { return rotto(voce, e) }
  if (!voce.api || typeof voce.api.frame !== 'function' || !vive.has(el)) return chiudi(voce)
  el.classList.add('is-vivo')
  if (voce.api.titolo === false) el.classList.add('art--senza-titolo')
  if (voce.api.cattura === true) el.classList.add('art--con-cattura')
  else el.querySelector('.art__shot video')?.remove() // il filmato vero resta nella finestra del progetto
  dimensiona(voce)
  if (voce.fermo) disegnaFermo(voce)
  else { disegna(voce, 0); parti() }
  el.dispatchEvent(new CustomEvent('mini:pronta', { bubbles: true }))
}

// il modulo di una copertina si scarica solo quando la copertina sta per entrare nello schermo
const vicino = new IntersectionObserver((voci) => {
  for (const v of voci) if (v.isIntersecting) { vicino.unobserve(v.target); monta(v.target) }
}, { rootMargin: '400px' })
const prenota = (el) => { if (!el.dataset.miniFatto) vicino.observe(el) }
function cerca(root = document) {
  for (const el of root.querySelectorAll?.('.art[data-mini]') || []) prenota(el)
}

/** Avvia le miniature sulla pagina (una volta sola). `fisso`: tempo in secondi per un fotogramma fermo (prove). */
export function avvia(opz = {}) {
  if (avviato) return
  avviato = true
  if (opz.fisso != null && Number.isFinite(+opz.fisso)) fisso = +opz.fisso
  caricaCss()
  cerca()
  new MutationObserver((cambi) => {
    for (const c of cambi) for (const n of c.addedNodes) if (n.nodeType === 1) {
      if (n.matches?.('.art[data-mini]')) prenota(n)
      else cerca(n)
    }
    for (const voce of [...vive.values()]) if (!voce.el.isConnected) chiudi(voce)
  }).observe(document.body, { childList: true, subtree: true })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) parti() })
}

// per le prove in console: miniature.vive()
export const elenco = () => [...vive.values()].map((v) => ({ chiave: v.m.chiave, visibile: v.visibile, w: v.m.w, h: v.m.h }))
