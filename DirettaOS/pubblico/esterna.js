// Diretta OS · il pezzo «Vista esterna»: la webcam di un portatile nella stessa rete, dentro una finestra.
// Il server (esterna.mjs) tiene solo l'ultimo fotogramma e lo manda come MJPEG: qui c'è la finestra, i suoi
// stati (in attesa, live, segnale perso) e niente da configurare. La grandezza e il posto sono quelli di tutti
// gli altri pezzi; si accende dalla regia quando il portatile è collegato. Il video è verde fosforo (radar) e
// la luce della scena, letta sul fotogramma, tinge i widget e decide da che parte cadono riflessi e ombre.

export const ESTERNA_NOMI = { esterna: 'Vista esterna' }
export const ESTERNA_DICE = { esterna: 'la webcam di un altro pc, in wifi: una finestra nella diretta (/o/esterna)' }
// (a destra, fra le spie e i meme: 560 × 315 più la riga sotto)
export const ESTERNA_POSTI = { '05': { esterna: [1340, 300, .85] }, '10': { esterna: [1340, 300, .85] } }

const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }

// ── la luce della scena, letta sulla webcam ──
// Come la bandiera guarda il muro dietro di sé, i widget della vista esterna guardano il fotogramma che hanno
// sotto: le zone illuminate danno il colore della luce, il loro centro da che parte arriva, la media quanta ce n'è.
// Si legge in piccolo (48 × 27), una volta ogni secondo e mezzo: basta per la luce e non pesa sul flusso.
export const LUCE_W = 48
export const LUCE_H = 27
const dentro = (x, a, b) => Math.min(b, Math.max(a, x))
export function misuraLuce(d, W, H) {
  const N = W * H
  const luma = new Float32Array(N)
  let somma = 0, somma2 = 0
  for (let i = 0; i < N; i++) {
    const l = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2] // 0…255
    luma[i] = l
    somma += l
    somma2 += l * l
  }
  const media = somma / N / 255
  const contrasto = Math.sqrt(Math.max(0, somma2 / N - (somma / N) ** 2)) / 255
  // il colore e il centro della luce: le zone chiare pesano il quadrato (una finestra, una lampada)
  let r = 0, g = 0, b = 0, peso = 0, cx = 0, cy = 0
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const p = j * W + i, l = luma[p] / 255
    if (l < 0.025) continue
    const w = l * l
    r += d[p * 4] / 255 * w
    g += d[p * 4 + 1] / 255 * w
    b += d[p * 4 + 2] / 255 * w
    peso += w
    cx += (i + 0.5) / W * w
    cy += (j + 0.5) / H * w
  }
  const cr = peso ? r / peso : 0.5, cg = peso ? g / peso : 0.5, cb = peso ? b / peso : 0.5
  const massimo = Math.max(cr, cg, cb, 0.001)
  const caldo = (cr - cb) / massimo // (> 0 calda, < 0 fredda)
  // (un filo di grigio: gli oggetti colorati non devono tingere troppo i widget)
  const tinta = [cr / massimo, cg / massimo, cb / massimo].map((v) => 0.62 + 0.38 * v)
  const cxi = peso ? cx / peso : 0.5
  const cyi = peso ? cy / peso : 0.5
  const direzione = dentro(contrasto / 0.16, 0, 1)
  const forza = Math.sqrt(dentro(media / 0.32, 0, 1))
  const verso = []
  if (direzione > 0.18) {
    if (cxi < 0.43) verso.push('da sinistra')
    else if (cxi > 0.57) verso.push('da destra')
    if (cyi < 0.4) verso.push("dall'alto")
    else if (cyi > 0.6) verso.push('dal basso')
  }
  if (!verso.length) verso.push('di fronte')
  return {
    media, contrasto, forza, caldo,
    colore: `rgb(${Math.round(tinta[0] * 255)} ${Math.round(tinta[1] * 255)} ${Math.round(tinta[2] * 255)})`,
    tinta: caldo > 0.12 ? 'calda' : caldo < -0.08 ? 'fredda' : 'neutra',
    esposizione: media < 0.04 ? 'buio' : media < 0.1 ? 'penombra' : 'luce piena',
    cxi, cyi, direzione,
    ombraX: dentro((0.5 - cxi) * 26 * direzione, -13, 13),
    ombraY: dentro((0.5 - cyi) * 22 * direzione, -10, 10),
    lumeX: dentro((cxi - 0.5) * 40 * direzione, -14, 14),
    lumeY: dentro((cyi - 0.5) * 34 * direzione, -10, 10),
    lumeXp: (cxi - 0.5) * 80 * direzione,
    lumeYp: (cyi - 0.5) * 80 * direzione,
    ruota: dentro(86 - caldo * 28, 68, 104), // (verde-giallo con la luce calda, verde-acqua con la fredda)
    lux: dentro(0.76 + Math.sqrt(media) * 0.5, 0.72, 1.08),
    verso: verso.join(', '),
  }
}

