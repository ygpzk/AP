// 02 · Quadro vivo. I cinque colori veri della copertina diventano un quadro
// che si muove piano: niente immagini di terzi, si legge la copertina dal ponte
// della vetrina, si guarda dentro e si disegna. Si ferma quando non si vede.
import { esc } from '../utils.js'

const T = {
  it: {
    pronto: 'dal vivo',
    attesa: 'aspetto una copertina',
    nota: 'I colori sono presi dalla copertina del brano; il disegno è generato qui, pixel per pixel.',
  },
  en: {
    pronto: 'live',
    attesa: 'waiting for a cover',
    nota: 'The colours come from the track cover; the drawing is generated here, pixel by pixel.',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]

export default {
  id: 'quadro',
  titolo: { it: 'Quadro vivo', en: 'Living painting' },
  testo: {
    it: 'La copertina di Spotify diventa cinque colori, e i cinque colori diventano un quadro che respira. Cambia brano, cambia quadro.',
    en: 'The Spotify cover becomes five colours, and the five colours become a painting that breathes. Change track, change painting.',
  },
  tecnologie: ['Canvas 2D', 'Canvas color extraction', 'ResizeObserver'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-quadro">
      <canvas class="lab-quadro__tela" aria-label="${esc(t(lang, 'nota'))}"></canvas>
      <div class="lab-quadro__pie"><span data-titolo>—</span><span class="lab-quadro__palette" data-palette aria-hidden="true"></span></div>
    </div>
    <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const canvas = el.querySelector('canvas')
    const titolo = el.querySelector('[data-titolo]')
    const paletteEl = el.querySelector('[data-palette]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const tema = api.tema()
    let colori = [tema.p, tema.a, '#5b2c7a', '#f5ffcc', '#2b1438']
    let a = api.adesso()
    let raf = 0, attivo = true, giro = 0, seq = 0, inizio = performance.now()

    function dipingi() {
      const w = canvas.clientWidth || 320, h = canvas.clientHeight || 240
      const ctx = canvas.getContext('2d')
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const time = (performance.now() - inizio) / 1000
      const fondale = api.mescola(colori[4] || '#2b1438', '#08060c', 0.55)
      ctx.fillStyle = fondale
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 7; i++) {
        const fase = time * (0.07 + i * 0.008) + i * 1.73
        const x = w * (0.5 + 0.36 * Math.sin(fase))
        const y = h * (0.5 + 0.34 * Math.cos(fase * 0.83 + i * 1.2))
        const r = Math.min(w, h) * (0.42 + 0.12 * Math.sin(fase * 0.6 + i))
        const c = colori[i % colori.length]
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
        grad.addColorStop(0, c + 'aa')
        grad.addColorStop(0.45, c + '44')
        grad.addColorStop(1, c + '00')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      // il velo scuro in basso, così la didascalia resta leggibile
      const velo = ctx.createLinearGradient(0, h * 0.55, 0, h)
      velo.addColorStop(0, 'rgba(8,6,12,0)')
      velo.addColorStop(1, 'rgba(8,6,12,.55)')
      ctx.fillStyle = velo
      ctx.fillRect(0, 0, w, h)
      if (a.track) {
        ctx.fillStyle = 'rgba(255,255,255,.9)'
        ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText('♪ ' + a.track.titolo, 14, h - 16)
      }
    }

    function ciclo() {
      if (!attivo) { raf = 0; return }
      giro++
      if (giro % 2 === 0) dipingi()
      raf = requestAnimationFrame(ciclo)
    }

    function accendi() {
      if (raf || api.reduced()) return
      raf = requestAnimationFrame(ciclo)
    }
    function spegni() { cancelAnimationFrame(raf); raf = 0 }

    function swatches() {
      paletteEl.innerHTML = colori.map((c) => `<i style="background:${esc(c)}"></i>`).join('')
    }

    async function colora(nuovo, traccia) {
      const mio = ++seq
      const p = await api.palette(traccia?.img, [tema.p, tema.a, '#5b2c7a', '#f5ffcc', '#2b1438'])
      if (mio !== seq) return
      colori = p
      swatches()
      titolo.textContent = traccia ? `${traccia.titolo} · ${traccia.artista}` : 'pzkko'
      api.stato(stato, traccia ? t(lang, 'pronto') : t(lang, 'attesa'), traccia ? 'ok' : '')
      dipingi()
    }

    const togli = api.onAdesso((x) => {
      const prima = a.track ? `${a.track.titolo}|${a.track.artista}|${a.track.img}` : ''
      const dopo = x.track ? `${x.track.titolo}|${x.track.artista}|${x.track.img}` : ''
      a = x
      if (prima !== dopo) colora(x.track, x.track)
      else if (!x.track && prima) colora(null, null)
      if (api.reduced()) dipingi()
    })

    const ro = new ResizeObserver(() => { if (api.reduced()) dipingi() })
    ro.observe(canvas)
    api.quandoVisibile(el, (v) => { attivo = v; if (v) accendi(); else spegni() })
    colora(a.track, a.track)
    dipingi()
    accendi()
    return () => { togli(); spegni(); ro.disconnect() }
  },
}
