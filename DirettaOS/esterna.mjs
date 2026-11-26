// Diretta OS · Vista esterna: la webcam di un altro pc, in wifi.
//
// Il portatile apre una pagina servita da questo pc (https, perché i browser accendono la webcam solo su
// una connessione sicura) e basta: la pagina si collega da sola, senza codice, e manda i fotogrammi della
// sua webcam. Il pc non li salva: tiene solo l'ultimo, in memoria, e lo dà alle pagine di Camo come un
// flusso MJPEG.
//
// La porta di questa pagina è separata da quella della regia (2350, solo 127.0.0.1): qui ascoltano tutte
// le reti, ma ci sono solo la pagina del portatile, il collegamento e i fotogrammi. Niente regia, niente
// azioni, niente webcam di questo pc. I fotogrammi viaggiano con un cookie HttpOnly. Un portatile alla
// volta; il collegamento non scade e non si stacca da solo: se il portatile tace, la regia tiene l'ultimo
// fotogramma e aspetta che torni. Un altro portatile può prendere il posto solo se quello collegato è
// silenzioso da almeno un minuto.

import https from 'node:https'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const QUI = path.dirname(fileURLToPath(import.meta.url))
const MAX_FOTO = 3 * 1024 * 1024 // un JPEG 960 × 540 sta sotto i 200 kB: 3 MB è già tanto
const SENZA_FOTO = 8000 // dopo otto secondi senza fotogrammi il segnale è perso (ma il collegamento resta)
const SILENZIO_PRIMA_DI_CEDERE = 60e3 // un altro portatile può prendere il posto dopo un minuto di silenzio
const COOKIE = 'diretta_vista'
const DIMENTICA_COOKIE = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

const riga = (x, n) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n)
const nomeBuono = (x) => riga(x, 40) || 'Portatile'

function cookieDi(req) {
  const c = req.headers.cookie ?? ''
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(c)
  return m ? m[1] : null
}

function corpo(req, max) {
  return new Promise((ok, no) => {
    const pezzi = []
    let n = 0
    req.on('data', (d) => {
      n += d.length
      if (n > max) { no(new Error('troppo grande')); req.destroy(); return }
      pezzi.push(d)
    })
    req.on('end', () => ok(Buffer.concat(pezzi)))
    req.on('error', no)
  })
}

function uguale(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

function presenti(valore, elenco) {
  return elenco.every((x) => valore.includes(x))
}

// ── il certificato: fatto in casa, una volta, con PowerShell ──
// Il portatile vedrà l'avviso del browser (il certificato non è firmato da un'autorità): è il prezzo per
// avere la webcam su una pagina locale. La regia lo spiega. Quando cambia la rete, si rifà e l'avviso torna.
function certificato(host, ips, log) {
  const dir = path.join(QUI, 'cache')
  const pfx = path.join(dir, 'vista.pfx')
  const metaFile = path.join(dir, 'vista-cert.json')
  let meta = null
  try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')) } catch {}
  if (meta && fs.existsSync(pfx) && meta.host === host && presenti(meta.san ?? [], ips)) {
    try { return { pfx: fs.readFileSync(pfx), passphrase: meta.passphrase } } catch {}
  }
  if (process.platform !== 'win32') return null
  try {
    fs.mkdirSync(dir, { recursive: true })
    const passphrase = crypto.randomBytes(18).toString('hex')
    const san = ['DNS=localhost', `DNS=${host}`, 'IPAddress=127.0.0.1', ...ips.map((ip) => `IPAddress=${ip}`)].join('&')
    const ps = [
      "$ErrorActionPreference='Stop'",
      `$cert = New-SelfSignedCertificate -Subject 'CN=Diretta OS - Vista esterna' -TextExtension @('2.5.29.17={text}${san}', '2.5.29.37={text}1.3.6.1.5.5.7.3.1') -CertStoreLocation Cert:\\CurrentUser\\My -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(5) -FriendlyName 'Diretta OS - Vista esterna'`,
      `$pwd = ConvertTo-SecureString -String '${passphrase}' -Force -AsPlainText`,
      `Export-PfxCertificate -Cert $cert -FilePath '${pfx.replace(/'/g, "''")}' -Password $pwd | Out-Null`,
      "Remove-Item ('Cert:\\CurrentUser\\My\\' + $cert.Thumbprint)",
    ].join('\n')
    const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps], { windowsHide: true, encoding: 'utf8', timeout: 30000 })
    if (r.status !== 0 || !fs.existsSync(pfx)) {
      log('vista: certificato non fatto', (r.stderr || r.stdout || '').trim().slice(0, 240))
      return null
    }
    fs.writeFileSync(metaFile, JSON.stringify({ host, san: ips, passphrase }, null, 2))
    log('vista: certificato fatto per', host, ips.join(', '))
    return { pfx: fs.readFileSync(pfx), passphrase }
  } catch (e) {
    log('vista: certificato non fatto,', e.message)
    return null
  }
}

