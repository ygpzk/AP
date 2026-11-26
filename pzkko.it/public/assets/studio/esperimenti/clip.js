// 10 · Clip viva. Sei secondi di cartolina animata registrati dal canvas con
// MediaRecorder: si scaricano come WebM (o MP4, se il browser lo preferisce) e
// si possono mandare col foglio di condivisione. Niente server, niente ffmpeg.
import { esc, ferma, righe, data as dataIt, ora } from '../utils.js'

const T = {
  it: {
    registra: 'Registra 6 secondi',
    ferma: 'Fermo…',
    fatto: 'fatto',
    pronta: 'pronta',
    no: 'MediaRecorder non disponibile',
    nota: 'La clip nasce dal canvas: sei secondi, 720 × 720, senza audio. Il WebM si può scaricare o condividere; se il browser non lo sa fare, resta il PNG della cartolina.',
    scarica: 'Scarica la clip',
    condividi: 'Condividi',
    registrando: 'registro…',
    errore: 'Non riesco a registrare.',
    adesso: 'ADESSO',
    live: 'dal vivo',
    pausa: 'in pausa',
    offline: 'offline',
    online: 'online',
    ascolta: 'STA ASCOLTANDO',
  },
  en: {
    registra: 'Record 6 seconds',
    ferma: 'Stopping…',
    fatto: 'done',
    pronta: 'ready',
    no: 'MediaRecorder not available',
    nota: 'The clip is born from the canvas: six seconds, 720 × 720, no audio. The WebM can be downloaded or shared; if the browser cannot, the postcard PNG is still there.',
    scarica: 'Download the clip',
    condividi: 'Share',
    registrando: 'recording…',
    errore: 'I cannot record.',
    adesso: 'NOW',
    live: 'live',
    pausa: 'idle',
    offline: 'offline',
    online: 'online',
    ascolta: 'LISTENING TO',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]

const MIME = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']

export default {
  id: 'clip',
  titolo: { it: 'Clip viva', en: 'Living clip' },
  testo: {
    it: 'Sei secondi della scheda «Adesso» registrati dal canvas e pronti da mandare: un piccolo film di quello che sta succedendo, senza registrare lo schermo.',
    en: 'Six seconds of the “Now” card recorded from the canvas, ready to send: a little film of what is happening, without screen recording.',
  },
  tecnologie: ['Canvas', 'MediaRecorder', 'Web Share'],
  monta(el, api) {
    const lang = api.lang
    const supportato = !!window.MediaRecorder && !!HTMLCanvasElement.prototype.captureStream
    el.innerHTML = `<div class="lab-clip">
      <canvas class="lab-clip__tela" width="720" height="720" aria-label="${esc(t(lang, 'nota'))}"></canvas>
      <div class="lab-clip__velo"><span data-rec hidden>REC</span><span data-tempo></span></div>
    </div>
    <div class="lab__azioni">
      <button type="button" class="lab__bottone" data-registra ${supportato ? '' : 'disabled'}>● ${esc(t(lang, 'registra'))}</button>
      <button type="button" class="lab__bottone lab__bottone--fantasma" data-scarica hidden>${esc(t(lang, 'scarica'))}</button>
      <button type="button" class="lab__bottone lab__bottone--fantasma" data-condividi hidden>${esc(t(lang, 'condividi'))}</button>
    </div>
    <video class="lab-clip__video" data-video controls loop muted playsinline hidden></video>
    <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const canvas = el.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const btn = el.querySelector('[data-registra]')
    const btnScarica = el.querySelector('[data-scarica]')
    const btnCondividi = el.querySelector('[data-condividi]')
    const video = el.querySelector('[data-video]')
    const recLabel = el.querySelector('[data-rec]')
    const tempoLabel = el.querySelector('[data-tempo]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let corrente = api.adesso()
    let colori = [api.tema().p, api.tema().a, '#5b2c7a', '#f5ffcc', '#2b1438']
    let raf = 0, attivo = true, vivo = true, registratore = null, stream = null, blob = null, url = null
    let registrando = false, seq = 0, fineTimer = 0, tickTimer = 0, immagine = null, imgKey = ''

    async function colora(a) {
      const mio = ++seq
      const p = await api.palette(a.track?.img, colori)
      if (mio !== seq || !vivo) return
      colori = p
      const k = a.track?.img || ''
      if (k && k !== imgKey) {
        imgKey = k
        const im = new Image()
        im.onload = () => { immagine = im }
        im.onerror = () => { immagine = null }
        im.src = api.immagine(k)
      } else if (!k) { immagine = null; imgKey = '' }
    }

    function dipingi(tempo) {
      const w = 720, h = 720
      const fondo = api.mescola(colori[3] || '#2b1438', '#08060c', 0.72)
      ctx.fillStyle = fondo; ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 5; i++) {
        const f = tempo * (0.00008 + i * 0.00002) + i * 1.7
        const x = w * (0.5 + 0.36 * Math.sin(f))
        const y = h * (0.5 + 0.34 * Math.cos(f * 0.9 + i))
        const r = 260 + 60 * Math.sin(f * 0.7 + i)
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        const c = colori[i % colori.length]
        g.addColorStop(0, c + 'aa'); g.addColorStop(1, c + '00')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      const velo = ctx.createLinearGradient(0, 0, 0, h)
      velo.addColorStop(0, 'rgba(8,6,12,.25)'); velo.addColorStop(0.55, 'rgba(8,6,12,.05)'); velo.addColorStop(1, 'rgba(8,6,12,.82)')
      ctx.fillStyle = velo; ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 90, 0); ctx.lineTo(i * 90, h); ctx.stroke() }
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, i * 90); ctx.lineTo(w, i * 90); ctx.stroke() }

      ctx.fillStyle = 'rgba(255,255,255,.66)'
      ctx.font = '700 18px Arial, Helvetica, sans-serif'
      ctx.fillText('PZKKO · STUDIO', 48, 66)
      ctx.textAlign = 'right'; ctx.fillText(ora(Date.now(), lang), 672, 66); ctx.textAlign = 'left'
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(54, 104, 7, 0, Math.PI * 2); ctx.fillStyle = corrente.online ? colori[0] : '#777'; ctx.fill()

      const m = corrente.track
      if (m) {
        if (immagine) {
          ctx.save()
          ctx.beginPath(); ctx.roundRect(468, 142, 204, 204, 18); ctx.clip()
          ctx.drawImage(immagine, 468, 142, 204, 204)
          ctx.restore()
          ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(468, 142, 204, 204, 18); ctx.stroke()
        }
        ctx.fillStyle = 'rgba(255,255,255,.55)'
        ctx.font = '700 15px Arial, Helvetica, sans-serif'
        ctx.fillText(t(lang, 'ascolta'), 48, 190)
        ctx.fillStyle = '#fff'
        ctx.font = '800 54px Arial, Helvetica, sans-serif'
        const rr = righe(ctx, m.titolo, 390, 3)
        rr.forEach((r, i) => ctx.fillText(r, 48, 256 + i * 58))
        ctx.fillStyle = colori[0]
        ctx.font = '700 28px Arial, Helvetica, sans-serif'
        ctx.fillText(m.artista, 48, 256 + rr.length * 58 + 8)
        if (m.album) {
          ctx.fillStyle = 'rgba(255,255,255,.6)'
          ctx.font = '400 20px Arial, Helvetica, sans-serif'
          ctx.fillText(m.album, 48, 256 + rr.length * 58 + 42)
        }
        if (m.inizio && m.fine && m.fine > m.inizio) {
          const pc = Math.min(1, Math.max(0, (Date.now() - m.inizio) / (m.fine - m.inizio)))
          ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(48, 560, 420, 7, 4); ctx.fill()
          ctx.fillStyle = colori[0]; ctx.beginPath(); ctx.roundRect(48, 560, 420 * pc, 7, 4); ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '400 18px Arial, Helvetica, sans-serif'
          ctx.fillText(ferma(Math.max(0, Date.now() - m.inizio)), 48, 592)
          ctx.textAlign = 'right'; ctx.fillText(ferma(m.fine - m.inizio), 468, 592); ctx.textAlign = 'left'
        }
      } else {
        ctx.fillStyle = '#fff'
        ctx.font = '800 112px Arial, Helvetica, sans-serif'
        ctx.fillText('pzkko', 42, 330)
        ctx.fillStyle = colori[0]
        ctx.font = '700 26px Arial, Helvetica, sans-serif'
        ctx.fillText(`${t(lang, 'adesso')} · ${corrente.status === 'online' ? t(lang, 'online') : corrente.status === 'idle' ? t(lang, 'pausa') : t(lang, 'offline')}`, 48, 380)
      }
      ctx.fillStyle = 'rgba(255,255,255,.48)'
      ctx.font = '400 18px Arial, Helvetica, sans-serif'
      ctx.fillText(`${dataIt(Date.now(), lang)} · pzkko.it/#studio`, 48, 660)
      if (registrando) {
        ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(620, 64, 7, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '700 16px Arial, Helvetica, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('REC', 604, 70); ctx.textAlign = 'left'
      }
    }
    function ciclo() {
      if (!vivo) return
      if (!attivo && !registrando) { raf = 0; return }
      dipingi(performance.now())
      raf = requestAnimationFrame(ciclo)
    }
    function accendi() { if (!raf) raf = requestAnimationFrame(ciclo) }

    function mime() {
      if (!window.MediaRecorder) return ''
      return MIME.find((m) => MediaRecorder.isTypeSupported?.(m)) || ''
    }
    async function registra() {
      if (!supportato || registrando) return
      try {
        registrando = true
        recLabel.hidden = false
        btn.disabled = true
        btn.textContent = `● ${t(lang, 'registrando')}`
        api.stato(stato, t(lang, 'registrando'), '')
        accendi()
        stream = canvas.captureStream(30)
        const tipo = mime()
        registratore = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined)
        const pezzi = []
        registratore.ondataavailable = (e) => { if (e.data?.size) pezzi.push(e.data) }
        registratore.onstop = () => {
          if (!vivo) return
          registrando = false
          recLabel.hidden = true
          btn.disabled = false
          btn.textContent = `● ${t(lang, 'registra')}`
          try { stream?.getTracks().forEach((x) => x.stop()) } catch {}
          stream = null
          const tipo2 = registratore?.mimeType || tipo || 'video/webm'
          blob = new Blob(pezzi, { type: tipo2 })
          if (url) URL.revokeObjectURL(url)
          url = URL.createObjectURL(blob)
          video.src = url
          video.hidden = false
          btnScarica.hidden = false
          btnCondividi.hidden = false
          api.stato(stato, t(lang, 'fatto'), 'ok')
          tempoLabel.textContent = ''
          clearInterval(tickTimer)
        }
        registratore.start(200)
        const inizio = Date.now()
        fineTimer = window.setTimeout(() => { try { registratore?.stop() } catch {} }, 6000)
        tickTimer = setInterval(() => {
          const s = Math.max(0, 6 - Math.floor((Date.now() - inizio) / 1000))
          tempoLabel.textContent = `${s}s`
        }, 200)
      } catch (e) {
        console.error(e)
        registrando = false
        btn.disabled = false
        btn.textContent = `● ${t(lang, 'registra')}`
        recLabel.hidden = true
        api.stato(stato, t(lang, 'errore'), 'no')
      }
    }
    btn.addEventListener('click', registra)
    btnScarica.addEventListener('click', () => { if (blob) { const est = (blob.type.includes('mp4') ? 'mp4' : 'webm'); api.scarica(blob, `pzkko-clip.${est}`) } })
    btnCondividi.addEventListener('click', async () => {
      if (!blob) return
      const est = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `pzkko-clip.${est}`, { type: blob.type || 'video/webm' })
      try {
        if (navigator.canShare?.({ files: [file] }) && navigator.share) await navigator.share({ files: [file], title: 'pzkko', text: 'pzkko.it/#studio' })
        else api.scarica(blob, `pzkko-clip.${est}`)
      } catch (e) { if (e?.name !== 'AbortError') console.error(e) }
    })

    api.stato(stato, supportato ? t(lang, 'pronta') : t(lang, 'no'), supportato ? 'ok' : 'no')
    const togli = api.onAdesso((a) => { corrente = a; colora(a); accendi() })
    api.quandoVisibile(el, (v) => { attivo = v; if (v) accendi(); if (!v && !registrando) { cancelAnimationFrame(raf); raf = 0 } })
    colora(corrente); accendi()
    return () => {
      vivo = false
      togli(); clearTimeout(fineTimer); clearInterval(tickTimer); cancelAnimationFrame(raf); raf = 0
      try { if (registratore?.state !== 'inactive') registratore?.stop() } catch {}
      try { stream?.getTracks().forEach((x) => x.stop()) } catch {}
      if (url) URL.revokeObjectURL(url)
    }
  },
}
