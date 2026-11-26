// Cosa fotografare di ogni sito: formati di catalogo e catture per progetto.
// L'indirizzo di ogni sito viene da `web.url` in src/data/projects.js (qui solo
// quando va forzato); i file finiscono in public/media/web/. Vedi README.md.

// Formati di catalogo: viewport CSS → larghezza del file (l'altezza segue in proporzione).
// `alta` = pagina intera tagliata a quell'altezza CSS; `strisce` = pagina intera a strisce.
export const formati = {
  desktop: { viewport: [1440, 900], scala: 1, larghezza: 1200 },
  desktopTall: { viewport: [1440, 900], scala: 1, larghezza: 1200, alta: 3400 },
  tablet: { viewport: [820, 1180], scala: 1, larghezza: 720 },
  mobile: { viewport: [390, 844], scala: 2, larghezza: 600, telefono: true },
  mobileTall: { viewport: [390, 844], scala: 2, larghezza: 600, telefono: true, alta: 2600 },
  // iPhone 18 Pro del case study: 402 punti @2x, strisce sotto i 16.384 px di Chromium
  iphone: { viewport: [402, 812], scala: 2, larghezza: 804, telefono: true, strisce: 2400, qualita: 78 },
}

// Le cinque catture della home che usano i mockup (web.desktop … web.mobileTall).
const casa = (prefisso, percorso = '/') =>
  ['desktop', 'desktopTall', 'tablet', 'mobile', 'mobileTall'].map((formato) => ({
    file: `${prefisso}-${formato.replace('Tall', '-tall')}.webp`,
    percorso,
    formato,
  }))

// Porta un elemento a `margine` px dal bordo alto della finestra.
const scorriA = (selettore, margine = 0) => (page) =>
  page.evaluate(
    (s, m) => {
      const el = document.querySelector(s)
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - m)
    },
    selettore,
    margine,
  )

export const siti = {
  'rivaltasulmincio-it': {
    catture: [
      ...casa('rivalta'),
      // #place-049 = chiesa dei Santi Vigilio e Donato: la mappa la centra e apre la scheda
      { file: 'rivalta-mappa-desktop.webp', percorso: '/mappa#place-049', formato: 'desktop', prima: scorriA('.map-block', 20) },
      { file: 'rivalta-luogo-tablet.webp', percorso: '/luoghi/chiesa-santi-vigilio-e-donato', formato: 'tablet', viewport: [820, 1093] },
      {
        file: 'rivalta-mappa-mobile.webp',
        percorso: '/mappa#place-049',
        formato: 'mobile',
        prima: async (page) => {
          // un secondo clic sul marker scelto sposta la mappa sopra la scheda che sale dal basso
          await page.evaluate(() => document.querySelector('.leaflet-marker-icon .is-selected, .leaflet-marker-icon.is-selected')?.closest('.leaflet-marker-icon')?.click())
          await new Promise((r) => setTimeout(r, 600))
          await scorriA('.map-block', 12)(page)
        },
      },
    ],
  },

  'cascina-fontana': {
    catture: [
      ...casa('cascina'),
      { file: 'cascina-prodotti-desktop.webp', percorso: '/prodotti/', formato: 'desktop', prima: scorriA('#latte') },
      {
        file: 'cascina-galleria-tablet.webp',
        percorso: '/galleria/',
        formato: 'tablet',
        viewport: [820, 1093],
        prima: (page) => page.click('[data-photo="viale-platani"]'),
      },
      { file: 'cascina-contatti-mobile.webp', percorso: '/contatti/', formato: 'mobile' },
    ],
  },

  'albertopecchini-it': {
    // l'apex ha ancora un record DNS del vecchio hosting: si passa da www
    url: 'https://www.albertopecchini.it',
    // senza barra di scorrimento, `scrollbar-gutter: stable` lascerebbe una striscia vuota a destra
    stile: 'html { scrollbar-gutter: auto !important; }',
    // la hero cambia figura da sola: si fotografa sempre la prima
    prima: (page) => page.evaluate(() => document.querySelector('[data-hero-go="0"]')?.click()),
    catture: [...casa('ap'), { file: 'ap-iphone', percorso: '/', formato: 'iphone' }],
  },

  'dario-donelli': {
    catture: casa('dd'),
  },

  // (25.11.2026) pzkko.it, il profilo di Discord. Il canale diretto col pc resta sempre aperto e la pagina non
  // arriva mai a «rete ferma»: si carica fino al documento e si aspetta che il profilo dal vivo sia in pagina.
  // L'invito (o il volantino) che può uscire all'arrivo si chiude: la cattura è la pagina com'è dopo.
  'pzkko-it': {
    carica: 'domcontentloaded',
    prima: async (page) => {
      await page
        .waitForFunction(() => document.querySelectorAll('.tab').length >= 5 && [...document.querySelectorAll('#card img')].every((i) => i.complete), { timeout: 60_000, polling: 500 })
        .catch(() => console.log(`! ${page.url()}: il profilo non è arrivato`))
      await new Promise((r) => setTimeout(r, 3000))
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()))
      await page.evaluate(() => scrollTo(0, 0))
    },
    // Senza le pagine intere: la scheda del profilo e la barra delle schede restano appiccicate a metà pagina, e
    // in fondo alla bacheca c'è la scheda Instagram con l'account personale (fuori da questo sito dal 12.11.2026)
    catture: [
      ...casa('pzk').filter((c) => !c.formato.endsWith('Tall')),
      { file: 'pzk-progetti-desktop.webp', percorso: '/#progetti', formato: 'desktop' },
      // sul tablet le schede stanno sotto il profilo: si scende fino alla barra delle schede
      { file: 'pzk-chat-tablet.webp', percorso: '/#chat', formato: 'tablet', viewport: [820, 1093], prima: scorriA('#tabs', 12) },
      // #progetti/giochini apre la scheda del casinò sopra il profilo (div.pv, non un <dialog>: la chiusura qui sopra non
      // la tocca); la prima voce della galleria è un filmato, fermo coi suoi comandi: si mostra la seconda, una foto
      {
        file: 'pzk-casino-mobile.webp',
        percorso: '/#progetti/giochini',
        formato: 'mobile',
        prima: async (page) => {
          await page.waitForSelector('.pv.is-on', { timeout: 20_000 }).catch(() => console.log('! la scheda del casinò non si è aperta'))
          await page.evaluate(() => document.querySelector('.pv [data-go="1"]')?.click())
          await new Promise((r) => setTimeout(r, 1200))
        },
      },
    ],
  },
}
