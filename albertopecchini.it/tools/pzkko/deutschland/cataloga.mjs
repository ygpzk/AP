#!/usr/bin/env node
// Il catalogo delle foto di Deutschland (9.11.2026): legge la cartella del viaggio su D: (SOLO in lettura: lì dentro non si
// scrive, non si sposta, non si rinomina niente, nemmeno in _convertiti\) e scrive in C:\pzkko-server\deutschland\ le
// miniature (dati\m\ 480 webp q72), le grandi (dati\g\ 1800 jpeg q88 mozjpeg), i video (dati\v\ h264 ≤1080p yuv420p,
// tone-map se HDR, +faststart) coi poster (dati\p\), gli originali che non stanno su D: così come servono (dati\o\), e la
// cache delle voci (catalogo\cache.json: data, GPS, misure, blur, colore, peso), da cui manifesto.mjs fa dati\foto.json.
// Niente metadati nei file prodotti (sharp li toglie, ffmpeg con -map_metadata -1: niente GPS in giro).
//
// LA CARTELLA (dal 9.11 sera, importazione finita con «Mantieni originali»): 977 originali — DNG (ProRAW 48 MP, 25 MB),
// HEIC, MOV (HEVC 10 bit HLG Dolby Vision), PNG (screenshot), JPG (IMG_E…, le modifiche), AAE e DAT (si ignorano) — e in
// _convertiti\ i 353 JPG (48 MP) e i 46 MOV che il telefono aveva convertito. UNA VOCE PER NUMERO IMG_nnnn:
// - il GEMELLO di _convertiti\IMG_nnnn.JPG, se c'è, è la sorgente di m, g e dell'originale scaricabile o (il JPEG a 48 MP
//   che Alberto vuole scaricare: lo serve il server da D:, origini.json); il DNG resta /raw; l'HEIC dà solo i metadati;
// - senza gemello: DNG → il JPEG incorporato (4032 px, anteprima() di amici.mjs r.139-157) ruotato secondo l'Orientation
//   del DNG, in dati\o\ (oDa: 'dng', «sviluppo dal DNG»); HEIC → sharp non lo apre (niente HEVC) ed exifr non lo legge:
//   pixel da ffmpeg (decodifica e ruota da sé), JPEG q95 in dati\o\ (oDa: 'heic'), EXIF dal blocco Exif dentro l'HEIC;
//   PNG e JPG → se stessi;
// - data e GPS dal master (DNG/HEIC/PNG/JPG), se mancano dal gemello;
// - MOV: la sorgente dell'mp4 è il gemello di _convertiti\ quando c'è (stesso HEVC: il filtro guarda il flusso e decide
//   da sé se tone-mappare), se no l'originale; data da com.apple.quicktime.creationdate (col fuso), GPS da
//   …location.ISO6709, dal master. Un MOV con lo stesso numero di una foto (la Live Photo) prende l'id «img-nnnn-v»;
// - la data: DateTimeOriginal + OffsetTimeOriginal costruendo l'ISO a mano (il Date di exifr sarebbe nel fuso del pc).
//   Senza data: interpolazione fra i vicini per numero (≤30 numeri), poi mtime; tStimato. Senza GPS: quello della foto
//   inclusa più vicina entro 30 minuti; gpsStimato. Nel riquadro di casa (privato.mjs del server) → il file è ESCLUSO
//   del tutto, e non presta il GPS a nessuno.
//
// INCREMENTALE: l'impronta di una voce è dimensione+mtime del master E del gemello; quello già catalogato con l'impronta
// uguale e i file a posto si salta. Le foto vanno 3 alla volta (--paralleli=N), i video uno alla volta e per ultimi
// (ffmpeg usa già tutti i core: 82 MOV, ~1× la loro durata; prima passata --niente-video, poi i video).
//
//   node tools/pzkko/deutschland/cataloga.mjs                  tutto quello che manca
//   node tools/pzkko/deutschland/cataloga.mjs --solo=5506,5478  solo quei numeri (per provare)
//   node tools/pzkko/deutschland/cataloga.mjs --prova           legge e decide, non scrive niente
//   node tools/pzkko/deutschland/cataloga.mjs --rifai           rifà anche quello che c'è (con --solo: quei file)
//   node tools/pzkko/deutschland/cataloga.mjs --niente-video    salta i MOV
//   node tools/pzkko/deutschland/cataloga.mjs --solo-video      solo i MOV (la seconda passata)
import { readdirSync, statSync, readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import sharp from 'sharp'
import exifr from 'exifr'
import { DATI, CATALOGO, LAVORO, configurazione, leggiJson, scriviJson, idDi, numeroDi, aCasa, ffmpeg, argomenti, die } from './comune.mjs'
import { barra, log as logRegia } from '../../cruscotto/diretta.mjs'

const args = argomenti()
const PROVA = Boolean(args.prova), RIFAI = Boolean(args.rifai)
const PARALLELI = Math.max(1, Number(args.paralleli) || 3)
const SOLO = typeof args.solo === 'string' ? new Set(args.solo.split(',').map((s) => s.trim().replace(/^img[-_]?/i, '').replace(/^0+/, ''))) : null
const ORIGINALI = configurazione().originali
const CONV = path.join(ORIGINALI, '_convertiti')
const CACHE = path.join(CATALOGO, 'cache.json')
const FUSO = '+01:00' // Monaco e Stoccarda a novembre: ora solare, come casa
const VICINI = 30, MEZZORA = 30 * 60_000
const FF = ffmpeg('ffmpeg'), FP = ffmpeg('ffprobe')
const aCasaF = await aCasa()

if (!existsSync(ORIGINALI)) die(`non trovo la cartella delle foto: ${ORIGINALI}`)
for (const d of ['m', 'g', 'o', 'p', 'v']) mkdirSync(path.join(DATI, d), { recursive: true })
mkdirSync(CATALOGO, { recursive: true })
mkdirSync(LAVORO, { recursive: true })

// ── la cache ──
const cache = leggiJson(CACHE, { v: 2, voci: {} })
cache.voci ??= {}
const salvaCache = () => { if (!PROVA) { cache.v = 2; cache.generato = new Date().toISOString(); scriviJson(CACHE, cache) } }

// ── i file su D: (cartella principale + _convertiti), raggruppati per base (IMG_5506, IMG_E5527…) ──
const MEDIA = /\.(heic|dng|mov|png|jpe?g)$/i
const elenca = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => MEDIA.test(f) && statSync(path.join(dir, f)).isFile()) : [])
const principali = elenca(ORIGINALI), convertiti = elenca(CONV)
const gruppi = new Map()
const metti = (f, dir) => { const base = f.replace(/\.[^.]+$/, ''); (gruppi.get(base) ?? gruppi.set(base, []).get(base)).push({ f, dir, est: f.split('.').pop().toLowerCase() }) }
for (const f of principali) metti(f, ORIGINALI)
for (const f of convertiti) metti(f, CONV)
const impronta = (...file) => file.filter(Boolean).map((f) => { const s = statSync(f); return `${s.size}-${Math.floor(s.mtimeMs)}` }).join('+')
const relativo = (f) => path.relative(ORIGINALI, f).split(path.sep).join('/')

