// L'app «pzkstore» di pzk os (29.10, Alberto: «crea uno alla volta shop, pzkstore, …»): il negozio delle app del cercapersone
// zero. Il catalogo, i prezzi, l'acquisto e la rimozione sono quelli del pzkstore vecchio (telefono/app/pzkstore.js:
// CATALOGO, compra, togli, regalata): coi $pzk PULITI alla cassa di pzk, in galera non si compra, si toglie senza rimborso.
// L'app comprata compare subito nel menu (telefono.js rifà la lista quando lo zaino cambia).
// - LA VETRINA: due righe per dire cos'è, le app (icona, nome, una riga, il prezzo o «installata», «!» se ti servirebbe),
//   sotto quanti puliti hai. OK apre la scheda.
// - LA SCHEDA: l'icona grande, il nome, il genere e la versione, lo stato; il testo intero che scorre con ↑ ↓ (cosa fa, in
//   breve, come si usa, cosa serve, le novità, togliere); sotto i tasti: compra e scarica, o apri e togli. Comprare e togliere
//   si confermano.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { CATALOGO, PER_ID, compra, togli, regalata } from '../../app/pzkstore.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni } from './pezzi.js'

const fmt = (n) => pzk.fmt(n)
const ROMA = { timeZone: 'Europe/Rome' }
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { ...ROMA, hour: '2-digit', minute: '2-digit' })
const giorno = (t) => new Date(t).toLocaleDateString('it-IT', { ...ROMA, day: 'numeric', month: 'short', year: 'numeric' })
const ilGiorno = (t) => { const g = giorno(t); return /^(8|11) /.test(g) ? `l’${g}` : `il ${g}` } // (11.11: «installato il 11 nov», e si dice «l’11»)
const fatta = (x) => (x.f ? 'installata' : 'installato')
const la = (x) => (x.f ? 'la' : 'lo')
const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-pzkstore', lato)
/** Le app: prima quelle da scaricare, poi le tue (come la vetrina vecchia). */
const ordinate = () => [...CATALOGO.filter((x) => !zaino.installata(x.id)), ...CATALOGO.filter((x) => zaino.installata(x.id))]

// (11.11) quello che la banca sta facendo, per app: con INDIETRO a metà di «compro…» la scheda riaperta non lo vedeva e lasciava
// partire un secondo acquisto della stessa app; ora la rotellina c'è anche lì, e OK aspetta
const inCorso = new Map()

// (11.11) il perché di un no: nella striscia ci stanno 35 lettere, e «costa 5000 $pzk puliti e ne hai 10…» si tagliava proprio
// sui soldi; se non ci sta, si dice intero in un dialogo
function dìNo(os, dì, { titolo, icona, testo }) {
  const s = txt(testo)
  if ([...s].length <= 35) return dì(false, s)
  os.suoni.bip('pagerGiu')
  return os.dialogo({ titolo, icona, testo: s, tasti: ['ok'] })
}
/** Com'è andata, detto da chi c'è: ok → la sigla (se la vuole) e la striscia; no → dìNo. */
const racconta = (os, dì, e) => (e.ok ? (e.sigla && os.suoni.sigla('pzkstore'), dì(true, e.testo)) : dìNo(os, dì, e))

