// Pulizia OS: «prima guarda e riferisce, poi pulisce, e se serve rimette a posto». Sul monitor gira la cattura vera
// del programma: il menù, l'analisi (la riga di scansione passa e segna lo sporco col giallo), poi PULISCI: i tre pezzi
// recuperabili (dist, i due moduli orfani) volano nello scatolone della quarantena, il doppione resta lì solo «detto»,
// come nel programma vero; il contatore sale a 117 kB, QUARANTENE passa a 1, scintille. Poi le dieci prove, tutte [OK].
// Col mouse sopra: tutto accelera, le scintille si moltiplicano e lo scatolone si apre (si può sempre ripristinare).
export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU, con, tondo, strato, metti, nastro, timbro, PZK, rng } = kit
  await Promise.all(['Anton', 'gg mono', 'Special Elite', 'Permanent Marker', 'Vampyre'].map((f) => kit.font(f)))
  const [menu, analisi, prove] = await Promise.all([
    kit.imgForse(m.cattura || '/media/p/pulizia/cover.webp'),
    kit.imgForse('/media/p/pulizia/os-02.webp'),
    kit.imgForse('/media/p/pulizia/os-03.webp'),
  ])

  const TX = 205, TY = 8, TW = 870, TH = 682 // il riquadro del terminale nelle catture 1280×720
  const TERM = '#03100a', MENTA = '#55e08f'
  const CICLO = 13
  // le righe dello sporco nell'analisi vera (y in pixel della cattura) e dove finiscono
  const SPORCO = [
    { y: 180, x: 278, nome: 'dist/', kb: 117, vola: true },
    { y: 228, x: 278, nome: 'esperimento.ts', kb: 0, vola: true },
    { y: 252, x: 278, nome: 'VecchiaPagina.tsx', kb: 0, vola: true },
    { y: 324, x: 278, nome: 'sfondo.bin', kb: 9, vola: false },
  ]
  const SCAN = [1.7, 3.1] // la riga di scansione
  const VOLO = (i) => 3.5 + i * 0.55 // quando parte ogni pezzo
  const DURV = 0.85
  const CHIUDE = 5.75, PROVE = 6.6, MENU2 = 11.6

  let W = 0, H = 0, s = 1, fondo = null, schermi = [], cornice = null, tl = 0
  const BOLLE = (() => { const r = rng(13); return Array.from({ length: 16 }, () => ({ x: r(), y: r(), z: r(), f: 0.6 + r(), p: r() * TAU })) })()
  const L = {}
  function misure() {
    s = W / 480
    L.sh = Math.min(140 * s, H * 0.54); L.sw = L.sh * TW / TH
    L.sx = W - L.sw - 26 * s; L.sy = H - L.sh - 26 * s
    L.kx = L.sw / TW; L.ky = L.sh / TH
    L.bw = 124 * s; L.bh = 66 * s
    L.bx = 30 * s; L.by = H - L.bh - 14 * s
  }
  // un punto della cattura → canvas
  const P = (x, y) => [L.sx + (x - TX) * L.kx, L.sy + (y - TY) * L.ky]

  function stella(g, x, y, r, rot = 0) {
    g.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.22 : r
      i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
    }
    g.closePath(); g.fill()
  }

  function faiStrati() {
    fondo = strato(W, H, m.dpr, (g) => {
      const r = g.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.4, H * 0.4, W)
      r.addColorStop(0, '#e4ff4a'); r.addColorStop(0.5, '#b4e000'); r.addColorStop(1, '#5d7a00')
      g.fillStyle = r; g.fillRect(0, 0, W, H)
      // le piastrelle del bagno appena lavato: una griglia leggera
      g.strokeStyle = 'rgba(40,60,0,.1)'; g.lineWidth = Math.max(0.7, 0.8 * s)
      for (let x = 0; x < W; x += 30 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * 0.82); g.stroke() }
      for (let y = 0; y < H * 0.82; y += 30 * s) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
      // il piano
      const p = g.createLinearGradient(0, H * 0.8, 0, H)
      p.addColorStop(0, '#4b6300'); p.addColorStop(1, '#2c3a00')
      g.fillStyle = p; g.fillRect(0, H * 0.82, W, H * 0.18)
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, H * 0.82, W, Math.max(1, s))
    })
    const { sw, sh } = L
    schermi = [menu, analisi, prove].map((im) => strato(sw + 20 * s, sh + 20 * s, m.dpr, (g) => {
      const b = 10 * s
      g.shadowColor = 'rgba(80,255,150,.4)'; g.shadowBlur = 14 * s
      g.fillStyle = TERM; g.fillRect(b, b, sw, sh)
      g.shadowColor = 'transparent'
      if (im) g.drawImage(im, TX, TY, TW, TH, b, b, sw, sh)
      g.fillStyle = 'rgba(0,0,0,.16)'
      for (let y = b; y < b + sh; y += Math.max(2, 2 * s)) g.fillRect(b, y, sw, Math.max(0.6, 0.6 * s))
      const v = g.createRadialGradient(b + sw / 2, b + sh / 2, sh * 0.3, b + sw / 2, b + sh / 2, sh * 0.85)
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)')
      g.fillStyle = v; g.fillRect(b, b, sw, sh)
    }))
    cornice = strato(sw + 44 * s, sh + 48 * s, m.dpr, (g) => {
      const w = sw + 24 * s, h = sh + 28 * s
      g.shadowColor = 'rgba(20,30,0,.55)'; g.shadowBlur = 18 * s; g.shadowOffsetY = 8 * s
      g.fillStyle = '#1b2010'
      tondo(g, 10 * s, 6 * s, w, h, 10 * s); g.fill()
      g.shadowColor = 'transparent'
      const lg = g.createLinearGradient(0, 6 * s, 0, h)
      lg.addColorStop(0, 'rgba(255,255,255,.14)'); lg.addColorStop(0.2, 'rgba(255,255,255,0)')
      g.fillStyle = lg; tondo(g, 10 * s, 6 * s, w, h, 10 * s); g.fill()
      g.fillStyle = 'rgba(255,255,255,.35)'
      g.font = `400 ${6 * s}px "gg mono"`; g.textAlign = 'center'
      g.fillText('PULIZIA-OS v1.0', 10 * s + w / 2, 6 * s + h - 4.5 * s)
      g.fillStyle = '#3fb950'; g.beginPath(); g.arc(10 * s + w - 12 * s, 6 * s + h - 6.5 * s, 1.6 * s, 0, TAU); g.fill()
    })
  }

  // il cartellino di un file: foglietto bianco con l'orecchia, il nome in mono
  function cartellino(g, nome, kb) {
    g.font = `400 ${7.5 * s}px "gg mono"`
    const tw = g.measureText(nome).width
    const w = tw + 22 * s, h = 15 * s
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-w / 2 + 2 * s, -h / 2 + 3 * s, w, h)
    g.fillStyle = '#fffdf6'; g.fillRect(-w / 2, -h / 2, w, h)
    g.strokeStyle = PZK.nero; g.lineWidth = Math.max(0.7, 0.9 * s); g.strokeRect(-w / 2, -h / 2, w, h)
    // l'iconcina del file con l'orecchia
    const ix = -w / 2 + 4 * s, iy = -h / 2 + 3 * s
    g.fillStyle = '#e8e2cf'
    g.beginPath(); g.moveTo(ix, iy); g.lineTo(ix + 5 * s, iy); g.lineTo(ix + 7.5 * s, iy + 2.5 * s); g.lineTo(ix + 7.5 * s, iy + 9 * s); g.lineTo(ix, iy + 9 * s); g.closePath(); g.fill(); g.stroke()
    g.fillStyle = PZK.nero; g.textBaseline = 'middle'; g.textAlign = 'left'
    g.fillText(nome, ix + 10 * s, 0.5 * s)
    g.fillStyle = PZK.rosso; g.font = `400 ${6 * s}px "gg mono"`; g.textAlign = 'right'
    g.fillText(`${kb} kB`, w / 2 - 2 * s, -h / 2 - 3 * s)
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'
  }

  // lo scatolone della quarantena: retro, (i file), fronte, alette
  function scatolaRetro(g) {
    const { bx, by, bw } = L, d = 13 * s
    g.fillStyle = '#3d2a14'
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + bw, by); g.lineTo(bx + bw + d, by - d); g.lineTo(bx + d, by - d); g.closePath(); g.fill()
  }
  function scatolaFronte(g, kb, aperta, scossa) {
    const { bx, by, bw, bh } = L, d = 13 * s
    // il fianco destro e il davanti
    g.fillStyle = '#9a6b3a'
    g.beginPath(); g.moveTo(bx + bw, by); g.lineTo(bx + bw + d, by - d); g.lineTo(bx + bw + d, by + bh - d); g.lineTo(bx + bw, by + bh); g.closePath(); g.fill()
    const lg = g.createLinearGradient(bx, by, bx, by + bh)
    lg.addColorStop(0, '#c99a62'); lg.addColorStop(1, '#a87a45')
    g.fillStyle = lg; g.fillRect(bx, by, bw, bh)
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(bx, by, bw, 2 * s)
    // il nastro marrone e il cartello
    g.fillStyle = 'rgba(120,80,30,.45)'; g.fillRect(bx + bw / 2 - 8 * s, by, 16 * s, bh)
    con(g, bx + bw / 2, by + bh * 0.52, -0.03 + scossa * 0.05, 1, () => {
      const lw = 92 * s, lh = 38 * s
      g.fillStyle = '#fffdf6'; g.fillRect(-lw / 2, -lh / 2, lw, lh)
      g.fillStyle = PZK.nero; g.textAlign = 'center'; g.textBaseline = 'alphabetic'
      g.font = `400 ${13 * s}px "Anton"`
      g.fillText('QUARANTENA', 0, -lh / 2 + 15 * s)
      g.font = `400 ${11 * s}px "Permanent Marker"`; g.fillStyle = PZK.rosso
      g.fillText(`${kb} kB`, 0, lh / 2 - 6 * s)
      g.textAlign = 'left'
      nastro(g, -lw / 2 + 2 * s, -lh / 2 + 2 * s, 20 * s, 7 * s, -0.7)
      nastro(g, lw / 2 - 2 * s, lh / 2 - 2 * s, 20 * s, 7 * s, -0.7)
    })
    // le alette: aperte (in su, verso fuori) → chiuse (sopra la bocca)
    const ali = (sx0, segno) => {
      const hx = segno < 0 ? bx : bx + bw
      const fx = lerp(-20 * segno * s, segno < 0 ? bw / 2 : -bw / 2, 1 - aperta)
      const fy = lerp(-26 * s, -d * 0.5, 1 - aperta)
      g.fillStyle = aperta > 0.5 ? '#b98a54' : '#c99a62'
      g.beginPath(); g.moveTo(hx, by); g.lineTo(hx + d, by - d); g.lineTo(hx + d + fx * 0.9, by - d + fy); g.lineTo(hx + fx, by + fy * 0.6); g.closePath(); g.fill()
      g.strokeStyle = 'rgba(60,35,10,.4)'; g.lineWidth = Math.max(0.7, 0.8 * s); g.stroke()
    }
    ali(0, -1); ali(0, 1)
  }

  return {
    titolo: true,
    fermo: 6.1,
    ridimensiona(w, h) { W = w; H = h; misure(); faiStrati() },
    frame(t, dt) {
      const g = m.g, su = m.su
      if (W !== m.w || H !== m.h || !fondo) { W = m.w; H = m.h; misure(); faiStrati() }
      tl += (dt || 0) * (1 + 0.6 * su)
      const c = tl % CICLO
      metti(g, fondo, 0, 0, W, H)
      const { sx, sy, sw, sh, kx, ky } = L

      // ── le scintille che girano sempre (e di più col mouse sopra) ──
      {
        const r = rng(21)
        const n = Math.round(16 + 18 * su)
        g.fillStyle = '#ffffff'
        for (let i = 0; i < 34; i++) {
          const x = r() * W, y = r() * H * 0.8, f = r() * 3 + 1.5, ph = r()
          if (i >= n) continue
          const k = kit.onda(tl, f, ph)
          if (k < 0.55) continue
          g.globalAlpha = (k - 0.55) / 0.45 * 0.9
          stella(g, x, y, (2 + 4 * r()) * s * k, tl * 0.5)
        }
        g.globalAlpha = 1
      }

      // ── le bolle di sapone che salgono (tre piani) ──
      for (const b of BOLLE) {
        const vel = (10 + 16 * b.z) * s * (1 + su)
        const y = H * 0.86 - ((b.y * H + tl * vel) % (H + 30 * s))
        const x = b.x * W + Math.sin(tl * b.f + b.p) * 8 * s * b.z
        const r = (3 + 7 * b.z) * s
        g.globalAlpha = 0.35 + 0.4 * b.z
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(0.7, 0.9 * s)
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke()
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fill()
        g.strokeStyle = 'rgba(120,200,255,.6)'
        g.beginPath(); g.arc(x, y, r * 0.8, 2.2, 3.4); g.stroke()
        g.fillStyle = '#ffffff'
        g.beginPath(); g.arc(x - r * 0.38, y - r * 0.38, r * 0.18, 0, TAU); g.fill()
      }
      g.globalAlpha = 1

      // ── il monitor ──
      metti(g, cornice, sx - 22 * s, sy - 18 * s, sw + 44 * s, sh + 48 * s)
      const fase = c < 1.5 || c >= MENU2 ? 0 : c < PROVE ? 1 : 2
      if (su > 0.01) {
        const r = g.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, sw)
        r.addColorStop(0, `rgba(255,255,255,${0.25 * su})`); r.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = r; g.fillRect(sx - sw * 0.5, sy - sh * 0.5, sw * 2, sh * 2)
      }
      g.drawImage(schermi[fase], sx - 10 * s, sy - 10 * s, sw + 20 * s, sh + 20 * s)
      g.save()
      g.beginPath(); g.rect(sx, sy, sw, sh); g.clip()
      g.font = `400 ${18 * ky}px "gg mono"`; g.textBaseline = 'alphabetic'
      // QUARANTENE: 0 → 1 dopo la pulizia
      const quar = c > CHIUDE && c < CICLO - 0.05 ? 1 : 0
      {
        const [qx, qy] = P(528, 24)
        g.fillStyle = TERM; g.fillRect(qx, qy, 22 * kx, 26 * ky)
        g.fillStyle = c > CHIUDE && c < CHIUDE + 0.6 ? '#ffffff' : MENTA
        g.fillText(String(quar), qx + 3 * kx, qy + 20 * ky)
        if (fase === 0) {
          const [mx, my] = P(674, 338)
          g.fillStyle = TERM; g.fillRect(mx, my, 34 * kx, 22 * ky)
          g.fillStyle = MENTA; g.fillText(`(${quar})`, mx, my + 18 * ky)
        }
      }
      if (fase === 0) {
        const [bx, by] = P(486, 288)
        g.fillStyle = `rgba(200,255,216,${0.1 + 0.14 * kit.onda(tl, 1)})`
        g.fillRect(bx, by, 328 * kx, 24 * ky)
      }
      if (fase === 1) {
        // la riga di scansione e il giallo sullo sporco che trova
        const ks = clamp((c - SCAN[0]) / (SCAN[1] - SCAN[0]))
        const yScan = lerp(90, 390, ease.inOut(ks))
        for (const [i, r] of SPORCO.entries()) {
          if (yScan < r.y) continue
          const [x, y] = P(r.x - 6, r.y - 18)
          const w = (r.vola ? 300 : 770) * kx, h = 24 * ky
          const k = clamp((c - (SCAN[0] + (r.y - 90) / 300 * (SCAN[1] - SCAN[0]))) / 0.3)
          // quando il pezzo è volato via, la riga si spegne
          const via = r.vola ? clamp((c - VOLO(i)) / 0.3) : 0
          if (via > 0) { g.fillStyle = `rgba(3,16,10,${0.82 * via})`; g.fillRect(x - 4 * kx, y, 820 * kx, h) }
          if (r.vola) {
            // l'evidenziatore sullo schermo scuro: giallo pieno e trasparente, con la tacca a sinistra
            g.globalAlpha = (1 - via)
            g.fillStyle = 'rgba(255,233,77,.32)'
            g.fillRect(x, y + h * 0.1, w * ease.out(k), h * 0.8)
            g.fillStyle = PZK.giallo
            g.fillRect(x - 3 * kx, y + h * 0.1, 3 * s, h * 0.8)
            g.globalAlpha = 1
          } else {
            g.strokeStyle = `rgba(255,233,77,${0.8 * k})`; g.lineWidth = Math.max(1, 1.2 * s)
            g.setLineDash([3 * s, 2 * s]); g.strokeRect(x, y, w * k, h); g.setLineDash([])
          }
        }
        if (ks > 0 && ks < 1) {
          const [, y] = P(0, yScan)
          const lg = g.createLinearGradient(0, y - 14 * s, 0, y + 2 * s)
          lg.addColorStop(0, 'rgba(204,255,0,0)'); lg.addColorStop(1, 'rgba(204,255,0,.45)')
          g.fillStyle = lg; g.fillRect(sx, y - 14 * s, sw, 16 * s)
          g.fillStyle = '#eaffb0'; g.fillRect(sx, y, sw, Math.max(1, 1.3 * s))
        }
        // «Recuperabili 117 kB» che si accende
        if (c > SCAN[1]) {
          const [x, y] = P(234, 356)
          g.fillStyle = `rgba(255,233,77,${0.25 * kit.onda(tl, 0.8)})`
          g.fillRect(x, y, 700 * kx, 24 * ky)
        }
      }
      if (fase === 2) {
        // le dieci prove si accendono una alla volta: sotto la riga che arriva resta il buio
        const kp = clamp((c - PROVE - 0.2) / 2.6)
        const yv = lerp(118, 410, kp)
        const [, y0] = P(0, yv)
        g.fillStyle = TERM; g.fillRect(sx, y0, sw, sy + sh * 0.92 - y0)
        if (kp < 1) { g.fillStyle = '#eaffb0'; g.fillRect(sx + 40 * kx, y0 - 2 * s, 4 * s, 2 * s * 2) }
      }
      // il lampo di [INVIO] tra uno schermo e l'altro
      const invio = [1.5, PROVE, MENU2].map((x) => c - x).find((d) => d >= 0 && d < 0.22)
      if (invio != null) { g.fillStyle = `rgba(220,255,230,${0.55 * (1 - invio / 0.22)})`; g.fillRect(sx, sy, sw, sh) }
      // il colpo: un riflesso pulito che attraversa il vetro
      const kg = (c - CHIUDE) / 0.8
      if (kg > 0 && kg < 1) {
        const gx = lerp(sx - sw * 0.6, sx + sw * 1.4, ease.inOut(kg))
        g.save(); g.translate(gx, sy + sh / 2); g.rotate(0.5)
        const lg = g.createLinearGradient(-26 * s, 0, 26 * s, 0)
        lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = lg; g.fillRect(-26 * s, -sh, 52 * s, sh * 2)
        g.restore()
      }
      g.restore()
      // il vetro
      const rv = g.createLinearGradient(sx, sy, sx + sw, sy + sh)
      rv.addColorStop(0, 'rgba(255,255,255,.1)'); rv.addColorStop(0.4, 'rgba(255,255,255,0)')
      g.fillStyle = rv; g.fillRect(sx, sy, sw, sh)

      // ── lo scatolone e i file che ci volano dentro ──
      const kbTot = SPORCO.reduce((a, r, i) => a + (r.vola && c > VOLO(i) + DURV && c < CICLO - 0.05 ? r.kb : 0), 0)
      const dentro = SPORCO.filter((r, i) => r.vola && c > VOLO(i) + DURV).length
      // la scatola si apre a inizio giro e si chiude dopo l'ultimo pezzo; col mouse sopra resta socchiusa
      const apre = clamp(c / 0.6) * (1 - ease.inOut(clamp((c - CHIUDE) / 0.35)))
      const aperta = Math.max(apre, su * 0.75)
      const urto = SPORCO.map((r, i) => c - VOLO(i) - DURV).filter((d) => d > 0 && d < 0.4)[0]
      const scossa = urto != null ? Math.sin(urto * 40) * (1 - urto / 0.4) : 0
      g.save(); g.translate(0, scossa * 1.5 * s)
      scatolaRetro(g)
      // i file già dentro: spuntano dalla bocca (col mouse sopra, uno risale: «ripristina»)
      g.save()
      g.beginPath(); g.rect(0, 0, W, L.by + 2 * s); g.clip()
      let n = 0
      SPORCO.forEach((r, i) => {
        if (!r.vola || c <= VOLO(i) + DURV) return
        const su1 = i === 0 ? su : 0
        const sale = (4 + n * 3) * s + su1 * (18 + Math.sin(tl * 3) * 3) * s
        con(g, L.bx + L.bw * (0.32 + n * 0.2), L.by + 8 * s - sale * aperta, (n - 1) * 0.22, 0.8, () => cartellino(g, r.nome, r.kb))
        n++
      })
      g.restore()
      g.save(); g.translate(0, -scossa * 1.5 * s)
      // i file in volo dallo schermo allo scatolone
      SPORCO.forEach((r, i) => {
        if (!r.vola) return
        const k = (c - VOLO(i)) / DURV
        if (k <= 0 || k >= 1) return
        const [x0, y0] = P(r.x + 60, r.y - 6)
        const x1 = L.bx + L.bw * (0.32 + i * 0.2), y1 = L.by + 4 * s
        const e = ease.inOut(k)
        const x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(e * Math.PI) * 60 * s
        con(g, x, y, e * (i % 2 ? -1 : 1) * 1.6, lerp(1.15, 0.8, e), () => cartellino(g, r.nome, r.kb))
        // la scia di polvere
        g.fillStyle = 'rgba(255,255,255,.7)'
        for (let j = 1; j < 6; j++) {
          const ee = ease.inOut(clamp(k - j * 0.04))
          const xx = lerp(x0, x1, ee), yy = lerp(y0, y1, ee) - Math.sin(ee * Math.PI) * 60 * s
          g.globalAlpha = 0.5 * (1 - j / 6)
          stella(g, xx, yy, (4 - j * 0.5) * s, j)
        }
        g.globalAlpha = 1
      })
      g.restore()
      scatolaFronte(g, kbTot, aperta, scossa)
      g.restore()
      if (su > 0.3 && aperta > 0.5 && dentro > 0) {
        g.globalAlpha = clamp((su - 0.3) * 2)
        kit.scritta(g, 'ripristina ↺', L.bx + L.bw * 0.5, L.by - 34 * s, { font: PZK.pennarello, size: 10 * s, color: PZK.nero, align: 'center', rot: -0.08 })
        g.globalAlpha = 1
      }
      // «solo detto»: il doppione non si sposta, lo dice soltanto
      if (fase === 1 && c > SCAN[1] - 0.3) {
        const [x, y] = P(1000, 312)
        g.globalAlpha = clamp((c - SCAN[1] + 0.3) / 0.3)
        kit.scritta(g, 'doppio: resta', Math.min(x, W - 8 * s), y - 8 * s, { font: PZK.pennarello, size: 9 * s, color: PZK.giallo, align: 'right', rot: -0.1, ombra: 1.2 * s, ombraColore: 'rgba(0,0,0,.6)' })
        g.globalAlpha = 1
      }

      // ── il colpo: lo scatolone chiuso prende il timbro, raggiera di scintille ──
      const dc = c - CHIUDE - 0.3
      if (dc > 0 && c < CICLO - 0.3) {
        const kt = clamp(dc / 0.3)
        g.globalAlpha = 0.9 * clamp((CICLO - 0.3 - c) / 0.4)
        con(g, L.bx + L.bw * 0.78, L.by + 8 * s, 0, lerp(1.8, 1, ease.outBack(kt)), () => timbro(g, 'pulito', 0, 0, 30 * s, 0.18, PZK.rosso, 1))
        g.globalAlpha = 1
        if (dc < 1.1) {
          const r = rng(31)
          g.fillStyle = '#ffffff'
          for (let i = 0; i < 22; i++) {
            const a = r() * TAU, v = (40 + r() * 110) * s
            const kk = ease.out(clamp(dc / 1.1))
            const cx = i % 2 ? L.bx + L.bw / 2 : sx + sw / 2, cy = i % 2 ? L.by : sy + sh / 2
            g.globalAlpha = (1 - dc / 1.1)
            g.fillStyle = i % 3 ? '#ffffff' : PZK.giallo
            stella(g, cx + Math.cos(a) * v * kk, cy + Math.sin(a) * v * kk, (3 + r() * 5) * s * (1 - kk * 0.5), a)
          }
          g.globalAlpha = 1
        }
      }
      // le prove passate: un segno di spunta a pennarello sul cartello quando arriva l'ultima
      if (c > PROVE + 2.9 && c < MENU2 + 0.8) {
        const k = clamp((c - PROVE - 2.9) / 0.3)
        g.globalAlpha = clamp((MENU2 + 0.8 - c) / 0.4)
        kit.scritta(g, '10/10 ok', sx + sw * 0.5, sy - 4 * s, { font: PZK.pennarello, size: 14 * s * ease.outBack(k), color: PZK.nero, align: 'center', rot: -0.05 })
        g.globalAlpha = 1
      }

      kit.vignetta(g, W, H, 0.3)
      kit.granella(g, W, H, 0.05, t)
    },
  }
}
