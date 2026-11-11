// L'app «quest» di pzk os (29.10, Alberto: «crea uno alla volta … quest …»): le side quest come un libro a bivi, sul
// cercapersone zero. Le storie, gli stati, le scelte (costi, rischi, oggetti), i premi sono quelli di chat/missioni.js
// (elenco, vista, inizia, scegli, abbandona), come le quest del cercapersone vecchio: si può cominciare qui e finire in chat.
// - L'ELENCO: quante finite; ogni storia con l'icona, il nome, lo stato (da fare, in corso, finita, bloccata) e una riga
//   (cosa è, o cosa ti manca). OK: comincia (se consuma un oggetto, lo dice prima), continua, rileggi la fine; bloccata,
//   dice cosa manca e porta allo shop.
// - LA STORIA, una pagina alla volta e in due tempi: il TESTO a tutto schermo, che si scrive da solo in un secondo col
//   ticchettio (OK lo finisce subito, poi OK le scelte); le SCELTE, una per riga (sotto il costo, il rischio o perché non si
//   può), e in fondo «lascia la quest» (si conferma). INDIETRO dalle scelte torna al testo, dal testo all'elenco. Cosa ha fatto
//   la scelta di prima (pagato, perso, usato, è andata o no) passa nella striscia in fondo. Alla fine il premio.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import * as missioni from '../../../chat/missioni.js'
import { PER_ID as OGGETTI, nomeDi } from '../../../chat/testi.js'
import { fmt } from '../../../games/pzk.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia } from './pezzi.js'

const STATI = { pronta: 'da fare', 'in corso': 'in corso', fatta: 'finita', bloccata: 'bloccata' }
const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-quest', lato)
const premioTesto = (p) => `+${fmt(p.pzk)} $pzk · +${p.xp} xp${p.oggetto ? ` · ${nomeDi(p.oggetto)}` : ''}`
/** Il premio di una quest come arriva: i $pzk li paga la banca (il moltiplicatore del livello e dei bonus «paga»). */
const premioVero = (p) => ({ ...p, pzk: Math.round(p.pzk * zaino.moltiplicatore() * 2) / 2, xp: Math.round(p.xp * (1 + zaino.bonus('xp'))) }) // (11.11: anche l'xp, coi bonus «xp» come daiXp della banca)
/** Le quest con una scelta già partita verso la banca (11.11: INDIETRO esce mentre la banca decide; rientrando, una seconda
 *  scelta partiva lo stesso, e la banca la giocava sul passo DOPO, perché la scelta è solo il numero della riga). */
const inVolo = new Set()

