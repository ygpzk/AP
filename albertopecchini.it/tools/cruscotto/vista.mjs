// Il disegno della regia (3.11.2026). cruscotto.mjs lo ricarica da solo quando questo file
// cambia: si migliora la regia mentre è aperta, senza chiuderla. Qui la lettura dei dati della
// diretta, la sessione in cima, i tasti, la riga di comando e il disegno; battito, sistema, git,
// server e account li raccoglie cruscotto.mjs.
//
// A finestre (11.11.2026, Alberto: «fai regia di claude come una cmd più controllabile e tech»,
// «più forma di finestra», «statistiche account»): una barra del titolo, poi le finestre con il
// bordo e il loro numero: 1 CLAUDE (richiesta, nota, strumento, piano), 2 AGENTI, 3 ACCOUNT (limiti
// del piano e token), 4 SISTEMA (grafici di CPU e RAM), 5 RETE (server di casa, siti, hosting, git,
// sessione), LAVORI (le barre, quando ci sono), 6 LOG, 7 FREELLM (i modelli gratis di FreeLLMAPI: chi
// sta rispondendo, dati da modelli.mjs). Quella in primo piano ha il bordo doppio:
// Tab e i numeri la cambiano, z la ingrandisce. In fondo la riga di comando: «:» come in vim.

import { readdirSync, openSync, readSync, fstatSync, closeSync, existsSync, rmSync, appendFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STATI, LOG, CARTELLA, leggi, scrivi } from './diretta.mjs'
import { freellm, comanda, quando, INDIRIZZO } from './modelli.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
// la macchina del tempo prima della regia generale scriveva qui: i giri partiti allora si vedono ancora
const VECCHIA = 'C:/Users/Alberto/Documents/AP/albertopecchini.it/tools/tempo/lavoro/diretta'
// una per sessione di Claude (le scrive gancio.mjs): Alberto ne tiene aperte più d'una
const SESSIONI = join(CARTELLA, 'sessioni')

const E = '\x1b['
const c = (n, s) => `${E}38;5;${n}m${s}${E}39m`
const sf = (n, s) => `${E}48;5;${n}m${s}${E}49m`
const forte = (s) => `${E}1m${s}${E}22m`
const grigio = (s) => c(245, s)
const scuro = (s) => c(239, s)
const VERDE = 71
const ROSSO = 203
const GIALLO = 221
const BLU = 75
const CIANO = 81
const COLORE = { ap: 33, rivalta: 71, cascina: 172, claude: 81, alberto: 221, scarico: 75, prova: 117, tempo: 250, giro: 250, freellm: 43 }
const STRUMENTO = { Bash: 75, PowerShell: 75, Edit: 114, Write: 114, MultiEdit: 114, NotebookEdit: 114, Read: 248, Grep: 180, Glob: 180, Agent: 141, Task: 141, Skill: 141, WebFetch: 117, WebSearch: 117, Artifact: 213 }
const colore = (chi = '') => {
  if (chi.startsWith('claude-')) return STRUMENTO[chi.slice(7)] ?? (chi.includes('mcp__') ? 213 : 81)
  return COLORE[chi.split('-').pop()] ?? COLORE[chi.split('-')[0]] ?? 250
}
// ogni sessione il suo colore, sempre lo stesso: viene dalla sigla
const TINTE = [81, 213, 114, 215, 141, 117, 209, 151, 186, 75]
const tinta = (sigla = '') => TINTE[[...sigla].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % TINTE.length]
const corto = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, Math.max(0, n - 1)) + '…' : t
}
// solo simboli che Consolas, il carattere della console, ha davvero (provati l'11.11.2026 col suo
// elenco dei glifi): ✓, i puntini braille e ▁▂▃▅▆▇ uscivano come quadratini
const GIRA = ['∙', '•', '●', '•']
const OK = '√'

// ── misure e tagli, coi codici dei colori che non contano ───────────────────
const ESC = /(\x1b\[[0-9;?]*[A-Za-z])/
const visibile = (s) => String(s).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
// Le emoji e i caratteri larghi prendono due colonne e spostavano il bordo destro delle finestre:
// diventano «?»; via i caratteri di controllo e quelli senza larghezza
const LARGO = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g
const sano = (s) =>
  String(s)
    .split(ESC)
    .map((p) => (p.startsWith('\x1b[') ? p : p.replace(LARGO, '?').replace(/[\u200B-\u200F\uFE0E\uFE0F\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\t/g, ' ')))
    .join('')
export function taglia(s, w) {
  let n = 0
  let o = ''
  for (const pezzo of String(s).split(ESC)) {
    if (pezzo.startsWith('\x1b[')) {
      o += pezzo
      continue
    }
    for (const ch of pezzo) {
      if (n >= w) return o + `${E}0m`
      o += ch
      n++
    }
  }
  return o
}
const lungo = (s) => [...visibile(s)].length
const pad = (s, n) => (lungo(s) >= n ? taglia(s, n) : s + ' '.repeat(n - lungo(s)))
const padS = (s, n) => (lungo(s) >= n ? taglia(s, n) : ' '.repeat(n - lungo(s)) + s)
const destra = (sx, dx, w) => {
  const spazio = w - lungo(sx) - lungo(dx)
  return spazio >= 1 ? sx + ' '.repeat(spazio) + dx : taglia(sx, Math.max(0, w - lungo(dx) - 1)) + ' ' + dx
}
const aCapo = (testo, w, righe) => {
  const parole = String(testo).split(/\s+/)
  const out = ['']
  for (const p of parole) {
    if ((out.at(-1) + ' ' + p).trim().length > w) {
      if (out.length >= righe) {
        out[out.length - 1] = taglia(out.at(-1), w - 1) + '…'
        return out
      }
      out.push(p)
    } else out[out.length - 1] = (out.at(-1) + ' ' + p).trim()
  }
  return out
}
function barra(frazione, w, col) {
  const f = Math.max(0, Math.min(1, frazione || 0))
  const pieni = Math.floor(f * w)
  const mezzo = f * w - pieni >= 0.5 && pieni < w ? 1 : 0
  return c(col, '█'.repeat(pieni) + (mezzo ? '▌' : '')) + scuro('░'.repeat(w - pieni - mezzo))
}
// Un grafico a colonne alto due righe con ▄ e █ (gli altri ottavi Consolas non li ha): 5 livelli
// per colonna. Torna [sopra, sotto]; i valori più vecchi a sinistra, il vuoto a sinistra se mancano.
function grafico(valori, w, colOf, larghezza = 1) {
  const n = Math.floor(w / larghezza)
  const v = valori.slice(-n)
  const vuoti = n - v.length
  let su = ''
  let giu = ''
  for (let i = 0; i < n; i++) {
    const x = i < vuoti ? null : v[i - vuoti]
    if (x == null) {
      su += ' '.repeat(larghezza)
      giu += scuro('·'.repeat(larghezza))
      continue
    }
    const l = Math.round(Math.max(0, Math.min(1, x)) * 4)
    const col = colOf(x)
    su += c(col, (l >= 4 ? '█' : l === 3 ? '▄' : ' ').repeat(larghezza))
    giu += l === 0 ? scuro('·'.repeat(larghezza)) : c(col, (l >= 2 ? '█' : '▄').repeat(larghezza))
  }
  return [su, giu]
}
export const durata = (s) => {
  if (!Number.isFinite(s) || s < 0) return '—'
  s = Math.round(s)
  const g = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return g ? `${g}g ${h}h` : h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
}
const fra = (ms) => durata((Date.now() - ms) / 1000)
const gb = (b) => `${(b / 1024 ** 3).toLocaleString('it-IT', { maximumFractionDigits: 1 })} GB`
const k = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + 'G' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n || 0))
const oraRoma = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })

// ── i dati della diretta ─────────────────────────────────────────────────────
const vivo = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function statiDa(cartella) {
  if (!existsSync(cartella)) return []
  const out = []
  for (const f of readdirSync(cartella)) {
    if (!f.endsWith('.json')) continue
    const s = leggi(join(cartella, f))
    if (s) out.push(s)
  }
  return out
}

// Le ultime n righe, ognuna col suo momento intero: nel file c'è solo l'ora, e dopo mezzanotte le
// 00:43 finivano prima delle 23:06 e il log sembrava fermo (9.11.2026). Si parte dall'ultima
// modifica del file e si va indietro: quando l'ora risale, è il giorno prima.
function coda(file, n) {
  if (!existsSync(file)) return []
  const fd = openSync(file, 'r')
  try {
    const st = fstatSync(fd)
    const size = st.size
    const quanto = Math.min(size, 240 * 1024)
    const buf = Buffer.alloc(quanto)
    readSync(fd, buf, 0, quanto, size - quanto)
    const righe = buf.toString('utf8').split('\n').filter(Boolean).slice(-n)
    const secondi = (r) => {
      const m = r.match(/^(\d\d):(\d\d):(\d\d)/)
      return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null
    }
    const fine = new Date(st.mtimeMs)
    let giorno = new Date(fine.getFullYear(), fine.getMonth(), fine.getDate()).getTime()
    let dopo = fine.getHours() * 3600 + fine.getMinutes() * 60 + fine.getSeconds() + 60
    const out = []
    for (let i = righe.length - 1; i >= 0; i--) {
      const s = secondi(righe[i]) ?? dopo
      if (s > dopo + 60) giorno -= 86400 * 1000
      dopo = s
      out.push({ r: righe[i], t: giorno + s * 1000 })
    }
    return out.reverse()
  } finally {
    closeSync(fd)
  }
}

