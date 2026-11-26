// Oscura le copie dei siti di allora e rifà le foto da quelle (26.11.2026).
//
// Le copie (public/tempo/<dominio>/<AAAA-MM-GG>/pagina/index.html, fatte da istantanea.mjs)
// erano congelate così com'erano: numero di telefono, social, il paese, le coordinate, i link al
// server di casa. Qui ogni copia si apre nel browser, si toglie quello che dicono le regole di
// src/data/oscura.js e si riscrive il file:
//
//   - nel testo, al posto del dato una barra «tolto per riservatezza»;
//   - negli attributi (alt, title, meta…) tre segni ▮▮▮; nei nomi di classi e nei fogli di stile
//     le parole dei luoghi diventano segni neutri, uguali nei due posti, così lo stile regge;
//   - i link a telefono, WhatsApp, social, mappe, al server di casa e ai siti nascosti restano
//     testo senza collegamento;
//   - le immagini di tools/tempo/immagini-tolte.json (schermate col paese, la mappa, la casa…)
//     diventano un riquadro tratteggiato della stessa misura.
//
// Poi, dalla copia già oscurata, le foto per le pagine del sito:
//   <short>-t.webp  la prima finestra a 1280 px, larga 640 (schede, istogramma, elenco)
//   <short>-v.webp  la cima in verticale 3:4, larga 480 (la home)
// Le foto intere di prima (-d, -m) restano nel repository ma non vanno più online (privacy.mjs).
//
//   node tools/tempo/oscura-pagine.mjs                 tutte le copie
//   node tools/tempo/oscura-pagine.mjs --sito=ap       un sito (ap, cascina)
//   node tools/tempo/oscura-pagine.mjs --solo=2026-11-03
//   node tools/tempo/oscura-pagine.mjs --senza-foto    solo le copie
//
// Si può rifare quante volte si vuole: su una copia già oscurata non cambia niente.

import http from 'node:http'
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join, extname, resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { puppeteer, eseguibile } from '../browser.mjs'
import { REGOLE_TESTO, EMAIL_PUBBLICA } from '../../src/data/oscura.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../..')
const PUBLIC = join(SITO, 'public')
const sharp = createRequire(join(SITO, 'package.json'))('sharp')
const opt = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1]

const SITI = [
  { id: 'ap', dominio: 'albertopecchini.it' },
  { id: 'cascina', dominio: 'cascinafontana.xyz' },
].filter((s) => !opt('sito') || opt('sito').split(',').includes(s.id))

const tolte = JSON.parse(readFileSync(join(QUI, 'immagini-tolte.json'), 'utf8')).immagini.map((x) => x.file)

