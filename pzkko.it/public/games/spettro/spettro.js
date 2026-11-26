// SPETTRO (26.11): il microfono del computer diventa uno strumento da banco. Spettro a barre (scala logaritmica),
// forma d'onda, nota con i centesimi, livello in dB e accordo probabile letto dalla croma. Tutto nella pagina: l'audio
// non viene registrato, non viene salvato e non parte da nessuna parte. Serve il permesso del microfono.
//
//   apri()   apre il banco

import { creaFoglio, tela, ciclo, clamp, hz, db, nota } from '/games/lab/lab.js'
import { contesto, sblocca, sospendi } from '/games/lab/audio.js'

const NOMI = ['do', 'do#', 're', 're#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']
const ACCORDI = [
  { nome: 'maggiore', passi: [0, 4, 7] }, { nome: 'minore', passi: [0, 3, 7] },
  { nome: 'diminuito', passi: [0, 3, 6] }, { nome: 'settima', passi: [0, 4, 7, 10] },
  { nome: 'minore settima', passi: [0, 3, 7, 10] }, { nome: 'maggiore settima', passi: [0, 4, 7, 11] },
  { nome: 'sospesa 4', passi: [0, 5, 7] }, { nome: 'sospesa 2', passi: [0, 2, 7] },
]
const S = { congelato: false }
let dlg = null, el = {}, telaSt = null, disegno = null
let stream = null, source = null, analizzatore = null
let freqByte = null, freqFloat = null, tempoByte = null
let picchi = null, ultimo = { nota: '—', hz: 0, cents: 0, db: -120, accordo: '—', croma: new Array(12).fill(0) }
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

function nomeNota(midi) { return NOMI[((midi % 12) + 12) % 12] }
function accordoDaCroma(croma) {
  let migliore = null, punteggio = 0
  const somma = croma.reduce((a, b) => a + b, 0) || 1
  for (let radice = 0; radice < 12; radice++) {
    for (const a of ACCORDI) {
      let dentro = 0
      for (const p of a.passi) dentro += croma[(radice + p) % 12]
      const fuori = somma - dentro
      const s = (dentro / somma) - (fuori / somma) * 0.25
      if (s > punteggio) { punteggio = s; migliore = { radice, ...a, forza: s } }
    }
  }
  if (!migliore || punteggio < 0.34) return null
  return `${nomeNota(60 + migliore.radice)} ${migliore.nome}`
}

function apriMicrofono() {
  if (stream) return
  if (!navigator.mediaDevices?.getUserMedia) {
    el.stato.textContent = 'questo browser non dà il microfono alle pagine.'
    return
  }
  el.stato.textContent = 'chiedo il permesso…'
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then((s) => {
      stream = s
      const c = contesto()
      sblocca()
      source = c.createMediaStreamSource(s)
      analizzatore = c.createAnalyser()
      analizzatore.fftSize = 4096
      analizzatore.smoothingTimeConstant = 0.8
      source.connect(analizzatore)
      freqByte = new Uint8Array(analizzatore.frequencyBinCount)
      freqFloat = new Float32Array(analizzatore.frequencyBinCount)
      tempoByte = new Uint8Array(analizzatore.fftSize)
      picchi = new Float32Array(analizzatore.frequencyBinCount)
      el.mic.textContent = 'microfono acceso'
      el.mic.setAttribute('aria-pressed', 'true')
      el.mic.disabled = true
      el.stato.textContent = 'ascolto'
      el.vuoto.hidden = true
      dlg.voce('fai un suono: lo spettro si muove')
    })
    .catch((err) => {
      const nome = err?.name || ''
      el.stato.textContent = nome === 'NotAllowedError' ? 'permesso negato: il microfono resta spento.'
        : nome === 'NotFoundError' ? 'non trovo un microfono.'
        : 'il microfono non si è aperto.'
      el.vuoto.hidden = false
      el.vuoto.textContent = 'serve il permesso del microfono per vedere lo spettro.'
    })
}

