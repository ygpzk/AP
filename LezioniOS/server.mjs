// Lezioni OS: la regia delle lezioni. Registra la finestra della lezione e l'audio del PC, trascrive mentre si
// registra, e a lezione finita la «sviluppa»: toglie quello che lezione non è, pulisce la lavagna dalla persona
// davanti, archivia l'audio. Un server solo, sul pc e basta (127.0.0.1): serve la regia (/), la galleria delle lezioni
// (/api/lezioni, /f/<lezione>/…), l'orario (/api/orario) e il flusso dal vivo (/api/flusso). Il lavoro vero lo fanno i
// programmi in motore/ (Python, nel suo ambiente in %LOCALAPPDATA%\Lezioni\venv): qui si accendono, si guardano e si
// rilanciano se cadono. Tutto passa dai file nella cartella della lezione, così un riavvio del server a lezione in
// corso non perde niente. Niente dipendenze: Node 20 o più.

import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const QUI = path.dirname(fileURLToPath(import.meta.url))
const MOTORE = path.join(QUI, 'motore')
const SITO = path.resolve(QUI, '../pzkko.it/public') // i caratteri sono quelli veri del sito (gli stessi di Diretta OS)
const CASA = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Lezioni')
const PY = path.join(CASA, 'venv', 'Scripts', 'python.exe')
const CACHE = path.join(QUI, 'cache')
const VERSIONE = '2026.11.24'

const leggi = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')) } catch { return d } }
const scrivi = (f, d) => { const t = `${f}.nuovo`; fs.writeFileSync(t, JSON.stringify(d, null, 1)); fs.renameSync(t, f) }
const esiste = (f) => fs.existsSync(f)
const alle = (f) => { try { return fs.statSync(f).mtimeMs } catch { return 0 } }
const righe = (f) => { try { return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((r) => { try { return JSON.parse(r) } catch { return null } }).filter(Boolean) } catch { return [] } }
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a)
const due = (n) => String(n).padStart(2, '0')
const giornoDi = (d) => `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`
const oraDi = (d) => `${due(d.getHours())}:${due(d.getMinutes())}`
const minuti = (hhmm) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5)

const CONF = { ...leggi(path.join(QUI, 'config.json'), {}), ...leggi(path.join(QUI, 'config.locale.json'), {}) }
const PORTA = +process.env.LEZIONI_PORTA || CONF.porta || 2380
const FILE_STATO = path.join(QUI, process.env.LEZIONI_STATO ?? 'stato.json')
// dove stanno le lezioni: config.json → cartella, poi LEZIONI_DIR, altrimenti Documenti\Lezioni (come motore/comune.py)
const BASE = process.env.LEZIONI_BASE || CONF.cartella || process.env.LEZIONI_DIR || path.join(os.homedir(), 'Documents', 'Lezioni')
const c = (id, ...p) => path.join(BASE, id, ...p)
fs.mkdirSync(CACHE, { recursive: true })

// ── quello che si decide dalla regia (resta in stato.json) ──
const salvato = leggi(FILE_STATO, {})
const SORGENTI = ['finestra', 'voce', 'lessico', 'pulita', 'lettura', 'archivio', 'ascolto'] // (l'audio del PC c'è sempre)
const MOTORI = ['whisper-large-v3', 'whisper-large-v3-turbo', 'parakeet-v3']
const imp = {
  sorgenti: { finestra: true, voce: true, lessico: true, pulita: true, lettura: false, archivio: true, ascolto: true, ...salvato.sorgenti },
  motore: MOTORI.includes(salvato.motore) ? salvato.motore : CONF.voce?.motore ?? MOTORI[0],
  dispositivo: salvato.dispositivo ?? CONF.voce?.dispositivo ?? 'auto', // auto | gpu | cpu
  sfondo: salvato.sfondo ?? CONF.lavagna?.sfondo ?? 'rvm', // rvm | birefnet
  finestra: { titolo: 'teams|riunione|meeting|lezione', programma: '', modo: 'finestra', ...CONF.finestra, ...salvato.finestra },
  automatico: !!salvato.automatico, // l'orario avvia e ferma la registrazione da solo
  materia: salvato.materia ?? '', // la materia del prossimo avvio a mano ('' = quella dell'orario in quel momento)
}
const salva = () => scrivi(FILE_STATO, imp)

