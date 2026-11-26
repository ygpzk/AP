// Gli strumenti in bacheca (26.11.2026, pzkko: «fai questa zona stra animata e stra nel mio stile, animazione per cambio
// app, switch e transizione in base all'utilizzo; tu pensa alla grafica, DeepSeek pensa a UX»).
//
// Il comportamento è quello deciso da DeepSeek (design/strumenti-ux-deepseek.md): la cassetta degli attrezzi, con quello
// che pzkko ha in mano adesso. Il dato è la vetrina del pc (vetrina.js): l'app in primo piano dice lo strumento in uso,
// le altre app aperte dicono quelli aperti. La grafica è il muro: un foglio col nastro, i cartellini scritti a macchina,
// e quello in uso che vola nel riquadro «in mano», fermato dalla puntina rossa, col timbro e l'evidenziatore.
//
//   - il cambio vale solo se resta 600 ms (un alt-tab di passaggio non muove niente) e mai prima di 1,2 s dal precedente;
//   - l'ordine: in uso → aperti (dal più recente in mano, in questa visita) → gli altri, nell'ordine di config.js;
//   - mentre il puntatore o il fuoco sono su un cartellino non si sposta niente (al più per 5 secondi);
//   - lo stato della visita sta qui, non nella pagina: la bacheca si riscrive a ogni cambio di scheda, e al ritorno si
//     ridisegna la situazione assestata, senza rifare le animazioni.
import { TOOLS, PROJECTS } from './config.js'
import { ICONS } from './icons.js'
import { ascolta, vetrina, immagine } from './vetrina.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const CHIAVI = TOOLS.map(([, k]) => k)
const NOME = Object.fromEntries(TOOLS.map(([n, k]) => [k, n]))
const PROGETTI = Object.fromEntries(CHIAVI.map((k) => [k, PROJECTS.filter((p) => p.tags.some((t) => t[1] === k)).length]))
const ATTESA = 600, SOSTA = 1200, PAZIENZA = 5000, OGNI_ANNUNCIO = 3000

