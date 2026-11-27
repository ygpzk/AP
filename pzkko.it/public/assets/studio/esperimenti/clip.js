// 10 · Clip viva. Sei secondi di sigla animata registrati dal canvas con
// MediaRecorder: si scaricano come WebM (o MP4, se il browser lo preferisce) e
// si possono mandare col foglio di condivisione. Niente server, niente ffmpeg.
//
// La scena (27.11.2026) è un manifesto risograph a due inchiostri presi dalla
// copertina che si anima in un giro perfetto di 6 s: la serranda del muro si
// alza, il titolo del brano cade parola per parola, la pallina del karaoke ci
// salta sopra, il vinile gira (tre giri esatti), la chiocciola col boombox
// attraversa lo schermo e si prende la multa dell'autovelox, poi la serranda
// torna giù con la firma «pzkko.it». Il primo fotogramma è uguale all'ultimo:
// la clip gira in loop senza scatti. Quando si registra, il giro riparte da zero.
// I dati sono quelli veri di api.adesso(); le battute sono battute.
import { esc, ferma, data as dataIt, ora, limita, caso } from '../utils.js'
import { rgbDi, luminanza, mescola } from '../colori.js'

const T = {
  it: {
    registra: 'Registra 6 secondi',
    ferma: 'Fermo…',
    fatto: 'fatto',
    pronta: 'pronta',
    no: 'MediaRecorder non disponibile',
    nota: 'La clip nasce dal canvas: sei secondi in loop, 720 × 720, muta. Il video resta nel browser finché non lo scarichi o lo mandi.',
    etichetta: 'La sigla animata di pzkko: un manifesto a due inchiostri con il brano, la chiocciola col boombox e le app aperte. È quello che finisce nella clip.',
    scarica: 'Scarica la clip',
    condividi: 'Condividi',
    registrando: 'registro…',
    pronti: 'pronti…',
    errore: 'Non riesco a registrare.',
    dida: 'tocca lo schermo: la chiocciola risponde',
    girata: 'girata alle',
    muta: 'muta: la musica canticchiala tu',
    canale: 'canale 10 · sigla',
    st: { online: 'in diretta', idle: 'in pausa', dnd: 'non disturbare', offline: 'replica' },
    karaoke: 'karaoke · la musica mettila tu',
    album: (x) => `dall'album «${x}»`,
    offTitolo: 'pzkko è fuori onda',
    offArtista: 'la chiocciola dorme',
    offAlbum: 'torniamo dopo la pubblicità',
    mutoFirma: '— pzkko, adesso',
    mutoArtista: 'niente musica: si lavora',
    mutoAlbum: 'silenzio in sala',
    primo: 'in primo piano:',
    fermo: 'stop · nessuna musica',
    fuori: 'fuori onda',
    inOnda: 'in onda',
    replica: 'replica',
    aperto: 'aperto sul pc:',
    gioca: 'gioca a',
    ufficio: 'in ufficio',
    giro: 'in giro per il mondo',
    sospese: 'trasmissioni sospese',
    multa: 'multata!',
    velox: 'autovelox: 0,03 km/h',
    regolare: '0 km/h: regolare',
    tornoSubito: 'torno subito',
    lato: 'lato A · 33 giri',
    sigla: 'sigla di 6 secondi',
    battute: ['piano, vado a 0,03 km/h', 'il boombox è in comodato d\'uso', 'non toccare, è arte', 'bis! bis!', 'questo pezzo lo conosco', 'la multa la paga il guscio', 'sono in tour, scusate'],
    sonno: ['zzz… richiama dopo', 'cinque minuti ancora', 'sogno insalata'],
  },
  en: {
    registra: 'Record 6 seconds',
    ferma: 'Stopping…',
    fatto: 'done',
    pronta: 'ready',
    no: 'MediaRecorder not available',
    nota: 'The clip is born from the canvas: six looping seconds, 720 × 720, silent. The video stays in the browser until you download or send it.',
    etichetta: 'The animated pzkko opening titles: a two-ink poster with the track, the snail with its boombox and the open apps. This is what ends up in the clip.',
    scarica: 'Download the clip',
    condividi: 'Share',
    registrando: 'recording…',
    pronti: 'get ready…',
    errore: 'I cannot record.',
    dida: 'tap the screen: the snail talks back',
    girata: 'shot at',
    muta: 'silent: hum the tune yourself',
    canale: 'channel 10 · opening',
    st: { online: 'on air', idle: 'on a break', dnd: 'do not disturb', offline: 'rerun' },
    karaoke: 'karaoke · bring your own music',
    album: (x) => `from the album “${x}”`,
    offTitolo: 'pzkko is off the air',
    offArtista: 'the snail is asleep',
    offAlbum: 'back after the break',
    mutoFirma: '— pzkko, right now',
    mutoArtista: 'no music: working',
    mutoAlbum: 'quiet on set',
    primo: 'in focus:',
    fermo: 'stop · nothing playing',
    fuori: 'off the air',
    inOnda: 'on air',
    replica: 'rerun',
    aperto: 'open on the pc:',
    gioca: 'playing',
    ufficio: 'at the office',
    giro: 'somewhere in the world',
    sospese: 'programmes suspended',
    multa: 'fined!',
    velox: 'speed camera: 0.03 km/h',
    regolare: '0 km/h: all good',
    tornoSubito: 'back soon',
    lato: 'side A · 33 rpm',
    sigla: '6-second opening titles',
    battute: ['easy, I do 0.03 km/h', 'the boombox is on loan', 'hands off, this is art', 'encore! encore!', 'I know this one', 'the shell pays the fine', 'on tour, sorry'],
    sonno: ['zzz… call back later', 'five more minutes', 'dreaming of lettuce'],
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]

const MIME = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']

// ── la scena ──
const L = 6000          // il giro: sei secondi esatti
const BATTITO = 500     // 120 bpm, dodici battiti per giro
const LATO = 720
const CARTA = '#f4ecda'
const GIALLO = '#ffd400'
const CAMERA = '#ffad33'
const RIPIEGO = ['#ff5b2e', '#1d5f86'] // arancio fluo e blu, come il manifesto del concerto
const F = {
  fa: '"Anton", Impact, "Arial Narrow", sans-serif',
  mk: '"Permanent Marker", "Comic Sans MS", cursive',
  mac: '"Special Elite", "Courier New", monospace',
  bit: '"8Bit", "Courier New", monospace',
}
const FONTI = ['400 100px "Anton"', '400 40px "Permanent Marker"', '400 20px "Special Elite"', '400 20px "8Bit"']

const fra = (x, a, b) => limita((x - a) / (b - a), 0, 1)
const esce = (x) => 1 - (1 - x) ** 3
const dentroFuori = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
const rimbalza = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2 }

function hslDi(hex) {
  const [r, g, b] = rgbDi(hex).map((v) => v / 255)
  const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2
  let h = 0, s = 0
  if (M !== m) {
    const d = M - m
    s = l > 0.5 ? d / (2 - M - m) : d / (M + m)
    h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}
function daHsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
}
const distanza = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) }

