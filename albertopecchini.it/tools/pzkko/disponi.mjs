#!/usr/bin/env node
// Compone il muro di pzkko.it: legge le pile di disposizione.js, le altezze vere
// dei pezzi (i volantini crescono col testo) e riscrive --x --y --w --r --mx --my
// --mw --mr di ogni elemento .it di pzkko/index.html, più l'altezza della parete.
// Con --pagina=storia lo stesso per il muro della storia: le pile di storia/disposizione.js
// in pzkko/storia/index.html (le foto in lavoro/storia-desk.png e storia-mob.png).
//
//   node tools/pzkko/disponi.mjs misura [--foto]
//       apre la home nel browser (desktop 1440 e telefono 390), misura ogni pezzo
//       e scrive tools/pzkko/lavoro/rettangoli.json; con --foto anche
//       lavoro/muro-desk.png e lavoro/muro-mob.png (pagina intera, di giorno)
//   node tools/pzkko/disponi.mjs applica
//       dispone i pezzi con le altezze misurate (stima dalle proporzioni per i
//       pezzi nuovi) e scrive index.html
//   node tools/pzkko/disponi.mjs tutto [--foto]
//       applica, misura, applica di nuovo (le altezze si assestano) e misura
//
// Dal 6.11 la home non ha più pile: i suoi pezzi stanno dove si dice (abs), attaccati al fondo (fondo) o sparsi a caso
// col seme (sparsi): vedi disposizione.js e, più sotto, «i pezzi sparsi».
//
// Dopo: node tools/pzkko/genera-404.mjs e node tools/pzkko/genera-storia.mjs (o tutto insieme:
// node tools/pzkko/serranda.mjs rifai). Serve puppeteer-core in tools/catture (npm ci dentro
// quella cartella) e un browser: il Chromium di Playwright o Edge (browser.mjs).
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as browser from './browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../pzkko')
const LAVORO = join(QUI, 'lavoro')
// le pagine col muro a pile: il file, le sue pile, l'indirizzo, le misure e il nome delle foto
export const PAGINE = {
  home: { file: join(ROOT, 'index.html'), disp: join(QUI, 'disposizione.js'), url: '/', rett: join(LAVORO, 'rettangoli.json'), foto: 'muro' },
  storia: { file: join(ROOT, 'storia/index.html'), disp: join(QUI, 'storia/disposizione.js'), url: '/storia/', rett: join(LAVORO, 'rettangoli-storia.json'), foto: 'storia' },
}
const quale = (nome) => { if (!PAGINE[nome]) throw new Error(`pagina «${nome}»: ${Object.keys(PAGINE).join(' o ')}`); return PAGINE[nome] }

// ── gli elementi .it di index.html e la loro chiave ──────────────────────────
export function elementi(html) {
  const out = []
  // (button: il wallet e il cercapersone, pezzi vivi del muro dal 26.10)
  for (const m of html.matchAll(/<(img|article|h2|figure|section|button)\b[^>]*\bclass="[^"]*\bit\b[^"]*"[^>]*>/g)) {
    const t = m[0]
    const id = t.match(/\bid="([^"]+)"/)
    let k
    if (id) k = '#' + id[1]
    else if (m[1] === 'img') k = t.match(/src="\/art\/([^"]+)\.webp"/)[1]
    else k = 'vol:' + html.slice(m.index, html.indexOf('</article>', m.index)).match(/<h3>([\s\S]*?)<\/h3>/)[1].replace(/<[^>]+>/g, '').trim()
    const w = t.match(/width="(\d+)"/), h = t.match(/height="(\d+)"/)
    out.push({ k, index: m.index, tag: t, aspetto: m[1] === 'img' && w && h ? h[1] / w[1] : null })
  }
  return out
}

