// 08 · Meteo vivo. Il meteo vero di Mantova dalla funzione /api/meteo/ (Open-Meteo,
// in cache dieci minuti sul server): temperatura, vento, pioggia delle ultime ore
// e un disegno che cambia con il codice WMO. Se il ponte non risponde, lo dice.
import { esc } from '../utils.js'

const T = {
  it: {
    nota: 'Il meteo vero di Mantova, da Open-Meteo attraverso /api/meteo/. La funzione tiene la risposta in cache dieci minuti: il servizio non vede ogni visita.',
    vento: 'vento',
    pioggia: 'pioggia 12 h',
    neve: 'neve',
    visibilita: 'visibilità',
    adesso: 'adesso',
    nonRisponde: 'il meteo non risponde',
    pronta: 'Open-Meteo',
    attesa: 'guardo fuori…',
    gradi: '°C',
    kmh: 'km/h',
    mm: 'mm',
    m: 'm',
  },
  en: {
    nota: 'The real weather in Mantova, from Open-Meteo through /api/meteo/. The function caches the answer for ten minutes: the service does not see every visit.',
    vento: 'wind',
    pioggia: 'rain 12 h',
    neve: 'snow',
    visibilita: 'visibility',
    adesso: 'now',
    nonRisponde: 'weather is not answering',
    pronta: 'Open-Meteo',
    attesa: 'looking outside…',
    gradi: '°C',
    kmh: 'km/h',
    mm: 'mm',
    m: 'm',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]

const CODICI = {
  0: ['sereno', 'clear'], 1: ['quasi sereno', 'mostly clear'], 2: ['poco nuvoloso', 'partly cloudy'], 3: ['nuvoloso', 'cloudy'],
  45: ['nebbia', 'fog'], 48: ['nebbia ghiacciata', 'freezing fog'],
  51: ['pioviggine', 'drizzle'], 53: ['pioviggine', 'drizzle'], 55: ['pioviggine forte', 'heavy drizzle'],
  56: ['pioviggine ghiacciata', 'freezing drizzle'], 57: ['pioviggine ghiacciata', 'freezing drizzle'],
  61: ['pioggia', 'rain'], 63: ['pioggia', 'rain'], 65: ['pioggia forte', 'heavy rain'],
  66: ['pioggia ghiacciata', 'freezing rain'], 67: ['pioggia ghiacciata', 'freezing rain'],
  71: ['neve', 'snow'], 73: ['neve', 'snow'], 75: ['neve forte', 'heavy snow'], 77: ['granelli di neve', 'snow grains'],
  80: ['rovesci', 'showers'], 81: ['rovesci', 'showers'], 82: ['rovesci forti', 'heavy showers'],
  85: ['rovesci di neve', 'snow showers'], 86: ['rovesci di neve', 'snow showers'],
  95: ['temporale', 'thunderstorm'], 96: ['temporale con grandine', 'thunderstorm with hail'], 99: ['temporale con grandine', 'thunderstorm with hail'],
}
const famiglia = (c) => (c === 0 || c === 1 ? 'sereno' : c === 2 ? 'poco' : c === 3 ? 'nuvoloso' : [45, 48].includes(c) ? 'nebbia' : [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(c) ? 'pioggia' : [71, 73, 75, 77, 85, 86].includes(c) ? 'neve' : [95, 96, 99].includes(c) ? 'temporale' : 'nuvoloso')
const etichetta = (c, lang) => (CODICI[c] ? CODICI[c][lang === 'it' ? 0 : 1] : '—')

function icona(f) {
  const sole = `<circle cx="32" cy="30" r="12" fill="#ffd166"/>${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return `<line x1="${(32 + Math.cos(a) * 18).toFixed(1)}" y1="${(30 + Math.sin(a) * 18).toFixed(1)}" x2="${(32 + Math.cos(a) * 24).toFixed(1)}" y2="${(30 + Math.sin(a) * 24).toFixed(1)}" stroke="#ffd166" stroke-width="3" stroke-linecap="round"/>`
  }).join('')}`
  const nuvola = `<path d="M17 46h30a9 9 0 0 0 1-17.9A15 15 0 0 0 19 31a9 9 0 0 0-2 15z" fill="#d8e2f0"/><path d="M17 46h30a9 9 0 0 0 1-17.9A15 15 0 0 0 19 31a9 9 0 0 0-2 15z" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>`
  if (f === 'sereno') return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${sole}</svg>`
  if (f === 'poco') return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true"><g transform="translate(-7 -6) scale(.8)">${sole}</g>${nuvola}</svg>`
  if (f === 'nebbia') return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${nuvola}<g stroke="#d8e2f0" stroke-width="3" stroke-linecap="round" opacity=".8"><line x1="18" y1="52" x2="46" y2="52"/><line x1="22" y1="58" x2="42" y2="58"/></g></svg>`
  if (f === 'pioggia') return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${nuvola}<g stroke="#78b7ff" stroke-width="3" stroke-linecap="round"><line x1="22" y1="50" x2="19" y2="58"/><line x1="32" y1="50" x2="29" y2="58"/><line x1="42" y1="50" x2="39" y2="58"/></g></svg>`
  if (f === 'neve') return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${nuvola}<g stroke="#dff4ff" stroke-width="2.4" stroke-linecap="round"><path d="M22 51v6M19 54h6M35 51v6M32 54h6M46 51v6M43 54h6"/></g></svg>`
  if (f === 'temporale') return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${nuvola}<path d="M34 46l-7 10h6l-3 8 10-12h-6l3-6z" fill="#ffd166"/></svg>`
  return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${nuvola}</svg>`
}

export default {
  id: 'meteo',
  titolo: { it: 'Meteo vivo', en: 'Live weather' },
  testo: {
    it: 'Che tempo fa davvero a Mantova adesso: temperatura, vento, pioggia delle ultime dodici ore e un disegno che cambia col codice del tempo.',
    en: 'The actual weather in Mantova right now: temperature, wind, rain over the last twelve hours and a drawing that changes with the weather code.',
  },
  tecnologie: ['Fetch', '/api/meteo', 'Open-Meteo'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-meteo" data-meteo="attesa">
      <div class="lab-meteo__icona" data-icona></div>
      <div class="lab-meteo__testo"><b data-gradi>—</b><span data-cielo>${esc(t(lang, 'attesa'))}</span><small data-luogo>Mantova · ${esc(t(lang, 'adesso'))}</small></div>
      <div class="lab-meteo__numeri">
        <span><b data-vento>—</b><small>${esc(t(lang, 'vento'))}</small></span>
        <span><b data-pioggia>—</b><small>${esc(t(lang, 'pioggia'))}</small></span>
        <span><b data-visibilita>—</b><small>${esc(t(lang, 'visibilita'))}</small></span>
      </div>
    </div>
    <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const box = el.querySelector('[data-meteo]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let ultimo = 0, inCorso = false, vivo = true

    async function chiedi(forza = false) {
      if (!vivo || inCorso) return
      if (!forza && Date.now() - ultimo < 9 * 60_000) return
      inCorso = true
      try {
        const r = await fetch('/api/meteo/', { headers: { accept: 'application/json' }, cache: 'no-store' })
        if (!r.ok) throw new Error(`meteo ${r.status}`)
        const d = await r.json()
        if (!vivo) return
        const f = famiglia(d.codice)
        box.dataset.meteo = f
        el.querySelector('[data-icona]').innerHTML = icona(f)
        el.querySelector('[data-gradi]').textContent = Number.isFinite(d.temperatura) ? `${Math.round(d.temperatura)}${t(lang, 'gradi')}` : '—'
        el.querySelector('[data-cielo]').textContent = etichetta(d.codice, lang)
        el.querySelector('[data-vento]').textContent = Number.isFinite(d.vento) ? `${Math.round(d.vento)} ${t(lang, 'kmh')}` : '—'
        el.querySelector('[data-pioggia]').textContent = Number.isFinite(d.pioggia12) ? `${d.pioggia12} ${t(lang, 'mm')}` : '—'
        el.querySelector('[data-visibilita]').textContent = Number.isFinite(d.visibilita) ? `${Math.round(d.visibilita / 1000)} km` : '—'
        api.stato(stato, t(lang, 'pronta'), 'ok')
        ultimo = Date.now()
      } catch (e) {
        console.warn('meteo lab:', e)
        if (vivo) {
          box.dataset.meteo = 'attesa'
          el.querySelector('[data-cielo]').textContent = t(lang, 'nonRisponde')
          api.stato(stato, t(lang, 'nonRisponde'), 'no')
        }
      } finally {
        inCorso = false
      }
    }
    chiedi(true)
    const timer = setInterval(() => { if (!document.hidden) chiedi() }, 10 * 60_000)
    const vis = () => { if (!document.hidden) chiedi() }
    document.addEventListener('visibilitychange', vis)
    return () => { vivo = false; clearInterval(timer); document.removeEventListener('visibilitychange', vis) }
  },
}