// ── la storia ──
function storia(os, id, esitoPrima = null) {
  let tempo = 'testo', t0 = performance.now(), st = { sel: 0, da: 0 }, esito = null, vista = missioni.vista(id), finito = false
  let pagato = null // (11.11: il premio che la banca ha pagato davvero, appena finita; il riquadro diceva +306 e la striscia +300: rifatto col livello nuovo, dopo l'xp)
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() } // (11.11: il bip dell'errore, come il dì di pagine nell'elenco: qui «la banca non risponde» era muto)
  const avviso = (e) => {
    if (!e) return
    const r = [e.speso ? `hai pagato ${e.speso} $pzk` : '', e.perso ? `hai perso ${e.perso} $pzk` : '', e.consumato ? `hai usato ${nomeDi(e.consumato)}` : '', e.caso === 'ko' ? 'non è andata bene…' : e.caso === 'ok' ? 'è andata!' : ''].filter(Boolean)
    if (r.length) dì(!(e.caso === 'ko' || e.perso), r.join(' · '))
  }
  avviso(esitoPrima)
  const righe = () => Lcd.acapo(txt(vista.t), 38)
  const scritto = () => Math.min(1, (performance.now() - t0) / 1000)
  const scelte = () => [...vista.scelte, { lascia: true }]
  // (31.10) la scelta la gioca la banca (chat/missioni.js): intanto la rotellina in fondo, e i tasti non mandano un'altra scelta
  let attesa = null
  const allaBanca = async (testo, fai) => { // (la rotellina, e la quest segnata in volo finché la banca non risponde)
    attesa = testo; inVolo.add(id); os.ridisegna()
    try { return await fai() } finally { attesa = null; inVolo.delete(id) }
  }
  const zona = (...a) => { if (!attesa) os.zona(...a) } // (11.11: aspettando la banca i clic non partono, come i tasti: il clic su una riga spostava la scelta sotto la rotellina)
  const ancoraInVolo = () => inVolo.has(id) && (dì(false, 'la banca risponde ancora: aspetta'), true)
  async function scegli(s) {
    if (attesa || ancoraInVolo()) return
    if (s.lascia) {
      const r = await os.dialogo({ titolo: 'la lasci?', testo: 'la puoi ricominciare da capo; gli oggetti usati non tornano.', tasti: ['no', 'lascia'] })
      if (r !== 'lascia' || os.corrente() !== v || ancoraInVolo()) return
      const e = await allaBanca('la lascio', () => missioni.abbandona(id))
      if (os.corrente() !== v) return
      if (!e.ok) return dì(false, e.errore)
      os.togli()
      return
    }
    if (!s.ok) return dì(false, s.motivo)
    const r = await allaBanca('la banca decide', () => missioni.scegli(id, s.i))
    if (os.corrente() !== v) return
    if (!r.ok) return dì(false, r.errore)
    if (r.esito.fine) os.suoni.sigla('missioni')
    vista = r.vista; tempo = 'testo'; t0 = performance.now(); st = { sel: 0, da: 0 }; finito = false
    esito = null; avviso(r.esito)
    if (r.esito.fine) { pagato = r.esito.premio; dì(true, `quest finita${r.esito.livello ? ` · livello ${r.esito.livello}!` : ''} · ${premioTesto(pagato)}`) } // (11.11: il livello prima del premio: in fondo lo tagliava «…», e il premio intero sta nel riquadro)
  }
  // (11.11) lo zaino cambia anche da fuori: la risposta di una scelta partita prima di INDIETRO, la chat che va avanti con
  // la stessa quest, i $pzk che arrivano. La pagina segue la banca: le scelte erano quelle del passo vecchio, e la banca
  // giocava il numero della riga sul passo nuovo
  let via = null
  function segui() {
    if (attesa || vista.fatta) return
    const n = missioni.vista(id)
    if (!n) return
    if (n.nonIniziata) { if (os.corrente() === v) os.togli(); return } // (lasciata altrove: qui non c'è più niente da scegliere)
    const altro = n.t !== vista.t || n.passi !== vista.passi
    vista = n
    if (altro) { tempo = 'testo'; t0 = performance.now(); st = { sel: 0, da: 0 }; finito = false }
    os.ridisegna()
  }
  const v = {
    nome: 'quest-storia', app: 'missioni',
    entra() { via = zaino.ascolta(segui); segui() }, // (anche al ritorno da un dialogo: intanto non ascoltava)
    esci() { via?.(); via = null },
    tic(t) {
      let ancora = false
      if (tempo === 'testo' && !finito) { if (scritto() >= 1) finito = true; else if (t % 2 === 0) os.suoni.bip('cursore'); ancora = true } // (il testo si scrive col ticchettio)
      if (esito && Date.now() >= esito.fino) { esito = null; ancora = true }
      if (ancora || attesa) os.ridisegna() // (aspettando la banca, la rotellina gira)
    },
    disegna(l, t) {
      const m = vista.m
      l.bitmap(bm(m.icona, 16), 8, 13)
      destra(l, W - 8, 17, vista.fatta ? 'fine' : tempo === 'scelte' ? 'che fai?' : `passo ${(vista.passi ?? 0) + 1}`)
      l.testo(28, 17, corto(m.nome, 26))
      l.orizz(6, 31, W - 12)
      if (tempo === 'testo') {
        const R = righe(), tutto = R.join('\n').length, mostra = finito ? tutto : Math.round(tutto * scritto())
        let n = 0
        R.forEach((r, i) => { const vis = r.slice(0, Math.max(0, mostra - n)); n += r.length + 1; l.testo(10, 35 + i * 9, vis) })
        if (vista.fatta) { // (su due righe: l'oggetto del premio non si taglia; 11.11: in una riga sola «+380 $pzk · +70 xp · tè freddo alla p…», e la chiave del civico 28 pure: i soldi salgono accanto a «il premio», l'oggetto ha la riga sua)
          const y = Math.min(35 + R.length * 9 + 4, 94), p = pagato ?? premioVero(m.premio), soldi = `+${fmt(p.pzk)} $pzk · +${p.xp} xp`
          l.cornice(8, y, W - 16, 22)
          l.testo(12, y + 3, corto(p.oggetto ? `il premio: ${soldi}` : 'il premio', 38))
          l.testo(12, y + 12, corto(p.oggetto ? `+ ${nomeDi(p.oggetto)}` : soldi, 38))
        }
      } else {
        elenco(l, zona, {
          voci: scelte(), stato: st, y0: 34, alta: 82, passo: 20,
          clic: (s) => scegli(s),
          riga(l, s, x0, y, w, on) {
            const o = { inv: on }
            if (s.lascia) { l.testo(x0, y + 6, 'lascia la quest', o); return }
            l.testo(x0, y + 2, corto(`${s.ok ? '' : 'x '}${s.eti}`, Math.floor(w / 6)), o)
            const sotto = !s.ok ? s.motivo : [s.costo ? `costa ${s.costo} $pzk` : '', s.azzardo ? `${s.azzardo}% che vada bene` : ''].filter(Boolean).join(' · ')
            if (sotto) l.testo(x0 + 6, y + 11, corto(sotto, Math.floor((w - 6) / 6)), o)
          },
        })
      }
      if (tempo === 'testo') zona(6, 32, W - 12, H - 32, () => v.tasto('ok')) // (11.11: prima della striscia: con l'esito in fondo il clic sul testo non faceva niente, OK sì)
      if (striscia(l, { esito, attesa }, t)) return
      const a = tempo === 'testo' && !finito ? 'OK fa vedere tutto' : vista.fatta ? 'OK torna alle quest' : tempo === 'scelte' ? 'OK sceglie · ↑↓ · INDIETRO rilegge' : 'OK le scelte · INDIETRO all’elenco' // (11.11: rileggendo la fine diceva «OK torna alle quest» mentre il testo si scriveva, e OK lo finiva soltanto)
      centro(l, H - 9, a)
    },
    tasto(k) {
      if (attesa) { if (k === 'indietro') os.togli(); return true } // (la banca sta rispondendo: niente doppie scelte; 11.11: INDIETRO esce lo stesso, come nelle app a pagine: una banca che non risponde ti teneva dentro)
      if (tempo === 'testo') {
        if (k === 'ok') { if (!finito) finito = true; else if (vista.fatta) os.togli(); else { tempo = 'scelte'; st.sel = 0 } }
        else if (k === 'indietro') os.togli()
        else return k === 'su' || k === 'giu' || k === 'sx' || k === 'dx'
        return true
      }
      if (muovi(st, scelte().length, k)) return true
      if (k === 'ok') { scegli(scelte()[st.sel]); return true }
      if (k === 'indietro') { tempo = 'testo'; return true }
      return k === 'sx' || k === 'dx'
    },
    invio() { v.tasto('ok') },
  }
  return v
}

