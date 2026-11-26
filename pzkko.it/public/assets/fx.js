// pzkko.it: la cornice e l'effetto del profilo, quelli veri di Discord.
// La cornice («Crystals (Peridot)») è fatta di due PNG, uno dietro e uno davanti alla
// scheda, ancorati in alto: le misure (larghezza interna e sbordi) le dà Discord e
// qui diventano variabili CSS. L'effetto («Dreamy (Green)») sono due APNG: l'entrata,
// una volta sola, e il giro che torna ogni tanto.

const CDN = 'https://cdn.discordapp.com'
const okUrl = (u) => typeof u === 'string' && u.startsWith(`${CDN}/`)
const fine = matchMedia('(hover: hover) and (pointer: fine)')
const reduce = matchMedia('(prefers-reduced-motion: reduce)')

/** Monta (o toglie, con `frame` nullo) la cornice attorno alla scheda. */
export function mountFrame(card, sku, frame) {
  const root = document.documentElement
  const imgs = { back: card.querySelector('#frame-back'), front: card.querySelector('#frame-front') }
  const ok = frame && /^\d+$/.test(String(sku)) && frame.inner > 0
  root.style.setProperty('--finner', ok ? frame.inner : 1200)
  root.style.setProperty('--fot', ok ? frame.top : 0)
  root.style.setProperty('--foh', ok ? frame.side : 0)
  for (const order of ['back', 'front']) {
    const img = imgs[order]
    const layer = ok ? frame.layers.find((l) => l.order === order && /^\d+$/.test(String(l.id))) : null
    if (!layer) { img.removeAttribute('src'); img.classList.remove('is-on'); continue }
    // in WebP: stesso disegno, un quinto del peso (il PNG del livello dietro pesa 860 KB)
    const url = `${CDN}/media/v1/collectibles-shop/${sku}/${layer.id}/static?format=webp`
    if (img.getAttribute('src') === url) continue
    img.classList.remove('is-on')
    img.onload = () => img.classList.add('is-on')
    img.onerror = () => img.classList.remove('is-on')
    img.src = url
  }
}

/** Un filo di profondità: i due livelli della cornice si spostano in versi opposti col puntatore. */
export function mountParallax(card) {
  let raf = 0
  const set = (x, y) => { card.style.setProperty('--tx', `${x.toFixed(2)}px`); card.style.setProperty('--ty', `${y.toFixed(2)}px`) }
  card.addEventListener('pointermove', (e) => {
    if (!fine.matches || reduce.matches || e.pointerType !== 'mouse') return
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      const b = card.getBoundingClientRect()
      set(((e.clientX - b.left) / b.width - 0.5) * -7, ((e.clientY - b.top) / Math.max(b.height, 1) - 0.5) * -5)
    })
  })
  card.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); set(0, 0) })
}

/**
 * L'effetto del profilo dentro `host`. `intro` = suona anche l'entrata (2 MB: solo dove ha senso).
 * Restituisce { replay, stop }. Con «riduci movimento» mostra il fermo immagine di Discord.
 */
export function mountEffect(host, effect, { intro = true, heavy = true } = {}) {
  let timers = [], alive = true
  const clear = () => { timers.forEach(clearTimeout); timers = []; host.replaceChildren() }
  const later = (fn, ms) => { const t = setTimeout(() => { if (alive) fn() }, ms); timers.push(t); return t }
  const layers = (effect?.layers || []).filter((l) => okUrl(l.src))
  if (!effect || !layers.length) { clear(); return { replay() {}, stop: clear } }

  const img = (src, z) => {
    const el = new Image()
    el.alt = ''
    el.decoding = 'async'
    el.draggable = false
    el.style.zIndex = z
    el.src = src
    return el
  }
  if (reduce.matches || !heavy) {
    clear()
    if (okUrl(effect.still)) { const el = img(effect.still, 1); el.style.opacity = '.85'; host.append(el) }
    return { replay() {}, stop: clear }
  }

  // Il giro è un APNG che non si ferma mai: per avere la pausa di Discord resta montato
  // e si fa vedere un giro ogni tre (uno sì, due no), sempre a tempo col suo inizio.
  const startLoop = (l) => {
    const el = img(l.src, 2)
    el.style.opacity = '0'
    el.style.transition = 'opacity .35s'
    host.append(el)
    const cycle = Math.max(600, l.duration || 2880)
    const rest = Math.max(1, Math.round((l.loopDelay || 0) / cycle)) + 1
    let n = 0
    const tick = () => {
      el.style.opacity = !document.hidden && n % rest === 0 ? '1' : '0'
      n += 1
      later(tick, cycle)
    }
    if (el.complete) tick(); else el.addEventListener('load', tick, { once: true })
  }
  const run = (withIntro) => {
    clear()
    let offset = 0
    for (const l of layers) {
      if (!l.loop) {
        if (!withIntro) continue
        later(() => {
          const el = img(l.src, 1)
          host.append(el)
          later(() => el.remove(), (l.duration || 2880) + 400)
        }, l.start || 0)
      } else later(() => startLoop(l), withIntro ? (l.start || 0) : offset)
    }
  }
  run(intro)
  return { replay: () => run(true), stop: () => { alive = false; clear() } }
}
