// Il sole sopra Mantova, calcolato (NOAA, formula compatta). Non serve un
// servizio meteo: data, latitudine e longitudine bastano. Le ore tornano in
// Europe/Rome, ora legale compresa.
const RAD = Math.PI / 180
const LAT = 45.1564, LON = 10.7914 // Mantova, la stessa dei muri e del meteo

const partiRoma = (d) => {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day }
}

export function calcola(adesso = new Date()) {
  const { y, m, d } = partiRoma(adesso)
  const inizio = Date.UTC(y, 0, 1)
  const giorno = Math.floor((Date.UTC(y, m - 1, d) - inizio) / 864e5) + 1
  const g = (2 * Math.PI / 365) * (giorno - 1 + 0.5)
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const lat = LAT * RAD
  const cosHa = Math.cos(90.833 * RAD) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)
  const ha = Math.acos(Math.max(-1, Math.min(1, cosHa))) / RAD
  const mezzogiorno = 720 - 4 * LON - eq
  const sorge = mezzogiorno - 4 * ha
  const tramonta = mezzogiorno + 4 * ha
  const base = Date.UTC(y, m - 1, d)
  const aData = (min) => new Date(base + min * 60000)
  const utc = adesso.getUTCHours() * 60 + adesso.getUTCMinutes() + adesso.getUTCSeconds() / 60
  const tst = utc + eq + 4 * LON
  const angolo = (tst / 4 - 180) * RAD
  const zenit = Math.acos(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(angolo)) / RAD
  const altezza = 90 - zenit
  const notte = altezza < -0.833
  const oreSorge = 12 - ha / 15
  const frazione = Math.max(0, Math.min(1, (tst / 4 - oreSorge) / (2 * ha / 15)))
  return {
    giorno,
    sorge: aData(sorge),
    tramonta: aData(tramonta),
    mezzogiorno: aData(mezzogiorno),
    altezza,
    frazione,
    durata: (tramonta - sorge) * 60000,
    notte,
    adesso,
  }
}

export const LATITUDINE = LAT
export const LONGITUDINE = LON