// le scritte: poche e corte, nelle nove lingue (non hanno una voce nei file i18n, come quelle della vetrina)
const TX = {
  it: { ora: 'in uso ora', aperto: 'aperto', piu: '+{n} aperti', via: 'non al pc ora', pc: 'sul pc', vuoto: 'niente in mano', prog: ['{n} progetto', '{n} progetti'] },
  en: { ora: 'using now', aperto: 'open', piu: '+{n} open', via: 'away from the pc', pc: 'at the pc', vuoto: 'hands free', prog: ['{n} project', '{n} projects'] },
  es: { ora: 'en uso ahora', aperto: 'abierto', piu: '+{n} abiertos', via: 'lejos del pc', pc: 'en el pc', vuoto: 'nada en la mano', prog: ['{n} proyecto', '{n} proyectos'] },
  fr: { ora: 'en cours', aperto: 'ouvert', piu: '+{n} ouverts', via: 'loin du pc', pc: 'sur le pc', vuoto: 'rien en main', prog: ['{n} projet', '{n} projets'] },
  de: { ora: 'gerade in Gebrauch', aperto: 'offen', piu: '+{n} offen', via: 'nicht am PC', pc: 'am PC', vuoto: 'nichts in der Hand', prog: ['{n} Projekt', '{n} Projekte'] },
  pt: { ora: 'em uso agora', aperto: 'aberto', piu: '+{n} abertos', via: 'longe do pc', pc: 'no pc', vuoto: 'nada na mão', prog: ['{n} projeto', '{n} projetos'] },
  ru: { ora: 'сейчас в работе', aperto: 'открыто', piu: '+{n} открыто', via: 'не за ПК', pc: 'за ПК', vuoto: 'руки свободны', prog: ['{n} проект', 'проектов: {n}'] },
  ja: { ora: '使用中', aperto: '起動中', piu: '+{n} 起動中', via: 'PCから離れています', pc: 'PCの前', vuoto: '手ぶら', prog: ['{n} プロジェクト', '{n} プロジェクト'] },
  zh: { ora: '正在使用', aperto: '已打开', piu: '+{n} 个已打开', via: '不在电脑前', pc: '在电脑前', vuoto: '手里没东西', prog: ['{n} 个项目', '{n} 个项目'] },
}
// a cosa gli serve ogni strumento: italiano e inglese (le altre lingue leggono l'inglese, come il banner della community)
const COSA = {
  html5: ['la struttura di ogni pagina', 'the bones of every page'],
  css: ['tutto lo stile, anche questo foglio', 'all the styling, this sheet included'],
  javascript: ['il linguaggio di quasi tutto quello che vedi qui', 'the language behind almost everything here'],
  typescript: ['JavaScript con i tipi, quando il progetto cresce', 'JavaScript with types, when a project grows'],
  react: ['interfacce a componenti', 'component-based interfaces'],
  nextjs: ['React quando servono rotte, rendering e un sito intero', 'React when it takes routes, rendering and a whole site'],
  astro: ['siti di contenuti che spediscono quasi zero JavaScript', 'content sites that ship almost no JavaScript'],
  svelte: ['interfacce compilate, senza virtual DOM', 'compiled interfaces, no virtual DOM'],
  tailwindcss: ['il motore di stile di questo sito', 'the styling engine of this site'],
  gsap: ['animazioni che non scattano', 'animations that never stutter'],
  nodejs: ['server, script e raccoglitori', 'servers, scripts and collectors'],
  bun: ['un runtime solo per installare, provare e impacchettare', 'one runtime to install, test and bundle'],
  vite: ['sviluppo e build in un attimo', 'dev server and builds in a blink'],
  csharp: ['i programmi per Windows', 'the Windows programs'],
  rust: ['velocità e sicurezza per i tool che non devono fallire', 'speed and safety for tools that must not fail'],
  python: ['script, dati e modelli in locale', 'scripts, data and local models'],
  powershell: ['le automazioni su Windows', 'Windows automation'],
  threejs: ['il 3D nel browser, come il cercapersone', '3D in the browser, like the pager'],
  babylonjs: ['il 3D della casa di Diretta OS', 'the 3D house of Diretta OS'],
  webgpu: ['la scheda grafica dal browser, calcolo e 3D', 'the graphics card from the browser, compute and 3D'],
  webassembly: ['codice quasi nativo dentro la pagina', 'near-native code inside the page'],
  claude: ['il compagno di codice', 'the coding partner'],
  ollama: ['modelli in locale, senza cloud', 'local models, no cloud'],
  autocad: ['il disegno tecnico', 'technical drawing'],
  cadwork: ['la modellazione 3D delle strutture in legno', '3D modelling of timber structures'],
  archicad: ['il BIM di edifici e pratiche', 'BIM for buildings and paperwork'],
  qgis: ['mappe, dati e analisi del territorio', 'maps, data and land analysis'],
  cloudcompare: ['confronto e pulizia delle nuvole di punti', 'point cloud comparison and clean-up'],
  metashape: ['fotogrammetria, dal rilievo al modello 3D', 'photogrammetry, from survey to 3D model'],
  pregeo: ['rilievo catastale e dichiarazioni Docfa', 'cadastral surveys and Docfa filings'],
  blender: ['modelli, render e asset 3D', 'models, renders and 3D assets'],
  figma: ['bozze e interfacce', 'mockups and interfaces'],
  illustrator: ['logo, tracciati e grafica vettoriale', 'logos, paths and vector graphics'],
  indesign: ['impaginazione di documenti e brochure', 'layouts for documents and brochures'],
  photoshop: ['fotoritocco e immagini per il web', 'photo editing and web images'],
  davinciresolve: ['montaggio e color correction dei video', 'video editing and colour grading'],
  ffmpeg: ['tagli, conversioni e montaggi video', 'cutting, converting and editing video'],
  obs: ['la regia dal vivo di Diretta OS', 'the live control room of Diretta OS'],
  docker: ['lo stesso ambiente ovunque', 'the same environment everywhere'],
  postgresql: ['dati relazionali che restano', 'relational data that stays'],
  vercel: ['dove pubblico i siti', 'where the sites go live'],
  git: ['la storia di ogni progetto', 'the history of every project'],
}
// Quando il pc non dice lo strumento (il campo `str` di un'app), vale il nome dell'app: l'app che è lo strumento, e
// l'editor che per DeepSeek vale JavaScript (è il linguaggio di quasi tutti i progetti).
const PER_NOME = [
  [/^visual studio code\b|^vs ?code\b|^code$/i, 'javascript'],
  [/autocad/i, 'autocad'], [/^cadwork/i, 'cadwork'], [/^archicad/i, 'archicad'], [/^qgis/i, 'qgis'],
  [/^cloudcompare/i, 'cloudcompare'], [/^agisoft|^metashape/i, 'metashape'], [/^pregeo|^docfa/i, 'pregeo'],
  [/^figma\b/i, 'figma'], [/^blender\b/i, 'blender'], [/^obs\b/i, 'obs'], [/^docker\b/i, 'docker'],
  [/^adobe illustrator|^illustrator/i, 'illustrator'], [/^adobe indesign|^indesign/i, 'indesign'],
  [/^adobe photoshop|^photoshop/i, 'photoshop'], [/^davinci resolve|^resolve/i, 'davinciresolve'],
  [/^claude\b/i, 'claude'], [/^ollama\b/i, 'ollama'], [/powershell/i, 'powershell'], [/^pgadmin/i, 'postgresql'],
  [/^github desktop\b/i, 'git'], [/^visual studio\b/i, 'csharp'],
]

