// L'agente gratis del cercapersone zero (11.11, Alberto: «fai usare ai subagenti i modelli di FreeLLMAPI e non claude
// SEMPRE PER IL FLIPPER ZERO IN PZK»). I subagenti di Claude Code girano solo su Claude: questo è un agente a parte, che
// lavora coi modelli gratis di FreeLLMAPI (http://127.0.0.1:3001, la skill freellmapi) con gli strumenti di un agente vero:
// leggere, cercare, modificare SOLO i file permessi, lanciare il collaudo. Claude gli prepara il compito e alla fine
// controlla (collaudo, foto, diff): quello che fa l'agente gratis non è «fatto» finché Claude non l'ha guardato.
//
//   node tools/pzkko/zero/agente-gratis.mjs --app=quiz --compito=compito.md [--file=a.js,b.js] [--passi=60] [--modello=auto]
//
// --app: l'app (il collaudo si lancia su quella; i file permessi di base sono pzkko/telefono/zero/os/<app>.js).
// --compito: un file col compito (o il testo dopo =). Il registro va in tools/pzkko/lavoro/agenti/<app>.log, il resoconto
// (modelli usati, file cambiati, rapporto, ultimo collaudo) in <app>.json, la copia dei file di prima in <app>.prima/.
import { readFile, writeFile, mkdir, appendFile, copyFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile, execFileSync } from 'node:child_process'
import { join, dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '../../..') // albertopecchini.it
const LAVORO = join(QUI, '../lavoro/agenti')
const arg = (k, d = null) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d }
const app = arg('app')
if (!app || !/^[a-z]+$/.test(app)) { console.error('serve --app=<id>'); process.exit(2) }
const PASSI = Number(arg('passi', 60)), MODELLO = arg('modello', 'auto')
let compito = arg('compito', '')
if (compito && existsSync(compito)) compito = await readFile(compito, 'utf8')
if (!compito) { console.error('serve --compito=<file o testo>'); process.exit(2) }
const PERMESSI = new Set((arg('file') ?? `pzkko/telefono/zero/os/${app}.js`).split(',').map((f) => f.trim().replace(/\\/g, '/')))

// la chiave di FreeLLMAPI: dall'ambiente o dalla skill (mai scritta in un file del sito)
const SKILL = join(process.env.USERPROFILE ?? '', '.claude/skills/freellmapi/freellmapi.mjs')
const CHIAVE = process.env.FREELLM_KEY || execFileSync(process.execPath, [SKILL, 'chiave'], { encoding: 'utf8' }).match(/chiave:\s*(\S+)/)?.[1]
const URL_API = (process.env.FREELLM_URL || 'http://127.0.0.1:3001/v1') + '/chat/completions'
if (!CHIAVE) { console.error('niente chiave di FreeLLMAPI: è acceso? (node ' + SKILL + ' avvia)'); process.exit(2) }

await mkdir(LAVORO, { recursive: true })
const LOG = join(LAVORO, `${app}.log`)
await writeFile(LOG, `agente gratis «${app}», ${new Date().toLocaleString('it-IT')}\n`)
const scrivi = async (s) => { process.stdout.write(s + '\n'); await appendFile(LOG, s + '\n') }

// ── i percorsi: solo dentro albertopecchini.it ──
const dentro = (p) => { const a = resolve(RADICE, String(p ?? '').replace(/^albertopecchini\.it[\\/]/, '')); return a.startsWith(RADICE + sep) || a === RADICE ? a : null }
const rel = (a) => relative(RADICE, a).split(sep).join('/')

