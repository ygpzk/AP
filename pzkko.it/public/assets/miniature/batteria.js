// miniature/batteria.js — la drum machine che suona da sola, in silenzio.
// Com'è l'app vera (games/batteria): il foglio coi sedici passi e le sei file (cassa, rullante, charleston, aperto,
// clap, tom, coi loro colori), i numeri in alto, il passo che suona evidenziato in giallo col bordo nero, il foglietto
// del trasporto col tasto nero storto (rosso mentre suona), il contatore rosso e il cursore dei battiti a puntina.
// I giri sono quelli dell'app (base, house, break) a 104 bpm con lo swing sui sedicesimi dispari; il quarto giro è
// un fill di rullante e tom. Il «wow»: il colpo d'apertura dopo il fill, con l'onda che attraversa tutta la griglia.
// Col mouse sopra: i battiti salgono (la puntina corre), il foglio si raddrizza e si avvicina, i colpi sono più forti.

const STRUMENTI = [
  { id: 'cassa', nome: 'cassa', colore: '#b3121f' },
  { id: 'rullante', nome: 'rullante', colore: '#e8501c' },
  { id: 'hat', nome: 'charleston', colore: '#c98a00' },
  { id: 'aperto', nome: 'aperto', colore: '#23864a' },
  { id: 'clap', nome: 'clap', colore: '#1446a0' },
  { id: 'tom', nome: 'tom', colore: '#7a1fa2' },
]
const b = (s) => s.replace(/\s/g, '').split('').map(Number)
const GIRI = [
  { nome: 'base', p: [b('1000 1000 1000 1000'), b('0000 1000 0000 1000'), b('0010 0010 0010 0010'), b('0000 0000 0000 0010'), b('0000 0000 0000 0000'), b('0000 0001 0000 0001')] },
  { nome: 'house', p: [b('1000 1000 1000 1000'), b('0000 0000 0000 0000'), b('0010 0010 0010 0010'), b('0000 0010 0000 0010'), b('0000 1000 0000 1000'), b('0000 0000 0001 0000')] },
  { nome: 'break', p: [b('1001 0010 0010 1000'), b('0000 1001 0000 1000'), b('1010 1010 1010 1011'), b('0000 0000 0000 0000'), b('0000 0000 0000 0100'), b('0000 0100 0001 0000')] },
  { nome: 'fill', p: [b('1001 0010 0000 0000'), b('0000 1001 0101 1111'), b('1010 1010 1000 0000'), b('0000 0000 0000 0000'), b('0000 0000 0000 0001'), b('0000 0000 1010 1100')] },
]
const PASSI = 16
const CARTA = '#f2eee3'
const FOGLIETTO = '#fffdf6'
const INK = '#161616'
const ROSSO = '#b3121f'
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mischia = (h, k) => { const [r, g, bb] = rgb(h); return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(bb + (255 - bb) * k)})` }

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU } = kit
  await Promise.all([kit.font('Headbang'), kit.font('Anton'), kit.font('Special Elite'), kit.font('Permanent Marker')])

  const SWING = 0.16
  let fase = 0 // in sedicesimi
  let L = null, W = 0, H = 0, D = 0

  function geometria(w, h) {
    const u = w / 100
    const fo = { x: 3 * u, y: 21.5 * u, w: 94 * u, h: h - 23.6 * u }
    const x0 = fo.x + 15.5 * u, x1 = fo.x + fo.w - 2.2 * u
    const gb = 0.9 * u // lo spazio in più fra i quarti
    const cw = (x1 - x0 - gb * 3) / PASSI
    const y0 = fo.y + 5.6 * u, y1 = fo.y + fo.h - 2 * u
    const rh = (y1 - y0) / STRUMENTI.length
    const colX = (i) => x0 + i * cw + Math.floor(i / 4) * gb
    const tr = { x: 57.5 * u, y: 3.6 * u, w: 38.5 * u, h: 14.8 * u }
    return { u, w, h, fo, x0, x1, cw, y0, rh, colX, tr, gb }
  }

  function costruisci() {
    W = m.w; H = m.h; D = m.dpr
    const G = geometria(W, H)
    const u = G.u
    const fondo = kit.strato(W, H, D, (g) => {
      g.fillStyle = m.c2
      g.fillRect(0, 0, W, H)
      let r = g.createRadialGradient(W * 0.1, 0, 0, W * 0.1, 0, W * 0.75)
      r.addColorStop(0, 'rgba(232,80,28,.42)')
      r.addColorStop(1, 'rgba(232,80,28,0)')
      g.fillStyle = r
      g.fillRect(0, 0, W, H)
      // le tessere della copertina di prima
      g.strokeStyle = 'rgba(0,0,0,.28)'
      g.lineWidth = Math.max(0.6, 0.18 * u)
      const p = 13.5 * u
      for (let x = p * 0.4; x < W; x += p) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
      for (let y = p * 0.4; y < H; y += p) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
      g.strokeStyle = 'rgba(255,170,120,.06)'
      for (let x = p * 0.4 + 1; x < W; x += p) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
    })
    // il foglio del sequencer: carta, nastro, nomi, numeri, le caselle vuote
    const foglio = kit.strato(W, H, D, (g) => {
      const f = G.fo
      g.save()
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 3.5 * u; g.shadowOffsetY = 1.6 * u
      g.fillStyle = CARTA
      g.fillRect(f.x, f.y, f.w, f.h)
      g.restore()
      let r = g.createLinearGradient(f.x, f.y, f.x + f.w * 0.3, f.y + f.h)
      r.addColorStop(0, 'rgba(255,255,255,.6)'); r.addColorStop(0.6, 'rgba(255,255,255,0)'); r.addColorStop(1, 'rgba(90,70,30,.08)')
      g.fillStyle = r
      g.fillRect(f.x, f.y, f.w, f.h)
      // fibra della carta
      const rr = kit.rng(4)
      for (let i = 0; i < 260; i++) {
        g.fillStyle = `rgba(90,70,40,${0.03 + rr() * 0.05})`
        g.fillRect(f.x + rr() * f.w, f.y + rr() * f.h, rr() * 1.4 * u, Math.max(0.5, 0.12 * u))
      }
      // i numeri dei passi (ogni quarto più scuro)
      const ns = Math.max(5, 1.9 * u)
      g.font = `400 ${ns}px "Special Elite"`
      g.textAlign = 'center'
      g.textBaseline = 'alphabetic'
      for (let i = 0; i < PASSI; i++) {
        if (G.w < 260 && i % 4) continue
        g.fillStyle = i % 4 === 0 ? INK : '#5a544c'
        g.fillText(String(i + 1), G.colX(i) + G.cw / 2, G.y0 - 1.1 * u)
      }
      g.textAlign = 'left'
      // i nomi con il pallino del colore
      const ts = Math.max(5, 2 * u)
      g.font = `400 ${ts}px "Special Elite"`
      g.textBaseline = 'middle'
      STRUMENTI.forEach((s, i) => {
        const y = G.y0 + (i + 0.5) * G.rh
        g.fillStyle = s.colore
        g.beginPath(); g.arc(f.x + 2.9 * u, y, 0.9 * u, 0, TAU); g.fill()
        if (G.w > 220) { g.fillStyle = '#5a544c'; g.fillText(s.nome, f.x + 4.6 * u, y + 0.15 * u) }
      })
      // le caselle vuote
      for (let r2 = 0; r2 < STRUMENTI.length; r2++) {
        for (let i = 0; i < PASSI; i++) {
          const x = G.colX(i) + 0.3 * u, y = G.y0 + r2 * G.rh + 0.3 * u
          const w = G.cw - 0.6 * u, h = G.rh - 0.6 * u
          g.fillStyle = 'rgba(255,255,255,.45)'
          g.fillRect(x, y, w, h)
          g.fillStyle = STRUMENTI[r2].colore
          g.globalAlpha = 0.12
          g.fillRect(x + 0.7 * u, y + 0.7 * u, w - 1.4 * u, h - 1.4 * u)
          g.globalAlpha = 1
          g.strokeStyle = 'rgba(22,22,22,.25)'
          g.lineWidth = Math.max(0.7, 0.3 * u)
          g.strokeRect(x, y, w, h)
        }
      }
      // il nastro agli angoli
      kit.nastro(g, f.x + 2 * u, f.y + 0.2 * u, 11 * u, 3.2 * u, -0.6)
      kit.nastro(g, f.x + f.w - 2 * u, f.y + 0.2 * u, 11 * u, 3.2 * u, 0.6)
      kit.nastro(g, f.x + f.w * 0.52, f.y - 0.4 * u, 10 * u, 3 * u, 0.04)
    })
    // il foglietto del trasporto
    const trasporto = kit.strato(W, H, D, (g) => {
      const t = G.tr
      g.save()
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 2.6 * u; g.shadowOffsetY = 1.1 * u
      g.fillStyle = FOGLIETTO
      g.fillRect(t.x, t.y, t.w, t.h)
      g.restore()
      const r = g.createLinearGradient(t.x, t.y, t.x + t.w * 0.4, t.y + t.h)
      r.addColorStop(0, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(90,70,30,.08)')
      g.fillStyle = r
      g.fillRect(t.x, t.y, t.w, t.h)
      if (G.w > 220) {
        g.font = `400 ${1.9 * u}px "Special Elite"`
        g.fillStyle = '#5a544c'
        g.textBaseline = 'alphabetic'
        g.fillText('passo', t.x + t.w - 13.2 * u, t.y + 5.6 * u)
        g.textBaseline = 'middle'
        g.fillText('battiti', t.x + 1.8 * u, t.y + t.h - 3 * u)
      }
      kit.nastro(g, t.x + t.w * 0.5, t.y - 0.2 * u, 9 * u, 2.6 * u, 0.06)
    })
    // il titolo: Headbang crema con l'ombra arancio piena
    const ts = 11.5 * u
    const titolo = m.titolo || 'Batteria'
    const scrittaT = kit.strato(W, H, D, (g) => {
      g.font = `400 ${ts}px "Headbang"`
      g.textBaseline = 'alphabetic'
      const y = 4.4 * u + ts * 0.86
      g.fillStyle = '#5a1606'
      g.fillText(titolo, 5 * u + 0.9 * u, y + 0.9 * u)
      g.fillStyle = m.c1
      g.fillText(titolo, 5 * u + 0.45 * u, y + 0.45 * u)
      g.fillStyle = '#fff3e6'
      g.fillText(titolo, 5 * u, y)
    })
    const vign = kit.strato(W, H, D, (g) => kit.vignetta(g, W, H, 0.5))
    L = { G, fondo, foglio, trasporto, scrittaT, vign }
  }

  // dove siamo: battuta, passo (con lo swing sui dispari), da quanto è suonato, che giro
  function dove(f) {
    const passo = Math.floor(f)
    const coppia = Math.floor(f / 2)
    const q = f - coppia * 2
    const sw = SWING / 2
    let i, dentro
    if (q < 1 + sw) { i = coppia * 2; dentro = q } else { i = coppia * 2 + 1; dentro = q - 1 - sw }
    const battuta = Math.floor(i / PASSI)
    return { i: ((i % PASSI) + PASSI) % PASSI, dentro, battuta, giro: ((battuta % GIRI.length) + GIRI.length) % GIRI.length, assoluto: i, passo, inBattuta: f - battuta * PASSI }
  }
  // la posizione continua del cursore (lo swing la fa zoppicare un poco, come la drum machine vera)
  const xPlay = (G, d) => {
    const lungo = d.i % 2 ? 1 - SWING / 2 : 1 + SWING / 2
    const k = clamp(d.dentro / lungo)
    const xa = G.colX(d.i) + 0.15 * G.u
    const xb = d.i === PASSI - 1 ? G.x1 : G.colX(d.i + 1) - 0.15 * G.u
    return lerp(xa, xb, k)
  }

  return {
    titolo: false,
    fermo: 2.4,
    frame(t, dt) {
      if (!L || W !== m.w || H !== m.h || D !== m.dpr) costruisci()
      const g = m.g
      const { G } = L
      const u = G.u
      const su = m.su
      const bpm = 104 + su * 46
      fase += dt * (bpm / 60) * 4
      const d = dove(fase)
      const giro = GIRI[d.giro], primo = GIRI[(d.giro + GIRI.length - 1) % GIRI.length]
      const colpoK = Math.exp(-d.dentro * 3.2) // quanto è fresco il colpo del passo corrente
      const cassa = giro.p[0][d.i] ? colpoK : 0
      // il colpo d'apertura dopo il fill (il wow): primo passo del giro «base»
      const apre = d.giro === 0 ? d.inBattuta : 99
      const crash = apre < 14 ? Math.exp(-apre * 0.32) * smooth(14, 9, apre) : 0

      g.drawImage(L.fondo, 0, 0, W, H)
      // la stanza respira con la cassa
      if (cassa > 0.02 || crash > 0.02) {
        const r = g.createRadialGradient(W * 0.5, H * 0.75, 0, W * 0.5, H * 0.75, W * 0.7)
        r.addColorStop(0, `rgba(232,80,28,${0.22 * cassa + 0.35 * crash})`)
        r.addColorStop(1, 'rgba(232,80,28,0)')
        g.fillStyle = r
        g.fillRect(0, 0, W, H)
      }

      // ── il titolo e la voce ──
      kit.con(g, 0, 0, 0, 1, () => {
        const sc = 1 + 0.025 * cassa + 0.06 * crash
        g.translate(5 * u, 10 * u); g.scale(sc, sc); g.translate(-5 * u, -10 * u)
        g.drawImage(L.scrittaT, 0, 0, W, H)
      })
      if (W > 240) {
        const voce = d.inBattuta < 10 ? `giro «${giro.nome === 'fill' ? 'break' : giro.nome}»${giro.nome === 'fill' ? ' + fill' : ''}` : 'sedici passi, sei pezzi'
        g.font = `400 ${2.5 * u}px "Permanent Marker"`
        g.fillStyle = 'rgba(255,214,190,.82)'
        g.textBaseline = 'alphabetic'
        g.fillText(voce, 5.4 * u, 18.6 * u)
      }

      // ── il trasporto ──
      const tr = G.tr
      kit.con(g, tr.x + tr.w / 2, tr.y + tr.h / 2, 0.018 - su * 0.01, 1 + su * 0.02, () => {
        g.translate(-(tr.x + tr.w / 2), -(tr.y + tr.h / 2))
        g.drawImage(L.trasporto, 0, 0, W, H)
        // il tasto nero storto: suona, quindi è rosso e dice «ferma»
        const bs = Math.max(7, 3.6 * u)
        g.font = `400 ${bs}px "Anton"`
        const tw = g.measureText('ferma').width
        kit.con(g, tr.x + 2 * u + tw / 2 + 1.6 * u, tr.y + 5 * u - cassa * 0.25 * u, -0.035, 1 + crash * 0.12, () => {
          g.fillStyle = 'rgba(0,0,0,.2)'
          g.fillRect(-tw / 2 - 1.4 * u + 0.6 * u, -bs * 0.62 + 0.6 * u, tw + 2.8 * u, bs * 1.22)
          g.fillStyle = ROSSO
          g.fillRect(-tw / 2 - 1.4 * u, -bs * 0.62, tw + 2.8 * u, bs * 1.22)
          g.fillStyle = '#fff'
          g.textAlign = 'center'
          g.textBaseline = 'middle'
          g.fillText('ferma', 0, bs * 0.04)
          g.textAlign = 'left'
        })
        // il contatore rosso
        const cs = Math.max(9, 6 * u) * (1 + 0.18 * colpoK * (d.i % 4 === 0 ? 1 : 0.3) + crash * 0.35)
        g.font = `400 ${cs}px "Anton"`
        g.fillStyle = ROSSO
        g.textAlign = 'right'
        g.textBaseline = 'alphabetic'
        g.fillText(String(d.i + 1).padStart(2, '0'), tr.x + tr.w - 1.8 * u, tr.y + 7.6 * u)
        g.textAlign = 'left'
        // il cursore dei battiti
        const sy = tr.y + tr.h - 3 * u
        const sx0 = tr.x + 9 * u, sx1 = tr.x + tr.w - 10.5 * u
        g.fillStyle = 'rgba(22,22,22,.55)'
        g.fillRect(sx0, sy - 0.25 * u, sx1 - sx0, Math.max(1, 0.5 * u))
        puntina(g, lerp(sx0, sx1, (bpm - 50) / 150), sy, 1.4 * u)
        if (W > 200) {
          g.font = `400 ${Math.max(5, 1.9 * u)}px "Special Elite"`
          g.fillStyle = INK
          g.textAlign = 'right'
          g.textBaseline = 'middle'
          g.fillText(`${Math.round(bpm)} bpm`, tr.x + tr.w - 1.6 * u, sy)
          g.textAlign = 'left'
        }
      })

      // ── il foglio del sequencer ──
      const f = G.fo
      const scuoti = giro.nome === 'fill' ? smooth(8, 16, d.inBattuta) : 0
      const sx = Math.sin(t * 61) * 0.25 * u * scuoti, sy = Math.cos(t * 53) * 0.2 * u * scuoti
      g.save()
      g.translate(f.x + f.w / 2 + sx, f.y + f.h / 2 + 0.35 * u * cassa + sy - su * 0.5 * u)
      g.rotate(-0.012 * (1 - su) + crash * 0.006 * Math.sin(apre * 9))
      const sc = 1 + 0.004 * cassa + su * 0.012
      g.scale(sc, sc)
      g.translate(-(f.x + f.w / 2), -(f.y + f.h / 2))
      g.drawImage(L.foglio, 0, 0, W, H)

      // la colonna che suona: giallo dietro le caselle
      const cx = G.colX(d.i)
      g.fillStyle = `rgba(255,212,0,${0.3 + 0.2 * colpoK})`
      g.fillRect(cx - 0.1 * u, G.y0 - 0.1 * u, G.cw + 0.2 * u, G.rh * STRUMENTI.length + 0.2 * u)
      // il numero del passo diventa rosso
      g.font = `400 ${Math.max(5, 1.9 * u)}px "Special Elite"`
      g.textAlign = 'center'
      g.fillStyle = ROSSO
      g.fillText(String(d.i + 1), cx + G.cw / 2, G.y0 - 1.1 * u - colpoK * 0.4 * u)
      g.textAlign = 'left'

      // l'onda del crash passa anche sulle caselle vuote: una luce calda che attraversa la griglia
      if (crash > 0.02) {
        for (let r = 0; r < STRUMENTI.length; r++) {
          for (let i = 0; i < PASSI; i++) {
            const a = apre * 3.4 - Math.hypot(i, r * 1.6)
            if (a <= 0 || a >= 4) continue
            const o = Math.sin((a / 4) * Math.PI)
            g.fillStyle = `rgba(255,${Math.round(190 + 40 * o)},60,${0.55 * o})`
            const e = 0.4 * u * o
            g.fillRect(G.colX(i) + 0.3 * u - e, G.y0 + r * G.rh + 0.3 * u - e - o * 0.6 * u, G.cw - 0.6 * u + 2 * e, G.rh - 0.6 * u + 2 * e)
          }
        }
      }
      // le caselle accese (quando cambia il giro, si accendono e si spengono a onda da sinistra)
      for (let r = 0; r < STRUMENTI.length; r++) {
        const st = STRUMENTI[r]
        for (let i = 0; i < PASSI; i++) {
          const ora = giro.p[r][i], prima = primo.p[r][i]
          if (!ora && !prima) continue
          let k = 1
          const kk = clamp((d.inBattuta - i * 0.09) / 0.7)
          if (ora && !prima) k = ease.outBack(kk)
          else if (!ora && prima) k = 1 - ease.in(kk)
          if (k <= 0.01) continue
          // il colpo: il passo corrente, e un poco anche quello di prima che si spegne
          let fl = 0
          if (ora && i === d.i) fl = colpoK
          // l'onda del crash: ogni casella salta quando la raggiunge
          let onda = 0
          if (crash > 0) {
            const dist = Math.hypot(i, r * 1.6)
            const a = apre * 3.4 - dist
            if (a > 0 && a < 4) onda = Math.sin((a / 4) * Math.PI) * (0.45 + 0.55 * crash)
          }
          disegnaPad(g, G, st, i, r, k * (1 + 0.22 * ease.outBack(fl) + 0.35 * onda), fl, onda)
        }
      }
      // il bordo nero sulla colonna che suona
      g.strokeStyle = INK
      g.lineWidth = Math.max(1, 0.42 * u)
      for (let r = 0; r < STRUMENTI.length; r++) g.strokeRect(cx + 0.3 * u, G.y0 + r * G.rh + 0.3 * u, G.cw - 0.6 * u, G.rh - 0.6 * u)

      // il cursore che scorre: una riga rossa col bagliore (davanti alla griglia)
      const xp = xPlay(G, d)
      const alt = G.rh * STRUMENTI.length
      const scia = g.createLinearGradient(xp - (4 + su * 6) * u, 0, xp, 0)
      scia.addColorStop(0, 'rgba(179,18,31,0)')
      scia.addColorStop(1, `rgba(179,18,31,${0.16 + su * 0.14})`)
      g.fillStyle = scia
      g.fillRect(xp - (4 + su * 6) * u, G.y0 - 0.6 * u, (4 + su * 6) * u, alt + 1.2 * u)
      g.fillStyle = ROSSO
      g.fillRect(xp - Math.max(0.6, 0.18 * u), G.y0 - 1.4 * u, Math.max(1.2, 0.36 * u), alt + 2.6 * u)
      g.beginPath()
      g.moveTo(xp - 1 * u, G.y0 - 2 * u); g.lineTo(xp + 1 * u, G.y0 - 2 * u); g.lineTo(xp, G.y0 - 0.8 * u); g.closePath()
      g.fill()

      // i colpi: anelli e schegge del colore del pezzo
      for (let back = 0; back < 3; back++) {
        if (fase - back < 0) break
        const dd = dove(fase - back)
        const gr = GIRI[dd.giro]
        const eta = back + dd.dentro // in passi, circa
        if (eta > 2.6) continue
        for (let r = 0; r < STRUMENTI.length; r++) {
          if (!gr.p[r][dd.i]) continue
          colpo(g, G, STRUMENTI[r], dd.i, r, eta / 2.6, dd.assoluto * 7 + r, su)
        }
      }
      g.restore()

      // il crash: il lampo e l'anello che parte dal primo passo
      if (crash > 0.02) {
        const k = clamp(apre / 4)
        const x = G.colX(0) + G.cw / 2, y = G.y0 + G.rh * 3
        g.strokeStyle = `rgba(255,233,200,${0.6 * (1 - k)})`
        g.lineWidth = Math.max(1, 1.4 * u * (1 - k))
        g.beginPath(); g.arc(x, y, 3 * u + ease.out(k) * 95 * u, 0, TAU); g.stroke()
        g.fillStyle = `rgba(255,240,220,${0.28 * Math.exp(-apre * 3)})`
        g.fillRect(0, 0, W, H)
      }
      // i coriandoli: pezzetti di casella di tutti i colori, che volano e ricadono
      if (apre < 16) {
        const sec = apre / ((bpm / 60) * 4)
        const rnd = kit.rng(Math.floor(fase / (PASSI * GIRI.length)) + 3)
        const ox = G.colX(0) + G.cw / 2, oy = G.y0 + G.rh * 2.5
        for (let j = 0; j < 64; j++) {
          const ang = -Math.PI * (0.05 + rnd() * 0.75)
          const v = (28 + rnd() * 70) * u
          const x = ox + Math.cos(ang) * v * sec
          const y = oy + Math.sin(ang) * v * sec + 0.5 * 75 * u * sec * sec
          const a = clamp(1 - sec / 2.2) * (1 - su * 0.2)
          if (a <= 0 || y > H + 4 * u) { rnd(); rnd(); continue }
          const s = (1.3 + rnd() * 1.5) * u
          const col = STRUMENTI[j % STRUMENTI.length].colore
          kit.con(g, x, y, sec * (4 + rnd() * 8), 1, () => {
            g.globalAlpha = a
            g.fillStyle = col
            g.fillRect(-s / 2, -s * 0.35, s, s * 0.7 * Math.abs(Math.cos(sec * 9 + j)))
            g.globalAlpha = 1
          })
        }
      }

      g.save()
      g.globalAlpha = 1 - su * 0.4
      g.drawImage(L.vign, 0, 0, W, H)
      g.restore()
      kit.granella(g, W, H, 0.055, t)
    },
  }

  function disegnaPad(g, G, st, i, r, k, fl, onda) {
    const u = G.u
    const w = G.cw - 0.6 * u, h = G.rh - 0.6 * u
    const cx = G.colX(i) + G.cw / 2, cy = G.y0 + (r + 0.5) * G.rh - onda * 0.8 * u
    const ww = w * k, hh = h * k
    if (fl > 0.05) {
      // il bagliore del colpo intorno alla casella
      const [r0, g0, b0] = rgb(st.colore)
      g.fillStyle = `rgba(${r0},${g0},${b0},${0.28 * fl})`
      g.fillRect(cx - ww / 2 - 1.1 * u * fl, cy - hh / 2 - 1.1 * u * fl, ww + 2.2 * u * fl, hh + 2.2 * u * fl)
    }
    g.fillStyle = mischia(st.colore, clamp(fl * 0.55 + onda * 0.5))
    g.fillRect(cx - ww / 2, cy - hh / 2, ww, hh)
    g.fillStyle = 'rgba(0,0,0,.2)'
    g.fillRect(cx - ww / 2, cy + hh / 2 - 0.65 * u * k, ww, 0.65 * u * k)
    g.fillStyle = 'rgba(255,255,255,.22)'
    g.fillRect(cx - ww / 2, cy - hh / 2, ww, Math.max(0.5, 0.35 * u * k))
  }
  function colpo(g, G, st, i, r, e, seme, su) {
    const u = G.u
    const cx = G.colX(i) + G.cw / 2, cy = G.y0 + (r + 0.5) * G.rh
    const a = (1 - e) * (0.75 + su * 0.25)
    const [cr, cg, cb] = rgb(st.colore)
    // l'anello
    g.strokeStyle = `rgba(${cr},${cg},${cb},${a * 0.9})`
    g.lineWidth = Math.max(1, 0.8 * u * (1 - e))
    const rr = G.cw * 0.45 + ease.out(e) * G.cw * (st.id === 'cassa' ? 1.9 : 1.2) * (1 + su * 0.4)
    g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke()
    // le schegge
    const rnd = kit.rng(seme)
    const n = st.id === 'hat' ? 2 : 4
    for (let j = 0; j < n; j++) {
      const ang = rnd() * TAU
      const v = (2 + rnd() * 4) * u * (1 + su * 0.5)
      const x = cx + Math.cos(ang) * v * ease.out(e) * 1.4
      const y = cy + Math.sin(ang) * v * ease.out(e) * 1.4 + e * e * 3 * u
      const s = (0.5 + rnd() * 0.6) * u * (1 - e * 0.5)
      g.fillStyle = `rgba(${cr},${cg},${cb},${a})`
      g.fillRect(x - s / 2, y - s / 2, s, s)
    }
  }
  function puntina(g, x, y, r) {
    g.fillStyle = 'rgba(0,0,0,.35)'
    g.beginPath(); g.arc(x + r * 0.2, y + r * 0.35, r, 0, TAU); g.fill()
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r)
    gr.addColorStop(0, '#ff8a8a'); gr.addColorStop(0.52, ROSSO); gr.addColorStop(1, '#6d0810')
    g.fillStyle = gr
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
  }
}
