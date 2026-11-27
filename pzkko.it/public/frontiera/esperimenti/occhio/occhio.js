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
  testo: 'codice a mano',
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
        <section class="occhio-scena">
          <div class="lab-telecamera lab-telecamera--quadrata occhio-vista" data-occhio-vista>
            <video data-occhio-video muted playsinline autoplay aria-label="il video della fotocamera"></video>
            <canvas class="lab-occhio__tela" data-occhio-tela aria-hidden="true"></canvas>

            <div class="occhio-mirino" aria-hidden="true">
              <i class="occhio-angolo occhio-angolo--tl"></i>
              <i class="occhio-angolo occhio-angolo--tr"></i>
              <i class="occhio-angolo occhio-angolo--bl"></i>
              <i class="occhio-angolo occhio-angolo--br"></i>
              <i class="occhio-scansiona"></i>
              <span class="occhio-etichetta">inquadra un codice</span>
            </div>

            <div class="lab-sovrapposizione occhio-avviso" data-occhio-avviso>
              <div class="lab-occhio__invito occhio-invito">
                <span class="occhio-disegno" aria-hidden="true">
                  <svg viewBox="0 0 122 82" focusable="false">
                    <path d="M9 24c0-3 2-5 5-5h18l6-10h26l6 10h17c3 0 5 2 5 5v38c0 3-2 5-5 5H14c-3 0-5-2-5-5Z"/>
                    <circle cx="61" cy="43" r="17"/>
                    <circle cx="61" cy="43" r="8"/>
                    <path d="M88 29h9"/>
                    <circle cx="22" cy="29" r="1.6" fill="currentColor" stroke="none"/>
                    <path d="M100 11l5-5M104 16l7-2M94 8l1-6"/>
                  </svg>
                </span>
                <p class="lab-nota occhio-invito__testo" data-occhio-invito>la fotocamera parte solo se la accendi tu.</p>
                <button type="button" class="lab-tasto lab-tasto--pieno occhio-accendi" data-occhio-accendi data-focus>accendi la fotocamera</button>
                <span class="occhio-timbro-spenta" aria-hidden="true">spenta</span>
              </div>
            </div>
          </div>

          <p class="lab-nota occhio-motore" data-occhio-motore>lettore: controllo…</p>

          <div class="occhio-comandi">
            <div class="occhio-tasti">
              <button type="button" class="lab-tasto" data-occhio-gira hidden>gira la fotocamera</button>
              <button type="button" class="lab-tasto" data-occhio-torcia hidden>torcia</button>
              <button type="button" class="lab-tasto" data-occhio-spegni hidden>spegni</button>
            </div>
            <button type="button" class="occhio-sportello" data-occhio-scegli aria-label="leggi un'immagine" aria-describedby="oc-foto-nota">
              <span class="occhio-sportello__titolo">leggi un'immagine</span>
              <span class="occhio-sportello__nota" id="oc-foto-nota">un file dal telefono o dal disco: lo leggo qui, non lo mando a nessuno.</span>
            </button>
            <input id="oc-foto" type="file" accept="image/*" data-occhio-file hidden>
          </div>

          <div class="occhio-bollo" aria-hidden="true">
            <span>non registra</span>
            <small>nessun fotogramma viene salvato</small>
          </div>
        </section>

        <section class="occhio-lato">
          <div class="lab-pannello occhio-lettura">
            <h3>l'ultimo codice</h3>
            <div class="lab-vuoto occhio-ultimo-vuoto" data-occhio-ultimo>
              <span class="occhio-vuoto__occhio" aria-hidden="true">
                <svg viewBox="0 0 64 28" focusable="false">
                  <path d="M3 14.5C11 5.5 21 2 32 2s21 3.5 29 12.5C53 23 43 26.5 32 26.5S11 23 3 14.5Z"/>
                  <circle cx="32" cy="14.5" r="7"/>
                  <circle cx="32" cy="14.5" r="2.2" fill="currentColor" stroke="none"/>
                </svg>
              </span>
              <span>ancora niente da leggere.</span>
              <small>inquadra un QR o un codice a barre, oppure scrivilo qui sotto.</small>
            </div>
            <form class="occhio-mano" data-occhio-form>
              <label class="lab-etichetta" for="oc-mano">a mano</label>
              <div class="lab-riga">
                <input id="oc-mano" class="lab-campo lab-cresce" data-occhio-mano placeholder="incolla qui un codice" aria-label="un codice a mano" autocomplete="off" spellcheck="false">
                <button class="lab-tasto" type="submit">leggi</button>
              </div>
            </form>
          </div>

          <div class="lab-pannello occhio-storico">
            <h3>letti in questa sessione</h3>
            <button type="button" class="occhio-svuota" data-occhio-svuota hidden>svuota la lista</button>
            <ul class="lab-lista lab-occhio__lista" data-occhio-lista hidden></ul>
            <div class="lab-vuoto occhio-lista-vuota" data-occhio-vuoto>
              <span class="occhio-vuoto__occhio" aria-hidden="true">
                <svg viewBox="0 0 64 28" focusable="false">
                  <path d="M3 14.5C11 5.5 21 2 32 2s21 3.5 29 12.5C53 23 43 26.5 32 26.5S11 23 3 14.5Z"/>
                  <circle cx="32" cy="14.5" r="7"/>
                  <circle cx="32" cy="14.5" r="2.2" fill="currentColor" stroke="none"/>
                </svg>
              </span>
              <span>la lista è vuota.</span>
              <small>i codici letti restano qui finché la finestra è aperta.</small>
            </div>
          </div>

          <aside class="occhio-nota">
            <div class="occhio-nota__testa">
              <h3>come funziona</h3>
              <span class="occhio-timbro" aria-hidden="true">solo locale</span>
            </div>
            <p>il browser cerca i codici direttamente nel fotogramma. i riquadri sono disegnati sopra il video, ma il codice non viene copiato dentro il disegno.</p>
            <p class="occhio-privacy"><b>il video non esce dal dispositivo.</b> non viene salvato né spedito; anche l'immagine che apri resta nella scheda: la leggo e la dimentico.</p>
            <p>inquadra tutto il codice e tienilo fermo un attimo. se il browser non ha BarcodeDetector, il codice si incolla a mano: nessun errore e nessun ripiego strano.</p>
            <p class="occhio-nota__firma">niente upload, niente servizi, niente telemetria. la lista sparisce quando chiudi.</p>
          </aside>
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
  const svuota = q('[data-occhio-svuota]')
  const scegli = q('[data-occhio-scegli]')
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

  function aggiornaMotore(testo, stato = '') {
    motore.textContent = `lettore: ${testo}`
    if (stato) motore.dataset.stato = stato
    else delete motore.dataset.stato
  }

  // il mirino dice la verità: quando il browser non sa leggere, niente linea che scorre
  function mostraLettore(disponibile) {
    vista.classList.toggle('senza-lettore', !disponibile)
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

  function nomeOrigine(origine) {
    return origine === 'immagine' ? "da un'immagine" : origine === 'mano' ? 'scritto a mano' : 'dalla fotocamera'
  }

  function mostraUltimo(voce) {
    ultimoBox.className = 'lab-occhio__ultimo lab-risultato'
    ultimoBox.replaceChildren()

    const testa = nodo('div', 'occhio-lettura__testa')
    testa.append(nodo('span', 'occhio-formato', nomeFormato(voce.formato)))
    testa.append(nodo('span', 'occhio-origine', ` · ${nomeOrigine(voce.origine)}`))
    testa.append(nodo('time', 'occhio-quando', ` ${orario(voce.quando)}`))

    const valore = nodo('p', 'lab-occhio__val', voce.valore)
    const tasti = nodo('div', 'occhio-azioni')
    const copiaBtn = nodo('button', 'occhio-azione occhio-azione--copia', 'copia')
    copiaBtn.type = 'button'
    copiaBtn.setAttribute('aria-label', 'copia il codice')
    copiaBtn.addEventListener('click', async () => {
      const ok = await copia(voce.valore)
      d.nota(ok ? 'codice copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
    })
    tasti.append(copiaBtn)

    const link = linkSicuro(voce.valore)
    if (link) {
      const a = nodo('a', 'occhio-azione occhio-azione--apri', 'apri')
      a.href = link
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.setAttribute('aria-label', 'apri il link del codice')
      tasti.append(a)
    }

    ultimoBox.append(testa, valore, tasti)
  }

  function disegnaStoria() {
    lista.replaceChildren()
    lista.hidden = storia.length === 0
    listaVuota.hidden = storia.length > 0
    svuota.hidden = storia.length === 0
    for (const voce of storia) {
      const li = nodo('li', 'occhio-riga')
      const testa = nodo('div', 'occhio-riga__testa')
      testa.append(nodo('span', 'lab-badge', nomeFormato(voce.formato)))
      testa.append(nodo('time', 'occhio-riga__ora', ` ${orario(voce.quando)}`))
      const testo = nodo('p', 'occhio-riga__val', voce.valore)
      const tasti = nodo('div', 'occhio-riga__tasti')
      const copiaBtn = nodo('button', 'occhio-azione', 'copia')
      copiaBtn.type = 'button'
      copiaBtn.setAttribute('aria-label', `copia ${voce.valore}`)
      copiaBtn.addEventListener('click', async () => {
        const ok = await copia(voce.valore)
        d.nota(ok ? 'codice copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
      })
      tasti.append(copiaBtn)
      const link = linkSicuro(voce.valore)
      if (link) {
        const a = nodo('a', 'occhio-azione', 'apri')
        a.href = link
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.setAttribute('aria-label', `apri ${voce.valore}`)
        tasti.append(a)
      }
      li.append(testa, testo, tasti)
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
        aggiornaMotore('BarcodeDetector · pronto', 'ok')
        mostraLettore(true)
        scansiona = true
        ultimoTempo = 0
        ciclo()
      } else {
        // il video resta visibile: il messaggio sta nella riga del lettore, non sopra lo schermo
        aggiornaMotore('BarcodeDetector non disponibile · codice a mano', 'no')
        mostraLettore(false)
        d.nota('fotocamera accesa · leggi il codice a mano', 'attesa')
      }
      controllaTorcia()
      // il tasto «accendi» sparisce sotto il mirino: il focus passa a «spegni»
      bottoneSpegni.focus({ preventScroll: true })
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
    mostraAvviso('la fotocamera parte solo se la accendi tu.', { bottone: true })
    bottoneAccendi.focus({ preventScroll: true })
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
        aggiornaMotore('BarcodeDetector non disponibile · codice a mano', 'no')
        mostraLettore(false)
        d.nota('questo browser non legge le immagini · codice a mano', 'attesa')
        return
      }
      // l'immagine non viene disegnata nel canvas dei riquadri: la leggo e la dimentico
      const letti = await detector.detect(bmp)
      if (!letti.length) {
        d.nota("nessun codice nell'immagine", 'attesa')
        return
      }
      for (const c of letti) aggiungi(c, 'immagine')
      if (letti.length > 1) d.nota(`${letti.length} codici nell'immagine`, 'ok')
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

  scegli.addEventListener('click', () => fileInput.click())

  svuota.addEventListener('click', () => {
    storia = []
    disegnaStoria()
    d.nota('lista svuotata')
  })

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
    mostraLettore(!!det)
    if (!det) aggiornaMotore('BarcodeDetector non disponibile · codice a mano', 'no')
    else aggiornaMotore('BarcodeDetector · pronto', 'ok')
  })

  // chiedere i formati può richiedere un attimo: intanto la finestra è aperta
  d.suPulizia(() => {
    spegniCamera()
    try { audio?.close() } catch { /* già chiuso */ }
  })

  disegnaStoria()
  d.nota('pronto · accendi la fotocamera o scrivi il codice a mano')
  d.apri()
  return d
}
