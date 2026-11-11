// L'app «shop» di pzk os (29.10, Alberto: «crea uno alla volta shop, pzkstore, … falle tutte maniacalmente perfette»): lo
// shop dei $pzk sul cercapersone zero. La logica è quella dello shop del cercapersone vecchio (telefono/app/negozio.js: la
// scelta dei prodotti, il pagamento, il conto alla rovescia, lo stesso carrello e gli stessi preferiti) e della chat
// (chat/testi.js, chat/oggetti.js, chat/mercato.js): quello che compri qui lo trovi nello zaino e viceversa.
// - LE PAGINE (← →): le offerte del giorno (finiscono a mezzanotte), tutto lo shop, i cinque reparti, il carrello. In cima a
//   ogni lista la riga dell'ordine (OK: le opzioni); scrivendo dalla tastiera si cerca (⌫ cancella, INDIETRO toglie la ricerca).
// - LA SCHEDA: l'icona grande, il prezzo (barrato e scontato in offerta), la descrizione che scorre con ↑ ↓, i bonus; sotto i
//   tasti ♥ − + carrello compra (← → li scelgono). Comprare si conferma; poi lo scontrino, che si stampa riga per riga.
// - IL CARRELLO: le righe (OK: togli, una in meno, una in più), paga (si conferma), svuota.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C, esa } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { PER_ID } from '../../../chat/testi.js'
import { REPARTI, testoBonus } from '../../../chat/oggetti.js'
import * as mercato from '../../../chat/mercato.js'
import { prodotti, ORDINI, CHIAVE_CARRELLO, CHIAVE_PREF, contoAllaRovescia, compraRighe } from '../../app/negozio.js'
import { txt, corto, destra, centro, puntini, elenco, muovi, pagine, striscia } from './pezzi.js'

// ── il carrello e i preferiti: gli stessi dello shop vecchio (localStorage), letti ogni volta ──
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const carrello = () => leggi(CHIAVE_CARRELLO, {})
const righeCarrello = () => Object.entries(carrello()).filter(([id, n]) => PER_ID[id] && n > 0 && !ce(PER_ID[id])) // (11.11: un pezzo unico comprato dalla scheda restava nel carrello: la banca lo salta, ma il totale lo contava e «paga» diceva «ti mancano»)
const pezzi = () => righeCarrello().reduce((a, [, n]) => a + n, 0)
const totale = () => righeCarrello().reduce((a, [id, n]) => a + mercato.prezzoDi(PER_ID[id]) * n, 0)
const risparmio = () => righeCarrello().reduce((a, [id, n]) => a + (PER_ID[id].prezzo - mercato.prezzoDi(PER_ID[id])) * n, 0)
const metti = (id, n) => { const c = carrello(); if (n > 0) c[id] = Math.min(50, n); else delete c[id]; scrivi(CHIAVE_CARRELLO, c) }
const preferiti = () => new Set(leggi(CHIAVE_PREF, []))
const cuore = (id) => { const p = preferiti(); if (p.has(id)) p.delete(id); else p.add(id); scrivi(CHIAVE_PREF, [...p]) }
const fmt = (n) => pzk.fmt(n)
const pct = (s) => `-${Math.round(s * 100)}%`
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
// la cassa (la banca, 'chat.carrello') prende solo i $pzk puliti e in galera non vende: qui si conta come lei, non col saldo
const puliti = () => pzk.puliti()
const pul = () => (pzk.sporchi() > 0 ? ' puliti' : '') // (detto solo se ci sono anche gli sporchi)
/** Perché non si possono spendere t $pzk (null: si può). */
const nonPuoi = (t) => (pzk.inGalera() ? `in galera fino alle ${ora(pzk.galera())}` : t > puliti() ? `ti mancano ${fmt(t - puliti())} $pzk${pul()}` : null)
/** Un'icona sempre: quella del prodotto (webp di Alberto, arriva dopo: icone.ascolta ridisegna), intanto quella dello shop. */
const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-shop', lato)
const ce = (x) => x.unico && zaino.ha(x.id)

