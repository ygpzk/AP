// «Dove vivo» — la casa in 3D, in onda a schermo intero. Rifatta il 25 novembre 2026 con Babylon.js (prima three.js):
// edifici dalle foto, luce del sole e della luna vere, ombre morbide, occlusione ambientale, la stagione degli alberi,
// il meteo vero (nuvole, nebbia, pioggia, neve, lampi). Modulo della scena:
//   crea(ctx) → { el, mostra(su), giro(dt, t), aggiorna(stato), comando(v) }
// Il contratto è quello di pubblico/scene.js. Nessun dato geografico, nessun nome, nessun ufficio.
// I pezzi: luce.js (sole, luna, stagione, tavolozza) · tele.js (texture dipinte) · geo.js (geometria) · edifici.js
// (casa e capannone) · esterni.js (piscina, pergolato, reti, cancello, trattore) · verde.js (alberi e siepi) ·
// terra.js (il terreno vicino e la campagna lontana) · cielo.js (la cupola) · dati.js (il rilievo, in metri locali).
import {
  Engine, Scene, Vector3, Color3, Color4, TargetCamera, DirectionalLight, HemisphericLight, ShadowGenerator, Mesh, VertexData,
  PBRMaterial, StandardMaterial, Texture, DynamicTexture, RenderTargetTexture, ReflectionProbe, ImageProcessingConfiguration,
  DefaultRenderingPipeline, SSAO2RenderingPipeline, ParticleSystem, Constants, CreatePlane, Logger,
} from '../lib/babylon/babylon.js'
import { DATI } from './dati.js'
import { tavolozza, stagione } from './luce.js'
import * as TELE from './tele.js'
import { Pezzi } from './geo.js'
// (i fabbricati dal CAD, poligoni a tinta unita; edifici.js è la versione di prima, dalle foto, con le texture dipinte)
import { costruisciFabbricati, ANGOLO, IMPRONTE } from './fabbricati.js'
import { costruisciEsterni } from './esterni.js'
import { piantaAlberi, creaAlberi, creaLontani } from './verde.js'
import { dipingiMappa, dipingiLontano, filariLontani, MAPPA, LONTANO } from './terra.js'
import { creaCielo } from './cielo.js'

// le sagome a terra dei fabbricati: quelle del CAD al posto di quelle della planimetria (servono al terreno e agli alberi)
DATI.case.casa.impronta = IMPRONTE.casa
DATI.case.capannone.impronta = IMPRONTE.capannone

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
const pausa = () => new Promise((r) => setTimeout(r, 0))
const lin = (c) => c.map((v) => Math.pow(v, 2.2))
const linHex = (h) => lin([((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255])
const C3 = (a, k = 1) => new Color3(a[0] * k, a[1] * k, a[2] * k)

// Chi disegna il WebGL di questa pagina: la scheda video o il processore. Senza GPU (la regia aperta con «Chromium
// senza GPU», Edge con l'accelerazione spenta) il WebGL lo fa il Microsoft Basic Render Driver: la mappa intera lì
// va a 3 fotogrammi al secondo e si mangia il processore. Si chiede una volta sola, a una tela minuscola.
// (?gl=software nella prova fa finta di non averla)
let GRAFICA = null
function grafica() {
  if (GRAFICA) return GRAFICA
  if (new URLSearchParams(location.search).get('gl') === 'software') return (GRAFICA = 'software')
  try {
    const c = document.createElement('canvas'); c.width = c.height = 4
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl) return (GRAFICA = 'software')
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const chi = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    GRAFICA = /SwiftShader|Basic Render|WARP|llvmpipe|softpipe|Software/i.test(chi) ? 'software' : 'gpu'
  } catch { GRAFICA = 'gpu' }
  return GRAFICA
}

// dal telaio della casa (u, v) ai metri locali (x est, y nord)
const CA = Math.cos(ANGOLO), SA = Math.sin(ANGOLO)
const uv2xy = (u, v) => [u * CA - v * SA, u * SA + v * CA]

// viste di prova (solo con ctx.prova): bersaglio a terra, distanza, rotta (0 = nord), inclinazione
const Q = new URLSearchParams(location.search)
const VISTE = {
  tre: { x: 3, y: -11, d: 96, h: -32, p: 40 },
  alto: { x: 3, y: -20, d: 290, h: -19, p: 80 },
  portico: { x: 2.8, y: -8.6, d: 26, h: 35, p: 12 },
  casa: { x: 1, y: -4, d: 52, h: -40, p: 30 },
  retro: { x: -1, y: 4, d: 50, h: 161, p: 26 },
  fontana: { x: -10, y: -15.5, d: 26, h: -70, p: 30 },
  pergolato: { x: -17, y: -5, d: 24, h: 60, p: 24 },
  capannone: { x: 8, y: -25, d: 40, h: -19, p: 28 },
  viale: { x: 22, y: 6, d: 42, h: 162, p: 22 },
  campi: { x: 30, y: -40, d: 200, h: -58, p: 40 },
  orizzonte: { x: 3, y: -6, d: 70, h: -19, p: 9 },
}
// la visita guidata: pura funzione di ctx.tempo(), così tutte le pagine vedono lo stesso fotogramma
const TOUR = [
  { t: 0, x: 3, y: -11, d: 96, h: -32, p: 40 },
  { t: 13, x: 2.8, y: -8.6, d: 26, h: 35, p: 12 },
  { t: 26, x: -10, y: -15.5, d: 28, h: -70, p: 27 },
  { t: 38, x: -16, y: -5, d: 30, h: 40, p: 24 },
  { t: 50, x: -1, y: 4, d: 52, h: 161, p: 25 },
  { t: 62, x: 22, y: 6, d: 44, h: 162, p: 22 },
  { t: 74, x: 8, y: -25, d: 44, h: -19, p: 28 },
  { t: 86, x: 12, y: -30, d: 190, h: -48, p: 44 },
  { t: 100, x: 3, y: -11, d: 96, h: -32, p: 40 },
]
function tourA(t) {
  const durata = TOUR.at(-1).t
  const u = ((t % durata) + durata) % durata
  let i = 0
  while (i < TOUR.length - 2 && u > TOUR[i + 1].t) i++
  const a = TOUR[i], b = TOUR[i + 1]
  const k = clamp((u - a.t) / (b.t - a.t), 0, 1)
  const m = k * k * (3 - 2 * k)
  return { x: mescola(a.x, b.x, m), y: mescola(a.y, b.y, m), d: mescola(a.d, b.d, m), h: (a.h + angoloCorto(a.h * RAD, b.h * RAD) * GRADI * m) * RAD, p: mescola(a.p, b.p, m) * RAD }
}

// ── le zone a terra (ghiaia, marciapiedi): servono al terreno e a non piantare alberi dove non va ──
function sposta(p, d) {
  let A = 0
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; A += p[i][0] * q[1] - q[0] * p[i][1] }
  const s = A > 0 ? 1 : -1
  return p.map((q, i) => {
    const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length]
    const l1 = Math.hypot(q[0] - a[0], q[1] - a[1]) || 1, l2 = Math.hypot(b[0] - q[0], b[1] - q[1]) || 1
    const n1 = [((q[1] - a[1]) / l1) * s, (-(q[0] - a[0]) / l1) * s], n2 = [((b[1] - q[1]) / l2) * s, (-(b[0] - q[0]) / l2) * s]
    let nx = n1[0] + n2[0], ny = n1[1] + n2[1]
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l
    const c = Math.max(0.4, nx * n1[0] + ny * n1[1])
    return [q[0] + (nx * d) / c, q[1] + (ny * d) / c]
  })
}
const dentro = (p, poly) => { let d = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) d = !d } return d }
function distLinea(p, linea) {
  let m = Infinity
  for (let i = 0; i < linea.length - 1; i++) {
    const a = linea[i], b = linea[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l, 0, 1)
    m = Math.min(m, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t))
  }
  return m
}
const VIALE = [[17.7, 29.5], ...DATI.viale]
function zone() {
  const R = (pts) => pts.map(([u, v]) => uv2xy(u, v))
  const casa = DATI.case.casa.impronta, cap = DATI.case.capannone.impronta
  return {
    cortile: R([[-9.6, -8.0], [16.4, -8.0], [16.4, -13.4], [15.8, -27.6], [9.8, -27.8], [9.8, -19.3], [-9.6, -19.3]]),
    pergolato: R([[-21.4, -2.8], [-14.2, -2.8], [-14.2, 5.2], [-21.4, 5.2]]),
    vialetto: R([[-9.4, -11.6], [-12.6, -9.6], [-16.4, -7.2], [-19.4, -4.4], [-20.6, -1.4]]),
    casa: sposta(casa, 1.0), capannone: sposta(cap, 1.0), casaLarga: sposta(casa, 3.2), capLarga: sposta(cap, 3.2),
    fonte: sposta(DATI.fonte.p.slice(0, -1), 3.0),
  }
}

