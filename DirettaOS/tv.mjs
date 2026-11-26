// Diretta OS · la tv in rete. Trova la TV (LG webOS, via Cast/eureka) e le fa aprire il canale /tv nel suo browser.
//
// La TV LG si comanda con SSAP su wss://<tv>:3001 (certificato suo, quindi TLS senza verifica per quel solo socket).
// Il primo accoppiamento può chiedere il permesso sulla TV; la chiave resta in cache/tv-lg-key.json e dopo non chiede più.
// Se la TV risponde «404 no such service or method» a tutto, sul televisore manca «LG Connect Apps»:
//   Impostazioni → Rete → LG Connect Apps → On.
//
// La scoperta non fa una scansione di tutta la /16: guarda la TV configurata, la tabella ARP e le /24 di questa macchina.
// Una TV che risponde a Google Cast si presenta da sola su http://<ip>:8008/setup/eureka_info.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import net from 'node:net'
import tls from 'node:tls'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const PORTA_CANALE = 2360
const TIMEOUT_EUREKA = 1200
const MAX_SCANSIONE = 64

function httpJson(host, porta, percorso, ms = TIMEOUT_EUREKA) {
  return new Promise((ok) => {
    let fatto = false
    const fine = (v) => { if (fatto) return; fatto = true; ok(v) }
    const req = http.get({ host, port: porta, path: percorso, timeout: ms, headers: { Accept: 'application/json' } }, (res) => {
      let t = ''
      res.setEncoding('utf8')
      res.on('data', (d) => { t += d; if (t.length > 200000) req.destroy() })
      res.on('end', () => { try { fine(JSON.parse(t)) } catch { fine(null) } })
    })
    req.on('error', () => fine(null))
    req.on('timeout', () => { req.destroy(); fine(null) })
  })
}

function ipv4Locali() {
  return Object.values(os.networkInterfaces()).flat().filter((x) => x && x.family === 'IPv4' && !x.internal && !x.address.startsWith('169.254')).map((x) => x.address)
}
function viciniArp() {
  try {
    const t = execFileSync('arp', ['-a'], { encoding: 'utf8', windowsHide: true })
    return [...t.matchAll(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/g)].map((m) => m[1])
  } catch { return [] }
}
function basi24() {
  const b = new Set()
  for (const ip of [...ipv4Locali(), ...viciniArp()]) {
    const m = /^(\d+\.\d+\.\d+)\.\d+$/.exec(ip)
    if (m) b.add(m[1])
  }
  return [...b]
}

