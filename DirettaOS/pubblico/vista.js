// Diretta OS · Vista esterna: la pagina del portatile.
//
// Apri il link e basta: nessun codice, nessuna schermata. La webcam si accende appena il browser dà il
// permesso, il portatile si collega da solo e i fotogrammi partono. Se la rete cade, la pagina continua a
// riprovare senza spegnere la webcam: quando il pc torna, la vista torna con lei.
//
// Il pannello regola la webcam: usa i comandi veri della webcam (messa a fuoco, esposizione, ISO, bianco,
// torcia, nitidezza) quando ci sono, e li rifà nel disegno quando non ci sono. Quello che vedi è quello che
// parte: i fotogrammi sono il canvas già regolato, non il video grezzo.

const $ = (s) => document.querySelector(s)
const $$ = (s) => [...document.querySelectorAll(s)]
const CHIAVE = 'diretta-vista-regolazioni'
const CHIAVE_NOME = 'diretta-vista-nome'

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const formatta = new Intl.NumberFormat('it-IT')
const segno = (x) => `${x > 0 ? '+' : ''}${Math.round(x)} %`

// ── lo stato: tutto quello che si può regolare ──
const BASE = {
  cam: '',
  fuocoModo: 'auto', fuocoVal: 50,
  sfondo: 'nessuno',
  riflettori: false, riflettoriVal: 40,
  ritocco: false, ritoccoVal: 35,
  filtro: 'nessuno', effetto: 'nessuno',
  inquadratura: 'largo', zoom: 100, formato: '16:9',
  esposizione: 'auto', otturatore: 50, iso: 400,
  wb: 'auto', temperatura: 5600, tinta: 0,
  flash: false, flashVal: 30,
  luminosita: true, luminositaVal: 0,
  tintaOn: false, tintaVal: 0,
  saturazione: true, saturazioneVal: 0,
  vividezza: false, vividezzaVal: 0,
  contrasto: true, contrastoVal: 0,
  gamma: false, gammaVal: 1,
  nitidezza: false, nitidezzaVal: 0,
  specchia: false, griglia: false, ruota: false, torcia: false,
  fps: 30, qualita: 'media', schermo: true,
}
const FILTRI = ['nessuno', 'bn', 'caldo', 'freddo', 'vintage', 'vivido', 'cinema', 'sogno', 'notte']
const EFFETTI = ['nessuno', 'grana', 'vignetta', 'morbido', 'riflesso', 'neon']
const SFONDI = ['nessuno', 'sfocato', 'scuro', 'nero']
const FORMATI = ['16:9', '4:3', '1:1', '9:16']
const QUALITA = ['alta', 'media', 'bassa']

let st = { ...BASE }
try {
  const letto = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
  if (letto && typeof letto === 'object') st = { ...st, ...letto }
} catch {}
st.cam = typeof st.cam === 'string' ? st.cam : ''
st.fuocoModo = ['auto', 'continuo', 'manuale'].includes(st.fuocoModo) ? st.fuocoModo : 'auto'
st.fuocoVal = clamp(num(st.fuocoVal, 50), 0, 100)
st.sfondo = SFONDI.includes(st.sfondo) ? st.sfondo : 'nessuno'
st.filtro = FILTRI.includes(st.filtro) ? st.filtro : 'nessuno'
st.effetto = EFFETTI.includes(st.effetto) ? st.effetto : 'nessuno'
st.formato = FORMATI.includes(st.formato) ? st.formato : '16:9'
st.qualita = QUALITA.includes(st.qualita) ? st.qualita : 'media'
st.fps = [5, 10, 15, 20, 24, 25, 30].includes(+st.fps) ? +st.fps : 30
st.zoom = clamp(num(st.zoom, 100), 100, 300)
st.esposizione = st.esposizione === 'manuale' ? 'manuale' : 'auto'
st.wb = st.wb === 'manuale' ? 'manuale' : 'auto'
st.temperatura = clamp(num(st.temperatura, 5600), 2000, 10000)
st.tinta = clamp(num(st.tinta, 0), -100, 100)
st.iso = clamp(num(st.iso, 400), 1, 3200)
st.otturatore = clamp(num(st.otturatore, 50), 0, 100)
st.gammaVal = clamp(num(st.gammaVal, 1), .4, 2.2)

function salva() {
  try { localStorage.setItem(CHIAVE, JSON.stringify(st)) } catch {}
}
let salvaFra = null
function salvaPiano() { clearTimeout(salvaFra); salvaFra = setTimeout(salva, 160) }

const nomeDaUA = () => {
  const ua = navigator.userAgent
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Macintosh/i.test(ua)) return 'Mac'
  if (/Windows/i.test(ua)) return 'PC Windows'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Portatile'
}
let nome = (() => { try { return localStorage.getItem(CHIAVE_NOME) || nomeDaUA() } catch { return nomeDaUA() } })()

// ── gli elementi ──
const video = $('#video')
const schermo = $('#schermo')
const ctx = schermo.getContext('2d', { alpha: false, desynchronized: true })
const tela2 = document.createElement('canvas')
const c2 = tela2.getContext('2d')
const tela3 = document.createElement('canvas')
const c3 = tela3.getContext('2d')
const telaFondo = document.createElement('canvas') // (lo sfondo sfocato, disegnato in piccolo: costa un quarto)
const cf = telaFondo.getContext('2d')
const palco = $('#palco')
const griglia = $('#griglia')
const pannello = $('#pannello')

// la grana: un rumore piccolo, ripetuto sopra il fotogramma
const rumore = document.createElement('canvas')
rumore.width = rumore.height = 128
{
  const g = rumore.getContext('2d')
  const img = g.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255 | 0
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
}
let patternGrana = null

// ── la webcam e i suoi comandi veri ──
const VIDEO = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }
let stream = null
let attivo = false
let inviando = false
let inviabile = false
let collegando = false
let cambiando = false
let accendendo = false
let maiCollegato = true
let erroriInvio = 0
let erroriBatti = 0
let timerInvio = null
let riprovaFra = null
let ricambioFra = null
let wake = null
let veloTipo = null

