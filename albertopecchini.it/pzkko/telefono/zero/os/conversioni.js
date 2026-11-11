// L'app «bin·hex» di pzk os (29.10, Alberto: «crea uno alla volta … bin&hex …»): le conversioni fra le basi sul cercapersone
// zero. I conti sono quelli dell'app vecchia (telefono/app/conversioni.js: leggi, scritto, c2, passi, coi BigInt e la parte
// dopo la virgola), e la scelta si ricorda con la sua (telefono/ricordi.js, «conversioni»): qui c'è la faccia a un bit.
// - LE RIGHE (↑ ↓, in tondo): il numero (OK la tastiera; si scrive anche dalla tastiera vera, Backspace cancella), in che
//   base è scritto e i bit del complemento a 2 (◀ ▶ li cambiano), i risultati nelle quattro basi e su n bit (OK lo vedi
//   intero, e lì OK lo copia), e «come si fa verso» una base (◀ ▶ la base, OK i passaggi).
// - I PASSAGGI: quelli che si scrivono a scuola (le divisioni coi resti, le potenze, i gruppi di bit), che scorrono con ↑ ↓;
//   ← → cambiano la base d'arrivo.
// Quando il numero cambia i risultati si riscrivono da sinistra. Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import { BASI, NOME, leggi, scritto, c2, intIn, gruppi, passi } from '../../app/conversioni.js'
import { ricordo, ricorda } from '../../ricordi.js'
import { txt, corto, destra, centro, elenco, pagine, impagina, scorrevole, senzaHtml, striscia, testata } from './pezzi.js'

const BIT = [0, 8, 16, 32, 64]
const SIGLA = Object.fromEntries(BASI.map(([b, s]) => [b, s]))
const sup = (s) => senzaHtml(String(s).replace(/<sup>(.*?)<\/sup>/g, '^$1'))
const copia = (s) => navigator.clipboard?.writeText(s).then(() => true, () => false) ?? Promise.resolve(false)

/** Le righe dei passaggi per lo schermo: i testi a capo, le tabelle a colonne allineate, l'esito in una fascia. */
function righePassi(x, verso) {
  const out = []
  for (const b of passi(x, verso)) {
    if (b.p || b.nota) { out.push(...impagina([{ testo: sup(b.p ?? b.nota) }])); continue }
    // (11.11: a 64 bit l'esito tagliato con «…» non si leggeva mai intero: va a capo, tutto nella fascia)
    if (b.fine) { out.push({ s: '' }, ...Lcd.acapo(txt(sup(b.fine)), 36).map((s) => ({ s, tipo: 'titolo' }))); continue }
    const T = [...(b.testa ? [b.testa] : []), ...b.tab.map((r) => r.map(sup))]
    if (!T.length) continue // (0 verso il decimale: nessuna cifra da sommare, la tabella è vuota)
    const sep = T.some((r) => r.length === 2 && r[0].includes('×')) ? ' = ' : b.tab[0]?.length === 2 ? ' → ' : '   '
    const larghe = T[0].map((_, i) => Math.max(...T.map((r) => [...r[i]].length)))
    // (11.11: coi numeri a 64 bit la riga «divisione quoziente resto» era più larga dello schermo e il «…» si mangiava il
    // resto, la cifra che conta: se non ci sta, la colonna di mezzo se ne va (il quoziente è la divisione della riga dopo),
    // e se ancora non basta si accorcia la prima; l'ultima resta sempre)
    const stretta = T[0].length > 2 && larghe.reduce((a, n) => a + n, 0) + 3 * (larghe.length - 1) > 37
    const L = stretta ? [larghe[0], larghe.at(-1)] : larghe
    const n0 = Math.min(L[0], 37 - 3 - L.at(-1)) // (stretta: quanto resta alla prima colonna)
    T.forEach((r, k) => {
      const s = k === 0 && b.testa ? '   ' : sep
      // (11.11: «F × 16^15 = 17.293.822.569.102.704.640» è 38 caratteri: il valore va sotto, allineato a destra, e non perde la coda)
      if (r.length === 2 && larghe[0] + s.length + [...r[1]].length > 37) return out.push({ s: corto(r[0] + s.trimEnd(), 37) }, { s: corto(r[1], 37).padStart(37) })
      if (!stretta) return out.push({ s: corto(r.map((c, i) => (i < r.length - 1 ? c.padEnd(larghe[i]) : c)).join(s), 37) })
      const c0 = [...r[0]], primo = c0.length <= n0 ? r[0].padEnd(n0) : k === 0 && b.testa ? c0.slice(0, n0).join('') : corto(r[0], n0) // (la testa si taglia senza «…»)
      out.push({ s: primo + s + r.at(-1) })
    })
  }
  return out
}

