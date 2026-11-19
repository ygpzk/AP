// L'app «giocatori» di pzk os (29.10, Alberto: «crea uno alla volta … giocatori …»): il database dei giocatori sul
// cercapersone zero. I dati sono quelli di chat/db.js (top, notizie, cerca, profilo, io, statistiche) e della lumachina
// (chat/lumaca.mjs, chat/lumaca-avvisi.js), i testi e i tempi quelli dei giocatori del cercapersone vecchio
// (telefono/app/giocatori.js), la faccia quella del profilo (telefono/app/profilo.js).
// - CLASSIFICHE: in cima quale (OK: le diciannove), sotto le posizioni (il podio rovesciato, la faccia, il nome, il valore).
// - NOTIZIE: le cose successe in banca, con l'icona e quanto fa.
// - CERCA: scrivi un nome o un indirizzo (dalla tastiera, o OK sulla riga in cima); i trovati sotto.
// - IO: la lumachina (l'avviso urgente se ha combinato qualcosa: OK «ho capito»), la sua salute, oggi, gli ultimi giorni; il
//   tuo profilo, i rivali, la banca in numeri. Scorre con ↑ ↓.
// - LA SCHEDA di un giocatore (OK su un nome): la faccia, il titolo, il livello, i numeri, le classifiche, i leggendari; sotto
//   «manda $pzk» (lo fa la chat, col comando «manda»).
// Il server può non rispondere: ogni pagina lo dice e i tasti continuano a funzionare.
// (6.11, Alberto: «le classifiche dicono cose diverse da dentro i profili singoli») LA SCHEDA DICE I NUMERI DELLA CLASSIFICA:
// il posto e il valore vengono dalla stessa funzione della banca (i pari merito hanno lo stesso posto: «1° pari»), e accanto
// a ogni posto c'è il valore, così si confronta a occhio con la classifica. Nei numeri ci sono anche i soldi (guadagnati,
// vinti o persi ai giochi) e le mani, quelle del libro dei conti: le stesse della pagina dei giochi del profilo.
// (11.11, Alberto: «fai colori a 8bit su tutto») I COLORI dicono qualcosa, il resto resta d'inchiostro: i soldi presi su una
// targhetta verde e quelli persi su una rossa (anche quelli della lumachina e delle notizie), il podio d'oro, d'argento e di
// bronzo, l'avviso urgente su una fascia gialla, la barra della salute verde, gialla o rossa, quella degli xp blu.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C, esa } from './lcd.js'
import * as icone from './icone.js'
import * as db from '../../../chat/db.js'
import { nomeDi } from '../../../chat/testi.js'
import { fmt, fmtCorto, conto } from '../../../games/pzk.js'
import * as L from '../../../chat/lumaca.mjs'
import { daVedere, visto } from '../../../chat/lumaca-avvisi.js'
import { fa, giornoBreve, pctTesto, pzkTesto, semeSessione } from '../../app/giocatori.js'
import { faccia } from '../../app/profilo.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni, senzaHtml } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('bot', lato)
const facciaDi = (g) => faccia(g.av ?? g.pr?.av, g.mest)
const valore = (m, v) => senzaHtml(db.valoreHtml(m, v))
/** Una richiesta al database con lo stato: null (mai chiesto), 'carico', 'ok', 'no'. L'ultima vince. r.poi(d): una volta sola,
 *  quando la prossima arriva bene (la riga da scegliere: durante il carico la lista è vuota e la scelta si perdeva). */
function richiesta(fai) {
  const r = { st: null, d: null, n: 0, t: 0, poi: null }
  r.carica = (os, ...a) => { const n = ++r.n; r.st = 'carico'; r.t = Date.now(); os.ridisegna(); fai(...a).then((d) => { if (n !== r.n) return; r.st = d?.ok ? 'ok' : 'no'; r.d = d; if (r.st === 'ok') r.poi?.(d); r.poi = null; os.ridisegna() }).catch(() => { if (n === r.n) { r.st = 'no'; r.d = null; r.poi = null; os.ridisegna() } }) }
  r.vecchia = () => !r.st || r.st === 'no' || Date.now() - r.t > 10_000 // (dieci secondi, come la memoria di chat/db.js)
  return r
}
const carico = (l, t, y = 66) => l.testo(Math.round(W / 2 - Lcd.larghezza('carico...') / 2), y, 'carico' + '.'.repeat(1 + (Math.floor(t / 3) % 3)))
const fuori = (l, d, y = 60) => Lcd.acapo(txt(d?.errore ?? 'il database adesso non risponde: il server è in pausa, o sei offline.'), 38).slice(0, 3).forEach((r, i) => centro(l, y + i * 9, r))