/** Le cose da catalogare: { id, nome, tipo, master, gemello, raw, live }. */
const lavori = []
for (const [base, voci] of gruppi) {
  const n = numeroDi(base)
  if (SOLO && !SOLO.has(String(n))) continue
  const con = (est, dir) => voci.find((x) => x.est === est && x.dir === dir)
  const master = con('dng', ORIGINALI) || con('heic', ORIGINALI) || con('png', ORIGINALI) || con('jpg', ORIGINALI) || con('jpeg', ORIGINALI)
  const gemello = con('jpg', CONV) || con('jpeg', CONV)
  const mov = con('mov', ORIGINALI), movConv = con('mov', CONV)
  const foto = master || gemello
  if (foto && !args['solo-video']) {
    const m = master ? path.join(master.dir, master.f) : null, g = gemello ? path.join(gemello.dir, gemello.f) : null
    lavori.push({ id: idDi(base), nome: (master ?? gemello).f, tipo: master ? master.est : 'jpg', master: m, gemello: g, raw: master?.est === 'dng' ? master.f : null })
  }
  if ((mov || movConv) && !args['niente-video']) {
    lavori.push({ id: idDi(base) + (foto ? '-v' : ''), nome: (mov ?? movConv).f, tipo: 'mov', master: mov ? path.join(mov.dir, mov.f) : null, gemello: movConv ? path.join(movConv.dir, movConv.f) : null, live: Boolean(foto) })
  }
}
// le foto prima (3 alla volta), i video dopo (uno alla volta), tutti per numero
lavori.sort((a, b) => (a.tipo === 'mov') - (b.tipo === 'mov') || (numeroDi(a.nome) ?? 0) - (numeroDi(b.nome) ?? 0) || a.id.localeCompare(b.id))

