// occhio.js — «Occhio»: legge QR e codici a barre con la fotocamera.
//
// Tecnologia: BarcodeDetector (la lettura la fa il browser, sul dispositivo) e
// getUserMedia per il video. Se BarcodeDetector non c'è, restano due strade che
// funzionano lo stesso: incollare un codice a mano o caricare un'immagine in un
// browser che sa leggerla. Nessuna immagine viene mandata da nessuna parte.
//
// Il canvas sopra il video serve solo a disegnare i riquadri: il codice non
// viene mai copiato dentro il canvas, quindi non finisce negli appunti da solo.
//
//   apri()  apre l'occhio

import { creaDialogo, copia } from '../../shell.js'
import { accendi, ferma, messaggioCamera, videoPronto } from '../../telecamera.js'

const FORMATI = [
  'qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39',
  'code_93', 'codabar', 'itf', 'data_matrix', 'pdf417', 'aztec',
]

const NOMI = {
  qr_code: 'QR', ean_13: 'EAN-13', ean_8: 'EAN-8', upc_a: 'UPC-A', upc_e: 'UPC-E',
  code_128: 'Code 128', code_39: 'Code 39', code_93: 'Code 93', codabar: 'Codabar',
  itf: 'ITF', data_matrix: 'Data Matrix', pdf417: 'PDF417', aztec: 'Aztec',
  testo: 'testo',
}

const MAX_STORIA = 8

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function nodo(tag, classe, testo) {
  const n = document.createElement(tag)
  if (classe) n.className = classe
  if (testo != null) n.textContent = testo
  return n
}

function nomeFormato(f) {
  return NOMI[f] || String(f || 'codice').toUpperCase()
}