let metrica = 'pzk', q = '', ultima = 0
const DONO = 10 // (i $pzk che «manda $pzk» della scheda manda col comando della chat)
const colSegno = (n) => `${n < 0 ? '−' : ''}${fmtCorto(Math.abs(Math.round(n ?? 0)))}`

// ── i colori (11.11): ogni colore è una coppia [fondo, scritta] fissa, su una targhetta. (Un verde o un rosso scritti
// direttamente sullo sfondo non si leggono su tutti: il verde sparisce sull'arancione, il rosso scuro sulla notte. Sulla
// targhetta la scritta è nera o bianca e si legge su ogni sfondo e anche sulla riga scelta, come in quiz.js e sfide.js) ──
const VERDE = [C.verde, C.nero], ROSSO = [esa('#cc0000'), C.bianco], GIALLO = [C.giallo, C.nero]
const MEDAGLIA = { 1: [C.oro, C.nero], 2: [esa('#aaaaaa'), C.nero], 3: [esa('#cc6633'), C.nero] } // (il podio: oro, argento, bronzo; l'argento più chiaro spariva sulla carta)
const XP = C.blu, salute = (s) => (s >= 50 ? C.verde : s >= 20 ? C.giallo : esa('#cc0000'))
/** Una scritta su una targhetta del suo colore, con un pixel d'aria attorno (sta nella riga: 9 pixel). */
const targa = (l, x, y, s, [fondo, col]) => { l.riempi(x - 1, y - 1, Lcd.larghezza(s) + 2, 9, fondo); l.testo(x, y, s, { col }) }
/** Un segno da colorare: src è una regex col pezzo da colorare fra parentesi (gli spazi possono essere un a capo); c è la
 *  coppia, o una funzione del pezzo trovato che la dà (o null: resta d'inchiostro). */
const segno = (src, c) => ({ re: new RegExp(src, 'gd'), c })
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')
const dopo = (prima, testo, c) => segno(`${esc(prima)}(${esc(testo)})`, c) // (il numero dopo il suo nome: «guadagnati 52,2K»)
// i soldi col segno di pzkTesto e pctTesto («+12 $pzk», «−1,68 %»): verdi se più, rossi se meno
const COL_SEGNO = segno('([+−][\\d.,]+[KM]?\\s+(?:\\$pzk|%))', (s) => (s[0] === '+' ? VERDE : ROSSO))
// le notizie (chat/db.js, testoNotizia): la vincita ai giochi verde, il bottino sporco e la galera rossi, la lumachina col segno
const SEGNI_NOTIZIE = [segno('vinto\\s+([\\d.,]+\\s+\\$pzk)', VERDE), segno('([\\d.,]+\\s+\\$pzk\\s+sporchi)', ROSSO), segno('(sei\\s+ore\\s+di\\s+galera)', ROSSO), COL_SEGNO]
/** Dove cadono i segni in righe di testo già andate a capo: Map riga → [{ da, n, c }] in caratteri (un segno spezzato
 *  dall'a capo diventa due pezzi, senza gli spazi ai bordi né il rientro dei punti). */
function pezziColorati(righe, segni) {
  const tutto = righe.join('\n'), inizio = [], fuori = new Map()
  let o = 0
  for (const r of righe) { inizio.push(o); o += r.length + 1 }
  for (const { re, c } of segni) for (const m of tutto.matchAll(re)) {
    const [a, b] = m.indices[1], coppia = typeof c === 'function' ? c(m[1]) : c
    if (!coppia) continue
    for (let i = 0; i < righe.length; i++) {
      const fine = inizio[i] + righe[i].length
      if (fine <= a || inizio[i] >= b) continue
      let da = Math.max(a, inizio[i]) - inizio[i], fino = Math.min(b, fine) - inizio[i]
      while (da < fino && righe[i][da] === ' ') da++
      while (fino > da && righe[i][fino - 1] === ' ') fino--
      if (fino > da) { if (!fuori.has(i)) fuori.set(i, []); fuori.get(i).push({ da, n: fino - da, c: coppia }) }
    }
  }
  return fuori
}
/** Le righe in fila da (x, y), passo 9, coi loro pezzi colorati sopra (le scritte le ha già messe chi chiama). piene: le
 *  stesse righe prima del taglio con «…» (i segni si cercano lì: un «45.000 $pzk sporchi» tagliato in «4…» resta rosso). */
