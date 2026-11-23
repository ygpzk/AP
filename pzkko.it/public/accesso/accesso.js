// L'ACCESSO DI PZKKO.IT (19.11, Alberto: «riprogetta i login e i register e i recupera password … no password, solo codici
// di verifica via email … tutto molto stile discord … deve essere super facile … appena entri invita molto bene il visitatore
// ad entrare in questo mondo, poi ricordali delle novità … se mi segue su entrambi i profili avrà 2000pzk in regalo,
// ovviamente dovrà scrivere prima il suo ig, poi a me arriva una notifica … e poi se mi segue inviali il premio»).
//
// Un riquadro solo, come quelli di Discord, che fa tutto e che aprono il profilo, la chat, il cercapersone e i tavoli:
// - invito(): l'invito, come quelli dei server di Discord (chi invita, quanti membri, la banca accesa o no, cosa c'è dentro);
// - accedi(): l'email → il codice di sei cifre arrivato per posta (dieci minuti) → il nome, solo se il conto è nuovo. Accedere
//   e registrarsi sono la stessa strada, e la password da recuperare non c'è: ogni volta arriva un codice;
// - novita(): le novità, come il «Novità» di Discord (una volta per versione, dopo l'accesso o all'arrivo di chi è già dentro);
// - premio(): il regalo per chi mi segue su tutti e due i profili di instagram: si scrive il proprio nome, la banca avvisa
//   Alberto, che guarda fra i follower e decide; decidi(biglietto) è la sua parte (pzkko.it/?premio=…, dal tasto della lettera);
// - arrivo(): quello che la pagina fa da sola quando si entra nel sito.
// Tutto passa dalla banca sul pc di Alberto (games/pzk.js: codice, accedi, chiediPremio): se il pc è spento qui non si entra.
// I testi in italiano e in inglese (le altre lingue del profilo vedono l'inglese).
import * as pzk from '../games/pzk.js'

