// L'ACCESSO DI PZKKO.IT (19.11: «riprogetta i login e i register e i recupera password … no password, solo codici
// di verifica via email … tutto molto stile discord … deve essere super facile … appena entri invita molto bene il visitatore
// ad entrare in questo mondo, poi ricordali delle novità … se mi segue su instagram avrà 2000pzk in regalo,
// ovviamente dovrà scrivere prima il suo ig, poi a me arriva una notifica … e poi se mi segue inviali il premio»).
//
// Un riquadro solo, come quelli di Discord, che fa tutto e che aprono il profilo, la chat, il cercapersone e i tavoli:
// - invito(): l'invito, come quelli dei server di Discord (chi invita, quanti membri, la banca accesa o no, cosa c'è dentro);
// - accedi(): l'email → il codice di sei cifre arrivato per posta (dieci minuti) → il nome, solo se il conto è nuovo. Accedere
//   e registrarsi sono la stessa strada, e la password da recuperare non c'è: ogni volta arriva un codice;
// - novita(): le novità, come il «Novità» di Discord (una volta per versione, dopo l'accesso o all'arrivo di chi è già dentro);
// - premio(): il regalo per chi mi segue su Instagram: si scrive il proprio nome, la banca avvisa
//   pzkko, che guarda fra i follower e decide; decidi(biglietto) è la sua parte (pzkko.it/?premio=…, dal tasto della lettera);
// - arrivo(): quello che la pagina fa da sola quando si entra nel sito.
// Tutto passa dalla banca sul pc di pzkko (games/pzk.js: codice, accedi, chiediPremio): se il pc è spento qui non si entra.
// I testi in italiano e in inglese (le altre lingue del profilo vedono l'inglese).
//
// 25.11 (pzkko: «rifai tutti i popup di pzkko con il mio stile pzk, invoglia la gente a usare le mie app»): il riquadro è
// un foglio del muro (accesso.css), e dentro l'invito e le novità ci sono le app vere coi loro tasti. Un tasto d'app chiude
// il riquadro e chiede alla pagina di aprirla (l'evento «pzkko-apri», che il profilo raccoglie); dove nessuno lo raccoglie
// (il muro e le pagine vecchie) si va alla scheda del progetto sul profilo.
import * as pzk from '../games/pzk.js'

