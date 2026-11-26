// Il suono del laboratorio (26.11): un solo AudioContext per tutte le app nuove (synth, batteria, theremin, spettro).
// Il browser non fa partire l'audio senza un gesto: ogni app chiama sblocca() dentro il clic che accende lo strumento.
// Il contesto resta vivo ma sospeso quando l'app si chiude (sospendi), così non consuma niente e non lascia code accese.

let ac = null
let master = null
let comp = null
let rumoreBuf = null

/** L'AudioContext (lo crea la prima volta). */
export function contesto() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext
    if (!C) return null
    ac = new C({ latencyHint: 'interactive' })
    comp = ac.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 18
    comp.ratio.value = 6
    comp.attack.value = 0.004
    comp.release.value = 0.18
    master = ac.createGain()
    master.gain.value = 0.8
    master.connect(comp)
    comp.connect(ac.destination)
  }
  return ac
}

/** Riprende il contesto (da chiamare dentro un clic). → l'AudioContext o null. */
export async function sblocca() {
  const c = contesto()
  if (!c) return null
  if (c.state === 'suspended' || c.state === 'interrupted') { try { await c.resume() } catch {} }
  return c
}

/** Il volume generale (0…1). */
export function uscita() {
  contesto()
  return master
}

/** Sospende il contesto quando l'app si chiude: le code delle altre app non devono restare accese. */
export function sospendi() {
  if (ac && ac.state === 'running') ac.suspend().catch(() => {})
}

/** Un buffer di rumore bianco (charleston, rullante, clap…). */
export function rumore(secondi = 1) {
  const c = contesto()
  if (!c) return null
  if (!rumoreBuf || rumoreBuf.duration < secondi) {
    const n = Math.ceil(c.sampleRate * Math.max(1, secondi))
    rumoreBuf = c.createBuffer(1, n, c.sampleRate)
    const d = rumoreBuf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  }
  return rumoreBuf
}

/** Il volume in dB di un'onda (RMS, scala completa = 0 dBFS). */
export function rmsDb(dati) {
  let s = 0
  for (let i = 0; i < dati.length; i++) { const v = dati[i]; s += v * v }
  const r = Math.sqrt(s / Math.max(1, dati.length))
  return r > 0 ? 20 * Math.log10(r) : -120
}

/** La nota più vicina a una frequenza (MIDI, con i centesimi). */
export function midiDi(f) {
  if (!(f > 0)) return { midi: 0, cents: 0 }
  const m = 69 + 12 * Math.log2(f / 440)
  const midi = Math.round(m)
  return { midi, cents: Math.round((m - midi) * 100) }
}
