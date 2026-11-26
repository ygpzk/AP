// Gli sfondi vivi del palco TikTok: dodici scene, una ogni due ore. Non sono i
// pixel della scheda Instagram: qui le scene sono linee morbide disegnate con un
// solo inchiostro, e il motore le stampa due volte, ciano un filo a sinistra e
// rosso un filo a destra, come il marchio di TikTok. Dove le due copie si
// sovrappongono il colore torna bianco (di notte) o inchiostro (di giorno).
//
// Tutte le scene vanno a tempo sullo stesso battito (112 bpm): TikTok è suono.
// Ogni tanto, per un attimo, l'immagine «salta» (le due copie si allargano e
// qualche fetta scivola di lato): il glitch, raro apposta.
//
// L'ordine si rimescola ogni giorno con un seme fatto dalla data (stesso giorno,
// stesso ordine per tutti). Il disco nella colonna di destra passa alla scena
// dopo, che resta fino al prossimo cambio di fascia.
//
// Leggeri: una tela a metà risoluzione, 24 fotogrammi al secondo, ferma quando
// la scheda non si vede o la pagina è in secondo piano; con «movimento ridotto»
// resta un fotogramma fisso, senza glitch.

const SCALA = 2
const FPS = 24
const ORE = 2
const BPM = 112
const R = Math.random
const tra = (a, b) => a + R() * (b - a)
const TAU = Math.PI * 2

// le due tinte: luce sul nero di notte, inchiostro un po' più scuro sulla carta di giorno
const TINTE = {
  notte: { ciano: '#25f4ee', rosso: '#fe2c55', fondi: 'lighter' },
  giorno: { ciano: '#00a3ab', rosso: '#e5214c', fondi: 'multiply' },
}

// il battito: 1 sul colpo, poi scende
const battito = (t) => Math.exp(-((t * BPM) / 60 % 1) * 5.5)
const colpo = (t) => Math.floor((t * BPM) / 60)