// ── EXIF ──
const PICK = ['DateTimeOriginal', 'OffsetTimeOriginal', 'OffsetTime', 'CreateDate', 'GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef', 'Orientation', 'ExifImageWidth', 'ExifImageHeight', 'ImageWidth', 'ImageHeight']
const OPZ = { tiff: true, exif: true, gps: true, ifd0: true, xmp: false, icc: false, iptc: false, translateValues: false, reviveValues: false, pick: PICK }
const leggiExif = async (fileOBuffer) => { try { return (await exifr.parse(fileOBuffer, OPZ)) ?? {} } catch { return {} } }
/** L'EXIF dentro un HEIC che exifr non apre: il blocco TIFF («MM\0*» o «II*\0») dopo un «Exif\0\0» che sia dati e non il nome dell'item. */
async function exifDaHeic(buf) {
  let da = 0
  for (let k = 0; k < 8; k++) {
    const i = buf.indexOf('Exif\0\0', da, 'latin1')
    if (i < 0) break
    const t = buf.subarray(i + 6, i + 10).toString('latin1')
    if (t === 'MM\0*' || t === 'II*\0') { const e = await leggiExif(buf.subarray(i + 6, Math.min(buf.length, i + 6 + 1_000_000))); if (Object.keys(e).length) return e }
    da = i + 6
  }
  for (const m of ['MM\0*\0\0\0\b', 'II*\0\b\0\0\0']) { const i = buf.indexOf(m, 0, 'latin1'); if (i >= 0) { const e = await leggiExif(buf.subarray(i, Math.min(buf.length, i + 1_000_000))); if (Object.keys(e).length) return e } }
  return {}
}
/** «2026:11:06 21:10:51» + «+01:00» → ISO con fuso, costruito a mano (niente Date nel fuso del pc). */
function isoDa(d, off) {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(d ?? ''))
  if (!m) return null
  const o = /^[+-]\d{2}:\d{2}$/.test(String(off ?? '')) ? off : FUSO
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${o}`
}
const gradi = (v, ref) => { if (!Array.isArray(v) || v.length < 2) return null; const g = v[0] + (v[1] ?? 0) / 60 + (v[2] ?? 0) / 3600; return Number.isFinite(g) ? +(/^[SW]$/i.test(ref ?? '') ? -g : g).toFixed(6) : null }
const gps = (e) => { const lat = gradi(e.GPSLatitude, e.GPSLatitudeRef), lon = gradi(e.GPSLongitude, e.GPSLongitudeRef); return lat !== null && lon !== null && (lat || lon) ? { lat, lon } : null }
/** L'EXIF di un master (DNG, HEIC, PNG, JPG); completato col gemello per quello che manca. */
async function exifDi(l) {
  let e = {}
  if (l.master) e = l.tipo === 'heic' ? await exifDaHeic(readFileSync(l.master)) : await leggiExif(l.master)
  if (l.gemello && (!e.DateTimeOriginal || !gps(e))) { const g = await leggiExif(l.gemello); e = { ...g, ...Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined && v !== null)) } }
  return e
}

// ── i video (ffprobe/ffmpeg) ──
const probe = (f) => { try { return JSON.parse(execFileSync(FP, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', f], { maxBuffer: 16e6 }).toString()) } catch { return null } }
const TONEMAP = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p'
function filtroVideo(s) {
  const hdr = /arib-std-b67|smpte2084/.test(s.color_transfer ?? '') || /10le|12le/.test(s.pix_fmt ?? '')
  // ≤1080p sul lato lungo (ffmpeg ruota da sé secondo la Display Matrix, quindi si limita il lato lungo e basta)
  const scala = "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'"
  return `${scala},${hdr ? TONEMAP : 'format=yuv420p'}`
}

// ── il JPEG dentro un DNG (amici.mjs r.139-157) ──
function anteprima(buf) {
  let best = null
  for (let i = 0; i < buf.length - 3; i++) {
    if (!(buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff)) continue
    let j = i + 2, sof = null
    while (j < buf.length - 9 && buf[j] === 0xff) { const m = buf[j + 1]; if (m >= 0xc0 && m <= 0xc2) sof = { w: buf.readUInt16BE(j + 7), h: buf.readUInt16BE(j + 5) }; if (m === 0xda) break; j += 2 + buf.readUInt16BE(j + 2) }
    if (!sof) continue
    let k = j
    while (k < buf.length - 1 && !(buf[k] === 0xff && buf[k + 1] === 0xd9)) k++
    if (!best || sof.w * sof.h > best.w * best.h) best = { ...sof, da: i, a: k + 2 }
    i = k
  }
  return best && buf.subarray(best.da, best.a)
}

// ── le immagini derivate: g (1800 jpeg), m (480 webp), blur (16 webp base64), colore, misure dopo la rotazione ──
const esa = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
async function derivate(sorgente, id, { ruota = true } = {}) {
  let img = sharp(sorgente, { limitInputPixels: 1e9, failOn: 'none' })
  if (ruota) img = img.rotate()
  const g = await img.clone().resize(1800, 1800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toBuffer({ resolveWithObject: true })
  // le misure vere, già ruotate (Orientation 5-8 = la foto è di traverso); m, blur e colore medio dalla grande
  const { width: W, height: H } = await img.metadata().then((m) => (ruota && m.orientation >= 5 ? { width: m.height, height: m.width } : { width: m.width, height: m.height }))
  const m = await sharp(g.data).resize(480, 480, { fit: 'inside' }).webp({ quality: 72 }).toBuffer()
  const blur = await sharp(g.data).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()
  const stat = await sharp(g.data).stats()
  const col = `#${stat.channels.slice(0, 3).map((c) => esa(c.mean)).join('')}`
  if (!PROVA) { writeFileSync(path.join(DATI, 'g', `${id}.jpg`), g.data); writeFileSync(path.join(DATI, 'm', `${id}.webp`), m) }
  return { w: W, h: H, blur: `data:image/webp;base64,${blur.toString('base64')}`, col }
}