export function raccogli() {
  const stati = [...statiDa(STATI), ...statiDa(VECCHIA)]
  // le note di Claude, la più recente prima: ogni sessione ha la sua (diretta.mjs le firma)
  const note = stati.filter((s) => s.tipo === 'nota').sort((a, b) => b.agg - a.agg)
  // i piani: piano-<sigla>.json per sessione, piano.json di chi scrive da fuori di Claude Code
  const piani = {}
  for (const f of readdirSync(CARTELLA)) {
    const m = f.match(/^piano(?:-(\w+))?\.json$/)
    if (m) piani[m[1] || ''] = leggi(join(CARTELLA, f))
  }
  const righe = [...coda(LOG, 1000), ...coda(join(VECCHIA, 'log.txt'), 200).filter((x) => !x.r.includes('\tclaude\t'))].sort((a, b) => a.t - b.t).map((x) => x.r)
  const tutte = statiDa(SESSIONI)
  // le sessioni dell'ultimo giorno; quelle chiuse restano un minuto, perché si veda che sono chiuse
  const sessioni = tutte.filter((s) => Date.now() - (s.agg || 0) < 86400 * 1000 && !(s.stato === 'chiusa' && Date.now() - (s.chiusa || 0) > 60 * 1000)).sort((a, b) => b.agg - a.agg)
  return {
    stati: stati.filter((s) => s.tipo !== 'nota'),
    note,
    sessioni,
    // i ganci contano i suoni (fine turno, attesa) in ogni sessione: il guscio suona quando la somma cresce
    suona: tutte.reduce((n, s) => n + (s.suona || 0), 0),
    claude: principale(sessioni) || {},
    piani,
    righe,
  }
}

// La sessione in cima: quella fissata (tasto «s», Invio sugli AGENTI o «:sessione»); se no, fra
// quelle che lavorano (o aspettano) l'ultima a cui Alberto ha chiesto qualcosa, così la cima non
// salta a ogni strumento quando ne lavorano due insieme; se nessuna lavora, l'ultima che si è mossa.
export function principale(sessioni = [], fissata = null) {
  if (fissata) {
    const s = sessioni.find((x) => x.sigla === fissata)
    if (s) return s
  }
  const attive = sessioni.filter((s) => s.stato === 'lavora' || s.stato === 'aspetta')
  if (attive.length) return attive.sort((a, b) => (b.richiesta?.da || b.agg) - (a.richiesta?.da || a.agg))[0]
  return sessioni.find((s) => s.stato !== 'chiusa') || sessioni[0]
}

// la cartella su cui il guscio misura git: quella della sessione in cima
export const cartella = (tasti = {}) => principale(statiDa(SESSIONI).sort((a, b) => b.agg - a.agg), tasti.sessione)?.cwd

// le sessioni della finestra AGENTI, nell'ordine in cui si vedono (serve anche ai tasti)
const ORDINE = { aspetta: 0, lavora: 1, fermo: 2, chiusa: 3 }
const daQuando = (s) => s.inizioLavoro || s.richiesta?.da || s.agg
function elencoAgenti(sessioni, adesso = Date.now()) {
  return sessioni
    .filter((s) => s.stato === 'lavora' || s.stato === 'aspetta' || adesso - (s.agg || 0) < 3 * 3600 * 1000)
    .sort((a, b) => (ORDINE[a.stato] ?? 2) - (ORDINE[b.stato] ?? 2) || daQuando(a) - daQuando(b))
}

// ── i tasti e la riga di comando ─────────────────────────────────────────────
const FINESTRE = ['claude', 'agenti', 'account', 'sistema', 'rete', 'log', 'freellm']
const NOMI = { claude: 'CLAUDE', agenti: 'AGENTI', account: 'ACCOUNT', sistema: 'SISTEMA', rete: 'RETE', log: 'LOG', lavori: 'LAVORI', freellm: 'FREELLM' }
const FILTRI = ['tutto', 'claude', 'lavori', 'errori']
const APRI = {
  sito: 'https://www.albertopecchini.it/',
  pzkko: 'https://www.pzkko.it/',
  regia: 'http://localhost:8788/server/',
  server: 'http://localhost:8788/server/',
  tempo: 'http://localhost:8789/',
  vite: 'http://localhost:5173/',
  uso: 'https://claude.ai/settings/usage',
  tunnel: 'https://desktop-inpvhr2.tail6c90b3.ts.net/tempo/',
  freellm: 'http://localhost:3001/',
  log: LOG,
  cartella: CARTELLA,
}
// i comandi: nome, scorciatoie, cosa prende, cosa fa (l'aiuto si scrive da qui)
const COMANDI = [
  ['aiuto', ['?', 'h', 'help'], '', 'questo aiuto'],
  ['filtro', ['f'], 'tutto|claude|lavori|errori', 'cosa mostra il LOG'],
  ['cerca', ['/'], 'testo', 'solo le righe del LOG con quel testo (vuoto: tutte)'],
  ['sessione', ['s'], 'sigla|tutte', 'fissa una sessione in cima (e nel LOG)'],
  ['finestra', ['w'], 'nome|numero', 'porta in primo piano una finestra'],
  ['zoom', ['z'], '[nome]', 'ingrandisce la finestra (di nuovo: torna)'],
  ['apri', ['o'], Object.keys(APRI).join('|'), 'apre nel browser o in Esplora risorse'],
  ['nota', ['n'], 'testo', 'scrive una riga tua nel LOG'],
  ['freellm', ['gratis'], 'avvia|ferma|chiedi <testo>', 'i modelli gratis (FreeLLMAPI): accende, spegne, fa una domanda (risposta nel LOG); vuoto: ingrandisce la 7'],
  ['pausa', ['p'], '', 'ferma il LOG (di nuovo: riparte)'],
  ['aggiorna', ['r'], '', 'rimisura subito server, siti, git e account'],
  ['pulisci', ['x'], '', 'via le barre finite e le sessioni chiuse'],
  ['automatica', ['auto'], 'si|no', 'la regia si apre da sola quando scrivi a Claude (di solito no: icona sul desktop)'],
  ['riavvia', [], '', 'chiude e riapre la regia (serve se cambia il guscio)'],
  ['esci', ['q', 'quit'], '', 'chiude la regia'],
]
const trova = (nome) => COMANDI.find(([n, alias]) => n === nome || alias.includes(nome))
const avvisa = (tasti, testo, errore = false) => (tasti.messaggio = { testo, errore, t: Date.now() })
const apriFuori = (dove) => {
  try {
    spawn('cmd.exe', ['/c', 'start', '""', dove], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
    return true
  } catch {
    return false
  }
}

function esegui(riga, tasti) {
  const testo = riga.trim()
  if (!testo) return
  ;(tasti.storia ||= []).push(testo)
  if (tasti.storia.length > 50) tasti.storia.shift()
  const [nome, ...resto] = testo.split(/\s+/)
  const arg = resto.join(' ')
  const cmd = trova(nome.toLowerCase())
  if (!cmd) return avvisa(tasti, `comando sconosciuto: «${nome}» (:aiuto per l'elenco)`, true)
  switch (cmd[0]) {
    case 'aiuto':
      tasti.aiuto = !tasti.aiuto
      break
    case 'filtro': {
      const f = FILTRI.find((x) => x.startsWith(arg.toLowerCase() || 'tutto'))
      if (!f) return avvisa(tasti, `filtro: tutto, claude, lavori o errori`, true)
      Object.assign(tasti, { filtro: f, scorri: 0 })
      avvisa(tasti, `LOG: ${f}`)
      break
    }
    case 'cerca':
      Object.assign(tasti, { cerca: arg || null, scorri: 0, fuoco: 'log' })
      avvisa(tasti, arg ? `cerco «${arg}» nel LOG (Esc per smettere)` : 'ricerca tolta')
      break
    case 'sessione': {
      if (!arg || /^tutte?$/i.test(arg)) {
        tasti.sessione = null
        return avvisa(tasti, 'tutte le sessioni')
      }
      const s = raccogli().sessioni.find((x) => x.sigla.startsWith(arg.replace('#', '')))
      if (!s) return avvisa(tasti, `nessuna sessione #${arg}`, true)
      Object.assign(tasti, { sessione: s.sigla, scorri: 0 })
      avvisa(tasti, `fissata #${s.sigla} · ${basename(s.radice || s.cwd || '')}`)
      break
    }
    case 'finestra':
    case 'zoom': {
      const n = Number(arg)
      const f = n ? FINESTRE[n - 1] : FINESTRE.find((x) => x.startsWith(arg.toLowerCase())) || (arg ? null : tasti.fuoco || 'log')
      if (!f) return avvisa(tasti, `finestre: ${FINESTRE.join(', ')}`, true)
      tasti.fuoco = f
      if (cmd[0] === 'zoom') tasti.zoom = tasti.zoom === f ? null : f
      break
    }
    case 'apri': {
      const dove = APRI[arg.toLowerCase()] || (/^https?:\/\//.test(arg) ? arg : null)
      if (!dove) return avvisa(tasti, `apri: ${Object.keys(APRI).join(', ')} o un indirizzo`, true)
      avvisa(tasti, apriFuori(dove) ? `apro ${dove}` : `non riesco ad aprire ${dove}`, !dove)
      break
    }
    case 'nota': {
      if (!arg) return avvisa(tasti, 'nota: scrivi il testo dopo il comando', true)
      const ora = new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour12: false })
      try {
        appendFileSync(LOG, `${ora}\talberto\t${arg.replace(/[\t\n]/g, ' ')}\n`)
        avvisa(tasti, 'scritta nel LOG')
      } catch {
        avvisa(tasti, 'non riesco a scrivere nel LOG', true)
      }
      break
    }
    case 'freellm': {
      // le risposte e gli esiti vanno nel LOG come righe «freellm»
      const ora = () => new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour12: false })
      const logga = (testo) => {
        try {
          appendFileSync(LOG, `${ora()}\tfreellm\t${String(testo).replace(/[\t\r]/g, ' ')}\n`)
        } catch {}
      }
      const [azione = '', ...resto] = arg.split(/\s+/).filter(Boolean)
      const domanda = resto.join(' ')
      if (!azione) Object.assign(tasti, { fuoco: 'freellm', zoom: tasti.zoom === 'freellm' ? null : 'freellm' })
      else if ('avvia'.startsWith(azione)) {
        comanda(['avvia', '--senza-finestra'], (out, codice) => logga(codice ? `× ${out}` : `√ ${out.split('\n')[0]} · ${INDIRIZZO}/v1`))
        avvisa(tasti, 'accendo FreeLLMAPI…')
      } else if ('ferma'.startsWith(azione)) {
        comanda(['ferma'], (out) => logga(out))
        avvisa(tasti, 'spengo FreeLLMAPI')
      } else if ('chiedi'.startsWith(azione)) {
        if (!domanda) return avvisa(tasti, 'freellm chiedi: scrivi la domanda dopo', true)
        logga(`domanda: ${domanda}`)
        comanda(['chiedi', domanda], (out, codice) => {
          const righe = out.split('\n').map((r) => r.trim()).filter(Boolean)
          if (codice) righe[0] = '× ' + righe[0]
          for (const r of righe.slice(0, 15)) logga(r)
          if (righe.length > 15) logga(`… (${righe.length - 15} righe in più)`)
        })
        avvisa(tasti, 'chiedo ai modelli gratis: la risposta arriva nel LOG')
      } else return avvisa(tasti, 'freellm: avvia, ferma o chiedi <testo>', true)
      break
    }
    case 'pausa':
      tasti.pausa = !tasti.pausa
      break
    case 'aggiorna':
      tasti.aggiorna = true
      avvisa(tasti, 'rimisuro tutto')
      break
    case 'pulisci':
      pulisci()
      avvisa(tasti, 'tolte le barre finite e le sessioni chiuse')
      break
    case 'automatica': {
      const file = join(CARTELLA, 'impostazioni.json')
      const imp = leggi(file, {}) || {}
      if (/^(s[iì]|on|1)$/i.test(arg)) imp.apriDaSola = true
      else if (/^(no|off|0)$/i.test(arg)) imp.apriDaSola = false
      else return avvisa(tasti, `apertura automatica: ${imp.apriDaSola ? 'accesa' : 'spenta'} (:automatica si|no)`)
      scrivi(file, imp)
      avvisa(tasti, imp.apriDaSola ? 'la regia si aprirà da sola quando scrivi a Claude' : "la regia si apre solo dall'icona sul desktop")
      break
    }
    case 'riavvia':
      try {
        spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', join(QUI, 'cruscotto.ps1'), '-Riavvia'], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
        avvisa(tasti, 'riavvio la regia…')
      } catch {
        avvisa(tasti, 'non riesco a riavviare', true)
      }
      break
    case 'esci':
      tasti.esci = true
      break
  }
}

