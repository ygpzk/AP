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
        <div class="lab-telecamera lab-telecamera--quadrata">
          <canvas class="lab-tela" width="${W}" height="${H}" aria-label="la webcam con la cornice pzk"></canvas>
          <video class="lab-boom-video" data-video loop muted playsinline hidden aria-label="il boomerang registrato"></video>
          <div class="lab-sovrapposizione" data-velo>webcam spenta<br><small>premi «accendi» per vederti</small></div>
        </div>
        <div class="lab-colonna">
          <div class="lab-pannello">
            <div class="lab-riga">
              <button type="button" class="lab-tasto lab-tasto--pieno" data-accendi data-focus>accendi</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-spegni disabled>spegni</button>
              <span class="lab-badge" data-stato-cam>webcam spenta</span>
            </div>
            <div class="lab-divisore"></div>
            <div class="lab-riga">
              <button type="button" class="lab-tasto lab-tasto--pieno" data-registra disabled>registra 3s</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-rifai disabled>rifai</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-scarica hidden>scarica</button>
            </div>
            <div class="lab-divisore"></div>
            <label class="lab-riga lab-nota" style="cursor:pointer">
              <input type="checkbox" data-specchio checked> specchio (come in uno specchio vero)
            </label>
            <p class="lab-nota" style="margin-top:10px" data-nota-boom>La registrazione parte quando premi «registra 3s» e si ferma da sola. Il video è muto e in loop.</p>
          </div>
          <div class="lab-pannello">
            <h3>Come funziona</h3>
            <p class="lab-nota">La telecamera disegna ogni fotogramma su una tela; la tela viene registrata con <b>MediaRecorder</b> per tre secondi. Il risultato è un file <b>WebM</b> (o MP4, se il browser preferisce) che vive solo in questa scheda finché non lo scarichi.</p>
            <p class="lab-nota" style="margin-top:8px">La cornice, l'ora e l'adesivo fanno parte del video: non sono un filtro sopra.</p>
          </div>
        </div>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const tela = q('canvas')
  const ctx = tela.getContext('2d')
  const videoEl = q('[data-video]')
  const velo = q('[data-velo]')
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

  const supportoRec = !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream)

  function stato(testo, tipo = '') {
    bStato.textContent = testo
    bStato.classList.toggle('lab-badge--acceso', tipo === 'ok')
    bStato.classList.toggle('lab-badge--male', tipo === 'male')
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
      velo.textContent = 'questo browser non ha la webcam'
      return
    }
    bAccendi.disabled = true
    velo.hidden = false
    velo.textContent = 'chiedo il permesso per la webcam…'
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
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(giro)
    } catch (e) {
      console.error(e)
      const msg = e?.name === 'NotAllowedError' ? 'permesso negato: riabilita la webcam dal lucchetto'
        : e?.name === 'NotFoundError' ? 'nessuna webcam trovata'
        : e?.name === 'NotReadableError' ? 'la webcam è occupata da un altro programma'
        : 'non riesco ad accendere la webcam'
      velo.hidden = false
      velo.textContent = msg
      stato('spenta', 'male')
      d.nota(msg, 'male')
      bAccendi.disabled = false
    }
  }

  function spegni() {
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
    bSpegni.disabled = true
    bRegistra.disabled = true
    velo.hidden = false
    velo.textContent = 'webcam spenta'
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
        stato('loop pronto', 'ok')
        d.nota('loop pronto · premi scarica o rifai', 'ok')
      }
      inizio = performance.now()
      registrando = true
      bRegistra.disabled = true
      bRifai.disabled = true
      bScarica.hidden = true
      recorder.start(100)
      const contagiri = setInterval(() => {
        if (!registrando) { clearInterval(contagiri); return }
        const resto = Math.max(0, DURATA - (performance.now() - inizio))
        stato(`REC · ${Math.ceil(resto / 1000)}s`, 'attesa')
      }, 250)
      setTimeout(() => clearInterval(contagiri), DURATA + 200)
      setTimeout(() => { if (registrando) fermaRegistrazione() }, DURATA + 80)
      stato('registro · 3 secondi', 'attesa')
      d.nota('registro per tre secondi…', 'attesa')
    } catch (e) {
      console.error(e)
      registrando = false
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
  bSpegni.addEventListener('click', spegni)
  bRegistra.addEventListener('click', registra)
  bRifai.addEventListener('click', () => {
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