function misura() {
  if (!analizzatore) return
  if (S.congelato) return
  analizzatore.getByteFrequencyData(freqByte)
  analizzatore.getFloatFrequencyData(freqFloat)
  analizzatore.getByteTimeDomainData(tempoByte)
  const sr = contesto().sampleRate
  const n = freqFloat.length
  const risoluzione = sr / analizzatore.fftSize
  // la nota: il picco più forte fra 70 e 1800 Hz, con l'interpolazione parabolica
  let massimo = -Infinity, indice = -1
  const da = Math.max(1, Math.floor(70 / risoluzione))
  const a = Math.min(n - 2, Math.floor(1800 / risoluzione))
  for (let i = da; i <= a; i++) if (freqFloat[i] > massimo) { massimo = freqFloat[i]; indice = i }
  let frequenza = 0
  if (indice > 0 && massimo > -70) {
    const y0 = freqFloat[indice - 1], y1 = freqFloat[indice], y2 = freqFloat[indice + 1]
    const den = y0 - 2 * y1 + y2
    const spost = den ? clamp(0.5 * (y0 - y2) / den, -0.5, 0.5) : 0
    frequenza = (indice + spost) * risoluzione
  }
  const midi = frequenza ? Math.round(69 + 12 * Math.log2(frequenza / 440)) : 0
  const cents = frequenza ? Math.round((69 + 12 * Math.log2(frequenza / 440) - midi) * 100) : 0
  // il livello
  let somma = 0
  for (const v of tempoByte) { const x = (v - 128) / 128; somma += x * x }
  const livello = 20 * Math.log10(Math.max(1e-6, Math.sqrt(somma / tempoByte.length)))
  // la croma, per l'accordo
  const croma = new Array(12).fill(0)
  const cda = Math.max(1, Math.floor(80 / risoluzione))
  const ca = Math.min(n - 1, Math.floor(3000 / risoluzione))
  for (let i = cda; i <= ca; i++) {
    const f = i * risoluzione
    const m = Math.round(69 + 12 * Math.log2(f / 440))
    croma[((m % 12) + 12) % 12] += Math.max(0, (freqByte[i] / 255) ** 2)
  }
  const max = Math.max(...croma) || 1
  for (let i = 0; i < 12; i++) croma[i] /= max
  ultimo = {
    nota: frequenza ? `${nomeNota(midi)}${Math.floor(midi / 12) - 1}` : '—',
    hz: frequenza, cents, db: livello,
    accordo: accordoDaCroma(croma), croma,
  }
}