function linkSicuro(valore) {
  try {
    const u = new URL(valore)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

function costruisci() {
  const d = creaDialogo({
    id: 'occhio',
    titolo: 'Occhio',
    tech: 'BarcodeDetector · fotocamera',
    voce: 'Legge QR e codici a barre con la fotocamera. La lettura avviene sul dispositivo: nessuna immagine esce da qui.',
    larga: true,
    corpo: `
      <div class="lab-occhio">
        <section class="lab-colonna">
          <div class="lab-telecamera lab-telecamera--quadrata" data-occhio-vista>
            <video data-occhio-video muted playsinline autoplay aria-label="la fotocamera"></video>
            <canvas class="lab-occhio__tela" data-occhio-tela aria-hidden="true"></canvas>
            <div class="lab-sovrapposizione" data-occhio-avviso>
              <div class="lab-occhio__invito">
                <p class="lab-nota" data-occhio-invito>La fotocamera parte solo se la accendi tu.</p>
                <button type="button" class="lab-tasto lab-tasto--pieno" data-occhio-accendi data-focus>accendi la fotocamera</button>
              </div>
            </div>
          </div>
          <div class="lab-riga">
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-occhio-gira hidden>gira la fotocamera</button>
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-occhio-torcia hidden>torcia</button>
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-occhio-spegni hidden>spegni</button>
            <label class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" for="oc-foto">carica un'immagine</label>
            <input id="oc-foto" type="file" accept="image/*" data-occhio-file hidden>
          </div>
          <p class="lab-nota" data-occhio-motore>lettore: controllo…</p>
          <p class="lab-nota"><b>Come funziona:</b> il browser cerca i codici direttamente nel fotogramma. I riquadri li disegno sopra, ma il video non viene salvato. La lista resta nella scheda e sparisce alla chiusura.</p>
        </section>

        <section class="lab-colonna">
          <div class="lab-pannello">
            <h3>l'ultimo codice</h3>
            <div class="lab-vuoto" data-occhio-ultimo>Ancora niente. Inquadra un QR o un codice a barre.</div>
            <div class="lab-divisore"></div>
            <form class="lab-riga" data-occhio-form>
              <input class="lab-campo lab-cresce" data-occhio-mano placeholder="oppure incolla qui un codice" aria-label="un codice a mano" autocomplete="off" spellcheck="false">
              <button class="lab-tasto lab-tasto--piccolo" type="submit">leggi</button>
            </form>
          </div>

          <div class="lab-pannello">
            <h3>letti in questa sessione</h3>
            <ul class="lab-lista lab-occhio__lista" data-occhio-lista hidden></ul>
            <p class="lab-nota" data-occhio-vuoto>La lista è vuota.</p>
          </div>
        </section>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const video = q('[data-occhio-video]')
  const tela = q('[data-occhio-tela]')
  const ctx = tela.getContext('2d')
  const vista = q('[data-occhio-vista]')
  const avvisoBox = q('[data-occhio-avviso]')
  const avvisoTesto = q('[data-occhio-invito]')
  const bottoneAccendi = q('[data-occhio-accendi]')
  const bottoneGira = q('[data-occhio-gira]')
  const bottoneTorcia = q('[data-occhio-torcia]')
  const bottoneSpegni = q('[data-occhio-spegni]')
  const fileInput = q('[data-occhio-file]')
  const motore = q('[data-occhio-motore]')
  const ultimoBox = q('[data-occhio-ultimo]')
  const lista = q('[data-occhio-lista]')
  const listaVuota = q('[data-occhio-vuoto]')
  const formMano = q('[data-occhio-form]')
  const campoMano = q('[data-occhio-mano]')

  let stream = null
  let detector = null
  let raf = 0
  let scansiona = false
  let occupato = false
  let ultimoTempo = 0
  let audio = null
  let torciaAccesa = false
  let davanti = 'environment'
  let storia = []

  function aggiornaMotore(testo) {
    motore.textContent = `lettore: ${testo}`
  }

  function mostraAvviso(testo, { bottone = false } = {}) {
    avvisoTesto.textContent = testo
    bottoneAccendi.hidden = !bottone
    avvisoBox.hidden = false
  }

  function nascondiAvviso() {
    avvisoBox.hidden = true
  }

  async function creaDetector() {
    if (!('BarcodeDetector' in window)) return null
    try {
      let formati = FORMATI
      if (typeof BarcodeDetector.getSupportedFormats === 'function') {
        const supportati = await BarcodeDetector.getSupportedFormats()
        formati = FORMATI.filter((f) => supportati.includes(f))
      }
      return formati.length ? new BarcodeDetector({ formats: formati }) : new BarcodeDetector()
    } catch {
      try { return new BarcodeDetector() } catch { return null }
    }
  }

  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      audio ||= new AC()
      if (audio.state === 'suspended') audio.resume()
      const o = audio.createOscillator()
      const g = audio.createGain()
      const ora = audio.currentTime
      o.type = 'sine'
      o.frequency.setValueAtTime(880, ora)
      o.frequency.exponentialRampToValueAtTime(1320, ora + .06)
      g.gain.setValueAtTime(.0001, ora)
      g.gain.exponentialRampToValueAtTime(.07, ora + .012)
      g.gain.exponentialRampToValueAtTime(.0001, ora + .13)
      o.connect(g).connect(audio.destination)
      o.start(ora)
      o.stop(ora + .14)
    } catch { /* senza audio si legge lo stesso */ }
  }

  function preparaTela(larghezza, altezza) {
    if (!larghezza || !altezza) return false
    if (tela.width !== larghezza || tela.height !== altezza) {
      tela.width = larghezza
      tela.height = altezza
    }
    ctx.clearRect(0, 0, tela.width, tela.height)
    return true
  }

  function tracciaRiquadri(letti) {
    const spessore = Math.max(2, Math.round(tela.width / 300))
    for (const c of letti) {
      const punti = Array.isArray(c.cornerPoints) && c.cornerPoints.length >= 3
        ? c.cornerPoints
        : null
      const b = c.boundingBox
      if (!punti && !b) continue
      ctx.save()
      ctx.strokeStyle = '#ccff00'
      ctx.fillStyle = 'rgba(204, 255, 0, .10)'
      ctx.lineWidth = spessore
      ctx.shadowColor = 'rgba(204, 255, 0, .8)'
      ctx.shadowBlur = spessore * 5
      ctx.beginPath()
      if (punti) {
        ctx.moveTo(punti[0].x, punti[0].y)
        for (let i = 1; i < punti.length; i++) ctx.lineTo(punti[i].x, punti[i].y)
        ctx.closePath()
      } else {
        ctx.rect(b.x, b.y, b.width, b.height)
      }
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }

  function disegnaRiquadri(letti, base = null) {
    const larghezza = base?.width || video.videoWidth
    const altezza = base?.height || video.videoHeight
    if (!preparaTela(larghezza, altezza)) return
    tracciaRiquadri(letti)
  }

  function orario(ms) {
    try {
      return new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  function mostraUltimo(voce) {
    ultimoBox.className = 'lab-occhio__ultimo lab-risultato'
    ultimoBox.replaceChildren()

    const testa = nodo('div', 'lab-riga lab-riga--tra')
    testa.append(nodo('span', 'lab-badge lab-badge--acceso', nomeFormato(voce.formato)))
    testa.append(nodo('span', 'lab-nota', voce.origine === 'immagine' ? "da un'immagine" : voce.origine === 'mano' ? 'a mano' : 'dalla fotocamera'))

    const valore = nodo('p', 'lab-occhio__val', voce.valore)
    const tasti = nodo('div', 'lab-riga')
    const copiaBtn = nodo('button', 'lab-tasto lab-tasto--fantasma lab-tasto--piccolo', 'copia')
    copiaBtn.type = 'button'
    copiaBtn.addEventListener('click', async () => {
      const ok = await copia(voce.valore)
      d.nota(ok ? 'codice copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
    })
    tasti.append(copiaBtn)

    const link = linkSicuro(voce.valore)
    if (link) {
      const a = nodo('a', 'lab-tasto lab-tasto--piccolo', 'apri il link')
      a.href = link
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      tasti.append(a)
    }

    ultimoBox.append(testa, valore, tasti)
  }

  function disegnaStoria() {
    lista.replaceChildren()
    lista.hidden = storia.length === 0
    listaVuota.hidden = storia.length > 0
    for (const voce of storia) {
      const li = nodo('li')
      li.append(nodo('span', 'lab-badge', nomeFormato(voce.formato)))
      const testo = nodo('span', 'lab-occhio__val', voce.valore)
      li.append(testo)
      li.append(nodo('small', '', orario(voce.quando)))
      const copiaBtn = nodo('button', 'lab-tasto lab-tasto--fantasma lab-tasto--piccolo', 'copia')
      copiaBtn.type = 'button'
      copiaBtn.setAttribute('aria-label', `copia ${voce.valore}`)
      copiaBtn.addEventListener('click', async () => {
        const ok = await copia(voce.valore)
        d.nota(ok ? 'codice copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
      })
      li.append(copiaBtn)
      const link = linkSicuro(voce.valore)
      if (link) {
        const a = nodo('a', 'lab-tasto lab-tasto--fantasma lab-tasto--piccolo', 'apri')
        a.href = link
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.setAttribute('aria-label', `apri ${voce.valore}`)
        li.append(a)
      }
      lista.append(li)
    }
  }

  function aggiungi(codice, origine = 'fotocamera') {
    const valore = String(codice?.rawValue ?? '').trim()
    if (!valore) return
    const formato = codice?.format || 'testo'
    if (storia.some((v) => v.formato === formato && v.valore === valore)) return

    const voce = { valore, formato, origine, quando: Date.now() }
    storia = [voce, ...storia].slice(0, MAX_STORIA)
    mostraUltimo(voce)
    disegnaStoria()
    beep()
    try { navigator.vibrate?.(60) } catch { /* non tutti vibrano */ }
    d.nota(`letto: ${nomeFormato(formato)}`, 'ok')
  }

  function ciclo(ts = 0) {
    if (!scansiona) return
    raf = requestAnimationFrame(ciclo)
    if (!detector || !videoPronto(video) || document.hidden || occupato) return
    if (ts - ultimoTempo < 160) return
    ultimoTempo = ts
    occupato = true
    detector.detect(video)
      .then((letti) => {
        disegnaRiquadri(letti)
        for (const c of letti) aggiungi(c)
      })
      .catch(() => { /* un fotogramma può fallire: il prossimo va bene */ })
      .finally(() => { occupato = false })
  }

  async function accendiCamera() {
    if (stream) return
    bottoneAccendi.disabled = true
    mostraAvviso('sto chiedendo il permesso…', { bottone: false })
    try {
      stream = await accendi(video, { davanti })
      nascondiAvviso()
      bottoneSpegni.hidden = false
      bottoneGira.hidden = false
      d.nota('fotocamera accesa · inquadra un codice', 'ok')

      detector ||= await creaDetector()
      if (detector) {
        aggiornaMotore('BarcodeDetector · pronto')
        scansiona = true
        ultimoTempo = 0
        ciclo()
      } else {
        aggiornaMotore('BarcodeDetector non disponibile · codice a mano')
        d.nota("fotocamera accesa, ma questo browser non sa leggere i codici: incollalo a mano", 'attesa')
        mostraAvviso("Questo browser non ha BarcodeDetector: puoi incollare il codice a mano. In Chrome su Android di solito funziona.", { bottone: false })
        setTimeout(() => { if (stream) nascondiAvviso() }, 3200)
      }
      controllaTorcia()
    } catch (e) {
      mostraAvviso(messaggioCamera(e), { bottone: true })
      d.nota(messaggioCamera(e), 'male')
    } finally {
      bottoneAccendi.disabled = false
    }
  }

  function spegniCamera() {
    scansiona = false
    cancelAnimationFrame(raf)
    raf = 0
    ferma(stream, video)
    stream = null
    occupato = false
    torciaAccesa = false
    bottoneTorcia.hidden = true
    bottoneTorcia.classList.remove('is-on')
    bottoneTorcia.setAttribute('aria-pressed', 'false')
    bottoneSpegni.hidden = true
    bottoneGira.hidden = true
    ctx.clearRect(0, 0, tela.width, tela.height)
    mostraAvviso('La fotocamera è spenta. Puoi riaccenderla quando vuoi.', { bottone: true })
    d.nota('fotocamera spenta')
  }

  function controllaTorcia() {
    let cap = null
    try { cap = stream?.getVideoTracks?.()[0]?.getCapabilities?.() } catch { /* niente torcia */ }
    bottoneTorcia.hidden = !cap?.torch
  }

  async function cambiaTorcia() {
    const traccia = stream?.getVideoTracks?.()[0]
    if (!traccia) return
    try {
      torciaAccesa = !torciaAccesa
      await traccia.applyConstraints({ advanced: [{ torch: torciaAccesa }] })
      bottoneTorcia.classList.toggle('is-on', torciaAccesa)
      bottoneTorcia.setAttribute('aria-pressed', String(torciaAccesa))
      d.nota(torciaAccesa ? 'torcia accesa' : 'torcia spenta', 'ok')
    } catch {
      torciaAccesa = false
      bottoneTorcia.hidden = true
      d.nota('questa fotocamera non ha la torcia', 'attesa')
    }
  }

  async function cambiaCamera() {
    const eraAccesa = !!stream
    spegniCamera()
    davanti = davanti === 'environment' ? 'user' : 'environment'
    if (eraAccesa) await accendiCamera()
  }

  async function leggiImmagine(file) {
    if (!file) return
    let bmp = null
    try {
      bmp = await createImageBitmap(file)
      if (!detector) detector = await creaDetector()
      if (!detector) {
        aggiornaMotore('BarcodeDetector non disponibile · codice a mano')
        d.nota("questo browser non sa leggere le immagini: incolla il codice a mano", 'attesa')
        return
      }
      if (bmp.width && bmp.height) {
        preparaTela(bmp.width, bmp.height)
        ctx.drawImage(bmp, 0, 0)
      }
      const letti = await detector.detect(bmp)
      tracciaRiquadri(letti)
      if (!letti.length) {
        d.nota("nessun codice nell'immagine", 'attesa')
        return
      }
      for (const c of letti) aggiungi(c, 'immagine')
      d.nota(`${letti.length} codic${letti.length === 1 ? 'e' : 'i'} nell'immagine`, 'ok')
    } catch (e) {
      console.warn('Occhio: immagine non letta', e)
      d.nota("non riesco a leggere questa immagine", 'male')
    } finally {
      try { bmp?.close() } catch { /* già chiuso */ }
    }
  }

  bottoneAccendi.addEventListener('click', accendiCamera)
  bottoneSpegni.addEventListener('click', spegniCamera)
  bottoneGira.addEventListener('click', cambiaCamera)
  bottoneTorcia.addEventListener('click', cambiaTorcia)

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    leggiImmagine(file)
  })

  formMano.addEventListener('submit', (e) => {
    e.preventDefault()
    const valore = campoMano.value.trim()
    if (!valore) return
    aggiungi({ rawValue: valore, format: 'testo' }, 'mano')
    campoMano.value = ''
  })

  // disegna il riquadro anche quando il codice è già stato letto: il video
  // continua a scorrere e l'ultimo riquadro sparisce appena non c'è più.
  vista.addEventListener('pointerdown', () => {
    if (stream && !detector) nascondiAvviso()
  })

  creaDetector().then((det) => {
    detector = det
    if (!det) aggiornaMotore('BarcodeDetector non disponibile · codice a mano')
    else aggiornaMotore('BarcodeDetector · pronto')
  })

  // chiedere i formati può richiedere un attimo: intanto la finestra è aperta
  d.suPulizia(() => {
    spegniCamera()
    try { audio?.close() } catch { /* già chiuso */ }
  })

  disegnaStoria()
  d.apri()
  return d
}