// ── mini client WebSocket over TLS: serve solo per i messaggi JSON di LG, niente dipendenze ──
export class WsTls {
  constructor(host, porta = 3001) { this.host = host; this.porta = porta; this.s = null; this.rbuf = Buffer.alloc(0); this.pending = new Map(); this.n = 0; this.registrazione = null; this.chiuso = false }
  connect(ms = 8000) {
    return new Promise((ok, no) => {
      const key = crypto.randomBytes(16).toString('base64')
      let fatto = false, shake = false, buf = Buffer.alloc(0)
      const fine = (e) => { if (fatto) return; fatto = true; if (e) { try { this.s?.destroy() } catch {} ; no(e) } else ok() }
      const s = tls.connect({ host: this.host, port: this.porta, rejectUnauthorized: false })
      this.s = s
      const timer = setTimeout(() => fine(new Error('la TV non risponde')), ms)
      s.once('secureConnect', () => {
        s.write(`GET / HTTP/1.1\r\nHost: ${this.host}:${this.porta}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`)
      })
      s.on('data', (d) => {
        buf = buf.length ? Buffer.concat([buf, d]) : d
        if (!shake) {
          const i = buf.indexOf('\r\n\r\n')
          if (i < 0) return
          const testa = buf.subarray(0, i).toString('latin1')
          buf = buf.subarray(i + 4)
          if (!/^HTTP\/1\.1 101/.test(testa)) return fine(new Error('la TV ha rifiutato WebSocket: ' + testa.split('\r\n')[0]))
          shake = true; clearTimeout(timer); fine()
          if (buf.length) this._frame(buf)
        } else this._frame(d)
      })
      s.on('error', (e) => fine(e))
      s.on('close', () => { this.chiuso = true; for (const p of this.pending.values()) p.no(new Error('la TV ha chiuso')); this.pending.clear(); if (!fatto) fine(new Error('la TV ha chiuso')) })
    })
  }
  _frame(chunk) {
    this.rbuf = this.rbuf.length ? Buffer.concat([this.rbuf, chunk]) : chunk
    for (;;) {
      if (this.rbuf.length < 2) return
      const b0 = this.rbuf[0], b1 = this.rbuf[1]
      const fin = !!(b0 & 0x80), op = b0 & 0x0f, masked = !!(b1 & 0x80)
      let len = b1 & 0x7f, off = 2
      if (len === 126) { if (this.rbuf.length < 4) return; len = this.rbuf.readUInt16BE(2); off = 4 }
      else if (len === 127) { if (this.rbuf.length < 10) return; const big = this.rbuf.readBigUInt64BE(2); if (big > 4_000_000n) { this.close(); return } len = Number(big); off = 10 }
      let mask = null
      if (masked) { if (this.rbuf.length < off + 4) return; mask = this.rbuf.subarray(off, off + 4); off += 4 }
      if (this.rbuf.length < off + len) return
      const payload = Buffer.from(this.rbuf.subarray(off, off + len))
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3]
      this.rbuf = this.rbuf.subarray(off + len)
      if (op === 0x8) { this.close(); return }
      if (op === 0x9) { this._sendFrame(payload, 0xa); continue }
      if (op === 0xa) continue
      if (op === 0x1 || op === 0x0) {
        if (!fin) { this._frag = (this._frag ?? Buffer.alloc(0)); this._frag = Buffer.concat([this._frag, payload]); continue }
        const completo = op === 0x0 && this._frag ? Buffer.concat([this._frag, payload]) : payload
        this._frag = null
        this._messaggio(completo.toString('utf8'))
      }
    }
  }
  _sendFrame(payload, op = 0x1) {
    if (!this.s || this.chiuso) return
    const len = payload.length
    let testa
    if (len < 126) testa = Buffer.from([0x80 | op, 0x80 | len])
    else if (len < 65536) { testa = Buffer.alloc(4); testa[0] = 0x80 | op; testa[1] = 0x80 | 126; testa.writeUInt16BE(len, 2) }
    else { testa = Buffer.alloc(10); testa[0] = 0x80 | op; testa[1] = 0x80 | 127; testa.writeBigUInt64BE(BigInt(len), 2) }
    const mask = crypto.randomBytes(4), x = Buffer.alloc(len)
    for (let i = 0; i < len; i++) x[i] = payload[i] ^ mask[i & 3]
    try { this.s.write(Buffer.concat([testa, mask, x])) } catch {}
  }
  _messaggio(t) {
    let m
    try { m = JSON.parse(t) } catch { return }
    if (m.type === 'registered') { const k = m.payload?.['client-key']; const r = this.registrazione; this.registrazione = null; if (r) r.ok(k ?? null); return }
    if (m.type === 'error' && m.id === 'reg') { const r = this.registrazione; this.registrazione = null; if (r) r.no(new Error(m.error ?? 'accoppiamento rifiutato')); return }
    if (m.id && this.pending.has(m.id)) {
      const p = this.pending.get(m.id); this.pending.delete(m.id)
      if (m.type === 'error') p.no(new Error(m.error ?? 'errore della TV'))
      else p.ok(m.payload ?? {})
    }
  }
  send(o) { this._sendFrame(Buffer.from(JSON.stringify(o))) }
  request(method, payload = {}, ms = 8000) {
    const id = 'd' + (++this.n)
    return new Promise((ok, no) => {
      const timer = setTimeout(() => { this.pending.delete(id); no(new Error('la TV non risponde')) }, ms)
      this.pending.set(id, { ok: (v) => { clearTimeout(timer); ok(v) }, no: (e) => { clearTimeout(timer); no(e) } })
      this.send({ id, type: 'request', method, payload })
    })
  }
  register(manifest, key = null, ms = 20000) {
    const payload = { forcePairing: false, pairingType: 'PROMPT', manifest }
    if (key) payload['client-key'] = key
    const id = 'reg'
    return new Promise((ok, no) => {
      const timer = setTimeout(() => { this.registrazione = null; no(new Error('nessuna risposta all’accoppiamento (guardia la TV)')) }, ms)
      this.registrazione = { ok: (k) => { clearTimeout(timer); ok(k) }, no: (e) => { clearTimeout(timer); no(e) } }
      this.send({ id, type: 'register', payload })
    })
  }
  close() {
    if (this.chiuso) return
    this.chiuso = true
    try { this._sendFrame(Buffer.alloc(0), 0x8) } catch {}
    try { this.s?.end() } catch {}
    try { this.s?.destroy() } catch {}
  }
}

