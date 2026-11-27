// miniature/direttaos.js — Diretta OS: la tela delle sovrimpressioni in onda, coi suoi pezzi veri.
// Il nome animato (qui è il titolo), i follower, le spie, il meteo con gli animali sotto l'ombrello,
// l'argomento del podcast che gira come un rullo, la tastiera e il mouse veri coi tasti che si accendono,
// le schede meme/pubblicità, la Red Bull di oggi, «a letto fra». Ogni 16 s parte un «torno subito»:
// i pezzi si spengono uno dopo l'altro, resta la scena in pixel art (cattura vera) con la scritta viva,
// poi tornano tutti, con una Red Bull e un follower in più.
// Col mouse sopra la camera si allontana: la tela finisce nell'anteprima della regia vera, e un clic
// sull'interruttore «Meteo» spegne e riaccende il suo pezzo.

const BASE = '/media/p/direttaos/'
const GIRO = 16
const LIME = '#ccff00', VIOLA = '#9d00ff'
const ARGOMENTI = ['Pizza con l’ananas: sì o no?', 'Il cibo più sopravvalutato del mondo', 'Red Bull: quante sono troppe?',
  'Il meme dell’anno', 'Colazione dolce o salata', 'Gaming su pc o su console', 'Il superpotere più inutile che vorresti']
// le scene «torno subito» e il loro tasto nella regia (01.webp: centro x del tasto, la scritta)
const SCENE = [
  { im: '02', perche: 'sistemo la postazione', tasto: [797, 'Sistema'] },
  { im: '04', perche: 'vado a prendere la legna', tasto: [163, 'Legna'] },
]

// un'immagine del sito: basta onload (decode() in certi browser senza finestra non risponde mai)
const cache = new Map()
function carica(src) {
  if (!cache.has(src)) cache.set(src, new Promise((ok, no) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = () => no(new Error('immagine mancante: ' + src))
    i.src = src
  }))
  return cache.get(src)
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, rng, strato, tondo, TAU, fract } = kit
  const [regia, pixel1, pixel2, tastiera, spie, meteo, cover] = await Promise.all([
    carica(BASE + '01.webp'), carica(BASE + '02.webp'), carica(BASE + '04.webp'), carica(BASE + '07.webp'),
    carica(BASE + '08.webp'), carica(BASE + '06.webp'), carica(m.cattura || BASE + 'cover.webp'),
    kit.font('Pricedown', 700), kit.font('gg sans', 700), kit.font('gg sans', 800), kit.font('gg mono'),
  ])
