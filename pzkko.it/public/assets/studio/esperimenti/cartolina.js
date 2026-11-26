// 06 · Cartolina viva. Uno SVG 1200 × 630 costruito adesso con avatar, stato,
// luogo, brano e colori veri; si scarica in SVG o PNG e si condivide col foglio
// di condivisione del telefono. Le immagini entrano come data URL, così il PNG
// non dipende da nessun servizio.
import { esc, ferma, data as dataIt } from '../utils.js'

const T = {
  it: {
    pronta: 'pronta',
    preparo: 'preparo…',
    svg: 'Scarica SVG',
    png: 'Scarica PNG',
    condividi: 'Condividi',
    nota: 'La cartolina si costruisce qui, con i dati di adesso. Il PNG è 1200 × 630, pronto per una storia o per un messaggio.',
    senza: 'niente da condividere',
    fatto: 'fatto',
    oggi: 'oggi',
    adesso: 'adesso',
    offline: 'offline',
    online: 'online',
    inPausa: 'in pausa',
    nonDisturbare: 'non disturbare',
    ufficio: 'in ufficio',
    giro: 'in giro per il mondo',
    ascolta: 'sta ascoltando',
    fattoCon: 'fatto dal vivo su pzkko.it/#studio',
  },
  en: {
    pronta: 'ready',
    preparo: 'preparing…',
    svg: 'Download SVG',
    png: 'Download PNG',
    condividi: 'Share',
    nota: 'The postcard is built here, with right-now data. The PNG is 1200 × 630, ready for a story or a message.',
    senza: 'nothing to share',
    fatto: 'done',
    oggi: 'today',
    adesso: 'now',
    offline: 'offline',
    online: 'online',
    inPausa: 'idle',
    nonDisturbare: 'do not disturb',
    ufficio: 'at the office',
    giro: 'somewhere in the world',
    ascolta: 'listening to',
    fattoCon: 'made live on pzkko.it/#studio',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]

const cacheImg = new Map()
async function dataUrl(url, tipo = 'image/png') {
  if (!url) return null
  if (cacheImg.has(url)) return cacheImg.get(url)
  const p = (async () => {
    const r = await fetch(url, { cache: 'force-cache' })
    if (!r.ok) throw new Error(`${r.status}`)
    const b = await r.blob()
    return await new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(String(fr.result))
      fr.onerror = () => rej(fr.error)
      fr.readAsDataURL(b.type ? b : new Blob([b], { type: tipo }))
    })
  })().catch(() => null)
  cacheImg.set(url, p)
  if (cacheImg.size > 24) cacheImg.delete(cacheImg.keys().next().value)
  return p
}

const stato = (a, lang) => (a.status === 'online' ? t(lang, 'online') : a.status === 'idle' ? t(lang, 'inPausa') : a.status === 'dnd' ? t(lang, 'nonDisturbare') : t(lang, 'offline'))
const luogo = (a, lang) => (a.luogo === 'ufficio' ? t(lang, 'ufficio') : a.luogo === 'giro' ? t(lang, 'giro') : '')
const righe = (testo, n, massimo = 2) => {
  const parole = String(testo || '').split(/\s+/).filter(Boolean)
  const out = []
  let riga = ''
  for (const p of parole) {
    const prova = riga ? `${riga} ${p}` : p
    if (prova.length <= n) riga = prova
    else { if (riga) out.push(riga); riga = p; if (out.length === massimo) break }
  }
  if (riga && out.length < massimo) out.push(riga)
  if (out.length === massimo && parole.join(' ').length > out.join(' ').length) out[massimo - 1] = out[massimo - 1].replace(/\s+\S*$/, '…')
  return out
}