let hw = {
  fuocoModi: [], fuocoDistanza: null, manualeFuoco: false,
  expModi: [], expTempo: null, iso: null, manualeExp: false,
  wbModi: [], kelvin: null, manualeWb: false,
  torch: false, nitidezza: null, iniziale: {},
}

const ASPETTI = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '9:16': 9 / 16 }
const LARGHEZZE = { alta: 1280, media: 960, bassa: 640 }
const JPEG = { alta: .82, media: .72, bassa: .6 }

// ── lo stato della pagina (pallino, velo, pannello) ──
function segnaOk() {
  const p = $('#stato')
  if (p.dataset.stato !== 'ok') { p.dataset.stato = 'ok'; p.title = 'Collegata e in invio' }
}
function segnaAttesa(testo = 'Collegamento…') {
  const p = $('#stato')
  if (p.dataset.stato !== 'attesa' || p.title !== testo) { p.dataset.stato = 'attesa'; p.title = testo }
}
function segnaKo(testo = 'Problema di rete') {
  const p = $('#stato')
  if (p.dataset.stato !== 'ko' || p.title !== testo) { p.dataset.stato = 'ko'; p.title = testo }
}

const VELI = {
  permesso: ['Webcam bloccata', 'Consenti la fotocamera nel browser, poi riprova.', 'Riprova'],
  camera: ['Nessuna webcam', 'Collega una webcam e riprova.', 'Riprova'],
  occupata: ['Webcam occupata', 'Chiudi Zoom, Teams o l’altro programma che la sta usando, poi riprova.', 'Riprova'],
  occupato: ['Posto occupato', 'C’è già un’altra vista esterna collegata. Riprova quando si stacca.', 'Riprova'],
  rete: ['PC non raggiungibile', 'Controlla di essere sulla stessa rete del pc, poi riprova.', 'Riprova'],
  insicuro: ['Serve https', 'Apri l’indirizzo che comincia con https:// per usare la webcam.', 'Riprova'],
  staccato: ['Webcam staccata', 'La regia non riceve più l’immagine.', 'Ricollega'],
}
function mostraVelo(tipo) {
  const v = VELI[tipo] ?? VELI.rete
  veloTipo = tipo
  $('#velo-titolo').textContent = v[0]
  $('#velo-dice').textContent = v[1]
  $('#velo-azione').textContent = v[2]
  $('#velo').hidden = false
}
function nascondiVelo() {
  $('#velo').hidden = true
  veloTipo = null
}

function pannelloSu(su, vaiAllaCamera = false) {
  pannello.hidden = !su
  $('#b-regolazioni').setAttribute('aria-pressed', String(su))
  setTimeout(() => {
    adattaSchermo()
    posizionaGriglia()
    if (su && vaiAllaCamera) {
      $('#blocco-cam').scrollIntoView({ block: 'nearest' })
      $('#cam').focus()
    }
  }, 40)
}

// ── i valori mostrati accanto agli slider ──
function tempoStampa(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  if (sec >= 1) return `${sec.toFixed(1).replace('.', ',')} s`
  return `1/${Math.max(1, Math.round(1 / sec))} s`
}
function secondiOtturatore(v) {
  if (hw.expTempo && hw.manualeExp) {
    const valore = mappa(v, hw.expTempo.min, hw.expTempo.max)
    // la specifica parla di unità da 100 µs; qualche webcam risponde in secondi
    return Math.max(.00001, hw.expTempo.max <= 10 ? valore : valore / 10000)
  }
  return Math.pow(10, -3 + (v / 100) * 2) // software: da 1/1000 a 1/10 di secondo
}
function mappa(v, a, b) { return a + (b - a) * (clamp(v, 0, 100) / 100) }

function aggiornaOutput() {
  $('#fuoco-val').textContent = `${Math.round(st.fuocoVal)} %`
  $('#zoom-val').textContent = `${Math.round(st.zoom)} %`
  $('#otturatore-val').textContent = st.esposizione === 'manuale' ? tempoStampa(secondiOtturatore(st.otturatore)) : 'Automatica'
  $('#iso-val').textContent = st.esposizione === 'manuale' ? String(Math.round(st.iso)) : 'Automatica'
  $('#temperatura-val').textContent = `${formatta.format(Math.round(st.temperatura))} K`
  $('#tinta-val').textContent = String(Math.round(st.tinta))
  $('#flash-val').textContent = `${Math.round(st.flashVal)} %`
  $('#luminosita-val').textContent = segno(st.luminositaVal)
  $('#tinta-colore-val').textContent = String(Math.round(st.tintaVal))
  $('#saturazione-val').textContent = segno(st.saturazioneVal)
  $('#vividezza-val').textContent = segno(st.vividezzaVal)
  $('#contrasto-val').textContent = segno(st.contrastoVal)
  $('#gamma-val').textContent = st.gammaVal.toFixed(2).replace('.', ',')
  $('#nitidezza-val').textContent = `${Math.round(st.nitidezzaVal)} %`
  for (const r of $$('input[type="range"]')) riempi(r)
}
function riempi(r) {
  const min = +r.min || 0, max = +r.max || 100
  const p = max > min ? ((+r.value - min) / (max - min)) * 100 : 0
  r.style.setProperty('--pieno', `${p}%`)
}
function setSw(el, su) { el.setAttribute('aria-checked', String(!!su)) }
function setSeg(sel, attr, valore) {
  for (const b of $$(sel)) b.setAttribute('aria-pressed', String(b.dataset[attr] === valore))
}

