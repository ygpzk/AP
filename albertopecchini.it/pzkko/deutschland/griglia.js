// La griglia di Deutschland (9.11.2026). Alberto: «4 colonne di foto e 5 righe sempre visibili»: #griglia è una griglia
// CSS a 4 colonne con le righe alte un quinto (galleria.css), che scorre dentro di sé; le celle sono bottoni col colore
// medio e la sfocatura della foto già come sfondo (dal manifesto: niente celle grigie), la miniatura arriva pigra e si
// dissolve sopra (dal visore di agosto, Shooting.tsx: Cella). Lo scorrimento muove la mappa senza rAF continuo: a ogni
// evento scroll (passivo) UN requestAnimationFrame, che legge la riga a un terzo dello schermo e dice «deutschland:foto»
// {i,id}; a pagina ferma non gira niente (memoria pzkko-leggero-2d). Il filtro («deutschland:filtro» {tag,posto}) non
// rifà le celle: nasconde quelle fuori (hidden) e la griglia si ricompatta da sola; «deutschland:vai» {id} (un posto
// cliccato sulla mappa) porta alla prima foto di quel posto. Il click su una cella → «deutschland:apri» {id} (visore.js);
// la pressione lunga la gestisce condividi.js sopra di noi (cattura).

import { indirizzo, evento, ascolta } from './comune.js'

const GAP = 3 // lo stesso di galleria.css (#griglia gap)
const EAGER = 20 // le prime miniature non pigre: sono già a schermo
let el, foto = [], celle = [], visibili = [], posti = new Map(), corrente = -1, raf = 0, evidenza = 0

/** Le foto adesso in griglia (filtrate), nell'ordine in cui si vedono. */
export const lista = () => visibili.map((i) => foto[i])

const durata = (s) => { s = Math.round(+s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

function cella(f, i) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'cella' + (f.tipo === 'video' ? ' video' : '')
  b.dataset.id = f.id
  b.dataset.i = i
  b.style.backgroundColor = f.col || '#1a1a1a'
  if (f.blur) b.style.backgroundImage = `url("${f.blur}")`
  const posto = posti.get(f.posto)
  b.setAttribute('aria-label', `${f.tipo === 'video' ? 'video' : 'foto'} delle ${f.ora ?? '?'}${f.tStimato ? ' circa' : ''}${posto ? ` · ${posto.nome}` : ''}`)
  const img = document.createElement('img')
  img.alt = ''
  img.decoding = 'async'
  img.crossOrigin = 'anonymous' // (CORS anche per le immagini: così la cache del browser vale pure per il fetch di condividi.js)
  img.loading = i < EAGER ? 'eager' : 'lazy'
  img.onload = () => b.classList.add('carica')
  img.onerror = () => b.classList.add('rotta')
  const mini = f.m || f.p
  if (mini) img.src = indirizzo(f.m ? 'm' : 'p', mini)
  if (img.complete && img.naturalWidth) b.classList.add('carica')
  b.append(img)
  if (f.tStimato) { const s = document.createElement('i'); s.className = 'stima'; s.title = 'ora stimata'; b.append(s) }
  if (f.tipo === 'video') { const p = document.createElement('span'); p.className = 'play'; p.textContent = durata(f.durata); b.append(p) }
  const ora = document.createElement('span'); ora.className = 'ora'; ora.textContent = f.ora ?? ''; b.append(ora)
  return b
}

/** La riga a un terzo dello schermo → la foto corrente → la mappa. */
function aggiorna() {
  raf = 0
  if (!el || !visibili.length) return
  const h = el.clientHeight
  const riga = (h - 4 * GAP) / 5 + GAP
  const y = el.scrollTop + h / 3
  const k = Math.min(visibili.length - 1, Math.max(0, Math.floor(y / riga) * 4))
  const i = visibili[k]
  if (i !== corrente) { corrente = i; evento('foto', { i, id: foto[i].id }) }
}

function applica({ tag = null, posto = null } = {}) {
  visibili = []
  foto.forEach((f, i) => {
    const ok = (!tag || (f.tag ?? []).includes(tag)) && (!posto || f.posto === posto)
    celle[i].hidden = !ok
    if (ok) visibili.push(i)
  })
  el.scrollTop = 0
  corrente = -1
  evento('conta', { n: visibili.length, totale: foto.length })
  aggiorna()
}

function vai({ id }) {
  const k = visibili.find((i) => foto[i].posto === id)
  if (k == null) return
  const c = celle[k]
  c.scrollIntoView({ behavior: 'smooth', block: 'start' })
  c.classList.add('evidenzia')
  clearTimeout(evidenza)
  evidenza = setTimeout(() => c.classList.remove('evidenzia'), 1200)
}

export function avvia(manifesto) {
  el = document.getElementById('griglia')
  if (!el) return
  foto = manifesto.foto
  posti = new Map(manifesto.posti.map((p) => [p.id, p]))
  const frag = document.createDocumentFragment()
  celle = foto.map((f, i) => { const c = cella(f, i); frag.append(c); return c })
  el.replaceChildren(frag)
  el.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(aggiorna) }, { passive: true })
  el.addEventListener('click', (e) => { const c = e.target.closest('.cella'); if (c) evento('apri', { id: c.dataset.id }) })
  // la finestra che cambia misura (telefono girato) sposta la riga a un terzo
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(aggiorna) }, { passive: true })
  ascolta('filtro', applica)
  ascolta('vai', vai)
  applica()
}
