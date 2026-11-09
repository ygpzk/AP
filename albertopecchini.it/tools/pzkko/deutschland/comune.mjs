// Le cose in comune della pipeline di Deutschland (9.11.2026): le foto del viaggio a Monaco e Stoccarda con Mikas, Jonny
// e Jella stanno su D: (la cartella «originali» di C:\pzkko-server\config\deutschland.json, SOLO in lettura: l'importazione
// dall'iPhone è ancora in corso) e il catalogo che se ne ricava (m\ g\ p\ v\ foto.json) sta in C:\pzkko-server\deutschland\
// dati\: niente di tutto questo entra nel repo (tools/pzkko/lavoro/ è in .gitignore). Qui: le cartelle, i 15 tag,
// gli id, ffmpeg, il riquadro di casa (importato dal server, fuori da GitHub), la scrittura atomica, il caso col seme.
//
//   finto.mjs → un manifesto finto per sviluppare la galleria · cataloga.mjs → catalogo\cache.json + m g p v
//   posti.mjs → catalogo\posti.json · riconosci.py → lavoro\volti\ + catalogo\tag-auto.json (volti)
//   categorie.mjs → catalogo\tag-auto.json (CLIP) · manifesto.mjs → dati\foto.json + dati\origini.json
import { existsSync, readFileSync, mkdirSync, renameSync, writeFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../../', import.meta.url)) // albertopecchini.it/
export const SERVER = 'C:\\pzkko-server\\deutschland'
export const DATI = path.join(SERVER, 'dati')
export const CATALOGO = path.join(SERVER, 'catalogo')
export const LAVORO = path.join(ROOT, 'tools', 'pzkko', 'lavoro', 'deutschland')
export const CONFIG = 'C:\\pzkko-server\\config\\deutschland.json'

/** I 15 tag, nell'ordine di pzkko/deutschland/comune.js (TAG): la galleria li usa così. */
export const TAG = ['pekko', 'mikas', 'jonny', 'jella', 'cibo', 'paesaggi', 'natura', 'strada', 'auto', 'screenshot', 'hotel', 'mezzi', 'alcool', 'foto', 'video']
export const VIAGGIO = { titolo: 'Monaco e Stoccarda con JMA', da: '2026-11-06', a: '2026-11-09' }

export const leggiJson = (f, altrimenti = null) => { try { return JSON.parse(readFileSync(f, 'utf8').replace(/^\uFEFF/, '')) } catch { return altrimenti } }
/** Scrive un JSON accanto e poi lo rinomina sopra: chi legge (il server, l'Agente 3) non vede mai mezzo file. */
export function scriviJson(f, dati, spazi = 0) {
  mkdirSync(path.dirname(f), { recursive: true })
  const tmp = `${f}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(dati, null, spazi) + '\n')
  renameSync(tmp, f)
}

/** config\deutschland.json del server (pubblico, originali; sale e hash NON si leggono qui). */
export function configurazione() {
  const c = leggiJson(CONFIG, {})
  return { originali: c.originali || 'D:\\disco immagini\\rullino con etichetta\\Viaggio a Munchen e Stuttgard con JMA', pubblico: c.pubblico || 'https://desktop-inpvhr2.tail6c90b3.ts.net/deutschland' }
}

/** IMG_5506.HEIC → img-5506 (id /^[a-z0-9-]+$/, come il contratto). */
export const idDi = (nome) => path.basename(nome).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const numeroDi = (nome) => { const m = /(\d{3,6})/.exec(path.basename(nome)); return m ? Number(m[1]) : null }

/** Il riquadro di casa, da C:\pzkko-server\deutschland\privato.mjs (fuori da GitHub): senza, la pipeline si ferma. */
export async function aCasa() {
  const f = path.join(SERVER, 'privato.mjs')
  if (!existsSync(f)) throw new Error(`manca ${f}: il riquadro di casa (copia di tempo\\privato.mjs r.29-30), senza non si cataloga niente`)
  return (await import(pathToFileURL(f).href)).aCasa
}

/** ffmpeg e ffprobe: nel PATH o dove li mette winget (Gyan.FFmpeg). Null se mancano. */
export function ffmpeg(nome = 'ffmpeg') {
  for (const c of [nome, `${nome}.exe`]) { try { execFileSync(c, ['-version'], { stdio: 'ignore' }); return c } catch {} }
  const pacchetti = path.join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages')
  try {
    for (const d of readdirSync(pacchetti).filter((d) => /^Gyan\.FFmpeg/.test(d)))
      for (const v of readdirSync(path.join(pacchetti, d))) { const exe = path.join(pacchetti, d, v, 'bin', `${nome}.exe`); if (existsSync(exe)) return exe }
  } catch {}
  return null
}

/** Il caso col seme (mulberry32, come pzkko/deutschland/comune.js e barra/barra.js r.36). */
export const caso = (seme) => () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/** Distanza in metri fra due punti (haversine). */
export function metri(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Gli argomenti --nome=valore e --flag della riga di comando. */
export function argomenti(argv = process.argv.slice(2)) {
  const a = { _: [] }
  for (const s of argv) { const m = /^--([a-z-]+)(?:=(.*))?$/.exec(s); if (m) a[m[1]] = m[2] ?? true; else a._.push(s) }
  return a
}

export const die = (msg) => { console.error(`✗ ${msg}`); process.exit(1) }
