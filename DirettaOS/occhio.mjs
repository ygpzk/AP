// Diretta OS: l'occhio. Legge la webcam virtuale «Camo» 10 volte al secondo, ma solo quando serve (Giugnoh che segue la
// testa, la puff, l'anteprima dal vivo aperta in regia, i pezzi appesi ai muri), e ci trova tre cose:
//   la testa  Ultra-Light Face Detector con Windows ML (volti.cs → cache/volti.exe; volti.ps1 è il ripiego): vede la
//             faccia anche girata, inclinata o che guarda giù verso la tastiera. Guarda un ritaglio attorno a dov'era la
//             testa; se l'ha persa, la foto intera.
//             Se per un attimo non la trova (di schiena, mano davanti), segue il pezzo d'immagine dell'ultima volta.
//   la puff   il suo azzurro, insegnato con un clic sull'anteprima: cerca le macchie piene di quel colore della sua
//             misura (i tasti accesi della tastiera sono puntini, la puff due blocchi pieni) e sceglie la più vicina
//             a dov'era. Non guarda mai dove ci sono i pezzi in sovrimpressione (la «maschera», che le pagine di
//             Camo mandano ogni due secondi): le scritte lime, il «?» azzurro di un'immagine non la ingannano.
//             Con la «zona della puff» (disegnata in regia, una per lente) cerca solo lì dentro: la puff si mette
//             sempre lì, quindi quello che c'è lì è lei
//   la copertura  il colore attorno ai pezzi appesi ai muri, confrontato con la foto di inizio (la foto della stanza):
//             se qualcosa cambia nell'anello attorno a un pezzo (una persona, una mano, un oggetto), quel pezzo si
//             nasconde, come se ci passassi davanti. Il confronto tollera ombre e cambi di luce; la sagoma del corpo
//             non si calcola più (niente MediaPipe): basta il colore.
// L'immagine di Camo ha già sopra le sovrimpressioni: i pezzi che seguono stanno sopra la testa e accanto alla puff,
// mai dentro, così l'occhio non insegue sé stesso.
// Lavora a 640 × 360 (un terzo della tela): i punti che manda alle pagine sono già in coordinate della tela 1920 × 1080.
// Meno pixel = meno lavoro per ffmpeg, per il modello e per il browser dell'anteprima; per la testa, la puff e la
// copertura bastano.

import path from 'node:path'
import fs from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { chiudiBene } from './cam.mjs' // la webcam «Camo» si chiude con le buone

export const W = 640, H = 360
const S = 1920 / W // da qui alla tela 1920 × 1080 (maschera, zona della puff, punti per le pagine)
// 10 foto al secondo, qualunque sia la webcam: Camo può mandarne 30 o 60 (con il profilo a 60, «una ogni tre» ne
// faceva 20). Il filtro fps le porta a 10, e il resto del lavoro scende con loro.
const FPS = 10
const RW = 320, RH = 240 // il ritaglio che guarda il modello dei volti
// Il modello dei volti costa 20–30 ms a fotogramma: non serve a ogni foto. Lo si chiede 4 volte al secondo (e subito
// quando la testa si perde, o ogni 2 s per riguardare tutta la foto); in mezzo la testa la segue l'immagine, che è
// quasi gratis. La puff si cerca 5 volte al secondo: il cartellino fra una misura e l'altra va liscio lo stesso.
const VOLTI_OGNI = 250, PUFF_OGNI = 200

// ── piccoli attrezzi ──
export function grigio(rgb) {
  const g = new Uint8Array(W * H)
  for (let i = 0, j = 0; i < g.length; i++, j += 3) g[i] = (rgb[j] * 77 + rgb[j + 1] * 150 + rgb[j + 2] * 29) >> 8
  return g
}
// tinta 0–360, saturazione e luce 0–1
function hsv(r, g, b) {
  const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m
  let h = 0
  if (d) h = M === r ? ((g - b) / d + 6) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, M ? d / M : 0, M / 255]
}
const giro = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }
// un rettangolo della foto ridotto a 320 × 240, facendo la media dei pixel (niente seghettature)
export function ritaglio(rgb, x0, y0, cw, ch) {
  const out = Buffer.alloc(RW * RH * 3), sx = cw / RW, sy = ch / RH
  for (let y = 0; y < RH; y++) {
    const ya = Math.min(H - 1, Math.max(0, Math.floor(y0 + y * sy))), yb = Math.min(H, Math.max(ya + 1, Math.floor(y0 + (y + 1) * sy)))
    for (let x = 0; x < RW; x++) {
      const xa = Math.min(W - 1, Math.max(0, Math.floor(x0 + x * sx))), xb = Math.min(W, Math.max(xa + 1, Math.floor(x0 + (x + 1) * sx)))
      let r = 0, g = 0, b = 0, n = 0
      for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) { const j = (yy * W + xx) * 3; r += rgb[j]; g += rgb[j + 1]; b += rgb[j + 2]; n++ }
      const o = (y * RW + x) * 3
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n
    }
  }
  return out
}
// dove guardare: attorno alla testa (la faccia viene grande come piace al modello), o tutta la foto
export function doveGuardo(testa) {
  if (!testa) return [0, 0, W, H]
  let cw = Math.min(W, Math.max(240, testa.w * 6.5)), ch = cw * 0.75
  if (ch > H) { ch = H; cw = H / 0.75 }
  const x0 = Math.min(W - cw, Math.max(0, testa.x + testa.w / 2 - cw / 2)), y0 = Math.min(H - ch, Math.max(0, testa.y + testa.h / 2 - ch / 2))
  return [x0, y0, cw, ch]
}

// la maschera: dove ci sono i pezzi in sovrimpressione (rettangoli nella tela 1920 × 1080, con un po' di margine)
export function maschera(riquadri) {
  if (!riquadri?.length) return null
  const m = new Uint8Array(W * H)
  for (const [x, y, w, h] of riquadri) {
    const x0 = Math.max(0, Math.floor((x - 10) / S)), y0 = Math.max(0, Math.floor((y - 10) / S))
    const x1 = Math.min(W, Math.ceil((x + w + 10) / S)), y1 = Math.min(H, Math.ceil((y + h + 10) / S))
    for (let yy = y0; yy < y1; yy++) m.fill(1, yy * W + x0, yy * W + Math.max(x0, x1))
  }
  return m
}

