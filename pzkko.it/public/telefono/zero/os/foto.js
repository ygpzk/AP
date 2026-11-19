// L'app «foto» di pzk os (29.10, Alberto: «crea uno alla volta … foto …»): le foto vere dei quiz (chat/immagini.js:
// Mantova, il cibo, il Landini, il Ciao…, da Wikimedia Commons o da Imgur, con l'autore e la licenza), sul cercapersone zero.
// Arrivano a colori a 8 bit col retino di Bayer (icone.foto, dall'11.11); una che il browser non lascia leggere ha il punto di domanda.
// - LA GALLERIA: le miniature cinque per riga (le frecce si muovono, la riga scorre), sotto cosa è quella scelta. OK la apre.
// - LA FOTO: a tutto schermo, senza la barra; sotto cosa è e il credito. ← → la prima e la dopo, OK o INDIETRO tornano.
// Le regole: os/REGOLE.md.
import { Lcd, W, H, C } from './lcd.js'
import * as icone from './icone.js'
import { IMMAGINI, src, credito } from '../../../chat/immagini.js'
import { txt, corto, destra, centro, pagine } from './pezzi.js'

const IDS = Object.keys(IMMAGINI)
const COL = 5, CW = 46, CH = 36, RIGHE = 2
let sel = 0 // (si ricorda finché la pagina è aperta: si torna sulla stessa foto)

// (11.11, i colori a 8 bit: le foto sono già a colori; il posto di quella che manca è un riquadro grigio, un grigio medio che
// si vede sull'arancione, sulla carta e sulla notte: a puntini mentre arriva, pieno col «?» se non arriva. Prima era un pixel)
const GRIGIO = C.grigio
function posto(l, x, y, w, h, puntini) {
  for (let i = 0; i < w; i++) if (!puntini || i % 2 === 0) { l.px(x + i, y, GRIGIO); l.px(x + i, y + h - 1, GRIGIO) }
  for (let j = 1; j < h - 1; j++) if (!puntini || j % 2 === 0) { l.px(x, y + j, GRIGIO); l.px(x + w - 1, y + j, GRIGIO) }
}

/** Una foto nel riquadro x, y, w, h: centrata; mentre arriva «carico», se non si può il punto di domanda. */
function riquadro(l, os, id, x, y, w, h, piccola) {
  const b = icone.foto(src(id), w, h, () => os.ridisegna())
  if (b === 'carico' || b === 'no') {
    const s = b === 'carico' ? (piccola ? '' : 'carico…') : piccola ? '?' : 'la foto non si lascia vedere'
    if (piccola) posto(l, x + 1, y + 1, w - 2, h - 2, b === 'carico') // (dentro il pixel chiaro della scelta)
    else l.bitmap(icone.bitmap('app-foto', 32), x + Math.round(w / 2) - 16, y + Math.round(h / 2) - 24, { sbiadita: b === 'no' }) // (la macchina fotografica a colori dell'app; sbiadita se la foto non arriva)
    if (s) l.testo(x + Math.round(w / 2 - Lcd.larghezza(s) / 2), y + Math.round(h / 2) + (piccola ? -3 : 12), s)
    return
  }
  l.bitmap(b, x + Math.round((w - b.w) / 2), y + Math.round((h - b.h) / 2))
}

/** Il credito in n caratteri: «foto: autore · licenza», e «· Wikimedia Commons» solo se ci sta intero. Se non ci sta, si
 *  accorcia l'autore e la licenza resta (11.11: tagliato a 34 caratteri, in 47 foto su 126 la licenza spariva e restava «· …»). */
function creditoCorto(id, n) {
  const p = txt(credito(id) ?? '').split(' · ')
  if (p.length < 2) return corto(p[0], n)
  const coda = ` · ${p[1]}`
  let s = p[0] + coda
  if ([...s].length > n) return [...coda].length > n - 8 ? corto(s, n) : corto(p[0], n - [...coda].length) + coda
  for (const q of p.slice(2)) { const t = `${s} · ${q}`; if ([...t].length > n) break; s = t }
  return s
}

