// Le impostazioni di pzk os (29.10, Alberto: «fai impostazioni per regolare la luminosità, i suoni, il led rosso…»): la
// luminosità della retroilluminazione, i suoni (lo stesso interruttore del sito: localStorage pzkko-suono, come la regia),
// il led rosso delle notifiche, l'inclinazione del cercapersone col mouse, e la guida da rivedere. Stanno in localStorage
// (pzkko-zero-impostazioni) e chi le usa (zero.js, muro.js, os.js) le legge da qui e si mette in ascolto.
//
//   leggi() → { luminosita (0.3–1), suoni, led, inclina, sfondo }   imposta(chiave, valore)   ascolta(fn)
//   vista() → la vista dell'app Impostazioni (una lista di righe: sinistra/destra cambiano, OK conferma o apre)
import { Lcd, W, H, D, SFONDI, sfondo, C, colore } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import { corto, centro, puntini, testata } from './pezzi.js'

const CHIAVE = 'pzkko-zero-impostazioni'
const BASE = { luminosita: 1, led: true, inclina: true, sfondo: 'arancione' } // (11.11: lo sfondo, SFONDI di lcd.js)
let I = null
const ascolti = new Set()
export const ascolta = (fn) => { ascolti.add(fn); return () => ascolti.delete(fn) }

export function leggi() {
  if (!I) {
    try { I = { ...BASE, ...(JSON.parse(localStorage.getItem(CHIAVE) || '{}')) } } catch { I = { ...BASE } }
    // (11.11: un valore rovinato nel browser, «abc» o null, arrivava all'lcd come luce NaN, e le informazioni scrivevano «NaN %»)
    const lu = Number(I.luminosita)
    I.luminosita = Number.isFinite(lu) && I.luminosita !== null ? Math.max(0.3, Math.min(1, lu)) : BASE.luminosita
  }
  let suoni = false
  try { suoni = localStorage.getItem('pzkko-suono') === 'si' } catch {}
  return { ...I, suoni }
}
export function imposta(k, v) {
  leggi()
  // (11.11: nella home c'è la strada, window.pzkkoSuono, e i suonini suonano solo se lei è accesa: scrivere solo
  // pzkko-suono lasciava «suoni sì» muti fino a ricaricare, e «no» lasciava andare strada e musica. Si gira il suo
  // interruttore, come il nastro e la regia; dove non c'è basta il localStorage. Accesi subito, dentro il gesto: il
  // browser fa nascere l'audio solo lì. Spenti un attimo dopo, perché il bip del tasto che li spegne è già partito)
  if (k === 'suoni') {
    try { localStorage.setItem('pzkko-suono', v ? 'si' : 'no') } catch {}
    const S = window.pzkkoSuono
    if (S?.accendi) { if (v) S.accendi(true, true); else setTimeout(() => { if (!leggi().suoni) S.accendi(false, true) }) }
  }
  else { I[k] = v; try { localStorage.setItem(CHIAVE, JSON.stringify(I)) } catch {} }
  for (const f of ascolti) f(leggi())
}

const LIVELLI = [0.3, 0.45, 0.6, 0.8, 1]