// la tela vista dalle scene: un solo inchiostro, l'alfa decide quanto pesa
export function tela(canvas) {
  const ctx = canvas.getContext('2d')
  return {
    ctx,
    chiaro: false,
    get w() { return canvas.width },
    get h() { return canvas.height },
    ink: (a = 1) => `rgba(255,255,255,${a})`,
    pulisci() { ctx.clearRect(0, 0, canvas.width, canvas.height) },
    sbiadisci(a) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = `rgba(0,0,0,${a})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
    },
    linea(punti, a, spessore = 1) {
      if (punti.length < 2) return
      ctx.beginPath()
      ctx.moveTo(punti[0][0], punti[0][1])
      for (let i = 1; i < punti.length; i++) ctx.lineTo(punti[i][0], punti[i][1])
      ctx.strokeStyle = `rgba(255,255,255,${a})`
      ctx.lineWidth = spessore
      ctx.stroke()
    },
    rett(x, y, w, h, r, { a = 0, riempi = 0, spessore = 1 } = {}) {
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, r)
      if (riempi) { ctx.fillStyle = `rgba(255,255,255,${riempi})`; ctx.fill() }
      if (a) { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = spessore; ctx.stroke() }
    },
    cerchio(x, y, r, { a = 0, riempi = 0, spessore = 1 } = {}) {
      if (r <= 0) return
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      if (riempi) { ctx.fillStyle = `rgba(255,255,255,${riempi})`; ctx.fill() }
      if (a) { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = spessore; ctx.stroke() }
    },
    testo(s, x, y, px, a, allinea = 'left') {
      ctx.font = `700 ${px}px "gg mono", Consolas, monospace`
      ctx.textAlign = allinea
      ctx.textBaseline = 'middle'
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.fillText(s, x, y)
    },
  }
}

function cuore(ctx, x, y, s, rot = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.moveTo(0, 0.35)
  ctx.bezierCurveTo(-0.95, -0.25, -0.5, -1.05, 0, -0.5)
  ctx.bezierCurveTo(0.5, -1.05, 0.95, -0.25, 0, 0.35)
  ctx.restore()
}

function nota(ctx, x, y, s, rot, doppia) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.ellipse(0, 0, 0.42, 0.3, -0.45, 0, TAU)
  if (doppia) ctx.ellipse(1.15, -0.25, 0.42, 0.3, -0.45, 0, TAU)
  ctx.fill()
  ctx.lineWidth = 0.12
  ctx.beginPath()
  ctx.moveTo(0.38, -0.1)
  ctx.lineTo(0.38, -1.7)
  if (doppia) {
    ctx.moveTo(1.53, -0.35)
    ctx.lineTo(1.53, -1.95)
    ctx.moveTo(0.38, -1.7)
    ctx.lineTo(1.53, -1.95)
    ctx.moveTo(0.38, -1.4)
    ctx.lineTo(1.53, -1.65)
  } else {
    ctx.moveTo(0.38, -1.7)
    ctx.quadraticCurveTo(0.95, -1.25, 0.85, -0.7)
  }
  ctx.stroke()
  ctx.restore()
}

// ogni scena: avvia(g) prepara e restituisce il fotogramma (t, dt) in secondi.
// Le scene stanno sulla destra e in basso: a sinistra c'è il testo della scheda.
export const TEMI = [
  { id: 'eq', it: 'Equalizzatore', en: 'Equalizer', avvia(g) {
    const n = Math.max(12, Math.round(g.w / 7))
    const barre = Array.from({ length: n }, (_, i) => ({ f: R() * TAU, k: tra(1.2, 3.4), v: 0, cima: 0, x: i }))
    return (t, dt) => {
      g.pulisci()
      const b = battito(t)
      const passo = g.w / n
      for (const o of barre) {
        const verso = 0.35 + 0.65 * (o.x / n)
        const obiettivo = g.h * (0.06 + 0.5 * verso * (0.5 + 0.5 * Math.sin(t * o.k + o.f)) ** 2 * (0.62 + 0.38 * b))
        o.v += (obiettivo - o.v) * Math.min(1, dt * 14)
        o.cima = Math.max(o.v, o.cima - dt * g.h * 0.22)
        const x = o.x * passo + 1
        const lw = Math.max(2, passo - 2.5)
        g.rett(x, g.h - o.v, lw, o.v + 2, 1.5, { riempi: 0.1 + 0.2 * verso })
        g.rett(x, g.h - o.cima - 4, lw, 1.6, 0.8, { riempi: 0.45 * verso })
      }
    }
  } },

  { id: 'onda', it: 'Onda sonora', en: 'Waveform', avvia(g) {
    const corde = [0, 1, 2].map((i) => ({ y: 0.5 + i * 0.16, k: 0.035 + i * 0.012, v: 1.6 - i * 0.35, a: 0.55 - i * 0.14 }))
    return (t) => {
      g.pulisci()
      const b = battito(t)
      for (const c of corde) {
        const p = []
        for (let x = 0; x <= g.w; x += 2) {
          const inv = Math.sin((x / g.w) * Math.PI) ** 0.6
          const amp = g.h * 0.13 * inv * (0.45 + 0.75 * b) * (0.3 + 0.7 * (x / g.w))
          const y = g.h * c.y + amp * (Math.sin(x * c.k + t * c.v * 3) * 0.6 + Math.sin(x * c.k * 2.7 - t * c.v * 4.1) * 0.4)
          p.push([x, y])
        }
        g.linea(p, c.a, 1.4)
      }
      const x = ((t * 0.08) % 1) * g.w
      g.linea([[x, g.h * 0.3], [x, g.h * 0.95]], 0.32, 1)
    }
  } },

  // il feed «Per te»: le schermate salgono una alla volta, a scatto
  { id: 'feed', it: 'Per te', en: 'For You', avvia(g) {
    const H = g.h * 0.62, W = H * 9 / 16, gap = H * 0.12
    const colonne = Array.from({ length: Math.ceil((g.w * 0.62) / (W + gap)) + 1 }, (_, i) => ({ x: g.w - (i + 1) * (W + gap) + gap * 0.5, sfasa: i * 0.37, righe: Array.from({ length: 6 }, () => tra(0.3, 0.85)) }))
    const giro = 2.6
    return (t) => {
      g.pulisci()
      for (const c of colonne) {
        const tt = t / giro + c.sfasa
        const k = Math.floor(tt), f = tt - k
        const e = f < 0.28 ? 1 - (1 - f / 0.28) ** 3 : 1
        const off = ((k + e) * (H + gap)) % (H + gap)
        for (let j = -1; j < Math.ceil(g.h / (H + gap)) + 1; j++) {
          const y = j * (H + gap) - off + gap
          const vicino = 1 - Math.min(1, Math.abs(y + H / 2 - g.h / 2) / g.h)
          g.rett(c.x, y, W, H, W * 0.09, { a: 0.26 + 0.28 * vicino, riempi: 0.035, spessore: 1.2 })
          const r = c.righe[(j + k + 60) % 6]
          g.rett(c.x + W * 0.1, y + H * 0.8, W * 0.62 * r, 2, 1, { riempi: 0.32 * vicino })
          g.rett(c.x + W * 0.1, y + H * 0.87, W * 0.4 * r, 2, 1, { riempi: 0.22 * vicino })
          g.cerchio(c.x + W * 0.86, y + H * 0.5, W * 0.06, { riempi: 0.3 * vicino })
          g.cerchio(c.x + W * 0.86, y + H * 0.64, W * 0.06, { riempi: 0.3 * vicino })
        }
      }
    }
  } },

  // i cuori di una diretta: salgono dall'angolo in basso a destra
  { id: 'cuori', it: 'Cuori', en: 'Hearts', avvia(g) {
    const cuori = []
    let ultimo = -1
    const nasci = (n) => { for (let i = 0; i < n; i++) cuori.push({ x: g.w * tra(0.8, 0.92), y: g.h + 6, v: tra(14, 26), f: R() * TAU, s: tra(5.5, 10), vita: 0, fine: tra(3.5, 6) }) }
    for (let i = 0; i < 14; i++) { nasci(1); const c = cuori.at(-1); c.vita = R() * c.fine; c.y -= c.vita * c.v }
    return (t, dt) => {
      g.pulisci()
      const k = colpo(t)
      if (k !== ultimo) { ultimo = k; nasci(1 + (R() < 0.35 ? 2 : 0)) }
      for (let i = cuori.length - 1; i >= 0; i--) {
        const c = cuori[i]
        c.vita += dt
        c.y -= c.v * dt
        if (c.vita > c.fine || c.y < -10) { cuori.splice(i, 1); continue }
        const p = c.vita / c.fine
        const x = c.x - p * g.w * 0.22 + Math.sin(c.vita * 2.2 + c.f) * 7
        const s = c.s * (0.5 + Math.min(1, c.vita * 3) * 0.7)
        cuore(g.ctx, x, c.y, s, Math.sin(c.vita * 1.7 + c.f) * 0.25)
        g.ctx.fillStyle = g.ink(0.62 * (1 - p) ** 0.7)
        g.ctx.fill()
      }
    }
  } },

  { id: 'note', it: 'Note', en: 'Notes', avvia(g) {
    const note = Array.from({ length: Math.round(g.w / 22) }, () => ({ x: R() * g.w, y: R() * g.h, v: tra(6, 14), f: R() * TAU, s: tra(4, 7.5), d: R() < 0.35 }))
    return (t, dt) => {
      g.pulisci()
      const b = battito(t)
      for (const o of note) {
        o.x += o.v * dt
        if (o.x > g.w + 12) { o.x = -12; o.y = R() * g.h }
        const y = o.y + Math.sin(t * 0.9 + o.f) * 6
        const verso = 0.3 + 0.7 * (o.x / g.w)
        g.ctx.fillStyle = g.ink(0.42 * verso)
        g.ctx.strokeStyle = g.ink(0.42 * verso)
        nota(g.ctx, o.x, y, o.s * (1 + b * 0.12), Math.sin(t + o.f) * 0.2, o.d)
      }
    }
  } },

  // il disco del suono, quello che gira in basso a destra in ogni video
  { id: 'vinile', it: 'Vinile', en: 'Vinyl', avvia(g) {
    const cx = g.w * 0.8, cy = g.h * 0.56, r = Math.min(g.h * 0.62, g.w * 0.32)
    return (t) => {
      g.pulisci()
      const a = t * TAU * 0.55
      g.cerchio(cx, cy, r, { riempi: 0.06, a: 0.42, spessore: 1.4 })
      for (let k = 0.42; k < 0.97; k += 0.045) g.cerchio(cx, cy, r * k, { a: 0.07 + (k > 0.9 ? 0.05 : 0) })
      g.cerchio(cx, cy, r * 0.34, { riempi: 0.16 + battito(t) * 0.12 })
      g.cerchio(cx, cy, r * 0.035, { riempi: 0.6 })
      for (const s of [0, Math.PI]) {
        g.ctx.beginPath()
        g.ctx.arc(cx, cy, r * 0.72, a + s, a + s + 0.55)
        g.ctx.strokeStyle = g.ink(0.3)
        g.ctx.lineWidth = r * 0.28
        g.ctx.globalAlpha = 0.35
        g.ctx.stroke()
        g.ctx.globalAlpha = 1
      }
      const bx = cx + r * 1.02, by = cy - r * 1.02
      g.linea([[bx, by], [bx - r * 0.12, cy - r * 0.2], [cx + r * 0.42, cy + r * 0.26]], 0.5, 2)
      g.cerchio(bx, by, 4, { riempi: 0.5 })
    }
  } },

  // la cassetta: righe, banda di tracking che scende, contatore che corre
  { id: 'vhs', it: 'Cassetta', en: 'Tape', avvia(g) {
    return (t) => {
      g.pulisci()
      for (let y = 0; y < g.h; y += 3) g.rett(0, y, g.w, 1, 0, { riempi: 0.035 })
      const by = ((t * 0.09) % 1.2) * g.h - g.h * 0.1
      for (let i = 0; i < 14; i++) {
        const y = by + tra(0, 12)
        const x = R() * g.w
        g.rett(x, y, tra(8, 60), 1, 0, { riempi: tra(0.08, 0.3) })
      }
      g.rett(0, by, g.w, 9, 0, { riempi: 0.05 })
      // la scritta del videoregistratore, grande e leggera come una trama, lontana dal testo vero
      const px = Math.max(12, Math.round(g.h * 0.15))
      const s = Math.floor(t)
      const ora = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      g.testo('▶ PLAY', g.w - 46, g.h * 0.46, px, Math.floor(t * 1.2) % 2 ? 0.26 : 0.14, 'right')
      g.testo(ora, g.w - 46, g.h * 0.46 + px * 1.05, px * 0.6, 0.18, 'right')
    }
  } },

  // le visualizzazioni che girano, come un contachilometri (in basso a destra, sotto i numeri veri)
  { id: 'contatore', it: 'Contatore', en: 'Counter', avvia(g) {
    const px = Math.max(10, Math.round(g.h * 0.1))
    const n = Math.max(3, Math.min(7, Math.floor((g.w * 0.34) / (px * 0.95))))
    const cy = g.h * 0.74
    const col = Array.from({ length: n }, (_, i) => ({ v: (i + 1) ** 1.25 * 0.18, o: R() * 10 }))
    return (t) => {
      g.pulisci()
      col.forEach((c, i) => {
        const x = g.w - 40 - (i + 0.5) * px * 0.95
        const pos = (c.o + t * c.v) % 10
        const base = Math.floor(pos), f = pos - base
        const e = f < 0.75 ? 0 : (f - 0.75) / 0.25
        for (let k = -2; k <= 2; k++) {
          const y = cy + (k - e) * px * 1.25
          const vicino = 1 - Math.min(1, Math.abs(y - cy) / (px * 2.6))
          g.testo(String((base + k + 100) % 10), x, y, px, 0.42 * vicino ** 1.4, 'center')
        }
      })
      g.rett(g.w - 40 - n * px * 0.95 - px * 0.15, cy - px * 0.72, n * px * 0.95 + px * 0.3, px * 1.44, px * 0.2, { a: 0.28 })
    }
  } },

  // le casse: a ogni colpo un'onda parte da un punto
  { id: 'cerchi', it: 'Casse', en: 'Speakers', avvia(g) {
    const fonti = [[0.66, 0.35], [0.86, 0.7], [0.94, 0.2], [0.55, 0.85]].map(([x, y]) => [x * g.w, y * g.h])
    const onde = []
    let ultimo = -1
    return (t, dt) => {
      g.pulisci()
      const k = colpo(t)
      if (k !== ultimo) { ultimo = k; const [x, y] = fonti[k % fonti.length]; onde.push({ x, y, eta: 0 }) }
      for (let i = onde.length - 1; i >= 0; i--) {
        const o = onde[i]
        o.eta += dt
        const r = o.eta * g.h * 0.32
        const a = 0.5 * (1 - o.eta / 3)
        if (a <= 0) { onde.splice(i, 1); continue }
        g.cerchio(o.x, o.y, r, { a, spessore: 1.5 })
        g.cerchio(o.x, o.y, r * 0.7, { a: a * 0.4 })
      }
      for (const [x, y] of fonti) g.cerchio(x, y, 3 + battito(t) * 3, { riempi: 0.5 })
    }
  } },

  // il montaggio: le clip scorrono sulle tracce, la testina sta ferma
  { id: 'montaggio', it: 'Montaggio', en: 'Timeline', avvia(g) {
    const tracce = 4, alto = g.h * 0.1, base = g.h * 0.42
    const clip = []
    for (let i = 0; i < tracce; i++) {
      let x = -R() * 40
      while (x < g.w * 2) { const w = tra(24, 90); clip.push({ i, x, w }); x += w + tra(3, 30) }
    }
    const lungo = g.w * 2
    return (t) => {
      g.pulisci()
      const v = t * 18
      const testa = g.w * 0.72
      for (let x = (-v % 12 + 12) % 12; x < g.w; x += 12) g.rett(x, base - 9, 1, (Math.round((x + v) / 12) % 5) ? 3 : 6, 0, { riempi: 0.3 })
      for (const c of clip) {
        const x = ((c.x - v) % lungo + lungo) % lungo - 40
        if (x > g.w || x + c.w < 0) continue
        const y = base + c.i * (alto + 4)
        const sotto = x < testa && x + c.w > testa
        g.rett(x, y, c.w, alto, 2, { a: sotto ? 0.6 : 0.3, riempi: sotto ? 0.16 : 0.05 })
      }
      g.linea([[testa, base - 14], [testa, base + tracce * (alto + 4)]], 0.7, 1.4)
      g.ctx.beginPath()
      g.ctx.moveTo(testa - 5, base - 18)
      g.ctx.lineTo(testa + 5, base - 18)
      g.ctx.lineTo(testa, base - 11)
      g.ctx.fillStyle = g.ink(0.7)
      g.ctx.fill()
    }
  } },

  // il video che ricomincia: un otto che si disegna e si cancella
  { id: 'loop', it: 'In loop', en: 'Loop', avvia(g) {
    const cx = g.w * 0.74, cy = g.h * 0.52, A = Math.min(g.w * 0.22, g.h * 0.7), B = g.h * 0.32
    return (t) => {
      g.sbiadisci(0.08)
      const d = t * 0.12
      for (let k = 0; k < 3; k++) {
        const u0 = t * 1.1 + k * 2.1
        const p = []
        for (let s = 0; s < 1; s += 0.08) {
          const u = u0 + s * 0.15
          p.push([cx + A * Math.sin(u + d), cy + B * Math.sin(2 * u)])
        }
        g.linea(p, 0.55 - k * 0.12, 2)
      }
    }
  } },

  // lo schermo dentro lo schermo: cornici 9:16 che vengono incontro
  { id: 'tunnel', it: 'Tunnel', en: 'Tunnel', avvia(g) {
    const cx = g.w * 0.76, cy = g.h * 0.5
    const n = 9
    return (t) => {
      g.pulisci()
      for (let i = 0; i < n; i++) {
        const z = ((t * 0.16 + i / n) % 1)
        const s = z ** 2.2
        const H = g.h * 2.2 * s, W = H * 9 / 16
        g.rett(cx - W / 2, cy - H / 2, W, H, W * 0.1, { a: 0.55 * Math.sin(z * Math.PI), spessore: 1 + s * 2 })
      }
      g.cerchio(cx, cy, 2 + battito(t) * 2.5, { riempi: 0.45 })
    }
  } },
]

// lo stesso ordine per tutti, diverso ogni giorno
function seme(s) {
  let h = 2166136261
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296 }
}
export function ordineDelGiorno(d = new Date()) {
  const r = seme(`tt-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
  const a = [...TEMI]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
export const fascia = (d = new Date()) => Math.floor(d.getHours() / ORE)
const temaDellaFascia = (d = new Date()) => ordineDelGiorno(d)[fascia(d) % TEMI.length]

export function accendi(dentro, { quandoCambia, tema: fisso } = {}) {
  const canvas = document.createElement('canvas')
  canvas.className = 'ttc__bg'
  canvas.setAttribute('aria-hidden', 'true')
  const scena = document.createElement('canvas')
  const ciano = document.createElement('canvas')
  const rosso = document.createElement('canvas')
  const out = canvas.getContext('2d')
  const g = tela(scena)
  const fermo = matchMedia('(prefers-reduced-motion: reduce)')
  let casa = dentro
  let tema = TEMI.find((x) => x.id === fisso) || temaDellaFascia()
  let quale = fascia()
  let scelto = false
  let fotogramma = null
  let t = 0, ultimo = 0, raf = 0, visibile = false, spento = false, cambio = 0
  let glitch = 0, prossimoGlitch = tra(5, 11)

  const avvisa = () => { try { quandoCambia?.(tema, { fascia: quale, scelto }) } catch {} }
  const eChiaro = () => document.documentElement.dataset.theme !== 'dark'

  function tingi(dove, colore) {
    const c = dove.getContext('2d')
    c.globalCompositeOperation = 'copy'
    c.drawImage(scena, 0, 0)
    c.globalCompositeOperation = 'source-in'
    c.fillStyle = colore
    c.fillRect(0, 0, dove.width, dove.height)
    c.globalCompositeOperation = 'source-over'
  }

  // le due copie, una per tinta, un filo spostate; nel glitch qualche fetta scivola
  function stampa(dt) {
    const tinta = g.chiaro ? TINTE.giorno : TINTE.notte
    tingi(ciano, tinta.ciano)
    tingi(rosso, tinta.rosso)
    let d = 0.9
    if (!fermo.matches) {
      prossimoGlitch -= dt
      if (prossimoGlitch <= 0) { glitch = 0.22; prossimoGlitch = tra(6, 13) }
      if (glitch > 0) { glitch -= dt; d = tra(2, 4) }
    }
    out.clearRect(0, 0, canvas.width, canvas.height)
    out.globalCompositeOperation = 'source-over'
    out.drawImage(ciano, -d, 0)
    out.globalCompositeOperation = tinta.fondi
    out.drawImage(rosso, d, 0)
    out.globalCompositeOperation = 'source-over'
    if (glitch > 0) {
      for (let i = 0; i < 3; i++) {
        const y = Math.floor(R() * canvas.height), h = Math.ceil(tra(2, 9)), dx = Math.round(tra(-10, 10))
        out.drawImage(canvas, 0, y, canvas.width, h, dx, y, canvas.width, h)
      }
    }
  }

  function prepara() {
    const w = Math.max(8, Math.ceil(casa.clientWidth / SCALA)), h = Math.max(8, Math.ceil(casa.clientHeight / SCALA))
    if (canvas.width !== w || canvas.height !== h || !fotogramma) {
      for (const c of [canvas, scena, ciano, rosso]) { c.width = w; c.height = h }
      g.chiaro = eChiaro()
      fotogramma = tema.avvia(g)
      for (let i = 0; i < 36; i++) { t += 0.05; fotogramma(t, 0.05) }
      stampa(0)
    }
  }

  function giro(adesso) {
    raf = 0
    if (spento || !visibile || fermo.matches) return
    raf = requestAnimationFrame(giro)
    if (adesso - ultimo < 1000 / FPS - 2) return
    const dt = Math.min(0.1, (adesso - ultimo) / 1000 || 0.04)
    ultimo = adesso
    t += dt
    fotogramma?.(t, dt)
    stampa(dt)
  }
  const parti = () => { if (!raf && !spento && visibile && !fermo.matches) { ultimo = performance.now(); raf = requestAnimationFrame(giro) } }

  function metti(nuovo, opzioni = {}) {
    if (!nuovo) return
    scelto = !!opzioni.scelto
    clearTimeout(cambio)
    const scambia = () => { tema = nuovo; fotogramma = null; g.pulisci(); prepara(); canvas.style.opacity = ''; avvisa(); parti() }
    if (fermo.matches || nuovo === tema) return scambia()
    canvas.style.opacity = '0'
    cambio = setTimeout(scambia, 240)
  }

  const occhio = new IntersectionObserver((v) => { visibile = v.at(-1).isIntersecting; parti() })
  const misura = new ResizeObserver(() => { const f = fotogramma; prepara(); if (f !== fotogramma) parti() })
  let orfano = 0
  const orologio = setInterval(() => {
    if (!canvas.isConnected) { if (++orfano > 1) spegni(); return }
    orfano = 0
    const f = fascia()
    if (f !== quale) { quale = f; if (!fisso) metti(temaDellaFascia()) }
  }, 30_000)
  const suFermo = () => { fotogramma = null; prepara(); parti() }
  fermo.addEventListener?.('change', suFermo)
  const suTema = new MutationObserver(() => {
    if (eChiaro() === g.chiaro) return
    fotogramma = null
    g.pulisci()
    prepara()
    avvisa()
    parti()
  })
  suTema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  function spegni() {
    spento = true
    cancelAnimationFrame(raf)
    clearInterval(orologio)
    clearTimeout(cambio)
    occhio.disconnect()
    misura.disconnect()
    suTema.disconnect()
    fermo.removeEventListener?.('change', suFermo)
    canvas.remove()
  }

  function sposta(nuovaCasa) {
    if (!nuovaCasa) return
    if (canvas.parentNode !== nuovaCasa) {
      misura.disconnect()
      casa = nuovaCasa
      casa.prepend(canvas)
      misura.observe(casa)
    }
    prepara()
    parti()
  }

  casa.prepend(canvas)
  occhio.observe(canvas)
  misura.observe(casa)
  prepara()
  avvisa()

  return {
    sposta,
    get tema() { return tema },
    get stato() { return { fascia: quale, scelto, chiaro: g.chiaro, ore: ORE } },
    nome(lang) { return tema[lang] || tema.en },
    // il disco: la scena dopo, nell'ordine di oggi
    prossimo() {
      const lista = ordineDelGiorno()
      metti(lista[(lista.indexOf(tema) + 1) % lista.length], { scelto: true })
    },
    spegni,
  }
}
