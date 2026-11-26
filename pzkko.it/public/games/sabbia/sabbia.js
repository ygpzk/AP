// SABBIA (26.11): un automa cellulare in un canvas. Sabbia, acqua, pietra, olio, fuoco e fumo con regole semplici
// (la sabbia scende e affonda nell'acqua, l'acqua scorre, l'olio galleggia, il fuoco accende l'olio e il fumo sale).
// Il mondo è una griglia di byte (Uint8Array) e si disegna con ImageData: nessun pixel si tocca uno per uno sul DOM.
//
//   apri()   apre il banco

import { creaFoglio, tela, ciclo, clamp } from '/games/lab/lab.js'

const VUOTO = 0, SABBIA = 1, ACQUA = 2, PIETRA = 3, FUOCO = 4, OLIO = 5, FUMO = 6
const MAT = [
  { id: SABBIA, nome: 'sabbia', colore: '#d9b36c' },
  { id: ACQUA, nome: 'acqua', colore: '#3f7fbf' },
  { id: PIETRA, nome: 'pietra', colore: '#6f6a63' },
  { id: OLIO, nome: 'olio', colore: '#3a2a1a' },
  { id: FUOCO, nome: 'fuoco', colore: '#ff7a18' },
  { id: FUMO, nome: 'fumo', colore: '#8a8a8a' },
  { id: VUOTO, nome: 'gomma', colore: '#f2eee3' },
]
const COLORI = { [SABBIA]: [216, 179, 108], [ACQUA]: [63, 127, 191], [PIETRA]: [111, 106, 99], [FUOCO]: [255, 122, 24], [OLIO]: [58, 42, 26], [FUMO]: [138, 138, 138] }
const LARG = 180, ALT = 110
const G = new Uint8Array(LARG * ALT)
const VITA = new Uint8Array(LARG * ALT)
const VARIA = new Int8Array(LARG * ALT)
for (let i = 0; i < VARIA.length; i++) VARIA[i] = Math.floor(Math.random() * 19) - 9
const S = { materiale: SABBIA, pennello: 4, pausa: false }
let dlg = null, el = {}, telaSt = null, disegno = null
let off = null, offCtx = null, imageData = null
let ultimo = null, dipinto = false
let pioggiaFino = 0, vulcanoFino = 0
let passoN = 0
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const idx = (x, y) => y * LARG + x
const dentro = (x, y) => x >= 0 && x < LARG && y >= 0 && y < ALT

function scenario() {
  G.fill(VUOTO); VITA.fill(0)
  for (let x = 0; x < LARG; x++) {
    for (let y = ALT - 3; y < ALT; y++) G[idx(x, y)] = PIETRA
    if (x < 4 || x >= LARG - 4) for (let y = 0; y < ALT; y++) G[idx(x, y)] = PIETRA
  }
  // una duna a destra e una pozza a sinistra
  for (let x = 0; x < LARG; x++) {
    const duna = Math.max(0, 34 - Math.abs(x - 125) * 0.9)
    for (let y = 0; y < duna; y++) if (y < 24) G[idx(x, ALT - 4 - y)] = SABBIA
    const pozza = x > 18 && x < 62 ? 20 : 0
    for (let y = 0; y < pozza; y++) if (ALT - 4 - y > 0) G[idx(x, ALT - 4 - y)] = ACQUA
  }
  for (let x = 20; x < 60; x++) G[idx(x, ALT - 5)] = PIETRA
}