// (11.11, Alberto: «fai colori a 8bit su tutto»: i colori dove dicono qualcosa. Sulla riga dello sfondo scelta, la fila
// dei campioni di tutti gli sfondi; la barra della luminosità coi quadretti gialli; il led rosso acceso o spento; il ✓ di
// «di fabbrica» verde. Il testo resta d'inchiostro)
const LED_SPENTO = colore(102, 0, 0)
const campioni = new Map()
// il campione di uno sfondo, 8 × 8 pixel d'impaginazione: il suo colore, o il suo motivo preso un pixel vero ogni quattro
// a metà schermo (così i puntini, gli scacchi, le righe e le sfumature si vedono tutti, anche in un quadretto)
function campione(s) {
  let c = campioni.get(s.id)
  if (!c) {
    const f = s.fondo, n = 8 * D
    c = new Uint8Array(n * n)
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const p = typeof f === 'function' ? f(4 * i, 112 + 4 * j) : f; c[j * n + i] = colore(p[0], p[1], p[2]) }
    campioni.set(s.id, c)
  }
  return c
}
function disegnaCampione(l, s, x, y, w, h) {
  const c = campione(s), n = 8 * D
  for (let j = 0; j < h * D; j++) for (let i = 0; i < w * D; i++) l.pv(x * D + i, y * D + j, c[j * n + i])
}
// IL 29.10 NOTTE (Alberto: «… e impostazioni: falle tutte maniacalmente perfette»): la testata e il suggerimento in fondo
// come le altre app, la luminosità che con OK gira in tondo (prima al massimo si fermava), le informazioni del cercapersone
// e «di fabbrica», che rimette luminosità, led e inclinazione com'erano (i suoni no: sono l'interruttore di tutto il sito)
function informazioni(os) {
  return {
    nome: 'impostazioni-info', app: 'impostazioni',
    disegna(l) {
      testata(l, os, { icona: 'impostazioni', nome: 'il cercapersone', n: 1 })
      const c = pzk.conto(), i = leggi()
      const R = [
        ['modello', 'cercapersone zero'], ['sistema', 'pzk os, 29.10.2026'], ['schermo', '512 × 256, 256 colori'],
        ['tasti', 'la croce, OK, INDIETRO'], ['conto', c ? `${corto(c.nome, 20)} · ${c.ind}` : 'nessuno'], // (11.11: tagliato a 22 un nome di 20 lettere perdeva l'indirizzo; interi stanno, 32 lettere)
        ['luminosità', `${Math.round(i.luminosita * 100)} %`], ['suoni', i.suoni ? 'accesi' : 'spenti'], ['il sito', 'pzkko.it'],
      ]
      R.forEach(([n, v], k) => puntini(l, 35 + k * 10, n, v))
      centro(l, H - 9, 'INDIETRO torna')
      os.zona?.(6, 33, W - 12, H - 39, () => os.togli()) // (11.11: il clic fa come OK, come nella guida; prima non faceva niente)
    },
    tasto(n) { if (n === 'indietro' || n === 'ok') { os.togli(); return true } return n === 'su' || n === 'giu' || n === 'sx' || n === 'dx' },
  }
}
export function vista(os) {
  // il livello più vicino (una luminosità salvata da una versione vecchia, 0,5, contava come l'ultima: ← la schiariva)
  const livello = (i) => LIVELLI.reduce((a, l, k) => (Math.abs(l - i.luminosita) < Math.abs(LIVELLI[a] - i.luminosita) ? k : a), LIVELLI.length - 1)
  const passoLuce = (i, d, giro = false) => {
    const k = livello(i) + d
    imposta('luminosita', LIVELLI[giro ? (k + LIVELLI.length) % LIVELLI.length : Math.max(0, Math.min(LIVELLI.length - 1, k))])
  }
  // (11.11, Alberto: «dammi impostazione per cambiare sfondo»: ←→ lo cambiano e si vede subito, OK va avanti in tondo)
  const passoSfondo = (i, d) => { const k = SFONDI.indexOf(sfondo(i.sfondo)); imposta('sfondo', SFONDI[(k + d + SFONDI.length) % SFONDI.length].id) }
  const righe = [
    { k: 'luminosita', nome: 'luminosità', valore: (i) => LIVELLI.map((l) => (l <= i.luminosita + 0.01 ? '■' : '□')).join(''), cambia: (i, d) => passoLuce(i, d), puo: (i, d) => LIVELLI[livello(i) + d] !== undefined, ok: () => passoLuce(leggi(), 1, true),
      // (11.11: al massimo diceva «←→ meno o più», ma → non faceva niente: come le frecce, nomina solo quello che va)
      aiuto: (i) => (livello(i) === LIVELLI.length - 1 ? '← meno · OK gira' : livello(i) === 0 ? '→ più · OK gira' : '←→ meno o più · OK gira') },
    { k: 'sfondo', nome: 'sfondo', valore: (i) => sfondo(i.sfondo).nome, cambia: passoSfondo, ok: () => passoSfondo(leggi(), 1), aiuto: '←→ cambia lo sfondo · ↑↓ righe' },
    { k: 'suoni', nome: 'suoni', valore: (i) => (i.suoni ? 'sì' : 'no'), cambia: (i) => { imposta('suoni', !i.suoni); if (!i.suoni) os.suoni?.bip('scheda') } }, // (accesi: un bip di conferma, perché quello del tasto è suonato quando erano ancora spenti)
    { k: 'led', nome: 'led rosso', valore: (i) => (i.led ? 'sì' : 'no'), cambia: (i) => imposta('led', !i.led) },
    { k: 'inclina', nome: 'inclina col mouse', valore: (i) => (i.inclina ? 'sì' : 'no'), cambia: (i) => imposta('inclina', !i.inclina) },
    { k: 'guida', nome: 'rivedi la guida', valore: () => '', ok: () => os.guida(), aiuto: 'OK la guida · ↑↓ righe' },
    { k: 'info', nome: 'il cercapersone', valore: () => '', ok: () => os.spingi(informazioni(os)), aiuto: 'OK le informazioni · ↑↓ righe' },
    { k: 'fabbrica', nome: 'come di fabbrica', valore: () => '', ok: async () => {
      const r = await os.dialogo({ titolo: 'di fabbrica', testo: 'luminosità piena, sfondo arancione, led acceso, inclinazione col mouse accesa. I suoni restano come sono.', icona: 'impostazioni', tasti: ['no', 'sì'] })
      if (r !== 'sì' || os.corrente() !== app) return // (11.11: INDIETRO dà null, e dopo l'attesa si guarda di essere ancora in cima)
      for (const [k, v] of Object.entries(BASE)) imposta(k, v)
      lampo = 15 // (11.11: il ✓ per un secondo e mezzo, il massimo di un'animazione; in sei decimi non si leggeva)
    }, aiuto: 'OK rimette tutto · ↑↓ righe' },
  ]
  let sel = 0, lampo = 0
  const app = {
    nome: 'impostazioni', app: 'impostazioni',
    entra() { this.via = ascolta(() => os.ridisegna()) },
    esci() { this.via?.() },
    tic() { if (lampo > 0) { lampo--; os.ridisegna() } },
    disegna(l) {
      const i = leggi()
      testata(l, os, { icona: 'impostazioni', nome: 'impostazioni', n: 1 })
      righe.forEach((r, j) => {
        const y = 34 + j * 10, on = j === sel // (11.11: otto righe, da 10: con 11 l'ottava toccava il suggerimento)
        if (on || (r.k === 'fabbrica' && lampo % 2)) l.riempi(6, y - 1, W - 12, 10)
        const inv = on || (r.k === 'fabbrica' && lampo % 2 === 1)
        l.testo(10, y, r.nome, { inv })
        // il valore a destra; scelto e cambiabile, fra ◀ e ▶ (tutto DENTRO la fascia scura: il ▶ stava fuori, scritto in
        // chiaro sull'arancione, e non si vedeva); una riga che apre qualcosa ha il › in fondo
        // (11.11: «di fabbrica» fatto faceva lampeggiare la fascia, ma la riga è quella scelta e la fascia c'era già: non si
        // vedeva niente. Per il lampo c'è il ✓ al posto del ›, dentro la fascia)
        const v = (r.k === 'fabbrica' && lampo > 0 ? '✓' : r.valore(i)) || (r.cambia ? '' : '›'), frecce = on && r.cambia, x = W - 10 - (frecce ? 10 : 0) - Lcd.larghezza(v)
        // (11.11: al massimo il ▶ c'era ancora e → non faceva niente, al minimo lo stesso il ◀: c'è solo la freccia che va)
        const meno = frecce && (r.puo?.(i, -1) ?? true), piu = frecce && (r.puo?.(i, 1) ?? true)
        if (meno) l.testo(x - 10, y, '◀', { inv: true })
        if (piu) l.testo(W - 15, y, '▶', { inv: true })
        const fr = inv ? 0 : 1 // (le cornici dei disegni: d'inchiostro, o del fondo dentro la fascia)
        if (r.k === 'luminosita') {
          // (11.11: la barra coi quadretti gialli dentro la cornice, al posto di ■ e □: la cornice si legge su ogni sfondo)
          LIVELLI.forEach((lv, k) => { l.riquadro(x + k * 6, y, 5, 7, fr); if (lv <= i.luminosita + 0.01) l.riempi(x + k * 6 + 1, y + 1, 3, 5, C.giallo) })
        } else if (r.k === 'fabbrica' && lampo > 0) {
          // (11.11: il ✓ nero su un bollino verde: si legge sulla fascia e fuori, di giorno e di notte)
          l.riempi(x - 2, y - 1, 9, 9, C.verde)
          l.testo(x, y, v, { col: C.nero })
        } else l.testo(x, y, v, { inv })
        if (r.k === 'led') {
          // (11.11: il led vero, prima del valore e del ◀: rosso col riflesso se è acceso, rosso scuro se è spento)
          const lx = x - (meno ? 10 : 0) - 10, rosso = i.led ? C.rosso : LED_SPENTO
          l.riempi(lx + 1, y, 5, 7, fr); l.riempi(lx, y + 1, 7, 5, fr)
          l.riempi(lx + 2, y + 1, 3, 5, rosso); l.riempi(lx + 1, y + 2, 5, 3, rosso)
          if (i.led) l.pv((lx + 2) * D, (y + 2) * D, C.bianco)
        }
        // il clic: la riga la sceglie e la fa (come OK); sulla riga scelta ◀ e ▶ abbassano e alzano
        os.zona?.(6, y - 1, W - 12, 10, () => { sel = j; if (r.ok) r.ok(); else r.cambia?.(leggi(), 1) })
        if (meno) os.zona?.(x - 13, y - 1, 11, 10, () => r.cambia(leggi(), -1))
        if (piu) os.zona?.(W - 18, y - 1, 12, 10, () => r.cambia(leggi(), 1))
        if (r.k === 'sfondo' && on) {
          // (11.11: sulla riga scelta, fra il nome e il ◀, i campioni di tutti gli sfondi in una cornice grigia, che si vede
          // sulla fascia scura e su quella chiara di «notte» (la notte sulla fascia scura, la carta su quella chiara);
          // quello di adesso più alto e nella cornice bianca. Il clic ne sceglie uno)
          const att = sfondo(i.sfondo), x0 = 52, passo = Math.min(9, Math.floor((x - 14 - x0) / SFONDI.length))
          SFONDI.forEach((s, k) => {
            const sx = x0 + k * passo
            if (s === att) { l.riempi(sx, y, passo - 1, 8, C.bianco); disegnaCampione(l, s, sx + 1, y + 1, passo - 3, 6) }
            else { l.riempi(sx, y + 1, passo - 1, 6, C.grigio); disegnaCampione(l, s, sx + 1, y + 2, passo - 3, 4) }
            os.zona?.(sx, y - 1, passo - 1, 10, () => imposta('sfondo', s.id))
          })
        }
      })
      const r = righe[sel]
      centro(l, H - 9, (typeof r.aiuto === 'function' ? r.aiuto(i) : r.aiuto) ?? '←→ o OK cambia · ↑↓ righe')
    },
    tasto(n) {
      const i = leggi(), r = righe[sel]
      if (n === 'su') sel = (sel - 1 + righe.length) % righe.length
      else if (n === 'giu') sel = (sel + 1) % righe.length
      else if (n === 'sx' && r.cambia) r.cambia(i, -1)
      else if (n === 'dx' && r.cambia) r.cambia(i, 1)
      else if (n === 'ok') { if (r.ok) r.ok(); else r.cambia?.(i, 1) }
      else if (n === 'indietro') os.togli()
      else return n === 'sx' || n === 'dx'
      return true
    },
  }
  return app
}
