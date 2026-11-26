// SYNTH (26.11): un sintetizzatore polifonico dentro il browser, senza plugin e senza campioni. Due oscillatori per
// nota, inviluppo ADSR, filtro passa-basso risonante, arpeggiatore e tastiera MIDI vera (Web MIDI). Il suono nasce tutto
// qui: oscillatori e filtri della Web Audio API. Le impostazioni restano nel browser (pzkko-synth).
//
//   apri()   apre il banco (la prima volta lo costruisce)

import { creaFoglio, tela, ciclo, clamp, mappa, it, hz, nota, freqMidi } from '/games/lab/lab.js'
import { contesto, sblocca, uscita, sospendi } from '/games/lab/audio.js'

const CHIAVE = 'pzkko-synth'
const ONDE = [['sine', 'sin'], ['triangle', 'tri'], ['sawtooth', 'saw'], ['square', 'quadra']]
const SCALA = ['do', 'do#', 're', 're#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']
const TASTI = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12 }
const PERSO = {
  onda: 'sawtooth', detune: 7, ottava: 0, attacco: 0.01, decadimento: 0.18, sostegno: 0.65, rilascio: 0.28,
  taglio: 2600, risonanza: 4, volume: 0.8, arp: false, bpm: 132, modo: 'su',
}

let dlg = null, el = {}, telaOsc = null, disegno = null, catena = null
let filtro = null, analizzatore = null, datiOsc = null
let voci = new Map(), tenuti = new Set(), arpTimer = 0, arpPasso = 0
let midiAccess = null, midiIngressi = []
let vista = { w: 1, h: 1 }
const S = { ...PERSO }
const OTT = [-2, -1, 0, 1, 2]
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

function ricorda() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (!s || typeof s !== 'object') return
    for (const k of Object.keys(PERSO)) if (k in s && typeof s[k] === typeof PERSO[k]) S[k] = s[k]
    if (!ONDE.some(([o]) => o === S.onda)) S.onda = PERSO.onda
    if (!['su', 'giu', 'caso'].includes(S.modo)) S.modo = PERSO.modo
  } catch {}
}
function ricordaAdesso() { try { localStorage.setItem(CHIAVE, JSON.stringify(S)) } catch {} }

function catenaAudio() {
  const c = contesto()
  if (!c) return null
  if (filtro) return filtro
  filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  analizzatore = c.createAnalyser()
  analizzatore.fftSize = 2048
  analizzatore.smoothingTimeConstant = 0.75
  datiOsc = new Uint8Array(analizzatore.fftSize)
  filtro.connect(analizzatore)
  analizzatore.connect(uscita())
  aggiornaFiltro()
  return filtro
}
function aggiornaFiltro() {
  if (!filtro) return
  const t = contesto().currentTime
  filtro.frequency.setTargetAtTime(clamp(S.taglio, 80, 14000), t, 0.02)
  filtro.Q.setTargetAtTime(clamp(S.risonanza, 0.1, 22), t, 0.02)
  if (uscita()) uscita().gain.setTargetAtTime(0.15 + S.volume * 0.85, t, 0.03)
}
const ottave = () => OTT[clamp(S.ottava, 0, OTT.length - 1)]
const midiReale = (m) => m + 12 * ottave()