// ═══════════════ il mondo: motore, scena, luci, materiali, tutto ═══════════════
async function costruisciMondo(canvas, { leggero, software = false, lato = [1920, 1080] }) {
  Logger.LogLevels = Logger.ErrorLogLevel
  const engine = new Engine(canvas, false, { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance', alpha: false, antialias: false, doNotHandleContextLost: false }, false)
  engine.setSize(lato[0], lato[1])
  engine.enableOfflineSupport = false
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.05, 0.05, 0.06, 1)
  scene.skipPointerMovePicking = true
  scene.blockMaterialDirtyMechanism = false
  scene.fogMode = Scene.FOGMODE_EXP2
  scene.fogDensity = 0.0008
  const ip = scene.imageProcessingConfiguration
  ip.toneMappingEnabled = true
  ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES
  ip.contrast = 1.12
  ip.exposure = 1

  const camera = new TargetCamera('cam', new Vector3(0, 60, -90), scene)
  camera.fov = 40 * RAD; camera.minZ = 0.6; camera.maxZ = 7200
  camera.setTarget(new Vector3(0, 0, 0))

  // le luci: il sole (o la luna) con le ombre, il cielo che riempie
  const sole = new DirectionalLight('sole', new Vector3(-0.3, -0.8, 0.4), scene)
  sole.autoUpdateExtends = false; sole.autoCalcShadowZBounds = false
  sole.orthoLeft = -170; sole.orthoRight = 170; sole.orthoTop = 170; sole.orthoBottom = -170
  sole.shadowMinZ = 1; sole.shadowMaxZ = 1400
  const cielo = new HemisphericLight('cielo', new Vector3(0, 1, 0), scene)
  let ombre = null
  if (!leggero) {
    ombre = new ShadowGenerator(4096, sole, true)
    ombre.usePercentageCloserFiltering = true
    ombre.filteringQuality = ShadowGenerator.QUALITY_HIGH
    ombre.bias = 0.0007; ombre.normalBias = 0.02
    ombre.getShadowMap().refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE
  }
  const caster = (m) => { if (ombre) ombre.addShadowCaster(m, false) }

  // il cielo e la sonda che lo specchia (vetri, acqua, pannelli)
  const volta = creaCielo(scene)
  const sonda = new ReflectionProbe('riflesso', 128, scene, true, true)
  sonda.renderList.push(volta.mesh)
  sonda.position = new Vector3(0, 30, -15)
  sonda.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE
  const riflesso = sonda.cubeTexture

  // ── texture e materiali ──
  const tex = (nome, canvas, { normale = false, alpha = false, scala = 1 } = {}) => {
    const t = new DynamicTexture(nome, canvas, scene, true, Texture.TRILINEAR_SAMPLINGMODE)
    t.update(true)
    t.wrapU = Texture.WRAP_ADDRESSMODE; t.wrapV = Texture.WRAP_ADDRESSMODE
    t.anisotropicFilteringLevel = 8
    if (normale) t.gammaSpace = false
    if (alpha) t.hasAlpha = true
    t.uScale = scala; t.vScale = scala
    return t
  }
  const pbr = (nome, o = {}) => {
    const m = new PBRMaterial(nome, scene)
    m.metallic = o.metal ?? 0; m.roughness = o.rough ?? 0.92
    if (o.col) m.albedoTexture = o.col
    m.albedoColor = o.colore ? C3(o.colore) : new Color3(1, 1, 1)
    if (o.nor) { m.bumpTexture = o.nor; m.bumpTexture.level = o.bump ?? 1 }
    if (o.riflesso) { m.reflectionTexture = riflesso; m.environmentIntensity = o.riflesso }
    if (o.doppio) m.backFaceCulling = false
    if (o.alpha) { m.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST; m.alphaCutOff = o.taglio ?? 0.42; m.useAlphaFromAlbedoTexture = true }
    m.maxSimultaneousLights = 2
    m.enableSpecularAntiAliasing = true
    return m
  }
  const sta = stagione(new Date())
  const cem = TELE.cemento(); await pausa()
  const mat = TELE.mattone(); await pausa()
  const cop = TELE.coppi(); await pausa()
  const per = TELE.persiana(), por = TELE.porta(), leg = TELE.legno(), pan = TELE.pannello(), pia = TELE.piastrelle(), cot = TELE.cotto(), ret = TELE.rete()
  const acq = TELE.acqua(); await pausa()
  const gra = TELE.grana(); await pausa()
  const M = {}
  M.cemento = pbr('cemento', { col: tex('cemento', cem.col, { scala: 0.25 }), colore: [0.78, 0.8, 0.8], nor: tex('cemento-n', cem.nor, { normale: true, scala: 0.25 }), bump: 0.55, rough: 0.9 })
  M.cementoDentro = pbr('cementoDentro', { colore: [0.12, 0.12, 0.12], rough: 1 })
  M.scuro = pbr('scuro', { colore: [0.018, 0.018, 0.02], rough: 1 })
  M.mattone = pbr('mattone', { col: tex('mattone', mat.col), nor: tex('mattone-n', mat.nor, { normale: true }), bump: 0.7, rough: 0.88 })
  M.coppi = pbr('coppi', { col: tex('coppi', cop.col, { scala: 1 / 3 }), nor: tex('coppi-n', cop.nor, { normale: true, scala: 1 / 3 }), bump: 1.1, rough: 0.72 })
  M.colmo = pbr('colmo', { col: tex('colmo', cop.col, { scala: 1 / 3 }), colore: [0.7, 0.66, 0.62], rough: 0.75 })
  M.sottotetto = pbr('sottotetto', { col: tex('sottotetto', leg.col, { scala: 0.6 }), colore: [0.75, 0.7, 0.65], rough: 0.9 })
  M.fascia = pbr('fascia', { colore: linHex(0x2e2219), rough: 0.55, metal: 0.2 })
  M.gronda = pbr('gronda', { colore: linHex(0x33241a), rough: 0.42, metal: 0.55 })
  M.vetro = pbr('vetro', { colore: [0.015, 0.02, 0.025], rough: 0.06, riflesso: 0.9 })
  M.vetroAcceso = pbr('vetroAcceso', { colore: [0.02, 0.02, 0.02], rough: 0.08, riflesso: 0.6 })
  M.vetroAcceso.emissiveColor = C3(linHex(0xffb15e))
  M.vetroAcceso.emissiveIntensity = 0
  M.telaio = pbr('telaio', { colore: linHex(0x2c3d33), rough: 0.6 })
  M.telaioChiaro = pbr('telaioChiaro', { colore: [0.55, 0.57, 0.6], rough: 0.35, metal: 0.8 })
  M.persiana = pbr('persiana', { col: tex('persiana', per.col), nor: tex('persiana-n', per.nor, { normale: true }), bump: 0.8, rough: 0.6, doppio: true })
  M.porta = pbr('porta', { col: tex('porta', por.col), rough: 0.62 })
  M.metallo = pbr('metallo', { colore: linHex(0x2b2d30), rough: 0.5, metal: 0.6 })
  M.pannello = pbr('pannello', { col: tex('pannello', pan.col), rough: 0.12, metal: 0.25, riflesso: 1.0 })
  M.cotto = pbr('cotto', { col: tex('cotto', cot.col), rough: 0.8 })
  M.piastrelle = pbr('piastrelle', { col: tex('piastrelle', pia.col), rough: 0.3 })
  M.legno = pbr('legno', { col: tex('legno', leg.col), rough: 0.85 })
  M.palo = pbr('palo', { colore: [0.32, 0.33, 0.33], rough: 0.5, metal: 0.6 })
  M.rete = pbr('rete', { col: tex('rete', ret.col, { alpha: true }), alpha: true, taglio: 0.3, doppio: true, rough: 0.5, metal: 0.5 })
  M.cancello = pbr('cancello', { colore: linHex(0x3a3d40), rough: 0.45, metal: 0.7 })
  M.trattore = pbr('trattore', { colore: linHex(0x6a736d), rough: 0.55, metal: 0.25 })
  M.gomma = pbr('gomma', { colore: [0.015, 0.015, 0.015], rough: 0.85 })
  M.ruota = pbr('ruota', { colore: linHex(0xe0571c), rough: 0.5, metal: 0.2 })
  M.airone = pbr('airone', { colore: linHex(0x7d8389), rough: 0.5, metal: 0.4 })
  const acquaNor = tex('acqua-n', acq.nor, { normale: true, scala: 1 })
  M.acquaPiscina = pbr('acquaPiscina', { colore: linHex(0x3fc6cf), rough: 0.03, riflesso: 0.75, nor: acquaNor, bump: 0.35 })
  const acquaNor2 = tex('acqua-n2', acq.nor, { normale: true, scala: 0.2 })
  M.acqua = pbr('acqua', { colore: linHex(0x1f2d25), rough: 0.04, riflesso: 0.9, nor: acquaNor2, bump: 0.4 })
  for (const tipo of ['platano', 'scura']) { const c = TELE.corteccia(tipo); M['legno-' + tipo] = pbr('corteccia-' + tipo, { col: tex('corteccia-' + tipo, c.col, { scala: 1 }), ...(c.nor ? { nor: tex('corteccia-n-' + tipo, c.nor, { normale: true }), bump: 0.6 } : {}), rough: 0.95 }) }
  for (const tipo of ['platano', 'gelso', 'pioppo', 'tondo', 'siepe', 'vite']) { const f = TELE.foglie(tipo); M['foglie-' + tipo] = pbr('foglie-' + tipo, { col: tex('foglie-' + tipo, f.col, { alpha: true }), alpha: true, doppio: true, rough: 0.78 }); await pausa() }
  M.vite = M['foglie-vite']
  // i fabbricati dal CAD: tinte piatte, niente texture (i colori sono quelli delle foto: cemento grigio, spigoli e
  // davanzali in mattoni, coppi, persiane e porte verde scuro)
  M.pMuro = pbr('pMuro', { colore: linHex(0x9c9e99), rough: 0.9 })
  M.pDentro = pbr('pDentro', { colore: linHex(0x26262a), rough: 1 })
  M.pMattone = pbr('pMattone', { colore: linHex(0x98563d), rough: 0.88 })
  M.pDavanzale = pbr('pDavanzale', { colore: linHex(0xa06148), rough: 0.85 })
  M.pTetto = pbr('pTetto', { colore: linHex(0x8c4a35), rough: 0.78 })
  M.pColmo = pbr('pColmo', { colore: linHex(0x733a29), rough: 0.78 })
  M.pSotto = pbr('pSotto', { colore: linHex(0x6b5646), rough: 0.9 })
  M.pFascia = pbr('pFascia', { colore: linHex(0x33261d), rough: 0.6 })
  M.pPorta = pbr('pPorta', { colore: linHex(0x26372d), rough: 0.6 })
  M.pPersiana = pbr('pPersiana', { colore: linHex(0x2e4436), rough: 0.6, doppio: true })
  M.pSolaio = pbr('pSolaio', { colore: linHex(0x8e908b), rough: 0.9 })
  M.pCotto = pbr('pCotto', { colore: linHex(0xa8654a), rough: 0.85 })
  M.siepeAnima = pbr('siepeAnima',{ colore: linHex(0x1d3015), nor: tex('grana-n', gra.nor, { normale: true, scala: 0.5 }), bump: 1.2, rough: 0.95 })

  // ── gli edifici e quello che c'è fuori ──
  const ed = costruisciFabbricati()
  for (const m of ed.pz.mesh(scene, M, { nome: 'edifici' })) caster(m)
  await pausa()
  const fuori = costruisciEsterni(DATI, ed.T, sta)
  for (const m of fuori.pz.mesh(scene, M, { nome: 'fuori' })) caster(m)
  await pausa()

  // ── gli alberi (prima del terreno: il prato sotto è più scuro) ──
  const Z = zone()
  const evita = (x, y, tipo) => {
    const p = [x, y]
    if (dentro(p, Z.casaLarga) || dentro(p, Z.capLarga) || dentro(p, Z.fonte) || dentro(p, Z.cortile) || dentro(p, Z.pergolato)) return true
    if (distLinea(p, Z.vialetto) < 2.5) return true
    if (tipo !== 'platano' && distLinea(p, VIALE) < 4.2) return true
    if (tipo === 'platano' && distLinea(p, VIALE) < 2.6) return true
    for (const s of DATI.strade) if (distLinea(p, s.p) < s.w / 2 + 1.6) return true
    for (const a of DATI.acqua) if (distLinea(p, a.p) < a.w / 2 + 1.2) return true
    return false
  }
  const pianta = piantaAlberi(DATI, uv2xy, evita)
  // la siepe del viale sta sul lato est della ghiaia (i platani su quello ovest: li sposta verde.js)
  for (const s of pianta.siepi) if (s.p.some((q) => Math.hypot(q[0] - 19.2, q[1] - 22.1) < 4)) s.p = s.p.map((q) => [q[0] + 1.0, q[1] + 0.33])
  for (const m of creaAlberi(scene, pianta.alberi, pianta.siepi, sta, M, caster)) { /* (già aggiunti) */ }
  await pausa()

  // ── il terreno vicino: la mappa dipinta, con la grana fine sopra ──
  const chiave = `${Math.round(sta.giorno / 7)}`
  const zoneTerra = [
    { p: Z.casa, colore: '#a3a199' }, { p: Z.capannone, colore: '#a3a199' },
    { p: sposta(DATI.case.casa.impronta, 0.2), colore: '#3a3a38' }, { p: sposta(DATI.case.capannone.impronta, 0.2), colore: '#3a3a38' },
    { p: Z.cortile, colore: '#aaa293' }, { p: Z.pergolato, colore: '#a49b8b' },
    { linea: Z.vialetto, largo: 2.2, colore: '#aaa293' },
    { linea: VIALE, largo: 3.8, colore: '#a69d8c' },
    { linea: [DATI.viale[1], DATI.viale[2], DATI.viale[3], uv2xy(12.6, -24.8), uv2xy(13.2, -16)], largo: 4.2, colore: '#a69d8c' },
  ]
  const mappa = dipingiMappa(DATI, { alberi: pianta.alberi, siepi: pianta.siepi, zone: zoneTerra, sta, chiave })
  await pausa()
  const lontano = dipingiLontano(DATI, sta, chiave)
  await pausa()
  {
    const E = MAPPA
    const vd = new VertexData()
    const x0 = E.x0, x1 = E.x0 + E.lato, y0 = E.y0, y1 = E.y0 + E.lato
    vd.positions = [x0, 0, y0, x1, 0, y0, x1, 0, y1, x0, 0, y1]
    vd.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]
    vd.uvs = [0, 0, 1, 0, 1, 1, 0, 1]
    vd.indices = [0, 1, 2, 0, 2, 3]
    const suolo = new Mesh('suolo', scene)
    vd.applyToMesh(suolo)
    const mt = pbr('suolo', { col: tex('mappa', mappa, { scala: 1 }), nor: tex('suolo-n', gra.nor, { normale: true, scala: E.lato / 2.4 }), bump: 0.9, rough: 1 })
    mt.albedoTexture.anisotropicFilteringLevel = 16
    // la grana: un dettaglio che scurisce e schiarisce il colore, a 2,4 m
    mt.detailMap.isEnabled = true
    mt.detailMap.texture = tex('grana', gra.col, { scala: E.lato / 2.4 })
    mt.detailMap.diffuseBlendLevel = 0.42
    mt.detailMap.bumpLevel = 0
    mt.detailMap.roughnessBlendLevel = 0
    suolo.material = mt
    suolo.receiveShadows = true
    suolo.isPickable = false
    // la campagna lontana: un anello col buco dove c'è la mappa vicina
    const pz = new Pezzi()
    const cerchio = []
    for (let k = 0; k < 96; k++) { const a = (-k / 96) * Math.PI * 2; cerchio.push([Math.cos(a) * 3300, Math.sin(a) * 3300]) }
    const L = LONTANO
    pz.piano('lontano', cerchio, [[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]], (x, y) => [x, -0.02, y], [0, 1, 0], (x, y) => [(x - L.x0) / L.lato, (y - L.y0) / L.lato])
    const ml = pbr('lontano', { col: tex('lontano', lontano, { scala: 1 }), rough: 1 })
    for (const m of pz.mesh(scene, { lontano: ml }, { nome: 'campagna' })) m.receiveShadows = false
  }
  // i fossi: nastri d'acqua che specchiano il cielo
  {
    const pz = new Pezzi()
    for (const a of DATI.acqua) {
      for (let i = 0; i < a.p.length - 1; i++) {
        const p = a.p[i], q = a.p[i + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (L < 0.05) continue
        const nx = -(q[1] - p[1]) / L * (a.w / 2), ny = (q[0] - p[0]) / L * (a.w / 2)
        pz.quad('acqua', [p[0] - nx, 0.03, p[1] - ny], [q[0] - nx, 0.03, q[1] - ny], [q[0] + nx, 0.03, q[1] + ny], [p[0] + nx, 0.03, p[1] + ny], [0, 1, 0], [[p[0] / 4, p[1] / 4], [q[0] / 4, q[1] / 4], [q[0] / 4, q[1] / 4], [p[0] / 4, p[1] / 4]])
      }
    }
    pz.mesh(scene, M, { nome: 'fossi' })
  }
  // gli alberi lontani: carte incrociate con la sagoma, del colore della stagione
  {
    const sag = TELE.tela('sagoma', () => {
      const c = TELE.nuovaTela(128, 256), g = c.getContext('2d')
      const r = TELE.rng(5)
      g.fillStyle = 'rgb(70,60,50)'; g.fillRect(60, 150, 8, 106)
      for (let k = 0; k < 70; k++) { const a = r() * 6.28, rr = Math.sqrt(r()); const x = 64 + Math.cos(a) * rr * 50, y = 105 + Math.sin(a) * rr * 95; const v = 150 + r() * 100; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(x, y, 9 + r() * 12, 0, 6.29); g.fill() }
      return c
    })
    const verde = sta.foglie > 0.5 ? linHex(0x4f6b34) : sta.foglie > 0.15 ? linHex(0x8a7a45) : linHex(0x5f5648)
    const ma = pbr('lontani', { col: tex('sagoma', sag, { alpha: true }), colore: verde.map((v) => v * 1.6), alpha: true, doppio: true, rough: 1 })
    creaLontani(scene, filariLontani(sta), ma)
  }
  await pausa()

  // ── la sera: le lanterne accanto alle porte, con la pozza di luce a terra ──
  const lanterne = []
  {
    const alone = TELE.alone()
    const ta = tex('alone', alone.col, { alpha: true })
    const vetroL = new StandardMaterial('lanterna', scene)
    vetroL.disableLighting = true; vetroL.emissiveColor = C3(linHex(0xffc27a), 3)
    const glow = new StandardMaterial('bagliore', scene)
    glow.disableLighting = true; glow.emissiveTexture = ta; glow.opacityTexture = ta; glow.emissiveColor = C3(linHex(0xffb466), 0.8)
    glow.alphaMode = Constants.ALPHA_ADD; glow.disableDepthWrite = true; glow.backFaceCulling = false
    const pozza = new StandardMaterial('pozza', scene)
    pozza.disableLighting = true; pozza.emissiveTexture = ta; pozza.opacityTexture = ta; pozza.emissiveColor = C3(linHex(0xffa858), 0.12)
    pozza.alphaMode = Constants.ALPHA_ADD; pozza.disableDepthWrite = true
    const pzL = new Pezzi()
    for (const l of ed.luci) {
      const [x, y, z] = l.p
      pzL.scatola('lanterna', { p: (u, yy, v) => [x + u, yy, z + v], d: (a, b, c) => [a, b, c] }, -0.09, 0.09, y - 0.16, y + 0.16, -0.09, 0.09)
      const p = CreatePlane('pozza', { size: 6 }, scene)
      p.rotation.x = Math.PI / 2; p.position.set(x, 0.04, z); p.material = pozza; p.isPickable = false
      lanterne.push(p)
    }
    pzL.mesh(scene, { lanterna: vetroL }, { nome: 'lanterne' })
    lanterne.materiali = [vetroL, glow, pozza]
  }

  // ── pioggia, neve, le fontanelle della piscina ──
  const goc = tex('goccia', TELE.goccia().col, { alpha: true })
  const aloneT = tex('alone-p', TELE.alone().col, { alpha: true })
  const pioggia = new ParticleSystem('pioggia', 7000, scene)
  pioggia.particleTexture = goc
  pioggia.emitter = new Vector3(0, 30, 0)
  pioggia.createBoxEmitter(new Vector3(0.6, -1, 0.2), new Vector3(0.8, -1, 0.3), new Vector3(-80, 0, -80), new Vector3(80, 12, 80))
  pioggia.minSize = 0.05; pioggia.maxSize = 0.08; pioggia.minScaleY = 9; pioggia.maxScaleY = 14
  pioggia.minEmitPower = 15; pioggia.maxEmitPower = 19; pioggia.minLifeTime = 2.2; pioggia.maxLifeTime = 2.6
  pioggia.color1 = new Color4(0.75, 0.8, 0.88, 0.45); pioggia.color2 = new Color4(0.7, 0.75, 0.85, 0.3); pioggia.colorDead = new Color4(0.7, 0.75, 0.85, 0)
  pioggia.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED
  pioggia.blendMode = ParticleSystem.BLENDMODE_STANDARD
  pioggia.emitRate = 0
  const neve = new ParticleSystem('neve', 7000, scene)
  neve.particleTexture = aloneT
  neve.emitter = new Vector3(0, 25, 0)
  neve.createBoxEmitter(new Vector3(-0.3, -1, -0.2), new Vector3(0.3, -1, 0.2), new Vector3(-70, 0, -70), new Vector3(70, 8, 70))
  neve.minSize = 0.08; neve.maxSize = 0.16; neve.minEmitPower = 1.0; neve.maxEmitPower = 1.6; neve.minLifeTime = 14; neve.maxLifeTime = 18
  neve.color1 = new Color4(1, 1, 1, 0.9); neve.color2 = new Color4(0.92, 0.95, 1, 0.75); neve.colorDead = new Color4(1, 1, 1, 0)
  neve.blendMode = ParticleSystem.BLENDMODE_STANDARD
  neve.emitRate = 0
  const getti = fuori.getti.map((p, i) => {
    const s = new ParticleSystem('getto' + i, 400, scene)
    s.particleTexture = aloneT
    s.emitter = new Vector3(p[0], p[1], p[2])
    s.createPointEmitter(new Vector3(-0.15, 1, -0.15), new Vector3(0.15, 1, 0.15))
    s.minEmitPower = 2.4; s.maxEmitPower = 2.9; s.minLifeTime = 0.55; s.maxLifeTime = 0.7
    s.minSize = 0.05; s.maxSize = 0.11; s.gravity = new Vector3(0, -9.8, 0)
    s.color1 = new Color4(0.9, 0.97, 1, 0.75); s.color2 = new Color4(0.8, 0.92, 1, 0.55); s.colorDead = new Color4(1, 1, 1, 0)
    s.blendMode = ParticleSystem.BLENDMODE_STANDARD
    s.emitRate = 170
    s.start()
    return s
  })
  pioggia.start(); neve.start()

  // ── la resa: occlusione ambientale, poi tono, bagliore, grana ──
  let ao = null, pipe = null
  if (!leggero) {
    try {
      ao = new SSAO2RenderingPipeline('ao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [camera], false)
      ao.radius = 1.4; ao.totalStrength = 1.15; ao.base = 0.08; ao.samples = 16; ao.maxZ = 420; ao.minZAspect = 0.4; ao.expensiveBlur = true
    } catch (e) { console.warn('dove: niente occlusione ambientale', e); ao = null }
  }
  // (senza GPU niente passaggi dopo: col processore il bagliore e la vignetta costano metà del fotogramma. Il tono
  // e l'esposizione li fanno lo stesso i materiali, con la configurazione della scena)
  if (!software) {
    pipe = new DefaultRenderingPipeline('resa', true, scene, [camera])
    pipe.samples = leggero ? 1 : 4
    pipe.fxaaEnabled = !!leggero
    pipe.imageProcessingEnabled = true
    pipe.bloomEnabled = true; pipe.bloomThreshold = 0.9; pipe.bloomWeight = 0.22; pipe.bloomKernel = 48; pipe.bloomScale = 0.5
    pipe.sharpenEnabled = !leggero; if (pipe.sharpen) { pipe.sharpen.edgeAmount = 0.18; pipe.sharpen.colorAmount = 1 }
    pipe.grainEnabled = !leggero; if (pipe.grain) { pipe.grain.intensity = 5; pipe.grain.animated = true }
    pipe.imageProcessing.vignetteEnabled = true; pipe.imageProcessing.vignetteWeight = 0.8; pipe.imageProcessing.vignetteStretch = 0.4
    pipe.imageProcessing.vignetteColor = new Color4(0.02, 0.03, 0.02, 0)
  }

  // ── la luce di un momento ──
  let pal = null, lampo = 0, prossimoLampo = 4
  function aggiornaLuce(p) {
    pal = p
    const d = p.dirLuce
    sole.direction.set(-d[0], -d[1], -d[2])
    sole.position.set(d[0] * 700, d[1] * 700, d[2] * 700 - 20)
    sole.diffuse = C3(lin(p.coloreLuce)); sole.specular = sole.diffuse
    sole.intensity = p.intensitaLuce
    cielo.diffuse = C3(lin(p.cieloLuce)); cielo.groundColor = C3(lin(p.terraLuce)); cielo.specular = new Color3(0, 0, 0)
    cielo.intensity = p.intensitaCielo
    ip.exposure = p.esposizione
    scene.fogColor = C3(lin(p.foschia), 1.35)
    scene.fogDensity = 1.98 / p.visibilita
    volta.aggiorna(p)
    M.vetroAcceso.emissiveIntensity = p.finestre * 1.6
    for (const l of lanterne) l.setEnabled(p.finestre > 0.3)
    lanterne.materiali[0].emissiveColor = C3(linHex(0xffc27a), 3 * p.finestre)
    lanterne.materiali[1].emissiveColor = C3(linHex(0xffb466), 0.8 * p.finestre)
    lanterne.materiali[2].emissiveColor = C3(linHex(0xffa858), 0.1 * Math.max(0, p.finestre - 0.3) / 0.7)
    pioggia.emitRate = p.pioggia * 3600
    neve.emitRate = p.neve * 520
    if (ombre) ombre.getShadowMap().resetRefreshCounter()
    riflesso.resetRefreshCounter()
  }

  // ── a ogni giro: l'acqua che si muove, le nuvole, i lampi, la pioggia attorno alla camera ──
  function anima(dt, centro) {
    acquaNor.uOffset += dt * 0.012; acquaNor.vOffset += dt * 0.007
    acquaNor2.uOffset += dt * 0.004; acquaNor2.vOffset -= dt * 0.003
    if (pal?.lampi) {
      prossimoLampo -= dt
      if (prossimoLampo < 0) { lampo = 1; prossimoLampo = 5 + Math.random() * 14 }
    }
    lampo *= Math.exp(-dt * 7)
    volta.anima(dt, lampo * 0.9)
    if (lampo > 0.02) cielo.intensity = (pal?.intensitaCielo ?? 1) + lampo * 2.5
    else if (pal) cielo.intensity = pal.intensitaCielo
    pioggia.emitter.set(centro.x, 26, centro.z)
    neve.emitter.set(centro.x, 22, centro.z)
  }

  await scene.whenReadyAsync()
  return { engine, scene, camera, aggiornaLuce, anima, M }
}

// ═══════════════ la scena per la diretta ═══════════════
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

  // senza GPU: nell'anteprima dal vivo della regia la mappa non si disegna qui, si guarda quella di Camo (che la disegna
  // con la scheda video) e il mouse la guida da qui, come un telecomando. Senza l'immagine di Camo si disegna piccola
  // (960 × 540, senza ombre né occlusione), così resta girabile anche col processore.
  const software = grafica() === 'software'
  const leggero = software || document.documentElement.classList.contains('niente-gpu')
  const LATO = software ? [960, 540] : [1920, 1080]
  let mondo = null, costruendo = null, tela = null, su = false, pal = null, meteo = null, timerSpegni = 0, guasto = false, guastoAlle = 0
  let telecomando = false, senzaVivoDa = 0
  const aspettaVivo = software && new URLSearchParams(location.search).get('sfondo') === 'vivo' ? performance.now() + 4000 : 0
  const avviso = document.createElement('div')
  avviso.className = 'dvw-avviso'
  avviso.textContent = 'Questa finestra è senza GPU: vedi la mappa di Camo, la guidi da qui'
  el.appendChild(avviso)

  // ── ripiego senza WebGL: la pianta del lotto, disegnata in SVG ──
  function caduta() {
    if (el.querySelector('.dvw-caduta')) return
    const box = document.createElement('div')
    box.className = 'dvw-caduta'
    ui.style.display = 'none'
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
      <path d="${path(DATI.fonte.p)}" fill="#3fc6cf" fill-opacity=".3" stroke="#3fc6cf" stroke-width="2"/>
      <text x="${W - 34}" y="${H - 24}" text-anchor="end" font-family="gg sans, sans-serif" font-size="15" fill="#f6f4f8" fill-opacity=".55">© OpenStreetMap contributors</text>
    </svg>`
    el.appendChild(box)
  }

  // ── camera: bersaglio a terra, distanza, rotta (0 = nord), inclinazione ──
  const cam = { x: 3, y: -11, d: 96, h: -32 * RAD, p: 40 * RAD }
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
    c.d = clamp(c.d, 12, 320)
    c.p = clamp(c.p, 6 * RAD, 84 * RAD)
    const r = Math.hypot(c.x, c.y)
    if (r > 320) { c.x *= 320 / r; c.y *= 320 / r }
  }
  // la camera nel mondo (x est, z nord), con i suoi assi: servono anche a trovare il suolo sotto il puntatore
  function posa() {
    const cp = Math.cos(cam.p), sp = Math.sin(cam.p)
    const sh = Math.sin(cam.h), ch = Math.cos(cam.h)
    const pos = [cam.x - sh * cam.d * cp, Math.max(1.2, 0.9 + cam.d * sp), cam.y - ch * cam.d * cp]
    const tgt = [cam.x, 0.9, cam.y]
    return { pos, tgt }
  }
  function applicaCamera() {
    if (mondo) {
      const { pos, tgt } = posa()
      mondo.camera.position.set(pos[0], pos[1], pos[2])
      mondo.camera.setTarget(new Vector3(tgt[0], tgt[1], tgt[2]))
    }
    rosa.style.transform = `rotate(${-cam.h * GRADI}deg)`
  }

  // ── suolo sotto il puntatore ──
  function suolo(clientX, clientY) {
    const r = el.getBoundingClientRect()
    const nx = ((clientX - r.left) / r.width) * 2 - 1
    const ny = -((clientY - r.top) / r.height) * 2 + 1
    const { pos, tgt } = posa()
    let f = [tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]]
    const lf = Math.hypot(...f); f = f.map((v) => v / lf)
    // (mano sinistra: destra = su × avanti)
    let dx = [f[2], 0, -f[0]]; const ld = Math.hypot(...dx) || 1; dx = dx.map((v) => v / ld)
    const up = [f[1] * dx[2] - f[2] * dx[1], f[2] * dx[0] - f[0] * dx[2], f[0] * dx[1] - f[1] * dx[0]]
    const t = Math.tan(20 * RAD)
    const dir = [0, 1, 2].map((i) => f[i] + dx[i] * nx * t * (1920 / 1080) + up[i] * ny * t)
    if (dir[1] > -1e-4) return null
    const k = -pos[1] / dir[1]
    if (k > 4000) return null
    return { x: pos[0] + dir[0] * k, y: pos[2] + dir[2] * k }
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
      cam.p = clamp(inizio.cam.p + dy * 0.004, 6 * RAD, 84 * RAD)
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
    cam.d = clamp(cam.d * Math.exp(clamp(e.deltaY, -220, 220) * 0.0012), 12, 320)
    if (g) { const f = cam.d / vecchio; cam.x = g.x + (cam.x - g.x) * f; cam.y = g.y + (cam.y - g.y) * f }
    limite(cam); des.x = cam.x; des.y = cam.y; des.d = cam.d
    segnaPubblicabile()
  }, { passive: false })
  el.addEventListener('dblclick', (e) => {
    const g = suolo(e.clientX, e.clientY)
    if (!g) return
    segnaAttivita()
    volo = { da: { ...cam }, a: { x: g.x, y: g.y, d: Math.min(cam.d, 60), h: cam.h, p: Math.min(cam.p, 40 * RAD) }, inizio: adesso(), durata: 1100 }
  })
  const tasti = (e) => {
    if (!su) return
    const t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    const f = e.shiftKey ? 3 : 1
    const sh = Math.sin(cam.h), ch = Math.cos(cam.h), passo = cam.d * 0.16 * f
    let usato = true
    switch (e.key) {
      case 'ArrowUp': cam.x += sh * passo; cam.y += ch * passo; break
      case 'ArrowDown': cam.x -= sh * passo; cam.y -= ch * passo; break
      case 'ArrowLeft': cam.x -= ch * passo; cam.y += sh * passo; break
      case 'ArrowRight': cam.x += ch * passo; cam.y -= sh * passo; break
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
    if (mondo) mondo.aggiornaLuce(pal)
    aggiornaOrologio()
  }
  function aggiornaOrologio() {
    const d = ctx.ora()
    const testo = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    if (testo !== elOra.textContent) elOra.textContent = testo
    elGradi.textContent = meteo && Number.isFinite(+meteo.gradi) ? `${Math.round(+meteo.gradi)}°` : ''
    elMeteo.textContent = meteo?.testo ?? ''
  }
  function aggiorna(statoNuovo) {
    if (statoNuovo?.meteo) meteo = statoNuovo.meteo
    ricalcola()
  }

  // ── comandi dalle altre pagine (la camera girata dalla regia) ──
  function comando(v) {
    if (!v || !Array.isArray(v.c) || v.c.length < 5) return
    if (trascinando) return
    const [x, y, d, h, p] = v.c.map(Number)
    if (![x, y, d, h, p].every(Number.isFinite)) return
    des.x = x; des.y = y; des.d = clamp(d, 12, 320); des.h = h * RAD; des.p = clamp(p * RAD, 6 * RAD, 84 * RAD)
    seguendo = true; mescolaTour = 0; ultimaAttivita = ctx.tempo(); daPubblicare = false
    inerzia.x = inerzia.y = inerzia.h = inerzia.p = 0
    limite(des)
  }

  // ── accendere e spegnere: il mondo si costruisce la prima volta (e dopo un minuto spento si butta via) ──
  function costruisci() {
    if (mondo || costruendo || telecomando) return costruendo
    // (nella regia dal vivo l'immagine di Camo arriva dopo un attimo: senza GPU la si aspetta, invece di costruire
    // per sei secondi col processore un mondo che poi si butta)
    if (software && performance.now() < aspettaVivo) return null
    // (se la volta prima il 3D non è partito si riprova, ma non più di una volta ogni 15 secondi: prima restava la
    // pianta in 2D finché non si ricaricava la pagina)
    if (guasto) {
      if (ctx.prova && Q.has('nogl')) return null
      if (performance.now() - guastoAlle < 15000) return null
      guasto = false; el.querySelector('.dvw-caduta')?.remove(); ui.style.display = ''; el.classList.remove('dvw-pronta')
    }
    if (ctx.prova && Q.has('nogl')) { guasto = true; caduta(); el.classList.add('dvw-pronta'); return null }
    tela = document.createElement('canvas')
    tela.className = 'dvw-tela'
    tela.width = LATO[0]; tela.height = LATO[1]
    el.insertBefore(tela, ui)
    const t0 = performance.now()
    costruendo = costruisciMondo(tela, { leggero, software, lato: LATO }).then((m) => {
      mondo = m; costruendo = null
      mondo.engine.onContextLostObservable.add(() => { console.warn('dove: contesto perso') })
      ricalcola(); applicaCamera()
      el.classList.add('dvw-pronta')
      if (ctx.prova) { window.__dove = { mondo, cam, des, ricalcola, applicaCamera }; console.log(`dove: pronta in ${Math.round(performance.now() - t0)} ms${software ? ' (senza GPU: piccola e leggera)' : ''}`) }
      return m
    }).catch((e) => {
      console.warn('dove: niente 3D', e)
      costruendo = null; guasto = true; guastoAlle = performance.now()
      try { tela?.remove() } catch {}
      caduta(); el.classList.add('dvw-pronta')
    })
    return costruendo
  }
  // senza GPU, con l'immagine di Camo sotto (l'anteprima dal vivo della regia): niente mondo qui, solo il telecomando.
  // Se l'immagine di Camo manca da 5 secondi (camera rilasciata, «Riferimento»), si torna a disegnarla piccola.
  // (l'immagine di Camo deve avere qualcosa dentro: con Camo chiuso la sua camera manda fotogrammi neri. Si guarda una
  // volta al secondo, rimpicciolita a 16 × 9)
  let camoPiena = false, camoGuardata = 0, assaggio = null
  function camoHaImmagine() {
    const scena = el.closest('.dal-vivo')
    if (!scena) return (camoPiena = false)
    const ora = performance.now()
    if (ora - camoGuardata < 1000) return camoPiena
    camoGuardata = ora
    const foto = scena.querySelector('.vivo-foto')
    if (!foto) return (camoPiena = false)
    try {
      assaggio ??= Object.assign(document.createElement('canvas'), { width: 16, height: 9 }).getContext('2d', { willReadFrequently: true })
      assaggio.drawImage(foto, 0, 0, 16, 9)
      const d = assaggio.getImageData(0, 0, 16, 9).data
      let somma = 0
      for (let i = 0; i < d.length; i += 4) somma += d[i] + d[i + 1] + d[i + 2]
      camoPiena = somma / (16 * 9 * 3) > 6
    } catch { camoPiena = false }
    return camoPiena
  }
  function scegliModo() {
    if (!software) return
    const vivo = camoHaImmagine()
    if (vivo) senzaVivoDa = 0
    else if (!senzaVivoDa) senzaVivoDa = performance.now()
    const vuole = vivo || (telecomando && performance.now() - senzaVivoDa < 5000)
    if (vuole === telecomando) return
    telecomando = vuole
    el.classList.toggle('dvw-telecomando', telecomando)
    el.style.background = telecomando ? 'transparent' : '#0b090e'
    if (telecomando) butta()
    else costruisci()
  }
  function butta() {
    if (!mondo) return
    // (la scheda video si libera subito: il contesto WebGL si perde apposta, non aspetta il garbage collector)
    try { const gl = mondo.engine._gl; mondo.scene.dispose(); mondo.engine.dispose(); gl?.getExtension('WEBGL_lose_context')?.loseContext() } catch {}
    mondo = null
    try { tela?.remove() } catch {}
    tela = null
    el.classList.remove('dvw-pronta')
  }
  function mostra(suNuovo) {
    su = !!suNuovo
    el.classList.toggle('dvw-accesa', su)
    clearTimeout(timerSpegni)
    if (su) {
      ultimaAttivita = forzaTour ? ctx.tempo() - 30 : ctx.tempo(); mescolaTour = 0; daPubblicare = false; inMovimento = false
      scegliModo()
      costruisci()
      if (mondo) { mondo.engine.setSize(LATO[0], LATO[1]); ricalcola(); applicaCamera() }
    } else {
      timerSpegni = setTimeout(() => { if (!su) butta() }, 60000)
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
    if (volo) {
      const k = clamp((adesso() - volo.inizio) / volo.durata, 0, 1)
      const m = k * k * (3 - 2 * k)
      cam.x = mescola(volo.da.x, volo.a.x, m); cam.y = mescola(volo.da.y, volo.a.y, m); cam.d = mescola(volo.da.d, volo.a.d, m)
      cam.h = volo.da.h + angoloCorto(volo.da.h, volo.a.h) * m; cam.p = mescola(volo.da.p, volo.a.p, m)
      if (k >= 1) volo = null
      daPubblicare = true; inMovimento = true; quandoFermo = adesso()
    }
    if (versoNord) {
      const diff = angoloCorto(cam.h, 0)
      cam.h += diff * Math.min(1, dt * 5.5)
      daPubblicare = true; inMovimento = true; quandoFermo = adesso()
      if (Math.abs(diff) < 0.002) { cam.h = 0; versoNord = false }
    }
    if (!trascinando) {
      if (!seguendo && !volo && mescolaTour < 0.01 && (Math.abs(inerzia.x) + Math.abs(inerzia.y) + Math.abs(inerzia.h) + Math.abs(inerzia.p) > 0.12)) {
        cam.x += inerzia.x * dt; cam.y += inerzia.y * dt
        cam.h += inerzia.h * dt; cam.p += inerzia.p * dt
        limite(cam); segnaPubblicabile()
      }
      const freno = Math.exp(-dt * 3.2)
      inerzia.x *= freno; inerzia.y *= freno; inerzia.h *= freno; inerzia.p *= freno
    }
    if (seguendo && !trascinando && mescolaTour < 0.01) {
      const k = 1 - Math.exp(-dt * 6.5)
      cam.x = mescola(cam.x, des.x, k); cam.y = mescola(cam.y, des.y, k); cam.d = mescola(cam.d, des.d, k)
      cam.h += angoloCorto(cam.h, des.h) * k; cam.p = mescola(cam.p, des.p, k)
    }
    limite(cam)
    applicaCamera()
    // pubblica al massimo 12 volte al secondo, più un messaggio finale (col telecomando anche mentre trascini: la mappa
    // che vedi è quella di Camo, deve muoversi sotto il mouse)
    if (daPubblicare && !seguendo && (!trascinando || telecomando) && mescolaTour < 0.01 && !senzaTour) {
      const firma = `${cam.x.toFixed(2)},${cam.y.toFixed(2)},${cam.d.toFixed(1)},${(cam.h * GRADI).toFixed(1)},${(cam.p * GRADI).toFixed(1)}`
      const ora = adesso()
      const manda = () => { try { ctx.manda({ c: [+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.d.toFixed(1), +(cam.h * GRADI).toFixed(1), +(cam.p * GRADI).toFixed(1)] }) } catch {} }
      if (firma !== ultimaInviata) {
        if (ora - ultimoInvio >= 83) { manda(); ultimaInviata = firma; ultimoInvio = ora; quandoFermo = ora; inMovimento = true }
      } else if (inMovimento && ora - quandoFermo > 260) { manda(); inMovimento = false; daPubblicare = false }
    }
  }

  let prossimoOrologio = 0
  function giro(dt, t) {
    if (!su) return
    scegliModo()
    if (!mondo && !telecomando) { if (!costruendo) costruisci(); return }
    const tScena = ctx.tempo()
    passoCamera(dt, tScena)
    if (mondo) {
      mondo.anima(Math.min(dt, 0.1), { x: cam.x, z: cam.y })
      mondo.engine.beginFrame()
      mondo.scene.render()
      mondo.engine.endFrame()
    }
    if (t > prossimoOrologio) { prossimoOrologio = t + 1; aggiornaOrologio() }
    if (tScena - ultimoAggiornamentoLuce > 20) { ultimoAggiornamentoLuce = tScena; ricalcola() }
  }

  if (ctx.stato()) aggiorna(ctx.stato())
  else ricalcola()
  applicaCamera()
  ultimoAggiornamentoLuce = ctx.tempo()

  return { el, mostra, giro, aggiorna, comando }
}