// ── la puff ──
// Il colore: i pixel colorati proprio sotto il clic (se il clic è caduto sul serbatoio nero, un po' più in là), fuori
// dalla maschera: le scritte della sovrimpressione lì vicino non devono entrarci.
export function insegnaPuff(rgb, x, y, mask = null) {
  for (const r of [4, 7, 11, 17]) {
    const pixel = []
    for (let yy = Math.max(0, y - r); yy < Math.min(H, y + r); yy++) for (let xx = Math.max(0, x - r); xx < Math.min(W, x + r); xx++) {
      if (mask?.[yy * W + xx]) continue
      const j = (yy * W + xx) * 3, [h, s, v] = hsv(rgb[j], rgb[j + 1], rgb[j + 2])
      if (s >= 0.35 && v >= 0.22) pixel.push([h, s, v])
    }
    if (pixel.length < 12) continue
    // la tinta più presente (istogramma a 10°), poi la media attorno a lei
    const conta = new Array(36).fill(0)
    for (const [h] of pixel) conta[Math.floor(h / 10) % 36]++
    const picco = conta.indexOf(Math.max(...conta)) * 10 + 5
    const suoi = pixel.filter(([h]) => giro(h, picco) <= 20)
    let sx = 0, sy = 0
    for (const [h] of suoi) { sx += Math.cos(h * Math.PI / 180); sy += Math.sin(h * Math.PI / 180) }
    const h = (Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360
    const ss = suoi.map((p) => p[1]).sort((a, b) => a - b), vv = suoi.map((p) => p[2]).sort((a, b) => a - b)
    const col = { h: Math.round(h), dh: 16, smin: +Math.max(0.28, ss[Math.floor(ss.length * 0.15)] * 0.75).toFixed(2), vmin: +Math.max(0.16, vv[Math.floor(vv.length * 0.15)] * 0.6).toFixed(2), area: 0 }
    // la misura: la macchia di quel colore sotto il clic
    const m = macchie(rgb, col, x - 40, y - 40, x + 40, y + 40, mask)
    const sua = m.toSorted((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]
    col.area = Math.max(20, sua?.area ?? suoi.length)
    return col
  }
  return null
}
// quante altre macchie dello stesso colore ha attorno (oltre ai due blocchi della puff stessa)
function folla(m, tutte) { const l = Math.max(m.box[2], m.box[3]) * 3; let n = 0; for (const a of tutte) if (a !== m && Math.hypot(a.x - m.x, a.y - m.y) <= l) n++; return Math.max(0, n - 2) }

// la zona appena disegnata (in 640 × 360): la puff è lì. Il colore che c'è di più è il fondo (il tavolo, sotto la
// luce calda sembra arancione): si mette da parte, e fra i pixel rimasti ben colorati la macchia piccola e piena è lei
export function insegnaNellaZona(rgb, [x0, y0, x1, y1], mask = null) {
  const tutti = new Array(36).fill(0), forti = new Array(36).fill(0)
  for (let y = Math.max(0, y0 | 0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(W, x1); x++) {
    if (mask?.[y * W + x]) continue
    const j = (y * W + x) * 3, [h, s, v] = hsv(rgb[j], rgb[j + 1], rgb[j + 2]), k = Math.floor(h / 10) % 36
    if (s >= 0.2 && v >= 0.15) tutti[k]++
    if (s >= 0.5 && v >= 0.25) forti[k]++
  }
  // (il fondo si toglie solo se è davvero il fondo: almeno un quarto della zona; un tavolo grigio non ha colore)
  const fondo = tutti.indexOf(Math.max(...tutti)), area = (x1 - x0) * (y1 - y0)
  if (tutti[fondo] >= area * 0.25) for (let d = -3; d <= 3; d++) forti[(fondo + d + 36) % 36] = 0
  if (Math.max(...forti) < 15) return null
  const picco = forti.indexOf(Math.max(...forti)) * 10 + 5
  const prova = { h: picco, dh: 20, smin: 0.5, vmin: 0.25, area: 1 }
  // fra le macchie di quel colore, la più grande fra quelle che stanno da sole (la tastiera accesa è una folla)
  const tutte = macchie(rgb, prova, x0, y0, x1, y1, mask)
  const m = tutte.filter((c) => c.area >= 12 && c.area <= area * 0.2 && c.pieno >= 0.3 && folla(c, tutte) === 0).sort((a, b) => b.area - a.area)[0]
  return m ? insegnaPuff(rgb, Math.round(m.x), Math.round(m.y), mask) : null
}

// le macchie piene del colore, dentro un rettangolo (ognuna con le sue somme, per chi vuole sapere come è girata)
export function macchie(rgb, col, x0, y0, x1, y1, mask = null) {
  x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0); x1 = Math.min(W, x1 | 0); y1 = Math.min(H, y1 | 0)
  const w = x1 - x0, h = y1 - y0
  if (w <= 0 || h <= 0) return []
  const si = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y + y0) * W + x + x0
    if (mask?.[k]) continue
    const j = k * 3, [hh, s, v] = hsv(rgb[j], rgb[j + 1], rgb[j + 2])
    if (s >= col.smin && v >= col.vmin && giro(hh, col.h) <= col.dh) si[y * w + x] = 1
  }
  const fuori = [], pila = []
  for (let i = 0; i < si.length; i++) {
    if (si[i] !== 1) continue
    let area = 0, ax = Infinity, ay = Infinity, bx = -1, by = -1, mx = 0, my = 0, xx = 0, yy = 0, xy = 0
    si[i] = 2; pila.push(i)
    while (pila.length) {
      const k = pila.pop(), x = k % w, y = (k / w) | 0
      area++; mx += x; my += y; xx += x * x; yy += y * y; xy += x * y
      if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y
      if (x > 0 && si[k - 1] === 1) { si[k - 1] = 2; pila.push(k - 1) }
      if (x < w - 1 && si[k + 1] === 1) { si[k + 1] = 2; pila.push(k + 1) }
      if (y > 0 && si[k - w] === 1) { si[k - w] = 2; pila.push(k - w) }
      if (y < h - 1 && si[k + w] === 1) { si[k + w] = 2; pila.push(k + w) }
    }
    if (area < 6) continue
    const bw = bx - ax + 1, bh = by - ay + 1
    // (le somme sono nelle misure della foto intera: quelle di due macchie si sommano e basta)
    fuori.push({ x: x0 + mx / area, y: y0 + my / area, area, box: [x0 + ax, y0 + ay, bw, bh], pieno: area / (bw * bh),
      somme: [area, mx + area * x0, my + area * y0, xx + 2 * x0 * mx + area * x0 * x0, yy + 2 * y0 * my + area * y0 * y0, xy + x0 * my + y0 * mx + area * x0 * y0] })
  }
  return fuori
}
// dov'è adesso: vicino a dov'era (o dappertutto, se l'ha persa); i blocchi vicini fra loro sono la stessa puff
export function trovaPuff(rgb, col, prima, mask = null, zona = null) {
  const [zx0, zy0, zx1, zy1] = zona ?? [0, 0, W, H], r = 115
  const tutte = prima ? macchie(rgb, col, Math.max(zx0, prima.x - r), Math.max(zy0, prima.y - r), Math.min(zx1, prima.x + r), Math.min(zy1, prima.y + r), mask)
    : macchie(rgb, col, zx0, zy0, zx1, zy1, mask)
  const cand = tutte.filter((m) => m.area >= Math.max(10, col.area * 0.18) && m.area <= col.area * 6 && m.pieno >= 0.3)
  if (!cand.length) return prima ? trovaPuff(rgb, col, null, mask, zona) : null
  // la folla: la puff è uno o due blocchi da soli, la tastiera accesa è un mucchio di puntini dello stesso colore
  const voto = (m) => Math.abs(Math.log(m.area / col.area)) + (prima ? Math.hypot(m.x - prima.x, m.y - prima.y) / 60 : 0) + folla(m, tutte) * 0.35
  const meglio = cand.toSorted((a, b) => voto(a) - voto(b))[0]
  const lato = Math.max(meglio.box[2], meglio.box[3]) * 2.6
  let [ax, ay, bw, bh] = meglio.box, bx = ax + bw, by = ay + bh
  for (const m of cand) if (m !== meglio && Math.hypot(m.x - meglio.x, m.y - meglio.y) <= lato) {
    ax = Math.min(ax, m.box[0]); ay = Math.min(ay, m.box[1]); bx = Math.max(bx, m.box[0] + m.box[2]); by = Math.max(by, m.box[1] + m.box[3])
  }
  return { x: (ax + bx) / 2, y: (ay + by) / 2, w: bx - ax, h: by - ay }
}