function suona(midi, vel = 0.8) {
  const c = contesto()
  if (!c) return
  sblocca()
  const f = catenaAudio()
  if (!f) return
  if (voci.has(midi)) return
  const t = c.currentTime
  const base = freqMidi(midi)
  const o1 = c.createOscillator()
  const o2 = c.createOscillator()
  o1.type = S.onda
  o2.type = S.onda
  o1.frequency.setValueAtTime(base, t)
  o2.frequency.setValueAtTime(base, t)
  o1.detune.setValueAtTime(-S.detune, t)
  o2.detune.setValueAtTime(S.detune, t)
  const vca = c.createGain()
  vca.gain.setValueAtTime(0.0001, t)
  const picco = Math.max(0.0002, (0.1 + vel * 0.9) * 0.19)
  const a = Math.max(0.003, S.attacco)
  const d = Math.max(0.02, S.decadimento)
  vca.gain.exponentialRampToValueAtTime(picco, t + a)
  vca.gain.exponentialRampToValueAtTime(Math.max(0.0002, picco * S.sostegno), t + a + d)
  o1.connect(vca); o2.connect(vca); vca.connect(f)
  o1.start(t); o2.start(t)
  voci.set(midi, { o1, o2, vca, midi })
  segnaTasto(midi, true)
}
function spegni(midi) {
  const v = voci.get(midi)
  if (!v) return
  voci.delete(midi)
  segnaTasto(midi, false)
  const c = contesto()
  if (!c) return
  const t = c.currentTime
  const r = Math.max(0.02, S.rilascio)
  const g = v.vca.gain
  if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t)
  else { g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t) }
  g.exponentialRampToValueAtTime(0.0001, t + r)
  v.o1.stop(t + r + 0.04)
  v.o2.stop(t + r + 0.04)
  v.o1.onended = () => { try { v.vca.disconnect() } catch {} }
}
function ping(midi, vel = 0.7, dur = 0.2) {
  const c = contesto()
  if (!c) return
  sblocca()
  const f = catenaAudio()
  if (!f) return
  const t = c.currentTime
  const base = freqMidi(midi)
  const o1 = c.createOscillator(), o2 = c.createOscillator()
  o1.type = S.onda; o2.type = S.onda
  o1.frequency.setValueAtTime(base, t); o2.frequency.setValueAtTime(base, t)
  o1.detune.setValueAtTime(-S.detune, t); o2.detune.setValueAtTime(S.detune, t)
  const vca = c.createGain()
  vca.gain.setValueAtTime(0.0001, t)
  const picco = Math.max(0.0002, (0.1 + vel * 0.9) * 0.19)
  vca.gain.exponentialRampToValueAtTime(picco, t + 0.006)
  vca.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.06, dur))
  o1.connect(vca); o2.connect(vca); vca.connect(f)
  o1.start(t); o2.start(t)
  o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05)
  o1.onended = () => { try { vca.disconnect() } catch {} }
  segnaTasto(midi, true)
  setTimeout(() => segnaTasto(midi, false), Math.max(70, dur * 700))
}

function segnaTasto(midi, acceso) {
  const base = midi - 12 * ottave()
  const b = el.piano?.querySelector(`[data-midi="${base}"]`)
  if (b) b.classList.toggle('is-on', acceso)
  if (acceso) {
    el.nota.textContent = nota(midi)
    const n = SCALA[((midi % 12) + 12) % 12]
    el.hz.textContent = `${hz(freqMidi(midi))} · ${n}`
  }
}

// ── l'arpeggiatore: legge le note tenute e le ripete a tempo ─────────────────
function arpAggiorna() {
  clearInterval(arpTimer)
  arpTimer = 0
  if (!S.arp) return
  arpPasso = 0
  const passo = 60000 / clamp(S.bpm, 40, 220) / 2
  arpTimer = setInterval(() => {
    if (!tenuti.size) return
    const note = [...tenuti].sort((a, b) => a - b)
    let m
    if (S.modo === 'giu') m = note[note.length - 1 - (arpPasso % note.length)]
    else if (S.modo === 'caso') m = note[Math.floor(Math.random() * note.length)]
    else m = note[arpPasso % note.length]
    arpPasso++
    ping(m, 0.7, Math.min(0.28, passo / 1000 * 0.7))
  }, passo)
}
function tenuta(midi, acceso) {
  if (acceso) {
    tenuti.add(midi)
    if (!S.arp) suona(midi, 0.85)
    else segnaTasto(midi, true)
  } else {
    tenuti.delete(midi)
    if (!S.arp) spegni(midi)
    else segnaTasto(midi, false)
  }
}

