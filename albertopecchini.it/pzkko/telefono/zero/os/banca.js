// L'app «banca» di pzk os (29.10, Alberto: «crea uno alla volta … banca …»): il portafoglio dei $pzk sul cercapersone zero.
// È il wallet della home (wallet/wallet.js: «in portafoglio solo saldo e borsa», Alberto 26.10) sull'lcd: i soldi sono quelli
// di games/pzk.js, la borsa quella di api/borsa.mjs, il periodo scelto si ricorda insieme al pomello del wallet
// (telefono/ricordi.js, «wallet-borsa»). Il conto, il cambio e gli invii sono dell'app account: OK ci porta.
// - IL PORTAFOGLIO: il saldo a sette segmenti come i led del wallet (verdi, gli EUR€ ambra, su un vetrino nero; i segmenti
//   spenti si intravedono), i suoi EUR€, quanti
//   ne hai sul tavolo, e la targhetta con l'indirizzo. Aprendo, la prova dei segmenti (tutti 8 per un attimo); quando il
//   saldo cambia, le cifre corrono fino al numero nuovo.
// - LA BORSA: il cambio PZK/EUR€ del periodo (↑ ↓: 24 ore, 7 giorni, 30 giorni, da sempre), la linea che si disegna da
//   sinistra, fra lei e la riga d'apertura tratteggiata l'area verde sopra e rossa sotto, l'ultimo punto che lampeggia; quanto
//   è salito o sceso sta in un cartellino verde o rosso, come quello del wallet. OK accende il
//   cursore: ← → lo spostano e in cima c'è il cambio di quel momento.
// - I NUMERI: il cambio e il suo inverso, quanto è salito o sceso in 24 ore, 7 e 30 giorni e da sempre, quanti $pzk ci
//   sono in giro, quanto valgono e su quanti conti.
// La borsa si chiede al server ogni minuto mentre la banca è aperta; senza rete si dice che è chiusa. Le regole: os/REGOLE.md.
import { Lcd, W, H, C, esa } from './lcd.js'
import * as pzk from '../../../games/pzk.js'
import { ricordo, ricorda } from '../../ricordi.js'
import { corto, destra, centro, puntini, pagine } from './pezzi.js'

// ── i colori (11.11, Alberto: «fai colori a 8bit su tutto»): quelli del wallet della home (wallet.css: --led, --ambra, i
// cartellini .w-var su e giu). Il testo sopra un colore è nero e il colore sta su un vetrino o su una fascia sua: così si legge su
// tutti gli sfondi (verde chiaro su «carta» o rosso su «arancione», da soli, non si leggevano) ──
const LED = esa('#46ff7d'), LED_SPENTO = esa('#006633'), AMBRA = esa('#ffb02e'), AMBRA_SPENTA = esa('#663300'), VETRO = C.nero
const SU = esa('#46ff7d'), GIU = esa('#ff3333'), AREA_SU = esa('#339933'), AREA_GIU = esa('#cc3333')
const OTTONE = esa('#cc9933'), VITE = esa('#663300') // (la targhetta dell'indirizzo)

