// 04 · Radio pzk. Non è il brano di Spotify: è una traduzione in 8 bit generata
// dal vivo. Il seme viene dal brano (o dallo stato), e da lì nascono scala, tempo
// e timbro. Web Audio, Media Session e un analizzatore per le barre.
import { esc, semi } from '../utils.js'

const T = {
  it: {
    accendi: 'Accendi',
    spegni: 'Spegni',
    nota: 'Non è il brano di Spotify: è una traduzione generata qui, nota per nota. Il seme cambia col brano (o con lo stato).',
    volume: 'Volume',
    pronta: 'pronta',
    no: 'Web Audio non disponibile',
    titolo: 'Radio pzk',
    artista: 'generata dal vivo',
    album: 'pzkko.it/#studio',
    ferma: 'in pausa',
  },
  en: {
    accendi: 'Turn on',
    spegni: 'Turn off',
    nota: 'This is not the Spotify track: it is a translation generated here, note by note. The seed changes with the track (or the status).',
    volume: 'Volume',
    pronta: 'ready',
    no: 'Web Audio not available',
    titolo: 'Radio pzk',
    artista: 'generated live',
    album: 'pzkko.it/#studio',
    ferma: 'paused',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]
const MODI = [[0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10], [0, 1, 3, 5, 7, 8, 10], [0, 2, 4, 7, 9], [0, 3, 5, 7, 10]]
const TIPI = ['triangle', 'square', 'sawtooth', 'sine']

export default {
  id: 'radio',
  titolo: { it: 'Radio pzk', en: 'Radio pzk' },
  testo: {
    it: 'Il brano che sta suonando diventa un seme: da lì parte una piccola radio in 8 bit, generata nota per nota nel browser. Con le barre che ballano.',
    en: 'The track that is playing becomes a seed: from there a little 8-bit radio starts, generated note by note in the browser. With dancing bars.',
  },
  tecnologie: ['Web Audio', 'Media Session', 'AnalyserNode'],
  monta(el, api) {
    const lang = api.lang
    const supportato = !!(window.AudioContext || window.webkitAudioContext)
    el.innerHTML = `<div class="lab-radio">
      <canvas class="lab-radio__barre" aria-hidden="true"></canvas>
      <div class="lab-radio__controlli">
        <button type="button" class="lab__bottone lab-radio__play" data-play aria-pressed="false" ${supportato ? '' : 'disabled'}>▶ ${esc(t(lang, 'accendi'))}</button>
        <label class="lab-radio__volume"><span class="sr">${esc(t(lang, 'volume'))}</span><input type="range" min="0" max="100" value="55" data-volume></label>
        <span class="lab-radio__brano" data-brano>—</span>
      </div>
    </div><p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const canvas = el.querySelector('canvas')
    const bottone = el.querySelector('[data-play]')
    const volume = el.querySelector('[data-volume]')
    const brano = el.querySelector('[data-brano]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let ac = null, master = null, analizzatore = null, timer = 0, raf = 0, playing = false, vivo = true
    let passo = 0, prossimo = 0, seed = semi('pzkko'), bpm = 88, radice = 220, scala = MODI[0], timbro = 'triangle'
    let corrente = api.adesso()
    let volumeV = 55
    try { volumeV = Number(localStorage.getItem('pzkko-lab-radio') || 55) } catch {}
    if (!Number.isFinite(volumeV)) volumeV = 55
    volume.value = volumeV
    api.stato(stato, supportato ? t(lang, 'pronta') : t(lang, 'no'), supportato ? 'ok' : 'no')

    function creaRumore() {
      const n = Math.floor(ac.sampleRate * 0.05)
      const b = ac.createBuffer(1, n, ac.sampleRate)
      const d = b.getChannelData(0)
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
      return b
    }
    let rumore = null

    function imposta(x) {
      const chiave = x.track ? `${x.track.titolo}|${x.track.artista}` : `${x.status}|${x.luogo || ''}`
      const nuovo = semi(chiave)
      if (nuovo !== seed) {
        seed = nuovo
        bpm = 74 + (seed % 35)
        radice = 196 + (seed % 5) * 12
        scala = MODI[seed % MODI.length]
        timbro = TIPI[(seed >>> 3) % TIPI.length]
      }
      brano.textContent = x.track ? `${t(lang, 'titolo')} · ${x.track.titolo}` : `${t(lang, 'titolo')} · ${x.status}`
      impostaMedia(x)
    }

    function impostaMedia(x) {
      if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: x.track ? `${t(lang, 'titolo')} · ${x.track.titolo}` : t(lang, 'titolo'),
          artist: t(lang, 'artista'),
          album: t(lang, 'album'),
          artwork: [{ src: new URL('/apple-touch-icon.png', location.href).href, sizes: '180x180', type: 'image/png' }],
        })
      } catch {}
    }

    function nota(n, quando, durata, guadagno, tipo = timbro) {
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = tipo
      o.frequency.value = n
      g.gain.setValueAtTime(0.0001, quando)
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, guadagno), quando + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, quando + durata)
      o.connect(g).connect(master)
      o.start(quando)
      o.stop(quando + durata + 0.02)
    }
    function battito(quando, guadagno = 0.016) {
      if (!rumore) return
      const s = ac.createBufferSource(), g = ac.createGain(), hp = ac.createBiquadFilter()
      s.buffer = rumore; hp.type = 'highpass'; hp.frequency.value = 5000
      g.gain.setValueAtTime(guadagno, quando)
      g.gain.exponentialRampToValueAtTime(0.0001, quando + 0.035)
      s.connect(hp).connect(g).connect(master)
      s.start(quando); s.stop(quando + 0.05)
    }
    const hash = (n) => {
      let x = (seed ^ Math.imul(n + 1, 2654435761)) >>> 0
      x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15
      return (x >>> 0) / 4294967296
    }
    function programma(p, quando) {
      const h = hash(p)
      if (p % 8 === 0) nota(radice / 2, quando, 0.55, 0.055, 'sine')
      if (p % 2 === 0 && h > 0.22) {
        const giro = (p >> 3) % 2
        const idx = (p + Math.floor(h * scala.length)) % scala.length
        const n = radice * 2 ** ((scala[idx] + giro * 12) / 12)
        nota(n, quando, 0.16 + h * 0.12, 0.035, timbro)
      }
      if (p % 4 === 2) battito(quando)
      if (p % 16 === 15 && h > 0.6) nota(radice * 2, quando, 0.3, 0.025, 'sine')
    }
    function tick() {
      if (!playing || !ac) return
      if (prossimo < ac.currentTime) prossimo = ac.currentTime + 0.05
      while (prossimo < ac.currentTime + 0.16) {
        programma(passo, prossimo)
        passo++
        prossimo += 60 / bpm / 2
      }
    }
    function disegna() {
      const w = canvas.clientWidth || 300, h = canvas.clientHeight || 90
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      }
      const c = canvas.getContext('2d')
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, w, h)
      const s = getComputedStyle(canvas)
      const p = s.getPropertyValue('--p').trim() || '#ccff00'
      const a = s.getPropertyValue('--a').trim() || '#9d00ff'
      const n = 28, larg = Math.max(2, w / n - 3)
      let dati = null
      if (analizzatore && playing) { dati = new Uint8Array(analizzatore.frequencyBinCount); analizzatore.getByteFrequencyData(dati) }
      for (let i = 0; i < n; i++) {
        const v = dati ? (dati[Math.floor((i / n) * dati.length)] || 0) / 255 : 0.06 + 0.03 * Math.sin(performance.now() / 700 + i)
        const alt = Math.max(2, v * (h - 12))
        c.fillStyle = i % 2 ? a : p
        c.globalAlpha = playing ? 0.55 + v * 0.45 : 0.28
        c.fillRect(i * (larg + 3), (h - alt) / 2, larg, alt)
      }
      c.globalAlpha = 1
    }
    function ciclo() {
      if (!vivo) return
      if (playing) { disegna(); raf = requestAnimationFrame(ciclo) }
      else { disegna(); raf = 0 }
    }
    function accendi() {
      if (!supportato) return
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext
        ac = new C()
        master = ac.createGain()
        analizzatore = ac.createAnalyser()
        analizzatore.fftSize = 64
        analizzatore.smoothingTimeConstant = 0.78
        master.connect(analizzatore)
        analizzatore.connect(ac.destination)
        master.gain.value = (volumeV / 100) ** 2 * 0.55
        rumore = creaRumore()
      }
      ac.resume?.()
      master.gain.cancelScheduledValues(ac.currentTime)
      master.gain.setTargetAtTime(Math.max(0.0001, (volumeV / 100) ** 2 * 0.55), ac.currentTime, 0.02)
      playing = true
      passo = 0
      prossimo = ac.currentTime + 0.08
      clearInterval(timer)
      timer = setInterval(tick, 25)
      bottone.textContent = `■ ${t(lang, 'spegni')}`
      bottone.setAttribute('aria-pressed', 'true')
      api.stato(stato, t(lang, 'titolo'), 'ok')
      impostaMedia(corrente)
      cancellaRaf(); raf = requestAnimationFrame(ciclo)
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'playing'
          navigator.mediaSession.setActionHandler('pause', spegni)
          navigator.mediaSession.setActionHandler('play', accendi)
        } catch {}
      }
    }
    function spegni() {
      playing = false
      clearInterval(timer)
      if (ac) master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03)
      bottone.textContent = `▶ ${t(lang, 'accendi')}`
      bottone.setAttribute('aria-pressed', 'false')
      api.stato(stato, t(lang, 'ferma'), '')
      if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused' } catch {} }
    }
    function cancellaRaf() { cancelAnimationFrame(raf); raf = 0 }

    bottone.addEventListener('click', () => { playing ? spegni() : accendi() })
    volume.addEventListener('input', () => {
      volumeV = Number(volume.value)
      try { localStorage.setItem('pzkko-lab-radio', String(volumeV)) } catch {}
      if (ac && master) master.gain.setTargetAtTime(Math.max(0.0001, (volumeV / 100) ** 2 * 0.55), ac.currentTime, 0.02)
    })
    const togli = api.onAdesso((x) => { corrente = x; imposta(x) })
    const sveglia = () => { if (!document.hidden && !raf) { disegna(); if (playing) raf = requestAnimationFrame(ciclo) } }
    document.addEventListener('visibilitychange', sveglia)
    imposta(corrente)
    disegna()
    return () => {
      vivo = false
      togli(); clearInterval(timer); cancellaRaf()
      document.removeEventListener('visibilitychange', sveglia)
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.setActionHandler('play', null); navigator.mediaSession.setActionHandler('pause', null) } catch {}
      }
      try { ac?.close() } catch {}
      ac = null; master = null; analizzatore = null
    }
  },
}
