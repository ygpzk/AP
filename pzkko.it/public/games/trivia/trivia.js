// TRIVIA di pzkko.it (19.11, Alberto: «ricrea da zero trivia e parole in stile pzk»): otto domande, quindici secondi
// l'una, e ogni risposta giusta paga in $pzk. Rifatto da zero rispetto al primo Trivia (React, il quiz di Storia
// dell'Architettura del vecchio sito): qui è un foglio col nastro come i tavoli (../foglio.css) e le domande sono quelle
// del mondo pzk, le stesse del quiz del cercapersone. Non decide niente: le domande, le risposte giuste, il tempo e i
// pagamenti li tiene la banca (chat/quiz.js → 'quiz.nuova', 'quiz.prossima', 'quiz.rispondi'); al browser arriva una
// domanda alla volta, senza la risposta giusta.
//
//   apri()   apre il foglio (lo carica la prima volta)
import * as pzk from '../pzk.js'
import * as quiz from '../../chat/quiz.js'
import { icona, esiste } from '../../chat/icone.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const LETTERE = 'ABCD'
const DIFF = ['', 'facile', 'media', 'difficile']

// schermo: 'scelta' (l'argomento) · 'domanda' · 'esito' (la risposta data, in attesa di «avanti») · 'fine' (la pagella)
const S = { schermo: 'scelta', arg: null, p: null, esito: null, scelta: null, occupato: false, timer: 0, fineTempo: 0 }
let dlg = null, el = {}

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) { dlg.classList.remove('chiude'); dlg.showModal() }
  if (S.schermo === 'scelta') voce('di cosa parliamo?')
  disegna()
  el.dentro.focus({ preventScroll: true })
}

