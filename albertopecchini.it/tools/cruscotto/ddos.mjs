// Guardia DDoS (12.11.2026, Alberto: «apri un cmd per rilevare attacchi ddos in regia di claude ADESSO»).
// Una finestra cmd a parte, accanto alla regia. Ogni 20 secondi:
//   1. chiede al firewall di Vercel se su ogni progetto c'è un attacco in corso (attack-status) e se la
//      modalità «Attack Challenge» è accesa
//   2. misura codice e tempo di risposta di ogni dominio: tempi che salgono, 429 e 5xx sono i segnali di un attacco
// Quando qualcosa cambia scrive una riga nel log della regia (~/.cruscotto/log.txt, chi = «ddos»).
//
//   node tools/cruscotto/ddos.mjs           la finestra che si aggiorna
//   node tools/cruscotto/ddos.mjs --una     un giro solo e basta
//
// La chiave è quella della riga di comando di Vercel (%APPDATA%\com.vercel.cli\Data\auth.json): se scade si
// rinnova con `npx vercel whoami`. Guarda e basta: non cambia niente su Vercel.

import { readFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { log } from './diretta.mjs'

const TEAM = 'team_YRzztx0qCWQaH51jBUfXSKmO'
const OGNI = 20_000
const LENTO = 2500 // ms: oltre è sospetto
const AUTH = join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json')

const C = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', c: '\x1b[36m', d: '\x1b[90m', b: '\x1b[1m', x: '\x1b[0m' }
const ora = () => new Date().toLocaleTimeString('it-IT')

const token = () => { try { return JSON.parse(readFileSync(AUTH, 'utf8')).token } catch { return null } }
const rinnova = () => new Promise((ok) => execFile('cmd', ['/c', 'npx', '-y', 'vercel@latest', 'whoami'], { windowsHide: true, timeout: 90_000 }, () => ok()))

async function api(percorso, giro = 0) {
  const t = token()
  if (!t) throw new Error('niente chiave di Vercel')
  const sep = percorso.includes('?') ? '&' : '?'
  const r = await fetch(`https://api.vercel.com${percorso}${sep}teamId=${TEAM}`, { headers: { Authorization: `Bearer ${t}` }, signal: AbortSignal.timeout(15_000) })
  if ((r.status === 401 || r.status === 403) && giro === 0) { await rinnova(); return api(percorso, 1) }
  if (!r.ok) throw new Error(`Vercel ${r.status}`)
  return r.json()
}

async function sonda(url) {
  const t0 = Date.now()
  try {
    const r = await fetch(`${url}/?guardia=${Date.now()}`, { redirect: 'manual', headers: { 'User-Agent': 'guardia-ddos (Alberto)' }, signal: AbortSignal.timeout(10_000) })
    const mitigato = r.headers.get('x-vercel-mitigated') // «challenge» / «deny» quando il firewall interviene
    const errore = r.headers.get('x-vercel-error')
    return { codice: r.status, ms: Date.now() - t0, mitigato, errore }
  } catch (e) {
    return { codice: null, ms: Date.now() - t0, errore: e.name === 'TimeoutError' ? 'NESSUNA RISPOSTA (10 s)' : e.message }
  }
}

const prima = new Map() // chiave → ultimo stato, per scrivere nel log solo i cambi
function cambio(chiave, stato, riga) {
  if (prima.has(chiave) && prima.get(chiave) !== stato) log('ddos', riga)
  prima.set(chiave, stato)
}

async function giro() {
  const righe = []
  let allarmi = 0
  let progetti = []
  try { progetti = (await api('/v9/projects?limit=50')).projects || [] } catch (e) { righe.push(`${C.r}✗ elenco progetti: ${e.message}${C.x}`) }

  for (const p of progetti) {
    let attacco = '?', dettagli = ''
    try {
      const s = await api(`/v1/security/firewall/attack-status?projectId=${p.id}`)
      const anomalie = s.anomalies || s.attacks || []
      const n = Array.isArray(anomalie) ? anomalie.length : Object.keys(anomalie).length
      attacco = n ? 'SI' : 'no'
      if (n) dettagli = JSON.stringify(anomalie).slice(0, 160)
    } catch (e) { attacco = '?'; dettagli = e.message }
    let scudo = '?'
    try { const d = await api(`/v9/projects/${p.id}`); scudo = d.security?.attackModeEnabled ? 'ACCESO' : 'spento'; if (d.live === false && d.paused) scudo += ' · in pausa' } catch {}

    const domini = [...new Set((p.targets?.production?.alias || []).filter((a) => !a.endsWith('.vercel.app')))]
    const sonde = await Promise.all(domini.map(async (d) => [d, await sonda(`https://${d}`)]))

    const male = attacco === 'SI'
    if (male) allarmi++
    righe.push(`${C.b}${p.name.padEnd(22)}${C.x} attacco ${male ? C.r + C.b + 'IN CORSO' : attacco === 'no' ? C.g + 'nessuno ' : C.y + 'non so  '}${C.x}   scudo ${scudo === 'ACCESO' ? C.y : C.d}${scudo}${C.x}`)
    if (dettagli) righe.push(`  ${male ? C.r : C.d}${dettagli}${C.x}`)
    cambio(`att:${p.name}`, attacco, `${p.name}: attacco ${attacco === 'SI' ? 'IN CORSO ' + dettagli : attacco}`)

    for (const [d, s] of sonde) {
      const pausa = s.errore === 'DEPLOYMENT_PAUSED'
      const brutto = !pausa && (s.codice === null || s.codice === 429 || s.codice >= 500 || s.ms > LENTO || s.mitigato)
      if (brutto) allarmi++
      const col = pausa ? C.d : brutto ? C.r : C.g
      const extra = [pausa ? 'spento da noi' : s.errore, s.mitigato && `firewall: ${s.mitigato}`].filter(Boolean).join(' · ')
      righe.push(`  ${col}${String(s.codice ?? '---').padEnd(4)}${String(s.ms).padStart(6)} ms${C.x}  ${d}${extra ? `  ${C.d}${extra}${C.x}` : ''}`)
      cambio(`sito:${d}`, pausa ? 'pausa' : brutto ? 'male' : 'bene', `${d}: ${pausa ? 'in pausa' : brutto ? `SOSPETTO ${s.codice ?? 'nessuna risposta'} in ${s.ms} ms ${extra}` : `torna normale (${s.codice}, ${s.ms} ms)`}`)
    }
  }
  return { righe, allarmi }
}

async function mostra() {
  const { righe, allarmi } = await giro()
  const testa = allarmi
    ? `${C.r}${C.b}  ⚠  ${allarmi} SEGNALI SOSPETTI  ⚠${C.x}`
    : `${C.g}${C.b}  tutto tranquillo${C.x}`
  process.stdout.write('\x1b[2J\x1b[H')
  console.log(`${C.c}${C.b}GUARDIA DDOS${C.x}  ${C.d}firewall di Vercel + tempi di risposta · ogni ${OGNI / 1000} s · ${ora()}${C.x}`)
  console.log(testa + '\n')
  for (const r of righe) console.log(r)
  console.log(`\n${C.d}rosso = 429, 5xx, nessuna risposta, oltre ${LENTO} ms o firewall che blocca · i cambi vanno nel log della regia${C.x}`)
}

if (process.argv.includes('--una')) await mostra()
else {
  log('ddos', 'guardia DDoS accesa')
  for (;;) { try { await mostra() } catch (e) { console.log(`${C.r}errore: ${e.message}${C.x}`) } await new Promise((r) => setTimeout(r, OGNI)) }
}
