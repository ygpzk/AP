// Diretta OS: la regia delle sovrimpressioni per le dirette (Camo Studio, OBS: sorgente browser 1920 × 1080).
// Un server solo, sul pc e basta (127.0.0.1): serve la regia (/), una pagina per ogni pezzo (/o/cornice, /o/tasti…),
// la pagina con tutti i pezzi insieme (/o/tutto) e il flusso dal vivo che le tiene d'accordo (/api/flusso).
// I pezzi non si pestano: ognuno ha il suo posto per ciascuna lente (pubblico/pezzi.js → POSTI), e quelli che vogliono
// lo stesso posto (legna, pipì) si danno il cambio. Niente dipendenze: Node 20 o più, PowerShell e, per il sensore
// della lente, ffmpeg.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { creaOcchio } from './occhio.mjs'
import { creaCam, chiudiBene } from './cam.mjs' // la webcam «Camo»: un lettore alla volta, chiuso con le buone
import { scatta, leggi, leggiPiccola, scrivi, finta, piccola, componi } from './foto.mjs'
import { creaMacchina, PC } from './macchina.mjs'
import { pulisci as muriPuliti } from './pubblico/muri.js' // i muri della stanza: i pezzi in prospettiva sulle pareti
import { creaPodcast, CAST } from './podcast.mjs' // Giugnoh's Cast: l'argomento a caso, la fine puntata e la pagina della tv
import { creaTv } from './tv.mjs' // la tv in rete: la trova e le apre il canale nel browser
import { creaEsterna } from './esterna.mjs' // la webcam di un altro pc in wifi (la pagina del portatile, i fotogrammi, il flusso)
import { BANDIERE, PRIMA as BANDIERA_PRIMA } from './pubblico/bandiere.js' // il catalogo delle bandiere (il pezzo «bandiera»)
import { SCENE } from './pubblico/scene-nomi.js' // le scene nuove: dove vivo, Azienda di Giugnoh, surf con lei
import { pulisci as regolaPulita } from './pubblico/regola.js' // le regolazioni di ogni sorgente: rotazione, specchio, immagine

const QUI = path.dirname(fileURLToPath(import.meta.url))
const SITO = path.resolve(QUI, '../pzkko.it/public') // i caratteri e gli oggetti sono quelli veri del sito
const json = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(QUI, f), 'utf8')) } catch { return d } }
const CONF = { ...json('config.json', {}), ...json('config.locale.json', {}) }
// (DIRETTA_PORTA e DIRETTA_STATO servono a provarne una copia accanto a quella accesa, senza toccarle lo stato)
const PORTA = +process.env.DIRETTA_PORTA || CONF.porta || 2350
const FILE_STATO = process.env.DIRETTA_STATO ?? 'stato.json'
// le foto della stanza, una per lente (05.jpg, 10.jpg): lo sfondo «foto» della regia e il sensore della lente
const RIF = path.join(QUI, process.env.DIRETTA_RIF ?? 'riferimenti')
const fotoAlle = (l) => { try { return Math.round(fs.statSync(path.join(RIF, `${l}.jpg`)).mtimeMs) } catch { return 0 } }
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a)
// i social sono tutti quelli di pzkko.it (pzkko.it/public/assets/config.js → SOCIALS), nello stesso ordine: quali
// vanno in onda e quanti follower hanno si decide dalla regia
const SOCIALS = await import(pathToFileURL(path.join(SITO, 'assets', 'config.js')).href).then((m) => m.SOCIALS ?? [], (e) => { log('i social di pzkko.it:', e.message); return [] })

// ── lo stato: quello che la regia accende e quello che i sensori vedono ──
const VIA = ['legna', 'pipi', 'bere', 'mangiare', 'lattina', 'telefono', 'spacco', 'sistemo', 'riavvio'] // i «torno subito» (lattina = la Red Bull)
const PEZZI = ['cornice', 'nome', 'spie', 'conto', 'meteo', 'tasti', 'social', 'meme', 'adv', 'adigeo', 'redbull', 'puff', ...VIA, ...PC, ...CAST, ...SCENE, 'bandiera', 'cavi', 'esterna']
// (i pezzi del pc si accendono da soli, uno per uno: «tutti» non li tocca)
const DA_SOLI = [...PC, ...CAST, ...SCENE, 'esterna'] // (e le scene, il podcast e la vista esterna: si accendono dai loro tasti)
let macchina = null // i pezzi del pc (macchina.mjs): app aperte, cpu, gpu, ram, ssd, hdd, temperatura, wi-fi
let vista = null // la vista esterna (esterna.mjs): la webcam di un portatile in wifi
const A_TURNO = [VIA] // stesso posto: se ne accende uno, gli altri si spengono
const GRANDI = [...SCENE, 'quadro'] // le scene e il quadro dei componenti: una cosa grande alla volta
const salvato = json(FILE_STATO, {})
if (salvato.attivi && 'logo' in salvato.attivi && !('nome' in salvato.attivi)) salvato.attivi.nome = salvato.attivi.logo // (il logo è diventato il nome)
// la giornata delle Red Bull comincia alle sei di mattina: quelle bevute prima di andare a letto contano per il giorno prima
const giornata = () => new Date(Date.now() - 6 * 3600e3).toLocaleDateString('sv-SE')
const stato = {
  attivi: Object.fromEntries(PEZZI.map((p) => [p, salvato.attivi?.[p] ?? ['cornice', 'nome', 'spie', 'conto', 'meteo', 'tasti', 'social', 'meme', 'adigeo', 'redbull', 'puff'].includes(p)])),
  lenteModo: salvato.lenteModo ?? 'auto', // auto | 05 | 10
  lente: '10',
  letto: salvato.letto ?? CONF.letto ?? '02:35',
  tastiTutti: salvato.tastiTutti ?? true, // la tastiera intera fa vedere tutto quello che si preme; spento: solo i tasti da gioco
  via: null, // da quando è acceso «legna» o «pipì»
  meteo: null,
  spie: { mic: { ok: false, nome: '' }, cuffie: { ok: false, nome: '' }, iphone: { ok: false } },
  sensori: { pc: false, lente: { file: null, immagine: null, id: null }, pad: null, camo: null },
  impara: salvato.impara ?? {}, // CameraID di Camo → 05 | 10, per le lenti che la regola non conosce
  posti: { '05': {}, '10': {}, ...salvato.posti }, // i posti spostati a mano dalla regia: lente → pezzo → [x, y, scala]
  redbull: salvato.redbull?.giorno === giornata() ? salvato.redbull : { giorno: giornata(), n: 0, ultima: null },
  meteoProva: null, // dalla regia: fa vedere un altro tempo (sole, pioggia, neve…) per provare
  segue: salvato.segue ?? true, // Giugnoh sta sopra la testa e la segue (l'occhio la trova nella webcam)
  gpuLeggero: !!salvato.gpuLeggero, // «risparmio GPU»: niente ombre/filtri e livello a 30 fps
  testaRif: { '05': null, '10': null, ...salvato.testaRif }, // dov'era la testa quando hai messo Giugnoh dov'è: lente → [x, y]
  puff: { gusto: '', batteria: 100, pod: 1, colore: null, zona: {}, ...salvato.puff }, // quello che scrivi in regia, il colore insegnato e la zona (lente → [x, y, w, h])
  reti: SOCIALS.map(({ key, name, handle, icon }) => ({ rete: key, nome: handle, etichetta: name, icona: icon })), // tutti i social di pzkko.it
  socialSi: salvato.socialSi ?? { instagram: true, tiktok: true, youtube: true, twitch: true }, // rete → in onda (spuntati in regia)
  social: salvato.social ?? {}, // rete → { n, alle, auto, vero }: vero è l'ultimo numero dato da Twitch
  foto: { '05': fotoAlle('05'), 10: fotoAlle('10') }, // quando è stata fatta la foto della stanza di ogni lente
  fotoCambiata: { '05': false, 10: false }, // la foto da sola non l'ha rifatta: l'inquadratura non è più quella (va scattata dalla regia)
  // la foto di inizio per la copertura dei muri: quando premi «Acquisisci ora» ne tiene una copia pulita accanto a
  // quella della luce (riferimenti/<lente>-inizio.jpg). Il rinnovo automatico di ogni mezz'ora non la tocca: è la
  // base con cui si confronta il colore attorno ai pezzi. 0 = non l'hai mai fatta (si usa la foto della stanza).
  inizio: { '05': 0, '10': 0, ...salvato.inizio },
  // la webcam «Camo» lasciata libera dalla regia: nessuno di qui la legge (l'occhio, il sensore della lente, la foto della
  // stanza), così in Camo si può cambiare profilo. Non si salva: a ogni avvio la si legge di nuovo
  camLibera: false,
  // i muri della stanza, per lente (pubblico/muri.js e muri.html): le pareti segnate coi quattro angoli e i pezzi appesi
  muri: Object.fromEntries(['05', '10'].map((L) => [L, muriPuliti(salvato.muri?.[L])])),
  // la bandiera appesa (pubblico/bandiera.js): quale del catalogo, scelta dalla regia
  bandiera: BANDIERE.some((b) => b.id === salvato.bandiera) ? salvato.bandiera : BANDIERA_PRIMA,
  // le regolazioni di ogni sorgente, dalla regia (pubblico/regola.js): pezzo → { r, fx, fy, lum, con…, si, filtro, effetto }
  regola: Object.fromEntries(Object.entries(salvato.regola ?? {}).filter(([p]) => PEZZI.includes(p)).map(([p, v]) => [p, regolaPulita(v)]).filter(([, v]) => v)),
}
// (i pezzi che non ci sono più, come la brocca, spariscono anche dai posti e dai muri salvati)
for (const L of ['05', '10']) {
  for (const p of Object.keys(stato.muri[L]?.pezzi ?? {})) if (!PEZZI.includes(p)) delete stato.muri[L].pezzi[p]
  for (const p of Object.keys(stato.posti[L] ?? {})) if (!PEZZI.includes(p)) delete stato.posti[L][p]
}
// Quando premi un «torno subito» si spengono tutti gli altri link (resta la scena con la scritta al centro): quelli che
// erano accesi stanno in viaPrima e si riaccendono quando torni. Non si riparte mai «via»: se il server si è fermato
// mentre eri via, si riaccendono subito.
for (const p of VIA) stato.attivi[p] = false
for (const p of salvato.viaPrima ?? []) if (p in stato.attivi && !VIA.includes(p)) stato.attivi[p] = true
stato.attivi.esterna = false // (il portatile si ricollega dopo: a ogni avvio la vista aspetta il suo pc)
// una cosa grande alla volta anche dopo un riavvio: se lo stato salvato ne aveva due, resta il primo
function unaGrande() {
  const grande = GRANDI.find((p) => stato.attivi[p])
  if (grande) for (const p of GRANDI) if (p !== grande) stato.attivi[p] = false
}
unaGrande()
stato.viaPrima = null
// (la scritta dei «torno subito» era piccola, in alto o dove l'avevi spostata; adesso sta grande al centro dello
// schermo: i posti di prima si buttano, una volta sola)
if (!salvato.viaCentro) for (const L of ['05', '10']) for (const p of VIA) delete stato.posti[L]?.[p]
const viaOra = () => VIA.some((p) => stato.attivi[p])
function viaSpegni() { // tutti i link spenti, e ci si ricorda quali erano accesi
  const accesi = PEZZI.filter((p) => !VIA.includes(p) && stato.attivi[p])
  stato.viaPrima = [...new Set([...(stato.viaPrima ?? []), ...accesi])]
  for (const p of accesi) stato.attivi[p] = false
}
function viaTorna() { // sei tornato: si riaccendono quelli di prima
  for (const p of stato.viaPrima ?? []) if (PEZZI.includes(p)) stato.attivi[p] = true
  stato.viaPrima = null
  unaGrande()
}

