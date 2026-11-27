// Posta OS: l'ufficio postale da terminale. Sul monitor gira la cattura vera del programma (il menù, poi «scegli il
// mittente»); gli appunti entrano nello schermo, ne esce l'email HTML vera (quella generata dalla dimostrazione),
// che si infila in una busta, prende francobollo e timbro e vola via; «FATTE» sale di uno. Dietro, la posta che vola.
// Col mouse sopra: il monitor si accende di più, la posta corre e tutto il giro accelera.
export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU, con, tondo, strato, metti, nastro, PZK, rng, rumore } = kit
  await Promise.all(['Anton', 'gg mono', 'Special Elite', 'Permanent Marker'].map((f) => kit.font(f)))
  const [menu, mittente, posta] = await Promise.all([
    kit.imgForse(m.cattura || '/media/p/email/cover.webp'),
    kit.imgForse('/media/p/email/os-02.webp'),
    kit.imgForse('/media/p/email/02.webp'),
  ])

  // ritagli delle catture (pixel della cattura 1280×720): il riquadro del terminale
  const TX = 205, TY = 8, TW = 870, TH = 682
  // l'email: dal titolo al pulsante «Apri pzkko.it» (02.webp è 1280×1329)
  const EX = 0, EY = 22, EW = 704, EH = 690
  const CICLO = 10.6
  const VIOLA = '#9d00ff', NOTTE = '#2a0047', FOSFORO = '#c8ffd8', TERM = '#03100a'

  let W = 0, H = 0, s = 1, fondo = null, schermi = [], foglio = null, bustaS = null, tl = 0
  const L = {}
  function misure() {
    s = W / 480
    const sh = Math.min(136 * s, H * 0.5)
    L.sh = sh; L.sw = sh * TW / TH
    L.sx = 24 * s; L.sy = H - sh - 22 * s
    L.fw = 158 * s; L.fh = L.fw * EH / EW
    L.fx = W - 104 * s; L.fy = Math.max(L.fh / 2 + 12 * s, H * 0.44)
    L.bw = 176 * s; L.bh = 104 * s
    L.bx = W - 112 * s; L.by = H - L.bh / 2 - 12 * s
  }

  function faiStrati() {
    fondo = strato(W, H, m.dpr, (g) => {
      const r = g.createRadialGradient(W * 0.3, H * 0.25, 0, W * 0.45, H * 0.5, W * 0.9)
      r.addColorStop(0, '#7a10d8'); r.addColorStop(0.45, '#4a0a86'); r.addColorStop(1, NOTTE)
      g.fillStyle = r; g.fillRect(0, 0, W, H)
      // la carta da parati a righe diagonali, appena accennata
      g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 6 * s
      for (let x = -H; x < W; x += 22 * s) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke() }
      // il piano della scrivania
      const p = g.createLinearGradient(0, H * 0.8, 0, H)
      p.addColorStop(0, 'rgba(10,0,25,0)'); p.addColorStop(1, 'rgba(10,0,25,.55)')
      g.fillStyle = p; g.fillRect(0, H * 0.8, W, H * 0.2)
    })
    // gli schermi del terminale: cattura vera ritagliata, con le righe e il bagliore del vetro
    const { sw, sh } = L
    schermi = [menu, mittente].map((im) => strato(sw + 20 * s, sh + 20 * s, m.dpr, (g) => {
      const b = 10 * s
      // il bagliore verde dietro allo schermo
      g.shadowColor = 'rgba(80,255,150,.35)'; g.shadowBlur = 14 * s
      g.fillStyle = TERM; g.fillRect(b, b, sw, sh)
      g.shadowColor = 'transparent'
      if (im) g.drawImage(im, TX, TY, TW, TH, b, b, sw, sh)
      g.fillStyle = 'rgba(0,0,0,.16)'
      for (let y = b; y < b + sh; y += Math.max(2, 2 * s)) g.fillRect(b, y, sw, Math.max(0.6, 0.6 * s))
      const v = g.createRadialGradient(b + sw / 2, b + sh / 2, sh * 0.3, b + sw / 2, b + sh / 2, sh * 0.85)
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)')
      g.fillStyle = v; g.fillRect(b, b, sw, sh)
    }))
    // il monitor: cornice scura con il bordo arrotondato e la scritta sotto
    bustaS = strato(L.sw + 40 * s, L.sh + 44 * s, m.dpr, (g) => {
      const w = L.sw + 24 * s, h = L.sh + 28 * s
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 18 * s; g.shadowOffsetY = 8 * s
      g.fillStyle = '#17121f'
      tondo(g, 8 * s, 6 * s, w, h, 10 * s); g.fill()
      g.shadowColor = 'transparent'
      const lg = g.createLinearGradient(0, 6 * s, 0, h)
      lg.addColorStop(0, 'rgba(255,255,255,.12)'); lg.addColorStop(0.2, 'rgba(255,255,255,0)')
      g.fillStyle = lg; tondo(g, 8 * s, 6 * s, w, h, 10 * s); g.fill()
      g.fillStyle = '#0a0710'; g.fillRect(8 * s + 11 * s, 6 * s + 11 * s, L.sw + 2 * s, L.sh + 2 * s)
      g.fillStyle = 'rgba(255,255,255,.35)'
      g.font = `400 ${6 * s}px "gg mono"`; g.textAlign = 'center'
      g.fillText('POSTA-OS v1.0', 8 * s + w / 2, 6 * s + h - 4.5 * s)
      g.fillStyle = '#3fb950'; g.beginPath(); g.arc(8 * s + w - 12 * s, 6 * s + h - 6.5 * s, 1.6 * s, 0, TAU); g.fill()
    })
    // l'email generata, ritagliata e senza il nome della dimostrazione nel saluto
    foglio = strato(L.fw, L.fh, m.dpr, (g) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, L.fw, L.fh)
      if (posta) {
        g.drawImage(posta, EX, EY, EW, EH, 0, 0, L.fw, L.fh)
        const k = L.fw / EW
        g.fillStyle = '#fff'
        g.fillRect((68 - EX) * k, (140 - EY) * k, 110 * k, 34 * k)
      }
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, L.fw - 1, L.fh - 1)
    })
  }

  // le buste che volano dietro: tre piani di profondità
  const VOLO = (() => { const r = rng(5); return Array.from({ length: 30 }, () => ({ x: r(), y: r(), z: 0.3 + r() * 0.7, v: 0.6 + r() * 0.6, rot: (r() - 0.5) * 0.8, f: r() * TAU })) })()
  function bustina(g, x, y, w, h, colore, linea) {
    g.fillStyle = colore; g.fillRect(-w / 2 + x, -h / 2 + y, w, h)
    g.strokeStyle = linea; g.lineWidth = Math.max(0.6, w * 0.06)
    g.beginPath(); g.moveTo(x - w / 2, y - h / 2); g.lineTo(x, y + h * 0.1); g.lineTo(x + w / 2, y - h / 2); g.stroke()
  }

  // una busta vera, davanti: retro, (lettera), fronte, aletta
  function bustaRetro(g, w, h, aletta) {
    g.fillStyle = '#d9d0ee'; g.fillRect(-w / 2, -h / 2, w, h)
    if (aletta < 0.5) {
      // l'aletta aperta sta dietro la lettera
      const tip = lerp(-h * 1.05, h * 0.12, aletta)
      g.fillStyle = '#c3b6e2'
      g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(0, tip); g.lineTo(w / 2, -h / 2); g.closePath(); g.fill()
      g.strokeStyle = 'rgba(60,20,110,.25)'; g.lineWidth = Math.max(0.8, s); g.stroke()
    }
  }
  function bustaFronte(g, w, h, aletta) {
    // le due falde laterali e quella sotto
    g.fillStyle = '#efe9fb'
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(0, h * 0.08); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fill()
    g.strokeStyle = 'rgba(60,20,110,.22)'; g.lineWidth = Math.max(0.8, s)
    g.beginPath(); g.moveTo(-w / 2, h / 2); g.lineTo(-w * 0.08, -h * 0.02); g.moveTo(w / 2, h / 2); g.lineTo(w * 0.08, -h * 0.02); g.stroke()
    // l'aletta: da aperta (in su) a chiusa (in giù)
    if (aletta >= 0.5) {
      const tip = lerp(-h * 1.05, h * 0.12, aletta)
      g.fillStyle = '#e4dcf6'
      g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(0, tip); g.lineTo(w / 2, -h / 2); g.closePath(); g.fill()
      g.stroke()
    }
    g.strokeStyle = 'rgba(60,20,110,.35)'; g.strokeRect(-w / 2, -h / 2, w, h)
  }
  function francobollo(g, x, y, z, k) {
    con(g, x, y, 0.08, lerp(1.8, 1, ease.outBack(k)), () => {
      g.globalAlpha *= clamp(k * 4)
      // dentellatura
      g.fillStyle = '#fffdf6'
      g.fillRect(-z / 2, -z * 0.6, z, z * 1.2)
      g.fillStyle = '#efe9fb'
      for (let i = 0; i <= 6; i++) {
        const xx = -z / 2 + z * i / 6
        g.beginPath(); g.arc(xx, -z * 0.6, z * 0.045, 0, TAU); g.arc(xx, z * 0.6, z * 0.045, 0, TAU); g.fill()
      }
      g.fillStyle = VIOLA; g.fillRect(-z * 0.4, -z * 0.5, z * 0.8, z * 0.9)
      // la «P» a quadretti del titolo del programma
      const P = ['1110', '1001', '1110', '1000', '1000']
      const q = z * 0.1
      g.fillStyle = FOSFORO
      P.forEach((r, j) => [...r].forEach((b, i) => { if (b === '1') g.fillRect(-z * 0.27 + i * q, -z * 0.38 + j * q, q * 0.92, q * 0.92) }))
      g.fillStyle = '#fff'; g.font = `400 ${z * 0.17}px "Anton"`; g.textAlign = 'right'
      g.fillText('1,00', z * 0.35, z * 0.34)
    })
  }
  function annullo(g, x, y, r, k) {
    if (k <= 0) return
    con(g, x, y, -0.25, lerp(1.6, 1, ease.out(k)), () => {
      g.globalAlpha *= 0.82 * clamp(k * 3)
      g.strokeStyle = PZK.rosso; g.fillStyle = PZK.rosso; g.lineWidth = Math.max(1, r * 0.08)
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke()
      g.beginPath(); g.arc(0, 0, r * 0.72, 0, TAU); g.stroke()
      g.font = `400 ${r * 0.34}px "Anton"`; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText('POSTA', 0, -r * 0.08)
      g.font = `400 ${r * 0.22}px "Anton"`
      g.fillText('— OS —', 0, r * 0.28)
      // le onde dell'annullo
      for (let j = -1; j <= 1; j++) {
        g.beginPath()
        for (let i = 0; i <= 16; i++) { const xx = r * 1.1 + i * r * 0.16, yy = j * r * 0.32 + Math.sin(i * 0.9) * r * 0.08; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy) }
        g.stroke()
      }
    })
  }

  return {
    titolo: true,
    fermo: 7.9,
    ridimensiona(w, h) { W = w; H = h; misure(); faiStrati() },
    frame(t, dt) {
      const g = m.g, su = m.su
      if (W !== m.w || H !== m.h || !fondo) { W = m.w; H = m.h; misure(); faiStrati() }
      tl += (dt || 0) * (1 + 0.8 * su)
      const c = tl % CICLO
      const fatte = (Math.floor(tl / CICLO) + (c > 8.9 ? 1 : 0)) % 100
      metti(g, fondo, 0, 0, W, H)

      // ── la posta che vola dietro ──
      for (const b of VOLO) {
        const vel = 14 * s * b.v * (1 + su * 2)
        const x = ((b.x * (W + 80 * s) + tl * vel * b.z * 1.3) % (W + 80 * s)) - 40 * s
        const y = (((b.y * (H + 60 * s) - tl * vel * b.z * 0.7) % (H + 60 * s)) + (H + 60 * s)) % (H + 60 * s) - 30 * s
        const z = (10 + 14 * b.z) * s
        con(g, x, y + Math.sin(tl * 1.3 + b.f) * 3 * s, b.rot + Math.sin(tl + b.f) * 0.15, 1, () => {
          g.globalAlpha = 0.12 + 0.28 * b.z + su * 0.1
          bustina(g, 0, 0, z, z * 0.62, b.z > 0.75 ? '#efe9fb' : '#b98cf0', b.z > 0.75 ? 'rgba(80,30,140,.6)' : 'rgba(255,255,255,.4)')
        })
      }
      g.globalAlpha = 1

      // ── il monitor col terminale vero ──
      const { sx, sy, sw, sh } = L
      const mx = sx - 12 * s, my = sy - 12 * s
      metti(g, bustaS, mx - 8 * s, my - 6 * s, sw + 40 * s, sh + 44 * s)
      const fase = c < 1.6 ? 0 : c < 3.4 ? 1 : 0
      if (su > 0.01) {
        const r = g.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, sw * 0.9)
        r.addColorStop(0, `rgba(120,255,170,${0.22 * su})`); r.addColorStop(1, 'rgba(120,255,170,0)')
        g.fillStyle = r; g.fillRect(sx - sw * 0.4, sy - sh * 0.4, sw * 1.8, sh * 1.8)
      }
      g.drawImage(schermi[fase], sx - 10 * s, sy - 10 * s, sw + 20 * s, sh + 20 * s)
      const kx = sw / TW, ky = sh / TH
      // il contatore «FATTE» vero che sale (e «EMAIL FATTE (n)» nel menù)
      g.font = `400 ${17.5 * ky}px "gg mono"`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
      g.fillStyle = TERM; g.fillRect(sx + (722 - TX) * kx, sy + (22 - TY) * ky, 40 * kx, 26 * ky)
      const lampo = c > 8.9 && c < 9.6 ? 1 - (c - 8.9) / 0.7 : 0
      g.fillStyle = lampo ? `rgba(255,255,140,${0.6 + lampo * 0.4})` : '#55e08f'
      g.fillText(String(fatte), sx + (727 - TX) * kx, sy + (43 - TY) * ky)
      if (fase === 0) {
        g.fillStyle = TERM; g.fillRect(sx + (682 - TX) * kx, sy + (338 - TY) * ky, 60 * kx, 22 * ky)
        g.fillStyle = '#55e08f'; g.fillText(`(${fatte})`, sx + (684 - TX) * kx, sy + (356 - TY) * ky)
      }
      // la barra di selezione che pulsa, e il lampo di [INVIO]
      const sel = fase === 0 ? [486, 312, 328, 24] : [268, 144, 546, 24]
      g.fillStyle = `rgba(200,255,216,${0.1 + 0.12 * kit.onda(tl, 1.1)})`
      g.fillRect(sx + (sel[0] - TX) * kx, sy + (sel[1] - TY) * ky, sel[2] * kx, sel[3] * ky)
      const invio = [1.6, 3.4, 8.4].map((x) => c - x).find((d) => d >= 0 && d < 0.25)
      if (invio != null) { g.fillStyle = `rgba(220,255,230,${0.5 * (1 - invio / 0.25)})`; g.fillRect(sx, sy, sw, sh) }
      // il riflesso del vetro
      const rv = g.createLinearGradient(sx, sy, sx + sw, sy + sh)
      rv.addColorStop(0, 'rgba(255,255,255,.1)'); rv.addColorStop(0.4, 'rgba(255,255,255,0)'); rv.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = rv; g.fillRect(sx, sy, sw, sh)

      // il flusso dei dati: quadretti di fosforo dallo schermo al punto dove nasce l'email
      if (c > 1.5 && c < 5) {
        const kf = clamp((c - 1.5) / 0.3) * clamp((5 - c) / 0.5)
        const x0 = sx + sw * 0.9, y0 = sy + sh * 0.3, x1 = L.fx - L.fw * 0.3, y1 = L.fy
        const r = rng(4)
        for (let i = 0; i < 34; i++) {
          const u = kit.fract(tl * (0.55 + r() * 0.4) + r())
          const cx = lerp(x0, x1, 0.5), cy = Math.min(y0, y1) - 40 * s - r() * 20 * s
          const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1
          const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1 + (r() - 0.5) * 14 * s
          const q = (1.5 + r() * 2.5) * s
          g.globalAlpha = kf * Math.sin(u * Math.PI) * (0.6 + su * 0.4)
          g.fillStyle = r() < 0.2 ? '#ffffff' : FOSFORO
          g.fillRect(x - q / 2, y - q / 2, q, q)
        }
        g.globalAlpha = 1
      }

      // ── gli appunti: un post-it battuto a macchina che entra nello schermo ──
      if (c < 1.75) {
        const k = ease.in(clamp((c - 0.55) / 1.1))
        const ax = lerp(W * 0.62, sx + sw * 0.55, k), ay = lerp(H * 0.34, sy + sh * 0.5, k) - Math.sin(k * Math.PI) * 30 * s
        const sc = lerp(1, 0.15, k)
        const entra = clamp(c / 0.35)
        con(g, ax, ay + (1 - entra) * 14 * s, lerp(0.12, -0.5, k), sc * ease.outBack(entra), () => {
          const pw = 74 * s, ph = 62 * s
          g.globalAlpha = clamp(entra * 2) * (1 - clamp((k - 0.85) / 0.15))
          g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-pw / 2 + 3 * s, -ph / 2 + 4 * s, pw, ph)
          g.fillStyle = PZK.giallo; g.fillRect(-pw / 2, -ph / 2, pw, ph)
          g.fillStyle = '#3a2f00'
          g.font = `400 ${7 * s}px "Special Elite"`
          g.fillText('appunti', -pw / 2 + 6 * s, -ph / 2 + 11 * s)
          g.fillStyle = 'rgba(30,25,0,.55)'
          ;[0.8, 0.6, 0.72, 0.5, 0.66].forEach((l, i) => g.fillRect(-pw / 2 + 6 * s, -ph / 2 + 19 * s + i * 7.5 * s, (pw - 12 * s) * l, 2.4 * s))
          g.font = `400 ${8 * s}px "Permanent Marker"`; g.fillStyle = PZK.rosso
          g.fillText('ctrl+c', pw / 2 - 30 * s, ph / 2 - 3 * s)
          g.globalAlpha = 1
        })
      }

      // ── l'email: esce dallo schermo, resta un attimo, entra nella busta, timbro, vola via ──
      const { fw, fh, fx, fy, bw, bh, bx, by } = L
      const busta = c > 6.3 && c < 10.4
      // la posizione della busta (anche quando vola via)
      const kv = ease.in(clamp((c - 8.6) / 1.1))
      const ex = lerp(bx, W + bw, kv), ey = lerp(by, -bh * 1.2, kv) - Math.sin(kv * Math.PI) * 10 * s
      const er = lerp(-0.04, -0.5, kv), es = lerp(1, 0.55, kv)
      const kb = ease.out(clamp((c - 6.3) / 0.45)) // la busta arriva dal basso
      const eyy = ey + (1 - kb) * (bh + 30 * s)
      // le scie del volo
      if (kv > 0 && kv < 1) {
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5 * s
        for (let i = 0; i < 6; i++) {
          const o = (i - 2.5) * 9 * s
          const l = (40 + 30 * rumore(i * 3, 1)) * s * Math.sin(kv * Math.PI)
          g.globalAlpha = 0.6 * Math.sin(kv * Math.PI)
          g.beginPath(); g.moveTo(ex - 50 * s + o * 0.3, eyy + 30 * s + o); g.lineTo(ex - 50 * s - l + o * 0.3, eyy + 30 * s + o + l * 0.6); g.stroke()
        }
        g.globalAlpha = 1
      }
      const ka = ease.inOut(clamp((c - 7.1) / 0.4))
      if (busta) con(g, ex, eyy, er, es, () => bustaRetro(g, bw, bh, ka))
      if (c > 3.4 && c < 7.2) {
        // il foglio: cresce dallo schermo verso destra mentre si «stampa» dall'alto
        const ku = ease.inOut(clamp((c - 3.4) / 1.1))
        const x0 = sx + sw * 0.5, y0 = sy + sh * 0.45
        let x = lerp(x0, fx, ku), y = lerp(y0, fy, ku) + Math.sin(ku * Math.PI) * 22 * s
        let r = lerp(-0.3, 0.035, ku) + Math.sin(tl * 1.4) * 0.008
        const scl = lerp(0.2, 1, ku)
        // poi scende nella busta
        const kd = ease.inOut(clamp((c - 6.4) / 0.75))
        y = lerp(y, by - bh * 0.15 + fh * 0.5 - 10 * s + (1 - kb) * (bh + 30 * s), kd)
        x = lerp(x, bx, kd); r = lerp(r, -0.04, kd)
        g.save()
        if (busta) {
          // la busta copre la lettera: si vede solo sopra la bocca (ritaglio con il bordo storto della busta)
          g.beginPath(); g.rect(0, 0, W, eyy - bh / 2 + 2 * s); g.clip()
        }
        con(g, x, y, r, scl, () => {
          const stampa = clamp((c - 3.5) / 1.3)
          g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(-fw / 2 + 4 * s, -fh / 2 + 6 * s, fw, fh * stampa)
          g.drawImage(foglio, 0, 0, foglio.width, foglio.height * stampa, -fw / 2, -fh / 2, fw, fh * stampa)
          // la riga che «stampa» l'HTML
          if (stampa < 1) { g.fillStyle = 'rgba(157,0,255,.55)'; g.fillRect(-fw / 2, -fh / 2 + fh * stampa - 1.5 * s, fw, 3 * s) }
          if (kd < 0.05) nastro(g, 0, -fh / 2, 38 * s, 11 * s, -0.04)
        })
        g.restore()
      }
      if (busta) {
        const sobbalzo = c > 7.85 && c < 8.3 ? 1 + Math.sin((c - 7.85) * 30) * 0.04 * (1 - (c - 7.85) / 0.45) : 1
        con(g, ex, eyy, er, es * sobbalzo, () => {
          bustaFronte(g, bw, bh, ka)
          // il francobollo, l'annullo e le righe dell'indirizzo (vuote: niente indirizzi)
          g.fillStyle = 'rgba(60,20,110,.35)'
          ;[0.42, 0.34, 0.38].forEach((l, i) => g.fillRect(-bw * 0.12, bh * 0.08 + i * 9 * s, bw * l, 2 * s))
          if (c > 7.5) francobollo(g, bw * 0.36, -bh * 0.22, 30 * s, clamp((c - 7.5) / 0.25))
          annullo(g, bw * 0.12, -bh * 0.2, 17 * s, clamp((c - 7.85) / 0.2))
        })
        // il colpo del timbro: una raggiera e un sussulto
        const dc = c - 7.85
        if (dc > 0 && dc < 0.6) {
          g.strokeStyle = PZK.giallo; g.lineWidth = 2 * s
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * TAU
            const r0 = lerp(20, 40, dc / 0.6) * s, r1 = lerp(26, 62, ease.out(dc / 0.6)) * s
            g.globalAlpha = 1 - dc / 0.6
            g.beginPath(); g.moveTo(ex + bw * 0.24 + Math.cos(a) * r0, eyy - bh * 0.2 + Math.sin(a) * r0); g.lineTo(ex + bw * 0.24 + Math.cos(a) * r1, eyy - bh * 0.2 + Math.sin(a) * r1); g.stroke()
          }
          g.globalAlpha = 1
        }
      }
      // «inviata» scritto a pennarello sul muro quando la busta parte
      if (c > 8.8 && c < 10.5) {
        const k = clamp((c - 8.8) / 0.3)
        g.globalAlpha = clamp((10.5 - c) / 0.5)
        kit.scritta(g, `+1 fatta!`, W - 92 * s, H - 30 * s, { font: PZK.pennarello, size: 17 * s * ease.outBack(k), color: PZK.giallo, align: 'center', rot: -0.12, ombra: 2 * s })
        g.globalAlpha = 1
      }

      kit.vignetta(g, W, H, 0.4)
      kit.granella(g, W, H, 0.06, t)
    },
  }
}