// ── l'orario ──
const FILE_ORARIO = path.join(QUI, 'orario.json')
let orario = leggi(FILE_ORARIO, { materie: {}, lezioni: [] })
const materiaDi = (id) => {
  const m = orario.materie?.[id]
  return m ? { id, ...m, lessico: m.lessico ?? orario.materie?.[m.come]?.lessico ?? '' } : null
}
const inSemestre = (d) => { const g = giornoDi(d), s = orario.semestre; return !s || ((!s.da || g >= s.da) && (!s.a || g <= s.a)) }
// la lezione dell'orario che c'è in quel momento
function lezioneAlle(d) {
  if (!inSemestre(d)) return null
  const m = d.getHours() * 60 + d.getMinutes()
  return (orario.lezioni ?? []).find((l) => l.giorno === d.getDay() && minuti(l.da) <= m && m < minuti(l.a)) ?? null
}
// la prossima da adesso (entro una settimana): { lezione, giorno, fra_s }
function prossimaLezione(d = new Date()) {
  let meglio = null
  for (let g = 0; g < 8; g++) {
    const giorno = new Date(d.getFullYear(), d.getMonth(), d.getDate() + g)
    if (!inSemestre(giorno)) continue
    for (const l of orario.lezioni ?? []) {
      if (l.giorno !== giorno.getDay()) continue
      const quando = new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate(), 0, minuti(l.da))
      if (quando > d && (!meglio || quando < meglio.quando)) meglio = { lezione: l, quando }
    }
    if (meglio) break
  }
  return meglio && { ...meglio.lezione, giorno_data: giornoDi(meglio.quando), fra_s: Math.round((meglio.quando - d) / 1000) }
}
// di che materia era una lezione registrata: quella dell'orario che le si sovrappone di più
function materiaDallOrario(inizio, durata_s) {
  const d = new Date(inizio)
  if (Number.isNaN(+d)) return null
  const da = d.getHours() * 60 + d.getMinutes(), a = da + durata_s / 60
  let meglio = null
  for (const l of orario.lezioni ?? []) {
    if (l.giorno !== d.getDay()) continue
    const sopra = Math.min(a, minuti(l.a) + 30) - Math.max(da, minuti(l.da) - 30)
    if (sopra > 0 && (!meglio || sopra > meglio.sopra)) meglio = { l, sopra }
  }
  return meglio?.l ?? null
}

// ── i programmi del motore ──
function python(script, args, fileLog, staccato = false) {
  fs.mkdirSync(path.dirname(fileLog), { recursive: true })
  const fd = fs.openSync(fileLog, 'a')
  const p = spawn(PY, ['-u', path.join(MOTORE, script), ...args], {
    cwd: MOTORE, detached: staccato, windowsHide: true, stdio: ['ignore', fd, fd],
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', HF_HUB_DISABLE_SYMLINKS_WARNING: '1', LEZIONI_DIR: BASE },
  })
  fs.closeSync(fd)
  p.on('error', (e) => log(script, 'non parte:', e.message))
  if (staccato) p.unref() // registratore e trascrittore vivono da soli: un riavvio del server non li ferma
  return p
}
function pythonDice(script, args, tempo = 20000) {
  return new Promise((ok) => {
    execFile(PY, [path.join(MOTORE, script), ...args], { cwd: MOTORE, windowsHide: true, timeout: tempo, maxBuffer: 8e6, env: { ...process.env, PYTHONUTF8: '1' } },
      (e, out) => { try { ok(JSON.parse(out)) } catch { ok(null) } })
  })
}
// (il numero del processo lo scrive ognuno in log/<nome>.pid)
function vivo(cart, nome) {
  try { process.kill(+fs.readFileSync(path.join(cart, 'log', `${nome}.pid`), 'utf8'), 0); return true } catch { return false }
}

// ── la registrazione in corso ──
let reg = null // { id, cart, da, auto, slot, materia, voce, fermando, lanci: { registra, trascrivi }, giri }
const saltate = new Set() // le lezioni dell'orario fermate a mano: l'automatico non le fa ripartire
let ultimaFinita = null

function lancia(nome) {
  const { cart, materia } = reg
  reg.lanci[nome] = Date.now()
  reg.giri[nome] = (reg.giri[nome] ?? 0) + 1
  if (nome === 'registra') {
    const modo = imp.sorgenti.finestra ? imp.finestra.modo : 'niente'
    python('registra.py', [cart, '--titolo', imp.finestra.titolo, '--programma', imp.finestra.programma ?? '', '--modo', modo], path.join(cart, 'log', 'registra.log'), true)
  } else {
    const a = [cart, '--motore', imp.motore, '--dispositivo', imp.dispositivo, '--lingua', CONF.lingua ?? 'it']
    if (materia?.nome) a.push('--materia', materia.nome)
    if (imp.sorgenti.lessico && materia?.lessico) a.push('--lessico', materia.lessico)
    python('trascrivi.py', a, path.join(cart, 'log', 'trascrivi.log'), true)
  }
  log('lancio', nome, reg.id, reg.giri[nome] > 1 ? `(giro ${reg.giri[nome]})` : '')
}