// ── il pannello: valori, sliders accesi o spenti ──
function sincronizza() {
  const sel = $('#cam')
  if (st.cam && [...sel.options].some((o) => o.value === st.cam)) sel.value = st.cam

  const senzaFuoco = !hw.fuocoModi.length && !hw.fuocoDistanza
  const autoFuoco = hw.fuocoModi.includes('continuous') || hw.fuocoModi.includes('single-shot')
  for (const b of $$('#fuoco-modo button')) {
    const modo = b.dataset.fuoco
    b.setAttribute('aria-pressed', String(modo === st.fuocoModo))
    b.disabled = senzaFuoco || (modo === 'auto' && !autoFuoco) || (modo === 'manuale' && !hw.manualeFuoco) || (modo === 'continuo' && !hw.fuocoModi.includes('continuous'))
  }
  const fuocoManuale = !senzaFuoco && st.fuocoModo === 'manuale' && hw.manualeFuoco
  $('#fuoco').hidden = !fuocoManuale
  $('#fuoco-riga').hidden = !fuocoManuale
  $('#fuoco').disabled = !fuocoManuale
  $('#fuoco').value = st.fuocoVal

  setSeg('#sfondo button', 'sfondo', st.sfondo)
  setSw($('#riflettori-on'), st.riflettori)
  $('#riflettori').value = st.riflettoriVal
  $('#riflettori').disabled = !st.riflettori
  setSw($('#ritocco-on'), st.ritocco)
  $('#ritocco').value = st.ritoccoVal
  $('#ritocco').disabled = !st.ritocco

  $('#filtro').value = st.filtro
  $('#effetto').value = st.effetto

  setSeg('#inquadratura button', 'inquadratura', st.inquadratura)
  $('#zoom').value = st.zoom
  $('#formato').value = st.formato

  $('#esposizione').value = st.esposizione
  $('#otturatore').value = st.otturatore
  $('#otturatore').disabled = st.esposizione !== 'manuale'
  $('#iso').value = st.iso
  $('#iso').disabled = st.esposizione !== 'manuale'

  $('#wb').value = st.wb
  $('#temperatura').value = st.temperatura
  $('#temperatura').disabled = st.wb !== 'manuale'
  $('#tinta').value = st.tinta
  $('#tinta').disabled = st.wb !== 'manuale'

  setSw($('#flash-on'), st.flash)
  $('#flash').value = st.flashVal
  $('#flash').disabled = !st.flash

  setSw($('#luminosita-on'), st.luminosita)
  $('#luminosita').value = st.luminositaVal
  $('#luminosita').disabled = !st.luminosita

  setSw($('#tinta-on'), st.tintaOn)
  $('#tinta-colore').value = st.tintaVal
  $('#tinta-colore').disabled = !st.tintaOn

  setSw($('#saturazione-on'), st.saturazione)
  $('#saturazione').value = st.saturazioneVal
  $('#saturazione').disabled = !st.saturazione

  setSw($('#vividezza-on'), st.vividezza)
  $('#vividezza').value = st.vividezzaVal
  $('#vividezza').disabled = !st.vividezza

  setSw($('#contrasto-on'), st.contrasto)
  $('#contrasto').value = st.contrastoVal
  $('#contrasto').disabled = !st.contrasto

  setSw($('#gamma-on'), st.gamma)
  $('#gamma').value = Math.round(st.gammaVal * 100)
  $('#gamma').disabled = !st.gamma

  setSw($('#nitidezza-on'), st.nitidezza)
  $('#nitidezza').value = st.nitidezzaVal
  $('#nitidezza').disabled = !st.nitidezza

  $('#fps').value = String(st.fps)
  $('#qualita').value = st.qualita
  setSw($('#schermo-on'), st.schermo)

  $('#b-specchia').setAttribute('aria-pressed', String(st.specchia))
  $('#b-griglia').setAttribute('aria-pressed', String(st.griglia))
  $('#b-ruota').setAttribute('aria-pressed', String(st.ruota))
  $('#b-torcia').hidden = !hw.torch
  $('#b-torcia').setAttribute('aria-pressed', String(st.torcia))
  $('#b-stacca').title = attivo ? 'Stacca la webcam' : 'Ricollega la webcam'
  griglia.hidden = !st.griglia

  aggiornaOutput()
  posizionaGriglia()
}

// ── i comandi veri della webcam (se ci sono) ──
function capacita(track) {
  let c = {}, s = {}
  try { c = track.getCapabilities?.() ?? {} } catch {}
  try { s = track.getSettings?.() ?? {} } catch {}
  const fuocoModi = Array.isArray(c.focusMode) ? c.focusMode : []
  const expModi = Array.isArray(c.exposureMode) ? c.exposureMode : []
  const wbModi = Array.isArray(c.whiteBalanceMode) ? c.whiteBalanceMode : []
  const fuocoDistanza = c.focusDistance ?? null
  return {
    fuocoModi, fuocoDistanza,
    manualeFuoco: !!fuocoDistanza && (!fuocoModi.length || fuocoModi.includes('manual')),
    expModi, expTempo: c.exposureTime ?? null, iso: c.iso ?? null,
    manualeExp: expModi.includes('manual') && !!c.exposureTime,
    wbModi, kelvin: c.colorTemperature ?? null,
    manualeWb: wbModi.includes('manual') && !!c.colorTemperature,
    torch: !!c.torch,
    nitidezza: c.sharpness ?? null,
    iniziale: s,
  }
}
function normalizzaFuoco() {
  const auto = hw.fuocoModi.includes('continuous') || hw.fuocoModi.includes('single-shot')
  if (!hw.manualeFuoco && st.fuocoModo === 'manuale') st.fuocoModo = 'auto'
  if (!hw.fuocoModi.includes('continuous') && st.fuocoModo === 'continuo') st.fuocoModo = 'auto'
  if (!auto && hw.manualeFuoco && st.fuocoModo === 'auto') st.fuocoModo = 'manuale'
}
function aggiornaRangeHardware() {
  const temp = $('#temperatura')
  if (hw.kelvin && hw.kelvin.max > hw.kelvin.min) {
    const min = Math.round(hw.kelvin.min), max = Math.round(hw.kelvin.max), step = Math.max(1, Math.round(hw.kelvin.step || 50))
    temp.min = min; temp.max = max; temp.step = step
    st.temperatura = clamp(st.temperatura, min, max)
  } else {
    temp.min = 2000; temp.max = 10000; temp.step = 50
    st.temperatura = clamp(st.temperatura, 2000, 10000)
  }
  const iso = $('#iso')
  if (hw.iso && hw.iso.max > hw.iso.min) {
    const min = Math.max(1, Math.round(hw.iso.min)), max = Math.round(hw.iso.max), step = Math.max(1, Math.round(hw.iso.step || 1))
    iso.min = min; iso.max = max; iso.step = step
    st.iso = clamp(st.iso, min, max)
  } else {
    iso.min = 100; iso.max = 3200; iso.step = 50
    st.iso = clamp(st.iso, 100, 3200)
  }
  normalizzaFuoco()
}

