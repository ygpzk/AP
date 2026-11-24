// LE APP SINGOLE (19.11, pzkko: «prendi anche virtual, miniera, borsa pzk/eur, convertitori numeri, ecc... e fai app singole
// per ognuno e mettile nei progetti»): un'app del cercapersone da sola, in una finestra sopra il profilo. Niente 3D e niente
// menu: lo schermo di pzk os (telefono/zero/os/os.js, lo stesso lcd a 8 bit che sta sotto il vetro dello zero) steso piatto e
// grande, fermo su quell'app, coi sei tasti dello zero sotto (la croce, OK, INDIETRO) per chi tocca. Le app sono quelle vere
// (os/miniera.js, os/banca.js, os/conversioni.js…), coi soldi, lo zaino e il conto di sempre: qui non c'è una riga delle loro
// regole. INDIETRO dalla prima pagina dell'app chiude la finestra (sul cercapersone tornerebbe al desktop).
//
// - quasi tutte si aprono anche da ospite (os.apri con libera; l'elenco è OSPITE, qui sotto);
// - la rapina vuole il conto, come sul cercapersone: da ospite si apre prima l'accesso del sito (accesso/accesso.js).
// - «borsa» è l'app banca aperta sulla pagina della borsa (la seconda: un → appena aperta).
//
//   apri(id)    apre la finestra sull'app (id di pzk os: miniera, banca, conversioni, calcolatrice, compilatore, cucina, rapina…)
//   chiudi()
import * as pzk from '../games/pzk.js'
import * as zaino from '../chat/zaino.js'
import { src as icona } from '../chat/icone.js'

/** Le app che si aprono da sole: il nome sulla finestra e l'icona (le altre prendono quelli del menu di pzk os). */
const NOMI = {
  miniera: 'Miniera', banca: 'Borsa $pzk', conversioni: 'Convertitori', calcolatrice: 'Calcolatrice', compilatore: 'Codice C',
  cucina: 'Cucina del Mincio', rapina: 'Rapina', virtual: 'Virtual', lavatrice: 'Lavatrice', decifratore: 'Decifratore', pzkstore: 'pzkstore',
}
// quelle che vanno anche da ospite (provate una per una il 19.11): gli attrezzi, che non toccano soldi, e la miniera, la
// borsa e la cucina, che da ospite girano coi $pzk della sessione senza salvare, come la chat e i tavoli del sito. Le altre
// (la rapina: il colpo, la galera e la cauzione stanno sul conto) vogliono il conto: da ospite si apre prima l'accesso
const OSPITE = new Set(['conversioni', 'calcolatrice', 'compilatore', 'miniera', 'banca', 'cucina'])
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

let dlg = null, tela = null, g = null, mezzo = null, gm = null, os = null, APP = []
let aperta = null // l'id dell'app aperta
let orologio = 0, tastieraPrima, campo = null, chiusura = 0, aprendo = false

const ora = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function css() {
  return new Promise((ok) => {
    if (document.querySelector('link[data-schermo]')) return ok()
    const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: new URL('schermo.css', import.meta.url).pathname })
    l.setAttribute('data-schermo', '')
    l.addEventListener('load', ok, { once: true }); l.addEventListener('error', ok, { once: true })
    document.head.appendChild(l)
  })
}

// ── lo schermo: la tela dell'lcd (1536 × 768, tre texel per pixel con la griglia) ricopiata sulla nostra. Grande quanto
// basta si ricopia com'è; piccola passa dai 512 × 256 pixel veri (senza griglia), come fa il tasto del muro ──
function misura() {
  const d = Math.min(devicePixelRatio || 1, 3), w = Math.max(2, Math.round(tela.clientWidth * d)), h = Math.round(w / 2)
  if (w !== tela.width || h !== tela.height) { tela.width = w; tela.height = h; return true }
  return false
}
function disegna() {
  if (!dlg?.open || !tela.width) return
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'
  if (tela.width >= 1024) g.drawImage(os.lcd.canvas, 0, 0, tela.width, tela.height)
  else { gm.imageSmoothingEnabled = false; gm.drawImage(os.lcd.canvas, 0, 0, 512, 256); g.drawImage(mezzo, 0, 0, tela.width, tela.height) }
}
const pixel = (e) => { const r = tela.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * os.W, y: ((e.clientY - r.top) / r.height) * os.H } }

function premi(nome) {
  if (!aperta) return
  if (nome === 'chiudi') return chiudi()
  if (nome === 'ok') os.tasto('ok')
  else if (nome === 'indietro') { if (os.scrivendo()) os.cancella(); else if (!os.tasto('indietro')) chiudi() }
  else os.tasto(nome)
}