// ── un lavoro → la voce della cache ──
async function cataloga(l) {
  const principale = l.master ?? l.gemello
  const st = statSync(principale)
  const voce = { id: l.id, nome: l.nome, tipo: l.tipo === 'mov' ? 'video' : 'foto', formato: l.tipo, impronta: impronta(l.master, l.gemello), mtime: st.mtimeMs, numero: numeroDi(l.nome), m: `${l.id}.webp`, g: `${l.id}.jpg`, gemello: l.gemello ? relativo(l.gemello) : undefined }
  if (l.tipo === 'mov') {
    if (!FF || !FP) throw new Error('ffmpeg/ffprobe non ci sono (winget install Gyan.FFmpeg)')
    const sorgente = l.gemello ?? l.master // (il gemello convertito se c'è)
    const pm = probe(l.master ?? sorgente), ps = sorgente === l.master ? pm : probe(sorgente)
    if (!pm || !ps) throw new Error('ffprobe non legge il file')
    const tags = { ...(ps.format?.tags ?? {}), ...(pm.format?.tags ?? {}) }
    const cd = String(tags['com.apple.quicktime.creationdate'] ?? '')
    const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2}):?(\d{2})$/.exec(cd)
    voce.t = m ? `${m[1]}${m[2]}:${m[3]}` : tags.creation_time ? new Date(tags.creation_time).toISOString().replace(/\.\d+Z$/, 'Z') : null
    const iso = /^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/.exec(String(tags['com.apple.quicktime.location.ISO6709'] ?? ''))
    if (iso) { voce.lat = +Number(iso[1]).toFixed(6); voce.lon = +Number(iso[2]).toFixed(6) }
    const vs = ps.streams.find((s) => s.codec_type === 'video')
    voce.durata = +Number(ps.format?.duration ?? vs?.duration ?? 0).toFixed(1)
    voce.live = l.live || undefined
    if (aCasaF(voce.lat, voce.lon)) return { ...voce, escluso: 'casa' }
    voce.v = `${l.id}.mp4`; voce.p = `${l.id}.jpg`
    if (!PROVA) {
      const out = path.join(DATI, 'v', voce.v), tmp = path.join(LAVORO, `${l.id}.tmp.mp4`)
      const vf = filtroVideo(vs ?? {})
      const r = spawnSync(FF, ['-y', '-v', 'error', '-i', sorgente, '-map', '0:v:0', '-map', '0:a:0?', '-vf', vf, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-movflags', '+faststart', '-map_metadata', '-1', tmp], { stdio: ['ignore', 'ignore', 'pipe'] })
      if (r.status !== 0) throw new Error(`ffmpeg: ${String(r.stderr).trim().split('\n').pop()}`)
      renameSync(tmp, out)
      const posterTmp = path.join(LAVORO, `${l.id}.poster.jpg`)
      const poster = spawnSync(FF, ['-y', '-v', 'error', '-ss', String(Math.min(0.5, voce.durata / 2)), '-i', sorgente, '-frames:v', '1', '-vf', vf, '-q:v', '3', '-map_metadata', '-1', posterTmp], { stdio: ['ignore', 'ignore', 'pipe'] })
      if (poster.status !== 0) throw new Error(`poster: ${String(poster.stderr).trim().split('\n').pop()}`)
      const pb = readFileSync(posterTmp)
      writeFileSync(path.join(DATI, 'p', voce.p), await sharp(pb).jpeg({ quality: 86, mozjpeg: true }).toBuffer())
      Object.assign(voce, await derivate(pb, l.id, { ruota: false }))
      const pv = probe(out)?.streams.find((s) => s.codec_type === 'video')
      if (pv) { voce.w = pv.width; voce.h = pv.height }
      voce.peso = statSync(out).size
    } else { voce.w = vs?.width; voce.h = vs?.height; voce.peso = st.size }
    return voce
  }

  // le foto: i metadati dal master (e dal gemello per quello che manca)
  const exif = await exifDi(l)
  voce.t = isoDa(exif.DateTimeOriginal ?? exif.CreateDate, exif.OffsetTimeOriginal ?? exif.OffsetTime)
  const g = gps(exif)
  if (g) Object.assign(voce, g)
  if (l.tipo === 'png') voce.screenshot = true
  if (l.raw) { voce.raw = `${l.id}.dng`; voce.pesoRaw = statSync(l.master).size }
  if (aCasaF(voce.lat, voce.lon)) return { ...voce, escluso: 'casa' }

  if (l.gemello) {
    // il gemello JPG di _convertiti: pixel e originale (servito da D:); la sua Orientation la legge sharp
    voce.o = `${l.id}.jpg`; voce.origine = relativo(l.gemello); voce.oDa = 'convertito'; voce.peso = statSync(l.gemello).size
    Object.assign(voce, await derivate(l.gemello, l.id))
  } else if (l.tipo === 'dng') {
    // senza gemello: lo sviluppo dal DNG = il JPEG incorporato, ruotato secondo l'Orientation del DNG e ripulito (porta un
    // EXIF suo con Make e Model), in dati\o\
    const buf = anteprima(readFileSync(l.master))
    if (!buf) throw new Error('nel DNG non trovo il JPEG incorporato')
    const gradiR = { 3: 180, 6: 90, 8: 270 }[exif.Orientation] ?? 0
    const o = await sharp(buf).rotate(gradiR).jpeg({ quality: 95, mozjpeg: true }).toBuffer()
    voce.o = `${l.id}.jpg`; voce.origine = null; voce.oDa = 'dng'; voce.peso = o.length
    if (!PROVA) writeFileSync(path.join(DATI, 'o', voce.o), o)
    Object.assign(voce, await derivate(o, l.id, { ruota: false }))
  } else if (l.tipo === 'heic') {
    // senza gemello: ffmpeg decodifica l'HEIC (e lo ruota da sé) → JPEG q95 in dati\o\
    if (!FF) throw new Error(`HEIC senza JPG convertito e senza ffmpeg: ${l.nome}`)
    const tmp = path.join(LAVORO, `${l.id}.heic.jpg`)
    const r = spawnSync(FF, ['-y', '-v', 'error', '-i', l.master, '-frames:v', '1', '-q:v', '1', '-map_metadata', '-1', tmp], { stdio: ['ignore', 'ignore', 'pipe'] })
    if (r.status !== 0) throw new Error(`ffmpeg heic: ${String(r.stderr).trim().split('\n').pop()}`)
    const o = await sharp(readFileSync(tmp), { limitInputPixels: 1e9 }).jpeg({ quality: 95, mozjpeg: true }).toBuffer()
    voce.o = `${l.id}.jpg`; voce.origine = null; voce.oDa = 'heic'; voce.peso = o.length
    if (!PROVA) writeFileSync(path.join(DATI, 'o', voce.o), o)
    Object.assign(voce, await derivate(o, l.id, { ruota: false }))
  } else {
    // PNG e JPG (IMG_E…, gli AirDrop): se stessi, serviti da D:
    voce.o = `${l.id}.${l.tipo === 'png' ? 'png' : 'jpg'}`; voce.origine = relativo(l.master); voce.oDa = l.tipo; voce.peso = st.size
    Object.assign(voce, await derivate(l.master, l.id))
  }
  return voce
}

