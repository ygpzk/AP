// Diretta OS · Giugnoh's Cast: i due pezzi della diretta, come quelli del pc stanno qui e pezzi.js li aggiunge agli
// altri (CAST, CAST_NOMI, CAST_POSTI, creaCast, castArriva).
// - /o/argomento: l'argomento a caso. Entra la scritta, il rullo gira forte e frena (le frecce scattano a ogni voce che
//   passa), si ferma con lo scatto sulla voce scelta, lampo, coriandoli, e l'argomento resta lì, grande, col tempo che
//   ci stai sopra. L'estrazione la fa il server: qui si calcola solo dov'è il rullo adesso (cast.js), così una pagina
//   ricaricata a metà è allo stesso punto delle altre.
// - /o/fine: la fine della puntata. Le strisce passano davanti a tutto lo schermo, poi «Giugnoh's Cast» lettera per
//   lettera, i saluti, quanto è durata, gli argomenti che scorrono come i titoli di coda, coriandoli che cadono.
// Stile sospeso come gli altri pezzi: niente riquadri, contorno scuro. Si muove con transform e opacity; il giro di
// disegno (giro.js) lavora solo mentre il rullo gira o i numeri salgono.

import '/cast.js'
import { ogniGiro } from '/giro.js'

const C = window.Cast
export const CAST = ['argomento', 'fine']
export const CAST_NOMI = { argomento: 'Argomento a caso', fine: 'Fine puntata' }
export const CAST_DICE = { argomento: 'Giugnoh’s Cast: il rullo che estrae l’argomento, poi resta lì col tempo che ci stai sopra', fine: 'Giugnoh’s Cast: i saluti di fine puntata, al centro, coi titoli di coda' }
// (la fine sta al centro dello schermo finché non la sposti; il suo posto qui conta solo per la grandezza)
export const CAST_POSTI = {
  '05': { argomento: [440, 250, .95], fine: [0, 0, 1] },
  '10': { argomento: [600, 110, .95], fine: [0, 0, 1] },
}

const scena = document.getElementById('scena')
if (scena && !document.querySelector('link[href="/cast.css"]')) document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="/cast.css">')

const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }
const P = C.pulito
// (scrive uno stile o un testo solo se è cambiato)
function metti(e, k, v) { const c = e.__s ?? (e.__s = {}); if (c[k] !== v) { c[k] = v; e.style[k] = v } }
const scrivi = (e, t) => { if (e && e.textContent !== t) e.textContent = t }
const acceso = (e) => !!e?.closest('.pezzo')?.classList.contains('su') && !scena.classList.contains('dal-vivo')

let pc = null // stato.podcast
const el = {}

