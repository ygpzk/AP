// THEREMIN (26.11): si suona senza toccare niente. La mano destra (o il dito) sceglie la nota, l'altezza dà il volume;
// sul telefono si inclina il telefono e suonano i sensori di movimento (DeviceOrientation). Il suono è un oscillatore
// con un filtro e una coda di riverbero generata al volo: nessun campione, nessun file.
//
//   apri()   apre lo strumento

import { creaFoglio, tela, ciclo, clamp, mappa, hz, nota, freqMidi } from '/games/lab/lab.js'
import { contesto, sblocca, uscita, sospendi } from '/games/lab/audio.js'

const SCALE = {
  pentatonica: { nome: 'pentatonica', passi: [0, 2, 4, 7, 9] },
  maggiore: { nome: 'maggiore', passi: [0, 2, 4, 5, 7, 9, 11] },
  minore: { nome: 'minore', passi: [0, 2, 3, 5, 7, 8, 10] },
  blues: { nome: 'blues', passi: [0, 3, 5, 6, 7, 10] },
  cromatica: { nome: 'cromatica', passi: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
}
const ONDE = [['sine', 'sin'], ['triangle', 'tri'], ['sawtooth', 'saw']]
const BASE = 60 // do4
const OTTAVE = 2
const S = { scala: 'pentatonica', onda: 'sine', spazio: true, sensori: false }
const V = { attiva: false, x: 0.5, y: 0.5, vx: 0.5, vy: 0.5, volume: 0, nota: 60 }
let dlg = null, el = {}, telaSt = null, disegno = null
let ctxAudio = null, osc = null, vca = null, filtro = null, secco = null, bagnato = null, convolver = null
let scia = []
let sensoriAttivi = false
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

function noteScala() {
  const passi = SCALE[S.scala].passi
  const out = []
  const n = passi.length * OTTAVE + 1
  for (let i = 0; i < n; i++) out.push(BASE + passi[i % passi.length] + 12 * Math.floor(i / passi.length))
  return out
}
const indiceNota = (x) => {
  const n = noteScala().length
  return clamp(Math.round(x * (n - 1)), 0, n - 1)
}
const midiDaX = (x) => noteScala()[indiceNota(x)]

function catena() {
  const c = contesto()
  if (!c) return null
  if (ctxAudio) return ctxAudio
  ctxAudio = c
  osc = c.createOscillator()
  osc.type = S.onda
  osc.frequency.value = freqMidi(BASE + 12)
  filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 5200
  filtro.Q.value = 0.6
  vca = c.createGain()
  vca.gain.value = 0
  secco = c.createGain()
  secco.gain.value = 0.75
  convolver = c.createConvolver()
  convolver.buffer = impulso(c, 2.2)
  bagnato = c.createGain()
  bagnato.gain.value = S.spazio ? 0.36 : 0
  osc.connect(filtro); filtro.connect(vca)
  vca.connect(secco); secco.connect(uscita())
  vca.connect(convolver); convolver.connect(bagnato); bagnato.connect(uscita())
  osc.start()
  return c
}
function impulso(c, sec) {
  const n = Math.floor(c.sampleRate * sec)
  const b = c.createBuffer(2, n, c.sampleRate)
  for (let canale = 0; canale < 2; canale++) {
    const d = b.getChannelData(canale)
    for (let i = 0; i < n; i++) {
      const t = i / n
      d[i] = (Math.random() * 2 - 1) * (1 - t) ** 2.4 * (canale ? 0.9 : 1)
    }
  }
  return b
}
function accendi() {
  if (V.attiva) return
  const c = catena()
  if (!c) { dlg?.voce('questo browser non ha l’audio', true); return }
  sblocca()
  V.attiva = true
  el.suona.textContent = 'ferma'
  el.suona.setAttribute('aria-pressed', 'true')
  el.stato.textContent = 'suona'
  el.stato.className = 'lab-led is-on'
  applica(0)
}
function spegni() {
  if (!V.attiva) return
  V.attiva = false
  if (vca && ctxAudio) {
    const t = ctxAudio.currentTime
    vca.gain.cancelScheduledValues(t)
    vca.gain.setTargetAtTime(0.0001, t, 0.03)
  }
  scia = []
  el.suona.textContent = 'suona'
  el.suona.setAttribute('aria-pressed', 'false')
  el.stato.textContent = 'fermo'
  el.stato.className = 'lab-led'
}
function applica(dt) {
  if (!ctxAudio) return
  const k = 1 - Math.exp(-dt / 90)
  V.vx += (V.x - V.vx) * k
  V.vy += (V.y - V.vy) * k
  const midi = midiDaX(V.vx)
  const f = freqMidi(midi)
  const vol = clamp(1 - V.vy, 0, 1)
  const t = ctxAudio.currentTime
  if (V.attiva) {
    osc.frequency.setTargetAtTime(f, t, 0.035)
    vca.gain.setTargetAtTime(0.0001 + vol * vol * 0.32, t, 0.05)
    if (midi !== V.nota) {
      V.nota = midi
      el.nota.textContent = nota(midi)
      el.hzNota.textContent = hz(f)
    }
    el.volume.style.setProperty('--v', String(vol))
    el.volumeVal.textContent = `${Math.round(vol * 100)}%`
  }
  // la scia
  if (V.attiva && !RIDOTTO.matches) {
    scia.push({ x: V.vx, y: V.vy, vita: 1 })
    if (scia.length > 26) scia.shift()
  }
  for (const p of scia) p.vita -= dt / 700
  scia = scia.filter((p) => p.vita > 0)
}

function disegna() {
  const ctx = telaSt?.ctx
  if (!ctx) return
  const w = telaSt.w, h = telaSt.h
  if (!w || !h) return
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#10120f'
  ctx.fillRect(0, 0, w, h)
  const note = noteScala()
  const passo = h / note.length
  ctx.font = '10px "Special Elite","Courier New",monospace'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < note.length; i++) {
    const y = h - (i + 0.5) * passo
    ctx.strokeStyle = i % 5 === 0 ? 'rgba(204,255,0,.2)' : 'rgba(204,255,0,.075)'
    ctx.beginPath(); ctx.moveTo(58, y); ctx.lineTo(w - 8, y); ctx.stroke()
    ctx.fillStyle = i % 5 === 0 ? 'rgba(204,255,0,.75)' : 'rgba(204,255,0,.35)'
    ctx.fillText(nota(note[i]), 10, y)
  }
  // la linea del volume
  const x = 58 + V.vx * (w - 66)
  const y = h - V.vy * h
  for (const p of scia) {
    const px = 58 + p.x * (w - 66)
    const py = h - p.y * h
    ctx.beginPath(); ctx.arc(px, py, 8 * p.vita + 1, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(204,255,0,${0.18 * p.vita})`; ctx.fill()
  }
  if (V.attiva) {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(204,255,0,.16)'; ctx.fill()
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#ccff00'; ctx.shadowColor = 'rgba(204,255,0,.9)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(204,255,0,.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  } else {
    ctx.fillStyle = 'rgba(204,255,0,.35)'
    ctx.font = '14px "Permanent Marker","Comic Sans MS",cursive'
    ctx.textAlign = 'center'
    ctx.fillText('accendi e muovi il dito qui', w / 2, h / 2)
    ctx.textAlign = 'left'
  }
}

// ── il foglio ───────────────────────────────────────────────────────────────
export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  const pannello = (t, c) => `<section class="lab-pannello"><h3>${t}</h3>${c}</section>`
  dlg = await creaFoglio({
    chiave: 'theremin',
    titolo: 'theremin',
    voce: 'la mano destra sceglie la nota, l’altezza dà il volume',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-scena th-scena" data-scena tabindex="0" aria-label="il campo del theremin: muovi il puntatore">
          <canvas data-tela></canvas>
          <div class="th-lettura"><b data-nota>do4</b><span data-hz>261.63 Hz</span></div>
          <div class="th-volume" data-volume style="--v:.5"><i></i><span data-volume-val>50%</span></div>
        </div>
        <div class="lab-fila lab-fila--tra">
          <div class="lab-fila"><button type="button" class="th-suona" data-suona aria-pressed="false">suona</button><span class="lab-led" data-stato></span><span class="lab-etichetta">strumento</span></div>
          <p class="lab-nota">più in alto = più forte · più a destra = più acuto</p>
        </div>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        ${pannello('scala', `<div class="th-scala" role="group" aria-label="la scala">${Object.entries(SCALE).map(([k, v]) => `<button type="button" class="lab-tasto" data-scala="${k}" aria-pressed="${S.scala === k}">${v.nome}</button>`).join('')}</div>`)}
        ${pannello('timbro', `<div class="th-onde" role="group" aria-label="l'onda">${ONDE.map(([o, n]) => `<button type="button" class="lab-tasto" data-onda="${o}" aria-pressed="${S.onda === o}">${n}</button>`).join('')}</div>
          <div class="lab-fila lab-fila--tra" style="margin-top:8px"><span class="lab-etichetta">spazio</span><button type="button" class="lab-tasto" data-spazio aria-pressed="${S.spazio}">${S.spazio ? 'acceso' : 'spento'}</button></div>`)}
        ${pannello('sensori', `<button type="button" class="lab-tasto" data-sensori>inclina il telefono</button><p class="lab-nota" data-sensori-stato>sul telefono: inclina a destra e sinistra per la nota, avanti e indietro per il volume.</p>`)}
        ${pannello('come suona', `<p class="lab-nota">Un oscillatore che scivola tra le note della scala, un filtro passa-basso e un riverbero fatto di rumore che si spegne. Nessun campione, nessun file scaricato.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    scena: q('[data-scena]'), nota: q('[data-nota]'), hzNota: q('[data-hz]'), volume: q('[data-volume]'),
    volumeVal: q('[data-volume-val]'), suona: q('[data-suona]'), stato: q('[data-stato]'),
    sensoriStato: q('[data-sensori-stato]'),
  }
  telaSt = tela(q('[data-tela]'))
  V.nota = midiDaX(V.vx)
  el.nota.textContent = nota(V.nota)
  el.hzNota.textContent = hz(freqMidi(V.nota))
  disegno = ciclo((t, dt) => { applica(dt); disegna() })
  const punta = (e) => {
    const r = el.scena.getBoundingClientRect()
    V.x = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1)
    V.y = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1)
  }
  el.scena.addEventListener('pointerdown', (e) => { try { el.scena.setPointerCapture?.(e.pointerId) } catch {}; punta(e); if (!V.attiva) accendi() })
  el.scena.addEventListener('pointermove', (e) => { if (e.buttons || V.attiva) punta(e) })
  el.scena.addEventListener('pointerup', () => { if (!sensoriAttivi) spegni() })
  el.scena.addEventListener('pointercancel', () => { if (!sensoriAttivi) spegni() })
  el.scena.addEventListener('pointerleave', () => { if (!sensoriAttivi) spegni() })
  dlg.corpo.addEventListener('click', (e) => {
    const scala = e.target.closest('[data-scala]')
    if (scala) {
      S.scala = scala.dataset.scala
      for (const b of dlg.corpo.querySelectorAll('[data-scala]')) b.setAttribute('aria-pressed', String(b === scala))
      V.nota = midiDaX(V.vx); el.nota.textContent = nota(V.nota); el.hzNota.textContent = hz(freqMidi(V.nota))
      return
    }
    const onda = e.target.closest('[data-onda]')
    if (onda) {
      S.onda = onda.dataset.onda
      if (osc) osc.type = S.onda
      for (const b of dlg.corpo.querySelectorAll('[data-onda]')) b.setAttribute('aria-pressed', String(b === onda))
      return
    }
    if (e.target.closest('[data-spazio]')) {
      S.spazio = !S.spazio
      const b = e.target.closest('[data-spazio]')
      b.setAttribute('aria-pressed', String(S.spazio)); b.textContent = S.spazio ? 'acceso' : 'spento'
      if (bagnato) bagnato.gain.setTargetAtTime(S.spazio ? 0.36 : 0, contesto().currentTime, 0.05)
      return
    }
    if (e.target.closest('[data-sensori]')) accendiSensori()
    if (e.target.closest('[data-suona]')) { V.attiva ? spegni() : accendi() }
  })
  dlg.alChiudere(() => {
    spegni()
    disegno?.ferma(); disegno = null
    telaSt?.ferma(); telaSt = null
    if (osc) { try { osc.stop() } catch {}; osc.disconnect(); osc = null }
    if (vca) { vca.disconnect(); vca = null }
    if (filtro) { filtro.disconnect(); filtro = null }
    if (convolver) { convolver.disconnect(); convolver = null }
    ctxAudio = null
    sensoriAttivi = false
    window.removeEventListener('deviceorientation', inclina)
    sospendi()
    dlg?.dlg.remove(); dlg = null
  })
}

// ── i sensori del telefono ──────────────────────────────────────────────────
function inclina(e) {
  if (!sensoriAttivi) return
  const g = e.gamma ?? 0
  const b = e.beta ?? 0
  V.x = clamp((g + 40) / 80, 0, 1)
  V.y = clamp(1 - b / 80, 0, 1)
  if (!V.attiva) accendi()
}
async function accendiSensori() {
  if (!('DeviceOrientationEvent' in window)) {
    el.sensoriStato.textContent = 'questo dispositivo non ha i sensori di movimento.'
    return
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const p = await DeviceOrientationEvent.requestPermission()
      if (p !== 'granted') { el.sensoriStato.textContent = 'permesso ai sensori negato.'; return }
    }
  } catch {
    el.sensoriStato.textContent = 'permesso ai sensori non disponibile.'
    return
  }
  sensoriAttivi = true
  window.addEventListener('deviceorientation', inclina)
  el.sensoriStato.textContent = 'sensori accesi: inclina il telefono.'
  dlg.voce('inclina il telefono', true)
}
