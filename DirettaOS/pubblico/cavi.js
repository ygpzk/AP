// Diretta OS · «Zona cavi»: un pezzo che copre i cavi dietro ai monitor con una macchia scura e sfocata.
// Non è un rettangolo nero: prende dalla foto della stanza (la foto di inizio, la stessa dei muri) la parte che ha
// sotto e la ridisegna sfocata e molto più scura, con i bordi morbidi. Così il cavo sparisce ma il colore del muro,
// del legno e della luce attorno restano quelli veri. Si sposta e si ingrandisce come gli altri pezzi; sta fuori dai
// muri (MAI_SUL_MURO) perché è un ritocco 2D dell'inquadratura, non una cosa appesa alla parete.

const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }

export const CAVI_NOMI = { cavi: 'Zona cavi' }
export const CAVI_POSTI = { '05': { cavi: [0, 760, 1] }, '10': { cavi: [0, 760, 1] } }

export function creaCavi() {
  const el = $(`<div class="cavi"><canvas width="480" height="280"></canvas></div>`)
  const tela = el.querySelector('canvas')
  const g = tela.getContext('2d')
  let L = '', v = -1, img = null, pronta = false, chiesto = false, disegnata = ''

  function carica(s) {
    const l = s?.lente ?? '10', f = s?.foto?.[l] ?? 0
    if (l === L && f === v) return
    L = l; v = f; img = null; pronta = false
    if (!f) return // (non c'è ancora una foto della stanza: si resta trasparenti)
    const im = new Image()
    im.onload = () => { if (L === l && v === f) { img = im; pronta = true; disegna(true) } }
    im.onerror = () => { pronta = false }
    im.src = `/rif/${l}.jpg?v=${f}`
  }

  function disegna(forza = false) {
    chiesto = false
    if (!pronta || !img) return
    const b = el.getBoundingClientRect()
    if (b.width < 2 || b.height < 2) return
    const k = `${Math.round(b.left)}:${Math.round(b.top)}:${Math.round(b.width)}:${Math.round(b.height)}`
    if (!forza && k === disegnata) return
    disegnata = k
    // la tela è più piccola del pezzo (è tutto sfocato): 480 px bastano e non pesa
    const w = Math.max(2, Math.min(640, Math.round(b.width / 2)))
    const h = Math.max(2, Math.round(w * b.height / Math.max(1, b.width)))
    if (tela.width !== w) tela.width = w
    if (tela.height !== h) tela.height = h
    // il ritaglio della foto della stanza sotto al pezzo, con un margine: se il pezzo è al bordo non tira dentro il vuoto
    const pad = 14
    const sx = Math.max(0, Math.min(img.naturalWidth - 2, b.left - pad))
    const sy = Math.max(0, Math.min(img.naturalHeight - 2, b.top - pad))
    const sw = Math.max(2, Math.min(img.naturalWidth - sx, b.width + pad * 2))
    const sh = Math.max(2, Math.min(img.naturalHeight - sy, b.height + pad * 2))
    g.clearRect(0, 0, w, h)
    try {
      g.save()
      g.filter = 'blur(12px) brightness(.26) saturate(.55) contrast(.95)'
      g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
      g.restore()
      // un velo nero in più: i cavi restano un'ombra, non un disegno
      g.fillStyle = 'rgba(3, 3, 6, .42)'
      g.fillRect(0, 0, w, h)
    } catch { /* (foto a metà o canvas chiuso: si riprova al prossimo giro) */ }
  }

  function chiedi() {
    if (chiesto) return
    chiesto = true
    requestAnimationFrame(() => disegna())
  }

  // le entrate/uscite dei pezzi hanno una transizione: quando finisce, il riquadro vero è un altro
  el.addEventListener('transitionend', chiedi)

  return {
    el,
    aggiorna(s) { carica(s); chiedi(); setTimeout(chiedi, 800) },
    muovi() { chiedi() }, // (mentre lo trascini in regia o cambia la lente)
    disegna: () => disegna(true),
  }
}