function avvia({ materia: chiesta, auto = false, slot = null } = {}) {
  if (reg) return { ok: false, errore: 'Sta già registrando.' }
  if (!esiste(PY)) return { ok: false, errore: `Manca l'ambiente Python (${PY}): lancia installa.ps1.` }
  const ora = new Date()
  const inOrario = lezioneAlle(new Date(+ora + 10 * 60e3)) ?? lezioneAlle(ora)
  const materia = materiaDi(chiesta || imp.materia || inOrario?.materia)
  let id = giornoDi(ora)
  if (esiste(c(id, 'meta.json'))) id += `_${due(ora.getHours())}${due(ora.getMinutes())}`
  const cart = c(id)
  fs.mkdirSync(path.join(cart, 'log'), { recursive: true })
  scrivi(path.join(cart, 'meta.json'), {
    versione: `Lezioni OS ${VERSIONE}`, materia: materia?.nome, materia_id: materia?.id, docente: materia?.docente,
    aula: inOrario && inOrario.materia === materia?.id ? inOrario.aula : undefined, motore: imp.sorgenti.voce ? imp.motore : undefined,
  })
  fs.mkdirSync(CASA, { recursive: true })
  fs.writeFileSync(path.join(CASA, 'corrente.txt'), cart)
  reg = { id, cart, da: +ora, auto, slot, materia, voce: imp.sorgenti.voce, fermando: 0, lanci: {}, giri: {} }
  lancia('registra')
  if (reg.voce) lancia('trascrivi')
  cache.clear()
  return { ok: true, id }
}

function ferma(aMano = true) {
  if (!reg) return { ok: false, errore: 'Non sta registrando.' }
  if (!reg.fermando) {
    fs.writeFileSync(path.join(reg.cart, 'STOP'), '')
    reg.fermando = Date.now()
    if (aMano && reg.slot) saltate.add(reg.slot)
    log('fermo', reg.id)
  }
  return { ok: true }
}

// il guardiano: rilancia quello che è caduto, e quando la lezione è chiusa del tutto la manda allo sviluppo
function guardia() {
  if (!reg) return
  const { cart } = reg
  const ora = Date.now()
  if (!reg.fermando) {
    if (esiste(path.join(cart, 'STOP'))) { reg.fermando = ora; return } // fermata da fuori (fine.cmd)
    if (ora - reg.lanci.registra > 9000 && (!vivo(cart, 'registra') || ora - alle(path.join(cart, 'meta.json')) > 25000)) lancia('registra')
    if (reg.voce && ora - (reg.lanci.trascrivi ?? 0) > 9000 && !vivo(cart, 'trascrivi')) lancia('trascrivi')
    return
  }
  if (!esiste(path.join(cart, 'FINE'))) { // il registratore sta chiudendo l'ultimo pezzo; se è morto prima, si chiude da qui
    if (ora - reg.fermando > 25000 && !vivo(cart, 'registra')) fs.writeFileSync(path.join(cart, 'FINE'), new Date().toISOString().slice(0, 19))
    return
  }
  if (reg.voce && !leggi(path.join(cart, 'trascrizione_stato.json'), {})?.finita) { // il trascrittore finisce l'audio rimasto
    if (vivo(cart, 'trascrivi')) return
    if (reg.giri.trascrivi < 6 && ora - reg.lanci.trascrivi > 9000) lancia('trascrivi')
    if (reg.giri.trascrivi < 6) return
  }
  const { id } = reg
  ultimaFinita = { id, alle: ora }
  reg = null
  cache.clear()
  log('lezione chiusa', id)
  sviluppaDopo(id)
}

function sviluppaDopo(id, { rifai = false, passi = null } = {}) {
  const s = imp.sorgenti
  passi ??= ['lezione', 'miniature', s.pulita && 'pulita', 'picchi', s.archivio && 'audio', s.archivio && s.ascolto && 'ascolto'].filter(Boolean)
  accoda({ tipo: 'sviluppa', id, script: 'sviluppa.py', args: ['--passi', passi.join(','), '--sfondo', imp.sfondo, ...(rifai ? ['--rifai'] : [])], stato: 'sviluppo.json' })
  if (s.lettura) accoda({ tipo: 'leggi', id, script: 'leggi.py', args: [], stato: 'lettura.json' })
}

// all'avvio: se un registratore sta ancora scrivendo (il server è stato riavviato a lezione in corso), lo si riprende
function riprendi() {
  let cart
  try { cart = fs.readFileSync(path.join(CASA, 'corrente.txt'), 'utf8').replace(/^\uFEFF/, '').trim() } catch { return }
  if (!cart || path.resolve(path.dirname(cart)) !== path.resolve(BASE) || esiste(path.join(cart, 'FINE'))) return
  const meta = leggi(path.join(cart, 'meta.json'), null)
  if (!meta || Date.now() - alle(path.join(cart, 'meta.json')) > 25000) return
  reg = { id: path.basename(cart), cart, da: +new Date(meta.inizio ?? Date.now()), auto: false, slot: null, materia: materiaDi(meta.materia_id),
    voce: esiste(path.join(cart, 'log', 'trascrivi.pid')), fermando: esiste(path.join(cart, 'STOP')) ? Date.now() : 0,
    lanci: { registra: Date.now(), trascrivi: Date.now() }, giri: { registra: 1, trascrivi: 1 } }
  log('riprendo la lezione in corso', reg.id)
}

