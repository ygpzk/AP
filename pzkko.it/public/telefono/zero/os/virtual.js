// L'app «virtual» di pzk os (29.10, Alberto: «crea uno alla volta … virtual …»): il campionato virtuale sul cercapersone
// zero. La partita è quella del gioco grande (games/virtual/partita.js: il ciclo di cinque minuti, deciso dall'orario), lo
// schermino è il SUO (games/virtual/schermo.js: il campo, gli omini, gli spalti, la telecamera, il meteo, i replay), con le
// due primitive (il pixel e il rettangolo) che qui scrivono nei colori della tavolozza a 8 bit dell'lcd (11.11: fino al
// 10.11 l'lcd era a un bit e ogni colore diventava una trama secondo la sua luce). Le scommesse e i pagamenti passano dalla
// STESSA schedina della finestra grande (games/virtual/schedina.js), che dal 31.10 è quella della banca (Alberto: «il
// browser non decide più niente»): ogni giocata si chiede alla banca (con la rotellina in fondo, regola 8.6), il risultato
// e la cronaca arrivano dalla banca a partita iniziata, e le partite finite le paga lei; qui si chiede e si mostra.
// - LA PARTITA: lo schermino a metà, il tabellone (le sigle, il punteggio, il minuto o quanto manca al fischio), la voce
//   della telecronaca. ↓ la partita a schermo intero, senza barra, a misura vera (192 × 120), dieci fotogrammi al secondo.
// - LE QUOTE: la fiche (OK la cambia), 1 X 2 e gli over/under con le fiches che ci hai messo (OK punta), «togli l'ultima»;
//   in cima quanto hai e quanto è sulla partita. Si punta solo nei quattro minuti prima del fischio.
// - LA SCHEDINA: le giocate (la partita, la puntata alla quota, l'esito o quanto paga).
// Finita una partita, al giro dopo la banca la paga e la striscia lo dice; quelle finite ad app chiusa le paga entrando. I suoni
// (il fischio, il gol, il palo, la fiche, la vincita) sono le sigle virtual-* di suono/interfaccia.js, via os.suoni.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C, colore, esa } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import { PUNTATE, PER_PUNTATA, fase, aperte as giocateAperte, adesso, partita, minuto, punteggioA, scriviRisultato, CHIUDE } from '../../../games/virtual/partita.js'
import { Schermo, LARG, ALT } from '../../../games/virtual/schermo.js'
import * as SC from '../../../games/virtual/schedina.js'
import { txt, corto, destra, centro, puntini, elenco, muovi, pagine, striscia } from './pezzi.js'

const fmt = pzk.fmt, q = SC.fmtQuota
const METEO = { sereno: 'sereno', nuvole: 'nuvoloso', pioggia: 'pioggia', nebbia: 'nebbia', neve: 'neve', vento: 'vento forte' }

