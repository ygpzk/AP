// Lo Studio di pzkko.it (26.11.2026): dieci cose nuove, tutte vere.
// Ogni esperimento è un modulo in ./esperimenti/ con la stessa forma:
//   { id, titolo: { it, en }, testo: { it, en }, tecnologie: [], monta(el, api) → cleanup }
// Il guscio costruisce le schede, passa i dati dal vivo (presenza Lanyard +
// vetrina) e monta un esperimento solo quando la sua scheda si avvicina allo
// schermo. Le grafiche sono di Claude Code: qui c'è il motore e l'HTML semantico.
import { ascolta as ascoltaVetrina, vetrina, immagine } from '../vetrina.js'
import { palette, inchiostro, mescola, rgbDi, luminanza } from './colori.js'

// il foglio dello Studio si carica solo quando si apre la scheda (è autonomo:
// usa le variabili di site.css, ma non vive dentro il Tailwind del sito)
if (!document.querySelector('link[data-studio-css]')) {
  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = '/assets/studio/studio.css'
  css.dataset.studioCss = '1'
  document.head.append(css)
}

import pip from './esperimenti/pip.js'
import quadro from './esperimenti/quadro.js'
import diario from './esperimenti/diario.js'
import radio from './esperimenti/radio.js'
import cartolina from './esperimenti/cartolina.js'
import costellazione from './esperimenti/costellazione.js'
import stanza from './esperimenti/stanza.js'
import sole from './esperimenti/sole.js'
import meteo from './esperimenti/meteo.js'
import clip from './esperimenti/clip.js'

const ESPERIMENTI = [pip, quadro, diario, radio, cartolina, costellazione, stanza, sole, meteo, clip]

const TESTI = {
  it: {
    kicker: 'studio',
    titolo: 'dieci cose nuove, fatte davvero',
    testo: 'Niente mockup e niente video: ogni foglio usa quello che succede adesso sul profilo, o una tecnologia del browser che lavora qui.',
    nota: 'I dati del profilo sono gli stessi della pagina: Lanyard per la presenza, la vetrina per Spotify e le app aperte. Lo Studio non manda niente a nessuno.',
    attesa: 'Accendo lo studio…',
    errore: 'Lo studio non si è acceso. Riprova a ricaricare.',
    tecnologie: 'Tecnologie',
    nonSupportato: 'non supportato',
    supportato: 'pronto',
    live: 'dal vivo',
    apri: 'Apri',
    chiudi: 'Chiudi',
    nessunaMusica: 'Nessuna musica in questo momento',
    offline: 'Offline',
    online: 'Online',
    inUfficio: 'in ufficio',
    inGiro: 'in giro per il mondo',
    ora: 'adesso',
    oggi: 'oggi',
    evento: 'evento',
    frontiera: 'Il secondo giro è la <b>Frontiera</b>: dieci tecnologie nuove — WebGL, crittografia, fotocamera, voce, file locali, IA e WebXR. <a href="/frontiera/" target="_blank" rel="noopener">Apri la Frontiera →</a>',
  },
  en: {
    kicker: 'studio',
    titolo: 'ten new things, actually built',
    testo: 'No mockups, no videos: every sheet uses what is happening on the profile right now, or a browser technology working here.',
    nota: 'Profile data is the same as the page: Lanyard for presence, the shop window for Spotify and open apps. The Studio sends nothing anywhere.',
    attesa: 'Waking the studio up…',
    errore: 'The studio did not start. Try reloading.',
    tecnologie: 'Technologies',
    nonSupportato: 'not supported',
    supportato: 'ready',
    live: 'live',
    apri: 'Open',
    chiudi: 'Close',
    nessunaMusica: 'Nothing playing right now',
    offline: 'Offline',
    online: 'Online',
    inUfficio: 'at the office',
    inGiro: 'somewhere in the world',
    ora: 'now',
    oggi: 'today',
    evento: 'event',
    frontiera: 'The second round is the <b>Frontier</b>: ten new technologies — WebGL, cryptography, camera, voice, local files, AI and WebXR. <a href="/frontiera/" target="_blank" rel="noopener">Open the Frontier →</a>',
  },
}
const tr = (lang, pair) => pair?.[lang] || pair?.en || pair?.it || ''

const STATO = {
  offline: { it: 'Offline', en: 'Offline' },
  online: { it: 'Online', en: 'Online' },
  idle: { it: 'In pausa', en: 'Idle' },
  dnd: { it: 'Non disturbare', en: 'Do not disturb' },
}

/** La presenza e la vetrina, in una forma sola. */
export function adesso(presence, v) {
  const p = presence || null
  const m = v || null
  const status = p?.discord_status || 'offline'
  const custom = (p?.activities || []).find((a) => a.type === 4) || null
  const gioco = (p?.activities || []).find((a) => [0, 1, 3, 5].includes(a.type)) || null
  return {
    p,
    v: m,
    status,
    online: status !== 'offline',
    custom,
    gioco,
    track: m?.musica || null,
    apps: Array.isArray(m?.app) ? m.app : [],
    luogo: m?.luogo || null,
    agg: m?.agg || null,
  }
}

function supporto() {
  return [
    ['Document PiP', 'documentPictureInPicture' in window],
    ['Web Audio', !!(window.AudioContext || window.webkitAudioContext)],
    ['IndexedDB', !!window.indexedDB],
    ['Canvas', !!document.createElement('canvas').getContext],
    ['MediaRecorder', !!window.MediaRecorder && !!HTMLCanvasElement.prototype.captureStream],
    ['Web Share', !!navigator.share],
    ['SVG', !!document.createElementNS],
  ]
}