function scambia(a, b) {
  const m = G[a]; G[a] = G[b]; G[b] = m
  const v = VITA[a]; VITA[a] = VITA[b]; VITA[b] = v
}
function sabbia(i, x, y, dir) {
  const sotto = idx(x, y + 1)
  if (y + 1 < ALT) {
    if (G[sotto] === VUOTO || G[sotto] === ACQUA || G[sotto] === OLIO) return scambia(i, sotto)
    if (G[sotto] === FUOCO) { G[i] = VUOTO; VITA[i] = 0; G[sotto] = VUOTO; return }
  }
  const dx = dir || (Math.random() < 0.5 ? -1 : 1)
  for (const d of [dx, -dx]) {
    const nx = x + d, ny = y + 1
    if (nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, ny)
    if (G[j] === VUOTO || G[j] === ACQUA || G[j] === OLIO) { scambia(i, j); return }
  }
}
function acqua(i, x, y, dir) {
  const sotto = idx(x, y + 1)
  if (y + 1 < ALT) {
    if (G[sotto] === VUOTO) return scambia(i, sotto)
    if (G[sotto] === FUOCO) { G[sotto] = FUMO; VITA[sotto] = 90 }
    if (G[sotto] === OLIO) return scambia(i, sotto)
  }
  const dx = dir || (Math.random() < 0.5 ? -1 : 1)
  const scelte = [dx, -dx, 0]
  for (const d of scelte) {
    const nx = x + d, ny = y + (d ? 1 : 0)
    if (nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, ny)
    if (G[j] === VUOTO) { scambia(i, j); return }
    if (G[j] === OLIO && ny === y + 1) { scambia(i, j); return }
  }
  // lo scorrimento laterale
  for (const d of [dx, -dx]) {
    const nx = x + d
    if (nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, y)
    if (G[j] === VUOTO) { scambia(i, j); return }
  }
}
function olio(i, x, y, dir) {
  const sotto = idx(x, y + 1)
  if (y + 1 < ALT) {
    if (G[sotto] === VUOTO) return scambia(i, sotto)
    if (G[sotto] === ACQUA) return scambia(i, sotto)
  }
  const dx = dir || (Math.random() < 0.5 ? -1 : 1)
  for (const d of [dx, -dx]) {
    const nx = x + d, ny = y + 1
    if (nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, ny)
    if (G[j] === VUOTO || G[j] === ACQUA) { scambia(i, j); return }
  }
  for (const d of [dx, -dx]) {
    const nx = x + d
    if (nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, y)
    if (G[j] === VUOTO) { scambia(i, j); return }
  }
}
function fuoco(i, x, y, dir) {
  if (VITA[i] > 0) VITA[i]--
  // accende l'olio attorno
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nx = x + dx, ny = y + dy
    if (!dentro(nx, ny)) continue
    const j = idx(nx, ny)
    if (G[j] === OLIO && Math.random() < 0.22) { G[j] = FUOCO; VITA[j] = 150 }
    if (G[j] === ACQUA) { G[i] = FUMO; VITA[i] = 70 }
  }
  if (G[i] !== FUOCO) return
  if (VITA[i] === 0) { G[i] = FUMO; VITA[i] = 110; return }
  const dx = dir || (Math.random() < 0.5 ? -1 : 1)
  for (const [ax, ay] of [[0, -1], [dx, -1], [-dx, -1], [dx, 0], [-dx, 0]]) {
    const nx = x + ax, ny = y + ay
    if (!dentro(nx, ny) || nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, ny)
    if (G[j] === VUOTO) { scambia(i, j); return }
  }
}
function fumo(i, x, y, dir) {
  if (VITA[i] > 0) VITA[i]--
  if (VITA[i] === 0) { G[i] = VUOTO; return }
  const dx = dir || (Math.random() < 0.5 ? -1 : 1)
  for (const [ax, ay] of [[0, -1], [dx, -1], [-dx, -1], [dx, 0], [-dx, 0]]) {
    const nx = x + ax, ny = y + ay
    if (!dentro(nx, ny) || nx < 4 || nx >= LARG - 4) continue
    const j = idx(nx, ny)
    if (G[j] === VUOTO) { scambia(i, j); return }
  }
}

