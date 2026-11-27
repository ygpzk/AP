// voce.js — «Parla col muro»: il muro obbedisce alla voce (e alla tastiera).
//
// Tecnologia: Web Speech (SpeechRecognition per capire, SpeechSynthesis per
// rispondere) e Canvas 2D per il muro. Il riconoscimento vocale di Chrome usa
// il servizio del browser: l'audio può uscire dal dispositivo. Tutto il resto
// (ordini, disegno, voce sintetica) resta qui. Per questo c'è sempre la riga di
// testo: funziona anche senza microfono, e senza mandare niente a nessuno.
//
//   apri()  apre il muro

import { creaDialogo } from '../../shell.js'

const COLORI = {
  rosso: '#ff2d55', red: '#ff2d55',
  blu: '#2f6bff', blue: '#2f6bff',
  verde: '#39d353', green: '#39d353',
  giallo: '#ffd400', yellow: '#ffd400',
  rosa: '#ff6bcb', pink: '#ff6bcb',
  viola: '#9d00ff', purple: '#9d00ff',
  arancio: '#ff6a00', orange: '#ff6a00',
  bianco: '#f4f1e8', white: '#f4f1e8',
  nero: '#111417', black: '#111417',
  ciano: '#00e0ff', cyan: '#00e0ff',
  lime: '#ccff00',
}

const NOMI_COLORI = [
  ['lime', '#ccff00'], ['viola', '#9d00ff'], ['ciano', '#00e0ff'],
  ['verde', '#39d353'], ['giallo', '#ffd400'], ['arancio', '#ff6a00'],
  ['rosso', '#ff2d55'], ['rosa', '#ff6bcb'], ['bianco', '#f4f1e8'], ['nero', '#111417'],
]

const ESEMPI = ['pioggia', 'neve', 'stelle', 'cuori', 'fuochi', 'balla', 'terremoto', 'pulisci']