// ── la scheda di un'app ──
function scheda(os, x) {
  let giu = 0, sel = 0, esito = null
  const attesa = () => inCorso.get(x.id) ?? null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  // (11.11) la risposta della banca va a chi c'è adesso: questa scheda, la scheda della stessa app riaperta, o la vetrina. Con
  // INDIETRO a metà di «compro…» il no si perdeva: la vetrina e la scheda riaperta non dicevano niente, e l'app restava da comprare
  const chi = () => { const q = os.corrente(); return q?.app === 'pzkstore' && (q.per === x.id || (q.annuncia && !q.per)) ? q : null } // (la vetrina: annuncia e nessun per)
  // (11.11) mentre la banca compra o toglie, in fondo la rotellina (REGOLE 8.6): prima non si vedeva niente
  async function banca(cosa, fai) {
    inCorso.set(x.id, cosa); esito = null; os.ridisegna()
    try { return await fai() } finally { inCorso.delete(x.id); os.ridisegna() }
  }
  const tua = () => zaino.installata(x.id)
  const testo = () => impagina([
    ...(!tua() && x.utile() ? [{ testo: x.perche() }] : []),
    ...x.cosa.map((t) => ({ testo: t })),
    { titolo: 'in breve' }, ...x.punti.map((t) => ({ punto: t })),
    { titolo: 'come si usa' }, ...x.come.map((t, i) => ({ passo: i + 1, testo: t })),
    { titolo: 'cosa serve' }, { testo: x.serve },
    { titolo: `novità · versione ${x.versione} del ${x.del}` }, { testo: x.novita },
    ...(tua() ? [{ titolo: 'togliere l’app' }, { testo: `sparisce dal menu. Niente rimborso: i ${fmt(x.prezzo)} $pzk sono della cassa di pzk, e per riaver${la(x)} ${la(x)} ricompri a prezzo pieno.` }] : []),
  ])
  const tasti = () => (tua() ? [`apri ${x.nome.toLowerCase()}`, 'togli'] : [x.prezzo ? `compra e scarica · ${fmt(x.prezzo)}` : 'scarica · gratis'])
  // (31.10) comprare e togliere sono azioni della banca (app/pzkstore.js): una alla volta, niente doppi acquisti
  let occupato = false
  async function premi(i) {
    if (occupato || inCorso.has(x.id)) return
    occupato = true
    try { await fai(i) } finally { occupato = false }
  }
  async function fai(i) {
    const b = tasti()[i]
    if (b === 'togli') {
      const r = await os.dialogo({ titolo: 'la togli?', icona: x.icona, testo: `${x.nome} sparisce dal menu. Niente rimborso: per riaver${la(x)} ${la(x)} ricompri a ${fmt(x.prezzo)} $pzk.`, tasti: ['no', 'togli'] })
      if (r !== 'togli' || os.corrente() !== v) return
      const e = await banca('tolgo…', () => togli(x.id))
      return chi()?.annuncia(e.ok ? { ok: true, testo: `${x.nome} ${x.f ? 'tolta' : 'tolto'} dal cercapersone` } : { ok: false, titolo: 'non si toglie', icona: x.icona, testo: e.errore })
    }
    if (b.startsWith('apri')) return os.apri(x.id)
    // compra: si conferma
    const r = await os.dialogo({ titolo: 'compri?', icona: x.icona, testo: x.prezzo ? `${x.nome} per ${fmt(x.prezzo)} $pzk puliti, una volta sola. Ne hai ${fmt(pzk.puliti())}.` : `${x.nome}, gratis.`, tasti: ['no', 'sì'] })
    if (r !== 'sì' || os.corrente() !== v) return
    const e = await banca('compro…', () => compra(x.id))
    return chi()?.annuncia(e.ok ? { ok: true, testo: `${x.nome} ${fatta(x)}: è nel menu`, sigla: true } : { ok: false, titolo: 'non si compra', icona: x.icona, testo: e.errore })
  }
  const v = {
    nome: 'pzkstore-scheda', app: 'pzkstore', per: x.id,
    annuncia(e) { sel = 0; return racconta(os, dì, e) }, // (comprata o tolta, i tasti cambiano: si riparte dal primo)
    entra() { v.via = [pzk.osserva(() => os.ridisegna()), zaino.ascolta(() => os.ridisegna())] },
    esci() { v.via?.forEach((f) => f()) },
    tic() { if (attesa()) os.ridisegna(); else if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } }, // (la rotellina gira)
    disegna(l, t) {
      l.bitmap(bm(x.icona, 32), 8, 14)
      l.testo(46, 15, corto(x.nome, 33), {})
      l.testo(46, 24, corto(`pzkstore · ${x.genere} · versione ${x.versione}`, 33))
      const stato = tua()
        ? `✓ ${fatta(x)}${regalata(x.id) ? ` · ${x.f ? 'regalata' : 'regalato'}` : zaino.installataIl(x.id) > 1e12 ? ` ${ilGiorno(zaino.installataIl(x.id))}` : ''}` // (11.11: un segno vecchio, «1», diceva «il 1 gen 1970»)
        : x.prezzo ? `${fmt(x.prezzo)} $pzk puliti` : 'gratis'
      l.testo(46, 33, corto(stato, 33))
      l.testo(46, 42, corto(pzk.inGalera() ? `in galera fino alle ${ora(pzk.galera())}: chiuso` : `hai ${fmt(pzk.puliti())} $pzk puliti`, 33)) // (33 lettere: «…: non vende» si tagliava)
      giu = scorrevole(l, testo(), { y0: 52, vis: 5, giu })
      const T = tasti()
      bottoni(l, os.zona, { etichette: T, sel: sel < T.length ? sel : 0, y: 99, premi: (i) => { sel = i; premi(i) } }) // (disegna non cambia sel: lo tiene a posto tasto, 4.8)
      if (!striscia(l, { esito, attesa: attesa() }, t)) centro(l, H - 9, T.length > 1 ? '←→ sceglie · OK preme · ↑↓ legge' : 'OK preme · ↑↓ legge')
    },
    tasto(k) {
      const n = tasti().length
      if (sel >= n) sel = 0 // (comprata o tolta, i tasti cambiano)
      if (k === 'sx') sel = (sel - 1 + n) % n
      else if (k === 'dx') sel = (sel + 1) % n
      else if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu++
      else if (k === 'ok') premi(sel)
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── la vetrina ──
export function vista(os) {
  const st = { sel: 0, da: 0 }
  let qui = null // (la x di pagine, per la striscia: la dà entra)
  const v = pagine(os, {
    nome: 'pzkstore', app: 'pzkstore',
    entra: (x) => { qui = x },
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
    pagine: [{
      nome: 'pzkstore', icona: 'app-pzkstore', aiuto: 'OK apre la scheda · ↑↓ sceglie',
      disegna(l, x) {
        const intro = pzk.inGalera()
          ? `in galera fino alle ${ora(pzk.galera())}: non vende. Si esce con la cauzione: app rapina.` // (due righe: la cauzione non si perdeva più)
          : 'app in più: si pagano una volta coi $pzk puliti e restano tue.'
        const R = Lcd.acapo(intro, 39)
        R.slice(0, 2).forEach((r, i) => l.testo(10, 34 + i * 9, i === 1 && R.length > 2 ? corto(`${r}…`, 39) : r)) // (se mai non ci sta, almeno i «…»)
        // (11.11) il cursore per chiave (REGOLE 3.12): comprata un'app, la vetrina la mette in fondo, e tornando dalla scheda
        // la riga scelta era diventata l'altra app; ora resta su quella di prima
        const L = ordinate(), k = L.findIndex((a) => a.id === st.id)
        if (k >= 0) st.sel = k
        elenco(l, x.zona, {
          voci: L, stato: st, y0: 54, alta: 40, passo: 20,
          clic: (a) => { st.id = a.id; os.spingi(scheda(os, a)) },
          riga(l, a, x0, y, w, on) {
            const o = { inv: on }, tua = zaino.installata(a.id), serve = !tua && a.utile()
            l.bitmap(bm(a.icona, 16), x0 - 2, y + 2, o)
            const val = inCorso.get(a.id) ?? (tua ? fatta(a) : a.prezzo ? fmt(a.prezzo) : 'gratis') // (11.11: «compro…» anche qui, uscito dalla scheda a metà)
            destra(l, x0 + w, y + 2, val, o)
            l.testo(x0 + 18, y + 2, corto(`${serve ? '! ' : ''}${a.nome}`, Math.floor((w - 18 - Lcd.larghezza(val) - 8) / 6)), o)
            l.testo(x0 + 18, y + 11, corto(serve ? a.perche() : a.breve, Math.floor((w - 18) / 6)), o)
          },
        })
        const s = pzk.sporchi()
        l.orizz(8, 95, W - 16) // (11.11: tre righe più su, gli sporchi toccavano il suggerimento in fondo)
        l.testo(10, 98, corto(`${CATALOGO.length} app · hai ${fmt(pzk.puliti())} $pzk puliti`, 39))
        if (s > 0) l.testo(10, 107, corto(`i ${fmt(s)} sporchi qui non valgono`, 39))
      },
      tasto(k) {
        if (muovi(st, CATALOGO.length, k)) { st.id = ordinate()[st.sel]?.id; return true }
        if (k === 'ok') { const a = ordinate()[st.sel]; if (a) { st.id = a.id; os.spingi(scheda(os, a)) } return true }
        return false
      },
    }],
  })
  // aperto con un comando (os.apri('pzkstore', { comando: 'lavatrice' }): la rapina riuscita che porta alla lavatrice), si apre
  // la scheda di quell'app
  v.comando = (id) => { const a = PER_ID[id]; if (a && os.corrente() === v) { st.id = a.id; os.spingi(scheda(os, a)) } }
  // (11.11) la risposta della banca arrivata dopo INDIETRO dalla scheda: si dice qui
  v.annuncia = (e) => qui && racconta(os, (ok, t) => qui.dì(ok, t), e)
  return v
}
