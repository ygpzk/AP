// pzk os a 8 bit (29.10, Alberto: «rifai da 0 pzk os adattato allo strumento… prendi flipper zero os e riscrivilo con le mie
// app, impara come funziona e usalo per rifare le app, aumenta i pixel dello schermo ma mantieni stile 8bit»): il sistema
// del cercapersone zero, disegnato pixel per pixel su un lcd 256 × 128 a un bit (lcd.js) che vive SOTTO IL VETRO del
// modello 3D (zero.js lo stende come trama sull'lcd; muro.js lo ricopia sul tasto del muro): niente finestra HTML sopra.
// È fatto come il firmware del Flipper Zero: una BARRA DI STATO in cima (l'ora, la rete, il conto, la batteria), la HOME
// (29.10 sera, Alberto: «fai la home con dati importanti come i miei soldi e le cose da fare oggi»: la chiocciolina di
// chat/tomodachi.js a sinistra, i $pzk, il livello e le sfide a destra, sotto le cose da fare oggi), OK che apre il MENU
// PRINCIPALE (la lista delle app, con l'icona a sinistra, la voce scelta rovesciata e la barra di scorrimento a destra,
// come il suo), le app come VISTE impilate (INDIETRO torna a quella sotto), i DIALOGHI con la cornice smussata, la
// riga dove si SCRIVE con la tastiera vera (dall'11.11; prima una tastiera sullo schermo, come la sua TextInput), le IMPOSTAZIONI (impostazioni.js) e la GUIDA al
// primo accesso («al primo accesso spiega come funziona»). I sei tasti sono gli stessi del Flipper: su, giù, sinistra,
// destra, OK, INDIETRO (telefono.js li manda da qui: dai tasti 3D e dalla tastiera). Niente nelle quattro punte dello
// schermo (Alberto: «evita di mettere negli angoli cose che altrimenti con l'inclinazione non si vedono»): tutto sta dentro
// un margine di 6 pixel (MARGINE), e i suggerimenti in basso stanno in mezzo.
//
//   lcd                      l'lcd (la tela 768 × 384 è lcd.canvas)
//   configura({ app, tomodachi })   le app del menu [{ id, nome, icona }] e la tela della chiocciolina
//   stato({ ora, nome, pct, carica, tacche })   la barra di stato
//   tasto(nome) → bool       su | giu | sx | dx | ok | indietro (→ false: nessuna vista l'ha voluto: INDIETRO sulla home)
//   carattere(ch), cancella(), invio(), scrivendo()   la tastiera vera
//   apri(id), pronta(id), home(), corrente(), guida()   (le app pronte stanno in PRONTE, qui sotto)
//   spingi(vista), togli()   le viste: { disegna(lcd, tic), tasto(n) → bool, carattere?, cancella?, invio?, entra?, esci?, tic? }
//   dialogo({ titolo, testo, icona, tasti }) → Promise del tasto scelto
//   tastiera({ testo, titolo }) → Promise del testo (null se si esce)
//   spegnendo(k)             la barra dello spegnimento (INDIETRO tenuto), piena a k (0–1); null la toglie
//   saluta()                 il «ciao» della chiusura: la chiocciolina che saluta a tutto schermo (home() lo toglie)
//   avvia(), ferma()         il giro di disegno (quando il cercapersone è aperto o il muro lo guarda)
//
// COME SI FA UN'APP (e senza bug): telefono/zero/os/REGOLE.md. Ogni tasto fa già il suo bip e ogni app la sua sigla
// (suoni.js); le app ricevono `os` (OS, qui sotto): BARRA, MARGINE, togli, spingi, ridisegna, corrente, apri, dialogo,
// tastiera, suoni.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import { esiste } from './font.js'
import * as impostazioni from './impostazioni.js'
import * as suoni from './suoni.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'

export const lcd = new Lcd()
export const BARRA = 12 // la barra di stato: 11 righe più la linea
export const MARGINE = 6
export { W, H }

let viste = []
let APP = []
let tomodachi = null
let st = { ora: '', nome: '', pct: 100, carica: false, tacche: 3 }
let giro = 0, sporco = true, tic = 0
const ascoltiVista = new Set()
export const ascoltaVista = (fn) => { ascoltiVista.add(fn); return () => ascoltiVista.delete(fn) }

lcd.regola(impostazioni.leggi().luminosita); lcd.sfondo(impostazioni.leggi().sfondo)
impostazioni.ascolta((i) => { lcd.regola(i.luminosita); lcd.sfondo(i.sfondo); ridisegna() })

export function configura({ app, tomodachi: t } = {}) {
  if (app) APP = [...app.filter((a) => a.id !== 'impostazioni'), { id: 'impostazioni', nome: 'impostazioni', icona: 'impostazioni' }]
  if (t) tomodachi = t
  if (!viste.length) spingi(home_)
  ridisegna()
}
export function stato(s) { st = { ...st, ...s }; ridisegna() }
export const ridisegna = () => { sporco = true }
export const corrente = () => viste[viste.length - 1] ?? null

