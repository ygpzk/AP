// Le statistiche dell'account di Claude per la regia (11.11.2026, Alberto: «statistiche account»).
//
// Due fonti, tutte e due su questo pc:
// - i limiti veri del piano (sessione di 5 ore, settimana, settimana per modello, la ripartizione fra
//   Claude Code e chat): Claude Code li chiede al server e li tiene in ~/.claude.json
//   (cachedUsageUtilization), con l'ora in cui li ha presi. Qui si leggono e basta.
// - i token: ogni risposta del modello nelle trascrizioni (~/.claude/projects/**/*.jsonl) ha il suo
//   «usage». Sono più di un GB, quindi il conto lo fa un processo a parte (`node account.mjs --conta`,
//   lo lancia il guscio ogni minuto) che legge solo la parte nuova di ogni file e tiene le somme ora
//   per ora degli ultimi 8 giorni in ~/.cruscotto/account.json.
//
//   node tools/cruscotto/account.mjs          stampa limiti e token
//   node tools/cruscotto/account.mjs --conta  aggiorna le somme (lo fa il guscio)

import { readdirSync, statSync, openSync, readSync, closeSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CARTELLA, scrivi, leggi } from './diretta.mjs'

const CONFIG = join(homedir(), '.claude.json')
const PROGETTI = join(homedir(), '.claude', 'projects')
export const CONTI = join(CARTELLA, 'account.json')
const GIORNI = 8
const BLOCCO = 8 * 1024 * 1024

// ── i limiti del piano ───────────────────────────────────────────────────────
export function limiti() {
  const j = leggi(CONFIG)
  if (!j) return null
  const a = j.oauthAccount || {}
  const u = j.cachedUsageUtilization || {}
  const ut = u.utilization || {}
  const piano = { claude_max: 'Max', claude_pro: 'Pro', claude_team: 'Team', claude_enterprise: 'Enterprise' }[a.organizationType] || a.organizationType || '?'
  const livello = (a.organizationRateLimitTier || '').match(/(\d+)x/)?.[1]
  const barre = (ut.limits || []).map((l) => ({
    tipo: l.kind,
    nome: l.kind === 'session' ? 'sessione 5h' : l.kind === 'weekly_all' ? 'settimana' : `sett. ${l.scope?.model?.display_name || l.scope?.surface || 'altro'}`,
    pct: l.percent ?? 0,
    grave: l.severity,
    reset: l.resets_at ? Date.parse(l.resets_at) : null,
    attivo: l.is_active,
  }))
  return {
    piano: livello ? `${piano} ${livello}x` : piano,
    nome: a.displayName,
    ruolo: a.organizationRole,
    abbonatoDa: a.subscriptionCreatedAt ? Date.parse(a.subscriptionCreatedAt) : null,
    primoToken: j.claudeCodeFirstTokenDate ? Date.parse(j.claudeCodeFirstTokenDate) : null,
    preso: u.fetchedAtMs || null,
    barre,
    ripartizione: (ut.seven_day_breakdown?.rows || []).filter((r) => r.percent > 0).map((r) => ({ nome: r.display_name, pct: r.percent })),
    extra: ut.extra_usage ? { acceso: ut.extra_usage.is_enabled, perche: ut.extra_usage.disabled_reason, usati: ut.extra_usage.used_credits } : null,
  }
}

