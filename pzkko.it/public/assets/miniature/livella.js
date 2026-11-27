// miniature/livella.js — la livella da geometra (27.11.2026).
// Lo strumento di games/livella: il cerchio d'ottone con gli anelli, la mira e la bolla verde, i numeri «avanti /
// indietro» e «destra / sinistra» (beta e gamma come li scrive l'app), la bussola sul coperchio e lo stato in Anton.
// Qualcuno urta il piano, la bolla scappa e oscilla, il piano si rimette a posto e quando è in bolla arriva lo
// scatto: la vibrazione (navigator.vibrate(60) nell'app) diventa un «clic» visivo. Ciclo di 10 s.
// Col mouse sopra: la modalità del computer, «prova col mouse», con la freccia che trascina la bolla.

const T = 10
// il piano che si inclina: [tempo, gamma (destra/sinistra), beta (avanti/indietro)] in gradi
const PIANO = [
  [0, 0.2, 0.1], [0.3, 15, -9], [1.5, -8.5, 5.5], [2.7, 6.2, -3.6], [3.8, -3.4, 2.4], [4.6, 2.8, -1.5],
  [5.3, 0.3, 0.15], [9.6, 0.2, 0.1], [10, 0.2, 0.1],
]
const PUNTI = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, ease, smooth, TAU } = kit
  await Promise.all([kit.font(m.font), kit.font('Special Elite'), kit.font('Anton'), kit.font('Permanent Marker')])
  const gradi = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}°`
  const cardinale = (h) => PUNTI[Math.round(((h % 360) + 360) % 360 / 45) % 8]

  let L = null, sfondo = null, fiala = null, vetro = null, ombra = null, bolla = null, tubo = null
  // la bolla è un liquido: insegue l'inclinazione con una molla
  const B = { x: 0, y: 0, vx: 0, vy: 0 }
  let clic = -9, eraIn = true, tempo = 0

  function misure(w, h) {
    const R = h * 0.37
    const fs = Math.min(11.5, 104 / Math.max(...m.titolo.split(' ').map((p) => p.length || 1))) * w / 100
    L = { w, h, R, cx: w * 0.715, cy: h * 0.5, fs, Rf: R * 0.86, br: R * 0.86 * 0.16 }
    sfondo = kit.strato(w, h, m.dpr, disegnaSfondo)
    const lato = R * 2 + 8
    fiala = kit.strato(lato, lato, m.dpr, (g) => disegnaFiala(g, lato / 2))
    vetro = kit.strato(lato, lato, m.dpr, (g) => disegnaVetro(g, lato / 2))
    ombra = kit.strato(lato + 60, lato + 60, m.dpr, (g) => {
      g.shadowColor = 'rgba(60,45,15,.55)'; g.shadowBlur = R * 0.22
      g.fillStyle = 'rgba(60,45,15,.55)'
      g.beginPath(); g.arc((lato + 60) / 2, (lato + 60) / 2, R * 0.97, 0, TAU); g.fill()
    })
    const bl = L.br * 2 + 6
    bolla = kit.strato(bl, bl, m.dpr, (g) => {
      const c = bl / 2, r = L.br
      const gr = g.createRadialGradient(c - r * 0.3, c - r * 0.4, 0, c, c, r)
      gr.addColorStop(0, '#e9ffd0'); gr.addColorStop(0.46, '#8fce3c'); gr.addColorStop(1, '#4b7a13')
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill()
      const o = g.createRadialGradient(c + r * 0.35, c + r * 0.45, 0, c, c, r)
      o.addColorStop(0.5, 'rgba(0,0,0,0)'); o.addColorStop(1, 'rgba(0,0,0,.3)')
      g.fillStyle = o; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill()
      g.fillStyle = 'rgba(255,255,255,.85)'
      g.beginPath(); g.ellipse(c - r * 0.35, c - r * 0.42, r * 0.28, r * 0.16, -0.6, 0, TAU); g.fill()
    })
    // la livella a tubo davanti, in basso a sinistra
    const tw = w * 0.44, th = Math.max(8, h * 0.085)
    L.tw = tw; L.th = th; L.tx = w * 0.045; L.ty = h * 0.86
    tubo = kit.strato(tw + 20, th + 20, m.dpr, (g) => {
      g.save()
      g.shadowColor = 'rgba(60,45,15,.45)'; g.shadowBlur = 6; g.shadowOffsetY = 3
      const l = g.createLinearGradient(0, 10, 0, 10 + th)
      l.addColorStop(0, '#d9c58e'); l.addColorStop(0.45, '#a88e55'); l.addColorStop(1, '#6b5a30')
      g.fillStyle = l; kit.tondo(g, 10, 10, tw, th, th * 0.18); g.fill()
      g.restore()
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(12, 11, tw - 4, th * 0.16)
      // le viti e le tacche incise
      g.fillStyle = '#5c4a24'
      for (const x of [10 + th * 0.5, 10 + tw - th * 0.5]) { g.beginPath(); g.arc(x, 10 + th / 2, th * 0.12, 0, TAU); g.fill() }
      g.strokeStyle = 'rgba(70,55,25,.55)'; g.lineWidth = 1
      g.beginPath()
      for (let x = th * 1.2; x < tw - th * 1.2; x += tw / 40) {
        if (Math.abs(x - tw / 2) < tw * 0.14) continue
        const lungo = Math.round(x / (tw / 40)) % 5 === 0
        g.moveTo(10 + x, 10 + th); g.lineTo(10 + x, 10 + th - th * (lungo ? 0.32 : 0.18))
      }
      g.stroke()
      // la finestra del tubo
      const fw = tw * 0.26, fh = th * 0.56, fx = 10 + tw / 2 - fw / 2, fy = 10 + th / 2 - fh / 2
      g.fillStyle = '#3a2f16'; kit.tondo(g, fx - 2, fy - 2, fw + 4, fh + 4, fh * 0.5); g.fill()
      const lq = g.createLinearGradient(0, fy, 0, fy + fh)
      lq.addColorStop(0, '#f2ffcf'); lq.addColorStop(0.5, '#c9e88a'); lq.addColorStop(1, '#8fb34c')
      g.fillStyle = lq; kit.tondo(g, fx, fy, fw, fh, fh * 0.5); g.fill()
      g.strokeStyle = 'rgba(40,30,10,.7)'; g.lineWidth = 1
      g.beginPath(); g.moveTo(10 + tw / 2 - fw * 0.13, fy); g.lineTo(10 + tw / 2 - fw * 0.13, fy + fh)
      g.moveTo(10 + tw / 2 + fw * 0.13, fy); g.lineTo(10 + tw / 2 + fw * 0.13, fy + fh); g.stroke()
      L.fw = fw; L.fh = fh
    })
  }

  function disegnaSfondo(g, w, h) {
    // la carta del banco, un po' di luce da sinistra e la quadrettatura del geometra
    g.fillStyle = '#ece3cc'; g.fillRect(0, 0, w, h)
    const r = g.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.4, h * 0.4, w * 0.9)
    r.addColorStop(0, 'rgba(255,253,244,.85)'); r.addColorStop(1, 'rgba(141,122,79,.35)')
    g.fillStyle = r; g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(141,122,79,.16)'; g.lineWidth = 1
    g.beginPath()
    const p = w / 36
    for (let x = p / 2; x < w; x += p) { g.moveTo(x, 0); g.lineTo(x, h) }
    for (let y = p / 2; y < h; y += p) { g.moveTo(0, y); g.lineTo(w, y) }
    g.stroke()
    g.strokeStyle = 'rgba(179,18,31,.22)'
    g.beginPath(); g.moveTo(w * 0.035, 0); g.lineTo(w * 0.035, h); g.stroke()
  }

  function disegnaFiala(g, c) {
    const { R, Rf } = L
    // l'ottone del bordo, con le tacche dei gradi incise
    const o = g.createLinearGradient(c - R, c - R, c + R, c + R)
    o.addColorStop(0, '#f1dfa4'); o.addColorStop(0.35, '#b99c5c'); o.addColorStop(0.65, '#8d7a4f'); o.addColorStop(1, '#5b4a26')
    g.fillStyle = o; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill()
    const o2 = g.createLinearGradient(c + R, c + R, c - R, c - R)
    o2.addColorStop(0, '#e6d197'); o2.addColorStop(0.5, '#a48a52'); o2.addColorStop(1, '#6b5a30')
    g.fillStyle = o2; g.beginPath(); g.arc(c, c, R * 0.93, 0, TAU); g.fill()
    g.strokeStyle = 'rgba(50,38,14,.7)'; g.lineWidth = Math.max(0.6, R * 0.008)
    g.beginPath()
    for (let k = 0; k < 72; k++) {
      const a = k * TAU / 72, l = k % 6 === 0 ? 0.055 : 0.03
      g.moveTo(c + Math.cos(a) * R * 0.925, c + Math.sin(a) * R * 0.925)
      g.lineTo(c + Math.cos(a) * R * (0.925 - l), c + Math.sin(a) * R * (0.925 - l))
    }
    g.stroke()
    if (R > 55) {
      g.fillStyle = 'rgba(50,38,14,.75)'
      g.font = `400 ${R * 0.055}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'
      for (let k = 0; k < 12; k++) {
        const a = k * TAU / 12 - Math.PI / 2
        kit.con(g, c + Math.cos(a) * R * 0.835 * 1.075, c + Math.sin(a) * R * 0.835 * 1.075, a + Math.PI / 2, 1, () => g.fillText(String(k * 30), 0, 0))
      }
    }
    // la faccia color crema, come .lv-vial
    const f = g.createRadialGradient(c - Rf * 0.24, c - Rf * 0.36, 0, c, c, Rf)
    f.addColorStop(0, '#fbf6e7'); f.addColorStop(0.58, '#e8dfc7'); f.addColorStop(1, '#cdc2a5')
    g.fillStyle = f; g.beginPath(); g.arc(c, c, Rf, 0, TAU); g.fill()
    g.save()
    g.beginPath(); g.arc(c, c, Rf, 0, TAU); g.clip()
    g.shadowColor = 'rgba(80,68,40,.55)'; g.shadowBlur = Rf * 0.18
    g.strokeStyle = 'rgba(80,68,40,.6)'; g.lineWidth = Rf * 0.12
    g.beginPath(); g.arc(c, c, Rf + Rf * 0.06, 0, TAU); g.stroke()
    g.restore()
    g.strokeStyle = 'rgba(90,74,40,.35)'; g.lineWidth = Math.max(0.8, Rf * 0.012)
    g.beginPath(); g.arc(c, c, Rf * 0.72, 0, TAU); g.stroke()
    g.setLineDash([Rf * 0.04, Rf * 0.035]); g.strokeStyle = 'rgba(90,74,40,.3)'
    g.beginPath(); g.arc(c, c, Rf * 0.4, 0, TAU); g.stroke()
    g.setLineDash([])
    g.strokeStyle = 'rgba(90,74,40,.5)'
    g.beginPath(); g.arc(c, c, Rf * 0.14 + 1, 0, TAU); g.stroke()
    g.strokeStyle = 'rgba(90,74,40,.4)'; g.lineWidth = 1
    g.beginPath()
    g.moveTo(c - Rf * 0.34, c); g.lineTo(c + Rf * 0.34, c); g.moveTo(c, c - Rf * 0.34); g.lineTo(c, c + Rf * 0.34)
    g.stroke()
  }
  function disegnaVetro(g, c) {
    const { Rf } = L
    g.save()
    g.beginPath(); g.arc(c, c, Rf, 0, TAU); g.clip()
    const v = g.createLinearGradient(c - Rf, c - Rf, c + Rf * 0.2, c + Rf * 0.4)
    v.addColorStop(0, 'rgba(255,255,255,.55)'); v.addColorStop(0.32, 'rgba(255,255,255,.08)'); v.addColorStop(0.33, 'rgba(255,255,255,0)')
    g.fillStyle = v
    g.beginPath(); g.ellipse(c - Rf * 0.2, c - Rf * 0.35, Rf * 0.95, Rf * 0.6, -0.5, 0, TAU); g.fill()
    g.fillStyle = 'rgba(255,255,255,.18)'
    g.beginPath(); g.ellipse(c + Rf * 0.5, c + Rf * 0.6, Rf * 0.32, Rf * 0.09, -0.6, 0, TAU); g.fill()
    g.restore()
  }

  // dove va il piano: il copione, o la freccia del mouse col mouse sopra
  function piano(c) {
    let k = 0
    while (k < PIANO.length - 2 && PIANO[k + 1][0] <= c) k++
    const a = PIANO[k], b = PIANO[k + 1]
    const f = clamp((c - a[0]) / (b[0] - a[0]))
    const e = k === 0 ? ease.out(f) : ease.inOut(f)
    return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]
  }
  function freccia(t) {
    // il mouse trascina la bolla su un otto, e ogni tanto la riporta al centro
    const a = t * 0.9
    const r = 0.5 + 0.5 * Math.sin(t * 0.45)
    return [Math.sin(a) * 0.75 * r, Math.sin(a * 2) * 0.45 * r]
  }

  function bussola(g, x, y, r, h, ago) {
    g.save()
    g.shadowColor = 'rgba(40,30,10,.35)'; g.shadowBlur = r * 0.3; g.shadowOffsetY = r * 0.1
    const f = g.createRadialGradient(x - r * 0.2, y - r * 0.3, 0, x, y, r)
    f.addColorStop(0, '#fffdf6'); f.addColorStop(1, '#eee7d6')
    g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
    g.restore()
    g.strokeStyle = '#8d7a4f'; g.lineWidth = Math.max(1, r * 0.1)
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke()
    g.fillStyle = '#b3121f'; g.font = `400 ${r * 0.34}px "Special Elite"`; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('N', x, y - r * 0.68)
    kit.con(g, x, y, -ago * Math.PI / 180, 1, () => {
      g.fillStyle = '#b3121f'
      g.beginPath(); g.moveTo(0, -r * 0.72); g.lineTo(r * 0.12, 0); g.lineTo(-r * 0.12, 0); g.closePath(); g.fill()
      g.fillStyle = '#161616'
      g.beginPath(); g.moveTo(0, r * 0.6); g.lineTo(r * 0.12, 0); g.lineTo(-r * 0.12, 0); g.closePath(); g.fill()
    })
    g.fillStyle = '#8d7a4f'; g.beginPath(); g.arc(x, y, r * 0.09, 0, TAU); g.fill()
  }

  return {
    titolo: false,
    fermo: 5.9,
    ridimensiona(w, h) { misure(w, h) },
    frame(t, dt) {
      const { w, h } = m
      if (!L || L.w !== w || L.h !== h) misure(w, h)
      const g = m.g
      tempo += dt
      const c = kit.fract(tempo / T) * T
      // l'inclinazione: il copione, e col mouse sopra la freccia che trascina
      const [pg, pb] = piano(c)
      const [fx, fy] = freccia(tempo)
      const su = m.su
      const dg = lerp(pg, fx * 28, su), db = lerp(pb, fy * 28, su)
      const tx = clamp(dg / 28, -1, 1), ty = clamp(db / 28, -1, 1)
      // la molla della bolla
      const K = 70, D = 9.5
      const n = Math.max(1, Math.round(dt / (1 / 120)))
      for (let i = 0; i < n; i++) {
        const s = dt / n
        B.vx += ((tx - B.x) * K - B.vx * D) * s; B.vy += ((ty - B.y) * K - B.vy * D) * s
        B.x += B.vx * s; B.y += B.vy * s
      }
      const inBolla = Math.abs(B.x) < 0.07 && Math.abs(B.y) < 0.07
      if (inBolla && !eraIn) clic = tempo
      eraIn = inBolla
      const dc = tempo - clic
      const vibra = dc < 0.32 ? (1 - dc / 0.32) : 0

      g.drawImage(sfondo, 0, 0, w, h)
      const { R, Rf } = L
      // il piano inclinato: lo strumento si schiaccia un po' e l'ombra scivola dalla parte opposta
      const sx = 1 - Math.min(0.22, Math.abs(dg) * 0.012), sy = 1 - Math.min(0.22, Math.abs(db) * 0.012)
      const jx = vibra * Math.sin(tempo * 210) * R * 0.025, jy = vibra * Math.cos(tempo * 170) * R * 0.018
      const cx = L.cx + jx + dg * R * 0.006, cy = L.cy + jy + db * R * 0.006
      const lato = R * 2 + 8
      g.globalAlpha = 0.75
      g.drawImage(ombra, cx - (lato + 60) / 2 * sx - dg * R * 0.012 + R * 0.05, cy - (lato + 60) / 2 * sy - db * R * 0.012 + R * 0.1, (lato + 60) * sx, (lato + 60) * sy)
      g.globalAlpha = 1
      g.save()
      g.translate(cx, cy); g.scale(sx, sy)
      g.drawImage(fiala, -lato / 2, -lato / 2, lato, lato)
      // la bolla: si allunga quando corre, si posa quando è ferma
      const v = Math.hypot(B.vx, B.vy), allunga = Math.min(0.35, v * 0.12)
      const bx = B.x * Rf * 0.55, by = B.y * Rf * 0.55
      g.save()
      g.beginPath(); g.arc(0, 0, Rf, 0, TAU); g.clip()
      const bl = L.br * 2 + 6
      if (inBolla) {
        g.fillStyle = `rgba(35,134,74,${0.18 + 0.12 * vibra})`
        g.beginPath(); g.arc(bx, by, L.br * 1.45, 0, TAU); g.fill()
      }
      kit.con(g, bx, by, Math.atan2(B.vy, B.vx), 1, () => {
        g.scale(1 + allunga, 1 - allunga * 0.6)
        g.drawImage(bolla, -bl / 2, -bl / 2, bl, bl)
      })
      // lo scatto: due cerchi verdi che si allargano dalla bolla
      if (dc < 0.9) {
        for (const ritardo of [0, 0.18]) {
          const k = clamp((dc - ritardo) / 0.7)
          if (k <= 0 || k >= 1) continue
          g.strokeStyle = `rgba(35,134,74,${0.7 * (1 - k)})`; g.lineWidth = Math.max(1, R * 0.03 * (1 - k))
          g.beginPath(); g.arc(bx, by, L.br * (1.2 + k * 3.2), 0, TAU); g.stroke()
        }
      }
      g.restore()
      // il riflesso del vetro scivola un poco con l'inclinazione
      g.drawImage(vetro, -lato / 2 - dg * R * 0.004, -lato / 2 - db * R * 0.004, lato, lato)
      g.restore()
      // il clic della vibrazione: i segni del fumetto ai lati dello strumento
      if (vibra > 0) {
        g.strokeStyle = `rgba(22,22,22,${0.75 * vibra})`; g.lineWidth = Math.max(1, R * 0.025); g.lineCap = 'round'
        g.beginPath()
        for (const lato2 of [-1, 1]) for (const a of [-0.35, 0, 0.35]) {
          const r1 = R * (1.08 + (1 - vibra) * 0.1), r2 = R * (1.2 + (1 - vibra) * 0.14)
          const an = (lato2 < 0 ? Math.PI : 0) + a
          g.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); g.lineTo(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2)
        }
        g.stroke()
      }
      // la bussola sul coperchio: il nord vaga un po' e sobbalza con l'urto
      const urto = Math.exp(-3 * c) * Math.sin(9 * c) * 28
      const nord = 312 + 9 * Math.sin(tempo * 0.37) + 4 * Math.sin(tempo * 1.21) + urto
      const br = R * 0.27
      bussola(g, cx + R * 0.8, cy - R * 0.8, br, w, nord)

      // la livella a tubo davanti: la sua bolla segue destra/sinistra
      kit.con(g, L.tx + L.tw / 2, L.ty, dg * 0.004, 1, () => {
        g.drawImage(tubo, -L.tw / 2 - 10, -L.th / 2 - 10, L.tw + 20, L.th + 20)
        const ox = clamp(B.x * 1.6, -1, 1) * L.fw * 0.36
        const bw = L.fh * 1.25, bh = L.fh * 0.62
        const gr = g.createLinearGradient(0, -bh / 2, 0, bh / 2)
        gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(215,240,170,.8)')
        g.fillStyle = gr
        kit.tondo(g, ox - bw / 2, -bh / 2, bw, bh, bh / 2); g.fill()
        g.strokeStyle = 'rgba(75,122,19,.6)'; g.lineWidth = 1; g.stroke()
      })

      // il titolo
      g.font = `400 ${L.fs}px "${m.font}"`
      g.textBaseline = 'top'; g.textAlign = 'left'
      g.fillStyle = 'rgba(92,74,36,.28)'; g.fillText(m.titolo, w * 0.05 + L.fs * 0.04, w * 0.075 + L.fs * 0.07)
      const tg = g.createLinearGradient(0, w * 0.075, 0, w * 0.075 + L.fs)
      tg.addColorStop(0, '#a88e55'); tg.addColorStop(1, '#5b4a26')
      g.fillStyle = tg; g.fillText(m.titolo, w * 0.05, w * 0.075)

      // lo stato, in Anton come .lv-stato: verde quando è in bolla
      const x = B.x, y = B.y
      const stato = inBolla ? 'in bolla' : x > 0.07 ? 'la bolla è a destra' : x < -0.07 ? 'la bolla è a sinistra' : y > 0.07 ? 'la bolla è avanti' : 'la bolla è indietro'
      const fsS = Math.max(9, w * 0.052)
      const pop = inBolla ? 1 + 0.25 * vibra : 1
      kit.con(g, w * 0.05, h * 0.47, inBolla ? -0.03 : 0, pop, () => {
        g.font = `400 ${fsS}px "Anton"`; g.textBaseline = 'middle'; g.textAlign = 'left'
        if (inBolla) kit.evidenzia(g, -fsS * 0.15, -fsS * 0.55, g.measureText(stato).width + fsS * 0.3, fsS * 1.1, clamp(dc * 4), 'rgba(204,255,0,.55)')
        g.fillStyle = inBolla ? '#23864a' : '#161616'
        g.fillText(stato, 0, 0)
      })
      // i numeri: beta e gamma come nell'app
      if (w >= 280) {
        const f1 = Math.max(7, w * 0.022), f2 = Math.max(10, w * 0.042)
        const righe = [['avanti / indietro', gradi(db)], ['destra / sinistra', gradi(dg)], ['bussola', `${Math.round(((nord % 360) + 360) % 360)}° ${cardinale(nord)}`]]
        const x0 = w * 0.05, x1 = w * 0.44
        righe.forEach(([et, val], i) => {
          const yy = h * (0.6 + i * 0.085)
          g.font = `400 ${f1}px "Special Elite"`; g.fillStyle = '#5a544c'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
          g.fillText(et, x0, yy)
          g.font = `400 ${f2}px "Anton"`; g.fillStyle = '#161616'; g.textAlign = 'right'
          g.fillText(val, x1, yy)
          g.strokeStyle = 'rgba(22,22,22,.2)'; g.setLineDash([1.5, 2.5]); g.lineWidth = 1
          g.beginPath(); g.moveTo(x0, yy + f1 * 0.5); g.lineTo(x1, yy + f1 * 0.5); g.stroke(); g.setLineDash([])
        })
      }
      // l'etichetta in alto a destra: i sensori, o la prova col mouse
      if (w >= 260) {
        const f = Math.max(7, w * 0.022)
        const testo = su > 0.5 ? 'prova col mouse' : 'sensori accesi'
        g.font = `400 ${f}px "Special Elite"`
        const tw = g.measureText(testo).width
        const x2 = w - w * 0.035 - tw, y2 = h * 0.075
        g.fillStyle = su > 0.5 ? '#c96a00' : '#23864a'
        g.beginPath(); g.arc(x2 - f * 0.8, y2 - f * 0.32, f * 0.32 * (0.85 + 0.15 * Math.sin(tempo * 5)), 0, TAU); g.fill()
        g.fillStyle = '#5a544c'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
        g.fillText(testo, x2, y2)
      }
      // la freccia del mouse che tiene la bolla
      if (su > 0.02) {
        const px = cx + bx * sx + L.br * 0.4, py = cy + by * sy + L.br * 0.4
        const s = Math.max(9, R * 0.17)
        g.globalAlpha = su
        kit.con(g, px, py, 0, 1, () => {
          g.beginPath()
          g.moveTo(0, 0); g.lineTo(0, s); g.lineTo(s * 0.27, s * 0.76); g.lineTo(s * 0.47, s * 1.12); g.lineTo(s * 0.62, s * 1.04)
          g.lineTo(s * 0.43, s * 0.7); g.lineTo(s * 0.75, s * 0.7); g.closePath()
          g.fillStyle = '#fff'; g.fill()
          g.strokeStyle = '#161616'; g.lineWidth = Math.max(1, s * 0.08); g.lineJoin = 'round'; g.stroke()
        })
        g.globalAlpha = 1
      }
      kit.granella(g, w, h, 0.045, t)
    },
  }
}