const colora = (l, righe, x, y, segni, piene = righe) => pezziColorati(piene, segni).forEach((ps, i) => ps.forEach((p) => {
  const s = righe[i] ?? '', taglio = s.endsWith('…') && s !== piene[i] ? s.length - 1 : s.length
  if (p.da >= taglio) return
  const fino = p.da + p.n > taglio ? s.length : p.da + p.n // (il pezzo tagliato si prende anche il «…»)
  targa(l, x + p.da * 6, y + i * 9, s.slice(p.da, fino), p.c)
}))
/** I colori sopra quello che ha scritto scorrevole (pezzi.js scrive d'inchiostro): i segni nelle righe di testo, le fasce
 *  dei titoli in titoli { testo: coppia }, la barra del colore barra. (Le misure della fascia e della barra sono quelle di
 *  scorrevole: se cambiano là, vanno cambiate qui) */
function aColori(l, righe, giu, { y0, vis, x0 = 10 }, { segni = [], titoli = {}, barra = null } = {}) {
  const viste = righe.slice(giu, giu + vis)
  viste.forEach((r, i) => {
    const y = y0 + i * 9, c = r.tipo === 'titolo' && titoli[r.s]
    if (c) { l.riempi(x0 - 2, y - 1, W - 12 - (x0 - 8) - 10, 9, c[0]); l.testo(x0, y, r.s, { col: c[1] }) }
    else if (r.tipo === 'barra' && barra) l.riempi(x0 + 1, y + 2, Math.round((W - 12 - (x0 - 8) - 18) * r.k), 3, barra)
  })
  // (i segni si cercano in tutte le righe, anche quelle fuori vista: un numero andato a capo sul bordo resta colorato)
  pezziColorati(righe.map((r) => (r.tipo ? '' : r.s)), segni).forEach((ps, k) => { if (k < giu || k >= giu + vis) return; ps.forEach((p) => targa(l, x0 + p.da * 6, y0 + (k - giu) * 9, righe[k].s.slice(p.da, p.da + p.n), p.c)) })
}

// ── la scelta della classifica ──
function sceltaMetrica(os, poi) {
  const voci = Object.entries(db.METRICHE).map(([id, [nome, , icona]]) => ({ id, nome, icona }))
  const st = { sel: Math.max(0, voci.findIndex((v) => v.id === metrica)), da: 0 }
  const scegli = (v) => { metrica = v.id; poi(); os.togli() } // (poi prima: togliendo, l'entra della pagina carica una volta sola)
  return {
    nome: 'giocatori-metrica', app: 'giocatori',
    disegna(l) {
      l.bitmap(icone.bitmap('trofeo', 16), 8, 14); l.testo(28, 18, 'quale classifica'); l.orizz(6, 31, W - 12)
      elenco(l, os.zona, { voci, stato: st, y0: 34, alta: 84, passo: 12, clic: scegli, riga(l, v, x0, y, w, on) { l.testo(x0, y + 2, corto(v.nome, Math.floor((w - 12) / 6)), { inv: on }); if (v.id === metrica) destra(l, x0 + w, y + 2, '✓', { inv: on }) } })
      centro(l, H - 9, 'OK sceglie · ↑↓')
    },
    tasto(k) { if (muovi(st, voci.length, k)) return true; if (k === 'ok') { scegli(voci[st.sel]); return true } if (k === 'indietro') { os.togli(); return true } return false },
  }
}