// ── le viste ──
export function spingi(v) {
  corrente()?.esci?.()
  viste.push(v)
  v.entra?.()
  ridisegna()
  for (const f of ascoltiVista) f(v)
}
export function togli() {
  if (viste.length <= 1) return false
  const v = viste.pop()
  v.esci?.()
  v.tolta?.() // (i dialoghi e le tastiere tolti da fuori, home() all'uscita dal conto: la loro Promise torna null e non resta appesa)
  corrente()?.entra?.()
  ridisegna()
  for (const f of ascoltiVista) f(corrente())
  return true
}
export function home() {
  if (viste.length <= 1) return ridisegna()
  // (11.11: prima togli() più volte, e ogni vista di mezzo rientrava (ascolti, richieste, timer) solo per essere tolta subito:
  // esce solo quella in cima, le altre sono già uscite quando sono state coperte)
  const v = viste.pop()
  v.esci?.(); v.tolta?.()
  while (viste.length > 1) viste.pop().tolta?.()
  corrente()?.entra?.()
  ridisegna()
  for (const f of ascoltiVista) f(corrente())
}
// ── le app pronte (le regole: telefono/zero/os/REGOLE.md): id → la sua vista. Un'app nuova si aggiunge SOLO qui (il
// menu smette da sé di dire «presto»); quelle che non ci sono aprono la vista «in arrivo» ──
const PRONTE = {
  chat: async () => (await import('./chat.js')).vista(),
  impostazioni: async () => impostazioni.vista(OS),
  profilo: async () => (await import('./profilo.js')).vista(OS),
  account: async () => (await import('./account.js')).vista(OS),
  negozio: async () => (await import('./negozio.js')).vista(OS),
  pzkstore: async () => (await import('./pzkstore.js')).vista(OS),
  sfide: async () => (await import('./sfide.js')).vista(OS),
  quiz: async () => (await import('./quiz.js')).vista(OS),
  missioni: async () => (await import('./missioni.js')).vista(OS),
  giocatori: async () => (await import('./giocatori.js')).vista(OS),
  zaino: async () => (await import('./zaino.js')).vista(OS),
  miniera: async () => (await import('./miniera.js')).vista(OS),
  foto: async () => (await import('./foto.js')).vista(OS),
  virtual: async () => (await import('./virtual.js')).vista(OS),
  banca: async () => (await import('./banca.js')).vista(OS),
  rapina: async () => (await import('./rapina.js')).vista(OS),
  lavatrice: async () => (await import('./lavatrice.js')).vista(OS),
  decifratore: async () => (await import('./decifratore.js')).vista(OS),
  conversioni: async () => (await import('./conversioni.js')).vista(OS),
  calcolatrice: async () => (await import('./calcolatrice.js')).vista(OS),
  compilatore: async () => (await import('./compilatore.js')).vista(OS),
  cucina: async () => (await import('./cucina.js')).vista(OS),
}
export const pronta = (id) => !!PRONTE[id]
let aprendo = null, richiesta = 0
/** Apre un'app del menu per id, con la sua sigla (suoni.js). Due OK di fila non la aprono due volte. */
// SENZA CONTO NON SI ENTRA (26.10, Alberto: «non puoi accedere al cercapersone se non ti registri/accedi»; sullo zero dal
// 29.10, con l'app account): senza conto ogni app tranne LIBERE apre l'account, e l'app voluta aspetta in «dopo»; quando il
// conto c'è, l'account chiama dopoAccesso() e si va lì
const LIBERE = new Set(['account', 'impostazioni'])
let dopo = null
export const serveConto = () => !pzk.conto()
/** Dopo l'accesso (l'app account): via l'account, e si apre l'app che si voleva (o la home). */
export function dopoAccesso() { const d = dopo; dopo = null; home(); if (d) apri(d) }
/** Apre un'app (opz.comando: per la chat, un comando da mandare appena aperta: «vai» delle sfide, per esempio). */
export async function apri(id, opz = {}) {
  if (serveConto() && !LIBERE.has(id)) { dopo = id; id = 'account'; opz = {} }
  const a = APP.find((x) => x.id === id)
  if (corrente()?.app === id && opz.comando) { corrente().comando?.(opz.comando); return } // (già aperta: solo il comando)
  if (!a || corrente()?.app === id || aprendo === id) return
  aprendo = id
  const mia = ++richiesta, sotto = corrente()
  try {
    let v
    try { v = PRONTE[id] ? await PRONTE[id]() : presto(a) }
    catch (e) { // (11.11: il modulo non arriva, rete giù: prima OK non faceva niente, senza dire perché)
      console.warn('pzk os: non si apre', id, e)
      if (mia === richiesta && corrente() === sotto) dialogo({ titolo: 'non si apre', testo: `${a.nome}: la rete non risponde. Riprova fra poco.`, icona: a.icona, tasti: ['ok'] })
      return
    }
    // (11.11: dopo l'attesa si controlla di essere ancora lì (REGOLE 8.4): INDIETRO mentre arrivava non la apre sopra la home,
    // e di due app chieste mentre la prima arriva si apre solo l'ultima)
    if (mia !== richiesta || corrente() !== sotto || corrente()?.app === id) return
    v.app ??= id
    spingi(v)
    suoni.sigla(id)
    if (opz.comando) v.comando?.(opz.comando)
  } finally { if (aprendo === id) aprendo = null }
}
const OS = { get BARRA() { return BARRA }, get MARGINE() { return MARGINE }, togli, spingi, ridisegna, corrente, apri, zona, dialogo: (o) => dialogo(o), tastiera: (o) => tastiera(o), cifre: (o) => cifre(o), numero: (o) => numero(o), dopoAccesso, guida: () => guida(true), suoni }

// ── i tasti e la tastiera vera ──
export function tasto(nome) {
  suoni.bip(nome === 'indietro' ? 'pagerGiu' : 'pager') // (il bip di ogni tasto: le app non lo rifanno)
  const v = corrente()
  const preso = v?.tasto?.(nome) ?? false
  ridisegna()
  return preso
}
export function carattere(ch) { corrente()?.carattere?.(ch); ridisegna() }
export function cancella() { corrente()?.cancella?.(); ridisegna() }
/** Invio: la vista che scrive lo manda (la chat, la tastiera), le altre lo prendono come OK. */
export function invio() { suoni.bip('pager'); const v = corrente(); if (v?.invio) v.invio(); else v?.tasto?.('ok'); ridisegna() }
/** Si sta scrivendo (c'è del testo da cancellare con Backspace)? */
export const scrivendo = () => !!corrente()?.scrivendo?.()

