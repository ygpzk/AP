// LA CALCOLATRICE DI PZKKO.IT IN STILE DISCORD (20.11, Alberto: «crea una calcolatrice stile discord con colori pzk»).
// Un riquadro come il profilo di Discord col tema Nitro (il velo sopra la sfumatura #ccff00 → #9d00ff, gli stessi colori
// della scheda del profilo), gg sans, i tasti di Discord coi colori pzk: viola le operazioni, lime l'uguale, rosso AC.
// Si apre sopra il profilo come i tavoli (openHere in app.js, «qui:calcolatrice»), e dalla chat con /calcola.
//
// I CONTI SONO QUELLI DELLA CALCOLATRICE DEL CERCAPERSONE (telefono/app/calcolatrice.js: calcola, registra, S): è la
// stessa calcolatrice con una faccia in più, quindi l'espressione a metà, ANS, gli ultimi risultati e gon/deg/rad sono gli
// stessi che si vedono nell'app «calcoli» di pzk os (e restano nel browser, telefono/ricordi.js). Tre schede:
// - BASE: le cifre, le quattro operazioni, le parentesi, DEL e AC;
// - SCIENTIFICA: in più sin cos tan e le inverse, log ln √ ^ ! π e, x², ×10ˣ, ANS, e gli angoli in gon, gradi o radianti
//   (sul computer i tasti in più stanno a sinistra e il riquadro si allarga);
// - CRONOLOGIA: gli ultimi otto risultati; un clic rimette l'espressione.
// Mentre scrivi sotto si vede il risultato; con «=» l'espressione va negli ultimi e ANS prende il risultato; un'operazione
// subito dopo riparte da ANS. Si scrive anche dalla tastiera (Invio è l'uguale, Canc svuota, Esc chiude) e si incolla.
// Il tasto in alto a destra copia il risultato, col fumetto di Discord che diventa verde.
//
//   apri()   apre il riquadro (lo costruisce la prima volta)

import { S, MODI, calcola, registra, num, chiusa } from '/telefono/app/calcolatrice.js'
import { ricordo, ricorda } from '/telefono/ricordi.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const salva = () => ricorda('calcolatrice', S)
const V = ricordo('calcolatrice-discord', { scheda: 'base' }) // la scheda scelta (lo stato dei conti è S, in comune)
if (!['base', 'sci', 'storia'].includes(V.scheda)) V.scheda = 'base'
const salvaV = () => ricorda('calcolatrice-discord', V)

const ICONA = {
  del: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.2 5h10.3A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5H9.2a2.5 2.5 0 0 1-1.86-.83L2.4 12.67a1 1 0 0 1 0-1.34l4.94-5.5A2.5 2.5 0 0 1 9.2 5Zm2.5 4.3a1 1 0 0 0-1.4 1.4L11.6 12l-1.3 1.3a1 1 0 1 0 1.4 1.4l1.3-1.3 1.3 1.3a1 1 0 0 0 1.4-1.4L14.4 12l1.3-1.3a1 1 0 0 0-1.4-1.4L13 10.6Z"/></svg>',
  copia: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 16a1 1 0 0 1-1-1V5a3 3 0 0 1 3-3h10a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0H5a1 1 0 0 0-1 1v9a1 1 0 0 1-1 1Z"/><path fill="currentColor" d="M7 9a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3V9Z"/></svg>',
  chiudi: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"/></svg>',
  spunta: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M6.2 11.6 2.9 8.3l1.1-1.1 2.2 2.2 5.8-5.8 1.1 1.1z"/></svg>',
}