const NOVITA = { v: '2026-11-19', foto: '/media/p/parole/cover.webp' } // la versione delle novità: cambiala e tornano fuori
const K_NOVITA = 'pzkko-novita-profilo', K_EMAIL = 'pzkko-email', K_INVITO = 'pzkko-invito', K_REGALO = 'pzkko-regalo-poi'
const PROFILI = [['albertoxpecchini', 'https://www.instagram.com/albertoxpecchini/'], ['pzkko', 'https://www.instagram.com/pzkko/']]
const API = '/api/wallet/'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const dep = { get(k) { try { return localStorage.getItem(k) } catch { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch {} } }
const it = () => (document.documentElement.lang || 'it').toLowerCase().startsWith('it')
const premioTxt = () => pzk.fmt(pzk.PREMIO_IG)

// ── i testi ──
const IT = {
  chiudi: 'Chiudi', indietro: 'Indietro', avanti: 'Avanti', capito: 'Capito', rete: 'La banca non risponde: riprova fra poco.',
  inv: { da: 'pzkko ti ha invitato a entrare', accesa: 'banca accesa', pausa: 'banca in pausa', membri: (n) => `${n} ${n === 1 ? 'membro' : 'membri'}`,
    testo: 'Un conto solo per tutto il sito: quello che vinci, compri e sblocchi resta tuo, su ogni dispositivo.',
    cose: [['$', '<b>1.000 $pzk</b> appena entri'], ['♠', 'Roulette, blackjack, mine, <b>Parole</b>, <b>Trivia</b> e gli altri tavoli'], ['@', '<b>Niente password</b>: ti arriva un codice per email'], ['♥', `<b>+${'{P}'} $pzk</b> se mi segui su Instagram`]],
    accetta: 'Accetta l’invito', ospite: 'Continua come ospite', nota: 'Da ospite si gioca lo stesso, ma non si salva niente.' },
  email: { t: 'Entra in pzkko.it', s: 'Scrivi la tua email: ti mando un codice. Che tu abbia già un conto o no, la strada è questa.', campo: 'Email', vai: 'Mandami il codice', nota: 'Niente password. L’email resta sul pc di Alberto e serve solo per farti entrare.', sbagliata: 'Questa email non mi torna: controllala.' },
  cod: { t: 'Controlla la posta', s: (e) => `Ho mandato un codice di sei cifre a <b>${e}</b>.`, campo: 'Codice di sei cifre', vale: (t) => `Vale ancora ${t}`, scaduto: 'Il codice è scaduto: chiedine uno nuovo.', entra: 'Entra', ancora: 'Non arriva? Mandalo di nuovo', fra: (s) => `Mandalo di nuovo fra ${s} s`, mandato: 'Rimandato: guarda anche nello spam.', cambia: 'Cambia email' },
  nome: { t: 'Come ti chiami?', s: 'È il nome che gli altri vedono in classifica. Da 2 a 20 lettere.', campo: 'Nome', vai: 'Crea il conto', corto: 'Almeno 2 lettere.' },
  ben: { t: (n) => `Benvenuto, ${n}!`, s: (i, p) => `Sul tuo conto ci sono <b>${p} $pzk</b>. Il tuo indirizzo è <code>${i}</code>: serve per farti mandare $pzk dagli amici.`, punti: ['Soldi, zaino e livelli si salvano da soli, nella banca.', 'La prossima volta scrivi l’email e ti arriva un codice nuovo.'] },
  nov: { t: 'Novità', quando: '19 novembre 2026',
    sez: [['verde', 'Nuove funzioni', ['<b>Parole e Trivia, rifatti da zero.</b> Due fogli nuovi fra i tavoli, coi $pzk sopra.', '<b>Tutto gira qui.</b> Cercapersone, tavoli e chat si aprono sopra il profilo: non si esce più.', '<b>La chat fa tutto in chat.</b> Conto, negozio, virtual e tavoli: scrivi / e scegli.']],
      ['blu', 'Conti', ['<b>Niente più PIN.</b> Si entra con un codice che arriva per email, nuovo ogni volta.']],
      ['rosa', 'Regali', [`<b>${'{P}'} $pzk</b> se mi segui su tutti e due i profili di Instagram.`]]] },
  reg: { t: (p) => `${p} $pzk in regalo`, s: 'Seguimi su tutti e due i profili, poi scrivi qui il tuo Instagram. Guardo io fra i follower: se ci sei, ti arrivano.', campo: 'Il tuo Instagram', vai: 'Chiedi il regalo', poi: 'Più tardi', vuoto: 'Scrivi il tuo nome di Instagram.',
    attesa: (g) => `Richiesta mandata come <b>@${g}</b>. Appena controllo ti arrivano i $pzk, e ti scrivo per email.`, tAttesa: 'Richiesta mandata', cambia: 'Ho sbagliato nome',
    dato: (p) => `Sono arrivati <b>${p} $pzk</b>. Grazie del follow!`, tDato: 'Regalo arrivato',
    no: (g) => `Fra i follower non ho trovato <b>@${g}</b> su tutti e due i profili. Controlla il nome e riprova.`, serve: 'Per il regalo serve un conto: entra, ci metti un attimo.' },
  dec: { t: (g, p) => `@${g} chiede i ${p} $pzk`, s: (n, q) => `<b>${n}</b> (conto del ${q}) dice di seguirti su tutti e due i profili.`, apri: (g) => `Apri @${g} su Instagram`, si: (p) => `Sì, mi segue: manda i ${p}`, no: 'No, non lo trovo',
    dato: (n, p) => `Fatto: ${p} $pzk mandati a <b>${n}</b>. Gli ho scritto.`, detto: (n) => `Detto di no a <b>${n}</b>: può richiederlo col nome giusto.`, gia: { dato: 'Il regalo gliel’hai già dato.', no: 'Gli hai già detto di no.' }, guarda: 'Guardo la richiesta…' },
}
const EN = {
  chiudi: 'Close', indietro: 'Back', avanti: 'Next', capito: 'Got it', rete: 'The bank isn’t answering: try again in a moment.',
  inv: { da: 'pzkko invited you to join', accesa: 'bank online', pausa: 'bank paused', membri: (n) => `${n} ${n === 1 ? 'member' : 'members'}`,
    testo: 'One account for the whole site: what you win, buy and unlock stays yours, on every device.',
    cose: [['$', '<b>1,000 $pzk</b> as soon as you join'], ['♠', 'Roulette, blackjack, mines, <b>Parole</b>, <b>Trivia</b> and the other tables'], ['@', '<b>No password</b>: you get a code by email'], ['♥', `<b>+${'{P}'} $pzk</b> if you follow me on Instagram`]],
    accetta: 'Accept invite', ospite: 'Continue as guest', nota: 'Guests can play too, but nothing is saved.' },
  email: { t: 'Join pzkko.it', s: 'Type your email: I’ll send you a code. New or returning, it’s the same road.', campo: 'Email', vai: 'Send me the code', nota: 'No password. Your email stays on Alberto’s pc and is only used to let you in.', sbagliata: 'That email doesn’t look right.' },
  cod: { t: 'Check your inbox', s: (e) => `I sent a six-digit code to <b>${e}</b>.`, campo: 'Six-digit code', vale: (t) => `Valid for ${t}`, scaduto: 'The code expired: ask for a new one.', entra: 'Log in', ancora: 'Didn’t get it? Send again', fra: (s) => `Send again in ${s}s`, mandato: 'Sent again: check spam too.', cambia: 'Change email' },
  nome: { t: 'What’s your name?', s: 'It’s the name others see on the leaderboard. 2 to 20 letters.', campo: 'Name', vai: 'Create account', corto: 'At least 2 letters.' },
  ben: { t: (n) => `Welcome, ${n}!`, s: (i, p) => `You have <b>${p} $pzk</b>. Your address is <code>${i}</code>: friends use it to send you $pzk.`, punti: ['Money, backpack and levels save themselves, in the bank.', 'Next time just type your email and a new code arrives.'] },
  nov: { t: 'What’s new', quando: 'November 19, 2026',
    sez: [['verde', 'New features', ['<b>Parole and Trivia, rebuilt from scratch.</b> Two new sheets among the tables, played with $pzk.', '<b>Everything runs here.</b> Pager, tables and chat open over the profile: you never leave.', '<b>The chat does it all in chat.</b> Account, shop, virtual and tables: type / and pick.']],
      ['blu', 'Accounts', ['<b>No more PIN.</b> You log in with a code sent by email, new every time.']],
      ['rosa', 'Gifts', [`<b>${'{P}'} $pzk</b> if you follow me on both Instagram profiles.`]]] },
  reg: { t: (p) => `${p} $pzk gift`, s: 'Follow me on both profiles, then type your Instagram here. I check my followers by hand: if you’re there, they’re yours.', campo: 'Your Instagram', vai: 'Ask for the gift', poi: 'Later', vuoto: 'Type your Instagram name.',
    attesa: (g) => `Request sent as <b>@${g}</b>. As soon as I check you get the $pzk, and an email.`, tAttesa: 'Request sent', cambia: 'Wrong name',
    dato: (p) => `<b>${p} $pzk</b> arrived. Thanks for the follow!`, tDato: 'Gift arrived',
    no: (g) => `I couldn’t find <b>@${g}</b> among the followers of both profiles. Check the name and try again.`, serve: 'The gift needs an account: log in, it takes a moment.' },
  dec: IT.dec,
}
const T = () => (it() ? IT : EN)
const conP = (s) => s.replaceAll('{P}', premioTxt())

// ── il riquadro: un <dialog> solo (sta sopra a tutto, anche al cercapersone aperto), i passi ci entrano uno alla volta ──
let dlg = null, scatola = null, allaChiusura = null, orologio = 0
const stile = new Promise((ok) => {
  if (document.querySelector('link[data-accesso]')) return ok()
  const l = document.createElement('link')
  l.rel = 'stylesheet'; l.href = new URL('./accesso.css', import.meta.url).href; l.dataset.accesso = ''
  l.onload = l.onerror = () => ok()
  document.head.append(l)
})
const aperto = () => !!dlg?.open
async function apri() {
  await stile
  if (aperto()) return
  dlg = document.createElement('dialog')
  dlg.className = 'ax'
  dlg.innerHTML = '<div class="ax-box" tabindex="-1"></div>'
  scatola = dlg.firstElementChild
  // i tasti restano qui: sotto ci sono le scorciatoie del profilo e i tasti del cercapersone
  for (const ev of ['keydown', 'keyup', 'keypress']) dlg.addEventListener(ev, (e) => e.stopPropagation())
  dlg.addEventListener('pointerdown', (e) => { dlg.dataset.giu = e.target === dlg ? '1' : '' })
  dlg.addEventListener('click', (e) => { if ((e.target === dlg && dlg.dataset.giu) || e.target.closest('[data-chiudi]')) chiudi() })
  dlg.addEventListener('close', () => { clearInterval(orologio); const d = dlg; dlg = scatola = null; d.remove(); const f = allaChiusura; allaChiusura = null; f?.() })
  document.body.append(dlg)
  dlg.showModal()
}
function chiudi() { if (!aperto()) return; dlg.classList.add('via'); setTimeout(() => dlg?.close(), 130) }
/** Mette un passo nel riquadro. `largo`: il riquadro delle novità. → la scatola, per attaccarci i tasti */
function passo(html, { largo = false, classe = '' } = {}) {
  clearInterval(orologio)
  scatola.className = `ax-box ${largo ? 'largo' : ''} ${classe}`
  scatola.innerHTML = `<button type="button" class="ax-x" data-chiudi aria-label="${esc(T().chiudi)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="ax-passo">${html}</div>`
  scatola.scrollTop = 0
  const primo = scatola.querySelector('[autofocus]') ?? scatola.querySelector('.ax-b')
  requestAnimationFrame(() => primo?.focus({ preventScroll: true }))
  return scatola
}
const maiuscola = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?…]$/.test(t) ? '' : '.') : '')
const errore = (b, t) => { const e = b.querySelector('.ax-err'); if (!e) return; e.textContent = maiuscola(t ?? ''); e.hidden = !t; b.querySelector('.ax-campo')?.classList.toggle('ko', !!t) }
const occupa = (b, si) => { const t = b.querySelector('.ax-b'); if (t) { t.disabled = si; t.classList.toggle('gira', si) } }

