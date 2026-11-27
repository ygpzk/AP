// Tabella delle rotte: ogni voce produce una pagina statica.
// Usata dal plugin `plugins/site-pages.js` sia in sviluppo sia in build.

import { site, placeholders } from '../data/site.js'
import { projects, areas, allAreas } from '../data/projects.js'
import { renderArt } from '../art/index.js'
import { layout, personLd, serviceLd, breadcrumbLd, abs } from './layout.js'
import { homePage } from './pages/home.js'
import { portfolioPage, tecnicoPage, webPage, graficaPage } from './pages/portfolio.js'
import { caseStudyPage, caseStudyLd } from './pages/case-study.js'
import { serviziPage, metodoPage, studioPage, profiloPage } from './pages/info.js'
import { contattiPage } from './pages/contact.js'
import { privacyPage, cookiePage, creditiPage, notFoundPage } from './pages/legal.js'
import { stilePage } from './pages/stile.js'
import { aragostaPage } from './pages/aragosta.js'
import { tempoPage, tempoRotte } from './pages/tempo.js'
import { tavolePage, sheetCount, hasSheets } from './pages/tavole.js'
import { emailPage } from './pages/email.js'
import { wrapped5btPage } from './pages/wrapped5bt.js'
import { informaticaPage, informaticaLd } from './pages/informatica.js'
import { informatica } from '../data/informatica.js'
import { sicurezzaPage, sicurezzaLd } from './pages/sicurezza.js'
import { sicurezza } from '../data/sicurezza.js'
import { unimore, materiaPath, bloccoPath, esercizioPath } from '../data/unimore.js'
import { unimorePage, materiaPage, bloccoPage, esercizioPage } from './pages/unimore.js'

const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: 'it-IT',
  publisher: { '@id': abs('/#person') },
})

const crumbs = (...items) => breadcrumbLd([{ label: 'Home', href: '/' }, ...items])

