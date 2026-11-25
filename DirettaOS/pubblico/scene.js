// Diretta OS · le scene: «Dove vivo», «Azienda di Giugnoh», «Surf con lei».
// Una scena è sempre a schermo intero (1920 × 1080, copre la webcam) e in regia è un tasto: premuto è in onda.
// Hanno lo stesso nome in regia, in onda e nell'indirizzo (/o/dovevivo, /o/azienda, /o/surf).
//
// Qui c'è solo il padrone di casa: ogni scena sta nella sua cartella e si carica la prima volta che si accende
// (la casa in 3D si porta dietro Babylon.js: chi non la guarda non lo scarica). Il contratto è lo stesso per tutte:
//
//   export function crea(ctx) → { el, mostra(su), giro(dt, t), aggiorna(stato), comando(v) }
//
//   el            un elemento 1920 × 1080, opaco
//   mostra(su)    va in onda / esce: spenta non deve costare niente
//   giro(dt, t)   a ogni giro di giro.js (60 al secondo), solo mentre è in onda
//   aggiorna(s)   lo stato del server, quando cambia (s.meteo, …)
//   comando(v)    quello che un'altra pagina ha mandato con ctx.manda(v): la camera della mappa girata dalla regia,
//                 lo scorrimento del sito. Arriva anche l'ultimo salvato, appena la scena è pronta.
//
//   ctx.tempo()   secondi da quando la scena è accesa: uguale in tutte le pagine (lo segna il server), così la regia,
//                 Camo e la prova disegnano lo stesso fotogramma
//   ctx.ora()     la data e l'ora da usare · ctx.stato() l'ultimo stato · ctx.manda(v) agli altri (a chi manda no)
//
// La prova di una scena da sola, senza regia: /scene/prova.html?scena=dovevivo

import { ogniGiro, fpsScegli, fpsOra } from '/giro.js'
import { SCENE, SCENE_NOMI, SCENE_DICE, SCENE_POSTI } from '/scene-nomi.js'

export { SCENE, SCENE_NOMI, SCENE_DICE, SCENE_POSTI }

// dove sta ogni scena: [modulo, funzione]
const MODULI = {
  dovevivo: ['/scene/dove/dove.js', 'crea'],
  azienda: ['/scene/sito/sito.js', 'crea'],
  surf: ['/scene/surf/surf.js', 'crea'],
}

const QUESTA = Math.random().toString(36).slice(2, 12) // (questa pagina: i comandi che manda non le tornano indietro)
const vive = []
let ultimo = null // l'ultimo stato arrivato dal server

function mettiCss() {
  if (document.querySelector('link[href="/scene.css"]')) return
  document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/scene.css' }))
}

// in onda: il suo pezzo è acceso. Nell'anteprima dal vivo della regia gli altri pezzi si nascondono (sono già
// nell'immagine di Camo); la scena no, resta disegnata qui: è lì che la si gira col mouse.
const attiva = (v) => !!(v.pezzo ??= v.el.closest('.pezzo'))?.classList.contains('su')

function contesto(v) {
  return {
    nome: v.p,
    prova: false,
    tempo: () => Math.max(0, (Date.now() - (ultimo?.scenaDa ?? v.da)) / 1000),
    ora: () => new Date(),
    stato: () => ultimo,
    manda: (dati) => {
      if (ultimo) (ultimo.scena ??= {})[v.p] = dati
      fetch('/api/azione', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'scena', nome: v.p, v: dati, chi: QUESTA }) }).catch(() => {})
    },
  }
}

function prova(v, cosa, ...a) {
  try { return v.mod?.[cosa]?.(...a) } catch (e) { if (!v.guasti?.[cosa]) { (v.guasti ??= {})[cosa] = true; console.warn(`scena ${v.p}: ${cosa}:`, e) } }
}

function carica(v) {
  const [modulo, fn] = MODULI[v.p]
  v.carica = import(modulo).then((m) => {
    v.mod = m[fn](contesto(v))
    v.el.append(v.mod.el)
    if (ultimo) prova(v, 'aggiorna', ultimo)
    const c = ultimo?.scena?.[v.p]
    if (c != null) prova(v, 'comando', c)
    if (v.su) prova(v, 'mostra', true)
  }).catch((e) => {
    console.warn(`scena ${v.p}: non si carica:`, e)
    setTimeout(() => { v.carica = null }, 4000) // (si riprova, se è ancora accesa)
  })
}

function giro(dt, t) {
  for (const v of vive) {
    const su = attiva(v)
    if (su !== v.su) {
      v.su = su
      if (su) v.da = Date.now() // (se il server è di prima e non segna l'ora, vale questa)
      prova(v, 'mostra', su)
    }
    if (!su) continue
    if (!v.mod) { if (!v.carica) carica(v); continue }
    prova(v, 'giro', dt, t)
  }
}

// l'anteprima della regia gira a 15 fotogrammi al secondo: mentre giri la mappa col mouse sale a 60, poi torna com'era
let fpsPrima = null, fpsFra = null
function sveglia() {
  if (fpsOra() >= 60 && fpsPrima === null) return
  if (fpsPrima === null) { fpsPrima = fpsOra(); fpsScegli(60) }
  clearTimeout(fpsFra)
  fpsFra = setTimeout(() => { fpsScegli(fpsPrima); fpsPrima = null }, 4000)
}

export function creaScena(p) {
  mettiCss()
  const el = document.createElement('div')
  el.className = 'sc'; el.dataset.scena = p
  for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown']) el.addEventListener(ev, sveglia, { passive: true })
  vive.push({ p, el, pezzo: null, mod: null, carica: null, su: false, da: Date.now() })
  if (vive.length === 1) ogniGiro(giro)
  return el
}
export function sceneArriva(s) {
  ultimo = s
  for (const v of vive) prova(v, 'aggiorna', s)
}
// il comando di una scena mandato da un'altra pagina (evento «scena» del server)
export function sceneComando({ p, v, chi }) {
  if (chi === QUESTA) return
  if (ultimo) { ultimo.scena ??= {}; if (v == null) delete ultimo.scena[p]; else ultimo.scena[p] = v }
  for (const x of vive) if (x.p === p) prova(x, 'comando', v)
}
