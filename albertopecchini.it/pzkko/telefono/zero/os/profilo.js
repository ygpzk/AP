// L'app «profilo» di pzk os (29.10, Alberto: «ora crea app profilo fatta benissimo»): chi sei a pzkko, con tutti i numeri,
// sul cercapersone zero. La logica e i numeri sono quelli del profilo del cercapersone vecchio (telefono/app/profilo.js: le
// facce con le rarità, i prezzi e i blocchi, compraFaccia, i colori e le cornici; i conti dal libro del server,
// games/libro.mjs; le classifiche, chat/db.js). Qui c'è solo la faccia a 8 bit, fatta come il Flipper:
// - SEI PAGINE che si sfogliano con ← → (e ↑ ↓): il cartellino, i soldi, i giochi grandi, la vita col bot, i progressi,
//   le classifiche. I pallini in alto dicono dove sei; cambiando pagina il contenuto scorre di lato.
// - OK apre la MODIFICA: la faccia, il colore, la cornice e il motto, con l'anteprima del cartellino che cambia subito.
// - LA FACCIA: la griglia di tutte le facce (quelle non tue sbiadite), sotto la grande col nome, la rarità e il prezzo.
//   OK la mette o la compra (con un dialogo); le leggendarie chiuse dicono cosa manca.
// Il colore, su un lcd a un bit, è una trama (TRAMA); la cornice si disegna davvero (nastro, oro, neon, pixel).
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import { txt, corto, destra, centro, sposta, testata, striscia } from './pezzi.js'
import * as zaino from '../../../chat/zaino.js'
import * as pzk from '../../../games/pzk.js'
import * as db from '../../../chat/db.js'
import { conti } from '../../../games/libro.mjs'
import { nomeDi } from '../../../chat/testi.js'
import { COLORI, CORNICI, facce, faccia, nomeAv, compraFaccia, salva } from '../../app/profilo.js'

// ── i pezzi piccoli ──
const f = (x) => pzk.fmtCorto(Math.round(x ?? 0))
// (11.11) il prezzo e il saldo di una faccia, interi: col corto 1.498 e 1.500 erano tutti e due «1,5K», e «costa 1,5K e ne
// hai 1,5K» non diceva perché non si compra
const intero = (x) => pzk.fmt(Math.round(x ?? 0))
/** La rotellina che gira mentre si aspetta la banca. */
const ruota = (t) => ['|', '/', '-', '\\'][(t ?? 0) % 4]
const segno = (x) => `${x > 0 ? '+' : ''}${pzk.fmtCorto(Math.round(x ?? 0))}`
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—')
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const pul = () => (pzk.sporchi() > 0 ? ' puliti' : '') // (si spendono solo quelli: detto quando ci sono anche gli sporchi)
const avOra = () => faccia(zaino.profilo().av, zaino.mestiere())
/** Un'icona sempre: se la webp non è ancora arrivata, intanto la chiocciola (icone.ascolta ridisegna quando arriva). */
const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('bot', lato)
/** Un'icona sbiadita (le facce non tue): un pixel sì e uno no. */
function sbiadita(l, b, x, y) { for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.bit[j * b.w + i] && (i + j) % 2 === 0) l.px(x + i, y + j) }

