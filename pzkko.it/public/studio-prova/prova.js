// La pagina di prova dello Studio (27.11.2026): monta il guscio vero con dati finti, per fotografare le vignette.
//   /studio-prova/?solo=radio,stanza  ?stato=online|idle|dnd|offline  ?musica=0  ?app=4  ?luogo=ufficio|giro
//   ?gioco=1  ?custom=testo  ?meteo=0|2|3|45|61|71|95|giu  ?tema=dark  ?lang=en  ?w=560 (larghezza del foglio)  ?testa=1
// I dati finti passano da fetch (vetrina, copertine, meteo) e dalle immagini: il resto è il codice vero dello Studio.
const q = new URLSearchParams(location.search)
const solo = q.get('solo')?.split(',').filter(Boolean)
const stato = q.get('stato') || 'online'
const musica = q.get('musica') !== '0'
const nApp = +(q.get('app') ?? 5)
const lang = q.get('lang') || 'it'
const meteo = q.get('meteo') ?? '2'
document.documentElement.dataset.theme = q.get('tema') === 'dark' ? 'dark' : 'light'
document.documentElement.lang = lang
if (solo) document.body.dataset.solo = solo.join(',')
document.body.dataset.testa = q.get('testa') === '1' ? '1' : solo ? '0' : '1'
if (q.get('w')) document.body.style.setProperty('--w', `${+q.get('w')}px`)

const FINTE = { finto0: '/art/manifesti1/concerto.webp', finto1: '/favicon.png', finto2: '/me.png', finto3: '/art/arte1/caffe.webp', finto4: '/art/arte1/cornetta.webp', finto5: '/apple-touch-icon.png', finto6: '/og.png', finto7: '/favicon.png' }
const vero = (u) => {
  const m = /\/api\/vetrina\/\?img=(finto\d)/.exec(String(u))
  return m ? FINTE[m[1]] : u
}
const ora = Date.now()
const APP = ['Discord', 'Spotify', 'Visual Studio Code', 'Edge', 'AutoCAD', 'Blender', 'OBS Studio', 'Telegram']
const VETRINA = {
  ok: true,
  luogo: q.get('luogo') || 'ufficio',
  app: APP.slice(0, nApp).map((n, i) => ({ n, i: `finto${(i % 7) + 1}`, su: i === 2 })),
  musica: musica ? { titolo: 'Notti magiche in tangenziale', artista: 'I Pzkko & la Banda del Muro', album: 'Lavori in corso', img: 'finto0', inizio: ora - 72_000, fine: ora + 128_000 } : null,
  agg: ora,
}
const METEO = { ok: true, codice: +meteo, temperatura: 7.4, vento: 13, pioggia12: meteo === '61' ? 3.2 : 0, visibilita: meteo === '45' ? 800 : 24000 }
const finto = (dati) => new Response(JSON.stringify(dati), { headers: { 'content-type': 'application/json' } })
const fetchVero = window.fetch.bind(window)
window.fetch = (u, o) => {
  const s = String(u?.url || u)
  if (s.includes('/api/vetrina/?img=')) return fetchVero(vero(s), o)
  if (s.includes('/api/vetrina/?biglietto')) return Promise.resolve(finto({ ok: false }))
  if (s.includes('/api/vetrina/')) return Promise.resolve(finto(VETRINA))
  if (s.includes('/api/meteo/')) return meteo === 'giu' ? Promise.reject(new Error('giù')) : Promise.resolve(finto(METEO))
  return fetchVero(u, o)
}
// le <img> e le <image> dell'SVG con le copertine finte
const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
Object.defineProperty(HTMLImageElement.prototype, 'src', { get() { return d.get.call(this) }, set(v) { d.set.call(this, vero(v)) }, configurable: true })
const sistema = (n) => {
  if (n.nodeType !== 1) return
  for (const el of [n, ...n.querySelectorAll('img, image')]) {
    for (const a of ['src', 'href']) { const v = el.getAttribute?.(a); if (v && v.includes('img=finto')) el.setAttribute(a, vero(v)) }
  }
}
new MutationObserver((ms) => { for (const m of ms) { m.addedNodes.forEach(sistema); if (m.type === 'attributes') sistema(m.target) } })
  .observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'href'] })

const PRESENZA = {
  discord_status: stato,
  activities: [
    ...(q.get('custom') !== '0' ? [{ type: 4, name: 'Custom Status', state: q.get('custom') || 'sto rifacendo lo studio, non disturbate', emoji: { name: '🔧' } }] : []),
    ...(q.get('gioco') === '1' ? [{ type: 0, name: 'Minecraft', details: 'in miniera col piccone', timestamps: { start: ora - 3_000_000 } }] : []),
  ],
}

const studio = await import('/assets/studio/index.js')
const root = document.getElementById('panel-studio')
studio.monta(root, {
  lang,
  presence: () => PRESENZA,
  onPresence: () => () => {},
  open: (k) => console.log('open', k),
  toast: (m) => console.log('toast', m),
})
if (solo) for (const c of root.querySelectorAll('.lab__card')) if (solo.includes(c.dataset.lab)) c.dataset.soloSi = '1'
window.__studioProva = { VETRINA, PRESENZA, METEO }
