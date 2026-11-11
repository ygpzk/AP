// Tutto quello che Alberto ospita, e se va (11.11.2026, Alberto: «rileva se tutto ciò che hosto vada»).
// Lo trova da solo, senza un elenco scritto a mano:
//   sito    i domini dei siti: quelli della macchina del tempo (tools/tempo/siti.mjs) e dei progetti del portfolio
//           (`url` in src/data/projects.js), più l'apice senza www, che deve rimandare a www
//   api     le funzioni di api/*.js, ognuna sul dominio dove serve (pzkko/api → pzkko.it, bcp → bettercallpekko.it, il resto
//           su albertopecchini.it). Quelle del ponte verso il server di casa (ponte / archivioServer di
//           pzkko/api/_server.mjs) sono la prova vera: 200 da Vercel vuol dire pc acceso, tunnel su, firma giusta
//   tunnel  le strade di Tailscale Funnel (`tailscale funnel status --json`): / → 8787, /tempo → 8789, … (dal pc il
//           tunnel passa dalla tailnet e prova poco: la prova vera resta /api/wallet/ di pzkko.it)
//   casa    i server su 127.0.0.1 (le porte del tunnel, la regia 8788, vite 5173) e le attività pianificate della
//           radice di Windows (pzkko-server, tempo-server, …)
//
//   node tools/cruscotto/hosting.mjs           un giro: la tabella e C:\Users\Alberto\.cruscotto\hosting.json
//   node tools/cruscotto/hosting.mjs --giro    un giro ogni 60 secondi (e una riga nel log della regia quando
//                                              qualcosa cade o torna su)
//   node tools/cruscotto/hosting.mjs --json    il file e basta, niente tabella
//
// hosting.json lo legge la regia (cruscotto.mjs): il formato non si cambia.
//   { "agg": <ms>, "controlli": [ { "nome", "gruppo": "sito"|"api"|"casa"|"tunnel"|"sviluppo", "url", "su", "codice", "ms", "nota" } ] }
// "sviluppo" sono i server accesi solo quando Alberto lavora (vite, il server di deutschland e la sua strada nel tunnel):
// spenti non sono un guasto, e la regia non li conta fra i giù
// (codice è null per quello che non è HTTP: il processo in ascolto che non risponde, l'attività pianificata)
//
// Guarda e basta: non riavvia niente, non tocca la banca né i dati. Nessuna dipendenza.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { scrivi, log, CARTELLA } from './diretta.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../..') // albertopecchini.it/
const DOCUMENTI = join(homedir(), 'Documents')
export const FILE = join(CARTELLA, 'hosting.json')

const ATTESA = 10_000
const UA = 'hosting.mjs (controllo dei siti di Alberto)'

// cose che si sanno e che un indirizzo da solo non dice
const PORTE = {
  8787: { nome: 'pzkko-server', percorso: '/', nota: 'il server dei dati e della banca (chi non firma riceve 404: è giusto)' },
  8788: { nome: 'regia del server', percorso: '/server/' },
  8789: { nome: 'tempo-server', percorso: '/' },
  8790: { nome: 'deutschland (sviluppo)', percorso: '/', facoltativo: 'serve solo per lo sviluppo di /deutschland/: in produzione le foto vengono da B2' },
  5173: { nome: 'vite', percorso: '/', facoltativo: 'acceso solo quando si sviluppa' },
}
const sh = (cmd, args) => new Promise((ok) => execFile(cmd, args, { windowsHide: true, timeout: 15_000, maxBuffer: 8 << 20 }, (e, out) => ok(e ? null : String(out))))
const host = (u) => new URL(u).hostname

// ── la scoperta ────────────────────────────────────────────────────────────────────────────────────────────────────

async function siti() {
  const urls = new Map() // url → da dove viene
  try {
    const { SITI } = await import(pathToFileURL(join(SITO, 'tools/tempo/siti.mjs')).href)
    for (const s of SITI) if (s.url) urls.set(s.url.replace(/\/$/, ''), 'macchina del tempo')
  } catch {}
  try {
    const p = readFileSync(join(SITO, 'src/data/projects.js'), 'utf8')
    for (const [, u] of p.matchAll(/\burl:\s*'(https:\/\/[^'/]+)\/?'/g)) if (!urls.has(u)) urls.set(u, 'portfolio')
  } catch {}
  const out = []
  for (const [url, da] of urls) {
    out.push({ nome: host(url), gruppo: 'sito', url: url + '/', atteso: 'pagina', da })
    // l'apice deve rimandare a www (i *.vercel.app non hanno apice)
    if (host(url).startsWith('www.')) out.push({ nome: host(url).slice(4), gruppo: 'sito', url: url.replace('://www.', '://') + '/', atteso: 'rimando', verso: host(url) })
  }
  return out
}