// ── l'orario che avvia e ferma da solo ──
const provaFinestra = (salva = '') => pythonDice('cattura.py', ['--titolo', imp.finestra.titolo, '--programma', imp.finestra.programma ?? '', ...(salva ? ['--salva', salva] : [])])
let cercando = false
async function automatico() {
  if (!imp.automatico || cercando) return
  const ora = new Date()
  const anticipo = (CONF.automatico?.anticipo_min ?? 2) * 60e3, coda = (CONF.automatico?.coda_min ?? 10) * 60e3
  if (!reg) {
    const l = lezioneAlle(new Date(+ora + anticipo))
    const chiave = l && `${giornoDi(ora)} ${l.da}`
    if (!l || saltate.has(chiave) || !imp.sorgenti.finestra) return
    cercando = true
    const f = await provaFinestra().finally(() => { cercando = false })
    if (f?.scelta?.foto && !reg) { log('orario:', l.materia, 'la finestra c\'è, avvio'); avvia({ materia: l.materia, auto: true, slot: chiave }) }
  } else if (reg.auto && !reg.fermando) {
    const l = (orario.lezioni ?? []).find((x) => `${giornoDi(new Date(reg.da))} ${x.da}` === reg.slot)
    const fine = l && new Date(new Date(reg.da).setHours(0, minuti(l.a), 0, 0))
    const meta = leggi(path.join(reg.cart, 'meta.json'), {})
    const vuota = !meta.video?.finestra && (meta.audio?.silenzio_s ?? 0) > 600 && +ora - reg.da > 20 * 60e3 // finestra chiusa e silenzio da dieci minuti
    if ((fine && +ora > +fine + coda) || vuota) { log('orario: lezione finita, fermo'); ferma(false) }
  }
}

// ── i lavori di dopo (sviluppo, lettura, scarico dei modelli): uno alla volta, e mai mentre si registra ──
const fila = []
let lavoro = null
let ultimoLavoro = null
function accoda(l) {
  const uguale = (x) => x && x.tipo === l.tipo && x.id === l.id && (x.args ?? []).join() === (l.args ?? []).join()
  if (uguale(lavoro) || fila.some(uguale)) return false
  fila.push(l)
  avanti()
  return true
}
function avanti() {
  if (lavoro || !fila.length || (reg && !reg.fermando)) return
  lavoro = fila.shift()
  const cart = lavoro.id ? c(lavoro.id) : null
  if (cart && lavoro.stato) fs.rmSync(path.join(cart, lavoro.stato), { force: true })
  lavoro.da = Date.now()
  lavoro.proc = python(lavoro.script, [...(cart ? [cart] : []), ...lavoro.args], cart ? path.join(cart, 'log', `${lavoro.tipo}.log`) : path.join(CACHE, `${lavoro.tipo}.log`))
  log('lavoro', lavoro.tipo, lavoro.id ?? lavoro.args.join(' '))
  lavoro.proc.on('exit', (codice) => {
    ultimoLavoro = { tipo: lavoro.tipo, id: lavoro.id, ok: codice === 0, alle: Date.now(), errore: cart && lavoro.stato ? leggi(path.join(cart, lavoro.stato), {})?.errore ?? null : null }
    log('lavoro finito', lavoro.tipo, lavoro.id ?? '', codice === 0 ? '' : `(uscita ${codice})`)
    lavoro = null
    cache.clear()
    modelliAlle = 0
    avanti()
  })
}
const lavoroPulito = (l) => l && { tipo: l.tipo, id: l.id, da: l.da, cosa: l.args.join(' '), ...(l.id && l.stato ? { avanza: leggi(c(l.id, l.stato), null) } : {}) }

// ── la galleria: le lezioni registrate ──
const cache = new Map() // id → { firma, dati }
const cartelle = () => { try { return fs.readdirSync(BASE, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}/.test(d.name)).map((d) => d.name).sort().reverse() } catch { return [] } }
const idBuono = (id) => typeof id === 'string' && /^\d{4}-\d{2}-\d{2}[\w.-]*$/.test(id) && esiste(c(id, 'meta.json'))
const elenco = (cart, sotto) => { try { return new Set(fs.readdirSync(path.join(cart, sotto))) } catch { return new Set() } }
const peso = (f) => { try { return fs.statSync(f).size } catch { return 0 } }