// Lo stato si scrive in un file a parte e poi prende il posto di quello vero: uscire a metà di una scrittura (il server
// che si chiude con le buone, azione «spegniti», salvava proprio in quel momento) lasciava stato.json vuoto, e al
// riavvio si perdevano posti, muri, follower e tutto il resto. All'uscita si salva subito (salvaSubito).
let salvaFra = null
const FILE_SALVA = path.join(QUI, FILE_STATO)
const daSalvare = () => JSON.stringify({ attivi: stato.attivi, lenteModo: stato.lenteModo, letto: stato.letto, tastiTutti: stato.tastiTutti, impara: stato.impara, posti: stato.posti, redbull: stato.redbull, segue: stato.segue, gpuLeggero: stato.gpuLeggero, tv: { ip: stato.tv?.ip ?? null, nome: stato.tv?.nome ?? null, modello: stato.tv?.modello ?? null }, testaRif: stato.testaRif, puff: stato.puff, socialSi: stato.socialSi, social: stato.social, muri: stato.muri, inizio: stato.inizio, viaPrima: stato.viaPrima, viaCentro: true, podcast: stato.podcast, bandiera: stato.bandiera, regola: stato.regola, esterna: vista?.salvaDati() ?? {} }, null, 2)
function salva() {
  clearTimeout(salvaFra)
  salvaFra = setTimeout(() => {
    salvaFra = null
    const t = `${FILE_SALVA}.nuovo`
    fs.writeFile(t, daSalvare(), (e) => { if (!e) fs.rename(t, FILE_SALVA, (e2) => e2 && log('stato: non salvato,', e2.message)) })
  }, 300)
}
function salvaSubito() {
  clearTimeout(salvaFra); salvaFra = null
  const t = `${FILE_SALVA}.uscita`
  try { fs.writeFileSync(t, daSalvare()); fs.renameSync(t, FILE_SALVA) } catch (e) { log('stato: non salvato all’uscita,', e.message) }
}

// ── il flusso verso le pagine (Server-Sent Events) ──
const clienti = new Set()
const manda = (evento, dati, filtro) => {
  const riga = `event: ${evento}\ndata: ${JSON.stringify(dati)}\n\n`
  for (const c of clienti) if (!filtro || filtro(c)) c.res.write(riga)
}
let statoFra = null
const diStato = () => { if (!statoFra) statoFra = setTimeout(() => { statoFra = null; manda('stato', stato); podcast.aggiorna() }, 40) }
// Giugnoh's Cast (podcast.mjs): stato.podcast, stato.tv, e il server della tv sulla porta 2360 di tutte le reti (solo la
// pagina della tv, in sola lettura). --senza-tv non lo apre
const podcast = creaPodcast({ stato, salvato, conf: CONF.podcast ?? {}, log, diStato, salva, file, pubblico: path.join(QUI, 'pubblico'), sito: SITO, senzaTv: process.argv.includes('--senza-tv') })
const tv = creaTv({
  qui: QUI, conf: CONF.tv ?? {}, log, stato, salva, diStato,
  urlCanale: () => {
    const l = stato.tv.indirizzi ?? []
    const x = l.find((v) => !/tailscale/i.test(v.rete) && v.url.startsWith('http://10.')) ?? l.find((v) => !/tailscale/i.test(v.rete)) ?? l[0]
    return x?.url ?? `http://127.0.0.1:${CONF.podcast?.tvPorta ?? 2360}/`
  },
})
// la vista esterna: la pagina https per il portatile e il flusso MJPEG per Camo (--senza-vista non apre la porta)
vista = creaEsterna({ stato, salvato, conf: CONF.esterna ?? {}, log, diStato, salva, pubblico: path.join(QUI, 'pubblico'), sito: SITO, senzaRete: process.argv.includes('--senza-vista') })