// le funzioni di api/: il dominio dove servono e se passano dal server di casa
function api(dominiSiti) {
  const dir = join(SITO, 'api')
  const ap = 'www.albertopecchini.it', pzk = 'www.pzkko.it', bcp = 'www.bettercallpekko.it'
  const out = []
  let file = []
  try { file = readdirSync(dir).filter((f) => /^[a-z0-9-]+\.js$/.test(f)) } catch {}
  for (const f of file) {
    const nome = f.replace(/\.js$/, '')
    let testo = ''
    try { testo = readFileSync(join(dir, f), 'utf8') } catch {}
    // (chi riesporta pzkko/api/x.mjs: si guarda dentro quello)
    const rie = /from '\.\.\/pzkko\/api\/([a-z0-9-]+\.mjs)'/.exec(testo)
    let dentro = testo
    if (rie) try { dentro = readFileSync(join(SITO, 'pzkko/api', rie[1]), 'utf8') } catch {}
    const casa = /\bponte\(|archivioServer/.test(dentro)
    // solo POST (moduli, IA): una GET deve ricevere un «no» dalla funzione, non un errore di Vercel
    const soloPost = /req\.method !== 'POST'/.test(dentro) && !/req\.method === 'GET'/.test(dentro)
    // (/assistenza/ di albertopecchini.it rimanda a bettercallpekko.it: lì /api/bcp/ dice «on vacation», ma non la usa
    // nessuno, perché quel progetto non ha le variabili del server di casa; si misura solo dove serve)
    const domini = rie ? [pzk] : nome === 'bcp' ? [bcp] : [ap]
    for (const d of domini) if (dominiSiti.has(d)) out.push({ nome: `${d.replace(/^www\./, '')}/api/${nome}/`, gruppo: 'api', url: `https://${d}/api/${nome}/`, atteso: 'api', casa, soloPost, rie: !!rie })
  }
  return out
}

async function tunnel() {
  const out = []
  const j = await sh('tailscale', ['funnel', 'status', '--json'])
  let web = {}
  try { web = JSON.parse(j).Web || {} } catch {}
  const st = await sh('tailscale', ['status', '--json'])
  let ts = null
  try { ts = JSON.parse(st) } catch {}
  out.push({ nome: 'tailscale', gruppo: 'tunnel', url: 'tailscale status', atteso: 'tailscale', ts, funnel: Object.keys(web).length > 0 })
  const porte = new Set()
  for (const [hp, v] of Object.entries(web)) {
    const h = hp.replace(/:443$/, '')
    for (const [percorso, gestore] of Object.entries(v.Handlers || {})) {
      const porta = Number(/:(\d+)\/?$/.exec(gestore.Proxy || '')?.[1]) || null
      if (porta) porte.add(porta)
      const p = percorso === '/' ? '/' : percorso.replace(/\/?$/, '/')
      out.push({ nome: `tunnel ${percorso}`, gruppo: PORTE[porta]?.facoltativo ? 'sviluppo' : 'tunnel', url: `https://${h}${p}`, atteso: porta === 8787 ? 'server-casa' : 'pagina', porta })
    }
  }
  return { controlli: out, porte }
}

async function casa(porteTunnel) {
  const porte = [...new Set([...porteTunnel, 8787, 8788, 8789, 5173])].sort((a, b) => a - b)
  const out = porte.map((porta) => ({ nome: PORTE[porta]?.nome ? `${PORTE[porta].nome} :${porta}` : `127.0.0.1:${porta}`, gruppo: PORTE[porta]?.facoltativo ? 'sviluppo' : 'casa', url: `http://127.0.0.1:${porta}${PORTE[porta]?.percorso || '/'}`, atteso: porta === 8787 ? 'server-casa' : 'locale', porta }))
  // le attività pianificate della radice (\pzkko-server, \tempo-server…): quelle di Microsoft stanno nelle sottocartelle
  const csv = await sh('schtasks', ['/query', '/fo', 'CSV', '/nh'])
  const visti = new Set()
  for (const riga of String(csv || '').split(/\r?\n/)) {
    const m = /^"\\([^\\"]+)","[^"]*","([^"]*)"/.exec(riga)
    if (!m || visti.has(m[1]) || !/pzkko|tempo|deutschland|cruscotto|regia|server/i.test(m[1])) continue
    visti.add(m[1])
    out.push({ nome: `attività ${m[1]}`, gruppo: 'casa', url: `schtasks:${m[1]}`, atteso: 'attivita', statoAttivita: m[2] })
  }
  if (csv === null) out.push({ nome: 'attività pianificate', gruppo: 'casa', url: 'schtasks', atteso: 'attivita', statoAttivita: null })
  return out
}