// ── la testa quando il modello non la vede: correlazione col pezzo d'immagine dell'ultima volta ──
export function fotoTesta(g, f) {
  // il riquadro del volto, un po' più largo (cuffie, capelli ai lati), mai sopra la fronte: lì c'è la scritta
  const tw = Math.round(f.w * 1.2) & ~1, th = Math.round(f.h) & ~1
  const x0 = Math.round(f.x + f.w / 2 - tw / 2), y0 = Math.round(f.y)
  if (x0 < 0 || y0 < 0 || x0 + tw > W || y0 + th > H || tw < 12 || th < 12) return null
  const t = new Float32Array(tw * th)
  let m = 0
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) m += t[y * tw + x] = g[(y0 + y) * W + x0 + x]
  m /= t.length
  for (let i = 0; i < t.length; i++) t[i] -= m
  // si confronta un pixel ogni «p», per riga e per colonna: circa 24 × 24 punti, grande o piccola che sia la faccia
  const p = Math.max(2, Math.round(tw / 24))
  let n = 0, k = 0
  for (let y = 0; y < th; y += p) for (let x = 0; x < tw; x += p) { n += t[y * tw + x] ** 2; k++ }
  return { t, tw, th, p, k, n: Math.sqrt(n) || 1, var: n / k, dx: x0 - f.x, dy: y0 - f.y, w: f.w, h: f.h }
}
function somiglia(g, F, x0, y0) {
  const { t, tw, th, p, k } = F
  let m = 0
  for (let y = 0; y < th; y += p) for (let x = 0; x < tw; x += p) m += g[(y0 + y) * W + x0 + x]
  m /= k
  let s = 0, q = 0
  for (let y = 0; y < th; y += p) for (let x = 0; x < tw; x += p) { const d = g[(y0 + y) * W + x0 + x] - m; s += d * t[y * tw + x]; q += d * d }
  // un pezzo di muro liscio può «somigliare» per caso: se è molto più piatto della faccia, non vale
  if (q / k < F.var * 0.3) return -1
  return s / (Math.sqrt(q) * F.n || 1)
}
export function seguiTesta(g, F, prima) {
  const passo = F.p, r = Math.round(Math.min(70, Math.max(18, F.w * 0.9)))
  const cx = Math.round(prima.x + F.dx), cy = Math.round(prima.y + F.dy)
  let meglio = null
  const prova = (x, y) => {
    if (x < 0 || y < 0 || x + F.tw > W || y + F.th > H) return
    const s = somiglia(g, F, x, y)
    if (!meglio || s > meglio.s) meglio = { x, y, s }
  }
  for (let y = cy - r; y <= cy + r; y += passo) for (let x = cx - r; x <= cx + r; x += passo) prova(x, y)
  if (!meglio) return null
  const c = meglio, fino = Math.ceil(passo / 2)
  for (let y = c.y - fino; y <= c.y + fino; y++) for (let x = c.x - fino; x <= c.x + fino; x++) prova(x, y)
  return meglio.s >= 0.6 ? { x: meglio.x - F.dx, y: meglio.y - F.dy, w: F.w, h: F.h, s: +meglio.s.toFixed(2) } : null
}
// tra i volti trovati, il mio: il più vicino a dov'era la testa, se c'era; altrimenti il più grande.
// Il modello prende per facce anche cose che non lo sono: il logo di Discord fra le icone delle app appese sulla tv
// (una faccina, sicura all'84%), una foto, la tv accesa. Una volta lì ci restava per sempre, perché poi guarda solo
// attorno a dov'era la testa. Per questo:
//   finto(v)  i volti dentro un pezzo in sovrimpressione non valgono (li abbiamo disegnati noi)
//   intera    quando ha guardato la foto intera (ogni due secondi lo fa apposta): se altrove c'è una faccia ben più
//             grande di quella che seguiva, sei tu quella. Sei il più vicino alla webcam: la faccia più grande è la tua
const stesso = (v, prima) => Math.hypot(v.x + v.w / 2 - prima.x - prima.w / 2, v.y + v.h / 2 - prima.y - prima.h / 2) <= Math.max(prima.w, v.w) * 2.5
export function ilMio(volti, prima, intera = false, finto = () => false) {
  const buoni = volti.filter((v) => v.w >= 14 && v.p >= 0.7 && !finto(v))
  if (!buoni.length) return null
  const grande = buoni.toSorted((a, b) => b.w * b.h - a.w * a.h)[0]
  if (prima) {
    const d = (v) => Math.hypot(v.x + v.w / 2 - prima.x - prima.w / 2, v.y + v.h / 2 - prima.y - prima.h / 2)
    const vicino = buoni.filter((v) => stesso(v, prima)).toSorted((a, b) => d(a) - d(b))[0]
    if (vicino && !(intera && grande.w * grande.h > vicino.w * vicino.h * 2)) return vicino
  }
  return grande
}
// i pezzi che possono far credere una faccia: non Giugnoh (sta sopra la tua testa e ti segue), non la cornice, non
// quelli grandi come mezza tela (la brocca fa cadere l'acqua da tutto il cielo: il suo riquadro copre anche te)
export const pezziFinti = (riquadri) => riquadri.filter((q) => q[4] !== 'nome' && q[4] !== 'puff' && q[4] !== 'cornice' && q[2] * q[3] < 1920 * 1080 * 0.15)
// quanta parte di un riquadro (640 × 360) sta sotto la maschera
export function sotto(m, v) {
  if (!m) return 0
  let n = 0, si = 0
  for (let y = Math.max(0, v.y | 0); y < Math.min(H, v.y + v.h); y += 2) for (let x = Math.max(0, v.x | 0); x < Math.min(W, v.x + v.w); x += 2) { n++; if (m[y * W + x]) si++ }
  return n ? si / n : 0
}

