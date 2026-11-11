// L'app «sfide» di pzk os (29.10, Alberto: «crea uno alla volta shop, pzkstore, sfide, …»): le tre sfide di oggi sul
// cercapersone zero. Le sfide, i premi, la serie e il bonus sono quelli di chat/sfide.js (oggi, riscuoti, riscuotiBonus: dal
// 31.10 azioni della banca, con la rotellina in fondo mentre risponde);
// dove si fa ogni sfida e il conto alla rovescia vengono dalle sfide del cercapersone vecchio (telefono/app/sfide.js).
// - IN CIMA: i giorni di fila, quante oggi, i tre pallini (pieno: fatta, a metà: pronta), quando arrivano le nuove.
// - LE RIGHE (↑ ↓): le tre sfide (l'icona, la difficoltà e cosa fare, la barra, a che punto sei, il premio) e il bonus del
//   giorno. OK: «riscuoti» se è pronta, «vai» se no (si apre l'app dove si fa: la chat col comando giusto, lo shop, il quiz…),
//   «prendi» per il bonus. Riscuotere suona la moneta.
// - I COLORI (11.11, Alberto: «fai colori a 8bit su tutto»): oro quello che aspetta di essere riscosso, verde quello già
//   riscosso, blu la strada che manca. Il testo resta d'inchiostro; le targhette hanno il testo nero sul loro colore.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import * as sfide from '../../../chat/sfide.js'
import { fmt, fmtCorto, serverOnline, fai as chiedi } from '../../../games/pzk.js'
import { DOVE, aMezzanotte } from '../../app/sfide.js'
import { corto, destra, centro, elenco, muovi, pagine } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-sfide', lato)
/** Le righe: le tre sfide e il bonus. */
const righe = () => { const o = sfide.oggi(); return [...o.sfide.map((x) => ({ sfida: x })), { bonus: o }] }
/** Il bonus come arriva davvero: la formula della banca (livello, bonus «paga» e «sfide»); oggi() lo dà senza. */
const bonusVero = (n) => Math.round(n * zaino.moltiplicatore() * (1 + zaino.bonus('sfide')) * 2) / 2
/** Dove si fa una sfida: [app, comando]; posta: i $pzk che il comando punta (slot 20), se ne punta. */
const dove = (s) => { const [app, comando] = DOVE[s.id] ?? ['chat'], m = /^\S+ (\d+)$/.exec(comando ?? ''); return { app, comando, posta: m ? Number(m[1]) : 0 } }
const NOMI = { negozio: 'lo shop', quiz: 'il quiz', missioni: 'le quest', chat: 'la chat' }
/** Le sfide non ci sono perché la banca non risponde (e non perché le sta preparando): prepara() riprova a ogni disegno. */
const muta = () => serverOnline() === false
/** I colori dei tre stati (11.11): pronta da riscuotere, riscossa, ancora da fare. */
const ORO = C.oro, FATTA = C.verde, STRADA = C.blu
/** Una targhetta a colori allineata a destra in xd (11.11): il testo nero sul colore, che si legge su ogni sfondo e anche
 *  sulla fascia della riga scelta (un testo verde o oro sullo sfondo arancione o carta non si leggeva). */
const targa = (l, xd, y, s, col) => { const w = Lcd.larghezza(s); l.riempi(xd - w - 2, y - 1, w + 4, 9, col); l.testo(xd - w, y, s, { col: C.nero }) }

