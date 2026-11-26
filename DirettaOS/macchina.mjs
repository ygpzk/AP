// Diretta OS: la macchina. I pezzi del pc (/o/app, /o/cpu, /o/gpu, /o/ram, /o/ssd, /o/hdd, /o/temp, /o/wifi) leggono da qui.
// - macchina-info.ps1: i componenti veri (processore, scheda video, ram, dischi, wi-fi), una volta sola, poi esce: i suoi
//   moduli CIM/Storage/NetAdapter sono grandi e non devono restare appesi.
// - macchina.cs → cache/macchina.exe: cpu (e ogni thread), ram, attività dei dischi, temperatura del processore, 2 volte
//   al secondo; le app aperte, con le icone vere, quando cambiano. macchina.ps1 è il ripiego se csc non c'è.
// - nvidia-smi: la scheda video, 2 volte al secondo.
// - il wi-fi: uno speedtest ogni cinque minuti (solo download, al massimo 2 s o 15 MB), un giro da Cloudflare, uno da
//   Hetzner, uno da OVH. Il numero che si vede lo inventa la pagina: oscilla attorno all'ultima misura e scivola piano.
// Si accende solo quello che serve (un pezzo acceso e una pagina che lo mostra) e si spegne 15 s dopo.

import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

export const PC = ['quadro', 'app', 'cpu', 'gpu', 'ram', 'ssd', 'hdd', 'temp', 'wifi']

// ── i nomi corti dei componenti (al massimo 20 caratteri) ──
const MAX = 20
const stringi = (s) => {
  s = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (s.length <= MAX) return s
  const parole = s.split(' ')
  while (parole.length > 1 && parole.join(' ').length > MAX) parole.pop()
  return parole.join(' ').slice(0, MAX)
}
const pulisci = (s) => String(s ?? '').replace(/\((R|TM|C)\)|®|™/gi, '').replace(/\s+/g, ' ').trim()
function nomeCpu(s) {
  const n = pulisci(s).replace(/\b\d+(st|nd|rd|th) Gen\b/i, '').replace(/\bCPU\b|\bProcessor\b|@.*$|\d+-Core/gi, '').replace(/\s+/g, ' ').trim()
  return n.length <= MAX ? n : stringi(n.replace(/^(Intel|AMD)\s+/i, ''))
}
function nomeGpu(s) {
  const n = pulisci(s).replace(/^(NVIDIA|AMD|ATI)\s+/i, '').replace(/\bGraphics\b/i, '').trim()
  return n.length <= MAX ? n : stringi(n.replace(/^(GeForce|Radeon)\s+/i, ''))
}
const MARCHE_RAM = { '802c': 'Micron', '2c00': 'Micron', '80ce': 'Samsung', ce00: 'Samsung', '80ad': 'SK hynix', ad00: 'SK hynix', '0198': 'Kingston', 9801: 'Kingston', '029e': 'Corsair', '9e02': 'Corsair', '04cd': 'G.Skill', cd04: 'G.Skill', '859b': 'Crucial', '9b85': 'Crucial' }
function nomeRam(r) {
  if (!r) return 'RAM'
  const m = String(r.marca ?? '').trim(), marca = MARCHE_RAM[m.toLowerCase()] ?? (/^[0-9a-f]{4}$/i.test(m) ? '' : m.split(' ')[0])
  return stringi([marca, r.tipo, r.gb && `${r.gb} GB`].filter(Boolean).join(' '))
}
const grande = (gb) => gb >= 1000 ? `${Math.round(gb / 1000)} TB` : `${gb} GB`
const MARCHE = { INTEL: 'Intel', SAMSUNG: 'Samsung', KINGSTON: 'Kingston', WDC: 'WD', WD: 'WD', TOSHIBA: 'Toshiba', SEAGATE: 'Seagate', CRUCIAL: 'Crucial', SANDISK: 'SanDisk', HITACHI: 'Hitachi', HGST: 'HGST', ADATA: 'ADATA', SK: 'SK' }
const INTEL_SSD = { SSDPEKNU: '670p', SSDPEKNW: '660p', SSDPEKKW: '760p', SSDPEKKF: '600p', SSDPEKKA: '7600p', SSDSC2KW: '545s', SSDSC2BW: '535' }
function nomeDisco(d) {
  if (!d) return ''
  let n = pulisci(d.nome).replace(/^(NVMe|ATA|SATA|SCSI)\s+/i, '').replace(/\s+(USB Device|SCSI Disk Device|Disk Device)$/i, '')
  n = n.split(' ').map((p) => MARCHE[p.toUpperCase()] ?? p).join(' ')
  const intel = /\b(SSD[A-Z0-9]{5})\w*/i.exec(n)
  if (intel && INTEL_SSD[intel[1].toUpperCase()]) n = n.replace(intel[0], INTEL_SSD[intel[1].toUpperCase()])
  // il codice del modello (lungo, o un numero esadecimale da quattro come «25A3» dei dischi USB) diventa la grandezza
  const parole = n.split(' '), ultima = parole.at(-1)
  if (parole.length > 1 && (/^[0-9A-F]{4}$/i.test(ultima) || (ultima.length >= 8 && /\d/.test(ultima) && /[A-Z]/i.test(ultima)))) parole.pop()
  return stringi(`${parole.join(' ')} ${grande(d.gb)}`)
}
const nomeWifi = (s) => stringi(pulisci(s).replace(/802\.11\S*|\bPCIe?\b|PCI-E|\bUSB\b|Adapter|Wireless|Network|Dual Band|Wi-?Fi( \d+E?)?|\bLAN\b|Controller|\d+MHz/gi, '').replace(/\s+/g, ' '))