// ── il foglio ───────────────────────────────────────────────────────────────
export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
  if (S.arp && !arpTimer) arpAggiorna()
}

async function costruisci() {
  ricorda()
  const pannello = (titolo, dentro) => `<section class="lab-pannello"><h3>${titolo}</h3>${dentro}</section>`
  const slider = (id, testo, min, max, passo, val, unita = '') => `<label class="sy-slider"><span>${testo}</span><input class="lab-range" type="range" data-s="${id}" min="${min}" max="${max}" step="${passo}" value="${val}" aria-label="${testo}"><b class="lab-valore" data-v="${id}">${val}${unita}</b></label>`
  dlg = await creaFoglio({
    chiave: 'synth',
    titolo: 'synth',
    voce: 'tocca i tasti, o collega una tastiera MIDI',
    corpo: `<div class="lab-griglia lab-griglia--larga">
      <div class="lab-colonna">
        <div class="lab-scena sy-scena"><canvas data-osc aria-label="la forma d'onda"></canvas>
          <div class="sy-display"><b data-nota>—</b><span data-hz>nessuna nota</span></div>
          <span class="sy-eti">oscilloscopio</span>
        </div>
        <div class="sy-piano" data-piano role="group" aria-label="la tastiera"></div>
        <p class="lab-nota">sulla tastiera del computer: <b>a w s e d f t g y h u j k</b> · le impostazioni restano in questo browser.</p>
      </div>
      <aside class="lab-colonna lab-colonna--lato lab-scorri">
        ${pannello('oscillatore', `<div class="lab-fila" data-onde role="group" aria-label="la forma d'onda">${ONDE.map(([o, n]) => `<button type="button" class="lab-tasto" data-onda="${o}" aria-pressed="${S.onda === o}">${n}</button>`).join('')}</div>
          ${slider('detune', 'detune', 0, 30, 1, S.detune, '¢')}
          ${slider('ottava', 'ottava', 0, 4, 1, S.ottava, '')}`)}
        ${pannello('inviluppo', `${slider('attacco', 'attacco', 0.003, 1.5, 0.001, S.attacco, 's')}${slider('decadimento', 'decadimento', 0.02, 1.5, 0.01, S.decadimento, 's')}${slider('sostegno', 'sostegno', 0, 1, 0.01, S.sostegno, '')}${slider('rilascio', 'rilascio', 0.02, 2, 0.01, S.rilascio, 's')}`)}
        ${pannello('filtro', `${slider('taglio', 'taglio', 80, 14000, 10, S.taglio, ' Hz')}${slider('risonanza', 'risonanza', 0.1, 22, 0.1, S.risonanza, '')}${slider('volume', 'volume', 0, 1, 0.01, S.volume, '')}`)}
        ${pannello('arpeggiatore', `<div class="lab-fila lab-fila--tra"><button type="button" class="lab-tasto" data-arp aria-pressed="${S.arp}">${S.arp ? 'acceso' : 'spento'}</button><span class="lab-etichetta">tieni le note</span></div>
          ${slider('bpm', 'battiti', 50, 200, 1, S.bpm, '')}
          <div class="lab-fila" data-modi role="group" aria-label="il giro">${[['su', 'su'], ['giu', 'giù'], ['caso', 'caso']].map(([m, n]) => `<button type="button" class="lab-tasto" data-modo="${m}" aria-pressed="${S.modo === m}">${n}</button>`).join('')}</div>`)}
        ${pannello('midi', `<div class="lab-fila lab-fila--tra"><button type="button" class="lab-tasto" data-midi-btn>collega</button><span class="lab-led" data-midi-led></span></div><p class="lab-nota" data-midi-stato>nessuna tastiera collegata</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    nota: q('[data-nota]'), hz: q('[data-hz]'), piano: q('[data-piano]'), onde: q('[data-onde]'),
    arp: q('[data-arp]'), modi: q('[data-modi]'), midiStato: q('[data-midi-stato]'), midiLed: q('[data-midi-led]'),
  }
  costruisciPiano()
  // i valori degli slider
  for (const input of dlg.corpo.querySelectorAll('[data-s]')) {
    const k = input.dataset.s
    const v = q(`[data-v="${k}"]`)
    const unita = k === 'taglio' ? ' Hz' : k === 'detune' ? '¢' : ['attacco', 'decadimento', 'rilascio'].includes(k) ? 's' : ''
    const mostra = () => { v.textContent = `${k === 'taglio' ? it(input.value) : input.value}${unita}` }
    input.addEventListener('input', () => {
      S[k] = Number(input.value)
      if (k === 'attacco' || k === 'decadimento' || k === 'sostegno' || k === 'rilascio') S[k] = Number(input.value)
      mostra(); ricordaAdesso(); aggiornaFiltro()
    })
    mostra()
  }
  dlg.corpo.addEventListener('click', (e) => {
    const onda = e.target.closest('[data-onda]')
    if (onda) {
      S.onda = onda.dataset.onda
      for (const b of el.onde.querySelectorAll('[data-onda]')) b.setAttribute('aria-pressed', String(b === onda))
      for (const v of voci.values()) { v.o1.type = S.onda; v.o2.type = S.onda }
      ricordaAdesso(); return
    }
    if (e.target.closest('[data-arp]')) {
      S.arp = !S.arp
      el.arp.setAttribute('aria-pressed', String(S.arp))
      el.arp.textContent = S.arp ? 'acceso' : 'spento'
      if (!S.arp) { for (const m of tenuti) if (voci.has(m)) spegni(m) }
      arpAggiorna(); ricordaAdesso(); return
    }
    const modo = e.target.closest('[data-modo]')
    if (modo) {
      S.modo = modo.dataset.modo
      for (const b of el.modi.querySelectorAll('[data-modo]')) b.setAttribute('aria-pressed', String(b === modo))
      arpAggiorna(); ricordaAdesso(); return
    }
    if (e.target.closest('[data-midi-btn]')) chiediMidi(true)
  })
  // la tastiera del computer
  const premuti = new Set()
  const giu = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    const off = TASTI[e.key.toLowerCase()]
    if (off === undefined) return
    e.preventDefault()
    const m = midiReale(60 + off)
    premuti.add(e.key.toLowerCase())
    tenuta(m, true)
  }
  const su = (e) => {
    const off = TASTI[e.key.toLowerCase()]
    if (off === undefined || !premuti.has(e.key.toLowerCase())) return
    premuti.delete(e.key.toLowerCase())
    tenuta(midiReale(60 + off), false)
  }
  dlg.dlg.addEventListener('keydown', giu)
  dlg.dlg.addEventListener('keyup', su)
  el.piano.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-midi]')
    if (!b) return
    e.preventDefault()
    tenuta(midiReale(Number(b.dataset.midi)), true)
    const lascia = () => { tenuta(midiReale(Number(b.dataset.midi)), false); b.removeEventListener('pointerleave', lascia); window.removeEventListener('pointerup', lascia); window.removeEventListener('pointercancel', lascia) }
    b.addEventListener('pointerleave', lascia)
    window.addEventListener('pointerup', lascia, { once: true })
    window.addEventListener('pointercancel', lascia, { once: true })
  })
  dlg.alChiudere(() => {
    clearInterval(arpTimer); arpTimer = 0
    for (const m of [...voci.keys()]) spegni(m)
    tenuti.clear()
    disegno?.ferma(); disegno = null
    telaOsc?.ferma(); telaOsc = null
    sospendi()
    dlg?.dlg.remove(); dlg = null
  })
  // l'oscilloscopio
  const canvas = q('[data-osc]')
  telaOsc = tela(canvas)
  const ctx = telaOsc.ctx
  disegno = ciclo(() => {
    if (!ctx) return
    const w = telaOsc.w, h = telaOsc.h
    if (!w || !h) return
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#10130f'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(204,255,0,.14)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y <= h; y += h / 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    if (!analizzatore) return
    analizzatore.getByteTimeDomainData(datiOsc)
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ccff00'
    ctx.shadowColor = 'rgba(204,255,0,.65)'
    ctx.shadowBlur = 8
    for (let i = 0; i < datiOsc.length; i++) {
      const x = (i / (datiOsc.length - 1)) * w
      const y = h / 2 + ((datiOsc[i] - 128) / 128) * (h * 0.42)
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
    if (RIDOTTO.matches) return
    ctx.fillStyle = 'rgba(204,255,0,.06)'
    ctx.fillRect(0, 0, w, h)
  })
  if (S.arp) arpAggiorna()
  if (S.onda) for (const b of el.onde.querySelectorAll('[data-onda]')) b.setAttribute('aria-pressed', String(b.dataset.onda === S.onda))
}