export function vista(os) {
  const st = { sel: 0, da: 0 }
  async function fai(r, x) {
    if (r.bonus) {
      const o = r.bonus
      if (o.bonusRiscosso) return x.dì(true, `bonus già preso · serie di ${o.serie}`) // (11.11: «il bonus l’hai già preso: serie di 7» non ci stava nella striscia)
      if (!o.sfide.length) { // (11.11: «prima le tre sfide» quando le sfide non c'erano ancora. E «aspetta» non bastava: se la
        // prima richiesta della banca era partita prima dell'accesso, o era stata rifiutata, non ne partiva un'altra e l'app restava
        // per sempre su «la banca prepara le sfide…». OK le chiede di nuovo, con la stessa azione 'sfide.oggi', e dice cosa risponde)
        const e = await x.aspetta('chiedo le sfide', () => chiedi('sfide.oggi'))
        if (!e || !x.qui()) return
        if (!e.ok) return x.dì(false, e.errore ?? 'la banca non risponde: riprova')
        return sfide.oggi().sfide.length ? undefined : x.dì(false, 'la banca prepara le sfide: aspetta')
      }
      if (!o.bonusPronto) return x.dì(false, 'prima le tre sfide')
      const e = await x.aspetta('riscuoto', () => sfide.riscuotiBonus())
      if (!e || !x.qui()) return
      if (!e.ok) return x.dì(false, e.errore)
      os.suoni.sigla('moneta')
      return x.dì(true, `+${fmt(e.pzk)} $pzk e una cassa · serie ${e.serie}`)
    }
    const s = r.sfida
    if (s.riscossa) return x.dì(true, 'questa è fatta e riscossa')
    if (s.pronta) {
      const e = await x.aspetta('riscuoto', () => sfide.riscuoti(s.id))
      if (!e || !x.qui()) return
      if (!e.ok) return x.dì(false, e.errore)
      os.suoni.sigla('moneta')
      return x.dì(true, `+${fmt(e.pzk)} $pzk e +${e.xp} xp${e.livello ? ` · livello ${e.livello}!` : ''}`)
    }
    const { app, comando, posta } = dove(s)
    if (posta) { // (vinci: «slot 20» punta 20 $pzk appena si apre la chat: prima si chiede)
      const s2 = await os.dialogo({ titolo: 'giochi?', icona: 'pzk', testo: `in chat parte «${comando}»: punti ${fmt(posta)} $pzk puliti, e si possono perdere.`, tasti: ['no', 'gioca'] })
      if (s2 !== 'gioca' || !x.qui()) return
    }
    os.apri(app, comando ? { comando } : {})
  }
  const aiuto = () => {
    const r = righe()[st.sel]
    if (!r) return ''
    if (r.bonus) return r.bonus.bonusPronto ? 'OK prendi il bonus · ↑↓' : r.bonus.sfide.length ? '↑↓ sceglie' : 'OK chiede le sfide' // (11.11: con la sola riga del bonus ↑ ↓ non scelgono niente; OK le richiede)
    if (r.sfida.riscossa) return '✓ fatta · ↑↓ sceglie'
    if (r.sfida.pronta) return 'OK riscuoti · ↑↓ sceglie'
    const { app, comando, posta } = dove(r.sfida) // (dice cosa parte: in chat il comando va subito)
    return posta ? `OK gioca ${fmt(posta)} $pzk in chat · ↑↓` : comando ? `OK fa «${comando}» in chat · ↑↓` : `OK apre ${NOMI[app] ?? app} · ↑↓`
  }
  return pagine(os, {
    nome: 'sfide', app: 'sfide',
    ascolta: [(f) => zaino.ascolta(f)],
    entra: () => { if (!sfide.oggi().sfide.length) chiedi('sfide.oggi') }, // (11.11: chat/sfide.js chiede il giorno una volta sola, anche se era per l'ospite o per un altro conto: aprendo l'app si richiede, e le sfide arrivano col conto)
    pagine: [{
      nome: 'le sfide di oggi', icona: 'app-sfide', aiuto,
      ok: (x) => { const r = righe()[st.sel]; if (r) fai(r, x) },
      tic: (t) => t % 300 === 0, // (il conto alla rovescia, a minuti)
      disegna(l, x) {
        const o = sfide.oggi(), fatte = o.sfide.filter((s) => s.riscossa).length
        // in cima: la serie, oggi, i pallini, le nuove
        l.testo(10, 34, corto(`${o.serie} di fila · oggi ${fatte}/3`, 26))
        // (11.11: i pallini a colori, col bordo d'inchiostro: pieni verdi le riscosse, a metà oro le pronte; la metà resta per
        // chi distingue male i colori)
        o.sfide.forEach((s, i) => { const xp = 170 + i * 9; l.riquadro(xp, 34, 7, 7); if (s.riscossa) l.riempi(xp + 1, 35, 5, 5, FATTA); else if (s.pronta) l.riempi(xp + 1, 37, 5, 3, ORO) })
        l.testo(10, 43, o.sfide.length ? `nuove fra ${aMezzanotte()}` : muta() ? 'la banca non risponde: riprovo…' : 'la banca prepara le sfide…') // (31.10: il giorno lo prepara la banca; 11.11: senza rete diceva che le preparava)
        elenco(l, x.zona, {
          voci: righe(), stato: st, y0: 53, alta: 63, passo: 21,
          clic: (r) => fai(r, x),
          riga(l, r, x0, y, w, on) {
            const o2 = { inv: on }
            if (r.bonus) {
              const b = r.bonus
              l.bitmap(bm(b.bonusRiscosso ? 'stella' : 'regalo', 16), x0 - 2, y + 2, o2)
              // (11.11: «prendi ▶» sta sulla seconda riga, a destra come il premio delle sfide: sulla prima tagliava «e una
              // cassa» in «e una cas…». E la serie sale oggi, quando si prende il bonus: «domani la serie a 7» non ci stava, e
              // a 7 di fila diceva 8. Quella vera è nel bonus del giorno di chat/sfide.js: +10 % a giorno di fila)
              const su = b.bonusRiscosso ? '✓' : '', giu = b.bonusPronto && !b.bonusRiscosso ? 'prendi ▶' : ''
              const poi = Math.round((b.bonusGiorno / sfide.BONUS_GIORNO.pzk - 1) * 10) + 1
              if (su) targa(l, x0 + w, y + 2, su, FATTA) // (11.11: il ✓ verde, il «prendi ▶» oro come i soldi che aspettano)
              if (giu) targa(l, x0 + w, y + 11, giu, ORO)
              const via = (s) => (s ? Lcd.larghezza(s) + 6 : 0)
              l.testo(x0 + 18, y + 2, corto(b.bonusRiscosso ? 'bonus del giorno: preso, a domani' : `bonus: ${fmt(bonusVero(b.bonusGiorno))} $pzk e una cassa`, Math.floor((w - 18 - via(su)) / 6)), o2)
              const sotto = b.bonusRiscosso ? `serie di ${b.serie}` : [b.bonusPronto ? '' : 'fai tutte e tre', b.serie && poi > b.serie ? `la serie va a ${poi}` : ''].filter(Boolean).join(' · ')
              l.testo(x0 + 18, y + 11, corto(sotto, Math.floor((w - 18 - via(giu)) / 6)), o2)
              return
            }
            const s = r.sfida
            l.bitmap(bm(s.icona, 16), x0 - 2, y + 2, o2)
            const stato = s.riscossa ? '✓' : s.pronta ? 'riscuoti ▶' : 'vai ▶'
            if (s.riscossa || s.pronta) targa(l, x0 + w, y + 2, stato, s.riscossa ? FATTA : ORO); else destra(l, x0 + w, y + 2, stato, o2)
            l.testo(x0 + 18, y + 2, corto(`${s.nome}: ${s.testo}`, Math.floor((w - 18 - Lcd.larghezza(stato) - 6) / 6)), o2)
            // la barra, a che punto sei, il premio
            // (11.11: i traguardi in $pzk crescono col livello: «123456/207000» finiva sotto il premio. La barra si accorcia, e
            // se non basta i numeri si scrivono corti, 123,5K)
            const premio = `+${fmt(s.premio.pzk)} · +${s.premio.xp} xp`, spazio = w - 18 - Lcd.larghezza(premio) - 9
            let quanto = `${fmt(s.fatto)}/${fmt(s.target)}`
            if (spazio - 4 - Lcd.larghezza(quanto) < 40) quanto = `${fmtCorto(s.fatto)}/${fmtCorto(s.target)}`
            const bw = Math.max(16, Math.min(60, spazio - 4 - Lcd.larghezza(quanto))), k = Math.max(0, Math.min(1, s.fatto / Math.max(1, s.target)))
            // (11.11: la barra si riempie del colore del suo stato: blu la strada, oro pronta, verde riscossa)
            l.riquadro(x0 + 18, y + 12, bw, 5, on ? 0 : 1); l.riempi(x0 + 19, y + 13, Math.round((bw - 2) * k), 3, s.riscossa ? FATTA : s.pronta ? ORO : STRADA)
            l.testo(x0 + 18 + bw + 4, y + 11, quanto, o2)
            destra(l, x0 + w, y + 11, premio, o2)
          },
        })
      },
      tasto(k, x) { // (→ fa quello che dice il ▶ della riga: prendi, riscuoti, vai; 3.3)
        if (k === 'dx') { const r = righe()[st.sel]; if (r) fai(r, x); return true }
        return muovi(st, righe().length, k)
      },
    }],
  })
}