function pulisci() {
  for (const f of readdirSync(STATI)) if (leggi(join(STATI, f))?.fine) rmSync(join(STATI, f), { force: true })
  if (existsSync(SESSIONI)) for (const f of readdirSync(SESSIONI)) if (leggi(join(SESSIONI, f))?.stato === 'chiusa') rmSync(join(SESSIONI, f), { force: true })
}

// La riga di comando aperta: le lettere vanno lì, Invio esegue, Esc chiude, Tab completa,
// ↑↓ ripescano i comandi di prima
function scrivendo(k, tasti) {
  const testo = tasti.comando
  if (k === '\r' || k === '\n') {
    tasti.comando = null
    tasti.giu = null
    if (tasti.prompt === '/') esegui(`cerca ${testo}`, tasti)
    else esegui(testo, tasti)
  } else if (k === '\x1b') {
    tasti.comando = null
    tasti.giu = null
  } else if (k === '\x7f' || k === '\b') {
    if (!testo) tasti.comando = null
    else tasti.comando = testo.slice(0, -1)
  } else if (k === '\t') {
    if (tasti.prompt !== ':') return true
    const [nome, ...resto] = testo.split(' ')
    if (!resto.length) {
      const c = COMANDI.filter(([n]) => n.startsWith(nome))
      if (c.length === 1) tasti.comando = c[0][0] + ' '
    } else {
      const cmd = trova(nome)
      const scelte = cmd?.[2].replace(/[[\]]/g, '').split('|') || []
      const fatte = scelte.filter((s) => s.startsWith(resto.join(' ')))
      if (fatte.length >= 1) tasti.comando = `${nome} ${fatte[0]}`
    }
  } else if (k === '\x1b[A' || k === '\x1b[B') {
    const st = tasti.storia || []
    if (!st.length) return true
    tasti.giu = tasti.giu == null ? st.length : tasti.giu
    tasti.giu = Math.max(0, Math.min(st.length, tasti.giu + (k === '\x1b[A' ? -1 : 1)))
    tasti.comando = st[tasti.giu] ?? ''
  } else if (k.startsWith('\x1b')) {
    // altre frecce: niente
  } else tasti.comando = testo + k.replace(/[\x00-\x1f]/g, '')
  return true
}

// I tasti (tranne «q» e Ctrl+C, che restano al guscio): stanno qui perché se ne aggiungano a
// regia aperta. Torna true se il tasto era suo.
export function tasto(k, tasti) {
  tasti.fuoco ||= 'log'
  if (tasti.comando != null) return scrivendo(k, tasti)
  if (k === ':' || k === '/') {
    tasti.comando = ''
    tasti.prompt = k
    tasti.aiuto = k === ':' ? tasti.aiuto : false
    return true
  }
  const scorriLog = (n) => (tasti.scorri = Math.max(0, (tasti.scorri || 0) + n))
  if (k === '?') tasti.aiuto = !tasti.aiuto
  else if (k === '\t') tasti.fuoco = FINESTRE[(FINESTRE.indexOf(tasti.fuoco) + 1) % FINESTRE.length]
  else if (k === '\x1b[Z') tasti.fuoco = FINESTRE[(FINESTRE.indexOf(tasti.fuoco) + FINESTRE.length - 1) % FINESTRE.length]
  else if (/^[1-7]$/.test(k)) tasti.fuoco = FINESTRE[Number(k) - 1]
  else if (k === 'z') tasti.zoom = tasti.zoom ? null : tasti.fuoco
  else if (k === 'r') esegui('aggiorna', tasti)
  else if (k === 'a') Object.assign(tasti, { filtro: 'tutto', scorri: 0 })
  else if (k === 'c') Object.assign(tasti, { filtro: 'claude', scorri: 0 })
  else if (k === 'l') Object.assign(tasti, { filtro: 'lavori', scorri: 0 })
  else if (k === 'e') Object.assign(tasti, { filtro: 'errori', scorri: 0 })
  else if (k === 'f') Object.assign(tasti, { filtro: FILTRI[(FILTRI.indexOf(tasti.filtro) + 1) % FILTRI.length], scorri: 0 })
  else if (k === 'p') tasti.pausa = !tasti.pausa
  else if (k === 'x') pulisci()
  else if (k === '\x1b') {
    // Esc toglie una cosa alla volta: l'aiuto, lo zoom, la ricerca, la sessione fissata, lo scorrimento
    if (tasti.aiuto) tasti.aiuto = false
    else if (tasti.zoom) tasti.zoom = null
    else if (tasti.cerca) tasti.cerca = null
    else if (tasti.sessione) tasti.sessione = null
    else tasti.scorri = 0
  } else if (k === 's') {
    // da «tutte» alla prima sessione, alla seconda, … e di nuovo a «tutte»
    const elenco = raccogli().sessioni.filter((s) => s.stato !== 'chiusa').map((s) => s.sigla)
    const i = elenco.indexOf(tasti.sessione)
    tasti.sessione = i + 1 < elenco.length ? elenco[i + 1] : null
    tasti.scorri = 0
  } else if (tasti.fuoco === 'agenti' && (k === '\x1b[A' || k === '\x1b[B')) {
    // sugli AGENTI le frecce scelgono una sessione, Invio la fissa in cima
    const n = elencoAgenti(raccogli().sessioni).length
    tasti.scelta = Math.max(0, Math.min(n - 1, (tasti.scelta || 0) + (k === '\x1b[A' ? -1 : 1)))
  } else if (tasti.fuoco === 'agenti' && k === '\r') {
    const s = elencoAgenti(raccogli().sessioni)[tasti.scelta || 0]
    if (s) tasti.sessione = tasti.sessione === s.sigla ? null : s.sigla
    tasti.scorri = 0
  } else if (k === '\x1b[A') scorriLog(1)
  else if (k === '\x1b[B') scorriLog(-1)
  else if (k === '\x1b[5~') scorriLog(15)
  else if (k === '\x1b[6~') scorriLog(-15)
  else if (k === '\x1b[H' || k === '\x1b[1~') tasti.scorri = 1e9
  else if (k === '\x1b[F' || k === '\x1b[4~') tasti.scorri = 0
  else return false
  return true
}

