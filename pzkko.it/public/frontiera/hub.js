// hub.js — la pagina della Frontiera: dieci schede, un modulo per scheda.
//
// Ogni esperimento si carica solo quando serve (`import()`), così la pagina
// pesa poco. L'indirizzo #ink, #busta… apre direttamente un esperimento; i
// link della Busta (#b1.…) aprono la Busta senza perdere il messaggio.
//
// La grafica è in lab.css. Qui c'è solo il comportamento.

const MODULI = {
  ink: () => import('./esperimenti/ink/ink.js'),
  battito: () => import('./esperimenti/battito/battito.js'),
  due: () => import('./esperimenti/due/due.js'),
  busta: () => import('./esperimenti/busta/busta.js'),
  occhio: () => import('./esperimenti/occhio/occhio.js'),
  voce: () => import('./esperimenti/voce/voce.js'),
  zaino: () => import('./esperimenti/zaino/zaino.js'),
  boomerang: () => import('./esperimenti/boomerang/boomerang.js'),
  poeta: () => import('./esperimenti/poeta/poeta.js'),
  ar: () => import('./esperimenti/ar/ar.js'),
}

const errore = document.querySelector('[data-errore]')

function sbaglia(testo) {
  if (!errore) return
  errore.textContent = testo
  errore.hidden = !testo
}

function nomeDaHash() {
  let h = ''
  try { h = decodeURIComponent(location.hash.slice(1)) } catch { return null }
  if (h.startsWith('b1.')) return 'busta'
  return Object.hasOwn(MODULI, h) ? h : null
}

function segna(nome, stato, testo) {
  const el = document.querySelector(`[data-supporto="${nome}"]`)
  if (!el) return
  el.dataset.stato = stato
  const t = el.querySelector('span')
  if (t) t.textContent = testo
}

function controlla() {
  // Muro liquido: WebGL2, con il canvas 2D di riserva.
  try {
    const a = document.createElement('canvas')
    const b = document.createElement('canvas')
    segna('ink', a.getContext('webgl2') ? 'ok' : b.getContext('2d') ? 'parziale' : 'no',
      a.getContext('webgl2') ? 'pronto' : b.getContext('2d') ? 'con riserva' : 'non supportato')
  } catch { segna('ink', 'no', 'non supportato') }

  segna('battito', (window.AudioContext || window.webkitAudioContext) ? 'ok' : 'no',
    (window.AudioContext || window.webkitAudioContext) ? 'pronto' : 'non supportato')

  segna('due', 'BroadcastChannel' in window ? 'ok' : 'no',
    'BroadcastChannel' in window ? 'pronto' : 'non supportato')

  segna('busta', window.crypto?.subtle ? 'ok' : 'no',
    window.crypto?.subtle ? 'pronto' : 'serve HTTPS')

  const barcode = 'BarcodeDetector' in window
  const camera = !!navigator.mediaDevices?.getUserMedia
  segna('occhio', barcode ? 'ok' : camera ? 'parziale' : 'no',
    barcode ? 'pronto' : camera ? 'codice a mano' : 'non supportato')

  const voce = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  segna('voce', voce ? 'ok' : 'parziale', voce ? 'pronto' : 'solo testo')

  segna('zaino', navigator.storage?.getDirectory ? 'ok' : 'no',
    navigator.storage?.getDirectory ? 'pronto' : 'non supportato')

  const boom = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && HTMLCanvasElement.prototype.captureStream)
  segna('boomerang', boom ? 'ok' : 'no', boom ? 'chiede la webcam' : 'non supportato')

  const ia = globalThis.LanguageModel || globalThis.ai?.languageModel
  segna('poeta', 'ok', ia ? 'IA se pronta' : 'Markov')

  // La realtà aumentata si sa solo chiedendolo.
  if (navigator.xr?.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-ar')
      .then((ok) => segna('ar', ok ? 'ok' : 'no', ok ? 'pronto' : 'serve Android'))
      .catch(() => segna('ar', 'no', 'serve Android'))
  } else {
    segna('ar', 'no', 'serve Android')
  }
}

async function apri(nome, { mantieniHash = false } = {}) {
  const carica = MODULI[nome]
  if (!carica) return
  sbaglia('')
  try {
    const mod = await carica()
    if (typeof mod.apri !== 'function') throw new Error(`il modulo ${nome} non esporta apri()`)
    await mod.apri()
    if (!mantieniHash) {
      const h = `#${nome}`
      if (location.hash !== h) history.replaceState(null, '', h)
    }
  } catch (e) {
    console.error(e)
    sbaglia(`Non riesco ad aprire «${nome}»: ${e?.message || e}. Riprova o apri la Frontiera in una scheda.`)
  }
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-apri]')
  if (!b) return
  e.preventDefault()
  apri(b.dataset.apri, { mantieniHash: b.dataset.apri === 'busta' && location.hash.startsWith('#b1.') })
})

window.addEventListener('pzkko-lab-chiuso', (e) => {
  const id = e.detail?.id
  if (!id) return
  let h = ''
  try { h = decodeURIComponent(location.hash.slice(1)) } catch { h = '' }
  if (h === id) history.replaceState(null, '', location.pathname + location.search)
})

window.addEventListener('hashchange', () => {
  const n = nomeDaHash()
  if (n && !document.querySelector('dialog[open]')) apri(n, { mantieniHash: n === 'busta' && location.hash.startsWith('#b1.') })
})

if (window.self !== window.top) {
  const avviso = document.querySelector('[data-avviso-iframe]')
  const esterno = document.querySelector('[data-esterno]')
  if (avviso) avviso.hidden = false
  if (esterno) esterno.hidden = false
}

controlla()

const primo = nomeDaHash()
if (primo) apri(primo, { mantieniHash: primo === 'busta' && location.hash.startsWith('#b1.') })
