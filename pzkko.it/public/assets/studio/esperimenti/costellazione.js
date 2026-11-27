// 06 · Costellazione. I progetti del sito come stelle su una vecchia carta celeste: due progetti si tengono per mano
// quando condividono una tecnologia. I gruppi piccoli diventano costellazioni con un nome e una figura (la Grande
// Chiocciola, il Salvadanaio…), JavaScript è così grande che diventa la Via Lattea, chi non condivide niente è un
// pianeta errante. Si trascinano, si esplorano con le frecce e si aprono con un clic o con Invio. Canvas 2D, senza
// librerie; la fisica si assesta prima di disegnare e poi si muove solo quando qualcuno tira una stella.
import { PROJECTS } from '../../config.js'
import { esc, semi, caso } from '../utils.js'
import { mescola, luminanza, rgbDi } from '../colori.js'

const T = {
  it: {
    nota: 'Ogni filo è una tecnologia in comune. Trascina le stelle, passa sopra per il nome, frecce per spostarti, clic o Invio per aprire il progetto.',
    etichetta: 'Carta celeste dei progetti: ogni stella è un progetto, ogni filo una tecnologia in comune. Frecce per spostarti tra le stelle, Invio per aprire.',
    fili: (n, m) => `${n} progetti · ${m} fili`,
    apri: 'clic o Invio: apri ↗',
    apriTocco: 'tocca ancora per aprire ↗',
    nFili: (n) => (n === 1 ? '1 filo' : `${n} fili`),
    titolo: 'Carta del Cielo',
    sotto: 'di pzkko · anno MMXXVI',
    scala: 'scala: 1 cm = 1 notte insonne',
    eclittica: 'eclittica (circa)',
    timbro: 'Osservatorio pzk · visto',
    chi: 'L’astronoma dice',
    oroscopo: (c) => `Oroscopo · ${c}`,
    battuta: 'Un’altra battuta dell’astronoma',
    sr: (n, k, c, f) => `${n}, ${k}. ${c}. ${f}. Invio per aprire.`,
    battute: [
      'Ho contato le stelle: 32. Nessuna mi presta cinque euro.',
      'La Grande Chiocciola sono io. Ritratto fedele, un filo ingrassato.',
      'JavaScript non è una costellazione: è il cielo.',
      'Trascinami una stella qui vicino, che mi fa luce.',
      'Ho chiesto a un pianeta errante di uscire. Ha detto che fa da solo.',
      'Il telescopio l’ho trovato al mercato. La lente è un fondo di bottiglia.',
    ],
  },
  en: {
    nota: 'Every thread is a shared technology. Drag the stars, hover for the name, arrows to move, click or press Enter to open the project.',
    etichetta: 'Star chart of the projects: every star is a project, every thread a shared technology. Arrows move between stars, Enter opens one.',
    fili: (n, m) => `${n} projects · ${m} threads`,
    apri: 'click or Enter: open ↗',
    apriTocco: 'tap again to open ↗',
    nFili: (n) => (n === 1 ? '1 thread' : `${n} threads`),
    titolo: 'Chart of the Sky',
    sotto: 'by pzkko · year MMXXVI',
    scala: 'scale: 1 cm = 1 sleepless night',
    eclittica: 'ecliptic (roughly)',
    timbro: 'pzk observatory · ok',
    chi: 'The astronomer says',
    oroscopo: (c) => `Horoscope · ${c}`,
    battuta: 'Another joke from the astronomer',
    sr: (n, k, c, f) => `${n}, ${k}. ${c}. ${f}. Press Enter to open.`,
    battute: [
      'I counted the stars: 32. Not one will lend me five euros.',
      'The Great Snail is me. A faithful portrait, a little chubbier.',
      'JavaScript is not a constellation: it is the sky.',
      'Drag a star over here, I need the light.',
      'I asked a wandering planet out. It said it works alone.',
      'Got the telescope at the flea market. The lens is a bottle bottom.',
    ],
  },
}
const t = (lang, k, ...a) => {
  const v = (T[lang] || T.en)[k] ?? T.en[k]
  return typeof v === 'function' ? v(...a) : v
}
const KIND = { it: { game: 'gioco', tool: 'programma', site: 'sito' }, en: { game: 'game', tool: 'tool', site: 'site' } }
const kind = (lang, k) => (KIND[lang] || KIND.en)[k] || k

// Le costellazioni con un nome: la chiave è la tecnologia che le tiene insieme. Una tecnologia nuova senza nome qui
// diventa «la costellazione di …» da sola, senza figura.
const COST = {
  'LCD 8-bit': { fig: 'chiocciola', it: 'la Grande Chiocciola', en: 'the Great Snail', lat: 'COCHLEA MAIOR',
    oro: { it: 'Lenti ma costanti. Evitate il sale.', en: 'Slow but steady. Avoid salt.' } },
  $pzk: { fig: 'porcello', it: 'il Salvadanaio', en: 'the Piggy Bank', lat: 'PORCELLUS NUMMARIUS',
    oro: { it: 'Entrate in $pzk, uscite in euro veri.', en: 'Income in $pzk, expenses in real euros.' } },
  'Web Audio': { fig: 'lira', it: 'la Lira Elettrica', en: 'the Electric Lyre', lat: 'LYRA VOLTAICA',
    oro: { it: 'I vicini bussano alle 23. Alzate il volume.', en: 'Neighbours knock at 11 pm. Turn it up.' } },
  'C#': { fig: 'finestra', it: 'la Finestra Maggiore', en: 'the Greater Window', lat: 'FENESTRA MAIOR',
    oro: { it: 'Aggiornamento obbligatorio in arrivo. Non spegnete.', en: 'Mandatory update incoming. Do not switch off.' } },
  'three.js': { fig: 'cubi', it: 'i Gemelli Poligonali', en: 'the Polygon Twins', lat: 'GEMINI POLYGONALES',
    oro: { it: 'Vedete tutto in 3D, anche i problemi.', en: 'You see everything in 3D, problems included.' } },
  HTML: { fig: 'serranda', it: 'la Saracinesca', en: 'the Roller Shutter', lat: 'SERRANDA MURALIS',
    oro: { it: 'Alzatevi presto, ma non prima della serranda.', en: 'Get up early, but not before the shutter.' } },
  'Node.js': { fig: 'nodo', it: 'il Nodo', en: 'the Knot', lat: 'NODUS MODULORUM',
    oro: { it: 'node_modules pesa più di voi. Accettatelo.', en: 'node_modules weighs more than you. Accept it.' } },
  SVG: { fig: 'compasso', it: 'il Compasso', en: 'the Drafting Compass', lat: 'CIRCINUS',
    oro: { it: 'Giornata ad angolo retto. Niente curve.', en: 'A right-angled day. No curves.' } },
  Sensori: { fig: 'antenna', it: 'l’Antenna', en: 'the Antenna', lat: 'ANTENNA SENSIBILIS',
    oro: { it: 'Sentite tutto. Anche quello che non dovreste.', en: 'You sense everything. Even what you shouldn’t.' } },
  Canvas: { fig: 'clessidra', it: 'la Clessidra', en: 'the Hourglass', lat: 'CLEPSYDRA',
    oro: { it: 'Il tempo scorre. La sabbia pure.', en: 'Time flows. So does the sand.' } },
}
const VIA = {
  it: 'Via JavaScript', en: 'the JavaScript Way', lat: 'VIA SCRIPTORIA',
  oro: { it: 'undefined. Riprovate domani.', en: 'undefined. Try again tomorrow.' },
}
const PIANETA = {
  it: 'pianeta errante: nessuna tecnologia in comune', en: 'wandering planet: shares no technology',
  nome: { it: 'i Pianeti Erranti', en: 'the Wandering Planets' },
  oro: { it: 'Fate da soli. Vi riesce benissimo.', en: 'Go solo. You are great at it.' },
}
const GRAV = 2.5, MOLLA = 2.6 // la fisica: quanto tira il centro, quanto tirano i fili
const NEBULOSA = 9 //un gruppo più grande di così non è una costellazione: è la Via Lattea