// ── il clic del mouse sullo schermo (29.10, Alberto: «metti per sicurezza anche il click del mouse»): mentre disegna, la
// vista segna le sue zone cliccabili (zona); zero.js trasforma il clic sul vetro in un pixel dell'lcd e tocca() preme la
// zona che c'è sotto (l'ultima segnata vince: un dialogo sopra la sua vista). È un in più: tutto si fa anche coi tasti ──
let zone = []
export function zona(x, y, w, h, fn) { zone.push({ x, y, w, h, fn, v: corrente() }) }
// (11.11: le zone restano fino al disegno dopo, 100 ms: un clic subito dopo un OK che aveva chiuso il dialogo ripremeva il suo
// tasto, e il togli() del dialogo toglieva l'app sotto. Una zona di una vista già tolta non si preme)
const trova = (x, y) => { for (let i = zone.length - 1; i >= 0; i--) { const z = zone[i]; if (z.v === corrente() && x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z } return null }
export const cliccabile = (x, y) => !!trova(x, y)
/** Il clic in (x, y), pixel dell'lcd: preme la zona sotto. → true se c'era. */
export function tocca(x, y) { const z = trova(x, y); if (!z) return false; suoni.bip('pager'); z.fn(); ridisegna(); return true }
/** Le zone di adesso (per il collaudo). */
export const elencoZone = () => zone.map(({ x, y, w, h }) => ({ x, y, w, h }))

// ── il giro di disegno: ogni 100 ms un tic (le animazioni), si ridisegna solo se qualcuno l'ha chiesto ──
export function avvia() {
  if (giro) return
  giro = setInterval(() => {
    tic++
    corrente()?.tic?.(tic)
    if (tic % 5 === 0) sporco = true // (l'orologio, il cursore, la chiocciolina)
    if (!sporco) return
    sporco = false
    lcd.ritaglia(null)
    lcd.pulisci()
    zone = []
    corrente()?.disegna(lcd, tic)
    lcd.ritaglia(null)
    barra(lcd)
    if (spegni != null) barraSpegni(lcd, spegni)
    lcd.disegna()
  }, 100)
}

// ── la barra dello spegnimento (9.11, Alberto: «crea una barra di avanzamento per spegnerlo così uno capisce che sta
// avanzando»): mentre INDIETRO è tenuto, sopra a tutto un riquadro smussato con la barra a blocchetti che si riempie in tre
// secondi; lasciando sparisce. La comanda telefono.js (spegnendo) ──
let spegni = null
/** k 0–1: la barra piena a k; null: via. */
export function spegnendo(k) {
  const v = k == null ? null : Math.max(0, Math.min(1, k))
  if (v === spegni) return
  spegni = v
  ridisegna()
}
function barraSpegni(l, k) {
  const w = 188, h = 50, x = Math.round(W / 2 - w / 2), y = Math.round((BARRA + H) / 2 - h / 2)
  l.riempi(x - 2, y - 2, w + 4, h + 4, 0)
  l.cornice(x, y, w, h)
  const t = 'tieni premuto: si spegne'
  l.testo(Math.round(W / 2 - Lcd.larghezza(t) / 2), y + 7, t)
  // la barra: 20 blocchetti da 7 pixel, pieni fino a k
  const N = 20, bx = x + 12, by = y + 20, bw = w - 24, bh = 12
  l.riquadro(bx, by, bw, bh)
  const pieni = Math.floor(k * N + 1e-6)
  for (let i = 0; i < pieni; i++) l.riempi(bx + 2 + i * 8, by + 2, 7, bh - 4)
  const s = k >= 1 ? 'ciao!' : `${Math.ceil(3 - k * 3)} s · lascia per restare`
  l.testo(Math.round(W / 2 - Lcd.larghezza(s) / 2), y + 38, s)
}
export function ferma() { clearInterval(giro); giro = 0 }

// ── la barra di stato, come quella del Flipper: in alto, con la linea sotto; dentro il margine ──
function barra(l) {
  if (corrente()?.senzaBarra) return
  l.riempi(0, 0, W, BARRA, 0)
  l.orizz(1, BARRA - 1, W - 2) // (non fino al bordo: i due pixel estremi cadevano negli angoli stondati)
  l.testo(MARGINE + 2, 2, st.ora || '--:--')
  // la rete: tre tacche
  const t = st.tacche ?? 0
  for (let i = 0; i < 3; i++) { const h = 2 + i * 2; if (i < t) l.riempi(MARGINE + 38 + i * 3, 9 - h, 2, h); else l.px(MARGINE + 38 + i * 3, 8) }
  const nome = st.nome || 'sessione'
  l.testo(Math.round(W / 2 - Lcd.larghezza(nome) / 2), 2, nome)
  // la batteria: il numero e il simbolo
  const pct = Math.max(0, Math.min(100, st.pct ?? 0))
  const testo = `${pct}%`
  const bx = W - MARGINE - 17
  l.testo(bx - 4 - Lcd.larghezza(testo), 2, testo)
  l.riquadro(bx, 2, 15, 7); l.vert(bx + 15, 4, 3)
  l.riempi(bx + 2, 4, Math.round((11 * pct) / 100), 3)
  // (11.11: la carica spegneva due pixel della riga 1, già spenti, e non si vedeva niente: un fulmine dentro la batteria,
  // rovesciato, così si vede sia sulla parte piena sia su quella vuota)
  if (st.carica) ['..##', '.##.', '####', '.##.', '##..'].forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') l.inverti(bx + 6 + i, 3 + j, 1, 1) }))
}

/** La chiocciolina di chat/tomodachi.js (la sua tela di 32 × 16 celle) disegnata da (x0, y0) a k × k pixel per cella.
 *  → false se la tela non c'è */
function chiocciolina(l, x0, y0, k) {
  const c = tomodachi
  if (!c?.width) return false
  try {
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data
    const cw = c.width / 32, ch = c.height / 16
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
      const o = ((Math.floor((y + 0.5) * ch)) * c.width + Math.floor((x + 0.5) * cw)) * 4
      if (d[o + 3] > 128) l.riempi(x0 + x * k, y0 + y * k, k, k)
    }
    return true
  } catch { return false }
}

/** Il saluto della chiusura (9.11, Alberto: «velocizza l'uscita… con un ciao da 1 secondo full schermo»): la chiocciolina
 *  che saluta (tomodachi.saluta: l'antenna, «CIAO», il cuoricino) a tutto schermo, 8 × 8 pixel per cella (32 × 16 celle =
 *  256 × 128, l'lcd intero), senza barra; i tasti non fanno niente. Se la tela non c'è, «ciao!» grande. Lo toglie home(). */
export function saluta() {
  home()
  spingi({
    nome: 'ciao', senzaBarra: true,
    tic() { ridisegna() }, // (la chiocciolina si muove da sola: si ricopia a ogni tic)
    tasto: () => true,
    disegna(l) {
      if (chiocciolina(l, 0, 0, 8)) return
      const s = 'ciao!', k = 7
      l.testo(Math.round(W / 2 - Lcd.larghezza(s, k) / 2), Math.round(H / 2 - (7 * k) / 2), s, { scala: k })
    },
  })
}