// ── lo stato della visita ──
const VUOTO = { acceso: false, luogo: null, su: null, app: null, aperti: [] }
const S = { mostrato: null, voluto: null, volutoDal: 0, cambiato: 0, visto: new Map(), timer: null, inVolo: false, entrata: false }
let radice = null, opz = null, annuncio = { alle: 0, fra: null }, rigaFra = null

const tx = () => TX[opz?.lang] || TX.en
const cosa = (k) => COSA[k]?.[opz?.lang === 'it' ? 0 : 1] || ''
const progetti = (k) => { const n = PROGETTI[k] || 0; return n ? tx().prog[n === 1 ? 0 : 1].replace('{n}', n) : '' }
const fermo = () => matchMedia('(prefers-reduced-motion: reduce)').matches
// (l'inclinazione di ogni cartellino: sempre la stessa per lo stesso strumento)
const storto = (k) => { let h = 7; for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 997; return ((h % 33) / 10 - 1.6).toFixed(1) }

/** Dalla vetrina: cosa è in uso, con quale app, cosa è aperto. */
function leggi(d) {
  const app = Array.isArray(d?.app) ? d.app : []
  // (vale solo una chiave che sta in TOOLS: la lista cresce in config.js, e questa scheda la segue)
  const di = (a) => { const k = CHIAVI.includes(a.str) ? a.str : PER_NOME.find(([re]) => re.test(a.n))?.[1]; return CHIAVI.includes(k) ? k : null }
  const davanti = app.find((a) => a.su)
  const su = davanti ? di(davanti) : null
  const aperti = [...new Set(app.map(di).filter((k) => k && k !== su))]
  // (l'app si scrive sotto il nome solo se dice qualcosa in più: «Figma» sotto «figma» no)
  const stessa = su && davanti.n.toLowerCase().includes(NOME[su].toLowerCase().replace(/ (code|studio|css)$/, ''))
  return { acceso: app.length > 0, luogo: d?.luogo || null, su, app: su && !stessa ? { n: davanti.n, i: davanti.i || null } : null, aperti }
}
const firma = (m) => (m ? [m.acceso, m.luogo, m.su, m.app?.n, [...m.aperti].sort()].join('|') : '')
function ordine(m) {
  const aperti = [...m.aperti].sort((a, b) => (S.visto.get(b) || 0) - (S.visto.get(a) || 0) || CHIAVI.indexOf(a) - CHIAVI.indexOf(b))
  const primi = [m.su, ...aperti].filter(Boolean)
  return [...primi, ...CHIAVI.filter((k) => !primi.includes(k))]
}
function voce(m) {
  const t = tx(), piu = m.aperti.length ? ` · ${t.piu.replace('{n}', m.aperti.length)}` : ''
  if (m.su) return `${t.ora}: ${NOME[m.su]}${piu}`
  if (!m.acceso) return t.via
  return `${t.pc}${m.luogo && opz.luogo?.(m.luogo) ? ` · ${opz.luogo(m.luogo)}` : ''}${piu}`
}
const stato = (m, k) => (k === m.su ? 'su' : m.aperti.includes(k) ? 'aperto' : '')
const etichetta = (m, k) => [NOME[k], stato(m, k) === 'su' ? tx().ora : stato(m, k) === 'aperto' ? tx().aperto : '', progetti(k)].filter(Boolean).join(', ')
const legenda = () => `<i class="st__seg st__seg--pin"></i>${esc(tx().ora)}<i class="st__seg st__seg--punto"></i>${esc(tx().aperto)}`
const dettaglio = (m, k) => `<b>${esc(NOME[k])}</b>${[cosa(k), stato(m, k) === 'su' ? tx().ora : stato(m, k) === 'aperto' ? tx().aperto : ''].filter(Boolean).map((s) => ` · ${esc(s)}`).join('')}${PROGETTI[k] ? ` · <u>${esc(progetti(k))} →</u>` : ''}`

