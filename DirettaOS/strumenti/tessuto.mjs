// Diretta OS: la trama del tessuto della bandiera, 4096 × 4096, che si ripete senza giunte (pubblico/tessuto-4k.jpg).
// Una tela vera: fili di ordito (in piedi) e di trama (di traverso) che passano uno sopra e uno sotto, ognuno un po' più
// grosso o più chiaro del vicino e con i suoi ingrossamenti lungo la strada, la peluria delle fibre e qualche macchia
// larga. È in grigio: la bandiera ci moltiplica sopra i suoi colori (pubblico/bandiera.js), e la ricampiona alla grandezza
// che ha in onda.
//   node strumenti/tessuto.mjs            (serve ffmpeg)
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const N = 4096, PASSO = 4, FILI = N / PASSO // un filo ogni 4 pixel: 1024 fili per lato
const qui = path.dirname(fileURLToPath(import.meta.url))
const uscita = path.join(qui, '..', 'pubblico', 'tessuto-4k.jpg')

// numeri a caso ma sempre uguali
let seme = 20261121
const caso = () => { seme = (seme * 1664525 + 1013904223) >>> 0; return seme / 4294967296 }
// rumore che si ripete: una griglia di «n» valori per lato, interpolata morbida (si richiude su sé stessa)
function rumore2(n) {
  const g = Float32Array.from({ length: n * n }, caso)
  return (x, y) => { // x, y in 0…1
    const fx = x * n, fy = y * n, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j
    const a = g[(j % n) * n + (i % n)], b = g[(j % n) * n + ((i + 1) % n)], c = g[((j + 1) % n) * n + (i % n)], d = g[((j + 1) % n) * n + ((i + 1) % n)]
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v)
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv
  }
}
function rumore1(n) {
  const g = Float32Array.from({ length: n }, caso)
  return (x) => { const f = x * n, i = Math.floor(f), u = f - i, s = u * u * (3 - 2 * u); return g[i % n] + (g[(i + 1) % n] - g[i % n]) * s }
}
// ogni filo: quanto è chiaro e quanto è grosso, e come cambiano lungo la strada (gli ingrossamenti, «slub»)
const ordito = Array.from({ length: FILI }, () => ({ chiaro: (caso() - 0.5) * 0.09, grosso: 0.8 + caso() * 0.1, lungo: rumore1(48), nodi: rumore1(160) }))
const trama = Array.from({ length: FILI }, () => ({ chiaro: (caso() - 0.5) * 0.09, grosso: 0.8 + caso() * 0.1, lungo: rumore1(48), nodi: rumore1(160) }))
const peluria = rumore2(1024), macchie = rumore2(12), onde = rumore2(48)

const buf = Buffer.alloc(N * N)
for (let y = 0; y < N; y++) {
  const j = Math.floor(y / PASSO), fy = (y + 0.5) / PASSO - j, T = trama[j]
  for (let x = 0; x < N; x++) {
    const i = Math.floor(x / PASSO), fx = (x + 0.5) / PASSO - i, O = ordito[i]
    // quanto è grosso qui ogni filo (con gli ingrossamenti), e dove sta
    const nodoO = Math.max(0, O.nodi(y / N) - 0.82) * 1.8, nodoT = Math.max(0, T.nodi(x / N) - 0.82) * 1.8
    const wO = Math.min(0.98, O.grosso + (O.lungo(y / N) - 0.5) * 0.12 + nodoO), wT = Math.min(0.98, T.grosso + (T.lungo(x / N) - 0.5) * 0.12 + nodoT)
    const dO = Math.abs(fx - 0.5) / (wO / 2), dT = Math.abs(fy - 0.5) / (wT / 2) // 0 al centro del filo, 1 sul bordo
    const sopraO = (i + j) % 2 === 0 // a scacchi: qui passa sopra l'ordito, nel vicino la trama
    let v
    const cil = (d) => Math.sqrt(Math.max(0, 1 - d * d)) // il filo è tondo: chiaro al centro, scuro ai lati
    if (sopraO ? dO < 1 : dT < 1) {
      // il filo che sta sopra: si inarca (più chiaro a metà dell'incrocio, più scuro dove va sotto)
      const arco = Math.sin(Math.PI * (sopraO ? fy : fx))
      const F = sopraO ? O : T, d = sopraO ? dO : dT
      v = 0.5 + 0.34 * cil(d) * (0.62 + 0.38 * arco) + F.chiaro + (sopraO ? nodoO : nodoT) * 0.25
    } else if (sopraO ? dT < 1 : dO < 1) {
      // si vede quello sotto, fra un filo e l'altro: più scuro
      const F = sopraO ? T : O, d = sopraO ? dT : dO
      v = 0.36 + 0.2 * cil(d) + F.chiaro * 0.7
    } else v = 0.18 // il buchino fra quattro fili
    // la peluria delle fibre, le onde leggere del tessuto, qualche macchia larga
    v += (peluria(x / N, y / N) - 0.5) * 0.12 + (onde(x / N, y / N) - 0.5) * 0.05 + (macchie(x / N, y / N) - 0.5) * 0.06
    buf[y * N + x] = Math.max(0, Math.min(255, Math.round(v * 255)))
  }
}
const grezzo = path.join(os.tmpdir(), `tessuto-${process.pid}.gray`)
fs.writeFileSync(grezzo, buf)
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', `${N}x${N}`, '-i', grezzo, '-q:v', '3', '-pix_fmt', 'gray', uscita], { stdio: 'inherit' })
fs.rmSync(grezzo, { force: true })
if (r.status) process.exit(r.status)
let m = 0; for (let k = 0; k < buf.length; k += 97) m += buf[k]
console.log(`fatto ${path.relative(process.cwd(), uscita)}: ${N} × ${N}, ${(fs.statSync(uscita).size / 1e6).toFixed(1)} MB, media ${(m / Math.ceil(buf.length / 97) / 255).toFixed(3)}`)