// ── l'invito ──
const IG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>'
const avatar = () => document.querySelector('#avatar')?.currentSrc || '/me.png'
/** L'invito a entrare, come quello di un server di Discord. → si chiude quando si chiude il riquadro ({ ok }: dentro o no) */
export async function invito() {
  if (pzk.conto()) return { ok: true }
  await apri()
  const t = T().inv
  const b = passo(`<div class="ax-inv">
      <img class="ax-av" src="${esc(avatar())}" alt="" width="84" height="84">
      <p class="ax-da">${esc(t.da)}</p>
      <h2>pzkko.it</h2>
      <p class="ax-conta"><span data-banca><i class="ax-punto"></i>…</span><span data-membri hidden><i class="ax-punto grigio"></i><b></b></span></p>
      <p class="ax-s">${esc(t.testo)}</p>
      <ul class="ax-cose">${t.cose.map(([i, x]) => `<li><i>${i}</i><span>${conP(x)}</span></li>`).join('')}</ul>
      <button type="button" class="ax-b" data-accetta>${esc(t.accetta)}</button>
      <button type="button" class="ax-link" data-chiudi>${esc(t.ospite)}</button>
      <p class="ax-nota">${esc(t.nota)}</p>
    </div>`, { classe: 'invito' })
  // i numeri veri: quanti conti ci sono, e se la banca (il pc di Alberto) risponde
  fetch(API, { signal: AbortSignal.timeout?.(12_000) }).then((r) => r.json()).catch(() => null).then((d) => {
    if (scatola !== b || !b.querySelector('[data-banca]')) return
    const su = !!d?.ok
    b.querySelector('[data-banca]').innerHTML = `<i class="ax-punto ${su ? '' : 'spento'}"></i>${esc(su ? t.accesa : t.pausa)}`
    if (su && Number.isFinite(d.conti) && d.conti > 0) { const m = b.querySelector('[data-membri]'); m.hidden = false; m.querySelector('b').textContent = t.membri(d.conti) }
  })
  return new Promise((fatto) => {
    allaChiusura = () => fatto({ ok: !!pzk.conto() })
    b.querySelector('[data-accetta]').addEventListener('click', () => passoEmail())
  })
}