// ── via: cosa manca ──
const daFare = lavori.filter((l) => {
  const c = cache.voci[l.id]
  if (RIFAI || !c) return true
  if (c.impronta !== impronta(l.master, l.gemello)) return true
  if (c.escluso) return false
  const servono = [path.join(DATI, 'm', c.m), path.join(DATI, 'g', c.g), c.v && path.join(DATI, 'v', c.v), c.p && path.join(DATI, 'p', c.p), c.o && !c.origine && path.join(DATI, 'o', c.o)].filter(Boolean)
  return servono.some((f) => !existsSync(f))
})
// le voci della cache che non hanno più un file su D: (un DNG cancellato e ricopiato con un altro nome, i JPG spostati)
const idVivi = new Set(lavori.map((l) => l.id))
let sparite = 0
if (!SOLO && !args['solo-video'] && !args['niente-video']) for (const id of Object.keys(cache.voci)) if (!idVivi.has(id)) { delete cache.voci[id]; sparite++ }
console.log(`${principali.length} file su D: + ${convertiti.length} in _convertiti, ${lavori.length} voci, ${daFare.length} ${RIFAI ? 'da rifare' : 'nuove o cambiate'} (${daFare.filter((l) => l.tipo === 'mov').length} video)${sparite ? `, ${sparite} voci sparite tolte dalla cache` : ''}${PROVA ? ' · PROVA: non scrivo niente' : ''}${FF ? '' : ' · ffmpeg NON c’è'}`)

