// LIVELLA (26.11): la bolla del telefono. Usa i sensori di movimento (DeviceOrientation: beta e gamma), con la
// calibrazione e la vibrazione quando si è in bolla; sul computer si prova col mouse, perché i sensori non ci sono.
// La bussola usa il nord del telefono quando il browser lo dà (webkitCompassHeading o alpha assoluto).
//
//   apri()   apre lo strumento

import { creaFoglio, clamp } from '/games/lab/lab.js'

const PUNTI = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
const S = { beta: 0, gamma: 0, zeroBeta: 0, zeroGamma: 0, sensor: false, simula: false, heading: null, bolla: false }
let dlg = null, el = {}
let inAscolto = false
let ultimaBolla = false

const gradi = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}°`
const cardinale = (h) => `${PUNTI[Math.round(((h % 360) + 360) % 360 / 45) % 8]}`

function mostra() {
  if (!el.bolla) return
  const db = S.beta - S.zeroBeta
  const dg = S.gamma - S.zeroGamma
  const x = clamp(dg / 28, -1, 1)
  const y = clamp(db / 28, -1, 1)
  el.bolla.style.setProperty('--x', String(x))
  el.bolla.style.setProperty('--y', String(y))
  el.bolla.classList.toggle('is-in', Math.abs(x) < 0.07 && Math.abs(y) < 0.07)
  el.beta.textContent = gradi(db)
  el.gamma.textContent = gradi(dg)
  if (el.heading) el.heading.textContent = S.heading === null ? '—' : `${Math.round(S.heading)}° ${cardinale(S.heading)}`
  if (el.ago) el.ago.style.transform = `rotate(${-(S.heading ?? 0)}deg)`
  const inBolla = Math.abs(x) < 0.07 && Math.abs(y) < 0.07
  el.stato.textContent = inBolla ? 'in bolla' : x > 0.07 ? 'la bolla è a destra' : x < -0.07 ? 'la bolla è a sinistra' : y > 0.07 ? 'la bolla è avanti' : 'la bolla è indietro'
  el.stato.classList.toggle('is-in', inBolla)
  if (inBolla && !ultimaBolla && S.sensor) { try { navigator.vibrate?.(60) } catch {} }
  ultimaBolla = inBolla
}

function sensore(e) {
  if (!inAscolto) return
  S.sensor = true
  S.simula = false
  S.beta = clamp(e.beta ?? 0, -180, 180)
  S.gamma = clamp(e.gamma ?? 0, -90, 90)
  const h = e.webkitCompassHeading ?? (e.absolute && Number.isFinite(e.alpha) ? (360 - e.alpha) % 360 : null)
  S.heading = Number.isFinite(h) ? h : null
  mostra()
}

async function accendiSensori() {
  if (!('DeviceOrientationEvent' in window)) {
    el.stato.textContent = 'questo dispositivo non ha i sensori.'
    el.sensori.disabled = true
    return
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const p = await DeviceOrientationEvent.requestPermission()
      if (p !== 'granted') { el.stato.textContent = 'permesso negato.'; return }
    }
  } catch {
    el.stato.textContent = 'permesso ai sensori non disponibile.'
    return
  }
  inAscolto = true
  S.simula = false
  window.addEventListener('deviceorientation', sensore)
  el.sensori.textContent = 'sensori accesi'
  el.sensori.setAttribute('aria-pressed', 'true')
  dlg?.voce('inclina il telefono')
}

function calibra() {
  if (S.sensor) {
    S.zeroBeta = S.beta
    S.zeroGamma = S.gamma
  } else {
    S.beta = 0; S.gamma = 0; S.zeroBeta = 0; S.zeroGamma = 0
  }
  mostra()
  dlg?.voce('azzerato qui')
}

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  const pannello = (t, c) => `<section class="lab-pannello">${t ? `<h3>${t}</h3>` : ''}${c}</section>`
  dlg = await creaFoglio({
    chiave: 'livella',
    titolo: 'livella',
    voce: 'appoggia il telefono e guarda la bolla',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-scena lv-scena" data-scena>
          <div class="lv-vial" data-vial role="img" aria-label="la bolla della livella">
            <i class="lv-anello"></i><i class="lv-anello lv-anello--2"></i>
            <i class="lv-mira"></i><i class="lv-bolla" data-bolla></i>
          </div>
          <p class="lv-stato" data-stato>ferma</p>
          <p class="lv-istruzioni">inclina il telefono, o trascina la bolla col mouse.</p>
        </div>
        <div class="lab-fila lab-fila--tra">
          <div class="lab-fila"><button type="button" class="lab-tasto lab-tasto--pieno" data-sensori aria-pressed="false">accendi i sensori</button><button type="button" class="lab-tasto" data-calibra>calibra qui</button></div>
          <span class="lab-etichetta">vibra quando è in bolla</span>
        </div>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        ${pannello('i numeri', `<dl class="lv-numeri"><div><dt>avanti / indietro</dt><dd data-beta>+0.0°</dd></div><div><dt>destra / sinistra</dt><dd data-gamma>+0.0°</dd></div><div><dt>bussola</dt><dd data-heading>—</dd></div></dl>`)}
        ${pannello('la bussola', `<div class="lv-bussola"><span>N</span><i class="lv-ago" data-ago></i><b>·</b></div><p class="lab-nota">Il nord arriva dal telefono; se il browser non lo dà, la bussola resta ferma.</p>`)}
        ${pannello('come si usa', `<p class="lab-nota">Metti il telefono su un piano e premi <b>calibra qui</b>: quello diventa lo zero. La bolla va al centro quando il piano è in bolla. Sul computer non ci sono i sensori: trascina la bolla per provarla.</p>`)}
        ${pannello('privacy', `<p class="lab-nota">I sensori restano nel telefono: nessun dato di movimento viene mandato al sito. La vibrazione è quella del sistema.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    bolla: q('[data-bolla]'), beta: q('[data-beta]'), gamma: q('[data-gamma]'), heading: q('[data-heading]'),
    ago: q('[data-ago]'), stato: q('[data-stato]'), sensori: q('[data-sensori]'), scena: q('[data-scena]'),
  }
  // il mouse: si trascina la bolla come se si inclinasse il piano
  let preso = false
  const muovi = (e) => {
    if (!preso) return
    const r = el.scena.getBoundingClientRect()
    const x = (e.clientX - r.left) / Math.max(1, r.width) - 0.5
    const y = (e.clientY - r.top) / Math.max(1, r.height) - 0.5
    S.beta = clamp(y * 90, -90, 90)
    S.gamma = clamp(x * 90, -90, 90)
    S.sensor = false
    S.simula = true
    mostra()
  }
  el.scena.addEventListener('pointerdown', (e) => { preso = true; try { el.scena.setPointerCapture?.(e.pointerId) } catch {}; muovi(e) })
  el.scena.addEventListener('pointermove', muovi)
  el.scena.addEventListener('pointerup', () => { preso = false })
  el.scena.addEventListener('pointercancel', () => { preso = false })
  dlg.corpo.addEventListener('click', (e) => {
    if (e.target.closest('[data-sensori]')) accendiSensori()
    if (e.target.closest('[data-calibra]')) calibra()
  })
  dlg.alChiudere(() => {
    inAscolto = false
    window.removeEventListener('deviceorientation', sensore)
    dlg?.dlg.remove(); dlg = null
  })
  mostra()
}
