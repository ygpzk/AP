// L'app «decifratore» di pzk os (1.11, Alberto: «sì» a farla, dopo che il cercapersone nero se n'era andato con la sua):
// apre i wallet pzk cifrati e le chiavette usb che lo spazzino trova sul nastro. I giochini li prepara la banca
// (giochi/app-decifratore.mjs: tre codici, due errori perdonati, al terzo il pezzo si blocca) e la banca paga
// (wallet.mjs, decifra: tre al giorno); la logica è quella di telefono/app/decifratore.js (DOMANDE, DENTRO, TIPI, pezzi,
// decifratiOggi, apri, risolvi): qui c'è solo la faccia (a colori dall'11.11). Si compra nel pzkstore.
// - I PEZZI: quanti se ne sono aperti oggi (tre caselle), i pezzi nello zaino (icona, nome, quanti, quanto c'è dentro);
//   OK apre quello scelto. Senza pezzi, in galera o a tre al giorno: perché no.
// - IL CODICE (una vista sopra): il pezzo, a che codice sei e le vite; la domanda, il codice grande nel riquadro e le quattro
//   risposte in due file (la croce le sceglie, OK risponde, il clic pure). Giusta: il prossimo; sbagliata: un altro codice e
//   una vita in meno. Alla fine il lucchetto che salta e i $pzk, o il pezzo bloccato.
// - COME FUNZIONA: le regole, che scorrono.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C, esa, colore } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { DOMANDE, DENTRO, TIPI, pezzi, decifratiOggi, apri, risolvi } from '../../app/decifratore.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole } from './pezzi.js'

const fmt = (n) => pzk.fmt(n ?? 0)
const AL_GIORNO = 3
const ROMA = { timeZone: 'Europe/Rome' }
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { ...ROMA, hour: '2-digit', minute: '2-digit' })
const nome = (id) => TIPI[id][1]
const il = (id) => `${TIPI[id][0] === 'chiavetta' ? 'la' : 'il'} ${nome(id)}` // (11.11: «collego il chiavetta usb…»)
const dentro = (id) => DENTRO[TIPI[id][0]]

// (11.11, Alberto: «fai colori a 8bit su tutto») pochi colori, ognuno col suo senso: verde quello che va (il codice giusto, i
// $pzk, i pezzi aperti oggi), rosso quello che si perde (le vite, il pezzo bloccato, la galera), giallo l'avviso. Le scritte
// stanno su una fascia piena col loro testo fisso (nero sul verde e sul giallo, bianco sul rosso scuro), così si leggono su
// ogni sfondo: il verde acceso sull'arancione e il rosso scuro su «notte», da soli, sparivano
const VERDE = C.verde, ROSSO = esa('#cc0000'), GIALLO = C.giallo, NERO = C.nero, BIANCO = C.bianco
const SPENTA = colore(128, 128, 128) // (la vita persa: un grigio medio, che si vede su «carta», «notte» e arancione)
/** Una fascia piena di colore col testo centrato sopra (scala 1 o 2). */
function fascia(l, y, s, fondo, col, scala = 1) {
  const w = Lcd.larghezza(s, scala) + 4 * scala + 4
  l.riempi(Math.round(W / 2 - w / 2), y - 2 * scala, w, 11 * scala, fondo)
  centro(l, y, s, { scala, col })
}

const REGOLE = [
  { titolo: 'il decifratore' },
  { testo: 'Apre i wallet pzk cifrati e le chiavette usb che lo spazzino di uffici trova sul nastro, in chat.' },
  { titolo: 'come si apre' },
  { testo: 'Ogni pezzo ha tre codici, uno dopo l’altro: la parola spostata di una lettera, il numero in binario, la sequenza da completare, la parola allo specchio.' },
  { punto: 'due errori si perdonano' },
  { punto: 'al terzo il pezzo si blocca: resta nello zaino e si riprova' },
  { titolo: 'cosa c’è dentro' },
  { punto: `un wallet: da ${fmt(DENTRO.wallet[0])} a ${fmt(DENTRO.wallet[1])} $pzk` },
  { punto: `una chiavetta: da ${fmt(DENTRO.chiavetta[0])} a ${fmt(DENTRO.chiavetta[1])} $pzk` },
  { testo: 'Soldi puliti, dal fondo dei portafogli smarriti. Tre pezzi al giorno: poi il decifratore si scalda.' },
]

