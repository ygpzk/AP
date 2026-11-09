// I filtri di Deutschland (9.11.2026): i 16 pacchetti di sigarette inventati della macchinetta, uno per tag del catalogo
// più «alles» (tutto), in fila dentro #filtri a scorrere in orizzontale (la pagina non deve mai essere più larga dello
// schermo), e sotto lo scontrino coi posti (le tappe del viaggio, filtro per posto), il contatore «n foto» e il tasto
// «scegli» (condividi.js). Ogni pacchetto ha il suo nome swag tedesco, il suo carattere (pacchi.css, i woff2 di /fonts/)
// e il suo colore, tutti diversi; l'immagine è /art/deutschland/pacchi/<tag>.webp (le genera l'Agente 2 per ultime) e
// finché non c'è, onerror mette segnaposto.svg: la scatola neutra, col colore del bottone sotto e il nome scritto sopra
// dall'HTML. Un tag e un posto alla volta → «deutschland:filtro» {tag,posto}: la griglia rifà la lista, la mappa tiene il
// percorso di tutto il viaggio e la macchinina va alla foto corrente della lista filtrata.

import { evento, ascolta, esiste } from './comune.js'

/** I 16 pacchetti: tag (null = tutto), nome sul pacchetto, carattere (pacchi.css), colore del pacchetto, colore della scritta. */
export const PACCHI = [
  { tag: null, nome: 'JMA', font: '"Anton", Impact, sans-serif', colore: '#ffd400', testo: '#111' },
  { tag: 'pekko', nome: 'luckypzkko', font: '"Abril Fatface", serif', colore: '#d0021b', testo: '#fff' },
  { tag: 'mikas', nome: 'Mikas\'s Smoke', font: '"Permanent Marker", cursive', colore: '#39a0ed', testo: '#111' },
  { tag: 'jonny', nome: 'Jonny\'s Tobacco', font: '"Special Elite", monospace', colore: '#2e8b57', testo: '#fff' },
  { tag: 'jella', nome: 'Jella Leicht', font: '"Caveat", cursive', colore: '#e75480', testo: '#fff' },
  { tag: 'cibo', nome: 'Brezn Gold', font: '"Alfa Slab One", serif', colore: '#e08a1e', testo: '#111' },
  { tag: 'paesaggi', nome: 'Alpenblick', font: '"Archivo Black", sans-serif', colore: '#7fb3d5', testo: '#111' },
  { tag: 'natura', nome: 'Schwarzwald', font: '"Homemade Apple", cursive', colore: '#1f5f2a', testo: '#fff' },
  { tag: 'strada', nome: 'Autobahn 100', font: '"Rubik Mono One", monospace', colore: '#8a8f98', testo: '#111' },
  { tag: 'auto', nome: 'GLA Grau', font: '"Bungee", sans-serif', colore: '#3c3f44', testo: '#fff' },
  { tag: 'screenshot', nome: 'Bildschirm', font: '"Fake Receipt", monospace', colore: '#b8c0cc', testo: '#111' },
  { tag: 'hotel', nome: 'Nachtportier', font: '"Nothing You Could Do", cursive', colore: '#5b2c83', testo: '#fff' },
  { tag: 'mezzi', nome: 'S-Bahn Blau', font: '"Black Ops One", sans-serif', colore: '#0a3d91', testo: '#fff' },
  { tag: 'alcool', nome: 'Jäger Hirsch 56', font: '"Shrikhand", serif', colore: '#5c3a21', testo: '#ffd400' },
  { tag: 'foto', nome: 'Südkurve', font: '"Rock Salt", cursive', colore: '#7a0012', testo: '#fff' },
  { tag: 'video', nome: 'Cannstatter', font: '"Reenie Beanie", cursive', colore: '#ffffff', testo: '#e2001a' },
]
const CARTELLA = '/art/deutschland/pacchi/'
const SEGNAPOSTO = `${CARTELLA}segnaposto.svg`

let el, tag = null, posto = null, contaEl

const manda = () => evento('filtro', { tag, posto })

/** Il nome deve stare nel pacchetto senza spezzare una parola: si rimpicciolisce finché ci sta (con i caratteri veri,
 *  quando arrivano: document.fonts.ready). */