// ── le finestre ──────────────────────────────────────────────────────────────
const BORDI = { s: ['┌', '─', '┐', '│', '└', '┘'], d: ['╔', '═', '╗', '║', '╚', '╝'] }
// Una finestra larga w e alta h (bordi compresi): il titolo nel bordo in alto col suo numero,
// a destra le informazioni; il piede nel bordo in basso. Torna h righe larghe esattamente w.
function finestra({ nome, numero, info = '', piede = '', w, h, righe = [], attiva = false, colore = CIANO }) {
  if (h < 2 || w < 8) return []
  const b = attiva ? BORDI.d : BORDI.s
  const cb = attiva ? colore : 240
  const kk = (s) => c(cb, s)
  const etichetta = attiva ? sf(colore, c(232, forte(` ${numero ? numero + ' ' : ''}${nome} `))) : ` ${numero ? scuro(numero) + ' ' : ''}${forte(c(252, nome))} `
  const inf = info ? ` ${info} ` : ''
  const spazio = w - 4 - lungo(etichetta) - lungo(inf)
  const testa = spazio >= 0 ? kk(b[0] + b[1]) + etichetta + kk(b[1].repeat(spazio)) + inf + kk(b[1] + b[2]) : kk(b[0] + b[1]) + etichetta + kk(b[1].repeat(Math.max(0, w - 4 - lungo(etichetta)))) + kk(b[1] + b[2])
  const dentro = w - 4
  const corpo = []
  for (let i = 0; i < h - 2; i++) corpo.push(kk(b[3]) + ' ' + pad(sano(righe[i] ?? ''), dentro) + `${E}0m ` + kk(b[3]))
  const pi = piede ? ` ${piede} ` : ''
  const spazioP = w - 3 - lungo(pi)
  const fondo = spazioP >= 0 ? kk(b[4]) + kk(b[1].repeat(spazioP)) + pi + kk(b[1] + b[5]) : kk(b[4] + b[1].repeat(w - 2) + b[5])
  return [testa, ...corpo, fondo]
}
const affianca = (...colonne) => colonne[0].map((_, i) => colonne.map((col) => col[i] ?? '').join(''))
// una barra a tutta larghezza su uno sfondo: dentro, ogni colore che si chiude rimette lo sfondo
const suFondo = (n, s, w) => {
  const f = `${E}48;5;${n}m`
  return f + pad(sano(s), w).replaceAll(`${E}49m`, f).replaceAll(`${E}0m`, `${E}0m${f}`) + `${E}0m`
}

