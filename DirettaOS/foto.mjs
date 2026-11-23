// Diretta OS: la foto della stanza senza i pezzi, per l'anteprima «foto» della regia e per il sensore della lente.
// Ogni mezz'ora (e quando premi «scatta adesso») prende un fotogramma vero della webcam «Camo» a 1920 × 1080. In
// quell'immagine i pezzi ci sono già, perché Camo li mette sopra prima di mandarla. Dove stanno (i riquadri che le
// pagine di Camo mandano ogni due secondi, più un margine per ombre e contorni) si tiene la foto di prima, con il
// passaggio sfumato. Così la foto non ha mai sopra le sovrimpressioni, e la diretta non si accorge di niente: niente
// pezzi che spariscono per un attimo.

import { spawn } from 'node:child_process'
import fs from 'node:fs'

export const FW = 1920, FH = 1080
const N = FW * FH * 3

// ffmpeg con l'immagine grezza (rgb24) in uscita o in entrata; null se non va
function ffmpeg(args, dentro = null, ms = 20000) {
  return new Promise((ok) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: [dentro ? 'pipe' : 'ignore', 'pipe', 'ignore'], windowsHide: true })
    const pezzi = []
    const fra = setTimeout(() => { try { p.kill() } catch {} }, ms)
    p.stdout.on('data', (d) => pezzi.push(d))
    p.on('error', () => {})
    p.on('close', (c) => { clearTimeout(fra); ok(c === 0 ? Buffer.concat(pezzi) : null) })
    if (dentro) { p.stdin.on('error', () => {}); p.stdin.end(dentro) }
  })
}

// un fotogramma vero della webcam (i primi li salta: possono essere vecchi, rimasti nel buffer). Con «prova» (un video
// o una foto) lo prende da lì, per provare senza Camo.
export async function scatta(camo, prova = null) {
  const ingresso = prova ? ['-i', prova] : ['-f', 'dshow', '-rtbufsize', '32M', '-i', `video=${camo}`]
  const b = await ffmpeg([...ingresso, '-vf', `select=gte(n\\,${prova ? 0 : 8}),scale=${FW}:${FH}`, '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
  return b?.length === N ? b : null
}
export async function leggi(file) {
  if (!fs.existsSync(file)) return null
  const b = await ffmpeg(['-i', file, '-vf', `scale=${FW}:${FH}`, '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
  return b?.length === N ? b : null
}
// La stessa foto, ma piccola (640 × 360): serve all'occhio per confrontare il colore sotto ai pezzi appesi ai muri
// con la foto di inizio. La scala la fa ffmpeg una volta, quando la foto cambia; qui non si ricampiona niente.
export async function leggiPiccola(file, w, h) {
  if (!fs.existsSync(file)) return null
  const b = await ffmpeg(['-i', file, '-vf', `scale=${w}:${h}`, '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
  return b?.length === w * h * 3 ? b : null
}
// scrive il JPEG accanto e poi lo mette al posto del vecchio: chi lo sta leggendo non trova mai mezza foto
export async function scrivi(file, rgb) {
  const nuovo = file.replace(/\.jpg$/i, '.nuova.jpg')
  const b = await ffmpeg(['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${FW}x${FH}`, '-i', '-', '-q:v', '3', '-f', 'image2', '-y', nuovo], rgb)
  if (b === null || !fs.existsSync(nuovo)) return false
  for (let i = 0; i < 5; i++) {
    try { fs.renameSync(nuovo, file); return true } catch { await new Promise((r) => setTimeout(r, 200)) } // (se in quel momento la regia la sta leggendo)
  }
  try { fs.unlinkSync(nuovo) } catch {}
  return false
}

// la schermata di Camo senza telefono (grigia con la telecamerina) o un'immagine nera: non è una foto della stanza
export function finta(rgb) {
  let grigi = 0, luce = 0, n = 0
  for (let i = 0; i < N; i += 3 * 97) {
    const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2]
    if (Math.abs(r - 128) < 5 && Math.abs(g - 128) < 5 && Math.abs(b - 128) < 5) grigi++
    luce += r + g + b; n++
  }
  return grigi / n > 0.5 || luce / n / 3 < 8
}

// la foto a 64 × 36 in grigio, come la guarda il sensore della lente (ogni punto è la media di 30 × 30 pixel)
export function piccola(rgb) {
  const out = Buffer.alloc(64 * 36)
  for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) {
    let s = 0
    for (let yy = y * 30; yy < y * 30 + 30; yy += 3) for (let xx = x * 30; xx < x * 30 + 30; xx += 3) { const j = (yy * FW + xx) * 3; s += rgb[j] * 77 + rgb[j + 1] * 150 + rgb[j + 2] * 29 }
    out[y * 64 + x] = Math.round(s / 100 / 256)
  }
  return out
}

// La foto nuova, ma dove ci sono i pezzi (riquadri [x, y, w, h, pezzo] nella tela) quella vecchia. Il margine copre
// contorni e ombre; quelli che seguono (Giugnoh, il cartellino della puff) ne hanno di più, perché fra un riquadro e
// l'altro si muovono. Il bordo della tela è sempre della foto vecchia (la cornice, anche se fosse una GIF). Il passaggio
// fra le due è sfumato su una trentina di pixel, così non si vedono i rettangoli.
export function componi(nuova, vecchia, riquadri) {
  const Q = 4, w = FW / Q, h = FH / Q // la maschera si fa a un quarto: basta e avanza, ed è veloce
  let a = new Float32Array(w * h).fill(1)
  const togli = (x, y, bw, bh) => {
    const x0 = Math.max(0, Math.floor(x / Q)), y0 = Math.max(0, Math.floor(y / Q)), x1 = Math.min(w, Math.ceil((x + bw) / Q)), y1 = Math.min(h, Math.ceil((y + bh) / Q))
    for (let yy = y0; yy < y1; yy++) a.fill(0, yy * w + x0, yy * w + Math.max(x0, x1))
  }
  for (const [x, y, bw, bh, p] of riquadri) { const m = p === 'nome' || p === 'puff' ? 80 : 40; togli(x - m, y - m, bw + 2 * m, bh + 2 * m) }
  togli(0, 0, FW, 24); togli(0, FH - 24, FW, 24); togli(0, 0, 24, FH); togli(FW - 24, 0, 24, FH)
  // sfuma: due passate di media su 9 × 9 a un quarto (il passaggio dura una sessantina di pixel veri, metà dentro il
  // margine: dove comincia il pezzo vero la foto nuova pesa ormai meno dell'1%)
  for (let passo = 0; passo < 2; passo++) {
    const t = new Float32Array(w * h), r = 4
    for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { t[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)] } }
    const u = new Float32Array(w * h)
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { u[y * w + x] = s / (2 * r + 1); s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x] } }
    a = u
  }
  const out = Buffer.allocUnsafe(N)
  for (let y = 0; y < FH; y++) {
    const riga = Math.min(h - 1, y / Q | 0) * w
    for (let x = 0; x < FW; x++) {
      const k = a[riga + Math.min(w - 1, x / Q | 0)], j = (y * FW + x) * 3
      out[j] = vecchia[j] + (nuova[j] - vecchia[j]) * k
      out[j + 1] = vecchia[j + 1] + (nuova[j + 1] - vecchia[j + 1]) * k
      out[j + 2] = vecchia[j + 2] + (nuova[j + 2] - vecchia[j + 2]) * k
    }
  }
  return out
}
