// 07 · Orologio solare. Alba, tramonto, mezzogiorno e altezza del sole sopra
// Mantova, calcolati con la formula NOAA: niente API, niente geolocalizzazione.
// Il disegno è un SVG che si ridisegna ogni minuto.
import { esc } from '../utils.js'
import { calcola } from './sole-math.js'

const T = {
  it: {
    titolo: 'La luce sopra Mantova',
    nota: 'Calcolata, non guardata fuori dalla finestra: alba, tramonto e altezza del sole con data, latitudine e longitudine. Si aggiorna ogni minuto.',
    alba: 'alba',
    tramonto: 'tramonto',
    mezzogiorno: 'mezzogiorno',
    altezza: 'altezza',
    giorno: 'giorno',
    notte: 'notte',
    sotto: 'sotto l’orizzonte',
    durata: 'durata del giorno',
    adesso: 'adesso',
    pronta: 'calcolato',
  },
  en: {
    titolo: 'The light over Mantova',
    nota: 'Calculated, not looked at out of the window: sunrise, sunset and sun height from date, latitude and longitude. It updates every minute.',
    alba: 'sunrise',
    tramonto: 'sunset',
    mezzogiorno: 'solar noon',
    altezza: 'height',
    giorno: 'day',
    notte: 'night',
    sotto: 'below the horizon',
    durata: 'day length',
    adesso: 'now',
    pronta: 'calculated',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]
const ora = (d) => new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
const durata = (ms) => `${Math.floor(ms / 3600000)}h ${String(Math.round((ms % 3600000) / 60000)).padStart(2, '0')}m`

function disegnaSVG(c, lang, accento) {
  const t0 = Math.max(0, Math.min(1, c.frazione))
  const x = (1 - t0) ** 2 * 40 + 2 * (1 - t0) * t0 * 320 + t0 ** 2 * 600
  const y = (1 - t0) ** 2 * 200 + 2 * (1 - t0) * t0 * 18 + t0 ** 2 * 200
  const basso = c.notte ? '#070812' : c.altezza < 8 ? '#f2a35e' : '#8fd3ff'
  const alto = c.notte ? '#05060f' : c.altezza < 8 ? '#43265c' : '#0d3f78'
  const sole = c.notte
    ? `<g><circle cx="${x.toFixed(1)}" cy="${Math.max(36, y - 6).toFixed(1)}" r="13" fill="#dfe6ff"/><circle cx="${(x - 4).toFixed(1)}" cy="${Math.max(32, y - 10).toFixed(1)}" r="13" fill="${basso}" opacity=".82"/></g>`
    : `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34" fill="url(#alone)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#ffd166"/></g>`
  const stelle = c.notte ? Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 97 + 33) % 620}" cy="${(i * 53 + 17) % 150}" r="${i % 3 ? 1 : 1.5}" fill="#fff" opacity="${0.25 + (i % 5) * 0.12}"/>`).join('') : ''
  return `<svg viewBox="0 0 640 260" width="100%" role="img" aria-label="${esc(t(lang, 'titolo'))}">
    <defs>
      <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${alto}"/><stop offset="1" stop-color="${basso}"/></linearGradient>
      <radialGradient id="alone"><stop offset="0" stop-color="#ffd166" stop-opacity=".5"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="640" height="260" rx="18" fill="url(#cielo)"/>
    ${stelle}
    <path d="M0 200 Q320 180 640 200 V260 H0Z" fill="${c.notte ? '#0d1511' : '#16221a'}"/>
    <path d="M40 200 Q320 18 600 200" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.4" stroke-dasharray="4 7"/>
    <line x1="24" y1="200" x2="616" y2="200" stroke="rgba(255,255,255,.34)" stroke-width="1"/>
    ${sole}
    <g fill="rgba(255,255,255,.82)" font-family="Arial, Helvetica, sans-serif" font-size="13">
      <text x="40" y="226" text-anchor="middle">${ora(c.sorge)}</text>
      <text x="320" y="226" text-anchor="middle" opacity=".7">${ora(c.mezzogiorno)}</text>
      <text x="600" y="226" text-anchor="middle">${ora(c.tramonta)}</text>
      <text x="24" y="34" font-size="12" opacity=".66">${esc(t(lang, 'alba'))}</text>
      <text x="616" y="34" text-anchor="end" font-size="12" opacity=".66">${esc(t(lang, 'tramonto'))}</text>
      <text x="320" y="34" text-anchor="middle" font-size="12" opacity=".66">${esc(t(lang, 'mezzogiorno'))}</text>
    </g>
    <circle cx="${x.toFixed(1)}" cy="${Math.max(30, y).toFixed(1)}" r="4" fill="${esc(accento)}"/>
  </svg>`
}

export default {
  id: 'sole',
  titolo: { it: 'Orologio solare', en: 'Solar clock' },
  testo: {
    it: 'Quanto è alto il sole in questo momento, quando sorge e quando tramonta: un orologio astronomico calcolato per Mantova, senza guardare fuori.',
    en: 'How high the sun is right now, when it rises and sets: an astronomical clock calculated for Mantova, without looking outside.',
  },
  tecnologie: ['SVG', 'Astronomia NOAA', 'Intl.DateTimeFormat'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-sole" data-svg></div>
      <div class="lab-sole__numeri">
        <span><b data-alba>—</b>${esc(t(lang, 'alba'))}</span>
        <span><b data-tramonto>—</b>${esc(t(lang, 'tramonto'))}</span>
        <span><b data-durata>—</b>${esc(t(lang, 'durata'))}</span>
        <span><b data-altezza>—</b>${esc(t(lang, 'altezza'))}</span>
      </div>
      <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const disegna = () => {
      const c = calcola()
      const tema = getComputedStyle(el)
      const accento = tema.getPropertyValue('--p').trim() || '#ccff00'
      el.querySelector('[data-svg]').innerHTML = disegnaSVG(c, lang, accento)
      el.querySelector('[data-alba]').textContent = ora(c.sorge)
      el.querySelector('[data-tramonto]').textContent = ora(c.tramonta)
      el.querySelector('[data-durata]').textContent = durata(c.durata)
      el.querySelector('[data-altezza]').textContent = `${c.altezza.toFixed(1)}°`
      api.stato(stato, c.notte ? t(lang, 'notte') : t(lang, 'giorno'), c.notte ? '' : 'ok')
    }
    disegna()
    const timer = setInterval(() => { if (!document.hidden) disegna() }, 60_000)
    const vis = () => { if (!document.hidden) disegna() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', vis) }
  },
}