export function monta(root, ctx = {}) {
  // se la lingua cambia, il guscio rimonta: prima si spegne tutto quello di prima
  root.__labPulizia?.()
  const pulizie = []
  const lang = ctx.lang || 'it'
  const t = (pair) => tr(lang, pair)
  const tui = TESTI[lang] || TESTI.en
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── i dati dal vivo, una volta sola per tutto lo studio ──
  const ascoltatori = new Set()
  let ultimo = adesso(ctx.presence?.(), vetrina())
  const avvisa = () => {
    ultimo = adesso(ctx.presence?.(), vetrina())
    for (const f of ascoltatori) { try { f(ultimo) } catch (e) { console.error(e) } }
  }
  const togliPresence = ctx.onPresence?.(avvisa) || (() => {})
  const togliVetrina = ascoltaVetrina(avvisa)
  pulizie.push(togliPresence, togliVetrina)

  const api = {
    lang,
    t,
    reduced,
    adesso: () => ultimo,
    onAdesso(f) {
      ascoltatori.add(f)
      if (ultimo) { try { f(ultimo) } catch (e) { console.error(e) } }
      return () => ascoltatori.delete(f)
    },
    vetrina,
    immagine,
    palette,
    inchiostro,
    mescola,
    rgbDi,
    luminanza,
    open: (key) => { try { ctx.open?.(key) } catch (e) { console.error(e) } },
    toast: (msg) => { try { ctx.toast?.(msg) } catch {} },
    stato(el, testo, tono = '') {
      if (!el) return
      el.textContent = testo
      el.dataset.tono = tono
    },
    quandoVisibile(el, cb) {
      let dentro = true
      const io = new IntersectionObserver(([e]) => { dentro = !!e?.isIntersecting; cb(dentro && !document.hidden) }, { rootMargin: '80px' })
      io.observe(el)
      const vis = () => cb(dentro && !document.hidden)
      document.addEventListener('visibilitychange', vis)
      const fine = () => { io.disconnect(); document.removeEventListener('visibilitychange', vis) }
      pulizie.push(fine)
      return fine
    },
    tema() {
      // (i colori del muro stanno sul contenitore dello Studio: --p e --a di #panel-studio .lab, in studio.css)
      const s = getComputedStyle(root.querySelector('.lab') || document.documentElement)
      return { p: s.getPropertyValue('--p').trim() || '#ccff00', a: s.getPropertyValue('--a').trim() || '#9d00ff' }
    },
    scarica(blob, nome) {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = nome
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    },
  }

  // ── le schede ──
  const sup = supporto()
  root.innerHTML = `<div class="lab">
    <header class="lab__testa">
      <div class="lab__h"><h2 class="lab__titolo">${tui.kicker}</h2><p class="lab__voce">${tui.titolo}</p></div>
      <p class="lab__intro">${tui.testo}</p>
      <ul class="lab__api" aria-label="${tui.tecnologie}">${sup.map(([n, ok]) => `<li data-ok="${ok}"><i aria-hidden="true"></i>${n}<span class="sr"> ${ok ? tui.supportato : tui.nonSupportato}</span></li>`).join('')}</ul>
      <p class="lab__fine">${tui.nota}</p>
    </header>
    <div class="lab__grid" id="lab-grid">${ESPERIMENTI.map((e, i) => `<article class="lab__card" data-lab="${e.id}" data-n="${String(i + 1).padStart(2, '0')}">
      <header class="lab__capo"><span class="lab__n">${String(i + 1).padStart(2, '0')}</span><h3>${t(e.titolo)}</h3><span class="lab__stato" data-stato="${e.id}">${tui.attesa}</span></header>
      <p class="lab__descr">${t(e.testo)}</p>
      <div class="lab__corpo" id="lab-${e.id}"></div>
      <footer class="lab__tech">${e.tecnologie.map((x) => `<span>${x}</span>`).join('')}</footer>
    </article>`).join('')}</div>
    <p class="lab__fine lab__frontiera">${tui.frontiera}</p>
  </div>`

  const griglia = root.querySelector('#lab-grid')
  const io = new IntersectionObserver((voci) => {
    for (const voce of voci) {
      if (!voce.isIntersecting) continue
      const card = voce.target
      const id = card.dataset.lab
      const e = ESPERIMENTI.find((x) => x.id === id)
      io.unobserve(card)
      if (!e) continue
      const corpo = card.querySelector('.lab__corpo')
      try {
        const fine = e.monta(corpo, api)
        if (typeof fine === 'function') pulizie.push(fine)
        card.dataset.montato = '1'
      } catch (err) {
        console.error(`lab ${id}:`, err)
        corpo.innerHTML = `<p class="lab__errore">${tui.errore}</p>`
        card.dataset.montato = 'errore'
      }
    }
  }, { rootMargin: '420px' })
  for (const card of griglia.querySelectorAll('.lab__card')) io.observe(card)
  pulizie.push(() => io.disconnect())

  const spegni = () => {
    for (const f of pulizie.splice(0)) { try { f() } catch {} }
    ascoltatori.clear()
    root.__labPulizia = null
    root.innerHTML = ''
  }
  root.__labPulizia = spegni
  return { distruggi: spegni }
}
