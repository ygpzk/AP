// ANGOLI di pzkko.it (19.11, Alberto: «cerca in AP tanto tempo fa anche il gioco angoli e rifallo»): quanto è largo
// l'angolo? Rifatto da zero rispetto al primo Angoli (React, nel vecchio sito, giugno 2026): qui è un foglio col nastro come
// Parole e Trivia (../foglio.css), col pennarello al posto dei colori al neon. Il gioco è rimasto quello:
//
//   · due semirette e un arco, girati a caso: si scrive l'ampiezza in gradi centesimali (g, da 1 a 399: il giro è 400g,
//     l'angolo retto 100g: sono i gradi del geometra);
//   · cinque passi: l'angolo è sempre un multiplo di 20g, 10g, 5g, 2g oppure 1g, e più il passo è piccolo più è difficile;
//   · a ogni tentativo sbagliato l'indizio: «più grande» o «più piccolo»;
//   · una partita dura un minuto: più in fretta si prende l'angolo, più punti (i centesimi di secondo risparmiati su venti
//     secondi), e allo scadere si vede il totale;
//   · la fila sale solo se lo si prende al primo colpo; a 3, 5, 7 e 10 di fila arrivano i quattro timbri.
//
// Non ci sono $pzk: si gioca per il record, che resta nel browser (localStorage «pzkko-angoli», uno per passo).
//
//   apri()   apre il foglio (lo carica la prima volta)

const PASSI = [[20, 'novizio'], [10, 'praticante'], [5, 'esperto'], [2, 'professionista'], [1, 'maestro']]
const DURA = 60_000, PIENO = 20_000
const TIMBRI = [[3, 'geometra dilettante'], [5, 'geometra esperto'], [7, 'geometra professionista'], [10, 'trofeo della geometria piana']]
// i pennarelli: [le semirette, l'arco]
const PENNE = [['#161616', '#b3121f'], ['#1446a0', '#e8501c'], ['#23864a', '#7a1fa2'], ['#b3121f', '#1446a0'], ['#161616', '#23864a'], ['#7a1fa2', '#c98a00']]
const CHIAVE = 'pzkko-angoli'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const it = (n) => n.toLocaleString('it-IT')
const caso = (n) => Math.floor(Math.random() * n)

// fase: 'scegli' (il passo, e si comincia) · 'gioco' · 'fine' (la pagella)
const S = { fase: 'scegli', passo: 10, angolo: 70, rot: 20, penna: PENNE[0], scritto: '', storia: [], tentativi: 0, punti: 0, presi: 0, fila: 0, filaMax: 0, scade: 0, partito: 0, fermo: false, preso: null, nuovoRecord: false, timbro: null }
const M = { record: {}, fila: 0, timbri: [] } // quello che resta
let dlg = null, el = {}, raf = 0, attesa = 0

function ricordato() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (!s) return
    if (PASSI.some(([p]) => p === s.passo)) S.passo = s.passo
    if (s.record && typeof s.record === 'object') M.record = s.record
    M.fila = Number(s.fila) || 0
    M.timbri = Array.isArray(s.timbri) ? s.timbri : []
  } catch {}
}
function ricorda() { try { localStorage.setItem(CHIAVE, JSON.stringify({ passo: S.passo, ...M })) } catch {} }

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) { dlg.classList.remove('chiude'); dlg.showModal() }
  if (S.fase === 'scegli') { esempio(); voce('scegli il passo e gioca') }
  disegna()
  el.dentro.focus({ preventScroll: true })
}