// le cartelle dei siti nei Documenti (quelle con vercel.json): solo per dire se ce n'è una che non ha un dominio noto
function cartelleVercel() {
  const out = []
  let dirs = []
  try { dirs = readdirSync(DOCUMENTI, { withFileTypes: true }).filter((d) => d.isDirectory()) } catch {}
  for (const d of dirs) {
    const base = join(DOCUMENTI, d.name)
    for (const sotto of ['', ...safeDirs(base)]) {
      const dir = sotto ? join(base, sotto) : base
      if (existsSync(join(dir, 'vercel.json'))) out.push(dir)
    }
  }
  return out
}
function safeDirs(d) {
  try { return readdirSync(d, { withFileTypes: true }).filter((x) => x.isDirectory() && !/^(node_modules|\.git|dist.*)$/.test(x.name)).map((x) => x.name) } catch { return [] }
}

// ── la misura ──────────────────────────────────────────────────────────────────────────────────────────────────────

async function prendi(url, metodo = 'GET') {
  const t0 = performance.now()
  try {
    const r = await fetch(url, { method: metodo, redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(ATTESA) })
    let corpo = ''
    try { corpo = metodo === 'HEAD' ? '' : (await r.text()).slice(0, 2000) } catch {}
    return { codice: r.status, ms: Math.round(performance.now() - t0), dove: r.headers.get('location') || '', corpo }
  } catch (e) {
    const causa = e?.cause?.code || (e?.name === 'TimeoutError' ? 'troppo lento' : e?.message || 'errore')
    return { codice: null, ms: Math.round(performance.now() - t0), errore: causa }
  }
}

async function misura(c) {
  const fuori = { nome: c.nome, gruppo: c.gruppo, url: c.url, su: false, codice: null, ms: 0, nota: '' }
  if (c.atteso === 'tailscale') {
    const t = c.ts
    const ok = t?.BackendState === 'Running' && t?.Self?.Online !== false
    return { ...fuori, su: !!ok && c.funnel, nota: !t ? 'tailscale non risponde' : !ok ? `stato ${t.BackendState}` : c.funnel ? `Funnel acceso su ${String(t.Self?.DNSName || '').replace(/\.$/, '')}` : 'Funnel spento' }
  }
  if (c.atteso === 'attivita') {
    const s = c.statoAttivita
    return { ...fuori, su: /esecuzione|running/i.test(s || ''), nota: s === null ? 'schtasks non risponde' : s || '' }
  }
  const r = await prendi(c.url)
  const o = { ...fuori, codice: r.codice, ms: r.ms }
  if (r.codice === null) {
    const f = PORTE[c.porta]?.facoltativo
    return { ...o, nota: `${c.atteso === 'locale' || c.atteso === 'server-casa' && c.gruppo === 'casa' ? 'niente in ascolto' : 'non risponde'} (${r.errore})${f ? ` · ${f}` : ''}` }
  }
  switch (c.atteso) {
    case 'pagina':
      o.su = r.codice >= 200 && r.codice < 400
      if (r.codice === 502 && c.porta) o.nota = `il tunnel c'è ma niente risponde su 127.0.0.1:${c.porta}${PORTE[c.porta]?.facoltativo ? ` · ${PORTE[c.porta].facoltativo}` : ''}`
      else if (c.gruppo === 'tunnel') o.nota = 'dal pc passa dalla tailnet: prova poco (la prova vera è /api/wallet/ di pzkko.it)'
      else if (c.da) o.nota = c.da
      break
    case 'rimando':
      o.su = r.codice >= 300 && r.codice < 400 && host(new URL(r.dove, c.url).href) === c.verso
      o.nota = r.dove ? `rimanda a ${r.dove}` : 'non rimanda a www'
      break
    case 'server-casa':
      // chi non firma riceve un 404 vuoto: vuol dire che il server c'è
      o.su = r.codice === 404
      o.nota = c.gruppo === 'tunnel' ? 'risponde col 404 vuoto a chi non firma (giusto) · dal pc passa dalla tailnet' : PORTE[8787].nota
      break
    case 'locale':
      o.su = r.codice > 0 && r.codice < 500
      if (PORTE[c.porta]?.facoltativo && !o.su) o.nota = PORTE[c.porta].facoltativo
      break
    case 'api': {
      if (c.casa) {
        o.su = r.codice === 200
        let j = null
        try { j = JSON.parse(r.corpo) } catch {}
        if (r.codice === 503 && j?.offline) {
          // su albertopecchini.it le variabili del server non ci sono (sono nei progetti pzkko e bcp): la funzione dice
          // «in pausa» subito, senza nemmeno provarci; altrove vuol dire pc spento o tunnel giù
          o.nota = host(c.url) === 'www.albertopecchini.it'
            ? 'in pausa: il progetto Vercel albertopecchini.it non ha PZKKO_SERVER_URL/SECRET (ce le hanno pzkko e bcp)'
            : 'in pausa: il server di casa non risponde a Vercel (pc spento, tunnel giù o segreto sbagliato)'
        } else o.nota = o.su ? 'passa dal server di casa: risponde attraverso Vercel' : `passa dal server di casa: ${r.codice}`
      } else if (c.soloPost) {
        o.su = r.codice >= 200 && r.codice < 500
        o.nota = 'solo POST: basta che la funzione risponda'
      } else {
        // (401/403: la funzione c'è e chiede la chiave, come /api/email-ai/)
        o.su = r.codice >= 200 && r.codice < 500 && r.codice !== 404
        o.nota = r.codice === 404 ? 'non ancora online (serve il push)' : r.codice === 401 || r.codice === 403 ? 'risponde e chiede la chiave: giusto' : ''
      }
      break
    }
  }
  return o
}