// i tasti: [quello che si vede, quello che scrive (o il comando), lo stile, il nome per chi non vede]
const BASE = [
  ['AC', '#ac', 'ac', 'svuota'], ['(', '(', '', 'parentesi aperta'], [')', ')', '', 'parentesi chiusa'], ['÷', '÷', 'op', 'diviso'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['×', '×', 'op', 'per'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['−', '−', 'op', 'meno'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'op', 'più'],
  ['0', '0'], [',', ',', '', 'virgola'], [ICONA.del, '#del', '', 'cancella'], ['=', '#=', 'uguale', 'uguale'],
]
const FN = [
  ['sin', 'sin(', 'fn'], ['cos', 'cos(', 'fn'], ['tan', 'tan(', 'fn'], ['π', 'π', 'fn', 'pi greco'],
  ['sin<sup>−1</sup>', 'asin(', 'fn', 'arcoseno'], ['cos<sup>−1</sup>', 'acos(', 'fn', 'arcocoseno'], ['tan<sup>−1</sup>', 'atan(', 'fn', 'arcotangente'], ['e', 'e', 'fn', 'numero di Nepero'],
  ['log', 'log(', 'fn', 'logaritmo in base 10'], ['ln', 'ln(', 'fn', 'logaritmo naturale'], ['√', '√(', 'fn', 'radice quadrata'], ['x<sup>y</sup>', '^', 'fn', 'elevato a'],
  ['x²', '^2', 'fn', 'al quadrato'], ['n!', '!', 'fn', 'fattoriale'], ['×10<sup>x</sup>', '×10^', 'fn', 'per dieci alla'], ['ANS', 'ans', 'fn', 'il risultato di prima'],
]
const PER_TASTO = new Map([...BASE, ...FN].map((t) => [t[1], t]))
// dalla tastiera vera: il tasto → quello che scrive (le lettere passano così come sono: sin, cos, pi, ans…)
const TASTIERA = { '*': '×', '/': '÷', ':': '÷', '-': '−', '.': ',', Enter: '#=', '=': '#=', Backspace: '#del', Delete: '#ac' }
const AMMESSI = /^[0-9a-z+\-*/^().,!×÷−√π]$/i
const OPERAZIONE = /^[+−×÷^!]/ // dopo l'uguale, queste ripartono da ANS

let dlg = null, el = {}
let fatto = null // { expr, ris } dopo l'uguale, finché non si scrive altro
let errore = '', fumetto = 0

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) { dlg.classList.remove('chiude'); dlg.showModal() }
  disegna()
  el.box.focus({ preventScroll: true })
}

