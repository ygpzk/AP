// miniature/wrapped.js — 5BT Wrapped (27.11.2026): il Wrapped della chat di classe com'è davvero, sulla carta chiara
// della sua pagina. Dietro, aperte a ventaglio, due slide vere ritagliate dalla cattura (media/p/wrapped/cover.webp: solo
// numeri della chat, nessun nome); davanti la slide viva, nello stesso stile (nero, carta, blu), che sfoglia tre pagine
// vere: «non è una chat. è un archivio.» col contatore che corre fino a 51.748, il mese record (4.169) e cosa c'è oltre
// al testo (foto, sticker, video, vocali), con le barre che crescono. A sinistra lo script Node che legge l'export, e le
// nuvolette della chat (vuote: niente testi né nomi) che salgono. Il colpo: il numero che arriva, la slide che salta e
// i coriandoli. Col mouse sopra il ventaglio si apre, la slide si alza e si sfoglia più in fretta.

const CARTA = '#f4f2ec', BLU = '#0a74da', BLU2 = '#3d95ea', NERO = '#0b0b0b', GRIGIO = '#57534e'
// le tre slide della cattura (x, y, w, h nella cover 1280 × 720)
const SLIDE = [[63, 45, 354, 631], [463, 45, 354, 631], [863, 45, 354, 631]]
const CICLO = 15, PAGINA = 5
const it = (n) => Math.round(n).toLocaleString('it-IT', { useGrouping: 'always' })