function adatta() {
  for (const n of el.querySelectorAll('.pacco .nome')) {
    const b = n.firstElementChild
    if (!b) continue
    let s = 11
    n.style.fontSize = ''
    const largo = n.clientWidth - 8
    while (s > 7 && b.scrollWidth > largo) { s -= 0.5; n.style.fontSize = `${s}px` }
  }
}

function pacco(p, immagini) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'pacco'
  b.dataset.tag = p.tag ?? 'alles'
  b.setAttribute('aria-pressed', String(p.tag === tag))
  b.title = p.tag ? `${p.nome}: solo ${p.tag}` : `${p.nome}: tutte le foto`
  b.style.setProperty('--c', p.colore)
  b.style.setProperty('--t', p.testo)
  b.style.setProperty('--f', p.font)
  const img = document.createElement('img')
  img.alt = ''
  img.decoding = 'async'
  const segnaposto = () => { img.onerror = null; img.src = SEGNAPOSTO; b.classList.add('segnaposto') }
  if (immagini) { img.onerror = segnaposto; img.src = `${CARTELLA}${p.tag ?? 'alles'}.webp` } else segnaposto()
  const nome = document.createElement('span')
  nome.className = 'nome'
  const testo = document.createElement('b'); testo.textContent = p.nome
  nome.append(testo)
  b.append(img, nome)
  b.addEventListener('click', () => {
    tag = p.tag === tag ? null : p.tag
    for (const x of el.querySelectorAll('.pacco')) x.setAttribute('aria-pressed', String((x.dataset.tag === 'alles' ? null : x.dataset.tag) === tag))
    manda()
  })
  return b
}

function chip(p, n) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'posto'
  b.dataset.posto = p.id
  b.setAttribute('aria-pressed', 'false')
  b.textContent = p.nome || p.nomeAuto || p.id
  if (n) { const s = document.createElement('small'); s.textContent = ` ${n}`; b.append(s) }
  b.addEventListener('click', () => {
    posto = posto === p.id ? null : p.id
    for (const x of el.querySelectorAll('.posto')) x.setAttribute('aria-pressed', String(x.dataset.posto === posto))
    manda()
  })
  return b
}

export async function avvia(manifesto) {
  el = document.getElementById('filtri')
  if (!el) return
  // le immagini dei pacchetti ci sono? (una richiesta HEAD sola, su «alles»: l'Agente 2 le genera tutte insieme)
  const immagini = await esiste(`${CARTELLA}alles.webp`)
  const pacchi = document.createElement('div'); pacchi.className = 'pacchi'; pacchi.setAttribute('role', 'group'); pacchi.setAttribute('aria-label', 'i pacchetti: un tag alla volta')
  for (const p of PACCHI) pacchi.append(pacco(p, immagini))
  const scontrino = document.createElement('div'); scontrino.className = 'scontrino'
  contaEl = document.createElement('span'); contaEl.className = 'conta'; contaEl.textContent = `${manifesto.foto.length} foto`
  const scegli = document.createElement('button'); scegli.type = 'button'; scegli.className = 'scegli'; scegli.textContent = 'scegli'; scegli.title = 'scegli più foto da salvare sul rullino (o tieni premuta una foto)'
  scegli.addEventListener('click', () => evento('scegli'))
  const posti = document.createElement('div'); posti.className = 'posti'; posti.setAttribute('role', 'group'); posti.setAttribute('aria-label', 'i posti: una tappa alla volta')
  // i posti nell'ordine del viaggio (le tappe), poi quelli che non stanno in nessuna tappa
  const perId = new Map(manifesto.posti.map((p) => [p.id, p]))
  const ordine = []
  for (const t of manifesto.tappe) if (perId.has(t.posto) && !ordine.includes(t.posto)) ordine.push(t.posto)
  for (const p of manifesto.posti) if (!ordine.includes(p.id)) ordine.push(p.id)
  for (const id of ordine) { const p = perId.get(id); posti.append(chip(p, p.n)) }
  scontrino.append(contaEl, scegli, posti)
  el.replaceChildren(pacchi, scontrino)
  ascolta('conta', ({ n, totale }) => { contaEl.textContent = n === totale ? `${n} foto` : `${n} di ${totale}` })
  adatta()
  document.fonts?.ready.then(adatta)
  addEventListener('resize', adatta, { passive: true })
}