// ── gli strumenti ──
const corto = (s, n = 6000) => (s.length > n ? s.slice(0, n) + `\n…(tagliato: ${s.length - n} caratteri in più)` : s)
const cambiati = new Set()
const STRUMENTI = {
  leggi: {
    descr: 'Legge un file del sito (percorso da albertopecchini.it, es. pzkko/telefono/zero/os/quiz.js), con i numeri di riga. da/a: le righe (al massimo 300 per volta).',
    param: { percorso: 'string', da: 'integer', a: 'integer' }, chiesti: ['percorso'],
    async fai({ percorso, da = 1, a }) {
      const f = dentro(percorso); if (!f || !existsSync(f)) return `non c'è: ${percorso}`
      const righe = (await readFile(f, 'utf8')).split(/\r?\n/), i = Math.max(1, da | 0), j = Math.min(righe.length, a ? a | 0 : i + 299, i + 299)
      return `${rel(f)}, righe ${i}-${j} di ${righe.length}\n` + righe.slice(i - 1, j).map((r, k) => `${i + k}\t${r}`).join('\n')
    },
  },
  cerca: {
    descr: 'Cerca un\'espressione regolare (JavaScript) nei file .js/.mjs/.md di una cartella (di base pzkko/telefono/zero). Torna file:riga: testo.',
    param: { regex: 'string', cartella: 'string' }, chiesti: ['regex'],
    async fai({ regex, cartella = 'pzkko/telefono/zero' }) {
      let re; try { re = new RegExp(regex) } catch (e) { return 'regex sbagliata: ' + e.message }
      const base = dentro(cartella); if (!base) return 'cartella fuori dal sito'
      const out = []
      const giro = async (d) => {
        for (const n of await readdir(d)) {
          if (out.length >= 80 || n === 'node_modules' || n === 'lib' || n.startsWith('.')) continue
          const p = join(d, n), s = await stat(p)
          if (s.isDirectory()) await giro(p)
          else if (/\.(m?js|md)$/.test(n)) (await readFile(p, 'utf8')).split(/\r?\n/).forEach((r, k) => { if (out.length < 80 && re.test(r)) out.push(`${rel(p)}:${k + 1}: ${r.trim().slice(0, 200)}`) })
        }
      }
      await giro(base)
      return out.length ? out.join('\n') : 'niente'
    },
  },
  modifica: {
    descr: 'Sostituisce nel file il testo «vecchio» (che deve comparire UNA volta sola, identico, spazi compresi) con «nuovo». Solo nei file permessi. Dopo, il file .js si controlla con node --check: se non passa, la modifica si annulla.',
    param: { percorso: 'string', vecchio: 'string', nuovo: 'string' }, chiesti: ['percorso', 'vecchio', 'nuovo'],
    async fai({ percorso, vecchio, nuovo }) {
      const f = dentro(percorso); if (!f) return 'fuori dal sito'
      if (!PERMESSI.has(rel(f))) return `non puoi modificare ${rel(f)}: i file permessi sono ${[...PERMESSI].join(', ')}`
      const prima = await readFile(f, 'utf8'), crlf = prima.includes('\r\n'), t = prima.replace(/\r\n/g, '\n')
      const v = String(vecchio).replace(/\r\n/g, '\n'), n = t.split(v).length - 1
      if (!v || n === 0) return 'il testo vecchio non c\'è (rileggi il file: deve essere identico)'
      if (n > 1) return `il testo vecchio c'è ${n} volte: allargalo finché è unico`
      const copia = join(LAVORO, `${app}.prima`, rel(f))
      if (!existsSync(copia)) { await mkdir(dirname(copia), { recursive: true }); await copyFile(f, copia) }
      let dopo = t.replace(v, () => String(nuovo).replace(/\r\n/g, '\n'))
      if (crlf) dopo = dopo.replace(/\n/g, '\r\n')
      await writeFile(f, dopo)
      if (/\.m?js$/.test(f)) {
        try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }) } catch (e) { await writeFile(f, prima); return 'ANNULLATA: node --check non passa:\n' + String(e.stderr ?? e.message).slice(0, 800) }
      }
      cambiati.add(rel(f))
      return 'fatto'
    },
  },
  collaudo: {
    descr: 'Lancia il collaudo dell\'app (node tools/pzkko/zero/prova.mjs --app=<app> più le opzioni: --giorno, --suoni, --sfondo=notte|carta, --banca, --server-finto, --peggiori, --senzaconto, --tasti=dx,ok,giu…). Torna i passi, i problemi e la riga COLLAUDO. Le foto non le vedi: le guarda Claude.',
    param: { opzioni: 'string' }, chiesti: [],
    async fai({ opzioni = '--giorno --suoni' }) {
      const a = String(opzioni).split(/\s+/).filter((x) => /^--[a-z-]+(=[\w@,.+-]+)?$/.test(x) && !x.startsWith('--app='))
      return new Promise((ok) => execFile(process.execPath, [join(QUI, 'prova.mjs'), `--app=${app}`, ...a], { cwd: RADICE, timeout: 300_000, maxBuffer: 1 << 24 }, (e, so, se) => {
        const righe = String(so + se).split(/\r?\n/).filter((r) => /^\s+\d+ |COLLAUDO|^\s+- |errore|Error|TypeError/.test(r) && !/404|meteo|willReadFrequently/.test(r))
        ok((e?.killed ? 'TEMPO SCADUTO (5 minuti)\n' : '') + corto(righe.join('\n') || String(so + se).slice(-2000), 5000))
      }))
    },
  },
  fine: {
    descr: 'Hai finito: il rapporto (cosa hai cambiato e perché, cosa resta, l\'ultimo collaudo). Chiamalo solo dopo un collaudo «tutto a posto».',
    param: { rapporto: 'string' }, chiesti: ['rapporto'],
    async fai() { return 'ok' },
  },
}
const tools = Object.entries(STRUMENTI).map(([name, s]) => ({ type: 'function', function: { name, description: s.descr, parameters: { type: 'object', properties: Object.fromEntries(Object.entries(s.param).map(([k, t]) => [k, { type: t }])), required: s.chiesti } } }))

