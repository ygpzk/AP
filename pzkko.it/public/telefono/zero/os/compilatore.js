// L'app «codice C» di pzk os (29.10, Alberto: «crea uno alla volta … codice C …»): il compilatore C sul cercapersone zero. Il
// C è vero come nell'app vecchia (telefono/app/compilatore.js: compila, cioè GCC 14.2 su Compiler Explorer e se non risponde
// Wandbox; gli ESEMPI), e il codice e l'input sono gli stessi suoi (telefono/ricordi.js, «compilatore»).
// - L'EDITOR: i numeri di riga, il cursore che lampeggia, le frecce lo muovono (← → vanno anche a capo), le righe con un
//   errore hanno il numero rovesciato. Dalla tastiera vera si scrive: Invio va a capo tenendo il rientro (e lo allarga
//   dopo «{»), la graffa chiusa torna indietro, Backspace cancella, Ctrl+Invio è OK.
// - OK apre IL MENU: esegui, scrivi qui (una riga dalla tastiera vera, 11.11), a capo, cancella, l'input per scanf, l'ultimo
//   output, gli esempi.
// - L'OUTPUT: mentre compila la rotellina e i punti che corrono; poi gli avvisi, quello che ha stampato, il codice d'uscita, i
//   secondi e dove. Scorre con ↑ ↓, OK lo rifà.
// - I COLORI (11.11, Alberto: «fai colori a 8bit su tutto»): nell'editor le stringhe verdi, i commenti grigi, le direttive
//   (#include, #define) blu, il resto d'inchiostro; il numero di una riga con un errore su una fascia rossa, con un avviso su
//   una gialla. Nell'output la riga «error:» su una fascia rossa e la «warning:» su una gialla, le righe che le spiegano (e lo
//   stderr del programma) col filo del loro colore a sinistra; la riga del codice d'uscita verde se è 0, rossa se no.
// Il codice esce dal sito per compilarlo (Alberto ha scelto così il 26.10): l'output lo ricorda. Le regole: os/REGOLE.md.
import { Lcd, W, H, esa } from './lcd.js'
import { ESEMPI, compila, S } from '../../app/compilatore.js'
import { ricorda } from '../../ricordi.js'
import { txt, corto, destra, centro, testata, striscia, elenco, muovi } from './pezzi.js'

// (S è quello dell'app vecchia: lo stesso codice e lo stesso input, anche aperte tutte e due)
const salva = () => ricorda('compilatore', S)
for (const k of ['codice', 'input']) if (typeof S[k] !== 'string') S[k] = String(S[k] ?? '') // (11.11: un ricordo rovinato, null, rompeva split a ogni disegno)
S.codice = S.codice.replace(/\r\n?/g, '\n').replace(/\t/g, '    ') // (11.11: un codice incollato coi tab nell'editor vecchio: il tab si disegnava largo quattro e contava uno, il cursore finiva fuori posto e su un «?»)
let ultimo = null, inCorso = false // l'ultima esecuzione (come l'app vecchia: si perde chiudendo la pagina)
const VIS = 9, COL = 36 // le righe e le colonne di codice che si vedono

/** Un testo lungo a pezzi di n caratteri (il codice e l'output non si vanno a capo sulle parole: si tagliano). 37 e non 39:
 *  a destra restano le frecce ↑ ↓, come in pezzi.impagina. */
const aPezzi = (s, n = 37) => String(s ?? '').replace(/\t/g, '    ').split('\n').flatMap((r) => { const a = [...txt(r)]; if (!a.length) return ['']; const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n).join('')); return o })