// ── i colori (11.11, Alberto: «fai colori a 8bit su tutto»): pochi e con un senso. Il testo resta d'inchiostro; quello che è
// colorato (lo sconto, i soldi che mancano, i risparmi) è un cartellino col testo bianco, che si legge su tutti gli sfondi
// (rosso o verde chiaro su «arancione» spariva); il cuore dei preferiti è rosso; lo scontrino è un foglio di carta col testo
// nero, come uno vero ──
const ROSSO = esa('#cc0000'), VERDE = esa('#006600'), CARTA = esa('#ffffcc'), NERO = C.nero, GRIGIO = esa('#999999')
/** Un cartellino: la fascia del colore attorno al testo (un pixel d'aria), il testo bianco. → la larghezza */
function cartellino(l, x, y, s, fondo) { const w = Lcd.larghezza(s) + 4; l.riempi(x, y - 1, w, 9, fondo); l.testo(x + 2, y, s, { col: C.bianco }); return w }
const largoCart = (s) => Lcd.larghezza(s) + 4

// le scelte della vetrina: restano finché la pagina è aperta
let ordine = 'top', solo = false, cerca = '', ultima = 0

/** (11.11, REGOLE 3.12: il cursore si ricorda per chiave) Se la lista cambia (l'ordine, «posso comprarli», un pezzo tolto dal
 *  carrello) il cursore resta sulla stessa voce, o torna alla prima: prima restava al posto e finiva su un'altra (o su «paga»). */
const chiaveDi = (vc) => (vc.opz ? 'opz' : vc.paga ? 'paga' : vc.svuota ? 'svuota' : vc.id)
function segui(st, L) {
  if (st.chiave != null) { const i = L.findIndex((vc) => chiaveDi(vc) === st.chiave); st.sel = i >= 0 ? i : 0 }
  st.chiave = L[st.sel] ? chiaveDi(L[st.sel]) : null
}

/** Mette nel carrello; → il testo per la striscia. */
function aggiungi(x, n) {
  if (ce(x)) return [false, 'ce l’hai già nello zaino']
  const prima = carrello()[x.id] ?? 0
  if (!x.unico && prima >= 50) return [false, 'nel carrello ce ne sono già 50'] // (11.11: diceva «nel carrello» e non aggiungeva niente)
  metti(x.id, x.unico ? 1 : Math.min(50, prima + n))
  const coda = ` nel carrello (${pezzi()} pezz${pezzi() === 1 ? 'o' : 'i'})`
  return [true, corto(x.nome, Math.max(8, 35 - [...coda].length)) + coda] // (11.11: la striscia tiene 35 lettere, e un nome lungo tagliava via «nel carrello»)
}

