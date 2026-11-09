// La macchinetta delle sigarette sul muro (9.11.2026, Alberto: «una vecchia macchinetta tedesca delle sigarette a muro
// con uno schermo che mostra miniature pixelate delle tappe come fossero le marche, luce propria, rilievo 2D, nel primo
// schermo, centrata, un po' sotto la metà»). Il tasto #automat-muro in index.html (dentro .parete, fra <!-- automat --> e
// <!-- /automat -->) lo veste questo modulo, come telefono/zero/muro.js veste il cercapersone: toglie `hidden` allo
// schermo e alla luce, proietta lo schermo (.am-schermo, lo sprite delle tappe) sui quattro angoli di muro-dati.js con la
// stessa omografia dello zero, e lo rifà quando il tasto cambia misura. Nessuna animazione: la luce è un alone fermo, e a
// pagina ferma qui non gira niente (memoria pzkko-leggero-2d).
// Al tocco: lo scatto meccanico (suono/interfaccia.js, tasto('meccanico')), poi la vernice cola giù (vernice.js, copri)
// e si va a /deutschland/. La vernice si scalda (un fetch a bassa priorità) la prima volta che il puntatore, il dito o il
// fuoco arrivano sul tasto: non prima (niente scaricamenti senza un gesto di chi guarda).
import dati from './muro-dati.js'
import { omografia } from '/telefono/zero/muro.js'

export const PAGINA = '/deutschland/'
export const VERNICE = '/deutschland/vernice.js'

/** Mette `el` (dentro `contenitore`, position:absolute) sul rettangolo che contiene i quattro `angoli` (frazioni del
 *  contenitore, da in alto a sinistra in senso orario) e lo porta sugli angoli con la matrix3d; lo rifà quando il
 *  contenitore cambia misura. Torna la funzione che lo rifà. (La usa anche accesso.js per il form nella pagina.) */
export function proietta(contenitore, el, angoli) {
  const xs = angoli.map((p) => p[0]), ys = angoli.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  Object.assign(el.style, { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%`, transformOrigin: '0 0' })
  const metti = () => {
    const W = contenitore.offsetWidth, H = contenitore.offsetHeight
    if (!W || !H) return
    el.style.transform = omografia((x1 - x0) * W, (y1 - y0) * H, angoli.map(([x, y]) => [(x - x0) * W, (y - y0) * H]))
  }
  metti()
  new ResizeObserver(metti).observe(contenitore)
  return metti
}

/** Veste il tasto da macchinetta. */
export function veste(tasto) {
  if (!tasto || tasto.dataset.vestito) return
  tasto.dataset.vestito = '1'
  tasto.classList.add('automat')
  if (!document.querySelector('link[data-automat]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/deutschland/muro.css'; l.setAttribute('data-automat', ''); document.head.appendChild(l) }
  const img = tasto.querySelector('img')
  if (img) { img.width = dati.w; img.height = dati.h }
  const schermo = tasto.querySelector('.am-schermo'), luce = tasto.querySelector('.am-luce')
  if (schermo) { schermo.hidden = false; proietta(tasto, schermo, dati.schermo) }
  if (luce) {
    // l'alone sta intorno allo schermo, più largo di un quinto per lato
    const xs = dati.schermo.map((p) => p[0]), ys = dati.schermo.map((p) => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), dx = (x1 - x0) * 0.22, dy = (y1 - y0) * 0.3
    Object.assign(luce.style, { left: `${(x0 - dx) * 100}%`, top: `${(y0 - dy) * 100}%`, width: `${(x1 - x0 + 2 * dx) * 100}%`, height: `${(y1 - y0 + 2 * dy) * 100}%` })
    luce.hidden = false
  }
  tasto.classList.add('vestito')
  // la vernice si scalda al primo gesto verso il tasto (il puntatore sopra, il dito, il fuoco), una volta sola
  const scalda = () => { fetch(VERNICE, { priority: 'low' }).catch(() => {}) }
  for (const e of ['pointerenter', 'touchstart', 'focus']) tasto.addEventListener(e, scalda, { once: true, passive: true })
  let colando = false
  tasto.addEventListener('click', () => {
    if (colando) return
    colando = true
    import('/suono/interfaccia.js').then((s) => s.tasto?.('meccanico')).catch(() => {})
    import(VERNICE).then((v) => v.copri(PAGINA)).catch((e) => { colando = false; console.warn('la vernice non è colata, si va dritti', e); location.href = PAGINA })
    // (se la pagina resta qui, es. la cornice della musica si è chiusa, si può ricliccare: vernice.js toglie lo strato e
    // qui si riapre il tasto)
    document.addEventListener('pzkko-vernice-via', () => { colando = false }, { once: true })
  })
}