// ── un piccolo server statico su public/: le copie chiedono /media/tempo/risorse/… ──
const TIPI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const f = join(PUBLIC, p)
  if (!f.startsWith(PUBLIC) || !existsSync(f) || statSync(f).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TIPI[extname(f).toLowerCase()] || 'application/octet-stream' })
  res.end(readFileSync(f))
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}`

// ── quello che gira nella pagina ──────────────────────────────────────────────
function oscuraNellaPagina({ regole, emailPubblica, tolte }) {
  const res = regole.map(([tipo, s, f]) => [tipo, new RegExp(s, f)])
  const conta = { testo: 0, attributi: 0, link: 0, immagini: 0, stile: 0 }
  const tipi = {}
  const pezzi = (s) => {
    const out = []
    for (const [tipo, re] of res) {
      re.lastIndex = 0
      for (let m; (m = re.exec(s)); ) {
        if (!m[0]) { re.lastIndex++; continue }
        if (tipo === 'email' && m[0].toLowerCase() === emailPubblica) continue
        out.push({ da: m.index, a: m.index + m[0].length, tipo })
      }
    }
    out.sort((x, y) => x.da - y.da || y.a - x.a)
    const uniti = []
    for (const p of out) if (!uniti.length || p.da >= uniti.at(-1).a) uniti.push(p)
    return uniti
  }
  const cuci = (s, ps, sost) => {
    let o = ''
    let q = 0
    for (const p of ps) {
      o += s.slice(q, p.da) + sost(s.slice(p.da, p.a), p.tipo)
      q = p.a
      tipi[p.tipo] = (tipi[p.tipo] || 0) + 1
    }
    return o + s.slice(q)
  }
  const piatto = (s) => {
    const ps = pezzi(s)
    return ps.length ? cuci(s, ps, () => '▮▮▮') : s
  }

  // le parole dei luoghi e degli account dentro nomi, classi, percorsi e fogli di stile:
  // sempre lo stesso segno neutro, così un selettore e la sua classe restano uguali
  const PAROLE = [
    [/rivaltasulmincio/gi, 'sitopaese'], [/rivalta/gi, 'paese'], [/mincio/gi, 'fiume'], [/mantovan/gi, 'provincial'], [/mantova/gi, 'provincia'],
    [/rodigo/gi, 'borgo'], [/goito/gi, 'borgo2'], [/curtatone/gi, 'borgo3'], [/castellucchio/gi, 'borgo4'],
    [/albertoxpecchini/gi, 'account'], [/yungpzkko/gi, 'account2'], [/ygpzk/gi, 'account3'],
    [/desktop-inpvhr2/gi, 'casa'], [/tail6c90b3/gi, 'rete'],
  ]
  const parole = (s) => {
    let o = s
    for (const [re, t] of PAROLE) o = o.replace(re, t)
    return o
  }

  const VUOTA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  const tolta = (u) => {
    const f = String(u || '').split(/[?#]/)[0].split('/').pop()
    return f && tolte.includes(f)
  }
  const urlTolte = (css) =>
    css.replace(/url\(\s*(["']|&quot;)?([^)"'&]+)\1?\s*\)/g, (m, q, u) => {
      if (!tolta(u)) return m
      conta.immagini++
      return `url("${VUOTA}")`
    })

  // i collegamenti che non devono più portare da nessuna parte
  const LINK_VIA = /^(?:tel:|sms:|callto:)|wa\.me|whatsapp|instagram\.com|tiktok\.com|(?:^|\/\/|\.)x\.com\/|twitter\.com|youtube\.com|youtu\.be|snapchat\.com|t\.me\/|telegram\.me|pinterest\.|twitch\.tv|threads\.net|reddit\.com|linkedin\.com|facebook\.com|github\.com|openstreetmap\.org|google\.[a-z.]+\/maps|maps\.google|maps\.app\.goo|goo\.gl\/maps|ts\.net|rivalta|mincio|mantova|rodigo|prolocorivalta/i
  const linkDaTogliere = (h) => {
    if (!h || h.startsWith('#')) return false
    if (/^mailto:/i.test(h)) return !h.toLowerCase().includes(emailPubblica)
    return LINK_VIA.test(h)
  }

  // ── 1. il foglio per le barre e i riquadri ──
  // la barra ha il colore del testo (currentColor), le lettere sono trasparenti; le sovrimpressioni
  // dell'«inchiostro» tolte spariscono e basta, le altre immagini diventano un riquadro tratteggiato
  const st = document.querySelector('style[data-tm-oscura]') || document.head.appendChild(document.createElement('style'))
  st.setAttribute('data-tm-oscura', '')
  st.textContent =
    '.tm-x{display:inline-block;vertical-align:-0.12em;height:1em;min-width:2.2em;border-radius:0.2em;background:currentColor!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;opacity:0.7;overflow:hidden;line-height:1;white-space:nowrap;user-select:none;text-decoration:none}' +
    'img[data-tm]{background:repeating-linear-gradient(135deg,#ebe6da 0 10px,#ddd5c4 10px 12px)!important;outline:1px dashed #b9b09c;outline-offset:-1px;object-fit:fill!important}' +
    'img[data-tm][class*="ink"]{background:none!important;outline:0}' +
    'a[data-tm]{cursor:default}'

  // ── 2. le immagini tolte ──
  for (const img of document.querySelectorAll('img')) {
    const srcs = [img.getAttribute('src'), ...(img.getAttribute('srcset') || '').split(',').map((x) => x.trim().split(/\s+/)[0])]
    const pic = img.closest('picture')
    const fonti = pic ? [...pic.querySelectorAll('source')].flatMap((s) => (s.getAttribute('srcset') || '').split(',').map((x) => x.trim().split(/\s+/)[0])) : []
    const dataSito = /^data:/.test(img.getAttribute('src') || '') && /rivalta|mincio|rodigo|mantova/i.test(decodeURIComponent(img.getAttribute('src')))
    if ([...srcs, ...fonti].some(tolta) || dataSito) {
      const r = img.getBoundingClientRect()
      if (!img.getAttribute('width') && r.width) img.setAttribute('width', String(Math.round(r.width)))
      if (!img.getAttribute('height') && r.height) img.setAttribute('height', String(Math.round(r.height)))
      img.setAttribute('src', VUOTA)
      img.removeAttribute('srcset')
      img.removeAttribute('sizes')
      img.setAttribute('alt', 'immagine tolta per riservatezza')
      img.setAttribute('title', 'immagine tolta per riservatezza')
      img.setAttribute('data-tm', 'immagine')
      if (pic) for (const s of pic.querySelectorAll('source')) s.remove()
      conta.immagini++
    }
  }
  for (const v of document.querySelectorAll('video, iframe, embed, object')) {
    const u = v.getAttribute('src') || v.getAttribute('data') || v.getAttribute('poster') || ''
    if (tolta(u) || LINK_VIA.test(u)) {
      v.replaceWith(Object.assign(document.createElement('img'), { src: VUOTA, alt: 'tolto per riservatezza' }))
      conta.immagini++
    }
  }

  // ── 3. i collegamenti ──
  for (const a of document.querySelectorAll('a[href], area[href], link[href]')) {
    const h = a.getAttribute('href')
    if (a.tagName === 'LINK') {
      if (linkDaTogliere(h)) a.remove()
      continue
    }
    if (linkDaTogliere(h)) {
      a.removeAttribute('href')
      a.removeAttribute('target')
      a.removeAttribute('rel')
      a.setAttribute('data-tm', 'link')
      a.setAttribute('aria-disabled', 'true')
      conta.link++
    }
  }
  for (const f of document.querySelectorAll('form[action]')) if (linkDaTogliere(f.getAttribute('action'))) f.removeAttribute('action')

  // ── 4. gli attributi ──
  const TESTUALI = new Set(['alt', 'title', 'aria-label', 'aria-description', 'aria-roledescription', 'placeholder', 'content', 'value', 'label', 'summary', 'abbr', 'download'])
  const GEOMETRIA = new Set(['d', 'points', 'viewbox', 'transform', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'offset', 'stroke-dasharray', 'pathlength', 'gradienttransform', 'patterntransform', 'values', 'keytimes', 'keysplines'])
  for (const el of document.querySelectorAll('*')) {
    for (const at of [...el.attributes]) {
      const n = at.name.toLowerCase()
      const v = at.value
      if (GEOMETRIA.has(n) || /^data:/.test(v)) continue
      let nuovo = v
      if (n === 'style') nuovo = urlTolte(parole(v))
      else if (n === 'src' || n === 'srcset' || n === 'poster') nuovo = v
      else if (TESTUALI.has(n) || n.startsWith('data-')) nuovo = parole(piatto(v))
      else nuovo = parole(v)
      if (nuovo !== v) {
        el.setAttribute(at.name, nuovo)
        conta.attributi++
      }
    }
  }

  // ── 5. il testo ──
  const SEMPLICI = new Set(['TITLE', 'TEXTAREA', 'OPTION', 'SCRIPT', 'NOSCRIPT', 'XMP', 'IFRAME'])
  const radici = [document, ...[...document.querySelectorAll('template')].map((t) => t.content)]
  for (const radice of radici) {
    const tw = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT)
    const nodi = []
    while (tw.nextNode()) nodi.push(tw.currentNode)
    for (const n of nodi) {
      const s = n.nodeValue
      const padre = n.parentNode
      if (!padre) continue
      if (padre.nodeName === 'STYLE') {
        const nuovo = urlTolte(parole(s))
        if (nuovo !== s) { n.nodeValue = nuovo; conta.stile++ }
        continue
      }
      const ps = pezzi(s)
      if (n.nodeType === 8 || SEMPLICI.has(padre.nodeName) || padre.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
        const nuovo = parole(ps.length ? cuci(s, ps, () => '▮▮▮') : s)
        if (nuovo !== s) { n.nodeValue = nuovo; conta.testo++ }
        continue
      }
      if (!ps.length) {
        const nuovo = parole(s)
        if (nuovo !== s) { n.nodeValue = nuovo; conta.testo++ }
        continue
      }
      const frag = document.createDocumentFragment()
      let q = 0
      for (const p of ps) {
        if (p.da > q) frag.append(parole(s.slice(q, p.da)))
        const b = document.createElement('span')
        b.className = 'tm-x'
        b.title = 'tolto per riservatezza'
        b.textContent = 'x'.repeat(Math.max(3, Math.min(22, p.a - p.da)))
        frag.append(b)
        tipi[p.tipo] = (tipi[p.tipo] || 0) + 1
        q = p.a
      }
      if (q < s.length) frag.append(parole(s.slice(q)))
      padre.replaceChild(frag, n)
      conta.testo++
    }
  }

  // ── 6. il documento, scritto come il file di partenza ──
  const parti = []
  for (const n of document.childNodes) {
    if (n.nodeType === 10) parti.push('<!doctype html>')
    else if (n.nodeType === 8) parti.push(`<!--${n.data}-->`)
    else if (n.nodeType === 1) parti.push(n.outerHTML)
  }
  return { html: parti.join('\n'), conta, tipi }
}

// ── il giro ───────────────────────────────────────────────────────────────────
const regole = REGOLE_TESTO
const b = await puppeteer().launch({ executablePath: eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--font-render-hinting=none'] })
const esito = []
try {
  for (const s of SITI) {
    const manifesto = (await import(pathToFileURL(join(SITO, 'src/data/tempo', `${s.id}.js`)).href)).default
    const fuori = join(PUBLIC, 'media/tempo', s.id)
    mkdirSync(fuori, { recursive: true })
    for (const v of manifesto.versioni) {
      if (opt('solo') && !opt('solo').split(',').includes(v.data)) continue
      const file = join(PUBLIC, 'tempo', s.dominio, v.data, 'pagina', 'index.html')
      if (!existsSync(file)) { esito.push({ sito: s.id, data: v.data, manca: true }); continue }
      const page = await b.newPage()
      try {
        await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'light' }])
        // niente richieste fuori dal server locale: le copie sono autonome
        await page.setRequestInterception(true)
        page.on('request', (r) => (r.url().startsWith(BASE) || r.url().startsWith('data:') ? r.continue() : r.abort()))
        await page.goto(`${BASE}/tempo/${s.dominio}/${v.data}/pagina/`, { waitUntil: 'load', timeout: 60000 })
        const prima = readFileSync(file, 'utf8')
        const r = await page.evaluate(oscuraNellaPagina, { regole, emailPubblica: EMAIL_PUBBLICA, tolte })
        // l'intestazione del file (il commento in cima) torna com'era, a capo compreso
        const html = r.html.replace(/^<!doctype html>\n/i, prima.match(/^<!doctype html>\s*/i)?.[0] || '<!doctype html>\n')
        if (html !== prima) writeFileSync(file, html)
        let foto = ''
        if (!process.argv.includes('--senza-foto')) {
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.waitForNetworkIdle({ idleTime: 300, timeout: 8000 }).catch(() => {})
          await new Promise((ok) => setTimeout(ok, 400))
          const t = await page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 800 } })
          await sharp(t).resize({ width: 640 }).webp({ quality: 72, effort: 5 }).toFile(join(fuori, `${v.short}-t.webp`))
          const alto = await page.evaluate(() => document.documentElement.scrollHeight)
          const h = Math.min(1707, Math.max(800, alto))
          const vv = await page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: h }, captureBeyondViewport: true })
          await sharp(vv).resize({ width: 480, height: 640, fit: 'cover', position: 'top' }).webp({ quality: 70, effort: 5 }).toFile(join(fuori, `${v.short}-v.webp`))
          foto = 't+v'
        }
        esito.push({ sito: s.id, data: v.data, cambiata: html !== prima, ...r.conta, tipi: r.tipi, foto })
        console.log(`√ ${s.dominio} ${v.data}${html !== prima ? '' : ' (già pulita)'} · testo ${r.conta.testo} · attributi ${r.conta.attributi} · link ${r.conta.link} · immagini ${r.conta.immagini}${foto ? ' · foto' : ''}`)
      } catch (e) {
        esito.push({ sito: s.id, data: v.data, errore: String(e).slice(0, 200) })
        console.log(`× ${s.dominio} ${v.data}: ${String(e).slice(0, 200)}`)
        process.exitCode = 1
      } finally {
        await page.close().catch(() => {})
      }
    }
  }
} finally {
  await b.close()
  server.close()
}
const tot = esito.reduce((t, e) => ({ pagine: t.pagine + 1, cambiate: t.cambiate + (e.cambiata ? 1 : 0), link: t.link + (e.link || 0), immagini: t.immagini + (e.immagini || 0) }), { pagine: 0, cambiate: 0, link: 0, immagini: 0 })
const tipi = {}
for (const e of esito) for (const [k, n] of Object.entries(e.tipi || {})) tipi[k] = (tipi[k] || 0) + n
console.log(`\n${tot.pagine} copie, ${tot.cambiate} riscritte · ${tot.link} link spenti · ${tot.immagini} immagini tolte · dati tolti: ${Object.entries(tipi).map(([k, n]) => `${k} ${n}`).join(', ')}`)
if (opt('esito')) writeFileSync(opt('esito'), JSON.stringify(esito, null, 1))