// ── i passaggi ──
function vistaPassi(os, S, salva) {
  let giu = 0
  const cambia = (d) => { const i = BASI.findIndex(([b]) => b === S.verso); S.verso = BASI[(i + d + BASI.length) % BASI.length][0]; giu = 0; salva() }
  /** Le righe di adesso ([] se il numero non si legge). */
  const righe = () => { const x = leggi(S.testo, S.da); return x.errore ? [] : x.b === S.verso ? impagina([{ testo: `${scritto(x, S.verso).vista} è già in ${NOME[S.verso]}: ← → scelgono un'altra base.` }]) : righePassi(x, S.verso) }
  return {
    nome: 'conversioni-passi', app: 'conversioni',
    disegna(l) {
      const x = leggi(S.testo, S.da)
      testata(l, os, { icona: 'app-conversioni', nome: `verso ${NOME[S.verso]}`, n: BASI.length, pag: BASI.findIndex(([b]) => b === S.verso), vai: cambia, va: (i) => { S.verso = BASI[i][0]; giu = 0; salva() } })
      if (x.errore) { centro(l, 64, corto(`! ${txt(x.errore)}`, 38)); centro(l, H - 9, 'INDIETRO torna'); return }
      const R = righe()
      l.ritaglia([os.MARGINE, 32, W - 2 * os.MARGINE, 86])
      scorrevole(l, R, { y0: 34, vis: 9, giu }) // (giu lo tiene giusto tasto: disegna non cambia lo stato)
      l.ritaglia(null)
      centro(l, H - 9, R.length > 9 ? '↑↓ legge · ←→ base · OK torna' : '←→ base · OK torna')
    },
    tasto(k) {
      if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu = Math.min(giu + 1, Math.max(0, righe().length - 9))
      else if (k === 'sx' || k === 'dx') cambia(k === 'sx' ? -1 : 1)
      else if (k === 'ok' || k === 'indietro') os.togli()
      else return false
      return true
    },
  }
}

// ── un risultato intero ──
function vistaIntero(os, titolo, vista, testo) {
  let esito = null
  const v = {
    nome: 'conversioni-intero', app: 'conversioni',
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } },
    disegna(l, t) {
      testata(l, os, { icona: 'app-conversioni', nome: corto(titolo, 30), n: 1 })
      const tutte = Lcd.acapo(txt(vista), 39), r = tutte.slice(0, 7)
      if (tutte.length > 7) r[6] = corto(r[6] + '…', 39) // (il «…» in fondo all'ultima riga: sotto c'è «N cifre»)
      r.forEach((s, i) => l.testo(10, 36 + i * 10, s))
      const n = [...testo].filter((c) => /[0-9A-F]/i.test(c)).length // (solo le cifre: non il meno, non la virgola)
      l.testo(10, 108, `${n} ${n === 1 ? 'cifra' : 'cifre'}`)
      const a = 'OK lo copia · INDIETRO torna', xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
      if (!striscia(l, { esito }, t)) { l.testo(xa, H - 9, a); os.zona(xa - 3, H - 11, Lcd.larghezza('OK lo copia') + 6, 11, () => v.tasto('ok')) }
    },
    tasto(k) {
      // (11.11: dopo l'attesa del browser si guarda di essere ancora in cima: se no il bip dell'errore suonava nella vista di sotto)
      if (k === 'ok') { copia(testo).then((ok) => { if (os.corrente() !== v) return; esito = { ok, testo: ok ? 'copiato' : 'il browser non lo lascia copiare', fino: Date.now() + 3000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }); return true }
      if (k === 'indietro') { os.togli(); return true }
      return k === 'su' || k === 'giu' || k === 'sx' || k === 'dx'
    },
  }
  return v
}