async function costruisci() {
  await Promise.all(['../foglio.css', 'trivia.css'].map((f) => new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL(f, import.meta.url).pathname
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })))
  dlg = document.createElement('dialog')
  dlg.className = 'fg tv'
  dlg.setAttribute('aria-labelledby', 'tv-titolo')
  dlg.innerHTML = `
    <div class="fg-dentro" tabindex="-1">
      <header class="fg-testa"><h2 id="tv-titolo">trivia</h2><p class="fg-voce" role="status" aria-live="polite"></p>
        <button type="button" class="fg-chiudi" data-chiudi aria-label="chiudi"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button></header>
      <div class="tv-corpo"><div class="tv-schermo"></div>
        <div class="tv-fondo"><p class="fg-saldo"><small>hai</small><b data-saldo></b><i data-sotto></i></p><p class="fg-nota">soldi finti: niente premi, niente pagamenti.</p></div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = { dentro: q('.fg-dentro'), voce: q('.fg-voce'), schermo: q('.tv-schermo'), saldo: q('[data-saldo]'), sotto: q('[data-sotto]') }
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) return chiudi()
    const a = e.target.closest('[data-arg]')
    if (a) { S.arg = a.dataset.arg || null; return disegna() }
    const r = e.target.closest('[data-r]')
    if (r) return rispondi(Number(r.dataset.r))
    if (e.target.closest('[data-via]')) return comincia()
    if (e.target.closest('[data-avanti]')) return avanti()
    if (e.target.closest('[data-cambia]')) { S.schermo = 'scelta'; voce('di cosa parliamo?'); return disegna() }
  })
  dlg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (S.schermo === 'domanda') {
      const n = S.p?.d?.risposte.length ?? 0
      const i = '1234'.includes(k) ? Number(k) - 1 : 'abcd'.includes(k) && k.length === 1 ? 'abcd'.indexOf(k) : S.p?.d?.vf && (k === 'v' || k === 'f') ? (k === 'v' ? 0 : 1) : -1
      if (i >= 0 && i < n) { e.preventDefault(); rispondi(i) }
    } else if (e.key === 'Enter' && !e.target.closest('button')) {
      e.preventDefault()
      if (S.schermo === 'esito') avanti(); else comincia()
    }
  })
  pzk.osserva(saldo)
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  fermaTempo()
  // (chiudendo a domanda aperta il tempo della banca continua: la domanda scade lì, come sul cercapersone)
  if (S.schermo === 'domanda' || S.schermo === 'esito') { S.schermo = 'scelta'; S.p = null }
  const fine = () => { dlg.close(); dlg.classList.remove('chiude') }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', fine, { once: true })
}
function voce(t, scossa = false) {
  el.voce.textContent = t
  if (scossa && !RIDOTTO.matches) { el.voce.classList.remove('scossa'); void el.voce.offsetWidth; el.voce.classList.add('scossa') }
}
function saldo() {
  if (!el.saldo) return
  el.saldo.textContent = `$pzk ${pzk.fmt(pzk.saldo())}`
  el.sotto.textContent = pzk.conto()?.nome ? `conto ${pzk.conto().nome}` : 'sessione di prova'
}
const ico = (n) => (n && esiste(n) ? icona(n) : '')

// ── il disegno ──
function disegna() {
  saldo()
  if (S.schermo === 'scelta') return disegnaScelta()
  if (S.schermo === 'fine') return disegnaFine()
  disegnaDomanda()
}
function disegnaScelta() {
  const restano = quiz.restanti()
  el.schermo.className = 'tv-schermo tv-scelta'
  el.schermo.innerHTML = `
    <div class="tv-argomenti" role="group" aria-label="l'argomento">
      <button type="button" class="tv-arg tutto" data-arg="" aria-pressed="${S.arg === null}">${ico('dado')}di tutto</button>
      ${quiz.TUTTI_ARGOMENTI.filter(([id]) => id !== 'vario').map(([id, nome, ic]) => `<button type="button" class="tv-arg" data-arg="${esc(id)}" aria-pressed="${S.arg === id}">${ico(ic)}<span>${esc(nome)}</span></button>`).join('')}
    </div>
    <p class="tv-regole"><b>${quiz.PER_PARTITA}</b> domande, <b>${quiz.TEMPO}</b> secondi l’una. Giusta: <b>${quiz.PAGA.slice(1).join(' · ')}</b> $pzk secondo la difficoltà, tutte giuste <b>+${quiz.BONUS_PERFETTA}</b>. Oggi ${restano > 0 ? `restano <b>${restano}</b> risposte pagate` : 'le risposte pagate sono finite: si gioca per la gloria'}.</p>
    <div class="tv-sotto"><button type="button" class="fg-tasto" data-via ${S.occupato ? 'disabled' : ''}>via</button></div>`
}
function disegnaDomanda() {
  const p = S.p, d = p.d, e = S.esito
  const punti = Array.from({ length: p.n }, (_, i) => `<i class="${i < p.esitiVisti.length ? (p.esitiVisti[i] ? 'si' : 'no') : i === p.esitiVisti.length && !e ? 'ora' : ''}"></i>`).join('')
  el.schermo.className = 'tv-schermo tv-domanda'
  el.schermo.innerHTML = `
    <div class="tv-su"><span class="tv-conta">${Math.min(p.n, S.numero)} di ${p.n}</span><span class="tv-punti" aria-hidden="true">${punti}</span><span class="tv-diff">${DIFF[d.diff] ?? ''}${d.diff ? ` · ${quiz.PAGA[d.diff]} $pzk` : ''}</span></div>
    <div class="tv-tempo" aria-hidden="true"><i></i></div>
    <div class="tv-mezzo"><p class="tv-q${d.q.length > 110 ? ' lunga' : ''}">${esc(d.q)}</p>${d.img ? `<figure class="tv-foto"><img src="${esc(d.img)}" alt="" decoding="async">${d.credito ? `<figcaption>${esc(d.credito)}</figcaption>` : ''}</figure>` : ''}</div>
    <div class="tv-risposte">${d.risposte.map((r, i) => {
      const cl = !e ? '' : i === e.indiceGiusto ? ' giusta' : i === S.scelta ? ' sbagliata' : ' spenta'
      return `<button type="button" class="tv-r${cl}" data-r="${i}" ${e || S.occupato ? 'disabled' : ''}><b>${d.vf ? (i === 0 ? 'V' : 'F') : LETTERE[i]}</b><span>${esc(r)}</span></button>`
    }).join('')}</div>
    <div class="tv-sotto"><p class="tv-nota">${e ? esc(e.nota ?? '') : ''}</p>${e ? `<button type="button" class="fg-tasto" data-avanti>${p.finita ? 'pagella' : 'avanti'}</button>` : ''}</div>`
  if (!e) tempo()
  else el.schermo.querySelector('[data-avanti]')?.focus({ preventScroll: true })
}
function disegnaFine() {
  const p = S.p, perfetta = p.giuste === p.n
  el.schermo.className = 'tv-schermo tv-fine'
  el.schermo.innerHTML = `
    <h3>${perfetta ? 'tutte giuste!' : p.giuste >= p.n / 2 ? 'non male' : 'si può fare di meglio'}</h3>
    <p class="tv-voto${perfetta ? ' perfetta' : ''}">${p.giuste}<small> su ${p.n}</small></p>
    <ul class="tv-conti"><li><b>${pzk.fmt(p.guadagnato ?? 0)}</b>$pzk guadagnati</li><li><b>${p.xp ?? 0}</b>xp</li>${p.bonus ? `<li><b>+${pzk.fmt(p.bonus)}</b>bonus perfetta</li>` : ''}<li><b>${quiz.record()}</b>serie migliore</li></ul>
    <div class="tv-azioni"><button type="button" class="fg-tasto" data-via>ancora</button><button type="button" class="fg-link" data-cambia>cambia argomento</button></div>`
  el.schermo.querySelector('[data-via]')?.focus({ preventScroll: true })
}

// ── il tempo: la barra cala in quindici secondi; a zero la banca riceve «niente risposta» ──
function fermaTempo() { clearTimeout(S.timer); S.timer = 0 }
function tempo() {
  const barra = el.schermo.querySelector('.tv-tempo i')
  const resta = Math.max(0, S.fineTempo - Date.now())
  if (barra) {
    barra.style.transition = 'none'
    barra.style.transform = `scaleX(${resta / (quiz.TEMPO * 1000)})`
    requestAnimationFrame(() => requestAnimationFrame(() => { barra.style.transition = `transform ${resta}ms linear`; barra.style.transform = 'scaleX(0)' }))
  }
  fermaTempo()
  S.timer = setTimeout(() => rispondi(null), resta)
}

// ── la partita ──
async function comincia() {
  if (S.occupato) return
  S.occupato = true
  voce('la banca sceglie le domande…')
  disegna()
  const p = await quiz.nuova(S.arg)
  if (p.errore) { S.occupato = false; S.schermo = 'scelta'; voce(p.errore, true); return disegna() }
  p.esitiVisti = []
  S.p = p
  S.numero = 0
  await domanda()
}
async function domanda() {
  S.occupato = true
  const r = await quiz.prossima(S.p)
  S.occupato = false
  if (r !== true) { S.schermo = 'scelta'; voce(r.errore, true); return disegna() }
  S.schermo = 'domanda'; S.esito = null; S.scelta = null
  S.numero++
  S.fineTempo = Date.now() + quiz.TEMPO * 1000
  voce(S.p.d.vf ? 'vero o falso?' : S.p.d.img ? 'guarda bene la foto' : `domanda ${S.numero}`)
  disegna()
  el.dentro.focus({ preventScroll: true })
}
async function rispondi(i) {
  if (S.schermo !== 'domanda' || S.occupato) return
  S.occupato = true
  fermaTempo()
  S.scelta = i
  const barra = el.schermo.querySelector('.tv-tempo i')
  if (barra) { const w = getComputedStyle(barra).transform; barra.style.transition = 'none'; barra.style.transform = w }
  for (const b of el.schermo.querySelectorAll('[data-r]')) b.disabled = true
  const e = await quiz.rispondi(S.p, i)
  S.occupato = false
  if (e.errore) { S.schermo = 'scelta'; voce(e.errore, true); return disegna() }
  S.esito = e
  S.schermo = 'esito'
  S.p.esitiVisti.push(!!e.giusta)
  voce(e.giusta ? (e.pagato ? `giusta: +${pzk.fmt(e.premio)} $pzk${e.serie > 1 ? ` · ${e.serie} di fila` : ''}` : 'giusta (oggi le pagate sono finite)') : i === null ? 'tempo scaduto' : 'sbagliata', !e.giusta)
  disegna()
}
async function avanti() {
  if (S.schermo !== 'esito' || S.occupato) return
  if (S.p.finita) { S.schermo = 'fine'; voce(S.p.giuste === S.p.n ? 'pagella perfetta' : 'la pagella'); return disegna() }
  await domanda()
}
