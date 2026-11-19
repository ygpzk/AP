// L'app «zaino» di pzk os (29.10, Alberto: «crea uno alla volta … zaino …»): quello che hai, sul cercapersone zero. Gli
// oggetti, i bonus, gli effetti e cosa si può fare con ogni pezzo sono quelli di chat/zaino.js e dello zaino del cercapersone
// vecchio (telefono/app/zaino.js: FILTRI, tipoDi, azioniDi, usa, nomeCorto, resto).
// - LE PAGINE (← →) sono i filtri: tutto, da usare, da tenere, attrezzi, casse, da vendere. In cima gli effetti in corso
//   col tempo che resta e i bonus di adesso; sotto i pezzi (icona, nome, quanti). OK apre la scheda.
// - LA SCHEDA: l'icona grande, il nome, quanti ne hai e quanto vale, cosa fa (scorre con ↑ ↓) e i bonus; sotto i tasti:
//   usa (si consuma qui, e parte l'effetto), gratta, apri, vendi, vendi tutto (li fa la chat, che ha le animazioni e i conti
//   del bonus di vendita), allo shop o compra ancora.
// - I COLORI (11.11, Alberto: «fai colori a 8bit su tutto»): pochi e con un senso. Il bonus è verde (in cima e nella
//   scheda), il tempo di un effetto che sta per finire è rosso, un pezzo leggendario è d'oro, uno che vale quasi niente è
//   grigio. Il resto è d'inchiostro.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, esa } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import { PER_ID, nomeDi } from '../../../chat/testi.js'
import { testoBonus } from '../../../chat/oggetti.js'
import { FILTRI, tipoDi, azioniDi, usa, nomeCorto, resto } from '../../app/zaino.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-zaino', lato)
const ICONE = { tutto: 'app-zaino', usa: 'clessidra', tieni: 'stella', attrezzo: 'canna', cassa: 'regalo', vendi: 'pzk' }
const pezzi = () => zaino.oggetti().reduce((a, [, q]) => a + q, 0)
// ── i colori (11.11): ognuno ha due tinte, la scura per i fondi chiari (arancione, carta, cielo…) e la chiara per «notte» e
// per la fascia scura della riga scelta (un oro chiaro sull'arancione non si legge, uno scuro su «notte» nemmeno) ──
const TINTE = { verde: [esa('#006600'), esa('#66ff66')], rosso: [esa('#990000'), esa('#ff6666')], oro: [esa('#996600'), esa('#ffcc33')], grigio: [esa('#555555'), esa('#aaaaaa')] }
/** L'indice del colore che si legge lì: sul fondo, o (fascia) sulla fascia d'inchiostro della riga scelta. */
const tinta = (l, nome, fascia = false) => { const c = l.tema?.inchiostro ?? [0, 0, 0]; return TINTE[nome][(c[0] + c[1] + c[2] > 384) !== fascia ? 1 : 0] } // (inchiostro chiaro: il fondo è scuro)
/** Il colore del nome di un pezzo: d'oro il leggendario, grigio quello che vale quasi niente, se no null (inchiostro). */
const tintaDi = (id) => { const x = PER_ID[id]; return x?.leggendario ? 'oro' : x?.schifo ? 'grigio' : null }
/** Una riga fatta di gruppi separati da « · » (ogni gruppo: pezzi { s, col }), tagliata a n caratteri con «…» come corto:
 *  ogni pezzo col suo colore (col null: inchiostro). */