// ── il disegno ───────────────────────────────────────────────────────────────
export function disegna({ W, H, giro, dati, sistema, server, git, sito, pubblici, storia, account, consumi, hosting, tasti }) {
  const adesso = Date.now()
  const gira = GIRA[giro % GIRA.length]
  const sessioni = dati.sessioni || []
  const cl = principale(sessioni, tasti.sessione) || dati.claude || {}
  const progettoDi = (s) => basename(s.radice || s.cwd || '?')
  const fuoco = tasti.fuoco || 'log'
  const L = Math.round(W * 0.58)
  const R = W - L
  const fermo = cl.stato === 'fermo' || cl.stato === 'chiusa'
  const aspetta = cl.stato === 'aspetta'

  // ── la barra del titolo ──
  const badge = cl.stato === 'chiusa' ? sf(240, forte(c(231, ' CHIUSA '))) : aspetta ? sf(ROSSO, forte(c(231, ' TI ASPETTA '))) : fermo ? sf(GIALLO, forte(c(232, ' TOCCA A TE '))) : sf(VERDE, forte(c(231, ` ${gira} LAVORA `)))
  const progetto = cl.cwd ? progettoDi(cl) : ''
  const sigla = sessioni.length > 1 && cl.sigla ? `  ${c(tinta(cl.sigla), '▌#' + cl.sigla)}${tasti.sessione ? grigio(' fissata') : ''}` : ''
  const orologio = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  // (11.11.2026, Alberto sulla barra di prima: «cambia tutto questo») niente più finti ─ □ ×, che
  // ripetevano quelli veri di Windows: la barra è fatta di schede, una per finestra, e quella in
  // primo piano è accesa; a destra lo stato, il progetto e l'ora
  const macchina = sistema?.acceso ? grigio(`pc su da ${durata(sistema.acceso)}`) + scuro('  │  ') : ''
  const schede = FINESTRE.map((f, i) => (f === (tasti.zoom || fuoco) ? sf(CIANO, c(232, forte(` ${i + 1} ${NOMI[f]} `))) : `${scuro(` ${i + 1}`)}${c(250, ` ${NOMI[f]} `)}`)).join('')
  const titolo = destra(`${sf(33, c(255, forte(' REGIA ')))}${schede}`, `${badge}  ${progetto ? forte(c(255, progetto)) : ''}${git?.ramo ? grigio(' · ') + c(141, git.ramo) : ''}${sigla}${scuro('  │  ')}${macchina}${c(252, orologio)} `, W)
  const righe = [suFondo(235, titolo, W)]

  // ── 1 CLAUDE: la richiesta, la nota, lo strumento in corso, il piano ──
  const dL = L - 4
  const rCl = []
  if (cl.richiesta?.testo && !cl.richiesta.testo.trimStart().startsWith('<')) {
    const r = aCapo(cl.richiesta.testo, dL - 12, 2)
    rCl.push(`${c(GIALLO, 'Alberto ►')}  ${r[0]}${r.length === 1 ? '  ' + scuro(fra(cl.richiesta.da) + ' fa') : ''}`)
    if (r[1]) rCl.push(`           ${r[1]}  ${scuro(fra(cl.richiesta.da) + ' fa')}`)
  }
  // la nota la scrive Claude a mano (diretta.mjs), e la firma con la sua sessione; una senza
  // firma (scritta da fuori) vale solo se è nata durante la richiesta in corso; dopo sei ore tace
  const diQuesta = (x) => x && (x.sessione ? x.sessione === cl.sigla : !cl.sigla || x.agg >= (cl.richiesta?.da || Infinity))
  const n = (dati.note || []).find((x) => x.sessione === cl.sigla) || (dati.note || []).find((x) => !x.sessione && diQuesta(x))
  rCl.push(`${c(CIANO, 'Claude  ►')}  ${n && adesso - (n.agg || 0) < 6 * 3600 * 1000 ? `${n.nota}  ${scuro(fra(n.agg) + ' fa')}` : grigio('—')}`)
  if (aspetta) rCl.push(`${c(ROSSO, 'Aspetta ►')}  ${forte(cl.avviso || 'una tua risposta')}  ${scuro(fra(cl.agg) + ' fa')}`)
  else if (fermo) {
    const r = cl.risposta
    const come = r?.secondi != null ? ` (${durata(r.secondi)}${r.strumenti ? `, ${r.strumenti} ${r.strumenti === 1 ? 'strumento' : 'strumenti'}` : ''})` : ''
    rCl.push(`${c(GIALLO, 'Fermo   ►')}  ${grigio(`${cl.stato === 'chiusa' ? 'sessione chiusa' : 'turno finito'} ${fra(cl.fineTurno || cl.chiusa || adesso)} fa${come}: tocca a te`)}`)
    if (r?.testo) for (const riga of aCapo(r.testo, dL - 11, 2)) rCl.push(`           ${c(252, riga)}`)
  } else if (cl.adesso) rCl.push(`${c(VERDE, 'Adesso  ►')}  ${c(STRUMENTO[cl.adesso.tool] ?? 81, pad(cl.adesso.tool, 10))} ${cl.adesso.testo}  ${scuro(fra(cl.adesso.da))}`)
  if (cl.sigla) rCl.push(`${c(250, 'Sessione►')}  ${c(tinta(cl.sigla), '▌#' + cl.sigla)} ${forte(progetto)} ${grigio(`· aperta da ${fra(cl.inizioSessione || adesso)} · ${cl.strumenti || 0} strumenti · ${(cl.file || []).length} file`)}${cl.errori ? ' ' + c(ROSSO, `· ${cl.errori} errori`) : ''}`)
  const p = dati.piani?.[cl.sigla] || (diQuesta(dati.piani?.['']) ? dati.piani[''] : null)
  if (p?.passi?.length && adesso - p.agg < 6 * 3600 * 1000) {
    let voci = p.passi.map((x, i) => (i < p.corrente ? c(VERDE, OK + ' ') + grigio(x) : i === p.corrente ? c(GIALLO, gira + ' ') + forte(x) : scuro('· ' + x)))
    const fatto = Math.min(p.corrente, p.passi.length)
    const testa = `${c(141, 'Piano   ►')}  ${barra(fatto / p.passi.length, 8, VERDE)} ${grigio(`${fatto}/${p.passi.length}`)}  `
    if (lungo(testa + voci.join(' → ')) > dL && fatto > 1) voci = [c(VERDE, `${OK} ${fatto} fatti`), ...voci.slice(fatto)]
    rCl.push(testa + voci.join(scuro(' → ')))
  }
  const infoCl = cl.turno && !fermo ? grigio(`${cl.turno}° strumento del turno`) : ''

  // ── 3 ACCOUNT: i limiti veri del piano e i token ──
  const dR = R - 4
  const rAc = []
  const a = account
  if (a) {
    const vecchi = a.preso ? adesso - a.preso : Infinity
    rAc.push(`${forte(c(255, 'Claude ' + a.piano))} ${grigio('·')} ${c(252, a.nome || '')} ${grigio('·')} ${vecchi > 3 * 3600 * 1000 ? c(GIALLO, `limiti di ${fra(a.preso)} fa`) : grigio(`limiti di ${fra(a.preso)} fa`)}`)
    const BW = Math.max(8, dR - 46)
    for (const b of a.barre) {
      const col = b.grave === 'critical' || b.pct >= 90 ? ROSSO : b.grave === 'warning' || b.pct >= 70 ? GIALLO : VERDE
      const reset = b.reset ? (b.reset > adesso ? grigio(`reset ${oraRoma(b.reset)} · fra ${durata((b.reset - adesso) / 1000)}`) : grigio('reset passato')) : scuro('non partita')
      rAc.push(`${pad(c(250, b.nome), 13)} ${barra(b.pct / 100, BW, col)} ${forte(c(col, padS(b.pct + '%', 4)))}  ${reset}`)
    }
    if (a.ripartizione?.length) rAc.push(`${pad(grigio('7 giorni'), 13)} ${a.ripartizione.map((r) => `${c(252, r.nome)} ${grigio(r.pct + '%')}`).join(scuro(' · '))}${a.extra && !a.extra.acceso ? scuro(`  · extra spento`) : ''}`)
  } else rAc.push(grigio('nessun dato in ~/.claude.json'))
  const co = consumi
  if (co) {
    const riga = (nome, s) => `${pad(grigio(nome), 13)} ${forte(c(255, padS(k(s.r), 5)))} ${grigio('risp')}  ${grigio('out')} ${c(CIANO, padS(k(s.o), 6))}  ${grigio('cache')} ${c(250, padS(k(s.cl), 6))} ${grigio('+')}${c(250, k(s.cs))}`
    rAc.push(riga('oggi', co.oggi))
    rAc.push(riga('7 giorni', co.settimana))
    const mod = Object.entries(co.settimana.m).sort((x, y) => y[1] - x[1]).slice(0, 4)
    if (mod.length) rAc.push(`${pad(grigio('modelli 7g'), 13)} ${mod.map(([m, o]) => `${c(m.startsWith('fable') ? 213 : m.startsWith('opus') ? 141 : m.startsWith('sonnet') ? 117 : 250, m)} ${grigio(k(o))}`).join(scuro(' · '))}`)
    // le ultime 24 ore, un'ora per colonna (due caratteri), alte quanto l'ora più piena
    const max = Math.max(1, ...co.ore.map((o) => o.o))
    const g = grafico(co.ore.map((o) => o.o / max), 48, (x) => (x > 0.75 ? 213 : x > 0.4 ? 141 : 75), 2)
    rAc.push(`${pad(grigio('out 24 ore'), 13)} ${g[0]}  ${grigio('max')} ${c(250, k(max) + '/h')}`)
    rAc.push(`${pad(scuro(`${oraRoma(adesso - 23 * 3600 * 1000).slice(0, 2)}h → ora`), 13)} ${g[1]}  ${scuro(`contati ${fra(co.agg)} fa`)}`)
    // ingrandita (z sull'ACCOUNT): i sette giorni uno per riga
    if (tasti.zoom === 'account' && co.giorni) {
      const maxG = Math.max(1, ...co.giorni.map((x) => x.o))
      rAc.push('')
      for (const x of co.giorni) {
        const nomeG = new Date(x.g + 'T12:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })
        const mod = Object.entries(x.m).sort((p, q) => q[1] - p[1]).map(([m, o]) => `${m} ${k(o)}`).join(' · ')
        rAc.push(`${pad(c(250, nomeG), 13)} ${barra(x.o / maxG, 30, 141)} ${grigio('out')} ${c(CIANO, padS(k(x.o), 6))}  ${forte(padS(k(x.r), 5))} ${grigio('risp')}  ${grigio('cache')} ${padS(k(x.cl), 6)}  ${scuro(mod)}`)
      }
    }
  }

  // ── 2 AGENTI ──
  const vera = (r) => (r?.testo && !r.testo.trimStart().startsWith('<') ? r.testo : '—')
  const agentiDi = (s) => (s.agenti || []).filter((x) => (x.fine ? adesso - x.fine < 10 * 60 * 1000 : adesso - x.da < 6 * 3600 * 1000)).sort((x, y) => x.da - y.da)
  const elenco = elencoAgenti(sessioni, adesso)
  const inCorso = elenco.filter((s) => s.stato === 'lavora' || s.stato === 'aspetta').length + elenco.reduce((m, s) => m + agentiDi(s).filter((x) => !x.fine).length, 0)
  const RW = Math.max(20, Math.min(46, Math.floor((dL - 50) * 0.55)))
  const rAg = []
  tasti.scelta = Math.min(tasti.scelta || 0, Math.max(0, elenco.length - 1))
  elenco.forEach((s, i) => {
    const st = s.stato === 'chiusa' ? scuro('chiusa    ') : s.stato === 'aspetta' ? sf(ROSSO, c(231, 'TI ASPETTA')) : s.stato === 'lavora' ? c(VERDE, pad(`${gira} lavora`, 10)) : c(GIALLO, 'tocca a te')
    const tempo = s.stato === 'lavora' || s.stato === 'aspetta' ? forte(`da ${fra(daQuando(s))}`) : s.stato === 'chiusa' ? scuro(`${fra(s.chiusa || s.agg)} fa`) : grigio(`ferma ${fra(s.fineTurno || s.agg)}`)
    const cosa = s.stato === 'aspetta' ? forte(corto(s.avviso, 60)) : s.stato === 'lavora' && s.adesso ? `${c(STRUMENTO[s.adesso.tool] ?? 81, s.adesso.tool)} ${grigio(corto(s.adesso.testo, 60))}` : grigio(corto(s.risposta?.testo, 70))
    const scelto = fuoco === 'agenti' && i === tasti.scelta
    const segno = scelto ? c(CIANO, '▸') : s === cl ? c(GIALLO, '►') : ' '
    const nomeP = scelto ? sf(237, forte(c(255, pad(progettoDi(s), 12)))) : forte(pad(progettoDi(s), 12))
    rAg.push(`${segno}${c(tinta(s.sigla), '▌')}${nomeP} ${scuro(pad('#' + s.sigla, 5))} ${st} ${pad(tempo, 11)} ${c(GIALLO, pad('«' + corto(vera(s.richiesta), RW - 2) + '»', RW))} ${cosa}`)
    for (const x of agentiDi(s)) {
      const sa = x.fine ? c(VERDE, pad(`${OK} finito`, 10)) : c(VERDE, pad(`${gira} lavora`, 10))
      const ta = x.fine ? grigio(`in ${durata((x.fine - x.da) / 1000)}`) : forte(`da ${fra(x.da)}`)
      const ca = !x.fine && x.adesso ? `${c(STRUMENTO[x.adesso.tool] ?? 81, x.adesso.tool)} ${grigio(corto(x.adesso.testo, 60))}` : x.fine ? grigio(corto(x.risposta, 70)) : scuro(x.sfondo ? 'in background' : '')
      rAg.push(`  ${scuro('└─')} ${pad(c(141, x.tipo || 'agente'), 16)} ${sa} ${pad(ta, 11)} ${c(250, pad('«' + corto(x.descr || '—', RW - 2) + '»', RW))} ${ca}`)
    }
  })
  if (!rAg.length) rAg.push(grigio('nessuna sessione nelle ultime 3 ore'))
  const infoAg = (inCorso ? c(VERDE, `${inCorso} al lavoro`) : grigio('nessuno al lavoro')) + grigio(` · ${elenco.length} ${elenco.length === 1 ? 'sessione' : 'sessioni'}`)

  // ── 4 SISTEMA: i grafici degli ultimi due minuti ──
  const rSi = []
  if (sistema) {
    const ram = 1 - sistema.ramLibera / sistema.ramTotale
    const GW = Math.max(10, dR - 16)
    const colC = (x) => (x > 0.85 ? ROSSO : x > 0.6 ? GIALLO : VERDE)
    const colR = (x) => (x > 0.9 ? ROSSO : x > 0.75 ? GIALLO : BLU)
    const gc = grafico(storia?.cpu || [sistema.cpu], GW, colC)
    const gr = grafico(storia?.ram || [ram], GW, colR)
    rSi.push(`${forte('CPU')}  ${gc[0]} ${forte(c(colC(sistema.cpu), padS(Math.round(sistema.cpu * 100) + '%', 4)))}`)
    rSi.push(`${scuro('2 min')}${gc[1]} ${grigio(`${sistema.cpus || ''}${sistema.cpus ? ' core' : ''}`)}`)
    rSi.push(`${forte('RAM')}  ${gr[0]} ${forte(c(colR(ram), padS(Math.round(ram * 100) + '%', 4)))}`)
    rSi.push(`${scuro('     ')}${gr[1]} ${grigio(gb(sistema.ramTotale - sistema.ramLibera).replace(' GB', ''))}${scuro('/' + gb(sistema.ramTotale).replace(' GB', 'G'))}`)
    rSi.push((sistema.dischi || []).map((d) => `${forte(d.nome)} ${barra(1 - d.liberi / d.totale, 6, 1 - d.liberi / d.totale > 0.9 ? ROSSO : 245)} ${grigio(gb(d.liberi) + ' liberi')}`).join('  ') + `  ${scuro('node ' + sistema.node)}`)
  }

  // ── 5 RETE: i server di casa, i siti, quello che Alberto ospita, git, la sessione ──
  const rRe = []
  const pallino = (su) => (su ? c(VERDE, '●') : c(ROSSO, '●'))
  if (server?.length) rRe.push(`${pad(grigio('casa'), 8)}${server.map((s) => `${pallino(s.su)} ${s.nome} ${scuro(s.su ? `${s.ms}ms` : 'spento')}`).join('  ')}`)
  const pub = pubblici || (sito ? [sito] : [])
  if (pub.length) rRe.push(`${pad(grigio('fuori'), 8)}${pub.map((x) => `${pallino(x.su)} ${x.nome} ${scuro(x.su ? `${x.codice}·${x.ms}ms` : x.codice || 'non risponde')}`).join('  ')}`)
  // hosting.json (tools/cruscotto/hosting.mjs): tutti i siti e le API di Alberto
  if (hosting?.controlli?.length) {
    // i server di sviluppo (vite, deutschland in prova…) si accendono solo quando Alberto lavora: non contano
    const tutti = hosting.controlli.filter((x) => x.gruppo !== 'sviluppo')
    const giu = tutti.filter((x) => !x.su)
    const vecchio = adesso - (hosting.agg || 0) > 5 * 60 * 1000
    rRe.push(`${pad(grigio('hosting'), 8)}${giu.length ? c(ROSSO, forte(`${giu.length} giù`)) + grigio(` su ${tutti.length}`) : c(VERDE, forte(`${OK} ${tutti.length}/${tutti.length} su`))}  ${(vecchio ? c(GIALLO, 'controllato ') : scuro('controllato ')) + (vecchio ? c(GIALLO, fra(hosting.agg) + ' fa') : scuro(fra(hosting.agg) + ' fa'))}`)
    // prima quelli giù, in rosso col codice; poi gli altri a pallini, finché ci stanno
    const voci = [...giu.map((x) => `${c(ROSSO, '●')} ${c(ROSSO, x.nome)} ${scuro(x.codice || x.nota || 'giù')}`), ...tutti.filter((x) => x.su).map((x) => `${c(VERDE, '●')} ${grigio(x.nome)}`)]
    let riga = ' '.repeat(8)
    for (const v of voci) {
      if (lungo(riga + v) + 2 > dR) {
        rRe.push(riga)
        riga = ' '.repeat(8)
        if (rRe.length >= 6) break
      }
      riga += v + '  '
    }
    if (riga.trim()) rRe.push(riga)
  }
  if (git?.ramo) {
    const cambi = git.cambiati ? c(GIALLO, `${git.cambiati} cambiati`) : c(VERDE, 'pulito')
    const sync = `${git.avanti ? c(GIALLO, `↑${git.avanti}`) : scuro('↑0')} ${git.indietro ? c(ROSSO, `↓${git.indietro}`) : scuro('↓0')}`
    rRe.push(`${pad(grigio('git'), 8)}${c(141, git.ramo)} ${sync}  ${cambi}  ${c(250, git.ultimo?.sha || '')} ${scuro(git.ultimo?.ct ? fra(git.ultimo.ct * 1000) + ' fa' : '')}`)
    rRe.push(`${' '.repeat(8)}${scuro(corto(git.ultimo?.msg || '', dR - 8))}`)
  }
  if (cl.sessione) {
    const conti = Object.entries(cl.conteggi || {}).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([t, m]) => `${c(STRUMENTO[t] ?? 81, t.replace(/^mcp__\w+__/, ''))} ${m}`).join(grigio(' · '))
    rRe.push(`${pad(grigio('strum.'), 8)}${conti}`)
    if (cl.file?.length) rRe.push(`${pad(grigio('file'), 8)}${cl.file.slice(0, 5).map((f, i) => (i ? grigio(basename(f)) : c(114, basename(f)))).join(scuro(' · '))}`)
  }

  // ── LAVORI: download, siti della macchina del tempo, barre qualsiasi ──
  const rLa = lavori(dati, W - 4, gira, adesso)

  // ── 7 FREELLM: i modelli gratis (FreeLLMAPI), chi sta rispondendo adesso ──
  // Normale: chi usa, lo stato, a sinistra le ultime richieste e a destra i fornitori di oggi.
  // Ingrandita: anche le 24 ore, i modelli di oggi, i tentativi saltati e le pause per i limiti.
  const fr = freellm()
  const okR = (r) => r.status === 'success' || r.status === 'ok'
  const oraS = (ms) => new Date(ms).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour12: false })
  const rigaFr = (r) => {
    const chiesto = r.requested_model && r.requested_model !== 'auto' ? grigio(corto(r.requested_model, 16) + ' → ') : ''
    const salti = r.saltati?.length ? c(GIALLO, ` ↷${r.saltati.length}`) : ''
    const errore = !okR(r) && r.error ? '  ' + c(ROSSO, corto(r.error, 70)) : ''
    return `${scuro(oraS(quando(r.created_at)))} ${okR(r) ? c(VERDE, OK) : c(ROSSO, '×')} ${chiesto}${c(CIANO, r.platform)}${grigio('/')}${c(255, corto(r.served_model || r.model_id, 44))}${salti}  ${grigio((r.latency_ms / 1000).toFixed(1) + 's')} ${scuro(`${k(r.input_tokens)}+${k(r.output_tokens)} tok`)}${r.client_agent && r.client_agent !== 'unknown' ? scuro(' · ' + corto(r.client_agent, 14)) : ''}${errore}`
  }
  const pannelloFr = (w, h, zoom) => {
    if (!fr) return [grigio('FreeLLMAPI non è installato (C:\\Users\\Alberto\\progetti-esterni\\freellmapi)')]
    if (fr.errore && !fr.ultime) return [c(ROSSO, '× ' + fr.errore)]
    const out = []
    const u = fr.ultime?.[0]
    out.push(
      u
        ? `${c(43, forte('Usa    ►'))}  ${forte(c(CIANO, u.platform))} ${grigio('/')} ${forte(c(255, u.served_model || u.model_id))}  ${okR(u) ? c(VERDE, OK + ' ok') : c(ROSSO, '× ' + u.status)}  ${grigio(`${(u.latency_ms / 1000).toFixed(1)}s · ${fra(quando(u.created_at))} fa`)}${u.requested_model ? grigio(`  · chiesto ${u.requested_model}`) : ''}`
        : `${c(43, forte('Usa    ►'))}  ${grigio('ancora nessuna richiesta')}`,
    )
    const forn = (fr.fornitori || []).map((f) => (!f.enabled ? scuro(f.platform) : f.status === 'healthy' ? c(VERDE, f.platform) : /error|invalid|unhealthy|fail|dead/i.test(f.status) ? c(ROSSO, f.platform) : c(250, f.platform))).join(' ')
    const t = fr.totali || {}
    const male = (t.n || 0) - (t.ok || 0)
    const stato = fr.acceso == null ? scuro('● …') : fr.acceso ? `${c(VERDE, '●')} ${forte(c(VERDE, 'acceso'))}` : `${c(ROSSO, '●')} ${forte(c(ROSSO, 'spento'))} ${grigio('(:freellm avvia)')}`
    out.push(`${c(250, 'Server ►')}  ${stato}  ${scuro('│')} ${grigio('fornitori')} ${forn || c(ROSSO, 'nessuno')}  ${scuro('│')} ${grigio('oggi')} ${forte(c(255, String(t.n || 0)))} ${grigio('richieste')} ${c(VERDE, OK + (t.ok || 0))} ${male ? c(ROSSO, '×' + male) : scuro('×0')} ${grigio(k((t.tin || 0) + (t.tout || 0)) + ' tok')}${fr.pause?.length ? `  ${scuro('│')} ${c(GIALLO, fr.pause.length + ' in pausa')}` : ''}`)
    if (!fr.ultime?.length && !zoom) return out
    // due colonne: le ultime richieste a sinistra, i fornitori (e ingrandita i modelli) a destra
    const dx = []
    const attivi = new Map((fr.fornitori || []).map((f) => [f.platform, { platform: f.platform, n: 0, ok: 0, ms: null }]))
    for (const p of fr.perFornitore || []) attivi.set(p.platform, p)
    const elencoF = [...attivi.values()].sort((a, b) => b.n - a.n)
    const maxF = Math.max(1, ...elencoF.map((p) => p.n))
    const WD = Math.min(52, Math.max(30, Math.floor(w * 0.36)))
    const BW = Math.max(4, WD - 32)
    const sec = (ms) => (ms ? (ms / 1000).toFixed(1) + 's' : '')
    dx.push(`${forte(c(252, 'FORNITORI'))} ${scuro('oggi')}`)
    for (const p of elencoF) dx.push(`${pad(c(CIANO, corto(p.platform, 11)), 11)} ${barra(p.n / maxF, BW, 43)} ${padS(String(p.n), 4)} ${c(VERDE, OK + (p.ok || 0))}${p.n - p.ok ? ' ' + c(ROSSO, '×' + (p.n - p.ok)) : ''} ${grigio(sec(p.ms))}`)
    if (zoom) {
      dx.push('', `${forte(c(252, 'MODELLI'))} ${scuro('oggi, i più usati')}`)
      for (const m of fr.perModello || []) dx.push(`${padS(String(m.n), 4)} ${c(CIANO, corto(m.platform, 8))}${grigio('/')}${c(255, corto(m.modello, WD - 24))} ${m.n - m.ok ? c(ROSSO, '×' + (m.n - m.ok)) : c(VERDE, OK)} ${grigio(sec(m.ms))}`)
      if (fr.pause?.length) {
        dx.push('', `${forte(c(GIALLO, 'IN PAUSA'))} ${scuro('limite raggiunto')}`)
        for (const x of fr.pause.slice(0, 8)) dx.push(`${c(GIALLO, corto(`${x.platform}/${x.model_id}`, WD - 14))} ${grigio('fino ' + oraRoma(x.fino))}`)
      }
      dx.push('', scuro(`${fr.sempre} richieste in tutto · letti ${fra(fr.agg)} fa`))
    }
    const sx = []
    if (zoom) {
      const maxO = Math.max(1, ...fr.ore.map((o) => o.n))
      const g = grafico(fr.ore.map((o) => o.n / maxO), 48, (x) => (x > 0.75 ? 43 : x > 0.35 ? 37 : 30), 2)
      sx.push(`${pad(grigio('24 ore'), 9)}${g[0]}  ${grigio('max')} ${c(250, maxO + '/h')}`)
      sx.push(`${pad(scuro(`${oraRoma(adesso - 23 * 3600 * 1000).slice(0, 2)}h→ora`), 9)}${g[1]}`)
      sx.push('')
    }
    sx.push(`${forte(c(252, 'ULTIME RICHIESTE'))} ${scuro('ora · esito · fornitore/modello · tempo · token' + (zoom ? ' · ↷ fornitori saltati' : ''))}`)
    const posto = h - out.length
    for (const r of fr.ultime) {
      if (sx.length >= posto) break
      sx.push(rigaFr(r))
      if (zoom) for (const s of r.saltati || []) if (sx.length < posto) sx.push(`         ${c(GIALLO, '↷')} ${grigio(`saltato ${s.platform}/${corto(s.model_id, 40)}: ${s.outcome}`)}${s.error_summary ? scuro(' · ' + corto(s.error_summary, 60)) : ''}`)
    }
    const WS = w - WD - 3
    for (let i = 0; i < Math.max(sx.length, dx.length) && out.length < h; i++) out.push(`${pad(sx[i] ?? '', WS)} ${scuro('│')} ${dx[i] ?? ''}`)
    return out
  }
  const infoFr = fr ? grigio(INDIRIZZO.replace('http://', '') + '/v1') + (fr.acceso ? '' : ' ' + c(ROSSO, 'spento')) : ''

  // ── 6 LOG ──
  const filtro = tasti.filtro
  let log = dati.righe.map((r) => {
    const [ora, tutto = '', ...resto] = r.split('\t')
    const [chi, sess] = tutto.split('#')
    return { ora, chi, sess, testo: resto.join(' ') }
  })
  // un errore comincia con ×; per i lavori anche una riga che dice «errore», «fallito»…, ma non
  // per Claude e Alberto, che scrivono «errori» anche solo per dire cosa fanno
  const sbagliato = (l) => /^\s*[×✗⚠!]/.test(l.testo) || (!l.chi.startsWith('claude') && l.chi !== 'alberto' && /errore|error|fallit|non risponde/i.test(l.testo))
  if (tasti.sessione) log = log.filter((l) => !l.sess || l.sess === tasti.sessione)
  if (filtro === 'claude') log = log.filter((l) => l.chi.startsWith('claude') || l.chi === 'alberto')
  else if (filtro === 'errori') log = log.filter(sbagliato)
  else if (filtro === 'lavori') log = log.filter((l) => !l.chi.startsWith('claude') && l.chi !== 'alberto')
  const cerca = tasti.cerca?.toLowerCase()
  if (cerca) log = log.filter((l) => `${l.chi} ${l.testo}`.toLowerCase().includes(cerca))
  const filtri = FILTRI.map((f) => (f === filtro ? sf(CIANO, c(232, ` ${f} `)) : grigio(` ${f} `))).join('')
  const infoLog = `${filtri}${cerca ? '  ' + sf(58, c(230, ` /${tasti.cerca} `)) : ''}${tasti.pausa ? '  ' + sf(GIALLO, c(232, ' PAUSA ')) : ''}`
  const rigaLog = (l, segni) => {
    let testo = l.testo.replace(/✗/g, '×').replace(/⚠/g, '!')
    if (cerca) {
      const i = testo.toLowerCase().indexOf(cerca)
      if (i >= 0) testo = testo.slice(0, i) + sf(58, c(230, testo.slice(i, i + cerca.length))) + testo.slice(i + cerca.length)
    }
    if (/^\s*(√|✓|ok\b)/.test(l.testo)) testo = c(VERDE, testo.replace(/✓/g, OK))
    else if (sbagliato(l)) testo = c(ROSSO, testo)
    else if (l.chi === 'alberto') testo = c(GIALLO, testo)
    const chi = l.chi.startsWith('claude-') ? l.chi.slice(7).replace(/^mcp__\w+__/, '') : l.chi
    const segno = segni ? (l.sess ? c(tinta(l.sess), '▌') : ' ') : ''
    return `${segno}${scuro(l.ora || '')} ${pad(c(colore(l.chi), corto(chi, 13)), 13)} ${testo}`
  }

  // ── l'aiuto ──
  const aiuto = () => {
    const t = (x) => sf(238, c(255, ` ${x} `))
    const out = [
      `${forte(c(255, 'TASTI'))}`,
      `${t('Tab')} ${t('⇧Tab')} ${t('1')}…${t('7')} finestra in primo piano   ${t('z')} ingrandisce   ${t('Esc')} toglie zoom, ricerca, sessione fissata`,
      `${t('↑')} ${t('↓')} ${t('PgSu')} ${t('PgGiù')} ${t('Home')} ${t('Fine')} scorrono il LOG   ·   sugli AGENTI ${t('↑')} ${t('↓')} scelgono e ${t('Invio')} fissa la sessione`,
      `${t('a')} ${t('c')} ${t('l')} ${t('e')} filtro (o ${t('f')} il prossimo)   ${t('/')} cerca   ${t('s')} sessione   ${t('p')} pausa   ${t('r')} rimisura   ${t('x')} pulisci   ${t('?')} aiuto   ${t('q')} esci`,
      '',
      `${forte(c(255, 'COMANDI'))} ${grigio('dopo')} ${t(':')}  ${grigio('Tab completa, ↑↓ ripescano quelli di prima, Invio esegue, Esc chiude')}`,
      ...COMANDI.map(([nome, alias, args, cosa]) => `  ${c(CIANO, pad(':' + nome, 10))} ${pad(grigio(args), 58)} ${c(252, cosa)}${alias.length ? scuro('   ' + alias.map((x) => ':' + x).join(' ')) : ''}`),
      '',
      `${grigio('Esempi:')} ${c(CIANO, ':apri uso')} ${grigio('i limiti su claude.ai ·')} ${c(CIANO, ':cerca push')} ${grigio('·')} ${c(CIANO, ':s 8120')} ${grigio('·')} ${c(CIANO, ':zoom log')} ${grigio('·')} ${c(CIANO, ':nota provo il telefono')}`,
    ]
    return out
  }

  // ── la riga in fondo: il comando che si scrive, un avviso, o i tasti ──
  let fondo
  if (tasti.comando != null) {
    const pr = tasti.prompt || ':'
    const nome = tasti.comando.split(' ')[0]
    const consigli = pr === ':' ? (tasti.comando.includes(' ') ? (trova(nome) ? grigio(`${trova(nome)[2]}  ·  ${trova(nome)[3]}`) : c(ROSSO, 'comando sconosciuto')) : COMANDI.filter(([m]) => m.startsWith(nome)).map(([m]) => c(CIANO, m)).join(grigio('  '))) : grigio('cerca nel LOG · Invio · Esc')
    fondo = destra(`${sf(CIANO, c(232, forte(` ${pr} `)))} ${c(255, tasti.comando)}${c(CIANO, giro % 4 < 2 ? '█' : ' ')}`, consigli + ' ', W)
  } else if (tasti.messaggio && adesso - tasti.messaggio.t < 5000) {
    fondo = ` ${tasti.messaggio.errore ? c(ROSSO, '× ' + tasti.messaggio.testo) : c(VERDE, OK + ' ' + tasti.messaggio.testo)}`
  } else {
    const t = (x, s) => `${sf(238, c(255, ` ${x} `))} ${grigio(s)}`
    fondo = destra(' ' + [t(':', 'comando'), t('/', 'cerca'), t('Tab', 'finestra'), t('z', 'zoom'), t('?', 'aiuto'), t('q', 'esci')].join('  '), grigio(`${NOMI[fuoco]} in primo piano${tasti.sessione ? ` · #${tasti.sessione} fissata` : ''} `), W)
  }

  // ── la disposizione ──
  const corpoH = H - 2
  const fin = (nome, opz) => finestra({ nome: NOMI[nome], numero: FINESTRE.indexOf(nome) + 1 || '', attiva: fuoco === nome || tasti.zoom === nome, ...opz })
  const logFinestra = (w, h) => {
    if (tasti.aiuto) return finestra({ nome: 'AIUTO', w, h, righe: aiuto(), attiva: true, colore: GIALLO, info: grigio('Esc o ? per chiudere') })
    const spazio = h - 2
    const fino = Math.max(0, log.length - Math.min(tasti.scorri || 0, Math.max(0, log.length - spazio)))
    if ((tasti.scorri || 0) > log.length - spazio) tasti.scorri = Math.max(0, log.length - spazio)
    const visto = log.slice(Math.max(0, fino - spazio), fino)
    const segni = new Set(visto.map((l) => l.sess).filter(Boolean)).size > 1
    const piede = grigio(`${log.length ? `${Math.max(1, fino - spazio + 1)}–${fino} di ${log.length}` : 'vuoto'}${tasti.scorri ? ` · ↑ ${tasti.scorri} indietro (Fine torna giù)` : ''}${tasti.sessione ? ` · #${tasti.sessione}` : ''}`)
    return fin('log', { w, h, righe: visto.map((l) => rigaLog(l, segni)), info: infoLog, piede })
  }
  const opzioni = {
    claude: (w, h) => fin('claude', { w, h, righe: rCl, info: infoCl, colore: aspetta ? ROSSO : fermo ? GIALLO : VERDE }),
    agenti: (w, h) => fin('agenti', { w, h, righe: rAg, info: infoAg, piede: fuoco === 'agenti' ? grigio('↑↓ sceglie · Invio fissa') : '' }),
    account: (w, h) => fin('account', { w, h, righe: rAc, info: grigio(':apri uso'), colore: 213 }),
    sistema: (w, h) => fin('sistema', { w, h, righe: rSi, info: grigio(sistema ? `${Math.round(sistema.cpu * 100)}% cpu` : '') }),
    rete: (w, h) => fin('rete', { w, h, righe: rRe }),
    log: logFinestra,
    freellm: (w, h) => fin('freellm', { w, h, righe: pannelloFr(w - 4, h - 2, tasti.zoom === 'freellm'), info: infoFr, piede: grigio(':freellm avvia|ferma|chiedi · :apri freellm'), colore: 43 }),
  }

  if (tasti.zoom && opzioni[tasti.zoom]) righe.push(...opzioni[tasti.zoom](W, corpoH))
  else {
    // in alto CLAUDE | ACCOUNT, poi AGENTI | SISTEMA + RETE, i LAVORI se ci sono, sotto il LOG
    const hAlto = Math.max(rCl.length, rAc.length) + 2
    const hSi = rSi.length + 2
    const hRe = rRe.length + 2
    const hLa = rLa.length ? rLa.length + 2 : 0
    const minLog = 8
    let hMezzo = Math.max(Math.min(rAg.length + 2, 14), hSi + hRe)
    hMezzo = Math.min(hMezzo, Math.max(hSi + 3, corpoH - hAlto - hLa - minLog))
    righe.push(...affianca(opzioni.claude(L, hAlto), opzioni.account(R, hAlto)))
    righe.push(...affianca(opzioni.agenti(L, hMezzo), [...opzioni.sistema(R, hSi), ...opzioni.rete(R, hMezzo - hSi)]))
    if (hLa) righe.push(...finestra({ nome: 'LAVORI', w: W, h: hLa, righe: rLa, colore: 141, info: grigio(`${rLa.length} in corso o finiti da poco`) }))
    // FREELLM sopra il LOG: le righe che servono (al massimo 5 richieste), lasciando al LOG le sue 8
    if (fr) {
      const voluto = 2 + (fr.ultime?.length ? 1 + Math.min(5, Math.max(fr.ultime.length, (fr.fornitori || []).length)) : 0)
      const hFr = Math.min(voluto + 2, corpoH - (righe.length - 1) - minLog)
      if (hFr >= 3) righe.push(...opzioni.freellm(W, hFr))
    }
    righe.push(...logFinestra(W, Math.max(3, corpoH - (righe.length - 1))))
  }
  while (righe.length < H - 1) righe.push('')
  righe.length = H - 1
  righe.push(suFondo(235, fondo, W))
  return righe.map((r) => taglia(r, W) + `${E}0m${E}K`).join('\n')
}

// Le barre dei lavori: download, i siti della macchina del tempo, barre qualsiasi (diretta.mjs --barra)
function lavori(dati, w, gira, adesso) {
  const out = []
  const NOME = 22
  const BAR = Math.max(16, Math.min(44, w - 90))
  const download = dati.stati.filter((s) => s.tipo === 'download')
  const siti = dati.stati.filter((s) => s.tipo === 'sito').sort((a, b) => (a.ordine ?? 9) - (b.ordine ?? 9))
  const barre = dati.stati.filter((s) => s.tipo === 'barra' && (!s.fine || adesso - s.agg < 10 * 60 * 1000))
  const recente = (s) => !s.fine || adesso - s.agg < 30 * 60 * 1000
  for (const d of download.filter(recente)) {
    const ferma = !d.fine && !vivo(d.pid)
    out.push(`${pad(c(BLU, d.nome), NOME)} ${barra(d.fine ? 1 : d.pct / 100, BAR, BLU)} ${pad(`${Math.round(d.fine ? 100 : d.pct || 0)}%`, 5)} ${d.fine ? c(VERDE, OK + ' ') + grigio(d.testo || '') : ferma ? c(ROSSO, '× fermo') : gira + ' ' + (d.testo || '')}`)
  }
  for (const b of barre) {
    const f = b.totale ? b.fatte / b.totale : 0
    out.push(`${pad(c(141, b.nome), NOME)} ${barra(f, BAR, 141)} ${pad(`${Math.round(f * 100)}%`, 5)} ${grigio(`${b.fatte}/${b.totale}`)} ${b.fine ? c(VERDE, OK) : gira} ${grigio(b.testo || '')}`)
  }
  const sitiVivi = siti.filter(recente)
  // un giro della macchina del tempo tutto finito: una riga sola
  if (sitiVivi.length && sitiVivi.every((s) => s.fine)) {
    const fatte = sitiVivi.reduce((n, s) => n + (s.fatte || 0), 0)
    const errori = sitiVivi.reduce((n, s) => n + (s.errori || 0), 0)
    const ultimo = Math.max(...sitiVivi.map((s) => s.agg || 0))
    out.push(`${pad(forte('MACCHINA DEL TEMPO'), NOME)} ${barra(1, BAR, VERDE)} ${c(VERDE, OK + ' finito')} ${grigio(`${sitiVivi.map((s) => s.nome).join(' · ')} · ${fatte} ${sitiVivi[0].fase || ''}`)}${errori ? ' ' + c(ROSSO, `×${errori}`) : ''} ${scuro(fra(ultimo) + ' fa')}`)
  } else if (sitiVivi.length) {
    let fatteTot = 0
    let totTot = 0
    let fine = 0
    for (const s of sitiVivi) {
      const col = colore(s.id)
      const ferma = !s.fine && !vivo(s.pid)
      const fr = s.totale ? s.fatte / s.totale : s.fine ? 1 : 0
      fatteTot += s.fatte || 0
      totTot += s.totale || 0
      const media = s.tempi?.length ? s.tempi.reduce((a, b) => a + b, 0) / s.tempi.length : NaN
      const resta = s.fine ? 0 : media * ((s.totale || 0) - (s.fatte || 0))
      // un sito che lavora senza ancora una media: la fine non si sa
      fine = Number.isNaN(fine) || (!s.fine && !Number.isFinite(resta)) ? NaN : Math.max(fine, resta || 0)
      const conti = `${pad(`${s.fatte || 0}/${s.totale || 0}`, 8)} ${c(VERDE, `${OK}${s.ok || 0}`)} ${s.errori ? c(ROSSO, `×${s.errori}`) : scuro('×0')}`
      const tempo = s.fine ? c(VERDE, 'finito') : ferma ? c(ROSSO, 'fermo') : `${grigio('~')}${durata(media)}${grigio('/v · resta')} ${durata(resta)}`
      out.push(`${pad(c(col, s.nome), NOME)} ${barra(fr, BAR, col)} ${pad(`${Math.round(fr * 100)}%`, 5)} ${pad(conti, 20)} ${pad(grigio(s.fase || ''), 9)} ${tempo}`)
      if (s.corrente && !s.fine) out.push(`${' '.repeat(NOME)} ${c(col, ferma ? '×' : gira)} ${grigio(s.corrente.data || '')} ${c(250, s.corrente.short || '')} ${s.corrente.passo ? c(col, s.corrente.passo) : ''} ${grigio(s.corrente.da ? fra(s.corrente.da) : '')} ${scuro(s.corrente.msg ? '· ' + s.corrente.msg : '')}`)
    }
    if (sitiVivi.length > 1) {
      const fr = totTot ? fatteTot / totTot : 0
      out.push(`${pad(forte('TOTALE'), NOME)} ${barra(fr, BAR, 255)} ${pad(`${Math.round(fr * 100)}%`, 5)} ${pad(`${fatteTot}/${totTot}`, 20)} ${pad('', 9)} ${grigio('fine fra')} ${forte(durata(fine))}`)
    }
  }
  return out
}
