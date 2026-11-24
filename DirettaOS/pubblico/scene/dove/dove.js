// «Dove vivo» — la mappa 3D della casa, in onda a schermo intero. Modulo della scena:
//   crea(ctx) → { el, mostra(su), giro(dt, t), aggiorna(stato), comando(v) }
// Il contratto è quello di pubblico/scene.js. Nessun dato geografico, nessun nome, nessun ufficio.
import * as THREE from '../lib/three.module.min.js'
import { costruisci } from './mondo.js'
import { tavolozza } from './tempo.js'
import { DATI } from './dati.js'

const RAD = Math.PI / 180
const GRADI = 180 / Math.PI
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const mescola = (a, b, t) => a + (b - a) * t
const angoloCorto = (a, b) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}
const adesso = () => performance.now()

// comandi / viste di prova (solo con ctx.prova)
const Q = new URLSearchParams(location.search)
const VISTE = {
  tre: { x: 4, y: -11, d: 78, h: 26, p: 33 },
  alto: { x: 4, y: -42, d: 315, h: 0, p: 86 },
  confine: { x: 2, y: -38, d: 345, h: 0, p: 84 },
  casa: { x: 0, y: -5, d: 30, h: 34, p: 19 },
  fontana: { x: -10, y: -16.5, d: 18, h: 38, p: 28 },
  capannone: { x: 8, y: -22, d: 28, h: -38, p: 26 },
  viale: { x: 18, y: 12, d: 26, h: 0, p: 10 },
  campi: { x: 32, y: -35, d: 185, h: -58, p: 42 },
  orizzonte: { x: 3, y: -4, d: 62, h: 0, p: 10 },
  giardino: { x: -2, y: -12, d: 42, h: 26, p: 27 },
}

// la visita guidata: pura funzione di ctx.tempo(), così tutte le pagine vedono lo stesso fotogramma
const TOUR = [
  { t: 0, x: 3, y: -8, d: 150, h: 22, p: 40 },
  { t: 12, x: -9, y: -16, d: 26, h: 38, p: 28 },
  { t: 25, x: -10, y: -16, d: 30, h: 150, p: 30 },
  { t: 36, x: -1, y: -5, d: 38, h: 32, p: 20 },
  { t: 48, x: 7, y: -21, d: 34, h: -38, p: 28 },
  { t: 60, x: 18, y: 12, d: 26, h: 0, p: 10 },
  { t: 72, x: 34, y: -34, d: 135, h: -58, p: 40 },
  { t: 84, x: 3, y: -12, d: 175, h: 18, p: 43 },
  { t: 96, x: 3, y: -8, d: 150, h: 22, p: 40 },
]
function tourA(t) {
  const durata = TOUR.at(-1).t
  const u = ((t % durata) + durata) % durata
  let i = 0
  while (i < TOUR.length - 2 && u > TOUR[i + 1].t) i++
  const a = TOUR[i], b = TOUR[i + 1]
  const k = clamp((u - a.t) / (b.t - a.t), 0, 1)
  const m = k * k * (3 - 2 * k) // smoothstep
  return { x: mescola(a.x, b.x, m), y: mescola(a.y, b.y, m), d: mescola(a.d, b.d, m), h: mescola(a.h, b.h, m) * RAD, p: mescola(a.p, b.p, m) * RAD }
}

