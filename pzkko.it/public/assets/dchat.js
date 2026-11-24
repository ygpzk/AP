// pzkko.it: la chat col bot pzk, vestita da canale di Discord.
// I COMANDI SONO QUELLI VERI del cercapersone (chat/comandi/*, lo stesso motore della chat di pzk os: le attese, gli
// eventi casuali, il cercapersone scassato, i soldi della banca). Qui cambia solo il vestito: ogni comando riceve il suo
// «ctx» e le schede diventano gli embed di Discord, coi tasti veri, le griglie dei minigiochi, i rulli e le barre del tempo.
// I soldi e lo zaino sono gli stessi del cercapersone e dei tavoli: con l'account si salvano nella banca, senza si gioca
// coi 1.000 $pzk della sessione.
// TUTTO IN CHAT (19.11, pzkko: «non farmi uscire e andare al flipper, tutto qui gira, 100% qui tutto in chat»): quello che
// nel cercapersone è un'app qui è una scheda. Il conto si apre e si crea nel riquadro dell’accesso (accesso/accesso.js: l’email e un codice, contoQui),
// i tavoli partono dalla barra in alto (tavolo: quanto, su cosa, e parte il comando), il virtual, il pzkstore e la
// lavatrice sono schede coi tasti (virtualQui, storeQui, lavatriceQui). Solo «/telefono» apre il cercapersone 3D, e lo apre
// sopra questa pagina, senza andare da nessuna parte.

import * as pzk from '/games/pzk.js'
import * as zaino from '/chat/zaino.js'
import * as chat from '/chat/chat.js'
import { icona, conIcone, esiste } from '/chat/icone.js'
import { COMANDI, PER_NOME, CATEGORIE } from '/chat/comandi/index.js'
import { eventoCasuale, salutoIniziale } from '/chat/comandi/eventi.js'
import { NEGOZIO, PER_ID } from '/chat/testi.js'
import { prezzoDi } from '/chat/mercato.js'

const { fmt, pzkHtml, eurHtml, nome, importo, caso, rnd, tra, durata, analizza, dormi } = chat
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const TINTE = { rosso: '#f23f43', verde: '#23a55a', oro: '#f0b232', ambra: '#e67e22', blu: '#5865f2', viola: '#9b59b6', grigio: '#80848e' }
// la barra dei tavoli: ognuno parte qui in chat. su: le puntate fra cui scegliere dopo la cifra ([id, scritta, stile]);
// cmd: il comando che fa già tutto da sé
const TAVOLI = [
  { id: 'roulette', nome: 'Roulette', su: [['rosso', 'rosso', 'rosso'], ['nero', 'nero', 'nero'], ['pari'], ['dispari'], ['basso', '1–18'], ['alto', '19–36']] },
  { id: 'blackjack', nome: 'Blackjack' },
  { id: 'mine', nome: 'Mine', su: [['3', '3 mine'], ['5', '5 mine'], ['10', '10 mine'], ['20', '20 mine']] },
  { id: 'dado', nome: 'Dado', su: [['piccolo'], ['grande'], ['pari'], ['dispari'], ['triple']] },
  { id: 'moneta', nome: 'Testa o croce', su: [['testa'], ['croce']] },
  { id: 'slot', nome: 'Slot' },
  { id: 'dadi', nome: 'Dadi' },
  { id: 'virtual', nome: 'Virtual', cmd: 'virtual' },
  { id: 'parole', nome: 'Parole', cmd: 'parole', icona: 'quiz' },
  { id: 'quiz', nome: 'Trivia', cmd: 'quiz' },
]

let radice = null, lista = null, campo = null, pop = null, apriQui = () => {}
let coda = Promise.resolve(), aspettaTesto = null, scelte = [], salutato = false
const inCorso = new Map()

const ora = () => new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date())
const inFondo = () => { if (lista) lista.scrollTop = lista.scrollHeight }
const etichetta = (grezza) => (esiste(String(grezza)) ? icona(String(grezza)) : conIcone(esc(String(grezza)).replace(/&lt;(\/?(?:b|i|small|code))&gt;/g, '<$1>')))
const avatarMio = () => document.querySelector('#avatar')?.currentSrc || '/me.png'

function riga(classe, html) {
  const el = document.createElement('div')
  el.className = `dc__msg ${classe}`
  el.innerHTML = html
  lista.append(el)
  while (lista.children.length > 160) lista.firstElementChild.remove()
  inFondo()
  return el
}
export function utente(testo) {
  const m = /^(\/[^\s]+)(.*)$/s.exec(testo)
  const corpo = m ? `<span class="dc__slashcmd">${esc(m[1])}</span>${esc(m[2])}` : conIcone(esc(testo))
  return riga('dc__msg--tu', `<img class="dc__av" src="${esc(avatarMio())}" alt=""><div class="dc__body"><div class="dc__meta"><b>${esc(nome())}</b><time>${ora()}</time></div><div class="dc__txt">${corpo}</div></div>`)
}
export function sistema(testo) { return riga('dc__msg--sis', `<div class="dc__sis">${conIcone(testo)}</div>`) }