function costruisciPiano() {
  if (!el.piano) return
  const base = 48
  const bianche = [0, 2, 4, 5, 7, 9, 11]
  const tutte = []
  for (let i = 0; i <= 24; i++) tutte.push(base + i)
  const nBianche = tutte.filter((m) => bianche.includes(m % 12)).length
  const larg = 100 / nBianche
  let iBianca = 0
  el.piano.innerHTML = tutte.map((m) => {
    const nera = !bianche.includes(m % 12)
    const n = SCALA[m % 12]
    if (!nera) {
      const left = iBianca * larg
      iBianca++
      return `<button type="button" class="sy-tasto sy-bianco" data-midi="${m}" style="left:${left}%;width:${larg}%" aria-label="${n}${Math.floor(m / 12) - 1}"><span>${n}</span></button>`
    }
    const bw = larg * 0.62
    const left = iBianca * larg - bw / 2
    return `<button type="button" class="sy-tasto sy-nero" data-midi="${m}" style="left:${left}%;width:${bw}%" aria-label="${n}${Math.floor(m / 12) - 1}"></button>`
  }).join('')
}

// ── il MIDI (Web MIDI): tastiere vere collegate al browser ──────────────────
async function chiediMidi(mostra) {
  if (!('requestMIDIAccess' in navigator)) {
    if (mostra) dlg?.voce('questo browser non ha il MIDI: suona con la tastiera', true)
    if (el.midiStato) el.midiStato.textContent = 'MIDI non disponibile in questo browser'
    return
  }
  try {
    midiAccess = midiAccess || await navigator.requestMIDIAccess({ sysex: false })
  } catch {
    if (mostra) dlg?.voce('MIDI non autorizzato', true)
    if (el.midiStato) el.midiStato.textContent = 'MIDI non autorizzato'
    return
  }
  const collega = () => {
    midiIngressi = [...midiAccess.inputs.values()]
    for (const i of midiIngressi) i.onmidimessage = (m) => {
      const d = m.data
      if (!d || d.length < 3) return
      const comando = d[0] & 0xf0
      const n = d[1], v = d[2]
      if (comando === 0x90 && v > 0) {
        tenuti.add(n)
        if (S.arp) segnaTasto(n, true)
        else suona(n, v / 127)
      } else if (comando === 0x80 || (comando === 0x90 && v === 0)) {
        tenuti.delete(n)
        if (!S.arp) spegni(n)
        else segnaTasto(n, false)
      }
    }
    if (el.midiLed) {
      el.midiLed.classList.toggle('is-on', midiIngressi.length > 0)
      el.midiLed.classList.toggle('is-attesa', midiIngressi.length === 0)
    }
    if (el.midiStato) el.midiStato.textContent = midiIngressi.length
      ? midiIngressi.map((i) => i.name || 'tastiera MIDI').join(', ')
      : 'nessuna tastiera collegata'
    if (mostra) dlg?.voce(midiIngressi.length ? `${midiIngressi.length} tastiera MIDI collegata` : 'MIDI pronto: accendi una tastiera')
  }
  collega()
  midiAccess.onstatechange = collega
  if (mostra && dlg && el.midiStato) dlg.voce('MIDI pronto')
}