export function crea(ctx) {
  const el = document.createElement('div')
  el.className = 'dvw'
  el.style.position = 'absolute'; el.style.left = '0'; el.style.top = '0'
  el.style.width = '1920px'; el.style.height = '1080px'; el.style.overflow = 'hidden'
  el.style.background = '#0b090e'
  if (!document.getElementById('dvw-stile')) {
    const link = document.createElement('link')
    link.id = 'dvw-stile'; link.rel = 'stylesheet'; link.href = '/scene/dove/dove.css'
    document.head.appendChild(link)
  }

  // ── interfaccia minima: bussola, riga ora/temperatura, attribuzione OSM ──
  const ui = document.createElement('div')
  ui.className = 'dvw-ui'
  ui.style.position = 'absolute'; ui.style.inset = '0'; ui.style.pointerEvents = 'none'; ui.style.zIndex = '3'
  ui.innerHTML = `
    <button class="dvw-bussola" type="button" aria-label="Nord in alto">
      <svg viewBox="-50 -50 100 100" aria-hidden="true">
        <circle cx="0" cy="0" r="43" class="dvw-anello"></circle>
        <g class="dvw-rosa">
          <path d="M0 -36 L7 -4 L0 3 L-7 -4 Z" class="dvw-ago-n"></path>
          <path d="M0 36 L5 6 L0 1 L-5 6 Z" class="dvw-ago-s"></path>
          <text x="0" y="-27" class="dvw-n">N</text>
          <text x="30" y="4" class="dvw-punto">E</text>
          <text x="0" y="35" class="dvw-punto">S</text>
          <text x="-30" y="4" class="dvw-punto">O</text>
        </g>
        <circle cx="0" cy="0" r="3.3" class="dvw-perno"></circle>
      </svg>
    </button>
    <div class="dvw-quando"><b class="dvw-ora">--:--</b><span class="dvw-gradi"></span><i class="dvw-meteo"></i></div>
    <div class="dvw-osm">© OpenStreetMap contributors</div>`
  el.appendChild(ui)
  const bussola = ui.querySelector('.dvw-bussola'), rosa = ui.querySelector('.dvw-rosa')
  const elOra = ui.querySelector('.dvw-ora'), elGradi = ui.querySelector('.dvw-gradi'), elMeteo = ui.querySelector('.dvw-meteo')

  let renderer = null, mondo = null, camera = null, su = false, pal = null, stato = null, meteo = null
  let contestoPerso = false, timerContesto = 0, ombre = !document.documentElement.classList.contains('niente-gpu')

  // ── ripiego senza WebGL: la pianta del lotto, disegnata in SVG ──
  function caduta() {
    const box = document.createElement('div')
    box.className = 'dvw-caduta'
    ui.remove()
    const xs = DATI.confine.map((p) => p[0]), ys = DATI.confine.map((p) => p[1])
    const x0 = Math.min(...xs) - 10, x1 = Math.max(...xs) + 10, y0 = Math.min(...ys) - 10, y1 = Math.max(...ys) + 10
    const W = 1920, H = 1080, s = Math.min((W * 0.76) / (x1 - x0), (H * 0.76) / (y1 - y0))
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    const X = (x) => (W / 2 + (x - cx) * s).toFixed(1), Y = (y) => (H / 2 - (y - cy) * s).toFixed(1)
    const path = (p) => p.map((q, i) => `${i ? 'L' : 'M'}${X(q[0])} ${Y(q[1])}`).join(' ') + ' Z'
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="dvw-cielo" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#26332e"/><stop offset="1" stop-color="#0b090e"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#dvw-cielo)"/>
      <path d="${path(DATI.confine)}" fill="none" stroke="#ccff00" stroke-opacity=".6" stroke-width="2"/>
      <path d="${path(DATI.case.casa.impronta)}" fill="#f6f4f8" fill-opacity=".16" stroke="#f6f4f8" stroke-width="2"/>
      <path d="${path(DATI.case.capannone.impronta)}" fill="#f6f4f8" fill-opacity=".12" stroke="#f6f4f8" stroke-width="2"/>
      <path d="${path(DATI.fonte.p)}" fill="#9d00ff" fill-opacity=".25" stroke="#9d00ff" stroke-width="2"/>
      <text x="${W - 34}" y="${H - 24}" text-anchor="end" font-family="gg sans, sans-serif" font-size="15" fill="#f6f4f8" fill-opacity=".55">© OpenStreetMap contributors</text>
    </svg>`
    el.appendChild(box)
    el.classList.add('dvw-accesa')
    return { el, mostra() {}, giro() {}, aggiorna() {}, comando() {} }
  }

  camera = new THREE.PerspectiveCamera(48, 1920 / 1080, 0.4, 2400)
  if (ctx.prova && Q.has('nogl')) return caduta()
  try {
    renderer = new THREE.WebGLRenderer({ antialias: ombre, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(1)
    renderer.setSize(1920, 1080, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = ombre
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.shadowMap.autoUpdate = false
    renderer.domElement.className = 'dvw-tela'
    renderer.domElement.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;display:block;z-index:0'
    el.appendChild(renderer.domElement)
    mondo = costruisci({ ombre })
    // la scena three non è un elemento: la disegno nella tela qui sotto
    renderer.domElement.addEventListener('webglcontextlost', (e) => { if (!renderer || e.target !== renderer.domElement) return; e.preventDefault(); contestoPerso = true })
  } catch (e) {
    console.warn('dove: niente WebGL', e)
    if (renderer) { try { renderer.dispose() } catch {} }
    return caduta()
  }

  // ── camera: bersaglio a terra, distanza, rotta (0 = nord), inclinazione ──
  const cam = { x: 4, y: -11, d: 78, h: 26 * RAD, p: 33 * RAD }
  const des = { ...cam }
  let seguendo = false, trascinando = false, mescolaTour = 0, ultimaAttivita = ctx.tempo()
  const forzaTour = ctx.prova && Q.get('tour') === '1'
  if (forzaTour) ultimaAttivita = ctx.tempo() - 30
  let daPubblicare = false, ultimaInviata = '', ultimoInvio = 0, inMovimento = false, quandoFermo = 0
  let volo = null, versoNord = false, ultimoAggiornamentoLuce = -1e9
  const inerzia = { x: 0, y: 0, h: 0, p: 0 }
  let ultimaMossa = 0
  const vista = ctx.prova ? VISTE[Q.get('vista')] : null
  const senzaTour = !!vista || Q.get('tour') === '0'
  if (vista) Object.assign(cam, { x: vista.x, y: vista.y, d: vista.d, h: vista.h * RAD, p: vista.p * RAD })
  Object.assign(des, cam)
  const limite = (c) => {
    c.d = clamp(c.d, 13, 430)
    c.p = clamp(c.p, 10 * RAD, 86 * RAD)
    const r = Math.hypot(c.x, c.y)
    if (r > 340) { c.x *= 340 / r; c.y *= 340 / r }
  }
  function applicaCamera() {
    const cp = Math.cos(cam.p), sp = Math.sin(cam.p)
    const tx = cam.x, tz = -cam.y
    camera.position.set(tx - Math.sin(cam.h) * cam.d * cp, Math.max(1.1, cam.d * sp), tz + Math.cos(cam.h) * cam.d * cp)
    camera.lookAt(tx, 0.9, tz)
    rosa.style.transform = `rotate(${-cam.h * GRADI}deg)`
  }

  // ── suolo sotto il puntatore ──
  const raggio = new THREE.Raycaster(), piano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), punto = new THREE.Vector3()
  function suolo(clientX, clientY) {
    const r = el.getBoundingClientRect()
    const nx = ((clientX - r.left) / r.width) * 2 - 1
    const ny = -((clientY - r.top) / r.height) * 2 + 1
    raggio.setFromCamera(new THREE.Vector2(nx, ny), camera)
    const p = raggio.ray.intersectPlane(piano, punto)
    return p ? { x: p.x, y: -p.z } : null
  }
  function segnaAttivita() { ultimaAttivita = ctx.tempo(); mescolaTour = 0; seguendo = false; daPubblicare = true }
  function segnaPubblicabile() { daPubblicare = true; inMovimento = true; quandoFermo = adesso() }

  // ── mouse / dito ──
  let dito = null, inizio = null, modo = 'pan'
  el.style.touchAction = 'none'
  el.addEventListener('pointerenter', () => { el.classList.add('dvw-interagito') })
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest?.('.dvw-bussola')) return
    if (e.button === 2) e.preventDefault()
    dito = e.pointerId; el.setPointerCapture(e.pointerId)
    modo = e.button === 2 || e.ctrlKey || e.metaKey ? 'ruota' : 'pan'
    inizio = { x: e.clientX, y: e.clientY, g: suolo(e.clientX, e.clientY), cam: { ...cam } }
    trascinando = true; volo = null; versoNord = false
    inerzia.x = inerzia.y = inerzia.h = inerzia.p = 0
    ultimaMossa = adesso()
    segnaAttivita()
    el.classList.add('dvw-trascina')
  })
  el.addEventListener('pointermove', (e) => {
    el.classList.add('dvw-interagito')
    if (!trascinando || e.pointerId !== dito || !inizio) return
    const dx = e.clientX - inizio.x, dy = e.clientY - inizio.y
    const prima = { x: cam.x, y: cam.y, h: cam.h, p: cam.p }
    if (modo === 'ruota') {
      cam.h = inizio.cam.h - dx * 0.005
      cam.p = clamp(inizio.cam.p + dy * 0.004, 10 * RAD, 86 * RAD)
    } else {
      const g = suolo(e.clientX, e.clientY)
      if (g && inizio.g) {
        cam.x = inizio.cam.x - (g.x - inizio.g.x)
        cam.y = inizio.cam.y - (g.y - inizio.g.y)
      } else {
        cam.x = inizio.cam.x - dx * cam.d * 0.0016
        cam.y = inizio.cam.y + dy * cam.d * 0.0016
      }
    }
    limite(cam)
    const dtm = Math.max(0.008, (adesso() - ultimaMossa) / 1000)
    inerzia.x = clamp((cam.x - prima.x) / dtm, -90, 90)
    inerzia.y = clamp((cam.y - prima.y) / dtm, -90, 90)
    inerzia.h = clamp((cam.h - prima.h) / dtm, -3, 3)
    inerzia.p = clamp((cam.p - prima.p) / dtm, -2, 2)
    ultimaMossa = adesso()
    des.x = cam.x; des.y = cam.y; des.d = cam.d; des.h = cam.h; des.p = cam.p
    segnaPubblicabile()
  })
  const fineDito = (e) => {
    if (e.pointerId !== dito) return
    trascinando = false; dito = null; inizio = null
    el.classList.remove('dvw-trascina')
    segnaAttivita(); daPubblicare = true
  }
  el.addEventListener('pointerup', fineDito)
  el.addEventListener('pointercancel', fineDito)
  el.addEventListener('contextmenu', (e) => e.preventDefault())
  el.addEventListener('wheel', (e) => {
    e.preventDefault()
    segnaAttivita(); volo = null; inerzia.x = inerzia.y = inerzia.h = inerzia.p = 0
    const g = suolo(e.clientX, e.clientY)
    const vecchio = cam.d
    cam.d = clamp(cam.d * Math.exp(clamp(e.deltaY, -220, 220) * 0.0012), 13, 430)
    if (g) { const f = cam.d / vecchio; cam.x = g.x + (cam.x - g.x) * f; cam.y = g.y + (cam.y - g.y) * f }
    limite(cam); des.x = cam.x; des.y = cam.y; des.d = cam.d
    segnaPubblicabile()
  }, { passive: false })
  el.addEventListener('dblclick', (e) => {
    const g = suolo(e.clientX, e.clientY)
    if (!g) return
    segnaAttivita()
    volo = { da: { ...cam }, a: { x: g.x, y: g.y, d: Math.min(cam.d, 72), h: cam.h, p: Math.min(cam.p, 48 * RAD) }, inizio: adesso(), durata: 1100 }
  })
  // tastiera
  const tasti = (e) => {
    if (!su) return
    const t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    const f = e.shiftKey ? 3 : 1
    let usato = true
    switch (e.key) {
      case 'ArrowUp': cam.y += cam.d * 0.16 * f; break
      case 'ArrowDown': cam.y -= cam.d * 0.16 * f; break
      case 'ArrowLeft': cam.x -= cam.d * 0.16 * f; break
      case 'ArrowRight': cam.x += cam.d * 0.16 * f; break
      case '+': case '=': cam.d *= 0.86; break
      case '-': case '_': cam.d *= 1.16; break
      case '0': case 'n': case 'N': versoNord = true; break
      default: usato = false
    }
    if (!usato) return
    e.preventDefault(); segnaAttivita(); volo = null; inerzia.x = inerzia.y = inerzia.h = inerzia.p = 0; limite(cam)
    des.x = cam.x; des.y = cam.y; des.d = cam.d; des.h = cam.h; des.p = cam.p
    segnaPubblicabile()
  }
  window.addEventListener('keydown', tasti)

  bussola.addEventListener('click', (e) => {
    e.stopPropagation()
    segnaAttivita(); versoNord = true; volo = null; inerzia.x = inerzia.y = inerzia.h = inerzia.p = 0
    des.h = cam.h; des.x = cam.x; des.y = cam.y; des.d = cam.d; des.p = cam.p
    segnaPubblicabile()
  })

  // ── stato, luce, meteo ──
  function ricalcola() {
    pal = tavolozza(ctx.ora(), meteo)
    if (mondo) { mondo.aggiornaLuce(pal); mondo.aggiornaMeteo(pal) }
    if (renderer) { renderer.toneMappingExposure = pal.esposizione; renderer.shadowMap.needsUpdate = true }
    aggiornaOrologio()
  }
  function aggiornaOrologio() {
    if (!elOra) return
    const d = ctx.ora()
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0')
    const testo = `${hh}:${mm}`
    if (testo !== elOra.textContent) elOra.textContent = testo
    const m = meteo
    elGradi.textContent = m && Number.isFinite(+m.gradi) ? `${Math.round(+m.gradi)}°` : ''
    elMeteo.textContent = m?.testo ?? ''
  }
  function aggiorna(statoNuovo) {
    stato = statoNuovo
    if (statoNuovo?.meteo) meteo = statoNuovo.meteo
    ricalcola()
  }

  // ── comandi dalle altre pagine ──
  function comando(v) {
    if (!v || !Array.isArray(v.c) || v.c.length < 5) return
    if (trascinando) return
    const [x, y, d, h, p] = v.c.map(Number)
    if (![x, y, d, h, p].every(Number.isFinite)) return
    des.x = x; des.y = y; des.d = clamp(d, 13, 430); des.h = h * RAD; des.p = clamp(p * RAD, 10 * RAD, 86 * RAD)
    seguendo = true; mescolaTour = 0; ultimaAttivita = ctx.tempo(); daPubblicare = false
    inerzia.x = inerzia.y = inerzia.h = inerzia.p = 0
    limite(des)
  }

  // ── visibilità e contesto ──
  function nuovoRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: ombre, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(1); renderer.setSize(1920, 1080, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = pal?.esposizione ?? 1
    renderer.shadowMap.enabled = ombre; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false
    renderer.domElement.className = 'dvw-tela'
    renderer.domElement.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;display:block;z-index:0'
    renderer.domElement.addEventListener('webglcontextlost', (e) => { if (!renderer || e.target !== renderer.domElement) return; e.preventDefault(); contestoPerso = true })
    el.appendChild(renderer.domElement)
    contestoPerso = false
    if (pal) { renderer.toneMappingExposure = pal.esposizione; renderer.shadowMap.needsUpdate = true }
  }
  function mostra(suNuovo) {
    su = !!suNuovo
    el.classList.toggle('dvw-accesa', su)
    if (su) {
      clearTimeout(timerContesto)
      if (!renderer || contestoPerso) {
        if (renderer) { try { renderer.dispose() } catch {} if (renderer.domElement?.parentNode) renderer.domElement.remove() }
        try { nuovoRenderer() } catch (e) { console.warn('dove: contesto non ricostruito', e); return }
      }
      ultimaAttivita = forzaTour ? ctx.tempo() - 30 : ctx.tempo(); mescolaTour = 0; daPubblicare = false; inMovimento = false
      ricalcola()
      applicaCamera()
      renderer.render(mondo.scena, camera)
    } else {
      clearTimeout(timerContesto)
      timerContesto = setTimeout(() => {
        if (su || !renderer) return
        try { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove() } catch {}
        renderer = null; contestoPerso = true
      }, 20000)
    }
  }

  // ── il giro: camera, visita guidata, pubblicazione ──
  function passoCamera(dt, tScena) {
    const inattivo = tScena - ultimaAttivita
    if (!senzaTour && !trascinando && inattivo > 20) mescolaTour = Math.min(1, mescolaTour + dt / 2.4)
    else mescolaTour = Math.max(0, mescolaTour - dt * 3)
    if (mescolaTour > 0.001) {
      const tt = tourA(tScena)
      const k = mescolaTour * mescolaTour * (3 - 2 * mescolaTour)
      cam.x = mescola(cam.x, tt.x, k); cam.y = mescola(cam.y, tt.y, k); cam.d = mescola(cam.d, tt.d, k)
      cam.h += angoloCorto(cam.h, tt.h) * k; cam.p = mescola(cam.p, tt.p, k)
    }
    // volo del doppio clic
    if (volo) {
      const k = clamp((adesso() - volo.inizio) / volo.durata, 0, 1)
      const m = k * k * (3 - 2 * k)
      cam.x = mescola(volo.da.x, volo.a.x, m); cam.y = mescola(volo.da.y, volo.a.y, m); cam.d = mescola(volo.da.d, volo.a.d, m)
      cam.h = volo.da.h + angoloCorto(volo.da.h, volo.a.h) * m; cam.p = mescola(volo.da.p, volo.a.p, m)
      if (k >= 1) volo = null
      daPubblicare = true; inMovimento = true; quandoFermo = adesso()
    }
    // nord in alto
    if (versoNord) {
      const diff = angoloCorto(cam.h, 0)
      cam.h += diff * Math.min(1, dt * 5.5)
      daPubblicare = true; inMovimento = true; quandoFermo = adesso()
      if (Math.abs(diff) < 0.002) { cam.h = 0; versoNord = false }
    }
    // inerzia del trascinamento
    if (!trascinando) {
      if (!seguendo && !volo && mescolaTour < 0.01 && (Math.abs(inerzia.x) + Math.abs(inerzia.y) + Math.abs(inerzia.h) + Math.abs(inerzia.p) > 0.12)) {
        cam.x += inerzia.x * dt; cam.y += inerzia.y * dt
        cam.h += inerzia.h * dt; cam.p += inerzia.p * dt
        limite(cam); segnaPubblicabile()
      }
      const freno = Math.exp(-dt * 3.2)
      inerzia.x *= freno; inerzia.y *= freno; inerzia.h *= freno; inerzia.p *= freno
    }
    // segue i comandi di un'altra pagina, con morbidezza
    if (seguendo && !trascinando && mescolaTour < 0.01) {
      const k = 1 - Math.exp(-dt * 6.5)
      cam.x = mescola(cam.x, des.x, k); cam.y = mescola(cam.y, des.y, k); cam.d = mescola(cam.d, des.d, k)
      cam.h += angoloCorto(cam.h, des.h) * k; cam.p = mescola(cam.p, des.p, k)
    }
    limite(cam)
    applicaCamera()
    // pubblica al massimo 12 volte al secondo, più un messaggio finale
    if (daPubblicare && !seguendo && !trascinando && mescolaTour < 0.01 && !senzaTour) {
      const firma = `${cam.x.toFixed(2)},${cam.y.toFixed(2)},${cam.d.toFixed(1)},${(cam.h * GRADI).toFixed(1)},${(cam.p * GRADI).toFixed(1)}`
      const ora = adesso()
      if (firma !== ultimaInviata) {
        if (ora - ultimoInvio >= 83) {
          try { ctx.manda({ c: [+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.d.toFixed(1), +(cam.h * GRADI).toFixed(1), +(cam.p * GRADI).toFixed(1)] }) } catch {}
          ultimaInviata = firma; ultimoInvio = ora; quandoFermo = ora; inMovimento = true
        }
      } else if (inMovimento && ora - quandoFermo > 260) {
        try { ctx.manda({ c: [+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.d.toFixed(1), +(cam.h * GRADI).toFixed(1), +(cam.p * GRADI).toFixed(1)] }) } catch {}
        inMovimento = false; daPubblicare = false
      }
    }
  }

  let prossimoOrologio = 0
  function giro(dt, t) {
    if (!su || !renderer || contestoPerso) return
    const tScena = ctx.tempo()
    passoCamera(dt, tScena)
    mondo.anima(dt, t, camera, { x: cam.x, z: -cam.y })
    renderer.render(mondo.scena, camera)
    if (t > prossimoOrologio) {
      prossimoOrologio = t + 1
      aggiornaOrologio()
    }
    if (tScena - ultimoAggiornamentoLuce > 20) { ultimoAggiornamentoLuce = tScena; ricalcola() }
  }

  // primo stato (la prova lo manda subito dopo; in onda arriva dal server)
  if (ctx.stato()) aggiorna(ctx.stato())
  else ricalcola()
  applicaCamera()
  ultimoAggiornamentoLuce = ctx.tempo()
  if (ctx.prova) window.__dove = { renderer, camera, cam, des, mondo, ricalcola }

  return { el, mostra, giro, aggiorna, comando }
}