// Le figure delle costellazioni, disegnate a tratto in un quadrato 100 × 100 (dati di un path SVG, per Path2D).
const FIGURE = {
  chiocciola: 'M6 80 Q40 73 94 78 M20 78 C12 70 12 52 22 46 C30 42 37 50 35 60 L38 74 M22 46 L14 24 M30 45 L36 22 '
    + 'M11 24 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M33 22 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M20 60 q5 4 10 0 '
    + 'M88 52 a24 24 0 1 1 -48 0 a24 24 0 1 1 48 0 M64 52 a4 4 0 1 1 4 4 a9 9 0 1 1 -10 -10 a15 15 0 1 1 16 16',
  porcello: 'M22 56 a30 22 0 1 0 60 0 a30 22 0 1 0 -60 0 M82 50 h8 v12 h-8 M58 36 l6 -10 l6 12 M44 34 h14 '
    + 'M32 74 v12 M44 77 v10 M62 77 v10 M74 72 v12 M22 52 q-10 -2 -8 -10 q2 -4 5 0 M45 18 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
  lira: 'M30 16 C14 40 22 70 50 84 C78 70 86 40 70 16 M30 16 c-6 -6 -14 0 -8 6 M70 16 c6 -6 14 0 8 6 M28 28 H72 '
    + 'M38 28 V74 M46 28 V79 M54 28 V79 M62 28 V74 M34 76 H66 M90 26 l-8 13 h7 l-8 14',
  finestra: 'M18 14 H82 V86 H18 Z M50 14 V86 M18 50 H82 M10 86 H90 M18 14 Q36 40 26 86 M82 14 Q64 40 74 86',
  cubi: 'M8 46 H36 V74 H8 Z M8 46 L20 34 H48 L36 46 M48 34 V62 L36 74 M52 38 H80 V66 H52 Z M52 38 L64 26 H92 L80 38 M92 26 V54 L80 66',
  serranda: 'M10 18 H90 M14 18 V84 M86 18 V84 M14 28 H86 M14 36 H86 M14 44 H86 M14 52 H86 M14 60 H86 M14 68 H86 M14 76 H86 '
    + 'M44 84 V79 H56 V84 M24 46 q8 -10 14 0 t14 0 t14 0',
  nodo: 'M12 50 C12 20 50 20 50 50 C50 80 88 80 88 50 C88 20 50 20 50 50 C50 80 12 80 12 50 Z',
  compasso: 'M45 12 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M50 17 L28 86 M50 17 L72 86 M36 60 Q50 54 64 60 M14 90 Q50 62 86 90',
  antenna: 'M50 92 V30 M36 92 H64 M46 30 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M60 22 a12 12 0 0 1 0 16 M66 15 a20 20 0 0 1 0 30 '
    + 'M40 22 a12 12 0 0 0 0 16 M34 15 a20 20 0 0 0 0 30',
  clessidra: 'M26 12 H74 M26 88 H74 M32 12 C32 38 48 44 48 50 C48 56 32 62 32 88 M68 12 C68 38 52 44 52 50 C52 56 68 62 68 88 '
    + 'M40 82 Q50 70 60 82 M50 54 V72',
}