// ── la home: la chiocciolina a sinistra (le 32 × 16 celle della sua tela, a 4 × 4 pixel), i dati a destra, le cose da
// fare oggi sotto ──
let dati = { saldo: 0, liv: 1, xp: 0, da: 0, a: 60, sfide: [], fatte: 0, giornaliero: false, quest: 0, lumaca: 0, aggiornato: 0 }
let leggendo = false, ancora = false
async function leggiDati() {
  if (leggendo) { ancora = true; return } // (il tic della home lo chiedeva ogni 100 ms finché la prima lettura non finiva; un cambio nel frattempo si rilegge dopo)
  leggendo = true
  try {
    const [sf, mi, lu] = await Promise.all([import('../../../chat/sfide.js'), import('../../../chat/missioni.js'), import('../../../chat/lumaca-avvisi.js')])
    const o = sf.oggi(), liv = zaino.livello()
    dati = { saldo: pzk.saldo(), liv, xp: zaino.xp(), da: zaino.xpPer(liv), a: zaino.xpPer(liv + 1), sfide: o.sfide, fatte: o.sfide.filter((x) => x.riscossa).length, giornaliero: zaino.manca('giornaliero') === 0, quest: mi.pronte(), lumaca: lu.daVedere().length, aggiornato: Date.now() }
  } catch (e) { try { dati = { ...dati, saldo: pzk.saldo(), liv: zaino.livello(), xp: zaino.xp() } } catch {} dati.aggiornato = Date.now() }
  finally { leggendo = false }
  ridisegna()
  if (ancora) { ancora = false; leggiDati() }
}
zaino.ascolta(() => leggiDati())
pzk.osserva(() => { leggiDati(); if (serveConto() && viste.some((v) => v.app && !LIBERE.has(v.app))) home() }) // (uscito dal conto: la home col lucchetto; 11.11: anche con un dialogo o una tastiera sopra l'app, prima restava sotto)
function chiusa(l) {
  l.bitmap(icone.bitmap('lucchetto', 32), Math.round(W / 2 - 16), BARRA + 8)
  ;['serve il conto: un nome e quattro', 'cifre, un minuto. senza conto', 'il cercapersone resta chiuso.'].forEach((r, i) => l.testo(Math.round(W / 2 - Lcd.larghezza(r) / 2), BARRA + 46 + i * 10, r))
  const a = 'OK entra o crea il conto', xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
  l.riempi(xa - 4, H - 24, Lcd.larghezza(a) + 8, 12); l.testo(xa, H - 22, a, { inv: true })
  zona(xa - 4, H - 24, Lcd.larghezza(a) + 8, 12, () => apri('account'))
}
const home_ = {
  nome: 'home',
  entra() { leggiDati() },
  tic(t) { if (Date.now() - dati.aggiornato > 15_000) leggiDati() },
  disegna(l) {
    if (serveConto()) return chiusa(l)
    const x0 = MARGINE, y0 = BARRA + 2
    // la chiocciolina
    if (!chiocciolina(l, x0, y0, 4)) l.testo(x0 + 30, y0 + 28, 'pzk os', { scala: 2 })
    // i dati a destra
    const xd = 142
    l.testo(xd, y0 + 1, 'saldo')
    const s = pzk.fmtCorto(dati.saldo)
    l.testo(xd, y0 + 10, s, { scala: 2 })
    l.testo(xd + Lcd.larghezza(s, 2) + 4, y0 + 17, '$pzk')
    // il livello e gli xp; se non ci stanno (livelli alti), la percentuale del livello
    const lx = `liv ${dati.liv} · ${dati.xp - dati.da}/${dati.a - dati.da} xp`
    l.testo(xd, y0 + 30, Lcd.larghezza(lx) <= W - MARGINE - xd ? lx : `liv ${dati.liv} · ${Math.round((100 * (dati.xp - dati.da)) / Math.max(1, dati.a - dati.da))}%`)
    l.riquadro(xd, y0 + 39, 100, 5); l.riempi(xd + 1, y0 + 40, Math.round(98 * Math.max(0, Math.min(1, (dati.xp - dati.da) / Math.max(1, dati.a - dati.da)))), 3)
    l.testo(xd, y0 + 48, `sfide ${dati.fatte}/3`)
    l.testo(xd, y0 + 57, dati.giornaliero ? 'premio pronto!' : 'premio preso ✓')
    // le cose da fare oggi
    const yb = y0 + 68
    l.cornice(x0, yb, W - 2 * MARGINE, 34)
    l.riempi(x0 + 6, yb - 3, Lcd.larghezza('da fare oggi') + 4, 7, 0); l.testo(x0 + 8, yb - 3, 'da fare oggi')
    const righe = []
    if (dati.giornaliero) righe.push('■ riscuoti il premio giornaliero')
    if (dati.lumaca) righe.push('■ la lumachina ha combinato qualcosa')
    if (dati.quest) righe.push(`■ ${dati.quest} quest pront${dati.quest === 1 ? 'a' : 'e'}`)
    for (const x of dati.sfide) if (!x.riscossa) righe.push(`${x.pronta ? '■' : '□'} ${x.testo} (${x.fatto}/${x.target})`)
    if (!righe.length) righe.push('tutto fatto: goditi la giornata')
    righe.slice(0, 3).forEach((r, i) => l.testo(x0 + 6, yb + 6 + i * 9, r.length > 38 ? r.slice(0, 37) + '…' : r))
    // il suggerimento, in mezzo in basso
    const s2 = 'OK menu · ↓ chat', xs = Math.round(W / 2 - Lcd.larghezza(s2) / 2)
    l.testo(xs, H - 9, s2)
    zona(xs - 3, H - 11, Lcd.larghezza('OK menu') + 6, 11, () => spingi(menu()))
    zona(xs + Lcd.larghezza('OK menu · ') - 3, H - 11, Lcd.larghezza('↓ chat') + 6, 11, () => apri('chat'))
  },
  tasto(n) {
    if (serveConto() && (n === 'ok' || n === 'giu')) { apri('account'); return true } // (senza conto: la home col lucchetto)
    if (n === 'ok') { spingi(menu()); return true }
    if (n === 'giu') { apri('chat'); return true }
    return false // (INDIETRO sulla home: niente; tenuto, telefono.js spegne)
  },
}