// il colore del cartellino su un lcd a un bit: una trama per colore (nell'app giocatori gli altri lo vedono a colori)
const TRAMA = {
  verde: (x, y) => (x + y) % 2 === 0, giallo: (x, y) => x % 3 === 0 && y % 3 === 0, rosso: () => true, arancio: (x) => x % 2 === 0,
  rosa: (x, y) => y % 2 === 0, viola: (x, y) => (x + y) % 3 === 0, blu: (x, y) => x % 2 === 0 || y % 2 === 0, bianco: () => false,
}
function campione(l, col, x, y, w = 13, h = 7, inv = false) {
  const v = inv ? 0 : 1 // (dentro la fascia scura della riga scelta: rovesciato, se no scuro su scuro non si vede)
  l.riquadro(x, y, w, h, v)
  const t = TRAMA[col] ?? TRAMA.verde
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) if (t(i, j)) l.px(x + i, y + j, v)
}
/** La cornice del cartellino, disegnata: nastro (smussata), oro (doppia), neon (a puntini), pixel (spessa a gradini). */
function cornice(l, tipo, x, y, w, h) {
  if (tipo === 'nessuna') return
  if (tipo === 'oro') { l.riquadro(x, y, w, h); l.riquadro(x + 2, y + 2, w - 4, h - 4); return }
  if (tipo === 'neon') {
    for (let i = 1; i < w - 1; i += 2) { l.px(x + i, y); l.px(x + i, y + h - 1) }
    for (let j = 1; j < h - 1; j += 2) { l.px(x, y + j); l.px(x + w - 1, y + j) }
    l.cornice(x + 2, y + 2, w - 4, h - 4)
    return
  }
  if (tipo === 'pixel') {
    l.riempi(x + 3, y, w - 6, 2); l.riempi(x + 3, y + h - 2, w - 6, 2); l.riempi(x, y + 3, 2, h - 6); l.riempi(x + w - 2, y + 3, 2, h - 6)
    for (const [a, b] of [[x + 1, y + 1], [x + w - 3, y + 1], [x + 1, y + h - 3], [x + w - 3, y + h - 3]]) l.riempi(a, b, 2, 2)
    return
  }
  l.cornice(x, y, w, h)
}
// ── il mio profilo dal server (il titolo, le posizioni in classifica): solo col conto ──
// (di chi è e quando: cambiando conto restavano il titolo e le classifiche dell'altro, e non si rileggeva mai)
let io = null, giroIo = 0, ioDi = null, ioT = 0 // io: null | 'carico' | { ok: false, errore } | il profilo
const ioMio = () => (ioDi === (pzk.conto()?.ind ?? null) ? io : null)
const ioOk = () => { const d = ioMio(); return d && d !== 'carico' && d.ok !== false ? d : null }
/** Da rileggere: un altro conto, o niente di buono, o più vecchio di un minuto (e non sta già arrivando). */
const daRileggere = () => !!pzk.conto() && (ioDi !== pzk.conto().ind || (io !== 'carico' && (!ioOk() || Date.now() - ioT > 60_000)))
async function caricaIo(os) {
  const c = pzk.conto()
  if (!c) { io = null; ioDi = null; return }
  const mio = ++giroIo, prima = ioOk() // (lo stesso conto: intanto resta quello di prima, niente «carico» che lampeggia)
  io = prima ?? 'carico'; ioDi = c.ind; ioT = Date.now(); os.ridisegna()
  // (11.11: db.io non ha un tempo massimo, e se la rete non rispondeva restava «carico...» per sempre, anche tornando sulla
  // pagina: daRileggere non rilegge mentre carica. Dopo 15 secondi è «il server non risponde», e la volta dopo si riprova)
  let d = null, timer = null
  try { d = await Promise.race([db.io(), new Promise((r) => { timer = setTimeout(() => r({ ok: false, errore: 'il server non risponde' }), 15_000) })]) } catch {} finally { clearTimeout(timer) }
  if (mio !== giroIo) return
  io = d?.ok && d.profilo ? d.profilo : prima ?? { ok: false, errore: d?.errore ?? 'il server non risponde' }
  ioT = Date.now()
  os.ridisegna()
}

