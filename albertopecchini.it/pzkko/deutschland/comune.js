// Deutschland (9.11.2026): le cose in comune fra l'accesso (accesso.js, la macchinetta che chiede la password) e la
// galleria (galleria.js e i suoi moduli: griglia, mappa, visore, condividi, filtri). Le foto del viaggio a Monaco e
// Stoccarda con Mikas, Jonny e Jella NON stanno su Vercel: stanno sul pc di Alberto (C:\pzkko-server\deutschland, dietro
// il Funnel di Tailscale), e ogni richiesta porta un biglietto firmato (?b=…) che l'API /api/deutschland dà a chi sa la
// password. Qui: dove sta il server e il biglietto (`stato`, in localStorage), gli indirizzi dei file, il caso col seme,
// gli eventi fra i moduli. Il contratto completo è nel piano del cantiere (memoria «cantiere-deutschland»).
//
// Si può solo AGGIUNGERE a questo file: i tre agenti del cantiere lo importano tutti.

const CHIAVE = 'pzkko-deutschland'

/** In locale (npm run dev:pzkko su :5182, o il bot) il server delle foto è quello aperto su 127.0.0.1:8790
 *  (DEUTSCHLAND_APERTO=1: niente biglietto). */
export const LOCALE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)

/** Dove sta il server delle foto e il biglietto per entrarci. `url` senza barra finale. `cdn` (Agente 1, 9.11 sera): 'casa' =
 *  il server di casa dietro il Funnel (biglietto HMAC, `?b=`), 'b2' = il bucket privato su Backblaze B2 (token di download,
 *  `?Authorization=`); la banca lo dice insieme al biglietto. */
export const stato = { url: LOCALE ? 'http://127.0.0.1:8790' : null, biglietto: null, scade: 0, cdn: 'casa' }

/** Rilegge il biglietto salvato (se non è scaduto) e lo mette in `stato`. Torna true se c'è. */
export function leggi() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && s.url && s.biglietto && +s.scade > Date.now()) { Object.assign(stato, { url: String(s.url).replace(/\/$/, ''), biglietto: s.biglietto, scade: +s.scade, cdn: s.cdn === 'b2' ? 'b2' : 'casa' }); return true }
  } catch {}
  return LOCALE
}

/** Salva quello che l'API ha dato ({ url, biglietto, scade }) e lo mette in `stato`. */
export function salva({ url, biglietto, scade, cdn }) {
  Object.assign(stato, { url: String(url).replace(/\/$/, ''), biglietto, scade: +scade, cdn: cdn === 'b2' ? 'b2' : 'casa' })
  try { localStorage.setItem(CHIAVE, JSON.stringify({ url: stato.url, biglietto, scade: stato.scade, cdn: stato.cdn })) } catch {}
}

/** Dimentica il biglietto (il server ha risposto 404: scaduto o cambiato). */
export function dimentica() {
  Object.assign(stato, { url: LOCALE ? 'http://127.0.0.1:8790' : null, biglietto: null, scade: 0, cdn: 'casa' })
  try { localStorage.removeItem(CHIAVE) } catch {}
}

/** L'indirizzo di un file sul server delle foto: tipo = 's' (miniatura piccola 360 webp), 'm' (miniatura 480 webp), 'g'
 *  (grande 1400 jpeg), 'o' (originale), 'raw' (il DNG), 'v' (video mp4), 'p' (poster del video), 'f' (un fascio di
 *  miniature, rete.js); file = il nome nel manifesto (foto.json). Senza file: il manifesto stesso (`indirizzo('foto.json')`).
 *  Il biglietto va nella query: `?b=` per il server di casa, `?Authorization=` (il token di download) per B2. */
export function indirizzo(tipo, file) {
  const base = stato.url ?? ''
  const via = file ? `${base}/${tipo}/${file}` : `${base}/${tipo}`
  if (!stato.biglietto) return via
  return stato.cdn === 'b2' ? `${via}?Authorization=${encodeURIComponent(stato.biglietto)}` : `${via}?b=${encodeURIComponent(stato.biglietto)}`
}

/** Il caso col seme (mulberry32, copiato da barra/barra.js r.36: barra.js non si tocca). */
export const caso = (seme) => () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/** Gli eventi fra i moduli, su document, col prefisso «deutschland:»: accesso {url,biglietto,scade}, manifesto {manifesto},
 *  filtro {tag,posto}, foto {i,id}, vai {id}, apri {id}, scelta {ids}, uscita {}. */
export const evento = (nome, detail = {}) => document.dispatchEvent(new CustomEvent(`deutschland:${nome}`, { detail }))
export const ascolta = (nome, f) => { const g = (e) => f(e.detail, e); document.addEventListener(`deutschland:${nome}`, g); return () => document.removeEventListener(`deutschland:${nome}`, g) }

/** I 15 tag del catalogo, nell'ordine in cui compaiono ovunque. */
export const TAG = ['pekko', 'mikas', 'jonny', 'jella', 'cibo', 'paesaggi', 'natura', 'strada', 'auto', 'screenshot', 'hotel', 'mezzi', 'alcool', 'foto', 'video']

/** Peso leggibile («15,8 MB»). */
export const peso = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} MB` : `${Math.round(n / 1e3)} KB`)

/** (Agente 3, aggiunta) C'è un file sul sito? Una richiesta HEAD: serve a non chiedere 17 immagini che ancora non ci sono
 *  (i pacchetti, la macchinina) e riempire la console di 404: si chiede una volta e poi si usa il segnaposto. */
export const esiste = (url) => fetch(url, { method: 'HEAD', cache: 'no-cache' }).then((r) => r.ok).catch(() => false)
