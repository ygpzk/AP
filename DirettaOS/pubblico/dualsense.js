// Il DualSense dal vivo, sulla foto vera (foto/pad.png: la foto ufficiale di fronte, 836 × 574): i tasti premuti si
// accendono di verde, e le levette sono quelle della foto, ritagliate, che si spostano davvero dove le spingi.
// Un file solo, senza dipendenze:
//
//   import { creaDualSense, daBrowser } from './dualsense.js'
//   const pad = creaDualSense()            // pad.el va in pagina, pad.aggiorna(lettura) lo muove
//   document.body.append(pad.el)
//   daBrowser(pad.aggiorna)                // legge il controller dal browser (Gamepad API), oppure passa le tue letture
//
// Una lettura è { b, s, a }:
//   b  stringa di 0 e 1, un carattere per tasto: □ ✕ ○ △ L1 R1 L2 R2 create options L3 R3 PS touchpad mute
//   s  la croce: 0 ferma, poi 1 su, 2 su-destra, 3 destra, 4 giù-destra, 5 giù, 6 giù-sinistra, 7 sinistra, 8 su-sinistra
//   a  sei assi da 0 a 1: levetta sinistra x, y · levetta destra x · L2 · R2 · levetta destra y   (le levette ferme stanno a 0,5)
// È l'ordine in cui Windows dà il DualSense e il DualShock 4 via cavo o Bluetooth (Windows.Gaming.Input).
// Di fronte i grilletti L2 e R2 non si vedono: sopra la foto ci sono due barrette che si riempiono quanto li premi.
// Il colore dei tasti premuti è la variabile CSS --acceso.

const W = 836, H = 574, SOPRA = 46
const LEVE = [[285, 270, 0, 1, 10], [551, 270, 2, 5, 11]] // centro x, y · asse x, asse y · tasto (L3, R3)
const R_LEVA = 46, CORSA = 17, FERMA = 0.14

