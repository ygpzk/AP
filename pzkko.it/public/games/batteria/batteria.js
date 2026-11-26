// BATTERIA (26.11): una drum machine a sedici passi, tutta sintetizzata (niente campioni). Il tempo non lo tiene
// setInterval: si programma in anticipo sull'orologio dell'AudioContext (look-ahead di 120 ms, controllo ogni 25 ms),
// che è il modo giusto di fare un sequencer senza far ballare il groove. Lo swing sposta i sedicesimi dispari.
//
//   apri()   apre il banco

import { creaFoglio, clamp, it } from '/games/lab/lab.js'
import { contesto, sblocca, uscita, rumore, sospendi } from '/games/lab/audio.js'

const CHIAVE = 'pzkko-batteria'
const PASSI = 16
const STRUMENTI = [
  { id: 'cassa', nome: 'cassa', colore: '#b3121f' },
  { id: 'rullante', nome: 'rullante', colore: '#e8501c' },
  { id: 'hat', nome: 'charleston', colore: '#c98a00' },
  { id: 'aperto', nome: 'aperto', colore: '#23864a' },
  { id: 'clap', nome: 'clap', colore: '#1446a0' },
  { id: 'tom', nome: 'tom', colore: '#7a1fa2' },
]
const PRESET = {
  base: {
    cassa: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    rullante: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    aperto: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    tom: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  house: {
    cassa: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    rullante: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    aperto: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    tom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  },
  break: {
    cassa: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    rullante: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
    aperto: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    tom: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  },
  vuoto: Object.fromEntries(STRUMENTI.map((s) => [s.id, Array(PASSI).fill(0)])),
}
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const S = { bpm: 104, swing: 0.16, volume: 0.8 }
const P = structuredClone(PRESET.base)
let dlg = null, el = {}, suonando = false, passo = 0, prossimo = 0, timer = 0
const timersVisivi = new Set()

function ricorda() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (!s || typeof s !== 'object') return
    if (Number.isFinite(s.bpm)) S.bpm = clamp(s.bpm, 50, 200)
    if (Number.isFinite(s.swing)) S.swing = clamp(s.swing, 0, 0.7)
    if (Number.isFinite(s.volume)) S.volume = clamp(s.volume, 0, 1)
    for (const st of STRUMENTI) {
      const riga = s.pattern?.[st.id]
      if (Array.isArray(riga) && riga.length === PASSI) P[st.id] = riga.map((x) => (x ? 1 : 0))
    }
  } catch {}
}
function ricordaAdesso() { try { localStorage.setItem(CHIAVE, JSON.stringify({ ...S, pattern: P })) } catch {} }

const passoDurata = () => 60 / S.bpm / 4
const ora = () => contesto()?.currentTime ?? 0
const volume = () => { const u = uscita(); if (u) u.gain.setTargetAtTime(0.12 + S.volume * 0.88, ora(), 0.02) }

// ── le voci, sintetizzate ───────────────────────────────────────────────────
function cassa(t) {
  const c = contesto(), u = uscita()
  const o = c.createOscillator(), g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(165, t)
  o.frequency.exponentialRampToValueAtTime(46, t + 0.12)
  g.gain.setValueAtTime(1, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)
  o.connect(g); g.connect(u)
  o.start(t); o.stop(t + 0.4)
  o.onended = () => { try { g.disconnect() } catch {} }
  // il colpo secco
  const n = c.createBufferSource(), f = c.createBiquadFilter(), ng = c.createGain()
  n.buffer = rumore(0.05)
  f.type = 'lowpass'; f.frequency.value = 900
  ng.gain.setValueAtTime(0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
  n.connect(f); f.connect(ng); ng.connect(u)
  n.start(t); n.stop(t + 0.06)
  n.onended = () => { try { ng.disconnect() } catch {} }
}
function rullante(t) {
  const c = contesto(), u = uscita()
  const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
  n.buffer = rumore(0.3)
  f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7
  g.gain.setValueAtTime(0.6, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
  n.connect(f); f.connect(g); g.connect(u)
  n.start(t); n.stop(t + 0.22)
  n.onended = () => { try { g.disconnect() } catch {} }
  const o = c.createOscillator(), og = c.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.08)
  og.gain.setValueAtTime(0.35, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)
  o.connect(og); og.connect(u); o.start(t); o.stop(t + 0.12)
  o.onended = () => { try { og.disconnect() } catch {} }
}
function hat(t, aperto = false) {
  const c = contesto(), u = uscita()
  const dur = aperto ? 0.34 : 0.055
  const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
  n.buffer = rumore(0.4)
  f.type = 'highpass'; f.frequency.value = aperto ? 6200 : 7800; f.Q.value = 0.6
  g.gain.setValueAtTime(aperto ? 0.32 : 0.22, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  n.connect(f); f.connect(g); g.connect(u)
  n.start(t); n.stop(t + dur + 0.02)
  n.onended = () => { try { g.disconnect() } catch {} }
}
function clap(t) {
  const c = contesto(), u = uscita()
  for (let i = 0; i < 3; i++) {
    const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
    n.buffer = rumore(0.3)
    f.type = 'bandpass'; f.frequency.value = 1200 + i * 260; f.Q.value = 1.1
    const t0 = t + i * 0.012
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.5 - i * 0.1, t0 + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i === 2 ? 0.18 : 0.035))
    n.connect(f); f.connect(g); g.connect(u)
    n.start(t0); n.stop(t0 + (i === 2 ? 0.2 : 0.05))
    n.onended = () => { try { g.disconnect() } catch {} }
  }
}
function tom(t) {
  const c = contesto(), u = uscita()
  const o = c.createOscillator(), g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(82, t + 0.2)
  g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
  o.connect(g); g.connect(u); o.start(t); o.stop(t + 0.28)
  o.onended = () => { try { g.disconnect() } catch {} }
}
function batti(id, t) {
  if (id === 'cassa') cassa(t)
  else if (id === 'rullante') rullante(t)
  else if (id === 'hat') hat(t, false)
  else if (id === 'aperto') hat(t, true)
  else if (id === 'clap') clap(t)
  else if (id === 'tom') tom(t)
}
/** Un colpo solo, per sentire un pezzo o un passo appena acceso. */
function colpo(id) {
  const c = contesto()
  if (!c) return
  sblocca(); volume()
  batti(id, c.currentTime + 0.01)
}