// ── i pezzi ──
const cartellino = (m, k, n) => `<button type="button" class="st__t${stato(m, k) ? ` is-${stato(m, k)}` : ''}" data-k="${k}" style="--r:${storto(k)}deg;--c:#${ICONS[k]?.[0] || '888888'};--n:${n}" aria-label="${esc(etichetta(m, k))}">${opz.brand(k) || '<i class="st__pallino"></i>'}<span class="st__n">${esc(NOME[k])}</span>${k === m.su ? inMano(m) : ''}</button>`
const appHtml = (a) => (a ? `${a.i ? `<img src="${esc(immagine(a.i))}" alt="" width="16" height="16" draggable="false">` : ''}${esc(a.n)}` : '')
const inMano = (m) => `${m.app ? `<span class="st__app" aria-hidden="true">${appHtml(m.app)}</span>` : ''}<span class="st__timbro" aria-hidden="true">${esc(tx().ora)}</span><i class="st__pin" aria-hidden="true"></i>`
const $ = (s) => radice?.querySelector(s)
const pezzo = (k) => (k ? radice?.querySelector(`.st__t[data-k="${k}"]`) : null)

/** Tutto da capo, nella situazione assestata (all'inizio, e ogni volta che la bacheca si riscrive). */
function disegna() {
  const m = S.mostrato || VUOTO
  radice.classList.toggle('st--via', !m.acceso)
  radice.innerHTML = `<header class="st__h"><h2>${esc(opz.titolo)}</h2><p class="st__voce" aria-hidden="true">${esc(voce(m))}</p><span class="sr" role="status" aria-live="polite"></span></header>
    <div class="st__banco${m.su ? ' ha-su' : ''}" role="group" aria-label="${esc(opz.titolo)}"><span class="st__mano" aria-hidden="true"><span>${esc(m.acceso ? tx().vuoto : tx().via)}</span></span>${ordine(m).map((k, n) => cartellino(m, k, n)).join(' ')} <p class="st__riga" aria-hidden="true">${legenda()}</p></div>`
}

// ── la riga in fondo al foglio: la legenda, o lo strumento sotto il puntatore ──
function riga(k, resta = 0) {
  clearTimeout(rigaFra)
  const r = $('.st__riga')
  if (!r) return
  r.innerHTML = k ? dettaglio(S.mostrato || VUOTO, k) : legenda()
  r.classList.toggle('is-detto', !!k)
  if (k && resta) rigaFra = setTimeout(() => riga(null), resta)
}
// (i lettori di schermo: solo il cambio dello strumento in uso, al più una volta ogni tre secondi)
function annuncia(testo) {
  clearTimeout(annuncio.fra)
  const fra = Math.max(0, OGNI_ANNUNCIO - (Date.now() - annuncio.alle))
  annuncio.fra = setTimeout(() => { const s = $('[role=status]'); if (s) { s.textContent = testo; annuncio.alle = Date.now() } }, fra)
}
function scrivi(testo) {
  const v = $('.st__voce')
  if (!v || v.textContent === testo) return
  v.textContent = testo
  v.classList.remove('is-scrive')
  void v.offsetWidth
  v.classList.add('is-scrive')
}

