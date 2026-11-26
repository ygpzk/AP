// pzkko.it — la zona «da provare»: la GRAFICA che ha bisogno di mani (Claude, 26.11.2026).
// Il comportamento è di DeepSeek (provare.js, contratto in design/da-provare-ux.md): lui decide cosa succede e quando.
// Questo modulo non decide niente: ascolta i suoi eventi (provare:monta, provare:esce, provare:scambio, provare:timbro)
// e mette sul muro quello che il CSS da solo non può fare:
//   · carica lo stile (provare.css) e solo dopo accende la zona (data-arte), così non si vede mai mezza vestita;
//   · l'entrata parte quando la zona arriva sullo schermo (attesa → entra → 1), una volta per montaggio;
//   · appende la tessera col nastro e ci lega la penna rossa, che prende il colpo quando il timbro batte;
//   · misura la strada dal volantino appena usato al suo buco nella tessera (--tx/--ty), per farcelo volare dentro;
//   · lascia sul muro il pezzetto di carta sotto il nastro quando un volantino viene strappato;
//   · fa tremare i vicini quando quello nuovo viene sbattuto sul muro;
//   · lega il volantino sotto il mouse al suo buco nella tessera, e il buco al suo volantino;
//   · fa piovere le fiches quando la tessera si riempie (data-festa).
// Se questo file o il suo stile mancano, la zona di DeepSeek funziona lo stesso, ferma ma intera.

const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches
const FICHES = ['f1', 'f5', 'f25', 'f100', 'f500']
const vestite = new WeakSet()
let stile = null
/** Lo stile, una volta sola: chi aspetta parte quando è arrivato (o dopo due secondi e mezzo, comunque). */
function conStile() {
  return stile ??= new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = new URL('./provare.css', import.meta.url).pathname
    l.onload = l.onerror = () => ok()
    document.head.appendChild(l)
    setTimeout(ok, 2500)
  })
}
const ms = (el, nome, riserva) => {
  const v = getComputedStyle(el).getPropertyValue(nome).trim(), n = parseFloat(v)
  return Number.isFinite(n) ? (/m?s$/.test(v) && !v.endsWith('ms') ? n * 1000 : n) : riserva
}
const buco = (zona, chiave) => (chiave ? zona.querySelector(`.tessera__buchi i[data-app="${CSS.escape(chiave)}"]`) : null)
const sulMuro = (zona, chiave) => (chiave ? zona.querySelector(`.annunci__fila .fly[data-app="${CSS.escape(chiave)}"]`) : null)

/** Veste la zona appena montata: la tessera appesa con la penna, i legami col mouse, l'entrata quando arriva in vista. */
function vesti(zona) {
  if (!zona?.isConnected) return
  const t = zona.querySelector('.annunci__h .tessera')
  if (t && !t.closest('.pza-porta')) {
    // il motore ridisegna la tessera con replaceWith: resta dentro la sua cornice, e la penna non si stacca
    const porta = document.createElement('span')
    porta.className = 'pza-porta'
    t.replaceWith(porta)
    porta.append(t, Object.assign(document.createElement('i'), { className: 'pza-penna', ariaHidden: 'true' }))
  }
  if (!vestite.has(zona)) {
    vestite.add(zona)
    // solo col mouse: col dito non c'è un «via da qui», e il buco resterebbe acceso
    zona.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') qui(zona, e.target.closest?.('.annunci__fila .fly, .tessera__buchi i')) })
    zona.addEventListener('pointerleave', () => qui(zona, null))
    new MutationObserver(() => { if (zona.dataset.festa === '1') festa(zona) }).observe(zona, { attributes: true, attributeFilter: ['data-festa'] })
  }
  if (zona.dataset.arte) return
  if (ridotto) { zona.dataset.arte = '1'; return }
  zona.dataset.arte = 'attesa'
  const parti = () => {
    if (zona.dataset.arte !== 'attesa') return
    zona.dataset.arte = 'entra'
    setTimeout(() => { if (zona.dataset.arte === 'entra') zona.dataset.arte = '1' }, 2000)
  }
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); parti() } }, { threshold: 0.3 })
  io.observe(zona)
  // se l'osservatore non risponde (scheda in secondo piano), niente resta nascosto
  setTimeout(() => { if (document.visibilityState === 'hidden') { io.disconnect(); zona.dataset.arte = '1' } }, 4000)
}

/** Il mouse su un volantino accende il suo buco; il mouse su un buco fa venire avanti il suo volantino. */
function qui(zona, el) {
  for (const x of zona.querySelectorAll('.is-qui')) x.classList.remove('is-qui')
  if (!el?.dataset.app) return
  const altro = el.matches('.fly') ? buco(zona, el.dataset.app) : sulMuro(zona, el.dataset.app)
  altro?.classList.add('is-qui')
}

