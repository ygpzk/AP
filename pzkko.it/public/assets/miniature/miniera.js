// miniature/miniera.js — Miniera: la cattura vera dell'app singola (la finestra «Miniera · pzk os» col suo lcd e i tasti
// arancioni) con l'lcd che torna vivo. Sull'lcd c'è pzk os com'è: l'arancione retroilluminato, il carattere 5 × 7 di
// telefono/zero/os/font.js (con lo Scale2x), la tavolozza a 8 bit di lcd.js, e le postazioni vere disegnate da
// chat/miniera-pixel.js coi pezzi dei PC pronti di chat/miniera-dati.mjs. Il giro: la postazione che mina (i $pzk maturati
// crescono, la barra della memoria si riempie), OK incassa (le monete escono dallo schermo), i pc pronti, la scheda del
// prossimo, «compra e monta», e la postazione nuova si monta pixel per pixel: dal muletto da ufficio alla centrale della
// lumaca. Lo schermo del miner sulle scrivanie fa scorrere il suo grafico. Col mouse sopra: ↓ «la guardi grande», la
// postazione a tutto schermo e la telecamera che ci entra.
import { colore, rgb } from '../../telefono/zero/os/lcd.js'
import { glifo } from '../../telefono/zero/os/font.js'
import * as P from '../../chat/miniera-pixel.js'
import { PRONTI, PER_ID, CATEGORIE } from '../../chat/miniera-dati.mjs'

const W = 256, H = 128, D = 2, PW = W * D, PH = H * D
// la cattura: l'lcd in frazioni del fotogramma 1280 × 720, e i tasti
const LCD = { x: 248 / 1280, y: 134 / 720, w: 784 / 1280, h: 392 / 720 }
const TASTI = { ok: [1010, 596, 32], indietro: [944, 596, 22], giu: [285, 628, 15], dx: [317, 595, 15] }
// i conti della miniera (gli stessi numeri di chat/miniera.js)
const COSTANTE = 0.25, SOGLIA = 80, AMBIENTE = 30, GRADI = 45, MASSIMA = 110, CALO = 0.02, EFF_MIN = 0.4
const DISSIPATORE = { stock: 0, torre: 25, liquido: 60 }
const MULTIPLA = Object.fromEntries(CATEGORIE.map((k) => [k.id, k.multipla]))
const PASSO_GIRO = 11.5 // secondi per ogni PC: mina, incassa, pc pronti, scheda, monta

const fmt = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 1, useGrouping: 'always' })
function fmtCorto(n) {
  const a = Math.abs(n)
  if (a < 1000) return fmt(a)
  const U = [['K', 1e3], ['M', 1e6], ['B', 1e9]]
  const [s, v] = U.findLast(([, v]) => a >= v)
  return `${fmt(Math.round((a / v) * 10) / 10)}${s}`
}
const perOra = (n) => `${fmtCorto(Math.round(n * 10) / 10)} $pzk/ora`

function posto(m, cat) {
  const v = m?.[cat], id = typeof v === 'string' ? v : v?.id, x = PER_ID[id]
  if (!x) return null
  return { id, x, n: MULTIPLA[cat] ? Math.max(1, v?.n ?? 1) : 1 }
}
function calcola(m) {
  const p = (c) => posto(m, c)
  const cpu = p('cpu'), gpu = p('gpu'), kase = p('case'), vent = p('ventole'), mem = p('memoria'), sch = p('schermo')
  const nG = gpu?.n ?? 0, nV = vent?.n ?? 0, nS = sch?.n ?? 0
  const hash = (cpu?.x.stats.hash ?? 0) + nG * (gpu?.x.stats.hash ?? 0)
  const calore = (cpu?.x.stats.calore ?? 0) + nG * (gpu?.x.stats.calore ?? 0)
  const raff = (kase?.x.stats.raffreddamento ?? 60) + nV * (vent?.x.stats.raffreddamento ?? 0) + (DISSIPATORE[cpu?.x.vista.dissipatore] ?? 0)
  const temperatura = calore > 0 ? Math.round(Math.min(MASSIMA, AMBIENTE + (GRADI * calore) / Math.max(1, raff)) * 10) / 10 : AMBIENTE
  const efficienza = temperatura <= SOGLIA ? 1 : Math.round(Math.max(EFF_MIN, 1 - (temperatura - SOGLIA) * CALO) * 100) / 100
  const b = (c, k = 'bonus') => p(c)?.x.stats[k] ?? 0
  const molt = (1 + b('sedia', 'comfort')) * (1 + b('tavolo', 'comfort')) * (1 + b('ram')) * (1 + b('memoria')) * (1 + b('led')) * (1 + nS * b('schermo')) * (1 + b('tastiera')) * (1 + b('mouse'))
  return { hash, temperatura, efficienza, molt, perOra: Math.round(hash * COSTANTE * efficienza * molt * 100) / 100, ore: mem?.x.stats.ore ?? 0 }
}
function prezzo(pr) {
  let tot = 0
  for (const k of CATEGORIE) { const q = posto(pr.pezzi, k.id); if (q) tot += q.x.prezzo * q.n }
  return Math.round(tot * (1 - pr.sconto))
}