// ── il codice da risolvere (la vista sopra la lista) ──
function codice(os, id, v0, avvisa) {
  let v = v0, sel = 0, attesa = null, esito = null, fine = null, salto = 0
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 3000 }; os.ridisegna() }
  const qui = () => os.corrente() === g
  // l'esito in fondo sulla fascia del suo colore (11.11: verde il giusto, rosso lo sbagliato; ✓ e ! restano per chi non distingue i colori)
  const segna = (l) => {
    if (!esito || Date.now() >= esito.fino) return false
    l.riempi(10, H - 11, W - 20, 10, esito.ok ? VERDE : ROSSO)
    centro(l, H - 9, `${esito.ok ? '✓' : '!'} ${corto(esito.testo, 35)}`, { col: esito.ok ? NERO : BIANCO })
    return true
  }
  async function rispondi(k) {
    if (attesa || fine || !v?.prova) return
    sel = k
    attesa = 'controllo il codice…'; esito = null; os.ridisegna()
    const d = await risolvi(v.prova.scelte[k]).finally(() => { attesa = null; os.ridisegna() })
    if (!qui()) return
    if (!d.ok) { os.suoni.bip('pagerGiu'); return dì(false, d.errore) }
    const e = d.e
    if (e.bloccato) { fine = { bloccato: true, sparito: !!e.sparito }; os.suoni.sigla('decifratore-bloccato'); return }
    if (e.risolto) return paga()
    if (!e.prova) { fine = { errore: 'la banca non ha mandato il codice dopo: riapri il pezzo' }; os.suoni.bip('pagerGiu'); return } // (11.11: senza codice il disegno cadeva su p.k)
    v = e; sel = 0
    if (e.giusta) { os.suoni.sigla('decifratore-giusto'); dì(true, `giusto: codice ${e.i + 1} di 3`) }
    else { os.suoni.bip('pagerGiu'); dì(false, 'sbagliato: ecco un altro codice') }
  }
  async function paga() {
    if (attesa) return
    attesa = 'apro il pezzo…'; os.ridisegna()
    const d = await pzk.decifra(TIPI[id][0]).finally(() => { attesa = null; os.ridisegna() })
    if (!qui()) { if (d?.ok) avvisa?.(`aperto: +${fmt(d.fatto?.n)} $pzk puliti`); return } // (11.11: con INDIETRO mentre la banca pagava, i $pzk arrivavano senza che nessuno lo dicesse)
    // (11.11: senza rete «riprova» diceva il vero solo rifacendo i tre codici: il codice risolto resta sulla banca, OK chiede di nuovo i $pzk)
    if (!d?.ok) { fine = { errore: d?.errore ?? 'la banca non risponde: riprova', paga: !d || !!d.offline }; os.suoni.bip('pagerGiu'); return }
    fine = { n: d.fatto?.n ?? 0 }
    salto = 10
    os.suoni.sigla('decifratore-aperto')
  }
  const g = {
    nome: 'decifratore-codice', app: 'decifratore',
    tic(t) {
      let ancora = !!attesa
      if (esito && Date.now() >= esito.fino) { esito = null; ancora = true }
      if (salto > 0) { salto--; ancora = true }
      if (ancora) os.ridisegna()
    },
    disegna(l, t) {
      const y0 = os.BARRA + 3
      if (fine) {
        // la fine: il lucchetto che salta aperto, o quello chiuso
        const su = fine.n !== undefined ? [0, 3, 6, 8, 9, 9, 8, 6, 3, 1, 0][10 - salto] ?? 0 : 0
        l.bitmap(icone.bitmap(fine.n !== undefined ? 'pzk' : 'lucchetto', 32), 112, y0 + 4 - su)
        if (fine.n !== undefined) {
          centro(l, y0 + 44, 'aperto!', { scala: 2 })
          if (fine.n > 0) fascia(l, y0 + 64, `+${fmt(fine.n)} $pzk puliti`, VERDE, NERO) // (11.11 i soldi guadagnati, verdi)
          else centro(l, y0 + 64, `+${fmt(fine.n)} $pzk puliti`)
          centro(l, y0 + 75, fine.n > 0 ? 'dal fondo dei portafogli smarriti' : 'il fondo dei portafogli smarriti è vuoto') // (11.11: la banca paga quello che c'è nel fondo, anche zero)
        } else {
          if (fine.errore) fascia(l, y0 + 44, 'non si apre', GIALLO, NERO, 2) // (11.11 l'avviso giallo: la rete, si riprova)
          else fascia(l, y0 + 44, 'bloccato', ROSSO, BIANCO, 2) // (11.11 il pezzo perso per oggi, rosso)
          const s = fine.errore ?? (fine.sparito ? `${il(id)} non è più nello zaino` : `tre errori: il pezzo resta nello zaino. Riprova quando vuoi.`)
          Lcd.acapo(txt(s), 39).slice(0, 3).forEach((r, i) => centro(l, y0 + 64 + i * 9, r))
        }
        if (striscia(l, { esito: null, attesa }, t)) return
        const a = fine.paga ? 'OK riprova · INDIETRO ai pezzi' : 'OK torna ai pezzi', a1 = a.split(' · ')[0]
        centro(l, H - 9, a); os.zona(Math.round(W / 2 - Lcd.larghezza(a) / 2) - 3, H - 11, Lcd.larghezza(a1) + 6, 11, () => (fine.paga ? paga() : os.togli()))
        return
      }
      const p = v.prova, dom = DOMANDE[p.k]?.(p.codice) ?? { testo: 'qual è la risposta?', codice: p.codice }
      // la testa: il pezzo, a che codice sei, le vite
      l.bitmap(icone.bitmap(id, 16), 8, y0 - 2)
      l.testo(28, y0 + 2, corto(nome(id), 20))
      // (11.11 le vite rosse e quelle perse grigie: prima le perse sparivano, ora si contano a colpo d'occhio)
      const vive = Math.max(0, 3 - v.errori), xc = W - 8 - Lcd.larghezza('♥♥♥')
      for (let i = 0; i < 3; i++) l.testo(xc + i * 6, y0 + 2, '♥', { col: i < vive ? ROSSO : SPENTA })
      destra(l, xc - 7, y0 + 2, `${v.i + 1} di 3`)
      l.orizz(6, y0 + 14, W - 12)
      // la domanda (al più tre righe) e il codice nel riquadro (a scala 2 se ci sta)
      Lcd.acapo(txt(dom.testo), 39).slice(0, 3).forEach((r, i) => l.testo(8, y0 + 17 + i * 9, r))
      const c = txt(dom.codice), sc = Lcd.larghezza(c, 2) <= W - 24 ? 2 : 1
      // (11.11 il codice su uno schermino nero a fosfori verdi, come un terminale: fondo e testo fissi, si legge su ogni sfondo)
      l.riquadro(8, 58, W - 16, 18); l.riempi(9, 59, W - 18, 16, NERO)
      centro(l, sc === 2 ? 60 : 63, c, { scala: sc, col: VERDE })
      // le quattro risposte, in due file
      p.scelte.slice(0, 4).forEach((s, k) => {
        const x = k % 2 ? 130 : 8, y = k < 2 ? 80 : 94, w = 118, on = k === sel
        if (on) l.riempi(x, y, w, 12); else l.cornice(x, y, w, 12)
        const r = corto(s, 18)
        l.testo(Math.round(x + w / 2 - Lcd.larghezza(r) / 2), y + 3, r, { inv: on })
        if (!attesa) os.zona(x, y, w, 12, () => rispondi(k))
      })
      if (!striscia(l, { esito: null, attesa }, t) && !segna(l)) centro(l, H - 9, '↑↓←→ sceglie · OK risponde')
    },
    tasto(k) {
      if (k === 'indietro') { os.togli(); return true } // (il pezzo resta nello zaino: riaprendolo, i codici ripartono)
      if (attesa) return true
      if (fine) { if (k === 'ok' || k === 'dx') { if (fine.paga) paga(); else os.togli() } return true } // (11.11: un tasto solo, OK e → fanno lo stesso)
      if (k === 'su' || k === 'giu') sel ^= 2
      else if (k === 'sx' || k === 'dx') sel ^= 1
      else if (k === 'ok') rispondi(sel)
      else return false
      return true
    },
  }
  return g
}