const SISTEMA = `Sei un agente che lavora sul codice di pzk os, il sistema del cercapersone zero del sito pzkko (JavaScript, uno schermo lcd 512×256 a 256 colori con impaginazione 256×128, sei tasti). Lavori sull'app «${app}». Prima leggi pzkko/telefono/zero/os/REGOLE.md (le regole delle app) e il file dell'app. Puoi modificare SOLO: ${[...PERMESSI].join(', ')}. Modifiche piccole e precise, nello stile del file (italiano, commenti fra parentesi col perché e la data 11.11). Non cambiare testi, giochi o regole che il compito non chiede. Dopo ogni gruppo di modifiche lancia il collaudo: deve dire «COLLAUDO ${app}: tutto a posto». Quando hai finito chiama fine col rapporto. Rispondi sempre chiamando uno strumento.`
const messaggi = [{ role: 'system', content: SISTEMA }, { role: 'user', content: compito }]

// ── la chiamata a FreeLLMAPI, con i tentativi ──
const modelli = new Map()
async function chiedi() {
  for (let t = 0; t < 6; t++) {
    try {
      const r = await fetch(URL_API, { method: 'POST', headers: { Authorization: `Bearer ${CHIAVE}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODELLO, messages: messaggi, tools, tool_choice: 'auto', temperature: 0.2 }), signal: AbortSignal.timeout(300_000) })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.choices?.[0]?.message) { const m = j.model ?? '?'; modelli.set(m, (modelli.get(m) ?? 0) + 1); return { m: j.choices[0].message, modello: m } }
      await scrivi(`  (FreeLLMAPI ${r.status}: ${String(j?.error?.message ?? '').slice(0, 160)}; riprovo)`)
    } catch (e) { await scrivi(`  (FreeLLMAPI non risponde: ${e.message}; riprovo)`) }
    await new Promise((ok) => setTimeout(ok, 5000 * (t + 1)))
  }
  throw new Error('FreeLLMAPI non risponde più')
}
// i risultati vecchi degli strumenti si accorciano, così la conversazione sta nel contesto dei modelli gratis
function sfoltisci() {
  const strum = messaggi.map((m, i) => (m.role === 'tool' ? i : -1)).filter((i) => i >= 0)
  for (const i of strum.slice(0, -6)) if (messaggi[i].content.length > 400) messaggi[i].content = messaggi[i].content.slice(0, 300) + '\n…(risultato vecchio accorciato: rileggi se serve)'
}

let rapporto = null, ultimoCollaudo = '', vuote = 0
for (let passo = 1; passo <= PASSI && !rapporto; passo++) {
  sfoltisci()
  let r
  try { r = await chiedi() } catch (e) { await scrivi('FERMO: ' + e.message); break }
  const { m, modello } = r
  messaggi.push({ role: 'assistant', content: m.content ?? '', ...(m.tool_calls?.length && { tool_calls: m.tool_calls }) })
  if (!m.tool_calls?.length) {
    await scrivi(`${passo}. [${modello}] (parla senza strumenti) ${String(m.content ?? '').slice(0, 200).replace(/\n/g, ' ')}`)
    if (++vuote >= 3) { rapporto = String(m.content ?? '(niente rapporto)'); break }
    messaggi.push({ role: 'user', content: 'Continua usando gli strumenti (leggi, cerca, modifica, collaudo); quando hai finito chiama fine.' })
    continue
  }
  vuote = 0
  for (const c of m.tool_calls) {
    const nome = c.function?.name, s = STRUMENTI[nome]
    let a = {}
    try { a = JSON.parse(c.function?.arguments || '{}') } catch {}
    await scrivi(`${passo}. [${modello}] ${nome} ${JSON.stringify(a).slice(0, 160)}`)
    let esito
    try { esito = s ? await s.fai(a) : `strumento sconosciuto: ${nome}` } catch (e) { esito = 'errore: ' + e.message }
    if (nome === 'collaudo') { ultimoCollaudo = esito; await scrivi('   ' + (esito.match(/COLLAUDO.*$/m)?.[0] ?? esito.slice(0, 200))) }
    if (nome === 'fine') rapporto = a.rapporto ?? ''
    messaggi.push({ role: 'tool', tool_call_id: c.id, content: corto(String(esito)) })
  }
}

const esito = { app, modelli: Object.fromEntries(modelli), cambiati: [...cambiati], rapporto: rapporto ?? '(finiti i passi senza rapporto)', collaudo: ultimoCollaudo.match(/COLLAUDO.*$/m)?.[0] ?? '(nessun collaudo)' }
await writeFile(join(LAVORO, `${app}.json`), JSON.stringify(esito, null, 1))
await scrivi(`\nFINE ${app}: ${esito.collaudo}\nmodelli usati: ${Object.entries(esito.modelli).map(([k, v]) => `${k} ×${v}`).join(', ')}\nfile cambiati: ${esito.cambiati.join(', ') || 'nessuno'}`)