// ── Scale2x, come lcd.js: il glifo 5 × 7 portato ai pixel veri (10 × 14) con le diagonali morbide ──
function scale2x(g, w, h) {
  const o = new Uint8Array(w * 2 * h * 2), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : g[y * w + x])
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P0 = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), Dd = at(x, y + 1), W2 = w * 2
    o[y * 2 * W2 + x * 2] = C === A && C !== Dd && A !== B ? A : P0
    o[y * 2 * W2 + x * 2 + 1] = A === B && A !== C && B !== Dd ? B : P0
    o[(y * 2 + 1) * W2 + x * 2] = Dd === C && Dd !== B && C !== A ? C : P0
    o[(y * 2 + 1) * W2 + x * 2 + 1] = B === Dd && B !== A && Dd !== C ? Dd : P0
  }
  return o
}
const glifi = new Map()
function punti(ch) {
  let r = glifi.get(ch)
  if (r) return r
  const g = glifo(ch), b = new Uint8Array(35)
  for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) b[y * 5 + x] = g[y][x] === '#' ? 1 : 0
  const s = scale2x(b, 5, 7), out = []
  for (let y = 0; y < 14; y++) for (let x = 0; x < 10; x++) if (s[y * 10 + x]) out.push(x, y)
  r = Int16Array.from(out)
  glifi.set(ch, r)
  return r
}
const larg = (s) => Math.max(0, [...String(s)].length * 6 - 1)

// ── la pixel art coi colori della tavolozza a 8 bit (come aColori di os/miniera.js) ──
function aColori(t, mezzo) {
  const w = Math.floor(t.w / (mezzo ? 2 : 1)), h = Math.floor(t.h / (mezzo ? 2 : 1)), pw = w * D, ph = h * D, px = new Uint8Array(pw * ph)
  for (let Y = 0; Y < ph; Y++) for (let X = 0; X < pw; X++) {
    const c = t.pixel[Math.floor((Y * t.h) / ph) * t.w + Math.floor((X * t.w) / pw)]
    if (c >= 0) px[Y * pw + X] = colore((c >> 16) & 255, (c >> 8) & 255, c & 255)
  }
  const schermi = t.ingombri.filter((r) => r.cosa === 'schermo').map((r) => ({ x: r.x * (pw / t.w), y: r.y * (ph / t.h), w: r.w * (pw / t.w), h: r.h * (ph / t.h) }))
  return { w, h, pw, ph, px, schermi }
}

// le icone della testata (i tracciati di os/icone.js, coi loro colori)
const ICONE = {
  'app-miniera': [['M2 2c3-1 7 0 10 4l1-1 2 2-5 5-2-2 1-1C6 6 3 5 2 2z M8 8l2 2-6 6-2-2z'], '#cccccc'],
  'app-compilatore': [['M11 3a6 6 0 1 0 0 10l-2-2a3 3 0 1 1 0-6z'], '#3399ff'],
}
function icona(nome) {
  const [T, col] = ICONE[nome], L = 16 * D, cv = document.createElement('canvas')
  cv.width = cv.height = L
  const g = cv.getContext('2d', { willReadFrequently: true })
  g.scale(L / 16, L / 16); g.fillStyle = col
  for (const d of T) g.fill(new Path2D(d), 'evenodd')
  const dati = g.getImageData(0, 0, L, L).data, px = new Uint8Array(L * L), c = colore(...[1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16)))
  for (let i = 0; i < L * L; i++) if (dati[i * 4 + 3] > 127) px[i] = c
  const out = px.slice(), pieno = (x, y) => x >= 0 && y >= 0 && x < L && y < L && px[y * L + x] > 1
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (!px[y * L + x] && (pieno(x - 1, y) || pieno(x + 1, y) || pieno(x, y - 1) || pieno(x, y + 1))) out[y * L + x] = 1
  return { pw: L, ph: L, px: out }
}