let hwFra = null
function hardware() { clearTimeout(hwFra); hwFra = setTimeout(applicaHardware, 55) }
async function applicaHardware() {
  const t = stream?.getVideoTracks?.()[0]
  if (!t) return
  const c = {}
  if (hw.manualeFuoco && st.fuocoModo === 'manuale') {
    if (hw.fuocoModi.includes('manual')) c.focusMode = 'manual'
    c.focusDistance = mappa(st.fuocoVal, hw.fuocoDistanza.min, hw.fuocoDistanza.max)
  } else if (hw.fuocoModi.includes('continuous')) {
    c.focusMode = 'continuous'
  } else if (hw.fuocoModi.includes('single-shot')) {
    c.focusMode = 'single-shot'
  }

  if (st.esposizione === 'manuale' && hw.manualeExp) {
    c.exposureMode = 'manual'
    c.exposureTime = mappa(st.otturatore, hw.expTempo.min, hw.expTempo.max)
    if (hw.iso) c.iso = clamp(st.iso, hw.iso.min, hw.iso.max)
  } else if (hw.expModi.includes('continuous')) {
    c.exposureMode = 'continuous'
  }

  if (st.wb === 'manuale' && hw.manualeWb) {
    c.whiteBalanceMode = 'manual'
    c.colorTemperature = clamp(st.temperatura, hw.kelvin.min, hw.kelvin.max)
  } else if (hw.wbModi.includes('continuous')) {
    c.whiteBalanceMode = 'continuous'
  }

  if (hw.torch) c.torch = !!st.torcia

  if (hw.nitidezza) {
    c.sharpness = st.nitidezza
      ? Math.round(mappa(st.nitidezzaVal, hw.nitidezza.min, hw.nitidezza.max))
      : (Number.isFinite(hw.iniziale.sharpness) ? hw.iniziale.sharpness : Math.round((hw.nitidezza.min + hw.nitidezza.max) / 2))
  }
  try { await t.applyConstraints(c) } catch {} // (se la webcam non gradisce un valore, resta com'è)
}

// ── il disegno: qui nasce quello che parte ──
function dimensioni() {
  const aspetto = ASPETTI[st.formato] ?? 16 / 9
  const base = LARGHEZZE[st.qualita] ?? 960
  let W, H
  if (aspetto >= 1) { W = base; H = Math.round(base / aspetto) }
  else { H = base; W = Math.round(base * aspetto) }
  W = Math.max(2, Math.round(W / 2) * 2)
  H = Math.max(2, Math.round(H / 2) * 2)
  return { W, H }
}
function fattoreEsposizione() {
  if (st.esposizione !== 'manuale' || hw.manualeExp) return 1
  const otturatore = Math.pow(2, ((st.otturatore - 50) / 50) * 1.1)
  const iso = clamp(st.iso / 400, .25, 8)
  return clamp(otturatore * iso, .25, 6)
}
function filtroCSS() {
  const p = []
  switch (st.filtro) {
    case 'bn': p.push('grayscale(1)'); break
    case 'caldo': p.push('sepia(.28) saturate(1.12)'); break
    case 'freddo': p.push('hue-rotate(-10deg) saturate(1.05)'); break
    case 'vintage': p.push('sepia(.4) saturate(.82) contrast(1.06)'); break
    case 'vivido': p.push('saturate(1.45) contrast(1.08)'); break
    case 'cinema': p.push('contrast(1.18) saturate(.88) sepia(.08)'); break
    case 'sogno': p.push('brightness(1.05) saturate(.92) blur(.7px)'); break
    case 'notte': p.push('brightness(1.35) contrast(1.18) saturate(.72) hue-rotate(-6deg)'); break
  }
  const sat = 1 + (st.saturazione ? st.saturazioneVal / 100 * .8 : 0) + (st.vividezza ? st.vividezzaVal / 100 * .55 : 0)
  p.push(`saturate(${clamp(sat, 0, 3).toFixed(3)})`)
  const con = 1 + (st.contrasto ? st.contrastoVal / 100 * .75 : 0)
  p.push(`contrast(${clamp(con, .2, 2.6).toFixed(3)})`)
  const lum = st.luminosita ? st.luminositaVal / 100 : 0
  p.push(`brightness(${clamp(1 + lum * .55 + (fattoreEsposizione() - 1), .2, 4).toFixed(3)})`)
  if (st.tintaOn && st.tintaVal) p.push(`hue-rotate(${(st.tintaVal * 1.4).toFixed(1)}deg)`)
  if (st.gamma && Math.abs(st.gammaVal - 1) > .01) {
    const g = st.gammaVal
    if (g > 1) {
      p.push(`brightness(${(1 + (g - 1) * .24).toFixed(3)})`)
      p.push(`contrast(${(1 + (g - 1) * .18).toFixed(3)})`)
    } else {
      p.push(`brightness(${(1 - (1 - g) * .18).toFixed(3)})`)
      p.push(`contrast(${(1 + (1 - g) * .24).toFixed(3)})`)
    }
  }
  if (st.effetto === 'morbido') p.push('blur(1.3px)')
  return p.join(' ') || 'none'
}