async function costruisci() {
  ricordato()
  await Promise.all(['../foglio.css', 'angoli.css'].map((f) => new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL(f, import.meta.url).pathname
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })))
  dlg = document.createElement('dialog')
  dlg.className = 'fg an'
  dlg.setAttribute('aria-labelledby', 'an-titolo')
  dlg.innerHTML = `
    <div class="fg-dentro" tabindex="-1">
      <header class="fg-testa"><h2 id="an-titolo">angoli</h2><p class="fg-voce" role="status" aria-live="polite"></p>
        <button type="button" class="fg-chiudi" data-chiudi aria-label="chiudi"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button></header>
      <div class="an-corpo">
        <div class="an-foglio">
          <div class="an-figura" aria-label="l'angolo da indovinare"></div>
          <p class="an-tempo" hidden><b data-tempo>60,0</b><small>secondi</small><span class="an-barra"><i></i></span></p>
        </div>
        <div class="an-lato">
          <section class="an-scegli">
            <h3>quanto è largo l'angolo?</h3>
            <ul class="an-regole"><li>si misura in <b>gradi centesimali</b>: il giro è 400g, l'angolo retto 100g</li><li>se sbagli ti dico se è <b>più grande</b> o <b>più piccolo</b></li><li>hai <b>un minuto</b>: più sei svelto, più punti</li></ul>
            <h3>il passo</h3>
            <div class="an-passi" role="group" aria-label="il passo">${PASSI.map(([p, n]) => `<button type="button" class="an-passo" data-passo="${p}"><b>${p}g</b><span>${n}</span></button>`).join('')}</div>
            <p class="an-record"></p>
          </section>
          <section class="an-gioco" hidden>
            <dl class="an-conti"><div><dt>punti</dt><dd data-punti>0</dd></div><div><dt>di fila</dt><dd data-fila>0</dd></div><div><dt>record</dt><dd data-record>0</dd></div></dl>
            <p class="an-scritto" aria-label="la tua risposta"><b data-scritto></b><i>g</i></p>
            <ol class="an-storia" aria-label="i tentativi"></ol>
            <div class="an-tasti" aria-label="i numeri">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'canc', '0', 'invio'].map((k) => `<button type="button" class="an-k${k.length > 1 ? ' largo' : ''}" data-k="${k === 'canc' ? 'Backspace' : k === 'invio' ? 'Enter' : k}">${k}</button>`).join('')}</div>
          </section>
          <section class="an-fine" hidden>
            <h3>la pagella</h3>
            <p class="an-totale"><b data-totale>0</b><small>punti</small><em data-nuovo hidden>nuovo record!</em></p>
            <dl class="an-conti"><div><dt>angoli presi</dt><dd data-presi>0</dd></div><div><dt>fila più lunga</dt><dd data-filamax>0</dd></div><div><dt>record</dt><dd data-record2>0</dd></div></dl>
            <ul class="an-timbri" aria-label="i timbri"></ul>
          </section>
          <div class="an-azioni"><button type="button" class="fg-tasto" data-gioca>gioca</button><button type="button" class="fg-link" data-cambia hidden>cambia passo</button><button type="button" class="fg-link" data-smetti hidden>smetto</button></div>
        </div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = { dentro: q('.fg-dentro'), voce: q('.fg-voce'), figura: q('.an-figura'), tempo: q('.an-tempo'), sec: q('[data-tempo]'), barra: q('.an-barra i'), scegli: q('.an-scegli'), gioco: q('.an-gioco'), fine: q('.an-fine'), record: q('.an-record'), scritto: q('[data-scritto]'), casella: q('.an-scritto'), storia: q('.an-storia'), gioca: q('[data-gioca]'), cambia: q('[data-cambia]'), smetti: q('[data-smetti]'), timbri: q('.an-timbri') }
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('close', ferma)
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) return chiudi()
    const k = e.target.closest('[data-k]')
    if (k) return tasto(k.dataset.k)
    const p = e.target.closest('[data-passo]')
    if (p && S.fase === 'scegli') { S.passo = Number(p.dataset.passo); ricorda(); esempio(); return disegna() }
    if (e.target.closest('[data-gioca]')) return comincia()
    if (e.target.closest('[data-cambia]')) { S.fase = 'scegli'; esempio(); voce('scegli il passo e gioca'); return disegna() }
    if (e.target.closest('[data-smetti]')) return finisce(true)
  })
  dlg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (S.fase !== 'gioco') { if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); comincia() } return }
    if (e.key === 'Enter' && e.target.closest('button') && !e.target.closest('[data-k]')) return // (un tasto col fuoco fa il suo)
    if (e.key === 'Enter' || e.key === 'Backspace' || /^[0-9]$/.test(e.key)) { e.preventDefault(); tasto(e.key) }
  })
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude') }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', fine, { once: true })
}
/** Chiudendo a partita in corso la partita finisce lì (il minuto non resta a correre da solo). */
function ferma() {
  cancelAnimationFrame(raf); clearTimeout(attesa)
  if (S.fase === 'gioco') { S.fase = 'scegli'; S.fermo = false }
}

function voce(t, scossa = false) {
  if (!el.voce) return
  el.voce.textContent = t
  if (scossa && !RIDOTTO.matches) { el.voce.classList.remove('scossa'); void el.voce.offsetWidth; el.voce.classList.add('scossa') }
}

// ── la figura: due semirette con la freccia, l'arco e il vertice, a pennarello ──
const rad = (g) => (g * Math.PI) / 200
function freccia(x, y, dx, dy) {
  const s = 15, a = 7
  return `M${(x - s * dx - a * dy).toFixed(1)} ${(y - s * dy + a * dx).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x - s * dx + a * dy).toFixed(1)} ${(y - s * dy - a * dx).toFixed(1)}`
}
/** `scritta`: cosa c'è scritto dentro l'arco («?» finché si gioca, l'ampiezza quando si scopre). */
function figura(g, rot, [semi, arco], scritta, viva = true) {
  const c = 200, r = 178, ra = 72, t = rad(g)
  const x2 = c + r * Math.cos(t), y2 = c + r * Math.sin(t), ax = c + ra * Math.cos(t), ay = c + ra * Math.sin(t), grande = g > 200 ? 1 : 0
  // la scritta sta sulla bisettrice, fuori dal gruppo girato: così resta dritta
  const b = t / 2 + (rot * Math.PI) / 180, rs = g < 50 ? 132 : 120
  const sx = c + rs * Math.cos(b), sy = c + rs * Math.sin(b)
  return `<svg viewBox="0 0 400 400" class="an-svg${viva ? ' viva' : ''}" aria-hidden="true">
    <g transform="rotate(${rot} 200 200)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path class="an-spicchio" d="M${c} ${c}L${c + ra} ${c}A${ra} ${ra} 0 ${grande} 1 ${ax.toFixed(1)} ${ay.toFixed(1)}Z" fill="${arco}" stroke="none"/>
      <path class="an-arco" pathLength="1" d="M${c + ra} ${c}A${ra} ${ra} 0 ${grande} 1 ${ax.toFixed(1)} ${ay.toFixed(1)}" stroke="${arco}" stroke-width="6"/>
      <path class="an-semi s1" pathLength="1" d="M${c} ${c}L${c + r} ${c}" stroke="${semi}" stroke-width="7"/>
      <path class="an-semi s2" pathLength="1" d="M${c} ${c}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${semi}" stroke-width="7"/>
      <path class="an-punta" d="${freccia(c + r, c, 1, 0)}" stroke="${semi}" stroke-width="6"/>
      <path class="an-punta" d="${freccia(x2, y2, Math.cos(t), Math.sin(t))}" stroke="${semi}" stroke-width="6"/>
      <circle class="an-vertice" cx="${c}" cy="${c}" r="9" fill="${semi}" stroke="none"/>
    </g>
    <text class="an-quanto" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" fill="${arco}" text-anchor="middle" dominant-baseline="central">${scritta}</text>
  </svg>`
}
function esempio() {
  S.angolo = nuovoAngolo(S.passo); S.rot = caso(360); S.penna = PENNE[caso(PENNE.length)]
  S.scritto = ''; S.storia = []; S.preso = null
}
const nuovoAngolo = (passo) => (caso(Math.floor(399 / passo)) + 1) * passo

// ── il disegno ──
function disegna({ figuraNuova = true } = {}) {
  const f = S.fase
  el.scegli.hidden = f !== 'scegli'; el.gioco.hidden = f !== 'gioco'; el.fine.hidden = f !== 'fine'
  el.tempo.hidden = f === 'scegli'
  if (figuraNuova) el.figura.innerHTML = figura(S.angolo, S.rot, S.penna, f === 'gioco' && S.preso == null ? '?' : `${S.angolo}g`)
  for (const b of dlg.querySelectorAll('[data-passo]')) b.setAttribute('aria-pressed', String(Number(b.dataset.passo) === S.passo))
  const rec = M.record[S.passo] || 0
  el.record.innerHTML = rec ? `il tuo record a ${S.passo}g: <b>${it(rec)}</b> punti` : `a ${S.passo}g non hai ancora un record`
  el.gioca.textContent = f === 'gioco' ? 'provo' : f === 'fine' ? 'ancora' : 'gioca'
  el.gioca.hidden = f === 'gioco'
  el.cambia.hidden = f !== 'fine'
  el.smetti.hidden = f !== 'gioco'
  if (f === 'gioco') conti()
  if (f === 'fine') {
    dlg.querySelector('[data-totale]').textContent = it(S.punti)
    dlg.querySelector('[data-nuovo]').hidden = !S.nuovoRecord
    dlg.querySelector('[data-presi]').textContent = S.presi
    dlg.querySelector('[data-filamax]').textContent = S.filaMax
    dlg.querySelector('[data-record2]').textContent = it(M.record[S.passo] || 0)
    el.timbri.innerHTML = TIMBRI.map(([n, nome]) => `<li class="${M.timbri.includes(n) ? 'preso' : ''}"><b>${n}</b><span>${nome}</span></li>`).join('')
  }
}
function conti() {
  dlg.querySelector('[data-punti]').textContent = it(S.punti)
  dlg.querySelector('[data-fila]').textContent = S.fila
  dlg.querySelector('[data-record]').textContent = it(M.record[S.passo] || 0)
  el.scritto.textContent = S.preso != null ? S.angolo : S.scritto
  el.casella.classList.toggle('vuoto', !S.scritto && S.preso == null)
  el.casella.classList.toggle('preso', S.preso != null)
  el.storia.innerHTML = S.storia.slice(-4).map(([n, su]) => `<li class="${su ? 'su' : 'giu'}"><b>${n}g</b><span>${su ? '↑ più grande' : '↓ più piccolo'}</span></li>`).join('')
}
function orologio() {
  const resta = Math.max(0, S.scade - performance.now())
  el.sec.textContent = (Math.ceil(resta / 100) / 10).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  el.barra.style.transform = `scaleX(${resta / DURA})`
  el.tempo.classList.toggle('poco', resta < 10_000)
  if (resta <= 0) return finisce()
  raf = requestAnimationFrame(orologio)
}

// ── le mosse ──
function comincia() {
  if (S.fase === 'gioco') return prova()
  Object.assign(S, { fase: 'gioco', punti: 0, presi: 0, fila: 0, filaMax: 0, nuovoRecord: false, timbro: null, fermo: false })
  S.scade = performance.now() + DURA
  giro()
  cancelAnimationFrame(raf); raf = requestAnimationFrame(orologio)
  voce(`multipli di ${S.passo}g, da ${S.passo} a ${Math.floor(399 / S.passo) * S.passo}: scrivi e premi invio`)
  el.dentro.focus({ preventScroll: true })
}
function giro() {
  let a = nuovoAngolo(S.passo)
  if (a === S.angolo) a = nuovoAngolo(S.passo) // (due uguali di fila, quasi mai)
  Object.assign(S, { angolo: a, rot: caso(360), penna: PENNE[caso(PENNE.length)], scritto: '', storia: [], tentativi: 0, preso: null, fermo: false, partito: performance.now() })
  disegna()
}
function tasto(k) {
  if (S.fase !== 'gioco' || S.fermo) return
  if (k === 'Enter') return prova()
  if (k === 'Backspace') S.scritto = S.scritto.slice(0, -1)
  else if (/^[0-9]$/.test(k) && S.scritto.length < 3 && !(k === '0' && !S.scritto)) S.scritto += k
  else return
  conti()
}
function sbagliato(t) {
  voce(t, true)
  if (RIDOTTO.matches) return
  el.casella.classList.remove('scossa'); void el.casella.offsetWidth; el.casella.classList.add('scossa')
}
function prova() {
  if (S.fase !== 'gioco' || S.fermo) return
  const n = parseInt(S.scritto, 10)
  if (!S.scritto || Number.isNaN(n)) return sbagliato('scrivi un numero')
  if (n < 1 || n > 399) return sbagliato('fra 1g e 399g')
  if (n % S.passo) return sbagliato(`qui solo multipli di ${S.passo}g`)
  if (S.storia.some(([v]) => v === n)) return sbagliato(`${n}g l'hai già provato`)
  S.tentativi++
  if (n !== S.angolo) {
    const su = S.angolo > n
    S.storia.push([n, su]); S.scritto = ''
    voce(su ? `più grande di ${n}g` : `più piccolo di ${n}g`, true)
    return conti()
  }
  // preso: i punti sono i centesimi di secondo risparmiati su venti secondi; la fila sale solo al primo colpo
  const ms = performance.now() - S.partito, punti = Math.max(0, Math.round((PIENO - ms) / 10)), primo = S.tentativi === 1
  S.punti += punti; S.presi++; S.preso = punti; S.fermo = true
  S.fila = primo ? S.fila + 1 : 0
  S.filaMax = Math.max(S.filaMax, S.fila)
  if (S.fila > M.fila) M.fila = S.fila
  const timbro = primo && TIMBRI.find(([q]) => q === S.fila && !M.timbri.includes(q))
  if (timbro) { M.timbri.push(timbro[0]); S.timbro = timbro }
  ricorda()
  voce(timbro ? `${timbro[0]} di fila: ${timbro[1]}!` : `${S.angolo}g, preso${primo ? ' al primo colpo' : ''}: +${it(punti)}`)
  disegna()
  clearTimeout(attesa)
  attesa = setTimeout(() => { if (S.fase === 'gioco') giro() }, timbro ? 1500 : 850)
}
function finisce(smesso = false) {
  cancelAnimationFrame(raf); clearTimeout(attesa)
  if (S.fase !== 'gioco') return
  S.fase = 'fine'; S.fermo = false
  const prima = M.record[S.passo] || 0
  S.nuovoRecord = S.punti > prima
  if (S.nuovoRecord) M.record[S.passo] = S.punti
  ricorda()
  el.sec.textContent = smesso ? el.sec.textContent : '0,0'
  if (!smesso) el.barra.style.transform = 'scaleX(0)'
  voce(S.preso == null ? `${smesso ? 'fermato' : 'tempo'}: questo era ${S.angolo}g` : smesso ? 'fermato' : 'tempo!')
  disegna()
  el.gioca.focus({ preventScroll: true })
}