function finitura(kit, w, h, dpr, scuro = 0.42, grana = 0.07) {
  return kit.strato(w, h, dpr, (g) => {
    kit.vignetta(g, w, h, scuro)
    const n = document.createElement('canvas'), x = n.getContext('2d'), r = kit.rng(5)
    n.width = n.height = 96
    const d = x.createImageData(96, 96)
    for (let i = 0; i < d.data.length; i += 4) { const v = r(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > 0.5 ? 255 : 0; d.data[i + 3] = Math.abs(v - 0.5) * 2 * grana * 255 }
    x.putImageData(d, 0, 0)
    g.fillStyle = g.createPattern(n, 'repeat')
    g.fillRect(0, 0, w, h)
  })
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU } = kit
  const [foto, iconaApp] = await Promise.all([kit.img(m.cattura || '/media/p/miniera/cover.webp'), kit.imgForse('/art/chat-miniera/app-miniera.webp')])
  await kit.font(m.font)

  // ── i colori dell'lcd: lo sfondo arancione, l'inchiostro, la tavolozza scurita come la retroilluminazione vera ──
  const tav = new Uint32Array(256)
  const u32 = (c) => (255 << 24) | (Math.round(c[2] * 0.85) << 16) | (Math.round(c[1] * 0.94) << 8) | c[0]
  for (let i = 2; i < 256; i++) tav[i] = u32(rgb(i))
  tav[0] = u32(rgb(colore(247, 161, 58)))
  tav[1] = u32(rgb(colore(34, 20, 8)))
  const VERDE = colore(0, 102, 0), ROSSO = colore(153, 0, 0), GIALLO = colore(255, 204, 0)

  // ── il buffer dei pixel veri (512 × 256) e la tela ──
  const fb = new Uint8Array(PW * PH)
  const tela = document.createElement('canvas')
  tela.width = PW; tela.height = PH
  const tg = tela.getContext('2d')
  const img = tg.createImageData(PW, PH), out = new Uint32Array(img.data.buffer)
  const pv = (X, Y, v) => { if (X >= 0 && Y >= 0 && X < PW && Y < PH) fb[Y * PW + X] = v }
  const rett = (X, Y, w, h, v) => { const x0 = Math.max(0, X), y0 = Math.max(0, Y), x1 = Math.min(PW, X + w), y1 = Math.min(PH, Y + h); for (let y = y0; y < y1; y++) fb.fill(v, y * PW + x0, y * PW + x1) }
  const riempi = (x, y, w, h, v = 1) => rett(Math.round(x) * D, Math.round(y) * D, Math.round(w) * D, Math.round(h) * D, v)
  const orizz = (x, y, w, v = 1) => riempi(x, y, w, 1, v)
  const riquadro = (x, y, w, h, v = 1) => { orizz(x, y, w, v); orizz(x, y + h - 1, w, v); riempi(x, y, 1, h, v); riempi(x + w - 1, y, 1, h, v) }
  const cornice = (x, y, w, h, v = 1) => { orizz(x + 1, y, w - 2, v); orizz(x + 1, y + h - 1, w - 2, v); riempi(x, y + 1, 1, h - 2, v); riempi(x + w - 1, y + 1, 1, h - 2, v) }
  function testo(x, y, s, { col = 1, inv = false } = {}) {
    let cx = x
    for (const ch of String(s)) { const p = punti(ch), X = Math.round(cx) * D, Y = Math.round(y) * D; for (let i = 0; i < p.length; i += 2) pv(X + p[i], Y + p[i + 1], inv ? 0 : col); cx += 6 }
  }
  const centro = (y, s, o) => testo(Math.round(W / 2 - larg(s) / 2), y, s, o)
  const destra = (x, y, s, o) => testo(x - larg(s), y, s, o)
  function bitmap(b, x, y, { inv = false } = {}) {
    const X = Math.round(x) * D, Y = Math.round(y) * D
    for (let j = 0; j < b.ph; j++) for (let i = 0; i < b.pw; i++) { let c = b.px[j * b.pw + i]; if (!c) continue; if (inv && c === 1) c = 0; pv(X + i, Y + j, c) }
  }
  // il grafico del miner che scorre sugli schermi della scena (la pixel art sta ferma: questo è nostro)
  function miner(b, x, y, fase) {
    const X0 = Math.round(x) * D, Y0 = Math.round(y) * D
    for (const s of b.schermi) {
      const sx = Math.round(X0 + s.x) + 2, sy = Math.round(Y0 + s.y) + 2, sw = Math.round(s.w) - 4, sh = Math.round(s.h) - 6
      if (sw < 4 || sh < 4) continue
      rett(sx, sy, sw, sh, colore(0, 51, 0))
      for (let i = 0; i < sw; i++) {
        const k = i + fase, v = Math.sin(k * 0.45) * 0.25 + Math.sin(k * 0.13) * 0.2 + ((k * 0.031) % 1) * 0.5
        const yy = sy + sh - 1 - Math.round(clamp(v, 0, 1) * (sh - 2))
        pv(sx + i, yy, colore(102, 255, 102)); if (yy + 1 < sy + sh) pv(sx + i, yy + 1, colore(0, 153, 0))
      }
      if (sh > 8) for (let r = 0; r < 2; r++) for (let i = 0; i < sw * 0.5; i++) if ((i * 7 + r * 3 + fase) % 5 < 3) pv(sx + 1 + i, sy + 1 + r * 3, colore(51, 204, 51))
    }
  }
  function flush() {
    for (let i = 0; i < fb.length; i++) out[i] = tav[fb[i]]
    tg.putImageData(img, 0, 0)
  }

  // ── le postazioni dei PC pronti, a metà e a tutta misura, e le loro schede ──
  const pc = PRONTI.map((pr) => ({ ...pr, c: calcola(pr.pezzi), prezzo: prezzo(pr) }))
  const scene = new Map()
  const scena = (i, mezzo) => { const k = `${i}:${mezzo}`; if (!scene.has(k)) scene.set(k, aColori(P.componi(pc[i].pezzi, { acceso: true }), mezzo)); return scene.get(k) }
  const icMin = icona('app-miniera'), icPc = icona('app-compilatore')
  const corto = (s, n) => ([...s].length > n ? [...s].slice(0, n - 1).join('') + '…' : s)
  const acapo = (s, n) => { const r = []; let riga = ''; for (const p of s.split(' ')) { if (!riga) riga = p; else if (riga.length + 1 + p.length <= n) riga += ' ' + p; else { r.push(riga); riga = p } } if (riga) r.push(riga); return r }

  function barra(ora) {
    riempi(0, 0, W, 12, 0)
    orizz(1, 11, W - 2)
    testo(8, 2, ora)
    for (let i = 0; i < 3; i++) { const h = 2 + i * 2; riempi(44 + i * 3, 9 - h, 2, h) }
    centro(2, 'miniera')
    const bx = W - 23
    destra(bx - 4, 2, '100%')
    riquadro(bx, 2, 15, 7); riempi(bx + 15, 4, 1, 3); riempi(bx + 2, 4, 11, 3)
  }
  function testata(nome, ic, pag, scorre = 0) {
    testo(7, 18, '◀')
    bitmap(ic, 16, 14)
    testo(36 + scorre, 18, nome)
    const xp = W - 17 - 18
    for (let i = 0; i < 3; i++) { const x = xp + i * 6; if (i === pag) riempi(x, 19, 4, 4); else riquadro(x, 19, 4, 4) }
    testo(W - 12, 18, '▶')
    orizz(6, 31, W - 12)
  }
  function striscia(s) { riempi(10, H - 11, W - 20, 10); centro(H - 9, s, { inv: true }) }

  // la postazione: i maturati che crescono, la memoria, la produzione, il caldo
  function paginaPostazione(i, mat, dx, fase, monta) {
    const p = pc[i], c = p.c, b = scena(i, true)
    const x0b = 8 + dx
    bitmap(b, x0b, 34); miner(b, x0b, 34, fase)
    // il PC nuovo che si monta: i pixel arrivano a righe dal basso
    if (monta != null && monta < 1) {
      const vecchia = scena((i + pc.length - 1) % pc.length, true)
      const fino = Math.round((1 - monta) * b.ph)
      for (let j = 0; j < fino; j++) for (let k = 0; k < vecchia.pw; k++) { const v = vecchia.px[j * vecchia.pw + k]; if (v) pv(x0b * D + k, 34 * D + j, v) }
      rett(x0b * D, 34 * D + fino - 1, b.pw, 2, GIALLO)
    }
    riquadro(x0b - 1, 33, b.w + 2, b.h + 2)
    const x0 = x0b + b.w + 8, n = Math.floor((245 - x0) / 6), cap = c.perOra * c.ore, k = Math.min(1, mat / cap)
    testo(x0, 34, 'maturati')
    testo(x0, 43, corto(`${fmt(Math.floor(mat * 10) / 10)} $pzk`, n), { col: VERDE })
    riquadro(x0, 53, 245 - x0, 5); riempi(x0 + 1, 54, Math.round((243 - x0) * k), 3, k >= 1 ? ROSSO : VERDE)
    testo(x0, 61, corto(k >= 1 ? 'memoria piena!' : `memoria ${fmt(c.ore)} ore`, n), { col: k >= 1 ? ROSSO : 1 })
    testo(x0, 72, corto(perOra(c.perOra), n))
    const scotta = c.temperatura > SOGLIA
    testo(x0, 81, `${Math.round(c.temperatura)} °C`, { col: scotta ? ROSSO : 1 })
    testo(x0 + larg(`${Math.round(c.temperatura)} °C`) + 1, 81, corto(` · hash ${fmtCorto(c.hash)}`, n - 6))
    const resa = Math.round(c.efficienza * 100)
    testo(x0, 90, `resa ${resa} %`, { col: resa < 100 ? ROSSO : 1 })
    testo(x0 + larg(`resa ${resa} %`) + 1, 90, ` · × ${(Math.round(c.molt * 100) / 100).toLocaleString('it-IT')}`)
    testo(10, 104, corto(p.nome, 38))
  }
  // i pc pronti: l'elenco, la riga scelta in negativo
  function paginaPronti(sel, dx) {
    const da = Math.max(0, Math.min(sel - 1, pc.length - 4))
    for (let r = 0; r < 4; r++) {
      const k = da + r, y = 33 + r * 21, on = k === sel, p = pc[k]
      if (!p) continue
      if (on) riempi(6 + dx, y, W - 20, 20)
      const s = fmt(p.prezzo)
      destra(6 + dx + W - 28, y + 2, s, { inv: on })
      testo(10 + dx, y + 2, corto(p.nome, Math.floor((W - 40 - larg(s)) / 6)), { inv: on })
      testo(10 + dx, y + 11, perOra(p.c.perOra), { inv: on })
    }
    riempi(W - 11, 33 + Math.round((da / pc.length) * 84), 2, Math.round((4 / pc.length) * 84))
    riempi(W - 10, 33, 1, 84)
  }
  // la scheda di un PC pronto: il disegno, i numeri, il listino barrato, «compra e monta»
  function schedaPronto(i, premuto) {
    const p = pc[i], b = scena(i, true)
    bitmap(b, 8, 14); miner(b, 8, 14, 0); riquadro(7, 13, b.w + 2, b.h + 2)
    const x0 = 8 + b.w + 8, n = Math.floor((245 - x0) / 6)
    acapo(p.nome, n).slice(0, 2).forEach((r, k) => testo(x0, 15 + k * 9, r))
    testo(x0, 35, corto(perOra(p.c.perOra), n))
    testo(x0, 44, corto(`${fmt(p.prezzo)} $pzk`, n))
    const l = fmt(Math.round(p.prezzo / (1 - p.sconto)))
    testo(x0, 53, l); orizz(x0 - 1, 56, larg(l) + 2, ROSSO)
    const et = 'compra e monta', w = larg(et) + 8, x = Math.round(W / 2 - w / 2)
    if (premuto) { riempi(x, 99, w, 11); testo(x + 4, 101, et, { inv: true }) } else { riempi(x, 99, w, 11); testo(x + 4, 101, et, { inv: true }); cornice(x - 2, 97, w + 4, 15) }
  }
  // la postazione grande (↓ la guardi grande)
  function grande(i, fase) {
    const b = scena(i, false), x = Math.round(W / 2 - b.w / 2), y = Math.round(H / 2 - b.h / 2)
    bitmap(b, x, y); miner(b, x, y, fase)
    const fascia = (yy, s) => { const w = larg(s), xx = Math.round(W / 2 - w / 2); riempi(xx - 2, yy - 1, w + 4, 9, 0); testo(xx, yy, s) }
    fascia(2, corto(pc[i].nome, 36))
    fascia(H - 9, 'OK o INDIETRO torna')
  }

  // ── la scena intorno: la cattura vera, la telecamera, le monete ──
  let w = 0, h = 0, dprFatto = 0, fino = null, copri = null, sfondo = null, moneta = null
  function ridimensiona() {
    w = m.w; h = m.h
    // la cattura: la finestra nitida, la pagina dietro ancora più sfocata e scura (non si deve riconoscere niente)
    sfondo = kit.strato(w, h, m.dpr, (g) => {
      g.filter = `blur(${w * 0.018}px)`
      g.drawImage(foto, -w * 0.03, -h * 0.03, w * 1.06, h * 1.06)
      g.filter = 'none'
      g.fillStyle = 'rgba(24,16,40,.55)'; g.fillRect(0, 0, w, h)
      const x0 = (220 / 1280) * w, y0 = (62 / 720) * h, ww = (840 / 1280) * w, hh = (598 / 720) * h
      g.save(); kit.tondo(g, x0, y0, ww, hh, w * 0.025); g.clip()
      g.drawImage(foto, 0, 0, w, h)
      g.restore()
    })
    fino = finitura(kit, w, h, m.dpr, 0.4)
    // la moneta dei $pzk a pixel: 11 × 11, il bordo scuro, l'oro, il riflesso e il $ in mezzo
    moneta = document.createElement('canvas'); moneta.width = moneta.height = 11
    const mg = moneta.getContext('2d')
    const righe = ['...KKKKK...', '..KOOOOOK..', '.KOWWOOOOK.', 'KOWOO$OOOSK', 'KOWO$$$OOSK', 'KOOOO$$OOSK', 'KOOO$$$OOSK', 'KOOOO$OOOSK', '.KOOOOOOSK.', '..KSSSSSK..', '...KKKKK...']
    const C2 = { K: '#4a2a00', O: '#ffcc33', W: '#fff2b0', S: '#cc8800', $: '#8a5200' }
    righe.forEach((r, y) => [...r].forEach((ch, x) => { if (C2[ch]) { mg.fillStyle = C2[ch]; mg.fillRect(x, y, 1, 1) } }))
    // la testata della finestra rifatta più grande: l'icona vera e il nome col carattere della copertina
    copri = kit.strato(w * 0.5, h * 0.2, m.dpr, (g, cw, ch) => {
      g.fillStyle = 'rgb(251,249,245)'
      g.fillRect(cw * 0.028, ch * 0.1, cw * 0.92, ch * 0.92)
    })
  }
  let tau = 0, chiave = '', ultimaFase = -1
  const monete = []

  function frame(t, dt) {
    if (m.w !== w || m.h !== h || m.dpr !== dprFatto) { dprFatto = m.dpr; ridimensiona() }
    const g = m.g, su = m.su
    tau += dt * (1 + 0.25 * su)
    const n = Math.floor(tau / PASSO_GIRO), s = tau - n * PASSO_GIRO
    const i = n % pc.length, prossimo = (i + 1) % pc.length
    const c = pc[i].c, cap = c.perOra * c.ore
    // i maturati crescono a vista (il tempo della miniera corre: un'ora ogni pochi secondi)
    const matur = Math.min(cap * 0.92, cap * 0.08 + (cap * 0.75 * clamp(s / 4.2)))
    const incassa = s >= 4.2 && s < 5.4
    const fase = Math.floor(tau * 12)
    // la pagina di adesso, decisa dal tempo; col mouse sopra la postazione grande
    let pag, k2 = ''
    const grandeOra = su > 0.5
    if (grandeOra) pag = 'grande'
    else if (s < 5.4) pag = 'postazione'
    else if (s < 6.1) pag = 'scorre'
    else if (s < 7.6) pag = 'pronti'
    else if (s < 10.2) pag = 'scheda'
    else pag = 'monta'
    const sel = s < 6.9 ? i : prossimo
    const premuto = pag === 'scheda' && s > 9.3
    const montaK = pag === 'monta' ? clamp((s - 10.2) / 1.1) : null
    const scorre = pag === 'scorre' ? Math.round((1 - ease.inOut(clamp((s - 5.4) / 0.7))) * 70) : 0
    k2 = `${pag}|${i}|${sel}|${premuto}|${Math.floor(matur * 10)}|${montaK == null ? '' : Math.round(montaK * 24)}|${scorre}|${Math.floor(fase / 2)}|${incassa ? Math.floor(s * 6) : ''}`
    if (k2 !== chiave) {
      chiave = k2
      fb.fill(0)
      const ora = `19:${String(7 + (n % 50)).padStart(2, '0')}`
      if (pag === 'grande') grande(i, Math.floor(fase / 2))
      else {
        barra(ora)
        if (pag === 'postazione') { testata('la postazione', icMin, 0); paginaPostazione(i, incassa ? matur * (1 - clamp((s - 4.2) / 0.4)) : matur, 0, Math.floor(fase / 2), null) }
        else if (pag === 'scorre') { testata('i pc pronti', icPc, 2, 0); paginaPronti(i, scorre) }
        else if (pag === 'pronti') { testata('i pc pronti', icPc, 2); paginaPronti(sel, 0) }
        else if (pag === 'scheda') schedaPronto(prossimo, premuto)
        else { testata('la postazione', icMin, 0); paginaPostazione(prossimo, cap * 0.02, 0, Math.floor(fase / 2), montaK) }
        // la striscia in fondo, o il suggerimento
        if (incassa) striscia(`✓ incassati +${fmt(Math.round(matur))} $pzk`)
        else if (premuto) striscia(`${['|', '/', '-', '\\'][Math.floor(s * 8) % 4]} monto il PC`)
        else if (pag === 'monta' && montaK >= 1) striscia('✓ montato: la postazione mina')
        else if (pag === 'postazione' || pag === 'monta') centro(H - 9, 'OK incassa · ↓ la guardi · ←→ pagine')
        else if (pag === 'pronti' || pag === 'scorre') centro(H - 9, 'OK la scheda · ↑↓ · ←→ pagine')
        else centro(H - 9, 'OK preme · ↓ la guardi grande')
      }
      flush()
    }

    // le monete a pixel che escono dallo schermo all'incasso (e una pioggia quando si monta un PC)
    const evento = incassa ? n * 2 : pag === 'monta' && montaK >= 1 ? n * 2 + 1 : -1
    if (evento >= 0 && evento !== ultimaFase) {
      ultimaFase = evento
      const rr = kit.rng(evento + 11), quante = incassa ? 26 : 16
      for (let q = 0; q < quante; q++) monete.push({ x: 0.42 + rr() * 0.3, y: 0.42 + rr() * 0.2, vx: (rr() - 0.5) * 1.1, vy: -0.5 - rr() * 0.9, t: -rr() * 0.3, giri: 5 + rr() * 8, d: 0.03 + rr() * 0.02 })
    }

    // ── la telecamera: lenta deriva sulla finestra, e col mouse dentro lo schermo ──
    const z = lerp(1.04 + 0.015 * Math.sin(tau * 0.3), 1.55, ease.inOut(su))
    const lcx = (LCD.x + LCD.w / 2) * w, lcy = (LCD.y + LCD.h / 2) * h
    const cx = lerp(w / 2 + Math.sin(tau * 0.21) * w * 0.006, lcx, ease.inOut(su)), cy = lerp(h / 2, lcy, ease.inOut(su))
    // una scossa piccola quando si monta il PC
    const botto = pag === 'monta' ? Math.sin(clamp((s - 10.2) / 1.1) * Math.PI) * Math.sin(tau * 70) * w * 0.0015 : 0
    g.save()
    g.translate(w / 2 + botto, h / 2); g.scale(z, z); g.translate(-cx, -cy)
    kit.metti(g, sfondo, 0, 0, w, h)
    // la testata della finestra
    const hx = 236 / 1280 * w, hy = 70 / 720 * h
    kit.metti(g, copri, hx - w * 0.014, hy - h * 0.02, w * 0.5, h * 0.2)
    if (iconaApp) { g.imageSmoothingEnabled = false; g.drawImage(iconaApp, hx + w * 0.002, hy + h * 0.005, h * 0.075, h * 0.075); g.imageSmoothingEnabled = true }
    g.fillStyle = '#1e1f22'; g.textBaseline = 'alphabetic'
    g.font = `400 ${h * 0.062}px "${m.font}"`
    g.fillText(m.titolo || 'Miniera', hx + h * 0.095, hy + h * 0.058)
    const tw = g.measureText(m.titolo || 'Miniera').width
    g.font = `400 ${h * 0.026}px "gg sans", sans-serif`; g.fillStyle = '#5c5e66'
    g.fillText('pzk os · un’app sola', hx + h * 0.115 + tw, hy + h * 0.056)
    // l'lcd vivo, i pixel netti
    const lx = LCD.x * w, ly = LCD.y * h, lw = LCD.w * w, lh = LCD.h * h
    g.imageSmoothingEnabled = (lw * z * m.dpr) / PW < 1.6
    g.drawImage(tela, lx, ly, lw, lh)
    g.imageSmoothingEnabled = true
    // la retroilluminazione che respira e il riflesso della finestra
    g.save()
    g.beginPath(); g.rect(lx, ly, lw, lh); g.clip()
    if (incassa || (pag === 'monta' && montaK > 0.9)) { g.fillStyle = `rgba(255,236,170,${0.16 * (1 - ((s * 3) % 1))})`; g.fillRect(lx, ly, lw, lh) }
    const rx = lx + (((tau * 0.17) % 1.5) - 0.25) * lw
    const rg = g.createLinearGradient(rx - lw * 0.1, ly, rx + lw * 0.1, ly + lh)
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.5, 'rgba(255,255,255,.09)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = rg; g.fillRect(lx, ly, lw, lh)
    g.restore()
    // i tasti della finestra che si premono
    const premi = (nome, k) => {
      if (k <= 0) return
      const [x, y, r] = TASTI[nome], X = (x / 1280) * w, Y = (y / 720) * h, R = (r / 1280) * w
      g.fillStyle = `rgba(90,30,0,${0.35 * k})`
      g.beginPath(); g.arc(X, Y + R * 0.08, R, 0, TAU); g.fill()
    }
    const colpo = (a) => smooth(a, a + 0.06, s) * (1 - smooth(a + 0.16, a + 0.3, s))
    premi('ok', colpo(4.15) + colpo(7.55) + colpo(9.25))
    premi('dx', colpo(5.35))
    premi('giu', colpo(6.75) + su * 0.6)
    g.restore()

    // le monete d'oro a pixel, davanti a tutto
    for (let q = monete.length - 1; q >= 0; q--) {
      const o = monete[q]
      o.t += dt
      if (o.t < 0) continue
      o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 2.2 * dt
      if (o.y > 1.15) { monete.splice(q, 1); continue }
      const d = Math.round(o.d * w / 11) * 11 || 11, sq = Math.abs(Math.cos(o.t * o.giri))
      g.imageSmoothingEnabled = false
      g.drawImage(moneta, Math.round(o.x * w - (d * sq) / 2), Math.round(o.y * h - d / 2), Math.max(1, Math.round(d * sq)), d)
      g.imageSmoothingEnabled = true
    }
    kit.metti(g, fino, 0, 0, w, h)
  }

  return { frame, titolo: false, cattura: false, fermo: 3 }
}