async function costruisci() {
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL('calcolatrice.css', import.meta.url).pathname
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  const tasto = ([eti, scrive, stile = '', nome = '']) => `<button type="button" class="ca-k${stile ? ` ${stile}` : ''}" data-k="${esc(scrive)}"${nome ? ` aria-label="${esc(nome)}"` : ''}><span>${eti}</span></button>`
  dlg = document.createElement('dialog')
  dlg.className = 'ca'
  dlg.setAttribute('aria-labelledby', 'ca-titolo')
  dlg.innerHTML = `
    <div class="ca-box" tabindex="-1">
      <header class="ca-testa">
        <img class="ca-av" src="/art/chat-app3/app-calcolatrice.webp" alt="" width="56" height="56" draggable="false">
        <div class="ca-chi"><h2 id="ca-titolo">Calcolatrice <span class="ca-tag" title="app di pzk">${ICONA.spunta}APP</span></h2>
          <p>pzk os · i conti in comune col cercapersone</p></div>
        <button type="button" class="ca-x" data-chiudi aria-label="chiudi">${ICONA.chiudi}</button>
      </header>
      <nav class="ca-schede" role="tablist" aria-label="la calcolatrice">
        <button type="button" class="ca-scheda" role="tab" data-scheda="base">Base</button>
        <button type="button" class="ca-scheda" role="tab" data-scheda="sci">Scientifica</button>
        <button type="button" class="ca-scheda" role="tab" data-scheda="storia">Cronologia<span class="ca-n" data-n></span></button>
      </nav>
      <div class="ca-corpo">
        <div class="ca-schermo">
          <div class="ca-sopra"><span class="ca-eti" data-eti>espressione</span><span class="ca-modo" data-modo hidden></span>
            <button type="button" class="ca-copia" data-copia aria-label="copia il risultato">${ICONA.copia}<span class="ca-fumetto" data-fumetto>Copia il risultato</span></button></div>
          <div class="ca-prima"><bdi data-prima></bdi></div>
          <div class="ca-riga" data-riga></div>
          <output class="ca-poi" data-poi aria-live="polite"></output>
        </div>
        <section class="ca-calc" data-calc>
          <div class="ca-modi" data-modi><span>angoli</span><div class="ca-pillole" role="group" aria-label="gli angoli">${Object.entries(MODI).map(([k, [, nome]]) => `<button type="button" class="ca-pillola" data-m="${k}" title="${esc(nome)}">${k}</button>`).join('')}</div></div>
          <div class="ca-tasti">
            <div class="ca-griglia fn" role="group" aria-label="le funzioni">${FN.map(tasto).join('')}</div>
            <div class="ca-griglia" role="group" aria-label="i numeri">${BASE.map(tasto).join('')}</div>
          </div>
        </section>
        <section class="ca-storia" data-storia hidden></section>
      </div>
      <p class="ca-nota"><kbd>Invio</kbd> è l'uguale · <kbd>Canc</kbd> svuota · <kbd>Esc</kbd> chiude</p>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = { box: q('.ca-box'), schermo: q('.ca-schermo'), eti: q('[data-eti]'), modo: q('[data-modo]'), prima: q('[data-prima]'), riga: q('[data-riga]'), poi: q('[data-poi]'),
    copia: q('[data-copia]'), fumetto: q('[data-fumetto]'), calc: q('[data-calc]'), modi: q('[data-modi]'), storia: q('[data-storia]'), n: q('[data-n]') }

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  // col mouse i tasti non prendono il fuoco (resta al riquadro): così Invio resta l'uguale e non ripreme l'ultimo tasto
  // cliccato, e una riga della cronologia che sparisce non si porta via la tastiera
  dlg.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault() })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) return chiudi()
    const k = e.target.closest('[data-k]')
    if (k) return premi(k.dataset.k)
    const s = e.target.closest('[data-scheda]')
    if (s) { V.scheda = s.dataset.scheda; salvaV(); return disegna() }
    const m = e.target.closest('[data-m]')
    if (m) { S.modo = m.dataset.m; salva(); return disegna() }
    if (e.target.closest('[data-copia]') || e.target.closest('.ca-riga.ris')) return copia()
    const st = e.target.closest('[data-st]')
    if (st) return riprendi(Number(st.dataset.st))
    if (e.target.closest('[data-svuota]')) { S.storia = []; salva(); return disegna() }
  })
  dlg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !String(getSelection())) { e.preventDefault(); copia() }
      return
    }
    // un tasto col fuoco (dalla tastiera, col Tab) fa il suo con Invio e Spazio
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('button')) return
    const k = e.key in TASTIERA ? TASTIERA[e.key] : AMMESSI.test(e.key) ? e.key.toLowerCase() : null
    if (!k) return
    e.preventDefault()
    if (V.scheda === 'storia' && k !== '#ac') { V.scheda = sci() ? 'sci' : 'base'; salvaV() }
    lampo(k)
    premi(k)
  })
  dlg.addEventListener('paste', (e) => {
    const t = e.clipboardData?.getData('text') ?? ''
    const pulito = t.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−').replace(/\s+/g, '').split('').filter((c) => AMMESSI.test(c)).join('')
    if (!pulito) return
    e.preventDefault()
    if (V.scheda === 'storia') { V.scheda = 'base'; salvaV() }
    scrivi(pulito)
  })
}

const sci = () => V.scheda === 'sci' || (V.scheda === 'storia' && /[a-zπ√!^]/i.test(S.expr.replace(/ans/g, '')))

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude') }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  setTimeout(fine, 130)
}

// ── scrivere e calcolare ──
function scrivi(s) {
  errore = ''
  if (fatto && !S.expr && OPERAZIONE.test(s)) s = `ans${s}` // dopo l'uguale un'operazione continua dal risultato
  fatto = null
  S.expr += s
  salva()
  disegna()
}
function premi(k) {
  if (k === '#=') return uguale()
  if (k === '#ac') { S.expr = ''; fatto = null; errore = ''; salva(); return disegna() }
  if (k === '#del') {
    errore = ''
    if (fatto && !S.expr) { fatto = null; return disegna() }
    // le funzioni si cancellano intere («sin(» o «ans» in un colpo), come si sono scritte
    const m = /(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|√\(|ans|×10\^)$/.exec(S.expr)
    S.expr = S.expr.slice(0, m ? -m[0].length : -1)
    salva()
    return disegna()
  }
  scrivi(k)
}
function uguale() {
  if (!S.expr.trim()) return
  S.expr = chiusa(S.expr) // le parentesi lasciate aperte si chiudono da sole

  const expr = S.expr
  try {
    const v = registra() // negli ultimi, ANS, l'espressione si svuota (e si salva)
    fatto = { expr, ris: num(v) }
    errore = ''
  } catch (e) {
    errore = e.message
    if (!RIDOTTO.matches) { el.schermo.classList.remove('scossa'); void el.schermo.offsetWidth; el.schermo.classList.add('scossa') }
  }
  disegna()
}
/** Il risultato che si vede adesso (quello dell'uguale, o quello che verrebbe), o null. */
function adesso() {
  if (fatto && !S.expr) return fatto.ris
  if (!S.expr.trim()) return null
  try { return num(calcola(chiusa(S.expr))) } catch { return null }
}
function riprendi(i) {
  const s = S.storia[i]
  if (!s) return
  S.expr = s[0]; fatto = null; errore = ''
  V.scheda = /[a-zπ√!^]/i.test(s[0].replace(/ans/g, '')) ? 'sci' : 'base'
  salva(); salvaV()
  disegna()
  el.box.focus({ preventScroll: true })
}

async function copia() {
  const r = adesso()
  if (r === null) return
  try { await navigator.clipboard.writeText(r) } catch { return }
  el.fumetto.textContent = 'Copiato!'
  el.fumetto.classList.add('ok')
  clearTimeout(fumetto)
  fumetto = setTimeout(() => { el.fumetto.classList.remove('ok'); el.fumetto.textContent = 'Copia il risultato' }, 1400)
}
/** Il tasto sullo schermo si abbassa quando lo premi dalla tastiera. */
function lampo(k) {
  const b = dlg.querySelector(`[data-k="${CSS.escape(k)}"]`)
  if (!b) return
  b.classList.add('premuto')
  setTimeout(() => b.classList.remove('premuto'), 110)
}

// ── disegnare ──
/** L'espressione come si vede: ANS in una pillola, il resto com'è scritto. */
const bella = (expr) => esc(expr).replace(/ans/g, '<span class="ans">ANS</span>')

function disegna() {
  const sch = V.scheda
  dlg.classList.toggle('sci', sch === 'sci')
  for (const b of dlg.querySelectorAll('[data-scheda]')) b.setAttribute('aria-selected', String(b.dataset.scheda === sch))
  for (const b of dlg.querySelectorAll('[data-m]')) b.setAttribute('aria-pressed', String(b.dataset.m === S.modo))
  el.n.textContent = S.storia.length || ''
  el.calc.hidden = sch === 'storia'
  el.storia.hidden = sch !== 'storia'
  el.modi.hidden = sch !== 'sci'
  // gon / deg / rad sullo schermo quando conta: in scientifica, o se l'espressione ha seni e coseni
  const trig = sch === 'sci' || /sin|cos|tan/.test(S.expr) || /sin|cos|tan/.test(fatto?.expr ?? '')
  el.modo.hidden = !trig
  el.modo.textContent = S.modo.toUpperCase()

  el.schermo.classList.toggle('ko', !!errore)
  el.eti.innerHTML = errore ? `espressione <em>— ${esc(errore)}</em>` : fatto && !S.expr ? 'risultato' : 'espressione'

  const r = adesso()
  el.copia.disabled = r === null
  if (fatto && !S.expr) {
    // dopo l'uguale: sopra il conto fatto, grande il risultato
    el.prima.innerHTML = `${bella(fatto.expr)} =`
    el.riga.className = 'ca-riga ris'
    el.riga.innerHTML = `<span class="ca-txt">${esc(fatto.ris)}</span>`
    el.poi.textContent = ''
    misura(fatto.ris.length)
  } else {
    el.prima.innerHTML = S.ans ? `ANS = ${esc(num(S.ans))}` : ''
    el.riga.className = 'ca-riga'
    el.riga.innerHTML = `<span class="ca-txt">${S.expr ? bella(S.expr) : '<span class="vuoto">0</span>'}<i class="ca-cursore"></i></span>`
    // sotto, quello che verrebbe (non se è solo un numero, né con l'errore)
    el.poi.textContent = r !== null && !/^[\d,]+$/.test(S.expr) && !errore ? `= ${r}` : ''
    misura(S.expr.length)
  }
  el.riga.scrollLeft = el.riga.scrollWidth

  if (sch === 'storia') {
    el.storia.innerHTML = S.storia.length
      ? S.storia.map(([e, v], i) => `<button type="button" class="ca-st" data-st="${i}" title="riprendi questo conto"><span>${bella(e)}</span><b>= ${esc(v)}</b></button>`).join('') + '<button type="button" class="ca-svuota" data-svuota>svuota la cronologia</button>'
      : '<p class="ca-vuota"><b>Niente qui, per ora</b>gli ultimi risultati vengono qui (anche quelli del cercapersone)</p>'
  }
}
/** Più è lungo, più è piccolo (fino a metà), poi scorre. */
function misura(n) { el.riga.style.setProperty('--ca-k', String(Math.max(0.55, Math.min(1, 12 / Math.max(1, n))))) }
