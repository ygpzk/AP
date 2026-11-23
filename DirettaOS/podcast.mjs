// Diretta OS · Giugnoh's Cast: l'evento podcast.
// - La puntata: «inizia» (o il primo argomento) la mette in onda, «fine» la chiude coi saluti. Il numero della puntata
//   cresce da solo (si corregge dalla regia).
// - L'argomento a caso: lo estrae il server, mai uno già fatto in questa puntata, e manda alle pagine il rullo (le voci
//   che passano, con quella scelta all'indice «indice») e l'ora: l'animazione la calcola ogni pagina da lì
//   (pubblico/cast.js), uguale in Camo, in regia e sulla tv.
// - La tv: una pagina sola, /tv, in 4K (pubblico/tv.html). Il server delle sovrimpressioni ascolta solo su 127.0.0.1;
//   per la tv, che è un altro apparecchio in rete, c'è un secondo server sulla porta 2360 di tutte le reti del pc che
//   serve solo quella pagina, i suoi caratteri e i suoi adesivi, e il flusso del podcast (in sola lettura: niente regia,
//   niente azioni, niente webcam né foto della stanza).

import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

export const CAST = ['argomento', 'fine'] // i due pezzi della diretta: /o/argomento e /o/fine
// le schermate della tv, scelte dalla regia: il podcast com'è, solo il logo, solo l'ora, il nome (Giugnoh), chi sta
// parlando (un nome scritto in regia), un testo qualsiasi (grande quanto ci sta), il meteo di Mantova in grande
export const SCHERMI = ['podcast', 'logo', 'ora', 'nome', 'parla', 'testo', 'meteo']
// (una riga sola, corta; il testo libero tiene gli a capo, al massimo due di fila)
const riga = (x, n) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n)
const testoLibero = (x) => String(x ?? '').replace(/\r/g, '').replace(/[^\S\n]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 240)
export function pulisciSchermo(x) {
  x = x && typeof x === 'object' ? x : {}
  const nomi = Array.isArray(x.nomi) ? [...new Set(x.nomi.map((n) => riga(n, 40)).filter(Boolean))].slice(-12) : ['Giugnoh']
  return { s: SCHERMI.includes(x.s) ? x.s : 'podcast', testo: testoLibero(x.testo), parla: riga(x.parla, 40), nomi }
}

// gli argomenti di partenza: dalla regia si cambiano (si salvano nello stato), «quelli di partenza» torna a questi
export const PRIMI = [
  'La figuraccia più grande della tua vita',
  'Pizza con l’ananas: sì o no?',
  'Il gioco che ti ha cambiato la vita',
  'Cosa faresti con un milione di euro domani',
  'Il prof che non dimenticherai mai',
  'Il superpotere più inutile che vorresti',
  'Mantova è la città più bella d’Italia?',
  'Red Bull: quante sono troppe?',
  'La cosa più cringe che hai fatto alle medie',
  'Un giorno da invisibile: cosa fai?',
  'Il film che tutti amano e tu no',
  'Meglio l’estate o l’inverno',
  'Il cibo più sopravvalutato del mondo',
  'Se potessi vivere dentro un videogioco',
  'La canzone che ascolti di nascosto',
  'Tre cose su un’isola deserta',
  'Tortelli di zucca contro tutto il resto',
  'Il tuo primo telefono',
  'La teoria del complotto più assurda',
  'Quante volte rimandi la sveglia',
  'Il sogno più strano che ricordi',
  'Il viaggio dei sogni',
  'Cosa cambieresti della scuola',
  'L’animale che vorresti in casa',
  'Il meme dell’anno',
  'La chiamata su Discord più lunga di sempre',
  'Dove sarai fra dieci anni',
  'Il regalo più brutto che hai ricevuto',
  'La nebbia padana: pro e contro',
  'Hai mai creduto a una bufala?',
  'L’app che non cancelleresti mai',
  'La serie tv da vedere per forza',
  'Colazione dolce o salata',
  'Il soprannome più strano che hai avuto',
  'La cosa più costosa che hai rotto',
  'CS2, Minecraft o Fortnite',
  'Sindaco per un giorno: la prima legge',
  'La paura più irrazionale',
  'Il lavoro dei sogni da bambino',
  'La lite più stupida con un amico',
  'Cosa non manca mai nel tuo frigo',
  'Il messaggio che non dovevi mandare',
  'Gaming su pc o su console',
  'Il posto più bello dove hai dormito',
  'Una regola di casa che odiavi',
  'La moda di adesso che non capisci',
  'Il tuo record più inutile',
  'Cosa compreresti con i $pzk',
]

