// «Dove vivo» · la luce vera: il sole e la luna per la pianura padana (lat. 45,2 · lon. 10,7, generiche: restano qui),
// la stagione degli alberi e la tavolozza della scena per un'ora e un meteo. Nessun motore qui dentro: solo numeri.
// Direzioni in metri locali: x est, y in alto, z nord.
const RAD = Math.PI / 180
const LAT = 45.2 * RAD, LON = 10.7

// il sole: giorno dell'anno, declinazione, equazione del tempo, angolo orario → altezza e azimut (da nord, verso est)
export function posSole(d) {
  const inizio = new Date(d.getFullYear(), 0, 0)
  const n = Math.floor((d - inizio) / 86400000)
  const B = (2 * Math.PI * (n - 81)) / 364
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
  const fuso = -d.getTimezoneOffset() / 60
  const solare = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600 + (LON - 15 * fuso) / 15 + eot / 60
  const H = (solare - 12) * 15 * RAD
  const dec = 23.44 * RAD * Math.sin((2 * Math.PI * (284 + n)) / 365)
  const alt = Math.asin(Math.sin(LAT) * Math.sin(dec) + Math.cos(LAT) * Math.cos(dec) * Math.cos(H))
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(LAT) - Math.sin(LAT) * Math.cos(H))
  return { alt, az, dir: [Math.sin(az) * Math.cos(alt), Math.sin(alt), Math.cos(az) * Math.cos(alt)], n }
}

// la luna: la fase vera (0 nuova, 0,5 piena) e il posto, in ritardo sul sole di 24 h 50' per ogni giorno di fase
export function posLuna(d) {
  let f = ((d - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 / 29.530588853) % 1
  if (f < 0) f += 1
  const s = posSole(new Date(d - f * 24.84 * 3600e3))
  return { fase: f, alt: s.alt, az: s.az, dir: s.dir, luce: (1 - Math.cos(f * 2 * Math.PI)) / 2 }
}

// la stagione degli alberi a foglia caduca: quante foglie restano e quanto sono gialle
export function stagione(d) {
  const inizio = new Date(d.getFullYear(), 0, 0)
  const g = (d - inizio) / 86400000
  const tra = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)))
  let foglie, giallo, verdino = 0
  if (g < 75) { foglie = 0; giallo = 1 }
  else if (g < 120) { foglie = tra(75, 120, g); giallo = 0; verdino = 1 - tra(95, 130, g) }
  else if (g < 262) { foglie = 1; giallo = tra(225, 262, g) * 0.15; verdino = Math.max(0, 1 - tra(120, 140, g)) }
  else if (g < 305) { foglie = 1 - tra(262, 305, g) * 0.25; giallo = 0.15 + tra(262, 305, g) * 0.55 }
  else if (g < 340) { foglie = 0.75 - tra(305, 340, g) * 0.42; giallo = 0.7 + tra(305, 340, g) * 0.3 }
  else { foglie = Math.max(0, 0.33 - tra(340, 362, g) * 0.3); giallo = 1 }
  return { giorno: g, foglie, giallo, verdino, inverno: g < 75 || g > 330 }
}

const mix = (a, b, t) => { t = Math.max(0, Math.min(1, t)); return a.map((v, i) => v + (b[i] - v) * t) }
const HEX = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]
// i colori del cielo a seconda dell'altezza del sole (gradi): [zenit, orizzonte, foschia]
const CIELI = [
  [-90, [0x03050c, 0x0b1124, 0x0d1220]], [-14, [0x050817, 0x111a33, 0x121a2b]], [-8, [0x0d1636, 0x2c3460, 0x2a3150]],
  [-3, [0x1f2f66, 0x8a6a8c, 0x6d5d77]], [0, [0x34579a, 0xe39a72, 0xb98a7c]], [4, [0x4b79bd, 0xf3c08e, 0xd9b9a0]],
  [12, [0x3f7cc9, 0xc9dcec, 0xc6d4dc]], [30, [0x2f6cc4, 0xb3d1ee, 0xc2d3df]], [90, [0x2a62b8, 0xa9cbeb, 0xbfd0dc]],
]
function cieloA(gradi) {
  let i = CIELI.findIndex(([a]) => a > gradi)
  if (i <= 0) i = i === 0 ? 1 : CIELI.length - 1
  const [a0, c0] = CIELI[i - 1], [a1, c1] = CIELI[i], k = Math.max(0, Math.min(1, (gradi - a0) / (a1 - a0)))
  return c0.map((c, j) => mix(HEX(c), HEX(c1[j]), k))
}