export default async function crea(m) {
  const { kit } = m
  const [cover] = await Promise.all([
    kit.img(m.cattura || '/media/p/wrapped/cover.webp'),
    kit.font('gg sans', 400), kit.font('gg sans', 500), kit.font('gg sans', 600), kit.font('gg sans', 700), kit.font('gg sans', 800), kit.font('gg mono', 400), kit.font('gg mono', 700),
  ])
  const rnd = kit.rng('wrapped')
  const NUVOLE = Array.from({ length: 14 }, () => ({ x: rnd(), y: rnd(), w: 0.08 + rnd() * 0.1, r: 1 + Math.floor(rnd() * 3), v: 0.012 + rnd() * 0.02, mia: rnd() < 0.4, z: 0.5 + rnd() * 0.5 }))
  const CORIANDOLI = Array.from({ length: 40 }, () => ({ a: rnd() * kit.TAU, v: 0.4 + rnd(), giro: (rnd() - 0.5) * 12, c: [BLU, NERO, '#d9fdd3', BLU2, '#c9c2b3'][Math.floor(rnd() * 5)], s: 0.6 + rnd() * 0.8, d: rnd() * 0.15 }))

  let S = {}
  function ridimensiona(w, h) {
    const dpr = m.dpr
    const ch = h * 0.86, cw = (ch * 354) / 631
    // le due slide vere, con l'ombra, ritagliate una volta
    const vera = (i) => kit.strato(cw * 1.2, ch * 1.2, dpr, (g) => {
      const [x, y, sw, sh] = SLIDE[i]
      g.shadowColor = 'rgba(40,30,10,.28)'; g.shadowBlur = cw * 0.08; g.shadowOffsetY = cw * 0.03
      g.fillStyle = '#fff'; g.fillRect(cw * 0.1, ch * 0.1, cw, ch)
      g.shadowColor = 'transparent'
      g.drawImage(cover, x, y, sw, sh, cw * 0.1, ch * 0.1, cw, ch)
    })
    const fondo = kit.strato(w, h, dpr, (g) => {
      g.fillStyle = CARTA; g.fillRect(0, 0, w, h)
      const r = g.createRadialGradient(w * 0.7, h * 0.45, h * 0.1, w * 0.7, h * 0.45, w * 0.8)
      r.addColorStop(0, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(225,219,205,.6)')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(Math.round(w * 0.685), 0, 1, h) // il filo in mezzo, come sulla pagina
    })
    S = { w, h, cw, ch, sx: vera(0), dx: vera(2), fondo }
  }

  // ── la slide viva ──
  function barre(g, x, y, w, voci, k, fs) {
    voci.forEach(([nome, v, max, blu], i) => {
      const kk = kit.ease.out(kit.clamp(k * 1.6 - i * 0.22)), yy = y + i * fs * 2.55
      g.font = `500 ${fs}px "gg sans"`; g.fillStyle = '#1c1917'; g.textAlign = 'left'; g.fillText(nome, x, yy)
      g.font = `400 ${fs * 0.95}px "gg mono"`; g.textAlign = 'right'; g.fillText(it(v * kk), x + w, yy)
      g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(x, yy + fs * 0.45, w, fs * 0.42)
      g.fillStyle = blu ? BLU : '#57534e'; g.fillRect(x, yy + fs * 0.45, w * (v / max) * kk, fs * 0.42)
    })
    g.textAlign = 'left'
  }
  function pagina(g, n, e, cw, ch, su) {
    const p = cw * 0.1, fs = cw * 0.055
    const fondi = [NERO, '#f0ebe0', '#f7f5ef']
    g.fillStyle = fondi[n]; g.fillRect(0, 0, cw, ch)
    const chiaro = n === 0
    const ink = chiaro ? '#f5f5f4' : '#1c1917'
    g.textBaseline = 'alphabetic'
    // «come si calcola», in alto a destra
    g.font = `400 ${fs * 0.78}px "gg mono"`
    const pw = g.measureText('come si calcola').width + fs * 1.1, px = cw - p * 0.6 - pw, py = ch * 0.05
    g.strokeStyle = su > 0.3 ? BLU : chiaro ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(0.6, cw * 0.005)
    kit.tondo(g, px, py, pw, fs * 1.4, fs * 0.7); g.stroke()
    g.fillStyle = su > 0.3 ? BLU : ink; g.fillText('come si calcola', px + fs * 0.55, py + fs * 0.98)
    const eyebrow = (s, y) => { g.font = `400 ${fs * 0.8}px "gg mono"`; g.fillStyle = chiaro ? BLU2 : BLU; if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.12}px`; g.fillText(s, p, y); if ('letterSpacing' in g) g.letterSpacing = '0px' }
    if (n === 0) {
      eyebrow('5ªBT · WRAPPED', ch * 0.3)
      g.font = `600 ${fs * 1.75}px "gg sans"`; g.fillStyle = ink; g.fillText('non è una chat.', p, ch * 0.39)
      g.fillStyle = BLU2; g.fillText('è un archivio.', p, ch * 0.475)
      const k = kit.ease.out(kit.clamp((e - 0.35) / 1.5))
      g.font = `600 ${fs * 4.1}px "gg sans"`; g.fillStyle = ink
      if ('letterSpacing' in g) g.letterSpacing = `${-fs * 0.12}px`
      g.fillText(it(51748 * k), p - fs * 0.1, ch * 0.64)
      if ('letterSpacing' in g) g.letterSpacing = '0px'
      g.font = `500 ${fs * 0.92}px "gg sans"`; g.fillStyle = ink
      g.fillText('messaggi in un solo gruppo,', p, ch * 0.7); g.fillText('dal 2022 al 2026.', p, ch * 0.745)
      g.font = `400 ${fs * 0.85}px "gg sans"`; g.fillStyle = 'rgba(245,245,244,.75)'
      g.fillText('scorri in giù per andare avanti.', p, ch * 0.81)
    } else if (n === 1) {
      eyebrow('IL TEMPO', ch * 0.25)
      g.font = `600 ${fs * 1.6}px "gg sans"`; g.fillStyle = ink; g.fillText('il mese record', p, ch * 0.33)
      const k = kit.ease.out(kit.clamp((e - 0.2) / 1.3))
      g.font = `600 ${fs * 4.2}px "gg sans"`
      if ('letterSpacing' in g) g.letterSpacing = `${-fs * 0.12}px`
      g.fillText(it(4169 * k), p - fs * 0.1, ch * 0.49)
      if ('letterSpacing' in g) g.letterSpacing = '0px'
      g.font = `500 ${fs * 0.92}px "gg sans"`; g.fillText('messaggi in un mese:', p, ch * 0.55); g.fillText('il calendario più pieno', p, ch * 0.595)
      eyebrow('I TRE MESI PIÙ PIENI', ch * 0.66)
      barre(g, p, ch * 0.71, cw - p * 2, [['maggio 2023', 4169, 4169, true], ['febbraio 2024', 3889, 4169], ['gennaio 2023', 2838, 4169]], kit.clamp((e - 0.5) / 1.6), fs)
    } else {
      eyebrow('APERTURA', ch * 0.22)
      g.font = `600 ${fs * 1.45}px "gg sans"`; g.fillStyle = ink; g.fillText('tradotto in pagine', p, ch * 0.29); g.fillText('e minuti', p, ch * 0.345)
      const k = kit.ease.out(kit.clamp((e - 0.2) / 1.2))
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(p, ch * 0.375, cw - p * 2, 1); g.fillRect(p, ch * 0.445, cw - p * 2, 1)
      g.font = `600 ${fs}px "gg sans"`; g.fillStyle = ink
      g.fillText(`≈ ${it(819 * k)} pagine`, p, ch * 0.415); g.fillText(`≈ ${it(16 * k)} ore di lettura`, p, ch * 0.485)
      eyebrow('OLTRE AL TESTO', ch * 0.56)
      barre(g, p, ch * 0.61, cw - p * 2, [['foto', 3116, 3116, true], ['sticker', 1441, 3116], ['video', 786, 3116], ['vocali', 486, 3116]], kit.clamp((e - 0.4) / 1.8), fs)
    }
    // in basso: il numero della slide e le frecce
    const nr = ['01/74', '09/74', '04/74'][n]
    g.font = `400 ${fs * 0.9}px "gg mono"`
    const bw = g.measureText(nr).width + fs * 0.9, by = ch - p * 0.5 - fs * 1.7
    g.fillStyle = chiaro ? '#f5f5f4' : '#fbfaf7'; kit.tondo(g, p * 0.5, by, bw, fs * 1.7, fs * 0.3); g.fill()
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.stroke()
    g.fillStyle = '#57534e'; g.fillText(nr, p * 0.5 + fs * 0.45, by + fs * 1.18)
    for (let i = 0; i < 2; i++) {
      const bx = cw - p * 0.5 - (2 - i) * fs * 2.1 + fs * 0.2
      g.fillStyle = '#fbfaf7'; kit.tondo(g, bx, by - fs * 0.3, fs * 1.9, fs * 2, fs * 0.3); g.fill(); g.stroke()
      g.fillStyle = '#1c1917'; g.font = `400 ${fs * 1.1}px "gg sans"`; g.textAlign = 'center'; g.fillText(i ? '↓' : '↑', bx + fs * 0.95, by + fs * 1.15); g.textAlign = 'left'
    }
  }

  let prima = -1, extra = 0
  function frame(t, dt) {
    const { w, h } = m
    if (!S.fondo || S.w !== w || S.h !== h) ridimensiona(w, h)
    if (t < prima) extra = 0
    prima = t
    const su = m.su
    extra += (dt || 0) * su * 0.8
    const tau = t + extra, c = kit.fract(tau / CICLO) * CICLO
    const g = m.g
    const { cw, ch } = S

    // ── 1. la carta e le nuvolette della chat che salgono (vuote: solo le righe grigie) ──
    kit.metti(g, S.fondo, 0, 0, w, h)
    for (const b of NUVOLE) {
      const y = (1.1 - kit.fract(b.y + tau * b.v * (1 + su))) * h * 1.2 - h * 0.1, x = b.x * w * 0.62
      const bw = b.w * w, bh = h * (0.045 + b.r * 0.028), r = h * 0.02
      g.globalAlpha = 0.5 * b.z * kit.smooth(0, 0.15, y / h) * kit.smooth(1.05, 0.85, y / h)
      g.fillStyle = b.mia ? '#d9fdd3' : '#ffffff'
      kit.tondo(g, x, y, bw, bh, r); g.fill()
      g.fillStyle = 'rgba(0,0,0,.08)'
      for (let i = 0; i < b.r; i++) g.fillRect(x + bw * 0.1, y + h * 0.022 + i * h * 0.028, bw * (i === b.r - 1 ? 0.45 : 0.8), h * 0.011)
    }
    g.globalAlpha = 1

    // ── 2. il titolo, come la testata della pagina vera ──
    const tx = w * 0.05
    g.textBaseline = 'alphabetic'; g.textAlign = 'left'
    g.font = `400 ${Math.max(6, h * 0.04)}px "gg mono"`; g.fillStyle = BLU
    if ('letterSpacing' in g) g.letterSpacing = `${h * 0.006}px`
    g.fillText('5ªBT · WRAPPED · NODE.JS', tx, h * 0.12)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    const tsz = Math.min(w * 0.082, h * 0.15)
    g.font = `700 ${tsz}px "gg sans"`; g.fillStyle = '#1c1917'
    g.fillText('5BT', tx, h * 0.12 + tsz * 1.05)
    g.fillStyle = BLU; g.fillText('Wrapped', tx, h * 0.12 + tsz * 2.0)

    // ── 3. lo script nel terminale: legge l'export e conta ──
    const kx = tx, ky = h * 0.6, kw = w * 0.37, kh = h * 0.32, fs = Math.max(4, Math.min(h * 0.036, kw / 30 / 0.6))
    g.fillStyle = 'rgba(30,20,0,.18)'; kit.tondo(g, kx + h * 0.008, ky + h * 0.014, kw, kh, h * 0.025); g.fill()
    g.fillStyle = '#121212'; kit.tondo(g, kx, ky, kw, kh, h * 0.025); g.fill()
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(kx + h * 0.035 + i * h * 0.03, ky + h * 0.03, h * 0.009, 0, kit.TAU); g.fill() })
    const righe = [['> node analizza.mjs chat.zip', '#e7e5e4'], ['analizza: 51.748 messaggi', '#9ca3af'], ['  inglese + italiano: ok', '#9ca3af'], ['  dati in dati.json ✓', '#7ee787']]
    g.font = `400 ${fs}px "gg mono"`
    const pronti = c < 1.2 ? 0 : 1 + Math.floor(kit.clamp((c - 2.2) / 2.4) * 3)
    g.save(); g.beginPath(); g.rect(kx, ky, kw, kh); g.clip()
    righe.forEach(([s, col], i) => {
      if (i > pronti) return
      const y = ky + h * 0.1 + i * fs * 1.45
      const txt = i === 0 ? s.slice(0, Math.floor(kit.clamp(c / 1.2) * s.length)) : s
      g.fillStyle = col; g.fillText(txt, kx + h * 0.03, y)
      if (i === Math.min(pronti, 3) && Math.floor(tau * 2.5) % 2 === 0) { g.fillStyle = '#e7e5e4'; g.fillRect(kx + h * 0.03 + g.measureText(txt).width + fs * 0.2, y - fs * 0.8, fs * 0.55, fs * 0.95) }
    })
    g.restore()

    // ── 4. il ventaglio: due slide vere dietro, la viva davanti ──
    const cx = w * 0.685, cy = h * 0.5, apri = 0.09 + 0.07 * su
    const pagine = Math.floor(c / PAGINA), e = c - pagine * PAGINA
    const scatto = (pagine === 0 && e > 1.85) ? Math.exp(-(e - 1.85) * 3) : 0 // il numero è arrivato
    for (const [lay, segno] of [[S.sx, -1], [S.dx, 1]]) {
      kit.con(g, cx + segno * w * (0.105 + 0.06 * su + scatto * 0.02), cy + h * 0.02, segno * (apri + scatto * 0.05), 0.9, () => {
        g.drawImage(lay, -cw * 0.6, -ch * 0.6, cw * 1.2, ch * 1.2)
        g.fillStyle = 'rgba(244,242,236,.25)'; g.fillRect(-cw / 2, -ch / 2, cw, ch)
      })
    }
    const alza = su * 0.04 + scatto * 0.05 * Math.sin(scatto * 9)
    g.save()
    g.translate(cx, cy - su * h * 0.015); g.rotate(Math.sin(tau * 0.5) * 0.008); g.scale(1 + alza, 1 + alza)
    g.shadowColor = 'rgba(40,30,10,.35)'; g.shadowBlur = cw * (0.1 + su * 0.06); g.shadowOffsetY = cw * 0.04
    g.fillStyle = NERO; g.fillRect(-cw / 2, -ch / 2, cw, ch)
    g.shadowColor = 'transparent'
    g.beginPath(); g.rect(-cw / 2, -ch / 2, cw, ch); g.clip()
    g.translate(-cw / 2, -ch / 2)
    // lo sfoglio: la pagina sale e arriva la prossima, come sul telefono
    const via = kit.ease.inOut(kit.clamp((e - (PAGINA - 0.45)) / 0.45))
    g.save(); g.translate(0, -via * ch); pagina(g, pagine, e, cw, ch, su); g.restore()
    if (via > 0) { g.save(); g.translate(0, (1 - via) * ch); pagina(g, (pagine + 1) % 3, 0, cw, ch, su); g.restore() }
    // la barra di avanzamento in alto
    g.fillStyle = pagine === 0 && via < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)'; g.fillRect(0, 0, cw, ch * 0.008 + 1)
    g.fillStyle = BLU; g.fillRect(0, 0, cw * ((pagine + kit.clamp(e / PAGINA)) / 3), ch * 0.008 + 1)
    g.restore()

    // ── 5. il colpo: i coriandoli dal numero ──
    if (pagine === 0 && e > 1.85 && e < 4) {
      const k = e - 1.85, ox = cx - cw * 0.15, oy = cy + ch * 0.1
      for (const p of CORIANDOLI) {
        const kk = k - p.d
        if (kk <= 0) continue
        const d = (1 - Math.exp(-kk * 3)) * (0.3 + p.v) * w * 0.28
        const x = ox + Math.cos(p.a) * d * 1.2, y = oy + Math.sin(p.a) * d * 0.8 + kk * kk * h * 0.18
        g.save(); g.translate(x, y); g.rotate(p.giro * kk); g.scale(Math.cos(kk * 8 + p.a), 1)
        g.globalAlpha = kit.clamp((4 - e) * 1.2) * kit.clamp(kk * 8)
        g.fillStyle = p.c; g.fillRect(-h * 0.012 * p.s, -h * 0.006 * p.s, h * 0.024 * p.s, h * 0.012 * p.s)
        g.restore()
      }
      g.globalAlpha = 1
    }
    kit.granella(g, w, h, 0.035, tau)
  }

  return { frame, ridimensiona, titolo: false, fermo: 2.6 }
}