// ── i pezzi ──
export function vista(os) {
  const st = { sel: 0, da: 0, id: null }
  // (11.11: il cursore si ricorda per chiave, REGOLE 3.12: con la sola chiavetta scelta, un wallet nuovo dal nastro le passava davanti e OK apriva lui)
  // (11.11: anche senza un tasto premuto: la chiavetta scelta da sé aveva st.id null, e il wallet le passava davanti lo stesso; il pezzo sparito torna al primo)
  const ipezzi = () => { const P = pezzi(), k = P.findIndex(([id]) => id === st.id); st.sel = k >= 0 ? k : st.id ? 0 : st.sel; st.id = P[Math.min(st.sel, P.length - 1)]?.[0] ?? null; return P }
  const tieni = () => { st.id = pezzi()[st.sel]?.[0] ?? null }
  // perché oggi non si apre niente: [la riga sotto la lista, il messaggio corto in fondo quando si preme OK]
  const fermo = () => (pzk.inGalera() ? [`in galera fino alle ${ora(pzk.galera())}: i computer non si toccano`, `in galera fino alle ${ora(pzk.galera())}`] : decifratiOggi() >= AL_GIORNO ? ['tre al giorno: il decifratore si scalda. Domani', 'tre al giorno: torna domani'] : null)
  async function apriPezzo(x, id) {
    const no = fermo()
    if (no) return x.dì(false, no[1])
    const d = await x.aspetta(`collego ${il(id)}…`, () => apri(id))
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore)
    if (!d.v?.prova) return x.dì(false, 'la banca non ha mandato il codice: riprova')
    os.spingi(codice(os, id, d.v, (testo) => { if (x.qui()) { x.dì(true, testo); os.suoni.sigla('decifratore-aperto') } })) // (il pagamento finito dopo INDIETRO: lo dice la lista, se è lei in cima)
  }
  const lista = {
    nome: 'decifra', icona: 'app-decifratore',
    aiuto: () => (!pezzi().length || fermo() ? '←→ pagine' : pezzi().length > 1 ? 'OK decifra · ↑↓ sceglie · ←→ pagine' : 'OK decifra · ←→ pagine'),
    ok(x) { const p = ipezzi()[st.sel]; if (p) apriPezzo(x, p[0]) },
    disegna(l, x) {
      // oggi: tre caselle, piene quelle già aperte (11.11 verdi; rosse tutte e tre quando il decifratore si scalda)
      const n = Math.min(AL_GIORNO, decifratiOggi()), piena = n >= AL_GIORNO ? ROSSO : VERDE
      l.testo(10, 34, 'aperti oggi')
      for (let i = 0; i < AL_GIORNO; i++) { const xx = 82 + i * 9; l.riquadro(xx, 34, 7, 7); if (i < n) l.riempi(xx + 1, 35, 5, 5, piena) }
      destra(l, 245, 34, `${n} di ${AL_GIORNO}`)
      const P = ipezzi(), no = fermo()
      if (!P.length) {
        l.bitmap(icone.bitmap('wallet-pzk', 32), 10, 50)
        l.testo(50, 50, 'niente da decifrare')
        Lcd.acapo('I wallet e le chiavette li trova lo spazzino di uffici sul nastro: in chat, il lavoro da spazzino.', 32).slice(0, 4).forEach((r, i) => l.testo(50, 62 + i * 9, r))
        return
      }
      elenco(l, x.zona, {
        voci: P, stato: st, y0: 46, alta: 40, passo: 20,
        clic: ([id]) => { st.id = id; apriPezzo(x, id) },
        riga(l, [id, q], x0, y, w, on) {
          const o = { inv: on }, [da, a] = dentro(id)
          l.bitmap(icone.bitmap(id, 16), x0 - 2, y + 2, o)
          destra(l, x0 + w, y + 2, `× ${q}`, o)
          l.testo(x0 + 18, y + 2, corto(nome(id), 24), o)
          l.testo(x0 + 18, y + 11, corto(`dentro da ${fmt(da)} a ${fmt(a)} $pzk`, 30), o)
        },
      })
      if (!no) { l.testo(10, 92, 'tre codici per pezzo: al terzo errore si blocca'); return }
      // (11.11 perché oggi no, su una fascia: rossa la galera, gialla col ⚠ il decifratore che si scalda)
      const gal = pzk.inGalera(), righe = Lcd.acapo(gal ? no[0] : `⚠ ${no[0]}`, 38).slice(0, 2)
      l.riempi(8, 90, W - 16, righe.length * 9 + 3, gal ? ROSSO : GIALLO)
      righe.forEach((r, i) => l.testo(10, 92 + i * 9, r, { col: gal ? BIANCO : NERO }))
    },
    tasto(k) { const n = ipezzi().length; if (!muovi(st, n, k)) return false; tieni(); return true },
  }
  let giu = 0
  const VIS = 9
  const regole = {
    nome: 'come funziona', icona: 'lucchetto',
    aiuto: '↑↓ legge · ←→ pagine',
    disegna(l) { giu = scorrevole(l, impagina(REGOLE), { y0: 34, vis: VIS, giu }) },
    tasto(k) {
      if (k === 'su') { giu = Math.max(0, giu - 1); return true }
      if (k === 'giu') { giu = Math.min(giu + 1, Math.max(0, impagina(REGOLE).length - VIS)); return true }
      return false
    },
  }
  return pagine(os, {
    nome: 'decifratore', app: 'decifratore',
    pagine: [lista, regole],
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
  })
}