/** Crea il controller. `el` va in pagina, `aggiorna({ b, s, a })` lo muove. `foto`: l'indirizzo della foto. */
export function creaDualSense({ foto = '/foto/pad.png' } = {}) {
  const el = document.createElement('div')
  el.className = 'dualsense'
  el.style.cssText = `position:relative;aspect-ratio:${W}/${H + SOPRA};`
  el.innerHTML = `<svg viewBox="0 ${-SOPRA} ${W} ${H + SOPRA}" style="display:block;width:100%;height:100%;overflow:visible" role="img" aria-label="DualSense">
<defs>${LEVE.map(([x, y], i) => `<clipPath id="ds-ritaglio-${i}"><circle cx="${x}" cy="${y}" r="${R_LEVA}"/></clipPath>`).join('')}</defs>
<style>
  .dualsense .t { fill: var(--acceso, #2dff7a); opacity: 0; transition: opacity .07s; }
  .dualsense .giu.t, .dualsense .giu .t { opacity: .8; filter: drop-shadow(0 0 12px var(--acceso, #2dff7a)); }
  .dualsense .leva { transition: transform .05s linear; }
  .dualsense .anello { fill: none; stroke: var(--acceso, #2dff7a); stroke-width: 6; opacity: 0; transition: opacity .09s; }
  .dualsense .leva.mossa .anello { opacity: .55; }
  .dualsense .leva.giu .anello { opacity: 1; filter: drop-shadow(0 0 10px var(--acceso, #2dff7a)); }
  .dualsense .grilletto { fill: #141118; stroke: #4b4556; stroke-width: 2; }
  .dualsense .pieno { fill: var(--acceso, #2dff7a); transition: width .05s linear, x .05s linear; }
  .dualsense text { fill: #fff; font: 800 19px "gg sans", "Segoe UI", sans-serif; text-anchor: middle; paint-order: stroke; stroke: #141118; stroke-width: 4px; }
</style>
<image href="${foto}" x="0" y="0" width="${W}" height="${H}"/>

<!-- L2 e R2: le barrette sopra la foto -->
<rect class="grilletto" x="98" y="-42" width="124" height="30" rx="11"/><rect class="pieno" data-asse="3" data-da="102" data-largo="116" x="102" y="-38" width="0" height="22" rx="8"/><text x="160" y="-20">L2</text>
<rect class="grilletto" x="614" y="-42" width="124" height="30" rx="11"/><rect class="pieno" data-asse="4" data-da="734" data-largo="-116" x="734" y="-38" width="0" height="22" rx="8"/><text x="676" y="-20">R2</text>
<!-- L1 e R1 -->
<path class="t" data-b="4" d="M104 30C108 10 124 2 150 2h46c12 0 20 6 20 14v6c-44 0-82 2-112 8z"/>
<path class="t" data-b="5" d="M732 30C728 10 712 2 686 2h-46c-12 0-20 6-20 14v6c44 0 82 2 112 8z"/>
<!-- create, options, touchpad -->
<rect class="t" data-b="8" x="213" y="48" width="24" height="42" rx="12" transform="rotate(-8 225 69)"/>
<rect class="t" data-b="9" x="601" y="48" width="24" height="42" rx="12" transform="rotate(8 613 69)"/>
<path class="t" data-b="13" d="M252 18H584L570 138Q564 186 518 186H318Q272 186 266 138z"/>
<!-- la croce -->
<rect class="t" data-croce="1,2,8" x="135" y="86" width="46" height="50" rx="12"/>
<rect class="t" data-croce="4,5,6" x="135" y="184" width="46" height="50" rx="12"/>
<rect class="t" data-croce="6,7,8" x="85" y="137" width="50" height="46" rx="12"/>
<rect class="t" data-croce="2,3,4" x="181" y="137" width="50" height="46" rx="12"/>
<!-- triangolo, cerchio, croce, quadrato -->
<circle class="t" data-b="3" cx="678" cy="98" r="30"/><circle class="t" data-b="2" cx="740" cy="160" r="30"/>
<circle class="t" data-b="1" cx="678" cy="222" r="30"/><circle class="t" data-b="0" cx="616" cy="160" r="30"/>
<!-- il tasto PS e il muto -->
<ellipse class="t" data-b="12" cx="417" cy="271" rx="28" ry="20"/>
<rect class="t" data-b="14" x="396" y="311" width="42" height="14" rx="7"/>
<!-- le levette: sotto un fondo scuro che copre quelle ferme, sopra il ritaglio della foto che si sposta -->
${LEVE.map(([x, y, ax, ay, b], i) => `<circle cx="${x}" cy="${y}" r="${R_LEVA + 5}" fill="#101114"/>
<g class="leva" data-leva="${ax},${ay}" data-b="${b}"><image href="${foto}" x="0" y="0" width="${W}" height="${H}" clip-path="url(#ds-ritaglio-${i})"/><circle class="anello" cx="${x}" cy="${y}" r="${R_LEVA - 2}"/></g>`).join('\n')}
</svg>`
  const tasti = [...el.querySelectorAll('[data-b]')].map((g) => [g, +g.dataset.b])
  const croce = [...el.querySelectorAll('[data-croce]')].map((g) => [g, g.dataset.croce.split(',').map(Number)])
  const grilletti = [...el.querySelectorAll('[data-asse]')].map((r) => [r, +r.dataset.asse, +r.dataset.da, +r.dataset.largo])
  const leve = [...el.querySelectorAll('[data-leva]')].map((g) => [g, ...g.dataset.leva.split(',').map(Number)])
  function aggiorna({ b = '', s = 0, a = [] } = {}) {
    for (const [g, i] of tasti) g.classList.toggle('giu', b[i] === '1')
    for (const [g, quando] of croce) g.classList.toggle('giu', quando.includes(s))
    for (const [r, i, da, largo] of grilletti) {
      const v = Math.max(0, Math.min(1, a[i] ?? 0)), w = Math.abs(largo) * v
      r.setAttribute('width', w); r.setAttribute('x', largo < 0 ? da - w : da)
    }
    for (const [g, ix, iy] of leve) {
      let x = ((a[ix] ?? .5) - .5) * 2, y = ((a[iy] ?? .5) - .5) * 2
      const quanto = Math.hypot(x, y)
      if (quanto < FERMA) x = y = 0
      else if (quanto > 1) { x /= quanto; y /= quanto }
      g.setAttribute('transform', `translate(${(x * CORSA).toFixed(1)} ${(y * CORSA).toFixed(1)})`)
      g.classList.toggle('mossa', quanto >= FERMA)
    }
  }
  aggiorna()
  return { el, aggiorna }
}

/** Legge il primo controller dal browser (Gamepad API, mappatura standard) e chiama `dai(lettura)` a ogni fotogramma.
 *  Il browser dà il controller solo alla finestra in primo piano, e solo dopo che hai premuto un tasto. Restituisce `ferma()`. */
export function daBrowser(dai) {
  let vivo = true
  const giro = () => {
    if (!vivo) return
    const p = [...(navigator.getGamepads?.() ?? [])].find(Boolean)
    if (p) {
      const B = (i) => (p.buttons[i]?.pressed ? '1' : '0'), V = (i) => p.buttons[i]?.value ?? 0
      const su = p.buttons[12]?.pressed, giu = p.buttons[13]?.pressed, sx = p.buttons[14]?.pressed, dx = p.buttons[15]?.pressed
      const s = su ? (dx ? 2 : sx ? 8 : 1) : giu ? (dx ? 4 : sx ? 6 : 5) : dx ? 3 : sx ? 7 : 0
      dai({ b: [2, 0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18].map(B).join(''), s, a: [p.axes[0] / 2 + .5, p.axes[1] / 2 + .5, p.axes[2] / 2 + .5, V(6), V(7), p.axes[3] / 2 + .5] })
    }
    requestAnimationFrame(giro)
  }
  giro()
  return () => { vivo = false }
}