// ── Steam: quale gioco è (dalla cartella dell'eseguibile) e il suo logo ──
function steam() {
  let base = 'C:/Program Files (x86)/Steam'
  try {
    const r = spawnSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8', windowsHide: true })
    base = /SteamPath\s+REG_SZ\s+(.+)/.exec(r.stdout ?? '')?.[1]?.trim() ?? base
  } catch {}
  const librerie = new Set([path.resolve(base).toLowerCase()])
  try { for (const m of fs.readFileSync(path.join(base, 'steamapps/libraryfolders.vdf'), 'utf8').matchAll(/"path"\s+"([^"]+)"/g)) librerie.add(path.resolve(m[1].replace(/\\\\/g, '\\')).toLowerCase()) } catch {}
  const giochi = []
  for (const lib of librerie) {
    let file = []
    try { file = fs.readdirSync(path.join(lib, 'steamapps')).filter((f) => /^appmanifest_\d+\.acf$/.test(f)) } catch { continue }
    for (const f of file) {
      try {
        const t = fs.readFileSync(path.join(lib, 'steamapps', f), 'utf8')
        const id = /"appid"\s+"(\d+)"/.exec(t)?.[1], nome = /"name"\s+"([^"]*)"/.exec(t)?.[1], dir = /"installdir"\s+"([^"]*)"/.exec(t)?.[1]
        if (id && dir) giochi.push({ id, nome, dir: path.join(lib, 'steamapps/common', dir).toLowerCase() + path.sep })
      } catch {}
    }
  }
  return { base, giochi }
}
function cercaFile(dir, nome, giu = 2) {
  try {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (d.isFile() && d.name.toLowerCase() === nome) return path.join(dir, d.name)
    }
    if (giu > 0) for (const d of fs.readdirSync(dir, { withFileTypes: true })) if (d.isDirectory()) { const f = cercaFile(path.join(dir, d.name), nome, giu - 1); if (f) return f }
  } catch {}
  return null
}
// le cartelle dei giochi degli altri negozi, e i programmi che a schermo intero non sono giochi
const GIOCHI = /\\(Epic Games|Riot Games|Battle\.net|Ubisoft Game Launcher\\games|EA Games|GOG Galaxy\\Games|XboxGames|Rockstar Games|Minecraft|osu!)\\/i
const NON_GIOCHI = /\\(chrome|msedge|firefox|opera|brave|vivaldi|vlc|mpc-hc64|mpc-be64|PotPlayerMini64|explorer|Discord|Code|CamoStudio|obs64|Spotify|powerpnt|WINWORD|EXCEL|Photoshop|Teams|Telegram|WhatsApp)\.exe$/i