function passo() {
  passoN++
  // il fuoco e il fumo salgono: dall'alto verso il basso, così non si muovono due volte
  for (let y = 1; y < ALT; y++) {
    const verso = Math.random() < 0.5 ? 1 : -1
    for (let k = 0; k < LARG; k++) {
      const x = verso > 0 ? k : LARG - 1 - k
      if (x < 4 || x >= LARG - 4) continue
      const i = idx(x, y)
      const m = G[i]
      if (m === FUOCO) fuoco(i, x, y, verso)
      else if (m === FUMO) fumo(i, x, y, verso)
    }
  }
  // la sabbia e i liquidi scendono: dal basso verso l'alto
  for (let y = ALT - 2; y >= 1; y--) {
    const verso = Math.random() < 0.5 ? 1 : -1
    for (let k = 0; k < LARG; k++) {
      const x = verso > 0 ? k : LARG - 1 - k
      if (x < 4 || x >= LARG - 4) continue
      const i = idx(x, y), m = G[i]
      if (m === SABBIA) sabbia(i, x, y, verso)
      else if (m === ACQUA) acqua(i, x, y, verso)
      else if (m === OLIO) olio(i, x, y, verso)
    }
  }
  if (pioggiaFino > 0) {
    pioggiaFino--
    for (let k = 0; k < 4; k++) {
      const x = 5 + Math.floor(Math.random() * (LARG - 10))
      if (G[idx(x, 1)] === VUOTO) G[idx(x, 1)] = ACQUA
    }
  }
  if (vulcanoFino > 0) {
    vulcanoFino--
    for (let k = 0; k < 3; k++) {
      const x = Math.floor(LARG / 2) + Math.floor(Math.random() * 9) - 4
      const y = ALT - 5
      if (G[idx(x, y)] === VUOTO) { G[idx(x, y)] = FUOCO; VITA[idx(x, y)] = 170 }
    }
  }
}

function colore(i) {
  const m = G[i]
  if (m === VUOTO) return null
  if (m === FUOCO) {
    const v = VITA[i] / 170
    return v > 0.55 ? [255, 215, 70] : v > 0.25 ? [255, 122, 24] : [150, 40, 12]
  }
  if (m === FUMO) {
    const v = VITA[i] / 110
    const c = 70 + v * 70
    return [c, c, c]
  }
  const base = COLORI[m]
  const v = VARIA[i]
  return [clamp(base[0] + v, 0, 255), clamp(base[1] + v, 0, 255), clamp(base[2] + v, 0, 255)]
}

function disegna() {
  const ctx = telaSt?.ctx
  if (!ctx || !offCtx) return
  const w = telaSt.w, h = telaSt.h
  if (!w || !h) return
  const d = imageData.data
  for (let i = 0, p = 0; i < G.length; i++, p += 4) {
    const c = colore(i)
    if (!c) { d[p] = 14; d[p + 1] = 15; d[p + 2] = 12; d[p + 3] = 255 }
    else { d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255 }
  }
  offCtx.putImageData(imageData, 0, 0)
  const s = Math.min(w / LARG, h / ALT)
  const ox = (w - LARG * s) / 2, oy = (h - ALT * s) / 2
  ctx.fillStyle = '#0b0d0a'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, ox, oy, LARG * s, ALT * s)
  if (el.pennello) {
    const b = el.pennello
    b.style.left = `${ox + (ultimo?.x ?? 0) * s}px`
    b.style.top = `${oy + (ultimo?.y ?? 0) * s}px`
    b.style.width = `${Math.max(6, (S.pennello * 2 + 1) * s)}px`
    b.style.height = b.style.width
  }
}

function dipingi(gx, gy) {
  const r = S.pennello
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue
      const px = gx + x, py = gy + y
      if (!dentro(px, py) || px < 4 || px >= LARG - 4) continue
      const i = idx(px, py)
      G[i] = S.materiale
      VITA[i] = S.materiale === FUOCO ? 170 : S.materiale === FUMO ? 110 : 0
    }
  }
}
function segmento(x0, y0, x1, y1) {
  const dist = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= dist; i++) {
    const t = dist ? i / dist : 0
    dipingi(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t))
  }
}