function lezione(id) {
  const cart = c(id)
  const firma = ['meta.json', 'lavagna.json', 'sviluppo.json', 'trascrizione.jsonl', 'trascrizione_stato.json', 'frames.jsonl', 'FINE', 'audio.opus', 'ascolto.opus', 'appunti', 'ocr', 'audio']
    .map((f) => alle(path.join(cart, f))).join()
  const tenuta = cache.get(id)
  if (tenuta?.firma === firma) return tenuta.dati
  const meta = leggi(path.join(cart, 'meta.json'), null)
  if (!meta) return null
  const lav = leggi(path.join(cart, 'lavagna.json'), {})
  const fot = lav.fotogrammi ?? {}
  const foto = elenco(cart, 'frames') // (di una lezione vecchia possono essere rimasti solo l'elenco e la voce)
  const mini = elenco(cart, 'miniature'), pulite = elenco(cart, 'pulita'), wav = [...elenco(cart, 'audio')].filter((n) => n.endsWith('.wav')).sort()
  const frames = righe(path.join(cart, 'frames.jsonl')).map((f) => {
    const nome = path.basename(f.file, '.jpg'), x = fot[f.file] ?? {}
    return { t: f.t, file: f.file, ora: f.ora, fuori: !!(f.fuori || x.fuori) || !foto.has(path.basename(f.file)), box: x.box ?? f.box ?? null, coperto: x.coperto,
      mini: mini.has(`${nome}.webp`) ? `miniature/${nome}.webp` : null, pulita: pulite.has(`${nome}.webp`) ? `pulita/${nome}.webp` : null, nitida: pulite.has(`${nome}.webp`) ? `nitida/${nome}.webp` : null }
  })
  const buoni = frames.filter((f) => !f.fuori)
  const frasi = righe(path.join(cart, 'trascrizione.jsonl')).map((s) => ({ t0: s.t0, t1: s.t1, testo: s.testo }))
  const letture = {}
  for (const n of [...elenco(cart, 'ocr')].sort()) for (const d of leggi(path.join(cart, 'ocr', n), []) ?? []) if (d?.lavagna) letture[d.frame] = { lavagna: d.lavagna, nuovo: d.nuovo, da: d.da ?? 'Claude' }
  const st = leggi(path.join(cart, 'trascrizione_stato.json'), {})
  const dedotta = meta.materia_id ? null : materiaDallOrario(meta.inizio, meta.durata_s ?? 0)
  const materia = materiaDi(meta.materia_id ?? dedotta?.materia)
  const copertina = buoni.length ? buoni[Math.floor(buoni.length * 0.4)] : null
  const appunti = ['appunti/appunti.pdf', 'appunti/appunti_claude.pdf'].find((f) => esiste(path.join(cart, f))) ?? null
  const inCorso = reg?.id === id
  const dati = {
    riassunto: {
      id, inizio: meta.inizio, fine: meta.fine ?? null, durata_s: meta.durata_s ?? 0, in_corso: inCorso, titolo: meta.titolo ?? '',
      materia: materia ? { id: materia.id, nome: materia.nome, breve: materia.breve, colore: materia.colore, docente: materia.docente } : null, dedotta: !!dedotta,
      aula: meta.aula ?? dedotta?.aula ?? null, fotogrammi: buoni.length, fuori: frames.filter((f) => f.fuori && foto.has(path.basename(f.file))).length, frasi: frasi.length,
      parole: frasi.reduce((n, s) => n + s.testo.split(/\s+/).length, 0), motore: st.motore ?? meta.motore ?? null, trascritta: !!st.finita || (!!meta.fine && (st.fatto_s ?? 0) >= (meta.durata_s ?? 0) - 30),
      copertina: copertina ? copertina.mini ?? copertina.file : null, sviluppata: lav.fotogrammi ? { pulita: pulite.size > 0, sfondo: lav.sfondo ?? null } : null,
      audio: { opus: esiste(path.join(cart, 'audio.opus')), ascolto: esiste(path.join(cart, 'ascolto.opus')), pezzi: wav.length,
        wav_mb: Math.round(wav.length * peso(path.join(cart, 'audio', wav[0] ?? '')) / 1e6), opus_mb: +(peso(path.join(cart, 'audio.opus')) / 1e6).toFixed(1) },
      appunti, letture: Object.keys(letture).length, vecchia: !String(meta.versione ?? '').startsWith('Lezioni OS'),
    },
    frames, frasi, letture, picchi: leggi(path.join(cart, 'picchi.json'), null)?.livelli ?? null, sviluppo: leggi(path.join(cart, 'sviluppo.json'), null),
    meta: { audio: meta.audio, video: meta.video ?? meta.schermo, chunk_s: meta.chunk_s ?? 10 }, wav,
  }
  if (!inCorso) cache.set(id, { firma, dati })
  return dati
}

function cerca(q) {
  const ago = q.toLowerCase().trim()
  if (ago.length < 2) return []
  const trovate = []
  for (const id of cartelle()) {
    const d = lezione(id)
    if (!d) continue
    for (const s of d.frasi) {
      if (s.testo.toLowerCase().includes(ago)) trovate.push({ id, t0: s.t0, testo: s.testo, materia: d.riassunto.materia?.breve ?? '', colore: d.riassunto.materia?.colore ?? null })
      if (trovate.length >= 80) return trovate
    }
  }
  return trovate
}

