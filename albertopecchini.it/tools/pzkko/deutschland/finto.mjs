#!/usr/bin/env node
// Il manifesto FINTO di Deutschland (9.11.2026, giorno 1 del cantiere: «sblocca l'Agente 3»): finché le foto vere non
// sono catalogate (l'importazione dall'iPhone è ancora in corso), la galleria si sviluppa su questo. Scrive in
// C:\pzkko-server\deutschland\dati\ un foto.json con la forma del contratto (piano del cantiere, «Manifesto»): 60 voci,
// 8 posti con nomi tedeschi, le tappe, il GPS lungo un percorso plausibile in due giorni fra Monaco e Stoccarda,
// 6 «video» col poster, i tag a caso fra i 15, il blur (webp 16 px in base64) e i file veri m\ g\ o\ p\ v\: quadrati
// colorati col numero scritto sopra, fatti con sharp (i video con ffmpeg, se c'è; se no un mp4 vuoto).
// Tutto col seme fisso: rilanciandolo esce uguale.
//
//   node tools/pzkko/deutschland/finto.mjs            scrive dati\foto.json e i file (quelli che ci sono già li lascia)
//   node tools/pzkko/deutschland/finto.mjs --rifai    rifà anche i file
// Poi il server: DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs  (127.0.0.1:8790, niente biglietto).
// Il manifesto vero (manifesto.mjs) lo sostituisce.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import sharp from 'sharp'
import { DATI, TAG, VIAGGIO, caso, scriviJson, ffmpeg, argomenti } from './comune.mjs'

const args = argomenti()
const rnd = caso(20261109)
const fra = (a, b) => a + (b - a) * rnd()
const scegli = (l) => l[Math.floor(rnd() * l.length)]

// gli 8 posti: 4 a Monaco il 6, l'autostrada e 3 a Stoccarda il 7 (nomi tedeschi finti ma plausibili)
const POSTI = [
  { id: 'p01', nome: 'Hauptbahnhof München', nomeAuto: 'Hauptbahnhof, Maxvorstadt, München', lat: 48.1402, lon: 11.5586, giorno: '2026-11-06', da: '10:40', tinta: 210 },
  { id: 'p02', nome: 'Marienplatz', nomeAuto: 'Marienplatz, Altstadt, München', lat: 48.1374, lon: 11.5755, giorno: '2026-11-06', da: '12:05', tinta: 30 },
  { id: 'p03', nome: 'Englischer Garten', nomeAuto: 'Englischer Garten, Schwabing, München', lat: 48.1526, lon: 11.5927, giorno: '2026-11-06', da: '15:20', tinta: 120 },
  { id: 'p04', nome: 'Hofbräuhaus', nomeAuto: 'Hofbräuhaus, Platzl 9, Altstadt, München', lat: 48.1377, lon: 11.5799, giorno: '2026-11-06', da: '20:30', tinta: 45 },
  { id: 'p05', nome: 'Rastplatz Aichen (A8)', nomeAuto: 'A8, Rastplatz Aichen, Landkreis Günzburg', lat: 48.4310, lon: 10.4190, giorno: '2026-11-07', da: '09:50', tinta: 0 },
  { id: 'p06', nome: 'Schlossplatz Stuttgart', nomeAuto: 'Schlossplatz, Stuttgart-Mitte', lat: 48.7784, lon: 9.1800, giorno: '2026-11-07', da: '12:30', tinta: 280 },
  { id: 'p07', nome: 'Mercedes-Benz Museum', nomeAuto: 'Mercedesstraße 100, Bad Cannstatt, Stuttgart', lat: 48.7880, lon: 9.2340, giorno: '2026-11-07', da: '15:10', tinta: 190 },
  { id: 'p08', nome: 'Cannstatter Wasen', nomeAuto: 'Cannstatter Wasen, Bad Cannstatt, Stuttgart', lat: 48.7960, lon: 9.2210, giorno: '2026-11-07', da: '19:40', tinta: 330 },
]
const N = 60, VIDEO = new Set([7, 18, 26, 37, 49, 56]), SCREENSHOT = new Set([12, 41])
const ALTRI = TAG.filter((t) => !['foto', 'video', 'screenshot'].includes(t))

const hsl = (h, s, l) => {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(255 * Math.max(0, Math.min(1, c))).toString(16).padStart(2, '0') }
  return `#${f(0)}${f(8)}${f(4)}`
}
const quadrato = (w, h, col, testo, sotto) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${col}"/><text x="50%" y="48%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(Math.min(w, h) * 0.28)}" fill="#fff" fill-opacity=".9">${testo}</text><text x="50%" y="62%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.07)}" fill="#fff" fill-opacity=".8">${sotto}</text></svg>`)

const FF = ffmpeg()
for (const d of ['m', 'g', 'o', 'p', 'v']) mkdirSync(path.join(DATI, d), { recursive: true })

