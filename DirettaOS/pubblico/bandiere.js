// Diretta OS: il catalogo delle bandiere (il pezzo «bandiera», pubblico/bandiera.js). Ognuna è un SVG con le sue
// proporzioni vere e i colori ufficiali, piatti: il tessuto, le pieghe e la luce della stanza ce li mette sopra il pezzo.
// La prima è la Cina. Lo usano il pezzo, la regia (le miniature) e il server (per sapere quali ci sono).

// una stella a cinque punte: centro, raggio, verso dove guarda la prima punta (gradi; -90 = in su)
const stella = (cx, cy, R, gira = -90) => {
  const p = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? R * 0.381966 : R, a = (gira + i * 36) * Math.PI / 180
    p.push(`${+(cx + r * Math.cos(a)).toFixed(3)},${+(cy + r * Math.sin(a)).toFixed(3)}`)
  }
  return `M${p.join('L')}Z`
}
const svg = (w, h, dentro, vb = `0 0 ${w} ${h}`) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">${dentro}</svg>`
// tre bande uguali, in piedi («v») o di traverso
const tre = (w, h, [a, b, c], v) => svg(w, h, v
  ? `<rect width="${w / 3}" height="${h}" fill="${a}"/><rect x="${w / 3}" width="${w / 3}" height="${h}" fill="${b}"/><rect x="${2 * w / 3}" width="${w / 3}" height="${h}" fill="${c}"/>`
  : `<rect width="${w}" height="${h / 3}" fill="${a}"/><rect y="${h / 3}" width="${w}" height="${h / 3}" fill="${b}"/><rect y="${2 * h / 3}" width="${w}" height="${h / 3}" fill="${c}"/>`)
const strisce = (w, h, colori) => svg(w, h, colori.map((c, i) => `<rect y="${(h * i / colori.length).toFixed(3)}" width="${w}" height="${(h / colori.length + 0.02).toFixed(3)}" fill="${c}"/>`).join(''))
// la croce del nord: lo sfondo, la croce (e quella dentro, se c'è). x e y: dove sta la croce; s: quanto è larga
const nordica = (w, h, fondo, croci) => svg(w, h, `<rect width="${w}" height="${h}" fill="${fondo}"/>${croci.map(([c, x, y, s]) => `<rect x="${x}" width="${s}" height="${h}" fill="${c}"/><rect y="${y}" width="${w}" height="${s}" fill="${c}"/>`).join('')}`)

// ── la Corea del Sud: il taegeuk (rosso sopra, la testa rossa a sinistra) e i quattro trigrammi sulle diagonali ──
function corea() {
  const ang = Math.atan2(48, 72) * 180 / Math.PI // la diagonale
  const barra = (c, rotta) => rotta
    ? `<rect x="${c - 1}" y="-6" width="2" height="5.5"/><rect x="${c - 1}" y="0.5" width="2" height="5.5"/>`
    : `<rect x="${c - 1}" y="-6" width="2" height="12"/>`
  // [gradi, le tre barre dalla più vicina al centro: true = spezzata]
  const tri = [[180 + ang, [false, false, false]], [ang, [true, true, true]], [-ang, [true, false, true]], [180 - ang, [false, true, false]]]
  return svg(72, 48, `<rect x="-36" y="-24" width="72" height="48" fill="#fff"/>
    <g fill="#000">${tri.map(([g, b]) => `<g transform="rotate(${g.toFixed(4)})">${b.map((r, k) => barra(19 + 3 * k, r)).join('')}</g>`).join('')}</g>
    <g transform="rotate(${ang.toFixed(4)})"><circle r="12" fill="#0047A0"/><path d="M-12 0A12 12 0 0 1 12 0A6 6 0 0 0 0 0A6 6 0 0 1-12 0Z" fill="#CD2E3A"/></g>`, '-36 -24 72 48')
}
// ── l'India: il chakra di Ashoka, 24 raggi ──
function india() {
  const raggi = Array.from({ length: 24 }, (_, i) => `<path transform="rotate(${i * 15})" d="M0 17.5 0.6 7 0 2-0.6 7Z"/><circle transform="rotate(${i * 15 + 7.5}) translate(17.5)" r="0.875"/>`).join('')
  return svg(225, 150, `<rect width="225" height="50" fill="#FF9933"/><rect y="50" width="225" height="50" fill="#fff"/><rect y="100" width="225" height="50" fill="#138808"/>
    <g transform="translate(112.5 75)" fill="#000080"><circle r="20"/><circle r="17.5" fill="#fff"/><circle r="3.5"/>${raggi}</g>`)
}
// ── gli Stati Uniti: 13 strisce, 50 stelle (proporzioni ufficiali, 19:10) ──
function usa() {
  const H = 3900, W = 7410, st = []
  for (let i = 0; i < 13; i += 2) st.push(`<rect y="${i * 300}" width="${W}" height="300" fill="#B22234"/>`)
  const stelle = []
  for (let r = 0; r < 9; r++) {
    const sei = r % 2 === 0
    for (let k = 0; k < (sei ? 6 : 5); k++) stelle.push(stella(245.7 * (sei ? 2 * k + 1 : 2 * k + 2), 210.6 * (r + 1), 120.12))
  }
  return svg(W, H, `<rect width="${W}" height="${H}" fill="#fff"/>${st.join('')}<rect width="2964" height="2100" fill="#3C3B6E"/><path fill="#fff" d="${stelle.join('')}"/>`)
}
// ── i pirati: teschio e tibie ──
const pirati = () => svg(300, 200, `<rect width="300" height="200" fill="#0b0b0d"/>
  <g stroke="#f4f1ea" stroke-width="11" stroke-linecap="round"><path d="M98 168 202 112M98 112 202 168"/></g>
  <g fill="#f4f1ea">${[[98, 168, 1], [202, 112, -1], [98, 112, -1], [202, 168, 1]].map(([x, y, s]) => `<circle cx="${x - 5 * s}" cy="${y - 6}" r="8"/><circle cx="${x + 5 * s}" cy="${y + 6}" r="8"/>`).join('')}
  <path d="M150 34c-26 0-44 18-44 42 0 14 6 24 15 30v14c0 5 4 8 9 8h40c5 0 9-3 9-8v-14c9-6 15-16 15-30 0-24-18-42-44-42z"/></g>
  <g fill="#0b0b0d"><ellipse cx="134" cy="80" rx="11" ry="12"/><ellipse cx="166" cy="80" rx="11" ry="12"/><path d="M150 94l-6 12h12z"/>
  <rect x="133" y="114" width="3" height="13" rx="1"/><rect x="142" y="115" width="3" height="13" rx="1"/><rect x="155" y="115" width="3" height="13" rx="1"/><rect x="164" y="114" width="3" height="13" rx="1"/></g>`)