const LINGUE = [
  ['it-IT', 'italiano'], ['en-US', 'english'], ['es-ES', 'español'],
  ['fr-FR', 'français'], ['de-DE', 'deutsch'],
]

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function normalizza(testo) {
  return String(testo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function esadecimale(hex) {
  const h = String(hex).replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}

function mescola(a, b, t) {
  const ca = esadecimale(a)
  const cb = esadecimale(b)
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function rgba(hex, alfa) {
  const [r, g, b] = esadecimale(hex)
  return `rgba(${r}, ${g}, ${b}, ${alfa})`
}

function costruisci() {
  const d = creaDialogo({
    id: 'voce',
    titolo: 'Parla col muro',
    tech: 'Web Speech · canvas',
    voce: 'Dai ordini a voce: colori, adesivi, pioggia, terremoto. Il muro obbedisce e risponde. C’è anche la riga di testo, se il microfono non c’è.',
    larga: true,
    corpo: `
      <div class="lab-voce">
        <section class="lab-colonna lab-voce__sinistra">
          <figure class="lab-muro">
            <figcaption class="lab-muro__eti">
              <span class="lab-muro__num">06</span>
              <span class="lab-muro__nome">il muro</span>
              <span class="lab-muro__dica">ascolta · risponde</span>
            </figcaption>
            <div class="lab-muro-tela">
              <div class="lab-muro__cornice">
                <canvas class="lab-tela" data-voce-tela role="img" aria-label="il muro che risponde: qui compaiono i colori, gli adesivi, la pioggia, la neve, le stelle e le parole scritte"></canvas>
                <span class="lab-muro__luce" aria-hidden="true"></span>
              </div>
            </div>
          </figure>

          <div class="lab-voce__blocco lab-voce__blocco--colori">
            <p class="lab-etichetta lab-voce__eti" id="vo-colori-eti">i colori <span>un tappo, un muro</span></p>
            <div class="lab-riga lab-voce__colori" data-voce-colori role="group" aria-labelledby="vo-colori-eti"></div>
          </div>

          <div class="lab-voce__blocco lab-voce__blocco--esempi">
            <p class="lab-etichetta lab-voce__eti" id="vo-esempi-eti">gli ordini <span>tocca un foglietto</span></p>
            <div class="lab-riga lab-voce__esempi" data-voce-esempi role="group" aria-labelledby="vo-esempi-eti">
              ${ESEMPI.map((e) => `<button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-comando="${e}">${e}</button>`).join('')}
            </div>
          </div>
        </section>

        <section class="lab-colonna lab-voce__destra">
          <div class="lab-pannello lab-voce__microfono">
            <h3>il microfono</h3>
            <button type="button" class="lab-tasto lab-tasto--pieno lab-voce__mic" data-voce-mic aria-pressed="false" data-focus>ascolta</button>
            <p class="lab-voce__ascolto" aria-hidden="true"><i></i>ascolto…</p>
            <p class="lab-voce__dice" data-voce-stato role="status" aria-live="polite">sono qui · dammi un ordine</p>
            <p class="lab-voce__udito lab-nota" data-voce-udito aria-live="polite"></p>
            <div class="lab-voce__opzioni">
              <label class="lab-voce__lingua" for="vo-lingua">lingua
                <select id="vo-lingua" class="lab-scelta" data-voce-lingua aria-label="lingua della voce">
                  ${LINGUE.map(([code, nome]) => `<option value="${code}">${nome}</option>`).join('')}
                </select>
              </label>
              <button type="button" class="lab-voce__risponde" data-voce-risposta aria-pressed="true">risponde: sì</button>
            </div>
          </div>

          <form class="lab-voce__form" data-voce-form>
            <label class="lab-etichetta lab-voce__eti" for="vo-input">oppure scrivilo <span>invio per l’ordine</span></label>
            <div class="lab-voce__riga">
              <input id="vo-input" class="lab-campo" data-voce-input placeholder="es. muro viola, pioggia" aria-label="un ordine per il muro" autocomplete="off">
              <button type="submit" class="lab-tasto lab-tasto--pieno">dai l’ordine</button>
            </div>
          </form>

          <div class="lab-pannello lab-voce__conversazione">
            <div class="lab-voce__testata">
              <h3>la conversazione</h3>
              <span class="lab-voce__conteggio">ultime 12</span>
            </div>
            <div class="lab-trascrizione" data-voce-trascrizione role="log" aria-live="polite" aria-label="chi ha parlato e cosa ha risposto il muro"></div>
          </div>

          <aside class="lab-voce__note">
            <p class="lab-nota"><b>come funziona:</b> gli ordini si dicono o si scrivono: «pioggia», «neve», «stelle», «cuori», «fuochi», «balla», «terremoto», «pulisci», un colore, «adesivo», oppure «scrivi ciao». Il muro risponde a voce e scrive nella conversazione.</p>
            <p class="lab-nota lab-voce__privacy"><b>privacy:</b> il riconoscimento vocale di Chrome può usare il servizio del browser e mandare l’audio fuori dal dispositivo. La riga di testo non manda niente a nessuno; il microfono parte solo quando lo accendi.</p>
          </aside>
        </section>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const tela = q('[data-voce-tela]')
  const ctx = tela.getContext('2d')
  const mic = q('[data-voce-mic]')
  const stato = q('[data-voce-stato]')
  const udito = q('[data-voce-udito]')
  const linguaSel = q('[data-voce-lingua]')
  const rispostaBtn = q('[data-voce-risposta]')
  const form = q('[data-voce-form]')
  const input = q('[data-voce-input]')
  const esempi = q('[data-voce-esempi]')
  const coloriBox = q('[data-voce-colori]')
  const trascrizione = q('[data-voce-trascrizione]')

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  const TTS = 'speechSynthesis' in window
  const ridotto = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  let lingua = 'it-IT'
  let voceAttiva = true
  let ascolto = false
  let parlando = false
  let rec = null
  let riavvio = 0
  let erroreForte = false

  let colore = COLORI.lime
  let effetti = new Set()
  let particelle = []
  let adesivi = []
  let stelle = []
  let testo = null
  let scossa = 0
  let tempo = 0
  let prossimoFuoco = 0
  let raf = 0
  let ultimo = 0
  let W = 800
  let H = 450
  let dpr = 1
  let grana = null
  const accumuli = Object.create(null)

  // ── il muro ───────────────────────────────────────────────────────────────

  function creaStelle() {
    stelle = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * .75,
      r: .5 + Math.random() * 1.7,
      fase: Math.random() * Math.PI * 2,
      vel: .4 + Math.random() * 1.4,
    }))
  }

  // la grana della calce: un rumore morbido, fatto una volta e riusato a ogni giro
  function creaGrana() {
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(W / 2))
    c.height = Math.max(1, Math.round(H / 2))
    const g = c.getContext('2d')
    if (!g) { grana = null; return }
    const img = g.createImageData(c.width, c.height)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 90
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    g.putImageData(img, 0, 0)
    grana = c
  }

  function ridimensiona() {
    const r = tela.getBoundingClientRect()
    W = Math.max(280, Math.round(r.width || 800))
    H = Math.max(180, Math.round(r.height || 450))
    dpr = Math.min(2, window.devicePixelRatio || 1)
    tela.width = Math.round(W * dpr)
    tela.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    creaStelle()
    creaGrana()
  }

  function caso(min, max) {
    return min + Math.random() * (max - min)
  }

  function crea(tipo) {
    const base = { tipo, vita: 0, max: 0 }
    if (tipo === 'pioggia') {
      return { ...base, x: Math.random() * W, y: -20, vx: caso(20, 80), vy: caso(520, 980), len: caso(9, 26), alfa: caso(.25, .7), vita: 3, max: 3 }
    }
    if (tipo === 'neve') {
      return { ...base, x: Math.random() * W, y: -10, vx: 0, vy: caso(22, 65), r: caso(1.2, 3.8), fase: Math.random() * 6.28, alfa: caso(.35, .9), vita: 12, max: 12 }
    }
    if (tipo === 'cuori') {
      return { ...base, x: Math.random() * W, y: H + 30, vx: caso(-12, 12), vy: caso(-65, -30), r: caso(6, 15), fase: Math.random() * 6.28, alfa: caso(.5, 1), vita: 9, max: 9 }
    }
    if (tipo === 'balla') {
      const r = caso(7, 16)
      return { ...base, x: caso(W * .1, W * .9), y: H - r, vx: caso(-140, 140), vy: caso(-360, -140), r, forma: Math.floor(Math.random() * 3), rot: Math.random() * 6.28, vr: caso(-4, 4), vita: 7, max: 7 }
    }
    if (tipo === 'fuoco') {
      const a = Math.random() * 6.28
      const v = caso(60, 230)
      return { ...base, x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: caso(1.2, 3), alfa: 1, vita: caso(1.1, 2), max: 2 }
    }
    return { ...base, x: 0, y: 0, vx: 0, vy: 0, r: 2, vita: 1, max: 1 }
  }

  function fuoco() {
    const cx = caso(W * .18, W * .82)
    const cy = caso(H * .12, H * .45)
    const quanti = Math.round(caso(18, 36))
    for (let i = 0; i < quanti; i++) {
      const p = crea('fuoco')
      p.x = cx
      p.y = cy
      particelle.push(p)
    }
  }

  function disegnaCuore(x, y, r, colore) {
    ctx.beginPath()
    ctx.moveTo(x, y + r * .35)
    ctx.bezierCurveTo(x, y, x - r, y - r * .15, x - r, y + r * .35)
    ctx.bezierCurveTo(x - r, y + r * .95, x, y + r * 1.2, x, y + r * 1.55)
    ctx.bezierCurveTo(x, y + r * 1.2, x + r, y + r * .95, x + r, y + r * .35)
    ctx.bezierCurveTo(x + r, y - r * .15, x, y, x, y + r * .35)
    ctx.closePath()
    ctx.fillStyle = colore
    ctx.fill()
  }

  function disegnaStella(x, y, r, colore) {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const raggio = i % 2 === 0 ? r : r * .42
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const px = x + Math.cos(a) * raggio
      const py = y + Math.sin(a) * raggio
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fillStyle = colore
    ctx.fill()
  }

  function aggiungiAdesivo(coloreAdesivo, forma = null) {
    const adesivo = {
      x: caso(W * .18, W * .82),
      y: caso(H * .16, H * .78),
      r: caso(26, 46),
      colore: coloreAdesivo || colore,
      forma: forma ?? (adesivi.length % 3),
      rot: caso(-.35, .35),
    }
    adesivi.push(adesivo)
    if (adesivi.length > 14) adesivi.shift()
    return adesivo
  }

  function disegnaAdesivo(a) {
    ctx.save()
    ctx.translate(a.x, a.y)
    ctx.rotate(a.rot)
    ctx.fillStyle = a.colore
    ctx.strokeStyle = 'rgba(7, 9, 11, .85)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(0, 0, a.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(7, 9, 11, .92)'
    if (a.forma === 1) {
      disegnaStella(0, 0, a.r * .62, 'rgba(7, 9, 11, .92)')
    } else if (a.forma === 2) {
      ctx.translate(0, -a.r * .22)
      disegnaCuore(0, 0, a.r * .46, 'rgba(7, 9, 11, .92)')
    } else {
      ctx.font = `800 ${Math.round(a.r * .9)}px "Lab Sans", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('pzk', 0, a.r * .04)
    }
    ctx.restore()
  }

  function disegnaTesto() {
    if (!testo || tempo >= testo.fino) return
    const restante = testo.fino - tempo
    const alfa = restante < .8 ? Math.max(0, restante / .8) : 1
    const maxW = W * .82
    let size = Math.max(26, Math.min(92, W * .1))
    let righe = []
    for (let tentativi = 0; tentativi < 6; tentativi++) {
      ctx.font = `800 ${size}px "Lab Sans", system-ui, sans-serif`
      righe = []
      let riga = ''
      for (const parola of testo.valore.split(/\s+/)) {
        const prova = riga ? `${riga} ${parola}` : parola
        if (ctx.measureText(prova).width > maxW && riga) {
          righe.push(riga)
          riga = parola
        } else {
          riga = prova
        }
      }
      if (riga) righe.push(riga)
      if (righe.length <= 4) break
      size *= .82
    }
    if (righe.length > 6) righe = righe.slice(0, 6)
    const lh = size * 1.08
    const y0 = H / 2 - ((righe.length - 1) * lh) / 2
    ctx.save()
    ctx.globalAlpha = alfa
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f4f1e8'
    ctx.shadowColor = 'rgba(0,0,0,.55)'
    ctx.shadowBlur = 22
    righe.forEach((riga, i) => ctx.fillText(riga, W / 2, y0 + i * lh))
    ctx.restore()
  }

  function disegna(dt) {
    tempo += dt
    const rid = ridotto()
    ctx.save()
    if (scossa > 0 && !rid) {
      const a = 12 * (scossa / 1.4)
      ctx.translate(caso(-a, a), caso(-a, a))
      scossa = Math.max(0, scossa - dt)
    } else if (scossa > 0) {
      scossa = Math.max(0, scossa - dt)
    }

    // il muro: calce calda, non nera. Il colore scelto lo vela appena, come una luce sulla parete.
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, mescola('#514939', colore, .07))
    grad.addColorStop(.52, mescola('#463f31', colore, .12))
    grad.addColorStop(1, mescola('#393328', colore, .20))
    ctx.fillStyle = grad
    ctx.fillRect(-24, -24, W + 48, H + 48)

    // il filo di luce che arriva da sinistra in alto
    const luce = ctx.createRadialGradient(W * .16, -H * .2, 8, W * .16, -H * .2, H * 1.18)
    luce.addColorStop(0, 'rgba(255, 241, 203, .2)')
    luce.addColorStop(.55, 'rgba(255, 236, 190, .06)')
    luce.addColorStop(1, 'rgba(255, 236, 190, 0)')
    ctx.fillStyle = luce
    ctx.fillRect(-24, -24, W + 48, H + 48)

    // le macchie della calce: chiazze chiare e ombre, come un muro vissuto
    const macchie = [
      [.2, .24, .42, 'rgba(255, 242, 208, .055)'],
      [.78, .7, .36, 'rgba(16, 13, 9, .10)'],
      [.48, .08, .3, 'rgba(255, 244, 214, .05)'],
      [.94, .94, .34, 'rgba(16, 13, 9, .12)'],
      [.58, .56, .2, 'rgba(255, 240, 202, .035)'],
    ]
    for (const [fx, fy, fr, tinta] of macchie) {
      const r = Math.max(W, H) * fr
      const chiazza = ctx.createRadialGradient(W * fx, H * fy, 2, W * fx, H * fy, r)
      chiazza.addColorStop(0, tinta)
      chiazza.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = chiazza
      ctx.fillRect(-24, -24, W + 48, H + 48)
    }

    // le passate di frattazzo: righe larghe e storte, non una griglia
    ctx.lineWidth = 2
    for (let y = H * .16, riga = 0; y < H; y += Math.max(74, H / 5.6), riga++) {
      ctx.beginPath()
      for (let x = -10; x <= W + 10; x += 26) {
        const yy = y + Math.sin((x / W) * 6.2 + riga) * 2.4
        if (x < 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.strokeStyle = riga % 2 ? 'rgba(255, 246, 224, .04)' : 'rgba(16, 13, 9, .055)'
      ctx.stroke()
    }

    // la grana della calce
    if (grana) {
      ctx.save()
      ctx.globalAlpha = .09
      ctx.drawImage(grana, 0, 0, W, H)
      ctx.restore()
    }

    // lo zoccolo in fondo: il muro ha un pavimento
    const zoccolo = Math.max(12, Math.round(H * .035))
    ctx.fillStyle = 'rgba(14, 11, 8, .22)'
    ctx.fillRect(0, H - zoccolo, W, zoccolo)
    ctx.fillStyle = 'rgba(255, 244, 214, .10)'
    ctx.fillRect(0, H - zoccolo, W, 1.5)

    // la vignetta: gli angoli si perdono nel buio della stanza
    const vignetta = ctx.createRadialGradient(W * .5, H * .46, Math.min(W, H) * .3, W * .5, H * .46, Math.max(W, H) * .78)
    vignetta.addColorStop(0, 'rgba(8, 7, 5, 0)')
    vignetta.addColorStop(1, 'rgba(8, 7, 5, .44)')
    ctx.fillStyle = vignetta
    ctx.fillRect(-24, -24, W + 48, H + 48)

    // con le stelle il muro diventa un pezzo di cielo: la luna, la notte, le stelle
    const notte = effetti.has('stelle')
    if (!notte) {
      // l'interruttore della luce, sul bordo del muro: una placca vera
      const sx = W - 36
      const sy = H * .54
      ctx.save()
      ctx.fillStyle = 'rgba(12, 9, 6, .2)'
      ctx.fillRect(sx + 2, sy + 3, 20, 32)
      ctx.fillStyle = 'rgba(238, 228, 205, .5)'
      ctx.fillRect(sx, sy, 20, 32)
      ctx.strokeStyle = 'rgba(38, 32, 22, .45)'
      ctx.lineWidth = 1
      ctx.strokeRect(sx + .5, sy + .5, 19, 31)
      ctx.fillStyle = 'rgba(38, 32, 22, .5)'
      ctx.fillRect(sx + 7, sy + 9, 6, 10)
      ctx.beginPath()
      ctx.arc(sx + 10, sy + 25, 1.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    if (notte) {
      const cielo = ctx.createLinearGradient(0, 0, 0, H)
      cielo.addColorStop(0, 'rgba(10, 17, 33, .68)')
      cielo.addColorStop(.62, 'rgba(17, 24, 41, .54)')
      cielo.addColorStop(1, 'rgba(24, 24, 28, .22)')
      ctx.fillStyle = cielo
      ctx.fillRect(-24, -24, W + 48, H + 48)

      const mx = W * .82
      const my = H * .2
      const mr = Math.max(14, Math.min(W, H) * .065)
      const aloneLuna = ctx.createRadialGradient(mx, my, mr * .4, mx, my, mr * 3.4)
      aloneLuna.addColorStop(0, 'rgba(255, 243, 208, .3)')
      aloneLuna.addColorStop(1, 'rgba(255, 243, 208, 0)')
      ctx.fillStyle = aloneLuna
      ctx.beginPath()
      ctx.arc(mx, my, mr * 3.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(248, 238, 206, .92)'
      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(196, 189, 169, .42)'
      ctx.beginPath()
      ctx.arc(mx - mr * .3, my - mr * .22, mr * .22, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mx + mr * .36, my + mr * .18, mr * .14, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const adesivo of adesivi) disegnaAdesivo(adesivo)

    if (notte) {
      for (const s of stelle) {
        const tw = rid ? .7 : .35 + .65 * Math.abs(Math.sin(tempo * s.vel + s.fase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = rgba('#f4f1e8', .18 + tw * .65)
        ctx.fill()
      }
    }

    // le particelle nuove
    const rate = rid ? .35 : 1
    const aggiungi = (tipo, quante) => {
      accumuli[tipo] = (accumuli[tipo] || 0) + dt * quante * rate
      while (accumuli[tipo] >= 1 && particelle.length < 260) {
        particelle.push(crea(tipo))
        accumuli[tipo] -= 1
      }
    }
    if (effetti.has('pioggia')) aggiungi('pioggia', 55)
    if (effetti.has('neve')) aggiungi('neve', 20)
    if (effetti.has('cuori')) aggiungi('cuori', 7)
    if (effetti.has('balla') && particelle.filter((p) => p.tipo === 'balla').length < 18) aggiungi('balla', 4)
    if (effetti.has('fuochi') && tempo > prossimoFuoco) {
      fuoco()
      prossimoFuoco = tempo + caso(1.2, 2.4)
    }

    for (let i = particelle.length - 1; i >= 0; i--) {
      const p = particelle[i]
      p.vita -= dt
      if (p.vita <= 0) { particelle.splice(i, 1); continue }

      if (p.tipo === 'pioggia') {
        p.x += p.vx * dt
        p.y += p.vy * dt
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * .018, p.y - p.vy * .022)
        ctx.lineWidth = 2.6
        ctx.strokeStyle = 'rgba(255, 246, 220, .10)'
        ctx.stroke()
        ctx.lineWidth = 1.4
        ctx.strokeStyle = rgba(colore, p.alfa)
        ctx.stroke()
        if (p.y > H + 30) particelle.splice(i, 1)
        continue
      }

      if (p.tipo === 'neve') {
        p.x += Math.sin(tempo * 1.2 + p.fase) * 16 * dt
        p.y += p.vy * dt
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = rgba('#f4f1e8', p.alfa)
        ctx.fill()
        if (p.y > H + 10) particelle.splice(i, 1)
        continue
      }

      if (p.tipo === 'cuori') {
        p.y += p.vy * dt
        p.x += Math.sin(tempo * 1.5 + p.fase) * 18 * dt + p.vx * dt
        ctx.globalAlpha = Math.min(1, p.vita / 2)
        disegnaCuore(p.x, p.y, p.r, rgba(colore, p.alfa))
        ctx.globalAlpha = 1
        if (p.y < -60) particelle.splice(i, 1)
        continue
      }

      if (p.tipo === 'balla') {
        p.vy += 520 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        if (p.y > H - p.r) {
          p.y = H - p.r
          p.vy *= -.82
          p.vx *= .99
          if (Math.abs(p.vy) < 30) p.vy = -caso(180, 360)
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = rgba(colore, .9)
        ctx.beginPath()
        if (p.forma === 0) ctx.rect(-p.r, -p.r, p.r * 2, p.r * 2)
        else if (p.forma === 1) {
          ctx.moveTo(0, -p.r)
          ctx.lineTo(p.r, p.r)
          ctx.lineTo(-p.r, p.r)
          ctx.closePath()
        } else {
          ctx.arc(0, 0, p.r, 0, Math.PI * 2)
        }
        ctx.fill()
        ctx.strokeStyle = 'rgba(7,9,11,.45)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
        continue
      }

      if (p.tipo === 'fuoco') {
        p.vy += 90 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        ctx.globalAlpha = Math.max(0, p.vita / p.max)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.r > 2.2 ? rgba('#f4f1e8', .9) : rgba(colore, .9)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    disegnaTesto()
    ctx.restore()
  }

  function giro(ts) {
    raf = requestAnimationFrame(giro)
    const dt = Math.min(.05, Math.max(.001, (ts - ultimo) / 1000 || .016))
    ultimo = ts
    if (!document.hidden) disegna(dt)
  }

  // ── gli ordini ────────────────────────────────────────────────────────────

  function trascrivi(chi, testo) {
    const riga = document.createElement('p')
    riga.className = `lab-riga-voce lab-riga-voce--${chi}`
    const etichetta = document.createElement('b')
    etichetta.textContent = chi === 'tu' ? 'tu' : 'muro'
    const frase = document.createElement('span')
    frase.textContent = testo
    riga.append(etichetta, frase)
    trascrizione.append(riga)
    while (trascrizione.children.length > 12) trascrizione.firstElementChild.remove()
    trascrizione.scrollTop = trascrizione.scrollHeight
  }

  function rispondi(testo) {
    stato.textContent = testo
    if (!voceAttiva || !TTS) return
    try {
      parlando = true
      aggiornaMic()
      window.speechSynthesis.cancel()
      if (ascolto) {
        try { rec?.stop() } catch { /* già fermo */ }
      }
      const u = new SpeechSynthesisUtterance(testo)
      u.lang = lingua
      u.rate = 1.02
      u.pitch = 1
      u.onend = u.onerror = () => {
        parlando = false
        aggiornaMic()
        if (ascolto) avviaAscolto()
      }
      window.speechSynthesis.speak(u)
    } catch {
      parlando = false
      aggiornaMic()
    }
  }

  function aggiungiEffetto(nome, risposte) {
    effetti.add(nome)
    risposte.push({
      pioggia: 'ecco la pioggia',
      neve: 'ecco la neve',
      stelle: 'ecco le stelle',
      cuori: 'ecco i cuori',
      fuochi: 'ecco i fuochi',
      balla: 'ecco che balla',
    }[nome] || nome)
  }

  function trovaColore(f) {
    for (const [nome, hex] of Object.entries(COLORI)) {
      if (new RegExp(`\\b${nome}\\b`, 'i').test(f)) return { nome, hex }
    }
    return null
  }

  function esegui(frase, { daVoce = false } = {}) {
    const originale = String(frase || '').trim()
    if (!originale) return
    trascrivi('tu', originale)
    const f = normalizza(originale)
    const risposte = []
    let fatto = false
    let spegniMic = false

    const scrivi = originale.match(/\b(?:scrivi|write|say|dici)\b[\s:,-]+(.+)/i)
    if (scrivi?.[1]) {
      // «scrivi …» è tutto il messaggio: il resto della frase non è un altro ordine
      const valore = scrivi[1].trim().slice(0, 120)
      testo = { valore, fino: tempo + (ridotto() ? 6 : 5) }
      const risposta = `ho scritto ${valore}`
      stato.textContent = risposta
      trascrivi('muro', risposta)
      if (daVoce) udito.textContent = `«${originale}»`
      d.nota(`ordine eseguito · ${risposta}`, 'ok')
      if (daVoce || voceAttiva) rispondi(risposta)
      return
    }

    if (/\b(che ore sono|che ora e|che ora sono|what time is it|what s the time|the time)\b/.test(f)) {
      const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      testo = { valore: ora, fino: tempo + 5 }
      risposte.push(`sono le ${ora}`)
      fatto = true
    }

    if (/\b(ciao|hello|hey|salve)\b/.test(f)) {
      testo = { valore: 'ciao', fino: tempo + 4 }
      risposte.push('ciao · sono il muro')
      fatto = true
    }

    if (/\b(aiuto|help|comandi|cosa sai fare)\b/.test(f)) {
      testo = { valore: 'pioggia · neve · stelle · cuori · fuochi · balla · terremoto · adesivo · scrivi …', fino: tempo + 8 }
      risposte.push('prova pioggia, neve, stelle, cuori, fuochi, balla, terremoto, adesivo, un colore, scrivi qualcosa')
      fatto = true
    }

    if (/\b(spegni|spegni il microfono|silenzio|shut up)\b/.test(f)) {
      risposte.push('spengo il microfono')
      fatto = true
      spegniMic = true
    }

    const coloreTrovato = trovaColore(f)
    const vuoleAdesivo = /\b(adesiv|sticker)/.test(f)
    const soloAdesivo = vuoleAdesivo && !/\b(muro|sfondo|wall|background|colore)\b/.test(f)

    if (vuoleAdesivo) {
      aggiungiAdesivo(coloreTrovato?.hex || colore)
      risposte.push('adesivo attaccato al muro')
      fatto = true
    }

    if (coloreTrovato && !soloAdesivo) {
      colore = coloreTrovato.hex
      risposte.push(`ecco il ${coloreTrovato.nome}`)
      fatto = true
    }

    if (/\b(pioggia|rain|piove|piovere|diluvio)\b/.test(f)) { aggiungiEffetto('pioggia', risposte); fatto = true }
    if (/\b(neve|snow|nevica|nevicare)\b/.test(f)) { aggiungiEffetto('neve', risposte); fatto = true }
    if (/\b(stelle|stars|stelline)\b/.test(f)) { aggiungiEffetto('stelle', risposte); fatto = true }
    if (/\b(cuori|cuore|hearts?|amore)\b/.test(f)) { aggiungiEffetto('cuori', risposte); fatto = true }
    if (/\b(fuochi|fireworks?|fuoco)\b/.test(f)) { aggiungiEffetto('fuochi', risposte); prossimoFuoco = tempo; fatto = true }
    if (/\b(balla|ballare|dance|dancing)\b/.test(f)) { aggiungiEffetto('balla', risposte); fatto = true }

    const stop = f.match(/\b(?:smetti|stop|basta)\s+(?:di\s+)?(pioggia|piovere|neve|nevicare|stelle|cuori|fuochi|balla|ballare)\b/)
    if (stop) {
      const nome = stop[1].startsWith('piog') || stop[1] === 'piovere' ? 'pioggia'
        : stop[1].startsWith('nev') ? 'neve'
        : stop[1].startsWith('ball') ? 'balla'
        : stop[1]
      effetti.delete(nome)
      const vecchia = risposte.findIndex((r) => r.includes(nome))
      if (vecchia >= 0 && risposte[vecchia].startsWith('ecco')) risposte.splice(vecchia, 1)
      const articolo = { pioggia: 'la pioggia', neve: 'la neve', stelle: 'le stelle', cuori: 'i cuori', fuochi: 'i fuochi', balla: 'il ballo' }[nome] || nome
      risposte.push(`ho fermato ${articolo}`)
      fatto = true
    }

    if (/\b(terremoto|earthquake|scossa|shake)\b/.test(f)) {
      scossa = 1.4
      risposte.push('tutto trema')
      fatto = true
      if (!ridotto()) {
        d.dlg.classList.remove('lab-voce--scossa')
        void d.dlg.offsetWidth
        d.dlg.classList.add('lab-voce--scossa')
        setTimeout(() => d.dlg.classList.remove('lab-voce--scossa'), 1400)
      }
    }

    if (!stop && /\b(fermati|stop|basta|smetti|calma|quieto)\b/.test(f)) {
      effetti.clear()
      particelle = []
      scossa = 0
      risposte.push('mi fermo')
      fatto = true
    }

    if (/\b(pulisci|reset|clear|pulito|ricomincia)\b/.test(f)) {
      effetti.clear()
      particelle = []
      adesivi = []
      scossa = 0
      testo = null
      colore = COLORI.lime
      risposte.push('muro pulito')
      fatto = true
    }

    if (daVoce) udito.textContent = `«${originale}»`
    if (!fatto) {
      stato.textContent = 'non ho capito · prova «pioggia», «muro viola» o «scrivi ciao»'
      trascrivi('muro', 'non ho capito · prova «pioggia», un colore o «scrivi ciao»')
      if (daVoce) rispondi('Non ho capito. Prova pioggia, neve, oppure muro viola.')
      d.nota('non ho capito · prova «pioggia» o «muro viola»', 'attesa')
      return
    }

    const risposta = risposte.join(' · ')
    stato.textContent = risposta
    trascrivi('muro', risposta)
    segnaColore()
    d.nota(`ordine eseguito · ${risposta}`, 'ok')
    if (daVoce || voceAttiva) rispondi(risposte[risposte.length - 1] || 'fatto')
    if (spegniMic) setTimeout(() => { if (ascolto) fermaAscolto() }, 1800)
  }

  // ── il microfono ──────────────────────────────────────────────────────────

  function creaRiconoscitore() {
    if (!SR) return null
    const r = new SR()
    r.lang = lingua
    r.continuous = true
    r.interimResults = true
    r.maxAlternatives = 1
    r.onstart = () => {
      mic.classList.add('is-on')
      mic.setAttribute('aria-pressed', 'true')
      aggiornaMic()
      d.nota('ascolto… parla pure', 'ok')
    }
    r.onresult = (e) => {
      let intermedio = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const trascrizione = e.results[i][0]?.transcript || ''
        if (e.results[i].isFinal) {
          udito.textContent = ''
          esegui(trascrizione, { daVoce: true })
        } else {
          intermedio += trascrizione
        }
      }
      if (intermedio) udito.textContent = `«${intermedio.trim()}»`
    }
    r.onerror = (e) => {
      const codice = e?.error || ''
      if (codice === 'not-allowed' || codice === 'service-not-allowed') {
        erroreForte = true
        fermaAscolto()
        stato.textContent = 'permesso negato: resta la riga di testo'
        d.nota('microfono non permesso', 'male')
      } else if (codice === 'no-speech' || codice === 'aborted') {
        // il browser si è fermato per silenzio: onend riparte
      } else if (codice === 'network') {
        erroreForte = true
        fermaAscolto()
        stato.textContent = 'il servizio vocale non risponde: scrivi l’ordine'
        d.nota('riconoscimento vocale non disponibile', 'male')
      } else if (codice === 'audio-capture') {
        erroreForte = true
        fermaAscolto()
        stato.textContent = 'non trovo il microfono'
        d.nota('microfono non trovato', 'male')
      }
    }
    r.onend = () => {
      mic.classList.remove('is-on')
      mic.setAttribute('aria-pressed', 'false')
      aggiornaMic()
      if (ascolto && !parlando && !erroreForte) {
        clearTimeout(riavvio)
        riavvio = setTimeout(() => {
          if (ascolto && !parlando && !erroreForte) {
            try { r.start() } catch { /* riproverà al prossimo giro */ }
          }
        }, 260)
      }
    }
    return r
  }

  function aggiornaMic() {
    mic.classList.toggle('is-on', ascolto)
    mic.setAttribute('aria-pressed', String(ascolto))
    mic.textContent = !SR ? 'scrivi' : ascolto ? (parlando ? 'rispondo' : 'ferma') : 'ascolta'
    d.dlg.classList.toggle('lab-voce--ascolto', ascolto && !parlando)
    if (!SR) {
      mic.disabled = true
      mic.setAttribute('aria-disabled', 'true')
    }
  }

  function avviaAscolto() {
    if (!SR) {
      stato.textContent = 'questo browser non ha il riconoscimento vocale: scrivi l’ordine'
      d.nota('solo testo', 'attesa')
      return
    }
    erroreForte = false
    ascolto = true
    aggiornaMic()
    rec ||= creaRiconoscitore()
    try {
      rec.lang = lingua
      rec.start()
    } catch {
      // start() mentre è già acceso: va bene, resta acceso
    }
  }

  function fermaAscolto() {
    ascolto = false
    parlando = false
    erroreForte = false
    clearTimeout(riavvio)
    try { rec?.stop() } catch { /* già fermo */ }
    try { window.speechSynthesis?.cancel() } catch { /* niente voce */ }
    aggiornaMic()
    mic.classList.remove('is-on')
    mic.setAttribute('aria-pressed', 'false')
    d.nota('microfono spento')
  }

  // ── i comandi a schermo ───────────────────────────────────────────────────

  for (const [nome, hex] of NOMI_COLORI) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'lab-colore'
    b.dataset.colore = hex
    b.setAttribute('aria-label', nome)
    b.setAttribute('aria-pressed', 'false')
    b.style.setProperty('--colore', hex)
    b.innerHTML = '<span></span>'
    b.addEventListener('click', () => esegui(nome))
    coloriBox.append(b)
  }

  function segnaColore() {
    for (const b of coloriBox.querySelectorAll('[data-colore]')) {
      const on = b.dataset.colore.toLowerCase() === colore.toLowerCase()
      b.classList.toggle('is-on', on)
      b.setAttribute('aria-pressed', String(on))
    }
  }

  esempi.addEventListener('click', (e) => {
    const b = e.target.closest('[data-comando]')
    if (!b) return
    esegui(b.dataset.comando)
    input.value = ''
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const frase = input.value.trim()
    if (!frase) return
    esegui(frase)
    input.value = ''
  })

  mic.addEventListener('click', () => {
    if (ascolto) fermaAscolto()
    else {
      try { speechSynthesis?.cancel() } catch { /* niente voce */ }
      parlando = false
      avviaAscolto()
    }
  })

  linguaSel.addEventListener('change', () => {
    lingua = linguaSel.value
    if (rec) {
      try { rec.stop() } catch { /* già fermo */ }
      rec = null
    }
    if (ascolto) {
      ascolto = false
      setTimeout(() => avviaAscolto(), 120)
    }
    d.nota(`lingua: ${lingua}`, 'ok')
  })

  rispostaBtn.addEventListener('click', () => {
    voceAttiva = !voceAttiva
    rispostaBtn.setAttribute('aria-pressed', String(voceAttiva))
    rispostaBtn.textContent = `risponde: ${voceAttiva ? 'sì' : 'no'}`
    if (!voceAttiva) {
      try { window.speechSynthesis?.cancel() } catch { /* niente voce */ }
      parlando = false
      aggiornaMic()
    }
  })

  // ── accensione ────────────────────────────────────────────────────────────

  const osservatore = new ResizeObserver(ridimensiona)
  osservatore.observe(tela)

  ridimensiona()
  segnaColore()
  aggiornaMic()
  trascrivi('muro', 'il muro è pronto: scrivi un ordine o accendi il microfono.')
  if (!SR) {
    stato.textContent = 'scrivi un ordine: questo browser non ha il microfono'
    d.nota('solo testo · il microfono non c’è', 'attesa')
  } else if (!TTS) {
    d.nota('microfono pronto · la voce di risposta non c’è', 'attesa')
  } else {
    d.nota('scrivi o accendi il microfono')
  }

  d.suPulizia(() => {
    cancelAnimationFrame(raf)
    osservatore.disconnect()
    ascolto = false
    clearTimeout(riavvio)
    try { rec?.abort?.() } catch { /* già fermo */ }
    try { rec?.stop() } catch { /* già fermo */ }
    try { window.speechSynthesis?.cancel() } catch { /* niente voce */ }
  })

  ultimo = performance.now()
  raf = requestAnimationFrame(giro)
  d.apri()
  return d
}