// la carta: blu di Prussia, inchiostro d'oro, il rosso dei timbri
const CARTA = { fondo1: '#16264a', fondo2: '#0a1228', oro: '#e2c27a', crema: '#f3e6c4', rosso: '#ff6a4d' }
// la spirale del guscio dell'astronoma: una spirale di Archimede vera, non quattro archi in fila
const SPIRALE = (() => {
  const giri = 4.4 * Math.PI, punti = []
  for (let i = 0; i <= 90; i++) {
    const a = (i / 90) * giri, r = 1.5 + 24.5 * (a / giri)
    punti.push(`${(88 + Math.cos(a + 2.2) * r).toFixed(1)} ${(62 + Math.sin(a + 2.2) * r).toFixed(1)}`)
  }
  return `M${punti.join(' L')}`
})()
const rgba = (hex, a) => { const [r, g, b] = rgbDi(hex); return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})` }
const limita = (n, a, b) => Math.max(a, Math.min(b, n))

export default {
  id: 'costellazione',
  titolo: { it: 'Costellazione', en: 'Constellation' },
  testo: {
    it: 'Tutti i progetti in una mappa: le stelle vicine condividono una tecnologia, i fili lo dicono. Si trascina, si guarda e si apre.',
    en: 'All projects on one map: nearby stars share a technology, the threads say which. Drag them, look around and open one.',
  },
  tecnologie: ['Canvas 2D', 'Force layout', 'Pointer Events'],
  monta(el, api) {
    const lang = api.lang
    const L = (o) => (o ? o[lang] ?? o.en : '')
    const battute = t(lang, 'battute')
    el.innerHTML = `<div class="lab-cost">
      <div class="lab-cost__carta">
        <canvas class="lab-cost__tela" tabindex="0" role="application" aria-label="${esc(t(lang, 'etichetta'))}"></canvas>
        <span class="lab-cost__meteora" aria-hidden="true"></span>
        <span class="lab-cost__timbro" aria-hidden="true">${esc(t(lang, 'timbro'))}</span>
        <div class="lab-cost__tip" hidden></div>
      </div>
      <div class="lab-cost__piede">
        <button type="button" class="lab-cost__astronoma" title="${esc(t(lang, 'battuta'))}">
          <span class="lab-cost__postit"><b class="lab-cost__chi">${esc(t(lang, 'chi'))}</b><span class="lab-cost__frase">${esc(battute[0])}</span></span>
          <svg class="lab-cost__lumaca" viewBox="0 0 140 100" aria-hidden="true">
            <ellipse cx="78" cy="96" rx="58" ry="4" fill="rgba(40,30,10,.2)"/>
            <g class="lab-cost__cannocchiale">
              <path d="M12.5 15 L0 95 M12.5 15 L16 95 M12.5 15 L-8 92" stroke="#3a2a08" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M23 24.5 L3.9 -3.6 L-3.3 1.8 L19 27.5 Z" fill="#c9a227" stroke="#3a2a08" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M17.4 16.1 L12.4 20 M10.6 6.3 L4.6 10.9" stroke="#3a2a08" stroke-width="2.2"/>
              <path d="M3.9 -3.6 L2.85 -6.65 L-5.85 0.05 L-3.3 1.8 Z" fill="#f0d68f" stroke="#3a2a08" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M8 4 L18 18" stroke="rgba(255,255,255,.55)" stroke-width="1.4" stroke-linecap="round"/>
            </g>
            <path d="M20 93 Q70 84 132 90 Q138 94 128 96.5 Q70 99.5 20 96.5 Z" fill="#2c6e91" stroke="#123448" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M30 95 C15 87 15 61 28 53 C38 47 49 55 47 67 L51 89 Z" fill="#2c6e91" stroke="#123448" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M31 53 L22 31 M41 52 L46 31" stroke="#123448" stroke-width="2.6" stroke-linecap="round" fill="none"/>
            <circle cx="22" cy="29" r="4" fill="#f3e6c4" stroke="#123448" stroke-width="1.4"/>
            <circle cx="46.5" cy="29" r="4" fill="#f3e6c4" stroke="#123448" stroke-width="1.4"/>
            <circle cx="20.6" cy="27.8" r="1.6" fill="#123448"/><circle cx="45.3" cy="28" r="1.6" fill="#123448"/>
            <path d="M23 72 q6 6 13 0" stroke="#123448" stroke-width="1.7" fill="none" stroke-linecap="round"/>
            <circle cx="22" cy="66" r="2.6" fill="#e8501c" opacity=".55"/>
            <path d="M26 56 L46 52.5 L44 33 Z" fill="#1446a0" stroke="#0a1f4d" stroke-width="1.4" stroke-linejoin="round"/>
            <ellipse cx="36" cy="54.5" rx="12" ry="2.6" transform="rotate(-10 36 54.5)" fill="#1446a0" stroke="#0a1f4d" stroke-width="1.4"/>
            <path d="M38 44 l1 2 2 .2 -1.6 1.3 .6 2 -2-1.1 -2 1.1 .6-2 -1.6-1.3 2-.2Z M42.5 39 l.6 1.2 1.3 .1 -1 .8 .4 1.3 -1.3-.7 -1.2 .7 .4-1.3 -1-.8 1.3-.1Z" fill="#ffd400"/>
            <g class="lab-cost__guscio">
              <circle cx="88" cy="62" r="28" fill="#e8501c" stroke="#7a2400" stroke-width="1.8"/>
              <path d="${SPIRALE}" fill="none" stroke="#7a2400" stroke-width="2.3" stroke-linecap="round"/>
              <path d="${SPIRALE}" fill="none" stroke="#ffb08a" stroke-width="1" stroke-dasharray="1.5 4" transform="translate(1.6 -1.6)" opacity=".7"/>
              <path d="M68 46 q8 -10 22 -10" stroke="rgba(255,255,255,.55)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
            </g>
          </svg>
        </button>
      </div>
      <span class="sr" aria-live="polite"></span>
    </div><p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const canvas = el.querySelector('canvas')
    const carta = el.querySelector('.lab-cost__carta')
    const tip = el.querySelector('.lab-cost__tip')
    const voce = el.querySelector('.lab-cost .sr')
    const bottone = el.querySelector('.lab-cost__astronoma')
    const frase = el.querySelector('.lab-cost__frase')
    const chi = el.querySelector('.lab-cost__chi')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const ridotto = !!api.reduced?.()

    // ── i dati: stelle, fili, costellazioni ──
    const vivido = (hex) => {
      const l = luminanza(hex)
      return l < 0.2 ? mescola(hex, '#ffffff', 0.6) : l < 0.4 ? mescola(hex, '#ffffff', 0.32) : hex
    }
    const nodi = PROJECTS.map((p) => {
      const colore = p.art?.[0] || '#9d00ff'
      return { key: p.key, titolo: p.title, kind: p.kind, colore, vista: vivido(colore), featured: !!p.featured,
        x: 0, y: 0, luce: 0, grado: 0, cost: [], via: false, posto: 0 }
    })
    const perKey = new Map(nodi.map((n) => [n.key, n]))
    const per = new Map()
    for (const p of PROJECTS) for (const [tag] of p.tags || []) {
      if (!per.has(tag)) per.set(tag, [])
      if (!per.get(tag).includes(p.key)) per.get(tag).push(p.key)
    }
    const archi = []
    for (const [tag, lista] of per) {
      if (lista.length < 2) continue
      for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
        const a = perKey.get(lista[i]), b = perKey.get(lista[j])
        if (!a || !b) continue
        const già = archi.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))
        const w = 1 / (lista.length - 1)
        if (già) { già.peso += w; già.tag.push(tag) } else archi.push({ a, b, peso: w, tag: [tag] })
      }
    }
    for (const e of archi) { e.a.grado++; e.b.grado++ }
    // i gruppi: le tecnologie con gli stessi progetti stanno insieme (HTML e CSS, C# e Windows)
    const gruppiMap = new Map()
    for (const [tag, lista] of per) {
      if (lista.length < 2) continue
      const chiave = [...lista].sort().join('|')
      if (!gruppiMap.has(chiave)) gruppiMap.set(chiave, { membri: lista.map((k) => perKey.get(k)).filter(Boolean), tag: [] })
      gruppiMap.get(chiave).tag.push(tag)
    }
    let gruppi = [...gruppiMap.values()]
    const dentro = (a, b) => a.membri.length < b.membri.length && a.membri.every((n) => b.membri.includes(n))
    gruppi = gruppi.filter((g) => !gruppi.some((h) => h !== g && h.membri.length <= 4 && dentro(g, h)))
    for (const g of gruppi) {
      const nota = g.tag.map((x) => COST[x]).find(Boolean)
      g.nebula = g.membri.length > NEBULOSA
      g.def = g.nebula ? VIA : nota || { it: `la costellazione ${g.tag[0]}`, en: `the ${g.tag[0]} constellation`, lat: g.tag[0].toUpperCase(), fig: null,
        oro: { it: 'Stelle nuove: l’oroscopo non è ancora uscito.', en: 'New stars: no horoscope yet.' } }
      g.nome = L(g.def)
      g.figura = g.def.fig && FIGURE[g.def.fig] ? new Path2D(FIGURE[g.def.fig]) : null
      for (const n of g.membri) { if (g.nebula) n.via = true; else n.cost.push(g) }
    }
    for (const n of nodi) {
      n.cost.sort((a, b) => a.membri.length - b.membri.length)
      n.pianeta = n.grado === 0
      n.r = n.pianeta ? 4.6 : 2.4 + Math.sqrt(n.grado) * 0.75 + (n.featured ? 1.4 : 0)
    }
    const costellazioni = gruppi.filter((g) => !g.nebula)
    const via = gruppi.find((g) => g.nebula)
    // i fili delle figure: l'albero più corto che tocca tutte le stelle del gruppo, come nelle carte vere
    const albero = (membri) => {
      const fuori = membri.slice(1), dentroA = [membri[0]], lati = []
      while (fuori.length) {
        let m = null
        for (const a of dentroA) for (const b of fuori) {
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (!m || d < m.d) m = { a, b, d }
        }
        lati.push(m); dentroA.push(m.b); fuori.splice(fuori.indexOf(m.b), 1)
      }
      return lati
    }

    // ── la fisica: un force layout alla Fruchterman–Reingold, che si raffredda ──
    let W = 480, H = 400, dpr = 1
    const ostacoli = () => {
      const sm = W < 380
      return {
        cart: { x: 10, y: 10, w: sm ? 128 : 168, h: sm ? 44 : 54 },
        rosa: { x: W - (sm ? 34 : 44), y: H - (sm ? 34 : 44), r: sm ? 22 : 30 },
        scala: { x: 14, y: H - 26, w: sm ? 140 : 176, h: 16 },
      }
    }
    function passo(temp, fermo = null) {
      // equilibrio: la gravità (lineare, un po' più forte in verticale perché la carta è larga) tiene il disco di stelle
      // dentro la carta; la repulsione k²/d le distanzia; le molle d²/k tengono vicine le costellazioni. Tutto per 0.1,
      // così un passo non supera mai la metà della distanza dall'equilibrio.
      const k = Math.sqrt((W * H) / nodi.length) * 0.9
      const c = { x: W / 2, y: H / 2 + 4 }
      const gx = 0.1 * GRAV * (H / W), gy = 0.1 * GRAV * 1.3 * (W / H)
      for (const n of nodi) { n.dx = (c.x - n.x) * gx; n.dy = (c.y - n.y) * gy }
      for (let i = 0; i < nodi.length; i++) for (let j = i + 1; j < nodi.length; j++) {
        const a = nodi[i], b = nodi[j]
        let dx = a.x - b.x, dy = a.y - b.y
        let d = Math.hypot(dx, dy)
        if (d < 0.5) { dx = 0.4 + i * 0.01; dy = 0.3; d = 0.5 }
        const f = (0.1 * k * k) / d / d
        a.dx += dx * f; a.dy += dy * f; b.dx -= dx * f; b.dy -= dy * f
      }
      for (const e of archi) {
        const dx = e.a.x - e.b.x, dy = e.a.y - e.b.y
        const d = Math.max(0.5, Math.hypot(dx, dy))
        const f = 0.1 * MOLLA * (d / k) * Math.min(1.6, e.peso)
        e.a.dx -= dx * f; e.a.dy -= dy * f; e.b.dx += dx * f; e.b.dy += dy * f
      }
      const o = ostacoli()
      let massimo = 0
      for (const n of nodi) {
        if (n === fermo) continue
        const l = Math.hypot(n.dx, n.dy)
        if (l > 0) { const s = Math.min(l, temp) / l; n.x += n.dx * s; n.y += n.dy * s; massimo = Math.max(massimo, Math.min(l, temp)) }
        n.x = limita(n.x, 26, W - 26); n.y = limita(n.y, 24, H - 22)
        // fuori dal cartiglio, dalla rosa dei venti e dalla scala
        const q = o.cart
        if (n.x < q.x + q.w + 10 && n.y < q.y + q.h + 10) {
          if (q.x + q.w + 10 - n.x < q.y + q.h + 10 - n.y) n.x = q.x + q.w + 10; else n.y = q.y + q.h + 10
        }
        const s = o.scala
        if (n.x < s.x + s.w + 8 && n.y > s.y - 10) n.y = s.y - 10
        const dr = Math.hypot(n.x - o.rosa.x, n.y - o.rosa.y), min = o.rosa.r + 14
        if (dr < min) { const u = dr || 1; n.x = o.rosa.x + ((n.x - o.rosa.x) / u) * min; n.y = o.rosa.y + ((n.y - o.rosa.y) / u) * min }
      }
      return massimo
    }
    function assesta(giri, da, a) {
      for (let i = 0; i < giri; i++) passo(da + (a - da) * (i / giri))
    }
    // la stessa misura dà sempre la stessa carta: il seme è fisso e si riparte da capo
    function semina() {
      const rnd = caso(semi('pzkko · carta del cielo'))
      for (const n of nodi) { n.x = W * (0.2 + rnd() * 0.6); n.y = H * (0.2 + rnd() * 0.6) }
      const k = Math.sqrt((W * H) / nodi.length)
      assesta(420, k * 1.2, 0.4)
    }

    // ── il fondo della carta: si disegna una volta per misura ──
    const fondo = document.createElement('canvas')
    let polvere = []
    function rifaiFondo() {
      fondo.width = Math.round(W * dpr); fondo.height = Math.round(H * dpr)
      const c = fondo.getContext('2d')
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      const g = c.createRadialGradient(W * 0.45, H * 0.4, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75)
      g.addColorStop(0, CARTA.fondo1); g.addColorStop(1, CARTA.fondo2)
      c.fillStyle = g; c.fillRect(0, 0, W, H)
      // macchie di umido e di caffè: la carta è vecchia
      const r2 = caso(semi(`macchie${Math.round(W)}`))
      for (let i = 0; i < 7; i++) {
        const x = r2() * W, y = r2() * H, r = 30 + r2() * 70
        const m = c.createRadialGradient(x, y, 0, x, y, r)
        m.addColorStop(0, 'rgba(150, 120, 60, .09)'); m.addColorStop(0.7, 'rgba(150, 120, 60, .04)'); m.addColorStop(1, 'rgba(150, 120, 60, 0)')
        c.fillStyle = m; c.fillRect(x - r, y - r, r * 2, r * 2)
      }
      // il reticolo del planisfero: paralleli e meridiani da un polo fuori dalla carta
      const px = W * 0.56, py = -H * 0.85
      c.strokeStyle = rgba(CARTA.oro, 0.13); c.lineWidth = 0.8
      for (let R = H * 0.95; R < H * 2.2; R += H * 0.19) { c.beginPath(); c.arc(px, py, R, 0, Math.PI); c.stroke() }
      c.strokeStyle = rgba(CARTA.oro, 0.09)
      for (let a = 0.55; a < 2.6; a += 0.16) { c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * H * 3, py + Math.sin(a) * H * 3); c.stroke() }
      // l'eclittica, tratteggiata e un po' storta
      c.save(); c.setLineDash([5, 4]); c.strokeStyle = rgba(CARTA.rosso, 0.38); c.lineWidth = 1
      c.beginPath()
      for (let x = 12; x <= W - 12; x += 4) { const y = H * 0.58 + Math.sin((x / W) * Math.PI * 2 + 0.7) * H * 0.16; x === 12 ? c.moveTo(x, y) : c.lineTo(x, y) }
      c.stroke(); c.restore()
      // la polvere di stelle
      const r3 = caso(semi('polvere'))
      polvere = Array.from({ length: Math.round((W * H) / 1500) }, () => ({ x: r3() * W, y: r3() * H, r: 0.3 + r3() * r3() * 1.2, a: 0.25 + r3() * 0.55 }))
      for (const p of polvere) { c.globalAlpha = p.a; c.fillStyle = CARTA.crema; c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill() }
      c.globalAlpha = 1
      // la grana della carta
      const gr = caso(semi('grana'))
      for (let i = 0; i < (W * H) / 90; i++) {
        c.fillStyle = gr() < 0.5 ? 'rgba(255, 245, 220, .035)' : 'rgba(0, 0, 0, .06)'
        c.fillRect(gr() * W, gr() * H, 1, 1)
      }
      // la cornice graduata
      const o = ostacoli()
      c.strokeStyle = rgba(CARTA.oro, 0.85); c.lineWidth = 1
      c.strokeRect(3.5, 3.5, W - 7, H - 7)
      c.strokeRect(9.5, 9.5, W - 19, H - 19)
      const tacca = 12
      for (let x = 10, i = 0; x < W - 10; x += tacca, i++) {
        if (i % 2) { c.fillStyle = rgba(CARTA.oro, 0.7); c.fillRect(x, 4, Math.min(tacca, W - 10 - x), 5); c.fillRect(x, H - 9, Math.min(tacca, W - 10 - x), 5) }
      }
      for (let y = 10, i = 0; y < H - 10; y += tacca, i++) {
        if (i % 2) { c.fillStyle = rgba(CARTA.oro, 0.7); c.fillRect(4, y, 5, Math.min(tacca, H - 10 - y)); c.fillRect(W - 9, y, 5, Math.min(tacca, H - 10 - y)) }
      }
      // il cartiglio col titolo
      const q = o.cart
      c.fillStyle = 'rgba(8, 14, 32, .82)'; c.fillRect(q.x + 4, q.y + 4, q.w - 4, q.h - 4)
      c.strokeStyle = rgba(CARTA.oro, 0.9); c.lineWidth = 1
      c.strokeRect(q.x + 6.5, q.y + 6.5, q.w - 8, q.h - 8)
      c.strokeRect(q.x + 9.5, q.y + 9.5, q.w - 14, q.h - 14)
      c.textAlign = 'center'; c.fillStyle = CARTA.oro
      const sm = W < 380
      c.font = `400 ${sm ? 15 : 19}px "Medieval", "Special Elite", serif`
      c.fillText(t(lang, 'titolo'), q.x + 4 + (q.w - 4) / 2, q.y + (sm ? 27 : 32))
      c.font = `400 ${sm ? 7.5 : 8.5}px "Special Elite", "Courier New", monospace`
      c.fillStyle = rgba(CARTA.crema, 0.8)
      c.fillText(t(lang, 'sotto'), q.x + 4 + (q.w - 4) / 2, q.y + (sm ? 39 : 46))
      c.textAlign = 'left'
      // la scala, onesta
      const s = o.scala
      c.fillStyle = rgba(CARTA.oro, 0.9)
      for (let i = 0; i < 4; i++) { if (i % 2 === 0) c.fillRect(s.x + i * 14, s.y + 3, 14, 3) }
      c.strokeStyle = rgba(CARTA.oro, 0.9); c.strokeRect(s.x + 0.5, s.y + 2.5, 56, 4)
      c.font = '400 8px "Special Elite", "Courier New", monospace'; c.fillStyle = rgba(CARTA.crema, 0.75)
      c.fillText(t(lang, 'scala'), s.x, s.y + 15)
      // la rosa dei venti
      rosa(c, o.rosa.x, o.rosa.y, o.rosa.r)
    }
    function rosa(c, x, y, r) {
      c.save(); c.translate(x, y)
      c.strokeStyle = rgba(CARTA.oro, 0.6); c.lineWidth = 0.8
      c.beginPath(); c.arc(0, 0, r * 0.98, 0, Math.PI * 2); c.stroke()
      c.beginPath(); c.arc(0, 0, r * 0.82, 0, Math.PI * 2); c.stroke()
      for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); c.lineTo(Math.cos(a) * r * (i % 4 ? 0.9 : 0.98), Math.sin(a) * r * (i % 4 ? 0.9 : 0.98)); c.stroke() }
      const punta = (a, l, larga, chiaro) => {
        for (const lato of [-1, 1]) {
          c.beginPath(); c.moveTo(0, 0)
          c.lineTo(Math.cos(a) * l, Math.sin(a) * l)
          c.lineTo(Math.cos(a + lato * Math.PI / 2) * larga, Math.sin(a + lato * Math.PI / 2) * larga)
          c.closePath()
          c.fillStyle = (lato < 0) === chiaro ? CARTA.oro : '#5a4520'; c.fill()
        }
      }
      for (let i = 0; i < 4; i++) punta(Math.PI / 4 + (i * Math.PI) / 2, r * 0.55, r * 0.11, true)
      for (let i = 0; i < 4; i++) punta(-Math.PI / 2 + (i * Math.PI) / 2, r * 0.86, r * 0.16, true)
      c.beginPath(); c.moveTo(0, -r * 0.86); c.lineTo(r * 0.16, 0); c.lineTo(-r * 0.16, 0); c.closePath(); c.fillStyle = CARTA.rosso; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1
      c.beginPath(); c.arc(0, 0, r * 0.08, 0, Math.PI * 2); c.fillStyle = CARTA.crema; c.fill()
      c.fillStyle = CARTA.oro; c.font = `400 ${Math.round(r * 0.42)}px "Medieval", "Special Elite", serif`; c.textAlign = 'center'
      c.fillText('N', 0, -r * 1.04); c.textAlign = 'left'
      c.restore()
    }

    // ── il disegno ──
    let sopra = null, scelto = null, trascino = null, partenza = null, mosso = false, tocco = null
    let raf = 0, attivo = false, vivo = true, moto = 0
    const fuoco = () => trascino || sopra || scelto
    // niente ingresso a tempo: la carta è finita dal primo disegno (una foto o un pc lento non la vedono mai a metà)
    const progresso = () => 1
    const ordine = new Map()
    const rifaiOrdine = () => [...nodi].sort((a, b) => a.x - b.x).forEach((n, i) => ordine.set(n, i / nodi.length))
    const lisci = (x) => x * x * (3 - 2 * x)

    function stella(c, n, a) {
      const r = n.r * (1 + n.luce * 0.45)
      c.globalAlpha = a
      const alone = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5 + n.luce * 14)
      alone.addColorStop(0, rgba(n.vista, 0.5 + n.luce * 0.3)); alone.addColorStop(0.35, rgba(n.vista, 0.14 + n.luce * 0.12)); alone.addColorStop(1, rgba(n.vista, 0))
      c.fillStyle = alone; c.beginPath(); c.arc(n.x, n.y, r * 5 + n.luce * 14, 0, Math.PI * 2); c.fill()
      if (n.pianeta) {
        // un pianeta: palla illuminata da sinistra e l'anello, metà dietro e metà davanti
        c.strokeStyle = rgba(mescola(n.vista, '#ffffff', 0.4), 0.9); c.lineWidth = 1.2
        c.beginPath(); c.ellipse(n.x, n.y, r * 2.3, r * 0.7, -0.35, Math.PI, Math.PI * 2); c.stroke()
        const g = c.createRadialGradient(n.x - r * 0.4, n.y - r * 0.4, r * 0.2, n.x, n.y, r * 1.2)
        g.addColorStop(0, mescola(n.vista, '#ffffff', 0.55)); g.addColorStop(1, mescola(n.colore, '#0a1228', 0.35))
        c.fillStyle = g; c.beginPath(); c.arc(n.x, n.y, r * 1.1, 0, Math.PI * 2); c.fill()
        c.beginPath(); c.ellipse(n.x, n.y, r * 2.3, r * 0.7, -0.35, 0, Math.PI); c.stroke()
      } else {
        // una stella: i raggi a croce (più lunghi per le più luminose), poi il nucleo bianco
        const raggio = r * (2.6 + Math.min(2, n.grado * 0.12) + n.luce * 1.6)
        const spessore = Math.max(0.7, r * 0.26)
        c.fillStyle = rgba(mescola(n.vista, '#ffffff', 0.55), 0.9)
        const croce = (ang, l, s) => {
          c.save(); c.translate(n.x, n.y); c.rotate(ang)
          c.beginPath(); c.moveTo(-l, 0); c.lineTo(0, -s); c.lineTo(l, 0); c.lineTo(0, s); c.closePath(); c.fill()
          c.beginPath(); c.moveTo(0, -l); c.lineTo(s, 0); c.lineTo(0, l); c.lineTo(-s, 0); c.closePath(); c.fill()
          c.restore()
        }
        croce(0, raggio, spessore)
        if (n.featured || n.grado >= 8 || n.luce > 0.05) croce(Math.PI / 4, raggio * 0.55, spessore * 0.8)
        c.fillStyle = n.vista; c.beginPath(); c.arc(n.x, n.y, r, 0, Math.PI * 2); c.fill()
        c.fillStyle = '#fffdf6'; c.beginPath(); c.arc(n.x, n.y, r * 0.5, 0, Math.PI * 2); c.fill()
      }
      // la stella scelta da tastiera: il mirino del cannocchiale
      if (n === scelto) {
        c.globalAlpha = 1; c.strokeStyle = CARTA.rosso; c.lineWidth = 1.4
        const m = r + 9
        c.beginPath(); c.arc(n.x, n.y, m, 0, Math.PI * 2); c.stroke()
        c.beginPath()
        for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { c.moveTo(n.x + ux * (m - 4), n.y + uy * (m - 4)); c.lineTo(n.x + ux * (m + 5), n.y + uy * (m + 5)) }
        c.stroke()
      }
      c.globalAlpha = 1
    }

    function disegna(ora = performance.now()) {
      const c = canvas.getContext('2d')
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, W, H)
      c.drawImage(fondo, 0, 0, W, H)
      const p = progresso(ora)
      const f = fuoco()
      const vicini = new Set(f ? [f] : [])
      if (f) for (const e of archi) { if (e.a === f) vicini.add(e.b); if (e.b === f) vicini.add(e.a) }
      const comparsa = (n) => lisci(limita((p - 0.04 - (ordine.get(n) || 0) * 0.5) / 0.14, 0, 1))
      const pLinee = limita((p - 0.45) / 0.35, 0, 1)
      const pScritte = lisci(limita((p - 0.7) / 0.25, 0, 1))
      const spento = (n) => (f && !vicini.has(n) ? 0.38 : 1)

      // la Via JavaScript: una nebbia di luce dove stanno le stelle di JavaScript
      if (via) {
        c.save(); c.globalCompositeOperation = 'lighter'
        const k = Math.sqrt((W * H) / nodi.length)
        for (const n of via.membri) {
          const a = comparsa(n) * (f && f.via ? 1.6 : 1)
          const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, k * 1.05)
          g.addColorStop(0, `rgba(170, 190, 255, ${0.075 * a})`); g.addColorStop(0.6, `rgba(150, 140, 230, ${0.03 * a})`); g.addColorStop(1, 'rgba(150, 140, 230, 0)')
          c.fillStyle = g; c.beginPath(); c.arc(n.x, n.y, k * 1.05, 0, Math.PI * 2); c.fill()
        }
        c.restore()
      }
      // le figure delle costellazioni, a tratto d'oro
      for (const g of costellazioni) {
        if (!g.figura) continue
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
        for (const n of g.membri) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y) }
        const lato = limita(Math.max(x1 - x0, y1 - y0) + 46, 64, Math.min(W, H) * 0.62)
        const s = lato / 100
        g.box = { x: (x0 + x1) / 2 - lato / 2, y: (y0 + y1) / 2 - lato / 2, w: lato, h: lato, x0, y0, x1, y1 }
        const acceso = f && f.cost.includes(g)
        c.save(); c.translate(g.box.x, g.box.y); c.scale(s, s)
        c.globalAlpha = pLinee * (acceso ? 0.7 : f ? 0.1 : 0.3)
        c.strokeStyle = CARTA.oro; c.lineWidth = 1.5 / s; c.lineJoin = c.lineCap = 'round'
        c.stroke(g.figura)
        c.restore()
      }
      c.globalAlpha = 1
      // i fili delle costellazioni: l'albero più corto, tracciato man mano all'ingresso
      c.lineCap = 'round'
      for (const [i, g] of costellazioni.entries()) {
        const acceso = f && f.cost.includes(g)
        const q = limita(pLinee * 1.4 - (i / costellazioni.length) * 0.4, 0, 1)
        if (!q) continue
        c.strokeStyle = acceso ? rgba(CARTA.oro, 0.95) : rgba(CARTA.oro, f ? 0.2 : 0.72)
        c.lineWidth = acceso ? 1.8 : 1.2
        c.beginPath()
        for (const l of albero(g.membri)) { c.moveTo(l.a.x, l.a.y); c.lineTo(l.a.x + (l.b.x - l.a.x) * q, l.a.y + (l.b.y - l.a.y) * q) }
        c.stroke()
      }
      // il filo rosso: tutte le tecnologie in comune con la stella sotto il mouse
      const cartellini = []
      if (f) {
        for (const e of archi) {
          if (e.a !== f && e.b !== f) continue
          const solo = e.tag.every((x) => via && via.tag.includes(x))
          c.strokeStyle = rgba(CARTA.rosso, solo ? 0.42 : 0.92)
          c.lineWidth = solo ? 0.9 : 1.6
          c.setLineDash(solo ? [2, 3] : [])
          c.beginPath(); c.moveTo(e.a.x, e.a.y); c.lineTo(e.b.x, e.b.y); c.stroke()
          if (!solo) {
            const tag = e.tag.filter((x) => !(via && via.tag.includes(x)))
            cartellini.push({ x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2, testo: tag.slice(0, 2).join(' · ') })
          }
        }
        c.setLineDash([])
      }
      // le stelle
      for (const n of nodi) { const a = comparsa(n); if (a > 0) stella(c, n, a * spento(n)) }

      // ── le scritte, senza sovrapposizioni ──
      if (pScritte <= 0) return
      const o = ostacoli()
      const occupati = [
        { x: o.cart.x, y: o.cart.y, w: o.cart.w + 4, h: o.cart.h + 4 },
        { x: o.rosa.x - o.rosa.r - 4, y: o.rosa.y - o.rosa.r - 14, w: o.rosa.r * 2 + 8, h: o.rosa.r * 2 + 18 },
        { x: o.scala.x, y: o.scala.y, w: o.scala.w, h: o.scala.h + 4 },
        { x: W - 96, y: 0, w: 96, h: 28 }, // il timbro
      ]
      const tocca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
      const libero = (r, stelle = true) => {
        if (r.x < 12 || r.y < 12 || r.x + r.w > W - 12 || r.y + r.h > H - 12) return false
        if (occupati.some((q) => tocca(r, q))) return false
        if (stelle) for (const n of nodi) {
          const cx = limita(n.x, r.x, r.x + r.w), cy = limita(n.y, r.y, r.y + r.h)
          if (Math.hypot(n.x - cx, n.y - cy) < n.r + 2.5) return false
        }
        return true
      }
      const scritta = (testo, x, y, font, colore, alpha) => {
        c.font = font; c.globalAlpha = alpha
        c.lineJoin = 'round'; c.lineWidth = 3.4; c.strokeStyle = 'rgba(8, 14, 32, .92)'
        c.strokeText(testo, x, y); c.fillStyle = colore; c.fillText(testo, x, y)
        c.globalAlpha = 1
      }
      const fontStella = (forte) => `400 ${forte ? 13 : W < 380 ? 10 : 11}px "Special Elite", "Courier New", monospace`
      const etichettaStella = (n, forza) => {
        const forte = n === f
        c.font = fontStella(forte)
        const w = c.measureText(n.titolo).width, h = forte ? 13 : 11
        const d = n.r + (forte ? 8 : 5)
        const posti = [
          [n.x + d, n.y + h / 2 - 1], [n.x - d - w, n.y + h / 2 - 1], [n.x - w / 2, n.y - d], [n.x - w / 2, n.y + d + h],
          [n.x + d - 2, n.y - d + 2], [n.x + d - 2, n.y + d + h - 2], [n.x - d - w + 2, n.y - d + 2], [n.x - d - w + 2, n.y + d + h - 2],
        ]
        const ordine = [n.posto, ...posti.keys()].filter((v, i, a) => a.indexOf(v) === i)
        let scelta = ordine.find((i) => libero({ x: posti[i][0] - 2, y: posti[i][1] - h, w: w + 4, h: h + 3 }))
        if (scelta == null && forza) scelta = ordine.find((i) => posti[i][0] > 12 && posti[i][0] + w < W - 12) ?? 0
        if (scelta == null) return
        n.posto = scelta
        const [x, y] = posti[scelta]
        occupati.push({ x: x - 2, y: y - h, w: w + 4, h: h + 3 })
        if (forte) {
          // l'evidenziatore giallo sotto il nome della stella accesa
          c.globalAlpha = pScritte * 0.85; c.fillStyle = 'rgba(255, 212, 0, .55)'
          c.fillRect(x - 3, y - h + 2, w + 6, h)
          c.globalAlpha = 1
        }
        scritta(n.titolo, x, y, fontStella(forte), forte ? '#ffffff' : CARTA.crema, pScritte * (forte ? 1 : 0.92 * spento(n)))
      }
      const nomeCostellazione = (g) => {
        const acceso = f && (g.nebula ? f.via : f.cost.includes(g))
        let bx, by
        if (g.nebula) {
          bx = g.membri.reduce((s, n) => s + n.x, 0) / g.membri.length
          by = g.membri.reduce((s, n) => s + n.y, 0) / g.membri.length
        } else { bx = (g.box.x0 + g.box.x1) / 2; by = (g.box.y0 + g.box.y1) / 2 }
        const fN = `400 ${W < 380 ? 12 : 14}px "Permanent Marker", "Comic Sans MS", cursive`
        const fL = `400 ${W < 380 ? 7 : 8}px "Special Elite", "Courier New", monospace`
        c.font = fN; const w1 = c.measureText(g.nome).width
        c.font = fL; const w2 = c.measureText(g.def.lat).width + g.def.lat.length * 1.2
        const w = Math.max(w1, w2), h = 24
        const sotto = g.nebula ? 0 : (g.box.y1 - g.box.y0) / 2 + 14
        const sopraY = g.nebula ? 0 : (g.box.y1 - g.box.y0) / 2 + 20
        const posti = [[bx - w / 2, by + sotto + 12], [bx - w / 2, by - sopraY], [bx - w / 2, by + 6], [bx + 14, by + 6], [bx - w - 14, by + 6],
          [bx - w / 2, by + sotto + 34], [bx - w / 2, by - sopraY - 22]]
        const scelta = posti.find(([x, y]) => libero({ x: x - 2, y: y - 14, w: w + 4, h }))
        if (!scelta) return
        const [x, y] = scelta
        occupati.push({ x: x - 2, y: y - 14, w: w + 4, h })
        c.save(); c.translate(x + w / 2, y); c.rotate(-0.035)
        c.textAlign = 'center'
        scritta(g.nome, 0, 0, fN, acceso ? '#ffe9a8' : CARTA.oro, pScritte * (acceso ? 1 : f ? 0.45 : 0.9))
        c.font = fL
        if ('letterSpacing' in c) c.letterSpacing = '1.2px'
        c.globalAlpha = pScritte * (acceso ? 0.95 : f ? 0.35 : 0.7); c.fillStyle = CARTA.crema
        c.fillText(g.def.lat, 0, 10)
        if ('letterSpacing' in c) c.letterSpacing = '0px'
        c.restore(); c.globalAlpha = 1
      }
      // l'ordine conta: prima la stella accesa, poi le figure, poi le stelle più luminose
      if (f) etichettaStella(f, true)
      for (const g of [...costellazioni].sort((a, b) => b.membri.length - a.membri.length)) nomeCostellazione(g)
      if (via) nomeCostellazione(via)
      for (const n of [...nodi].sort((a, b) => (b.featured - a.featured) || (b.grado - a.grado))) if (n !== f) etichettaStella(n, n.featured)
      // l'eclittica ha la sua didascalia, se c'è posto
      c.font = '400 8px "Special Elite", "Courier New", monospace'
      const te = t(lang, 'eclittica'), we = c.measureText(te).width
      for (const xe of [W * 0.62, W * 0.3, W * 0.8]) {
        const ye = H * 0.58 + Math.sin((xe / W) * Math.PI * 2 + 0.7) * H * 0.16 - 5
        if (libero({ x: xe, y: ye - 9, w: we, h: 11 })) { c.globalAlpha = pScritte * 0.7; c.fillStyle = CARTA.rosso; c.fillText(te, xe, ye); c.globalAlpha = 1; break }
      }
      // i cartellini delle tecnologie sui fili rossi
      if (cartellini.length) {
        c.font = '400 9px "Special Elite", "Courier New", monospace'
        for (const q of cartellini) {
          const w = c.measureText(q.testo).width + 8
          c.fillStyle = 'rgba(255, 253, 246, .94)'; c.fillRect(q.x - w / 2, q.y - 7, w, 13)
          c.strokeStyle = CARTA.rosso; c.lineWidth = 1; c.strokeRect(q.x - w / 2 + 0.5, q.y - 6.5, w - 1, 12)
          c.fillStyle = '#7a0a12'; c.textAlign = 'center'; c.fillText(q.testo, q.x, q.y + 3); c.textAlign = 'left'
        }
      }
    }

    // ── il ciclo: gira solo se qualcosa si muove (ingresso, trascinamento, alone che si accende) ──
    function giro(ora) {
      raf = 0
      if (!vivo || !attivo) return
      let ancora = progresso(ora) < 1
      if (moto > 0 || trascino) {
        const m = passo(trascino ? 4 : 2.6, trascino)
        moto--
        if (trascino || m > 0.08) ancora = true
        else moto = 0
      }
      const f = fuoco()
      for (const n of nodi) {
        const meta = n === f ? 1 : 0
        if (ridotto) { n.luce = meta; continue }
        n.luce += (meta - n.luce) * 0.22
        if (Math.abs(meta - n.luce) > 0.01) ancora = true
        else n.luce = meta
      }
      disegna(ora)
      if (ancora) sveglia()
    }
    function sveglia() { if (!raf && vivo && attivo) raf = requestAnimationFrame(giro) }

    // ── la misura: il canvas segue il foglio ──
    let primaVolta = true, spostata = false
    function misura() {
      const r = canvas.getBoundingClientRect()
      const nW = Math.max(240, r.width), nH = Math.max(280, r.height)
      const nD = Math.min(2, window.devicePixelRatio || 1)
      if (!primaVolta && Math.abs(nW - W) < 0.5 && Math.abs(nH - H) < 0.5 && nD === dpr) return
      const vW = W, vH = H
      W = nW; H = nH; dpr = nD
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
      // finché nessuno ha tirato una stella, una misura nuova rifà la carta da capo (sempre uguale per quella misura);
      // dopo, le stelle si spostano in proporzione, così il lavoro di chi le ha trascinate resta
      if (primaVolta || !spostata) { semina(); primaVolta = false } else {
        for (const n of nodi) { n.x *= W / vW; n.y *= H / vH }
        assesta(90, Math.sqrt((W * H) / nodi.length) * 0.3, 0.3)
      }
      rifaiOrdine(); rifaiFondo(); disegna()
    }

    // ── il cartellino ──
    const nomeCost = (n) => (n.pianeta ? L(PIANETA) : [...n.cost.map((g) => g.nome), n.via ? via?.nome : null].filter(Boolean).slice(0, 2).join(' · '))
    function mostraTip(n, toccato = false) {
      if (!n) { tip.hidden = true; return }
      tip.innerHTML = `<span class="lab-cost__tip-tipo">${esc(kind(lang, n.kind))} · ${esc(t(lang, 'nFili', n.grado))}</span>`
        + `<b>${esc(n.titolo)}</b><span class="lab-cost__tip-cost">${esc(nomeCost(n))}</span>`
        + `<span class="lab-cost__tip-apri">${esc(t(lang, toccato ? 'apriTocco' : 'apri'))}</span>`
      tip.hidden = false
      const r = canvas.getBoundingClientRect(), cr = carta.getBoundingClientRect()
      const sx = r.width / W, sy = r.height / H
      const x = n.x * sx + (r.left - cr.left), y = n.y * sy + (r.top - cr.top)
      const tw = tip.offsetWidth, th = tip.offsetHeight
      // il cartellino pende sotto la stella (o sopra, se sotto non c'è posto), spostato di lato: così non copre i fili
      const destra = x + 10 + tw < cr.width - 6
      const sotto = y + 16 + th < cr.height - 6
      tip.dataset.lato = destra ? 'dx' : 'sx'
      tip.dataset.su = sotto ? '0' : '1'
      tip.style.left = `${destra ? x + 10 : Math.max(6, x - 10 - tw)}px`
      tip.style.top = `${sotto ? y + 16 : Math.max(6, y - 16 - th)}px`
    }
    // ── l'astronoma: battute al clic, oroscopo della stella sotto il mouse ──
    let battuta = 0
    function parla(n) {
      if (n) {
        const g = n.cost[0]
        const nome = n.pianeta ? L(PIANETA.nome) : g ? g.nome : n.via ? via?.nome : ''
        const oro = n.pianeta ? PIANETA.oro : g ? g.def.oro : VIA.oro
        chi.textContent = t(lang, 'oroscopo', nome)
        frase.textContent = L(oro)
        bottone.dataset.oroscopo = '1'
      } else {
        chi.textContent = t(lang, 'chi')
        frase.textContent = battute[battuta % battute.length]
        delete bottone.dataset.oroscopo
      }
    }
    bottone.addEventListener('click', () => {
      battuta++
      sopra = null
      parla(null)
      bottone.classList.remove('is-ride'); void bottone.offsetWidth; bottone.classList.add('is-ride')
    })
    const annuncia = (n) => { voce.textContent = n ? t(lang, 'sr', n.titolo, kind(lang, n.kind), nomeCost(n), t(lang, 'nFili', n.grado)) : '' }
    const accendi = (n, toccato = false) => {
      mostraTip(n, toccato)
      parla(n)
      sveglia()
      disegna()
    }

    // ── il mouse, il dito e la tastiera ──
    const punto = (e) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    const trova = (p) => {
      let m = null, md = Infinity
      for (const n of nodi) { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < n.r + 14 && d < md) { m = n; md = d } }
      return m
    }
    canvas.addEventListener('pointermove', (e) => {
      const p = punto(e)
      if (trascino) {
        trascino.x = limita(p.x, 20, W - 20); trascino.y = limita(p.y, 20, H - 20)
        if (Math.hypot(p.x - partenza.x, p.y - partenza.y) > 4) { mosso = true; spostata = true; tip.hidden = true }
        moto = 200; sveglia()
        return
      }
      if (e.pointerType === 'touch') return
      const n = trova(p)
      if (n !== sopra) { sopra = n; canvas.style.cursor = n ? 'pointer' : 'grab'; accendi(n || scelto) }
    })
    canvas.addEventListener('pointerleave', () => { if (!trascino && sopra) { sopra = null; accendi(scelto) } })
    canvas.addEventListener('pointerdown', (e) => {
      const p = punto(e), n = trova(p)
      if (!n) return
      trascino = n; partenza = p; mosso = false
      canvas.setPointerCapture?.(e.pointerId)
      canvas.style.cursor = 'grabbing'
      sveglia()
    })
    canvas.addEventListener('pointerup', (e) => {
      const n = trascino
      trascino = null
      try { canvas.releasePointerCapture?.(e.pointerId) } catch {}
      canvas.style.cursor = n ? 'pointer' : 'grab'
      if (n && !mosso) {
        // col dito il primo tocco mostra il cartellino, il secondo apre
        if (e.pointerType === 'touch' && tocco !== n) { tocco = n; sopra = n; accendi(n, true); return }
        tocco = null
        api.open(n.key)
      } else if (n) { moto = 200; rifaiOrdine(); accendi(sopra || scelto) }
      sveglia()
    })
    canvas.addEventListener('pointercancel', () => { trascino = null; moto = 200; sveglia() })
    const DIREZIONI = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }
    function versoDi(da, [ux, uy]) {
      let m = null, ms = Infinity
      for (const n of nodi) {
        if (n === da) continue
        const dx = n.x - da.x, dy = n.y - da.y
        const avanti = dx * ux + dy * uy
        if (avanti <= 3) continue
        const punteggio = avanti + Math.abs(dx * uy - dy * ux) * 2.2
        if (punteggio < ms) { m = n; ms = punteggio }
      }
      return m
    }
    canvas.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()
      if (e.key === 'Enter' || e.key === ' ') { if (scelto) api.open(scelto.key); return }
      if (e.key === 'Escape') { scelto = null; sopra = null; accendi(null); annuncia(null); return }
      const i = scelto ? nodi.indexOf(scelto) : -1
      let n
      if (e.key === 'Home') n = nodi[0]
      else if (e.key === 'End') n = nodi[nodi.length - 1]
      else if (!scelto) n = nodi[0]
      else {
        // si va alla stella più vicina in quella direzione; se non ce n'è, alla prossima della lista
        n = versoDi(scelto, DIREZIONI[e.key])
        if (!n) n = nodi[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + nodi.length) % nodi.length]
      }
      scelto = n; sopra = null
      accendi(n); annuncia(n)
    })
    canvas.addEventListener('focus', () => { if (!scelto) scelto = nodi.find((n) => n.featured) || nodi[0]; accendi(scelto); annuncia(scelto) })
    canvas.addEventListener('blur', () => { scelto = null; sopra = null; tocco = null; accendi(null) })

    const ro = new ResizeObserver(() => misura())
    ro.observe(canvas)
    api.quandoVisibile(el, (v) => {
      attivo = v
      carta.dataset.fermo = v ? '0' : '1'
      if (v) sveglia(); else { cancelAnimationFrame(raf); raf = 0 }
    })
    api.stato(stato, t(lang, 'fili', nodi.length, archi.length), 'ok')
    misura()
    // i caratteri della carta arrivano dopo: quando ci sono, si ridisegna tutto
    Promise.all(['400 19px "Medieval"', '400 14px "Permanent Marker"', '400 11px "Special Elite"']
      .map((f) => document.fonts?.load?.(f).catch(() => {})))
      .then(() => { if (vivo) { rifaiFondo(); disegna() } })

    return () => {
      vivo = false; cancelAnimationFrame(raf); raf = 0
      ro.disconnect()
    }
  },
}