const PERIODI = [['24h', '24 ore'], ['7g', '7 giorni'], ['30g', '30 giorni'], ['tutto', 'da sempre']]
const ROMA = { timeZone: 'Europe/Rome' }
const fmt = (x) => pzk.fmt(x ?? 0), eur = (x) => pzk.fmtEur(x ?? 0)
const fmtTasso = (x) => (Number.isFinite(x) ? x.toFixed(4) : '-')
/** Il cambio grande (scala 2): sei caratteri, i decimali che restano dopo le cifre intere («1.2345», «10.123», «100.12»). */
const tassoCorto = (x) => (Number.isFinite(x) ? x.toFixed(Math.max(0, 5 - String(Math.trunc(Math.abs(x))).length)) : '-')
/** La variazione: ▲ o ▼, il valore con la virgola, il %. (▲ ▼ restano anche col colore: per chi non distingue il verde dal rosso) */
const variazione = (v) => (Number.isFinite(v) ? `${v >= 0 ? '▲' : '▼'} ${Math.abs(v * 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '-')
/** La variazione in un cartellino che finisce a xd: verde se è salita, rosso se è scesa, il testo nero (come .w-var del wallet).
 *  Senza numero solo il «-» d'inchiostro. → dove comincia il cartellino */
function cartellino(l, xd, y, v) {
  const s = variazione(v), w = Lcd.larghezza(s)
  if (!Number.isFinite(v)) { destra(l, xd, y, s); return xd - w }
  l.riempi(xd - w - 2, y - 1, w + 4, 9, v >= 0 ? SU : GIU)
  l.testo(xd - w, y, s, { col: C.nero })
  return xd - w - 2
}

// ── le cifre a sette segmenti (come il wallet e il portachiavi): w × h, spessore t; le punte smussate ──
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' }
/** Un segmento orizzontale (vert false) o verticale, lungo n, spesso t, con le punte a esagono; spento: solo la riga di mezzo
 *  a puntini (come il led spento che si intravede: piena, a colpo d'occhio ogni cifra sembrava un 8), nel colore spento. */
function segmento(l, x, y, n, t, vert, acceso, [on, off]) {
  for (let r = 0; r < t; r++) {
    const smusso = Math.round(Math.abs(r - (t - 1) / 2)) // (le righe di bordo più corte: la punta)
    for (let i = smusso; i < n - smusso; i++) {
      const px = vert ? x + r : x + i, py = vert ? y + i : y + r
      if (acceso) l.px(px, py, on)
      else if (r === Math.floor(t / 2) && i % 2 === 0) l.px(px, py, off)
    }
  }
}
function cifra(l, x, y, ch, { w, h, t }, col) {
  const on = SEG[ch] ?? '', m = Math.floor((h - t) / 2), L = (s) => on.includes(s)
  segmento(l, x + 1, y, w - 2, t, false, L('a'), col)
  segmento(l, x + w - t, y + 1, m, t, true, L('b'), col)
  segmento(l, x + w - t, y + m + 1, h - m - 2, t, true, L('c'), col)
  segmento(l, x + 1, y + h - t, w - 2, t, false, L('d'), col)
  segmento(l, x, y + m + 1, h - m - 2, t, true, L('e'), col)
  segmento(l, x, y + 1, m, t, true, L('f'), col)
  segmento(l, x + 1, y + m, w - 2, t, false, L('g'), col)
}
const GRANDI = { w: 13, h: 23, t: 3, aria: 4 }, MEDIE = { w: 9, h: 15, t: 2, aria: 3 }, PICCOLE = { w: 7, h: 11, t: 2, aria: 2 }
const larghezza = (s, M) => [...s].reduce((a, c) => a + (c === '.' ? M.t + M.aria : M.w + M.aria), 0) - M.aria
/** Un numero a sette segmenti che finisce a x1 («1234.5», «----»): se non ci sta in largo prende le cifre più piccole.
 *  col: [acceso, spento]. */
function led(l, x1, y, s, misure, largo, col) {
  const M = misure.find((m) => larghezza(s, m) <= largo) ?? misure.at(-1)
  let x = x1 - larghezza(s, M), yy = y + Math.round((misure[0].h - M.h) / 2) // (più piccole: centrate sulla riga)
  for (const c of s) {
    if (c === '.') { l.riempi(x, yy + M.h - M.t, M.t, M.t, col[0]); x += M.t + M.aria; continue }
    cifra(l, x, yy, c, M, col); x += M.w + M.aria
  }
}
/** Il saldo come lo scrivono i led: intero, o col decimale se c'è (mai la virgola delle migliaia). */
const perLed = (n) => { const r = Math.round(n * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1) }
/** Il vetrino nero dei led (gli angoli smussati), come lo schermo del wallet: i led verdi e ambra si vedono su ogni sfondo. */
function vetrino(l, x, y, w, h) {
  l.riempi(x, y, w, h, VETRO)
  for (const [ax, ay] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) l.px(ax, ay, 0)
}

// ── la borsa: una richiesta per periodo, rifatta dopo un minuto; la tiene la pagina finché è aperta ──
const borsa = {} // da → { d, quando }
const chiedendo = {} // da → la richiesta in corso (due OK di fila non la rifanno)
function chiedi(da) {
  return (chiedendo[da] ??= (async () => {
    try {
      const r = await fetch(`/api/borsa/?da=${da}`, { signal: AbortSignal.timeout?.(20000) }) // (11.11: una rete che non risponde teneva la richiesta aperta per sempre, e la banca, anche riaperta, restava su «mi collego…» senza riprovare: dopo 20 secondi è «non c'è la rete»)
      const d = await r.json().catch(() => ({ ok: false }))
      borsa[da] = { d: { ...d, da }, quando: Date.now() }
    } catch { borsa[da] = { d: { ok: false, da, rete: true }, quando: Date.now() } }
    finally { delete chiedendo[da] }
  })())
}
const vecchia = (da) => !borsa[da] || Date.now() - borsa[da].quando > 60000
/** Una risposta qualsiasi (le variazioni e la capitalizzazione ci sono in tutte): quella del periodo, se no un'altra. */
const qualunque = (da) => borsa[da]?.d?.ok ? borsa[da].d : Object.values(borsa).map((b) => b.d).find((d) => d?.ok) ?? borsa[da]?.d

/** Quando, per il cursore: l'ora nelle 24 ore, il giorno e l'ora in 7 giorni, col mese in 30, il giorno da sempre. */
function quando(t, da) {
  const d = new Date(t)
  if (da === '24h') return d.toLocaleTimeString('it-IT', { ...ROMA, hour: '2-digit', minute: '2-digit' })
  if (da === '30g') return d.toLocaleString('it-IT', { ...ROMA, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '') // (in un mese il giorno della settimana non basta)
  if (da === 'tutto') return d.toLocaleDateString('it-IT', { ...ROMA, day: 'numeric', month: 'short', year: '2-digit' })
  return d.toLocaleString('it-IT', { ...ROMA, weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')
}

export function vista(os) {
  let periodo = Math.min(PERIODI.length - 1, Math.max(0, ricordo('wallet-borsa', { periodo: 0 }).periodo | 0))
  let prova = 0, mostra = null, cresce = 1, cursore = null // (cursore: l'indice del punto, o null)
  const da = () => PERIODI[periodo][0]
  const aggiorna = () => { const p = da(), cera = borsa[p]?.d?.ok; if (vecchia(p)) chiedi(p).then(() => { if (!cera && p === da()) cresce = 0; if (os.corrente()?.app === 'banca') os.ridisegna() }) }
  const cambiaPeriodo = (d) => { periodo = (periodo + d + PERIODI.length) % PERIODI.length; ricorda('wallet-borsa', { periodo }); cursore = null; cresce = 0; aggiorna() }
  /** I punti del periodo che si vede (quelli che disegna il grafico): il suggerimento, OK e il cursore guardano questi. */
  const punti = () => { const b = borsa[da()]?.d; return b?.ok ? b.punti ?? [] : [] }
  /** OK e il clic sul grafico: accende o spegne il cursore. Durante la linea che cresce la finisce e accende (REGOLE.md 3.6). */
  const premiGrafico = () => { const P = punti(); if (cursore !== null) { cursore = null; return } if (P.length > 1) { cresce = 1; cursore = P.length - 1 } }

  // ── il portafoglio ──
  const portafoglio = {
    nome: 'il portafoglio', icona: 'app-banca', aiuto: 'OK conto, cambio e invii · ←→ pagine',
    ok: () => os.apri('account'),
    entra() { prova = 4; mostra = null },
    tic() {
      if (prova > 0) { prova--; return true }
      const s = pzk.saldo()
      if (mostra === null) { mostra = s; return false }
      if (mostra === s) return false
      const d = s - mostra
      mostra = Math.abs(d) < 0.6 ? s : mostra + d * 0.4 // (corrono, e in quattro o cinque fotogrammi arrivano)
      if (mostra === s && d > 0) os.suoni.sigla('moneta')
      return true
    },
    disegna(l, x) {
      const c = pzk.conto(), s = pzk.saldo(), tav = Math.round((c?.pzk ?? s) - s)
      const v = prova > 0 ? perLed(s).replace(/\d/g, '8') : perLed(mostra ?? s)
      l.testo(10, 36, '$pzk')
      l.testo(10, 46, 'liberi')
      vetrino(l, 61, 33, 188, 27)
      led(l, 245, 35, v, [GRANDI, MEDIE, PICCOLE], 245 - 64, [LED, LED_SPENTO])
      const sotto = `≈ ${eur(s * pzk.tasso())} €`
      l.testo(10, 64, sotto)
      const altro = [c?.sporchi ? `sporchi ${pzk.fmtCorto(c.sporchi)}` : '', tav > 0 ? `sul tavolo ${pzk.fmtCorto(tav)}` : ''].filter(Boolean).join(' · ')
      if (altro) destra(l, 245, 64, corto(altro, 39 - [...sotto].length - 2))
      for (let xx = 10; xx < 246; xx += 3) l.px(xx, 75)
      l.testo(10, 82, 'EUR€')
      vetrino(l, 41, 77, 208, 19)
      led(l, 245, 79, prova > 0 ? '8888.88' : c ? eur(c.eur).replace(/\./g, '').replace(',', '.') : '----', [MEDIE, PICCOLE], 245 - 44, [AMBRA, AMBRA_SPENTA])
      // la targhetta: l'indirizzo su una piastrina d'ottone con le quattro viti, il bordo d'inchiostro, il testo nero
      const ind = c ? corto(c.ind, 30) : 'sessione', tw = Lcd.larghezza(ind) + 20, tx = Math.round(W / 2 - tw / 2)
      l.riempi(tx + 1, 100, tw - 2, 13, OTTONE)
      l.cornice(tx, 99, tw, 15)
      for (const [vx, vy] of [[tx + 3, 102], [tx + tw - 4, 102], [tx + 3, 110], [tx + tw - 4, 110]]) l.px(vx, vy, VITE)
      l.testo(tx + 10, 103, ind, { col: C.nero })
      x.zona(tx, 99, tw, 15, () => os.apri('account'))
    },
  }

  // ── la borsa ──
  const grafico = {
    nome: 'la borsa', icona: 'pzk',
    ok: () => premiGrafico(), // (11.11: il clic su «OK cursore» in fondo fa quello che dice, come OK; il tasto lo prende già tasto())
    aiuto: () => (punti().length < 2 ? '↑↓ periodo · ←→ pagine' : cursore !== null ? '←→ muove · OK o INDIETRO esce' : 'OK cursore · ↑↓ periodo · ←→ pagine'), // (30.10: la stessa condizione di OK; prima «OK cursore» anche col periodo che caricava. 11.11: col cursore acceso e la borsa che poi non risponde, in fondo restava «←→ muove · OK o INDIETRO esce», ma tasto() spegne il cursore e ← cambiava pagina, INDIETRO chiudeva la banca)
    entra() { cursore = null; aggiorna() },
    tic(t) {
      if (t % 100 === 0) aggiorna() // (ogni minuto, mentre si guarda. 11.11: si guarda ogni dieci secondi se è vecchia, così «riprovo fra un minuto» riprova dopo un minuto; con t % 600 e il minuto di vecchia() ce ne volevano quasi due)
      if (cresce < 1) { cresce = Math.min(1, cresce + 0.2); return true }
      return t % 5 === 0 // (l'ultimo punto lampeggia)
    },
    disegna(l, x, t) {
      const b = borsa[da()]?.d, nome = PERIODI[periodo][1]
      // il periodo in alto a destra, rovesciato: si clicca per il prossimo
      const pw = Lcd.larghezza(nome) + 6
      l.riempi(245 - pw, 34, pw, 9); destra(l, 242, 35, nome, { inv: true })
      x.zona(245 - pw - 2, 32, pw + 4, 13, () => cambiaPeriodo(1))
      if (!b) { centro(l, 70, `mi collego alla borsa${'...'.slice(0, (Math.floor(t / 4) % 3) + 1)}`); return }
      if (!b.ok) {
        centro(l, 62, 'la borsa è chiusa')
        centro(l, 74, b.offline ? 'apre quando il server ha il suo archivio' : b.rete ? 'non c’è la rete: riprovo fra un minuto' : corto(b.errore ?? 'riprova più tardi', 38))
        return
      }
      const P = b.punti ?? []
      if (P.length < 2) {
        l.testo(10, 35, fmtTasso(b.tasso), { scala: 2 })
        centro(l, 70, 'la borsa è appena nata: 1 $pzk = 1 €')
        return
      }
      const k = cursore === null ? P.length - 1 : Math.max(0, Math.min(P.length - 1, cursore)), [tk, vk] = P[k] // (il fondo si legge qui, si corregge in tasto: REGOLE.md 4.8)
      // in cima: il cambio (del punto del cursore, o di adesso) e quanto è cambiato dall'inizio del periodo. Sei caratteri
      // sempre (meno decimali sopra 10: «10.1234» a scala 2 finiva sotto «€ per»), e l'etichetta comunque dopo il numero
      const grande = tassoCorto(cursore !== null ? vk : b.tasso), xe = Math.max(88, 10 + Lcd.larghezza(grande, 2) + 6)
      l.testo(10, 34, grande, { scala: 2 })
      l.testo(xe, 34, '€ per')
      l.testo(xe, 42, '$pzk')
      const vari = cursore !== null ? vk / P[0][1] - 1 : { '24h': b.var24, '7g': b.var7g, '30g': b.var30g, tutto: b.tasso / 1 - 1 }[da()] ?? b.tasso / P[0][1] - 1 // (11.11: una borsa più giovane del periodo non ha la variazione del server, e in alto restava un «-» da solo: allora quella dall'inizio della linea)
      if (cursore !== null) destra(l, 245, 45, corto(quando(tk, da()), 20))
      else cartellino(l, 245, 45, vari)
      // il grafico: da x 10 a 245, da y 54 a 104; l'apertura tratteggiata, e fra lei e la linea l'area verde (sopra) o rossa
      // (sotto), staccata dalla linea di un pixel: la linea d'inchiostro si legge su ogni sfondo (11.11: prima l'area era un
      // puntino ogni quattro sotto la linea, il retino che sull'lcd a un bit faceva da grigio)
      const X0 = 10, X1 = 245, Y0 = 55, Y1 = 104
      let lo = Infinity, hi = -Infinity
      for (const [, v] of P) { if (v < lo) lo = v; if (v > hi) hi = v }
      if (hi - lo < 1e-9) { hi += 1e-6; lo -= 1e-6 }
      const px = (i) => Math.round(X0 + ((X1 - X0) * i) / (P.length - 1)), py = (v) => Math.round(Y1 - ((Y1 - Y0) * (v - lo)) / (hi - lo))
      const fino = Math.max(1, Math.round((P.length - 1) * cresce))
      const ya = py(P[0][1])
      for (let xx = X0; xx <= X1; xx += 4) l.orizz(xx, ya, 2)
      let xp = px(0), yp = py(P[0][1])
      for (let i = 1; i <= fino; i++) {
        const xn = px(i), yn = py(P[i][1])
        for (let xx = xp; xx <= xn; xx++) {
          const yy = xn === xp ? yn : Math.round(yp + ((yn - yp) * (xx - xp)) / (xn - xp))
          if (yy + 2 < ya) l.vert(xx, yy + 2, ya - yy - 2, AREA_SU)
          else if (yy - 2 > ya) l.vert(xx, ya + 1, yy - ya - 2, AREA_GIU)
        }
        linea(l, xp, yp, xn, yn)
        xp = xn; yp = yn
      }
      l.orizz(X0, Y1 + 1, X1 - X0 + 1)
      if (cresce >= 1) {
        const cx = px(k), cy = py(vk)
        if (cursore !== null) { for (let y = Y0 - 1; y <= Y1; y += 2) l.px(cx, y); l.riempi(cx - 2, cy - 2, 5, 5, 0); l.riquadro(cx - 2, cy - 2, 5, 5) }
        else if (t % 10 < 5) l.riempi(cx - 1, cy - 1, 3, 3)
      }
      l.testo(10, 108, `min ${tassoCorto(lo)}`) // (11.11: sei caratteri come il cambio grande: «min 100.1234» finiva sotto il «da …» di mezzo)
      destra(l, 245, 108, `max ${tassoCorto(hi)}`)
      const tempo = cursore !== null ? `${k + 1}/${P.length}` : corto(`da ${quando(P[0][0], da())}`, 16) // (da quando parte la linea)
      centro(l, 108, tempo)
      x.zona(X0, Y0, X1 - X0, Y1 - Y0, premiGrafico)
    },
    tasto(k) {
      const P = punti()
      if (k === 'su') { cambiaPeriodo(-1); return true }
      if (k === 'giu') { cambiaPeriodo(1); return true }
      if (cursore !== null) {
        if (P.length < 2) cursore = null // (la borsa rifatta senza punti: il cursore si spegne)
        else cursore = Math.max(0, Math.min(P.length - 1, cursore))
      }
      if (cursore !== null) {
        if (k === 'sx') cursore = Math.max(0, cursore - Math.max(1, Math.round(P.length / 40)))
        else if (k === 'dx') cursore = Math.min(P.length - 1, cursore + Math.max(1, Math.round(P.length / 40)))
        else if (k === 'ok' || k === 'indietro') cursore = null
        else return false
        return true
      }
      if (k === 'ok') { premiGrafico(); return true }
      return false
    },
  }

  // ── i numeri ──
  const numeri = {
    nome: 'i numeri della borsa', icona: 'pzk', aiuto: '←→ pagine',
    entra: aggiorna,
    tic(t) { if (t % 100 === 0) aggiorna() }, // (11.11: senza tic qui «riprovo fra un minuto» non riprovava mai, e i numeri restavano quelli di quando si era entrati)
    disegna(l, x, t) {
      const d = qualunque(da())
      if (!d) { centro(l, 70, `mi collego alla borsa${'...'.slice(0, (Math.floor(t / 4) % 3) + 1)}`); return }
      if (!d.ok) { centro(l, 62, 'la borsa è chiusa'); centro(l, 74, d.offline ? 'apre quando il server ha il suo archivio' : d.rete ? 'non c’è la rete: riprovo fra un minuto' : corto(d.errore ?? 'riprova più tardi', 38)); return } // (11.11: come la borsa; prima «non c'è la rete» anche quando il server rispondeva con un errore)
      const nata = d.nata ? new Date(d.nata).toLocaleDateString('it-IT', { ...ROMA, day: 'numeric', month: 'short', year: 'numeric' }) : ''
      const R = [
        ['1 $pzk', `${fmtTasso(d.tasso)} €`],
        ['1 €', `${Number.isFinite(d.inverso) ? d.inverso.toFixed(3) : '-'} $pzk`],
        ['in 24 ore', variazione(d.var24), d.var24],
        ['in 7 giorni', variazione(d.var7g), d.var7g],
        ['in 30 giorni', variazione(d.var30g), d.var30g],
        [nata ? `da sempre (dal ${nata})` : 'da sempre', variazione(d.tasso / 1 - 1), d.tasso / 1 - 1],
        ['i $pzk in giro', pzk.fmtCorto(d.cap?.pzk ?? 0)],
        ['valgono', `${pzk.fmtCorto(Math.round(d.cap?.valore ?? (d.cap?.pzk ?? 0) * d.tasso))} €`],
        ['i conti', fmt(d.cap?.conti ?? 0)],
      ]
      // (11.11: le quattro variazioni nei cartellini verdi o rossi; fra un cartellino e l'altro un pixel d'aria, così quelle righe
      // vanno di 10 in 10)
      const Y = [34, 43, 52, 62, 72, 82, 91, 100, 109]
      R.forEach(([n, v, d], i) => {
        const nome = corto(n, 38 - [...v].length)
        if (d === undefined) return puntini(l, Y[i], nome, v)
        const xb = cartellino(l, 245, Y[i], d) - 3
        l.testo(10, Y[i], nome)
        for (let xx = 10 + Lcd.larghezza(nome) + 4; xx < xb; xx += 3) l.px(xx, Y[i] + 6) // (i puntini di puntini(), fino al cartellino)
      })
    },
  }

  return pagine(os, {
    nome: 'banca', app: 'banca',
    pagine: [portafoglio, grafico, numeri],
    ascolta: [(f) => pzk.osserva(f)],
    entra: aggiorna,
  })
}

/** Una linea di un pixel (Bresenham). */
function linea(l, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let e = dx + dy
  for (;;) {
    l.px(x0, y0)
    if (x0 === x1 && y0 === y1) return
    const e2 = 2 * e
    if (e2 >= dy) { e += dy; x0 += sx }
    if (e2 <= dx) { e += dx; y0 += sy }
  }
}