export function creaEsterna({ stato, salvato = {}, conf = {}, log = () => {}, diStato = () => {}, salva = () => {}, pubblico, sito, senzaRete = false }) {
  const PORTA = +process.env.DIRETTA_VISTA_PORTA || +conf.porta || 2371
  const S = salvato.esterna ?? {}
  const P = stato.esterna = {
    // quello che la regia e le pagine vedono (mai il token)
    collegata: false,
    segnale: 'assente', // assente | attesa | collegata | persa
    nome: nomeBuono(S.nome),
    specchia: !!S.specchia,
    adatta: S.adatta ?? true, // (la vista intera: se la webcam è 4:3 non taglia sopra e sotto)
    da: null,
    ip: null,
    fps: 0,
    w: 0,
    h: 0,
    ultimo: 0,
    host: os.hostname(),
    porta: PORTA,
    principale: null,
    indirizzi: [],
    https: null, // (true/false appena la porta prova ad aprirsi)
    motivo: null, // rete | cert | porta | spenta: perché la pagina non c'è
    rete: '',
  }
  let token = null // il segreto del portatile: sta solo qui e nel suo cookie
  let staccatoIp = null, staccatoFino = 0 // se la regia stacca, quel portatile non rientra da solo per un po'
  let foto = null, fotoT = 0, fotoW = 0, fotoH = 0
  let autoOnda = false // il primo fotogramma dopo il collegamento accende la vista da sola
  let eraInOnda = false // se il segnale cade, al ritorno torna com'era
  let viewers = new Set()
  let conteggio = 0, finestra = Date.now(), fps = 0
  let staleFra = null
  let serverRete = null, ultimoIndirizzi = ''

  const parla = (x) => { if (x !== P.segnale) { P.segnale = x; diStato() } }

  // ── gli indirizzi da aprire sul portatile (il nome del pc, e gli ip di ogni rete) ──
  // (prima il wifi, poi il cavo; le reti virtuali — Tailscale, VPN, macchine virtuali — solo se non c'è
  // altro: al portatile non servono e confondono il numero da scrivere)
  function indirizzi() {
    const host = os.hostname()
    const peso = (rete) => /wi-?fi|wlan|wireless/i.test(rete) ? 0 : /ethernet|lan/i.test(rete) ? 1 : /tailscale|vpn|wireguard|zerotier|virtual|vmware|hyper-v|vbox/i.test(rete) ? 3 : 2
    const tutte = []
    for (const [rete, lista] of Object.entries(os.networkInterfaces())) {
      for (const x of lista ?? []) {
        if (x.family === 'IPv4' && !x.internal && !x.address.startsWith('169.254') && !tutte.some((y) => y.ip === x.address)) tutte.push({ rete, ip: x.address })
      }
    }
    const vere = tutte.filter((x) => peso(x.rete) < 3)
    const ips = (vere.length ? vere : tutte).sort((a, b) => peso(a.rete) - peso(b.rete))
    const chiave = JSON.stringify([host, ips, PORTA])
    if (chiave === ultimoIndirizzi) return ips
    ultimoIndirizzi = chiave
    P.host = host
    P.porta = PORTA
    P.principale = ips.length ? `https://${host}:${PORTA}` : null
    P.indirizzi = ips.map((x) => ({ ...x, url: `https://${x.ip}:${PORTA}` }))
    P.rete = ips.map((x) => x.rete).filter((x, i, a) => a.indexOf(x) === i).join(' · ')
    diStato()
    return ips
  }

  // ── la coppia: automatica, senza codice ──
  // Il primo portatile che apre il link prende il posto. Chi ha già il cookie del collegamento rientra
  // sempre (anche dopo un riavvio del server). Un altro portatile può prendere il posto solo se quello
  // collegato è silenzioso da un minuto: così una scheda chiusa non blocca la vista per sempre.
  function liberoPerAltri() {
    if (!token) return true
    const base = fotoT || P.da || 0
    return P.segnale === 'persa' && Date.now() - base > SILENZIO_PRIMA_DI_CEDERE
  }

  function stacca(da) {
    const cera = P.collegata
    const ipPrima = P.ip
    token = null
    foto = null; fotoT = 0; fotoW = 0; fotoH = 0
    P.collegata = false
    P.da = null
    P.ip = null
    P.fps = 0; P.w = 0; P.h = 0; P.ultimo = 0
    autoOnda = false; eraInOnda = false
    // se a staccare è la regia, il portatile non deve rientrare da solo: aspetta che qualcuno
    // prema «Ricollega» sulla sua pagina (o che passino cinque minuti)
    if (da !== 'il portatile' && ipPrima) {
      staccatoIp = ipPrima
      staccatoFino = Date.now() + 5 * 60e3
    }
    parla('assente')
    if (stato.attivi.esterna) { stato.attivi.esterna = false }
    if (Array.isArray(stato.viaPrima)) stato.viaPrima = stato.viaPrima.filter((p) => p !== 'esterna')
    diStato(); salva()
    if (cera) log(`vista: portatile staccato (${da})`)
  }

  const nomeDi = (x) => (x ?? '').replace('::ffff:', '')

  // ── il flusso MJPEG per Camo e per la regia ──
  function quadro(req, res) {
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=dx',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    if (foto) res.write(parte(foto))
    const c = { res, fermo: false }
    viewers.add(c)
    res.on('drain', () => { c.fermo = false })
    req.on('close', () => viewers.delete(c))
  }
  const parte = (buf) => Buffer.concat([
    Buffer.from(`--dx\r\nContent-Type: image/jpeg\r\nContent-Length: ${buf.length}\r\n\r\n`),
    buf,
    Buffer.from('\r\n'),
  ])
  function mandaFoto(buf) {
    if (!viewers.size) return
    const p = parte(buf)
    for (const c of viewers) {
      if (c.fermo || c.res.writableEnded || c.res.destroyed) continue
      if (!c.res.write(p)) c.fermo = true
    }
  }

  function anteprima(res) {
    if (!foto) { res.writeHead(503, { 'Cache-Control': 'no-store' }).end(); return }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Foto': String(fotoT) }).end(foto)
  }

  // ── il server del portatile: tutte le reti, solo la sua pagina e i suoi api ──
  const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' }
  function file(res, base, rel, cache = 'no-store') {
    const f = path.join(base, path.normalize(rel).replace(/^([/\\]|\.\.)+/, ''))
    if (!f.startsWith(base)) { res.writeHead(403).end(); return }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('non c’è'); return }
      res.writeHead(200, { 'Content-Type': TIPI[path.extname(f).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': cache }).end(d)
    })
  }

  function risposta(res, n, dati, extra = {}) {
    const t = typeof dati === 'string' ? dati : JSON.stringify(dati)
    res.writeHead(n, { 'Content-Type': typeof dati === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }).end(t)
  }

  async function lan(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=()')
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; script-src 'self'; style-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
    const u = new URL(req.url, 'https://x')
    let p
    try { p = decodeURIComponent(u.pathname) } catch { res.writeHead(400).end(); return }
    const ip = nomeDi(req.socket.remoteAddress)

    // la pagina del portatile e i suoi file
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (p === '/' || p === '/vista' || p === '/vista/') return file(res, pubblico, 'vista.html')
      if (p === '/vista.css' || p === '/vista.js' || p === '/logo.svg') return file(res, pubblico, p.slice(1))
      if (p.startsWith('/fonts/') && p.endsWith('.woff2')) return file(res, sito, p, 'max-age=86400')
    }

    // lo stato per la pagina del portatile (niente token: un altro dispositivo sulla rete non vede
    // né il nome né la webcam; sa solo se il posto è occupato)
    if (p === '/api/stato' && req.method === 'GET') {
      const mio = !!token && uguale(cookieDi(req) ?? '', token)
      return risposta(res, 200, {
        collegata: P.collegata && mio,
        occupato: !mio && !liberoPerAltri(),
        libero: !token || liberoPerAltri(),
        segnale: mio ? P.segnale : 'assente',
        nome: mio ? P.nome : '',
        inOnda: !!stato.attivi.esterna,
        fps: mio ? P.fps : 0, w: mio ? P.w : 0, h: mio ? P.h : 0,
        ultimo: mio ? P.ultimo : 0,
        ora: Date.now(),
      })
    }

    // il collegamento automatico: apri il link, e questo portatile prende il posto
    if (p === '/api/collega' && req.method === 'POST') {
      let a = {}
      try { a = JSON.parse((await corpo(req, 4096)).toString('utf8') || '{}') } catch {}
      const mio = !!token && uguale(cookieDi(req) ?? '', token)
      const bloccato = !mio && staccatoIp && ip === staccatoIp && Date.now() < staccatoFino
      if (bloccato && a.forza !== true) {
        return risposta(res, 409, { ok: false, bloccato: true, dice: 'staccato dalla regia' })
      }
      if (bloccato) { staccatoIp = null; staccatoFino = 0 } // (ha premuto «Ricollega»: si rientra)
      if (!mio && !liberoPerAltri()) {
        return risposta(res, 409, { ok: false, occupato: true, nome: P.nome, dice: 'c’è già un portatile collegato' })
      }
      if (!mio) {
        if (token) log('vista: il portatile silenzioso lascia il posto a un altro')
        staccatoIp = null; staccatoFino = 0
        token = crypto.randomBytes(24).toString('base64url')
        P.collegata = true
        P.nome = nomeBuono(a.nome)
        P.ip = ip
        P.da = Date.now()
        P.ultimo = 0
        P.fps = 0; P.w = 0; P.h = 0
        foto = null; fotoT = 0; fotoW = 0; fotoH = 0
        autoOnda = true
        eraInOnda = false
        parla('collegata')
        log(`vista: collegato «${P.nome}» (${ip})`)
        diStato(); salva()
      } else {
        P.collegata = true
        if (P.segnale === 'assente') parla('collegata')
      }
      return risposta(res, 200, { ok: true, nome: P.nome, inOnda: !!stato.attivi.esterna }, { 'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000` })
    }

    // un fotogramma: solo col cookie del portatile collegato
    if (p === '/api/fotogramma' && req.method === 'POST') {
      if (req.headers['x-diretta'] !== 'vista') return risposta(res, 400, { ok: false, dice: 'richiesta non valida' })
      if (!token || !uguale(cookieDi(req) ?? '', token)) return risposta(res, 401, { ok: false, dice: 'non sei collegato' })
      if (P.ip !== ip) { P.ip = ip; diStato() } // (se il portatile cambia indirizzo, la regia lo sa)
      if (!/image\/jpeg/i.test(req.headers['content-type'] ?? '')) return risposta(res, 415, { ok: false, dice: 'serve un JPEG' })
      let b
      try { b = await corpo(req, MAX_FOTO) } catch { return risposta(res, 413, { ok: false, dice: 'fotogramma troppo grande' }) }
      if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return risposta(res, 400, { ok: false, dice: 'non è un JPEG' })
      const w = Math.min(4096, Math.max(1, +u.searchParams.get('w') || 0))
      const h = Math.min(4096, Math.max(1, +u.searchParams.get('h') || 0))
      foto = b; fotoT = Date.now(); fotoW = w; fotoH = h
      P.ultimo = fotoT; P.w = w; P.h = h
      conteggio += 1
      if (fotoT - finestra >= 1000) {
        fps = Math.round(conteggio * 1000 / (fotoT - finestra))
        conteggio = 0; finestra = fotoT
        P.fps = fps
        diStato()
      }
      if (P.segnale === 'persa') { // è tornato: se era in onda, torna in onda
        parla('collegata')
        if (eraInOnda && token && !stato.via) { stato.attivi.esterna = true; log('vista: segnale tornato, di nuovo in onda') }
        eraInOnda = false
        salva(); diStato()
      }
      if (autoOnda && !stato.via) {
        autoOnda = false
        if (!stato.attivi.esterna) {
          stato.attivi.esterna = true
          log('vista: primo fotogramma, in onda')
          salva(); diStato()
        }
      }
      mandaFoto(b)
      res.writeHead(204, { 'Cache-Control': 'no-store' }).end()
      return
    }

    // il portatile si stacca da solo (o l'ha staccato il pc: il cookie non vale più)
    if (p === '/api/stacco' && req.method === 'POST') {
      if (token && uguale(cookieDi(req) ?? '', token)) stacca('il portatile')
      return risposta(res, 200, { ok: true }, { 'Set-Cookie': DIMENTICA_COOKIE })
    }

    // il portatile chiede se è ancora collegato (la pagina lo fa ogni due secondi)
    if (p === '/api/batti' && req.method === 'POST') {
      if (!token || !uguale(cookieDi(req) ?? '', token)) return risposta(res, 401, { ok: false, collegata: false })
      return risposta(res, 200, { ok: true, collegata: true, inOnda: !!stato.attivi.esterna, segnale: P.segnale, nome: P.nome })
    }

    res.writeHead(404, { 'Cache-Control': 'no-store' }).end()
  }

  let avviato = false, reteFra = null, dettoRete = ''
  function avvia() {
    if (avviato) return
    avviato = true
    indirizzi(); setInterval(indirizzi, 60000)
    if (senzaRete) { P.https = false; P.motivo = 'spenta'; diStato(); log('vista: spenta (--senza-vista)'); return }
    staleFra = setInterval(() => {
      if (!P.collegata) return
      const base = fotoT || P.da || Date.now()
      const fermo = Date.now() - base
      if (P.segnale === 'collegata' && fermo > SENZA_FOTO) {
        parla('persa')
        eraInOnda = !!stato.attivi.esterna
        if (stato.attivi.esterna) { stato.attivi.esterna = false }
        log('vista: segnale perso (il collegamento resta aperto: aspetto che torni)')
        salva(); diStato()
      }
      // (niente stacco automatico: il portatile può dormire, cambiare rete o riaprire la scheda;
      //  quando torna, i fotogrammi riprendono e la vista torna in onda da sola)
    }, 1500)
    provaRete()
  }
  function provaRete() {
    clearTimeout(reteFra); reteFra = null
    if (serverRete || P.https === true) return
    const ips = indirizzi().map((x) => x.ip)
    if (!ips.length) {
      P.https = false; P.motivo = 'rete'; diStato()
      if (dettoRete !== 'rete') { dettoRete = 'rete'; log('vista: nessuna rete: la pagina del portatile si apre appena il pc si collega') }
      reteFra = setTimeout(provaRete, 10000)
      return
    }
    const cert = certificato(P.host, ips, log)
    if (!cert) {
      P.https = false; P.motivo = 'cert'; diStato()
      if (dettoRete !== 'cert') { dettoRete = 'cert'; log(`vista: la pagina del portatile non si apre (serve https per la webcam): ${P.principale ?? `porta ${PORTA}`}`) }
      reteFra = setTimeout(provaRete, 30000)
      return
    }
    try {
      const s = https.createServer(cert, (req, res) => { lan(req, res).catch((e) => { log('vista:', e.message); try { res.writeHead(500).end() } catch {} }) })
      serverRete = s
      s.on('error', (e) => {
        P.https = false; P.motivo = 'porta'; diStato()
        if (dettoRete !== 'porta') { dettoRete = 'porta'; log(`vista: la porta ${PORTA} non si apre (${e.code ?? e.message})`) }
        try { s.close() } catch {}
        serverRete = null
        reteFra = setTimeout(provaRete, 30000)
      })
      s.listen(PORTA, '0.0.0.0', () => {
        P.https = true; P.motivo = null; dettoRete = ''
        log(`vista: il portatile si collega da ${P.principale}${P.indirizzi.length > 1 ? ` (o ${P.indirizzi.map((x) => x.url).join(' · ')})` : ''}`)
        diStato()
      })
    } catch (e) {
      P.https = false; P.motivo = 'porta'; log('vista:', e.message); diStato()
      reteFra = setTimeout(provaRete, 30000)
    }
  }

  // ── quello che chiede la regia ──
  function azione(a) {
    // (il collegamento è automatico: «apri», «chiudi» e «nuovoCodice» restano accettati, ma non c'è
    // più niente da aprire o da generare)
    if (a.cosa === 'apri' || a.cosa === 'chiudi' || a.cosa === 'nuovoCodice') {
      if (!P.collegata) parla('assente')
      diStato()
      return true
    }
    if (a.cosa === 'stacca') { stacca('la regia'); return true }
    if (typeof a.nome === 'string') { P.nome = nomeBuono(a.nome); diStato(); salva(); return true }
    if (typeof a.specchia === 'boolean') { P.specchia = a.specchia; diStato(); salva(); return true }
    if (typeof a.adatta === 'boolean') { P.adatta = a.adatta; diStato(); salva(); return true }
    return false
  }

  // ── le rotte del server di sempre (127.0.0.1): il flusso per Camo e l'anteprima per la regia ──
  function serviLocale(req, res, p) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return false
    if (p === '/api/esterna/quadro') { quadro(req, res); return true }
    if (p === '/api/esterna/anteprima.jpg') { anteprima(res); return true }
    return false
  }

  return {
    avvia,
    azione,
    serviLocale,
    stato: P,
    indirizzi,
    salvaDati: () => ({ nome: P.nome, specchia: P.specchia, adatta: P.adatta }),
    annullaAuto: () => { autoOnda = false; eraInOnda = false },
    collegata: () => P.collegata,
    chiudi: () => { try { serverRete?.close() } catch {} },
  }
}