// una lista di argomenti pulita: testi corti, niente vuoti né doppioni (null se non è una lista)
export function pulisciLista(l, vuota = false) {
  if (!Array.isArray(l)) return null
  const fuori = [...new Set(l.map((x) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, 90)).filter(Boolean))].slice(0, 200)
  return fuori.length || vuota ? fuori : null
}

export function creaPodcast({ stato, salvato = {}, conf = {}, log = () => {}, diStato = () => {}, salva = () => {}, file, pubblico, sito, senzaTv = false }) {
  const s = salvato.podcast ?? {}
  const numero = (x) => (Number.isFinite(x) ? x : null)
  const P = stato.podcast = {
    argomenti: pulisciLista(s.argomenti, Array.isArray(s.argomenti)) ?? pulisciLista(conf.argomenti) ?? [...PRIMI],
    puntata: numero(s.puntata) ?? 0,
    inizio: numero(s.inizio),
    fine: numero(s.fine),
    scaletta: Array.isArray(s.scaletta) ? s.scaletta.filter((x) => x && typeof x.testo === 'string' && Number.isFinite(x.da)).slice(-60) : [],
    argomento: s.argomento && typeof s.argomento.testo === 'string' && Array.isArray(s.argomento.rullo) ? s.argomento : null,
    specchio: !!s.specchio,
    schermo: pulisciSchermo(s.schermo), // quello che fa vedere la tv (la regia lo sceglie)
  }
  const PORTA_TV = +process.env.DIRETTA_TV_PORTA || conf.tvPorta || 2360
  stato.tv = { porta: PORTA_TV, indirizzi: [], acceso: false, guarda: 0 }

  const inOnda = () => !!P.inizio && !P.fine
  function nuovaPuntata() {
    P.puntata += 1; P.inizio = Date.now(); P.fine = null; P.scaletta = []; P.argomento = null
    P.schermo.s = 'podcast' // (la tv torna alla puntata)
    log(`podcast: in onda la puntata ${P.puntata}`)
  }
  // l'argomento a caso: mai uno già fatto in questa puntata (finiti quelli, tutti tranne quello di adesso). Un argomento
  // rifatto entro 15 secondi è saltato: esce dalla scaletta e torna fra quelli da fare
  function estrai() {
    const tutti = P.argomenti
    if (!tutti.length) return false
    if (!inOnda()) nuovaPuntata()
    let saltato = null
    if (P.argomento && Date.now() - P.argomento.da < 15000 && P.scaletta.at(-1)?.da === P.argomento.da) { saltato = P.argomento.testo; P.scaletta.pop() }
    const fatti = new Set(P.scaletta.map((x) => x.testo))
    let pesca = tutti.filter((a) => !fatti.has(a) && a !== saltato)
    if (!pesca.length) pesca = tutti.filter((a) => a !== P.argomento?.testo)
    if (!pesca.length) pesca = tutti
    const scelto = pesca[Math.floor(Math.random() * pesca.length)]
    const altri = tutti.filter((a) => a !== scelto)
    const unAltro = (no) => {
      if (!altri.length) return scelto
      let x = altri[Math.floor(Math.random() * altri.length)]
      for (let i = 0; i < 6 && x === no && altri.length > 1; i++) x = altri[Math.floor(Math.random() * altri.length)]
      return x
    }
    // il rullo: 26 voci che passano, quella scelta, e due dopo (si vedono sotto quando si ferma)
    const rullo = []
    for (let i = 0; i < 26; i++) rullo.push(unAltro(rullo.at(-1)))
    const indice = rullo.length
    rullo.push(scelto, unAltro(scelto), unAltro(scelto))
    const da = Date.now()
    P.argomento = { testo: scelto, da, rullo, indice, n: P.scaletta.length + 1 }
    P.scaletta.push({ testo: scelto, da })
    if (P.scaletta.length > 60) P.scaletta.shift()
    stato.attivi.argomento = true; stato.attivi.fine = false
    P.schermo.s = 'podcast'
    log(`podcast: argomento ${P.argomento.n} della puntata ${P.puntata}: ${scelto}`)
    return true
  }
  function finePuntata() {
    if (!inOnda()) return false
    P.fine = Date.now()
    stato.attivi.fine = true; stato.attivi.argomento = false
    P.schermo.s = 'podcast'
    log(`podcast: fine della puntata ${P.puntata} (${Math.round((P.fine - P.inizio) / 60000)} minuti, ${P.scaletta.length} argomenti)`)
    return true
  }
  function chiudi() {
    P.inizio = null; P.fine = null; P.argomento = null; P.scaletta = []
    stato.attivi.argomento = false; stato.attivi.fine = false
  }

  // ── le azioni della regia (tipo: 'podcast') ──
  function azione(a) {
    if (a.cosa === 'inizia') { nuovaPuntata(); stato.attivi.fine = false }
    else if (a.cosa === 'argomento') { if (!estrai()) return false }
    else if (a.cosa === 'fine') { if (!finePuntata()) return false }
    else if (a.cosa === 'chiudi') chiudi()
    else if (a.cosa === 'riprendi') { if (!P.fine) return false; P.fine = null; stato.attivi.fine = false } // (fine premuto per sbaglio: torna in onda)
    else if (a.argomenti !== undefined) { const l = a.argomenti === 'primi' ? [...PRIMI] : pulisciLista(a.argomenti, true); if (!l) return false; P.argomenti = l }
    else if (Number.isFinite(a.puntata) && a.puntata >= 0 && a.puntata < 10000) P.puntata = Math.round(a.puntata)
    else if (typeof a.specchio === 'boolean') P.specchio = a.specchio
    // la tv: la schermata, il testo, chi parla (il nome va anche nella lista dei nomi), la lista dei nomi
    else if (a.schermo !== undefined || a.testo !== undefined || a.parla !== undefined || a.nomi !== undefined) {
      const S = P.schermo
      if (a.schermo !== undefined) { if (!SCHERMI.includes(a.schermo)) return false; S.s = a.schermo }
      if (typeof a.testo === 'string') S.testo = testoLibero(a.testo)
      if (typeof a.parla === 'string') { S.parla = riga(a.parla, 40); if (S.parla && !S.nomi.includes(S.parla)) S.nomi = [...S.nomi, S.parla].slice(-12) }
      if (Array.isArray(a.nomi)) { S.nomi = pulisciSchermo({ nomi: a.nomi }).nomi; if (!S.nomi.includes(S.parla)) S.parla = S.nomi[0] ?? '' }
    }
    else return false
    return true
  }
  // dopo l'interruttore di un pezzo in regia: «argomento» acceso senza un argomento in onda ne estrae uno; «fine» acceso
  // chiude la puntata (se non ce n'è una in onda né una appena finita, resta spento)
  function dopoPezzo(nome, su) {
    if (!su) return
    if (nome === 'argomento' && !(inOnda() && P.argomento)) { if (!estrai()) stato.attivi.argomento = false }
    if (nome === 'fine') { if (inOnda()) finePuntata(); else if (!P.fine) stato.attivi.fine = false; else stato.attivi.argomento = false }
  }

  // ── la tv: il flusso (solo il podcast, il livello del microfono e l'ora del pc per stare a tempo) ──
  const tv = new Set()
  let versione = ''
  const meteoTv = () => { const m = stato.meteo; return m ? { nome: m.nome, gradi: m.gradi, percepiti: m.percepiti, testo: m.testo, icona: m.icona, min: m.min, max: m.max, vento: m.vento, umido: m.umido } : null }
  const perTv = () => ({ puntata: P.puntata, inizio: P.inizio, fine: P.fine, scaletta: P.scaletta, argomento: P.argomento, specchio: P.specchio, quanti: P.argomenti.length, schermo: P.schermo, meteo: meteoTv(), versione })
  let ultimo = ''
  const mandaTv = (evento, dati) => { const r = `event: ${evento}\ndata: ${JSON.stringify(dati)}\n\n`; for (const c of tv) c.res.write(r) }
  function aggiorna() { // (a ogni cambio di stato: alla tv solo se il podcast è cambiato)
    if (!tv.size) return
    const j = JSON.stringify(perTv())
    if (j === ultimo) return
    ultimo = j
    mandaTv('podcast', { ...perTv(), ora: Date.now() })
  }
  const guardano = () => [...tv].filter((c) => c.fuori).length // (le tv vere: non questa macchina)
  function flusso(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
    res.write(`retry: 1500\nevent: podcast\ndata: ${JSON.stringify({ ...perTv(), ora: Date.now() })}\n\n`)
    const da = req.socket.remoteAddress ?? ''
    const c = { res, fuori: !/^(::1|127\.|::ffff:127\.)/.test(da) }
    tv.add(c)
    if (c.fuori) { stato.tv.guarda = guardano(); diStato(); log(`tv: collegata (${da.replace('::ffff:', '')})`) }
    req.on('close', () => { tv.delete(c); if (c.fuori) { stato.tv.guarda = guardano(); diStato() } })
  }
  const picco = (v) => { if (tv.size) mandaTv('picco', { mic: +(+v || 0).toFixed(3) }) }
  // la versione della tv: quando il server riparte o cambiano tv.html, tv.css, tv.js, cast.js, la tv si ricarica da sola
  // (sulla tv non si tocca niente)
  const avvio = Date.now()
  function controllaVersione() {
    let t = 0
    for (const f of ['tv.html', 'tv.css', 'tv.js', 'cast.js']) { try { t = Math.max(t, fs.statSync(path.join(pubblico, f)).mtimeMs) } catch {} }
    const v = `${avvio}.${Math.round(t)}`
    if (v !== versione) { versione = v; aggiorna() }
  }
  controllaVersione(); setInterval(controllaVersione, 3000)
  setInterval(() => mandaTv('batti', { ora: Date.now() }), 15000)

  // la pagina della tv anche sul server di sempre (per provarla sul pc: http://localhost:2350/tv)
  function servi(req, res, p) {
    if (p === '/canale' || p === '/canale/') { res.writeHead(302, { Location: '/tv' }).end(); return true }
    if (p === '/tv' || p === '/tv/') { file(res, pubblico, 'tv.html'); return true }
    if (p === '/api/tv') { flusso(req, res); return true }
    return false
  }

  // gli indirizzi del pc nelle sue reti (per la regia: quello da scrivere sulla tv); il wi-fi può cambiarlo
  function indirizzi() {
    const l = Object.entries(os.networkInterfaces()).flatMap(([nome, v]) => (v ?? []).filter((x) => x.family === 'IPv4' && !x.internal && !x.address.startsWith('169.254')).map((x) => ({ rete: nome, url: `http://${x.address}:${PORTA_TV}/` })))
      .sort((a, b) => (/tailscale/i.test(a.rete) ? 1 : 0) - (/tailscale/i.test(b.rete) ? 1 : 0)) // (prima il Wi-Fi: è quello che vede la TV)
    if (JSON.stringify(l) !== JSON.stringify(stato.tv.indirizzi)) { stato.tv.indirizzi = l; diStato() }
  }
  indirizzi(); setInterval(indirizzi, 60000)

  // il server della tv: tutte le reti, solo GET, solo la pagina della tv e quello che le serve
  const SUOI = new Set(['/tv.js', '/tv.css', '/cast.js', '/logo.svg'])
  if (!senzaTv) {
    const tvServer = http.createServer((req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
      let p
      try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname) } catch { res.writeHead(400).end(); return }
      if (p === '/') p = '/tv'
      if (servi(req, res, p)) return
      if (SUOI.has(p)) return file(res, pubblico, p)
      if ((p.startsWith('/fonts/') && p.endsWith('.woff2')) || (p.startsWith('/art/') && p.endsWith('.webp'))) return file(res, sito, p, 'max-age=86400')
      res.writeHead(404).end()
    })
    tvServer.on('error', (e) => { stato.tv.acceso = false; diStato(); log(`tv: la porta ${PORTA_TV} non si apre (${e.code ?? e.message}): la pagina della tv c'è solo su questo pc, /tv`) })
    tvServer.listen(PORTA_TV, '0.0.0.0', () => { stato.tv.acceso = true; diStato(); log(`tv: Giugnoh's Cast per la tv su ${stato.tv.indirizzi.map((x) => x.url).join(' · ') || `porta ${PORTA_TV}`}`) })
  }

  return { azione, dopoPezzo, aggiorna, picco, servi, inOnda }
}