export function vista(os) {
  const S = ricordo('conversioni', { testo: '42', da: 10, bit: 0, verso: 2 })
  // (11.11: le scelte salvate possono essere rotte: una base che non c'è dava BigInt(undefined) nei passaggi, a ogni disegno)
  S.da = NOME[S.da] ? Number(S.da) : 10; S.verso = NOME[S.verso] ? Number(S.verso) : 2; S.bit = BIT.includes(Number(S.bit)) ? Number(S.bit) : 0; S.testo = String(S.testo ?? '')
  const salva = () => ricorda('conversioni', S)
  const st = { sel: 0, da: 0 }
  let scrive = 0 // i risultati che si riscrivono da sinistra (0 → 4)
  const cambiato = () => { scrive = 0; salva() }
  // (11.11: la base che si vede: con 0x 0b 0o davanti è quella del prefisso, come in leggi, anche quando una cifra è
  // sbagliata e leggi non dice la base; con «0x1F» in decimale OK apriva i tasti dei numeri, «in decimale», senza A–F)
  const base = () => { const x = leggi(S.testo, S.da); return x.b ?? { B: 2, O: 8, X: 16 }[/^[-+]?0([BOX])/.exec(S.testo.trim().replace(/[\s_']/g, '').toUpperCase())?.[1]] ?? S.da }
  const giraBase = (d) => {
    // (11.11: con 0x davanti la riga dice «esadecimale», e ▶ deve andare alla base dopo quella che si vede, non dopo S.da)
    const x = leggi(S.testo, S.da), i = BASI.findIndex(([b]) => b === base()), nuova = BASI[(i + d + BASI.length) % BASI.length][0]
    if (!x.errore) S.testo = scritto(x, nuova).testo // (cambia la base: il numero si riscrive nella nuova, come l'app vecchia)
    else S.testo = S.testo.replace(/^(\s*[-+]?0)[box]/i, '$1') // (11.11: con un errore non si riscrive, ma il prefisso se ne va, se no comanda lui e ◀ ▶ non cambiavano niente)
    S.da = nuova; cambiato()
  }
  const giraBit = (d) => { S.bit = BIT[(BIT.indexOf(S.bit) + d + BIT.length) % BIT.length]; cambiato() }
  const giraVerso = (d) => { const i = BASI.findIndex(([b]) => b === S.verso); S.verso = BASI[(i + d + BASI.length) % BASI.length][0]; salva() }
  async function scrivi(x) {
    // (in decimale e in ottale i tasti grandi di os.numero, col meno e la virgola; il binario lungo e le lettere A–F
    // dell'esadecimale vogliono la tastiera, coi simboli per il meno e la virgola)
    const b = base(), titolo = `il numero, in ${NOME[b]}`
    // (max 80 come la tastiera vera qui sotto: os.numero per ora si ferma a 24 senza dirlo, la correzione è in os.js)
    const s = b === 10 || b === 8 ? await os.numero({ titolo, testo: S.testo, max: 80 }) :await os.tastiera({ titolo, testo: S.testo, simboli: true })
    if (s === null || !x.qui()) return
    S.testo = s.trim(); cambiato()
  }

  /** Le righe di adesso: { nome, val, ok?, gira?, aiuto }. */
  function righe() {
    const x = leggi(S.testo, S.da), R = []
    R.push({ nome: 'numero', val: S.testo, numero: true, ok: scrivi, aiuto: 'OK scrive · ↑↓ righe' })
    R.push({ nome: 'scritto in', val: NOME[base()], gira: giraBase, aiuto: '←→ cambia · ↑↓ righe' })
    R.push({ nome: 'bit (compl. a 2)', val: S.bit ? `${S.bit}` : 'no', gira: giraBit, aiuto: '←→ cambia · ↑↓ righe' })
    if (x.errore) R.push({ nome: `! ${x.errore}`, val: '', aiuto: 'OK scrive il numero', ok: scrivi })
    else {
      for (const [b, sigla] of BASI) { const s = scritto(x, b); R.push({ nome: sigla, val: s.vista, risultato: true, ok: () => os.spingi(vistaIntero(os, NOME[b], s.vista, s.testo)), aiuto: 'OK lo vedi intero · ↑↓ righe' }) }
      if (S.bit) {
        const p = c2(x, S.bit)
        if (p === null) R.push({ nome: x.fraz ? 'il compl. a 2 è per gli interi' : `non ci sta in ${S.bit} bit`, val: '', aiuto: '↑↓ righe' })
        else {
          const bin = p.toString(2).padStart(S.bit, '0'), hex = intIn(p, 16).padStart(S.bit / 4, '0')
          R.push({ nome: `${S.bit} bit`, val: gruppi(bin, 4), risultato: true, ok: () => os.spingi(vistaIntero(os, `${S.bit} bit, complemento a 2`, gruppi(bin, 4), bin)), aiuto: 'OK lo vedi intero · ↑↓ righe' })
          R.push({ nome: `hex ${S.bit}`, val: gruppi(hex, 4), risultato: true, ok: () => os.spingi(vistaIntero(os, `hex su ${S.bit} bit`, gruppi(hex, 4), hex)), aiuto: 'OK lo vedi intero · ↑↓ righe' })
          // (11.11: era l'unico risultato che con OK non si apriva intero)
          if (bin[0] === '1' && !x.neg && (x.b === 2 || x.b === 16)) { const seg = String(p - (1n << BigInt(S.bit))); R.push({ nome: 'letto col segno', val: seg, risultato: true, ok: () => os.spingi(vistaIntero(os, `letto col segno su ${S.bit} bit`, seg, seg)), aiuto: 'OK lo vedi intero · ↑↓ righe' }) }
        }
      }
    }
    R.push({ nome: 'come si fa verso', val: NOME[S.verso], gira: giraVerso, ok: () => os.spingi(vistaPassi(os, S, salva)), aiuto: 'OK i passaggi · ←→ base' })
    return R
  }

  return pagine(os, {
    nome: 'conversioni', app: 'conversioni',
    pagine: [{
      nome: 'bin·hex', icona: 'app-conversioni',
      aiuto: () => righe()[st.sel]?.aiuto ?? '↑↓ righe',
      tic(t) { if (scrive < 4) { scrive++; return true } return st.sel === 0 && t % 5 === 0 }, // (e il cursore del numero che lampeggia)
      disegna(l, x, t) {
        const R = righe()
        elenco(l, x.zona, {
          voci: R, stato: st, y0: 34, alta: 80, passo: 10,
          clic: (r) => (r.ok ? r.ok(x) : r.gira?.(1)), // (il clic sulla riga fa quello che fa OK)
          riga(l, r, x0, y, w, on, k) {
            const o = { inv: on }
            l.testo(x0, y + 1, corto(r.nome, r.val ? 18 : 37), o)
            if (!r.val && !r.numero) return
            const spazio = Math.floor((w - Lcd.larghezza(corto(r.nome, 18)) - 10) / 6)
            if (r.gira) { // il valore fra ◀ ▶ (si cliccano), le frecce solo sulla riga scelta
              const s = corto(r.val, spazio - 4)
              if (on) {
                const tutto = `◀ ${s} ▶`, xs = x0 + w - Lcd.larghezza(tutto)
                l.testo(xs, y + 1, tutto, o)
                x.zona(xs - 2, y - 1, 10, 11, () => { st.sel = k; r.gira(-1) }); x.zona(x0 + w - 8, y - 1, 10, 11, () => { st.sel = k; r.gira(1) })
              } else destra(l, x0 + w, y + 1, s, o)
              return
            }
            if (r.numero) { // il numero: si vede la coda, e il cursore che lampeggia mentre lo scrivi (vuoto: prima del suggerimento)
              const c = [...txt(r.val)], n = spazio - 1, lampo = on && t % 10 < 5
              if (!c.length) { const m = 'scrivi un numero', xs = x0 + w - Lcd.larghezza(m); l.testo(xs, y + 1, m, o); if (lampo) l.testo(xs - 7, y + 1, '_', o); return }
              destra(l, x0 + w - 7, y + 1, c.length > n ? '…' + c.slice(-(n - 1)).join('') : c.join(''), o)
              if (lampo) l.testo(x0 + w - 6, y + 1, '_', o)
              return
            }
            const v = txt(r.val), quanti = r.risultato ? Math.ceil(([...v].length * scrive) / 4) : [...v].length // (si riscrive da sinistra)
            destra(l, x0 + w, y + 1, corto([...v].slice(0, quanti).join(''), spazio), o)
          },
        })
      },
      tasto(k, x) {
        const R = righe(), r = R[st.sel]
        if (k === 'su' || k === 'giu') { st.sel = (st.sel + (k === 'su' ? -1 : 1) + R.length) % R.length; return true }
        if ((k === 'sx' || k === 'dx') && r?.gira) { r.gira(k === 'sx' ? -1 : 1); return true }
        if (k === 'ok') { if (r?.ok) r.ok(x); else r?.gira?.(1); return true } // (11.11: su «scritto in» e sui bit OK non faceva niente: va avanti come ▶)
        return k === 'sx' || k === 'dx' // (una pagina sola: le frecce di lato non fanno altro)
      },
      carattere(ch) { if (/^[0-9a-zA-Z.,+\-_' ]$/.test(ch) && S.testo.length < 80) { S.testo += ch; st.sel = 0; cambiato() } },
      cancella() { S.testo = S.testo.slice(0, -1); st.sel = 0; cambiato() },
      scrivendo: () => st.sel === 0 && S.testo.length > 0,
      invio(x) { const r = righe()[st.sel]; if (r?.ok) r.ok(x); else r?.gira?.(1) },
    }],
  })
}