// ── lo speedtest: cinque minuti da un posto, i cinque dopo da un altro; al massimo 2 s o 15 MB ──
// Il 21 Nov 2026 Cloudflare ci ha messo il limite: 3 download da 10 MB ogni minuto (1,8 GB l'ora) e i file grandi
// rispondevano «429 Too Many Requests» con un byte («0»), che si leggeva come se fosse il file («troppo poco, 3 byte») e il
// wi-fi restava senza numero. Adesso: si controlla la risposta; i posti si danno il cambio, così nessuno ci vede ogni
// cinque minuti; chi risponde male riposa 20 minuti e si passa subito al prossimo; Cloudflare al massimo 5 MB a richiesta
// (sopra risponde 429). Hetzner e OVH sono file grandi fatti per le prove di velocità: si legge per 2 s e si interrompe.
const FONTI = [
  { nome: 'Cloudflare', url: () => `https://speed.cloudflare.com/__down?bytes=5000000&r=${Math.random()}`, quanti: 3 },
  { nome: 'Hetzner', url: () => 'https://fsn1-speed.hetzner.com/100MB.bin', quanti: 1 },
  { nome: 'OVH', url: () => 'https://proof.ovh.net/files/100Mb.dat', quanti: 1 },
]
const MAX_BYTE = 15e6, MAX_MS = 2000, RIPOSO = 20 * 60000
const riposa = new Map() // posto → fino a quando non lo si usa (ha risposto male)
let turnoFonte = 0
async function provaFonte(f) {
  const ctl = new AbortController(), fine = setTimeout(() => ctl.abort(), MAX_MS)
  let byte = 0, primi = 0, primo = null, ultimo = null, errore = null
  await Promise.allSettled(Array.from({ length: f.quanti }, async () => {
    const r = await fetch(f.url(), { signal: ctl.signal, cache: 'no-store' })
    if (!r.ok) { errore = `${r.status} ${r.statusText}`; try { await r.body?.cancel() } catch {} return }
    for await (const c of r.body) {
      if (primo === null) { primo = performance.now(); primi = c.length } // (il tempo parte dal primo pezzo: quello non conta)
      byte += c.length; ultimo = performance.now()
      if (byte >= MAX_BYTE) { ctl.abort(); break }
    }
  }))
  clearTimeout(fine)
  const s = primo === null ? 0 : (ultimo - primo) / 1000
  if (errore && byte < 1e6) throw new Error(`${f.nome} risponde ${errore}`)
  if (byte < 1e6 || s < 0.05) throw new Error(`${f.nome}: troppo poco (${byte} byte in ${s.toFixed(2)} s)`)
  return (byte - primi) * 8 / s / 1e6
}
export async function speedtest(log) { // (esportata per provarla da sola)
  const n = FONTI.length
  for (let i = 0; i < n; i++) {
    const k = (turnoFonte + i) % n, f = FONTI[k]
    if ((riposa.get(f.nome) ?? 0) > Date.now()) continue
    try { const mbps = await provaFonte(f); turnoFonte = (k + 1) % n; return { mbps, fonte: f.nome } }
    catch (e) { riposa.set(f.nome, Date.now() + RIPOSO); log(`speedtest: ${e.message}, riposa 20 minuti`) }
  }
  throw new Error('nessun posto risponde (riprovo fra un minuto)')
}

