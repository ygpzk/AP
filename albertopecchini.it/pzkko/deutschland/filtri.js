// I filtri di Deutschland (9.11.2026, «Deutschland 2»): i 16 pacchetti di sigarette inventati della macchinetta, uno per
// tag del catalogo più «JMA» (tutto), su una STECCA scorrevole alta 96 px (#filtri .pacchi: la pagina non deve mai essere
// più larga dello schermo), col nome sotto e quante foto; il pacchetto attivo è «estratto» (translateY −8 px, bordo
// giallo). Sotto, le TAPPE come scontrini (una per posto, nell'ordine del viaggio, con quante foto) e il conto «967
// Erinnerungen». Ogni pacchetto ha il suo nome swag tedesco, il suo carattere (pacchi.css, i woff2 di /fonts/) e il suo
// colore; l'immagine è /art/deutschland/pacchi/<tag>.webp (le rifà l'Agente 2) e finché non c'è, onerror mette
// segnaposto.svg: la scatola neutra col colore del pacchetto e il nome scritto sopra dall'HTML. Un tag e un posto alla
// volta → «deutschland:filtro» {tag,posto}: l'album rifà le righe, la mappa tiene il percorso di tutto il viaggio e la
// GLA va alla foto corrente della lista filtrata.

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

function pacco(p, immagini, n) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'pacco'
  b.dataset.tag = p.tag ?? 'alles'
  b.setAttribute('aria-pressed', String(p.tag === tag))
  b.title = p.tag ? `${p.nome}: solo ${p.tag} (${n})` : `${p.nome}: tutte le foto`
  b.style.setProperty('--c', p.colore)
  b.style.setProperty('--t', p.testo)
  b.style.setProperty('--f', p.font)
  const scatola = document.createElement('span'); scatola.className = 'pacco-scatola'
  const img = document.createElement('img')
  img.alt = ''
  img.decoding = 'async'
  img.width = 54; img.height = 72
  const segnaposto = () => { img.onerror = null; img.src = SEGNAPOSTO; b.classList.add('segnaposto') }
  if (immagini) { img.onerror = segnaposto; img.src = `${CARTELLA}${p.tag ?? 'alles'}.webp` } else segnaposto()
  const marca = document.createElement('b'); marca.className = 'pacco-marca'; marca.textContent = p.nome // (sul segnaposto: il nome sulla scatola)
  scatola.append(img, marca)
  const nome = document.createElement('span'); nome.className = 'pacco-nome'; nome.textContent = p.nome
  const conta = document.createElement('small'); conta.className = 'pacco-n'; conta.textContent = p.tag ? (n ? String(n) : '–') : 'alles' // («–»: i tag delle persone aspettano i nomi dei volti)
  b.append(scatola, nome, conta)
  b.addEventListener('click', () => {
    tag = p.tag === tag ? null : p.tag
    for (const x of el.querySelectorAll('.pacco')) x.setAttribute('aria-pressed', String((x.dataset.tag === 'alles' ? null : x.dataset.tag) === tag))
    manda()
  })
  return b
}

function scontrino(p, n) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'scontrino'
  b.dataset.posto = p.id
  b.setAttribute('aria-pressed', 'false')
  b.textContent = p.nome || p.nomeAuto || p.id
  if (n) { const s = document.createElement('small'); s.textContent = String(n); b.append(s) }
  b.addEventListener('click', () => {
    posto = posto === p.id ? null : p.id
    for (const x of el.querySelectorAll('.scontrino')) x.setAttribute('aria-pressed', String(x.dataset.posto === posto))
    manda()
  })
  return b
}

export async function avvia(manifesto) {
  el = document.getElementById('filtri')
  if (!el) return
  // quante foto per tag
  const perTag = new Map()
  for (const f of manifesto.foto) for (const t of f.tag ?? []) perTag.set(t, (perTag.get(t) ?? 0) + 1)
  // le immagini dei pacchetti ci sono? (una richiesta HEAD sola, su «alles»: l'Agente 2 le genera tutte insieme)
  const immagini = await esiste(`${CARTELLA}alles.webp`)
  const stecca = document.createElement('div'); stecca.className = 'pacchi'; stecca.setAttribute('role', 'group'); stecca.setAttribute('aria-label', 'i pacchetti: un tag alla volta')
  for (const p of PACCHI) stecca.append(pacco(p, immagini, perTag.get(p.tag) ?? 0))
  const tappe = document.createElement('div'); tappe.className = 'tappe'
  contaEl = document.createElement('span'); contaEl.className = 'fl-conta'; contaEl.textContent = `${manifesto.foto.length} Erinnerungen`
  const posti = document.createElement('div'); posti.className = 'posti'; posti.setAttribute('role', 'group'); posti.setAttribute('aria-label', 'le tappe: un posto alla volta')
  // i posti nell'ordine del viaggio (le tappe), poi quelli che non stanno in nessuna tappa
  const perId = new Map(manifesto.posti.map((p) => [p.id, p]))
  const ordine = []
  for (const t of manifesto.tappe) if (perId.has(t.posto) && !ordine.includes(t.posto)) ordine.push(t.posto)
  for (const p of manifesto.posti) if (!ordine.includes(p.id)) ordine.push(p.id)
  for (const id of ordine) { const p = perId.get(id); posti.append(scontrino(p, p.n)) }
  tappe.append(contaEl, posti)
  el.replaceChildren(stecca, tappe)
  ascolta('conta', ({ n, totale }) => { contaEl.textContent = n === totale ? `${n} Erinnerungen` : `${n} von ${totale}` })
}
