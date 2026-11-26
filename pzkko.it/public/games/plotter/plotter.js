// PLOTTER (26.11): un plotter generativo. Il disegno nasce in un Web Worker (plotter.worker.js) da un seme, quindi
// può essere rifatto identico; qui si vede crescere tratto per tratto e si porta via in SVG. Quattro algoritmi:
// flusso (un campo di rumore), armoniche (pendoli), truchet (piastrelle) e rose.
//
//   apri()   apre il banco

import { creaFoglio, tela, ciclo, clamp, copia, it } from '/games/lab/lab.js'

const W = 1000, H = 700
const CARTA = '#f4efe1'
const ALGORITMI = [
  ['flusso', 'flusso', 'mille fili seguono un campo di rumore'],
  ['armoniche', 'armoniche', 'quattro pendoli per curva'],
  ['truchet', 'truchet', 'piastrelle con due archi'],
  ['rose', 'rose', 'rose di Grandi sovrapposte'],
]
const PALETTE = {
  inchiostro: ['#161616', '#b3121f', '#1446a0', '#c98a00'],
  botanica: ['#14532d', '#65a30d', '#0e7490', '#161616'],
  sera: ['#5b21b6', '#c026d3', '#e8501c', '#7a1fa2'],
}
const S = { algo: 'flusso', seme: Math.floor(Math.random() * 99999) + 1, densita: 0.55, palette: 'inchiostro' }

let dlg = null, el = {}, telaSt = null, osservatore = null
let worker = null, risultato = null, progresso = 0, anim = null
let ultimaRichiesta = 0

function stato(testo) { if (el.stato) el.stato.textContent = testo }
function palette() { return PALETTE[S.palette] }

function disegna() {
  const ctx = telaSt?.ctx
  if (!ctx) return
  const w = telaSt.w, h = telaSt.h
  if (!w || !h) return
  ctx.fillStyle = '#dcd5c3'
  ctx.fillRect(0, 0, w, h)
  const s = Math.min(w / W, h / H)
  const ox = (w - W * s) / 2, oy = (h - H * s) / 2
  ctx.fillStyle = CARTA
  ctx.fillRect(ox, oy, W * s, H * s)
  // i segni di registro del foglio
  ctx.strokeStyle = 'rgba(22,22,22,.18)'
  ctx.lineWidth = 1
  for (const [cx, cy] of [[ox, oy], [ox + W * s, oy], [ox, oy + H * s], [ox + W * s, oy + H * s]]) {
    ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7); ctx.stroke()
  }
  if (!risultato) return
  ctx.save()
  ctx.translate(ox, oy)
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const seg = risultato.segmenti
  const fine = Math.min(progresso, seg.length)
  let colore = -1
  for (let i = 0; i < fine; i++) {
    const g = seg[i]
    if (g[4] !== colore) {
      if (colore >= 0) ctx.stroke()
      colore = g[4]
      ctx.strokeStyle = palette()[colore] || '#161616'
      ctx.lineWidth = g[5]
      ctx.beginPath()
    }
    ctx.moveTo(g[0], g[1])
    ctx.lineTo(g[2], g[3])
  }
  if (colore >= 0) ctx.stroke()
  ctx.restore()
  // la targhetta del foglio
  ctx.fillStyle = 'rgba(22,22,22,.5)'
  ctx.font = '11px "Special Elite","Courier New",monospace'
  ctx.fillText(`${S.algo} · seme ${S.seme} · ${S.densita.toFixed(2)}`, ox + 10, oy + H * s - 10)
}

function anima() {
  anim?.ferma()
  const totale = risultato?.segmenti.length || 0
  if (!totale) { stato('niente da disegnare'); return }
  let inizio = 0
  const durata = 1100
  anim = ciclo((t) => {
    if (!inizio) inizio = t
    const frazione = Math.min(1, (t - inizio) / durata)
    progresso = Math.floor(totale * frazione)
    disegna()
    if (frazione >= 1) {
      progresso = totale
      anim?.ferma(); anim = null
      stato(`${it(risultato.punti)} segmenti · pronto`)
    }
  })
}

function chiedi() {
  if (!('Worker' in window)) { stato('questo browser non ha i Web Worker'); return }
  stato('calcolo…')
  progresso = 0
  risultato = null
  disegna()
  ultimaRichiesta++
  const mia = ultimaRichiesta
  worker?.terminate()
  worker = null
  try {
    worker = new Worker(new URL('./plotter.worker.js', import.meta.url), { type: 'module' })
  } catch (e) {
    stato('il worker non è partito'); console.error(e); return
  }
  worker.onmessage = (e) => {
    if (mia !== ultimaRichiesta) return
    if (e.data?.errore) { stato('errore nel disegno'); console.error(e.data.errore); return }
    risultato = e.data
    progresso = 0
    stato('disegno…')
    dlg.voce(`${e.data.paths.length} tracciati`)
    anima()
  }
  worker.onerror = (e) => { stato('errore nel worker'); console.error(e.message || e) }
  worker.postMessage({ algo: S.algo, seme: S.seme, densita: S.densita, larg: W, alt: H })
}

