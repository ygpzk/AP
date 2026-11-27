// 02 · Quadro vivo (rifatto il 27.11.2026). I cinque colori veri della copertina diventano un quadro a olio che si
// dipinge da solo, pennellata per pennellata, mentre il brano va avanti: all'inizio c'è la tela preparata e lo schizzo a
// carboncino, a metà brano le campiture, alla fine i tocchi di luce e il timbro. Il soggetto (paesaggio con
// tangenziale, natura morta, ritratto della chiocciola, composizione, marina) e il titolo ironico vengono dal brano.
// Cornice dorata pacchiana, lampada da museo, targhetta col prezzo assurdo, la chiocciola-custode col basco.
// Si ferma quando non si vede; con prefers-reduced-motion si dipinge tutto in un colpo, senza pennello e senza respiro.
import { esc, semi, caso, limita } from '../utils.js'

const T = {
  it: {
    pronto: 'dal vivo',
    attesa: 'aspetto una copertina',
    nota: 'I cinque colori sono quelli veri della copertina del brano; il quadro si dipinge qui, una pennellata alla volta, mentre il brano va avanti. Titolo, tecnica e prezzo sono battute.',
    etichetta: (titolo, autore) => `Quadro generato «${titolo}», ${autore}: pennellate a olio con i cinque colori della copertina.`,
    soggetti: { paesaggio: 'Paesaggio con', natura: 'Natura morta con', ritratto: 'Ritratto della chiocciola con', astratto: 'Composizione n. {n} con', marina: 'Marina con' },
    silenzio: 'Silenzio in sala',
    anonimo: 'Anonimo del muro',
    attribuito: 'attribuito a',
    tecniche: ['olio su Spotify', 'acrilico su playlist', 'tempera su cuffie', 'olio su wifi del vicino', 'spray su ripeti brano', 'olio su riproduzione casuale', 'spatola su autoradio'],
    tecnicaNiente: 'olio su niente (in pausa)',
    prezzi: ['€ 4.000.000 (trattabili)', '€ 12 e un caffè', 'tre spritz e un passaggio a casa', '€ 999.999,99 + IVA', 'scambio con una bici', 'offerta libera, ma alta', 'prezzo su richiesta (della mamma)'],
    prezzoNiente: 'non in vendita: è della chiocciola',
    misure: (d) => `${d} di musica`,
    misureVar: 'dimensioni variabili',
    avanza: (p) => `dipinto al ${p}%`,
    asciuga: 'finito, la vernice asciuga',
    collezione: 'Collezione pzkko · sala 02',
    timbroCorso: 'lavori in corso',
    timbri: ['venduto', 'opera della chiocciola', "falso d'autore", 'capolavoro (dice la mamma)'],
    timbroNiente: 'museo in pausa',
    placca: 'scuola del muro',
    tocca: "tocca l'opera",
    vietato: 'vietato toccare le opere',
    guardia: ['ehi! non si tocca', 'ho detto: non si tocca!', 'adesso chiamo il custode', 'il custode è una chiocciola: arriva giovedì', 'va bene, ormai è arte partecipativa', 'firmala almeno'],
    dorme: 'il custode dorme',
  },
  en: {
    pronto: 'live',
    attesa: 'waiting for a cover',
    nota: 'The five colours are the real ones from the track cover; the painting is made here, one brushstroke at a time, while the track plays. Title, medium and price are jokes.',
    etichetta: (titolo, autore) => `Generated painting “${titolo}”, ${autore}: oil brushstrokes in the five colours of the cover.`,
    soggetti: { paesaggio: 'Landscape with', natura: 'Still life with', ritratto: 'Portrait of the snail with', astratto: 'Composition no. {n} with', marina: 'Seascape with' },
    silenzio: 'Silence in the gallery',
    anonimo: 'Anonymous of the wall',
    attribuito: 'attributed to',
    tecniche: ['oil on Spotify', 'acrylic on playlist', 'tempera on headphones', "oil on the neighbour's wifi", 'spray on repeat', 'oil on shuffle', 'palette knife on car radio'],
    tecnicaNiente: 'oil on nothing (paused)',
    prezzi: ['€4,000,000 (negotiable)', '€12 and a coffee', 'three spritzes and a lift home', '€999,999.99 + VAT', 'will swap for a bike', 'pay what you want, but a lot', 'price on request (ask mum)'],
    prezzoNiente: "not for sale: it's the snail's",
    misure: (d) => `${d} of music`,
    misureVar: 'variable dimensions',
    avanza: (p) => `${p}% painted`,
    asciuga: 'finished, paint still drying',
    collezione: 'pzkko collection · room 02',
    timbroCorso: 'work in progress',
    timbri: ['sold', 'snail original', 'genuine fake', 'masterpiece (says mum)'],
    timbroNiente: 'gallery on break',
    placca: 'school of the wall',
    tocca: 'touch the art',
    vietato: 'do not touch the art',
    guardia: ['hey! no touching', 'I said: no touching!', "right, I'm calling the guard", 'the guard is a snail: he gets here Thursday', "fine, it's participatory art now", 'at least sign it'],
    dorme: 'the guard is asleep',
  },
}
const DBG = new URLSearchParams(location.search) // DBG
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]

const SOGGETTI = ['paesaggio', 'natura', 'ritratto', 'astratto', 'marina']
const NIENTE = ['#b3121f', '#1446a0', '#5b2c7a', '#f5ffcc', '#2b1438']
const STOP = new Set(['the', 'and', 'with', 'from', 'your', 'that', 'this', 'what', 'when', 'feat', 'remastered', 'remaster', 'version', 'live', 'edit', 'della', 'delle', 'dello', 'degli', 'sono', 'come', 'dove', 'quando', 'perché', 'anche', 'ancora', 'tutto', 'tutti', 'questa', 'questo', 'nella', 'nelle', 'sulla', 'sulle', 'senza'])