const foto = [], tappe = []
let numero = 5500
for (const [pi, p] of POSTI.entries()) {
  const quante = pi === 4 ? 4 : 8
  const [hh, mm] = p.da.split(':').map(Number)
  let t = Date.UTC(...p.giorno.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))), hh - 1, mm) // ora di Monaco (+01:00) → UTC
  const da = foto.length
  for (let k = 0; k < quante; k++) {
    const i = foto.length
    numero += 1 + Math.floor(rnd() * 3)
    t += Math.round(fra(40, 900)) * 1000
    const d = new Date(t)
    const locale = new Date(t + 3600_000) // +01:00
    const iso = locale.toISOString().replace(/\.\d{3}Z$/, '+01:00')
    const video = VIDEO.has(i), screenshot = SCREENSHOT.has(i)
    const id = `img-${numero}`
    const verticale = rnd() < 0.6
    const w = video ? (verticale ? 1080 : 1920) : verticale ? 6048 : 8064, h = video ? (verticale ? 1920 : 1080) : verticale ? 8064 : 6048
    const col = hsl((p.tinta + fra(-18, 18) + 360) % 360, 45 + fra(-10, 15), 38 + fra(-8, 12))
    const tag = video ? ['video'] : screenshot ? ['screenshot', 'foto'] : ['foto']
    if (!screenshot) for (const x of [...ALTRI].sort(() => rnd() - 0.5).slice(0, 1 + Math.floor(rnd() * 2))) tag.push(x)
    const tStimato = !screenshot && rnd() < 0.08
    const voce = {
      id, tipo: video ? 'video' : 'foto', nome: `IMG_${numero}.${video ? 'MOV' : screenshot ? 'PNG' : 'HEIC'}`, t: iso, giorno: p.giorno, ora: iso.slice(11, 16), tStimato,
      lat: +(p.lat + fra(-0.0009, 0.0009)).toFixed(5), lon: +(p.lon + fra(-0.0012, 0.0012)).toFixed(5), gpsStimato: screenshot, posto: p.id,
      w, h, m: `${id}.webp`, g: `${id}.jpg`, peso: 0, blur: '', col, tag: TAG.filter((x) => tag.includes(x)), volti: screenshot ? 0 : Math.floor(rnd() * 4),
    }
    if (video) Object.assign(voce, { v: `${id}.mp4`, p: `${id}.jpg`, durata: +fra(3, 28).toFixed(1) })
    else voce.o = `${id}.jpg`
    foto.push(voce)
  }
  tappe.push({ posto: p.id, da, a: foto.length - 1 })
}

// i file: quadrati colorati col numero (480 webp, 1800 jpeg, l'«originale» 1800 jpeg, il poster; il video con ffmpeg)
let fatti = 0
for (const [i, f] of foto.entries()) {
  const lato = (L) => (f.w >= f.h ? { w: L, h: Math.round((L * f.h) / f.w) } : { w: Math.round((L * f.w) / f.h), h: L })
  const fa = async (L, file, fmt) => {
    if (existsSync(file) && !args.rifai) return
    const { w, h } = lato(L)
    const img = sharp(quadrato(w, h, f.col, String(i + 1), `${f.id} · ${f.ora}`))
    await (fmt === 'webp' ? img.webp({ quality: 72 }) : img.jpeg({ quality: 88, mozjpeg: true })).toFile(file)
    fatti++
  }
  await fa(480, path.join(DATI, 'm', f.m), 'webp')
  await fa(1800, path.join(DATI, 'g', f.g), 'jpeg')
  if (f.tipo === 'foto') await fa(1800, path.join(DATI, 'o', f.o), 'jpeg')
  else {
    await fa(1280, path.join(DATI, 'p', f.p), 'jpeg')
    const v = path.join(DATI, 'v', f.v)
    if (!existsSync(v) || args.rifai) {
      const { w, h } = lato(640)
      if (FF) {
        try { execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=${f.col.replace('#', '0x')}:s=${w - (w % 2)}x${h - (h % 2)}:d=${Math.min(f.durata, 6)}:r=24`, '-vf', `drawtext=text='${i + 1}':fontcolor=white:fontsize=${Math.round(Math.min(w, h) / 3)}:x=(w-text_w)/2:y=(h-text_h)/2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', v]); fatti++ }
        catch (e) { console.warn(`  ffmpeg non ce l'ha fatta per ${f.v} (${String(e.message).split('\n')[0]}): mp4 vuoto`); writeFileSync(v, '') }
      } else writeFileSync(v, '')
    }
  }
  // il blur (16 px webp) e il peso dell'originale (o del video)
  const { w, h } = lato(16)
  f.blur = `data:image/webp;base64,${(await sharp(quadrato(Math.max(w, 2), Math.max(h, 2), f.col, '', '')).webp({ quality: 40 }).toBuffer()).toString('base64')}`
  f.peso = (await import('node:fs/promises')).stat(path.join(DATI, f.tipo === 'foto' ? 'o' : 'v', f.tipo === 'foto' ? f.o : f.v)).then((s) => s.size)
}
for (const f of foto) f.peso = await f.peso

const posti = POSTI.map((p) => ({ id: p.id, nome: p.nome, nomeAuto: p.nomeAuto, lat: p.lat, lon: p.lon, n: foto.filter((f) => f.posto === p.id).length }))
const manifesto = { v: 1, generato: new Date().toISOString(), finto: true, viaggio: VIAGGIO, tag: TAG, posti, tappe, foto }
scriviJson(path.join(DATI, 'foto.json'), manifesto)
console.log(`✓ ${path.join(DATI, 'foto.json')}: ${foto.length} voci (${VIDEO.size} video), ${posti.length} posti, ${tappe.length} tappe, ${fatti} file ${args.rifai ? 'rifatti' : 'nuovi'}${FF ? '' : ' · ffmpeg non c’è: mp4 vuoti'}`)
console.log('  il server: DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs  →  http://127.0.0.1:8790/foto.json')
