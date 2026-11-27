// miniature/virtual.js — Virtual: la finestra vera del gioco (il foglio col nastro, art/roulette/carta.webp) con la partita
// in diretta sullo schermino a pixel. Lo schermino è quello del gioco (games/virtual/schermo.js, la classe Schermo) e la
// partita è una di quelle che il gioco genera dal suo seme (partita.js: squadre storpiate, maglie, meteo, formazioni),
// con una cronaca scritta qui: palo, gol, giallo, intervallo, il pareggio, la parata e il gol della vittoria al 90'.
// Sotto il tabellone coi due stemmi (squadre.js, stemmaSVG), a destra le quote stampate sul foglio, la fiche sull'«1» e la
// schedina: al fischio finale il timbro VINTA e le fiches che volano nel saldo. Al gol tutto rallenta, il punteggio salta
// e il pennarello scrive GOL!. Col mouse sopra la telecamera ci entra: lo schermino viene avanti e si guarda la partita.
import { Schermo, LARG, ALT } from '../../games/virtual/schermo.js'
import { scena, T } from '../../games/virtual/partita.js'
import { stemmaSVG } from '../../games/virtual/squadre.js'

const INDICE = 5900008 // Romma – Milano Rossonera, di sera coi riflettori (una delle partite vere del seme)
const ROSSO = '#b3121f', NERO = '#161616', BLU = '#1446a0'
const PRIMA = 6 // secondi di partita prima del fischio (la presentazione)
const DOPO = 2.6 // secondi veri di finale
const PUNTATA = 25
const fmt = (n, d = 0) => n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })

function finitura(kit, W, H, dpr, scuro = 0.42, grana = 0.07) {
  return kit.strato(W, H, dpr, (g) => {
    kit.vignetta(g, W, H, scuro)
    const n = document.createElement('canvas'), x = n.getContext('2d'), r = kit.rng(5)
    n.width = n.height = 96
    const d = x.createImageData(96, 96)
    for (let i = 0; i < d.data.length; i += 4) { const v = r(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > 0.5 ? 255 : 0; d.data[i + 3] = Math.abs(v - 0.5) * 2 * grana * 255 }
    x.putImageData(d, 0, 0)
    g.fillStyle = g.createPattern(n, 'repeat')
    g.fillRect(0, 0, W, H)
  })
}

// uno stemma SVG del gioco come immagine (blob: lo permette la CSP)
function stemma(kit, sq) {
  const svg = stemmaSVG(sq, 160).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  return kit.imgForse(url)
}

export default async function crea(m) {
  const { kit } = m
  const { clamp, lerp, smooth, ease, TAU } = kit
  const base = scena(INDICE)
  const F = base.formazioni
  const chi = (sq, i) => ({ i, n: F[sq][i].n, nome: F[sq][i].nome })
  // la cronaca (secondi di partita: 0–60, l'intervallo a 27)
  const eventi = [
    { tipo: 'inizio', t: 0, dur: 1.4 },
    { tipo: 'tiro', t: 7.5, dur: 2.2, squadra: 'casa', esito: 'palo' },
    { tipo: 'gol', t: 13, dur: 5.5, squadra: 'casa', chi: chi('casa', 4), minuto: "23'" },
    { tipo: 'giallo', t: 21, dur: 2.4, squadra: 'ospite', chi: chi('ospite', 2) },
    { tipo: 'intervallo', t: T.fine1, dur: T.via2 - T.fine1 },
    { tipo: 'ripresa', t: T.via2, dur: 1.2 },
    { tipo: 'gol', t: 35, dur: 5.5, squadra: 'ospite', chi: chi('ospite', 4), minuto: "57'" },
    { tipo: 'tiro', t: 44, dur: 2.2, squadra: 'ospite', esito: 'parata' },
    { tipo: 'gol', t: 51, dur: 5.5, squadra: 'casa', chi: chi('casa', 3), minuto: "84'" },
  ]
  const P = { ...base, eventi, risultato: { casa: 2, ospite: 1 }, cronaca: true }
  const gol = eventi.filter((e) => e.tipo === 'gol')
  const quota = P.quote['1']

  const [carta, muro, f25, f5, f100, stCasa, stOspite] = await Promise.all([
    kit.img('/art/roulette/carta.webp'), kit.img('/art/muro.webp'),
    kit.imgForse('/art/fiches/f25.webp'), kit.imgForse('/art/fiches/f5.webp'), kit.imgForse('/art/fiches/f100.webp'),
    stemma(kit, base.casa), stemma(kit, base.ospite),
  ])
  await Promise.all(['Anton', 'Permanent Marker', 'Special Elite'].map((f) => kit.font(f)))

  // lo schermino vero, a 2 pixel per pixel grosso
  const tela = document.createElement('canvas')
  const sch = new Schermo(tela)
  sch.k = 2; tela.width = LARG * 2; tela.height = ALT * 2

  let W = 0, H = 0, dprFatto = 0, PW = 0, PH = 0
  let fondo, foglio, fino
  // il tempo della partita: corre forte, rallenta sui gol (come in tv)
  let tm = -PRIMA, fine = 0, giro = 0, accu = 1, tau = 0
  const lento = (x) => gol.some((e) => x >= e.t + 0.2 * e.dur && x < e.t + 0.6 * e.dur)

  // la geometria sul foglio (origine al centro della carta)
  const SCH = () => ({ x: -0.455 * PW, y: -0.255 * PH, w: 0.56 * PW, h: 0.56 * PW * (ALT / LARG) })
  function ridimensiona(w, h) {
    W = w; H = h
    PH = H * 0.98; PW = PH * 1.415
    const dpr = m.dpr
    fondo = kit.strato(W, H, dpr, (g) => {
      const s = (H * 1.25) / muro.height
      for (let x = 0; x < W; x += muro.width * s) g.drawImage(muro, x, -H * 0.1, muro.width * s, muro.height * s)
      g.fillStyle = 'rgba(8,24,14,.7)'
      g.fillRect(0, 0, W, H)
    })
    fino = finitura(kit, W, H, dpr, 0.45)
    foglio = kit.strato(PW * 1.25, PH * 1.3, dpr, (g, fw, fh) => disegnaFoglio(g, fw / 2, fh / 2))
  }

  function quotaBox(g, x, y, w, h, nome, val, grande, giallo) {
    if (giallo) { g.fillStyle = 'rgba(255,212,0,.38)'; kit.tondo(g, x + 2, y + 2, w - 4, h - 4, h * 0.08); g.fill() }
    g.strokeStyle = NERO; g.lineWidth = Math.max(0.8, PW * 0.0028)
    kit.tondo(g, x, y, w, h, h * 0.1); g.stroke()
    g.fillStyle = grande ? NERO : '#3a3632'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = grande ? `400 ${h * 0.36}px Anton` : `400 ${h * 0.22}px "Special Elite"`
    g.fillText(nome, x + w / 2, y + h * (grande ? 0.3 : 0.3))
    g.fillStyle = NERO
    g.font = `400 ${h * (grande ? 0.34 : 0.36)}px Anton`
    g.fillText(val, x + w / 2, y + h * 0.7)
  }

  // ── la parte ferma del foglio: carta, testata, cornice dello schermino, tabellone, quote ──
  function disegnaFoglio(g, ox, oy) {
    g.save()
    g.translate(ox, oy)
    const IW = PW / 0.854, IH = PH / 0.805
    g.save()
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = PW * 0.04 * m.dpr; g.shadowOffsetY = PW * 0.015 * m.dpr
    g.drawImage(carta, -PW / 2 - 0.073 * IW, -PH / 2 - 0.098 * IH, IW, IH)
    g.restore()
    g.fillStyle = NERO; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
    g.font = `400 ${PW * 0.075}px Anton`
    g.fillText(m.titolo || 'Virtual', -0.455 * PW, -0.31 * PH)
    // la cornice di plastica dello schermino
    const s = SCH(), p = PW * 0.014
    g.fillStyle = 'rgba(0,0,0,.25)'; kit.tondo(g, s.x - p + 1, s.y - p + 2, s.w + p * 2, s.h + p * 2, p * 1.6); g.fill()
    g.fillStyle = '#d8d4cc'; kit.tondo(g, s.x - p, s.y - p, s.w + p * 2, s.h + p * 2, p * 1.6); g.fill()
    g.fillStyle = '#1c2a1e'; kit.tondo(g, s.x - 1, s.y - 1, s.w + 2, s.h + 2, p * 0.6); g.fill()
    // il tabellone
    const ty = s.y + s.h + PW * 0.03, th = PH * 0.16
    g.strokeStyle = NERO; g.lineWidth = Math.max(1, PW * 0.004)
    kit.tondo(g, s.x, ty, s.w, th, PW * 0.01); g.stroke()
    const st = th * 0.72
    if (stCasa) g.drawImage(stCasa, s.x + th * 0.14, ty + (th - st) / 2, st, st)
    if (stOspite) g.drawImage(stOspite, s.x + s.w - th * 0.14 - st, ty + (th - st) / 2, st, st)
    g.fillStyle = NERO; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
    g.font = `400 ${th * 0.24}px Anton`
    g.fillText(P.casa.nome, s.x + th * 0.2 + st, ty + th * 0.45, s.w * 0.5 - th * 0.8 - st)
    g.textAlign = 'right'
    g.fillText(P.ospite.nome, s.x + s.w - th * 0.2 - st, ty + th * 0.45, s.w * 0.5 - th * 0.8 - st)
    g.font = `400 ${th * 0.15}px "Special Elite"`; g.fillStyle = '#5a544c'
    g.fillText(`forza ${P.forze.ospite}`, s.x + s.w - th * 0.2 - st, ty + th * 0.7)
    g.textAlign = 'left'
    g.fillText(`forza ${P.forze.casa}`, s.x + th * 0.2 + st, ty + th * 0.7)
    // le quote, stampate sul foglio come un tavolo
    const qx = 0.14 * PW, qw = 0.315 * PW, qy = -0.255 * PH, qh = PH * 0.15, gap = PW * 0.01, bw = (qw - gap * 2) / 3
    ;[['1', P.quote['1']], ['X', P.quote.X], ['2', P.quote['2']]].forEach(([n, v], i) => quotaBox(g, qx + i * (bw + gap), qy, bw, qh, n, fmt(v, 2), true, false))
    g.font = `400 ${PW * 0.022}px "Permanent Marker"`; g.fillStyle = NERO; g.textAlign = 'left'
    g.fillText('GOL IN TUTTO', qx, qy + qh + PH * 0.05)
    const ow = (qw - gap * 3) / 4, oh = PH * 0.085
    ;[1.5, 2.5, 3.5, 4.5].forEach((s2, i) => {
      quotaBox(g, qx + i * (ow + gap), qy + qh + PH * 0.065, ow, oh, `over ${fmt(s2, 1)}`, fmt(P.quote[`O${s2}`], 2), false, false)
      quotaBox(g, qx + i * (ow + gap), qy + qh + PH * 0.065 + oh + gap, ow, oh, `under ${fmt(s2, 1)}`, fmt(P.quote[`U${s2}`], 2), false, false)
    })
    g.restore()
  }

  function fiche(g, im, x, y, d, sq = 1) {
    if (!im) return
    g.save()
    g.fillStyle = 'rgba(0,0,0,.3)'
    g.beginPath(); g.ellipse(x + d * 0.05, y + d * 0.1, d * 0.5, d * 0.5 * Math.max(0.3, Math.abs(sq)), 0, 0, TAU); g.fill()
    g.translate(x, y); g.scale(1, sq)
    g.drawImage(im, -d / 2, -d / 2, d, d)
    g.restore()
  }

  function frame(t, dt) {
    if (m.w !== W || m.h !== H || m.dpr !== dprFatto) { dprFatto = m.dpr; ridimensiona(m.w, m.h) }
    const g = m.g, su = m.su
    tau += dt
    // ── il tempo della partita ──
    let fase = 'scommesse'
    if (fine > 0) { fine += dt; fase = 'finita'; if (fine > DOPO) { fine = 0; tm = -PRIMA; giro++ } }
    if (fine === 0) {
      const v = tm < 0 ? 3.5 : lento(tm) ? 1.4 : 6.5
      tm += dt * v * (1 + 0.15 * su)
      fase = tm < 0 ? 'scommesse' : 'partita'
      if (tm >= T.fine) { fine = dt; fase = 'finita' }
    }
    const tt = fase === 'finita' ? T.fine : tm
    // lo schermino si ridisegna a 30 al secondo (è pixel art: basta, e costa la metà)
    accu += dt
    if (accu >= 1 / 31) {
      sch.disegna(P, { fase, t: tt, dt: accu * (tm < 0 ? 1 : 3) })
      accu = 0
    }
    // il punteggio: sale quando il pallone entra
    let pc = 0, po = 0, ultimo = null
    for (const e of gol) if (tt >= e.t + 0.3 * e.dur) { if (e.squadra === 'casa') pc++; else po++; ultimo = e }
    const dalGol = ultimo ? tt - (ultimo.t + 0.3 * ultimo.dur) : 99
    const salto = dalGol < 1.2 ? Math.sin(clamp(dalGol / 1.2) * Math.PI) : 0
    const golOra = gol.find((e) => tt >= e.t + 0.25 * e.dur && tt < e.t + 0.7 * e.dur)

    // ── il muro e il foglio ──
    kit.metti(g, fondo, 0, 0, W, H)
    const s = SCH()
    const cx = W * 0.5, cy = H * 0.5
    const scossa = golOra ? Math.sin(tau * 60) * W * 0.002 * (1 - clamp((tt - golOra.t - 0.25 * golOra.dur) / 1.5)) : 0
    // col mouse sopra: si entra nello schermino (lo zoom porta il suo centro verso il centro del quadro)
    const z = 1 + 0.3 * ease.inOut(su)
    const scx = s.x + s.w * 0.55, scy = s.y + s.h * 0.62
    const rot = lerp(-0.022, 0, su) + Math.sin(tau * 0.35) * 0.003
    g.save()
    g.translate(cx + scossa, cy)
    g.scale(z, z)
    g.translate(-lerp(0, scx, ease.inOut(su)), -lerp(0, scy, ease.inOut(su)))
    g.rotate(rot)
    kit.metti(g, foglio, -PW * 0.625, -PH * 0.65, PW * 1.25, PH * 1.3)

    // lo schermino: i pixel veri del gioco, netti
    g.imageSmoothingEnabled = z * (s.w / LARG) * m.dpr < 2.2
    g.drawImage(tela, s.x, s.y, s.w, s.h)
    g.imageSmoothingEnabled = true
    // il vetro: un riflesso in diagonale e un filo di luce che passa
    g.save()
    g.beginPath(); g.rect(s.x, s.y, s.w, s.h); g.clip()
    const rg = g.createLinearGradient(s.x, s.y, s.x + s.w * 0.5, s.y + s.h)
    rg.addColorStop(0, 'rgba(255,255,255,.12)'); rg.addColorStop(0.42, 'rgba(255,255,255,.03)'); rg.addColorStop(0.43, 'rgba(255,255,255,0)')
    g.fillStyle = rg; g.fillRect(s.x, s.y, s.w, s.h)
    const lx = s.x + ((tau * 0.22) % 1.6 - 0.3) * s.w
    const lg = g.createLinearGradient(lx - s.w * 0.08, 0, lx + s.w * 0.08, 0)
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.07)'); lg.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = lg; g.fillRect(s.x, s.y, s.w, s.h)
    // il lampo del gol
    if (golOra && dalGol >= 0 && dalGol < 0.25) { g.fillStyle = `rgba(255,255,255,${0.5 * (1 - dalGol / 0.25)})`; g.fillRect(s.x, s.y, s.w, s.h) }
    g.restore()

    // al gol: i coriandoli a pixel nei colori della squadra che ha segnato, sparati fuori dallo schermino
    if (ultimo && dalGol >= 0 && dalGol < 2.2) {
      const col = P.maglie[ultimo.squadra].colori, rr = kit.rng(Math.round(ultimo.t * 10) + giro * 97)
      const px = Math.max(2, PW * 0.011)
      for (let i = 0; i < 70; i++) {
        const ang = rr() * TAU, v = (0.35 + rr() * 0.8) * PW, ox = s.x + s.w * (0.2 + rr() * 0.6), oy = s.y + s.h * (0.3 + rr() * 0.4)
        const q = dalGol - rr() * 0.25
        if (q < 0) continue
        const x = ox + Math.cos(ang) * v * q, y = oy + Math.sin(ang) * v * q * 0.7 + PH * 0.9 * q * q
        g.globalAlpha = clamp(1 - q / 2.2) * 0.95
        g.fillStyle = [col[0], col[1] ?? '#ffffff', '#ffd400', '#ffffff'][i % 4]
        g.fillRect(Math.round(x), Math.round(y), px, px)
      }
      g.globalAlpha = 1
    }
    // il tabellone: il punteggio (salta al gol), il minuto a pennarello, IN DIRETTA
    const ty = s.y + s.h + PW * 0.03, th = PH * 0.16
    const min = fase === 'finita' ? 'FINE' : tm < 0 ? `fischio tra 0:0${Math.ceil(-tm / 1.2)}` : tt < T.fine1 ? `${Math.floor((tt / T.fine1) * 45) + 1}'` : tt < T.via2 ? 'INT' : tt < T.fine2 ? `${45 + Math.floor(((tt - T.via2) / (T.fine2 - T.via2)) * 45) + 1}'` : `90+${Math.floor(((tt - T.fine2) / (T.fine - T.fine2)) * 3) + 1}'`
    g.save()
    g.translate(s.x + s.w / 2, ty + th * 0.4)
    const ps = 1 + 0.35 * salto
    g.scale(ps, ps); g.rotate(-0.05 * salto)
    g.font = `400 ${th * 0.42}px Anton`
    const pt = `${pc} - ${po}`, pw = g.measureText(pt).width + th * 0.25
    g.fillStyle = NERO; kit.tondo(g, -pw / 2, -th * 0.27, pw, th * 0.5, th * 0.05); g.fill()
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(pt, 0, th * 0.005)
    g.restore()
    g.save()
    g.fillStyle = ROSSO; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = `400 ${th * 0.17}px "Permanent Marker"`
    g.fillText(min, s.x + s.w / 2, ty + th * 0.77)
    if (fase === 'partita' && Math.sin(tau * 5) > -0.3) {
      g.font = `400 ${th * 0.12}px "Special Elite"`
      g.fillText('● IN DIRETTA', s.x + s.w / 2, ty + th * 0.93)
    }
    g.restore()

    // la quota giocata: l'«1» evidenziato, la fiche sopra; la schedina sotto le quote
    const qx = 0.14 * PW, qw = 0.315 * PW, qy = -0.255 * PH, qh = PH * 0.15, gap = PW * 0.01, bw = (qw - gap * 2) / 3
    const vince = pc > po
    const pulsa = golOra && golOra.squadra === 'casa' ? 0.5 + 0.5 * Math.sin(tau * 16) : 0
    g.save()
    g.globalCompositeOperation = 'multiply'
    g.fillStyle = `rgba(255,212,0,${0.55 + 0.35 * pulsa})`
    kit.tondo(g, qx + 2, qy + 2, bw - 4, qh - 4, qh * 0.08); g.fill()
    g.restore()
    fiche(g, f25, qx + bw * 0.86, qy + qh * 0.86, PW * 0.032, 1)
    // la schedina
    const sy = 0.17 * PH
    g.save()
    g.translate(qx, sy)
    g.font = `400 ${PW * 0.022}px "Permanent Marker"`; g.fillStyle = NERO; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
    g.fillText('LA SCHEDINA', 0, 0)
    g.font = `400 ${PW * 0.026}px "Special Elite"`; g.fillStyle = '#3a3632'
    g.fillText(`1 · ${P.casa.sigla}–${P.ospite.sigla} @ ${fmt(quota, 2)}`, 0, PH * 0.055)
    g.fillText(`${PUNTATA} $pzk → ${fmt(PUNTATA * quota, 2)}`, 0, PH * 0.1)
    g.restore()
    // il timbro: VINTA al fischio finale (e «in bilico» quando si sta pareggiando)
    if (fase === 'finita') {
      const q = clamp(fine / 0.35)
      kit.timbro(g, 'vinta', qx + qw * 0.8, sy + PH * 0.035, PW * 0.075, -0.22, '#1f8a3a', ease.outBack(q))
    } else if (tm > 0 && !vince) {
      g.save(); g.globalAlpha = 0.85
      g.font = `400 ${PW * 0.024}px "Permanent Marker"`; g.fillStyle = ROSSO
      g.translate(qx + qw * 0.55, sy + PH * 0.15); g.rotate(-0.06)
      g.fillText(pc === po ? 'in bilico…' : 'sotto!', 0, 0)
      g.restore()
    }
    // il pennarello: GOL! accanto al tabellone
    if (dalGol >= 0 && dalGol < 2.4 && ultimo) {
      const q = clamp(dalGol / 0.3), via = 1 - smooth(1.8, 2.4, dalGol)
      g.save()
      g.globalAlpha = via
      g.translate(s.x + s.w * (ultimo.squadra === 'casa' ? 0.2 : 0.8), ty - PH * 0.035)
      g.rotate(-0.12); g.scale(lerp(1.6, 1, ease.outBack(q)), lerp(1.6, 1, ease.outBack(q)))
      g.font = `400 ${PW * 0.06}px "Permanent Marker"`
      g.textAlign = 'center'; g.textBaseline = 'middle'
      g.lineWidth = PW * 0.008; g.strokeStyle = '#f4efe1'; g.strokeText('GOL!', 0, 0)
      g.fillStyle = ROSSO; g.fillText('GOL!', 0, 0)
      g.restore()
    }
    // il saldo in basso a destra e le fiches della vincita che ci volano
    const bx = 0.455 * PW, by = 0.45 * PH
    const vinto = PUNTATA * quota
    const conta = 1000 - PUNTATA + (fase === 'finita' ? vinto * ease.out(clamp((fine - 0.4) / 1.2)) : 0)
    g.save()
    g.textAlign = 'right'; g.fillStyle = NERO
    g.font = `400 ${PW * 0.018}px "Permanent Marker"`
    g.fillText('HAI', bx, by - PW * 0.045)
    g.font = `400 ${PW * 0.05}px Anton`
    g.fillText(`$pzk ${fmt(conta, conta % 1 ? 2 : 0)}`, bx, by)
    g.restore()
    if (fase === 'finita') {
      for (let i = 0; i < 7; i++) {
        const q = clamp((fine - 0.35 - i * 0.08) / 0.55)
        if (q <= 0 || q >= 1) continue
        const e = ease.inOut(q)
        const x = lerp(qx + bw * 0.78, bx - PW * 0.08, e), y = lerp(qy + qh * 0.8, by - PW * 0.02, e) - Math.sin(q * Math.PI) * PH * 0.22
        fiche(g, [f25, f5, f100][i % 3], x, y, PW * 0.035, Math.cos(q * 10 + i))
      }
    }
    // la telecronaca a pennarello rosso, in cima
    const voce = fase === 'finita' ? `finale: ${P.casa.nome} ${pc}–${po} ${P.ospite.nome}` : `in diretta: ${P.casa.nome} – ${P.ospite.nome}`
    g.save()
    g.font = `400 ${PW * 0.03}px "Permanent Marker"`; g.fillStyle = ROSSO
    g.translate(-0.455 * PW + PW * 0.205, -0.33 * PH); g.rotate(-0.02)
    g.fillText(voce.toUpperCase(), 0, 0)
    g.restore()
    g.restore()

    kit.metti(g, fino, 0, 0, W, H)
  }

  return { frame, titolo: false, cattura: false, fermo: 6 }
}