function disegnaVideo(c, g, filtro, margine = 0) {
  c.save()
  c.translate(g.W / 2, g.H / 2)
  if (st.ruota) c.rotate(Math.PI)
  if (st.specchia) c.scale(-1, 1)
  c.translate(-g.W / 2, -g.H / 2)
  c.filter = filtro
  c.drawImage(video, g.sx, g.sy, g.sw, g.sh, -margine, -margine, g.W + margine * 2, g.H + margine * 2)
  c.restore()
}
function mascheraOvale(c, g) {
  c.save()
  c.globalCompositeOperation = 'destination-in'
  c.translate(g.W / 2, g.H * .52)
  c.scale(1, g.H / g.W)
  const r = g.W * .44
  const grad = c.createRadialGradient(0, 0, r * .58, 0, 0, r)
  grad.addColorStop(0, 'rgba(0,0,0,1)')
  grad.addColorStop(.72, 'rgba(0,0,0,1)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = grad
  c.fillRect(-g.W, -g.H, g.W * 2, g.H * 2)
  c.restore()
}
function disegnaCentro(g, filtro, sfocatura = 0, opacita = 1, scala = 1) {
  const w = Math.max(2, Math.round(g.W * scala))
  const h = Math.max(2, Math.round(g.H * scala))
  if (tela2.width !== w || tela2.height !== h) { tela2.width = w; tela2.height = h }
  const gs = { ...g, W: w, H: h }
  c2.save()
  c2.globalCompositeOperation = 'source-over'
  c2.globalAlpha = 1
  c2.clearRect(0, 0, w, h)
  disegnaVideo(c2, gs, sfocatura ? `${filtro} blur(${sfocatura}px)` : filtro)
  mascheraOvale(c2, gs)
  c2.restore()
  ctx.save()
  ctx.globalAlpha = opacita
  ctx.drawImage(tela2, 0, 0, w, h, 0, 0, g.W, g.H)
  ctx.restore()
}
function disegnaFondoSfocato(g, filtro) {
  const w = Math.max(2, Math.round(g.W / 4))
  const h = Math.max(2, Math.round(g.H / 4))
  if (telaFondo.width !== w || telaFondo.height !== h) { telaFondo.width = w; telaFondo.height = h }
  const gs = { ...g, W: w, H: h }
  cf.save()
  cf.globalCompositeOperation = 'source-over'
  cf.globalAlpha = 1
  cf.filter = 'none'
  cf.fillStyle = '#000'
  cf.fillRect(0, 0, w, h)
  cf.restore()
  disegnaVideo(cf, gs, `${filtro} blur(3px) brightness(.7)`, 4)
  ctx.save()
  ctx.filter = 'none'
  ctx.drawImage(telaFondo, 0, 0, w, h, 0, 0, g.W, g.H)
  ctx.restore()
}

function disegna() {
  const vw = video.videoWidth, vh = video.videoHeight
  if (!vw || !vh) return false
  const { W, H } = dimensioni()
  if (schermo.width !== W || schermo.height !== H) {
    schermo.width = W
    schermo.height = H
    adattaSchermo()
  }
  const aspetto = W / H
  let sw = vw, sh = vh
  if (vw / vh > aspetto) sw = vh * aspetto
  else sh = vw / aspetto
  const preset = st.inquadratura === 'medio' ? 1.35 : st.inquadratura === 'stretto' ? 1.8 : 1
  const zoom = clamp(preset * (st.zoom / 100), 1, 4)
  sw = Math.min(vw, Math.max(2, sw / zoom))
  sh = Math.min(vh, Math.max(2, sh / zoom))
  const g = { sx: (vw - sw) / 2, sy: (vh - sh) / 2, sw, sh, W, H }
  const filtro = filtroCSS()

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.filter = 'none'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  if (st.sfondo === 'sfocato') {
    disegnaFondoSfocato(g, filtro)
    disegnaCentro(g, filtro, 0, 1)
  } else if (st.sfondo === 'nero') {
    disegnaCentro(g, filtro, 0, 1)
  } else {
    disegnaVideo(ctx, g, filtro)
  }

  if (st.ritocco) disegnaCentro(g, filtro, 2, clamp(st.ritoccoVal / 100 * .55, 0, .6), .5)

  // bianco software: la temperatura solo se la webcam non ha il comando vero, la tinta sempre
  if (st.wb === 'manuale') {
    const d = clamp((st.temperatura - 5600) / 4400, -1, 1)
    const t = clamp(st.tinta / 100, -1, 1)
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    if (!hw.manualeWb && Math.abs(d) > .01) {
      ctx.fillStyle = d > 0 ? `rgba(255,150,60,${(.3 * Math.abs(d)).toFixed(3)})` : `rgba(60,140,255,${(.3 * Math.abs(d)).toFixed(3)})`
      ctx.fillRect(0, 0, W, H)
    }
    if (Math.abs(t) > .01) {
      ctx.fillStyle = t > 0 ? `rgba(255,0,210,${(.2 * Math.abs(t)).toFixed(3)})` : `rgba(0,255,130,${(.2 * Math.abs(t)).toFixed(3)})`
      ctx.fillRect(0, 0, W, H)
    }
    ctx.restore()
  }

  if (st.sfondo === 'scuro') {
    const grad = ctx.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .2, W / 2, H * .48, Math.max(W, H) * .68)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(.62, 'rgba(0,0,0,.08)')
    grad.addColorStop(1, 'rgba(0,0,0,.74)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }

  if (st.effetto === 'vignetta') {
    const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .66)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,.55)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }
  if (st.effetto === 'grana') {
    if (!patternGrana) patternGrana = ctx.createPattern(rumore, 'repeat')
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = .09
    ctx.fillStyle = patternGrana
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }
  if (st.effetto === 'riflesso') {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(.4, 'rgba(255,255,255,0)')
    grad.addColorStop(.5, 'rgba(255,255,255,.13)')
    grad.addColorStop(.6, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }
  if (st.effetto === 'neon') {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, 'rgba(157,0,255,.24)')
    grad.addColorStop(.5, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(204,255,0,.16)')
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }

  if (st.riflettori) {
    const a = clamp(st.riflettoriVal / 100, 0, 1)
    const grad = ctx.createRadialGradient(W * .5, H * .34, 0, W * .5, H * .44, Math.max(W, H) * .55)
    grad.addColorStop(0, `rgba(255,255,255,${(.28 * a).toFixed(3)})`)
    grad.addColorStop(.55, `rgba(255,255,255,${(.1 * a).toFixed(3)})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }
  if (st.flash) {
    const a = clamp(st.flashVal / 100, 0, 1)
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(255,255,255,${(.18 * a).toFixed(3)})`
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }

  // nitidezza software: un po' di contrasto sui bordi (solo se la webcam non ce l'ha)
  if (st.nitidezza && st.nitidezzaVal > 0 && !hw.nitidezza) {
    if (tela2.width !== W || tela2.height !== H) { tela2.width = W; tela2.height = H }
    if (tela3.width !== W || tela3.height !== H) { tela3.width = W; tela3.height = H }
    c2.save()
    c2.globalCompositeOperation = 'source-over'
    c2.filter = 'none'
    c2.clearRect(0, 0, W, H)
    c2.drawImage(schermo, 0, 0)
    c2.restore()
    c3.save()
    c3.globalCompositeOperation = 'source-over'
    c3.filter = 'blur(1.1px)'
    c3.clearRect(0, 0, W, H)
    c3.drawImage(schermo, 0, 0)
    c3.filter = 'none'
    c3.globalCompositeOperation = 'difference'
    c3.drawImage(tela2, 0, 0)
    c3.restore()
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = clamp(st.nitidezzaVal / 100 * .75, 0, .75)
    ctx.drawImage(tela3, 0, 0)
    ctx.restore()
  }
  return true
}

function adattaSchermo() {
  if (!schermo.width || !schermo.height || !palco.clientWidth) return
  const cs = getComputedStyle(palco)
  const larghezza = Math.max(40, palco.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0))
  const altezza = Math.max(40, palco.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0))
  const aspetto = schermo.width / schermo.height
  let w = larghezza
  let h = w / aspetto
  if (h > altezza) { h = altezza; w = h * aspetto }
  schermo.style.width = `${Math.round(w)}px`
  schermo.style.height = `${Math.round(h)}px`
  posizionaGriglia()
}
function posizionaGriglia() {
  if (!griglia || griglia.hidden) return
  const p = palco.getBoundingClientRect()
  const r = schermo.getBoundingClientRect()
  griglia.style.left = `${r.left - p.left}px`
  griglia.style.top = `${r.top - p.top}px`
  griglia.style.width = `${r.width}px`
  griglia.style.height = `${r.height}px`
}