let n = 0, errori = 0, esclusi = 0
const t0 = Date.now()
const fotoDaFare = daFare.filter((l) => l.tipo !== 'mov'), videoDaFare = daFare.filter((l) => l.tipo === 'mov')
async function fai(l) {
  try {
    const voce = await cataloga(l)
    if (voce.escluso) esclusi++
    cache.voci[l.id] = voce
    console.log(`  ${voce.escluso ? '⊘' : '✓'} ${l.nome}${l.gemello ? ' +gemello' : ''} → ${l.id} ${voce.tipo}${voce.durata ? ` ${voce.durata}s` : ''} ${voce.t ?? 'SENZA DATA'} ${voce.lat !== undefined ? `${voce.lat},${voce.lon}` : 'senza gps'} ${voce.w}×${voce.h}${voce.oDa && voce.oDa !== 'convertito' ? ` o:${voce.oDa}` : ''}${voce.escluso ? ` ESCLUSO (${voce.escluso})` : ''}`)
  } catch (e) {
    errori++
    console.error(`  ✗ ${l.nome}: ${e.message}`)
  }
  n++
  barra('deutschland-catalogo', 'Catalogo Deutschland', n, daFare.length, l.nome)
  if (n % 10 === 0) salvaCache()
}
// le foto, PARALLELI alla volta
let prossima = 0
await Promise.all(Array.from({ length: PARALLELI }, async () => { while (prossima < fotoDaFare.length) await fai(fotoDaFare[prossima++]) }))
// i video, uno alla volta
for (const l of videoDaFare) await fai(l)