// ── il trasporto ────────────────────────────────────────────────────────────
function programma() {
  const c = contesto()
  if (!c || !suonando) return
  while (prossimo < c.currentTime + 0.12) {
    const i = passo
    const swing = i % 2 ? passoDurata() * (S.swing / 2) : 0
    const quando = prossimo + swing
    for (const st of STRUMENTI) if (P[st.id][i]) batti(st.id, quando)
    const fra = Math.max(0, (quando - c.currentTime) * 1000)
    const tv = setTimeout(() => evidenzia(i), fra)
    timersVisivi.add(tv)
    setTimeout(() => timersVisivi.delete(tv), fra + 60)
    passo = (passo + 1) % PASSI
    prossimo += passoDurata()
  }
}
function avvia() {
  if (suonando) return
  sblocca(); volume()
  suonando = true
  passo = 0
  prossimo = ora() + 0.06
  el.play.textContent = 'ferma'
  el.play.setAttribute('aria-pressed', 'true')
  timer = setInterval(programma, 25)
  programma()
}
function ferma() {
  suonando = false
  clearInterval(timer); timer = 0
  for (const t of timersVisivi) clearTimeout(t)
  timersVisivi.clear()
  if (el.play) { el.play.textContent = 'suona'; el.play.setAttribute('aria-pressed', 'false') }
  evidenzia(-1)
  sospendi()
}
function evidenzia(i) {
  if (!el.griglia) return
  for (const b of el.griglia.querySelectorAll('[data-passo]')) b.classList.toggle('is-ora', Number(b.dataset.passo) === i)
  for (const b of el.griglia.querySelectorAll('[data-num]')) b.classList.toggle('is-ora', Number(b.dataset.num) === i)
  if (el.contatore) el.contatore.textContent = i < 0 ? '—' : String(i + 1).padStart(2, '0')
}