function svg(a, lang, colori, avatar, arte) {
  const m = a.track
  const c1 = colori[0] || '#ccff00', c2 = colori[1] || '#9d00ff', fondo = colori[3] || '#2b1438'
  const statoTesto = `${stato(a, lang)}${luogo(a, lang) ? ` · ${luogo(a, lang)}` : ''}`
  const custom = a.custom?.state ? esc(a.custom.state) : ''
  const titoloRighe = m ? righe(m.titolo, 24, 2) : []
  const quando = new Date()
  const inizio = m?.inizio, fine = m?.fine
  let barra = ''
  if (inizio && fine && fine > inizio) {
    const pc = Math.min(100, Math.max(0, ((Date.now() - inizio) / (fine - inizio)) * 100))
    barra = `<g>
      <rect x="72" y="520" width="620" height="8" rx="4" fill="rgba(255,255,255,.16)"/>
      <rect x="72" y="520" width="${(620 * pc / 100).toFixed(1)}" height="8" rx="4" fill="${esc(c1)}"/>
      <text x="72" y="556" fill="rgba(255,255,255,.66)" font-size="19">${ferma(Math.max(0, quando - inizio))}</text>
      <text x="692" y="556" text-anchor="end" fill="rgba(255,255,255,.66)" font-size="19">${ferma(fine - inizio)}</text>
    </g>`
  }
  const arteBox = m && arte ? `<g>
      <defs><clipPath id="arte"><rect x="756" y="128" width="372" height="372" rx="28"/></clipPath>
      <filter id="ombra" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000" flood-opacity=".45"/></filter></defs>
      <rect x="756" y="128" width="372" height="372" rx="28" fill="${esc(c2)}" opacity=".35" filter="url(#ombra)"/>
      <image href="${arte}" x="756" y="128" width="372" height="372" preserveAspectRatio="xMidYMid slice" clip-path="url(#arte)"/>
      <rect x="756" y="128" width="372" height="372" rx="28" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/>
    </g>` : ''
  const testoBrano = m ? `<g>
      ${titoloRighe.map((r, i) => `<text x="72" y="${350 + i * 54}" fill="#fff" font-size="46" font-weight="700" letter-spacing="-1">${esc(r)}</text>`).join('')}
      <text x="72" y="${350 + titoloRighe.length * 54 + 6}" fill="${esc(c1)}" font-size="28" font-weight="600">${esc(m.artista)}</text>
      ${m.album ? `<text x="72" y="${350 + titoloRighe.length * 54 + 42}" fill="rgba(255,255,255,.6)" font-size="21">${esc(m.album)}</text>` : ''}
      <text x="72" y="286" fill="rgba(255,255,255,.6)" font-size="18" letter-spacing="3">${esc(t(lang, 'ascolta').toUpperCase())}</text>
    </g>` : `<g>
      <text x="72" y="388" fill="#fff" font-size="112" font-weight="800" letter-spacing="-5">pzkko</text>
      <text x="76" y="438" fill="${esc(c1)}" font-size="28" font-weight="600">${esc(t(lang, 'adesso'))} · ${esc(statoTesto)}</text>
    </g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="pzkko" font-family="Arial, Helvetica, sans-serif">
    <defs>
      <radialGradient id="g1" cx="12%" cy="8%" r="80%"><stop offset="0" stop-color="${esc(c1)}" stop-opacity=".55"/><stop offset="1" stop-color="${esc(c1)}" stop-opacity="0"/></radialGradient>
      <radialGradient id="g2" cx="92%" cy="92%" r="85%"><stop offset="0" stop-color="${esc(c2)}" stop-opacity=".6"/><stop offset="1" stop-color="${esc(c2)}" stop-opacity="0"/></radialGradient>
      <linearGradient id="velo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0810" stop-opacity="0"/><stop offset="1" stop-color="#0b0810" stop-opacity=".55"/></linearGradient>
      <clipPath id="faccia"><circle cx="122" cy="170" r="52"/></clipPath>
    </defs>
    <rect width="1200" height="630" fill="#0b0810"/>
    <rect width="1200" height="630" fill="${esc(fondo)}" opacity=".5"/>
    <rect width="1200" height="630" fill="url(#g1)"/>
    <rect width="1200" height="630" fill="url(#g2)"/>
    <g opacity=".09" stroke="#fff" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 110}" y1="0" x2="${i * 110}" y2="630"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${i * 110}" x2="1200" y2="${i * 110}"/>`).join('')}</g>
    <rect width="1200" height="630" fill="url(#velo)"/>
    <text x="64" y="66" fill="rgba(255,255,255,.72)" font-size="18" font-weight="700" letter-spacing="3">PZKKO · ${esc(t(lang, 'adesso').toUpperCase())}</text>
    <text x="1136" y="66" fill="rgba(255,255,255,.52)" font-size="17" text-anchor="end">pzkko.it/#studio</text>
    ${avatar ? `<image href="${avatar}" x="70" y="118" width="104" height="104" preserveAspectRatio="xMidYMid slice" clip-path="url(#faccia)"/>` : `<circle cx="122" cy="170" r="52" fill="${esc(c2)}"/><text x="122" y="186" text-anchor="middle" fill="#fff" font-size="44" font-weight="800">p</text>`}
    <circle cx="122" cy="170" r="54" fill="none" stroke="${esc(c1)}" stroke-width="3" opacity=".9"/>
    <text x="198" y="156" fill="#fff" font-size="38" font-weight="800" letter-spacing="-1">pzkko</text>
    <text x="198" y="188" fill="rgba(255,255,255,.62)" font-size="20">@pzkko</text>
    <g transform="translate(198 226)">
      <circle cx="7" cy="-6" r="6" fill="${a.online ? esc(c1) : '#8a8790'}"/>
      <text x="22" y="0" fill="rgba(255,255,255,.86)" font-size="22" font-weight="600">${esc(statoTesto)}</text>
    </g>
    ${custom ? `<text x="72" y="270" fill="rgba(255,255,255,.72)" font-size="21">${custom}</text>` : ''}
    ${arteBox}
    ${testoBrano}
    ${barra}
    <line x1="72" y1="580" x2="1128" y2="580" stroke="rgba(255,255,255,.18)"/>
    <text x="72" y="608" fill="rgba(255,255,255,.5)" font-size="17">${esc(dataIt(quando, lang))}</text>
    <text x="1128" y="608" text-anchor="end" fill="rgba(255,255,255,.5)" font-size="17">${esc(t(lang, 'fattoCon'))}</text>
  </svg>`
}

export default {
  id: 'cartolina',
  titolo: { it: 'Cartolina viva', en: 'Living postcard' },
  testo: {
    it: 'Una cartolina 1200 × 630 con avatar, stato, luogo e brano di adesso: si scarica in SVG o PNG, o si manda al telefono col foglio di condivisione.',
    en: 'A 1200 × 630 postcard with avatar, status, place and current track: download it as SVG or PNG, or send it to a phone with the share sheet.',
  },
  tecnologie: ['SVG', 'Canvas', 'Web Share'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-cartolina" data-ante></div>
      <div class="lab__azioni">
        <button type="button" class="lab__bottone" data-svg>${esc(t(lang, 'svg'))}</button>
        <button type="button" class="lab__bottone lab__bottone--fantasma" data-png>${esc(t(lang, 'png'))}</button>
        <button type="button" class="lab__bottone lab__bottone--fantasma" data-share>${esc(t(lang, 'condividi'))}</button>
      </div>
      <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const ante = el.querySelector('[data-ante]')
    const statoEl = el.closest('.lab__card')?.querySelector('.lab__stato')
    let corrente = api.adesso(), svgCorrente = '', timer = 0, seq = 0, vivo = true

    async function costruisci(a) {
      const mio = ++seq
      const tema = api.tema()
      const colori = await api.palette(a.track?.img, [tema.p, tema.a, '#5b2c7a', '#f5ffcc', '#2b1438'])
      const [avatar, arte] = await Promise.all([
        dataUrl('/me.png', 'image/png'),
        a.track?.img ? dataUrl(api.immagine(a.track.img), 'image/png') : null,
      ])
      if (!vivo || mio !== seq) return
      svgCorrente = svg(a, lang, colori, avatar, arte)
      ante.innerHTML = svgCorrente
      api.stato(statoEl, t(lang, 'pronta'), 'ok')
    }

    function png() {
      return new Promise((res, rej) => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = 1200; c.height = 630
          const x = c.getContext('2d')
          x.drawImage(img, 0, 0)
          c.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png')
        }
        img.onerror = () => rej(new Error('svg'))
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCorrente)}`
      })
    }

    el.querySelector('[data-svg]').addEventListener('click', () => {
      if (!svgCorrente) return
      api.scarica(new Blob([svgCorrente], { type: 'image/svg+xml' }), 'pzkko-cartolina.svg')
    })
    el.querySelector('[data-png]').addEventListener('click', async () => {
      if (!svgCorrente) return
      try {
        api.stato(statoEl, t(lang, 'preparo'), '')
        api.scarica(await png(), 'pzkko-cartolina.png')
        api.stato(statoEl, t(lang, 'fatto'), 'ok')
      } catch (e) { console.error(e); api.stato(statoEl, 'PNG?', 'no') }
    })
    el.querySelector('[data-share]').addEventListener('click', async () => {
      if (!svgCorrente) return
      try {
        api.stato(statoEl, t(lang, 'preparo'), '')
        const b = await png()
        const file = new File([b], 'pzkko-cartolina.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] }) && navigator.share) {
          await navigator.share({ files: [file], title: 'pzkko', text: 'pzkko.it/#studio' })
          api.stato(statoEl, t(lang, 'fatto'), 'ok')
        } else {
          api.scarica(b, 'pzkko-cartolina.png')
          api.stato(statoEl, t(lang, 'senza'), '')
        }
      } catch (e) {
        if (e?.name !== 'AbortError') console.error(e)
        api.stato(statoEl, t(lang, 'pronta'), 'ok')
      }
    })

    const togli = api.onAdesso((a) => {
      corrente = a
      clearTimeout(timer)
      timer = setTimeout(() => { if (vivo) costruisci(corrente) }, 700)
    })
    costruisci(corrente)
    return () => { vivo = false; clearTimeout(timer); togli() }
  },
}
