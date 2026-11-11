// L'app «lavatrice» di pzk os (1.11, Alberto: «sì» a farla, dopo che il cercapersone nero se n'era andato con la sua):
// i soldi sporchi delle rapine che tornano puliti. Le regole sono quelle della banca (wallet.mjs, lava: al più 50.000 a
// lavaggio, 2.000 puliti di commissione, dieci minuti, una alla volta, in galera non parte) e la logica è quella di
// telefono/app/lavatrice.js (stato, dopo, storia, lava, ritira): qui c'è solo la faccia, a colori dall'11.11 (la macchina
// bianca con l'oblò, l'acqua blu, i soldi che entrano verdi e quelli che escono rossi). Si compra nel pzkstore.
// - LA LAVATRICE, secondo com'è messa:
//   · FERMA, CON GLI SPORCHI: quanto lavare (di serie il massimo, perché la commissione è fissa; ↑ ↓ cambiano di 5.000),
//     la commissione e quanto pesa, come sarai dopo (i puliti, gli sporchi che restano e i lavaggi che servono ancora),
//     l'avviso se lavi meno della commissione; «lava», con la conferma.
//   · GIRA: il cestello che gira dietro l'oblò, quanto manca, la barra, a che ora è pronta. Si può chiudere: lava da sola.
//   · PRONTA: la moneta che salta nell'oblò e «ritira» (la banca li pulisce alla prima richiesta dopo la fine).
//   · VUOTA (niente sporchi) e IN GALERA: cosa vuol dire, e da dove vengono gli sporchi.
// - LA STORIA: le mosse del conto coi soldi sporchi (le rapine, le commissioni, i lavaggi finiti, i puliti dal tempo).
// - COME FUNZIONA: le regole, che scorrono.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C, esa, sfondo } from './lcd.js'
import * as icone from './icone.js'
import { leggi } from './impostazioni.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { MAX, COSTO, DURATA, mmss, ora, quando, pct, stato, dopo, STORIA, storia, lava, ritira } from '../../app/lavatrice.js'
import { corto, destra, centro, pagine, puntini, impagina, scorrevole } from './pezzi.js'

const fmt = (n) => pzk.fmt(n ?? 0), corti = (n) => pzk.fmtCorto(n ?? 0)
const PASSO = 5000 // (↑ ↓: di 5.000 in 5.000, dal massimo in giù)
const X0 = 64, X1 = 245 // la colonna a destra della macchina

/** Le quantità che si possono scegliere: il massimo, poi i multipli di 5.000 sotto. */
const quantita = (max) => (max <= PASSO ? [max] : [max, ...Array.from({ length: Math.ceil(max / PASSO) - 1 }, (_, i) => (Math.ceil(max / PASSO) - 1 - i) * PASSO)])

// (11.11, i colori a 8 bit) la macchina è un disegno coi suoi colori, uguale su tutti gli sfondi: bianca col bordo
// d'acciaio, il display scuro coi led, l'oblò di vetro scuro. Le cifre che dicono qualcosa prendono la tinta che si legge
// sullo sfondo scelto (tinte(): scure sugli sfondi chiari, accese su «notte»), come nella rapina.
const ACCIAIO = esa('#666666'), FERRO = esa('#999999'), SMALTO = esa('#cccccc'), BUIO = esa('#333333'), VETRO = esa('#333366')
const tinte = () => {
  const k = sfondo(leggi().sfondo).inchiostro
  return k[0] + k[1] + k[2] > 384 ? { su: C.verde, giu: esa('#ff6666'), acqua: C.cielo } : { su: esa('#006600'), giu: esa('#990000'), acqua: esa('#0033cc') }
}
/** Ripassa a colori un pezzo di una riga già scritta d'inchiostro (gli stessi pixel, il pezzo prende il colore). */
const tingi = (l, x, y, riga, pezzo, col) => { const i = riga.indexOf(pezzo); if (pezzo && i >= 0) l.testo(x + [...riga.slice(0, i)].length * 6, y, pezzo, { col }) }
/** L'avviso ⚠ come un cartello: giallo su un quadratino scuro, così si vede anche sugli sfondi chiari. → dove scrivere dopo */
const avviso = (l, x, y) => { l.riempi(x - 1, y - 1, 7, 9, BUIO); l.testo(x, y, '⚠', { col: C.giallo }); return x + 9 }

/** Un cerchio di raggio r (il contorno, punto per punto). */
function cerchio(l, cx, cy, r, v = 1) {
  const n = Math.ceil(2 * Math.PI * r * 1.5)
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; l.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), v) }
}
/** Un disco pieno di raggio r. */
function disco(l, cx, cy, r, v) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) l.px(cx + i, cy + j, v)
}