// ── calcola e applica ────────────────────────────────────────────────────────
// Le manopole delle pile (in DESK e MOB; le gira anche serranda.mjs): top = spazio vuoto in cima (la saracinesca si
// allunga verso l'alto e tutto scende), bottom = spazio in fondo, minimo = l'altezza minima della parete, passo = quanto
// ogni pezzo spinge in giù il successivo rispetto alla sua altezza (1 = com'era; 0,85 = si sovrappongono di un 15% in
// più e ci sta altra roba), scala = la larghezza dei pezzi (0,9 = più stretti, centrati nel posto di prima)
export async function calcola(pagina = 'home') {
  const P = quale(pagina)
  let rett = {}
  try { rett = JSON.parse(await readFile(P.rett, 'utf8')) } catch {}
  const html = await readFile(P.file, 'utf8')
  // (?t: la disposizione appena cambiata da serranda.mjs, non quella già importata)
  const { DESK, MOB } = await import(pathToFileURL(P.disp).href + '?t=' + Date.now())
  const elems = elementi(html)
  const perK = Object.fromEntries(elems.map((e) => [e.k, e]))
  // le carte dei volantini e la loro proporzione (.c-bianco{…--ar:560/732…} nello stile della pagina): un volantino
  // compatto (.s) è alto quanto la sua carta, non cresce col testo, e la sua altezza si sa senza misurarla
  const CARTE = Object.fromEntries([...html.matchAll(/\.c-([a-z]+)\{[^}]*--ar:(\d+)\/(\d+)/g)].map((m) => [m[1], m[3] / m[2]]))
  const altezza = (vista, k, w) => {
    const classi = perK[k]?.tag.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/) ?? []
    const carta = classi.includes('s') && classi.map((c) => CARTE[c.replace(/^c-/, '')]).find((x) => x > 0)
    if (carta) return carta * w
    const r = rett[vista]?.find((x) => x.k === k)
    if (r) return (r.h * w) / r.w
    if (perK[k]?.aspetto) return perK[k].aspetto * w
    if (k.startsWith('#')) { const img = html.slice(perK[k].index).match(/<img[^>]*width="(\d+)" height="(\d+)"/); if (img) return (img[2] / img[1]) * w }
    return w * 1.55
  }
  const disponi = (vista, spec) => {
    const pos = {}, fondi = [], scala = spec.scala ?? 1, passo = spec.passo ?? 1
    for (const col of spec.cols) {
      let y = spec.top ?? 0, fondo = y
      for (const it of col.items) {
        if (!perK[it.k]) throw new Error(`${vista}: in ${P.file} non c'è ${it.k}`)
        y += it.gap ?? spec.gap
        const w = Math.round(it.w * scala), h = altezza(vista, it.k, w)
        pos[it.k] = { x: Math.round(col.x + (it.dx ?? 0) * scala + (it.w - w) / 2), y: Math.round(y), w, r: it.r ?? 0, h }
        fondo = Math.max(fondo, y + h)
        y += h * passo
      }
      fondi.push(Math.round(fondo))
    }
    for (const a of spec.rel ?? []) {
      const b = pos[a.to]
      if (!perK[a.k] || !b) throw new Error(`${vista}: ${a.k} ancorato a ${a.to}, uno dei due manca`)
      const w = Math.round(a.w * scala)
      pos[a.k] = { x: Math.round(b.x + (a.fx ?? 0) * b.w + (a.dx ?? 0) * scala), y: Math.round(b.y + (a.fy ?? 0) * b.h + (a.dy ?? 0) * scala), w, r: a.r ?? 0, h: altezza(vista, a.k, w) }
    }
    for (const a of spec.abs ?? []) { if (!perK[a.k]) throw new Error(`${vista}: in ${P.file} non c'è ${a.k}`); pos[a.k] = { x: a.x, y: a.y, w: a.w, r: a.r ?? 0, h: altezza(vista, a.k, a.w) } }
    // (senza pile la parete è alta «minimo»)
    const parete = Math.max(Math.max(...fondi) + (spec.bottom ?? 40), spec.minimo ?? 0)
    // i pezzi attaccati al fondo della parete (la petizione: sotto di lei restano «sotto» unità, per le penne)
    for (const a of spec.fondo ?? []) {
      if (!perK[a.k]) throw new Error(`${vista}: in ${P.file} non c'è ${a.k}`)
      const h = altezza(vista, a.k, a.w)
      pos[a.k] = { x: a.x, y: Math.round(parete - a.sotto - h), w: a.w, r: a.r ?? 0, h, sotto: a.sotto }
    }
    const sparsi = spec.sparsi ? sparge(vista, spec, pos, parete, (k, w) => altezza(vista, k, w), perK, P.file) : null
    return { pos, fondi, parete, spec, sparsi }
  }
  return { html, elems, d: disponi('desk', DESK), m: disponi('mob', MOB) }
}