// libera lo spazio dei WAV: solo se c'è l'Opus buono, la voce è tutta trascritta e nessuno ci sta lavorando
function libera(id) {
  const d = lezione(id)?.riassunto
  if (!d || d.in_corso || lavoro?.id === id) return { ok: false, errore: 'La lezione è in lavorazione.' }
  const fatto = leggi(c(id, 'sviluppo.json'), {})?.fatti?.audio
  if (!d.audio.opus || !fatto) return { ok: false, errore: 'Prima serve audio.opus: sviluppa la lezione.' }
  if (d.frasi && !d.trascritta) return { ok: false, errore: 'La trascrizione non è finita: i WAV servono ancora.' }
  let tolti = 0, byte = 0
  for (const n of fs.readdirSync(c(id, 'audio'))) {
    if (!/^c_\d+\.wav$/.test(n)) continue
    byte += peso(c(id, 'audio', n))
    fs.rmSync(c(id, 'audio', n), { force: true })
    tolti++
  }
  cache.delete(id)
  log('liberati', tolti, 'pezzi di', id)
  return { ok: true, tolti, mb: Math.round(byte / 1e6) }
}

// ── il pc: scheda video e disco (si guardano solo se c'è una regia aperta) ──
const pc = { gpu: null, disco: null }
function guardaPc() {
  if (!clienti.size) return
  execFile('nvidia-smi', ['--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,name', '--format=csv,noheader,nounits'], { windowsHide: true, timeout: 4000 }, (e, out) => {
    const v = e ? null : out.trim().split('\n')[0]?.split(',').map((x) => x.trim())
    pc.gpu = v?.length >= 5 ? { uso: +v[0], mem: +v[1], tot: +v[2], gradi: +v[3], nome: v[4].replace('NVIDIA GeForce ', '') } : null
  })
  try { const s = fs.statfsSync(BASE); pc.disco = { liberi_gb: Math.round(s.bavail * s.bsize / 1e9), tot_gb: Math.round(s.blocks * s.bsize / 1e9), dove: path.parse(BASE).root } } catch { pc.disco = null }
}

// ── quello che la regia vede, ogni secondo ──
function codaDi(file, quante) { // le ultime righe di un file che cresce, senza leggerlo tutto
  try {
    const st = fs.statSync(file), n = Math.min(st.size, 40000), buf = Buffer.alloc(n), fd = fs.openSync(file, 'r')
    fs.readSync(fd, buf, 0, n, st.size - n); fs.closeSync(fd)
    return buf.toString('utf8').split('\n').filter(Boolean).slice(-quante).map((r) => { try { const s = JSON.parse(r); return { t0: s.t0, t1: s.t1, testo: s.testo } } catch { return null } }).filter(Boolean)
  } catch { return [] }
}
function statoVivo() {
  const ora = new Date()
  const o = { ora: +ora, versione: VERSIONE, base: BASE, imp, pc, lavoro: lavoroPulito(lavoro), fila: fila.map((l) => ({ tipo: l.tipo, id: l.id })), ultimoLavoro,
    ultimaFinita, adesso: lezioneAlle(ora), prossima: prossimaLezione(ora), python: esiste(PY), reg: null }
  if (reg) {
    const meta = leggi(path.join(reg.cart, 'meta.json'), {}), st = leggi(path.join(reg.cart, 'trascrizione_stato.json'), {})
    const durata = Math.max(meta.durata_s ?? 0, 0)
    o.reg = { id: reg.id, da: reg.da, auto: reg.auto, fermando: !!reg.fermando, materia: reg.materia && { id: reg.materia.id, nome: reg.materia.nome, breve: reg.materia.breve, colore: reg.materia.colore },
      durata_s: durata, audio: meta.audio ?? {}, video: meta.video ?? {}, viva: Date.now() - alle(path.join(reg.cart, 'meta.json')) < 6000,
      voce: reg.voce ? { motore: st.motore ?? null, fatto_s: st.fatto_s ?? 0, ritardo_s: Math.max(0, Math.round(durata - (st.fatto_s ?? 0))), calcolo: st.calcolo ?? null, finita: !!st.finita } : null,
      frasi: reg.voce ? codaDi(path.join(reg.cart, 'trascrizione.jsonl'), 12) : [], anteprima: alle(path.join(reg.cart, 'vivo.jpg')) }
  }
  return o
}
const clienti = new Set()
setInterval(() => {
  if (!clienti.size) return
  const dati = `data: ${JSON.stringify(statoVivo())}\n\n`
  for (const r of clienti) r.write(dati)
}, 1000)
setInterval(guardia, 3000)
setInterval(() => { automatico().catch((e) => log('orario:', e.message)); avanti() }, 15000)
setInterval(guardaPc, 5000)

// ── i modelli (motore/modelli.py) ──
let modelli = null, modelliAlle = 0
async function elencoModelli() {
  if (Date.now() - modelliAlle > 15000) { modelli = await pythonDice('modelli.py', []) ?? modelli; modelliAlle = Date.now() }
  return modelli ?? []
}