/** Un volantino comincia a uscire. */
function esce(e) {
  const zona = e.target.closest?.('#annunci'), { el, via, motivo } = e.detail || {}
  if (!zona || !el || ridotto) return
  if (motivo === 'usata') {
    // la strada fino al buco della tessera: dal punto in cui è appeso (in alto al centro) al centro del buco
    const b = buco(zona, via)
    if (!b) return
    const a = el.getBoundingClientRect(), r = b.getBoundingClientRect()
    el.style.setProperty('--tx', `${Math.round(r.x + r.width / 2 - (a.x + a.width / 2))}px`)
    el.style.setProperty('--ty', `${Math.round(r.y + r.height / 2 - a.y)}px`)
    return
  }
  if (motivo === 'mano') return
  // strappato dal muro: sotto il nastro resta un pezzetto di carta, finché non arriva quello nuovo a coprirlo
  const fila = el.parentElement
  if (!fila) return
  for (const v of fila.querySelectorAll(`.pza-resto[data-slot="${el.dataset.slot}"]`)) v.remove()
  const resto = Object.assign(document.createElement('i'), { className: 'pza-resto', ariaHidden: 'true' })
  resto.dataset.slot = el.dataset.slot
  resto.style.left = `${el.offsetLeft + el.offsetWidth / 2}px`
  resto.style.top = `${el.offsetTop}px`
  resto.style.setProperty('--n', `${el.dataset.slot % 2 ? 5 : -5}deg`)
  fila.prepend(resto)
  setTimeout(() => resto.remove(), 6000) // comunque
}

/** Il volantino nuovo è sul muro e sta entrando: il resto sparisce sotto di lui, i vicini sentono il colpo. */
function scambio(e) {
  const zona = e.target.closest?.('#annunci'), { slot, el, motivo } = e.detail || {}
  if (!zona || ridotto) return
  const d = ms(zona, '--pz-scambio', 560)
  const fila = zona.querySelector('.annunci__fila')
  setTimeout(() => {
    for (const v of zona.querySelectorAll(`.pza-resto[data-slot="${slot}"]`)) { v.classList.add('is-via'); setTimeout(() => v.remove(), 220) }
    if (motivo === 'mano' || !fila) return
    for (const f of fila.querySelectorAll('.fly[data-stato="pronto"]')) {
      if (f === el || Math.abs(f.dataset.slot - slot) !== 1) continue
      f.classList.add('is-trema')
      setTimeout(() => f.classList.remove('is-trema'), 340)
    }
  }, d * 0.48)
}

/** Il timbro batte sulla tessera (dopo l'attesa): la penna appesa prende il colpo. */
function timbro(e) {
  const zona = e.target.closest?.('#annunci')
  if (!zona || ridotto) return
  setTimeout(() => {
    const p = zona.querySelector('.pza-penna')
    if (!p) return
    p.classList.remove('is-colpo')
    void p.offsetWidth
    p.classList.add('is-colpo')
    setTimeout(() => p.classList.remove('is-colpo'), 1600)
  }, (Number(e.detail?.ritardo) || 0) + 120)
}

/** La tessera è piena adesso: piovono le fiches, una volta. */
function festa(zona) {
  if (ridotto || zona.querySelector('.pza-pioggia')) return
  const box = Object.assign(document.createElement('div'), { className: 'pza-pioggia', ariaHidden: 'true' })
  const alto = zona.offsetHeight
  for (let i = 0; i < 22; i++) {
    const f = document.createElement('i'), a = Math.random
    f.style.cssText = `--f:url(/art/fiches/${FICHES[i % FICHES.length]}.webp);--x:${(a() * 96).toFixed(1)}%;--d:${Math.round(30 + a() * 26)}px;--t:${(1.3 + a() * 1.1).toFixed(2)}s;--r:${(a() * 1.6).toFixed(2)}s;--y:${Math.round(alto + 60 + a() * 60)}px;--dx:${Math.round(a() * 80 - 40)}px;--g:${Math.round(a() * 900 - 450)}deg`
    box.appendChild(f)
  }
  zona.appendChild(box)
  setTimeout(() => box.remove(), 4600)
}

document.addEventListener('provare:monta', (e) => { const z = e.detail?.zone || e.target; conStile().then(() => vesti(z)) })
document.addEventListener('provare:esce', esce)
document.addEventListener('provare:scambio', scambio)
document.addEventListener('provare:timbro', timbro)
// se la zona era già montata quando questo modulo è arrivato
const gia = document.querySelector('#annunci[data-provare]')
if (gia) conStile().then(() => vesti(gia))