// ── qui, non nel cercapersone: le frasi dei comandi che mandavano all'app account o al pzkstore del cercapersone ──
const QUI = [
  [/crealo o entra nell[’']app account del cercapersone/gi, 'crealo o entra con <code>/account</code>'],
  [/Crea il conto nell[’']app account del cercapersone/g, 'Crea il conto con <code>/account</code>'],
  [/crealo nel cercapersone \(app account\)/gi, 'crealo con /account'],
  [/crealo nell[’']app account/gi, 'crealo con <code>/account</code>'],
  [/Entra nel wallet per tenerli/g, 'Con <code>/account</code> li tieni'],
  [/← → scelgono un tasto, OK lo preme, oppure scrivi tu\./g, 'premi un tasto, oppure scrivi <code>/</code> e scegli.'],
  [/apro l[’']account/g, 'ti apro l’account qui'],
  [/, o nell[’']app <b>pzkstore<\/b> del cercapersone, con tutte le schede/g, ''],
  [/apri il <b>pzkstore<\/b> del cercapersone \(o scrivi (<code>[^<]+<\/code>)\)/g, 'scrivi $1'],
]
const qui = (t) => QUI.reduce((x, [a, b]) => x.replace(a, b), String(t))
const quiAzioni = (azioni) => azioni
  .filter(([cmd, eti]) => !(cmd === 'pzkstore' && /apri il pzkstore/.test(eti ?? ''))) // (l'elenco è già il pzkstore)
  .map(([cmd, eti, stile]) => (cmd === 'telefono' && /conto|account/.test(eti ?? '') ? ['account', ':app-account: crea il conto', stile] : [cmd, eti, stile]))

// ── le schede del bot: gli embed ──
function disegna(s, e) {
  const m = s.__msg
  e = { ...e, ...(e.d && { d: qui(e.d) }), ...(e.html && { html: qui(e.html) }), ...(e.pie && { pie: qui(e.pie) }), ...(e.azioni && { azioni: quiAzioni(e.azioni) }) }
  m.e = { ...e }
  s.className = `c-scheda ${e.colore ?? 'grigio'}`
  s.style.setProperty('--tinta', e.colore === 'arcobaleno' ? '#f0b232' : TINTE[e.colore] ?? TINTE.grigio)
  const q = (c) => s.querySelector(`:scope > .${c}`)
  q('c-titolo').innerHTML = e.t ? conIcone(e.t) : ''
  q('c-testo').innerHTML = e.d ? conIcone(String(e.d)).replace(/\n/g, '<br>') : ''
  q('c-html').innerHTML = e.html ? conIcone(e.html) : ''
  q('c-campi').innerHTML = (e.campi ?? []).map(([k, v]) => `<div><dt>${conIcone(k)}</dt><dd>${conIcone(String(v))}</dd></div>`).join('')
  q('c-pie').innerHTML = e.pie ? conIcone(e.pie) : ''
  q('c-azioni').innerHTML = (e.azioni ?? []).map(([cmd, eti, stile]) => `<button type="button" class="c-b ${esc(stile ?? '')}" data-cmd="${esc(cmd)}">${conIcone(eti ?? cmd)}</button>`).join('')
  for (const el of s.querySelectorAll(':scope > div')) if (!el.matches('.c-bottoni, .c-griglia, .c-tempo')) el.hidden = !el.innerHTML
  const av = m.riga.querySelector('.dc__av')
  const src = `/art/chat-bot/${esiste(e.av ?? '') ? e.av : m.av ?? 'bot'}.webp`
  if (e.av && esiste(e.av)) m.av = e.av
  if (av.getAttribute('src') !== src) av.src = src
  inFondo()
}
export function scheda(e) {
  const m = { e: { ...e }, fatto: false, av: 'bot', scelte: [] }
  m.riga = riga('dc__msg--bot', `<img class="dc__av" src="/art/chat-bot/bot.webp" alt=""><div class="dc__body"><div class="dc__meta"><b class="dc__bot">pzk</b><span class="dc__tag">APP</span><time>${ora()}</time></div>
    <div class="dc__scrive"><i></i><i></i><i></i></div>
    <div class="c-scheda" hidden><div class="c-titolo"></div><div class="c-testo"></div><div class="c-html"></div><dl class="c-campi"></dl><div class="c-tempo" hidden><i></i></div><div class="c-azioni"></div><div class="c-pie"></div></div></div>`)
  const s = m.riga.querySelector('.c-scheda')
  s.__msg = m
  Object.defineProperty(s, '__pronta', { get: () => m.pronta })
  Object.defineProperty(s, '__fatto', { get: () => m.fatto })
  disegna(s, e)
  const mostra = () => { m.fatto = true; m.riga.querySelector('.dc__scrive')?.remove(); s.hidden = false; inFondo() }
  m.mostra = mostra
  if (RIDOTTO.matches) { mostra(); m.pronta = Promise.resolve() }
  else {
    m.pronta = coda = coda.then(async () => {
      if (m.fatto) return
      await new Promise((r) => { m.salta = r; setTimeout(r, chat.RITARDO_MS) })
      mostra()
    }).catch(() => {})
  }
  return s
}
export function aggiorna(s, e) {
  const m = s.__msg
  if (!m.fatto) { m.salta?.(); m.mostra() }
  if (e.senzaTasti) for (const r of s.querySelectorAll(':scope > .c-bottoni, :scope > .c-griglia')) if (!scelte.some((sc) => sc.riga === r)) r.remove()
  disegna(s, e)
  return s
}
export function tempo(s, ms) {
  const barra = s.querySelector(':scope > .c-tempo'), i = barra.firstElementChild
  barra.hidden = false
  i.style.transition = 'none'; i.style.width = '100%'
  requestAnimationFrame(() => requestAnimationFrame(() => { i.style.transition = `width ${ms}ms linear`; i.style.width = '0%' }))
  return () => { const w = getComputedStyle(i).width; i.style.transition = 'none'; i.style.width = w }
}
/** I tasti sotto la scheda: → Promise dell'id premuto (null allo scadere). griglia: g3 | g5 (le celle di un minigioco). */
export async function scegli(s, bottoni, ms = 0, { griglia = null, onPremuto = null } = {}) {
  const m = s.__msg
  await m.pronta
  const r = document.createElement('div')
  r.className = griglia ? `c-griglia ${griglia}` : 'c-bottoni'
  r.innerHTML = bottoni.map((b) => `<button type="button" class="c-b ${esc(b.stile ?? '')}" data-id="${esc(b.id)}">${etichetta(b.eti ?? b.id)}</button>`).join('')
  s.insertBefore(r, s.querySelector(':scope > .c-azioni'))
  inFondo()
  return new Promise((risolvi) => {
    const sc = { m, riga: r, timer: 0 }
    sc.fine = (id, premuto) => {
      if (sc.finita) return
      sc.finita = true
      clearTimeout(sc.timer)
      for (const b of r.querySelectorAll('button')) b.disabled = true
      premuto?.classList.add('premuto')
      scelte = scelte.filter((x) => x !== sc)
      risolvi(id)
    }
    r.addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-id]')
      if (!b || b.disabled || sc.finita) return
      if (onPremuto) { const esito = onPremuto(b.dataset.id, b, r); if (esito === 'continua') return; if (esito !== undefined) return sc.fine(esito, b) }
      sc.fine(b.dataset.id, b)
    })
    scelte.push(sc)
    m.scelte.push(sc)
    if (ms > 0) sc.timer = setTimeout(() => sc.fine(null, null), ms)
  })
}
/** Aspetta che si scriva qualcosa nella riga: → Promise del testo (null allo scadere). */
export function scrivi(ms = 0, { segnaposto = 'scrivi qui…' } = {}) {
  return new Promise((risolvi) => {
    let timer = 0
    const prima = campo.placeholder
    const parola = /^[A-ZÀ-Ü0-9]{3,}$/.test(segnaposto.trim()) ? segnaposto.trim() : null
    const tasto = parola ? riga('dc__msg--sis', `<button type="button" class="c-b oro" data-parola="${esc(parola)}">${esc(parola)}</button>`) : null
    aspettaTesto = { risolvi: (t) => { clearTimeout(timer); aspettaTesto = null; campo.placeholder = prima; tasto?.remove(); risolvi(t) } }
    campo.placeholder = segnaposto
    campo.focus({ preventScroll: true })
    if (ms > 0) timer = setTimeout(() => aspettaTesto?.risolvi(null), ms)
  })
}
export function smetti(s) {
  const m = s?.__msg
  for (const sc of [...scelte]) if (!m || sc.m === m) sc.fine(null, null)
  aspettaTesto?.risolvi(null)
}
export async function inVista(s, ms = 0) { await s.__msg.pronta; if (ms) await dormi(ms) }
export async function pensa(ms = 700) {
  const el = riga('dc__msg--bot', `<img class="dc__av" src="/art/chat-bot/bot-pensa.webp" alt=""><div class="dc__body"><div class="dc__scrive"><i></i><i></i><i></i></div></div>`)
  await dormi(ms)
  el.remove()
}

// ── i comandi: lo stesso giro della chat di pzk os (attese, scassato, eventi) ──
const RICOMPRA = /^(cercapersone|pager)$/i
const passaDaRotto = (c, testo) => c?.nomi[0] === 'lavora' || (c?.nomi[0] === 'compra' && RICOMPRA.test(testo.trim()))
const soloScassato = () => scheda({ colore: 'rosso', av: 'bot-triste', t: ':pager: cercapersone scassato', d: `col vetro rotto funzionano solo due cose: <code>lavora</code> e <code>compra cercapersone</code> (${pzkHtml(prezzoDi(PER_ID.pager))}).`, azioni: [['lavora', ':rider: lavora', 'oro'], ['compra cercapersone', ':pager: compra il nuovo']] })
// ── le app del cercapersone, qui in chat ──
/** Quello che un comando chiede di aprire nel cercapersone, in chat: lo shop è il negozio, il virtual, il pzkstore e la
 *  lavatrice hanno la loro scheda; senza app («/telefono») si apre il cercapersone 3D sopra la pagina. Le poche app che
 *  esistono solo sul cercapersone lo dicono, col tasto per aprirlo lì. */
function apriApp(app, { app: dentro } = {}) {
  if (!app) return apriQui('zero')
  if (app === 'account') return contoQui()
  if (app === 'negozio') return esegui('negozio', { muto: true })
  if (app === 'virtual') return virtualQui()
  if (app === 'pzkstore') return storeQui(dentro)
  if (app === 'lavatrice') return lavatriceQui()
  return scheda({ colore: 'grigio', av: 'bot-pensa', t: `:telefono: «${esc(app)}» è un’app del cercapersone`, d: 'in chat non ha una scheda sua: si apre sul cercapersone, qui sopra, senza cambiare pagina.', azioni: [[`qui:zero:${app}`, ':telefono: apri sul cercapersone', 'oro']] })
}

/** Il pzkstore: senza app l'elenco (quello di «installa»), con un'app la sua scheda e il tasto per comprarla. */
async function storeQui(id) {
  const st = await import('/telefono/app/pzkstore.js')
  const x = id ? st.PER_ID[id] : null
  if (!x) return esegui('installa', { muto: true })
  const ha = zaino.installata(x.id)
  return scheda({
    colore: 'blu', t: `:${x.icona}: ${x.nome}`, d: `${x.breve}\n${(x.come ?? []).map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
    campi: [['prezzo', x.prezzo ? pzkHtml(x.prezzo) : 'gratis'], ['puliti', pzkHtml(pzk.puliti())]],
    azioni: ha ? (x.id === 'lavatrice' ? [['lavatrice', ':app-lavatrice: apri', 'oro']] : [[`qui:zero:${x.id}`, ':telefono: apri sul cercapersone', 'oro']]) : [[`installa ${x.id}`, `compra (${fmt(x.prezzo)})`, 'oro']],
    pie: ha ? 'ce l’hai già' : pzk.conto() ? 'si paga coi $pzk puliti, una volta sola' : 'serve il conto: /account',
  })
}

/** La lavatrice dei soldi sporchi: gira, è pronta da ritirare, o chiede quanti lavarne. */
async function lavatriceQui() {
  const L = await import('/telefono/app/lavatrice.js')
  const st = L.stato()
  if (st.gira) return scheda({ colore: 'blu', t: ':app-lavatrice: la lavatrice gira', d: `dentro ci sono ${pzkHtml(st.lav.n)}: puliti alle <b>${L.ora(st.lav.fino)}</b>, fra ${L.mmss(st.lav.fino - Date.now())}.`, azioni: [['lavatrice', 'guarda di nuovo']] })
  if (st.pronto) {
    const r = await L.ritira()
    return scheda(r.ok ? { colore: 'verde', av: 'bot-ride', t: ':app-lavatrice: lavaggio finito', d: `${pzkHtml(r.n)} adesso sono puliti.` } : { colore: 'rosso', av: 'bot-triste', d: esc(r.errore ?? 'la banca non risponde: riprova') })
  }
  if (st.dentro) return scheda({ colore: 'rosso', av: 'bot-triste', t: ':app-lavatrice: sei in galera', d: 'da dentro la lavatrice non parte.' })
  if (st.max < 1) return scheda({ colore: 'grigio', t: ':app-lavatrice: niente da lavare', d: 'non hai soldi sporchi: arrivano con le rapine.' })
  const s = scheda({ colore: 'ambra', t: ':app-lavatrice: quanti ne lavi?', d: `hai ${pzkHtml(st.sp)} sporchi e ${pzkHtml(st.pu)} puliti. Un lavaggio costa <b>${fmt(L.COSTO)} puliti</b>, dura dieci minuti e ne lava al più ${fmt(L.MAX)}.` })
  const tagli = [...new Set([st.max, Math.floor(st.max / 2), 10000, 5000].filter((v) => v >= 1 && v <= st.max))].sort((a, b) => b - a).slice(0, 4)
  const q = Number(await scegli(s, tagli.map((v) => ({ id: String(v), eti: fmt(v), stile: v === st.max ? 'oro' : '' })), 60_000))
  if (!q) return
  const r = await L.lava(q)
  return scheda(r?.ok ? { colore: 'verde', av: 'bot-occhiolino', t: ':app-lavatrice: gira', d: `${pzkHtml(q)} in lavatrice${r.fatto?.lavaggio?.fino ? `: puliti alle <b>${L.ora(r.fatto.lavaggio.fino)}</b>` : ''}.`, pie: `−${fmt(L.COSTO)} $pzk puliti di commissione` } : { colore: 'rosso', av: 'bot-triste', d: esc(r?.errore ?? 'non è andata') })
}

/** Il virtual: la partita di adesso con le quote, la giocata coi tasti (su cosa, quanto), e a partita finita com'è andata. */
const virtualAttese = new Set()
async function virtualQui() {
  const [P, SC] = await Promise.all([import('/games/virtual/partita.js'), import('/games/virtual/schedina.js')])
  SC.avvia()
  await SC.palinsesto()
  for (const c of await SC.riscuoti().catch(() => [])) virtualEsito(P, c)
  const f = P.fase(), p = P.partita(f.indice)
  const titolo = `:app-virtual: ${esc(p.casa.nome)} – ${esc(p.ospite.nome)}`
  const mie = SC.diPartita(f.indice).filter((b) => !b.pagata)
  const giocate = mie.length ? `\nle tue giocate: ${mie.map((b) => `<b>${esc(P.PER_PUNTATA.get(b.id)?.nome ?? b.id)}</b> ${fmt(b.puntata)} a ${SC.fmtQuota(b.quota)}`).join(', ')}.` : ''
  if (mie.length) virtualAspetta(P, SC, f.indice)
  if (!P.aperte(f)) {
    const inCampo = f.fase === 'partita', pt = inCampo ? P.punteggioA(SC.cronaca(f.indice), f.t) : null
    return scheda({ colore: 'verde', t: titolo, d: `${inCampo ? `in campo: <b>${pt.casa}–${pt.ospite}</b> al ${P.minuto(f.t).scritta}` : 'le giocate sono chiuse: fischio d’inizio'}. La prossima partita si gioca fra ${durata(f.manca + (inCampo ? 0 : P.DURATA))}.${giocate}`, azioni: [['virtual', ':app-virtual: guarda di nuovo']] })
  }
  const q = (id) => SC.fmtQuota(p.quote[id])
  const s = scheda({
    colore: 'verde', t: titolo, d: `il campionato inventato: una partita ogni cinque minuti. Le giocate chiudono fra <b>${durata(f.manca - P.CHIUDE)}</b>.${giocate}`,
    campi: [[`1 · ${esc(p.casa.sigla)}`, q('1')], ['X · pareggio', q('X')], [`2 · ${esc(p.ospite.sigla)}`, q('2')], ['over 2,5', q('O2.5')], ['under 2,5', q('U2.5')]],
    pie: `hai ${fmt(pzk.saldo())} $pzk · da ${fmt(SC.S.limiti.min)} a ${fmt(SC.S.limiti.giocata)} a giocata`,
  })
  const id = await scegli(s, [['1', `1 · ${q('1')}`], ['X', `X · ${q('X')}`], ['2', `2 · ${q('2')}`], ['O2.5', `over 2,5 · ${q('O2.5')}`], ['U2.5', `under 2,5 · ${q('U2.5')}`]].map(([i, eti]) => ({ id: i, eti })), Math.max(1000, f.manca - P.CHIUDE))
  if (!id) return
  const n = Number(await scegli(s, [10, 50, 100, 500].filter((v) => v <= SC.S.limiti.giocata).map((v) => ({ id: String(v), eti: `${v} $pzk`, stile: v === 50 ? 'oro' : '' })), 60_000))
  if (!n) return
  const r = await SC.punta(p, id, n)
  if (!r.ok) return scheda({ colore: 'rosso', av: 'bot-triste', t: ':app-virtual: giocata rifiutata', d: { chiuse: 'le giocate si sono appena chiuse.', secco: esc(pzk.perche?.() ?? 'non hai $pzk.'), ricarica: 'stanno arrivando altri $pzk: riprova fra un attimo.', nonbastano: 'non ti bastano i $pzk.', finiti: 'hai finito i $pzk.' }[r.motivo] ?? esc(r.errore ?? 'la banca non risponde.'), azioni: [['virtual', ':app-virtual: riprova']] })
  virtualAspetta(P, SC, p.indice)
  return scheda({ colore: 'verde', av: 'bot-occhiolino', t: ':app-virtual: giocata presa', d: `${pzkHtml(r.puntata)} su <b>${esc(P.PER_PUNTATA.get(id)?.nome ?? id)}</b> a ${SC.fmtQuota(r.quota)}: se entra tornano ${pzkHtml(Math.round(r.puntata * r.quota * 10) / 10)}.`, azioni: [['virtual', ':app-virtual: un’altra giocata']], pie: `${esc(p.casa.nome)} – ${esc(p.ospite.nome)} · il risultato te lo dico qui` })
}
function virtualEsito(P, c) {
  const vinto = c.torna > 0
  scheda({ colore: vinto ? 'oro' : 'grigio', av: vinto ? 'bot-ride' : 'bot-triste', t: `:app-virtual: ${esc(c.casa?.nome ?? c.casa)} – ${esc(c.ospite?.nome ?? c.ospite)}: ${c.risultato ? P.scriviRisultato(c.risultato) : 'finita'}`, d: vinto ? `hai giocato ${pzkHtml(c.giocato)} e ne tornano ${pzkHtml(c.torna)}.` : `hai giocato ${pzkHtml(c.giocato)}: stavolta niente.`, azioni: [['virtual', ':app-virtual: la prossima']] })
  stato()
}
/** A partita finita la banca paga: lo si chiede allora, e si dice com'è andata (una volta per partita). */
function virtualAspetta(P, SC, indice) {
  if (virtualAttese.has(indice)) return
  virtualAttese.add(indice)
  const fine = (indice + 1) * P.CICLO - P.adesso()
  setTimeout(async () => { const c = await SC.fine(indice).catch(() => null); virtualAttese.delete(indice); if (c) virtualEsito(P, c) }, Math.max(0, fine) + 1200)
}

/** Un tavolo dalla barra: quanto, su cosa (se il gioco lo chiede), e parte il comando vero. */
async function tavolo(g) {
  if (g.cmd) return esegui(g.cmd, { eti: `/${g.cmd}` })
  const c = PER_NOME.get(g.id)
  if (!c) return
  if (zaino.pagerRotto()) return soloScassato()
  const s = scheda({ colore: 'blu', av: 'bot-occhiolino', t: `:${c.icona}: ${g.nome}`, d: esc(c.breve ?? ''), pie: `hai ${fmt(pzk.saldo())} $pzk · quanto punti?` })
  const n = await scegli(s, [10, 50, 100, 500].map((v) => ({ id: String(v), eti: `${v} $pzk`, stile: v === 50 ? 'oro' : '' })), 60_000)
  if (!n) return
  let su = ''
  if (g.su) { su = await scegli(s, g.su.map(([id, eti, stile]) => ({ id, eti: eti ?? id, stile })), 60_000); if (!su) return }
  return esegui(`${g.id} ${n}${su ? ` ${su}` : ''}`)
}

// ── parole: indovina la parola in sei tentativi, in chat. La parola la tiene la banca ('parole.*'): qui la griglia sta
// nella scheda e i tentativi si scrivono nella riga dei messaggi. È la stessa partita del foglio (games/parole/): una
// lasciata aperta lì si riprende qui, e viceversa ──
const PAROLE_PAGA = { 5: [20, 8, 4, 2.5, 1.5, 1], 6: [25, 10, 5, 3, 2, 1.2] }
const volte = (v) => `×${v.toLocaleString('it-IT')}`
function grigliaParole(v, scritta = '') {
  const righe = v.righe.map(([p, c]) => `<div class="dc-pa__r">${[...p].map((l, i) => `<span class="dc-pa__c ${c[i]}">${esc(l)}</span>`).join('')}</div>`)
  for (let r = v.righe.length; r < (v.max ?? 6); r++) righe.push(`<div class="dc-pa__r">${Array.from({ length: v.lettere }, (_, i) => `<span class="dc-pa__c">${r === v.righe.length ? esc(scritta[i] ?? '') : ''}</span>`).join('')}</div>`)
  return `<div class="dc-pa" style="--n:${v.lettere}">${righe.join('')}</div>`
}
async function paroleQui(args = []) {
  let v = pzk.tavoloBanca('parole')
  if (v?.fase !== 'gioco') {
    // una partita nuova: «/parole 50», «/parole 50 6», o coi tasti
    let n = importo(args[0]), lettere = args[1] === '6' || args[0] === '6' ? 6 : 5
    if (!Number.isFinite(n) || n < 5) {
      const s0 = scheda({ colore: 'blu', av: 'bot-occhiolino', t: ':quiz: parole', d: 'indovina la parola italiana in sei tentativi. Verde: lettera giusta al posto giusto. Giallo: c’è, ma altrove. Prima la prendi, più torna.', campi: PAROLE_PAGA[5].map((x, i) => [`al ${i + 1}°`, volte(x)]), pie: `hai ${fmt(pzk.saldo())} $pzk · quanto punti?` })
      n = Number(await scegli(s0, [5, 25, 100, 500].map((x) => ({ id: String(x), eti: `${x} $pzk`, stile: x === 25 ? 'oro' : '' })), 60_000))
      if (!n) return
      lettere = Number(await scegli(s0, [{ id: '5', eti: '5 lettere', stile: 'oro' }, { id: '6', eti: `6 lettere (fino a ${volte(PAROLE_PAGA[6][0])})` }], 60_000))
      if (!lettere) return
    }
    const r = await pzk.fai('parole.inizia', { puntata: n, lettere })
    if (!r?.ok) return scheda({ colore: 'rosso', av: 'bot-triste', t: ':quiz: parole', d: esc(r?.errore ?? 'la banca non risponde: riprova.'), azioni: pzk.conto() ? [] : [['account', ':app-account: accedi', 'oro']] })
    v = r.esito.vede
  }
  const testo = (x, extra = '') => ({ colore: 'blu', t: `:quiz: parole · ${x.lettere} lettere`, html: grigliaParole(x), d: extra, pie: `puntata ${fmt(x.puntata)} $pzk · se la prendi ora ${volte(x.paga[x.righe.length] ?? 0)} · scrivi la parola nella riga qui sotto («basta» per arrenderti)` })
  const s = scheda(testo(v, v.righe.length ? `tentativo ${v.righe.length + 1} di ${v.max}.` : 'scrivi la prima parola.'))
  while (v.fase === 'gioco') {
    const t = (await scrivi(180_000, { segnaposto: `una parola di ${v.lettere} lettere…` }))?.trim().toLowerCase()
    if (t == null) { aggiorna(s, { ...testo(v, 'ti ho aspettato tre minuti: la parola resta aperta.'), pie: 'scrivi /parole per riprenderla', azioni: [['parole', ':quiz: riprendi', 'oro']] }); return }
    const r = t === 'basta' || t === '/basta' ? await pzk.fai('parole.arrendi') : await pzk.fai('parole.prova', { parola: t.replace(/^\//, '') })
    if (!r?.ok) { aggiorna(s, testo(v, `<b>«${esc(t)}»</b>: ${esc(r?.errore ?? 'la banca non risponde')}.`)); continue }
    v = r.esito.vede
    if (v.fase === 'gioco') aggiorna(s, testo(v, `tentativo ${v.righe.length + 1} di ${v.max}.`))
  }
  const presa = v.esito === 'presa'
  aggiorna(s, { colore: presa ? 'verde' : 'rosso', av: presa ? 'bot-ride' : 'bot-triste', t: `:quiz: parole · ${presa ? `presa al ${v.righe.length}°` : `era «${esc(v.parola)}»`}`, html: grigliaParole(v), d: presa ? `tornano ${pzkHtml(v.torna)} (${volte(v.paga[v.righe.length - 1])}).` : `${pzkHtml(v.puntata)} andati.`, azioni: [[`parole ${v.puntata}${v.lettere === 6 ? ' 6' : ''}`, ':quiz: un’altra', 'oro']] })
  stato()
}

// ── il conto: si entra col riquadro dell'accesso (accesso/accesso.js, 19.11: l'email e il codice che arriva per posta,
// niente PIN), lo stesso del profilo e del cercapersone. Qui resta la scheda di chi è già dentro, e quella di dopo ──
const accesso = () => import('../accesso/accesso.js')
let entrando = false
const regaloAzione = () => { const st = pzk.seguo()?.stato; return st === 'dato' || st === 'attesa' ? [] : [['regalo', `:regalo: +${fmt(pzk.PREMIO_IG)} $pzk`, 'oro']] }
async function contoQui() {
  const c = pzk.conto()
  if (c?.nome) return scheda({ colore: 'verde', av: 'bot-occhiolino', t: `:app-account: ${esc(c.nome)}`, campi: [['$pzk', pzkHtml(pzk.saldo())], ['EUR€', eurHtml(pzk.euro())], ['indirizzo', `<code>${esc(c.ind ?? '—')}</code>`], ['livello', `:livello: ${zaino.livello()}`], ...(c.email ? [['email', esc(c.email)]] : [])], pie: 'salvataggio attivo: soldi, zaino e livelli stanno nella banca, e li ritrovi qui, sul cercapersone e ai tavoli', azioni: [['saldo', ':pzk: saldo'], ['profilo', ':livello: profilo'], ...regaloAzione(), ['esci', 'esci dal conto', 'rosso']] })
  if (entrando) return
  entrando = true
  let r
  try { r = await (await accesso()).accedi() } catch { r = { ok: false } } finally { entrando = false }
  campo?.focus({ preventScroll: true })
  if (!r?.ok) return
  Promise.resolve(zaino.sincronizza?.()).catch(() => {}).finally(stato)
  scheda({ colore: 'verde', av: 'bot-ride', t: `:app-account: ${r.nuovo ? 'conto aperto' : 'bentornato'}, ${esc(pzk.conto()?.nome ?? '')}`, d: `da adesso si salva tutto nella banca: hai ${pzkHtml(pzk.saldo())}.`, azioni: [['saldo', ':pzk: saldo'], ['giornaliero', ':regalo: premio del giorno', 'oro'], ...regaloAzione()] })
}
async function regaloQui() {
  await (await accesso()).premio()
  campo?.focus({ preventScroll: true }); stato()
  const s = pzk.seguo()
  if (s?.stato === 'attesa') return scheda({ colore: 'blu', av: 'bot-occhiolino', t: ':regalo: richiesta mandata', d: `ho scritto a pzkko che lo segui come <b>@${esc(s.ig)}</b>. Appena controlla fra i follower arrivano ${pzkHtml(pzk.PREMIO_IG)}, e ti scrive per email.` })
  if (s?.stato === 'dato') return scheda({ colore: 'verde', av: 'bot-ride', t: ':regalo: regalo arrivato', d: `i ${pzkHtml(pzk.PREMIO_IG)} del follow sono sul conto. grazie!`, azioni: [['saldo', ':pzk: saldo']] })
}
const apriConto = () => contoQui()

/** /calcola (20.11): con un conto lo fa qui in chat coi conti della calcolatrice (gli stessi di quella in stile Discord e
 *  del cercapersone: il risultato va negli ultimi e in ANS, l'espressione lasciata a metà là resta com'era); senza, apre la
 *  calcolatrice sopra la pagina, come /telefono il cercapersone. */
async function calcolaQui(args) {
  const conto = args.join(' ').trim()
  if (!conto) return apriQui('calcolatrice')
  const [c, { ricorda }] = await Promise.all([import('/telefono/app/calcolatrice.js'), import('/telefono/ricordi.js')])
  const apri = [['qui:calcolatrice', ':app-calcolatrice: apri la calcolatrice', 'oro']]
  const prima = c.S.expr
  const scritto = c.chiusa(conto)
  c.S.expr = scritto
  try {
    const v = c.registra()
    const angoli = /sin|cos|tan/i.test(conto) ? `<br><small>angoli in ${esc(c.MODI[c.S.modo][1])} (${esc(c.S.modo)}): si cambiano nella calcolatrice</small>` : ''
    return scheda({ colore: 'viola', av: 'bot-occhiolino', t: ':app-calcolatrice: calcolatrice', d: `<code>${esc(scritto)}</code> = <b>${esc(c.num(v))}</b>${angoli}`, azioni: apri })
  } catch (e) {
    return scheda({ colore: 'rosso', av: 'bot-pensa', t: ':app-calcolatrice: non torna', d: `<code>${esc(conto)}</code>: ${esc(e.message)}.`, azioni: apri })
  } finally {
    c.S.expr = prima
    ricorda('calcolatrice', c.S)
  }
}

// ── i comandi che esistono solo qui (il conto): stanno fra i suggerimenti come gli altri ──
const LOCALI = [
  { nomi: ['calcola', 'calcolatrice', 'calc'], cat: 'app', icona: 'app-calcolatrice', breve: 'fa un conto qui in chat (calcola 12*(3+4), anche sin cos log √ π ans), o senza conto apre la calcolatrice', uso: 'calcola [conto]', fai: (args) => calcolaQui(args) },
  { nomi: ['parole', 'parola', 'wordle'], cat: 'giochi', icona: 'quiz', breve: 'indovina la parola italiana in sei tentativi: parole 50 (o parole 50 6 per sei lettere)', uso: 'parole [puntata] [5|6]', fai: (args) => paroleQui(args) },
  { nomi: ['account', 'accedi', 'entra', 'login', 'conto', 'registrati'], cat: 'soldi', icona: 'app-account', breve: 'entra o crea il conto con l’email (niente password): i progressi si salvano nella banca', uso: 'account', fai: () => contoQui() },
  { nomi: ['regalo', 'instagram', 'ig', 'seguimi'], cat: 'soldi', icona: 'regalo', breve: 'seguimi su instagram e scrivi il tuo nome: 2.000 $pzk in regalo', uso: 'regalo', fai: () => regaloQui() },
  { nomi: ['novita', 'novità', 'news'], cat: 'soldi', icona: 'app-account', breve: 'le novità del sito', uso: 'novita', fai: async () => { await (await accesso()).novita(); campo?.focus({ preventScroll: true }) } },
  { nomi: ['esci', 'logout'], cat: 'soldi', icona: 'app-account', breve: 'esci dal conto e torni alla sessione di prova', uso: 'esci',
    async fai() {
      const c = pzk.conto()
      if (!c?.nome) return scheda({ colore: 'grigio', d: 'non sei in nessun conto: stai giocando con la sessione di prova.', azioni: [['account', ':app-account: accedi', 'oro']] })
      await pzk.esci()
      stato()
      return scheda({ colore: 'grigio', av: 'bot-triste', t: ':app-account: uscito', d: `il conto <b>${esc(c.nome)}</b> resta nella banca con tutto dentro. Adesso giochi con la sessione di prova, che non si salva.`, azioni: [['account', ':app-account: accedi di nuovo', 'oro']] })
    } },
]
const PER_LOCALE = new Map(LOCALI.flatMap((c) => c.nomi.map((n) => [n, c])))

function ctxDi(args, testo) {
  const mie = []
  const sua = (e) => { const s = scheda(e); mie.push(s.__msg); return s }
  const ctx = {
    __mie: mie, args, testo, zaino, pzk, dì: sua, scheda: sua, aggiorna, scegli, scrivi, smetti, caricaIcone: () => {}, tempo, dormi, inVista, pensa, sistema, utente,
    nome, importo, caso, rnd, tra, durata, fmt, pzkHtml, eurHtml, icona, conIcone,
    esegui, apriWallet: apriConto, apriApp, comandi: COMANDI, perNome: PER_NOME, categorie: CATEGORIE,
    fai: (cosa, a) => chat.chiedi(ctx, cosa, a), no: (r, cmd) => chat.rifiuto(ctx, r, cmd),
    morte: (m) => { ctx.__morteVista = true; chat.mostraMorte(sua, m) },
    saleDiLivello: (l) => l && scheda({ colore: 'oro', av: 'bot-ride', t: ':livello: livello ' + l + '!', d: `sei salito di livello: adesso le paghe valgono ×${zaino.moltiplicatore().toLocaleString('it-IT')}.` }),
  }
  return ctx
}
export async function esegui(riga_, { muto = false, eti = null } = {}) {
  const { nome: n, args, testo } = analizza(riga_)
  if (!n) return
  if (!muto) utente(eti ?? `/${riga_.replace(/^\/+/, '')}`)
  const locale = PER_LOCALE.get(n)
  if (locale) { await locale.fai(args); stato(); return }
  const c = PER_NOME.get(n)
  if (zaino.pagerRotto() && !passaDaRotto(c, testo)) return soloScassato()
  if (!c) {
    const x = NEGOZIO.find((o) => o.id === n || o.nome.toLowerCase() === n)
    if (x) { scheda({ colore: 'ambra', av: 'bot-pensa', t: `:${x.id}: «${esc(n)}» non è un comando`, d: `ma <b>${x.nome}</b> è nel negozio (${pzkHtml(x.prezzo)}). Cosa ne vuoi fare?`, azioni: [[`compra ${x.id}`, 'compra', 'oro'], [`usa ${x.id}`, 'usa']] }); return }
    scheda({ colore: 'rosso', av: 'bot-pensa', t: 'eh?', d: `«${esc(n)}» non lo conosco. Scrivi <code>/aiuto</code> per l'elenco dei comandi.`, azioni: [['aiuto', ':quiz: aiuto']] }); return
  }
  const chiave = c.nomi[0]
  if (!muto && !eti) zaino.ricorda(riga_)
  const prima = inCorso.get(chiave)
  if (prima && !scelte.some((sc) => prima.mie.includes(sc.m)) && prima.vecchio) inCorso.delete(chiave)
  if (c.attesa) {
    const m = zaino.manca(chiave)
    if (m > 0) { scheda({ colore: 'ambra', av: 'bot-pensa', t: ':clessidra: calma', d: `«${chiave}» lo puoi rifare fra <b>${durata(m)}</b>.${zaino.effetto('caffe') ? '' : ' Un caffè dal negozio dimezza le attese.'}` }); return }
  }
  if (inCorso.has(chiave)) { const p = inCorso.get(chiave); p.vecchio = true; scheda({ colore: 'ambra', av: 'bot-arrabbiato', d: `stai già facendo «${chiave}»: finisci quello.` }); return }
  const ctx = ctxDi(args, testo)
  const io = { mie: ctx.__mie }
  inCorso.set(chiave, io)
  try {
    await c.fai(ctx)
    if (ctx.__morte && !ctx.__morteVista) ctx.morte(ctx.__morte)
    if (ctx.__evento) await eventoCasuale(ctx, ctx.__evento)
  } catch (e) {
    console.error('chat discord:', e)
    for (const m of ctx.__mie) m.riga.querySelector('.c-rulli')?.classList.remove('gira')
    scheda({ colore: 'rosso', av: 'bot-arrabbiato', t: 'qualcosa si è rotto', d: esc(e.message ?? e) })
  } finally {
    if (inCorso.get(chiave) === io) inCorso.delete(chiave)
    stato()
  }
}

// ── la riga dove si scrive, coi suggerimenti dei comandi come su Discord ──
const visibili = () => [...LOCALI, ...COMANDI.filter((c) => !c.nascosto)]
let sel = 0, trovati = []
// gli argomenti di un comando, senza ripetere il nome che sta già scritto accanto («mine <puntata>» → «<puntata>»)
const argomenti = (c) => String(c.uso ?? '').replace(/^\/?\S+\s*/, '').trim()
function suggerisci() {
  const v = campo.value
  const m = /^\/?([a-zà-ü0-9-]*)$/i.exec(v)
  if (!m || aspettaTesto || (!v.startsWith('/') && v.length < 1)) { pop.hidden = true; trovati = []; return }
  const q = m[1].toLowerCase()
  trovati = visibili().filter((c) => c.nomi.some((n) => n.startsWith(q))).slice(0, 50)
  if (!trovati.length) { pop.hidden = true; return }
  sel = Math.min(sel, trovati.length - 1)
  let cat = ''
  pop.innerHTML = trovati.map((c, i) => {
    const testa = c.cat !== cat ? `<div class="dc__cat">${esc(CATEGORIE.find((x) => x[0] === (cat = c.cat))?.[1] ?? c.cat ?? '')}</div>` : ''
    return `${testa}<button type="button" class="dc__cmd" role="option" data-i="${i}" aria-selected="${i === sel}"><span class="dc__cmd-ico">${c.icona && esiste(c.icona) ? icona(c.icona) : '<i>/</i>'}</span><span class="dc__cmd-txt"><span class="dc__cmd-riga"><b>/${esc(c.nomi[0])}</b>${argomenti(c) ? `<code>${esc(argomenti(c))}</code>` : ''}</span>${c.breve ? `<span class="dc__cmd-desc">${esc(c.breve)}</span>` : ''}</span></button>`
  }).join('')
  pop.hidden = false
  pop.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' })
}
function completa(i) {
  const c = trovati[i]
  if (!c) return
  // un comando senza argomenti parte subito; uno che ne vuole resta nella riga, da finire
  const vuole = /[<[]/.test(c.uso ?? '') && !/^\S+\s*\[/.test(c.uso ?? '')
  pop.hidden = true; trovati = []
  if (vuole) { campo.value = `/${c.nomi[0]} `; campo.focus() } else { campo.value = ''; esegui(c.nomi[0]) }
  suggerisci()
}
function manda() {
  const t = campo.value.trim()
  if (!t) return
  campo.value = ''
  pop.hidden = true; trovati = []
  if (aspettaTesto) { utente(t); aspettaTesto.risolvi(t); return }
  esegui(t)
}
function stato() {
  if (!radice) return
  const c = pzk.conto()
  const saldo = radice.querySelector('[data-saldo]'), n = fmt(pzk.saldo())
  if (saldo.dataset.n !== n) { // il saldo che cambia si fa notare un attimo
    if (saldo.dataset.n && !RIDOTTO.matches) { saldo.classList.remove('batte'); void saldo.offsetWidth; saldo.classList.add('batte') }
    saldo.dataset.n = n
    saldo.innerHTML = `${esiste('pzk') ? icona('pzk') : ''}<b>${n}</b>`
    saldo.title = `${n} $pzk`
  }
  const b = radice.querySelector('[data-conto]')
  b.textContent = c?.nome ? c.nome : 'Accedi'
  b.classList.toggle('dentro', !!c?.nome)
  b.title = c?.nome ? 'il tuo account: i progressi si salvano nella banca' : 'accedi o crea un account per salvare i progressi'
  const sal = radice.querySelector('[data-salva]')
  sal.textContent = c?.nome ? 'salvataggio attivo' : 'sessione di prova · senza account non si salva'
  sal.classList.toggle('salva', !!c?.nome)
}

/** Monta la chat dentro `el`. `qui(cosa, { app })` apre il cercapersone 3D sopra la pagina (solo per «/telefono»). */
export function monta(el, { qui: apri }) {
  if (radice) return
  apriQui = apri
  radice = el
  el.innerHTML = `<div class="dc">
    <header class="dc__head"><span class="dc__canale"><i>#</i>pzk-bot</span><span class="dc__topic" data-salva></span>
      <span class="dc__saldo" data-saldo></span><button type="button" class="btn btn--msg dc__conto" data-conto>Accedi</button></header>
    <div class="dc__att" role="group" aria-label="i tavoli, qui in chat">${TAVOLI.map((g) => { const ic = g.icona ?? PER_NOME.get(g.id)?.icona; return `<button type="button" class="dc__act" data-tavolo="${g.id}">${ic && esiste(ic) ? icona(ic) : ''}<span>${esc(g.nome)}</span></button>` }).join('')}</div>
    <div class="dc__list" role="log" aria-live="polite" tabindex="0"><div class="dc__inizio"><i>#</i><h3>Ti diamo il benvenuto in #pzk-bot!</h3><p>Questo è l’inizio del canale #pzk-bot: il bot dei $pzk, coi comandi veri del cercapersone. Tutto gira qui in chat.</p></div><div class="dc__giorno">${new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</div></div>
    <div class="dc__pop" role="listbox" hidden></div>
    <form class="dc__form"><span class="dc__slash">/</span><input class="dc__input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" maxlength="120" placeholder="Messaggio #pzk-bot · scrivi / per i comandi" aria-label="scrivi un comando"><button type="submit" class="dc__invia" aria-label="invia">➤</button></form>
    <div class="dc__rapidi">${[['giornaliero', ':regalo: premio'], ['lavora', ':rider: lavora'], ['pesca', ':canna: pesca'], ['saldo', ':pzk: saldo'], ['zaino', ':zaino: zaino'], ['negozio', 'negozio'], ['aiuto', ':quiz: aiuto']].filter(([c]) => PER_NOME.has(c)).map(([c, e]) => `<button type="button" class="c-b" data-cmd="${c}">${conIcone(e)}</button>`).join('')}</div>
  </div>`
  lista = el.querySelector('.dc__list'); campo = el.querySelector('.dc__input'); pop = el.querySelector('.dc__pop')
  el.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); manda() })
  campo.addEventListener('input', () => { sel = 0; suggerisci() })
  campo.addEventListener('keydown', (e) => {
    if (pop.hidden) return
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % trovati.length; suggerisci() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + trovati.length) % trovati.length; suggerisci() }
    else if (e.key === 'Tab' || (e.key === 'Enter' && /^\/?[a-zà-ü0-9-]*$/i.test(campo.value) && !PER_NOME.has(campo.value.replace(/^\//, '').toLowerCase()))) { e.preventDefault(); completa(sel) }
    else if (e.key === 'Escape') { e.stopPropagation(); pop.hidden = true }
  })
  el.addEventListener('click', (e) => {
    const p = e.target.closest('[data-parola]')
    if (p) { utente(p.dataset.parola); aspettaTesto?.risolvi(p.dataset.parola); return }
    const cmd = e.target.closest('[data-cmd]')
    if (cmd && !cmd.disabled) {
      if (cmd.dataset.cmd.startsWith('qui:')) { const [, cosa, app] = cmd.dataset.cmd.split(':'); apriQui(cosa, { app: app || null }); return }
      esegui(cmd.dataset.cmd, { eti: cmd.textContent.trim() || cmd.dataset.cmd }); return
    }
    const cm = e.target.closest('.dc__cmd')
    if (cm) { completa(+cm.dataset.i); return }
    const at = e.target.closest('[data-tavolo]')
    if (at) { tavolo(TAVOLI.find((g) => g.id === at.dataset.tavolo)); return }
    if (e.target.closest('[data-conto]')) contoQui()
  })
  pzk.osserva(stato)
  // il canale diretto con la banca: quello che cambia da un altro dispositivo (o nel cercapersone) arriva subito
  import('/games/live.js').catch(() => {})
  zaino.ascolta?.(stato)
  addEventListener('storage', () => { try { pzk.ricarica() } catch {} stato() })
  stato()
  if (!salutato) { salutato = true; salutoIniziale(ctxDi([], '')) }
}
export const quanti = () => visibili().length