// ── il menu principale: le app, con l'icona a sinistra e la voce scelta rovesciata; in fondo cosa fa quella scelta (4.11,
// Alberto: «uno che non ha mai aperto il sito fa fatica»: «virtual», «bin·hex», «decifra» non dicevano niente a chi arriva) ──
const RIGA = 20, VISIBILI = 5
const COSA = {
  chat: 'parla col bot: lavora, gioca', profilo: 'la tua faccia e i tuoi numeri', account: 'il conto: cambio e invii',
  negozio: 'cibo, attrezzi e roba', pzkstore: 'app nuove da installare', sfide: 'tre sfide al giorno',
  quiz: 'domande che pagano', missioni: 'storie a bivi con un premio', giocatori: 'classifiche e altri giocatori',
  zaino: 'quello che hai: usa e vendi', miniera: 'pc che minano $pzk per te', foto: 'le foto vere dei quiz',
  virtual: 'scommesse sul calcio finto', banca: 'il portafoglio e la borsa', rapina: 'il colpo alla cassa di pzk',
  lavatrice: 'lava i soldi sporchi', decifratore: 'apri i wallet trovati', conversioni: 'binario, esadecimale, basi',
  calcolatrice: 'i calcoli del geometra', compilatore: 'scrivi e prova codice C', cucina: 'le ricette del Mincio',
  impostazioni: 'luce, suoni, led, la guida',
}
function menu() {
  // (11.11: la voce scelta si ricorda per id, non per posto (REGOLE 3.12): quando telefono.js rifà la lista (lo zaino porta
  // dentro o toglie la lavatrice) il cursore resta sulla stessa app, e se la lista si accorcia OK non preme un buco)
  let selId = APP[0]?.id, da = 0
  const sel = () => Math.max(0, APP.findIndex((a) => a.id === selId))
  const scorri = () => { const s = sel(); da = Math.max(0, Math.min(da, s, APP.length - VISIBILI)); if (s >= da + VISIBILI) da = s - VISIBILI + 1 }
  return {
    nome: 'menu',
    disegna(l) {
      const n = APP.length, s = sel()
      const d = Math.max(0, Math.min(Math.max(da, s - VISIBILI + 1), s, n - VISIBILI))
      const y0 = BARRA + 3
      for (let i = 0; i < VISIBILI && d + i < n; i++) {
        const a = APP[d + i], y = y0 + i * RIGA, scelto = d + i === s
        if (scelto) l.riempi(MARGINE, y, W - 2 * MARGINE - 8, RIGA, 1)
        l.bitmap(icone.bitmap(a.icona, 16), MARGINE + 4, y + 2, { inv: scelto })
        l.testo(MARGINE + 26, y + 3, a.nome, { scala: 2, inv: scelto })
        zona(MARGINE, y, W - 2 * MARGINE - 8, RIGA, () => { selId = a.id; apri(a.id) })
        if (scelto && !pronta(a.id)) l.testo(W - MARGINE - 14 - Lcd.larghezza('presto'), y + 7, 'presto', { inv: true })
      }
      // la barra di scorrimento a destra
      l.vert(W - MARGINE - 3, y0, VISIBILI * RIGA)
      const h = Math.max(6, Math.round((VISIBILI * RIGA * VISIBILI) / Math.max(n, VISIBILI)))
      l.riempi(W - MARGINE - 5, y0 + Math.round(((VISIBILI * RIGA - h) * s) / Math.max(1, n - 1)), 5, h)
      const cosa = COSA[APP[s]?.id] ?? 'OK apre'
      l.testo(Math.round(W / 2 - Lcd.larghezza(cosa) / 2), H - 9, cosa)
    },
    tasto(n) {
      if (!APP.length && n !== 'indietro') return false
      if (n === 'su') selId = APP[(sel() - 1 + APP.length) % APP.length].id
      else if (n === 'giu') selId = APP[(sel() + 1) % APP.length].id
      else if (n === 'ok') { apri(APP[sel()].id); return true }
      else if (n === 'indietro') { togli(); return true }
      else return false
      scorri()
      return true
    },
  }
}

// ── «in arrivo»: le app che non ci sono ancora (Alberto, 29.10: «fai solo app chat completissima e se va bene… fai tutte le altre») ──
function presto(a) {
  return {
    nome: 'presto', app: a.id,
    disegna(l) {
      l.cornice(MARGINE + 2, BARRA + 6, W - 2 * MARGINE - 4, H - BARRA - 14)
      l.bitmap(icone.bitmap(a.icona, 32), MARGINE + 14, BARRA + 16)
      l.testo(MARGINE + 56, BARRA + 18, a.nome, { scala: 2 })
      l.testo(MARGINE + 56, BARRA + 38, 'in arrivo su pzk os')
      l.testo(MARGINE + 56, BARRA + 48, 'per ora c’è la chat')
      const aiuto = 'OK o INDIETRO: torna' // (i tasti per nome: ◀ in pzk os è la freccia sinistra, REGOLE.md)
      l.testo(Math.round(W / 2 - Lcd.larghezza(aiuto) / 2), H - 20, aiuto)
      zona(MARGINE + 2, BARRA + 6, W - 2 * MARGINE - 4, H - BARRA - 14, () => togli())
    },
    tasto(n) { if (n === 'indietro' || n === 'ok') { togli(); return true } return false },
  }
}

// ── il dialogo, come la DialogEx del Flipper: cornice, icona, titolo, testo, fino a tre tasti (sinistra, centro, destra) ──
export function dialogo({ titolo = '', testo = '', icona = null, tasti = ['ok'] } = {}) {
  titolo = adatta(titolo, W - 2 * MARGINE - 16 - (icona ? 30 : 0), 2) // (un nome lungo nel titolo usciva dalla cornice)
  return new Promise((risolvi) => {
    let sel = Math.min(1, tasti.length - 1)
    const v = {
      nome: 'dialogo',
      tolta: () => risolvi(null),
      disegna(l) {
        l.riempi(MARGINE, BARRA + 3, W - 2 * MARGINE, H - BARRA - 3 - MARGINE, 0)
        l.cornice(MARGINE, BARRA + 3, W - 2 * MARGINE, H - BARRA - 3 - MARGINE)
        let x = MARGINE + 8, y = BARRA + 9
        if (icona) { l.bitmap(icone.bitmap(icona, 24), x, y); x += 30 }
        if (titolo) { l.testo(x, y, titolo, { scala: 2 }); y += 18 } else y += 2
        const yb = H - MARGINE - 16
        // (11.11: tagliava alla sesta riga senza dirlo, e il motivo lungo dei soldi sporchi perdeva la fine: ora tutte le righe
        // che stanno sopra i tasti, e se non basta l'ultima finisce con «…», REGOLE 4.2)
        const larghe = Math.floor((W - MARGINE - 8 - x) / 6), max = Math.max(1, Math.floor((yb - 2 - y) / 9)), righe = Lcd.acapo(testo, larghe)
        if (righe.length > max) { righe.length = max; righe[max - 1] = righe[max - 1].slice(0, larghe - 1).trimEnd() + '…' }
        for (const r of righe) { l.testo(x, y, r); y += 9 }
        tasti.forEach((t, i) => {
          const w = Lcd.larghezza(t) + 8, xb = i === 0 ? MARGINE + 8 : i === tasti.length - 1 ? W - MARGINE - 8 - w : Math.round(W / 2 - w / 2)
          if (i === sel) l.riempi(xb, yb, w, 11)
          else l.cornice(xb, yb, w, 11)
          l.testo(xb + 4, yb + 2, t, { inv: i === sel })
          zona(xb - 2, yb - 2, w + 4, 15, () => { sel = i; risolvi(tasti[i]); togli() })
        })
      },
      tasto(n) {
        if (n === 'sx') sel = Math.max(0, sel - 1)
        else if (n === 'dx') { if (tasti.length === 1) { risolvi(tasti[0]); togli() } else sel = Math.min(tasti.length - 1, sel + 1) } // (con un tasto solo, «avanti ▶»: destra va avanti)
        else if (n === 'ok') { risolvi(tasti[sel]); togli() }
        else if (n === 'indietro') { risolvi(null); togli() }
        return true
      },
    }
    spingi(v)
  })
}