function svg() {
  if (!risultato) return ''
  const p = palette()
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${CARTA}"/>
${risultato.paths.map((x) => `<path d="${x.d}" fill="none" stroke="${p[x.colore] || '#161616'}" stroke-width="${x.spessore}" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')}
</svg>`
}
async function salva() {
  if (!risultato) return
  const testo = svg()
  const blob = new Blob([testo], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pzkko-plotter-${S.algo}-${S.seme}.svg`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
  dlg.voce('SVG salvato')
}
async function copiaSVG() {
  if (!risultato) return
  const ok = await copia(svg())
  dlg.voce(ok ? 'SVG copiato negli appunti' : 'non riesco a copiare l’SVG', !ok)
}

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  const pannello = (t, c) => `<section class="lab-pannello">${t ? `<h3>${t}</h3>` : ''}${c}</section>`
  dlg = await creaFoglio({
    chiave: 'plotter',
    titolo: 'plotter',
    voce: 'un disegno per ogni seme',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-scena pl-scena"><canvas data-tela aria-label="il disegno del plotter"></canvas></div>
        <p class="lab-nota"><b data-stato>pronto</b> · il disegno cresce mentre si calcola · lo stesso seme dà lo stesso disegno.</p>
      </div>
      <aside class="lab-colonna lab-colonna--lato lab-scorri">
        ${pannello('algoritmo', `<div class="pl-algo" role="group" aria-label="l'algoritmo">${ALGORITMI.map(([id, n]) => `<button type="button" class="lab-tasto" data-algo="${id}" aria-pressed="${S.algo === id}">${n}</button>`).join('')}</div><p class="lab-nota" data-spiega>${ALGORITMI.find(([a]) => a === S.algo)[2]}</p>`)}
        ${pannello('seme', `<div class="pl-seme"><input class="pl-input" type="number" inputmode="numeric" min="1" max="999999" step="1" data-seme value="${S.seme}" aria-label="il seme"><button type="button" class="lab-tasto" data-dado>dado</button></div><p class="lab-nota">cambia il numero: cambia tutto.</p>`)}
        ${pannello('densità', `<label class="pl-dens"><input class="lab-range" type="range" data-densita min="0.15" max="1" step="0.05" value="${S.densita}" aria-label="la densità"><b class="lab-valore" data-densita-val>${Math.round(S.densita * 100)}%</b></label>`)}
        ${pannello('inchiostro', `<div class="pl-palette" role="group" aria-label="i colori">${Object.entries(PALETTE).map(([k, c]) => `<button type="button" class="pl-pal" data-palette="${k}" aria-pressed="${S.palette === k}" aria-label="${k}">${c.map((x) => `<i style="background:${x}"></i>`).join('')}</button>`).join('')}</div>`)}
        ${pannello('', `<div class="lab-fila"><button type="button" class="lab-tasto lab-tasto--pieno" data-disegna>disegna</button><button type="button" class="lab-tasto" data-ferma>ferma</button></div><div class="lab-fila" style="margin-top:6px"><button type="button" class="lab-tasto" data-svg>salva SVG</button><button type="button" class="lab-tasto" data-copia>copia SVG</button></div>`)}
        ${pannello('cosa fa', `<p class="lab-nota">Il calcolo gira in un <b>Web Worker</b>, fuori dal thread della pagina: il foglio resta reattivo anche con 200.000 segmenti. Il seme è un generatore pseudo-casuale (mulberry32), il campo del flusso è rumore di valore con interpolazione morbida.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = { stato: q('[data-stato]') }
  const seme = q('[data-seme]'), dens = q('[data-densita]'), densVal = q('[data-densita-val]'), spiega = q('[data-spiega]')
  seme.addEventListener('input', () => { const n = Math.abs(parseInt(seme.value, 10)); S.seme = Number.isFinite(n) && n > 0 ? Math.min(999999, n) : 1 })
  dens.addEventListener('input', () => { S.densita = clamp(Number(dens.value), 0.15, 1); densVal.textContent = `${Math.round(S.densita * 100)}%` })
  dlg.corpo.addEventListener('click', (e) => {
    const algo = e.target.closest('[data-algo]')
    if (algo) {
      S.algo = algo.dataset.algo
      for (const b of dlg.corpo.querySelectorAll('[data-algo]')) b.setAttribute('aria-pressed', String(b === algo))
      spiega.textContent = ALGORITMI.find(([a]) => a === S.algo)[2]
      return chiedi()
    }
    const pal = e.target.closest('[data-palette]')
    if (pal) {
      S.palette = pal.dataset.palette
      for (const b of dlg.corpo.querySelectorAll('[data-palette]')) b.setAttribute('aria-pressed', String(b === pal))
      return disegna()
    }
    if (e.target.closest('[data-dado]')) { S.seme = Math.floor(Math.random() * 99999) + 1; seme.value = String(S.seme); return chiedi() }
    if (e.target.closest('[data-disegna]')) return chiedi()
    if (e.target.closest('[data-ferma]')) { anim?.ferma(); anim = null; stato('fermato'); return }
    if (e.target.closest('[data-svg]')) return salva()
    if (e.target.closest('[data-copia]')) return copiaSVG()
  })
  telaSt = tela(q('[data-tela]'))
  osservatore = new ResizeObserver(() => disegna())
  osservatore.observe(q('[data-tela]'))
  disegna()
  dlg.alChiudere(() => {
    anim?.ferma(); anim = null
    worker?.terminate(); worker = null
    osservatore?.disconnect(); osservatore = null
    telaSt?.ferma(); telaSt = null
    dlg?.dlg.remove(); dlg = null
  })
  chiedi()
}