const tutteLeRotte = [
  {
    path: '/',
    priority: 1,
    title: `${site.name} — Rilievi, siti web e grafica`,
    description: site.description,
    render: homePage,
    jsonld: () => [websiteLd(), personLd(), serviceLd()],
  },
  {
    path: '/portfolio/',
    priority: 0.9,
    title: 'Portfolio — i lavori',
    description: `${projects.length} progetti tra rilievi, pratiche, modelli 3D, siti web e identità visive. Puoi filtrarli per categoria, anno, settore, tecnologia e tipologia.`,
    render: portfolioPage,
    jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' })],
  },
  {
    path: '/portfolio/tecnico/',
    priority: 0.8,
    title: 'Progetti tecnici — rilievi, CAD, pratiche edilizie',
    description: 'Rilievi, progetti, pratiche edilizie e catastali, modelli 3D e BIM, cantieri. Ogni scheda riporta committente, strumenti e risultato.',
    render: tecnicoPage,
    jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Tecnico', href: '/portfolio/tecnico/' })],
  },
  {
    path: '/portfolio/web/',
    priority: 0.8,
    title: 'Progetti web — siti e interfacce',
    description: 'Siti web progettati e sviluppati da me: cosa serviva, come l’ho fatto, con quali strumenti e com’è andata. Con le schermate su computer, tablet e telefono.',
    render: webPage,
    headerTheme: 'ink',
    jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Web', href: '/portfolio/web/' })],
  },
  // L'area Grafica è nascosta finché non c'è un lavoro reale da mostrare
  // (`hidden` su allAreas.grafica in src/data/projects.js): la pagina
  // /portfolio/grafica/ non viene generata e graficaPage resta pronta.
  ...(areas.grafica
    ? [
        {
          path: '/portfolio/grafica/',
          priority: 0.8,
          title: 'Progetti grafici — loghi e stampati',
          description: 'Loghi costruiti sulla griglia, restyling, immagine coordinata, manifesti, packaging e modelli. Il graphic design fatto con il rigore di una tavola tecnica.',
          render: graficaPage,
          jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Grafica', href: '/portfolio/grafica/' })],
        },
      ]
    : []),
  // Le tavole vere si vedono solo con `showSheets` acceso (src/data/projects.js):
  // spento, la pagina non viene generata e la voce sparisce dal menù.
  ...(hasSheets()
    ? [
        {
          path: '/portfolio/tavole/',
          priority: 0.7,
          title: 'Tavole — i disegni da vicino',
          description: `${sheetCount()} tavole dei miei progetti tecnici, dal DWG allo schermo: progetto stradale, esame di Stato, layout di cantiere. Ingrandisci, spostati sul foglio, scarica il PDF.`,
          render: tavolePage,
          pageClass: 'page--tavole',
          noFooter: true, // il visualizzatore occupa tutta la finestra: niente chiusura sotto
          jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Tavole', href: '/portfolio/tavole/' })],
        },
      ]
    : []),
  ...projects.map((p) => ({
    path: `/portfolio/${p.slug}/`,
    priority: p.featured ? 0.7 : 0.6,
    ogType: 'article',
    title: `${p.title} — ${p.subtitle}`,
    description: p.summary,
    render: () => caseStudyPage(p),
    jsonld: () => [caseStudyLd(p, abs), crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: allAreas[p.area].short, href: allAreas[p.area].href }, { label: p.title, href: `/portfolio/${p.slug}/` })],
  })),
  {
    path: '/servizi/',
    priority: 0.9,
    title: 'Servizi — tecnico, web, grafica e informatica',
    description: 'Rilievi, CAD, catasto, pratiche edilizie, 3D e BIM; siti web e frontend; loghi, branding e stampati; assistenza informatica. Per ogni servizio, cosa faccio e cosa consegno.',
    render: serviziPage,
    jsonld: () => [crumbs({ label: 'Servizi', href: '/servizi/' }), serviceLd()],
  },
  {
    // L'area D dei servizi da vicino.
    path: informatica.path,
    priority: 0.8,
    title: informatica.title,
    description: informatica.description,
    render: informaticaPage,
    hideCta: true, // la pagina chiude già con il suo invito (telefono, WhatsApp, modulo)
    jsonld: () => [crumbs({ label: 'Servizi', href: '/servizi/' }, { label: 'Informatica', href: informatica.path }), ...informaticaLd()],
  },
  {
    // Come opero online: le tre copertine «Tutto protetto», quello che è già
    // acceso sul sito e i limiti. Sta sotto Servizi, ma si raggiunge anche dal
    // piè di pagina e dalla pagina Informatica.
    path: sicurezza.path,
    priority: 0.7,
    title: sicurezza.title,
    description: sicurezza.description,
    render: sicurezzaPage,
    jsonld: () => [crumbs({ label: 'Sicurezza', href: sicurezza.path }), ...sicurezzaLd()],
  },
  {
    path: '/studio/',
    priority: 0.8,
    title: 'Studio — chi sono e come lavoro',
    description: 'Alberto Pecchini: formazione tecnica, tre anni in un ufficio di strutture in legno, siti web e grafica. Come lavoro, cosa ho fatto e con quali strumenti.',
    render: studioPage,
    jsonld: () => [crumbs({ label: 'Studio', href: '/studio/' }), personLd()],
  },
  {
    // Il curriculum, all'indirizzo corto (3.11.2026): /cv/?print apre da solo la
    // finestra di stampa, senza testata né piè di pagina (chrome.js, initPrint).
    path: '/cv/',
    priority: 0.5,
    title: 'Curriculum vitae',
    description: 'Curriculum di Alberto Pecchini: formazione, esperienze, competenze tecniche, web e grafiche. La versione stampabile si apre da /cv/?print.',
    render: profiloPage,
    jsonld: () => [crumbs({ label: 'Studio', href: '/studio/' }, { label: 'Curriculum', href: '/cv/' })],
  },
  {
    // Lo stesso curriculum al vecchio indirizzo; il canonico è /cv/.
    path: '/studio/profilo/',
    canonical: '/cv/',
    priority: 0.3,
    title: 'Profilo e curriculum',
    description: 'Curriculum di Alberto Pecchini: formazione, esperienze, competenze tecniche, web e grafiche. Versione stampabile.',
    render: profiloPage,
    jsonld: () => [crumbs({ label: 'Studio', href: '/studio/' }, { label: 'Profilo', href: '/studio/profilo/' })],
  },
  {
    path: '/metodo/',
    priority: 0.7,
    title: 'Metodo — come lavoro, passo per passo',
    description: 'Ascolto, analisi, progettazione, sviluppo, revisione, consegna, assistenza: cosa succede in ogni fase, cosa ricevi e in quanto tempo.',
    render: metodoPage,
    jsonld: () => [crumbs({ label: 'Metodo', href: '/metodo/' })],
  },
  {
    path: '/contatti/',
    priority: 0.9,
    title: 'Contatti — scrivimi cosa ti serve',
    description: 'Scrivimi per un rilievo, una pratica, un sito web, un logo o un computer da sistemare. Rispondo entro un giorno lavorativo.',
    render: contattiPage,
    hideCta: true, // la pagina è già la chiamata all'azione: niente CTA che rimanda a sé stessa
    // Turnstile serve solo qui: lo script non viene caricato sulle altre pagine.
    head: site.form.turnstileSiteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>' : '',
    jsonld: () => [crumbs({ label: 'Contatti', href: '/contatti/' }), serviceLd()],
  },
  {
    path: '/stile/',
    priority: 0.4,
    title: 'Stile — come è fatto questo sito',
    description: 'Colore, tipografia, forma, movimento, componenti e mascotte del sito di Alberto Pecchini, in sei tavole su un piano navigabile: ingrandisci e spostati come su un tavolo da disegno.',
    render: stilePage,
    pageClass: 'page--stile',
    noFooter: true, // la pagina è il piano a tutto schermo: niente chiusura sotto
    jsonld: () => [crumbs({ label: 'Stile', href: '/stile/' })],
  },
  {
    // L'hero com'era (fino al 2.11.2026), con l'aragosta e l'inchiostro, su una
    // tavola del piano navigabile: lo stesso foglio di /stile/, una tavola sola.
    path: '/aragosta/',
    priority: 0.3,
    title: 'L’aragosta e l’inchiostro',
    description: 'L’apertura della home di Alberto Pecchini com’era fino al 2 novembre 2026, su un foglio da disegno navigabile: il nome a tutta larghezza e l’aragosta di fiume che lo riempie d’inchiostro.',
    render: aragostaPage,
    pageClass: 'page--stile',
    noFooter: true,
    jsonld: () => [crumbs({ label: 'L’aragosta', href: '/aragosta/' })],
  },
  {
    // La macchina del tempo (3.11.2026): tutte le versioni dei siti, una per giorno,
    // ricostruite e fotografate da tools/tempo/tempo.mjs. Qui l'archivio dei siti; sotto, una
    // pagina statica per sito e una per cattura (/tempo/<dominio>/<AAAA-MM-GG>/).
    // Dal 26.11.2026 con la testata, i caratteri e il piè di pagina di tutto il sito.
    path: '/tempo/',
    priority: 0.5,
    title: 'La macchina del tempo — i miei siti, giorno per giorno',
    description: 'Tutte le versioni dei siti di Alberto Pecchini, una per giorno di lavoro, ricostruite dal codice e fotografate: la pagina di quel giorno, l’istogramma dei commit, i numeri del giorno.',
    render: tempoPage,
    pageClass: 'page--tempo',
    jsonld: () => [crumbs({ label: 'La macchina del tempo', href: '/tempo/' })],
  },
  // le pagine dei siti e delle catture: fuori da sitemap e motori (le versioni vecchie dei siti
  // dei clienti non devono finire nelle ricerche al posto di quelli di oggi)
  ...tempoRotte().map((r) => ({ ...r, pageClass: 'page--tempo', noindex: true, sitemap: false })),
  {
    // Strumento privato: non è nei menu, nel footer, nella sitemap né nei motori
    // di ricerca (noindex + X-Robots-Tag in vercel.json). Si raggiunge solo dal
    // link diretto, che porta anche la chiave di accesso: /email/?k=…
    path: '/email/',
    title: 'Compositore email',
    description: 'Strumento privato per scrivere, controllare, migliorare con l’IA e copiare le email di Alberto Pecchini.',
    render: emailPage,
    pageClass: 'page--email',
    noindex: true,
    noFooter: true,
    hideCta: true,
  },
  {
    // Il Wrapped 5BT: le slide verticali con i dati della chat di classe.
    path: '/wrapped5BT/',
    title: 'Wrapped 5BT',
    description: 'Wrapped 5BT — quasi quattro anni della chat di classe, dal 2022 al 2026, raccontati con i numeri.',
    render: wrapped5btPage,
    pageClass: 'page--wrapped5bt',
    noindex: true,
    sitemap: false,
    noFooter: true,
    hideCta: true,
  },
  // Unimore: materie, blocchi ed esercizi, ancora senza contenuti → fuori da motori e sitemap.
  { path: unimore.path, title: unimore.title, description: unimore.description, render: unimorePage, noindex: true, sitemap: false, hideCta: true },
  ...unimore.materie.flatMap((m) => [
    { path: materiaPath(m), title: `${m.title} — Unimore`, description: m.lead, render: () => materiaPage(m), noindex: true, sitemap: false, hideCta: true },
    ...m.blocchi.flatMap((b) => [
      { path: bloccoPath(m, b), title: `${b.title} — ${m.title}`, description: b.lead, render: () => bloccoPage(m, b), noindex: true, sitemap: false, hideCta: true },
      ...b.esercizi.map((e) => ({ path: esercizioPath(m, b, e), title: `${e.title} · ${b.title} — ${m.title}`, description: b.lead, render: () => esercizioPage(m, b, e), noindex: true, sitemap: false, hideCta: true })),
    ]),
  ]),
  { path: '/privacy/', priority: 0.2, title: 'Informativa sulla privacy', description: 'Come tratto i dati di chi visita il sito o mi manda una richiesta.', render: privacyPage, hideCta: true },
  { path: '/cookie/', priority: 0.2, title: 'Cookie policy', description: 'Questo sito non usa cookie di profilazione. Ecco cosa salva nel browser e perché.', render: cookiePage, hideCta: true },
  { path: '/crediti/', priority: 0.2, title: 'Crediti e fonti delle immagini', description: 'Da dove vengono le immagini: disegni e foto miei, illustrazioni generate con gpt-image-2, mockup della Figma Community.', render: creditiPage, hideCta: true },
  {
    path: '/404/',
    file: '404.html',
    is404: true,
    title: 'Pagina non trovata (404)',
    description: 'La pagina che cercavi non c’è o è stata spostata. Torna alla home o apri il portfolio di Alberto Pecchini.',
    render: notFoundPage,
    headerTheme: 'ink',
    noindex: true,
    hideCta: true,
  },
]

