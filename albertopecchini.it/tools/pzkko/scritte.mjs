#!/usr/bin/env node
// Le scritte dei volantini di pzkko.it: nessuna parola va a capo spezzata, mai (6.11.2026, Alberto: «whatsapp va a capo
// con 1 p, non deve assolutamente succedere»). Questo strumento apre la pagina nel browser a più larghezze (computer,
// tablet, telefono, telefono stretto) e guarda ogni scritta di ogni volantino (.vol: titoli, contatti, note a mano,
// tagliandi, testi):
//
//   - una parola spezzata su due righe (una «p» sola a capo)        → errore
//   - una scritta più larga del suo riquadro                         → errore
//   - sui volantini compatti (.s) un titolo o un contatto su più di una riga → errore
//
// e per i volantini compatti dice (e con --scrivi scrive in index.html) le misure giuste di --tt e --th: quanto dev'essere
// grande il titolo, e il contatto, in cqw del volantino, per riempire la colonna senza uscirne (il titolo al più 26, il
// contatto al più 9). Vanno rifatte quando cambia un titolo, un contatto, un carattere o una carta.
//
//   node tools/pzkko/scritte.mjs               controlla la home (esce con 1 se qualcosa non va)
//   node tools/pzkko/scritte.mjs --scrivi      mette --tt e --th giusti in pzkko/index.html, poi controlla
//   node tools/pzkko/scritte.mjs --pagina=storia     controlla la storia
//
// Da albertopecchini.it/. Serve puppeteer-core in tools/catture e un browser (browser.mjs).
import { createServer } from 'node:http'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from './browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../pzkko')
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
// (--pagina=storia o --pagina=/storia/: in Git Bash «/storia/» diventa un percorso di Windows, meglio il nome solo)
const chiesta = arg('pagina', '/')
const pagina = chiesta === '/' ? '/' : `/${chiesta.replace(/^.*[:\\]/, '').replace(/^\/+|\/+$/g, '').split('/').pop()}/`
const scrivi = process.argv.includes('--scrivi')
const MAX_TITOLO = 26, MAX_CONTATTO = 9 // cqw
const LARGHEZZE = [[1440, 1], [1024, 1], [900, 1], [768, 2], [430, 3], [390, 3], [360, 3], [320, 2]]

