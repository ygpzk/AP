// La Logitech G413 SE dal vivo, sulla foto vera (foto/tastiera.png: la foto ufficiale dall'alto, 1294 × 440): i tasti
// premuti si accendono di verde nel punto esatto. Un file solo, senza dipendenze:
//
//   import { creaG413, daBrowser } from './g413.js'
//   const tastiera = creaG413()            // tastiera.el va in pagina, tastiera.aggiorna([codici]) accende i tasti
//   document.body.append(tastiera.el)
//   daBrowser(tastiera.aggiorna)           // segue i tasti premuti nella pagina, oppure passa tu i codici
//
// I codici sono quelli virtuali di Windows (VK): 65 = A, 160 = Shift sinistro, 13 = Invio…
// La foto è della versione americana; i codici sono messi dove sta il tasto sulla tastiera italiana (ò à sui due tasti
// dopo la L, ù sul tasto sopra l'Invio, < sulla metà destra dello Shift sinistro, che in Italia è un tasto a sé).
// Il colore dei tasti premuti è la variabile CSS --acceso.

const W = 1294, H = 440
const U = 56.67                                  // un tasto, in pixel della foto
const RIGA = [162, 220.5, 279, 337.5, 396]       // il centro delle cinque righe
const ALTO = 46
const L = (s) => [...s].map((c) => [c.charCodeAt(0), 1])

function tasti() {
  const t = []
  const metti = (k, cx, cy, w = 1, h = ALTO) => t.push([k, cx - (w * U - 10) / 2, cy - h / 2, w * U - 10, h])
  const riga = (x0, y, voci) => { let x = x0; for (const v of voci) { if (typeof v === 'number') { x += v * U; continue } metti(v[0], x + v[1] * U / 2, y, v[1]); x += v[1] * U } }
  // la fila dei tasti funzione, a gruppi
  for (const [k, cx] of [[27, 38], [112, 147], [113, 204], [114, 262], [115, 319], [116, 406], [117, 463], [118, 521], [119, 579], [120, 666], [121, 724], [122, 781], [123, 839], [44, 910], [145, 966], [19, 1023]]) metti(k, cx, 98)
  // il blocco principale
  riga(12, RIGA[0], [[220, 1], ...L('1234567890'), [219, 1], [221, 1], [8, 2]])
  riga(12, RIGA[1], [[9, 1.5], ...L('QWERTYUIOP'), [186, 1], [187, 1], [191, 1.5]])
  riga(12, RIGA[2], [[20, 1.75], ...L('ASDFGHJKL'), [192, 1], [222, 1], [13, 2.25]])
  riga(12, RIGA[3], [[160, 2.25], ...L('ZXCVBNM'), [188, 1], [190, 1], [189, 1], [161, 2.75]])
  riga(12, RIGA[3], [1.25, [226, 1]])
  riga(12, RIGA[4], [[162, 1.25], [91, 1.25], [164, 1.25], [32, 6.25], [165, 1.25], 1.25, [93, 1.25], [163, 1.25]])
  // ins, canc e le frecce
  riga(882, RIGA[0], [[45, 1], [36, 1], [33, 1]])
  riga(882, RIGA[1], [[46, 1], [35, 1], [34, 1]])
  riga(882, RIGA[3], [1, [38, 1]])
  riga(882, RIGA[4], [[37, 1], [40, 1], [39, 1]])
  // il tastierino
  riga(1065, RIGA[0], [[144, 1], [111, 1], [106, 1], [109, 1]])
  riga(1065, RIGA[1], [[103, 1], [104, 1], [105, 1]])
  riga(1065, RIGA[2], [[100, 1], [101, 1], [102, 1]])
  riga(1065, RIGA[3], [[97, 1], [98, 1], [99, 1]])
  riga(1065, RIGA[4], [[96, 2], [110, 1]])
  metti(107, 1065 + 3.5 * U, (RIGA[1] + RIGA[2]) / 2, 1, ALTO + 58.5)
  metti(13, 1065 + 3.5 * U, (RIGA[3] + RIGA[4]) / 2, 1, ALTO + 58.5)
  return t
}

/** Crea la tastiera. `el` va in pagina, `aggiorna(codici)` accende i tasti premuti. `resta`: per quanti millisecondi un
 *  tasto rilasciato rimane acceso (un colpo veloce, sennò, in video non si vede). `foto`: l'indirizzo della foto. */
export function creaG413({ resta = 110, foto = '/foto/tastiera.png' } = {}) {
  const el = document.createElement('div')
  el.className = 'g413'
  el.style.cssText = `position:relative;aspect-ratio:${W}/${H};`
  el.innerHTML = `<img src="${foto}" alt="Logitech G413 SE" style="display:block;width:100%;height:100%">
<svg viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible" aria-hidden="true">
<style>
  .g413 rect { fill: var(--acceso, #2dff7a); opacity: 0; transition: opacity .07s; }
  .g413 rect.giu { opacity: .86; filter: drop-shadow(0 0 9px var(--acceso, #2dff7a)); }
</style>
${tasti().map(([k, x, y, w, h]) => `<rect data-k="${k}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="7"/>`).join('')}
</svg>`
  const per = new Map()
  for (const r of el.querySelectorAll('[data-k]')) { const k = +r.dataset.k; per.set(k, [...(per.get(k) ?? []), r]) }
  let giu = new Set()
  const spegni = new Map()
  function aggiorna(codici = []) {
    const ora = new Set(codici)
    for (const k of ora) if (per.has(k)) { clearTimeout(spegni.get(k)); for (const r of per.get(k)) r.classList.add('giu') }
    for (const k of giu) if (!ora.has(k) && per.has(k)) spegni.set(k, setTimeout(() => { for (const r of per.get(k)) r.classList.remove('giu') }, resta))
    giu = ora
  }
  return { el, aggiorna }
}

/** Segue i tasti premuti nella pagina (solo a finestra in primo piano) e chiama `dai(codici)`. Restituisce `ferma()`. */
export function daBrowser(dai) {
  const giu = new Set()
  const LATO = { ShiftLeft: 160, ShiftRight: 161, ControlLeft: 162, ControlRight: 163, AltLeft: 164, AltRight: 165 }
  const su = (e) => { giu.delete(LATO[e.code] ?? e.keyCode); dai([...giu]) }
  const premi = (e) => { giu.add(LATO[e.code] ?? e.keyCode); dai([...giu]) }
  const via = () => { giu.clear(); dai([]) }
  addEventListener('keydown', premi); addEventListener('keyup', su); addEventListener('blur', via)
  return () => { removeEventListener('keydown', premi); removeEventListener('keyup', su); removeEventListener('blur', via) }
}
