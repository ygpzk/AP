// Il Logitech G502 HERO dal vivo, sulla foto vera (foto/mouse.png: la foto ufficiale dall'alto, 552 × 1066): i tasti
// premuti si accendono di verde (sinistro, destro, rotella, i due laterali). Un file solo, senza dipendenze:
//
//   import { creaG502, daBrowser } from './g502.js'
//   const mouse = creaG502()               // mouse.el va in pagina, mouse.aggiorna([codici]) accende i tasti
//   document.body.append(mouse.el)
//   daBrowser(mouse.aggiorna)              // segue i clic nella pagina, oppure passa tu i codici
//
// I codici sono quelli virtuali di Windows: 1 sinistro, 2 destro, 4 rotella, 5 laterale indietro, 6 laterale avanti.
// I tasti dei DPI (G7, G8), il G9 e il cecchino non mandano codici a Windows: restano com'è la foto.
// Il colore dei tasti premuti è la variabile CSS --acceso.

const W = 552, H = 1066
// le zone dei tasti, in pixel della foto
const ZONE = [
  [1, '272,124 152,184 140,300 136,430 150,596 292,606 296,450 268,430 268,200'],
  [2, '350,100 480,192 502,330 508,470 492,588 362,556 356,440 356,200'],
  [6, '68,418 130,436 140,525 66,455'],
  [5, '64,462 142,532 150,636 92,628 62,520'],
]

/** Crea il mouse. `el` va in pagina, `aggiorna(codici)` accende i tasti premuti; `resta` e `foto` come nella tastiera. */
export function creaG502({ resta = 110, foto = '/foto/mouse.png' } = {}) {
  const el = document.createElement('div')
  el.className = 'g502'
  el.style.cssText = `position:relative;aspect-ratio:${W}/${H};`
  el.innerHTML = `<img src="${foto}" alt="Logitech G502 HERO" style="display:block;width:100%;height:100%">
<svg viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible" aria-hidden="true">
<style>
  .g502 [data-k] { fill: var(--acceso, #2dff7a); opacity: 0; transition: opacity .07s; }
  .g502 [data-k].giu { opacity: .8; filter: drop-shadow(0 0 16px var(--acceso, #2dff7a)); }
</style>
${ZONE.map(([k, p]) => `<polygon data-k="${k}" points="${p}"/>`).join('')}
<rect data-k="4" x="290" y="264" width="58" height="158" rx="18"/>
</svg>`
  const per = new Map([...el.querySelectorAll('[data-k]')].map((g) => [+g.dataset.k, g]))
  let giu = new Set()
  const spegni = new Map()
  function aggiorna(codici = []) {
    const ora = new Set(codici)
    for (const k of ora) if (per.has(k)) { clearTimeout(spegni.get(k)); per.get(k).classList.add('giu') }
    for (const k of giu) if (!ora.has(k) && per.has(k)) spegni.set(k, setTimeout(() => per.get(k).classList.remove('giu'), resta))
    giu = ora
  }
  return { el, aggiorna }
}

/** Segue i clic nella pagina e chiama `dai(codici)`. Restituisce `ferma()`. */
export function daBrowser(dai) {
  const CODICE = [1, 4, 2, 5, 6], giu = new Set()
  const premi = (e) => { giu.add(CODICE[e.button]); dai([...giu]) }
  const su = (e) => { giu.delete(CODICE[e.button]); dai([...giu]) }
  addEventListener('mousedown', premi); addEventListener('mouseup', su)
  return () => { removeEventListener('mousedown', premi); removeEventListener('mouseup', su) }
}