function posizione(e) {
  const r = el.scena.getBoundingClientRect()
  const s = Math.min(r.width / LARG, r.height / ALT)
  const ox = (r.width - LARG * s) / 2, oy = (r.height - ALT * s) / 2
  return { x: Math.floor((e.clientX - r.left - ox) / s), y: Math.floor((e.clientY - r.top - oy) / s) }
}
function punta(e) {
  return posizione(e)
}

function conti() {
  let s = 0, a = 0, f = 0
  for (let i = 0; i < G.length; i++) {
    if (G[i] === SABBIA) s++
    else if (G[i] === ACQUA) a++
    else if (G[i] === FUOCO) f++
  }
  if (el.sabbia) el.sabbia.textContent = it(s)
  if (el.acqua) el.acqua.textContent = it(a)
  if (el.fuoco) el.fuoco.textContent = it(f)
  if (el.passi) el.passi.textContent = it(passoN)
}
const it = (n) => n.toLocaleString('it-IT')

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  dlg = await creaFoglio({
    chiave: 'sabbia',
    titolo: 'sabbia',
    voce: 'disegna con la sabbia: il resto lo fa la fisica',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-pannello sb-comandi">
          <div class="lab-fila lab-fila--tra">
            <div class="lab-fila"><button type="button" class="lab-tasto" data-pausa aria-pressed="false">pausa</button><button type="button" class="lab-tasto" data-passo>un passo</button><button type="button" class="lab-tasto" data-pulisci>pulisci</button></div>
            <div class="lab-fila"><button type="button" class="lab-tasto" data-pioggia>pioggia</button><button type="button" class="lab-tasto" data-vulcano>vulcano</button></div>
          </div>
          <div class="sb-materiali" data-materiali role="group" aria-label="il materiale">${MAT.map((m) => `<button type="button" class="lab-tasto${m.id === S.materiale ? ' is-on' : ''}" data-mat="${m.id}" aria-pressed="${m.id === S.materiale}"><i style="background:${m.colore}"></i>${m.nome}</button>`).join('')}</div>
          <label class="sb-pennello"><span>pennello</span><input class="lab-range" type="range" data-pennello min="1" max="14" step="1" value="${S.pennello}" aria-label="la misura del pennello"><b class="lab-valore" data-pennello-val>${S.pennello}</b></label>
        </div>
        <div class="lab-scena sb-scena" data-scena>
          <canvas data-tela></canvas>
          <i class="sb-cursore" data-pennello-ind hidden></i>
          <span class="sb-eti">automa cellulare · ${LARG} × ${ALT}</span>
        </div>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        <section class="lab-pannello"><h3>il mondo</h3><dl class="lab-conti"><div><dt>sabbia</dt><dd data-sabbia>0</dd></div><div><dt>acqua</dt><dd data-acqua>0</dd></div><div><dt>fuoco</dt><dd data-fuoco>0</dd></div></dl><p class="lab-nota">passi: <b data-passi>0</b></p></section>
        <section class="lab-pannello"><h3>le regole</h3><p class="lab-nota">La sabbia scende e affonda nell'acqua; l'acqua scorre e spegne il fuoco; l'olio galleggia; il fuoco sale, accende l'olio e diventa fumo; il fumo sale e si dissolve. Ogni cella guarda solo le vicine: da qui nasce tutto.</p></section>
        <section class="lab-pannello"><h3>i tasti</h3><p class="lab-nota">1 sabbia · 2 acqua · 3 pietra · 4 olio · 5 fuoco · 6 fumo · 0 gomma · spazio pausa · C pulisci.</p></section>
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    scena: q('[data-scena]'), pennello: q('[data-pennello-ind]'), sabbia: q('[data-sabbia]'), acqua: q('[data-acqua]'),
    fuoco: q('[data-fuoco]'), passi: q('[data-passi]'),
  }
  off = document.createElement('canvas')
  off.width = LARG; off.height = ALT
  offCtx = off.getContext('2d')
  imageData = offCtx.createImageData(LARG, ALT)
  scenario()
  telaSt = tela(q('[data-tela]'))
  disegno = ciclo(() => {
    if (!S.pausa) passo()
    disegna()
    if (passoN % 20 === 0) conti()
  })
  const pennello = q('[data-pennello]')
  const val = q('[data-pennello-val]')
  pennello.addEventListener('input', () => { S.pennello = Number(pennello.value); val.textContent = pennello.value })
  const mostraCursore = (e) => {
    const p = punta(e)
    el.pennello.hidden = false
    el.pennello.style.display = ''
    el.pennello.style.left = `${e.clientX - el.scena.getBoundingClientRect().left}px`
    el.pennello.style.top = `${e.clientY - el.scena.getBoundingClientRect().top}px`
    const r = el.scena.getBoundingClientRect()
    const s = Math.min(r.width / LARG, r.height / ALT)
    const d = Math.max(7, (S.pennello * 2 + 1) * s)
    el.pennello.style.width = `${d}px`
    el.pennello.style.height = `${d}px`
    return p
  }
  el.scena.addEventListener('pointermove', (e) => {
    const p = mostraCursore(e)
    if (dipinto) {
      if (ultimo) segmento(ultimo.x, ultimo.y, p.x, p.y)
      conti()
    }
    ultimo = p
  })
  el.scena.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    try { el.scena.setPointerCapture?.(e.pointerId) } catch {}
    dipinto = true
    const p = mostraCursore(e)
    ultimo = p
    dipingi(p.x, p.y)
    conti()
  })
  const su = () => { dipinto = false; ultimo = null }
  el.scena.addEventListener('pointerup', su)
  el.scena.addEventListener('pointercancel', su)
  el.scena.addEventListener('pointerleave', () => { if (!dipinto) el.pennello.hidden = true })
  dlg.corpo.addEventListener('click', (e) => {
    const m = e.target.closest('[data-mat]')
    if (m) {
      S.materiale = Number(m.dataset.mat)
      for (const b of dlg.corpo.querySelectorAll('[data-mat]')) { b.classList.toggle('is-on', b === m); b.setAttribute('aria-pressed', String(b === m)) }
      return
    }
    if (e.target.closest('[data-pausa]')) {
      S.pausa = !S.pausa
      const b = e.target.closest('[data-pausa]')
      b.setAttribute('aria-pressed', String(S.pausa)); b.textContent = S.pausa ? 'riprendi' : 'pausa'
      return
    }
    if (e.target.closest('[data-passo]')) { passo(); disegna(); conti(); return }
    if (e.target.closest('[data-pulisci]')) { G.fill(VUOTO); VITA.fill(0); conti(); return }
    if (e.target.closest('[data-pioggia]')) { pioggiaFino = 180; dlg.voce('piove'); return }
    if (e.target.closest('[data-vulcano]')) { vulcanoFino = 180; dlg.voce('il vulcano si è svegliato', true); return }
  })
  const key = (e) => {
    if (e.target.closest('input,textarea,select')) return
    if (e.key === ' ') { e.preventDefault(); dlg.corpo.querySelector('[data-pausa]').click() }
    else if (e.key.toLowerCase() === 'c') dlg.corpo.querySelector('[data-pulisci]').click()
    else if (e.key >= '0' && e.key <= '6') {
      const id = e.key === '0' ? VUOTO : Number(e.key)
      const b = dlg.corpo.querySelector(`[data-mat="${id}"]`)
      if (b) b.click()
    }
  }
  dlg.dlg.addEventListener('keydown', key)
  dlg.alChiudere(() => {
    disegno?.ferma(); disegno = null
    telaSt?.ferma(); telaSt = null
    dipinto = false; ultimo = null
    dlg?.dlg.remove(); dlg = null
  })
  conti()
}