// ── entrare: l'email, il codice, il nome ──
const S = { email: '', fino: 0, nuovo: false }
/** Entra o crea il conto. → quando il riquadro si chiude: { ok, nuovo } */
export async function accedi() {
  if (pzk.conto()) return { ok: true, nuovo: false }
  await apri()
  S.nuovo = false
  return new Promise((fatto) => { allaChiusura = () => fatto({ ok: !!pzk.conto(), nuovo: S.nuovo }); passoEmail() })
}
function passoEmail(messaggio = '') {
  const t = T().email
  const b = passo(`<form novalidate>
      <h2>${esc(t.t)}</h2><p class="ax-s">${esc(t.s)}</p>
      <label class="ax-campo"><span>${esc(t.campo)}</span><input name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="120" value="${esc(S.email || dep.get(K_EMAIL) || '')}" autofocus required></label>
      <p class="ax-err" role="alert" hidden></p>
      <button type="submit" class="ax-b">${esc(t.vai)}</button>
      <p class="ax-nota">${esc(t.nota)}</p>
    </form>`)
  if (messaggio) errore(b, messaggio)
  const f = b.querySelector('form')
  f.email.select()
  f.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = f.email.value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errore(b, t.sbagliata)
    errore(b, ''); occupa(b, true)
    const d = await pzk.codice(email).catch(() => null)
    if (scatola !== b) return
    occupa(b, false)
    if (!d?.ok) return errore(b, d?.errore ?? T().rete)
    S.email = email; S.fino = d.fino ?? Date.now() + 600_000
    dep.set(K_EMAIL, email)
    passoCodice()
  })
}
const minuti = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
function passoCodice(nota = '') {
  const t = T().cod
  const b = passo(`<form novalidate>
      <h2>${esc(t.t)}</h2><p class="ax-s">${t.s(esc(S.email))}</p>
      <label class="ax-campo"><span>${esc(t.campo)}</span><input class="ax-cifre" name="codice" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="••••••" autofocus required></label>
      <p class="ax-err" role="alert" hidden></p>
      <p class="ax-tempo" data-tempo></p>
      <button type="submit" class="ax-b">${esc(t.entra)}</button>
      <p class="ax-riga"><button type="button" class="ax-link" data-ancora disabled></button><button type="button" class="ax-link" data-cambia>${esc(t.cambia)}</button></p>
    </form>`)
  const f = b.querySelector('form'), ancora = b.querySelector('[data-ancora]'), tempo = b.querySelector('[data-tempo]')
  let dopo = Date.now() + 30_000, inCorso = false
  if (nota) { tempo.textContent = nota; tempo.classList.add('ok') }
  const batti = () => {
    const resta = S.fino - Date.now(), s = Math.ceil((dopo - Date.now()) / 1000)
    if (!nota || resta <= 0) { tempo.classList.toggle('ok', false); tempo.textContent = resta > 0 ? t.vale(minuti(resta)) : t.scaduto }
    ancora.disabled = s > 0; ancora.textContent = s > 0 ? t.fra(s) : t.ancora
  }
  batti(); orologio = setInterval(batti, 500)
  const manda = async () => {
    const codice = f.codice.value.replace(/\D/g, '')
    if (codice.length !== 6 || inCorso) return
    inCorso = true; errore(b, ''); occupa(b, true)
    const d = await pzk.accedi(S.email, codice).catch(() => null)
    if (scatola !== b) return
    inCorso = false; occupa(b, false)
    if (d?.ok && d.nuovo && !d.token) return passoNome(codice)
    if (d?.ok) return dopoAccesso(false)
    if (d?.scaduto) S.fino = 0
    errore(b, d?.errore ?? T().rete); f.codice.select()
  }
  f.codice.addEventListener('input', () => { f.codice.value = f.codice.value.replace(/\D/g, '').slice(0, 6); nota = ''; if (f.codice.value.length === 6) manda() })
  f.addEventListener('submit', (e) => { e.preventDefault(); manda() })
  b.querySelector('[data-cambia]').addEventListener('click', () => passoEmail())
  ancora.addEventListener('click', async () => {
    ancora.disabled = true; dopo = Date.now() + 30_000
    const d = await pzk.codice(S.email).catch(() => null)
    if (scatola !== b) return
    if (!d?.ok) return errore(b, d?.errore ?? T().rete)
    S.fino = d.fino ?? S.fino; errore(b, ''); nota = t.mandato; tempo.textContent = nota; tempo.classList.add('ok'); f.codice.focus()
  })
}
function passoNome(codice) {
  const t = T().nome
  const b = passo(`<form novalidate>
      <h2>${esc(t.t)}</h2><p class="ax-s">${esc(t.s)}</p>
      <label class="ax-campo"><span>${esc(t.campo)}</span><input name="nome" type="text" maxlength="20" autocomplete="nickname" autocapitalize="off" spellcheck="false" autofocus required></label>
      <p class="ax-err" role="alert" hidden></p>
      <button type="submit" class="ax-b">${esc(t.vai)}</button>
    </form>`)
  const f = b.querySelector('form')
  f.addEventListener('submit', async (e) => {
    e.preventDefault()
    const nome = f.nome.value.trim()
    if ([...nome].length < 2) return errore(b, t.corto)
    errore(b, ''); occupa(b, true)
    const d = await pzk.accedi(S.email, codice, nome).catch(() => null)
    if (scatola !== b) return
    occupa(b, false)
    if (d?.ok && d.token) return dopoAccesso(!!d.nuovo)
    if (d?.scaduto) return passoEmail(d.errore)
    errore(b, d?.errore ?? T().rete); f.nome.select()
  })
}
/** Dentro. Il conto nuovo: il benvenuto, le novità, il regalo. Chi torna: le novità se non le ha viste, il regalo se non l'ha chiesto. */
function dopoAccesso(nuovo) {
  S.nuovo = nuovo
  document.dispatchEvent(new CustomEvent('pzkko-accesso', { detail: { nuovo } }))
  const daProporre = !pzk.seguo() && (nuovo || !dep.get(K_REGALO))
  const regalo = () => (daProporre ? passoRegalo() : chiudi())
  const novita = () => (nuovo || dep.get(K_NOVITA) !== NOVITA.v ? passoNovita(regalo, daProporre) : regalo())
  if (!nuovo) return novita()
  const t = T().ben, c = pzk.conto()
  const b = passo(`<div class="ax-ben">
      <div class="ax-festa" aria-hidden="true"><img src="${esc(avatar())}" alt="" width="64" height="64"><b>+1.000</b></div>
      <h2>${esc(t.t(c?.nome ?? ''))}</h2><p class="ax-s">${t.s(esc(c?.ind ?? ''), pzk.fmt(pzk.saldo()))}</p>
      <ul class="ax-punti">${t.punti.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <button type="button" class="ax-b" data-avanti>${esc(T().avanti)}</button>
    </div>`)
  b.querySelector('[data-avanti]').addEventListener('click', novita)
}