const NOVITA = { v: '2026-11-25', foto: '/media/p/calcolatrice/cover.webp' } // la versione delle novità: cambiala e tornano fuori
// le app che l'invito mette in vetrina: [progetto, cosa apre, nome]. Le catture arrivano da media.js
const VETRINA = [['zero', 'qui:zero', 'PZK Zero'], ['parole', 'qui:parole', 'Parole'], ['giochini', 'qui:roulette', 'Roulette'], ['trivia', 'qui:trivia', 'Trivia']]
const FICHE = { '$': 'f500', '♠': 'f100', '@': 'f25', '♥': 'f5' }
const K_NOVITA = 'pzkko-novita-profilo', K_EMAIL = 'pzkko-email', K_INVITO = 'pzkko-invito', K_REGALO = 'pzkko-regalo-poi', K_PREMI = 'pzkko-regali-visti'
const PROFILI = [['pzkko', 'https://www.instagram.com/pzkko/']]
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
    cose: [['$', '<b>1.000 $pzk</b> appena entri'], ['♠', 'Roulette, blackjack, mine, <b>Parole</b>, <b>Trivia</b>, <b>pzkmaps</b> e gli altri tavoli'], ['@', '<b>Niente password</b>: ti arriva un codice per email'], ['♥', `<b>+${'{P}'} $pzk</b> se mi segui su Instagram`]],
    app: 'provale subito, anche da ospite:',
    accetta: 'Accetta l’invito', ospite: 'Continua come ospite', nota: 'Da ospite si gioca lo stesso, ma non si salva niente.' },
  email: { t: 'Entra in pzkko.it', s: 'Scrivi la tua email: ti mando un codice. Serve per salvare i $pzk, lo zaino, i livelli e la chat su ogni dispositivo. Che tu abbia già un conto o no, la strada è questa.', campo: 'Email', vai: 'Mandami il codice', nota: 'Niente password: il codice vale 10 minuti e una volta sola. L’email resta sul server di pzkko e non va a nessun altro.', sicuro: 'Come funziona e perché è sicuro', sbagliata: 'Questa email non mi torna: controllala.' },
  prova: { link: 'Apri la lettera di prova', nota: 'Fase sperimentale: la lettera non arriva nella posta, si apre qui in una casella usa e getta. Appena c’è l’indirizzo @pzkko.it si torna alla posta normale.' },
  cod: { t: 'Controlla la posta', s: (e) => `Ho mandato un codice di sei cifre a <b>${e}</b>.`, campo: 'Codice di sei cifre', vale: (t) => `Vale ancora ${t}`, scaduto: 'Il codice è scaduto: chiedine uno nuovo.', entra: 'Entra', ancora: 'Non arriva? Mandalo di nuovo', fra: (s) => `Mandalo di nuovo fra ${s} s`, mandato: 'Rimandato: guarda anche nello spam.', cambia: 'Cambia email' },
  nome: { t: 'Come ti chiami?', s: 'È il nome che gli altri vedono in classifica. Da 2 a 20 lettere.', campo: 'Nome', vai: 'Crea il conto', corto: 'Almeno 2 lettere.' },
  ben: { t: (n) => `Benvenuto, ${n}!`, s: (i, p) => `Sul tuo conto ci sono <b>${p} $pzk</b>. Il tuo indirizzo è <code>${i}</code>: serve per farti mandare $pzk dagli amici.`, punti: ['Soldi, zaino e livelli si salvano da soli, nella banca.', 'La prossima volta scrivi l’email e ti arriva un codice nuovo.'] },
  nov: { t: 'Novità', quando: '25 novembre 2026',
    // una voce è il testo, oppure [testo, cosa apre, scritta del tasto]
    sez: [['verde', 'Giochi e app nuovi', [['<b>pzkmaps.</b> Sei su una strada, da qualche parte nel mondo: indovina dove.', 'qui:pzkmaps', 'gioca'], ['<b>Angoli.</b> Un minuto per indovinare quanto è largo l’angolo, in gradi centesimali.', 'qui:angoli', 'gioca'], ['<b>Calcolatrice.</b> Quella scientifica del geometra: gon, triangoli, coordinate.', 'qui:calcolatrice', 'apri'], ['<b>Le app del cercapersone, da sole.</b> Miniera, Borsa $pzk, Cucina del Mincio, Codice C, Rapina.', 'qui:app:miniera', 'prova']]],
      ['blu', 'Sul sito', ['<b>Tutto in stile pzk.</b> Accesso, ricerca, schede e menu sono fogli del muro, come i tavoli.', '<b>Community e Instagram in bacheca.</b> I numeri dei due server e le storie in evidenza, senza account.']],
      ['rosa', 'Regali', [`<b>${'{P}'} $pzk</b> se mi segui su Instagram.`]]] },
  reg: { t: (p) => `${p} $pzk in regalo`, s: 'Seguimi su Instagram, poi scrivi qui il tuo nome. Guardo io fra i follower: se ci sei, ti arrivano.', campo: 'Il tuo Instagram', vai: 'Chiedi il regalo', poi: 'Più tardi', vuoto: 'Scrivi il tuo nome di Instagram.',
    attesa: (g) => `Richiesta mandata come <b>@${g}</b>. Appena controllo ti arrivano i $pzk, e ti scrivo per email.`, tAttesa: 'Richiesta mandata', cambia: 'Ho sbagliato nome',
    dato: (p) => `Sono arrivati <b>${p} $pzk</b>. Grazie del follow!`, tDato: 'Regalo arrivato',
    no: (g) => `Fra i follower non ho trovato <b>@${g}</b>. Controlla il nome e riprova.`, serve: 'Per il regalo serve un conto: entra, ci metti un attimo.' },
  dec: { t: (g, p) => `@${g} chiede i ${p} $pzk`, s: (n, q) => `<b>${n}</b> (conto del ${q}) dice di seguirti su Instagram.`, apri: (g) => `Apri @${g} su Instagram`, si: (p) => `Sì, mi segue: manda i ${p}`, no: 'No, non lo trovo',
    dato: (n, p) => `Fatto: ${p} $pzk mandati a <b>${n}</b>. Gli ho scritto.`, detto: (n) => `Detto di no a <b>${n}</b>: può richiederlo col nome giusto.`, gia: { dato: 'Il regalo gliel’hai già dato.', no: 'Gli hai già detto di no.' }, guarda: 'Guardo la richiesta…' },
  premi: { t: 'Regali da decidere', s: (n) => `${n === 1 ? 'C’è una richiesta' : `Ci sono ${n} richieste`}: chi ha scritto il suo Instagram e dice di seguirti. Guardo fra i follower e decido io.`, vuoto: 'Nessuna richiesta: quando qualcuno chiede il regalo, lo trovi qui.', apri: 'controlla', quando: (q) => `chiesto il ${q}`, lettera: 'la lettera', guarda: 'Guardo le richieste…' },
}
const EN = {
  chiudi: 'Close', indietro: 'Back', avanti: 'Next', capito: 'Got it', rete: 'The bank isn’t answering: try again in a moment.',
  inv: { da: 'pzkko invited you to join', accesa: 'bank online', pausa: 'bank paused', membri: (n) => `${n} ${n === 1 ? 'member' : 'members'}`,
    testo: 'One account for the whole site: what you win, buy and unlock stays yours, on every device.',
    cose: [['$', '<b>1,000 $pzk</b> as soon as you join'], ['♠', 'Roulette, blackjack, mines, <b>Parole</b>, <b>Trivia</b>, <b>pzkmaps</b> and the other tables'], ['@', '<b>No password</b>: you get a code by email'], ['♥', `<b>+${'{P}'} $pzk</b> if you follow me on Instagram`]],
    app: 'try them now, even as a guest:',
    accetta: 'Accept invite', ospite: 'Continue as guest', nota: 'Guests can play too, but nothing is saved.' },
  email: { t: 'Join pzkko.it', s: 'Type your email: I’ll send you a code. It saves your $pzk, backpack, levels and chat on every device. New or returning, it’s the same road.', campo: 'Email', vai: 'Send me the code', nota: 'No password: the code lasts 10 minutes and works once. Your email stays on pzkko’s server and goes nowhere else.', sicuro: 'How it works and why it’s safe', sbagliata: 'That email doesn’t look right.' },
  prova: { link: 'Open the test letter', nota: 'Experimental phase: the letter is not delivered, it opens here in a disposable inbox. Once the @pzkko.it address is ready, we go back to normal email.' },
  cod: { t: 'Check your inbox', s: (e) => `I sent a six-digit code to <b>${e}</b>.`, campo: 'Six-digit code', vale: (t) => `Valid for ${t}`, scaduto: 'The code expired: ask for a new one.', entra: 'Log in', ancora: 'Didn’t get it? Send again', fra: (s) => `Send again in ${s}s`, mandato: 'Sent again: check spam too.', cambia: 'Change email' },
  nome: { t: 'What’s your name?', s: 'It’s the name others see on the leaderboard. 2 to 20 letters.', campo: 'Name', vai: 'Create account', corto: 'At least 2 letters.' },
  ben: { t: (n) => `Welcome, ${n}!`, s: (i, p) => `You have <b>${p} $pzk</b>. Your address is <code>${i}</code>: friends use it to send you $pzk.`, punti: ['Money, backpack and levels save themselves, in the bank.', 'Next time just type your email and a new code arrives.'] },
  nov: { t: 'What’s new', quando: 'November 25, 2026',
    sez: [['verde', 'New games and apps', [['<b>pzkmaps.</b> You’re on a road somewhere in the world: guess where.', 'qui:pzkmaps', 'play'], ['<b>Angoli.</b> One minute to guess how wide the angle is, in gradians.', 'qui:angoli', 'play'], ['<b>Calculator.</b> The surveyor’s scientific one: gon, triangles, coordinates.', 'qui:calcolatrice', 'open'], ['<b>The pager apps, on their own.</b> Mine, $pzk Exchange, Mincio Kitchen, C Code, Heist.', 'qui:app:miniera', 'try']]],
      ['blu', 'On the site', ['<b>Everything in pzk style.</b> Login, search, project cards and menus are sheets from the wall, like the tables.', '<b>Community and Instagram on the board.</b> The two servers’ numbers and the story highlights, no account needed.']],
      ['rosa', 'Gifts', [`<b>${'{P}'} $pzk</b> if you follow me on Instagram.`]]] },
  reg: { t: (p) => `${p} $pzk gift`, s: 'Follow me on Instagram, then type your name here. I check my followers by hand: if you’re there, they’re yours.', campo: 'Your Instagram', vai: 'Ask for the gift', poi: 'Later', vuoto: 'Type your Instagram name.',
    attesa: (g) => `Request sent as <b>@${g}</b>. As soon as I check you get the $pzk, and an email.`, tAttesa: 'Request sent', cambia: 'Wrong name',
    dato: (p) => `<b>${p} $pzk</b> arrived. Thanks for the follow!`, tDato: 'Gift arrived',
    no: (g) => `I couldn’t find <b>@${g}</b> among the followers. Check the name and try again.`, serve: 'The gift needs an account: log in, it takes a moment.' },
  dec: IT.dec,
  premi: { t: 'Gifts to decide', s: (n) => `${n === 1 ? 'There’s one request' : `There are ${n} requests`}: people who wrote their Instagram and say they follow you. I check my followers and decide.`, vuoto: 'No requests: when someone asks for the gift, you’ll find them here.', apri: 'check', quando: (q) => `asked on ${q}`, lettera: 'the letter', guarda: 'Looking at the requests…' },
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
function chiudi() { if (!aperto()) return; dlg.classList.add('via'); setTimeout(() => dlg?.close(), 140) }
/** Mette un passo nel riquadro. `largo`: il riquadro delle novità. → la scatola, per attaccarci i tasti */
function passo(html, { largo = false, classe = '' } = {}) {
  clearInterval(orologio)
  scatola.className = `ax-box ${largo ? 'largo' : ''} ${classe}`
  scatola.innerHTML = `<button type="button" class="ax-x" data-chiudi aria-label="${esc(T().chiudi)}"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button><div class="ax-passo">${html}</div>`
  const primo = scatola.querySelector('[autofocus]') ?? scatola.querySelector('.ax-b')
  requestAnimationFrame(() => primo?.focus({ preventScroll: true }))
  return scatola
}
/** Un tasto d'app: chiude il riquadro e chiede alla pagina di aprire l'app; se nessuno risponde, la scheda sul profilo. */
function apriApp(app, chiave = String(app).replace(/^qui:(app:)?/, '')) {
  chiudi()
  setTimeout(() => {
    const e = new CustomEvent('pzkko-apri', { detail: { app, chiave }, cancelable: true })
    if (document.dispatchEvent(e)) location.href = chiave ? `/#progetti/${encodeURIComponent(chiave)}` : '/#progetti'
  }, 160)
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
      <div class="ax-foto-av"><img src="${esc(avatar())}" alt="" width="96" height="96"></div>
      <p class="ax-voce">${esc(t.da)}</p>
      <h2>pzkko.it</h2>
      <p class="ax-conta"><span class="ax-timbro" data-banca>…</span><span class="ax-timbro" data-membri hidden><b></b></span></p>
      <p class="ax-s">${esc(t.testo)}</p>
      <ul class="ax-cose">${t.cose.map(([i, x]) => `<li><img src="/art/fiches/${FICHE[i] ?? 'f5'}.webp" alt="" width="32" height="32"><span>${conP(x)}</span></li>`).join('')}</ul>
      <div class="ax-app" data-vetrina hidden><p>${esc(t.app)}</p><ul></ul></div>
      <button type="button" class="ax-b" data-accetta>${esc(t.accetta)}</button>
      <button type="button" class="ax-link" data-chiudi>${esc(t.ospite)}</button>
      <p class="ax-nota">${esc(t.nota)}</p>
    </div>`, { classe: 'invito' })
  // i numeri veri: quanti conti ci sono, e se la banca (il pc di pzkko) risponde
  fetch(API, { signal: AbortSignal.timeout?.(12_000) }).then((r) => r.json()).catch(() => null).then((d) => {
    if (scatola !== b || !b.querySelector('[data-banca]')) return
    const su = !!d?.ok, banca = b.querySelector('[data-banca]')
    banca.textContent = su ? t.accesa : t.pausa
    banca.classList.add(su ? 'su' : 'giu')
    if (su && Number.isFinite(d.conti) && d.conti > 0) { const m = b.querySelector('[data-membri]'); m.hidden = false; m.querySelector('b').textContent = t.membri(d.conti) }
  })
  // la vetrina: le app vere, con la loro cattura; un clic e si gioca, anche da ospite
  vetrina(b.querySelector('[data-vetrina]'))
  return new Promise((fatto) => {
    allaChiusura = () => fatto({ ok: !!pzk.conto() })
    b.querySelector('[data-accetta]').addEventListener('click', () => passoEmail())
  })
}

/** Le polaroid delle app nell'invito: la cattura vera (media.js) o, senza cattura, i colori del progetto (config.js). */
async function vetrina(box) {
  if (!box) return
  const [{ MEDIA }, { PROJECTS }] = await Promise.all([import('/assets/media.js'), import('/assets/config.js')]).catch(() => [{}, {}])
  if (!MEDIA || !box.isConnected) return
  box.querySelector('ul').innerHTML = VETRINA.map(([k, app, nome]) => {
    const m = MEDIA[k], art = PROJECTS?.find((p) => p.key === k)?.art ?? []
    return `<li><button type="button" data-app="${esc(app)}" data-chiave="${esc(k)}"><span class="ax-pic" style="--c1:${esc(art[0] ?? '#333')};--c2:${esc(art[1] ?? '#111')}">${m ? `<img src="${esc(m.cover)}" alt="" width="1280" height="720" loading="lazy" decoding="async">` : `<i>${esc(nome)}</i>`}</span><b>${esc(nome)}</b></button></li>`
  }).join('')
  box.hidden = false
  box.addEventListener('click', (e) => { const x = e.target.closest('[data-app]'); if (x) apriApp(x.dataset.app, x.dataset.chiave) })
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
      <p class="ax-nota"><a class="ax-link" href="/accesso/" target="_blank" rel="noopener noreferrer">${esc(t.sicuro)}</a></p>
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
    passoCodice('', d.prova)
  })
}
const minuti = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
function passoCodice(nota = '', prova = '') {
  const t = T().cod, pv = T().prova
  const b = passo(`<form novalidate>
      <h2>${esc(t.t)}</h2><p class="ax-s">${t.s(esc(S.email))}</p>
      <label class="ax-campo"><span>${esc(t.campo)}</span><input class="ax-cifre" name="codice" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="••••••" autofocus required></label>
      <p class="ax-err" role="alert" hidden></p>
      <p class="ax-tempo" data-tempo></p>
      <button type="submit" class="ax-b">${esc(t.entra)}</button>
      <p class="ax-riga"><button type="button" class="ax-link" data-ancora disabled></button><button type="button" class="ax-link" data-cambia>${esc(t.cambia)}</button></p>
      <p class="ax-prova" data-prova hidden><a href="" target="_blank" rel="noopener noreferrer">${esc(pv.link)}</a><span>${esc(pv.nota)}</span></p>
    </form>`)
  const f = b.querySelector('form'), ancora = b.querySelector('[data-ancora]'), tempo = b.querySelector('[data-tempo]'), provaEl = b.querySelector('[data-prova]')
  const mostraProva = (url) => { if (!url || !provaEl) return; provaEl.querySelector('a').href = url; provaEl.hidden = false }
  if (prova) mostraProva(prova)
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
    S.fino = d.fino ?? S.fino; errore(b, ''); nota = t.mandato; tempo.textContent = nota; tempo.classList.add('ok'); mostraProva(d.prova); f.codice.focus()
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
      <div class="ax-foto-av" aria-hidden="true"><img src="${esc(avatar())}" alt="" width="96" height="96"><b>+1.000</b></div>
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
  const voce = (v) => {
    const [testo, app, tasto] = Array.isArray(v) ? v : [v]
    return `<li><span>${conP(testo)}</span>${app ? `<button type="button" class="ax-gioca" data-app="${esc(app)}">${esc(tasto)}</button>` : ''}</li>`
  }
  const b = passo(`<div class="ax-nov">
      <header><h2>${esc(t.t)}</h2><time>${esc(t.quando)}</time></header>
      <img class="ax-foto" src="${NOVITA.foto}" alt="" width="1280" height="720" loading="eager">
      ${t.sez.map(([col, titolo, voci]) => `<h3 class="${col}">${esc(titolo)}</h3><ul>${voci.map(voce).join('')}</ul>`).join('')}
      <button type="button" class="ax-b" data-poi>${esc(avanti ? T().avanti : T().capito)}</button>
    </div>`, { largo: true })
  b.querySelector('.ax-foto').addEventListener('error', (e) => e.currentTarget.remove())
  b.querySelector('[data-poi]').addEventListener('click', () => (poi ? poi() : chiudi()))
  for (const x of b.querySelectorAll('.ax-gioca')) x.addEventListener('click', () => apriApp(x.dataset.app))
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
  await pzk.sincronizza().catch(() => {}) // (lo stato di adesso: pzkko può aver deciso un minuto fa)
  await apri(); passoRegalo()
  return new Promise((fatto) => { allaChiusura = () => fatto({ ok: true }) })
}

// ── la parte di pzkko: il tasto della lettera (pzkko.it/?premio=…) ──
const banca = (body) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout?.(25_000) }).then((r) => r.json()).catch(() => ({ ok: false, errore: IT.rete }))
/** L'elenco dei regali da decidere (solo il conto di pzkko): il tasto «regali» del sito, e l'arrivo quando ne arriva uno.
 *  Le richieste ci sono anche se la lettera non è partita: la posta della banca può essere giù, la richiesta no. */
export async function premi() {
  if (!pzk.conto()) return premio() // senza conto prima si entra (e si chiede il regalo)
  await apri()
  const chiuso = new Promise((fatto) => { allaChiusura = fatto })
  const t = T().premi
  const attesa = passo(`<div class="ax-reg fatto"><h2>${esc(t.t)}</h2><p class="ax-s">${esc(t.guarda)}</p></div>`)
  const d = await banca({ a: 'premio-lista', token: pzk.token() })
  if (scatola !== attesa) return chiuso
  if (!d?.ok) {
    passo(`<div class="ax-reg fatto"><h2>${esc(t.t)}</h2><p class="ax-s">${esc(d?.errore ?? T().rete)}</p><button type="button" class="ax-b" data-chiudi>${esc(T().capito)}</button></div>`)
    return chiuso
  }
  const lista = d.premi ?? []
  if (!lista.length) {
    passo(`<div class="ax-reg fatto"><h2>${esc(t.t)}</h2><p class="ax-s">${esc(t.vuoto)}</p><button type="button" class="ax-b" data-chiudi>${esc(T().capito)}</button></div>`)
    return chiuso
  }
  const data = (ms) => new Date(ms).toLocaleDateString(it() ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long' })
  const b = passo(`<div class="ax-nov">
      <h2>${esc(t.t)}</h2><p class="ax-s">${esc(t.s(lista.length))}</p>
      <ul>${lista.map((x) => `<li><span><b>@${esc(x.ig)}</b> · ${esc(x.nome)}<br><small>${esc(t.quando(data(x.t)))}${x.lettera ? ` · <a href="${esc(x.lettera)}" target="_blank" rel="noopener noreferrer">${esc(t.lettera)}</a>` : ''}</small></span><button type="button" class="ax-gioca" data-premio="${esc(x.biglietto)}">${esc(t.apri)}</button></li>`).join('')}</ul>
      <button type="button" class="ax-b" data-chiudi>${esc(T().capito)}</button>
    </div>`, { largo: true })
  for (const x of b.querySelectorAll('[data-premio]')) x.addEventListener('click', () => decidi(x.dataset.premio))
  return chiuso
}
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
 * ALL'ARRIVO NEL SITO (lo chiama il profilo quando la pagina è ferma). Col tasto della lettera: la decisione di pzkko. Chi
 * non ha un conto: l'invito, una volta per visita e non più di una volta ogni dodici ore. Chi ce l'ha: le novità, se non le
 * ha ancora viste, e i regali di instagram da decidere quando ne arriva uno nuovo (solo il conto di pzkko). Gli strumenti che
 * fotografano la pagina non vedono niente (navigator.webdriver), se non con ?invito.
 */
export async function arrivo() {
  const q = new URLSearchParams(location.search), biglietto = q.get('premio')
  if (biglietto) {
    q.delete('premio'); history.replaceState(history.state, '', location.pathname + (q.size ? `?${q}` : '') + location.hash)
    return decidi(biglietto)
  }
  const forza = q.has('invito')
  if ((navigator.webdriver && !forza) || document.querySelector('dialog[open]')) return
  if (pzk.conto()) {
    if (novitaDaVedere()) return novita()
    await pzk.sincronizza().catch(() => {}) // (25.11: i regali da decidere arrivano dalla banca: si guardano adesso)
    const ultimo = pzk.premi().reduce((m, x) => Math.max(m, Number(x.t) || 0), 0)
    if (ultimo && ultimo > (Number(dep.get(K_PREMI)) || 0)) { dep.set(K_PREMI, String(ultimo)); return premi() }
    return
  }
  let visto = 0
  try { if (sessionStorage.getItem(K_INVITO)) visto = Date.now(); else visto = Number(dep.get(K_INVITO)) || 0 } catch {}
  if (!forza && Date.now() - visto < 12 * 3600_000) return
  try { sessionStorage.setItem(K_INVITO, '1') } catch {}
  dep.set(K_INVITO, String(Date.now()))
  return invito()
}