/** la parola del titolo del brano che finisce nel titolo dell'opera («Natura morta con tangenziale») */
function parolaChiave(tr) {
  const s = String(tr?.titolo || '').replace(/\(.*?\)|\[.*?\]/g, ' ').split(/\s[-–—]\s/)[0]
  const parole = (s.toLowerCase().match(/[\p{L}'’]+/gu) || []).map((p) => p.replace(/^.*['’]/, ''))
  const buone = parole.filter((p) => p.length >= 4 && !STOP.has(p))
  return buone.at(-1) || parole.at(-1) || String(tr?.artista || '').toLowerCase().split(/\s+/)[0] || '…'
}
const durata = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}′${String(s % 60).padStart(2, '0')}″` }

// ── il pittore: soggetti, pennellate, pennello ─────────────────────────────────────────────────────────────────
// un rumore liscio quanto basta per far variare i toni (niente librerie)
const rumore = (u, v, s) => 0.5 * Math.sin(u * 13.1 + s) * Math.sin(v * 9.7 + s * 1.7) + 0.5 * Math.sin((u + v * 0.7) * 7.3 + s * 2.3)
const tang = (dx, dy) => Math.atan2(dy, dx) + Math.PI / 2

/** Il soggetto: campo(u, v, a) → [colore, angolo della pennellata]. u, v in 0..1, a = larghezza/altezza. */
function soggetto(tipo, P, rnd) {
  const s = rnd() * 20
  if (tipo === 'paesaggio') {
    const sole = { x: 0.62 + rnd() * 0.22, y: 0.2 + rnd() * 0.08, r: 0.12 }
    const f1 = rnd() * 6, f2 = rnd() * 6
    const giallo = P.su(P.chiaro, P.vivo)
    return (u, v, a) => {
      const n = rumore(u, v, s)
      const collina = 0.6 + 0.06 * Math.sin(u * 6 + f1) + 0.035 * Math.sin(u * 13 + f2)
      const strada = 0.55 - 0.09 * u
      const ds = Math.hypot((u - sole.x) * a, v - sole.y)
      if (Math.abs(v - strada) < 0.024) return [P.scuro, Math.atan2(-0.09, a)]
      if (v > strada && v < 0.9 && (u * 7 + 0.3) % 1 < 0.05) return [P.scuro, Math.PI / 2]
      if (ds < sole.r) return [giallo, tang((u - sole.x) * a, v - sole.y)]
      if (v < collina) {
        if (ds < sole.r * 1.7) return [P.chiaro, tang((u - sole.x) * a, v - sole.y)]
        return [v + 0.1 * n < 0.3 ? P.chiaro2 : P.chiaro, 0.12 * Math.sin(u * 5 + v * 3 + s)]
      }
      if (v < 0.86) return [v + 0.07 * n < 0.73 ? P.medio : P.scuro2, 0.25 * Math.cos(u * 6 + f1)]
      return [n > 0.15 ? P.scuro2 : P.scuro, -Math.PI / 2 + 0.45 * n]
    }
  }
  if (tipo === 'natura') {
    const tavolo = 0.66
    const muro = P.mix(P.scuro2, '#0d0a10', 0.3), muro2 = P.mix(P.medio, '#0d0a10', 0.35)
    const legno = P.mix(P.chiaro2, '#fff8ea', 0.15), legno2 = P.mix(P.medio, '#fff8ea', 0.1)
    const frutti = [
      { x: 0.44, y: 0.56, r: 0.15, c: P.vivo },
      { x: 0.6, y: 0.58, r: 0.12, c: P.contro },
      { x: 0.71, y: 0.62, r: 0.09, c: P.su(P.contro, P.chiaro) },
    ]
    return (u, v, a) => {
      const n = rumore(u, v, s)
      for (const f of frutti) {
        const dx = (u - f.x) * a, dy = v - f.y, d = Math.hypot(dx, dy)
        if (d < f.r) {
          // il bordo scuro, la luce in alto a sinistra: si capisce che è una mela anche da lontano
          if (d > f.r * 0.88) return [P.scuro, tang(dx, dy)]
          if (Math.hypot(dx + f.r * 0.35, dy + f.r * 0.38) < f.r * 0.28) return [P.chiaro, tang(dx, dy)]
          return [f.c, tang(dx, dy)]
        }
      }
      // il gambo della mela grande
      if (Math.abs((u - 0.445) * a) < 0.008 && v > 0.37 && v < 0.42) return [P.scuro, Math.PI / 2]
      const bx = u - 0.27
      if (v > 0.22 && v < tavolo + 0.02 && Math.abs(bx) < 0.045) return [Math.abs(bx + 0.025) < 0.008 ? P.chiaro : P.scuro, Math.PI / 2]
      if (v > 0.09 && v <= 0.22 && Math.abs(bx) < 0.016) return [P.scuro, Math.PI / 2]
      for (const f of frutti) {
        const dx = (u - f.x - 0.05) * a, dy = (v - (f.y + f.r * 0.92)) / 0.3
        if (v > tavolo && Math.hypot(dx, dy) < f.r) return [P.scuro, 0]
      }
      if (v > tavolo && v < tavolo + 0.03) return [P.scuro, 0]
      if (v > tavolo) return [n > 0.2 ? legno2 : legno, 0.06 * n]
      return [n > 0.5 ? muro2 : muro, 0.8 + 0.35 * n]
    }
  }
  if (tipo === 'ritratto') {
    const g = { x: 0.6, y: 0.47, r: 0.3 }
    const guscio = P.su(P.scuro2, P.vivo), guscio2 = P.su(guscio, P.chiaro2)
    return (u, v, a) => {
      const n = rumore(u, v, s)
      const occhi = [[0.2, 0.17], [0.31, 0.15]]
      for (const [ox, oy] of occhi) {
        const d = Math.hypot((u - ox) * a, v - oy)
        if (d < 0.02) return [P.scuro, 0]
        if (d < 0.05) return [P.chiaro, tang((u - ox) * a, v - oy)]
      }
      // le antenne: due segmenti dalla testa agli occhi
      for (const [ox, oy] of occhi) {
        const bx = 0.25, by = 0.6
        const t = limita(((u - bx) * (ox - bx) * a * a + (v - by) * (oy - by)) / ((ox - bx) ** 2 * a * a + (oy - by) ** 2), 0, 1)
        if (Math.hypot((u - bx - t * (ox - bx)) * a, v - by - t * (oy - by)) < 0.018) return [P.chiaro2, Math.atan2(oy - by, (ox - bx) * a)]
      }
      const dx = (u - g.x) * a, dy = v - g.y, d = Math.hypot(dx, dy)
      if (d < g.r) {
        const giro = (d / g.r) * 3.2 + Math.atan2(dy, dx) / (Math.PI * 2)
        const banda = Math.floor(giro * 2) % 2
        return [d > g.r * 0.93 ? P.scuro : banda ? guscio : guscio2, tang(dx, dy)]
      }
      const tx = (u - 0.25) * a, ty = v - 0.66
      if (Math.hypot(tx, ty / 1.3) < 0.1) return [P.chiaro2, tang(tx, ty)]
      const cx = (u - 0.52) / 0.36, cy = (v - 0.8) / 0.075
      if (cx * cx + cy * cy < 1 || (u > 0.2 && u < 0.36 && v > 0.6 && v < 0.82)) return [n > 0.3 ? P.chiaro : P.chiaro2, 0.1 * n]
      if (v > 0.86) return [P.scuro, 0.15 * n]
      const rx = (u - 0.5) * a, ry = v - 0.42
      return [Math.hypot(rx, ry) + 0.06 * n < 0.62 ? P.scuro2 : P.scuro, 0.75 + 0.35 * n]
    }
  }
  if (tipo === 'astratto') {
    const fasce = [[0.07, 0.36, P.su(P.scuro, P.vivo)], [0.42, 0.66, P.chiaro], [0.72, 0.92, P.su(P.scuro, P.medio)]]
    return (u, v) => {
      const n = rumore(u, v, s)
      const m = 0.02 * n
      if (u > 0.07 + m && u < 0.93 - m) {
        for (const [a, b, c] of fasce) if (v > a + m && v < b - m) return [c, (u * 9 + v * 5) % 1 < 0.15 ? Math.PI / 2 : 0.08 * n]
      }
      return [n > 0.25 ? P.scuro2 : P.scuro, 0.1 * n]
    }
  }
  // marina
  const oriz = 0.5
  const sole = { x: 0.35 + rnd() * 0.35, y: 0.34, r: 0.1 }
  const giallo = P.su(P.chiaro, P.vivo), vela = P.su(P.chiaro2, P.chiaro)
  return (u, v, a) => {
    const n = rumore(u, v, s)
    const ds = Math.hypot((u - sole.x) * a, v - sole.y)
    // la barca
    const bu = u - 0.22
    if (v > 0.6 && v < 0.67 && bu > -0.1 + (v - 0.6) * 0.7 && bu < 0.14 - (v - 0.6) * 0.9) return [P.scuro, 0]
    if (Math.abs(bu - 0.01) < 0.005 && v > 0.24 && v <= 0.6) return [P.scuro, Math.PI / 2]
    if (v > 0.27 && v < 0.58 && bu > 0.02 && bu < 0.02 + (v - 0.27) * 0.38) return [vela, Math.PI / 2]
    if (v > 0.33 && v < 0.58 && bu < 0 && bu > -(v - 0.33) * 0.22) return [P.su(P.chiaro, P.contro), Math.PI / 2]
    if (ds < sole.r) return [giallo, tang((u - sole.x) * a, v - sole.y)]
    if (v < oriz) return [v + 0.08 * n < 0.22 ? P.chiaro2 : P.chiaro, 0.1 * Math.sin(u * 4 + s)]
    if (Math.abs(u - sole.x) * a < 0.05 + (v - oriz) * 0.25 && n > -0.3) return [giallo, 0]
    if (n > 0.62) return [P.chiaro, 0.05 * n]
    return [v + 0.06 * n < 0.72 ? P.medio : P.scuro2, 0.08 * Math.sin(u * 20 + s)]
  }
}

/** I cinque colori in ruoli da pittore: dal più scuro al più chiaro, più il più vivo (il primo della copertina). */
function ruoli(col, api) {
  const per = [...col].sort((x, y) => api.luminanza(x) - api.luminanza(y))
  const n = per.length
  const dist = (x, y) => { const a = api.rgbDi(x), b = api.rgbDi(y); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) }
  // come un pittore: gli stessi pigmenti, ma il più scuro con un po' di nero e il più chiaro con un po' di bianco
  const piatta = api.luminanza(per[n - 1]) - api.luminanza(per[0]) < 0.08
  const scuro = api.mescola(per[0], '#0d0a10', piatta ? 0.45 : 0.22)
  const chiaro = api.mescola(per[n - 1], '#fff8ea', piatta ? 0.45 : 0.22)
  const lontano = (c) => col.reduce((m, x) => (dist(x, c) > dist(m, c) ? x : m), col[0])
  /** il colore che si stacca da `sfondo`: quello preferito se si vede, se no il più lontano della copertina */
  const su = (sfondo, pref) => (dist(sfondo, pref) > 95 ? pref : lontano(sfondo))
  return { mix: api.mescola, vivo: col[0], contro: lontano(col[0]), scuro, scuro2: per[Math.min(1, n - 1)], medio: per[Math.floor(n / 2)], chiaro2: per[Math.max(0, n - 2)], chiaro, su }
}

// gli strati del pittore: [quante, larghezza min, max (px su una tela alta 250), lunghezza min, max (in altezze), quota sui contorni]
const STRATI = [[95, 30, 46, 0.22, 0.42, 0], [240, 14, 24, 0.12, 0.24, 0.15], [430, 6, 11, 0.06, 0.13, 0.5], [190, 2.4, 4.6, 0.025, 0.06, 0.9]]

function pennellate(campo, rnd, a, api) {
  const out = []
  for (const [quante, w0, w1, l0, l1, bordi] of STRATI) {
    for (let i = 0; i < quante; i++) {
      let u = rnd() * 1.08 - 0.04, v = rnd() * 1.08 - 0.04
      // gli ultimi strati ripassano i contorni: si cerca un punto dove il soggetto cambia colore
      if (rnd() < bordi) {
        for (let k = 0; k < 10; k++) {
          const cu = limita(u, 0, 1), cv = limita(v, 0, 1), c = campo(cu, cv, a)[0], e = 0.025
          if (campo(limita(cu + e / a, 0, 1), cv, a)[0] !== c || campo(cu, limita(cv + e, 0, 1), a)[0] !== c || campo(limita(cu - e / a, 0, 1), cv, a)[0] !== c || campo(cu, limita(cv - e, 0, 1), a)[0] !== c) break
          u = rnd(); v = rnd()
        }
      }
      const [c0, ang0] = campo(limita(u, 0, 1), limita(v, 0, 1), a)
      const vicino = rnd() < 0.07
      const base = vicino ? campo(limita(u + (rnd() - 0.5) * 0.1, 0, 1), limita(v + (rnd() - 0.5) * 0.1, 0, 1), a)[0] : c0
      const tono = api.mescola(base, rnd() < 0.5 ? '#ffffff' : '#000000', rnd() * 0.13)
      const lung = l0 + rnd() * (l1 - l0)
      const passi = 6
      let x = u, y = v, ang = ang0 + (rnd() - 0.5) * 0.35
      if (rnd() < 0.5) ang += Math.PI
      const pts = [[x, y]]
      for (let k = 0; k < passi; k++) {
        const [, an] = campo(limita(x, 0, 1), limita(y, 0, 1), a)
        // la direzione segue il campo senza girarsi del tutto (una pennellata non torna indietro)
        let d = an - ang
        while (d > Math.PI / 2) d -= Math.PI
        while (d < -Math.PI / 2) d += Math.PI
        ang += d * 0.45
        x += (Math.cos(ang) * lung) / passi / a
        y += (Math.sin(ang) * lung) / passi
        pts.push([x, y])
      }
      const w = w0 + rnd() * (w1 - w0)
      out.push({
        pts, w,
        setole: Math.round(limita(w / 2.4, 3, 12)),
        toni: [tono, api.mescola(tono, '#ffffff', 0.12), api.mescola(tono, '#000000', 0.14)],
        luce: api.mescola(tono, '#fffbe8', 0.5), ombra: api.mescola(tono, '#000000', 0.45),
        seme: (rnd() * 1e9) | 0,
        alfa: 0.82 + rnd() * 0.18,
      })
    }
  }
  return out
}

/** una pennellata a setole: tante righe parallele, sfrangiate in fondo, col filo di luce e d'ombra dell'impasto */
function traccia(ctx, s, w, h, frac = 1) {
  const pts = s.pts.map(([u, v]) => [u * w, v * h])
  const n = Math.max(2, Math.ceil(pts.length * frac))
  const pw = (s.w * h) / 250
  const norm = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
    return [-dy / l, dx / l]
  })
  const r = caso(s.seme)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const riga = (off, fine, larg) => {
    ctx.beginPath()
    for (let i = 0; i < fine; i++) {
      // la pennellata si assottiglia ai capi
      const sm = i === 0 || i === pts.length - 1 ? 0.7 : 1
      const x = pts[i][0] + norm[i][0] * off * sm, y = pts[i][1] + norm[i][1] * off * sm
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
    }
    ctx.lineWidth = larg
    ctx.stroke()
  }
  for (let b = 0; b < s.setole; b++) {
    const off = (b / (s.setole - 1) - 0.5) * pw + (r() - 0.5) * pw * 0.12
    const fine = Math.max(2, Math.min(n, Math.round(pts.length * (0.7 + r() * 0.3) * frac + 0.5)))
    ctx.strokeStyle = s.toni[b % 3]
    ctx.globalAlpha = s.alfa * (0.7 + r() * 0.3)
    riga(off, fine, (pw / s.setole) * 1.9)
  }
  // l'impasto: un filo di luce da una parte, un filo d'ombra dall'altra
  ctx.globalAlpha = 0.42
  ctx.strokeStyle = s.luce
  riga(-pw * 0.34, n, Math.max(0.6, pw * 0.07))
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = s.ombra
  riga(pw * 0.42, n, Math.max(0.6, pw * 0.06))
  ctx.globalAlpha = 1
}

/** il pennello in mano a nessuno: la punta sporca del colore, la ghiera, il manico rosso laccato */
function pennello(ctx, x, y, col, k, ondeggia) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  ctx.rotate(0.62 + ondeggia)
  ctx.fillStyle = 'rgba(0,0,0,.28)'
  ctx.beginPath(); ctx.ellipse(5, -40, 4, 34, 0.12, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#7a1a10'
  ctx.beginPath(); ctx.moveTo(-3.2, -24); ctx.lineTo(-2.1, -84); ctx.quadraticCurveTo(0, -88, 2.1, -84); ctx.lineTo(3.2, -24); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#c8331f'
  ctx.beginPath(); ctx.moveTo(-2.4, -24); ctx.lineTo(-1.5, -83); ctx.lineTo(0.6, -83); ctx.lineTo(0.9, -24); ctx.closePath(); ctx.fill()
  const g = ctx.createLinearGradient(-4, 0, 4, 0)
  g.addColorStop(0, '#6b6b6b'); g.addColorStop(0.35, '#f4f4f4'); g.addColorStop(1, '#8a8a8a')
  ctx.fillStyle = g
  ctx.fillRect(-4, -25, 8, 11)
  ctx.fillStyle = '#2b2118'
  ctx.beginPath(); ctx.moveTo(-4, -14); ctx.quadraticCurveTo(-4.5, -6, 0, 1); ctx.quadraticCurveTo(4.5, -6, 4, -14); ctx.closePath(); ctx.fill()
  ctx.fillStyle = col
  ctx.beginPath(); ctx.moveTo(-3.6, -8); ctx.quadraticCurveTo(-3.6, -3, 0, 1.5); ctx.quadraticCurveTo(3.6, -3, 3.6, -8); ctx.closePath(); ctx.fill()
  ctx.restore()
}

// la chiocciola-custode col basco, seduta sulla cornice
const LUMACA = `<svg class="lab-quadro__lumaca" viewBox="0 0 96 70" aria-hidden="true" focusable="false">
  <g class="lab-quadro__corpo">
    <path d="M12 64 C 8 56, 9 44, 15 38 C 21 33, 29 37, 30 46 L 31 53 C 52 52, 74 52, 92 62 C 88 67, 60 68, 30 68 Z" fill="#9fd4d2" stroke="#161616" stroke-width="2" stroke-linejoin="round"/>
    <path d="M36 62 q10 2 20 0 M60 63 q10 1 18 -1" fill="none" stroke="#161616" stroke-width="1" opacity=".45"/>
    <path class="lab-quadro__bocca" d="M13 50 q5 5 10 0" fill="none" stroke="#161616" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="25" cy="47" r="2.3" fill="#f08e8e" opacity=".75"/>
    <g class="lab-quadro__guscio">
      <circle cx="60" cy="38" r="21" fill="#e8622c" stroke="#161616" stroke-width="2"/>
      <path d="M60 38 m0 -3 a3 3 0 1 1 -3 3 a6.5 6.5 0 1 1 6.5 6.5 a10.5 10.5 0 1 1 -10.5 -10.5 a15 15 0 1 1 15 15" fill="none" stroke="#161616" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M45 30 q4 -9 13 -11" fill="none" stroke="#fff3c4" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      <path d="M71 21 l12 -15" stroke="#c8331f" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M83 6 l3 -4" stroke="#2b2118" stroke-width="3.6" stroke-linecap="round"/>
      <path class="lab-quadro__punta" d="M86 2 l2.4 -3" stroke="#e8622c" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="57" cy="17.5" rx="14" ry="4.6" transform="rotate(-14 57 17.5)" fill="#1b1b1b"/>
      <path d="M55 13 q1 -4 3 -4" fill="none" stroke="#1b1b1b" stroke-width="2.4" stroke-linecap="round"/>
    </g>
    <g class="lab-quadro__antenna lab-quadro__antenna--a"><path d="M16 39 L 10 15" stroke="#161616" stroke-width="2.6" stroke-linecap="round"/><path d="M16 39 L 10 15" stroke="#9fd4d2" stroke-width="1" stroke-linecap="round"/>
      <g class="lab-quadro__occhio"><circle cx="10" cy="13" r="4" fill="#fff" stroke="#161616" stroke-width="1.6"/><circle class="lab-quadro__pupilla" cx="9" cy="13.4" r="1.7" fill="#161616"/></g>
      <path class="lab-quadro__chiuso" d="M6 13 a4 4 0 0 1 8 0 z M6.2 13.4 q3.8 2.8 7.6 0" fill="#7fbfbd" stroke="#161616" stroke-width="1.6" stroke-linecap="round"/></g>
    <g class="lab-quadro__antenna lab-quadro__antenna--b"><path d="M23 37 L 25 12" stroke="#161616" stroke-width="2.6" stroke-linecap="round"/><path d="M23 37 L 25 12" stroke="#9fd4d2" stroke-width="1" stroke-linecap="round"/>
      <g class="lab-quadro__occhio"><circle cx="25" cy="10" r="4" fill="#fff" stroke="#161616" stroke-width="1.6"/><circle class="lab-quadro__pupilla" cx="24" cy="10.4" r="1.7" fill="#161616"/></g>
      <path class="lab-quadro__chiuso" d="M21 10 a4 4 0 0 1 8 0 z M21.2 10.4 q3.8 2.8 7.6 0" fill="#7fbfbd" stroke="#161616" stroke-width="1.6" stroke-linecap="round"/></g>
  </g>
  <text class="lab-quadro__zzz" x="31" y="16">z<tspan dx="1" dy="-5">z</tspan><tspan dx="1" dy="-5">z</tspan></text>
