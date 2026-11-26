// battito.js — «Battito»: una radio chiptune che si genera da sola.
//
// Tecnologia: Web Audio API (oscillatori, rumore, convolver per la stanza,
// analyser per l'oscilloscopio) e Web MIDI, se c'è un controller collegato.
// Il sequencer lavora con un lookahead di 120 ms: il timer non deve essere
// preciso, perché le note vengono messe in coda con il tempo dell'AudioContext.
//
//   apri()  apre la radio

import { creaDialogo } from '../../shell.js'

const SCALA = [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
const PAD = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]
const NOMI = ['la', 'do', 're', 'mi', 'sol', 'la', 'do', 're']

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'battito',
    titolo: 'Battito',
    tech: 'Web Audio · MIDI',
    voce: 'Una radio chiptune che si genera da sola: cassa, rullante, hi-hat, basso e una melodia che cambia a ogni giro.',
    larga: true,
    corpo: `
      <div class="lab-battito">
        <section class="lab-colonna">
          <div class="lab-pannello">
            <div class="lab-riga">
              <button type="button" class="lab-tasto lab-tasto--pieno" data-play data-focus>play</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-genera>genera</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-midi>MIDI</button>
            </div>
            <div class="lab-divisore"></div>
            <label class="lab-etichetta" for="bt-bpm">battiti al minuto · <b data-bpm>112</b></label>
            <input id="bt-bpm" class="lab-range" type="range" min="70" max="160" step="1" value="112" data-bpm-range>
            <label class="lab-etichetta" for="bt-vol">volume</label>
            <input id="bt-vol" class="lab-range" type="range" min="0" max="100" step="1" value="72" data-vol>
          </div>
          <div class="lab-pannello">
            <h3>I tasti</h3>
            <div class="lab-pads" role="group" aria-label="i tasti della melodia">
              ${PAD.map((f, i) => `<button type="button" class="lab-pad" data-nota="${i}" aria-label="${NOMI[i]}"><b>${i + 1}</b><span>${NOMI[i]}</span></button>`).join('')}
            </div>
            <p class="lab-nota">Tastiera <b>1–8</b> · MIDI · <b>P</b> play/stop. Le note suonate a mano si sommano al giro.</p>
          </div>
        </section>
        <section class="lab-colonna">
          <div class="lab-telecamera lab-scope-box">
            <canvas class="lab-scope" width="960" height="320" aria-label="l'oscilloscopio"></canvas>
          </div>
          <p class="lab-nota"><b>Come funziona:</b> il sequencer è a 16 passi; la melodia pesca dalla scala pentatonica di la minore. La stanza è una convoluzione con una coda generata al volo. Niente file audio: tutto si calcola qui.</p>
        </section>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const bottonePlay = q('[data-play]')
  const bottoneGenera = q('[data-genera]')
  const bottoneMidi = q('[data-midi]')
  const bpmOut = q('[data-bpm]')
  const rangeBpm = q('[data-bpm-range]')
  const rangeVol = q('[data-vol]')
  const scope = q('.lab-scope')
  const ctx2d = scope.getContext('2d')

  let ctx = null
  let master = null
  let analyser = null
  let dati = null
  let timer = 0
  let passo = 0
  let prossimo = 0
  let suonando = false
  let bpm = 112
  let volume = 0.72
  let raf = 0
  let fermo = false
  let midi = null
  let pattern = generaPattern()

  function generaPattern() {
    const kick = Array.from({ length: 16 }, (_, i) => i % 4 === 0 || (i === 10 && Math.random() < 0.35))
    const snare = Array.from({ length: 16 }, (_, i) => i === 4 || i === 12 || (i === 15 && Math.random() < 0.3))
    const hat = Array.from({ length: 16 }, (_, i) => i % 2 === 0 || Math.random() < 0.18)
    const bassi = Array.from({ length: 16 }, (_, i) => {
      if (![0, 3, 6, 8, 11, 14].includes(i)) return null
      return SCALA[Math.floor(Math.random() * 6)]
    })
    const melodia = Array.from({ length: 16 }, (_, i) => {
      if (Math.random() < (i % 4 === 0 ? 0.5 : 0.24)) return SCALA[5 + Math.floor(Math.random() * 7)]
      return null
    })
    return { kick, snare, hat, bassi, melodia }
  }

  function creaAudio() {
    if (ctx) return true
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) { d.nota('questo browser non ha Web Audio', 'male'); return false }
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = volume
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 20
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.25
    analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    dati = new Uint8Array(analyser.fftSize)

    // una stanza piccola, generata al volo: 1,8 secondi di coda
    const conv = ctx.createConvolver()
    const len = Math.floor(ctx.sampleRate * 1.8)
    const ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c)
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6)
    }
    conv.buffer = ir
    const wet = ctx.createGain()
    wet.gain.value = 0.14
    master.connect(comp)
    master.connect(conv)
    conv.connect(wet)
    wet.connect(comp)
    comp.connect(analyser)
    analyser.connect(ctx.destination)
    return true
  }

  function rumore(durata = 0.2) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * durata))
    const b = ctx.createBuffer(1, len, ctx.sampleRate)
    const ch = b.getChannelData(0)
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1
    const s = ctx.createBufferSource()
    s.buffer = b
    return s
  }

  function cassa(t) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
    g.gain.setValueAtTime(0.9, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
    o.connect(g)
    g.connect(master)
    o.start(t)
    o.stop(t + 0.3)
  }

  function rullante(t) {
    const s = rumore(0.2)
    const f = ctx.createBiquadFilter()
    const g = ctx.createGain()
    f.type = 'highpass'
    f.frequency.value = 1400
    g.gain.setValueAtTime(0.34, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    s.connect(f)
    f.connect(g)
    g.connect(master)
    s.start(t)
    s.stop(t + 0.2)
    const o = ctx.createOscillator()
    const og = ctx.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(190, t)
    o.frequency.exponentialRampToValueAtTime(120, t + 0.08)
    og.gain.setValueAtTime(0.14, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    o.connect(og)
    og.connect(master)
    o.start(t)
    o.stop(t + 0.12)
  }

  function charleston(t, forte = false) {
    const s = rumore(0.06)
    const f = ctx.createBiquadFilter()
    const g = ctx.createGain()
    f.type = 'highpass'
    f.frequency.value = 7200
    g.gain.setValueAtTime(forte ? 0.16 : 0.09, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045)
    s.connect(f)
    f.connect(g)
    g.connect(master)
    s.start(t)
    s.stop(t + 0.07)
  }

  function nota(t, freq, durata = 0.3, tipo = 'square', vol = 0.14) {
    if (!ctx || !freq) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const f = ctx.createBiquadFilter()
    o.type = tipo
    o.frequency.setValueAtTime(freq, t)
    f.type = 'lowpass'
    f.frequency.setValueAtTime(tipo === 'sawtooth' ? 2200 : 3200, t)
    f.Q.value = 0.6
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata)
    o.connect(f)
    f.connect(g)
    g.connect(master)
    o.start(t)
    o.stop(t + durata + 0.02)
  }

  function suonaPasso(i, t) {
    if (pattern.kick[i]) cassa(t)
    if (pattern.snare[i]) rullante(t)
    if (pattern.hat[i]) charleston(t, i % 4 === 0)
    if (pattern.bassi[i]) nota(t, pattern.bassi[i] / 2, 0.22, 'sawtooth', 0.11)
    if (pattern.melodia[i]) nota(t, pattern.melodia[i], 0.18, 'square', 0.07)
  }

  function pianifica() {
    if (!ctx || !suonando) return
    while (prossimo < ctx.currentTime + 0.12) {
      suonaPasso(passo, prossimo)
      prossimo += 60 / bpm / 4
      passo = (passo + 1) % 16
    }
  }

  async function avvia() {
    if (!creaAudio()) return
    try { await ctx.resume() } catch {}
    if (suonando) return
    suonando = true
    passo = 0
    prossimo = ctx.currentTime + 0.06
    timer = setInterval(pianifica, 25)
    bottonePlay.textContent = 'stop'
    bottonePlay.classList.add('lab-tasto--pericolo')
    d.nota('in onda · 16 passi', 'ok')
  }

  function ferma() {
    suonando = false
    clearInterval(timer)
    bottonePlay.textContent = 'play'
    bottonePlay.classList.remove('lab-tasto--pericolo')
    d.nota('in pausa')
  }

  function notaAMano(i) {
    if (!creaAudio()) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    nota(ctx.currentTime + 0.01, PAD[i], 0.35, 'square', 0.12)
  }

  bottonePlay.addEventListener('click', () => { suonando ? ferma() : avvia() })
  bottoneGenera.addEventListener('click', () => {
    pattern = generaPattern()
    d.nota('nuovo giro', 'ok')
  })
  rangeBpm.addEventListener('input', () => {
    bpm = Number(rangeBpm.value)
    bpmOut.textContent = String(bpm)
  })
  rangeVol.addEventListener('input', () => {
    volume = Number(rangeVol.value) / 100
    if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02)
  })
  d.corpo.addEventListener('pointerdown', (e) => {
    const p = e.target.closest('[data-nota]')
    if (!p) return
    const i = Number(p.dataset.nota)
    notaAMano(i)
    p.classList.add('is-on')
    setTimeout(() => p.classList.remove('is-on'), 130)
  })

  bottoneMidi.addEventListener('click', async () => {
    if (!navigator.requestMIDIAccess) return d.nota('questo browser non ha Web MIDI', 'male')
    try {
      midi = await navigator.requestMIDIAccess()
      collegaMidi()
      d.nota('MIDI collegato', 'ok')
    } catch (e) {
      d.nota('MIDI non autorizzato', 'male')
      console.warn(e)
    }
  })

  function collegaMidi() {
    if (!midi) return
    for (const input of midi.inputs.values()) {
      input.onmidimessage = (e) => {
        const [stato, notaMidi, vel] = e.data
        if ((stato & 0xf0) !== 0x90 || !vel) return
        if (!creaAudio()) return
        if (ctx.state === 'suspended') ctx.resume().catch(() => {})
        const freq = 440 * Math.pow(2, (notaMidi - 69) / 12)
        nota(ctx.currentTime + 0.01, freq, 0.3, 'sawtooth', 0.1)
      }
    }
    midi.onstatechange = () => {
      const n = [...midi.inputs.values()].filter((x) => x.state === 'connected').length
      d.nota(n ? `MIDI: ${n} controller` : 'MIDI: nessun controller', n ? 'ok' : 'attesa')
      collegaMidi()
    }
  }

  const tasti = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.target.closest('input, textarea, select')) return
    if (/^[1-8]$/.test(e.key)) {
      e.preventDefault()
      notaAMano(Number(e.key) - 1)
      const p = d.corpo.querySelector(`[data-nota="${Number(e.key) - 1}"]`)
      p?.classList.add('is-on')
      setTimeout(() => p?.classList.remove('is-on'), 130)
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault()
      suonando ? ferma() : avvia()
    }
  }
  document.addEventListener('keydown', tasti)

  function disegna() {
    if (fermo) return
    raf = requestAnimationFrame(disegna)
    const w = scope.width, h = scope.height
    ctx2d.fillStyle = '#05070a'
    ctx2d.fillRect(0, 0, w, h)
    // griglia
    ctx2d.strokeStyle = 'rgba(204,255,0,.08)'
    ctx2d.lineWidth = 1
    for (let x = 0; x <= w; x += w / 12) {
      ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, h); ctx2d.stroke()
    }
    for (let y = 0; y <= h; y += h / 6) {
      ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(w, y); ctx2d.stroke()
    }
    ctx2d.strokeStyle = 'rgba(255,255,255,.12)'
    ctx2d.beginPath(); ctx2d.moveTo(0, h / 2); ctx2d.lineTo(w, h / 2); ctx2d.stroke()

    if (!analyser) {
      ctx2d.fillStyle = 'rgba(167,179,166,.75)'
      ctx2d.font = '13px "Lab Mono", monospace'
      ctx2d.fillText('premi play per accendere la radio', 24, h / 2 - 14)
      return
    }
    analyser.getByteTimeDomainData(dati)
    ctx2d.strokeStyle = '#ccff00'
    ctx2d.lineWidth = 2.4
    ctx2d.shadowColor = 'rgba(204,255,0,.75)'
    ctx2d.shadowBlur = 14
    ctx2d.beginPath()
    const passoX = w / dati.length
    for (let i = 0; i < dati.length; i++) {
      const y = (dati[i] / 128) * (h / 2)
      if (i === 0) ctx2d.moveTo(0, y)
      else ctx2d.lineTo(i * passoX, y)
    }
    ctx2d.stroke()
    ctx2d.shadowBlur = 0
  }

  d.suPulizia(() => {
    fermo = true
    cancelAnimationFrame(raf)
    clearInterval(timer)
    document.removeEventListener('keydown', tasti)
    if (midi) {
      for (const input of midi.inputs.values()) input.onmidimessage = null
      midi.onstatechange = null
    }
    if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {})
  })

  d.apri()
  raf = requestAnimationFrame(disegna)
  d.nota('pronto · premi play')
  return d
}