function fila(l, x, y, gruppi, n) {
  const tutti = gruppi.flatMap((g, i) => (i ? [{ s: ' · ' }, ...g] : g)), lungo = tutti.reduce((a, p) => a + [...txt(p.s)].length, 0)
  let resta = lungo > n ? n - 1 : n
  for (const p of tutti) {
    const s = [...txt(p.s)].slice(0, resta).join('')
    if (s) x += l.testo(x, y, s, { col: p.col ?? 1 }) + 1
    if ((resta -= [...s].length) <= 0) break
  }
  if (lungo > n) l.testo(x, y, '…')
}
/** La riga in cima: gli effetti in corso (col tempo che resta: rosso negli ultimi cinque minuti) e i bonus di adesso (verdi). */
const inCima = (l) => {
  const e = zaino.effetti().map(([id, t]) => [{ s: `${nomeCorto(id)} ` }, { s: resto(t - Date.now()), col: t - Date.now() <= 5 * 60000 ? tinta(l, 'rosso') : null }])
  const b = testoBonus(zaino.bonusTutti())
  return [...e, ...(b ? [[{ s: b, col: tinta(l, 'verde') }]] : [])]
}

// ── la scheda di un pezzo ──
function scheda(os, id) {
  let giu = 0, sel = 0, esito = null, ritorno = null, attesa = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const x = PER_ID[id] ?? { id }
  const azioni = () => (zaino.quanti(id) ? azioniDi(id, x) : [])
  // cosa fa e il bonus, che scorrono: li leggono disegna e tasto (↓ si ferma all'ultima riga senza che disegna corregga giu)
  const leggibile = () => {
    const cosa = x.cosa ?? (x.leggendario ? 'leggendario: ne esce uno ogni cento.' : x.schifo ? 'vale quasi niente, ma l’hai preso tu.' : tipoDi(id) === 'vendi' ? 'si vende.' : 'non si vende: si tiene.') // (11.11: un pezzo che il catalogo non conosce era «da tenere» e diceva «si vende.»)
    const b = testoBonus(x.bonus)
    const righe = impagina([{ testo: cosa }, ...(b ? [{ titolo: 'il bonus' }, { testo: `${b}${x.effetto ? ` · per ${resto(x.effetto)}` : x.unico ? ' · finché ce l’hai' : ''}` }] : [])])
    const da = righe.findIndex((r) => r.tipo === 'titolo')
    if (da >= 0) righe.slice(da + 1).forEach((r) => { r.verde = true }) // (11.11: le righe del bonus, che disegna ripassa in verde)
    return { righe, vis: azioni().length ? 5 : 7 }
  }
  async function premi(a) {
    if (!a || attesa) return // (11.11: aspettando la banca un altro OK non ne consumava un secondo, 8.6)
    if (a.usa) {
      attesa = 'uso…'; esito = null; os.ridisegna()
      let u
      try { u = await usa(a.usa) } finally { attesa = null; os.ridisegna() } // (31.10: usa la banca, 'chat.usa')
      if (os.corrente() !== v) return // (11.11: già uscito, niente suoni né esiti sopra un'altra vista, 8.4)
      if (!u || u.errore) return dì(false, u?.errore ?? (!zaino.quanti(id) ? 'non ce l’hai più' : 'non si può usare: riprova')) // (11.11: prima sempre «non si può usare», senza dire perché)
      os.suoni.sigla('zaino')
      dì(true, `${nomeCorto(id)}: ${testoBonus(u.bonus)} per ${resto(u.effetto)}`)
      if (!zaino.quanti(id)) { clearTimeout(ritorno); ritorno = setTimeout(() => { ritorno = null; if (os.corrente() === v) os.togli() }, 1400) } // (finito: si torna allo zaino; esci lo spegne, 6.2)
      return
    }
    if (a.chat === 'vendi tutto') { // (11.11: vende anche gli altri pezzi, non solo questo: dalla scheda dell'osso partiva anche il tesoro, senza chiedere, 8.6)
      const n = zaino.oggetti().filter(([k]) => tipoDi(k) === 'vendi').reduce((s, [, q]) => s + q, 0)
      const r = await os.dialogo({ titolo: 'vendi tutto?', icona: 'pzk', testo: `vende tutti i pesci, le bestie e i reperti dello zaino (${n} ${n === 1 ? 'pezzo' : 'pezzi'}), non solo questo.`, tasti: ['no', 'vendi'] })
      if (r !== 'vendi' || os.corrente() !== v) return // (INDIETRO dà null; e si può essere già usciti)
    }
    if (a.shop) return os.apri('negozio')
    if (a.app) return os.apri(a.app) // (11.11: un tasto che apre un'app, come «decifra» del wallet cifrato, se azioniDi lo dà)
    os.apri('chat', { comando: a.chat })
  }
  const v = {
    nome: 'zaino-scheda', app: 'zaino',
    entra() { v.via = [zaino.ascolta(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] },
    esci() { v.via?.forEach((f) => f()); clearTimeout(ritorno); ritorno = null },
    tic() { if (attesa) os.ridisegna(); else if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } }, // (la rotellina gira solo mentre si aspetta)
    disegna(l, t) {
      const n = zaino.quanti(id), A = n ? azioniDi(id, x) : [], s = sel < A.length ? sel : 0 // (sel e giu li tiene in riga tasto: 4.8)
      l.bitmap(bm(id, 32), 8, 14)
      const c = tintaDi(id)
      l.testo(46, 15, corto(nomeCorto(id), 33), { col: c ? tinta(l, c) : 1 }) // (11.11: il colore che ha nella lista)
      l.testo(46, 24, corto(`ne hai ${n}${x.vale ? ` · vale ${x.vale} $pzk l’uno` : ''}`, 33))
      const tipo = { usa: 'da usare', tieni: 'da tenere', attrezzo: 'attrezzo', cassa: 'cassa', vendi: 'da vendere' }[tipoDi(id)] ?? ''
      const xl = 46 + l.testo(46, 33, corto(tipo, 33)) + 1
      if (x.leggendario) l.testo(xl, 33, ' · leggendario', { col: tinta(l, 'oro') }) // (11.11: d'oro, come il suo nome nella lista)
      const { righe, vis } = leggibile()
      const g = scorrevole(l, righe, { y0: 46, vis, giu })
      // (11.11) il bonus in verde: scorrevole (pezzi.js) scrive d'inchiostro, qui si riscrivono le stesse lettere negli stessi
      // pixel col verde, che le copre tutte
      righe.slice(g, g + vis).forEach((r, i) => { if (r.verde && r.s) l.testo(10, 46 + i * 9, r.s, { col: tinta(l, 'verde') }) })
      const legge = righe.length > vis ? ' · ↑↓ legge' : '' // (↑↓ solo se c'è da scorrere)
      if (A.length) bottoni(l, attesa ? () => {} : os.zona, { etichette: A.map((a) => a.eti), sel: s, y: 99, premi: (i) => { sel = i; premi(A[i]) } }) // (aspettando la banca i clic non partono, come i tasti)
      if (!striscia(l, { esito, attesa }, t)) centro(l, H - 9, !n ? 'non ce l’hai più · INDIETRO torna' : A.length > 1 ? `←→ sceglie · OK preme${legge}` : A.length ? `OK preme${legge}` : `INDIETRO torna${legge}`)
    },
    tasto(k) {
      if (attesa) { if (k === 'indietro') os.togli(); return true } // (aspettando la banca non parte altro: 8.6)
      const A = azioni(), { righe, vis } = leggibile(), fondo = Math.max(0, righe.length - vis)
      if (sel >= A.length) sel = 0
      if (k === 'sx' && A.length) sel = (sel - 1 + A.length) % A.length
      else if (k === 'dx' && A.length) sel = (sel + 1) % A.length
      else if (k === 'su') giu = Math.max(0, Math.min(giu, fondo) - 1)
      else if (k === 'giu') giu = Math.min(fondo, giu + 1)
      else if (k === 'ok') premi(A[sel])
      else if (k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
  return v
}

// ── le pagine: i filtri ──
let ultima = 0
export function vista(os) {
  const allinea = [] // (11.11: il cursore si ricorda per chiave, REGOLE 3.12: venduto il tesoro, la riga scelta diventava la moneta che gli stava sotto)
  const pagina = ([filtro, nome]) => {
    const st = { sel: 0, da: 0, id: null }
    const voci = () => zaino.oggetti().filter(([id]) => filtro === 'tutto' || tipoDi(id) === filtro)
    const segna = () => { st.id = voci()[st.sel]?.[0] ?? null }
    allinea.push(() => { const L = voci(), i = L.findIndex(([k]) => k === st.id); st.sel = Math.max(0, i); st.id = L[st.sel]?.[0] ?? null }) // (non c'è più: si torna al primo)
    return {
      get nome() { const n = pezzi(); return filtro === 'tutto' ? `zaino · ${n} ${n === 1 ? 'pezzo' : 'pezzi'}` : nome }, icona: ICONE[filtro] ?? 'app-zaino', // (11.11: «1 pezzi»)
      aiuto: () => (voci().length ? 'OK apre · ↑↓ sceglie · ←→ filtri' : filtro === 'tutto' ? 'OK va allo shop · ←→ filtri' : '←→ filtri'),
      ok: () => { // (11.11: il clic su «OK apre» in fondo chiama ok, che con la lista piena non faceva niente; ora fa quello del tasto)
        const L = voci()
        if (L.length) os.spingi(scheda(os, L[Math.max(0, Math.min(st.sel, L.length - 1))][0]))
        else if (filtro === 'tutto') os.apri('negozio')
      },
      tic: (t) => t % 300 === 0 && zaino.effetti().length > 0, // (il tempo degli effetti, a minuti)
      disegna(l, x) {
        const cima = inCima(l), y0 = cima.length ? 44 : 34
        if (cima.length) fila(l, 10, 34, cima, 39) // (11.11: il bonus verde, il tempo che sta per finire rosso)
        const L = voci()
        if (!L.length) { (filtro === 'tutto' ? ['lo zaino è vuoto:', 'lo shop vende, pesca caccia e scava', 'riempiono.'] : ['niente qui.']).forEach((r, i) => centro(l, 58 + i * 10, r)); return }
        elenco(l, x.zona, {
          voci: L, stato: st, y0, alta: 117 - y0, passo: 17,
          clic: ([id]) => { st.id = id; os.spingi(scheda(os, id)) },
          riga(l, [id, q], x0, y, w, on) {
            const o = { inv: on }
            l.bitmap(bm(id, 16), x0 - 2, y, o)
            const s = q > 1 ? `×${q}` : ''
            if (s) destra(l, x0 + w, y + 5, s, o)
            const c = tintaDi(id), nome = corto(nomeCorto(id), Math.floor((w - 18 - Lcd.larghezza(s) - 6) / 6))
            l.testo(x0 + 18, y + 5, nome, c ? { col: tinta(l, c, on) } : o) // (11.11: il leggendario d'oro, lo schifo grigio; sulla fascia la tinta chiara)
          },
        })
      },
      tasto(k) {
        const L = voci()
        st.sel = Math.max(0, Math.min(st.sel, L.length - 1)) // (la lista può essersi accorciata dopo l'ultimo disegno: L[st.sel] sarebbe undefined)
        if (!muovi(st, L.length, k)) return false // (OK lo fa ok, lo stesso del clic in fondo)
        segna(); return true
      },
    }
  }
  return pagine(os, {
    nome: 'zaino', app: 'zaino', iniziale: ultima,
    pagine: FILTRI.map(pagina),
    ascolta: [() => zaino.ascolta(() => allinea.forEach((a) => a())), (f) => zaino.ascolta(f), (f) => icone.ascolta(f)],
    entra: () => allinea.forEach((a) => a()), // (anche al ritorno dalla scheda o dalla chat: mentre era coperta non ascoltava)
    esci: (x) => { ultima = x.pag },
  })
}
