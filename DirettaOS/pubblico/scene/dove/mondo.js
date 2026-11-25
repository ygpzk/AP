// Il mondo della scena «Dove vivo»: terreno, campi, strade, alberi, casa, capannone e fontana.
// Geometria esatta dal rilievo (dati.js, metri locali), tutto il resto disegnato qui: materiali proceduali,
// niente immagini scaricate a runtime. Tre.js arriva da ../lib (vendorizzato, nessuna CDN).
import * as THREE from '../lib/three.module.min.js'
import { DATI } from './dati.js'
import { creaTerreno, creaTerrenoLontano, TIPI_ALBERO } from './terreno.js'

const RAD = Math.PI / 180
const UP = new THREE.Vector3(0, 1, 0)
const colore = (h) => new THREE.Color(h)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const rnd = (() => { let s = 20261124; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 })()

// ── geometria: da metri locali (x est, y nord) a three (x, y alto, z = -nord) ──
const base = (ang, cx = 0, cy = 0) => ({ c: Math.cos(ang), s: Math.sin(ang), cx, cy })
const aMondo = (b, u, v) => [b.cx + u * b.c - v * b.s, b.cy + u * b.s + v * b.c]
const nMondo = (b, nu, nv) => [nu * b.c - nv * b.s, nu * b.s + nv * b.c]
const V3 = (x, y, z) => new THREE.Vector3(x, y, z)
const puntoMondo = (b, u, v, h = 0) => { const p = aMondo(b, u, v); return V3(p[0], h, -p[1]) }