// ── le pagine (y da 34 a 116; l è già spostato quando la pagina scorre) ──
function pCartellino(l, k) {
  const pr = zaino.profilo(), c = pzk.conto(), liv = zaino.livello(), xp = zaino.xp(), da = zaino.xpPer(liv), a = zaino.xpPer(liv + 1)
  cornice(l, pr.cor, 6, 33, 244, 84)
  l.bitmap(bm(avOra(), 32), 13, 39)
  // il bollino del livello sotto la faccia, nel suo posto da x 10 a 49 (dentro la cornice doppia, prima del nome a 52):
  // «liv 99» con due pixel d'aria, e solo il numero quando non ci sta (livello 100 e oltre; il ≤ 32 lo toglieva già dal 10)
  const BOL = 40, lv = Lcd.larghezza(`liv ${liv}`) + 4 <= BOL ? `liv ${liv}` : `${liv}`, lw = Math.min(BOL, Lcd.larghezza(lv) + 6), xl = 10 + Math.round((BOL - lw) / 2)
  l.riempi(xl, 74, lw, 11); l.testo(xl + Math.round((lw - Lcd.larghezza(lv)) / 2), 76, lv, { inv: true })
  l.testo(52, 39, corto(c?.nome ?? 'ospite', 16), { scala: 2 })
  const dal = c?.creato && !Number.isNaN(new Date(c.creato).getTime()) ? ` · dal ${new Date(c.creato).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''
  l.testo(52, 56, corto(c ? `${c.ind}${dal}` : 'sessione: niente si salva', 32)) // (la data solo se c'è: senza, era «dal Invalid Date»)
  // (11.11: tutte in una riga tagliata a 32 diventavano «pino · in galera fino alle 06:5…», e gli sporchi sparivano. Ora i
  // pezzi restano interi e vanno a capo fra l'uno e l'altro, al più due righe; il motto prende le righe che restano fino a 83)
  const note = [ioOk()?.titolo, pzk.inGalera() && `in galera fino alle ${ora(pzk.galera())}`, pzk.sporchi() && `${f(pzk.sporchi())} sporchi`].filter(Boolean).map((s) => corto(s, 32))
  const rn = []
  for (const s of note) { const u = rn.length - 1; if (u >= 0 && [...`${rn[u]} · ${s}`].length <= 32) rn[u] += ` · ${s}`; else rn.push(s) }
  rn.slice(0, 2).forEach((s, i) => l.testo(52, 65 + i * 9, s))
  const dm = Math.max(1, Math.min(2, rn.length)), posto = 3 - dm // (il motto comincia a 74 come sempre, a 83 se le note sono due righe)
  if (pr.mot) { const r = Lcd.acapo(txt(`"${pr.mot}"`), 32); r.slice(0, posto).forEach((s, i) => l.testo(52, 65 + (dm + i) * 9, i === posto - 1 && r.length > posto ? corto(`${s}…`, 32) : s)) } // (corto(s, 31) + «…» dava «……»)
  const p = Math.max(0, Math.min(1, (xp - da) / Math.max(1, a - da)))
  l.riquadro(52, 94, 190, 5); l.riempi(53, 95, Math.round(188 * p * k), 3)
  l.testo(52, 102, corto(`${f(xp - da)}/${f(a - da)} xp · ${f(xp)} in tutto`, 32))
}
function pSoldi(l) {
  const k = conti(pzk.conto()?.libro)
  const righe = [
    ['$pzk puliti', f(pzk.puliti())], ['sporchi (rapine)', pzk.sporchi() ? f(pzk.sporchi()) : '—'], ['EUR€', pzk.euro() >= 0.01 ? txt(pzk.fmtEur(pzk.euro())) : '—'],
    ['guadagnati in tutto', segno(k.guadagnati)], [k.giochi < 0 ? 'persi ai giochi' : 'vinti ai giochi', segno(k.giochi)], ['lavoro e premi', f(k.lavoro)], ['spesi', k.spese ? `-${f(k.spese)}` : '0'],
  ]
  righe.forEach(([nome, v], i) => {
    const y = 35 + i * 11, xa = 10 + Lcd.larghezza(nome) + 4, xb = 245 - Lcd.larghezza(v) - 4
    l.testo(10, y, nome)
    for (let x = xa; x < xb; x += 3) l.px(x, y + 6) // i puntini fra il nome e il numero
    destra(l, 245, y, v)
  })
}
const GIOCHI = [['roulette', 'roulette'], ['blackjack', 'blackjack'], ['mine', 'mine'], ['dado', 'dadi'], ['moneta', 'testa/croce'], ['virtual', 'virtual']]
/** I giochi giocati col bot nella chat («blackjack 400», «slot 20»: nel libro sono chat-<gioco>), tutti insieme in una riga. */
function nellaChat(g) {
  const r = [0, 0, 0, 0, 0]
  for (const [id, v] of Object.entries(g)) if (id.startsWith('chat-')) { const x = (Array.isArray(v) ? v : []).map((n) => Number(n) || 0); for (let i = 0; i < 4; i++) r[i] += x[i] ?? 0; r[4] = Math.max(r[4], x[4] ?? 0) }
  return r
}
// (6.11, Bighurra: «non mi ha tenuto conto dei miei 400 guadagnati con il blackjack») i 400 nel saldo c'erano, ma li aveva
// vinti al blackjack DELLA CHAT, e qui c'erano solo i sei giochi grandi: la riga «blackjack» restava a trattini e la vincita
// non compariva da nessuna parte. Adesso sette righe (una ogni 9 pixel): i sei giochi grandi e «nella chat», tutti i giochi
// del bot insieme. La riga in fondo li contava già tutti (games/libro.mjs)
function pGiochi(l) {
  const k = conti(pzk.conto()?.libro), g = k.perGioco
  l.testo(10, 34, 'gioco'); destra(l, 112, 34, 'mani'); destra(l, 150, 34, 'vinte'); destra(l, 200, 34, 'netto'); destra(l, 245, 34, 'colpo')
  l.orizz(8, 42, 240)
  ;[...GIOCHI.map(([id, nome]) => [nome, g[id] ?? [0, 0, 0, 0, 0]]), ['nella chat', nellaChat(g)]].forEach(([nome, v], i) => {
    const [ma, vi, pu, to, mi] = v.map((x) => Number(x) || 0), y = 44 + i * 9
    l.testo(10, y, nome)
    if (!ma) { for (const xc of [112, 150, 200, 245]) destra(l, xc, y, '—'); return } // (mai giocato: un trattino per colonna)
    destra(l, 112, y, f(ma)); destra(l, 150, y, pct(vi, ma)); destra(l, 200, y, segno(to - pu)); destra(l, 245, y, mi > 0 ? f(mi) : '—')
  })
  l.orizz(8, 107, 240)
  l.testo(10, 109, `${f(k.mani)} mani · ${pct(k.vinte, k.mani)} vinte`)
}
/** Una cella di numeri: il valore allineato a destra in 42 pixel, poi l'etichetta (12 lettere al massimo). */
function cella(l, x, y, v, eti) { if (v) destra(l, x + 42, y, v); l.testo(v ? x + 48 : x, y, corto(eti, v ? 12 : 20)) }
function pBot(l) {
  const s = zaino.stat, m = zaino.mestiere()
  const celle = [[f(s('comandi')), 'comandi'], ['', `mestiere: ${m ? nomeDi(m) : 'nessuno'}`], [f(s('turniLavoro')), 'turni'], [f(s('pescati')), 'pescati'], [f(s('cacciati')), 'cacciati'],
    [f(s('scavati')), 'scavati'], [f(s('crimini')), 'crimini'], [f(s('casse')), 'casse aperte'], [f(s('acquisti')), 'acquisti'], [f(s('morti')), 'morti']]
  celle.forEach(([v, eti], i) => cella(l, i % 2 ? 128 : 8, 36 + Math.floor(i / 2) * 15, v, eti))
}
function pProgressi(l) {
  const s = zaino.stat, q = zaino.quizStato(), ogg = zaino.oggetti().reduce((t, [, k]) => t + k, 0)
  const celle = [[f(s('sfideFatte')), 'sfide fatte'], [f(s('missioniFatte')), 'side quest'], [f(s('quizGiusti')), 'quiz giusti'], [f(q.migliore ?? 0), 'record quiz'],
    [f(zaino.serie('giornaliero').n), 'serie giorni'], [f(ogg), 'nello zaino'], [f((zaino.stato().rari ?? []).length), 'leggendari'], [f(s('minati')), 'minati']]
  celle.forEach(([v, eti], i) => cella(l, i % 2 ? 128 : 8, 36 + Math.floor(i / 2) * 18, v, eti))
  l.testo(8, 108, corto(`quiz: ${f(s('quizGiusti'))} giusti su ${f(s('quizTotali'))} (${pct(s('quizGiusti'), s('quizTotali'))})`, 39))
}
function pClassifiche(l, k, t) {
  if (!pzk.conto()) {
    ['senza conto non sei nelle classifiche', 'e il profilo non si salva.', '', 'il conto si crea nell’app account.'].forEach((r, i) => centro(l, 44 + i * 11, r))
    return
  }
  const d = ioMio() // (solo quello di questo conto)
  if (d === 'carico' || d === null) { l.testo(Math.round(W / 2 - Lcd.larghezza('carico...') / 2), 64, 'carico' + '.'.repeat(1 + (Math.floor(t / 3) % 3))); return } // (fermo a sinistra: i puntini crescono senza far ballare la parola)
  if (d.ok === false) { centro(l, 56, corto(d.errore, 38)); centro(l, 70, 'riprovo quando torni qui.'); return }
  const pos = Object.entries(d.posizioni ?? {}).filter(([m]) => db.METRICHE[m]).sort((a, b) => a[1].pos - b[1].pos).slice(0, 7)
  l.testo(10, 34, corto(`su ${f(d.giocatori)} ${d.giocatori === 1 ? 'giocatore' : 'giocatori'}`, 38)) // (11.11: da soli era «su 1 giocatori»)
  if (!pos.length) { centro(l, 64, 'ancora in nessuna classifica: gioca!'); return }
  pos.forEach(([m, v], i) => {
    const y = 45 + i * 10
    destra(l, 50, y, `${f(v.pos)}°`) // (la colonna larga 40: «1.000°» passava il margine, ora al più «999,9K°»)
    const val = corto(db.valoreHtml(m, v.valore).replace(/<[^>]+>/g, ''), 12)
    destra(l, 245, y, val)
    // (6.11: i pari merito hanno lo stesso posto, come in classifica, e lo si dice; «(pari)» resta intero, si accorcia il nome)
    const posti = Math.floor((245 - Lcd.larghezza(val) - 6 - 56) / 6), coda = v.pari ? ' (pari)' : ''
    l.testo(56, y, corto(db.METRICHE[m][0], posti - coda.length) + coda)
  })
}
const PAGINE = [
  { nome: 'cartellino', icona: 'app-profilo', disegna: pCartellino },
  { nome: 'i soldi', icona: 'pzk', disegna: pSoldi },
  { nome: 'i giochi', icona: 'dado', disegna: pGiochi }, // (6.11: «i giochi grandi» fino a ieri; adesso c'è anche la riga della chat)
  { nome: 'la vita col bot', icona: 'bot', disegna: pBot },
  { nome: 'i progressi', icona: 'stella', disegna: pProgressi },
  { nome: 'le classifiche', icona: 'trofeo', disegna: pClassifiche },
]

// ── la vista principale: le sei pagine ──
let pag = 0 // (si ricorda finché la pagina è aperta: si torna dove si era)
export function vista(os) {
  let scorre = 0, barra = 0, via = []
  const ascolta = () => { via = [zaino.ascolta(() => os.ridisegna()), pzk.osserva(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] }
  const vai = (d) => { pag = (pag + d + PAGINE.length) % PAGINE.length; scorre = d * 70; if (pag === 5 && daRileggere()) caricaIo(os) }
  const v = {
    nome: 'profilo', app: 'profilo',
    entra() { ascolta(); barra = 0; if (daRileggere()) caricaIo(os) },
    esci() { via.forEach((x) => x()); via = [] },
    tic(t) {
      let ancora = false
      if (scorre) { scorre = Math.abs(scorre) < 4 ? 0 : Math.trunc(scorre * 0.45); ancora = true }
      if (barra < 1) { barra = Math.min(1, barra + 0.2); ancora = true } // (la barra degli xp si riempie entrando)
      if (pag === 5 && io === 'carico' && t % 3 === 0) ancora = true
      if (ancora) os.ridisegna()
    },
    disegna(l, t) {
      const P = PAGINE[pag]
      // la testa: ◀ l'icona e il nome della pagina, i pallini, ▶ (tutto cliccabile: pezzi.js)
      testata(l, os, { icona: P.icona, nome: P.nome, n: PAGINE.length, pag, vai, va: (i) => { const d = i - pag; if (d) { pag = i; scorre = Math.sign(d) * 70; if (pag === 5 && daRileggere()) caricaIo(os) } } })
      // la pagina (scorre di lato quando cambi)
      l.ritaglia([os.MARGINE, 32, W - 2 * os.MARGINE, 86])
      P.disegna(sposta(l, scorre), barra, t)
      l.ritaglia(null)
      const a = 'OK modifica · ←→ pagine', x0 = Math.round(W / 2 - Lcd.larghezza(a) / 2)
      l.testo(x0, H - 9, a)
      os.zona(x0 - 3, H - 11, Lcd.larghezza('OK modifica') + 6, 11, () => os.spingi(modifica(os)))
      if (!scorre && pag === 0) os.zona(6, 33, 244, 84, () => os.spingi(modifica(os))) // (il cartellino si tocca e si modifica)
    },
    tasto(n) {
      if (n === 'sx' || n === 'su') vai(-1)
      else if (n === 'dx' || n === 'giu') vai(1)
      else if (n === 'ok') os.spingi(modifica(os))
      else if (n === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── la modifica: l'anteprima del cartellino e quattro righe ──
function modifica(os) {
  let sel = 0, lampo = 0, via = [], attesa = null
  const pr = () => zaino.profilo()
  // (31.10) il profilo lo salva la banca (app/profilo.js, salva): ←→ cambiano subito sulla banca; un no si dice in un dialogo
  // (11.11) mentre la banca risponde la rotellina in fondo, e i tasti non fanno partire un altro salvataggio: due → di fila
  // leggevano tutti e due il colore vecchio e salvavano lo stesso, un passo solo per due tasti
  const salvaQui = async (cambia, lampi) => {
    if (attesa) return
    attesa = 'salvo sulla banca'; os.ridisegna()
    let e
    try { e = await salva(cambia) } catch { e = { ok: false, errore: 'la banca non risponde: riprova' } } finally { attesa = null; os.ridisegna() }
    if (os.corrente() !== v) return
    if (e.ok) lampo = lampi; else os.dialogo({ titolo: 'niente', testo: e.errore, tasti: ['ok'] })
  }
  const giro = (lista, k, d) => { if (attesa) return; const i = Math.max(0, lista.indexOf(pr()[k])); salvaQui({ [k]: lista[(i + d + lista.length) % lista.length] }, 4) }
  const righe = [
    { nome: 'faccia', valore: () => corto(nomeAv(avOra()), 18), apri: () => os.spingi(griglia(os)), aiuto: 'OK o → sceglie la faccia' },
    { nome: 'colore', valore: () => pr().col, cambia: (d) => giro(Object.keys(COLORI), 'col', d), aiuto: '←→ cambia il colore' },
    { nome: 'cornice', valore: () => CORNICI.find(([id]) => id === pr().cor)?.[1] ?? pr().cor, cambia: (d) => giro(CORNICI.map(([id]) => id), 'cor', d), aiuto: '←→ cambia la cornice' },
    { nome: 'motto', valore: () => (pr().mot ? corto(pr().mot, 18) : 'niente'), apri: () => scriviMotto(), aiuto: 'OK o → scrivi il motto' },
  ]
  async function scriviMotto() {
    const t = await os.tastiera({ testo: pr().mot ?? '', titolo: 'il motto (60 lettere al massimo)' })
    if (t === null || os.corrente() !== v) return
    salvaQui({ mot: t.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60) }, 6)
  }
  const fai = (r, d = 1) => { if (r.apri) r.apri(); else r.cambia(d) }
  const v = {
    nome: 'profilo-modifica', app: 'profilo',
    entra() { via = [zaino.ascolta(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] },
    esci() { via.forEach((x) => x()); via = [] },
    tic() { const prima = lampo; if (lampo > 0) lampo--; if (prima > 0 || attesa) os.ridisegna() }, // (anche la rotellina gira)
    disegna(l, t) {
      const p = pr()
      // l'anteprima: il cartellino com'è adesso (lampeggia quando cambia)
      cornice(l, p.cor, 6, 14, 244, 45)
      l.bitmap(bm(avOra(), 32), 13, 20, { inv: lampo % 2 === 1 })
      l.testo(52, 18, corto(pzk.conto()?.nome ?? 'ospite', 16), { scala: 2 })
      campione(l, p.col, 52, 36); l.testo(70, 36, p.col)
      l.testo(52, 46, p.mot ? corto(`"${p.mot}"`, 32) : 'nessun motto')
      righe.forEach((r, j) => {
        const y = 64 + j * 12, on = j === sel
        if (on) l.riempi(6, y - 2, W - 12, 11)
        l.testo(10, y, r.nome, { inv: on })
        const val = r.valore(), frecce = on && r.cambia, x = W - 10 - (on ? 10 : 0) - Lcd.larghezza(val)
        if (frecce) l.testo(x - 10, y, '◀', { inv: true })
        if (on) l.testo(W - 15, y, '▶', { inv: true })
        l.testo(x, y, val, { inv: on })
        if (r.nome === 'colore') campione(l, pr().col, x - (frecce ? 28 : 18), y, 13, 7, on)
        if (attesa) return // (aspettando la banca il clic non fa partire altro, come i tasti)
        os.zona(6, y - 2, W - 12, 11, () => { sel = j; fai(r) })
        if (frecce) { os.zona(x - 13, y - 2, 11, 11, () => r.cambia(-1)); os.zona(W - 18, y - 2, 12, 11, () => r.cambia(1)) }
      })
      if (!striscia(l, { attesa }, t)) centro(l, H - 9, righe[sel].aiuto)
    },
    tasto(n) {
      const r = righe[sel]
      if (attesa) { if (n === 'indietro') os.togli(); return true } // (aspettando la banca non parte altro)
      if (n === 'su') sel = (sel - 1 + righe.length) % righe.length
      else if (n === 'giu') sel = (sel + 1) % righe.length
      else if (n === 'sx') { if (r.cambia) r.cambia(-1) }
      else if (n === 'dx') fai(r, 1)
      else if (n === 'ok') fai(r, 1)
      else if (n === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── la faccia: la griglia di tutte, e sotto quella scelta in grande ──
function griglia(os) {
  const COL = 11, LATO = 18, X0 = Math.round((W - COL * LATO) / 2), Y0 = 31
  let sel = Math.max(0, facce().findIndex((x) => x.id === avOra())), lampo = 0, via = [], attesa = null
  /** La banca, con la rotellina: intanto i tasti e i clic non fanno partire un altro acquisto. */
  async function banca(testo, fai) {
    attesa = testo; os.ridisegna()
    try { return await fai() } catch { return { ok: false, errore: 'la banca non risponde: riprova' } } finally { attesa = null; os.ridisegna() }
  }
  async function premi() {
    const x = facce()[sel]
    if (!x || attesa) return
    if (x.mia) {
      if (avOra() === x.id) { lampo = 6; return } // (11.11: ce l'hai già addosso, niente da salvare; avOra come la scritta «ce l’hai addosso», anche per il bot di quando non ne hai scelta una)
      const e = await banca('la metto', () => salva({ av: x.id })); if (os.corrente() !== v) return; if (e.ok) lampo = 6; else await os.dialogo({ titolo: 'niente', testo: e.errore, tasti: ['ok'] }); return
    }
    if (x.bloccata) { await os.dialogo({ titolo: 'chiusa', testo: `${nomeAv(x.id)}, ${x.rarita.nome}: ${x.bloccata}.`, icona: 'lucchetto', tasti: ['ok'] }); return }
    // (compraFaccia la fa la banca: solo i puliti, e in galera niente. Lo si dice prima, non col saldo che ha dentro gli sporchi)
    const no = pzk.inGalera() ? `sei in galera fino alle ${ora(pzk.galera())}: non si compra. Si esce con la cauzione, nell’app rapina.` : x.prezzo > pzk.puliti() ? `costa ${intero(x.prezzo)} $pzk e ne hai ${intero(pzk.puliti())}${pul()}.` : null
    if (no) { await os.dialogo({ titolo: 'niente', testo: no, icona: pzk.inGalera() ? 'lucchetto' : 'pzk', tasti: ['ok'] }); return }
    const r = await os.dialogo({ titolo: corto(nomeAv(x.id), 14), testo: `${x.rarita.nome}. La compri per ${intero(x.prezzo)} $pzk? Ne hai ${intero(pzk.puliti())}${pul()}.`, icona: x.id, tasti: ['no', 'sì'] })
    if (r !== 'sì' || os.corrente() !== v || attesa) return
    const e = await banca('la compro', () => compraFaccia(x.id))
    if (os.corrente() !== v) return
    if (!e.ok) { await os.dialogo({ titolo: 'niente', testo: e.errore, icona: e.bloccata ? 'lucchetto' : 'pzk', tasti: ['ok'] }); return }
    lampo = 10
    os.suoni.sigla('negozio')
  }
  const v = {
    nome: 'profilo-faccia', app: 'profilo',
    entra() { via = [zaino.ascolta(() => os.ridisegna()), pzk.osserva(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] },
    esci() { via.forEach((x) => x()); via = [] },
    tic() { const prima = lampo; if (lampo > 0) lampo--; if (prima > 0 || attesa) os.ridisegna() }, // (anche la rotellina gira)
    disegna(l, t) {
      const tutte = facce(), uso = avOra(), n = tutte.length
      l.bitmap(icone.bitmap('app-profilo', 16), 8, 13)
      l.testo(28, 17, 'la faccia')
      destra(l, W - 8, 17, `${tutte.filter((x) => x.mia).length}/${n} tue`)
      tutte.forEach((x, i) => {
        const cx = X0 + (i % COL) * LATO, cy = Y0 + Math.floor(i / COL) * LATO, on = i === sel && !(lampo % 2)
        if (on) l.riempi(cx, cy, LATO, LATO)
        const b = bm(x.id, 16)
        if (x.mia) l.bitmap(b, cx + 1, cy + 1, { inv: on })
        else if (on) l.bitmap(b, cx + 1, cy + 1, { inv: true })
        else sbiadita(l, b, cx + 1, cy + 1)
        if (x.id === uso) l.orizz(cx + 3, cy + LATO - 1, LATO - 6, on ? 0 : 1) // (la sottolineatura: quella in uso)
        if (!attesa) os.zona(cx, cy, LATO, LATO, () => { sel = i; premi() }) // (aspettando la banca il clic non fa partire altro)
      })
      // quella scelta, in grande, col nome, la rarità e cosa fa OK
      const x = tutte[sel]
      if (!x) return
      const yi = Y0 + Math.ceil(n / COL) * LATO + 3
      l.bitmap(bm(x.id, 32), 8, yi)
      // (11.11: si accorcia il nome, non la rarità: «rana (che ti guarda male) · comu…», «CARPA D’ORO DEI GONZAGA · leggen…»)
      const rar = ` · ${x.rarita?.nome ?? ''}`
      l.testo(46, yi + 1, corto(nomeAv(x.id), 33 - rar.length) + rar)
      // (11.11: in galera o senza abbastanza puliti diceva lo stesso «OK e la compri», e OK non la comprava)
      const puoi = !pzk.inGalera() && x.prezzo <= pzk.puliti()
      const stato = x.mia ? (x.id === uso ? 'tua, ce l’hai addosso' : 'tua: OK e la metti') : x.bloccata ? `chiusa: ${x.bloccata}` : puoi ? `${intero(x.prezzo)} $pzk: OK e la compri` : `costa ${intero(x.prezzo)} $pzk`
      l.testo(46, yi + 10, corto(stato, 33))
      // (la rotellina qui e non nella striscia in fondo, che coprirebbe la faccia grande)
      if (attesa) l.testo(46, yi + 19, corto(`${ruota(t)} ${attesa}…`, 33))
      else if (!x.mia && !x.bloccata) l.testo(46, yi + 19, corto(pzk.inGalera() ? `in galera fino alle ${ora(pzk.galera())}` : `ne hai ${intero(pzk.puliti())}${pul()}`, 33))
    },
    tasto(k) {
      const n = facce().length
      if (attesa) { if (k === 'indietro') os.togli(); return true } // (aspettando la banca non parte altro)
      if (k === 'sx') sel = (sel - 1 + n) % n
      else if (k === 'dx') sel = (sel + 1) % n
      else if ((k === 'su' || k === 'giu') && n) { // (11.11: la stessa colonna anche girando in tondo; con (sel ± COL) % n, se le facce non sono un multiplo di 11, si saltava di colonna)
        const file = Math.ceil(n / COL), c = sel % COL, d = k === 'su' ? -1 : 1
        let r = Math.floor(sel / COL)
        do r = (r + d + file) % file; while (r * COL + c >= n) // (l'ultima fila corta: si salta alla fila dopo che ha quella colonna)
        sel = r * COL + c
      }
      else if (k === 'ok') premi()
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}
