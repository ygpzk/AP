// Luce e cielo della scena: posizione vera del sole per la pianura padana (lat. 45.2, lon. 10.7),
// tavolozze per alba/giorno/tramonto/notte e ritocchi per il meteo. Nessun dato della scena reale:
// latitudine e longitudine sono generiche e restano solo qui dentro.
const RAD = Math.PI / 180

// posizione del sole: giorno dell'anno, declinazione, equazione del tempo, angolo orario
export function sole(ora) {
  const inizio = new Date(ora.getFullYear(), 0, 0)
  const n = Math.floor((ora - inizio) / 86400000)
  const B = (2 * Math.PI * (n - 81)) / 364
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B) // minuti
  const fuso = -ora.getTimezoneOffset() / 60
  const solare = ora.getHours() + ora.getMinutes() / 60 + ora.getSeconds() / 3600 + (10.7 - 15 * fuso) / 15 + EoT / 60
  const H = (solare - 12) * 15 * RAD
  const lat = 45.2 * RAD
  const dec = 23.44 * RAD * Math.sin((2 * Math.PI * (284 + n)) / 365)
  const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H))
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(H))
  const dir = [Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)]
  return { alt, az, dir, n }
}

const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t))
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
const HEX = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255]
const col = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`

// colori: notte → alba → giorno, con la tinta del meteo
const NOTTE = { alto: HEX(0x081321), orizzonte: HEX(0x1a2839), foschia: HEX(0x1d2731), terra: HEX(0x171c17), sole: HEX(0x9db4dd) }
const ALBA = { alto: HEX(0x4d7397), orizzonte: HEX(0xf0b88c), foschia: HEX(0xdcb59c), terra: HEX(0x463a2d), sole: HEX(0xffb173) }
const GIORNO = { alto: HEX(0x7fb4e2), orizzonte: HEX(0xe4ebe8), foschia: HEX(0xdde6e3), terra: HEX(0x8b7c5e), sole: HEX(0xfff3df) }
function tavolozzaCielo(alt) {
  const gradi = alt / RAD
  if (gradi < -6) return { ...NOTTE }
  if (gradi < 4) return { alto: mix(NOTTE.alto, ALBA.alto, (gradi + 6) / 10), orizzonte: mix(NOTTE.orizzonte, ALBA.orizzonte, (gradi + 6) / 10), foschia: mix(NOTTE.foschia, ALBA.foschia, (gradi + 6) / 10), terra: mix(NOTTE.terra, ALBA.terra, (gradi + 6) / 10), sole: mix(NOTTE.sole, ALBA.sole, (gradi + 6) / 10) }
  if (gradi < 16) return { alto: mix(ALBA.alto, GIORNO.alto, (gradi - 4) / 12), orizzonte: mix(ALBA.orizzonte, GIORNO.orizzonte, (gradi - 4) / 12), foschia: mix(ALBA.foschia, GIORNO.foschia, (gradi - 4) / 12), terra: mix(ALBA.terra, GIORNO.terra, (gradi - 4) / 12), sole: mix(ALBA.sole, GIORNO.sole, (gradi - 4) / 12) }
  return { ...GIORNO }
}

// l'intera tavolozza della scena a una certa ora e con un certo meteo
export function tavolozza(ora, meteo = null) {
  const s = sole(ora)
  const c = tavolozzaCielo(s.alt)
  const icona = meteo?.icona ?? 'sole'
  const gradi = Math.max(-5, Math.min(35, +(meteo?.gradi ?? 16)))
  const vento = Math.max(0, Math.min(80, +(meteo?.vento ?? 8)))
  const nuvoloso = icona === 'nuvolo' ? 0.35 : icona === 'nuvole' ? 0.8 : icona === 'nebbia' ? 0.6 : icona === 'pioggia' ? 0.9 : icona === 'neve' ? 0.85 : icona === 'temporale' ? 1 : 0
  // di notte il cielo nuvoloso è più scuro, di giorno più piatto
  const notte = s.alt < 0.02
  const grigio = nuvoloso * (notte ? 0.55 : 0.72)
  const media = (v) => (v[0] + v[1] + v[2]) / 3
  const spegni = (v) => mix(v, [media(v) * 0.92, media(v) * 0.94, media(v) * 0.98], grigio)
  const alto = spegni(c.alto), orizzonte = spegni(c.orizzonte), foschia = spegni(c.foschia)
  const soleC = mix(c.sole, [245, 246, 242], nuvoloso * 0.6)
  const intSole = Math.pow(Math.max(0, Math.sin(s.alt)), 0.7) * 4.2 * (1 - nuvoloso * 0.52)
  const luna = s.alt < 0.02
  const dirLuce = luna ? [-s.dir[0] * 0.8 + 0.15, Math.abs(s.dir[1]) * 0.7 + 0.35, -s.dir[2] * 0.8 - 0.1] : s.dir
  const l = Math.hypot(...dirLuce)
  const dir = dirLuce.map((v) => v / l)
  const visibilita = icona === 'nebbia' ? 190 : icona === 'pioggia' ? 400 : icona === 'temporale' ? 320 : icona === 'neve' ? 300 : 1050
  return {
    sole: s, notte, icona, gradi, vento,
    nuvolosita: nuvoloso,
    dirLuce: dir,
    coloreSole: col(luna ? [150, 172, 215] : soleC),
    intensitaSole: luna ? 0.35 + (1 - nuvoloso) * 0.1 : intSole,
    emisfero: {
      cielo: col(mix(alto, orizzonte, 0.35)),
      terra: col(spegni(c.terra)),
      intensita: notte ? 1.35 : 1.5 - nuvoloso * 0.18,
    },
    cielo: { alto: col(alto), orizzonte: col(orizzonte), foschia: col(foschia), notte: luna ? 1 : 0 },
    nebbia: { colore: col(foschia), vicino: visibilita * 0.5, lontano: visibilita },
    esposizione: notte ? 1.12 : meteo?.icona === 'temporale' ? 0.9 : 1.22,
    finestre: s.alt < 0.04 ? 1 : 0,
    neve: icona === 'neve' ? 1 : 0,
  }
}