/** La lavatrice disegnata (48 × 76, da x, y): il pannello col display e la manopola, l'oblò; dentro, secondo com'è: il
 *  sacco degli sporchi, il cestello che gira con l'acqua, la moneta pronta, il lucchetto della galera, niente. */
function macchina(l, x, y, { dentro, giro = 0, salto = 0, vibra = 0 }) {
  x += vibra
  l.riempi(x + 1, y + 1, 46, 70, SMALTO); l.riquadro(x, y, 48, 72, ACCIAIO)
  l.orizz(x + 1, y + 12, 46, ACCIAIO)
  l.riempi(x + 4, y + 3, 20, 7, BUIO) // il display: i led verdi corrono mentre gira, fermi quando è pronta, rossi in galera
  const led = { gira: C.verde, pronta: C.verde, galera: C.rosso }[dentro]
  if (led) for (let i = 0; i < 3; i++) if (dentro !== 'gira' || (giro + i) % 3) l.riempi(x + 6 + i * 6, y + 5, 4, 3, led)
  disco(l, x + 38, y + 6, 3, FERRO); cerchio(l, x + 38, y + 6, 3, ACCIAIO); l.px(x + 38, y + 4, BUIO) // la manopola
  l.riempi(x + 6, y + 72, 6, 3, BUIO); l.riempi(x + 36, y + 72, 6, 3, BUIO) // i piedini
  const cx = x + 24, cy = y + 42
  disco(l, cx, cy, 17, FERRO); disco(l, cx, cy, 14, VETRO) // l'oblò: l'anello e il vetro
  cerchio(l, cx, cy, 17, ACCIAIO); cerchio(l, cx, cy, 14, ACCIAIO)
  if (dentro === 'gira') {
    // l'acqua blu sotto la riga dell'acqua (prima era un pixel sì e uno no: col bit unico si fingeva così) e tre panni colorati che girano
    for (let j = 3; j <= 13; j++) for (let i = -13; i <= 13; i++) if (i * i + j * j <= 144) l.px(cx + i, cy + j, C.blu)
    const a0 = giro * 0.7, PANNI = [C.rosso, C.giallo, C.bianco]
    for (let k = 0; k < 3; k++) { const a = a0 + (k * Math.PI * 2) / 3; l.riempi(Math.round(cx + Math.cos(a) * 8) - 2, Math.round(cy + Math.sin(a) * 8) - 2, 4, 4, PANNI[k]) }
    return
  }
  const ic = { sporchi: 'sacco', pronta: 'pzk', galera: 'lucchetto' }[dentro]
  if (ic) { l.bitmap(icone.bitmap(ic, 16), cx - 8, cy - 8 - salto); return }
  // vuota: due riflessi sul vetro
  for (let i = 0; i < 4; i++) { l.px(cx - 7 + i, cy - 4 - i, C.bianco); l.px(cx - 4 + i, cy - 2 - i, C.bianco) }
}

/** Il tasto disegnato a mano nella colonna a destra (centrato lì, non su tutto lo schermo: a sinistra c'è la macchina). */
function tasto(l, zona, eti, y, premi) {
  const w = Lcd.larghezza(eti) + 8, x = Math.round((X0 + X1) / 2 - w / 2)
  l.riempi(x, y, w, 11); l.testo(x + 4, y + 2, eti, { inv: true })
  zona(x, y - 2, w, 15, premi)
}

const REGOLE = (pulizia) => [
  { titolo: 'la lavatrice' },
  { testo: `Lava fino a ${fmt(MAX)} $pzk sporchi alla volta: dopo dieci minuti sono puliti, e si spendono e si mandano come gli altri.` },
  { titolo: 'quanto costa' },
  { testo: `${fmt(COSTO)} $pzk puliti a lavaggio, alla cassa di pzk: sempre gli stessi, sia per 3.000 sia per 50.000. Conviene lavare il massimo.` },
  { titolo: 'le regole' },
  { punto: 'una lavatrice alla volta' },
  { punto: 'in galera non parte; quella che gira finisce lo stesso' },
  { punto: `gli sporchi lasciati lì si puliscono da soli dopo 96 giorni${pulizia ? ` (i primi il ${quando(pulizia)})` : ''}` },
  { titolo: 'da dove vengono' },
  { testo: 'Dalle rapine alla cassa di pzk (app rapina): il bottino è sporco. Si vede nel saldo, ma con pzk non si spende e non si manda.' },
]