// ── i pezzi sparsi ───────────────────────────────────────────────────────────
// A caso su tutta la parete, ma col seme (ogni pezzo il suo, dal seme della sparsa e dal suo nome: la pagina è uguale a
// ogni giro, e un pezzo nuovo non sposta gli altri). Per ogni pezzo si provano `prove` punti a caso e si tiene il più
// lontano dagli altri pezzi (dal centro al centro; dai pezzi fissi conta lo spazio fra i bordi, due volte: gli si può
// stare più vicino): larghi, ma non in fila. Un punto non vale se tocca un pezzo fisso
// (abs e fondo, con `aria` intorno; sotto un pezzo del fondo anche le sue penne) o se il pezzo e un altro si coprono
// più di `copre` (la parte comune sul più piccolo dei due). Se in 40 giri di prove non c'è posto: errore, si allunga.
const caso = (seme) => () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const impronta = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0 }
const comune = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
const lontano = (a, b) => Math.hypot(a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2)
const spazio = (a, b) => Math.hypot(Math.max(0, a.x - b.x - b.w, b.x - a.x - a.w), Math.max(0, a.y - b.y - b.h, b.y - a.y - a.h))
export function sparge(vista, spec, pos, parete, altezza, perK, file) {
  const S = spec.sparsi, W = vista === 'desk' ? 1280 : 390
  const { prove = 14, copre = 0.1, aria = 20, lato = 10, cima = 10 } = S
  const fissi = Object.values(pos).map((p) => ({ x: p.x - aria, y: p.y - aria, w: p.w + 2 * aria, h: p.h + (p.sotto ?? 0) + 2 * aria }))
  const messi = []
  let piuCoperto = 0
  for (const it of S.items) {
    if (!perK[it.k]) throw new Error(`${vista}: in ${file} non c'è ${it.k}`)
    const r = caso(S.seme ^ impronta(it.k)), w = it.w, h = altezza(it.k, w)
    const storta = it.r ?? (Math.round((1.5 + r() * 2.5) * 2) / 2) * (r() < 0.5 ? -1 : 1)
    let meglio = null
    for (let giro = 0; giro < 40 && !meglio; giro++) for (let i = 0; i < prove; i++) {
      const c = { x: lato + r() * (W - 2 * lato - w), y: cima + r() * (parete - cima - (spec.bottom ?? 40) - h), w, h }
      const altro = r()
      if (fissi.some((f) => comune(c, f) > 0)) continue
      const coperto = Math.max(0, ...messi.map((m) => comune(c, m) / Math.min(c.w * c.h, m.w * m.h)))
      if (coperto > copre) continue
      const d = Math.min(...messi.map((m) => lontano(c, m)), ...fissi.map((f) => 2 * spazio(c, f) + Math.min(c.w, c.h)))
      const voto = (Number.isFinite(d) ? d : altro) - coperto * 1e5
      if (!meglio || voto > meglio.voto) meglio = { ...c, voto, coperto }
    }
    if (!meglio) throw new Error(`${vista}: ${it.k} non trova posto sulla parete (alta ${parete}): serranda.mjs allunga --minimo=N`)
    piuCoperto = Math.max(piuCoperto, meglio.coperto)
    messi.push(meglio)
    pos[it.k] = { x: Math.round(meglio.x), y: Math.round(meglio.y), w, r: storta, h }
  }
  return { quanti: messi.length, piuCoperto, coperta: messi.reduce((a, m) => a + m.w * m.h, 0) / (W * parete) }
}

