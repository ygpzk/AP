// I dati della finestra 7 FREELLM della regia (11.11.2026, Alberto: «in regia di claude lo voglio,
// una dashboard fatta da te»). FreeLLMAPI è il router locale dei modelli gratis
// (C:\Users\Alberto\progetti-esterni\freellmapi, porta 3001; si comanda con la skill utente
// freellmapi). Ogni richiesta che passa di lì finisce nella tabella `requests` del suo SQLite, coi
// tentativi saltati in `request_attempts`: qui si leggono in sola lettura col sqlite di Node, al
// massimo una volta al secondo (la regia ridisegna ogni 250 ms).
//
//   node tools/cruscotto/modelli.mjs   stampa i dati (per provarlo senza regia)
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import http from 'node:http'

export const CASA = 'C:/Users/Alberto/progetti-esterni/freellmapi'
export const DB = `${CASA}/server/data/freeapi.db`
export const COMANDO = 'C:/Users/Alberto/.claude/skills/freellmapi/freellmapi.mjs'
export const INDIRIZZO = 'http://127.0.0.1:3001'
const OK = "status IN ('success','ok')"

let sqlite = null
let cache = null
let preso = 0
let acceso = null
let provato = 0

// il server risponde? Una prova ogni 5 secondi, senza aspettarla: la regia usa l'ultima risposta
function prova() {
  if (Date.now() - provato < 5000) return
  provato = Date.now()
  const r = http.get(INDIRIZZO + '/', { timeout: 1500 }, (res) => {
    acceso = true
    res.resume()
  })
  r.on('timeout', () => r.destroy())
  r.on('error', () => (acceso = false))
}

// «oggi» è dalla mezzanotte di Roma; il database scrive le date in UTC come 'AAAA-MM-GG HH:MM:SS'
const utc = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
const mezzanotte = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
export const quando = (s) => new Date(String(s).replace(' ', 'T') + 'Z').getTime()

export function freellm() {
  if (!existsSync(DB)) return null
  prova()
  if (cache && Date.now() - preso < 1000) return { ...cache, acceso }
  try {
    sqlite ||= process.getBuiltinModule('node:sqlite')
    const db = new sqlite.DatabaseSync(DB, { readOnly: true })
    try {
      const adesso = Date.now()
      const oggi = utc(mezzanotte())
      const ieri = utc(adesso - 24 * 3600 * 1000)
      const fornitori = db.prepare('SELECT platform, label, enabled, status, last_health_error AS errore FROM api_keys ORDER BY platform').all()
      const totali = db.prepare(`SELECT COUNT(*) n, SUM(${OK}) ok, SUM(input_tokens) tin, SUM(output_tokens) tout FROM requests WHERE created_at >= ?`).get(oggi)
      const perFornitore = db.prepare(`SELECT platform, COUNT(*) n, SUM(${OK}) ok, SUM(input_tokens+output_tokens) tok, AVG(CASE WHEN ${OK} THEN latency_ms END) ms FROM requests WHERE created_at >= ? GROUP BY platform ORDER BY n DESC`).all(oggi)
      const perModello = db.prepare(`SELECT platform, COALESCE(served_model, model_id) modello, COUNT(*) n, SUM(${OK}) ok, AVG(CASE WHEN ${OK} THEN latency_ms END) ms FROM requests WHERE created_at >= ? GROUP BY platform, modello ORDER BY n DESC LIMIT 15`).all(oggi)
      const ultime = db.prepare('SELECT id, platform, model_id, served_model, requested_model, status, input_tokens, output_tokens, latency_ms, error, created_at, client_agent, caller FROM requests ORDER BY id DESC LIMIT 40').all()
      const tentativi = db.prepare(`SELECT request_id, platform, model_id, outcome, error_summary FROM request_attempts WHERE request_id >= ? AND outcome NOT IN ('ok','success') ORDER BY request_id, ordinal`).all(ultime.at(-1)?.id ?? 0)
      for (const r of ultime) r.saltati = tentativi.filter((t) => t.request_id === r.id)
      // le ultime 24 ore, un secchio per ora (il più vecchio a sinistra)
      const ore = Array.from({ length: 24 }, () => ({ n: 0, ok: 0 }))
      for (const r of db.prepare(`SELECT created_at, ${OK} ok FROM requests WHERE created_at >= ?`).all(ieri)) {
        const i = 23 - Math.floor((adesso - quando(r.created_at)) / 3600000)
        if (i >= 0 && i < 24) {
          ore[i].n++
          ore[i].ok += r.ok ? 1 : 0
        }
      }
      const pause = db.prepare('SELECT platform, model_id, expires_at_ms AS fino, source FROM rate_limit_cooldowns WHERE expires_at_ms > ? ORDER BY expires_at_ms').all(adesso)
      const sempre = db.prepare('SELECT COUNT(*) n FROM requests').get().n
      cache = { fornitori, totali, perFornitore, perModello, ultime, ore, pause, sempre, agg: adesso }
      preso = adesso
    } finally {
      db.close()
    }
  } catch (e) {
    cache = { ...(cache || {}), errore: e.message, agg: Date.now() }
    preso = Date.now()
  }
  return { ...cache, acceso }
}

// :freellm avvia|ferma|chiedi …: lo fa lo script della skill; quello che stampa torna a chi chiama
export function comanda(argomenti, finito) {
  const p = spawn(process.execPath, [COMANDO, ...argomenti], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let out = ''
  p.stdout.on('data', (d) => (out += d))
  p.stderr.on('data', (d) => (out += d))
  p.on('close', (codice) => finito?.(out.replace(/\x1b\[[0-9;]*m/g, '').trim(), codice))
  p.on('error', (e) => finito?.(e.message, 1))
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  freellm()
  setTimeout(() => console.log(JSON.stringify(freellm(), (k, v) => (k === 'ultime' ? v.slice(0, 3) : v), 2)), 1700)
}
