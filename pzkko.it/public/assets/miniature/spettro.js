// miniature/spettro.js — lo Spettro che ascolta da solo, in silenzio (nessun microfono: il suono è calcolato qui).
// Com'è l'app vera (games/spettro): il monitor nero nella cornice di carta col nastro, le barre logaritmiche da 40 Hz a
// 16 kHz col verde che sale al lime e al giallo chiaro, i picchi bianchi che restano e ricadono, la griglia a 100,
// 300, 1k, 3k, 10k, la forma d'onda sotto, la lettura «do4 · 262 Hz · +3 cent», il livello in dB, la riga tratteggiata
// sulla nota, e il foglietto dell'«accordo probabile» con la croma a dodici colonne (rosse quando ci sono).
// Il suono finto: quattro accordi con le loro armoniche, la cassa e il charleston; dietro le barre scorre lo
// spettrogramma (gli spettri di prima, in fila). Il «wow»: un fischio che sale fino a 3 kHz e poi un battito di mani
// che manda tutte le barre in cima, coi picchi che ricadono piano. Col mouse sopra: più barre, lo spettrogramma si
// inclina e si allunga, il monitor si accende.

const LIME = '#ccff00'
const MONITOR = '#0d100c'
const FOGLIETTO = '#fffdf6'
const INK = '#161616'
const ROSSO = '#b3121f'
const NOMI = ['do', 'do#', 're', 're#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']
const F0 = 40, F1 = 16000
const LOGR = Math.log(F1 / F0)
const freqMidi = (n) => 440 * 2 ** ((n - 69) / 12)
const nomeNota = (n) => `${NOMI[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`
const hz = (f) => (f >= 1000 ? `${(f / 1000).toFixed(2)} kHz` : `${Math.round(f)} Hz`)
const ACCORDI = [
  { nome: 'do maggiore', note: [48, 52, 55, 60, 64] },
  { nome: 'la minore', note: [45, 52, 57, 60, 64] },
  { nome: 'fa maggiore', note: [41, 53, 57, 60, 65] },
  { nome: 'sol settima', note: [43, 55, 59, 62, 65] },
]
const LOG440 = Math.log2(440)
const LOGH = [0, 1, 2, 3, 4, 5, 6, 7].map((h) => Math.log2(h || 1))
const DUR = 2.1
const FISCHIO = 1.4, MANI = 1.2
const GIRO = ACCORDI.length * DUR + FISCHIO + MANI

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU, rumore } = kit
  await Promise.all([kit.font('8Bit'), kit.font('Anton'), kit.font('Special Elite'), kit.font('Permanent Marker')])

  const MAXC = 220
  const barre = new Float32Array(MAXC), picchi = new Float32Array(MAXC)
  const storia = [] // lo spettrogramma: gli spettri di prima
  let accStoria = 0
  let L = null, W = 0, H = 0, D = 0

  function geometria(w, h) {
    const u = w / 100
    const sc = { x: 4.2 * u, y: 20.2 * u, w: 64.6 * u, h: h - 3.6 * u - 20.2 * u }
    sc.fondo = sc.y + sc.h * 0.78
    const fo = { x: 72.6 * u, y: 4.4 * u, w: 23.6 * u, h: h - 4.4 * u - 4.2 * u }
    return { u, w, h, sc, fo }
  }
  const xF = (G, f) => G.sc.x + (Math.log(f / F0) / LOGR) * G.sc.w

  // ── il suono, in ogni momento: che accordo, il fischio, le mani ──
  function scena(s) {
    const c = s - Math.floor(s / GIRO) * GIRO
    const battito = (s * 2.1) % 1 // la cassa, circa 126 bpm
    if (c < ACCORDI.length * DUR) {
      const i = Math.floor(c / DUR)
      return { acc: ACCORDI[i], k: (c - i * DUR) / DUR, battito, fischio: 0, mani: -1 }
    }
    if (c < ACCORDI.length * DUR + FISCHIO) {
      const k = (c - ACCORDI.length * DUR) / FISCHIO
      return { acc: ACCORDI[3], k: 1, battito, fischio: k, mani: -1, ff: 300 * (3000 / 300) ** ease.inOut(k) }
    }
    const k = (c - ACCORDI.length * DUR - FISCHIO) / MANI
    return { acc: ACCORDI[0], k: 0, battito, fischio: 0, mani: k }
  }
  // l'ampiezza (0→1) alla frequenza f: armoniche degli accordi, cassa, charleston, fischio, mani, fruscio
  function spettro(f, S, t) {
    const lf = Math.log2(f)
    let v = 0
    const attacco = S.k < 0.06 ? S.k / 0.06 : 1
    for (const n of S.acc.note) {
      const ln = (n - 69) / 12 + LOG440
      for (let h = 1; h <= 7; h++) {
        const d = (lf - ln - LOGH[h]) / 0.055
        if (d > 4 || d < -4) continue
        v = Math.max(v, (0.95 / h ** 0.55) * Math.exp(-d * d) * attacco * (0.88 + 0.12 * Math.sin(t * 3 + n + h)))
      }
    }
    // la cassa sotto i 120 Hz e il charleston in alto, a tempo
    const cassa = Math.exp(-S.battito * 7)
    if (f < 160) v = Math.max(v, cassa * 0.95 * Math.exp(-(((lf - Math.log2(58)) / 0.5) ** 2)))
    const hat = Math.exp(-(((S.battito + 0.5) % 1)) * 14)
    if (f > 5000) v = Math.max(v, hat * 0.55 * (0.7 + 0.3 * rumore(f * 0.004 + t * 9, 3)) * Math.exp(-(((lf - Math.log2(9000)) / 0.9) ** 2)))
    // il fischio: un picco stretto che sale
    if (S.fischio > 0) {
      const d = (lf - Math.log2(S.ff)) / 0.02
      v = Math.max(v * 0.6, 0.98 * Math.exp(-d * d) + 0.4 * Math.exp(-(((lf - Math.log2(S.ff * 2)) / 0.02) ** 2)))
    }
    // le mani: rumore largo che riempie tutto
    if (S.mani >= 0) {
      const e = Math.exp(-S.mani * 4.5)
      v = Math.max(v, e * (0.72 + 0.26 * rumore(f * 0.01 + t * 20, 7)) * smooth(30, 200, f))
    }
    // il corpo del suono (tutto quello che non è una nota) e il fruscio della stanza
    const corpo = Math.exp(-(((lf - Math.log2(320)) / 2.1) ** 2)) * (S.fischio > 0 ? 0.5 : 1)
    v = Math.max(v, corpo * (0.2 + 0.22 * rumore(lf * 9 + t * 3.1, 1)) * (0.75 + 0.25 * Math.exp(-S.battito * 4)))
    v = Math.max(v, 0.06 + 0.05 * rumore(lf * 6 + t * 2.5, 6) - (f > 8000 ? 0.03 : 0))
    return clamp(v)
  }

  function costruisci() {
    W = m.w; H = m.h; D = m.dpr
    const G = geometria(W, H)
    const u = G.u
    const s = G.sc
    const fondo = kit.strato(W, H, D, (g) => {
      g.fillStyle = m.c2
      g.fillRect(0, 0, W, H)
      const r = g.createRadialGradient(W * 0.1, 0, 0, W * 0.1, 0, W * 0.75)
      r.addColorStop(0, 'rgba(204,255,0,.18)'); r.addColorStop(1, 'rgba(204,255,0,0)')
      g.fillStyle = r
      g.fillRect(0, 0, W, H)
      // le barre della copertina di prima, appena accennate
      g.fillStyle = 'rgba(204,255,0,.035)'
      for (let x = 2 * u; x < W; x += 9 * u) g.fillRect(x, H * 0.6, 4 * u, H * 0.4)
      // la cornice del monitor
      const b = Math.max(2, 1.25 * u)
      g.save()
      g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 3.2 * u; g.shadowOffsetY = 1.3 * u
      g.fillStyle = FOGLIETTO
      g.fillRect(s.x - b, s.y - b, s.w + 2 * b, s.h + 2.3 * b)
      g.restore()
      g.fillStyle = MONITOR
      g.fillRect(s.x, s.y, s.w, s.h)
      // la griglia: le frequenze, poi la scala dei dB a destra
      g.strokeStyle = 'rgba(204,255,0,.10)'
      g.lineWidth = Math.max(0.6, 0.16 * u)
      g.font = `400 ${Math.max(5, 1.6 * u)}px "Special Elite"`
      g.textBaseline = 'alphabetic'
      for (const f of [100, 300, 1000, 3000, 10000]) {
        const x = xF(G, f)
        g.beginPath(); g.moveTo(x, s.y); g.lineTo(x, s.fondo); g.stroke()
        g.fillStyle = 'rgba(204,255,0,.35)'
        g.fillText(f >= 1000 ? `${f / 1000}k` : String(f), x + 0.6 * u, s.fondo - 0.8 * u)
      }
      for (let i = 1; i < 4; i++) {
        const y = s.y + ((s.fondo - s.y) * i) / 4
        g.setLineDash([0.6 * u, 1.2 * u])
        g.beginPath(); g.moveTo(s.x, y); g.lineTo(s.x + s.w, y); g.stroke()
        g.setLineDash([])
      }
      g.fillStyle = 'rgba(204,255,0,.04)'
      g.fillRect(s.x, s.fondo + 2, s.w, s.y + s.h - s.fondo - 2)
      kit.nastro(g, s.x + 1 * u, s.y - 0.6 * u, 11 * u, 3.3 * u, -0.66)
      kit.nastro(g, s.x + s.w - 1 * u, s.y - 0.6 * u, 11 * u, 3.3 * u, 0.66)
    })
    const vetro = kit.strato(W, H, D, (g) => {
      const v = g.createRadialGradient(s.x + s.w / 2, s.y + s.h / 2, s.h * 0.3, s.x + s.w / 2, s.y + s.h / 2, s.w * 0.68)
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)')
      g.fillStyle = v
      g.fillRect(s.x, s.y, s.w, s.h)
      const r = g.createLinearGradient(s.x, s.y, s.x + s.w * 0.6, s.y + s.h)
      r.addColorStop(0, 'rgba(255,255,255,.06)'); r.addColorStop(0.3, 'rgba(255,255,255,0)')
      g.fillStyle = r
      g.fillRect(s.x, s.y, s.w, s.h)
      g.fillStyle = 'rgba(0,0,0,.15)'
      for (let y = s.y; y < s.y + s.h; y += Math.max(2, 0.7 * u)) g.fillRect(s.x, y, s.w, Math.max(0.5, 0.25 * u))
    })
    // il foglietto dell'accordo: carta, nastro, il titolo a pennarello evidenziato, i nomi della croma
    const foglio = kit.strato(W, H, D, (g) => {
      const f = G.fo
      g.save()
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 2.6 * u; g.shadowOffsetY = 1.1 * u
      g.fillStyle = FOGLIETTO
      g.fillRect(f.x, f.y, f.w, f.h)
      g.restore()
      const r = g.createLinearGradient(f.x, f.y, f.x + f.w, f.y + f.h)
      r.addColorStop(0, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(90,70,30,.09)')
      g.fillStyle = r
      g.fillRect(f.x, f.y, f.w, f.h)
      const ts = Math.max(5, 2.25 * u)
      g.font = `400 ${ts}px "Permanent Marker"`
      const testo = W > 260 ? 'accordo probabile' : 'accordo'
      const tw = Math.min(f.w - 2.4 * u, g.measureText(testo).width)
      kit.evidenzia(g, f.x + 1.2 * u, f.y + 1.6 * u, tw + 1 * u, ts * 1.05)
      g.fillStyle = INK
      g.textBaseline = 'alphabetic'
      g.fillText(testo, f.x + 1.7 * u, f.y + 1.6 * u + ts * 0.86, f.w - 2.4 * u)
      // i nomi sotto le colonne della croma
      if (W > 220) {
        const cw = (f.w - 2.4 * u) / 12
        g.font = `400 ${Math.max(4, 1.15 * u)}px "Special Elite"`
        g.textAlign = 'center'
        g.fillStyle = '#5a544c'
        for (let i = 0; i < 12; i++) if (!NOMI[i].includes('#')) g.fillText(NOMI[i], f.x + 1.2 * u + (i + 0.5) * cw, f.y + f.h - 1.4 * u)
        g.textAlign = 'left'
      }
      // la nota a macchina, in fondo
      kit.nastro(g, f.x + f.w * 0.5, f.y - 0.2 * u, 9 * u, 2.6 * u, -0.05)
    })
    // il titolo: 8Bit lime, col bagliore a parte
    const titolo = m.titolo || 'Spettro'
    let ts = 11.5 * u
    kit.strato(4, 4, 1, (g) => { g.font = `400 ${ts}px "8Bit"`; ts *= Math.min(1, (52 * u) / g.measureText(titolo).width) })
    const ty = 4.8 * u + ts * 0.86
    const scrittaT = kit.strato(W, H, D, (g) => {
      g.font = `400 ${ts}px "8Bit"`
      g.textBaseline = 'alphabetic'
      g.fillStyle = 'rgba(0,0,0,.6)'
      g.fillText(titolo, 5 * u + 0.6 * u, ty + 0.6 * u)
      g.fillStyle = LIME
      g.fillText(titolo, 5 * u, ty)
    })
    const alone = kit.strato(W, H, D, (g) => {
      g.font = `400 ${ts}px "8Bit"`
      g.shadowColor = 'rgba(204,255,0,.95)'
      g.shadowBlur = 3.4 * u * D
      g.fillStyle = 'rgba(204,255,0,.5)'
      g.fillText(titolo, 5 * u, ty)
    })
    const vign = kit.strato(W, H, D, (g) => kit.vignetta(g, W, H, 0.42))
    L = { G, fondo, vetro, foglio, scrittaT, alone, vign }
  }

  // il colore della barra: verde scuro in basso, lime, giallo chiaro in cima (come il gradiente dell'app)
  const tinta = (k) => k < 0.6 ? `rgba(${Math.round(90 + 114 * (k / 0.6))},${Math.round(122 + 133 * (k / 0.6))},0,.9)` : `rgba(${Math.round(204 + 51 * ((k - 0.6) / 0.4))},255,${Math.round(190 * ((k - 0.6) / 0.4))},.95)`

  return {
    titolo: false,
    fermo: 2.6,
    frame(t, dt) {
      if (!L || W !== m.w || H !== m.h || D !== m.dpr) costruisci()
      const g = m.g
      const { G } = L
      const u = G.u
      const s = G.sc
      const su = m.su
      const S = scena(t)
      const lampo = S.mani >= 0 ? Math.exp(-S.mani * 3) : 0
      const colonne = Math.min(MAXC, Math.max(36, Math.round(s.w / (u * (1.15 - su * 0.35)))))
      const alto = s.fondo - s.y - 6.5 * u

      // le barre: sale svelto, scende piano (lo smoothing dell'analizzatore), i picchi restano e ricadono
      let energia = 0
      const cad = Math.exp(-dt * 9)
      for (let c = 0; c < colonne; c++) {
        const f = F0 * (F1 / F0) ** ((c + 0.5) / colonne)
        const v = spettro(f, S, t) ** 0.98
        const b0 = barre[c]
        barre[c] = v > b0 ? lerp(b0, v, 0.6) : lerp(v, b0, cad)
        if (barre[c] > picchi[c]) picchi[c] = barre[c]
        else picchi[c] = Math.max(0, picchi[c] - dt * (lampo > 0.05 ? 0.12 : 0.32))
        energia += barre[c] * barre[c]
      }
      // lo spettrogramma: ogni 70 ms si mette da parte lo spettro
      accStoria += dt
      if (accStoria > 0.07) {
        accStoria = 0
        const copia = new Float32Array(48)
        for (let i = 0; i < 48; i++) copia[i] = barre[Math.floor((i / 48) * colonne)]
        storia.unshift(copia)
        if (storia.length > 22) storia.pop()
      }

      g.drawImage(L.fondo, 0, 0, W, H)
      g.save()
      g.globalAlpha = clamp(0.3 + energia / colonne * 1.2 + su * 0.25 + lampo * 0.5)
      g.drawImage(L.alone, 0, 0, W, H)
      g.restore()
      g.drawImage(L.scrittaT, 0, 0, W, H)

      // ── il monitor ──
      g.save()
      g.beginPath(); g.rect(s.x, s.y, s.w, s.h); g.clip()
      if (lampo > 0.01 || su > 0.01) {
        g.fillStyle = `rgba(204,255,0,${0.12 * lampo + 0.035 * su})`
        g.fillRect(s.x, s.y, s.w, s.h)
      }
      // lo spettrogramma che scorre dietro: gli spettri di prima, in fila verso l'alto e a destra
      // (dal fondo in avanti: ogni spettro copre quello dietro, come uno spettrogramma a cascata)
      const quanti = Math.min(storia.length, 9 + Math.round(su * 9))
      const passoY = (0.8 + su * 0.5) * u, passoX = (0.55 + su * 0.5) * u
      for (let j = quanti - 1; j >= 1; j--) {
        const sp = storia[j]
        const a = (1 - j / (quanti + 1)) * (0.34 + su * 0.12)
        const y0 = s.fondo - j * passoY
        g.beginPath()
        g.moveTo(s.x + j * passoX, y0)
        for (let i = 0; i < 48; i++) {
          const x = s.x + ((i + 0.5) / 48) * s.w + j * passoX
          g.lineTo(x, y0 - sp[i] * alto * (1 - j * 0.025))
        }
        g.lineTo(s.x + s.w + j * passoX, y0)
        g.closePath()
        g.fillStyle = 'rgba(13,16,12,.82)'
        g.fill()
        g.beginPath()
        for (let i = 0; i < 48; i++) {
          const x = s.x + ((i + 0.5) / 48) * s.w + j * passoX
          const y = y0 - sp[i] * alto * (1 - j * 0.025)
          i ? g.lineTo(x, y) : g.moveTo(x, y)
        }
        g.strokeStyle = `rgba(204,255,0,${a})`
        g.lineWidth = Math.max(0.6, 0.2 * u)
        g.stroke()
      }
      // le barre
      const lw = Math.max(1, s.w / colonne - Math.max(0.6, 0.25 * u))
      for (let c = 0; c < colonne; c++) {
        const k = barre[c]
        const x = s.x + (c / colonne) * s.w
        const h = k * alto
        if (h > 0.5) {
          // tre pezzi di colore invece di un gradiente per barra (più leggero)
          const h1 = Math.min(h, alto * 0.45), h2 = Math.min(h, alto * 0.8)
          g.fillStyle = 'rgba(90,122,0,.88)'
          g.fillRect(x, s.fondo - h1, lw, h1)
          if (h > h1) { g.fillStyle = 'rgba(204,255,0,.9)'; g.fillRect(x, s.fondo - h2, lw, h2 - h1) }
          if (h > h2) { g.fillStyle = 'rgba(255,255,190,.95)'; g.fillRect(x, s.fondo - h, lw, h - h2) }
        }
        g.fillStyle = 'rgba(255,255,255,.6)'
        g.fillRect(x, s.fondo - picchi[c] * alto - Math.max(1, 0.3 * u), lw, Math.max(1, 0.32 * u))
      }
      // la nota letta: il picco più forte fra 70 e 1800 Hz (la fondamentale più bassa dell'accordo, o il fischio)
      let fNota
      if (S.fischio > 0) fNota = S.ff
      else fNota = freqMidi(S.acc.note[0] + 12)
      const midi = Math.round(69 + 12 * Math.log2(fNota / 440))
      const cents = S.fischio > 0 ? Math.round((69 + 12 * Math.log2(fNota / 440) - midi) * 100) : Math.round((rumore(t * 1.3, 5) - 0.5) * 12)
      const xn = xF(G, fNota)
      g.strokeStyle = 'rgba(255,255,255,.7)'
      g.lineWidth = Math.max(0.6, 0.18 * u)
      g.setLineDash([0.6 * u, 0.8 * u])
      g.beginPath(); g.moveTo(xn, s.y); g.lineTo(xn, s.fondo); g.stroke()
      g.setLineDash([])
      // la forma d'onda sotto
      const cy = s.fondo + (s.y + s.h - s.fondo) / 2 + 0.5 * u
      const wa = (s.y + s.h - s.fondo - 2.5 * u) * 0.46
      const liv = Math.sqrt(energia / colonne)
      g.strokeStyle = 'rgba(204,255,0,.8)'
      g.lineWidth = Math.max(0.8, 0.28 * u)
      g.beginPath()
      const n = 90
      for (let i = 0; i <= n; i++) {
        const k = i / n
        let v = 0
        if (S.mani >= 0) v = (rumore(k * 60 + t * 40, 2) - 0.5) * 2 * Math.exp(-S.mani * 3)
        else if (S.fischio > 0) v = Math.sin(k * TAU * 3 * (S.ff / 300) ** 0.5 + t * 30)
        else for (const nn of S.acc.note.slice(0, 3)) v += Math.sin(k * TAU * 2.2 * freqMidi(nn) / freqMidi(S.acc.note[0]) + t * 5) / 2.2
        const y = cy - v * wa * clamp(liv * 2.2 + 0.15)
        i ? g.lineTo(s.x + k * s.w, y) : g.moveTo(s.x + k * s.w, y)
      }
      g.stroke()
      g.drawImage(L.vetro, 0, 0, W, H)

      // la lettura in alto a sinistra (sul vetro, con un po' di fondo per leggerla sopra le barre)
      const ns = Math.max(9, 6.2 * u)
      const testo = nomeNota(midi)
      g.font = `400 ${ns}px "Anton"`
      const nw = g.measureText(testo).width
      g.fillStyle = 'rgba(13,16,12,.72)'
      g.fillRect(s.x, s.y, nw + (W > 220 ? 21 : 4) * u, ns * 1.18)
      g.textBaseline = 'alphabetic'
      g.fillStyle = 'rgba(204,255,0,.2)'
      g.fillText(testo, s.x + 1.6 * u, s.y + ns * 1.02 + 0.4 * u)
      g.fillStyle = lampo > 0.3 ? '#f4ffd0' : LIME
      g.fillText(testo, s.x + 1.6 * u, s.y + ns * 1.02)
      if (W > 220) {
        g.font = `400 ${Math.max(5, 1.9 * u)}px "Special Elite"`
        g.fillStyle = '#9fb35e'
        g.fillText(hz(fNota), s.x + 2.8 * u + nw, s.y + ns * 0.62)
        g.fillText(`${cents > 0 ? '+' : ''}${cents} cent`, s.x + 2.8 * u + nw, s.y + ns * 1.0)
      }
      // il livello in dB, in alto a destra
      const dbv = clamp(20 * Math.log10(Math.max(1e-4, liv * 0.9)), -60, 0)
      const lx = s.x + s.w - 14 * u, ly = s.y + 1.6 * u
      if (W > 220) {
        g.font = `400 ${Math.max(5, 1.7 * u)}px "Special Elite"`
        g.fillStyle = LIME
        g.textAlign = 'right'
        g.fillText(`${dbv.toFixed(1)} dB`, s.x + s.w - 1.4 * u, ly + 1.2 * u)
        g.textAlign = 'left'
      }
      g.fillStyle = 'rgba(204,255,0,.16)'
      g.fillRect(lx, ly + 2.2 * u, 12.6 * u, 0.9 * u)
      g.fillStyle = LIME
      g.fillRect(lx, ly + 2.2 * u, 12.6 * u * clamp((dbv + 60) / 60), 0.9 * u)
      g.restore()

      // ── il foglietto dell'accordo: il nome a macchina che cambia, la croma rossa ──
      const fo = G.fo
      kit.con(g, fo.x + fo.w / 2, fo.y + fo.h / 2, 0.025 - su * 0.015, 1, () => {
        g.translate(-(fo.x + fo.w / 2), -(fo.y + fo.h / 2))
        g.drawImage(L.foglio, 0, 0, W, H)
        const nome = S.fischio > 0 || (S.mani >= 0 && S.mani < 0.5) ? '—' : S.acc.nome
        const [radice, tipo] = nome.split(' ')
        const scrivi = S.mani >= 0 || S.fischio > 0 ? 1 : clamp(S.k / 0.18)
        const as = Math.max(8, 6.4 * u)
        g.font = `400 ${as}px "Anton"`
        g.fillStyle = INK
        g.textBaseline = 'alphabetic'
        const vis = (str, k) => str.slice(0, Math.ceil(str.length * k))
        g.fillText(vis(radice, clamp(scrivi * 2)), fo.x + 1.7 * u, fo.y + 6.4 * u + as * 0.86, fo.w - 3 * u)
        if (tipo) {
          g.font = `400 ${Math.max(6, 3 * u)}px "Anton"`
          g.fillStyle = '#36312b'
          g.fillText(vis(tipo, clamp(scrivi * 2 - 1)), fo.x + 1.7 * u, fo.y + 6.4 * u + as * 0.86 + 3.9 * u, fo.w - 3 * u)
        }
        // la croma: dodici colonne, alte quanto pesa la nota; rosse le note dell'accordo
        const croma = new Float32Array(12)
        if (S.fischio > 0) croma[((midi % 12) + 12) % 12] = 1
        else if (S.mani >= 0) for (let i = 0; i < 12; i++) croma[i] = 0.3 + 0.4 * rumore(i * 3.3 + t * 6, 9)
        else {
          for (const nn of S.acc.note) {
            croma[(nn + 7) % 12] += 0.12 // la terza armonica (la quinta)
            croma[(nn + 4) % 12] += 0.06 // la quinta armonica (la terza)
          }
          for (const nn of S.acc.note) croma[nn % 12] = Math.max(croma[nn % 12], 0.9 + (nn === S.acc.note[0] ? 0.1 : 0))
          const mx = Math.max(...croma)
          for (let i = 0; i < 12; i++) croma[i] = croma[i] / mx * (0.85 + 0.15 * rumore(t * 4 + i, 4))
        }
        const cw = (fo.w - 2.4 * u) / 12
        const base = fo.y + fo.h - (W > 220 ? 3.4 : 1.6) * u
        const hmax = Math.min(fo.h * 0.46, base - (fo.y + 6.4 * u + as * 0.86 + 5.5 * u))
        for (let i = 0; i < 12; i++) {
          const v = croma[i] * (S.mani >= 0 ? 1 : ease.out(clamp(S.k / 0.1)))
          const on = v > 0.55
          const h = 0.6 * u + v * hmax
          const x = fo.x + 1.2 * u + i * cw + 0.15 * u
          g.fillStyle = on ? ROSSO : 'rgba(22,22,22,.16)'
          g.fillRect(x, base - h, cw - 0.3 * u, h)
          if (on) { g.fillStyle = '#5a0a12'; g.fillRect(x, base - h, cw - 0.3 * u, Math.max(1, 0.35 * u)) }
        }
      })

      // il tasto storto del microfono, acceso (rosso): attaccato sopra il bordo del monitor
      const bs = Math.max(6, 2.6 * u)
      g.font = `400 ${bs}px "Anton"`
      const etichetta = W > 260 ? 'microfono acceso' : 'mic'
      const bw = g.measureText(etichetta).width + 3 * u
      kit.con(g, s.x + s.w - bw / 2 - 1 * u, s.y - 2.2 * u, -0.035, 1 + lampo * 0.08, () => {
        g.fillStyle = 'rgba(0,0,0,.35)'
        g.fillRect(-bw / 2 + 0.5 * u, -bs * 0.62 + 0.5 * u, bw, bs * 1.22)
        g.fillStyle = ROSSO
        g.fillRect(-bw / 2, -bs * 0.62, bw, bs * 1.22)
        g.fillStyle = '#fff'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(etichetta, 0, bs * 0.04)
        g.textAlign = 'left'
      })

      g.save()
      g.globalAlpha = 1 - su * 0.4
      g.drawImage(L.vign, 0, 0, W, H)
      g.restore()
      kit.granella(g, W, H, 0.05, t)
    },
  }
}
