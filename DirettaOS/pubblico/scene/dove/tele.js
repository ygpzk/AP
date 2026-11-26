// «Dove vivo» · le texture, dipinte qui in canvas (nessuna immagine da scaricare): cemento a vista con le riprese dei
// pannelli, mattoni, coppi, persiane verde scuro, ghiaia, erba, foglie, cortecce, pannelli solari, acqua.
// Ogni tela si dipinge una volta sola per pagina e resta in memoria: se la scena si spegne e si riaccende, si riusa.
const CACHE = new Map()
export function tela(nome, fai) {
  if (!CACHE.has(nome)) CACHE.set(nome, fai())
  return CACHE.get(nome)
}

export function rng(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function nuovaTela(w, h = w) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}
const liscio = (t) => t * t * (3 - 2 * t)

// rumore che si ripete su se stesso (le texture si affiancano senza cuciture)
export function rumore(lato, celle, r) {
  const g = new Float32Array(celle * celle)
  for (let i = 0; i < g.length; i++) g[i] = r()
  const out = new Float32Array(lato * lato)
  for (let y = 0; y < lato; y++) {
    const fy = (y / lato) * celle, iy = Math.floor(fy), ty = liscio(fy - iy)
    const y0 = (iy % celle) * celle, y1 = ((iy + 1) % celle) * celle
    for (let x = 0; x < lato; x++) {
      const fx = (x / lato) * celle, ix = Math.floor(fx), tx = liscio(fx - ix)
      const x0 = ix % celle, x1 = (ix + 1) % celle
      const a = g[y0 + x0] + (g[y0 + x1] - g[y0 + x0]) * tx
      const b = g[y1 + x0] + (g[y1 + x1] - g[y1 + x0]) * tx
      out[y * lato + x] = a + (b - a) * ty
    }
  }
  return out
}
export function fbm(lato, celle, ottave, seme, pers = 0.5) {
  const r = rng(seme)
  const out = new Float32Array(lato * lato)
  let amp = 1, tot = 0, c = celle
  for (let o = 0; o < ottave && c <= lato; o++) {
    const n = rumore(lato, c, r)
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp
    tot += amp; amp *= pers; c *= 2
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot
  return out
}

// da un'altezza a una normal map (spazio tangente, verde in su)
export function normali(alt, lato, forza = 2, nome = '') {
  const c = nuovaTela(lato)
  const g = c.getContext('2d')
  const img = g.createImageData(lato, lato)
  const d = img.data
  for (let y = 0; y < lato; y++) {
    for (let x = 0; x < lato; x++) {
      const xl = (x - 1 + lato) % lato, xr = (x + 1) % lato, yu = (y - 1 + lato) % lato, yd = (y + 1) % lato
      const dx = (alt[y * lato + xr] - alt[y * lato + xl]) * forza
      const dy = (alt[yd * lato + x] - alt[yu * lato + x]) * forza
      const l = Math.hypot(dx, dy, 1)
      const i = (y * lato + x) * 4
      d[i] = (-dx / l * 0.5 + 0.5) * 255
      d[i + 1] = (dy / l * 0.5 + 0.5) * 255
      d[i + 2] = (1 / l * 0.5 + 0.5) * 255
      d[i + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  c.dataset.nome = nome
  return c
}

const clamp = (x, a = 0, b = 255) => Math.max(a, Math.min(b, x))
function scrivi(lato, f) {
  const c = nuovaTela(lato)
  const g = c.getContext('2d')
  const img = g.createImageData(lato, lato)
  const d = img.data
  for (let y = 0, i = 0; y < lato; y++) for (let x = 0; x < lato; x++, i += 4) {
    const [r, gg, b, a = 255] = f(x, y, y * lato + x)
    d[i] = clamp(r); d[i + 1] = clamp(gg); d[i + 2] = clamp(b); d[i + 3] = clamp(a)
  }
  g.putImageData(img, 0, 0)
  return c
}

// ── cemento a vista: grigio chiaro, macchie del getto, le riprese dei pannelli, le colature sotto i davanzali ──
// una tela = 4 × 4 m di muro
export function cemento() {
  return tela('cemento', () => {
    const L = 1024
    const macchie = fbm(L, 4, 6, 11, 0.55), fine = fbm(L, 64, 3, 12, 0.6), colate = fbm(L, 48, 2, 13)
    const alt = new Float32Array(L * L)
    const col = scrivi(L, (x, y, i) => {
      const m = macchie[i], f = fine[i]
      // le colature: righe verticali più scure che partono dall'alto
      const cx = colate[(Math.floor(y / 6) * L + x) % (L * L)]
      const colata = Math.max(0, cx - 0.58) * 2.4 * (1 - y / L * 0.55)
      // le riprese: un giunto orizzontale ogni 2 m, uno verticale ogni 2 m, appena incisi
      const gy = Math.min(Math.abs(y % 512), Math.abs(512 - (y % 512))), gx = Math.min(Math.abs(x % 512), Math.abs(512 - (x % 512)))
      const giunto = (gy < 2 ? 0.8 : gy < 4 ? 0.35 : 0) + (gx < 2 ? 0.5 : 0)
      let v = 158 + (m - 0.5) * 58 + (f - 0.5) * 18 - colata * 34 - giunto * 24
      alt[i] = f * 0.6 - giunto * 0.9 + m * 0.2
      const t = (m - 0.5) * 6
      return [v - 2 + t, v + 1, v + 4 - t * 0.5]
    })
    return { col, nor: normali(alt, L, 3.5, 'cemento-n') }
  })
}

// ── mattoni a vista (pilastri, comignoli, davanzali): una tela = 1 × 1 m, 15 corsi ──
export function mattone() {
  return tela('mattone', () => {
    const L = 512, corsi = 15, h = L / corsi, larg = L / 4
    const r = rng(21)
    const grana = fbm(L, 32, 4, 22, 0.6)
    const tinte = []
    for (let i = 0; i < corsi * 5; i++) {
      const k = r()
      tinte.push(k < 0.18 ? [150, 70, 44] : k < 0.4 ? [196, 112, 72] : k < 0.75 ? [181, 94, 60] : k < 0.9 ? [205, 128, 84] : [166, 86, 58])
    }
    const alt = new Float32Array(L * L)
    const col = scrivi(L, (x, y, i) => {
      const riga = Math.floor(y / h), sfaso = riga % 2 ? larg / 2 : 0
      const xx = (x + sfaso) % L, colonna = Math.floor(xx / larg)
      const dy = y - riga * h, dx = xx - colonna * larg
      const malta = dy < 3 || dx < 3
      const gr = grana[i]
      if (malta) { alt[i] = 0; const v = 168 + gr * 30; return [v, v - 6, v - 16] }
      const t = tinte[(riga * 4 + colonna) % tinte.length]
      const bordo = Math.min(dy - 3, h - dy, dx - 3, larg - dx)
      alt[i] = Math.min(1, bordo / 3) * 0.9 + gr * 0.25
      const s = 0.86 + gr * 0.3
      return [t[0] * s, t[1] * s, t[2] * s]
    })
    return { col, nor: normali(alt, L, 2.2, 'mattone-n') }
  })
}

// ── coppi: le file di tegole curve, una tela = 3 × 3 m; u lungo la gronda, v giù per la falda ──
export function coppi() {
  return tela('coppi', () => {
    const L = 1024, colonne = 16, file = 8
    const cw = L / colonne, fh = L / file
    const r = rng(31)
    const tinte = []
    for (let i = 0; i < colonne * file; i++) {
      const k = r()
      const base = k < 0.12 ? [122, 62, 44] : k < 0.3 ? [168, 82, 52] : k < 0.62 ? [184, 94, 58] : k < 0.86 ? [198, 112, 70] : [150, 92, 66]
      const lich = r() < 0.12 ? 0.25 + r() * 0.3 : 0
      tinte.push({ base, lich, var: 0.9 + r() * 0.2 })
    }
    const grana = fbm(L, 64, 3, 32, 0.6), sporco = fbm(L, 6, 4, 33, 0.55)
    const alt = new Float32Array(L * L)
    const col = scrivi(L, (x, y, i) => {
      const c = Math.floor(x / cw), sopra = c % 2 === 0 // coppo (convesso) e canale (concavo) a righe alterne
      const fx = (x - c * cw) / cw
      const sfaso = sopra ? 0 : fh * 0.5
      const yy = (y + sfaso) % L, f = Math.floor(yy / fh), fy = (yy - f * fh) / fh
      const curva = Math.sin(fx * Math.PI)
      // l'altezza: i coppi sopra stanno più in alto dei canali; ogni tegola ha il labbro in fondo
      let a = sopra ? 0.55 + curva * 0.45 : 0.1 + (1 - curva) * 0.18
      const labbro = fy > 0.86 ? (fy - 0.86) / 0.14 : 0
      a += sopra ? -labbro * 0.25 : -labbro * 0.08
      alt[i] = a
      const t = tinte[(f * colonne + c) % tinte.length]
      // luce finta: più chiaro dove la tegola è alta, ombra sotto il labbro della fila sopra
      const ombraFila = fy < 0.12 ? 0.72 + fy * 2.3 : 1
      let s = (sopra ? 0.82 + curva * 0.3 : 0.62 + (1 - curva) * 0.18) * ombraFila * t.var
      s *= 0.88 + grana[i] * 0.24
      let [R, G, B] = t.base.map((v) => v * s)
      const sp = Math.max(0, sporco[i] - 0.52) * 1.4
      R = R * (1 - sp * 0.35) + 60 * sp * 0.35; G = G * (1 - sp * 0.3) + 58 * sp * 0.3; B = B * (1 - sp * 0.25) + 50 * sp * 0.25
      if (t.lich) { const k = t.lich * (0.6 + grana[i] * 0.8) * (sopra ? curva : 0.4); R = R * (1 - k) + 150 * k; G = G * (1 - k) + 146 * k; B = B * (1 - k) + 120 * k }
      return [R, G, B]
    })
    return { col, nor: normali(alt, L, 9, 'coppi-n') }
  })
}

// ── persiane e porte verde scuro (come nelle foto): stecche orizzontali, telaio ──
export function persiana() {
  return tela('persiana', () => {
    const L = 256
    const grana = fbm(L, 16, 3, 41)
    const alt = new Float32Array(L * L)
    const col = scrivi(L, (x, y, i) => {
      const bordo = x < 14 || x > L - 15 || y < 14 || y > L - 15
      const stecca = ((y - 14) % 15) / 15
      const v = bordo ? 0.95 : 0.55 + stecca * 0.55
      alt[i] = bordo ? 1 : stecca
      const g = 0.9 + grana[i] * 0.2
      return [40 * v * g, 72 * v * g, 60 * v * g]
    })
    return { col, nor: normali(alt, L, 3, 'persiana-n') }
  })
}
export function porta() {
  return tela('porta', () => {
    const L = 256
    const grana = fbm(L, 8, 4, 42)
    return {
      col: scrivi(L, (x, y, i) => {
        const asse = (x % 32) < 2 ? 0.6 : 1
        const g = (0.86 + grana[i] * 0.28) * asse
        return [36 * g, 66 * g, 55 * g]
      }),
    }
  })
}
export function legno() {
  return tela('legno', () => {
    const L = 256
    const v = fbm(L, 4, 5, 51, 0.6)
    return { col: scrivi(L, (x, y, i) => { const f = 0.75 + Math.sin(x * 0.9 + v[i] * 18) * 0.12 + v[i] * 0.25; return [112 * f, 80 * f, 56 * f] }) }
  })
}

// ── dettagli fini da stendere sul terreno: ghiaia (2 m) e prato (2 m) ──
export function ghiaia() {
  return tela('ghiaia', () => {
    const L = 512
    const c = nuovaTela(L), g = c.getContext('2d')
    const r = rng(61)
    g.fillStyle = 'rgb(150,144,132)'; g.fillRect(0, 0, L, L)
    const alt = new Float32Array(L * L)
    for (let k = 0; k < 5200; k++) {
      const x = r() * L, y = r() * L, raggio = 2 + r() * 5.5, v = 130 + r() * 105, t = r() * 14 - 7
      g.fillStyle = `rgb(${v + t},${v - 2},${v - 10 - t})`
      g.beginPath(); g.ellipse(x, y, raggio, raggio * (0.6 + r() * 0.4), r() * 3.14, 0, 6.29); g.fill()
      // (copia ai bordi: la tela si affianca)
      for (const [ox, oy] of [[L, 0], [-L, 0], [0, L], [0, -L]]) if (x + ox > -8 && x + ox < L + 8 && y + oy > -8 && y + oy < L + 8) { g.beginPath(); g.ellipse(x + ox, y + oy, raggio, raggio * 0.8, 0, 0, 6.29); g.fill() }
    }
    const d = g.getImageData(0, 0, L, L).data
    for (let i = 0; i < L * L; i++) alt[i] = d[i * 4] / 255
    return { col: c, nor: normali(alt, L, 4, 'ghiaia-n') }
  })
}

// una grana neutra per il terreno (moltiplica il colore della mappa grande): fili d'erba, sassolini, zolle
export function grana() {
  return tela('grana', () => {
    const L = 512
    const a = fbm(L, 32, 4, 71, 0.6), b = fbm(L, 128, 2, 72, 0.7)
    const c = nuovaTela(L), g = c.getContext('2d')
    const img = g.createImageData(L, L), d = img.data
    const r = rng(73)
    const fili = new Float32Array(L * L)
    for (let k = 0; k < 26000; k++) {
      const x = Math.floor(r() * L), y = Math.floor(r() * L), lung = 2 + Math.floor(r() * 5), v = (r() - 0.45) * 0.5
      for (let j = 0; j < lung; j++) fili[((y + j) % L) * L + ((x + (j >> 1)) % L)] += v
    }
    const alt = new Float32Array(L * L)
    for (let i = 0; i < L * L; i++) {
      const v = 0.5 + (a[i] - 0.5) * 0.45 + (b[i] - 0.5) * 0.35 + fili[i] * 0.55
      alt[i] = v
      const q = clamp(v * 255)
      d[i * 4] = q; d[i * 4 + 1] = q; d[i * 4 + 2] = q; d[i * 4 + 3] = 255
    }
    g.putImageData(img, 0, 0)
    return { col: c, nor: normali(alt, L, 2.5, 'grana-n') }
  })
}

// ── foglie: una «nuvola» di foglie su trasparente, in grigio chiaro (il colore lo dà ogni ciuffo) ──
// tipo: platano (palmate grandi), gelso (a cuore), tondo (foglie medie), pioppo (piccole), siepe (lauro lucido), vite
export function foglie(tipo) {
  return tela('foglie-' + tipo, () => {
    const L = 512
    const c = nuovaTela(L), g = c.getContext('2d')
    const r = rng(tipo.length * 977 + 5)
    const P = {
      platano: { n: 150, s: 34, forma: 'palma' }, gelso: { n: 230, s: 24, forma: 'cuore' }, tondo: { n: 260, s: 21, forma: 'ovale' },
      pioppo: { n: 380, s: 14, forma: 'rombo' }, siepe: { n: 420, s: 15, forma: 'ovale' }, vite: { n: 120, s: 36, forma: 'palma' },
    }[tipo]
    const foglia = (x, y, s, ang, v) => {
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(s / 20, s / 20)
      g.fillStyle = `rgb(${v},${v},${v})`
      g.beginPath()
      if (P.forma === 'palma') {
        for (let k = 0; k <= 10; k++) {
          const a = -Math.PI / 2 + (k / 10 - 0.5) * 2.6, rr = k % 2 ? 9 : 20
          const px = Math.cos(a) * rr, py = Math.sin(a) * rr + 6
          k ? g.lineTo(px, py) : g.moveTo(px, py)
        }
        g.lineTo(0, 10)
      } else if (P.forma === 'cuore') {
        g.moveTo(0, -18); g.bezierCurveTo(16, -14, 16, 6, 0, 16); g.bezierCurveTo(-16, 6, -16, -14, 0, -18)
      } else if (P.forma === 'rombo') {
        g.moveTo(0, -18); g.lineTo(12, 0); g.lineTo(0, 16); g.lineTo(-12, 0)
      } else {
        g.ellipse(0, 0, 9, 18, 0, 0, 6.29)
      }
      g.closePath(); g.fill()
      // la nervatura
      g.strokeStyle = `rgba(0,0,0,.18)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -14); g.lineTo(0, 14); g.stroke()
      g.restore()
    }
    // rametti sotto le foglie
    g.strokeStyle = 'rgb(70,64,56)'; g.lineCap = 'round'
    for (let k = 0; k < 7; k++) {
      const a = r() * 6.28
      g.lineWidth = 2 + r() * 2.5
      g.beginPath(); g.moveTo(L / 2, L / 2); g.lineTo(L / 2 + Math.cos(a) * L * 0.38, L / 2 + Math.sin(a) * L * 0.38); g.stroke()
    }
    for (let k = 0; k < P.n; k++) {
      // dentro un cerchio, più fitte al centro
      const a = r() * 6.28, rr = Math.sqrt(r()) * L * 0.44
      const x = L / 2 + Math.cos(a) * rr, y = L / 2 + Math.sin(a) * rr
      const dentro = 1 - rr / (L * 0.44)
      const v = Math.round(150 + r() * 90 + dentro * 20)
      foglia(x, y, P.s * (0.75 + r() * 0.5), r() * 6.28, Math.min(255, v))
    }
    return { col: c }
  })
}

// ── cortecce: platano (chiazze crema, oliva, grigie), scura (gelsi, pioppi, il resto) ──
export function corteccia(tipo) {
  return tela('corteccia-' + tipo, () => {
    const L = 256
    if (tipo === 'platano') {
      const a = fbm(L, 4, 4, 81, 0.6), b = fbm(L, 8, 3, 82, 0.6)
      return {
        col: scrivi(L, (x, y, i) => {
          const k = a[i] + (b[i] - 0.5) * 0.4
          if (k > 0.58) return [176, 170, 146]
          if (k > 0.47) return [142, 138, 108]
          if (k > 0.38) return [108, 104, 82]
          return [128, 118, 98]
        }),
      }
    }
    const a = fbm(L, 6, 4, 83, 0.6)
    const alt = new Float32Array(L * L)
    const col = scrivi(L, (x, y, i) => {
      const solco = Math.abs(Math.sin(x * 0.19 + a[i] * 9))
      alt[i] = solco
      const v = 52 + solco * 40 + a[i] * 20
      return [v * 1.08, v, v * 0.9]
    })
    return { col, nor: normali(alt, L, 3, 'corteccia-n') }
  })
}

// ── un pannello fotovoltaico: 6 × 10 celle blu scuro, linee d'argento, cornice di alluminio ──
export function pannello() {
  return tela('pannello', () => {
    const L = 512, H = 840
    const c = nuovaTela(L, H), g = c.getContext('2d')
    g.fillStyle = '#b9bec4'; g.fillRect(0, 0, L, H)
    g.fillStyle = '#121a2c'; g.fillRect(10, 10, L - 20, H - 20)
    const cw = (L - 20) / 6, ch = (H - 20) / 10
    for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) {
      const x = 10 + i * cw, y = 10 + j * ch
      const gr = g.createLinearGradient(x, y, x + cw, y + ch)
      gr.addColorStop(0, '#1b2a4a'); gr.addColorStop(1, '#14203a')
      g.fillStyle = gr; g.fillRect(x + 2, y + 2, cw - 4, ch - 4)
      g.fillStyle = 'rgba(190,200,215,.35)'
      for (let k = 1; k < 4; k++) g.fillRect(x + (cw * k) / 4, y + 2, 1, ch - 4)
    }
    return { col: c }
  })
}

// ── piastrelle della piscina (azzurre, fughe chiare) e cotto del bordo ──
export function piastrelle() {
  return tela('piastrelle', () => {
    const L = 256, r = rng(91)
    return { col: scrivi(L, (x, y) => { const f = x % 16 < 1 || y % 16 < 1; const v = r() * 10; return f ? [220, 236, 236] : [96 + v, 196 + v, 208 + v] }) }
  })
}
export function cotto() {
  return tela('cotto', () => {
    const L = 256, a = fbm(L, 16, 3, 92)
    return { col: scrivi(L, (x, y, i) => { const f = x % 64 < 2 || y % 128 < 2; const s = 0.85 + a[i] * 0.3; return f ? [190, 170, 150] : [184 * s, 92 * s, 62 * s] }) }
  })
}

// ── la rete metallica: rombi su trasparente ──
export function rete() {
  return tela('rete', () => {
    const L = 128
    const c = nuovaTela(L), g = c.getContext('2d')
    g.strokeStyle = 'rgba(190,196,200,1)'; g.lineWidth = 2.2
    for (let k = -L; k < L * 2; k += 16) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k + L, L); g.stroke()
      g.beginPath(); g.moveTo(k, L); g.lineTo(k + L, 0); g.stroke()
    }
    return { col: c }
  })
}

// ── l'acqua: normali di onde piccole che si affiancano ──
export function acqua() {
  return tela('acqua', () => {
    const L = 512
    const a = fbm(L, 8, 5, 101, 0.55)
    const alt = new Float32Array(L * L)
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const i = y * L + x
      alt[i] = a[i] * 0.7 + Math.sin((x / L) * Math.PI * 2 * 6 + a[i] * 6) * 0.06 + Math.sin((y / L) * Math.PI * 2 * 9 + a[i] * 4) * 0.05
    }
    return { nor: normali(alt, L, 6, 'acqua-n') }
  })
}

// ── le particelle: una goccia allungata, un fiocco, un alone morbido ──
export function goccia() {
  return tela('goccia', () => {
    const c = nuovaTela(16, 64), g = c.getContext('2d')
    const gr = g.createLinearGradient(0, 0, 0, 64)
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(225,235,245,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr; g.fillRect(6, 0, 4, 64)
    return { col: c }
  })
}
export function alone() {
  return tela('alone', () => {
    const c = nuovaTela(64), g = c.getContext('2d')
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
    return { col: c }
  })
}