// ── la scheda di un giocatore ──
function scheda(os, ind) {
  const r = richiesta(() => db.profilo(ind))
  let giu = 0
  const pronta = () => (r.st === 'ok' || r.st === 'carico') && !!r.d?.ok && !!r.d.profilo // (arrivata, o quella di prima mentre si ricarica)
  // mandare $pzk non si disfa: si conferma, con quanto e a chi (8.6)
  async function manda(p) {
    const s = await os.dialogo({ titolo: 'mandi $pzk?', icona: 'pzk', testo: `mandi ${DONO} $pzk a ${corto(p.nome, 20)} (${p.ind})? Non tornano indietro.`, tasti: ['no', 'sì'] })
    if (s !== 'sì' || os.corrente() !== v) return // (INDIETRO dà null; e si può essere già usciti)
    os.apri('chat', { comando: `manda ${p.ind} ${DONO}` })
  }
  const v = {
    nome: 'giocatori-scheda', app: 'giocatori',
    // (11.11: si ricarica anche tornando, dalla chat dopo «manda» o da un dialogo: restava la scheda di prima, coi $pzk vecchi;
    // la memoria di chat/db.js tiene dieci secondi e si svuota quando il mio conto cambia. Intanto resta quella di prima)
    entra() { if (r.st !== 'carico') r.carica(os) },
    tic(t) { if (r.st === 'carico' && t % 3 === 0) os.ridisegna() },
    disegna(l, t) {
      if (!pronta()) { l.bitmap(icone.bitmap('app-giocatori', 16), 8, 14); l.testo(28, 18, corto(ind, 30)); l.orizz(6, 31, W - 12); if (r.st === 'no') fuori(l, r.d); else carico(l, t); centro(l, H - 9, 'INDIETRO torna'); return }
      const p = r.d.profilo, s = p.s ?? {}, mio = conto()?.ind === p.ind
      l.bitmap(bm(facciaDi(p), 32), 8, 14)
      l.testo(46, 14, corto(p.nome, 33))
      l.testo(46, 23, corto(`${p.titolo ?? ''}${p.mest ? ` · ${nomeDi(p.mest)}` : ''}`, 33))
      const da = 60 * (p.liv - 1) ** 2, k = (p.xp - da) / Math.max(1, (p.xpProssimo ?? 0) - da)
      l.testo(46, 32, corto(`livello ${p.liv} · ${fmt(p.xp)} xp`, 22)); l.riquadro(184, 33, 61, 5); l.riempi(185, 34, Math.round(59 * Math.max(0, Math.min(1, k))), 3, XP)
      l.testo(46, 41, corto(`${p.ind} · in banca da ${fa(p.creato).replace(' fa', '')}${p.ult ? ` · visto ${fa(p.ult)}` : ''}`, 33))
      const pos = Object.entries(p.posizioni ?? {}).filter(([m]) => db.METRICHE[m]).sort((a, b) => a[1].pos - b[1].pos) // (tutte: prima le prime otto)
      const numeri = [['$pzk', fmtCorto(p.pzk)], ['guadagnati', colSegno(s.guadagnati)], [s.persi ? 'persi ai giochi' : 'vinti ai giochi', fmtCorto(s.persi || s.vinti || 0)], ['pescati', s.pescati], ['cacciati', s.cacciati], ['scavati', s.scavati], ['quiz', `${s.quizGiusti ?? 0}/${s.quizTotali ?? 0}`], ['sfide', s.sfideFatte], ['quest', s.missioniFatte], ['morti', s.morti], ...(p.sp ? [['sporchi', fmtCorto(p.sp)]] : []), ['giochi', `${s.giri ?? 0} mani`], ['serie', `${p.serie ?? 0} giorni`]]
      const righe = impagina([
        ...(p.pr?.mot ? [{ testo: `«${p.pr.mot}»` }] : []),
        ...(p.gal ? [{ testo: `in galera fino alle ${new Date(p.gal).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` }] : []),
        { titolo: 'i numeri' }, ...Array.from({ length: Math.ceil(numeri.length / 2) }, (_, i) => ({ testo: numeri.slice(i * 2, i * 2 + 2).map(([n, x]) => `${n} ${typeof x === 'number' ? fmtCorto(x) : x ?? 0}`).join(' · ') })),
        ...(pos.length ? [{ titolo: 'in classifica' }, ...pos.map(([m, x]) => ({ punto: `${db.postoTesto(x)} in ${db.METRICHE[m][0]}: ${valore(m, x.valore)}` }))] : []),
        ...(p.rari?.length ? [{ titolo: 'leggendari presi' }, { testo: p.rari.map(nomeDi).join(', ') }] : []),
      ])
      // (11.11) i soldi presi verdi e quelli persi rossi, la galera rossa, i posti sul podio coi colori delle medaglie
      const segni = [
        ...(s.guadagnati ? [dopo('guadagnati ', colSegno(s.guadagnati), s.guadagnati > 0 ? VERDE : ROSSO)] : []),
        ...(s.persi ? [dopo('persi ai giochi ', fmtCorto(s.persi), ROSSO)] : s.vinti ? [dopo('vinti ai giochi ', fmtCorto(s.vinti), VERDE)] : []),
        ...(p.gal ? [segno('(in galera)', ROSSO)] : []),
        segno('•\\s([123]°(?:\\s+pari)?)\\s+in\\s', (x) => MEDAGLIA[x[0]]),
      ]
      const vis = mio ? 7 : 5
      giu = scorrevole(l, righe, { y0: 52, vis, giu })
      aColori(l, righe, giu, { y0: 52, vis }, { segni })
      if (!mio) bottoni(l, os.zona, { etichette: [`manda ${DONO} $pzk a ${corto(p.nome, 16)}`], sel: 0, y: 99, premi: () => manda(p) }) // (32 lettere al più: sta nella riga)
      centro(l, H - 9, mio ? '↑↓ legge · INDIETRO torna' : 'OK manda · ↑↓ legge')
    },
    tasto(k) {
      if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu++
      else if (k === 'ok') { const p = pronta() && r.d.profilo; if (p && conto()?.ind !== p.ind) manda(p) }
      else if (k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
  return v
}

// ── le pagine ──
export function vista(os) {
  const top = richiesta((m) => db.top(m, 25).then((d) => (d?.ok ? { ...d, metrica: m } : d))), news = richiesta(() => db.notizie()), trova = richiesta((s) => db.cerca(s)), io = richiesta(() => Promise.all([db.io('xp'), db.statistiche()]).then(([a, b]) => ({ ok: true, io: a, stats: b })))
  const stC = { sel: 0, da: 0 }, stN = { sel: 0, da: 0 }, stR = { sel: 0, da: 0 }
  let giuIo = 0, attesaCerca = 0
  const apriScheda = (ind) => os.spingi(scheda(os, ind))
  // (11.11: trova.n++ scarta la risposta di una ricerca vecchia ancora in viaggio: svuotando la riga con INDIETRO a metà
  // attesa, i trovati di «bi» tornavano sotto «cerca:» vuoto, e OK apriva uno di quelli)
  const cercaOra = () => { clearTimeout(attesaCerca); trova.n++; if (!q.trim()) { trova.st = null; trova.d = null; trova.q = ''; os.ridisegna(); return } attesaCerca = setTimeout(() => { trova.q = q.trim(); trova.carica(os, trova.q) }, 300) }
  const animaCarico = (r) => (t) => r.st === 'carico' && t % 3 === 0
  // scelta la classifica, il primo in lista: subito se c'è già, se no quando arriva (il carico lo fa l'entra della pagina, una volta)
  const primo = (d) => { stC.sel = d?.top?.length ? 1 : 0; stC.da = 0 }
  const scegliMetrica = () => os.spingi(sceltaMetrica(os, () => { if (top.m === metrica && top.st === 'ok' && !top.vecchia()) primo(top.d); else top.poi = primo }))
  // (11.11: la classifica di prima resta mentre si ricarica, se è della stessa metrica: tornando da una scheda dopo dieci
  // secondi la lista spariva durante il carico, e la scelta tornava in cima, su «cambia classifica»)
  const listaTop = () => (top.st !== 'no' && top.d?.ok && top.d.metrica === metrica ? top.d.top ?? [] : [])

  const pClassifiche = {
    nome: 'le classifiche', icona: 'trofeo',
    entra: () => { if (top.vecchia() || top.m !== metrica) { top.m = metrica; top.carica(os, metrica) } },
    tic: animaCarico(top),
    aiuto: () => (stC.sel === 0 ? 'OK cambia classifica · ←→ pagine' : 'OK apre la scheda · ↑↓ · ←→ pagine'),
    disegna(l, x, t) {
      const lista = listaTop()
      const voci = [{ scegli: true }, ...lista]
      elenco(l, x.zona, {
        voci, stato: stC, y0: 33, alta: 85, passo: 17,
        clic: (g) => (g.scegli ? scegliMetrica() : apriScheda(g.ind)),
        riga(l, g, x0, y, w, on) {
          const o = { inv: on }
          if (g.scegli) { l.testo(x0, y + 5, corto(db.METRICHE[metrica][0], 24), o); if (lista.length || top.st === 'ok') destra(l, x0 + w, y + 5, `${top.d.giocatori ?? 0} in banca`, o); return } // (niente ▶: qui → sfoglia le pagine, la classifica si cambia con OK)
          // il podio: i primi tre su una medaglia d'oro, d'argento e di bronzo (11.11: prima un quadrato rovesciato, uguale per
          // tutti e tre; il numero nero si legge sulla medaglia con ogni sfondo, anche sulla riga scelta)
          const ps = String(g.pos)
          if (g.pos <= 3) { l.riempi(x0 - 2, y + 3, 14, 11, MEDAGLIA[g.pos][0]); l.testo(x0 + 5 - Math.round(Lcd.larghezza(ps) / 2), y + 5, ps, { col: MEDAGLIA[g.pos][1] }) } else destra(l, x0 + 11, y + 5, ps, o)
          l.bitmap(bm(facciaDi(g), 16), x0 + 16, y, o)
          const v = valore(metrica, g.valore)
          destra(l, x0 + w, y + 5, v, o)
          l.testo(x0 + 36, y + 5, corto(g.nome, Math.floor((w - 36 - Lcd.larghezza(v) - 6) / 6)), o)
        },
      })
      if (top.st === 'carico' && !lista.length) carico(l, t, 74)
      else if (top.st === 'no') fuori(l, top.d, 60)
      else if (top.st === 'ok' && !lista.length) centro(l, 70, corto(`nessuno ha ancora niente in «${db.METRICHE[metrica][0]}»`, 38))
    },
    tasto(k) {
      const lista = listaTop(), n = 1 + lista.length
      if (muovi(stC, n, k)) return true
      if (k === 'ok') { if (stC.sel === 0) scegliMetrica(); else { const g = lista[stC.sel - 1]; if (g) apriScheda(g.ind) } return true }
      return false
    },
  }

  const pNotizie = {
    nome: 'le notizie', icona: 'app-giocatori',
    entra: () => { if (news.vecchia()) news.carica(os) },
    tic: animaCarico(news),
    aiuto: () => (news.d?.notizie?.length ? 'OK apre chi è · ↑↓ · ←→ pagine' : '←→ pagine'), // (11.11: senza notizie, o col server spento, OK non apre niente e il suggerimento lo diceva lo stesso)
    disegna(l, x, t) {
      if (news.st === 'carico' && !news.d?.ok) return carico(l, t) // (11.11: ricaricando dopo una risposta fallita diceva «non è ancora successo niente»)
      if (news.st === 'no') return fuori(l, news.d)
      const lista = news.d?.notizie ?? []
      if (!lista.length) return centro(l, 66, 'in banca non è ancora successo niente.')
      elenco(l, x.zona, {
        voci: lista, stato: stN, y0: 33, alta: 84, passo: 21,
        clic: (n) => apriScheda(n.ind),
        riga(l, n, x0, y, w, on) {
          const o = { inv: on }, tn = db.testoNotizia(n), quando = fa(n.t)
          l.bitmap(bm(tn.icona, 16), x0 - 2, y + 2, o)
          const r = Lcd.acapo(txt(senzaHtml(tn.html)), Math.floor((w - 18) / 6))
          l.testo(x0 + 18, y + 2, r[0] ?? '', o)
          const sec = r.length > 2 ? corto(r.slice(1).join(' '), Math.floor((w - 18 - Lcd.larghezza(quando) - 6) / 6)) : r[1] ?? ''
          const r2 = corto(sec, Math.floor((w - 18 - Lcd.larghezza(quando) - 6) / 6))
          l.testo(x0 + 18, y + 11, r2, o)
          destra(l, x0 + w, y + 11, quando, o)
          colora(l, [r[0] ?? '', r2], x0 + 18, y + 2, SEGNI_NOTIZIE, [r[0] ?? '', r.slice(1).join(' ')]) // (11.11: quanto fa, sulla sua targhetta)
        },
      })
    },
    tasto(k) { return muovi(stN, news.d?.notizie?.length ?? 0, k) || (k === 'ok' && news.d?.notizie?.[stN.sel] ? (apriScheda(news.d.notizie[stN.sel].ind), true) : false) },
  }

  const pCerca = {
    nome: 'cerca', icona: 'lente',
    entra: () => { if (q.trim() && (trova.q !== q.trim() || trova.st === 'no')) cercaOra() }, // (la ricerca fermata dall'esci riparte tornando; 11.11: anche quella fallita, come le altre pagine, se no «non risponde» restava finché non si riscriveva)
    tic: animaCarico(trova),
    aiuto: () => (!q ? 'scrivi un nome, o OK sulla riga in cima' : stR.sel === 0 ? 'OK scrive · ↑↓ · INDIETRO toglie' : 'OK apre · ↑↓ · INDIETRO toglie'), // (11.11: sulla riga in cima OK riapre la tastiera, non apre un trovato)
    disegna(l, x, t) {
      const lista = trova.st === 'ok' ? trova.d.trovati : []
      elenco(l, x.zona, {
        voci: [{ campo: true }, ...lista], stato: stR, y0: 33, alta: 85, passo: 17,
        clic: (g) => (g.campo ? scrivi() : apriScheda(g.ind)),
        riga(l, g, x0, y, w, on) {
          const o = { inv: on }
          if (g.campo) { // (il cursore dopo quello scritto; vuoto, il suggerimento comincia dopo il cursore: copriva la «u», 4.6)
            const s = q ? `cerca «${txt(q)}»` : 'cerca:', xc = x0 + Lcd.larghezza(s) + 2
            l.testo(x0, y + 5, s, o)
            if (!q) l.testo(xc + 7, y + 5, 'un nome, o pzk123456', o)
            if (on && t % 10 < 5) l.riempi(xc, y + 4, 4, 9, 0)
            return
          }
          l.bitmap(bm(facciaDi(g), 16), x0 - 2, y, o)
          destra(l, x0 + w, y + 5, g.ind, o)
          l.testo(x0 + 18, y + 5, corto(`${g.nome} · liv ${g.liv}`, Math.floor((w - 18 - Lcd.larghezza(g.ind) - 6) / 6)), o)
        },
      })
      if (trova.st === 'carico') carico(l, t, 74)
      else if (trova.st === 'no') fuori(l, trova.d, 60)
      else if (trova.st === 'ok' && !lista.length) centro(l, 70, 'nessun giocatore così.')
    },
    tasto(k) {
      const n = 1 + (trova.st === 'ok' ? trova.d.trovati.length : 0)
      if (muovi(stR, n, k)) return true
      if (k === 'ok') { if (stR.sel === 0) scrivi(); else { const g = trova.st === 'ok' && trova.d.trovati?.[stR.sel - 1]; if (g) apriScheda(g.ind) } return true } // (11.11: con la ricerca a metà o fallita la riga scelta può non esserci più)
      if (k === 'indietro' && q) { q = ''; stR.sel = 0; cercaOra(); return true }
      return false
    },
    carattere(ch) { if (q.length < 20) { q += ch; stR.sel = 0; cercaOra() } },
    cancella() { q = [...q].slice(0, -1).join(''); stR.sel = 0; cercaOra() }, // (11.11: come carattere, la scelta torna sulla riga in cima: restava sul posto di un trovato che non c'è più)
    scrivendo: () => q.length > 0,
  }
  async function scrivi() { const s = await os.tastiera({ testo: q, titolo: 'cerca un giocatore' }); if (s !== null && os.corrente() === app) { q = s.trim().slice(0, 20); stR.sel = 0; cercaOra() } } // (8.4: dopo l'attesa, solo se si è ancora qui)

  const pIo = {
    nome: 'io', icona: 'bot',
    entra: () => { if (io.vecchia()) io.carica(os) },
    tic: animaCarico(io),
    aiuto: () => (daVedere().length ? 'OK ho capito · ↑↓ legge · ←→ pagine' : 'OK la tua scheda · ↑↓ legge · ←→ pagine'),
    ok: () => { if (daVedere().length) { visto(); giuIo = 0; os.ridisegna() } else if (conto()) apriScheda(conto().ind) },
    disegna(l, x, t) {
      const c = conto(), oggi = L.giornoDi(), seme = c ? String(c.creato) : semeSessione()
      const gi = L.giornata(seme, oggi), ultime = c?.lumaca?.ultime ?? [], reg = ultime.find((v) => v.g === oggi), ev = (reg && L.evento(reg.ev)) || gi.evento
      const nuove = daVedere(), tot = nuove.reduce((a, v) => a + v.n, 0)
      const prima = c ? ultime.filter((v) => v.g < oggi).slice(-6).reverse().map((v) => ({ g: v.g, s: v.s, ev: L.evento(v.ev), testo: pzkTesto(v.n) }))
        : [1, 2, 3, 4, 5, 6].map((i) => { const g = L.giornoPiu(oggi, -i), y = L.giornata(seme, g); return { g, s: y.salute, ev: y.evento, testo: pctTesto(y.evento.pct) } })
      const p = io.st !== 'no' && io.d?.io?.ok ? io.d.io : null, st = io.st !== 'no' && io.d?.stats?.ok ? io.d.stats.stats : null // (11.11: quelli di prima restano mentre si ricarica: il profilo spariva e il testo saltava sotto chi leggeva)
      const blocchi = [
        ...(nuove.length ? [{ titolo: 'urgente · la tua lumachina' }, { testo: nuove.length === 1 ? 'si è svegliata e ha deciso lei:' : `mentre non c’eri ha vissuto ${nuove.length} giornate:` },
          ...nuove.map((v) => ({ punto: `${giornoBreve(v.g)} · ${L.evento(v.ev)?.titolo ?? v.ev}: ${pzkTesto(v.n)} (${pctTesto(v.pct)})` })), { testo: `in tutto ${pzkTesto(tot)}. OK: ho capito.` }] : []),
        { titolo: 'la lumachina' }, { testo: `oggi è ${gi.umore} · salute ${gi.salute.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %` }, { barra: gi.salute / 100 },
        { testo: `oggi · ${ev.titolo}: ${ev.testo}` },
        { testo: c ? (reg ? `ha fatto ${pctTesto(reg.pct)}, ${pzkTesto(reg.n)}` : `${pctTesto(ev.pct)}: la banca la registra quando il conto si sincronizza`) : ev.pct ? `senza conto non tocca i tuoi $pzk (col conto: ${pctTesto(ev.pct)})` : 'oggi non sposta un $pzk' },
        ...(prima.length ? [{ titolo: 'gli ultimi giorni' }, ...prima.map((v) => ({ punto: `${giornoBreve(v.g)} · ${Math.round(v.s)} % · ${v.ev?.titolo ?? ''} · ${v.testo}` }))] : []),
        { testo: 'ogni giorno si sveglia e decide lei com’è la giornata. Tu non puoi farci niente.' },
        ...(p ? [{ titolo: 'il tuo profilo' }, { testo: `${p.profilo.nome} · livello ${p.profilo.liv} · ${fmt(p.profilo.xp)} xp` },
          ...(p.vicini ? [{ titolo: 'i tuoi rivali (esperienza)' }, { punto: `sei ${db.postoTesto(p.vicini)} su ${p.vicini.totale}, con ${fmt(p.vicini.io)} xp` }, p.vicini.su ? { punto: `da superare: ${p.vicini.su.nome}, ${p.vicini.su.pos}°, ancora ${fmt(p.vicini.su.valore - p.vicini.io)} xp` } : { punto: 'nessuno ne ha più di te' }, ...(p.vicini.giu ? [{ punto: `ti insegue: ${p.vicini.giu.nome}, ${p.vicini.giu.pos}°, ${fmt(p.vicini.io - p.vicini.giu.valore)} xp dietro` }] : [])] : [])]
          : io.st === 'carico' ? [{ titolo: 'il tuo profilo' }, { testo: 'carico…' }] : [{ titolo: 'il tuo profilo' }, { testo: io.d?.io?.errore ?? 'il database adesso non risponde.' }]),
        ...(st ? [{ titolo: 'la banca in numeri' }, { testo: `${st.giocatori} giocatori · ${st.attivi24h} attivi oggi · ${st.attivi7g} in settimana` }, { testo: `${fmtCorto(st.pzk)} $pzk in giro · livello medio ${st.livelloMedio}` }, { testo: `pescati ${fmtCorto(st.pescati)} · quiz ${fmtCorto(st.quizGiusti)} · sfide ${fmtCorto(st.sfideFatte)} · quest ${fmtCorto(st.missioniFatte)}` }] : []),
      ]
      // (11.11) l'avviso urgente su una fascia gialla, la salute col suo colore, quello che la lumachina ha fatto col segno
      const righe = impagina(blocchi)
      giuIo = scorrevole(l, righe, { y0: 34, vis: 9, giu: giuIo })
      aColori(l, righe, giuIo, { y0: 34, vis: 9 }, { segni: [COL_SEGNO], titoli: { 'urgente · la tua lumachina': GIALLO }, barra: salute(gi.salute) })
    },
    tasto(k) { if (k === 'su') { giuIo = Math.max(0, giuIo - 1); return true } if (k === 'giu') { giuIo++; return true } return false },
  }

  const app = pagine(os, {
    nome: 'giocatori', app: 'giocatori', iniziale: ultima,
    pagine: [pClassifiche, pNotizie, pCerca, pIo],
    esci: (x) => { ultima = x.pag; clearTimeout(attesaCerca) }, // (la ricerca in attesa non parte a app chiusa: 6.2)
  })
  return app
}