// ── la copertura: il colore dell'anello attorno a un pezzo, contro la foto di inizio ──
// Il riquadro che arriva dalle pagine è il box del pezzo più 28 px di margine (nella tela): l'anello si prende fuori
// da quel margine, a 4–10 px di distanza (in 640 × 360), dove il pezzo non arriva con ombre e aloni. Si confronta col
// colore della foto della stanza nello stesso punto:
//   · un'ombra o una luce diversa cambia la luminosità ma non i colori (il rapporto fra i canali resta quello): non conta;
//   · una persona, una mano, un oggetto cambiano il colore o spengono il pixel: contano.
// Torna quanta parte dell'anello è cambiata (0…1) e quanti punti si sono guardati: sotto una certa soglia il pezzo
// resta dov'è, sopra si nasconde (con un attimo di isteresi, per non farlo tremare).
const COPERTURA_SOGLIA = 0.18
const COPERTURA_MIN = 40
export function cambioSotto(cor, rif, r, passo = 2) {
  // r = [x, y, w, h] in 640 × 360, già con il margine delle pagine
  const x0 = Math.max(0, Math.round(r[0])), y0 = Math.max(0, Math.round(r[1]))
  const x1 = Math.min(W, Math.round(r[0] + r[2])), y1 = Math.min(H, Math.round(r[1] + r[3]))
  if (x1 - x0 < 4 || y1 - y0 < 4) return { frazione: 0, n: 0 }
  let n = 0, c = 0
  const guarda = (x, y) => {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const i = (y * W + x) * 3
    const rr = rif[i], rg = rif[i + 1], rb = rif[i + 2], cr = cor[i], cg = cor[i + 1], cb = cor[i + 2]
    const sr = rr + rg + rb, sc = cr + cg + cb
    // (entrambi quasi neri: non c'è colore da confrontare, non è un cambiamento)
    if (sr < 24 && sc < 24) { n++; return }
    if (sr < 24 || sc < 24) { n++; c++; return }
    const lr = 0.2126 * rr + 0.7152 * rg + 0.0722 * rb
    const lc = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb
    // il colore senza la luce: se cambia solo l'esposizione, i tre rapporti restano uguali
    const dr = cr / sc - rr / sr, dg = cg / sc - rg / sr, db = cb / sc - rb / sr
    const dc = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db))
    const k = lr > 4 ? lc / lr : 1
    n++
    // (k fuori da 0,55…1,8 vuol dire che il pixel è molto più scuro/chiaro, non è un'ombra leggera)
    if (dc > 0.12 || k < 0.55 || k > 1.8) c++
  }
  // l'anello appena fuori dal box: quattro strisce, così si guarda una volta sola ogni punto
  const pad = 4, largo = 6
  const ax = Math.max(0, x0 - pad - largo), ay = Math.max(0, y0 - pad - largo)
  const bx = Math.min(W, x1 + pad + largo), by = Math.min(H, y1 + pad + largo)
  for (let y = ay; y < y0 - pad; y += passo) for (let x = ax; x < bx; x += passo) guarda(x, y)
  for (let y = y1 + pad; y < by; y += passo) for (let x = ax; x < bx; x += passo) guarda(x, y)
  for (let y = Math.max(ay, y0 - pad); y < Math.min(by, y1 + pad); y += passo) {
    for (let x = ax; x < x0 - pad; x += passo) guarda(x, y)
    for (let x = x1 + pad; x < bx; x += passo) guarda(x, y)
  }
  return { frazione: n >= COPERTURA_MIN ? c / n : 0, n }
}