// ── il giro ───────────────────────────────────────────────────────────────────────────────────────────────────────

export async function controlla() {
  const s = await siti()
  const dominiSiti = new Set(s.map((c) => host(c.url)))
  const [t, cartelle] = await Promise.all([tunnel(), Promise.resolve(cartelleVercel())])
  const c = await casa(t.porte)
  const tutti = [...s, ...api(dominiSiti), ...t.controlli, ...c]
  const controlli = await Promise.all(tutti.map(misura))
  // una cartella con vercel.json che non somiglia a nessun dominio: da guardare a mano
  const piatto = (x) => x.toLowerCase().replace(/[^a-z]/g, '')
  const orfane = cartelle.filter((d) => {
    const n = piatto(d.split(/[\\/]/).filter(Boolean).slice(-1)[0])
    return n && n !== 'pzkko' && ![...dominiSiti].some((h) => piatto(h).includes(n) || n.includes(piatto(h.replace(/^www\.|\.(it|xyz|vercel\.app)$/g, ''))))
  })
  return { agg: Date.now(), controlli, orfane }
}

export const facoltativo = (x) => x.gruppo === 'sviluppo'
const COLORE = process.stdout.isTTY && !process.env.NO_COLOR
const c = (n, s) => (COLORE ? `\x1b[${n}m${s}\x1b[0m` : s)
function tabella({ agg, controlli, orfane }) {
  const righe = controlli.map((x) => [x.su ? c(32, '●') : c(31, '●'), x.gruppo, x.nome, x.codice ?? '—', x.codice !== null || x.ms ? `${x.ms} ms` : '', x.nota])
  const larg = [1, 8, Math.max(...righe.map((r) => String(r[2]).length)), 4, 8]
  console.log(`\nhosting di Alberto · ${new Date(agg).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}\n`)
  for (const r of righe) console.log(`${r[0]} ${String(r[1]).padEnd(larg[1])} ${String(r[2]).padEnd(larg[2])} ${String(r[3]).padStart(larg[3])} ${String(r[4]).padStart(larg[4])}  ${c(90, r[5])}`)
  // (i facoltativi spenti, come vite o il server di sviluppo di deutschland, non sono un guasto)
  const giu = controlli.filter((x) => !x.su && !facoltativo(x))
  const spenti = controlli.filter((x) => !x.su && facoltativo(x))
  console.log(`\n${controlli.length - giu.length - spenti.length}/${controlli.length} su${giu.length ? ` · giù: ${giu.map((x) => x.nome).join(', ')}` : ' · tutto a posto'}${spenti.length ? ` · spenti ma facoltativi: ${spenti.map((x) => x.nome).join(', ')}` : ''}`)
  if (orfane.length) console.log(c(33, `cartelle con vercel.json senza un dominio noto: ${orfane.join(', ')}`))
  console.log(`scritto ${FILE}`)
}

async function giro(prima) {
  const r = await controlla()
  scrivi(FILE, { agg: r.agg, controlli: r.controlli })
  if (prima) for (const x of r.controlli) {
    const p = prima.get(x.url)
    if (p !== undefined && p !== x.su && !facoltativo(x)) log('hosting', `${x.su ? 'tornato su' : 'GIÙ'}: ${x.nome}${x.su ? '' : ` (${x.codice ?? '—'} ${x.nota})`}`)
  }
  return r
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv.slice(2)
  const muto = arg.includes('--json')
  if (arg.includes('--giro')) {
    let prima = null
    for (;;) {
      const r = await giro(prima)
      if (!muto) tabella(r)
      prima = new Map(r.controlli.map((x) => [x.url, x.su]))
      await new Promise((ok) => setTimeout(ok, 60_000))
    }
  } else {
    const r = await giro(null)
    if (!muto) tabella(r)
  }
}