// quanto copre ogni tempo: nuvole, pioggia, nebbia
const METEO = {
  sole: { nuvole: 0.08, pioggia: 0, neve: 0, nebbia: 0, lampi: 0 },
  luna: { nuvole: 0.08, pioggia: 0, neve: 0, nebbia: 0, lampi: 0 },
  nuvolo: { nuvole: 0.45, pioggia: 0, neve: 0, nebbia: 0, lampi: 0 },
  nuvole: { nuvole: 0.86, pioggia: 0, neve: 0, nebbia: 0.1, lampi: 0 },
  nebbia: { nuvole: 0.7, pioggia: 0, neve: 0, nebbia: 1, lampi: 0 },
  pioggia: { nuvole: 0.95, pioggia: 1, neve: 0, nebbia: 0.25, lampi: 0 },
  neve: { nuvole: 0.92, pioggia: 0, neve: 1, nebbia: 0.3, lampi: 0 },
  temporale: { nuvole: 1, pioggia: 1.4, neve: 0, nebbia: 0.2, lampi: 1 },
}

// tutta la luce della scena a una certa ora e con un certo meteo
export function tavolozza(ora, meteo = null) {
  const s = posSole(ora), l = posLuna(ora)
  const icona = METEO[meteo?.icona] ? meteo.icona : 'sole'
  const m = METEO[icona]
  const gradi = Math.max(-15, Math.min(40, +(meteo?.gradi ?? 12)))
  const vento = Math.max(0, Math.min(90, +(meteo?.vento ?? 8)))
  const altG = s.alt / RAD
  let [zenit, orizzonte, foschia] = cieloA(altG)
  // coperto: il cielo si spegne verso un grigio che ha la luminosità del momento
  const luma = (c) => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15
  const grigio = (c, k) => mix(c, [luma(c) * 0.97, luma(c) * 0.99, luma(c) * 1.03], k)
  const kg = m.nuvole * 0.85
  zenit = grigio(zenit, kg); orizzonte = grigio(orizzonte, kg); foschia = grigio(foschia, Math.min(1, kg + m.nebbia * 0.3))
  if (m.nuvole > 0.6) { const scuro = 1 - (m.nuvole - 0.6) * 0.55; zenit = zenit.map((v) => v * scuro); orizzonte = orizzonte.map((v) => v * (0.94 + scuro * 0.06)) }
  // il sole: colore caldo vicino all'orizzonte, bianco in alto; sotto l'orizzonte la luce la fa la luna
  const giorno = Math.max(0, Math.min(1, (altG + 2) / 8))
  const calore = Math.max(0, Math.min(1, 1 - (altG - 2) / 22))
  const coloreSole = mix([1, 0.96, 0.9], [1, 0.62, 0.36], calore)
  const coperto = 1 - m.nuvole * 0.82
  const intensitaSole = Math.pow(Math.max(0, Math.sin(s.alt)), 0.55) * 7.5 * coperto * giorno
  const lunaSu = l.alt > 0.02
  const intensitaLuna = lunaSu ? (0.05 + 0.3 * l.luce) * (1 - m.nuvole * 0.75) * (1 - giorno) : 0
  const usaLuna = giorno < 0.05
  const dirLuce = usaLuna ? (lunaSu ? l.dir : [-0.35, 0.8, -0.48]) : s.dir
  const lungo = Math.hypot(...dirLuce)
  // il cielo che riempie le ombre (emisfero): dal colore del cielo, più forte di giorno
  const notte = altG < -6
  const buio = Math.max(0, Math.min(1, (-altG - 2) / 8)) // 0 di giorno, 1 a notte fatta
  let cieloLuce = mix(zenit, orizzonte, 0.45)
  cieloLuce = mix(cieloLuce, [luma(cieloLuce), luma(cieloLuce), luma(cieloLuce)], 0.35) // (meno blu nelle ombre)
  cieloLuce = mix(cieloLuce, [0.36, 0.45, 0.7], buio)
  const crepuscolo = Math.max(0, Math.min(1, 1 - Math.abs(altG - 1) / 9))
  return {
    sole: s, luna: l, icona, gradi, vento, notte, giorno, crepuscolo,
    nuvole: m.nuvole, pioggia: m.pioggia, neve: m.neve, nebbia: m.nebbia, lampi: m.lampi,
    dirLuce: dirLuce.map((v) => v / lungo),
    coloreLuce: usaLuna ? [0.62, 0.72, 0.95] : coloreSole,
    intensitaLuce: usaLuna ? intensitaLuna : intensitaSole,
    zenit, orizzonte, foschia,
    cieloLuce,
    terraLuce: mix([0.17, 0.15, 0.1], [0.3, 0.3, 0.24], giorno),
    intensitaCielo: (1.05 + giorno * 0.55 + m.nuvole * 0.35 * giorno) * (1 - buio * 0.25),
    esposizione: 1.55 + (1 - giorno) * 0.6 + buio * 0.35 + m.nuvole * 0.15 + Math.max(0, Math.min(1, 1 - Math.abs(altG - 4) / 8)) * 0.35,
    // la nebbia: quanto si vede lontano (metri)
    visibilita: m.nebbia >= 1 ? 170 : m.pioggia > 0 ? 650 : m.neve ? 520 : m.nebbia > 0 ? 1200 : 2600,
    finestre: Math.max(0, Math.min(1, 1 - (altG + 1) / 7)),
    stelle: Math.max(0, Math.min(1, (-altG - 7) / 6)) * (1 - m.nuvole),
  }
}