function disegna() {
  const ctx = telaSt?.ctx
  if (!ctx) return
  const w = telaSt.w, h = telaSt.h
  if (!w || !h) return
  const su = S.congelato && picchi ? picchi : null
  ctx.fillStyle = '#0d100c'
  ctx.fillRect(0, 0, w, h)
  const fondo = h * 0.78
  // la griglia
  ctx.strokeStyle = 'rgba(204,255,0,.10)'
  ctx.lineWidth = 1
  for (const f of [100, 300, 1000, 3000, 10000]) {
    const x = Math.log10(f / 40) / Math.log10(16000 / 40) * w
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, fondo); ctx.stroke()
    ctx.fillStyle = 'rgba(204,255,0,.35)'
    ctx.font = '9px "Special Elite","Courier New",monospace'
    ctx.fillText(f >= 1000 ? `${f / 1000}k` : String(f), x + 3, fondo - 4)
  }
  if (analizzatore && !S.congelato) {
    const n = freqByte.length
    const colonne = Math.max(48, Math.floor(w / 4))
    for (let c = 0; c < colonne; c++) {
      const f0 = 40 * (16000 / 40) ** (c / colonne)
      const f1 = 40 * (16000 / 40) ** ((c + 1) / colonne)
      const i0 = Math.floor(f0 / (contesto().sampleRate / analizzatore.fftSize))
      const i1 = Math.max(i0 + 1, Math.floor(f1 / (contesto().sampleRate / analizzatore.fftSize)))
      let v = 0
      for (let i = i0; i < i1 && i < n; i++) v = Math.max(v, freqByte[i])
      const alt = (v / 255) ** 1.35 * fondo
      const x = (c / colonne) * w
      const lw = Math.max(1, w / colonne - 1)
      const grad = ctx.createLinearGradient(0, fondo, 0, fondo - alt)
      grad.addColorStop(0, 'rgba(90,122,0,.85)')
      grad.addColorStop(0.6, 'rgba(204,255,0,.9)')
      grad.addColorStop(1, 'rgba(255,255,190,.95)')
      ctx.fillStyle = grad
      ctx.fillRect(x, fondo - alt, lw, alt)
      if (picchi) {
        if (alt > (picchi[c] || 0)) picchi[c] = alt
        else picchi[c] = Math.max(0, picchi[c] - 0.35)
        ctx.fillStyle = 'rgba(255,255,255,.55)'
        ctx.fillRect(x, fondo - picchi[c], lw, 1.4)
      }
    }
  } else if (su) {
    // congelato: le barre restano dov'erano
    const colonne = su.length
    for (let c = 0; c < colonne; c++) {
      const x = (c / colonne) * w
      ctx.fillStyle = 'rgba(204,255,0,.55)'
      ctx.fillRect(x, fondo - su[c], Math.max(1, w / colonne - 1), su[c])
    }
  } else {
    // il messaggio «accendi il microfono» lo mette .sp-vuoto sopra il canvas: qui si lascia solo il fondo
  }
  // la forma d'onda, sotto
  ctx.fillStyle = 'rgba(204,255,0,.04)'
  ctx.fillRect(0, fondo + 2, w, h - fondo - 2)
  if (tempoByte && !S.congelato) {
    const centro = fondo + 2 + (h - fondo - 2) / 2
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(204,255,0,.8)'
    ctx.lineWidth = 1.4
    for (let i = 0; i < tempoByte.length; i += 2) {
      const x = (i / tempoByte.length) * w
      const y = centro + ((tempoByte[i] - 128) / 128) * ((h - fondo - 6) * 0.46)
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.stroke()
  }
  // la riga della lettura
  if (ultimo.hz) {
    const x = Math.log10(ultimo.hz / 40) / Math.log10(16000 / 40) * w
    ctx.strokeStyle = 'rgba(255,255,255,.7)'
    ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, fondo); ctx.stroke()
    ctx.setLineDash([])
  }
}