/** Due inchiostri da risograph dai colori della copertina: uno vivo (A) e uno scuro che gli stia contro (B). */
function inchiostri(cols) {
  const c = (cols || []).filter((x) => /^#[0-9a-f]{6}$/i.test(x)).map((x) => ({ x, h: hslDi(x) }))
  let A = null, meglio = -1
  for (const o of c) { const [, s, l] = o.h; const v = s * (1 - Math.abs(l - 0.5) * 1.3); if (v > meglio) { meglio = v; A = o } }
  if (!A || A.h[1] < 0.22) return RIPIEGO
  let B = null; meglio = -1
  for (const o of c) {
    if (o === A || o.h[1] < 0.15) continue
    const v = (distanza(o.h[0], A.h[0]) / 180) * 0.7 + o.h[1] * 0.3
    if (v > meglio) { meglio = v; B = o }
  }
  const ha = A.h[0]
  const giallo = ha > 40 && ha < 80
  const a = daHsl(ha, Math.max(0.74, A.h[1]), giallo ? 0.47 : 0.53)
  const hb = B && distanza(B.h[0], ha) > 50 ? B.h[0] : (ha + 180) % 360
  return [a, daHsl(hb, 0.62, 0.29)]
}

/** La carta: crema, macchie larghe e qualche fibra. Si fa una volta sola. */
function cartaPronta() {
  const c = document.createElement('canvas'); c.width = c.height = LATO
  const x = c.getContext('2d')
  x.fillStyle = CARTA; x.fillRect(0, 0, LATO, LATO)
  const r = caso(77)
  for (let i = 0; i < 26; i++) {
    const px = r() * LATO, py = r() * LATO, rr = 60 + r() * 200
    const g = x.createRadialGradient(px, py, 0, px, py, rr)
    const scuro = r() > 0.5
    g.addColorStop(0, scuro ? 'rgba(120,90,40,.05)' : 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g; x.fillRect(0, 0, LATO, LATO)
  }
  x.strokeStyle = 'rgba(90,70,40,.08)'; x.lineWidth = 1
  for (let i = 0; i < 160; i++) {
    const px = r() * LATO, py = r() * LATO, a = r() * Math.PI, l = 4 + r() * 12
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke()
  }
  const v = x.createRadialGradient(360, 360, 260, 360, 360, 560)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(80,55,20,.16)')
  x.fillStyle = v; x.fillRect(0, 0, LATO, LATO)
  return c
}

/** La grana del risograph: buchi di carta nell'inchiostro e puntini scuri. Una tessera che si ripete. */
function granaPronta() {
  const n = 256
  const c = document.createElement('canvas'); c.width = c.height = n
  const x = c.getContext('2d')
  const img = x.createImageData(n, n), d = img.data
  const r = caso(1312)
  const [pr, pg, pb] = rgbDi(CARTA)
  for (let i = 0; i < d.length; i += 4) {
    const v = r()
    if (v < 0.075) { d[i] = pr; d[i + 1] = pg; d[i + 2] = pb; d[i + 3] = 90 + r() * 140 }
    else if (v > 0.985) { d[i] = 40; d[i + 1] = 30; d[i + 2] = 20; d[i + 3] = 40 + r() * 50 }
  }
  x.putImageData(img, 0, 0)
  return c
}

export default {
  id: 'clip',
  titolo: { it: 'Clip viva', en: 'Living clip' },
  testo: {
    it: 'Sei secondi della scheda «Adesso» registrati dal canvas e pronti da mandare: una sigla in loop con il brano, la chiocciola e le app aperte, senza registrare lo schermo.',
    en: 'Six seconds of the “Now” card recorded from the canvas, ready to send: a looping opening with the track, the snail and the open apps, without screen recording.',
  },
  tecnologie: ['Canvas', 'MediaRecorder', 'Web Share'],
  monta(el, api) {
    const lang = api.lang
    const tx = (k) => t(lang, k)
    const supportato = !!window.MediaRecorder && !!HTMLCanvasElement.prototype.captureStream
    el.innerHTML = `<div class="lab-clip" data-stato="stby">
      <canvas class="lab-clip__tela" width="720" height="720" role="img" aria-label="${esc(tx('etichetta'))}"></canvas>
      <div class="lab-clip__velo" aria-hidden="true">
        <i class="lab-clip__ang lab-clip__ang--a"></i><i class="lab-clip__ang lab-clip__ang--b"></i><i class="lab-clip__ang lab-clip__ang--c"></i><i class="lab-clip__ang lab-clip__ang--d"></i>
        <span class="lab-clip__sx"><span data-rec hidden>REC</span><span class="lab-clip__stby" data-stby>STBY</span></span>
        <span class="lab-clip__dx"><span data-tempo>00:00:00:00</span><i class="lab-clip__batt"></i></span>
        <span class="lab-clip__conto" data-conto hidden></span>
        <span class="lab-clip__barra"><i data-barra></i></span>
        <span class="lab-clip__fmt">720 · 30p · 6s</span>
      </div>
      <span class="lab-clip__marca" aria-hidden="true">pzk·cam <b>HD 720</b></span>
      <span class="lab-clip__spia" aria-hidden="true"></span>
    </div>
    <p class="lab-clip__dida">${esc(tx('dida'))}</p>
    <div class="lab__azioni">
      <button type="button" class="lab__bottone" data-registra ${supportato ? '' : 'disabled'}>● ${esc(tx('registra'))}</button>
      <button type="button" class="lab__bottone lab__bottone--fantasma" data-scarica hidden>${esc(tx('scarica'))}</button>
      <button type="button" class="lab__bottone lab__bottone--fantasma" data-condividi hidden>${esc(tx('condividi'))}</button>
    </div>
    <figure class="lab-clip__foto" data-foto hidden>
      <video class="lab-clip__video" data-video controls loop muted playsinline></video>
      <figcaption class="lab-clip__didafoto" data-didafoto></figcaption>
    </figure>
    <p class="lab__nota">${esc(tx('nota'))}</p>`
    const scatola = el.querySelector('.lab-clip')
    const canvas = el.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const btn = el.querySelector('[data-registra]')
    const btnScarica = el.querySelector('[data-scarica]')
    const btnCondividi = el.querySelector('[data-condividi]')
    const video = el.querySelector('[data-video]')
    const foto = el.querySelector('[data-foto]')
    const didaFoto = el.querySelector('[data-didafoto]')
    const recLabel = el.querySelector('[data-rec]')
    const stbyLabel = el.querySelector('[data-stby]')
    const tempoLabel = el.querySelector('[data-tempo]')
    const contoLabel = el.querySelector('[data-conto]')
    const barra = el.querySelector('[data-barra]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let corrente = api.adesso()
    let colori = [api.tema().p, api.tema().a, '#5b2c7a', '#f5ffcc', '#2b1438']
    let inkA = RIPIEGO[0], inkB = RIPIEGO[1], inkTesto = RIPIEGO[0]
    let raf = 0, attivo = true, vivo = true, registratore = null, stream = null, blob = null, url = null
    let registrando = false, contando = false, seq = 0, fineTimer = 0, tickTimer = 0, contoTimer = 0, immagine = null, imgKey = ''
    let origine = performance.now(), recInizio = 0, ultimoDisegno = 0, fontiPronti = false
    let parla = null // { fino, testo, da }
    // per le foto di prova: ?clipt=2500 ferma il giro a quell'istante
    const provaT = (() => { const v = new URLSearchParams(location.search).get('clipt'); return v !== null && v !== '' && isFinite(+v) ? limita(+v, 0, L - 1) : null })()
    let lay = null
    const carta = cartaPronta()
    const grana = ctx.createPattern(granaPronta(), 'repeat')
    const rnd = caso(2611)
    const coriandoli = Array.from({ length: 38 }, () => ({
      t0: 1700 + rnd() * 2500, dur: 1300 + rnd() * 900, x: rnd() * LATO, dx: (rnd() - 0.5) * 120,
      w: 10 + rnd() * 10, h: 5 + rnd() * 5, giro: rnd() * 6, vg: (rnd() - 0.5) * 14, c: Math.floor(rnd() * 3),
    }))

    // ── i dati ──
    async function colora(a) {
      const mio = ++seq
      const p = await api.palette(a.track?.img, colori)
      if (mio !== seq || !vivo) return
      colori = p
      ;[inkA, inkB] = a.track?.img ? inchiostri(p) : RIPIEGO
      inkTesto = luminanza(inkA) > 0.36 ? inkB : inkA
      const k = a.track?.img || ''
      if (k && k !== imgKey) {
        imgKey = k
        const im = new Image()
        im.onload = () => { if (vivo) { immagine = im; ridisegna() } }
        im.onerror = () => { immagine = null }
        im.src = api.immagine(k)
      } else if (!k) { immagine = null; imgKey = '' }
      ridisegna()
    }

    function avvolgi(parole, largo) {
      const out = []
      let riga = []
      for (const p of parole) {
        const prova = [...riga, p].join(' ')
        if (riga.length && ctx.measureText(prova).width > largo) { out.push(riga); riga = [p] } else riga.push(p)
      }
      if (riga.length) out.push(riga)
      return out
    }
    function taglia(testo, largo) {
      let s = String(testo || '')
      if (ctx.measureText(s).width <= largo) return s
      while (s.length > 1 && ctx.measureText(s + '…').width > largo) s = s.slice(0, -1)
      return s.trimEnd() + '…'
    }

    /** Dove va ogni cosa: si rifà quando cambiano i dati o arrivano i font. */
    function impagina() {
      const a = corrente
      const m = a.track
      const modo = m ? 'musica' : a.online ? 'muto' : 'off'
      const apps = (a.apps || []).map((x) => x?.n).filter(Boolean)
      const primo = (a.apps || []).find((x) => x?.su)?.n || apps[0] || ''
      const custom = a.custom?.state || ''
      let titolo, artista, album
      if (modo === 'musica') { titolo = m.titolo || '…'; artista = m.artista || ''; album = m.album ? tx('album')(m.album) : '' }
      else if (modo === 'off') { titolo = tx('offTitolo'); artista = tx('offArtista'); album = tx('offAlbum') }
      else { titolo = custom || primo || 'pzkko'; artista = custom ? tx('mutoFirma') : tx('mutoArtista'); album = primo && primo !== titolo ? `${tx('primo')} ${primo}` : tx('mutoAlbum') }

      // il titolo: Anton, il più grande che ci sta in tre righe
      const largo = 404, alto = 214, cima = 104
      let parole = String(titolo).toLowerCase().split(/\s+/).filter(Boolean)
      let size = 40, righeT = null
      for (let s = 120; s >= 40; s -= 4) {
        ctx.font = `400 ${s}px ${F.fa}`
        const rr = avvolgi(parole, largo)
        if (rr.length <= 3 && rr.length * s * 0.93 <= alto && rr.every((r) => ctx.measureText(r.join(' ')).width <= largo)) { size = s; righeT = rr; break }
      }
      ctx.font = `400 ${size}px ${F.fa}`
      if (!righeT) {
        righeT = avvolgi(parole, largo).slice(0, 3)
        righeT = righeT.map((r) => r.map((p) => taglia(p, largo)))
        const ultima = righeT[righeT.length - 1]
        while (ultima.length > 1 && ctx.measureText(ultima.join(' ') + '…').width > largo) ultima.pop()
        if (righeT.flat().length < parole.length) ultima[ultima.length - 1] += '…'
      }
      const asc = ctx.measureText('hkl').actualBoundingBoxAscent || size * 0.8
      const lh = size * 0.93
      const spazio = ctx.measureText(' ').width
      const voci = []
      righeT.forEach((r, i) => {
        let x = 36
        const y = cima + asc + i * lh
        for (const p of r) { const w = ctx.measureText(p).width; voci.push({ s: p, x, y, w, i: voci.length }); x += w + spazio }
      })
      const fondoTitolo = cima + asc + (righeT.length - 1) * lh

      ctx.font = `400 32px ${F.mk}`
      let sizeArt = 32
      while (sizeArt > 20 && ctx.measureText(artista).width > 430) { sizeArt -= 2; ctx.font = `400 ${sizeArt}px ${F.mk}` }
      const art = taglia(artista, 430)
      const yArt = fondoTitolo + 44
      ctx.font = `400 17px ${F.mac}`
      const alb = taglia(album, 400)
      const yAlb = yArt + 30
      const yNastro = Math.min(446, (alb ? yAlb : yArt) + 34)

      // il nastro che scorre in basso
      const pezzi = []
      if (modo === 'musica') pezzi.push(`♪ ${m.titolo}${m.artista ? ` — ${m.artista}` : ''}`)
      if (modo === 'off') pezzi.push(tx('sospese'), tx('offArtista'))
      if (custom && modo !== 'muto') pezzi.push(`«${custom}»`)
      if (a.gioco?.name) pezzi.push(`${tx('gioca')} ${a.gioco.name}`)
      if (apps.length) pezzi.push(`${tx('aperto')} ${apps.slice(0, 6).join(', ')}`)
      if (a.luogo === 'ufficio') pezzi.push(tx('ufficio'))
      else if (a.luogo === 'giro') pezzi.push(tx('giro'))
      const testoNastro = pezzi.join('   ●   ') + '   ●   '
      ctx.font = `400 21px ${F.mac}`
      const wNastro = Math.max(200, ctx.measureText(testoNastro).width)
      const giri = Math.max(1, Math.round(640 / wNastro))

      lay = { modo, voci, size, art, sizeArt, yArt, alb, yAlb, yNastro, testoNastro, wNastro, giri, status: a.status in T.it.st ? a.status : 'offline' }
    }

    // ── i pezzi della scena ──
    function inchiostro(fn) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; fn(); ctx.restore() }

    function timbro(x, y, rot, testo, colore, size, k = 1) {
      if (k <= 0) return
      ctx.save()
      ctx.translate(x, y); ctx.rotate(rot)
      const s = 1 + (1 - esce(k)) * 0.7
      ctx.scale(s, s)
      ctx.globalAlpha = Math.min(1, k * 1.6)
      ctx.globalCompositeOperation = 'multiply'
      ctx.font = `400 ${size}px ${F.fa}`
      try { ctx.letterSpacing = '2px' } catch {}
      const w = ctx.measureText(testo).width + 22, h = size + 14
      ctx.strokeStyle = colore; ctx.fillStyle = colore
      ctx.lineWidth = 3.2
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.stroke()
      ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4); ctx.stroke()
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(testo, 0, 2)
      try { ctx.letterSpacing = '0px' } catch {}
      ctx.restore()
    }

    function testata(tl, pulse) {
      ctx.textBaseline = 'alphabetic'
      inchiostro(() => {
        ctx.font = `400 30px ${F.fa}`
        ctx.fillStyle = inkA; ctx.fillText('pzkko tv', 34, 50)
        ctx.fillStyle = inkB; ctx.fillText('pzkko tv', 36, 52)
        const w = ctx.measureText('pzkko tv').width
        ctx.font = `400 15px ${F.mac}`
        ctx.fillStyle = inkB
        ctx.fillText(tx('canale'), 36 + w + 14, 50)
        ctx.fillRect(34, 62, 652, 2)
        ctx.fillRect(34, 66, 652, 1)
      })
      const k = fra(tl, 900, 1150)
      const st = tx('st')[lay.status].toUpperCase()
      timbro(604, 38, -0.07, st, lay.status === 'offline' ? inkB : inkA, 21, k)
      if (k >= 1 && lay.status === 'online') {
        // il bollino «in diretta» che pulsa col battito (meno di 3 volte al secondo)
        ctx.save(); ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = inkA; ctx.globalAlpha = 0.55 + 0.45 * pulse
        ctx.beginPath(); ctx.arc(510, 38, 5 + pulse * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
      if (lay.modo === 'musica') {
        const kk = fra(tl, 1900, 2200)
        if (kk > 0) {
          ctx.save(); ctx.globalAlpha = kk
          ctx.translate(36, 92); ctx.rotate(-0.02)
          ctx.font = `400 15px ${F.mk}`
          ctx.fillStyle = inkTesto
          ctx.fillText(tx('karaoke'), 0, 0)
          ctx.restore()
        }
      }
    }

    function titolo(tl, pulse) {
      const n = lay.voci.length
      const inizioK = 2000, fineK = 5000, passo = (fineK - inizioK) / Math.max(1, n)
      const tutte = fra(tl, 700 + n * 110 + 420, 700 + n * 110 + 600)
      ctx.font = `400 ${lay.size}px ${F.fa}`
      ctx.textBaseline = 'alphabetic'
      const boll = (Math.floor(tl / 250) % 3) - 1 // il registro che balla un poco, quattro volte al secondo
      for (const v of lay.voci) {
        const k = fra(tl, 700 + v.i * 110, 700 + v.i * 110 + 440)
        if (k <= 0) continue
        const dy = (1 - rimbalza(k)) * -150
        const rot = (1 - k) * 0.35 * (v.i % 2 ? 1 : -1)
        const s = 1 + 0.022 * pulse * tutte
        ctx.save()
        ctx.translate(v.x + v.w / 2, v.y + dy)
        ctx.rotate(rot); ctx.scale(s, s)
        ctx.globalAlpha = Math.min(1, k * 2.5)
        // l'evidenziatore del karaoke, quando la pallina ci atterra
        if (lay.modo === 'musica') {
          const ke = fra(tl, inizioK + v.i * passo, inizioK + v.i * passo + 160)
          if (ke > 0) {
            ctx.save(); ctx.globalCompositeOperation = 'multiply'
            ctx.fillStyle = GIALLO
            const hh = lay.size * 0.42
            ctx.beginPath()
            ctx.moveTo(-v.w / 2 - 6, -hh * 0.9)
            ctx.lineTo(-v.w / 2 - 6 + (v.w + 12) * ke, -hh * 0.95)
            ctx.lineTo(-v.w / 2 - 6 + (v.w + 12) * ke, hh * 0.2)
            ctx.lineTo(-v.w / 2 - 6, hh * 0.25)
            ctx.closePath(); ctx.fill(); ctx.restore()
          }
        }
        ctx.globalCompositeOperation = 'multiply'
        ctx.textAlign = 'center'
        ctx.fillStyle = inkA; ctx.fillText(v.s, -4 + boll, -3)
        ctx.fillStyle = inkB; ctx.fillText(v.s, 0, 0)
        ctx.restore()
      }
      // la pallina del karaoke
      if (lay.modo === 'musica' && n && tl > 1850 && tl < 5150) {
        const u = limita((tl - inizioK) / passo, -1, n - 0.001)
        const i = Math.floor(u), f = u - i
        const centro = (j) => { const v = lay.voci[limita(j, 0, n - 1)]; return [v.x + v.w / 2, v.y - lay.size * 0.72] }
        let x, y
        if (u < 0) { const [cx, cy] = centro(0); x = cx; y = cy - (1 - esce(fra(tl, 1850, inizioK))) * 140 }
        else {
          const [x0, y0] = centro(i), [x1, y1] = centro(i + 1 < n ? i + 1 : i)
          x = x0 + (x1 - x0) * f
          y = y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * (i + 1 < n ? 54 : 22)
        }
        const fuori = fra(tl, 5000, 5150)
        y += fuori * fuori * 300
        const schiaccia = u >= 0 ? Math.max(0, 1 - (u - i) * 8) : 0
        ctx.save(); ctx.globalCompositeOperation = 'multiply'
        ctx.translate(x, y); ctx.scale(1 + schiaccia * 0.25, 1 - schiaccia * 0.22)
        ctx.fillStyle = inkA; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = inkB; ctx.beginPath(); ctx.arc(-1.5, 1.5, 11, Math.PI * 0.1, Math.PI * 1.1); ctx.globalAlpha = 0.35; ctx.fill()
        ctx.restore()
      }
    }

    function didascalie(tl) {
      // l'artista a pennarello, scritto da sinistra a destra
      const k = fra(tl, 1250, 1850)
      if (k > 0 && lay.art) {
        ctx.save()
        ctx.font = `400 ${lay.sizeArt}px ${F.mk}`
        const w = ctx.measureText(lay.art).width
        ctx.beginPath(); ctx.rect(20, lay.yArt - lay.sizeArt * 1.2, 16 + (w + 20) * esce(k), lay.sizeArt * 1.8); ctx.clip()
        ctx.translate(36, lay.yArt); ctx.rotate(-0.025)
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = inkTesto; ctx.fillText(lay.art, 0, 0)
        // la sottolineatura scarabocchiata
        const ks = fra(tl, 1700, 2100)
        if (ks > 0) {
          ctx.strokeStyle = inkTesto; ctx.lineWidth = 3; ctx.lineCap = 'round'
          ctx.beginPath()
          const passi = 24
          for (let j = 0; j <= passi * ks; j++) {
            const px = (w * j) / passi, py = 9 + Math.sin(j * 1.7) * 2.2 + (j / passi) * 3
            j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
          }
          ctx.stroke()
        }
        ctx.restore()
      }
      const ka = fra(tl, 1700, 2000)
      if (ka > 0 && lay.alb) {
        ctx.save(); ctx.globalAlpha = ka; ctx.globalCompositeOperation = 'multiply'
        ctx.font = `400 17px ${F.mac}`; ctx.fillStyle = inkB
        ctx.fillText(lay.alb, 36, lay.yAlb)
        ctx.restore()
      }
      // il contanastro: dove siamo nel brano, quello vero
      const kn = fra(tl, 2000, 2300)
      if (kn > 0) {
        ctx.save(); ctx.globalAlpha = kn; ctx.globalCompositeOperation = 'multiply'
        ctx.font = `400 16px ${F.mac}`; ctx.fillStyle = inkB; ctx.strokeStyle = inkB
        const y = lay.yNastro
        const m = corrente.track
        if (lay.modo === 'musica' && m?.inizio && m?.fine && m.fine > m.inizio) {
          const ora2 = Date.now(), dur = m.fine - m.inizio
          const pc = limita((ora2 - m.inizio) / dur, 0, 1)
          ctx.fillText(`▶ ${ferma(Math.max(0, ora2 - m.inizio))}`, 36, y)
          const x0 = 118, lw = 230
          ctx.lineWidth = 1.5; ctx.setLineDash([3, 4])
          ctx.beginPath(); ctx.moveTo(x0, y - 5); ctx.lineTo(x0 + lw, y - 5); ctx.stroke(); ctx.setLineDash([])
          ctx.fillStyle = inkA; ctx.fillRect(x0, y - 8, lw * pc, 6)
          ctx.fillStyle = inkB; ctx.beginPath(); ctx.arc(x0 + lw * pc, y - 5, 6, 0, Math.PI * 2); ctx.fill()
          ctx.fillText(ferma(dur), x0 + lw + 12, y)
        } else {
          ctx.fillText(`■ ${lay.modo === 'off' ? tx('fuori') : tx('fermo')}`, 36, y)
        }
        ctx.restore()
      }
    }

    function vinile(tl) {
      const k = esce(fra(tl, 450, 1050))
      const cx = 590 + (1 - k) * 280, cy = 214, r = 128
      ctx.save()
      if (lay.modo === 'off') {
        // il monoscopio: la chiocciola dorme, la tv fa la replica
        ctx.translate(cx, cy)
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip()
        ctx.globalCompositeOperation = 'multiply'
        const barre = [inkA, GIALLO, mescola(inkA, CARTA, 0.55), inkB, mescola(inkB, CARTA, 0.6), CARTA]
        const bw = (r * 2) / barre.length
        barre.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-r + i * bw, -r, bw + 1, r * 1.1) })
        ctx.fillStyle = inkB
        for (let i = 0; i < 12; i++) ctx.fillRect(-r + (i * r * 2) / 12, r * 0.1, (r * 2) / 24, 34)
        ctx.fillStyle = mescola(inkB, CARTA, 0.35); ctx.fillRect(-r, r * 0.1 + 34, r * 2, r)
        ctx.restore()
        ctx.globalCompositeOperation = 'multiply'
        ctx.strokeStyle = inkB; ctx.lineWidth = 4
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke()
        ctx.fillStyle = CARTA; ctx.globalCompositeOperation = 'source-over'
        ctx.fillRect(-62, -20, 124, 40)
        ctx.strokeStyle = inkB; ctx.lineWidth = 2; ctx.strokeRect(-62, -20, 124, 40)
        ctx.fillStyle = inkB; ctx.font = `400 26px ${F.fa}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('PZKKO TV', 0, 2)
        ctx.restore()
        return
      }
      const gira = lay.modo === 'musica'
      const ang = gira ? (tl / L) * Math.PI * 2 * 3 : 0.3
      ctx.globalCompositeOperation = 'multiply'
      ctx.translate(cx, cy)
      // il disco
      ctx.fillStyle = mescola(inkB, '#000000', 0.25)
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = 'rgba(244,236,218,.13)'; ctx.lineWidth = 1
      for (let rr = 56; rr < r - 3; rr += 5) { ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke() }
      // il riflesso sta fermo: è il disco che gira
      ctx.fillStyle = 'rgba(244,236,218,.16)'
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 4, -2.3, -1.75); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 4, 0.85, 1.35); ctx.closePath(); ctx.fill()
      // l'etichetta: la copertina vera, che gira
      ctx.save(); ctx.rotate(ang)
      ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.clip()
      if (immagine) ctx.drawImage(immagine, -50, -50, 100, 100)
      else {
        ctx.fillStyle = inkA; ctx.fillRect(-50, -50, 100, 100)
        ctx.fillStyle = CARTA; ctx.font = `400 22px ${F.fa}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('pzkko', 0, -14)
        ctx.font = `400 11px ${F.mac}`; ctx.fillText(tx('lato'), 0, 14)
      }
      ctx.restore()
      ctx.save(); ctx.rotate(ang)
      ctx.strokeStyle = 'rgba(244,236,218,.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.arc(0, 0, 44, -0.4, 0.3); ctx.stroke()
      ctx.restore()
      ctx.fillStyle = CARTA; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill()
      // il braccio: giù se suona, su se no
      ctx.globalCompositeOperation = 'multiply'
      const px = 112, py = -118
      const braccio = gira ? 0.2 : -0.28
      ctx.translate(px, py); ctx.rotate(braccio)
      ctx.fillStyle = inkA; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = inkB; ctx.lineWidth = 6; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, 120); ctx.lineTo(-30, 162); ctx.stroke()
      ctx.fillStyle = inkB; ctx.save(); ctx.translate(-30, 162); ctx.rotate(0.55); ctx.fillRect(-9, -4, 18, 24); ctx.restore()
      ctx.restore()
    }

    const xChiocciola = (tl) => -260 + (tl / L) * 1240

    function chiocciola(x, y, s, tl, pulse, ferma2) {
      const dorme = lay.modo === 'off'
      const assonnata = lay.status === 'idle'
      const onda = ferma2 ? 0 : Math.sin((tl / L) * Math.PI * 2 * 12)
      const salto = parla && performance.now() < parla.fino ? Math.abs(Math.sin((performance.now() - parla.da) / 130)) * 16 * Math.max(0, 1 - (performance.now() - parla.da) / 900) : 0
      ctx.save()
      ctx.translate(x, y - salto); ctx.scale(s, s)
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // il corpo, che si allunga e si accorcia mentre striscia
      const st = 1 + onda * 0.05
      ctx.save(); ctx.scale(st, 1)
      ctx.beginPath()
      ctx.moveTo(-128, 0)
      ctx.quadraticCurveTo(-70, -10, 20, -16)
      ctx.bezierCurveTo(48, -20, 60, -44, 66, -70)
      ctx.arc(84, -78, 19, Math.PI * 1.05, Math.PI * 0.15)
      ctx.bezierCurveTo(104, -52, 104, -22, 114, 0)
      ctx.closePath()
      ctx.fillStyle = '#fbf6e8'; ctx.fill()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = mescola(inkB, CARTA, 0.78); ctx.fill()
      ctx.strokeStyle = inkB; ctx.lineWidth = 3.4; ctx.stroke()
      // i puntini della pelle e il bordo del piede
      ctx.fillStyle = inkB
      for (const [px, py] of [[-96, -6], [-70, -9], [-44, -10], [60, -36], [74, -54], [92, -40], [98, -18], [84, -16]]) { ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill() }
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let j = 0; j <= 20; j++) { const px = -118 + j * 11.5, py = -3 + Math.sin(j * 1.3 + tl / 90) * 1.4; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py) }
      ctx.stroke()
      ctx.restore()
      ctx.globalCompositeOperation = 'multiply'
      // gli occhi sulle antenne
      const ond2 = ferma2 ? 0 : Math.sin(tl / 160) * 4 + pulse * 3
      const occhi = dorme ? [[80, -90, 72, -106], [94, -92, 104, -104]] : [[80, -92, 70 + ond2, -142 - pulse * 4], [94, -94, 108 + ond2 * 0.7, -134 - pulse * 3]]
      ctx.strokeStyle = inkB; ctx.lineWidth = 4
      for (const [a, b, c, d] of occhi) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2 - 6, (b + d) / 2, c, d); ctx.stroke() }
      for (const [, , c, d] of occhi) {
        ctx.save(); ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(c, d, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(c, d, 9, 0, Math.PI * 2); ctx.stroke()
        if (dorme) { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(c, d - 1, 5, 0.2, Math.PI - 0.2); ctx.stroke() }
        else {
          ctx.fillStyle = inkB; ctx.beginPath(); ctx.arc(c + 3, d + 1, 3.8, 0, Math.PI * 2); ctx.fill()
          if (assonnata) { ctx.beginPath(); ctx.arc(c, d, 9, Math.PI, 0); ctx.closePath(); ctx.fill() }
        }
      }
      // il berretto da notte, col pompon
      if (dorme) {
        ctx.fillStyle = inkA
        ctx.beginPath(); ctx.moveTo(64, -86); ctx.quadraticCurveTo(84, -112, 104, -88); ctx.quadraticCurveTo(80, -84, 64, -86); ctx.fill()
        ctx.beginPath(); ctx.moveTo(70, -96); ctx.quadraticCurveTo(60, -122, 34, -112); ctx.lineTo(96, -98); ctx.closePath(); ctx.fill()
        ctx.lineWidth = 2.4; ctx.stroke()
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fffaf0'
        ctx.beginPath(); ctx.arc(32, -112, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        ctx.beginPath(); ctx.arc(32, -112, 8, 0, Math.PI * 2); ctx.stroke()
        ctx.lineWidth = 5; ctx.strokeStyle = mescola(inkA, CARTA, 0.5); ctx.beginPath(); ctx.moveTo(64, -88); ctx.quadraticCurveTo(84, -96, 104, -89); ctx.stroke()
        ctx.strokeStyle = inkB
      }
      // la bocca: sorride, o russa
      ctx.lineWidth = 2.6
      ctx.beginPath()
      if (dorme) ctx.arc(98, -66, 4, 0, Math.PI * 2)
      else ctx.arc(94, -72, 8, 0.25, Math.PI * 0.85)
      ctx.stroke()
      ctx.fillStyle = inkA; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(84, -64, 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
      // il guscio a spirale
      const gx = -30, gy = -64, gr = 58
      ctx.fillStyle = inkA; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = inkB; ctx.lineWidth = 3.4; ctx.stroke()
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 4.3; a += 0.12) {
        const rr = gr * (1 - a / (Math.PI * 4.7)), px = gx + Math.cos(a + 2.6) * rr, py = gy + Math.sin(a + 2.6) * rr
        a ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      }
      ctx.stroke()
      ctx.lineWidth = 1.3; ctx.globalAlpha = 0.6
      for (let j = 0; j < 9; j++) { const a = 0.4 + j * 0.3; ctx.beginPath(); ctx.moveTo(gx + Math.cos(a) * gr * 0.62, gy + Math.sin(a) * gr * 0.62); ctx.lineTo(gx + Math.cos(a) * gr * 0.94, gy + Math.sin(a) * gr * 0.94); ctx.stroke() }
      ctx.globalAlpha = 1
      // il boombox sul guscio
      ctx.save()
      ctx.translate(-30, -150 - pulse * 5)
      ctx.rotate(ferma2 ? -0.04 : Math.sin((tl / L) * Math.PI * 2 * 6) * 0.05)
      ctx.lineWidth = 4.5; ctx.strokeStyle = inkB
      ctx.beginPath(); ctx.moveTo(-44, -30); ctx.lineTo(-40, -50); ctx.lineTo(40, -50); ctx.lineTo(44, -30); ctx.stroke()
      if (lay.modo === 'musica') { ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(50, -30); ctx.lineTo(74, -78); ctx.stroke(); ctx.beginPath(); ctx.arc(74, -78, 3, 0, Math.PI * 2); ctx.fill() }
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fbf6e8'
      ctx.beginPath(); ctx.roundRect(-68, -32, 136, 64, 7); ctx.fill(); ctx.restore()
      ctx.fillStyle = mescola(inkB, CARTA, 0.82); ctx.beginPath(); ctx.roundRect(-68, -32, 136, 64, 7); ctx.fill()
      ctx.lineWidth = 3.4; ctx.stroke()
      const casse = lay.modo === 'musica' ? pulse * 3 : 0
      for (const sx of [-38, 38]) {
        ctx.fillStyle = inkA; ctx.beginPath(); ctx.arc(sx, 3, 20 + casse, 0, Math.PI * 2); ctx.fill()
        ctx.lineWidth = 2.4; ctx.stroke()
        ctx.fillStyle = inkB; ctx.beginPath(); ctx.arc(sx, 3, 8 + casse * 0.6, 0, Math.PI * 2); ctx.fill()
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, 3, 14 + casse, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.lineWidth = 2; ctx.strokeRect(-14, -14, 28, 20)
      ctx.beginPath(); ctx.arc(-6, -4, 3.4, 0, Math.PI * 2); ctx.arc(6, -4, 3.4, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = inkB
      for (let j = 0; j < 4; j++) ctx.fillRect(-15 + j * 8, 12, 6, 6)
      ctx.fillRect(-60, -27, 22, 3)
      ctx.restore()
      ctx.restore()
    }

    function note(tl, pulse) {
      if (lay.modo !== 'musica') return
      ctx.save(); ctx.globalCompositeOperation = 'multiply'
      for (let b = 0; b < L / BATTITO; b++) {
        const t0 = b * BATTITO
        const eta = ((tl - t0) % L + L) % L
        if (eta > 1500) continue
        const k = eta / 1500
        const s = 0.9
        const lato = b % 2 ? 38 : -38
        const ox = xChiocciola(t0) + (-30 + lato) * s
        const oy = 628 + (-150 + 3) * s
        const x = ox + Math.sin(k * 7 + b) * 14 + lato * k * 0.8
        const y = oy - 30 - k * 170
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.95
        ctx.fillStyle = b % 3 === 0 ? inkA : inkB; ctx.strokeStyle = ctx.fillStyle
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(k * 5 + b) * 0.3)
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(6, -26)
        if (b % 2) { ctx.quadraticCurveTo(14, -20, 16, -12) } else { ctx.lineTo(24, -30); ctx.lineTo(24, -6) }
        ctx.stroke()
        if (!(b % 2)) { ctx.beginPath(); ctx.ellipse(18, 0, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }
      ctx.restore()
    }

    function zeta(x, tl) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = inkB
      for (let j = 0; j < 3; j++) {
        const p = ((tl / 2000) + j / 3) % 1
        ctx.globalAlpha = Math.sin(p * Math.PI)
        ctx.font = `400 ${18 + p * 22}px ${F.mk}`
        ctx.fillText('z', x + p * 46 + Math.sin(p * 6) * 6, 628 - 130 - p * 110)
      }
      ctx.restore()
    }

    function strada(tl) {
      inchiostro(() => {
        ctx.strokeStyle = inkB; ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.moveTo(24, 630); ctx.lineTo(696, 630); ctx.stroke()
        ctx.lineWidth = 1.4
        for (let x = 30; x < 696; x += 13) { ctx.beginPath(); ctx.moveTo(x, 633); ctx.lineTo(x - 7, 640); ctx.stroke() }
        // l'autovelox
        ctx.fillStyle = inkB
        ctx.fillRect(652, 520, 5, 110)
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fbf6e8'; ctx.fillRect(626, 486, 54, 40); ctx.restore()
        ctx.fillStyle = mescola(inkA, CARTA, 0.6); ctx.fillRect(626, 486, 54, 40)
        ctx.lineWidth = 2.6; ctx.strokeRect(626, 486, 54, 40)
        ctx.fillStyle = inkB; ctx.beginPath(); ctx.arc(640, 506, 9, 0, Math.PI * 2); ctx.fill()
        ctx.fillRect(656, 496, 18, 5); ctx.fillRect(656, 506, 12, 5)
      })
    }

    function nastro(tl) {
      const y0 = 646, h = 40
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = inkB; ctx.fillRect(0, y0, LATO, h)
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath(); ctx.rect(0, y0, LATO, h); ctx.clip()
      ctx.font = `400 21px ${F.mac}`; ctx.fillStyle = CARTA; ctx.textBaseline = 'middle'
      const passo = lay.wNastro
      let x = 130 - ((tl / L) * lay.giri * passo) % passo
      while (x < LATO) { ctx.fillText(lay.testoNastro, x, y0 + h / 2 + 1); x += passo }
      // l'etichetta fissa a sinistra
      ctx.fillStyle = lay.modo === 'off' ? CARTA : inkA
      ctx.fillRect(0, y0, 124, h)
      ctx.fillStyle = lay.modo === 'off' ? inkB : '#fffaf0'
      ctx.font = `400 22px ${F.fa}`
      ctx.fillText((lay.modo === 'off' ? tx('replica') : tx('inOnda')).toUpperCase(), 14, y0 + h / 2 + 1)
      ctx.restore()
      // sotto: la data e la firma, a macchina
      inchiostro(() => {
        ctx.font = `400 16px ${F.mac}`; ctx.fillStyle = inkB; ctx.textBaseline = 'alphabetic'
        ctx.textAlign = 'right'; ctx.fillText('pzkko.it/#studio', 684, 711); ctx.textAlign = 'left'
      })
    }

    function camera(tl) {
      // la data in arancio, come le videocamere di una volta
      ctx.save()
      ctx.font = `400 18px ${F.bit}`; ctx.textBaseline = 'alphabetic'
      const testo = `▶ ${ora(Date.now(), lang)}  ${dataIt(Date.now(), lang).toUpperCase()}`
      ctx.fillStyle = 'rgba(40,20,0,.6)'
      ctx.fillText(testo, 38, 713)
      ctx.fillStyle = CAMERA
      ctx.fillText(testo, 36, 711)
      ctx.restore()
    }

    function multa(tl) {
      if (lay.modo === 'off') {
        const k = fra(tl, 2400, 2600)
        if (k > 0 && tl < 5300) timbro(568, 400, -0.12, tx('regolare').toUpperCase(), inkB, 20, k)
        return
      }
      // il lampo quando la testa passa davanti all'autovelox (uno solo per giro)
      const tLampo = ((612 - 100 + 260) / 1240) * L
      const kl = fra(tl, tLampo, tLampo + 180)
      if (kl > 0 && kl < 1) { ctx.save(); ctx.fillStyle = `rgba(255,252,240,${0.6 * (1 - kl)})`; ctx.fillRect(0, 0, LATO, LATO); ctx.restore() }
      const k = fra(tl, tLampo + 120, tLampo + 300)
      if (k > 0 && tl < 5300) {
        timbro(578, 386, -0.13, tx('multa').toUpperCase(), '#d4141f', 30, k)
        ctx.save(); ctx.globalAlpha = k; ctx.globalCompositeOperation = 'multiply'
        ctx.translate(586, 430); ctx.rotate(-0.13)
        ctx.font = `400 17px ${F.mac}`; ctx.fillStyle = '#d4141f'; ctx.textAlign = 'center'
        ctx.fillText(tx('velox'), 0, 0)
        ctx.restore()
      }
    }

    function coriandoliDipingi(tl) {
      if (lay.modo !== 'musica') return
      const tinte = [inkA, inkB, GIALLO]
      ctx.save(); ctx.globalCompositeOperation = 'multiply'
      for (const c of coriandoli) {
        const k = (tl - c.t0) / c.dur
        if (k <= 0 || k >= 1) continue
        const x = c.x + c.dx * k + Math.sin(k * 9 + c.giro) * 16
        const y = -20 + k * 690
        ctx.save(); ctx.translate(x, y); ctx.rotate(c.giro + c.vg * k)
        ctx.scale(1, Math.cos(k * 14 + c.giro))
        ctx.fillStyle = tinte[c.c]; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
        ctx.restore()
      }
      ctx.restore()
    }

    function fumetto() {
      if (!parla) return
      const adesso = performance.now()
      if (adesso > parla.fino) { parla = null; return }
      const k = Math.min(1, (adesso - parla.da) / 160), fuori = fra(adesso, parla.fino - 200, parla.fino)
      const tl = tempoGiro(adesso)
      const sx = lay.modo === 'off' ? 330 : xChiocciola(tl)
      ctx.save()
      ctx.font = `400 21px ${F.mk}`
      const w = ctx.measureText(parla.testo).width + 30, h = 46
      const bx = limita(sx + 40, 16, LATO - w - 16), by = 404
      ctx.globalAlpha = k * (1 - fuori)
      ctx.translate(bx + w / 2, by + h / 2); ctx.scale(0.8 + 0.2 * esce(k), 0.8 + 0.2 * esce(k)); ctx.translate(-w / 2, -h / 2)
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = inkB; ctx.lineWidth = 3
      ctx.beginPath(); ctx.roundRect(0, 0, w, h, 16); ctx.fill(); ctx.stroke()
      const cx = limita(sx + 70 - bx, 24, w - 24)
      ctx.beginPath(); ctx.moveTo(cx - 10, h - 1.5); ctx.lineTo(cx - 2, h + 18); ctx.lineTo(cx + 10, h - 1.5); ctx.fill()
      ctx.beginPath(); ctx.moveTo(cx - 10, h); ctx.lineTo(cx - 2, h + 18); ctx.lineTo(cx + 10, h); ctx.stroke()
      ctx.fillStyle = inkB; ctx.textBaseline = 'middle'
      ctx.fillText(parla.testo, 15, h / 2 + 2)
      ctx.restore()
    }

    function serranda(tl) {
      // chiusa a 0 e a 6 s: il loop si chiude qui, con la firma
      let giu
      if (tl < 200) giu = 1
      else if (tl < 820) giu = 1 - dentroFuori(fra(tl, 200, 820))
      else if (tl < 5300) giu = 0
      else if (tl < 5800) { const k = fra(tl, 5300, 5800); giu = k * k * k }
      else { const k = fra(tl, 5800, 6000); giu = 1 - Math.abs(Math.sin(k * Math.PI)) * 0.025 * (1 - k) }
      if (giu <= 0) return
      const fondo = giu * LATO
      ctx.save()
      ctx.translate(0, fondo - LATO)
      ctx.fillStyle = mescola(inkB, '#9b968c', 0.62); ctx.fillRect(0, 0, LATO, LATO)
      for (let y = 0; y < LATO; y += 24) {
        ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(0, y + 2, LATO, 5)
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, y + 21, LATO, 3)
      }
      ctx.fillStyle = 'rgba(70,40,10,.12)'
      for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.ellipse(60 + j * 80, 690 - (j % 3) * 20, 50, 14, 0, 0, Math.PI * 2); ctx.fill() }
      // il cartello «torno subito» col nastro
      ctx.save(); ctx.translate(520, 120); ctx.rotate(0.06)
      ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, 150, 74)
      ctx.fillStyle = 'rgba(234,222,182,.92)'; ctx.fillRect(48, -9, 56, 18)
      ctx.fillStyle = '#161616'; ctx.font = `400 19px ${F.mac}`; ctx.textAlign = 'center'
      ctx.fillText(tx('tornoSubito'), 75, 34)
      ctx.font = `400 11px ${F.mac}`; ctx.fillText(tx('sigla'), 75, 56)
      ctx.restore()
      // la firma: pzkko.it a bomboletta
      ctx.save(); ctx.translate(360, 380); ctx.rotate(-0.09)
      ctx.font = `400 116px ${F.mk}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 22; ctx.strokeText('pzkko.it', 0, 0)
      ctx.strokeStyle = '#161616'; ctx.lineWidth = 9; ctx.strokeText('pzkko.it', 0, 0)
      ctx.fillStyle = inkA; ctx.fillText('pzkko.it', 0, 0)
      ctx.fillStyle = inkA
      for (const [dx, l] of [[-190, 46], [-82, 70], [12, 34], [130, 58], [210, 28]]) { ctx.fillRect(dx, 40, 5, l); ctx.beginPath(); ctx.arc(dx + 2.5, 40 + l, 4.5, 0, Math.PI * 2); ctx.fill() }
      ctx.restore()
      // la sbarra in fondo con la serratura
      ctx.fillStyle = '#2a2622'; ctx.fillRect(0, LATO - 22, LATO, 22)
      ctx.fillStyle = '#6b655c'; ctx.fillRect(330, LATO - 18, 60, 14)
      ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.arc(360, LATO - 11, 4, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }

    function tempoGiro(adesso) {
      if (provaT !== null && !registrando) return provaT
      if (api.reduced() && !registrando) return 2900
      return ((adesso - origine) % L + L) % L
    }

    function dipingi(adesso) {
      if (!lay || lay.font !== fontiPronti) { impagina(); lay.font = fontiPronti }
      const tl = tempoGiro(adesso)
      const fb = (tl % BATTITO) / BATTITO
      const pulse = (1 - fb) ** 3
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
      ctx.drawImage(carta, 0, 0)
      testata(tl, pulse)
      vinile(tl)
      titolo(tl, pulse)
      didascalie(tl)
      strada(tl)
      const off = lay.modo === 'off'
      const sx = off ? 330 : xChiocciola(tl)
      if (sx > -260 && sx < 900) chiocciola(sx, 628, 0.9, tl, lay.modo === 'musica' ? pulse : 0, off)
      if (off) zeta(sx + 78, tl)
      note(tl, pulse)
      multa(tl)
      coriandoliDipingi(tl)
      nastro(tl)
      camera(tl)
      fumetto()
      // la grana: buchi nell'inchiostro, che «bolle» quattro volte al secondo
      const sc = Math.floor(tl / 250)
      ctx.save(); ctx.translate((sc * 97) % 256, (sc * 53) % 256)
      ctx.fillStyle = grana; ctx.fillRect(-256, -256, LATO + 256, LATO + 256)
      ctx.restore()
      serranda(tl)
      ctx.restore()
    }

    function ridisegna() { lay = null; if (!raf) dipingi(performance.now()) }

    function ciclo(adesso) {
      if (!vivo) return
      if (!attivo && !registrando) { raf = 0; return }
      if (registrando) {
        const el2 = Math.max(0, adesso - recInizio)
        const sec = Math.floor(el2 / 1000), ff = Math.floor((el2 % 1000) / (1000 / 30))
        tempoLabel.textContent = `00:00:${String(Math.min(6, sec)).padStart(2, '0')}:${String(ff).padStart(2, '0')}`
        barra.style.transform = `scaleX(${limita(el2 / L, 0, 1)})`
      }
      // il giro fermo (movimento ridotto) non si ridisegna a vuoto; altrimenti 30 fotogrammi al secondo bastano
      const fermo = api.reduced() && !registrando && !parla
      if (registrando || (!fermo && adesso - ultimoDisegno > 31)) { dipingi(adesso); ultimoDisegno = adesso }
      if (fermo) { dipingi(adesso); raf = 0; return }
      raf = requestAnimationFrame(ciclo)
    }
    function accendi() { if (!raf && vivo) raf = requestAnimationFrame(ciclo) }

    function mime() {
      if (!window.MediaRecorder) return ''
      return MIME.find((m) => MediaRecorder.isTypeSupported?.(m)) || ''
    }
    const pausa = (ms) => new Promise((r) => { contoTimer = window.setTimeout(r, ms) })
    function mostraStato(s) { scatola.dataset.stato = s }

    async function registra() {
      if (!supportato || registrando || contando) return
      try {
        // il conto alla rovescia, come la coda di una pellicola: 3, 2, 1
        contando = true
        btn.disabled = true
        btn.textContent = `● ${tx('pronti')}`
        mostraStato('conto')
        stbyLabel.textContent = 'STBY'
        for (const n of [3, 2, 1]) {
          contoLabel.hidden = false
          contoLabel.textContent = String(n)
          contoLabel.style.animation = 'none'; void contoLabel.offsetWidth; contoLabel.style.animation = ''
          await pausa(620)
          if (!vivo) return
        }
        contoLabel.hidden = true
        contando = false
        registrando = true
        mostraStato('rec')
        recLabel.hidden = false
        btn.textContent = `● ${tx('registrando')}`
        api.stato(stato, tx('registrando'), '')
        origine = performance.now() // la clip parte dal primo fotogramma del giro: il loop torna perfetto
        recInizio = origine
        dipingi(origine)
        accendi()
        stream = canvas.captureStream(30)
        const tipo = mime()
        const opzioni = { videoBitsPerSecond: 6_000_000 }
        if (tipo) opzioni.mimeType = tipo
        registratore = new MediaRecorder(stream, opzioni)
        const pezzi = []
        registratore.ondataavailable = (e) => { if (e.data?.size) pezzi.push(e.data) }
        registratore.onstop = () => {
          if (!vivo) return
          registrando = false
          recLabel.hidden = true
          mostraStato('fatto')
          btn.disabled = false
          btn.textContent = `● ${tx('registra')}`
          try { stream?.getTracks().forEach((x) => x.stop()) } catch {}
          stream = null
          const tipo2 = registratore?.mimeType || tipo || 'video/webm'
          blob = new Blob(pezzi, { type: tipo2 })
          if (url) URL.revokeObjectURL(url)
          url = URL.createObjectURL(blob)
          video.src = url
          video.hidden = false
          foto.hidden = false
          const tr = corrente.track
          didaFoto.textContent = `${tx('girata')} ${ora(Date.now(), lang)} · 6 s${tr?.titolo ? ` · «${tr.titolo}»` : ''} · ${tx('muta')}`
          btnScarica.hidden = false
          btnCondividi.hidden = false
          api.stato(stato, tx('fatto'), 'ok')
          tempoLabel.textContent = '00:00:06:00'
          barra.style.transform = ''
          clearInterval(tickTimer)
        }
        registratore.start(200)
        fineTimer = window.setTimeout(() => { try { registratore?.stop() } catch {} }, L)
      } catch (e) {
        console.error(e)
        registrando = false
        contando = false
        contoLabel.hidden = true
        mostraStato('stby')
        btn.disabled = false
        btn.textContent = `● ${tx('registra')}`
        recLabel.hidden = true
        api.stato(stato, tx('errore'), 'no')
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
    // l'uovo di pasqua: si tocca lo schermo e la chiocciola risponde
    let nBattuta = 0
    const tocca = () => {
      const lista = lay?.modo === 'off' ? tx('sonno') : tx('battute')
      const adesso = performance.now()
      parla = { da: adesso, fino: adesso + 2300, testo: lista[nBattuta++ % lista.length] }
      accendi()
    }
    canvas.addEventListener('click', tocca)

    // i font della pagina: il canvas li usa solo quando sono arrivati
    Promise.all(FONTI.map((f) => document.fonts?.load(f).catch(() => null))).then(() => { if (vivo) { fontiPronti = true; ridisegna(); accendi() } })

    api.stato(stato, supportato ? tx('pronta') : tx('no'), supportato ? 'ok' : 'no')
    const togli = api.onAdesso((a) => { corrente = a; lay = null; colora(a); accendi() })
    api.quandoVisibile(el, (v) => { attivo = v; if (v) accendi(); if (!v && !registrando) { cancelAnimationFrame(raf); raf = 0 } })
    colora(corrente); accendi()
    return () => {
      vivo = false
      togli(); clearTimeout(fineTimer); clearTimeout(contoTimer); clearInterval(tickTimer); cancelAnimationFrame(raf); raf = 0
      canvas.removeEventListener('click', tocca)
      try { if (registratore?.state !== 'inactive') registratore?.stop() } catch {}
      try { stream?.getTracks().forEach((x) => x.stop()) } catch {}
      if (url) URL.revokeObjectURL(url)
    }
  },
}