// ── la guida (Alberto, 29.10: «al primo accesso spiega come funziona»), una volta sola (pzkko-zero-guida) e di nuovo dalle
// impostazioni. (4.11, Alberto: «uno che non ha mai aperto il sito fa fatica a usare il flipper… fai cose super facili»:
// prima erano quattro dialoghi di solo testo, e chi arrivava non sapeva quale fosse «la croce» né che le frecce del
// computer vanno. Adesso tre pagine: i tasti DISEGNATI come sono sul cercapersone, coi tasti del computer accanto; come si
// usa, con un tasto scelto vero; da dove si comincia.) OK e → vanno avanti, ← torna, INDIETRO la salta, il clic va avanti ──
const CHIAVE_GUIDA = 'pzkko-zero-guida'
export const guidaVista = () => { try { return localStorage.getItem(CHIAVE_GUIDA) === 'si' } catch { return false } }
/** Un cerchio (pieno o no) di raggio r. */
function cerchio(l, cx, cy, r, pieno = false) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (pieno ? d <= r * r : d <= r * r && d > (r - 1) * (r - 1)) l.px(cx + x, cy + y) }
}
// la freccia che torna, quella stampata su INDIETRO (7 × 7)
const TORNA = ['..#....', '.##....', '######.', '.##...#', '..#...#', '......#', '.#####.']
const PAGINE_GUIDA = [
  { titolo: 'i tasti', disegna(l) {
    // la croce col tasto OK in mezzo, e INDIETRO tondo in basso a destra: come sul cercapersone
    const cx = 38, cy = 66
    cerchio(l, cx, cy, 20)
    l.testo(cx - 2, cy - 17, '▲'); l.testo(cx - 2, cy + 11, '▼'); l.testo(cx - 17, cy - 3, '◀'); l.testo(cx + 13, cy - 3, '▶')
    cerchio(l, cx, cy, 8, true); l.testo(cx - 5, cy - 3, 'OK', { inv: true })
    cerchio(l, 64, 94, 7)
    TORNA.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') l.px(61 + x, 91 + y) }))
    ;['la croce ← → ↑ ↓ sceglie', 'OK, in mezzo, preme', 'INDIETRO, il tondo, torna', '(tenuto tre secondi spegne)'].forEach((r, i) => l.testo(80, BARRA + 22 + i * 10, r))
    ;['dal computer: le frecce,', 'Invio è OK, Esc è INDIETRO,', 'e il clic sullo schermo.'].forEach((r, i) => l.testo(80, BARRA + 67 + i * 10, r))
  } },
  { titolo: 'come si usa', disegna(l) {
    ;["C'è sempre una cosa scelta: è", 'quella rovesciata, così:'].forEach((r, i) => l.testo(MARGINE + 4, BARRA + 22 + i * 10, r))
    const a = 'scelta', b = 'non scelta', wa = Lcd.larghezza(a) + 8, wb = Lcd.larghezza(b) + 8, x = Math.round(W / 2 - (wa + wb + 6) / 2), y = BARRA + 44
    l.riempi(x, y, wa, 11); l.testo(x + 4, y + 2, a, { inv: true }); l.cornice(x + wa + 6, y, wb, 11); l.testo(x + wa + 10, y + 2, b)
    ;['← → ↑ ↓ la cambiano, OK la preme.', "In fondo c'è sempre scritto cosa", 'fanno i tasti, come qui sotto.'].forEach((r, i) => l.testo(MARGINE + 4, BARRA + 62 + i * 10, r))
  } },
  { titolo: 'si comincia', disegna(l) {
    ;['1. crea il conto: un nome e un PIN', '   di 4 cifre. Hai 1.000 $pzk.', '2. nella home OK apre le app,', '   ↓ apre la chat.', '3. nella chat premi «riscuoti il', '   premio»: i $pzk del giorno.', 'La guida torna dalle impostazioni.'].forEach((r, i) => l.testo(MARGINE + 4, BARRA + 22 + i * 10 + (i > 1 ? 3 : 0) + (i > 3 ? 3 : 0) + (i > 5 ? 3 : 0), r))
  } },
]
export function guida(forza = false) {
  if (!forza && guidaVista()) return Promise.resolve()
  return new Promise((fine) => {
    let p = 0
    const chiudi = () => { try { localStorage.setItem(CHIAVE_GUIDA, 'si') } catch {} fine() }
    const v = {
      nome: 'guida',
      tolta: chiudi,
      disegna(l) {
        const pg = PAGINE_GUIDA[p]
        l.testo(MARGINE + 4, BARRA + 3, pg.titolo, { scala: 2 })
        // i pallini delle pagine, in alto a destra
        PAGINE_GUIDA.forEach((_, i) => { const x = W - MARGINE - 8 - (PAGINE_GUIDA.length - 1 - i) * 8; if (i === p) l.riempi(x, BARRA + 7, 5, 5); else l.riquadro(x, BARRA + 7, 5, 5) })
        pg.disegna(l)
        const a = p < PAGINE_GUIDA.length - 1 ? 'OK avanti · INDIETRO salta' : 'OK comincia'
        const xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
        l.testo(xa, H - 9, a)
        zona(MARGINE, BARRA, W - 2 * MARGINE, H - BARRA, () => v.tasto('ok'))
        // (11.11: il clic su «INDIETRO salta» andava avanti: sopra la zona grande, la sua; vince l'ultima segnata)
        if (p < PAGINE_GUIDA.length - 1) zona(xa + Lcd.larghezza('OK avanti · ') - 3, H - 11, Lcd.larghezza('INDIETRO salta') + 6, 11, () => togli())
      },
      tasto(n) {
        if (n === 'ok' || n === 'dx') { if (p < PAGINE_GUIDA.length - 1) p++; else togli() }
        else if (n === 'sx') p = Math.max(0, p - 1)
        else if (n === 'indietro') togli()
        return true
      },
    }
    spingi(v)
  })
}