// ── i colori (11.11): le fasce hanno il loro testo (bianco sul rosso e sul verde, nero sul giallo), così si leggono su ogni
// sfondo; i colori del codice, che stanno sul fondo, hanno una versione scura per gli sfondi chiari e una chiara per «notte»
// (l'inchiostro chiaro), come nella chat: un verde chiaro su carta o un blu scuro su notte non si leggono ──
const BIANCO = esa('#ffffff'), NERO = esa('#000000')
const FASCE = { err: [esa('#cc0000'), BIANCO], avv: [esa('#ffcc00'), NERO], ok: [esa('#009900'), BIANCO] }
const SCURE = { stringa: esa('#006600'), commento: esa('#666666'), direttiva: esa('#0033cc'), verde: esa('#006600'), rosso: esa('#cc0000'), ambra: esa('#993300') }
const CHIARE = { stringa: esa('#33cc33'), commento: esa('#999999'), direttiva: esa('#6699ff'), verde: esa('#33cc33'), rosso: esa('#ff3333'), ambra: esa('#ff9933') }
/** Le tinte per lo sfondo di adesso (dall'inchiostro del tema: chiaro vuol dire fondo scuro). */
const tinte = (l) => ((l.tema?.inchiostro ?? [0, 0, 0]).reduce((a, b) => a + b, 0) > 384 ? CHIARE : SCURE)
/** Una riga su una fascia del suo colore (err, avv, ok): il testo da x, la fascia due pixel prima. */
const suFascia = (l, x, y, s, k) => { const [f, c] = FASCE[k]; l.riempi(x - 2, y - 1, Lcd.larghezza(s) + 4, 9, f); l.testo(x, y, s, { col: c }) }

/** Il codice a pezzi colorati: per ogni riga, per ogni carattere, null (inchiostro), 'stringa', 'commento' o 'direttiva'. I
 *  commenti /* … *\/ vanno da una riga all'altra, una stringa senza fine si chiude a fine riga; la direttiva è tutta la riga
 *  che comincia con # (fino a un commento). Ricordato per il codice di adesso: disegna lo chiede due volte al secondo. */
let pezziDi = { src: null, k: [] }
function colori(L) {
  const src = L.join('\n')
  if (pezziDi.src === src) return pezziDi.k
  const K = []
  let blocco = false
  for (const riga of L) {
    const a = [...riga], k = new Array(a.length).fill(null)
    let i = 0, str = null
    const dir = /^\s*#/.test(riga)
    while (i < a.length) {
      if (blocco) { k[i] = 'commento'; if (a[i] === '*' && a[i + 1] === '/') { k[i + 1] = 'commento'; i += 2; blocco = false } else i++; continue }
      if (str) { k[i] = 'stringa'; if (a[i] === '\\') { if (i + 1 < a.length) k[i + 1] = 'stringa'; i += 2; continue } if (a[i] === str) str = null; i++; continue }
      if (a[i] === '/' && a[i + 1] === '/') { k.fill('commento', i); break }
      if (a[i] === '/' && a[i + 1] === '*') { k[i] = k[i + 1] = 'commento'; i += 2; blocco = true; continue }
      if (dir) { k[i++] = 'direttiva'; continue } // (#include "x.h": la riga resta tutta blu)
      if (a[i] === '"' || a[i] === '\'') { str = a[i]; k[i++] = 'stringa'; continue }
      i++
    }
    K.push(k)
  }
  pezziDi = { src, k: K }
  return K
}

// ── una lista che si sceglie (il menu, gli esempi, le righe dell'input) ──
function lista(os, { titolo, icona, voci, aiuto = 'OK sceglie · ↑↓ · INDIETRO torna' }) {
  const st = { sel: 0, da: 0 }
  return {
    nome: 'compilatore-lista', app: 'compilatore',
    disegna(l) {
      testata(l, os, { icona, nome: titolo, n: 1 })
      const V = voci()
      elenco(l, os.zona, {
        voci: V, stato: st, y0: 34, alta: 80, passo: 10,
        clic: (v) => v.fai(),
        riga(l, v, x0, y, w, on) { l.testo(x0, y + 1, corto(v.nome, v.val ? 24 : 37), { inv: on }); if (v.val) destra(l, x0 + w, y + 1, corto(v.val, 12), on || !v.tinta ? { inv: on } : { col: tinte(l)[v.tinta] }) }, // (11.11: il valore col suo colore, «fatto» verde; sulla riga scelta rovesciato come il resto)
      })
      centro(l, H - 9, aiuto)
    },
    tasto(k) {
      const V = voci()
      if (muovi(st, V.length, k)) return true
      if (k === 'ok') { V[st.sel]?.fai(); return true }
      if (k === 'indietro') { os.togli(); return true }
      return k === 'sx' || k === 'dx'
    },
  }
}