export const BANDIERE = [
  { id: 'cina', nome: 'Cina', svg: svg(30, 20, `<rect width="30" height="20" fill="#EE1C25"/><path fill="#FFFF00" d="${stella(5, 5, 3)}${[[10, 2], [12, 4], [12, 7], [10, 9]].map(([x, y]) => stella(x, y, 1, Math.atan2(5 - y, 5 - x) * 180 / Math.PI)).join('')}"/>`) },
  { id: 'italia', nome: 'Italia', svg: tre(3, 2, ['#009246', '#F1F2F1', '#CE2B37'], true) },
  { id: 'usa', nome: 'Stati Uniti', svg: usa() },
  { id: 'giappone', nome: 'Giappone', svg: svg(900, 600, '<rect width="900" height="600" fill="#fff"/><circle cx="450" cy="300" r="180" fill="#BC002D"/>') },
  { id: 'uk', nome: 'Regno Unito', svg: svg(60, 30, '<clipPath id="s"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="t"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#s)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g>') },
  { id: 'corea', nome: 'Corea del Sud', svg: corea() },
  { id: 'francia', nome: 'Francia', svg: tre(3, 2, ['#0055A4', '#FFFFFF', '#EF4135'], true) },
  { id: 'germania', nome: 'Germania', svg: tre(5, 3, ['#000000', '#DD0000', '#FFCE00']) },
  { id: 'spagna', nome: 'Spagna', svg: svg(3, 2, '<rect width="3" height="2" fill="#AA151B"/><rect y="0.5" width="3" height="1" fill="#F1BF00"/>') },
  { id: 'russia', nome: 'Russia', svg: tre(3, 2, ['#FFFFFF', '#0039A6', '#D52B1E']) },
  { id: 'ucraina', nome: 'Ucraina', svg: svg(3, 2, '<rect width="3" height="1" fill="#0057B7"/><rect y="1" width="3" height="1" fill="#FFD700"/>') },
  { id: 'india', nome: 'India', svg: india() },
  { id: 'vietnam', nome: 'Vietnam', svg: svg(30, 20, `<rect width="30" height="20" fill="#DA251D"/><path fill="#FFFF00" d="${stella(15, 10, 6)}"/>`) },
  { id: 'svizzera', nome: 'Svizzera', svg: svg(32, 32, '<rect width="32" height="32" fill="#DA291C"/><path fill="#fff" d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z"/>') },
  { id: 'svezia', nome: 'Svezia', svg: nordica(16, 10, '#006AA7', [['#FECC00', 5, 4, 2]]) },
  { id: 'norvegia', nome: 'Norvegia', svg: nordica(22, 16, '#BA0C2F', [['#FFFFFF', 6, 6, 4], ['#00205B', 7, 7, 2]]) },
  { id: 'danimarca', nome: 'Danimarca', svg: nordica(37, 28, '#C8102E', [['#FFFFFF', 12, 12, 4]]) },
  { id: 'finlandia', nome: 'Finlandia', svg: nordica(18, 11, '#FFFFFF', [['#002F6C', 5, 4, 3]]) },
  { id: 'grecia', nome: 'Grecia', svg: svg(27, 18, `<rect width="27" height="18" fill="#fff"/>${[0, 4, 8, 12, 16].map((y) => `<rect y="${y}" width="27" height="2" fill="#0D5EAF"/>`).join('')}<rect width="10" height="10" fill="#0D5EAF"/><path fill="#fff" d="M4 0h2v10H4zM0 4h10v2H0z"/>`) },
  { id: 'turchia', nome: 'Turchia', svg: svg(90000, 60000, '<path fill="#E30A17" d="M0-30000h90000v60000H0z"/><path fill="#fff" d="M41750 0l13568-4408-8386 11541V-7133l8386 11541zm925 8021a15000 15000 0 1 1 0-16042 12000 12000 0 1 0 0 16042z"/>', '0 -30000 90000 60000') },
  { id: 'olanda', nome: 'Paesi Bassi', svg: tre(3, 2, ['#AE1C28', '#FFFFFF', '#21468B']) },
  { id: 'belgio', nome: 'Belgio', svg: tre(15, 13, ['#000000', '#FDDA24', '#EF3340'], true) },
  { id: 'irlanda', nome: 'Irlanda', svg: tre(2, 1, ['#169B62', '#FFFFFF', '#FF883E'], true) },
  { id: 'austria', nome: 'Austria', svg: tre(3, 2, ['#C8102E', '#FFFFFF', '#C8102E']) },
  { id: 'polonia', nome: 'Polonia', svg: svg(8, 5, '<rect width="8" height="2.5" fill="#fff"/><rect y="2.5" width="8" height="2.5" fill="#DC143C"/>') },
  { id: 'inghilterra', nome: 'Inghilterra', svg: svg(50, 30, '<rect width="50" height="30" fill="#fff"/><path fill="#CE1124" d="M22 0h6v30h-6zM0 12h50v6H0z"/>') },
  { id: 'scozia', nome: 'Scozia', svg: svg(50, 30, '<clipPath id="s"><path d="M0 0h50v30H0z"/></clipPath><rect width="50" height="30" fill="#005EB8"/><path clip-path="url(#s)" d="M0 0l50 30M50 0L0 30" stroke="#fff" stroke-width="6"/>') },
  { id: 'giamaica', nome: 'Giamaica', svg: svg(12, 6, '<rect width="12" height="6" fill="#009B3A"/><path d="M0 0l6 3-6 3zm12 0L6 3l6 3z"/><path d="M0 0l12 6M0 6l12-6" stroke="#FED100" stroke-width="1"/>') },
  { id: 'cuba', nome: 'Cuba', svg: svg(30, 15, `<rect width="30" height="15" fill="#002A8F"/><path fill="#fff" d="M0 3h30v3H0zM0 9h30v3H0z"/><path fill="#CF142B" d="M0 0v15l12.99-7.5z"/><path fill="#fff" d="${stella(4.33, 7.5, 2.25)}"/>`) },
  { id: 'cile', nome: 'Cile', svg: svg(6, 4, `<rect width="6" height="2" fill="#fff"/><rect y="2" width="6" height="2" fill="#D52B1E"/><rect width="2" height="2" fill="#0039A6"/><path fill="#fff" d="${stella(1, 1, 0.5)}"/>`) },
  { id: 'ue', nome: 'Unione Europea', svg: svg(810, 540, `<rect width="810" height="540" fill="#003399"/><path fill="#FFCC00" d="${Array.from({ length: 12 }, (_, i) => stella(405 + 180 * Math.sin(i * Math.PI / 6), 270 - 180 * Math.cos(i * Math.PI / 6), 30)).join('')}"/>`) },
  { id: 'pace', nome: 'Pace', svg: (() => { const c = ['#6D2C91', '#2E3192', '#00A0E3', '#3AAA35', '#FFDE00', '#F39200', '#E30613']; return svg(150, 100, `${c.map((x, i) => `<rect y="${(i * 100 / 7).toFixed(3)}" width="150" height="${(100 / 7 + 0.05).toFixed(3)}" fill="${x}"/>`).join('')}<text x="75" y="50" dy="0.35em" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="25" letter-spacing="1" fill="#fff">PACE</text>`) })() },
  { id: 'arcobaleno', nome: 'Arcobaleno', svg: strisce(3, 2, ['#E40303', '#FF8C00', '#FFED00', '#008026', '#24408E', '#732982']) },
  { id: 'pirati', nome: 'Pirati', svg: pirati() },
  { id: 'scacchi', nome: 'A scacchi', svg: svg(12, 8, `<rect width="12" height="8" fill="#fff"/><path fill="#111" d="${Array.from({ length: 96 }, (_, k) => [k % 12, Math.floor(k / 12)]).filter(([x, y]) => (x + y) % 2).map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')}"/>`) },
]
for (const b of BANDIERE) { const m = b.svg.match(/width="([\d.]+)" height="([\d.]+)">/); b.r = +m[1] / +m[2] } // larga / alta
export const PRIMA = BANDIERE[0].id
export const bandieraDi = (id) => BANDIERE.find((b) => b.id === id) ?? BANDIERE[0]
// l'SVG come indirizzo, per un'immagine (miniature e tessuto)
export const svgUrl = (b) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(b.svg)}`