// ── lo scrivere (11.11, Alberto: «elimina la tastiera che uso quella del mio pc»): niente più tastiera sullo schermo. Al
// suo posto la riga dove compare quello che si scrive con la tastiera vera; sul telefono, toccando lo schermo, si apre la
// tastiera del telefono (telefono.js le passa i tasti: conTastieraVera). OK o Invio fatto, Backspace cancella, INDIETRO o
// Esc annulla. Prima c'erano le file di lettere da scegliere con la croce (la TextInput del Flipper, 29.10) ──
/** Un titolo che sta nella larghezza: se no, tagliato con «…» (le viste di sistema non escono mai dallo schermo). */
const adatta = (s, w, scala = 1) => { s = String(s); if (Lcd.larghezza(s, scala) <= w) return s; while (s.length > 1 && Lcd.larghezza(s + '…', scala) > w) s = s.slice(0, -1); return s + '…' }
let tastieraVera = null
/** telefono.js: fn(true, { numeri }) fa uscire la tastiera del telefono, fn(false) la rimette via. */
export function conTastieraVera(fn) { tastieraVera = fn }
const tocco = () => { try { return matchMedia('(pointer: coarse)').matches } catch { return false } }
const RIGHE = 5, COL = Math.floor((W - 2 * MARGINE - 16) / 6) // (38 lettere per riga: con 39 il cursore toccava la cornice)

/** La vista che scrive: titolo, il testo a capo nella cornice, il cursore; prendi(ch, s) → il testo nuovo, o una stringa
 *  che comincia con «!» per dire perché no (scritta in fondo per un secondo e mezzo). */
function scrivi({ testo = '', titolo = 'scrivi', nascosto = false, numeri = false, prendi }) {
  titolo = adatta(titolo, W - 2 * MARGINE - 4)
  return new Promise((risolvi) => {
    let s = String(testo), avviso = 0, perche = ''
    const fine = (r) => { tastieraVera?.(false); risolvi(r); togli() }
    const v = {
      nome: 'tastiera',
      entra() { if (tocco()) tastieraVera?.(true, { numeri }) },
      esci() { tastieraVera?.(false) },
      tolta: () => risolvi(null),
      tic(t) { if (avviso > 0 && --avviso === 0) return ridisegna(); if (t % 5 === 0) ridisegna() }, // (il cursore che lampeggia, due volte al secondo)
      disegna(l, t) {
        l.testo(MARGINE + 2, BARRA + 3, titolo)
        const alta = RIGHE * 9 + 5
        l.cornice(MARGINE, BARRA + 12, W - 2 * MARGINE, alta)
        const vero = nascosto ? '*'.repeat(s.length) : s // (nascosto: una chiave, sullo schermo solo asterischi)
        const righe = []
        for (let i = 0; i < vero.length || i === 0; i += COL) righe.push(vero.slice(i, i + COL))
        if (vero.length && vero.length % COL === 0) righe.push('')
        const vis = righe.slice(-RIGHE)
        vis.forEach((r, i) => l.testo(MARGINE + 4, BARRA + 15 + i * 9, r))
        const ultima = vis[vis.length - 1]
        if (t % 10 < 5) l.riempi(MARGINE + 4 + Lcd.larghezza(ultima) + (ultima ? 2 : 0), BARRA + 14 + (vis.length - 1) * 9, 5, 9)
        // cosa fare: dal computer si scrive e basta; dal telefono si tocca lo schermo per far uscire la tastiera
        const yd = BARRA + 12 + alta + 6
        const dove = tocco() ? 'tocca qui per scrivere' : 'scrivi con la tastiera del computer'
        l.testo(Math.round(W / 2 - Lcd.larghezza(dove) / 2), yd, dove)
        zona(MARGINE, BARRA + 12, W - 2 * MARGINE, alta + 18, () => tastieraVera?.(true, { numeri }))
        const a = avviso ? perche : s.length ? 'OK fatto · ⌫ cancella · INDIETRO annulla' : 'OK fatto · INDIETRO annulla', xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
        if (avviso) l.riempi(xa - 3, H - 11, Lcd.larghezza(a) + 6, 10)
        l.testo(xa, H - 9, a, { inv: !!avviso })
        if (!avviso) { const wo = Lcd.larghezza('OK fatto'); zona(xa - 3, H - 11, wo + 6, 11, () => fine(s)) }
      },
      tasto(n) {
        if (n === 'ok') fine(s)
        else if (n === 'indietro') fine(null)
        return true // (le frecce non fanno niente: non c'è più niente da scegliere)
      },
      carattere(ch) {
        const r = prendi(ch, s)
        if (r?.startsWith?.('!')) { perche = r.slice(1); avviso = 15 } else if (typeof r === 'string') s = r
      },
      cancella() { s = s.slice(0, -1) },
      scrivendo: () => s.length > 0,
      invio() { fine(s) },
    }
    spingi(v)
  })
}

/** Il testo (un nome, un messaggio, una chiave, il codice C). → il testo, o null con INDIETRO. */
export function tastiera({ testo = '', titolo = 'scrivi', nascosto = false, max = 500 } = {}) {
  // (11.11: un carattere senza glifo, «ß» o un'emoji, era un quadratino nel nome: entra solo quello che font.js sa disegnare)
  return scrivi({ testo, titolo, nascosto, prendi: (ch, s) => (!esiste(ch) ? `!«${ch}» lo schermo non lo sa scrivere` : s.length >= max ? `!al massimo ${max} caratteri` : s + ch) })
}

