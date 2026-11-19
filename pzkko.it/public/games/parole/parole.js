// PAROLE di pzkko.it (19.11, Alberto: «ricrea da zero trivia e parole in stile pzk»): indovina la parola italiana in sei
// tentativi, coi $pzk sopra. Rifatto da zero rispetto al primo Parole (React, nel vecchio sito): qui è un foglio col nastro
// come i tavoli (../foglio.css), e non decide niente. La parola la pesca la banca e la tiene lei; a ogni tentativo la banca
// controlla che stia nel dizionario, fa i colori e a partita finita paga (azioni 'parole.inizia', 'parole.prova',
// 'parole.arrendi'). La partita aperta sta nel conto (pzk.tavoloBanca('parole')): chiudendo, ricaricando o cambiando
// dispositivo si ritrova com'era.
//
// Si paga secondo il tentativo in cui si indovina (la tabella la manda la banca): prima la prendi, più torna.
//
//   apri()   apre il foglio (lo carica la prima volta)
import * as pzk from '../pzk.js'

const G = 'parole'
const RIGHE = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const FICHES = [[5, '#b3121f'], [25, '#1f7a4a'], [100, '#161616'], [500, '#e8b800']]
// (la stessa della banca, per disegnarla prima della prima partita; in gioco vale quella che arriva con la partita)
const PAGA = { 5: [20, 8, 4, 2.5, 1.5, 1], 6: [25, 10, 5, 3, 2, 1.2] }
const MAX = 6
const CHIAVE = 'pzkko-parole'
const volte = (v) => `×${v.toLocaleString('it-IT')}`
const ordinale = (n) => `${n}°`
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

// fase: 'punta' (si sceglie e si comincia) · 'gioco' · 'fine' (la parola si vede; «ancora» ricomincia)
const S = { fase: 'punta', lettere: 5, puntata: 25, righe: [], scritta: '', paga: PAGA[5], esito: null, parola: '', torna: 0, occupato: false, nuova: -1 }
let dlg = null, el = {}

function ricorda() { try { localStorage.setItem(CHIAVE, JSON.stringify({ lettere: S.lettere, puntata: S.puntata })) } catch {} }
function ricordato() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && [5, 6].includes(s.lettere)) S.lettere = s.lettere
    if (s && FICHES.some(([n]) => n === s.puntata)) S.puntata = s.puntata
  } catch {}
}
/** La partita com'è sulla banca (aperta, o appena finita) nello stato di qui. */
function prendi(v) {
  if (!v || !Array.isArray(v.righe)) return false
  Object.assign(S, { fase: v.fase === 'gioco' ? 'gioco' : 'fine', lettere: v.lettere, puntata: v.puntata, righe: v.righe.map(([p, c]) => [p, c]), paga: v.paga ?? PAGA[v.lettere], esito: v.esito ?? null, parola: v.parola ?? '', torna: v.torna ?? 0 })
  return true
}

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) { dlg.classList.remove('chiude'); dlg.showModal() }
  // una partita lasciata aperta (anche da un altro dispositivo) si ritrova; una finita no: si riparte dalla puntata
  const t = pzk.tavoloBanca(G)
  if (!S.occupato) {
    if (t?.fase === 'gioco') { prendi(t); S.scritta = ''; voce(`la parola di prima ti aspetta: tentativo ${S.righe.length + 1} di ${MAX}`) }
    else if (S.fase !== 'fine') { S.fase = 'punta'; S.righe = []; S.scritta = ''; S.paga = PAGA[S.lettere]; voce('scegli la puntata e gioca') }
  }
  disegna()
  el.dentro.focus({ preventScroll: true })
}