export async function applica(pagina = 'home') {
  let { html, elems, d, m } = await calcola(pagina)
  const senza = elems.filter((e) => !d.pos[e.k] || !m.pos[e.k]).map((e) => e.k)
  if (senza.length) console.warn(`! senza posto (restano dove sono): ${senza.join(', ')}`)
  for (const e of [...elems].reverse()) {
    const a = d.pos[e.k], b = m.pos[e.k]
    if (!a || !b) continue
    const vars = `--x:${a.x};--y:${a.y};--w:${a.w};--r:${a.r}deg;--mx:${b.x};--my:${b.y};--mw:${b.w};--mr:${b.r}deg`
    const nuovo = e.tag.replace(/style="([^"]*)"/, (_, s) => {
      const resto = s.replace(/--(x|y|w|r|mx|my|mw|mr):[^;]*;?/g, '').replace(/^;+/, '')
      return `style="${vars}${resto ? ';' + resto : ''}"`
    })
    html = html.slice(0, e.index) + nuovo + html.slice(e.index + e.tag.length)
  }
  html = html.replace(/\.parete\{position:relative;height:calc\(\d+ \* var\(--u\)\)\}/, `.parete{position:relative;height:calc(${d.parete} * var(--u))}`)
  html = html.replace(/\.parete\{height:calc\(\d+ \* var\(--u\)\);max-width:600px/, `.parete{height:calc(${m.parete} * var(--u));max-width:600px`)
  await writeFile(quale(pagina).file, html)
  for (const [nome, v] of [['desktop', d], ['telefono', m]]) {
    const pile = v.fondi.length ? `le colonne finiscono a ${v.fondi.join(', ')} → ` : ''
    const sparsi = v.sparsi ? ` · ${v.sparsi.quanti} pezzi sparsi, il più coperto al ${Math.round(v.sparsi.piuCoperto * 100)}%, ${Math.round(v.sparsi.coperta * 100)}% di parete` : ''
    console.log(`${nome}: ${pile}parete ${v.parete}${sparsi}`)
  }
}

// ── misura ───────────────────────────────────────────────────────────────────
const TIPI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }
export async function misura(foto, pagina = 'home') {
  const P = quale(pagina)
  const puppeteer = browser.puppeteer()
  const server = createServer(async (req, res) => {
    let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
    catch { res.statusCode = 404; res.end() }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const url = `http://127.0.0.1:${server.address().port}${P.url}?ora=12:00`
  const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
  const out = {}
  await mkdir(LAVORO, { recursive: true })
  for (const [vista, v] of Object.entries({ desk: { width: 1440, height: 900, dpr: 1 }, mob: { width: 390, height: 844, dpr: 2 } })) {
    const page = await aperto.newPage()
    await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: v.dpr })
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.evaluate(async () => {
      for (const i of document.querySelectorAll('img[loading=lazy]')) i.loading = 'eager'
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))))
      await document.fonts.ready
    })
    out[vista] = await page.evaluate(() => {
      const parete = document.querySelector('.parete'), pr = parete.getBoundingClientRect()
      const u = pr.width / (innerWidth < 900 ? 390 : 1280)
      const chiave = (el) => el.id ? '#' + el.id : el.tagName === 'IMG' ? el.getAttribute('src').replace('/art/', '').replace('.webp', '') : 'vol:' + el.querySelector('h3').textContent.trim()
      return [...parete.querySelectorAll('.it')].map((el) => {
        const t = el.style.transform
        el.style.transform = 'none'
        const r = el.getBoundingClientRect()
        el.style.transform = t
        return { k: chiave(el), x: Math.round((r.left - pr.left) / u), y: Math.round((r.top - pr.top) / u), w: Math.round(r.width / u), h: Math.round(r.height / u) }
      })
    })
    if (foto) await page.screenshot({ path: join(LAVORO, `${P.foto}-${vista}.png`), fullPage: true })
    await page.close()
  }
  await aperto.close()
  server.close()
  await writeFile(P.rett, JSON.stringify(out, null, 1))
  console.log(`misurati ${out.desk.length} pezzi → ${P.rett}${foto ? ' (e le foto in lavoro/)' : ''}`)
}

// lanciato da riga di comando (non importato da serranda.mjs)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd] = process.argv.slice(2)
  const foto = process.argv.includes('--foto')
  const pagina = (process.argv.find((a) => a.startsWith('--pagina=')) ?? '--pagina=home').slice(9)
  if (cmd === 'misura') await misura(foto, pagina)
  else if (cmd === 'applica') await applica(pagina)
  else if (cmd === 'tutto') { await applica(pagina); await misura(false, pagina); await applica(pagina); await misura(foto, pagina) }
  else { console.error('uso: disponi.mjs misura [--foto] · applica · tutto [--foto], con --pagina=home|storia'); process.exit(1) }
}