export function vista(os) {
  let voluto = null // (null = il massimo; se no la quantità scelta. 11.11: si ricorda il numero e non il posto in quantita(),
  // REGOLE.md 3.12: con gli sporchi cambiati da un'altra scheda i 20.000 scelti diventavano 45.000 senza che si premesse niente)
  let giuS = 0, giuR = 0
  let giro = 0, salto = 0, eraGira = false, eraCome = null

  const qs = (s) => quantita(s.max)
  /** Il posto della quantità scelta fra quelle di adesso: il massimo, o la più grande che non supera quella scelta. */
  const scelta = (s) => { const Q = qs(s); if (voluto === null) return 0; const i = Q.findIndex((v) => v <= voluto); return i < 0 ? Q.length - 1 : i }
  const q = (s) => qs(s)[scelta(s)] ?? 0
  /** ↑ (d = -1, di più) o ↓ (d = 1, di meno), dal tasto e dal clic sulle frecce. (11.11: gli sporchi possono essere
   *  diminuiti e la scelta vecchia stare oltre la fine; il clic su ▲ la spostava lì senza che sullo schermo cambiasse niente) */
  const muovi = (d) => { const s = stato(), Q = qs(s), i = Math.max(0, Math.min(Q.length - 1, scelta(s) + d)); voluto = i === 0 ? null : Q[i] }
  /** Com'è messa (decide cosa disegna la prima pagina e cosa fanno i tasti). */
  const come = (s) => (s.gira ? 'gira' : s.pronto ? 'pronta' : s.dentro ? 'galera' : s.sp > 0 ? 'ferma' : 'vuota')

  async function lavaQ(x) {
    const s = stato(), n = q(s)
    if (s.dentro) return x.dì(false, 'in galera non si lava niente')
    if (s.pu < COSTO) return x.dì(false, `servono ${fmt(COSTO)} puliti: ne hai ${corti(s.pu)}`)
    if (!(n > 0)) return x.dì(false, 'non hai soldi sporchi da lavare')
    const r = await os.dialogo({ titolo: 'si lava?', icona: 'app-lavatrice', tasti: ['no', 'lava'],
      testo: `${fmt(n)} sporchi in lavatrice per dieci minuti. Commissione: ${fmt(COSTO)} puliti${n < COSTO ? ', più di quanto lavi: ci perdi' : ''}.` })
    if (r !== 'lava' || !x.qui()) return
    const d = await x.aspetta('carico la lavatrice…', () => lava(n))
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore ?? 'non va: riprova')
    voluto = null
    os.suoni.sigla('lavatrice')
    x.dì(true, `lava: pronti alle ${ora(d.fatto?.lavaggio?.fino ?? Date.now() + DURATA)}`)
  }
  async function ritiraOra(x) {
    const d = await x.aspetta('ritiro i puliti…', () => ritira())
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore ?? 'non va: riprova')
    if (pzk.lavaggio()) return x.dì(false, 'quasi: ancora qualche secondo') // (l'ora della banca non è ancora arrivata)
    os.suoni.sigla('moneta')
    x.dì(true, `+${fmt(d.n)} $pzk puliti`)
  }

  const macchinaPag = {
    nome: 'lavatrice', icona: 'app-lavatrice',
    aiuto() {
      const s = stato(), c = come(s)
      if (c === 'ferma') return s.pu >= COSTO ? (qs(s).length > 1 ? 'OK lava · ↑↓ quanto · ←→ pagine' : 'OK lava · ←→ pagine') : '←→ pagine'
      if (c === 'pronta') return 'OK ritira · ←→ pagine'
      return '←→ pagine'
    },
    ok(x) {
      const s = stato(), c = come(s)
      if (c === 'ferma') lavaQ(x)
      else if (c === 'pronta') ritiraOra(x)
    },
    tic(t) {
      let ancora = false
      const s = stato()
      if (eraGira && !s.gira && s.pronto) { os.suoni.sigla('lavatrice-pronta'); salto = 8 } // (finita mentre si guarda)
      eraGira = s.gira
      const c = come(s)
      if (c !== eraCome) { eraCome = c; ancora = true } // (11.11: la galera finisce col tempo, senza avvisi: restava «in galera» sullo schermo e OK apriva già il lavaggio)
      if (s.gira && t % 5 === 0) { giro++; ancora = true } // (due volte al secondo: il cestello e i secondi che corrono)
      if (salto > 0) { salto--; ancora = true }
      return ancora
    },
    disegna(l, x) {
      const s = stato(), c = come(s)
      const su = salto > 0 ? [0, 2, 4, 5, 4, 2, 1, 0][8 - salto] ?? 0 : 0
      macchina(l, 8, 34, { dentro: { ferma: 'sporchi', gira: 'gira', pronta: 'pronta', galera: 'galera', vuota: 'vuota' }[c], giro, salto: su, vibra: s.gira ? giro % 2 : 0 })
      if (c === 'gira') {
        const lav = s.lav, resta = lav.fino - Date.now(), k = Math.max(0, Math.min(1, 1 - resta / DURATA))
        l.testo(X0, 34, 'in lavaggio')
        const n = fmt(lav.n); l.testo(X0, 44, n, { scala: 2 }); l.testo(X0 + 4 + Lcd.larghezza(n, 2), 51, '$pzk')
        l.testo(X0, 65, 'fra'); l.testo(X0 + 22, 62, mmss(resta), { scala: 2 })
        l.riquadro(X0, 81, X1 - X0, 7); l.riempi(X0 + 2, 83, Math.round((X1 - X0 - 4) * k), 3, tinte().acqua) // (la barra si riempie d'acqua)
        l.testo(X0, 92, `pronti alle ${ora(lav.fino)}`)
        l.testo(X0, 103, corto(s.dentro ? 'in galera, ma questa finisce' : 'puoi chiudere: lava da sola', 30))
        return
      }
      if (c === 'pronta') {
        l.testo(X0, 34, 'lavaggio finito')
        l.testo(X0, 44, `+${fmt(s.lav.n)}`, { scala: 2, col: tinte().su }) // (11.11: i soldi che tornano, verdi)
        l.testo(X0, 62, 'sporchi diventati puliti')
        l.testo(X0, 71, corto(`ritirati, avrai ${corti(s.pu + s.lav.n)} puliti`, 30)) // (finché non si ritira, quelli lavati contano ancora fra gli sporchi)
        tasto(l, x.zona, 'ritira', 99, () => ritiraOra(x))
        return
      }
      if (c === 'galera') {
        l.testo(X0, 34, 'in galera', { scala: 2, col: tinte().giu })
        l.testo(X0, 53, `fino alle ${ora(pzk.galera())}`)
        Lcd.acapo('la lavatrice non parte. Si esce prima con la cauzione: app rapina.', 30).slice(0, 3).forEach((r, i) => l.testo(X0, 66 + i * 9, r))
        if (s.sp > 0) l.testo(X0, 101, corto(`da lavare: ${corti(s.sp)} sporchi`, 30))
        return
      }
      if (c === 'vuota') {
        l.testo(X0, 34, 'niente da lavare')
        Lcd.acapo('I soldi sporchi vengono dalle rapine alla cassa di pzk: si vedono nel saldo, ma non si spendono. Qui tornano puliti.', 30).slice(0, 5).forEach((r, i) => l.testo(X0, 47 + i * 9, r))
        l.testo(X0, 101, corto(`hai ${corti(s.pu)} $pzk puliti`, 30))
        return
      }
      // ferma, con gli sporchi: quanto, la commissione, come sarai dopo
      const n = q(s), d = dopo(n, s.sp, s.pu), Q = qs(s)
      l.testo(X0, 34, 'da lavare'); destra(l, X1, 34, corto(`hai ${corti(s.sp)} sporchi`, 18))
      const sn = fmt(n); l.testo(X0, 44, sn, { scala: 2 }); l.testo(X0 + 4 + Lcd.larghezza(sn, 2), 51, '$pzk')
      if (Q.length > 1 && s.pu >= COSTO) { // (senza la commissione ↑ ↓ non fanno niente: niente frecce, REGOLE.md 3.3)
        const i = scelta(s), piu = i > 0, meno = i < Q.length - 1
        if (piu) { l.testo(X1 - 6, 43, '▲'); x.zona(X1 - 9, 41, 12, 9, () => { muovi(-1); os.ridisegna() }) }
        if (meno) { l.testo(X1 - 6, 52, '▼'); x.zona(X1 - 9, 51, 12, 9, () => { muovi(1); os.ridisegna() }) }
      }
      const com = `${fmt(COSTO)} · ${pct(COSTO, n)}`, T = tinte()
      puntini(l, 63, 'commissione', com, { x0: X0, x1: X1 })
      tingi(l, X1 - Lcd.larghezza(com), 63, com, fmt(COSTO), T.giu) // (11.11: la commissione è quello che si perde, rossa)
      puntini(l, 72, 'puliti dopo', corti(d.puliti), { x0: X0, x1: X1 })
      puntini(l, 81, 'restano', d.restano > 0 ? `${corti(d.restano)} · ${d.ancora} ${d.ancora === 1 ? 'lavaggio' : 'lavaggi'}` : 'nessuno', { x0: X0, x1: X1 })
      if (s.pu < COSTO) {
        l.testo(X0, 90, `la commissione è ${fmt(COSTO)} puliti`)
        const hai = corto(`e ne hai ${corti(s.pu)}.`, 30)
        l.testo(X0, 99, hai); tingi(l, X0, 99, hai, corti(s.pu), T.giu) // (quelli che mancano: pochi, rossi)
        l.testo(X0, 108, 'si fanno col lavoro e le quest')
        return
      }
      if (n < COSTO) l.testo(avviso(l, X0 + 1, 90), 90, corto('lavi meno della commissione', 28)) // (11.11: il ⚠ giallo, sul suo cartello)
      else l.testo(X0, 90, 'pronti in 10 minuti')
      tasto(l, x.zona, `lava ${fmt(n)}`, 101, () => lavaQ(x))
    },
    tasto(k) {
      const s = stato()
      if (come(s) !== 'ferma' || s.pu < COSTO) return false
      if (k === 'su') { muovi(-1); return true } // (gli sporchi possono essere cambiati: muovi lo guarda qui e non nel disegno, REGOLE.md 4.8)
      if (k === 'giu') { muovi(1); return true }
      return false
    },
  }

  const VIS = 9, VIS_S = 8 // (11.11: la storia va a coppie di righe e scorre di due; con 9 righe in fondo restava in cima la riga «-2000 puliti» senza la sua mossa)
  // (11.11: la data davanti al nome tagliava la mossa più comune, «commissione della la…»: ora il nome sta da solo sulla
  // prima riga e la data a destra dell'importo; 38 caratteri da x 10 finiscono a 237, prima delle frecce di scorrevole a 242)
  const RIGA_S = 38
  const righeStoria = () => storia(pzk.conto()).flatMap((m) => {
    const [nome, cosa, segno] = STORIA[m.tipo], d = quando(m.t), piu = segno === 'meno' ? '-' : '+'
    let a = `  ${piu}${fmt(m.n)} ${cosa}`
    if (a.length + 1 + d.length > RIGA_S) a = `  ${piu}${corti(m.n)} ${cosa}` // (un bottino enorme: il numero corto, la data resta)
    return [{ s: corto(nome, RIGA_S) }, { s: corto(a, RIGA_S - 1 - d.length).padEnd(RIGA_S - d.length) + d, segno, cifra: a.trim().split(' ')[0] }]
  })
  const storiaPag = {
    nome: 'la storia', icona: 'clessidra',
    aiuto: () => (righeStoria().length > VIS_S ? '↑↓ scorre · ←→ pagine' : '←→ pagine'),
    disegna(l) {
      const R = righeStoria()
      if (!R.length) { centro(l, 60, 'ancora niente coi soldi sporchi'); centro(l, 72, 'le rapine, i lavaggi: qui'); return }
      giuS = scorrevole(l, R, { y0: 34, vis: VIS_S, giu: giuS })
      // (11.11: l'importo a colori, i puliti che entrano verdi e la commissione rossa; il bottino sporco resta d'inchiostro)
      const T = tinte()
      R.slice(giuS, giuS + VIS_S).forEach((r, i) => { if (r.segno) tingi(l, 10, 34 + i * 9, r.s, r.cifra, r.segno === 'meno' ? T.giu : T.su) })
    },
    tasto(k) {
      const n = Math.max(0, righeStoria().length - VIS_S)
      if (k === 'su') { giuS = Math.max(0, giuS - 2); return true }
      if (k === 'giu') { giuS = Math.min(n, giuS + 2); return true }
      return false
    },
  }
  const regole = {
    nome: 'come funziona', icona: 'lucchetto',
    aiuto: '↑↓ legge · ←→ pagine',
    disegna(l) { giuR = scorrevole(l, impagina(REGOLE(stato().pulizia)), { y0: 34, vis: VIS, giu: giuR }) },
    tasto(k) {
      const n = Math.max(0, impagina(REGOLE(stato().pulizia)).length - VIS)
      if (k === 'su') { giuR = Math.max(0, giuR - 1); return true }
      if (k === 'giu') { giuR = Math.min(n, giuR + 1); return true }
      return false
    },
  }

  return pagine(os, {
    nome: 'lavatrice', app: 'lavatrice',
    pagine: [macchinaPag, storiaPag, regole],
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
    entra: () => { const s = stato(); eraGira = s.gira; eraCome = come(s) },
  })
}
