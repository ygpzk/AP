// Gli sfondi vivi del palco Instagram: ventiquattro temi in pixel, uno per ogni
// ora della giornata. L'ordine si rimescola ogni giorno (stesso giorno, stesso
// ordine: chi guarda alle 14 vede il tema delle 14), e il dado nella colonna
// dei profili ne pesca uno a caso fino al cambio dell'ora.
//
// Ogni tema ha due vesti: luci sul nero col tema scuro, inchiostri sulla carta
// col tema chiaro (e qualche scena di giorno cambia: le stelle diventano
// coriandoli, le lucciole polline, la neve petali, il tramonto un'alba).
//
// Leggeri apposta: una tela piccola (un pixel ogni 4 dello schermo) ingrandita
// senza sfumare, venti fotogrammi al secondo, ferma quando la scheda non si
// vede o la pagina è in secondo piano; con «movimento ridotto» resta un
// fotogramma fisso.

const CELLA = 4
const FPS = 20
const R = Math.random
const tra = (a, b) => a + R() * (b - a)
const TAU = Math.PI * 2

// due tavolozze: di notte luci sul nero, di giorno inchiostri sulla carta
// («bianco» è il neutro: bianco di notte, quasi nero di giorno)
const NOTTE = {
  lime: [204, 255, 0], viola: [157, 0, 255], rosa: [238, 42, 123], giallo: [249, 206, 52],
  lcd: [255, 138, 30], verde: [61, 220, 132], cielo: [90, 200, 255], bianco: [255, 255, 255],
}
const GIORNO = {
  lime: [104, 150, 0], viola: [124, 20, 224], rosa: [226, 32, 112], giallo: [222, 150, 0],
  lcd: [232, 104, 0], verde: [16, 150, 80], cielo: [20, 128, 220], bianco: [40, 28, 56],
}
let RGB = NOTTE
export function tavolozza(chiaro) { RGB = chiaro ? GIORNO : NOTTE }
const c = (k, a = 1) => `rgba(${RGB[k]},${a})`
// una sfumatura fra due colori della tavolozza, per i temi che scrivono i pixel a mano
const sfuma = (da, a) => { const A = RGB[da], B = RGB[a]; return [A[0], A[1], A[2], B[0] - A[0], B[1] - A[1], B[2] - A[2]] }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const SEMI = {
  picche: ['00100', '01110', '11111', '11011', '00100'],
  cuori: ['01010', '11111', '11111', '01110', '00100'],
  quadri: ['00100', '01110', '11111', '01110', '00100'],
  fiori: ['01110', '01110', '11111', '11011', '00100'],
}