// ── i fotogrammi: uno alla volta, senza accodare ──
function avviaGiro() {
  if (inviando) return
  inviando = true
  giro()
}
async function giro() {
  if (!attivo) { inviando = false; return }
  const partenza = performance.now()
  try {
    if (video.readyState >= 2 && video.videoWidth) disegna()
    if (inviabile && video.videoWidth) await invia()
  } catch {}
  if (!attivo) { inviando = false; return }
  const fps = inviabile ? clamp(+st.fps || 30, 5, 30) : 10
  const attesa = Math.max(0, 1000 / fps - (performance.now() - partenza))
  timerInvio = setTimeout(giro, attesa)
}
async function invia() {
  const { W, H } = dimensioni()
  const blob = await new Promise((ok) => schermo.toBlob(ok, 'image/jpeg', JPEG[st.qualita] ?? .72))
  if (!blob || !inviabile) return
  const ctrl = new AbortController()
  const taglio = setTimeout(() => ctrl.abort(), 5000)
  try {
    const r = await fetch(`/api/fotogramma?w=${W}&h=${H}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', 'X-Diretta': 'vista' },
      body: blob,
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (!attivo) return
    if (r.status === 401) {
      inviabile = false
      segnaAttesa()
      collega()
      return
    }
    if (!r.ok) throw new Error(String(r.status))
    erroriInvio = 0
    segnaOk()
  } catch (e) {
    if (e?.name === 'AbortError' || !attivo) return
    erroriInvio += 1
    if (erroriInvio >= 3) segnaKo('Il pc non risponde')
    if (erroriInvio >= 8) { inviabile = false; collega() }
  } finally {
    clearTimeout(taglio)
  }
}

// ── la coppia automatica: niente codice, un portatile alla volta ──
function programmaCollega(ms) {
  clearTimeout(riprovaFra)
  riprovaFra = setTimeout(() => { if (attivo) collega() }, ms)
}
async function collega(forza = false) {
  if (collegando || !attivo) return
  collegando = true
  try {
    const r = await fetch('/api/collega', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, ...(forza ? { forza: true } : {}) }),
      cache: 'no-store',
    })
    const j = await r.json().catch(() => ({}))
    if (!attivo) return // (nel frattempo è stato staccato: non riaccendere niente)
    if (r.ok && j.ok) {
      maiCollegato = false
      inviabile = true
      erroriInvio = 0
      erroriBatti = 0
      if (j.nome && j.nome !== nome) { nome = j.nome; try { localStorage.setItem(CHIAVE_NOME, nome) } catch {} }
      nascondiVelo()
      segnaOk()
      clearTimeout(riprovaFra)
    } else if (j.bloccato) {
      // la regia ha staccato: la webcam si spegne e aspetta «Ricollega»
      inviabile = false
      attivo = false
      clearTimeout(timerInvio)
      clearTimeout(ricambioFra)
      inviando = false
      try { await wake?.release() } catch {}
      wake = null
      stopStream()
      segnaKo('Staccata dalla regia')
      mostraVelo('staccato')
    } else if (r.status === 409 || j.occupato) {
      inviabile = false
      segnaKo('Posto occupato')
      mostraVelo('occupato')
      programmaCollega(15000)
    } else {
      inviabile = false
      segnaAttesa('Collegamento…')
      mostraVelo('rete')
      programmaCollega(3000)
    }
  } catch {
    if (!attivo) return
    inviabile = false
    segnaKo('Il pc non risponde')
    if (maiCollegato) mostraVelo('rete')
    programmaCollega(3000)
  } finally {
    collegando = false
  }
}
async function batti() {
  if (!attivo) return
  try {
    const r = await fetch('/api/batti', { method: 'POST', cache: 'no-store' })
    if (!attivo) return
    if (r.status === 401) {
      inviabile = false
      segnaAttesa()
      collega()
      return
    }
    if (!r.ok) throw new Error()
    const j = await r.json().catch(() => ({}))
    if (!attivo) return
    if (!j.collegata) {
      inviabile = false
      collega()
      return
    }
    if (j.nome && j.nome !== nome) { nome = j.nome; try { localStorage.setItem(CHIAVE_NOME, nome) } catch {} }
    erroriBatti = 0
    if (!inviabile) { inviabile = true; nascondiVelo() }
    if (erroriInvio === 0) segnaOk()
  } catch {
    if (!attivo) return
    erroriBatti += 1
    if (erroriBatti >= 3) segnaKo('Il pc non risponde')
    if (erroriBatti >= 6 && inviabile) { inviabile = false; collega() }
  }
}
setInterval(batti, 2000)

// ── la webcam: accensione, cambio, permessi ──
function stopStream() {
  try { stream?.getTracks().forEach((t) => t.stop()) } catch {}
  stream = null
  video.srcObject = null
}
function tipoErrore(e) {
  const n = e?.name ?? ''
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'permesso'
  if (n === 'NotReadableError' || n === 'AbortError') return 'occupata'
  if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') return 'camera'
  return 'camera'
}
async function elencaCamere() {
  const sel = $('#cam')
  if (!navigator.mediaDevices?.enumerateDevices) return
  let lista = []
  try { lista = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput') } catch {}
  const attiva = stream?.getVideoTracks?.()[0]?.getSettings?.().deviceId || st.cam
  sel.innerHTML = lista.length
    ? lista.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || `Webcam ${i + 1}`)}</option>`).join('')
    : '<option value="">Nessuna webcam</option>'
  const scelta = lista.find((d) => d.deviceId === attiva)?.deviceId || lista[0]?.deviceId || ''
  sel.value = scelta
  if (!st.cam && scelta) { st.cam = scelta; salva() }
}

async function usaStream(s) {
  stream = s
  video.srcObject = s
  video.muted = true
  try { await video.play() } catch {}
  await new Promise((ok) => {
    if (video.videoWidth) return ok()
    const t = setTimeout(ok, 2500)
    video.addEventListener('loadedmetadata', () => { clearTimeout(t); ok() }, { once: true })
  })
  const track = s.getVideoTracks()[0]
  if (track) {
    track.addEventListener('ended', () => {
      if (stream !== s || !attivo || cambiando) return
      segnaKo('Webcam scollegata')
      clearTimeout(ricambioFra)
      ricambioFra = setTimeout(() => { if (attivo) avviaCamera() }, 600)
    })
    st.cam = track.getSettings?.().deviceId || st.cam
    hw = capacita(track)
    aggiornaRangeHardware()
    aggiornaOutput()
    hardware()
  }
  await elencaCamere()
  sincronizza()
  salva()
  attivo = true
  avviaGiro()
  if (st.schermo) schermoAcceso(true)
}

async function avviaCamera(forza = false) {
  if (accendendo) return false
  if (!navigator.mediaDevices?.getUserMedia) {
    mostraVelo('insicuro')
    return false
  }
  accendendo = true
  clearTimeout(ricambioFra)
  attivo = false
  try {
    stopStream()
    let s
    try {
      s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...VIDEO, ...(st.cam ? { deviceId: { exact: st.cam } } : {}) },
      })
    } catch (e) {
      if (st.cam && (e?.name === 'OverconstrainedError' || e?.name === 'NotFoundError')) {
        st.cam = ''
        s = await navigator.mediaDevices.getUserMedia({ audio: false, video: VIDEO })
      } else {
        throw e
      }
    }
    await usaStream(s)
    nascondiVelo()
    segnaAttesa()
    if (!inviabile) collega(forza)
    return true
  } catch (e) {
    attivo = false
    segnaKo('Webcam non disponibile')
    mostraVelo(tipoErrore(e))
    return false
  } finally {
    accendendo = false
  }
}