// Le foto JPEG che ffmpeg manda una dopo l'altra (mjpeg): ognuna va da FFD8 a FFD9. Dentro i dati compressi un FF è
// sempre seguito da 00 o da un RSTn, quindi il primo FF seguito da altro, dopo l'inizio della scansione, è la fine.
// Risponde null (ne serve ancora), { salta: n } (n byte da buttare) o { fine: n } (una foto intera, lunga n).
const SOI = Buffer.from([0xff, 0xd8])
function tagliaJpeg(b) {
  if (b.length < 4) return null
  if (b[0] !== 0xff || b[1] !== 0xd8) { const k = b.indexOf(SOI, 1); return { salta: k > 0 ? k : b.length - 1 } }
  let i = 2
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return { salta: 2 } // (non è un JPEG come si deve: si va avanti a cercare il prossimo)
    const m = b[i + 1]
    if (m === 0xff) { i++; continue }
    if (m === 0xd9) return { fine: i + 2 }
    const lungo = b.readUInt16BE(i + 2)
    if (m !== 0xda) { i += 2 + lungo; continue }
    for (let j = i + 2 + lungo; j + 1 < b.length; j++) {
      if (b[j] !== 0xff) continue
      const n = b[j + 1]
      if (n === 0x00 || (n >= 0xd0 && n <= 0xd7)) { j++; continue }
      if (n === 0xd9) return { fine: j + 2 }
    }
    return null
  }
  return null
}