</svg>`

export default {
  id: 'quadro',
  titolo: { it: 'Quadro vivo', en: 'Living painting' },
  testo: {
    it: 'La copertina di Spotify diventa cinque colori, e i cinque colori diventano un quadro a olio che si dipinge da solo mentre il brano suona. Cambia brano, cambia capolavoro.',
    en: 'The Spotify cover becomes five colours, and the five colours become an oil painting that paints itself while the track plays. Change track, change masterpiece.',
  },
  tecnologie: ['Canvas 2D', 'Canvas color extraction', 'ResizeObserver'],
  monta(el, api) {
    const lang = api.lang
    const L = (k) => t(lang, k)
    const anno = new Date().getFullYear()
    el.innerHTML = `<div class="lab-quadro">
      <span class="lab-quadro__lampada" aria-hidden="true"><i></i></span>
      <canvas class="lab-quadro__tela" role="img" aria-label="${esc(L('nota'))}"></canvas>
      <span class="lab-quadro__placca" aria-hidden="true">${esc(L('placca'))} · ${anno}</span>
      ${LUMACA}
      <p class="lab-quadro__fumetto" data-fumetto aria-live="polite"></p>
    </div>
    <div class="lab-quadro__pie">
      <div class="lab-quadro__targa">
        <span class="lab-quadro__autore"><small data-attr>${esc(L('attribuito'))}</small> <b data-autore>—</b></span>
        <span class="lab-quadro__opera"><cite data-titolo>—</cite>, ${anno}</span>
        <span data-tecnica>—</span>
        <span data-misure>—</span>
        <span class="lab-quadro__avanza"><span data-avanza>—</span><i class="lab-quadro__barra" aria-hidden="true"><i data-barra></i></i></span>
        <span class="lab-quadro__coll">${esc(L('collezione'))}</span>
        <span class="lab-quadro__prezzo"><i class="lab-quadro__bollino" aria-hidden="true"></i><span data-prezzo>—</span></span>
        <span class="lab-quadro__timbro" data-timbro>${esc(L('timbroCorso'))}</span>
      </div>
      <div class="lab-quadro__banco">
        <span class="lab-quadro__tavolozza" aria-hidden="true"><span class="lab-quadro__palette" data-palette></span></span>
        <span class="lab-quadro__vietato" aria-hidden="true">${esc(L('vietato'))}</span>
        <button type="button" class="lab__bottone lab__bottone--fantasma lab-quadro__tocca" data-tocca>✋ ${esc(L('tocca'))}</button>
      </div>
    </div>
    <p class="lab__nota">${esc(L('nota'))}</p>`

    const box = el.querySelector('.lab-quadro')
    const canvas = el.querySelector('canvas')
    const $ = (s) => el.querySelector(s)
    const titoloEl = $('[data-titolo]'), autoreEl = $('[data-autore]'), attrEl = $('[data-attr]'), tecnicaEl = $('[data-tecnica]')
    const misureEl = $('[data-misure]'), avanzaEl = $('[data-avanza]'), barraEl = $('[data-barra]'), prezzoEl = $('[data-prezzo]')
    const timbroEl = $('[data-timbro]'), paletteEl = $('[data-palette]'), fumetto = $('[data-fumetto]'), tocca = $('[data-tocca]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const tema = api.tema()
    const ripiego = [tema.p || NIENTE[0], tema.a || NIENTE[1], NIENTE[2], NIENTE[3], NIENTE[4]]

    let a = api.adesso()
    let colori = ripiego
    let quadro = null // { seme, tipo, P, campo, tratti, a, w, h }
    const buf = document.createElement('canvas')
    let bctx = null, fatti = 0, frazione = 0, raf = 0, attivo = true, ultimo = 0, seq = 0, ultimaP = -1, ultimoTimbro = ''
    const ditate = [] // le ditate di chi tocca l'opera (restano finché non cambia il quadro)
    let tocchi = 0, tFumetto = 0
    const inizio = performance.now()

    // ── la trama della tela (una volta sola) ──
    const trama = document.createElement('canvas')
    trama.width = trama.height = 6
    {
      const c = trama.getContext('2d')
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(0, 0, 6, 1); c.fillRect(0, 3, 6, 1)
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(2, 0, 1, 6); c.fillRect(5, 0, 1, 6)
    }
    let motivo = null

    function progresso() {
      if (DBG.get('qp')) return +DBG.get('qp') // DBG
      const tr = a.track
      const ora = Date.now()
      if (tr && tr.inizio && tr.fine && tr.fine > tr.inizio) return limita((ora - tr.inizio) / (tr.fine - tr.inizio), 0, 1)
      // senza brano (o senza tempi): la chiocciola dipinge in un giro di tre minuti, poi lo lascia asciugare 40 secondi
      const giro = (ora % 220000) / 180000
      return Math.min(1, giro)
    }
    const quante = (p) => (quadro ? Math.round(quadro.tratti.length * (0.05 + 0.95 * (1 - (1 - p) ** 1.6))) : 0)

    function dimensioni() {
      const w = Math.max(1, canvas.clientWidth || 320), h = Math.max(1, canvas.clientHeight || 240)
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      return { w, h, dpr }
    }

    /** la tela preparata: imprimitura, trama, schizzo a carboncino trovato sui bordi del soggetto */
    function prepara() {
      const { w, h, dpr } = dimensioni()
      for (const c of [canvas, buf]) {
        if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
      }
      bctx = buf.getContext('2d')
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const asp = w / h
      if (quadro.a !== asp) {
        const r = caso(quadro.seme)
        quadro.campo = soggetto(quadro.tipo, quadro.P, caso(quadro.seme ^ 0x5bd1e995))
        quadro.tratti = pennellate(quadro.campo, r, asp, api)
        quadro.a = asp
      }
      quadro.w = w; quadro.h = h
      const P = quadro.P
      const fondo = api.mescola(P.medio, '#c9a46a', 0.55)
      bctx.globalCompositeOperation = 'source-over'
      bctx.fillStyle = fondo
      bctx.fillRect(0, 0, w, h)
      const sf = bctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.7)
      sf.addColorStop(0, 'rgba(255,248,225,.22)'); sf.addColorStop(1, 'rgba(60,40,10,.25)')
      bctx.fillStyle = sf
      bctx.fillRect(0, 0, w, h)
      // il carboncino: dove il soggetto cambia colore, un segno
      const passo = 5, r = caso(quadro.seme + 7)
      bctx.strokeStyle = 'rgba(30,22,16,.55)'
      bctx.lineWidth = 1.1
      bctx.lineCap = 'round'
      bctx.beginPath()
      for (let y = 0; y < h; y += passo) {
        for (let x = 0; x < w; x += passo) {
          const c = quadro.campo(x / w, y / h, asp)[0]
          const dx = quadro.campo(Math.min(1, (x + passo) / w), y / h, asp)[0]
          const dy = quadro.campo(x / w, Math.min(1, (y + passo) / h), asp)[0]
          if (c !== dx || c !== dy) {
            const j = () => (r() - 0.5) * 2.2
            bctx.moveTo(x + j(), y + j())
            bctx.lineTo(x + (c !== dy ? passo : 0) + j(), y + (c !== dx ? passo : 0) + j())
          }
        }
      }
      bctx.stroke()
      for (let i = 0; i < fatti; i++) traccia(bctx, quadro.tratti[i], w, h)
      for (const d of ditate) ditata(bctx, d, w, h)
    }

    function ditata(ctx, d, w, h) {
      const x = d.u * w, y = d.v * h, k = h / 250
      ctx.save()
      ctx.translate(x, y); ctx.rotate(d.ang)
      ctx.globalAlpha = 0.85
      const g = ctx.createLinearGradient(-22 * k, 0, 22 * k, 0)
      g.addColorStop(0, d.c + '00'); g.addColorStop(0.25, d.c); g.addColorStop(1, d.c + '00')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.ellipse(0, 0, 22 * k, 7 * k, 0, 0, Math.PI * 2); ctx.fill()
      // le righe del polpastrello
      ctx.strokeStyle = 'rgba(0,0,0,.22)'
      ctx.lineWidth = 0.8
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.ellipse(-8 * k, 0, i * 2.2 * k, i * 1.6 * k, 0, -1.2, 1.2); ctx.stroke() }
      ctx.restore()
    }

    function disegna(ora) {
      if (!quadro || !bctx) return
      const { w, h } = quadro
      const ctx = canvas.getContext('2d')
      const { dpr } = dimensioni()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(buf, 0, 0, w, h)
      const tempo = (ora - inizio) / 1000
      const fermo = api.reduced()
      // la pennellata in corso, e il pennello che la fa
      if (!fermo && fatti < quadro.tratti.length && frazione > 0) {
        const s = quadro.tratti[fatti]
        traccia(ctx, s, w, h, frazione)
        const i = Math.min(s.pts.length - 1, Math.max(0, Math.ceil(s.pts.length * frazione) - 1))
        pennello(ctx, s.pts[i][0] * w, s.pts[i][1] * h, s.toni[0], h / 250, 0.06 * Math.sin(tempo * 7))
      } else if (!fermo && fatti > 0 && fatti < quadro.tratti.length) {
        const s = quadro.tratti[fatti - 1]
        const [u, v] = s.pts.at(-1)
        pennello(ctx, u * w, v * h - 4 - 3 * Math.abs(Math.sin(tempo * 2.2)), s.toni[0], h / 250, 0.1 * Math.sin(tempo * 1.4))
      }
      // la trama della tela che si vede sotto il colore
      motivo ||= ctx.createPattern(trama, 'repeat')
      ctx.globalAlpha = 0.09
      ctx.fillStyle = motivo
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
      // la lampada da museo: un cono di luce calda che respira piano
      const respiro = fermo ? 0.5 : 0.5 + 0.5 * Math.sin(tempo * ((Math.PI * 2) / 5.2))
      const luce = ctx.createRadialGradient(w * 0.5, -h * 0.15, 0, w * 0.5, -h * 0.15, h * 1.15)
      luce.addColorStop(0, `rgba(255,236,190,${0.2 + 0.08 * respiro})`)
      luce.addColorStop(0.55, 'rgba(255,230,180,.05)')
      luce.addColorStop(1, 'rgba(255,230,180,0)')
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = luce
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
      const vign = ctx.createRadialGradient(w * 0.5, h * 0.42, Math.min(w, h) * 0.35, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
      vign.addColorStop(0, 'rgba(20,10,0,0)'); vign.addColorStop(1, 'rgba(20,10,0,.38)')
      ctx.fillStyle = vign
      ctx.fillRect(0, 0, w, h)
    }

    /** quante pennellate devono esserci adesso, e il pennello che le raggiunge */
    function avanza() {
      if (!quadro) return
      const voluti = quante(progresso())
      if (voluti < fatti) { fatti = 0; frazione = 0; ditate.length = 0; prepara() } // giro nuovo (senza brano)
      const indietro = voluti - fatti
      if (indietro > 30) {
        // il «time-lapse» quando si apre a brano già iniziato: tante pennellate per volta
        const n = Math.ceil(indietro / 14)
        for (let i = 0; i < n; i++) traccia(bctx, quadro.tratti[fatti++], quadro.w, quadro.h)
        frazione = 0
      } else if (indietro > 0) {
        frazione += 0.09 + indietro * 0.03
        while (frazione >= 1 && fatti < voluti) { traccia(bctx, quadro.tratti[fatti++], quadro.w, quadro.h); frazione -= 1 }
        if (fatti >= voluti) frazione = 0
      }
      targa();
    }

    function targa() {
      if (!quadro) return
      const p = quadro.tratti.length ? fatti / quadro.tratti.length : 0
      const pc = Math.round(p * 100)
      if (pc === ultimaP) return
      ultimaP = pc
      const finito = fatti >= quadro.tratti.length
      avanzaEl.textContent = finito ? L('asciuga') : (T[lang] || T.en).avanza(pc)
      barraEl.style.transform = `scaleX(${p.toFixed(3)})`
      const timbro = finito ? quadro.timbro : L('timbroCorso')
      if (timbro !== ultimoTimbro) {
        ultimoTimbro = timbro
        timbroEl.textContent = timbro
        timbroEl.dataset.fase = finito ? 'fatto' : 'corso'
      }
    }

    function nuovoQuadro(tr) {
      const chiave = tr ? `${tr.titolo}|${tr.artista}` : 'silenzio'
      const seme = semi(chiave)
      const r = caso(seme ^ 0x9e3779b9)
      const tipo = DBG.get('qsog') || (tr ? SOGGETTI[seme % SOGGETTI.length] : 'ritratto') // DBG
      const D = T[lang] || T.en
      const parola = tr ? parolaChiave(tr) : ''
      const titolo = tr ? `${D.soggetti[tipo].replace('{n}', String(7 + (seme % 90)))} ${parola}` : D.silenzio
      const scelta = (lista) => lista[Math.floor(r() * lista.length)]
      quadro = {
        seme, tipo, a: 0, P: ruoli(colori, api), tratti: [],
        titolo,
        autore: tr ? tr.artista || D.anonimo : D.anonimo,
        tecnica: tr ? scelta(D.tecniche) : D.tecnicaNiente,
        prezzo: tr ? scelta(D.prezzi) : D.prezzoNiente,
        timbro: tr ? scelta(D.timbri) : D.timbroNiente,
      }
      fatti = 0; frazione = 0; ultimaP = -1; ditate.length = 0
      prepara()
      // a brano già iniziato si parte quasi al punto giusto: le ultime pennellate si vedono arrivare in time-lapse
      { const v = quante(progresso()) - (api.reduced() || DBG.get('qp') ? 0 : 36); while (fatti < v) traccia(bctx, quadro.tratti[fatti++], quadro.w, quadro.h) }
      titoloEl.textContent = quadro.titolo
      autoreEl.textContent = quadro.autore
      attrEl.hidden = !tr
      tecnicaEl.textContent = quadro.tecnica
      misureEl.textContent = tr && tr.fine > tr.inizio ? D.misure(durata(tr.fine - tr.inizio)) : D.misureVar
      prezzoEl.textContent = quadro.prezzo
      box.dataset.soggetto = tipo
      canvas.setAttribute('aria-label', D.etichetta(quadro.titolo, quadro.autore))
      targa()
      disegna(performance.now())
    }

    function swatches() {
      paletteEl.innerHTML = colori.map((c, i) => `<i style="background:${esc(c)};--i:${i}"></i>`).join('')
    }

    async function colora(tr) {
      const mio = ++seq
      const p = await api.palette(tr?.img, ripiego)
      if (mio !== seq) return
      colori = p
      swatches()
      api.stato(stato, tr ? L('pronto') : L('attesa'), tr ? 'ok' : '')
      nuovoQuadro(tr)
    }

    function custode() { box.dataset.dorme = a.status === 'offline' ? '1' : '0' }

    function ciclo(ora) {
      raf = 0
      if (!attivo) return
      if (ora - ultimo >= 32) { ultimo = ora; avanza(); disegna(ora) }
      raf = requestAnimationFrame(ciclo)
    }
    function accendi() { if (!raf && !api.reduced() && attivo) raf = requestAnimationFrame(ciclo) }
    function spegni() { cancelAnimationFrame(raf); raf = 0 }

    // ── vietato toccare ──
    function parla(testo) {
      fumetto.textContent = testo
      box.dataset.parla = '1'
      clearTimeout(tFumetto)
      tFumetto = setTimeout(() => { box.dataset.parla = '0' }, 2600)
    }
    function ritocca(u, v) {
      if (!quadro) return
      const c = quadro.P[['vivo', 'chiaro', 'medio', 'chiaro2'][tocchi % 4]]
      const d = { u, v, ang: (Math.random() - 0.5) * 1.2, c }
      ditate.push(d)
      if (ditate.length > 24) ditate.shift()
      ditata(bctx, d, quadro.w, quadro.h)
      const D = T[lang] || T.en
      parla(a.status === 'offline' && tocchi === 0 ? D.dorme : D.guardia[Math.min(tocchi, D.guardia.length - 1)])
      tocchi++
      box.dataset.scossa = String(tocchi % 2)
      disegna(performance.now())
    }
    const suTela = (e) => {
      const r = canvas.getBoundingClientRect()
      ritocca((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    }
    const suTasto = () => ritocca(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6)
    canvas.addEventListener('click', suTela)
    tocca.addEventListener('click', suTasto)

    const togli = api.onAdesso((x) => {
      const chiave = (y) => (y?.track ? `${y.track.titolo}|${y.track.artista}|${y.track.img}` : '')
      const cambia = chiave(x) !== chiave(a)
      a = x
      custode()
      if (cambia) colora(x.track)
      else if (api.reduced() && quadro) { const v = quante(progresso()); while (fatti < v) traccia(bctx, quadro.tratti[fatti++], quadro.w, quadro.h); targa(); disegna(performance.now()) }
    })

    let misura = ''
    const ro = new ResizeObserver(() => {
      const { w, h } = dimensioni()
      const m = `${Math.round(w)}x${Math.round(h)}`
      if (m === misura || !quadro) { misura = m; return }
      misura = m
      prepara()
      disegna(performance.now())
    })
    ro.observe(canvas)
    api.quandoVisibile(el, (v) => { attivo = v; if (v) accendi(); else spegni() })
    custode()
    colora(a.track)
    accendi()
    if (DBG.get('qtocca')) { const tt = setInterval(() => { if (!quadro) return; clearInterval(tt); const st = document.createElement('style'); st.textContent = '#panel-studio .lab-quadro__fumetto{transition:none!important}'; document.head.append(st); for (let i = 0; i < +DBG.get('qtocca'); i++) suTasto() }, 200) } // DBG
    return () => {
      togli(); spegni(); ro.disconnect(); clearTimeout(tFumetto)
      canvas.removeEventListener('click', suTela)
      tocca.removeEventListener('click', suTasto)
    }
  },
}