// ── le azioni della regia ──
async function azione(a) {
  switch (a.tipo) {
    case 'avvia': return avvia({ materia: a.materia })
    case 'ferma': return ferma(true)
    case 'sorgente':
      if (!SORGENTI.includes(a.id)) return { ok: false, errore: 'Sorgente sconosciuta.' }
      imp.sorgenti[a.id] = !!a.acceso; salva(); return { ok: true }
    case 'imposta': {
      if (MOTORI.includes(a.motore)) imp.motore = a.motore
      if (['auto', 'gpu', 'cpu'].includes(a.dispositivo)) imp.dispositivo = a.dispositivo
      if (['rvm', 'birefnet'].includes(a.sfondo)) imp.sfondo = a.sfondo
      if (typeof a.automatico === 'boolean') imp.automatico = a.automatico
      if (typeof a.materia === 'string' && (a.materia === '' || orario.materie?.[a.materia])) imp.materia = a.materia
      if (a.finestra && typeof a.finestra === 'object') {
        if (typeof a.finestra.titolo === 'string') { try { RegExp(a.finestra.titolo); imp.finestra.titolo = a.finestra.titolo.slice(0, 200) || 'teams|riunione|meeting|lezione' } catch { return { ok: false, errore: 'Il titolo non è un\'espressione regolare valida.' } } }
        if (typeof a.finestra.programma === 'string') imp.finestra.programma = a.finestra.programma.slice(0, 60)
        if (['finestra', 'schermo'].includes(a.finestra.modo)) imp.finestra.modo = a.finestra.modo
      }
      salva(); return { ok: true }
    }
    case 'orario': {
      const n = a.orario
      if (!n || typeof n.materie !== 'object' || !Array.isArray(n.lezioni)) return { ok: false, errore: 'Orario non valido.' }
      const buone = n.lezioni.filter((l) => Number.isInteger(l.giorno) && l.giorno >= 0 && l.giorno <= 6 && /^\d\d:\d\d$/.test(l.da) && /^\d\d:\d\d$/.test(l.a) && l.da < l.a && n.materie[l.materia])
      orario = { ...orario, ...n, lezioni: buone.sort((x, y) => x.giorno - y.giorno || x.da.localeCompare(y.da)) }
      scrivi(FILE_ORARIO, orario); cache.clear(); return { ok: true }
    }
    case 'sviluppa':
      if (!idBuono(a.id)) return { ok: false, errore: 'Lezione sconosciuta.' }
      if (reg?.id === a.id) return { ok: false, errore: 'Sta ancora registrando.' }
      sviluppaDopo(a.id, { rifai: !!a.rifai, passi: Array.isArray(a.passi) ? a.passi.filter((p) => /^[a-z]+$/.test(p)) : null }); return { ok: true }
    case 'leggi':
      if (!idBuono(a.id)) return { ok: false, errore: 'Lezione sconosciuta.' }
      return { ok: accoda({ tipo: 'leggi', id: a.id, script: 'leggi.py', args: typeof a.frame === 'string' && /^frames\/t_\d+\.jpg$/.test(a.frame) ? ['--frame', a.frame] : [], stato: 'lettura.json' }) }
    case 'libera': return idBuono(a.id) ? libera(a.id) : { ok: false, errore: 'Lezione sconosciuta.' }
    case 'materia': { // di che materia è una lezione già registrata
      if (!idBuono(a.id) || reg?.id === a.id) return { ok: false, errore: 'Lezione sconosciuta o in corso.' }
      const m = materiaDi(a.materia), f = c(a.id, 'meta.json'), meta = leggi(f, null)
      if (!meta) return { ok: false }
      scrivi(f, { ...meta, materia_id: m?.id, materia: m?.nome, docente: m?.docente, titolo: typeof a.titolo === 'string' ? a.titolo.slice(0, 120) : meta.titolo })
      cache.delete(a.id); return { ok: true }
    }
    case 'apri': {
      const dove = a.id && idBuono(a.id) ? c(a.id, ...(a.file === 'appunti' ? ['appunti'] : [])) : BASE
      spawn('explorer.exe', [dove], { detached: true, stdio: 'ignore' }).unref(); return { ok: true }
    }
    case 'prova': { // la prova di cattura: quale finestra prenderebbe adesso, e una sua foto
      const r = await provaFinestra(path.join(CACHE, 'prova.jpg'))
      return { ok: !!r, ...r, foto: r?.scelta?.foto ? `/cache/prova.jpg?${Date.now()}` : null }
    }
    case 'modello': {
      const m = (await elencoModelli()).find((x) => x.id === a.id)
      if (!m?.scaricabile) return { ok: false, errore: 'Non c\'è niente da scaricare.' }
      return { ok: accoda({ tipo: 'modello', id: null, script: 'modelli.py', args: ['scarica', a.id] }) }
    }
    case 'spegniti': setTimeout(() => process.exit(0), 150); return { ok: true }
    default: return { ok: false, errore: 'Azione sconosciuta.' }
  }
}

// ── il server ──
const TIPI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.opus': 'audio/ogg', '.wav': 'audio/wav',
  '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.log': 'text/plain; charset=utf-8' }