// ── il foglio ───────────────────────────────────────────────────────────────
export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  ricorda()
  const pannello = (t, c) => `<section class="lab-pannello">${t ? `<h3>${t}</h3>` : ''}${c}</section>`
  const slider = (id, testo, min, max, passo, val, unita = '') => `<label class="bt-slider"><span>${testo}</span><input class="lab-range" type="range" data-s="${id}" min="${min}" max="${max}" step="${passo}" value="${val}" aria-label="${testo}"><b class="lab-valore" data-v="${id}">${val}${unita}</b></label>`
  dlg = await creaFoglio({
    chiave: 'batteria',
    titolo: 'batteria',
    voce: 'sedici passi, sei pezzi, tutto sintetizzato',
    corpo: `<div class="lab-griglia lab-griglia--larga">
      <div class="lab-colonna">
        <div class="lab-pannello bt-trasporto">
          <div class="lab-fila lab-fila--tra">
            <div class="lab-fila"><button type="button" class="bt-play" data-play aria-pressed="false">suona</button><button type="button" class="lab-tasto" data-pulisci>pulisci</button></div>
            <div class="lab-fila"><span class="lab-etichetta">passo</span><b class="bt-contatore" data-contatore>—</b></div>
          </div>
          ${slider('bpm', 'battiti', 50, 200, 1, S.bpm, ' bpm')}
          ${slider('swing', 'swing', 0, 0.7, 0.01, S.swing, '')}
          ${slider('volume', 'volume', 0, 1, 0.01, S.volume, '')}
        </div>
        <div class="bt-scena lab-scorri">
          <div class="bt-griglia" data-griglia role="group" aria-label="i sedici passi">
            <span></span>${Array.from({ length: PASSI }, (_, i) => `<b class="bt-num" data-num="${i}">${i + 1}</b>`).join('')}
            ${STRUMENTI.map((st) => `<span class="bt-nome" style="--c:${st.colore}">${st.nome}</span>${P[st.id].map((acceso, i) => `<button type="button" class="bt-pad${acceso ? ' is-on' : ''}" data-str="${st.id}" data-passo="${i}" style="--c:${st.colore}" aria-pressed="${!!acceso}" aria-label="${st.nome}, passo ${i + 1}"></button>`).join('')}`).join('')}
          </div>
        </div>
        <p class="lab-nota">spazio: suona o ferma · ogni passo si accende cliccandolo · il disegno si salva da solo.</p>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        ${pannello('i pezzi', `<ul class="bt-pezzi">${STRUMENTI.map((s) => `<li><i style="background:${s.colore}"></i>${s.nome}<button type="button" class="lab-link" data-ascolta="${s.id}">senti</button></li>`).join('')}</ul>`)}
        ${pannello('i giri', `<div class="bt-preset" role="group" aria-label="i giri pronti">${Object.keys(PRESET).map((k) => `<button type="button" class="lab-tasto" data-preset="${k}">${k}</button>`).join('')}</div>`)}
        ${pannello('come suona', `<p class="lab-nota">La cassa è un seno che scende da 165 a 46 Hz; il rullante è rumore filtrato più un triangolo; il charleston è rumore col passa-alto. Lo swing sposta i sedicesimi dispari, come una vera drum machine.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = { griglia: q('[data-griglia]'), play: q('[data-play]'), contatore: q('[data-contatore]') }
  for (const input of dlg.corpo.querySelectorAll('[data-s]')) {
    const k = input.dataset.s
    const v = q(`[data-v="${k}"]`)
    const unita = k === 'bpm' ? ' bpm' : ''
    const mostra = () => { v.textContent = `${k === 'swing' ? Math.round(Number(input.value) * 100) + '%' : input.value}${k === 'swing' ? '' : unita}` }
    input.addEventListener('input', () => { S[k] = Number(input.value); mostra(); volume(); ricordaAdesso() })
    mostra()
  }
  dlg.corpo.addEventListener('click', (e) => {
    const pad = e.target.closest('[data-str]')
    if (pad) {
      const id = pad.dataset.str, i = Number(pad.dataset.passo)
      P[id][i] = P[id][i] ? 0 : 1
      pad.classList.toggle('is-on', !!P[id][i])
      pad.setAttribute('aria-pressed', String(!!P[id][i]))
      ricordaAdesso()
      if (P[id][i]) colpo(id)
      return
    }
    if (e.target.closest('[data-play]')) { suonando ? ferma() : avvia(); return }
    if (e.target.closest('[data-pulisci]')) {
      for (const st of STRUMENTI) P[st.id].fill(0)
      for (const b of el.griglia.querySelectorAll('[data-str]')) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false') }
      ricordaAdesso(); return
    }
    const ascolta = e.target.closest('[data-ascolta]')
    if (ascolta) { colpo(ascolta.dataset.ascolta); return }
    const pre = e.target.closest('[data-preset]')
    if (pre) {
      const modello = PRESET[pre.dataset.preset]
      for (const st of STRUMENTI) {
        P[st.id] = [...modello[st.id]]
        for (const b of el.griglia.querySelectorAll(`[data-str="${st.id}"]`)) {
          const i = Number(b.dataset.passo)
          b.classList.toggle('is-on', !!P[st.id][i])
          b.setAttribute('aria-pressed', String(!!P[st.id][i]))
        }
      }
      ricordaAdesso(); dlg.voce(`giro «${pre.dataset.preset}»`); return
    }
  })
  const key = (e) => {
    if (e.code === 'Space' && !e.target.closest('input,textarea,select')) { e.preventDefault(); suonando ? ferma() : avvia() }
    if (e.code === 'Escape' && suonando) ferma()
  }
  dlg.dlg.addEventListener('keydown', key)
  dlg.alChiudere(() => { ferma(); dlg?.dlg.remove(); dlg = null })
  volume()
}