export function creaMacchina({ qui, log, conf = {}, manda, vuole }) {
  const ICONE = path.join(qui, 'cache', 'app')
  const nascoste = (conf.nascoste ?? []).map((r) => new RegExp(r, 'i'))
  let ps = null, nv = null, info = null, infoPs = null, nomi = null, valori = {}, gpu = null, wifi = null, app = [], vista = new Map(), stm = null, stmAlle = 0
  const spentoDa = { ps: 0, nv: 0, wifi: 0 } // da quando non serve più (si spegne 15 s dopo; all'avvio è spento)
  let fraWifi = null, misurando = false, wifiRotto = null // (null: non ancora misurato; nel log va il primo esito e ogni cambio)

  // ── macchina-info.ps1 (una volta, poi esce) e il giro (macchina.cs → cache/macchina.exe; macchina.ps1 è il ripiego) ──
  // I moduli CIM/Storage/NetAdapter che leggono i componenti veri costano ~150 MB: se ne vanno con il processo che li
  // usa, invece di restare appesi a quello che misura cpu e ram per tutta la diretta.
  function leggiInfo() {
    if (info || infoPs) return
    infoPs = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(qui, 'macchina-info.ps1')], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
    const fraInfo = setTimeout(() => { try { infoPs?.kill() } catch {} }, 20000) // (una WMI che si pianta non deve restare lì)
    let resto = ''
    infoPs.stdout.setEncoding('utf8')
    infoPs.stdout.on('data', (t) => {
      resto += t
      const righe = resto.split(/\r?\n/); resto = righe.pop()
      for (const r of righe) if (r[0] === 'I') { try { const o = JSON.parse(r.slice(2)); if (o?.cpu || o?.dischi?.length) { info = o; faiNomi() } } catch {} }
    })
    infoPs.on('error', () => {})
    infoPs.on('close', () => { clearTimeout(fraInfo); infoPs = null })
  }
  let exeMacchina
  function aiutanteMacchina() {
    if (exeMacchina !== undefined) return exeMacchina
    const exe = path.join(qui, 'cache', 'macchina.exe'), cs = path.join(qui, 'macchina.cs'), csc = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
    try {
      const vecchio = fs.existsSync(exe) ? fs.statSync(exe).mtimeMs : 0
      if (!vecchio || fs.statSync(cs).mtimeMs > vecchio) {
        fs.mkdirSync(path.dirname(exe), { recursive: true })
        const r = spawnSync(csc, ['/nologo', '/target:exe', '/platform:x64', '/optimize+', `/out:${exe}`,
          '/reference:C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\System.Drawing.dll', cs], { stdio: 'ignore', windowsHide: true })
        if (r.status === 0 && fs.existsSync(exe)) log('macchina: aiutante compilato (niente più PowerShell)')
      }
      exeMacchina = fs.existsSync(exe) ? exe : null
    } catch (e) {
      log('macchina: aiutante non compilato (', e.message, '): uso macchina.ps1')
      exeMacchina = null
    }
    return exeMacchina
  }
  function accendiPs() {
    if (ps) return
    leggiInfo()
    const exe = aiutanteMacchina()
    ps = exe
      ? spawn(exe, [ICONE, String(process.pid)], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
      : spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(qui, 'macchina.ps1'), '-Icone', ICONE, '-Padre', String(process.pid)], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
    log('macchina: accesa (cpu, ram, dischi, temperatura, app)')
    let resto = ''
    ps.stdout.setEncoding('utf8')
    ps.stdout.on('data', (t) => {
      resto += t
      const righe = resto.split(/\r?\n/); resto = righe.pop()
      for (const r of righe) {
        const tipo = r[0], corpo = r.slice(2)
        try {
          if (tipo === 'M') valori = JSON.parse(corpo)
          else if (tipo === 'W') appArrivano(JSON.parse(corpo))
          else if (tipo === 'I') { const o = JSON.parse(corpo); if (o?.cpu || o?.dischi?.length) { info = o; faiNomi() } } // (una versione di prima lo mandava da qui)
        } catch {}
      }
    })
    ps.on('error', () => {})
    ps.on('close', () => { ps = null; valori = {}; try { infoPs?.kill() } catch {}; infoPs = null })
  }
  function faiNomi() {
    const o = conf.nomi ?? {}, d = info?.dischi ?? []
    // l'ssd è quello col sistema (il disco 0) se è un ssd; l'hdd il primo disco a piatti. config.json → pc.ssd / pc.hdd per sceglierne altri
    const ssd = d.find((x) => x.n === conf.ssd) ?? d.find((x) => x.tipo === 'SSD') ?? d[0]
    const hdd = d.find((x) => x.n === conf.hdd) ?? d.find((x) => x.tipo === 'HDD') ?? d.find((x) => x !== ssd)
    nomi = {
      cpu: o.cpu ?? nomeCpu(info?.cpu), gpu: o.gpu ?? nomeGpu(info?.gpu), ram: o.ram ?? nomeRam(info?.ram),
      ssd: o.ssd ?? nomeDisco(ssd), hdd: o.hdd ?? nomeDisco(hdd), wifi: o.wifi ?? nomeWifi(info?.wifi),
      dischi: { ssd: ssd?.n ?? null, hdd: hdd?.n ?? null }, fili: null, report: info?.report ?? null,
    }
    manda('pcnomi', nomi)
    log('macchina:', JSON.stringify({ ...nomi, report: undefined, dischi: undefined, fili: undefined }))
  }

  // ── le app aperte: in ordine di arrivo; i giochi col loro logo ──
  function gioco(a) {
    if (Date.now() - stmAlle > 300000 || !stm) { stm = steam(); stmAlle = Date.now() }
    const exe = a.exe.toLowerCase()
    const s = stm.giochi.find((g) => exe.startsWith(g.dir))
    if (s) {
      const logo = cercaFile(path.join(stm.base, 'appcache/librarycache', s.id), 'logo.png')
      return { steam: s.id, titolo: s.nome, logo: logo ? `/steam/${s.id}/logo.png` : null }
    }
    if (GIOCHI.test(a.exe) || (conf.giochi ?? []).some((g) => exe.endsWith(`\\${g.toLowerCase()}`)) || (a.intero && a.fg && !NON_GIOCHI.test(a.exe))) return { titolo: a.nome, logo: null }
    return null
  }
  function appArrivano(lista) {
    const ora = Date.now()
    for (const a of lista) if (!vista.has(a.id)) vista.set(a.id, ora)
    for (const k of vista.keys()) if (!lista.some((a) => a.id === k)) vista.delete(k)
    app = lista.filter((a) => !nascoste.some((r) => r.test(a.nome) || r.test(a.exe)))
      .map((a) => { const g = gioco(a); return { id: a.id, nome: a.nome, fg: a.fg, giu: a.giu, icona: a.icona ? `/app/${a.id}.png` : null, da: vista.get(a.id), ...(g ? { gioco: g } : {}) } })
      .sort((x, y) => x.da - y.da)
    manda('app', app)
  }

  // ── la scheda video ──
  function accendiNv() {
    if (nv) return
    nv = spawn('nvidia-smi', ['--query-gpu=utilization.gpu,temperature.gpu,fan.speed,power.draw,power.limit,memory.used,memory.total,clocks.current.graphics,clocks.current.memory', '--format=csv,noheader,nounits', '-lms', '500'], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
    let resto = ''
    nv.stdout.setEncoding('utf8')
    nv.stdout.on('data', (t) => {
      resto += t
      const righe = resto.split(/\r?\n/); resto = righe.pop()
      const r = righe.at(-1)?.split(',').map((x) => parseFloat(x))
      if (r && Number.isFinite(r[0])) {
        gpu = {
          uso: r[0],
          temp: Number.isFinite(r[1]) ? r[1] : null,
          ventola: Number.isFinite(r[2]) ? r[2] : null,
          potenza: Number.isFinite(r[3]) ? r[3] : null,
          limite: Number.isFinite(r[4]) ? r[4] : null,
          vram: Number.isFinite(r[5]) ? r[5] : null,
          vramTot: Number.isFinite(r[6]) ? r[6] : null,
          clock: Number.isFinite(r[7]) ? r[7] : null,
          clockMem: Number.isFinite(r[8]) ? r[8] : null,
        }
      }
    })
    nv.on('error', () => { log('macchina: nvidia-smi non c’è, niente scheda video') })
    nv.on('close', () => { nv = null; gpu = null })
  }

  // ── il wi-fi ──
  async function misuraWifi() {
    if (misurando) return
    misurando = true
    try {
      const { mbps, fonte } = await speedtest(log)
      wifi = { mbps: Math.round(mbps * 10) / 10, prima: wifi?.mbps ?? mbps, alle: Date.now(), fonte }
      if (wifiRotto !== false) log(`speedtest: ${wifiRotto ? 'di nuovo a posto' : 'ok'} (${fonte}, ${Math.round(mbps)} Mbps)`)
      wifiRotto = false
    } catch (e) { if (wifiRotto !== true) log('speedtest:', e.message); wifiRotto = true } finally { misurando = false } // (nel log una volta, non ogni minuto)
  }

  // ── chi serve, ogni secondo; e i valori alle pagine, 5 volte al secondo ──
  const serve = { ps: false, nv: false, wifi: false }
  setInterval(() => {
    const v = vuole(), ora = Date.now()
    for (const k of ['ps', 'nv', 'wifi']) {
      if (v[k]) spentoDa[k] = null
      else if (spentoDa[k] == null) spentoDa[k] = ora
      serve[k] = v[k] || ora - (spentoDa[k] ?? ora) < 15000
    }
    if (serve.ps) accendiPs(); else if (ps) { ps.kill(); ps = null; log('macchina: spenta') }
    if (serve.nv) accendiNv(); else if (nv) { nv.kill(); nv = null }
    if (serve.wifi && !fraWifi) { misuraWifi(); fraWifi = setInterval(misuraWifi, 300000) } else if (!serve.wifi && fraWifi) { clearInterval(fraWifi); fraWifi = null }
  }, 1000)
  setInterval(() => {
    if (!ps && !nv && !fraWifi) return
    manda('pc', { ...valori, gpu, wifi, t: Date.now() })
  }, 500)
  process.on('exit', () => { try { ps?.kill() } catch {} try { infoPs?.kill() } catch {} try { nv?.kill() } catch {} })

  return {
    // per chi si collega adesso
    saluta: (scrivi) => { if (nomi) scrivi('pcnomi', nomi); scrivi('app', app); if (ps || nv || fraWifi) scrivi('pc', { ...valori, gpu, wifi, t: Date.now() }) },
    // le icone delle app e i loghi di Steam
    servi(p, res, file) {
      let m = /^\/app\/([0-9a-f]{8})\.png$/.exec(p)
      if (m) { file(res, ICONE, `${m[1]}.png`, 'max-age=3600'); return true }
      m = /^\/steam\/(\d+)\/(logo\.png|header\.jpg|library_600x900\.jpg|library_hero\.jpg)$/.exec(p)
      if (m) {
        if (!stm) { stm = steam(); stmAlle = Date.now() }
        const f = cercaFile(path.join(stm.base, 'appcache/librarycache', m[1]), m[2])
        if (!f) { res.writeHead(404).end(); return true }
        file(res, path.dirname(f), path.basename(f), 'max-age=3600')
        return true
      }
      return false
    },
  }
}