// ── una foto a tutto schermo ──
function grande(os) {
  const qui = () => os.corrente() === g // (le zone restano quelle vecchie fino al disegno dopo, 100 ms: un doppio clic in mezzo usciva dall'app, 11.11)
  const g = {
    nome: 'foto-grande', app: 'foto', senzaBarra: true,
    entra() { this.via = [icone.ascolta(() => os.ridisegna())] },
    esci() { this.via?.forEach((f) => f()) },
    disegna(l) {
      const id = IDS[sel], x = IMMAGINI[id]
      riquadro(l, os, id, 14, 2, 228, 106, false) // (dentro le punte stondate dello schermo)
      centro(l, 110, corto(`${sel + 1}/${IDS.length} · ${txt(x.cosa)}`, 38))
      centro(l, 119, creditoCorto(id, 34))
      os.zona(0, 0, W / 3, 108, () => { if (qui()) sel = (sel - 1 + IDS.length) % IDS.length })
      os.zona(W / 3, 0, W / 3, 108, () => { if (qui()) os.togli() })
      os.zona((2 * W) / 3, 0, W / 3, 108, () => { if (qui()) sel = (sel + 1) % IDS.length })
    },
    tasto(k) {
      if (k === 'sx' || k === 'su') sel = (sel - 1 + IDS.length) % IDS.length
      else if (k === 'dx' || k === 'giu') sel = (sel + 1) % IDS.length
      else if (k === 'ok' || k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return g
}

// ── la galleria ──
export function vista(os) {
  let da = 0 // la prima riga che si vede
  const n = IDS.length, ultimaRiga = Math.floor((n - 1) / COL)
  // la riga della scelta in vista: dopo ogni tasto e entrando (la foto grande sposta sel), non in disegna (4.8)
  const inVista = () => { const r = Math.floor(sel / COL); if (r < da) da = r; if (r >= da + RIGHE) da = r - RIGHE + 1 }
  // le frecce girano in tondo (3.5): ← dalla prima va all'ultima; ↑ dalla prima riga va all'ultima, nella stessa colonna
  // (o all'ultima foto, se lì la colonna è vuota); ↓ dall'ultima riga torna alla prima
  const muovi = (k) => {
    const r = Math.floor(sel / COL)
    if (k === 'sx') sel = (sel - 1 + n) % n
    else if (k === 'dx') sel = (sel + 1) % n
    else if (k === 'su') sel = r > 0 ? sel - COL : Math.min(n - 1, ultimaRiga * COL + (sel % COL))
    else sel = r < ultimaRiga ? Math.min(n - 1, sel + COL) : sel % COL
    inVista()
  }
  return pagine(os, {
    nome: 'foto', app: 'foto',
    ascolta: [(f) => icone.ascolta(f)],
    pagine: [{
      nome: `le foto · ${IDS.length}`, icona: 'app-foto', aiuto: 'OK la guardi · le frecce scelgono',
      ok: (x) => { if (x.qui()) os.spingi(grande(os)) }, // (un doppio clic apriva due foto grandi una sopra l'altra, e INDIETRO restava sulla foto, 11.11)
      entra: inVista,
      disegna(l, x) {
        const x0 = Math.round(W / 2 - (COL * CW) / 2)
        for (let i = 0; i < RIGHE * COL; i++) {
          const k = da * COL + i
          if (k >= IDS.length) break
          const cx = x0 + (i % COL) * CW, cy = 34 + Math.floor(i / COL) * CH, on = k === sel
          riquadro(l, os, IDS[k], cx + 2, cy + 2, CW - 4, CH - 4, true)
          if (on) { l.riquadro(cx, cy, CW, CH); l.riquadro(cx + 1, cy + 1, CW - 2, CH - 2); l.riquadro(cx + 2, cy + 2, CW - 4, CH - 4, 0) } // (la scelta: la cornice doppia, e un pixel chiaro fra cornice e foto: sulle foto scure la scelta era un blocco nero uguale alle altre, 11.11)
          x.zona(cx, cy, CW, CH, () => { if (!x.qui()) return; sel = k; os.spingi(grande(os)) }) // (il clic sceglie e preme, come il menu: prima la prima volta sceglieva e basta, 11.11)
        }
        // la barra di scorrimento e cosa è quella scelta
        const tot = Math.ceil(IDS.length / COL), alta = RIGHE * CH, h = Math.max(6, Math.round((alta * RIGHE) / tot))
        l.vert(W - 9, 34, alta); l.riempi(W - 10, 34 + Math.round(((alta - h) * da) / Math.max(1, tot - RIGHE)), 3, h)
        centro(l, 108, corto(`${sel + 1}/${IDS.length} · ${txt(IMMAGINI[IDS[sel]].cosa)}`, 38))
      },
      tasto(k) {
        if (k !== 'sx' && k !== 'dx' && k !== 'su' && k !== 'giu') return false
        muovi(k)
        return true
      },
    }],
  })
}