/** Un numero o una misura (29.10, la calcolatrice: anche negativa, con la virgola, e con gradi anche ° ' "). Il meno cambia
 *  il segno, il punto diventa virgola; dal computer il ° si scrive anche con «g». → il testo, o null con INDIETRO. */
export function numero({ testo = '', titolo = 'il numero', gradi = false, max = 24 } = {}) {
  return scrivi({ testo, titolo, numeri: !gradi, prendi: (ch, s) => {
    if (ch === '-') return s.startsWith('-') ? s.slice(1) : '-' + s
    if (gradi && (ch === 'g' || ch === 'G')) ch = '°'
    if (ch === '.') ch = ','
    if (!/^[0-9,]$/.test(ch) && !(gradi && /^[°'"]$/.test(ch))) return `!qui solo cifre${gradi ? ', virgola e ° \' "' : ' e la virgola'}`
    if (ch === ',' && /,[^°'"]*$/.test(s)) return '!la virgola c’è già'
    if (['°', "'", '"'].includes(ch) && s.includes(ch)) return `!il ${ch} c’è già`
    if (s.length >= max) return `!al massimo ${max} caratteri`
    return s + ch
  } })
}

// ── le cifre (29.10, l'app account: il PIN, l'indirizzo, quanti $pzk): n caselle grandi; ↑ ↓ cambiano la cifra della
// casella scelta, ← → si spostano, le cifre si scrivono anche dalla tastiera vera; nascoste (il PIN) mostrano un asterisco,
// tranne la casella che stai cambiando. OK conferma quando ce ne sono almeno «min»; INDIETRO toglie l'ultima, a vuoto esce ──
export function cifre({ titolo = 'le cifre', n = 4, min = n, nascoste = false, testo = '', prima = '' } = {}) {
  titolo = adatta(titolo, W - 2 * MARGINE)
  return new Promise((risolvi) => {
    // (11.11, Alberto: «quando crei un account e scegli il pin l'ultima cifra non si oscura»: la casella scelta era sempre in
    // chiaro, e dopo la quarta cifra il cursore resta lì. Ora una cifra nascosta si vede solo mentre la giri con ↑↓, 1,5 s)
    let s = String(testo).replace(/\D/g, '').slice(0, n), c = Math.min(s.length, n - 1), avviso = 0, chiaro = 0
    const LATO = n > 6 ? 18 : 24, x0 = Math.round(W / 2 - (n * LATO + Lcd.larghezza(prima, 2) + (prima ? 4 : 0)) / 2) + (prima ? Lcd.larghezza(prima, 2) + 4 : 0), y0 = BARRA + 34
    const metti = (d) => { if (c < s.length) s = s.slice(0, c) + d + s.slice(c + 1); else if (s.length < n) s += d; c = Math.min(c + 1, n - 1, s.length) }
    const gira = (k) => { chiaro = 15; const d = c < s.length ? Number(s[c]) : k > 0 ? -1 : 10; const nuova = String((d + k + 10) % 10); if (c < s.length) s = s.slice(0, c) + nuova + s.slice(c + 1); else if (s.length < n) s += nuova }
    const fatto = () => { if (s.length >= min) { risolvi(s); togli() } else avviso = 15 }
    const v = {
      nome: 'cifre',
      tolta: () => risolvi(null),
      tic() { if (avviso > 0) { avviso--; ridisegna() } if (chiaro > 0) { chiaro--; if (!chiaro) ridisegna() } },
      disegna(l, t) {
        l.testo(Math.round(W / 2 - Lcd.larghezza(titolo) / 2), BARRA + 6, titolo)
        if (prima) l.testo(x0 - Lcd.larghezza(prima, 2) - 4, y0 + (LATO - 14) / 2, prima, { scala: 2 })
        for (let k = 0; k < n; k++) {
          const x = x0 + k * LATO, on = k === c
          if (on) l.riempi(x, y0, LATO - 2, LATO); else l.cornice(x, y0, LATO - 2, LATO)
          const ch = k < s.length ? (nascoste && !(on && chiaro) ? '*' : s[k]) : on && t % 10 < 5 ? '_' : ''
          if (ch) l.testo(x + Math.round((LATO - 2 - Lcd.larghezza(ch, 2)) / 2), y0 + Math.round((LATO - 14) / 2), ch, { scala: 2, inv: on })
          zona(x, y0, LATO - 2, LATO, () => { c = Math.min(k, s.length, n - 1) })
        }
        // le frecce sopra e sotto la casella scelta: si cliccano anche
        const xc = x0 + c * LATO + Math.round((LATO - 2 - 5) / 2)
        l.testo(xc, y0 - 10, '↑'); zona(xc - 4, y0 - 12, 13, 11, () => gira(1))
        l.testo(xc, y0 + LATO + 3, '↓'); zona(xc - 4, y0 + LATO + 1, 13, 11, () => gira(-1))
        const a = avviso ? `servono almeno ${min} cifre` : s.length >= min ? '↑↓ cifra · ←→ sposta · OK fatto' : '↑↓ cifra · ←→ sposta · o scrivile'
        const xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
        if (avviso) l.riempi(xa - 3, H - 11, Lcd.larghezza(a) + 6, 10) // (11.11: rovesciato senza la sua fascia, «servono almeno 4 cifre» non si vedeva)
        l.testo(xa, H - 9, a, { inv: !!avviso })
        // (11.11: il clic solo su «OK fatto»: prima la zona era tutta la riga, e un clic su «↑↓ cifra» mandava il PIN)
        if (s.length >= min && !avviso) { const wo = Lcd.larghezza('OK fatto'); zona(xa + Lcd.larghezza(a) - wo - 3, H - 11, wo + 6, 11, fatto) }
      },
      tasto(k) {
        if (k === 'su') gira(1)
        else if (k === 'giu') gira(-1)
        else if (k === 'sx') { c = Math.max(0, c - 1); chiaro = 0 }
        else if (k === 'dx') { c = Math.min(c + 1, s.length, n - 1); chiaro = 0 }
        else if (k === 'ok') fatto()
        else if (k === 'indietro') { if (s) { s = s.slice(0, -1); c = Math.min(c, s.length) } else { risolvi(null); togli() } }
        else return false
        return true
      },
      carattere(ch) { if (/^[0-9]$/.test(ch)) { metti(ch); chiaro = 0 } },
      cancella() { s = s.slice(0, -1); c = Math.min(c, s.length) },
      scrivendo: () => s.length > 0,
      invio: () => fatto(),
    }
    spingi(v)
  })
}