const PERMESSI = ['LAUNCH','LAUNCH_WEBAPP','APP_TO_APP','CLOSE','TEST_OPEN','TEST_PROTECTED','CONTROL_AUDIO','CONTROL_DISPLAY','CONTROL_INPUT_JOYSTICK','CONTROL_INPUT_MEDIA_RECORDING','CONTROL_INPUT_MEDIA_PLAYBACK','CONTROL_INPUT_TV','CONTROL_POWER','CONTROL_TV_SCREEN','READ_APP_STATUS','READ_CURRENT_CHANNEL','READ_INPUT_DEVICE_LIST','READ_NETWORK_STATE','READ_RUNNING_APPS','READ_TV_CHANNEL_LIST','WRITE_NOTIFICATION_TOAST','READ_POWER_STATE','READ_COUNTRY_INFO','READ_SETTINGS','CONTROL_INPUT_TEXT','CONTROL_MOUSE_AND_KEYBOARD','WRITE_SETTINGS','WRITE_NOTIFICATION_ALERT','READ_INSTALLED_APPS','READ_UPDATE_INFO','READ_TV_BROWSER','CONTROL_TV_BROWSER']
export const MANIFEST = { manifestVersion: 1, appVersion: '1.0', appId: 'com.diretta.os', vendorId: 'com.diretta.os', permissions: PERMESSI }

