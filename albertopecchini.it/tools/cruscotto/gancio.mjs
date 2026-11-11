// Il gancio di Claude Code per la regia (3.11.2026, Alberto: «impara per qualsiasi task di
// aprirlo»). Lo lanciano i ganci di ~/.claude/settings.json, in qualsiasi progetto, in
// background (async): legge l'evento da stdin e lo scrive nella diretta, senza mai bloccare
// e senza mai fallire (esce sempre con 0).
//
//   SessionStart, UserPromptSubmit   apre la regia se è chiusa; la richiesta di Alberto in cima
//   PreToolUse                       cosa sta facendo Claude adesso, e una riga nel log
//   PostToolUseFailure               lo strumento che è andato storto
//   Notification                     Claude aspetta Alberto (un permesso, una risposta): suona
//   Stop                             Claude ha finito il turno: tocca ad Alberto, suona; l'inizio
//                                    della risposta, quanto è durato il turno e con quanti strumenti
//   SessionEnd                       la sessione è chiusa: la regia la toglie dalle altre
//   SubagentStart, SubagentStop      gli agenti che la sessione manda a lavorare: cosa gli è stato
//                                    chiesto, da quanto lavorano, cosa fanno, quando finiscono

import { execFileSync } from 'node:child_process'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, readdirSync, rmSync, openSync, readSync, fstatSync, closeSync } from 'node:fs'
import { CARTELLA, log, leggi, scrivi } from './diretta.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
// Una cartella per sessione: i ganci sono di tutto l'utente, e le altre sessioni di Claude aperte
// insieme si sovrascrivevano lo stato e i conti (3.11.2026). Nel log la sessione è il «#xxxx»
// dopo chi scrive, perché la regia dia a ognuna il suo colore.
const SESSIONI = join(CARTELLA, 'sessioni')
mkdirSync(SESSIONI, { recursive: true })
const sigla = (id) => String(id || 'anon').replace(/[^a-z0-9]/gi, '').slice(0, 4)

let testo = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (d) => (testo += d))
process.stdin.on('end', () => {
  try {
    gestisci(JSON.parse(testo || '{}'))
  } catch (e) {
    // CRUSCOTTO_DEBUG=1 per vedere cosa non va; ai ganci veri non si risponde mai con un errore
    if (process.env.CRUSCOTTO_DEBUG) console.error(e)
  }
  process.exit(0)
})
setTimeout(() => process.exit(0), 12000).unref()

const corto = (s, n = 90) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
const file = (p) => (p ? `${basename(dirname(p))}/${basename(p)}` : '')