// ── lo schermino del gioco, a colori (11.11, Alberto: «fai colori a 8bit su tutto»): le sue primitive scrivono il colore di
// ogni pixel grosso, trasparenze comprese (la pioggia, la nebbia, il buio, la luce dei riflettori), e a fotogramma finito
// ogni pixel diventa il colore più vicino della tavolozza. (Fino al 10.11 l'lcd era a un bit: la luce di ogni colore
// diventava una trama, e in campo l'erba si indovinava dal fotogramma perché gli omini non ci sparissero dentro.) ──
const tinte = new Map()
/** Un colore del gioco ('#rgb', '#rrggbb', 'rgb()', 'rgba()') → [r, g, b, a]. */
const rgba = (col) => {
  const s = String(col).trim()
  let t = tinte.get(s)
  if (t) return t
  let r = 0, g = 0, b = 0, a = 1, m
  if ((m = /^#([0-9a-f]{3})$/i.exec(s))) [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16))
  else if ((m = /^#([0-9a-f]{6})$/i.exec(s))) [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16))
  else if ((m = /^rgba?\(([^)]+)\)$/i.exec(s))) { const v = m[1].split(',').map((x) => parseFloat(x)); [r, g, b] = v; a = v[3] ?? 1 }
  if (tinte.size > 4000) tinte.clear() // (la nebbia respira: le sue trasparenze cambiano a ogni fotogramma)
  tinte.set(s, (t = [r, g, b, a]))
  return t
}
const nulla = () => {}
// la tela finta dello Schermo: i rettangoli passano dalle primitive qui sotto; l'unica cosa che lo Schermo disegna da sé è
// il bagliore tondo dei riflettori di notte (un gradiente), che qui si fa a mano
const tela = (chi) => {
  let stile = null
  return {
    save: nulla, restore: nulla, set fillStyle(v) { stile = v }, set imageSmoothingEnabled(_) {},
    createRadialGradient: (xa, ya, r0, x, y, r1) => ({ x, y, r0, r1, fermate: [], addColorStop(o, c) { this.fermate.push([o, rgba(c)]) } }),
    fillRect: () => { if (stile?.fermate) chi().alone(stile) },
  }
}
class SchermoColori extends Schermo {
  constructor() {
    let io = null
    super({ getContext: () => tela(() => io) })
    io = this
    this.k = 1
    this.r = new Float32Array(LARG * ALT); this.g = new Float32Array(LARG * ALT); this.b = new Float32Array(LARG * ALT)
    this.indici = new Uint8Array(LARG * ALT) // (gli indici della tavolozza: la bitmap che va sull'lcd)
  }
  px(x, y, col) { this.rett(x, y, 1, 1, col) }
  mescola(k, [r, g, b, a]) {
    if (a >= 1) { this.r[k] = r; this.g[k] = g; this.b[k] = b; return }
    this.r[k] += (r - this.r[k]) * a; this.g[k] += (g - this.g[k]) * a; this.b[k] += (b - this.b[k]) * a
  }
  rett(x, y, w, h, col) {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(LARG, Math.round(x + w)), y1 = Math.min(ALT, Math.round(y + h))
    if (x1 <= x0 || y1 <= y0) return
    const c = rgba(col)
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.mescola(j * LARG + i, c)
  }
  /** Il gradiente tondo (i riflettori): fra r0 e r1 dal centro le fermate, mescolate come quelle del canvas. */
  alone({ x, y, r0, r1, fermate }) {
    if (!fermate.length) return
    for (let j = 0; j < ALT; j++) for (let i = 0; i < LARG; i++) {
      const u = Math.max(0, Math.min(1, (Math.hypot(i + 0.5 - x, j + 0.5 - y) - r0) / Math.max(1e-6, r1 - r0)))
      let n = 0
      while (n < fermate.length - 1 && fermate[n + 1][0] < u) n++
      const [oa, a] = fermate[n], [ob, b] = fermate[Math.min(n + 1, fermate.length - 1)], f = ob > oa ? Math.max(0, Math.min(1, (u - oa) / (ob - oa))) : 0
      this.mescola(j * LARG + i, a.map((v, z) => v + (b[z] - v) * f))
    }
  }
  /** Il fotogramma in indici della tavolozza. */
  tavolozza() {
    for (let k = 0; k < this.indici.length; k++) this.indici[k] = colore(this.r[k] | 0, this.g[k] | 0, this.b[k] | 0)
    return this.indici
  }
}
// lo schermino sull'lcd: una bitmap a colori coi pixel del gioco. Intero (la partita grande) ogni pixel del gioco è un pixel
// d'impaginazione; a metà (la pagina della partita) è un pixel VERO dell'lcd (d = 2, come D): tutto il disegno, nitido, in
// un quarto del posto. (A un bit, a metà, quattro pixel diventavano uno, e le scritte dello schermino non si leggevano.)
function disegnaSchermo(l, s, x0, y0, mezzo) {
  const k = mezzo ? 2 : 1
  l.bitmap({ w: LARG / k, h: ALT / k, d: k, px: s.tavolozza() }, x0, y0)
}

// ── i disegnini (11.11), a pixel veri (d = 2): fn(i, j, x, y) dà il colore del pixel vero i, j (x, y dal centro), 0 vuoto;
// 1 è l'inchiostro del bordo, che sulla fascia della riga scelta diventa il fondo ──
const disegnino = (w, h, fn) => {
  const px = new Uint8Array(w * 2 * h * 2)
  for (let j = 0; j < h * 2; j++) for (let i = 0; i < w * 2; i++) px[j * w * 2 + i] = fn(i, j, i + 0.5 - w, j + 0.5 - h)
  return { w, h, d: 2, px }
}
// la fiche: i colori delle fiches fotografate del gioco grande (art/fiches: crema coi segni blu, rossa, verde scura, nera,
// gialla coi segni neri), sei segni sul bordo e il valore in mezzo, un pallino
const FICHE = { 1: ['#eeeedd', '#3366cc'], 5: ['#cc0000', '#ffffff'], 25: ['#006633', '#ffffff'], 100: ['#222222', '#ffffff'], 500: ['#ffcc00', '#000000'] }
const fiche = new Map()
const ficheDi = (v) => {
  if (!fiche.has(v)) {
    const [fondo, segni] = (FICHE[v] ?? FICHE[1]).map(esa)
    fiche.set(v, disegnino(7, 7, (i, j, x, y) => {
      const r = Math.hypot(x, y), a = ((Math.atan2(y, x) / (Math.PI / 3)) % 1 + 1) % 1
      return r > 7 ? 0 : r > 6 ? 1 : (r > 4 && (a < 0.2 || a > 0.8)) || r < 1.8 ? segni : fondo
    }))
  }
  return fiche.get(v)
}
// accanto alla voce della partita: il pallone del gol, il cartellino giallo o rosso
const SEGNI = {
  gol: disegnino(5, 5, (i, j, x, y) => { const r = Math.hypot(x, y); return r > 5 ? 0 : r > 4 ? 1 : r < 1.6 || (Math.abs(r - 3.2) < 0.6 && (i + 2 * j) % 5 === 0) ? C.nero : C.bianco }),
  giallo: disegnino(3, 5, (i, j) => (i === 0 || j === 0 || i === 5 || j === 9 ? 1 : C.giallo)),
  rosso: disegnino(3, 5, (i, j) => (i === 0 || j === 0 || i === 5 || j === 9 ? 1 : C.rosso)),
}
// l'esito di una giocata pagata in un bollino: verde la vinta, rosso la persa, la parola resta (chi distingue male i
// colori). Il testo ha il suo colore, nero sul verde e bianco sul rosso: si legge su ogni sfondo e sulla fascia
const BOLLINO = { vinta: [C.verde, C.nero], persa: [esa('#cc0000'), C.bianco] }

// ── il campionato: la partita di adesso, la fase, il pagamento della finita ──
function campionato(os, avvisa) {
  const suona = (nome) => os.suoni.sigla(nome) // (l'interruttore dei suoni lo guarda os.suoni, non l'app: regola 7.4)
  const c = { corrente: fase(), P: null, voce: '', schermo: new SchermoColori(), ultimoT: performance.now(), evento: null, campo: false, segno: null, suona }
  c.P = partita(c.corrente.indice)
  // (31.10) la fase è cambiata, o si sono chiuse le giocate (CHIUDE prima del fischio: lo dice la banca)
  c.cambiata = (f) => f.indice !== c.corrente.indice || f.fase !== c.corrente.fase || giocateAperte(f) !== giocateAperte(c.corrente)
  c.aggiorna = () => {
    const prima = c.corrente
    c.corrente = fase()
    if (prima.indice !== c.corrente.indice) {
      // la finita la paga la banca: si aspetta la sua risposta e la striscia dice com'è andata
      // (11.11: la banca può metterci qualche secondo; se intanto l'app è chiusa non si suona fuori e non si segna vista:
      // la vinta la dice entrando, con le altre non viste)
      SC.fine(prima.indice).then((r) => { if (!r || os.corrente()?.app !== 'virtual') return; avvisa(r.torna > 0, r.torna > 0 ? `${r.casa}–${r.ospite} ${r.risultato}: +${fmt(r.torna)} $pzk` : `${r.casa}–${r.ospite} ${r.risultato}: niente, stavolta`); if (r.torna > 0) suona('virtual-vinta'); SC.viste() })
      c.P = partita(c.corrente.indice); c.voce = ''
    } else if (prima.fase !== c.corrente.fase && c.corrente.fase === 'partita') { suona('virtual-fischio'); c.voce = '' }
    // (il palinsesto a ogni cambio: le quote della banca, e dal fischio la cronaca)
    if (prima.indice !== c.corrente.indice || prima.fase !== c.corrente.fase) SC.palinsesto()
  }
  // in partita la cronaca è della banca (SC.cronaca la chiede finché non c'è): intanto il secondo zero, il «si comincia»
  c.t = () => (c.corrente.fase === 'partita' ? (c.P.cronaca ? (adesso() - c.P.inizio) / 1000 : 0) : -(c.corrente.manca / 1000))
  /** Un fotogramma dello schermino (e la voce degli eventi). */
  c.fotogramma = () => {
    const f = fase()
    if (c.cambiata(f)) c.aggiorna(); else c.corrente = f
    c.P = c.corrente.fase === 'partita' ? SC.cronaca(c.corrente.indice) : partita(c.corrente.indice) // (con quello che la banca ha detto)
    const now = performance.now(), P = c.P, t = c.t()
    // (11.11) in campo solo se lo schermino ha disegnato il campo: al fischio, finché la cronaca non arriva, disegna ancora
    // l'attesa coi cartelli
    c.campo = c.corrente.fase === 'partita' && !!P.cronaca
    c.schermo.disegna(P, { fase: c.campo ? 'partita' : 'scommesse', t, ridotto: false, dt: Math.min(0.5, (now - c.ultimoT) / 1000) })
    c.ultimoT = now
    const e = c.schermo.evento
    if (e !== c.evento) {
      c.evento = e
      if (e && c.corrente.fase === 'partita') {
        if (e.tipo === 'gol') { suona('virtual-gol'); c.voce = `GOL! ${e.chi.nome} (${P[e.squadra].sigla}) al ${e.minuto}` }
        else if (e.tipo === 'tiro' && e.esito === 'palo') { suona('virtual-palo'); c.voce = `palo di ${P[e.squadra].sigla} al ${e.minuto}!` }
        else if (e.tipo === 'rigore') c.voce = `rigore per ${P[e.squadra].sigla}: ${e.esito}`
        else if (e.tipo === 'rosso') c.voce = `espulso ${e.chi.nome} (${P[e.squadra].sigla})`
        else if (e.tipo === 'giallo') c.voce = `ammonito ${e.chi.nome} (${P[e.squadra].sigla})`
        else if (e.tipo === 'infortunio') c.voce = `${e.chi.nome} esce, entra ${e.entra.nome}`
        else if (e.tipo === 'sospesa') c.voce = `sospesa: ${e.causa}. ${scriviRisultato(P.risultato)}`
        else if (e.tipo === 'intervallo') { suona('virtual-fischio'); c.voce = 'intervallo' }
        else if (e.tipo === 'fine') { suona('virtual-fischio'); c.voce = `finale: ${scriviRisultato(P.risultato)}` }
        // (11.11) il disegno accanto alla voce: il pallone del gol, il cartellino giallo o rosso; vale finché la voce è quella
        // (gli eventi senza voce, come il fallo, non lo toccano: il pallone del gol spariva al fallo dopo)
        if (['gol', 'giallo', 'rosso'].includes(e.tipo)) c.segno = { voce: c.voce, tipo: e.tipo }
      }
    }
  }
  c.tabellone = () => {
    const P = c.P, t = c.t()
    // (la cronaca della banca sta arrivando; 11.11: senza rete diceva «si comincia» per tutto il minuto, e non cominciava
    // niente: come la finestra grande, «aspetto la banca»)
    if (c.corrente.fase === 'partita' && !P.cronaca) return { punti: '0-0', sotto: pzk.serverOnline() === false ? 'la banca non risponde' : c.corrente.t > 3 ? 'aspetto la banca' : 'si comincia' }
    if (c.corrente.fase === 'partita') {
      const pt = punteggioA(P, Math.max(0, t)), sosp = P.eventi.find((e) => e.tipo === 'sospesa' && e.t <= t)
      const mn = sosp ? 'sospesa' : minuto(t).scritta
      return { punti: sosp ? `${P.risultato.casa}-${P.risultato.ospite}` : `${pt.casa}-${pt.ospite}`, sotto: mn === 'INT' ? 'intervallo' : mn === 'FINE' ? 'finale' : `${mn} · ${Math.ceil(c.corrente.manca / 1000)}s` }
    }
    const s = Math.ceil(Math.max(0, c.corrente.manca - CHIUDE) / 1000) // (le giocate chiudono CHIUDE prima del fischio)
    return { punti: 'vs', sotto: giocateAperte(c.corrente) ? `si chiude tra ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `chiuse · fischio tra ${Math.ceil(c.corrente.manca / 1000)}s` }
  }
  return c
}

// ── la partita a schermo intero ──
function grande(os, c) {
  return {
    nome: 'virtual-grande', app: 'virtual', senzaBarra: true,
    tic() { c.fotogramma(); os.ridisegna() },
    disegna(l) { disegnaSchermo(l, c.schermo, Math.round(W / 2 - LARG / 2), Math.round(H / 2 - ALT / 2), false); os.zona(0, 0, W, H, () => os.togli()) },
    tasto(k) { if (k === 'indietro' || k === 'ok' || k === 'su') os.togli(); return true },
  }
}

// ── le pagine ──
let ultima = 0
export function vista(os) {
  let x0 = null, rinviato = null
  // (11.11) la finita pagata mentre è aperta la partita grande: la striscia finiva sotto, coperta, e in 5 secondi spariva
  // senza essere vista; ora aspetta che si torni alle pagine
  const avvisa = (ok, testo) => { if (x0 && os.corrente() !== v) rinviato = [ok, testo]; else x0?.dì(ok, testo) }
  const c = campionato(os, avvisa)
  SC.avvia()
  const stQ = { sel: 0, da: 0 }, stS = { sel: 0, da: 0 }
  const aperte = () => giocateAperte(c.corrente)
  // (sulle quote e sulla schedina il cambio di turno si guarda due volte al secondo: chiude le scommesse, paga la finita)
  const turno = (t) => { if (t % 5) return false; if (c.cambiata(fase())) { c.aggiorna(); return true } return false }
  // le partite finite ad app chiusa: entrando si chiede alla banca, che le paga, e la striscia dice com'è andata: le vinte
  // non ancora viste, o quante sono andate male. (31.10: la risposta arriva dopo: si dice solo se l'app è ancora in cima)
  const scadute = () => SC.riscuoti().then((pagate) => {
    if (os.corrente() !== v) return
    const vinte = SC.daVedere()
    if (vinte.length) { avvisa(true, `${vinte.length > 1 ? `${vinte.length} giocate vinte` : 'una giocata vinta'}: +${fmt(vinte.reduce((a, b) => a + SC.vincitaDi(b), 0))} $pzk`); c.suona('virtual-vinta') }
    else if (pagate.length) avvisa(false, `${pagate.length > 1 ? `${pagate.length} partite finite` : 'la partita è finita'}: niente, stavolta`)
    SC.viste()
  })
  // (11.11) quello che non sta nella striscia si legge intero in un dialogo, come nella miniera: «su una partita al più
  // 10.000 $pzk: ne hai già…» o la galera sparivano a metà
  const dì = (x, ok, testo) => {
    x.dì(ok, testo)
    if ([...txt(testo)].length > 35 && x.qui()) os.dialogo({ titolo: ok ? 'virtual' : 'non si può', testo: txt(testo), icona: 'app-virtual', tasti: ['ok'] })
  }
  const mie = (id) => SC.diPartita(c.corrente.indice).filter((b) => b.id === id && !b.pagata).reduce((a, b) => a + b.puntata, 0)
  // (31.10) la giocata la fa la banca: la rotellina in fondo finché risponde, e intanto nessun'altra richiesta (x.aspetta)
  async function punta(id, x) {
    c.fotogramma()
    if (!aperte()) return x.dì(false, c.corrente.fase === 'scommesse' ? 'giocate chiuse: sulla prossima' : 'in corso: si punta sulla prossima')
    const v = SC.S.fiche, r = await x.aspetta('la banca…', () => SC.punta(c.P, id, v))
    if (!r || !x.qui()) return // (un'altra richiesta in volo, o l'app non è più in cima: regola 8.4)
    // (11.11) col conto la ricarica è il sussidio della banca, non «$pzk finti» (quelli sono dell'ospite)
    if (r.ricaricato) return x.dì(true, pzk.proprietario() === 's' ? `altri ${fmt(pzk.INIZIALE)} $pzk finti: punta` : 'arriva il sussidio: punta')
    // (11.11) il perché vero lo dice pzk.nonBasta: in galera o coi soldi sporchi diceva «non ti bastano: hai 73.500 $pzk»
    if (!r.ok) return dì(x, false, r.motivo === 'secco' ? pzk.perche() || 'hai finito i $pzk' : r.motivo === 'chiuse' ? 'giocate chiuse: sulla prossima' : r.motivo === 'banca' ? r.errore : pzk.nonBasta())
    c.suona('virtual-fiche')
    c.voce = `${PER_PUNTATA.get(id).nome} a ${q(r.quota)}: se va, ${fmt(Math.round(r.puntata * r.quota * 2) / 2)} $pzk`
    x.dì(true, `${fmt(v)} su ${PER_PUNTATA.get(id).nome} a ${q(r.quota)}`)
  }
  async function togli(x) {
    if (!aperte()) return x.dì(false, c.corrente.fase === 'scommesse' ? 'le giocate sono chiuse' : 'la partita è in corso')
    const t = await x.aspetta('la banca…', () => SC.togli(c.corrente.indice))
    if (!t || !x.qui()) return
    dì(x, t.ok, t.ok ? `tolta la fiche da ${fmt(t.v)}` : t.errore)
  }
  const pPartita = {
    nome: 'la partita', icona: 'app-virtual',
    aiuto: '↓ la guardi grande · ←→ pagine',
    tic: (t) => { c.fotogramma(); return true }, // (lo schermino si muove sempre)
    disegna(l, x) {
      const P = c.P, tb = c.tabellone()
      disegnaSchermo(l, c.schermo, 8, 34, true, c.campo); l.riquadro(7, 33, LARG / 2 + 2, ALT / 2 + 2)
      x.zona(7, 33, LARG / 2 + 2, ALT / 2 + 2, () => os.spingi(grande(os, c)))
      const xd = 8 + LARG / 2 + 8, n = Math.floor((245 - xd) / 6)
      l.testo(xd, 34, corto(`${P.casa.sigla} - ${P.ospite.sigla}`, n))
      l.testo(xd, 45, tb.punti, { scala: 2 })
      l.testo(xd, 62, corto(tb.sotto, n))
      l.testo(xd, 72, corto(`${P.casa.citta}: ${METEO[P.meteo.tipo] ?? ''}, ${P.meteo.temp}°`, n))
      // (11.11: due righe, e se non basta «…» in fondo: «sospesa: la squadra di casa è rimasta chiusa negli spogliatoi. 3–0 a
      // tavolino» perdeva la coda senza segno)
      const vv = Lcd.acapo(txt(c.voce || `${P.casa.nome} contro ${P.ospite.nome}`), n)
      ;[vv[0], vv.length > 2 ? corto(vv.slice(1).join(' '), n) : vv[1]].forEach((r, i) => r && l.testo(xd, 84 + i * 9, r))
      const sg = c.segno?.voce === c.voce ? SEGNI[c.segno.tipo] : null // (fra lo schermino e la voce: il pallone, il cartellino)
      if (sg) l.bitmap(sg, xd - sg.w - 1, 85)
      l.testo(10, 104, corto(`forze ${P.forze.casa}-${P.forze.ospite} · 1 ${q(P.quote['1'])}  X ${q(P.quote.X)}  2 ${q(P.quote['2'])}`, 39)) // (sotto la telecronaca, non addosso)
    },
    tasto(k) { if (k === 'giu') { os.spingi(grande(os, c)); return true } return false },
  }
  const vociQuote = () => [{ fiche: true }, ...PUNTATE.map((p) => ({ p })), { togli: true }]
  // la fiche: sulla sua riga ← → la cambiano (il ▶ accanto al valore dice il vero: regola 3.3), OK la gira in avanti
  const giraFiche = (d) => { const F = pzk.FICHES, i = Math.max(0, F.indexOf(SC.S.fiche)); SC.S.fiche = F[(i + d + F.length) % F.length]; os.ridisegna() }
  const pQuote = {
    nome: 'le quote', icona: 'pzk',
    // (il suggerimento della riga scelta: sull'ultima OK toglie, non punta)
    aiuto: () => (stQ.sel === 0 ? '←→ o OK cambia la fiche · ↑↓' : !aperte() ? (c.corrente.fase === 'scommesse' ? 'giocate chiuse: sulla prossima' : 'in corso: si punta sulla prossima') : vociQuote()[stQ.sel]?.togli ? 'OK toglie l’ultima · ↑↓ · ←→ pagine' : 'OK punta · ↑↓ · ←→ pagine'),
    ok: (x) => {
      const v = vociQuote()[stQ.sel]
      if (v.fiche) return giraFiche(1)
      if (v.togli) return togli(x)
      punta(v.p.id, x)
    },
    disegna(l, x) {
      const sul = SC.sulTavolo(c.corrente.indice)
      l.testo(10, 34, corto(`hai ${pzk.fmtCorto(pzk.saldo())} $pzk${sul ? ` · sulla partita ${fmt(sul)}` : ''}`, 39))
      elenco(l, x.zona, {
        voci: vociQuote(), stato: stQ, y0: 44, alta: 72, passo: 12,
        clic: () => pQuote.ok(x),
        riga(l, v, xx, y, w, on) {
          const o = { inv: on }
          if (v.fiche) { // (scelta: il valore fra ◀ ▶, che si cliccano; le zone dopo quella della riga, così vincono)
            const s = on ? `◀ ${fmt(SC.S.fiche)} ▶` : fmt(SC.S.fiche), ws = Lcd.larghezza(s)
            l.testo(xx, y + 2, 'la fiche', o); destra(l, xx + w, y + 2, s, o)
            l.bitmap(ficheDi(SC.S.fiche), xx + w - ws - 10, y + 2, o) // (11.11: la fiche disegnata, coi colori della sua)
            if (on) { x.zona(xx + w - ws - 2, y, 10, 11, () => giraFiche(-1)); x.zona(xx + w - 8, y, 10, 11, () => giraFiche(1)) }
            return
          }
          if (v.togli) { l.testo(xx, y + 2, 'togli l’ultima fiche', o); return }
          const m = mie(v.p.id), qq = q(partita(c.corrente.indice).quote[v.p.id]) // (11.11: con le quote della banca appena arrivate: c.P lo rinfresca solo lo schermino)
          destra(l, xx + w, y + 2, qq, o)
          l.testo(xx, y + 2, corto(`${v.p.nome}${m ? ` · ${fmt(m)} sopra` : ''}`, 17), o) // (11.11: 17, non 18: «5 sop…meno di» toccava la colonna dopo)
          l.testo(xx + 108, y + 2, corto(v.p.dice, Math.floor((w - 108 - Lcd.larghezza(qq) - 6) / 6)), o)
        },
      })
    },
    tic: turno,
    tasto(k) {
      if ((k === 'sx' || k === 'dx') && stQ.sel === 0) { giraFiche(k === 'sx' ? -1 : 1); return true } // (sulle altre righe ← → sfogliano)
      return muovi(stQ, vociQuote().length, k)
    },
  }
  const pSchedina = {
    nome: 'la schedina', icona: 'app-quiz',
    aiuto: () => (SC.S.schedina.length ? '↑↓ scorre · ←→ pagine' : '←→ pagine'), // (11.11: vuota, ↑↓ non scorrono niente)
    disegna(l, x) {
      const L = [...SC.S.schedina].reverse().slice(0, 30)
      if (!L.length) { centro(l, 60, 'la schedina è vuota:'); centro(l, 70, 'punta dalle quote'); return }
      elenco(l, x.zona, {
        voci: L, stato: stS, y0: 33, alta: 84, passo: 20,
        riga(l, b, xx, y, w, on) {
          const o = { inv: on }, pu = PER_PUNTATA.get(b.id), qui = b.indice === c.corrente.indice, v = SC.vincitaDi(b)
          const esito = b.pagata ? (b.esito === 'vinta' ? `+${fmt(v)}` : 'persa') : qui && c.corrente.fase === 'partita' ? 'in corso' : `→ ${fmt(v)}`
          const bo = b.pagata ? BOLLINO[b.esito === 'vinta' ? 'vinta' : 'persa'] : null
          if (bo) { const we = Lcd.larghezza(esito); l.riempi(xx + w - we - 2, y + 1, we + 3, 9, bo[0]); destra(l, xx + w, y + 2, esito, { col: bo[1] }) } else destra(l, xx + w, y + 2, esito, o)
          l.testo(xx, y + 2, corto(`${b.casa}-${b.ospite}${b.risultato ? ` ${b.risultato}` : ''}`, Math.floor((w - Lcd.larghezza(esito) - 6) / 6)), o)
          l.testo(xx + 6, y + 11, corto(`${pu?.nome ?? b.id} @ ${q(b.quota)} · ${fmt(b.puntata)} $pzk`, Math.floor((w - 6) / 6)), o)
        },
      })
    },
    tic: turno,
    tasto(k) { return muovi(stS, Math.min(30, SC.S.schedina.length), k) },
  }
  const v = pagine(os, {
    nome: 'virtual', app: 'virtual', iniziale: ultima,
    pagine: [pPartita, pQuote, pSchedina],
    ascolta: [(f) => SC.ascolta(f), (f) => pzk.ascolta(f)],
    entra: (x) => { x0 = x; if (rinviato) { x.dì(...rinviato); rinviato = null } c.aggiorna(); SC.palinsesto(); scadute() },
    esci: (x) => { ultima = x.pag },
  })
  return v
}
