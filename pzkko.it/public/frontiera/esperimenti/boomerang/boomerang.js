// boomerang.js — «Boomerang»: tre secondi di webcam in loop, con la cornice pzk.
//
// Tecnologia: getUserMedia per la webcam, Canvas 2D per la cornice e
// MediaRecorder su canvas.captureStream() per il filmato. Il video si crea nel
// browser, resta un Blob in memoria e si scarica solo se lo chiedi: nessun
// fotogramma viene caricato da nessuna parte.
//
//   apri()  apre la cabina

import { creaDialogo, scarica } from '../../shell.js'

const W = 720
const H = 720
const DURATA = 3000

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'boomerang',
    titolo: 'Boomerang',
    tech: 'MediaRecorder · canvas',
    voce: 'Tre secondi di webcam in loop, con la cornice pzk. Il filmato si crea e resta qui: nessun fotogramma esce dal dispositivo.',
    larga: true,
    corpo: `
      <div class="lab-boom">
        <div class="boom-sinistra">
        <section class="boom-cabina" aria-label="la cabina del boomerang">
          <span class="boom-nastro boom-nastro--sx" aria-hidden="true"></span>
          <span class="boom-nastro boom-nastro--dx" aria-hidden="true"></span>

          <div class="boom-insegna">
            <span class="boom-insegna__nome">boomerang</span>
            <span class="boom-insegna__num">cabina 08</span>
            <span class="boom-spia" aria-hidden="true"><i class="boom-spia__luce"></i><b class="boom-spia__parola"></b></span>
          </div>

          <div class="lab-telecamera lab-telecamera--quadrata boom-schermo">
            <canvas class="lab-tela" width="${W}" height="${H}" aria-label="la webcam con la cornice pzk"></canvas>
            <video class="lab-boom-video" data-video loop muted playsinline hidden aria-label="il boomerang registrato"></video>
            <span class="boom-vetro" aria-hidden="true"></span>
            <span class="boom-live" aria-hidden="true">dal vivo</span>
            <span class="boom-timbro-loop" aria-hidden="true">loop</span>

            <div class="lab-sovrapposizione boom-velo" data-velo>
              <div class="boom-poster">
                <span class="boom-poster__timbro" aria-hidden="true">spenta</span>
                <span class="boom-poster__occhiello">cabina 08 · tre secondi</span>
                <span class="boom-poster__disegno" aria-hidden="true">
                  <svg viewBox="0 0 132 96" focusable="false">
                    <path d="M14 30c0-3 2-5 5-5h16l7-11h34l7 11h16c3 0 5 2 5 5v49c0 3-2 5-5 5H19c-3 0-5-2-5-5Z"/>
                    <circle cx="62" cy="55" r="20"/>
                    <circle cx="62" cy="55" r="9"/>
                    <path d="M99 36h12M30 24h10"/>
                    <path d="M112 14l4-8M120 22l9-3M103 8l-1-7"/>
                  </svg>
                </span>
                <p class="boom-poster__titolo">mettiti in posa</p>
                <p class="boom-poster__testo" data-velo-testo>webcam spenta</p>
                <button type="button" class="lab-tasto lab-tasto--pieno boom-poster__accendi" data-accendi-velo>accendi la webcam</button>
                <p class="boom-poster__sotto">tre secondi · niente audio · il filmato resta qui</p>
              </div>
            </div>

            <div class="boom-conta" data-conta hidden aria-hidden="true">
              <span class="boom-conta__rec" data-conta-rec><i></i> REC</span>
              <span class="boom-conta__num" data-conta-num>3</span>
              <span class="boom-conta__via" data-conta-via hidden>via!</span>
              <span class="boom-conta__sotto">tre secondi · guarda l'obiettivo</span>
            </div>
            <span class="boom-lampo" data-lampo hidden aria-hidden="true"></span>
          </div>

          <div class="boom-davanzale">
            <span class="boom-davanzale__testo">3 secondi · muto · 720 × 720</span>
            <span class="boom-davanzale__slot" aria-hidden="true"></span>
            <span class="boom-adesivo" aria-hidden="true">pzk</span>
          </div>

          <i class="boom-vite boom-vite--tl" aria-hidden="true"></i>
          <i class="boom-vite boom-vite--tr" aria-hidden="true"></i>
          <i class="boom-vite boom-vite--bl" aria-hidden="true"></i>
          <i class="boom-vite boom-vite--br" aria-hidden="true"></i>
        </section>

        <aside class="boom-cartello">
          <span class="boom-cartello__timbro" aria-hidden="true">3 secondi</span>
          <p><b>un giro solo.</b> guarda l'obiettivo: il conto alla rovescia parte da sé e il loop resta qui.</p>
          <span class="boom-cartello__freccia" aria-hidden="true">
            <svg viewBox="0 0 76 54" focusable="false">
              <path d="M8 47c8-19 22-31 45-35"/>
              <path d="M43 6l11 5M43 6l6 11"/>
            </svg>
          </span>
        </aside>
        </div>

        <div class="boom-lato">
          <div class="lab-pannello boom-comandi">
            <div class="boom-comandi__testa">
              <h3>i comandi</h3>
              <span class="lab-badge" data-stato-cam>webcam spenta</span>
            </div>
            <div class="boom-tasti boom-tasti--cam">
              <button type="button" class="lab-tasto lab-tasto--pieno" data-accendi data-focus>accendi</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-spegni disabled>spegni</button>
            </div>
            <hr class="boom-divisore">
            <button type="button" class="lab-tasto lab-tasto--pieno boom-registra" data-registra disabled><i aria-hidden="true"></i>registra 3s</button>
            <div class="boom-tasti boom-tasti--loop">
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-rifai disabled>rifai</button>
              <button type="button" class="lab-tasto boom-scarica" data-scarica hidden>scarica</button>
            </div>
            <label class="boom-specchio">
              <input type="checkbox" data-specchio checked>
              <span>specchio</span>
              <small>come in uno specchio vero</small>
            </label>
            <p class="lab-nota boom-nota" data-nota-boom>la registrazione parte quando premi «registra 3s» e si ferma da sola: il video è muto e in loop.</p>
          </div>

          <section class="boom-pellicola" aria-labelledby="boom-come">
            <div class="boom-pellicola__testa">
              <h3 id="boom-come">come funziona</h3>
              <span class="boom-pellicola__tempo" aria-hidden="true">00:03</span>
            </div>
            <ol class="boom-fotogrammi">
              <li>
                <span class="boom-fotogramma__n" aria-hidden="true">1</span>
                <span class="boom-fotogramma__titolo">accendi</span>
                <small>la webcam parte solo dopo il tuo clic</small>
              </li>
              <li>
                <span class="boom-fotogramma__n" aria-hidden="true">2</span>
                <span class="boom-fotogramma__titolo">3 · 2 · 1</span>
                <small>tre secondi: cornice, ora e adesivo sono già nel video</small>
              </li>
              <li>
                <span class="boom-fotogramma__n" aria-hidden="true">3</span>
                <span class="boom-fotogramma__titolo">loop</span>
                <small>resta in loop, muto. scarica il webm o rifai</small>
              </li>
            </ol>
            <p class="boom-pellicola__firma">nessun fotogramma esce dal dispositivo: il file è un blob locale.</p>
          </section>

          <aside class="boom-bollo">
            <span class="boom-bollo__timbro" aria-hidden="true">solo locale</span>
            <p><b>la webcam parte solo dal tuo clic</b> e si spegne quando chiudi. il loop resta un blob nella scheda: niente upload, niente servizi, niente audio.</p>
            <p class="boom-bollo__firma">se chiudi o premi «spegni», la spia si spegne davvero.</p>
          </aside>

          <p class="boom-tecnica">tela <b>720 × 720</b> · <b>MediaRecorder</b> · webm locale · niente audio, niente schermo</p>
        </div>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const tela = q('canvas')
  const ctx = tela.getContext('2d')
  const videoEl = q('[data-video]')
  const velo = q('[data-velo]')
  const veloTesto = q('[data-velo-testo]')
  const bVelo = q('[data-accendi-velo]')
  const conta = q('[data-conta]')
  const contaRec = q('[data-conta-rec]')
  const contaNum = q('[data-conta-num]')
  const contaVia = q('[data-conta-via]')
  const lampo = q('[data-lampo]')
  const bAccendi = q('[data-accendi]')
  const bSpegni = q('[data-spegni]')
  const bRegistra = q('[data-registra]')
  const bRifai = q('[data-rifai]')
  const bScarica = q('[data-scarica]')
  const bStato = q('[data-stato-cam]')
  const specchioEl = q('[data-specchio]')
  const notaBoom = q('[data-nota-boom]')

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.autoplay = true
  video.style.position = 'fixed'
  video.style.left = '-9999px'
  video.style.width = '2px'
  video.style.height = '2px'
  video.style.opacity = '0'
  d.corpo.appendChild(video)

  let stream = null
  let attivo = false
  let specchio = true
  let raf = 0
  let fermo = false
  let registrando = false
  let inizio = 0
  let recorder = null
  let chunks = []
  let blob = null
  let url = null
  let streamTela = null
  let scarta = false
  let tVia = 0
  let ultimoConteggio = 0

  const supportoRec = !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream)

  function stato(testo, tipo = '') {
    bStato.textContent = testo
    bStato.classList.toggle('lab-badge--acceso', tipo === 'ok')
    bStato.classList.toggle('lab-badge--male', tipo === 'male')
  }

  // Il conto alla rovescia vive nel DOM, sopra la tela: è scenografico ma NON viene
  // registrato (dentro il canvas restano solo cornice, ora e adesivo). Il numero è
  // decorativo perché a parlare ai lettori di schermo è già .lab-stato.
  function battiConteggio(n) {
    ultimoConteggio = n
    contaNum.textContent = String(n)
    contaNum.classList.remove('is-batti')
    void contaNum.offsetWidth
    contaNum.classList.add('is-batti')
  }

  function mostraConteggio() {
    clearTimeout(tVia)
    conta.hidden = false
    contaRec.hidden = false
    contaVia.hidden = true
    contaNum.hidden = false
    lampo.hidden = true
    lampo.classList.remove('is-on')
    battiConteggio(3)
  }

  function mostraVia() {
    clearTimeout(tVia)
    contaRec.hidden = true
    contaNum.hidden = true
    contaVia.hidden = false
    contaVia.classList.remove('is-via')
    void contaVia.offsetWidth
    contaVia.classList.add('is-via')
    lampo.hidden = false
    lampo.classList.remove('is-on')
    void lampo.offsetWidth
    lampo.classList.add('is-on')
    tVia = setTimeout(nascondiConteggio, 850)
  }

  function nascondiConteggio() {
    clearTimeout(tVia)
    conta.hidden = true
    contaVia.hidden = true
    contaVia.classList.remove('is-via')
    contaNum.hidden = false
    contaNum.classList.remove('is-batti')
    lampo.hidden = true
    lampo.classList.remove('is-on')
  }

  function rettangolo(x, y, w, h, r) {
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
    else ctx.rect(x, y, w, h)
  }

  function disegnaCornice(now) {
    // bordo esterno lime
    ctx.strokeStyle = '#ccff00'
    ctx.lineWidth = 16
    rettangolo(14, 14, W - 28, H - 28, 30)
    ctx.stroke()
    // filo viola dentro
    ctx.strokeStyle = 'rgba(157,0,255,.9)'
    ctx.lineWidth = 2
    rettangolo(28, 28, W - 56, H - 56, 22)
    ctx.stroke()

    // angoli
    ctx.strokeStyle = '#ccff00'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    const ang = 44
    for (const [x, y, dx, dy] of [[36, 36, 1, 1], [W - 36, 36, -1, 1], [36, H - 36, 1, -1], [W - 36, H - 36, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y + dy * ang); ctx.lineTo(x, y); ctx.lineTo(x + dx * ang, y); ctx.stroke()
    }
    ctx.lineCap = 'butt'

    // barra in basso
    ctx.fillStyle = 'rgba(7,9,11,.82)'
    ctx.fillRect(0, H - 74, W, 74)
    ctx.fillStyle = '#ccff00'
    ctx.font = '800 26px "Lab Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('pzkko', 36, H - 47)
    ctx.fillStyle = 'rgba(233,242,228,.9)'
    ctx.font = '400 13px "Lab Mono", monospace'
    ctx.fillText('laboratorio · boomerang', 36, H - 26)
    const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(204,255,0,.9)'
    ctx.fillText(ora, W - 36, H - 42)

    // adesivo in alto a destra
    ctx.save()
    ctx.translate(W - 74, 74)
    ctx.rotate(-0.22)
    ctx.fillStyle = '#9d00ff'
    ctx.strokeStyle = '#161616'
    ctx.lineWidth = 4
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 34 : 14
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Il conto alla rovescia e il pallino REC stanno nel badge del pannello,
    // non nella tela: così il video salvato resta pulito (la cornice sì, il
    // contagiri no).
  }

  function disegnaVideo() {
    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, W, H)
    if (video.readyState < 2) return
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return
    const s = Math.max(W / vw, H / vh)
    const dw = vw * s
    const dh = vh * s
    ctx.save()
    if (specchio) {
      ctx.translate(W, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh)
    ctx.restore()
  }

  function giro(now) {
    if (fermo) return
    raf = requestAnimationFrame(giro)
    if (videoEl.hidden) {
      disegnaVideo()
      disegnaCornice(now)
    }
  }

  async function accendi() {
    if (!navigator.mediaDevices?.getUserMedia) {
      velo.hidden = false
      veloTesto.textContent = 'questo browser non ha la webcam'
      return
    }
    bAccendi.disabled = true
    bVelo.disabled = true
    velo.hidden = false
    veloTesto.textContent = 'chiedo il permesso per la webcam…'
    stato('chiedo il permesso', 'attesa')
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      video.srcObject = stream
      await video.play()
      attivo = true
      velo.hidden = true
      bSpegni.disabled = false
      bRegistra.disabled = !supportoRec
      if (!supportoRec) {
        notaBoom.textContent = 'questo browser non sa registrare la tela: puoi guardarti, ma non salvare il loop.'
        d.nota('registrazione non supportata', 'male')
      } else {
        d.nota('webcam accesa · premi registra 3s', 'ok')
      }
      stato('webcam accesa', 'ok')
      // il tasto che ha aperto la webcam sparisce sotto il poster: il focus va
      // sull'azione successiva, non sul body
      if (supportoRec) bRegistra.focus({ preventScroll: true })
      else bSpegni.focus({ preventScroll: true })
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(giro)
    } catch (e) {
      console.error(e)
      const msg = e?.name === 'NotAllowedError' ? 'permesso negato: riabilita la webcam dal lucchetto'
        : e?.name === 'NotFoundError' ? 'nessuna webcam trovata'
        : e?.name === 'NotReadableError' ? 'la webcam è occupata da un altro programma'
        : 'non riesco ad accendere la webcam'
      velo.hidden = false
      veloTesto.textContent = msg
      stato('spenta', 'male')
      d.nota(msg, 'male')
      bAccendi.disabled = false
      bVelo.disabled = false
    }
  }

  function spegni() {
    nascondiConteggio()
    if (registrando) {
      scarta = true
      fermaRegistrazione()
    }
    attivo = false
    cancelAnimationFrame(raf)
    if (stream) for (const t of stream.getTracks()) t.stop()
    stream = null
    video.srcObject = null
    pulisciLoop()
    bAccendi.disabled = false
    bVelo.disabled = false
    bSpegni.disabled = true
    bRegistra.disabled = true
    velo.hidden = false
    veloTesto.textContent = 'webcam spenta'
    bVelo.focus({ preventScroll: true })
    stato('webcam spenta')
    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, W, H)
    d.nota('webcam spenta')
  }

  function fermaRegistrazione() {
    if (!registrando) return
    registrando = false
    try { recorder?.stop() } catch {}
  }

  function registra() {
    if (!attivo || registrando || !supportoRec) return
    // se c'è un vecchio loop, lo tolgo
    pulisciLoop()
    chunks = []
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      .find((t) => MediaRecorder.isTypeSupported?.(t)) || ''
    try {
      streamTela = tela.captureStream(30)
      recorder = new MediaRecorder(streamTela, mime ? { mimeType: mime, videoBitsPerSecond: 6_000_000 } : undefined)
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
      recorder.onstop = () => {
        registrando = false
        for (const t of streamTela?.getTracks() || []) t.stop()
        streamTela = null
        if (fermo) return
        if (scarta) {
          scarta = false
          nascondiConteggio()
          bRegistra.disabled = !attivo
          stato('webcam spenta')
          return
        }
        const tipo = recorder?.mimeType || mime || 'video/webm'
        blob = new Blob(chunks, { type: tipo })
        if (url) URL.revokeObjectURL(url)
        url = URL.createObjectURL(blob)
        videoEl.src = url
        videoEl.hidden = false
        videoEl.play().catch(() => {})
        bRifai.disabled = false
        bScarica.hidden = false
        bRegistra.disabled = false
        bScarica.textContent = tipo.includes('mp4') ? 'scarica .mp4' : 'scarica .webm'
        mostraVia()
        stato('loop pronto', 'ok')
        d.nota('loop pronto · premi scarica o rifai', 'ok')
      }
      inizio = performance.now()
      registrando = true
      bRegistra.disabled = true
      bRifai.disabled = true
      bScarica.hidden = true
      recorder.start(100)
      mostraConteggio()
      const contagiri = setInterval(() => {
        if (!registrando) { clearInterval(contagiri); return }
        const resto = Math.max(0, DURATA - (performance.now() - inizio))
        const n = Math.ceil(resto / 1000)
        if (n > 0 && n !== ultimoConteggio) battiConteggio(n)
        stato(`REC · ${n}s`, 'attesa')
      }, 250)
      setTimeout(() => clearInterval(contagiri), DURATA + 200)
      setTimeout(() => { if (registrando) fermaRegistrazione() }, DURATA + 80)
      stato('registro · 3 secondi', 'attesa')
      d.nota('registro per tre secondi…', 'attesa')
    } catch (e) {
      console.error(e)
      registrando = false
      nascondiConteggio()
      stato('non riesco a registrare', 'male')
      d.nota(`non riesco a registrare: ${e?.message || e}`, 'male')
    }
  }

  function pulisciLoop() {
    videoEl.pause()
    videoEl.hidden = true
    videoEl.removeAttribute('src')
    videoEl.load()
    if (url) URL.revokeObjectURL(url)
    url = null
    blob = null
    bScarica.hidden = true
    bRifai.disabled = true
    if (attivo) bRegistra.disabled = false
  }

  bAccendi.addEventListener('click', accendi)
  bVelo.addEventListener('click', accendi)
  bSpegni.addEventListener('click', spegni)
  bRegistra.addEventListener('click', registra)
  bRifai.addEventListener('click', () => {
    nascondiConteggio()
    pulisciLoop()
    stato(attivo ? 'webcam accesa' : 'webcam spenta', attivo ? 'ok' : '')
    d.nota('di nuovo dal vivo')
    if (attivo) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(giro)
    }
  })
  bScarica.addEventListener('click', () => {
    if (!blob) return d.nota('non c\'è ancora un loop', 'male')
    const est = blob.type.includes('mp4') ? 'mp4' : 'webm'
    scarica(blob, `pzkko-boomerang-${new Date().toISOString().slice(0, 10)}.${est}`)
    d.nota('filmato scaricato', 'ok')
  })
  specchioEl.addEventListener('change', () => { specchio = specchioEl.checked })

  d.suPulizia(() => {
    fermo = true
    clearTimeout(tVia)
    cancelAnimationFrame(raf)
    if (registrando) {
      registrando = false
      try { recorder?.stop() } catch {}
    }
    for (const t of streamTela?.getTracks() || []) t.stop()
    streamTela = null
    if (stream) for (const t of stream.getTracks()) t.stop()
    stream = null
    video.srcObject = null
    videoEl.pause()
    videoEl.removeAttribute('src')
    if (url) URL.revokeObjectURL(url)
  })

  d.apri()
  if (!supportoRec) {
    notaBoom.textContent = 'questo browser non sa registrare la tela: puoi guardarti, ma non salvare il loop.'
    bRegistra.disabled = true
  }
  d.nota('pronto · accendi la webcam')
  return d
}