const TIPI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}${pagina}?ora=12:00`
const aperto = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })

// nella pagina: ogni scritta di ogni volantino, com'è messa
const guarda = () => {
  const out = { errori: [], avvisi: [], misure: [] }
  const nome = (v) => v.id ? '#' + v.id : (v.querySelector('h3, .titolo')?.textContent.trim() ?? '?')
  const righe = (rects) => { const tops = []; for (const r of rects) if (r.width > 0.5 && !tops.some((t) => Math.abs(t - r.top) < r.height * 0.5)) tops.push(r.top); return tops.length }
  for (const v of document.querySelectorAll('.vol')) {
    // (dritto, come lo misura la pagina: i rettangoli di un foglio storto sono più larghi)
    const era = v.style.cssText
    v.style.transition = 'none'; v.style.transform = 'none'
    const W = v.getBoundingClientRect().width
    for (const el of v.querySelectorAll('h3, .titolo, .handle, .mano, p, li, .tagliandi button span')) {
      if (el.closest('.pet-elenco') || !el.textContent.trim()) continue
      const cosa = `${nome(v)} · ${el.className || el.tagName.toLowerCase()} «${el.textContent.trim().slice(0, 30)}»`
      // severo sui titoli, i contatti, le note a mano, i tagliandi e su tutto quello che sta in un compatto; nei testi lunghi
      // (p, li) un link può spezzarsi (overflow-wrap:anywhere, apposta): lì è solo un avviso
      const dove = v.classList.contains('s') || el.matches('h3, .titolo, .handle, .mano, .tagliandi button span') ? out.errori : out.avvisi
      // 1. le parole: ognuna tutta su una riga
      const cammino = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      for (let n = cammino.nextNode(); n; n = cammino.nextNode()) {
        for (const m of n.data.matchAll(/\S+/g)) {
          const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length)
          if (righe(r.getClientRects()) > 1) dove.push(`parola spezzata: «${m[0]}» in ${cosa}`)
        }
      }
      // 2. la scritta dentro il suo riquadro (i tagliandi sono girati: lì conta l'altezza)
      const tagliando = !!el.closest('.tagliandi')
      const r = document.createRange(); r.selectNodeContents(el)
      // (il riquadro senza i suoi margini interni: i titoli compatti ne hanno un filo per i corsivi, che sporgono)
      const t = r.getBoundingClientRect(), cs = getComputedStyle(el)
      const b = { width: el.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) }
      if (!tagliando && t.width > b.width + 2) dove.push(`sborda di ${(t.width - b.width).toFixed(1)} px: ${cosa}`)
      if (tagliando) { const bb = el.closest('button').getBoundingClientRect(); if (t.height > bb.height + 1) out.errori.push(`il tagliando è corto di ${(t.height - bb.height).toFixed(1)} px: ${cosa}`) }
      // 3. sui compatti: titolo e contatto su una riga sola; e la misura che riempirebbe la colonna
      if (v.classList.contains('s') && el.matches('h3, .handle')) {
        if (righe(r.getClientRects()) > 1) out.errori.push(`su più righe: ${cosa}`)
        const px = parseFloat(getComputedStyle(el).fontSize)
        out.misure.push({ vol: nome(v), cosa: el.matches('h3') ? 'tt' : 'th', ora: (px / W) * 100, piena: (px / W) * 100 * (b.width / t.width) })
      }
    }
    // il testo tutto dentro il foglio (il volantino che cresce oltre la carta è un compatto sbagliato)
    const testo = v.querySelector('.testo')
    if (testo && v.classList.contains('s') && testo.scrollHeight > testo.clientHeight + 1) out.errori.push(`il testo è più alto del foglio di ${testo.scrollHeight - testo.clientHeight} px: ${nome(v)}`)
    v.style.cssText = era
  }
  return out
}

const apri = async (larga, dpr) => {
  const page = await aperto.newPage()
  await page.setViewport({ width: larga, height: 900, deviceScaleFactor: dpr })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  // (i caratteri dei titoli devono esserci davvero: se uno manca la misura sarebbe quella di un altro carattere)
  // (solo dove ci sono i volantini compatti: la storia e la 404 hanno le stesse regole, ma non li usano)
  const mancano = await page.evaluate(() => (document.querySelector('.vol.s') ? [...document.fonts].filter((f) => /^"?s-/.test(f.family) && f.status !== 'loaded').map((f) => f.family) : []))
  return { page, mancano }
}

let male = 0
try {
  if (scrivi) {
    if (pagina !== '/') throw new Error('--scrivi: solo per la home')
    // le misure: al computer (i cqw sono gli stessi a ogni larghezza), col titolo e il contatto di adesso
    const { page, mancano } = await apri(1440, 2)
    if (mancano.length) throw new Error(`i caratteri ${mancano.join(', ')} non si sono caricati: node tools/pzkko/caratteri.mjs`)
    const { misure } = await page.evaluate(guarda)
    await page.close()
    const file = join(ROOT, 'index.html')
    let html = await readFile(file, 'utf8')
    for (const m of misure) {
      // un filo sotto la colonna piena (il 96%: i caratteri non sono uguali al decimo di pixel su ogni schermo), a decimi
      const tetto = m.cosa === 'tt' ? MAX_TITOLO : MAX_CONTATTO
      const v = Math.floor(Math.min(tetto, m.piena * 0.96) * 10) / 10
      const i = html.indexOf(`>${m.vol}</a></h3>`)
      const a = html.lastIndexOf('<article', i)
      if (i < 0 || a < 0) throw new Error(`in index.html non trovo il volantino «${m.vol}»`)
      const tag = html.slice(a, html.indexOf('>', a) + 1)
      const re = new RegExp(`--${m.cosa}:[0-9.]+`)
      if (!re.test(tag)) throw new Error(`«${m.vol}»: manca --${m.cosa} nello style`)
      html = html.slice(0, a) + tag.replace(re, `--${m.cosa}:${v}`) + html.slice(a + tag.length)
      console.log(`  ${m.vol.padEnd(12)} --${m.cosa}: ${m.ora.toFixed(1)} → ${v}${v >= tetto ? ' (il tetto)' : ''}`)
    }
    await writeFile(file, html)
    console.log(`scritte le misure in ${file}`)
  }
  for (const [larga, dpr] of LARGHEZZE) {
    const { page, mancano } = await apri(larga, dpr)
    const { errori, avvisi } = await page.evaluate(guarda)
    await page.close()
    for (const f of mancano) errori.push(`il carattere ${f} non si è caricato`)
    male += errori.length
    console.log(`${String(larga).padStart(5)} px: ${errori.length ? errori.length + ' da sistemare' : 'tutto a posto'}`)
    for (const e of [...new Set(errori)]) console.log(`        ! ${e}`)
    for (const e of [...new Set(avvisi)]) console.log(`        · (nel testo) ${e}`)
  }
} finally {
  await aperto.close()
  server.close()
}
if (male) { console.error(`\nscritte: ${male} cose da sistemare`); process.exit(1) }
console.log('\nscritte: nessuna parola spezzata, nessuna scritta fuori dal suo riquadro')