// ── l'elenco ──
export function vista(os) {
  const st = { sel: 0, da: 0 }
  async function apri(m, x) {
    if (m.stato === 'bloccata') {
      const daComprare = (m.richiede ?? []).filter((o) => !zaino.ha(o) && OGGETTI[o]?.prezzo)
      const r = await os.dialogo({ titolo: 'bloccata', icona: 'lucchetto', testo: `ti manca: ${m.manca.join(', ')}.`, tasti: daComprare.length ? ['ok', 'allo shop'] : ['ok'] })
      if (r === 'allo shop' && x.qui()) os.apri('negozio', { comando: daComprare[0] }) // (11.11: il pezzo che manca, per lo shop che apre la sua scheda; senza, lo shop si apriva sulle offerte e il pomodoro andava cercato)
      return
    }
    if (m.stato === 'pronta' && m.consuma?.length) {
      const r = await os.dialogo({ titolo: 'cominci?', icona: m.icona, testo: `per cominciare usi: ${m.consuma.map(nomeDi).join(', ')}.`, tasti: ['no', 'comincia'] })
      if (r !== 'comincia' || !x.qui()) return
    }
    if (m.stato === 'pronta') { const r = await x.aspetta('comincio', () => missioni.inizia(m.id)); if (!r || !x.qui()) return; if (!r.ok) return x.dì(false, r.errore) }
    os.spingi(storia(os, m.id))
  }
  return pagine(os, {
    nome: 'missioni', app: 'missioni',
    ascolta: [(f) => zaino.ascolta(f)],
    pagine: [{
      nome: 'le side quest', icona: 'app-quest',
      aiuto: () => { const m = missioni.elenco()[st.sel]; return !m ? '' : m.stato === 'bloccata' ? 'OK cosa manca · ↑↓ sceglie' : m.stato === 'fatta' ? 'OK rileggi la fine · ↑↓' : m.stato === 'in corso' ? 'OK continua · ↑↓ sceglie' : 'OK comincia · ↑↓ sceglie' },
      ok: (x) => { const m = missioni.elenco()[st.sel]; if (m) apri(m, x) },
      disegna(l, x) {
        const el = missioni.elenco()
        l.testo(10, 34, corto(`storie brevi a bivi · finite ${el.filter((m) => m.stato === 'fatta').length} di ${el.length}`, 39))
        elenco(l, x.zona, {
          voci: el, stato: st, y0: 45, alta: 66, passo: 22,
          clic: (m) => apri(m, x),
          riga(l, m, x0, y, w, on) {
            const o = { inv: on }
            l.bitmap(bm(m.icona, 16), x0 - 2, y + 3, o)
            if (m.stato === 'bloccata' || m.stato === 'fatta') { const b = icone.bitmap(m.stato === 'fatta' ? 'stella' : 'lucchetto', 8); if (b) { l.riempi(x0 + 7, y + 12, 10, 10, on ? 1 : 0); l.bitmap(b, x0 + 8, y + 13, o) } } // (il lucchetto o la stella sull'icona)
            const s = STATI[m.stato]
            destra(l, x0 + w, y + 2, s, o)
            l.testo(x0 + 18, y + 2, corto(m.nome, Math.floor((w - 18 - Lcd.larghezza(s) - 6) / 6)), o)
            l.testo(x0 + 18, y + 11, corto(m.stato === 'bloccata' ? `ti manca: ${m.manca.join(', ')}` : m.breve, Math.floor((w - 18) / 6)), o)
          },
        })
      },
      tasto(k) { return muovi(st, missioni.elenco().length, k) },
    }],
  })
}