const pixel = [pixel1, pixel2]
  // gli animali col loro ombrello (ritagli della cattura del meteo)
  const ANIMALI = [[330, 130, 82, 94], [538, 130, 70, 94], [788, 130, 84, 94]]
  const RIGHE_TASTI = [[490, 'qwertyuiop', 145, 40], [530, 'qwertyuiop', 145, 40], [570, 'asdfghjkl', 155, 40], [610, 'zxcvbnm', 172, 40.2]]
  const BATTUTA = 'ciao chat torno subito vado a prendere una red bull '

  // le larghezze dei testi, misurate una volta sola (le coordinate della tela sono fisse)
  const larghezze = new Map()
  const larga = (g, s) => {
    const c = g.font + '|' + s
    let v = larghezze.get(c)
    if (!v) { v = g.measureText(s); larghezze.set(c, v) }
    return v
  }
  let W = 0, H = 0, k = 1, ox = 0, oy = 0
  let uscita = null, ug = null, fondo = null, nuvola = null
  let tempoMeteo = 1 // 1 acceso (l'interruttore in regia)

  function ridimensiona(w, h) {
    if (!w || !h) return
    W = w; H = h
    k = Math.min(w / 1280, h / 720); ox = (w - 1280 * k) / 2; oy = (h - 720 * k) / 2
    const d = m.dpr
    uscita = document.createElement('canvas')
    uscita.width = Math.max(1, Math.round(w * d)); uscita.height = Math.max(1, Math.round(h * d))
    ug = uscita.getContext('2d')
    // al posto della webcam: un fondo neutro scuro, con le luci sfocate della stanza
    fondo = strato(w, h, d, (g) => {
      const r = g.createLinearGradient(0, 0, 0, h)
      r.addColorStop(0, '#120d18'); r.addColorStop(1, '#07060a')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      const rr = rng(22)
      for (let i = 0; i < 14; i++) {
        const x = rr() * w, y = rr() * h * 0.9, s = (0.04 + rr() * 0.12) * w
        const c = i % 3 === 0 ? '204,255,0' : i % 3 === 1 ? '157,0,255' : '255,120,200'
        const b = g.createRadialGradient(x, y, 0, x, y, s)
        b.addColorStop(0, `rgba(${c},${0.05 + rr() * 0.06})`); b.addColorStop(0.7, `rgba(${c},${0.02})`); b.addColorStop(1, `rgba(${c},0)`)
        g.fillStyle = b; g.fillRect(x - s, y - s, s * 2, s * 2)
      }
      kit.vignetta(g, w, h, 0.55)
    })
    nuvola = strato(140, 70, d, (g) => {
      const n = g.createLinearGradient(0, 0, 0, 70)
      n.addColorStop(0, 'rgba(235,235,240,.9)'); n.addColorStop(1, 'rgba(150,150,160,.75)')
      g.fillStyle = n
      g.beginPath(); g.arc(45, 42, 24, 0, TAU); g.arc(78, 32, 28, 0, TAU); g.arc(105, 45, 20, 0, TAU); g.rect(30, 42, 85, 24); g.fill()
    })
  }

  // ── i pezzi, in coordinate della tela vera (1280 × 720) ──
  // quanto è acceso il pezzo i (0 spento, 1 acceso) durante il «torno subito»
  function acceso(i, q) {
    if (q < 7.5 || q > 15.5) return 1
    if (q < 10.5) return 1 - ease.inOut(clamp((q - 7.5 - i * 0.07) / 0.38))
    return clamp(ease.outBack(clamp((q - 12.9 - i * 0.08) / 0.5)), 0, 1.2)
  }
  function pezzo(g, p, ax, ay, fn) {
    if (p <= 0.001) return
    g.save()
    g.globalAlpha *= clamp(p)
    g.translate(ax, ay); const s = 0.55 + 0.45 * p; g.scale(s, s); g.translate(-ax, -ay)
    fn()
    g.restore()
  }
  const testo = (g, s, x, y, size, color, peso = 700, align = 'left', famiglia = 'gg sans') => {
    g.font = `${peso} ${size}px "${famiglia}"`; g.textAlign = align; g.fillStyle = color; g.fillText(s, x, y)
  }

  function nome(g, t, giro, p) {
    // il nome animato: lettere coi colori che girano, e un'animazione diversa a ogni giro
    const s = 'Diretta OS'
    g.font = '700 84px "Pricedown"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
    g.lineJoin = 'round'
    const anim = giro % 3
    let x = 34
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], cw = larga(g, ch).width
      if (ch !== ' ') {
        let dy = 0, sc = 1, a = 1
        if (anim === 0) dy = Math.sin(t * 3.2 - i * 0.55) * 7
        else if (anim === 1) { const q = fract(t * 0.45 - i * 0.06); sc = 1 + Math.max(0, Math.sin(q * TAU)) * 0.18 * (q < 0.5 ? 1 : 0); dy = -Math.max(0, Math.sin(q * TAU)) * 10 * (q < 0.5 ? 1 : 0) }
        else { const r = kit.rumore(t * 6 + i * 3.1, i); a = r > 0.86 ? 0.25 : 1; dy = Math.sin(t * 1.6 + i) * 2 }
        const hue = (t * 40 + i * 32) % 360
        const col = `hsl(${hue},100%,62%)`
        g.save(); g.translate(x + cw / 2, 108 + dy); g.scale(sc, sc)
        g.globalAlpha *= a
        // l'alone al neon: un tratto largo e trasparente sotto la lettera
        g.strokeStyle = `hsla(${hue},100%,62%,.35)`; g.lineWidth = 10; g.strokeText(ch, -cw / 2, 0)
        g.fillStyle = col; g.fillText(ch, -cw / 2, 0)
        g.restore()
      }
      x += cw
    }
  }

  function follower(g, t, q, giro) {
    testo(g, 'FOLLOWER', 38, 160, 15, '#a9a6b4', 800)
    // l'icona viola
    g.fillStyle = '#9146ff'
    g.beginPath(); g.moveTo(40, 172); g.lineTo(66, 172); g.lineTo(66, 190); g.lineTo(58, 198); g.lineTo(50, 198); g.lineTo(45, 203); g.lineTo(45, 198); g.lineTo(40, 198); g.closePath(); g.fill()
    g.fillStyle = '#fff'; g.fillRect(50, 178, 3, 8); g.fillRect(57, 178, 3, 8)
    const nuovo = q > 14.4
    const n = 13 + giro + (nuovo ? 1 : 0)
    const pop = nuovo ? Math.exp(-(q - 14.4) * 5) : 0
    g.save(); g.translate(76, 196); g.scale(1 + pop * 0.6, 1 + pop * 0.6)
    testo(g, String(n), 0, 0, 30, pop > 0.05 ? LIME : '#fff', 800)
    g.restore()
    if (pop > 0.02) {
      // i coriandoli del follower nuovo
      const r = rng(giro * 5 + 2)
      for (let i = 0; i < 16; i++) {
        const a = r() * TAU, v = 30 + r() * 70, e = 1 - pop
        g.fillStyle = i % 2 ? LIME : VIOLA
        g.globalAlpha = pop
        g.fillRect(90 + Math.cos(a) * v * e, 186 + Math.sin(a) * v * e + e * e * 30, 5, 5)
      }
      g.globalAlpha = 1
    }
  }

  function spieP(g, t, q) {
    const x = 1280 - 14 - 447 * 0.82, y = 12
    g.save(); g.globalCompositeOperation = 'lighten'
    g.drawImage(spie, 815, 18, 447, 177, x, y, 447 * 0.82, 177 * 0.82)
    g.restore()
    // il respiro rosso dietro (sono spente: sei muto) e il microfono che si accende quando parli
    const parla = fract(t / 5.3) > 0.55 && fract(t / 5.3) < 0.82
    const cx = x + 0.82 * (1318 - 815) / 2 + 0, cy = y + 0.82 * 75
    if (parla) {
      g.fillStyle = '#0c090f'; g.beginPath(); g.arc(x + 0.82 * 67, cy, 31, 0, TAU); g.fill()
      g.strokeStyle = LIME; g.lineWidth = 4; g.beginPath(); g.arc(x + 0.82 * 67, cy, 26, 0, TAU); g.stroke()
      g.strokeStyle = 'rgba(204,255,0,.25)'; g.lineWidth = 10; g.stroke()
      // il microfono
      const mx = x + 0.82 * 67
      g.fillStyle = LIME; tondo(g, mx - 5, cy - 14, 10, 17, 5); g.fill()
      g.strokeStyle = LIME; g.lineWidth = 2.5; g.beginPath(); g.arc(mx, cy - 3, 9, 0.1, Math.PI - 0.1); g.moveTo(mx, cy + 6); g.lineTo(mx, cy + 12); g.stroke()
      // le onde della voce
      for (let i = 0; i < 3; i++) { const r = 32 + fract(t * 1.8 + i / 3) * 18; g.strokeStyle = `rgba(204,255,0,${0.4 * (1 - fract(t * 1.8 + i / 3))})`; g.lineWidth = 2; g.beginPath(); g.arc(mx, cy, r, 0, TAU); g.stroke() }
    }
    void cx
  }

  function meteoP(g, t) {
    // la pioggia
    const r = rng(4)
    g.strokeStyle = 'rgba(170,190,255,.35)'; g.lineWidth = 1.4
    g.beginPath()
    for (let i = 0; i < 46; i++) {
      const x0 = 540 + r() * 350, v = 0.9 + r() * 0.6, f = fract(t * v * 0.9 + r())
      const y = -10 + f * 250
      g.moveTo(x0 - y * 0.05, y); g.lineTo(x0 - y * 0.05 - 1.2, y + 12)
    }
    g.stroke()
    // le nuvole che passano
    g.globalAlpha *= 0.9
    g.drawImage(nuvola, 548 + Math.sin(t * 0.3) * 10, 40, 80, 40)
    g.drawImage(nuvola, 800 + Math.sin(t * 0.25 + 2) * 12, 26, 90, 45)
    g.globalAlpha /= 0.9
    // l'icona vera, la temperatura e il cielo (senza la città)
    g.save(); g.globalCompositeOperation = 'lighten'
    g.drawImage(meteo, 510, 22, 95, 96, 608, 14 + Math.sin(t * 1.3) * 2, 80, 81)
    g.restore()
    testo(g, '9°', 692, 78, 66, '#fff', 800)
    testo(g, 'pioggia · 5°/9°', 695, 110, 22, '#fff', 700)
    // la riga dove camminano gli animali, lime → viola
    const lg = g.createLinearGradient(540, 0, 890, 0)
    lg.addColorStop(0, 'rgba(204,255,0,0)'); lg.addColorStop(0.15, LIME); lg.addColorStop(0.85, VIOLA); lg.addColorStop(1, 'rgba(157,0,255,0)')
    g.fillStyle = lg; g.fillRect(540, 218, 350, 2.5)
    g.save(); g.globalCompositeOperation = 'lighten'
    ANIMALI.forEach(([sx, sy, sw, sh], i) => {
      const f = fract(t * 0.045 + i / 3)
      const x = 530 + f * 350, passo = Math.abs(Math.sin(t * 7 + i)) * 3
      const a = smooth(0, 0.08, f) * (1 - smooth(0.92, 1, f))
      g.globalAlpha = a
      g.drawImage(meteo, sx, sy, sw, sh, x, 218 - sh * 0.5 - passo, sw * 0.5, sh * 0.5)
    })
    g.restore()
  }

  function argomento(g, t, q, giro) {
    // il rullo: «argomento a caso» pesca dal cappello e si ferma
    const scelto = (giro * 3 + 1) % ARGOMENTI.length
    const giraDa = 0.8, giraA = 2.6
    const p = clamp((q - giraDa) / (giraA - giraDa))
    const pill = 'ARGOMENTO ' + (giro + 1)
    g.font = '800 15px "gg sans"'
    const pw = larga(g, pill).width + 26
    g.fillStyle = VIOLA; tondo(g, 640 - pw / 2, 256, pw, 24, 12); g.fill()
    testo(g, pill, 640, 274, 15, '#fff', 800, 'center')
    // la finestra del rullo
    g.save()
    g.beginPath(); g.rect(200, 284, 880, 92); g.clip()
    const voce = (i, y, a) => {
      g.globalAlpha = a
      const s = ARGOMENTI[((i % ARGOMENTI.length) + ARGOMENTI.length) % ARGOMENTI.length]
      g.font = '800 40px "gg sans"'
      const sz = Math.min(40, 40 * 820 / Math.max(1, larga(g, s).width))
      g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 6
      g.font = `800 ${sz}px "gg sans"`; g.textAlign = 'center'
      g.strokeText(s, 640, y); g.fillStyle = '#fff'; g.fillText(s, 640, y)
    }
    if (p <= 0 || p >= 1) voce(p >= 1 ? scelto : scelto - 3, 342, 1)
    else {
      // gira forte e rallenta fino a fermarsi sulla voce scelta
      const giri = 9
      const pos = (scelto - giri) + ease.out(p) * giri
      const base = Math.floor(pos), f = pos - base
      for (let j = -1; j <= 1; j++) voce(base + j, 342 + (j - f) * 52, 1 - Math.abs(j - f) * 0.6)
      const sfoca = (1 - ease.out(p))
      g.globalAlpha = 1; g.fillStyle = `rgba(12,9,15,${sfoca * 0.35})`; g.fillRect(200, 284, 880, 92)
    }
    g.restore()
    g.globalAlpha = 1
    const da = Math.max(0, q - giraA)
    const mm = Math.floor(da / 60), ss = Math.floor(da % 60)
    g.fillStyle = '#ff3d4a'; g.beginPath(); g.arc(600, 392, 4.5, 0, TAU); g.fill()
    testo(g, `da ${mm}:${String(ss).padStart(2, '0')}`, 612, 398, 19, '#fff', 400, 'left', 'gg mono')
    // il lampo lime quando si ferma
    const lampo = q > giraA && q < giraA + 0.6 ? 1 - (q - giraA) / 0.6 : 0
    if (lampo) { g.strokeStyle = `rgba(204,255,0,${lampo})`; g.lineWidth = 3; tondo(g, 220 - lampo * 10, 292 - lampo * 6, 840 + lampo * 20, 74 + lampo * 12, 18); g.stroke() }
  }

  function tastieraP(g, t, q) {
    const s = 0.36, x0 = 22, y0 = 590
    g.save(); g.globalCompositeOperation = 'lighten'
    g.drawImage(tastiera, 62, 405, 896, 280, x0, y0, 896 * s, 280 * s)
    g.drawImage(tastiera, 993, 372, 167, 313, x0 + 336, y0 - 12, 167 * s, 313 * s)
    g.restore()
    // i tasti premuti: si battono le lettere di una frase, uno ogni 0,13 s
    g.save(); g.globalCompositeOperation = 'lighter'
    for (let j = 0; j < 4; j++) {
      const n = Math.floor(t / 0.13) - j
      const ch = BATTUTA[((n % BATTUTA.length) + BATTUTA.length) % BATTUTA.length]
      const vita = 1 - (t / 0.13 - Math.floor(t / 0.13) + j) / 4
      let kx = 0, ky = 0, kw = 34
      if (ch === ' ') { kx = 337; ky = 652; kw = 230 }
      else for (const [yy, riga, x1, passo] of RIGHE_TASTI.slice(1)) { const i = riga.indexOf(ch); if (i >= 0) { kx = x1 + 50 + i * passo; ky = yy; break } }
      if (!ky) continue
      const px = x0 + (kx - 62) * s, py = y0 + (ky - 405) * s
      g.fillStyle = `rgba(204,255,0,${0.85 * vita})`
      tondo(g, px - kw * s / 2, py - 15 * s, kw * s, 30 * s, 3); g.fill()
      g.fillStyle = `rgba(204,255,0,${0.18 * vita})`
      tondo(g, px - kw * s / 2 - 4, py - 15 * s - 4, kw * s + 8, 30 * s + 8, 6); g.fill()
    }
    // il clic del mouse
    if (fract(t / 1.7) < 0.08) { g.fillStyle = 'rgba(204,255,0,.6)'; tondo(g, x0 + 336 + 14 * s, y0 - 12 + 60 * s, 60 * s, 80 * s, 6); g.fill() }
    g.restore()
  }

  function redbull(g, q, giro) {
    const n = giro + (q > 13.7 ? 1 : 0)
    const pop = q > 13.7 ? Math.exp(-(q - 13.7) * 5) : 0
    g.save(); g.translate(380, 470); g.scale(1 + pop * 0.5, 1 + pop * 0.5)
    g.fillStyle = LIME; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill()
    testo(g, String(n), 0, 7, 20, '#141414', 800, 'center')
    g.restore()
    testo(g, 'Red Bull', 404, 466, 15, '#fff', 800)
    testo(g, 'oggi', 404, 482, 11, '#a9a6b4', 700)
  }

  function schede(g, t, q, giro) {
    // meme e pubblicità: le schede vere della tela, che si danno il cambio
    const voci = [
      { tag: 'MEME', col: '#ff4fa3', da: 'pzkko.it · dalla scena 3D', tit: 'il pomodoro', sub: 'matura, scoppia, ti sporca la telecamera', src: [880, 405, 110, 115] },
      { tag: 'ADV', col: VIOLA, da: 'pzkko.it', tit: 'Angoli', sub: 'quanti gradi sono? a occhio', src: [900, 545, 80, 87] },
    ]
    voci.forEach((v, i) => {
      const y = 420 + i * 120
      const f = fract(t / 6 + i * 0.5)
      g.save(); g.globalCompositeOperation = 'lighten'
      const [sx, sy, sw, sh] = v.src, sc = 88 / Math.max(sw, sh)
      g.translate(940, y + 42); g.rotate(Math.sin(t * 1.4 + i) * 0.06); g.scale(1 + Math.sin(t * 2 + i) * 0.03, 1 + Math.sin(t * 2 + i) * 0.03)
      g.drawImage(cover, sx, sy, sw, sh, -sw * sc / 2, -sh * sc / 2, sw * sc, sh * sc)
      g.restore()
      g.font = '800 12px "gg sans"'
      const tw = larga(g, v.tag).width + 12
      g.fillStyle = v.col; tondo(g, 993, y + 4, tw, 17, 4); g.fill()
      testo(g, v.tag, 999, y + 17, 12, '#fff', 800)
      testo(g, v.da, 999 + tw + 2, y + 17, 13, '#fff', 700)
      testo(g, v.tit, 993, y + 48, 27, LIME, 800)
      testo(g, v.sub, 993, y + 72, 14, '#e9e7ee', 600)
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(993, y + 88, 254, 3)
      const lg = g.createLinearGradient(993, 0, 1247, 0); lg.addColorStop(0, LIME); lg.addColorStop(1, VIOLA)
      g.fillStyle = lg; g.fillRect(993, y + 88, 254 * f, 3)
    })
  }

  function aLetto(g, t) {
    const tot = 12 * 3600 + 54 * 60 + 33 - Math.floor(t)
    const hh = Math.floor(tot / 3600), mm = Math.floor(tot / 60) % 60, ss = tot % 60
    // la luna
    g.fillStyle = LIME; g.beginPath(); g.arc(1066, 672, 8, 0, TAU); g.fill()
    g.fillStyle = '#0c090f'; g.beginPath(); g.arc(1071, 668, 7, 0, TAU); g.fill()
    testo(g, 'a letto fra', 1082, 678, 16, '#fff', 700)
    testo(g, `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 1258, 681, 25, '#fff', 800, 'right')
  }

  function cornice(g, t) {
    const a = t * 0.5
    const lg = g.createLinearGradient(640 + Math.cos(a) * 700, 360 + Math.sin(a) * 400, 640 - Math.cos(a) * 700, 360 - Math.sin(a) * 400)
    lg.addColorStop(0, LIME); lg.addColorStop(0.5, VIOLA); lg.addColorStop(1, '#ff4fa3')
    g.strokeStyle = lg
    g.globalAlpha = 0.18; g.lineWidth = 22; g.strokeRect(0, 0, 1280, 720)
    g.globalAlpha = 0.35; g.lineWidth = 12; g.strokeRect(0, 0, 1280, 720)
    g.globalAlpha = 1; g.lineWidth = 5; g.strokeRect(0, 0, 1280, 720)
  }

  function torno(g, q, giro, t) {
    // la scena in pixel art: entra quando i pezzi sono spenti
    const vis = smooth(8.0, 8.7, q) * (1 - smooth(12.6, 13.3, q))
    if (vis <= 0) return 0
    const sc = SCENE[giro % 2], im = pixel[giro % 2]
    const z = 1 + (q - 8) * 0.012
    g.save(); g.globalAlpha = vis
    g.translate(640, 360); g.scale(z, z); g.translate(-640, -360)
    g.drawImage(im, 0, 0, 1280, 720)
    g.restore()
    g.save(); g.globalAlpha = vis
    // una velatura per leggere la scritta
    const v = g.createLinearGradient(0, 220, 0, 470)
    v.addColorStop(0, 'rgba(10,6,16,0)'); v.addColorStop(0.5, 'rgba(10,6,16,.55)'); v.addColorStop(1, 'rgba(10,6,16,0)')
    g.fillStyle = v; g.fillRect(0, 220, 1280, 250)
    // la scritta viva al centro
    const s = 'torno subito'
    g.font = '700 120px "Pricedown"'; g.textBaseline = 'alphabetic'
    let tw = larga(g, s).width, x = 640 - tw / 2
    const entra = ease.outBack(clamp((q - 8.4) / 0.6))
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], cw = larga(g, ch).width
      const dy = Math.sin(t * 4 - i * 0.6) * 8 + (1 - entra) * 60
      g.fillStyle = VIOLA; g.fillText(ch, x + 6, 378 + dy + 7)
      g.fillStyle = LIME; g.fillText(ch, x, 378 + dy)
      x += cw
    }
    testo(g, sc.perche, 640, 424, 28, '#fff', 800, 'center')
    g.restore()
    return vis
  }

  function uscitaFrame(t, q, giro, su) {
    const g = ug, d = m.dpr
    g.setTransform(d, 0, 0, d, 0, 0)
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
    // il fondo «webcam» si sposta appena, come una camera a mano
    const dx = Math.sin(t * 0.21) * W * 0.01, dy = Math.cos(t * 0.17) * H * 0.008
    g.drawImage(fondo, -W * 0.02 + dx, -H * 0.02 + dy, W * 1.04, H * 1.04)
    g.setTransform(d * k, 0, 0, d * k, ox * d, oy * d)
    g.textBaseline = 'alphabetic'
    const vis = torno(g, q, giro, t)
    // i pezzi, ognuno col suo turno per spegnersi e riaccendersi
    const meteoOn = tempoMeteo
    pezzo(g, acceso(0, q) * meteoOn, 720, 120, () => meteoP(g, t))
    pezzo(g, acceso(1, q), 640, 330, () => argomento(g, t, q, giro))
    pezzo(g, acceso(2, q), 1100, 90, () => spieP(g, t, q))
    pezzo(g, acceso(3, q), 200, 640, () => tastieraP(g, t, q))
    pezzo(g, acceso(4, q), 420, 470, () => redbull(g, q, giro))
    pezzo(g, acceso(5, q), 1100, 520, () => schede(g, t, q, giro))
    pezzo(g, acceso(6, q), 1160, 672, () => aLetto(g, t))
    pezzo(g, acceso(7, q), 60, 180, () => follower(g, t, q, giro))
    // il nome resta sempre in onda (è il titolo)
    nome(g, t, giro, 1)
    cornice(g, t)
    void vis; void su
  }

  function frame(t, dt) {
    if (W !== m.w || H !== m.h || !uscita) ridimensiona(m.w, m.h)
    if (!uscita) return
    const g = m.g, su = m.su
    const giro = Math.floor(t / GIRO), q = t - giro * GIRO
    // l'interruttore «Meteo» in regia (solo col mouse sopra): spento metà del tempo
    const clic = fract(t / 4.2)
    const off = su > 0.6 && clic > 0.5
    tempoMeteo += ((off ? 0 : 1) - tempoMeteo) * Math.min(1, (dt || 0) * 8)
    if (!dt) tempoMeteo = off ? 0 : 1
    uscitaFrame(t, q, giro, su)

    const e = ease.inOut(su)
    g.fillStyle = '#0c090f'; g.fillRect(0, 0, W, H)
    if (e > 0.001) {
      // la regia vera intorno
      g.globalAlpha = e
      g.drawImage(regia, ox, oy, 1280 * k, 720 * k)
      g.globalAlpha = 1
    }
    // l'anteprima: da tutto schermo al riquadro della regia
    const rx = lerp(0, ox + 82 * k, e), ry = lerp(0, oy + 81 * k, e)
    const rw = lerp(W, 849 * k, e), rh = lerp(H, 478 * k, e)
    g.drawImage(uscita, rx, ry, rw, rh)
    if (e > 0.001) {
      // gli interruttori e il puntatore che clicca su «Meteo»
      interruttore(g, 1248, 185, !off, e)
      const cx = lerp(1180, 1250, smooth(0.25, 0.48, clic)), cy = lerp(300, 188, smooth(0.25, 0.48, clic))
      const premi = (clic > 0.48 && clic < 0.55) || clic > 0.98 || clic < 0.03
      puntatore(g, ox + cx * k, oy + cy * k, k * (premi ? 0.85 : 1), e)
      // durante il «torno subito» il suo tasto in regia è acceso
      const giroT = Math.floor(t / GIRO), qq = t - giroT * GIRO
      if (qq > 7.4 && qq < 13) {
        const [tx, nomeT] = SCENE[giroT % 2].tasto
        g.globalAlpha = e
        g.fillStyle = LIME; tondo(g, ox + (tx - 42) * k, oy + 567 * k, 84 * k, 25 * k, 5 * k); g.fill()
        g.font = `700 ${10.5 * k}px "gg sans"`; g.textAlign = 'center'; g.fillStyle = '#141414'
        g.fillText(nomeT, ox + tx * k, oy + 583 * k)
        g.textAlign = 'left'; g.globalAlpha = 1
      }
      // «in onda»: il pallino rosso che pulsa sopra l'anteprima
      g.globalAlpha = e * (0.6 + 0.4 * Math.sin(t * 5))
      g.fillStyle = '#ff3d4a'; g.beginPath(); g.arc(ox + 905 * k, oy + 61 * k, 4 * k, 0, TAU); g.fill()
      g.globalAlpha = 1
    }
    kit.granella(g, W, H, 0.04, t)
  }

  function interruttore(g, x, y, on, a) {
    const X = ox + x * k, Y = oy + y * k
    g.globalAlpha = a
    g.fillStyle = '#16131b'; g.fillRect(X - 18 * k, Y - 10 * k, 36 * k, 20 * k)
    g.fillStyle = on ? '#23a55a' : '#4e5058'; tondo(g, X - 13 * k, Y - 7 * k, 26 * k, 14 * k, 7 * k); g.fill()
    g.fillStyle = '#fff'; g.beginPath(); g.arc(X + (on ? 6 : -6) * k, Y, 5 * k, 0, TAU); g.fill()
    g.globalAlpha = 1
  }
  function puntatore(g, x, y, s, a) {
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s * 1.3, s * 1.3)
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 17); g.lineTo(4.5, 13); g.lineTo(8, 20); g.lineTo(10.5, 19); g.lineTo(7, 12); g.lineTo(12.5, 12); g.closePath()
    g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.2; g.stroke()
    g.restore()
  }

  ridimensiona(m.w, m.h)
  return { frame, ridimensiona, titolo: false, fermo: 3.2 }
}