// ── il cambio: chi esce, chi entra, chi si sposta ──
const occupato = () => !!radice?.querySelector('.st__t:hover, .st__t:focus-visible')
function programma() {
  clearTimeout(S.timer)
  if (!S.voluto || firma(S.voluto) === firma(S.mostrato)) return
  const ora = Date.now()
  let fra = ATTESA - (ora - S.volutoDal)
  if (S.voluto.su !== S.mostrato?.su) fra = Math.max(fra, SOSTA - (ora - S.cambiato))
  if (S.inVolo) fra = Math.max(fra, 200)
  if (fra <= 0 && occupato() && ora - S.volutoDal < ATTESA + PAZIENZA) fra = 250
  if (fra > 0) { S.timer = setTimeout(programma, fra); return }
  applica()
}
function applica() {
  const da = S.mostrato, a = S.voluto, ora = Date.now()
  if (a.su !== da?.su) { S.cambiato = ora; if (da?.su) S.visto.set(da.su, ora); if (a.su) S.visto.set(a.su, ora + 1) }
  S.mostrato = a
  if (!radice?.isConnected) return
  if (!da) { disegna(); return }
  if (a.su !== da.su) annuncia(voce(a))
  const animato = !fermo() && !document.hidden
  const vecchio = da.su !== a.su ? pezzo(da.su) : null
  if (!animato || !vecchio) { muta(da, a, animato); return }
  // 1. esce: quello in mano si spegne dov'è (la puntina si alza, il timbro si stacca, l'evidenziatore si ritira)
  S.inVolo = true
  vecchio.classList.add('is-via')
  setTimeout(() => muta(da, a, true), 120)
}
/** I cartellini cambiano stato e posto; con `animato` ognuno parte da dov'era (FLIP). */
function muta(da, a, animato) {
  const banco = $('.st__banco')
  if (!radice?.isConnected || !banco) { S.inVolo = false; return }
  const tutti = [...banco.querySelectorAll('.st__t')]
  const dove = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top, h: el.offsetHeight } }
  const prima = animato ? new Map(tutti.map((el) => [el, dove(el)])) : null
  const cambio = da.su !== a.su, vecchio = cambio ? pezzo(da.su) : null, nuovo = cambio ? pezzo(a.su) : null

  radice.classList.toggle('st--via', !a.acceso)
  banco.classList.toggle('ha-su', !!a.su)
  banco.querySelector('.st__mano span').textContent = a.acceso ? tx().vuoto : tx().via
  if (vecchio) { vecchio.classList.remove('is-su', 'is-via', 'is-colpo', 'is-arrivo'); for (const x of vecchio.querySelectorAll('.st__app, .st__timbro, .st__pin')) x.remove() }
  if (nuovo) { nuovo.classList.add('is-su'); if (animato) nuovo.classList.add('is-arrivo'); nuovo.insertAdjacentHTML('beforeend', inMano(a)) }
  for (const el of tutti) {
    const k = el.dataset.k
    el.classList.toggle('is-aperto', a.aperti.includes(k))
    el.setAttribute('aria-label', etichetta(a, k))
  }
  // (stesso strumento, altra app: gira solo il biglietto dell'app)
  if (!cambio && a.su && da.app?.n !== a.app?.n) {
    const p = pezzo(a.su)
    p?.querySelector('.st__app')?.remove()
    if (a.app) p?.querySelector('.st__n')?.insertAdjacentHTML('afterend', `<span class="st__app" aria-hidden="true">${appHtml(a.app)}</span>`)
    const b = p?.querySelector('.st__app')
    if (b) { if (animato) b.animate([{ transform: 'rotateX(90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2, 1.4, .4, 1)' }) }
  }
  const ord = ordine(a), ora = tutti.map((el) => el.dataset.k)
  if (ord.join() !== ora.join()) {
    const fuoco = document.activeElement, coda = banco.querySelector('.st__riga')
    // (tra un cartellino e l'altro resta uno spazio: è lì che la riga va a capo e si giustifica)
    for (const n of [...banco.childNodes]) if (n.nodeType === 3) n.remove()
    for (const k of ord) banco.insertBefore(pezzo(k), coda).after(' ')
    if (fuoco && banco.contains(fuoco) && document.activeElement !== fuoco) fuoco.focus({ preventScroll: true })
  }
  scrivi(voce(a))
  if (!$('.st__riga')?.classList.contains('is-detto')) riga(null)
  if (!animato) { S.inVolo = false; return }

  // 2. entra e 3. si assesta: il nuovo vola nel riquadro, il vecchio torna al suo posto, gli altri ricadono
  S.inVolo = true
  let fine = 0
  for (const el of tutti) {
    const p = prima.get(el), d = dove(el)
    const dx = p.x - d.x, dy = p.y - d.y, s = p.h / d.h
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < 0.02) continue
    const primo = el === nuovo || el === vecchio
    const opt = primo
      ? { duration: 300, easing: el === nuovo ? 'cubic-bezier(.2, 1.25, .35, 1)' : 'cubic-bezier(.3, .9, .3, 1)' }
      : { duration: 240, delay: cambio ? 140 : 0, easing: 'cubic-bezier(.2, 1.2, .4, 1)', fill: 'backwards' }
    el.classList.add('is-volo')
    // (i due che si scambiano il posto volano un po' storti, come un foglio preso in mano)
    const giro = el === nuovo ? ' rotate(-5deg)' : el === vecchio ? ' rotate(4deg)' : ''
    const anim = el.animate([{ transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(3)})${giro}` }, { transform: 'none' }], opt)
    anim.finished.catch(() => {}).then(() => el.classList.remove('is-volo'))
    fine = Math.max(fine, opt.duration + (opt.delay || 0))
  }
  // la puntina arriva quando il cartellino è nel riquadro: il colpo, il timbro, l'evidenziatore
  const posa = nuovo ? 230 : 0
  if (nuovo) setTimeout(() => {
    if (!nuovo.isConnected) return
    nuovo.classList.remove('is-arrivo')
    nuovo.classList.add('is-colpo')
    banco.animate([{ transform: 'none' }, { transform: 'translateY(2.5px) rotate(-.15deg)', offset: 0.35 }, { transform: 'none' }], { duration: 190, delay: 130, easing: 'ease-out' })
    setTimeout(() => nuovo.classList.remove('is-colpo'), 900)
  }, posa)
  setTimeout(() => { S.inVolo = false }, Math.max(fine, posa + 200))
}

// ── la vetrina: ogni dato nuovo è un desiderio, che vale se resta ──
ascolta((d) => {
  const n = leggi(d)
  if (firma(n) === firma(S.voluto)) return
  S.voluto = n
  S.volutoDal = Date.now()
  if (!S.mostrato) { applica(); return }
  programma()
})

/**
 * Monta la scheda in `el` (ogni volta che la bacheca si riscrive).
 * opz: { lang, titolo, brand(chiave) → svg, luogo(chiave) → testo, vai(chiave) → apre i progetti con quello strumento }
 */
export function monta(el, o) {
  radice = el
  opz = o
  if (!S.mostrato && vetrina()) { S.voluto = leggi(vetrina()); S.mostrato = S.voluto }
  disegna()
  // la prima volta i cartellini si posano uno dopo l'altro, quando il foglio entra nello schermo
  if (!S.entrata && !fermo() && 'IntersectionObserver' in window) {
    el.classList.add('st--attesa')
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return
      io.disconnect()
      S.entrata = true
      el.classList.replace('st--attesa', 'st--entra')
      setTimeout(() => el.classList.remove('st--entra'), 1600)
    }, { threshold: 0.2 })
    io.observe(el)
  } else S.entrata = true

  el.addEventListener('click', (e) => {
    const b = e.target.closest('.st__t')
    if (!b) return
    const k = b.dataset.k
    if (PROGETTI[k]) o.vai?.(k)
    else riga(k, 4000)
  })
  const sopra = (e) => { const b = e.target.closest?.('.st__t'); if (b) riga(b.dataset.k) }
  const fuori = (e) => { if (e.target.closest?.('.st__t') && !e.relatedTarget?.closest?.('.st__t')) { clearTimeout(rigaFra); rigaFra = setTimeout(() => riga(null), 180) } }
  el.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') sopra(e) })
  el.addEventListener('pointerout', fuori)
  el.addEventListener('focusin', sopra)
  el.addEventListener('focusout', fuori)
  programma()
}

// Per le prove: import('/assets/strumenti.js').then((m) => m.prova({ app: [{ n: 'Figma', su: true }], luogo: 'ufficio' }))
export function prova(d, subito = false) {
  S.voluto = leggi(d)
  S.volutoDal = Date.now() - (subito ? ATTESA + SOSTA : 0)
  if (subito) S.cambiato = 0
  programma()
}