// ── le date che mancano (interpolazione per numero fra vicini ≤30, poi mtime) e il GPS ereditato (≤30 min, solo da incluse) ──
const tutte = Object.values(cache.voci).filter((v) => !v.escluso)
const conData = tutte.filter((v) => v.t && !v.tStimato && v.numero !== null).sort((a, b) => a.numero - b.numero)
for (const v of tutte) {
  if (v.t && !v.tStimato) continue
  let prima = null, dopo = null
  for (const c of conData) { if (c.numero < v.numero && v.numero - c.numero <= VICINI) prima = c; if (c.numero > v.numero && c.numero - v.numero <= VICINI) { dopo = c; break } }
  let ms = null
  if (prima && dopo) ms = Date.parse(prima.t) + ((Date.parse(dopo.t) - Date.parse(prima.t)) * (v.numero - prima.numero)) / (dopo.numero - prima.numero)
  else if (prima || dopo) ms = Date.parse((prima ?? dopo).t) + (prima ? 60_000 : -60_000)
  else ms = v.mtime
  const d = new Date(ms + 3_600_000) // +01:00
  v.t = d.toISOString().replace(/\.\d{3}Z$/, FUSO)
  v.tStimato = true
}
for (const v of tutte) { v.giorno = v.t.slice(0, 10); v.ora = v.t.slice(11, 16); v.ms = Date.parse(v.t) }
const conGps = tutte.filter((v) => Number.isFinite(v.lat) && !v.gpsStimato).sort((a, b) => a.ms - b.ms)
for (const v of tutte) {
  if (Number.isFinite(v.lat) && !v.gpsStimato) continue
  let migliore = null
  for (const c of conGps) { const d = Math.abs(c.ms - v.ms); if (d <= MEZZORA && (!migliore || d < migliore.d)) migliore = { c, d } }
  if (migliore) { v.lat = migliore.c.lat; v.lon = migliore.c.lon; v.gpsStimato = true } else { delete v.lat; delete v.lon; v.gpsStimato = true }
}
salvaCache()
const inclusi = tutte.length, senzaGps = tutte.filter((v) => !Number.isFinite(v.lat)).length, stimate = tutte.filter((v) => v.tStimato).length
const daFonte = (k) => tutte.filter((v) => v.oDa === k).length
console.log(`\n${n} fatte in ${Math.round((Date.now() - t0) / 1000)} s, ${errori} errori · nella cache ${Object.keys(cache.voci).length} voci: ${inclusi} incluse (${tutte.filter((v) => v.tipo === 'video').length} video, ${tutte.filter((v) => v.live).length} live), ${Object.values(cache.voci).filter((v) => v.escluso).length} escluse (casa), ${stimate} con data stimata, ${senzaGps} senza GPS nemmeno ereditato · originali: ${daFonte('convertito')} dal gemello JPG, ${daFonte('dng')} sviluppati dal DNG, ${daFonte('heic')} decodificati dall'HEIC, ${daFonte('png') + daFonte('jpg')} PNG/JPG${PROVA ? ' (PROVA)' : ''}`)
if (!PROVA && n) logRegia('claude', `A1 cataloga: ${n} file fatti in ${Math.round((Date.now() - t0) / 60000)} min, ${errori} errori, ${inclusi} voci incluse (${tutte.filter((v) => v.tipo === 'video').length} video)`)
if (errori) process.exitCode = 1