// la tela vista dai temi: larghezza, altezza e quattro gesti
export function tela(canvas) {
  const ctx = canvas.getContext('2d')
  return {
    ctx,
    chiaro: false,
    get w() { return canvas.width },
    get h() { return canvas.height },
    pulisci() { ctx.clearRect(0, 0, canvas.width, canvas.height) },
    // le scie: si cancella un po' di tutto, così la tela resta trasparente
    sbiadisci(a) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = `rgba(0,0,0,${a})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
    },
    p(x, y, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), 1, 1) },
    r(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))) },
    campo() { return ctx.createImageData(canvas.width, canvas.height) },
  }
}

// ogni tema: avvia(g) prepara la scena e restituisce il fotogramma (t, dt) in secondi;
// g.chiaro dice se è giorno, «giorno» è il nome della scena quando di giorno cambia
export const TEMI = [
  { id: 'stelle', it: 'Stelle', en: 'Stars', giorno: { it: 'Coriandoli', en: 'Confetti' }, avvia(g) {
    const T = ['rosa', 'viola', 'giallo', 'cielo', 'lime']
    const s = Array.from({ length: Math.round((g.w * g.h) / (g.chiaro ? 150 : 90)) }, (_, i) => ({ x: R() * g.w, y: R() * g.h, z: 1 + ((R() * 3) | 0), f: R() * TAU, col: T[i % 5] }))
    return (t, dt) => {
      g.pulisci()
      for (const o of s) {
        o.x -= dt * o.z * 2.2
        if (o.x < 0) { o.x += g.w; o.y = R() * g.h }
        const a = (0.18 + 0.14 * o.z) * (0.6 + 0.4 * Math.sin(t * 2 + o.f))
        if (g.chiaro) g.r(o.x, o.y + Math.sin(t + o.f) * 2, o.z > 1 ? 2 : 1, 1, c(o.col, a * 1.3))
        else g.p(o.x, o.y, c(o.z === 3 ? 'lime' : 'bianco', a))
      }
    }
  } },

  { id: 'matrici', it: 'Matrici', en: 'Matrix', avvia(g) {
    const col = Array.from({ length: Math.ceil(g.w / 2) }, () => ({ y: tra(-g.h, g.h), v: tra(8, 24) }))
    return (t, dt) => {
      g.sbiadisci(0.09)
      col.forEach((o, i) => {
        o.y += o.v * dt
        if (o.y > g.h + 4) { o.y = tra(-30, 0); o.v = tra(8, 24) }
        g.p(i * 2, o.y, c('verde', 0.55))
        if (R() < 0.04) g.p(i * 2, o.y - ((R() * 12) | 0), c('lime', 0.7))
      })
    }
  } },

  // lo schermo del PZK Zero: un bit, arancione, retinato
  { id: 'lcd', it: 'Cercapersone', en: 'Pager', avvia(g) {
    const im = g.campo(), d = im.data, L = RGB.lcd, forza = g.chiaro ? 105 : 72
    return (t) => {
      let k = 0
      for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++, k += 4) {
          const v = 0.5 + 0.25 * Math.sin(x * 0.07 + t * 0.6) + 0.25 * Math.sin(y * 0.09 - t * 0.45 + Math.sin(x * 0.03 + t * 0.2) * 2)
          d[k] = L[0]; d[k + 1] = L[1]; d[k + 2] = L[2]
          d[k + 3] = v * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 5 ? forza : 0
        }
      }
      g.ctx.putImageData(im, 0, 0)
    }
  } },

  { id: 'orbite', it: 'Orbite', en: 'Orbits', avvia(g) {
    const cx = g.w * 0.7, cy = g.h * 0.5
    const o = [0, 1, 2, 3].map((i) => ({ rx: g.w * (0.12 + i * 0.1), ry: g.h * (0.1 + i * 0.1), v: 0.5 / (i + 1) + 0.08, f: R() * TAU, col: ['lime', 'viola', 'rosa', 'cielo'][i] }))
    return (t) => {
      g.pulisci()
      for (const q of o) {
        for (let a = 0; a < TAU; a += 0.09) g.p(cx + Math.cos(a) * q.rx, cy + Math.sin(a) * q.ry, c('bianco', 0.13))
        const a = q.f + t * q.v
        g.r(cx + Math.cos(a) * q.rx - 1, cy + Math.sin(a) * q.ry - 1, 3, 3, c(q.col, 0.78))
      }
      g.r(cx - 2, cy - 2, 5, 5, c('giallo', 0.5))
    }
  } },

  { id: 'pioggia', it: 'Pioggia', en: 'Rain', avvia(g) {
    const largo = g.w + g.h * 0.3
    const gocce = Array.from({ length: Math.round(g.w * 0.5) }, () => ({ x: R() * largo, y: R() * g.h, v: tra(50, 90), l: 2 + ((R() * 3) | 0) }))
    const schizzi = []
    return (t, dt) => {
      g.pulisci()
      for (const o of gocce) {
        o.y += o.v * dt
        o.x -= o.v * dt * 0.25
        if (o.y > g.h) { if (schizzi.length < 60) schizzi.push({ x: o.x, e: 0 }); o.y = -5; o.x = R() * largo }
        for (let i = 0; i < o.l; i++) g.p(o.x + i * 0.25, o.y - i, c('cielo', 0.32 - i * 0.05))
      }
      for (let i = schizzi.length - 1; i >= 0; i--) {
        const s = schizzi[i]
        s.e += dt
        if (s.e > 0.3) { schizzi.splice(i, 1); continue }
        const k = 1 + ((s.e * 8) | 0)
        g.p(s.x - k, g.h - 1 - (k >> 1), c('bianco', 0.3))
        g.p(s.x + k, g.h - 1 - (k >> 1), c('bianco', 0.3))
      }
    }
  } },

  { id: 'onde', it: 'Onde', en: 'Waves', avvia(g) {
    const S = sfuma('lime', 'viola')
    return (t) => {
      g.pulisci()
      for (let i = 0; i < 6; i++) {
        const y0 = g.h * (0.2 + i * 0.13)
        for (let x = 0; x < g.w; x++) {
          const y = y0 + Math.sin(x * 0.045 + t * (0.7 + i * 0.12) + i) * g.h * 0.06 + Math.sin(x * 0.012 - t * 0.4) * g.h * 0.04
          const m = x / g.w
          g.p(x, y, `rgba(${(S[0] + S[3] * m) | 0},${(S[1] + S[4] * m) | 0},${(S[2] + S[5] * m) | 0},${0.3 + 0.05 * i})`)
        }
      }
    }
  } },

  // le fiches del casinò: monete che cadono girando
  { id: 'fiches', it: 'Fiches', en: 'Chips', avvia(g) {
    const f = Array.from({ length: Math.max(8, ((g.w * g.h) / 1500) | 0) }, () => ({ x: R() * g.w, y: R() * g.h, v: tra(6, 16), f: R() * TAU, col: R() < 0.5 ? 'giallo' : 'lime' }))
    return (t, dt) => {
      g.pulisci()
      for (const o of f) {
        o.y += o.v * dt
        if (o.y > g.h + 4) { o.y = -5; o.x = R() * g.w }
        const giro = Math.abs(Math.cos(t * 2 + o.f))
        const mezzo = Math.max(0.5, 2.5 * giro)
        for (let dy = -2; dy <= 2; dy++) {
          const span = Math.round(mezzo * Math.sqrt(1 - (dy * dy) / 6.5))
          g.r(o.x - span, o.y + dy, span * 2 + 1, 1, c(o.col, 0.4))
        }
        if (giro > 0.6) g.r(o.x, o.y - 1, 1, 3, c('bianco', 0.5))
      }
    }
  } },

  { id: 'roulette', it: 'Roulette', en: 'Roulette', avvia(g) {
    const im = g.campo(), d = im.data
    const cx = g.w * 0.78, cy = g.h * 0.62, r1 = Math.min(g.w, g.h) * 0.62, r0 = r1 * 0.55
    return (t) => {
      const giro = t * 0.25
      let k = 0
      for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++, k += 4) {
          const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)
          let a = 0, col = RGB.bianco
          if (r < r1 && r > r0) {
            const s = Math.floor((((Math.atan2(dy, dx) + giro) / TAU) * 24 % 24 + 24) % 24)
            col = s === 0 ? RGB.verde : s % 2 ? RGB.rosa : RGB.viola
            a = (x + y) & 1 ? 95 : 55
          } else if (Math.abs(r - r1) < 1 || Math.abs(r - r0) < 1) a = 80
          d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = a
        }
      }
      g.ctx.putImageData(im, 0, 0)
      const a = -t * 1.3
      g.r(cx + Math.cos(a) * r1 * 0.93 - 1, cy + Math.sin(a) * r1 * 0.93 - 1, 3, 3, c('bianco', 0.9))
    }
  } },

  // il muro: mattoni che si accendono come le firme
  { id: 'muro', it: 'Il Muro', en: 'The Wall', avvia(g) {
    const bw = 12, bh = 5, cols = Math.ceil(g.w / bw) + 1, righe = Math.ceil(g.h / bh)
    const luce = new Float32Array(cols * righe), tinta = new Uint8Array(cols * righe)
    const T = ['lime', 'viola', 'rosa', 'giallo']
    return (t, dt) => {
      g.pulisci()
      if (R() < dt * 14) { const i = (R() * luce.length) | 0; luce[i] = 1; tinta[i] = (R() * 4) | 0 }
      for (let r = 0; r < righe; r++) {
        const sfalsa = r % 2 ? -bw / 2 : 0
        for (let q = 0; q < cols; q++) {
          const i = r * cols + q, x = q * bw + sfalsa, y = r * bh
          g.r(x, y, bw, 1, c('bianco', 0.07))
          g.r(x, y, 1, bh, c('bianco', 0.07))
          if (luce[i] > 0.02) { g.r(x + 1, y + 1, bw - 1, bh - 1, c(T[tinta[i]], luce[i] * 0.5)); luce[i] *= Math.pow(0.25, dt) }
        }
      }
    }
  } },

  { id: 'semi', it: 'Semi', en: 'Suits', avvia(g) {
    const nomi = Object.keys(SEMI)
    const s = Array.from({ length: Math.max(8, ((g.w * g.h) / 1300) | 0) }, () => ({ x: R() * g.w, y: R() * g.h, v: tra(3, 9), f: R() * TAU, seme: nomi[(R() * 4) | 0] }))
    return (t, dt) => {
      g.pulisci()
      for (const o of s) {
        o.y += o.v * dt
        if (o.y > g.h + 6) { o.y = -6; o.x = R() * g.w; o.seme = nomi[(R() * 4) | 0] }
        const x = o.x + Math.sin(t * 0.8 + o.f) * 3, bit = SEMI[o.seme]
        const col = c(o.seme === 'cuori' || o.seme === 'quadri' ? 'rosa' : 'bianco', 0.2 + 0.03 * o.v)
        for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (bit[j][i] === '1') g.p(x + i, o.y + j, col)
      }
    }
  } },

  { id: 'lucciole', it: 'Lucciole', en: 'Fireflies', giorno: { it: 'Polline', en: 'Pollen' }, avvia(g) {
    const col = g.chiaro ? 'giallo' : 'lime', alone = g.chiaro ? 0.22 : 0.12
    const l = Array.from({ length: Math.max(12, ((g.w * g.h) / 520) | 0) }, () => ({ x: R() * g.w, y: R() * g.h, a: R() * TAU, f: R() * TAU, v: tra(2, 6) }))
    return (t, dt) => {
      g.sbiadisci(0.2)
      for (const o of l) {
        o.a += (R() - 0.5) * 9 * dt
        o.x = (o.x + Math.cos(o.a) * o.v * dt + g.w) % g.w
        o.y = (o.y + Math.sin(o.a) * o.v * dt * 0.6 + g.h) % g.h
        const b = Math.max(0, Math.sin(t * 1.6 + o.f))
        if (b > 0.15) { g.r(o.x - 1, o.y - 1, 3, 3, c(col, b * alone)); g.p(o.x, o.y, c(col, b * 0.9)) }
      }
    }
  } },

  { id: 'aurora', it: 'Aurora', en: 'Aurora', avvia(g) {
    const im = g.campo(), d = im.data, S = sfuma('verde', 'viola'), luce = g.chiaro ? 135 : 105
    return (t) => {
      d.fill(0)
      for (let x = 0; x < g.w; x++) {
        const cima = g.h * (0.16 + 0.12 * Math.sin(x * 0.03 + t * 0.3) + 0.08 * Math.sin(x * 0.071 - t * 0.21))
        const lungo = g.h * (0.4 + 0.15 * Math.sin(x * 0.05 + t * 0.4))
        const forza = (0.55 + 0.45 * Math.sin(x * 0.11 + t * 0.9)) * (x & 1 ? 1 : 0.7)
        const da = Math.max(0, cima | 0), a = Math.min(g.h, (cima + lungo) | 0)
        for (let y = da; y < a; y++) {
          const u = (y - cima) / lungo, k = (y * g.w + x) * 4
          d[k] = S[0] + S[3] * u; d[k + 1] = S[1] + S[4] * u; d[k + 2] = S[2] + S[5] * u
          d[k + 3] = Math.sin(u * Math.PI) * forza * luce
        }
      }
      g.ctx.putImageData(im, 0, 0)
    }
  } },

  // la borsa $pzk: candele che scorrono
  { id: 'borsa', it: 'Borsa', en: 'Stocks', avvia(g) {
    const passo = 4, quante = Math.ceil(g.w / passo) + 2
    let ultimo = 0.5
    const nuova = () => {
      const o = ultimo, cl = Math.min(0.94, Math.max(0.06, o + (R() - 0.5) * 0.24))
      ultimo = cl
      return { o, c: cl, alto: Math.max(o, cl) + R() * 0.05, basso: Math.min(o, cl) - R() * 0.05 }
    }
    const cand = Array.from({ length: quante }, nuova)
    let scorri = 0
    const y = (v) => g.h * (0.86 - v * 0.66)
    return (t, dt) => {
      g.pulisci()
      scorri += dt * 5
      while (scorri >= passo) { scorri -= passo; cand.shift(); cand.push(nuova()) }
      for (let i = 1; i < 4; i++) g.r(0, g.h * (0.2 + i * 0.17), g.w, 1, c('bianco', 0.05))
      cand.forEach((k, i) => {
        const x = i * passo - scorri, col = c(k.c >= k.o ? 'verde' : 'rosa', 0.5)
        g.r(x + 1, y(k.alto), 1, y(k.basso) - y(k.alto), c(k.c >= k.o ? 'verde' : 'rosa', 0.3))
        g.r(x, Math.min(y(k.o), y(k.c)), 3, Math.abs(y(k.o) - y(k.c)), col)
      })
    }
  } },

  { id: 'griglia', it: 'Griglia', en: 'Grid', avvia(g) {
    const oy = (g.h * 0.48) | 0, H = g.h - oy, cx = g.w * 0.6
    const cielo = Array.from({ length: (g.w / 5) | 0 }, () => ({ x: R() * g.w, y: R() * oy, f: R() * TAU }))
    return (t) => {
      g.pulisci()
      for (const s of cielo) g.p(s.x, s.y, c('bianco', 0.12 + 0.1 * Math.sin(t + s.f)))
      g.r(0, oy, g.w, 1, c('rosa', 0.45))
      for (let i = 0; i < 9; i++) { const z = ((i + t * 0.6) % 9) / 9; g.r(0, oy + z * z * H, g.w, 1, c('rosa', 0.08 + z * 0.36)) }
      for (let i = -14; i <= 14; i++) {
        const xb = cx + i * g.w * 0.13
        for (let y = oy; y < g.h; y++) { const k = (y - oy) / H; g.p(cx + (xb - cx) * k, y, c('viola', 0.12 + 0.34 * k)) }
      }
    }
  } },

  { id: 'neve', it: 'Neve', en: 'Snow', giorno: { it: 'Petali', en: 'Petals' }, avvia(g) {
    const f = Array.from({ length: Math.round((g.w * g.h) / 130) }, () => ({ x: R() * g.w, y: R() * g.h, v: tra(3, 11), f: R() * TAU }))
    return (t, dt) => {
      g.pulisci()
      for (const o of f) {
        o.y += o.v * dt
        if (o.y > g.h) { o.y = -1; o.x = R() * g.w }
        if (g.chiaro) g.r(o.x + Math.sin(t * 0.9 + o.f) * 3, o.y, 2, 1, c(o.v > 7 ? 'rosa' : 'viola', 0.16 + o.v * 0.035))
        else g.p(o.x + Math.sin(t * 0.9 + o.f) * 2, o.y, c('bianco', 0.1 + o.v * 0.035))
      }
    }
  } },

  // la miniera: gemme che luccicano nella roccia
  { id: 'miniera', it: 'Miniera', en: 'Mine', avvia(g) {
    const roccia = Array.from({ length: Math.round((g.w * g.h) / 26) }, () => ({ x: (R() * g.w) | 0, y: (R() * g.h) | 0, a: tra(0.03, 0.09) }))
    const T = ['giallo', 'cielo', 'rosa', 'lime']
    const gemme = Array.from({ length: Math.max(10, ((g.w * g.h) / 520) | 0) }, () => ({ x: (R() * g.w) | 0, y: (R() * g.h) | 0, f: R() * TAU, v: tra(0.6, 1.8), col: T[(R() * 4) | 0] }))
    const sassi = []
    return (t, dt) => {
      g.pulisci()
      for (const s of roccia) g.p(s.x, s.y, c('bianco', s.a))
      for (const o of gemme) {
        const b = Math.pow(Math.max(0, Math.sin(t * o.v + o.f)), 6)
        g.r(o.x, o.y, 2, 2, c(o.col, 0.25 + b * 0.6))
        if (b > 0.5) { g.r(o.x - 2, o.y, 6, 1, c('bianco', b * 0.5)); g.r(o.x, o.y - 2, 1, 6, c('bianco', b * 0.5)) }
      }
      if (R() < dt * 2.5 && sassi.length < 30) sassi.push({ x: R() * g.w, y: 0, v: tra(20, 45) })
      for (let i = sassi.length - 1; i >= 0; i--) {
        const s = sassi[i]
        s.y += s.v * dt
        if (s.y > g.h) sassi.splice(i, 1)
        else g.p(s.x, s.y, c('bianco', 0.3))
      }
    }
  } },

  { id: 'plasma', it: 'Plasma', en: 'Plasma', avvia(g) {
    const im = g.campo(), d = im.data, cx = g.w * 0.7, cy = g.h * 0.4, S = sfuma('viola', 'rosa')
    return (t) => {
      let k = 0
      for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++, k += 4) {
          const v = Math.sin(x * 0.05 + t * 0.5) + Math.sin(y * 0.07 - t * 0.4) + Math.sin((x + y) * 0.035 + t * 0.3) + Math.sin(Math.hypot(x - cx, y - cy) * 0.06 - t * 0.6)
          const q = Math.floor(((v + 4) / 8) * 6) / 5
          d[k] = S[0] + S[3] * q; d[k + 1] = S[1] + S[4] * q; d[k + 2] = S[2] + S[5] * q
          d[k + 3] = (q > 0.35 ? 24 + 62 * q : 0) * ((x + y) & 1 ? 1 : 0.6)
        }
      }
      g.ctx.putImageData(im, 0, 0)
    }
  } },

  { id: 'circuito', it: 'Circuito', en: 'Circuit', avvia(g) {
    const T = ['verde', 'lime', 'cielo']
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]
    const a = Array.from({ length: 14 }, (_, i) => ({ x: ((R() * g.w) / 4 | 0) * 4, y: ((R() * g.h) / 4 | 0) * 4, d: (R() * 4) | 0, resto: 4 * (1 + ((R() * 5) | 0)), col: T[i % 3] }))
    return () => {
      g.sbiadisci(0.035)
      for (const o of a) {
        o.x = (o.x + DX[o.d] + g.w) % g.w
        o.y = (o.y + DY[o.d] + g.h) % g.h
        g.p(o.x, o.y, c(o.col, 0.6))
        if (--o.resto <= 0) {
          o.resto = 4 * (1 + ((R() * 6) | 0))
          o.d = (o.d + (R() < 0.5 ? 1 : 3)) % 4
          g.r(o.x - 1, o.y - 1, 3, 3, c(o.col, 0.5))
        }
      }
    }
  } },

  { id: 'radar', it: 'Radar', en: 'Radar', avvia(g) {
    const cx = g.w * 0.7, cy = g.h * 0.52, rm = Math.min(g.w * 0.42, g.h * 0.62)
    const eco = Array.from({ length: 7 }, () => ({ a: R() * TAU, r: tra(0.2, 0.95) * rm, e: 0 }))
    return (t, dt) => {
      g.sbiadisci(0.07)
      const a = (t * 1.1) % TAU
      for (let i = 1; i <= 3; i++) for (let q = 0; q < TAU; q += 0.12) g.p(cx + Math.cos(q) * rm * (i / 3), cy + Math.sin(q) * rm * (i / 3), c('verde', 0.05))
      for (let r = 0; r < rm; r++) g.p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c('verde', 0.5))
      for (const o of eco) {
        const d = (a - o.a + TAU) % TAU
        if (d < 0.08) o.e = 1
        if (o.e > 0.05) { g.r(cx + Math.cos(o.a) * o.r - 1, cy + Math.sin(o.a) * o.r - 1, 2, 2, c('lime', o.e)); o.e *= Math.pow(0.35, dt) }
      }
    }
  } },

  // le frequenze del podcast
  { id: 'frequenze', it: 'Frequenze', en: 'Frequencies', avvia(g) {
    const n = Math.ceil(g.w / 4), picco = new Float32Array(n), S = sfuma('lime', 'rosa')
    return (t, dt) => {
      g.pulisci()
      for (let i = 0; i < n; i++) {
        const v = 0.06 + 0.42 * Math.abs(Math.sin(i * 0.4 + t * 2.1) * Math.sin(i * 0.13 - t * 1.3)) + 0.12 * Math.abs(Math.sin(i * 1.7 + t * 5))
        const alt = v * g.h
        picco[i] = Math.max(alt, picco[i] - dt * g.h * 0.22)
        for (let y = 0; y < alt; y += 2) {
          const m = Math.min(1, y / (g.h * 0.6))
          g.r(i * 4, g.h - 1 - y, 3, 1, `rgba(${(S[0] + S[3] * m) | 0},${(S[1] + S[4] * m) | 0},${(S[2] + S[5] * m) | 0},0.34)`)
        }
        g.r(i * 4, g.h - 1 - picco[i], 3, 1, c('bianco', 0.5))
      }
    }
  } },

  // il gioco della vita, che si risemina quando si spegne
  { id: 'vita', it: 'Vita', en: 'Life', avvia(g) {
    const W = g.w >> 1, H = g.h >> 1
    let ora = new Uint8Array(W * H), poi = new Uint8Array(W * H), eta = 0, conto = 0
    const semina = () => { for (let i = 0; i < ora.length; i++) ora[i] = R() < 0.22 ? 1 : 0; eta = 0 }
    semina()
    return (t, dt) => {
      conto += dt
      if (conto >= 0.16) {
        conto = 0
        let vivi = 0
        for (let y = 0; y < H; y++) {
          const su = ((y - 1 + H) % H) * W, qui = y * W, giu = ((y + 1) % H) * W
          for (let x = 0; x < W; x++) {
            const s = (x - 1 + W) % W, d = (x + 1) % W
            const n = (ora[su + s] & 1) + (ora[su + x] & 1) + (ora[su + d] & 1) + (ora[qui + s] & 1) + (ora[qui + d] & 1) + (ora[giu + s] & 1) + (ora[giu + x] & 1) + (ora[giu + d] & 1)
            const vivo = ora[qui + x] & 1
            const v = vivo ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 3 : 0
            poi[qui + x] = v
            if (v) vivi++
          }
        }
        ;[ora, poi] = [poi, ora]
        if (++eta > 260 || vivi < ora.length * 0.025) semina()
      }
      g.pulisci()
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = ora[y * W + x]
        if (v) g.r(x * 2, y * 2, 2, 2, v === 3 ? c('lime', 0.5) : c('viola', 0.42))
      }
    }
  } },

  { id: 'serpente', it: 'Serpente', en: 'Snake', avvia(g) {
    const W = g.w >> 1, H = g.h >> 1, DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]
    const mela = () => ({ x: (R() * W) | 0, y: (R() * H) | 0 })
    const s = ['lime', 'cielo', 'giallo', 'verde'].map((col) => ({ col, d: (R() * 4) | 0, corpo: [{ x: (R() * W) | 0, y: (R() * H) | 0 }], lungo: 14, mela: mela() }))
    let conto = 0
    return (t, dt) => {
      conto += dt
      while (conto >= 0.07) {
        conto -= 0.07
        for (const o of s) {
          const testa = o.corpo[0], dx = o.mela.x - testa.x, dy = o.mela.y - testa.y
          if (R() < 0.3) {
            const voglio = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3
            if ((voglio + 2) % 4 !== o.d) o.d = voglio
          }
          const n = { x: (testa.x + DX[o.d] + W) % W, y: (testa.y + DY[o.d] + H) % H }
          o.corpo.unshift(n)
          if (n.x === o.mela.x && n.y === o.mela.y) { o.lungo = o.lungo > 44 ? 14 : o.lungo + 5; o.mela = mela() }
          while (o.corpo.length > o.lungo) o.corpo.pop()
        }
      }
      g.pulisci()
      for (const o of s) {
        o.corpo.forEach((p, i) => g.r(p.x * 2, p.y * 2, 2, 2, c(o.col, 0.6 * (1 - i / o.lungo) + 0.08)))
        g.r(o.mela.x * 2, o.mela.y * 2, 2, 2, c('rosa', 0.45 + 0.3 * Math.sin(t * 5)))
      }
    }
  } },

  { id: 'citta', it: 'Città', en: 'City', avvia(g) {
    const palazzi = []
    for (let x = -2; x < g.w;) {
      const w = 7 + ((R() * 9) | 0), h = (g.h * tra(0.18, 0.62)) | 0, finestre = []
      for (let fy = g.h - h + 2; fy < g.h - 1; fy += 3) for (let fx = x + 1; fx < x + w - 1; fx += 2) finestre.push({ x: fx, y: fy, on: R() < 0.35 })
      palazzi.push({ x, w, h, finestre })
      x += w + 1
    }
    const stelle = Array.from({ length: (g.w / 4) | 0 }, () => ({ x: R() * g.w, y: R() * g.h * 0.5, f: R() * TAU }))
    const nuvole = Array.from({ length: 5 }, () => ({ x: R() * g.w, y: g.h * tra(0.06, 0.34), w: tra(10, 26), v: tra(0.8, 2) }))
    let cometa = null
    return (t, dt) => {
      g.pulisci()
      const lx = g.w * 0.86, ly = g.h * 0.2
      for (let dy = -4; dy <= 4; dy++) { const span = Math.round(Math.sqrt(16 - dy * dy)); g.r(lx - span, ly + dy, span * 2, 1, g.chiaro ? c('giallo', 0.6) : c('bianco', 0.3)) }
      if (g.chiaro) {
        for (const n of nuvole) {
          n.x += n.v * dt
          if (n.x > g.w + 4) n.x = -n.w - 4
          g.r(n.x, n.y, n.w, 2, c('cielo', 0.2))
          g.r(n.x + n.w * 0.2, n.y - 1, n.w * 0.5, 1, c('cielo', 0.2))
        }
      } else for (const s of stelle) g.p(s.x, s.y, c('bianco', 0.14 + 0.1 * Math.sin(t * 1.5 + s.f)))
      if (!g.chiaro && !cometa && R() < dt * 0.25) cometa = { x: R() * g.w * 0.8, y: R() * g.h * 0.2, e: 0 }
      if (cometa) {
        cometa.e += dt; cometa.x += dt * 60; cometa.y += dt * 22
        for (let i = 0; i < 6; i++) g.p(cometa.x - i * 1.5, cometa.y - i * 0.55, c('bianco', 0.6 - i * 0.1))
        if (cometa.e > 0.8) cometa = null
      }
      for (const b of palazzi) {
        g.r(b.x, g.h - b.h, b.w, b.h, c('viola', 0.2))
        g.r(b.x, g.h - b.h, b.w, 1, c('viola', 0.45))
        if (R() < dt * 1.2 && b.finestre.length) { const f = b.finestre[(R() * b.finestre.length) | 0]; f.on = !f.on }
        for (const f of b.finestre) if (f.on) g.p(f.x, f.y, c(g.chiaro ? 'cielo' : 'giallo', 0.55))
      }
    }
  } },

  { id: 'tramonto', it: 'Tramonto', en: 'Sunset', giorno: { it: 'Alba', en: 'Sunrise' }, avvia(g) {
    const im = g.campo(), d = im.data, S = sfuma('giallo', 'rosa'), luce = g.chiaro ? 150 : 120
    const cx = g.w * 0.7, raggio = Math.min(g.w * 0.3, g.h * 0.42), orizzonte = (g.h * 0.68) | 0
    return (t) => {
      d.fill(0)
      const cy = orizzonte - raggio * 0.35 + Math.sin(t * 0.2) * 2
      for (let y = Math.max(0, (cy - raggio) | 0); y < orizzonte; y++) {
        const u = (y - (cy - raggio)) / (raggio * 2)
        if (u > 0.45 && (y + t * 2.5) % 6 < 1 + u * 3) continue
        const mezzo = Math.sqrt(Math.max(0, raggio * raggio - (y - cy) * (y - cy)))
        for (let x = Math.max(0, (cx - mezzo) | 0); x < Math.min(g.w, cx + mezzo); x++) {
          const k = (y * g.w + x) * 4
          d[k] = S[0] + S[3] * u; d[k + 1] = S[1] + S[4] * u; d[k + 2] = S[2] + S[5] * u; d[k + 3] = luce
        }
      }
      g.ctx.putImageData(im, 0, 0)
      g.r(0, orizzonte, g.w, 1, c('rosa', 0.5))
      for (let i = 1; i < 9; i++) {
        const y = orizzonte + i * i * 0.55 + 1, mezzo = raggio * (1 - i / 11) * (0.7 + 0.3 * Math.sin(t * 1.4 + i * 1.9))
        if (y < g.h) g.r(cx - mezzo, y, mezzo * 2, 1, c('giallo', 0.3 - i * 0.025))
      }
    }
  } },
]

// l'ordine del giorno: un rimescolamento con seme, uguale per tutti in quel giorno
function ordine(d) {
  let s = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) >>> 0
  const caso = () => { s = (s + 0x6d2b79f5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
  const a = TEMI.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(caso() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
export const temaDellOra = (d = new Date()) => TEMI[ordine(d)[d.getHours() % TEMI.length]]

// Accende lo sfondo dentro un contenitore. quandoCambia(tema, { ora, aCaso })
// viene chiamata a ogni cambio; «tema» fissa un tema per le prove.
export function accendi(dentro, { quandoCambia, tema: fisso } = {}) {
  const canvas = document.createElement('canvas')
  canvas.className = 'igc__bg'
  canvas.setAttribute('aria-hidden', 'true')
  const g = tela(canvas)
  const fermo = matchMedia('(prefers-reduced-motion: reduce)')
  let casa = dentro
  let tema = TEMI.find((x) => x.id === fisso) || temaDellOra()
  let ora = new Date().getHours()
  let aCaso = false
  let fotogramma = null
  let t = 0, ultimo = 0, raf = 0, visibile = false, spento = false, cambio = 0

  const avvisa = () => { try { quandoCambia?.(tema, { ora, aCaso }) } catch {} }
  const eChiaro = () => document.documentElement.dataset.theme !== 'dark'

  function prepara() {
    const w = Math.max(8, Math.ceil(casa.clientWidth / CELLA)), h = Math.max(8, Math.ceil(casa.clientHeight / CELLA))
    if (canvas.width !== w || canvas.height !== h || !fotogramma) {
      canvas.width = w
      canvas.height = h
      tavolozza((g.chiaro = eChiaro()))
      fotogramma = tema.avvia(g)
      // qualche passo a vuoto: la scena parte già piena, e a movimento
      // ridotto questo è il fotogramma che resta
      for (let i = 0; i < 40; i++) { t += 0.05; fotogramma(t, 0.05) }
    }
  }

  function giro(adesso) {
    raf = 0
    if (spento || !visibile || fermo.matches) return
    raf = requestAnimationFrame(giro)
    if (adesso - ultimo < 1000 / FPS - 2) return
    const dt = Math.min(0.1, (adesso - ultimo) / 1000 || 0.05)
    ultimo = adesso
    t += dt
    fotogramma?.(t, dt)
  }
  const parti = () => { if (!raf && !spento && visibile && !fermo.matches) { ultimo = performance.now(); raf = requestAnimationFrame(giro) } }

  function metti(nuovo, opzioni = {}) {
    if (!nuovo) return
    aCaso = !!opzioni.aCaso
    clearTimeout(cambio)
    const scambia = () => { tema = nuovo; fotogramma = null; g.pulisci(); prepara(); canvas.style.opacity = ''; avvisa(); parti() }
    if (fermo.matches || nuovo === tema) return scambia()
    canvas.style.opacity = '0'
    cambio = setTimeout(scambia, 260)
  }

  const occhio = new IntersectionObserver((v) => { visibile = v.at(-1).isIntersecting; parti() })
  const misura = new ResizeObserver(() => { const f = fotogramma; prepara(); if (f !== fotogramma) parti() })
  // il cambio dell'ora: basta un'occhiata ogni mezzo minuto
  let orfano = 0
  const orologio = setInterval(() => {
    // la bacheca è stata ridisegnata e questa tela non serve più: si spegne da sola
    if (!canvas.isConnected) { if (++orfano > 1) spegni(); return }
    orfano = 0
    const h = new Date().getHours()
    if (h !== ora) { ora = h; if (!fisso) metti(temaDellOra()) }
  }, 30_000)
  const suFermo = () => { prepara(); parti() }
  fermo.addEventListener?.('change', suFermo)
  // il sito passa da chiaro a scuro: stessa scena, altra tavolozza
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
      casa.appendChild(canvas)
      misura.observe(casa)
    }
    prepara()
    parti()
  }

  casa.appendChild(canvas)
  occhio.observe(canvas)
  misura.observe(casa)
  prepara()
  avvisa()

  return {
    sposta,
    get tema() { return tema },
    get stato() { return { ora, aCaso, chiaro: g.chiaro } },
    nome(lang) { const n = g.chiaro && tema.giorno ? tema.giorno : tema; return n[lang] || n.en },
    aCaso() {
      let n
      do { n = TEMI[(R() * TEMI.length) | 0] } while (n === tema)
      metti(n, { aCaso: true })
    },
    spegni,
  }
}