// ── l'occhio acceso: ffmpeg, il modello dei volti, il giro di ogni fotogramma ──
// vuole()     dice se serve (lo chiede da sé una volta al secondo)
// colore()    il colore della puff insegnato, o null
// manda(p)    riceve { testa, puff, t } in coordinate della tela, 10 volte al secondo (t = quando è arrivata la foto)
// riquadri(c) i rettangoli dei pezzi in sovrimpressione adesso (c = anche il cartellino della puff)
// prova       (per provarlo senza Camo) un video o una foto da leggere al posto della webcam, in giro
// zona()      la zona della puff per la lente di adesso, [x, y, w, h] nella tela, o null
// cerca()     se cercare la testa e la puff (no quando sei via: le foto per l'anteprima continuano ad arrivare)
export function creaOcchio({ qui, camo, log, vuole, colore, manda, riquadri = () => [], riquadriCopertura = () => [], zona = () => null, prova = null, cerca = () => true, serveTesta = () => true, serveCopertura = () => false, riferimento = () => null, cam = null, foto = null }) {
  const zonaOra = () => { const z = zona(); return z ? [z[0] / S, z[1] / S, (z[0] + z[2]) / S, (z[1] + z[3]) / S] : null }
  const FOTO = W * H * 3
  // la maschera si rifà solo quando i riquadri cambiano (arrivano ogni due secondi), non a ogni foto
  const ricorda = () => { let chiave = '', ora = null; return (r) => { const k = JSON.stringify(r); if (k !== chiave) { chiave = k; ora = maschera(r) } return ora } }
  const mascheraDi = ricorda(), mascheraVolti = ricorda()
  let ultimaIntera = 0 // l'ultima volta che ha cercato i volti in tutta la foto
  // l'ultima foto per l'anteprima, in memoria; chi aspetta la prossima (l'anteprima della regia) la riceve appena c'è
  let jpgUltima = null, jpgN = 0, jpgResto = Buffer.alloc(0)
  const attese = new Set()
  const jpgOra = () => (ff && jpgUltima && Date.now() - jpgUltima.t < 3000 ? jpgUltima : null)
  function jpgArriva(buf) {
    jpgUltima = { buf, n: ++jpgN, t: Date.now() }
    for (const a of attese) if (jpgUltima.n > a.dopo) { clearTimeout(a.fra); attese.delete(a); a.ok(jpgUltima) }
  }
  let ff = null, volti = null, voltiPronto = false, attesa = null, ultimo = null
  let testa = null, faccia = null, puff = null, persaDa = 0, ultimaFoto = 0, adesso = null, lavora = false
  let ultimoModello = 0, ultimaPuff = 0 // (il modello dei volti e la puff non si chiedono a ogni foto: vedi VOLTI_OGNI)
  const conti = { arrivati: 0, fatti: 0, ms: { volti: 0, puff: 0, tutto: 0 }, da: Date.now() }, fattiAlle = [] // (per la regia: se l'occhio sta al passo)

  // L'aiutante dei volti è un piccolo .exe C# compilato una volta con csc (Windows ML): niente interprete PowerShell,
  // niente Add-Type a ogni avvio, meno memoria. Se csc o il modello non ci sono, i volti tornano a volti.ps1.
  const CSC = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
  const FW = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319'
  function compilaAiutante(cs, exe, nome) {
    try {
      const vecchio = fs.existsSync(exe) ? fs.statSync(exe).mtimeMs : 0
      if (!vecchio || fs.statSync(cs).mtimeMs > vecchio) {
        fs.mkdirSync(path.dirname(exe), { recursive: true })
        const r = spawnSync(CSC, ['/nologo', '/target:exe', '/platform:x64', '/optimize+', `/out:${exe}`,
          `/reference:${FW}\\System.Runtime.dll`, `/reference:${FW}\\System.Runtime.WindowsRuntime.dll`, `/reference:${FW}\\System.Runtime.InteropServices.WindowsRuntime.dll`,
          '/reference:C:\\Windows\\System32\\WinMetadata\\Windows.AI.winmd', '/reference:C:\\Windows\\System32\\WinMetadata\\Windows.Foundation.winmd', cs], { stdio: 'ignore', windowsHide: true })
        if (r.status === 0 && fs.existsSync(exe)) log(`occhio: aiutante ${nome} compilato`)
      }
      return fs.existsSync(exe) ? exe : null
    } catch (e) {
      log(`occhio: aiutante ${nome} non compilato (`, e.message, ')')
      return null
    }
  }
  let exeVolti
  function aiutanteVolti() {
    if (exeVolti !== undefined) return exeVolti
    exeVolti = compilaAiutante(path.join(qui, 'volti.cs'), path.join(qui, 'cache', 'volti.exe'), 'dei volti')
    if (!exeVolti) log('occhio: niente aiutante dei volti, uso volti.ps1')
    return exeVolti
  }
  function voltiAvvia() {
    if (volti) return
    const exe = aiutanteVolti()
    volti = exe
      ? spawn(exe, [path.join(qui, 'modelli', 'volti-rfb-320.onnx'), '0.6'], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
      : spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(qui, 'volti.ps1'), '-Soglia', '0.6'], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
    let righe = ''
    volti.stdout.setEncoding('utf8')
    volti.stdout.on('data', (t) => {
      righe += t
      const tutte = righe.split(/\r?\n/); righe = tutte.pop()
      for (const r of tutte) {
        if (r === 'PRONTO') { voltiPronto = true; log('occhio: il modello dei volti è pronto'); continue }
        if (r.startsWith('NO')) { log('occhio: niente volti,', r.slice(3)); continue }
        if (!r.startsWith('F') || !attesa) continue
        const a = attesa; attesa = null
        a(r.slice(2).split(';').filter(Boolean).map((v) => v.split(',').map(Number)))
      }
    })
    volti.stdin.on('error', () => {})
    volti.on('error', () => {})
    volti.on('close', () => { volti = null; voltiPronto = false; inVolo = false; if (attesa) { const a = attesa; attesa = null; a(null) } })
  }

  // ── la copertura: il colore attorno ai pezzi appesi ai muri, contro la foto di inizio ──
  // La foto di inizio è quella della stanza (la stessa della luce e dei muri): l'occhio la riceve già a 640 × 360 dal
  // server. Per ogni pezzo acceso con «dietro di me» si guarda l'anello attorno al suo riquadro (le pagine lo mandano
  // ogni due secondi, già con un margine) e si conta quanto è cambiato. Un'ombra cambia la luce ma non i colori e non
  // fa scattare niente; una persona o un oggetto sì. Il pezzo si nasconde dopo due letture di fila e torna dopo quasi
  // un secondo che l'anello è tornato com'era: niente tremolio.
  const coperti = new Map() // pezzo → { on, suDa, giuDa }
  let rifChiave = '', rifDati = null
  function coperturaSpegni() {
    if (!coperti.size && !rifDati) return
    for (const s of coperti.values()) s.on = false
    rifDati = null
  }
  function coperturaGuarda(rgb) {
    if (!serveCopertura()) { coperturaSpegni(); return }
    const r = riferimento()
    if (!r || !r.rgb || r.w !== W || r.h !== H || r.rgb.length !== W * H * 3 || !r.chiave) { coperturaSpegni(); return }
    if (r.chiave !== rifChiave) { rifChiave = r.chiave; rifDati = r.rgb; coperti.clear(); return } // (la foto è nuova: si riparte)
    rifDati = r.rgb
    const ora = Date.now()
    // un solo box per pezzo (se più pagine lo disegnano, vale l'unione)
    const box = new Map()
    for (const q of riquadriCopertura()) {
      if (!Array.isArray(q) || q.length < 5) continue
      const p = q[4]
      if (!serveCopertura(p)) continue
      const b = box.get(p)
      if (!b) box.set(p, [q[0], q[1], q[2], q[3]])
      else {
        const x0 = Math.min(b[0], q[0]), y0 = Math.min(b[1], q[1]), x1 = Math.max(b[0] + b[2], q[0] + q[2]), y1 = Math.max(b[1] + b[3], q[1] + q[3])
        b[0] = x0; b[1] = y0; b[2] = x1 - x0; b[3] = y1 - y0
      }
    }
    for (const [p, b] of box) {
      const m = cambioSotto(rgb, rifDati, [b[0] / S, b[1] / S, b[2] / S, b[3] / S])
      const s = coperti.get(p) ?? { on: false, suDa: 0, giuDa: 0 }
      if (m.n < COPERTURA_MIN) { s.suDa = 0; s.giuDa = ora }
      else if (m.frazione >= COPERTURA_SOGLIA) {
        s.giuDa = 0
        if (!s.suDa) s.suDa = ora
        if (!s.on && ora - s.suDa >= 160) s.on = true // (due letture: non basta un fotogramma)
      } else {
        s.suDa = 0
        if (!s.giuDa) s.giuDa = ora
        if (s.on && ora - s.giuDa >= 850) s.on = false // (torna quando l'anello è pulito da un po')
      }
      coperti.set(p, s)
    }
    // chi non è più disegnato (spento, staccato dal muro, pagina chiusa) torna visibile
    for (const [p, s] of coperti) if (!box.has(p)) {
      s.suDa = 0
      if (!s.giuDa) s.giuDa = ora
      if (s.on && ora - s.giuDa >= 700) { s.on = false; s.giuDa = 0 }
    }
  }
  function copertiOra() {
    const l = []
    for (const [p, s] of coperti) if (s.on) l.push(p)
    return l
  }
  // i volti nel ritaglio attorno alla testa (o in tutta la foto), già riportati sulla foto 640 × 360.
  // Una domanda alla volta: finché il modello non ha risposto alla precedente (anche se era scaduta) non se ne fa
  // un'altra, se no una risposta in ritardo finirebbe sul ritaglio sbagliato.
  let inVolo = false
  const chiediVolti = (rgb, intera = false) => new Promise((ok) => {
    if (!volti || !voltiPronto || inVolo) return ok(null)
    const [x0, y0, cw, ch] = doveGuardo(testa && persaDa === 0 && !intera ? testa : null)
    let fatto = false
    const fine = (l) => { if (fatto) return; fatto = true; ok(l && l.map(([a, b, c, d, p]) => ({ x: x0 + a * cw, y: y0 + b * ch, w: (c - a) * cw, h: (d - b) * ch, p }))) }
    attesa = (l) => { inVolo = false; fine(l) }
    inVolo = true
    setTimeout(() => fine(null), 800) // (questa risposta non la aspetta più; il modello resta «in volo» finché risponde)
    volti.stdin.write(ritaglio(rgb, x0, y0, cw, ch))
  })

  // I fotogrammi arrivano a raffiche: se ne arriva uno mentre si lavora sul precedente, si mette da parte (solo
  // l'ultimo, i vecchi si buttano) e si fa appena finito. Così non si accumulano e il più nuovo non si perde mai.
  let dopo = null
  async function fotogramma(rgb, quando) {
    if (lavora) { dopo = [rgb, quando]; return }
    if (!cerca()) { // (sei via: niente da cercare; quando torni riparte da capo)
      if (testa || puff) { testa = faccia = puff = null; persaDa = 0; manda({ testa: null, puff: null, t: quando, coperti: copertiOra() }) }
      return
    }
    lavora = true
    adesso = rgb
    const t0 = performance.now()
    try {
      const ora = Date.now()
      const vuoleTesta = serveTesta()
      if (!vuoleTesta && (testa || faccia)) { testa = faccia = null; persaDa = 0 }
      // la testa (ogni due secondi in tutta la foto: se stava seguendo una faccia finta, ti ritrova). Il modello dei
      // volti si chiede 4 volte al secondo, non a ogni foto: in mezzo la testa la segue l'immagine (seguiTesta).
      const intera = vuoleTesta && (!testa || persaDa !== 0 || ora - ultimaIntera > 2000)
      let v = null
      // (anche quando la testa non c'è o è appena stata persa, il modello si chiede al massimo 4 volte al secondo:
      // cercarla a ogni foto costa 20–30 ms per niente. Quando appare, in 250 ms la si trova lo stesso.)
      if (vuoleTesta && ora - ultimoModello >= VOLTI_OGNI) {
        ultimoModello = ora
        if (intera) ultimaIntera = ora
        v = await chiediVolti(rgb, intera)
      }
      const t1 = performance.now()
      const mF = mascheraVolti(pezziFinti(riquadri(true)))
      let mio = v ? ilMio(v, testa, intera, (f) => sotto(mF, f) >= 0.5) : null
      // una faccia piccola e lontana da dov'eri non sei tu che ti sei spostato: è una faccia finta sullo sfondo, vista
      // nell'attimo in cui il modello non vede te (guardi giù, la mano davanti). Vale solo se ti ha perso da 5 secondi
      if (mio && testa && !stesso(mio, testa) && mio.w * mio.h < testa.w * testa.h * 0.4 && (persaDa === 0 || Date.now() - persaDa < 5000)) mio = null
      if (mio && intera && testa && persaDa === 0 && stesso(mio, testa)) {
        // (era già lei: resta il riquadro di prima, che viene dal ritaglio stretto ed è più preciso)
      } else if (mio) {
        if (testa && !stesso(mio, testa)) { ultimaFoto = 0; if (persaDa === 0) log('occhio: quella non era la tua testa, adesso ti seguo') }
        testa = { x: mio.x, y: mio.y, w: mio.w, h: mio.h, da: 'volto' }; persaDa = 0
        if (Date.now() - ultimaFoto > 500) { faccia = fotoTesta(grigio(rgb), mio) ?? faccia; ultimaFoto = Date.now() }
      } else if (testa && faccia) {
        const s = seguiTesta(grigio(rgb), faccia, testa)
        if (s) { testa = { ...s, da: 'segue' }; persaDa = 0 } else { persaDa ||= Date.now(); testa = { ...testa, da: 'persa' } }
      }
      // la puff: 5 volte al secondo, tanto il cartellino fra una misura e l'altra va liscio lo stesso
      const col = colore(), t2 = performance.now()
      if (!col) puff = null
      else if (!puff || ora - ultimaPuff >= PUFF_OGNI) { ultimaPuff = ora; puff = trovaPuff(rgb, col, puff, mascheraDi(riquadri(false)), zonaOra()) }
      const t3 = performance.now()
      const k = conti.fatti++ ? 0.2 : 1 // (medie che scorrono)
      fattiAlle.push(Date.now()); while (fattiAlle.length && fattiAlle[0] < Date.now() - 5000) fattiAlle.shift()
      conti.ms.volti += (t1 - t0 - conti.ms.volti) * k; conti.ms.puff += (t3 - t2 - conti.ms.puff) * k; conti.ms.tutto += (t3 - t0 - conti.ms.tutto) * k
      const T = (b) => b && { x: Math.round(b.x * S), y: Math.round(b.y * S), w: Math.round(b.w * S), h: Math.round(b.h * S) }
      // t è quando la foto è arrivata da ffmpeg, non adesso: le pagine sanno quanto è vecchia e la portano avanti.
      // I pezzi coperti viaggiano con la stessa fotogramma: le pagine li nascondono/mostrano senza aspettare lo stato.
      manda({ testa: testa && { ...T(testa), da: testa.da, persa: persaDa ? Date.now() - persaDa : 0 }, puff: T(puff), t: quando, coperti: copertiOra() })
    } catch (e) { log('occhio:', e.message) } finally {
      lavora = false
      if (dopo) { const [f, q] = dopo; dopo = null; setImmediate(() => fotogramma(f, q)) }
    }
  }

  let riprova = 0, partito = 0, chiude = null
  function avvia() {
    if (ff || chiude || Date.now() < riprova) return
    // la webcam a turno (cam.mjs): se ce l'ha la lente si sposta e fra qualche secondo tocca all'occhio
    if (!prova && cam && !cam.chiedi('occhio')) return
    voltiAvvia()
    partito = Date.now()
    // Senza attese: niente buffer in ingresso, il buffer della webcam piccolo (se ffmpeg resta indietro butta le foto
    // vecchie invece di accodarle), il filtro fps porta tutto a 10 foto al secondo, e le foto escono così come sono.
    // (Camo espone solo 1920 × 1080: chiedergli 1280 × 720 lo fa fallire, quindi si prende la sua misura e si scala a 640 × 360)
    const ingresso = prova ? ['-stream_loop', '-1', '-re', '-i', prova] : ['-f', 'dshow', '-rtbufsize', '8M', '-fflags', 'nobuffer', '-i', `video=${camo}`]
    const scegli = `fps=${FPS}`
    // Due uscite: i fotogrammi grezzi per l'analisi (10 al secondo) e un JPEG per l'anteprima della regia (5 al
    // secondo, 640 × 360): il JPEG si vede in una finestrella, non in onda, e la metà delle volte basta.
    ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...ingresso,
      '-filter_complex', `[0:v]${scegli},split=2[t][p];[t]scale=${W}:${H}:flags=fast_bilinear[g];[p]fps=5,scale=${W}:${H}:flags=fast_bilinear[q]`,
      '-map', '[g]', '-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-flush_packets', '1', 'pipe:1',
      '-map', '[q]', '-fps_mode', 'passthrough', '-c:v', 'mjpeg', '-q:v', '7', '-f', 'mjpeg', '-flush_packets', '1', 'pipe:3'], { stdio: ['pipe', 'pipe', 'ignore', 'pipe'], windowsHide: true })
    ff.stdin.on('error', () => {}) // (stdin serve per chiuderlo con le buone: «q»)
    log(`occhio: acceso (la webcam ${FPS} volte al secondo)`)
    // ogni foto nel suo buffer, riempito man mano che arrivano i pezzi (niente Buffer.concat su 1,5 MB a ogni pezzo)
    let cur = Buffer.allocUnsafe(FOTO), pieno = 0
    ff.stdout.on('data', (pezzo) => {
      let da = 0
      while (da < pezzo.length) {
        const n = Math.min(FOTO - pieno, pezzo.length - da)
        pezzo.copy(cur, pieno, da, da + n); pieno += n; da += n
        if (pieno === FOTO) {
          ultimo = Date.now(); conti.arrivati++
          try { foto?.(cur, W, H) } catch {} // (il sensore della lente, che intanto non apre la webcam)
          fotogramma(cur, ultimo) // (se l'occhio è ancora sulla foto di prima, questa aspetta; se ne arriva un'altra, vince la nuova)
          coperturaGuarda(cur) // (il colore attorno ai pezzi appesi: va per conto suo, non aspetta i volti)
          cur = Buffer.allocUnsafe(FOTO); pieno = 0
        }
      }
    })
    ff.stdio[3].on('data', (pezzo) => {
      jpgResto = jpgResto.length ? Buffer.concat([jpgResto, pezzo]) : pezzo
      for (;;) {
        const r = tagliaJpeg(jpgResto)
        if (!r) break
        if (r.salta) { jpgResto = jpgResto.subarray(r.salta); continue }
        jpgArriva(Buffer.from(jpgResto.subarray(0, r.fine))); jpgResto = jpgResto.subarray(r.fine)
      }
      if (jpgResto.length > 4 << 20) jpgResto = Buffer.alloc(0)
    })
    ff.stdio[3].on('error', () => {})
    ff.on('error', () => {})
    ff.on('close', () => {
      ff = null; ultimo = null; jpgUltima = null; jpgResto = Buffer.alloc(0)
      cam?.lascia('occhio')
      for (const a of attese) { clearTimeout(a.fra); a.ok(null) }
      attese.clear()
      // se si è chiuso subito (Camo spento, webcam occupata) riprova fra 15 secondi, non a ogni giro
      if (!chiude && Date.now() - partito < 5000) { riprova = Date.now() + 15000; log('occhio: la webcam «' + camo + '» non si apre, riprovo fra 15 secondi') } else log('occhio: spento')
    })
  }
  // si spegne con le buone: «q» a ffmpeg, che chiude la webcam ed esce (di forza solo se dopo 5 secondi è ancora lì)
  function spegni() {
    if (ff && !chiude) { const p = ff; chiude = chiudiBene(p).then(() => { chiude = null }) }
    try { volti?.kill() } catch {} // (il modello dei volti non tocca la webcam)
    coperturaSpegni()
    testa = faccia = puff = adesso = dopo = null; persaDa = 0
    return chiude ?? Promise.resolve()
  }
  // una volta al secondo: si accende se serve; si spegne subito se la webcam serve ad altri (la foto della stanza) o va
  // lasciata libera, se no solo quando non serve più da 20 secondi (chiudere e riaprire la webcam di continuo è
  // proprio quello che faceva cadere il driver di Camo: un'anteprima chiusa e riaperta non la deve toccare)
  let volutoAlle = 0
  const giro = setInterval(() => {
    const ora = Date.now(), serve = vuole()
    if (serve) volutoAlle = ora
    if (ff) { if (cam?.cede('occhio') || (ora - volutoAlle > 20000 && ora - partito > 20000)) spegni() }
    else if (serve) avvia()
  }, 1000)
  process.on('exit', () => { clearInterval(giro); try { ff?.stdin.write('q') } catch {} try { volti?.kill() } catch {} })

  return {
    // l'ultima foto per l'anteprima ({ buf, n, t }), o null se l'occhio è spento o fermo
    jpg: jpgOra,
    // la prima foto più nuova della numero «dopo»: subito se c'è già, se no appena arriva (al massimo ms), se no null
    aspetta: (dopo, ms) => new Promise((ok) => {
      const j = jpgOra()
      if (j && j.n > dopo) return ok(j)
      const a = { dopo, ok, fra: setTimeout(() => { attese.delete(a); ok(jpgOra()) }, ms) }
      attese.add(a)
    }),
    acceso: () => !!ff,
    // il server si chiude: la webcam con le buone, e l'occhio non si riaccende più
    chiudi: () => { clearInterval(giro); return spegni() },
    conti: () => ({ ...conti, ms: Object.fromEntries(Object.entries(conti.ms).map(([k, v]) => [k, Math.round(v)])), volti: voltiPronto, fps: +(fattiAlle.filter((t) => t > Date.now() - 5000).length / 5).toFixed(1), cerca: cerca() }),
    // il clic in regia sulla puff (x, y nella tela): il colore da cercare, e la puff è lì
    insegna(x, y) {
      if (!adesso) return null
      const col = insegnaPuff(adesso, Math.round(x / S), Math.round(y / S), maschera(riquadri(true)))
      if (col) puff = { x: x / S, y: y / S, w: 13, h: 20 }
      return col
    },
    // la zona appena disegnata: il colore lo prende da solo da quello che c'è dentro
    insegnaZona() {
      const z = zonaOra()
      if (!adesso || !z) return null
      const col = insegnaNellaZona(adesso, z, maschera(riquadri(true)))
      if (col) puff = null
      return col
    },
  }
}