// ── la lente: 0,5× oppure 1,0× ──
// Due sensori. Il file: Camo Studio scrive la fotocamera scelta in Presets\DEFAULT.config (CameraID …built-in_video:5 è
// il grandangolo, cioè lo 0,5×), ma lo salva quando gli pare. L'immagine: ffmpeg legge la webcam virtuale «Camo» una
// volta al secondo a 64 × 36 e la confronta con le due foto di riferimento (riferimenti/05.jpg e 10.jpg): vince quella
// che le somiglia di più, tre volte di fila. Se l'immagine è sicura comanda lei, altrimenti il file.
const CAMO = path.join(process.env.APPDATA ?? '', 'Reincubate/Camo')
const lenteDi = (id) => {
  if (!id) return null
  if (stato.impara[id]) return stato.impara[id]
  const zoom = +(/zoom=([\d.]+)/.exec(id)?.[1] ?? 1)
  return /built-in_video:5(\D|$)/.test(id) || zoom < 1 ? '05' : '10'
}
let presetPrima = {}, presetAttivo = null
function leggiPreset() {
  let d
  try { d = JSON.parse(fs.readFileSync(path.join(CAMO, 'Presets/DEFAULT.config'), 'utf8')).devicesSettings ?? {} } catch { return }
  const telefoni = Object.entries(d).filter(([, v]) => /avfoundation/.test(v?.CameraID ?? ''))
  // il telefono in uso è quello la cui voce è cambiata per ultima; all'avvio, quello che Camo ha scritto per ultimo nel file
  for (const [k, v] of telefoni) { const s = JSON.stringify(v); if (presetPrima[k] !== undefined && presetPrima[k] !== s) presetAttivo = k; presetPrima[k] = s }
  if (!presetAttivo || !d[presetAttivo]) presetAttivo = telefoni.toSorted((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)[0]?.[0] ?? null // (la voce più completa è quella dell'iPhone di adesso)
  const id = presetAttivo ? d[presetAttivo].CameraID : null
  if (id !== stato.sensori.lente.id) { stato.sensori.lente.id = id; stato.sensori.lente.file = lenteDi(id); log('lente (file di Camo):', id, '→', stato.sensori.lente.file); decidiLente() }
  // la risoluzione e i fotogrammi che Camo chiede: per Discord il massimo leggibile è 1920 × 1080 (vedi README)
  const sc = presetAttivo ? d[presetAttivo].DesiredResolution : null, fps = presetAttivo ? d[presetAttivo].DesiredFPS : null
  if (sc?.Width && sc?.Height) {
    const k = `${sc.Width}×${sc.Height} ${fps ?? '?'} fps`
    if (stato.sensori.camo !== k) { stato.sensori.camo = k; log('camo:', k) }
  }
}
let lenteDa = Date.now() // da quando è questa lente (la foto della stanza si fa solo con la lente ferma da un minuto)
function decidiLente() {
  const s = stato.sensori.lente
  const nuova = stato.lenteModo !== 'auto' ? stato.lenteModo : s.immagine ?? s.file ?? stato.lente
  if (nuova !== stato.lente) { stato.lente = nuova; lenteDa = Date.now(); log('lente in uso:', nuova) }
  diStato()
}

const N = 64 * 36
let rif = null, ffmpeg = null, nero = false
function riferimenti() {
  const uno = (f) => {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', path.join(RIF, f), '-vf', 'scale=64:36', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 20 })
    return r.status === 0 && r.stdout?.length === N ? r.stdout : null
  }
  const a = uno('05.jpg'), b = uno('10.jpg')
  rif = a && b ? { '05': a, '10': b } : null
  if (!rif) log(`sensore a immagine spento: servono ffmpeg e le foto ${path.basename(RIF)}/05.jpg e 10.jpg`)
}
const somiglia = (x, y) => {
  let mx = 0, my = 0
  for (let i = 0; i < N; i++) { mx += x[i]; my += y[i] }
  mx /= N; my /= N
  let s = 0, sx = 0, sy = 0
  for (let i = 0; i < N; i++) { const dx = x[i] - mx, dy = y[i] - my; s += dx * dy; sx += dx * dx; sy += dy * dy }
  return s / Math.sqrt(sx * sy || 1)
}
// la webcam «Camo» la legge un solo ffmpeg alla volta, e si chiude con le buone (cam.mjs: il driver di Camo mandava il
// PC in schermata blu quando la aprivano in due o la chiudevano di colpo)
let spegnendo = false // (il server si sta chiudendo: nessuno riapre la webcam)
const cam = creaCam({ libera: () => stato.camLibera || spegnendo, log })
// chiude tutto con le buone: prima la webcam (la lente e l'occhio), poi esce. I sensori, i volti e il resto si chiudono
// da soli all'uscita (non toccano la webcam)
async function spegniBene() {
  if (spegnendo) return
  spegnendo = true
  log('si chiude: prima la webcam, con le buone')
  clearTimeout(lenteFra)
  vista?.chiudi()
  await Promise.all([chiudiBene(ffmpeg), occhio?.chiudi?.()])
  log('webcam chiusa: esco')
  salvaSubito() // (per intero, prima di uscire)
  setTimeout(() => process.exit(0), 200)
}
let lenteVoti = [], lenteIncerte = 0, lenteFra = null, lentePartita = 0, lenteDaOcchio = 0
// un fotogramma 64 × 36 in grigi: buio (iPhone scollegato)? e a quale delle due foto somiglia
function lenteVoto(f) {
  let media = 0
  for (let i = 0; i < N; i++) media += f[i]
  const buio = media / N < 6
  if (buio !== nero) { nero = buio; spie() }
  if (buio) { lenteVoti = []; return }
  // (quando sei via la webcam mostra la scena del «torno subito», non la stanza: niente voti, la lente resta quella)
  if (viaOra()) { lenteVoti = []; return }
  const a = somiglia(f, rif['05']), b = somiglia(f, rif['10'])
  lenteVoti.push(Math.abs(a - b) < 0.08 || Math.max(a, b) < 0.12 ? null : a > b ? '05' : '10')
  // se per un po' non somiglia a nessuna delle due foto (stanza diversa, telefono spostato) l'immagine si fa da parte e torna a comandare il file
  lenteIncerte = lenteVoti.at(-1) ? 0 : lenteIncerte + 1
  if (lenteIncerte >= 6 && stato.sensori.lente.immagine) { stato.sensori.lente.immagine = null; log('lente (immagine): non sicura, comanda il file di Camo'); decidiLente() }
  if (lenteVoti.length > 3) lenteVoti.shift()
  const v = lenteVoti.length === 3 && lenteVoti[0] && lenteVoti.every((x) => x === lenteVoti[0]) ? lenteVoti[0] : null
  stato.sensori.lente.somiglia = { '05': +a.toFixed(2), '10': +b.toFixed(2) }
  if (v && v !== stato.sensori.lente.immagine) { stato.sensori.lente.immagine = v; log('lente (immagine):', v, `0,5× ${a.toFixed(2)} · 1,0× ${b.toFixed(2)}`); decidiLente() }
}
// mentre la webcam ce l'ha l'occhio, la lente guarda le sue foto (640 × 360 rgb): una al secondo, rimpicciolita a 64 × 36
function lenteDaFoto(rgb, w, h) {
  if (!rif || Date.now() - lenteDaOcchio < 1000) return
  lenteDaOcchio = Date.now()
  const f = Buffer.allocUnsafe(N), bx = w / 64, by = h / 36
  for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) {
    let s = 0, n = 0
    for (let yy = Math.floor(y * by); yy < Math.floor((y + 1) * by); yy += 2) for (let xx = Math.floor(x * bx); xx < Math.floor((x + 1) * bx); xx += 2) { const i = (yy * w + xx) * 3; s += 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2]; n++ }
    f[y * 64 + x] = Math.round(s / Math.max(1, n))
  }
  lenteVoto(f)
}
function lenteRiprova(ms) { clearTimeout(lenteFra); lenteFra = setTimeout(guardaCamo, ms) }
function lenteChiudi() { return chiudiBene(ffmpeg) }
function guardaCamo() {
  if (!rif || ffmpeg) return
  if (!cam.chiedi('lente')) return lenteRiprova(4000) // (ce l'ha l'occhio o la foto, o è appena stata lasciata: riprova)
  lentePartita = Date.now()
  ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'dshow', '-rtbufsize', '64M', '-i', `video=${CONF.camo ?? 'Camo'}`, '-vf', 'fps=1,scale=64:36', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
  ffmpeg.stdin.on('error', () => {})
  let resto = Buffer.alloc(0)
  lenteVoti = []; lenteIncerte = 0
  ffmpeg.stdout.on('data', (pezzo) => {
    resto = Buffer.concat([resto, pezzo])
    while (resto.length >= N) { const f = resto.subarray(0, N); resto = resto.subarray(N); lenteVoto(f) }
  })
  // (la vuole l'occhio o la foto, o va lasciata libera per Camo: si sposta con le buone, una volta sola)
  const p = ffmpeg, controlla = setInterval(() => { if (ffmpeg === p && !p.chiudendo && cam.cede('lente')) { p.chiudendo = true; lenteChiudi() } }, 1000)
  ffmpeg.on('error', () => {})
  ffmpeg.on('close', () => {
    clearInterval(controlla)
    ffmpeg = null; cam.lascia('lente')
    // (se la prende l'occhio la lente continua con le sue foto; se no, niente immagine finché non riapre)
    if (cam.chi() !== 'occhio') { stato.sensori.lente.immagine = null; if (nero) { nero = false; spie() } decidiLente() }
    lenteRiprova(Date.now() - lentePartita < 5000 ? 15000 : 4000) // (non si apre: Camo spento o webcam occupata)
  })
}