// in una riga, cosa fa lo strumento
function descrivi(tool, i = {}) {
  if (/^(Bash|PowerShell)$/.test(tool)) return corto(i.description || i.command)
  if (/^(Read|Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) return file(i.file_path || i.notebook_path)
  if (tool === 'Grep') return `cerca «${corto(i.pattern, 50)}»${i.path ? ' in ' + basename(i.path) : ''}`
  if (tool === 'Glob') return `trova ${corto(i.pattern, 60)}`
  if (tool === 'Agent' || tool === 'Task') return corto(i.description || i.prompt)
  if (tool === 'Skill') return corto(i.skill)
  if (tool === 'WebFetch') return corto(i.url)
  if (tool === 'WebSearch') return `cerca sul web «${corto(i.query, 60)}»`
  if (tool === 'ToolSearch') return corto(i.query)
  if (tool === 'Artifact') return corto(`${i.action || 'pubblica'} ${i.file_path || i.url || ''}`)
  if (tool === 'TaskStop') return corto(i.task_id)
  if (tool.startsWith('mcp__')) return corto(tool.split('__').slice(1).join(' · '))
  return corto(Object.values(i).find((x) => typeof x === 'string') || '')
}

// Quello che ha scritto davvero Alberto: via i pezzi che aggiunge l'editor (<ide_…>) e i
// promemoria, il testo incollato resta (senza il suo <pasted_content>); una notifica dei lavori in
// background (<task-notification>) o un comando non sono suoi e tornano vuoti
const VIA = /<(system-reminder|ide_[a-z_]+)[^>]*>[\s\S]*?<\/\1>/g
export function pulito(t) {
  const s = String(t ?? '')
  if (/^\s*<task-notification/.test(s)) return ''
  const r = s.replace(VIA, ' ').replace(/<\/?pasted_content[^>]*>/g, ' ').trim()
  return r.startsWith('<') ? '' : r
}

// L'ultimo messaggio scritto, dalla coda della trascrizione (JSONL): «assistant» la risposta di
// Claude, «user» la richiesta di Alberto (non i risultati degli strumenti, non i pezzi <…> che
// aggiunge l'editor, non il riassunto della compattazione)
function ultimo(trascrizione, tipo, kb = 512) {
  if (!trascrizione) return null
  const fd = openSync(trascrizione, 'r')
  try {
    const size = fstatSync(fd).size
    const quanto = Math.min(size, kb * 1024)
    const buf = Buffer.alloc(quanto)
    readSync(fd, buf, 0, quanto, size - quanto)
    for (const riga of buf.toString('utf8').split('\n').reverse()) {
      if (!riga.includes(`"${tipo}"`) && !(tipo === 'user' && riga.includes('"queued_command"'))) continue
      let m
      try {
        m = JSON.parse(riga)
      } catch {
        continue
      }
      // i messaggi che Alberto manda a lavoro in corso stanno in un «queued_command»
      const coda = tipo === 'user' && m.attachment?.type === 'queued_command'
      if (!coda && (m.type !== tipo || m.isMeta || m.isCompactSummary)) continue
      const c = coda ? m.attachment.prompt : m.message?.content
      const pezzi = typeof c === 'string' ? [c] : Array.isArray(c) ? c.filter((p) => p.type === 'text').map((p) => p.text) : []
      const testo = tipo === 'user' ? pezzi.map(pulito).filter(Boolean).join(' ') : pezzi.filter((p) => !p.trimStart().startsWith('<')).join(' ')
      if (testo.trim()) return { testo, da: Date.parse(m.timestamp) || Date.now() }
    }
    return null
  } finally {
    closeSync(fd)
  }
}

// le sessioni ferme da più di tre giorni non servono più a nessuno
function pulisci() {
  for (const f of readdirSync(SESSIONI)) {
    const s = leggi(join(SESSIONI, f))
    if (!s || Date.now() - (s.agg || 0) > 3 * 86400 * 1000) rmSync(join(SESSIONI, f), { force: true })
  }
}

// la regia è aperta? se no la si apre (non più di una volta ogni 20 secondi). Dall'11.11.2026 solo
// se Alberto l'ha chiesto («crea icona desktop per aprirla manualmente e disattiva avvio
// automatico»): impostazioni.json { "apriDaSola": true }, o «:automatica si» nella regia. Di solito
// la si apre dall'icona «Regia di Claude» sul desktop; i ganci scrivono lo stesso tutto il resto.
function apri(s) {
  if (!leggi(join(CARTELLA, 'impostazioni.json'), {})?.apriDaSola) return
  const f = leggi(join(CARTELLA, 'finestra.json'))
  if (f && Date.now() - f.battito < 5000) return
  if (Date.now() - (s.apertura || 0) < 20000) return
  s.apertura = Date.now()
  // La finestra la fa nascere WMI (Win32_Process.Create), fuori dall'albero di questo processo:
  // un figlio «detached» del gancio moriva con lui, perché Claude Code chiude tutto il gruppo
  // del gancio quando finisce (3.11.2026)
  const ps1 = join(QUI, 'cruscotto.ps1')
  const comando = `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${ps1}"`
  try {
    const r = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `(Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${comando.replace(/'/g, "''")}' }).ReturnValue`], { timeout: 9000, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    log('regia', String(r).trim() === '0' ? 'apro la regia (era chiusa)' : `× la regia non si apre (WMI ${String(r).trim()})`)
  } catch (e) {
    log('regia', `× la regia non si apre: ${corto(e.message, 120)}`)
  }
}

function gestisci(e) {
  const evento = e.hook_event_name || ''
  const id = sigla(e.session_id)
  const FILE = join(SESSIONI, `${id}.json`)
  const s = leggi(FILE, null) || { sessione: e.session_id, sigla: id, inizioSessione: Date.now(), conteggi: {}, file: [], errori: 0, strumenti: 0 }
  const adesso = Date.now()
  s.cwd = e.cwd || s.cwd
  // il progetto è la cartella in cui la sessione è nata: i comandi poi la portano altrove
  s.radice ||= s.cwd
  s.agg = adesso
  s.conteggi ||= {}
  s.file ||= []
  const scrive = (chi, testo) => log(`${chi}#${id}`, testo)
  // una sessione che la regia vede per la prima volta a metà (ganci nuovi, compattazione): la
  // richiesta di Alberto la si ripesca dalla trascrizione, una volta sola
  // (e così si ripara una richiesta che era una notifica <task-notification> scambiata per sua)
  const finta = s.richiesta?.testo != null && !pulito(s.richiesta.testo)
  if (((!s.richiesta && !s.cercata) || finta) && evento !== 'UserPromptSubmit') {
    s.cercata = true
    try {
      const u = ultimo(e.transcript_path, 'user', 24 * 1024)
      s.richiesta = u ? { testo: corto(u.testo, 400), da: u.da } : null
    } catch {}
  }

  if (evento === 'SessionStart') {
    apri(s)
    pulisci()
    // «resume» e «compact» riprendono la stessa sessione: non è nuova
    Object.assign(s, { stato: s.stato === 'chiusa' ? 'fermo' : s.stato || 'fermo' })
    scrive('alberto', e.source === 'compact' ? 'la conversazione si è compattata e riprende' : e.source === 'resume' ? `riprendo la sessione in ${basename(s.cwd || '')}` : `sessione nuova in ${basename(s.cwd || '')}`)
  } else if (evento === 'UserPromptSubmit') {
    apri(s)
    // da quanto lavora: dal primo messaggio del giro, non da quelli mandati a lavoro in corso
    if (s.stato !== 'lavora') s.inizioLavoro = adesso
    const prompt = String(e.prompt || '')
    // le notifiche dei lavori in background (<task-notification>…) arrivano come «richieste», ma
    // non le ha scritte Alberto: la sua richiesta resta quella di prima (9.11.2026)
    const suo = pulito(prompt)
    if (!suo) {
      if (!s.richiesta?.testo || !pulito(s.richiesta.testo)) {
        try {
          const u = ultimo(e.transcript_path, 'user', 24 * 1024)
          s.richiesta = u ? { testo: corto(u.testo, 400), da: u.da } : null
        } catch {}
      }
      Object.assign(s, { stato: 'lavora', avviso: null })
      const sommario = prompt.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] || prompt.match(/<event>([\s\S]*?)<\/event>/)?.[1] || 'notifica'
      scrive('claude', `notifica: ${corto(sommario, 200)}`)
    } else {
      Object.assign(s, { stato: 'lavora', richiesta: { testo: corto(suo, 400), da: adesso }, adesso: null, avviso: null, turno: 0 })
      scrive('alberto', corto(suo, 300))
    }
  } else if (evento === 'PreToolUse') {
    const tool = e.tool_name || '?'
    const cosa = descrivi(tool, e.tool_input)
    if (s.stato !== 'lavora' || !s.inizioLavoro) s.inizioLavoro = adesso
    s.agenti ||= []
    // uno strumento di un agente: va sotto l'agente, la sessione resta su quello che fa lei
    const ag = e.agent_id && s.agenti.find((a) => a.id === e.agent_id)
    if (ag) {
      ag.adesso = { tool, testo: cosa, da: adesso }
      ag.strumenti = (ag.strumenti || 0) + 1
      Object.assign(s, { stato: 'lavora', avviso: null, strumenti: (s.strumenti || 0) + 1 })
    } else Object.assign(s, { stato: 'lavora', adesso: { tool, testo: cosa, da: adesso }, avviso: null, strumenti: (s.strumenti || 0) + 1, turno: (s.turno || 0) + 1 })
    // un agente che parte: cosa gli è stato chiesto e da quando (l'id arriva con SubagentStart)
    if ((tool === 'Agent' || tool === 'Task') && !ag) {
      const i = e.tool_input || {}
      s.agenti = [{ tipo: i.subagent_type || 'general-purpose', descr: corto(i.description || i.prompt, 120), prompt: corto(i.prompt, 300), da: adesso, sfondo: !!i.run_in_background }, ...s.agenti].slice(0, 12)
    }
    s.conteggi[tool] = (s.conteggi[tool] || 0) + 1
    const f = e.tool_input?.file_path
    if (f && /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) s.file = [f, ...s.file.filter((x) => x !== f)].slice(0, 40)
    scrive(`claude-${tool}`, ag ? `[${ag.tipo}] ${cosa}` : cosa)
  } else if (evento === 'SubagentStart') {
    s.agenti ||= []
    // si lega al più vecchio agente chiesto e non ancora partito, dello stesso tipo se c'è
    const liberi = s.agenti.filter((a) => !a.id && !a.fine)
    const a = liberi.reverse().find((x) => x.tipo === e.agent_type) || liberi[0]
    if (a) Object.assign(a, { id: e.agent_id, tipo: e.agent_type || a.tipo, partito: adesso })
    else s.agenti = [{ id: e.agent_id, tipo: e.agent_type || 'agente', descr: e.agent_type || 'agente', da: adesso, partito: adesso }, ...s.agenti].slice(0, 12)
    scrive('claude', `parte l'agente ${e.agent_type || ''}${a?.descr ? ': ' + a.descr : ''}`)
  } else if (evento === 'SubagentStop') {
    s.agenti ||= []
    const a = s.agenti.find((x) => x.id === e.agent_id) || s.agenti.filter((x) => !x.fine).at(-1)
    if (a) Object.assign(a, { fine: adesso, adesso: null, risposta: corto(e.last_assistant_message, 200) })
    const quanto = a ? Math.round((adesso - a.da) / 1000) : null
    scrive('claude', `√ l'agente ${a?.tipo || e.agent_type || ''} ha finito${quanto != null ? ` in ${quanto < 60 ? quanto + 's' : Math.floor(quanto / 60) + 'm ' + String(quanto % 60).padStart(2, '0') + 's'}` : ''}${a?.descr ? ': ' + a.descr : ''}`)
  } else if (evento === 'PostToolUseFailure') {
    s.errori = (s.errori || 0) + 1
    scrive(`claude-${e.tool_name || '?'}`, `× ${corto(e.error || e.tool_response?.error || 'non è andato', 200)}`)
  } else if (evento === 'Notification') {
    Object.assign(s, { stato: 'aspetta', avviso: corto(e.message, 160), suona: (s.suona || 0) + 1 })
    scrive('alberto', `⚠ ${corto(e.message, 200)}`)
  } else if (evento === 'Stop') {
    let testo = e.last_assistant_message || ''
    try {
      testo ||= ultimo(e.transcript_path, 'assistant')?.testo || ''
    } catch {}
    const inizio = s.inizioLavoro || s.richiesta?.da
    const durata = inizio ? Math.round((adesso - inizio) / 1000) : null
    Object.assign(s, { stato: 'fermo', adesso: null, fineTurno: adesso, suona: (s.suona || 0) + 1, risposta: { testo: corto(testo, 400), da: adesso, secondi: durata, strumenti: s.turno || 0 } })
    scrive('claude', `√ ho finito${durata != null ? ` in ${durata < 60 ? durata + 's' : Math.floor(durata / 60) + 'm ' + String(durata % 60).padStart(2, '0') + 's'}` : ''}${s.turno ? ` con ${s.turno} ${s.turno === 1 ? 'strumento' : 'strumenti'}` : ''}: ${corto(testo, 160) || 'tocca a te'}`)
  } else if (evento === 'SessionEnd') {
    Object.assign(s, { stato: 'chiusa', adesso: null, chiusa: adesso })
    scrive('alberto', `sessione chiusa${e.reason && e.reason !== 'other' ? ` (${e.reason})` : ''}`)
  }
  scrivi(FILE, s)
}