// 12.11.2026 (Alberto: «togli social, numeri, indirizzi e luoghi»): fuori dal sito la macchina del
// tempo (le copie dei siti vecchi hanno numero, WhatsApp, Instagram e il paese). I file restano nel repository.
export const FUORI = () => false // la macchina del tempo è di nuovo online (riabilitata il 14.11.2026)
export const routes = tutteLeRotte.filter((r) => !FUORI(r.path))

/** Le rotte del sito. */
export const activeRoutes = routes

const normalize = (pathname) => {
  let p = pathname.replace(/index\.html$/, '')
  if (!p.endsWith('/') && !p.endsWith('.html')) p += '/'
  return p
}

/** Renderizza la pagina di un percorso. Restituisce { html, status }. */
export function renderRoute(pathname, { assets }) {
  const wanted = normalize(pathname)
  const route = activeRoutes.find((r) => r.path === wanted) || activeRoutes.find((r) => r.is404)
  const status = route.is404 ? 404 : 200
  // Le pagine autonome producono da sole l'intero documento.
  if (route.standalone) return { html: route.render({ route, assets }), status }
  const page = layout({
    route,
    title: route.title,
    description: route.description,
    body: route.render(),
    assets,
    jsonld: route.jsonld ? route.jsonld() : [],
    headerTheme: route.headerTheme,
    noindex: route.noindex,
    hideCta: route.hideCta,
    head: route.head,
    pageClass: route.pageClass || (route.is404 ? 'page--404' : route.path === '/' ? 'page--home' : undefined),
  })
  return { html: page, status }
}