// ── i token, ora per ora ─────────────────────────────────────────────────────
const oraDi = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}`
}

function trascrizioni(dir, out = []) {
  let voci = []
  try {
    voci = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const v of voci) {
    const p = join(dir, v.name)
    if (v.isDirectory()) trascrizioni(p, out)
    else if (v.name.endsWith('.jsonl')) out.push(p)
  }
  return out
}

export function conta() {
  const stato = leggi(CONTI, null) || { file: {}, ore: {} }
  const limite = Date.now() - GIORNI * 86400 * 1000
  const t0 = Date.now()
  let lette = 0
  for (const f of trascrizioni(PROGETTI)) {
    let st
    try {
      st = statSync(f)
    } catch {
      continue
    }
    if (st.mtimeMs < limite) continue
    const prima = stato.file[f] || { pos: 0, ultimo: null }
    if (st.size < prima.pos) prima.pos = 0 // ricominciato da capo
    if (st.size === prima.pos) continue
    const fd = openSync(f, 'r')
    try {
      let pos = prima.pos
      let resto = ''
      const buf = Buffer.alloc(BLOCCO)
      while (pos < st.size) {
        const n = readSync(fd, buf, 0, Math.min(BLOCCO, st.size - pos), pos)
        if (!n) break
        pos += n
        lette += n
        const testo = resto + buf.toString('utf8', 0, n)
        const righe = testo.split('\n')
        resto = righe.pop()
        for (const r of righe) {
          if (!r.includes('"usage"') || !r.includes('"assistant"')) continue
          let m
          try {
            m = JSON.parse(r)
          } catch {
            continue
          }
          const msg = m.message
          const u = msg?.usage
          if (!u || m.type !== 'assistant' || !msg.model || msg.model.startsWith('<')) continue
          // la stessa risposta finisce su più righe (una per pezzo): si conta una volta sola
          const id = msg.id || m.requestId
          if (id && id === prima.ultimo) continue
          prima.ultimo = id
          const t = Date.parse(m.timestamp)
          if (!(t >= limite)) continue
          const h = (stato.ore[oraDi(t)] ||= { r: 0, i: 0, o: 0, cl: 0, cs: 0, m: {} })
          h.r++
          h.i += u.input_tokens || 0
          h.o += u.output_tokens || 0
          h.cl += u.cache_read_input_tokens || 0
          h.cs += u.cache_creation_input_tokens || 0
          const mod = msg.model.replace(/^claude-/, '').replace(/-\d{8}$/, '')
          h.m[mod] = (h.m[mod] || 0) + (u.output_tokens || 0)
          if (m.isSidechain) h.ag = (h.ag || 0) + 1
        }
      }
      // si riparte dall'inizio dell'ultima riga non finita
      prima.pos = pos - Buffer.byteLength(resto)
    } finally {
      closeSync(fd)
    }
    stato.file[f] = prima
  }
  const via = oraDi(limite)
  for (const k of Object.keys(stato.ore)) if (k < via) delete stato.ore[k]
  for (const f of Object.keys(stato.file)) if (!existsSync(f)) delete stato.file[f]
  stato.agg = Date.now()
  stato.durata = Date.now() - t0
  stato.lette = lette
  scrivi(CONTI, stato)
  return stato
}

// le somme che la regia disegna: oggi, 7 giorni, le ultime 24 ore una per una, i modelli di oggi
export function riassunto(stato = leggi(CONTI)) {
  if (!stato?.ore) return null
  const adesso = new Date()
  const oggi = oraDi(adesso).slice(0, 10)
  const somma = (filtro) => {
    const s = { r: 0, i: 0, o: 0, cl: 0, cs: 0, ag: 0, m: {} }
    for (const [k, h] of Object.entries(stato.ore)) {
      if (!filtro(k)) continue
      for (const x of ['r', 'i', 'o', 'cl', 'cs', 'ag']) s[x] += h[x] || 0
      for (const [mod, n] of Object.entries(h.m || {})) s.m[mod] = (s.m[mod] || 0) + n
    }
    return s
  }
  const settimana = oraDi(Date.now() - 7 * 86400 * 1000)
  const ore = []
  for (let i = 23; i >= 0; i--) {
    const k = oraDi(Date.now() - i * 3600 * 1000)
    ore.push({ k, o: stato.ore[k]?.o || 0, r: stato.ore[k]?.r || 0 })
  }
  const giorni = []
  for (let i = 6; i >= 0; i--) {
    const g = oraDi(Date.now() - i * 86400 * 1000).slice(0, 10)
    giorni.push({ g, ...somma((k) => k.startsWith(g)) })
  }
  return { oggi: somma((k) => k.startsWith(oggi)), settimana: somma((k) => k >= settimana), ore, giorni, agg: stato.agg, durata: stato.durata }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--conta')) {
    const s = conta()
    if (process.stdout.isTTY) console.log(`contate in ${s.durata} ms, ${(s.lette / 1e6).toFixed(1)} MB nuovi`)
  } else {
    const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n))
    const l = limiti()
    console.log(`piano ${l?.piano}, limiti presi ${l?.preso ? new Date(l.preso).toLocaleString('it-IT') : '—'}`)
    for (const b of l?.barre || []) console.log(`  ${b.nome.padEnd(16)} ${String(b.pct).padStart(3)}%  ${b.grave}  reset ${b.reset ? new Date(b.reset).toLocaleString('it-IT') : '—'}`)
    const r = riassunto(conta())
    for (const [n, s] of [['oggi', r.oggi], ['7 giorni', r.settimana]]) console.log(`${n.padEnd(9)} ${s.r} risposte · out ${k(s.o)} · in ${k(s.i)} · cache letta ${k(s.cl)} · scritta ${k(s.cs)} · ${JSON.stringify(s.m)}`)
  }
}