// ── i sensori del pc (sensori.ps1): tasti, controller, audio, iPhone ──
// I tasti passano alle pagine solo se il pezzo «tasti» è acceso. Con «tutti i tasti» spento passano solo quelli da gioco:
// quello che si scrive (password comprese) non arriva a nessuna pagina.
const GIOCO = new Set([1, 2, 4, 5, 6, 9, 32, 37, 38, 39, 40, 160, 162, 81, 87, 69, 82, 65, 83, 68, 70])
let audio = null, pc = null, tasti = [], pad = null, fonte = 'tastiera'
const chi = (lista, voglia) => {
  const re = voglia ? new RegExp(voglia, 'i') : null
  return (re && lista.find((x) => re.test(x.n))) || lista.find((x) => x.c) || lista.find((x) => x.d) || null
}
function spie() {
  const mic = audio ? chi(audio.cap, CONF.mic) : null
  const cuf = audio ? (CONF.cuffie ? audio.ren.find((x) => new RegExp(CONF.cuffie, 'i').test(x.n)) : chi(audio.ren)) : null
  const nuove = {
    mic: { ok: !!mic && !mic.m, nome: mic?.n ?? '' },
    cuffie: { ok: !!cuf && !cuf.m && cuf.v > 0, nome: cuf?.n ?? '' },
    iphone: { ok: !!pc?.iphone && !!pc?.camo && !nero },
  }
  if (JSON.stringify(nuove) !== JSON.stringify(stato.spie)) { stato.spie = nuove; diStato() }
}
const mandaTasti = () => manda('tasti', { k: stato.tastiTutti ? tasti : tasti.filter((k) => GIOCO.has(k)), fonte }, () => stato.attivi.tasti)
function riga(r) {
  const tipo = r[0], corpo = r.slice(2)
  if (tipo === 'K') {
    const nuovi = corpo ? corpo.split(',').map(Number) : []
    if (nuovi.some((k) => k > 6 && !tasti.includes(k)) && fonte !== 'tastiera') fonte = 'tastiera'
    tasti = nuovi
    mandaTasti()
  } else if (tipo === 'A') {
    try { audio = JSON.parse(corpo) } catch { return }
    spie()
  } else if (tipo === 'V') {
    // il livello del microfono scelto per la spia, 25 volte al secondo; muto = zero
    // (anche alla tv del podcast, che ci fa ballare le barre, con le spie spente)
    let v; try { v = JSON.parse(corpo) } catch { return }
    const mic = stato.spie.mic, livello = mic.ok ? v[mic.nome] ?? 0 : 0
    podcast.picco(livello)
    if (!stato.attivi.spie) return
    manda('picco', { mic: livello }, () => true)
  } else if (tipo === 'W') {
    if (stato.attivi.tasti) manda('rotella', { n: +corpo })
  } else if (tipo === 'D') {
    try { pc = JSON.parse(corpo) } catch { return }
    spie()
  } else if (tipo === 'P') {
    if (corpo === '-') { if (pad) { pad = null; stato.sensori.pad = null; fonte = 'tastiera'; diStato(); mandaTasti() } return }
    const [id, b, s, a] = corpo.split('|')
    const nuovo = { id, b, s: +s, a: a.split(',').map(Number) }
    if (!pad || pad.id !== id) { stato.sensori.pad = id; diStato() }
    // il controller prende la scena quando si preme un tasto o si muove una levetta, non per il tremolio a riposo
    if (pad && (nuovo.b !== pad.b || nuovo.s !== pad.s || nuovo.a.some((v, i) => Math.abs(v - pad.a[i]) > 0.1)) && fonte !== 'pad') { fonte = 'pad'; mandaTasti() }
    pad = nuovo
    manda('pad', pad, () => stato.attivi.tasti)
  }
}
let exeSensori
function aiutanteSensori() {
  if (exeSensori !== undefined) return exeSensori
  const exe = path.join(QUI, 'cache', 'sensori.exe'), cs = path.join(QUI, 'sensori.cs'), csc = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
  try {
    const vecchio = fs.existsSync(exe) ? fs.statSync(exe).mtimeMs : 0
    if (!vecchio || fs.statSync(cs).mtimeMs > vecchio) {
      fs.mkdirSync(path.dirname(exe), { recursive: true })
      const fw = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319'
      const r = spawnSync(csc, ['/nologo', '/target:exe', '/platform:x64', '/optimize+', `/out:${exe}`,
        `/reference:${fw}\\System.Management.dll`, `/reference:${fw}\\System.Runtime.dll`,
        `/reference:${fw}\\System.Runtime.WindowsRuntime.dll`, `/reference:${fw}\\System.Runtime.InteropServices.WindowsRuntime.dll`,
        '/reference:C:\\Windows\\System32\\WinMetadata\\Windows.Foundation.winmd',
        '/reference:C:\\Windows\\System32\\WinMetadata\\Windows.Gaming.winmd',
        '/reference:C:\\Windows\\System32\\WinMetadata\\Windows.System.winmd', cs], { stdio: 'ignore', windowsHide: true })
      if (r.status === 0 && fs.existsSync(exe)) log('sensori: aiutante compilato (niente più PowerShell)')
    }
    exeSensori = fs.existsSync(exe) ? exe : null
  } catch (e) {
    log('sensori: aiutante non compilato (', e.message, '): uso sensori.ps1')
    exeSensori = null
  }
  return exeSensori
}
function sensori() {
  const exe = aiutanteSensori()
  const p = exe
    ? spawn(exe, [], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
    : spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(QUI, 'sensori.ps1')], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
  let resto = ''
  p.stdout.setEncoding('utf8')
  p.stdout.on('data', (t) => {
    if (!stato.sensori.pc) { stato.sensori.pc = true; diStato() }
    resto += t
    const righe = resto.split(/\r?\n/); resto = righe.pop()
    for (const r of righe) if (r.length > 1) riga(r)
  })
  p.on('error', () => {})
  p.on('close', () => { stato.sensori.pc = false; tasti = []; diStato(); setTimeout(sensori, 4000) })
  process.on('exit', () => { try { p.kill() } catch {} })
}

// ── il meteo: Open-Meteo (gratis, senza chiave), ogni dieci minuti. Il nome mostrato è quello di config, non il punto ──
const TEMPO = [[0, 'sereno', 'sole'], [1, 'quasi sereno', 'sole'], [2, 'poco nuvoloso', 'nuvolo'], [3, 'coperto', 'nuvole'], [48, 'nebbia', 'nebbia'], [57, 'pioviggine', 'pioggia'], [67, 'pioggia', 'pioggia'], [77, 'neve', 'neve'], [82, 'rovesci', 'pioggia'], [86, 'neve', 'neve'], [99, 'temporale', 'temporale']]
async function meteo() {
  const m = CONF.meteo ?? {}
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.lat}&longitude=${m.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Europe%2FRome`, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`)
    const d = await r.json(), c = d.current ?? {}
    const [, testo, icona] = TEMPO.find(([fino]) => c.weather_code <= fino) ?? TEMPO.at(-1)
    stato.meteo = { nome: m.nome ?? 'Mantova', gradi: Math.round(c.temperature_2m), percepiti: Math.round(c.apparent_temperature), umido: Math.round(c.relative_humidity_2m), vento: Math.round(c.wind_speed_10m), testo: !c.is_day && icona === 'sole' ? 'sereno' : testo, icona: !c.is_day && icona === 'sole' ? 'luna' : icona, min: Math.round(d.daily?.temperature_2m_min?.[0]), max: Math.round(d.daily?.temperature_2m_max?.[0]), alle: Date.now() }
    diStato()
  } catch (e) { log('meteo:', e.message) }
}