// ── tele procedurali ──
function tela(lato, disegna, ripeti = 1) {
  const c = document.createElement('canvas')
  c.width = c.height = lato
  const g = c.getContext('2d')
  disegna(g, lato)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  t.repeat.set(ripeti, ripeti)
  return t
}
function disturbo(g, lato, alpha = 12, passo = 1) {
  const im = g.getImageData(0, 0, lato, lato), d = im.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * alpha
    d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n, 0, 255)
  }
  g.putImageData(im, 0, 0)
}
const T = {}
function creaTele() {
  // intonaco caldo di campagna: macchie di calce, crepe sottili, il piede più sporco
  T.cemento = tela(512, (g, n) => {
    g.fillStyle = '#dfd5c0'; g.fillRect(0, 0, n, n)
    for (let i = 0; i < 110; i++) {
      const v = 185 + rnd() * 55
      g.fillStyle = `rgba(${v},${v - 9},${v - 25},${0.05 + rnd() * 0.09})`
      g.beginPath(); g.ellipse(rnd() * n, rnd() * n, 18 + rnd() * 105, 10 + rnd() * 65, rnd() * 3, 0, 7); g.fill()
    }
    // macchie di umidità in basso, dove il muro tocca la terra
    const basso = g.createLinearGradient(0, n * 0.62, 0, n)
    basso.addColorStop(0, 'rgba(120,105,82,0)'); basso.addColorStop(1, 'rgba(120,105,82,0.2)')
    g.fillStyle = basso; g.fillRect(0, 0, n, n)
    // crepe e colature appena accennate
    for (let i = 0; i < 8; i++) {
      g.strokeStyle = `rgba(112,98,80,${0.08 + rnd() * 0.1})`; g.lineWidth = 0.7 + rnd() * 0.8
      g.beginPath(); let x = rnd() * n, y = rnd() * n * 0.55; g.moveTo(x, y)
      for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 18; y += 8 + rnd() * 24; g.lineTo(x, y) }
      g.stroke()
    }
    for (let i = 0; i < 24; i++) {
      g.fillStyle = `rgba(150,136,113,${0.04 + rnd() * 0.06})`
      g.fillRect(rnd() * n, rnd() * n, 2 + rnd() * 9, 1 + rnd() * 3)
    }
    disturbo(g, n, 9)
  })
  // fontana: cassaforma più marcata, macchie d'acqua
  T.fontana = tela(512, (g, n) => {
    g.fillStyle = '#b9b1a6'; g.fillRect(0, 0, n, n)
    for (let x = 0; x < n; x += 42) { g.fillStyle = 'rgba(64,58,52,0.28)'; g.fillRect(x, 0, 3, n); g.fillStyle = 'rgba(244,238,228,0.2)'; g.fillRect(x + 3, 0, 2, n) }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,72,63,${0.04 + rnd() * 0.12})`; g.beginPath(); g.ellipse(rnd() * n, rnd() * n, 10 + rnd() * 40, 20 + rnd() * 90, 0, 0, 7); g.fill() }
    for (let y = 50; y < n; y += 100) for (let x = 30; x < n; x += 100) { g.fillStyle = 'rgba(58,52,46,0.45)'; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill() }
    disturbo(g, n, 18)
  })
  // tegole: cotto consumato, mescolato tegola per tegola, con muschio e ombre di sovrapposizione
  T.tegole = tela(512, (g, n) => {
    const toni = ['#8b5a45', '#96634c', '#a06b53', '#7e4f3d', '#a8765c', '#8f6b51', '#7a5c47']
    g.fillStyle = '#5c3a2e'; g.fillRect(0, 0, n, n)
    const larg = 22, alt = 34
    for (let riga = -1; riga < n / alt + 2; riga++) {
      const y = riga * alt
      for (let i = -1; i < n / larg + 2; i++) {
        const x = i * larg + (riga % 2 ? larg / 2 : 0)
        const t = toni[Math.floor(rnd() * toni.length)]
        g.fillStyle = t
        g.beginPath(); g.moveTo(x + 0.8, y + alt); g.lineTo(x + 0.8, y + alt * 0.34); g.quadraticCurveTo(x + larg * 0.5, y - 1, x + larg - 0.8, y + alt * 0.34); g.lineTo(x + larg - 0.8, y + alt); g.closePath(); g.fill()
        g.strokeStyle = 'rgba(48,25,18,0.42)'; g.lineWidth = 1; g.stroke()
        g.strokeStyle = 'rgba(255,218,186,0.14)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x + 3, y + alt * 0.4); g.quadraticCurveTo(x + larg * 0.5, y + 4, x + larg - 3, y + alt * 0.4); g.stroke()
        // muschio e polvere fra le tegole
        if (rnd() < 0.16) { g.fillStyle = 'rgba(77,89,50,0.3)'; g.beginPath(); g.ellipse(x + larg * 0.35, y + alt * 0.8, 3 + rnd() * 4, 1.5 + rnd() * 2, 0, 0, 7); g.fill() }
      }
      g.fillStyle = 'rgba(39,20,14,0.36)'; g.fillRect(0, y + alt - 1.8, n, 1.8)
      g.fillStyle = 'rgba(255,235,210,0.08)'; g.fillRect(0, y + 2, n, 1)
    }
    disturbo(g, n, 9)
  })
  // copertina in cotto (lastre piane) per il bordo della fontana
  T.cotto = tela(256, (g, n) => {
    const toni = ['#8a5646', '#96614e', '#a26d58', '#7d4a3c', '#ac7a64']
    g.fillStyle = '#703a2c'; g.fillRect(0, 0, n, n)
    for (let y = 0; y < n; y += 32) for (let x = 0; x < n; x += 64) {
      g.fillStyle = toni[Math.floor(rnd() * 5)]; g.fillRect(x + 1, y + 1, 62, 30)
      g.fillStyle = 'rgba(255,220,190,0.1)'; g.fillRect(x + 2, y + 2, 60, 2)
    }
    disturbo(g, n, 9)
  })
  T.legno = tela(256, (g, n) => {
    g.fillStyle = '#776a55'; g.fillRect(0, 0, n, n)
    for (let y = 0; y < n; y += 8) { g.fillStyle = `rgba(50,40,30,${0.06 + rnd() * 0.14})`; g.fillRect(0, y, n, 2 + rnd() * 4) }
    disturbo(g, n, 10)
  })
  T.persiana = tela(128, (g, n) => {
    g.fillStyle = '#3d4b42'; g.fillRect(0, 0, n, n)
    for (let y = 4; y < n; y += 10) { g.fillStyle = 'rgba(15,25,20,0.55)'; g.fillRect(0, y, n, 4); g.fillStyle = 'rgba(120,140,125,0.16)'; g.fillRect(0, y + 4, n, 1) }
  })
  T.solare = tela(256, (g, n) => {
    g.fillStyle = '#16283c'; g.fillRect(0, 0, n, n)
    const cols = 8, rows = 5, w = n / cols, h = n / rows
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      g.fillStyle = `rgb(${22 + rnd() * 12},${38 + rnd() * 15},${58 + rnd() * 18})`; g.fillRect(i * w + 2, j * h + 2, w - 4, h - 4)
      g.strokeStyle = 'rgba(160,185,205,0.45)'; g.lineWidth = 1; g.strokeRect(i * w + 2, j * h + 2, w - 4, h - 4)
    }
    g.strokeStyle = 'rgba(210,225,235,0.5)'; g.lineWidth = 3; g.strokeRect(1, 1, n - 2, n - 2)
  })
  // vetro: un riflesso appena accennato di cielo e terra, così le finestre non sono buchi neri
  T.vetro = tela(256, (g, n) => {
    const grad = g.createLinearGradient(0, 0, n * 0.3, n)
    grad.addColorStop(0, '#8aa7ae'); grad.addColorStop(0.35, '#587277'); grad.addColorStop(0.7, '#354a4b'); grad.addColorStop(1, '#243233')
    g.fillStyle = grad; g.fillRect(0, 0, n, n)
    g.fillStyle = 'rgba(236,246,245,0.2)'; g.beginPath(); g.moveTo(0, n * 0.12); g.lineTo(n * 0.58, 0); g.lineTo(n, 0); g.lineTo(0, n * 0.58); g.fill()
    g.fillStyle = 'rgba(255,230,198,0.1)'; g.fillRect(0, n * 0.72, n, n * 0.28)
    g.strokeStyle = 'rgba(225,240,238,0.08)'; g.lineWidth = 1
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(rnd() * n, 0); g.lineTo(rnd() * n, n); g.stroke() }
    disturbo(g, n, 5)
  })
  // pietra per zoccoli, cordoli, soglie: lastre irregolari, non un colore piatto
  T.pietra = tela(512, (g, n) => {
    g.fillStyle = '#8f897b'; g.fillRect(0, 0, n, n)
    for (let y = 0; y < n; y += 42) for (let x = -20; x < n; x += 64) {
      const v = 130 + rnd() * 35
      g.fillStyle = `rgb(${v},${v - 5},${v - 15})`
      g.beginPath(); g.moveTo(x + (y / 42 % 2) * 32 + 2, y + 2); g.lineTo(x + 62, y + 2); g.lineTo(x + 60, y + 39); g.lineTo(x + (y / 42 % 2) * 32, y + 40); g.closePath(); g.fill()
      g.strokeStyle = 'rgba(63,58,50,0.35)'; g.lineWidth = 1.6; g.stroke()
    }
    disturbo(g, n, 12)
  })
  // le foglie: una trama chiara che, moltiplicata per il verde di ogni lobo, toglie l'effetto plastica
  T.foglie = tela(256, (g, n) => {
    g.fillStyle = '#d6ddc8'; g.fillRect(0, 0, n, n)
    for (let i = 0; i < 260; i++) {
      const v = rnd() < 0.5 ? 125 + rnd() * 35 : 205 + rnd() * 35
      g.fillStyle = `rgba(${v},${v + 6},${v - 22},${0.08 + rnd() * 0.18})`
      g.beginPath(); g.ellipse(rnd() * n, rnd() * n, 2 + rnd() * 12, 1 + rnd() * 6, rnd() * 3, 0, 7); g.fill()
    }
    for (let i = 0; i < 1200; i++) {
      const v = 120 + rnd() * 120
      g.fillStyle = `rgba(${v},${v + 8},${v - 25},${0.1 + rnd() * 0.22})`
      g.beginPath(); g.ellipse(rnd() * n, rnd() * n, 0.7 + rnd() * 2.4, 0.4 + rnd() * 1.4, rnd() * 3, 0, 7); g.fill()
    }
    disturbo(g, n, 15)
  }, 3)
  T.foglie.anisotropy = 4
  // la grana del terreno, ripetuta in piccolo dallo shader: ravviva le foto da vicino
  T.grana = tela(256, (g, n) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, n, n)
    for (let i = 0; i < 14000; i++) {
      const v = 70 + rnd() * 145
      g.fillStyle = `rgba(${v},${v},${v},${0.16 + rnd() * 0.55})`
      g.fillRect(rnd() * n, rnd() * n, 1 + rnd() * 2, 1 + rnd() * 2)
    }
    disturbo(g, n, 28)
  })
  // l'ombra morbida sotto le chiome: un disco nero che sfuma nel nulla
  T.ombraAlbero = tela(128, (g, n) => {
    const grad = g.createRadialGradient(n / 2, n / 2, n * 0.04, n / 2, n / 2, n * 0.49)
    grad.addColorStop(0, 'rgba(20,29,16,0.72)')
    grad.addColorStop(0.5, 'rgba(20,29,16,0.34)')
    grad.addColorStop(1, 'rgba(20,29,16,0)')
    g.fillStyle = grad
    g.beginPath(); g.arc(n / 2, n / 2, n * 0.49, 0, 7); g.fill()
  })
}
creaTele()

// ── materiali ──
const MAT = {}
function creaMateriali() {
  MAT.cemento = new THREE.MeshStandardMaterial({ map: T.cemento, bumpMap: T.cemento, bumpScale: 0.025, color: 0xffffff, roughness: 0.96, metalness: 0.0, side: THREE.DoubleSide })
  MAT.fontana = new THREE.MeshStandardMaterial({ map: T.fontana, bumpMap: T.fontana, bumpScale: 0.05, color: 0xf0eae0, roughness: 0.96, side: THREE.DoubleSide })
  MAT.tegole = new THREE.MeshStandardMaterial({ map: T.tegole, bumpMap: T.tegole, bumpScale: 0.045, color: 0xd9c9bc, roughness: 0.94, side: THREE.DoubleSide })
  MAT.cotto = new THREE.MeshStandardMaterial({ map: T.cotto, color: 0xf2e2d4, roughness: 0.9, side: THREE.DoubleSide })
  MAT.legno = new THREE.MeshLambertMaterial({ map: T.legno, color: 0xe0d2bb, side: THREE.DoubleSide })
  MAT.persiana = new THREE.MeshStandardMaterial({ map: T.persiana, color: 0xd9e0d4, roughness: 0.88, side: THREE.DoubleSide })
  MAT.vetro = new THREE.MeshStandardMaterial({ map: T.vetro, roughness: 0.08, metalness: 0.42, emissive: 0xff9c54, emissiveIntensity: 0, side: THREE.DoubleSide })
  MAT.vetroCap = new THREE.MeshStandardMaterial({ map: T.vetro, color: 0x9da8a4, roughness: 0.16, metalness: 0.35, side: THREE.DoubleSide })
  MAT.telaio = new THREE.MeshStandardMaterial({ color: 0xd6d0c2, roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide })
  MAT.fascia = new THREE.MeshStandardMaterial({ color: 0x6b5b48, roughness: 0.82, metalness: 0.05, side: THREE.DoubleSide })
  MAT.ombraMuro = new THREE.MeshBasicMaterial({ color: 0x2d271d, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide })
  MAT.pietra = new THREE.MeshStandardMaterial({ map: T.pietra, bumpMap: T.pietra, bumpScale: 0.03, color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide })
  MAT.mattone = new THREE.MeshStandardMaterial({ map: T.cotto, color: 0xd9b9a2, roughness: 0.92, side: THREE.DoubleSide })
  MAT.solare = new THREE.MeshStandardMaterial({ map: T.solare, color: 0xf0f7ff, roughness: 0.16, metalness: 0.55, side: THREE.DoubleSide })
  MAT.metallo = new THREE.MeshStandardMaterial({ color: 0x9ba3a4, roughness: 0.28, metalness: 0.75, side: THREE.DoubleSide })
  MAT.lontani = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
  MAT.stelle = new THREE.PointsMaterial({ color: 0xdfe8ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false })
  // il legno delle persiane, più caldo
  MAT.legnoScuro = new THREE.MeshStandardMaterial({ map: T.legno, color: 0x8d7b61, roughness: 0.85, side: THREE.DoubleSide })
}
creaMateriali()

// ── accumuli di triangoli (per fondere le geometrie in poche chiamate) ──
const nuovo = () => ({ pos: [], nor: [], uv: [], col: [] })
function triangolo(acc, a, b, c, n, ua, ub, uc, col) {
  const p = [a, b, c], u = [ua, ub, uc]
  for (let i = 0; i < 3; i++) {
    acc.pos.push(p[i].x, p[i].y, p[i].z)
    acc.nor.push(n.x, n.y, n.z)
    acc.uv.push(u[i][0], u[i][1])
    if (col) acc.col.push(col.r, col.g, col.b)
  }
}
function quadrilatero(acc, a, b, c, d, n, ua, ub, uc, ud, col) {
  triangolo(acc, a, b, c, n, ua, ub, uc, col)
  triangolo(acc, a, c, d, n, ua, uc, ud, col)
}
function aggiungiGeo(acc, geo, matrice, coloreV = null) {
  const g = geo.index ? geo.toNonIndexed() : geo
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
  const nm = new THREE.Matrix3().getNormalMatrix(matrice)
  for (let i = 0; i < p.count; i++) {
    const v = V3(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(matrice)
    const nn = n ? V3(n.getX(i), n.getY(i), n.getZ(i)).applyMatrix3(nm).normalize() : UP.clone()
    acc.pos.push(v.x, v.y, v.z); acc.nor.push(nn.x, nn.y, nn.z)
    acc.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0)
    if (coloreV) acc.col.push(coloreV.r, coloreV.g, coloreV.b)
  }
  if (g !== geo) g.dispose()
}
function meshDa(acc, materiale, ombre = true) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nor, 3))
  if (acc.uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2))
  if (acc.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(acc.col, 3))
  g.computeBoundingSphere()
  const m = new THREE.Mesh(g, materiale)
  m.castShadow = ombre; m.receiveShadow = true
  return m
}

// forma da un poligono locale (x est, y nord) disteso a terra
function geoPoligono(punti, angUv = 0, scalaUv = 6) {
  const forma = new THREE.Shape(punti.map((p) => new THREE.Vector2(p[0], p[1])))
  const g = new THREE.ShapeGeometry(forma)
  const p = g.attributes.position, uv = []
  const c = Math.cos(-angUv), s = Math.sin(-angUv)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i)
    uv.push((x * c - y * s) / scalaUv, (x * s + y * c) / scalaUv)
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.rotateX(-Math.PI / 2)
  return g
}
function formaLocali(punti) { return new THREE.Shape(punti.map((p) => new THREE.Vector2(p[0], p[1]))) }

// nastro (strada, fosso, viale) da una polilinea locale, larghezza in metri
function geoNastro(punti, larghezza, y = 0, scalaV = 4) {
  const pos = [], nor = [], uv = []
  let percorso = 0
  for (let i = 0; i < punti.length - 1; i++) {
    const a = punti[i], b = punti[i + 1]
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy)
    if (L < 0.01) continue
    const nx = -dy / L * larghezza / 2, ny = dx / L * larghezza / 2
    const p1 = V3(a[0] + nx, y, -a[1] - ny), p2 = V3(a[0] - nx, y, -a[1] + ny)
    const p3 = V3(b[0] + nx, y, -b[1] - ny), p4 = V3(b[0] - nx, y, -b[1] + ny)
    const v0 = percorso / scalaV, v1 = (percorso + L) / scalaV
    pos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p1.x, p1.y, p1.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z)
    for (let k = 0; k < 6; k++) nor.push(0, 1, 0)
    uv.push(0, v0, 1, v0, 0, v1, 0, v0, 0, v1, 1, v1)
    percorso += L
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

// scatola orientata (rotY attorno all'asse verticale), centro in metri locali world
function scatola(acc, x, y, z, sx, sy, sz, rotY, col = null) {
  const g = new THREE.BoxGeometry(sx, sy, sz)
  const m = new THREE.Matrix4().makeRotationY(rotY)
  m.setPosition(x, y, z)
  aggiungiGeo(acc, g, m, col)
  g.dispose()
}
const coloreV = (h) => new THREE.Color(h)

// ── funzioni per muri con aperture ──
function contornoApertura(s0, s1, y0, y1, arco) {
  const pts = []
  if (!arco) return [new THREE.Vector2(s0, y0), new THREE.Vector2(s1, y0), new THREE.Vector2(s1, y1), new THREE.Vector2(s0, y1)]
  const r = Math.min((s1 - s0) / 2, (y1 - y0) * 0.9)
  pts.push(new THREE.Vector2(s0, y0), new THREE.Vector2(s1, y0), new THREE.Vector2(s1, y1 - r))
  for (let i = 1; i < 10; i++) { const a = Math.PI * i / 10; pts.push(new THREE.Vector2((s0 + s1) / 2 + Math.cos(a) * (s1 - s0) / 2, y1 - r + Math.sin(a) * r)) }
  pts.push(new THREE.Vector2(s0, y1 - r))
  return pts
}
// muro in coordinate locali del fabbricato: p0, p1 (u,v), normale esterna (nu,nv), altezza; aperture in s/y
function muro(acc, b, p0, p1, h, normale, aperture = [], opz = {}) {
  const A = aMondo(b, p0[0], p0[1]), B = aMondo(b, p1[0], p1[1])
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy)
  if (L < 0.05) return
  const d = V3(dx / L, 0, -dy / L)
  const nW = nMondo(b, normale[0], normale[1])
  const n = V3(nW[0], 0, -nW[1])
  const O = V3(A[0], 0, -A[1])
  const cont = [new THREE.Vector2(0, 0), new THREE.Vector2(L, 0), new THREE.Vector2(L, h), new THREE.Vector2(0, h)]
  const buchi = aperture.map((a) => contornoApertura(a.s0, a.s1, a.y0, a.y1, !!a.arco).reverse())
  const facce = THREE.ShapeUtils.triangulateShape(cont, buchi)
  const tutti = [...cont, ...buchi.flat()]
  const off = opz.off ?? 0
  const uv = (s, y) => [s / 2.6 + off, y / 2.6]
  for (const f of facce) {
    const p = f.map((i) => { const q = tutti[i]; return O.clone().addScaledVector(d, q.x).addScaledVector(UP, q.y) })
    const q = f.map((i) => tutti[i])
    triangolo(acc, p[0], p[1], p[2], n, uv(q[0].x, q[0].y), uv(q[1].x, q[1].y), uv(q[2].x, q[2].y))
  }
  // spessore dei vani (mostra la profondità del muro)
  const dietro = 0.34
  for (const a of aperture) {
    const poly = contornoApertura(a.s0, a.s1, a.y0, a.y1, !!a.arco)
    for (let i = 0; i < poly.length; i++) {
      const q1 = poly[i], q2 = poly[(i + 1) % poly.length]
      const f1 = O.clone().addScaledVector(d, q1.x).addScaledVector(UP, q1.y)
      const f2 = O.clone().addScaledVector(d, q2.x).addScaledVector(UP, q2.y)
      const b1 = f1.clone().addScaledVector(n, -dietro), b2 = f2.clone().addScaledVector(n, -dietro)
      const nn = new THREE.Vector3().subVectors(f2, f1).cross(new THREE.Vector3().subVectors(b1, f1)).normalize()
      quadrilatero(acc, f1, f2, b2, b1, nn, [0, 0], [1, 0], [1, 1], [0, 1])
    }
  }
  return { O, d, n, L, h }
}
// vetro, telaio, davanzale, persiane di un'apertura; info = {s0,s1,y0,y1,arco,persiane,tipo}
function serramento(accVetro, accTelaio, accPersiane, accMattone, mur, info, colVetro, opz = {}) {
  const { O, d, n } = mur
  const larg = info.s1 - info.s0, alt = info.y1 - info.y0
  const centroS = (info.s0 + info.s1) / 2
  const p = (s, y, off = 0) => O.clone().addScaledVector(d, s).addScaledVector(UP, y).addScaledVector(n, off)
  // vetro, leggermente arretrato
  const contour = contornoApertura(info.s0 + 0.06, info.s1 - 0.06, info.y0 + 0.06, info.y1 - 0.06, info.arco)
  const br = new THREE.ShapeGeometry(new THREE.Shape(contour))
  const m = new THREE.Matrix4().makeBasis(d, UP, n)
  m.setPosition(p(0, 0, -0.15))
  aggiungiGeo(accVetro, br, m)
  br.dispose()
  // montanti: le grandi vetrate in tre parti, le finestre normali in due
  {
    const rot = Math.atan2(-d.z, d.x)
    const altM = Math.min(alt - 0.16, info.arco ? alt - larg * 0.22 : alt - 0.16)
    if (larg > 1.8) {
      for (const f of [1 / 3, 2 / 3]) {
        const q = p(info.s0 + larg * f, info.y0 + 0.09 + altM / 2, -0.015)
        scatola(accTelaio, q.x, q.y, q.z, 0.055, altM, 0.07, rot)
      }
      const q2 = p(centroS, info.y0 + altM * 0.62, -0.015)
      scatola(accTelaio, q2.x, q2.y, q2.z, larg - 0.12, 0.05, 0.06, rot)
    } else if (larg > 0.72 && alt > 0.9) {
      const q = p(centroS, info.y0 + 0.07 + altM / 2, -0.012)
      scatola(accTelaio, q.x, q.y, q.z, 0.04, altM, 0.06, rot)
      const q2 = p(centroS, info.y0 + 0.06 + altM * 0.55, -0.012)
      scatola(accTelaio, q2.x, q2.y, q2.z, larg - 0.1, 0.04, 0.05, rot)
    }
  }
  // telaio: cornice piatta attorno al vano
  const est = contornoApertura(info.s0 - 0.09, info.s1 + 0.09, info.y0 - 0.09, info.y1 + 0.09, info.arco)
  const int = contornoApertura(info.s0 + 0.03, info.s1 - 0.03, info.y0 + 0.03, info.y1 - 0.03, info.arco).reverse()
  const facce = THREE.ShapeUtils.triangulateShape(est, [int])
  const tutti = [...est, ...int]
  for (const f of facce) {
    const q = f.map((i) => tutti[i])
    const pt = q.map((v) => p(v.x, v.y, 0.02))
    triangolo(accTelaio, pt[0], pt[1], pt[2], n, [q[0].x / 1, q[0].y / 1], [q[1].x, q[1].y], [q[2].x, q[2].y])
  }
  // davanzale (non sotto le arcate che arrivano a terra: lì sarebbe una trave sul selciato)
  if (info.davanzale !== false && info.y0 > 0.35) {
    const q = p(centroS, info.y0 - 0.04, 0.12)
    scatola(accTelaio, q.x, q.y, q.z, larg + 0.28, 0.09, 0.28, Math.atan2(-d.z, d.x))
  }
  // cornice in mattoni per gli archi
  if (info.mattone) {
    const e2 = contornoApertura(info.s0 - 0.26, info.s1 + 0.26, info.y0 - 0.1, info.y1 + 0.2, info.arco)
    const i2 = contornoApertura(info.s0 + 0.02, info.s1 - 0.02, info.y0 + 0.02, info.y1 - 0.02, info.arco).reverse()
    const ff = THREE.ShapeUtils.triangulateShape(e2, [i2])
    const tt = [...e2, ...i2]
    for (const f of ff) {
      const q = f.map((i) => tt[i]), pt = q.map((v) => p(v.x, v.y, 0.035))
      triangolo(accMattone, pt[0], pt[1], pt[2], n, [q[0].x, q[0].y], [q[1].x, q[1].y], [q[2].x, q[2].y])
    }
  }
  // persiane: due ante appoggiate ai lati
  if (info.persiane) {
    const rot = Math.atan2(-d.z, d.x)
    const altP = Math.min(info.y1 - info.y0 - 0.15, 1.85)
    for (const lato of [-1, 1]) {
      const s = centroS + lato * (larg / 2 + larg * 0.23)
      const q = p(s, info.y0 + altP / 2 + 0.08, 0.055)
      scatola(accPersiane, q.x, q.y, q.z, larg * 0.46, altP, 0.045, rot)
    }
  }
}

// tetto a due falde (colmo lungo u) o a padiglione
function tetto(acc, b, u0, u1, v0, v1, hEave, pendenza, tipo = 'padiglione', ov = 0.55, accFascia = null) {
  const U0 = u0 - ov, U1 = u1 + ov, V0 = v0 - ov, V1 = v1 + ov
  const tan = Math.tan(pendenza)
  const largoV = V1 - V0, largoU = U1 - U0
  const H = hEave + tan * Math.min(largoU, largoV) / 2
  const P = (u, v, h) => puntoMondo(b, u, v, h)
  const nUp = (a, c, d) => new THREE.Vector3().subVectors(c, a).cross(new THREE.Vector3().subVectors(d, a)).normalize()
  const UV = (u, v) => [u / 4.4, v / 4.4]
  let rA = null, rB = null
  if (tipo === 'falde') {
    const vc = (V0 + V1) / 2
    const a = P(U0, V0, hEave), c = P(U1, V0, hEave), r = P(U1, vc, H), l = P(U0, vc, H)
    const n = nUp(a, c, r)
    quadrilatero(acc, a, c, r, l, n, UV(U0, V0), UV(U1, V0), UV(U1, vc), UV(U0, vc))
    const a2 = P(U0, V1, hEave), c2 = P(U1, V1, hEave)
    const n2 = nUp(c2, a2, l)
    quadrilatero(acc, c2, a2, l, r, n2, UV(U0, V1), UV(U1, V1), UV(U1, vc), UV(U0, vc))
    rA = l; rB = r
    // colmo
    if (rA && rB) {
      const centro = rA.clone().add(rB).multiplyScalar(0.5), dir = new THREE.Vector3().subVectors(rB, rA), lung = dir.length(); dir.normalize()
      scatola(acc, centro.x, H + 0.07, centro.z, lung, 0.16, 0.34, Math.atan2(-dir.z, dir.x))
    }
    // fascioni di gronda
    if (accFascia) {
      for (const v of [V0, V1]) {
        const A = P(U0, v, hEave + 0.02), B = P(U1, v, hEave + 0.02)
        const dir = new THREE.Vector3().subVectors(B, A); const lung = dir.length(); dir.normalize()
        const centro = A.clone().add(B).multiplyScalar(0.5)
        const rot = Math.atan2(-dir.z, dir.x)
        scatola(accFascia, centro.x, centro.y - 0.1, centro.z, lung, 0.16, 0.09, rot)
      }
    }
    return H
  }
  // padiglione: colmo nella direzione più lunga
  const lungoU = largoU >= largoV
  const inset = Math.min(largoU, largoV) / 2
  const r1 = lungoU ? P(U0 + inset, (V0 + V1) / 2, H) : P((U0 + U1) / 2, V0 + inset, H)
  const r2 = lungoU ? P(U1 - inset, (V0 + V1) / 2, H) : P((U0 + U1) / 2, V1 - inset, H)
  if (lungoU) {
    const vc = (V0 + V1) / 2
    const a0 = P(U0, V0, hEave), a1 = P(U1, V0, hEave), a2 = P(U1, V1, hEave), a3 = P(U0, V1, hEave)
    quadrilatero(acc, a0, a1, r2, r1, nUp(a0, a1, r2), UV(U0, V0), UV(U1, V0), UV(U1, vc), UV(U0, vc))
    quadrilatero(acc, a2, a3, r1, r2, nUp(a2, a3, r1), UV(U0, V1), UV(U1, V1), UV(U1, vc), UV(U0, vc))
    triangolo(acc, a1, a2, r2, nUp(a1, a2, r2), UV(U1, V0), UV(U1, V1), UV(U1 - inset, vc))
    triangolo(acc, a3, a0, r1, nUp(a3, a0, r1), UV(U0, V1), UV(U0, V0), UV(U0 + inset, vc))
    if (accFascia) {
      for (const v of [V0, V1]) {
        const A = P(U0, v, hEave + 0.02), B = P(U1, v, hEave + 0.02)
        const centro = A.clone().add(B).multiplyScalar(0.5), rot = Math.atan2(-(B.z - A.z), B.x - A.x)
        scatola(accFascia, centro.x, centro.y - 0.1, centro.z, A.distanceTo(B), 0.16, 0.09, rot)
      }
    }
  } else {
    const uc = (U0 + U1) / 2
    const a0 = P(U0, V0, hEave), a1 = P(U1, V0, hEave), a2 = P(U1, V1, hEave), a3 = P(U0, V1, hEave)
    quadrilatero(acc, a1, a2, r2, r1, nUp(a1, a2, r2), UV(U1, V0), UV(U1, V1), UV(uc, V1 - inset), UV(uc, V0 + inset))
    quadrilatero(acc, a3, a0, r1, r2, nUp(a3, a0, r1), UV(U0, V1), UV(U0, V0), UV(uc, V0 + inset), UV(uc, V1 - inset))
    triangolo(acc, a2, a3, r2, nUp(a2, a3, r2), UV(U1, V1), UV(U0, V1), UV(uc, V1 - inset))
    triangolo(acc, a0, a1, r1, nUp(a0, a1, r1), UV(U0, V0), UV(U1, V0), UV(uc, V0 + inset))
    if (accFascia) {
      for (const u of [U0, U1]) {
        const A = P(u, V0, hEave + 0.02), B = P(u, V1, hEave + 0.02)
        const centro = A.clone().add(B).multiplyScalar(0.5), rot = Math.atan2(-(B.z - A.z), B.x - A.x)
        scatola(accFascia, centro.x, centro.y - 0.1, centro.z, A.distanceTo(B), 0.16, 0.09, rot)
      }
    }
  }
  {
    const centro = r1.clone().add(r2).multiplyScalar(0.5), dir = new THREE.Vector3().subVectors(r2, r1), lung = dir.length(); dir.normalize()
    scatola(acc, centro.x, H + 0.07, centro.z, lung, 0.16, 0.34, Math.atan2(-dir.z, dir.x))
  }
  return H
}

// tettoia a una falda (veranda)
function tettoia(acc, b, u0, u1, v0, v1, hAlto, hBasso, accFascia) {
  const P = (u, v, h) => puntoMondo(b, u, v, h)
  const a = P(u0, v0, hAlto), c = P(u1, v0, hAlto), d = P(u1, v1, hBasso), e = P(u0, v1, hBasso)
  const n = new THREE.Vector3().subVectors(c, a).cross(new THREE.Vector3().subVectors(e, a)).normalize()
  const U = (u1 - u0) / 4.4, V = 3.4
  quadrilatero(acc, a, c, d, e, n, [0, 0], [U, 0], [U, V], [0, V])
  if (accFascia) {
    for (const [v, hh] of [[v0, hAlto], [v1, hBasso]]) {
      const A = P(u0, v, hh), B = P(u1, v, hh)
      const centro = A.clone().add(B).multiplyScalar(0.5), rot = Math.atan2(-(B.z - A.z), B.x - A.x)
      scatola(accFascia, centro.x, centro.y - 0.09, centro.z, A.distanceTo(B), 0.15, 0.09, rot)
    }
  }
}

export function costruisci(opz = {}) {
  const ombre = opz.ombre !== false
  const scena = new THREE.Scene()
  scena.fog = new THREE.Fog(0xdde6e3, 300, 950)
  scena.background = new THREE.Color(0xdde6e3)
  const radice = new THREE.Group()
  scena.add(radice)
  const acc = { cemento: nuovo(), tegole: nuovo(), vetro: nuovo(), vetroCap: nuovo(), telaio: nuovo(), persiane: nuovo(), mattone: nuovo(), pietra: nuovo(), legno: nuovo(), metallo: nuovo(), cotto: nuovo(), fontana: nuovo(), fascia: nuovo(), ombra: nuovo(), lontani: nuovo(), neve: nuovo() }

  // ── dove stanno le cose: la sagoma del lotto, il giardino, il cortile, il viale ──
  const senzaDup = (p) => (p.length > 1 && Math.hypot(p[0][0] - p.at(-1)[0], p[0][1] - p.at(-1)[1]) < 0.05 ? p.slice(0, -1) : p)
  const angoloLato = (p) => {
    let L = 0, a = 0
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length], d = Math.hypot(q[0] - p[i][0], q[1] - p[i][1])
      if (d > L) { L = d; a = Math.atan2(q[1] - p[i][1], q[0] - p[i][0]) }
    }
    return a
  }
  const bbox2 = (p) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]) }
    return [x0, y0, x1, y1]
  }
  const giardino = [[-25, 27], [15, 30], [21, 18], [21, -21], [14, -27], [-11, -27], [-21, -16], [-25, 0]]
  const ghiaia = [[-4, 10], [14, 13], [21, 6], [22, -18], [16, -25], [3, -29], [-3, -25], [-5, -16], [1, -8]]
  const viale = DATI.viale?.length > 1 ? [[17.7, 29.5], ...DATI.viale, [15.5, -22]] : []
  const fc = DATI.fonte.centro
  const casaMeta = DATI.case.casa
  const capMeta = DATI.case.capannone
  const bCap = base(capMeta.angolo, capMeta.centro[0], capMeta.centro[1])

  // ── gli alberi veri (posizioni calcolate prima del terreno: le loro ombre finiscono nell'ortofoto) ──
  const dentroPoligono = (p, poly) => {
    let d = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) d = !d
    }
    return d
  }
  const puntiFilare = (f, passo, jitter = 0) => {
    const out = []
    for (let i = 0; i < f.p.length - 1; i++) {
      const a = f.p[i], b = f.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(1, Math.round(L / passo))
      for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; out.push([a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * jitter, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * jitter]) }
    }
    return out
  }
  const alberi = [] // {x,y,tipo,s}
  const siepi = [] // {p, spessore, altezza}
  // filari OSM: platani lungo il viale, pioppi lungo i campi
  for (const f of DATI.filari) {
    if (f.p.length < 2) continue
    const vicinoSud = f.p.some((q) => Math.hypot(q[0] + 18.4, q[1] + 43.4) < 5) || f.p.some((q) => Math.hypot(q[0] - 17.4, q[1] + 15.4) < 4)
    if (vicinoSud) continue
    const filareVialeOvest = f.p.some((q) => Math.hypot(q[0] - 17.3, q[1] - 21.9) < 3)
    const filareVialeEst = f.p.some((q) => Math.hypot(q[0] - 19.2, q[1] - 22.1) < 3)
    if (filareVialeEst) continue
    const vicinoCasa = f.p.some((q) => Math.hypot(q[0] + 16.7, q[1] - 10.3) < 4)
    const tipo = filareVialeOvest || vicinoCasa ? 'platano' : 'pioppo'
    const passo = tipo === 'platano' ? 7.4 : 10.2
    for (const q of puntiFilare(f, passo, tipo === 'platano' ? 0.75 : 1.1)) {
      if (Math.hypot(q[0], q[1]) > 178) continue
      if (dentroPoligono(q, giardino) && tipo !== 'platano') continue
      const autunno = tipo === 'pioppo' ? rnd() < 0.07 : rnd() < 0.04
      alberi.push({ x: q[0], y: q[1], tipo: autunno ? 'autunno' : tipo, s: tipo === 'platano' ? 0.88 + rnd() * 0.3 : 0.9 + rnd() * 0.32 })
    }
  }
  // alberi del giardino, con qualche autunno
  for (const [x, y, s] of [[-26, -2, 1.05], [-25, -27, 1.0], [18.2, -3.5, 1.0], [7, 14.5, 1.0], [-7, 17, 0.95], [-3.5, 14.8, 0.9]]) alberi.push({ x, y, tipo: rnd() < 0.1 ? 'autunno' : 'platano', s })
  // gelsi nei bordi del giardino
  for (const [x, y, s] of [[-22, 8, 0.95], [19, 6, 0.9], [-9, -24, 0.85]]) alberi.push({ x, y, tipo: 'gelso', s })
  // frutteto a filari dentro il bosco, fuori dal giardino
  const boscoPoly = DATI.campi.filter((c) => c.c === 'wood').map((c) => senzaDup(c.p)).sort((a, b) => b.length - a.length)[0]
  if (boscoPoly) {
    const xx = boscoPoly.map((p) => p[0]), yy = boscoPoly.map((p) => p[1])
    const x0 = Math.min(...xx), x1 = Math.max(...xx), y0 = Math.min(...yy), y1 = Math.max(...yy)
    const ang = 108 * RAD, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx
    for (let a = -140; a < 140; a += 5.5) for (let t = -140; t < 140; t += 4.3) {
      const x = a * nx + t * dx, y = a * ny + t * dy
      if (x < x0 - 4 || x > x1 + 4 || y < y0 - 4 || y > y1 + 4) continue
      if (!dentroPoligono([x, y], boscoPoly)) continue
      if (dentroPoligono([x, y], giardino)) continue
      if (Math.hypot(x, y) > 125) continue
      if (x > -20 && x < 24 && y > -32 && y < 14) continue
      if (Math.hypot(x - fc[0], y - fc[1]) < 9) continue
      alberi.push({ x: x + (rnd() - 0.5) * 0.7, y: y + (rnd() - 0.5) * 0.7, tipo: 'frutteto', s: 0.8 + rnd() * 0.38 })
    }
    // qualche grande albero nel bosco
    for (let i = 0; i < 26; i++) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0)
      if (!dentroPoligono([x, y], boscoPoly) || dentroPoligono([x, y], giardino) || Math.hypot(x, y) > 160) continue
      if (x > -30 && x < 30 && y > -34 && y < 22) continue
      alberi.push({ x, y, tipo: rnd() < 0.07 ? 'autunno' : 'pioppo', s: 1.05 + rnd() * 0.45 })
    }
  }
  // un po' di verde attorno alle case vicine, così non sono scatole sul prato
  for (const e of DATI.edifici) {
    const p = senzaDup(e.p)
    if (p.length < 3) continue
    const bb = bbox2(p), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2
    const dist = Math.hypot(cx, cy)
    if (dist < 28 || dist > 180) continue
    const quanti = dist < 100 ? 4 : 2
    for (let k = 0; k < quanti; k++) {
      const ang = rnd() * 6.28, raggio = 8 + rnd() * 13
      const x = cx + Math.cos(ang) * raggio, y = cy + Math.sin(ang) * raggio
      if (dentroPoligono([x, y], p)) continue
      if (Math.hypot(x, y) > 180) continue
      alberi.push({ x, y, tipo: rnd() < 0.1 ? 'autunno' : rnd() < 0.5 ? 'platano' : 'gelso', s: 0.8 + rnd() * 0.45 })
    }
  }
  // le siepi: filari bassi, il bordo est, la linea davanti al capannone
  {
    const filareEst = DATI.filari.find((f) => f.p.some((q) => Math.hypot(q[0] - 19.2, q[1] - 22.1) < 3))
    if (filareEst) siepi.push({ p: filareEst.p.filter((p) => p[1] > -22), spessore: 1.15, altezza: 1.75 })
    for (const f of DATI.filari) {
      if (f.p.some((q) => Math.hypot(q[0] + 18.4, q[1] + 43.4) < 5) || f.p.some((q) => Math.hypot(q[0] - 17.4, q[1] + 15.4) < 4)) siepi.push({ p: f.p, spessore: 1.35, altezza: 1.7 })
    }
    siepi.push({ p: [aMondo(bCap, -8.1, 6.4), aMondo(bCap, 8.1, 6.4)], spessore: 1.1, altezza: 1.75 })
  }

  // ── il terreno: una finta ortofoto disegnata tutta insieme, e la campagna oltre il lotto ──
  const terra = creaTerreno({ lato: 4096, metri: 700, alberi, siepi, giardino, ghiaia, viale })
  const texTerra = new THREE.CanvasTexture(terra.canvas)
  texTerra.colorSpace = THREE.SRGBColorSpace; texTerra.anisotropy = 8
  texTerra.minFilter = THREE.LinearMipmapLinearFilter; texTerra.magFilter = THREE.LinearFilter
  const matTerra = new THREE.MeshLambertMaterial({ map: texTerra })
  matTerra.onBeforeCompile = (shader) => {
    shader.uniforms.tGrana = { value: T.grana }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tGrana;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat g = texture2D(tGrana, vMapUv * 220.0).r;\n diffuseColor.rgb *= 0.91 + 0.18 * g;')
  }
  matTerra.customProgramCacheKey = () => 'terreno-grana'
  const fondoTerra = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 1, 1), matTerra)
  fondoTerra.name = 'terreno'
  fondoTerra.rotation.x = -Math.PI / 2
  fondoTerra.receiveShadow = true
  radice.add(fondoTerra)
  {
    const lontana = creaTerrenoLontano()
    const texLontana = new THREE.CanvasTexture(lontana.canvas)
    texLontana.colorSpace = THREE.SRGBColorSpace; texLontana.anisotropy = 4
    const sfondo = new THREE.Mesh(new THREE.CircleGeometry(1480, 128), new THREE.MeshLambertMaterial({ map: texLontana }))
    sfondo.name = 'terrenoLontano'
    sfondo.rotation.x = -Math.PI / 2
    sfondo.position.y = -0.06
    radice.add(sfondo)
  }

  // ── acqua animata (fossi, vasche lontane): il resto è nell'ortofoto ──
  const accAcqua = nuovo()
  for (const s of DATI.acqua) {
    if (s.p.length < 2) continue
    const acqua = geoNastro(s.p, s.w, 0.045, 6)
    aggiungiGeo(accAcqua, acqua, new THREE.Matrix4())
    acqua.dispose()
  }
  for (const s of DATI.specchi) {
    const g = geoPoligono(senzaDup(s.p), 0, 6)
    aggiungiGeo(accAcqua, g, new THREE.Matrix4().makeTranslation(0, 0.05, 0))
    g.dispose()
  }

  // ── acqua animata (fossi e fontana) ──
  const acquaUniformi = {
    uTempo: { value: 0 }, uColore: { value: new THREE.Color(0x47716c) }, uFondo: { value: new THREE.Color(0x2b4541) },
    uSole: { value: new THREE.Vector3(0.4, 0.8, 0.3) }, uCielo: { value: new THREE.Color(0xa9c1bf) }, uOnde: { value: 0.32 },
  }
  const matAcqua = new THREE.ShaderMaterial({    uniforms: acquaUniformi, transparent: true, depthWrite: true, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vM; varying vec3 vN; void main(){ vec4 m = modelMatrix * vec4(position,1.0); vM = m.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * m; }`,
    fragmentShader: `uniform float uTempo; uniform vec3 uColore; uniform vec3 uFondo; uniform vec3 uSole; uniform vec3 uCielo; uniform float uOnde; varying vec3 vM; varying vec3 vN;
      void main(){
        vec2 p = vM.xz;
        float o = sin(p.x*2.2 + uTempo*1.1) * 0.5 + sin(p.y*3.1 - uTempo*0.83) * 0.5 + sin((p.x+p.y)*1.4 + uTempo*0.5)*0.4;
        vec3 n = normalize(vN + vec3(o*0.085*uOnde, 0.0, o*0.075*uOnde));
        vec3 v = normalize(cameraPosition - vM);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        float spec = pow(max(dot(reflect(-normalize(uSole), n), v), 0.0), 90.0);
        vec3 c = mix(uFondo, uColore, 0.55 + 0.16*o);
        c = mix(c, uCielo, clamp(fres*0.42, 0.0, 0.44));
        float spec2 = pow(max(dot(reflect(-normalize(uSole), n), v), 0.0), 8.0);
        c += vec3(1.0, 0.96, 0.86) * spec * 0.55 + vec3(0.9, 0.95, 0.9) * spec2 * 0.045;
        c *= 0.97 + 0.03 * sin(p.x * 7.0 + uTempo * 2.1) * sin(p.y * 5.0 - uTempo * 1.7);
        c += vec3(0.012, 0.022, 0.022) * sin(p.x * 4.2 + uTempo * 1.7) * sin(p.y * 3.6 - uTempo * 1.3);
        float ca = smoothstep(0.72, 1.0, sin(p.x * 5.2 + uTempo * 1.1 + sin(p.y * 2.3)) * sin(p.y * 4.7 - uTempo * 1.3));
        c += vec3(0.07, 0.09, 0.085) * ca * 0.16;
        gl_FragColor = vec4(c, 0.94);
      }`,
  })
  const meshAcqua = new THREE.Mesh(new THREE.BufferGeometry(), matAcqua)
  const acquee = [matAcqua]
  meshAcqua.geometry.setAttribute('position', new THREE.Float32BufferAttribute(accAcqua.pos, 3))
  meshAcqua.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(accAcqua.nor, 3))
  meshAcqua.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(accAcqua.uv, 2))
  meshAcqua.geometry.computeBoundingSphere()
  meshAcqua.receiveShadow = false
  radice.add(meshAcqua)

  // ── casa ──
  const bCasa = base(19 * RAD, 0, 0)
  // corpo principale, veranda, ali: la sagoma esatta è nel rilievo
  const corpo = { u0: -8.12, u1: 8.12, v0: -3.7, v1: 8.58, h: 6.35 }
  const veranda = { u0: -8.12, u1: 8.12, v0: -8.57, v1: -3.7, h: 3.2, hb: 3.0 }
  const alaW = { u0: -14.21, u1: -8.12, v0: -2.64, v1: 7.51, h: 6.75 }
  const alaE = { u0: 8.12, u1: 14.21, v0: -2.64, v1: 7.51, h: 5.15 }
  const ap = (lato, c, larghezza, y0, y1, extra = {}) => ({ lato, c, larghezza, y0, y1, ...extra })
  function apertureLato(blocco, lato, aperture) {
    const [u0, u1, v0, v1] = [blocco.u0, blocco.u1, blocco.v0, blocco.v1]
    const p0 = lato === 'S' ? [u0, v0] : lato === 'E' ? [u1, v0] : lato === 'N' ? [u1, v1] : [u0, v1]
    const p1 = lato === 'S' ? [u1, v0] : lato === 'E' ? [u1, v1] : lato === 'N' ? [u0, v1] : [u0, v0]
    const nrm = lato === 'S' ? [0, -1] : lato === 'E' ? [1, 0] : lato === 'N' ? [0, 1] : [-1, 0]
    const H = blocco.h
    const lista = aperture.map((a) => {
      const sc = lato === 'S' ? a.c - u0 : lato === 'E' ? a.c - v0 : lato === 'N' ? u1 - a.c : v1 - a.c
      return { s0: sc - a.larghezza / 2, s1: sc + a.larghezza / 2, y0: a.y0, y1: a.y1, arco: a.arco, persiane: a.persiane, mattone: a.mattone, davanzale: a.davanzale, tipo: a.tipo }
    })
    return { p0, p1, nrm, lista, H }
  }
  function zoccolo(blocco, b = bCasa) {
    for (const lato of ['S', 'E', 'N', 'O']) {
      const [u0, u1, v0, v1] = [blocco.u0, blocco.u1, blocco.v0, blocco.v1]
      const p0 = lato === 'S' ? [u0, v0 - 0.045] : lato === 'E' ? [u1 + 0.045, v0] : lato === 'N' ? [u1, v1 + 0.045] : [u0 - 0.045, v1]
      const p1 = lato === 'S' ? [u1, v0 - 0.045] : lato === 'E' ? [u1 + 0.045, v1] : lato === 'N' ? [u0, v1 + 0.045] : [u0 - 0.045, v0]
      const A = aMondo(b, p0[0], p0[1]), B = aMondo(b, p1[0], p1[1])
      const cx = (A[0] + B[0]) / 2, cy = (A[1] + B[1]) / 2, L = Math.hypot(B[0] - A[0], B[1] - A[1])
      if (L < 0.4) continue
      scatola(acc.pietra, cx, 0.2, -cy, L + 0.08, 0.4, 0.11, Math.atan2(B[1] - A[1], B[0] - A[0]))
    }
  }
  function ombraGronda(blocco, b) {
    for (const lato of ['S', 'E', 'N', 'O']) {
      const [u0, u1, v0, v1] = [blocco.u0, blocco.u1, blocco.v0, blocco.v1]
      const p0 = lato === 'S' ? [u0, v0 - 0.035] : lato === 'E' ? [u1 + 0.035, v0] : lato === 'N' ? [u1, v1 + 0.035] : [u0 - 0.035, v1]
      const p1 = lato === 'S' ? [u1, v0 - 0.035] : lato === 'E' ? [u1 + 0.035, v1] : lato === 'N' ? [u0, v1 + 0.035] : [u0 - 0.035, v0]
      const A = aMondo(b, p0[0], p0[1]), B = aMondo(b, p1[0], p1[1])
      const cx = (A[0] + B[0]) / 2, cy = (A[1] + B[1]) / 2, L = Math.hypot(B[0] - A[0], B[1] - A[1])
      if (L > 0.4) scatola(acc.ombra, cx, blocco.h - 0.15, -cy, L, 0.3, 0.05, Math.atan2(B[1] - A[1], B[0] - A[0]))
    }
  }
  function costruisciBlocco(blocco, lati) {
    for (const lato of ['S', 'E', 'N', 'O']) {
      const { p0, p1, nrm, lista, H } = apertureLato(blocco, lato, lati[lato] ?? [])
      const mur = muro(acc.cemento, bCasa, p0, p1, H, nrm, lista)
      for (const a of lista) serramento(acc.vetro, acc.telaio, acc.persiane, acc.mattone, mur, a, null)
    }
    zoccolo(blocco, bCasa)
    ombraGronda(blocco, bCasa)
  }
  // corpo: finestre grandi ad arco al piano terra, finestre con persiane al piano alto
  costruisciBlocco(corpo, {
    N: [
      ap('N', 0, 4.0, 1.0, 3.4, { arco: true, mattone: true }), ap('N', -5, 2.92, 1.0, 3.2, { arco: true, mattone: true }), ap('N', 5, 2.92, 1.0, 3.2, { arco: true, mattone: true }),
      ap('N', -5, 1.15, 4.45, 5.75, { persiane: true }), ap('N', 5, 1.15, 4.45, 5.75, { persiane: true }), ap('N', 0, 1.3, 4.45, 5.75, { persiane: true }),
    ],
    S: [ap('S', 0, 3.0, 0.1, 2.85, { arco: true, mattone: true }), ap('S', -5, 2.92, 0.5, 2.7, { arco: true }), ap('S', 5, 2.92, 0.5, 2.7, { arco: true }),
      ap('S', -5, 1.15, 4.45, 5.75, { persiane: true }), ap('S', 0, 1.3, 4.45, 5.75, { persiane: true }), ap('S', 5, 1.15, 4.45, 5.75, { persiane: true })],
  })
  // ali
  costruisciBlocco(alaW, {
    O: [ap('O', 5.2, 0.95, 1.25, 2.5, { persiane: true }), ap('O', 2.45, 0.95, 1.25, 2.5, { persiane: true }), ap('O', 5.2, 0.95, 4.35, 5.5, { persiane: true }), ap('O', 2.45, 0.95, 4.35, 5.5, { persiane: true })],
    S: [ap('S', -11.05, 1.35, 0.1, 2.55, { arco: true, mattone: true }), ap('S', -12.2, 1.1, 1.2, 2.4, { persiane: true }), ap('S', -9.84, 1.1, 1.2, 2.4, { persiane: true })],
    N: [ap('N', -9.8, 1.15, 1.2, 2.4, { persiane: true }), ap('N', -12.2, 1.15, 1.2, 2.4, { persiane: true })],
  })
  costruisciBlocco(alaE, {
    E: [ap('E', 5.2, 0.95, 1.2, 2.4, { persiane: true }), ap('E', 2.45, 0.95, 1.2, 2.4, { persiane: true })],
    S: [ap('S', 9.84, 1.2, 0.9, 2.15, { persiane: true }), ap('S', 12.2, 1.1, 0.9, 2.15, { persiane: true })],
    N: [ap('N', 9.8, 1.15, 1.2, 2.4, { persiane: true })],
  })
  // veranda: tre arcate grandi verso il giardino
  costruisciBlocco({ ...veranda, h: veranda.h }, {
    S: [ap('S', 0, 2.95, 0.08, 2.85, { arco: true, mattone: true }), ap('S', -5, 2.92, 0.08, 2.6, { arco: true, mattone: true }), ap('S', 5, 2.92, 0.08, 2.6, { arco: true, mattone: true })],
    E: [ap('E', -6.1, 0.9, 1.0, 2.2)],
    O: [ap('O', -6.1, 0.9, 1.0, 2.2)],
  })
  // i muri della veranda sono più bassi: correggo le altezze dei suoi serramenti (li ho disegnati a 2,6 m, sotto il tetto)
  tetto(acc.tegole, bCasa, corpo.u0, corpo.u1, corpo.v0, corpo.v1, corpo.h, 18 * RAD, 'padiglione', 0.62, acc.fascia)
  tetto(acc.tegole, bCasa, alaW.u0, alaW.u1, alaW.v0, alaW.v1, alaW.h, 18 * RAD, 'padiglione', 0.58, acc.fascia)
  tetto(acc.tegole, bCasa, alaE.u0, alaE.u1, alaE.v0, alaE.v1, alaE.h, 18 * RAD, 'padiglione', 0.58, acc.fascia)
  tettoia(acc.tegole, bCasa, veranda.u0 - 0.5, veranda.u1 + 0.5, veranda.v0 - 0.55, veranda.v1 + 0.1, 3.2, 3.38, acc.fascia)
  // camini
  for (const [u, v, h] of [[-11.2, 5.8, 8.4], [4.2, 4.6, 8.8]]) {
    const p = puntoMondo(bCasa, u, v, h)
    scatola(acc.cemento, p.x, p.y, p.z, 0.6, 1.4, 0.6, -19 * RAD)
    scatola(acc.cotto, p.x, p.y + 0.78, p.z, 0.8, 0.14, 0.8, -19 * RAD)
  }
  // zoccolo e terrazza della veranda
  {
    const z = puntoMondo(bCasa, 0, -3.75, 0.16)
    scatola(acc.cemento, z.x, z.y, z.z, veranda.u1 - veranda.u0 + 0.5, 0.32, 5.2, -19 * RAD)
  }
  // pluviali
  for (const [u, v, h] of [[-14.05, 7.35, 6.4], [13.95, -2.4, 5.0], [-8.25, 8.45, 6.0], [8.25, 8.45, 6.0]]) {
    const p = puntoMondo(bCasa, u, v, h / 2)
    scatola(acc.metallo, p.x, p.y, p.z, 0.08, h, 0.08, 0)
  }
  for (const [u, v] of [[-14.21, -2.64], [-14.21, 7.51], [-8.12, 8.58], [8.12, 8.58]]) {
    const p = puntoMondo(bCasa, u, v, alaW.h / 2)
    scatola(acc.mattone, p.x, p.y, p.z, 0.38, alaW.h, 0.38, -19 * RAD)
  }
  // pergola di legno con la vite, addossata al lato ovest della torre
  {
    const hPergola = 2.65
    for (const [u, v] of [[-19.0, -0.8], [-19.0, 4.4], [-14.9, -0.8], [-14.9, 4.4]]) {
      const p = puntoMondo(bCasa, u, v, hPergola / 2)
      scatola(acc.legno, p.x, p.y, p.z, 0.16, hPergola, 0.16, -19 * RAD)
    }
    for (const v of [-0.8, 4.4]) {
      const a = puntoMondo(bCasa, -19.0, v, hPergola + 0.08), b = puntoMondo(bCasa, -14.9, v, hPergola + 0.08)
      const centro = a.clone().add(b).multiplyScalar(0.5), dir = new THREE.Vector3().subVectors(b, a)
      scatola(acc.legno, centro.x, centro.y, centro.z, dir.length(), 0.16, 0.18, Math.atan2(-dir.z, dir.x))
    }
    for (let u = -18.8; u <= -15.0; u += 0.55) {
      const a = puntoMondo(bCasa, u, -1.0, hPergola + 0.22), b = puntoMondo(bCasa, u, 4.6, hPergola + 0.22)
      const centro = a.clone().add(b).multiplyScalar(0.5), dir = new THREE.Vector3().subVectors(b, a)
      scatola(acc.legno, centro.x, centro.y, centro.z, dir.length(), 0.05, 0.07, Math.atan2(-dir.z, dir.x))
    }
    // chioma di vite sulla pergola
    const matVite = new THREE.MeshLambertMaterial({ color: 0x5d7d43, flatShading: true })
    for (let i = 0; i < 7; i++) {
      const u = -18.8 + rnd() * 3.8, v = -0.6 + rnd() * 4.6
      const p = puntoMondo(bCasa, u, v, hPergola + 0.35 + rnd() * 0.25)
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), matVite)
      s.position.copy(p); s.scale.set(0.95 + rnd() * 0.7, 0.35 + rnd() * 0.25, 0.6 + rnd() * 0.5); s.rotation.y = rnd() * 6
      s.castShadow = true; radice.add(s)
    }
  }

  // ── capannone ──
  const cap = { u0: -8.12, u1: 8.12, v0: -5.075, v1: 5.075, h: 4.95 }
  for (const [u, v] of [[-8.0, -5.0], [8.0, 5.0], [-8.0, 5.0], [8.0, -5.0]]) {
    const p = puntoMondo(bCap, u, v, 2.4)
    scatola(acc.metallo, p.x, p.y, p.z, 0.08, 4.8, 0.08, 0)
  }
  function bloccoCap(blocco, lati) {
    for (const lato of ['S', 'E', 'N', 'O']) {
      const p0 = lato === 'S' ? [blocco.u0, blocco.v0] : lato === 'E' ? [blocco.u1, blocco.v0] : lato === 'N' ? [blocco.u1, blocco.v1] : [blocco.u0, blocco.v1]
      const p1 = lato === 'S' ? [blocco.u1, blocco.v0] : lato === 'E' ? [blocco.u1, blocco.v1] : lato === 'N' ? [blocco.u0, blocco.v1] : [blocco.u0, blocco.v0]
      const nrm = lato === 'S' ? [0, -1] : lato === 'E' ? [1, 0] : lato === 'N' ? [0, 1] : [-1, 0]
      const lista = (lati[lato] ?? []).map((a) => {
        const sc = lato === 'S' ? a.c - blocco.u0 : lato === 'E' ? a.c - blocco.v0 : lato === 'N' ? blocco.u1 - a.c : blocco.v1 - a.c
        return { s0: sc - a.larghezza / 2, s1: sc + a.larghezza / 2, y0: a.y0, y1: a.y1, arco: a.arco, mattone: a.mattone, persiane: a.persiane, davanzale: a.davanzale }
      })
      const mur = muro(acc.cemento, bCap, p0, p1, blocco.h, nrm, lista)
      for (const a of lista) serramento(acc.vetroCap, acc.telaio, acc.persiane, acc.mattone, mur, a, null)
    }
    zoccolo(blocco, bCap)
    ombraGronda(blocco, bCap)
  }
  bloccoCap(cap, {
    S: [ap('S', -1.5, 2.92, 0.06, 3.0, { arco: true, mattone: true }), ap('S', 2.2, 2.92, 0.06, 3.0, { arco: true, mattone: true }), ap('S', 5.85, 2.92, 0.06, 3.0, { arco: true, mattone: true }), ap('S', -5.0, 1.1, 1.5, 2.55), ap('S', -3.55, 1.1, 1.5, 2.55)],
    N: [ap('N', 0.6, 3.0, 0.05, 3.5), ap('N', -4.6, 1.1, 1.6, 2.5), ap('N', 5.3, 1.1, 1.6, 2.5)],
    O: [ap('O', 1.7, 1.1, 1.2, 2.4, { persiane: true })],
    E: [ap('E', 1.4, 1.6, 0.05, 2.7, { arco: true }), ap('E', 4.0, 0.9, 4.1, 5.1)],
  })
  const hColmoCap = tetto(acc.tegole, bCap, cap.u0, cap.u1, cap.v0, cap.v1, cap.h, 16 * RAD, 'falde', 0.62, acc.fascia)
  // gable ends del capannone
  {
    const vc = 0, H = hColmoCap
    for (const u of [cap.u0, cap.u1]) {
      const a = puntoMondo(bCap, u, cap.v0, cap.h), c = puntoMondo(bCap, u, cap.v1, cap.h), d = puntoMondo(bCap, u, vc, H)
      const n = new THREE.Vector3().subVectors(c, a).cross(new THREE.Vector3().subVectors(d, a)).normalize()
      triangolo(acc.cemento, a, c, d, n, [0, 0], [3, 0], [1.5, 2])
    }
    // camino del capannone
    const p = puntoMondo(bCap, -5.8, 0.6, H + 0.1)
    scatola(acc.cemento, p.x, p.y, p.z, 0.55, 1.2, 0.55, -capMeta.angolo)
  }
  // zoccolo
  {
    const p = puntoMondo(bCap, 0, 0, 0.22)
    scatola(acc.cemento, p.x, p.y, p.z, 16.7, 0.44, 10.6, -capMeta.angolo)
  }
  // pannelli solari sulla falda sud-ovest (lato v negativo)
  {
    const u0 = -6.3, u1 = 6.1, vv0 = -4.25, vv1 = -0.9
    const V0f = cap.v0 - 0.62
    const P = (u, v) => {
      const h = cap.h + (hColmoCap - cap.h) * ((v - V0f) / (0 - V0f))
      const p = puntoMondo(bCap, u, v, h + 0.12)
      return p
    }
    const a = P(u0, vv0), c = P(u1, vv0), d = P(u1, vv1), e = P(u0, vv1)
    const n = new THREE.Vector3().subVectors(c, a).cross(new THREE.Vector3().subVectors(e, a)).normalize()
    if (n.y < 0) n.negate()
    // un solo pannello grande con la griglia delle celle, più cornice metallica
    const matSolare = MAT.solare
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z, a.x, a.y, a.z, d.x, d.y, d.z, e.x, e.y, e.z], 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z], 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2))
    const pannello = new THREE.Mesh(geo, matSolare)
    pannello.name = 'pannello'
    pannello.castShadow = true
    radice.add(pannello)
    for (const [p1, p2] of [[a, c], [c, d], [d, e], [e, a]]) {
      const centro = p1.clone().add(p2).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(p2, p1), lung = dir.length(); dir.normalize()
      scatola(acc.metallo, centro.x, centro.y, centro.z, lung, 0.06, 0.08, Math.atan2(-dir.z, dir.x))
    }
  }

  // ── fontana (sagoma esatta da OSM) ──
  const fp = DATI.fonte.p
  const rimpicciolisci = (p, f) => p.map((q) => [fc[0] + (q[0] - fc[0]) * f, fc[1] + (q[1] - fc[1]) * f])
  const fonteEsterna = senzaDup(fp), fonteInterna = rimpicciolisci(fonteEsterna, 0.9)
  {
    const forma = new THREE.Shape(fonteEsterna.map((p) => new THREE.Vector2(p[0], p[1])))
    const buco = new THREE.Path(fonteInterna.slice().reverse().map((p) => new THREE.Vector2(p[0], p[1])))
    forma.holes.push(buco)
    const g = new THREE.ExtrudeGeometry(forma, { depth: 0.55, bevelEnabled: false, curveSegments: 4 })
    g.rotateX(-Math.PI / 2)
    const m = new THREE.Mesh(g, MAT.fontana); m.castShadow = true; m.receiveShadow = true; radice.add(m)
    // copertina in cotto
    const forma2 = new THREE.Shape(fonteEsterna.map((p) => new THREE.Vector2(p[0], p[1])))
    const buco2 = new THREE.Path(fonteInterna.map((p) => new THREE.Vector2(p[0], p[1])))
    forma2.holes.push(buco2)
    const g2 = new THREE.ExtrudeGeometry(forma2, { depth: 0.1, bevelEnabled: false, curveSegments: 4 })
    g2.rotateX(-Math.PI / 2); g2.translate(0, 0.55, 0)
    const m2 = new THREE.Mesh(g2, MAT.cotto); m2.castShadow = true; radice.add(m2)
    // fondo del vascone
    const fondoGeo = new THREE.ShapeGeometry(new THREE.Shape(fonteInterna.map((p) => new THREE.Vector2(p[0], p[1]))))
    fondoGeo.rotateX(-Math.PI / 2); fondoGeo.translate(0, 0.2, 0)
    const fondoVasca = new THREE.Mesh(fondoGeo, new THREE.MeshStandardMaterial({ color: 0x35625e, roughness: 0.9 }))
    fondoVasca.receiveShadow = true; radice.add(fondoVasca)
    // acqua
    const acquaGeo = new THREE.ShapeGeometry(new THREE.Shape(fonteInterna.map((p) => new THREE.Vector2(p[0], p[1]))))
    acquaGeo.rotateX(-Math.PI / 2); acquaGeo.translate(0, 0.47, 0)
    const matFonte = matAcqua.clone()
    matFonte.uniforms = THREE.UniformsUtils.clone(matAcqua.uniforms)
    matFonte.uniforms.uColore.value = new THREE.Color(0x5f9a92)
    matFonte.uniforms.uFondo.value = new THREE.Color(0x386b67)
    matFonte.uniforms.uOnde.value = 1.2
    acquee.push(matFonte)
    const acquaFonte = new THREE.Mesh(acquaGeo, matFonte); acquaFonte.receiveShadow = true; radice.add(acquaFonte)
    // (la ghiaia attorno alla fontana è già nell'ortofoto: niente disco piatto sopra)
  }
  // becchetta a cigno e zampilli
  const pBecco = new THREE.Vector3(-6.3, 0.66, 14.9) // (x, y, -nord): punto sull'abside
  {
    // tubo a cigno in acciaio, appoggiato al bordo
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pBecco.x + 0.15, 0.64, pBecco.z + 0.15),
      new THREE.Vector3(pBecco.x + 0.05, 1.5, pBecco.z + 0.1),
      new THREE.Vector3(pBecco.x - 0.15, 2.15, pBecco.z - 0.05),
      new THREE.Vector3(pBecco.x - 0.7, 2.35, pBecco.z - 0.35),
      new THREE.Vector3(pBecco.x - 1.25, 2.2, pBecco.z - 0.6),
    ])
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 28, 0.038, 6, false), MAT.metallo)
    tubo.castShadow = true; radice.add(tubo)
    const flangia = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 10), MAT.metallo)
    flangia.position.set(pBecco.x + 0.15, 0.66, pBecco.z + 0.15); radice.add(flangia)
    // velo d'acqua dal becco al pelo dell'acqua
    const gocce = []
    for (let i = 0; i < 26; i++) {
      const t = i / 25
      gocce.push(new THREE.Vector3(pBecco.x - 1.25 - 1.35 * t, 2.2 - 1.38 * t * t, pBecco.z - 0.6 - 0.5 * t))
    }
    const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints(gocce), new THREE.LineBasicMaterial({ color: 0xd8f1ee, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }))
    radice.add(linea)
    const caduta = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gocce.filter((_, i) => i % 3 === 0)), 24, 0.022, 5, false), new THREE.MeshBasicMaterial({ color: 0xd8f1ee, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }))
    radice.add(caduta)
  }
  // zampilli centrali: coni sottili, trasparenti, senza tappi
  const zampilloMat = new THREE.MeshBasicMaterial({ color: 0xd6efea, transparent: true, opacity: 0.11, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  const zampilli = new THREE.Group()
  const getti = [[0, 0, 1.85, 0.07], [-0.55, 0.2, 1.25, -0.16], [0.5, -0.25, 1.35, 0.15], [0.35, 0.55, 1.05, 0.1]]
  for (const [dx, dz, h, tilt] of getti) {
    const g = new THREE.CylinderGeometry(0.1, 0.018, h, 6, 1, true)
    const m = new THREE.Mesh(g, zampilloMat)
    m.position.set(fc[0] + dx, 0.52 + h / 2, -fc[1] + dz)
    m.rotation.z = tilt
    m.userData.getto = true
    zampilli.add(m)
  }
  const schiuma = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.65, 20), new THREE.MeshBasicMaterial({ color: 0xe8fffb, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
  schiuma.rotation.x = -Math.PI / 2; schiuma.position.set(fc[0], 0.505, -fc[1])
  zampilli.add(schiuma)
  radice.add(zampilli)
  // aironi: due sculture di pietra grigia sul bordo
  const matAirone = new THREE.MeshStandardMaterial({ color: 0x74807b, roughness: 0.92 })
  const matAironeChiaro = new THREE.MeshStandardMaterial({ color: 0x98a19b, roughness: 0.9 })
  function airone(x, y, scala = 0.85) {
    const g = new THREE.Group()
    const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), matAirone)
    corpo.scale.set(2.1, 0.85, 0.8); corpo.position.set(0.05, 1.12, 0)
    const ali = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 5), matAironeChiaro)
    ali.scale.set(1.7, 0.6, 0.72); ali.position.set(-0.04, 1.16, 0)
    const collo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.24, 1.1, 0), new THREE.Vector3(0.33, 1.42, 0.01), new THREE.Vector3(0.28, 1.74, 0), new THREE.Vector3(0.21, 1.9, 0),
    ]), 12, 0.028, 5, false), matAirone)
    const testa = new THREE.Mesh(new THREE.SphereGeometry(0.095, 7, 5), matAirone); testa.position.set(0.2, 1.93, 0)
    const becco = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.3, 5), new THREE.MeshStandardMaterial({ color: 0xb89958, roughness: 0.75 }))
    becco.rotation.z = -Math.PI / 2; becco.position.set(0.4, 1.91, 0)
    g.add(corpo, ali, collo, testa, becco)
    for (const z of [-0.07, 0.07]) {
      const gamba = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.92, 4), matAirone)
      gamba.position.set(0.02, 0.46, z); g.add(gamba)
      const piede = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.04), matAirone)
      piede.position.set(0.09, 0.02, z); g.add(piede)
    }
    g.position.set(x, 0.65, -y); g.scale.setScalar(scala)
    g.rotation.y = Math.atan2(fc[1] - y, fc[0] - x)
    g.traverse((o) => { if (o.isMesh) o.castShadow = true })
    return g
  }
  // il primo sul lato lungo a nord-ovest, il secondo sull'abside
  radice.add(airone(-13.0, -17.37, 0.95), airone(-5.65, -16.35, 0.85))

  // ── il cortile vissuto: un'auto, il trattore, la legna e qualche vaso ──
  {
    const mVernice = new THREE.MeshStandardMaterial({ color: 0x5a6870, roughness: 0.32, metalness: 0.5 })
    const mVerde = new THREE.MeshStandardMaterial({ color: 0x335a37, roughness: 0.52, metalness: 0.28 })
    const mGomma = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.92 })
    const mVetroAuto = new THREE.MeshStandardMaterial({ color: 0x1b2a2e, roughness: 0.12, metalness: 0.45 })
    const mFaro = new THREE.MeshStandardMaterial({ color: 0xfff2c8, roughness: 0.15, emissive: 0xffedb0, emissiveIntensity: 0.08 })
    const mRosso = new THREE.MeshStandardMaterial({ color: 0x6f1f1c, roughness: 0.35, metalness: 0.3 })
    const gruppo = (x, y, rot) => { const g = new THREE.Group(); g.position.set(x, 0, -y); g.rotation.y = rot; g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } }); radice.add(g); return g }
    const pezzo = (g, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m }
    const ruota = (g, x, y, z, r, sp) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, sp, 18), mGomma); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); m.castShadow = true; g.add(m)
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r * 0.52, sp + 0.015, 12), MAT.metallo); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); c.castShadow = true; g.add(c)
    }
    const piedeOmbra = (x, y, rot, w, h) => {
      const g = new THREE.Group(); g.position.set(x, 0.062, -y); g.rotation.y = rot
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T.ombraAlbero, transparent: true, depthWrite: false, color: 0x1f2a16, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }))
      m.rotation.x = -Math.PI / 2; m.scale.set(w, h, 1); m.renderOrder = 1
      g.add(m); radice.add(g)
    }
    // l'auto in cortile
    const auto = gruppo(14.8, -8.6, -0.5)
    piedeOmbra(14.8, -8.6, -0.5, 5.1, 3.5)
    pezzo(auto, mVernice, 0, 0.62, 0, 4.2, 0.56, 1.78)
    pezzo(auto, mVetroAuto, -0.15, 1.13, 0, 2.15, 0.52, 1.62)
    pezzo(auto, mVernice, -0.15, 1.42, 0, 2.05, 0.09, 1.56)
    pezzo(auto, mVernice, 1.65, 0.98, 0, 0.9, 0.22, 1.64)
    ruota(auto, -1.28, 0.34, 0.86, 0.34, 0.22); ruota(auto, -1.28, 0.34, -0.86, 0.34, 0.22)
    ruota(auto, 1.3, 0.34, 0.86, 0.34, 0.22); ruota(auto, 1.3, 0.34, -0.86, 0.34, 0.22)
    for (const z of [0.58, -0.58]) {
      pezzo(auto, mFaro, 2.11, 0.68, z, 0.05, 0.16, 0.34)
      pezzo(auto, mRosso, -2.11, 0.68, z, 0.05, 0.14, 0.34)
    }
    // il trattore davanti al capannone
    const trattore = gruppo(18.2, -18.6, 0.5)
    piedeOmbra(18.2, -18.6, 0.5, 4.3, 3.2)
    pezzo(trattore, mVerde, -0.1, 0.86, 0, 2.6, 0.8, 1.35)
    pezzo(trattore, mVerde, 0.75, 1.42, 0, 1.25, 0.58, 1.15)
    pezzo(trattore, mVetroAuto, -0.55, 1.65, 0, 1.15, 1.05, 1.2)
    pezzo(trattore, mVerde, -0.55, 2.22, 0, 1.3, 0.1, 1.3)
    ruota(trattore, -0.8, 0.72, 0.82, 0.72, 0.4); ruota(trattore, -0.8, 0.72, -0.82, 0.72, 0.4)
    ruota(trattore, 1.12, 0.45, 0.7, 0.45, 0.28); ruota(trattore, 1.12, 0.45, -0.7, 0.45, 0.28)
    pezzo(trattore, mGomma, 0.98, 1.55, 0.35, 0.1, 0.6, 0.1)
    // la legna accatastata sotto la pergola
    const legna = gruppo(-12.2, 3.8, -0.3)
    for (let i = 0; i < 9; i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.2, 8), MAT.legnoScuro)
      t.rotation.z = Math.PI / 2; t.position.set(0, 0.16 + Math.floor(i / 3) * 0.25, (i % 3) * 0.28 - 0.28)
      t.castShadow = true; t.receiveShadow = true; legna.add(t)
    }
    // due vasi con il bosso davanti alla casa
    for (const [x, y] of [[10.7, -3.4], [12.1, -5.1]]) {
      const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.45, 12), MAT.cotto)
      vaso.position.set(x, 0.22, -y); vaso.castShadow = true; radice.add(vaso)
      const cesp = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), new THREE.MeshLambertMaterial({ color: 0x4e6b3e }))
      cesp.position.set(x, 0.75, -y); cesp.scale.y = 0.8; cesp.castShadow = true; radice.add(cesp)
    }
  }

  // ── alberi e siepi in 3D: chiome a lobi irregolari, non palline perfette ──
  // ogni chioma è fatta di 3–5 sfere schiacciate e ruotate, con un colore diverso per lobo:
  // da lontano si legge il volume, da vicino non si vede la sfera singola.
  function deforma(geo, seme) {
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const n = 1 + 0.11 * Math.sin(x * 7.1 + y * 5.3 + z * 8.7 + seme) + 0.06 * Math.sin(x * 13.3 - y * 11.1 + z * 7.7 + seme * 2)
      p.setXYZ(i, x * n, y * n, z * n)
    }
    geo.computeVertexNormals()
    return geo
  }
  const geoLobo = deforma(new THREE.SphereGeometry(1, 14, 10), 7)
  const geoLoboPiccolo = deforma(new THREE.SphereGeometry(1, 9, 7), 13)
  const matChioma = new THREE.MeshLambertMaterial({ map: T.foglie, color: 0xffffff })
  const matTronco = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const colora = (cfg, basso = 0) => {
    const c = new THREE.Color(cfg.colori[Math.floor(rnd() * cfg.colori.length)])
    return c.multiplyScalar((0.7 + rnd() * 0.22) * (1 - basso * 0.14))
  }
  const lobi = [], tronchi = []
  for (const a of alberi) {
    const cfg = TIPI_ALBERO[a.tipo] ?? TIPI_ALBERO.platano
    const sc = a.s ?? 1
    const altT = cfg.tronco * sc
    tronchi.push({ x: a.x, y: -a.y, alt: altT, r: 0.19 * sc * (a.tipo === 'pioppo' ? 0.8 : 1), col: new THREE.Color(a.tipo === 'pioppo' ? 0xa99f8f : 0x6b5a47).multiplyScalar(0.82 + rnd() * 0.18) })
    const R = cfg.chioma * sc
    if (a.tipo === 'pioppo') {
      // colonna di pioppo: cinque lobi sovrapposti, un po' sbilanciati
      const H = (cfg.alto ?? 6) * sc
      const strati = [[0.16, 1.02, 0.84, 0.34], [0.35, 1.16, 0.9, 0.4], [0.55, 1.05, 0.86, 0.38], [0.75, 0.86, 0.78, 0.32], [0.91, 0.58, 0.58, 0.22]]
      for (let i = 0; i < strati.length; i++) {
        const [f, sx, sz, sy] = strati[i]
        const c = colora(cfg, 1 - f)
        lobi.push({ x: a.x + (rnd() - 0.5) * R * 0.55 * (1 - f), y: altT + H * f, z: -a.y + (rnd() - 0.5) * R * 0.55 * (1 - f), rx: R * sx, ry: H * sy, rz: R * sz, rot: rnd() * 6.28, col: c })
      }
    } else {
      // latifoglie e frutteto: lobi sovrapposti, una sola chioma tondeggiante
      const frutto = a.tipo === 'frutteto'
      const n = frutto ? 3 : 4
      const cy = altT + R * (frutto ? 0.38 : 0.62)
      const off = frutto
        ? [[0, 0.02, 0, 1.12, 0.92, 1.12], [0.34, -0.14, 0.12, 0.88, 0.76, 0.9], [-0.3, -0.08, -0.16, 0.9, 0.78, 0.88]]
        : [[0, 0.1, 0, 1.02, 0.92, 1.02], [0.4, -0.05, 0.2, 0.84, 0.74, 0.86], [-0.38, -0.02, -0.22, 0.86, 0.72, 0.84], [0.04, 0.44, -0.04, 0.72, 0.6, 0.68]]
      for (let i = 0; i < n; i++) {
        const [ox, oy, oz, sx, sy, sz] = off[i]
        lobi.push({ x: a.x + ox * R, y: cy + oy * R, z: -a.y + oz * R, rx: R * sx, ry: R * sy, rz: R * sz, rot: rnd() * 6.28, col: colora(cfg, oy < 0 ? 1 : 0) })
      }
    }
  }
  // le siepi: due file di lobi bassi, una sopra l'altra, così il bordo non è una scatola
  const lobiSiepe = []
  for (const si of siepi) {
    const sp = si.spessore ?? 1.2, alt = si.altezza ?? 1.7
    for (let i = 0; i < si.p.length - 1; i++) {
      const a = si.p[i], b = si.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.3) continue
      const n = Math.max(1, Math.round(L / 1.15))
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        const x = a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 0.35
        const y = a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 0.35
        const rr = (0.52 + rnd() * 0.15) * Math.max(0.85, sp)
        lobiSiepe.push({ x, y: rr * 0.85, z: -y, rx: rr, ry: rr * 0.82, rz: rr, rot: rnd() * 6.28, col: colora(TIPI_ALBERO.siepe) })
        lobiSiepe.push({ x: x + (rnd() - 0.5) * 0.4, y: alt * 0.65 + rr * 0.25, z: -y + (rnd() - 0.5) * 0.4, rx: rr * 0.8, ry: rr * 0.7, rz: rr * 0.8, rot: rnd() * 6.28, col: colora(TIPI_ALBERO.siepe, 0.5) })
      }
    }
  }
  const creaLobi = (lista, geo, ombre) => {
    if (!lista.length) return
    const mesh = new THREE.InstancedMesh(geo, matChioma, lista.length)
    mesh.castShadow = ombre; mesh.receiveShadow = true
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), eu = new THREE.Euler()
    lista.forEach((l, i) => {
      pos.set(l.x, l.y, l.z); sc.set(l.rx, l.ry, l.rz)
      eu.set((rnd() - 0.5) * 0.22, l.rot, (rnd() - 0.5) * 0.22); q.setFromEuler(eu)
      m.compose(pos, q, sc); mesh.setMatrixAt(i, m); mesh.setColorAt(i, l.col)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    radice.add(mesh)
  }
  creaLobi(lobi, geoLobo, true)
  creaLobi(lobiSiepe, geoLoboPiccolo, false)
  // il piede d'ombra delle chiome: àncora gli alberi al prato, come nell'occlusione ambientale di una foto aerea
  {
    const geo = new THREE.PlaneGeometry(1, 1)
    const mat = new THREE.MeshBasicMaterial({ map: T.ombraAlbero, transparent: true, depthWrite: false, color: 0xffffff, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    const mesh = new THREE.InstancedMesh(geo, mat, alberi.length)
    mesh.name = 'piediAlberi'
    mesh.renderOrder = 1
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), sc = new THREE.Vector3(), pos = new THREE.Vector3()
    alberi.forEach((a, i) => {
      const cfg = TIPI_ALBERO[a.tipo] ?? TIPI_ALBERO.platano
      const rr = cfg.chioma * (a.s ?? 1)
      pos.set(a.x, 0.055, -a.y); sc.set(rr * 2.5, rr * 1.75, 1)
      m.compose(pos, q, sc); mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    radice.add(mesh)
  }
  {
    const geo = new THREE.CylinderGeometry(1, 1.25, 1, 6)
    const mesh = new THREE.InstancedMesh(geo, matTronco, tronchi.length)
    mesh.castShadow = true; mesh.receiveShadow = true
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3()
    tronchi.forEach((t, i) => {
      pos.set(t.x, t.alt / 2, t.y); sc.set(t.r, t.alt, t.r); q.setFromAxisAngle(UP, rnd() * 6.28)
      m.compose(pos, q, sc); mesh.setMatrixAt(i, m); mesh.setColorAt(i, t.col)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    radice.add(mesh)
  }

  // ── recinzioni: paletti e filo lungo le linee rosse del rilievo ──
  const accRecinti = nuovo(), fili = []
  const recinto = (linea, alto = 1.15, buco = null) => {
    for (let i = 0; i < linea.length - 1; i++) {
      const a = linea[i], b = linea[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.5) continue
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
      if (buco && Math.hypot(mx - buco[0], my - buco[1]) < 4.2) continue
      const n = Math.max(1, Math.round(L / 6))
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t
        scatola(accRecinti, x, alto / 2, -y, 0.08, alto, 0.08, 0)
      }
      for (const h of [0.45, 0.95]) fili.push(a[0], h, -a[1], b[0], h, -b[1])
    }
  }
  for (const r of DATI.recinzioni) recinto(r)
  recinto([...DATI.confine, DATI.confine[0]], 1.05, [17.7, 29.5])
  const meshRecinti = meshDa(accRecinti, MAT.legno); meshRecinti.name = 'recinti'; radice.add(meshRecinti)
  {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(fili, 3))
    const f = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x5a564c, transparent: true, opacity: 0.6 }))
    f.name = 'fili'; radice.add(f)
  }

  // ── edifici OSM: i vicini con le finestre, i lontani come volumi colorati ──
  const muriLontani = [0xdfd3bd, 0xd8c9ad, 0xe4d8c0, 0xcdbfa6, 0xd9c6ab], tettiLontani = [0x8a5540, 0x96604a, 0x7f4d39, 0xa06850]
  for (const e of DATI.edifici) {
    const p = senzaDup(e.p)
    if (p.length < 3) continue
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ang = angoloLato(p)
    const bb = base(ang, cx, cy), u = (x1 - x0) / 2, v = (y1 - y0) / 2
    const vicino = Math.hypot(cx, cy) < 132
    const forma = formaLocali(p)
    const geo = new THREE.ExtrudeGeometry(forma, { depth: e.h, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    const cv = coloreV(vicino ? muriLontani[Math.round(Math.abs(cx + cy)) % muriLontani.length] : muriLontani[Math.round(Math.abs(cx * 3 + cy)) % muriLontani.length])
    aggiungiGeo(acc.lontani, geo, new THREE.Matrix4(), cv); geo.dispose()
    // tetto a due falde basso sul rettangolo d'ingombro (non un padiglione gigante)
    const P = (a, c, h) => puntoMondo(bb, a, c, h)
    const colTetto = coloreV(tettiLontani[Math.round(Math.abs(cx - cy)) % tettiLontani.length])
    const H = e.h + clamp(Math.min(u, v) * 0.32, 0.55, 2.0)
    const ov = vicino ? 0.38 : 0.25
    const e0 = P(-u - ov, -v - ov, e.h), e1 = P(u + ov, -v - ov, e.h), e2 = P(u + ov, v + ov, e.h), e3 = P(-u - ov, v + ov, e.h)
    const tri = (a, b, c, col) => {
      const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize()
      if (n.y < 0) n.negate()
      triangolo(acc.lontani, a, b, c, n, [0, 0], [1, 0], [0.5, 1], col)
    }
    if (u >= v) {
      const r1 = P(-u - ov, 0, H), r2 = P(u + ov, 0, H)
      tri(e0, e1, r2, colTetto); tri(e0, r2, r1, colTetto)
      tri(e2, e3, r1, colTetto); tri(e2, r1, r2, colTetto)
      tri(e1, e2, r2, colTetto); tri(e3, e0, r1, colTetto)
    } else {
      const r1 = P(0, -v - ov, H), r2 = P(0, v + ov, H)
      tri(e1, e2, r2, colTetto); tri(e1, r2, r1, colTetto)
      tri(e3, e0, r1, colTetto); tri(e3, r1, r2, colTetto)
      tri(e0, e1, r1, colTetto); tri(e2, e3, r2, colTetto)
    }
    // caminetto, per i vicini
    if (vicino) {
      const c = P(-u * 0.35, 0, H + 0.05)
      scatola(acc.cotto, c.x, c.y, c.z, 0.5, 1.1, 0.5, ang)
    }
    // finestre e portoncino, solo dove si vedono davvero
    if (vicino) {
      const finestre = (n, lungo) => {
        for (let i = 0; i < n; i++) {
          const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * 0.7
          for (const lat of [-1, 1]) {
            const uu = lungo ? t * u * 1.6 : lat * (u - 0.02)
            const vv = lungo ? lat * (v - 0.02) : t * v * 1.6
            const q = P(uu, vv, 1.45)
            const rot = lungo ? ang : ang + Math.PI / 2
            scatola(acc.telaio, q.x, q.y, q.z, 1.04, 1.4, 0.08, rot)
            const q2 = P(uu + (lungo ? 0 : lat * 0.055), vv + (lungo ? lat * 0.055 : 0), 1.45)
            scatola(acc.vetroCap, q2.x, q2.y, q2.z, 0.84, 1.16, 0.05, rot)
            // davanzale chiaro
            const q3 = P(uu + (lungo ? 0 : lat * 0.08), vv + (lungo ? lat * 0.08 : 0), 0.71)
            scatola(acc.telaio, q3.x, q3.y, q3.z, 1.18, 0.08, 0.14, rot)
          }
        }
      }
      finestre(u > v ? 3 : 2, true)
      finestre(u > v ? 2 : 3, false)
    }
  }
  const meshLontani = meshDa(acc.lontani, MAT.lontani, true); meshLontani.name = 'lontani'; meshLontani.receiveShadow = true; radice.add(meshLontani)

  // ── costruisci le mesh della casa, del capannone, dei dettagli ──
  for (const [chiave, mat] of [['cemento', MAT.cemento], ['tegole', MAT.tegole], ['vetro', MAT.vetro], ['vetroCap', MAT.vetroCap], ['telaio', MAT.telaio], ['persiane', MAT.persiana], ['mattone', MAT.mattone], ['pietra', MAT.pietra], ['metallo', MAT.metallo], ['cotto', MAT.cotto], ['fascia', MAT.fascia], ['fontana', MAT.fontana]]) {
    if (!acc[chiave].pos.length) continue
    const m = meshDa(acc[chiave], mat)
    m.name = chiave
    radice.add(m)
  }
  if (acc.ombra.pos.length) {
    const m = meshDa(acc.ombra, MAT.ombraMuro)
    m.name = 'ombra'
    m.castShadow = false; m.receiveShadow = false; m.renderOrder = 1
    radice.add(m)
  }

  // ── cielo ──
  const cieloUniformi = {
    uAlto: { value: new THREE.Color(0x6fa9dd) }, uOrizzonte: { value: new THREE.Color(0xd8e4e5) }, uFoschia: { value: new THREE.Color(0xd9e2df) },
    uSole: { value: new THREE.Vector3(0.3, 0.7, 0.1) }, uSoleCol: { value: new THREE.Color(0xfff2da) }, uNotte: { value: 0 },
    uNuvole: { value: 0.1 }, uTempo: { value: 0 }, uVento: { value: 0.4 }, uLampo: { value: 0 },
  }
  const cielo = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: cieloUniformi, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uAlto; uniform vec3 uOrizzonte; uniform vec3 uFoschia; uniform vec3 uSole; uniform vec3 uSoleCol; uniform float uNotte; uniform float uNuvole; uniform float uTempo; uniform float uVento; uniform float uLampo; varying vec3 vD;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
        void main(){
          float h = clamp(vD.y, -0.1, 1.0);
          vec3 c = mix(uOrizzonte, uAlto, pow(max(h,0.0), 0.55));
          c = mix(c, uFoschia, smoothstep(0.18, -0.02, h));
          float s = max(dot(normalize(vD), normalize(uSole)), 0.0);
          c += uSoleCol * (pow(s, 1400.0) * 1.3 + pow(s, 20.0) * 0.09) * (1.0 - uNotte*0.85);
          // stelle appena accennate
          if (uNotte > 0.1 && vD.y > 0.05) {
            vec2 g = floor(vD.xz * 420.0 / max(vD.y, 0.15));
            float st = step(0.9965, hash(g)) * (0.4 + 0.6 * sin(uTempo*1.7 + hash(g+3.1)*6.28));
            c += vec3(st) * uNotte * 0.55;
          }
          // nuvole: rumore proiettato sulla volta, con il vento
          if (vD.y > -0.02) {
            vec2 uv = vD.xz / (vD.y + 0.28) * 1.1 + vec2(uTempo*0.0015*uVento, uTempo*0.0009);
            float n = fbm(uv*1.7 + fbm(uv*0.8)*0.5);
            float cop = smoothstep(0.42 - uNuvole*0.28, 0.78, n) * uNuvole;
            vec3 nc = mix(vec3(0.72,0.75,0.77), vec3(0.93,0.92,0.9), smoothstep(0.35,0.85,n));
            if (uNotte > 0.3) nc *= 0.35;
            c = mix(c, nc, cop*0.85);
          }
          c += vec3(uLampo) * 0.35;
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  )
  cielo.frustumCulled = false
  scena.add(cielo)

  // stelle come punti (più semplici da far brillare)
  const stellePos = []
  for (let i = 0; i < 700; i++) {
    const az = rnd() * Math.PI * 2, al = 0.1 + rnd() * 1.4
    stellePos.push(Math.cos(az) * Math.cos(al) * 900, Math.sin(al) * 900, Math.sin(az) * Math.cos(al) * 900)
  }
  const stelle = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(stellePos, 3)), MAT.stelle)
  stelle.frustumCulled = false
  scena.add(stelle)

  // ── luci: sole alto, cielo che riempie le ombre, ombre morbide ──
  const emisfero = new THREE.HemisphereLight(0xc9dce8, 0x7c7358, 1.7)
  scena.add(emisfero)
  const sole = new THREE.DirectionalLight(0xfff2da, 2.8)
  sole.position.set(80, 130, 60)
  sole.castShadow = ombre
  if (ombre) {
    sole.shadow.mapSize.set(2048, 2048)
    sole.shadow.camera.left = -140; sole.shadow.camera.right = 140
    sole.shadow.camera.top = 140; sole.shadow.camera.bottom = -140
    sole.shadow.camera.near = 1; sole.shadow.camera.far = 520
    sole.shadow.bias = -0.00025; sole.shadow.normalBias = 0.045
    sole.shadow.radius = 2.2; sole.shadow.blurSamples = 10
    if ('intensity' in sole.shadow) sole.shadow.intensity = 1
  }
  scena.add(sole)
  // una luce di riempimento dalla parte opposta, senza ombre: schiarisce i lati in ombra senza spegnere il volume
  const riempimento = new THREE.DirectionalLight(0xaec9dc, 0.42)
  scena.add(riempimento)
  const luna = new THREE.DirectionalLight(0x9fb8e6, 0)
  scena.add(luna)
  const luceFontana = new THREE.PointLight(0x8ad8cf, 0, 28, 2)
  luceFontana.position.set(fc[0], 1.4, -fc[1])
  scena.add(luceFontana)
  const luceCasa = new THREE.PointLight(0xffb46a, 0, 26, 2)
  luceCasa.position.set(2.8, 3.4, 10.5)
  scena.add(luceCasa)
  const luceCortile = new THREE.PointLight(0xffc27d, 0, 26, 2)
  luceCortile.position.set(10, 3.4, 31)
  scena.add(luceCortile)

  // neve a terra: un velo appena percettibile
  const neveTerra = new THREE.Mesh(new THREE.CircleGeometry(500, 48), new THREE.MeshBasicMaterial({ color: 0xf3f6f8, transparent: true, opacity: 0, depthWrite: false }))
  neveTerra.rotation.x = -Math.PI / 2; neveTerra.position.y = 0.11; neveTerra.renderOrder = 2
  radice.add(neveTerra)

  // ── pioggia e neve ──
  function particelle(tipo) {
    const n = tipo === 'pioggia' ? 750 : 700
    const pos = [], coda = [], vel = []
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * 110, y = rnd() * 55, z = (rnd() - 0.5) * 110
      if (tipo === 'pioggia') { pos.push(x, y, z, x, y, z); coda.push(0, 1) } else { pos.push(x, y, z); coda.push(0) }
      vel.push(0.6 + rnd() * 0.8)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aCoda', new THREE.Float32BufferAttribute(coda, 1))
    g.setAttribute('aVel', new THREE.Float32BufferAttribute(vel, 1))
    const u = { uTempo: { value: 0 }, uCentro: { value: new THREE.Vector3() }, uVento: { value: 0.2 }, uTipo: { value: tipo === 'pioggia' ? 0 : 1 } }
    const mat = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false,
      vertexShader: `attribute float aCoda; attribute float aVel; uniform float uTempo; uniform vec3 uCentro; uniform float uVento; uniform float uTipo; varying float vA;
        void main(){
          vec3 p = position;
          float box = 110.0;
          p.x = mod(p.x + uTempo * (uTipo > 0.5 ? 1.2 : 5.0) * uVento + uCentro.x + box*0.5, box) - box*0.5 + uCentro.x;
          p.z = mod(p.z + uCentro.z + box*0.5, box) - box*0.5 + uCentro.z;
          p.y = mod(p.y - uTempo * (uTipo > 0.5 ? 2.2 : 17.0) * aVel, 55.0) + 0.2;
          if (uTipo < 0.5) { p.x += aCoda * 0.09 * uVento * 2.0; p.y -= aCoda * 0.55; p.z += aCoda * 0.04; }
          vA = 1.0 - aCoda * 0.55;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uTipo > 0.5 ? 2.6 : 1.4;
        }`,
      fragmentShader: `varying float vA; uniform float uTipo; void main(){ if (uTipo > 0.5) { vec2 d = gl_PointCoord - 0.5; if (dot(d,d) > 0.25) discard; } gl_FragColor = vec4(0.82,0.9,0.94, vA * (uTipo > 0.5 ? 0.8 : 0.3)); }`,
    })
    const p = tipo === 'pioggia' ? new THREE.LineSegments(g, mat) : new THREE.Points(g, mat)
    p.frustumCulled = false; p.visible = false
    scena.add(p)
    return { p, u }
  }
  const pioggia = particelle('pioggia')
  const neve = particelle('neve')

  // ── stato luci / meteo ──
  let ultimaLuce = null
  function aggiornaLuce(pal) {
    if (!pal) return
    emisfero.color.set(pal.emisfero.cielo); emisfero.groundColor.set(pal.emisfero.terra); emisfero.intensity = pal.emisfero.intensita
    sole.color.set(pal.coloreSole); sole.intensity = pal.intensitaSole
    sole.position.set(pal.dirLuce[0] * 210, pal.dirLuce[1] * 210, pal.dirLuce[2] * 210)
    sole.visible = pal.intensitaSole > 0.02
    riempimento.color.set(pal.emisfero.cielo)
    riempimento.intensity = pal.notte ? 0.16 : 0.38
    riempimento.position.set(-pal.dirLuce[0] * 170, Math.max(55, pal.dirLuce[1] * 100), -pal.dirLuce[2] * 170)
    luna.position.set(-pal.dirLuce[0] * 210, Math.abs(pal.dirLuce[1]) * 210 + 50, -pal.dirLuce[2] * 210)
    luna.intensity = pal.notte ? 1.15 : 0
    luceFontana.intensity = pal.notte ? 28 : 0
    luceCasa.intensity = pal.notte ? 34 : 0
    luceCortile.intensity = pal.notte ? 28 : 0
    scena.fog.color.set(pal.nebbia.colore)
    scena.fog.near = pal.nebbia.vicino; scena.fog.far = pal.nebbia.lontano
    scena.background.set(pal.nebbia.colore)
    cieloUniformi.uAlto.value.set(pal.cielo.alto); cieloUniformi.uOrizzonte.value.set(pal.cielo.orizzonte); cieloUniformi.uFoschia.value.set(pal.cielo.foschia)
    cieloUniformi.uSole.value.set(...pal.dirLuce); cieloUniformi.uSoleCol.value.set(pal.coloreSole)
    cieloUniformi.uNotte.value = pal.cielo.notte; cieloUniformi.uNuvole.value = pal.nuvolosita
    acquaUniformi.uSole.value.set(...pal.dirLuce)
    acquaUniformi.uCielo.value.set(pal.cielo.orizzonte)
    for (const m of acquee) if (m !== matAcqua) { m.uniforms.uSole.value.set(...pal.dirLuce); m.uniforms.uCielo.value.set(pal.cielo.orizzonte) }
    MAT.vetro.emissive.set(pal.finestre ? 0xff9c54 : 0x435255)
    MAT.vetro.emissiveIntensity = pal.finestre ? 1.4 : 0.1
    MAT.stelle.opacity = pal.cielo.notte * 0.8
    stelle.visible = pal.cielo.notte > 0.1
    neveTerra.material.opacity = pal.neve * 0.28
    if (ombre) { sole.shadow.needsUpdate = true }
    ultimaLuce = pal
  }

  function aggiornaMeteo(pal) {
    pioggia.p.visible = pal.icona === 'pioggia' || pal.icona === 'temporale'
    neve.p.visible = pal.icona === 'neve'
    pioggia.u.uVento.value = 0.15 + pal.vento / 55
    neve.u.uVento.value = 0.1 + pal.vento / 90
    cieloUniformi.uVento.value = 0.4 + pal.vento / 30
    // il velo di neve sta sotto il piazzale ma sopra i campi; lo alzo appena
    neveTerra.position.y = 0.11
  }

  // ── animazione ──
  let tempoAcqua = 0
  function anima(dt, t, camera, centro) {
    tempoAcqua += dt
    acquaUniformi.uTempo.value = tempoAcqua
    for (const m of acquee) m.uniforms.uTempo.value = tempoAcqua
    zampilli.children.forEach((m, i) => {
      if (!m.userData.getto) return
      m.scale.y = 0.94 + Math.sin(t * 3.2 + i) * 0.05
      m.scale.x = m.scale.z = 0.95 + Math.sin(t * 2.3 + i * 1.7) * 0.06
    })
    zampilloMat.opacity = 0.1 + Math.sin(t * 2.7) * 0.02
    cieloUniformi.uTempo.value = t
    stelle.rotation.y = t * 0.003
    pioggia.u.uTempo.value = t
    neve.u.uTempo.value = t
    if (centro) { pioggia.u.uCentro.value.set(centro.x, 0, centro.z); neve.u.uCentro.value.set(centro.x, 0, centro.z) }
    // lampo del temporale, deterministico
    if (ultimaLuce?.icona === 'temporale') {
      const f = Math.sin(t * 0.73) + Math.sin(t * 1.91 + 1.3) + Math.sin(t * 3.17 + 0.4)
      const lampo = f > 2.55 ? (f - 2.55) * 0.45 : 0
      cieloUniformi.uLampo.value = Math.min(0.55, lampo)
      emisfero.intensity = ultimaLuce.emisfero.intensita + Math.min(0.8, lampo * 2)
    } else {
      cieloUniformi.uLampo.value = 0
      if (ultimaLuce) emisfero.intensity = ultimaLuce.emisfero.intensita
    }
  }

  return { scena, radice, cielo, sole, emisfero, stelle, luceFontana, materiali: MAT, aggiornaLuce, aggiornaMeteo, anima, acquaUniformi, meta: { casa: casaMeta, capannone: capMeta, fonte: DATI.fonte } }
}