async function costruisci() {
  if (dlg) return
  const [o, t] = await Promise.all([import('./zero/os/os.js'), import('./telefono.js'), css()])
  os = o; APP = t.APP
  dlg = document.createElement('dialog')
  dlg.className = 'sch'
  dlg.innerHTML = `<div class="sch__corpo" tabindex="-1">
      <header class="sch__testa"><img class="sch__ico" alt="" draggable="false"><div class="sch__nome"><b></b><span>pzk os · un’app sola</span></div>
        <button type="button" class="sch__x" data-t="chiudi" aria-label="chiudi" title="chiudi (Esc)"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></header>
      <div class="sch__vetro"><canvas class="sch__lcd" aria-label="lo schermo dell’app"></canvas></div>
      <div class="sch__tasti" role="group" aria-label="i tasti">
        <div class="sch__croce"><button type="button" data-t="su" aria-label="su">▲</button><button type="button" data-t="sx" aria-label="sinistra">◀</button><button type="button" data-t="dx" aria-label="destra">▶</button><button type="button" data-t="giu" aria-label="giù">▼</button></div>
        <p class="sch__come"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> si muove · <kbd>Invio</kbd> OK · <kbd>Backspace</kbd> indietro · lo schermo si clicca</p>
        <div class="sch__due"><button type="button" class="sch__ind" data-t="indietro" aria-label="indietro">↩</button><button type="button" class="sch__ok" data-t="ok">OK</button></div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  tela = dlg.querySelector('.sch__lcd'); g = tela.getContext('2d', { alpha: false })
  mezzo = document.createElement('canvas'); mezzo.width = 512; mezzo.height = 256; gm = mezzo.getContext('2d', { alpha: false })
  os.lcd.ascolta(disegna)
  new ResizeObserver(() => { if (dlg.open && misura()) disegna() }).observe(tela)

  // le app del menu di pzk os (apri le cerca lì), se il cercapersone non le ha già messe
  const appOs = () => APP.filter((a) => !a.se || a.se()).map((a) => ({ id: a.id, nome: a.nome, icona: a.icona }))
  os.configura({ app: appOs() })
  zaino.ascolta?.(() => { if (dlg.open) os.configura({ app: appOs() }) })
  // tornati al desktop (INDIETRO dalla prima pagina dell'app, o usciti dal conto): la finestra si chiude
  os.ascoltaVista((v) => {
    clearTimeout(chiusura)
    if (!aperta || aprendo || !dlg.open || v?.nome !== 'home') return
    chiusura = setTimeout(() => { if (aperta && !aprendo && dlg.open && os.corrente()?.nome === 'home') chiudi() }, 80)
  })

  // i tasti sotto lo schermo, il clic sullo schermo, la tastiera
  dlg.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]')
    if (t) { premi(t.dataset.t); if (t.dataset.t !== 'chiudi') dlg.querySelector('.sch__corpo').focus({ preventScroll: true }); return }
    if (e.target === dlg) chiudi() // fuori dalla finestra
  })
  tela.addEventListener('pointerdown', (e) => { const p = pixel(e); if (os.tocca(p.x, p.y)) e.preventDefault(); else if (matchMedia('(pointer: coarse)').matches && os.scrivendo?.()) campo.focus({ preventScroll: true }) })
  tela.addEventListener('pointermove', (e) => { const p = pixel(e); tela.style.cursor = os.cliccabile(p.x, p.y) ? 'pointer' : '' })
  dlg.addEventListener('keydown', (e) => {
    const ctrlInvio = e.key === 'Enter' && (e.ctrlKey || e.metaKey)
    if (!aperta || e.altKey || ((e.ctrlKey || e.metaKey) && !ctrlInvio) || e.target === campo) return
    if (e.target.closest?.('button') && (e.key === 'Enter' || e.key === ' ')) return // (un tasto col fuoco: lo preme il browser)
    const v = { ArrowRight: 'dx', ArrowLeft: 'sx', ArrowUp: 'su', ArrowDown: 'giu' }[e.key]
    if (v) { e.preventDefault(); os.tasto(v) }
    else if (e.key === 'Enter') { e.preventDefault(); if (!e.repeat) { if (ctrlInvio) os.tasto('ok'); else os.invio() } }
    else if (e.key === 'Backspace') { e.preventDefault(); if (os.scrivendo()) os.cancella(); else if (!e.repeat && !os.tasto('indietro')) chiudi() }
    else if (e.key === 'Tab') { e.preventDefault(); os.tasto('dx') }
    else if (e.key === 'Escape') { e.preventDefault(); if (!e.repeat && !os.tasto('indietro')) chiudi() }
    else if (e.key.length === 1) { e.preventDefault(); os.carattere(e.key) }
  })
  dlg.addEventListener('cancel', (e) => e.preventDefault()) // (Esc lo guarda il keydown: prima indietro, dalla prima pagina chiude)
  dlg.addEventListener('close', pulisci)

  // sul telefono: il campo invisibile che fa uscire la tastiera quando pzk os scrive (come telefono.js)
  campo = document.createElement('input')
  Object.assign(campo, { type: 'text', autocomplete: 'off', spellcheck: false, enterKeyHint: 'done', className: 'sch__scrivi' })
  campo.setAttribute('autocapitalize', 'off'); campo.setAttribute('aria-label', 'scrivi')
  dlg.appendChild(campo)
  campo.addEventListener('beforeinput', (e) => {
    e.preventDefault()
    if (!aperta) return
    if (e.inputType === 'deleteContentBackward') os.cancella()
    else if (e.inputType === 'insertLineBreak') os.invio()
    else if (e.data) for (const ch of e.data) os.carattere(ch)
  })
  campo.addEventListener('input', () => { if (campo.value) { for (const ch of campo.value) os.carattere(ch); campo.value = '' } })
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); os.invio() }
    else if (e.key === 'Escape') { e.preventDefault(); os.tasto('indietro') }
  })
}
const tastieraVera = (si, { numeri = false } = {}) => {
  if (si) { campo.inputMode = numeri ? 'decimal' : 'text'; if (matchMedia('(pointer: coarse)').matches) campo.focus({ preventScroll: true }) }
  else if (document.activeElement === campo) { campo.blur(); dlg.querySelector('.sch__corpo')?.focus({ preventScroll: true }) }
}
/** Quello che va rimesso a posto quando la finestra non c'è più (chiusa da noi o dal browser). */
function pulisci() {
  if (!aperta) return
  aperta = null
  clearInterval(orologio); clearTimeout(chiusura)
  os.conTastieraVera(tastieraPrima ?? null)
  os.home()
}

export async function apri(id) {
  await costruisci()
  const borsa = id === 'borsa'
  if (borsa) id = 'banca'
  const a = APP.find((x) => x.id === id)
  if (!a || !os.pronta(id)) return false
  if (dlg.open) { if (aperta === id) return true; pulisci(); dlg.close() }
  // le app coi soldi vogliono il conto: da ospite prima l'accesso del sito (se non si entra, niente app)
  if (!OSPITE.has(id) && !pzk.conto()) {
    try { await (await import('../accesso/accesso.js')).accedi() } catch (e) { console.warn('schermo: accesso', e) }
    if (!pzk.conto()) return false
    await Promise.resolve(zaino.sincronizza?.()).catch(() => {})
  }
  dlg.querySelector('.sch__ico').src = icona(a.icona)
  dlg.querySelector('.sch__nome b').textContent = NOMI[id] ?? a.nome
  dlg.setAttribute('aria-label', NOMI[id] ?? a.nome)
  dlg.classList.remove('chiude')
  aperta = id
  tastieraPrima = os.conTastieraVera(tastieraVera)
  dlg.showModal()
  dlg.querySelector('.sch__corpo').focus({ preventScroll: true })
  const stato = () => os.stato({ ora: ora(), nome: pzk.conto()?.nome ?? '' })
  stato(); clearInterval(orologio); orologio = setInterval(stato, 15_000)
  os.avvia()
  os.home()
  misura()
  // (un'app del pzkstore che non hai: la sua scheda nel pzkstore, come dal cercapersone)
  aprendo = true
  try {
    if (a.store && a.se && !a.se()) await os.apri('pzkstore', { comando: id })
    else await os.apri(id, { libera: OSPITE.has(id) })
    if (borsa && os.corrente()?.app === 'banca') os.tasto('dx') // (il portafoglio è la prima pagina, la borsa la seconda)
  } finally { aprendo = false }
  if (os.corrente()?.nome === 'home') { chiudi(); return false } // (non si è aperta: la rete, o il conto che manca)
  os.ridisegna(); disegna()
  return true
}

export async function chiudi() {
  if (!dlg?.open) return
  pulisci()
  if (!RIDOTTO.matches) {
    dlg.classList.add('chiude')
    await new Promise((ok) => { dlg.addEventListener('animationend', ok, { once: true }); setTimeout(ok, 260) })
    dlg.classList.remove('chiude')
  }
  dlg.close()
}
export const aperto = () => !!dlg?.open