// ── i follower: Twitch li dà a chiunque (la stessa domanda che fa il suo sito), ogni dieci minuti. Gli altri senza
// accesso non li danno: quei numeri si scrivono dalla regia. Un numero di Twitch scritto a mano resta finché il suo
// numero vero non cambia ──
async function social() {
  for (const { rete, nome, icona } of stato.reti) {
    if (icona !== 'twitch') continue
    try {
      const r = await fetch('https://gql.twitch.tv/gql', { method: 'POST', headers: { 'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `{ user(login: ${JSON.stringify(nome)}) { followers { totalCount } } }` }), signal: AbortSignal.timeout(8000) })
      const n = (await r.json())?.data?.user?.followers?.totalCount
      const v = stato.social[rete]
      if (Number.isFinite(n) && n !== v?.vero) { stato.social[rete] = { n, alle: Date.now(), auto: true, vero: n }; salva(); diStato() }
    } catch (e) { log('twitch:', e.message) }
  }
}

// ── l'occhio sulla webcam (occhio.mjs): la testa per Giugnoh, la puff per il suo cartellino ──
let occhio = null, ultimoOcchio = null, anteprimaFino = 0
// se l'occhio è acceso e se sta al passo, per la regia: va a parte (evento «conti»), non nello stato, se no ogni due
// secondi tutte le pagine si rifacevano tutto per un numero di millisecondi cambiato
let contiOcchio = { acceso: false }
// Dove stanno disegnati i pezzi, detto dalle pagine di Camo ogni due secondi: l'occhio lì non cerca la puff e la foto
// della stanza lì tiene quella di prima. Valgono le ultime tre volte di ogni pagina (sei secondi): quello che si muove
// (Giugnoh, le nuvole del meteo, le bestioline) copre anche dov'era appena prima.
const riquadri = new Map() // pagina → { storia: [[[x, y, w, h, pezzo]…] ×3], alle }
const riquadriOra = (conCartellino) => [...riquadri.values()].filter((v) => Date.now() - v.alle < 6000).flatMap((v) => v.storia.flat()).filter((q) => conCartellino || q[4] !== 'puff')
// (per la copertura serve solo l'ultimo giro di ogni pagina: un pezzo che si è spostato negli ultimi sei secondi non deve
// lasciare una scia di riquadri attorno a sé)
const riquadriAdesso = () => [...riquadri.values()].filter((v) => Date.now() - v.alle < 6000).flatMap((v) => v.storia[v.storia.length - 1] ?? [])
const testaOra = () => { const t = ultimoOcchio?.testa; return t && t.da !== 'persa' && Date.now() - ultimoOcchio.t < 3000 ? [t.x + t.w / 2, t.y] : null }
// La copertura dei pezzi appesi ai muri: non si calcola più la sagoma del corpo. Per ogni pezzo acceso con «dietro di
// me» l'occhio guarda il colore dell'anello attorno al suo riquadro e lo confronta con la foto di inizio (riferimenti/
// <lente>.jpg). Se cambia oltre la tolleranza, il pezzo si nasconde come se ci passassi davanti. `serveCopertura()` dice
// se c'è almeno un pezzo da guardare; `serveCopertura(pezzo)` se quel pezzo è uno di loro.
const serveCopertura = (solo = null) => {
  if (stato.camLibera || viaOra()) return false
  const M = stato.muri[stato.lente]
  if (!M) return false
  const lista = solo ? [[solo, M.pezzi[solo]]] : Object.entries(M.pezzi)
  for (const [p, q] of lista) {
    if (!q || !stato.attivi[p] || q.corpo === false) continue
    const m = M.pareti.find((x) => x.id === q.muro)
    if (m && m.corpo !== false) return true
  }
  return false
}
// La foto di inizio in piccolo (640 × 360), una per lente: si ricarica quando la cambi con «Acquisisci ora». Se non
// l'hai mai fatta usa la foto della stanza (e allora segue i suoi rinnovi). L'occhio la vuole già in RGB, non un JPEG
// da decodificare a ogni fotogramma.
const rifOcchio = { '05': { chiave: '', buf: null, caricando: false, provato: 0 }, '10': { chiave: '', buf: null, caricando: false, provato: 0 } }
function riferimentoCopertura() {
  const L = stato.lente, c = rifOcchio[L]
  if (!c) return null
  const inizio = stato.inizio?.[L] ?? 0
  const t = inizio || (stato.foto?.[L] ?? 0)
  const file = inizio ? path.join(RIF, `${L}-inizio.jpg`) : path.join(RIF, `${L}.jpg`)
  const chiave = `${L}:${inizio ? 'i' : 'f'}${t}`
  // (se la foto è illeggibile — a metà scrittura, file mancante — si riprova ogni cinque secondi, non a ogni fotogramma)
  if (t && c.chiave !== chiave && !c.caricando && Date.now() - c.provato > 5000) {
    c.caricando = true; c.provato = Date.now()
    leggiPiccola(file, 640, 360)
      .then((b) => { if (b) { c.buf = b; c.chiave = chiave } })
      .catch(() => {})
      .finally(() => { c.caricando = false })
  }
  return { chiave: t && c.chiave === chiave ? chiave : null, rgb: c.buf, w: 640, h: 360 }
}
// (quando sei via l'occhio si spegne: non c'è niente da seguire, e la scena del «torno subito» ha dei volti disegnati.
// Resta acceso solo per l'anteprima dal vivo della regia, ma senza cercare)
const vuoleOcchio = () => !stato.camLibera && (Date.now() < anteprimaFino || (!viaOra() && ((stato.attivi.nome && stato.segue) || (stato.attivi.puff && !!stato.puff.colore) || serveCopertura())))
// ── la foto della stanza senza i pezzi (foto.mjs), per la lente in uso: quando la scatti dalla regia (o dai muri), e da
// sola ogni mezz'ora. Risponde null se l'ha fatta, se no perché no. Non la fa quando sei via (c'è lo schermo del «torno
// subito») o con Camo senza telefono.
// - Scattata da te («mano»): l'inquadratura cambia ogni giorno, quindi la foto nuova prende il posto della vecchia,
//   tutta, e quella vecchia sparisce per sempre (anche la scorta «05-prima.jpg» di una volta). Perché nella foto non ci
//   siano i pezzi, per un attimo tutte le pagine li nascondono (evento «nascondi»): anche in diretta spariscono per un
//   secondo o due.
// - Da sola: solo se l'inquadratura è ancora quella della foto (somiglia almeno 0,7, e più che all'altra lente). Lì
//   dove ci sono i pezzi tiene la foto di prima, sfumata, e in diretta non si accorge nessuno. Se l'inquadratura è
//   cambiata non la fa, e la regia dice di scattarla.
const MEZZORA = 30 * 60000
// (il primo tentativo cinque minuti dopo l'accensione, non subito: all'avvio la webcam serve all'occhio)
let scattando = false, fotoProvata = Date.now(), fotoAttesa = 5 * 60000, fotoDetto = ''
async function fotoStanza(mano = false) {
  if (scattando) return 'la sta già facendo'
  if (stato.camLibera) return 'la webcam è lasciata libera per Camo: riprendila dalla regia'
  const L = stato.lente, altra = L === '05' ? '10' : '05', nome = L === '05' ? '0,5×' : '1,0×'
  if (VIA.some((p) => stato.attivi[p])) return 'sei via: la fa quando torni'
  if (Date.now() - lenteDa < (mano ? 3000 : 60000)) return mano ? 'la lente è appena cambiata: riprova fra un attimo' : 'la lente è appena cambiata: aspetto un minuto'
  scattando = true
  try {
    // la webcam: la foto aspetta il suo turno (la lente e l'occhio la lasciano con le buone, poi tre secondi), al massimo 20
    const fino = Date.now() + 20000
    while (!cam.chiedi('foto')) {
      if (Date.now() > fino || stato.camLibera || spegnendo) return 'la webcam è occupata: riprovo più tardi'
      await new Promise((ok) => setTimeout(ok, 400))
    }
    let nuova = null
    const prima = riquadriOra(true)
    try {
      if (mano) { manda('nascondi', { ms: 12000 }); await new Promise((ok) => setTimeout(ok, 400)) } // (le pagine si fanno vuote; in 12 s tornano da sole, se il server tacesse)
      nuova = await scatta(CONF.camo ?? 'Camo', process.env.DIRETTA_OCCHIO_PROVA || null)
    } finally { cam.lascia('foto') }
    if (mano) manda('nascondi', { ms: 0 })
    if (!nuova) return 'la webcam «Camo» non risponde'
    if (finta(nuova)) return 'Camo non ha l’immagine del telefono'
    if (stato.lente !== L) return 'la lente è cambiata mentre scattava'
    const file = path.join(RIF, `${L}.jpg`)
    let pulita = nuova, r = []
    if (!mano) {
      const p = piccola(nuova), a = rif ? somiglia(p, rif[L]) : 0, b = rif ? somiglia(p, rif[altra]) : 1
      const vecchia = a >= 0.7 && a >= b + 0.05 ? await leggi(file) : null
      if (!vecchia) {
        if (!stato.fotoCambiata[L]) { stato.fotoCambiata[L] = true; diStato(); log(`foto della stanza: la ${nome} non somiglia più alla sua foto (${a.toFixed(2)}): l’inquadratura è cambiata, va scattata dalla regia`) }
        return 'l’inquadratura è cambiata: scattala dalla regia'
      }
      r = [...prima, ...riquadriOra(true)]
      pulita = componi(nuova, vecchia, r)
    }
    if (!(await scrivi(file, pulita))) return 'non riesco a scrivere la foto'
    try { fs.unlinkSync(path.join(RIF, `${L}-prima.jpg`)) } catch {} // (la scorta di una volta: non serve più)
    // «Acquisisci ora» è anche la foto di inizio: una copia pulita resta lì per la copertura. Il rinnovo automatico
    // della foto della stanza (per la luce e i muri) non la cambia: la base del confronto è quella che hai scelto tu.
    if (mano) {
      try { fs.copyFileSync(file, path.join(RIF, `${L}-inizio.jpg`)); stato.inizio[L] = Date.now() }
      catch (e) { stato.inizio[L] = 0; log(`foto di inizio: non copiata (${e.message})`) }
    }
    if (rif) rif[L] = piccola(pulita); else riferimenti()
    stato.foto[L] = Date.now(); stato.fotoCambiata[L] = false; diStato()
    if (mano) salva() // (la foto di inizio sta nello stato: senza, al riavvio non saprebbe quale usare)
    log(mano ? `foto della stanza: ${nome} scattata, quella di prima è cancellata${stato.inizio[L] ? ' (è anche la foto di inizio)' : ''}` : `foto della stanza: ${nome} rifatta (${r.length} riquadri tenuti dalla foto di prima)`)
    return null
  } finally { if (mano) manda('nascondi', { ms: 0 }); scattando = false }
}
// ogni minuto: se la foto della lente in uso ha più di mezz'ora la rifà (se non ci riesce, riprova fra mezz'ora: con
// Camo senza telefono è inutile aprire e chiudere la webcam ogni cinque minuti, e ogni apertura è un rischio per il driver)
function fotoGiro() {
  if (scattando || Date.now() - (stato.foto[stato.lente] ?? 0) < MEZZORA || Date.now() - fotoProvata < fotoAttesa) return
  // (senza il telefono Camo manda la schermata grigia: non serve aprire la webcam per scoprirlo)
  if (!pc?.iphone || !pc?.camo) {
    if (fotoDetto !== 'Camo non ha l’immagine del telefono') log('foto della stanza: non la faccio, Camo non ha l’immagine del telefono')
    fotoDetto = 'Camo non ha l’immagine del telefono'
    return
  }
  fotoProvata = Date.now()
  fotoStanza().then((no) => {
    if (no && no !== fotoDetto) log('foto della stanza: non la faccio,', no)
    fotoDetto = no ?? ''
    // (se il motivo è passeggero si riprova fra cinque minuti; se no, fra mezz'ora: la webcam si apre meno)
    fotoAttesa = no && /lente è appena cambiata|webcam è occupata|la sta già facendo|sei via/.test(no) ? 5 * 60000 : MEZZORA
  })
}

// ── gli oggetti del sito, tutti: le pagine li pescano a caso ──
function oggetti() {
  const fuori = /^chat-(pager-crepe|app|app2|app3|avatar)$/
  try {
    return fs.readdirSync(path.join(SITO, 'art'), { withFileTypes: true }).filter((d) => d.isDirectory() && /^chat-/.test(d.name) && !fuori.test(d.name))
      .flatMap((d) => fs.readdirSync(path.join(SITO, 'art', d.name)).filter((f) => f.endsWith('.webp')).map((f) => `/art/${d.name}/${f}`))
  } catch { return [] }
}

// ── le azioni della regia ──
function azione(a) {
  // (questa non è un comando: arriva ogni due secondi, non si salva e non si rimanda a nessuno)
  if (a.tipo === 'riquadri') {
    if (typeof a.pagina !== 'string' || !Array.isArray(a.r) || a.r.length > 40) return false
    const r = a.r.filter((q) => Array.isArray(q) && q.slice(0, 4).every(Number.isFinite) && PEZZI.includes(q[4])).map((q) => [...q.slice(0, 4).map(Math.round), q[4]])
    const chi = a.pagina.slice(0, 40), prima = riquadri.get(chi)
    riquadri.set(chi, { storia: [...(prima && Date.now() - prima.alle < 6000 ? prima.storia.slice(-2) : []), r], alle: Date.now() })
    for (const [k, v] of riquadri) if (Date.now() - v.alle > 60000) riquadri.delete(k)
    return true
  }
  // le regolazioni di una sorgente (rotazione, specchio, immagine): mentre si muove un cursore ne arrivano tante, quindi
  // alle pagine va solo quella («regola»), non tutto lo stato
  if (a.tipo === 'regola' && PEZZI.includes(a.pezzo)) {
    const v = regolaPulita(a.v)
    if (v) stato.regola[a.pezzo] = v; else delete stato.regola[a.pezzo]
    salva(); manda('regola', { p: a.pezzo, v })
    return true
  }
  if (a.tipo === 'pezzo' && PEZZI.includes(a.nome)) {
    const su = a.su ?? !stato.attivi[a.nome]
    stato.attivi[a.nome] = !!su
    // le scene e il quadro dei componenti sono grandi e si sovrappongono: una cosa grande alla volta
    // (la regia lo dice e i tasti si aggiornano da soli)
    if (su && GRANDI.includes(a.nome)) for (const altro of GRANDI) if (altro !== a.nome) stato.attivi[altro] = false
    const turno = A_TURNO.find((g) => g.includes(a.nome))
    if (turno) {
      const prima = stato.via
      if (su) for (const altro of turno) if (altro !== a.nome) stato.attivi[altro] = false
      stato.via = turno.some((p) => stato.attivi[p]) ? { cosa: turno.find((p) => stato.attivi[p]), da: Date.now() } : null
      // la Red Bull: quando torni (dopo almeno 8 secondi via), il contatore di oggi fa +1 da solo
      if (prima?.cosa === 'lattina' && stato.via?.cosa !== 'lattina' && Date.now() - prima.da >= 8000) {
        if (stato.redbull.giorno !== giornata()) stato.redbull = { giorno: giornata(), n: 0, ultima: null }
        stato.redbull.n += 1; stato.redbull.ultima = Date.now()
      }
      // i «torno subito»: via si spengono tutti gli altri link, al ritorno si riaccendono
      if (turno === VIA) { if (su) viaSpegni(); else if (!viaOra()) viaTorna() }
    } else if (stato.viaPrima) stato.viaPrima = stato.viaPrima.filter((p) => p !== a.nome) // (toccato a mano mentre eri via: vale quello)
    if (a.nome === 'esterna' && !su) vista?.annullaAuto?.() // (se l'hai spenta tu, il primo fotogramma non la riaccende)
    if (a.nome === 'tasti') setTimeout(mandaTasti, 60)
    podcast.dopoPezzo(a.nome, su) // (l'argomento acceso ne estrae uno, la fine chiude la puntata)
  } else if (a.tipo === 'podcast') { if (!podcast.azione(a)) return false }
  else if (a.tipo === 'lente' && ['auto', '05', '10'].includes(a.modo)) { stato.lenteModo = a.modo; decidiLente() }
  else if (a.tipo === 'impara' && ['05', '10'].includes(a.lente) && stato.sensori.lente.id) { stato.impara[stato.sensori.lente.id] = a.lente; stato.sensori.lente.file = a.lente; decidiLente() }
  else if (a.tipo === 'letto' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(a.ora ?? '')) stato.letto = a.ora.padStart(5, '0')
  else if (a.tipo === 'tastiTutti') { stato.tastiTutti = !!a.su; mandaTasti() }
  else if (a.tipo === 'lettoSposta' && Number.isFinite(a.min)) {
    const [h, m] = stato.letto.split(':').map(Number), t = (((h * 60 + m + Math.round(a.min)) % 1440) + 1440) % 1440
    stato.letto = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  } else if (a.tipo === 'redbull' && [-1, 0, 1].includes(a.d)) {
    if (stato.redbull.giorno !== giornata()) stato.redbull = { giorno: giornata(), n: 0, ultima: null }
    stato.redbull.n = a.d === 0 ? 0 : Math.max(0, stato.redbull.n + a.d)
    if (a.d === 1) stato.redbull.ultima = Date.now()
    if (stato.redbull.n === 0) stato.redbull.ultima = null
  } else if (a.tipo === 'posto' && PEZZI.includes(a.pezzo) && ['05', '10'].includes(a.lente)) {
    if (a.via) delete stato.posti[a.lente][a.pezzo]
    else if ([a.x, a.y, a.s].every(Number.isFinite)) stato.posti[a.lente][a.pezzo] = [Math.round(a.x), Math.round(a.y), Math.min(3, Math.max(.2, +(+a.s).toFixed(3)))]
    else return false
    // Giugnoh che segue: si ricorda dov'era la testa quando l'hai messo lì, così resta lì rispetto a te
    if (a.pezzo === 'nome') stato.testaRif[a.lente] = !a.via && stato.segue ? testaOra() : null
  } else if (a.tipo === 'meteoProva' && (a.cosa === null || ['sole', 'luna', 'nuvolo', 'nuvole', 'nebbia', 'pioggia', 'neve', 'temporale', 'vento'].includes(a.cosa))) { stato.meteoProva = a.cosa; diStato(); return true }
  else if (a.tipo === 'tutti') { // (i pezzi del pc si accendono uno per uno)
    for (const p of PEZZI) if (!VIA.includes(p) && !DA_SOLI.includes(p)) stato.attivi[p] = !!a.su
    if (!a.su && stato.viaPrima) stato.viaPrima = stato.viaPrima.filter((p) => DA_SOLI.includes(p)) // (spenti tutti mentre eri via: al ritorno non tornano)
  }
  else if (a.tipo === 'segue') stato.segue = !!a.su
  else if (a.tipo === 'gpuLeggero') stato.gpuLeggero = !!a.su
  else if (a.tipo === 'tvCerca') tv.cerca()
  else if (a.tipo === 'tvApri') tv.apri(typeof a.canale === 'string' ? a.canale : 'tv')
  else if (a.tipo === 'bandiera' && BANDIERE.some((b) => b.id === a.id)) stato.bandiera = a.id
  else if (a.tipo === 'puff') {
    if (typeof a.gusto === 'string') stato.puff.gusto = a.gusto.trim().slice(0, 40)
    if (Number.isFinite(a.batteria)) stato.puff.batteria = Math.min(100, Math.max(0, Math.round(a.batteria)))
    if ([1, 2, 3, 4].includes(a.pod)) stato.puff.pod = a.pod
  } else if (a.tipo === 'puffQui' && [a.x, a.y].every(Number.isFinite)) {
    const col = occhio?.insegna(a.x, a.y)
    if (!col) return false
    stato.puff.colore = col; log('puff: colore insegnato', JSON.stringify(col))
  } else if (a.tipo === 'puffZona' && ['05', '10'].includes(a.lente)) {
    if (a.via) delete stato.puff.zona[a.lente]
    else if ([a.x, a.y, a.w, a.h].every(Number.isFinite) && a.w >= 20 && a.h >= 20) {
      stato.puff.zona[a.lente] = [a.x, a.y, a.w, a.h].map(Math.round)
      // la puff è lì dentro: il colore lo prende da solo (se l'occhio è acceso e la vede)
      const col = a.lente === stato.lente ? occhio?.insegnaZona() : null
      if (col) { stato.puff.colore = col; log('puff: colore preso dalla zona', JSON.stringify(col)) }
    } else return false
  } else if (a.tipo === 'social' && stato.reti.some((r) => r.rete === a.rete) && (a.n === null || (Number.isFinite(a.n) && a.n >= 0))) {
    // (il numero vero di Twitch resta: quello scritto a mano vale finché Twitch non ne dà uno nuovo; vuoto = torna il suo)
    const vero = stato.social[a.rete]?.vero
    stato.social[a.rete] = a.n === null ? (Number.isFinite(vero) ? { n: vero, alle: Date.now(), auto: true, vero } : null) : { n: Math.round(a.n), alle: Date.now(), auto: false, vero }
  } else if (a.tipo === 'socialSi' && stato.reti.some((r) => r.rete === a.rete) && typeof a.si === 'boolean') {
    stato.socialSi[a.rete] = a.si
  } else if (a.tipo === 'muri' && ['05', '10'].includes(a.lente) && a.dati && typeof a.dati === 'object') {
    // tutti i muri di una lente, come li ha lasciati la pagina dei muri (controllati da muri.js; solo pezzi veri)
    const m = muriPuliti(a.dati)
    for (const p of Object.keys(m.pezzi)) if (!PEZZI.includes(p)) delete m.pezzi[p]
    stato.muri[a.lente] = m
  } else if (a.tipo === 'esterna') {
    if (!vista?.azione(a)) return false
  } else if (a.tipo === 'cam' && typeof a.libera === 'boolean') {
    // «libera la cam»: il sensore della lente e l'occhio la chiudono con le buone (entro un secondo, cam.mjs); «riprendi»:
    // si riaprono, uno alla volta e non prima di tre secondi (l'occhio solo se serve)
    if (a.libera === stato.camLibera) return true
    stato.camLibera = a.libera
    if (a.libera) { if (ffmpeg && !ffmpeg.chiudendo) { ffmpeg.chiudendo = true; lenteChiudi() } log('cam: lasciata libera per Camo (occhio, lente e foto non la leggono)') }
    else { log('cam: ripresa'); lenteRiprova(300) }
  } else if (a.tipo === 'spegniti') {
    // riavvia.cmd: prima di chiudere il server si chiude la webcam con le buone (chiuderla di colpo mandava il PC in
    // schermata blu), poi si esce; il servizio lo rifà partire fra tre secondi
    setTimeout(spegniBene, 100)
  } else if (a.tipo === 'muroPezzo' && ['05', '10'].includes(a.lente) && PEZZI.includes(a.pezzo)) {
    // un pezzo solo, dalla regia: spostato, ingrandito o girato sul suo muro, portato su un altro, o staccato (q: null)
    const M = stato.muri[a.lente]
    if (a.q === null) delete M.pezzi[a.pezzo]
    else {
      const q = muriPuliti({ ...M, pezzi: { [a.pezzo]: a.q } }).pezzi[a.pezzo] // (controllato come quelli dei muri)
      if (!q) return false
      M.pezzi[a.pezzo] = q
    }
  }
  else return false
  salva(); diStato()
  return true
}

// ── il server ──
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.woff2': 'font/woff2', '.json': 'application/json' }
function file(res, base, rel, cache = 'no-cache') {
  const f = path.join(base, path.normalize(rel).replace(/^([/\\]|\.\.)+/, ''))
  if (!f.startsWith(base)) { res.writeHead(403).end(); return }
  fs.readFile(f, (e, dati) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('non c’è'); return }
    res.writeHead(200, { 'Content-Type': TIPI[path.extname(f).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': cache }).end(dati)
  })
}
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname)
  // solo da questo pc e solo dalle pagine di questo server: un sito aperto nel browser non può né leggere né comandare
  const ospite = req.headers.host ?? ''
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(ospite)) { res.writeHead(403).end(); return }
  if (req.headers.origin && !new RegExp(`^https?://(127\\.0\\.0\\.1|localhost):${PORTA}$`).test(req.headers.origin)) { res.writeHead(403).end(); return }

  if (p === '/api/flusso') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
    res.write(`retry: 1500\nevent: stato\ndata: ${JSON.stringify(stato)}\n\n`)
    const c = { res, pc: u.searchParams.has('pc') } // (?pc: la pagina mostra un pezzo del pc e vuole i suoi numeri)
    clienti.add(c)
    req.on('close', () => clienti.delete(c))
    if (stato.attivi.tasti) { res.write(`event: tasti\ndata: ${JSON.stringify({ k: [], fonte })}\n\n`); if (pad) res.write(`event: pad\ndata: ${JSON.stringify(pad)}\n\n`) }
    if (ultimoOcchio) res.write(`event: occhio\ndata: ${JSON.stringify(ultimoOcchio)}\n\n`)
    res.write(`event: conti\ndata: ${JSON.stringify(contiOcchio)}\n\n`)
    if (c.pc) macchina?.saluta((e, d) => res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`))
    return
  }
  // «scatta adesso» dalla regia o dai muri: la foto della stanza nuova, al posto di quella di prima
  if (p === '/api/foto' && req.method === 'POST') {
    fotoStanza(true).then((no) => res.writeHead(200, { 'Content-Type': TIPI['.json'] }).end(JSON.stringify({ ok: !no, dice: no })))
    return
  }
  // quello che ha visto l'ultima volta il modello delle bottiglie (la regia lo disegna sull'anteprima dal vivo)
  if (p === '/api/oggetti') { res.writeHead(200, { 'Content-Type': TIPI['.json'], 'Cache-Control': 'no-store' }).end(JSON.stringify({ oggetti: oggetti(), adv: CONF.adv ?? [] })); return }
  if (p === '/api/azione' && req.method === 'POST') {
    let corpo = ''
    req.on('data', (d) => { corpo += d; if (corpo.length > 32768) req.destroy() }) // (i muri di una lente stanno sotto i 10 kB)
    req.on('end', () => { let ok = false; try { ok = azione(JSON.parse(corpo)) } catch {} res.writeHead(ok ? 200 : 400, { 'Content-Type': TIPI['.json'] }).end(JSON.stringify({ ok })) })
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
  // l'ultima foto della webcam. Con ?dopo=n aspetta la prima più nuova della n e la manda appena c'è: l'anteprima dal
  // vivo la chiede, la mostra e richiede subito, così non perde tempo a domandare a vuoto e non resta indietro
  if (p === '/api/cam.jpg') {
    anteprimaFino = Date.now() + 4000 // chi guarda l'anteprima dal vivo tiene acceso l'occhio
    const dopo = u.searchParams.has('dopo') ? +u.searchParams.get('dopo') || 0 : -1
    const rispondi = (j) => {
      if (res.writableEnded || res.destroyed) return
      if (!j) { res.writeHead(503, { 'Cache-Control': 'no-store' }).end(); return }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Foto': String(j.n) }).end(j.buf)
    }
    if (!occhio) return rispondi(null)
    const j = occhio.jpg()
    if (j && j.n > dopo) return rispondi(j)
    occhio.aspetta(Math.max(0, dopo), 2500).then(rispondi) // (anche quando l'occhio si sta accendendo: la prima arriva in un attimo)
    return
  }
  if (vista?.serviLocale(req, res, p)) return // il flusso della vista esterna per Camo e l'anteprima per la regia
  if (podcast.servi(req, res, p)) return // la pagina della tv (/tv) e il suo flusso (/api/tv), anche qui sul pc
  if (p === '/') return file(res, path.join(QUI, 'pubblico'), 'regia.html')
  if (p === '/o/logo') { res.writeHead(302, { Location: '/o/nome' }).end(); return } // (il vecchio indirizzo del logo)
  if (p.startsWith('/o/')) return file(res, path.join(QUI, 'pubblico'), 'pezzo.html')
  if (macchina?.servi(p, res, file)) return // le icone delle app aperte (/app/…) e i loghi dei giochi di Steam (/steam/…)
  if (p.startsWith('/art/') || p.startsWith('/fonts/') || p === '/assets/icons.js') return file(res, SITO, p, 'max-age=86400')
  if (p.startsWith('/rif/')) return file(res, RIF, p.slice(5))
  if (p.startsWith('/foto/')) return file(res, path.join(QUI, 'foto'), p.slice(6), 'max-age=3600')
  if (p === '/cornice.gif' || p === '/giugnoh.gif') return file(res, QUI, p.slice(1))
  return file(res, path.join(QUI, 'pubblico'), p)
})
server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `la porta ${PORTA} è già presa: Diretta OS è già aperto?` : e.message); process.exit(1) })
server.listen(PORTA, '127.0.0.1', () => {
  log(`Diretta OS: la regia è su http://localhost:${PORTA}/`)
  vista.avvia()
  if (!process.argv.includes('--senza-sensori')) sensori()
  leggiPreset(); setInterval(leggiPreset, 2000)
  if (!process.argv.includes('--senza-camo')) { riferimenti(); guardaCamo() }
  meteo(); setInterval(meteo, 600000)
  social(); setInterval(social, 600000)
  // (--senza-camo vuol dire: la webcam vera non si tocca, nemmeno dall'occhio; in prova l'occhio legge DIRETTA_OCCHIO_PROVA)
  if (!process.argv.includes('--senza-occhio') && (!process.argv.includes('--senza-camo') || process.env.DIRETTA_OCCHIO_PROVA)) {
    occhio = creaOcchio({ qui: QUI, camo: CONF.camo ?? 'Camo', log, prova: process.env.DIRETTA_OCCHIO_PROVA || null, vuole: vuoleOcchio,
      // (se non c'è né Giugnoh che segue né la puff, l'anteprima dal vivo continua ad avere le sue foto: non si cerca
      // niente. E la testa si cerca solo quando Giugnoh la segue davvero. La copertura dei muri «dietro di me» si cerca
      // anche da sola: lì basta il colore, non la faccia.)
      cerca: () => !viaOra() && ((stato.attivi.nome && stato.segue) || stato.attivi.puff || serveCopertura()),
      serveTesta: () => !!(stato.attivi.nome && stato.segue),
      serveCopertura, riferimento: riferimentoCopertura, riquadriCopertura: riquadriAdesso,
      colore: () => stato.puff.colore, riquadri: riquadriOra, zona: () => stato.puff.zona?.[stato.lente] ?? null,
      cam, foto: lenteDaFoto, // (la webcam a turno con la lente e la foto; la lente intanto guarda le foto dell'occhio)
      manda: (o) => { ultimoOcchio = o; manda('occhio', o) } })
    // per la regia, ogni due secondi: acceso o no, e se sta al passo (solo a chi lo ascolta, e solo se è cambiato)
    setInterval(() => {
      const c = occhio.conti(), nuovo = { acceso: occhio.acceso(), volti: c.volti, cerca: c.cerca, fps: c.fps, ms: c.ms.tutto, testa: ultimoOcchio?.testa?.da ?? null, puff: !!ultimoOcchio?.puff }
      if (JSON.stringify(nuovo) !== JSON.stringify(contiOcchio)) { contiOcchio = nuovo; manda('conti', nuovo) }
    }, 2000)
  }
  if (!process.argv.includes('--senza-camo') || process.env.DIRETTA_OCCHIO_PROVA) setInterval(fotoGiro, 60000)
  // i pezzi del pc: i numeri vanno solo alle pagine che li mostrano, e si misura solo quello che è acceso e mostrato
  const pcGuarda = () => [...clienti].some((c) => c.pc)
  macchina = creaMacchina({ qui: QUI, log, conf: CONF.pc ?? {}, manda: (e, d) => manda(e, d, (c) => c.pc),
    // (il quadro unico mostra tutti i componenti: se è acceso servono anche i suoi numeri)
    vuole: () => { const g = pcGuarda(), a = stato.attivi; return { ps: g && ['quadro', 'app', 'cpu', 'ram', 'ssd', 'hdd', 'temp'].some((p) => a[p]), nv: g && (a.quadro || a.gpu || a.temp), wifi: g && (a.quadro || a.wifi) } } })
  setInterval(() => manda('batti', {}), 20000) // tiene vivo il flusso
  setInterval(() => {
    if (stato.redbull.giorno !== giornata()) { stato.redbull = { giorno: giornata(), n: 0, ultima: null }; salva(); diStato() }
  }, 60000)
})