export function renderSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes
    .filter((r) => !r.noindex && !r.devOnly && r.sitemap !== false)
    .map((r) => `  <url><loc>${abs(r.path)}</loc><lastmod>${today}</lastmod><priority>${r.priority ?? 0.5}</priority></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const renderRobots = () => `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${abs('/sitemap.xml')}\n`

export const placeholderReport = () => placeholders

// ── Miniature /art/<slug>.svg ────────────────────────────────────────────────
// Le copertine generate vengono esportate anche come file SVG autonomi, usati
// dalle anteprime al passaggio del puntatore (caricate solo quando servono).

const STANDALONE_FONTS = `:root{--font-sans:system-ui,-apple-system,'Segoe UI',sans-serif;--font-mono:'Cascadia Code',ui-monospace,'Cascadia Mono',Consolas,monospace;--font-serif:Georgia,'Times New Roman',serif}`

export function artFiles(css) {
  return projects
    .filter((p) => !(p.area === 'web' ? p.web?.desktop?.src : p.cover?.src))
    .map((p) => {
      const image = p.area === 'web' && p.web ? p.web.desktop : p.cover
      const { caption, ...spec } = image
      const svg = renderArt(spec).replace(/(<svg[^>]*>)/, `$1<style>${css}${STANDALONE_FONTS}</style>`)
      return { path: `/art/${p.slug}.svg`, body: svg }
    })
}
