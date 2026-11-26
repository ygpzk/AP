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
// stesso ordine per tutti). Il dado nella colonna dei profili (lo stesso della
// scheda Instagram) pesca una scena a caso, che resta fino al cambio di fascia.
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
// Le scene occupano tutta la tela, come gli sfondi di Instagram: a sinistra il
// velo copre il testo, a destra le tessere coprono il resto, e quello che si
// vede davvero è la fascia in mezzo. Lì stanno i centri (disco, otto, tunnel).
export const TEMI = [
  { id: 'eq', it: 'Equalizzatore', en: 'Equalizer', avvia(g) {
    const n = Math.max(12, Math.round(g.w / 7))
    const barre = Array.from({ length: n }, (_, i) => ({ f: R() * TAU, k: tra(1.2, 3.4), v: 0, cima: 0, x: i }))
    return (t, dt) => {
      g.pulisci()
      const b = battito(t)
      const passo = g.w / n
      for (const o of barre) {
        const verso = 0.55 + 0.45 * Math.sin((o.x / n) * Math.PI)
        const obiettivo = g.h * (0.06 + 0.55 * verso * (0.5 + 0.5 * Math.sin(t * o.k + o.f)) ** 2 * (0.62 + 0.38 * b))
        o.v += (obiettivo - o.v) * Math.min(1, dt * 14)
        o.cima = Math.max(o.v, o.cima - dt * g.h * 0.22)
        const x = o.x * passo + 1
        const lw = Math.max(2, passo - 2.5)
        g.rett(x, g.h - o.v, lw, o.v + 2, 1.5, { riempi: 0.12 + 0.18 * verso })
        g.rett(x, g.h - o.cima - 4, lw, 1.6, 0.8, { riempi: 0.5 * verso })
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
          const amp = g.h * 0.12 * inv * (0.45 + 0.75 * b)
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
    const colonne = Array.from({ length: Math.ceil(g.w / (W + gap)) + 1 }, (_, i) => ({ x: i * (W + gap) + gap * 0.5, sfasa: i * 0.37, righe: Array.from({ length: 6 }, () => tra(0.3, 0.85)) }))
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
          g.rett(c.x, y, W, H, W * 0.09, { a: 0.22 + 0.26 * vicino, riempi: 0.035, spessore: 1.2 })
          const r = c.righe[(j + k + 60) % 6]
          g.rett(c.x + W * 0.1, y + H * 0.8, W * 0.62 * r, 2, 1, { riempi: 0.32 * vicino })
          g.rett(c.x + W * 0.1, y + H * 0.87, W * 0.4 * r, 2, 1, { riempi: 0.22 * vicino })
          g.cerchio(c.x + W * 0.86, y + H * 0.5, W * 0.06, { riempi: 0.3 * vicino })
          g.cerchio(c.x + W * 0.86, y + H * 0.64, W * 0.06, { riempi: 0.3 * vicino })
        }
      }
    }
  } },

  // i cuori di una diretta: salgono dal fondo, a ondate sul battito
  { id: 'cuori', it: 'Cuori', en: 'Hearts', avvia(g) {
    const cuori = []
    let ultimo = -1
    const nasci = (n) => { for (let i = 0; i < n; i++) cuori.push({ x: g.w * tra(0.06, 0.96), y: g.h + 6, v: tra(14, 26), f: R() * TAU, s: tra(5.5, 10), vita: 0, fine: tra(3.5, 6) }) }
    for (let i = 0; i < 30; i++) { nasci(1); const c = cuori.at(-1); c.vita = R() * c.fine; c.y -= c.vita * c.v }
    return (t, dt) => {
      g.pulisci()
      const k = colpo(t)
      if (k !== ultimo) { ultimo = k; nasci(2 + (R() < 0.35 ? 2 : 0)) }
      for (let i = cuori.length - 1; i >= 0; i--) {
        const c = cuori[i]
        c.vita += dt
        c.y -= c.v * dt
        if (c.vita > c.fine || c.y < -10) { cuori.splice(i, 1); continue }
        const p = c.vita / c.fine
        const x = c.x - p * g.w * 0.06 + Math.sin(c.vita * 2.2 + c.f) * 7
        const s = c.s * (0.5 + Math.min(1, c.vita * 3) * 0.7)
        cuore(g.ctx, x, c.y, s, Math.sin(c.vita * 1.7 + c.f) * 0.25)
        g.ctx.fillStyle = g.ink(0.62 * (1 - p) ** 0.7)
        g.ctx.fill()
      }
    }
  } },

  { id: 'note', it: 'Note', en: 'Notes', avvia(g) {
    const note = Array.from({ length: Math.round(g.w / 16) }, () => ({ x: R() * g.w, y: R() * g.h, v: tra(6, 14), f: R() * TAU, s: tra(4, 7.5), d: R() < 0.35 }))
    return (t, dt) => {
      g.pulisci()
      const b = battito(t)
      for (const o of note) {
        o.x += o.v * dt
        if (o.x > g.w + 12) { o.x = -12; o.y = R() * g.h }
        const y = o.y + Math.sin(t * 0.9 + o.f) * 6
        g.ctx.fillStyle = g.ink(0.4)
        g.ctx.strokeStyle = g.ink(0.4)
        nota(g.ctx, o.x, y, o.s * (1 + b * 0.12), Math.sin(t + o.f) * 0.2, o.d)
      }
    }
  } },

  // il disco del suono, quello che gira in basso a destra in ogni video (qui al centro)
  { id: 'vinile', it: 'Vinile', en: 'Vinyl', avvia(g) {
    const cx = g.w * 0.5, cy = g.h * 0.54, r = Math.min(g.h * 0.72, g.w * 0.3)
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
      // la scritta del videoregistratore, piccola, nella fascia libera in mezzo
      const px = Math.max(7, Math.round(g.h * 0.05))
      const s = Math.floor(t)
      const ora = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      g.testo('▶ PLAY', g.w * 0.5, g.h * 0.5, px, Math.floor(t * 1.2) % 2 ? 0.5 : 0.28, 'center')
      g.testo(`SP ${ora}`, g.w * 0.5, g.h * 0.5 + px * 1.4, px * 0.8, 0.32, 'center')
    }
  } },

  // le visualizzazioni che girano: colonne di cifre come un contachilometri, su tutta la tela
  { id: 'contatore', it: 'Contatore', en: 'Counter', avvia(g) {
    const px = Math.max(9, Math.round(g.h * 0.085))
    const passoX = px * 1.25, passoY = px * 1.3
    // le dieci cifre, disegnate una volta
    const cifre = document.createElement('canvas')
    cifre.width = px * 10
    cifre.height = Math.ceil(px * 1.3)
    const cc = cifre.getContext('2d')
    cc.font = `700 ${px}px "gg mono", Consolas, monospace`
    cc.textAlign = 'center'
    cc.textBaseline = 'middle'
    cc.fillStyle = '#fff'
    for (let d = 0; d < 10; d++) cc.fillText(String(d), px * d + px / 2, cifre.height / 2)
    const n = Math.ceil(g.w / passoX) + 1
    const righe = Math.ceil(g.h / passoY / 2) + 1
    const col = Array.from({ length: n }, () => ({ v: tra(0.12, 0.8), o: R() * 10 }))
    return (t) => {
      g.pulisci()
      const ctx = g.ctx
      col.forEach((c, i) => {
        const x = i * passoX + passoX / 2 - px / 2
        const pos = (c.o + t * c.v) % 10
        const base = Math.floor(pos), f = pos - base
        const e = f < 0.7 ? 0 : 1 - (1 - (f - 0.7) / 0.3) ** 3
        for (let k = -righe; k <= righe; k++) {
          const y = g.h / 2 + (k - e) * passoY - cifre.height / 2
          const vicino = 1 - Math.min(1, Math.abs(y + cifre.height / 2 - g.h / 2) / (g.h / 2))
          ctx.globalAlpha = 0.08 + 0.3 * vicino ** 2
          ctx.drawImage(cifre, px * ((base + k + 100) % 10), 0, px, cifre.height, x, y, px, cifre.height)
        }
      })
      ctx.globalAlpha = 1
      // la riga di lettura, come la finestrella del contachilometri
      g.rett(0, g.h / 2 - passoY / 2, g.w, passoY, 0, { riempi: 0.05 })
    }
  } },

  // le casse: a ogni colpo un'onda parte da un punto
  { id: 'cerchi', it: 'Casse', en: 'Speakers', avvia(g) {
    const fonti = [[0.5, 0.36], [0.16, 0.86], [0.9, 0.14], [0.62, 0.9], [0.3, 0.12], [0.84, 0.66]].map(([x, y]) => [x * g.w, y * g.h])
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
      const testa = g.w * 0.5
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
    const cx = g.w * 0.5, cy = g.h * 0.52, A = Math.min(g.w * 0.3, g.h * 0.9), B = g.h * 0.36
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
    const cx = g.w * 0.5, cy = g.h * 0.5
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
  canvas.className = 'igc__bg'
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
    // come gli sfondi di Instagram (ig-sfondi.js): l'ora d'inizio della fascia e se è stato pescato col dado
    get stato() { return { ora: quale * ORE, aCaso: scelto, chiaro: g.chiaro } },
    nome(lang) { return tema[lang] || tema.en },
    // il dado nella colonna dei profili: una scena a caso, fino al cambio di fascia
    aCaso() {
      let n
      do { n = TEMI[(R() * TEMI.length) | 0] } while (n === tema)
      metti(n, { scelto: true })
    },
    spegni,
  }
}
