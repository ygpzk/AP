// pzkko.it: la chat col bot pzk, vestita da canale di Discord.
// I COMANDI SONO QUELLI VERI del cercapersone (chat/comandi/*, lo stesso motore della chat di pzk os: le attese, gli
// eventi casuali, il cercapersone scassato, i soldi della banca). Qui cambia solo il vestito: ogni comando riceve il suo
// «ctx» e le schede diventano gli embed di Discord, coi tasti veri, le griglie dei minigiochi, i rulli e le barre del tempo.
// I soldi e lo zaino sono gli stessi del cercapersone e dei tavoli: con l'account si salvano nella banca, senza si gioca
// coi 1.000 $pzk della sessione.

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
// le attività: i tavoli e il cercapersone veri, che si aprono in una finestra sopra il profilo
const ATTIVITA = [['PZK Zero', '/serranda/?apri=zero', 'telefono'], ['Roulette', '/serranda/?apri=roulette', 'roulette'], ['Blackjack', '/serranda/?apri=blackjack', 'carte'], ['Mine', '/serranda/?apri=mine', 'bomba'], ['Dado', '/serranda/?apri=dado', 'dadi'], ['Testa o croce', '/serranda/?apri=moneta', 'moneta'], ['Virtual', '/serranda/?apri=virtual', 'pallone']]

let radice = null, lista = null, campo = null, pop = null, apriFinestra = () => {}
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
  return riga('dc__msg--tu', `<img class="dc__av" src="${esc(avatarMio())}" alt=""><div class="dc__body"><div class="dc__meta"><b>${esc(nome())}</b><time>${ora()}</time></div><div class="dc__txt">${esc(testo)}</div></div>`)
}
export function sistema(testo) { return riga('dc__msg--sis', `<div class="dc__sis">${conIcone(testo)}</div>`) }

// ── le schede del bot: gli embed ──
function disegna(s, e) {
  const m = s.__msg
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
// le app del cercapersone e il conto si aprono nel cercapersone vero, nella finestra sopra il profilo
const apriApp = (app, { app: dentro } = {}) => apriFinestra(`/serranda/?apri=zero${app ? `&app=${encodeURIComponent(app)}` : ''}${dentro ? `&comando=${encodeURIComponent(dentro)}` : ''}`, 'PZK Zero')
const apriConto = () => apriFinestra('/serranda/?apri=zero&app=account', 'Account')

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
const visibili = () => COMANDI.filter((c) => !c.nascosto)
let sel = 0, trovati = []
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
    return `${testa}<button type="button" class="dc__cmd" role="option" data-i="${i}" aria-selected="${i === sel}"><span class="dc__cmd-ico">${conIcone(c.icona ?? '')}</span><b>/${esc(c.nomi[0])}</b>${c.uso ? `<code>${esc(c.uso)}</code>` : ''}<span>${esc(c.breve ?? '')}</span></button>`
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
  radice.querySelector('[data-saldo]').innerHTML = `${fmt(pzk.saldo())} $pzk`
  const b = radice.querySelector('[data-conto]')
  b.textContent = c?.nome ? c.nome : 'Accedi'
  b.title = c?.nome ? 'il tuo account: i progressi si salvano nella banca' : 'accedi o crea un account per salvare i progressi'
  radice.querySelector('[data-salva]').textContent = c?.nome ? 'salvataggio attivo' : 'sessione di prova · senza account non si salva'
}

/** Monta la chat dentro `el`. `finestra(indirizzo, titolo)` apre una cosa vera (un tavolo, il cercapersone) sopra il profilo. */
export function monta(el, { finestra }) {
  if (radice) return
  apriFinestra = finestra
  radice = el
  el.innerHTML = `<div class="dc">
    <header class="dc__head"><span class="dc__canale"><i>#</i>pzk-bot</span><span class="dc__topic" data-salva></span>
      <span class="dc__saldo" data-saldo></span><button type="button" class="btn btn--msg dc__conto" data-conto>Accedi</button></header>
    <div class="dc__att" role="group" aria-label="attività">${ATTIVITA.map(([t, href, ic]) => `<button type="button" class="dc__act" data-href="${href}" data-titolo="${esc(t)}">${esiste(ic) ? icona(ic) : ''}<span>${esc(t)}</span></button>`).join('')}</div>
    <div class="dc__list" role="log" aria-live="polite" tabindex="0"></div>
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
    if (cmd && !cmd.disabled) { esegui(cmd.dataset.cmd, { eti: cmd.textContent.trim() || cmd.dataset.cmd }); return }
    const cm = e.target.closest('.dc__cmd')
    if (cm) { completa(+cm.dataset.i); return }
    const at = e.target.closest('.dc__act')
    if (at) { apriFinestra(at.dataset.href, at.dataset.titolo); return }
    if (e.target.closest('[data-conto]')) apriConto()
  })
  pzk.osserva(stato)
  // il canale diretto con la banca: quello che cambia da un altro dispositivo (o nel cercapersone) arriva subito
  import('/games/live.js').catch(() => {})
  zaino.ascolta?.(stato)
  // tornando dal cercapersone o da un tavolo: il conto e lo zaino si rileggono
  addEventListener('pzkko-app-chiusa', () => { try { pzk.ricarica() } catch {} Promise.resolve(pzk.sincronizza?.()).catch(() => {}).finally(stato) })
  addEventListener('storage', () => { try { pzk.ricarica() } catch {} stato() })
  stato()
  if (!salutato) { salutato = true; salutoIniziale(ctxDi([], '')) }
}
export const quanti = () => visibili().length