// ── le novità ──
function passoNovita(poi, avanti) {
  const t = T().nov
  dep.set(K_NOVITA, NOVITA.v)
  const b = passo(`<div class="ax-nov">
      <header><h2>${esc(t.t)}</h2><time>${esc(t.quando)}</time></header>
      <img class="ax-foto" src="${NOVITA.foto}" alt="" width="1280" height="800" loading="eager">
      ${t.sez.map(([col, titolo, voci]) => `<h3 class="${col}"><span>${esc(titolo)}</span></h3><ul>${voci.map((v) => `<li>${conP(v)}</li>`).join('')}</ul>`).join('')}
      <button type="button" class="ax-b" data-poi>${esc(avanti ? T().avanti : T().capito)}</button>
    </div>`, { largo: true })
  b.querySelector('.ax-foto').addEventListener('error', (e) => e.currentTarget.remove())
  b.querySelector('[data-poi]').addEventListener('click', () => (poi ? poi() : chiudi()))
}
/** Le novità, da sole. */
export async function novita() { await apri(); passoNovita(null, false); return new Promise((fatto) => { allaChiusura = fatto }) }
export const novitaDaVedere = () => dep.get(K_NOVITA) !== NOVITA.v

// ── il regalo di instagram ──
function passoRegalo(messaggio = '', forza = false) {
  const t = T().reg, s = pzk.seguo(), P = premioTxt()
  dep.set(K_REGALO, '1') // (proposto una volta: poi resta nel menu del conto e nella chat)
  if (s?.stato === 'dato' || (s?.stato === 'attesa' && !forza)) {
    const b = passo(`<div class="ax-reg fatto"><div class="ax-dono ${s.stato}" aria-hidden="true">${s.stato === 'dato' ? '✓' : '…'}</div>
        <h2>${esc(s.stato === 'dato' ? t.tDato : t.tAttesa)}</h2><p class="ax-s">${s.stato === 'dato' ? t.dato(P) : t.attesa(esc(s.ig))}</p>
        <button type="button" class="ax-b" data-chiudi>${esc(T().capito)}</button>
        ${s.stato === 'attesa' ? `<button type="button" class="ax-link" data-cambia>${esc(t.cambia)}</button>` : ''}</div>`)
    b.querySelector('[data-cambia]')?.addEventListener('click', () => passoRegalo('', true))
    return
  }
  const b = passo(`<form novalidate class="ax-reg">
      <div class="ax-dono" aria-hidden="true">+${esc(P)}</div>
      <h2>${esc(t.t(P))}</h2><p class="ax-s">${esc(t.s)}</p>
      <p class="ax-profili">${PROFILI.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${IG}<span>@${n}</span><i aria-hidden="true">↗</i></a>`).join('')}</p>
      <label class="ax-campo"><span>${esc(t.campo)}</span><span class="ax-chiocciola"><i>@</i><input name="ig" type="text" maxlength="60" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(s?.stato === 'no' || forza ? s?.ig ?? '' : '')}" required></span></label>
      <p class="ax-err" role="alert" hidden></p>
      <button type="submit" class="ax-b">${esc(t.vai)}</button>
      <button type="button" class="ax-link" data-chiudi>${esc(t.poi)}</button>
    </form>`)
  if (messaggio || s?.stato === 'no') { const e = b.querySelector('.ax-err'); e.innerHTML = messaggio ? esc(maiuscola(messaggio)) : t.no(esc(s.ig)); e.hidden = false }
  for (const a of b.querySelectorAll('.ax-profili a')) a.addEventListener('click', () => a.classList.add('visto'))
  const f = b.querySelector('form')
  f.addEventListener('submit', async (e) => {
    e.preventDefault()
    const ig = f.ig.value.trim()
    if (!ig) return errore(b, t.vuoto)
    errore(b, ''); occupa(b, true)
    const d = await pzk.chiediPremio(ig).catch(() => null)
    if (scatola !== b) return
    occupa(b, false)
    if (!d?.ok) return errore(b, d?.errore ?? T().rete)
    passoRegalo()
  })
}
/** Il regalo per chi mi segue su instagram: chi non ha un conto prima entra. */
export async function premio() {
  if (!pzk.conto()) {
    await apri()
    return new Promise((fatto) => { allaChiusura = () => fatto({ ok: !!pzk.conto() }); S.nuovo = false; dep.set(K_REGALO, ''); passoEmail(T().reg.serve) })
  }
  await pzk.sincronizza().catch(() => {}) // (lo stato di adesso: Alberto può aver deciso un minuto fa)
  await apri(); passoRegalo()
  return new Promise((fatto) => { allaChiusura = () => fatto({ ok: true }) })
}

// ── la parte di Alberto: il tasto della lettera (pzkko.it/?premio=…) ──
const banca = (body) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout?.(25_000) }).then((r) => r.json()).catch(() => ({ ok: false, errore: IT.rete }))
export async function decidi(biglietto) {
  await apri()
  const t = IT.dec, P = premioTxt()
  const fine = (testo) => passo(`<div class="ax-reg fatto"><h2>${esc(IT.reg.t(P))}</h2><p class="ax-s">${testo}</p><button type="button" class="ax-b" data-chiudi>${esc(IT.capito)}</button></div>`)
  passo(`<div class="ax-reg fatto"><p class="ax-s">${esc(t.guarda)}</p></div>`)
  const d = await banca({ a: 'premio-vedi', premio: biglietto })
  if (!aperto()) return
  if (!d.ok) return void fine(esc(d.errore ?? IT.rete))
  if (d.stato !== 'attesa') return void fine(esc(t.gia[d.stato] ?? ''))
  const quando = new Date(d.creato).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  const b = passo(`<div class="ax-reg">
      <h2>${esc(t.t(d.ig, P))}</h2><p class="ax-s">${t.s(esc(d.nome), esc(quando))}</p>
      <p class="ax-profili uno"><a href="https://www.instagram.com/${esc(d.ig)}/" target="_blank" rel="noopener noreferrer">${IG}<span>${esc(t.apri(d.ig))}</span><i aria-hidden="true">↗</i></a></p>
      <p class="ax-err" role="alert" hidden></p>
      <button type="button" class="ax-b verde" data-si>${esc(t.si(P))}</button>
      <button type="button" class="ax-b rosso" data-no>${esc(t.no)}</button>
    </div>`)
  const scegli = async (si) => {
    for (const x of b.querySelectorAll('.ax-b')) x.disabled = true
    const r = await banca({ a: 'premio-decidi', premio: biglietto, si })
    if (scatola !== b) return
    if (!r.ok) { for (const x of b.querySelectorAll('.ax-b')) x.disabled = false; return errore(b, r.errore ?? IT.rete) }
    fine(si ? t.dato(esc(r.nome), P) : t.detto(esc(r.nome)))
    if (pzk.conto()) pzk.sincronizza().catch(() => {}) // (se il conto è quello aperto qui, il saldo si vede subito)
  }
  b.querySelector('[data-si]').addEventListener('click', () => scegli(true))
  b.querySelector('[data-no]').addEventListener('click', () => scegli(false))
}

/**
 * ALL'ARRIVO NEL SITO (lo chiama il profilo quando la pagina è ferma). Col tasto della lettera: la decisione di Alberto. Chi
 * non ha un conto: l'invito, una volta per visita e non più di una volta ogni dodici ore. Chi ce l'ha: le novità, se non le
 * ha ancora viste. Gli strumenti che fotografano la pagina non vedono niente (navigator.webdriver), se non con ?invito.
 */
export async function arrivo() {
  const q = new URLSearchParams(location.search), biglietto = q.get('premio')
  if (biglietto) {
    q.delete('premio'); history.replaceState(history.state, '', location.pathname + (q.size ? `?${q}` : '') + location.hash)
    return decidi(biglietto)
  }
  const forza = q.has('invito')
  if ((navigator.webdriver && !forza) || document.querySelector('dialog[open]')) return
  if (pzk.conto()) { if (novitaDaVedere()) return novita(); return }
  let visto = 0
  try { if (sessionStorage.getItem(K_INVITO)) visto = Date.now(); else visto = Number(dep.get(K_INVITO)) || 0 } catch {}
  if (!forza && Date.now() - visto < 12 * 3600_000) return
  try { sessionStorage.setItem(K_INVITO, '1') } catch {}
  dep.set(K_INVITO, String(Date.now()))
  return invito()
}