export function creaEsterna() {
  const el = $(`<div class="dx" data-stato="assente">
    <div class="dx-finestra">
      <img class="dx-foto dx-foto--a" alt="" decoding="async">
      <img class="dx-foto dx-foto--b" alt="" aria-hidden="true" decoding="async">
      <i class="dx-trama"></i>
      <i class="dx-scans"></i>
      <i class="dx-pass"></i>
      <i class="dx-onda"></i>
      <i class="dx-riflesso"></i>
      <svg class="dx-mirino" viewBox="0 0 120 68" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width=".8">
          <circle cx="60" cy="34" r="11"/>
          <path d="M60 16v7M60 45v7M39 34h7M74 34h7"/>
        </g>
      </svg>
      <div class="dx-vuoto">
        <svg viewBox="0 0 76 56" aria-hidden="true">
          <rect x="10" y="7" width="56" height="35" rx="4"/>
          <path d="M16 12h44v25H16z" class="dx-cielo"/>
          <circle cx="49" cy="20" r="4" class="dx-sole"/>
          <path d="M16 37l12-12 9 8 8-6 15 10z" class="dx-monte"/>
          <path d="M4 47h68l-4 5H8z"/>
        </svg>
        <b class="dx-vuoto-titolo">in attesa del portatile</b>
        <span class="dx-vuoto-dice">collegalo dalla regia</span>
      </div>
      <i class="dx-velo"></i>
      <i class="dx-vignetta"></i>
      <div class="dx-pillola dx-vetro"><i></i><span class="dx-stato">nessun segnale</span></div>
      <div class="dx-live dx-vetro"><i></i>LIVE</div>
      <span class="dx-luce dx-vetro" aria-hidden="true" title=""><i></i><span class="dx-luce-dice">luce</span></span>
    </div>
    <div class="dx-sotto dx-vetro">
      <span class="dx-nome">Vista esterna</span>
      <span class="dx-fps"></span>
    </div>
  </div>`)
  // Due strati: la foto nuova si carica dietro a quella che si vede e si scambia solo quando è pronta.
  // Prima ogni foto sostituiva la precedente e per un attimo la finestra restava vuota: era il «farfallio».
  const fotoA = el.querySelector('.dx-foto--a')
  const fotoB = el.querySelector('.dx-foto--b')
  let foto = fotoA
  const pillola = el.querySelector('.dx-pillola')
  const stato = el.querySelector('.dx-stato')
  const nome = el.querySelector('.dx-nome')
  const fps = el.querySelector('.dx-fps')
  const vuotoTitolo = el.querySelector('.dx-vuoto-titolo')
  const vuotoDice = el.querySelector('.dx-vuoto-dice')
  const luceChip = el.querySelector('.dx-luce')
  const luceTesto = el.querySelector('.dx-luce-dice')
  let src = '', ultimaRicarica = 0, ultimo = 0, segnale = 'assente', onAir = false, collegata = false
  let pollAnteprima = null, modoFallback = false // (se il browser non sa tenere aperto un MJPEG, si va a foto)
  // nel livello di Camo (la pagina da sola) il flusso è MJPEG, tenuto aperto dal browser. Nell'anteprima
  // della regia (dentro un iframe) bastano due foto al secondo: niente secondo flusso decodificato di nascosto.
  const dentroAnteprima = window.top !== window && new URLSearchParams(location.search).has('sfondo')

  // ── la luce, letta sulla webcam (una volta ogni secondo e mezzo) ──
  // La tela è minuscola: 48 × 27 bastano per il colore medio e per capire da che parte arriva la luce.
  const telaLuce = document.createElement('canvas')
  telaLuce.width = LUCE_W; telaLuce.height = LUCE_H
  const cxLuce = telaLuce.getContext('2d', { willReadFrequently: true })
  let luce = null, luceLetta = 0, luceTimer = null, luceDice = ''
  window.__esternaLuce = () => (luce ? { ...luce } : null) // (la regia la legge dall'anteprima, come per la bandiera)

  function applicaLuce(m) {
    const s = el.style
    s.setProperty('--luce', m.colore)
    s.setProperty('--luce-forza', m.forza.toFixed(3))
    s.setProperty('--ombra-x', `${m.ombraX.toFixed(1)}px`)
    s.setProperty('--ombra-y', `${m.ombraY.toFixed(1)}px`)
    s.setProperty('--lume-x', `${m.lumeX.toFixed(1)}px`)
    s.setProperty('--lume-y', `${m.lumeY.toFixed(1)}px`)
    s.setProperty('--lume-xp', `${m.lumeXp.toFixed(1)}%`)
    s.setProperty('--lume-yp', `${m.lumeYp.toFixed(1)}%`)
    s.setProperty('--radar-ruota', `${m.ruota.toFixed(1)}deg`)
    s.setProperty('--radar-lux', m.lux.toFixed(3))
    el.dataset.luce = m.tinta
    const dice = `luce ${m.tinta} · ${m.verso}`
    if (dice !== luceDice) {
      luceDice = dice
      luceTesto.textContent = dice
    }
    luceChip.title = `Luce ${m.tinta}, ${m.verso}: ${m.esposizione}, luminosità ${Math.round(m.media * 100)}%, contrasto ${Math.round(m.contrasto * 100)}%`
    luce = m
  }
  function studiaLuce(adesso = false) {
    if (document.hidden || !el.classList.contains('ha-foto')) return
    const t = performance.now()
    if (!adesso && t - luceLetta < 1300) return
    if (!foto.naturalWidth) return
    luceLetta = t
    try {
      cxLuce.save()
      try {
        // (se la finestra è specchiata, anche la luce arriva dal lato che si vede)
        if (el.classList.contains('specchia')) { cxLuce.translate(LUCE_W, 0); cxLuce.scale(-1, 1) }
        cxLuce.drawImage(foto, 0, 0, LUCE_W, LUCE_H)
      } finally { cxLuce.restore() }
      applicaLuce(misuraLuce(cxLuce.getImageData(0, 0, LUCE_W, LUCE_H).data, LUCE_W, LUCE_H))
    } catch { /* (fotogramma a metà: si riprova al prossimo giro) */ }
  }
  function luceAccendi() {
    if (luceTimer) return
    studiaLuce(true)
    luceTimer = setInterval(() => studiaLuce(), 1600)
  }
  function luceSpegni() { clearInterval(luceTimer); luceTimer = null }

  // quando una foto è pronta, prende il posto di quella visibile (senza buchi)
  function scambia(img) {
    if (img.dataset.url !== img.getAttribute('src')) return // (è arrivata una foto più nuova)
    img.classList.add('su')
    img.removeAttribute('aria-hidden')
    const altra = img === fotoA ? fotoB : fotoA
    altra.classList.remove('su')
    altra.setAttribute('aria-hidden', 'true')
    foto = img
    el.classList.add('ha-foto')
    studiaLuce(!luce) // (la prima foto subito; le altre col freno, tanto la luce cambia piano)
  }
  fotoA.addEventListener('load', () => scambia(fotoA))
  fotoB.addEventListener('load', () => scambia(fotoB))

  function caricaFoto() {
    const img = foto === fotoA ? fotoB : fotoA
    img.dataset.url = `/api/esterna/anteprima.jpg?t=${Date.now()}`
    img.src = img.dataset.url
  }
  function mettiFoto() {
    if (dentroAnteprima || modoFallback) {
      if (!pollAnteprima) {
        caricaFoto()
        pollAnteprima = setInterval(() => {
          if (!document.hidden) caricaFoto()
        }, dentroAnteprima ? 500 : 250)
      }
      return
    }
    const nuovo = `/api/esterna/quadro?v=${Date.now()}`
    if (foto.getAttribute('src') !== nuovo) {
      foto.dataset.url = nuovo
      foto.src = nuovo
      foto.classList.add('su') // (lo strato nuovo copre quello vecchio: al primo fotogramma è già un video)
      foto.removeAttribute('aria-hidden')
      const altra = foto === fotoA ? fotoB : fotoA
      altra.classList.remove('su')
      altra.setAttribute('aria-hidden', 'true')
      src = nuovo
      ultimaRicarica = Date.now()
      el.classList.add('ha-foto')
    }
  }
  function togliFoto() {
    clearInterval(pollAnteprima); pollAnteprima = null
    for (const img of [fotoA, fotoB]) {
      if (img.hasAttribute('src')) { img.removeAttribute('src'); img.removeAttribute('data-url') }
      img.classList.remove('su')
      img.setAttribute('aria-hidden', 'true')
    }
    src = ''
    el.classList.remove('ha-foto')
  }

  function aggiorna(s) {
    const dx = s.esterna ?? {}
    onAir = !!s.attivi?.esterna
    collegata = !!dx.collegata
    segnale = dx.segnale ?? 'assente'
    ultimo = dx.ultimo ?? 0
    el.classList.toggle('specchia', !!dx.specchia)
    el.classList.toggle('adatta', !!dx.adatta)
    el.dataset.stato = !collegata ? 'assente' : segnale === 'persa' ? 'persa' : ultimo ? 'live' : 'attesa'
    el.classList.toggle('persa', segnale === 'persa')
    el.classList.toggle('attesa', !collegata || !ultimo || segnale === 'attesa')
    vuotoTitolo.textContent = !collegata ? 'in attesa' : segnale === 'persa' ? 'segnale perso' : 'in arrivo'
    vuotoDice.textContent = !collegata ? 'apri il link sul portatile' : segnale === 'persa' ? 'aspetto che torni' : 'parte da sola'
    // il nome del portatile, se c'è
    const n = (dx.nome ?? '').trim() || 'Portatile'
    nome.textContent = collegata ? `Vista esterna · ${n}` : 'Vista esterna'
    fps.textContent = collegata && dx.fps ? `${dx.fps} fps` : ''
    fotoA.alt = fotoB.alt = collegata ? `Vista esterna da ${n}` : 'Vista esterna'
    // la pillola
    pillola.dataset.stato = el.dataset.stato
    if (!collegata) {
      if (segnale === 'attesa') stato.textContent = 'pronta'
      else stato.textContent = 'nessun segnale'
    } else if (segnale === 'persa') stato.textContent = 'segnale perso'
    else if (!ultimo) stato.textContent = 'sto arrivando…'
    else stato.textContent = 'in diretta'
    // la finestra si accende solo quando il pezzo è in onda: spenta non tiene aperto il flusso
    if (onAir && collegata && segnale !== 'assente') {
      luceAccendi() // (la luce si legge solo mentre c'è un fotogramma da guardare)
      if (!src && !pollAnteprima) mettiFoto()
      // (se il flusso si è impuntato dopo un riavvio, si richiede: l'SSE dice quando è arrivato l'ultimo fotogramma)
      if (ultimo && !pollAnteprima && Date.now() - ultimo > 7000 && Date.now() - ultimaRicarica > 4000) mettiFoto()
      // (qualche browser non sa tenere aperto un multipart/x-mixed-replace: dopo qualche secondo si passa alle foto)
      if (ultimo && !dentroAnteprima && !modoFallback && src && !pollAnteprima && Date.now() - ultimaRicarica > 4500 && !fotoA.naturalWidth && !fotoB.naturalWidth) {
        modoFallback = true
        togliFoto()
        mettiFoto()
      }
    } else {
      luceSpegni()
      togliFoto()
    }
  }

  return { el, aggiorna }
}