// ── lo scontrino: si stampa una riga alla volta ──
function scontrino(os, s, alla) {
  let stampate = 0
  const righe = [...s.righe.map((r) => ({ a: `${r.n} × ${PER_ID[r.id]?.nome ?? r.id}`, b: fmt(r.tot) })), ...(s.risparmio ? [{ a: 'sconti di oggi', b: `-${fmt(s.risparmio)}`, risp: true }] : [])]
  const VIS = 4 // (11.11: ?.nome: un id della banca che il catalogo non ha più rompeva lo scontrino dopo aver pagato)
  const v = {
    nome: 'negozio-scontrino', app: 'negozio',
    entra() { os.suoni.sigla('negozio') },
    tic(t) { if (stampate < righe.length + 3 && t % 2 === 0) { stampate++; os.suoni.bip('cursore'); return os.ridisegna() } },
    disegna(l) {
      centro(l, os.BARRA + 3, 'pzk shop')
      centro(l, os.BARRA + 12, new Date(s.t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      // (11.11) il foglio dello scontrino: carta chiara col testo nero, che si allunga mentre si stampa; la carta e il nero
      // non dipendono dallo sfondo, così si legge anche su «notte», e un bordo grigio lo stacca da «carta»
      const r0 = os.BARRA + 25, nr = Math.min(stampate, VIS) + (righe.length > VIS && stampate > VIS ? 1 : 0)
      const yt = r0 + (Math.min(righe.length, VIS) + (righe.length > VIS ? 1 : 0)) * 9 + 2
      const fondo = stampate > righe.length + 2 ? yt + 31 : stampate > righe.length + 1 ? yt + 22 : stampate > righe.length ? yt + 12 : r0 + nr * 9 + 1
      const y0 = os.BARRA + 20, xa0 = 10, xa1 = W - 10
      l.riempi(xa0, y0, xa1 - xa0, fondo - y0, CARTA); l.vert(xa0, y0, fondo - y0, GRIGIO); l.vert(xa1 - 1, y0, fondo - y0, GRIGIO)
      for (let x = xa0; x < xa1; x += 4) l.riempi(x, fondo, 2, 1, CARTA) // (lo strappo, a dentini)
      const tratto = (y) => { for (let x = 12; x < W - 12; x += 4) l.riempi(x, y, 2, 1, GRIGIO) }
      tratto(os.BARRA + 22) // il tratteggio dello scontrino
      const riga = (y, a, b, cb = NERO) => { // (puntini di pezzi.js, col nero della carta: l'inchiostro su «notte» è chiaro)
        const x0 = 14, x1 = 241, xa = x0 + Lcd.larghezza(a) + 4, xb = x1 - Lcd.larghezza(b) - 4
        l.testo(x0, y, a, { col: NERO }); for (let x = xa; x < xb; x += 3) l.px(x, y + 6, GRIGIO); destra(l, x1, y, b, { col: cb })
      }
      const mostra = righe.slice(0, Math.min(stampate, VIS))
      mostra.forEach((r, i) => riga(r0 + i * 9, corto(r.a, 28), r.b, r.risp ? VERDE : NERO)) // (gli sconti, verdi: soldi risparmiati)
      if (righe.length > VIS && stampate > VIS) l.testo(14, r0 + VIS * 9, corto(righe.length - VIS === 1 ? 'e un’altra riga' : `e altre ${righe.length - VIS} righe`, 37), { col: NERO }) // (11.11: «e altre 1 righe»)
      if (stampate > righe.length) { tratto(yt); riga(yt + 3, 'TOTALE $PZK', fmt(s.tot)) }
      if (stampate > righe.length + 1) centro(l, yt + 13, corto(`saldo: ${fmt(pzk.saldo())} $pzk`, 38), { col: NERO })
      if (stampate > righe.length + 2) centro(l, yt + 22, 'grazie, e arrivederci', { col: NERO })
      const a = 'OK continua · → apre lo zaino', xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
      l.testo(xa, H - 9, a)
      os.zona(xa - 3, H - 11, Lcd.larghezza('OK continua') + 6, 11, () => alla())
      os.zona(xa + Lcd.larghezza('OK continua · ') - 3, H - 11, Lcd.larghezza('→ apre lo zaino') + 6, 11, () => { alla(); os.apri('zaino') })
    },
    tasto(k) {
      if (k === 'ok' || k === 'indietro') alla()
      else if (k === 'dx') { alla(); os.apri('zaino') }
      else return false
      return true
    },
  }
  return v
}

// ── la scheda di un prodotto ──
function scheda(os, x, alla, avvisa = () => {}) {
  let n = 1, giu = 0, sel = -1, esito = null, attesa = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 4000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const tot = () => mercato.prezzoDi(x) * (x.unico ? 1 : n)
  const bottoni = () => (ce(x) ? ['♥'] : x.unico ? ['♥', 'carrello', `compra ${fmt(tot())}`] : ['♥', '−', '+', 'carrello', `compra ${fmt(tot())}`])
  const tieni = () => { const nb = bottoni().length; if (sel < 0 || sel >= nb) sel = nb - 1 } // (di partenza, o se i tasti sono diventati meno: compra)
  const reparto = REPARTI.find(([id]) => id === x.reparto)
  const desc = () => { const b = testoBonus(x.bonus), d = x.tipo === 'usa' && x.effetto ? `per ${Math.round(x.effetto / 60000)} minuti` : x.unico ? 'finché ce l’hai' : ''; return Lcd.acapo(txt(`${x.cosa}${b ? `\n${b}${d ? ` · ${d}` : ''}` : ''}`), 37) } // (37: a destra ci sono le frecce ↑ ↓)
  async function premi(b) {
    if (b === '♥') { cuore(x.id); return dì(true, preferiti().has(x.id) ? 'nei preferiti' : 'tolto dai preferiti') }
    if (b === '−') { n = Math.max(1, n - 1); return os.ridisegna() }
    if (b === '+') { if (n >= 50) return dì(false, 'al più 50 alla volta'); n++; return os.ridisegna() } // (11.11: a 50 non faceva niente e non diceva perché)
    if (b === 'carrello') { const [ok, t] = aggiungi(x, n); return dì(ok, t) }
    // compra ora: si conferma
    const no = nonPuoi(tot())
    if (no) return dì(false, no)
    const m = x.unico ? 1 : n
    const r = await os.dialogo({ titolo: 'compri?', icona: x.id, testo: `${m} × ${x.nome} per ${fmt(tot())} $pzk. Ne hai ${fmt(puliti())}${pul()}.`, tasti: ['no', 'sì'] })
    if (r !== 'sì' || os.corrente() !== v || attesa) return
    // (11.11: mentre la banca risponde, la rotellina e i tasti fermi: prima un secondo OK rifaceva il dialogo e comprava due volte)
    attesa = 'compro…'; esito = null; os.ridisegna()
    let s
    try { s = await compraRighe([[x.id, m]]) } finally { attesa = null; os.ridisegna() } // (comprando subito, il carrello resta com'è; 31.10: compra la banca)
    const male = s.manca ? `ti mancano ${fmt(s.manca)} $pzk` : s.errore ? s.errore : !s.righe.length ? 'ce l’hai già' : null
    // (11.11: uscito mentre comprava: os.togli qui sotto toglieva la vetrina al posto della scheda. E con INDIETRO a metà la
    // banca comprava lo stesso senza dirlo: ora l'esito va nella striscia della vetrina, se è lei in cima)
    if (os.corrente() !== v) return avvisa(!male, male ?? `comprato: ${m} × ${corto(x.nome, 22)}`)
    if (male) return dì(false, male)
    os.togli()
    os.spingi(scontrino(os, s, alla))
  }
  const v = {
    nome: 'negozio-scheda', app: 'negozio',
    entra() { v.via = [pzk.osserva(() => os.ridisegna()), zaino.ascolta(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())]; tieni() },
    esci() { v.via?.forEach((f) => f()) },
    tic() { if (attesa) os.ridisegna(); else if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } }, // (la rotellina gira solo mentre si aspetta)
    disegna(l, t) {
      const B = bottoni(), sb = sel >= 0 && sel < B.length ? sel : B.length - 1 // (disegna non cambia sel: 4.8; i tasti possono essere diventati meno, comprando un pezzo unico)
      // la testa: l'icona grande, il nome, il reparto, il prezzo, quanti ne hai
      l.bitmap(bm(x.id, 32), 8, 14)
      l.testo(46, 15, corto(x.nome, 33))
      const pref = preferiti().has(x.id), r2 = `${reparto ? reparto[1] : ''}${x.tipo === 'usa' ? ' · da usare' : x.tipo === 'cassa' ? ' · cassa' : x.unico ? ' · da tenere' : ''}`
      const xr = l.testo(46, 24, corto(pref ? `${r2} · ` : r2, pref ? 31 : 33))
      if (pref) l.testo(46 + xr + 1, 24, '♥', { col: ROSSO }) // (11.11: il cuore dei preferiti, rosso)
      const s = mercato.scontoDi(x.id), p = `${fmt(mercato.prezzoDi(x))} $pzk`
      let xp = 46
      if (s) { const v0 = fmt(x.prezzo); l.testo(xp, 33, v0); l.orizz(xp - 1, 36, Lcd.larghezza(v0) + 2, ROSSO); xp += Lcd.larghezza(v0) + 6 } // (il prezzo pieno, barrato: 11.11 in rosso)
      l.testo(xp, 33, p); if (s) cartellino(l, xp + Lcd.larghezza(p) + 4, 33, pct(s), ROSSO) // (lo sconto, sul cartellino rosso)
      l.testo(46, 42, corto(ce(x) ? 'ce l’hai già nello zaino' : `ne hai ${zaino.quanti(x.id)} · ${x.unico ? 'se ne ha uno solo' : 'fino a 50 alla volta'}`, 33))
      // la descrizione, che scorre
      const d = desc(), VIS = 4, g = Math.min(giu, Math.max(0, d.length - VIS)) // (11.11: disegna non cambia giu, 4.8: lo tiene nei margini il tasto)
      d.slice(g, g + VIS).forEach((r, i) => l.testo(10, 52 + i * 9, r))
      if (g > 0) l.testo(W - 14, 52, '↑')
      if (g + VIS < d.length) l.testo(W - 14, 52 + (VIS - 1) * 9, '↓')
      // quanti e il totale, e i tasti
      if (!ce(x)) { // (11.11: quello che manca, o la galera, sul cartellino rosso)
        const base = corto(`${x.unico ? '' : `quanti ${n} · `}${fmt(tot())} $pzk`, 39), no = pzk.inGalera() ? 'in galera' : tot() > puliti() ? `ti mancano ${fmt(tot() - puliti())}${pul()}` : ''
        const xb = 10 + l.testo(10, 89, base) + 5, resta = Math.floor((W - 10 - xb - 4) / 6)
        if (no && resta >= 3) cartellino(l, xb, 89, corto(no, resta), ROSSO)
      }
      const ws = B.map((b) => Lcd.larghezza(b) + 8), tutta = ws.reduce((a, w) => a + w, 0) + (B.length - 1) * 4
      let xb = Math.round(W / 2 - tutta / 2)
      B.forEach((b, i) => {
        const on = i === sb
        if (on) l.riempi(xb, 99, ws[i], 11); else l.cornice(xb, 99, ws[i], 11)
        l.testo(xb + 4, 101, b, on ? { inv: true } : { col: b === '♥' && preferiti().has(x.id) ? ROSSO : 1 }) // (11.11: il ♥ rosso se è già nei preferiti)
        if (!attesa) os.zona(xb, 97, ws[i], 15, () => { sel = i; premi(b) }) // (aspettando la banca il clic non parte, come i tasti)
        xb += ws[i] + 4
      })
      if (!striscia(l, { esito, attesa }, t)) centro(l, H - 9, d.length > VIS ? '←→ sceglie · OK preme · ↑↓ legge' : '←→ sceglie · OK preme')
    },
    tasto(k) {
      if (attesa) { if (k === 'indietro') os.togli(); return true } // (aspettando la banca non parte altro)
      const B = bottoni()
      tieni()
      if (k === 'sx') sel = (sel - 1 + B.length) % B.length
      else if (k === 'dx') sel = (sel + 1) % B.length
      else if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu = Math.min(giu + 1, Math.max(0, desc().length - 4))
      else if (k === 'ok') premi(B[sel])
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── le opzioni della vetrina: l'ordine, «posso comprarli», la ricerca ──
function opzioni(os) {
  let sel = 0
  const righe = [
    { nome: 'ordina', valore: () => ORDINI.find(([id]) => id === ordine)?.[1] ?? '', cambia: (d) => { const i = ORDINI.findIndex(([id]) => id === ordine); ordine = ORDINI[(i + d + ORDINI.length) % ORDINI.length][0] }, aiuto: '←→ cambia l’ordine' },
    { nome: 'posso comprarli', valore: () => (solo ? 'sì' : 'no'), cambia: () => { solo = !solo }, aiuto: '←→ o OK cambia' },
    { nome: 'cerca', valore: () => (cerca ? `«${cerca}»` : 'niente'), ok: async () => { const t = await os.tastiera({ testo: cerca, titolo: 'cerca nello shop' }); if (t !== null) cerca = t.trim().slice(0, 20) }, aiuto: 'OK scrive · o scrivi dalla tastiera' },
    { nome: 'pulisci tutto', valore: () => '', ok: () => { ordine = 'top'; solo = false; cerca = '' }, aiuto: 'OK: ordine, filtro e ricerca da capo' },
  ]
  const fai = (r, d = 1) => (r.ok ? r.ok() : r.cambia(d))
  return {
    nome: 'negozio-opzioni', app: 'negozio',
    disegna(l) {
      l.bitmap(icone.bitmap('app-shop', 16), 8, 14); l.testo(28, 18, 'le opzioni della vetrina'); l.orizz(6, 31, W - 12)
      righe.forEach((r, j) => {
        const y = 37 + j * 14, on = j === sel, frecce = on && r.cambia, nome = corto(r.nome, 24)
        // il valore prende tutto lo spazio che resta dopo il nome (e le frecce)
        const v = corto(r.valore(), Math.floor((W - 10 - (on ? 10 : 0) - (frecce ? 10 : 0) - (10 + Lcd.larghezza(nome) + 10)) / 6))
        if (on) l.riempi(6, y - 2, W - 12, 11)
        l.testo(10, y, nome, { inv: on })
        const xv = W - 10 - (frecce ? 10 : on ? 10 : 0) - Lcd.larghezza(v)
        if (frecce) l.testo(xv - 10, y, '◀', { inv: true })
        if (on) l.testo(W - 15, y, '▶', { inv: true })
        l.testo(xv, y, v, { inv: on })
        os.zona(6, y - 2, W - 12, 11, () => { sel = j; fai(r) })
        if (frecce) { os.zona(xv - 13, y - 2, 11, 11, () => r.cambia(-1)); os.zona(W - 18, y - 2, 12, 11, () => r.cambia(1)) }
      })
      centro(l, H - 9, righe[sel].aiuto)
    },
    tasto(k) {
      const r = righe[sel]
      if (k === 'su' || k === 'giu') sel = (sel + (k === 'su' ? -1 : 1) + righe.length) % righe.length
      else if (k === 'sx') { if (r.cambia) r.cambia(-1) }
      else if (k === 'dx' || k === 'ok') fai(r, 1)
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
    carattere(ch) { if (cerca.length < 20) cerca += ch },
    cancella() { cerca = cerca.slice(0, -1) },
    scrivendo: () => cerca.length > 0,
  }
}

// ── la vetrina: le pagine ──
export function vista(os) {
  let v = null
  const torna = () => { while (os.corrente() && os.corrente() !== v && os.corrente().app === 'negozio') os.togli() }
  // una pagina di prodotti (offerte, tutto, un reparto): in cima la riga dell'ordine, poi la lista
  const paginaProdotti = (rep, nome, icona) => {
    const st = { sel: 0, da: 0 }
    const voci = () => [{ opz: true }, ...prodotti({ rep, q: cerca, ordine: rep === 'offerte' ? 'top' : ordine }).filter((p) => !solo || (!ce(p) && !nonPuoi(mercato.prezzoDi(p))))] // («posso comprarli» qui: quello di prodotti conta anche gli sporchi)
    return {
      nome, icona,
      aiuto: () => (cerca ? `«${corto(cerca, 12)}» · INDIETRO la toglie` : 'OK apre · ↑↓ sceglie · ←→ reparti'), // (36 lettere al più: «… toglie la ricerca» usciva dallo schermo)
      tic: (t) => rep === 'offerte' && st.da === 0 && t % 10 === 0, // (il conto alla rovescia)
      disegna(l, x) {
        const L = voci()
        segui(st, L)
        elenco(l, x.zona, {
          voci: L, stato: st, y0: 33, alta: 85, passo: 17,
          clic: (vc) => { st.chiave = chiaveDi(vc); apri(vc, x) },
          riga(l, vc, x0, y, w, on) {
            const o = { inv: on }
            if (vc.opz) {
              const s = `${rep === 'offerte' ? `finiscono fra ${contoAllaRovescia()}` : `ordina: ${ORDINI.find(([id]) => id === ordine)?.[1]}`}${solo ? ' · posso' : ''}` // (11.11: nelle offerte il filtro acceso non si vedeva, e i prodotti sparivano senza dire perché)
              l.testo(x0, y + 5, corto(cerca ? `cerca «${cerca}» · ${s}` : s, Math.floor(w / 6)), o) // (niente ▶: qui → cambia reparto, le opzioni si aprono con OK)
              return
            }
            const p = mercato.prezzoDi(vc), sc = mercato.scontoDi(vc.id), qui = ce(vc)
            l.bitmap(bm(vc.id, 16), x0 - 2, y, o)
            const val = qui ? 'ce l’hai' : fmt(p)
            destra(l, x0 + w, y + 5, val, o)
            const xs = x0 + w - Lcd.larghezza(val) - 6
            if (sc && !qui) cartellino(l, xs - largoCart(pct(sc)) + 2, y + 5, pct(sc), ROSSO) // (11.11: lo sconto sul cartellino rosso, anche sulla riga scelta)
            const spazio = Math.floor((xs - (sc && !qui ? Lcd.larghezza(pct(sc)) + 6 : 0) - (x0 + 18) - 4) / 6), pref = preferiti().has(vc.id)
            if (pref) l.testo(x0 + 18, y + 5, '♥', on ? o : { col: ROSSO }) // (11.11: il cuore dei preferiti, rosso)
            l.testo(x0 + 18 + (pref ? 12 : 0), y + 5, corto(vc.nome, spazio - (pref ? 2 : 0)), o)
          },
        })
        if (L.length === 1) centro(l, 70, corto(cerca ? `niente per «${cerca}»` : solo ? 'niente che puoi comprare qui' : 'niente da mostrare', 38))
      },
      tasto(k, x) {
        const L = voci()
        segui(st, L)
        if (muovi(st, L.length, k)) { st.chiave = chiaveDi(L[st.sel]); return true }
        if (k === 'ok') { apri(L[st.sel], x); return true }
        if (k === 'indietro' && cerca) { cerca = ''; return true } // (INDIETRO toglie prima la ricerca)
        return false
      },
      carattere(ch) { if (cerca.length < 20) { cerca += ch; st.sel = 0; st.da = 0; st.chiave = null } },
      cancella() { cerca = cerca.slice(0, -1) },
      scrivendo: () => cerca.length > 0,
    }
  }
  function apri(vc, x) {
    if (!vc) return
    if (vc.opz) return os.spingi(opzioni(os))
    os.spingi(scheda(os, vc, torna, (ok, t) => { if (x.qui()) x.dì(ok, t) })) // (l'esito di un acquisto finito dopo INDIETRO)
  }
  // il carrello
  const stc = { sel: 0, da: 0 }
  const vociCarrello = () => { const r = righeCarrello().map(([id, n]) => ({ id, n })); return r.length ? [...r, { paga: true }, { svuota: true }] : [] }
  async function rigaCarrello(vc, x) {
    if (vc.paga) {
      const t = totale(), sal = puliti(), no = nonPuoi(t)
      if (no) return x.dì(false, no) // (prima di compraRighe: col saldo sporco comprava solo le prime righe)
      const r = await os.dialogo({ titolo: 'paghi?', icona: 'app-shop', testo: `${pezzi()} pezz${pezzi() === 1 ? 'o' : 'i'} per ${fmt(t)} $pzk. Dopo te ne restano ${fmt(sal - t)}${pul()}.`, tasti: ['no', 'paga'] })
      if (r !== 'paga' || !x.qui()) return
      // (11.11: con la rotellina e i tasti fermi mentre paga la banca: prima un secondo OK su «paga» rifaceva il dialogo e pagava due volte)
      const s = await x.aspetta('pago…', () => compraRighe(righeCarrello(), (id) => metti(id, 0)))
      if (!s) return
      if (s.manca) return x.dì(false, `ti mancano ${fmt(s.manca)} $pzk`)
      if (s.errore) return x.dì(false, s.errore)
      if (!s.righe.length) return x.dì(false, 'ce l’hai già tutto')
      stc.sel = 0; stc.chiave = null
      if (!x.qui()) return // (11.11: uscito mentre pagava, lo scontrino si apriva sopra un'altra app)
      return os.spingi(scontrino(os, s, torna))
    }
    if (vc.svuota) {
      const r = await os.dialogo({ titolo: 'svuoti?', testo: 'tutto il carrello torna sugli scaffali.', tasti: ['no', 'svuota'] })
      if (r === 'svuota' && x.qui()) { scrivi(CHIAVE_CARRELLO, {}); stc.sel = 0; stc.chiave = null; x.dì(true, 'carrello vuoto') }
      return
    }
    const p = PER_ID[vc.id]
    const r = await os.dialogo({ titolo: corto(p.nome, 14), icona: p.id, testo: `${vc.n} nel carrello, ${fmt(mercato.prezzoDi(p) * vc.n)} $pzk.`, tasti: p.unico ? ['togli'] : ['togli', 'uno in meno', 'uno in più'] })
    if (!r || !x.qui()) return
    if (r === 'uno in più' && vc.n >= 50) return x.dì(false, 'al più 50 alla volta') // (11.11: non aggiungeva e non diceva perché)
    metti(p.id, r === 'togli' ? 0 : r === 'uno in meno' ? vc.n - 1 : vc.n + 1)
  }
  const paginaCarrello = {
    get nome() { return pezzi() ? `il carrello (${pezzi()})` : 'il carrello' }, icona: 'sacco',
    aiuto: () => (vociCarrello().length ? 'OK sceglie · ↑↓ · ←→ reparti' : '←→ reparti'),
    disegna(l, x) {
      const L = vociCarrello()
      segui(stc, L)
      if (!L.length) { centro(l, 58, 'il carrello è vuoto.'); centro(l, 70, 'OK su un prodotto e «carrello»'); return }
      elenco(l, x.zona, {
        voci: L, stato: stc, y0: 33, alta: 64, passo: 16,
        clic: (vc) => { stc.chiave = chiaveDi(vc); rigaCarrello(vc, x) },
        riga(l, vc, x0, y, w, on) {
          const o = { inv: on }
          if (vc.paga) { // (niente ▶: qui → cambia pagina, si paga con OK)
            const t = totale(), no = nonPuoi(t)
            if (no && !on) cartellino(l, x0 - 2, y + 4, corto(no, Math.floor((w - 4) / 6)), ROSSO) // (11.11: non si può pagare: il cartellino rosso)
            else l.testo(x0, y + 4, corto(no ?? `paga ${fmt(t)} $pzk`, Math.floor(w / 6)), o)
            return
          }
          if (vc.svuota) { l.testo(x0, y + 4, 'svuota il carrello', o); return }
          const p = PER_ID[vc.id]
          l.bitmap(bm(p.id, 16), x0 - 2, y - 1, o)
          const val = fmt(mercato.prezzoDi(p) * vc.n)
          destra(l, x0 + w, y + 4, val, o)
          l.testo(x0 + 18, y + 4, corto(`${vc.n} × ${p.nome}`, Math.floor((w - 18 - Lcd.larghezza(val) - 8) / 6)), o)
        },
      })
      const t = totale(), sal = puliti(), ris = risparmio()
      l.orizz(8, 98, W - 16)
      // (11.11) i soldi che dicono qualcosa sui cartellini: gli sconti verdi (risparmiati), quello che manca e la galera rossi
      const dopo = (y, base, s, col) => { const xb = base ? 10 + l.testo(10, y, base) + 5 : 8, resta = Math.floor((W - 10 - xb - 4) / 6); if (resta >= 3) cartellino(l, xb, y, corto(s, resta), col) }
      const base = corto(`${pezzi()} pezz${pezzi() === 1 ? 'o' : 'i'}, ${fmt(t)} $pzk`, 39)
      if (ris) dopo(100, base, `sconti -${fmt(ris)}`, VERDE); else l.testo(10, 100, base)
      if (pzk.inGalera()) dopo(109, '', `in galera fino alle ${ora(pzk.galera())}: niente shop`, ROSSO)
      else if (t > sal) dopo(109, corto(`${pul() ? 'puliti' : 'saldo'} ${fmt(sal)}`, 20), `ti mancano ${fmt(t - sal)}`, ROSSO)
      else l.testo(10, 109, corto(`${pul() ? 'puliti' : 'saldo'} ${fmt(sal)} · dopo ${fmt(sal - t)}`, 39))
    },
    tasto(k, x) {
      const L = vociCarrello()
      segui(stc, L)
      if (muovi(stc, L.length, k)) { stc.chiave = chiaveDi(L[stc.sel]); return true }
      if (k === 'ok' && L.length) { rigaCarrello(L[stc.sel], x); return true }
      return false
    },
  }
  const P = [paginaProdotti('offerte', 'le offerte del giorno', 'regalo'), paginaProdotti('tutti', 'tutto lo shop', 'app-shop'), ...REPARTI.map(([id, n, i]) => paginaProdotti(id, n, i)), paginaCarrello]
  let qui = null // (la x di pagine, per la striscia: la dà entra)
  v = pagine(os, {
    nome: 'negozio', app: 'negozio', pagine: P, iniziale: ultima,
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f), (f) => icone.ascolta(f)],
    entra: (x) => { qui = x },
    esci: (x) => { ultima = x.pag },
  })
  // (11.11) aperto con un comando (os.apri('negozio', { comando: 'pomodoro' }): la missione bloccata «allo shop»), si apre la
  // scheda di quel pezzo: prima lo shop si apriva sulle offerte e il pezzo che manca andava cercato fra i reparti
  v.comando = (id) => {
    const p = prodotti({ rep: 'tutti' }).find((q) => q.id === id)
    if (p && os.corrente() === v) os.spingi(scheda(os, p, torna, (ok, t) => { if (qui?.qui()) qui.dì(ok, t) }))
  }
  return v
}
