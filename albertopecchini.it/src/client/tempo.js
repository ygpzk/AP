// La macchina del tempo (/tempo/): le pagine sono statiche e ogni cattura ha il suo
// indirizzo (/tempo/<dominio>/<AAAA-MM-GG>/), quindi qui resta poco: il selettore dei siti,
// i tasti ← → per la cattura prima e dopo, l'anteprima sopra le barre dell'istogramma (la
// foto piccola si scarica solo passandoci sopra) e i vecchi indirizzi (#v=<sha>,
// #s=<sito>&v=<sha>, fino al 3.11.2026 sera) che portano alla pagina giusta.

import { $, clamp } from './utils.js'

export function initTempo() {
  const root = $('[data-tempo]')
  if (!root) return

  const vecchi = $('[data-tm-vecchi]', root)
  if (vecchi && /[#&](v|s)=/.test(location.hash)) {
    const h = new URLSearchParams(location.hash.slice(1))
    const dove = JSON.parse(vecchi.textContent)[h.get('s') || 'ap']?.[(h.get('v') || '').slice(0, 7)]
    if (dove) return location.replace(dove)
  }

  for (const sito of root.querySelectorAll('[data-tm-sito]')) sito.addEventListener('change', () => sito.value && (location.href = sito.value))

  const prev = $('[data-tm-prev]', root)
  const next = $('[data-tm-next]', root)
  if (prev || next) {
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
      const a = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : null
      if (!a) return
      e.preventDefault()
      location.href = a.href
    })
  }

  // l'anteprima sopra la barra, come il calendario della Wayback Machine
  const spark = $('[data-tm-spark]', root)
  const tip = $('[data-tm-tip]', root)
  if (!spark || !tip) return
  const img = $('[data-tm-tip-img]', tip)
  const mostra = (c) => {
    img.hidden = !c.dataset.t
    if (c.dataset.t) img.src = c.dataset.t
    $('[data-tm-tip-date]', tip).textContent = c.dataset.d || ''
    $('[data-tm-tip-n]', tip).textContent = (c.dataset.n || '') + (c.dataset.t ? '' : ' · senza foto')
    tip.hidden = false
    const box = spark.getBoundingClientRect()
    const r = c.getBoundingClientRect()
    tip.style.left = `${clamp(r.left + r.width / 2 - box.left - tip.offsetWidth / 2, 0, box.width - tip.offsetWidth)}px`
  }
  const nascondi = () => (tip.hidden = true)
  spark.addEventListener('pointerover', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c && e.pointerType === 'mouse') mostra(c)
  })
  spark.addEventListener('pointerleave', nascondi)
  spark.addEventListener('focusin', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c) mostra(c)
  })
  spark.addEventListener('focusout', nascondi)
}