async function cambiaCamera(id) {
  if (cambiando || accendendo || !id) return
  cambiando = true
  const vecchio = st.cam
  try {
    st.cam = id
    salva()
    stopStream()
    const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { ...VIDEO, deviceId: { exact: id } } })
    await usaStream(s)
    nascondiVelo()
    if (!inviabile) collega()
  } catch {
    st.cam = vecchio
    salva()
    try {
      stopStream()
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...VIDEO, ...(vecchio ? { deviceId: { exact: vecchio } } : {}) },
      })
      await usaStream(s)
    } catch {}
    segnaKo('Webcam non disponibile')
  } finally {
    cambiando = false
    await elencaCamere()
    sincronizza()
  }
}

// ── lo schermo sempre acceso (se il browser lo permette) ──
async function schermoAcceso(su) {
  if (!('wakeLock' in navigator)) return
  if (su) {
    if (wake) return
    try {
      wake = await navigator.wakeLock.request('screen')
      wake.addEventListener('release', () => { wake = null })
    } catch { wake = null }
  } else {
    try { await wake?.release() } catch {}
    wake = null
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return
  if (attivo && st.schermo) schermoAcceso(true)
  else schermoAcceso(false)
})

// ── staccare e riattaccare ──
async function stacca() {
  attivo = false
  inviabile = false
  clearTimeout(timerInvio)
  clearTimeout(riprovaFra)
  clearTimeout(ricambioFra)
  inviando = false
  try { await wake?.release() } catch {}
  wake = null
  stopStream()
  try { await fetch('/api/stacco', { method: 'POST' }) } catch {}
  segnaKo('Staccata')
  sincronizza()
  mostraVelo('staccato')
}
async function riavvia() {
  nascondiVelo()
  segnaAttesa()
  await avviaCamera(true) // (un gesto vero dell'utente: se la regia aveva staccato, si rientra)
}

// ── i comandi del pannello ──
function legaSw(id, chiave, dopo = null) {
  $('#' + id).addEventListener('click', () => {
    st[chiave] = !st[chiave]
    sincronizza()
    salva()
    if (dopo) dopo()
  })
}
function legaRange(id, chiave, scala = 1, hwSu = false) {
  const el = $('#' + id)
  el.addEventListener('input', () => {
    st[chiave] = (+el.value) * scala
    aggiornaOutput()
    salvaPiano()
    if (hwSu) hardware()
  })
}

legaSw('riflettori-on', 'riflettori')
legaSw('ritocco-on', 'ritocco')
legaSw('flash-on', 'flash')
legaSw('luminosita-on', 'luminosita')
legaSw('tinta-on', 'tintaOn')
legaSw('saturazione-on', 'saturazione')
legaSw('vividezza-on', 'vividezza')
legaSw('contrasto-on', 'contrasto')
legaSw('gamma-on', 'gamma', () => hardware())
legaSw('nitidezza-on', 'nitidezza', () => hardware())
legaSw('schermo-on', 'schermo', () => schermoAcceso(st.schermo))