export function creaCast(p) {
  if (p === 'argomento') {
    el.argomento = $(`<div class="cast">
      <div class="ca-testa"><span class="ca-logo">Giugnoh's Cast</span><span class="app ca-ep">EP. 1</span></div>
      <div class="ca-etichetta"><span class="ca-gira">argomento a caso</span><span class="ca-n">argomento 1</span></div>
      <div class="ca-corpo">
        <i class="ca-banda"></i>
        <div class="ca-rullo"><div class="ca-nastro ca-scia2"></div><div class="ca-nastro ca-scia1"></div><div class="ca-nastro ca-vero"></div></div>
        <i class="ca-freccia sx"></i><i class="ca-freccia dx"></i>
        <i class="ca-lampo"></i>
        <div class="ca-titolo"><span></span></div>
        <div class="ca-cor"></div>
      </div>
      <div class="ca-sotto"><i class="ca-rec"></i><span class="ca-da">da 0:00</span></div>
    </div>`)
    return el.argomento
  }
  el.fine = $(`<div class="fine-p">
    <div class="fi-logo">${[...'Giugnoh\'s Cast'].map((c, i) => c === ' ' ? '<i class="sp"></i>' : `<span style="--i:${i}">${P(c)}</span>`).join('')}</div>
    <div class="fi-grazie">grazie a tutti, alla prossima puntata!</div>
    <div class="fi-numeri"><div><b data-f="durata">0:00</b><small>in onda</small></div><div><b data-f="n">0</b><small>argomenti</small></div><div><b data-f="p">1</b><small>puntata</small></div></div>
    <div class="fi-titoli"><div class="fi-scorre"></div></div>
    <div class="fi-pioggia">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(C.caso(i) * 100).toFixed(1)}%;background:${C.COLORI[i % C.COLORI.length]};animation-delay:${(-C.caso(i + 40) * 4).toFixed(2)}s;animation-duration:${(3.2 + C.caso(i + 9) * 2.2).toFixed(2)}s;--r:${Math.round(C.caso(i + 3) * 720 - 360)}deg"></i>`).join('')}</div>
  </div>`)
  return el.fine
}

// ── l'argomento ──
const RIGA = 70 // px fra una voce e l'altra del rullo
let rulloDi = 0, presoDi = 0
function argomentoRullo(a) {
  const box = el.argomento, nastri = box.querySelectorAll('.ca-nastro')
  const h = a.rullo.map((t, i) => `<div class="ca-voce${i === a.indice ? ' scelta' : ''}" style="top:${i * RIGA}px"><span>${P(t)}</span></div>`).join('')
  for (const n of nastri) n.innerHTML = h
  const t = box.querySelector('.ca-titolo span')
  t.textContent = a.testo
  const stringi = () => { vociStringi(nastri); titoloStringi(t) }
  stringi()
  document.fonts.load('800 42px "Ginto Nord"').then(() => t.isConnected && stringi(), () => {}) // (col carattere vero, più largo)
}
// le voci del rullo troppo larghe si stringono (una volta, quando arriva il rullo): la stessa voce in tutti e tre i nastri
function vociStringi(nastri) {
  const vere = [...nastri[nastri.length - 1].children]
  vere.forEach((v, i) => {
    const s = v.firstElementChild
    s.style.fontSize = ''
    const w = s.offsetWidth, max = 760
    const f = w > max ? `${Math.round(42 * Math.max(.6, max / w))}px` : ''
    for (const n of nastri) n.children[i].firstElementChild.style.fontSize = f
  })
}
// il titolo grande: al massimo due righe, si stringe finché ci sta
function titoloStringi(t) {
  t.style.fontSize = ''
  for (let f = 56; f > 30 && (t.offsetHeight > f * 1.12 * 2 + 4 || t.scrollWidth > 860); f -= 2) t.style.fontSize = `${f - 2}px`
}
function coriandoli(box, seme, n, lontano) {
  const c = box.querySelector('.ca-cor, .fi-cor') ?? box
  const h = Array.from({ length: n }, (_, i) => {
    const a = C.caso(seme + i) * Math.PI * 2, d = lontano * (.45 + C.caso(seme + i + 99) * .7)
    return `<i style="--dx:${Math.round(Math.cos(a) * d * 1.5)}px;--dy:${Math.round(Math.sin(a) * d * .8 - 60)}px;--r:${Math.round(C.caso(seme + i + 7) * 900 - 450)}deg;--w:${(6 + C.caso(seme + i + 3) * 9).toFixed(1)}px;background:${C.COLORI[i % C.COLORI.length]};animation-delay:${(C.caso(seme + i + 5) * .12).toFixed(2)}s"></i>`
  }).join('')
  const g = $(`<div class="coriandoli">${h}</div>`)
  c.append(g)
  setTimeout(() => g.remove(), 2600)
}
function argomentoGiro() {
  const box = el.argomento, a = pc?.argomento
  if (!box || !a || !acceso(box)) return
  const t = (Date.now() - a.da) / 1000
  if (t > C.PRESO + 2.5 && box.dataset.fase === 'fermo') return
  const pos = C.posizione(t, a.indice), v = C.velocita(t, a.indice)
  const fase = t < C.GIRA_DA ? 'entra' : t < C.GIRA_FINO + .32 ? 'gira' : t < C.PRESO + 2.5 ? 'preso' : 'fermo'
  if (box.dataset.fase !== fase) {
    box.dataset.fase = fase
    if (fase === 'preso' && presoDi !== a.da) { presoDi = a.da; box.classList.remove('botto'); void box.offsetWidth; box.classList.add('botto'); coriandoli(box, a.da % 1000, 34, 260) }
  }
  // il rullo: la voce «pos» sta in mezzo; dietro, due scie che restano indietro quanto corre
  const [s2, s1, vero] = box.querySelectorAll('.ca-nastro'), y = -pos * RIGA - RIGA / 2
  metti(vero, 'transform', `translateY(${y.toFixed(1)}px)`)
  const k = Math.min(1, Math.abs(v) / 12)
  metti(s1, 'transform', `translateY(${(y + v * RIGA * .022).toFixed(1)}px)`); metti(s1, 'opacity', (k * .45).toFixed(2))
  metti(s2, 'transform', `translateY(${(y + v * RIGA * .045).toFixed(1)}px)`); metti(s2, 'opacity', (k * .22).toFixed(2))
  // le frecce scattano a ogni voce che passa in mezzo
  const f = pos - Math.floor(pos), scatto = Math.exp(-f * 9) * Math.min(1, Math.abs(v) / 1.5)
  const [fs, fd] = box.querySelectorAll('.ca-freccia')
  metti(fs, 'transform', `translateY(-50%) rotate(${(-scatto * 26).toFixed(1)}deg)`)
  metti(fd, 'transform', `translateY(-50%) scaleX(-1) rotate(${(-scatto * 26).toFixed(1)}deg)`)
}

// ── la fine ──
let fineDi = 0, fineVista = 0
function fineTitoli(p) {
  const s = el.fine.querySelector('.fi-scorre'), l = p.scaletta ?? []
  const chiave = JSON.stringify(l.map((x) => x.testo))
  if (s.dataset.c === chiave) return
  s.dataset.c = chiave
  const righe = l.length ? l.map((x, i) => `<div><b>${i + 1}</b>${P(x.testo)}</div>`).join('') : '<div>senza argomenti a caso: solo chiacchiere</div>'
  // (due volte la lista: scorre in tondo senza salti)
  s.innerHTML = `<div class="fi-lista">${righe}</div><div class="fi-lista" aria-hidden="true">${righe}</div>`
  s.style.animationDuration = `${Math.max(8, l.length * 2.6)}s`
  s.classList.toggle('ferma', l.length <= 2)
}
function fineGiro() {
  const box = el.fine
  if (!box || !pc?.fine || !acceso(box)) return
  const t = (Date.now() - pc.fine) / 1000
  if (box.dataset.fase === 'fermo' && t > 4) return
  const durata = (pc.fine - (pc.inizio ?? pc.fine)) / 1000, n = pc.scaletta?.length ?? 0
  // i numeri salgono da zero, poi restano
  const k = Math.min(1, Math.max(0, (t - 1.4) / 1.6)), e = 1 - (1 - k) ** 3
  scrivi(box.querySelector('[data-f=durata]'), C.tempo(durata * e))
  scrivi(box.querySelector('[data-f=n]'), String(Math.round(n * e)))
  scrivi(box.querySelector('[data-f=p]'), String(pc.puntata ?? 1))
  const fase = t < C.FINE_TENDA ? 'tenda' : t < 4 ? 'entra' : 'fermo'
  if (box.dataset.fase !== fase) box.dataset.fase = fase
}
function tenda(da) {
  // le strisce che passano davanti a tutto lo schermo, una volta sola per fine (e solo se la fine è appena successa)
  if (fineDi === da) return
  fineDi = da
  if (Date.now() - da > 1500 || !acceso(el.fine)) return
  const t = $('<div class="fi-tenda"><i></i><i></i><i></i></div>')
  scena.append(t)
  setTimeout(() => t.remove(), 1800)
  setTimeout(() => el.fine?.isConnected && coriandoli(el.fine, da % 1000, 46, 420), 1300)
}

// ── lo stato dal server ──
export function castArriva(s) {
  pc = s.podcast ?? null
  if (el.argomento) {
    const a = pc?.argomento, box = el.argomento
    scrivi(box.querySelector('.ca-ep'), `EP. ${pc?.puntata || 1}`)
    scrivi(box.querySelector('.ca-n'), a ? `argomento ${a.n}` : 'argomento')
    if (a && rulloDi !== a.da) {
      rulloDi = a.da; argomentoRullo(a)
      // (entrata nuova: la pagina parte da quel momento; caricata dopo lo scatto, niente coriandoli)
      delete box.dataset.fase
      if (Date.now() - a.da > (C.PRESO + 1) * 1000) presoDi = a.da
    }
    box.classList.toggle('vuoto', !a)
  }
  if (el.fine && pc) {
    fineTitoli(pc)
    if (pc.fine && pc.fine !== fineVista) { fineVista = pc.fine; delete el.fine.dataset.fase } // (una fine nuova: si riparte dall'entrata)
    if (pc.fine && s.attivi?.fine) tenda(pc.fine)
  }
}
// il tempo che stai sull'argomento, quattro volte al secondo
setInterval(() => {
  const a = pc?.argomento
  if (el.argomento && a) scrivi(el.argomento.querySelector('.ca-da'), `da ${C.tempo((Date.now() - a.da) / 1000)}`)
}, 250)
if (scena) ogniGiro(() => { argomentoGiro(); fineGiro() })