async function costruisci() {
  ricordato()
  await Promise.all(['../foglio.css', 'parole.css'].map((f) => new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL(f, import.meta.url).pathname
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })))
  dlg = document.createElement('dialog')
  dlg.className = 'fg rovescio pa'
  dlg.setAttribute('aria-labelledby', 'pa-titolo')
  dlg.innerHTML = `
    <div class="fg-dentro" tabindex="-1">
      <header class="fg-testa"><h2 id="pa-titolo">parole</h2><p class="fg-voce" role="status" aria-live="polite"></p>
        <button type="button" class="fg-chiudi" data-chiudi aria-label="chiudi"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button></header>
      <div class="pa-corpo">
        <div class="pa-griglia" role="grid" aria-label="i tentativi"></div>
        <div class="pa-lato">
          <h3>quanto torna, secondo il tentativo</h3>
          <ol class="pa-paga"></ol>
          <div class="pa-scelte" role="group" aria-label="quante lettere"><h3>lettere</h3>${[5, 6].map((n) => `<button type="button" class="pa-let" data-lettere="${n}">${n}</button>`).join('')}</div>
          <div class="pa-scelte" role="group" aria-label="la puntata">${FICHES.map(([n, c]) => `<button type="button" class="pa-fiche" data-n="${n}" style="--f:${c}" aria-label="${n} $pzk">${n}</button>`).join('')}</div>
          <div class="pa-azioni"><button type="button" class="fg-tasto" data-gioca>gioca</button><button type="button" class="fg-link" data-arrendi hidden>mi arrendo</button></div>
          <div class="pa-fondo"><p class="fg-saldo"><small>hai</small><b data-saldo></b><i data-sotto></i></p><p class="fg-nota">soldi finti: niente premi,<br>niente pagamenti.</p></div>
        </div>
        <div class="pa-tasti" aria-label="la tastiera">${RIGHE.map((r, i) => `<div>${i === 2 ? '<button type="button" class="pa-k largo" data-k="Enter">invio</button>' : ''}${[...r].map((k) => `<button type="button" class="pa-k" data-k="${k}">${k}</button>`).join('')}${i === 2 ? '<button type="button" class="pa-k largo" data-k="Backspace" aria-label="cancella">cancella</button>' : ''}</div>`).join('')}</div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = { dentro: q('.fg-dentro'), voce: q('.fg-voce'), griglia: q('.pa-griglia'), paga: q('.pa-paga'), gioca: q('[data-gioca]'), arrendi: q('[data-arrendi]'), saldo: q('[data-saldo]'), sotto: q('[data-sotto]'), tasti: q('.pa-tasti') }
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) return chiudi()
    const k = e.target.closest('[data-k]')
    if (k) return tasto(k.dataset.k)
    const l = e.target.closest('[data-lettere]')
    if (l && S.fase !== 'gioco' && !S.occupato) { S.lettere = Number(l.dataset.lettere); S.paga = PAGA[S.lettere]; if (S.fase === 'fine') { S.fase = 'punta'; S.righe = [] } ricorda(); return disegna() }
    const f = e.target.closest('[data-n]')
    if (f && S.fase !== 'gioco' && !S.occupato) { S.puntata = Number(f.dataset.n); ricorda(); return disegna() }
    if (e.target.closest('[data-gioca]')) return gioca()
    if (e.target.closest('[data-arrendi]')) return arrendi()
  })
  dlg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'Enter' && e.target.closest('button') && !e.target.closest('[data-k]') && S.fase === 'gioco') return // (un tasto col fuoco fa il suo)
    if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); tasto(e.key) }
  })
  pzk.osserva(saldo)
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude') }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', fine, { once: true })
}

function voce(t, scossa = false) {
  if (!el.voce) return
  el.voce.textContent = t
  if (scossa && !RIDOTTO.matches) { el.voce.classList.remove('scossa'); void el.voce.offsetWidth; el.voce.classList.add('scossa') }
}
function saldo() {
  if (!el.saldo) return
  el.saldo.textContent = `$pzk ${pzk.fmt(pzk.saldo())}`
  el.sotto.textContent = S.fase === 'gioco' ? `sul tavolo ${pzk.fmt(S.puntata)}` : pzk.conto()?.nome ? `conto ${pzk.conto().nome}` : 'sessione di prova'
}

// ── il disegno: la griglia, la tabella, i tasti, i comandi ──
function disegna() {
  const n = S.lettere, fatte = S.righe.length
  el.griglia.dataset.n = n
  el.griglia.style.setProperty('--n', n)
  el.griglia.innerHTML = Array.from({ length: MAX }, (_, r) => {
    const fatta = S.righe[r], attiva = S.fase === 'gioco' && r === fatte
    const lettere = fatta ? fatta[0] : attiva ? S.scritta : ''
    return `<div class="pa-riga${attiva ? ' attiva' : ''}" role="row">${Array.from({ length: n }, (_, i) => `<span class="pa-c${fatta ? ` ${fatta[1][i]}${r === S.nuova ? ' gira' : ''}` : lettere[i] ? ' piena' : ''}" style="--i:${i}" role="gridcell">${lettere[i] ?? ''}</span>`).join('')}</div>`
  }).join('')
  S.nuova = -1
  // la tabella: la riga del tentativo di adesso evidenziata, quelle passate cancellate
  el.paga.innerHTML = S.paga.map((v, i) => `<li class="${S.fase === 'gioco' ? (i < fatte ? 'passato' : i === fatte ? 'ora' : '') : S.fase === 'fine' && S.esito === 'presa' && i === fatte - 1 ? 'ora' : ''}"><span>al ${ordinale(i + 1)}</span><b><small>×</small>${v.toLocaleString('it-IT')}</b></li>`).join('')
  // i tasti: per ogni lettera il colore migliore visto (verde > giallo > grigio)
  const visto = {}
  for (const [p, c] of S.righe) for (let i = 0; i < p.length; i++) { const v = c[i]; if (v === 'g' || (v === 'c' && visto[p[i]] !== 'g') || (v === 'n' && !visto[p[i]])) visto[p[i]] = v }
  for (const k of el.tasti.querySelectorAll('[data-k]')) if (k.dataset.k.length === 1) k.className = `pa-k${visto[k.dataset.k] ? ` ${visto[k.dataset.k]}` : ''}`
  const inGioco = S.fase === 'gioco'
  for (const b of dlg.querySelectorAll('[data-lettere]')) { b.setAttribute('aria-pressed', String(Number(b.dataset.lettere) === n)); b.disabled = inGioco }
  for (const b of dlg.querySelectorAll('[data-n]')) { b.setAttribute('aria-pressed', String(Number(b.dataset.n) === S.puntata)); b.disabled = inGioco }
  el.gioca.textContent = inGioco ? 'prova' : S.fase === 'fine' ? 'ancora' : 'gioca'
  el.gioca.disabled = S.occupato || (inGioco && S.scritta.length !== n)
  el.arrendi.hidden = !inGioco
  el.arrendi.disabled = S.occupato
  saldo()
}

// ── le mosse ──
function tasto(k) {
  if (S.occupato) return
  if (S.fase !== 'gioco') { if (k === 'Enter') gioca(); return }
  if (k === 'Enter') return prova()
  if (k === 'Backspace') S.scritta = S.scritta.slice(0, -1)
  else if (/^[a-zA-Z]$/.test(k) && S.scritta.length < S.lettere) S.scritta += k.toLowerCase()
  else return
  disegna()
}
async function gioca() {
  if (S.occupato) return
  if (S.fase === 'gioco') return prova()
  S.occupato = true
  el.gioca.disabled = true
  voce('la banca pesca la parola…')
  const r = await pzk.fai('parole.inizia', { puntata: S.puntata, lettere: S.lettere }).catch(() => null)
  S.occupato = false
  if (!r?.ok) { voce(r?.errore ?? 'la banca non risponde: riprova', true); return disegna() }
  prendi(r.esito.vede)
  S.scritta = ''
  voce(`${S.lettere} lettere, sei tentativi: scrivi la prima`)
  disegna()
  el.dentro.focus({ preventScroll: true })
}
async function prova() {
  if (S.occupato || S.fase !== 'gioco') return
  if (S.scritta.length !== S.lettere) { scossa(); return voce(`servono ${S.lettere} lettere`, true) }
  S.occupato = true
  el.gioca.disabled = true
  const r = await pzk.fai('parole.prova', { parola: S.scritta }).catch(() => null)
  S.occupato = false
  if (!r?.ok) { scossa(); voce(r?.errore ?? 'la banca non risponde: riprova', true); return disegna() }
  const n = S.righe.length
  prendi(r.esito.vede)
  S.scritta = ''
  S.nuova = n // (la riga appena fatta si gira, casella per casella)
  if (S.fase === 'fine') fine(r.esito)
  else {
    const giuste = [...r.esito.colori].filter((c) => c === 'g').length
    voce(giuste === S.lettere - 1 ? 'manca una lettera sola' : giuste ? `${giuste} al posto giusto: se la prendi ora torna ${volte(S.paga[S.righe.length])}` : `tentativo ${S.righe.length + 1} di ${MAX}`)
  }
  disegna()
}
async function arrendi() {
  if (S.occupato || S.fase !== 'gioco') return
  S.occupato = true
  const r = await pzk.fai('parole.arrendi').catch(() => null)
  S.occupato = false
  if (!r?.ok) { voce(r?.errore ?? 'la banca non risponde: riprova', true); return disegna() }
  prendi(r.esito.vede)
  fine(r.esito)
  disegna()
}
function fine() {
  if (S.esito === 'presa') voce(`presa al ${ordinale(S.righe.length)}: tornano ${pzk.fmt(S.torna)} $pzk`)
  else voce(`era «${S.parola}»: ${pzk.fmt(S.puntata)} $pzk andati`)
}
function scossa() {
  if (RIDOTTO.matches) return
  const r = el.griglia.children[S.righe.length]
  if (!r) return
  r.classList.remove('scossa'); void r.offsetWidth; r.classList.add('scossa')
}