legaRange('riflettori', 'riflettoriVal')
legaRange('ritocco', 'ritoccoVal')
legaRange('fuoco', 'fuocoVal', 1, true)
legaRange('zoom', 'zoom', 1, false)
legaRange('otturatore', 'otturatore', 1, true)
legaRange('iso', 'iso', 1, true)
legaRange('temperatura', 'temperatura', 1, true)
legaRange('tinta', 'tinta', 1, true)
legaRange('flash', 'flashVal')
legaRange('luminosita', 'luminositaVal')
legaRange('tinta-colore', 'tintaVal')
legaRange('saturazione', 'saturazioneVal')
legaRange('vividezza', 'vividezzaVal')
legaRange('contrasto', 'contrastoVal')
legaRange('gamma', 'gammaVal', 1 / 100)
legaRange('nitidezza', 'nitidezzaVal', 1, true)

$('#zoom').addEventListener('input', () => { st.inquadratura = 'custom'; sincronizza(); salvaPiano() })
for (const b of $$('#fuoco-modo button')) {
  b.addEventListener('click', () => {
    if (b.disabled) return
    st.fuocoModo = b.dataset.fuoco
    sincronizza(); salva(); hardware()
  })
}
for (const b of $$('#sfondo button')) {
  b.addEventListener('click', () => { st.sfondo = b.dataset.sfondo; sincronizza(); salva() })
}
for (const b of $$('#inquadratura button')) {
  b.addEventListener('click', () => {
    st.inquadratura = b.dataset.inquadratura
    st.zoom = b.dataset.inquadratura === 'medio' ? 135 : b.dataset.inquadratura === 'stretto' ? 180 : 100
    sincronizza(); salva()
  })
}
$('#filtro').addEventListener('change', () => { st.filtro = $('#filtro').value; sincronizza(); salva() })
$('#effetto').addEventListener('change', () => { st.effetto = $('#effetto').value; sincronizza(); salva() })
$('#formato').addEventListener('change', () => { st.formato = $('#formato').value; sincronizza(); salva() })
$('#esposizione').addEventListener('change', () => { st.esposizione = $('#esposizione').value; sincronizza(); salva(); hardware() })
$('#wb').addEventListener('change', () => { st.wb = $('#wb').value; sincronizza(); salva(); hardware() })
$('#fps').addEventListener('change', () => { st.fps = +$('#fps').value; sincronizza(); salva() })
$('#qualita').addEventListener('change', () => { st.qualita = $('#qualita').value; sincronizza(); salva() })
$('#cam').addEventListener('change', () => { if ($('#cam').value) cambiaCamera($('#cam').value) })
$('#cam-aggiorna').addEventListener('click', async () => {
  await elencaCamere()
  if (!stream) avviaCamera()
})

$('#reg-reset').addEventListener('click', () => {
  const cam = st.cam
  st = { ...BASE, cam }
  sincronizza()
  salva()
  hardware()
  schermoAcceso(st.schermo)
})
$('#reg-chiudi').addEventListener('click', () => {
  const b = $('#reg-chiudi')
  const su = b.getAttribute('aria-expanded') !== 'false'
  $('#reg-corpo').hidden = su
  b.setAttribute('aria-expanded', String(!su))
  b.title = su ? 'Apri le regolazioni' : 'Chiudi le regolazioni'
})
$('#b-regolazioni').addEventListener('click', () => pannelloSu(pannello.hidden))
$('#pannello-chiudi').addEventListener('click', () => pannelloSu(false))
$('#b-cam').addEventListener('click', () => pannelloSu(true, true))
$('#b-specchia').addEventListener('click', () => { st.specchia = !st.specchia; sincronizza(); salva() })
$('#b-griglia').addEventListener('click', () => { st.griglia = !st.griglia; sincronizza(); salva() })
$('#b-ruota').addEventListener('click', () => { st.ruota = !st.ruota; sincronizza(); salva() })
$('#b-torcia').addEventListener('click', () => {
  st.torcia = !st.torcia
  sincronizza(); salva(); hardware()
})
$('#b-scatta').addEventListener('click', () => {
  schermo.toBlob((b) => {
    if (!b) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = `vista-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10000)
  }, 'image/jpeg', .92)
})
$('#b-stacca').addEventListener('click', () => { if (attivo) stacca(); else riavvia() })
$('#b-grande').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await $('#vista').requestFullscreen()
  } catch {}
})
document.addEventListener('fullscreenchange', () => setTimeout(() => { adattaSchermo(); posizionaGriglia() }, 80))
$('#velo-azione').addEventListener('click', () => {
  if (veloTipo === 'staccato') { nascondiVelo(); riavvia(); return }
  if (veloTipo === 'rete' || veloTipo === 'occupato') { nascondiVelo(); collega(); return }
  nascondiVelo()
  avviaCamera()
})

navigator.mediaDevices?.addEventListener?.('devicechange', async () => {
  await elencaCamere()
  const ids = [...$('#cam').options].map((o) => o.value)
  if (attivo && st.cam && !ids.includes(st.cam)) {
    st.cam = ''
    clearTimeout(ricambioFra)
    ricambioFra = setTimeout(() => { if (attivo) avviaCamera() }, 600)
  }
})

new ResizeObserver(() => posizionaGriglia()).observe(schermo)
window.addEventListener('resize', () => { adattaSchermo(); posizionaGriglia() })

// ── l'avvio: webcam subito, collegamento appena c'è ──
async function avvio() {
  if (!('requestFullscreen' in document.documentElement)) $('#b-grande').hidden = true
  if (!('wakeLock' in navigator)) {
    const b = $('#schermo-on')
    b.disabled = true
    b.title = 'Questo browser non riesce a tenere acceso lo schermo'
  }
  sincronizza()
  requestAnimationFrame(adattaSchermo)
  await elencaCamere()
  schermoAcceso(st.schermo)
  await avviaCamera()
}
avvio()