function aggiornaLetture() {
  if (!el.nota) return
  el.nota.textContent = ultimo.nota
  el.freq.textContent = ultimo.hz ? hz(ultimo.hz) : '—'
  el.cents.textContent = ultimo.hz ? `${ultimo.cents > 0 ? '+' : ''}${ultimo.cents} cent` : ''
  el.db.textContent = db(ultimo.db)
  el.barra.style.setProperty('--v', String(clamp((ultimo.db + 60) / 60, 0, 1)))
  el.accordo.textContent = ultimo.accordo || '—'
  if (el.nota2) el.nota2.textContent = ultimo.nota
  if (el.freq2) el.freq2.textContent = ultimo.hz ? hz(ultimo.hz) : '—'
  if (el.cents2) el.cents2.textContent = ultimo.hz ? `${ultimo.cents > 0 ? '+' : ''}${ultimo.cents}` : '—'
  for (const riga of el.croma.querySelectorAll('[data-c]')) {
    const i = Number(riga.dataset.c)
    riga.style.setProperty('--v', String(ultimo.croma[i] || 0))
    riga.classList.toggle('is-on', (ultimo.croma[i] || 0) > 0.55)
  }
}

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  const pannello = (t, c) => `<section class="lab-pannello">${t ? `<h3>${t}</h3>` : ''}${c}</section>`
  dlg = await creaFoglio({
    chiave: 'spettro',
    titolo: 'spettro',
    voce: 'il microfono diventa uno strumento da banco',
    corpo: `<div class="lab-griglia lab-griglia--larga">
      <div class="lab-colonna">
        <div class="lab-pannello sp-comandi">
          <div class="lab-fila lab-fila--tra">
            <div class="lab-fila"><button type="button" class="lab-tasto lab-tasto--pieno" data-mic aria-pressed="false">accendi il microfono</button><button type="button" class="lab-tasto" data-congela aria-pressed="false">congela</button><button type="button" class="lab-tasto" data-picchi>azzera picchi</button></div>
            <span class="lab-etichetta" data-stato>spento</span>
          </div>
        </div>
        <div class="lab-scena sp-scena">
          <canvas data-tela></canvas>
          <div class="sp-lettura"><b data-nota>—</b><span data-freq>—</span><span data-cents></span></div>
          <div class="sp-livello"><i data-barra></i><b data-db>—</b></div>
          <div class="sp-vuoto" data-vuoto>accendi il microfono per vedere lo spettro.</div>
        </div>
      </div>
      <aside class="lab-colonna lab-colonna--lato lab-scorri">
        ${pannello('accordo probabile', `<p class="sp-accordo" data-accordo>—</p><div class="sp-croma" data-croma>${NOMI.map((n, i) => `<span data-c="${i}" title="${n}"><i></i><em>${n}</em></span>`).join('')}</div>`)}
        ${pannello('la nota', `<div class="sp-numeri"><div><b data-nota2>—</b><span>nota</span></div><div><b data-freq2>—</b><span>frequenza</span></div><div><b data-cents2>—</b><span>centesimi</span></div></div>`)}
        ${pannello('cosa fa', `<p class="lab-nota">Lo spettro è una FFT da 4096 punti: 46 ms di suono, circa 11 Hz per bin. Le barre sono in scala logaritmica, la nota è il picco fra 70 e 1800 Hz, l'accordo è la somma delle crome pesate.</p>`)}
        ${pannello('privacy', `<p class="lab-nota">L'audio resta nel browser: non si registra, non si salva, non si manda a nessun server. Se chiudi il banco, il microfono si spegne.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    nota: q('[data-nota]'), freq: q('[data-freq]'), cents: q('[data-cents]'), db: q('[data-db]'),
    barra: q('[data-barra]'), accordo: q('[data-accordo]'), croma: q('[data-croma]'),
    stato: q('[data-stato]'), mic: q('[data-mic]'), vuoto: q('[data-vuoto]'),
    nota2: q('[data-nota2]'), freq2: q('[data-freq2]'), cents2: q('[data-cents2]'),
  }
  if (el.mic) el.mic.addEventListener('click', apriMicrofono)
  dlg.corpo.addEventListener('click', (e) => {
    if (e.target.closest('[data-congela]')) {
      S.congelato = !S.congelato
      const b = e.target.closest('[data-congela]')
      b.setAttribute('aria-pressed', String(S.congelato)); b.textContent = S.congelato ? 'riprendi' : 'congela'
      if (S.congelato) dlg.voce('congelato')
      else dlg.voce('ascolto')
      return
    }
    if (e.target.closest('[data-picchi]')) { if (picchi) picchi.fill(0); dlg.voce('picchi azzerati'); }
  })
  telaSt = tela(q('[data-tela]'))
  disegno = ciclo(() => {
    if (!analizzatore) { disegna(); return }
    misura()
    if (!S.congelato) aggiornaLetture()
    else {
      el.nota2.textContent = ultimo.nota; el.freq2.textContent = ultimo.hz ? hz(ultimo.hz) : '—'; el.cents2.textContent = `${ultimo.cents}`
    }
    disegna()
  })
  dlg.alChiudere(() => {
    disegno?.ferma(); disegno = null
    telaSt?.ferma(); telaSt = null
    if (source) { try { source.disconnect() } catch {}; source = null }
    if (stream) { for (const t of stream.getTracks()) t.stop(); stream = null }
    analizzatore = null
    sospendi()
    dlg?.dlg.remove(); dlg = null
  })
}