const dice = (res, codice, d) => { res.writeHead(codice, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(d)) }
function manda(req, res, file, tieni = 'no-cache') {
  let st
  try { st = fs.statSync(file) } catch { return dice(res, 404, { errore: 'Non c\'è.' }) }
  if (!st.isFile()) return dice(res, 404, { errore: 'Non c\'è.' })
  const testa = { 'Content-Type': TIPI[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': tieni }
  const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
  if (r && (r[1] || r[2])) { // l'audio si scorre: il browser chiede i pezzi che gli servono
    const da = r[1] ? +r[1] : Math.max(0, st.size - +r[2]), a = r[1] && r[2] ? Math.min(+r[2], st.size - 1) : st.size - 1
    if (da > a || da >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end() }
    res.writeHead(206, { ...testa, 'Content-Range': `bytes ${da}-${a}/${st.size}`, 'Content-Length': a - da + 1 })
    return fs.createReadStream(file, { start: da, end: a }).pipe(res)
  }
  res.writeHead(200, { ...testa, 'Content-Length': st.size })
  fs.createReadStream(file).pipe(res)
}
const dentro = (radice, rel) => { const f = path.resolve(radice, `.${path.sep}${rel}`); return f.startsWith(path.resolve(radice) + path.sep) ? f : null }

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x')
    const p = decodeURIComponent(u.pathname)
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host ?? '')) return dice(res, 403, { errore: 'Solo da questo pc.' })
    if (req.method === 'POST' && p === '/api/azione') {
      let corpo = ''
      for await (const pezzo of req) { corpo += pezzo; if (corpo.length > 2e6) return dice(res, 413, { errore: 'Troppo.' }) }
      let a
      try { a = JSON.parse(corpo) } catch { return dice(res, 400, { errore: 'Non è JSON.' }) }
      return dice(res, 200, await azione(a ?? {}))
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return dice(res, 405, { errore: 'No.' })
    if (p === '/api/flusso') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
      res.write(`data: ${JSON.stringify(statoVivo())}\n\n`)
      clienti.add(res); guardaPc()
      req.on('close', () => clienti.delete(res))
      return
    }
    if (p === '/api/stato') return dice(res, 200, statoVivo())
    if (p === '/api/lezioni') return dice(res, 200, cartelle().map((id) => lezione(id)?.riassunto).filter(Boolean))
    if (p.startsWith('/api/lezione/')) { const id = p.slice(13); const d = idBuono(id) && lezione(id); return d ? dice(res, 200, d) : dice(res, 404, { errore: 'Lezione sconosciuta.' }) }
    if (p === '/api/cerca') return dice(res, 200, cerca(u.searchParams.get('q') ?? ''))
    if (p === '/api/orario') return dice(res, 200, orario)
    if (p === '/api/modelli') return dice(res, 200, await elencoModelli())
    if (p === '/api/registro') { // le ultime righe dei registri di una lezione (o di quella in corso)
      const id = u.searchParams.get('id') || reg?.id || ultimaFinita?.id
      if (!idBuono(id)) return dice(res, 200, {})
      const coda = (n) => { try { return fs.readFileSync(c(id, 'log', `${n}.log`), 'utf8').trim().split('\n').slice(-30).join('\n') } catch { return '' } }
      return dice(res, 200, { id, registra: coda('registra'), trascrivi: coda('trascrivi'), sviluppa: coda('sviluppa'), leggi: coda('leggi') })
    }
    if (p.startsWith('/f/')) { // un file di una lezione
      const [id, ...resto] = p.slice(3).split('/')
      const f = idBuono(id) && dentro(c(id), resto.join(path.sep))
      return f ? manda(req, res, f, resto[0] === 'vivo.jpg' ? 'no-store' : 'max-age=600') : dice(res, 404, { errore: 'Non c\'è.' })
    }
    if (p.startsWith('/fonts/')) { const f = dentro(SITO, p.slice(1)); return f ? manda(req, res, f, 'max-age=86400') : dice(res, 404, {}) }
    if (p.startsWith('/katex/')) { const f = dentro(path.join(MOTORE, 'stile', 'katex'), p.slice(7)); return f ? manda(req, res, f, 'max-age=86400') : dice(res, 404, {}) } // le formule lette
    if (p.startsWith('/cache/')) { const f = dentro(CACHE, p.slice(7)); return f ? manda(req, res, f, 'no-store') : dice(res, 404, {}) }
    const f = dentro(path.join(QUI, 'pubblico'), p === '/' ? 'regia.html' : p.slice(1))
    return f ? manda(req, res, f) : dice(res, 404, { errore: 'Non c\'è.' })
  } catch (e) {
    log('errore', req.url, e.message)
    if (!res.headersSent) dice(res, 500, { errore: e.message })
  }
})

riprendi()
server.listen(PORTA, '127.0.0.1', () => log(`Lezioni OS ${VERSIONE}: http://localhost:${PORTA}/ · lezioni in ${BASE}`))