export function creaTv({ qui, conf = {}, log, stato, salva, diStato, urlCanale = () => `http://127.0.0.1:${PORTA_CANALE}/` }) {
  const FILE_CHIAVE = path.join(qui, 'cache', 'tv-lg-key.json')
  let chiave = null, tv = null
  try { const j = JSON.parse(fs.readFileSync(FILE_CHIAVE, 'utf8')); chiave = j.key ?? null; tv = j.ip ? { ip: j.ip, nome: j.nome ?? null, modello: j.modello ?? null } : null } catch {}
  const salvaChiave = () => { try { fs.mkdirSync(path.dirname(FILE_CHIAVE), { recursive: true }); fs.writeFileSync(FILE_CHIAVE, JSON.stringify({ ip: tv?.ip ?? null, nome: tv?.nome ?? null, modello: tv?.modello ?? null, key: chiave }, null, 2)) } catch {} }
  Object.assign(stato.tv, {
    ip: tv?.ip ?? conf.ip ?? stato.tv.ip ?? null,
    nome: tv?.nome ?? conf.nome ?? stato.tv.nome ?? null,
    modello: tv?.modello ?? stato.tv.modello ?? null,
    cercando: false, errore: null, aperta: 0, metodo: null,
  })
  const metti = (x) => { tv = x; stato.tv.ip = x.ip; stato.tv.nome = x.nome; stato.tv.modello = x.modello; salvaChiave(); salva(); diStato() }

  async function eureka(ip) {
    const j = await httpJson(ip, 8008, '/setup/eureka_info')
    if (!j || !j.name) return null
    const nome = String(j.name)
    if (!/webos|lg|tv|cast/i.test(nome)) return null
    return { ip, nome, modello: (/\[LG\]\s*webOS TV\s*([^"]+)/i.exec(nome)?.[1] ?? nome).trim() }
  }

  async function cerca() {
    if (stato.tv.cercando) return stato.tv
    stato.tv.cercando = true; stato.tv.errore = null; diStato()
    try {
      const candidati = [...new Set([conf.ip, stato.tv.ip, ...viciniArp(), ...ipv4Locali()].filter(Boolean))]
      for (const ip of candidati) { const x = await eureka(ip); if (x) { metti(x); log('tv: trovata', x.nome, x.ip); return stato.tv } }
      // le /24 vicine: quella del pc e quelle viste in ARP (la tv può stare su un'altra /24 della stessa rete)
      const basi = basi24()
      const ips = basi.flatMap((b) => Array.from({ length: 254 }, (_, i) => `${b}.${i + 1}`))
      let i = 0
      const operaio = async () => { while (i < ips.length) { const ip = ips[i++]; if (candidati.includes(ip)) continue; const x = await eureka(ip); if (x) { metti(x); log('tv: trovata', x.nome, x.ip); return } } }
      await Promise.all(Array.from({ length: MAX_SCANSIONE }, operaio))
      stato.tv.errore = 'TV non trovata in rete: accendila e controlla che sia sulla stessa Wi-Fi'
      log('tv:', stato.tv.errore)
      return stato.tv
    } finally { stato.tv.cercando = false; diStato() }
  }

  async function apriLg(ip, url) {
    const ws = new WsTls(ip, 3001)
    await ws.connect(10000)
    try {
      const k = await ws.register(MANIFEST, chiave)
      if (k && k !== chiave) { chiave = k; salvaChiave() }
      const prove = [
        ['ssap://system.launcher/open', { target: url }],
        ['ssap://system.launcher/launch', { id: 'com.webos.app.browser', params: { target: url } }],
        ['ssap://com.webos.applicationManager/launch', { id: 'com.webos.app.browser', params: { target: url } }],
      ]
      let ultimo = null
      for (const [metodo, payload] of prove) {
        try { const r = await ws.request(metodo, payload, 7000); return { metodo, risposta: r } } catch (e) { ultimo = e }
      }
      throw ultimo ?? new Error('la TV non ha aperto il browser')
    } finally { ws.close() }
  }

  let riprovaFra = null, tentativi = 0
  function fermaRiprove() { if (riprovaFra) { clearTimeout(riprovaFra); riprovaFra = null } }
  async function tenta(canale) {
    if (!stato.tv.ip) await cerca()
    if (!stato.tv.ip) { stato.tv.errore = 'prima trova la TV'; diStato(); return false }
    const url = urlCanale(canale)
    stato.tv.errore = null; stato.tv.metodo = null; diStato()
    try {
      const r = await apriLg(stato.tv.ip, url)
      fermaRiprove(); tentativi = 0
      stato.tv.aperta = Date.now(); stato.tv.metodo = r.metodo
      log('tv: canale aperto sul browser', url, 'con', r.metodo)
      return true
    } catch (e) {
      const msg = String(e?.message ?? e)
      const servizi = /404 no such service|401 insufficient/i.test(msg)
      stato.tv.errore = servizi
        ? 'La TV non lascia comandare il browser: accendi Impostazioni → Rete → LG Connect Apps. Riprovo da solo per un po’…'
        : `Non riesco ad aprire la TV: ${msg}`
      if (tentativi === 0 || tentativi % 5 === 0) log('tv:', stato.tv.errore)
      // (se è solo il permesso della TV, riprova da solo: quando lo accendi, il canale si apre senza premere altro)
      if (servizi && tentativi < 30) {
        tentativi++
        riprovaFra = setTimeout(() => { riprovaFra = null; tenta(canale) }, 20000)
      }
      return false
    } finally { diStato() }
  }
  async function apri(canale = 'tv') { fermaRiprove(); tentativi = 0; return tenta(canale) }

  setTimeout(() => { if (!stato.tv.nome) cerca() }, 4000)
  return { cerca, apri, stato: () => stato.tv }
}