// ── l'output ──
function vistaOutput(os) {
  let giu = 0
  /** Le righe: { s, fascia, filo } (11.11, coi colori: fascia err, avv o ok è la riga su una fascia rossa, gialla o verde;
   *  filo err o avv il filo colorato a sinistra delle righe che spiegano un errore o un avviso, e dello stderr. Tenuti a
   *  parte dal testo, così l'output che comincia con «!» o con «error:» resta com'è). */
  const righe = () => {
    const u = ultimo, R = [], metti = (L, o = {}) => R.push(...L.map((s) => ({ s, ...o })))
    if (!u) return [{ s: 'ancora niente: dal menu, esegui.' }]
    if (u.rete) return Lcd.acapo(txt(u.testo), 37).map((s) => ({ s, fascia: 'avv' })) // (11.11: è una frase, a capo sulle parole; a pezzi diceva «sei off» e sotto «line?»)
    const s = (u.ms / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })
    if (u.messaggi) { // (le righe del compilatore: «error:» e «warning:» sulla fascia, le altre col filo del blocco a cui stanno)
      const M = String(u.messaggi).split('\n'), tipo = (r) => (/\berror:/.test(r) ? 'err' : /\bwarning:/.test(r) ? 'avv' : null)
      const T = M.map(tipo), primo = T.find(Boolean) ?? (u.compilato ? 'avv' : 'err') // («In function 'main':» sta prima del suo errore: prende quello che viene dopo)
      let blocco = primo
      M.forEach((r, i) => { if (T[i]) blocco = T[i]; metti(aPezzi(r), T[i] ? { fascia: T[i], filo: T[i] } : { filo: blocco }) })
    }
    if (u.compilato) { metti(u.out ? aPezzi(u.out) : ['(non ha stampato niente)']); if (u.err) metti(aPezzi(u.err), { filo: 'err' }) }
    metti(['']); metti([u.compilato ? `[finito: codice d’uscita ${u.codice ?? '?'} · ${s} s]` : `[non compila · ${s} s]`], { fascia: u.compilato && u.codice === 0 ? 'ok' : 'err' }) // (0: è andato; un altro codice o niente: no)
    metti([`[${u.dove}]`, ...Lcd.acapo('il codice si compila su un servizio esterno: non scriverci password.', 37)]) // (la nota sì, a capo sulle parole)
    return R
  }
  const v = {
    nome: 'compilatore-output', app: 'compilatore',
    tic(t) { if (inCorso && t % 2 === 0) os.ridisegna() }, // (spinta con os.spingi: os non legge cosa torna tic; la rotellina gira solo mentre compila)
    disegna(l, t) {
      testata(l, os, { icona: 'app-compilatore', nome: 'l’output', n: 1 })
      if (inCorso) {
        const g = ['|', '/', '-', '\\'][Math.floor(t / 2) % 4]
        centro(l, 56, `${g} compilo ed eseguo ${g}`, { scala: 1 })
        centro(l, 68, 'GCC 14.2 su Compiler Explorer')
        for (let i = 0; i < 12; i++) { const x = 92 + i * 6, on = (Math.floor(t / 2) - i + 120) % 12 < 3; if (on) l.riempi(x, 82, 4, 4, tinte(l).verde); else l.px(x + 1, 84) } // (i punti che corrono; 11.11 verdi)
        centro(l, H - 9, 'INDIETRO torna (finisce lo stesso)')
        return
      }
      const R = righe(), g = Math.max(0, Math.min(giu, R.length - VIS)) // (una copia: giu lo tiene giusto tasto)
      R.slice(g, g + VIS).forEach((r, i) => {
        const y = 34 + i * 9
        if (r.filo) l.riempi(6, y - 1, 2, 9, FASCE[r.filo][0]) // (il filo: le righe di seguito fanno una riga sola)
        if (r.fascia && r.s) suFascia(l, 10, y, r.s, r.fascia) // (11.11: la riga vuota no, era un quadratino nero)
        else l.testo(10, y, r.s)
      })
      if (g > 0) l.testo(W - 14, 34, '↑')
      if (g + VIS < R.length) l.testo(W - 14, 34 + (VIS - 1) * 9, '↓')
      centro(l, H - 9, !ultimo ? 'OK esegui · INDIETRO torna' : R.length > VIS ? '↑↓ legge · OK di nuovo · INDIETRO' : 'OK di nuovo · INDIETRO torna') // (11.11: «di nuovo» anche quando non era mai partito)
    },
    tasto(k) {
      if (inCorso) { if (k === 'indietro') os.togli(); return true }
      if (k === 'su') giu = Math.max(0, Math.min(giu, righe().length - VIS) - 1)
      else if (k === 'giu') giu = Math.min(giu + 1, Math.max(0, righe().length - VIS))
      else if (k === 'ok') { giu = 0; esegui(os) }
      else if (k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
  return v
}
async function esegui(os) {
  if (os.corrente()?.nome !== 'compilatore-output') os.spingi(vistaOutput(os)) // (anche se sta già compilando: si vede a che punto è)
  if (inCorso) return // (niente due compilazioni insieme)
  inCorso = true; ultimo = null
  os.ridisegna()
  try { ultimo = await compila(S.codice, S.input) } finally { inCorso = false }
  if (os.corrente()?.app === 'compilatore') os.suoni.bip(ultimo?.compilato ? 'pager' : 'pagerGiu') // (11.11: finito con l'app chiusa, suonava dentro un'altra app o a cercapersone chiuso)
  os.ridisegna()
}

export function vista(os) {
  let r = 0, c = 0, top = 0, sx = 0, esito = null
  const righe = () => S.codice.split('\n')
  const metti = (L) => { S.codice = L.join('\n'); salva() }
  const tieni = () => { const L = righe(); r = Math.max(0, Math.min(r, L.length - 1)); c = Math.max(0, Math.min(c, L[r].length)) }
  /** Le cifre dei numeri di riga oltre due (dalla riga 100 il separatore e il codice vanno più a destra, una colonna in meno). */
  const piu = () => Math.max(0, String(righe().length).length - 2)
  /** Il cursore dentro il codice e la finestra che lo mostra: dopo ogni tasto e ogni modifica (disegna non cambia lo stato). */
  function segui() { tieni(); const col = COL - piu(); if (r < top) top = r; if (r >= top + VIS) top = r - VIS + 1; if (c < sx) sx = c; if (c >= sx + col) sx = c - col + 1 }
  function scrivi(ch) {
    tieni()
    const L = righe(), riga = L[r]
    if (ch === '}' && /^\s+$/.test(riga.slice(0, c))) { const sp = Math.max(0, c - 4); L[r] = ' '.repeat(sp) + '}' + riga.slice(c); c = sp + 1 } // (la graffa chiusa torna indietro di un rientro)
    else { L[r] = riga.slice(0, c) + ch + riga.slice(c); c += ch.length }
    metti(L); segui()
  }
  function aCapo() {
    tieni()
    const L = righe(), riga = L[r], prima = riga.slice(0, c), dopo = riga.slice(c)
    const rientro = /^\s*/.exec(prima)[0] + (/\{\s*$/.test(prima) ? '    ' : '')
    if (/\{\s*$/.test(prima) && /^\s*\}/.test(dopo)) L.splice(r, 1, prima, rientro, rientro.slice(4) + dopo.trimStart()) // (fra { e }: la riga in mezzo)
    else L.splice(r, 1, prima, rientro + dopo.trimStart())
    r++; c = rientro.length
    metti(L); segui()
  }
  function cancella() {
    tieni()
    const L = righe()
    if (c > 0) { L[r] = L[r].slice(0, c - 1) + L[r].slice(c); c-- }
    else if (r > 0) { c = L[r - 1].length; L[r - 1] += L[r]; L.splice(r, 1); r-- }
    metti(L); segui()
  }
  const grave = (e) => (e.severity ?? 3) >= 3 || /error/.test(e.text ?? '')
  const erroriRiga = () => new Set((ultimo?.errori ?? []).filter(grave).map((e) => e.line))
  /** Le righe con un avviso e nessun errore (11.11: la fascia gialla; prima a un bit si vedevano solo gli errori). */
  const avvisiRiga = () => new Set((ultimo?.errori ?? []).filter((e) => !grave(e) && (e.severity === 2 || /warning/.test(e.text ?? ''))).map((e) => e.line))

  const menu = () => lista(os, {
    titolo: 'codice C: cosa fai', icona: 'app-compilatore',
    voci: () => [
      { nome: 'esegui', fai: () => { os.togli(); esegui(os) } }, // (senza ▶: → nel menu non fa niente, REGOLE 3.3)
      { nome: 'scrivi qui', val: `riga ${r + 1}`, fai: async () => {
        const qui = os.corrente(), s = await os.tastiera({ titolo: `scrivi alla riga ${r + 1}, colonna ${c + 1}` })
        if (s && os.corrente() === qui) { os.togli(); scrivi(s) } // (dopo l'attesa il menu deve essere ancora in cima)
      } },
      { nome: 'a capo', fai: () => { os.togli(); aCapo() } },
      { nome: 'cancella un carattere', fai: () => { os.togli(); cancella() } },
      { nome: 'l’input (quello che legge scanf)', fai: () => { os.togli(); os.spingi(vistaInput()) } },
      { nome: 'l’ultimo output', val: ultimo ? (ultimo.rete ? 'offline' : ultimo.compilato ? 'fatto' : 'errori') : '', tinta: ultimo ? (ultimo.rete ? 'ambra' : ultimo.compilato ? 'verde' : 'rosso') : null, fai: () => { os.togli(); os.spingi(vistaOutput(os)) } },
      { nome: 'gli esempi', val: `${Object.keys(ESEMPI).length}`, fai: () => { os.togli(); os.spingi(vistaEsempi()) } },
    ],
  })
  const vistaEsempi = () => lista(os, {
    titolo: 'gli esempi', icona: 'app-compilatore',
    voci: () => Object.entries(ESEMPI).map(([id, [nome, codice, input]]) => ({
      nome, fai: async () => {
        if (S.codice.trim() && S.codice !== codice) {
          const qui = os.corrente(), ris = await os.dialogo({ titolo: 'l’esempio', testo: `sostituisco il codice che c’è con «${nome}»?`, icona: 'app-compilatore', tasti: ['no', 'sì'] })
          if (ris !== 'sì' || os.corrente() !== qui) return // (INDIETRO dà null; e gli esempi devono essere ancora in cima)
        }
        Object.assign(S, { codice, input }); salva(); ultimo = null; r = 0; c = 0; top = 0; sx = 0
        os.togli()
        esito = { ok: true, testo: `caricato: ${nome}`, fino: Date.now() + 3000 }
      },
    })),
  })
  const vistaInput = () => lista(os, {
    titolo: 'l’input per scanf', icona: 'app-compilatore', aiuto: 'OK cambia · ↑↓ · INDIETRO torna',
    voci: () => {
      const L = S.input ? S.input.split('\n') : []
      const cambia = async (i) => {
        const s = await os.tastiera({ titolo: i < L.length ? `la riga ${i + 1} dell'input` : 'una riga nuova', testo: L[i] ?? '' })
        if (s === null) return
        const N = [...L]; if (i < L.length) N[i] = s; else N.push(s)
        S.input = N.join('\n'); salva()
      }
      const svuota = async () => { // (non si disfa: prima si chiede)
        const qui = os.corrente(), ris = await os.dialogo({ titolo: 'svuoto?', testo: `tolgo ${L.length === 1 ? 'la riga' : `le ${L.length} righe`} dell’input per scanf.`, icona: 'app-compilatore', tasti: ['no', 'svuota'] })
        if (ris !== 'svuota' || os.corrente() !== qui) return
        S.input = ''; salva()
      }
      return [...L.map((x, i) => ({ nome: x || '(vuota)', val: `riga ${i + 1}`, fai: () => cambia(i) })), { nome: '+ una riga', fai: () => cambia(L.length) }, ...(L.length ? [{ nome: 'svuota l’input', fai: svuota }] : [])]
    },
  })

  const v = {
    nome: 'compilatore', app: 'compilatore',
    entra() { segui() }, // (tornando dal menu, o se la vecchia ha cambiato il codice)
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } }, // (il cursore lampeggia da sé: os ridisegna ogni mezzo secondo)
    disegna(l, t) {
      // (copie: il cursore e la finestra li tiene segui; qui solo i limiti, se il codice è cambiato da un'altra parte)
      const L = righe(), E = erroriRiga(), A = avvisiRiga(), p = piu(), col = COL - p, xc = 26 + p * 6
      const K = colori(L.map((x) => x.replace(/\t/g, '    '))), T = tinte(l)
      const rr = Math.max(0, Math.min(r, L.length - 1)), cc = Math.max(0, Math.min(c, L[rr].length))
      const tp = Math.min(Math.max(top, rr - VIS + 1), rr), s0 = Math.min(Math.max(sx, cc - col + 1), cc)
      testata(l, os, { icona: 'app-compilatore', nome: 'codice C', n: 1 })
      destra(l, 245, 18, `${rr + 1}:${cc + 1}`)
      for (let i = 0; i < VIS && tp + i < L.length; i++) {
        const k = tp + i, y = 34 + i * 9, n = String(k + 1).padStart(2 + p) // (dalla riga 100 tre cifre: il separatore si sposta)
        const fa = E.has(k + 1) ? 'err' : A.has(k + 1) ? 'avv' : null // (11.11: l'errore su una fascia rossa, l'avviso su una gialla)
        if (fa) { l.riempi(7, y - 1, 14 + p * 6, 9, FASCE[fa][0]); l.testo(8, y, n, { col: FASCE[fa][1] }) } else l.testo(8, y, n)
        const a = [...txt(L[k].replace(/\t/g, '    '))], kk = K[k] ?? []
        for (let j = s0; j < Math.min(a.length, s0 + col);) { // (11.11: a pezzi dello stesso colore: le stringhe, i commenti, le direttive)
          let e = j + 1
          while (e < Math.min(a.length, s0 + col) && kk[e] === kk[j]) e++
          l.testo(xc + (j - s0) * 6, y, a.slice(j, e).join(''), kk[j] ? { col: T[kk[j]] } : {})
          j = e
        }
        if (a.length > s0 + col) l.testo(242, y, '›')
        if (s0 > 0 && a.length) l.px(xc - 2, y + 3)
        for (let j = 0; j <= col; j++) { // (11.11: il clic mette il cursore sulla lettera cliccata, non a metà riga; oltre la fine, in fondo)
          const xa = j ? xc + j * 6 - 1 : 23 + p * 6, xb = j < col ? xc + j * 6 + 5 : 244
          os.zona(xa, y - 1, xb - xa, 9, () => { r = k; c = Math.min(L[k].length, s0 + j); segui() })
        }
      }
      l.vert(22 + p * 6, 33, VIS * 9)
      // il cursore: la casella rovesciata, a lampi
      if (t % 10 < 5) { const xx = xc + (cc - s0) * 6, yy = 34 + (rr - tp) * 9, ch = [...txt(L[rr])][cc] ?? ' '; l.riempi(xx - 1, yy - 1, 7, 9); l.testo(xx, yy, ch, { inv: true }) }
      if (!striscia(l, { esito }, t)) centro(l, H - 9, 'OK il menu · le frecce il cursore')
    },
    tasto(k) {
      tieni()
      const L = righe()
      if (k === 'su') { if (r > 0) r--; c = Math.min(c, L[r].length) }
      else if (k === 'giu') { if (r < L.length - 1) r++; c = Math.min(c, L[r].length) }
      else if (k === 'sx') { if (c > 0) c--; else if (r > 0) { r--; c = L[r].length } }
      else if (k === 'dx') { if (c < L[r].length) c++; else if (r < L.length - 1) { r++; c = 0 } }
      else if (k === 'ok') os.spingi(menu())
      else if (k === 'indietro') os.togli()
      else return false
      segui()
      return true
    },
    carattere(ch) { scrivi(ch) },
    cancella,
    scrivendo: () => S.codice.length > 0,
    invio: aCapo,
  }
  return v
}
